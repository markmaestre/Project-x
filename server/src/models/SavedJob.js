import mongoose from 'mongoose';

const savedJobSchema = new mongoose.Schema({
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
}, {
  timestamps: {
    createdAt: 'saved_at',
    updatedAt: false,
  },
});

// Ensure a freelancer can only save a job once
savedJobSchema.index({ freelancer_id: 1, job_id: 1 }, { unique: true });

const SavedJob = mongoose.model('SavedJob', savedJobSchema);
export default SavedJob;