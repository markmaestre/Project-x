// src/routes/jobRoutes.js
import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Job from "../models/Job.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";
import Application from "../models/Application.js";
import SavedJob from "../models/SavedJob.js";
import { upload } from "../config/cloudinary.js";
import { 
  sendNewJobNotification, 
  sendJobPostedConfirmation,
  sendBulkJobNotifications 
} from "../services/emailService.js";
import NotificationService from "../services/notificationService.js";

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================

const parseJSONField = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

const parseArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return field.split(",").map(s => s.trim()).filter(s => s);
    }
  }
  return [];
};

const checkJobOwnership = async (jobId, clientId) => {
  const job = await Job.findById(jobId);
  if (!job) return { error: "Job not found", status: 404 };
  if (job.client_id.toString() !== clientId.toString()) {
    return { error: "Unauthorized: You do not own this job", status: 403 };
  }
  return { job };
};

const calculateProfileInsights = async (job, freelancerId) => {
  const freelancer = await Freelancer.findById(freelancerId);
  if (!freelancer) return null;

  const freelancerSkills = freelancer.skills || [];
  const jobSkills = job.required_skills || [];
  
  const matchingSkills = freelancerSkills.filter(skill => 
    jobSkills.some(jobSkill => jobSkill.toLowerCase() === skill.toLowerCase())
  );
  
  const missingSkills = jobSkills.filter(jobSkill =>
    !freelancerSkills.some(skill => skill.toLowerCase() === jobSkill.toLowerCase())
  );
  
  const skillMatchPercentage = jobSkills.length > 0 
    ? (matchingSkills.length / jobSkills.length) * 100 
    : 100;

  const freelancerYears = freelancer.years_of_experience || 0;
  const requiredYears = job.requirements?.min_years || 0;
  const experienceMatchPercentage = requiredYears > 0 
    ? Math.min((freelancerYears / requiredYears) * 100, 100)
    : 100;
  const isExperienceSufficient = freelancerYears >= requiredYears;

  const freelancerEducation = freelancer.education || [];
  const requiredEducation = job.requirements?.education || 'none';
  
  const degreeLevels = {
    'none': 0,
    'high_school': 1,
    'vocational': 2,
    'college': 3,
    'masters': 4,
    'doctorate': 5
  };
  
  const hasRequiredDegree = freelancerEducation.some(edu => 
    degreeLevels[edu.level?.toLowerCase()] >= degreeLevels[requiredEducation]
  );
  
  let educationMatchPercentage = 0;
  if (requiredEducation === 'none') {
    educationMatchPercentage = 100;
  } else if (hasRequiredDegree) {
    educationMatchPercentage = 100;
  } else {
    educationMatchPercentage = 0;
  }

  let locationMatchPercentage = 100;
  let locationMessage = "";
  
  if (job.work_setup === 'onsite') {
    const freelancerLocation = freelancer.location || {};
    const jobLocation = job.location || {};
    
    if (jobLocation.city && freelancerLocation.city) {
      if (freelancerLocation.city.toLowerCase().includes(jobLocation.city.toLowerCase()) ||
          jobLocation.city.toLowerCase().includes(freelancerLocation.city.toLowerCase())) {
        locationMatchPercentage = 100;
        locationMessage = `You are located in/near ${jobLocation.city}`;
      } else {
        locationMatchPercentage = 30;
        locationMessage = `This job requires working in ${jobLocation.city}. Consider relocation or discuss remote options.`;
      }
    } else {
      locationMatchPercentage = 50;
      locationMessage = "Onsite position - please confirm your location during application";
    }
  } else if (job.work_setup === 'hybrid') {
    locationMatchPercentage = 80;
    locationMessage = "Hybrid position - some onsite days required";
  } else {
    locationMessage = "Remote position - work from anywhere";
  }

  const overallMatchPercentage = Math.round(
    (skillMatchPercentage * 0.4) +
    (experienceMatchPercentage * 0.25) +
    (educationMatchPercentage * 0.2) +
    (locationMatchPercentage * 0.15)
  );

  return {
    overall_match_percentage: overallMatchPercentage,
    skill_match: {
      match_percentage: Math.round(skillMatchPercentage),
      matching_skills: matchingSkills,
      missing_skills: missingSkills,
      total_required_skills: jobSkills.length,
      total_matching: matchingSkills.length
    },
    experience_match: {
      match_percentage: Math.round(experienceMatchPercentage),
      freelancer_years: freelancerYears,
      required_years: requiredYears,
      is_sufficient: isExperienceSufficient,
      recommendation: isExperienceSufficient 
        ? "Your experience meets the requirements"
        : `You need ${requiredYears - freelancerYears} more years of experience`
    },
    education_match: {
      match_percentage: Math.round(educationMatchPercentage),
      freelancer_education: freelancerEducation,
      required_education: requiredEducation,
      has_required_degree: hasRequiredDegree,
      recommendation: hasRequiredDegree 
        ? "Your education meets the requirements"
        : `This job requires a ${requiredEducation} degree`
    },
    location_match: {
      match_percentage: Math.round(locationMatchPercentage),
      job_location: {
        city: job.location?.city,
        province: job.location?.province,
        country: job.location?.country,
        work_setup: job.work_setup
      },
      message: locationMessage,
      recommendation: locationMatchPercentage >= 80 
        ? "Location requirements are compatible"
        : "Consider discussing location flexibility with the client"
    },
    overall_recommendation: overallMatchPercentage >= 80 
      ? "Strong match! You are highly qualified for this position."
      : overallMatchPercentage >= 60
      ? "Good match! You meet most requirements."
      : overallMatchPercentage >= 40
      ? "Partial match - Consider highlighting your relevant skills in the application."
      : "Low match - You may want to focus on other opportunities."
  };
};

