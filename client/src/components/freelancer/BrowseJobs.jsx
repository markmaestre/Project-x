import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.08)';
const INPUT_BG = '#1c1c1c';

const SAMPLE_JOBS = [
  {
    id: '1',
    title: 'Senior UI/UX Designer',
    company: 'Servcorp Manila',
    location: 'Remote',
    type: 'Full-time',
    salary: '₱80,000 - ₱120,000',
    posted: '2 hours ago',
    description: 'Looking for an experienced UI/UX designer to lead our product design team...',
    skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
    applicants: 12,
    isUrgent: true,
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Mobile App Developer (React Native)',
    company: 'Apex Ventures',
    location: 'Hybrid',
    type: 'Contract',
    salary: '₱60,000 - ₱90,000',
    posted: '5 hours ago',
    description: 'Join our growing team to build amazing mobile experiences...',
    skills: ['React Native', 'TypeScript', 'Redux', 'Firebase'],
    applicants: 28,
    isUrgent: true,
    isFeatured: false,
  },
  {
    id: '3',
    title: 'Brand Identity Designer',
    company: 'Luminary Digital',
    location: 'Remote',
    type: 'Freelance',
    salary: '₱40,000 - ₱60,000',
    posted: '1 day ago',
    description: 'Seeking creative brand designer for comprehensive brand identity project...',
    skills: ['Branding', 'Logo Design', 'Typography', 'Illustrator'],
    applicants: 45,
    isUrgent: false,
    isFeatured: true,
  },
  {
    id: '4',
    title: 'Backend Developer (Node.js)',
    company: 'TechStart Solutions',
    location: 'Remote',
    type: 'Full-time',
    salary: '₱90,000 - ₱130,000',
    posted: '2 days ago',
    description: 'Building scalable backend systems for our growing platform...',
    skills: ['Node.js', 'Express', 'MongoDB', 'AWS'],
    applicants: 34,
    isUrgent: false,
    isFeatured: false,
  },
  {
    id: '5',
    title: 'Content Writer & SEO Specialist',
    company: 'Digital Marketing Pro',
    location: 'Remote',
    type: 'Part-time',
    salary: '₱30,000 - ₱45,000',
    posted: '3 days ago',
    description: 'Create engaging content and optimize for search engines...',
    skills: ['SEO', 'Content Writing', 'WordPress', 'Analytics'],
    applicants: 18,
    isUrgent: true,
    isFeatured: false,
  },
];

// Plain text labels — no broken icons
const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'design', name: 'Design' },
  { id: 'development', name: 'Dev' },
  { id: 'writing', name: 'Writing' },
  { id: 'marketing', name: 'Marketing' },
];

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Freelance'];

