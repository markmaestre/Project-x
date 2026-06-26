// src/Redux/slices/ratingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Rate a client
export const rateClient = createAsyncThunk(
  'rating/rateClient',
  async ({ clientId, rating, review, jobId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post(
        `/ratings/client/${clientId}`,
        { rating, review, job_id: jobId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Rate client error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Rate a freelancer
export const rateFreelancer = createAsyncThunk(
  'rating/rateFreelancer',
  async ({ freelancerId, rating, review, jobId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post(
        `/ratings/freelancer/${freelancerId}`,
        { rating, review, job_id: jobId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Rate freelancer error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Check if freelancer can rate a client
export const checkFreelancerCanRate = createAsyncThunk(
  'rating/checkFreelancerCanRate',
  async ({ clientId, jobId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(
        `/ratings/freelancer/${clientId}/can-rate`,
        {
          params: { job_id: jobId },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Check can rate error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Check if client can rate a freelancer
export const checkClientCanRate = createAsyncThunk(
  'rating/checkClientCanRate',
  async ({ freelancerId, jobId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(
        `/ratings/client/${freelancerId}/can-rate`,
        {
          params: { job_id: jobId },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Check can rate error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get client ratings
export const getClientRatings = createAsyncThunk(
  'rating/getClientRatings',
  async (clientId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/ratings/client/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Get client ratings error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get freelancer ratings
export const getFreelancerRatings = createAsyncThunk(
  'rating/getFreelancerRatings',
  async (freelancerId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/ratings/freelancer/${freelancerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Get freelancer ratings error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get average rating for a client
export const getClientAverageRating = createAsyncThunk(
  'rating/getClientAverageRating',
  async (clientId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/ratings/client/${clientId}/average`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Get client average rating error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get average rating for a freelancer
export const getFreelancerAverageRating = createAsyncThunk(
  'rating/getFreelancerAverageRating',
  async (freelancerId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/ratings/freelancer/${freelancerId}/average`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Get freelancer average rating error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update a rating
export const updateRating = createAsyncThunk(
  'rating/updateRating',
  async ({ ratingId, rating, review }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.put(
        `/ratings/${ratingId}`,
        { rating, review },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Update rating error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete a rating
export const deleteRating = createAsyncThunk(
  'rating/deleteRating',
  async (ratingId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/ratings/${ratingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Delete rating error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  clientRatings: {
    list: [],
    average: null,
    total: 0,
    isLoading: false,
    error: null,
  },
  freelancerRatings: {
    list: [],
    average: null,
    total: 0,
    isLoading: false,
    error: null,
  },
  canRate: {
    canRate: false,
    existingRating: null,
    isLoading: false,
    error: null,
  },
  submitRating: {
    isLoading: false,
    error: null,
    success: false,
  },
  updateRating: {
    isLoading: false,
    error: null,
    success: false,
  },
  deleteRating: {
    isLoading: false,
    error: null,
    success: false,
  },
};

const ratingSlice = createSlice({
  name: 'rating',
  initialState,
  reducers: {
    clearRatingErrors: (state) => {
      state.clientRatings.error = null;
      state.freelancerRatings.error = null;
      state.canRate.error = null;
      state.submitRating.error = null;
      state.updateRating.error = null;
      state.deleteRating.error = null;
    },
    clearSubmitRatingSuccess: (state) => {
      state.submitRating.success = false;
    },
    clearUpdateRatingSuccess: (state) => {
      state.updateRating.success = false;
    },
    clearDeleteRatingSuccess: (state) => {
      state.deleteRating.success = false;
    },
    resetCanRate: (state) => {
      state.canRate = {
        canRate: false,
        existingRating: null,
        isLoading: false,
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Rate Client
      .addCase(rateClient.pending, (state) => {
        state.submitRating.isLoading = true;
        state.submitRating.error = null;
        state.submitRating.success = false;
      })
      .addCase(rateClient.fulfilled, (state, action) => {
        state.submitRating.isLoading = false;
        state.submitRating.success = true;
        state.submitRating.error = null;
        // Add the new rating to the list if it exists
        if (state.clientRatings.list) {
          state.clientRatings.list.push(action.payload.rating);
          state.clientRatings.total += 1;
        }
      })
      .addCase(rateClient.rejected, (state, action) => {
        state.submitRating.isLoading = false;
        state.submitRating.error = action.payload;
        state.submitRating.success = false;
      })

      // Rate Freelancer
      .addCase(rateFreelancer.pending, (state) => {
        state.submitRating.isLoading = true;
        state.submitRating.error = null;
        state.submitRating.success = false;
      })
      .addCase(rateFreelancer.fulfilled, (state, action) => {
        state.submitRating.isLoading = false;
        state.submitRating.success = true;
        state.submitRating.error = null;
        if (state.freelancerRatings.list) {
          state.freelancerRatings.list.push(action.payload.rating);
          state.freelancerRatings.total += 1;
        }
      })
      .addCase(rateFreelancer.rejected, (state, action) => {
        state.submitRating.isLoading = false;
        state.submitRating.error = action.payload;
        state.submitRating.success = false;
      })

      // Check Freelancer Can Rate
      .addCase(checkFreelancerCanRate.pending, (state) => {
        state.canRate.isLoading = true;
        state.canRate.error = null;
      })
      .addCase(checkFreelancerCanRate.fulfilled, (state, action) => {
        state.canRate.isLoading = false;
        state.canRate.canRate = action.payload.canRate || false;
        state.canRate.existingRating = action.payload.existingRating || null;
        state.canRate.error = null;
      })
      .addCase(checkFreelancerCanRate.rejected, (state, action) => {
        state.canRate.isLoading = false;
        state.canRate.canRate = false;
        state.canRate.error = action.payload;
      })

      // Check Client Can Rate
      .addCase(checkClientCanRate.pending, (state) => {
        state.canRate.isLoading = true;
        state.canRate.error = null;
      })
      .addCase(checkClientCanRate.fulfilled, (state, action) => {
        state.canRate.isLoading = false;
        state.canRate.canRate = action.payload.canRate || false;
        state.canRate.existingRating = action.payload.existingRating || null;
        state.canRate.error = null;
      })
      .addCase(checkClientCanRate.rejected, (state, action) => {
        state.canRate.isLoading = false;
        state.canRate.canRate = false;
        state.canRate.error = action.payload;
      })

      // Get Client Ratings
      .addCase(getClientRatings.pending, (state) => {
        state.clientRatings.isLoading = true;
        state.clientRatings.error = null;
      })
      .addCase(getClientRatings.fulfilled, (state, action) => {
        state.clientRatings.isLoading = false;
        state.clientRatings.list = action.payload.ratings || [];
        state.clientRatings.total = action.payload.total || action.payload.ratings?.length || 0;
        state.clientRatings.error = null;
      })
      .addCase(getClientRatings.rejected, (state, action) => {
        state.clientRatings.isLoading = false;
        state.clientRatings.error = action.payload;
      })

      // Get Freelancer Ratings
      .addCase(getFreelancerRatings.pending, (state) => {
        state.freelancerRatings.isLoading = true;
        state.freelancerRatings.error = null;
      })
      .addCase(getFreelancerRatings.fulfilled, (state, action) => {
        state.freelancerRatings.isLoading = false;
        state.freelancerRatings.list = action.payload.ratings || [];
        state.freelancerRatings.total = action.payload.total || action.payload.ratings?.length || 0;
        state.freelancerRatings.error = null;
      })
      .addCase(getFreelancerRatings.rejected, (state, action) => {
        state.freelancerRatings.isLoading = false;
        state.freelancerRatings.error = action.payload;
      })

      // Get Client Average Rating
      .addCase(getClientAverageRating.fulfilled, (state, action) => {
        state.clientRatings.average = action.payload.average || 0;
      })

      // Get Freelancer Average Rating
      .addCase(getFreelancerAverageRating.fulfilled, (state, action) => {
        state.freelancerRatings.average = action.payload.average || 0;
      })

      // Update Rating
      .addCase(updateRating.pending, (state) => {
        state.updateRating.isLoading = true;
        state.updateRating.error = null;
        state.updateRating.success = false;
      })
      .addCase(updateRating.fulfilled, (state, action) => {
        state.updateRating.isLoading = false;
        state.updateRating.success = true;
        state.updateRating.error = null;
        // Update the rating in the list
        const updatedRating = action.payload.rating;
        const clientList = state.clientRatings.list;
        const freelancerList = state.freelancerRatings.list;
        
        if (clientList) {
          const index = clientList.findIndex(r => r._id === updatedRating._id);
          if (index !== -1) {
            clientList[index] = updatedRating;
          }
        }
        if (freelancerList) {
          const index = freelancerList.findIndex(r => r._id === updatedRating._id);
          if (index !== -1) {
            freelancerList[index] = updatedRating;
          }
        }
      })
      .addCase(updateRating.rejected, (state, action) => {
        state.updateRating.isLoading = false;
        state.updateRating.error = action.payload;
        state.updateRating.success = false;
      })

      // Delete Rating
      .addCase(deleteRating.pending, (state) => {
        state.deleteRating.isLoading = true;
        state.deleteRating.error = null;
        state.deleteRating.success = false;
      })
      .addCase(deleteRating.fulfilled, (state, action) => {
        state.deleteRating.isLoading = false;
        state.deleteRating.success = true;
        state.deleteRating.error = null;
        // Remove the rating from the list
        const ratingId = action.payload.ratingId || action.meta.arg;
        state.clientRatings.list = state.clientRatings.list.filter(r => r._id !== ratingId);
        state.freelancerRatings.list = state.freelancerRatings.list.filter(r => r._id !== ratingId);
        state.clientRatings.total = Math.max(0, state.clientRatings.total - 1);
        state.freelancerRatings.total = Math.max(0, state.freelancerRatings.total - 1);
      })
      .addCase(deleteRating.rejected, (state, action) => {
        state.deleteRating.isLoading = false;
        state.deleteRating.error = action.payload;
        state.deleteRating.success = false;
      });
  },
});

export const {
  clearRatingErrors,
  clearSubmitRatingSuccess,
  clearUpdateRatingSuccess,
  clearDeleteRatingSuccess,
  resetCanRate,
} = ratingSlice.actions;

export default ratingSlice.reducer;