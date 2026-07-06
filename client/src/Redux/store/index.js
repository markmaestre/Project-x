import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import jobReducer from '../slices/jobSlice';
import applicationReducer from '../slices/applicationSlice';
import messageReducer from '../slices/messageSlice';
import ratingReducer from '../slices/ratingSlice';
import contractReducer from '../slices/contractSlice';
import projectUpdateReducer from '../slices/projectUpdateSlice'; 
import notificationReducer from '../slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobReducer,
    applications: applicationReducer,
    messages: messageReducer,
    ratings: ratingReducer,
    contracts: contractReducer,
    projectUpdates: projectUpdateReducer, 
    notifications: notificationReducer,
  },
});