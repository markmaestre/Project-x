// Redux/slices/jobSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ==================== HELPER FUNCTIONS ====================

const createJobFormData = (jobData) => {
  const formData = new FormData();
  
  const mappedData = {
    title: jobData.title,
    description: jobData.description,
    category: jobData.category,
    subcategory: jobData.subcategory || null,
    required_skills: JSON.stringify(jobData.required_skills || []),
    tags: JSON.stringify(jobData.tags || []),
    job_type: jobData.job_type || 'project',
    work_setup: jobData.work_setup || 'remote',
    experience_level: jobData.experience_level || 'entry',
    vacancies: jobData.vacancies || 1,
    timezone: jobData.timezone || 'Asia/Manila',
    
    budget_type: jobData.budget_type || 'fixed',
    budget_min: jobData.budget_min || 0,
    budget_max: jobData.budget_max || null,
    budget_currency: jobData.budget_currency || 'PHP',
    budget_negotiable: jobData.budget_negotiable ? 'true' : 'false',
    hide_budget: jobData.hide_budget ? 'true' : 'false',
    
    duration_value: jobData.duration_value || 1,
    duration_unit: jobData.duration_unit || 'weeks',
    estimated_hours: jobData.estimated_hours || null,
    weekly_limit: jobData.weekly_limit || null,
    start_date: jobData.start_date || null,
    end_date: jobData.end_date || null,
    
    max_applicants: jobData.max_applicants || 100,
    auto_accept: jobData.auto_accept ? 'true' : 'false',
    allow_multiple_hires: jobData.allow_multiple_hires ? 'true' : 'false',
    
    visibility: jobData.visibility || 'public',
    featured: jobData.featured ? 'true' : 'false',
    urgent: jobData.urgent ? 'true' : 'false',
    nda_required: jobData.nda_required ? 'true' : 'false',
    
    application_deadline: jobData.application_deadline || null,
  };

  Object.keys(mappedData).forEach(key => {
    const value = mappedData[key];
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  const nestedObjects = ['location', 'requirements', 'screening_questions'];
  nestedObjects.forEach(key => {
    if (jobData[key]) {
      if (key === 'screening_questions' && Array.isArray(jobData[key])) {
        const formattedQuestions = jobData[key].map(q => ({
          question: typeof q === 'string' ? q : q.question,
          required: typeof q === 'object' ? q.required !== false : true
        }));
        formData.append(key, JSON.stringify(formattedQuestions));
      } else {
        formData.append(key, JSON.stringify(jobData[key]));
      }
    }
  });

  if (jobData.attachments && Array.isArray(jobData.attachments)) {
    jobData.attachments.forEach((attachment, index) => {
      if (attachment instanceof File) {
        formData.append(`attachments[${index}]`, attachment);
      } else if (typeof attachment === 'object' && attachment.file) {
        formData.append(`attachments[${index}]`, attachment.file);
      }
    });
  }

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
      
      console.log('=== SENDING JOB DATA ===');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await api.post('/jobs', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
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

// Get job insights
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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
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

// Delete job (Soft delete - Client only)
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

// Increment job view count
export const incrementJobView = createAsyncThunk(
  'jobs/incrementJobView',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post(`/jobs/${jobId}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { jobId };
    } catch (error) {
      console.error('Increment view error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== NEW: Increment job save count ====================
export const incrementJobSave = createAsyncThunk(
  'jobs/incrementJobSave',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post(`/jobs/${jobId}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { jobId };
    } catch (error) {
      console.error('Increment save error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== NEW: Increment job application count ====================
export const incrementJobApplication = createAsyncThunk(
  'jobs/incrementJobApplication',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post(`/jobs/${jobId}/application`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { jobId };
    } catch (error) {
      console.error('Increment application error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Search jobs (uses the same endpoint as getFreelancerJobs)
export const searchJobs = createAsyncThunk(
  'jobs/searchJobs',
  async ({ searchTerm, filters = {} }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { 
        search: searchTerm, 
        ...filters,
        sort_by: filters.sort_by || 'recent'
      };
      
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

// Get job progress
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

// ==================== INITIAL STATE ====================

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
    inReviewJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    pausedJobs: 0,
    totalApplicants: 0,
    totalViews: 0,
    totalSaves: 0,
    jobsByType: {},
    jobsByCategory: {},
    isLoading: false,
    error: null,
  },
  progress: {
    data: null,
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
    search: null,
    category: null,
    subcategory: null,
    city: null,
    province: null,
    country: null,
    sort_by: 'recent',
  },
  createJobSuccess: false,
  updateJobSuccess: false,
  deleteJobSuccess: false,
  viewIncrementSuccess: false,
};

// ==================== SLICE ====================

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearJobError: (state) => {
      state.jobs.error = null;
      state.stats.error = null;
      state.insights.error = null;
      state.progress.error = null;
    },
    clearJobSuccess: (state) => {
      state.createJobSuccess = false;
      state.updateJobSuccess = false;
      state.deleteJobSuccess = false;
      state.viewIncrementSuccess = false;
    },
    setSelectedJob: (state, action) => {
      state.jobs.selectedJob = action.payload;
    },
    clearSelectedJob: (state) => {
      state.jobs.selectedJob = null;
      state.insights.data = null;
      state.progress.data = null;
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
    clearProgress: (state) => {
      state.progress.data = null;
      state.progress.error = null;
    },
    updateJobInList: (state, action) => {
      const { jobId, updates } = action.payload;
      
      const listIndex = state.jobs.list.findIndex(job => job._id === jobId);
      if (listIndex !== -1) {
        state.jobs.list[listIndex] = { ...state.jobs.list[listIndex], ...updates };
      }
      
      const clientIndex = state.jobs.clientJobs.findIndex(job => job._id === jobId);
      if (clientIndex !== -1) {
        state.jobs.clientJobs[clientIndex] = { ...state.jobs.clientJobs[clientIndex], ...updates };
      }
      
      if (state.jobs.selectedJob?._id === jobId) {
        state.jobs.selectedJob = { ...state.jobs.selectedJob, ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE JOB
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
      
      // GET CLIENT JOBS
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
      
      // GET FREELANCER JOBS
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
      
      // GET JOB BY ID
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
      
      // GET JOB INSIGHTS
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
      
      // UPDATE JOB
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
      
      // UPDATE JOB STATUS
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
      
      // DELETE JOB
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
      
      // GET JOB STATS
      .addCase(getJobStats.pending, (state) => {
        state.stats.isLoading = true;
        state.stats.error = null;
      })
      .addCase(getJobStats.fulfilled, (state, action) => {
        state.stats.isLoading = false;
        state.stats.totalJobs = action.payload.totalJobs || 0;
        state.stats.openJobs = action.payload.openJobs || 0;
        state.stats.inReviewJobs = action.payload.inReviewJobs || 0;
        state.stats.inProgressJobs = action.payload.inProgressJobs || 0;
        state.stats.completedJobs = action.payload.completedJobs || 0;
        state.stats.cancelledJobs = action.payload.cancelledJobs || 0;
        state.stats.pausedJobs = action.payload.pausedJobs || 0;
        state.stats.totalApplicants = action.payload.totalApplicants || 0;
        state.stats.totalViews = action.payload.totalViews || 0;
        state.stats.totalSaves = action.payload.totalSaves || 0;
        state.stats.jobsByType = action.payload.jobsByType || {};
        state.stats.jobsByCategory = action.payload.jobsByCategory || {};
      })
      .addCase(getJobStats.rejected, (state, action) => {
        state.stats.isLoading = false;
        state.stats.error = action.payload;
      })
      
      // INCREMENT JOB VIEW
      .addCase(incrementJobView.fulfilled, (state, action) => {
        state.viewIncrementSuccess = true;
        if (state.jobs.selectedJob?._id === action.payload.jobId) {
          state.jobs.selectedJob.analytics = {
            ...state.jobs.selectedJob.analytics,
            views: (state.jobs.selectedJob.analytics?.views || 0) + 1
          };
        }
      })
      
      // ==================== NEW: INCREMENT JOB SAVE ====================
      .addCase(incrementJobSave.fulfilled, (state, action) => {
        if (state.jobs.selectedJob?._id === action.payload.jobId) {
          state.jobs.selectedJob.analytics = {
            ...state.jobs.selectedJob.analytics,
            saves: (state.jobs.selectedJob.analytics?.saves || 0) + 1
          };
        }
      })
      
      // ==================== NEW: INCREMENT JOB APPLICATION ====================
      .addCase(incrementJobApplication.fulfilled, (state, action) => {
        if (state.jobs.selectedJob?._id === action.payload.jobId) {
          state.jobs.selectedJob.analytics = {
            ...state.jobs.selectedJob.analytics,
            applications: (state.jobs.selectedJob.analytics?.applications || 0) + 1
          };
        }
      })
      
      // SEARCH JOBS
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

      // UPDATE JOB PROGRESS
      .addCase(updateJobProgress.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(updateJobProgress.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        if (state.jobs.selectedJob?._id === action.payload.job._id) {
          state.jobs.selectedJob = action.payload.job;
        }
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
      
      // GET JOB PROGRESS
      .addCase(getJobProgress.pending, (state) => {
        state.progress.isLoading = true;
        state.progress.error = null;
      })
      .addCase(getJobProgress.fulfilled, (state, action) => {
        state.progress.isLoading = false;
        state.progress.data = action.payload;
        if (state.jobs.selectedJob) {
          state.jobs.selectedJob.progress = action.payload.progress;
          state.jobs.selectedJob.status = action.payload.status;
          state.jobs.selectedJob.assigned_freelancer_id = action.payload.assigned_freelancer_id;
        }
      })
      .addCase(getJobProgress.rejected, (state, action) => {
        state.progress.isLoading = false;
        state.progress.error = action.payload;
      });
  },
});

// ==================== EXPORT ACTIONS ====================

export const {
  clearJobError,
  clearJobSuccess,
  setSelectedJob,
  clearSelectedJob,
  setJobFilters,
  clearJobFilters,
  clearJobs,
  clearInsights,
  clearProgress,
  updateJobInList,
} = jobSlice.actions;

// ==================== SELECTORS ====================

export const selectAllJobs = (state) => state.jobs.jobs.list;
export const selectClientJobs = (state) => state.jobs.jobs.clientJobs;
export const selectSelectedJob = (state) => state.jobs.jobs.selectedJob;
export const selectJobsLoading = (state) => state.jobs.jobs.isLoading;
export const selectJobsError = (state) => state.jobs.jobs.error;
export const selectJobsTotalCount = (state) => state.jobs.jobs.totalCount;
export const selectJobsTotalPages = (state) => state.jobs.jobs.totalPages;
export const selectJobsCurrentPage = (state) => state.jobs.jobs.currentPage;
export const selectJobStats = (state) => state.jobs.stats;
export const selectJobFilters = (state) => state.jobs.filters;
export const selectJobInsights = (state) => state.jobs.insights;
export const selectJobProgress = (state) => state.jobs.progress;
export const selectCreateJobSuccess = (state) => state.jobs.createJobSuccess;
export const selectUpdateJobSuccess = (state) => state.jobs.updateJobSuccess;
export const selectDeleteJobSuccess = (state) => state.jobs.deleteJobSuccess;
export const selectViewIncrementSuccess = (state) => state.jobs.viewIncrementSuccess;

export const selectJobById = (state, jobId) => {
  return state.jobs.jobs.list.find(job => job._id === jobId) || 
         state.jobs.jobs.clientJobs.find(job => job._id === jobId);
};

export const selectJobsByStatus = (state, status) => {
  return state.jobs.jobs.list.filter(job => job.status === status);
};

export const selectJobsByCategory = (state, category) => {
  return state.jobs.jobs.list.filter(job => job.category === category);
};

export default jobSlice.reducer;