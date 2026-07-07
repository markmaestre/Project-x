// routes/notificationRoutes.js - COMPLETE FIXED VERSION

import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Notification from "../models/Notification.js";
import NotificationService from "../services/notificationService.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================

const getRecipientInfo = (req) => {
  // Try multiple possible sources for the user ID
  const userId = req.user?.id || req.user?._id || req.user?.userId;
  const role = req.user?.role || 'client';
  
  return {
    recipient_id: userId,
    recipient_model: role === 'client' ? 'Client' : 'Freelancer'
  };
};

const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string' && typeof id !== 'object') return false;
  return mongoose.Types.ObjectId.isValid(id);
};

// ==================== GET NOTIFICATIONS ====================

// Get all notifications for the authenticated user
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, is_read, type, priority } = req.query || {};
    
    const { recipient_id, recipient_model } = getRecipientInfo(req);

    // Validate recipient_id
    if (!recipient_id || !isValidObjectId(recipient_id)) {
      console.warn('Invalid recipient_id in /notifications:', recipient_id);
      return res.status(200).json({
        notifications: [],
        totalPages: 1,
        currentPage: 1,
        totalNotifications: 0,
        unreadCount: 0,
        typeBreakdown: {}
      });
    }

    const filter = {};
    if (is_read !== undefined && is_read !== 'All' && is_read !== '') {
      filter.is_read = is_read === 'true';
    }
    if (type && type !== 'All' && type !== '') {
      filter.type = type;
    }
    if (priority && priority !== 'All' && priority !== '') {
      filter.priority = priority;
    }

    const notifications = await NotificationService.getNotifications(
      recipient_id,
      recipient_model,
      parseInt(limit) || 20,
      (parseInt(page) - 1) * parseInt(limit) || 0,
      filter
    );

    const total = await Notification.countDocuments({
      recipient_id: new mongoose.Types.ObjectId(recipient_id),
      recipient_model,
      ...filter
    });

    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

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
      notifications: notifications || [],
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: parseInt(page) || 1,
      totalNotifications: total || 0,
      unreadCount: unreadCount || 0,
      typeBreakdown: breakdown || {}
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(200).json({
      notifications: [],
      totalPages: 1,
      currentPage: 1,
      totalNotifications: 0,
      unreadCount: 0,
      typeBreakdown: {}
    });
  }
});

