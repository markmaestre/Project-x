// Redux/slices/projectUpdateSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ==================== HELPER FUNCTIONS ====================

const createUpdateFormData = (updateData) => {
  const formData = new FormData();
  
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== null && updateData[key] !== undefined && updateData[key] !== '') {
      if (key === 'attachments' && updateData[key] instanceof FileList) {
        for (let i = 0; i < updateData[key].length; i++) {
          formData.append('attachments', updateData[key][i]);
        }
      } else if (key === 'attachments' && Array.isArray(updateData[key])) {
        // Handle array of files
        updateData[key].forEach(file => {
          formData.append('attachments', file);
        });
      } else if (typeof updateData[key] === 'object' && !(updateData[key] instanceof File) && !(updateData[key] instanceof Date)) {
        formData.append(key, JSON.stringify(updateData[key]));
      } else if (updateData[key] instanceof Date) {
        formData.append(key, updateData[key].toISOString());
      } else if (typeof updateData[key] === 'boolean') {
        formData.append(key, updateData[key] ? 'true' : 'false');
      } else {
        formData.append(key, String(updateData[key]));
      }
    }
  });
  
  return formData;
};

// ==================== PROJECT UPDATE ACTIONS ====================

// Create a new project update
export const createProjectUpdate = createAsyncThunk(
  'projectUpdates/createProjectUpdate',
  async (updateData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      // Map frontend field names to backend expected field names
      const payload = {
        contract_id: updateData.contract_id || updateData.contractId,
        job_id: updateData.job_id || updateData.jobId,
        client_id: updateData.client_id || updateData.clientId,
        freelancer_id: updateData.freelancer_id || updateData.freelancerId,
        title: updateData.title,
        description: updateData.description || '',
        update_type: updateData.update_type || updateData.updateType || 'progress',
        status: updateData.status || 'pending',
        delivery_status: updateData.delivery_status || updateData.deliveryStatus || 'not_submitted',
        progress: updateData.progress || 0,
        priority: updateData.priority || 'normal',
        freelancer_comment: updateData.freelancer_comment || updateData.freelancerComment || null,
        client_comment: updateData.client_comment || updateData.clientComment || null,
        due_date: updateData.due_date || updateData.dueDate || null,
        completed_at: updateData.completed_at || updateData.completedAt || null,
        created_by: updateData.created_by || updateData.createdBy || updateData.client_id || updateData.clientId,
        created_by_role: updateData.created_by_role || updateData.createdByRole || 'client',
        last_updated_by: updateData.last_updated_by || updateData.lastUpdatedBy || null,
      };

      // Remove undefined or null values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
      });

      console.log('Creating project update with payload:', payload);

      const response = await api.post('/project-updates', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Create project update error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Create project update with file attachments (multipart/form-data)
export const createProjectUpdateWithFiles = createAsyncThunk(
  'projectUpdates/createProjectUpdateWithFiles',
  async ({ updateData, files }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const formData = new FormData();
      
      // Add all fields to formData
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== null && updateData[key] !== undefined && updateData[key] !== '') {
          if (typeof updateData[key] === 'object' && !(updateData[key] instanceof Date)) {
            formData.append(key, JSON.stringify(updateData[key]));
          } else if (updateData[key] instanceof Date) {
            formData.append(key, updateData[key].toISOString());
          } else {
            formData.append(key, String(updateData[key]));
          }
        }
      });

      // Add files
      if (files && files.length > 0) {
        files.forEach(file => {
          formData.append('attachments', file);
        });
      }

      const response = await api.post('/project-updates', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      return response.data;
    } catch (error) {
      console.error('Create project update with files error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get updates for a contract
export const getContractUpdates = createAsyncThunk(
  'projectUpdates/getContractUpdates',
  async ({ contractId, status, update_type, page = 1, limit = 20 }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { page, limit };
      if (status) params.status = status;
      if (update_type) params.update_type = update_type;

      const response = await api.get(`/contracts/${contractId}/updates`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Get contract updates error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get updates for a job
export const getJobUpdates = createAsyncThunk(
  'projectUpdates/getJobUpdates',
  async ({ jobId, page = 1, limit = 20 }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/jobs/${jobId}/updates`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get job updates error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get freelancer's updates
export const getFreelancerUpdates = createAsyncThunk(
  'projectUpdates/getFreelancerUpdates',
  async ({ status, page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { page, limit };
      if (status) params.status = status;

      const response = await api.get('/freelancer/updates', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Get freelancer updates error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get client's updates
export const getClientUpdates = createAsyncThunk(
  'projectUpdates/getClientUpdates',
  async ({ status, page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { page, limit };
      if (status) params.status = status;

      const response = await api.get('/client/updates', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Get client updates error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get single project update by ID
export const getProjectUpdateById = createAsyncThunk(
  'projectUpdates/getProjectUpdateById',
  async (updateId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/project-updates/${updateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get project update by ID error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update project update
export const updateProjectUpdate = createAsyncThunk(
  'projectUpdates/updateProjectUpdate',
  async ({ updateId, updateData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const formData = createUpdateFormData(updateData);
      const response = await api.put(`/project-updates/${updateId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Update project update error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update project update status
export const updateProjectUpdateStatus = createAsyncThunk(
  'projectUpdates/updateProjectUpdateStatus',
  async ({ updateId, status, comment }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const payload = { status };
      if (comment) payload.comment = comment;

      const response = await api.patch(`/project-updates/${updateId}/status`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Update project update status error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update delivery status
export const updateDeliveryStatus = createAsyncThunk(
  'projectUpdates/updateDeliveryStatus',
  async ({ updateId, delivery_status, comment }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const payload = { delivery_status };
      if (comment) payload.comment = comment;

      const response = await api.patch(`/project-updates/${updateId}/delivery`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Update delivery status error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Upload attachment to project update
export const uploadUpdateAttachment = createAsyncThunk(
  'projectUpdates/uploadUpdateAttachment',
  async ({ updateId, file }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/project-updates/${updateId}/attachments`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      return response.data;
    } catch (error) {
      console.error('Upload attachment error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete attachment from project update
export const deleteUpdateAttachment = createAsyncThunk(
  'projectUpdates/deleteUpdateAttachment',
  async ({ updateId, attachmentId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/project-updates/${updateId}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { updateId, attachmentId, ...response.data };
    } catch (error) {
      console.error('Delete attachment error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Add comment to project update
export const addUpdateComment = createAsyncThunk(
  'projectUpdates/addUpdateComment',
  async ({ updateId, comment }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post(`/project-updates/${updateId}/comments`, 
        { comment },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Add comment error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get project update statistics
export const getProjectUpdateStats = createAsyncThunk(
  'projectUpdates/getProjectUpdateStats',
  async (contractId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/project-updates/stats/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { contractId, ...response.data };
    } catch (error) {
      console.error('Get project update stats error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get contract activity log
export const getContractActivityLog = createAsyncThunk(
  'projectUpdates/getContractActivityLog',
  async ({ contractId, limit = 20, skip = 0, type }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { limit, skip };
      if (type) params.type = type;

      const response = await api.get(`/contracts/${contractId}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return { contractId, ...response.data };
    } catch (error) {
      console.error('Get contract activity log error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  updates: {
    list: [],
    contractUpdates: [],
    jobUpdates: [],
    freelancerUpdates: [],
    clientUpdates: [],
    selectedUpdate: null,
    isLoading: false,
    error: null,
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
  },
  stats: {
    total: 0,
    completed: 0,
    inProgress: 0,
    blocked: 0,
    pending: 0,
    typeBreakdown: {},
    contractProgress: 0,
    isLoading: false,
    error: null,
  },
  activityLog: {
    items: [],
    total: 0,
    limit: 20,
    skip: 0,
    hasMore: false,
    types: [],
    isLoading: false,
    error: null,
  },
  createSuccess: false,
  updateSuccess: false,
  statusUpdateSuccess: false,
  deliveryUpdateSuccess: false,
  commentAdded: false,
  attachmentUploaded: false,
};

// ==================== SLICE ====================

const projectUpdateSlice = createSlice({
  name: 'projectUpdates',
  initialState,
  reducers: {
    clearUpdateError: (state) => {
      state.updates.error = null;
      state.stats.error = null;
      state.activityLog.error = null;
    },
    clearUpdateSuccess: (state) => {
      state.createSuccess = false;
      state.updateSuccess = false;
      state.statusUpdateSuccess = false;
      state.deliveryUpdateSuccess = false;
      state.commentAdded = false;
      state.attachmentUploaded = false;
    },
    setSelectedUpdate: (state, action) => {
      state.updates.selectedUpdate = action.payload;
    },
    clearSelectedUpdate: (state) => {
      state.updates.selectedUpdate = null;
    },
    clearUpdates: (state) => {
      state.updates.list = [];
      state.updates.contractUpdates = [];
      state.updates.jobUpdates = [];
      state.updates.freelancerUpdates = [];
      state.updates.clientUpdates = [];
      state.updates.selectedUpdate = null;
      state.updates.totalCount = 0;
      state.updates.totalPages = 1;
      state.updates.currentPage = 1;
    },
    clearStats: (state) => {
      state.stats.total = 0;
      state.stats.completed = 0;
      state.stats.inProgress = 0;
      state.stats.blocked = 0;
      state.stats.pending = 0;
      state.stats.typeBreakdown = {};
      state.stats.contractProgress = 0;
    },
    clearActivityLog: (state) => {
      state.activityLog.items = [];
      state.activityLog.total = 0;
      state.activityLog.hasMore = false;
      state.activityLog.types = [];
    },
    updateUpdateLocally: (state, action) => {
      const { updateId, updates } = action.payload;
      
      const updateList = (list) => {
        const index = list.findIndex(u => u._id === updateId);
        if (index !== -1) {
          list[index] = { ...list[index], ...updates };
        }
      };
      
      updateList(state.updates.list);
      updateList(state.updates.contractUpdates);
      updateList(state.updates.jobUpdates);
      updateList(state.updates.freelancerUpdates);
      updateList(state.updates.clientUpdates);
      
      if (state.updates.selectedUpdate?._id === updateId) {
        state.updates.selectedUpdate = { ...state.updates.selectedUpdate, ...updates };
      }
    },
    removeAttachmentLocally: (state, action) => {
      const { updateId, attachmentId } = action.payload;
      
      const removeFromList = (list) => {
        const update = list.find(u => u._id === updateId);
        if (update && update.attachments) {
          update.attachments = update.attachments.filter(a => a._id !== attachmentId);
        }
      };
      
      removeFromList(state.updates.list);
      removeFromList(state.updates.contractUpdates);
      removeFromList(state.updates.jobUpdates);
      removeFromList(state.updates.freelancerUpdates);
      removeFromList(state.updates.clientUpdates);
      
      if (state.updates.selectedUpdate?._id === updateId) {
        state.updates.selectedUpdate.attachments = 
          state.updates.selectedUpdate.attachments.filter(a => a._id !== attachmentId);
      }
    },
    addAttachmentLocally: (state, action) => {
      const { updateId, attachment } = action.payload;
      
      const addToList = (list) => {
        const update = list.find(u => u._id === updateId);
        if (update) {
          if (!update.attachments) update.attachments = [];
          update.attachments.push(attachment);
        }
      };
      
      addToList(state.updates.list);
      addToList(state.updates.contractUpdates);
      addToList(state.updates.jobUpdates);
      addToList(state.updates.freelancerUpdates);
      addToList(state.updates.clientUpdates);
      
      if (state.updates.selectedUpdate?._id === updateId) {
        if (!state.updates.selectedUpdate.attachments) {
          state.updates.selectedUpdate.attachments = [];
        }
        state.updates.selectedUpdate.attachments.push(attachment);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== CREATE PROJECT UPDATE ====================
      .addCase(createProjectUpdate.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
        state.createSuccess = false;
      })
      .addCase(createProjectUpdate.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.createSuccess = true;
        const update = action.payload.projectUpdate || action.payload;
        if (update) {
          state.updates.list.unshift(update);
          state.updates.contractUpdates.unshift(update);
          state.updates.totalCount += 1;
        }
      })
      .addCase(createProjectUpdate.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
        state.createSuccess = false;
      })
      
      // ==================== CREATE WITH FILES ====================
      .addCase(createProjectUpdateWithFiles.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
        state.createSuccess = false;
      })
      .addCase(createProjectUpdateWithFiles.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.createSuccess = true;
        const update = action.payload.projectUpdate || action.payload;
        if (update) {
          state.updates.list.unshift(update);
          state.updates.contractUpdates.unshift(update);
          state.updates.totalCount += 1;
        }
      })
      .addCase(createProjectUpdateWithFiles.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
        state.createSuccess = false;
      })
      
      // ==================== GET CONTRACT UPDATES ====================
      .addCase(getContractUpdates.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
      })
      .addCase(getContractUpdates.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.updates.contractUpdates = action.payload.projectUpdates || action.payload.updates || [];
        state.updates.totalCount = action.payload.totalUpdates || action.payload.total || 0;
        state.updates.totalPages = action.payload.totalPages || 1;
        state.updates.currentPage = action.payload.currentPage || 1;
        // Also store recent activity if available
        if (action.payload.recentActivity) {
          state.activityLog.items = action.payload.recentActivity;
          state.activityLog.total = action.payload.recentActivity.length;
        }
      })
      .addCase(getContractUpdates.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
      })
      
      // ==================== GET JOB UPDATES ====================
      .addCase(getJobUpdates.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
      })
      .addCase(getJobUpdates.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.updates.jobUpdates = action.payload.projectUpdates || action.payload.updates || [];
        state.updates.totalCount = action.payload.totalUpdates || action.payload.total || 0;
        state.updates.totalPages = action.payload.totalPages || 1;
        state.updates.currentPage = action.payload.currentPage || 1;
      })
      .addCase(getJobUpdates.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
      })
      
      // ==================== GET FREELANCER UPDATES ====================
      .addCase(getFreelancerUpdates.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
      })
      .addCase(getFreelancerUpdates.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.updates.freelancerUpdates = action.payload.projectUpdates || action.payload.updates || [];
        state.updates.totalCount = action.payload.totalUpdates || action.payload.total || 0;
        state.updates.totalPages = action.payload.totalPages || 1;
        state.updates.currentPage = action.payload.currentPage || 1;
      })
      .addCase(getFreelancerUpdates.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
      })
      
      // ==================== GET CLIENT UPDATES ====================
      .addCase(getClientUpdates.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
      })
      .addCase(getClientUpdates.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.updates.clientUpdates = action.payload.projectUpdates || action.payload.updates || [];
        state.updates.totalCount = action.payload.totalUpdates || action.payload.total || 0;
        state.updates.totalPages = action.payload.totalPages || 1;
        state.updates.currentPage = action.payload.currentPage || 1;
      })
      .addCase(getClientUpdates.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
      })
      
      // ==================== GET PROJECT UPDATE BY ID ====================
      .addCase(getProjectUpdateById.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
      })
      .addCase(getProjectUpdateById.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.updates.selectedUpdate = action.payload.projectUpdate || action.payload;
      })
      .addCase(getProjectUpdateById.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
      })
      
      // ==================== UPDATE PROJECT UPDATE ====================
      .addCase(updateProjectUpdate.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateProjectUpdate.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.updateSuccess = true;
        const update = action.payload.projectUpdate || action.payload;
        state.updates.selectedUpdate = update;
        
        const updateList = (list) => {
          const index = list.findIndex(u => u._id === update._id);
          if (index !== -1) {
            list[index] = update;
          }
        };
        
        updateList(state.updates.list);
        updateList(state.updates.contractUpdates);
        updateList(state.updates.jobUpdates);
        updateList(state.updates.freelancerUpdates);
        updateList(state.updates.clientUpdates);
      })
      .addCase(updateProjectUpdate.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
        state.updateSuccess = false;
      })
      
      // ==================== UPDATE PROJECT UPDATE STATUS ====================
      .addCase(updateProjectUpdateStatus.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
        state.statusUpdateSuccess = false;
      })
      .addCase(updateProjectUpdateStatus.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.statusUpdateSuccess = true;
        const update = action.payload.projectUpdate || action.payload;
        state.updates.selectedUpdate = update;
        
        const updateList = (list) => {
          const item = list.find(u => u._id === update._id);
          if (item) {
            item.status = update.status;
            item.completed_at = update.completed_at;
            if (update.freelancer_comment) item.freelancer_comment = update.freelancer_comment;
            if (update.client_comment) item.client_comment = update.client_comment;
          }
        };
        
        updateList(state.updates.list);
        updateList(state.updates.contractUpdates);
        updateList(state.updates.jobUpdates);
        updateList(state.updates.freelancerUpdates);
        updateList(state.updates.clientUpdates);
      })
      .addCase(updateProjectUpdateStatus.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
        state.statusUpdateSuccess = false;
      })
      
      // ==================== UPDATE DELIVERY STATUS ====================
      .addCase(updateDeliveryStatus.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
        state.deliveryUpdateSuccess = false;
      })
      .addCase(updateDeliveryStatus.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.deliveryUpdateSuccess = true;
        const update = action.payload.projectUpdate || action.payload;
        state.updates.selectedUpdate = update;
        
        const updateList = (list) => {
          const item = list.find(u => u._id === update._id);
          if (item) {
            item.delivery_status = update.delivery_status;
            item.status = update.status;
            item.completed_at = update.completed_at;
            item.progress = update.progress;
            if (update.freelancer_comment) item.freelancer_comment = update.freelancer_comment;
            if (update.client_comment) item.client_comment = update.client_comment;
          }
        };
        
        updateList(state.updates.list);
        updateList(state.updates.contractUpdates);
        updateList(state.updates.jobUpdates);
        updateList(state.updates.freelancerUpdates);
        updateList(state.updates.clientUpdates);
      })
      .addCase(updateDeliveryStatus.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
        state.deliveryUpdateSuccess = false;
      })
      
      // ==================== UPLOAD ATTACHMENT ====================
      .addCase(uploadUpdateAttachment.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
        state.attachmentUploaded = false;
      })
      .addCase(uploadUpdateAttachment.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.attachmentUploaded = true;
        const { attachment, projectUpdate } = action.payload;
        if (projectUpdate) {
          // Update the entire project update
          const updateList = (list) => {
            const index = list.findIndex(u => u._id === projectUpdate._id);
            if (index !== -1) {
              list[index] = projectUpdate;
            }
          };
          updateList(state.updates.list);
          updateList(state.updates.contractUpdates);
          updateList(state.updates.jobUpdates);
          updateList(state.updates.freelancerUpdates);
          updateList(state.updates.clientUpdates);
          if (state.updates.selectedUpdate?._id === projectUpdate._id) {
            state.updates.selectedUpdate = projectUpdate;
          }
        }
      })
      .addCase(uploadUpdateAttachment.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
        state.attachmentUploaded = false;
      })
      
      // ==================== DELETE UPDATE ATTACHMENT ====================
      .addCase(deleteUpdateAttachment.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
      })
      .addCase(deleteUpdateAttachment.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        const { updateId, attachmentId } = action.payload;
        
        const removeFromList = (list) => {
          const update = list.find(u => u._id === updateId);
          if (update && update.attachments) {
            update.attachments = update.attachments.filter(a => a._id !== attachmentId);
          }
        };
        
        removeFromList(state.updates.list);
        removeFromList(state.updates.contractUpdates);
        removeFromList(state.updates.jobUpdates);
        removeFromList(state.updates.freelancerUpdates);
        removeFromList(state.updates.clientUpdates);
        
        if (state.updates.selectedUpdate?._id === updateId) {
          state.updates.selectedUpdate.attachments = 
            state.updates.selectedUpdate.attachments.filter(a => a._id !== attachmentId);
        }
      })
      .addCase(deleteUpdateAttachment.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
      })
      
      // ==================== ADD COMMENT ====================
      .addCase(addUpdateComment.pending, (state) => {
        state.updates.isLoading = true;
        state.updates.error = null;
        state.commentAdded = false;
      })
      .addCase(addUpdateComment.fulfilled, (state, action) => {
        state.updates.isLoading = false;
        state.commentAdded = true;
        const update = action.payload.projectUpdate || action.payload;
        state.updates.selectedUpdate = update;
        
        const updateList = (list) => {
          const item = list.find(u => u._id === update._id);
          if (item) {
            if (update.freelancer_comment) item.freelancer_comment = update.freelancer_comment;
            if (update.client_comment) item.client_comment = update.client_comment;
            item.last_updated_by = update.last_updated_by;
          }
        };
        
        updateList(state.updates.list);
        updateList(state.updates.contractUpdates);
        updateList(state.updates.jobUpdates);
        updateList(state.updates.freelancerUpdates);
        updateList(state.updates.clientUpdates);
      })
      .addCase(addUpdateComment.rejected, (state, action) => {
        state.updates.isLoading = false;
        state.updates.error = action.payload;
        state.commentAdded = false;
      })
      
      // ==================== GET PROJECT UPDATE STATS ====================
      .addCase(getProjectUpdateStats.pending, (state) => {
        state.stats.isLoading = true;
        state.stats.error = null;
      })
      .addCase(getProjectUpdateStats.fulfilled, (state, action) => {
        state.stats.isLoading = false;
        state.stats.total = action.payload.total || 0;
        state.stats.completed = action.payload.completed || 0;
        state.stats.inProgress = action.payload.inProgress || 0;
        state.stats.blocked = action.payload.blocked || 0;
        state.stats.pending = action.payload.pending || 0;
        state.stats.typeBreakdown = action.payload.typeBreakdown || {};
        state.stats.contractProgress = action.payload.contractProgress || 0;
        // Store recent activity if available
        if (action.payload.recentActivity) {
          state.activityLog.items = action.payload.recentActivity;
        }
      })
      .addCase(getProjectUpdateStats.rejected, (state, action) => {
        state.stats.isLoading = false;
        state.stats.error = action.payload;
      })
      
      // ==================== GET CONTRACT ACTIVITY LOG ====================
      .addCase(getContractActivityLog.pending, (state) => {
        state.activityLog.isLoading = true;
        state.activityLog.error = null;
      })
      .addCase(getContractActivityLog.fulfilled, (state, action) => {
        state.activityLog.isLoading = false;
        state.activityLog.items = action.payload.activity || [];
        state.activityLog.total = action.payload.total || 0;
        state.activityLog.limit = action.payload.limit || 20;
        state.activityLog.skip = action.payload.skip || 0;
        state.activityLog.hasMore = action.payload.hasMore || false;
        state.activityLog.types = action.payload.types || [];
      })
      .addCase(getContractActivityLog.rejected, (state, action) => {
        state.activityLog.isLoading = false;
        state.activityLog.error = action.payload;
      });
  },
});

