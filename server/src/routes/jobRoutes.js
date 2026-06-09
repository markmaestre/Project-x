import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Job from "../models/Job.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";
import Application from "../models/Application.js";
import SavedJob from "../models/SavedJob.js";

const router = express.Router();

// Configure multer for FormData parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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
  const requiredYears = job.requirements?.min_years_experience || 0;
  const experienceMatchPercentage = requiredYears > 0 
    ? Math.min((freelancerYears / requiredYears) * 100, 100)
    : 100;
  const isExperienceSufficient = freelancerYears >= requiredYears;

  // 3. Education Match
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
    degreeLevels[edu.degree?.toLowerCase()] >= degreeLevels[requiredDegree]
  );
  
  const hasPreferredField = preferredField 
    ? freelancerEducation.some(edu => 
        edu.field?.toLowerCase().includes(preferredField.toLowerCase())
      )
    : true;
  
  const relevantCertifications = (freelancer.certifications || []).filter(cert =>
    (job.education_requirements?.required_certifications || []).some(reqCert =>
      cert.name?.toLowerCase().includes(reqCert.toLowerCase())
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

  // 4. Location Match
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

    // Parse JSON string fields if they come as strings from FormData
    const title = req.body.title;
    const description = req.body.description;
    const required_skills = parseArrayField(req.body.required_skills);
    const job_type = req.body.job_type;
    const work_setup = req.body.work_setup;
    const urgency_level = req.body.urgency_level;
    const experience_level = req.body.experience_level;
    const budget_type = req.body.budget_type;
    const budget_amount = req.body.budget_amount;
    const estimated_duration = req.body.estimated_duration;
    const contact_preference = req.body.contact_preference;
    
    // Parse nested objects if they come as JSON strings
    const pay_information = parseJSONField(req.body.pay_information);
    const location = parseJSONField(req.body.location);
    const education_requirements = parseJSONField(req.body.education_requirements);
    const requirements = parseJSONField(req.body.requirements);
    const application_settings = parseJSONField(req.body.application_settings);

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Job title is required" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Job description is required" });
    }
    if (!budget_amount || parseFloat(budget_amount) <= 0) {
      return res.status(400).json({ message: "Valid budget amount is required" });
    }

    const jobData = {
      client_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      required_skills: required_skills,
      job_type: job_type || "one_time",
      work_setup: work_setup || "remote",
      urgency_level: urgency_level || "normal",
      experience_level: experience_level || null,
      budget_type: budget_type || "fixed",
      budget_amount: parseFloat(budget_amount),
      estimated_duration: estimated_duration || null,
      contact_preference: contact_preference || "chat",
      total_applicants: 0,
      status: "open"
    };

    // Add optional fields if provided
    if (pay_information && typeof pay_information === 'object') jobData.pay_information = pay_information;
    if (location && typeof location === 'object') jobData.location = location;
    if (education_requirements && typeof education_requirements === 'object') jobData.education_requirements = education_requirements;
    if (requirements && typeof requirements === 'object') jobData.requirements = requirements;
    if (application_settings && typeof application_settings === 'object') jobData.application_settings = application_settings;

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
    const query = { client_id: req.user.id };
    
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .sort({ created_at: -1 })
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

    const job = await Job.findById(id).populate("client_id", "first_name last_name email_address company_name profile_picture");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (req.user.role === "client" && job.client_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

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

    const job = await Job.findById(id);
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

    if (job.status !== "open") {
      return res.status(400).json({ 
        message: "Cannot update job that is already in progress, completed, or cancelled" 
      });
    }

    const allowedUpdates = [
      "title", "description", "required_skills", "job_type", 
      "work_setup", "urgency_level", "experience_level", 
      "budget_type", "budget_amount", "estimated_duration", 
      "contact_preference", "pay_information", "location",
      "education_requirements", "requirements", "application_settings"
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        if (field === "required_skills") {
          updates[field] = parseArrayField(req.body[field]);
        } else if (field === "budget_amount") {
          updates[field] = parseFloat(req.body[field]);
        } else if (typeof req.body[field] === "object") {
          updates[field] = req.body[field];
        } else if (typeof req.body[field] === "string" && (field === "pay_information" || field === "location" || field === "education_requirements" || field === "requirements" || field === "application_settings")) {
          updates[field] = parseJSONField(req.body[field]);
        } else if (typeof req.body[field] === "string") {
          updates[field] = req.body[field].trim();
        } else {
          updates[field] = req.body[field];
        }
      }
    });

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

    const validStatuses = ["open", "in_progress", "completed", "cancelled"];
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

