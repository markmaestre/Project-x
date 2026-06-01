// models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'sender_model',
  },
  sender_model: {
    type: String,
    required: true,
    enum: ['Client', 'Freelancer'],
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'receiver_model',
  },
  receiver_model: {
    type: String,
    required: true,
    enum: ['Client', 'Freelancer'],
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  read_at: {
    type: Date,
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Index for faster queries
messageSchema.index({ sender_id: 1, receiver_id: 1, created_at: -1 });
messageSchema.index({ receiver_id: 1, is_read: 1 });
messageSchema.index({ created_at: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;