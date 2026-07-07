// routes/contractRoutes.js
import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Contract from "../models/Contract.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import ContractService from "../services/contractService.js";
import NotificationService from "../services/notificationService.js";
import { 
  uploadContractDocument, 
  uploadSignedDocument,
  cloudinary 
} from "../config/cloudinary.js";

const router = express.Router();

// ==================== HELPER: LOG ACTIVITY ====================
const logContractActivity = async (contractId, userId, userRole, type, message, data = null) => {
  try {
    const contract = await Contract.findById(contractId)
      .populate('client_id freelancer_id');
    
    if (!contract) return false;

    const isFreelancer = userRole === 'freelancer';
    const userModel = isFreelancer ? 'Freelancer' : 'Client';
    const userName = isFreelancer 
      ? (contract.freelancer_id?.first_name || 'Freelancer')
      : (contract.client_id?.first_name || 'Client');

    contract.activity_log.push({
      type: type,
      user_id: userId,
      user_model: userModel,
      user_name: userName,
      message: message,
      data: data,
    });

    await contract.save();
    console.log(`✅ Activity logged: ${message}`);
    return true;
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    return false;
  }
};

// ==================== HELPER: VALIDATE CONTRACT ====================
const validateContractAccess = async (contractId, userId, userRole) => {
  const contract = await Contract.findById(contractId)
    .populate('client_id freelancer_id');
  
  if (!contract) {
    return { error: "Contract not found", status: 404 };
  }

  const isClient = contract.client_id._id.toString() === userId;
  const isFreelancer = contract.freelancer_id._id.toString() === userId;

  if (!isClient && !isFreelancer && userRole !== 'admin') {
    return { error: "Unauthorized access to this contract", status: 403 };
  }

  return { contract, isClient, isFreelancer };
};

// ==================== FILE UPLOAD ROUTES ====================

