import mongoose from 'mongoose';

const freelancerSchema = new mongoose.Schema({
  // Personal Information
  first_name: {
    type: String,
    required: true,
    trim: true,
  },
  last_name: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true, // Keep this
    trim: true,
    lowercase: true,
  },
  
  // Contact Information
  email_address: {
    type: String,
    required: true,
    unique: true, // Keep this
    lowercase: true,
    trim: true,
  },
  phone_number: {
    type: String,
    trim: true,
  },
  
  // Authentication
  password: {
    type: String,
    required: true,
  },
  is_email_verified: {
    type: Boolean,
    default: false,
  },
  verification_code: {
    type: String,
    default: null,
  },
  verification_code_expires: {
    type: Date,
    default: null,
  },
  reset_password_code: {
    type: String,
    default: null,
  },
  reset_password_expires: {
    type: Date,
    default: null,
  },
  login_provider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  },
  
  // Location
  country: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  
  // Profile
  profile_picture: {
    type: String, // Cloudinary URL
    default: null,
  },
  profile_picture_public_id: {
    type: String, // Cloudinary public ID for deletion
    default: null,
  },
  
  // Professional Information
  skills: [{
    type: String,
    trim: true,
  }],
  experience_level: {
    type: String,
    enum: ['Entry', 'Intermediate', 'Expert', 'Senior'],
    trim: true,
  },
  years_of_experience: {
    type: Number,
    min: 0,
  },
  
  // Portfolio - Enhanced
  portfolio: [{
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    project_url: {
      type: String,
      trim: true,
    },
    image_url: {
      type: String,
      trim: true,
    },
  }],
  
  // Resume/CV - Enhanced
  resume: {
    file_name: {
      type: String,
      trim: true,
    },
    file_url: {
      type: String,
      trim: true,
    },
    public_id: {
      type: String,
      trim: true,
    },
  },
  
  // Pricing
  hourly_rate: {
    type: Number,
    min: 0,
  },
  fixed_rate: {
    type: Number,
    min: 0,
  },
  
  // About & Languages
  bio_about_me: {
    type: String,
    trim: true,
  },
  languages: [{
    language: {
      type: String,
      required: true,
      trim: true,
    },
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'professional', 'native'],
      default: 'basic',
    },
  }],
  certifications: [{
    type: String,
    trim: true,
  }],
  
  // Availability
  availability_status: {
    type: String,
    enum: ['available', 'busy', 'unavailable', 'on_leave'],
    default: 'available',
  },
  
  // Status & Activity
  account_status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active',
  },
  last_login: {
    type: Date,
    default: null,
  },
  is_online: {
    type: Boolean,
    default: false,
  },
  push_token: {
    type: String,
    default: null,
  },
  
  // Terms & Role
  terms_accepted: {
    type: Boolean,
    required: true,
  },
  role: {
    type: String,
    default: 'freelancer',
    enum: ['client', 'freelancer'],
  },

  // NEW FIELDS: Rating and Jobs Completed
  rating: {
    average: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 5
    },
    count: { 
      type: Number, 
      default: 0,
      min: 0
    }
  },
  total_jobs_completed: {
    type: Number,
    default: 0,
    min: 0
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Indexes - Remove duplicate indexes
// Only keep indexes that are NOT already defined with 'unique: true' in the schema
freelancerSchema.index({ skills: 1 });
freelancerSchema.index({ availability_status: 1 });
freelancerSchema.index({ account_status: 1 });
freelancerSchema.index({ experience_level: 1 });
freelancerSchema.index({ 'rating.average': -1 }); // For sorting by rating
// REMOVED: freelancerSchema.index({ email_address: 1 }); // Already has unique: true
// REMOVED: freelancerSchema.index({ username: 1 }); // Already has unique: true

// Remove password when converting to JSON
freelancerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verification_code;
  delete obj.reset_password_code;
  return obj;
};

const Freelancer = mongoose.model('Freelancer', freelancerSchema);
export default Freelancer;