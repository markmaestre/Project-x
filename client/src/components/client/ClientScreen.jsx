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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../Redux/slices/authSlice';
import { getClientJobs } from '../../Redux/slices/jobSlice';

// ── Semiconductor-Inspired Palette ────────────────────────────────────────────
const BLUE        = '#0068B5';
const BLUE_LIGHT  = '#3D9DD6';
const BLUE_DARK   = '#004F8C';
const BLUE_SOFT   = '#E2EAF4';
const BLUE_MID    = '#A8C4DC';
const BLUE_TINT   = 'rgba(0,104,181,0.10)';

const GOLD        = '#C9960C';
const GOLD_LIGHT  = '#F0B429';
const GOLD_DARK   = '#A07A08';
const GOLD_SOFT   = '#FDF3D7';
const GOLD_MID    = '#E6C56A';

const WHITE       = '#FFFFFF';
const OFF_WHITE   = '#F5F7FA';
const SURFACE     = '#EBF0F6';
const BORDER      = 'rgba(0,104,181,0.14)';

const TEXT_MAIN   = '#0D1B2A';
const TEXT_MUTED  = '#4A5E72';
const TEXT_LIGHT  = '#8B9AB0';

const RED         = '#E53935';
const AMBER       = '#F59E0B';
const GREEN_STATUS = '#1A8754';
// ─────────────────────────────────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get('window');

// ── Helper Functions (unchanged) ─────────────────────────────────────────────
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

// ── Bottom tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'          },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline'    },
  { key: 'Hiredtalents',   label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'        },
  { key: 'Message',       label: 'Messages', icon: 'chatbubble',    iconOutline: 'chatbubble-outline'    },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',        iconOutline: 'person-outline'        },
];

// ── Status helpers ────────────────────────────────────────────────────────────
const jobStatusColor = (s) =>
  s === 'open'        ? BLUE
  : s === 'in_progress' ? AMBER
  : s === 'completed'   ? GREEN_STATUS
  : RED;

const jobStatusLabel = (s) =>
  s === 'open'        ? 'Open'
  : s === 'in_progress' ? 'In Progress'
  : s === 'completed'   ? 'Completed'
  : s === 'cancelled'   ? 'Cancelled'
  : s;

