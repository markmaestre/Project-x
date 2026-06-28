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

      const formData = createUpdateFormData(updateData);
      const response = await api.post('/project-updates', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Create project update error:', error.response?.data);
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
  async ({ updateId, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/project-updates/${updateId}/status`, 
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
      console.error('Update project update status error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update delivery status
export const updateDeliveryStatus = createAsyncThunk(
  'projectUpdates/updateDeliveryStatus',
  async ({ updateId, delivery_status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/project-updates/${updateId}/delivery`, 
        { delivery_status },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Update delivery status error:', error.response?.data);
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
  createSuccess: false,
  updateSuccess: false,
  statusUpdateSuccess: false,
  deliveryUpdateSuccess: false,
};

// ==================== SLICE ====================

const projectUpdateSlice = createSlice({
  name: 'projectUpdates',
  initialState,
  reducers: {
    clearUpdateError: (state) => {
      state.updates.error = null;
      state.stats.error = null;
    },
    clearUpdateSuccess: (state) => {
      state.createSuccess = false;
      state.updateSuccess = false;
      state.statusUpdateSuccess = false;
      state.deliveryUpdateSuccess = false;
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
        const update = action.payload.projectUpdate;
        state.updates.list.unshift(update);
        state.updates.contractUpdates.unshift(update);
        state.updates.totalCount += 1;
      })
      .addCase(createProjectUpdate.rejected, (state, action) => {
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
        state.updates.contractUpdates = action.payload.projectUpdates;
        state.updates.totalCount = action.payload.totalUpdates;
        state.updates.totalPages = action.payload.totalPages;
        state.updates.currentPage = action.payload.currentPage;
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
        state.updates.jobUpdates = action.payload.projectUpdates;
        state.updates.totalCount = action.payload.totalUpdates;
        state.updates.totalPages = action.payload.totalPages;
        state.updates.currentPage = action.payload.currentPage;
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
        state.updates.freelancerUpdates = action.payload.projectUpdates;
        state.updates.totalCount = action.payload.totalUpdates;
        state.updates.totalPages = action.payload.totalPages;
        state.updates.currentPage = action.payload.currentPage;
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
        state.updates.clientUpdates = action.payload.projectUpdates;
        state.updates.totalCount = action.payload.totalUpdates;
        state.updates.totalPages = action.payload.totalPages;
        state.updates.currentPage = action.payload.currentPage;
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
        state.updates.selectedUpdate = action.payload.projectUpdate;
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
        const update = action.payload.projectUpdate;
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
        const update = action.payload.projectUpdate;
        state.updates.selectedUpdate = update;
        
        const updateList = (list) => {
          const item = list.find(u => u._id === update._id);
          if (item) {
            item.status = update.status;
            item.completed_at = update.completed_at;
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
        const update = action.payload.projectUpdate;
        state.updates.selectedUpdate = update;
        
        const updateList = (list) => {
          const item = list.find(u => u._id === update._id);
          if (item) {
            item.delivery_status = update.delivery_status;
            item.status = update.status;
            item.completed_at = update.completed_at;
            item.progress = update.progress;
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
      })
      .addCase(getProjectUpdateStats.rejected, (state, action) => {
        state.stats.isLoading = false;
        state.stats.error = action.payload;
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
  updateUpdateLocally,
  removeAttachmentLocally,
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

export default projectUpdateSlice.reducer;