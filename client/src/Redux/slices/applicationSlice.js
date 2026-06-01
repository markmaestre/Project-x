// Redux/slices/applicationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Helper function to create FormData for application with file upload
const createApplicationFormData = (applicationData) => {
  const formData = new FormData();
  
  // Add basic fields
  formData.append('job_id', applicationData.job_id);
  formData.append('cover_letter', applicationData.cover_letter);
  
  if (applicationData.proposed_rate) {
    formData.append('proposed_rate', String(applicationData.proposed_rate));
  }
  
  // Add resume file if present
  if (applicationData.resume && applicationData.resume.uri) {
    // Get filename and extension
    const uriParts = applicationData.resume.uri.split('/');
    const fileName = applicationData.resume.name || uriParts[uriParts.length - 1];
    
    const fileObj = {
      uri: applicationData.resume.uri,
      name: fileName,
      type: applicationData.resume.mimeType || getFileType(fileName),
    };
    formData.append('resume', fileObj);
  }
  
  // Add education data as JSON string
  if (applicationData.education) {
    formData.append('education', JSON.stringify(applicationData.education));
  }
  
  // Add experiences data as JSON string
  if (applicationData.experiences && applicationData.experiences.length > 0) {
    formData.append('experiences', JSON.stringify(applicationData.experiences));
  }
  
  return formData;
};

// Helper function to get file type from filename
const getFileType = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
};

// Apply for a job with comprehensive data (Freelancer)
export const applyForJob = createAsyncThunk(
  'applications/applyForJob',
  async (applicationData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      let response;
      
      // Check if we need to send as FormData (has file)
      if (applicationData.resume && applicationData.resume.uri) {
        // May resume file - gamitin ang /applications/with-resume
        const formData = createApplicationFormData(applicationData);
        
        response = await api.post('/applications/with-resume', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Walang resume file - gamitin ang /applications
        response = await api.post('/applications', {
          job_id: applicationData.job_id,
          cover_letter: applicationData.cover_letter,
          proposed_rate: applicationData.proposed_rate,
          education: applicationData.education,
          experiences: applicationData.experiences,
        }, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
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

// Save job for later
export const saveJobForLater = createAsyncThunk(
  'applications/saveJobForLater',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post('/applications/save', 
        { job_id: jobId },
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
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/applications/saved', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get saved jobs error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

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
    clearResumeUrl: (state) => {
      state.resumeUrl = null;
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
      
      // Get Application By ID
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
        const index = state.applications.findIndex(app => app._id === action.payload.application._id);
        if (index !== -1) {
          state.applications[index] = action.payload.application;
        }
        if (state.selectedApplication?._id === action.payload.application._id) {
          state.selectedApplication = action.payload.application;
        }
      })
      .addCase(sendOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Download Resume
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
      
      // Save Job For Later
      .addCase(saveJobForLater.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveJobForLater.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.job) {
          state.savedJobs.push(action.payload.job);
          state.savedJobIds.push(action.payload.job._id);
        }
      })
      .addCase(saveJobForLater.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.error('Save job rejected:', action.payload);
      })
      
      // Unsave Job
      .addCase(unsaveJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unsaveJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedJobs = state.savedJobs.filter(job => job._id !== action.payload.jobId);
        state.savedJobIds = state.savedJobIds.filter(id => id !== action.payload.jobId);
      })
      .addCase(unsaveJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Saved Jobs
      .addCase(getSavedJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSavedJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedJobs = action.payload.savedJobs || [];
        state.savedJobIds = action.payload.savedJobs.map(job => job._id);
      })
      .addCase(getSavedJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.error('Get saved jobs rejected:', action.payload);
      });
  },
});

export const { 
  clearApplicationError, 
  clearApplicationSuccess, 
  setSelectedApplication, 
  clearSelectedApplication,
  clearResumeUrl 
} = applicationSlice.actions;

export default applicationSlice.reducer;