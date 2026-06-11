import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, RefreshControl, Modal,
  TextInput, Image, Linking, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getClientJobs } from '../../Redux/slices/jobSlice';
import { getJobApplications, updateApplicationStatus } from '../../Redux/slices/applicationSlice';

// ── Vantara Design tokens ─────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const NAVY2      = '#0D2151';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
const BLUE_LT    = '#1E90FF';
const GOLD       = '#C89520';
const GOLD_LT    = '#E8B84B';
const GOLD_DK    = '#8A6410';
const WHITE      = '#FFFFFF';
const BG         = '#EEF4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const GREEN      = '#059669';
const GREEN_SOFT = '#D1FAE5';
const GREEN_MID  = '#86EFAC';
const GREEN_DARK = '#059669';
const BG_GRAY    = '#F9FAFB';
const RED        = '#DC2626';
const RED_SOFT   = '#FEF2F2';
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_TABS = ['All', 'open', 'in_progress', 'completed', 'cancelled'];

const APPLICATION_STATUSES = [
  { value: 'pending',   label: 'For Review',  color: GREEN_DARK,  icon: 'time-outline',             nextStatus: 'reviewed' },
  { value: 'reviewed',  label: 'Shortlisted', color: '#60a5fa',   icon: 'star-outline',             nextStatus: 'interview' },
  { value: 'interview', label: 'Interview',   color: '#f59e0b',   icon: 'chatbubble-outline',       nextStatus: 'offered' },
  { value: 'offered',   label: 'Offer Sent',  color: '#4ade80',   icon: 'gift-outline',             nextStatus: 'hired' },
  { value: 'hired',     label: 'Hired',       color: '#10b981',   icon: 'checkmark-circle-outline', nextStatus: null },
  { value: 'rejected',  label: 'Rejected',    color: '#f87171',   icon: 'close-circle-outline',     nextStatus: null },
];

const getStatusInfo = (status) =>
  APPLICATION_STATUSES.find(s => s.value === status) || APPLICATION_STATUSES[0];

const JOB_STATUS_CONFIG = {
  open:        { label: 'Open',        bg: `${GREEN}14`,  border: `${GREEN}40`,  text: GREEN,     dot: GREEN },
  in_progress: { label: 'In Progress', bg: `${BLUE}12`,   border: `${BLUE}35`,   text: BLUE,      dot: BLUE },
  completed:   { label: 'Completed',   bg: '#60a5fa12',   border: '#60a5fa35',   text: '#3b82f6', dot: '#3b82f6' },
  cancelled:   { label: 'Cancelled',   bg: '#f8717112',   border: '#f8717135',   text: '#f87171', dot: '#f87171' },
};

const getJobStatusConfig = (status) =>
  JOB_STATUS_CONFIG[status] || { label: status, bg: `${TEXT_LIGHT}12`, border: BORDER, text: TEXT_MUTED, dot: TEXT_LIGHT };

const formatStatus = (status) =>
  ({ open: 'Open', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }[status] || status);

const getBudgetDisplay = (job) =>
  job.budget_type === 'hourly'
    ? `₱${job.budget_amount}/hr`
    : `₱${job.budget_amount?.toLocaleString()}`;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = Math.ceil(Math.abs(Date.now() - new Date(dateString)) / 86400000);
  if (d <= 1) return 'Today';
  if (d < 7)  return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

const getCategoryIcon = (jobType = '') => {
  const t = jobType.toLowerCase();
  if (t.includes('full'))     return 'briefcase-outline';
  if (t.includes('part'))     return 'time-outline';
  if (t.includes('contract')) return 'document-text-outline';
  if (t.includes('free'))     return 'laptop-outline';
  return 'briefcase-outline';
};

const getFileIcon = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf')              return { icon: 'document-text',  color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
  if (['doc','docx'].includes(ext)) return { icon: 'document-text', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' };
  return                                  { icon: 'attach-outline',  color: BLUE,      bg: `${BLUE}10`, border: `${BLUE}20` };
};

const formatFileSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── CV / Resume Card ──────────────────────────────────────────────────────────
const ResumeCard = ({ resume }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded,  setDownloaded]  = useState(false);

  if (!resume?.url && !resume?.uri) return null;

  const url      = resume.url || resume.uri;
  const filename = resume.name || resume.filename || 'resume.pdf';
  const fileInfo = getFileIcon(filename);
  const fileSize = formatFileSize(resume.size);

  const handleView = async () => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Unable to open the file. Please try again.');
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Build a local path in the app's cache directory
      const localPath = `${FileSystem.cacheDirectory}${filename}`;
      const { uri } = await FileSystem.downloadAsync(url, localPath);

      // Share/save using expo-sharing (works on iOS & Android)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
          dialogTitle: `Save ${filename}`,
          UTI: filename.endsWith('.pdf') ? 'com.adobe.pdf' : 'public.data',
        });
        setDownloaded(true);
      } else {
        // Fallback: just open the URL
        await Linking.openURL(url);
        setDownloaded(true);
      }
    } catch (e) {
      Alert.alert('Download Failed', 'Could not download the file. Please check your connection.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={cv.wrapper}>
      {/* File info row */}
      <View style={[cv.fileCard, { borderColor: fileInfo.border, backgroundColor: fileInfo.bg }]}>
        {/* Icon */}
        <View style={[cv.fileIconBox, { backgroundColor: fileInfo.bg, borderColor: fileInfo.border }]}>
          <Ionicons name={fileInfo.icon} size={22} color={fileInfo.color} />
        </View>

        {/* Name + meta */}
        <View style={cv.fileMeta}>
          <Text style={cv.fileName} numberOfLines={1}>{filename}</Text>
          <View style={cv.fileMetaRow}>
            {fileSize && (
              <View style={cv.metaChip}>
                <Ionicons name="server-outline" size={10} color={TEXT_LIGHT} />
                <Text style={cv.metaChipText}>{fileSize}</Text>
              </View>
            )}
            <View style={cv.metaChip}>
              <Ionicons name="document-attach-outline" size={10} color={TEXT_LIGHT} />
              <Text style={cv.metaChipText}>{filename.split('.').pop()?.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={cv.actionRow}>
        {/* View */}
        <TouchableOpacity style={cv.viewBtn} onPress={handleView} activeOpacity={0.8}>
          <Ionicons name="eye-outline" size={15} color={BLUE} />
          <Text style={cv.viewBtnText}>View</Text>
        </TouchableOpacity>

        {/* Download */}
        <TouchableOpacity
          style={[cv.downloadBtn, downloaded && cv.downloadBtnDone]}
          onPress={handleDownload}
          disabled={downloading}
          activeOpacity={0.85}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={WHITE} />
          ) : downloaded ? (
            <>
              <Ionicons name="checkmark-circle-outline" size={15} color={WHITE} />
              <Text style={cv.downloadBtnText}>Saved</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={15} color={WHITE} />
              <Text style={cv.downloadBtnText}>Download</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const cv = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  fileIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileMeta: { flex: 1, minWidth: 0 },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 6,
  },
  fileMetaRow: { flexDirection: 'row', gap: 6 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: WHITE,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  metaChipText: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: `${BLUE}08`,
    borderWidth: 1.5,
    borderColor: `${BLUE}25`,
  },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: BLUE },

  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  downloadBtnDone: {
    backgroundColor: GREEN,
    shadowColor: GREEN,
  },
  downloadBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },
});

