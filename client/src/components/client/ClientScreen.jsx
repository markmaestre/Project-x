import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../Redux/slices/authSlice';
import { getClientJobs, updateJobStatus, deleteJob } from '../../Redux/slices/jobSlice';
import { getClientApplications } from '../../Redux/slices/applicationSlice';

// ── Palette ───────────────────────────────────────────────────────────────────
const BLUE        = '#0068B5';
const BLUE_LIGHT  = '#3D9DD6';
const BLUE_DARK   = '#004F8C';
const BLUE_SOFT   = '#E2EAF4';
const BLUE_MID    = '#A8C4DC';

const GOLD        = '#C9960C';
const GOLD_LIGHT  = '#F0B429';
const GOLD_DARK   = '#A07A08';
const GOLD_SOFT   = '#FDF3D7';
const GOLD_MID    = '#E6C56A';

const DARK_CARD   = '#1A2B3C';
const DARK_CARD2  = '#223348';

const WHITE       = '#FFFFFF';
const OFF_WHITE   = '#F5F7FA';
const BORDER      = 'rgba(0,104,181,0.14)';

const TEXT_MAIN   = '#0D1B2A';
const TEXT_MUTED  = '#4A5E72';
const TEXT_LIGHT  = '#8B9AB0';

const RED         = '#E53935';
const AMBER       = '#F59E0B';
const GREEN_STATUS = '#1A8754';
// ─────────────────────────────────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get('window');

const BENEFIT_CONFIG = {
  health_insurance:        { icon: 'medkit-outline',    label: 'Health Insurance' },
  paid_time_off:           { icon: 'sunny-outline',     label: 'Paid Time Off' },
  remote_stipend:          { icon: 'laptop-outline',    label: 'Remote Stipend' },
  equipment_provided:      { icon: 'desktop-outline',   label: 'Equipment Provided' },
  bonus_eligible:          { icon: 'trophy-outline',    label: 'Bonus Eligible' },
  retirement_plan:         { icon: 'wallet-outline',    label: 'Retirement Plan' },
  professional_development:{ icon: 'school-outline',    label: 'Professional Dev.' },
};

// ── Time Helper ──────────────────────────────────────────────────────────────
const formatPostedDateTime = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return null;
  }
};

const getTimeAgo = (date) => {
  if (!date) return null;
  try {
    const now = new Date();
    const past = new Date(date);
    if (isNaN(past.getTime())) return null;
    const diffInSeconds = Math.floor((now - past) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  } catch (error) {
    return null;
  }
};

const formatFullDate = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return null;
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatLocation = (location) => {
  if (!location) return null;
  if (typeof location === 'string') return location;
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.province) parts.push(location.province);
  if (location.country && location.country !== 'Philippines') parts.push(location.country);
  return parts.length > 0 ? parts.join(', ') : null;
};

const formatJobType = (type) => {
  const types = {
    full_time: 'Full Time', 
    part_time: 'Part Time', 
    project: 'Project',
    one_time: 'One Time', 
    long_term: 'Long Term',
  };
  return types[type] || type;
};

const formatWorkSetup = (setup) => {
  const setups = { remote: 'Remote', onsite: 'Onsite', hybrid: 'Hybrid' };
  return setups[setup] || setup;
};

const formatExperienceLevel = (level) => {
  const levels = {
    entry: 'Entry',
    intermediate: 'Intermediate',
    expert: 'Expert',
    senior: 'Senior',
  };
  return levels[level] || level;
};

