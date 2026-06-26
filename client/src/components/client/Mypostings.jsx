import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, RefreshControl, Modal,
  TextInput, Image, Linking, StatusBar, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getClientJobs } from '../../Redux/slices/jobSlice';
import { getJobApplications, updateApplicationStatus } from '../../Redux/slices/applicationSlice';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
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
const ORANGE     = '#F97316';
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_TABS = ['All', 'open', 'in_progress', 'completed', 'cancelled'];

const APPLICATION_STATUSES = [
  { value: 'pending',   label: 'For Review',  color: '#6366f1', icon: 'time-outline'            },
  { value: 'reviewed',  label: 'Shortlisted', color: '#60a5fa', icon: 'star-outline'             },
  { value: 'interview', label: 'Interview',   color: '#f59e0b', icon: 'chatbubble-outline'       },
  { value: 'offered',   label: 'Offer Sent',  color: '#4ade80', icon: 'gift-outline'             },
  { value: 'hired',     label: 'Hired',       color: GREEN,     icon: 'checkmark-circle-outline' },
  { value: 'rejected',  label: 'Rejected',    color: RED,       icon: 'close-circle-outline'     },
];

const SUCCESS_EVENTS = {
  reviewed:  { icon: 'star',             iconColor: '#60a5fa', title: 'Shortlisted!',         body: 'The applicant has been shortlisted for your review.',    action: 'Schedule Interview', nextStatus: 'interview', actionIcon: 'calendar-outline'         },
  interview: { icon: 'calendar',         iconColor: '#f59e0b', title: 'Interview Scheduled!', body: 'Interview invitation sent. Awaiting their confirmation.',action: 'Send Offer',         nextStatus: 'offered',   actionIcon: 'gift-outline'             },
  offered:   { icon: 'gift',             iconColor: '#4ade80', title: 'Offer Sent!',           body: 'Your offer has been sent. Waiting for their response.',  action: 'Mark as Hired',      nextStatus: 'hired',     actionIcon: 'checkmark-circle-outline' },
  hired:     { icon: 'checkmark-circle', iconColor: GREEN,     title: 'Freelancer Hired!',    body: 'Congratulations! The freelancer is now part of your team.', action: null,             nextStatus: null,        actionIcon: null                       },
  rejected:  { icon: 'close-circle',     iconColor: RED,       title: 'Application Rejected', body: 'The applicant has been notified of the decision.',       action: null,                nextStatus: null,        actionIcon: null                       },
};

const getStatusInfo = (status) =>
  APPLICATION_STATUSES.find(s => s.value === status) || APPLICATION_STATUSES[0];

const JOB_STATUS_CONFIG = {
  open:        { label: 'Open',        bg: `${GREEN}14`,  border: `${GREEN}40`,  text: GREEN,    dot: GREEN    },
  in_progress: { label: 'In Progress', bg: `${BLUE}12`,   border: `${BLUE}35`,   text: BLUE,     dot: BLUE     },
  completed:   { label: 'Completed',   bg: '#60a5fa12',   border: '#60a5fa35',   text: '#3b82f6',dot: '#3b82f6'},
  cancelled:   { label: 'Cancelled',   bg: '#f8717112',   border: '#f8717135',   text: RED,      dot: RED      },
};

const getJobStatusConfig = (status) =>
  JOB_STATUS_CONFIG[status] || { label: status, bg: `${TEXT_LIGHT}12`, border: BORDER, text: TEXT_MUTED, dot: TEXT_LIGHT };

const formatStatus = (status) =>
  ({ open: 'Open', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }[status] || status);

const getBudgetDisplay = (job) =>
  job.budget_type === 'hourly' ? `₱${job.budget_amount}/hr` : `₱${job.budget_amount?.toLocaleString()}`;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = Math.ceil(Math.abs(Date.now() - new Date(dateString)) / 86400000);
  if (d <= 1) return 'Today';
  if (d < 7)  return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

const formatFullDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getCategoryIcon = (jobType = '') => {
  const t = jobType.toLowerCase();
  if (t.includes('full')) return 'briefcase-outline';
  if (t.includes('part')) return 'time-outline';
  if (t.includes('contract')) return 'document-text-outline';
  return 'laptop-outline';
};

const getFileIcon = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf')               return { icon: 'document-text', color: RED,  bg: '#FEF2F2', border: '#FECACA' };
  if (['doc','docx'].includes(ext)) return { icon: 'document-text', color: BLUE, bg: '#EFF6FF', border: '#BFDBFE' };
  return { icon: 'attach-outline', color: BLUE, bg: `${BLUE}10`, border: `${BLUE}20` };
};

const formatFileSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Success Modal ─────────────────────────────────────────────────────────────
const SuccessModal = ({ visible, event, applicantName, onContinue, onClose }) => {
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
    } else {
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  if (!event) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={sm.overlay}>
        <Animated.View style={[sm.card, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[sm.iconRing, { backgroundColor: `${event.iconColor}15`, borderColor: `${event.iconColor}30` }]}>
            <Ionicons name={event.icon} size={34} color={event.iconColor} />
          </View>
          <Text style={sm.title}>{event.title}</Text>
          {applicantName ? (
            <Text style={sm.subtitle}>
              <Text style={{ fontWeight: '700', color: BLUE }}>{applicantName}</Text>
            </Text>
          ) : null}
          <Text style={sm.body}>{event.body}</Text>
          <View style={sm.btnCol}>
            {event.action && (
              <TouchableOpacity style={sm.primaryBtn} onPress={() => onContinue(event.nextStatus)} activeOpacity={0.85}>
                <Ionicons name={event.actionIcon} size={15} color={WHITE} />
                <Text style={sm.primaryBtnText}>{event.action}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={sm.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={sm.secondaryBtnText}>{event.action ? 'Do This Later' : 'Done'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const sm = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(7,26,62,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:            { backgroundColor: WHITE, borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 14 },
  iconRing:        { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title:           { fontSize: 20, fontWeight: '800', color: TEXT_MAIN, marginBottom: 6, textAlign: 'center', letterSpacing: -0.3 },
  subtitle:        { fontSize: 14, color: TEXT_MUTED, marginBottom: 4, textAlign: 'center' },
  body:            { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 21, marginBottom: 24, paddingHorizontal: 4 },
  btnCol:          { width: '100%', gap: 10 },
  primaryBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 4 },
  primaryBtnText:  { fontSize: 14, fontWeight: '700', color: WHITE },
  secondaryBtn:    { alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER },
  secondaryBtnText:{ fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
});

// ── Rating Stars ──────────────────────────────────────────────────────────────
const RatingStars = ({ rating = 0, size = 15 }) => {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[...Array(full)].map((_, i)  => <Ionicons key={`f${i}`} name="star"        size={size} color={GOLD} />)}
        {half &&                           <Ionicons key="h"       name="star-half"   size={size} color={GOLD} />}
        {[...Array(empty)].map((_, i) => <Ionicons key={`e${i}`} name="star-outline" size={size} color={GOLD} />)}
      </View>
      {rating > 0 && <Text style={{ fontSize: 12, fontWeight: '600', color: GOLD_DK }}>{rating.toFixed(1)}</Text>}
    </View>
  );
};

// ── Resume Card ───────────────────────────────────────────────────────────────
const ResumeCard = ({ resume }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded,  setDownloaded]  = useState(false);

  const getResumeData = () => {
    if (!resume) return null;
    if (typeof resume === 'string') return { url: resume, name: 'resume.pdf' };
    if (resume.url || resume.uri)  return { url: resume.url || resume.uri, name: resume.name || 'resume.pdf', size: resume.size };
    if (resume.data)               return { url: resume.data, name: resume.name || 'resume.pdf', size: resume.size };
    return null;
  };

  const resumeData = getResumeData();
  if (!resumeData?.url) return null;

  const { url, name: filename, size } = resumeData;
  const fileInfo = getFileIcon(filename);
  const fileSize = formatFileSize(size);

  return (
    <View style={{ gap: 10 }}>
      <View style={[rv.fileCard, { borderColor: fileInfo.border, backgroundColor: fileInfo.bg }]}>
        <View style={[rv.iconBox, { backgroundColor: fileInfo.bg, borderColor: fileInfo.border }]}>
          <Ionicons name={fileInfo.icon} size={22} color={fileInfo.color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={rv.fileName} numberOfLines={1}>{filename}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
            {fileSize && (
              <View style={rv.chip}>
                <Ionicons name="server-outline" size={9} color={TEXT_LIGHT} />
                <Text style={rv.chipText}>{fileSize}</Text>
              </View>
            )}
            <View style={rv.chip}>
              <Text style={rv.chipText}>{filename.split('.').pop()?.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          style={rv.viewBtn}
          onPress={() => Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open file'))}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={14} color={BLUE} />
          <Text style={rv.viewBtnText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[rv.dlBtn, downloaded && { backgroundColor: GREEN }]}
          onPress={async () => {
            setDownloading(true);
            try {
              const localPath = `${FileSystem.cacheDirectory}${filename}`;
              const { uri } = await FileSystem.downloadAsync(url, localPath);
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { mimeType: filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream' });
              } else {
                await Linking.openURL(url);
              }
              setDownloaded(true);
            } catch {
              Alert.alert('Download Failed', 'Check your connection and try again.');
            } finally { setDownloading(false); }
          }}
          disabled={downloading}
          activeOpacity={0.85}
        >
          {downloading
            ? <ActivityIndicator size="small" color={WHITE} />
            : downloaded
            ? <><Ionicons name="checkmark-circle-outline" size={14} color={WHITE} /><Text style={rv.dlBtnText}>Saved</Text></>
            : <><Ionicons name="cloud-download-outline"   size={14} color={WHITE} /><Text style={rv.dlBtnText}>Download</Text></>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const rv = StyleSheet.create({
  fileCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 13, borderWidth: 1.5 },
  iconBox:    { width: 44, height: 44, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fileName:   { fontSize: 13, fontWeight: '700', color: TEXT_MAIN },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: WHITE, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: BORDER },
  chipText:   { fontSize: 9, color: TEXT_LIGHT, fontWeight: '500' },
  viewBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: `${BLUE}08`, borderWidth: 1.5, borderColor: `${BLUE}25` },
  viewBtnText:{ fontSize: 12, fontWeight: '700', color: BLUE },
  dlBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: BLUE, shadowColor: BLUE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 8, elevation: 3 },
  dlBtnText:  { fontSize: 12, fontWeight: '700', color: WHITE },
});

// ── Job Card ──────────────────────────────────────────────────────────────────
const JobCard = ({ item, onViewApplicants }) => {
  const sc     = getJobStatusConfig(item.status);
  const budget = item.budget_amount ? getBudgetDisplay(item) : null;
  const skills = item.required_skills || [];

  return (
    <View style={jc.card}>
      {/* Top row: type badge + status badge */}
      <View style={jc.topRow}>
        <View style={jc.typeBadge}>
          <Ionicons name={getCategoryIcon(item.job_type)} size={10} color={BLUE} />
          <Text style={jc.typeText} numberOfLines={1}>
            {item.job_type?.replace(/_/g, ' ').toUpperCase() || 'JOB'}
          </Text>
        </View>
        <View style={[jc.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <View style={[jc.statusDot, { backgroundColor: sc.dot }]} />
          <Text style={[jc.statusText, { color: sc.text }]}>{sc.label}</Text>
        </View>
      </View>

      <Text style={jc.title} numberOfLines={2}>{item.title}</Text>
      {item.description ? (
        <Text style={jc.desc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      {skills.length > 0 && (
        <View style={jc.skillsRow}>
          {skills.slice(0, 3).map((sk, i) => (
            <View key={i} style={jc.skillChip}>
              <Text style={jc.skillText} numberOfLines={1}>{sk}</Text>
            </View>
          ))}
          {skills.length > 3 && (
            <View style={jc.skillChip}>
              <Text style={jc.skillText}>+{skills.length - 3} more</Text>
            </View>
          )}
        </View>
      )}

      <View style={jc.metaRow}>
        {budget && (
          <View style={jc.metaPill}>
            <Ionicons name="cash-outline" size={11} color={GOLD_DK} />
            <Text style={[jc.metaText, { color: GOLD_DK, fontWeight: '700' }]}>{budget}</Text>
          </View>
        )}
        {item.work_setup && (
          <View style={jc.metaPill}>
            <Ionicons name="wifi-outline" size={11} color={TEXT_MUTED} />
            <Text style={jc.metaText} numberOfLines={1}>{item.work_setup.replace(/_/g, ' ')}</Text>
          </View>
        )}
        <View style={jc.metaPill}>
          <Ionicons name="time-outline" size={11} color={TEXT_MUTED} />
          <Text style={jc.metaText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      <View style={jc.divider} />

      <View style={jc.footer}>
        <View style={jc.applicantPill}>
          <Ionicons name="people-outline" size={13} color={BLUE} />
          <Text style={jc.applicantText}>
            {item.total_applicants || 0} Applicant{(item.total_applicants || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={jc.viewBtn}
          onPress={() => onViewApplicants(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="people-outline" size={13} color={WHITE} />
          <Text style={jc.viewBtnText}>View Applicants</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const jc = StyleSheet.create({
  card:          { backgroundColor: CARD, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: BORDER, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  topRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  typeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${BLUE}10`, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, borderWidth: 1, borderColor: `${BLUE}22`, flexShrink: 1 },
  typeText:      { fontSize: 9, fontWeight: '700', color: BLUE, letterSpacing: 0.5 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, borderWidth: 1, flexShrink: 0 },
  statusDot:     { width: 5, height: 5, borderRadius: 3 },
  statusText:    { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  title:         { fontSize: 15, fontWeight: '800', color: TEXT_MAIN, lineHeight: 22, marginBottom: 6, letterSpacing: -0.2 },
  desc:          { fontSize: 12, color: TEXT_MUTED, lineHeight: 18, marginBottom: 12 },
  skillsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillChip:     { paddingHorizontal: 9, paddingVertical: 4, backgroundColor: GREEN_SOFT, borderRadius: 6, borderWidth: 1, borderColor: GREEN_MID },
  skillText:     { fontSize: 10, color: GREEN_DARK, fontWeight: '600' },
  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  metaPill:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BG_GRAY, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, borderWidth: 1, borderColor: BORDER },
  metaText:      { fontSize: 11, color: TEXT_MUTED },
  divider:       { height: 1, backgroundColor: BORDER, marginBottom: 12 },
  footer:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  applicantPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${BLUE}08`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: `${BLUE}20` },
  applicantText: { fontSize: 12, color: BLUE, fontWeight: '600' },
  viewBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BLUE, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 6, elevation: 2 },
  viewBtnText:   { fontSize: 12, fontWeight: '700', color: WHITE },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MyPostings({ onNavigate }) {
  const dispatch = useDispatch();
  const { clientJobs, isLoading } = useSelector((s) => s.jobs.jobs);
  const { token }  = useSelector((s) => s.auth);

  const [activeFilterTab,      setActiveFilterTab]      = useState('All');
  const [refreshing,           setRefreshing]           = useState(false);
  const [selectedJob,          setSelectedJob]          = useState(null);
  const [showApplicantsModal,  setShowApplicantsModal]  = useState(false);
  const [applications,         setApplications]         = useState([]);
  const [loadingApplications,  setLoadingApplications]  = useState(false);
  const [showProfileModal,     setShowProfileModal]     = useState(false);
  const [selectedApplication,  setSelectedApplication]  = useState(null);
  const [selectedApplicant,    setSelectedApplicant]    = useState(null);
  const [showInterviewModal,   setShowInterviewModal]   = useState(false);
  const [actionLoading,        setActionLoading]        = useState(null);

  // Success modal state
  const [successEvent,         setSuccessEvent]         = useState(null);
  const [successApplicantName, setSuccessApplicantName] = useState('');
  const [showSuccessModal,     setShowSuccessModal]     = useState(false);

  // Interview form
  const [interviewDate,  setInterviewDate]  = useState(new Date());
  const [interviewTime,  setInterviewTime]  = useState(new Date());
  const [interviewLink,  setInterviewLink]  = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate,       setTempDate]       = useState(new Date());
  const [tempTime,       setTempTime]       = useState(new Date());
  const [sendingInterview, setSendingInterview] = useState(false);

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
      const apps = (res.applications || []).map(app => {
        if (app.freelancer_id?.resume && !app.resume) app.resume = app.freelancer_id.resume;
        return app;
      });
      setApplications(apps);
      setShowApplicantsModal(true);
    } catch {
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

  const filteredJobs = (clientJobs || []).filter(j =>
    activeFilterTab === 'All' ? true : j.status === activeFilterTab
  );

  // ── Status update — stays on MyPostings after success ─────────────────────
  const handleUpdateStatus = async (application, newStatus) => {
    const applicantName =
      `${application.freelancer_id?.first_name || ''} ${application.freelancer_id?.last_name || ''}`.trim() || 'Applicant';
    setActionLoading(newStatus);
    try {
      await dispatch(updateApplicationStatus({ applicationId: application._id, status: newStatus })).unwrap();

      // Refresh applications list in-place (stays on current screen)
      if (selectedJob?._id) {
        const res = await dispatch(getJobApplications({ jobId: selectedJob._id })).unwrap();
        const apps = (res.applications || []).map(app => {
          if (app.freelancer_id?.resume && !app.resume) app.resume = app.freelancer_id.resume;
          return app;
        });
        setApplications(apps);

        // Keep selectedApplication in sync
        const updatedApp = apps.find(a => a._id === application._id);
        if (updatedApp) setSelectedApplication(updatedApp);
      }

      // Show success modal — does NOT close the modal stack or navigate away
      const event = SUCCESS_EVENTS[newStatus];
      if (event) {
        setSuccessEvent(event);
        setSuccessApplicantName(applicantName);
        setShowSuccessModal(true);
      }
    } catch {
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendOffer   = (app) => handleUpdateStatus(app, 'offered');
  const handleMarkAsHired = (app) => {
    Alert.alert(
      'Confirm Hire',
      `Hire ${app.freelancer_id?.first_name || 'this freelancer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Hire', onPress: () => handleUpdateStatus(app, 'hired') },
      ],
    );
  };
  const handleReject = (app) => {
    Alert.alert(
      'Reject Application',
      `Reject ${app.freelancer_id?.first_name || "this applicant"}'s application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => handleUpdateStatus(app, 'rejected') },
      ],
    );
  };

  // Called when user taps the next-step action inside the success modal
  const handleSuccessContinue = (nextStatus) => {
    setShowSuccessModal(false);
    if (!nextStatus || !selectedApplication) return;
    if (nextStatus === 'interview') {
      setShowInterviewModal(true);
    } else if (nextStatus === 'offered') {
      handleSendOffer(selectedApplication);
    } else if (nextStatus === 'hired') {
      handleMarkAsHired(selectedApplication);
    }
  };

  const handleSendInterview = async () => {
    if (!interviewDate || !interviewTime) {
      Alert.alert('Missing Information', 'Please set both interview date and time.');
      return;
    }
    setSendingInterview(true);
    try {
      const scheduled = new Date(interviewDate);
      scheduled.setHours(interviewTime.getHours());
      scheduled.setMinutes(interviewTime.getMinutes());
      await dispatch(updateApplicationStatus({
        applicationId: selectedApplication._id,
        status: 'interview',
        interviewData: {
          scheduledDate: scheduled.toISOString(),
          meetingLink: interviewLink,
          notes: interviewNotes,
        },
      })).unwrap();

      // Refresh in-place
      if (selectedJob?._id) {
        const res = await dispatch(getJobApplications({ jobId: selectedJob._id })).unwrap();
        const apps = (res.applications || []).map(app => {
          if (app.freelancer_id?.resume && !app.resume) app.resume = app.freelancer_id.resume;
          return app;
        });
        setApplications(apps);
        const updatedApp = apps.find(a => a._id === selectedApplication._id);
        if (updatedApp) setSelectedApplication(updatedApp);
      }

      setShowInterviewModal(false);
      setInterviewDate(new Date());
      setInterviewTime(new Date());
      setInterviewLink('');
      setInterviewNotes('');

      const applicantName =
        `${selectedApplicant?.first_name || ''} ${selectedApplicant?.last_name || ''}`.trim();
      setSuccessEvent(SUCCESS_EVENTS.interview);
      setSuccessApplicantName(applicantName);
      setShowSuccessModal(true);
    } catch {
      Alert.alert('Error', 'Failed to schedule interview. Please try again.');
    } finally {
      setSendingInterview(false);
    }
  };

  const handleViewProfile = (application) => {
    setSelectedApplicant(application.freelancer_id);
    setSelectedApplication(application);
    setShowProfileModal(true);
  };

  const handleMessageFreelancer = (freelancerId) => {
    setShowProfileModal(false);
    onNavigate('Messages', { userId: freelancerId, userRole: 'freelancer' });
  };

  // ── Action Buttons ─────────────────────────────────────────────────────────
  const renderActionButtons = (application) => {
    const status = application.status;
    const isLd   = (s) => actionLoading === s;

    return (
      <View style={ap.actionRow}>
        {status === 'pending' && (
          <ActionBtn
            label="Shortlist"
            icon="star-outline"
            color="#60a5fa"
            loading={isLd('reviewed')}
            onPress={() => handleUpdateStatus(application, 'reviewed')}
          />
        )}
        {status === 'reviewed' && (
          <ActionBtn
            label="Schedule Interview"
            icon="calendar-outline"
            color="#f59e0b"
            loading={isLd('interview')}
            onPress={() => {
              setSelectedApplication(application);
              setSelectedApplicant(application.freelancer_id);
              setShowInterviewModal(true);
            }}
          />
        )}
        {status === 'interview' && (
          <ActionBtn
            label="Send Offer"
            icon="gift-outline"
            color={GREEN}
            loading={isLd('offered')}
            onPress={() => handleSendOffer(application)}
          />
        )}
        {status === 'offered' && (
          <ActionBtn
            label="Mark as Hired"
            icon="checkmark-circle-outline"
            color={GREEN}
            loading={isLd('hired')}
            onPress={() => handleMarkAsHired(application)}
          />
        )}
        {!['rejected', 'hired', 'offered'].includes(status) && (
          <ActionBtn
            label="Reject"
            icon="close-outline"
            color={RED}
            loading={isLd('rejected')}
            onPress={() => handleReject(application)}
          />
        )}
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={s.topbar}>
          <View style={s.iconWrap}><Ionicons name="arrow-back" size={18} color={WHITE} /></View>
          <Text style={s.topbarTitle}>My <Text style={s.gold}>Postings</Text></Text>
          <View style={s.iconWrap} />
        </View>
        <View style={s.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={s.loadingText}>Loading your postings…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={s.root}>

        {/* ── Top Bar ── */}
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
            <View style={s.iconWrap}>
              <Ionicons name="arrow-back" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={s.topbarTitle}>My <Text style={s.gold}>Postings</Text></Text>
          <TouchableOpacity onPress={() => onNavigate('Sentoffers')} activeOpacity={0.7}>
            <View style={s.iconWrap}>
              <Ionicons name="document-text-outline" size={20} color={WHITE} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Filter Tabs ── */}
        <View style={s.filterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterScroll}
          >
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

        {/* ── Job List ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        >
          {filteredJobs.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="document-text-outline" size={34} color={BLUE} />
              </View>
              <Text style={s.emptyTitle}>No Job Postings</Text>
              <Text style={s.emptyDesc}>
                {activeFilterTab === 'All'
                  ? "You haven't posted any jobs yet."
                  : `No ${formatStatus(activeFilterTab).toLowerCase()} jobs found.`}
              </Text>
              {activeFilterTab === 'All' && (
                <TouchableOpacity style={s.postBtn} onPress={() => onNavigate('PostJob')}>
                  <Ionicons name="add" size={16} color={WHITE} />
                  <Text style={s.postBtnText}>Post Your First Job</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredJobs.map(item => (
              <JobCard
                key={item._id}
                item={item}
                onViewApplicants={job => {
                  setSelectedJob(job);
                  fetchApplications(job._id);
                }}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* ══════════════════════════════════════════════════════════
          Applicants Modal
      ══════════════════════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent
        visible={showApplicantsModal}
        onRequestClose={() => setShowApplicantsModal(false)}
      >
        <View style={md.overlay}>
          <View style={md.sheet}>
            <View style={md.handle} />
            <View style={md.header}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={md.title}>Applicants</Text>
                <Text style={md.subtitle} numberOfLines={1}>{selectedJob?.title}</Text>
              </View>
              <TouchableOpacity style={md.closeBtn} onPress={() => setShowApplicantsModal(false)}>
                <Ionicons name="close" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            {loadingApplications ? (
              <View style={s.center}>
                <ActivityIndicator size="large" color={BLUE} />
                <Text style={s.loadingText}>Loading applications…</Text>
              </View>
            ) : applications.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="people-outline" size={44} color={TEXT_LIGHT} style={{ marginBottom: 12 }} />
                <Text style={s.emptyTitle}>No Applications Yet</Text>
                <Text style={s.emptyDesc}>Freelancers will appear here when they apply.</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
              >
                {applications.map(app => {
                  const si = getStatusInfo(app.status);
                  const fl = app.freelancer_id;
                  return (
                    <TouchableOpacity
                      key={app._id}
                      style={ap.card}
                      onPress={() => handleViewProfile(app)}
                      activeOpacity={0.75}
                    >
                      <View style={ap.topRow}>
                        {/* Avatar */}
                        <View style={ap.avatar}>
                          {fl?.profile_picture
                            ? <Image source={{ uri: fl.profile_picture }} style={ap.avatarImg} />
                            : <Text style={ap.avatarText}>
                                {fl?.first_name?.[0]}{fl?.last_name?.[0]}
                              </Text>}
                        </View>

                        {/* Name block */}
                        <View style={ap.nameBlock}>
                          <Text style={ap.name} numberOfLines={1}>
                            {fl?.first_name} {fl?.last_name}
                          </Text>
                          <Text style={ap.role} numberOfLines={1}>
                            {fl?.experience_level || 'Freelancer'}
                          </Text>
                          {fl?.skills?.length > 0 && (
                            <View style={ap.skillsRow}>
                              {fl.skills.slice(0, 2).map((sk, i) => (
                                <View key={i} style={ap.skillChip}>
                                  <Text style={ap.skillText} numberOfLines={1}>{sk}</Text>
                                </View>
                              ))}
                              {fl.skills.length > 2 && (
                                <Text style={ap.more}>+{fl.skills.length - 2}</Text>
                              )}
                            </View>
                          )}
                        </View>

                        {/* Status badge */}
                        <View style={[ap.statusBadge, { backgroundColor: `${si.color}15`, borderColor: `${si.color}30` }]}>
                          <Ionicons name={si.icon} size={9} color={si.color} />
                          <Text style={[ap.statusText, { color: si.color }]}>{si.label}</Text>
                        </View>
                      </View>

                      {app.cover_letter ? (
                        <Text style={ap.coverLetter} numberOfLines={2}>{app.cover_letter}</Text>
                      ) : null}

                      <View style={ap.footer}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          {app.proposed_rate ? (
                            <Text style={ap.rate}>₱{app.proposed_rate?.toLocaleString()}</Text>
                          ) : null}
                          <Text style={ap.date}>Applied {formatDate(app.applied_at)}</Text>
                        </View>
                        <TouchableOpacity style={ap.viewBtn} onPress={() => handleViewProfile(app)}>
                          <Ionicons name="person-outline" size={12} color={BLUE} />
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

      {/* ══════════════════════════════════════════════════════════
          Freelancer Profile Modal
      ══════════════════════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={md.overlay}>
          <View style={[md.sheet, { maxHeight: '92%' }]}>
            <View style={md.handle} />
            <View style={md.header}>
              <Text style={md.title}>Freelancer Profile</Text>
              <TouchableOpacity style={md.closeBtn} onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            {selectedApplicant && selectedApplication && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
              >
                {/* Hero profile card */}
                <View style={pf.heroCard}>
                  <View style={pf.avatarWrap}>
                    {selectedApplicant.profile_picture
                      ? <Image source={{ uri: selectedApplicant.profile_picture }} style={pf.avatarImg} />
                      : <Text style={pf.avatarText}>
                          {selectedApplicant.first_name?.[0]}{selectedApplicant.last_name?.[0]}
                        </Text>}
                  </View>
                  <Text style={pf.name} numberOfLines={1}>
                    {selectedApplicant.first_name} {selectedApplicant.last_name}
                  </Text>
                  <Text style={pf.username}>@{selectedApplicant.username}</Text>
                  {selectedApplicant.rating > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <RatingStars rating={selectedApplicant.rating} size={15} />
                    </View>
                  )}
                  <View style={[
                    pf.statusBadge,
                    {
                      backgroundColor: `${getStatusInfo(selectedApplication.status).color}15`,
                      borderColor: `${getStatusInfo(selectedApplication.status).color}30`,
                    },
                  ]}>
                    <Ionicons
                      name={getStatusInfo(selectedApplication.status).icon}
                      size={12}
                      color={getStatusInfo(selectedApplication.status).color}
                    />
                    <Text style={[pf.statusText, { color: getStatusInfo(selectedApplication.status).color }]}>
                      {getStatusInfo(selectedApplication.status).label}
                    </Text>
                  </View>
                </View>

                {/* Contact */}
                <View style={pf.section}>
                  <Text style={pf.sectionLabel}>Contact Information</Text>
                  <View style={pf.infoCard}>
                    {[
                      { icon: 'mail-outline',     val: selectedApplicant.email_address },
                      { icon: 'call-outline',     val: selectedApplicant.phone_number  },
                      { icon: 'location-outline', val: selectedApplicant.location      },
                    ].filter(r => r.val).map((r, i) => (
                      <View key={i} style={[pf.infoRow, i > 0 && pf.infoRowBorder]}>
                        <Ionicons name={r.icon} size={14} color={BLUE} />
                        <Text style={pf.infoText} numberOfLines={1}>{r.val}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Skills */}
                {selectedApplicant.skills?.length > 0 && (
                  <View style={pf.section}>
                    <Text style={pf.sectionLabel}>Skills</Text>
                    <View style={pf.skillsWrap}>
                      {selectedApplicant.skills.map((sk, i) => (
                        <View key={i} style={pf.skillChip}>
                          <Text style={pf.skillText}>{sk}</Text>
                        </View>
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

                {/* Resume */}
                <View style={pf.section}>
                  <View style={pf.sectionRow}>
                    <Text style={pf.sectionLabel}>Resume / CV</Text>
                    {(() => {
                      const has =
                        selectedApplication.resume?.url  || selectedApplication.resume?.uri  ||
                        selectedApplication.resume_url   ||
                        selectedApplicant.resume?.url    ||
                        (typeof selectedApplication.resume === 'string' && selectedApplication.resume.length > 0) ||
                        (typeof selectedApplicant.resume  === 'string' && selectedApplicant.resume.length  > 0);
                      return has ? (
                        <View style={pf.attachedBadge}>
                          <Ionicons name="checkmark-circle" size={10} color={GREEN} />
                          <Text style={pf.attachedText}>Attached</Text>
                        </View>
                      ) : null;
                    })()}
                  </View>
                  {(() => {
                    const resumeData =
                      selectedApplication.resume     ||
                      selectedApplication.resume_url ||
                      selectedApplicant.resume       || null;
                    return resumeData ? (
                      <ResumeCard resume={resumeData} />
                    ) : (
                      <View style={pf.noResumeCard}>
                        <Ionicons name="document-outline" size={20} color={TEXT_LIGHT} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={pf.noResumeTitle}>No resume attached</Text>
                          <Text style={pf.noResumeSub}>This applicant did not upload a CV.</Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* Education */}
                {selectedApplication.education && (
                  <View style={pf.section}>
                    <Text style={pf.sectionLabel}>Education</Text>
                    <View style={pf.infoCard}>
                      {[
                        { label: 'Level',       value: selectedApplication.education.level            },
                        { label: 'Field',       value: selectedApplication.education.field_of_study   },
                        { label: 'Institution', value: selectedApplication.education.institution      },
                        { label: 'Graduated',   value: selectedApplication.education.graduation_year  },
                      ].filter(r => r.value).map((r, i, arr) => (
                        <View key={i} style={[pf.detailRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                          <Text style={pf.detailLabel}>{r.label}</Text>
                          <Text style={pf.detailValue} numberOfLines={2}>{r.value}</Text>
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
                        {exp.description ? (
                          <Text style={[pf.bodyText, { marginTop: 8 }]}>{exp.description}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}

                {/* Cover Letter */}
                {selectedApplication.cover_letter && (
                  <View style={pf.section}>
                    <Text style={pf.sectionLabel}>Cover Letter</Text>
                    <View style={pf.infoCard}>
                      <Text style={pf.bodyText}>{selectedApplication.cover_letter}</Text>
                    </View>
                  </View>
                )}

                {/* Proposed Rate */}
                {selectedApplication.proposed_rate && (
                  <View style={pf.section}>
                    <Text style={pf.sectionLabel}>Proposed Rate</Text>
                    <View style={pf.rateChip}>
                      <Ionicons name="cash-outline" size={16} color={GOLD_DK} />
                      <Text style={pf.rateText}>₱{selectedApplication.proposed_rate.toLocaleString()}</Text>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                {renderActionButtons(selectedApplication)}

                {/* Message Button */}
                <TouchableOpacity
                  style={pf.msgBtn}
                  onPress={() => handleMessageFreelancer(selectedApplicant._id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={WHITE} />
                  <Text style={pf.msgBtnText}>Message Freelancer</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          Interview Modal
      ══════════════════════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent
        visible={showInterviewModal}
        onRequestClose={() => setShowInterviewModal(false)}
      >
        <View style={md.overlay}>
          <View style={[md.sheet, { maxHeight: '90%' }]}>
            <View style={md.handle} />
            <View style={md.header}>
              <Text style={md.title}>Schedule Interview</Text>
              <TouchableOpacity style={md.closeBtn} onPress={() => setShowInterviewModal(false)}>
                <Ionicons name="close" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
            >
              {/* Candidate strip */}
              {selectedApplicant && (
                <View style={iv.candidateStrip}>
                  <View style={iv.candidateAvatar}>
                    {selectedApplicant.profile_picture
                      ? <Image source={{ uri: selectedApplicant.profile_picture }} style={{ width: 38, height: 38, borderRadius: 19 }} />
                      : <Text style={iv.candidateInitials}>
                          {selectedApplicant.first_name?.[0]}{selectedApplicant.last_name?.[0]}
                        </Text>}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={iv.candidateName} numberOfLines={1}>
                      {selectedApplicant.first_name} {selectedApplicant.last_name}
                    </Text>
                    <Text style={iv.candidateRole} numberOfLines={1}>
                      {selectedApplicant.experience_level || 'Freelancer'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Date */}
              <View style={iv.field}>
                <Text style={iv.label}>Interview Date <Text style={iv.required}>*</Text></Text>
                <TouchableOpacity style={iv.pickerBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                  <Ionicons name="calendar-outline" size={18} color={BLUE} />
                  <Text style={iv.pickerText}>{formatFullDate(interviewDate)}</Text>
                  <Ionicons name="chevron-down" size={15} color={TEXT_LIGHT} />
                </TouchableOpacity>
              </View>

              {/* Time */}
              <View style={iv.field}>
                <Text style={iv.label}>Interview Time <Text style={iv.required}>*</Text></Text>
                <TouchableOpacity style={iv.pickerBtn} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
                  <Ionicons name="time-outline" size={18} color={BLUE} />
                  <Text style={iv.pickerText}>{formatTime(interviewTime)}</Text>
                  <Ionicons name="chevron-down" size={15} color={TEXT_LIGHT} />
                </TouchableOpacity>
              </View>

              {/* Date Picker Modal */}
              {showDatePicker && (
                <Modal transparent animationType="fade" visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
                  <View style={iv.pickerOverlay}>
                    <View style={iv.pickerBox}>
                      <View style={iv.pickerHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={iv.pickerCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={iv.pickerTitle}>Select Date</Text>
                        <TouchableOpacity onPress={() => { setInterviewDate(tempDate); setShowDatePicker(false); }}>
                          <Text style={iv.pickerConfirm}>Confirm</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, d) => d && setTempDate(d)}
                        minimumDate={new Date()}
                        style={Platform.OS === 'ios' ? { height: 200 } : {}}
                      />
                    </View>
                  </View>
                </Modal>
              )}

              {/* Time Picker Modal */}
              {showTimePicker && (
                <Modal transparent animationType="fade" visible={showTimePicker} onRequestClose={() => setShowTimePicker(false)}>
                  <View style={iv.pickerOverlay}>
                    <View style={iv.pickerBox}>
                      <View style={iv.pickerHeader}>
                        <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                          <Text style={iv.pickerCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={iv.pickerTitle}>Select Time</Text>
                        <TouchableOpacity onPress={() => { setInterviewTime(tempTime); setShowTimePicker(false); }}>
                          <Text style={iv.pickerConfirm}>Confirm</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={tempTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, t) => t && setTempTime(t)}
                        is24Hour={false}
                        style={Platform.OS === 'ios' ? { height: 200 } : {}}
                      />
                    </View>
                  </View>
                </Modal>
              )}

              {/* Video link */}
              <View style={iv.field}>
                <Text style={iv.label}>
                  Video Call Link{' '}
                  <Text style={iv.optional}>(Optional)</Text>
                </Text>
                <TextInput
                  style={iv.input}
                  placeholder="Zoom, Google Meet, Teams…"
                  placeholderTextColor={TEXT_LIGHT}
                  value={interviewLink}
                  onChangeText={setInterviewLink}
                  autoCapitalize="none"
                />
              </View>

              {/* Notes */}
              <View style={iv.field}>
                <Text style={iv.label}>
                  Notes{' '}
                  <Text style={iv.optional}>(Optional)</Text>
                </Text>
                <TextInput
                  style={[iv.input, iv.inputMultiline]}
                  placeholder="Instructions or agenda for the candidate…"
                  placeholderTextColor={TEXT_LIGHT}
                  value={interviewNotes}
                  onChangeText={setInterviewNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <TouchableOpacity style={iv.cancelBtn} onPress={() => setShowInterviewModal(false)}>
                  <Text style={iv.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={iv.sendBtn}
                  onPress={handleSendInterview}
                  disabled={sendingInterview}
                  activeOpacity={0.85}
                >
                  {sendingInterview
                    ? <ActivityIndicator size="small" color={WHITE} />
                    : <>
                        <Ionicons name="calendar-outline" size={16} color={WHITE} />
                        <Text style={iv.sendText}>Send Invitation</Text>
                      </>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Success Modal ── */}
      <SuccessModal
        visible={showSuccessModal}
        event={successEvent}
        applicantName={successApplicantName}
        onContinue={handleSuccessContinue}
        onClose={() => setShowSuccessModal(false)}
      />
    </SafeAreaView>
  );
}

// ── Reusable Action Button ─────────────────────────────────────────────────────
const ActionBtn = ({ label, icon, color, loading, onPress }) => (
  <TouchableOpacity
    style={[ab.btn, { backgroundColor: `${color}12`, borderColor: `${color}30` }]}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.8}
  >
    {loading
      ? <ActivityIndicator size="small" color={color} />
      : <Ionicons name={icon} size={15} color={color} />}
    <Text style={[ab.text, { color }]} numberOfLines={1}>{label}</Text>
  </TouchableOpacity>
);

const ab = StyleSheet.create({
  btn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1.5 },
  text: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
});

// ── Applicant card styles ─────────────────────────────────────────────────────
const ap = StyleSheet.create({
  card:        { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  topRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  avatar:      { width: 46, height: 46, borderRadius: 23, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarImg:   { width: 46, height: 46, borderRadius: 23 },
  avatarText:  { fontSize: 15, fontWeight: '700', color: WHITE },
  nameBlock:   { flex: 1, minWidth: 0 },
  name:        { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  role:        { fontSize: 11, color: TEXT_MUTED, marginBottom: 5 },
  skillsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  skillChip:   { backgroundColor: GREEN_SOFT, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  skillText:   { fontSize: 9, color: GREEN_DARK, fontWeight: '600' },
  more:        { fontSize: 9, color: TEXT_MUTED, alignSelf: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexShrink: 0 },
  statusText:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  coverLetter: { fontSize: 12, color: TEXT_MUTED, lineHeight: 18, marginBottom: 10 },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  rate:        { fontSize: 13, color: GOLD_DK, fontWeight: '700', marginBottom: 2 },
  date:        { fontSize: 10, color: TEXT_LIGHT },
  viewBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${BLUE}10`, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: `${BLUE}22`, flexShrink: 0 },
  viewBtnText: { fontSize: 11, color: BLUE, fontWeight: '700' },
  actionRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 14, borderTopWidth: 1.5, borderTopColor: BORDER, marginTop: 4 },
});

// ── Freelancer profile modal styles ───────────────────────────────────────────
const pf = StyleSheet.create({
  heroCard:      { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, backgroundColor: BG, borderRadius: 16, borderWidth: 1.5, borderColor: BORDER, marginBottom: 20 },
  avatarWrap:    { width: 78, height: 78, borderRadius: 39, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: WHITE, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarImg:     { width: 78, height: 78, borderRadius: 39 },
  avatarText:    { fontSize: 26, fontWeight: '800', color: WHITE },
  name:          { fontSize: 18, fontWeight: '800', color: TEXT_MAIN, marginBottom: 2, letterSpacing: -0.3, textAlign: 'center' },
  username:      { fontSize: 12, color: TEXT_MUTED, marginBottom: 10 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusText:    { fontSize: 12, fontWeight: '700' },
  section:       { marginBottom: 18 },
  sectionRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel:  { fontSize: 10, fontWeight: '800', color: BLUE, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  attachedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GREEN_SOFT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: GREEN_MID },
  attachedText:  { fontSize: 10, fontWeight: '700', color: GREEN_DARK },
  noResumeCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: BG_GRAY, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed' },
  noResumeTitle: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED, marginBottom: 2 },
  noResumeSub:   { fontSize: 11, color: TEXT_LIGHT, lineHeight: 16 },
  infoCard:      { backgroundColor: BG_GRAY, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1.5, borderColor: BORDER },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  infoText:      { fontSize: 13, color: TEXT_MAIN, flex: 1 },
  bodyText:      { fontSize: 13, color: TEXT_MUTED, lineHeight: 20 },
  skillsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip:     { backgroundColor: `${BLUE}10`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: `${BLUE}20` },
  skillText:     { fontSize: 12, color: BLUE, fontWeight: '600' },
  detailRow:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  detailLabel:   { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500', flexShrink: 0 },
  detailValue:   { fontSize: 12, color: TEXT_MAIN, fontWeight: '500', flex: 1, textAlign: 'right' },
  expTitle:      { fontSize: 13, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  expCompany:    { fontSize: 12, color: TEXT_MUTED, marginBottom: 3 },
  expPeriod:     { fontSize: 11, color: TEXT_LIGHT },
  rateChip:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(200,149,32,0.08)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(200,149,32,0.2)', alignSelf: 'flex-start' },
  rateText:      { fontSize: 16, fontWeight: '800', color: GOLD_DK, letterSpacing: -0.3 },
  msgBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, marginTop: 16, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 3 },
  msgBtnText:    { fontSize: 14, fontWeight: '700', color: WHITE },
});

// ── Modal base styles ─────────────────────────────────────────────────────────
const md = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(7,26,62,0.6)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: BORDER, gap: 12 },
  title:    { fontSize: 16, fontWeight: '800', color: TEXT_MAIN, flex: 1 },
  subtitle: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER, flexShrink: 0 },
});

// ── Interview form styles ─────────────────────────────────────────────────────
const iv = StyleSheet.create({
  candidateStrip:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: BG, borderRadius: 12, padding: 14, marginBottom: 22, borderWidth: 1.5, borderColor: BORDER },
  candidateAvatar:   { width: 38, height: 38, borderRadius: 19, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  candidateInitials: { fontSize: 14, fontWeight: '700', color: WHITE },
  candidateName:     { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  candidateRole:     { fontSize: 11, color: TEXT_MUTED, marginTop: 1 },
  field:             { marginBottom: 16 },
  label:             { fontSize: 12, fontWeight: '700', color: TEXT_MUTED, marginBottom: 7, letterSpacing: 0.2 },
  required:          { color: RED },
  optional:          { color: TEXT_LIGHT, fontWeight: '400' },
  pickerBtn:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: BG, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: BORDER },
  pickerText:        { flex: 1, fontSize: 14, color: TEXT_MAIN, fontWeight: '500' },
  input:             { backgroundColor: BG, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, color: TEXT_MAIN, fontSize: 14, borderWidth: 1.5, borderColor: BORDER },
  inputMultiline:    { height: 96, textAlignVertical: 'top' },
  pickerOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerBox:         { backgroundColor: WHITE, borderRadius: 20, padding: 20, width: '90%', maxWidth: 400 },
  pickerHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  pickerTitle:       { fontSize: 15, fontWeight: '700', color: TEXT_MAIN },
  pickerCancel:      { fontSize: 14, color: TEXT_MUTED, fontWeight: '600' },
  pickerConfirm:     { fontSize: 14, color: BLUE, fontWeight: '700' },
  cancelBtn:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 11, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER },
  cancelText:        { fontSize: 14, fontWeight: '600', color: TEXT_MUTED },
  sendBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: 11, backgroundColor: BLUE, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 3 },
  sendText:          { fontSize: 14, fontWeight: '700', color: WHITE },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: NAVY },
  root:              { flex: 1, backgroundColor: BG },
  topbar:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: NAVY },
  iconWrap:          { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  topbarTitle:       { fontSize: 17, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  gold:              { color: GOLD_LT, fontStyle: 'italic' },
  filterWrap:        { backgroundColor: CARD, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  filterScroll:      { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: CARD },
  filterTabActive:   { backgroundColor: BLUE, borderColor: BLUE },
  filterTabText:     { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  filterTabTextActive: { color: WHITE },
  filterBadge:       { backgroundColor: BORDER, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  filterBadgeActive: { backgroundColor: WHITE },
  filterBadgeText:   { fontSize: 9, fontWeight: '700', color: TEXT_MUTED },
  filterBadgeTextActive: { color: BLUE },
  scroll:            { padding: 16, paddingBottom: 32 },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText:       { marginTop: 12, fontSize: 13, color: TEXT_MUTED },
  empty:             { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon:         { width: 72, height: 72, backgroundColor: `${BLUE}10`, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:        { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8 },
  emptyDesc:         { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  postBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BLUE, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 11, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 2 },
  postBtnText:       { fontSize: 13, fontWeight: '700', color: WHITE },
});