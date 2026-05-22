import React, { useState } from 'react';
import Home from './components/dashboard/Home';
import Login from './components/dashboard/Login';
import Register from './components/dashboard/Register';
import ClientScreen from './components/client/ClientScreen';
import FreelancerScreen from './components/freelancer/FreelancerScreen';

export default function AppNavigator() {
  const [route, setRoute] = useState('Home');

  const renderScreen = () => {
    switch (route) {
      case 'Login':
        return <Login onNavigate={setRoute} />;
      case 'Register':
        return <Register onNavigate={setRoute} />;
      case 'Client':
        return <ClientScreen onNavigate={setRoute} />;
      case 'Freelancer':
        return <FreelancerScreen onNavigate={setRoute} />;
      default:
        return <Home onNavigate={setRoute} />;
    }
  };

  return renderScreen();
}
