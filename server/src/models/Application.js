// models/Application.js
import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  freelancer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Freelancer',
    required: true,
  },
  cover_letter: {
    type: String,
    required: true,
  },
  proposed_rate: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'offered', 'rejected', 'accepted'],
    default: 'pending',
  },
  offer_amount: {
    type: Number,
    min: 0,
  },
  offer_message: {
    type: String,
  },
  offer_sent_at: {
    type: Date,
  },
  viewed_by_client: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: {
    createdAt: 'applied_at',
    updatedAt: 'updated_at',
  },
});

// Ensure a freelancer can only apply once per job
applicationSchema.index({ job_id: 1, freelancer_id: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);
export default Application;