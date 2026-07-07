// services/notificationService.js
import Notification from '../models/Notification.js';
import Client from '../models/Client.js';
import Freelancer from '../models/Freelancer.js';

class NotificationService {
  
  static async createNotification({
    recipient_id,
    recipient_model,
    sender_id = null,
    sender_model = null,
    type,
    title,
    message,
    reference_id = null,
    reference_model = null,
    priority = 'medium',
    actions = [],
    metadata = {},
    expires_at = null,
  }) {
    try {
      // Validate recipient exists
      const recipient = await this.getRecipient(recipient_id, recipient_model);
      if (!recipient) {
        console.error(`Recipient not found: ${recipient_id} (${recipient_model})`);
        throw new Error('Recipient not found');
      }

      // Validate notification type
      const validTypes = [
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
        'project_update_comment', // NEW
        'progress_update_approved', // NEW
        'progress_update_rejected', // NEW
        
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
      ];

      if (!validTypes.includes(type)) {
        console.warn(`⚠️ Notification type "${type}" may not be supported. Please add to validTypes array.`);
      }

      // Create notification
      const notification = new Notification({
        recipient_id,
        recipient_model,
        sender_id,
        sender_model,
        type,
        title: title.trim(),
        message: message.trim(),
        reference_id,
        reference_model,
        priority,
        actions,
        metadata,
        expires_at,
      });
      
      await notification.save();
      
      // Send push notification (non-blocking)
      this.sendPushNotification(notification).catch(err => {
        console.error('Push notification error (non-blocking):', err);
      });
      
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      // Don't throw - we don't want to break the main flow
      return null;
    }
  }
  
  static async sendPushNotification(notification) {
    try {
      const recipient = await this.getRecipient(
        notification.recipient_id,
        notification.recipient_model
      );
      
      if (!recipient) {
        notification.push_error = 'Recipient not found';
        await notification.save();
        return null;
      }
      
      // Check for push_token in different possible locations
      const pushToken = recipient.push_token || 
                        recipient.fcm_token || 
                        recipient.expo_push_token ||
                        recipient.device_token;
      
      if (!pushToken) {
        notification.push_error = 'No push token available';
        await notification.save();
        return null;
      }
      
      // Here you would integrate with FCM or Expo
      console.log(`📱 Sending push to ${pushToken}: ${notification.title}`);
      
      // Example with Firebase Cloud Messaging (FCM)
      // const fcm = admin.messaging();
      // await fcm.send({
      //   token: pushToken,
      //   notification: {
      //     title: notification.title,
      //     body: notification.message,
      //   },
      //   data: {
      //     notification_id: notification._id.toString(),
      //     type: notification.type,
      //     reference_id: notification.reference_id?.toString() || '',
      //   },
      // });
      
      notification.push_sent = true;
      notification.push_sent_at = new Date();
      await notification.save();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending push:', error);
      notification.push_error = error.message;
      await notification.save();
      return null;
    }
  }
  
  static async getRecipient(recipient_id, recipient_model) {
    try {
      if (recipient_model === 'Client') {
        return await Client.findById(recipient_id);
      } else if (recipient_model === 'Freelancer') {
        return await Freelancer.findById(recipient_id);
      }
      return null;
    } catch (error) {
      console.error('Error getting recipient:', error);
      return null;
    }
  }
  
