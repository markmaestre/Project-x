// routes/offerRoutes.js
import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Offer from "../models/Offer.js";
import Job from "../models/Job.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";

const router = express.Router();

// Helper function to check if client owns the offer
const checkClientOfferOwnership = async (offerId, clientId) => {
  const offer = await Offer.findById(offerId);
  if (!offer) return { error: "Offer not found", status: 404 };
  if (offer.client_id.toString() !== clientId.toString()) {
    return { error: "Unauthorized: You do not own this offer", status: 403 };
  }
  return { offer };
};

// Helper function to check if freelancer owns the offer
const checkFreelancerOfferOwnership = async (offerId, freelancerId) => {
  const offer = await Offer.findById(offerId);
  if (!offer) return { error: "Offer not found", status: 404 };
  if (offer.freelancer_id.toString() !== freelancerId.toString()) {
    return { error: "Unauthorized: This offer is not for you", status: 403 };
  }
  return { offer };
};

// ==================== CLIENT ROUTES ====================

// Create a new offer (Client only)
router.post("/offers", authMiddleware, async (req, res) => {
  try {
    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({ 
        message: "Only clients can create offers" 
      });
    }

    const { freelancer_id, job_id, amount, message } = req.body;

    // Validate required fields
    if (!freelancer_id) {
      return res.status(400).json({ message: "Freelancer ID is required" });
    }
    if (!job_id) {
      return res.status(400).json({ message: "Job ID is required" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    // Verify client exists
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Verify freelancer exists
    const freelancer = await Freelancer.findById(freelancer_id);
    if (!freelancer) {
      return res.status(404).json({ message: "Freelancer not found" });
    }

    // Verify job exists and belongs to client
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "You don't own this job" });
    }

    // Check if offer already exists for this job and freelancer
    const existingOffer = await Offer.findOne({
      client_id: req.user.id,
      freelancer_id,
      job_id,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingOffer) {
      return res.status(400).json({ 
        message: "An offer already exists for this freelancer on this job" 
      });
    }

    const offerData = {
      client_id: req.user.id,
      freelancer_id,
      job_id,
      amount: parseFloat(amount),
      message: message || null,
      status: "pending",
      viewed_by_freelancer: false,
      viewed_by_client: true,
    };

    const offer = new Offer(offerData);
    await offer.save();

    // Populate the response
    const populatedOffer = await Offer.findById(offer._id)
      .populate("freelancer_id", "first_name last_name username profile_picture")
      .populate("job_id", "title budget_type budget_amount");

    res.status(201).json({
      message: "Offer sent successfully",
      offer: populatedOffer
    });
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ 
      message: "Error creating offer", 
      error: error.message 
    });
  }
});

// Get all offers sent by the authenticated client
router.get("/offers/sent", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ 
        message: "Access denied. Clients only." 
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { client_id: req.user.id };
    
    if (status) query.status = status;

    const offers = await Offer.find(query)
      .populate("freelancer_id", "first_name last_name username profile_picture skills")
      .populate("job_id", "title budget_type budget_amount")
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Offer.countDocuments(query);

    // Format the response
    const formattedOffers = offers.map(offer => ({
      _id: offer._id,
      client_id: offer.client_id,
      freelancer_id: offer.freelancer_id._id,
      freelancer_name: `${offer.freelancer_id.first_name} ${offer.freelancer_id.last_name}`,
      freelancer_first_name: offer.freelancer_id.first_name,
      freelancer_last_name: offer.freelancer_id.last_name,
      freelancer_username: offer.freelancer_id.username,
      freelancer_profile_picture: offer.freelancer_id.profile_picture,
      freelancer_skills: offer.freelancer_id.skills,
      job_id: offer.job_id._id,
      job_title: offer.job_id.title,
      amount: offer.amount,
      message: offer.message,
      status: offer.status,
      expiry_date: offer.expiry_date,
      viewed_by_freelancer: offer.viewed_by_freelancer,
      viewed_by_client: offer.viewed_by_client,
      created_at: offer.created_at,
      updated_at: offer.updated_at,
      responded_at: offer.responded_at,
    }));

    res.json({
      offers: formattedOffers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalOffers: total
    });
  } catch (error) {
    console.error("Error fetching sent offers:", error);
    res.status(500).json({ 
      message: "Error fetching offers", 
      error: error.message 
    });
  }
});

// Get a single offer by ID (Client)
router.get("/offers/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid offer ID" });
    }

    const offer = await Offer.findById(id)
      .populate("freelancer_id", "first_name last_name username email_address profile_picture skills experience_level hourly_rate bio_about_me")
      .populate("job_id", "title description required_skills budget_type budget_amount estimated_duration")
      .populate("client_id", "first_name last_name company_name");

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Check authorization
    if (req.user.role === "client" && offer.client_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "freelancer" && offer.freelancer_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Mark as viewed
    if (req.user.role === "freelancer" && !offer.viewed_by_freelancer) {
      offer.viewed_by_freelancer = true;
      await offer.save();
    }

    res.json({ offer });
  } catch (error) {
    console.error("Error fetching offer:", error);
    res.status(500).json({ 
      message: "Error fetching offer", 
      error: error.message 
    });
  }
});

