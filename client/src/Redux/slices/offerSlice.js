// Redux/slices/offerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Get sent offers (for clients)
export const getSentOffers = createAsyncThunk(
  'offers/getSentOffers',
  async ({ status, page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { page, limit };
      if (status && status !== 'All') params.status = status;

      const response = await api.get('/offers/sent', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Get sent offers error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get received offers (for freelancers) - UPDATED WITH BETTER ERROR HANDLING
export const getReceivedOffers = createAsyncThunk(
  'offers/getReceivedOffers',
  async ({ status, page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      console.log('📤 Fetching received offers...');

      const params = { page, limit };
      if (status && status !== 'All') params.status = status;

      const response = await api.get('/freelancer/offers', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      console.log('📥 Received offers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Get received offers error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get single offer by ID
export const getOfferById = createAsyncThunk(
  'offers/getOfferById',
  async (offerId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get offer error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Create a new offer (Client only)
export const createOffer = createAsyncThunk(
  'offers/createOffer',
  async (offerData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post('/offers', offerData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Create offer error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update offer status - UPDATED WITH BETTER ERROR HANDLING
export const updateOfferStatus = createAsyncThunk(
  'offers/updateOfferStatus',
  async ({ offerId, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      if (!offerId) {
        return rejectWithValue({ message: 'Offer ID is required' });
      }

      console.log('📤 Updating offer:', { offerId, status });

      const response = await api.patch(`/offers/${offerId}/status`, 
        { status },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Offer updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Update offer status error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        offerId
      });
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete offer (Client only)
export const deleteOffer = createAsyncThunk(
  'offers/deleteOffer',
  async (offerId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { offerId, message: response.data.message };
    } catch (error) {
      console.error('Delete offer error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get offer statistics for dashboard
export const getOfferStats = createAsyncThunk(
  'offers/getOfferStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/offers/stats/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get offer stats error:', error.response?.data);
      // Return default stats instead of rejecting to prevent errors
      return {
        pendingOffers: 0,
        acceptedOffers: 0,
        declinedOffers: 0,
        totalOffers: 0,
        totalSpent: 0,
        totalEarnings: 0
      };
    }
  }
);

const initialState = {
  sentOffers: [],
  receivedOffers: [],
  selectedOffer: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
  unviewedCount: 0,
  stats: {
    pendingOffers: 0,
    acceptedOffers: 0,
    declinedOffers: 0,
    totalOffers: 0,
    totalSpent: 0,
    totalEarnings: 0,
  },
  createOfferSuccess: false,
  updateOfferSuccess: false,
};

const offerSlice = createSlice({
  name: 'offers',
  initialState,
  reducers: {
    clearOfferError: (state) => {
      state.error = null;
    },
    clearOfferSuccess: (state) => {
      state.createOfferSuccess = false;
      state.updateOfferSuccess = false;
    },
    setSelectedOffer: (state, action) => {
      state.selectedOffer = action.payload;
    },
    clearSelectedOffer: (state) => {
      state.selectedOffer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Sent Offers
      .addCase(getSentOffers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSentOffers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sentOffers = action.payload.offers || [];
        state.totalCount = action.payload.totalOffers || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
      })
      .addCase(getSentOffers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Received Offers
      .addCase(getReceivedOffers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getReceivedOffers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.receivedOffers = action.payload.offers || [];
        state.totalCount = action.payload.totalOffers || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.unviewedCount = action.payload.unviewedCount || 0;
        // Update stats
        const offers = action.payload.offers || [];
        state.stats.totalOffers = offers.length;
        state.stats.pendingOffers = offers.filter(o => o.status === 'pending').length;
        state.stats.acceptedOffers = offers.filter(o => o.status === 'accepted' || o.status === 'hired').length;
        state.stats.declinedOffers = offers.filter(o => o.status === 'declined').length;
      })
      .addCase(getReceivedOffers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Offer By ID
      .addCase(getOfferById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOfferById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedOffer = action.payload.offer;
      })
      .addCase(getOfferById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Offer
      .addCase(createOffer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.createOfferSuccess = false;
      })
      .addCase(createOffer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.createOfferSuccess = true;
        state.sentOffers.unshift(action.payload.offer);
        state.totalCount += 1;
      })
      .addCase(createOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.createOfferSuccess = false;
      })
      
      // Update Offer Status
      .addCase(updateOfferStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.updateOfferSuccess = false;
      })
      .addCase(updateOfferStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.updateOfferSuccess = true;
        
        // Update in sentOffers
        const sentIndex = state.sentOffers.findIndex(offer => offer._id === action.payload.offer._id);
        if (sentIndex !== -1) {
          state.sentOffers[sentIndex] = action.payload.offer;
        }
        
        // Update in receivedOffers
        const receivedIndex = state.receivedOffers.findIndex(offer => offer._id === action.payload.offer._id);
        if (receivedIndex !== -1) {
          state.receivedOffers[receivedIndex] = action.payload.offer;
        }
        
        if (state.selectedOffer?._id === action.payload.offer._id) {
          state.selectedOffer = action.payload.offer;
        }
        
        // Update stats
        const offers = state.receivedOffers;
        state.stats.totalOffers = offers.length;
        state.stats.pendingOffers = offers.filter(o => o.status === 'pending').length;
        state.stats.acceptedOffers = offers.filter(o => o.status === 'accepted' || o.status === 'hired').length;
        state.stats.declinedOffers = offers.filter(o => o.status === 'declined').length;
      })
      .addCase(updateOfferStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.updateOfferSuccess = false;
      })
      
      // Delete Offer
      .addCase(deleteOffer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteOffer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sentOffers = state.sentOffers.filter(offer => offer._id !== action.payload.offerId);
        state.totalCount -= 1;
      })
      .addCase(deleteOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Offer Stats
      .addCase(getOfferStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOfferStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats.pendingOffers = action.payload.pendingOffers || 0;
        state.stats.acceptedOffers = action.payload.acceptedOffers || 0;
        state.stats.declinedOffers = action.payload.declinedOffers || 0;
        state.stats.totalOffers = action.payload.totalOffers || 0;
        state.stats.totalSpent = action.payload.totalSpent || 0;
        state.stats.totalEarnings = action.payload.totalEarnings || 0;
      })
      .addCase(getOfferStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearOfferError, 
  clearOfferSuccess, 
  setSelectedOffer, 
  clearSelectedOffer 
} = offerSlice.actions;

export default offerSlice.reducer;