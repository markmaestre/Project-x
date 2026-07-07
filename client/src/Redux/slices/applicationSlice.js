// Redux/slices/applicationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ==================== HELPER FUNCTIONS ====================

// Helper to log FormData contents for debugging
const logFormData = (formData) => {
  if (formData instanceof FormData) {
    console.log('=== FormData Contents ===');
    for (let pair of formData.entries()) {
      const value = pair[1];
      if (value instanceof Blob || value instanceof File) {
        console.log(pair[0], ':', value.name || 'Blob', `(${value.size || 0} bytes, ${value.type || 'unknown'})`);
      } else if (typeof value === 'object') {
        console.log(pair[0], ':', JSON.stringify(value));
      } else {
        console.log(pair[0], ':', value);
      }
    }
  }
};

// Helper to check if token is valid
const getAuthToken = (getState) => {
  const token = getState().auth.token;
  if (!token) {
    throw new Error('No token found. Please login again.');
  }
  return token;
};

// ==================== FREELANCER ROUTES ====================

// Apply for a job with comprehensive data (Freelancer)
export const applyForJob = createAsyncThunk(
  'applications/applyForJob',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      console.log('applyForJob called with formData type:', 
        formData instanceof FormData ? 'FormData' : typeof formData);
      
      let response;
      
      // Check if formData is FormData (from file upload) or regular object
      if (formData instanceof FormData) {
        logFormData(formData);
        
        response = await api.post('/applications/with-resume', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout for file upload
        });
      } else {
        response = await api.post('/applications', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      console.log('Application response status:', response.status);
      console.log('Application response data:', response.data);
      
      // Return with email notification status
      return {
        ...response.data,
        emailNotifications: response.data.emailNotifications || {
          client: 'sent',
          freelancer: 'sent'
        }
      };
    } catch (error) {
      console.error('Apply for job error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers,
        } : null,
      });
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        if (error.response?.data?.message?.includes('already applied')) {
          return rejectWithValue({ 
            message: 'You have already applied for this job',
            code: 'ALREADY_APPLIED'
          });
        }
      }
      
      if (error.response?.status === 413) {
        return rejectWithValue({ 
          message: 'File is too large. Please upload a file smaller than 5MB.',
          code: 'FILE_TOO_LARGE'
        });
      }
      
      return rejectWithValue(
        error.response?.data || { 
          message: error.message || 'Failed to submit application',
          code: 'UNKNOWN_ERROR'
        }
      );
    }
  }
);

// Get freelancer's applications with improved error handling
export const getFreelancerApplications = createAsyncThunk(
  'applications/getFreelancerApplications',
  async ({ status, page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      const params = { page, limit };
      if (status && status !== 'All') params.status = status;

      const response = await api.get('/freelancer/applications', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return {
        applications: response.data.applications || [],
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
        totalApplications: response.data.totalApplications || 0,
      };
    } catch (error) {
      console.error('Get freelancer applications error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        return rejectWithValue({ 
          message: 'Session expired. Please login again.',
          code: 'UNAUTHORIZED'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to fetch applications',
        code: 'FETCH_ERROR'
      });
    }
  }
);

// Get single application by ID
export const getApplicationById = createAsyncThunk(
  'applications/getApplicationById',
  async (applicationId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!applicationId) {
        return rejectWithValue({ message: 'Application ID is required' });
      }

      const response = await api.get(`/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get application error:', error.response?.data);
      
      if (error.response?.status === 404) {
        return rejectWithValue({ 
          message: 'Application not found',
          code: 'NOT_FOUND'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to fetch application',
        code: 'FETCH_ERROR'
      });
    }
  }
);

// Withdraw an application (Freelancer only)
export const withdrawApplication = createAsyncThunk(
  'applications/withdrawApplication',
  async ({ applicationId, reason }, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!applicationId) {
        return rejectWithValue({ message: 'Application ID is required' });
      }

      const response = await api.patch(`/applications/${applicationId}/withdraw`, 
        { reason: reason || 'Withdrawn by freelancer' },
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
      
      if (error.response?.status === 400) {
        return rejectWithValue({ 
          message: error.response?.data?.message || 'Cannot withdraw this application at this stage',
          code: 'CANNOT_WITHDRAW'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to withdraw application',
        code: 'WITHDRAW_ERROR'
      });
    }
  }
);

// ==================== SAVED JOBS ROUTES ====================

// Save job for later
export const saveJobForLater = createAsyncThunk(
  'applications/saveJobForLater',
  async ({ jobId, notes }, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!jobId) {
        return rejectWithValue({ message: 'Job ID is required' });
      }

      const response = await api.post('/applications/save', 
        { job_id: jobId, notes: notes || null },
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
      
      if (error.response?.status === 400) {
        return rejectWithValue({ 
          message: error.response?.data?.message || 'Job already saved',
          code: 'ALREADY_SAVED'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to save job',
        code: 'SAVE_ERROR'
      });
    }
  }
);

// Unsave job
export const unsaveJob = createAsyncThunk(
  'applications/unsaveJob',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!jobId) {
        return rejectWithValue({ message: 'Job ID is required' });
      }

      const response = await api.delete(`/applications/save/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { jobId, message: response.data.message };
    } catch (error) {
      console.error('Unsave job error:', error.response?.data);
      
      if (error.response?.status === 404) {
        return rejectWithValue({ 
          message: 'Saved job not found',
          code: 'NOT_FOUND'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to unsave job',
        code: 'UNSAVE_ERROR'
      });
    }
  }
);

