// Redux/slices/notificationSlice.js - COMPLETE FIXED VERSION

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ==================== ASYNC THUNKS ====================

// Get all notifications for the authenticated user - FIXED
export const getNotifications = createAsyncThunk(
  'notifications/getNotifications',
  async ({ page = 1, limit = 20, is_read, type, priority } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      const params = { page, limit };
      if (is_read !== undefined && is_read !== 'All') params.is_read = is_read;
      if (type && type !== 'All') params.type = type;
      if (priority && priority !== 'All') params.priority = priority;

      console.log('Fetching notifications with params:', params);

      const response = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      console.log('Notifications response:', response.data);

      // --- FIX: Handle the nested data structure ---
      let notificationsArray = [];
      let totalCount = 0;
      let unreadCount = 0;
      let totalPages = 1;
      let currentPage = 1;
      let typeBreakdown = {};

      // Check if the response has the nested structure
      if (response.data && response.data.notifications) {
        // Check if notifications is an object with a 'notifications' property (nested)
        if (response.data.notifications.notifications && Array.isArray(response.data.notifications.notifications)) {
          // Nested structure: { notifications: { notifications: [...], total: X, unreadCount: Y } }
          notificationsArray = response.data.notifications.notifications || [];
          totalCount = response.data.notifications.total || 0;
          unreadCount = response.data.notifications.unreadCount || 0;
          totalPages = response.data.totalPages || 1;
          currentPage = response.data.currentPage || 1;
          typeBreakdown = response.data.typeBreakdown || {};
        } else if (Array.isArray(response.data.notifications)) {
          // Flat structure: { notifications: [...], totalCount: X, unreadCount: Y }
          notificationsArray = response.data.notifications || [];
          totalCount = response.data.totalCount || response.data.total || 0;
          unreadCount = response.data.unreadCount || 0;
          totalPages = response.data.totalPages || 1;
          currentPage = response.data.currentPage || 1;
          typeBreakdown = response.data.typeBreakdown || {};
        } else {
          // Fallback: try to use response.data directly
          notificationsArray = response.data.notifications || [];
          totalCount = response.data.total || response.data.totalCount || 0;
          unreadCount = response.data.unreadCount || 0;
          totalPages = response.data.totalPages || 1;
          currentPage = response.data.currentPage || 1;
          typeBreakdown = response.data.typeBreakdown || {};
        }
      } else if (Array.isArray(response.data)) {
        // If response is directly an array
        notificationsArray = response.data;
        totalCount = response.data.length;
      }

      // Return normalized data structure
      return {
        notifications: notificationsArray,
        totalNotifications: totalCount,
        unreadCount: unreadCount,
        totalPages: totalPages,
        currentPage: currentPage,
        typeBreakdown: typeBreakdown,
        // Keep original data for debugging if needed
        _original: response.data
      };
      
    } catch (error) {
      console.error('Get notifications error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get unread notifications only - FIXED
export const getUnreadNotifications = createAsyncThunk(
  'notifications/getUnreadNotifications',
  async ({ page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      const response = await api.get('/notifications/unread', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      });

      console.log('Unread notifications response:', response.data);

      // Handle the nested data structure for unread as well
      let notificationsArray = [];
      let unreadCount = 0;

      if (response.data && response.data.notifications) {
        if (response.data.notifications.notifications && Array.isArray(response.data.notifications.notifications)) {
          notificationsArray = response.data.notifications.notifications || [];
          unreadCount = response.data.notifications.unreadCount || 0;
        } else if (Array.isArray(response.data.notifications)) {
          notificationsArray = response.data.notifications || [];
          unreadCount = response.data.unreadCount || 0;
        } else {
          notificationsArray = response.data.notifications || [];
          unreadCount = response.data.unreadCount || 0;
        }
      } else if (Array.isArray(response.data)) {
        notificationsArray = response.data;
      }

      return {
        notifications: notificationsArray,
        unreadCount: unreadCount,
        total: notificationsArray.length
      };
      
    } catch (error) {
      console.error('Get unread notifications error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get a single notification by ID
export const getNotificationById = createAsyncThunk(
  'notifications/getNotificationById',
  async (notificationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      const response = await api.get(`/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Get notification error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Mark a single notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      const response = await api.patch(`/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Mark notification as read error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      const response = await api.patch('/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Mark all notifications as read error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Mark notifications as read by type
export const markNotificationsByTypeAsRead = createAsyncThunk(
  'notifications/markNotificationsByTypeAsRead',
  async (type, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      const response = await api.patch('/notifications/read-by-type', 
        { type },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Mark notifications by type as read error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete a single notification
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      const response = await api.delete(`/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return { notificationId, ...response.data };
    } catch (error) {
      console.error('Delete notification error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete all notifications (with optional type filter)
export const deleteAllNotifications = createAsyncThunk(
  'notifications/deleteAllNotifications',
  async ({ type } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      const params = type && type !== 'All' ? { type } : {};
      const response = await api.delete('/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      return response.data;
    } catch (error) {
      console.error('Delete all notifications error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== GET NOTIFICATION COUNTS - FIXED ====================

// Get notification counts - FIXED: Uses notifications endpoint instead of /counts
export const getNotificationCounts = createAsyncThunk(
  'notifications/getNotificationCounts',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const user = getState().auth.user;
      
      if (!token) {
        console.log('No token found, skipping counts fetch');
        return {
          totalUnread: 0,
          highPriorityUnread: 0,
          unreadByType: {}
        };
      }

      // Check if user ID looks like a valid MongoDB ObjectId (24 hex chars)
      const userId = user?.id || user?._id;
      if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        console.log('Invalid user ID format, skipping counts fetch:', userId);
        return {
          totalUnread: 0,
          highPriorityUnread: 0,
          unreadByType: {}
        };
      }

      console.log('Fetching notification counts for user:', userId);
      
      // ✅ FIX: Use the notifications endpoint with limit=1 to get unread count
      // This avoids the "/counts" endpoint error
      const response = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          page: 1, 
          limit: 1,
          is_read: false // This will give us unread count
        }
      });

      console.log('Counts from notifications endpoint:', response.data);

      // Extract counts from the response
      let unreadCount = 0;
      let typeBreakdown = {};

      if (response.data && response.data.notifications) {
        // Get unread count from nested structure
        if (response.data.notifications.unreadCount !== undefined) {
          unreadCount = response.data.notifications.unreadCount;
        } else if (response.data.unreadCount !== undefined) {
          unreadCount = response.data.unreadCount;
        }

        // Get type breakdown if available
        if (response.data.typeBreakdown) {
          typeBreakdown = response.data.typeBreakdown;
        } else if (response.data.notifications.typeBreakdown) {
          typeBreakdown = response.data.notifications.typeBreakdown;
        }
      }

      console.log('✅ Counts fetched successfully:', { totalUnread: unreadCount, typeBreakdown });

      // Return the counts
      return {
        totalUnread: unreadCount || 0,
        highPriorityUnread: 0,
        unreadByType: typeBreakdown || {}
      };

    } catch (error) {
      console.error('Get notification counts error:', error.response?.data || error.message);
      
      // ✅ Don't reject, just return default values
      return {
        totalUnread: 0,
        highPriorityUnread: 0,
        unreadByType: {}
      };
    }
  }
);

// Get notification preferences
export const getNotificationPreferences = createAsyncThunk(
  'notifications/getNotificationPreferences',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      const response = await api.get('/notifications/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Get notification preferences error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update notification preferences
export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updateNotificationPreferences',
  async (preferences, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      const response = await api.patch('/notifications/preferences', 
        { preferences },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Update notification preferences error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  notifications: [],
  selectedNotification: null,
  unreadNotifications: [],
  isLoading: false,
  error: null,
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
  unreadCount: 0,
  highPriorityUnread: 0,
  typeBreakdown: {},
  unreadByType: {},
  preferences: {
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
  },
  markSuccess: false,
  deleteSuccess: false,
  updateSuccess: false,
  lastUpdated: null,
  countsLoaded: false,
};

// ==================== SLICE ====================

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    clearNotificationSuccess: (state) => {
      state.markSuccess = false;
      state.deleteSuccess = false;
      state.updateSuccess = false;
    },
    setSelectedNotification: (state, action) => {
      state.selectedNotification = action.payload;
    },
    clearSelectedNotification: (state) => {
      state.selectedNotification = null;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.totalCount = 0;
      state.totalPages = 1;
      state.currentPage = 1;
    },
    clearUnreadNotifications: (state) => {
      state.unreadNotifications = [];
    },
    updateNotificationLocally: (state, action) => {
      const { notificationId, updates } = action.payload;
      const index = state.notifications.findIndex(n => n._id === notificationId);
      if (index !== -1) {
        state.notifications[index] = { ...state.notifications[index], ...updates };
      }
      if (state.selectedNotification?._id === notificationId) {
        state.selectedNotification = { ...state.selectedNotification, ...updates };
      }
      const unreadIndex = state.unreadNotifications.findIndex(n => n._id === notificationId);
      if (unreadIndex !== -1) {
        state.unreadNotifications[unreadIndex] = { ...state.unreadNotifications[unreadIndex], ...updates };
      }
    },
    removeNotificationLocally: (state, action) => {
      const notificationId = action.payload;
      state.notifications = state.notifications.filter(n => n._id !== notificationId);
      state.unreadNotifications = state.unreadNotifications.filter(n => n._id !== notificationId);
      if (state.selectedNotification?._id === notificationId) {
        state.selectedNotification = null;
      }
    },
    decrementUnreadCount: (state, action) => {
      const count = action.payload || 1;
      state.unreadCount = Math.max(0, state.unreadCount - count);
    },
    incrementUnreadCount: (state, action) => {
      const count = action.payload || 1;
      state.unreadCount += count;
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    },
    addNotificationLocally: (state, action) => {
      const notification = action.payload;
      state.notifications.unshift(notification);
      state.totalCount += 1;
      if (!notification.is_read) {
        state.unreadCount += 1;
      }
    },
    setCountsLoaded: (state, action) => {
      state.countsLoaded = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== GET NOTIFICATIONS ====================
      .addCase(getNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications || [];
        state.totalCount = action.payload.totalNotifications || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        // Only update unreadCount if not already set by counts
        if (!state.countsLoaded) {
          state.unreadCount = action.payload.unreadCount || 0;
        }
        state.typeBreakdown = action.payload.typeBreakdown || {};
        state.lastUpdated = new Date().toISOString();
        console.log('Notifications loaded:', state.notifications.length);
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // Keep existing data on error
      })

      // ==================== GET UNREAD NOTIFICATIONS ====================
      .addCase(getUnreadNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUnreadNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.unreadNotifications = action.payload.notifications || [];
        if (!state.countsLoaded) {
          state.unreadCount = action.payload.unreadCount || 0;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getUnreadNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ==================== GET NOTIFICATION BY ID ====================
      .addCase(getNotificationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getNotificationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedNotification = action.payload.notification;
        if (state.selectedNotification && !state.selectedNotification.is_clicked) {
          state.selectedNotification.is_clicked = true;
          state.selectedNotification.clicked_at = new Date().toISOString();
        }
      })
      .addCase(getNotificationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ==================== MARK NOTIFICATION AS READ ====================
      .addCase(markNotificationAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.markSuccess = false;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        state.markSuccess = true;
        if (action.payload.unreadCount !== undefined) {
          state.unreadCount = action.payload.unreadCount;
        }
        
        const updatedNotification = action.payload.notification;
        if (updatedNotification) {
          const index = state.notifications.findIndex(n => n._id === updatedNotification._id);
          if (index !== -1) {
            state.notifications[index] = updatedNotification;
          }
          if (state.selectedNotification?._id === updatedNotification._id) {
            state.selectedNotification = updatedNotification;
          }
          state.unreadNotifications = state.unreadNotifications.filter(
            n => n._id !== updatedNotification._id
          );
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.markSuccess = false;
      })

      // ==================== MARK ALL NOTIFICATIONS AS READ ====================
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.markSuccess = false;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.isLoading = false;
        state.markSuccess = true;
        state.unreadCount = 0;
        state.notifications = state.notifications.map(n => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString()
        }));
        state.unreadNotifications = [];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.markSuccess = false;
      })

      // ==================== MARK NOTIFICATIONS BY TYPE AS READ ====================
      .addCase(markNotificationsByTypeAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.markSuccess = false;
      })
      .addCase(markNotificationsByTypeAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        state.markSuccess = true;
        if (action.payload.unreadCount !== undefined) {
          state.unreadCount = action.payload.unreadCount;
        }
        const type = action.meta.arg;
        state.notifications = state.notifications.map(n => {
          if (n.type === type && !n.is_read) {
            return { ...n, is_read: true, read_at: new Date().toISOString() };
          }
          return n;
        });
        state.unreadNotifications = state.unreadNotifications.filter(
          n => n.type !== type
        );
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(markNotificationsByTypeAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.markSuccess = false;
      })

      // ==================== DELETE NOTIFICATION ====================
      .addCase(deleteNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deleteSuccess = true;
        if (action.payload.unreadCount !== undefined) {
          state.unreadCount = action.payload.unreadCount;
        }
        const notificationId = action.payload.notificationId;
        state.notifications = state.notifications.filter(n => n._id !== notificationId);
        state.unreadNotifications = state.unreadNotifications.filter(n => n._id !== notificationId);
        if (state.selectedNotification?._id === notificationId) {
          state.selectedNotification = null;
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.deleteSuccess = false;
      })

      // ==================== DELETE ALL NOTIFICATIONS ====================
      .addCase(deleteAllNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteAllNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deleteSuccess = true;
        const type = action.meta.arg?.type;
        if (type && type !== 'All') {
          state.notifications = state.notifications.filter(n => n.type !== type);
          state.unreadNotifications = state.unreadNotifications.filter(n => n.type !== type);
          state.unreadCount = state.unreadNotifications.length;
        } else {
          state.notifications = [];
          state.unreadNotifications = [];
          state.unreadCount = 0;
          state.totalCount = 0;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteAllNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.deleteSuccess = false;
      })

      // ==================== GET NOTIFICATION COUNTS - FIXED ====================
      .addCase(getNotificationCounts.pending, (state) => {
        // Don't set loading to true for counts to avoid UI flicker
        state.error = null;
      })
      .addCase(getNotificationCounts.fulfilled, (state, action) => {
        state.countsLoaded = true;
        state.unreadCount = action.payload?.totalUnread || 0;
        state.highPriorityUnread = action.payload?.highPriorityUnread || 0;
        state.unreadByType = action.payload?.unreadByType || {};
        state.lastUpdated = new Date().toISOString();
        console.log('✅ Notification counts updated:', state.unreadCount);
      })
      .addCase(getNotificationCounts.rejected, (state) => {
        state.countsLoaded = true;
        state.unreadCount = 0;
        state.highPriorityUnread = 0;
        state.unreadByType = {};
        console.log('Counts endpoint failed, using defaults');
      })

      // ==================== GET NOTIFICATION PREFERENCES ====================
      .addCase(getNotificationPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getNotificationPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.preferences = action.payload.preferences || state.preferences;
      })
      .addCase(getNotificationPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ==================== UPDATE NOTIFICATION PREFERENCES ====================
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.updateSuccess = true;
        state.preferences = action.payload.preferences || state.preferences;
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.updateSuccess = false;
      });
  },
});

// ==================== EXPORT ACTIONS ====================

export const {
  clearNotificationError,
  clearNotificationSuccess,
  setSelectedNotification,
  clearSelectedNotification,
  clearNotifications,
  clearUnreadNotifications,
  updateNotificationLocally,
  removeNotificationLocally,
  decrementUnreadCount,
  incrementUnreadCount,
  resetUnreadCount,
  addNotificationLocally,
  setCountsLoaded,
} = notificationSlice.actions;

// ==================== SELECTORS ====================

export const selectAllNotifications = (state) => {
  // Ensure we always return an array
  return state.notifications.notifications || [];
};

export const selectUnreadNotifications = (state) => {
  return state.notifications.unreadNotifications || [];
};

export const selectSelectedNotification = (state) => state.notifications.selectedNotification;
export const selectNotificationsLoading = (state) => state.notifications.isLoading || false;
export const selectNotificationsError = (state) => state.notifications.error;
export const selectNotificationsTotal = (state) => state.notifications.totalCount || 0;
export const selectNotificationsTotalPages = (state) => state.notifications.totalPages || 1;
export const selectNotificationsCurrentPage = (state) => state.notifications.currentPage || 1;
export const selectUnreadCount = (state) => state.notifications.unreadCount || 0;
export const selectHighPriorityUnread = (state) => state.notifications.highPriorityUnread || 0;
export const selectTypeBreakdown = (state) => state.notifications.typeBreakdown || {};
export const selectUnreadByType = (state) => state.notifications.unreadByType || {};
export const selectNotificationPreferences = (state) => state.notifications.preferences;
export const selectMarkSuccess = (state) => state.notifications.markSuccess || false;
export const selectDeleteSuccess = (state) => state.notifications.deleteSuccess || false;
export const selectUpdateSuccess = (state) => state.notifications.updateSuccess || false;
export const selectNotificationsLastUpdated = (state) => state.notifications.lastUpdated;
export const selectCountsLoaded = (state) => state.notifications.countsLoaded || false;

// ==================== COMPLEX SELECTORS ====================

export const selectUnreadCountByType = (state, type) => {
  return state.notifications.unreadByType[type] || 0;
};

export const selectNotificationsByType = (state, type) => {
  return (state.notifications.notifications || []).filter(n => n.type === type);
};

export const selectUnreadNotificationsByType = (state, type) => {
  return (state.notifications.unreadNotifications || []).filter(n => n.type === type);
};

export const selectHighPriorityNotifications = (state) => {
  return (state.notifications.notifications || []).filter(
    n => n.priority === 'high' || n.priority === 'urgent'
  );
};

export const selectUnreadHighPriorityNotifications = (state) => {
  return (state.notifications.unreadNotifications || []).filter(
    n => n.priority === 'high' || n.priority === 'urgent'
  );
};

export const selectNotificationsWithActions = (state) => {
  return (state.notifications.notifications || []).filter(
    n => n.actions && n.actions.length > 0
  );
};

export const selectNotificationsByReference = (state, referenceId, referenceModel) => {
  return (state.notifications.notifications || []).filter(
    n => n.reference_id === referenceId && n.reference_model === referenceModel
  );
};

export default notificationSlice.reducer;