export default function BrowseJobs({ onNavigate, onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);

  const filterAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

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

  const handleApplyJob = (job) => {
    if (appliedJobs.includes(job.id)) {
      Alert.alert('Already Applied', 'You have already applied for this position.');
      return;
    }
    Alert.alert(
      'Apply for Job',
      `Apply for "${job.title}" at ${job.company}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            setAppliedJobs([...appliedJobs, job.id]);
            Alert.alert('Success', 'Application submitted!');
          },
        },
      ]
    );
  };

  const handleSaveJob = (jobId) => {
    setSavedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const getFilteredJobs = () => {
    let filtered = SAMPLE_JOBS;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (selectedJobType !== 'All') {
      filtered = filtered.filter((j) => j.type === selectedJobType);
    }
    return filtered;
  };

  const JobCard = ({ job }) => {
    const isApplied = appliedJobs.includes(job.id);
    const isSaved = savedJobs.includes(job.id);

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => { setSelectedJob(job); setShowJobModal(true); }}
        activeOpacity={0.85}
      >
        {/* Badges — top-right row, no overlap */}
        {(job.isFeatured || job.isUrgent) && (
          <View style={styles.badgeRow}>
            {job.isFeatured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>★ Featured</Text>
              </View>
            )}
            {job.isUrgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>⚡ Urgent</Text>
              </View>
            )}
          </View>
        )}

        {/* Company row */}
        <View style={styles.jobHeader}>
          <View style={styles.companyLogo}>
            <Text style={styles.logoText}>{job.company[0]}</Text>
          </View>
          <View style={styles.jobHeaderInfo}>
            <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
            <Text style={styles.companyName}>{job.company}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleSaveJob(job.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? GOLD : 'rgba(255,255,255,0.35)'}
            />
          </TouchableOpacity>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.4)" />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="briefcase-outline" size={12} color="rgba(255,255,255,0.4)" />
            <Text style={styles.metaText}>{job.type}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.4)" />
            <Text style={styles.metaText}>{job.posted}</Text>
          </View>
        </View>

        {/* Salary */}
        <Text style={styles.salary}>{job.salary}</Text>

        {/* Skills */}
        <View style={styles.skillsRow}>
          {job.skills.slice(0, 3).map((s, i) => (
            <View key={i} style={styles.skillBadge}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
          {job.skills.length > 3 && (
            <View style={styles.skillBadge}>
              <Text style={styles.skillText}>+{job.skills.length - 3}</Text>
            </View>
          )}
        </View>

        {/* Apply button */}
        <TouchableOpacity
          style={[styles.applyBtn, isApplied && styles.appliedBtn]}
          onPress={() => handleApplyJob(job)}
          disabled={isApplied}
        >
          <Text style={[styles.applyBtnText, isApplied && styles.appliedBtnText]}>
            {isApplied ? '✓  Applied' : 'Apply Now'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const filtered = getFilteredJobs();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Browse Jobs</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={openFilters}>
            <Ionicons name="options-outline" size={20} color={GOLD} />
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.35)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, companies, or skills..."
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Categories + Type in ONE compact combined row ── */}
        <View style={styles.filtersBlock}>
          {/* Category row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, selectedCategory === cat.id && styles.pillActiveGold]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.pillText, selectedCategory === cat.id && styles.pillTextActiveGold]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Job type row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.pillRow, { marginTop: 6 }]}
          >
            {JOB_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pill, selectedJobType === type && styles.pillActiveSolid]}
                onPress={() => setSelectedJobType(type)}
              >
                <Text style={[styles.pillText, selectedJobType === type && styles.pillTextActiveSolid]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Results label ── */}
        <Text style={styles.resultsLabel}>{filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} found</Text>

        {/* ── Job list ── */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {filtered.length > 0 ? (
            filtered.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💼</Text>
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
            </View>
          )}
        </ScrollView>

        {/* ── Filter overlay + drawer ── */}
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
            <Text style={styles.drawerSection}>Experience Level</Text>
            <View style={styles.drawerChips}>
              {['Entry', 'Junior', 'Mid', 'Senior', 'Lead'].map((l) => (
                <TouchableOpacity key={l} style={styles.drawerChip}>
                  <Text style={styles.drawerChipText}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.drawerSection}>Remote Options</Text>
            <View style={styles.drawerChips}>
              {['Remote', 'Hybrid', 'On-site'].map((o) => (
                <TouchableOpacity key={o} style={styles.drawerChip}>
                  <Text style={styles.drawerChipText}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.drawerApplyBtn} onPress={closeFilters}>
            <Text style={styles.drawerApplyText}>Apply Filters</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Job Detail Modal ── */}
        <Modal
          visible={showJobModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowJobModal(false)}
        >
          <View style={styles.modalWrap}>
            <View style={styles.modalSheet}>
              {/* handle */}
              <View style={styles.modalHandle} />

              {/* close */}
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowJobModal(false)}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>

              {selectedJob && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalLogo}>
                      <Text style={styles.modalLogoText}>{selectedJob.company[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalTitle}>{selectedJob.title}</Text>
                      <Text style={styles.modalCompany}>{selectedJob.company}</Text>
                    </View>
                  </View>

                  <View style={styles.modalMeta}>
                    {[
                      { icon: 'location-outline', label: selectedJob.location },
                      { icon: 'briefcase-outline', label: selectedJob.type },
                      { icon: 'time-outline', label: selectedJob.posted },
                      { icon: 'people-outline', label: `${selectedJob.applicants} applicants` },
                    ].map(({ icon, label }) => (
                      <View key={label} style={styles.modalMetaItem}>
                        <Ionicons name={icon} size={14} color="rgba(255,255,255,0.45)" />
                        <Text style={styles.modalMetaText}>{label}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.modalSalary}>{selectedJob.salary}</Text>

                  <Text style={styles.modalSection}>Description</Text>
                  <Text style={styles.modalDesc}>{selectedJob.description}</Text>

                  <Text style={styles.modalSection}>Required Skills</Text>
                  <View style={styles.modalSkills}>
                    {selectedJob.skills.map((s, i) => (
                      <View key={i} style={styles.modalSkillBadge}>
                        <Text style={styles.modalSkillText}>{s}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.modalApplyBtn, appliedJobs.includes(selectedJob.id) && styles.modalAppliedBtn]}
                    onPress={() => { handleApplyJob(selectedJob); }}
                    disabled={appliedJobs.includes(selectedJob.id)}
                  >
                    <Text style={[styles.modalApplyText, appliedJobs.includes(selectedJob.id) && { color: '#4ade80' }]}>
                      {appliedJobs.includes(selectedJob.id) ? '✓  Already Applied' : 'Apply Now'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
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

  // Header
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

  // Search
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

  // Filter pills block — tight spacing
  filtersBlock: {
    marginTop: 10,
    marginBottom: 2,
  },
  pillRow: {
    paddingHorizontal: 14,
    gap: 7,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  pillActiveGold: {
    backgroundColor: 'rgba(212,175,55,0.13)',
    borderColor: GOLD,
  },
  pillActiveSolid: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  pillText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  pillTextActiveGold: { color: GOLD, fontWeight: '700' },
  pillTextActiveSolid: { color: '#0a0a0a', fontWeight: '700' },

  // Results label
  resultsLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 6,
  },

  // List
  listContent: { paddingHorizontal: 14, paddingBottom: 24, gap: 12 },

  // Job card
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
  featuredBadge: {
    backgroundColor: 'rgba(212,175,55,0.13)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredText: { fontSize: 10, color: GOLD, fontWeight: '700' },
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

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  emptySub: { fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6 },

  // Filter drawer
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
  drawerChipText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  drawerApplyBtn: { backgroundColor: GOLD, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  drawerApplyText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },

  // Modal
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
});