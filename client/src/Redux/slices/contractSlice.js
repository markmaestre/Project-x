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

      // ── FIX: Ensure proper budget structure ──────────────────────────────
      // The payload should already have the correct structure from the component
      // But we need to make sure agreed_budget is properly formatted
      
      let payload = { ...contractData };
      
      // If agreed_budget is missing or not an object, build it
      if (!payload.agreed_budget || typeof payload.agreed_budget !== 'object') {
        payload.agreed_budget = {
          amount: parseFloat(payload.budgetAmount) || parseFloat(payload.amount) || 0,
          type: payload.budgetType || payload.type || 'fixed',
          currency: payload.currency || 'PHP'
        };
      }
      
      // Ensure amount is a number
      if (payload.agreed_budget && payload.agreed_budget.amount) {
        payload.agreed_budget.amount = parseFloat(payload.agreed_budget.amount);
      }

      // Remove any duplicate fields that might cause issues
      delete payload.budgetAmount;
      delete payload.budgetType;
      delete payload.amount;
      delete payload.type;
      delete payload.currency;

      console.log('📤 Sending to backend:', JSON.stringify(payload, null, 2));

      const response = await api.post('/contracts', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Create contract error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== FILE UPLOAD ACTIONS ====================

// Upload contract document (Both client and freelancer)
export const uploadContractDocument = createAsyncThunk(
  'contracts/uploadContractDocument',
  async ({ contractId, file, description }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const formData = new FormData();
      formData.append('document', file);
      if (description) {
        formData.append('description', description);
      }

      const response = await api.post(`/contracts/${contractId}/documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      console.error('Upload contract document error:', error.response?.data);
      if (error.response?.status === 413) {
        return rejectWithValue({ 
          message: 'File is too large. Maximum file size is 20MB.',
          code: 'FILE_TOO_LARGE'
        });
      }
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete contract document
export const deleteContractDocument = createAsyncThunk(
  'contracts/deleteContractDocument',
  async ({ contractId, documentId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.delete(`/contracts/${contractId}/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Delete contract document error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Upload signed document (Sign contract)
export const signContract = createAsyncThunk(
  'contracts/signContract',
  async ({ contractId, file, signature_type = 'electronic' }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const formData = new FormData();
      formData.append('signed_document', file);
      if (signature_type) {
        formData.append('signature_type', signature_type);
      }

      const response = await api.post(`/contracts/${contractId}/sign`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      console.error('Sign contract error:', error.response?.data);
      if (error.response?.status === 413) {
        return rejectWithValue({ 
          message: 'File is too large. Maximum file size is 10MB.',
          code: 'FILE_TOO_LARGE'
        });
      }
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== CONTRACT MANAGEMENT ACTIONS ====================

// Activate contract (Client only)
export const activateContract = createAsyncThunk(
  'contracts/activateContract',
  async (contractId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/contracts/${contractId}/activate`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Activate contract error:', error.response?.data);
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
      if (status && status !== 'All') params.status = status;

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
      if (status && status !== 'All') params.status = status;

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

// Complete contract
export const completeContract = createAsyncThunk(
  'contracts/completeContract',
  async (contractId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/contracts/${contractId}/complete`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Complete contract error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Cancel contract
export const cancelContract = createAsyncThunk(
  'contracts/cancelContract',
  async ({ contractId, reason }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/contracts/${contractId}/cancel`, 
        { reason: reason || 'Cancelled by user' },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Cancel contract error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Pause contract
export const pauseContract = createAsyncThunk(
  'contracts/pauseContract',
  async ({ contractId, reason }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/contracts/${contractId}/pause`, 
        { reason: reason || 'Paused by user' },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Pause contract error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Resume contract
export const resumeContract = createAsyncThunk(
  'contracts/resumeContract',
  async (contractId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/contracts/${contractId}/resume`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Resume contract error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== MILESTONE ACTIONS ====================

// Add milestone to contract (Client only)
export const addMilestone = createAsyncThunk(
  'contracts/addMilestone',
  async ({ contractId, title, description, due_date, amount }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.post(`/contracts/${contractId}/milestones`, 
        { title, description, due_date, amount },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Add milestone error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update milestone status
export const updateMilestoneStatus = createAsyncThunk(
  'contracts/updateMilestoneStatus',
  async ({ contractId, milestoneId, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.patch(`/contracts/${contractId}/milestones/${milestoneId}`, 
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
      console.error('Update milestone status error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ==================== ANALYTICS ACTIONS ====================

// Get client contract analytics
export const getClientContractAnalytics = createAsyncThunk(
  'contracts/getClientContractAnalytics',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/client/contract-analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get client contract analytics error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get freelancer contract analytics
export const getFreelancerContractAnalytics = createAsyncThunk(
  'contracts/getFreelancerContractAnalytics',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get('/freelancer/contract-analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get freelancer contract analytics error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Get contract by application ID
export const getContractByApplication = createAsyncThunk(
  'contracts/getContractByApplication',
  async (applicationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await api.get(`/contracts/application/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get contract by application error:', error.response?.data);
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
    statusBreakdown: {},
  },
  stats: {
    total: 0,
    active: 0,
    paused: 0,
    completed: 0,
    cancelled: 0,
    draft: 0,
    totalBudget: 0,
    averageProgress: 0,
    totalEarnings: 0,
    completionRate: 0,
    isLoading: false,
    error: null,
  },
  documents: {
    isLoading: false,
    error: null,
    uploadProgress: 0,
  },
  createSuccess: false,
  updateSuccess: false,
  cancelSuccess: false,
  signSuccess: false,
  activateSuccess: false,
  lastUpdated: null,
};

// ==================== SLICE ====================

const contractSlice = createSlice({
  name: 'contracts',
  initialState,
  reducers: {
    clearContractError: (state) => {
      state.contracts.error = null;
      state.stats.error = null;
      state.documents.error = null;
    },
    clearContractSuccess: (state) => {
      state.createSuccess = false;
      state.updateSuccess = false;
      state.cancelSuccess = false;
      state.signSuccess = false;
      state.activateSuccess = false;
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
      state.contracts.statusBreakdown = {};
    },
    updateContractLocally: (state, action) => {
      const { contractId, updates } = action.payload;
      
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
      
      state.lastUpdated = new Date().toISOString();
    },
    setUploadProgress: (state, action) => {
      state.documents.uploadProgress = action.payload;
    },
    resetUploadProgress: (state) => {
      state.documents.uploadProgress = 0;
    },
    addDocumentLocally: (state, action) => {
      const { contractId, document } = action.payload;
      const contract = state.contracts.list.find(c => c._id === contractId) ||
                       state.contracts.clientContracts.find(c => c._id === contractId) ||
                       state.contracts.freelancerContracts.find(c => c._id === contractId);
      
      if (contract) {
        if (!contract.contract_documents) contract.contract_documents = [];
        contract.contract_documents.push(document);
      }
      
      if (state.contracts.selectedContract?._id === contractId) {
        if (!state.contracts.selectedContract.contract_documents) {
          state.contracts.selectedContract.contract_documents = [];
        }
        state.contracts.selectedContract.contract_documents.push(document);
      }
    },
    removeDocumentLocally: (state, action) => {
      const { contractId, documentId } = action.payload;
      
      const removeFromList = (list) => {
        const contract = list.find(c => c._id === contractId);
        if (contract && contract.contract_documents) {
          contract.contract_documents = contract.contract_documents.filter(d => d._id !== documentId);
        }
      };
      
      removeFromList(state.contracts.list);
      removeFromList(state.contracts.clientContracts);
      removeFromList(state.contracts.freelancerContracts);
      
      if (state.contracts.selectedContract?._id === contractId) {
        state.contracts.selectedContract.contract_documents = 
          state.contracts.selectedContract.contract_documents.filter(d => d._id !== documentId);
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
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createContract.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
        state.createSuccess = false;
      })
      
      // ==================== UPLOAD CONTRACT DOCUMENT ====================
      .addCase(uploadContractDocument.pending, (state) => {
        state.documents.isLoading = true;
        state.documents.error = null;
        state.documents.uploadProgress = 0;
      })
      .addCase(uploadContractDocument.fulfilled, (state, action) => {
        state.documents.isLoading = false;
        state.documents.uploadProgress = 100;
        const contract = action.payload.contract;
        
        const updateList = (list) => {
          const index = list.findIndex(c => c._id === contract._id);
          if (index !== -1) {
            list[index] = contract;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
        
        if (state.contracts.selectedContract?._id === contract._id) {
          state.contracts.selectedContract = contract;
        }
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(uploadContractDocument.rejected, (state, action) => {
        state.documents.isLoading = false;
        state.documents.error = action.payload;
        state.documents.uploadProgress = 0;
      })
      
      // ==================== DELETE CONTRACT DOCUMENT ====================
      .addCase(deleteContractDocument.pending, (state) => {
        state.documents.isLoading = true;
        state.documents.error = null;
      })
      .addCase(deleteContractDocument.fulfilled, (state, action) => {
        state.documents.isLoading = false;
        const contract = action.payload.contract;
        
        const updateList = (list) => {
          const index = list.findIndex(c => c._id === contract._id);
          if (index !== -1) {
            list[index] = contract;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
        
        if (state.contracts.selectedContract?._id === contract._id) {
          state.contracts.selectedContract = contract;
        }
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteContractDocument.rejected, (state, action) => {
        state.documents.isLoading = false;
        state.documents.error = action.payload;
      })
      
      // ==================== SIGN CONTRACT ====================
      .addCase(signContract.pending, (state) => {
        state.documents.isLoading = true;
        state.documents.error = null;
        state.signSuccess = false;
        state.documents.uploadProgress = 0;
      })
      .addCase(signContract.fulfilled, (state, action) => {
        state.documents.isLoading = false;
        state.signSuccess = true;
        state.documents.uploadProgress = 100;
        const contract = action.payload.contract;
        
        const updateList = (list) => {
          const index = list.findIndex(c => c._id === contract._id);
          if (index !== -1) {
            list[index] = contract;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
        
        if (state.contracts.selectedContract?._id === contract._id) {
          state.contracts.selectedContract = contract;
        }
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(signContract.rejected, (state, action) => {
        state.documents.isLoading = false;
        state.documents.error = action.payload;
        state.signSuccess = false;
        state.documents.uploadProgress = 0;
      })
      
      // ==================== ACTIVATE CONTRACT ====================
      .addCase(activateContract.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
        state.activateSuccess = false;
      })
      .addCase(activateContract.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        state.activateSuccess = true;
        const contract = action.payload.contract;
        
        const updateList = (list) => {
          const index = list.findIndex(c => c._id === contract._id);
          if (index !== -1) {
            list[index] = contract;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
        
        if (state.contracts.selectedContract?._id === contract._id) {
          state.contracts.selectedContract = contract;
        }
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(activateContract.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
        state.activateSuccess = false;
      })
      
      // ==================== GET CLIENT CONTRACTS ====================
      .addCase(getClientContracts.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(getClientContracts.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.clientContracts = action.payload.contracts || [];
        state.contracts.totalCount = action.payload.totalContracts || 0;
        state.contracts.totalPages = action.payload.totalPages || 1;
        state.contracts.currentPage = action.payload.currentPage || 1;
        state.contracts.statusBreakdown = action.payload.statusBreakdown || {};
        state.lastUpdated = new Date().toISOString();
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
        state.contracts.freelancerContracts = action.payload.contracts || [];
        state.contracts.totalCount = action.payload.totalContracts || 0;
        state.contracts.totalPages = action.payload.totalPages || 1;
        state.contracts.currentPage = action.payload.currentPage || 1;
        state.contracts.statusBreakdown = action.payload.statusBreakdown || {};
        state.lastUpdated = new Date().toISOString();
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
        state.lastUpdated = new Date().toISOString();
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
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateContract.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
        state.updateSuccess = false;
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
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateContractProgress.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
      })
      
      // ==================== COMPLETE CONTRACT ====================
      .addCase(completeContract.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(completeContract.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        const contract = action.payload.contract;
        state.contracts.selectedContract = contract;
        
        const updateList = (list) => {
          const item = list.find(c => c._id === contract._id);
          if (item) {
            item.status = contract.status;
            item.progress = contract.progress;
            item.is_active = contract.is_active;
            item.end_date = contract.end_date;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(completeContract.rejected, (state, action) => {
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
        const contract = action.payload.contract;
        state.contracts.selectedContract = contract;
        
        const updateList = (list) => {
          const item = list.find(c => c._id === contract._id);
          if (item) {
            item.status = contract.status;
            item.is_active = contract.is_active;
            item.end_date = contract.end_date;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(cancelContract.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
        state.cancelSuccess = false;
      })
      
      // ==================== PAUSE CONTRACT ====================
      .addCase(pauseContract.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(pauseContract.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        const contract = action.payload.contract;
        state.contracts.selectedContract = contract;
        
        const updateList = (list) => {
          const item = list.find(c => c._id === contract._id);
          if (item) {
            item.status = contract.status;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(pauseContract.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
      })
      
      // ==================== RESUME CONTRACT ====================
      .addCase(resumeContract.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(resumeContract.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        const contract = action.payload.contract;
        state.contracts.selectedContract = contract;
        
        const updateList = (list) => {
          const item = list.find(c => c._id === contract._id);
          if (item) {
            item.status = contract.status;
          }
        };
        
        updateList(state.contracts.list);
        updateList(state.contracts.clientContracts);
        updateList(state.contracts.freelancerContracts);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(resumeContract.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
      })
      
      // ==================== ADD MILESTONE ====================
      .addCase(addMilestone.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(addMilestone.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
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
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(addMilestone.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
      })
      
      // ==================== UPDATE MILESTONE STATUS ====================
      .addCase(updateMilestoneStatus.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(updateMilestoneStatus.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
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
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateMilestoneStatus.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
      })
      
      // ==================== GET CLIENT CONTRACT ANALYTICS ====================
      .addCase(getClientContractAnalytics.pending, (state) => {
        state.stats.isLoading = true;
        state.stats.error = null;
      })
      .addCase(getClientContractAnalytics.fulfilled, (state, action) => {
        state.stats.isLoading = false;
        const analytics = action.payload.analytics || {};
        state.stats.total = analytics.totalContracts || 0;
        state.stats.active = analytics.activeContracts || 0;
        state.stats.paused = analytics.pausedContracts || 0;
        state.stats.completed = analytics.completedContracts || 0;
        state.stats.cancelled = analytics.cancelledContracts || 0;
        state.stats.draft = analytics.draftContracts || 0;
        state.stats.totalBudget = analytics.totalBudget || 0;
        state.stats.completionRate = analytics.completionRate || 0;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getClientContractAnalytics.rejected, (state, action) => {
        state.stats.isLoading = false;
        state.stats.error = action.payload;
      })
      
      // ==================== GET FREELANCER CONTRACT ANALYTICS ====================
      .addCase(getFreelancerContractAnalytics.pending, (state) => {
        state.stats.isLoading = true;
        state.stats.error = null;
      })
      .addCase(getFreelancerContractAnalytics.fulfilled, (state, action) => {
        state.stats.isLoading = false;
        const analytics = action.payload.analytics || {};
        state.stats.total = analytics.totalContracts || 0;
        state.stats.active = analytics.activeContracts || 0;
        state.stats.paused = analytics.pausedContracts || 0;
        state.stats.completed = analytics.completedContracts || 0;
        state.stats.cancelled = analytics.cancelledContracts || 0;
        state.stats.draft = analytics.draftContracts || 0;
        state.stats.totalEarnings = analytics.totalEarnings || 0;
        state.stats.completionRate = analytics.completionRate || 0;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getFreelancerContractAnalytics.rejected, (state, action) => {
        state.stats.isLoading = false;
        state.stats.error = action.payload;
      })
      
      // ==================== GET CONTRACT BY APPLICATION ====================
      .addCase(getContractByApplication.pending, (state) => {
        state.contracts.isLoading = true;
        state.contracts.error = null;
      })
      .addCase(getContractByApplication.fulfilled, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.selectedContract = action.payload.contract;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getContractByApplication.rejected, (state, action) => {
        state.contracts.isLoading = false;
        state.contracts.error = action.payload;
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
  setUploadProgress,
  resetUploadProgress,
  addDocumentLocally,
  removeDocumentLocally,
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
export const selectContractsStatusBreakdown = (state) => state.contracts.contracts.statusBreakdown;
export const selectContractStats = (state) => state.contracts.stats;
export const selectCreateContractSuccess = (state) => state.contracts.createSuccess;
export const selectUpdateContractSuccess = (state) => state.contracts.updateSuccess;
export const selectCancelContractSuccess = (state) => state.contracts.cancelSuccess;
export const selectSignContractSuccess = (state) => state.contracts.signSuccess;
export const selectActivateContractSuccess = (state) => state.contracts.activateSuccess;
export const selectUploadProgress = (state) => state.contracts.documents.uploadProgress;
export const selectDocumentsLoading = (state) => state.contracts.documents.isLoading;
export const selectDocumentsError = (state) => state.contracts.documents.error;
export const selectLastUpdated = (state) => state.contracts.lastUpdated;

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

export const selectContractDocuments = (state, contractId) => {
  const contract = selectContractById(state, contractId);
  return contract?.contract_documents || [];
};

export const selectContractMilestones = (state, contractId) => {
  const contract = selectContractById(state, contractId);
  return contract?.milestones || [];
};

export default contractSlice.reducer;