// Delete a job posting (Client only)
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

    await Job.findByIdAndDelete(id);

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

// Increment total_applicants count
router.post("/jobs/:id/increment-applicants", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "open") {
      return res.status(400).json({ message: "Cannot apply to this job as it is not open" });
    }

    job.total_applicants += 1;
    await job.save();

    res.json({ 
      message: "Applicant count updated",
      total_applicants: job.total_applicants 
    });
  } catch (error) {
    console.error("Error incrementing applicants:", error);
    res.status(500).json({ 
      message: "Error updating applicant count", 
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
      urgency_level,
      search,
      city,
      specific_area,
      min_experience,
      degree_required
    } = req.query;

    const query = { status: "open" };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { required_skills: { $regex: search, $options: "i" } }
      ];
    }

    if (job_type) query.job_type = job_type;
    if (work_setup) query.work_setup = work_setup;
    if (experience_level) query.experience_level = experience_level;
    if (budget_type) query.budget_type = budget_type;
    if (urgency_level) query.urgency_level = urgency_level;
    
    if (min_budget || max_budget) {
      query.budget_amount = {};
      if (min_budget) query.budget_amount.$gte = parseFloat(min_budget);
      if (max_budget) query.budget_amount.$lte = parseFloat(max_budget);
    }

    if (skills) {
      const skillsArray = skills.split(",");
      query.required_skills = { $in: skillsArray };
    }

    if (min_experience) {
      query["requirements.min_years_experience"] = { $lte: parseInt(min_experience) };
    }

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

    const jobs = await Job.find(query)
      .populate("client_id", "first_name last_name company_name profile_picture")
      .sort({ created_at: -1, urgency_level: -1 })
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
      const totalJobs = await Job.countDocuments({ client_id: req.user.id });
      const openJobs = await Job.countDocuments({ client_id: req.user.id, status: "open" });
      const inProgressJobs = await Job.countDocuments({ client_id: req.user.id, status: "in_progress" });
      const completedJobs = await Job.countDocuments({ client_id: req.user.id, status: "completed" });
      const cancelledJobs = await Job.countDocuments({ client_id: req.user.id, status: "cancelled" });
      
      const jobs = await Job.find({ client_id: req.user.id });
      const totalApplicants = jobs.reduce((sum, job) => sum + (job.total_applicants || 0), 0);

      // Additional stats
      const jobsByType = {};
      jobs.forEach(job => {
        jobsByType[job.job_type] = (jobsByType[job.job_type] || 0) + 1;
      });

      res.json({
        totalJobs,
        openJobs,
        inProgressJobs,
        completedJobs,
        cancelledJobs,
        totalApplicants,
        jobsByType
      });
    } else if (req.user.role === "freelancer") {
      const appliedJobs = await Application.countDocuments({ freelancer_id: req.user.id });
      const savedJobs = await SavedJob.countDocuments({ freelancer_id: req.user.id });
      
      res.json({
        appliedJobs,
        savedJobs,
        message: "Freelancer statistics"
      });
    } else {
      res.json({
        message: "Statistics not available"
      });
    }
  } catch (error) {
    console.error("Error fetching job statistics:", error);
    res.status(500).json({ 
      message: "Error fetching statistics", 
      error: error.message 
    });
  }
});

export default router;