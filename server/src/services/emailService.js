// src/services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ==================== CREATE TRANSPORTER ====================

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
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
};

// ==================== CODE GENERATION ====================

export const generateVerificationCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
};

export const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// ==================== HTML TEMPLATES ====================

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

// ==================== VERIFICATION EMAIL ====================

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

// ==================== PASSWORD RESET EMAIL ====================

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

// ==================== WELCOME EMAIL ====================

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

// ==================== NEW JOB NOTIFICATION EMAIL ====================

const getNewJobNotificationHTML = (jobData, freelancerName = '') => {
  const {
    title,
    description,
    category,
    job_type,
    budget,
    company_name,
    client_name,
    client_email,
    client_phone,
    client_company,
    client_profile_picture,
    client_bio,
    client_rating,
    posted_date,
    job_id,
    required_skills = [],
    experience_level,
    work_setup,
    application_deadline,
    location
  } = jobData;

  const skillsHtml = required_skills.length > 0 
    ? required_skills.map(skill => 
        `<span style="display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 3px 4px 3px 0;">${skill}</span>`
      ).join('')
    : '<span style="color: #8BA5BC;">No specific skills required</span>';

  // Client info section
  const clientInfoHtml = `
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h3 style="color: #071B2E; font-size: 16px; margin-bottom: 10px;">👤 About the Client</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <span style="color: #8BA5BC; font-size: 12px;">Name</span>
          <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${client_name || 'Not specified'}</p>
        </div>
        ${company_name ? `
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">Company</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${company_name}</p>
          </div>
        ` : ''}
        ${client_email ? `
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">Email</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${client_email}</p>
          </div>
        ` : ''}
        ${client_phone ? `
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">Phone</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${client_phone}</p>
          </div>
        ` : ''}
        ${client_rating ? `
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">Rating</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">⭐ ${client_rating.average || 0} (${client_rating.count || 0} reviews)</p>
          </div>
        ` : ''}
        ${location?.city || location?.country ? `
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">Location</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">
              ${[location?.city, location?.province, location?.country].filter(Boolean).join(', ')}
            </p>
          </div>
        ` : ''}
        ${client_bio ? `
          <div style="grid-column: 1 / -1;">
            <span style="color: #8BA5BC; font-size: 12px;">About</span>
            <p style="color: #4A5B6E; margin: 2px 0; font-size: 14px;">${client_bio.substring(0, 150)}${client_bio.length > 150 ? '...' : ''}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const content = `
    <div class="content">
      <div style="background: #e8f5e9; padding: 12px 20px; border-radius: 8px; border-left: 4px solid #00C9A7; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #1e7e34;">
          <strong>📢 New Job Opportunity!</strong>
        </p>
      </div>
      
      <h2 style="color: #071B2E; font-size: 24px; margin-bottom: 15px;">
        ${title}
      </h2>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">💰 Budget</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">
              ${budget?.type === 'fixed' ? '₱' : '₱'}
              ${budget?.min ? budget.min : ''} 
              ${budget?.max ? `- ${budget.max}` : ''}
              ${budget?.type === 'hourly' ? '/hour' : ''}
              ${budget?.negotiable ? '(Negotiable)' : ''}
            </p>
          </div>
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">📋 Job Type</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${job_type || 'Project'}</p>
          </div>
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">📍 Work Setup</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${work_setup || 'Remote'}</p>
          </div>
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">📊 Experience Level</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${experience_level || 'Entry'}</p>
          </div>
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">📂 Category</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${category || 'Not specified'}</p>
          </div>
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">📅 Posted</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${posted_date || new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      ${clientInfoHtml}

      <div style="margin: 15px 0;">
        <h3 style="color: #071B2E; font-size: 16px; margin-bottom: 10px;">📝 Description</h3>
        <p style="color: #4A5B6E; line-height: 1.8;">${description || 'No description provided.'}</p>
      </div>

      <div style="margin: 15px 0;">
        <h3 style="color: #071B2E; font-size: 16px; margin-bottom: 10px;">🔧 Required Skills</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
          ${skillsHtml}
        </div>
      </div>

      ${application_deadline ? `
        <div style="background: #fff3cd; padding: 12px 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 15px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            ⏰ Application Deadline: <strong>${new Date(application_deadline).toLocaleDateString()}</strong>
          </p>
        </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${job_id}" 
           style="display: inline-block; background: #00C9A7; color: #ffffff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          View & Apply Now
        </a>
      </div>

      <p style="font-size: 14px; color: #8BA5BC; text-align: center;">
        You're receiving this because you're subscribed to job notifications.
        <br>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/notifications" 
           style="color: #00C9A7; text-decoration: none;">
          Manage notifications
        </a>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content, 'New Job Opportunity - Taskra');
};

// ==================== JOB POSTED CONFIRMATION EMAIL ====================

