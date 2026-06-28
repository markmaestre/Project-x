// Redux/slices/applicationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ==================== FREELANCER ROUTES ====================

// Apply for a job with comprehensive data (Freelancer)
export const applyForJob = createAsyncThunk(
  'applications/applyForJob',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found. Please login again.' });
      }

      console.log('applyForJob called with formData type:', formData instanceof FormData ? 'FormData' : typeof formData);
      
      let response;
      
      // Check if formData is FormData (from file upload) or regular object
      if (formData instanceof FormData) {
        console.log('=== FormData Contents ===');
        for (let pair of formData.entries()) {
          console.log(pair[0], ':', typeof pair[1] === 'object' ? (pair[1].name || pair[1].uri || 'Object') : pair[1]);
        }
        
        response = await api.post('/applications/with-resume', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        response = await api.post('/applications', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      console.log('Application response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Apply for job error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return rejectWithValue(error.response?.data || { message: error.message || 'Failed to submit application' });
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

// Get single application by ID
export const getApplicationById = createAsyncThunk(
  'applications/getApplicationById',
  async (applicationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get application error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Withdraw an application (Freelancer only)
export const withdrawApplication = createAsyncThunk(
  'applications/withdrawApplication',
  async ({ applicationId, reason }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/applications/${applicationId}/withdraw`, 
        { reason },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Withdraw application error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== SAVED JOBS ROUTES ====================

// Save job for later
export const saveJobForLater = createAsyncThunk(
  'applications/saveJobForLater',
  async ({ jobId, notes }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post('/applications/save', 
        { job_id: jobId, notes },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Save job error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Unsave job
export const unsaveJob = createAsyncThunk(
  'applications/unsaveJob',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/applications/save/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { jobId, message: response.data.message };
    } catch (error) {
      console.error('Unsave job error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get saved jobs
export const getSavedJobs = createAsyncThunk(
  'applications/getSavedJobs',
  async ({ page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/applications/saved', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get saved jobs error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Check if job is saved
export const checkJobSaved = createAsyncThunk(
  'applications/checkJobSaved',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/applications/saved/check/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { jobId, ...response.data };
    } catch (error) {
      console.error('Check job saved error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== CLIENT ROUTES ====================

// Get applications for a specific job (Client only)
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

// Get all applications for a client's jobs (Client)
export const getClientApplications = createAsyncThunk(
  'applications/getClientApplications',
  async ({ status, job_id, page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { page, limit };
      if (status && status !== 'All') params.status = status;
      if (job_id) params.job_id = job_id;

      const response = await api.get('/client/applications', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Get client applications error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update application status (Client only) - supports interview data
export const updateApplicationStatus = createAsyncThunk(
  'applications/updateApplicationStatus',
  async ({ applicationId, status, interview, offer }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const payload = { status };
      if (interview) {
        payload.interview = interview;
      }
      if (offer) {
        payload.offer = offer;
      }

      const response = await api.patch(`/applications/${applicationId}/status`, 
        payload,
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

// Send offer to freelancer (Client only) - Using new schema
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

// Download resume from application (Client only)
export const downloadResume = createAsyncThunk(
  'applications/downloadResume',
  async (applicationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/applications/${applicationId}/resume`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Download resume error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Mark job as completed (Client)
export const completeJob = createAsyncThunk(
  'applications/completeJob',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/jobs/${jobId}/complete`, 
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Complete job error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  applications: [],
  selectedApplication: null,
  savedJobs: [],
  savedJobIds: [],
  isLoading: false,
  error: null,
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
  applySuccess: false,
  updateSuccess: false,
  resumeUrl: null,
  isSaved: false,
  savedJobId: null,
  stats: {
    total: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    interview: 0,
    offered: 0,
    hired: 0,
    completed: 0,
    rejected: 0,
    withdrawn: 0,
  },
  statusBreakdown: {},
};

// ==================== SLICE ====================

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
    clearResumeUrl: (state) => {
      state.resumeUrl = null;
    },
    clearApplications: (state) => {
      state.applications = [];
      state.totalCount = 0;
      state.totalPages = 1;
      state.currentPage = 1;
    },
    clearSavedJobs: (state) => {
      state.savedJobs = [];
      state.savedJobIds = [];
    },
    updateApplicationLocally: (state, action) => {
      const { applicationId, updates } = action.payload;
      const index = state.applications.findIndex(app => app._id === applicationId);
      if (index !== -1) {
        state.applications[index] = { ...state.applications[index], ...updates };
      }
      if (state.selectedApplication?._id === applicationId) {
        state.selectedApplication = { ...state.selectedApplication, ...updates };
      }
    },
    updateSavedJobNotes: (state, action) => {
      const { jobId, notes } = action.payload;
      const job = state.savedJobs.find(j => j._id === jobId);
      if (job) {
        job.notes = notes;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== APPLY FOR JOB ====================
      .addCase(applyForJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.applySuccess = false;
      })
      .addCase(applyForJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applySuccess = true;
        state.error = null;
        if (action.payload.application) {
          state.applications.unshift(action.payload.application);
          state.totalCount += 1;
        }
      })
      .addCase(applyForJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.applySuccess = false;
      })
      
      // ==================== GET FREELANCER APPLICATIONS ====================
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
      
      // ==================== GET APPLICATION BY ID ====================
      .addCase(getApplicationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getApplicationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedApplication = action.payload.application;
      })
      .addCase(getApplicationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ==================== WITHDRAW APPLICATION ====================
      .addCase(withdrawApplication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(withdrawApplication.fulfilled, (state, action) => {
        state.isLoading = false;
        state.updateSuccess = true;
        const updatedApp = action.payload.application;
        const index = state.applications.findIndex(app => app._id === updatedApp._id);
        if (index !== -1) {
          state.applications[index] = updatedApp;
        }
        if (state.selectedApplication?._id === updatedApp._id) {
          state.selectedApplication = updatedApp;
        }
      })
      .addCase(withdrawApplication.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ==================== GET JOB APPLICATIONS ====================
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
      
      // ==================== GET CLIENT APPLICATIONS ====================
      .addCase(getClientApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getClientApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload.applications || [];
        state.totalCount = action.payload.totalApplications || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.statusBreakdown = action.payload.statusBreakdown || {};
      })
      .addCase(getClientApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ==================== UPDATE APPLICATION STATUS ====================
      .addCase(updateApplicationStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.updateSuccess = true;
        
        const updatedApp = action.payload.application;
        const index = state.applications.findIndex(app => app._id === updatedApp._id);
        if (index !== -1) {
          state.applications[index] = updatedApp;
        }
        
        if (state.selectedApplication?._id === updatedApp._id) {
          state.selectedApplication = updatedApp;
        }
      })
      .addCase(updateApplicationStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.updateSuccess = false;
      })
      
      // ==================== SEND OFFER ====================
      .addCase(sendOffer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOffer.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedApp = action.payload.application;
        const index = state.applications.findIndex(app => app._id === updatedApp._id);
        if (index !== -1) {
          state.applications[index] = updatedApp;
        }
        if (state.selectedApplication?._id === updatedApp._id) {
          state.selectedApplication = updatedApp;
        }
      })
      .addCase(sendOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ==================== DOWNLOAD RESUME ====================
      .addCase(downloadResume.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(downloadResume.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resumeUrl = action.payload.resume_url;
      })
      .addCase(downloadResume.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ==================== SAVE JOB ====================
      .addCase(saveJobForLater.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveJobForLater.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.savedJob) {
          const savedJob = action.payload.savedJob;
          state.savedJobs.push(savedJob);
          if (savedJob.job_id?._id) {
            state.savedJobIds.push(savedJob.job_id._id);
          }
        }
        state.isSaved = true;
        state.savedJobId = action.payload.savedJob?._id || null;
      })
      .addCase(saveJobForLater.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ==================== UNSAVE JOB ====================
      .addCase(unsaveJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unsaveJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedJobs = state.savedJobs.filter(job => job.job_id?._id !== action.payload.jobId);
        state.savedJobIds = state.savedJobIds.filter(id => id !== action.payload.jobId);
        state.isSaved = false;
        state.savedJobId = null;
      })
      .addCase(unsaveJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ==================== GET SAVED JOBS ====================
      .addCase(getSavedJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSavedJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedJobs = action.payload.savedJobs || [];
        state.savedJobIds = action.payload.savedJobs
          .map(job => job.job_id?._id)
          .filter(id => id);
        state.totalCount = action.payload.totalSaved || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
      })
      .addCase(getSavedJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ==================== CHECK JOB SAVED ====================
      .addCase(checkJobSaved.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkJobSaved.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSaved = action.payload.isSaved || false;
        state.savedJobId = action.payload.savedJobId || null;
      })
      .addCase(checkJobSaved.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ==================== COMPLETE JOB ====================
      .addCase(completeJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const jobId = action.payload.job._id;
        state.applications = state.applications.map(app => {
          if (app.job_id?._id === jobId && (app.status === 'hired' || app.status === 'offered')) {
            return { ...app, status: 'completed' };
          }
          return app;
        });
        if (state.selectedApplication?.job_id?._id === jobId) {
          state.selectedApplication = { ...state.selectedApplication, status: 'completed' };
        }
      })
      .addCase(completeJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// ==================== EXPORT ACTIONS ====================

export const { 
  clearApplicationError, 
  clearApplicationSuccess, 
  setSelectedApplication, 
  clearSelectedApplication,
  clearResumeUrl,
  clearApplications,
  clearSavedJobs,
  updateApplicationLocally,
  updateSavedJobNotes
} = applicationSlice.actions;

// ==================== SELECTORS ====================

export const selectAllApplications = (state) => state.applications.applications;
export const selectSelectedApplication = (state) => state.applications.selectedApplication;
export const selectSavedJobs = (state) => state.applications.savedJobs;
export const selectSavedJobIds = (state) => state.applications.savedJobIds;
export const selectIsSaved = (state) => state.applications.isSaved;
export const selectSavedJobId = (state) => state.applications.savedJobId;
export const selectApplicationsLoading = (state) => state.applications.isLoading;
export const selectApplicationsError = (state) => state.applications.error;
export const selectApplicationsTotal = (state) => state.applications.totalCount;
export const selectApplicationsTotalPages = (state) => state.applications.totalPages;
export const selectApplicationsCurrentPage = (state) => state.applications.currentPage;
export const selectApplySuccess = (state) => state.applications.applySuccess;
export const selectUpdateSuccess = (state) => state.applications.updateSuccess;
export const selectResumeUrl = (state) => state.applications.resumeUrl;
export const selectApplicationStats = (state) => state.applications.stats;
export const selectStatusBreakdown = (state) => state.applications.statusBreakdown;

export default applicationSlice.reducer;