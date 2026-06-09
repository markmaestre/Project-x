import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, RefreshControl, Modal,
  TextInput, Image, Linking, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getClientJobs } from '../../Redux/slices/jobSlice';
import { getJobApplications, updateApplicationStatus } from '../../Redux/slices/applicationSlice';

const GREEN       = '#4ADE80';
const GREEN_DARK  = '#22C55E';
const GREEN_SOFT  = '#DCFCE7';
const GREEN_MID   = '#86EFAC';
const WHITE       = '#FFFFFF';
const OFF_WHITE   = '#F0FDF4';
const BORDER      = 'rgba(74,222,128,0.25)';
const TEXT_MAIN   = '#0F2417';
const TEXT_MUTED  = '#6B7280';
const TEXT_LIGHT  = '#9CA3AF';

const TABS = ['All', 'open', 'in_progress', 'completed', 'cancelled'];

const APPLICATION_STATUSES = [
  { value: 'pending', label: 'For Review', color: GREEN_DARK, icon: 'time-outline', nextStatus: 'reviewed' },
  { value: 'reviewed', label: 'Shortlisted', color: '#60a5fa', icon: 'star-outline', nextStatus: 'interview' },
  { value: 'interview', label: 'Interview', color: '#f59e0b', icon: 'chatbubble-outline', nextStatus: 'offered' },
  { value: 'offered', label: 'Offer Sent', color: '#4ade80', icon: 'gift-outline', nextStatus: 'hired' },
  { value: 'hired', label: 'Hired', color: '#10b981', icon: 'checkmark-circle-outline', nextStatus: null },
  { value: 'rejected', label: 'Rejected', color: '#f87171', icon: 'close-circle-outline', nextStatus: null },
];

