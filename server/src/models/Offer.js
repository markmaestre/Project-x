// models/Offer.js
import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  freelancer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Freelancer',
    required: true,
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  message: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending',
  },
  expiry_date: {
    type: Date,
    default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  viewed_by_freelancer: {
    type: Boolean,
    default: false,
  },
  viewed_by_client: {
    type: Boolean,
    default: true,
  },
  responded_at: {
    type: Date,
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Index for faster queries
offerSchema.index({ client_id: 1, created_at: -1 });
offerSchema.index({ freelancer_id: 1, created_at: -1 });
offerSchema.index({ job_id: 1 });
offerSchema.index({ status: 1 });

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;