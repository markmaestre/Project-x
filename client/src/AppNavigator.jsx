import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { View, ActivityIndicator } from 'react-native';

// ── Dashboard & Auth ──────────────────────────────────────
import Home from './components/dashboard/Home';
import Login from './components/dashboard/Login';
import RoleSelection from './components/dashboard/RoleSelection';
import ClientRegistration from './components/client/ClientRegistration';
import FreelancerRegistration from './components/freelancer/FreelancerRegistration';
import OnboardingScreen from './components/dashboard/OnboardingScreen';

// ── Client Screens ──────────────────────────────────────
import ClientScreen from './components/client/ClientScreen';
import PostJob from './components/client/Postjob';
import Mypostings from './components/client/Mypostings';
import Sentoffers from './components/client/Sentoffers';
import Hiredtalents from './components/client/Hiredtalents';
import ClientProfile from './components/client/ClientProfile';
import ClientMessagesScreen from './components/client/Message';
import ClientEditProfile from './components/client/ClientEditProfile';
import RatingClient from './components/client/RatingClient';
import Settings from './components/client/Settings';

// ── Freelancer Screens ──────────────────────────────────
import FreelancerScreen from './components/freelancer/FreelancerScreen';
import FreelancerProfile from './components/freelancer/FreelancerProfile';
import BrowseJobs from './components/freelancer/BrowseJobs';
import MyJobs from './components/freelancer/MyJobs';
import ReceivedOffers from './components/freelancer/ReceivedOffers';
import Messages from './components/freelancer/Messages';
import MyApplications from './components/freelancer/MyApplications';
import EditProfile from './components/freelancer/EditProfile';
import RatingFreelancer from './components/freelancer/RatingFreelancer';

// ── Flag to track if onboarding has been shown ──────────
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
  }, [isAuthenticated, showOnboarding]);

  const handleNavigate = useCallback((screen, params) => {
    console.log('==> Navigating to:', screen, params);
    setRoute(screen);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    console.log('Onboarding completed');
    setShowOnboarding(false);
    setRoute('Home');
  }, []);

  // ── Get current screen based on auth state ──────────────
  const getScreen = useCallback(() => {
    if (isLoading) {
      return 'Loading';
    }

    if (showOnboarding) {
      return 'Onboarding';
    }

    if (isAuthenticated && user) {
      const role = user.role?.toLowerCase();
      
      // Home route - redirect to appropriate dashboard
      if (route === 'Home' || route === 'Login') {
        if (role === 'freelancer') return 'Freelancer';
        if (role === 'client') return 'Client';
      }
    }
    
    return route;
  }, [isLoading, showOnboarding, isAuthenticated, user, route]);

  const activeRoute = getScreen();

  // ── Loading Screen ──────────────────────────────────────
  if (activeRoute === 'Loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#071A3E' }}>
        <ActivityIndicator size="large" color="#C89520" />
      </View>
    );
  }

  // ── Onboarding Screen ──────────────────────────────────
  if (activeRoute === 'Onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // ── Screen Router ──────────────────────────────────────
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

    // ── Client Screens ──────────────────────────────────────
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
    case 'ClientEditProfile':
      return <ClientEditProfile onNavigate={handleNavigate} />;
    case 'RatingClient':
      return <RatingClient onNavigate={handleNavigate} />;
    case 'Settings':
      return <Settings onNavigate={handleNavigate} />;

    // ── Freelancer Screens ──────────────────────────────────
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
    case 'RatingFreelancer':
      return <RatingFreelancer onNavigate={handleNavigate} />;

    // ── Messages ──────────────────────────────────────────────
    case 'Message':
    case 'Messages':
      // Check if user is client or freelancer
      if (isAuthenticated && user) {
        const role = user.role?.toLowerCase();
        if (role === 'client') {
          return <ClientMessagesScreen onNavigate={handleNavigate} />;
        } else {
          return <Messages onNavigate={handleNavigate} />;
        }
      }
      return <Messages onNavigate={handleNavigate} />;

    // ── Home / Default ──────────────────────────────────────
    case 'Home':
    default:
      return <Home onNavigate={handleNavigate} />;
  }
}