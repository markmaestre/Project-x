// Redux/slices/contractSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ==================== HELPER FUNCTIONS ====================

const createContractFormData = (contractData) => {
  const formData = new FormData();
  
  Object.keys(contractData).forEach(key => {
    if (contractData[key] !== null && contractData[key] !== undefined && contractData[key] !== '') {
      if (typeof contractData[key] === 'object' && !(contractData[key] instanceof File) && !(contractData[key] instanceof Date)) {
        formData.append(key, JSON.stringify(contractData[key]));
      } else if (contractData[key] instanceof Date) {
        formData.append(key, contractData[key].toISOString());
      } else if (typeof contractData[key] === 'boolean') {
        formData.append(key, contractData[key] ? 'true' : 'false');
      } else {
        formData.append(key, String(contractData[key]));
      }
    }
  });
  
  return formData;
};

// ==================== CONTRACT ACTIONS ====================

// Create a new contract (Client only)
export const createContract = createAsyncThunk(
  'contracts/createContract',
  async (contractData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post('/contracts', contractData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Create contract error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get client's contracts
export const getClientContracts = createAsyncThunk(
  'contracts/getClientContracts',
  async ({ status, page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { page, limit };
      if (status) params.status = status;

      const response = await api.get('/client/contracts', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Get client contracts error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get freelancer's contracts
export const getFreelancerContracts = createAsyncThunk(
  'contracts/getFreelancerContracts',
  async ({ status, page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const params = { page, limit };
      if (status) params.status = status;

      const response = await api.get('/freelancer/contracts', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Get freelancer contracts error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get single contract by ID
export const getContractById = createAsyncThunk(
  'contracts/getContractById',
  async (contractId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get contract by ID error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update contract (Client only)
export const updateContract = createAsyncThunk(
  'contracts/updateContract',
  async ({ contractId, contractData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.put(`/contracts/${contractId}`, contractData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Update contract error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update contract status
export const updateContractStatus = createAsyncThunk(
  'contracts/updateContractStatus',
  async ({ contractId, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/contracts/${contractId}/status`, 
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
      console.error('Update contract status error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update contract progress
export const updateContractProgress = createAsyncThunk(
  'contracts/updateContractProgress',
  async ({ contractId, progress }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/contracts/${contractId}/progress`, 
        { progress },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Update contract progress error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete/Cancel contract
export const cancelContract = createAsyncThunk(
  'contracts/cancelContract',
  async (contractId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { contractId, message: response.data.message };
    } catch (error) {
      console.error('Cancel contract error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get contract statistics
export const getContractStats = createAsyncThunk(
  'contracts/getContractStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/contracts/stats/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get contract stats error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  contracts: {
    list: [],
    clientContracts: [],
    freelancerContracts: [],
    selectedContract: null,
    isLoading: false,
    error: null,
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
  },
  stats: {
    total: 0,
    active: 0,
    paused: 0,
    completed: 0,
    cancelled: 0,
    totalBudget: 0,
    averageProgress: 0,
    totalEarnings: 0,
    isLoading: false,
    error: null,
  },
  createSuccess: false,
  updateSuccess: false,
  cancelSuccess: false,
};

// ==================== SLICE ====================

const contractSlice = createSlice({
  name: 'contracts',
  initialState,
  reducers: {
    clearContractError: (state) => {
      state.contracts.error = null;
      state.stats.error = null;
    },
    clearContractSuccess: (state) => {
      state.createSuccess = false;
      state.updateSuccess = false;
      state.cancelSuccess = false;
    },
    setSelectedContract: (state, action) => {
      state.contracts.selectedContract = action.payload;
    },
    clearSelectedContract: (state) => {
      state.contracts.selectedContract = null;
    },
    clearContracts: (state) => {
      state.contracts.list = [];
      state.contracts.clientContracts = [];
      state.contracts.freelancerContracts = [];
      state.contracts.selectedContract = null;
      state.contracts.totalCount = 0;
      state.contracts.totalPages = 1;
      state.contracts.currentPage = 1;
    },
    updateContractLocally: (state, action) => {
      const { contractId, updates } = action.payload;
      
      // Update in all lists
      const updateList = (list) => {
        const index = list.findIndex(c => c._id === contractId);
        if (index !== -1) {
          list[index] = { ...list[index], ...updates };
        }
      };
      
      updateList(state.contracts.list);
      updateList(state.contracts.clientContracts);
      updateList(state.contracts.freelancerContracts);
      
      if (state.contracts.selectedContract?._id === contractId) {
        state.contracts.selectedContract = { ...state.contracts.selectedContract, ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== CREATE CONTRACT ====================
      .addCase(createContract.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
        state.createSuccess = false;
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        state.createSuccess = true;
        const contract = action.payload.contract;
        state.contracts.list.unshift(contract);
        state.contracts.clientContracts.unshift(contract);
        state.contracts.totalCount += 1;
      })
      .addCase(createContract.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
        state.createSuccess = false;
      })
      
      // ==================== GET CLIENT CONTRACTS ====================
      .addCase(getClientContracts.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(getClientContracts.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.clientContracts = action.payload.contracts;
        state.contracts.totalCount = action.payload.totalContracts;
        state.contracts.totalPages = action.payload.totalPages;
        state.contracts.currentPage = action.payload.currentPage;
      })
      .addCase(getClientContracts.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
      })
      
      // ==================== GET FREELANCER CONTRACTS ====================
      .addCase(getFreelancerContracts.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(getFreelancerContracts.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.freelancerContracts = action.payload.contracts;
        state.contracts.totalCount = action.payload.totalContracts;
        state.contracts.totalPages = action.payload.totalPages;
        state.contracts.currentPage = action.payload.currentPage;
      })
      .addCase(getFreelancerContracts.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
      })
      
      // ==================== GET CONTRACT BY ID ====================
      .addCase(getContractById.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(getContractById.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.selectedContract = action.payload.contract;
      })
      .addCase(getContractById.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
      })
      
      // ==================== UPDATE CONTRACT ====================
      .addCase(updateContract.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateContract.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        state.updateSuccess = true;
        const contract = action.payload.contract;
        state.contracts.selectedContract = contract;
        
        const updateList = (list) => {
          const index = list.findIndex(c => c._id === contract._id);
          if (index !== -1) {
            list[index] = contract;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
      })
      .addCase(updateContract.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
        state.updateSuccess = false;
      })
      
      // ==================== UPDATE CONTRACT STATUS ====================
      .addCase(updateContractStatus.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(updateContractStatus.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        const contract = action.payload.contract;
        state.contracts.selectedContract = contract;
        
        const updateList = (list) => {
          const item = list.find(c => c._id === contract._id);
          if (item) {
            item.status = contract.status;
            item.progress = contract.progress;
            item.is_active = contract.is_active;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
      })
      .addCase(updateContractStatus.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
      })
      
      // ==================== UPDATE CONTRACT PROGRESS ====================
      .addCase(updateContractProgress.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(updateContractProgress.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        const contract = action.payload.contract;
        state.contracts.selectedContract = contract;
        
        const updateList = (list) => {
          const item = list.find(c => c._id === contract._id);
          if (item) {
            item.progress = contract.progress;
            item.status = contract.status;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
      })
      .addCase(updateContractProgress.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
      })
      
      // ==================== CANCEL CONTRACT ====================
      .addCase(cancelContract.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
        state.cancelSuccess = false;
      })
      .addCase(cancelContract.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        state.cancelSuccess = true;
        
        state.contracts.list = state.contracts.list.filter(c => c._id !== action.payload.contractId);
        state.contracts.clientContracts = state.contracts.clientContracts.filter(c => c._id !== action.payload.contractId);
        state.contracts.freelancerContracts = state.contracts.freelancerContracts.filter(c => c._id !== action.payload.contractId);
        
        if (state.contracts.selectedContract?._id === action.payload.contractId) {
          state.contracts.selectedContract = null;
        }
        
        state.contracts.totalCount -= 1;
      })
      .addCase(cancelContract.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
        state.cancelSuccess = false;
      })
      
      // ==================== GET CONTRACT STATS ====================
      .addCase(getContractStats.pending, (state) => {
        state.stats.isLoading = true;
        state.stats.error = null;
      })
      .addCase(getContractStats.fulfilled, (state, action) => {
        state.stats.isLoading = false;
        state.stats.total = action.payload.total || 0;
        state.stats.active = action.payload.active || 0;
        state.stats.paused = action.payload.paused || 0;
        state.stats.completed = action.payload.completed || 0;
        state.stats.cancelled = action.payload.cancelled || 0;
        state.stats.totalBudget = action.payload.totalBudget || 0;
        state.stats.averageProgress = action.payload.averageProgress || 0;
        state.stats.totalEarnings = action.payload.totalEarnings || 0;
      })
      .addCase(getContractStats.rejected, (state, action) => {
        state.stats.isLoading = false;
        state.stats.error = action.payload;
      });
  },
});

// ==================== EXPORT ACTIONS ====================

export const {
  clearContractError,
  clearContractSuccess,
  setSelectedContract,
  clearSelectedContract,
  clearContracts,
  updateContractLocally,
} = contractSlice.actions;

// ==================== SELECTORS ====================

export const selectAllContracts = (state) => state.contracts.contracts.list;
export const selectClientContracts = (state) => state.contracts.contracts.clientContracts;
export const selectFreelancerContracts = (state) => state.contracts.contracts.freelancerContracts;
export const selectSelectedContract = (state) => state.contracts.contracts.selectedContract;
export const selectContractsLoading = (state) => state.contracts.contracts.isLoading;
export const selectContractsError = (state) => state.contracts.contracts.error;
export const selectContractsTotalCount = (state) => state.contracts.contracts.totalCount;
export const selectContractsTotalPages = (state) => state.contracts.contracts.totalPages;
export const selectContractsCurrentPage = (state) => state.contracts.contracts.currentPage;
export const selectContractStats = (state) => state.contracts.stats;
export const selectCreateContractSuccess = (state) => state.contracts.createSuccess;
export const selectUpdateContractSuccess = (state) => state.contracts.updateSuccess;
export const selectCancelContractSuccess = (state) => state.contracts.cancelSuccess;

// Memoized selectors
export const selectContractById = (state, contractId) => {
  return state.contracts.contracts.list.find(c => c._id === contractId) ||
         state.contracts.contracts.clientContracts.find(c => c._id === contractId) ||
         state.contracts.contracts.freelancerContracts.find(c => c._id === contractId);
};

export const selectContractsByStatus = (state, status) => {
  return state.contracts.contracts.list.filter(c => c.status === status);
};

export const selectActiveContracts = (state) => {
  return state.contracts.contracts.list.filter(c => c.status === 'active');
};

export default contractSlice.reducer;