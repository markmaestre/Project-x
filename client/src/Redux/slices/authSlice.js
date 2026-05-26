import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

// Storage helper functions
const storeToken = async (token) => {
  try {
    if (token) {
      await AsyncStorage.setItem('token', token);
    }
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

const storeUser = async (user) => {
  try {
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
  } catch (error) {
    console.error('Error storing user:', error);
  }
};

const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const getUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('token');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

const removeUser = async () => {
  try {
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Error removing user:', error);
  }
};

// Helper function to create FormData for file uploads
const createFormData = (data, isFreelancer = false) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (key === 'profile_picture' && data[key]) {
      // Handle file upload
      formData.append('profile_picture', {
        uri: data[key].uri,
        type: data[key].type || 'image/jpeg',
        name: data[key].fileName || data[key].name || `profile_${Date.now()}.jpg`,
      });
    } else if (key === 'skills' || key === 'languages' || key === 'certifications') {
      // Handle arrays - send as JSON string
      if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
        formData.append(key, JSON.stringify(data[key]));
      } else if (data[key] && typeof data[key] === 'string') {
        // If it's already a string, send as is
        formData.append(key, data[key]);
      }
    } else if (key === 'terms_accepted') {
      // Send boolean as string 'true' or 'false'
      const booleanValue = data[key] === true || data[key] === 'true';
      formData.append(key, booleanValue ? 'true' : 'false');
    } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
      // For all other fields that have values, send as string
      formData.append(key, String(data[key]));
    }
  });
  
  return formData;
};

