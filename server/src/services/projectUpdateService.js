import ProjectUpdate from '../models/ProjectUpdate.js';
import Contract from '../models/Contract.js';
import NotificationService from './notificationService.js';

class ProjectUpdateService {
  
  static async createProjectUpdate({
    contract_id,
    job_id,
    client_id,
    freelancer_id,
    title,
    description,
    update_type,
    attachments,
    created_by,
    created_by_role,
    due_date = null,
    priority = 'normal'
  }) {
    // Verify contract exists and is active
    const contract = await Contract.findById(contract_id);
    if (!contract || contract.status !== 'active') {
      throw new Error('Contract not found or not active');
    }
    
    const projectUpdate = new ProjectUpdate({
      contract_id,
      job_id,
      client_id,
      freelancer_id,
      title,
      description,
      update_type,
      attachments,
      created_by,
      created_by_role,
      due_date,
      priority,
      status: 'pending',
      delivery_status: update_type === 'delivery' ? 'submitted' : 'not_submitted',
    });
    
    await projectUpdate.save();
    
    // Determine notification recipient
    let recipient_id, recipient_model, sender_id, sender_model;
    
    if (created_by_role === 'freelancer') {
      recipient_id = client_id;
      recipient_model = 'Client';
      sender_id = freelancer_id;
      sender_model = 'Freelancer';
    } else {
      recipient_id = freelancer_id;
      recipient_model = 'Freelancer';
      sender_id = client_id;
      sender_model = 'Client';
    }
    
    const updateMessages = {
      progress: 'submitted a progress update',
      milestone: 'completed a milestone',
      delivery: 'submitted work for review',
      revision: 'requested revisions',
      feedback: 'provided feedback',
      announcement: 'made an announcement',
    };
    
    await NotificationService.createNotification({
      recipient_id,
      recipient_model,
      sender_id,
      sender_model,
      type: 'project_update',
      title: `Project Update: ${update_type}`,
      message: `${title} - ${updateMessages[update_type] || 'submitted an update'}`,
      reference_id: projectUpdate._id,
      reference_model: 'ProjectUpdate',
      priority: update_type === 'delivery' || update_type === 'milestone' ? 'high' : 'medium',
      actions: [
        {
          label: 'View Update',
          action_type: 'view_update',
          data: { project_update_id: projectUpdate._id },
        },
      ],
    });
    
    return projectUpdate;
  }
  
  static async updateProjectStatus({
    project_update_id,
    status,
    user_id,
    comment
  }) {
    const update = await ProjectUpdate.findById(project_update_id)
      .populate('client_id freelancer_id');
    
    if (!update) {
      throw new Error('Project update not found');
    }
    
    // Check authorization
    if (update.client_id._id.toString() !== user_id.toString() &&
        update.freelancer_id._id.toString() !== user_id.toString()) {
      throw new Error('Unauthorized');
    }
    
    update.status = status;
    update.last_updated_by = user_id;
    
    if (status === 'completed') {
      update.completed_at = new Date();
    }
    
    // Update comments based on role
    if (user_id.toString() === update.freelancer_id._id.toString()) {
      update.freelancer_comment = comment || update.freelancer_comment;
    } else {
      update.client_comment = comment || update.client_comment;
    }
    
    // If delivery is approved
    if (status === 'completed' && update.update_type === 'delivery') {
      update.delivery_status = 'approved';
    }
    
    await update.save();
    
    return update;
  }
  
  static async getContractUpdates(contractId, userId) {
    const updates = await ProjectUpdate.find({ contract_id: contractId })
      .sort({ created_at: -1 });
    
    return updates;
  }
  
  static async getFreelancerUpdates(freelancerId, limit = 20, skip = 0) {
    const updates = await ProjectUpdate.find({ freelancer_id: freelancerId })
      .populate('job_id', 'title')
      .populate('client_id', 'first_name last_name company_name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    return updates;
  }
}

export default ProjectUpdateService;