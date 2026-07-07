// src/services/applicationService.js
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Freelancer from '../models/Freelancer.js';
import NotificationService from './notificationService.js';
import ContractService from './contractService.js';
import { sendEmail, getEmailTemplate } from './emailService.js';

class ApplicationService {
  
  static async submitApplication({
    job_id,
    freelancer_id,
    cover_letter,
    proposed_rate,
    resume,
    education,
    experiences
  }) {
    // Check if already applied
    const existing = await Application.findOne({ job_id, freelancer_id });
    if (existing) {
      throw new Error('You have already applied for this job');
    }
    
    // Check if job exists and is open
    const job = await Job.findById(job_id).populate('client_id');
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (job.status !== 'open') {
      throw new Error('This job is no longer accepting applications');
    }
    
    // Check freelancer status
    const freelancer = await Freelancer.findById(freelancer_id);
    if (!freelancer || freelancer.account_status !== 'active') {
      throw new Error('Your account is not active');
    }
    
    // Create application
    const application = new Application({
      job_id,
      freelancer_id,
      cover_letter,
      proposed_rate,
      resume,
      education,
      experiences,
      status: 'pending',
    });
    
    await application.save();
    
    // Update job analytics
    await Job.findByIdAndUpdate(job_id, {
      $inc: { 'analytics.applications': 1 }
    });
    
    // --- EMAIL NOTIFICATIONS ---
    
    // 1. Notify Client via Email
    try {
      const clientEmailData = {
        job_title: job.title,
        job_id: job._id,
        freelancer_name: `${freelancer.first_name} ${freelancer.last_name}`,
        freelancer_email: freelancer.email_address,
        freelancer_profile: freelancer.profile_picture,
        cover_letter: cover_letter,
        proposed_rate: proposed_rate,
        applied_at: new Date(),
        application_id: application._id,
        client_name: job.client_id.first_name || 'Client',
      };
      
      const clientEmailHtml = getEmailTemplate('application-received-client', clientEmailData);
      await sendEmail(
        job.client_id.email_address,
        `📝 New Application for "${job.title}" - Taskra`,
        clientEmailHtml
      );
      console.log(`✅ Application notification email sent to client: ${job.client_id.email_address}`);
    } catch (emailError) {
      console.error('❌ Failed to send client application notification email:', emailError.message);
    }
    
    // 2. Notify Freelancer via Email (Confirmation)
    try {
      const freelancerEmailData = {
        job_title: job.title,
        job_id: job._id,
        job_category: job.category,
        job_type: job.job_type,
        budget: job.budget,
        cover_letter: cover_letter,
        proposed_rate: proposed_rate,
        applied_at: new Date(),
        application_id: application._id,
        freelancer_name: `${freelancer.first_name} ${freelancer.last_name}`,
      };
      
      const freelancerEmailHtml = getEmailTemplate('application-confirmation-freelancer', freelancerEmailData);
      await sendEmail(
        freelancer.email_address,
        `✅ Application Submitted for "${job.title}" - Taskra`,
        freelancerEmailHtml
      );
      console.log(`✅ Application confirmation email sent to freelancer: ${freelancer.email_address}`);
    } catch (emailError) {
      console.error('❌ Failed to send freelancer application confirmation email:', emailError.message);
    }
    
    // 3. In-app notification for client
    await NotificationService.createNotification({
      recipient_id: job.client_id._id,
      recipient_model: 'Client',
      sender_id: freelancer_id,
      sender_model: 'Freelancer',
      type: 'application_submitted',
      title: 'New Application Received',
      message: `${freelancer.first_name} ${freelancer.last_name} applied for "${job.title}"`,
      reference_id: application._id,
      reference_model: 'Application',
      priority: 'high',
      actions: [
        {
          label: 'View Application',
          action_type: 'view_application',
          data: { application_id: application._id },
        },
      ],
    });
    
    return application;
  }
  