// ==================== CLIENT ROUTES ====================

// Create a new job posting (Client only) - WITH EMAIL NOTIFICATIONS
router.post("/jobs", authMiddleware, upload.none(), async (req, res) => {
  try {
    console.log("=== CREATE JOB REQUEST ===");
    console.log("Request body:", req.body);
    console.log("User from auth:", req.user);

    if (req.user.role !== "client") {
      return res.status(403).json({ 
        message: "Only clients can create job postings" 
      });
    }

    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Parse and validate required fields
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const category = req.body.category?.trim();
    const subcategory = req.body.subcategory?.trim() || null;
    const required_skills = parseArrayField(req.body.required_skills);
    const tags = parseArrayField(req.body.tags);
    const job_type = req.body.job_type || "project";
    const work_setup = req.body.work_setup || "remote";
    const experience_level = req.body.experience_level || "entry";
    const vacancies = req.body.vacancies ? parseInt(req.body.vacancies) : 1;
    const timezone = req.body.timezone || "Asia/Manila";
    const contact_preference = req.body.contact_preference || "chat";
    
    // ===== BUDGET FIELDS =====
    const budgetType = req.body.budget_type || "fixed";
    const budgetMin = req.body.budget_min ? parseFloat(req.body.budget_min) : null;
    const budgetMax = req.body.budget_max ? parseFloat(req.body.budget_max) : null;
    const budgetCurrency = req.body.budget_currency || "PHP";
    const budgetNegotiable = req.body.budget_negotiable === 'true' || req.body.budget_negotiable === true;
    const hideBudget = req.body.hide_budget === 'true' || req.body.hide_budget === true;
    
    if (!budgetType) {
      return res.status(400).json({ message: "Budget type is required" });
    }
    if (!budgetMin || budgetMin <= 0) {
      return res.status(400).json({ message: "Minimum budget must be greater than 0" });
    }
    if (budgetMax && budgetMax < budgetMin) {
      return res.status(400).json({ message: "Maximum budget must be greater than minimum budget" });
    }
    
    // ===== TIMELINE FIELDS =====
    const durationValue = req.body.duration_value ? parseInt(req.body.duration_value) : 1;
    const durationUnit = req.body.duration_unit || "weeks";
    const estimatedHours = req.body.estimated_hours ? parseInt(req.body.estimated_hours) : null;
    const weeklyLimit = req.body.weekly_limit ? parseInt(req.body.weekly_limit) : null;
    const startDate = req.body.start_date ? new Date(req.body.start_date) : null;
    const endDate = req.body.end_date ? new Date(req.body.end_date) : null;
    
    // Validate dates
    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }
    
    // ===== HIRING SETTINGS =====
    const maxApplicants = req.body.max_applicants ? parseInt(req.body.max_applicants) : 100;
    const autoAccept = req.body.auto_accept === 'true' || req.body.auto_accept === true;
    const allowMultipleHires = req.body.allow_multiple_hires === 'true' || req.body.allow_multiple_hires === true;
    const applicationDeadline = req.body.application_deadline ? new Date(req.body.application_deadline) : null;
    
    // ===== VALIDATE APPLICATION DEADLINE =====
    if (applicationDeadline && applicationDeadline <= new Date()) {
      return res.status(400).json({
        message: "Application deadline must be in the future",
      });
    }
    
    // ===== VALIDATE MAX APPLICANTS =====
    if (maxApplicants < 1 || maxApplicants > 1000) {
      return res.status(400).json({
        message: "Max applicants must be between 1 and 1000",
      });
    }
    
    // ===== JOB FEATURES =====
    const featured = req.body.featured === 'true' || req.body.featured === true;
    const urgent = req.body.urgent === 'true' || req.body.urgent === true;
    const ndaRequired = req.body.nda_required === 'true' || req.body.nda_required === true;
    
    // ===== OPTIONAL FIELDS =====
    const visibility = req.body.visibility || "public";
    const location = parseJSONField(req.body.location);
    const requirements = parseJSONField(req.body.requirements);
    const screeningQuestions = parseArrayField(req.body.screening_questions);
    const attachments = parseArrayField(req.body.attachments);

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "Job title is required" });
    }
    if (!description) {
      return res.status(400).json({ message: "Job description is required" });
    }
    if (!category) {
      return res.status(400).json({ message: "Job category is required" });
    }

    // Build the job data object
    const jobData = {
      client_id: req.user.id,
      title,
      description,
      category,
      subcategory,
      required_skills,
      tags,
      job_type,
      work_setup,
      experience_level,
      vacancies,
      timezone,
      contact_preference,
      
      budget: {
        type: budgetType,
        min: budgetMin,
        max: budgetMax || budgetMin,
        currency: budgetCurrency,
        negotiable: budgetNegotiable,
        hide_budget: hideBudget
      },
      
      timeline: {
        duration_value: durationValue,
        duration_unit: durationUnit,
        estimated_hours: estimatedHours,
        weekly_limit: weeklyLimit,
        start_date: startDate,
        end_date: endDate
      },
      
      requirements: requirements || {
        education: 'none',
        portfolio_required: false,
        resume_required: false,
        cover_letter_required: false,
        preferred_languages: [],
        preferred_certifications: [],
        min_years: 0
      },
      
      screening_questions: screeningQuestions.map(q => ({
        question: q.question || q,
        required: q.required !== undefined ? q.required : true
      })),
      
      hiring: {
        max_applicants: maxApplicants,
        auto_accept: autoAccept,
        allow_multiple_hires: allowMultipleHires
      },
      
      application_deadline: applicationDeadline,
      status: "open",
      visibility,
      
      // Job Features
      featured,
      urgent,
      nda_required: ndaRequired,
    };

    if (location && typeof location === 'object') {
      jobData.location = {
        country: location.country || "Philippines",
        province: location.province || "",
        city: location.city || "",
        address: location.address || "",
        zip_code: location.zip_code || ""
      };
    }

    if (attachments && Array.isArray(attachments)) {
      jobData.attachments = attachments.map(att => ({
        filename: att.filename || att,
        file_url: att.file_url || att
      }));
    }

    console.log("Creating job with data:", JSON.stringify(jobData, null, 2));

    const job = new Job(jobData);
    await job.save();

    // ==================== SEND EMAIL NOTIFICATIONS ====================
    
    try {
      // 1. Send confirmation to client
      const clientJobData = {
        title: job.title,
        job_id: job._id,
        status: job.status,
        posted_date: new Date().toLocaleDateString(),
        job_type: job.job_type,
        budget: job.budget,
        category: job.category,
        application_deadline: job.application_deadline,
        max_applicants: job.hiring?.max_applicants,
        is_urgent: job.urgent,
        is_featured: job.featured,
        nda_required: job.nda_required
      };
      
      await sendJobPostedConfirmation(
        client.email_address,
        clientJobData,
        client.first_name
      );
      console.log(`✅ Job confirmation email sent to client: ${client.email_address}`);
      
      // 2. Find freelancers with matching skills
      const matchingFreelancers = await Freelancer.find({
        account_status: 'active',
        is_email_verified: true,
        'rating.average': { $gte: 3 },
        skills: { $in: required_skills || [] },
        availability_status: 'available'
      }).limit(100);
      
      console.log(`🔍 Found ${matchingFreelancers.length} matching freelancers`);
      
      // 3. Send job notifications to matching freelancers
      if (matchingFreelancers.length > 0) {
        const jobNotificationData = {
          title: job.title,
          description: job.description,
          category: job.category,
          job_type: job.job_type,
          budget: job.budget,
          company_name: client.company_name || `${client.first_name} ${client.last_name}`,
          client_name: `${client.first_name} ${client.last_name}`,
          client_email: client.email_address,
          client_phone: client.phone_number,
          client_company: client.company_name,
          client_profile_picture: client.profile_picture,
          client_bio: client.bio_about,
          client_rating: client.rating,
          posted_date: new Date().toLocaleDateString(),
          job_id: job._id,
          required_skills: job.required_skills,
          experience_level: job.experience_level,
          work_setup: job.work_setup,
          application_deadline: job.application_deadline,
          location: job.location,
          is_urgent: job.urgent,
          is_featured: job.featured,
          nda_required: job.nda_required,
          max_applicants: job.hiring?.max_applicants
        };
        
        // Send bulk emails
        const results = await sendBulkJobNotifications(matchingFreelancers, jobNotificationData);
        
        const successful = results.filter(r => r.success).length;
        console.log(`📧 Job notifications sent to ${successful} freelancers`);
        
        // 4. Create in-app notifications for freelancers
        for (const freelancer of matchingFreelancers.slice(0, 20)) {
          await NotificationService.createNotification({
            recipient_id: freelancer._id,
            recipient_model: 'Freelancer',
            sender_id: client._id,
            sender_model: 'Client',
            type: 'job_posted',
            title: job.urgent ? '🚨 URGENT: New Job Matching Your Skills' : 'New Job Matching Your Skills',
            message: `${job.title} - ${job.budget?.type} job with budget ${job.budget?.min}-${job.budget?.max}${job.urgent ? ' ⚡ Urgent' : ''}`,
            reference_id: job._id,
            reference_model: 'Job',
            priority: job.urgent ? 'high' : 'medium',
            actions: [
              {
                label: 'View & Apply',
                action_type: 'view_job',
                data: { job_id: job._id },
              },
            ],
          });
        }
      }
      
      // 5. Create in-app notification for client
      await NotificationService.createNotification({
        recipient_id: client._id,
        recipient_model: 'Client',
        type: 'job_posted',
        title: 'Job Posted Successfully',
        message: `Your job "${job.title}" is now live and open for applications${job.urgent ? ' ⚡ Marked as Urgent' : ''}`,
        reference_id: job._id,
        reference_model: 'Job',
        priority: 'high',
        actions: [
          {
            label: 'View Job',
            action_type: 'view_job',
            data: { job_id: job._id },
          },
        ],
      });
      
    } catch (emailError) {
      console.error('❌ Email notification error:', emailError.message);
      // Don't fail job creation if email fails
    }

    res.status(201).json({
      message: "Job posted successfully",
      job
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ 
      message: "Error creating job", 
      error: error.message 
    });
  }
});

