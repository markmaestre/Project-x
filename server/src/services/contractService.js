import Contract from '../models/Contract.js';
import Job from '../models/Job.js';
import NotificationService from './notificationService.js';

class ContractService {
  
  static async createContract({
    job_id,
    client_id,
    freelancer_id,
    application_id,
    agreed_budget
  }) {
    const contract = new Contract({
      job_id,
      client_id,
      freelancer_id,
      application_id,
      agreed_budget,
      status: 'active',
      start_date: new Date(),
      is_active: true,
    });
    
    await contract.save();
    
    // Update job
    await Job.findByIdAndUpdate(job_id, {
      assigned_freelancer_id: freelancer_id,
      status: 'in_progress',
    });
    
    // Notify both parties
    await NotificationService.createNotification({
      recipient_id: client_id,
      recipient_model: 'Client',
      sender_id: freelancer_id,
      sender_model: 'Freelancer',
      type: 'contract_started',
      title: 'Contract Started',
      message: 'Contract has been initiated successfully',
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
    });
    
    await NotificationService.createNotification({
      recipient_id: freelancer_id,
      recipient_model: 'Freelancer',
      sender_id: client_id,
      sender_model: 'Client',
      type: 'contract_started',
      title: 'Contract Started',
      message: 'Contract has been initiated successfully',
      reference_id: contract._id,
      reference_model: 'Contract',
      priority: 'high',
    });
    
    return contract;
  }
  
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
    await contract.save();
    
    return contract;
  }
  
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
    await contract.save();
    
    // Update job
    await Job.findByIdAndUpdate(contract.job_id._id, {
      status: 'completed',
      assigned_freelancer_id: null,
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
    
    return contract;
  }
  
  static async getFreelancerContracts(freelancerId) {
    const contracts = await Contract.find({ freelancer_id: freelancerId })
      .populate('job_id', 'title client_id budget status')
      .populate('client_id', 'first_name last_name company_name profile_picture')
      .sort({ createdAt: -1 });
    
    return contracts;
  }
  
  static async getClientContracts(clientId) {
    const contracts = await Contract.find({ client_id: clientId })
      .populate('job_id', 'title budget status')
      .populate('freelancer_id', 'first_name last_name username profile_picture rating')
      .sort({ createdAt: -1 });
    
    return contracts;
  }
  
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
}

export default ContractService;