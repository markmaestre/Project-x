import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, RefreshControl, Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getClientJobs, deleteJob, updateJobStatus, updateJob } from '../../Redux/slices/jobSlice';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';

const TABS = ['All', 'open', 'in_progress', 'completed', 'cancelled'];

// Job Types
const JOB_TYPES = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'One Time', value: 'one_time' },
];

// Work Setup
const WORK_SETUPS = [
  { label: 'Remote', value: 'remote' },
  { label: 'Onsite', value: 'onsite' },
  { label: 'Hybrid', value: 'hybrid' },
];

// Urgency Levels
const URGENCY_LEVELS = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'Urgent', value: 'urgent' },
];

// Experience Levels
const EXPERIENCE_LEVELS = [
  { label: 'Entry', value: 'Entry' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Expert', value: 'Expert' },
  { label: 'Senior', value: 'Senior' },
];

// Budget Types
const BUDGET_TYPES = [
  { label: 'Fixed Price', value: 'fixed' },
  { label: 'Hourly Rate', value: 'hourly' },
];

// Helper function to format status display
const formatStatus = (status) => {
  const statusMap = {
    'open': 'Open',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
};

// Helper function to get budget display
const getBudgetDisplay = (job) => {
  if (job.budget_type === 'hourly') {
    return `₱${job.budget_amount}/hr`;
  } else {
    return `₱${job.budget_amount.toLocaleString()}`;
  }
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

export default function MyPostingsScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { clientJobs, isLoading, updateJobSuccess } = useSelector((state) => state.jobs.jobs);
  const { token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    required_skills: [],
    job_type: 'one_time',
    work_setup: 'remote',
    urgency_level: 'normal',
    experience_level: '',
    budget_type: 'fixed',
    budget_amount: '',
    estimated_duration: '',
    contact_preference: 'chat',
  });
  const [skillInput, setSkillInput] = useState('');

  // Fetch jobs when screen loads
  useEffect(() => {
    fetchJobs();
  }, []);

  // Close modal when update is successful
  useEffect(() => {
    if (updateJobSuccess) {
      setEditModalVisible(false);
      fetchJobs();
    }
  }, [updateJobSuccess]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, []);

  // Filter jobs based on active tab
  const filteredJobs = clientJobs.filter((job) =>
    activeTab === 'All' ? true : job.status === activeTab
  );

  // Handle delete job
  const handleDeleteJob = (jobId) => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job posting? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteJob(jobId)).unwrap();
              Alert.alert('Success', 'Job deleted successfully');
              fetchJobs();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete job');
            }
          }
        }
      ]
    );
  };

  // Handle update job status
  const handleUpdateStatus = (jobId, newStatus) => {
    Alert.alert(
      'Update Status',
      `Change job status to ${formatStatus(newStatus)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await dispatch(updateJobStatus({ jobId, status: newStatus })).unwrap();
              Alert.alert('Success', `Job status updated to ${formatStatus(newStatus)}`);
              fetchJobs();
            } catch (error) {
              Alert.alert('Error', 'Failed to update job status');
            }
          }
        }
      ]
    );
  };

  // Open edit modal
  const openEditModal = (job) => {
    setEditingJob(job);
    setEditFormData({
      title: job.title,
      description: job.description,
      required_skills: job.required_skills || [],
      job_type: job.job_type || 'one_time',
      work_setup: job.work_setup || 'remote',
      urgency_level: job.urgency_level || 'normal',
      experience_level: job.experience_level || '',
      budget_type: job.budget_type || 'fixed',
      budget_amount: job.budget_amount?.toString() || '',
      estimated_duration: job.estimated_duration || '',
      contact_preference: job.contact_preference || 'chat',
    });
    setSkillInput('');
    setEditModalVisible(true);
  };

  // Open view details modal
  const openViewModal = (job) => {
    setSelectedJob(job);
    setViewModalVisible(true);
  };

  // Add skill to edit form
  const addSkill = () => {
    if (skillInput.trim() && !editFormData.required_skills.includes(skillInput.trim())) {
      setEditFormData({
        ...editFormData,
        required_skills: [...editFormData.required_skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  // Remove skill from edit form
  const removeSkill = (skill) => {
    setEditFormData({
      ...editFormData,
      required_skills: editFormData.required_skills.filter(s => s !== skill)
    });
  };

  // Save edited job
  const saveEditJob = async () => {
    if (!editFormData.title.trim()) {
      Alert.alert('Error', 'Job title is required');
      return;
    }
    if (!editFormData.description.trim()) {
      Alert.alert('Error', 'Job description is required');
      return;
    }
    if (!editFormData.budget_amount || parseFloat(editFormData.budget_amount) <= 0) {
      Alert.alert('Error', 'Valid budget amount is required');
      return;
    }

    const updatedData = {
      title: editFormData.title.trim(),
      description: editFormData.description.trim(),
      required_skills: editFormData.required_skills,
      job_type: editFormData.job_type,
      work_setup: editFormData.work_setup,
      urgency_level: editFormData.urgency_level,
      experience_level: editFormData.experience_level || null,
      budget_type: editFormData.budget_type,
      budget_amount: parseFloat(editFormData.budget_amount),
      estimated_duration: editFormData.estimated_duration.trim() || null,
      contact_preference: editFormData.contact_preference,
    };

    try {
      await dispatch(updateJob({ jobId: editingJob._id, jobData: updatedData })).unwrap();
      Alert.alert('Success', 'Job updated successfully');
      setEditModalVisible(false);
      fetchJobs();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update job');
    }
  };

  // Show action menu for a job
  const showJobActions = (job) => {
    Alert.alert(
      job.title,
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Details', onPress: () => openViewModal(job) },
        { text: 'Edit Job', onPress: () => openEditModal(job) },
        ...(job.status === 'open' ? [
          { text: 'Mark In Progress', onPress: () => handleUpdateStatus(job._id, 'in_progress') }
        ] : []),
        ...(job.status === 'in_progress' ? [
          { text: 'Mark Completed', onPress: () => handleUpdateStatus(job._id, 'completed') }
        ] : []),
        ...(job.status === 'open' || job.status === 'in_progress' ? [
          { text: 'Cancel Job', onPress: () => handleUpdateStatus(job._id, 'cancelled') }
        ] : []),
        { text: 'Delete Job', style: 'destructive', onPress: () => handleDeleteJob(job._id) }
      ]
    );
  };

  // Render loading state
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>My <Text style={styles.gold}>Postings</Text></Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => onNavigate('PostJob')} activeOpacity={0.7}>
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
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>My <Text style={styles.gold}>Postings</Text></Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => onNavigate('PostJob')} activeOpacity={0.7}>
          <Ionicons name="add" size={20} color="#0a0a0a" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
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
            <TouchableOpacity 
              style={styles.postJobBtn}
              onPress={() => onNavigate('PostJob')}
            >
              <Text style={styles.postJobBtnText}>Post Your First Job</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredJobs.map((item) => (
            <TouchableOpacity 
              key={item._id} 
              style={styles.card} 
              activeOpacity={0.75}
              onPress={() => showJobActions(item)}
            >
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
                <Text style={styles.postedText}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={styles.workSetup}>
                  {item.work_setup?.replace('_', ' ').toUpperCase()}
                </Text>
                <View style={styles.actionIcons}>
                  <TouchableOpacity onPress={() => openViewModal(item)}>
                    <Ionicons name="eye-outline" size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEditModal(item)}>
                    <Ionicons name="create-outline" size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteJob(item._id)}>
                    <Ionicons name="trash-outline" size={18} color="rgba(255,107,107,0.6)" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* View Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={viewModalVisible}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Job Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedJob && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Job Title</Text>
                    <Text style={styles.detailValue}>{selectedJob.title}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedJob.description}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Required Skills</Text>
                    <View style={styles.detailSkillsContainer}>
                      {selectedJob.required_skills?.map((skill, idx) => (
                        <View key={idx} style={styles.detailSkillChip}>
                          <Text style={styles.detailSkillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Job Type</Text>
                      <Text style={styles.detailValue}>
                        {JOB_TYPES.find(t => t.value === selectedJob.job_type)?.label || selectedJob.job_type}
                      </Text>
                    </View>
                    <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Work Setup</Text>
                      <Text style={styles.detailValue}>
                        {WORK_SETUPS.find(w => w.value === selectedJob.work_setup)?.label || selectedJob.work_setup}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Urgency Level</Text>
                      <Text style={styles.detailValue}>
                        {URGENCY_LEVELS.find(u => u.value === selectedJob.urgency_level)?.label || selectedJob.urgency_level}
                      </Text>
                    </View>
                    <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Experience Level</Text>
                      <Text style={styles.detailValue}>
                        {selectedJob.experience_level || 'Not specified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Budget Type</Text>
                      <Text style={styles.detailValue}>
                        {BUDGET_TYPES.find(b => b.value === selectedJob.budget_type)?.label || selectedJob.budget_type}
                      </Text>
                    </View>
                    <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Budget Amount</Text>
                      <Text style={[styles.detailValue, { color: GOLD }]}>
                        {getBudgetDisplay(selectedJob)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Estimated Duration</Text>
                    <Text style={styles.detailValue}>
                      {selectedJob.estimated_duration || 'Not specified'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Contact Preference</Text>
                    <Text style={styles.detailValue}>
                      {selectedJob.contact_preference?.charAt(0).toUpperCase() + selectedJob.contact_preference?.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[styles.detailValue, { color: selectedJob.status === 'open' ? '#4ade80' : GOLD }]}>
                      {formatStatus(selectedJob.status)}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Total Applicants</Text>
                    <Text style={styles.detailValue}>{selectedJob.total_applicants || 0}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.closeModalBtn}
                    onPress={() => setViewModalVisible(false)}
                  >
                    <Text style={styles.closeModalBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Job Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Job</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.editLabel}>Job Title *</Text>
              <TextInput
                style={styles.editInput}
                value={editFormData.title}
                onChangeText={(text) => setEditFormData({...editFormData, title: text})}
                placeholderTextColor="rgba(255,255,255,0.2)"
              />

              <Text style={styles.editLabel}>Description *</Text>
              <TextInput
                style={[styles.editInput, styles.textArea]}
                value={editFormData.description}
                onChangeText={(text) => setEditFormData({...editFormData, description: text})}
                multiline
                numberOfLines={4}
                placeholderTextColor="rgba(255,255,255,0.2)"
              />

              <Text style={styles.editLabel}>Required Skills</Text>
              <View style={styles.skillInputContainer}>
                <TextInput
                  style={styles.skillInput}
                  placeholder="Add a skill"
                  value={skillInput}
                  onChangeText={setSkillInput}
                  onSubmitEditing={addSkill}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
                <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
                  <Ionicons name="add-circle" size={32} color={GOLD} />
                </TouchableOpacity>
              </View>

              <View style={styles.editSkillsContainer}>
                {editFormData.required_skills.map((skill) => (
                  <View key={skill} style={styles.editSkillChip}>
                    <Text style={styles.editSkillText}>{skill}</Text>
                    <TouchableOpacity onPress={() => removeSkill(skill)}>
                      <Ionicons name="close-circle" size={16} color={BG} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.editLabel}>Job Type</Text>
              <View style={styles.editChipRow}>
                {JOB_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[styles.editChip, editFormData.job_type === type.value && styles.editChipActive]}
                    onPress={() => setEditFormData({...editFormData, job_type: type.value})}
                  >
                    <Text style={[styles.editChipText, editFormData.job_type === type.value && styles.editChipTextActive]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.editLabel}>Work Setup</Text>
              <View style={styles.editChipRow}>
                {WORK_SETUPS.map((setup) => (
                  <TouchableOpacity
                    key={setup.value}
                    style={[styles.editChip, editFormData.work_setup === setup.value && styles.editChipActive]}
                    onPress={() => setEditFormData({...editFormData, work_setup: setup.value})}
                  >
                    <Text style={[styles.editChipText, editFormData.work_setup === setup.value && styles.editChipTextActive]}>
                      {setup.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.editLabel}>Budget Type</Text>
              <View style={styles.editChipRow}>
                {BUDGET_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[styles.editChip, editFormData.budget_type === type.value && styles.editChipActive]}
                    onPress={() => setEditFormData({...editFormData, budget_type: type.value})}
                  >
                    <Text style={[styles.editChipText, editFormData.budget_type === type.value && styles.editChipTextActive]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.editLabel}>Budget Amount *</Text>
              <TextInput
                style={styles.editInput}
                value={editFormData.budget_amount}
                onChangeText={(text) => setEditFormData({...editFormData, budget_amount: text})}
                keyboardType="numeric"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />

              <Text style={styles.editLabel}>Estimated Duration</Text>
              <TextInput
                style={styles.editInput}
                value={editFormData.estimated_duration}
                onChangeText={(text) => setEditFormData({...editFormData, estimated_duration: text})}
                placeholder="e.g., 2 weeks, 1 month"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={saveEditJob}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
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
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailHalf: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
  },
  detailSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  detailSkillChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  detailSkillText: {
    fontSize: 11,
    color: GOLD,
  },
  closeModalBtn: {
    backgroundColor: GOLD,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  // Edit form styles
  editLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  editInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  skillInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  addSkillBtn: {
    padding: 4,
  },
  editSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  editSkillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: GOLD,
  },
  editSkillText: {
    fontSize: 12,
    color: '#0a0a0a',
    fontWeight: '600',
  },
  editChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  editChipActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: GOLD,
  },
  editChipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  editChipTextActive: {
    color: GOLD,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  saveButton: {
    backgroundColor: GOLD,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
});