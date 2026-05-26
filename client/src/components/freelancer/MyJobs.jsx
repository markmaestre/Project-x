import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  Modal, Alert, FlatList, TextInput, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BG = '#0a0a0a';
const GOLD = '#D4AF37';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const INPUT_BG = '#111111';

const STATUS_IN_PROGRESS = '#3b82f6';
const STATUS_COMPLETED = '#4ade80';
const STATUS_ON_HOLD = '#f59e0b';
const STATUS_CANCELLED = '#ef4444';
const STATUS_REVIEW = '#8b5cf6';

// Sample jobs data with 2026 dates
const SAMPLE_JOBS = [
  {
    id: '1',
    clientName: 'Servcorp Manila',
    clientInitials: 'SM',
    clientAvatar: null,
    projectTitle: 'Office Setup Consultation',
    description: 'Complete office setup consultation including IT infrastructure planning and layout design.',
    budget: '₱28,000',
    budgetType: 'Fixed',
    startDate: '2026-01-10',
    deadline: '2026-01-24',
    status: 'in_progress',
    progress: 65,
    category: 'Consulting',
    skills: ['Project Management', 'IT Consulting', 'Office Planning'],
    milestones: [
      { id: 'm1', title: 'Initial Assessment', completed: true, date: '2026-01-12' },
      { id: 'm2', title: 'IT Infrastructure Plan', completed: true, date: '2026-01-15' },
      { id: 'm3', title: 'Office Layout Design', completed: false, dueDate: '2026-01-20' },
      { id: 'm4', title: 'Final Presentation', completed: false, dueDate: '2026-01-24' },
    ],
    messages: [
      { id: 'msg1', from: 'client', message: 'Great work so far!', timestamp: '2026-01-16 10:30' },
      { id: 'msg2', from: 'me', message: 'Thanks! Working on the layout design now.', timestamp: '2026-01-16 11:45' },
    ],
    clientRating: 4.8,
    submittedForReview: false,
  },
  {
    id: '2',
    clientName: 'Apex Ventures',
    clientInitials: 'AV',
    clientAvatar: null,
    projectTitle: 'Branding Package',
    description: 'Complete branding package including logo design, brand guidelines, and marketing materials.',
    budget: '₱45,000',
    budgetType: 'Fixed',
    startDate: '2026-01-05',
    deadline: '2026-01-26',
    status: 'in_progress',
    progress: 40,
    category: 'Design',
    skills: ['Branding', 'Logo Design', 'Adobe Illustrator'],
    milestones: [
      { id: 'm1', title: 'Research & Discovery', completed: true, date: '2026-01-08' },
      { id: 'm2', title: 'Logo Concepts', completed: true, date: '2026-01-12' },
      { id: 'm3', title: 'Brand Guidelines', completed: false, dueDate: '2026-01-20' },
      { id: 'm4', title: 'Marketing Materials', completed: false, dueDate: '2026-01-26' },
    ],
    messages: [
      { id: 'msg1', from: 'client', message: 'Love the first concepts! Can we see more variations?', timestamp: '2026-01-13 14:20' },
      { id: 'msg2', from: 'me', message: 'Of course! Working on additional options now.', timestamp: '2026-01-13 15:10' },
    ],
    clientRating: 5.0,
    submittedForReview: false,
  },
  {
    id: '3',
    clientName: 'Digital Ocean PH',
    clientInitials: 'DO',
    clientAvatar: null,
    projectTitle: 'React Native Mobile App',
    description: 'Develop a cross-platform mobile app for our e-commerce platform.',
    budget: '₱120,000',
    budgetType: 'Fixed',
    startDate: '2026-01-15',
    deadline: '2026-02-26',
    status: 'in_progress',
    progress: 15,
    category: 'Development',
    skills: ['React Native', 'Node.js', 'MongoDB'],
    milestones: [
      { id: 'm1', title: 'Requirements Gathering', completed: true, date: '2026-01-16' },
      { id: 'm2', title: 'UI/UX Design', completed: false, dueDate: '2026-01-30' },
      { id: 'm3', title: 'Development', completed: false, dueDate: '2026-02-20' },
      { id: 'm4', title: 'Testing & Deployment', completed: false, dueDate: '2026-02-26' },
    ],
    messages: [
      { id: 'msg1', from: 'me', message: 'Starting the design phase this week.', timestamp: '2026-01-17 09:00' },
    ],
    clientRating: 4.5,
    submittedForReview: false,
  },
  {
    id: '4',
    clientName: 'Creative Studio',
    clientInitials: 'CS',
    clientAvatar: null,
    projectTitle: 'Video Editing Project',
    description: 'Edit 5 promotional videos for social media campaigns.',
    budget: '₱15,000',
    budgetType: 'Fixed',
    startDate: '2026-01-01',
    deadline: '2026-01-15',
    status: 'completed',
    progress: 100,
    category: 'Video',
    skills: ['Premiere Pro', 'After Effects', 'Video Editing'],
    milestones: [
      { id: 'm1', title: 'Raw Footage Review', completed: true, date: '2026-01-03' },
      { id: 'm2', title: 'First Cut', completed: true, date: '2026-01-08' },
      { id: 'm3', title: 'Revisions', completed: true, date: '2026-01-12' },
      { id: 'm4', title: 'Final Delivery', completed: true, date: '2026-01-15' },
    ],
    messages: [
      { id: 'msg1', from: 'client', message: 'The videos look amazing! Thank you!', timestamp: '2026-01-15 16:20' },
      { id: 'msg2', from: 'me', message: 'Glad you liked them! Looking forward to working again.', timestamp: '2026-01-15 17:00' },
    ],
    clientRating: 4.9,
    submittedForReview: false,
  },
  {
    id: '5',
    clientName: 'TechStart Inc.',
    clientInitials: 'TI',
    clientAvatar: null,
    projectTitle: 'UI/UX Design for Dashboard',
    description: 'Design a modern dashboard for our analytics platform.',
    budget: '₱35,000',
    budgetType: 'Fixed',
    startDate: '2026-02-01',
    deadline: '2026-02-28',
    status: 'pending',
    progress: 0,
    category: 'Design',
    skills: ['Figma', 'UI Design', 'UX Research'],
    milestones: [
      { id: 'm1', title: 'Research', completed: false, dueDate: '2026-02-07' },
      { id: 'm2', title: 'Wireframes', completed: false, dueDate: '2026-02-14' },
      { id: 'm3', title: 'High Fidelity Designs', completed: false, dueDate: '2026-02-21' },
      { id: 'm4', title: 'Handoff', completed: false, dueDate: '2026-02-28' },
    ],
    messages: [],
    clientRating: 4.7,
    submittedForReview: false,
  },
];