  static async updateApplicationStatus({
    application_id,
    status,
    client_id,
    notes
  }) {
    const application = await Application.findById(application_id)
      .populate('job_id')
      .populate('freelancer_id');
    
    if (!application) {
      throw new Error('Application not found');
    }
    
    // Verify client owns the job
    if (application.job_id.client_id.toString() !== client_id.toString()) {
      throw new Error('Unauthorized');
    }
    
    const oldStatus = application.status;
    application.status = status;
    application.client_notes = notes || application.client_notes;
    
    if (status === 'withdrawn') {
      application.withdrawn_at = new Date();
    }
    
    await application.save();
    
    // --- EMAIL NOTIFICATIONS ---
    
    const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
    const jobTitle = application.job_id.title;
    const freelancerEmail = application.freelancer_id.email_address;
    const freelancerName = `${application.freelancer_id.first_name} ${application.freelancer_id.last_name}`;
    const clientName = application.job_id.client_id.first_name || 'Client';
    
    // Send status update email to freelancer
    try {
      const emailData = {
        status: status,
        status_display: statusDisplay,
        job_title: jobTitle,
        job_id: application.job_id._id,
        application_id: application._id,
        freelancer_name: freelancerName,
        client_name: clientName,
        notes: notes || '',
        updated_at: new Date(),
      };
      
      const emailHtml = getEmailTemplate('application-status-update', emailData);
      await sendEmail(
        freelancerEmail,
        `📋 Application ${statusDisplay} for "${jobTitle}" - Taskra`,
        emailHtml
      );
      console.log(`✅ Status update email sent to freelancer: ${freelancerEmail}`);
    } catch (emailError) {
      console.error('❌ Failed to send status update email:', emailError.message);
    }
    
    // If offered, send special offer email
    if (status === 'offered' && application.offer) {
      try {
        const offerEmailData = {
          job_title: jobTitle,
          job_id: application.job_id._id,
          application_id: application._id,
          freelancer_name: freelancerName,
          client_name: clientName,
          offer_amount: application.offer.amount,
          offer_message: application.offer.message || '',
          offer_sent_at: application.offer.sent_at || new Date(),
          job_type: application.job_id.job_type,
          work_setup: application.job_id.work_setup,
        };
        
        const offerEmailHtml = getEmailTemplate('offer-received', offerEmailData);
        await sendEmail(
          freelancerEmail,
          `🎉 You've Received a Job Offer for "${jobTitle}" - Taskra`,
          offerEmailHtml
        );
        console.log(`✅ Offer email sent to freelancer: ${freelancerEmail}`);
      } catch (emailError) {
        console.error('❌ Failed to send offer email:', emailError.message);
      }
    }
    
    // If hired, send hired email
    if (status === 'hired') {
      try {
        const hiredEmailData = {
          job_title: jobTitle,
          job_id: application.job_id._id,
          application_id: application._id,
          freelancer_name: freelancerName,
          client_name: clientName,
          hired_at: new Date(),
          job_type: application.job_id.job_type,
          work_setup: application.job_id.work_setup,
        };
        
        const hiredEmailHtml = getEmailTemplate('hired-confirmation', hiredEmailData);
        await sendEmail(
          freelancerEmail,
          `🎊 You've Been Hired for "${jobTitle}" - Taskra`,
          hiredEmailHtml
        );
        console.log(`✅ Hired email sent to freelancer: ${freelancerEmail}`);
      } catch (emailError) {
        console.error('❌ Failed to send hired email:', emailError.message);
      }
    }
    
    // In-app notification for freelancer
    await NotificationService.createNotification({
      recipient_id: application.freelancer_id._id,
      recipient_model: 'Freelancer',
      sender_id: client_id,
      sender_model: 'Client',
      type: 'application_status_updated',
      title: `Application ${statusDisplay}`,
      message: `Your application for "${application.job_id.title}" has been ${status}`,
      reference_id: application._id,
      reference_model: 'Application',
      priority: status === 'hired' || status === 'offered' ? 'high' : 'medium',
      actions: [
        {
          label: 'View Status',
          action_type: 'view_application',
          data: { application_id: application._id },
        },
      ],
    });
    
    return application;
  }
  
  static async sendOffer({
    application_id,
    client_id,
    amount,
    message
  }) {
    const application = await Application.findById(application_id)
      .populate('job_id')
      .populate('freelancer_id');
    
    if (!application) {
      throw new Error('Application not found');
    }
    
    if (application.job_id.client_id.toString() !== client_id.toString()) {
      throw new Error('Unauthorized');
    }
    
    application.offer = {
      amount,
      message,
      sent_at: new Date(),
    };
    application.status = 'offered';
    
    await application.save();
    
    // --- EMAIL NOTIFICATION ---
    try {
      const offerEmailData = {
        job_title: application.job_id.title,
        job_id: application.job_id._id,
        application_id: application._id,
        freelancer_name: `${application.freelancer_id.first_name} ${application.freelancer_id.last_name}`,
        client_name: application.job_id.client_id.first_name || 'Client',
        offer_amount: amount,
        offer_message: message || 'We would like to offer you this position.',
        offer_sent_at: new Date(),
        job_type: application.job_id.job_type,
        work_setup: application.job_id.work_setup,
        budget: application.job_id.budget,
      };
      
      const offerEmailHtml = getEmailTemplate('offer-received', offerEmailData);
      await sendEmail(
        application.freelancer_id.email_address,
        `🎉 New Job Offer for "${application.job_id.title}" - Taskra`,
        offerEmailHtml
      );
      console.log(`✅ Offer email sent to freelancer: ${application.freelancer_id.email_address}`);
    } catch (emailError) {
      console.error('❌ Failed to send offer email:', emailError.message);
    }
    
    // In-app notification
    await NotificationService.createNotification({
      recipient_id: application.freelancer_id._id,
      recipient_model: 'Freelancer',
      sender_id: client_id,
      sender_model: 'Client',
      type: 'offer_received',
      title: 'New Job Offer!',
      message: `You received an offer of $${amount} for "${application.job_id.title}"`,
      reference_id: application._id,
      reference_model: 'Application',
      priority: 'urgent',
      actions: [
        {
          label: 'View Offer',
          action_type: 'view_offer',
          data: { application_id: application._id },
        },
        {
          label: 'Accept',
          action_type: 'accept_offer',
          data: { application_id: application._id },
        },
        {
          label: 'Decline',
          action_type: 'decline_offer',
          data: { application_id: application._id },
        },
      ],
    });
    
    return application;
  }
  
