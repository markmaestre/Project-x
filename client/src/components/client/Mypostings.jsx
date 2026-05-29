import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, RefreshControl, Modal,
  TextInput, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getClientJobs, deleteJob, updateJobStatus } from '../../Redux/slices/jobSlice';
import { getJobApplications, updateApplicationStatus, sendOffer } from '../../Redux/slices/applicationSlice';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const INPUT_BG = '#1c1c1c';

const TABS = ['All', 'open', 'in_progress', 'completed', 'cancelled'];

const formatStatus = (status) => {
  const statusMap = {
    'open': 'Open',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
};

const getBudgetDisplay = (job) => {
  if (job.budget_type === 'hourly') {
    return `₱${job.budget_amount}/hr`;
  } else {
    return `₱${job.budget_amount?.toLocaleString()}`;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

export default function MyPostings({ onNavigate }) {
  const dispatch = useDispatch();
  const { clientJobs, isLoading } = useSelector((state) => state.jobs.jobs);
  const { token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showApplicantProfileModal, setShowApplicantProfileModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [requirements, setRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    if (!token) {
      Alert.alert('Error', 'Please login again');
      return;
    }
    
    try {
      await dispatch(getClientJobs({})).unwrap();
    } catch (error) {
      console.error('Error fetching jobs:', error);
      Alert.alert('Error', 'Failed to load your job postings');
    }
  };

  const fetchApplications = async (jobId) => {
    setLoadingApplications(true);
    try {
      const response = await dispatch(getJobApplications({ jobId })).unwrap();
      setApplications(response.applications || []);
      setShowApplicantsModal(true);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoadingApplications(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, []);

  const filteredJobs = clientJobs.filter((job) =>
    activeTab === 'All' ? true : job.status === activeTab
  );

  const handleViewApplicantProfile = (application) => {
    setSelectedApplicant(application.freelancer_id);
    setSelectedApplication(application);
    setShowApplicantProfileModal(true);
  };

  const handleSendOfferFromProfile = () => {
    setShowApplicantProfileModal(false);
    setTimeout(() => {
      setOfferAmount(selectedApplication?.proposed_rate?.toString() || '');
      setOfferMessage(`I'm impressed with your application for ${selectedJob?.title}. I'd like to offer you the position.`);
      setRequirements(`Please provide the following requirements:
- Portfolio/Work samples
- Resume/CV
- Government IDs
- Bank account details
- NDA (Non-Disclosure Agreement)`);
      setDeadline(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setStartDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setShowOfferModal(true);
    }, 300);
  };

  const handleSendOffer = async () => {
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid offer amount');
      return;
    }

    try {
      await dispatch(sendOffer({
        applicationId: selectedApplication._id,
        amount: parseFloat(offerAmount),
        message: offerMessage,
        requirements: requirements,
        deadline: deadline,
        start_date: startDate,
      })).unwrap();
      
      Alert.alert(
        'Success', 
        'Offer sent to freelancer!\n\nThey will be notified and can accept or decline the offer.',
        [{ text: 'OK', onPress: () => {
          setShowOfferModal(false);
          setOfferAmount('');
          setOfferMessage('');
          setRequirements('');
          setDeadline('');
          setStartDate('');
          if (selectedJob) {
            fetchApplications(selectedJob._id);
          }
        }}]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send offer');
    }
  };

  const handleMessageFreelancer = (freelancerId) => {
    onNavigate('Messages', { userId: freelancerId, userRole: 'freelancer' });
  };

  const ApplicantsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showApplicantsModal}
      onRequestClose={() => setShowApplicantsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Applicants - {selectedJob?.title}</Text>
            <TouchableOpacity onPress={() => setShowApplicantsModal(false)}>
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
          
          {loadingApplications ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={GOLD} />
              <Text style={styles.loadingText}>Loading applications...</Text>
            </View>
          ) : applications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyTitle}>No applications yet</Text>
              <Text style={styles.emptyText}>Freelancers will appear here when they apply</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {applications.map((application) => (
                <TouchableOpacity 
                  key={application._id} 
                  style={styles.applicationCard}
                  onPress={() => handleViewApplicantProfile(application)}
                  activeOpacity={0.7}
                >
                  <View style={styles.applicantHeader}>
                    <View style={styles.applicantAvatar}>
                      {application.freelancer_id?.profile_picture ? (
                        <Image source={{ uri: application.freelancer_id.profile_picture }} style={styles.avatarImage} />
                      ) : (
                        <Text style={styles.applicantInitials}>
                          {application.freelancer_id?.first_name?.[0]}{application.freelancer_id?.last_name?.[0]}
                        </Text>
                      )}
                    </View>
                    <View style={styles.applicantInfo}>
                      <Text style={styles.applicantName}>
                        {application.freelancer_id?.first_name} {application.freelancer_id?.last_name}
                      </Text>
                      <Text style={styles.applicantRole}>{application.freelancer_id?.experience_level || 'Freelancer'}</Text>
                      <View style={styles.applicantSkills}>
                        {application.freelancer_id?.skills?.slice(0, 2).map((skill, idx) => (
                          <View key={idx} style={styles.applicantSkillChip}>
                            <Text style={styles.applicantSkillText}>{skill}</Text>
                          </View>
                        ))}
                        {application.freelancer_id?.skills?.length > 2 && (
                          <Text style={styles.moreSkillsText}>+{application.freelancer_id.skills.length - 2}</Text>
                        )}
                      </View>
                    </View>
                    <View style={[
                      styles.applicationStatusBadge, 
                      application.status === 'pending' && styles.statusPending,
                      application.status === 'reviewed' && styles.statusReviewed,
                      application.status === 'offered' && styles.statusOffered,
                      application.status === 'rejected' && styles.statusRejected,
                    ]}>
                      <Text style={styles.applicationStatusText}>
                        {application.status === 'pending' ? 'Pending' : 
                         application.status === 'reviewed' ? 'Reviewed' :
                         application.status === 'offered' ? 'Offered' : 'Rejected'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.coverLetter} numberOfLines={3}>{application.cover_letter}</Text>
                  
                  {application.proposed_rate && (
                    <Text style={styles.proposedRate}>
                      💰 Proposed Rate: ₱{application.proposed_rate?.toLocaleString()}
                    </Text>
                  )}

                  <View style={styles.applicationFooter}>
                    <Text style={styles.appliedDate}>
                      Applied: {formatDate(application.applied_at)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.viewProfileBtn}
                      onPress={() => handleViewApplicantProfile(application)}
                    >
                      <Ionicons name="person-outline" size={14} color={GOLD} />
                      <Text style={styles.viewProfileText}>View Profile</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const ApplicantProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showApplicantProfileModal}
      onRequestClose={() => setShowApplicantProfileModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Freelancer Profile</Text>
            <TouchableOpacity onPress={() => setShowApplicantProfileModal(false)}>
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {selectedApplicant && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                  {selectedApplicant.profile_picture ? (
                    <Image source={{ uri: selectedApplicant.profile_picture }} style={styles.profileAvatarImage} />
                  ) : (
                    <Text style={styles.profileInitials}>
                      {selectedApplicant.first_name?.[0]}{selectedApplicant.last_name?.[0]}
                    </Text>
                  )}
                </View>
                <Text style={styles.profileName}>
                  {selectedApplicant.first_name} {selectedApplicant.last_name}
                </Text>
                <Text style={styles.profileUsername}>@{selectedApplicant.username}</Text>
                
                <View style={styles.profileStats}>
                  <View style={styles.profileStat}>
                    <Ionicons name="star" size={16} color={GOLD} />
                    <Text style={styles.profileStatValue}>4.8</Text>
                    <Text style={styles.profileStatLabel}>Rating</Text>
                  </View>
                  <View style={styles.profileStatDivider} />
                  <View style={styles.profileStat}>
                    <Ionicons name="briefcase-outline" size={16} color={GOLD} />
                    <Text style={styles.profileStatValue}>{selectedApplicant.completed_projects || 0}</Text>
                    <Text style={styles.profileStatLabel}>Completed</Text>
                  </View>
                  <View style={styles.profileStatDivider} />
                  <View style={styles.profileStat}>
                    <Ionicons name="time-outline" size={16} color={GOLD} />
                    <Text style={styles.profileStatValue}>
                      {selectedApplicant.experience_level || 'Entry'}
                    </Text>
                    <Text style={styles.profileStatLabel}>Level</Text>
                  </View>
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Contact Information</Text>
                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.contactText}>{selectedApplicant.email_address}</Text>
                  </View>
                  {selectedApplicant.phone_number && (
                    <View style={styles.contactItem}>
                      <Ionicons name="call-outline" size={16} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.contactText}>{selectedApplicant.phone_number}</Text>
                    </View>
                  )}
                  {selectedApplicant.location && (
                    <View style={styles.contactItem}>
                      <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.contactText}>{selectedApplicant.location}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Skills */}
              {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>Skills</Text>
                  <View style={styles.profileSkills}>
                    {selectedApplicant.skills.map((skill, idx) => (
                      <View key={idx} style={styles.profileSkillChip}>
                        <Text style={styles.profileSkillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* About */}
              {selectedApplicant.bio_about_me && (
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>About</Text>
                  <Text style={styles.profileBio}>{selectedApplicant.bio_about_me}</Text>
                </View>
              )}

              {/* Portfolio & Links */}
              {(selectedApplicant.portfolio_link || selectedApplicant.github_link) && (
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>Portfolio & Links</Text>
                  {selectedApplicant.portfolio_link && (
                    <TouchableOpacity 
                      style={styles.linkItem}
                      onPress={() => Linking.openURL(selectedApplicant.portfolio_link)}
                    >
                      <Ionicons name="globe-outline" size={16} color={GOLD} />
                      <Text style={styles.linkText}>View Portfolio</Text>
                    </TouchableOpacity>
                  )}
                  {selectedApplicant.github_link && (
                    <TouchableOpacity 
                      style={styles.linkItem}
                      onPress={() => Linking.openURL(selectedApplicant.github_link)}
                    >
                      <Ionicons name="logo-github" size={16} color={GOLD} />
                      <Text style={styles.linkText}>GitHub Profile</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Application Details */}
              {selectedApplication && (
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>Application Details</Text>
                  <View style={styles.applicationDetail}>
                    <Text style={styles.applicationDetailLabel}>Cover Letter:</Text>
                    <Text style={styles.applicationDetailText}>{selectedApplication.cover_letter}</Text>
                  </View>
                  {selectedApplication.proposed_rate && (
                    <View style={styles.applicationDetail}>
                      <Text style={styles.applicationDetailLabel}>Proposed Rate:</Text>
                      <Text style={[styles.applicationDetailText, { color: GOLD }]}>
                        ₱{selectedApplication.proposed_rate.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.applicationDetail}>
                    <Text style={styles.applicationDetailLabel}>Applied:</Text>
                    <Text style={styles.applicationDetailText}>
                      {new Date(selectedApplication.applied_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.profileActions}>
                <TouchableOpacity 
                  style={[styles.profileActionBtn, styles.messageBtn]}
                  onPress={() => handleMessageFreelancer(selectedApplicant._id)}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                  <Text style={styles.messageBtnText}>Send Message</Text>
                </TouchableOpacity>
                
                {selectedApplication?.status === 'pending' && (
                  <TouchableOpacity 
                    style={[styles.profileActionBtn, styles.offerProfileBtn]}
                    onPress={handleSendOfferFromProfile}
                  >
                    <Ionicons name="gift-outline" size={18} color="#0a0a0a" />
                    <Text style={styles.offerProfileBtnText}>Send Offer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const OfferModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showOfferModal}
      onRequestClose={() => setShowOfferModal(false)}
    >
      <View style={styles.offerModalOverlay}>
        <View style={styles.offerModalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.offerModalHeader}>
              <Text style={styles.offerModalTitle}>Send Offer to {selectedApplication?.freelancer_id?.first_name}</Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            <Text style={styles.offerLabel}>Offer Amount *</Text>
            <TextInput
              style={styles.offerInput}
              placeholder="Enter amount"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={offerAmount}
              onChangeText={setOfferAmount}
              keyboardType="numeric"
            />

            <Text style={styles.offerLabel}>Start Date</Text>
            <TextInput
              style={styles.offerInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={startDate}
              onChangeText={setStartDate}
            />

            <Text style={styles.offerLabel}>Project Deadline</Text>
            <TextInput
              style={styles.offerInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={deadline}
              onChangeText={setDeadline}
            />

            <Text style={styles.offerLabel}>Requirements</Text>
            <TextInput
              style={[styles.offerInput, styles.offerTextArea]}
              placeholder="List down the requirements needed from the freelancer..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={requirements}
              onChangeText={setRequirements}
              multiline
              numberOfLines={6}
            />

            <Text style={styles.offerLabel}>Personal Message</Text>
            <TextInput
              style={[styles.offerInput, styles.offerTextAreaSmall]}
              placeholder="Add a personal message..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={offerMessage}
              onChangeText={setOfferMessage}
              multiline
              numberOfLines={3}
            />

            <View style={styles.offerButtons}>
              <TouchableOpacity 
                style={[styles.offerBtn, styles.offerCancelBtn]}
                onPress={() => setShowOfferModal(false)}
              >
                <Text style={styles.offerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.offerBtn, styles.offerSendBtn]}
                onPress={handleSendOffer}
              >
                <Ionicons name="send-outline" size={18} color="#0a0a0a" />
                <Text style={styles.offerSendText}>Send Offer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')}>
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>My <Text style={styles.gold}>Postings</Text></Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => onNavigate('PostJob')}>
            <Ionicons name="add" size={20} color="#0a0a0a" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>Loading your postings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>My <Text style={styles.gold}>Postings</Text></Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => onNavigate('PostJob')}>
          <Ionicons name="add" size={20} color="#0a0a0a" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'All' ? 'All' : formatStatus(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
      >
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>No job postings</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'All' 
                ? "You haven't posted any jobs yet" 
                : `No ${formatStatus(activeTab).toLowerCase()} jobs found`}
            </Text>
            <TouchableOpacity style={styles.postJobBtn} onPress={() => onNavigate('PostJob')}>
              <Text style={styles.postJobBtnText}>Post Your First Job</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredJobs.map((item) => (
            <View key={item._id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {item.job_type?.replace('_', ' ').toUpperCase() || 'JOB'}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  item.status === 'open' ? styles.statusActive : 
                  item.status === 'in_progress' ? styles.statusInProgress :
                  item.status === 'completed' ? styles.statusCompleted : styles.statusClosed
                ]}>
                  <View style={[
                    styles.statusDot, 
                    item.status === 'open' ? styles.dotActive : 
                    item.status === 'in_progress' ? styles.dotInProgress :
                    item.status === 'completed' ? styles.dotCompleted : styles.dotClosed
                  ]} />
                  <Text style={[
                    styles.statusText, 
                    item.status === 'open' ? styles.statusTextActive : 
                    item.status === 'in_progress' ? styles.statusTextInProgress :
                    item.status === 'completed' ? styles.statusTextCompleted : styles.statusTextClosed
                  ]}>
                    {formatStatus(item.status)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.jobTitle}>{item.title}</Text>
              
              {item.description && (
                <Text style={styles.jobDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              
              <View style={styles.skillsContainer}>
                {item.required_skills?.slice(0, 3).map((skill, idx) => (
                  <View key={idx} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
                {item.required_skills?.length > 3 && (
                  <Text style={styles.moreSkills}>+{item.required_skills.length - 3}</Text>
                )}
              </View>
              
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={12} color={GOLD} />
                  <Text style={styles.metaText}>{getBudgetDisplay(item)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.35)" />
                  <Text style={styles.metaText}>{item.total_applicants || 0} applicants</Text>
                </View>
                <Text style={styles.postedText}>{formatDate(item.created_at)}</Text>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={styles.workSetup}>
                  {item.work_setup?.replace('_', ' ').toUpperCase()}
                </Text>
                <TouchableOpacity 
                  style={styles.viewApplicantsBtn}
                  onPress={() => {
                    setSelectedJob(item);
                    fetchApplications(item._id);
                  }}
                >
                  <Ionicons name="people-outline" size={16} color={GOLD} />
                  <Text style={styles.viewApplicantsText}>
                    View Applicants ({item.total_applicants || 0})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ApplicantsModal />
      <ApplicantProfileModal />
      <OfferModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center',
  },
  topbarTitle: { fontSize: 16, fontWeight: '300', color: '#fff' },
  gold: { color: GOLD, fontStyle: 'italic', fontWeight: '400' },
  tabScroll: { flexGrow: 0 },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER, backgroundColor: CARD_BG,
  },
  tabActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: GOLD },
  tabText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  tabTextActive: { color: GOLD, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  card: {
    backgroundColor: CARD_BG, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: BORDER, marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  categoryBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(212,175,55,0.1)', borderRadius: 6,
    borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.3)',
  },
  categoryText: { fontSize: 10, color: GOLD, fontWeight: '600', letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5,
  },
  statusActive: { backgroundColor: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.3)' },
  statusInProgress: { backgroundColor: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.3)' },
  statusCompleted: { backgroundColor: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.3)' },
  statusClosed: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: BORDER },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#4ade80' },
  dotInProgress: { backgroundColor: GOLD },
  dotCompleted: { backgroundColor: '#60a5fa' },
  dotClosed: { backgroundColor: 'rgba(255,255,255,0.3)' },
  statusText: { fontSize: 10, fontWeight: '600' },
  statusTextActive: { color: '#4ade80' },
  statusTextInProgress: { color: GOLD },
  statusTextCompleted: { color: '#60a5fa' },
  statusTextClosed: { color: 'rgba(255,255,255,0.35)' },
  jobTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 6 },
  jobDescription: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillChip: {
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  skillText: { fontSize: 10, color: GOLD },
  moreSkills: { fontSize: 10, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  postedText: { fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  workSetup: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
  },
  viewApplicantsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: GOLD,
  },
  viewApplicantsText: {
    fontSize: 11,
    fontWeight: '600',
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
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 24,
  },
  postJobBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  postJobBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  applicationCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  applicantInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  applicantRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  applicantSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  applicantSkillChip: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  applicantSkillText: {
    fontSize: 9,
    color: GOLD,
  },
  moreSkillsText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
  },
  applicationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: 'rgba(212,175,55,0.15)',
  },
  statusReviewed: {
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  statusOffered: {
    backgroundColor: 'rgba(74,222,128,0.15)',
  },
  statusRejected: {
    backgroundColor: 'rgba(248,113,113,0.15)',
  },
  applicationStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  coverLetter: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 8,
  },
  proposedRate: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '500',
    marginBottom: 8,
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  appliedDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewProfileText: {
    fontSize: 11,
    color: GOLD,
  },
  // Applicant Profile Modal Styles
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  profileStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: BORDER,
  },
  profileSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
    marginBottom: 12,
  },
  contactInfo: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  profileSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileSkillChip: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  profileSkillText: {
    fontSize: 12,
    color: GOLD,
  },
  profileBio: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 13,
    color: GOLD,
    textDecorationLine: 'underline',
  },
  applicationDetail: {
    marginBottom: 10,
  },
  applicationDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  applicationDetailText: {
    fontSize: 13,
    color: '#fff',
  },
  profileActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  profileActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  messageBtn: {
    backgroundColor: 'rgba(96,165,250,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  messageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
  },
  offerProfileBtn: {
    backgroundColor: GOLD,
  },
  offerProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  offerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offerModalContent: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  offerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  offerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  offerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    marginTop: 12,
  },
  offerInput: {
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },
  offerTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  offerTextAreaSmall: {
    height: 80,
    textAlignVertical: 'top',
  },
  offerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  offerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  offerCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  offerCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  offerSendBtn: {
    backgroundColor: GOLD,
  },
  offerSendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
});