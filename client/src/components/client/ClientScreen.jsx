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
import { getSentOffers, getOfferStats } from '../../Redux/slices/offerSlice';

// ── Design tokens ──────────────────────────────────────────────────────────
const GREEN      = '#4ADE80';
const GREEN_DARK = '#22C55E';
const GREEN_SOFT = '#DCFCE7';
const GREEN_MID  = '#86EFAC';
const WHITE      = '#FFFFFF';
const OFF_WHITE  = '#F0FDF4';
const BORDER     = 'rgba(74,222,128,0.25)';
const TEXT_MAIN  = '#0F2417';
const TEXT_MUTED = '#6B7280';
const TEXT_LIGHT = '#9CA3AF';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Helper Functions for formatting data ───────────────────────────────────
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
    'full_time': 'Full Time',
    'part_time': 'Part Time',
    'contract': 'Contract',
    'one_time': 'One Time',
    'internship': 'Internship',
    'freelance': 'Freelance'
  };
  return types[type] || type;
};

const formatWorkSetup = (setup) => {
  const setups = {
    'remote': 'Remote',
    'onsite': 'Onsite',
    'hybrid': 'Hybrid'
  };
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

// ── Bottom tabs — client-specific ─────────────────────────────────────────
const TABS = [
  { key: 'Home',        label: 'Home',       icon: 'home',             iconOutline: 'home-outline'            },
  { key: 'PostJob',     label: 'Post Job',   icon: 'add-circle',       iconOutline: 'add-circle-outline'      },
  { key: 'MyPostings',  label: 'Postings',   icon: 'document-text',    iconOutline: 'document-text-outline'   },
  { key: 'Message',     label: 'Messages',   icon: 'chatbubble',       iconOutline: 'chatbubble-outline'      },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',           iconOutline: 'person-outline'          },
];

// ── Job Detail Bottom Sheet ────────────────────────────────────────────────
function JobDetailSheet({ job, visible, onClose, onEditJob, onViewApplicants }) {
  if (!job) return null;

  const statusColor = job.status === 'open' ? GREEN_DARK
    : job.status === 'in_progress' ? '#F59E0B'
    : '#EF4444';

  const statusLabel = job.status === 'open' ? 'Open'
    : job.status === 'in_progress' ? 'In Progress'
    : job.status === 'completed' ? 'Completed'
    : job.status === 'cancelled' ? 'Cancelled' : job.status;

  const locationText = formatLocation(job.location);
  const jobTypeText = formatJobType(job.job_type);
  const workSetupText = formatWorkSetup(job.work_setup);
  const payText = formatPayInformation(job.pay_information, job.budget_amount);
  
  // Get skills from either required_skills or skills array
  const skills = job.required_skills || job.skills || [];
  
  // Get applicants count
  const applicantsCount = job.total_applicants || job.applicants_count || job.applications?.length || 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sheet.overlay}>
        <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={sheet.container}>
          <View style={sheet.handle} />

          {/* Header */}
          <View style={sheet.header}>
            <View style={sheet.jobIconBox}>
              <Ionicons name="briefcase-outline" size={22} color={GREEN_DARK} />
            </View>
            <View style={sheet.headerInfo}>
              <Text style={sheet.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>
              <View style={[sheet.statusBadge, { backgroundColor: statusColor + '18' }]}>
                <View style={[sheet.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[sheet.statusText, { color: statusColor }]}>{statusLabel}</Text>
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
              <View style={[sheet.metaChip, sheet.metaChipGreen]}>
                <Ionicons name="cash-outline" size={13} color={GREEN_DARK} />
                <Text style={[sheet.metaText, { color: GREEN_DARK, fontWeight: '600' }]}>
                  {payText}
                </Text>
              </View>
            )}
          </View>

          <View style={sheet.divider} />

          {/* Body */}
          <ScrollView style={sheet.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

            {/* Applicants summary */}
            <TouchableOpacity 
              style={sheet.applicantsBanner} 
              onPress={() => { onClose(); setTimeout(() => onViewApplicants(job), 300); }} 
              activeOpacity={0.85}>
              <View style={sheet.applicantsLeft}>
                <Ionicons name="people-outline" size={20} color={GREEN_DARK} />
                <View>
                  <Text style={sheet.applicantsCount}>{applicantsCount} Applicants</Text>
                  <Text style={sheet.applicantsSub}>Tap to review all applications</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={16} color={GREEN_DARK} />
            </TouchableOpacity>

            {/* Skills required */}
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
                      <Text style={sheet.descText}>
                        • {job.requirements.min_years_experience}+ years of experience
                      </Text>
                    )}
                    {job.requirements.preferred_tools?.length > 0 && (
                      <Text style={sheet.descText}>
                        • Preferred tools: {job.requirements.preferred_tools.join(', ')}
                      </Text>
                    )}
                    {job.requirements.additional_requirements && (
                      <Text style={sheet.descText}>
                        • {job.requirements.additional_requirements}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={sheet.descText}>{job.requirements}</Text>
                )}
              </View>
            )}

            {/* Education Requirements */}
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
                      professional_development: '📚 Professional Development'
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
                  <Ionicons name="bar-chart-outline" size={16} color={GREEN_DARK} />
                  <View>
                    <Text style={sheet.detailLabel}>Experience Level</Text>
                    <Text style={sheet.detailValue}>{job.experience_level}</Text>
                  </View>
                </View>
              )}
              {job.urgency_level && (
                <View style={sheet.detailItem}>
                  <Ionicons name="flame-outline" size={16} color={GREEN_DARK} />
                  <View>
                    <Text style={sheet.detailLabel}>Urgency</Text>
                    <Text style={sheet.detailValue}>{job.urgency_level?.toUpperCase()}</Text>
                  </View>
                </View>
              )}
              {job.estimated_duration && (
                <View style={sheet.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={GREEN_DARK} />
                  <View>
                    <Text style={sheet.detailLabel}>Duration</Text>
                    <Text style={sheet.detailValue}>{job.estimated_duration}</Text>
                  </View>
                </View>
              )}
              {job.contact_preference && (
                <View style={sheet.detailItem}>
                  <Ionicons name="chatbubble-outline" size={16} color={GREEN_DARK} />
                  <View>
                    <Text style={sheet.detailLabel}>Contact Via</Text>
                    <Text style={sheet.detailValue}>{job.contact_preference}</Text>
                  </View>
                </View>
              )}
              {job.created_at && (
                <View style={sheet.detailItem}>
                  <Ionicons name="time-outline" size={16} color={GREEN_DARK} />
                  <View>
                    <Text style={sheet.detailLabel}>Posted</Text>
                    <Text style={sheet.detailValue}>
                      {new Date(job.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer actions */}
          <View style={sheet.footer}>
            <TouchableOpacity style={sheet.editBtn} onPress={() => { onClose(); setTimeout(() => onEditJob(job), 300); }} activeOpacity={0.85}>
              <Ionicons name="create-outline" size={18} color={GREEN_DARK} />
              <Text style={sheet.editBtnText}>Edit Job</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sheet.applicantsBtn} onPress={() => { onClose(); setTimeout(() => onViewApplicants(job), 300); }} activeOpacity={0.85}>
              <Ionicons name="people-outline" size={18} color={WHITE} />
              <Text style={sheet.applicantsBtnText}>View Applicants</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function ClientScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { user }                                                           = useSelector(s => s.auth);
  const { clientJobs, isLoading: jobsLoading }                             = useSelector(s => s.jobs.jobs);
  const { sentOffers, stats: offerStats, isLoading: offersLoading }        = useSelector(s => s.offers);

  const [activeTab,    setActiveTab]    = useState('Home');
  const [refreshing,   setRefreshing]   = useState(false);
  const [selectedJob,  setSelectedJob]  = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`;
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  const fetchDashboardData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getClientJobs({})).unwrap(),
        dispatch(getSentOffers({})).unwrap(),
      ]);
      try { await dispatch(getOfferStats()).unwrap(); } catch (_) {}
    } catch (e) { console.error('Dashboard fetch error:', e); }
  }, [dispatch]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const activePostings = clientJobs?.filter(j => j.status === 'open').length || 0;
  const pendingOffers  = sentOffers?.filter(o => o.status === 'pending').length || 0;
  const isLoading      = jobsLoading || offersLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const handleTabPress = (key) => {
    setActiveTab(key);
    if (key === 'PostJob')       onNavigate('PostJob');
    if (key === 'MyPostings')    onNavigate('Mypostings');
    if (key === 'Message')       onNavigate('Message');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  const handleLogout = () =>
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive',
        onPress: async () => { await dispatch(logout()); onNavigate('Login'); } },
    ]);

  const openJobDetail = (job) => {
    setSelectedJob(job);
    setSheetVisible(true);
  };

  const statusColor = (s) =>
    s === 'open' ? GREEN_DARK : s === 'in_progress' ? '#F59E0B' : s === 'completed' ? '#10B981' : '#EF4444';

  const statusLabel = (s) =>
    s === 'open' ? 'Open' : s === 'in_progress' ? 'In Progress' : s === 'completed' ? 'Completed' : s === 'cancelled' ? 'Cancelled' : s;

  // Format location for card display
  const getLocationDisplay = (job) => {
    if (!job.location) return null;
    if (typeof job.location === 'string') return job.location;
    return job.location.specific_area || job.location.city || null;
  };

  // Format job type display
  const getJobTypeDisplay = (job) => {
    return formatJobType(job.job_type);
  };

  // Format budget display
  const getBudgetDisplay = (job) => {
    if (job.pay_information?.salary_range) {
      const { min, max, currency = 'PHP' } = job.pay_information.salary_range;
      if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
      if (min) return `${currency} ${min.toLocaleString()}+`;
    }
    if (job.budget_amount) return `₱${job.budget_amount.toLocaleString()}`;
    return null;
  };

  // Get applicants count
  const getApplicantsCount = (job) => {
    return job.total_applicants || job.applicants_count || job.applications?.length || 0;
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* TOP BAR */}
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>T</Text>
            </View>
            <Text style={styles.topbarBrand}>Taskra</Text>
          </View>
          <View style={styles.topbarRight}>
            <TouchableOpacity style={styles.notifBtn} onPress={() => onNavigate('Notifications')}>
              <Ionicons name="notifications-outline" size={24} color={TEXT_MAIN} />
              {pendingOffers > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.avatarBtn}>
              {user?.profile_picture
                ? <Image source={{ uri: user.profile_picture }} style={styles.avatarImg} />
                : <Text style={styles.avatarInitials}>{initials}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* MAIN SCROLL */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_DARK} />}
        >
          {/* WELCOME */}
          <View style={styles.welcomeSection}>
            <View>
              <Text style={styles.welcomeBack}>Welcome back,</Text>
              <Text style={styles.welcomeName}>{user?.first_name || 'Client'}</Text>
            </View>
            {/* Post Job CTA */}
            <TouchableOpacity style={styles.postJobCta} onPress={() => onNavigate('PostJob')} activeOpacity={0.85}>
              <Ionicons name="add" size={16} color={WHITE} />
              <Text style={styles.postJobCtaText}>Post a Job</Text>
            </TouchableOpacity>
          </View>

          {/* QUICK ACTIONS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            <TouchableOpacity style={styles.quickChip} onPress={() => onNavigate('Mypostings')} activeOpacity={0.8}>
              <Ionicons name="document-text-outline" size={14} color={GREEN_DARK} />
              <Text style={styles.quickChipText}>My Postings</Text>
              {activePostings > 0 && (
                <View style={styles.chipBadge}><Text style={styles.chipBadgeText}>{activePostings}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickChip} onPress={() => onNavigate('Sentoffers')} activeOpacity={0.8}>
              <Ionicons name="paper-plane-outline" size={14} color={GREEN_DARK} />
              <Text style={styles.quickChipText}>Sent Offers</Text>
              {pendingOffers > 0 && (
                <View style={styles.chipBadge}><Text style={styles.chipBadgeText}>{pendingOffers}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickChip} onPress={() => onNavigate('Hiredtalents')} activeOpacity={0.8}>
              <Ionicons name="people-outline" size={14} color={GREEN_DARK} />
              <Text style={styles.quickChipText}>Hired Talent</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* MY JOB POSTINGS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Job Postings</Text>
            <TouchableOpacity onPress={() => onNavigate('Mypostings')}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>

          {isLoading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={GREEN_DARK} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : clientJobs && clientJobs.length > 0 ? (
            clientJobs.slice(0, 6).map((job, idx) => {
              const locationDisplay = getLocationDisplay(job);
              const jobTypeDisplay = getJobTypeDisplay(job);
              const budgetDisplay = getBudgetDisplay(job);
              const applicantsCount = getApplicantsCount(job);
              
              return (
                <TouchableOpacity
                  key={job._id || idx}
                  style={styles.jobCard}
                  onPress={() => openJobDetail(job)}
                  activeOpacity={0.85}
                >
                  {/* Card top row */}
                  <View style={styles.jobCardTop}>
                    <View style={[styles.statusPill, { backgroundColor: statusColor(job.status) + '18' }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor(job.status) }]} />
                      <Text style={[styles.statusText, { color: statusColor(job.status) }]}>
                        {statusLabel(job.status)}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.moreBtn}>
                      <Ionicons name="ellipsis-horizontal" size={18} color={TEXT_MUTED} />
                    </TouchableOpacity>
                  </View>

                  {/* Title */}
                  <Text style={styles.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>

                  {/* Company / location row */}
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

                  {/* Budget */}
                  {budgetDisplay && (
                    <View style={styles.budgetChip}>
                      <Ionicons name="cash-outline" size={13} color={GREEN_DARK} />
                      <Text style={styles.budgetText}>{budgetDisplay}</Text>
                    </View>
                  )}

                  {/* Applicants count */}
                  <View style={styles.jobFooter}>
                    <View style={styles.applicantsRow}>
                      <Ionicons name="people-outline" size={13} color={TEXT_MUTED} />
                      <Text style={styles.applicantsText}>
                        {applicantsCount} applicant{applicantsCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={styles.viewDetailChip}>
                      <Text style={styles.viewDetailText}>View details</Text>
                      <Ionicons name="arrow-forward" size={12} color={GREEN_DARK} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            !isLoading && (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={40} color={GREEN_MID} />
                <Text style={styles.emptyTitle}>No job postings yet</Text>
                <Text style={styles.emptySub}>Post your first job and start finding talent</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => onNavigate('PostJob')}>
                  <Ionicons name="add" size={16} color={WHITE} />
                  <Text style={styles.emptyBtnText}>Post a Job</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          {/* SENT OFFERS SECTION */}
          {sentOffers && sentOffers.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                <Text style={styles.sectionTitle}>Sent Offers</Text>
                <TouchableOpacity onPress={() => onNavigate('Sentoffers')}>
                  <Text style={styles.sectionLink}>See all</Text>
                </TouchableOpacity>
              </View>
              {sentOffers.slice(0, 4).map((offer, idx) => {
                const oColor = offer.status === 'accepted' ? GREEN_DARK : offer.status === 'pending' ? '#F59E0B' : '#EF4444';
                const oLabel = offer.status === 'accepted' ? 'Accepted' : offer.status === 'pending' ? 'Pending' : 'Declined';
                return (
                  <TouchableOpacity
                    key={offer._id || idx}
                    style={styles.offerCard}
                    onPress={() => onNavigate('Sentoffers')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.offerAvatarWrap}>
                      <View style={styles.offerAvatar}>
                        <Ionicons name="person-outline" size={18} color={GREEN_DARK} />
                      </View>
                    </View>
                    <View style={styles.offerInfo}>
                      <Text style={styles.offerFreelancer} numberOfLines={1}>
                        {offer.freelancer_name || 'Freelancer'}
                      </Text>
                      <Text style={styles.offerJob} numberOfLines={1}>
                        {offer.job_title || 'Job'}
                      </Text>
                      <Text style={styles.offerAmount}>₱{offer.amount?.toLocaleString() || 0}</Text>
                    </View>
                    <View style={[styles.offerStatusBadge, { backgroundColor: oColor + '18' }]}>
                      <Text style={[styles.offerStatusText, { color: oColor }]}>{oLabel}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* BOTTOM TAB BAR */}
        <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              const hasBadge = (tab.key === 'Message' && pendingOffers > 0);
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {active && <View style={styles.tabActiveBar} />}
                  <View style={styles.tabIconWrap}>
                    <Ionicons
                      name={active ? tab.icon : tab.iconOutline}
                      size={tab.key === 'PostJob' ? 26 : 23}
                      color={active ? GREEN_DARK : tab.key === 'PostJob' ? GREEN_DARK : TEXT_LIGHT}
                    />
                    {hasBadge && <View style={styles.tabBadgeDot} />}
                  </View>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive,
                    tab.key === 'PostJob' && { color: GREEN_DARK, fontWeight: '700' }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>

        {/* JOB DETAIL BOTTOM SHEET */}
        <JobDetailSheet
          job={selectedJob}
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          onEditJob={(job) => onNavigate('EditJob', { jobId: job._id })}
          onViewApplicants={(job) => onNavigate('JobApplicants', { jobId: job._id })}
        />

      </View>
    </SafeAreaView>
  );
}

// ── Main styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },
  root: { flex: 1, backgroundColor: OFF_WHITE },

  // Top bar
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10, backgroundColor: WHITE,
  },
  topbarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 30, height: 30, backgroundColor: GREEN, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoLetter:  { fontSize: 15, fontWeight: '800', color: WHITE },
  topbarBrand: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN, letterSpacing: -0.3 },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn:    { position: 'relative', padding: 4 },
  notifDot: {
    position: 'absolute', top: 4, right: 4,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: GREEN_DARK, borderWidth: 2, borderColor: WHITE,
  },
  avatarBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GREEN_MID,
  },
  avatarImg:      { width: 34, height: 34, borderRadius: 17 },
  avatarInitials: { fontSize: 12, fontWeight: '700', color: WHITE },

  scroll: { paddingBottom: 32 },

  // Welcome
  welcomeSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, marginBottom: 18,
  },
  welcomeBack: { fontSize: 13, color: TEXT_MUTED, marginBottom: 2 },
  welcomeName: { fontSize: 24, fontWeight: '800', color: TEXT_MAIN, letterSpacing: -0.4 },
  postJobCta: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GREEN_DARK, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12,
    shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  postJobCtaText: { fontSize: 13, fontWeight: '700', color: WHITE },

  // Quick chips
  quickRow: { gap: 8, paddingHorizontal: 20, marginBottom: 24 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GREEN_SOFT, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1, borderColor: GREEN_MID,
  },
  quickChipText: { fontSize: 13, fontWeight: '600', color: GREEN_DARK },
  chipBadge: {
    backgroundColor: GREEN_DARK, borderRadius: 999,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  chipBadgeText: { fontSize: 10, fontWeight: '700', color: WHITE },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle:  { fontSize: 18, fontWeight: '700', color: TEXT_MAIN },
  sectionLink:   { fontSize: 14, color: GREEN_DARK, fontWeight: '600' },

  loadingBox:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 32 },
  loadingText: { fontSize: 14, color: TEXT_MUTED },

  // Job cards
  jobCard: {
    backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  jobCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  moreBtn:    { padding: 2 },
  jobTitle:   { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6, lineHeight: 23 },
  jobMeta:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  jobMetaItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobMetaText:{ fontSize: 12, color: TEXT_MUTED },
  budgetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GREEN_SOFT, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, borderColor: GREEN_MID, marginBottom: 12,
  },
  budgetText: { fontSize: 12, color: GREEN_DARK, fontWeight: '600' },
  jobFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  applicantsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  applicantsText:{ fontSize: 12, color: TEXT_MUTED },
  viewDetailChip:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailText:{ fontSize: 12, color: GREEN_DARK, fontWeight: '600' },

  // Offer cards
  offerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  offerAvatarWrap: {},
  offerAvatar: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: GREEN_SOFT, borderWidth: 1, borderColor: GREEN_MID,
    alignItems: 'center', justifyContent: 'center',
  },
  offerInfo: { flex: 1 },
  offerFreelancer: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  offerJob:    { fontSize: 12, color: TEXT_MUTED, marginBottom: 2 },
  offerAmount: { fontSize: 13, fontWeight: '700', color: GREEN_DARK },
  offerStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  offerStatusText:  { fontSize: 11, fontWeight: '700' },

  // Empty state
  emptyCard: {
    backgroundColor: WHITE, marginHorizontal: 16, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER, padding: 36, alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, marginTop: 14, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginBottom: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GREEN_DARK, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },

  // Tab bar
  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    paddingTop: 6, paddingBottom: 4, paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 4, position: 'relative' },
  tabActiveBar: { position: 'absolute', top: 0, width: 28, height: 3, backgroundColor: GREEN_DARK, borderRadius: 999 },
  tabIconWrap: { position: 'relative', marginBottom: 3, marginTop: 6 },
  tabLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
  tabLabelActive: { color: GREEN_DARK, fontWeight: '700' },
  tabBadgeDot: {
    position: 'absolute', top: -1, right: -3,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: GREEN_DARK, borderWidth: 1.5, borderColor: WHITE,
  },
});

// ── Sheet styles ────────────────────────────────────────────────────────────
const sheet = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  container: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_H * 0.88, paddingTop: 12 },
  handle:    { width: 40, height: 4, borderRadius: 999, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 },

  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 14, gap: 12 },
  jobIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: GREEN_SOFT, borderWidth: 1, borderColor: GREEN_MID, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  jobTitle:   { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, lineHeight: 23, marginBottom: 6 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  closeBtn:   { width: 32, height: 32, borderRadius: 10, backgroundColor: OFF_WHITE, alignItems: 'center', justifyContent: 'center' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: OFF_WHITE, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB' },
  metaChipGreen: { backgroundColor: GREEN_SOFT, borderColor: GREEN_MID },
  metaText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20, marginBottom: 16 },
  body:    { paddingHorizontal: 20 },

  applicantsBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: GREEN_SOFT, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: GREEN_MID, marginBottom: 20,
  },
  applicantsLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  applicantsCount: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  applicantsSub:   { fontSize: 11, color: TEXT_MUTED },

  section:      { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: GREEN_DARK, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  tagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:          { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: GREEN_SOFT, borderRadius: 999, borderWidth: 1, borderColor: GREEN_MID },
  tagText:      { fontSize: 12, color: GREEN_DARK, fontWeight: '600' },
  descText:     { fontSize: 14, color: TEXT_MUTED, lineHeight: 22 },

  detailGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: OFF_WHITE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  detailItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '45%' },
  detailLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '600' },

  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  editBtn: {
    flex: 1, height: 48, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: GREEN_SOFT, borderWidth: 1.5, borderColor: GREEN_MID,
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: GREEN_DARK },
  applicantsBtn: {
    flex: 1, height: 48, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: GREEN_DARK,
    shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  applicantsBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },
});