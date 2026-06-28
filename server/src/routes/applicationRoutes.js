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

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX are allowed.'), false);
    }
  }
});

// Helper function to upload file to Cloudinary from buffer
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

// ==================== FREELANCER ROUTES ====================

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

    const freelancer = await Freelander.findById(req.user.id);
    if (!freelancer) {
      return res.status(404).json({ message: "Freelancer not found" });
    }

    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.status !== "open") {
      return res.status(400).json({ message: "This job is no longer accepting applications" });
    }

    const existingApplication = await Application.findOne({
      job_id,
      freelancer_id: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    const newApplicationData = {
      job_id,
      freelancer_id: req.user.id,
      cover_letter: cover_letter.trim(),
      proposed_rate: proposed_rate ? parseFloat(proposed_rate) : 0,
      status: "pending",
      viewed_by_client: false,
    };

    // Handle education if provided
    if (education) {
      if (typeof education === 'string') {
        try {
          newApplicationData.education = JSON.parse(education);
        } catch (e) {
          newApplicationData.education = education;
        }
      } else {
        newApplicationData.education = education;
      }
    }

    // Handle experiences if provided
    if (experiences) {
      if (typeof experiences === 'string') {
        try {
          newApplicationData.experiences = JSON.parse(experiences);
        } catch (e) {
          // If parsing fails, treat as single experience
          newApplicationData.experiences = [experiences];
        }
      } else if (Array.isArray(experiences)) {
        newApplicationData.experiences = experiences;
      } else {
        newApplicationData.experiences = [experiences];
      }
    }

    const application = new Application(newApplicationData);
    await application.save();

    // Update job analytics
    job.analytics.applications = (job.analytics.applications || 0) + 1;
    await job.save();

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
    
    if (req.user.role !== "freelancer") {
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(403).json({ message: "Only freelancers can apply for jobs" });
    }

    let educationData = null;
    let experiencesData = null;
    
    if (req.body.education) {
      try {
        educationData = JSON.parse(req.body.education);
      } catch (e) {
        educationData = req.body.education;
      }
    }
    
    if (req.body.experiences) {
      try {
        experiencesData = JSON.parse(req.body.experiences);
      } catch (e) {
        experiencesData = req.body.experiences;
      }
    }

    const { job_id, cover_letter, proposed_rate } = req.body;

    if (!job_id) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ message: "Job ID is required" });
    }
    if (!cover_letter || !cover_letter.trim()) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ message: "Cover letter is required" });
    }

    const freelancer = await Freelancer.findById(req.user.id);
    if (!freelancer) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(404).json({ message: "Freelancer not found" });
    }

    const job = await Job.findById(job_id);
    if (!job) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.status !== "open") {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ message: "This job is no longer accepting applications" });
    }

    const existingApplication = await Application.findOne({
      job_id,
      freelancer_id: req.user.id
    });

    if (existingApplication) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    let resumeData = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, req.file.mimetype);
        resumeData = {
          name: req.file.originalname,
          url: result.secure_url,
          public_id: result.public_id,
          mime_type: req.file.mimetype,
          size: req.file.size,
        };
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload resume" });
      }
    }

    const newApplicationData = {
      job_id,
      freelancer_id: req.user.id,
      cover_letter: cover_letter.trim(),
      proposed_rate: proposed_rate ? parseFloat(proposed_rate) : 0,
      status: "pending",
      viewed_by_client: false,
      resume: resumeData,
    };

    if (educationData) {
      newApplicationData.education = educationData;
    }

    if (experiencesData) {
      if (Array.isArray(experiencesData)) {
        newApplicationData.experiences = experiencesData;
      } else {
        newApplicationData.experiences = [experiencesData];
      }
    }

    const application = new Application(newApplicationData);
    await application.save();

    // Update job analytics
    job.analytics.applications = (job.analytics.applications || 0) + 1;
    await job.save();

    const populatedApplication = await Application.findById(application._id)
      .populate("job_id", "title budget category job_type work_setup")
      .populate("freelancer_id", "first_name last_name username profile_picture rating");

    res.status(201).json({
      message: "Application submitted successfully",
      application: populatedApplication
    });
  } catch (error) {
    console.error("Error creating application with resume:", error);
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (e) {}
    }
    res.status(500).json({ message: "Error submitting application", error: error.message });
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
      currentPage: page,
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

// ==================== SAVED JOBS ROUTES ====================

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
      currentPage: page,
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

// ==================== CLIENT ROUTES ====================

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
      currentPage: page,
      totalApplications: total
    });
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({ message: "Error fetching applications", error: error.message });
  }
});

// Update application status (Client only)
router.patch("/applications/:applicationId/status", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, interview } = req.body;

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

    const application = await Application.findById(applicationId)
      .populate("job_id", "client_id title status")
      .populate("freelancer_id", "first_name last_name email_address");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.job_id.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    application.status = status;
    
    // If status is 'interview', save interview data
    if (status === 'interview' && interview) {
      application.interview = {
        scheduled_date: interview.scheduled_date ? new Date(interview.scheduled_date) : null,
        meeting_link: interview.meeting_link || null,
        notes: interview.notes || null,
        sent_at: new Date(),
      };
    }

    // If status is 'offered', update offer data
    if (status === 'offered' && req.body.offer) {
      application.offer = {
        amount: req.body.offer.amount || null,
        message: req.body.offer.message || null,
        sent_at: new Date(),
      };
    }

    // If status is 'hired', update job status to 'in_progress' and assign freelancer
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

    await application.save();

    res.json({ 
      message: `Application status updated to ${status}`, 
      application 
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Error updating application status", error: error.message });
  }
});

// Get application details (Client or Freelancer)
router.get("/applications/:applicationId", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const application = await Application.findById(applicationId)
      .populate("job_id", "title description budget category required_skills work_setup job_type experience_level")
      .populate({
        path: "job_id",
        populate: {
          path: "client_id",
          select: "first_name last_name company_name profile_picture rating"
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

    res.json({ application });
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
        currentPage: page,
        totalApplications: 0
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
      currentPage: page,
      totalApplications: total,
      statusBreakdown: breakdown
    });
  } catch (error) {
    console.error("Error fetching client applications:", error);
    res.status(500).json({ message: "Error fetching applications", error: error.message });
  }
});

export default router;