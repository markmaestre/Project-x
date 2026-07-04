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
      'application_submitted',
      'application_status_updated',
      'job_posted',
      'job_application_reviewed',
      'interview_scheduled',
      'offer_received',
      'offer_accepted',
      'offer_rejected',
      'contract_started',
      'contract_completed',
      'contract_cancelled',
      'new_message',
      'project_update',
      'payment_received',
      'rating_received',
      'deadline_approaching',
      'milestone_completed',
      'withdrawal_confirmed',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  reference_model: {
    type: String,
    enum: ['Job', 'Application', 'Contract', 'Message', 'Rating', 'ProjectUpdate'],
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
    label: String,
    action_type: String,
    data: mongoose.Schema.Types.Mixed,
  }],
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

notificationSchema.index({ recipient_id: 1, created_at: -1 });
notificationSchema.index({ recipient_id: 1, is_read: 1 });
notificationSchema.index({ reference_id: 1, reference_model: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;