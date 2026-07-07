// services/contractService.js
import Contract from '../models/Contract.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import NotificationService from './notificationService.js';
import { cloudinary } from '../config/cloudinary.js';

class ContractService {
  
  static async createContract({
    job_id,
    client_id,
    freelancer_id,
    application_id,
    agreed_budget,
    terms = null,
    start_date = null,
    end_date = null,
    milestones = []
  }) {
    const contract = new Contract({
      job_id,
      client_id,
      freelancer_id,
      application_id,
      agreed_budget,
      terms,
      start_date: start_date || new Date(),
      end_date: end_date || null,
      milestones: milestones || [],
      status: 'draft',
      is_active: true,
      contract_metadata: {
        version: 1,
        last_modified_by: 'client',
        last_modified_at: new Date(),
      }
    });
    
    await contract.save();
    
    // Populate contract for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('job_id', 'title description budget')
      .populate('freelancer_id', 'first_name last_name username profile_picture')
      .populate('client_id', 'first_name last_name company_name');
    
    return populatedContract;
  }
  
  static async activateContract({ contract_id, user_id }) {
    const contract = await Contract.findById(contract_id)
      .populate('client_id freelancer_id job_id');
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check if user is client
    if (contract.client_id._id.toString() !== user_id.toString()) {
      throw new Error('Only the client can activate the contract');
    }
    
    // Allow activation from draft OR paused status
    if (!['draft', 'paused'].includes(contract.status)) {
      throw new Error('Only draft or paused contracts can be activated');
    }
    
    contract.status = 'active';
    
    // Only set start_date if it was draft
    if (contract.start_date === null || contract.start_date === undefined) {
      contract.start_date = new Date();
    }
    
    contract.is_active = true;
    await contract.save();
    
    // Update job if not already assigned
    const job = await Job.findById(contract.job_id._id);
    if (job && !job.assigned_freelancer_id) {
      await Job.findByIdAndUpdate(contract.job_id._id, {
        assigned_freelancer_id: contract.freelancer_id._id,
        status: 'in_progress',
      });
    }
    
    // Update application if not already hired
    const app = await Application.findById(contract.application_id);
    if (app && app.status !== 'hired') {
      await Application.findByIdAndUpdate(contract.application_id, {
        status: 'hired'
      });
    }
    
    // Notify both parties
    await NotificationService.createNotification({
      recipient_id: contract.client_id._id,
      recipient_model: 'Client',
      sender_id: contract.freelancer_id._id,
      sender_model: 'Freelancer',
      type: 'contract_started',
      title: 'Contract Started',
      message: `Contract for "${contract.job_id.title}" has been activated`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
    });
    
    await NotificationService.createNotification({
      recipient_id: contract.freelancer_id._id,
      recipient_model: 'Freelancer',
      sender_id: contract.client_id._id,
      sender_model: 'Client',
      type: 'contract_started',
      title: 'Contract Started',
      message: `Contract for "${contract.job_id.title}" has been activated`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
    });
    
    // Populate for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('job_id', 'title description budget')
      .populate('freelancer_id', 'first_name last_name username profile_picture')
      .populate('client_id', 'first_name last_name company_name');
    
    return populatedContract;
  }
  
  // ==================== DOCUMENT UPLOAD ====================
  