// Upload contract document (Both client and freelancer)
router.post(
  "/contracts/:contractId/documents",
  authMiddleware,
  uploadContractDocument.single('document'),
  async (req, res) => {
    try {
      const { contractId } = req.params;
      const { description } = req.body;

      if (!mongoose.Types.ObjectId.isValid(contractId)) {
        if (req.file) {
          await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' });
        }
        return res.status(400).json({ message: "Invalid contract ID" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const contract = await ContractService.uploadContractDocument({
        contract_id: contractId,
        user_id: req.user.id,
        file: req.file,
        description: description || null,
        user_role: req.user.role
      });

      // Log document upload
      await logContractActivity(
        contractId,
        req.user.id,
        req.user.role,
        'file_upload',
        `${req.user.role === 'client' ? 'Client' : 'Freelancer'} uploaded document: "${req.file.originalname}"`,
        {
          file_name: req.file.originalname,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          description: description || null
        }
      );

      res.json({
        message: "Document uploaded successfully",
        contract
      });
    } catch (error) {
      console.error("Error uploading contract document:", error);
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' });
        } catch (e) {}
      }
      if (error.message === 'Unauthorized') {
        return res.status(403).json({ message: error.message });
      }
      if (error.message === 'Contract not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Error uploading document", error: error.message });
    }
  }
);

// Delete contract document
router.delete(
  "/contracts/:contractId/documents/:documentId",
  authMiddleware,
  async (req, res) => {
    try {
      const { contractId, documentId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(contractId) || 
          !mongoose.Types.ObjectId.isValid(documentId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Get the document name before deletion for logging
      const contract = await Contract.findById(contractId);
      const document = contract?.contract_documents?.find(d => d._id.toString() === documentId);
      const docName = document?.name || 'Unknown document';

      const updatedContract = await ContractService.deleteContractDocument({
        contract_id: contractId,
        document_id: documentId,
        user_id: req.user.id,
        user_role: req.user.role
      });

      // Log document deletion
      await logContractActivity(
        contractId,
        req.user.id,
        req.user.role,
        'file_upload',
        `${req.user.role === 'client' ? 'Client' : 'Freelancer'} deleted document: "${docName}"`,
        { deleted_document: docName }
      );

      res.json({
        message: "Document deleted successfully",
        contract: updatedContract
      });
    } catch (error) {
      console.error("Error deleting contract document:", error);
      if (error.message === 'Unauthorized') {
        return res.status(403).json({ message: error.message });
      }
      if (error.message === 'Contract not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Document not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Error deleting document", error: error.message });
    }
  }
);

// Upload signed document
router.post(
  "/contracts/:contractId/sign",
  authMiddleware,
  uploadSignedDocument.single('signed_document'),
  async (req, res) => {
    try {
      const { contractId } = req.params;
      const { signature_type } = req.body;

      if (!mongoose.Types.ObjectId.isValid(contractId)) {
        if (req.file) {
          await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' });
        }
        return res.status(400).json({ message: "Invalid contract ID" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No signed document uploaded" });
      }

      const contract = await ContractService.uploadSignedDocument({
        contract_id: contractId,
        user_id: req.user.id,
        file: req.file,
        signature_type: signature_type || 'electronic',
        user_role: req.user.role
      });

      // Log contract signing
      await logContractActivity(
        contractId,
        req.user.id,
        req.user.role,
        'file_upload',
        `${req.user.role === 'client' ? 'Client' : 'Freelancer'} signed contract`,
        {
          signature_type: signature_type || 'electronic',
          file_name: req.file.originalname
        }
      );

      res.json({
        message: "Contract signed successfully",
        contract
      });
    } catch (error) {
      console.error("Error signing contract:", error);
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' });
        } catch (e) {}
      }
      if (error.message === 'Unauthorized') {
        return res.status(403).json({ message: error.message });
      }
      if (error.message === 'Contract not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Error signing contract", error: error.message });
    }
  }
);

// ==================== CONTRACT MANAGEMENT ROUTES ====================

// Create contract (Client only)
router.post("/contracts", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Only clients can create contracts" });
    }

    const {
      job_id,
      freelancer_id,
      application_id,
      agreed_budget,
      terms,
      start_date,
      end_date,
      milestones
    } = req.body;

    // Validate required fields
    if (!job_id) {
      return res.status(400).json({ message: "Job ID is required" });
    }
    if (!freelancer_id) {
      return res.status(400).json({ message: "Freelancer ID is required" });
    }
    if (!application_id) {
      return res.status(400).json({ message: "Application ID is required" });
    }
    if (!agreed_budget || !agreed_budget.amount) {
      return res.status(400).json({ message: "Budget amount is required" });
    }

    // Check if contract already exists for this application
    const existingContract = await Contract.findOne({ application_id });
    if (existingContract) {
      return res.status(400).json({ 
        message: "A contract already exists for this application",
        contractId: existingContract._id 
      });
    }

    // Verify job ownership
    const job = await Job.findOne({ _id: job_id, client_id: req.user.id });
    if (!job) {
      return res.status(404).json({ message: "Job not found or you don't own it" });
    }

    const contract = await ContractService.createContract({
      job_id,
      client_id: req.user.id,
      freelancer_id,
      application_id,
      agreed_budget,
      terms: terms || null,
      start_date: start_date || null,
      end_date: end_date || null,
      milestones: milestones || []
    });

    // Log contract creation
    await logContractActivity(
      contract._id,
      req.user.id,
      'client',
      'contract_created',
      `Contract created for job "${job.title}"`,
      {
        job_title: job.title,
        budget_amount: agreed_budget.amount,
        budget_type: agreed_budget.type || 'fixed',
        freelancer_id: freelancer_id,
        start_date: start_date || null,
        end_date: end_date || null
      }
    );

    res.status(201).json({
      message: "Contract created successfully",
      contract
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ message: "Error creating contract", error: error.message });
  }
});

// Activate contract (Client only)
router.patch("/contracts/:contractId/activate", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Only clients can activate contracts" });
    }

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    // Get old status for logging
    const oldContract = await Contract.findById(contractId);
    const oldStatus = oldContract?.status || 'unknown';

    const contract = await ContractService.activateContract({
      contract_id: contractId,
      user_id: req.user.id
    });

    // Log activation
    await logContractActivity(
      contractId,
      req.user.id,
      'client',
      'contract_activated',
      `Contract "${contract.job_id?.title || 'Contract'}" activated`,
      {
        old_status: oldStatus,
        new_status: 'active',
        job_title: contract.job_id?.title || null
      }
    );

    res.json({
      message: "Contract activated successfully",
      contract
    });
  } catch (error) {
    console.error("Error activating contract:", error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Only the client can activate the contract') {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === 'Only draft or paused contracts can be activated') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Error activating contract", error: error.message });
  }
});

// Get all contracts for the authenticated freelancer
router.get("/freelancer/contracts", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Access denied. Freelancers only." });
    }

    const { status, page = 1, limit = 20 } = req.query;
    
    let query = { freelancer_id: req.user.id };
    if (status && status !== 'All') {
      query.status = status;
    }

    const contracts = await Contract.find(query)
      .populate("job_id", "title description budget category required_skills work_setup job_type")
      .populate("client_id", "first_name last_name company_name profile_picture rating")
      .populate("application_id", "cover_letter proposed_rate status")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contract.countDocuments(query);

    // Get status breakdown
    const statusBreakdown = await Contract.aggregate([
      { $match: { freelancer_id: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const breakdown = {};
    statusBreakdown.forEach(item => {
      breakdown[item._id] = item.count;
    });

    res.json({
      contracts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalContracts: total,
      statusBreakdown: breakdown
    });
  } catch (error) {
    console.error("Error fetching freelancer contracts:", error);
    res.status(500).json({ message: "Error fetching contracts", error: error.message });
  }
});

// Get all contracts for the authenticated client
router.get("/client/contracts", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    const { status, page = 1, limit = 20 } = req.query;
    
    let query = { client_id: req.user.id };
    if (status && status !== 'All') {
      query.status = status;
    }

    const contracts = await Contract.find(query)
      .populate("job_id", "title description budget category required_skills work_setup job_type")
      .populate("freelancer_id", "first_name last_name username profile_picture skills rating")
      .populate("application_id", "cover_letter proposed_rate status")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contract.countDocuments(query);

    // Get status breakdown
    const statusBreakdown = await Contract.aggregate([
      { $match: { client_id: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const breakdown = {};
    statusBreakdown.forEach(item => {
      breakdown[item._id] = item.count;
    });

    res.json({
      contracts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalContracts: total,
      statusBreakdown: breakdown
    });
  } catch (error) {
    console.error("Error fetching client contracts:", error);
    res.status(500).json({ message: "Error fetching contracts", error: error.message });
  }
});

// Get contract details by ID (Both client and freelancer)
router.get("/contracts/:contractId", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    const contract = await Contract.findById(contractId)
      .populate("job_id", "title description budget category required_skills work_setup job_type experience_level")
      .populate({
        path: "job_id",
        populate: {
          path: "client_id",
          select: "first_name last_name company_name profile_picture rating email_address phone_number"
        }
      })
      .populate("client_id", "first_name last_name company_name profile_picture rating email_address phone_number")
      .populate("freelancer_id", "first_name last_name username profile_picture skills experience_level years_of_experience hourly_rate bio_about_me rating portfolio")
      .populate("application_id", "cover_letter proposed_rate resume education experiences status");

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check authorization
    const isClient = contract.client_id._id.toString() === req.user.id;
    const isFreelancer = contract.freelancer_id._id.toString() === req.user.id;

    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ contract });
  } catch (error) {
    console.error("Error fetching contract:", error);
    res.status(500).json({ message: "Error fetching contract", error: error.message });
  }
});

