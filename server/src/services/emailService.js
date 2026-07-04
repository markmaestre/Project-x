// src/services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ==================== CREATE TRANSPORTER ====================

// Create transporter with better configuration
const createTransporter = () => {
  // For development using Ethereal (testing)
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_EMAIL || 'your-ethereal-email@ethereal.email',
        pass: process.env.ETHEREAL_PASSWORD || 'your-ethereal-password',
      },
    });
  }

  // For production
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    pool: true, // Use connection pooling
    maxConnections: 5,
    maxMessages: 100,
  });
};

// ==================== CODE GENERATION ====================

// Generate random 6-digit verification code
export const generateVerificationCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
};

// Generate random 8-character password (optional)
export const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// ==================== HTML TEMPLATES ====================

// Get base email template wrapper
const getBaseTemplate = (content, title = 'Taskra') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
          background: #f4f7fa; 
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #071B2E 0%, #0D2B44 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          color: #00C9A7;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 2px;
          margin: 0;
        }
        .header p {
          color: #8BA5BC;
          font-size: 14px;
          margin-top: 5px;
        }
        .content {
          padding: 40px 30px;
          background: #ffffff;
        }
        .footer {
          padding: 30px;
          text-align: center;
          background: #f8fafc;
          border-top: 1px solid #e8edf3;
        }
        .footer p {
          color: #8BA5BC;
          font-size: 12px;
          line-height: 1.6;
        }
        .footer a {
          color: #00C9A7;
          text-decoration: none;
        }
        @media (max-width: 480px) {
          .container { border-radius: 0; }
          .content { padding: 20px; }
          .header { padding: 30px 20px; }
          .header h1 { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Taskra</h1>
          <p>Waste Innovations Platform</p>
        </div>
        ${content}
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Taskra. All rights reserved.</p>
          <p style="font-size: 11px;">
            <a href="#">Privacy Policy</a> • 
            <a href="#">Terms of Service</a> • 
            <a href="#">Help Center</a>
          </p>
          <p style="font-size: 11px; margin-top: 10px; color: #b0c4d9;">
            This is an automated message, please do not reply directly.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email verification template
const getVerificationEmailHTML = (name = '', code, isBusiness = false, businessEmail = '') => {
  const content = `
    <div class="content">
      ${isBusiness ? `
        <div style="background: #f0f9ff; padding: 12px 20px; border-radius: 8px; border-left: 4px solid #00C9A7; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; color: #071B2E;">
            <strong>🏢 Business Verification</strong>
          </p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #4A5B6E;">
            Verifying business email: <strong>${businessEmail || 'your business email'}</strong>
          </p>
        </div>
      ` : ''}
      
      <h2 style="color: #071B2E; font-size: 24px; margin-bottom: 15px;">
        ${isBusiness ? 'Verify Your Business Email' : 'Verify Your Email Address'}
      </h2>
      
      <p style="color: #4A5B6E; line-height: 1.8; margin-bottom: 15px;">
        Hello${name ? ' ' + name : ''},
      </p>
      
      <p style="color: #4A5B6E; line-height: 1.8; margin-bottom: 20px;">
        ${isBusiness 
          ? 'Thank you for registering your business with Taskra. Please use the verification code below to verify your business email address:' 
          : 'Thank you for registering with Taskra. Please use the verification code below to complete your registration:'}
      </p>

      <div style="background: #f8fafc; border: 2px dashed #00C9A7; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
        <div style="font-size: 40px; font-weight: 700; color: #071B2E; letter-spacing: 8px; font-family: 'Courier New', monospace;">
          ${code}
        </div>
        <div style="font-size: 14px; color: #8BA5BC; margin-top: 10px;">
          ⏱️ This code will expire in <strong>10 minutes</strong>
        </div>
      </div>

      <div style="background: #fff3cd; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>⚠️ Security Notice:</strong> If you didn't request this, please ignore this email.
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, isBusiness ? 'Verify Your Business Email' : 'Verify Your Email');
};

// Password reset template
const getPasswordResetHTML = (name = '', code) => {
  const content = `
    <div class="content">
      <h2 style="color: #071B2E; font-size: 24px; margin-bottom: 15px;">
        🔐 Reset Your Password
      </h2>
      
      <p style="color: #4A5B6E; line-height: 1.8; margin-bottom: 15px;">
        Hello${name ? ' ' + name : ''},
      </p>
      
      <p style="color: #4A5B6E; line-height: 1.8; margin-bottom: 20px;">
        We received a request to reset the password for your Taskra account. Use the verification code below to set a new password:
      </p>

      <div style="background: #f8fafc; border: 2px dashed #00C9A7; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
        <div style="font-size: 40px; font-weight: 700; color: #071B2E; letter-spacing: 8px; font-family: 'Courier New', monospace;">
          ${code}
        </div>
        <div style="font-size: 14px; color: #8BA5BC; margin-top: 10px;">
          ⏱️ This code will expire in <strong>10 minutes</strong>
        </div>
      </div>

      <div style="background: #fff3cd; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact support immediately.
        </p>
      </div>

      <p style="text-align: center; margin: 25px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password" 
           style="display: inline-block; background: #00C9A7; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content, 'Reset Your Password');
};

// Welcome email template
const getWelcomeEmailHTML = (name = '', role = '') => {
  const content = `
    <div class="content">
      <h2 style="color: #071B2E; font-size: 24px; margin-bottom: 15px;">
        🎉 Welcome to Taskra${name ? ', ' + name : ''}!
      </h2>
      
      <p style="color: #4A5B6E; line-height: 1.8; margin-bottom: 15px;">
        We're excited to have you on board! Taskra is the leading platform for waste innovation and sustainable solutions.
      </p>
      
      <p style="color: #4A5B6E; line-height: 1.8; margin-bottom: 15px;">
        Your account has been successfully verified as a <strong>${role || 'member'}</strong>.
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0;">
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 5px;">🔍</div>
          <div style="font-size: 12px; color: #4A5B6E; font-weight: 600;">Find Opportunities</div>
        </div>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 5px;">🤝</div>
          <div style="font-size: 12px; color: #4A5B6E; font-weight: 600;">Connect with Clients</div>
        </div>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 5px;">📊</div>
          <div style="font-size: 12px; color: #4A5B6E; font-weight: 600;">Track Projects</div>
        </div>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 5px;">⭐</div>
          <div style="font-size: 12px; color: #4A5B6E; font-weight: 600;">Build Your Reputation</div>
        </div>
      </div>

      <p style="text-align: center; margin: 25px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
           style="display: inline-block; background: #00C9A7; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Go to Dashboard
        </a>
      </p>
      
      <p style="font-size: 14px; color: #8BA5BC;">
        If you have any questions, feel free to 
        <a href="mailto:support@taskra.com" style="color: #00C9A7; text-decoration: none;">contact our support team</a>.
      </p>
    </div>
  `;
  
  return getBaseTemplate(content, 'Welcome to Taskra');
};

// ==================== MAIN EMAIL FUNCTIONS ====================

// Send email with retry logic
export const sendEmail = async (to, subject, html, retries = 3) => {
  const transporter = createTransporter();
  
  // Validate email
  if (!to || !to.trim()) {
    throw new Error('Recipient email is required');
  }
  
  const mailOptions = {
    from: `"Taskra" <${process.env.EMAIL_USER || 'noreply@taskra.com'}>`,
    to: to.trim(),
    subject: subject,
    html: html,
  };

  // Retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to} (Attempt ${attempt})`);
      console.log(`📧 Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed for ${to}:`, error.message);
      
      if (attempt === retries) {
        // Last attempt failed, throw error
        throw new Error(`Failed to send email after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Send verification email (with optional business flag)
export const sendVerificationEmail = async (email, code, name = '', isBusiness = false, businessEmail = '') => {
  const subject = isBusiness 
    ? 'Verify Your Business Email - Taskra' 
    : 'Verify Your Email - Taskra';
  
  const html = getVerificationEmailHTML(name, code, isBusiness, businessEmail || email);
  
  return await sendEmail(email, subject, html);
};

// Send password reset email
export const sendPasswordResetEmail = async (email, code, name = '') => {
  const subject = 'Reset Your Password - Taskra';
  const html = getPasswordResetHTML(name, code);
  
  return await sendEmail(email, subject, html);
};

// Send welcome email
export const sendWelcomeEmail = async (email, name = '', role = '') => {
  const subject = '🎉 Welcome to Taskra!';
  const html = getWelcomeEmailHTML(name, role);
  
  return await sendEmail(email, subject, html);
};

// Send business verification email (alias)
export const sendBusinessVerificationEmail = async (email, code, companyName = '') => {
  return await sendVerificationEmail(email, code, companyName, true, email);
};

// ==================== BULK EMAIL FUNCTIONS ====================

// Send bulk emails with rate limiting
export const sendBulkEmails = async (recipients, subject, htmlTemplate, dataMapper = null) => {
  const results = [];
  const batchSize = 10;
  const delayBetweenBatches = 1000;
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (recipient) => {
      try {
        const html = htmlTemplate(dataMapper ? dataMapper(recipient) : recipient);
        const result = await sendEmail(recipient.email, subject, html);
        return { email: recipient.email, success: true, result };
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error.message);
        return { email: recipient.email, success: false, error: error.message };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`📊 Bulk email summary: ${successful} sent, ${failed} failed`);
  
  return results;
};

// ==================== TEMPLATE HELPERS ====================

// Get email template by name
export const getEmailTemplate = (templateName, data = {}) => {
  switch (templateName) {
    case 'verification':
      return getVerificationEmailHTML(data.name, data.code, data.isBusiness || false, data.businessEmail);
    case 'password-reset':
      return getPasswordResetHTML(data.name, data.code);
    case 'welcome':
      return getWelcomeEmailHTML(data.name, data.role || '');
    default:
      throw new Error(`Unknown email template: ${templateName}`);
  }
};

// ==================== TEST FUNCTION ====================

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    console.log(`📧 Using service: ${process.env.EMAIL_SERVICE || 'Gmail'}`);
    console.log(`📧 From: ${process.env.EMAIL_USER || 'noreply@taskra.com'}`);
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    console.error('Please check your EMAIL_USER and EMAIL_PASS in .env');
    return false;
  }
};

// ==================== EXPORTS ====================

export default {
  generateVerificationCode,
  generateRandomPassword,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendBusinessVerificationEmail,
  sendBulkEmails,
  getEmailTemplate,
  testEmailConfig,
};