// Get unread notifications only
router.get("/notifications/unread", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query || {};
    
    const { recipient_id, recipient_model } = getRecipientInfo(req);

    if (!recipient_id || !isValidObjectId(recipient_id)) {
      return res.status(200).json({
        notifications: [],
        totalPages: 1,
        currentPage: 1,
        totalNotifications: 0,
        unreadCount: 0
      });
    }

    const notifications = await Notification.find({
      recipient_id: new mongoose.Types.ObjectId(recipient_id),
      recipient_model,
      is_read: false
    })
    .sort({ created_at: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .populate('sender_id', 'first_name last_name profile_picture company_name username');

    const total = await Notification.countDocuments({
      recipient_id: new mongoose.Types.ObjectId(recipient_id),
      recipient_model,
      is_read: false
    });

    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

    res.json({
      notifications: notifications || [],
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: parseInt(page) || 1,
      totalNotifications: total || 0,
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(200).json({
      notifications: [],
      totalPages: 1,
      currentPage: 1,
      totalNotifications: 0,
      unreadCount: 0
    });
  }
});

// Get a single notification by ID
router.get("/notifications/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const { recipient_id, recipient_model } = getRecipientInfo(req);

    if (!recipient_id || !isValidObjectId(recipient_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const notification = await Notification.findOne({
      _id: new mongoose.Types.ObjectId(id),
      recipient_id: new mongoose.Types.ObjectId(recipient_id),
      recipient_model
    })
    .populate('sender_id', 'first_name last_name profile_picture company_name username');

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

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

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const { recipient_id, recipient_model } = getRecipientInfo(req);

    if (!recipient_id || !isValidObjectId(recipient_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const notification = await NotificationService.markAsRead(
      new mongoose.Types.ObjectId(id),
      new mongoose.Types.ObjectId(recipient_id)
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

    res.json({
      message: "Notification marked as read",
      notification,
      unreadCount: unreadCount || 0
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
    const { recipient_id, recipient_model } = getRecipientInfo(req);

    if (!recipient_id || !isValidObjectId(recipient_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const result = await NotificationService.markAllAsRead(
      new mongoose.Types.ObjectId(recipient_id),
      recipient_model
    );

    res.json({
      message: "All notifications marked as read",
      updatedCount: result?.modifiedCount || 0
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
    const { type } = req.body || {};

    if (!type) {
      return res.status(400).json({ message: "Notification type is required" });
    }

    const { recipient_id, recipient_model } = getRecipientInfo(req);

    if (!recipient_id || !isValidObjectId(recipient_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const result = await Notification.updateMany(
      {
        recipient_id: new mongoose.Types.ObjectId(recipient_id),
        recipient_model,
        type: type,
        is_read: false
      },
      {
        is_read: true,
        read_at: new Date()
      }
    );

    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

    res.json({
      message: `All ${type} notifications marked as read`,
      updatedCount: result?.modifiedCount || 0,
      unreadCount: unreadCount || 0
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

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const { recipient_id, recipient_model } = getRecipientInfo(req);

    if (!recipient_id || !isValidObjectId(recipient_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      recipient_id: new mongoose.Types.ObjectId(recipient_id),
      recipient_model
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const unreadCount = await NotificationService.getUnreadCount(
      recipient_id,
      recipient_model
    );

    res.json({
      message: "Notification deleted successfully",
      unreadCount: unreadCount || 0
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
    const { type } = req.query || {};
    
    const { recipient_id, recipient_model } = getRecipientInfo(req);

    if (!recipient_id || !isValidObjectId(recipient_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const query = {
      recipient_id: new mongoose.Types.ObjectId(recipient_id),
      recipient_model
    };

    if (type && type !== 'All' && type !== '') {
      query.type = type;
    }

    const result = await Notification.deleteMany(query);

    res.json({
      message: "Notifications deleted successfully",
      deletedCount: result?.deletedCount || 0
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
    const { recipient_id, recipient_model } = getRecipientInfo(req);

    console.log('Counts request - User ID:', recipient_id, 'Model:', recipient_model);

    // Validate recipient_id - if invalid, return default values
    if (!recipient_id || !isValidObjectId(recipient_id)) {
      console.warn('Invalid recipient_id in /counts:', recipient_id);
      return res.status(200).json({
        totalUnread: 0,
        highPriorityUnread: 0,
        unreadByType: {}
      });
    }

    // Convert to ObjectId
    const objectId = new mongoose.Types.ObjectId(recipient_id);

    // Get total unread count
    const unreadCount = await Notification.countDocuments({
      recipient_id: objectId,
      recipient_model: recipient_model,
      is_read: false
    });

    console.log('Unread count:', unreadCount);

    // Get counts by type for unread notifications
    const typeCounts = await Notification.aggregate([
      { 
        $match: { 
          recipient_id: objectId,
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

    console.log('Type counts:', counts);

    // Get high priority unread count
    const highPriorityCount = await Notification.countDocuments({
      recipient_id: objectId,
      recipient_model: recipient_model,
      is_read: false,
      priority: { $in: ['high', 'urgent'] }
    });

    console.log('High priority count:', highPriorityCount);

    res.json({
      totalUnread: unreadCount || 0,
      highPriorityUnread: highPriorityCount || 0,
      unreadByType: counts || {}
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

// ==================== NOTIFICATION PREFERENCES ====================

// Get notification preferences
router.get("/notifications/preferences", authMiddleware, async (req, res) => {
  try {
    const { recipient_id, recipient_model } = getRecipientInfo(req);

    if (!recipient_id || !isValidObjectId(recipient_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    let user;
    const objectId = new mongoose.Types.ObjectId(recipient_id);
    
    if (recipient_model === 'Client') {
      user = await Client.findById(objectId).select('notification_preferences');
    } else {
      user = await Freelancer.findById(objectId).select('notification_preferences');
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
    const { preferences } = req.body || {};

    if (!preferences) {
      return res.status(400).json({ message: "Preferences are required" });
    }

    const { recipient_id, recipient_model } = getRecipientInfo(req);

    if (!recipient_id || !isValidObjectId(recipient_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const objectId = new mongoose.Types.ObjectId(recipient_id);
    let user;

    if (recipient_model === 'Client') {
      user = await Client.findByIdAndUpdate(
        objectId,
        { notification_preferences: preferences },
        { new: true }
      ).select('notification_preferences');
    } else {
      user = await Freelancer.findByIdAndUpdate(
        objectId,
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