// ── Job Card ──────────────────────────────────────────────────────────────────
const JobCard = ({ item, onViewApplicants }) => {
  const sc     = getJobStatusConfig(item.status);
  const budget = item.budget_amount ? getBudgetDisplay(item) : null;
  const skills = item.required_skills || [];

  return (
    <View style={jc.card}>
      <View style={jc.topRow}>
        <View style={jc.typeBadge}>
          <Ionicons name={getCategoryIcon(item.job_type)} size={10} color={BLUE} />
          <Text style={jc.typeText}>
            {item.job_type?.replace(/_/g, ' ').toUpperCase() || 'JOB'}
          </Text>
        </View>
        <View style={[jc.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <View style={[jc.statusDot, { backgroundColor: sc.dot }]} />
          <Text style={[jc.statusText, { color: sc.text }]}>{sc.label}</Text>
        </View>
      </View>

      <Text style={jc.title}>{item.title}</Text>

      {item.description ? (
        <Text style={jc.desc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      {skills.length > 0 && (
        <View style={jc.skillsRow}>
          {skills.slice(0, 3).map((sk, i) => (
            <View key={i} style={jc.skillChip}>
              <Text style={jc.skillText}>{sk}</Text>
            </View>
          ))}
          {skills.length > 3 && (
            <View style={jc.skillChip}>
              <Text style={jc.skillText}>+{skills.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View style={jc.metaRow}>
        {budget && (
          <View style={jc.metaPill}>
            <Ionicons name="cash-outline" size={11} color={GOLD_DK} />
            <Text style={[jc.metaText, { color: GOLD_DK, fontWeight: '600' }]}>{budget}</Text>
          </View>
        )}
        {item.work_setup && (
          <View style={jc.metaPill}>
            <Ionicons name="wifi-outline" size={11} color={TEXT_MUTED} />
            <Text style={jc.metaText}>{item.work_setup.replace(/_/g, ' ')}</Text>
          </View>
        )}
        <View style={jc.metaPill}>
          <Ionicons name="time-outline" size={11} color={TEXT_MUTED} />
          <Text style={jc.metaText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      <View style={jc.divider} />
      <View style={jc.footer}>
        <View style={jc.applicantCount}>
          <Ionicons name="people-outline" size={13} color={TEXT_MUTED} />
          <Text style={jc.applicantCountText}>
            {item.total_applicants || 0} applicant{(item.total_applicants || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={jc.viewBtn}
          onPress={() => onViewApplicants(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="people-outline" size={14} color={WHITE} />
          <Text style={jc.viewBtnText}>View Applicants</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const jc = StyleSheet.create({
  card:             { backgroundColor: CARD, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: BORDER, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  topRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  typeBadge:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${BLUE}10`, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: `${BLUE}22` },
  typeText:         { fontSize: 10, fontWeight: '700', color: BLUE, letterSpacing: 0.4 },
  statusBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, borderWidth: 1, marginLeft: 'auto' },
  statusDot:        { width: 5, height: 5, borderRadius: 3 },
  statusText:       { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  title:            { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, lineHeight: 22, marginBottom: 5 },
  desc:             { fontSize: 12, color: TEXT_MUTED, lineHeight: 18, marginBottom: 10 },
  skillsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillChip:        { paddingHorizontal: 9, paddingVertical: 4, backgroundColor: GREEN_SOFT, borderRadius: 6, borderWidth: 1, borderColor: GREEN_MID },
  skillText:        { fontSize: 10, color: GREEN_DARK, fontWeight: '600' },
  metaRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  metaPill:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BG_GRAY, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: BORDER },
  metaText:         { fontSize: 11, color: TEXT_MUTED },
  divider:          { height: 1, backgroundColor: BORDER, marginBottom: 12 },
  footer:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  applicantCount:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  applicantCountText:{ fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  viewBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BLUE, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9, shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 2 },
  viewBtnText:      { fontSize: 12, fontWeight: '700', color: WHITE },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MyPostings({ onNavigate }) {
  const dispatch = useDispatch();
  const { clientJobs, isLoading } = useSelector((state) => state.jobs.jobs);
  const { token } = useSelector((state) => state.auth);

  const [activeFilterTab,          setActiveFilterTab]          = useState('All');
  const [refreshing,                setRefreshing]               = useState(false);
  const [selectedJob,               setSelectedJob]              = useState(null);
  const [showApplicantsModal,       setShowApplicantsModal]      = useState(false);
  const [applications,              setApplications]             = useState([]);
  const [loadingApplications,       setLoadingApplications]      = useState(false);
  const [showApplicantProfileModal, setShowApplicantProfileModal]= useState(false);
  const [selectedApplication,       setSelectedApplication]      = useState(null);
  const [selectedApplicant,         setSelectedApplicant]        = useState(null);
  const [showInterviewModal,        setShowInterviewModal]       = useState(false);
  const [interviewDate,             setInterviewDate]            = useState('');
  const [interviewTime,             setInterviewTime]            = useState('');
  const [interviewLink,             setInterviewLink]            = useState('');
  const [interviewNotes,            setInterviewNotes]           = useState('');

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    if (!token) { Alert.alert('Error', 'Please login again'); return; }
    try { await dispatch(getClientJobs({})).unwrap(); }
    catch { Alert.alert('Error', 'Failed to load your job postings'); }
  };

  const fetchApplications = async (jobId) => {
    setLoadingApplications(true);
    try {
      const res = await dispatch(getJobApplications({ jobId })).unwrap();
      setApplications(res.applications || []);
      setShowApplicantsModal(true);
    } catch { Alert.alert('Error', 'Failed to load applications'); }
    finally { setLoadingApplications(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, []);

  const filteredJobs = (clientJobs || []).filter(j =>
    activeFilterTab === 'All' ? true : j.status === activeFilterTab
  );

  const handleUpdateStatus = async (application, newStatus) => {
    try {
      await dispatch(updateApplicationStatus({ applicationId: application._id, status: newStatus })).unwrap();
      Alert.alert('Updated', `Status set to ${getStatusInfo(newStatus).label}`);
      fetchApplications(selectedJob._id);
    } catch { Alert.alert('Error', 'Failed to update status'); }
  };

  const handleSendInterview = async () => {
    if (!interviewDate || !interviewTime) { Alert.alert('Error', 'Please set interview date and time'); return; }
    try {
      await dispatch(updateApplicationStatus({ applicationId: selectedApplication._id, status: 'interview' })).unwrap();
      Alert.alert('Scheduled', `Interview invitation sent to ${selectedApplicant?.first_name}`);
      setShowInterviewModal(false);
      fetchApplications(selectedJob._id);
      setInterviewDate(''); setInterviewTime(''); setInterviewLink(''); setInterviewNotes('');
    } catch { Alert.alert('Error', 'Failed to schedule interview'); }
  };

  const handleSendOffer = async (application) => {
    try {
      await dispatch(updateApplicationStatus({ applicationId: application._id, status: 'offered' })).unwrap();
      Alert.alert('Offer Sent', `Offer sent to ${application.freelancer_id?.first_name}`);
      fetchApplications(selectedJob._id);
    } catch { Alert.alert('Error', 'Failed to send offer'); }
  };

  const handleMarkAsHired = async (application) => {
    Alert.alert('Confirm Hire', `Hire ${application.freelancer_id?.first_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Hire', onPress: async () => {
        try {
          await dispatch(updateApplicationStatus({ applicationId: application._id, status: 'hired' })).unwrap();
          Alert.alert('Hired!', 'Freelancer has been hired.');
          fetchApplications(selectedJob._id);
        } catch { Alert.alert('Error', 'Failed to hire'); }
      }},
    ]);
  };

  const handleReject = async (application) => {
    Alert.alert('Reject Application', `Reject ${application.freelancer_id?.first_name}'s application?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          await dispatch(updateApplicationStatus({ applicationId: application._id, status: 'rejected' })).unwrap();
          Alert.alert('Rejected', 'The freelancer has been notified.');
          fetchApplications(selectedJob._id);
        } catch { Alert.alert('Error', 'Failed to reject'); }
      }},
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

  const handleSentOffers = () => { onNavigate('Sentoffers'); };

  const renderActionButtons = (application) => {
    const status = application.status;
    return (
      <View style={ap.actionRow}>
        {status === 'pending' && (
          <TouchableOpacity style={[ap.actionBtn, ap.shortlistBtn]} onPress={() => handleUpdateStatus(application, 'reviewed')}>
            <Ionicons name="star-outline" size={15} color="#60a5fa" />
            <Text style={[ap.actionText, { color: '#60a5fa' }]}>Shortlist</Text>
          </TouchableOpacity>
        )}
        {status === 'reviewed' && (
          <TouchableOpacity style={[ap.actionBtn, ap.interviewBtn]} onPress={() => {
            setSelectedApplication(application);
            setSelectedApplicant(application.freelancer_id);
            setShowInterviewModal(true);
          }}>
            <Ionicons name="calendar-outline" size={15} color="#f59e0b" />
            <Text style={[ap.actionText, { color: '#f59e0b' }]}>Schedule Interview</Text>
          </TouchableOpacity>
        )}
        {status === 'interview' && (
          <TouchableOpacity style={[ap.actionBtn, ap.offerBtn]} onPress={() => handleSendOffer(application)}>
            <Ionicons name="gift-outline" size={15} color={GREEN} />
            <Text style={[ap.actionText, { color: GREEN }]}>Send Offer</Text>
          </TouchableOpacity>
        )}
        {status === 'offered' && (
          <TouchableOpacity style={[ap.actionBtn, ap.hireBtn]} onPress={() => handleMarkAsHired(application)}>
            <Ionicons name="checkmark-circle-outline" size={15} color="#10b981" />
            <Text style={[ap.actionText, { color: '#10b981' }]}>Mark as Hired</Text>
          </TouchableOpacity>
        )}
        {!['rejected', 'hired', 'offered'].includes(status) && (
          <TouchableOpacity style={[ap.actionBtn, ap.rejectBtn]} onPress={() => handleReject(application)}>
            <Ionicons name="close-outline" size={15} color="#f87171" />
            <Text style={[ap.actionText, { color: '#f87171' }]}>Reject</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={s.root}>
          <View style={s.topbar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => onNavigate('ClientDashboard')}>
              <View style={s.iconWrap}><Ionicons name="arrow-back" size={18} color={WHITE} /></View>
            </TouchableOpacity>
            <Text style={s.topbarTitle}>My <Text style={s.gold}>Postings</Text></Text>
            <TouchableOpacity style={s.iconBtn} onPress={handleSentOffers}>
              <View style={s.iconWrap}><Ionicons name="document-text-outline" size={20} color={WHITE} /></View>
            </TouchableOpacity>
          </View>
          <View style={s.centerContainer}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={s.loadingText}>Loading your postings…</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={s.root}>
        {/* Top bar */}
        <View style={s.topbar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => onNavigate('PostJob')} activeOpacity={0.7}>
            <View style={s.iconWrap}><Ionicons name="arrow-back" size={18} color={WHITE} /></View>
          </TouchableOpacity>
          <Text style={s.topbarTitle}>My <Text style={s.gold}>Postings</Text></Text>
          <TouchableOpacity style={s.iconBtn} onPress={handleSentOffers} activeOpacity={0.7}>
            <View style={s.iconWrap}><Ionicons name="document-text-outline" size={20} color={WHITE} /></View>
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <View style={s.filterTabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterTabsScroll}>
            {FILTER_TABS.map(tab => {
              const active = activeFilterTab === tab;
              const count  = tab === 'All'
                ? (clientJobs || []).length
                : (clientJobs || []).filter(j => j.status === tab).length;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[s.filterTab, active && s.filterTabActive]}
                  onPress={() => setActiveFilterTab(tab)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.filterTabText, active && s.filterTabTextActive]}>
                    {tab === 'All' ? 'All' : formatStatus(tab)}
                  </Text>
                  {count > 0 && (
                    <View style={[s.filterBadge, active && s.filterBadgeActive]}>
                      <Text style={[s.filterBadgeText, active && s.filterBadgeTextActive]}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Job list */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        >
          {filteredJobs.length === 0 ? (
            <View style={s.emptyContainer}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="document-text-outline" size={40} color={BLUE} />
              </View>
              <Text style={s.emptyTitle}>No job postings</Text>
              <Text style={s.emptyDesc}>
                {activeFilterTab === 'All'
                  ? "You haven't posted any jobs yet."
                  : `No ${formatStatus(activeFilterTab).toLowerCase()} jobs found.`}
              </Text>
              {activeFilterTab === 'All' && (
                <TouchableOpacity style={s.postJobBtn} onPress={() => onNavigate('PostJob')}>
                  <Ionicons name="add" size={16} color={WHITE} />
                  <Text style={s.postJobBtnText}>Post Your First Job</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredJobs.map(item => (
              <JobCard
                key={item._id}
                item={item}
                onViewApplicants={(job) => { setSelectedJob(job); fetchApplications(job._id); }}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* ── Applicants Modal ── */}
      <Modal animationType="slide" transparent visible={showApplicantsModal} onRequestClose={() => setShowApplicantsModal(false)}>
        <View style={md.overlay}>
          <View style={md.sheet}>
            <View style={md.handle} />
            <View style={md.header}>
              <View style={{ flex: 1 }}>
                <Text style={md.title}>Applicants</Text>
                <Text style={md.subtitle} numberOfLines={1}>{selectedJob?.title}</Text>
              </View>
              <TouchableOpacity style={md.closeBtn} onPress={() => setShowApplicantsModal(false)}>
                <Ionicons name="close" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            {loadingApplications ? (
              <View style={s.centerContainer}>
                <ActivityIndicator size="large" color={BLUE} />
                <Text style={s.loadingText}>Loading applications…</Text>
              </View>
            ) : applications.length === 0 ? (
              <View style={s.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={TEXT_LIGHT} />
                <Text style={s.emptyTitle}>No applications yet</Text>
                <Text style={s.emptyDesc}>Freelancers will appear here when they apply.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
                {applications.map(application => {
                  const si = getStatusInfo(application.status);
                  const fl = application.freelancer_id;
                  return (
                    <TouchableOpacity
                      key={application._id}
                      style={ap.card}
                      onPress={() => handleViewApplicantProfile(application)}
                      activeOpacity={0.75}
                    >
                      <View style={ap.topRow}>
                        <View style={ap.avatar}>
                          {fl?.profile_picture
                            ? <Image source={{ uri: fl.profile_picture }} style={ap.avatarImg} />
                            : <Text style={ap.avatarText}>{fl?.first_name?.[0]}{fl?.last_name?.[0]}</Text>
                          }
                        </View>
                        <View style={ap.nameBlock}>
                          <Text style={ap.name}>{fl?.first_name} {fl?.last_name}</Text>
                          <Text style={ap.role}>{fl?.experience_level || 'Freelancer'}</Text>
                          {fl?.skills?.length > 0 && (
                            <View style={ap.skillsRow}>
                              {fl.skills.slice(0, 2).map((sk, i) => (
                                <View key={i} style={ap.skillChip}><Text style={ap.skillText}>{sk}</Text></View>
                              ))}
                              {fl.skills.length > 2 && <Text style={ap.moreSkills}>+{fl.skills.length - 2}</Text>}
                            </View>
                          )}
                        </View>
                        <View style={[ap.statusBadge, { backgroundColor: `${si.color}15`, borderColor: `${si.color}30` }]}>
                          <Ionicons name={si.icon} size={10} color={si.color} />
                          <Text style={[ap.statusText, { color: si.color }]}>{si.label}</Text>
                        </View>
                      </View>

                      {application.cover_letter ? (
                        <Text style={ap.coverLetter} numberOfLines={2}>{application.cover_letter}</Text>
                      ) : null}

                      <View style={ap.footer}>
                        <View>
                          {application.proposed_rate
                            ? <Text style={ap.rate}>₱{application.proposed_rate?.toLocaleString()}</Text>
                            : null
                          }
                          <Text style={ap.date}>Applied {formatDate(application.applied_at)}</Text>
                        </View>
                        <TouchableOpacity style={ap.viewBtn} onPress={() => handleViewApplicantProfile(application)}>
                          <Ionicons name="person-outline" size={13} color={BLUE} />
                          <Text style={ap.viewBtnText}>Full Profile</Text>
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

      {/* ── Applicant Profile Modal ── */}
      <Modal animationType="slide" transparent visible={showApplicantProfileModal} onRequestClose={() => setShowApplicantProfileModal(false)}>
        <View style={md.overlay}>
          <View style={[md.sheet, { maxHeight: '90%' }]}>
            <View style={md.handle} />
            <View style={md.header}>
              <Text style={md.title}>Freelancer Profile</Text>
              <TouchableOpacity style={md.closeBtn} onPress={() => setShowApplicantProfileModal(false)}>
                <Ionicons name="close" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            {selectedApplicant && selectedApplication && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

                {/* Profile header */}
                <View style={pf.headerCard}>
                  <View style={pf.avatarWrap}>
                    {selectedApplicant.profile_picture
                      ? <Image source={{ uri: selectedApplicant.profile_picture }} style={pf.avatarImg} />
                      : <Text style={pf.avatarText}>{selectedApplicant.first_name?.[0]}{selectedApplicant.last_name?.[0]}</Text>
                    }
                  </View>
                  <Text style={pf.name}>{selectedApplicant.first_name} {selectedApplicant.last_name}</Text>
                  <Text style={pf.username}>@{selectedApplicant.username}</Text>
                  <View style={[pf.statusBadge, { backgroundColor: `${getStatusInfo(selectedApplication.status).color}15` }]}>
                    <Ionicons name={getStatusInfo(selectedApplication.status).icon} size={13} color={getStatusInfo(selectedApplication.status).color} />
                    <Text style={[pf.statusText, { color: getStatusInfo(selectedApplication.status).color }]}>
                      {getStatusInfo(selectedApplication.status).label}
                    </Text>
                  </View>
                </View>

                {/* Contact */}
                <View style={pf.section}>
                  <Text style={pf.sectionLabel}>Contact</Text>
                  <View style={pf.infoCard}>
                    <View style={pf.infoRow}>
                      <Ionicons name="mail-outline" size={14} color={BLUE} />
                      <Text style={pf.infoText}>{selectedApplicant.email_address}</Text>
                    </View>
                    {selectedApplicant.phone_number && (
                      <View style={pf.infoRow}>
                        <Ionicons name="call-outline" size={14} color={BLUE} />
                        <Text style={pf.infoText}>{selectedApplicant.phone_number}</Text>
                      </View>
                    )}
                    {selectedApplicant.location && (
                      <View style={pf.infoRow}>
                        <Ionicons name="location-outline" size={14} color={BLUE} />
                        <Text style={pf.infoText}>{selectedApplicant.location}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Skills */}
                {selectedApplicant.skills?.length > 0 && (
                  <View style={pf.section}>
                    <Text style={pf.sectionLabel}>Skills</Text>
                    <View style={pf.skillsWrap}>
                      {selectedApplicant.skills.map((sk, i) => (
                        <View key={i} style={pf.skillChip}><Text style={pf.skillText}>{sk}</Text></View>
                      ))}
                    </View>
                  </View>
                )}

                {/* About */}
                {selectedApplicant.bio_about_me && (
                  <View style={pf.section}>
                    <Text style={pf.sectionLabel}>About</Text>
                    <View style={pf.infoCard}>
                      <Text style={pf.bodyText}>{selectedApplicant.bio_about_me}</Text>
                    </View>
                  </View>
                )}

                {/* ── CV / Resume ── ENHANCED SECTION ── */}
                <View style={pf.section}>
                  <View style={pf.sectionHeaderRow}>
                    <Text style={pf.sectionLabel}>Resume / CV</Text>
                    {(selectedApplication.resume?.url || selectedApplication.resume?.uri) && (
                      <View style={pf.cvBadge}>
                        <Ionicons name="checkmark-circle" size={11} color={GREEN} />
                        <Text style={pf.cvBadgeText}>Attached</Text>
                      </View>
                    )}
                  </View>

                  {(selectedApplication.resume?.url || selectedApplication.resume?.uri) ? (
                    <ResumeCard resume={selectedApplication.resume} />
                  ) : (
                    <View style={pf.noCvCard}>
                      <View style={pf.noCvIconBox}>
                        <Ionicons name="document-outline" size={22} color={TEXT_LIGHT} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={pf.noCvTitle}>No resume attached</Text>
                        <Text style={pf.noCvSub}>This applicant did not upload a CV with their application.</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Education */}
                {selectedApplication.education && (
                  <View style={pf.section}>
                    <Text style={pf.sectionLabel}>Education</Text>
                    <View style={pf.infoCard}>
                      {[
                        { label: 'Level',       value: selectedApplication.education.level },
                        { label: 'Field',       value: selectedApplication.education.field_of_study },
                        { label: 'Institution', value: selectedApplication.education.institution },
                        { label: 'Graduated',   value: selectedApplication.education.graduation_year },
                      ].filter(r => r.value).map((r, i) => (
                        <View key={i} style={pf.detailRow}>
                          <Text style={pf.detailLabel}>{r.label}</Text>
                          <Text style={pf.detailValue}>{r.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Experience */}
                {selectedApplication.experiences?.length > 0 && (
                  <View style={pf.section}>
                    <Text style={pf.sectionLabel}>Work Experience</Text>
                    {selectedApplication.experiences.map((exp, i) => (
                      <View key={i} style={[pf.infoCard, { marginBottom: 8 }]}>
                        <Text style={pf.expTitle}>{exp.job_title}</Text>
                        <Text style={pf.expCompany}>{exp.company_name}</Text>
                        <Text style={pf.expPeriod}>
                          {exp.start_date} — {exp.currently_working ? 'Present' : exp.end_date}
                        </Text>
                        {exp.description ? <Text style={pf.bodyText}>{exp.description}</Text> : null}
                      </View>
                    ))}
                  </View>
                )}

                {/* Cover letter */}
                <View style={pf.section}>
                  <Text style={pf.sectionLabel}>Cover Letter</Text>
                  <View style={pf.infoCard}>
                    <Text style={pf.bodyText}>{selectedApplication.cover_letter}</Text>
                  </View>
                </View>

                {/* Rate */}
                {selectedApplication.proposed_rate && (
                  <View style={pf.section}>
                    <Text style={pf.sectionLabel}>Proposed Rate</Text>
                    <View style={pf.rateChip}>
                      <Ionicons name="cash-outline" size={16} color={GOLD_DK} />
                      <Text style={pf.rateText}>₱{selectedApplication.proposed_rate.toLocaleString()}</Text>
                    </View>
                  </View>
                )}

                {/* Action buttons */}
                {renderActionButtons(selectedApplication)}

                {/* Message button */}
                <TouchableOpacity style={pf.msgBtn} onPress={() => handleMessageFreelancer(selectedApplicant._id)} activeOpacity={0.85}>
                  <Ionicons name="chatbubble-outline" size={17} color={WHITE} />
                  <Text style={pf.msgBtnText}>Message Freelancer</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Interview Modal ── */}
      <Modal animationType="slide" transparent visible={showInterviewModal} onRequestClose={() => setShowInterviewModal(false)}>
        <View style={md.overlay}>
          <View style={[md.sheet, { borderRadius: 22, padding: 20, maxHeight: '85%' }]}>
            <View style={md.handle} />
            <View style={md.header}>
              <Text style={md.title}>Schedule Interview</Text>
              <TouchableOpacity style={md.closeBtn} onPress={() => setShowInterviewModal(false)}>
                <Ionicons name="close" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Interview Date *',              placeholder: 'e.g., December 15, 2024', value: interviewDate,  setter: setInterviewDate,  multi: false },
                { label: 'Interview Time *',              placeholder: 'e.g., 2:00 PM (GMT+8)',    value: interviewTime,  setter: setInterviewTime,  multi: false },
                { label: 'Video Call Link (Optional)',    placeholder: 'Zoom, Google Meet, etc.',  value: interviewLink,  setter: setInterviewLink,  multi: false },
                { label: 'Additional Notes (Optional)',   placeholder: 'Instructions or notes…',  value: interviewNotes, setter: setInterviewNotes, multi: true  },
              ].map(field => (
                <View key={field.label}>
                  <Text style={iv.label}>{field.label}</Text>
                  <TextInput
                    style={[iv.input, field.multi && iv.textarea]}
                    placeholder={field.placeholder}
                    placeholderTextColor={TEXT_LIGHT}
                    value={field.value}
                    onChangeText={field.setter}
                    multiline={field.multi}
                    numberOfLines={field.multi ? 4 : 1}
                  />
                </View>
              ))}
              <View style={iv.btnRow}>
                <TouchableOpacity style={iv.cancelBtn} onPress={() => setShowInterviewModal(false)}>
                  <Text style={iv.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={iv.sendBtn} onPress={handleSendInterview} activeOpacity={0.85}>
                  <Ionicons name="calendar-outline" size={16} color={WHITE} />
                  <Text style={iv.sendText}>Send Invitation</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Application card styles ──
const ap = StyleSheet.create({
  card:        { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  topRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  avatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarImg:   { width: 44, height: 44, borderRadius: 22 },
  avatarText:  { fontSize: 16, fontWeight: '700', color: WHITE },
  nameBlock:   { flex: 1, minWidth: 0 },
  name:        { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  role:        { fontSize: 11, color: TEXT_MUTED, marginBottom: 5 },
  skillsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  skillChip:   { backgroundColor: GREEN_SOFT, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  skillText:   { fontSize: 9, color: GREEN_DARK, fontWeight: '600' },
  moreSkills:  { fontSize: 9, color: TEXT_MUTED, alignSelf: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, borderWidth: 0.75, flexShrink: 0 },
  statusText:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  coverLetter: { fontSize: 12, color: TEXT_MUTED, lineHeight: 18, marginBottom: 10 },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER },
  rate:        { fontSize: 12, color: GOLD_DK, fontWeight: '600', marginBottom: 2 },
  date:        { fontSize: 10, color: TEXT_LIGHT },
  viewBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${BLUE}10`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: `${BLUE}22` },
  viewBtnText: { fontSize: 11, color: BLUE, fontWeight: '600' },
  actionRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 14, borderTopWidth: 1.5, borderTopColor: BORDER, marginTop: 4 },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9, borderWidth: 1, minWidth: 110 },
  actionText:  { fontSize: 12, fontWeight: '700' },
  shortlistBtn:{ backgroundColor: '#60a5fa12', borderColor: '#60a5fa30' },
  interviewBtn:{ backgroundColor: '#f59e0b12', borderColor: '#f59e0b30' },
  offerBtn:    { backgroundColor: `${GREEN}12`, borderColor: `${GREEN}30` },
  hireBtn:     { backgroundColor: '#10b98112', borderColor: '#10b98130' },
  rejectBtn:   { backgroundColor: '#f8717112', borderColor: '#f8717130' },
});

// ── Freelancer profile modal styles ──
const pf = StyleSheet.create({
  headerCard:      { alignItems: 'center', paddingVertical: 20, marginBottom: 4 },
  avatarWrap:      { width: 76, height: 76, borderRadius: 38, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 2, borderColor: `${BLUE}30` },
  avatarImg:       { width: 76, height: 76, borderRadius: 38 },
  avatarText:      { fontSize: 28, fontWeight: '700', color: WHITE },
  name:            { fontSize: 19, fontWeight: '700', color: TEXT_MAIN, marginBottom: 3 },
  username:        { fontSize: 12, color: TEXT_MUTED, marginBottom: 10 },
  statusBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText:      { fontSize: 12, fontWeight: '600' },
  section:         { marginBottom: 18 },
  sectionHeaderRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel:    { fontSize: 11, fontWeight: '700', color: BLUE, textTransform: 'uppercase', letterSpacing: 0.6 },
  cvBadge:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GREEN_SOFT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: GREEN_MID },
  cvBadgeText:     { fontSize: 10, fontWeight: '700', color: GREEN_DARK },
  noCvCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: BG_GRAY, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed' },
  noCvIconBox:     { width: 40, height: 40, borderRadius: 10, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  noCvTitle:       { fontSize: 13, fontWeight: '600', color: TEXT_MUTED, marginBottom: 2 },
  noCvSub:         { fontSize: 11, color: TEXT_LIGHT, lineHeight: 16 },
  infoCard:        { backgroundColor: BG_GRAY, borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: BORDER },
  infoRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText:        { fontSize: 13, color: TEXT_MAIN, flex: 1 },
  bodyText:        { fontSize: 13, color: TEXT_MUTED, lineHeight: 20 },
  skillsWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip:       { backgroundColor: `${BLUE}10`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: `${BLUE}20` },
  skillText:       { fontSize: 12, color: BLUE, fontWeight: '600' },
  detailRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: BORDER },
  detailLabel:     { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },
  detailValue:     { fontSize: 12, color: TEXT_MAIN, fontWeight: '500', flex: 1, textAlign: 'right' },
  expTitle:        { fontSize: 13, fontWeight: '700', color: TEXT_MAIN },
  expCompany:      { fontSize: 12, color: TEXT_MUTED, marginVertical: 2 },
  expPeriod:       { fontSize: 11, color: TEXT_LIGHT, marginBottom: 4 },
  rateChip:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(200,149,32,0.08)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(200,149,32,0.2)', alignSelf: 'flex-start' },
  rateText:        { fontSize: 16, fontWeight: '800', color: GOLD_DK, letterSpacing: -0.3 },
  msgBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, marginTop: 16, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 3 },
  msgBtnText:      { fontSize: 14, fontWeight: '700', color: WHITE },
});

// ── Modal styles ──
const md = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.55)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  handle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: BORDER, gap: 10 },
  title:   { fontSize: 16, fontWeight: '700', color: TEXT_MAIN },
  subtitle:{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  closeBtn:{ width: 30, height: 30, borderRadius: 15, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
});

// ── Interview form styles ──
const iv = StyleSheet.create({
  label:     { fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginBottom: 6, marginTop: 12 },
  input:     { backgroundColor: BG, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, color: TEXT_MAIN, fontSize: 14, borderWidth: 1.5, borderColor: BORDER },
  textarea:  { height: 96, textAlignVertical: 'top' },
  btnRow:    { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 8 },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 10, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER },
  cancelText:{ fontSize: 14, fontWeight: '600', color: TEXT_MUTED },
  sendBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 10, backgroundColor: BLUE, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 3 },
  sendText:  { fontSize: 14, fontWeight: '700', color: WHITE },
});

// ── Screen styles ──
const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: NAVY },
  root:          { flex: 1, backgroundColor: BG },
  topbar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: NAVY },
  iconBtn:       { alignSelf: 'flex-start' },
  iconWrap:      { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  topbarTitle:   { fontSize: 16, fontWeight: '700', color: WHITE, letterSpacing: 0.2 },
  gold:          { color: GOLD_LT, fontStyle: 'italic', fontWeight: '700' },
  filterTabsWrap:   { backgroundColor: CARD, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  filterTabsScroll: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: CARD },
  filterTabActive:  { backgroundColor: BLUE, borderColor: BLUE },
  filterTabText:    { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  filterTabTextActive: { color: WHITE },
  filterBadge:      { backgroundColor: BORDER, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  filterBadgeActive:{ backgroundColor: WHITE },
  filterBadgeText:  { fontSize: 9, fontWeight: '700', color: TEXT_MUTED },
  filterBadgeTextActive: { color: BLUE },
  scroll:           { padding: 16, paddingBottom: 24 },
  centerContainer:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText:      { marginTop: 12, fontSize: 13, color: TEXT_MUTED },
  emptyContainer:   { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIconWrap:    { width: 76, height: 76, backgroundColor: `${BLUE}10`, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:       { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8 },
  emptyDesc:        { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  postJobBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BLUE, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 2 },
  postJobBtnText:   { fontSize: 13, fontWeight: '700', color: WHITE },
});