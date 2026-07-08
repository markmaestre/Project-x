// routes/messageRoutes.js

import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Message from "../models/Message.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";
import NotificationService from "../services/notificationService.js";

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================

const getSenderInfo = (req) => {
  const userId = req.user?.id || req.user?._id || req.user?.userId;
  const role = req.user?.role || 'client';
  
  return {
    sender_id: userId,
    sender_model: role === 'client' ? 'Client' : 'Freelancer'
  };
};

const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string' && typeof id !== 'object') return false;
  return mongoose.Types.ObjectId.isValid(id);
};

const getUserModel = (modelType) => {
  return modelType === 'Client' ? Client : Freelancer;
};

// ==================== SEND MESSAGE ====================

// Send a new message
router.post("/messages", authMiddleware, async (req, res) => {
  try {
    const { receiver_id, receiver_model, message } = req.body;

    // Validate required fields
    if (!receiver_id || !receiver_model || !message) {
      return res.status(400).json({ 
        message: "receiver_id, receiver_model, and message are required" 
      });
    }

    // Validate receiver_id format
    if (!isValidObjectId(receiver_id)) {
      return res.status(400).json({ message: "Invalid receiver ID format" });
    }

    // Validate receiver_model
    if (!['Client', 'Freelancer'].includes(receiver_model)) {
      return res.status(400).json({ 
        message: "receiver_model must be either 'Client' or 'Freelancer'" 
      });
    }

    // Get sender info from authenticated user
    const { sender_id, sender_model } = getSenderInfo(req);

    if (!sender_id || !isValidObjectId(sender_id)) {
      return res.status(400).json({ message: "Invalid sender ID" });
    }

    // Check if receiver exists
    const ReceiverModel = getUserModel(receiver_model);
    const receiver = await ReceiverModel.findById(receiver_id);
    
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Check if receiver is active
    if (receiver.account_status !== 'active') {
      return res.status(403).json({ message: "Receiver account is not active" });
    }

    // Create the message
    const newMessage = new Message({
      sender_id: new mongoose.Types.ObjectId(sender_id),
      sender_model,
      receiver_id: new mongoose.Types.ObjectId(receiver_id),
      receiver_model,
      message: message.trim(),
      is_read: false,
    });

    await newMessage.save();

    // Populate sender info for response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender_id', 'first_name last_name profile_picture company_name username')
      .populate('receiver_id', 'first_name last_name profile_picture company_name username');

    // Create notification for the receiver
    try {
      const senderName = sender_model === 'Client' 
        ? `${req.user?.first_name || 'Client'} ${req.user?.last_name || ''}` 
        : `${req.user?.first_name || 'Freelancer'} ${req.user?.last_name || ''}`;

      await NotificationService.createNotification({
        recipient_id: receiver_id,
        recipient_model: receiver_model,
        sender_id: sender_id,
        sender_model: sender_model,
        type: 'new_message',
        title: 'New Message',
        message: `${senderName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        reference_id: newMessage._id,
        reference_model: 'Message',
        priority: 'high',
        metadata: {
          sender_name: senderName,
          message_preview: message.substring(0, 100),
          full_message_id: newMessage._id,
        }
      });
    } catch (notificationError) {
      // Don't fail the message sending if notification fails
      console.error("Error creating notification for message:", notificationError);
    }

    res.status(201).json({
      message: "Message sent successfully",
      data: populatedMessage
    });

  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ 
      message: "Error sending message", 
      error: error.message 
    });
  }
});

// ==================== GET MESSAGES ====================

// Get conversation between two users
router.get("/messages/conversation/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Validate userId
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Get current user info
    const { sender_id, sender_model } = getSenderInfo(req);

    if (!sender_id || !isValidObjectId(sender_id)) {
      return res.status(400).json({ message: "Invalid sender ID" });
    }

    // Determine the other user's model
    // We need to check if the userId belongs to a Client or Freelancer
    let otherUserModel = null;
    let otherUser = await Client.findById(userId);
    
    if (otherUser) {
      otherUserModel = 'Client';
    } else {
      otherUser = await Freelancer.findById(userId);
      if (otherUser) {
        otherUserModel = 'Freelancer';
      }
    }

    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Query messages between the two users
    const query = {
      $or: [
        {
          sender_id: new mongoose.Types.ObjectId(sender_id),
          sender_model: sender_model,
          receiver_id: new mongoose.Types.ObjectId(userId),
          receiver_model: otherUserModel,
        },
        {
          sender_id: new mongoose.Types.ObjectId(userId),
          sender_model: otherUserModel,
          receiver_id: new mongoose.Types.ObjectId(sender_id),
          receiver_model: sender_model,
        }
      ]
    };

    const messages = await Message.find(query)
      .sort({ created_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('sender_id', 'first_name last_name profile_picture company_name username')
      .populate('receiver_id', 'first_name last_name profile_picture company_name username');

    const total = await Message.countDocuments(query);

    // Mark messages as read
    await Message.updateMany(
      {
        sender_id: new mongoose.Types.ObjectId(userId),
        sender_model: otherUserModel,
        receiver_id: new mongoose.Types.ObjectId(sender_id),
        receiver_model: sender_model,
        is_read: false
      },
      {
        is_read: true,
        read_at: new Date()
      }
    );

    res.json({
      messages: messages || [],
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: parseInt(page) || 1,
      totalMessages: total || 0,
      otherUser: {
        id: otherUser._id,
        name: otherUser.display_name || `${otherUser.first_name} ${otherUser.last_name}`,
        profile_picture: otherUser.profile_picture,
        model: otherUserModel
      }
    });

  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ 
      message: "Error fetching conversation", 
      error: error.message 
    });
  }
});

// Get all conversations for the authenticated user
router.get("/messages/conversations", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const { sender_id, sender_model } = getSenderInfo(req);

    if (!sender_id || !isValidObjectId(sender_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Get all unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            {
              sender_id: new mongoose.Types.ObjectId(sender_id),
              sender_model: sender_model,
            },
            {
              receiver_id: new mongoose.Types.ObjectId(sender_id),
              receiver_model: sender_model,
            }
          ]
        }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender_id", new mongoose.Types.ObjectId(sender_id)] },
              {
                user_id: "$receiver_id",
                user_model: "$receiver_model"
              },
              {
                user_id: "$sender_id",
                user_model: "$sender_model"
              }
            ]
          },
          last_message: { $first: "$$ROOT" },
          unread_count: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver_id", new mongoose.Types.ObjectId(sender_id)] },
                    { $eq: ["$receiver_model", sender_model] },
                    { $eq: ["$is_read", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { "last_message.created_at": -1 }
      },
      {
        $skip: (parseInt(page) - 1) * parseInt(limit)
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Populate user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const userId = conv._id.user_id;
        const userModel = conv._id.user_model;
        const UserModel = getUserModel(userModel);
        const user = await UserModel.findById(userId)
          .select('first_name last_name profile_picture company_name username account_status');

        if (!user) {
          return null;
        }

        return {
          user: {
            id: user._id,
            name: user.display_name || `${user.first_name} ${user.last_name}`,
            profile_picture: user.profile_picture,
            model: userModel,
            account_status: user.account_status
          },
          last_message: {
            id: conv.last_message._id,
            message: conv.last_message.message,
            sender_id: conv.last_message.sender_id,
            sender_model: conv.last_message.sender_model,
            created_at: conv.last_message.created_at,
            is_read: conv.last_message.is_read
          },
          unread_count: conv.unread_count || 0
        };
      })
    );

    // Filter out null values (deleted users)
    const validConversations = populatedConversations.filter(conv => conv !== null);

    const total = await Message.aggregate([
      {
        $match: {
          $or: [
            {
              sender_id: new mongoose.Types.ObjectId(sender_id),
              sender_model: sender_model,
            },
            {
              receiver_id: new mongoose.Types.ObjectId(sender_id),
              receiver_model: sender_model,
            }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender_id", new mongoose.Types.ObjectId(sender_id)] },
              {
                user_id: "$receiver_id",
                user_model: "$receiver_model"
              },
              {
                user_id: "$sender_id",
                user_model: "$sender_model"
              }
            ]
          }
        }
      },
      {
        $count: "total"
      }
    ]);

    res.json({
      conversations: validConversations || [],
      totalPages: Math.ceil((total[0]?.total || 0) / limit) || 1,
      currentPage: parseInt(page) || 1,
      totalConversations: total[0]?.total || 0
    });

  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ 
      message: "Error fetching conversations", 
      error: error.message 
    });
  }
});

// Get unread message count
router.get("/messages/unread/count", authMiddleware, async (req, res) => {
  try {
    const { sender_id, sender_model } = getSenderInfo(req);

    if (!sender_id || !isValidObjectId(sender_id)) {
      return res.status(200).json({ unreadCount: 0 });
    }

    const unreadCount = await Message.countDocuments({
      receiver_id: new mongoose.Types.ObjectId(sender_id),
      receiver_model: sender_model,
      is_read: false
    });

    res.json({ unreadCount: unreadCount || 0 });

  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(200).json({ unreadCount: 0 });
  }
});

// ==================== MARK MESSAGES ====================

// Mark messages as read in a conversation
router.patch("/messages/read/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { sender_id, sender_model } = getSenderInfo(req);

    if (!sender_id || !isValidObjectId(sender_id)) {
      return res.status(400).json({ message: "Invalid sender ID" });
    }

    // Determine the other user's model
    let otherUserModel = null;
    let otherUser = await Client.findById(userId);
    
    if (otherUser) {
      otherUserModel = 'Client';
    } else {
      otherUser = await Freelancer.findById(userId);
      if (otherUser) {
        otherUserModel = 'Freelancer';
      }
    }

    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await Message.updateMany(
      {
        sender_id: new mongoose.Types.ObjectId(userId),
        sender_model: otherUserModel,
        receiver_id: new mongoose.Types.ObjectId(sender_id),
        receiver_model: sender_model,
        is_read: false
      },
      {
        is_read: true,
        read_at: new Date()
      }
    );

    res.json({
      message: "Messages marked as read",
      updatedCount: result?.modifiedCount || 0
    });

  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ 
      message: "Error marking messages as read", 
      error: error.message 
    });
  }
});

// ==================== DELETE MESSAGES ====================

// Delete a single message
router.delete("/messages/:messageId", authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!messageId || !isValidObjectId(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const { sender_id, sender_model } = getSenderInfo(req);

    if (!sender_id || !isValidObjectId(sender_id)) {
      return res.status(400).json({ message: "Invalid sender ID" });
    }

    // Only allow sender to delete their own messages
    const message = await Message.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(messageId),
      sender_id: new mongoose.Types.ObjectId(sender_id),
      sender_model: sender_model
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found or you don't have permission to delete it" });
    }

    res.json({
      message: "Message deleted successfully",
      deletedMessage: message
    });

  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ 
      message: "Error deleting message", 
      error: error.message 
    });
  }
});

// Delete entire conversation
router.delete("/messages/conversation/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { sender_id, sender_model } = getSenderInfo(req);

    if (!sender_id || !isValidObjectId(sender_id)) {
      return res.status(400).json({ message: "Invalid sender ID" });
    }

    // Determine the other user's model
    let otherUserModel = null;
    let otherUser = await Client.findById(userId);
    
    if (otherUser) {
      otherUserModel = 'Client';
    } else {
      otherUser = await Freelancer.findById(userId);
      if (otherUser) {
        otherUserModel = 'Freelancer';
      }
    }

    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await Message.deleteMany({
      $or: [
        {
          sender_id: new mongoose.Types.ObjectId(sender_id),
          sender_model: sender_model,
          receiver_id: new mongoose.Types.ObjectId(userId),
          receiver_model: otherUserModel,
        },
        {
          sender_id: new mongoose.Types.ObjectId(userId),
          sender_model: otherUserModel,
          receiver_id: new mongoose.Types.ObjectId(sender_id),
          receiver_model: sender_model,
        }
      ]
    });

    res.json({
      message: "Conversation deleted successfully",
      deletedCount: result?.deletedCount || 0
    });

  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ 
      message: "Error deleting conversation", 
      error: error.message 
    });
  }
});

export default router;