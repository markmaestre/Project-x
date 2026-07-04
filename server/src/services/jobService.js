import Job from '../models/Job.js';
import Client from '../models/Client.js';
import NotificationService from './notificationService.js';

class JobService {
  
  static async createJob(data) {
    const {
      client_id,
      title,
      description,
      category,
      subcategory,
      required_skills,
      tags,
      job_type,
      work_setup,
      experience_level,
      budget,
      timeline,
      hiring,
      application_deadline,
      visibility
    } = data;
    
    // Check client
    const client = await Client.findById(client_id);
    if (!client || client.account_status !== 'active') {
      throw new Error('Client account is not active');
    }
    
    // Validate budget
    if (budget.min > budget.max) {
      throw new Error('Minimum budget cannot exceed maximum budget');
    }
    
    // Create job
    const job = new Job({
      client_id,
      title,
      description,
      category,
      subcategory,
      required_skills: required_skills || [],
      tags: tags || [],
      job_type: job_type || 'project',
      work_setup: work_setup || 'remote',
      experience_level: experience_level || 'entry',
      budget,
      timeline: timeline || {
        duration_value: 1,
        duration_unit: 'weeks',
      },
      hiring: hiring || {
        max_applicants: 100,
        auto_accept: false,
        allow_multiple_hires: false,
      },
      application_deadline: application_deadline || null,
      status: 'open',
      visibility: visibility || 'public',
    });
    
    await job.save();
    
    // Notify freelancers (optional - can be implemented later)
    // This would require finding freelancers with matching skills
    
    return job;
  }
  
  static async updateJob(jobId, clientId, data) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (job.client_id.toString() !== clientId.toString()) {
      throw new Error('Unauthorized');
    }
    
    // Can't update if job is already in progress or completed
    if (job.status === 'in_progress' || job.status === 'completed') {
      throw new Error('Cannot update job that is in progress or completed');
    }
    
    Object.assign(job, data);
    await job.save();
    
    return job;
  }
  
  static async getOpenJobs(filters = {}, limit = 20, skip = 0) {
    const query = {
      status: 'open',
      is_deleted: false,
      ...filters
    };
    
    const jobs = await Job.find(query)
      .populate('client_id', 'first_name last_name company_name profile_picture rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Job.countDocuments(query);
    
    return {
      jobs,
      total,
      hasMore: total > skip + limit
    };
  }
  
  static async searchJobs(searchTerm, filters = {}, limit = 20, skip = 0) {
    const query = {
      status: 'open',
      is_deleted: false,
      $text: { $search: searchTerm },
      ...filters
    };
    
    const jobs = await Job.find(query, {
      score: { $meta: 'textScore' }
    })
    .populate('client_id', 'first_name last_name company_name profile_picture rating')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    const total = await Job.countDocuments(query);
    
    return {
      jobs,
      total,
      hasMore: total > skip + limit
    };
  }
  
  static async getJobDetails(jobId) {
    const job = await Job.findById(jobId)
      .populate('client_id', 'first_name last_name company_name profile_picture rating company_size industry');
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    // Increment views
    await Job.findByIdAndUpdate(jobId, {
      $inc: { 'analytics.views': 1 }
    });
    
    return job;
  }
  
  static async closeJob(jobId, clientId) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (job.client_id.toString() !== clientId.toString()) {
      throw new Error('Unauthorized');
    }
    
    job.status = 'cancelled';
    await job.save();
    
    return job;
  }
}

export default JobService;