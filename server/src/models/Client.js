import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
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
  company_name: {
    type: String,
    trim: true,
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
  business_type: {
    type: String,
    trim: true,
  },
  industry: {
    type: String,
    trim: true,
  },
  bio_about: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  budget_range: {
    type: String,
    trim: true,
  },
  preferred_communication_method: {
    type: String,
    trim: true,
  },
  terms_accepted: {
    type: Boolean,
    required: true,
  },
  role: {
    type: String,
    default: 'client',
    enum: ['client', 'freelancer'],
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Remove password when converting to JSON
clientSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Client = mongoose.model('Client', clientSchema);
export default Client;