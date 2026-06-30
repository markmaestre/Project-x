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
import { getClientJobs } from '../../Redux/slices/jobSlice';
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
// For job card - shows actual date and time from createdAt
const formatPostedDateTime = (date) => {
  if (!date) return null;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      console.warn('Invalid date:', date);
      return null;
    }
    
    // Format: "Jun 29, 2026 at 2:30 PM"
    return d.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

// For time ago display (optional, for detail sheet)
const getTimeAgo = (date) => {
  if (!date) return null;
  
  try {
    const now = new Date();
    const past = new Date(date);
    
    if (isNaN(past.getTime())) {
      console.warn('Invalid date for time ago:', date);
      return null;
    }
    
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  } catch (error) {
    console.error('Error parsing date for time ago:', error);
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
  if (location.specific_area) parts.push(location.specific_area);
  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  if (location.country && location.country !== 'Philippines') parts.push(location.country);
  return parts.length > 0 ? parts.join(', ') : null;
};

const formatJobType = (type) => {
  const types = {
    full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
    one_time: 'One Time', internship: 'Internship', freelance: 'Freelance',
  };
  return types[type] || type;
};

const formatWorkSetup = (setup) => {
  const setups = { remote: 'Remote', onsite: 'Onsite', hybrid: 'Hybrid' };
  return setups[setup] || setup;
};

const formatPayInformation = (payInfo, budgetAmount) => {
  if (payInfo?.salary_range?.min || payInfo?.salary_range?.max) {
    const { min, max, currency = 'PHP' } = payInfo.salary_range;
    const freq = payInfo.payment_frequency || 'monthly';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} / ${freq}`;
    if (min) return `${currency} ${min.toLocaleString()}+ / ${freq}`;
  }
  if (budgetAmount) return `₱${budgetAmount.toLocaleString()}`;
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
function JobDetailSheet({ job, visible, onClose, onEditJob, onViewApplicants, applications }) {
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
  const payText         = formatPayInformation(job.pay_information, job.budget_amount);
  const skills          = job.required_skills || job.skills || [];
  const timeAgo         = getTimeAgo(job.createdAt);
  const fullDate        = formatFullDate(job.createdAt);
  
  // Get applicants count from applications data
  const jobApplications = applications?.filter(app => app.job_id?._id === job._id) || [];
  const applicantsCount = jobApplications.length;

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

          {/* Stats Bar - Shows date posted and applicants */}
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
            {payText && (
              <View style={[sheet.metaChip, sheet.metaChipGold]}>
                <Ionicons name="cash-outline" size={13} color={GOLD} />
                <Text style={[sheet.metaText, { color: GOLD_DARK, fontWeight: '600' }]}>{payText}</Text>
              </View>
            )}
          </View>

          <View style={sheet.divider} />

          <ScrollView
            style={sheet.body}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
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

            {/* Requirements & Qualifications */}
            {job.requirements && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Requirements & Qualifications</Text>
                {typeof job.requirements === 'object' ? (
                  <View>
                    {job.requirements.min_years_experience > 0 && (
                      <Text style={sheet.descText}>• {job.requirements.min_years_experience}+ years of experience</Text>
                    )}
                    {job.requirements.preferred_tools?.length > 0 && (
                      <Text style={sheet.descText}>• Preferred tools: {job.requirements.preferred_tools.join(', ')}</Text>
                    )}
                    {job.requirements.additional_requirements && (
                      <Text style={sheet.descText}>• {job.requirements.additional_requirements}</Text>
                    )}
                  </View>
                ) : (
                  <Text style={sheet.descText}>{job.requirements}</Text>
                )}
              </View>
            )}

            {/* Benefits */}
            {job.pay_information?.benefits?.length > 0 && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Benefits</Text>
                <View style={sheet.tagRow}>
                  {job.pay_information.benefits.map((benefit, i) => {
                    const config = BENEFIT_CONFIG[benefit];
                    return (
                      <View key={i} style={sheet.benefitTag}>
                        <Ionicons name={config?.icon || 'checkmark-circle-outline'} size={13} color={BLUE} />
                        <Text style={sheet.tagText}>{config?.label || benefit}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Detail Grid */}
            <View style={sheet.detailGrid}>
              {job.experience_level && (
                <View style={sheet.detailItem}>
                  <Ionicons name="bar-chart-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={sheet.detailLabel}>Experience Level</Text>
                    <Text style={sheet.detailValue}>{job.experience_level}</Text>
                  </View>
                </View>
              )}
              {job.urgency_level && (
                <View style={sheet.detailItem}>
                  <Ionicons name="flame-outline" size={16} color={GOLD} />
                  <View>
                    <Text style={sheet.detailLabel}>Urgency</Text>
                    <Text style={sheet.detailValue}>{job.urgency_level?.toUpperCase()}</Text>
                  </View>
                </View>
              )}
              {job.estimated_duration && (
                <View style={sheet.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={sheet.detailLabel}>Duration</Text>
                    <Text style={sheet.detailValue}>{job.estimated_duration}</Text>
                  </View>
                </View>
              )}
              {job.createdAt && (
                <View style={sheet.detailItem}>
                  <Ionicons name="time-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={sheet.detailLabel}>Posted</Text>
                    <Text style={sheet.detailValue}>
                      {formatFullDate(job.createdAt)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={sheet.footer}>
            <TouchableOpacity
              style={sheet.editBtn}
              onPress={() => { onClose(); setTimeout(() => onEditJob(job), 300); }}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={18} color={BLUE} />
              <Text style={sheet.editBtnText}>Edit Job</Text>
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
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ClientScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { clientJobs, isLoading: jobsLoading } = useSelector(s => s.jobs.jobs);
  const { applications, isLoading: applicationsLoading } = useSelector(s => s.applications);

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

  const getBudgetDisplay = (job) => {
    if (job.pay_information?.salary_range) {
      const { min, max, currency = 'PHP' } = job.pay_information.salary_range;
      if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
      if (min) return `${currency} ${min.toLocaleString()}+`;
    }
    if (job.budget_amount) return `₱${job.budget_amount.toLocaleString()}`;
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
                <Text style={styles.logoLetter}>T</Text>
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
                      <TouchableOpacity style={styles.moreBtn}>
                        <Ionicons name="ellipsis-horizontal" size={18} color={TEXT_LIGHT} />
                      </TouchableOpacity>
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
                      <Text style={styles.viewDetailText}>View details</Text>
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
          onEditJob={(job) => onNavigate('PostJob', { jobId: job._id })}
          onViewApplicants={(job) => onNavigate('Mypostings', { jobId: job._id })}
          applications={applications}
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
    width: 28, height: 28, backgroundColor: BLUE, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  logoLetter:   { fontSize: 14, fontWeight: '900', color: WHITE },
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
  moreBtn: { padding: 2 },

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
    maxHeight: SCREEN_H * 0.88,
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
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
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
  benefitTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: BLUE_SOFT, borderRadius: 999, borderWidth: 1, borderColor: BLUE_MID,
  },
  tagText: { fontSize: 12, color: BLUE, fontWeight: '600' },
  descText: { fontSize: 14, color: TEXT_MUTED, lineHeight: 22 },
  detailGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    backgroundColor: '#F5F7FA', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '45%' },
  detailLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '600' },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  editBtn: {
    flex: 1, height: 50, borderRadius: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: BLUE_SOFT, borderWidth: 1, borderColor: BLUE_MID,
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: BLUE },
  applicantsBtn: {
    flex: 1, height: 50, borderRadius: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: BLUE, borderWidth: 1, borderColor: BLUE_LIGHT,
  },
  applicantsBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },
});