// Get all jobs posted by the authenticated client
router.get("/client/jobs", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ 
        message: "Access denied. Clients only." 
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query = { client_id: req.user.id, is_deleted: false };
    
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate({
        path: "assigned_freelancer_id",
        select: "first_name last_name email_address profile_picture username rating"
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalJobs: total
    });
  } catch (error) {
    console.error("Error fetching client jobs:", error);
    res.status(500).json({ 
      message: "Error fetching jobs", 
      error: error.message 
    });
  }
});

// Get a single job by ID - WITH FULL CLIENT INFORMATION
router.get("/jobs/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findOne({ _id: id, is_deleted: false })
      .populate({
        path: "client_id",
        select: [
          "first_name",
          "last_name",
          "email_address",
          "company_name",
          "company_logo",
          "company_logo_public_id",
          "company_size",
          "business_type",
          "industry",
          "business_email",
          "is_company_email_verified",
          "profile_picture",
          "profile_picture_public_id",
          "phone_number",
          "country",
          "city",
          "address",
          "bio_about",
          "website",
          "client_type",
          "rating",
          "total_jobs_completed",
          "account_status",
          "created_at",
          "updated_at"
        ]
      })
      .populate({
        path: "assigned_freelancer_id",
        select: [
          "first_name",
          "last_name",
          "username",
          "email_address",
          "profile_picture",
          "skills",
          "experience_level",
          "rating",
          "hourly_rate",
          "availability_status",
          "total_jobs_completed"
        ]
      });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if user is client and owns the job
    if (req.user.role === "client" && job.client_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if user is freelancer and job is not open
    if (req.user.role === "freelancer" && job.status !== "open" && job.status !== "draft") {
      return res.status(403).json({ message: "This job is not available" });
    }

    // Increment view count
    job.analytics.views = (job.analytics.views || 0) + 1;
    await job.save();

    // Format client response with ALL information
    const clientData = job.client_id ? {
      id: job.client_id._id,
      first_name: job.client_id.first_name,
      last_name: job.client_id.last_name,
      full_name: `${job.client_id.first_name} ${job.client_id.last_name}`,
      email_address: job.client_id.email_address,
      phone_number: job.client_id.phone_number,
      profile_picture: job.client_id.profile_picture,
      
      // Company Information
      company_name: job.client_id.company_name,
      company_logo: job.client_id.company_logo,
      company_logo_public_id: job.client_id.company_logo_public_id,
      company_size: job.client_id.company_size,
      business_type: job.client_id.business_type,
      industry: job.client_id.industry,
      business_email: job.client_id.business_email,
      is_company_email_verified: job.client_id.is_company_email_verified,
      client_type: job.client_id.client_type,
      
      // Location
      country: job.client_id.country,
      city: job.client_id.city,
      address: job.client_id.address,
      
      // Bio & Website
      bio_about: job.client_id.bio_about,
      website: job.client_id.website,
      
      // Rating
      rating: job.client_id.rating || { average: 0, count: 0 },
      total_jobs_completed: job.client_id.total_jobs_completed || 0,
      
      // Status
      account_status: job.client_id.account_status,
      
      // Joined date
      joined_at: job.client_id.created_at,
      updated_at: job.client_id.updated_at,
      
      // Display name (virtual)
      display_name: job.client_id.client_type === 'business' && job.client_id.company_name 
        ? job.client_id.company_name 
        : `${job.client_id.first_name} ${job.client_id.last_name}`
    } : null;

    const response = {
      job: {
        ...job.toObject(),
        client: clientData,
        client_id: job.client_id ? {
          _id: job.client_id._id,
          display_name: clientData?.display_name,
          profile_picture: job.client_id.profile_picture,
          company_name: job.client_id.company_name,
          rating: job.client_id.rating,
          client_type: job.client_id.client_type
        } : null
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ 
      message: "Error fetching job", 
      error: error.message 
    });
  }
});

