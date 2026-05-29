import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    required: true,
  },

  required_skills: [{
    type: String,
    trim: true,
  }],

  job_type: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'one_time'],
    default: 'one_time',
  },

  work_setup: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid'],
    default: 'remote',
  },

  urgency_level: {
    type: String,
    enum: ['low', 'normal', 'urgent'],
    default: 'normal',
  },

  experience_level: {
    type: String,
    enum: ['Entry', 'Intermediate', 'Expert', 'Senior'],
  },

  budget_type: {
    type: String,
    enum: ['hourly', 'fixed'],
    default: 'fixed',
  },

  budget_amount: {
    type: Number,
    min: 0,
  },

  estimated_duration: {
    type: String,
    trim: true,
  },

  contact_preference: {
    type: String,
    enum: ['chat', 'email', 'phone'],
    default: 'chat',
  },

  total_applicants: {
    type: Number,
    default: 0,
  },

  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open',
  },

}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

const Job = mongoose.model('Job', jobSchema);

export default Job;