import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, TextInput, Modal, BackHandler,
  FlatList, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getClientJobs,
  deleteJob,
  updateJobStatus,
  updateJob,
  getJobById,
  clearJobError,
  clearJobSuccess,
} from '../../Redux/slices/jobSlice';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const BLUE       = '#0055A5';
const BLUE_LT    = '#1E90FF';
const GOLD       = '#C89520';
const GOLD_LT    = '#E8B84B';
const GOLD_DK    = '#8A6410';
const WHITE      = '#FFFFFF';
const BG         = '#F0F4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const GREEN      = '#059669';
const RED        = '#DC2626';
const ORANGE     = '#F97316';
const PURPLE     = '#7C3AED';

const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'          },
  { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'        },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline'    },
  { key: 'Message',       label: 'Messages', icon: 'chatbubble',    iconOutline: 'chatbubble-outline'    },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',        iconOutline: 'person-outline'        },
];

const STATUS_OPTIONS = [
  { label: 'All', value: 'all', color: TEXT_MUTED },
  { label: 'Open', value: 'open', color: GREEN },
  { label: 'In Progress', value: 'in_progress', color: BLUE },
  { label: 'Paused', value: 'paused', color: ORANGE },
  { label: 'Completed', value: 'completed', color: PURPLE },
  { label: 'Cancelled', value: 'cancelled', color: RED },
];

const STATUS_COLORS = {
  open: GREEN,
  in_progress: BLUE,
  paused: ORANGE,
  completed: PURPLE,
  cancelled: RED,
  closed: TEXT_LIGHT,
};

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
  closed: 'Closed',
};

// Statuses where job cannot be deleted
const NON_DELETABLE_STATUSES = ['in_progress', 'completed'];