// Register Client with profile picture
export const registerClient = createAsyncThunk(
  'auth/registerClient',
  async (userData, { rejectWithValue }) => {
    try {
      let response;
      
      // Ensure terms_accepted is boolean
      const processedData = {
        ...userData,
        terms_accepted: userData.terms_accepted === true || userData.terms_accepted === 'true'
      };
      
      if (processedData.profile_picture) {
        // If there's a profile picture, use FormData
        const formData = createFormData(processedData, false);
        response = await api.post('/auth/register/client', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // No profile picture, use JSON
        response = await api.post('/auth/register/client', processedData);
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Register Freelancer with profile picture and arrays
export const registerFreelancer = createAsyncThunk(
  'auth/registerFreelancer',
  async (userData, { rejectWithValue }) => {
    try {
      let response;
      
      // Ensure terms_accepted is boolean
      const processedData = {
        ...userData,
        terms_accepted: userData.terms_accepted === true || userData.terms_accepted === 'true'
      };
      
      console.log('Sending freelancer data:', processedData);
      
      if (processedData.profile_picture) {
        // If there's a profile picture, use FormData
        const formData = createFormData(processedData, true);
        response = await api.post('/auth/register/freelancer', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // No profile picture, use JSON
        response = await api.post('/auth/register/freelancer', processedData);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      await storeToken(response.data.token);
      await storeUser(response.data.user);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get Profile
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }
      
      const response = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update stored user
      if (response.data.user) {
        await storeUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired or invalid
        await removeToken();
        await removeUser();
      }
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update Profile with image support
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ profileData, profilePicture }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }
      
      let response;
      
      if (profilePicture) {
        // If updating profile picture, use FormData
        const formData = new FormData();
        
        // Add profile picture
        formData.append('profile_picture', {
          uri: profilePicture.uri,
          type: profilePicture.type || 'image/jpeg',
          name: profilePicture.fileName || profilePicture.name || `profile_${Date.now()}.jpg`,
        });
        
        // Add other profile data
        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== null && profileData[key] !== undefined && profileData[key] !== '') {
            if (key === 'skills' && Array.isArray(profileData[key])) {
              // Send skills as JSON string if array has items
              if (profileData[key].length > 0) {
                formData.append(key, JSON.stringify(profileData[key]));
              }
            } else if (key === 'years_of_experience' || key === 'hourly_rate' || key === 'fixed_rate') {
              // Send numeric values as strings
              if (profileData[key] !== null && profileData[key] !== undefined) {
                formData.append(key, String(profileData[key]));
              }
            } else {
              formData.append(key, String(profileData[key]));
            }
          }
        });
        
        response = await api.put('/auth/profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
        });
      } else {
        // No profile picture update, use JSON
        // Clean up the data before sending
        const cleanData = {};
        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== null && profileData[key] !== undefined && profileData[key] !== '') {
            cleanData[key] = profileData[key];
          }
        });
        
        console.log('Sending clean data to backend:', cleanData);
        
        response = await api.put('/auth/profile', cleanData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('Profile update response:', response.data);
      
      // Update local storage with new user data
      if (response.data.user) {
        await storeUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete Profile Picture
export const deleteProfilePicture = createAsyncThunk(
  'auth/deleteProfilePicture',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }
      
      const response = await api.delete('/auth/profile/picture', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local storage by removing profile picture
      const currentUser = getState().auth.user;
      if (currentUser) {
        const updatedUser = { ...currentUser, profile_picture: null, profile_picture_public_id: null };
        await storeUser(updatedUser);
      }
      
      return response.data;
    } catch (error) {
      console.error('Delete profile picture error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Fetch freelancers with optional filters
export const fetchFreelancers = createAsyncThunk(
  'auth/fetchFreelancers',
  async (filters = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }
      
      const response = await api.get('/auth/freelancers', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await removeToken();
    await removeUser();
    return {};
  }
);

// Initialize auth
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    const token = await getToken();
    const user = await getUser();
    return { token, user };
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  role: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  registrationSuccess: false,
  freelancers: {
    list: [],
    selectedFreelancer: null,
    isLoading: false,
    error: null,
    totalCount: 0,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.freelancers.error = null;
      state.registrationSuccess = false;
    },
    updateUserLocally: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      storeUser(state.user);
    },
    selectFreelancer: (state, action) => {
      state.freelancers.selectedFreelancer = action.payload;
    },
    clearFreelancers: (state) => {
      state.freelancers.list = [];
      state.freelancers.selectedFreelancer = null;
      state.freelancers.totalCount = 0;
    },
    clearRegistrationSuccess: (state) => {
      state.registrationSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.token;
        state.role = action.payload.user?.role || null;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
      })
      
      // Register Client
      .addCase(registerClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerClient.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        state.registrationSuccess = true;
      })
      .addCase(registerClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.registrationSuccess = false;
      })
      
      // Register Freelancer
      .addCase(registerFreelancer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerFreelancer.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        state.registrationSuccess = true;
      })
      .addCase(registerFreelancer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.registrationSuccess = false;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
        // Don't store user here as it's already stored in the thunk
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // If token is invalid, logout
        if (action.payload?.message === 'No token found' || action.payload?.status === 401) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
        // User is already stored in the thunk
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Profile Picture
      .addCase(deleteProfilePicture.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProfilePicture.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.profile_picture = null;
          state.user.profile_picture_public_id = null;
        }
        // User is already updated in the thunk
      })
      .addCase(deleteProfilePicture.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Freelancers
      .addCase(fetchFreelancers.pending, (state) => {
        state.freelancers.isLoading = true;
        state.freelancers.error = null;
      })
      .addCase(fetchFreelancers.fulfilled, (state, action) => {
        state.freelancers.isLoading = false;
        state.freelancers.list = action.payload.freelancers || [];
        state.freelancers.totalCount = action.payload.freelancers?.length || 0;
      })
      .addCase(fetchFreelancers.rejected, (state, action) => {
        state.freelancers.isLoading = false;
        state.freelancers.error = action.payload;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.role = null;
        state.error = null;
        state.registrationSuccess = false;
        state.freelancers.list = [];
        state.freelancers.selectedFreelancer = null;
        state.freelancers.totalCount = 0;
      });
  },
});

export const { 
  clearError, 
  updateUserLocally, 
  selectFreelancer, 
  clearFreelancers,
  clearRegistrationSuccess 
} = authSlice.actions;

export default authSlice.reducer;