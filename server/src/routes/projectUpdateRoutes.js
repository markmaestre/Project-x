// routes/projectUpdateRoutes.js
import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import ProjectUpdate from "../models/ProjectUpdate.js";
import Contract from "../models/Contract.js";
import Job from "../models/Job.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";
import { cloudinary, upload } from "../config/cloudinary.js";
import ProjectUpdateService from "../services/projectUpdateService.js";
import NotificationService from "../services/notificationService.js";

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================

// Check if user is authorized for project update
const checkUpdateAuthorization = async (updateId, userId, userRole) => {
  const update = await ProjectUpdate.findById(updateId);
  if (!update) {
    return { error: "Project update not found", status: 404 };
  }

  const isClient = update.client_id.toString() === userId;
  const isFreelancer = update.freelancer_id.toString() === userId;

  if (!isClient && !isFreelancer && userRole !== 'admin') {
    return { error: "Unauthorized access to this update", status: 403 };
  }

  return { update, isClient, isFreelancer };
};

// Check if contract is valid and active
const validateContract = async (contractId, userId, userRole) => {
  const contract = await Contract.findById(contractId);
  if (!contract) {
    return { error: "Contract not found", status: 404 };
  }

  if (contract.status !== "active") {
    return { error: "Contract is not active", status: 400 };
  }

  const isClient = contract.client_id.toString() === userId;
  const isFreelancer = contract.freelancer_id.toString() === userId;

  if (!isClient && !isFreelancer && userRole !== 'admin') {
    return { error: "Unauthorized access to this contract", status: 403 };
  }

  return { contract, isClient, isFreelancer };
};

// ==================== CREATE PROJECT UPDATE ====================

