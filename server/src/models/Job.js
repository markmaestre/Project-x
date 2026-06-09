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

  // Pay Information
  pay_information: {
    salary_range: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { 
        type: String, 
        default: 'USD', 
        enum: ['USD', 'EUR', 'GBP', 'PHP', 'CAD', 'AUD'] 
      }
    },
    payment_frequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'bi-weekly', 'monthly', 'one-time'],
      default: 'monthly'
    },
    benefits: [{
      type: String,
      enum: ['health_insurance', 'paid_time_off', 'remote_stipend', 'equipment_provided', 'bonus_eligible', 'retirement_plan', 'professional_development']
    }],
    negotiable: {
      type: Boolean,
      default: false
    },
    display_pay: {
      type: Boolean,
      default: true
    }
  },

  job_type: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'one_time', 'internship', 'freelance'],
    default: 'one_time',
  },

  work_setup: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid'],
    default: 'remote',
  },

  // Location Information
  location: {
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: 'Philippines' },
    zip_code: { type: String, trim: true },
    is_remote_allowed: { type: Boolean, default: false },
    specific_area: { type: String, trim: true },
    landmark: { type: String, trim: true },
    work_address: { type: String, trim: true }
  },

  urgency_level: {
    type: String,
    enum: ['low', 'normal', 'urgent', 'immediate'],
    default: 'normal',
  },

  experience_level: {
    type: String,
    enum: ['Entry', 'Intermediate', 'Expert', 'Senior', 'Lead', 'Director'],
  },

  // Education Requirements
  education_requirements: {
    minimum_degree: {
      type: String,
      enum: ['none', 'high_school', 'associate', 'bachelor', 'master', 'doctorate'],
      default: 'none'
    },
    preferred_field: { type: String, trim: true },
    required_certifications: [{
      type: String,
      trim: true
    }],
    years_of_experience: { type: Number, min: 0, default: 0 }
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

  // Job Requirements
  requirements: {
    min_years_experience: { type: Number, default: 0 },
    preferred_tools: [String],
    languages_required: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['basic', 'conversational', 'professional', 'native']
      }
    }],
    additional_requirements: { type: String, trim: true }
  },

  // Application Settings
  application_settings: {
    auto_accept: { type: Boolean, default: false },
    max_applicants: { type: Number, default: 100 },
    application_deadline: { type: Date },
    questions_for_applicants: [{
      question: String,
      type: {
        type: String,
        enum: ['text', 'multiple_choice', 'file', 'yes_no']
      },
      required: { type: Boolean, default: true },
      options: [String]
    }]
  }

}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Index for better search performance
jobSchema.index({ title: 'text', description: 'text', 'required_skills': 'text' });
jobSchema.index({ 'location.city': 1, 'location.specific_area': 1 });
jobSchema.index({ status: 1, job_type: 1, created_at: -1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;