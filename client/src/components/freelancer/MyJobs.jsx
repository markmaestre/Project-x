import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  Modal, Alert, FlatList, TextInput, ScrollView, RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getReceivedOffers, updateOfferStatus } from '../../Redux/slices/offerSlice';
import { getFreelancerJobs } from '../../Redux/slices/jobSlice';

const BG = '#0a0a0a';
const GOLD = '#D4AF37';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const INPUT_BG = '#111111';

const STATUS_IN_PROGRESS = '#3b82f6';
const STATUS_COMPLETED = '#4ade80';
const STATUS_PENDING = '#f59e0b';
const STATUS_CANCELLED = '#ef4444';

export default function MyJobs({ onNavigate }) {
  const dispatch = useDispatch();
  const { receivedOffers, isLoading: offersLoading } = useSelector((state) => state.offers);
  const { list: jobs, isLoading: jobsLoading } = useSelector((state) => state.jobs.jobs);
  const { user } = useSelector((state) => state.auth);
  
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [messageInput, setMessageInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [myJobs, setMyJobs] = useState([]);

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
    // Assume project takes 30 days, calculate progress
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
      default: return '#fff';
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
    // In a real app, you would send this to your backend
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
    if (progress < 30) return '#ef4444';
    if (progress < 70) return '#f59e0b';
    return '#4ade80';
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

  const JobCard = ({ job, onPress }) => {
    const daysRemaining = calculateDaysRemaining(job.deadline);
    const isUrgent = daysRemaining !== null && daysRemaining <= 3;
    
    return (
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={() => onPress(job)}
        activeOpacity={0.7}
      >
        <View style={styles.jobHeader}>
          <View style={styles.clientInfo}>
            <View style={styles.clientAvatar}>
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
            <Ionicons name="cash-outline" size={14} color={GOLD} />
            <Text style={styles.detailText}>{job.budget}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={GOLD} />
            <Text style={styles.detailText}>
              {job.status === 'pending' ? `Starts: ${job.startDate}` : `Due: ${job.deadline}`}
            </Text>
          </View>
        </View>

        {job.status === 'in_progress' && daysRemaining !== null && (
          <View style={styles.deadlineWarning}>
            {isUrgent && <Ionicons name="warning" size={14} color="#ef4444" />}
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
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Project Details</Text>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.modalContent}>
                {/* Client Info */}
                <View style={styles.modalClientSection}>
                  <View style={styles.modalClientAvatar}>
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
                  <Text style={styles.modalSectionTitle}>Description</Text>
                  <Text style={styles.modalDescription}>{job.description}</Text>
                </View>

                {/* Budget & Timeline */}
                <View style={styles.modalDetailsGrid}>
                  <View style={styles.modalDetailCard}>
                    <Ionicons name="cash-outline" size={20} color={GOLD} />
                    <Text style={styles.modalDetailLabel}>Budget</Text>
                    <Text style={styles.modalDetailValue}>{job.budget}</Text>
                    <Text style={styles.modalDetailSub}>{job.budgetType}</Text>
                  </View>
                  <View style={styles.modalDetailCard}>
                    <Ionicons name="calendar-outline" size={20} color={GOLD} />
                    <Text style={styles.modalDetailLabel}>Timeline</Text>
                    <Text style={styles.modalDetailValue}>
                      {job.startDate} - {job.deadline}
                    </Text>
                  </View>
                </View>

                {/* Progress */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Overall Progress</Text>
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
                  <Text style={styles.modalSectionTitle}>Milestones</Text>
                  <View style={styles.milestoneSummary}>
                    <Text style={styles.milestoneCount}>
                      {completedMilestones}/{totalMilestones} Completed
                    </Text>
                  </View>
                  {job.milestones?.map((milestone, index) => (
                    <View key={milestone.id} style={styles.milestoneItem}>
                      <View style={[styles.milestoneIcon, milestone.completed && styles.milestoneIconCompleted]}>
                        {milestone.completed ? (
                          <Ionicons name="checkmark" size={12} color="#0a0a0a" />
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
                    <Text style={styles.modalSectionTitle}>Skills Required</Text>
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
                  <Text style={styles.modalSectionTitle}>Messages</Text>
                  <ScrollView style={styles.messagesContainer} nestedScrollEnabled={true}>
                    {(!job.messages || job.messages.length === 0) && (
                      <Text style={styles.noMessages}>No messages yet</Text>
                    )}
                  </ScrollView>
                  <View style={styles.messageInputContainer}>
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Type a message..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={messageInput}
                      onChangeText={setMessageInput}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                      <Ionicons name="send" size={18} color="#0a0a0a" />
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
                        <Ionicons name="cloud-upload-outline" size={20} color="#0a0a0a" />
                        <Text style={styles.modalSubmitText}>Submit for Review</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.modalCompleteBtn]}
                      onPress={() => handleMarkComplete(job)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#0a0a0a" />
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
                      <Ionicons name="star-outline" size={20} color={GOLD} />
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>My Jobs</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>Loading your jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="rgba(255,255,255,0.1)" />
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: CARD_BG, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabActive: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderColor: GOLD,
  },
  tabText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: GOLD,
    fontWeight: '500',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabBadgeActive: {
    backgroundColor: GOLD,
  },
  tabBadgeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  tabBadgeTextActive: {
    color: '#0a0a0a',
    fontWeight: '600',
  },

  // Job Card
  jobsList: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  projectCategory: {
    fontSize: 12,
    color: GOLD,
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
    color: 'rgba(255,255,255,0.5)',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
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
    color: 'rgba(255,255,255,0.4)',
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
    color: 'rgba(255,255,255,0.4)',
  },
  deadlineUrgent: {
    color: '#ef4444',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    color: '#fff',
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClientInitials: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  modalClientInfo: {
    flex: 1,
  },
  modalClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalRatingText: {
    fontSize: 13,
    color: '#fff',
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
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  modalProjectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  modalDetailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modalDetailCard: {
    flex: 1,
    backgroundColor: INPUT_BG,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalDetailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  modalDetailSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  modalProgressSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
  },
  milestoneSummary: {
    marginBottom: 12,
  },
  milestoneCount: {
    fontSize: 12,
    color: GOLD,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIconCompleted: {
    backgroundColor: '#4ade80',
  },
  milestoneNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 2,
  },
  milestoneTitleCompleted: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.4)',
  },
  milestoneDate: {
    fontSize: 10,
    color: '#4ade80',
  },
  milestoneDue: {
    fontSize: 10,
    color: '#f59e0b',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalSkillChip: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  modalSkillText: {
    fontSize: 12,
    color: GOLD,
  },
  messagesContainer: {
    maxHeight: 200,
    marginBottom: 12,
  },
  noMessages: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    paddingVertical: 20,
  },
  messageInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: INPUT_BG,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
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
    borderRadius: 10,
  },
  modalSubmitBtn: {
    backgroundColor: GOLD,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  modalCompleteBtn: {
    backgroundColor: '#4ade80',
  },
  modalCompleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  completedSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  leaveReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  leaveReviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: GOLD,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 20,
  },
  browseJobsBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseJobsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
});