// Update offer status (Client can cancel, Freelancer can accept/decline)
router.patch("/offers/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid offer ID" });
    }

    const validStatuses = ["pending", "accepted", "declined", "expired"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be one of: " + validStatuses.join(", ") 
      });
    }

    let offer;
    let isClientAction = false;

    // Check ownership based on role
    if (req.user.role === "client") {
      const { error, offer: clientOffer, status: errorStatus } = await checkClientOfferOwnership(id, req.user.id);
      if (error) {
        return res.status(errorStatus).json({ message: error });
      }
      offer = clientOffer;
      isClientAction = true;

      // Clients can only cancel pending offers
      if (status !== "cancelled" && status !== "expired") {
        return res.status(403).json({ message: "Clients can only cancel or expire offers" });
      }
    } else if (req.user.role === "freelancer") {
      const { error, offer: freelancerOffer, status: errorStatus } = await checkFreelancerOfferOwnership(id, req.user.id);
      if (error) {
        return res.status(errorStatus).json({ message: error });
      }
      offer = freelancerOffer;

      // Freelancers can only accept or decline pending offers
      if (status !== "accepted" && status !== "declined") {
        return res.status(403).json({ message: "Freelancers can only accept or decline offers" });
      }
    } else {
      return res.status(403).json({ message: "Invalid user role" });
    }

    // Check if offer is still pending
    if (offer.status !== "pending") {
      return res.status(400).json({ message: `Cannot update offer that is already ${offer.status}` });
    }

    // Check if offer has expired
    if (new Date() > offer.expiry_date) {
      offer.status = "expired";
      await offer.save();
      return res.status(400).json({ message: "Offer has already expired" });
    }

    offer.status = status;
    offer.responded_at = new Date();
    await offer.save();

    // If offer is accepted, update the job status
    if (status === "accepted") {
      const job = await Job.findById(offer.job_id);
      if (job && job.status === "open") {
        job.status = "in_progress";
        await job.save();
      }
    }

    const updatedOffer = await Offer.findById(id)
      .populate("freelancer_id", "first_name last_name username profile_picture")
      .populate("job_id", "title");

    res.json({
      message: `Offer ${status} successfully`,
      offer: updatedOffer
    });
  } catch (error) {
    console.error("Error updating offer status:", error);
    res.status(500).json({ 
      message: "Error updating offer status", 
      error: error.message 
    });
  }
});

// ==================== FREELANCER ROUTES ====================

// Get all offers received by the authenticated freelancer
router.get("/freelancer/offers", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ 
        message: "Access denied. Freelancers only." 
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { freelancer_id: req.user.id };
    
    if (status) query.status = status;

    const offers = await Offer.find(query)
      .populate("client_id", "first_name last_name company_name profile_picture")
      .populate("job_id", "title description required_skills budget_type budget_amount estimated_duration work_setup")
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Offer.countDocuments(query);

    // Mark unviewed offers
    const unviewedCount = await Offer.countDocuments({ 
      freelancer_id: req.user.id, 
      viewed_by_freelancer: false,
      status: "pending"
    });

    res.json({
      offers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalOffers: total,
      unviewedCount
    });
  } catch (error) {
    console.error("Error fetching received offers:", error);
    res.status(500).json({ 
      message: "Error fetching offers", 
      error: error.message 
    });
  }
});

// Get offer statistics for dashboard
router.get("/offers/stats/dashboard", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === "client") {
      const pendingOffers = await Offer.countDocuments({ 
        client_id: req.user.id, 
        status: "pending" 
      });
      const acceptedOffers = await Offer.countDocuments({ 
        client_id: req.user.id, 
        status: "accepted" 
      });
      const declinedOffers = await Offer.countDocuments({ 
        client_id: req.user.id, 
        status: "declined" 
      });
      const totalOffers = await Offer.countDocuments({ client_id: req.user.id });

      // Calculate total amount spent on accepted offers
      const acceptedOffersData = await Offer.find({ 
        client_id: req.user.id, 
        status: "accepted" 
      });
      const totalSpent = acceptedOffersData.reduce((sum, offer) => sum + (offer.amount || 0), 0);

      res.json({
        pendingOffers,
        acceptedOffers,
        declinedOffers,
        totalOffers,
        totalSpent
      });
    } else if (req.user.role === "freelancer") {
      const pendingOffers = await Offer.countDocuments({ 
        freelancer_id: req.user.id, 
        status: "pending" 
      });
      const acceptedOffers = await Offer.countDocuments({ 
        freelancer_id: req.user.id, 
        status: "accepted" 
      });
      const declinedOffers = await Offer.countDocuments({ 
        freelancer_id: req.user.id, 
        status: "declined" 
      });
      const totalOffers = await Offer.countDocuments({ freelancer_id: req.user.id });

      // Calculate total earnings from accepted offers
      const acceptedOffersData = await Offer.find({ 
        freelancer_id: req.user.id, 
        status: "accepted" 
      });
      const totalEarnings = acceptedOffersData.reduce((sum, offer) => sum + (offer.amount || 0), 0);

      res.json({
        pendingOffers,
        acceptedOffers,
        declinedOffers,
        totalOffers,
        totalEarnings
      });
    } else {
      res.status(403).json({ message: "Invalid user role" });
    }
  } catch (error) {
    console.error("Error fetching offer statistics:", error);
    res.status(500).json({ 
      message: "Error fetching statistics", 
      error: error.message 
    });
  }
});

// Delete an offer (Client only - can only delete pending or expired offers)
router.delete("/offers/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid offer ID" });
    }

    // Check ownership
    const { error, offer, status: errorStatus } = await checkClientOfferOwnership(id, req.user.id);
    if (error) {
      return res.status(errorStatus).json({ message: error });
    }

    // Only allow deletion of pending or expired offers
    if (offer.status !== "pending" && offer.status !== "expired") {
      return res.status(400).json({ 
        message: "Cannot delete offers that are already accepted or declined" 
      });
    }

    await Offer.findByIdAndDelete(id);

    res.json({ 
      message: "Offer deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).json({ 
      message: "Error deleting offer", 
      error: error.message 
    });
  }
});

export default router;