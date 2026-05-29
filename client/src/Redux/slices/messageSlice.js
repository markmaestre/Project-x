// Redux/slices/messageSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Get all conversations for the current user
export const getConversations = createAsyncThunk(
  'messages/getConversations',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get conversations error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get messages with a specific user
export const getMessages = createAsyncThunk(
  'messages/getMessages',
  async (otherUserId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/messages/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get messages error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Send a message
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ receiverId, message }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post('/messages', 
        { receiverId, message },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Send message error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Mark messages as read
export const markAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (otherUserId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/messages/${otherUserId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { otherUserId, ...response.data };
    } catch (error) {
      console.error('Mark as read error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  conversations: [],
  currentMessages: [],
  isLoading: false,
  sending: false,
  error: null,
  totalUnread: 0,
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.currentMessages = [];
    },
    addNewMessage: (state, action) => {
      state.currentMessages.push(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
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
        state.totalUnread = action.payload.totalUnread || 0;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Messages
      .addCase(getMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentMessages = action.payload.messages || [];
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        state.currentMessages.push(action.payload.message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload;
      })
      
      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const conversation = state.conversations.find(
          c => c.other_user_id === action.payload.otherUserId
        );
        if (conversation) {
          conversation.unread_count = 0;
        }
      });
  },
});

export const { clearMessages, addNewMessage, clearError } = messageSlice.actions;
export default messageSlice.reducer;