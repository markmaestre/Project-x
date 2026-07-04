import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { upload, cloudinary } from "../config/cloudinary.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";
import { 
  generateVerificationCode, 
  sendVerificationEmail,
  sendPasswordResetEmail 
} from "../services/emailService.js";

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================

// Check if email is a business email (not from free providers)
const isBusinessEmail = (email) => {
  if (!email) return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  // List of free email providers
  const freeProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
    'zoho.com', 'yandex.com', 'gmx.com', 'tutanota.com',
    'fastmail.com', 'hushmail.com', 'runbox.com', 'live.com',
    'msn.com', 'me.com', 'mac.com', 'inbox.com', 'mailinator.com',
    'guerrillamail.com', '10minutemail.com', 'temp-mail.org'
  ];
  
  return !freeProviders.includes(domain);
};

// Get email domain
const getEmailDomain = (email) => {
  if (!email) return null;
  return email.split('@')[1]?.toLowerCase() || null;
};

// Parse FormData booleans
const parseFormDataBooleans = (req, res, next) => {
  if (req.body) {
    if (req.body.terms_accepted === 'true') req.body.terms_accepted = true;
    if (req.body.terms_accepted === 'false') req.body.terms_accepted = false;
  }
  next();
};

// Handle profile picture upload
const handleProfilePictureUpload = async (file, existingPublicId = null) => {
  if (existingPublicId) {
    await cloudinary.uploader.destroy(existingPublicId);
  }
  
  if (file) {
    return {
      url: file.path,
      public_id: file.filename,
    };
  }
  
  return null;
};

