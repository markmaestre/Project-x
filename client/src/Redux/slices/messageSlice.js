// Redux/slices/messageSlice.js - UPDATED WITH ALL EXPORTS
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Get all conversations for the current user
export const getConversations = createAsyncThunk(
  'messages/getConversations',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      if (!token) {
        console.error('No token found in state');
        return rejectWithValue({ message: 'No token found' });
      }

      console.log('Fetching conversations...');
      const response = await api.get('/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Conversations response:', response.data);
      
      return {
        conversations: response.data.conversations || [],
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
        totalConversations: response.data.totalConversations || 0
      };
    } catch (error) {
      console.error('Get conversations error:', error.response?.status, error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get messages with a specific user (conversation)
export const getMessages = createAsyncThunk(
  'messages/getMessages',
  async ({ userId, page = 1, limit = 50 }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      if (!token) {
        console.error('No token found in state');
        return rejectWithValue({ message: 'No token found' });
      }

      console.log('Fetching conversation with user:', userId);
      const response = await api.get(`/messages/conversation/${userId}?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Conversation response:', response.data);
      
      return {
        messages: response.data.messages || [],
        otherUser: response.data.otherUser || null,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
        totalMessages: response.data.totalMessages || 0,
        userId: userId
      };
    } catch (error) {
      console.error('Get messages error:', error.response?.status, error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Send a message
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ receiver_id, receiver_model, message }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      if (!token) {
        console.error('No token found in state');
        return rejectWithValue({ message: 'No token found' });
      }

      // Determine receiver_model if not provided
      let finalReceiverModel = receiver_model;
      if (!finalReceiverModel) {
        // Try to find the user in conversations
        const conversation = state.messages.conversations.find(
          c => c.user?.id === receiver_id || c.other_user_id === receiver_id
        );
        if (conversation) {
          finalReceiverModel = conversation.user?.model || conversation.role === 'client' ? 'Client' : 'Freelancer';
        } else {
          // Default to 'Freelancer' if we can't determine
          finalReceiverModel = 'Freelancer';
        }
      }

      console.log('Sending message to:', receiver_id, 'model:', finalReceiverModel, 'Message:', message);
      
      const response = await api.post('/messages', 
        { 
          receiver_id, 
          receiver_model: finalReceiverModel, 
          message 
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Send message response:', response.data);
      
      // Return the message data from the response
      return response.data.data || response.data;
    } catch (error) {
      console.error('Send message error:', error.response?.status, error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Mark messages as read in a conversation
export const markAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      if (!token) {
        console.error('No token found in state');
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/messages/read/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Mark as read response:', response.data);
      
      return { 
        userId, 
        updatedCount: response.data.updatedCount || 0 
      };
    } catch (error) {
      console.error('Mark as read error:', error.response?.status, error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get unread message count
export const getUnreadCount = createAsyncThunk(
  'messages/getUnreadCount',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      if (!token) {
        console.error('No token found in state');
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/messages/unread/count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Unread count response:', response.data);
      
      return response.data.unreadCount || 0;
    } catch (error) {
      console.error('Get unread count error:', error.response?.status, error.response?.data || error.message);
      // Return 0 instead of rejecting to prevent errors
      return 0;
    }
  }
);

// Delete a single message
export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (messageId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      if (!token) {
        console.error('No token found in state');
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Delete message response:', response.data);
      
      return { messageId };
    } catch (error) {
      console.error('Delete message error:', error.response?.status, error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete entire conversation
export const deleteConversation = createAsyncThunk(
  'messages/deleteConversation',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      if (!token) {
        console.error('No token found in state');
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/messages/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Delete conversation response:', response.data);
      
      return { userId };
    } catch (error) {
      console.error('Delete conversation error:', error.response?.status, error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  conversations: [],
  currentMessages: [],
  currentOtherUser: null,
  isLoading: false,
  sending: false,
  deleting: false,
  error: null,
  totalUnread: 0,
  // Pagination
  totalPages: 1,
  currentPage: 1,
  totalItems: 0,
  // Selected conversation
  selectedUserId: null,
  // Filter/sort options
  filter: 'all', // 'all', 'unread'
  sortOrder: 'desc', // 'desc', 'asc'
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.currentMessages = [];
      state.currentOtherUser = null;
      state.selectedUserId = null;
      state.totalPages = 1;
      state.currentPage = 1;
      state.totalItems = 0;
    },
    addNewMessage: (state, action) => {
      const newMsg = {
        ...action.payload,
        sent: true,
        is_sender: true,
      };
      state.currentMessages.unshift(newMsg); // Add to beginning for newest first
      
      // Update the conversation list
      const existingConv = state.conversations.find(
        c => c.user?.id === (action.payload.receiver_id || state.selectedUserId)
      );
      if (existingConv) {
        existingConv.last_message = {
          id: newMsg._id,
          message: newMsg.message,
          sender_id: newMsg.sender_id,
          sender_model: newMsg.sender_model,
          created_at: newMsg.created_at,
          is_read: newMsg.is_read
        };
        // Move conversation to top
        const index = state.conversations.indexOf(existingConv);
        state.conversations.splice(index, 1);
        state.conversations.unshift(existingConv);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetMessages: (state) => {
      return { ...initialState };
    },
    setSelectedUser: (state, action) => {
      state.selectedUserId = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    updateConversation: (state, action) => {
      const { userId, updates } = action.payload;
      const conversation = state.conversations.find(c => c.user?.id === userId);
      if (conversation) {
        Object.assign(conversation, updates);
      }
    },
    // Optimistic update for sent messages
    optimisticSend: (state, action) => {
      const { receiverId, message, tempId } = action.payload;
      const newMsg = {
        _id: tempId || `temp_${Date.now()}`,
        message: message,
        sent: true,
        is_sender: true,
        created_at: new Date().toISOString(),
        is_read: false,
        sender_id: 'me',
        sender_model: 'Client', // Will be updated by backend
        receiver_id: receiverId,
        receiver_model: 'Freelancer', // Will be updated by backend
        temp: true // Flag for temporary messages
      };
      state.currentMessages.unshift(newMsg);
    },
    // Remove temporary message if send fails
    removeTempMessage: (state, action) => {
      const tempId = action.payload;
      state.currentMessages = state.currentMessages.filter(
        msg => msg._id !== tempId
      );
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Conversations
      .addCase(getConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload.conversations || [];
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.totalItems = action.payload.totalConversations || 0;
        
        // Calculate total unread
        state.totalUnread = state.conversations.reduce(
          (sum, conv) => sum + (conv.unread_count || 0), 0
        );
        state.error = null;
        console.log('Conversations loaded:', state.conversations.length);
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || { message: 'Failed to load conversations' };
        console.error('Conversations rejected:', state.error);
      })
      
      // Get Messages
      .addCase(getMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Process messages to ensure proper flags
        state.currentMessages = (action.payload.messages || []).map(msg => {
          // Determine if message is sent by current user
          // If sender_id is 'me', it's sent by current user
          const isSent = msg.sender_id === 'me' || msg.sent === true;
          
          return {
            ...msg,
            sent: isSent,
            is_sender: isSent,
          };
        });
        
        state.currentOtherUser = action.payload.otherUser;
        state.selectedUserId = action.payload.userId;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.totalItems = action.payload.totalMessages || 0;
        state.error = null;
        console.log('Messages loaded:', state.currentMessages.length);
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || { message: 'Failed to load messages' };
        console.error('Messages rejected:', state.error);
      })
      
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        if (action.payload) {
          const newMessage = {
            ...action.payload,
            sent: true,
            is_sender: true,
          };
          // Add to beginning for newest first
          state.currentMessages.unshift(newMessage);
          console.log('Message sent and added to state:', newMessage);
        }
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload || { message: 'Failed to send message' };
        console.error('Send message rejected:', state.error);
      })
      
      // Mark as Read
      .addCase(markAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        // Update conversation unread count
        const conversation = state.conversations.find(
          c => c.user?.id === action.payload.userId || c.other_user_id === action.payload.userId
        );
        if (conversation) {
          conversation.unread_count = 0;
        }
        
        // Update messages in current conversation
        if (state.selectedUserId === action.payload.userId) {
          state.currentMessages = state.currentMessages.map(msg => ({
            ...msg,
            is_read: true
          }));
        }
        
        // Update total unread count
        state.totalUnread = state.conversations.reduce(
          (sum, c) => sum + (c.unread_count || 0), 0
        );
        state.error = null;
        console.log('Messages marked as read for user:', action.payload.userId);
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.error = action.payload || { message: 'Failed to mark messages as read' };
        console.error('Mark as read rejected:', state.error);
      })
      
      // Get Unread Count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.totalUnread = action.payload || 0;
      })
      .addCase(getUnreadCount.rejected, (state) => {
        // Keep existing value on error
        console.log('Get unread count rejected, keeping existing value');
      })
      
      // Delete Message
      .addCase(deleteMessage.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.deleting = false;
        state.currentMessages = state.currentMessages.filter(
          msg => msg._id !== action.payload.messageId
        );
        state.error = null;
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || { message: 'Failed to delete message' };
      })
      
      // Delete Conversation
      .addCase(deleteConversation.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.deleting = false;
        state.conversations = state.conversations.filter(
          c => c.user?.id !== action.payload.userId && c.other_user_id !== action.payload.userId
        );
        if (state.selectedUserId === action.payload.userId) {
          state.currentMessages = [];
          state.selectedUserId = null;
          state.currentOtherUser = null;
        }
        // Update total unread
        state.totalUnread = state.conversations.reduce(
          (sum, c) => sum + (c.unread_count || 0), 0
        );
        state.error = null;
      })
      .addCase(deleteConversation.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || { message: 'Failed to delete conversation' };
      });
  },
});

export const { 
  clearMessages, 
  addNewMessage, 
  clearError,
  resetMessages,
  setSelectedUser,
  setFilter,
  updateConversation,
  optimisticSend,
  removeTempMessage
} = messageSlice.actions;

export default messageSlice.reducer;