// Get job insights for freelancer
router.get("/jobs/:id/insights", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findOne({ _id: id, is_deleted: false });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Access denied. Freelancers only." });
    }

    const insights = await calculateProfileInsights(job, req.user.id);
    
    if (!insights) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    res.json({ insights });
  } catch (error) {
    console.error("Error fetching job insights:", error);
    res.status(500).json({ 
      message: "Error fetching insights", 
      error: error.message 
    });
  }
});

// Update a job posting (Client only)
router.put("/jobs/:id", authMiddleware, upload.none(), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const { error, job, status: errorStatus } = await checkJobOwnership(id, req.user.id);
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    if (job.status !== "open" && job.status !== "draft") {
      return res.status(400).json({ 
        message: "Cannot update job that is already in progress, completed, or cancelled" 
      });
    }

    // Build update object
    const updates = {};
    
    const simpleFields = [
      "title", "description", "category", "subcategory", 
      "job_type", "work_setup", "experience_level", "visibility",
      "timezone", "vacancies", "application_deadline", "contact_preference"
    ];
    simpleFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        if (field === "title" || field === "description" || field === "category" || field === "subcategory") {
          updates[field] = req.body[field].trim();
        } else if (field === "vacancies") {
          updates[field] = parseInt(req.body[field]);
        } else if (field === "application_deadline") {
          const deadline = req.body[field] ? new Date(req.body[field]) : null;
          if (deadline && deadline <= new Date()) {
            return res.status(400).json({
              message: "Application deadline must be in the future",
            });
          }
          updates[field] = deadline;
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (req.body.required_skills !== undefined) {
      updates.required_skills = parseArrayField(req.body.required_skills);
    }
    if (req.body.tags !== undefined) {
      updates.tags = parseArrayField(req.body.tags);
    }

    // Budget updates
    if (req.body.budget_type !== undefined || req.body.budget_min !== undefined || 
        req.body.budget_max !== undefined || req.body.budget_currency !== undefined || 
        req.body.budget_negotiable !== undefined || req.body.hide_budget !== undefined) {
      
      updates.budget = {};
      
      if (req.body.budget_type !== undefined) {
        updates.budget.type = req.body.budget_type;
      }
      if (req.body.budget_min !== undefined) {
        const min = req.body.budget_min ? parseFloat(req.body.budget_min) : null;
        if (min && min <= 0) {
          return res.status(400).json({ message: "Minimum budget must be greater than 0" });
        }
        updates.budget.min = min;
      }
      if (req.body.budget_max !== undefined) {
        updates.budget.max = req.body.budget_max ? parseFloat(req.body.budget_max) : null;
      }
      if (req.body.budget_currency !== undefined) {
        updates.budget.currency = req.body.budget_currency || "PHP";
      }
      if (req.body.budget_negotiable !== undefined) {
        updates.budget.negotiable = req.body.budget_negotiable === 'true' || req.body.budget_negotiable === true;
      }
      if (req.body.hide_budget !== undefined) {
        updates.budget.hide_budget = req.body.hide_budget === 'true' || req.body.hide_budget === true;
      }
      
      // Validate budget
      if (updates.budget.min && updates.budget.max && updates.budget.max < updates.budget.min) {
        return res.status(400).json({ message: "Maximum budget must be greater than minimum budget" });
      }
    }

    // Timeline updates
    if (req.body.duration_value !== undefined || req.body.duration_unit !== undefined || 
        req.body.estimated_hours !== undefined || req.body.weekly_limit !== undefined ||
        req.body.start_date !== undefined || req.body.end_date !== undefined) {
      
      updates.timeline = {};
      
      if (req.body.duration_value !== undefined) {
        updates.timeline.duration_value = req.body.duration_value ? parseInt(req.body.duration_value) : 1;
      }
      if (req.body.duration_unit !== undefined) {
        updates.timeline.duration_unit = req.body.duration_unit || "weeks";
      }
      if (req.body.estimated_hours !== undefined) {
        updates.timeline.estimated_hours = req.body.estimated_hours ? parseInt(req.body.estimated_hours) : null;
      }
      if (req.body.weekly_limit !== undefined) {
        updates.timeline.weekly_limit = req.body.weekly_limit ? parseInt(req.body.weekly_limit) : null;
      }
      if (req.body.start_date !== undefined) {
        updates.timeline.start_date = req.body.start_date ? new Date(req.body.start_date) : null;
      }
      if (req.body.end_date !== undefined) {
        updates.timeline.end_date = req.body.end_date ? new Date(req.body.end_date) : null;
      }
      
      // Validate dates
      if (updates.timeline.start_date && updates.timeline.end_date && 
          updates.timeline.start_date > updates.timeline.end_date) {
        return res.status(400).json({ message: "Start date must be before end date" });
      }
    }

    // Hiring updates
    if (req.body.max_applicants !== undefined || req.body.auto_accept !== undefined || 
        req.body.allow_multiple_hires !== undefined) {
      
      updates.hiring = {};
      
      if (req.body.max_applicants !== undefined) {
        const max = req.body.max_applicants ? parseInt(req.body.max_applicants) : 100;
        if (max < 1 || max > 1000) {
          return res.status(400).json({
            message: "Max applicants must be between 1 and 1000",
          });
        }
        updates.hiring.max_applicants = max;
      }
      if (req.body.auto_accept !== undefined) {
        updates.hiring.auto_accept = req.body.auto_accept === 'true' || req.body.auto_accept === true;
      }
      if (req.body.allow_multiple_hires !== undefined) {
        updates.hiring.allow_multiple_hires = req.body.allow_multiple_hires === 'true' || req.body.allow_multiple_hires === true;
      }
    }

    // Requirements updates
    if (req.body.requirements !== undefined) {
      const reqData = parseJSONField(req.body.requirements);
      updates.requirements = {
        education: reqData?.education || 'none',
        portfolio_required: reqData?.portfolio_required || false,
        resume_required: reqData?.resume_required || false,
        cover_letter_required: reqData?.cover_letter_required || false,
        preferred_languages: reqData?.preferred_languages || [],
        preferred_certifications: reqData?.preferred_certifications || [],
        min_years: reqData?.min_years || 0
      };
    }

    // Location updates
    if (req.body.location !== undefined) {
      const loc = parseJSONField(req.body.location);
      updates.location = {
        country: loc?.country || "Philippines",
        province: loc?.province || "",
        city: loc?.city || "",
        address: loc?.address || "",
        zip_code: loc?.zip_code || ""
      };
    }

    // Screening questions updates
    if (req.body.screening_questions !== undefined) {
      const questions = parseArrayField(req.body.screening_questions);
      updates.screening_questions = questions.map(q => ({
        question: q.question || q,
        required: q.required !== undefined ? q.required : true
      }));
    }

    // Attachments updates
    if (req.body.attachments !== undefined) {
      const attachments = parseArrayField(req.body.attachments);
      updates.attachments = attachments.map(att => ({
        filename: att.filename || att,
        file_url: att.file_url || att,
        uploaded_at: new Date()
      }));
    }

    // Features
    if (req.body.featured !== undefined) {
      updates.featured = req.body.featured === 'true' || req.body.featured === true;
    }
    if (req.body.urgent !== undefined) {
      updates.urgent = req.body.urgent === 'true' || req.body.urgent === true;
    }
    if (req.body.nda_required !== undefined) {
      updates.nda_required = req.body.nda_required === 'true' || req.body.nda_required === true;
    }

    console.log("Updating job with:", JSON.stringify(updates, null, 2));

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: "Job updated successfully",
      job: updatedJob
    });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ 
      message: "Error updating job", 
      error: error.message 
    });
  }
});

