// routes/applicationRoutes.js
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { cloudinary } from "../config/cloudinary.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";
import SavedJob from "../models/SavedJob.js";
import ApplicationService from "../services/applicationService.js";

const router = express.Router();

// ── Configure multer for memory storage ──────────────────────────────────────
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX are allowed.'), false);
    }
  }
});

// ── Helper function to upload file to Cloudinary from buffer ──────────────────
const uploadToCloudinary = async (fileBuffer, originalName, mimetype) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "resumes",
        resource_type: "raw",
        allowed_formats: ["pdf", "doc", "docx"],
        public_id: `resume_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// ── Helper to log FormData fields ─────────────────────────────────────────────
const logFormData = (req) => {
  console.log("=== FORM DATA RECEIVED ===");
  console.log("Body keys:", Object.keys(req.body));
  console.log("File:", req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    fieldname: req.file.fieldname
  } : 'NO FILE');
  
  // Log each body field
  Object.keys(req.body).forEach(key => {
    const value = req.body[key];
    if (key === 'education' || key === 'experiences') {
      try {
        console.log(`${key}:`, JSON.parse(value));
      } catch (e) {
        console.log(`${key}:`, value);
      }
    } else {
      console.log(`${key}:`, value);
    }
  });
};

// ── ==================== FREELANCER ROUTES ==================== ──

// Apply for a job WITHOUT file upload (JSON only)
router.post("/applications", authMiddleware, async (req, res) => {
  try {
    console.log("=== START APPLICATION SUBMISSION (JSON) ===");
    
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can apply for jobs" });
    }

    const { job_id, cover_letter, proposed_rate, education, experiences } = req.body;

    if (!job_id) {
      return res.status(400).json({ message: "Job ID is required" });
    }
    if (!cover_letter || !cover_letter.trim()) {
      return res.status(400).json({ message: "Cover letter is required" });
    }

    // Parse education and experiences if they are strings
    let educationData = null;
    let experiencesData = null;
    
    if (education) {
      try {
        educationData = typeof education === 'string' ? JSON.parse(education) : education;
      } catch (e) {
        educationData = education;
      }
    }
    
    if (experiences) {
      try {
        experiencesData = typeof experiences === 'string' ? JSON.parse(experiences) : experiences;
      } catch (e) {
        experiencesData = experiences;
      }
    }

    // Check if job exists
    const job = await Job.findOne({ _id: job_id, is_deleted: false });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if freelancer already applied
    const existingApplication = await Application.findOne({
      job_id: job_id,
      freelancer_id: req.user.id,
      status: { $nin: ['withdrawn', 'rejected'] }
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    // Use ApplicationService
    const application = await ApplicationService.submitApplication({
      job_id,
      freelancer_id: req.user.id,
      cover_letter: cover_letter.trim(),
      proposed_rate: proposed_rate ? parseFloat(proposed_rate) : 0,
      resume: null,
      education: educationData,
      experiences: experiencesData
    });

    const populatedApplication = await Application.findById(application._id)
      .populate("job_id", "title budget category job_type work_setup")
      .populate("freelancer_id", "first_name last_name username profile_picture rating");

    res.status(201).json({
      message: "Application submitted successfully",
      application: populatedApplication
    });
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({ message: "Error submitting application", error: error.message });
  }
});

// Apply for a job WITH file upload (multipart/form-data)
router.post("/applications/with-resume", authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    console.log("=== START APPLICATION WITH RESUME SUBMISSION ===");
    logFormData(req);
    
    if (req.user.role !== "freelancer") {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
        } catch (e) {}
      }
      return res.status(403).json({ message: "Only freelancers can apply for jobs" });
    }

    // Parse education and experiences
    let educationData = null;
    let experiencesData = null;
    
    if (req.body.education) {
      try {
        educationData = typeof req.body.education === 'string' 
          ? JSON.parse(req.body.education) 
          : req.body.education;
      } catch (e) {
        educationData = req.body.education;
      }
    }
    
    if (req.body.experiences) {
      try {
        experiencesData = typeof req.body.experiences === 'string' 
          ? JSON.parse(req.body.experiences) 
          : req.body.experiences;
      } catch (e) {
        experiencesData = req.body.experiences;
      }
    }

    const { job_id, cover_letter, proposed_rate } = req.body;

    // Validate required fields
    if (!job_id) {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
        } catch (e) {}
      }
      return res.status(400).json({ message: "Job ID is required" });
    }
    
    if (!cover_letter || !cover_letter.trim()) {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
        } catch (e) {}
      }
      return res.status(400).json({ message: "Cover letter is required" });
    }

    // Check if job exists
    const job = await Job.findOne({ _id: job_id, is_deleted: false });
    if (!job) {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
        } catch (e) {}
      }
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if freelancer already applied
    const existingApplication = await Application.findOne({
      job_id: job_id,
      freelancer_id: req.user.id,
      status: { $nin: ['withdrawn', 'rejected'] }
    });
    
    if (existingApplication) {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
        } catch (e) {}
      }
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    // Upload resume to Cloudinary if file exists
    let resumeData = null;
    if (req.file) {
      try {
        console.log(`Uploading resume: ${req.file.originalname} (${req.file.size} bytes)`);
        const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, req.file.mimetype);
        resumeData = {
          name: req.file.originalname,
          url: result.secure_url,
          mime_type: req.file.mimetype,
          size: req.file.size,
        };
        console.log("Resume uploaded successfully:", result.secure_url);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        if (req.file) {
          try {
            await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
          } catch (e) {}
        }
        return res.status(500).json({ message: "Failed to upload resume. Please try again." });
      }
    } else {
      return res.status(400).json({ message: "Resume file is required" });
    }

    // Create application
    const application = await ApplicationService.submitApplication({
      job_id,
      freelancer_id: req.user.id,
      cover_letter: cover_letter.trim(),
      proposed_rate: proposed_rate ? parseFloat(proposed_rate) : 0,
      resume: resumeData,
      education: educationData,
      experiences: experiencesData
    });

    // Update job analytics
    job.analytics.applications = (job.analytics.applications || 0) + 1;
    await job.save();

    // Populate application
    const populatedApplication = await Application.findById(application._id)
      .populate("job_id", "title budget category job_type work_setup")
      .populate("freelancer_id", "first_name last_name username profile_picture rating");

    console.log("Application created successfully with ID:", application._id);

    res.status(201).json({
      message: "Application submitted successfully",
      application: populatedApplication
    });
  } catch (error) {
    console.error("Error creating application with resume:", error);
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
      } catch (e) {}
    }
    res.status(500).json({ 
      message: "Error submitting application", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get freelancer's own applications
router.get("/freelancer/applications", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Access denied. Freelancers only." });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { freelancer_id: req.user.id };
    
    if (status && status !== 'All') query.status = status;

    const applications = await Application.find(query)
      .populate("job_id", "title description budget category required_skills work_setup job_type experience_level")
      .populate({
        path: "job_id",
        populate: {
          path: "client_id",
          select: "first_name last_name company_name profile_picture rating"
        }
      })
      .sort({ applied_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Application.countDocuments(query);

    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalApplications: total
    });
  } catch (error) {
    console.error("Error fetching freelancer applications:", error);
    res.status(500).json({ message: "Error fetching applications", error: error.message });
  }
});

// Withdraw an application (Freelancer only)
router.patch("/applications/:applicationId/withdraw", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;

    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can withdraw applications" });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.freelancer_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (application.status !== "pending" && application.status !== "reviewed") {
      return res.status(400).json({ message: "Cannot withdraw application at this stage" });
    }

    application.status = "withdrawn";
    application.withdrawn_at = new Date();
    application.withdraw_reason = reason || null;
    await application.save();

    // Decrement job applications count
    const job = await Job.findById(application.job_id);
    if (job) {
      job.analytics.applications = Math.max(0, (job.analytics.applications || 0) - 1);
      await job.save();
    }

    res.json({
      message: "Application withdrawn successfully",
      application
    });
  } catch (error) {
    console.error("Error withdrawing application:", error);
    res.status(500).json({ message: "Error withdrawing application", error: error.message });
  }
});

// ── ==================== SAVED JOBS ROUTES ==================== ──

// Save a job for later (Freelancer only)
router.post("/applications/save", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can save jobs" });
    }

    const { job_id, notes } = req.body;

    if (!job_id) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(job_id)) {
      return res.status(400).json({ message: "Invalid job ID format" });
    }

    const freelancer = await Freelancer.findById(req.user.id);
    if (!freelancer) {
      return res.status(404).json({ message: "Freelancer not found" });
    }

    const job = await Job.findOne({ _id: job_id, is_deleted: false });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existingSaved = await SavedJob.findOne({
      freelancer_id: req.user.id,
      job_id: job_id
    });

    if (existingSaved) {
      return res.status(400).json({ message: "Job already saved" });
    }

    const savedJob = new SavedJob({
      freelancer_id: req.user.id,
      job_id: job_id,
      notes: notes || null,
    });

    await savedJob.save();

    // Update job analytics
    job.analytics.saves = (job.analytics.saves || 0) + 1;
    await job.save();

    const populatedSavedJob = await SavedJob.findById(savedJob._id)
      .populate("job_id", "title description budget category required_skills work_setup job_type experience_level")
      .populate({
        path: "job_id",
        populate: {
          path: "client_id",
          select: "first_name last_name company_name profile_picture rating"
        }
      });

    res.status(201).json({
      message: "Job saved successfully",
      savedJob: populatedSavedJob
    });
  } catch (error) {
    console.error("Error saving job:", error);
    res.status(500).json({ message: "Error saving job", error: error.message });
  }
});

// Get all saved jobs for a freelancer
router.get("/applications/saved", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can view saved jobs" });
    }

    const { page = 1, limit = 20 } = req.query;

    const savedJobs = await SavedJob.find({ freelancer_id: req.user.id })
      .populate("job_id", "title description budget category required_skills work_setup job_type experience_level")
      .populate({
        path: "job_id",
        populate: {
          path: "client_id",
          select: "first_name last_name company_name profile_picture rating"
        }
      })
      .sort({ saved_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const validSavedJobs = savedJobs.filter(item => item.job_id !== null);
    const total = await SavedJob.countDocuments({ freelancer_id: req.user.id });

    res.json({
      savedJobs: validSavedJobs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalSaved: total
    });
  } catch (error) {
    console.error("Error getting saved jobs:", error);
    res.status(500).json({ message: "Error getting saved jobs", error: error.message });
  }
});

// Remove a saved job (Unsave)
router.delete("/applications/save/:jobId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can unsave jobs" });
    }

    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job ID format" });
    }

    const deleted = await SavedJob.findOneAndDelete({
      freelancer_id: req.user.id,
      job_id: jobId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Saved job not found" });
    }

    // Update job analytics
    const job = await Job.findById(jobId);
    if (job) {
      job.analytics.saves = Math.max(0, (job.analytics.saves || 0) - 1);
      await job.save();
    }

    res.json({
      message: "Job removed from saved list",
      jobId: jobId
    });
  } catch (error) {
    console.error("Error unsaving job:", error);
    res.status(500).json({ message: "Error unsaving job", error: error.message });
  }
});

// Check if job is saved by freelancer
router.get("/applications/saved/check/:jobId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job ID format" });
    }

    const saved = await SavedJob.findOne({
      freelancer_id: req.user.id,
      job_id: jobId
    });

    res.json({
      isSaved: !!saved,
      savedJobId: saved ? saved._id : null
    });
  } catch (error) {
    console.error("Error checking saved job:", error);
    res.status(500).json({ message: "Error checking saved job", error: error.message });
  }
});

// ── ==================== CLIENT ROUTES ==================== ──

// Get applications for a specific job (Client only)
router.get("/jobs/:jobId/applications", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findOne({ _id: jobId, is_deleted: false });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. This job does not belong to you." });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { job_id: jobId };
    
    if (status && status !== 'All') query.status = status;

    const applications = await Application.find(query)
      .populate("freelancer_id", "first_name last_name username email_address profile_picture skills experience_level years_of_experience hourly_rate bio_about_me rating")
      .sort({ applied_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Application.countDocuments(query);

    // Mark applications as viewed
    await Application.updateMany(
      { job_id: jobId, viewed_by_client: false },
      { viewed_by_client: true }
    );

    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalApplications: total
    });
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({ message: "Error fetching applications", error: error.message });
  }
});

// Update application status (Client only) - Using ApplicationService
router.patch("/applications/:applicationId/status", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, interview, offer, notes } = req.body;

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    // Valid statuses from Application schema
    const validStatuses = ["pending", "reviewed", "shortlisted", "interview", "offered", "hired", "rejected", "completed", "withdrawn"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Get application to check ownership
    const application = await Application.findById(applicationId)
      .populate("job_id", "client_id title status")
      .populate("freelancer_id", "first_name last_name email_address");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.job_id.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Handle offer creation separately if status is 'offered'
    if (status === 'offered') {
      if (!offer || !offer.amount) {
        return res.status(400).json({ message: "Offer amount is required" });
      }
      
      // Use ApplicationService to send offer
      const updatedApplication = await ApplicationService.sendOffer({
        application_id: applicationId,
        client_id: req.user.id,
        amount: offer.amount,
        message: offer.message || "We would like to offer you this position."
      });
      
      return res.json({ 
        message: "Offer sent successfully", 
        application: updatedApplication 
      });
    }

    // For other status updates, use updateApplicationStatus
    const updatedApplication = await ApplicationService.updateApplicationStatus({
      application_id: applicationId,
      status: status,
      client_id: req.user.id,
      notes: notes || null
    });

    // Handle interview data if status is 'interview'
    if (status === 'interview' && interview) {
      updatedApplication.interview = {
        scheduled_date: interview.scheduled_date ? new Date(interview.scheduled_date) : null,
        meeting_link: interview.meeting_link || null,
        notes: interview.notes || null,
        sent_at: new Date(),
      };
      await updatedApplication.save();
    }

    // If status is 'hired', update job status
    if (status === 'hired') {
      const job = await Job.findById(application.job_id._id);
      if (job) {
        job.status = 'in_progress';
        job.assigned_freelancer_id = application.freelancer_id._id;
        await job.save();
      }
    }

    // If status is 'completed', update job status
    if (status === 'completed') {
      const job = await Job.findById(application.job_id._id);
      if (job) {
        job.status = 'completed';
        await job.save();
      }
    }

    res.json({ 
      message: `Application status updated to ${status}`, 
      application: updatedApplication 
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Error updating application status", error: error.message });
  }
});

// Accept offer (Freelancer only) - Using ApplicationService
router.post("/applications/:applicationId/accept-offer", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can accept offers" });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    // Use ApplicationService to accept offer
    const contract = await ApplicationService.acceptOffer({
      application_id: applicationId,
      freelancer_id: req.user.id
    });

    res.json({
      message: "Offer accepted successfully",
      contract: contract
    });
  } catch (error) {
    console.error("Error accepting offer:", error);
    res.status(500).json({ message: "Error accepting offer", error: error.message });
  }
});

// Get application details (Client or Freelancer) - With full data
router.get("/applications/:applicationId", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const application = await Application.findById(applicationId)
      .populate("job_id", "title description budget category required_skills work_setup job_type experience_level client_id")
      .populate({
        path: "job_id",
        populate: {
          path: "client_id",
          select: "first_name last_name company_name profile_picture rating email_address phone_number"
        }
      })
      .populate("freelancer_id", "first_name last_name username email_address profile_picture skills experience_level years_of_experience hourly_rate bio_about_me rating portfolio");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check authorization
    const isClient = application.job_id.client_id._id.toString() === req.user.id;
    const isFreelancer = application.freelancer_id._id.toString() === req.user.id;

    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    // If client is viewing, mark as viewed
    if (isClient) {
      application.viewed_by_client = true;
      await application.save();
    }

    // Return full application data with resume URL
    res.json({ 
      application: {
        ...application.toObject(),
        resume: application.resume ? {
          name: application.resume.name,
          url: application.resume.url,
          mime_type: application.resume.mime_type,
          size: application.resume.size
        } : null
      }
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "Error fetching application", error: error.message });
  }
});

// Get all applications for a client's jobs (Client only)
router.get("/client/applications", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    const { status, page = 1, limit = 20, job_id } = req.query;

    // Get all jobs for this client
    const jobQuery = { client_id: req.user.id, is_deleted: false };
    if (job_id) {
      jobQuery._id = job_id;
    }
    const jobs = await Job.find(jobQuery).select('_id');
    const jobIds = jobs.map(job => job._id);

    if (jobIds.length === 0) {
      return res.json({
        applications: [],
        totalPages: 0,
        currentPage: parseInt(page),
        totalApplications: 0,
        statusBreakdown: {}
      });
    }

    const query = { job_id: { $in: jobIds } };
    if (status && status !== 'All') query.status = status;

    const applications = await Application.find(query)
      .populate("job_id", "title description budget category job_type work_setup")
      .populate("freelancer_id", "first_name last_name username email_address profile_picture skills experience_level years_of_experience rating")
      .sort({ applied_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Application.countDocuments(query);

    // Get status breakdown
    const statusBreakdown = await Application.aggregate([
      { $match: { job_id: { $in: jobIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const breakdown = {};
    statusBreakdown.forEach(item => {
      breakdown[item._id] = item.count;
    });

    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalApplications: total,
      statusBreakdown: breakdown
    });
  } catch (error) {
    console.error("Error fetching client applications:", error);
    res.status(500).json({ message: "Error fetching applications", error: error.message });
  }
});

// Upload resume for an existing application (Update)
router.post("/applications/:applicationId/upload-resume", authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
        } catch (e) {}
      }
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
        } catch (e) {}
      }
      return res.status(404).json({ message: "Application not found" });
    }

    // Check if user owns the application
    if (application.freelancer_id.toString() !== req.user.id) {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
        } catch (e) {}
      }
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    let resumeData = null;
    try {
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, req.file.mimetype);
      resumeData = {
        name: req.file.originalname,
        url: result.secure_url,
        mime_type: req.file.mimetype,
        size: req.file.size,
      };
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(`resumes/${req.file.filename}`);
        } catch (e) {}
      }
      return res.status(500).json({ message: "Failed to upload resume" });
    }

    // Update application with resume
    application.resume = resumeData;
    await application.save();

    res.json({
      message: "Resume uploaded successfully",
      resume: resumeData
    });
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).json({ message: "Error uploading resume", error: error.message });
  }
});

export default router;