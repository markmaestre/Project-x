// Redux/slices/jobSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ==================== HELPER FUNCTIONS ====================

const createJobFormData = (jobData) => {
  const formData = new FormData();
  
  // Map frontend field names to backend expected field names
  const mappedData = {
    title: jobData.title,
    description: jobData.description,
    category: jobData.category,
    subcategory: jobData.subcategory || '',
    required_skills: JSON.stringify(jobData.required_skills || []),
    tags: JSON.stringify(jobData.tags || []),
    job_type: jobData.job_type || 'project',
    work_setup: jobData.work_setup || 'remote',
    experience_level: jobData.experience_level || 'entry',
    vacancies: jobData.vacancies || 1,
    timezone: jobData.timezone || 'Asia/Manila',
    contact_preference: jobData.contact_preference || 'chat',
    
    // Budget fields - match backend expected names
    budget_type: jobData.budget_type || 'fixed',
    budget_min: jobData.budget_min !== undefined && jobData.budget_min !== null ? jobData.budget_min : 0,
    budget_max: jobData.budget_max !== undefined && jobData.budget_max !== null ? jobData.budget_max : '',
    budget_currency: jobData.budget_currency || 'PHP',
    budget_negotiable: jobData.budget_negotiable ? 'true' : 'false',
    hide_budget: jobData.hide_budget ? 'true' : 'false',
    
    // Timeline fields
    duration_value: jobData.duration_value || 1,
    duration_unit: jobData.duration_unit || 'weeks',
    estimated_hours: jobData.estimated_hours || '',
    weekly_limit: jobData.weekly_limit || '',
    start_date: jobData.start_date || '',
    end_date: jobData.end_date || '',
    
    // Hiring settings
    max_applicants: jobData.max_applicants || 100,
    auto_accept: jobData.auto_accept ? 'true' : 'false',
    allow_multiple_hires: jobData.allow_multiple_hires ? 'true' : 'false',
    
    // Visibility and features
    visibility: jobData.visibility || 'public',
    featured: jobData.featured ? 'true' : 'false',
    urgent: jobData.urgent ? 'true' : 'false',
    nda_required: jobData.nda_required ? 'true' : 'false',
    
    // Deadline
    application_deadline: jobData.application_deadline || '',
  };

  // Append all mapped fields
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

  // ===== HANDLE LOCATION =====
  if (jobData.location) {
    const location = typeof jobData.location === 'object' 
      ? jobData.location 
      : JSON.parse(jobData.location);
    
    const locationData = {
      country: location.country || 'Philippines',
      province: location.province || '',
      city: location.city || '',
      address: location.address || '',
      zip_code: location.zip_code || ''
    };
    formData.append('location', JSON.stringify(locationData));
  }

  // ===== HANDLE REQUIREMENTS =====
  if (jobData.requirements) {
    const requirements = typeof jobData.requirements === 'object'
      ? jobData.requirements
      : JSON.parse(jobData.requirements);
    
    const requirementsData = {
      education: requirements.education || 'none',
      portfolio_required: requirements.portfolio_required || false,
      resume_required: requirements.resume_required || false,
      cover_letter_required: requirements.cover_letter_required || false,
      preferred_languages: requirements.preferred_languages || [],
      preferred_certifications: requirements.preferred_certifications || [],
      min_years: requirements.min_years || 0
    };
    formData.append('requirements', JSON.stringify(requirementsData));
  }

  // ===== HANDLE SCREENING QUESTIONS =====
  if (jobData.screening_questions && Array.isArray(jobData.screening_questions)) {
    const formattedQuestions = jobData.screening_questions.map(q => {
      if (typeof q === 'string') {
        return { question: q, required: true };
      }
      return {
        question: q.question || '',
        required: q.required !== undefined ? q.required : true
      };
    });
    formData.append('screening_questions', JSON.stringify(formattedQuestions));
  }

  // ===== HANDLE ATTACHMENTS =====
  if (jobData.attachments && Array.isArray(jobData.attachments)) {
    jobData.attachments.forEach((attachment, index) => {
      if (attachment instanceof File) {
        formData.append(`attachments[${index}]`, attachment);
      } else if (attachment && typeof attachment === 'object' && attachment.file) {
        formData.append(`attachments[${index}]`, attachment.file);
      } else if (typeof attachment === 'string') {
        // If it's a URL string
        formData.append(`attachments[${index}]`, attachment);
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
  async ({ status, page = 1, limit = 100 } = {}, { getState, rejectWithValue }) => {
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
      
      console.log('=== CLIENT JOBS RESPONSE ===');
      console.log('Total jobs:', response.data.totalJobs);
      console.log('Jobs count:', response.data.jobs?.length || 0);
      
      return response.data;
    } catch (error) {
      console.error('Get client jobs error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get all open jobs for freelancers with filters
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

// Check job availability for application
export const checkJobAvailability = createAsyncThunk(
  'jobs/checkJobAvailability',
  async (jobId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/jobs/${jobId}/check-availability`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Check job availability error:', error.response?.data);
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

// Increment job save count
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

// Increment job application count
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

// Search jobs
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
    jobsByStatus: {},
    urgentJobs: 0,
    featuredJobs: 0,
    ndaJobs: 0,
    expiredJobs: 0,
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
    show_urgent: null,
    show_featured: null,
    show_nda: null,
  },
  createJobSuccess: false,
  updateJobSuccess: false,
  deleteJobSuccess: false,
  viewIncrementSuccess: false,
  availability: {
    data: null,
    isLoading: false,
    error: null,
  },
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
      state.availability.error = null;
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
      state.availability.data = null;
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
    clearAvailability: (state) => {
      state.availability.data = null;
      state.availability.error = null;
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
        const jobs = action.payload.jobs || [];
        
        // Format each job to ensure all fields exist
        state.jobs.clientJobs = jobs.map(job => ({
          ...job,
          // Ensure nested objects exist with defaults
          budget: job.budget || { 
            type: 'fixed', 
            min: 0, 
            max: 0, 
            currency: 'PHP',
            negotiable: false,
            hide_budget: false
          },
          location: job.location || { 
            country: 'Philippines', 
            province: '', 
            city: '', 
            address: '', 
            zip_code: '' 
          },
          timeline: job.timeline || { 
            duration_value: 1, 
            duration_unit: 'weeks',
            start_date: null,
            end_date: null,
            estimated_hours: null,
            weekly_limit: null
          },
          requirements: job.requirements || { 
            education: 'none', 
            portfolio_required: false,
            resume_required: false,
            cover_letter_required: false,
            preferred_languages: [],
            preferred_certifications: [],
            min_years: 0
          },
          analytics: job.analytics || { views: 0, saves: 0, applications: 0 },
          hiring: job.hiring || { 
            max_applicants: 100, 
            auto_accept: false, 
            allow_multiple_hires: false 
          },
          required_skills: Array.isArray(job.required_skills) ? job.required_skills : [],
          tags: Array.isArray(job.tags) ? job.tags : [],
          screening_questions: Array.isArray(job.screening_questions) ? job.screening_questions : [],
          attachments: Array.isArray(job.attachments) ? job.attachments : [],
          is_deleted: job.is_deleted || false,
          featured: job.featured || false,
          urgent: job.urgent || false,
          nda_required: job.nda_required || false,
          vacancies: job.vacancies || 1,
          timezone: job.timezone || 'Asia/Manila',
          contact_preference: job.contact_preference || 'chat',
        }));
        
        state.jobs.totalCount = action.payload.totalJobs || jobs.length;
        state.jobs.totalPages = action.payload.totalPages || 1;
        state.jobs.currentPage = action.payload.currentPage || 1;
        state.jobs.error = null;
      })
      .addCase(getClientJobs.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
        state.jobs.clientJobs = [];
      })
      
      // GET FREELANCER JOBS
      .addCase(getFreelancerJobs.pending, (state) => {
        state.jobs.isLoading = true;
        state.jobs.error = null;
      })
      .addCase(getFreelancerJobs.fulfilled, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.list = action.payload.jobs || [];
        state.jobs.totalCount = action.payload.totalJobs || state.jobs.list.length;
        state.jobs.totalPages = action.payload.totalPages || 1;
        state.jobs.currentPage = action.payload.currentPage || 1;
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
      
      // CHECK JOB AVAILABILITY
      .addCase(checkJobAvailability.pending, (state) => {
        state.availability.isLoading = true;
        state.availability.error = null;
      })
      .addCase(checkJobAvailability.fulfilled, (state, action) => {
        state.availability.isLoading = false;
        state.availability.data = action.payload;
      })
      .addCase(checkJobAvailability.rejected, (state, action) => {
        state.availability.isLoading = false;
        state.availability.error = action.payload;
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
        
        state.jobs.totalCount = Math.max(0, state.jobs.totalCount - 1);
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
        state.stats.jobsByStatus = action.payload.jobsByStatus || {};
        state.stats.urgentJobs = action.payload.urgentJobs || 0;
        state.stats.featuredJobs = action.payload.featuredJobs || 0;
        state.stats.ndaJobs = action.payload.ndaJobs || 0;
        state.stats.expiredJobs = action.payload.expiredJobs || 0;
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
      
      // INCREMENT JOB SAVE
      .addCase(incrementJobSave.fulfilled, (state, action) => {
        if (state.jobs.selectedJob?._id === action.payload.jobId) {
          state.jobs.selectedJob.analytics = {
            ...state.jobs.selectedJob.analytics,
            saves: (state.jobs.selectedJob.analytics?.saves || 0) + 1
          };
        }
      })
      
      // INCREMENT JOB APPLICATION
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
        state.jobs.list = action.payload.jobs || [];
        state.jobs.totalCount = action.payload.totalJobs || state.jobs.list.length;
        state.jobs.totalPages = action.payload.totalPages || 1;
        state.jobs.currentPage = action.payload.currentPage || 1;
      })
      .addCase(searchJobs.rejected, (state, action) => {
        state.jobs.isLoading = false;
        state.jobs.error = action.payload;
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
  clearAvailability,
  updateJobInList,
} = jobSlice.actions;

// ==================== SELECTORS ====================

export const selectAllJobs = (state) => state.jobs.jobs.list || [];
export const selectClientJobs = (state) => state.jobs.jobs.clientJobs || [];
export const selectSelectedJob = (state) => state.jobs.jobs.selectedJob;
export const selectJobsLoading = (state) => state.jobs.jobs.isLoading;
export const selectJobsError = (state) => state.jobs.jobs.error;
export const selectJobsTotalCount = (state) => state.jobs.jobs.totalCount || 0;
export const selectJobsTotalPages = (state) => state.jobs.jobs.totalPages || 1;
export const selectJobsCurrentPage = (state) => state.jobs.jobs.currentPage || 1;
export const selectJobStats = (state) => state.jobs.stats;
export const selectJobFilters = (state) => state.jobs.filters;
export const selectJobInsights = (state) => state.jobs.insights;
export const selectJobProgress = (state) => state.jobs.progress;
export const selectCreateJobSuccess = (state) => state.jobs.createJobSuccess;
export const selectUpdateJobSuccess = (state) => state.jobs.updateJobSuccess;
export const selectDeleteJobSuccess = (state) => state.jobs.deleteJobSuccess;
export const selectViewIncrementSuccess = (state) => state.jobs.viewIncrementSuccess;
export const selectJobAvailability = (state) => state.jobs.availability;

// Enhanced selectors with proper error handling
export const selectJobById = (state, jobId) => {
  if (!jobId) return null;
  const list = state.jobs.jobs.list || [];
  const clientJobs = state.jobs.jobs.clientJobs || [];
  return list.find(job => job._id === jobId) || 
         clientJobs.find(job => job._id === jobId) ||
         null;
};

export const selectJobsByStatus = (state, status) => {
  const list = state.jobs.jobs.list || [];
  return list.filter(job => job.status === status);
};

export const selectJobsByCategory = (state, category) => {
  const list = state.jobs.jobs.list || [];
  return list.filter(job => job.category === category);
};

export const selectUrgentJobs = (state) => {
  const list = state.jobs.jobs.list || [];
  return list.filter(job => job.urgent === true);
};

export const selectFeaturedJobs = (state) => {
  const list = state.jobs.jobs.list || [];
  return list.filter(job => job.featured === true);
};

export const selectNDAJobs = (state) => {
  const list = state.jobs.jobs.list || [];
  return list.filter(job => job.nda_required === true);
};

export const selectOpenJobs = (state) => {
  const list = state.jobs.jobs.list || [];
  return list.filter(job => job.status === 'open');
};

export const selectExpiredJobs = (state) => {
  const list = state.jobs.jobs.list || [];
  const now = new Date();
  return list.filter(job => 
    job.status === 'open' && 
    job.application_deadline && 
    new Date(job.application_deadline) < now
  );
};

// Helper selector to get formatted jobs with all fields
export const selectFormattedClientJobs = (state) => {
  const jobs = state.jobs.jobs.clientJobs || [];
  return jobs.map(job => ({
    ...job,
    budget: job.budget || { type: 'fixed', min: 0, max: 0, currency: 'PHP', hide_budget: false },
    location: job.location || { city: '', province: '', country: 'Philippines', address: '', zip_code: '' },
    timeline: job.timeline || { duration_value: 1, duration_unit: 'weeks' },
    requirements: job.requirements || { 
      education: 'none', 
      portfolio_required: false,
      resume_required: false,
      cover_letter_required: false,
      preferred_languages: [],
      preferred_certifications: [],
      min_years: 0
    },
    analytics: job.analytics || { views: 0, saves: 0, applications: 0 },
    hiring: job.hiring || { max_applicants: 100, auto_accept: false, allow_multiple_hires: false },
    required_skills: Array.isArray(job.required_skills) ? job.required_skills : [],
    screening_questions: Array.isArray(job.screening_questions) ? job.screening_questions : [],
    featured: job.featured || false,
    urgent: job.urgent || false,
    nda_required: job.nda_required || false,
    vacancies: job.vacancies || 1,
    timezone: job.timezone || 'Asia/Manila',
    contact_preference: job.contact_preference || 'chat',
    // Computed fields
    is_expired: job.application_deadline ? new Date(job.application_deadline) < new Date() : false,
    days_until_deadline: job.application_deadline ? 
      Math.ceil((new Date(job.application_deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null,
  }));
};

export default jobSlice.reducer;