  static async uploadContractDocument({
    contract_id,
    user_id,
    file,
    description = null,
    user_role
  }) {
    const contract = await Contract.findById(contract_id)
      .populate('client_id freelancer_id job_id');
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check authorization
    const isClient = contract.client_id._id.toString() === user_id.toString();
    const isFreelancer = contract.freelancer_id._id.toString() === user_id.toString();
    
    if (!isClient && !isFreelancer && user_role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    const document = {
      name: file.originalname || file.filename,
      url: file.path,
      public_id: file.filename,
      mime_type: file.mimetype,
      size: file.size,
      uploaded_at: new Date(),
      uploaded_by: isClient ? 'client' : (isFreelancer ? 'freelancer' : 'admin'),
      description: description || null,
      version: contract.contract_documents.length + 1,
    };
    
    contract.contract_documents.push(document);
    contract.contract_metadata.last_modified_by = isClient ? 'client' : (isFreelancer ? 'freelancer' : 'admin');
    contract.contract_metadata.last_modified_at = new Date();
    contract.contract_metadata.version += 1;
    
    await contract.save();
    
    // Notify other party
    const recipientId = isClient ? contract.freelancer_id._id : contract.client_id._id;
    const recipientModel = isClient ? 'Freelancer' : 'Client';
    const senderModel = isClient ? 'Client' : 'Freelancer';
    
    await NotificationService.createNotification({
      recipient_id: recipientId,
      recipient_model: recipientModel,
      sender_id: user_id,
      sender_model: senderModel,
      type: 'contract_document_uploaded',
      title: 'Contract Document Uploaded',
      message: `New document "${document.name}" uploaded to contract "${contract.job_id.title}"`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'medium',
    });
    
    // Populate for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('job_id', 'title description budget')
      .populate('freelancer_id', 'first_name last_name username profile_picture')
      .populate('client_id', 'first_name last_name company_name');
    
    return populatedContract;
  }
  
  static async deleteContractDocument({
    contract_id,
    document_id,
    user_id,
    user_role
  }) {
    const contract = await Contract.findById(contract_id);
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check authorization
    const isClient = contract.client_id.toString() === user_id.toString();
    const isFreelancer = contract.freelancer_id.toString() === user_id.toString();
    
    if (!isClient && !isFreelancer && user_role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    const documentIndex = contract.contract_documents.findIndex(
      doc => doc._id.toString() === document_id
    );
    
    if (documentIndex === -1) {
      throw new Error('Document not found');
    }
    
    const document = contract.contract_documents[documentIndex];
    
    // Delete from Cloudinary
    if (document.public_id) {
      try {
        await cloudinary.uploader.destroy(document.public_id, { resource_type: 'raw' });
      } catch (error) {
        console.error('Error deleting document from Cloudinary:', error);
      }
    }
    
    contract.contract_documents.splice(documentIndex, 1);
    contract.contract_metadata.last_modified_by = isClient ? 'client' : (isFreelancer ? 'freelancer' : 'admin');
    contract.contract_metadata.last_modified_at = new Date();
    contract.contract_metadata.version += 1;
    
    await contract.save();
    
    // Populate for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('job_id', 'title description budget')
      .populate('freelancer_id', 'first_name last_name username profile_picture')
      .populate('client_id', 'first_name last_name company_name');
    
    return populatedContract;
  }
  
  // ==================== SIGNED DOCUMENT UPLOAD ====================
  
  static async uploadSignedDocument({
    contract_id,
    user_id,
    file,
    signature_type = 'electronic',
    user_role
  }) {
    const contract = await Contract.findById(contract_id)
      .populate('client_id freelancer_id job_id');
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check authorization
    const isClient = contract.client_id._id.toString() === user_id.toString();
    const isFreelancer = contract.freelancer_id._id.toString() === user_id.toString();
    
    if (!isClient && !isFreelancer && user_role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    const signedDoc = {
      name: file.originalname || file.filename,
      url: file.path,
      public_id: file.filename,
      mime_type: file.mimetype,
      size: file.size,
      signed_at: new Date(),
      signed_by: isClient ? 'client' : 'freelancer',
      signature_type: signature_type || 'electronic',
    };
    
    contract.signed_documents.push(signedDoc);
    contract.contract_metadata.last_modified_by = isClient ? 'client' : (isFreelancer ? 'freelancer' : 'admin');
    contract.contract_metadata.last_modified_at = new Date();
    
    await contract.save();
    
    // Notify other party
    const recipientId = isClient ? contract.freelancer_id._id : contract.client_id._id;
    const recipientModel = isClient ? 'Freelancer' : 'Client';
    const senderModel = isClient ? 'Client' : 'Freelancer';
    
    await NotificationService.createNotification({
      recipient_id: recipientId,
      recipient_model: recipientModel,
      sender_id: user_id,
      sender_model: senderModel,
      type: 'contract_signed',
      title: 'Contract Signed',
      message: `${isClient ? 'Client' : 'Freelancer'} has signed the contract "${contract.job_id.title}"`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
    });
    
    // Check if both parties have signed
    const hasClientSigned = contract.signed_documents.some(doc => doc.signed_by === 'client');
    const hasFreelancerSigned = contract.signed_documents.some(doc => doc.signed_by === 'freelancer');
    
    if (hasClientSigned && hasFreelancerSigned && contract.status === 'draft') {
      contract.status = 'active';
      await contract.save();
      
      // Update job
      await Job.findByIdAndUpdate(contract.job_id._id, {
        assigned_freelancer_id: contract.freelancer_id._id,
        status: 'in_progress',
      });
      
      // Update application
      await Application.findByIdAndUpdate(contract.application_id, {
        status: 'hired'
      });
    }
    
    // Populate for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('job_id', 'title description budget')
      .populate('freelancer_id', 'first_name last_name username profile_picture')
      .populate('client_id', 'first_name last_name company_name');
    
    return populatedContract;
  }
  
  // ==================== MILESTONE MANAGEMENT ====================
  
  static async addMilestone({
    contract_id,
    user_id,
    milestoneData,
    user_role
  }) {
    const contract = await Contract.findById(contract_id)
      .populate('client_id freelancer_id');
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check authorization
    const isClient = contract.client_id._id.toString() === user_id.toString();
    const isFreelancer = contract.freelancer_id._id.toString() === user_id.toString();
    
    if (!isClient && !isFreelancer && user_role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    // Only client can add milestones
    if (!isClient && user_role !== 'admin') {
      throw new Error('Only the client can add milestones');
    }
    
    const milestone = {
      title: milestoneData.title,
      description: milestoneData.description || null,
      due_date: new Date(milestoneData.due_date),
      amount: milestoneData.amount,
      status: 'pending',
    };
    
    contract.milestones.push(milestone);
    contract.contract_metadata.last_modified_by = 'client';
    contract.contract_metadata.last_modified_at = new Date();
    
    await contract.save();
    
    // Notify freelancer
    await NotificationService.createNotification({
      recipient_id: contract.freelancer_id._id,
      recipient_model: 'Freelancer',
      sender_id: user_id,
      sender_model: 'Client',
      type: 'milestone_added',
      title: 'New Milestone Added',
      message: `New milestone "${milestone.title}" added to contract`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'medium',
    });
    
    // Populate for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('job_id', 'title description budget')
      .populate('freelancer_id', 'first_name last_name username profile_picture')
      .populate('client_id', 'first_name last_name company_name');
    
    return populatedContract;
  }
  
  static async updateMilestoneStatus({
    contract_id,
    milestone_id,
    user_id,
    status,
    user_role
  }) {
    const contract = await Contract.findById(contract_id)
      .populate('client_id freelancer_id job_id');
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check authorization
    const isClient = contract.client_id._id.toString() === user_id.toString();
    const isFreelancer = contract.freelancer_id._id.toString() === user_id.toString();
    
    if (!isClient && !isFreelancer && user_role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    const milestone = contract.milestones.find(m => m._id.toString() === milestone_id);
    
    if (!milestone) {
      throw new Error('Milestone not found');
    }
    
    const oldStatus = milestone.status;
    milestone.status = status;
    
    if (status === 'completed') {
      milestone.completed_at = new Date();
    }
    
    contract.contract_metadata.last_modified_by = isClient ? 'client' : (isFreelancer ? 'freelancer' : 'admin');
    contract.contract_metadata.last_modified_at = new Date();
    
    await contract.save();
    
    // Notify other party
    const recipientId = isClient ? contract.freelancer_id._id : contract.client_id._id;
    const recipientModel = isClient ? 'Freelancer' : 'Client';
    const senderModel = isClient ? 'Client' : 'Freelancer';
    
    await NotificationService.createNotification({
      recipient_id: recipientId,
      recipient_model: recipientModel,
      sender_id: user_id,
      sender_model: senderModel,
      type: 'milestone_updated',
      title: 'Milestone Updated',
      message: `Milestone "${milestone.title}" status changed to ${status}`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'medium',
    });
    
    // Populate for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('job_id', 'title description budget')
      .populate('freelancer_id', 'first_name last_name username profile_picture')
      .populate('client_id', 'first_name last_name company_name');
    
    return populatedContract;
  }
  
  // ==================== PROGRESS UPDATE ====================
  
  static async updateProgress({ contract_id, user_id, progress }) {
    const contract = await Contract.findById(contract_id)
      .populate('client_id freelancer_id job_id');
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check if user is part of contract
    if (contract.client_id._id.toString() !== user_id.toString() &&
        contract.freelancer_id._id.toString() !== user_id.toString()) {
      throw new Error('Unauthorized');
    }
    
    contract.progress = progress;
    contract.contract_metadata.last_modified_at = new Date();
    await contract.save();
    
    // Populate for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('job_id', 'title description budget')
      .populate('freelancer_id', 'first_name last_name username profile_picture')
      .populate('client_id', 'first_name last_name company_name');
    
    return populatedContract;
  }
  
  // ==================== COMPLETE CONTRACT ====================
  
  static async completeContract({ contract_id, user_id }) {
    const contract = await Contract.findById(contract_id)
      .populate('client_id freelancer_id job_id');
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Only client or freelancer can complete
    if (contract.client_id._id.toString() !== user_id.toString() &&
        contract.freelancer_id._id.toString() !== user_id.toString()) {
      throw new Error('Unauthorized');
    }
    
    contract.status = 'completed';
    contract.end_date = new Date();
    contract.is_active = false;
    contract.progress = 100;
    await contract.save();
    
    // Update job
    await Job.findByIdAndUpdate(contract.job_id._id, {
      status: 'completed',
      assigned_freelancer_id: null,
    });
    
    // Update application
    await Application.findByIdAndUpdate(contract.application_id, {
      status: 'completed'
    });
    
    // Notify both parties
    await NotificationService.createNotification({
      recipient_id: contract.client_id._id,
      recipient_model: 'Client',
      sender_id: contract.freelancer_id._id,
      sender_model: 'Freelancer',
      type: 'contract_completed',
      title: 'Contract Completed',
      message: `Project "${contract.job_id.title}" has been completed`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
      actions: [
        {
          label: 'Rate Freelancer',
          action_type: 'rate_freelancer',
          data: { contract_id: contract._id },
        },
      ],
    });
    
    await NotificationService.createNotification({
      recipient_id: contract.freelancer_id._id,
      recipient_model: 'Freelancer',
      sender_id: contract.client_id._id,
      sender_model: 'Client',
      type: 'contract_completed',
      title: 'Contract Completed',
      message: `Project "${contract.job_id.title}" has been completed`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
    });
    
    // Populate for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('job_id', 'title description budget')
      .populate('freelancer_id', 'first_name last_name username profile_picture')
      .populate('client_id', 'first_name last_name company_name');
    
    return populatedContract;
  }
  
  // ==================== CANCEL CONTRACT ====================
  
  static async cancelContract({ contract_id, user_id, reason }) {
    const contract = await Contract.findById(contract_id)
      .populate('client_id freelancer_id job_id');
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check authorization
    const isClient = contract.client_id._id.toString() === user_id.toString();
    const isFreelancer = contract.freelancer_id._id.toString() === user_id.toString();
    
    if (!isClient && !isFreelancer) {
      throw new Error('Unauthorized');
    }
    
    if (contract.status === 'completed' || contract.status === 'cancelled') {
      throw new Error('Contract is already completed or cancelled');
    }
    
    contract.status = 'cancelled';
    contract.is_active = false;
    contract.end_date = new Date();
    contract.contract_metadata.notes = reason || 'Cancelled by user';
    await contract.save();
    
    // Update job
    await Job.findByIdAndUpdate(contract.job_id._id, {
      status: 'open',
      assigned_freelancer_id: null,
    });
    
    // Update application
    await Application.findByIdAndUpdate(contract.application_id, {
      status: 'pending'
    });
    
    // Notify both parties
    const recipientId = isClient ? contract.freelancer_id._id : contract.client_id._id;
    const recipientModel = isClient ? 'Freelancer' : 'Client';
    const senderModel = isClient ? 'Client' : 'Freelancer';
    
    await NotificationService.createNotification({
      recipient_id: recipientId,
      recipient_model: recipientModel,
      sender_id: user_id,
      sender_model: senderModel,
      type: 'contract_cancelled',
      title: 'Contract Cancelled',
      message: `Project "${contract.job_id.title}" has been cancelled. Reason: ${reason || 'Not specified'}`,
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
    });
    
    // Populate for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('job_id', 'title description budget')
      .populate('freelancer_id', 'first_name last_name username profile_picture')
      .populate('client_id', 'first_name last_name company_name');
    
    return populatedContract;
  }
  
  // ==================== GET CONTRACT WITH ALL DATA ====================
  
  static async getContractDetails(contractId, userId) {
    const contract = await Contract.findById(contractId)
      .populate('job_id')
      .populate('client_id')
      .populate('freelancer_id')
      .populate('application_id');
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check authorization
    if (contract.client_id._id.toString() !== userId.toString() &&
        contract.freelancer_id._id.toString() !== userId.toString()) {
      throw new Error('Unauthorized');
    }
    
    return contract;
  }
  
  static async getFreelancerContracts(freelancerId, status = null) {
    const query = { freelancer_id: freelancerId };
    if (status && status !== 'All') {
      query.status = status;
    }
    
    const contracts = await Contract.find(query)
      .populate('job_id', 'title client_id budget status')
      .populate('client_id', 'first_name last_name company_name profile_picture')
      .sort({ createdAt: -1 });
    
    return contracts;
  }
  
  static async getClientContracts(clientId, status = null) {
    const query = { client_id: clientId };
    if (status && status !== 'All') {
      query.status = status;
    }
    
    const contracts = await Contract.find(query)
      .populate('job_id', 'title budget status')
      .populate('freelancer_id', 'first_name last_name username profile_picture rating')
      .sort({ createdAt: -1 });
    
    return contracts;
  }
}

export default ContractService;