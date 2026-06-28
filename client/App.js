// App.js
import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/Redux/store/index';
import AppNavigator from './src/AppNavigator';
import { initializeAuth } from './src/Redux/slices/authSlice';

// Component to handle auth initialization
const AppInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize auth state (check for stored tokens, etc.)
    dispatch(initializeAuth());
  }, [dispatch]);

  return <AppNavigator />;
};

const App = () => {
  return (
    <Provider store={store}>
      <AppInitializer />
    </Provider>
  );
};

export default App;