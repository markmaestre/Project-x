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
      
      // Send push notification
      await this.sendPushNotification(notification);
      
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
      
      if (!recipient || !recipient.push_token) {
        notification.push_error = 'No push token available';
        await notification.save();
        return null;
      }
      
      // Here you would integrate with FCM
      console.log(`Sending push to ${recipient.push_token}`);
      
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
    if (recipient_model === 'Client') {
      return await Client.findById(recipient_id);
    } else if (recipient_model === 'Freelancer') {
      return await Freelancer.findById(recipient_id);
    }
    return null;
  }
  
  static async markAsRead(notification_id, recipient_id) {
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
  }
  
  static async markAllAsRead(recipient_id, recipient_model) {
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
  }
  
  static async getUnreadCount(recipient_id, recipient_model) {
    const count = await Notification.countDocuments({
      recipient_id,
      recipient_model,
      is_read: false,
    });
    return count;
  }
  
  static async getNotifications(recipient_id, recipient_model, limit = 20, skip = 0, filter = {}) {
    const query = {
      recipient_id,
      recipient_model,
      ...filter,
    };
    
    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender_id', 'first_name last_name profile_picture');
    
    return notifications;
  }
}

export default NotificationService;