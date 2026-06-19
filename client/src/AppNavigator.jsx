import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { View, ActivityIndicator } from 'react-native';
import Home from './components/dashboard/Home';
import Login from './components/dashboard/Login';
import RoleSelection from './components/dashboard/RoleSelection';
import ClientRegistration from './components/client/ClientRegistration';
import FreelancerRegistration from './components/freelancer/FreelancerRegistration';
import OnboardingScreen from './components/dashboard/OnboardingScreen';

// Client Screens
import ClientScreen from './components/client/ClientScreen';
import PostJob from './components/client/Postjob';
import Mypostings from './components/client/Mypostings';
import Sentoffers from './components/client/Sentoffers';
import Hiredtalents from './components/client/Hiredtalents';
import ClientProfile from './components/client/ClientProfile';
import Settings from './components/client/Settings';
import Message from './components/client/Message';
import ClientMessagesScreen from './components/client/Message';
import ClientEditProfile from './components/client/ClientEditProfile';

// Freelancer Screens
import FreelancerScreen from './components/freelancer/FreelancerScreen';
import FreelancerProfile from './components/freelancer/FreelancerProfile';
import BrowseJobs from './components/freelancer/BrowseJobs';
import MyJobs from './components/freelancer/MyJobs';
import ReceivedOffers from './components/freelancer/ReceivedOffers';
import Messages from './components/freelancer/Messages';
import MyApplications from './components/freelancer/MyApplications';
import EditProfile from './components/freelancer/EditProfile';

// Client Settings Screen
import ClientSettingsScreen from './components/client/Settings';

// Flag to track if onboarding has been shown in this session
let onboardingShownThisSession = false;

export default function AppNavigator() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [route, setRoute] = useState('Home');
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    
    const timer = setTimeout(() => {
   
      if (!isAuthenticated && !onboardingShownThisSession && !showOnboarding) {
        console.log('Showing onboarding screen');
        setShowOnboarding(true);
        setRoute('Onboarding');
        onboardingShownThisSession = true;
      } else {
        console.log('Skipping onboarding - isAuthenticated:', isAuthenticated, 'onboardingShown:', onboardingShownThisSession);
      }
      setIsLoading(false);
    }, 500); 
    
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleNavigate = useCallback((screen, params) => {
    console.log('==> Navigating to:', screen, params);
    setRoute(screen);
  }, []);

  const handleOnboardingComplete = () => {
    console.log('Onboarding completed');
    setShowOnboarding(false);
    setRoute('Home');
  };

  const getScreen = () => {
    if (isLoading) {
      return 'Loading';
    }

    if (showOnboarding) {
      return 'Onboarding';
    }

    if (isAuthenticated && user) {
      const role = user.role?.toLowerCase();
      if (route === 'Home' || route === 'Login') {
        if (role === 'freelancer') return 'Freelancer';
        if (role === 'client') return 'Client';
      }
    }
    return route;
  };

  const activeRoute = getScreen();
  const isClient = user?.role?.toLowerCase() === 'client';

  console.log('Active route:', activeRoute);
  console.log('Show onboarding:', showOnboarding);
  console.log('Is loading:', isLoading);
  console.log('Is authenticated:', isAuthenticated);
  console.log('Has user:', !!user);

  // Loading screen
  if (activeRoute === 'Loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#071A3E' }}>
        <ActivityIndicator size="large" color="#C89520" />
      </View>
    );
  }

  // Onboarding Screen
  if (activeRoute === 'Onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  switch (activeRoute) {
    // ── Auth & Public ──────────────────────────────────────
    case 'Login':
      return <Login onNavigate={handleNavigate} />;
    case 'RoleSelection':
      return <RoleSelection onNavigate={handleNavigate} />;
    case 'ClientRegistration':
      return <ClientRegistration onNavigate={handleNavigate} />;
    case 'FreelancerRegistration':
      return <FreelancerRegistration onNavigate={handleNavigate} />;

    // ── Client ─────────────────────────────────────
    case 'Client':
    case 'ClientDashboard':
      return <ClientScreen onNavigate={handleNavigate} />;
    case 'PostJob':
      return <PostJob onNavigate={handleNavigate} />;
    case 'Mypostings':
      return <Mypostings onNavigate={handleNavigate} />;
    case 'Sentoffers':
      return <Sentoffers onNavigate={handleNavigate} />;
    case 'Hiredtalents':
      return <Hiredtalents onNavigate={handleNavigate} />;
    case 'ClientProfile':
      return <ClientProfile onNavigate={handleNavigate} />;
    case 'Message':
      return <Message onNavigate={handleNavigate} />;

    case 'Messages':
      return isClient
        ? <ClientMessagesScreen onNavigate={handleNavigate} />
        : <Messages onNavigate={handleNavigate} />;
    
    case 'ClientEditProfile':
      return <ClientEditProfile onNavigate={handleNavigate} />;

    // ── Freelancer  ─────────────────────────────────
    case 'Freelancer':
    case 'FreelancerDashboard':
      return <FreelancerScreen onNavigate={handleNavigate} />;
    case 'FreelancerProfile':
      return <FreelancerProfile onNavigate={handleNavigate} />;
    case 'BrowseJobs':
      return <BrowseJobs onNavigate={handleNavigate} onBack={() => handleNavigate('FreelancerDashboard')} />;
    case 'MyJobs':
      return <MyJobs onNavigate={handleNavigate} />;
    case 'ReceivedOffers':
      return <ReceivedOffers onNavigate={handleNavigate} />;
    case 'MyApplications':
      return <MyApplications onNavigate={handleNavigate} onBack={() => handleNavigate('FreelancerDashboard')} />;
    case 'EditProfile':
      return <EditProfile onNavigate={handleNavigate} onBack={() => handleNavigate('FreelancerDashboard')} />;

    // ── Home ───────────────────────────────────────────────
    case 'Home':
    default:
      return <Home onNavigate={handleNavigate} />;
  }
}