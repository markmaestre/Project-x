import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  Modal, Alert, FlatList, TextInput, ScrollView, RefreshControl, ActivityIndicator, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getReceivedOffers, updateOfferStatus } from '../../Redux/slices/offerSlice';
import { getFreelancerJobs } from '../../Redux/slices/jobSlice';

// ── Vantara Design tokens ──────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const NAVY2      = '#0D2151';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
const BLUE_LT    = '#1E90FF';
const GOLD       = '#C89520';
const GOLD_LT    = '#E8B84B';
const GOLD_DK    = '#8A6410';
const SILVER     = '#8899B0';
const SILVER2    = '#B8C8D8';
const WHITE      = '#FFFFFF';
const BG         = '#EEF4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const GREEN      = '#059669';
const ORANGE     = '#F97316';
const RED        = '#EF4444';
// ─────────────────────────────────────────────────────────────────────────────────

const STATUS_IN_PROGRESS = BLUE;
const STATUS_COMPLETED = GREEN;
const STATUS_PENDING = GOLD;
const STATUS_CANCELLED = RED;

// ── Bottom Tab Bar with Centered My Jobs Button ─────────────────────────────────────
function BottomTabBar({ activeTab, onTabPress, pendingOffers }) {
  const tabs = [
    { key: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'Messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { key: 'MyJobs', label: 'My Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
    { key: 'MyApplications', label: 'Applications', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' },
    { key: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          const isMyJobs = tab.key === 'MyJobs';
          const hasBadge = tab.key === 'Messages' && pendingOffers > 0;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                isMyJobs && styles.tabItemCenter,
                isActive && styles.tabItemActive
              ]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              {isMyJobs ? (
                <View style={[styles.centerButton, isActive && styles.centerButtonActive]}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={26}
                    color={isActive ? WHITE : BLUE}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.tabIconWrap}>
                    <Ionicons
                      name={isActive ? tab.activeIcon : tab.icon}
                      size={22}
                      color={isActive ? BLUE : TEXT_LIGHT}
                    />
                    {hasBadge && <View style={styles.tabBadgeDot} />}
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function MyJobs({ onNavigate, route }) {
  const dispatch = useDispatch();
  const { receivedOffers, isLoading: offersLoading } = useSelector((state) => state.offers);
  const { list: jobs, isLoading: jobsLoading } = useSelector((state) => state.jobs.jobs);
  const { user } = useSelector((state) => state.auth);
  
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [messageInput, setMessageInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [myJobs, setMyJobs] = useState([]);

  // Restore active tab when coming back from other screens
  useEffect(() => {
    if (route?.params?.returnState?.activeTab) {
      setActiveTab(route.params.returnState.activeTab);
    }
  }, [route?.params]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getReceivedOffers({})).unwrap(),
        dispatch(getFreelancerJobs({ limit: 50 })).unwrap(),
      ]);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      Alert.alert('Error', 'Failed to load jobs');
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process accepted offers into jobs
  useEffect(() => {
    if (receivedOffers && receivedOffers.length > 0) {
      const acceptedJobs = receivedOffers
        .filter(offer => offer.status === 'accepted')
        .map(offer => ({
          id: offer._id,
          offerId: offer._id,
          clientName: offer.client_name || 'Client',
          clientId: offer.client_id,
          projectTitle: offer.job_title || 'Untitled Project',
          description: offer.message || 'No description provided',
          budget: `₱${offer.amount?.toLocaleString() || 0}`,
          budgetType: 'Fixed',
          startDate: formatDate(offer.created_at),
          deadline: offer.expiry_date ? formatDate(offer.expiry_date) : 'Not specified',
          status: offer.status === 'accepted' ? 'in_progress' : offer.status,
          progress: calculateProgress(offer.created_at, offer.updated_at),
          category: offer.job_category || 'General',
          skills: offer.required_skills || [],
          milestones: generateMilestones(offer),
          messages: offer.messages || [],
          clientRating: offer.client_rating || 4.5,
          submittedForReview: offer.submitted_for_review || false,
          created_at: offer.created_at,
        }));
      
      setMyJobs(acceptedJobs);
    }
  }, [receivedOffers]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Helper function to calculate progress
  const calculateProgress = (startDate, lastUpdate) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const progress = Math.min(Math.floor((daysSinceStart / 30) * 100), 95);
    return progress;
  };

  // Generate milestones based on offer
  const generateMilestones = (offer) => {
    return [
      { id: 'm1', title: 'Project Started', completed: true, date: formatDate(offer.created_at) },
      { id: 'm2', title: 'Work in Progress', completed: false, dueDate: formatDate(new Date(new Date(offer.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)) },
      { id: 'm3', title: 'Submit for Review', completed: false, dueDate: formatDate(new Date(new Date(offer.created_at).getTime() + 14 * 24 * 60 * 60 * 1000)) },
      { id: 'm4', title: 'Project Completion', completed: false, dueDate: formatDate(new Date(new Date(offer.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)) },
    ];
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'in_progress': return STATUS_IN_PROGRESS;
      case 'completed': return STATUS_COMPLETED;
      case 'pending': return STATUS_PENDING;
      case 'cancelled': return STATUS_CANCELLED;
      default: return TEXT_MAIN;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'in_progress': return 'play-circle-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'pending': return 'time-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-outline';
    }
  };

  const handleSubmitForReview = (job) => {
    Alert.alert(
      'Submit for Review',
      'Are you ready to submit this project for client review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              await dispatch(updateOfferStatus({ 
                offerId: job.offerId, 
                status: 'completed' 
              })).unwrap();
              
              Alert.alert('Success', 'Project submitted for client review!');
              fetchData();
              setSelectedJob(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to submit project');
            }
          }
        }
      ]
    );
  };

  const handleMarkComplete = (job) => {
    Alert.alert(
      'Complete Project',
      'Are you sure this project is complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await dispatch(updateOfferStatus({ 
                offerId: job.offerId, 
                status: 'completed' 
              })).unwrap();
              
              Alert.alert('Success', 'Project marked as completed!');
              fetchData();
              setSelectedJob(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to update project status');
            }
          }
        }
      ]
    );
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    Alert.alert('Message Sent', 'Your message has been sent to the client');
    setMessageInput('');
  };

  const calculateDaysRemaining = (deadline) => {
    if (!deadline || deadline === 'Not specified') return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressBarColor = (progress) => {
    if (progress < 30) return RED;
    if (progress < 70) return GOLD;
    return GREEN;
  };

  const getClientInitials = (clientName) => {
    return clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredJobs = () => {
    if (activeTab === 'active') {
      return myJobs.filter(job => job.status === 'in_progress');
    } else if (activeTab === 'completed') {
      return myJobs.filter(job => job.status === 'completed');
    } else {
      return myJobs.filter(job => job.status === 'pending');
    }
  };

  const getTabCount = (tab) => {
    if (tab === 'active') return myJobs.filter(job => job.status === 'in_progress').length;
    if (tab === 'completed') return myJobs.filter(job => job.status === 'completed').length;
    return myJobs.filter(job => job.status === 'pending').length;
  };

  const isLoading = jobsLoading || offersLoading;

  // Handle tab bar navigation
  const handleTabPress = (key) => {
    if (key === 'Home') {
      onNavigate('FreelancerDashboard', { returnState: { activeTab: key } });
    } else if (key === 'MyJobs') {
      // Already on MyJobs, stay here
      setActiveTab('active');
    } else if (key === 'Messages') {
      onNavigate('Messages', { returnState: { activeTab: key } });
    } else if (key === 'Profile') {
      onNavigate('FreelancerProfile', { returnState: { activeTab: key } });
    } else if (key === 'MyApplications') {
      onNavigate('MyApplications', { returnState: { activeTab: key } });
    }
  };

  const JobCard = ({ job, onPress }) => {
    const daysRemaining = calculateDaysRemaining(job.deadline);
    const isUrgent = daysRemaining !== null && daysRemaining <= 3;
    
    return (
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={() => onPress(job)}
        activeOpacity={0.85}
      >
        <View style={styles.jobHeader}>
          <View style={styles.clientInfo}>
            <View style={[styles.clientAvatar, { backgroundColor: BLUE }]}>
              <Text style={styles.clientInitials}>{getClientInitials(job.clientName)}</Text>
            </View>
            <View>
              <Text style={styles.clientName}>{job.clientName}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color={GOLD} />
                <Text style={styles.ratingText}>{job.clientRating}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
            <Ionicons name={getStatusIcon(job.status)} size={12} color={getStatusColor(job.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
              {getStatusText(job.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.projectTitle}>{job.projectTitle}</Text>
        <Text style={styles.projectCategory}>{job.category}</Text>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercent}>{job.progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${job.progress}%`, backgroundColor: getProgressBarColor(job.progress) }]} />
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color={BLUE} />
            <Text style={styles.detailText}>{job.budget}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={BLUE} />
            <Text style={styles.detailText}>
              {job.status === 'pending' ? `Starts: ${job.startDate}` : `Due: ${job.deadline}`}
            </Text>
          </View>
        </View>

        {job.status === 'in_progress' && daysRemaining !== null && (
          <View style={styles.deadlineWarning}>
            <Ionicons name="alert-circle-outline" size={14} color={RED} />
            <Text style={[styles.deadlineText, isUrgent && styles.deadlineUrgent]}>
              {daysRemaining} days remaining
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const JobDetailModal = ({ job, visible, onClose }) => {
    if (!job) return null;

    const completedMilestones = job.milestones?.filter(m => m.completed).length || 0;
    const totalMilestones = job.milestones?.length || 0;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={TEXT_MUTED} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Project Details</Text>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.modalContent}>
                {/* Client Info */}
                <View style={styles.modalClientSection}>
                  <View style={[styles.modalClientAvatar, { backgroundColor: BLUE }]}>
                    <Text style={styles.modalClientInitials}>{getClientInitials(job.clientName)}</Text>
                  </View>
                  <View style={styles.modalClientInfo}>
                    <Text style={styles.modalClientName}>{job.clientName}</Text>
                    <View style={styles.modalRating}>
                      <Ionicons name="star" size={14} color={GOLD} />
                      <Text style={styles.modalRatingText}>{job.clientRating}</Text>
                    </View>
                  </View>
                  <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                    <Ionicons name={getStatusIcon(job.status)} size={14} color={getStatusColor(job.status)} />
                    <Text style={[styles.modalStatusText, { color: getStatusColor(job.status) }]}>
                      {getStatusText(job.status)}
                    </Text>
                  </View>
                </View>

                {/* Project Info */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Project Title</Text>
                  <Text style={styles.modalProjectTitle}>{job.projectTitle}</Text>
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-text-outline" size={16} color={BLUE} />
                    <Text style={styles.modalSectionTitle}>Description</Text>
                  </View>
                  <Text style={styles.modalDescription}>{job.description}</Text>
                </View>

                {/* Budget & Timeline */}
                <View style={styles.modalDetailsGrid}>
                  <View style={styles.modalDetailCard}>
                    <Ionicons name="cash-outline" size={20} color={BLUE} />
                    <Text style={styles.modalDetailLabel}>Budget</Text>
                    <Text style={styles.modalDetailValue}>{job.budget}</Text>
                    <Text style={styles.modalDetailSub}>{job.budgetType}</Text>
                  </View>
                  <View style={styles.modalDetailCard}>
                    <Ionicons name="calendar-outline" size={20} color={BLUE} />
                    <Text style={styles.modalDetailLabel}>Timeline</Text>
                    <Text style={styles.modalDetailValue}>
                      {job.startDate} - {job.deadline}
                    </Text>
                  </View>
                </View>

                {/* Progress */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="trending-up-outline" size={16} color={BLUE} />
                    <Text style={styles.modalSectionTitle}>Overall Progress</Text>
                  </View>
                  <View style={styles.modalProgressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Completion</Text>
                      <Text style={styles.progressPercent}>{job.progress}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${job.progress}%`, backgroundColor: getProgressBarColor(job.progress) }]} />
                    </View>
                  </View>
                </View>

                {/* Milestones */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="flag-outline" size={16} color={BLUE} />
                    <Text style={styles.modalSectionTitle}>Milestones</Text>
                  </View>
                  <View style={styles.milestoneSummary}>
                    <Text style={styles.milestoneCount}>
                      {completedMilestones}/{totalMilestones} Completed
                    </Text>
                  </View>
                  {job.milestones?.map((milestone, index) => (
                    <View key={milestone.id} style={styles.milestoneItem}>
                      <View style={[styles.milestoneIcon, milestone.completed && styles.milestoneIconCompleted]}>
                        {milestone.completed ? (
                          <Ionicons name="checkmark" size={12} color={TEXT_MAIN} />
                        ) : (
                          <Text style={styles.milestoneNumber}>{index + 1}</Text>
                        )}
                      </View>
                      <View style={styles.milestoneInfo}>
                        <Text style={[styles.milestoneTitle, milestone.completed && styles.milestoneTitleCompleted]}>
                          {milestone.title}
                        </Text>
                        {milestone.completed ? (
                          <Text style={styles.milestoneDate}>Completed {milestone.date}</Text>
                        ) : (
                          <Text style={styles.milestoneDue}>Due {milestone.dueDate}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Skills */}
                {job.skills && job.skills.length > 0 && (
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="flash-outline" size={16} color={BLUE} />
                      <Text style={styles.modalSectionTitle}>Skills Required</Text>
                    </View>
                    <View style={styles.skillsContainer}>
                      {job.skills.map((skill, index) => (
                        <View key={index} style={styles.modalSkillChip}>
                          <Text style={styles.modalSkillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Messages */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="chatbubbles-outline" size={16} color={BLUE} />
                    <Text style={styles.modalSectionTitle}>Messages</Text>
                  </View>
                  <ScrollView style={styles.messagesContainer} nestedScrollEnabled={true}>
                    {(!job.messages || job.messages.length === 0) && (
                      <Text style={styles.noMessages}>No messages yet</Text>
                    )}
                  </ScrollView>
                  <View style={styles.messageInputContainer}>
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Type a message..."
                      placeholderTextColor={TEXT_LIGHT}
                      value={messageInput}
                      onChangeText={setMessageInput}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                      <Ionicons name="send" size={18} color={WHITE} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                {job.status === 'in_progress' && (
                  <View style={styles.modalActions}>
                    {!job.submittedForReview && (
                      <TouchableOpacity 
                        style={[styles.modalActionBtn, styles.modalSubmitBtn]}
                        onPress={() => handleSubmitForReview(job)}
                      >
                        <Ionicons name="cloud-upload-outline" size={20} color={WHITE} />
                        <Text style={styles.modalSubmitText}>Submit for Review</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.modalCompleteBtn]}
                      onPress={() => handleMarkComplete(job)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color={WHITE} />
                      <Text style={styles.modalCompleteText}>Mark Complete</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {job.status === 'completed' && (
                  <View style={styles.completedSection}>
                    <Ionicons name="checkmark-circle" size={48} color={STATUS_COMPLETED} />
                    <Text style={styles.completedTitle}>Project Completed!</Text>
                    <Text style={styles.completedText}>
                      This project has been successfully completed
                    </Text>
                    <TouchableOpacity 
                      style={styles.leaveReviewBtn}
                      onPress={() => Alert.alert('Review', 'Review feature coming soon!')}
                    >
                      <Ionicons name="star-outline" size={20} color={BLUE} />
                      <Text style={styles.leaveReviewText}>Leave a Review</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
            <View style={styles.backIconWrap}>
              <Ionicons name="arrow-back" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>My Jobs</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading your jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingOffers = 0; // You can calculate this if needed

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
          <View style={styles.backIconWrap}>
            <Ionicons name="arrow-back" size={18} color={WHITE} />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>My Jobs</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['active', 'completed', 'pending'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'active' ? 'Active' : tab === 'completed' ? 'Completed' : 'Pending'}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                {getTabCount(tab)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredJobs()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={setSelectedJob} />
        )}
        contentContainerStyle={styles.jobsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="briefcase-outline" size={48} color={BLUE} />
            </View>
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active' 
                ? "You don't have any active jobs at the moment" 
                : activeTab === 'completed'
                ? "You haven't completed any jobs yet"
                : "No pending jobs to start"}
            </Text>
            <TouchableOpacity 
              style={styles.browseJobsBtn}
              onPress={() => onNavigate('BrowseJobs')}
            >
              <Ionicons name="search-outline" size={18} color={WHITE} style={{ marginRight: 6 }} />
              <Text style={styles.browseJobsText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <JobDetailModal 
        job={selectedJob}
        visible={selectedJob !== null}
        onClose={() => setSelectedJob(null)}
      />

      {/* Bottom Tab Bar */}
      <BottomTabBar 
        activeTab="MyJobs" 
        onTabPress={handleTabPress} 
        pendingOffers={pendingOffers}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 16,
    backgroundColor: NAVY,
  },
  backBtn: { alignSelf: 'flex-start' },
  backIconWrap: {
    width: 40, height: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: WHITE, letterSpacing: -0.3 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabActive: {
    backgroundColor: `${BLUE}10`,
    borderColor: BLUE,
  },
  tabText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  tabTextActive: {
    color: BLUE,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: BORDER,
  },
  tabBadgeActive: {
    backgroundColor: BLUE,
  },
  tabBadgeText: {
    fontSize: 10,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  tabBadgeTextActive: {
    color: WHITE,
    fontWeight: '700',
  },

  // Job Card
  jobsList: {
    padding: 16,
    paddingBottom: 80, // Extra padding for bottom tab bar
  },
  jobCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  projectCategory: {
    fontSize: 12,
    color: BLUE,
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: BORDER,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  jobDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  deadlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  deadlineText: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  deadlineUrgent: {
    color: RED,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7,26,62,0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  modalContent: {
    padding: 20,
  },
  modalClientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalClientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClientInitials: {
    fontSize: 20,
    fontWeight: '600',
    color: WHITE,
  },
  modalClientInfo: {
    flex: 1,
  },
  modalClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalRatingText: {
    fontSize: 13,
    color: TEXT_MAIN,
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  modalProjectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  modalDescription: {
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 20,
  },
  modalDetailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modalDetailCard: {
    flex: 1,
    backgroundColor: BG,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalDetailLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 6,
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MAIN,
    textAlign: 'center',
  },
  modalDetailSub: {
    fontSize: 10,
    color: TEXT_LIGHT,
  },
  modalProgressSection: {
    backgroundColor: BG,
    padding: 12,
    borderRadius: 12,
  },
  milestoneSummary: {
    marginBottom: 12,
  },
  milestoneCount: {
    fontSize: 12,
    color: BLUE,
    fontWeight: '500',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  milestoneIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIconCompleted: {
    backgroundColor: STATUS_COMPLETED,
  },
  milestoneNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 13,
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  milestoneTitleCompleted: {
    textDecorationLine: 'line-through',
    color: TEXT_MUTED,
  },
  milestoneDate: {
    fontSize: 10,
    color: STATUS_COMPLETED,
  },
  milestoneDue: {
    fontSize: 10,
    color: STATUS_PENDING,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalSkillChip: {
    backgroundColor: `${BLUE}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${BLUE}20`,
  },
  modalSkillText: {
    fontSize: 12,
    color: BLUE,
    fontWeight: '500',
  },
  messagesContainer: {
    maxHeight: 200,
    marginBottom: 12,
  },
  noMessages: {
    textAlign: 'center',
    color: TEXT_LIGHT,
    paddingVertical: 20,
  },
  messageInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: TEXT_MAIN,
    fontSize: 13,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalSubmitBtn: {
    backgroundColor: BLUE,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
  },
  modalCompleteBtn: {
    backgroundColor: STATUS_COMPLETED,
  },
  modalCompleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
  },
  completedSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginTop: 16,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 24,
  },
  leaveReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${BLUE}10`,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${BLUE}20`,
  },
  leaveReviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: BLUE,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 80, height: 80,
    backgroundColor: `${BLUE}10`,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  browseJobsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseJobsText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
  },

  // Bottom Tab Bar Styles
  tabSafe: { backgroundColor: 'transparent', position: 'absolute', bottom: 0, left: 0, right: 0 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabItemCenter: {
    flex: 0,
    marginHorizontal: 8,
    marginTop: -20,
  },
  tabItemActive: {},
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: WHITE,
  },
  centerButtonActive: {
    backgroundColor: BLUE,
    transform: [{ scale: 1.05 }],
  },
  tabIconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: BLUE,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: BLUE,
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -3,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    borderWidth: 1.5,
    borderColor: WHITE,
  },
});