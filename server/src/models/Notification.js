import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipient_model',
  },
  recipient_model: {
    type: String,
    required: true,
    enum: ['Client', 'Freelancer'],
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'sender_model',
  },
  sender_model: {
    type: String,
    enum: ['Client', 'Freelancer'],
  },
  type: {
    type: String,
    enum: [
      // Job & Application
      'application_submitted',
      'application_status_updated',
      'job_posted',
      'job_application_reviewed',
      
      // Interview & Offers
      'interview_scheduled',
      'offer_received',
      'offer_accepted',
      'offer_rejected',
      
      // Contract
      'contract_started',
      'contract_completed',
      'contract_cancelled',
      'contract_updated',
      'contract_terminated',
      
      // Messages & Updates
      'new_message',
      'project_update',
      'project_update_comment', // ADDED - For comments on updates
      'progress_update_approved', // ADDED - When client approves progress
      'progress_update_rejected', // ADDED - When client rejects progress
      
      // Payments
      'payment_received',
      'payment_released',
      'payment_failed',
      
      // Ratings
      'rating_received',
      
      // Deadlines
      'deadline_approaching',
      'milestone_completed',
      
      // Withdrawals
      'withdrawal_confirmed',
      
      // System
      'system_alert',
      'dispute_created',
      'dispute_resolved',
      
      // Feedback
      'feedback_received',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  reference_model: {
    type: String,
    enum: [
      'Job', 
      'Application', 
      'Contract', 
      'Message', 
      'Rating', 
      'ProjectUpdate',
      'Payment',
      'Dispute',
      'User'
    ],
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  read_at: {
    type: Date,
  },
  is_clicked: {
    type: Boolean,
    default: false,
  },
  clicked_at: {
    type: Date,
  },
  push_sent: {
    type: Boolean,
    default: false,
  },
  push_sent_at: {
    type: Date,
  },
  push_error: {
    type: String,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  actions: [{
    label: {
      type: String,
      trim: true,
    },
    action_type: {
      type: String,
      trim: true,
    },
    data: mongoose.Schema.Types.Mixed,
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  expires_at: {
    type: Date,
    default: null,
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Indexes for performance
notificationSchema.index({ recipient_id: 1, created_at: -1 });
notificationSchema.index({ recipient_id: 1, is_read: 1 });
notificationSchema.index({ reference_id: 1, reference_model: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ created_at: -1 });

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.is_read) {
    this.is_read = true;
    this.read_at = new Date();
    await this.save();
  }
  return this;
};

// Instance method to mark as clicked
notificationSchema.methods.markAsClicked = async function() {
  if (!this.is_clicked) {
    this.is_clicked = true;
    this.clicked_at = new Date();
    await this.save();
  }
  return this;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(recipientId) {
  return await this.countDocuments({
    recipient_id: recipientId,
    is_read: false,
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(recipientId) {
  return await this.updateMany(
    {
      recipient_id: recipientId,
      is_read: false,
    },
    {
      $set: {
        is_read: true,
        read_at: new Date(),
      },
    }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;