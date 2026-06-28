// routes/contractRoutes.js
import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Contract from "../models/Contract.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================

// Check if user is authorized for contract
const checkContractAuthorization = async (contractId, userId, userRole) => {
  const contract = await Contract.findById(contractId);
  if (!contract) {
    return { error: "Contract not found", status: 404 };
  }

  const isClient = contract.client_id.toString() === userId;
  const isFreelancer = contract.freelancer_id.toString() === userId;

  if (!isClient && !isFreelancer && userRole !== 'admin') {
    return { error: "Unauthorized access to this contract", status: 403 };
  }

  return { contract, isClient, isFreelancer };
};

// ==================== CREATE CONTRACT ====================

// Create a new contract (Client only)
router.post("/contracts", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Only clients can create contracts" });
    }

    const {
      job_id,
      application_id,
      agreed_budget,
      start_date,
      end_date,
      terms
    } = req.body;

    // Validate required fields
    if (!job_id || !application_id) {
      return res.status(400).json({ 
        message: "Job ID and Application ID are required" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(job_id) || 
        !mongoose.Types.ObjectId.isValid(application_id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Get job and verify ownership
    const job = await Job.findOne({ _id: job_id, is_deleted: false });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.client_id.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: "You do not own this job" 
      });
    }

    // Get application and verify
    const application = await Application.findById(application_id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.job_id.toString() !== job_id) {
      return res.status(400).json({ 
        message: "Application does not belong to this job" 
      });
    }

    if (application.status !== "hired") {
      return res.status(400).json({ 
        message: "Application must be in 'hired' status to create a contract" 
      });
    }

    // Check if contract already exists for this application
    const existingContract = await Contract.findOne({ application_id });
    if (existingContract) {
      return res.status(400).json({ 
        message: "A contract already exists for this application" 
      });
    }

    // Create contract
    const contractData = {
      job_id,
      client_id: req.user.id,
      freelancer_id: application.freelancer_id,
      application_id,
      status: "active",
      agreed_budget: agreed_budget || {
        amount: application.proposed_rate || 0,
        type: job.budget?.type || "fixed",
        currency: job.budget?.currency || "PHP"
      },
      start_date: start_date || new Date(),
      end_date: end_date || null,
      terms: terms || null,
      progress: 0,
      is_active: true
    };

    const contract = new Contract(contractData);
    await contract.save();

    // Update job with assigned freelancer and status
    job.assigned_freelancer_id = application.freelancer_id;
    job.status = "in_progress";
    await job.save();

    // Update application status
    application.status = "completed";
    await application.save();

    // Populate contract for response
    const populatedContract = await Contract.findById(contract._id)
      .populate("job_id", "title description budget category")
      .populate("client_id", "first_name last_name company_name profile_picture")
      .populate("freelancer_id", "first_name last_name username profile_picture")
      .populate("application_id", "cover_letter proposed_rate");

    res.status(201).json({
      message: "Contract created successfully",
      contract: populatedContract
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ 
      message: "Error creating contract", 
      error: error.message 
    });
  }
});

// ==================== GET CONTRACTS ====================

// Get contracts for client
router.get("/client/contracts", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { client_id: req.user.id };
    
    if (status) query.status = status;

    const contracts = await Contract.find(query)
      .populate("job_id", "title description budget category")
      .populate("freelancer_id", "first_name last_name username profile_picture rating")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contract.countDocuments(query);

    res.json({
      contracts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalContracts: total
    });
  } catch (error) {
    console.error("Error fetching client contracts:", error);
    res.status(500).json({ 
      message: "Error fetching contracts", 
      error: error.message 
    });
  }
});

// Get contracts for freelancer
router.get("/freelancer/contracts", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Access denied. Freelancers only." });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { freelancer_id: req.user.id };
    
    if (status) query.status = status;

    const contracts = await Contract.find(query)
      .populate("job_id", "title description budget category")
      .populate("client_id", "first_name last_name company_name profile_picture rating")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contract.countDocuments(query);

    res.json({
      contracts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalContracts: total
    });
  } catch (error) {
    console.error("Error fetching freelancer contracts:", error);
    res.status(500).json({ 
      message: "Error fetching contracts", 
      error: error.message 
    });
  }
});

// Get single contract by ID
router.get("/contracts/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    const { error, contract, status: errorStatus } = 
      await checkContractAuthorization(id, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    const populatedContract = await Contract.findById(id)
      .populate("job_id", "title description budget category required_skills work_setup")
      .populate("client_id", "first_name last_name company_name profile_picture rating")
      .populate("freelancer_id", "first_name last_name username profile_picture rating")
      .populate("application_id", "cover_letter proposed_rate status");

    res.json({ contract: populatedContract });
  } catch (error) {
    console.error("Error fetching contract:", error);
    res.status(500).json({ 
      message: "Error fetching contract", 
      error: error.message 
    });
  }
});

// ==================== UPDATE CONTRACT ====================

