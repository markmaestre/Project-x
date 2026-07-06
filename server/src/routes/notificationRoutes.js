// routes/notificationRoutes.js
import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Notification from "../models/Notification.js";
import NotificationService from "../services/notificationService.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";

const router = express.Router();

// ==================== GET NOTIFICATIONS ====================

// Get all notifications for the authenticated user
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, is_read, type, priority } = req.query;
    
    // Determine recipient model based on user role
    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const recipient_id = req.user.id;

    // Build filter
    const filter = {};
    if (is_read !== undefined && is_read !== 'All') {
      filter.is_read = is_read === 'true';
    }
    if (type && type !== 'All') {
      filter.type = type;
    }
    if (priority && priority !== 'All') {
      filter.priority = priority;
    }

    const notifications = await NotificationService.getNotifications(
      recipient_id,
      recipient_model,
      parseInt(limit),
      (parseInt(page) - 1) * parseInt(limit),
      filter
    );

    const total = await Notification.countDocuments({
      recipient_id,
      recipient_model,
      ...filter
    });

    // Get unread count
    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

    // Get notification type breakdown
    const typeBreakdown = await Notification.aggregate([
      { 
        $match: { 
          recipient_id: new mongoose.Types.ObjectId(recipient_id),
          recipient_model: recipient_model
        } 
      },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const breakdown = {};
    typeBreakdown.forEach(item => {
      breakdown[item._id] = item.count;
    });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalNotifications: total,
      unreadCount,
      typeBreakdown: breakdown
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ 
      message: "Error fetching notifications", 
      error: error.message 
    });
  }
});

// Get unread notifications only
router.get("/notifications/unread", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const recipient_id = req.user.id;

    const notifications = await Notification.find({
      recipient_id,
      recipient_model,
      is_read: false
    })
    .sort({ created_at: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .populate('sender_id', 'first_name last_name profile_picture');

    const total = await Notification.countDocuments({
      recipient_id,
      recipient_model,
      is_read: false
    });

    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalNotifications: total,
      unreadCount
    });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ 
      message: "Error fetching unread notifications", 
      error: error.message 
    });
  }
});

// Get a single notification by ID
router.get("/notifications/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const recipient_id = req.user.id;

    const notification = await Notification.findOne({
      _id: id,
      recipient_id,
      recipient_model
    })
    .populate('sender_id', 'first_name last_name profile_picture');

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Mark as clicked if not already
    if (!notification.is_clicked) {
      notification.is_clicked = true;
      notification.clicked_at = new Date();
      await notification.save();
    }

    res.json({ notification });
  } catch (error) {
    console.error("Error fetching notification:", error);
    res.status(500).json({ 
      message: "Error fetching notification", 
      error: error.message 
    });
  }
});

// ==================== MARK NOTIFICATIONS ====================

// Mark a single notification as read
router.patch("/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const recipient_id = req.user.id;

    const notification = await NotificationService.markAsRead(id, recipient_id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Get updated unread count
    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

    res.json({
      message: "Notification marked as read",
      notification,
      unreadCount
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ 
      message: "Error marking notification as read", 
      error: error.message 
    });
  }
});

// Mark all notifications as read
router.patch("/notifications/read-all", authMiddleware, async (req, res) => {
  try {
    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const recipient_id = req.user.id;

    const result = await NotificationService.markAllAsRead(
      recipient_id,
      recipient_model
    );

    res.json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ 
      message: "Error marking all notifications as read", 
      error: error.message 
    });
  }
});

// Mark notifications as read by type
router.patch("/notifications/read-by-type", authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ message: "Notification type is required" });
    }

    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const recipient_id = req.user.id;

    const result = await Notification.updateMany(
      {
        recipient_id,
        recipient_model,
        type: type,
        is_read: false
      },
      {
        is_read: true,
        read_at: new Date()
      }
    );

    // Get updated unread count
    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

    res.json({
      message: `All ${type} notifications marked as read`,
      updatedCount: result.modifiedCount,
      unreadCount
    });
  } catch (error) {
    console.error("Error marking notifications by type as read:", error);
    res.status(500).json({ 
      message: "Error marking notifications as read", 
      error: error.message 
    });
  }
});

// ==================== DELETE NOTIFICATIONS ====================

// Delete a single notification
router.delete("/notifications/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const recipient_id = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient_id,
      recipient_model
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Get updated unread count
    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

    res.json({
      message: "Notification deleted successfully",
      unreadCount
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ 
      message: "Error deleting notification", 
      error: error.message 
    });
  }
});

// Delete all notifications
router.delete("/notifications", authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    
    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const recipient_id = req.user.id;

    const query = {
      recipient_id,
      recipient_model
    };

    if (type && type !== 'All') {
      query.type = type;
    }

    const result = await Notification.deleteMany(query);

    res.json({
      message: "Notifications deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    res.status(500).json({ 
      message: "Error deleting notifications", 
      error: error.message 
    });
  }
});

// ==================== NOTIFICATION COUNTS - FIXED ====================