const formatCurrency = (amount) => {
  if (!amount) return '₱0';
  return '₱' + Number(amount).toLocaleString();
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return formatDate(dateString);
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function JobManagement({ onNavigate }) {
  const dispatch = useDispatch();
  const { clientJobs, isLoading, selectedJob } = useSelector((state) => state.jobs.jobs);
  const { deleteJobSuccess, updateJobSuccess } = useSelector((state) => state.jobs);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeBottomTab, setActiveBottomTab] = useState('PostJob');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedJobForDelete, setSelectedJobForDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedJobForStatus, setSelectedJobForStatus] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailJob, setDetailJob] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editBudgetType, setEditBudgetType] = useState('fixed');
  const [editStatus, setEditStatus] = useState('');

  // ── Fetch Jobs ──────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    try {
      const params = { page: 1, limit: 50 };
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      await dispatch(getClientJobs(params)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to load jobs. Please try again.');
    }
  }, [dispatch, selectedStatus]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ── Handle Delete Success ─────────────────────────────────────────────────
  useEffect(() => {
    if (deleteJobSuccess) {
      fetchJobs();
      dispatch(clearJobSuccess());
    }
  }, [deleteJobSuccess, dispatch, fetchJobs]);

  // ── Handle Update Success ─────────────────────────────────────────────────
  useEffect(() => {
    if (updateJobSuccess) {
      fetchJobs();
      dispatch(clearJobSuccess());
      setIsUpdating(false);
      setIsEditing(false);
    }
  }, [updateJobSuccess, dispatch, fetchJobs]);

  // ── Hardware Back Button ──────────────────────────────────────────────────
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showDetailModal) {
        setShowDetailModal(false);
        setDetailJob(null);
        setIsEditing(false);
        return true;
      }
      if (showDeleteModal) {
        setShowDeleteModal(false);
        setSelectedJobForDelete(null);
        return true;
      }
      if (showStatusModal) {
        setShowStatusModal(false);
        setSelectedJobForStatus(null);
        return true;
      }
      if (onNavigate) {
        onNavigate('ClientDashboard');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showDetailModal, showDeleteModal, showStatusModal, onNavigate]);

  // ── Filter Jobs ─────────────────────────────────────────────────────────────
  const getFilteredJobs = () => {
    let filtered = clientJobs || [];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(query) ||
        job.category?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredJobs = getFilteredJobs();

  // ── Handle Tab Navigation ─────────────────────────────────────────────────
  const handleTabPress = (key) => {
    setActiveBottomTab(key);
    if (key === 'Home') onNavigate('ClientDashboard');
    if (key === 'PostJob') onNavigate('PostJob');
    if (key === 'Hiredtalents') onNavigate('Hiredtalents');
    if (key === 'Message') onNavigate('Message');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  // ── View Job Details ──────────────────────────────────────────────────────
  const handleViewJob = async (job) => {
    try {
      const result = await dispatch(getJobById(job._id)).unwrap();
      setDetailJob(result.job || job);
      setIsEditing(false);
      setShowDetailModal(true);
    } catch (error) {
      setDetailJob(job);
      setIsEditing(false);
      setShowDetailModal(true);
    }
  };

  // ── Start Editing ──────────────────────────────────────────────────────────
  const startEditing = () => {
    if (detailJob) {
      setEditTitle(detailJob.title || '');
      setEditCategory(detailJob.category || '');
      setEditDescription(detailJob.description || '');
      setEditBudget(String(detailJob.budget_amount || ''));
      setEditBudgetType(detailJob.budget_type || 'fixed');
      setEditStatus(detailJob.status || 'open');
      setIsEditing(true);
    }
  };

  // ── Save Edit ──────────────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Job title is required');
      return;
    }
    if (!editCategory.trim()) {
      Alert.alert('Error', 'Category is required');
      return;
    }
    if (!editBudget || parseFloat(editBudget) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    setIsUpdating(true);

    try {
      const updateData = {
        title: editTitle.trim(),
        category: editCategory.trim(),
        description: editDescription.trim(),
        budget_amount: parseFloat(editBudget),
        budget_type: editBudgetType,
        status: editStatus,
      };

      const result = await dispatch(updateJob({ 
        jobId: detailJob._id, 
        jobData: updateData 
      })).unwrap();

      // Update the detail view with new data
      setDetailJob(result.job || {
        ...detailJob,
        ...updateData,
      });

      Alert.alert('Success', 'Job updated successfully!');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to update job. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Delete Job ─────────────────────────────────────────────────────────────
  const handleDeleteJob = async () => {
    if (!selectedJobForDelete) return;
    
    // Check if job can be deleted
    if (NON_DELETABLE_STATUSES.includes(selectedJobForDelete.status)) {
      Alert.alert(
        'Cannot Delete',
        `This job is ${STATUS_LABELS[selectedJobForDelete.status]}. You can only delete jobs that are Open or Cancelled.`
      );
      setShowDeleteModal(false);
      setSelectedJobForDelete(null);
      return;
    }
    
    try {
      await dispatch(deleteJob(selectedJobForDelete._id)).unwrap();
      setShowDeleteModal(false);
      setSelectedJobForDelete(null);
      if (showDetailModal) {
        setShowDetailModal(false);
        setDetailJob(null);
        setIsEditing(false);
      }
      Alert.alert('Deleted', 'Job has been deleted successfully.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to delete job.');
    }
  };

  // ── Update Job Status ──────────────────────────────────────────────────────
  const handleUpdateStatus = async (status) => {
    if (!selectedJobForStatus) return;
    
    try {
      await dispatch(updateJobStatus({ 
        jobId: selectedJobForStatus._id, 
        status 
      })).unwrap();
      setShowStatusModal(false);
      setSelectedJobForStatus(null);
      fetchJobs();
      Alert.alert('Updated', `Job status changed to ${STATUS_LABELS[status]}.`);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to update job status.');
    }
  };

  // ── Refresh ─────────────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, [fetchJobs]);

  // ── Check if job can be deleted ───────────────────────────────────────────
  const canDeleteJob = (status) => {
    return !NON_DELETABLE_STATUSES.includes(status);
  };

  // ── Render Job Card ──────────────────────────────────────────────────────
  const renderJobCard = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || TEXT_LIGHT;
    const statusLabel = STATUS_LABELS[item.status] || item.status;
    const deletable = canDeleteJob(item.status);
    
    return (
      <TouchableOpacity 
        style={card.wrap} 
        onPress={() => handleViewJob(item)}
        activeOpacity={0.85}
      >
        <View style={card.header}>
          <View style={card.titleWrap}>
            <Text style={card.title} numberOfLines={1}>{item.title}</Text>
            <View style={[card.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <View style={[card.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[card.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={card.category} numberOfLines={1}>{item.category || 'Uncategorized'}</Text>
        </View>

        <Text style={card.description} numberOfLines={2}>{item.description}</Text>

        <View style={card.metaRow}>
          <View style={card.metaItem}>
            <Ionicons name="cash-outline" size={14} color={GOLD_DK} />
            <Text style={card.metaText}>
              {formatCurrency(item.budget_amount)} 
              {item.budget_type === 'hourly' ? '/hr' : ''}
            </Text>
          </View>
          <View style={card.metaItem}>
            <Ionicons name="people-outline" size={14} color={TEXT_LIGHT} />
            <Text style={card.metaText}>
              {item.applications_count || 0} applicants
            </Text>
          </View>
          <View style={card.metaItem}>
            <Ionicons name="eye-outline" size={14} color={TEXT_LIGHT} />
            <Text style={card.metaText}>
              {item.views || 0} views
            </Text>
          </View>
        </View>

        <View style={card.footer}>
          <Text style={card.date}>
            Created {formatRelativeTime(item.createdAt)}
          </Text>
          <View style={card.actions}>
            <TouchableOpacity 
              style={[card.actionBtn, card.statusBtn]}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedJobForStatus(item);
                setShowStatusModal(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-horizontal-outline" size={14} color={BLUE} />
              <Text style={[card.actionText, { color: BLUE }]}>Status</Text>
            </TouchableOpacity>
            {deletable && (
              <TouchableOpacity 
                style={[card.actionBtn, card.deleteBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedJobForDelete(item);
                  setShowDeleteModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={14} color={RED} />
                <Text style={[card.actionText, { color: RED }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading && !refreshing && !clientJobs?.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.topbar}>
          <Text style={styles.topbarTitle}>My Jobs</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => onNavigate('PostJob')} activeOpacity={0.7}>
            <Ionicons name="add-outline" size={18} color={WHITE} />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color={BLUE} /><Text style={styles.loadTxt}>Loading jobs…</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.root}>

        {/* Top Bar */}
        <View style={styles.topbar}>
          <Text style={styles.topbarTitle}>My Jobs</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => onNavigate('PostJob')} activeOpacity={0.7}>
            <Ionicons name="add-outline" size={18} color={WHITE} />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={TEXT_LIGHT} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title, category..."
              placeholderTextColor={TEXT_LIGHT}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.filterWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {STATUS_OPTIONS.map((opt) => {
              const active = selectedStatus === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedStatus(opt.value)}
                  activeOpacity={0.7}
                >
                  {opt.value !== 'all' && (
                    <View style={[styles.filterDot, { backgroundColor: opt.color }]} />
                  )}
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={12} color={WHITE} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results count */}
        <View style={styles.countWrap}>
          <Text style={styles.countText}>{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Job List */}
        <FlatList
          data={filteredJobs}
          renderItem={renderJobCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="briefcase-outline" size={34} color={BLUE} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No jobs match your search' : 'No jobs created yet'}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchQuery 
                  ? 'Try adjusting your search terms.' 
                  : 'Post your first job to start hiring freelancers.'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => onNavigate('PostJob')}>
                  <Text style={styles.emptyBtnText}>Post a Job</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

        {/* Bottom Tab Bar */}
        <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const active = activeBottomTab === tab.key;
              const isPost = tab.key === 'PostJob';
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {active && <View style={styles.tabActiveBar} />}
                  {isPost ? (
                    <View style={styles.tabFab}>
                      <Ionicons name={active ? tab.icon : tab.iconOutline} size={22} color={WHITE} />
                    </View>
                  ) : (
                    <View style={styles.tabIconWrap}>
                      <Ionicons
                        name={active ? tab.icon : tab.iconOutline}
                        size={23}
                        color={active ? BLUE : TEXT_LIGHT}
                      />
                    </View>
                  )}
                  <Text style={[
                    styles.tabLabel,
                    active && styles.tabLabelActive,
                    isPost && styles.tabLabelPost,
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      {/* ── Job Detail Modal ── */}
      <Modal transparent animationType="slide" visible={showDetailModal} onRequestClose={() => { setShowDetailModal(false); setDetailJob(null); setIsEditing(false); }}>
        <View style={detailModal.overlay}>
          <View style={detailModal.sheet}>
            <View style={detailModal.handle} />
            
            {/* Header */}
            <View style={detailModal.header}>
              <TouchableOpacity onPress={() => { setShowDetailModal(false); setDetailJob(null); setIsEditing(false); }} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={TEXT_MAIN} />
              </TouchableOpacity>
              <Text style={detailModal.headerTitle}>Job Details</Text>
              {!isEditing ? (
                <TouchableOpacity onPress={startEditing} activeOpacity={0.7}>
                  <Ionicons name="create-outline" size={22} color={BLUE} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 22 }} />
              )}
            </View>

            <ScrollView contentContainerStyle={detailModal.body}>
              {detailJob && !isEditing ? (
                // ── View Mode ──
                <View>
                  {/* Status Badge */}
                  <View style={detailModal.statusWrap}>
                    <View style={[detailModal.statusBadge, { backgroundColor: STATUS_COLORS[detailJob.status] + '15' }]}>
                      <View style={[detailModal.statusDot, { backgroundColor: STATUS_COLORS[detailJob.status] }]} />
                      <Text style={[detailModal.statusText, { color: STATUS_COLORS[detailJob.status] }]}>
                        {STATUS_LABELS[detailJob.status] || detailJob.status}
                      </Text>
                    </View>
                    <Text style={detailModal.dateText}>
                      Created {formatRelativeTime(detailJob.createdAt)}
                    </Text>
                  </View>

                  {/* Title */}
                  <Text style={detailModal.title}>{detailJob.title}</Text>
                  
                  {/* Category */}
                  {detailJob.category && (
                    <View style={detailModal.categoryWrap}>
                      <Ionicons name="grid-outline" size={14} color={BLUE} />
                      <Text style={detailModal.categoryText}>{detailJob.category}</Text>
                    </View>
                  )}

                  {/* Description */}
                  <View style={detailModal.section}>
                    <Text style={detailModal.sectionLabel}>Description</Text>
                    <Text style={detailModal.sectionValue}>{detailJob.description || 'No description provided.'}</Text>
                  </View>

                  {/* Budget */}
                  <View style={detailModal.section}>
                    <Text style={detailModal.sectionLabel}>Budget</Text>
                    <Text style={detailModal.budgetText}>
                      {formatCurrency(detailJob.budget_amount)} 
                      {detailJob.budget_type === 'hourly' ? ' / hour' : ' (Fixed)'}
                    </Text>
                  </View>

                  {/* Details Grid */}
                  <View style={detailModal.grid}>
                    <View style={detailModal.gridItem}>
                      <Text style={detailModal.gridLabel}>Job Type</Text>
                      <Text style={detailModal.gridValue}>{detailJob.job_type || 'N/A'}</Text>
                    </View>
                    <View style={detailModal.gridItem}>
                      <Text style={detailModal.gridLabel}>Work Setup</Text>
                      <Text style={detailModal.gridValue}>{detailJob.work_setup || 'N/A'}</Text>
                    </View>
                    <View style={detailModal.gridItem}>
                      <Text style={detailModal.gridLabel}>Urgency</Text>
                      <Text style={detailModal.gridValue}>{detailJob.urgency_level || 'N/A'}</Text>
                    </View>
                    <View style={detailModal.gridItem}>
                      <Text style={detailModal.gridLabel}>Experience</Text>
                      <Text style={detailModal.gridValue}>{detailJob.experience_level || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* Skills */}
                  {detailJob.required_skills?.length > 0 && (
                    <View style={detailModal.section}>
                      <Text style={detailModal.sectionLabel}>Required Skills</Text>
                      <View style={detailModal.skillsWrap}>
                        {detailJob.required_skills.map((skill, i) => (
                          <View key={i} style={detailModal.skillChip}>
                            <Text style={detailModal.skillText}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Stats */}
                  <View style={detailModal.statsWrap}>
                    <View style={detailModal.statItem}>
                      <Ionicons name="people-outline" size={18} color={TEXT_LIGHT} />
                      <Text style={detailModal.statNum}>{detailJob.applications_count || 0}</Text>
                      <Text style={detailModal.statLabel}>Applicants</Text>
                    </View>
                    <View style={detailModal.statItem}>
                      <Ionicons name="eye-outline" size={18} color={TEXT_LIGHT} />
                      <Text style={detailModal.statNum}>{detailJob.views || 0}</Text>
                      <Text style={detailModal.statLabel}>Views</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={detailModal.actionRow}>
                    <TouchableOpacity style={[detailModal.actionBtn, detailModal.editBtn]} onPress={startEditing}>
                      <Ionicons name="create-outline" size={16} color={WHITE} />
                      <Text style={detailModal.actionBtnText}>Edit Job</Text>
                    </TouchableOpacity>
                    {canDeleteJob(detailJob.status) ? (
                      <TouchableOpacity 
                        style={[detailModal.actionBtn, detailModal.deleteBtn]} 
                        onPress={() => {
                          setShowDetailModal(false);
                          setSelectedJobForDelete(detailJob);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color={WHITE} />
                        <Text style={detailModal.actionBtnText}>Delete</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[detailModal.actionBtn, detailModal.disabledBtn]}>
                        <Ionicons name="lock-closed-outline" size={16} color={TEXT_LIGHT} />
                        <Text style={[detailModal.actionBtnText, { color: TEXT_LIGHT }]}>
                          {STATUS_LABELS[detailJob.status]}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {!canDeleteJob(detailJob.status) && (
                    <Text style={detailModal.deleteNote}>
                      Cannot delete job while {STATUS_LABELS[detailJob.status].toLowerCase()}
                    </Text>
                  )}
                </View>
              ) : detailJob && isEditing ? (
                // ── Edit Mode ──
                <View>
                  <Text style={detailModal.editTitle}>Edit Job</Text>
                  
                  <View style={detailModal.editField}>
                    <Text style={detailModal.editLabel}>Job Title *</Text>
                    <TextInput
                      style={detailModal.editInput}
                      value={editTitle}
                      onChangeText={setEditTitle}
                      placeholder="Enter job title"
                      placeholderTextColor={TEXT_LIGHT}
                    />
                  </View>

                  <View style={detailModal.editField}>
                    <Text style={detailModal.editLabel}>Category *</Text>
                    <TextInput
                      style={detailModal.editInput}
                      value={editCategory}
                      onChangeText={setEditCategory}
                      placeholder="e.g. Technology, Design"
                      placeholderTextColor={TEXT_LIGHT}
                    />
                  </View>

                  <View style={detailModal.editField}>
                    <Text style={detailModal.editLabel}>Description</Text>
                    <TextInput
                      style={[detailModal.editInput, detailModal.editTextArea]}
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="Describe the job..."
                      placeholderTextColor={TEXT_LIGHT}
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <View style={detailModal.editField}>
                    <Text style={detailModal.editLabel}>Budget Amount *</Text>
                    <TextInput
                      style={detailModal.editInput}
                      value={editBudget}
                      onChangeText={setEditBudget}
                      placeholder="Enter budget amount"
                      placeholderTextColor={TEXT_LIGHT}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={detailModal.editField}>
                    <Text style={detailModal.editLabel}>Budget Type</Text>
                    <View style={detailModal.budgetTypeRow}>
                      {['fixed', 'hourly'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            detailModal.budgetTypeBtn,
                            editBudgetType === type && detailModal.budgetTypeActive
                          ]}
                          onPress={() => setEditBudgetType(type)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            detailModal.budgetTypeText,
                            editBudgetType === type && detailModal.budgetTypeTextActive
                          ]}>
                            {type === 'fixed' ? 'Fixed' : 'Hourly'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={detailModal.editField}>
                    <Text style={detailModal.editLabel}>Status</Text>
                    <View style={detailModal.statusRow}>
                      {['open', 'in_progress', 'paused', 'completed', 'cancelled'].map((status) => {
                        const isActive = editStatus === status;
                        const color = STATUS_COLORS[status];
                        return (
                          <TouchableOpacity
                            key={status}
                            style={[
                              detailModal.statusOption,
                              isActive && { backgroundColor: color + '15', borderColor: color }
                            ]}
                            onPress={() => setEditStatus(status)}
                            activeOpacity={0.7}
                          >
                            <View style={[detailModal.statusDotSmall, { backgroundColor: color }]} />
                            <Text style={[
                              detailModal.statusOptionText,
                              isActive && { color, fontWeight: '700' }
                            ]}>
                              {STATUS_LABELS[status]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={detailModal.editActions}>
                    <TouchableOpacity 
                      style={[detailModal.editActionBtn, detailModal.cancelEditBtn]}
                      onPress={() => setIsEditing(false)}
                      disabled={isUpdating}
                      activeOpacity={0.7}
                    >
                      <Text style={detailModal.cancelEditText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[detailModal.editActionBtn, detailModal.saveEditBtn, isUpdating && { opacity: 0.6 }]}
                      onPress={saveEdit}
                      disabled={isUpdating}
                      activeOpacity={0.7}
                    >
                      {isUpdating ? (
                        <ActivityIndicator color={WHITE} size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color={WHITE} />
                          <Text style={detailModal.saveEditText}>Save Changes</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal transparent animationType="fade" visible={showDeleteModal} onRequestClose={() => setShowDeleteModal(false)}>
        <View style={modal.overlay}>
          <View style={modal.card}>
            <View style={modal.iconWrap}>
              <Ionicons name="alert-circle-outline" size={40} color={RED} />
            </View>
            <Text style={modal.title}>Delete Job</Text>
            <Text style={modal.desc}>
              Are you sure you want to delete "{selectedJobForDelete?.title}"? This action cannot be undone.
            </Text>
            <View style={modal.actions}>
              <TouchableOpacity style={[modal.btn, modal.cancelBtn]} onPress={() => setShowDeleteModal(false)}>
                <Text style={modal.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modal.btn, modal.dangerBtn]} onPress={handleDeleteJob}>
                <Text style={modal.dangerTxt}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Status Update Modal ── */}
      <Modal transparent animationType="fade" visible={showStatusModal} onRequestClose={() => setShowStatusModal(false)}>
        <View style={modal.overlay}>
          <View style={modal.card}>
            <View style={modal.iconWrap}>
              <Ionicons name="swap-horizontal-outline" size={40} color={BLUE} />
            </View>
            <Text style={modal.title}>Update Status</Text>
            <Text style={modal.desc}>
              Change status for "{selectedJobForStatus?.title}":
            </Text>
            <View style={modal.statusOptions}>
              {['open', 'in_progress', 'paused', 'completed', 'cancelled'].map((status) => {
                const isActive = selectedJobForStatus?.status === status;
                const color = STATUS_COLORS[status];
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      modal.statusBtn,
                      isActive && { backgroundColor: color + '15', borderColor: color }
                    ]}
                    onPress={() => handleUpdateStatus(status)}
                    activeOpacity={0.7}
                  >
                    <View style={[modal.statusDot, { backgroundColor: color }]} />
                    <Text style={[modal.statusLabel, isActive && { color, fontWeight: '700' }]}>
                      {STATUS_LABELS[status]}
                    </Text>
                    {isActive && <Ionicons name="checkmark-circle" size={16} color={color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={[modal.btn, modal.cancelBtn, { width: '100%' }]} onPress={() => setShowStatusModal(false)}>
              <Text style={modal.cancelTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: BG },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, backgroundColor: NAVY,
  },
  topbarTitle: { fontSize: 17, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  createBtnText: { fontSize: 12, fontWeight: '600', color: WHITE },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: BG, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  searchInput: { flex: 1, fontSize: 13, color: TEXT_MAIN, padding: 0 },

  filterWrap: { backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  filterScroll: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  filterChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: 11, fontWeight: '600', color: TEXT_LIGHT },
  filterTextActive: { color: WHITE },

  countWrap: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: CARD },
  countText: { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },

  list: { padding: 16, paddingBottom: 32 },

  empty: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, backgroundColor: BLUE + '10', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: TEXT_LIGHT, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: BLUE, borderRadius: 20 },
  emptyBtnText: { color: WHITE, fontSize: 13, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadTxt: { marginTop: 12, fontSize: 13, color: TEXT_LIGHT },

  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1.5, borderTopColor: BORDER,
    paddingTop: 6, paddingBottom: 4, paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
    paddingVertical: 4, position: 'relative',
  },
  tabActiveBar: {
    position: 'absolute', top: 0,
    width: 24, height: 3,
    backgroundColor: BLUE, borderRadius: 999,
  },
  tabIconWrap: { marginBottom: 3, marginTop: 6 },
  tabFab: {
    width: 44, height: 36, borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 3, marginTop: 2,
    shadowColor: GOLD_DK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 5, elevation: 3,
    borderWidth: 1, borderColor: GOLD_LT,
  },
  tabLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
  tabLabelActive: { color: BLUE, fontWeight: '700' },
  tabLabelPost: { color: GOLD, fontWeight: '700' },
});

// ── Card Styles ──────────────────────────────────────────────────────────────
const card = StyleSheet.create({
  wrap: {
    backgroundColor: CARD, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: BORDER, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  header: { marginBottom: 10 },
  titleWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, flexShrink: 0 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700' },
  category: { fontSize: 11, color: TEXT_LIGHT, marginTop: 3 },
  description: { fontSize: 12, color: TEXT_MUTED, lineHeight: 18, marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  date: { fontSize: 10, color: TEXT_LIGHT },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusBtn: { borderColor: BLUE + '30', backgroundColor: BLUE + '0D' },
  deleteBtn: { borderColor: RED + '30', backgroundColor: RED + '0D' },
  actionText: { fontSize: 10, fontWeight: '600' },
});

// ── Detail Modal Styles ─────────────────────────────────────────────────────
const detailModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN },
  body: { padding: 16, paddingBottom: 32 },
  
  statusWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 11, color: TEXT_LIGHT },
  
  title: { fontSize: 22, fontWeight: '800', color: TEXT_MAIN, marginBottom: 6 },
  categoryWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  categoryText: { fontSize: 13, color: BLUE, fontWeight: '600' },
  
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: TEXT_LIGHT, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  sectionValue: { fontSize: 14, color: TEXT_MAIN, lineHeight: 20 },
  budgetText: { fontSize: 18, fontWeight: '800', color: GOLD_DK },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  gridItem: { flex: 1, minWidth: '45%', backgroundColor: BG, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: BORDER },
  gridLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  gridValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '600', marginTop: 2 },
  
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { backgroundColor: BLUE + '10', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: BLUE + '20' },
  skillText: { fontSize: 12, color: BLUE, fontWeight: '600' },
  
  statsWrap: { flexDirection: 'row', gap: 12, marginVertical: 16 },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: BG, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER },
  statNum: { fontSize: 20, fontWeight: '800', color: TEXT_MAIN, marginTop: 4 },
  statLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500', marginTop: 2 },
  
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  editBtn: { backgroundColor: BLUE },
  deleteBtn: { backgroundColor: RED },
  disabledBtn: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },
  deleteNote: { textAlign: 'center', fontSize: 11, color: TEXT_LIGHT, marginTop: 8 },
  
  editTitle: { fontSize: 20, fontWeight: '800', color: TEXT_MAIN, marginBottom: 16 },
  editField: { marginBottom: 14 },
  editLabel: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED, marginBottom: 6 },
  editInput: { backgroundColor: BG, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: BORDER, fontSize: 14, color: TEXT_MAIN },
  editTextArea: { height: 100, textAlignVertical: 'top' },
  
  budgetTypeRow: { flexDirection: 'row', gap: 8 },
  budgetTypeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: BORDER, alignItems: 'center', backgroundColor: BG },
  budgetTypeActive: { backgroundColor: BLUE, borderColor: BLUE },
  budgetTypeText: { fontSize: 13, fontWeight: '600', color: TEXT_LIGHT },
  budgetTypeTextActive: { color: WHITE },
  
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: BG },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  statusOptionText: { fontSize: 11, fontWeight: '500', color: TEXT_LIGHT },
  
  editActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  editActionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelEditBtn: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  saveEditBtn: { backgroundColor: BLUE },
  cancelEditText: { fontSize: 14, fontWeight: '600', color: TEXT_LIGHT },
  saveEditText: { fontSize: 14, fontWeight: '700', color: WHITE },
});

// ── Modal Styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    backgroundColor: CARD, borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 380, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 8,
  },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: RED + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: TEXT_MAIN, marginBottom: 8 },
  desc: { fontSize: 13, color: TEXT_LIGHT, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  dangerBtn: { backgroundColor: RED },
  cancelTxt: { fontSize: 14, fontWeight: '600', color: TEXT_LIGHT },
  dangerTxt: { fontSize: 14, fontWeight: '700', color: WHITE },
  statusOptions: { width: '100%', gap: 6, marginBottom: 16 },
  statusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER, backgroundColor: BG,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: TEXT_MAIN },
});