// Update job status (Client only)
router.patch("/jobs/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const validStatuses = ["draft", "open", "in_review", "in_progress", "completed", "cancelled", "paused"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be one of: " + validStatuses.join(", ") 
      });
    }

    const { error, job, status: errorStatus } = await checkJobOwnership(id, req.user.id);
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    job.status = status;
    await job.save();

    res.json({
      message: `Job status updated to ${status}`,
      job
    });
  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ 
      message: "Error updating job status", 
      error: error.message 
    });
  }
});

// Delete a job posting (Soft delete)
router.delete("/jobs/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const { error, status: errorStatus } = await checkJobOwnership(id, req.user.id);
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    await Job.findByIdAndUpdate(id, { is_deleted: true });

    res.json({ 
      message: "Job deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ 
      message: "Error deleting job", 
      error: error.message 
    });
  }
});

// ==================== FREELANCER ROUTES ====================

// Get all open jobs with enhanced filters - WITH FULL CLIENT INFO
router.get("/freelancer/jobs", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ 
        message: "Access denied. Freelancers only." 
      });
    }

    const {
      page = 1,
      limit = 20,
      job_type,
      work_setup,
      experience_level,
      budget_type,
      min_budget,
      max_budget,
      skills,
      search,
      city,
      province,
      country,
      category,
      subcategory,
      sort_by,
      show_urgent,
      show_featured,
      show_nda,
      deadline_after
    } = req.query;

    const query = { 
      status: "open",
      is_deleted: false,
      visibility: "public"
    };

    // Only show jobs that haven't passed deadline
    query.$or = [
      { application_deadline: { $exists: false } },
      { application_deadline: null },
      { application_deadline: { $gt: new Date() } },
    ];

    if (search) {
      query.$text = { $search: search };
    }

    if (job_type) query.job_type = job_type;
    if (work_setup) query.work_setup = work_setup;
    if (experience_level) query.experience_level = experience_level;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    
    // Job features filters
    if (show_urgent === 'true') query.urgent = true;
    if (show_featured === 'true') query.featured = true;
    if (show_nda === 'true') query.nda_required = true;
    
    if (budget_type) query["budget.type"] = budget_type;
    if (min_budget || max_budget) {
      query["budget.max"] = {};
      if (min_budget) query["budget.max"].$gte = parseFloat(min_budget);
      if (max_budget) query["budget.max"].$lte = parseFloat(max_budget);
    }

    if (skills) {
      const skillsArray = skills.split(",");
      query.required_skills = { $in: skillsArray };
    }

    if (city) {
      query["location.city"] = { $regex: city, $options: "i" };
    }
    if (province) {
      query["location.province"] = { $regex: province, $options: "i" };
    }
    if (country) {
      query["location.country"] = { $regex: country, $options: "i" };
    }

    const sortOptions = {};
    if (sort_by === 'recent') {
      sortOptions.createdAt = -1;
    } else if (sort_by === 'budget_high') {
      sortOptions["budget.max"] = -1;
    } else if (sort_by === 'budget_low') {
      sortOptions["budget.max"] = 1;
    } else if (sort_by === 'relevant') {
      sortOptions["analytics.views"] = -1;
    } else if (sort_by === 'urgent') {
      sortOptions.urgent = -1;
      sortOptions.createdAt = -1;
    } else if (sort_by === 'deadline') {
      sortOptions.application_deadline = 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const jobs = await Job.find(query)
      .populate({
        path: "client_id",
        select: [
          "first_name", "last_name", "email_address", "company_name",
          "company_logo", "company_size", "business_type", "industry",
          "business_email", "profile_picture", "phone_number",
          "country", "city", "address", "bio_about", "website",
          "client_type", "rating", "total_jobs_completed",
          "account_status", "created_at"
        ]
      })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Format response with full client info
    const formattedJobs = jobs.map(job => {
      const client = job.client_id;
      return {
        ...job.toObject(),
        client: client ? {
          id: client._id,
          first_name: client.first_name,
          last_name: client.last_name,
          full_name: `${client.first_name} ${client.last_name}`,
          email: client.email_address,
          phone: client.phone_number,
          company_name: client.company_name,
          company_logo: client.company_logo,
          profile_picture: client.profile_picture,
          business_type: client.business_type,
          industry: client.industry,
          client_type: client.client_type,
          rating: client.rating || { average: 0, count: 0 },
          total_jobs_completed: client.total_jobs_completed || 0,
          bio_about: client.bio_about,
          website: client.website,
          country: client.country,
          city: client.city,
          address: client.address,
          display_name: client.client_type === 'business' && client.company_name 
            ? client.company_name 
            : `${client.first_name} ${client.last_name}`
        } : null,
        // Add computed fields
        is_application_deadline_passed: job.application_deadline ? new Date() > job.application_deadline : false,
        days_until_deadline: job.application_deadline ? Math.ceil((job.application_deadline - new Date()) / (1000 * 60 * 60 * 24)) : null,
        can_apply: job.status === 'open' && (!job.application_deadline || new Date() <= job.application_deadline)
      };
    });

    const total = await Job.countDocuments(query);

    res.json({
      jobs: formattedJobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalJobs: total
    });
  } catch (error) {
    console.error("Error fetching freelancer jobs:", error);
    res.status(500).json({ 
      message: "Error fetching jobs", 
      error: error.message 
    });
  }
});

