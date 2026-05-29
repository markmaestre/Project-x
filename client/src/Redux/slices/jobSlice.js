// store/slices/jobSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Helper function to create FormData for job posting with arrays
const createJobFormData = (jobData) => {
  const formData = new FormData();
  
  Object.keys(jobData).forEach(key => {
    if (jobData[key] !== null && jobData[key] !== undefined && jobData[key] !== '') {
      if (key === 'required_skills' && Array.isArray(jobData[key]) && jobData[key].length > 0) {
        formData.append(key, JSON.stringify(jobData[key]));
      } else if (typeof jobData[key] === 'object' && !(jobData[key] instanceof File)) {
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

      let response;
      
      // Use '/jobs' because baseURL already includes '/api'
      const endpoint = '/jobs';
      
      if (jobData.required_skills && Array.isArray(jobData.required_skills) && jobData.required_skills.length > 0) {
        const formData = createJobFormData(jobData);
        response = await api.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
        });
      } else {
        response = await api.post(endpoint, jobData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
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

// Update job (Client only)
export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ jobId, jobData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      let response;
      
      if (jobData.required_skills && Array.isArray(jobData.required_skills)) {
        const formData = createJobFormData(jobData);
        response = await api.put(`/jobs/${jobId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
        });
      } else {
        response = await api.put(`/jobs/${jobId}`, jobData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
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

// Increment applicants count (when freelancer applies)
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

// Search jobs (for freelancers)
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
  stats: {
    totalJobs: 0,
    openJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    totalApplicants: 0,
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

export default jobSlice.reducer;