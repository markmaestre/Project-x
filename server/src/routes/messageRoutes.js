// routes/messageRoutes.js
import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Message from "../models/Message.js";
import Client from "../models/Client.js";
import Freelancer from "../models/Freelancer.js";

const router = express.Router();

// Helper function to get user model
const getUserModel = (role) => {
  return role === 'client' ? Client : Freelancer;
};

// Helper function to get user info
const getUserInfo = async (userId, role) => {
  try {
    const Model = getUserModel(role);
    const user = await Model.findById(userId).select('first_name last_name profile_picture email_address');
    return user;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// ==================== MESSAGING ROUTES ====================

// Send a message
router.post("/messages", authMiddleware, async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID" });
    }

    // Determine receiver's role
    let receiverRole = null;
    let receiver = await Client.findById(receiverId);
    if (receiver) {
      receiverRole = 'client';
    } else {
      receiver = await Freelancer.findById(receiverId);
      if (receiver) {
        receiverRole = 'freelancer';
      }
    }

    if (!receiverRole) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const senderRole = req.user.role;

    const newMessage = new Message({
      sender_id: new mongoose.Types.ObjectId(req.user.id),
      sender_model: senderRole === 'client' ? 'Client' : 'Freelancer',
      receiver_id: new mongoose.Types.ObjectId(receiverId),
      receiver_model: receiverRole === 'client' ? 'Client' : 'Freelancer',
      message: message.trim(),
      is_read: false,
    });

    await newMessage.save();

    // Populate sender info for response
    const sender = await getUserInfo(req.user.id, senderRole);
    
    const responseMessage = {
      _id: newMessage._id,
      message: newMessage.message,
      sent: true,
      created_at: newMessage.created_at,
      sender_name: `${sender?.first_name || ''} ${sender?.last_name || ''}`.trim(),
    };

    res.status(201).json({
      message: "Message sent successfully",
      messageData: responseMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ 
      message: "Error sending message", 
      error: error.message 
    });
  }
});

// Get messages with a specific user
router.get("/messages/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, before } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Determine other user's role
    let otherUserRole = null;
    let otherUser = await Client.findById(userId);
    if (otherUser) {
      otherUserRole = 'client';
    } else {
      otherUser = await Freelancer.findById(userId);
      if (otherUser) {
        otherUserRole = 'freelancer';
      }
    }

    if (!otherUserRole) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUserRole = req.user.role;
    const currentUserModel = currentUserRole === 'client' ? 'Client' : 'Freelancer';
    const otherUserModel = otherUserRole === 'client' ? 'Client' : 'Freelancer';

    // Build query
    const query = {
      $or: [
        { 
          sender_id: new mongoose.Types.ObjectId(req.user.id), 
          sender_model: currentUserModel, 
          receiver_id: new mongoose.Types.ObjectId(userId), 
          receiver_model: otherUserModel 
        },
        { 
          sender_id: new mongoose.Types.ObjectId(userId), 
          sender_model: otherUserModel, 
          receiver_id: new mongoose.Types.ObjectId(req.user.id), 
          receiver_model: currentUserModel 
        }
      ]
    };

    if (before) {
      query.created_at = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        sender_id: new mongoose.Types.ObjectId(userId),
        receiver_id: new mongoose.Types.ObjectId(req.user.id),
        is_read: false
      },
      { is_read: true, read_at: new Date() }
    );

    // Format messages for response
    const formattedMessages = messages.reverse().map(msg => ({
      _id: msg._id,
      message: msg.message,
      sent: msg.sender_id.toString() === req.user.id,
      created_at: msg.created_at,
      is_read: msg.is_read,
    }));

    res.json({
      messages: formattedMessages,
      other_user: {
        _id: otherUser._id,
        name: `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim(),
        first_name: otherUser.first_name,
        last_name: otherUser.last_name,
        profile_picture: otherUser.profile_picture,
        role: otherUserRole,
      }
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ 
      message: "Error getting messages", 
      error: error.message 
    });
  }
});

// Get all conversations for the current user
router.get("/messages/conversations", authMiddleware, async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.id);
    const currentUserRole = req.user.role;
    const currentUserModel = currentUserRole === 'client' ? 'Client' : 'Freelancer';

    // Get all unique conversation partners using aggregation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender_id: currentUserId, sender_model: currentUserModel },
            { receiver_id: currentUserId, receiver_model: currentUserModel }
          ]
        }
      },
      {
        $addFields: {
          other_user_id: {
            $cond: [
              { $eq: ["$sender_id", currentUserId] },
              "$receiver_id",
              "$sender_id"
            ]
          },
          other_user_model: {
            $cond: [
              { $eq: ["$sender_id", currentUserId] },
              "$receiver_model",
              "$sender_model"
            ]
          }
        }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $group: {
          _id: { user_id: "$other_user_id", user_model: "$other_user_model" },
          last_message: { $first: "$message" },
          last_message_time: { $first: "$created_at" },
          unread_count: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$receiver_id", currentUserId] },
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
      { $sort: { last_message_time: -1 } }
    ]);

    // Get user details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const partnerId = conv._id.user_id;
        const partnerModel = conv._id.user_model;
        const partnerRole = partnerModel.toLowerCase();
        
        const partner = await getUserInfo(partnerId, partnerRole);
        
        if (!partner) {
          return null;
        }
        
        return {
          _id: `${partnerId}_${partnerRole}`,
          other_user_id: partnerId,
          other_user_name: `${partner.first_name || ''} ${partner.last_name || ''}`.trim(),
          other_user_first_name: partner.first_name,
          other_user_last_name: partner.last_name,
          other_user_profile_picture: partner.profile_picture,
          other_user_role: partnerRole,
          last_message: conv.last_message,
          last_message_time: conv.last_message_time,
          unread_count: conv.unread_count,
          is_online: false, // You can implement online status later
        };
      })
    );

    // Filter out null values
    const validConversations = conversationsWithDetails.filter(conv => conv !== null);
    
    const totalUnread = validConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

    res.json({
      conversations: validConversations,
      totalUnread,
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({ 
      message: "Error getting conversations", 
      error: error.message 
    });
  }
});

// Mark messages as read from a specific user
router.patch("/messages/:userId/read", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const result = await Message.updateMany(
      {
        sender_id: new mongoose.Types.ObjectId(userId),
        receiver_id: new mongoose.Types.ObjectId(req.user.id),
        is_read: false
      },
      { is_read: true, read_at: new Date() }
    );

    res.json({
      message: "Messages marked as read",
      updated_count: result.modifiedCount
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ 
      message: "Error marking messages as read", 
      error: error.message 
    });
  }
});

// Get unread message count
router.get("/messages/unread/count", authMiddleware, async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.id);
    const currentUserRole = req.user.role;
    const currentUserModel = currentUserRole === 'client' ? 'Client' : 'Freelancer';

    const count = await Message.countDocuments({
      receiver_id: currentUserId,
      receiver_model: currentUserModel,
      is_read: false
    });

    res.json({ unread_count: count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ 
      message: "Error getting unread count", 
      error: error.message 
    });
  }
});

// Delete a message (for the current user only)
router.delete("/messages/:messageId", authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is the sender
    if (message.sender_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ 
      message: "Error deleting message", 
      error: error.message 
    });
  }
});

export default router;