// Update contract progress (Both client and freelancer)
router.patch("/contracts/:contractId/progress", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { progress } = req.body;

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    if (progress === undefined || progress === null) {
      return res.status(400).json({ message: "Progress value is required" });
    }

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ message: "Progress must be between 0 and 100" });
    }

    // Get old progress for logging
    const oldContract = await Contract.findById(contractId);
    const oldProgress = oldContract?.progress || 0;

    const contract = await ContractService.updateProgress({
      contract_id: contractId,
      user_id: req.user.id,
      progress: progress
    });

    // Log progress update
    await logContractActivity(
      contractId,
      req.user.id,
      req.user.role,
      'progress_update',
      `${req.user.role === 'client' ? 'Client' : 'Freelancer'} updated progress to ${progress}%`,
      {
        old_progress: oldProgress,
        new_progress: progress,
        percent_change: progress - oldProgress
      }
    );

    res.json({
      message: "Progress updated successfully",
      contract
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Error updating progress", error: error.message });
  }
});

// Complete contract (Both client and freelancer)
router.patch("/contracts/:contractId/complete", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    // Get old status for logging
    const oldContract = await Contract.findById(contractId);
    const oldStatus = oldContract?.status || 'unknown';

    const contract = await ContractService.completeContract({
      contract_id: contractId,
      user_id: req.user.id
    });

    // Log completion
    await logContractActivity(
      contractId,
      req.user.id,
      req.user.role,
      'contract_completed',
      `${req.user.role === 'client' ? 'Client' : 'Freelancer'} completed the contract`,
      {
        old_status: oldStatus,
        new_status: 'completed',
        job_title: contract.job_id?.title || null
      }
    );

    res.json({
      message: "Contract completed successfully",
      contract
    });
  } catch (error) {
    console.error("Error completing contract:", error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Error completing contract", error: error.message });
  }
});

