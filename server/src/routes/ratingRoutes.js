// src/routes/ratingRoutes.js
import express from 'express';
import Rating from '../models/Rating.js';
import Client from '../models/Client.js';
import Freelancer from '../models/Freelancer.js';
import Job from '../models/Job.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== FREELANCER RATES CLIENT ====================
router.post('/ratings/freelancer-to-client', authMiddleware, async (req, res) => {
  try {
    const {
      client_id,
      job_id,
      rating,
      review,
      communication,
      quality,
      professionalism,
      on_time,
    } = req.body;

    // Validate
    if (!client_id || !job_id || !rating) {
      return res.status(400).json({
        message: 'Client, job, and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if job exists and is completed
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({
        message: 'Can only rate for completed jobs',
      });
    }

    // Verify freelancer is the one assigned to the job
    if (!job.freelancer_id || job.freelancer_id.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You can only rate jobs you worked on',
      });
    }

    // Verify client is associated with the job
    if (job.client_id.toString() !== client_id) {
      return res.status(400).json({
        message: 'The client you are rating is not associated with this job',
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      reviewer_id: req.user.id,
      job_id: job_id,
    });

    if (existingRating) {
      return res.status(400).json({
        message: 'You have already rated this job',
      });
    }

    // Create rating (Freelancer rating Client)
    const newRating = new Rating({
      reviewer_id: req.user.id,
      reviewer_model: 'Freelancer',
      recipient_id: client_id,
      recipient_model: 'Client',
      job_id,
      rating,
      review: review || '',
      communication: communication || null,
      quality: quality || null,
      professionalism: professionalism || null,
      on_time: on_time || null,
      is_public: true,
      job_completed: true,
    });

    await newRating.save();

    // Update client's rating stats
    const client = await Client.findById(client_id);
    if (client) {
      const stats = await Rating.getAverageRating(client_id, 'Client');
      client.rating_average = stats.averageRating;
      client.rating_count = stats.totalRatings;
      client.rating_distribution = {
        1: stats.count1Star || 0,
        2: stats.count2Star || 0,
        3: stats.count3Star || 0,
        4: stats.count4Star || 0,
        5: stats.count5Star || 0,
      };
      await client.save();
    }

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating,
    });
  } catch (err) {
    console.error('Freelancer rating client error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== CLIENT RATES FREELANCER ====================
router.post('/ratings/client-to-freelancer', authMiddleware, async (req, res) => {
  try {
    const {
      freelancer_id,
      job_id,
      rating,
      review,
      communication,
      quality,
      professionalism,
      on_time,
    } = req.body;

    // Validate
    if (!freelancer_id || !job_id || !rating) {
      return res.status(400).json({
        message: 'Freelancer, job, and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if job exists and is completed
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({
        message: 'Can only rate for completed jobs',
      });
    }

    // Verify client is the one who posted the job
    if (job.client_id.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You can only rate jobs you posted',
      });
    }

    // Verify freelancer is associated with the job
    if (!job.freelancer_id || job.freelancer_id.toString() !== freelancer_id) {
      return res.status(400).json({
        message: 'The freelancer you are rating is not associated with this job',
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      reviewer_id: req.user.id,
      job_id: job_id,
    });

    if (existingRating) {
      return res.status(400).json({
        message: 'You have already rated this job',
      });
    }

    // Create rating (Client rating Freelancer)
    const newRating = new Rating({
      reviewer_id: req.user.id,
      reviewer_model: 'Client',
      recipient_id: freelancer_id,
      recipient_model: 'Freelancer',
      job_id,
      rating,
      review: review || '',
      communication: communication || null,
      quality: quality || null,
      professionalism: professionalism || null,
      on_time: on_time || null,
      is_public: true,
      job_completed: true,
    });

    await newRating.save();

    // Update freelancer's rating stats
    const freelancer = await Freelancer.findById(freelancer_id);
    if (freelancer) {
      const stats = await Rating.getAverageRating(freelancer_id, 'Freelancer');
      freelancer.rating_average = stats.averageRating;
      freelancer.rating_count = stats.totalRatings;
      freelancer.rating_distribution = {
        1: stats.count1Star || 0,
        2: stats.count2Star || 0,
        3: stats.count3Star || 0,
        4: stats.count4Star || 0,
        5: stats.count5Star || 0,
      };
      await freelancer.save();
    }

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating,
    });
  } catch (err) {
    console.error('Client rating freelancer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET CLIENT RATINGS (for freelancer viewing client) ====================
router.get('/ratings/client/:clientId', authMiddleware, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    const ratings = await Rating.find({
      recipient_id: clientId,
      recipient_model: 'Client',
      is_public: true,
    })
    .sort({ created_at: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .populate('reviewer_id', 'first_name last_name profile_picture username email_address')
    .populate('job_id', 'title');

    const stats = await Rating.getAverageRating(clientId, 'Client');

    res.json({
      ratings,
      stats: {
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
        distribution: {
          1: stats.count1Star || 0,
          2: stats.count2Star || 0,
          3: stats.count3Star || 0,
          4: stats.count4Star || 0,
          5: stats.count5Star || 0,
        },
      },
    });
  } catch (err) {
    console.error('Get client ratings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET FREELANCER RATINGS (for client viewing freelancer) ====================
router.get('/ratings/freelancer/:freelancerId', authMiddleware, async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    const ratings = await Rating.find({
      recipient_id: freelancerId,
      recipient_model: 'Freelancer',
      is_public: true,
    })
    .sort({ created_at: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .populate('reviewer_id', 'first_name last_name profile_picture username email_address')
    .populate('job_id', 'title');

    const stats = await Rating.getAverageRating(freelancerId, 'Freelancer');

    res.json({
      ratings,
      stats: {
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
        distribution: {
          1: stats.count1Star || 0,
          2: stats.count2Star || 0,
          3: stats.count3Star || 0,
          4: stats.count4Star || 0,
          5: stats.count5Star || 0,
        },
      },
    });
  } catch (err) {
    console.error('Get freelancer ratings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET RATINGS GIVEN BY FREELANCER ====================
router.get('/ratings/freelancer-given', authMiddleware, async (req, res) => {
  try {
    const ratings = await Rating.find({
      reviewer_id: req.user.id,
      reviewer_model: 'Freelancer',
    })
    .sort({ created_at: -1 })
    .populate('recipient_id', 'first_name last_name profile_picture username email_address company_name')
    .populate('job_id', 'title');

    res.json({ ratings });
  } catch (err) {
    console.error('Get freelancer given ratings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET RATINGS GIVEN BY CLIENT ====================
router.get('/ratings/client-given', authMiddleware, async (req, res) => {
  try {
    const ratings = await Rating.find({
      reviewer_id: req.user.id,
      reviewer_model: 'Client',
    })
    .sort({ created_at: -1 })
    .populate('recipient_id', 'first_name last_name profile_picture username email_address')
    .populate('job_id', 'title');

    res.json({ ratings });
  } catch (err) {
    console.error('Get client given ratings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== CHECK IF FREELANCER CAN RATE CLIENT ====================
router.get('/ratings/freelancer-can-rate/:jobId', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.json({
        canRate: false,
        message: 'Job must be completed to rate',
      });
    }

    // Check if freelancer is assigned to this job
    if (!job.freelancer_id || job.freelancer_id.toString() !== req.user.id) {
      return res.json({
        canRate: false,
        message: 'You are not the freelancer for this job',
      });
    }

    // Check if already rated
    const existingRating = await Rating.findOne({
      reviewer_id: req.user.id,
      job_id: jobId,
    });

    if (existingRating) {
      return res.json({
        canRate: false,
        message: 'You have already rated this job',
        hasRated: true,
      });
    }

    res.json({
      canRate: true,
      clientId: job.client_id,
      clientModel: 'Client',
      message: 'You can rate this client',
    });
  } catch (err) {
    console.error('Check freelancer can rate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== CHECK IF CLIENT CAN RATE FREELANCER ====================
router.get('/ratings/client-can-rate/:jobId', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.json({
        canRate: false,
        message: 'Job must be completed to rate',
      });
    }

    // Check if client is the job poster
    if (job.client_id.toString() !== req.user.id) {
      return res.json({
        canRate: false,
        message: 'You are not the client for this job',
      });
    }

    // Check if freelancer exists for this job
    if (!job.freelancer_id) {
      return res.json({
        canRate: false,
        message: 'No freelancer assigned to this job',
      });
    }

    // Check if already rated
    const existingRating = await Rating.findOne({
      reviewer_id: req.user.id,
      job_id: jobId,
    });

    if (existingRating) {
      return res.json({
        canRate: false,
        message: 'You have already rated this job',
        hasRated: true,
      });
    }

    res.json({
      canRate: true,
      freelancerId: job.freelancer_id,
      freelancerModel: 'Freelancer',
      message: 'You can rate this freelancer',
    });
  } catch (err) {
    console.error('Check client can rate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADD RESPONSE TO RATING ====================
router.put('/ratings/:ratingId/response', authMiddleware, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ message: 'Response text is required' });
    }

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Only the recipient can respond
    if (rating.recipient_id.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Only the rated user can respond to this rating',
      });
    }

    rating.response = {
      text: response.trim(),
      responded_at: new Date(),
    };

    await rating.save();

    res.json({
      message: 'Response added successfully',
      rating,
    });
  } catch (err) {
    console.error('Update rating response error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;