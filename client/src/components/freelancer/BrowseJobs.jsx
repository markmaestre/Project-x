import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getFreelancerJobs, searchJobs } from '../../Redux/slices/jobSlice';
import { applyForJob, getFreelancerApplications } from '../../Redux/slices/applicationSlice';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.08)';
const INPUT_BG = '#1c1c1c';

const JOB_TYPES = ['All', 'full_time', 'part_time', 'contract', 'one_time'];
const WORK_SETUPS = ['All', 'remote', 'onsite', 'hybrid'];
const EXPERIENCE_LEVELS = ['All', 'Entry', 'Intermediate', 'Expert', 'Senior'];

export default function BrowseJobs({ onNavigate, onBack }) {
  const dispatch = useDispatch();
  const { list: jobs, isLoading: jobsLoading } = useSelector((state) => state.jobs.jobs);
  const { user } = useSelector((state) => state.auth);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [selectedWorkSetup, setSelectedWorkSetup] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filterAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Fetch jobs on mount
  const fetchJobs = useCallback(async () => {
    try {
      await dispatch(getFreelancerJobs({ limit: 50 })).unwrap();
    } catch (error) {
      console.error('Error fetching jobs:', error);
      Alert.alert('Error', 'Failed to load jobs');
    }
  }, [dispatch]);

  // Fetch freelancer's applications to know which jobs they already applied to
  const fetchApplications = useCallback(async () => {
    try {
      const result = await dispatch(getFreelancerApplications({})).unwrap();
      const appliedIds = result.applications.map(app => app.job_id._id);
      setAppliedJobIds(appliedIds);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [fetchJobs, fetchApplications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchJobs(), fetchApplications()]);
    setRefreshing(false);
  }, [fetchJobs, fetchApplications]);

  const openFilters = () => {
    setShowFilters(true);
    Animated.parallel([
      Animated.spring(filterAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeFilters = () => {
    Animated.parallel([
      Animated.spring(filterAnim, { toValue: 300, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowFilters(false));
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        await dispatch(searchJobs({ searchTerm: searchQuery })).unwrap();
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      await fetchJobs();
    }
  };

  const handleApplyFilters = async () => {
    const filters = {};
    if (selectedJobType !== 'All') filters.job_type = selectedJobType;
    if (selectedWorkSetup !== 'All') filters.work_setup = selectedWorkSetup;
    if (selectedExperience !== 'All') filters.experience_level = selectedExperience;
    
    try {
      await dispatch(getFreelancerJobs(filters)).unwrap();
      closeFilters();
    } catch (error) {
      Alert.alert('Error', 'Failed to apply filters');
    }
  };

  const handleApplyJob = (job) => {
    setSelectedJob(job);
    setProposedRate(job.budget_amount?.toString() || '');
    setCoverLetter(`I'm very interested in the ${job.title} position. My skills in ${job.required_skills?.join(', ') || 'this field'} make me a great fit for this role.`);
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!coverLetter.trim()) {
      Alert.alert('Error', 'Please write a cover letter');
      return;
    }

    // Check if already applied
    if (appliedJobIds.includes(selectedJob._id)) {
      Alert.alert('Already Applied', 'You have already applied for this position.');
      return;
    }

    setSubmitting(true);

    try {
      // Submit application to backend
      const result = await dispatch(applyForJob({
        job_id: selectedJob._id,
        cover_letter: coverLetter.trim(),
        proposed_rate: proposedRate ? parseFloat(proposedRate) : null,
      })).unwrap();
      
      console.log('Application submitted:', result);
      
      // Add to applied jobs list
      setAppliedJobIds([...appliedJobIds, selectedJob._id]);
      
      Alert.alert(
        'Application Submitted!',
        `Your application for ${selectedJob.title} has been sent to the client. They will review your application and may send you an offer.`,
        [{ text: 'OK', onPress: () => {
          setShowApplyModal(false);
          setCoverLetter('');
          setProposedRate('');
          // Refresh jobs to update applicant count
          fetchJobs();
        }}]
      );
    } catch (error) {
      console.error('Submit application error:', error);
      Alert.alert('Error', error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredJobs = () => {
    let filtered = jobs || [];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q) ||
          j.required_skills?.some((s) => s.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  };

  const getCategoryIcon = (job) => {
    const title = job.title?.toLowerCase() || '';
    if (title.includes('design') || title.includes('ui') || title.includes('ux')) return '🎨';
    if (title.includes('dev') || title.includes('developer') || title.includes('react') || title.includes('node')) return '💻';
    if (title.includes('write') || title.includes('content')) return '✍️';
    if (title.includes('market') || title.includes('seo')) return '📊';
    return '💼';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const getWorkSetupLabel = (setup) => {
    const labels = {
      remote: 'Remote',
      onsite: 'On-site',
      hybrid: 'Hybrid'
    };
    return labels[setup] || setup;
  };

  const getJobTypeLabel = (type) => {
    const labels = {
      full_time: 'Full-time',
      part_time: 'Part-time',
      contract: 'Contract',
      one_time: 'One-time'
    };
    return labels[type] || type;
  };

  const JobCard = ({ job }) => {
    const isUrgent = job.urgency_level === 'urgent';
    const hasApplied = appliedJobIds.includes(job._id);
    
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => { setSelectedJob(job); setShowJobModal(true); }}
        activeOpacity={0.85}
      >
        {isUrgent && (
          <View style={styles.badgeRow}>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>⚡ Urgent</Text>
            </View>
          </View>
        )}

        <View style={styles.jobHeader}>
          <View style={styles.companyLogo}>
            <Text style={styles.logoText}>{getCategoryIcon(job)}</Text>
          </View>
          <View style={styles.jobHeaderInfo}>
            <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
            <Text style={styles.companyName}>{job.client_id?.company_name || 'Client'}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.4)" />
            <Text style={styles.metaText}>{getWorkSetupLabel(job.work_setup)}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="briefcase-outline" size={12} color="rgba(255,255,255,0.4)" />
            <Text style={styles.metaText}>{getJobTypeLabel(job.job_type)}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.4)" />
            <Text style={styles.metaText}>{formatDate(job.created_at)}</Text>
          </View>
        </View>

        <Text style={styles.salary}>
          {job.budget_type === 'hourly' ? `₱${job.budget_amount}/hr` : `₱${job.budget_amount?.toLocaleString()}`}
        </Text>

        {job.required_skills && job.required_skills.length > 0 && (
          <View style={styles.skillsRow}>
            {job.required_skills.slice(0, 3).map((s, i) => (
              <View key={i} style={styles.skillBadge}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
            {job.required_skills.length > 3 && (
              <View style={styles.skillBadge}>
                <Text style={styles.skillText}>+{job.required_skills.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.applyBtn, hasApplied && styles.appliedBtn]}
          onPress={() => handleApplyJob(job)}
          disabled={hasApplied}
        >
          <Text style={[styles.applyBtnText, hasApplied && styles.appliedBtnText]}>
            {hasApplied ? '✓ Applied' : 'Apply Now'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const filtered = getFilteredJobs();

  if (jobsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Browse Jobs</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Browse Jobs</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={openFilters}>
            <Ionicons name="options-outline" size={20} color={GOLD} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.35)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, companies, or skills..."
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchJobs(); }}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.resultsLabel}>{filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} found</Text>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
          }
        >
          {filtered.length > 0 ? (
            filtered.map((job) => <JobCard key={job._id} job={job} />)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💼</Text>
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
            </View>
          )}
        </ScrollView>

        {/* Filter Drawer */}
        {showFilters && (
          <TouchableWithoutFeedback onPress={closeFilters}>
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>
        )}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: filterAnim }] }]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Filters</Text>
            <TouchableOpacity onPress={closeFilters}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <Text style={styles.drawerSection}>Job Type</Text>
            <View style={styles.drawerChips}>
              {JOB_TYPES.map((type) => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.drawerChip, selectedJobType === type && styles.drawerChipActive]}
                  onPress={() => setSelectedJobType(type)}
                >
                  <Text style={[styles.drawerChipText, selectedJobType === type && styles.drawerChipTextActive]}>
                    {type === 'All' ? 'All' : getJobTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.drawerSection}>Work Setup</Text>
            <View style={styles.drawerChips}>
              {WORK_SETUPS.map((setup) => (
                <TouchableOpacity 
                  key={setup} 
                  style={[styles.drawerChip, selectedWorkSetup === setup && styles.drawerChipActive]}
                  onPress={() => setSelectedWorkSetup(setup)}
                >
                  <Text style={[styles.drawerChipText, selectedWorkSetup === setup && styles.drawerChipTextActive]}>
                    {setup === 'All' ? 'All' : getWorkSetupLabel(setup)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.drawerSection}>Experience Level</Text>
            <View style={styles.drawerChips}>
              {EXPERIENCE_LEVELS.map((level) => (
                <TouchableOpacity 
                  key={level} 
                  style={[styles.drawerChip, selectedExperience === level && styles.drawerChipActive]}
                  onPress={() => setSelectedExperience(level)}
                >
                  <Text style={[styles.drawerChipText, selectedExperience === level && styles.drawerChipTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.drawerApplyBtn} onPress={handleApplyFilters}>
            <Text style={styles.drawerApplyText}>Apply Filters</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Job Detail Modal */}
        <Modal
          visible={showJobModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowJobModal(false)}
        >
          <View style={styles.modalWrap}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowJobModal(false)}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>

              {selectedJob && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalLogo}>
                      <Text style={styles.modalLogoText}>{getCategoryIcon(selectedJob)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalTitle}>{selectedJob.title}</Text>
                      <Text style={styles.modalCompany}>{selectedJob.client_id?.company_name || 'Client'}</Text>
                    </View>
                  </View>

                  <View style={styles.modalMeta}>
                    {[
                      { icon: 'location-outline', label: getWorkSetupLabel(selectedJob.work_setup) },
                      { icon: 'briefcase-outline', label: getJobTypeLabel(selectedJob.job_type) },
                      { icon: 'time-outline', label: formatDate(selectedJob.created_at) },
                      { icon: 'people-outline', label: `${selectedJob.total_applicants || 0} applicants` },
                    ].map(({ icon, label }) => (
                      <View key={label} style={styles.modalMetaItem}>
                        <Ionicons name={icon} size={14} color="rgba(255,255,255,0.45)" />
                        <Text style={styles.modalMetaText}>{label}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.modalSalary}>
                    {selectedJob.budget_type === 'hourly' 
                      ? `₱${selectedJob.budget_amount}/hr` 
                      : `₱${selectedJob.budget_amount?.toLocaleString()}`}
                  </Text>

                  <Text style={styles.modalSection}>Description</Text>
                  <Text style={styles.modalDesc}>{selectedJob.description}</Text>

                  {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                    <>
                      <Text style={styles.modalSection}>Required Skills</Text>
                      <View style={styles.modalSkills}>
                        {selectedJob.required_skills.map((s, i) => (
                          <View key={i} style={styles.modalSkillBadge}>
                            <Text style={styles.modalSkillText}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    style={[styles.modalApplyBtn, appliedJobIds.includes(selectedJob._id) && styles.modalAppliedBtn]}
                    onPress={() => {
                      setShowJobModal(false);
                      handleApplyJob(selectedJob);
                    }}
                    disabled={appliedJobIds.includes(selectedJob._id)}
                  >
                    <Text style={[styles.modalApplyText, appliedJobIds.includes(selectedJob._id) && { color: '#4ade80' }]}>
                      {appliedJobIds.includes(selectedJob._id) ? '✓ Already Applied' : 'Apply Now'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Apply Modal */}
        <Modal
          visible={showApplyModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowApplyModal(false)}
        >
          <View style={styles.applyModalWrap}>
            <View style={styles.applyModalSheet}>
              <View style={styles.applyModalHeader}>
                <Text style={styles.applyModalTitle}>Apply for Job</Text>
                <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {selectedJob && (
                <>
                  <Text style={styles.applyJobTitle}>{selectedJob.title}</Text>
                  <Text style={styles.applyJobCompany}>{selectedJob.client_id?.company_name || 'Client'}</Text>

                  <Text style={styles.applyLabel}>Proposed Rate (Optional)</Text>
                  <TextInput
                    style={styles.applyInput}
                    placeholder="Enter your proposed rate"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={proposedRate}
                    onChangeText={setProposedRate}
                    keyboardType="numeric"
                  />

                  <Text style={styles.applyLabel}>Cover Letter *</Text>
                  <TextInput
                    style={[styles.applyInput, styles.applyTextArea]}
                    placeholder="Tell the client why you're the best fit for this job..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={coverLetter}
                    onChangeText={setCoverLetter}
                    multiline
                    numberOfLines={6}
                  />

                  <View style={styles.applyButtons}>
                    <TouchableOpacity 
                      style={[styles.applyBtn, styles.applyCancelBtn]}
                      onPress={() => setShowApplyModal(false)}
                      disabled={submitting}
                    >
                      <Text style={styles.applyCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.applyBtn, styles.applySubmitBtn]}
                      onPress={submitApplication}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#0a0a0a" />
                      ) : (
                        <Text style={styles.applySubmitText}>Submit Application</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: INPUT_BG,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 0,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13 },
  resultsLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 6,
  },
  listContent: { paddingHorizontal: 14, paddingBottom: 24, gap: 12 },
  jobCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 8,
  },
  urgentBadge: {
    backgroundColor: 'rgba(255,107,107,0.13)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgentText: { fontSize: 10, color: '#ff6b6b', fontWeight: '700' },
  jobHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  companyLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: { fontSize: 19, fontWeight: '700', color: GOLD },
  jobHeaderInfo: { flex: 1 },
  jobTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2, lineHeight: 19 },
  companyName: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  salary: { fontSize: 14, fontWeight: '700', color: GOLD, marginBottom: 10 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillText: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  applyBtn: { backgroundColor: GOLD, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  appliedBtn: { backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: '#4ade80' },
  applyBtnText: { fontSize: 13, fontWeight: '700', color: '#0a0a0a' },
  appliedBtnText: { color: '#4ade80' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  emptySub: { fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6 },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 99,
  },
  drawer: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: 280, backgroundColor: '#111',
    borderLeftWidth: 1, borderLeftColor: BORDER,
    zIndex: 100, padding: 18, paddingTop: 22,
  },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  drawerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  drawerSection: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)',
    marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
  },
  drawerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  drawerChip: {
    backgroundColor: CARD_BG, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: BORDER,
  },
  drawerChipActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: GOLD,
  },
  drawerChipText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  drawerChipTextActive: { color: GOLD, fontWeight: '600' },
  drawerApplyBtn: { backgroundColor: GOLD, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  drawerApplyText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 18, maxHeight: '88%',
    borderTopWidth: 1, borderColor: BORDER,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 14,
  },
  modalCloseBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  modalHeader: { flexDirection: 'row', gap: 12, marginBottom: 14, marginTop: 4 },
  modalLogo: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  modalLogoText: { fontSize: 20, fontWeight: '700', color: GOLD },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 3 },
  modalCompany: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  modalMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  modalMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  modalMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  modalSalary: { fontSize: 18, fontWeight: '700', color: GOLD, marginBottom: 16 },
  modalSection: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 6, marginTop: 12 },
  modalDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  modalSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  modalSkillBadge: {
    backgroundColor: CARD_BG, paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 7, borderWidth: 1, borderColor: BORDER,
  },
  modalSkillText: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  modalApplyBtn: { backgroundColor: GOLD, paddingVertical: 13, borderRadius: 10, alignItems: 'center', marginBottom: 14 },
  modalAppliedBtn: { backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: '#4ade80' },
  modalApplyText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  applyModalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  applyModalSheet: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  applyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  applyModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  applyJobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  applyJobCompany: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 20,
  },
  applyLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  applyInput: {
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
  applyTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  applyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  applyCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  applySubmitBtn: {
    backgroundColor: GOLD,
  },
  applySubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
});