const formatBudget = (budget) => {
  if (!budget) return null;
  const { min, max, currency = 'PHP', type } = budget;
  if (min && max) {
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} (${type === 'hourly' ? 'per hour' : 'fixed'})`;
  }
  if (min) {
    return `${currency} ${min.toLocaleString()}+ (${type === 'hourly' ? 'per hour' : 'fixed'})`;
  }
  return null;
};

const formatDuration = (timeline) => {
  if (!timeline) return null;
  const { duration_value, duration_unit } = timeline;
  if (duration_value && duration_unit) {
    return `${duration_value} ${duration_unit}`;
  }
  return null;
};

// ── Tab filters ───────────────────────────────────────────────────────────────
const JOB_TABS = [
  { key: 'all',       label: 'All Jobs' },
  { key: 'open',      label: 'Active'   },
  { key: 'draft',     label: 'Drafts'   },
  { key: 'completed', label: 'Closed'   },
];

// ── Bottom tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',       iconOutline: 'home-outline'       },
  { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',     iconOutline: 'people-outline'     },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle', iconOutline: 'add-circle-outline' },
  { key: 'Message',       label: 'Messages', icon: 'chatbubble', iconOutline: 'chatbubble-outline' },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',     iconOutline: 'person-outline'     },
];

// ── Status helpers ────────────────────────────────────────────────────────────
const jobStatusColor = (s) =>
  s === 'open'          ? BLUE
  : s === 'in_progress' ? AMBER
  : s === 'completed'   ? GREEN_STATUS
  : s === 'cancelled'   ? RED
  : s === 'draft'       ? TEXT_LIGHT
  : TEXT_MUTED;

const jobStatusLabel = (s) =>
  s === 'open'          ? 'Open'
  : s === 'in_progress' ? 'In Progress'
  : s === 'completed'   ? 'Completed'
  : s === 'cancelled'   ? 'Cancelled'
  : s === 'draft'       ? 'Draft'
  : s;

// ── Job Detail Bottom Sheet ───────────────────────────────────────────────────
function JobDetailSheet({ 
  job, 
  visible, 
  onClose, 
  onEditJob, 
  onViewApplicants, 
  applications,
  onStatusChange,
  onDeleteJob,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!job) return null;

  const sColor          = jobStatusColor(job.status);
  const sLabel          = jobStatusLabel(job.status);
  const locationText    = formatLocation(job.location);
  const jobTypeText     = formatJobType(job.job_type);
  const workSetupText   = formatWorkSetup(job.work_setup);
  const budgetText      = formatBudget(job.budget);
  const durationText    = formatDuration(job.timeline);
  const experienceText  = formatExperienceLevel(job.experience_level);
  const skills          = job.required_skills || [];
  const timeAgo         = getTimeAgo(job.createdAt);
  const fullDate        = formatFullDate(job.createdAt);
  
  const jobApplications = applications?.filter(app => app.job_id?._id === job._id) || [];
  const applicantsCount = jobApplications.length;

  const statusOptions = ['open', 'in_progress', 'completed', 'paused', 'cancelled'];

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDeleteJob(job._id);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sheet.overlay}>
        <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={sheet.container}>
          <View style={sheet.goldBar} />
          <View style={sheet.handle} />

          <View style={sheet.header}>
            <View style={sheet.jobIconBox}>
              <Ionicons name="briefcase-outline" size={22} color={BLUE} />
            </View>
            <View style={sheet.headerInfo}>
              <Text style={sheet.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>
              <View style={sheet.statusBadge}>
                <View style={[sheet.statusDot, { backgroundColor: sColor }]} />
                <Text style={[sheet.statusText, { color: sColor }]}>{sLabel}</Text>
                {timeAgo && (
                  <View style={sheet.timeBadge}>
                    <Ionicons name="time-outline" size={11} color={TEXT_LIGHT} />
                    <Text style={sheet.timeBadgeText}>{timeAgo}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={sheet.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={sheet.statsBar}>
            <View style={sheet.statItem}>
              <Ionicons name="calendar-outline" size={16} color={BLUE} />
              <View>
                <Text style={sheet.statItemLabel}>Posted</Text>
                <Text style={sheet.statItemValue}>{fullDate || 'Date not available'}</Text>
              </View>
            </View>
            <View style={sheet.statDivider} />
            <View style={sheet.statItem}>
              <Ionicons name="people-outline" size={16} color={GOLD} />
              <View>
                <Text style={sheet.statItemLabel}>Applicants</Text>
                <Text style={sheet.statItemValue}>{applicantsCount} total</Text>
              </View>
            </View>
          </View>

          <View style={sheet.metaRow}>
            {locationText && (
              <View style={sheet.metaChip}>
                <Ionicons name="location-outline" size={13} color={TEXT_MUTED} />
                <Text style={sheet.metaText}>{locationText}</Text>
              </View>
            )}
            {jobTypeText && (
              <View style={sheet.metaChip}>
                <Ionicons name="briefcase-outline" size={13} color={TEXT_MUTED} />
                <Text style={sheet.metaText}>{jobTypeText}</Text>
              </View>
            )}
            {workSetupText && (
              <View style={sheet.metaChip}>
                <Ionicons name="wifi-outline" size={13} color={TEXT_MUTED} />
                <Text style={sheet.metaText}>{workSetupText}</Text>
              </View>
            )}
            {budgetText && (
              <View style={[sheet.metaChip, sheet.metaChipGold]}>
                <Ionicons name="cash-outline" size={13} color={GOLD} />
                <Text style={[sheet.metaText, { color: GOLD_DARK, fontWeight: '600' }]}>{budgetText}</Text>
              </View>
            )}
          </View>

          <View style={sheet.divider} />

          <ScrollView
            style={sheet.body}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Applicants Banner */}
            <TouchableOpacity
              style={sheet.applicantsBanner}
              onPress={() => { onClose(); setTimeout(() => onViewApplicants(job), 300); }}
              activeOpacity={0.85}
            >
              <View style={sheet.applicantsLeft}>
                <Ionicons name="people-outline" size={20} color={BLUE} />
                <View>
                  <Text style={sheet.applicantsCount}>{applicantsCount} Applicant{applicantsCount !== 1 ? 's' : ''}</Text>
                  <Text style={sheet.applicantsSub}>Tap to review all applications</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={16} color={BLUE} />
            </TouchableOpacity>

            {/* Job Description */}
            <View style={sheet.section}>
              <Text style={sheet.sectionLabel}>Job Description</Text>
              <Text style={sheet.descText}>{job.description || 'No description provided.'}</Text>
            </View>

            {/* Required Skills */}
            {skills.length > 0 && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Required Skills</Text>
                <View style={sheet.tagRow}>
                  {skills.map((s, i) => (
                    <View key={i} style={sheet.tag}>
                      <Text style={sheet.tagText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Requirements */}
            {job.requirements && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Requirements</Text>
                <View style={{ gap: 6 }}>
                  {job.requirements.education && job.requirements.education !== 'none' && (
                    <Text style={sheet.descText}>• Education: {job.requirements.education}</Text>
                  )}
                  {job.requirements.portfolio_required && (
                    <Text style={sheet.descText}>• Portfolio required</Text>
                  )}
                  {job.requirements.resume_required && (
                    <Text style={sheet.descText}>• Resume required</Text>
                  )}
                  {job.requirements.cover_letter_required && (
                    <Text style={sheet.descText}>• Cover letter required</Text>
                  )}
                  {job.requirements.preferred_languages?.length > 0 && (
                    <Text style={sheet.descText}>• Languages: {job.requirements.preferred_languages.join(', ')}</Text>
                  )}
                  {job.requirements.preferred_certifications?.length > 0 && (
                    <Text style={sheet.descText}>• Certifications: {job.requirements.preferred_certifications.join(', ')}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Screening Questions */}
            {job.screening_questions?.length > 0 && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Screening Questions</Text>
                {job.screening_questions.map((q, i) => (
                  <View key={i} style={sheet.questionItem}>
                    <Text style={sheet.questionNumber}>{i + 1}.</Text>
                    <Text style={sheet.questionText}>{q.question}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Detail Grid */}
            <View style={sheet.detailGrid}>
              {experienceText && (
                <View style={sheet.detailItem}>
                  <Ionicons name="bar-chart-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={sheet.detailLabel}>Experience Level</Text>
                    <Text style={sheet.detailValue}>{experienceText}</Text>
                  </View>
                </View>
              )}
              {durationText && (
                <View style={sheet.detailItem}>
                  <Ionicons name="hourglass-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={sheet.detailLabel}>Duration</Text>
                    <Text style={sheet.detailValue}>{durationText}</Text>
                  </View>
                </View>
              )}
              {job.vacancies && (
                <View style={sheet.detailItem}>
                  <Ionicons name="people-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={sheet.detailLabel}>Vacancies</Text>
                    <Text style={sheet.detailValue}>{job.vacancies}</Text>
                  </View>
                </View>
              )}
              {job.analytics?.views > 0 && (
                <View style={sheet.detailItem}>
                  <Ionicons name="eye-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={sheet.detailLabel}>Views</Text>
                    <Text style={sheet.detailValue}>{job.analytics.views}</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer with Edit and Applicants buttons only */}
          <View style={sheet.footer}>
            <TouchableOpacity
              style={sheet.editBtn}
              onPress={() => { onClose(); setTimeout(() => onEditJob(job), 300); }}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={18} color={BLUE} />
              <Text style={sheet.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={sheet.applicantsBtn}
              onPress={() => { onClose(); setTimeout(() => onViewApplicants(job), 300); }}
              activeOpacity={0.85}
            >
              <Ionicons name="people-outline" size={18} color={WHITE} />
              <Text style={sheet.applicantsBtnText}>View Applicants</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Delete Confirmation Modal - REMOVED */}
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ClientScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { clientJobs, isLoading: jobsLoading } = useSelector(s => s.jobs.jobs);
  const { applications, isLoading: applicationsLoading } = useSelector(s => s.applications);
  const { updateJobSuccess, deleteJobSuccess } = useSelector(s => s.jobs);

  const [activeTab,    setActiveTab]    = useState('Home');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing,   setRefreshing]   = useState(false);
  const [selectedJob,  setSelectedJob]  = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getClientJobs({})).unwrap(),
        dispatch(getClientApplications({})).unwrap(),
      ]);
    } catch (e) { console.error('Dashboard fetch error:', e); }
  }, [dispatch]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Refresh when job is updated or deleted
  useEffect(() => {
    if (updateJobSuccess || deleteJobSuccess) {
      fetchDashboardData();
    }
  }, [updateJobSuccess, deleteJobSuccess, fetchDashboardData]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheetVisible) return false;
      if (activeTab !== 'Home') { setActiveTab('Home'); return true; }
      Alert.alert('Exit App', 'Are you sure you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    });
    return () => sub.remove();
  }, [activeTab, sheetVisible]);

  // Get applicants count for a specific job from applications data
  const getApplicantsCount = (jobId) => {
    if (!applications) return 0;
    return applications.filter(app => app.job_id?._id === jobId).length;
  };

  const activePostings = clientJobs?.filter(j => j.status === 'open' || j.status === 'in_progress').length || 0;
  const totalPosts     = clientJobs?.length || 0;
  const isLoading      = jobsLoading || applicationsLoading;

  const filteredJobs = (clientJobs || []).filter(j => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'open') return j.status === 'open' || j.status === 'in_progress';
    if (activeFilter === 'draft') return j.status === 'draft';
    if (activeFilter === 'completed') return j.status === 'completed' || j.status === 'cancelled';
    return true;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const handleTabPress = (key) => {
    setActiveTab(key);
    if (key === 'PostJob')       onNavigate('PostJob');
    if (key === 'Hiredtalents')  onNavigate('Hiredtalents');
    if (key === 'Message')       onNavigate('Message');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  const handleLogout = () =>
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive',
        onPress: async () => { await dispatch(logout()); onNavigate('Login'); } },
    ]);

  const openJobDetail = (job) => { setSelectedJob(job); setSheetVisible(true); };

  const handleStatusChange = async (jobId, status) => {
    try {
      await dispatch(updateJobStatus({ jobId, status })).unwrap();
      Alert.alert('Status Updated', `Job status changed to ${jobStatusLabel(status)}`);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await dispatch(deleteJob(jobId)).unwrap();
      Alert.alert('Deleted', 'Job has been deleted successfully');
      setSheetVisible(false);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to delete job');
    }
  };

  const getBudgetDisplay = (job) => {
    if (job.budget) {
      const { min, max, currency = 'PHP' } = job.budget;
      if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
      if (min) return `${currency} ${min.toLocaleString()}+`;
    }
    return null;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* ── Top Bar ─────────────────────────────────────────────────── */}
        <View style={styles.topbar}>
          <View style={styles.topbarInner}>
            <View style={styles.topbarLeft}>
              <View style={styles.logoBox}>
                <Image 
                  source={require('../../../assets/taskra.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.topbarBrand}>Taskra</Text>
            </View>
            <View style={styles.topbarRight}>
              <TouchableOpacity style={styles.notifBtn} onPress={() => onNavigate('Notif')}>
                <Ionicons name="notifications-outline" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.avatarBtn}>
                {user?.profile_picture
                  ? <Image source={{ uri: user.profile_picture }} style={styles.avatarImg} />
                  : <Text style={styles.avatarInitials}>{initials}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Main Scroll ─────────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
          }
        >

          {/* ── Dark Welcome Card ─────────────────────────────────────── */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeTop}>
              <View>
                <Text style={styles.goodMorning}>{getGreeting()}</Text>
                <Text style={styles.welcomeName}>{user?.first_name || 'Client'} {user?.last_name || ''}.</Text>
              </View>
              <TouchableOpacity style={styles.postJobCta} onPress={() => onNavigate('PostJob')} activeOpacity={0.85}>
                <Ionicons name="add" size={14} color={WHITE} />
                <Text style={styles.postJobCtaText}>Post a Job</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{activePostings}</Text>
                <Text style={styles.statLbl}>ACTIVE JOBS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{totalPosts}</Text>
                <Text style={styles.statLbl}>TOTAL POSTS</Text>
              </View>
            </View>
          </View>

          {/* ── Job Filter Tabs ──────────────────────────────────────── */}
          <View style={styles.filterRow}>
            {JOB_TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Job Postings Header ──────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Job postings</Text>
            <Text style={styles.sectionCount}>{filteredJobs.length} total</Text>
          </View>

          {/* ── Job List / Empty / Loading ───────────────────────────── */}
          {isLoading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={BLUE} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job, idx) => {
              const budgetDisplay   = getBudgetDisplay(job);
              const applicantsCount = getApplicantsCount(job._id);
              const sColor          = jobStatusColor(job.status);
              const sLabel          = jobStatusLabel(job.status);
              const locationText    = formatLocation(job.location);
              const jobTypeText     = formatJobType(job.job_type);
              const postedDateTime  = formatPostedDateTime(job.createdAt);
              const workSetupText   = formatWorkSetup(job.work_setup);

              return (
                <TouchableOpacity
                  key={job._id || idx}
                  style={styles.jobCard}
                  onPress={() => openJobDetail(job)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.jobCardAccent, { backgroundColor: sColor }]} />
                  <View style={styles.jobCardTop}>
                    <View style={styles.statusPill}>
                      <View style={[styles.statusDot, { backgroundColor: sColor }]} />
                      <Text style={[styles.statusText, { color: sColor }]}>{sLabel}</Text>
                    </View>
                    <View style={styles.rightBadgeGroup}>
                      {postedDateTime && (
                        <View style={styles.daysBadge}>
                          <Ionicons name="calendar-outline" size={10} color={TEXT_LIGHT} />
                          <Text style={styles.daysBadgeText}>{postedDateTime}</Text>
                        </View>
                      )}
                      {applicantsCount > 0 && (
                        <View style={styles.applicantsBadge}>
                          <Ionicons name="people-outline" size={10} color={BLUE} />
                          <Text style={styles.applicantsBadgeText}>{applicantsCount}</Text>
                        </View>
                      )}
                      {job.urgent && (
                        <View style={styles.urgentBadge}>
                          <Ionicons name="flame-outline" size={10} color={RED} />
                          <Text style={styles.urgentBadgeText}>Urgent</Text>
                        </View>
                      )}
                      {job.featured && (
                        <View style={styles.featuredBadge}>
                          <Ionicons name="star-outline" size={10} color={GOLD} />
                          <Text style={styles.featuredBadgeText}>Featured</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>

                  <View style={styles.jobMeta}>
                    {locationText && (
                      <View style={styles.jobMetaItem}>
                        <Ionicons name="location-outline" size={12} color={TEXT_MUTED} />
                        <Text style={styles.jobMetaText}>{locationText}</Text>
                      </View>
                    )}
                    {jobTypeText && (
                      <View style={styles.jobMetaItem}>
                        <Ionicons name="briefcase-outline" size={12} color={TEXT_MUTED} />
                        <Text style={styles.jobMetaText}>{jobTypeText}</Text>
                      </View>
                    )}
                    {workSetupText && (
                      <View style={styles.jobMetaItem}>
                        <Ionicons name="wifi-outline" size={12} color={TEXT_MUTED} />
                        <Text style={styles.jobMetaText}>{workSetupText}</Text>
                      </View>
                    )}
                  </View>

                  {budgetDisplay && (
                    <View style={styles.budgetChip}>
                      <Ionicons name="cash-outline" size={13} color={GOLD} />
                      <Text style={styles.budgetText}>{budgetDisplay}</Text>
                    </View>
                  )}

                  <View style={styles.jobFooter}>
                    <View style={styles.applicantsRow}>
                      <Ionicons name="people-outline" size={13} color={TEXT_MUTED} />
                      <Text style={styles.applicantsText}>
                        {applicantsCount} applicant{applicantsCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={styles.viewDetailChip}>
                      <Text style={styles.viewDetailText}>View Details</Text>
                      <Ionicons name="arrow-forward" size={12} color={BLUE} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            !isLoading && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="people-outline" size={34} color={GOLD_LIGHT} />
                </View>
                <Text style={styles.emptyTitle}>Start hiring today</Text>
                <Text style={styles.emptySub}>
                  Your job board is empty.{'\n'}Post a role and reach top talent fast.
                </Text>
              </View>
            )
          )}

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── Bottom Tab Bar ───────────────────────────────────────────── */}
        <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              const isPost = tab.key === 'PostJob';
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {isPost ? (
                    <View style={styles.tabFab}>
                      <Ionicons name={active ? tab.icon : tab.iconOutline} size={22} color={WHITE} />
                    </View>
                  ) : (
                    <>
                      {active && <View style={styles.tabActiveBar} />}
                      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                        <Ionicons
                          name={active ? tab.icon : tab.iconOutline}
                          size={22}
                          color={active ? BLUE : TEXT_LIGHT}
                        />
                      </View>
                    </>
                  )}
                  <Text style={[
                    styles.tabLabel,
                    active && !isPost && styles.tabLabelActive,
                    isPost && styles.tabLabelPost,
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>

        {/* ── Job Detail Sheet ─────────────────────────────────────────── */}
        <JobDetailSheet
          job={selectedJob}
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          onEditJob={(job) => onNavigate('Mypostings', { jobId: job._id })}
          onViewApplicants={(job) => onNavigate('Applications', { jobId: job._id })}
          applications={applications}
          onStatusChange={handleStatusChange}
          onDeleteJob={handleDeleteJob}
        />
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },
  root: { flex: 1, backgroundColor: OFF_WHITE },

  topbar: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topbarInner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topbarLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: {
    width: 34,
    height: 34,
    backgroundColor: WHITE,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,85,165,0.15)',
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  topbarBrand:  { fontSize: 17, fontWeight: '800', color: TEXT_MAIN, letterSpacing: 0.5 },
  topbarRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn:     { padding: 4 },
  avatarBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: BLUE_DARK,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg:      { width: 34, height: 34, borderRadius: 17 },
  avatarInitials: { fontSize: 12, fontWeight: '800', color: WHITE },

  scroll: { paddingBottom: 20 },

  welcomeCard: {
    backgroundColor: DARK_CARD,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 0,
    borderRadius: 18,
    padding: 18,
    paddingBottom: 16,
  },
  welcomeTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  goodMorning: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 26,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: -0.5,
  },
  postJobCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BLUE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BLUE_LIGHT,
  },
  postJobCtaText: { fontSize: 12, fontWeight: '700', color: WHITE },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: DARK_CARD2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statBox:    { flex: 1, alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12 },
  statDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },
  statVal:    { fontSize: 22, fontWeight: '800', color: GOLD_LIGHT, marginBottom: 4 },
  statLbl:    { fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: '600', letterSpacing: 1.2 },

  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
    gap: 2,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  filterTabActive: {
    backgroundColor: BLUE,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  filterTabTextActive: {
    color: WHITE,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN },
  sectionCount: { fontSize: 12, color: TEXT_LIGHT, fontWeight: '500' },

  loadingBox:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 40 },
  loadingText: { fontSize: 14, color: TEXT_MUTED },

  jobCard: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    paddingTop: 18,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  jobCardAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: GOLD_LIGHT,
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
  },
  jobCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F5F7FA',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  
  rightBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  daysBadgeText: {
    fontSize: 9,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  applicantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: BLUE_SOFT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BLUE_MID,
  },
  applicantsBadgeText: {
    fontSize: 10,
    color: BLUE,
    fontWeight: '700',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  urgentBadgeText: {
    fontSize: 9,
    color: RED,
    fontWeight: '700',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: GOLD_SOFT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GOLD_MID,
  },
  featuredBadgeText: {
    fontSize: 9,
    color: GOLD_DARK,
    fontWeight: '700',
  },

  jobTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6, lineHeight: 22 },
  jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  jobMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobMetaText: { fontSize: 12, color: TEXT_MUTED },
  
  budgetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GOLD_SOFT, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, borderColor: GOLD_MID, marginBottom: 10,
  },
  budgetText: { fontSize: 12, color: GOLD_DARK, fontWeight: '700' },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  applicantsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  applicantsText: { fontSize: 12, color: TEXT_MUTED },
  viewDetailChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailText: { fontSize: 12, color: BLUE, fontWeight: '600' },

  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: GOLD_LIGHT,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: GOLD_SOFT,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },

  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 4, position: 'relative' },
  tabActiveBar: { position: 'absolute', top: 0, width: 20, height: 2.5, backgroundColor: BLUE, borderRadius: 999 },
  tabIconWrap: { marginBottom: 3, marginTop: 6 },
  tabIconWrapActive: {},
  tabFab: {
    width: 46, height: 36, borderRadius: 12, backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 3, marginTop: 2,
    borderWidth: 1, borderColor: GOLD_LIGHT,
  },
  tabLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
  tabLabelActive: { color: BLUE, fontWeight: '700' },
  tabLabelPost: { color: GOLD, fontWeight: '700' },
});

// ── Sheet Styles ──────────────────────────────────────────────────────────────
const sheet = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  container: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.90,
    overflow: 'hidden',
  },
  goldBar: { height: 3.5, backgroundColor: GOLD_LIGHT },
  handle: {
    width: 40, height: 4, borderRadius: 999, backgroundColor: BORDER,
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 14, gap: 12 },
  jobIconBox: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: BLUE_SOFT,
    borderWidth: 1, borderColor: BLUE_MID, alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  jobTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, lineHeight: 23, marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', flexWrap: 'wrap' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  timeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#F5F7FA',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, marginLeft: 4,
  },
  timeBadgeText: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
  },
  
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE_SOFT,
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BLUE_MID,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statItemLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statItemValue: {
    fontSize: 14,
    color: TEXT_MAIN,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: BLUE_MID,
    marginHorizontal: 12,
  },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F5F7FA',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: BORDER,
  },
  metaChipGold: { backgroundColor: GOLD_SOFT, borderColor: GOLD_MID },
  metaText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 20, marginBottom: 16 },
  body: { paddingHorizontal: 20 },
  applicantsBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BLUE_SOFT, borderRadius: 13, padding: 14,
    borderWidth: 1, borderColor: BLUE_MID, marginBottom: 20,
  },
  applicantsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  applicantsCount: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  applicantsSub: { fontSize: 11, color: TEXT_MUTED },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: BLUE, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingVertical: 6, paddingHorizontal: 12, backgroundColor: BLUE_SOFT,
    borderRadius: 999, borderWidth: 1, borderColor: BLUE_MID,
  },
  tagText: { fontSize: 12, color: BLUE, fontWeight: '600' },
  descText: { fontSize: 14, color: TEXT_MUTED, lineHeight: 22 },
  questionItem: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  questionNumber: { fontSize: 14, color: BLUE, fontWeight: '600', width: 24 },
  questionText: { fontSize: 14, color: TEXT_MAIN, flex: 1, lineHeight: 20 },
  detailGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    backgroundColor: '#F5F7FA', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '45%' },
  detailLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '600' },
  
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  editBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: BLUE_SOFT,
    borderWidth: 1,
    borderColor: BLUE_MID,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: BLUE },
  applicantsBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: BLUE,
    borderWidth: 1,
    borderColor: BLUE_LIGHT,
  },
  applicantsBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },
});