// Create a new project update (Client or Freelancer) - Using Service
router.post("/project-updates", authMiddleware, upload.array('attachments', 10), async (req, res) => {
  try {
    const {
      contract_id,
      job_id,
      title,
      description,
      update_type,
      status,
      delivery_status,
      progress,
      priority,
      freelancer_comment,
      client_comment,
      due_date
    } = req.body;

    // Validate required fields
    if (!contract_id || !job_id || !title) {
      return res.status(400).json({ 
        message: "Contract ID, Job ID, and Title are required" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(contract_id) || 
        !mongoose.Types.ObjectId.isValid(job_id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Validate contract
    const { error, contract, isClient, isFreelancer } = 
      await validateContract(contract_id, req.user.id, req.user.role);
    
    if (error) {
      return res.status(error.status || 400).json({ message: error });
    }

    // Validate job
    const job = await Job.findOne({ _id: job_id, is_deleted: false });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Process attachments
    const attachments = req.files ? req.files.map(file => ({
      file_name: file.originalname,
      file_url: file.path,
      public_id: file.filename,
      mime_type: file.mimetype,
      file_size: file.size,
      uploaded_by: req.user.id,
      uploaded_by_role: req.user.role,
      uploaded_at: new Date()
    })) : [];

    // Use ProjectUpdateService to create
    const projectUpdate = await ProjectUpdateService.createProjectUpdate({
      contract_id,
      job_id,
      client_id: contract.client_id,
      freelancer_id: contract.freelancer_id,
      title: title.trim(),
      description: description || "",
      update_type: update_type || "progress",
      attachments,
      created_by: req.user.id,
      created_by_role: req.user.role,
      due_date: due_date ? new Date(due_date) : null,
      priority: priority || "normal"
    });

    // Update additional fields if provided
    if (status) {
      projectUpdate.status = status;
    }
    if (delivery_status) {
      projectUpdate.delivery_status = delivery_status;
    }
    if (progress !== undefined) {
      projectUpdate.progress = Math.min(100, Math.max(0, progress));
    }
    if (freelancer_comment) {
      projectUpdate.freelancer_comment = freelancer_comment;
    }
    if (client_comment) {
      projectUpdate.client_comment = client_comment;
    }
    await projectUpdate.save();

    // Update contract progress if progress is provided
    if (progress !== undefined && progress > contract.progress) {
      contract.progress = progress;
      if (progress === 100) {
        contract.status = "completed";
      }
      await contract.save();
    }

    // Populate for response
    const populatedUpdate = await ProjectUpdate.findById(projectUpdate._id)
      .populate("contract_id", "status progress agreed_budget")
      .populate("job_id", "title description budget category")
      .populate("client_id", "first_name last_name company_name profile_picture")
      .populate("freelancer_id", "first_name last_name username profile_picture")
      .populate("created_by", "first_name last_name username");

    res.status(201).json({
      message: "Project update created successfully",
      projectUpdate: populatedUpdate
    });
  } catch (error) {
    console.error("Error creating project update:", error);
    res.status(500).json({ 
      message: "Error creating project update", 
      error: error.message 
    });
  }
});

// ==================== GET PROJECT UPDATES ====================

// Get all project updates for a contract
router.get("/contracts/:contractId/updates", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { page = 1, limit = 20, status, update_type } = req.query;

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    // Validate contract and authorization
    const { error, contract, status: errorStatus } = 
      await validateContract(contractId, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus || 400).json({ message: error });
    }

    const query = { contract_id: contractId };
    if (status) query.status = status;
    if (update_type) query.update_type = update_type;

    const updates = await ProjectUpdate.find(query)
      .populate("client_id", "first_name last_name company_name profile_picture")
      .populate("freelancer_id", "first_name last_name username profile_picture")
      .populate("created_by", "first_name last_name username")
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProjectUpdate.countDocuments(query);

    res.json({
      projectUpdates: updates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUpdates: total
    });
  } catch (error) {
    console.error("Error fetching project updates:", error);
    res.status(500).json({ 
      message: "Error fetching project updates", 
      error: error.message 
    });
  }
});

// Get all project updates for a job
router.get("/jobs/:jobId/updates", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findOne({ _id: jobId, is_deleted: false });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check authorization
    const isClient = job.client_id.toString() === req.user.id;
    const isFreelancer = job.assigned_freelancer_id && 
      job.assigned_freelancer_id.toString() === req.user.id;

    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Unauthorized to view updates for this job" 
      });
    }

    const query = { job_id: jobId };

    const updates = await ProjectUpdate.find(query)
      .populate("contract_id", "status progress")
      .populate("client_id", "first_name last_name company_name")
      .populate("freelancer_id", "first_name last_name username")
      .populate("created_by", "first_name last_name username")
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProjectUpdate.countDocuments(query);

    res.json({
      projectUpdates: updates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUpdates: total
    });
  } catch (error) {
    console.error("Error fetching job updates:", error);
    res.status(500).json({ 
      message: "Error fetching job updates", 
      error: error.message 
    });
  }
});

// Get all project updates for a freelancer
router.get("/freelancer/updates", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ 
        message: "Access denied. Freelancers only." 
      });
    }

    const { page = 1, limit = 20, status } = req.query;
    const query = { freelancer_id: req.user.id };
    if (status) query.status = status;

    const updates = await ProjectUpdate.find(query)
      .populate("contract_id", "status progress")
      .populate("job_id", "title description budget category")
      .populate("client_id", "first_name last_name company_name")
      .populate("created_by", "first_name last_name username")
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProjectUpdate.countDocuments(query);

    res.json({
      projectUpdates: updates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUpdates: total
    });
  } catch (error) {
    console.error("Error fetching freelancer updates:", error);
    res.status(500).json({ 
      message: "Error fetching updates", 
      error: error.message 
    });
  }
});

// Get all project updates for a client
router.get("/client/updates", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ 
        message: "Access denied. Clients only." 
      });
    }

    const { page = 1, limit = 20, status } = req.query;
    const query = { client_id: req.user.id };
    if (status) query.status = status;

    const updates = await ProjectUpdate.find(query)
      .populate("contract_id", "status progress")
      .populate("job_id", "title description budget category")
      .populate("freelancer_id", "first_name last_name username")
      .populate("created_by", "first_name last_name username")
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProjectUpdate.countDocuments(query);

    res.json({
      projectUpdates: updates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUpdates: total
    });
  } catch (error) {
    console.error("Error fetching client updates:", error);
    res.status(500).json({ 
      message: "Error fetching updates", 
      error: error.message 
    });
  }
});