// Get saved jobs
export const getSavedJobs = createAsyncThunk(
  'applications/getSavedJobs',
  async ({ page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      const response = await api.get('/applications/saved', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      });
      
      return {
        savedJobs: response.data.savedJobs || [],
        totalSaved: response.data.totalSaved || 0,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
      };
    } catch (error) {
      console.error('Get saved jobs error:', error.response?.data);
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to fetch saved jobs',
        code: 'FETCH_ERROR'
      });
    }
  }
);

// Check if job is saved
export const checkJobSaved = createAsyncThunk(
  'applications/checkJobSaved',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!jobId) {
        return rejectWithValue({ message: 'Job ID is required' });
      }

      const response = await api.get(`/applications/saved/check/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { 
        jobId, 
        isSaved: response.data.isSaved || false,
        savedJobId: response.data.savedJobId || null,
      };
    } catch (error) {
      console.error('Check job saved error:', error.response?.data);
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to check saved status',
        code: 'CHECK_ERROR'
      });
    }
  }
);

// ==================== CLIENT ROUTES ====================

// Get applications for a specific job (Client only)
export const getJobApplications = createAsyncThunk(
  'applications/getJobApplications',
  async ({ jobId, status, page = 1, limit = 20 }, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!jobId) {
        return rejectWithValue({ message: 'Job ID is required' });
      }

      const params = { page, limit };
      if (status && status !== 'All') params.status = status;

      const response = await api.get(`/jobs/${jobId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return {
        applications: response.data.applications || [],
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
        totalApplications: response.data.totalApplications || 0,
      };
    } catch (error) {
      console.error('Get job applications error:', error.response?.data);
      
      if (error.response?.status === 403) {
        return rejectWithValue({ 
          message: 'You do not have permission to view these applications',
          code: 'FORBIDDEN'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to fetch applications',
        code: 'FETCH_ERROR'
      });
    }
  }
);

// Get all applications for a client's jobs (Client)
export const getClientApplications = createAsyncThunk(
  'applications/getClientApplications',
  async ({ status, job_id, page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      const params = { page, limit };
      if (status && status !== 'All') params.status = status;
      if (job_id) params.job_id = job_id;

      const response = await api.get('/client/applications', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return {
        applications: response.data.applications || [],
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
        totalApplications: response.data.totalApplications || 0,
        statusBreakdown: response.data.statusBreakdown || {},
      };
    } catch (error) {
      console.error('Get client applications error:', error.response?.data);
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to fetch applications',
        code: 'FETCH_ERROR'
      });
    }
  }
);

// Update application status (Client only) - supports interview data
export const updateApplicationStatus = createAsyncThunk(
  'applications/updateApplicationStatus',
  async ({ applicationId, status, interview, offer, notes }, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!applicationId) {
        return rejectWithValue({ message: 'Application ID is required' });
      }

      const payload = { status };
      if (interview) {
        payload.interview = interview;
      }
      if (offer) {
        payload.offer = offer;
      }
      if (notes) {
        payload.notes = notes;
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
      
      // Return with email notification status
      return {
        ...response.data,
        emailNotifications: response.data.emailNotifications || {
          freelancer: 'sent'
        }
      };
    } catch (error) {
      console.error('Update application status error:', error.response?.data);
      
      if (error.response?.status === 403) {
        return rejectWithValue({ 
          message: 'You do not have permission to update this application',
          code: 'FORBIDDEN'
        });
      }
      
      if (error.response?.status === 400) {
        return rejectWithValue({ 
          message: error.response?.data?.message || 'Invalid status update',
          code: 'INVALID_UPDATE'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to update application status',
        code: 'UPDATE_ERROR'
      });
    }
  }
);