const getJobPostedConfirmationHTML = (jobData, clientName = '') => {
  const {
    title,
    job_id,
    status,
    posted_date,
    job_type,
    budget,
    category
  } = jobData;

  const content = `
    <div class="content">
      <div style="background: #e8f5e9; padding: 12px 20px; border-radius: 8px; border-left: 4px solid #00C9A7; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #1e7e34;">
          <strong>✅ Job Posted Successfully!</strong>
        </p>
      </div>
      
      <h2 style="color: #071B2E; font-size: 24px; margin-bottom: 15px;">
        Your job "${title}" is now live!
      </h2>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">📋 Job ID</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${job_id}</p>
          </div>
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">📅 Posted Date</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${posted_date || new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">📊 Status</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${status || 'Open'}</p>
          </div>
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">📂 Category</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${category || 'Not specified'}</p>
          </div>
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">📋 Job Type</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">${job_type || 'Project'}</p>
          </div>
          <div>
            <span style="color: #8BA5BC; font-size: 12px;">💰 Budget</span>
            <p style="color: #071B2E; font-weight: 600; margin: 2px 0;">
              ${budget?.type === 'fixed' ? '₱' : '₱'}
              ${budget?.min ? budget.min : ''} 
              ${budget?.max ? `- ${budget.max}` : ''}
              ${budget?.type === 'hourly' ? '/hour' : ''}
            </p>
          </div>
        </div>
      </div>

      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 15px 0;">
        <p style="margin: 0; color: #0d47a1; font-size: 14px;">
          <strong>📌 What's Next?</strong>
        </p>
        <ul style="color: #0d47a1; margin: 10px 0 0 20px; font-size: 14px;">
          <li>Freelancers will start applying to your job</li>
          <li>Review applications in your dashboard</li>
          <li>Shortlist and interview candidates</li>
          <li>Hire the best freelancer for the job</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/jobs/${job_id}" 
           style="display: inline-block; background: #00C9A7; color: #ffffff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          View Your Job
        </a>
        <br><br>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/jobs" 
           style="display: inline-block; background: #071B2E; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Manage All Jobs
        </a>
      </div>

      <p style="font-size: 14px; color: #8BA5BC; text-align: center;">
        Need help? 
        <a href="mailto:support@taskra.com" style="color: #00C9A7; text-decoration: none;">
          Contact support
        </a>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content, 'Job Posted Successfully - Taskra');
};

// ==================== MAIN EMAIL FUNCTIONS ====================

export const sendEmail = async (to, subject, html, retries = 3) => {
  const transporter = createTransporter();
  
  if (!to || !to.trim()) {
    throw new Error('Recipient email is required');
  }
  
  const mailOptions = {
    from: `"Taskra" <${process.env.EMAIL_USER || 'noreply@taskra.com'}>`,
    to: to.trim(),
    subject: subject,
    html: html,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to} (Attempt ${attempt})`);
      console.log(`📧 Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed for ${to}:`, error.message);
      
      if (attempt === retries) {
        throw new Error(`Failed to send email after ${retries} attempts: ${error.message}`);
      }
      
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

export const sendVerificationEmail = async (email, code, name = '', isBusiness = false, businessEmail = '') => {
  const subject = isBusiness 
    ? 'Verify Your Business Email - Taskra' 
    : 'Verify Your Email - Taskra';
  
  const html = getVerificationEmailHTML(name, code, isBusiness, businessEmail || email);
  
  return await sendEmail(email, subject, html);
};

export const sendPasswordResetEmail = async (email, code, name = '') => {
  const subject = 'Reset Your Password - Taskra';
  const html = getPasswordResetHTML(name, code);
  
  return await sendEmail(email, subject, html);
};

export const sendWelcomeEmail = async (email, name = '', role = '') => {
  const subject = '🎉 Welcome to Taskra!';
  const html = getWelcomeEmailHTML(name, role);
  
  return await sendEmail(email, subject, html);
};

export const sendBusinessVerificationEmail = async (email, code, companyName = '') => {
  return await sendVerificationEmail(email, code, companyName, true, email);
};

// ==================== JOB NOTIFICATION EMAIL FUNCTIONS ====================

export const sendNewJobNotification = async (freelancerEmail, jobData, freelancerName = '') => {
  const subject = `📢 New Job: ${jobData.title}`;
  const html = getNewJobNotificationHTML(jobData, freelancerName);
  
  return await sendEmail(freelancerEmail, subject, html);
};

export const sendJobPostedConfirmation = async (clientEmail, jobData, clientName = '') => {
  const subject = `✅ Job Posted: ${jobData.title}`;
  const html = getJobPostedConfirmationHTML(jobData, clientName);
  
  return await sendEmail(clientEmail, subject, html);
};

export const sendBulkJobNotifications = async (freelancers, jobData) => {
  const results = [];
  const batchSize = 10;
  const delayBetweenBatches = 1000;
  
  for (let i = 0; i < freelancers.length; i += batchSize) {
    const batch = freelancers.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (freelancer) => {
      try {
        const html = getNewJobNotificationHTML(jobData, freelancer.first_name);
        const result = await sendEmail(
          freelancer.email_address, 
          `📢 New Job: ${jobData.title}`, 
          html
        );
        return { 
          email: freelancer.email_address, 
          freelancer_id: freelancer._id,
          success: true, 
          result 
        };
      } catch (error) {
        console.error(`Failed to send job notification to ${freelancer.email_address}:`, error.message);
        return { 
          email: freelancer.email_address, 
          freelancer_id: freelancer._id,
          success: false, 
          error: error.message 
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    if (i + batchSize < freelancers.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`📊 Job notification summary: ${successful} sent, ${failed} failed`);
  
  return results;
};

// ==================== BULK EMAIL FUNCTIONS ====================

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

export const getEmailTemplate = (templateName, data = {}) => {
  switch (templateName) {
    case 'verification':
      return getVerificationEmailHTML(data.name, data.code, data.isBusiness || false, data.businessEmail);
    case 'password-reset':
      return getPasswordResetHTML(data.name, data.code);
    case 'welcome':
      return getWelcomeEmailHTML(data.name, data.role || '');
    case 'new-job':
      return getNewJobNotificationHTML(data.jobData, data.freelancerName);
    case 'job-posted':
      return getJobPostedConfirmationHTML(data.jobData, data.clientName);
    default:
      throw new Error(`Unknown email template: ${templateName}`);
  }
};

// ==================== TEST FUNCTION ====================

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
  sendNewJobNotification,
  sendJobPostedConfirmation,
  sendBulkJobNotifications,
  sendBulkEmails,
  getEmailTemplate,
  testEmailConfig,
};