// Cancel contract (Both client and freelancer)
router.patch("/contracts/:contractId/cancel", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    // Get old status for logging
    const oldContract = await Contract.findById(contractId);
    const oldStatus = oldContract?.status || 'unknown';

    const contract = await ContractService.cancelContract({
      contract_id: contractId,
      user_id: req.user.id,
      reason: reason || 'Cancelled by user'
    });

    // Log cancellation with reason
    await logContractActivity(
      contractId,
      req.user.id,
      req.user.role,
      'contract_cancelled',
      `${req.user.role === 'client' ? 'Client' : 'Freelancer'} cancelled the contract. Reason: ${reason || 'Not specified'}`,
      {
        old_status: oldStatus,
        new_status: 'cancelled',
        reason: reason || 'Not specified',
        job_title: contract.job_id?.title || null
      }
    );

    res.json({
      message: "Contract cancelled successfully",
      contract
    });
  } catch (error) {
    console.error("Error cancelling contract:", error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === 'Contract is already completed or cancelled') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Error cancelling contract", error: error.message });
  }
});

// Pause contract (Both client and freelancer)
router.patch("/contracts/:contractId/pause", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    const contract = await Contract.findById(contractId)
      .populate("client_id freelancer_id job_id");

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check authorization
    const isClient = contract.client_id._id.toString() === req.user.id;
    const isFreelancer = contract.freelancer_id._id.toString() === req.user.id;

    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    if (contract.status !== 'active') {
      return res.status(400).json({ message: "Only active contracts can be paused" });
    }

    const oldStatus = contract.status;
    contract.status = 'paused';
    contract.pause_reason = reason || 'Paused by user';
    await contract.save();

    // Log pause
    await logContractActivity(
      contractId,
      req.user.id,
      req.user.role,
      'contract_paused',
      `${req.user.role === 'client' ? 'Client' : 'Freelancer'} paused the contract. Reason: ${reason || 'Not specified'}`,
      {
        old_status: oldStatus,
        new_status: 'paused',
        reason: reason || 'Not specified',
        job_title: contract.job_id.title
      }
    );

    // Notify both parties
    await NotificationService.createNotification({
      recipient_id: contract.client_id._id,
      recipient_model: 'Client',
      sender_id: contract.freelancer_id._id,
      sender_model: 'Freelancer',
      type: 'contract_paused',
      title: 'Contract Paused',
      message: `Project "${contract.job_id.title}" has been paused. Reason: ${reason || 'Not specified'}`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'medium',
    });

    await NotificationService.createNotification({
      recipient_id: contract.freelancer_id._id,
      recipient_model: 'Freelancer',
      sender_id: contract.client_id._id,
      sender_model: 'Client',
      type: 'contract_paused',
      title: 'Contract Paused',
      message: `Project "${contract.job_id.title}" has been paused. Reason: ${reason || 'Not specified'}`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'medium',
    });

    const populatedContract = await Contract.findById(contract._id)
      .populate("job_id", "title description budget")
      .populate("freelancer_id", "first_name last_name username profile_picture")
      .populate("client_id", "first_name last_name company_name");

    res.json({
      message: "Contract paused successfully",
      contract: populatedContract
    });
  } catch (error) {
    console.error("Error pausing contract:", error);
    res.status(500).json({ message: "Error pausing contract", error: error.message });
  }
});

