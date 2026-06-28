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
  
  const extraSkills = freelancerSkills.filter(skill =>
    !jobSkills.some(jobSkill => jobSkill.toLowerCase() === skill.toLowerCase())
  );
  
  const skillMatchPercentage = jobSkills.length > 0 
    ? (matchingSkills.length / jobSkills.length) * 100 
    : 100;

  // 2. Experience Match
  const freelancerYears = freelancer.years_of_experience || 0;
  const requiredYears = job.requirements?.min_years_experience || 0;
  const experienceMatchPercentage = requiredYears > 0 
    ? Math.min((freelancerYears / requiredYears) * 100, 100)
    : 100;
  const isExperienceSufficient = freelancerYears >= requiredYears;

  // 3. Education Match (using new schema fields)
  const freelancerEducation = freelancer.education || [];
  const requiredDegree = job.education_requirements?.minimum_degree || 'none';
  const preferredField = job.education_requirements?.preferred_field;
  
  const degreeLevels = {
    'none': 0,
    'high_school': 1,
    'associate': 2,
    'bachelor': 3,
    'master': 4,
    'doctorate': 5
  };
  
  const hasRequiredDegree = freelancerEducation.some(edu => 
    degreeLevels[edu.level?.toLowerCase()] >= degreeLevels[requiredDegree]
  );
  
  const hasPreferredField = preferredField 
    ? freelancerEducation.some(edu => 
        edu.field?.toLowerCase().includes(preferredField.toLowerCase())
      )
    : true;
  
  const relevantCertifications = (freelancer.certifications || []).filter(cert =>
    (job.education_requirements?.required_certifications || []).some(reqCert =>
      cert.toLowerCase().includes(reqCert.toLowerCase())
    )
  );
  
  let educationMatchPercentage = 0;
  if (requiredDegree === 'none') {
    educationMatchPercentage = 100;
  } else if (hasRequiredDegree) {
    educationMatchPercentage = hasPreferredField ? 100 : 80;
  } else {
    educationMatchPercentage = 0;
  }

  // 4. Location Match (using new schema fields)
  let locationMatchPercentage = 100;
  let locationMessage = "";
  
  if (job.work_setup === 'onsite') {
    const freelancerLocation = freelancer.location || {};
    const jobLocation = job.location || {};
    
    if (jobLocation.specific_area && freelancerLocation.city) {
      if (freelancerLocation.city.toLowerCase().includes(jobLocation.specific_area.toLowerCase()) ||
          jobLocation.specific_area.toLowerCase().includes(freelancerLocation.city.toLowerCase())) {
        locationMatchPercentage = 100;
        locationMessage = `You are located in/near ${jobLocation.specific_area}`;
      } else {
        locationMatchPercentage = 30;
        locationMessage = `This job requires working in ${jobLocation.specific_area}. Consider relocation or discuss remote options.`;
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
      extra_skills: extraSkills,
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
      required_degree: requiredDegree,
      preferred_field: preferredField,
      has_required_degree: hasRequiredDegree,
      has_preferred_field: hasPreferredField,
      relevant_certifications: relevantCertifications,
      recommendation: hasRequiredDegree 
        ? "Your education meets the requirements"
        : `This job requires a ${requiredDegree} degree`
    },
    location_match: {
      match_percentage: Math.round(locationMatchPercentage),
      job_location: {
        city: job.location?.city,
        specific_area: job.location?.specific_area,
        work_setup: job.work_setup,
        work_address: job.location?.work_address
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
    console.log("Content-Type:", req.headers['content-type']);
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
    
    // Budget fields (updated schema)
    const budget_type = req.body.budget_type || "fixed";
    const budget_min = req.body.budget_min ? parseFloat(req.body.budget_min) : null;
    const budget_max = req.body.budget_max ? parseFloat(req.body.budget_max) : null;
    const budget_currency = req.body.budget_currency || "PHP";
    const budget_negotiable = req.body.budget_negotiable === 'true' || req.body.budget_negotiable === true;
    
    // Timeline fields (updated schema)
    const duration_value = req.body.duration_value ? parseInt(req.body.duration_value) : 1;
    const duration_unit = req.body.duration_unit || "weeks";
    const start_date = req.body.start_date ? new Date(req.body.start_date) : null;
    const end_date = req.body.end_date ? new Date(req.body.end_date) : null;
    
    // Application settings
    const max_applicants = req.body.max_applicants ? parseInt(req.body.max_applicants) : 100;
    const auto_accept = req.body.auto_accept === 'true' || req.body.auto_accept === true;
    const allow_multiple_hires = req.body.allow_multiple_hires === 'true' || req.body.allow_multiple_hires === true;
    const application_deadline = req.body.application_deadline ? new Date(req.body.application_deadline) : null;
    
    // Additional optional fields
    const visibility = req.body.visibility || "public";
    const location = parseJSONField(req.body.location);
    const education_requirements = parseJSONField(req.body.education_requirements);
    const requirements = parseJSONField(req.body.requirements);

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
    if (!budget_type) {
      return res.status(400).json({ message: "Budget type is required" });
    }

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
      budget: {
        type: budget_type,
        min: budget_min,
        max: budget_max,
        currency: budget_currency,
        negotiable: budget_negotiable
      },
      timeline: {
        duration_value,
        duration_unit,
        start_date,
        end_date
      },
      hiring: {
        max_applicants,
        auto_accept,
        allow_multiple_hires
      },
      application_deadline,
      status: "open",
      visibility
    };

    // Add optional fields if provided
    if (location && typeof location === 'object') jobData.location = location;
    if (education_requirements && typeof education_requirements === 'object') jobData.education_requirements = education_requirements;
    if (requirements && typeof requirements === 'object') jobData.requirements = requirements;

    console.log("Creating job with data:", jobData);

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
      .populate("client_id", "first_name last_name email_address company_name profile_picture");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if user is client and owns the job
    if (req.user.role === "client" && job.client_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if user is freelancer and job is not open
    if (req.user.role === "freelancer" && job.status !== "open") {
      return res.status(403).json({ message: "This job is not available" });
    }

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

    const allowedUpdates = [
      "title", "description", "category", "subcategory", "required_skills", "tags",
      "job_type", "work_setup", "experience_level", "visibility",
      "application_deadline", "location", "education_requirements", "requirements"
    ];

    const updates = {};
    
    // Handle simple fields
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        if (field === "required_skills" || field === "tags") {
          updates[field] = parseArrayField(req.body[field]);
        } else if (field === "title" || field === "description" || field === "category" || field === "subcategory") {
          updates[field] = req.body[field].trim();
        } else if (field === "application_deadline") {
          updates[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else if (field === "location" || field === "education_requirements" || field === "requirements") {
          updates[field] = parseJSONField(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Handle budget updates
    if (req.body.budget_type !== undefined) {
      updates["budget.type"] = req.body.budget_type;
    }
    if (req.body.budget_min !== undefined) {
      updates["budget.min"] = req.body.budget_min ? parseFloat(req.body.budget_min) : null;
    }
    if (req.body.budget_max !== undefined) {
      updates["budget.max"] = req.body.budget_max ? parseFloat(req.body.budget_max) : null;
    }
    if (req.body.budget_currency !== undefined) {
      updates["budget.currency"] = req.body.budget_currency || "PHP";
    }
    if (req.body.budget_negotiable !== undefined) {
      updates["budget.negotiable"] = req.body.budget_negotiable === 'true' || req.body.budget_negotiable === true;
    }

    // Handle timeline updates
    if (req.body.duration_value !== undefined) {
      updates["timeline.duration_value"] = req.body.duration_value ? parseInt(req.body.duration_value) : 1;
    }
    if (req.body.duration_unit !== undefined) {
      updates["timeline.duration_unit"] = req.body.duration_unit || "weeks";
    }
    if (req.body.start_date !== undefined) {
      updates["timeline.start_date"] = req.body.start_date ? new Date(req.body.start_date) : null;
    }
    if (req.body.end_date !== undefined) {
      updates["timeline.end_date"] = req.body.end_date ? new Date(req.body.end_date) : null;
    }

    // Handle hiring settings updates
    if (req.body.max_applicants !== undefined) {
      updates["hiring.max_applicants"] = req.body.max_applicants ? parseInt(req.body.max_applicants) : 100;
    }
    if (req.body.auto_accept !== undefined) {
      updates["hiring.auto_accept"] = req.body.auto_accept === 'true' || req.body.auto_accept === true;
    }
    if (req.body.allow_multiple_hires !== undefined) {
      updates["hiring.allow_multiple_hires"] = req.body.allow_multiple_hires === 'true' || req.body.allow_multiple_hires === true;
    }

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
    if (status === "completed") {
      job.completed_at = new Date();
      job.progress = 100;
    }
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
      specific_area,
      min_experience,
      degree_required,
      category,
      subcategory
    } = req.query;

    const query = { 
      status: "open",
      is_deleted: false
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

    // Experience filter
    if (min_experience) {
      query["requirements.min_years_experience"] = { $lte: parseInt(min_experience) };
    }

    // Education filter
    if (degree_required === 'true') {
      query["education_requirements.minimum_degree"] = { $ne: 'none' };
    }

    // Location filters
    if (city) {
      query["location.city"] = { $regex: city, $options: "i" };
    }
    if (specific_area) {
      query["location.specific_area"] = { $regex: specific_area, $options: "i" };
    }

    const sortOptions = {};
    if (req.query.sort_by === 'recent') {
      sortOptions.createdAt = -1;
    } else if (req.query.sort_by === 'budget_high') {
      sortOptions["budget.max"] = -1;
    } else if (req.query.sort_by === 'budget_low') {
      sortOptions["budget.max"] = 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const jobs = await Job.find(query)
      .populate("client_id", "first_name last_name company_name profile_picture rating average")
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

// ==================== JOB PROGRESS & UPDATES ROUTES ====================

// Update job progress
router.patch("/jobs/:id/progress", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ message: "Progress must be between 0 and 100" });
    }

    const job = await Job.findOne({ _id: id, is_deleted: false });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if user is authorized (client or assigned freelancer)
    const isClient = job.client_id.toString() === req.user.id;
    const isAssignedFreelancer = job.assigned_freelancer_id && 
      job.assigned_freelancer_id.toString() === req.user.id;

    if (!isClient && !isAssignedFreelancer) {
      return res.status(403).json({ message: "You are not authorized to update this job's progress" });
    }

    // Update progress
    const previousProgress = job.progress || 0;
    job.progress = progress;
    
    if (progress === 100 && previousProgress < 100) {
      job.status = "completed";
      job.completed_at = new Date();
      job.completion_notes = notes || "Job marked as complete";
    }

    await job.save();

    res.json({
      message: "Progress updated successfully",
      job
    });
  } catch (error) {
    console.error("Error updating job progress:", error);
    res.status(500).json({ 
      message: "Error updating job progress", 
      error: error.message 
    });
  }
});

// Get job updates and progress
router.get("/jobs/:id/progress", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findOne({ _id: id, is_deleted: false });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check authorization
    const isClient = job.client_id.toString() === req.user.id;
    const isAssignedFreelancer = job.assigned_freelancer_id && 
      job.assigned_freelancer_id.toString() === req.user.id;

    if (!isClient && !isAssignedFreelancer && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to view this job's progress" });
    }

    res.json({
      progress: job.progress || 0,
      status: job.status,
      assigned_freelancer_id: job.assigned_freelancer_id,
      analytics: job.analytics
    });
  } catch (error) {
    console.error("Error fetching job progress:", error);
    res.status(500).json({ 
      message: "Error fetching job progress", 
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

export default router;