  static async acceptOffer({
    application_id,
    freelancer_id
  }) {
    const application = await Application.findById(application_id)
      .populate('job_id')
      .populate('freelancer_id');
    
    if (!application) {
      throw new Error('Application not found');
    }
    
    if (application.freelancer_id._id.toString() !== freelancer_id.toString()) {
      throw new Error('Unauthorized');
    }
    
    if (application.status !== 'offered') {
      throw new Error('No offer to accept');
    }
    
    // Update application
    application.status = 'hired';
    await application.save();
    
    // Create contract
    const contract = await ContractService.createContract({
      job_id: application.job_id._id,
      client_id: application.job_id.client_id,
      freelancer_id: application.freelancer_id._id,
      application_id: application._id,
      agreed_budget: {
        amount: application.offer.amount,
        type: application.job_id.budget.type,
        currency: application.job_id.budget.currency || 'PHP',
      },
    });
    
    // --- EMAIL NOTIFICATIONS ---
    
    // 1. Notify Client
    try {
      const clientEmailData = {
        job_title: application.job_id.title,
        job_id: application.job_id._id,
        freelancer_name: `${application.freelancer_id.first_name} ${application.freelancer_id.last_name}`,
        freelancer_email: application.freelancer_id.email_address,
        client_name: application.job_id.client_id.first_name || 'Client',
        offer_amount: application.offer.amount,
        accepted_at: new Date(),
        contract_id: contract._id,
      };
      
      const clientEmailHtml = getEmailTemplate('offer-accepted-client', clientEmailData);
      await sendEmail(
        application.job_id.client_id.email_address,
        `✅ Freelancer Accepted Your Offer for "${application.job_id.title}" - Taskra`,
        clientEmailHtml
      );
      console.log(`✅ Offer accepted email sent to client: ${application.job_id.client_id.email_address}`);
    } catch (emailError) {
      console.error('❌ Failed to send offer accepted email to client:', emailError.message);
    }
    
    // 2. Notify Freelancer (Confirmation)
    try {
      const freelancerEmailData = {
        job_title: application.job_id.title,
        job_id: application.job_id._id,
        freelancer_name: `${application.freelancer_id.first_name} ${application.freelancer_id.last_name}`,
        client_name: application.job_id.client_id.first_name || 'Client',
        offer_amount: application.offer.amount,
        accepted_at: new Date(),
        contract_id: contract._id,
        start_date: contract.start_date || new Date(),
      };
      
      const freelancerEmailHtml = getEmailTemplate('offer-accepted-freelancer', freelancerEmailData);
      await sendEmail(
        application.freelancer_id.email_address,
        `✅ You Accepted the Offer for "${application.job_id.title}" - Taskra`,
        freelancerEmailHtml
      );
      console.log(`✅ Offer accepted confirmation email sent to freelancer: ${application.freelancer_id.email_address}`);
    } catch (emailError) {
      console.error('❌ Failed to send offer accepted confirmation to freelancer:', emailError.message);
    }
    
    // In-app notification for client
    await NotificationService.createNotification({
      recipient_id: application.job_id.client_id,
      recipient_model: 'Client',
      sender_id: freelancer_id,
      sender_model: 'Freelancer',
      type: 'offer_accepted',
      title: 'Freelancer Accepted Your Offer',
      message: `${application.freelancer_id.first_name} accepted your offer for "${application.job_id.title}"`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
    });
    
    return contract;
  }
  
  static async getJobApplications(jobId, clientId) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (job.client_id.toString() !== clientId.toString()) {
      throw new Error('Unauthorized');
    }
    
    const applications = await Application.find({ job_id: jobId })
      .populate('freelancer_id', 'first_name last_name profile_picture username rating')
      .sort({ applied_at: -1 });
    
    return applications;
  }
  
  static async getFreelancerApplications(freelancerId) {
    const applications = await Application.find({ freelancer_id: freelancerId })
      .populate('job_id', 'title client_id status budget')
      .sort({ applied_at: -1 });
    
    return applications;
  }
}

export default ApplicationService;