// Get job statistics
router.get("/jobs/stats/dashboard", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === "client") {
      const query = { client_id: req.user.id, is_deleted: false };
      const totalJobs = await Job.countDocuments(query);
      const openJobs = await Job.countDocuments({ ...query, status: "open" });
      const inReviewJobs = await Job.countDocuments({ ...query, status: "in_review" });
      const inProgressJobs = await Job.countDocuments({ ...query, status: "in_progress" });
      const completedJobs = await Job.countDocuments({ ...query, status: "completed" });
      const cancelledJobs = await Job.countDocuments({ ...query, status: "cancelled" });
      const pausedJobs = await Job.countDocuments({ ...query, status: "paused" });
      
      // Additional stats
      const urgentJobs = await Job.countDocuments({ ...query, urgent: true });
      const featuredJobs = await Job.countDocuments({ ...query, featured: true });
      const ndaJobs = await Job.countDocuments({ ...query, nda_required: true });
      
      // Expired jobs
      const expiredJobs = await Job.countDocuments({
        ...query,
        application_deadline: { $lt: new Date() },
        status: "open"
      });
      
      const jobs = await Job.find(query);
      const totalApplicants = jobs.reduce((sum, job) => sum + (job.analytics?.applications || 0), 0);
      const totalViews = jobs.reduce((sum, job) => sum + (job.analytics?.views || 0), 0);
      const totalSaves = jobs.reduce((sum, job) => sum + (job.analytics?.saves || 0), 0);

      const jobsByType = {};
      const jobsByCategory = {};
      const jobsByStatus = {};
      jobs.forEach(job => {
        jobsByType[job.job_type] = (jobsByType[job.job_type] || 0) + 1;
        jobsByCategory[job.category] = (jobsByCategory[job.category] || 0) + 1;
        jobsByStatus[job.status] = (jobsByStatus[job.status] || 0) + 1;
      });

      res.json({
        totalJobs,
        openJobs,
        inReviewJobs,
        inProgressJobs,
        completedJobs,
        cancelledJobs,
        pausedJobs,
        totalApplicants,
        totalViews,
        totalSaves,
        jobsByType,
        jobsByCategory,
        jobsByStatus,
        urgentJobs,
        featuredJobs,
        ndaJobs,
        expiredJobs,
        message: "Client statistics"
      });
    } else if (req.user.role === "freelancer") {
      const appliedJobs = await Application.countDocuments({ freelancer_id: req.user.id });
      const savedJobs = await SavedJob.countDocuments({ freelancer_id: req.user.id });
      
      const applicationStatuses = await Application.aggregate([
        { $match: { freelancer_id: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      
      const statusBreakdown = {};
      applicationStatuses.forEach(item => {
        statusBreakdown[item._id] = item.count;
      });
      
      // Get jobs that match freelancer's skills
      const freelancer = await Freelancer.findById(req.user.id);
      const matchingJobs = freelancer?.skills?.length > 0 
        ? await Job.countDocuments({
            status: "open",
            is_deleted: false,
            required_skills: { $in: freelancer.skills }
          })
        : 0;
      
      res.json({
        appliedJobs,
        savedJobs,
        applicationStatuses: statusBreakdown,
        matchingJobs,
        message: "Freelancer statistics"
      });
    } else {
      res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    console.error("Error fetching job statistics:", error);
    res.status(500).json({ 
      message: "Error fetching statistics", 
      error: error.message 
    });
  }
});

// ==================== ANALYTICS ROUTES ====================

// Increment job view count
router.post("/jobs/:id/view", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.analytics.views = (job.analytics.views || 0) + 1;
    await job.save();

    res.json({ message: "View counted" });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    res.status(500).json({ 
      message: "Error updating view count", 
      error: error.message 
    });
  }
});

