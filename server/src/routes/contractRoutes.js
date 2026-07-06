// routes/contractRoutes.js
import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Contract from "../models/Contract.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import ContractService from "../services/contractService.js";
import NotificationService from "../services/notificationService.js";

const router = express.Router();

// ==================== CLIENT & FREELANCER ROUTES ====================

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
      currentPage: page,
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
      currentPage: page,
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

    // Use ContractService
    const contract = await ContractService.updateProgress({
      contract_id: contractId,
      user_id: req.user.id,
      progress: progress
    });

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

    // Use ContractService
    const contract = await ContractService.completeContract({
      contract_id: contractId,
      user_id: req.user.id
    });

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

    if (contract.status === 'completed' || contract.status === 'cancelled') {
      return res.status(400).json({ message: "Contract is already completed or cancelled" });
    }

    contract.status = 'cancelled';
    contract.is_active = false;
    contract.end_date = new Date();
    await contract.save();

    // Update job
    await Job.findByIdAndUpdate(contract.job_id._id, {
      status: 'open',
      assigned_freelancer_id: null,
    });

    // Update application status back to pending
    if (contract.application_id) {
      await Application.findByIdAndUpdate(contract.application_id, {
        status: 'pending'
      });
    }

    // Notify both parties
    await NotificationService.createNotification({
      recipient_id: contract.client_id._id,
      recipient_model: 'Client',
      sender_id: contract.freelancer_id._id,
      sender_model: 'Freelancer',
      type: 'contract_cancelled',
      title: 'Contract Cancelled',
      message: `Project "${contract.job_id.title}" has been cancelled. Reason: ${reason || 'Not specified'}`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
    });

    await NotificationService.createNotification({
      recipient_id: contract.freelancer_id._id,
      recipient_model: 'Freelancer',
      sender_id: contract.client_id._id,
      sender_model: 'Client',
      type: 'contract_cancelled',
      title: 'Contract Cancelled',
      message: `Project "${contract.job_id.title}" has been cancelled. Reason: ${reason || 'Not specified'}`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
    });

    res.json({
      message: "Contract cancelled successfully",
      contract
    });
  } catch (error) {
    console.error("Error cancelling contract:", error);
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

    contract.status = 'paused';
    await contract.save();

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

    res.json({
      message: "Contract paused successfully",
      contract
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

    contract.status = 'active';
    await contract.save();

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

    res.json({
      message: "Contract resumed successfully",
      contract
    });
  } catch (error) {
    console.error("Error resuming contract:", error);
    res.status(500).json({ message: "Error resuming contract", error: error.message });
  }
});

// Get contract analytics for a client
router.get("/client/contract-analytics", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Clients only." });
    }

    const clientId = req.user.id;

    // Get all contracts for the client
    const contracts = await Contract.find({ client_id: clientId });
    
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const completedContracts = contracts.filter(c => c.status === 'completed').length;
    const cancelledContracts = contracts.filter(c => c.status === 'cancelled').length;
    const pausedContracts = contracts.filter(c => c.status === 'paused').length;

    // Calculate total budget
    const totalBudget = contracts.reduce((sum, contract) => {
      return sum + (contract.agreed_budget?.amount || 0);
    }, 0);

    // Get active contract details
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

    // Get all contracts for the freelancer
    const contracts = await Contract.find({ freelancer_id: freelancerId });
    
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const completedContracts = contracts.filter(c => c.status === 'completed').length;
    const cancelledContracts = contracts.filter(c => c.status === 'cancelled').length;
    const pausedContracts = contracts.filter(c => c.status === 'paused').length;

    // Calculate total earnings
    const totalEarnings = contracts.reduce((sum, contract) => {
      if (contract.status === 'completed') {
        return sum + (contract.agreed_budget?.amount || 0);
      }
      return sum;
    }, 0);

    // Calculate average rating from completed contracts
    // Note: You'll need to add a rating field to the contract or fetch from reviews

    res.json({
      analytics: {
        totalContracts,
        activeContracts,
        completedContracts,
        cancelledContracts,
        pausedContracts,
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