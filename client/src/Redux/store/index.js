import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import jobReducer from '../slices/jobSlice';
import offerReducer from '../slices/offerSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer, 
    jobs: jobReducer, 
    offers: offerReducer,
  },
});