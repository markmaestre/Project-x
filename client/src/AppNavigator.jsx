import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Home from './components/dashboard/Home';
import Login from './components/dashboard/Login';
import RoleSelection from './components/dashboard/RoleSelection';
import ClientRegistration from './components/client/ClientRegistration';
import FreelancerRegistration from './components/freelancer/FreelancerRegistration';
import ClientScreen from './components/client/ClientScreen';
import FreelancerScreen from './components/freelancer/FreelancerScreen';
import FreelancerProfile from './components/freelancer/FreelancerProfile';
import BrowseJobs from './components/freelancer/BrowseJobs';
import MyJobs from './components/freelancer/MyJobs';
import ReceivedOffers from './components/freelancer/ReceivedOffers';
import Messages from './components/freelancer/Messages';
import Settings from './components/freelancer/Settings';


export default function AppNavigator() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [route, setRoute] = useState('Home');

  const handleNavigate = useCallback((screen) => {
    console.log('==> Navigating to:', screen);
    setRoute(screen);
  }, []);

  const getScreen = () => {
    // If user is authenticated, always respect their role
    // regardless of what 'route' says
    if (isAuthenticated && user) {
      const role = user.role?.toLowerCase();
      if (route === 'Home' || route === 'Login') {
        // Redirect away from public screens if already logged in
        if (role === 'freelancer') return 'Freelancer';
        if (role === 'client') return 'Client';
      }
    }
    return route;
  };

  const activeRoute = getScreen();

  console.log('Active route:', activeRoute);

  switch (activeRoute) {
    // Authentication & Public Screens
    case 'Login':
      return <Login onNavigate={handleNavigate} />;
    case 'RoleSelection':
      return <RoleSelection onNavigate={handleNavigate} />;
    case 'ClientRegistration':
      return <ClientRegistration onNavigate={handleNavigate} />;
    case 'FreelancerRegistration':
      return <FreelancerRegistration onNavigate={handleNavigate} />;
    
    // Client Screens
    case 'Client':
    case 'ClientDashboard':
      return <ClientScreen onNavigate={handleNavigate} />;
    
    // Freelancer Main Screens
    case 'Freelancer':
    case 'FreelancerDashboard':
      return <FreelancerScreen onNavigate={handleNavigate} />;
    
    // Freelancer Sub-screens
    case 'FreelancerProfile':
      return <FreelancerProfile onNavigate={handleNavigate} />;
    case 'BrowseJobs':
      return <BrowseJobs onNavigate={handleNavigate} onBack={() => handleNavigate('FreelancerDashboard')} />;
    case 'MyJobs':
      return <MyJobs onNavigate={handleNavigate} />;
    case 'ReceivedOffers':
      return <ReceivedOffers onNavigate={handleNavigate} />;
    case 'Messages':
      return <Messages onNavigate={handleNavigate} />;
    case 'Settings':
      return <Settings onNavigate={handleNavigate} />;
    case 'Notifications':
      return <Notifications onNavigate={handleNavigate} />;
    case 'Search':
      return <Search onNavigate={handleNavigate} />;
    
    // Home Screen
    case 'Home':
    default:
      return <Home onNavigate={handleNavigate} />;
  }
}