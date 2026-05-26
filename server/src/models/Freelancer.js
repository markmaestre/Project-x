import mongoose from 'mongoose';

const freelancerSchema = new mongoose.Schema({
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
    unique: true,
    trim: true,
    lowercase: true,
  },
  email_address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    trim: true,
  },
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
  profile_picture: {
    type: String, // Cloudinary URL
    default: null,
  },
  profile_picture_public_id: {
    type: String, // Cloudinary public ID for deletion
    default: null,
  },
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
  portfolio_link: {
    type: String,
    trim: true,
  },
  resume_cv_url: {
    type: String,
    trim: true,
  },
  hourly_rate: {
    type: Number,
    min: 0,
  },
  fixed_rate: {
    type: Number,
    min: 0,
  },
  bio_about_me: {
    type: String,
    trim: true,
  },
  languages: [{
    type: String,
    trim: true,
  }],
  certifications: [{
    type: String,
    trim: true,
  }],
  availability_status: {
    type: String,
    enum: ['available', 'busy', 'unavailable', 'on_leave'],
    default: 'available',
  },
  terms_accepted: {
    type: Boolean,
    required: true,
  },
  role: {
    type: String,
    default: 'freelancer',
    enum: ['client', 'freelancer'],
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Remove password when converting to JSON
freelancerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Freelancer = mongoose.model('Freelancer', freelancerSchema);
export default Freelancer;