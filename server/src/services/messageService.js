import Message from '../models/Message.js';
import NotificationService from './notificationService.js';

class MessageService {
  
  static async sendMessage({
    sender_id,
    sender_model,
    receiver_id,
    receiver_model,
    message
  }) {
    const newMessage = new Message({
      sender_id,
      sender_model,
      receiver_id,
      receiver_model,
      message,
    });
    
    await newMessage.save();
    
    // Send notification to receiver
    await NotificationService.createNotification({
      recipient_id: receiver_id,
      recipient_model: receiver_model,
      sender_id: sender_id,
      sender_model: sender_model,
      type: 'new_message',
      title: 'New Message',
      message: `You have a new message`,
      reference_id: newMessage._id,
      reference_model: 'Message',
      priority: 'high',
      actions: [
        {
          label: 'View Message',
          action_type: 'view_message',
          data: { message_id: newMessage._id },
        },
      ],
    });
    
    return newMessage;
  }
  
  static async markMessageAsRead(message_id, user_id) {
    const message = await Message.findOne({
      _id: message_id,
      receiver_id: user_id
    });
    
    if (!message) {
      throw new Error('Message not found or unauthorized');
    }
    
    message.is_read = true;
    message.read_at = new Date();
    await message.save();
    
    return message;
  }
  
  static async getConversation(userId, userModel, otherUserId, otherUserModel, limit = 50, skip = 0) {
    const messages = await Message.find({
      $or: [
        {
          sender_id: userId,
          sender_model: userModel,
          receiver_id: otherUserId,
          receiver_model: otherUserModel
        },
        {
          sender_id: otherUserId,
          sender_model: otherUserModel,
          receiver_id: userId,
          receiver_model: userModel
        }
      ]
    })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);
    
    return messages.reverse();
  }
  
  static async getConversations(userId, userModel) {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender_id: userId, sender_model: userModel },
            { receiver_id: userId, receiver_model: userModel }
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
              { $eq: ['$sender_id', userId] },
              { id: '$receiver_id', model: '$receiver_model' },
              { id: '$sender_id', model: '$sender_model' }
            ]
          },
          last_message: { $first: '$$ROOT' },
          unread_count: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiver_id', userId] },
                    { $eq: ['$receiver_model', userModel] },
                    { $eq: ['$is_read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { 'last_message.created_at': -1 } }
    ]);
    
    return conversations;
  }
  
  static async getUnreadCount(userId, userModel) {
    const count = await Message.countDocuments({
      receiver_id: userId,
      receiver_model: userModel,
      is_read: false,
    });
    
    return count;
  }
}

export default MessageService;