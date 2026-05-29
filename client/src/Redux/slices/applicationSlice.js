// Redux/slices/applicationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Apply for a job (Freelancer)
export const applyForJob = createAsyncThunk(
  'applications/applyForJob',
  async ({ job_id, cover_letter, proposed_rate }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post('/applications', {
        job_id,
        cover_letter,
        proposed_rate
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Apply for job error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get freelancer's applications
export const getFreelancerApplications = createAsyncThunk(
  'applications/getFreelancerApplications',
  async ({ status, page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { page, limit };
      if (status && status !== 'All') params.status = status;

      const response = await api.get('/freelancer/applications', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Get freelancer applications error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get job applications (Client)
export const getJobApplications = createAsyncThunk(
  'applications/getJobApplications',
  async ({ jobId, status, page = 1, limit = 20 }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { page, limit };
      if (status && status !== 'All') params.status = status;

      const response = await api.get(`/jobs/${jobId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Get job applications error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update application status (Client)
export const updateApplicationStatus = createAsyncThunk(
  'applications/updateApplicationStatus',
  async ({ applicationId, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/applications/${applicationId}/status`, 
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
      console.error('Update application status error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Send offer to freelancer (Client)
export const sendOffer = createAsyncThunk(
  'applications/sendOffer',
  async ({ applicationId, amount, message }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post(`/applications/${applicationId}/offer`, 
        { amount, message },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Send offer error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  applications: [],
  selectedApplication: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
  applySuccess: false,
  updateSuccess: false,
};

const applicationSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearApplicationError: (state) => {
      state.error = null;
    },
    clearApplicationSuccess: (state) => {
      state.applySuccess = false;
      state.updateSuccess = false;
    },
    setSelectedApplication: (state, action) => {
      state.selectedApplication = action.payload;
    },
    clearSelectedApplication: (state) => {
      state.selectedApplication = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Apply for Job
      .addCase(applyForJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.applySuccess = false;
      })
      .addCase(applyForJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applySuccess = true;
        state.applications.unshift(action.payload.application);
        state.totalCount += 1;
      })
      .addCase(applyForJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.applySuccess = false;
      })
      
      // Get Freelancer Applications
      .addCase(getFreelancerApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFreelancerApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload.applications || [];
        state.totalCount = action.payload.totalApplications || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
      })
      .addCase(getFreelancerApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Job Applications
      .addCase(getJobApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getJobApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload.applications || [];
        state.totalCount = action.payload.totalApplications || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
      })
      .addCase(getJobApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Application Status
      .addCase(updateApplicationStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.updateSuccess = true;
        
        // Update the application in the list
        const index = state.applications.findIndex(app => app._id === action.payload.application._id);
        if (index !== -1) {
          state.applications[index] = action.payload.application;
        }
        
        if (state.selectedApplication?._id === action.payload.application._id) {
          state.selectedApplication = action.payload.application;
        }
      })
      .addCase(updateApplicationStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.updateSuccess = false;
      })
      
      // Send Offer
      .addCase(sendOffer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOffer.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update the application status
        const index = state.applications.findIndex(app => app._id === action.payload.application._id);
        if (index !== -1) {
          state.applications[index] = action.payload.application;
        }
      })
      .addCase(sendOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearApplicationError, 
  clearApplicationSuccess, 
  setSelectedApplication, 
  clearSelectedApplication 
} = applicationSlice.actions;

export default applicationSlice.reducer;