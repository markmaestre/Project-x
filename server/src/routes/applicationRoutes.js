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
import Offer from "../models/Offer.js";
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

    const freelancer = await Freelancer.findById(req.user.id);
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
      proposed_rate: proposed_rate ? parseFloat(proposed_rate) : null,
      status: "pending",
      viewed_by_client: false,
    };

    if (education) {
      newApplicationData.education = education;
    }

    if (experiences && Array.isArray(experiences)) {
      newApplicationData.experiences = experiences;
    }

    const application = new Application(newApplicationData);
    await application.save();

    job.total_applicants += 1;
    await job.save();

    const populatedApplication = await Application.findById(application._id)
      .populate("job_id", "title budget_type budget_amount")
      .populate("freelancer_id", "first_name last_name username profile_picture");

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
      proposed_rate: proposed_rate ? parseFloat(proposed_rate) : null,
      status: "pending",
      viewed_by_client: false,
      resume: resumeData,
    };

    if (educationData) {
      newApplicationData.education = educationData;
    }

    if (experiencesData && Array.isArray(experiencesData)) {
      newApplicationData.experiences = experiencesData;
    }

    const application = new Application(newApplicationData);
    await application.save();

    job.total_applicants += 1;
    await job.save();

    const populatedApplication = await Application.findById(application._id)
      .populate("job_id", "title budget_type budget_amount")
      .populate("freelancer_id", "first_name last_name username profile_picture");

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
      .populate("job_id", "title description budget_type budget_amount required_skills work_setup")
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

// ==================== SAVED JOBS ROUTES ====================

// Save a job for later (Freelancer only)
router.post("/applications/save", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can save jobs" });
    }

    const { job_id } = req.body;

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

    const job = await Job.findById(job_id);
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
    });

    await savedJob.save();

    const populatedSavedJob = await SavedJob.findById(savedJob._id)
      .populate("job_id", "title description budget_type budget_amount required_skills work_setup urgency_level experience_level job_type client_id created_at")
      .populate({
        path: "job_id",
        populate: {
          path: "client_id",
          select: "first_name last_name company_name profile_picture"
        }
      });

    res.status(201).json({
      message: "Job saved successfully",
      job: populatedSavedJob.job_id
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

    const savedJobs = await SavedJob.find({ freelancer_id: req.user.id })
      .populate("job_id", "title description budget_type budget_amount required_skills work_setup urgency_level experience_level job_type client_id created_at")
      .populate({
        path: "job_id",
        populate: {
          path: "client_id",
          select: "first_name last_name company_name profile_picture"
        }
      })
      .sort({ saved_at: -1 });

    const validSavedJobs = savedJobs.filter(item => item.job_id !== null);
    const jobs = validSavedJobs.map(item => item.job_id);
    const total = await SavedJob.countDocuments({ freelancer_id: req.user.id });

    res.json({
      savedJobs: jobs,
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

    res.json({
      message: "Job removed from saved list",
      jobId: jobId
    });
  } catch (error) {
    console.error("Error unsaving job:", error);
    res.status(500).json({ message: "Error unsaving job", error: error.message });
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

    const job = await Job.findById(jobId);
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
      .populate("freelancer_id", "first_name last_name username email_address profile_picture skills experience_level hourly_rate bio_about_me resume resume_cv_url")
      .sort({ applied_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Application.countDocuments(query);

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
    const { status, interviewData } = req.body;

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    // Updated valid statuses - replaced 'accepted' with 'completed'
    const validStatuses = ["pending", "reviewed", "interview", "offered", "hired", "rejected", "completed"];
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
    if (status === 'interview' && interviewData) {
      application.interview_data = {
        scheduled_date: interviewData.scheduledDate,
        meeting_link: interviewData.meetingLink,
        notes: interviewData.notes,
        sent_at: new Date(),
      };
    }

    // If status is 'hired', update job status to 'in_progress'
    if (status === 'hired') {
      const job = await Job.findById(application.job_id._id);
      if (job && job.status === 'open') {
        job.status = 'in_progress';
        await job.save();
      }
    }

    // If status is 'completed', update job status to 'completed'
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

// Send offer to freelancer (Client only)
router.post("/applications/:applicationId/offer", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { amount, message } = req.body;

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid offer amount is required" });
    }

    const application = await Application.findById(applicationId)
      .populate("job_id", "client_id title description")
      .populate("freelancer_id", "_id first_name last_name email_address");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.job_id.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const existingOffer = await Offer.findOne({
      client_id: req.user.id,
      freelancer_id: application.freelancer_id._id,
      job_id: application.job_id._id,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingOffer) {
      return res.status(400).json({ message: "An offer already exists for this freelancer on this job" });
    }

    const offer = new Offer({
      client_id: req.user.id,
      freelancer_id: application.freelancer_id._id,
      job_id: application.job_id._id,
      amount: parseFloat(amount),
      message: message || null,
      status: "pending",
      viewed_by_freelancer: false,
      viewed_by_client: true,
    });

    await offer.save();

    application.status = "offered";
    application.offer_amount = parseFloat(amount);
    application.offer_message = message;
    application.offer_sent_at = new Date();
    await application.save();

    const populatedOffer = await Offer.findById(offer._id)
      .populate("freelancer_id", "first_name last_name username profile_picture")
      .populate("job_id", "title budget_type budget_amount");

    res.status(201).json({
      message: "Offer sent successfully",
      offer: populatedOffer,
      application
    });
  } catch (error) {
    console.error("Error sending offer:", error);
    res.status(500).json({ message: "Error sending offer", error: error.message });
  }
});

// Download resume from application (Client only)
router.get("/applications/:applicationId/resume", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const application = await Application.findById(applicationId).populate("job_id", "client_id");
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.job_id.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!application.resume || !application.resume.url) {
      return res.status(404).json({ message: "No resume uploaded" });
    }

    res.json({ 
      resume_url: application.resume.url,
      resume_name: application.resume.name 
    });
  } catch (error) {
    console.error("Error fetching resume:", error);
    res.status(500).json({ message: "Error fetching resume", error: error.message });
  }
});

// Mark job as completed (Client only)
router.patch("/jobs/:jobId/complete", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. This job does not belong to you." });
    }

    job.status = "completed";
    await job.save();

    // Update all applications for this job to 'completed'
    await Application.updateMany(
      { job_id: jobId, status: { $in: ['hired', 'offered'] } },
      { status: 'completed' }
    );

    res.json({
      message: "Job marked as completed",
      job
    });
  } catch (error) {
    console.error("Error completing job:", error);
    res.status(500).json({ message: "Error completing job", error: error.message });
  }
});

// Get all applications for a client's jobs (Client only)
router.get("/client/applications", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    const { status, page = 1, limit = 20 } = req.query;

    // Get all jobs for this client
    const jobs = await Job.find({ client_id: req.user.id }).select('_id');
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
      .populate("job_id", "title description budget_type budget_amount")
      .populate("freelancer_id", "first_name last_name username email_address profile_picture skills experience_level")
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
    console.error("Error fetching client applications:", error);
    res.status(500).json({ message: "Error fetching applications", error: error.message });
  }
});

export default router;