// Get notification counts
router.get("/notifications/counts", authMiddleware, async (req, res) => {
  try {
    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const recipient_id = req.user.id;

    // Validate recipient_id format
    if (!mongoose.Types.ObjectId.isValid(recipient_id)) {
      console.warn('Invalid recipient_id format in counts endpoint:', recipient_id);
      // Return default values instead of error
      return res.status(200).json({
        totalUnread: 0,
        highPriorityUnread: 0,
        unreadByType: {}
      });
    }

    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

    // Get counts by type
    const typeCounts = await Notification.aggregate([
      { 
        $match: { 
          recipient_id: new mongoose.Types.ObjectId(recipient_id),
          recipient_model: recipient_model,
          is_read: false
        } 
      },
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);

    const counts = {};
    typeCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    // Get high priority unread count
    const highPriorityCount = await Notification.countDocuments({
      recipient_id: recipient_id,
      recipient_model: recipient_model,
      is_read: false,
      priority: { $in: ['high', 'urgent'] }
    });

    res.json({
      totalUnread: unreadCount,
      highPriorityUnread: highPriorityCount,
      unreadByType: counts
    });
  } catch (error) {
    console.error("Error fetching notification counts:", error);
    // Return default values instead of error
    res.status(200).json({
      totalUnread: 0,
      highPriorityUnread: 0,
      unreadByType: {}
    });
  }
});

// ==================== SEND NOTIFICATION (Admin only) ====================

// Send custom notification (Admin only)
router.post("/notifications/send", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
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
      expires_at
    } = req.body;

    // Validate required fields
    if (!recipient_id || !recipient_model || !type || !title || !message) {
      return res.status(400).json({ 
        message: "Recipient ID, model, type, title, and message are required" 
      });
    }

    // Validate recipient model
    if (!['Client', 'Freelancer'].includes(recipient_model)) {
      return res.status(400).json({ 
        message: "Invalid recipient model. Must be 'Client' or 'Freelancer'" 
      });
    }

    // Check if recipient exists
    let recipient;
    if (recipient_model === 'Client') {
      recipient = await Client.findById(recipient_id);
    } else {
      recipient = await Freelancer.findById(recipient_id);
    }

    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const notification = await NotificationService.createNotification({
      recipient_id,
      recipient_model,
      sender_id: sender_id || null,
      sender_model: sender_model || null,
      type,
      title,
      message,
      reference_id,
      reference_model,
      priority: priority || 'medium',
      actions: actions || [],
      expires_at: expires_at ? new Date(expires_at) : null
    });

    res.status(201).json({
      message: "Notification sent successfully",
      notification
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ 
      message: "Error sending notification", 
      error: error.message 
    });
  }
});

// ==================== BULK NOTIFICATION (Admin only) ====================

// Send bulk notifications (Admin only)
router.post("/notifications/send-bulk", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      recipient_model,
      type,
      title,
      message,
      priority,
      filters,
      actions,
      expires_at
    } = req.body;

    // Validate required fields
    if (!recipient_model || !type || !title || !message) {
      return res.status(400).json({ 
        message: "Recipient model, type, title, and message are required" 
      });
    }

    // Validate recipient model
    if (!['Client', 'Freelancer'].includes(recipient_model)) {
      return res.status(400).json({ 
        message: "Invalid recipient model. Must be 'Client' or 'Freelancer'" 
      });
    }

    // Get recipients based on filters
    let recipients = [];
    const query = { account_status: 'active' };
    
    if (filters) {
      if (filters.location) query.location = filters.location;
      if (filters.skills) query.skills = { $in: filters.skills };
      if (filters.experience_level) query.experience_level = filters.experience_level;
    }

    if (recipient_model === 'Client') {
      recipients = await Client.find(query).select('_id');
    } else {
      recipients = await Freelancer.find(query).select('_id');
    }

    if (recipients.length === 0) {
      return res.status(404).json({ message: "No recipients found" });
    }

    // Create notifications for all recipients
    const notifications = [];
    for (const recipient of recipients) {
      const notification = await NotificationService.createNotification({
        recipient_id: recipient._id,
        recipient_model,
        type,
        title,
        message,
        priority: priority || 'medium',
        actions: actions || [],
        expires_at: expires_at ? new Date(expires_at) : null
      });
      notifications.push(notification);
    }

    res.status(201).json({
      message: `Bulk notifications sent to ${notifications.length} recipients`,
      recipientCount: notifications.length,
      notifications
    });
  } catch (error) {
    console.error("Error sending bulk notifications:", error);
    res.status(500).json({ 
      message: "Error sending bulk notifications", 
      error: error.message 
    });
  }
});

// ==================== NOTIFICATION PREFERENCES ====================

// Get notification preferences
router.get("/notifications/preferences", authMiddleware, async (req, res) => {
  try {
    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const recipient_id = req.user.id;

    let user;
    if (recipient_model === 'Client') {
      user = await Client.findById(recipient_id).select('notification_preferences');
    } else {
      user = await Freelancer.findById(recipient_id).select('notification_preferences');
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      preferences: user.notification_preferences || {
        email: true,
        push: true,
        in_app: true,
        types: {
          application_updates: true,
          messages: true,
          contract_updates: true,
          project_updates: true,
          payment_updates: true,
          rating_updates: true,
          marketing: false
        }
      }
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ 
      message: "Error fetching notification preferences", 
      error: error.message 
    });
  }
});

// Update notification preferences
router.patch("/notifications/preferences", authMiddleware, async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ message: "Preferences are required" });
    }

    const recipient_model = req.user.role === 'client' ? 'Client' : 'Freelancer';
    const recipient_id = req.user.id;

    let user;
    if (recipient_model === 'Client') {
      user = await Client.findByIdAndUpdate(
        recipient_id,
        { notification_preferences: preferences },
        { new: true }
      ).select('notification_preferences');
    } else {
      user = await Freelancer.findByIdAndUpdate(
        recipient_id,
        { notification_preferences: preferences },
        { new: true }
      ).select('notification_preferences');
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Notification preferences updated successfully",
      preferences: user.notification_preferences
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ 
      message: "Error updating notification preferences", 
      error: error.message 
    });
  }
});

export default router;