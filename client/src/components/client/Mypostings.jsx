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

// Application status flow
const APPLICATION_STATUSES = [
  { value: 'pending', label: 'For Review', color: GOLD, icon: 'time-outline', nextStatus: 'reviewed' },
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
  const [showResumeModal, setShowResumeModal] = useState(false);
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

  // Update application status (For Review -> Shortlisted -> Interview -> Offer -> Hired)
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

  // Send interview invitation
  const handleSendInterview = async () => {
    if (!interviewDate || !interviewTime) {
      Alert.alert('Error', 'Please set interview date and time');
      return;
    }

    try {
      // First update status to interview
      await dispatch(updateApplicationStatus({
        applicationId: selectedApplication._id,
        status: 'interview'
      })).unwrap();
      
      // Here you would send an actual notification/message to the freelancer
      Alert.alert(
        'Interview Scheduled', 
        `Interview invitation sent to ${selectedApplicant?.first_name} ${selectedApplicant?.last_name}\n\nDate: ${interviewDate}\nTime: ${interviewTime}\n${interviewLink ? `Link: ${interviewLink}` : ''}`,
        [{ text: 'OK', onPress: () => {
          setShowInterviewModal(false);
          fetchApplications(selectedJob._id);
          setInterviewDate('');
          setInterviewTime('');
          setInterviewLink('');
          setInterviewNotes('');
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule interview');
    }
  };

  // Send job offer
  const handleSendOffer = async (application) => {
    try {
      await dispatch(updateApplicationStatus({
        applicationId: application._id,
        status: 'offered'
      })).unwrap();
      
      Alert.alert(
        'Offer Sent', 
        `Job offer has been sent to ${application.freelancer_id?.first_name} ${application.freelancer_id?.last_name}. They will be notified.`,
        [{ text: 'OK' }]
      );
      fetchApplications(selectedJob._id);
    } catch (error) {
      Alert.alert('Error', 'Failed to send offer');
    }
  };

  // Handle mark as hired
  const handleMarkAsHired = async (application) => {
    Alert.alert(
      'Confirm Hire',
      `Are you sure you want to hire ${application.freelancer_id?.first_name} ${application.freelancer_id?.last_name}?`,
      [
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
      ]
    );
  };

  // Handle reject application
  const handleReject = async (application) => {
    Alert.alert(
      'Reject Application',
      `Are you sure you want to reject ${application.freelancer_id?.first_name} ${application.freelancer_id?.last_name}'s application?`,
      [
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
      ]
    );
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

  // Render Education Section
  const renderEducation = (education) => {
    if (!education) return null;
    return (
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>🎓 Education</Text>
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

  // Render Experience Section
  const renderExperience = (experiences) => {
    if (!experiences || experiences.length === 0) return null;
    return (
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>💼 Work Experience</Text>
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

  // Render Resume Section
  const renderResume = (resume) => {
    if (!resume || !resume.url) return null;
    return (
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📄 Resume/CV</Text>
        <TouchableOpacity 
          style={styles.resumeButton}
          onPress={() => handleOpenResume(resume.url)}
        >
          <Ionicons name="document-text-outline" size={20} color={GOLD} />
          <Text style={styles.resumeButtonText}>{resume.name || 'View Resume'}</Text>
          <Ionicons name="open-outline" size={16} color={GOLD} />
        </TouchableOpacity>
      </View>
    );
  };

  // Action buttons based on current status
  const renderActionButtons = (application) => {
    const currentStatus = application.status;
    const statusInfo = getStatusInfo(currentStatus);
    
    return (
      <View style={styles.actionButtonsContainer}>
        {currentStatus === 'pending' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.shortlistBtn]}
            onPress={() => handleUpdateStatus(application, 'reviewed')}
          >
            <Ionicons name="star-outline" size={16} color="#60a5fa" />
            <Text style={styles.shortlistBtnText}>Shortlist</Text>
          </TouchableOpacity>
        )}
        
        {currentStatus === 'reviewed' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.interviewBtn]}
            onPress={() => {
              setSelectedApplication(application);
              setSelectedApplicant(application.freelancer_id);
              setShowInterviewModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={16} color="#f59e0b" />
            <Text style={styles.interviewBtnText}>Schedule Interview</Text>
          </TouchableOpacity>
        )}
        
        {currentStatus === 'interview' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.offerBtn]}
            onPress={() => handleSendOffer(application)}
          >
            <Ionicons name="gift-outline" size={16} color="#4ade80" />
            <Text style={styles.offerBtnText}>Send Offer</Text>
          </TouchableOpacity>
        )}
        
        {currentStatus === 'offered' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.hireBtn]}
            onPress={() => handleMarkAsHired(application)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
            <Text style={styles.hireBtnText}>Mark as Hired</Text>
          </TouchableOpacity>
        )}
        
        {currentStatus !== 'rejected' && currentStatus !== 'hired' && currentStatus !== 'offered' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleReject(application)}
          >
            <Ionicons name="close-outline" size={16} color="#f87171" />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Applicants Modal
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
              {applications.map((application) => {
                const statusInfo = getStatusInfo(application.status);
                return (
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
                        { backgroundColor: `${statusInfo.color}15`, borderColor: `${statusInfo.color}30` }
                      ]}>
                        <Ionicons name={statusInfo.icon} size={10} color={statusInfo.color} />
                        <Text style={[styles.applicationStatusText, { color: statusInfo.color }]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.coverLetter} numberOfLines={2}>{application.cover_letter}</Text>
                    
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
  );

  // Applicant Profile Modal with FULL Application Details
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

          {selectedApplicant && selectedApplication && (
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
                
                {/* Status Badge */}
                <View style={[
                  styles.profileStatusBadge,
                  { backgroundColor: `${getStatusInfo(selectedApplication.status).color}15` }
                ]}>
                  <Ionicons name={getStatusInfo(selectedApplication.status).icon} size={14} color={getStatusInfo(selectedApplication.status).color} />
                  <Text style={[styles.profileStatusText, { color: getStatusInfo(selectedApplication.status).color }]}>
                    {getStatusInfo(selectedApplication.status).label}
                  </Text>
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>📞 Contact Information</Text>
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

              {/* Skills */}
              {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>⚡ Skills</Text>
                  <View style={styles.skillsContainerProfile}>
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
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>📝 About</Text>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailValue}>{selectedApplicant.bio_about_me}</Text>
                  </View>
                </View>
              )}

              {/* RESUME - Most Important */}
              {renderResume(selectedApplication.resume)}

              {/* EDUCATION - From Application */}
              {renderEducation(selectedApplication.education)}

              {/* EXPERIENCE - From Application */}
              {renderExperience(selectedApplication.experiences)}

              {/* Cover Letter */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>📧 Cover Letter</Text>
                <View style={styles.detailCard}>
                  <Text style={styles.detailValue}>{selectedApplication.cover_letter}</Text>
                </View>
              </View>

              {/* Proposed Rate */}
              {selectedApplication.proposed_rate && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>💰 Rate</Text>
                  <View style={styles.detailCard}>
                    <Text style={[styles.detailValue, { color: GOLD, fontSize: 16, fontWeight: 'bold' }]}>
                      ₱{selectedApplication.proposed_rate.toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons based on status */}
              {renderActionButtons(selectedApplication)}

              {/* Message Button */}
              <TouchableOpacity 
                style={styles.messageFreelancerBtn}
                onPress={() => handleMessageFreelancer(selectedApplicant._id)}
              >
                <Ionicons name="chatbubble-outline" size={18} color={GOLD} />
                <Text style={styles.messageFreelancerBtnText}>Message Freelancer</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // Interview Modal
  const InterviewModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showInterviewModal}
      onRequestClose={() => setShowInterviewModal(false)}
    >
      <View style={styles.offerModalOverlay}>
        <View style={styles.offerModalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.offerModalHeader}>
              <Text style={styles.offerModalTitle}>Schedule Interview</Text>
              <TouchableOpacity onPress={() => setShowInterviewModal(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            <Text style={styles.offerLabel}>Interview Date *</Text>
            <TextInput
              style={styles.offerInput}
              placeholder="e.g., December 15, 2024"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={interviewDate}
              onChangeText={setInterviewDate}
            />

            <Text style={styles.offerLabel}>Interview Time *</Text>
            <TextInput
              style={styles.offerInput}
              placeholder="e.g., 2:00 PM (GMT+8)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={interviewTime}
              onChangeText={setInterviewTime}
            />

            <Text style={styles.offerLabel}>Video Call Link (Optional)</Text>
            <TextInput
              style={styles.offerInput}
              placeholder="Zoom, Google Meet, etc."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={interviewLink}
              onChangeText={setInterviewLink}
            />

            <Text style={styles.offerLabel}>Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.offerInput, styles.offerTextArea]}
              placeholder="Add any instructions or notes for the interview..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={interviewNotes}
              onChangeText={setInterviewNotes}
              multiline
              numberOfLines={4}
            />

            <View style={styles.offerButtons}>
              <TouchableOpacity 
                style={[styles.offerBtn, styles.offerCancelBtn]}
                onPress={() => setShowInterviewModal(false)}
              >
                <Text style={styles.offerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.offerBtn, styles.offerSendBtn]}
                onPress={handleSendInterview}
              >
                <Ionicons name="calendar-outline" size={18} color="#0a0a0a" />
                <Text style={styles.offerSendText}>Send Invitation</Text>
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
      <InterviewModal />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  applicationStatusText: {
    fontSize: 10,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  profileStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  profileStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
  },
  skillsContainerProfile: {
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
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  resumeButtonText: {
    flex: 1,
    fontSize: 13,
    color: GOLD,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  shortlistBtn: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  shortlistBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60a5fa',
  },
  interviewBtn: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  interviewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  offerBtn: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
  },
  offerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ade80',
  },
  hireBtn: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  hireBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  rejectBtn: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f87171',
  },
  messageFreelancerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingVertical: 14,
    borderRadius: 10,
    margin: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  messageFreelancerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
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