// Update contract
router.put("/contracts/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    const { error, contract, isClient, status: errorStatus } = 
      await checkContractAuthorization(id, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    // Only client can update contract terms and budget
    if (!isClient && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Only the client can update contract details" 
      });
    }

    const updates = {};
    const allowedUpdates = ["agreed_budget", "terms", "end_date"];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.agreed_budget) {
      updates.agreed_budget = {
        amount: req.body.agreed_budget.amount || contract.agreed_budget.amount,
        type: req.body.agreed_budget.type || contract.agreed_budget.type,
        currency: req.body.agreed_budget.currency || contract.agreed_budget.currency
      };
    }

    const updatedContract = await Contract.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: "Contract updated successfully",
      contract: updatedContract
    });
  } catch (error) {
    console.error("Error updating contract:", error);
    res.status(500).json({ 
      message: "Error updating contract", 
      error: error.message 
    });
  }
});

// Update contract status
router.patch("/contracts/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    const validStatuses = ["active", "paused", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be one of: " + validStatuses.join(", ") 
      });
    }

    const { error, contract, isClient, isFreelancer, status: errorStatus } = 
      await checkContractAuthorization(id, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    // Both client and freelancer can update status
    // But we need to validate certain transitions
    if (status === "completed") {
      // Only client can mark as completed
      if (!isClient && req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: "Only the client can mark contract as completed" 
        });
      }
      contract.progress = 100;
    }

    if (status === "cancelled") {
      // Both can cancel but for different reasons
      contract.is_active = false;
    }

    contract.status = status;
    await contract.save();

    // Update job status based on contract status
    const job = await Job.findById(contract.job_id);
    if (job) {
      if (status === "completed") {
        job.status = "completed";
      } else if (status === "cancelled") {
        job.status = "cancelled";
      }
      await job.save();
    }

    res.json({
      message: `Contract status updated to ${status}`,
      contract
    });
  } catch (error) {
    console.error("Error updating contract status:", error);
    res.status(500).json({ 
      message: "Error updating contract status", 
      error: error.message 
    });
  }
});

// Update contract progress
router.patch("/contracts/:id/progress", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ 
        message: "Progress must be between 0 and 100" 
      });
    }

    const { error, contract, isClient, isFreelancer, status: errorStatus } = 
      await checkContractAuthorization(id, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    // Both client and freelancer can update progress
    contract.progress = progress;
    
    if (progress === 100) {
      contract.status = "completed";
      contract.is_active = false;
      
      // Update job
      const job = await Job.findById(contract.job_id);
      if (job) {
        job.status = "completed";
        await job.save();
      }
    }

    await contract.save();

    res.json({
      message: "Contract progress updated",
      contract
    });
  } catch (error) {
    console.error("Error updating contract progress:", error);
    res.status(500).json({ 
      message: "Error updating contract progress", 
      error: error.message 
    });
  }
});

// ==================== DELETE CONTRACT ====================

// Soft delete contract (Admin only or client with cancellation)
router.delete("/contracts/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }

    const { error, contract, status: errorStatus } = 
      await checkContractAuthorization(id, req.user.id, req.user.role);
    
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    // Only admin or client can delete
    if (req.user.role !== 'admin' && req.user.role !== 'client') {
      return res.status(403).json({ 
        message: "Only admins or clients can delete contracts" 
      });
    }

    // Soft delete by setting is_active to false
    contract.is_active = false;
    contract.status = "cancelled";
    await contract.save();

    res.json({
      message: "Contract cancelled successfully",
      contract
    });
  } catch (error) {
    console.error("Error deleting contract:", error);
    res.status(500).json({ 
      message: "Error deleting contract", 
      error: error.message 
    });
  }
});

// ==================== CONTRACT STATISTICS ====================

// Get contract statistics
router.get("/contracts/stats/dashboard", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === "client") {
      const query = { client_id: req.user.id };
      
      const total = await Contract.countDocuments(query);
      const active = await Contract.countDocuments({ ...query, status: "active" });
      const paused = await Contract.countDocuments({ ...query, status: "paused" });
      const completed = await Contract.countDocuments({ ...query, status: "completed" });
      const cancelled = await Contract.countDocuments({ ...query, status: "cancelled" });

      const contracts = await Contract.find(query);
      const totalBudget = contracts.reduce((sum, c) => 
        sum + (c.agreed_budget?.amount || 0), 0
      );
      const averageProgress = contracts.reduce((sum, c) => 
        sum + (c.progress || 0), 0
      ) / (contracts.length || 1);

      res.json({
        total,
        active,
        paused,
        completed,
        cancelled,
        totalBudget,
        averageProgress: Math.round(averageProgress)
      });
    } else if (req.user.role === "freelancer") {
      const query = { freelancer_id: req.user.id };
      
      const total = await Contract.countDocuments(query);
      const active = await Contract.countDocuments({ ...query, status: "active" });
      const completed = await Contract.countDocuments({ ...query, status: "completed" });

      const contracts = await Contract.find(query);
      const totalEarnings = contracts
        .filter(c => c.status === "completed")
        .reduce((sum, c) => sum + (c.agreed_budget?.amount || 0), 0);

      res.json({
        total,
        active,
        completed,
        totalEarnings
      });
    } else {
      res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    console.error("Error fetching contract statistics:", error);
    res.status(500).json({ 
      message: "Error fetching statistics", 
      error: error.message 
    });
  }
});

export default router;