// Resume contract (Both client and freelancer)
router.patch("/contracts/:contractId/resume", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    const contract = await Contract.findById(contractId)
      .populate("client_id freelancer_id job_id");

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check authorization
    const isClient = contract.client_id._id.toString() === req.user.id;
    const isFreelancer = contract.freelancer_id._id.toString() === req.user.id;

    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    if (contract.status !== 'paused') {
      return res.status(400).json({ message: "Only paused contracts can be resumed" });
    }

    const oldStatus = contract.status;
    contract.status = 'active';
    contract.pause_reason = null;
    await contract.save();

    // Log resume
    await logContractActivity(
      contractId,
      req.user.id,
      req.user.role,
      'contract_resumed',
      `${req.user.role === 'client' ? 'Client' : 'Freelancer'} resumed the contract`,
      {
        old_status: oldStatus,
        new_status: 'active',
        job_title: contract.job_id.title
      }
    );

    // Notify both parties
    await NotificationService.createNotification({
      recipient_id: contract.client_id._id,
      recipient_model: 'Client',
      sender_id: contract.freelancer_id._id,
      sender_model: 'Freelancer',
      type: 'contract_resumed',
      title: 'Contract Resumed',
      message: `Project "${contract.job_id.title}" has been resumed`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'medium',
    });

    await NotificationService.createNotification({
      recipient_id: contract.freelancer_id._id,
      recipient_model: 'Freelancer',
      sender_id: contract.client_id._id,
      sender_model: 'Client',
      type: 'contract_resumed',
      title: 'Contract Resumed',
      message: `Project "${contract.job_id.title}" has been resumed`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'medium',
    });

    const populatedContract = await Contract.findById(contract._id)
      .populate("job_id", "title description budget")
      .populate("freelancer_id", "first_name last_name username profile_picture")
      .populate("client_id", "first_name last_name company_name");

    res.json({
      message: "Contract resumed successfully",
      contract: populatedContract
    });
  } catch (error) {
    console.error("Error resuming contract:", error);
    res.status(500).json({ message: "Error resuming contract", error: error.message });
  }
});

// ==================== MILESTONE ROUTES ====================

// Add milestone to contract (Client only)
router.post("/contracts/:contractId/milestones", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { title, description, due_date, amount } = req.body;

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Only clients can add milestones" });
    }

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    if (!title) {
      return res.status(400).json({ message: "Milestone title is required" });
    }
    if (!due_date) {
      return res.status(400).json({ message: "Milestone due date is required" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid milestone amount is required" });
    }

    const contract = await ContractService.addMilestone({
      contract_id: contractId,
      user_id: req.user.id,
      milestoneData: { title, description, due_date, amount },
      user_role: req.user.role
    });

    // Log milestone addition
    await logContractActivity(
      contractId,
      req.user.id,
      'client',
      'milestone_update',
      `Added milestone: "${title}" (₱${amount})`,
      {
        milestone_title: title,
        milestone_amount: amount,
        due_date: due_date,
        description: description || null
      }
    );

    res.json({
      message: "Milestone added successfully",
      contract
    });
  } catch (error) {
    console.error("Error adding milestone:", error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Unauthorized' || error.message === 'Only the client can add milestones') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Error adding milestone", error: error.message });
  }
});