const getStatusInfo = (status) => {
  return APPLICATION_STATUSES.find(s => s.value === status) || APPLICATION_STATUSES[0];
};

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
  const [showApplicantProfileModal, setShowApplicantProfileModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLink, setInterviewLink] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

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

  const handleUpdateStatus = async (application, newStatus) => {
    try {
      await dispatch(updateApplicationStatus({
        applicationId: application._id,
        status: newStatus
      })).unwrap();
      Alert.alert('Success', `Application status updated to ${getStatusInfo(newStatus).label}`);
      fetchApplications(selectedJob._id);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleSendInterview = async () => {
    if (!interviewDate || !interviewTime) {
      Alert.alert('Error', 'Please set interview date and time');
      return;
    }
    try {
      await dispatch(updateApplicationStatus({
        applicationId: selectedApplication._id,
        status: 'interview'
      })).unwrap();
      Alert.alert('Interview Scheduled', `Interview invitation sent to ${selectedApplicant?.first_name} ${selectedApplicant?.last_name}`);
      setShowInterviewModal(false);
      fetchApplications(selectedJob._id);
      setInterviewDate('');
      setInterviewTime('');
      setInterviewLink('');
      setInterviewNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule interview');
    }
  };

  const handleSendOffer = async (application) => {
    try {
      await dispatch(updateApplicationStatus({
        applicationId: application._id,
        status: 'offered'
      })).unwrap();
      Alert.alert('Offer Sent', `Job offer has been sent to ${application.freelancer_id?.first_name} ${application.freelancer_id?.last_name}`);
      fetchApplications(selectedJob._id);
    } catch (error) {
      Alert.alert('Error', 'Failed to send offer');
    }
  };

  const handleMarkAsHired = async (application) => {
    Alert.alert('Confirm Hire', `Hire ${application.freelancer_id?.first_name} ${application.freelancer_id?.last_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Hire',
        onPress: async () => {
          try {
            await dispatch(updateApplicationStatus({
              applicationId: application._id,
              status: 'hired'
            })).unwrap();
            Alert.alert('Success', 'Freelancer has been hired!');
            fetchApplications(selectedJob._id);
          } catch (error) {
            Alert.alert('Error', 'Failed to hire freelancer');
          }
        }
      }
    ]);
  };

  const handleReject = async (application) => {
    Alert.alert('Reject Application', `Reject ${application.freelancer_id?.first_name} ${application.freelancer_id?.last_name}'s application?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(updateApplicationStatus({
              applicationId: application._id,
              status: 'rejected'
            })).unwrap();
            Alert.alert('Application Rejected', 'The freelancer has been notified.');
            fetchApplications(selectedJob._id);
          } catch (error) {
            Alert.alert('Error', 'Failed to reject application');
          }
        }
      }
    ]);
  };

  const handleViewApplicantProfile = (application) => {
    setSelectedApplicant(application.freelancer_id);
    setSelectedApplication(application);
    setShowApplicantProfileModal(true);
  };

  const handleMessageFreelancer = (freelancerId) => {
    setShowApplicantProfileModal(false);
    onNavigate('Messages', { userId: freelancerId, userRole: 'freelancer' });
  };

  const handleOpenResume = (resumeUrl) => {
    if (resumeUrl) {
      Linking.openURL(resumeUrl);
    } else {
      Alert.alert('No Resume', 'This freelancer did not upload a resume.');
    }
  };

  const renderEducation = (education) => {
    if (!education) return null;
    return (
      <View style={styles.detailSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="school-outline" size={16} color={GREEN_DARK} />
          <Text style={styles.detailSectionTitle}>Education</Text>
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Level:</Text>
          <Text style={styles.detailValue}>{education.level || 'Not specified'}</Text>
          <Text style={styles.detailLabel}>Field of Study:</Text>
          <Text style={styles.detailValue}>{education.field_of_study || 'Not specified'}</Text>
          <Text style={styles.detailLabel}>Institution:</Text>
          <Text style={styles.detailValue}>{education.institution || 'Not specified'}</Text>
          {education.graduation_year && (
            <>
              <Text style={styles.detailLabel}>Graduation Year:</Text>
              <Text style={styles.detailValue}>{education.graduation_year}</Text>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderExperience = (experiences) => {
    if (!experiences || experiences.length === 0) return null;
    return (
      <View style={styles.detailSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="briefcase-outline" size={16} color={GREEN_DARK} />
          <Text style={styles.detailSectionTitle}>Work Experience</Text>
        </View>
        {experiences.map((exp, index) => (
          <View key={index} style={styles.detailCard}>
            <Text style={styles.detailLabel}>Job Title:</Text>
            <Text style={styles.detailValue}>{exp.job_title || 'Not specified'}</Text>
            <Text style={styles.detailLabel}>Company:</Text>
            <Text style={styles.detailValue}>{exp.company_name || 'Not specified'}</Text>
            <Text style={styles.detailLabel}>Period:</Text>
            <Text style={styles.detailValue}>
              {exp.start_date || 'Start'} - {exp.currently_working ? 'Present' : (exp.end_date || 'End')}
            </Text>
            {exp.description && (
              <>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{exp.description}</Text>
              </>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderResume = (resume) => {
    if (!resume || !resume.url) return null;
    return (
      <View style={styles.detailSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={16} color={GREEN_DARK} />
          <Text style={styles.detailSectionTitle}>Resume / CV</Text>
        </View>
        <TouchableOpacity style={styles.resumeButton} onPress={() => handleOpenResume(resume.url)}>
          <Ionicons name="document-text-outline" size={20} color={GREEN_DARK} />
          <Text style={styles.resumeButtonText}>{resume.name || 'View Resume'}</Text>
          <Ionicons name="open-outline" size={16} color={GREEN_DARK} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderActionButtons = (application) => {
    const currentStatus = application.status;
    return (
      <View style={styles.actionButtonsContainer}>
        {currentStatus === 'pending' && (
          <TouchableOpacity style={[styles.actionBtn, styles.shortlistBtn]} onPress={() => handleUpdateStatus(application, 'reviewed')}>
            <Ionicons name="star-outline" size={16} color="#60a5fa" />
            <Text style={styles.shortlistBtnText}>Shortlist</Text>
          </TouchableOpacity>
        )}
        {currentStatus === 'reviewed' && (
          <TouchableOpacity style={[styles.actionBtn, styles.interviewBtn]} onPress={() => {
            setSelectedApplication(application);
            setSelectedApplicant(application.freelancer_id);
            setShowInterviewModal(true);
          }}>
            <Ionicons name="calendar-outline" size={16} color="#f59e0b" />
            <Text style={styles.interviewBtnText}>Schedule Interview</Text>
          </TouchableOpacity>
        )}
        {currentStatus === 'interview' && (
          <TouchableOpacity style={[styles.actionBtn, styles.offerBtn]} onPress={() => handleSendOffer(application)}>
            <Ionicons name="gift-outline" size={16} color="#4ade80" />
            <Text style={styles.offerBtnText}>Send Offer</Text>
          </TouchableOpacity>
        )}
        {currentStatus === 'offered' && (
          <TouchableOpacity style={[styles.actionBtn, styles.hireBtn]} onPress={() => handleMarkAsHired(application)}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
            <Text style={styles.hireBtnText}>Mark as Hired</Text>
          </TouchableOpacity>
        )}
        {currentStatus !== 'rejected' && currentStatus !== 'hired' && currentStatus !== 'offered' && (
          <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(application)}>
            <Ionicons name="close-outline" size={16} color="#f87171" />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')}>
            <View style={styles.backIconWrap}>
              <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
            </View>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>My <Text style={styles.green}>Postings</Text></Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => onNavigate('PostJob')}>
            <View style={styles.addIconWrap}>
              <Ionicons name="add" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={GREEN_DARK} />
          <Text style={styles.loadingText}>Loading your postings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')}>
          <View style={styles.backIconWrap}>
            <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
          </View>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>My <Text style={styles.green}>Postings</Text></Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => onNavigate('PostJob')}>
          <View style={styles.addIconWrap}>
            <Ionicons name="add" size={18} color={WHITE} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_DARK} />}
      >
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="document-text-outline" size={48} color={GREEN_DARK} />
            </View>
            <Text style={styles.emptyTitle}>No job postings</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'All' ? "You haven't posted any jobs yet" : `No ${formatStatus(activeTab).toLowerCase()} jobs found`}
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
                  <Text style={styles.categoryText}>{item.job_type?.replace('_', ' ').toUpperCase() || 'JOB'}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'open' ? styles.statusActive : item.status === 'in_progress' ? styles.statusInProgress : item.status === 'completed' ? styles.statusCompleted : styles.statusClosed]}>
                  <View style={[styles.statusDot, item.status === 'open' ? styles.dotActive : item.status === 'in_progress' ? styles.dotInProgress : item.status === 'completed' ? styles.dotCompleted : styles.dotClosed]} />
                  <Text style={[styles.statusText, item.status === 'open' ? styles.statusTextActive : item.status === 'in_progress' ? styles.statusTextInProgress : item.status === 'completed' ? styles.statusTextCompleted : styles.statusTextClosed]}>
                    {formatStatus(item.status)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.jobTitle}>{item.title}</Text>
              
              {item.description && (
                <Text style={styles.jobDescription} numberOfLines={2}>{item.description}</Text>
              )}
              
              <View style={styles.skillsContainer}>
                {item.required_skills?.slice(0, 3).map((skill, idx) => (
                  <View key={idx} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
                {item.required_skills?.length > 3 && <Text style={styles.moreSkills}>+{item.required_skills.length - 3}</Text>}
              </View>
              
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={12} color={GREEN_DARK} />
                  <Text style={styles.metaText}>{getBudgetDisplay(item)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={12} color={TEXT_MUTED} />
                  <Text style={styles.metaText}>{item.total_applicants || 0} applicants</Text>
                </View>
                <Text style={styles.postedText}>{formatDate(item.created_at)}</Text>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={styles.workSetup}>{item.work_setup?.replace('_', ' ').toUpperCase()}</Text>
                <TouchableOpacity style={styles.viewApplicantsBtn} onPress={() => {
                  setSelectedJob(item);
                  fetchApplications(item._id);
                }}>
                  <Ionicons name="people-outline" size={16} color={GREEN_DARK} />
                  <Text style={styles.viewApplicantsText}>View Applicants ({item.total_applicants || 0})</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Applicants Modal */}
      <Modal animationType="slide" transparent={true} visible={showApplicantsModal} onRequestClose={() => setShowApplicantsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Applicants - {selectedJob?.title}</Text>
              <TouchableOpacity onPress={() => setShowApplicantsModal(false)}>
                <Ionicons name="close" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            {loadingApplications ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={GREEN_DARK} />
                <Text style={styles.loadingText}>Loading applications...</Text>
              </View>
            ) : applications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={TEXT_LIGHT} />
                <Text style={styles.emptyTitle}>No applications yet</Text>
                <Text style={styles.emptyText}>Freelancers will appear here when they apply</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {applications.map((application) => {
                  const statusInfo = getStatusInfo(application.status);
                  return (
                    <TouchableOpacity key={application._id} style={styles.applicationCard} onPress={() => handleViewApplicantProfile(application)} activeOpacity={0.7}>
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
                          <Text style={styles.applicantName}>{application.freelancer_id?.first_name} {application.freelancer_id?.last_name}</Text>
                          <Text style={styles.applicantRole}>{application.freelancer_id?.experience_level || 'Freelancer'}</Text>
                          <View style={styles.applicantSkills}>
                            {application.freelancer_id?.skills?.slice(0, 2).map((skill, idx) => (
                              <View key={idx} style={styles.applicantSkillChip}>
                                <Text style={styles.applicantSkillText}>{skill}</Text>
                              </View>
                            ))}
                            {application.freelancer_id?.skills?.length > 2 && <Text style={styles.moreSkillsText}>+{application.freelancer_id.skills.length - 2}</Text>}
                          </View>
                        </View>
                        <View style={[styles.applicationStatusBadge, { backgroundColor: `${statusInfo.color}15`, borderColor: `${statusInfo.color}30` }]}>
                          <Ionicons name={statusInfo.icon} size={10} color={statusInfo.color} />
                          <Text style={[styles.applicationStatusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.coverLetter} numberOfLines={2}>{application.cover_letter}</Text>
                      {application.proposed_rate && <Text style={styles.proposedRate}>Proposed Rate: ₱{application.proposed_rate?.toLocaleString()}</Text>}
                      <View style={styles.applicationFooter}>
                        <Text style={styles.appliedDate}>Applied: {formatDate(application.applied_at)}</Text>
                        <TouchableOpacity style={styles.viewProfileBtn} onPress={() => handleViewApplicantProfile(application)}>
                          <Ionicons name="person-outline" size={14} color={GREEN_DARK} />
                          <Text style={styles.viewProfileText}>View Full Profile</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Applicant Profile Modal */}
      <Modal animationType="slide" transparent={true} visible={showApplicantProfileModal} onRequestClose={() => setShowApplicantProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Freelancer Profile</Text>
              <TouchableOpacity onPress={() => setShowApplicantProfileModal(false)}>
                <Ionicons name="close" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            {selectedApplicant && selectedApplication && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                  <View style={styles.profileAvatar}>
                    {selectedApplicant.profile_picture ? (
                      <Image source={{ uri: selectedApplicant.profile_picture }} style={styles.profileAvatarImage} />
                    ) : (
                      <Text style={styles.profileInitials}>{selectedApplicant.first_name?.[0]}{selectedApplicant.last_name?.[0]}</Text>
                    )}
                  </View>
                  <Text style={styles.profileName}>{selectedApplicant.first_name} {selectedApplicant.last_name}</Text>
                  <Text style={styles.profileUsername}>@{selectedApplicant.username}</Text>
                  <View style={[styles.profileStatusBadge, { backgroundColor: `${getStatusInfo(selectedApplication.status).color}15` }]}>
                    <Ionicons name={getStatusInfo(selectedApplication.status).icon} size={14} color={getStatusInfo(selectedApplication.status).color} />
                    <Text style={[styles.profileStatusText, { color: getStatusInfo(selectedApplication.status).color }]}>{getStatusInfo(selectedApplication.status).label}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="call-outline" size={16} color={GREEN_DARK} />
                    <Text style={styles.detailSectionTitle}>Contact Information</Text>
                  </View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedApplicant.email_address}</Text>
                    {selectedApplicant.phone_number && (
                      <>
                        <Text style={styles.detailLabel}>Phone:</Text>
                        <Text style={styles.detailValue}>{selectedApplicant.phone_number}</Text>
                      </>
                    )}
                    {selectedApplicant.location && (
                      <>
                        <Text style={styles.detailLabel}>Location:</Text>
                        <Text style={styles.detailValue}>{selectedApplicant.location}</Text>
                      </>
                    )}
                  </View>
                </View>

                {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="flash-outline" size={16} color={GREEN_DARK} />
                      <Text style={styles.detailSectionTitle}>Skills</Text>
                    </View>
                    <View style={styles.skillsContainerProfile}>
                      {selectedApplicant.skills.map((skill, idx) => (
                        <View key={idx} style={styles.profileSkillChip}>
                          <Text style={styles.profileSkillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedApplicant.bio_about_me && (
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="information-circle-outline" size={16} color={GREEN_DARK} />
                      <Text style={styles.detailSectionTitle}>About</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailValue}>{selectedApplicant.bio_about_me}</Text>
                    </View>
                  </View>
                )}

                {renderResume(selectedApplication.resume)}
                {renderEducation(selectedApplication.education)}
                {renderExperience(selectedApplication.experiences)}

                <View style={styles.detailSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="mail-outline" size={16} color={GREEN_DARK} />
                    <Text style={styles.detailSectionTitle}>Cover Letter</Text>
                  </View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailValue}>{selectedApplication.cover_letter}</Text>
                  </View>
                </View>

                {selectedApplication.proposed_rate && (
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="cash-outline" size={16} color={GREEN_DARK} />
                      <Text style={styles.detailSectionTitle}>Rate</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={[styles.detailValue, { color: GREEN_DARK, fontSize: 16, fontWeight: 'bold' }]}>
                        ₱{selectedApplication.proposed_rate.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}

                {renderActionButtons(selectedApplication)}

                <TouchableOpacity style={styles.messageFreelancerBtn} onPress={() => handleMessageFreelancer(selectedApplicant._id)}>
                  <Ionicons name="chatbubble-outline" size={18} color={GREEN_DARK} />
                  <Text style={styles.messageFreelancerBtnText}>Message Freelancer</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Interview Modal */}
      <Modal animationType="slide" transparent={true} visible={showInterviewModal} onRequestClose={() => setShowInterviewModal(false)}>
        <View style={styles.offerModalOverlay}>
          <View style={styles.offerModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.offerModalHeader}>
                <Text style={styles.offerModalTitle}>Schedule Interview</Text>
                <TouchableOpacity onPress={() => setShowInterviewModal(false)}>
                  <Ionicons name="close" size={24} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>
              <Text style={styles.offerLabel}>Interview Date *</Text>
              <TextInput style={styles.offerInput} placeholder="e.g., December 15, 2024" placeholderTextColor={TEXT_LIGHT} value={interviewDate} onChangeText={setInterviewDate} />
              <Text style={styles.offerLabel}>Interview Time *</Text>
              <TextInput style={styles.offerInput} placeholder="e.g., 2:00 PM (GMT+8)" placeholderTextColor={TEXT_LIGHT} value={interviewTime} onChangeText={setInterviewTime} />
              <Text style={styles.offerLabel}>Video Call Link (Optional)</Text>
              <TextInput style={styles.offerInput} placeholder="Zoom, Google Meet, etc." placeholderTextColor={TEXT_LIGHT} value={interviewLink} onChangeText={setInterviewLink} />
              <Text style={styles.offerLabel}>Additional Notes (Optional)</Text>
              <TextInput style={[styles.offerInput, styles.offerTextArea]} placeholder="Add any instructions or notes for the interview..." placeholderTextColor={TEXT_LIGHT} value={interviewNotes} onChangeText={setInterviewNotes} multiline numberOfLines={4} />
              <View style={styles.offerButtons}>
                <TouchableOpacity style={[styles.offerBtn, styles.offerCancelBtn]} onPress={() => setShowInterviewModal(false)}>
                  <Text style={styles.offerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.offerBtn, styles.offerSendBtn]} onPress={handleSendInterview}>
                  <Ionicons name="calendar-outline" size={18} color={TEXT_MAIN} />
                  <Text style={styles.offerSendText}>Send Invitation</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OFF_WHITE },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { alignSelf: 'flex-start' },
  backIconWrap: {
    width: 38, height: 38,
    backgroundColor: WHITE,
    borderRadius: 11,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  addBtn: { alignSelf: 'flex-start' },
  addIconWrap: {
    width: 38, height: 38,
    backgroundColor: GREEN_DARK,
    borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  topbarTitle: { fontSize: 16, fontWeight: '600', color: TEXT_MAIN },
  green: { color: GREEN_DARK, fontStyle: 'italic', fontWeight: '700' },
  tabScroll: { flexGrow: 0 },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE,
  },
  tabActive: { backgroundColor: GREEN_SOFT, borderColor: GREEN_DARK },
  tabText: { fontSize: 12, color: TEXT_MUTED },
  tabTextActive: { color: GREEN_DARK, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: TEXT_MUTED },
  card: {
    backgroundColor: WHITE, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: BORDER, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  categoryBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: GREEN_SOFT, borderRadius: 6,
    borderWidth: 0.5, borderColor: GREEN_MID,
  },
  categoryText: { fontSize: 10, color: GREEN_DARK, fontWeight: '600', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5 },
  statusActive: { backgroundColor: `${GREEN}15`, borderColor: `${GREEN}30` },
  statusInProgress: { backgroundColor: `${GREEN_DARK}15`, borderColor: `${GREEN_DARK}30` },
  statusCompleted: { backgroundColor: '#60a5fa15', borderColor: '#60a5fa30' },
  statusClosed: { backgroundColor: `${TEXT_MUTED}15`, borderColor: `${TEXT_MUTED}30` },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#4ade80' },
  dotInProgress: { backgroundColor: GREEN_DARK },
  dotCompleted: { backgroundColor: '#60a5fa' },
  dotClosed: { backgroundColor: TEXT_MUTED },
  statusText: { fontSize: 10, fontWeight: '600' },
  statusTextActive: { color: '#4ade80' },
  statusTextInProgress: { color: GREEN_DARK },
  statusTextCompleted: { color: '#60a5fa' },
  statusTextClosed: { color: TEXT_MUTED },
  jobTitle: { fontSize: 14, fontWeight: '600', color: TEXT_MAIN, marginBottom: 6 },
  jobDescription: { fontSize: 12, color: TEXT_MUTED, marginBottom: 10 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillChip: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: GREEN_SOFT, borderRadius: 4, borderWidth: 0.5, borderColor: GREEN_MID },
  skillText: { fontSize: 10, color: GREEN_DARK, fontWeight: '500' },
  moreSkills: { fontSize: 10, color: TEXT_MUTED, alignSelf: 'center' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: TEXT_MUTED },
  postedText: { fontSize: 11, color: TEXT_LIGHT, marginLeft: 'auto' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  workSetup: { fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase' },
  viewApplicantsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN_SOFT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 0.5, borderColor: GREEN_MID },
  viewApplicantsText: { fontSize: 11, fontWeight: '600', color: GREEN_DARK },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconWrap: { width: 80, height: 80, backgroundColor: GREEN_SOFT, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: TEXT_MAIN, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginBottom: 24 },
  postJobBtn: { backgroundColor: GREEN_DARK, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  postJobBtnText: { fontSize: 13, fontWeight: '600', color: WHITE },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: WHITE, borderRadius: 16, width: '100%', maxHeight: '85%', borderWidth: 1, borderColor: BORDER },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalTitle: { fontSize: 18, fontWeight: '600', color: TEXT_MAIN },
  applicationCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  applicantHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  applicantAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: GREEN_DARK, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  applicantInitials: { fontSize: 18, fontWeight: '700', color: WHITE },
  applicantInfo: { flex: 1 },
  applicantName: { fontSize: 16, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
  applicantRole: { fontSize: 12, color: TEXT_MUTED, marginBottom: 4 },
  applicantSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  applicantSkillChip: { backgroundColor: GREEN_SOFT, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  applicantSkillText: { fontSize: 9, color: GREEN_DARK, fontWeight: '500' },
  moreSkillsText: { fontSize: 9, color: TEXT_MUTED, alignSelf: 'center' },
  applicationStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 0.5 },
  applicationStatusText: { fontSize: 10, fontWeight: '600' },
  coverLetter: { fontSize: 13, color: TEXT_MUTED, lineHeight: 18, marginBottom: 8 },
  proposedRate: { fontSize: 12, color: GREEN_DARK, fontWeight: '500', marginBottom: 8 },
  applicationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  appliedDate: { fontSize: 10, color: TEXT_LIGHT },
  viewProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewProfileText: { fontSize: 11, color: GREEN_DARK },
  profileHeader: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN_DARK, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileAvatarImage: { width: 80, height: 80, borderRadius: 40 },
  profileInitials: { fontSize: 32, fontWeight: '700', color: WHITE },
  profileName: { fontSize: 20, fontWeight: '600', color: TEXT_MAIN, marginBottom: 4 },
  profileUsername: { fontSize: 13, color: TEXT_MUTED, marginBottom: 12 },
  profileStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
  profileStatusText: { fontSize: 12, fontWeight: '600' },
  detailSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  detailSectionTitle: { fontSize: 14, fontWeight: '600', color: GREEN_DARK },
  detailCard: { backgroundColor: OFF_WHITE, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  detailLabel: { fontSize: 11, fontWeight: '500', color: TEXT_MUTED, marginTop: 6, marginBottom: 2 },
  detailValue: { fontSize: 13, color: TEXT_MAIN, marginBottom: 4 },
  skillsContainerProfile: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  profileSkillChip: { backgroundColor: GREEN_SOFT, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 0.5, borderColor: GREEN_MID },
  profileSkillText: { fontSize: 12, color: GREEN_DARK, fontWeight: '500' },
  resumeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN_SOFT, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 0.5, borderColor: GREEN_MID },
  resumeButtonText: { flex: 1, fontSize: 13, color: GREEN_DARK },
  actionButtonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, minWidth: 100 },
  shortlistBtn: { backgroundColor: '#60a5fa15', borderWidth: 1, borderColor: '#60a5fa30' },
  shortlistBtnText: { fontSize: 12, fontWeight: '600', color: '#60a5fa' },
  interviewBtn: { backgroundColor: '#f59e0b15', borderWidth: 1, borderColor: '#f59e0b30' },
  interviewBtnText: { fontSize: 12, fontWeight: '600', color: '#f59e0b' },
  offerBtn: { backgroundColor: `${GREEN}15`, borderWidth: 1, borderColor: `${GREEN}30` },
  offerBtnText: { fontSize: 12, fontWeight: '600', color: '#4ade80' },
  hireBtn: { backgroundColor: '#10b98115', borderWidth: 1, borderColor: '#10b98130' },
  hireBtnText: { fontSize: 12, fontWeight: '600', color: '#10b981' },
  rejectBtn: { backgroundColor: '#f8717115', borderWidth: 1, borderColor: '#f8717130' },
  rejectBtnText: { fontSize: 12, fontWeight: '600', color: '#f87171' },
  messageFreelancerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN_SOFT, paddingVertical: 14, borderRadius: 10, margin: 16, borderWidth: 0.5, borderColor: GREEN_MID },
  messageFreelancerBtnText: { fontSize: 14, fontWeight: '600', color: GREEN_DARK },
  offerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  offerModalContent: { backgroundColor: WHITE, borderRadius: 16, padding: 20, width: '100%', maxHeight: '85%', borderWidth: 1, borderColor: BORDER },
  offerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: BORDER },
  offerModalTitle: { fontSize: 18, fontWeight: '600', color: TEXT_MAIN, flex: 1 },
  offerLabel: { fontSize: 12, fontWeight: '500', color: TEXT_MUTED, marginBottom: 8, marginTop: 12 },
  offerInput: { backgroundColor: OFF_WHITE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: TEXT_MAIN, fontSize: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  offerTextArea: { height: 100, textAlignVertical: 'top' },
  offerButtons: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 10 },
  offerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  offerCancelBtn: { backgroundColor: OFF_WHITE, borderWidth: 1, borderColor: BORDER },
  offerCancelText: { fontSize: 14, fontWeight: '600', color: TEXT_MUTED },
  offerSendBtn: { backgroundColor: GREEN_DARK },
  offerSendText: { fontSize: 14, fontWeight: '600', color: WHITE },
});