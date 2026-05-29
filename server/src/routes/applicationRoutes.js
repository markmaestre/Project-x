// routes/applicationRoutes.js
import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";
import Offer from "../models/Offer.js";

const router = express.Router();

// Helper function to check if freelancer owns the application
const checkApplicationOwnership = async (applicationId, freelancerId) => {
  const application = await Application.findById(applicationId);
  if (!application) return { error: "Application not found", status: 404 };
  if (application.freelancer_id.toString() !== freelancerId.toString()) {
    return { error: "Unauthorized: You do not own this application", status: 403 };
  }
  return { application };
};

// ==================== FREELANCER ROUTES ====================

// Apply for a job (Freelancer only)
router.post("/applications", authMiddleware, async (req, res) => {
  try {
    // Check if user is a freelancer
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ 
        message: "Only freelancers can apply for jobs" 
      });
    }

    const { job_id, cover_letter, proposed_rate } = req.body;

    // Validate required fields
    if (!job_id) {
      return res.status(400).json({ message: "Job ID is required" });
    }
    if (!cover_letter || !cover_letter.trim()) {
      return res.status(400).json({ message: "Cover letter is required" });
    }

    // Verify freelancer exists
    const freelancer = await Freelancer.findById(req.user.id);
    if (!freelancer) {
      return res.status(404).json({ message: "Freelancer not found" });
    }

    // Verify job exists and is open
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.status !== "open") {
      return res.status(400).json({ message: "This job is no longer accepting applications" });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job_id,
      freelancer_id: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    const applicationData = {
      job_id,
      freelancer_id: req.user.id,
      cover_letter: cover_letter.trim(),
      proposed_rate: proposed_rate ? parseFloat(proposed_rate) : null,
      status: "pending",
      viewed_by_client: false,
    };

    const application = new Application(applicationData);
    await application.save();

    // Increment applicants count on job
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
    res.status(500).json({ 
      message: "Error submitting application", 
      error: error.message 
    });
  }
});

// Get freelancer's own applications
router.get("/freelancer/applications", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ 
        message: "Access denied. Freelancers only." 
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { freelancer_id: req.user.id };
    
    if (status) query.status = status;

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
    res.status(500).json({ 
      message: "Error fetching applications", 
      error: error.message 
    });
  }
});

// ==================== CLIENT ROUTES ====================

// Get applications for a specific job (Client only)
router.get("/jobs/:jobId/applications", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    if (req.user.role !== "client") {
      return res.status(403).json({ 
        message: "Access denied. Clients only." 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    // Verify job belongs to client
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. This job does not belong to you." });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { job_id: jobId };
    
    if (status) query.status = status;

    const applications = await Application.find(query)
      .populate("freelancer_id", "first_name last_name username email_address profile_picture skills experience_level hourly_rate bio_about_me")
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
    res.status(500).json({ 
      message: "Error fetching applications", 
      error: error.message 
    });
  }
});

// Update application status (Client only)
router.patch("/applications/:applicationId/status", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (req.user.role !== "client") {
      return res.status(403).json({ 
        message: "Access denied. Clients only." 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const validStatuses = ["pending", "reviewed", "offered", "rejected", "accepted"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be one of: " + validStatuses.join(", ") 
      });
    }

    const application = await Application.findById(applicationId)
      .populate("job_id", "client_id title");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify job belongs to client
    if (application.job_id.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    application.status = status;
    await application.save();

    res.json({
      message: `Application status updated to ${status}`,
      application
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ 
      message: "Error updating application status", 
      error: error.message 
    });
  }
});

// Send offer to freelancer (Client only)
router.post("/applications/:applicationId/offer", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { amount, message } = req.body;

    if (req.user.role !== "client") {
      return res.status(403).json({ 
        message: "Access denied. Clients only." 
      });
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

    // Verify job belongs to client
    if (application.job_id.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if offer already exists
    const existingOffer = await Offer.findOne({
      client_id: req.user.id,
      freelancer_id: application.freelancer_id._id,
      job_id: application.job_id._id,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingOffer) {
      return res.status(400).json({ message: "An offer already exists for this freelancer on this job" });
    }

    // Create offer
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

    // Update application status
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
    res.status(500).json({ 
      message: "Error sending offer", 
      error: error.message 
    });
  }
});

export default router;