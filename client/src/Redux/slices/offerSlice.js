// Redux/slices/offerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Get sent offers (for clients)
export const getSentOffers = createAsyncThunk(
  'offers/getSentOffers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/offers/sent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get sent offers error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update offer status
export const updateOfferStatus = createAsyncThunk(
  'offers/updateOfferStatus',
  async ({ offerId, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/offers/${offerId}/status`, 
        { status },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Update offer status error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  sentOffers: [],
  receivedOffers: [],
  isLoading: false,
  error: null,
  totalCount: 0,
};

const offerSlice = createSlice({
  name: 'offers',
  initialState,
  reducers: {
    clearOfferError: (state) => {
      state.error = null;
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
        state.totalCount = action.payload.offers?.length || 0;
      })
      .addCase(getSentOffers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Offer Status
      .addCase(updateOfferStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOfferStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the offer in the list
        const index = state.sentOffers.findIndex(offer => offer._id === action.payload.offer._id);
        if (index !== -1) {
          state.sentOffers[index] = action.payload.offer;
        }
      })
      .addCase(updateOfferStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOfferError } = offerSlice.actions;
export default offerSlice.reducer;