// ── Job Detail Bottom Sheet ───────────────────────────────────────────────────
function JobDetailSheet({ job, visible, onClose, onEditJob, onViewApplicants }) {
  if (!job) return null;

  const sColor = jobStatusColor(job.status);
  const sLabel = jobStatusLabel(job.status);

  const locationText    = formatLocation(job.location);
  const jobTypeText     = formatJobType(job.job_type);
  const workSetupText   = formatWorkSetup(job.work_setup);
  const payText         = formatPayInformation(job.pay_information, job.budget_amount);
  const skills          = job.required_skills || job.skills || [];
  const applicantsCount = job.total_applicants || job.applicants_count || job.applications?.length || 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sheet.overlay}>
        <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={sheet.container}>
          {/* Gold shimmer bar at top of sheet */}
          <View style={sheet.goldBar} />
          <View style={sheet.handle} />

          {/* Header */}
          <View style={sheet.header}>
            <View style={sheet.jobIconBox}>
              <Ionicons name="briefcase-outline" size={22} color={BLUE} />
            </View>
            <View style={sheet.headerInfo}>
              <Text style={sheet.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>
              <View style={[sheet.statusBadge, { backgroundColor: sColor + '18' }]}>
                <View style={[sheet.statusDot, { backgroundColor: sColor }]} />
                <Text style={[sheet.statusText, { color: sColor }]}>{sLabel}</Text>
              </View>
            </View>
            <TouchableOpacity style={sheet.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          {/* Meta chips */}
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

          {/* Body */}
          <ScrollView
            style={sheet.body}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Applicants banner */}
            <TouchableOpacity
              style={sheet.applicantsBanner}
              onPress={() => { onClose(); setTimeout(() => onViewApplicants(job), 300); }}
              activeOpacity={0.85}
            >
              <View style={sheet.applicantsLeft}>
                <Ionicons name="people-outline" size={20} color={BLUE} />
                <View>
                  <Text style={sheet.applicantsCount}>{applicantsCount} Applicants</Text>
                  <Text style={sheet.applicantsSub}>Tap to review all applications</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={16} color={BLUE} />
            </TouchableOpacity>

            {/* Skills */}
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

            {/* Description */}
            <View style={sheet.section}>
              <Text style={sheet.sectionLabel}>Job Description</Text>
              <Text style={sheet.descText}>{job.description || 'No description provided.'}</Text>
            </View>

            {/* Requirements */}
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

            {/* Education */}
            {job.education_requirements && job.education_requirements.minimum_degree !== 'none' && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Education Requirements</Text>
                <Text style={sheet.descText}>
                  • Minimum Degree: {job.education_requirements.minimum_degree?.replace('_', ' ').toUpperCase()}
                </Text>
                {job.education_requirements.preferred_field && (
                  <Text style={sheet.descText}>• Preferred Field: {job.education_requirements.preferred_field}</Text>
                )}
                {job.education_requirements.years_of_experience > 0 && (
                  <Text style={sheet.descText}>• {job.education_requirements.years_of_experience}+ years in field</Text>
                )}
              </View>
            )}

            {/* Benefits */}
            {job.pay_information?.benefits?.length > 0 && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Benefits</Text>
                <View style={sheet.tagRow}>
                  {job.pay_information.benefits.map((benefit, i) => {
                    const benefitLabels = {
                      health_insurance: '🏥 Health Insurance',
                      paid_time_off: '🌴 Paid Time Off',
                      remote_stipend: '💻 Remote Stipend',
                      equipment_provided: '🖥️ Equipment Provided',
                      bonus_eligible: '🎯 Bonus Eligible',
                      retirement_plan: '💰 Retirement Plan',
                      professional_development: '📚 Professional Development',
                    };
                    return (
                      <View key={i} style={sheet.tag}>
                        <Text style={sheet.tagText}>{benefitLabels[benefit] || benefit}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Details grid */}
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
              {job.contact_preference && (
                <View style={sheet.detailItem}>
                  <Ionicons name="chatbubble-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={sheet.detailLabel}>Contact Via</Text>
                    <Text style={sheet.detailValue}>{job.contact_preference}</Text>
                  </View>
                </View>
              )}
              {job.created_at && (
                <View style={sheet.detailItem}>
                  <Ionicons name="time-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={sheet.detailLabel}>Posted</Text>
                    <Text style={sheet.detailValue}>
                      {new Date(job.created_at).toLocaleDateString('en-PH', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer actions */}
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
  const { user }                                                    = useSelector(s => s.auth);
  const { clientJobs, isLoading: jobsLoading }                      = useSelector(s => s.jobs.jobs);

  const [activeTab,    setActiveTab]    = useState('Home');
  const [refreshing,   setRefreshing]   = useState(false);
  const [selectedJob,  setSelectedJob]  = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`;
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  const fetchDashboardData = useCallback(async () => {
    try {
      await dispatch(getClientJobs({})).unwrap();
    } catch (e) { console.error('Dashboard fetch error:', e); }
  }, [dispatch]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const activePostings = clientJobs?.filter(j => j.status === 'open').length || 0;
  const isLoading      = jobsLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const handleTabPress = (key) => {
    setActiveTab(key);
    if (key === 'PostJob')       onNavigate('PostJob');
    if (key === 'Hiredtalents')   onNavigate('Hiredtalents');
    if (key === 'Message')       onNavigate('Message');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };
  
  const handleLogout = () =>
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => { await dispatch(logout()); onNavigate('Login'); },
      },
    ]);

  const openJobDetail = (job) => { setSelectedJob(job); setSheetVisible(true); };

  const getLocationDisplay = (job) => {
    if (!job.location) return null;
    if (typeof job.location === 'string') return job.location;
    return job.location.specific_area || job.location.city || null;
  };
  const getJobTypeDisplay    = (job) => formatJobType(job.job_type);
  const getBudgetDisplay     = (job) => {
    if (job.pay_information?.salary_range) {
      const { min, max, currency = 'PHP' } = job.pay_information.salary_range;
      if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
      if (min) return `${currency} ${min.toLocaleString()}+`;
    }
    if (job.budget_amount) return `₱${job.budget_amount.toLocaleString()}`;
    return null;
  };
  const getApplicantsCount   = (job) =>
    job.total_applicants || job.applicants_count || job.applications?.length || 0;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* ── Top Bar ───────────────────────────────────────────────── */}
        <View style={styles.topbar}>
          {/* Gold shimmer accent at very top of topbar */}
          <View style={styles.topbarGoldLine} />
          <View style={styles.topbarInner}>
            <View style={styles.topbarLeft}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>T</Text>
              </View>
              <View>
                <Text style={styles.topbarBrand}>Taskra</Text>
                <Text style={styles.topbarSub}>Client Portal</Text>
              </View>
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

        {/* ── Main Scroll ───────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
          }
        >
          {/* WELCOME */}
          <View style={styles.welcomeSection}>
            <View>
              <Text style={styles.welcomeBack}>Welcome back,</Text>
              <Text style={styles.welcomeName}>{user?.first_name || 'Client'}</Text>
            </View>
            <TouchableOpacity style={styles.postJobCta} onPress={() => onNavigate('PostJob')} activeOpacity={0.85}>
              <Ionicons name="add" size={16} color={WHITE} />
              <Text style={styles.postJobCtaText}>Post a Job</Text>
            </TouchableOpacity>
          </View>

          {/* STATS STRIP */}
          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{activePostings}</Text>
              <Text style={styles.statLbl}>Active Jobs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{clientJobs?.length || 0}</Text>
              <Text style={styles.statLbl}>Total Posts</Text>
            </View>
          </View>

          {/* MY JOB POSTINGS */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>OVERVIEW</Text>
              <Text style={styles.sectionTitle}>My Job Postings</Text>
            </View>
          </View>

          {isLoading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={BLUE} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : clientJobs && clientJobs.length > 0 ? (
            clientJobs.map((job, idx) => {
              const locationDisplay  = getLocationDisplay(job);
              const jobTypeDisplay   = getJobTypeDisplay(job);
              const budgetDisplay    = getBudgetDisplay(job);
              const applicantsCount  = getApplicantsCount(job);
              const sColor           = jobStatusColor(job.status);
              const sLabel           = jobStatusLabel(job.status);

              return (
                <TouchableOpacity
                  key={job._id || idx}
                  style={styles.jobCard}
                  onPress={() => openJobDetail(job)}
                  activeOpacity={0.85}
                >
                  {/* Gold accent top bar on each card */}
                  <View style={styles.jobCardGoldBar} />

                  {/* Status row */}
                  <View style={styles.jobCardTop}>
                    <View style={[styles.statusPill, { backgroundColor: sColor + '18' }]}>
                      <View style={[styles.statusDot, { backgroundColor: sColor }]} />
                      <Text style={[styles.statusText, { color: sColor }]}>{sLabel}</Text>
                    </View>
                    <TouchableOpacity style={styles.moreBtn}>
                      <Ionicons name="ellipsis-horizontal" size={18} color={TEXT_LIGHT} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>

                  <View style={styles.jobMeta}>
                    {locationDisplay && (
                      <View style={styles.jobMetaItem}>
                        <Ionicons name="location-outline" size={12} color={TEXT_MUTED} />
                        <Text style={styles.jobMetaText}>{locationDisplay}</Text>
                      </View>
                    )}
                    {jobTypeDisplay && (
                      <View style={styles.jobMetaItem}>
                        <Ionicons name="briefcase-outline" size={12} color={TEXT_MUTED} />
                        <Text style={styles.jobMetaText}>{jobTypeDisplay}</Text>
                      </View>
                    )}
                    {job.work_setup && (
                      <View style={styles.jobMetaItem}>
                        <Ionicons name="wifi-outline" size={12} color={TEXT_MUTED} />
                        <Text style={styles.jobMetaText}>{formatWorkSetup(job.work_setup)}</Text>
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
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="document-text-outline" size={32} color={BLUE} />
                </View>
                <Text style={styles.emptyTitle}>No job postings yet</Text>
                <Text style={styles.emptySub}>Post your first job and start finding talent</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => onNavigate('PostJob')}>
                  <Ionicons name="add" size={16} color={WHITE} />
                  <Text style={styles.emptyBtnText}>Post a Job</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Bottom Tab Bar ─────────────────────────────────────────── */}
        <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const active   = activeTab === tab.key;
              const isPost   = tab.key === 'PostJob';
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {active && <View style={styles.tabActiveBar} />}
                  {/* Post Job gets a gold FAB treatment */}
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

        {/* JOB DETAIL SHEET */}
        <JobDetailSheet
          job={selectedJob}
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          onEditJob={(job) => onNavigate('PostJob', { jobId: job._id })}
          onViewApplicants={(job) => onNavigate('Mypostings', { jobId: job._id })}
        />
      </View>
    </SafeAreaView>
  );
}

// ── Main Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },
  root: { flex: 1, backgroundColor: OFF_WHITE },

  // ── Top Bar ───────────────────────────────────────────────────────────────
  topbar: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  // Gold shimmer stripe at the very top of the topbar
  topbarGoldLine: {
    height: 2.5,
    backgroundColor: GOLD_LIGHT,
    opacity: 0.9,
  },
  topbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  topbarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 32, height: 32,
    backgroundColor: BLUE,
    borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BLUE_LIGHT,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 5, elevation: 3,
  },
  logoLetter: {
    fontSize: 16, fontWeight: '800', color: WHITE,
  },
  topbarBrand: {
    fontSize: 13, fontWeight: '800',
    letterSpacing: 3, color: TEXT_MAIN,
    lineHeight: 16,
  },
  topbarSub: {
    fontSize: 9, fontWeight: '600',
    letterSpacing: 1.5, color: TEXT_LIGHT,
    lineHeight: 12,
  },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn:    { position: 'relative', padding: 4 },
  notifDot: {
    position: 'absolute', top: 4, right: 4,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: RED, borderWidth: 2, borderColor: WHITE,
  },
  avatarBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: BLUE_SOFT,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BLUE_MID,
  },
  avatarImg:      { width: 34, height: 34, borderRadius: 17 },
  avatarInitials: { fontSize: 12, fontWeight: '700', color: BLUE },

  scroll: { paddingBottom: 32 },

  // ── Welcome ───────────────────────────────────────────────────────────────
  welcomeSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, marginBottom: 16,
  },
  welcomeBack: { fontSize: 13, color: TEXT_MUTED, marginBottom: 2, fontWeight: '400' },
  welcomeName: { fontSize: 24, fontWeight: '800', color: TEXT_MAIN, letterSpacing: -0.5 },
  postJobCta: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GOLD,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12,
    shadowColor: GOLD_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30, shadowRadius: 6, elevation: 3,
    borderWidth: 1, borderColor: GOLD_LIGHT,
  },
  postJobCtaText: { fontSize: 13, fontWeight: '700', color: WHITE },

  // ── Stats Strip ───────────────────────────────────────────────────────────
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    marginHorizontal: 16, marginBottom: 24,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: BORDER,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statDivider: { width: 1, backgroundColor: BORDER, marginVertical: 10 },
  statVal: {
    fontSize: 20, fontWeight: '800',
    color: GOLD, letterSpacing: -0.4, marginBottom: 2,
  },
  statLbl: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500', letterSpacing: 0.3 },

  // ── Section Header ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionEyebrow: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 2.5, color: BLUE,
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN, letterSpacing: -0.3 },
  sectionLink:  { fontSize: 13, color: GOLD, fontWeight: '600' },

  loadingBox:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 32 },
  loadingText: { fontSize: 14, color: TEXT_MUTED },

  // ── Job Cards ─────────────────────────────────────────────────────────────
  jobCard: {
    backgroundColor: WHITE,
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16, paddingTop: 20,
    borderWidth: 1.5, borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  jobCardGoldBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, backgroundColor: GOLD_LIGHT,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  jobCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  moreBtn:    { padding: 2 },
  jobTitle:   { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6, lineHeight: 23, letterSpacing: -0.2 },
  jobMeta:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  jobMetaItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobMetaText:{ fontSize: 12, color: TEXT_MUTED },
  budgetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GOLD_SOFT, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, borderColor: GOLD_MID, marginBottom: 12,
  },
  budgetText:     { fontSize: 12, color: GOLD_DARK, fontWeight: '700' },
  jobFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  applicantsRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  applicantsText: { fontSize: 12, color: TEXT_MUTED },
  viewDetailChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailText: { fontSize: 12, color: BLUE, fontWeight: '600' },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: WHITE,
    marginHorizontal: 16, borderRadius: 18,
    borderWidth: 1.5, borderColor: BORDER,
    padding: 36, alignItems: 'center',
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: BLUE_SOFT,
    borderWidth: 1.5, borderColor: BLUE_MID,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: BLUE,
    paddingVertical: 11, paddingHorizontal: 22, borderRadius: 12,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28, shadowRadius: 6, elevation: 3,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },

  // ── Tab Bar ───────────────────────────────────────────────────────────────
  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1.5, borderTopColor: BORDER,
    paddingTop: 6, paddingBottom: 4, paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4, position: 'relative',
  },
  // Blue active indicator bar at top of tab
  tabActiveBar: {
    position: 'absolute', top: 0,
    width: 24, height: 3,
    backgroundColor: BLUE, borderRadius: 999,
  },
  tabIconWrap: { position: 'relative', marginBottom: 3, marginTop: 6 },
  // Gold FAB for Post Job tab
  tabFab: {
    width: 44, height: 36, borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 3, marginTop: 2,
    shadowColor: GOLD_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 5, elevation: 3,
    borderWidth: 1, borderColor: GOLD_LIGHT,
  },
  tabLabel:      { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
  tabLabelActive:{ color: BLUE, fontWeight: '700' },
  tabLabelPost:  { color: GOLD, fontWeight: '700' },
  tabBadgeDot: {
    position: 'absolute', top: -1, right: -3,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: RED, borderWidth: 1.5, borderColor: WHITE,
  },
});

// ── Sheet Styles ──────────────────────────────────────────────────────────────
const sheet = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  container: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.88,
    paddingTop: 0,
    overflow: 'hidden',
  },
  // Gold shimmer bar at the very top of the bottom sheet
  goldBar: {
    height: 3.5, backgroundColor: GOLD_LIGHT,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: BORDER,
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },

  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, marginBottom: 14, gap: 12,
  },
  jobIconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: BLUE_SOFT,
    borderWidth: 1.5, borderColor: BLUE_MID,
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  jobTitle:   { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, lineHeight: 23, marginBottom: 6 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: SURFACE,
    alignItems: 'center', justifyContent: 'center',
  },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: SURFACE,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER,
  },
  metaChipGold: { backgroundColor: GOLD_SOFT, borderColor: GOLD_MID },
  metaText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },

  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 20, marginBottom: 16 },
  body:    { paddingHorizontal: 20 },

  applicantsBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BLUE_SOFT,
    borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: BLUE_MID, marginBottom: 20,
  },
  applicantsLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  applicantsCount: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  applicantsSub:   { fontSize: 11, color: TEXT_MUTED },

  section:      { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    color: BLUE, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 10,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: BLUE_SOFT,
    borderRadius: 999,
    borderWidth: 1, borderColor: BLUE_MID,
  },
  tagText:  { fontSize: 12, color: BLUE, fontWeight: '600' },
  descText: { fontSize: 14, color: TEXT_MUTED, lineHeight: 22 },

  detailGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: BORDER,
  },
  detailItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '45%' },
  detailLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '600' },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  editBtn: {
    flex: 1, height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: BLUE_SOFT,
    borderWidth: 1.5, borderColor: BLUE_MID,
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: BLUE },
  applicantsBtn: {
    flex: 1, height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: BLUE,
    overflow: 'hidden',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 8, elevation: 4,
    borderWidth: 1, borderColor: BLUE_LIGHT,
  },
  applicantsBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },
});