// Get single project update by ID - Using Service
router.get("/project-updates/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid update ID" });
    }

    const { error, update, status: errorStatus } = 
      await checkUpdateAuthorization(id, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    const populatedUpdate = await ProjectUpdate.findById(id)
      .populate("contract_id", "status progress agreed_budget terms")
      .populate("job_id", "title description budget category required_skills")
      .populate("client_id", "first_name last_name company_name profile_picture rating")
      .populate("freelancer_id", "first_name last_name username profile_picture rating")
      .populate("created_by", "first_name last_name username")
      .populate("last_updated_by", "first_name last_name username");

    res.json({ projectUpdate: populatedUpdate });
  } catch (error) {
    console.error("Error fetching project update:", error);
    res.status(500).json({ 
      message: "Error fetching project update", 
      error: error.message 
    });
  }
});

// ==================== UPDATE PROJECT UPDATE ====================

// Update project update status - Using Service
router.patch("/project-updates/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid update ID" });
    }

    const validStatuses = ["pending", "in_progress", "completed", "blocked", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be one of: " + validStatuses.join(", ") 
      });
    }

    // Use ProjectUpdateService
    const updatedUpdate = await ProjectUpdateService.updateProjectStatus({
      project_update_id: id,
      status: status,
      user_id: req.user.id,
      comment: comment || null
    });

    res.json({
      message: `Project update status updated to ${status}`,
      projectUpdate: updatedUpdate
    });
  } catch (error) {
    console.error("Error updating project update status:", error);
    if (error.message === 'Project update not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ 
      message: "Error updating status", 
      error: error.message 
    });
  }
});

// Update delivery status - Using Service
router.patch("/project-updates/:id/delivery", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_status, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid update ID" });
    }

    const validStatuses = ["not_submitted", "submitted", "approved", "revision_requested"];
    if (!validStatuses.includes(delivery_status)) {
      return res.status(400).json({ 
        message: "Invalid delivery status. Must be one of: " + validStatuses.join(", ") 
      });
    }

    const { error, update, isClient, isFreelancer, status: errorStatus } = 
      await checkUpdateAuthorization(id, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    // Validate who can update delivery status
    if (delivery_status === "submitted" && !isFreelancer) {
      return res.status(403).json({ 
        message: "Only freelancer can submit for review" 
      });
    }

    if ((delivery_status === "approved" || delivery_status === "revision_requested") && !isClient) {
      return res.status(403).json({ 
        message: "Only client can approve or request revision" 
      });
    }

    // Use ProjectUpdateService to update
    const updatedUpdate = await ProjectUpdateService.updateProjectStatus({
      project_update_id: id,
      status: delivery_status === "approved" ? "completed" : "in_progress",
      user_id: req.user.id,
      comment: comment || null
    });

    // Update delivery status
    updatedUpdate.delivery_status = delivery_status;
    if (delivery_status === "approved") {
      updatedUpdate.completed_at = new Date();
      updatedUpdate.progress = 100;
      
      // Update contract
      const contract = await Contract.findById(updatedUpdate.contract_id);
      if (contract) {
        contract.progress = 100;
        contract.status = "completed";
        await contract.save();
      }
    }
    await updatedUpdate.save();

    res.json({
      message: `Delivery status updated to ${delivery_status}`,
      projectUpdate: updatedUpdate
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ 
      message: "Error updating delivery status", 
      error: error.message 
    });
  }
});

// ==================== ATTACHMENT MANAGEMENT ====================

