import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Freelancer from '../models/Freelancer.js';
import NotificationService from './notificationService.js';
import ContractService from './contractService.js';

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
    
    // Notify client
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
    
    // Notify freelancer
    await NotificationService.createNotification({
      recipient_id: application.freelancer_id._id,
      recipient_model: 'Freelancer',
      sender_id: client_id,
      sender_model: 'Client',
      type: 'application_status_updated',
      title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
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
    
    // If offered, create offer notification
    if (status === 'offered' && application.offer) {
      await NotificationService.createNotification({
        recipient_id: application.freelancer_id._id,
        recipient_model: 'Freelancer',
        sender_id: client_id,
        sender_model: 'Client',
        type: 'offer_received',
        title: 'You received a job offer!',
        message: `Client offered $${application.offer.amount} for "${application.job_id.title}"`,
        reference_id: application._id,
        reference_model: 'Application',
        priority: 'urgent',
        actions: [
          {
            label: 'View Offer',
            action_type: 'view_offer',
            data: { application_id: application._id },
          },
        ],
      });
    }
    
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
    
    // Notify freelancer
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
    
    // Notify client
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