// Send offer to freelancer (Client only)
export const sendOffer = createAsyncThunk(
  'applications/sendOffer',
  async ({ applicationId, amount, message }, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!applicationId) {
        return rejectWithValue({ message: 'Application ID is required' });
      }
      if (!amount || amount <= 0) {
        return rejectWithValue({ message: 'Valid offer amount is required' });
      }

      const response = await api.patch(`/applications/${applicationId}/status`, 
        { 
          status: 'offered',
          offer: { 
            amount, 
            message: message || 'We would like to offer you this position.' 
          }
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        ...response.data,
        emailNotifications: response.data.emailNotifications || {
          freelancer: 'sent'
        }
      };
    } catch (error) {
      console.error('Send offer error:', error.response?.data);
      
      if (error.response?.status === 403) {
        return rejectWithValue({ 
          message: 'You do not have permission to send offers',
          code: 'FORBIDDEN'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to send offer',
        code: 'SEND_OFFER_ERROR'
      });
    }
  }
);

// Accept offer (Freelancer only)
export const acceptOffer = createAsyncThunk(
  'applications/acceptOffer',
  async (applicationId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!applicationId) {
        return rejectWithValue({ message: 'Application ID is required' });
      }

      const response = await api.post(`/applications/${applicationId}/accept-offer`, 
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        ...response.data,
        emailNotifications: response.data.emailNotifications || {
          client: 'sent',
          freelancer: 'sent'
        }
      };
    } catch (error) {
      console.error('Accept offer error:', error.response?.data);
      
      if (error.response?.status === 403) {
        return rejectWithValue({ 
          message: 'You do not have permission to accept this offer',
          code: 'FORBIDDEN'
        });
      }
      
      if (error.response?.status === 400) {
        return rejectWithValue({ 
          message: error.response?.data?.message || 'No offer to accept',
          code: 'NO_OFFER'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to accept offer',
        code: 'ACCEPT_OFFER_ERROR'
      });
    }
  }
);

// Download resume from application (Client only)
export const downloadResume = createAsyncThunk(
  'applications/downloadResume',
  async (applicationId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!applicationId) {
        return rejectWithValue({ message: 'Application ID is required' });
      }

      const response = await api.get(`/applications/${applicationId}/resume`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      console.error('Download resume error:', error.response?.data);
      
      if (error.response?.status === 404) {
        return rejectWithValue({ 
          message: 'Resume not found',
          code: 'NOT_FOUND'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to download resume',
        code: 'DOWNLOAD_ERROR'
      });
    }
  }
);

