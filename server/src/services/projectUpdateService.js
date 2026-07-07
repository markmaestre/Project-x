// services/projectUpdateService.js
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
    const contract = await Contract.findById(contract_id)
      .populate('client_id freelancer_id');
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Allow updates even if contract is not active (for completed contracts too)
    if (!['active', 'completed', 'paused'].includes(contract.status)) {
      throw new Error(`Contract is ${contract.status}. Updates can only be made on active, paused, or completed contracts.`);
    }
    
    const projectUpdate = new ProjectUpdate({
      contract_id,
      job_id,
      client_id,
      freelancer_id,
      title,
      description,
      update_type,
      attachments: attachments || [],
      created_by,
      created_by_role,
      due_date,
      priority,
      status: 'pending',
      delivery_status: update_type === 'delivery' ? 'submitted' : 'not_submitted',
    });
    
    await projectUpdate.save();
    
    // ==================== LOG TO CONTRACT ACTIVITY ====================
    try {
      const userModel = created_by_role === 'client' ? 'Client' : 'Freelancer';
      const userName = created_by_role === 'client' 
        ? (contract.client_id?.first_name || 'Client') 
        : (contract.freelancer_id?.first_name || 'Freelancer');
      
      const updateMessages = {
        progress: 'submitted a progress update',
        milestone: 'completed a milestone',
        delivery: 'submitted work for review',
        revision: 'requested revisions',
        feedback: 'provided feedback',
        announcement: 'made an announcement',
      };
      
      contract.activity_log.push({
        type: 'project_update',
        user_id: created_by,
        user_model: userModel,
        user_name: userName,
        message: `${userName} ${updateMessages[update_type] || 'submitted an update'}: "${title}"`,
        data: {
          project_update_id: projectUpdate._id,
          update_type: update_type,
          title: title,
          description: description || null,
          attachments_count: attachments ? attachments.length : 0,
          status: projectUpdate.status,
        }
      });
      
      await contract.save();
      console.log(`✅ Activity logged: Project update "${title}" added to contract ${contract_id}`);
    } catch (logError) {
      console.error('❌ Error logging project update to contract:', logError);
      // Continue even if logging fails - don't block the main operation
    }
    
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
      .populate('client_id freelancer_id contract_id');
    
    if (!update) {
      throw new Error('Project update not found');
    }
    
    // Check authorization
    if (update.client_id._id.toString() !== user_id.toString() &&
        update.freelancer_id._id.toString() !== user_id.toString()) {
      throw new Error('Unauthorized');
    }
    
    const oldStatus = update.status;
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
    
    // ==================== LOG TO CONTRACT ACTIVITY ====================
    try {
      const contract = await Contract.findById(update.contract_id)
        .populate('client_id freelancer_id');
      
      if (contract) {
        const isFreelancer = update.freelancer_id._id.toString() === user_id.toString();
        const userModel = isFreelancer ? 'Freelancer' : 'Client';
        const userName = isFreelancer 
          ? (contract.freelancer_id?.first_name || 'Freelancer')
          : (contract.client_id?.first_name || 'Client');
        
        contract.activity_log.push({
          type: 'status_update',
          user_id: user_id,
          user_model: userModel,
          user_name: userName,
          message: `${userName} updated project update status from "${oldStatus}" to "${status}"`,
          data: {
            project_update_id: update._id,
            old_status: oldStatus,
            new_status: status,
            title: update.title,
            comment: comment || null,
          }
        });
        
        await contract.save();
        console.log(`✅ Activity logged: Project update status changed to "${status}"`);
      }
    } catch (logError) {
      console.error('❌ Error logging status update to contract:', logError);
    }
    
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
  
  // ==================== ADD ATTACHMENT WITH LOGGING ====================
  static async addAttachment({
    project_update_id,
    file,
    uploaded_by,
    uploaded_by_role,
  }) {
    const update = await ProjectUpdate.findById(project_update_id)
      .populate('client_id freelancer_id');
    
    if (!update) {
      throw new Error('Project update not found');
    }
    
    const attachment = {
      file_name: file.originalname || file.filename,
      file_url: file.path,
      public_id: file.filename,
      mime_type: file.mimetype,
      file_size: file.size,
      uploaded_by: uploaded_by,
      uploaded_by_role: uploaded_by_role,
      uploaded_at: new Date(),
    };
    
    update.attachments.push(attachment);
    await update.save();
    
    // ==================== LOG TO CONTRACT ACTIVITY ====================
    try {
      const contract = await Contract.findById(update.contract_id)
        .populate('client_id freelancer_id');
      
      if (contract) {
        const isFreelancer = uploaded_by_role === 'freelancer';
        const userModel = isFreelancer ? 'Freelancer' : 'Client';
        const userName = isFreelancer 
          ? (contract.freelancer_id?.first_name || 'Freelancer')
          : (contract.client_id?.first_name || 'Client');
        
        contract.activity_log.push({
          type: 'file_upload',
          user_id: uploaded_by,
          user_model: userModel,
          user_name: userName,
          message: `${userName} uploaded file: "${attachment.file_name}"`,
          data: {
            project_update_id: update._id,
            file_name: attachment.file_name,
            file_url: attachment.file_url,
            file_size: attachment.file_size,
            mime_type: attachment.mime_type,
          }
        });
        
        await contract.save();
        console.log(`✅ Activity logged: File "${attachment.file_name}" uploaded`);
      }
    } catch (logError) {
      console.error('❌ Error logging file upload to contract:', logError);
    }
    
    return { update, attachment };
  }
}

export default ProjectUpdateService;