// ==================== CLIENT REGISTRATION (UPDATED) ====================
router.post("/register/client", upload.single('profile_picture'), parseFormDataBooleans, async (req, res) => {
  const {
    first_name,
    last_name,
    company_name,
    email_address,
    password,
    confirm_password,
    phone_number,
    country,
    city,
    address,
    client_type = 'personal', // NEW: 'personal' or 'business'
    business_email, // NEW: Company email (required for business)
    business_type,
    industry,
    company_size,
    bio_about,
    website,
    budget_range,
    preferred_communication_method,
    terms_accepted,
    role = "client"
  } = req.body;

  console.log('Client Registration - Received data:', {
    first_name,
    last_name,
    company_name,
    email_address,
    client_type,
    business_email,
    business_type,
    industry,
    company_size,
    phone_number,
    country,
    city,
    address,
    bio_about,
    website,
    terms_accepted_value: terms_accepted,
    role
  });

  // ==================== VALIDATION ====================
  
  // Required fields
  if (!first_name || !first_name.trim()) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "First name is required" });
  }
  
  if (!last_name || !last_name.trim()) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Last name is required" });
  }
  
  if (!email_address || !email_address.trim()) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Email address is required" });
  }
  
  if (!password) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Password is required" });
  }
  
  if (!confirm_password) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Please confirm your password" });
  }

  if (password !== confirm_password) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (!terms_accepted || terms_accepted !== true) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "You must accept the terms and conditions" });
  }

  // ==================== BUSINESS VALIDATION ====================
  
  if (client_type === 'business') {
    // Business requires company name
    if (!company_name || !company_name.trim()) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ 
        message: "Company name is required for business accounts" 
      });
    }

    // Business requires business email
    if (!business_email || !business_email.trim()) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ 
        message: "Business email is required for business accounts" 
      });
    }

    // Validate business email is NOT from free providers
    if (!isBusinessEmail(business_email)) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ 
        message: "Please use a company email address (e.g., name@company.com). Free email providers like Gmail, Yahoo, etc. are not allowed for business accounts." 
      });
    }

    // Business requires business type
    if (!business_type || !business_type.trim()) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ 
        message: "Business type is required for business accounts" 
      });
    }

    // Business requires industry
    if (!industry || !industry.trim()) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ 
        message: "Industry is required for business accounts" 
      });
    }

    // Business requires company size
    if (!company_size) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ 
        message: "Company size is required for business accounts" 
      });
    }

    // Check if business email is already used
    const existingBusinessEmail = await Client.findOne({ 
      business_email: business_email.toLowerCase().trim() 
    });
    if (existingBusinessEmail) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ 
        message: "This business email is already registered" 
      });
    }
  }

  // ==================== PERSONAL VALIDATION ====================
  
  if (client_type === 'personal') {
    // Personal accounts don't need business email
    // But if they provide one, validate it's not a free email
    if (business_email && business_email.trim()) {
      if (!isBusinessEmail(business_email)) {
        if (req.file) await cloudinary.uploader.destroy(req.file.filename);
        return res.status(400).json({ 
          message: "If providing a business email, please use a company email address (e.g., name@company.com)" 
        });
      }
    }
  }

  try {
    // Check if user already exists
    const existingUser = await Client.findOne({ 
      email_address: email_address.toLowerCase() 
    });
    if (existingUser) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Check if business email is already used (if provided)
    if (business_email && business_email.trim()) {
      const existingBusiness = await Client.findOne({ 
        business_email: business_email.toLowerCase().trim() 
      });
      if (existingBusiness) {
        if (req.file) await cloudinary.uploader.destroy(req.file.filename);
        return res.status(400).json({ 
          message: "This business email is already registered" 
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    // Handle profile picture upload
    let profilePictureData = null;
    if (req.file) {
      profilePictureData = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Determine if business email is verified
    const isBusinessEmailVerified = client_type === 'business' && business_email ? false : false;

    // Build client data
    const clientData = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      company_name: client_type === 'business' ? company_name.trim() : null,
      email_address: email_address.toLowerCase().trim(),
      business_email: business_email && business_email.trim() ? business_email.toLowerCase().trim() : null,
      company_email_domain: business_email && business_email.trim() ? getEmailDomain(business_email) : null,
      is_company_email_verified: client_type === 'business' ? false : false,
      password: hashedPassword,
      phone_number: phone_number && phone_number.trim() ? phone_number.trim() : null,
      country: country && country.trim() ? country.trim() : null,
      city: city && city.trim() ? city.trim() : null,
      address: address && address.trim() ? address.trim() : null,
      profile_picture: profilePictureData?.url || null,
      profile_picture_public_id: profilePictureData?.public_id || null,
      client_type: client_type,
      business_type: business_type && business_type.trim() ? business_type.trim() : null,
      industry: industry && industry.trim() ? industry.trim() : null,
      company_size: company_size || null,
      bio_about: bio_about && bio_about.trim() ? bio_about.trim() : null,
      website: website && website.trim() ? website.trim() : null,
      budget_range: budget_range && budget_range.trim() ? budget_range.trim() : null,
      preferred_communication_method: preferred_communication_method && preferred_communication_method.trim() ? preferred_communication_method.trim() : null,
      terms_accepted: true,
      role: role,
      verification_code: verificationCode,
      verification_code_expires: expiresAt,
      is_email_verified: false,
    };

    const client = new Client(clientData);
    await client.save();

    // Send verification email
    try {
      await sendVerificationEmail(email_address, verificationCode);
      console.log('Verification email sent successfully');
      
      // If business, send verification to business email too
      if (client_type === 'business' && business_email) {
        await sendVerificationEmail(business_email, verificationCode);
        console.log('Business verification email sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    res.status(201).json({
      message: client_type === 'business' 
        ? "Business account registered successfully. Please verify both your personal and business emails." 
        : "Client registered successfully. Please verify your email.",
      user: {
        id: client._id,
        first_name: client.first_name,
        last_name: client.last_name,
        email_address: client.email_address,
        client_type: client.client_type,
        business_email: client.business_email,
        role: client.role,
        profile_picture: client.profile_picture,
        is_email_verified: client.is_email_verified,
        is_company_email_verified: client.is_company_email_verified,
      },
      requires_verification: true,
    });
  } catch (err) {
    console.error('Client registration error:', err);
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    res.status(500).json({ error: err.message });
  }
});

// ==================== FREELANCER REGISTRATION ====================
router.post("/register/freelancer", upload.single('profile_picture'), parseFormDataBooleans, async (req, res) => {
  let {
    first_name,
    last_name,
    username,
    email_address,
    password,
    confirm_password,
    phone_number,
    country,
    city,
    address,
    skills,
    experience_level,
    years_of_experience,
    portfolio_link,
    resume_cv_url,
    hourly_rate,
    fixed_rate,
    bio_about_me,
    languages,
    certifications,
    availability_status,
    terms_accepted,
    role = "freelancer"
  } = req.body;

  console.log('Freelancer Registration - Raw received data:', {
    first_name,
    last_name,
    username,
    email_address,
    phone_number,
    country,
    city,
    address,
    skills,
    experience_level,
    years_of_experience,
    portfolio_link,
    resume_cv_url,
    hourly_rate,
    fixed_rate,
    bio_about_me,
    languages,
    certifications,
    availability_status,
    terms_accepted_value: terms_accepted,
    role
  });

  // Parse arrays if they come as strings
  let parsedSkills = skills;
  let parsedLanguages = languages;
  let parsedCertifications = certifications;

  if (skills && typeof skills === 'string') {
    try {
      parsedSkills = JSON.parse(skills);
    } catch (e) {
      parsedSkills = skills.split(',').map(s => s.trim()).filter(s => s);
    }
  }
  
  if (languages && typeof languages === 'string') {
    try {
      parsedLanguages = JSON.parse(languages);
    } catch (e) {
      parsedLanguages = languages.split(',').map(l => l.trim()).filter(l => l);
    }
  }
  
  if (certifications && typeof certifications === 'string') {
    try {
      parsedCertifications = JSON.parse(certifications);
    } catch (e) {
      parsedCertifications = certifications.split(',').map(c => c.trim()).filter(c => c);
    }
  }

  // Validate required fields
  if (!first_name || !first_name.trim()) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "First name is required" });
  }
  
  if (!last_name || !last_name.trim()) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Last name is required" });
  }
  
  if (!username || !username.trim()) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Username is required" });
  }
  
  if (!email_address || !email_address.trim()) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Email address is required" });
  }
  
  if (!password) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Password is required" });
  }
  
  if (!confirm_password) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Please confirm your password" });
  }

  if (password !== confirm_password) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (!terms_accepted || terms_accepted !== true) {
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(400).json({ message: "You must accept the terms and conditions" });
  }

  try {
    // Check if user already exists
    const existingUser = await Freelancer.findOne({ email_address: email_address.toLowerCase() });
    if (existingUser) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Check if username is taken
    const existingUsername = await Freelancer.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    // Handle profile picture upload
    let profilePictureData = null;
    if (req.file) {
      profilePictureData = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Prepare the data for saving
    const freelancerData = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      username: username.toLowerCase().trim(),
      email_address: email_address.toLowerCase().trim(),
      password: hashedPassword,
      phone_number: phone_number && phone_number.trim() ? phone_number.trim() : null,
      country: country && country.trim() ? country.trim() : null,
      city: city && city.trim() ? city.trim() : null,
      address: address && address.trim() ? address.trim() : null,
      profile_picture: profilePictureData?.url || null,
      profile_picture_public_id: profilePictureData?.public_id || null,
      skills: parsedSkills && Array.isArray(parsedSkills) && parsedSkills.length > 0 ? parsedSkills : null,
      experience_level: experience_level && experience_level.trim() ? experience_level.trim() : null,
      years_of_experience: years_of_experience ? parseInt(years_of_experience) : null,
      portfolio_link: portfolio_link && portfolio_link.trim() ? portfolio_link.trim() : null,
      resume_cv_url: resume_cv_url && resume_cv_url.trim() ? resume_cv_url.trim() : null,
      hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
      fixed_rate: fixed_rate ? parseFloat(fixed_rate) : null,
      bio_about_me: bio_about_me && bio_about_me.trim() ? bio_about_me.trim() : null,
      languages: parsedLanguages && Array.isArray(parsedLanguages) && parsedLanguages.length > 0 ? parsedLanguages : null,
      certifications: parsedCertifications && Array.isArray(parsedCertifications) && parsedCertifications.length > 0 ? parsedCertifications : null,
      availability_status: availability_status || "available",
      terms_accepted: true,
      role: role,
      verification_code: verificationCode,
      verification_code_expires: expiresAt,
      is_email_verified: false,
    };

    console.log('Saving freelancer data:', {
      ...freelancerData,
      password: '[HIDDEN]',
      verification_code: '[HIDDEN]'
    });

    const freelancer = new Freelancer(freelancerData);
    await freelancer.save();

    // Send verification email
    try {
      await sendVerificationEmail(email_address, verificationCode);
      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    res.status(201).json({
      message: "Freelancer registered successfully. Please verify your email.",
      user: {
        id: freelancer._id,
        first_name: freelancer.first_name,
        last_name: freelancer.last_name,
        username: freelancer.username,
        email_address: freelancer.email_address,
        role: freelancer.role,
        profile_picture: freelancer.profile_picture,
        is_email_verified: freelancer.is_email_verified,
      },
      requires_verification: true,
    });
  } catch (err) {
    console.error('Freelancer registration error:', err);
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    res.status(500).json({ error: err.message });
  }
});