// Delete attachment from project update
router.delete("/project-updates/:updateId/attachments/:attachmentId", authMiddleware, async (req, res) => {
  try {
    const { updateId, attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(updateId)) {
      return res.status(400).json({ message: "Invalid update ID" });
    }

    const { error, update, isClient, isFreelancer, status: errorStatus } = 
      await checkUpdateAuthorization(updateId, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    // Find attachment
    const attachmentIndex = update.attachments.findIndex(
      a => a._id.toString() === attachmentId
    );

    if (attachmentIndex === -1) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const attachment = update.attachments[attachmentIndex];

    // Check if user uploaded the attachment
    if (attachment.uploaded_by.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "You can only delete your own attachments" 
      });
    }

    // Delete from Cloudinary if public_id exists
    if (attachment.public_id) {
      try {
        await cloudinary.uploader.destroy(attachment.public_id);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Remove attachment
    update.attachments.splice(attachmentIndex, 1);
    update.last_updated_by = req.user.id;
    await update.save();

    res.json({
      message: "Attachment deleted successfully",
      projectUpdate: update
    });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ 
      message: "Error deleting attachment", 
      error: error.message 
    });
  }
});

// ==================== PROJECT UPDATE STATISTICS ====================

// Get project update statistics
router.get("/project-updates/stats/:contractId", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    const { error, contract, status: errorStatus } = 
      await validateContract(contractId, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus || 400).json({ message: error });
    }

    const query = { contract_id: contractId };
    
    const total = await ProjectUpdate.countDocuments(query);
    const completed = await ProjectUpdate.countDocuments({ ...query, status: "completed" });
    const inProgress = await ProjectUpdate.countDocuments({ ...query, status: "in_progress" });
    const blocked = await ProjectUpdate.countDocuments({ ...query, status: "blocked" });
    const pending = await ProjectUpdate.countDocuments({ ...query, status: "pending" });

    // Get update type breakdown
    const typeBreakdown = await ProjectUpdate.aggregate([
      { $match: query },
      { $group: { _id: "$update_type", count: { $sum: 1 } } }
    ]);

    const breakdown = {};
    typeBreakdown.forEach(item => {
      breakdown[item._id] = item.count;
    });

    // Get recent updates
    const recentUpdates = await ProjectUpdate.find(query)
      .sort({ created_at: -1 })
      .limit(5)
      .populate("created_by", "first_name last_name username");

    res.json({
      total,
      completed,
      inProgress,
      blocked,
      pending,
      typeBreakdown: breakdown,
      contractProgress: contract.progress || 0,
      recentUpdates
    });
  } catch (error) {
    console.error("Error fetching project update statistics:", error);
    res.status(500).json({ 
      message: "Error fetching statistics", 
      error: error.message 
    });
  }
});

// ==================== ADD COMMENT TO UPDATE ====================

// Add comment to project update
router.post("/project-updates/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid update ID" });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const { error, update, isClient, isFreelancer, status: errorStatus } = 
      await checkUpdateAuthorization(id, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    // Add comment based on role
    if (isFreelancer) {
      update.freelancer_comment = comment.trim();
    } else if (isClient) {
      update.client_comment = comment.trim();
    } else {
      return res.status(403).json({ message: "Unauthorized to comment" });
    }

    update.last_updated_by = req.user.id;
    await update.save();

    // Notify the other party
    const recipient_id = isFreelancer ? update.client_id : update.freelancer_id;
    const recipient_model = isFreelancer ? 'Client' : 'Freelancer';
    const sender_id = req.user.id;
    const sender_model = isFreelancer ? 'Freelancer' : 'Client';

    await NotificationService.createNotification({
      recipient_id,
      recipient_model,
      sender_id,
      sender_model,
      type: 'project_update_comment',
      title: 'New Comment on Project Update',
      message: `${req.user.role} added a comment: "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`,
      reference_id: update._id,
      reference_model: 'ProjectUpdate',
      priority: 'medium'
    });

    res.json({
      message: "Comment added successfully",
      projectUpdate: update
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ 
      message: "Error adding comment", 
      error: error.message 
    });
  }
});

export default router;