export default function MyJobs({ onNavigate }) {
  const [jobs, setJobs] = useState(SAMPLE_JOBS);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [messageInput, setMessageInput] = useState('');

  const getStatusColor = (status) => {
    switch(status) {
      case 'in_progress': return STATUS_IN_PROGRESS;
      case 'completed': return STATUS_COMPLETED;
      case 'on_hold': return STATUS_ON_HOLD;
      case 'cancelled': return STATUS_CANCELLED;
      case 'pending': return STATUS_REVIEW;
      default: return '#fff';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'on_hold': return 'On Hold';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending Start';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'in_progress': return 'play-circle-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'on_hold': return 'pause-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      case 'pending': return 'time-outline';
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
          onPress: () => {
            const updatedJobs = jobs.map(j => 
              j.id === job.id ? { ...j, submittedForReview: true, status: 'review' } : j
            );
            setJobs(updatedJobs);
            Alert.alert('Success', 'Project submitted for client review!');
            setSelectedJob(null);
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
          onPress: () => {
            const updatedJobs = jobs.map(j => 
              j.id === job.id ? { ...j, status: 'completed', progress: 100 } : j
            );
            setJobs(updatedJobs);
            Alert.alert('Success', 'Project marked as completed!');
            setSelectedJob(null);
          }
        }
      ]
    );
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    const updatedJobs = jobs.map(job => {
      if (job.id === selectedJob.id) {
        const newMessage = {
          id: Date.now().toString(),
          from: 'me',
          message: messageInput.trim(),
          timestamp: new Date().toLocaleString(),
        };
        return {
          ...job,
          messages: [...(job.messages || []), newMessage]
        };
      }
      return job;
    });
    
    setJobs(updatedJobs);
    setSelectedJob(prev => ({
      ...prev,
      messages: [...(prev.messages || []), {
        id: Date.now().toString(),
        from: 'me',
        message: messageInput.trim(),
        timestamp: new Date().toLocaleString(),
      }]
    }));
    setMessageInput('');
  };

  const calculateDaysRemaining = (deadline) => {
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

  const filteredJobs = () => {
    if (activeTab === 'active') {
      return jobs.filter(job => job.status === 'in_progress');
    } else if (activeTab === 'completed') {
      return jobs.filter(job => job.status === 'completed');
    } else {
      return jobs.filter(job => job.status === 'pending');
    }
  };

  const getTabCount = (tab) => {
    if (tab === 'active') return jobs.filter(job => job.status === 'in_progress').length;
    if (tab === 'completed') return jobs.filter(job => job.status === 'completed').length;
    return jobs.filter(job => job.status === 'pending').length;
  };

  const JobCard = ({ job, onPress }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => onPress(job)}
      activeOpacity={0.7}
    >
      <View style={styles.jobHeader}>
        <View style={styles.clientInfo}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientInitials}>{job.clientInitials}</Text>
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

      {job.status === 'in_progress' && (
        <View style={styles.deadlineWarning}>
          {calculateDaysRemaining(job.deadline) <= 3 && (
            <Ionicons name="warning" size={14} color="#ef4444" />
          )}
          <Text style={[styles.deadlineText, calculateDaysRemaining(job.deadline) <= 3 && styles.deadlineUrgent]}>
            {calculateDaysRemaining(job.deadline)} days remaining
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
                    <Text style={styles.modalClientInitials}>{job.clientInitials}</Text>
                  </View>
                  <View style={styles.modalClientInfo}>
                    <Text style={styles.modalClientName}>{job.clientName}</Text>
                    <View style={styles.modalRating}>
                      <Ionicons name="star" size={14} color={GOLD} />
                      <Text style={styles.modalRatingText}>{job.clientRating}</Text>
                      <Text style={styles.modalReviewCount}>(24 reviews)</Text>
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

                {/* Messages */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Messages</Text>
                  <ScrollView style={styles.messagesContainer} nestedScrollEnabled={true}>
                    {job.messages?.map((msg) => (
                      <View key={msg.id} style={[styles.messageItem, msg.from === 'me' ? styles.myMessage : styles.clientMessage]}>
                        <Text style={[styles.messageText, msg.from === 'me' && styles.myMessageText]}>
                          {msg.message}
                        </Text>
                        <Text style={[styles.messageTime, msg.from === 'me' && styles.myMessageTime]}>
                          {msg.timestamp}
                        </Text>
                      </View>
                    ))}
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
                      This project has been successfully completed on {job.deadline}
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Jobs</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={22} color={GOLD} />
        </TouchableOpacity>
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
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
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
  modalReviewCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
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
  messageItem: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '85%',
  },
  clientMessage: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
  },
  myMessage: {
    backgroundColor: GOLD,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 13,
    color: '#fff',
  },
  myMessageText: {
    color: '#0a0a0a',
  },
  messageTime: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(0,0,0,0.5)',
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