// ==================== EXPORT ACTIONS ====================

export const {
  clearUpdateError,
  clearUpdateSuccess,
  setSelectedUpdate,
  clearSelectedUpdate,
  clearUpdates,
  clearStats,
  clearActivityLog,
  updateUpdateLocally,
  removeAttachmentLocally,
  addAttachmentLocally,
} = projectUpdateSlice.actions;

// ==================== SELECTORS ====================

export const selectAllUpdates = (state) => state.projectUpdates.updates.list;
export const selectContractUpdates = (state) => state.projectUpdates.updates.contractUpdates;
export const selectJobUpdates = (state) => state.projectUpdates.updates.jobUpdates;
export const selectFreelancerUpdates = (state) => state.projectUpdates.updates.freelancerUpdates;
export const selectClientUpdates = (state) => state.projectUpdates.updates.clientUpdates;
export const selectSelectedUpdate = (state) => state.projectUpdates.updates.selectedUpdate;
export const selectUpdatesLoading = (state) => state.projectUpdates.updates.isLoading;
export const selectUpdatesError = (state) => state.projectUpdates.updates.error;
export const selectUpdatesTotalCount = (state) => state.projectUpdates.updates.totalCount;
export const selectUpdatesTotalPages = (state) => state.projectUpdates.updates.totalPages;
export const selectUpdatesCurrentPage = (state) => state.projectUpdates.updates.currentPage;
export const selectUpdateStats = (state) => state.projectUpdates.stats;
export const selectCreateUpdateSuccess = (state) => state.projectUpdates.createSuccess;
export const selectUpdateUpdateSuccess = (state) => state.projectUpdates.updateSuccess;
export const selectStatusUpdateSuccess = (state) => state.projectUpdates.statusUpdateSuccess;
export const selectDeliveryUpdateSuccess = (state) => state.projectUpdates.deliveryUpdateSuccess;
export const selectCommentAdded = (state) => state.projectUpdates.commentAdded;
export const selectAttachmentUploaded = (state) => state.projectUpdates.attachmentUploaded;
export const selectActivityLog = (state) => state.projectUpdates.activityLog;

// Memoized selectors
export const selectUpdateById = (state, updateId) => {
  return state.projectUpdates.updates.list.find(u => u._id === updateId) ||
         state.projectUpdates.updates.contractUpdates.find(u => u._id === updateId) ||
         state.projectUpdates.updates.jobUpdates.find(u => u._id === updateId) ||
         state.projectUpdates.updates.freelancerUpdates.find(u => u._id === updateId) ||
         state.projectUpdates.updates.clientUpdates.find(u => u._id === updateId);
};

export const selectUpdatesByStatus = (state, status) => {
  return state.projectUpdates.updates.list.filter(u => u.status === status);
};

export const selectUpdatesByType = (state, updateType) => {
  return state.projectUpdates.updates.list.filter(u => u.update_type === updateType);
};

export const selectPendingDeliveries = (state) => {
  return state.projectUpdates.updates.list.filter(
    u => u.delivery_status === 'submitted' && u.status !== 'completed'
  );
};

export const selectActivityLogByType = (state, type) => {
  return state.projectUpdates.activityLog.items.filter(log => log.type === type);
};

export const selectRecentActivity = (state, limit = 10) => {
  return state.projectUpdates.activityLog.items.slice(0, limit);
};

export default projectUpdateSlice.reducer;