import Client from '../models/Client.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class ClientService {
  
  static async registerClient(data) {
    const {
      first_name,
      last_name,
      email_address,
      password,
      client_type = 'personal',
      company_name,
      business_email,
      terms_accepted,
      phone_number,
      country,
      city,
      address,
      website,
      industry,
      company_size,
      business_type
    } = data;
    
    // Check if email exists
    const existing = await Client.findOne({ email_address });
    if (existing) {
      throw new Error('Email already registered');
    }
    
    // Validate business requirements
    if (client_type === 'business') {
      if (!business_email) {
        throw new Error('Business email is required for business accounts');
      }
      
      if (!company_name) {
        throw new Error('Company name is required for business accounts');
      }
      
      // Check if business email is already used
      const existingBusiness = await Client.findOne({ business_email });
      if (existingBusiness) {
        throw new Error('Business email already registered');
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification code
    const verificationCode = crypto.randomBytes(3).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);
    
    // Create client
    const client = new Client({
      first_name,
      last_name,
      email_address,
      password: hashedPassword,
      client_type,
      company_name: client_type === 'business' ? company_name : null,
      business_email: client_type === 'business' ? business_email : null,
      company_email_domain: client_type === 'business' ? business_email?.split('@')[1] : null,
      terms_accepted,
      phone_number,
      country,
      city,
      address,
      website,
      industry,
      company_size,
      business_type,
      verification_code: verificationCode,
      verification_code_expires: verificationExpires,
      account_status: 'active',
      is_email_verified: false,
      is_company_email_verified: false,
    });
    
    await client.save();
    
    // Send verification email (implement email service)
    // await EmailService.sendVerificationEmail(client);
    
    return client;
  }
  
  static async verifyEmail(email, code) {
    const client = await Client.findOne({
      email_address: email,
      verification_code: code,
      verification_code_expires: { $gt: new Date() }
    });
    
    if (!client) {
      throw new Error('Invalid or expired verification code');
    }
    
    client.is_email_verified = true;
    client.verification_code = null;
    client.verification_code_expires = null;
    
    if (client.client_type === 'business' && client.business_email) {
      client.is_company_email_verified = true;
    }
    
    await client.save();
    return client;
  }
  
  static async getClientProfile(clientId) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    return client;
  }
  
  static async updateClientProfile(clientId, data) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    
    const allowedFields = [
      'first_name', 'last_name', 'phone_number', 'country', 'city',
      'address', 'bio_about', 'website', 'preferred_communication_method',
      'company_name', 'company_logo', 'company_size', 'business_type',
      'industry', 'budget_range'
    ];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        client[field] = data[field];
      }
    });
    
    await client.save();
    return client;
  }
  
  static async updatePushToken(clientId, pushToken) {
    await Client.findByIdAndUpdate(clientId, { push_token: pushToken });
  }
  
  static async login(email, password) {
    const client = await Client.findOne({ email_address: email });
    if (!client) {
      throw new Error('Invalid credentials');
    }
    
    const isValid = await bcrypt.compare(password, client.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    
    client.last_login = new Date();
    client.is_online = true;
    await client.save();
    
    return client;
  }
}

export default ClientService;