// ==================== VERIFY EMAIL (UPDATED) ====================
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and verification code are required" });
  }

  try {
    // Check both models
    let user = await Client.findOne({ 
      email_address: email.toLowerCase(),
      verification_code: code,
      verification_code_expires: { $gt: new Date() }
    });

    let userRole = "client";

    if (!user) {
      user = await Freelancer.findOne({ 
        email_address: email.toLowerCase(),
        verification_code: code,
        verification_code_expires: { $gt: new Date() }
      });
      userRole = "freelancer";
    }

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired verification code" 
      });
    }

    // Update user as verified
    user.is_email_verified = true;
    user.verification_code = null;
    user.verification_code_expires = null;
    
    // If business client, also verify business email
    if (userRole === "client" && user.client_type === "business") {
      user.is_company_email_verified = true;
    }
    
    await user.save();

    // Generate token for auto-login
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email_address,
        first_name: user.first_name,
        last_name: user.last_name,
        role: userRole,
        model: userRole === "client" ? "Client" : "Freelancer"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Prepare user response
    let userResponse = {
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email_address: user.email_address,
      role: userRole,
      profile_picture: user.profile_picture,
      is_email_verified: user.is_email_verified,
    };

    if (userRole === "client") {
      userResponse = {
        ...userResponse,
        client_type: user.client_type,
        company_name: user.company_name,
        business_email: user.business_email,
        is_company_email_verified: user.is_company_email_verified,
        phone_number: user.phone_number,
        country: user.country,
        city: user.city,
        business_type: user.business_type,
        industry: user.industry,
        company_size: user.company_size
      };
    } else {
      userResponse = {
        ...userResponse,
        username: user.username,
        phone_number: user.phone_number,
        country: user.country,
        city: user.city,
        skills: user.skills,
        experience_level: user.experience_level,
        hourly_rate: user.hourly_rate,
        availability_status: user.availability_status
      };
    }

    res.json({
      message: userRole === "client" && user.client_type === "business" 
        ? "Email verified successfully. Your business email has also been verified." 
        : "Email verified successfully",
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== CHECK EMAIL TYPE (NEW) ====================
router.post("/check-email-type", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const isBusiness = isBusinessEmail(email);
    const domain = getEmailDomain(email);
    
    res.json({
      success: true,
      data: {
        email: email,
        is_business_email: isBusiness,
        domain: domain,
        message: isBusiness 
          ? "This is a business/company email address" 
          : "This is a personal/free email address (Gmail, Yahoo, etc.)",
        recommendation: isBusiness 
          ? "Valid for business accounts" 
          : "Use a company email for business accounts"
      }
    });
  } catch (err) {
    console.error('Check email type error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== RESEND VERIFICATION CODE ====================
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check both models
    let user = await Client.findOne({ email_address: email.toLowerCase() });
    let userModel = "Client";

    if (!user) {
      user = await Freelancer.findOne({ email_address: email.toLowerCase() });
      userModel = "Freelancer";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.is_email_verified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification code
    const newCode = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    user.verification_code = newCode;
    user.verification_code_expires = expiresAt;
    await user.save();

    // Send new verification email
    await sendVerificationEmail(email, newCode);

    res.json({
      message: "New verification code sent to your email",
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== FORGOT PASSWORD ====================
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check both models
    let user = await Client.findOne({ email_address: email.toLowerCase() });
    let userModel = "Client";

    if (!user) {
      user = await Freelancer.findOne({ email_address: email.toLowerCase() });
      userModel = "Freelancer";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    user.reset_password_code = resetCode;
    user.reset_password_expires = expiresAt;
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(email, resetCode);

    res.json({
      message: "Password reset code sent to your email",
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== RESET PASSWORD ====================
router.post("/reset-password", async (req, res) => {
  const { email, code, new_password, confirm_password } = req.body;

  if (!email || !code || !new_password || !confirm_password) {
    return res.status(400).json({ 
      message: "Email, code, new password, and confirm password are required" 
    });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Check both models
    let user = await Client.findOne({ 
      email_address: email.toLowerCase(),
      reset_password_code: code,
      reset_password_expires: { $gt: new Date() }
    });

    let userModel = "Client";

    if (!user) {
      user = await Freelancer.findOne({ 
        email_address: email.toLowerCase(),
        reset_password_code: code,
        reset_password_expires: { $gt: new Date() }
      });
      userModel = "Freelancer";
    }

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired reset code" 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    user.password = hashedPassword;
    user.reset_password_code = null;
    user.reset_password_expires = null;
    await user.save();

    res.json({
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== LOGIN (Unified for both roles) ====================
router.post("/login", async (req, res) => {
  const { email_address, password } = req.body;

  if (!email_address || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // First try to find in clients table
    let userData = await Client.findOne({ email_address: email_address.toLowerCase() });
    let userRole = "client";
    let userModel = "Client";

    // If not found in clients, try freelancers
    if (!userData) {
      userData = await Freelancer.findOne({ email_address: email_address.toLowerCase() });
      userRole = "freelancer";
      userModel = "Freelancer";
    }

    if (!userData) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if email is verified
    if (!userData.is_email_verified) {
      // Check if verification code is expired, resend if needed
      if (!userData.verification_code_expires || userData.verification_code_expires < new Date()) {
        const newCode = generateVerificationCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);
        
        userData.verification_code = newCode;
        userData.verification_code_expires = expiresAt;
        await userData.save();
        
        try {
          await sendVerificationEmail(email_address, newCode);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }
      }
      
      return res.status(403).json({
        message: "Email not verified. Please check your email for the verification code.",
        requires_verification: true,
        email: email_address,
      });
    }

    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Update last login
    userData.last_login = new Date();
    userData.is_online = true;
    await userData.save();

    const token = jwt.sign(
      {
        id: userData._id,
        email: userData.email_address,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userRole,
        model: userModel
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Prepare user response based on role
    let userResponse = {
      id: userData._id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email_address: userData.email_address,
      role: userRole,
      profile_picture: userData.profile_picture,
      is_email_verified: userData.is_email_verified,
    };

    if (userRole === "client") {
      userResponse = {
        ...userResponse,
        client_type: userData.client_type || 'personal',
        company_name: userData.company_name,
        business_email: userData.business_email,
        is_company_email_verified: userData.is_company_email_verified,
        phone_number: userData.phone_number,
        country: userData.country,
        city: userData.city,
        business_type: userData.business_type,
        industry: userData.industry,
        company_size: userData.company_size
      };
    } else {
      userResponse = {
        ...userResponse,
        username: userData.username,
        phone_number: userData.phone_number,
        country: userData.country,
        city: userData.city,
        skills: userData.skills,
        experience_level: userData.experience_level,
        hourly_rate: userData.hourly_rate,
        availability_status: userData.availability_status
      };
    }

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET PROFILE (Role-based) ====================
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    let userData;
    if (req.user.role === "client") {
      userData = await Client.findById(req.user.id).select('-password');
    } else {
      userData = await Freelancer.findById(req.user.id).select('-password');
    }

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: userData });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== UPDATE PROFILE (Role-based) ====================
router.put("/profile", authMiddleware, upload.single('profile_picture'), async (req, res) => {
  try {
    console.log('=== UPDATE PROFILE START ===');
    console.log('User from token:', req.user);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    let updateData = {};
    let user;
    
    if (req.user.role === "client") {
      user = await Client.findById(req.user.id);
      console.log('Found client:', user ? 'YES' : 'NO');
      
      const allowedFields = [
        "first_name", "last_name", "company_name", "phone_number", 
        "country", "city", "address", "business_type",
        "industry", "bio_about", "website", "budget_range", 
        "preferred_communication_method",
        "company_size"
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== null) {
          updateData[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
        }
      });
    } else {
      user = await Freelancer.findById(req.user.id);
      console.log('Found freelancer:', user ? 'YES' : 'NO');
      
      const allowedFields = [
        "first_name", "last_name", "username", "phone_number", "country",
        "city", "address", "skills", "experience_level",
        "years_of_experience", "portfolio_link", "resume_cv_url", "hourly_rate",
        "fixed_rate", "bio_about_me", "languages", "certifications", "availability_status"
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== null) {
          if (field === "skills" || field === "languages" || field === "certifications") {
            if (typeof req.body[field] === 'string') {
              try {
                updateData[field] = JSON.parse(req.body[field]);
              } catch (e) {
                updateData[field] = req.body[field].split(',').map(item => item.trim()).filter(item => item);
              }
            } else {
              updateData[field] = req.body[field];
            }
          } else if (field === "years_of_experience") {
            updateData[field] = req.body[field] ? parseInt(req.body[field]) : null;
          } else if (field === "hourly_rate" || field === "fixed_rate") {
            updateData[field] = req.body[field] ? parseFloat(req.body[field]) : null;
          } else {
            updateData[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
          }
        }
      });
    }

    console.log('Update data prepared:', updateData);

    // Handle profile picture update
    if (req.file) {
      if (user.profile_picture_public_id) {
        await cloudinary.uploader.destroy(user.profile_picture_public_id);
      }
      updateData.profile_picture = req.file.path;
      updateData.profile_picture_public_id = req.file.filename;
    }

    let updatedUser;
    if (req.user.role === "client") {
      updatedUser = await Client.findByIdAndUpdate(
        req.user.id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      updatedUser = await Freelancer.findByIdAndUpdate(
        req.user.id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      ).select('-password');
    }

    console.log('Updated user:', updatedUser ? 'SUCCESS' : 'NOT FOUND');

    if (!updatedUser) {
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error('=== UPDATE PROFILE ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', JSON.stringify(err, null, 2));
    console.error('Stack:', err.stack);
    
    if (req.file) await cloudinary.uploader.destroy(req.file.filename);
    
    res.status(500).json({ 
      error: err.message,
      name: err.name,
      ...(err.code && { code: err.code })
    });
  }
});

// ==================== GET FREELANCERS LIST ====================
router.get("/freelancers", authMiddleware, async (req, res) => {
  try {
    const freelancers = await Freelancer.find(
      { availability_status: "available", is_email_verified: true },
      "id first_name last_name username profile_picture skills experience_level hourly_rate fixed_rate bio_about_me availability_status country city rating total_jobs_completed"
    );

    res.json({ freelancers });
  } catch (err) {
    console.error('Get freelancers error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== DELETE PROFILE PICTURE ====================
router.delete("/profile/picture", authMiddleware, async (req, res) => {
  try {
    let user;
    if (req.user.role === "client") {
      user = await Client.findById(req.user.id);
      if (user.profile_picture_public_id) {
        await cloudinary.uploader.destroy(user.profile_picture_public_id);
        user.profile_picture = null;
        user.profile_picture_public_id = null;
        await user.save();
      }
    } else {
      user = await Freelancer.findById(req.user.id);
      if (user.profile_picture_public_id) {
        await cloudinary.uploader.destroy(user.profile_picture_public_id);
        user.profile_picture = null;
        user.profile_picture_public_id = null;
        await user.save();
      }
    }

    res.json({ message: "Profile picture deleted successfully" });
  } catch (err) {
    console.error('Delete profile picture error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;