// Increment job save count
router.post("/jobs/:id/save", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.analytics.saves = (job.analytics.saves || 0) + 1;
    await job.save();

    res.json({ message: "Save counted" });
  } catch (error) {
    console.error("Error incrementing save count:", error);
    res.status(500).json({ 
      message: "Error updating save count", 
      error: error.message 
    });
  }
});

// Increment job application count
router.post("/jobs/:id/application", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.analytics.applications = (job.analytics.applications || 0) + 1;
    await job.save();

    res.json({ message: "Application counted" });
  } catch (error) {
    console.error("Error incrementing application count:", error);
    res.status(500).json({ 
      message: "Error updating application count", 
      error: error.message 
    });
  }
});

// ==================== CHECK JOB AVAILABILITY ====================

// Check if a job is available for application
router.get("/jobs/:id/check-availability", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const currentApplicants = await Application.countDocuments({
      job_id: job._id,
      status: { $ne: "cancelled" }
    });

    const result = job.canApply(currentApplicants);

    res.json({
      job_id: job._id,
      title: job.title,
      status: job.status,
      is_available: result.allowed,
      reason: result.reason,
      current_applicants: currentApplicants,
      max_applicants: job.hiring?.max_applicants,
      application_deadline: job.application_deadline,
      days_until_deadline: job.application_deadline 
        ? Math.ceil((job.application_deadline - new Date()) / (1000 * 60 * 60 * 24))
        : null,
      features: {
        urgent: job.urgent,
        featured: job.featured,
        nda_required: job.nda_required
      }
    });
  } catch (error) {
    console.error("Error checking job availability:", error);
    res.status(500).json({ 
      message: "Error checking job availability", 
      error: error.message 
    });
  }
});

export default router;