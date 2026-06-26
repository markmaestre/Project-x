// Redux/slices/jobSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const createJobFormData = (jobData) => {
  const formData = new FormData();
  
  Object.keys(jobData).forEach(key => {
    if (jobData[key] !== null && jobData[key] !== undefined && jobData[key] !== '') {
      if (typeof jobData[key] === 'object' && !(jobData[key] instanceof File)) {
        formData.append(key, JSON.stringify(jobData[key]));
      } else {
        formData.append(key, String(jobData[key]));
      }
    }
  });
  
  return formData;
};

// ==================== JOB ACTIONS ====================

// Create a new job (Client only)
export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const formData = createJobFormData(jobData);
      const response = await api.post('/jobs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Create job error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get client's jobs
export const getClientJobs = createAsyncThunk(
  'jobs/getClientJobs',
  async ({ status, page = 1, limit = 10 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { page, limit };
      if (status) params.status = status;

      const response = await api.get('/client/jobs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Get client jobs error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get all open jobs for freelancers
export const getFreelancerJobs = createAsyncThunk(
  'jobs/getFreelancerJobs',
  async (filters = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/freelancer/jobs', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      
      return response.data;
    } catch (error) {
      console.error('Get freelancer jobs error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get single job by ID
export const getJobById = createAsyncThunk(
  'jobs/getJobById',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get job by ID error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get job insights (NEW)
export const getJobInsights = createAsyncThunk(
  'jobs/getJobInsights',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/jobs/${jobId}/insights`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get job insights error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update job (Client only)
export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ jobId, jobData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const formData = createJobFormData(jobData);
      const response = await api.put(`/jobs/${jobId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Update job error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update job status (Client only)
export const updateJobStatus = createAsyncThunk(
  'jobs/updateJobStatus',
  async ({ jobId, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/jobs/${jobId}/status`, 
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
      console.error('Update job status error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete job (Client only)
export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { jobId, message: response.data.message };
    } catch (error) {
      console.error('Delete job error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Increment applicants count
export const incrementApplicants = createAsyncThunk(
  'jobs/incrementApplicants',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post(`/jobs/${jobId}/increment-applicants`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { jobId, total_applicants: response.data.total_applicants };
    } catch (error) {
      console.error('Increment applicants error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get job statistics for dashboard
export const getJobStats = createAsyncThunk(
  'jobs/getJobStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/jobs/stats/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get job stats error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Search jobs
export const searchJobs = createAsyncThunk(
  'jobs/searchJobs',
  async ({ searchTerm, filters = {} }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { search: searchTerm, ...filters };
      const response = await api.get('/freelancer/jobs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Search jobs error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== NEW JOB PROGRESS & UPDATES ACTIONS ====================

// Update job progress
export const updateJobProgress = createAsyncThunk(
  'jobs/updateJobProgress',
  async ({ jobId, progress, notes }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/jobs/${jobId}/progress`, 
        { progress, notes },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Update job progress error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Add job update with files
export const addJobUpdate = createAsyncThunk(
  'jobs/addJobUpdate',
  async ({ jobId, formData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/jobs/${jobId}/updates`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Add job update error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update a specific job update
export const updateJobUpdate = createAsyncThunk(
  'jobs/updateJobUpdate',
  async ({ jobId, updateId, data }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/jobs/${jobId}/updates/${updateId}`, 
        data,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Update job update error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete a job update
export const deleteJobUpdate = createAsyncThunk(
  'jobs/deleteJobUpdate',
  async ({ jobId, updateId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/jobs/${jobId}/updates/${updateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Delete job update error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Upload attachments to a job
export const uploadJobAttachments = createAsyncThunk(
  'jobs/uploadJobAttachments',
  async ({ jobId, formData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/jobs/${jobId}/attachments`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Upload attachments error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete an attachment
export const deleteJobAttachment = createAsyncThunk(
  'jobs/deleteJobAttachment',
  async ({ jobId, attachmentId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/jobs/${jobId}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Delete attachment error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get job progress and updates
export const getJobProgress = createAsyncThunk(
  'jobs/getJobProgress',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/jobs/${jobId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get job progress error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Initial state
const initialState = {
  jobs: {
    list: [],
    selectedJob: null,
    clientJobs: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
  },
  insights: {
    data: null,
    isLoading: false,
    error: null,
  },
  stats: {
    totalJobs: 0,
    openJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    totalApplicants: 0,
    jobsByType: {},
    isLoading: false,
    error: null,
  },
  filters: {
    job_type: null,
    work_setup: null,
    experience_level: null,
    budget_type: null,
    min_budget: null,
    max_budget: null,
    skills: null,
    urgency_level: null,
    city: null,
    specific_area: null,
    min_experience: null,
    degree_required: null,
  },
  createJobSuccess: false,
  updateJobSuccess: false,
  deleteJobSuccess: false,
};

// Job slice
const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearJobError: (state) => {
      state.jobs.error = null;
      state.stats.error = null;
      state.insights.error = null;
    },
    clearJobSuccess: (state) => {
      state.createJobSuccess = false;
      state.updateJobSuccess = false;
      state.deleteJobSuccess = false;
    },
    setSelectedJob: (state, action) => {
      state.jobs.selectedJob = action.payload;
    },
    clearSelectedJob: (state) => {
      state.jobs.selectedJob = null;
      state.insights.data = null;
    },
    setJobFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearJobFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearJobs: (state) => {
      state.jobs.list = [];
      state.jobs.clientJobs = [];
      state.jobs.selectedJob = null;
      state.jobs.totalCount = 0;
      state.jobs.totalPages = 1;
      state.jobs.currentPage = 1;
    },
    clearInsights: (state) => {
      state.insights.data = null;
      state.insights.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
        state.createJobSuccess = false;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        state.createJobSuccess = true;
        if (state.jobs.clientJobs) {
          state.jobs.clientJobs.unshift(action.payload.job);
        }
        state.jobs.list.unshift(action.payload.job);
        state.jobs.totalCount += 1;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
        state.createJobSuccess = false;
      })
      
      // Get Client Jobs
      .addCase(getClientJobs.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(getClientJobs.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.clientJobs = action.payload.jobs;
        state.jobs.totalCount = action.payload.totalJobs;
        state.jobs.totalPages = action.payload.totalPages;
        state.jobs.currentPage = action.payload.currentPage;
      })
      .addCase(getClientJobs.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })
      
      // Get Freelancer Jobs
      .addCase(getFreelancerJobs.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(getFreelancerJobs.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.list = action.payload.jobs;
        state.jobs.totalCount = action.payload.totalJobs;
        state.jobs.totalPages = action.payload.totalPages;
        state.jobs.currentPage = action.payload.currentPage;
      })
      .addCase(getFreelancerJobs.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })
      
      // Get Job By ID
      .addCase(getJobById.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(getJobById.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.selectedJob = action.payload.job;
      })
      .addCase(getJobById.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })
      
      // Get Job Insights (NEW)
      .addCase(getJobInsights.pending, (state) => {
        state.insights.isLoading = true;
        state.insights.error = null;
      })
      .addCase(getJobInsights.fulfilled, (state, action) => {
        state.insights.isLoading = false;
        state.insights.data = action.payload.insights;
      })
      .addCase(getJobInsights.rejected, (state, action) => {
        state.insights.isLoading = false;
        state.insights.error = action.payload;
      })
      
      // Update Job
      .addCase(updateJob.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
        state.updateJobSuccess = false;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        state.updateJobSuccess = true;
        state.jobs.selectedJob = action.payload.job;
        
        const updateJobInList = (jobList) => {
          const index = jobList.findIndex(job => job._id === action.payload.job._id);
          if (index !== -1) {
            jobList[index] = action.payload.job;
          }
        };
        
        updateJobInList(state.jobs.list);
        updateJobInList(state.jobs.clientJobs);
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
        state.updateJobSuccess = false;
      })
      
      // Update Job Status
      .addCase(updateJobStatus.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(updateJobStatus.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.selectedJob = action.payload.job;
        
        const updateStatusInList = (jobList) => {
          const job = jobList.find(j => j._id === action.payload.job._id);
          if (job) {
            job.status = action.payload.job.status;
          }
        };
        
        updateStatusInList(state.jobs.list);
        updateStatusInList(state.jobs.clientJobs);
      })
      .addCase(updateJobStatus.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })
      
      // Delete Job
      .addCase(deleteJob.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
        state.deleteJobSuccess = false;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        state.deleteJobSuccess = true;
        
        state.jobs.list = state.jobs.list.filter(job => job._id !== action.payload.jobId);
        state.jobs.clientJobs = state.jobs.clientJobs.filter(job => job._id !== action.payload.jobId);
        
        if (state.jobs.selectedJob?._id === action.payload.jobId) {
          state.jobs.selectedJob = null;
        }
        
        state.jobs.totalCount -= 1;
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
        state.deleteJobSuccess = false;
      })
      
      // Increment Applicants
      .addCase(incrementApplicants.fulfilled, (state, action) => {
        const updateApplicantsInList = (jobList) => {
          const job = jobList.find(j => j._id === action.payload.jobId);
          if (job) {
            job.total_applicants = action.payload.total_applicants;
          }
        };
        
        updateApplicantsInList(state.jobs.list);
        updateApplicantsInList(state.jobs.clientJobs);
        
        if (state.jobs.selectedJob?._id === action.payload.jobId) {
          state.jobs.selectedJob.total_applicants = action.payload.total_applicants;
        }
      })
      
      // Get Job Stats
      .addCase(getJobStats.pending, (state) => {
        state.stats.isLoading = true;
        state.stats.error = null;
      })
      .addCase(getJobStats.fulfilled, (state, action) => {
        state.stats.isLoading = false;
        state.stats.totalJobs = action.payload.totalJobs || 0;
        state.stats.openJobs = action.payload.openJobs || 0;
        state.stats.inProgressJobs = action.payload.inProgressJobs || 0;
        state.stats.completedJobs = action.payload.completedJobs || 0;
        state.stats.cancelledJobs = action.payload.cancelledJobs || 0;
        state.stats.totalApplicants = action.payload.totalApplicants || 0;
        state.stats.jobsByType = action.payload.jobsByType || {};
      })
      .addCase(getJobStats.rejected, (state, action) => {
        state.stats.isLoading = false;
        state.stats.error = action.payload;
      })
      
      // Search Jobs
      .addCase(searchJobs.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(searchJobs.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.list = action.payload.jobs;
        state.jobs.totalCount = action.payload.totalJobs;
        state.jobs.totalPages = action.payload.totalPages;
        state.jobs.currentPage = action.payload.currentPage;
      })
      .addCase(searchJobs.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })

      // ==================== NEW JOB PROGRESS & UPDATES REDUCERS ====================
      
      // Update Job Progress
      .addCase(updateJobProgress.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(updateJobProgress.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        if (state.jobs.selectedJob?._id === action.payload.job._id) {
          state.jobs.selectedJob = action.payload.job;
        }
        // Update in lists
        const updateJobInList = (jobList) => {
          const index = jobList.findIndex(job => job._id === action.payload.job._id);
          if (index !== -1) {
            jobList[index] = action.payload.job;
          }
        };
        updateJobInList(state.jobs.list);
        updateJobInList(state.jobs.clientJobs);
      })
      .addCase(updateJobProgress.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })
      
      // Add Job Update
      .addCase(addJobUpdate.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(addJobUpdate.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        if (state.jobs.selectedJob?._id === action.payload.job._id) {
          state.jobs.selectedJob = action.payload.job;
        }
        // Update in lists
        const updateJobInList = (jobList) => {
          const index = jobList.findIndex(job => job._id === action.payload.job._id);
          if (index !== -1) {
            jobList[index] = action.payload.job;
          }
        };
        updateJobInList(state.jobs.list);
        updateJobInList(state.jobs.clientJobs);
      })
      .addCase(addJobUpdate.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })
      
      // Update Job Update
      .addCase(updateJobUpdate.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(updateJobUpdate.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        if (state.jobs.selectedJob?._id === action.payload.job._id) {
          state.jobs.selectedJob = action.payload.job;
        }
        // Update in lists
        const updateJobInList = (jobList) => {
          const index = jobList.findIndex(job => job._id === action.payload.job._id);
          if (index !== -1) {
            jobList[index] = action.payload.job;
          }
        };
        updateJobInList(state.jobs.list);
        updateJobInList(state.jobs.clientJobs);
      })
      .addCase(updateJobUpdate.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })
      
      // Delete Job Update
      .addCase(deleteJobUpdate.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(deleteJobUpdate.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        if (state.jobs.selectedJob?._id === action.payload.job._id) {
          state.jobs.selectedJob = action.payload.job;
        }
        // Update in lists
        const updateJobInList = (jobList) => {
          const index = jobList.findIndex(job => job._id === action.payload.job._id);
          if (index !== -1) {
            jobList[index] = action.payload.job;
          }
        };
        updateJobInList(state.jobs.list);
        updateJobInList(state.jobs.clientJobs);
      })
      .addCase(deleteJobUpdate.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })
      
      // Upload Job Attachments
      .addCase(uploadJobAttachments.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(uploadJobAttachments.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        if (state.jobs.selectedJob?._id === action.payload.job._id) {
          state.jobs.selectedJob = action.payload.job;
        }
        // Update in lists
        const updateJobInList = (jobList) => {
          const index = jobList.findIndex(job => job._id === action.payload.job._id);
          if (index !== -1) {
            jobList[index] = action.payload.job;
          }
        };
        updateJobInList(state.jobs.list);
        updateJobInList(state.jobs.clientJobs);
      })
      .addCase(uploadJobAttachments.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })
      
      // Delete Job Attachment
      .addCase(deleteJobAttachment.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(deleteJobAttachment.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        if (state.jobs.selectedJob?._id === action.payload.job._id) {
          state.jobs.selectedJob = action.payload.job;
        }
        // Update in lists
        const updateJobInList = (jobList) => {
          const index = jobList.findIndex(job => job._id === action.payload.job._id);
          if (index !== -1) {
            jobList[index] = action.payload.job;
          }
        };
        updateJobInList(state.jobs.list);
        updateJobInList(state.jobs.clientJobs);
      })
      .addCase(deleteJobAttachment.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      })
      
      // Get Job Progress
      .addCase(getJobProgress.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(getJobProgress.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        if (state.jobs.selectedJob) {
          state.jobs.selectedJob.progress = action.payload.progress;
          state.jobs.selectedJob.updates = action.payload.updates;
          state.jobs.selectedJob.attachments = action.payload.attachments;
          state.jobs.selectedJob.status = action.payload.status;
        }
      })
      .addCase(getJobProgress.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
      });
  },
});

// Export actions
export const {
  clearJobError,
  clearJobSuccess,
  setSelectedJob,
  clearSelectedJob,
  setJobFilters,
  clearJobFilters,
  clearJobs,
  clearInsights,
} = jobSlice.actions;

// Export selectors
export const selectAllJobs = (state) => state.jobs.jobs.list;
export const selectClientJobs = (state) => state.jobs.jobs.clientJobs;
export const selectSelectedJob = (state) => state.jobs.jobs.selectedJob;
export const selectJobsLoading = (state) => state.jobs.jobs.isLoading;
export const selectJobsError = (state) => state.jobs.jobs.error;
export const selectJobsTotalCount = (state) => state.jobs.jobs.totalCount;
export const selectJobStats = (state) => state.jobs.stats;
export const selectJobFilters = (state) => state.jobs.filters;
export const selectJobInsights = (state) => state.jobs.insights;

export default jobSlice.reducer;