import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Job from "../models/Job.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";

const router = express.Router();

// Helper function to check if client owns the job
const checkJobOwnership = async (jobId, clientId) => {
  const job = await Job.findById(jobId);
  if (!job) return { error: "Job not found", status: 404 };
  if (job.client_id.toString() !== clientId.toString()) {
    return { error: "Unauthorized: You do not own this job", status: 403 };
  }
  return { job };
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

// ==================== CLIENT ROUTES ====================

// Create a new job posting (Client only)
router.post("/jobs", authMiddleware, async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("User from auth:", req.user);

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({ 
        message: "Only clients can create job postings" 
      });
    }

    // Verify client exists
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const {
      title,
      description,
      required_skills,
      job_type,
      work_setup,
      urgency_level,
      experience_level,
      budget_type,
      budget_amount,
      estimated_duration,
      contact_preference
    } = req.body;

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

    // Parse required_skills
    const parsedSkills = parseArrayField(required_skills);

    const jobData = {
      client_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      required_skills: parsedSkills,
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

    // Check if user is authorized to view this job
    if (req.user.role === "client" && job.client_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // For freelancers, only show open jobs
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

// Update a job posting (Client only)
router.put("/jobs/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    // Check ownership
    const { error, job, status: errorStatus } = await checkJobOwnership(id, req.user.id);
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    // Don't allow updating if job is not open
    if (job.status !== "open") {
      return res.status(400).json({ 
        message: "Cannot update job that is already in progress, completed, or cancelled" 
      });
    }

    // Allowed fields for update
    const allowedUpdates = [
      "title", "description", "required_skills", "job_type", 
      "work_setup", "urgency_level", "experience_level", 
      "budget_type", "budget_amount", "estimated_duration", 
      "contact_preference"
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        if (field === "required_skills") {
          updates[field] = parseArrayField(req.body[field]);
        } else if (field === "budget_amount") {
          updates[field] = parseFloat(req.body[field]);
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

    // Check ownership
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

    // Check ownership
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

// Increment total_applicants count (when freelancer applies)
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

    // Only allow incrementing if job is open
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

// Get all open jobs (for freelancers)
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
      search
    } = req.query;

    const query = { status: "open" };

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { required_skills: { $regex: search, $options: "i" } }
      ];
    }

    // Apply filters
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

// Get job statistics (for dashboard)
router.get("/jobs/stats/dashboard", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === "client") {
      // Client statistics
      const totalJobs = await Job.countDocuments({ client_id: req.user.id });
      const openJobs = await Job.countDocuments({ client_id: req.user.id, status: "open" });
      const inProgressJobs = await Job.countDocuments({ client_id: req.user.id, status: "in_progress" });
      const completedJobs = await Job.countDocuments({ client_id: req.user.id, status: "completed" });
      const cancelledJobs = await Job.countDocuments({ client_id: req.user.id, status: "cancelled" });
      
      // Get total applicants across all jobs
      const jobs = await Job.find({ client_id: req.user.id });
      const totalApplicants = jobs.reduce((sum, job) => sum + (job.total_applicants || 0), 0);

      res.json({
        totalJobs,
        openJobs,
        inProgressJobs,
        completedJobs,
        cancelledJobs,
        totalApplicants
      });
    } else {
      res.json({
        message: "Freelancer statistics coming soon"
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