import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Job from "../models/Job.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";
import Application from "../models/Application.js";
import SavedJob from "../models/SavedJob.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Helper function to safely parse JSON fields
const parseJSONField = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

// Helper function to parse array fields
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

// Helper function to check if client owns the job
const checkJobOwnership = async (jobId, clientId) => {
  const job = await Job.findById(jobId);
  if (!job) return { error: "Job not found", status: 404 };
  if (job.client_id.toString() !== clientId.toString()) {
    return { error: "Unauthorized: You do not own this job", status: 403 };
  }
  return { job };
};

// Helper function to calculate profile insights
const calculateProfileInsights = async (job, freelancerId) => {
  const freelancer = await Freelancer.findById(freelancerId);
  if (!freelancer) return null;

  // 1. Skill Match Calculation
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

  // 2. Experience Match
  const freelancerYears = freelancer.years_of_experience || 0;
  const requiredExperience = freelancer.experience || {};
  const requiredYears = requiredExperience.min_years || 0;
  const experienceMatchPercentage = requiredYears > 0 
    ? Math.min((freelancerYears / requiredYears) * 100, 100)
    : 100;
  const isExperienceSufficient = freelancerYears >= requiredYears;

  // 3. Education Match - using schema requirements.education
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

  // 4. Location Match
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

  // 5. Overall Match Percentage
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

// Create a new job posting (Client only)
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
    
    // ===== BUDGET FIELDS =====
    const budgetType = req.body.budget_type || "fixed";
    const budgetMin = req.body.budget_min ? parseFloat(req.body.budget_min) : null;
    const budgetMax = req.body.budget_max ? parseFloat(req.body.budget_max) : null;
    const budgetCurrency = req.body.budget_currency || "PHP";
    const budgetNegotiable = req.body.budget_negotiable === 'true' || req.body.budget_negotiable === true;
    const hideBudget = req.body.hide_budget === 'true' || req.body.hide_budget === true;
    
    // Validate budget
    if (!budgetType) {
      return res.status(400).json({ message: "Budget type is required" });
    }
    if (!budgetMin) {
      return res.status(400).json({ message: "Minimum budget is required" });
    }
    
    // ===== TIMELINE FIELDS =====
    const durationValue = req.body.duration_value ? parseInt(req.body.duration_value) : 1;
    const durationUnit = req.body.duration_unit || "weeks";
    const estimatedHours = req.body.estimated_hours ? parseInt(req.body.estimated_hours) : null;
    const weeklyLimit = req.body.weekly_limit ? parseInt(req.body.weekly_limit) : null;
    const startDate = req.body.start_date ? new Date(req.body.start_date) : null;
    const endDate = req.body.end_date ? new Date(req.body.end_date) : null;
    
    // ===== HIRING SETTINGS =====
    const maxApplicants = req.body.max_applicants ? parseInt(req.body.max_applicants) : 100;
    const autoAccept = req.body.auto_accept === 'true' || req.body.auto_accept === true;
    const allowMultipleHires = req.body.allow_multiple_hires === 'true' || req.body.allow_multiple_hires === true;
    const applicationDeadline = req.body.application_deadline ? new Date(req.body.application_deadline) : null;
    
    // ===== OPTIONAL FIELDS =====
    const visibility = req.body.visibility || "public";
    const location = parseJSONField(req.body.location);
    const requirements = parseJSONField(req.body.requirements);
    const screeningQuestions = parseArrayField(req.body.screening_questions);
    const attachments = parseArrayField(req.body.attachments);
    const timezone = req.body.timezone || "Asia/Manila";

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

    // Build the job data object matching the schema
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
      
      // ===== BUDGET =====
      budget: {
        type: budgetType,
        min: budgetMin,
        max: budgetMax || budgetMin,
        currency: budgetCurrency,
        negotiable: budgetNegotiable,
        hide_budget: hideBudget
      },
      
      // ===== TIMELINE =====
      timeline: {
        duration_value: durationValue,
        duration_unit: durationUnit,
        estimated_hours: estimatedHours,
        weekly_limit: weeklyLimit,
        start_date: startDate,
        end_date: endDate
      },
      
      // ===== REQUIREMENTS =====
      requirements: requirements || {
        education: 'none',
        portfolio_required: false,
        resume_required: false,
        cover_letter_required: false,
        preferred_languages: [],
        preferred_certifications: []
      },
      
      // ===== SCREENING QUESTIONS =====
      screening_questions: screeningQuestions.map(q => ({
        question: q.question || q,
        required: q.required !== undefined ? q.required : true
      })),
      
      // ===== HIRING SETTINGS =====
      hiring: {
        max_applicants: maxApplicants,
        auto_accept: autoAccept,
        allow_multiple_hires: allowMultipleHires
      },
      
      application_deadline: applicationDeadline,
      status: "open",
      visibility
    };

    // Add optional fields if provided
    if (location && typeof location === 'object') {
      jobData.location = {
        country: location.country || "Philippines",
        province: location.province,
        city: location.city,
        address: location.address,
        zip_code: location.zip_code
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
      .populate("assigned_freelancer_id", "first_name last_name email_address")
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

// Get a single job by ID
router.get("/jobs/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findOne({ _id: id, is_deleted: false })
      .populate("client_id", "first_name last_name email_address company_name profile_picture")
      .populate("assigned_freelancer_id", "first_name last_name email_address profile_picture");

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

    res.json({ job });
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
    
    // Simple fields
    const simpleFields = [
      "title", "description", "category", "subcategory", 
      "job_type", "work_setup", "experience_level", "visibility",
      "timezone", "vacancies", "application_deadline"
    ];
    simpleFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        if (field === "title" || field === "description" || field === "category" || field === "subcategory") {
          updates[field] = req.body[field].trim();
        } else if (field === "vacancies") {
          updates[field] = parseInt(req.body[field]);
        } else if (field === "application_deadline") {
          updates[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Array fields
    if (req.body.required_skills !== undefined) {
      updates.required_skills = parseArrayField(req.body.required_skills);
    }
    if (req.body.tags !== undefined) {
      updates.tags = parseArrayField(req.body.tags);
    }

    // ===== BUDGET UPDATES =====
    if (req.body.budget_type !== undefined || req.body.budget_min !== undefined || 
        req.body.budget_max !== undefined || req.body.budget_currency !== undefined || 
        req.body.budget_negotiable !== undefined || req.body.hide_budget !== undefined) {
      
      updates.budget = {};
      
      if (req.body.budget_type !== undefined) {
        updates.budget.type = req.body.budget_type;
      }
      if (req.body.budget_min !== undefined) {
        updates.budget.min = req.body.budget_min ? parseFloat(req.body.budget_min) : null;
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
    }

    // ===== TIMELINE UPDATES =====
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
    }

    // ===== HIRING UPDATES =====
    if (req.body.max_applicants !== undefined || req.body.auto_accept !== undefined || 
        req.body.allow_multiple_hires !== undefined) {
      
      updates.hiring = {};
      
      if (req.body.max_applicants !== undefined) {
        updates.hiring.max_applicants = req.body.max_applicants ? parseInt(req.body.max_applicants) : 100;
      }
      if (req.body.auto_accept !== undefined) {
        updates.hiring.auto_accept = req.body.auto_accept === 'true' || req.body.auto_accept === true;
      }
      if (req.body.allow_multiple_hires !== undefined) {
        updates.hiring.allow_multiple_hires = req.body.allow_multiple_hires === 'true' || req.body.allow_multiple_hires === true;
      }
    }

    // ===== REQUIREMENTS UPDATES =====
    if (req.body.requirements !== undefined) {
      const reqData = parseJSONField(req.body.requirements);
      updates.requirements = {
        education: reqData?.education || 'none',
        portfolio_required: reqData?.portfolio_required || false,
        resume_required: reqData?.resume_required || false,
        cover_letter_required: reqData?.cover_letter_required || false,
        preferred_languages: reqData?.preferred_languages || [],
        preferred_certifications: reqData?.preferred_certifications || []
      };
    }

    // ===== LOCATION UPDATES =====
    if (req.body.location !== undefined) {
      const loc = parseJSONField(req.body.location);
      updates.location = {
        country: loc?.country || "Philippines",
        province: loc?.province,
        city: loc?.city,
        address: loc?.address,
        zip_code: loc?.zip_code
      };
    }

    // ===== SCREENING QUESTIONS UPDATES =====
    if (req.body.screening_questions !== undefined) {
      const questions = parseArrayField(req.body.screening_questions);
      updates.screening_questions = questions.map(q => ({
        question: q.question || q,
        required: q.required !== undefined ? q.required : true
      }));
    }

    // ===== ATTACHMENTS UPDATES =====
    if (req.body.attachments !== undefined) {
      const attachments = parseArrayField(req.body.attachments);
      updates.attachments = attachments.map(att => ({
        filename: att.filename || att,
        file_url: att.file_url || att,
        uploaded_at: new Date()
      }));
    }

    // ===== FEATURES =====
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

    // Soft delete
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

// Get all open jobs with enhanced filters
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
      sort_by
    } = req.query;

    const query = { 
      status: "open",
      is_deleted: false,
      visibility: "public"
    };

    // Text search using MongoDB text index
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (job_type) query.job_type = job_type;
    if (work_setup) query.work_setup = work_setup;
    if (experience_level) query.experience_level = experience_level;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    
    // Budget filters
    if (budget_type) query["budget.type"] = budget_type;
    if (min_budget || max_budget) {
      query["budget.max"] = {};
      if (min_budget) query["budget.max"].$gte = parseFloat(min_budget);
      if (max_budget) query["budget.max"].$lte = parseFloat(max_budget);
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(",");
      query.required_skills = { $in: skillsArray };
    }

    // Location filters
    if (city) {
      query["location.city"] = { $regex: city, $options: "i" };
    }
    if (province) {
      query["location.province"] = { $regex: province, $options: "i" };
    }
    if (country) {
      query["location.country"] = { $regex: country, $options: "i" };
    }

    // Sort options
    const sortOptions = {};
    if (sort_by === 'recent') {
      sortOptions.createdAt = -1;
    } else if (sort_by === 'budget_high') {
      sortOptions["budget.max"] = -1;
    } else if (sort_by === 'budget_low') {
      sortOptions["budget.max"] = 1;
    } else if (sort_by === 'relevant') {
      sortOptions["analytics.views"] = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const jobs = await Job.find(query)
      .populate("client_id", "first_name last_name company_name profile_picture")
      .sort(sortOptions)
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
      
      const jobs = await Job.find(query);
      const totalApplicants = jobs.reduce((sum, job) => sum + (job.analytics?.applications || 0), 0);
      const totalViews = jobs.reduce((sum, job) => sum + (job.analytics?.views || 0), 0);
      const totalSaves = jobs.reduce((sum, job) => sum + (job.analytics?.saves || 0), 0);

      // Additional stats
      const jobsByType = {};
      const jobsByCategory = {};
      jobs.forEach(job => {
        jobsByType[job.job_type] = (jobsByType[job.job_type] || 0) + 1;
        jobsByCategory[job.category] = (jobsByCategory[job.category] || 0) + 1;
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
        jobsByCategory
      });
    } else if (req.user.role === "freelancer") {
      const appliedJobs = await Application.countDocuments({ freelancer_id: req.user.id });
      const savedJobs = await SavedJob.countDocuments({ freelancer_id: req.user.id });
      
      // Get application status breakdown
      const applicationStatuses = await Application.aggregate([
        { $match: { freelancer_id: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      
      const statusBreakdown = {};
      applicationStatuses.forEach(item => {
        statusBreakdown[item._id] = item.count;
      });
      
      res.json({
        appliedJobs,
        savedJobs,
        applicationStatuses: statusBreakdown,
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

export default router;