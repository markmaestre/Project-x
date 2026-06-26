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
    enum: ['pending', 'reviewed', 'interview', 'offered', 'hired', 'rejected', 'completed'],
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
  // Interview data
  interview_data: {
    scheduled_date: Date,
    meeting_link: String,
    notes: String,
    sent_at: Date,
  },
  // Resume/CV data
  resume: {
    name: String,
    url: String,
    public_id: String,
    mime_type: String,
    size: Number,
  },
  // Education data
  education: {
    level: String,
    field_of_study: String,
    institution: String,
    graduation_year: String,
  },
  // Work experiences
  experiences: [{
    job_title: String,
    company_name: String,
    start_date: String,
    end_date: String,
    currently_working: Boolean,
    description: String,
  }],
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