  static async markAsRead(notification_id, recipient_id) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notification_id,
          recipient_id: recipient_id,
        },
        {
          is_read: true,
          read_at: new Date(),
        },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }
  
  static async markAllAsRead(recipient_id, recipient_model) {
    try {
      const result = await Notification.updateMany(
        {
          recipient_id,
          recipient_model,
          is_read: false,
        },
        {
          is_read: true,
          read_at: new Date(),
        }
      );
      return result;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }
  
  static async getUnreadCount(recipient_id, recipient_model) {
    try {
      const count = await Notification.countDocuments({
        recipient_id,
        recipient_model,
        is_read: false,
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
  
  static async getNotifications(recipient_id, recipient_model, limit = 20, skip = 0, filter = {}) {
    try {
      const query = {
        recipient_id,
        recipient_model,
        ...filter,
      };
      
      const notifications = await Notification.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender_id', 'first_name last_name profile_picture company_name username');
      
      const total = await Notification.countDocuments(query);
      const unreadCount = await this.getUnreadCount(recipient_id, recipient_model);
      
      return {
        notifications,
        total,
        unreadCount,
        hasMore: skip + limit < total,
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { notifications: [], total: 0, unreadCount: 0, hasMore: false };
    }
  }
  
  // Get notifications by type
  static async getNotificationsByType(recipient_id, recipient_model, type, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({
        recipient_id,
        recipient_model,
        type: type,
      })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender_id', 'first_name last_name profile_picture company_name username');
      
      return notifications;
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      return [];
    }
  }
  
  // Get notifications by reference
  static async getNotificationsByReference(reference_id, reference_model, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({
        reference_id,
        reference_model,
      })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender_id', 'first_name last_name profile_picture company_name username');
      
      return notifications;
    } catch (error) {
      console.error('Error getting notifications by reference:', error);
      return [];
    }
  }
  
  // Delete old notifications
  static async deleteOldNotifications(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await Notification.deleteMany({
        created_at: { $lt: cutoffDate },
        is_read: true,
      });
      
      return result;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }
  
  // Delete specific notification
  static async deleteNotification(notification_id, recipient_id) {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notification_id,
        recipient_id: recipient_id,
      });
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
  
  // Get notification statistics
  static async getNotificationStats(recipient_id, recipient_model) {
    try {
      const stats = await Notification.aggregate([
        {
          $match: {
            recipient_id: recipient_id,
            recipient_model: recipient_model,
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] } },
            read: { $sum: { $cond: [{ $eq: ['$is_read', true] }, 1, 0] } },
            highPriority: { $sum: { $cond: [{ $in: ['$priority', ['high', 'urgent']] }, 1, 0] } },
          }
        }
      ]);
      
      return stats[0] || { total: 0, unread: 0, read: 0, highPriority: 0 };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { total: 0, unread: 0, read: 0, highPriority: 0 };
    }
  }
  
  // Get notification count by type
  static async getNotificationCountByType(recipient_id, recipient_model) {
    try {
      const results = await Notification.aggregate([
        {
          $match: {
            recipient_id: recipient_id,
            recipient_model: recipient_model,
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] } },
          }
        }
      ]);
      
      return results;
    } catch (error) {
      console.error('Error getting notification count by type:', error);
      return [];
    }
  }
  
  // Create notification for project update comment
  static async notifyProjectUpdateComment({
    update,
    comment,
    commenter_id,
    commenter_role,
    recipient_id,
    recipient_model,
  }) {
    const title = `New Comment on: ${update.title}`;
    const message = `${commenter_role === 'freelancer' ? 'Freelancer' : 'Client'} commented: "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`;
    
    return await this.createNotification({
      recipient_id,
      recipient_model,
      sender_id: commenter_id,
      sender_model: commenter_role === 'freelancer' ? 'Freelancer' : 'Client',
      type: 'project_update_comment',
      title,
      message,
      reference_id: update._id,
      reference_model: 'ProjectUpdate',
      priority: 'medium',
      actions: [
        {
          label: 'View Update',
          action_type: 'view_update',
          data: { project_update_id: update._id },
        },
        {
          label: 'Reply',
          action_type: 'reply',
          data: { project_update_id: update._id },
        },
      ],
      metadata: {
        contract_id: update.contract_id,
        job_id: update.job_id,
        update_type: update.update_type,
        comment: comment,
        commenter_role: commenter_role,
      },
    });
  }
  
  // Create notification for progress update approval
  static async notifyProgressUpdateApproved({
    update,
    approved_by_id,
    approved_by_role,
    recipient_id,
    recipient_model,
    comment = null,
  }) {
    const title = `Progress Update Approved: ${update.title}`;
    const message = `Your progress update has been approved${comment ? ` with comment: "${comment}"` : ''}`;
    
    return await this.createNotification({
      recipient_id,
      recipient_model,
      sender_id: approved_by_id,
      sender_model: approved_by_role === 'client' ? 'Client' : 'Freelancer',
      type: 'progress_update_approved',
      title,
      message,
      reference_id: update._id,
      reference_model: 'ProjectUpdate',
      priority: 'high',
      actions: [
        {
          label: 'View Update',
          action_type: 'view_update',
          data: { project_update_id: update._id },
        },
      ],
      metadata: {
        contract_id: update.contract_id,
        job_id: update.job_id,
        progress: update.progress,
        approved_by: approved_by_role,
        comment: comment,
      },
    });
  }
  
  // Create notification for progress update rejection
  static async notifyProgressUpdateRejected({
    update,
    rejected_by_id,
    rejected_by_role,
    recipient_id,
    recipient_model,
    comment = null,
  }) {
    const title = `Revision Requested: ${update.title}`;
    const message = `Changes requested for your progress update${comment ? `: "${comment}"` : ''}`;
    
    return await this.createNotification({
      recipient_id,
      recipient_model,
      sender_id: rejected_by_id,
      sender_model: rejected_by_role === 'client' ? 'Client' : 'Freelancer',
      type: 'progress_update_rejected',
      title,
      message,
      reference_id: update._id,
      reference_model: 'ProjectUpdate',
      priority: 'high',
      actions: [
        {
          label: 'View Update',
          action_type: 'view_update',
          data: { project_update_id: update._id },
        },
        {
          label: 'Make Changes',
          action_type: 'edit_update',
          data: { project_update_id: update._id },
        },
      ],
      metadata: {
        contract_id: update.contract_id,
        job_id: update.job_id,
        rejected_by: rejected_by_role,
        comment: comment,
      },
    });
  }
  
  // Create notification for feedback received
  static async notifyFeedbackReceived({
    update,
    feedback_provider_id,
    feedback_provider_role,
    recipient_id,
    recipient_model,
    comment = null,
  }) {
    const title = `Feedback Received on: ${update.title}`;
    const message = `${feedback_provider_role === 'client' ? 'Client' : 'Freelancer'} provided feedback${comment ? `: "${comment}"` : ''}`;
    
    return await this.createNotification({
      recipient_id,
      recipient_model,
      sender_id: feedback_provider_id,
      sender_model: feedback_provider_role === 'client' ? 'Client' : 'Freelancer',
      type: 'feedback_received',
      title,
      message,
      reference_id: update._id,
      reference_model: 'ProjectUpdate',
      priority: 'medium',
      actions: [
        {
          label: 'View Feedback',
          action_type: 'view_feedback',
          data: { project_update_id: update._id },
        },
      ],
      metadata: {
        contract_id: update.contract_id,
        job_id: update.job_id,
        feedback_provider: feedback_provider_role,
        comment: comment,
      },
    });
  }
}

export default NotificationService;