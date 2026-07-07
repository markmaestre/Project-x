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
    expires_at = null,
  }) {
    try {
      const notification = new Notification({
        recipient_id,
        recipient_model,
        sender_id,
        sender_model,
        type,
        title,
        message,
        reference_id,
        reference_model,
        priority,
        actions,
        expires_at,
      });
      
      await notification.save();
      
      // Send push notification (non-blocking)
      this.sendPushNotification(notification).catch(err => {
        console.error('Push notification error (non-blocking):', err);
      });
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
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
      console.log(`Sending push to ${pushToken}`);
      
      notification.push_sent = true;
      notification.push_sent_at = new Date();
      await notification.save();
      
      return { success: true };
    } catch (error) {
      console.error('Error sending push:', error);
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
      
      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
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
}

export default NotificationService;