// Update milestone status (Both client and freelancer)
router.patch("/contracts/:contractId/milestones/:milestoneId", authMiddleware, async (req, res) => {
  try {
    const { contractId, milestoneId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(contractId) || 
        !mongoose.Types.ObjectId.isValid(milestoneId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    if (!status || !['pending', 'in_progress', 'completed', 'overdue'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Get milestone info before update for logging
    const oldContract = await Contract.findById(contractId);
    const oldMilestone = oldContract?.milestones?.find(m => m._id.toString() === milestoneId);
    const oldStatus = oldMilestone?.status || 'unknown';
    const milestoneTitle = oldMilestone?.title || 'Unknown milestone';

    const contract = await ContractService.updateMilestoneStatus({
      contract_id: contractId,
      milestone_id: milestoneId,
      user_id: req.user.id,
      status: status,
      user_role: req.user.role
    });

    // Log milestone status update
    await logContractActivity(
      contractId,
      req.user.id,
      req.user.role,
      'milestone_update',
      `${req.user.role === 'client' ? 'Client' : 'Freelancer'} updated milestone "${milestoneTitle}" status to "${status}"`,
      {
        milestone_title: milestoneTitle,
        old_status: oldStatus,
        new_status: status,
        milestone_id: milestoneId
      }
    );

    res.json({
      message: "Milestone status updated successfully",
      contract
    });
  } catch (error) {
    console.error("Error updating milestone:", error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Milestone not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Error updating milestone", error: error.message });
  }
});

// ==================== CONTRACT ACTIVITY LOG ROUTE ====================

// Get contract activity log
router.get("/contracts/:contractId/activity", authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { limit = 20, skip = 0, type } = req.query;

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    const { error, contract, status: errorStatus } = 
      await validateContractAccess(contractId, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus || 400).json({ message: error });
    }

    // Get contract with activity log
    const contractWithLog = await Contract.findById(contractId)
      .select('activity_log');

    let activityLog = contractWithLog?.activity_log || [];

    // Filter by type if provided
    if (type) {
      activityLog = activityLog.filter(log => log.type === type);
    }

    // Sort by created_at descending
    activityLog = activityLog.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    // Paginate
    const total = activityLog.length;
    const paginated = activityLog.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.json({
      activity: paginated,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      hasMore: parseInt(skip) + parseInt(limit) < total,
      types: [...new Set(activityLog.map(log => log.type))]
    });
  } catch (error) {
    console.error("Error fetching contract activity:", error);
    res.status(500).json({ 
      message: "Error fetching contract activity", 
      error: error.message 
    });
  }
});

// ==================== CONTRACT ANALYTICS ====================

// Get contract analytics for a client
router.get("/client/contract-analytics", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    const clientId = req.user.id;

    const contracts = await Contract.find({ client_id: clientId });
    
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const completedContracts = contracts.filter(c => c.status === 'completed').length;
    const cancelledContracts = contracts.filter(c => c.status === 'cancelled').length;
    const pausedContracts = contracts.filter(c => c.status === 'paused').length;
    const draftContracts = contracts.filter(c => c.status === 'draft').length;

    const totalBudget = contracts.reduce((sum, contract) => {
      return sum + (contract.agreed_budget?.amount || 0);
    }, 0);

    const activeContractDetails = await Contract.find({ 
      client_id: clientId, 
      status: 'active' 
    })
      .populate("freelancer_id", "first_name last_name username profile_picture rating")
      .populate("job_id", "title");

    res.json({
      analytics: {
        totalContracts,
        activeContracts,
        completedContracts,
        cancelledContracts,
        pausedContracts,
        draftContracts,
        totalBudget,
        completionRate: totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 0,
      },
      activeContracts: activeContractDetails
    });
  } catch (error) {
    console.error("Error fetching contract analytics:", error);
    res.status(500).json({ message: "Error fetching contract analytics", error: error.message });
  }
});

// Get contract analytics for a freelancer
router.get("/freelancer/contract-analytics", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Access denied. Freelancers only." });
    }

    const freelancerId = req.user.id;

    const contracts = await Contract.find({ freelancer_id: freelancerId });
    
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const completedContracts = contracts.filter(c => c.status === 'completed').length;
    const cancelledContracts = contracts.filter(c => c.status === 'cancelled').length;
    const pausedContracts = contracts.filter(c => c.status === 'paused').length;
    const draftContracts = contracts.filter(c => c.status === 'draft').length;

    const totalEarnings = contracts.reduce((sum, contract) => {
      if (contract.status === 'completed') {
        return sum + (contract.agreed_budget?.amount || 0);
      }
      return sum;
    }, 0);

    res.json({
      analytics: {
        totalContracts,
        activeContracts,
        completedContracts,
        cancelledContracts,
        pausedContracts,
        draftContracts,
        totalEarnings,
        completionRate: totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 0,
      },
      recentContracts: contracts.slice(0, 5)
    });
  } catch (error) {
    console.error("Error fetching freelancer contract analytics:", error);
    res.status(500).json({ message: "Error fetching contract analytics", error: error.message });
  }
});

// Get contract by application ID (Helper route)
router.get("/contracts/application/:applicationId", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const contract = await Contract.findOne({ application_id: applicationId })
      .populate("job_id", "title description budget")
      .populate("client_id", "first_name last_name company_name profile_picture")
      .populate("freelancer_id", "first_name last_name username profile_picture");

    if (!contract) {
      return res.status(404).json({ message: "Contract not found for this application" });
    }

    // Check authorization
    const isClient = contract.client_id._id.toString() === req.user.id;
    const isFreelancer = contract.freelancer_id._id.toString() === req.user.id;

    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ contract });
  } catch (error) {
    console.error("Error fetching contract by application:", error);
    res.status(500).json({ message: "Error fetching contract", error: error.message });
  }
});

export default router;