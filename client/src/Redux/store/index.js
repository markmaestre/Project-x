import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import jobReducer from '../slices/jobSlice';
import offerReducer from '../slices/offerSlice';
import applicationReducer from '../slices/applicationSlice';
import messageReducer from '../slices/messageSlice';
import ratingReducer from '../slices/ratingSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer, 
    jobs: jobReducer, 
    offers: offerReducer,
    applications: applicationReducer,
    messages: messageReducer,
    ratings: ratingReducer,
    
  },
});