import Freelancer from '../models/Freelancer.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class FreelancerService {
  
  static async registerFreelancer(data) {
    const {
      first_name,
      last_name,
      username,
      email_address,
      password,
      terms_accepted,
      phone_number,
      country,
      city,
      address,
      skills,
      experience_level,
      years_of_experience,
      hourly_rate,
      fixed_rate,
      bio_about_me,
      languages
    } = data;
    
    // Check if username exists
    const existingUsername = await Freelancer.findOne({ username });
    if (existingUsername) {
      throw new Error('Username already taken');
    }
    
    // Check if email exists
    const existingEmail = await Freelancer.findOne({ email_address });
    if (existingEmail) {
      throw new Error('Email already registered');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification code
    const verificationCode = crypto.randomBytes(3).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);
    
    // Create freelancer
    const freelancer = new Freelancer({
      first_name,
      last_name,
      username,
      email_address,
      password: hashedPassword,
      terms_accepted,
      phone_number,
      country,
      city,
      address,
      skills: skills || [],
      experience_level: experience_level || 'Entry',
      years_of_experience: years_of_experience || 0,
      hourly_rate: hourly_rate || 0,
      fixed_rate: fixed_rate || 0,
      bio_about_me,
      languages: languages || [],
      verification_code: verificationCode,
      verification_code_expires: verificationExpires,
      account_status: 'active',
      is_email_verified: false,
      availability_status: 'available',
    });
    
    await freelancer.save();
    
    // Send verification email
    // await EmailService.sendVerificationEmail(freelancer);
    
    return freelancer;
  }
  
  static async verifyEmail(email, code) {
    const freelancer = await Freelancer.findOne({
      email_address: email,
      verification_code: code,
      verification_code_expires: { $gt: new Date() }
    });
    
    if (!freelancer) {
      throw new Error('Invalid or expired verification code');
    }
    
    freelancer.is_email_verified = true;
    freelancer.verification_code = null;
    freelancer.verification_code_expires = null;
    
    await freelancer.save();
    return freelancer;
  }
  
  static async getFreelancerProfile(freelancerId) {
    const freelancer = await Freelancer.findById(freelancerId);
    if (!freelancer) {
      throw new Error('Freelancer not found');
    }
    return freelancer;
  }
  
  static async updateFreelancerProfile(freelancerId, data) {
    const freelancer = await Freelancer.findById(freelancerId);
    if (!freelancer) {
      throw new Error('Freelancer not found');
    }
    
    const allowedFields = [
      'first_name', 'last_name', 'username', 'phone_number', 'country', 'city',
      'address', 'skills', 'experience_level', 'years_of_experience',
      'hourly_rate', 'fixed_rate', 'bio_about_me', 'languages',
      'certifications', 'availability_status', 'profile_picture'
    ];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        freelancer[field] = data[field];
      }
    });
    
    await freelancer.save();
    return freelancer;
  }
  
  static async updatePushToken(freelancerId, pushToken) {
    await Freelancer.findByIdAndUpdate(freelancerId, { push_token: pushToken });
  }
  
  static async login(email, password) {
    const freelancer = await Freelancer.findOne({ email_address: email });
    if (!freelancer) {
      throw new Error('Invalid credentials');
    }
    
    const isValid = await bcrypt.compare(password, freelancer.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    
    freelancer.last_login = new Date();
    freelancer.is_online = true;
    await freelancer.save();
    
    return freelancer;
  }
  
  static async updateAvailability(freelancerId, availability_status) {
    const freelancer = await Freelancer.findByIdAndUpdate(
      freelancerId,
      { availability_status },
      { new: true }
    );
    
    if (!freelancer) {
      throw new Error('Freelancer not found');
    }
    
    return freelancer;
  }
  
  static async searchFreelancers(filters = {}, limit = 20, skip = 0) {
    const query = {
      account_status: 'active',
      ...filters
    };
    
    if (filters.skills) {
      query.skills = { $in: filters.skills };
    }
    
    const freelancers = await Freelancer.find(query)
      .sort({ 'rating.average': -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Freelancer.countDocuments(query);
    
    return {
      freelancers,
      total,
      hasMore: total > skip + limit
    };
  }
}

export default FreelancerService;