// Mark job as completed (Client)
export const completeJob = createAsyncThunk(
  'applications/completeJob',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState);

      if (!jobId) {
        return rejectWithValue({ message: 'Job ID is required' });
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
      
      if (error.response?.status === 403) {
        return rejectWithValue({ 
          message: 'You do not have permission to complete this job',
          code: 'FORBIDDEN'
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to complete job',
        code: 'COMPLETE_JOB_ERROR'
      });
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
  // Email notification tracking
  emailNotifications: {
    lastSent: null,
    status: {
      client: null,
      freelancer: null
    }
  },
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
  lastUpdated: null,
  uploadProgress: 0, // For file upload progress
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
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    resetUploadProgress: (state) => {
      state.uploadProgress = 0;
    },
    updateApplicationStatusLocally: (state, action) => {
      const { applicationId, status } = action.payload;
      const index = state.applications.findIndex(app => app._id === applicationId);
      if (index !== -1) {
        const oldStatus = state.applications[index].status;
        state.applications[index].status = status;
        // Update stats
        if (oldStatus && oldStatus !== status) {
          if (state.stats[oldStatus] > 0) state.stats[oldStatus]--;
          if (state.stats[status] !== undefined) state.stats[status]++;
        }
      }
      if (state.selectedApplication?._id === applicationId) {
        state.selectedApplication.status = status;
      }
    },
    // Email notification tracking reducers
    setEmailNotificationStatus: (state, action) => {
      const { recipient, status } = action.payload;
      state.emailNotifications.status[recipient] = status;
      state.emailNotifications.lastSent = new Date().toISOString();
    },
    clearEmailNotifications: (state) => {
      state.emailNotifications = {
        lastSent: null,
        status: {
          client: null,
          freelancer: null
        }
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== APPLY FOR JOB ====================
      .addCase(applyForJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.applySuccess = false;
        state.uploadProgress = 0;
      })
      .addCase(applyForJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applySuccess = true;
        state.error = null;
        state.uploadProgress = 100;
        if (action.payload.application) {
          state.applications.unshift(action.payload.application);
          state.totalCount += 1;
          // Update stats
          const status = action.payload.application.status || 'pending';
          if (state.stats[status] !== undefined) {
            state.stats[status] += 1;
          }
        }
        // Track email notifications
        if (action.payload.emailNotifications) {
          state.emailNotifications.status.client = action.payload.emailNotifications.client || 'sent';
          state.emailNotifications.status.freelancer = action.payload.emailNotifications.freelancer || 'sent';
          state.emailNotifications.lastSent = new Date().toISOString();
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(applyForJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.applySuccess = false;
        state.uploadProgress = 0;
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
        state.lastUpdated = new Date().toISOString();
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
        state.lastUpdated = new Date().toISOString();
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
        state.lastUpdated = new Date().toISOString();
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
        state.lastUpdated = new Date().toISOString();
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
          const oldStatus = state.applications[index].status;
          state.applications[index] = updatedApp;
          // Update stats
          if (oldStatus && oldStatus !== updatedApp.status) {
            if (state.stats[oldStatus] > 0) state.stats[oldStatus]--;
            if (state.stats[updatedApp.status] !== undefined) {
              state.stats[updatedApp.status]++;
            }
          }
        }
        
        if (state.selectedApplication?._id === updatedApp._id) {
          state.selectedApplication = updatedApp;
        }
        
        // Track email notifications
        if (action.payload.emailNotifications) {
          state.emailNotifications.status.freelancer = action.payload.emailNotifications.freelancer || 'sent';
          state.emailNotifications.lastSent = new Date().toISOString();
        }
        
        state.lastUpdated = new Date().toISOString();
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
        
        // Track email notifications
        if (action.payload.emailNotifications) {
          state.emailNotifications.status.freelancer = action.payload.emailNotifications.freelancer || 'sent';
          state.emailNotifications.lastSent = new Date().toISOString();
        }
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(sendOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ==================== ACCEPT OFFER ====================
      .addCase(acceptOffer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptOffer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.updateSuccess = true;
        
        // Update application status to hired
        if (action.payload.contract) {
          const applicationId = action.payload.contract.application_id;
          const index = state.applications.findIndex(app => app._id === applicationId);
          if (index !== -1) {
            const oldStatus = state.applications[index].status;
            state.applications[index].status = 'hired';
            // Update stats
            if (oldStatus && oldStatus !== 'hired') {
              if (state.stats[oldStatus] > 0) state.stats[oldStatus]--;
              if (state.stats.hired !== undefined) state.stats.hired++;
            }
          }
          if (state.selectedApplication?._id === applicationId) {
            state.selectedApplication.status = 'hired';
          }
        }
        
        // Track email notifications
        if (action.payload.emailNotifications) {
          state.emailNotifications.status.client = action.payload.emailNotifications.client || 'sent';
          state.emailNotifications.status.freelancer = action.payload.emailNotifications.freelancer || 'sent';
          state.emailNotifications.lastSent = new Date().toISOString();
        }
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(acceptOffer.rejected, (state, action) => {
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
        state.lastUpdated = new Date().toISOString();
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
        state.lastUpdated = new Date().toISOString();
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
        state.lastUpdated = new Date().toISOString();
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
            const oldStatus = app.status;
            const newApp = { ...app, status: 'completed' };
            // Update stats
            if (state.stats[oldStatus] > 0) state.stats[oldStatus]--;
            if (state.stats.completed !== undefined) state.stats.completed++;
            return newApp;
          }
          return app;
        });
        if (state.selectedApplication?.job_id?._id === jobId) {
          const oldStatus = state.selectedApplication.status;
          state.selectedApplication = { ...state.selectedApplication, status: 'completed' };
          if (state.stats[oldStatus] > 0) state.stats[oldStatus]--;
          if (state.stats.completed !== undefined) state.stats.completed++;
        }
        state.lastUpdated = new Date().toISOString();
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
  updateSavedJobNotes,
  setUploadProgress,
  resetUploadProgress,
  updateApplicationStatusLocally,
  setEmailNotificationStatus,
  clearEmailNotifications,
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
export const selectUploadProgress = (state) => state.applications.uploadProgress;
export const selectLastUpdated = (state) => state.applications.lastUpdated;
export const selectEmailNotifications = (state) => state.applications.emailNotifications;

export default applicationSlice.reducer;