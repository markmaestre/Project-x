import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
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
  
  // Company Information - ALL OPTIONAL NA!
  company_name: {
    type: String,
    trim: true,
    default: null,
  },
  company_logo: {
    type: String,
    default: null,
  },
  company_logo_public_id: {
    type: String,
    default: null,
  },
  company_size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: null,
  },
  business_type: {
    type: String,
    trim: true,
    default: null,
  },
  industry: {
    type: String,
    trim: true,
    default: null,
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
    type: String,
    default: null,
  },
  profile_picture_public_id: {
    type: String,
    default: null,
  },
  
  // Bio & Preferences
  bio_about: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  
  // Budget - Optional din
  budget_range: {
    min: {
      type: Number,
      min: 0,
      default: null,
    },
    max: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  preferred_communication_method: {
    type: String,
    trim: true,
  },
  
  // Client Type - Added this para malaman kung personal o business
  client_type: {
    type: String,
    enum: ['personal', 'business'],
    default: 'personal',
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
    default: 'client',
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
clientSchema.index({ account_status: 1 });
clientSchema.index({ client_type: 1 });
clientSchema.index({ 'rating.average': -1 }); // For sorting by rating
// REMOVED: clientSchema.index({ email_address: 1 }); // Already has unique: true

// Virtual para sa display name
clientSchema.virtual('display_name').get(function() {
  if (this.client_type === 'business' && this.company_name) {
    return this.company_name;
  }
  return `${this.first_name} ${this.last_name}`;
});

// Remove password when converting to JSON
clientSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verification_code;
  delete obj.reset_password_code;
  return obj;
};

const Client = mongoose.model('Client', clientSchema);
export default Client;