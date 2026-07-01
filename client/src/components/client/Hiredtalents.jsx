import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Linking,
  StatusBar,
  BackHandler,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import {
  getClientApplications,
} from '../../Redux/slices/applicationSlice';

import {
  getClientContracts,
} from '../../Redux/slices/contractSlice';

import {
  getContractUpdates,
} from '../../Redux/slices/projectUpdateSlice';

// ── Bottom tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'          },
  { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'        },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline'    },
  { key: 'Message',       label: 'Messages', icon: 'chatbubble',    iconOutline: 'chatbubble-outline'    },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',        iconOutline: 'person-outline'        },
];

const NAVY       = '#071A3E';
const BLUE       = '#0055A5';
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
const BG_GRAY    = '#F9FAFB';
const RED        = '#DC2626';
const ORANGE     = '#F97316';
const PURPLE     = '#7C3AED';

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

const getStatusColor = (status) => {
  const colors = {
    pending: ORANGE,
    in_progress: BLUE,
    completed: GREEN,
    blocked: RED,
    cancelled: TEXT_LIGHT,
  };
  return colors[status] || TEXT_LIGHT;
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    blocked: 'Blocked',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
};

const getDeliveryStatusColor = (status) => {
  const colors = {
    not_submitted: TEXT_LIGHT,
    submitted: ORANGE,
    approved: GREEN,
    revision_requested: RED,
  };
  return colors[status] || TEXT_LIGHT;
};

const getDeliveryStatusLabel = (status) => {
  const labels = {
    not_submitted: 'Not Submitted',
    submitted: 'Submitted for Review',
    approved: 'Approved',
    revision_requested: 'Revision Requested',
  };
  return labels[status] || status;
};

// Helper: render-safe boolean check
const has = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
};

// ── Update Detail Modal ──────────────────────────────────────────────────────
const UpdateDetailModal = ({ visible, update, onClose }) => {
  if (!update) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={udm.overlay}>
        <View style={udm.sheet}>
          <View style={udm.handle} />
          <View style={udm.header}>
            <Text style={udm.title}>Update Details</Text>
            <TouchableOpacity style={udm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={udm.scrollContent}>
            <View style={udm.updateCard}>
              <View style={udm.updateHeader}>
                <Text style={udm.updateTitle}>{update.title}</Text>
                <View style={[udm.statusBadge, { backgroundColor: getStatusColor(update.status) + '15' }]}>
                  <Text style={[udm.statusText, { color: getStatusColor(update.status) }]}>
                    {getStatusLabel(update.status)}
                  </Text>
                </View>
              </View>

              <View style={udm.metaRow}>
                <View style={udm.metaItem}>
                  <Ionicons name="time-outline" size={14} color={TEXT_LIGHT} />
                  <Text style={udm.metaText}>{formatRelativeTime(update.created_at)}</Text>
                </View>
                <View style={udm.metaItem}>
                  <Ionicons name="trending-up-outline" size={14} color={TEXT_LIGHT} />
                  <Text style={udm.metaText}>Progress: {update.progress ?? 0}%</Text>
                </View>
              </View>

              <View style={udm.metaRow}>
                <View style={udm.metaItem}>
                  <Ionicons name="document-text-outline" size={14} color={getDeliveryStatusColor(update.delivery_status)} />
                  <Text style={udm.metaText}>
                    Delivery: {getDeliveryStatusLabel(update.delivery_status)}
                  </Text>
                </View>
                {has(update.update_type) ? (
                  <View style={udm.metaItem}>
                    <Ionicons name="pricetag-outline" size={14} color={TEXT_LIGHT} />
                    <Text style={udm.metaText}>{update.update_type}</Text>
                  </View>
                ) : null}
              </View>

              {has(update.description) ? (
                <View style={udm.descriptionSection}>
                  <Text style={udm.sectionLabel}>Description</Text>
                  <Text style={udm.descriptionText}>{update.description}</Text>
                </View>
              ) : null}

              {has(update.freelancer_comment) ? (
                <View style={udm.commentSection}>
                  <Text style={udm.sectionLabel}>Freelancer Comment</Text>
                  <View style={udm.commentBox}>
                    <Ionicons name="chatbubble-outline" size={14} color={BLUE} />
                    <Text style={udm.commentText}>{update.freelancer_comment}</Text>
                  </View>
                </View>
              ) : null}

              {has(update.client_comment) ? (
                <View style={udm.commentSection}>
                  <Text style={udm.sectionLabel}>Client Comment</Text>
                  <View style={udm.commentBox}>
                    <Ionicons name="chatbubble-outline" size={14} color={GREEN} />
                    <Text style={udm.commentText}>{update.client_comment}</Text>
                  </View>
                </View>
              ) : null}

              {has(update.attachments) ? (
                <View style={udm.attachmentsSection}>
                  <Text style={udm.sectionLabel}>Attachments ({update.attachments.length})</Text>
                  {update.attachments.map((att, index) => (
                    <TouchableOpacity
                      key={att._id || index}
                      style={udm.attachmentItem}
                      onPress={() => Linking.openURL(att.file_url).catch(() => Alert.alert('Error', 'Cannot open file'))}
                    >
                      <Ionicons name="document-outline" size={16} color={BLUE} />
                      <Text style={udm.attachmentName} numberOfLines={1}>{att.file_name}</Text>
                      <Ionicons name="open-outline" size={14} color={TEXT_LIGHT} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const udm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  title: { fontSize: 16, fontWeight: '800', color: TEXT_MAIN, flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  scrollContent: { padding: 16, paddingBottom: 32 },
  updateCard: { backgroundColor: BG_GRAY, borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: BORDER },
  updateHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  updateTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexShrink: 0 },
  statusText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 6, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: TEXT_MUTED },
  descriptionSection: { marginTop: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  descriptionText: { fontSize: 13, color: TEXT_MAIN, lineHeight: 20 },
  commentSection: { marginTop: 12 },
  commentBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: WHITE, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  commentText: { fontSize: 13, color: TEXT_MAIN, flex: 1, lineHeight: 18 },
  attachmentsSection: { marginTop: 12 },
  attachmentItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WHITE, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: BORDER, marginBottom: 6 },
  attachmentName: { fontSize: 12, color: TEXT_MAIN, flex: 1 },
});

// ── Profile Modal ────────────────────────────────────────────────────────────
const ProfileModal = ({ visible, application, onClose, onMessage, onViewUpdate }) => {
  if (!application) return null;

  const freelancer = application.freelancer_id || {};
  const job = application.job_id || {};
  const firstName = freelancer.first_name || '';
  const lastName = freelancer.last_name || '';
  const fullName = (firstName + ' ' + lastName).trim() || 'Freelancer';
  const initials = (firstName.charAt(0) || '') + (lastName.charAt(0) || '');

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          <View style={pm.handle} />
          <View style={pm.header}>
            <Text style={pm.title}>Freelancer Profile</Text>
            <TouchableOpacity style={pm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
            {/* Hero Card */}
            <View style={pm.heroCard}>
              <View style={pm.avatarWrap}>
                {has(freelancer.profile_picture) ? (
                  <Image source={{ uri: freelancer.profile_picture }} style={pm.avatarImg} />
                ) : (
                  <Text style={pm.avatarText}>{initials || '?'}</Text>
                )}
              </View>
              <Text style={pm.name}>{fullName}</Text>
              <Text style={pm.username}>{'@' + (freelancer.username || '')}</Text>

              {has(freelancer.experience_level) ? (
                <View style={pm.experienceBadge}>
                  <Ionicons name="briefcase-outline" size={12} color={BLUE} />
                  <Text style={pm.experienceText}>{freelancer.experience_level}</Text>
                </View>
              ) : null}

              <View style={pm.appliedInfo}>
                <View style={pm.appliedRow}>
                  <Ionicons name="briefcase-outline" size={14} color={BLUE} />
                  <Text style={pm.appliedText} numberOfLines={1}>
                    {job.title || 'Project'}
                  </Text>
                </View>
                <View style={pm.appliedRow}>
                  <Ionicons name="calendar-outline" size={14} color={TEXT_LIGHT} />
                  <Text style={pm.appliedTimeText}>
                    Hired {formatRelativeTime(application.updatedAt || application.applied_at)}
                  </Text>
                </View>
                {has(application.contract?.agreed_budget?.amount) ? (
                  <View style={pm.appliedRow}>
                    <Ionicons name="cash-outline" size={14} color={GOLD_DK} />
                    <Text style={pm.budgetText}>
                      {formatCurrency(application.contract.agreed_budget.amount)}
                      {application.contract.agreed_budget.type === 'hourly' ? '/hr' : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Job Description */}
            {has(job.description) ? (
              <View style={pm.section}>
                <Text style={pm.sectionLabel}>Job Description</Text>
                <View style={pm.infoCard}>
                  <Text style={pm.bodyText}>{job.description}</Text>
                </View>
              </View>
            ) : null}

            {/* Skills */}
            {has(freelancer.skills) ? (
              <View style={pm.section}>
                <Text style={pm.sectionLabel}>Skills</Text>
                <View style={pm.skillsWrap}>
                  {freelancer.skills.map((sk, i) => (
                    <View key={sk + i} style={pm.skillChip}>
                      <Text style={pm.skillText}>{sk}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* About Freelancer */}
            {has(freelancer.bio_about_me) ? (
              <View style={pm.section}>
                <Text style={pm.sectionLabel}>About {fullName}</Text>
                <View style={pm.infoCard}>
                  <Text style={pm.bodyText}>{freelancer.bio_about_me}</Text>
                </View>
              </View>
            ) : null}

            {/* Contact */}
            <View style={pm.section}>
              <Text style={pm.sectionLabel}>Contact Information</Text>
              <View style={pm.infoCard}>
                {has(freelancer.email_address) ? (
                  <View style={pm.infoRow}>
                    <Ionicons name="mail-outline" size={14} color={BLUE} />
                    <Text style={pm.infoText} numberOfLines={1}>{freelancer.email_address}</Text>
                  </View>
                ) : null}
                {has(freelancer.phone_number) ? (
                  <View style={[pm.infoRow, pm.infoRowBorder]}>
                    <Ionicons name="call-outline" size={14} color={BLUE} />
                    <Text style={pm.infoText} numberOfLines={1}>{freelancer.phone_number}</Text>
                  </View>
                ) : null}
                {has(freelancer.location) ? (
                  <View style={[pm.infoRow, pm.infoRowBorder]}>
                    <Ionicons name="location-outline" size={14} color={BLUE} />
                    <Text style={pm.infoText} numberOfLines={1}>{freelancer.location}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Buttons */}
            <View style={pm.buttonRow}>
              <TouchableOpacity
                style={[pm.msgBtn, { flex: 1 }]}
                onPress={() => onMessage(freelancer._id)}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble-outline" size={16} color={WHITE} />
                <Text style={pm.msgBtnText}>Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[pm.msgBtn, { flex: 1, backgroundColor: GOLD }]}
                onPress={() => onViewUpdate(application)}
                activeOpacity={0.85}
              >
                <Ionicons name="time-outline" size={16} color={WHITE} />
                <Text style={pm.msgBtnText}>View Updates</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  title: { fontSize: 16, fontWeight: '800', color: TEXT_MAIN, flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  heroCard: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, backgroundColor: BG, borderRadius: 16, borderWidth: 1.5, borderColor: BORDER, marginBottom: 20 },
  avatarWrap: { width: 78, height: 78, borderRadius: 39, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: WHITE, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarImg: { width: 78, height: 78, borderRadius: 39 },
  avatarText: { fontSize: 26, fontWeight: '800', color: WHITE },
  name: { fontSize: 18, fontWeight: '800', color: TEXT_MAIN, marginBottom: 2, letterSpacing: -0.3, textAlign: 'center' },
  username: { fontSize: 12, color: TEXT_MUTED, marginBottom: 8 },
  experienceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BLUE + '10', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  experienceText: { fontSize: 11, color: BLUE, fontWeight: '600' },
  appliedInfo: { width: '100%', backgroundColor: BG_GRAY, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: BORDER, gap: 6 },
  appliedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appliedText: { fontSize: 12, color: TEXT_MAIN, fontWeight: '600', flex: 1 },
  appliedTimeText: { fontSize: 11, color: TEXT_LIGHT },
  budgetText: { fontSize: 13, color: GOLD_DK, fontWeight: '700' },
  section: { marginBottom: 18 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: BLUE, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  infoCard: { backgroundColor: BG_GRAY, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1.5, borderColor: BORDER },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  infoText: { fontSize: 13, color: TEXT_MAIN, flex: 1 },
  bodyText: { fontSize: 13, color: TEXT_MUTED, lineHeight: 20 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { backgroundColor: BLUE + '10', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: BLUE + '20' },
  skillText: { fontSize: 12, color: BLUE, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  msgBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 3 },
  msgBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },
});

// ── Main Component ──────────────────────────────────────────────────────────
export default function HiredFreelancers({ onNavigate }) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.applications);

  const [hiredFreelancers, setHiredFreelancers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showUpdateDetail, setShowUpdateDetail] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [contractUpdates, setContractUpdates] = useState({});
  const [activeBottomTab, setActiveBottomTab] = useState('Hiredtalents');

  // ── Handle bottom tab navigation ──────────────────────────────────────
  const handleTabPress = (key) => {
    setActiveBottomTab(key);
    if (key === 'Home') onNavigate('ClientDashboard');
    if (key === 'PostJob') onNavigate('PostJob');
    if (key === 'Hiredtalents') onNavigate('Hiredtalents');
    if (key === 'Message') onNavigate('Message');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  // ── Fetch Hired Freelancers ──────────────────────────────────────────────
  const fetchHiredFreelancers = useCallback(async () => {
    try {
      const result = await dispatch(getClientApplications({
        page: 1,
        limit: 100,
        status: 'hired',
      })).unwrap();

      const contractResult = await dispatch(getClientContracts({
        status: 'active',
      })).unwrap();

      const hired = (result.applications || []).map((app) => {
        const contract = (contractResult?.contracts || []).find(
          (c) => c.application_id === app._id || c.application_id?._id === app._id
        );

        const hiredDate = app.updatedAt || app.applied_at;
        const daysSinceHired = hiredDate
          ? Math.floor((new Date() - new Date(hiredDate)) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          ...app,
          contract: contract || null,
          daysSinceHired,
          status: contract?.status || 'active',
          progress: contract?.progress || 0,
        };
      });

      setHiredFreelancers(hired);

      for (const hiredItem of hired) {
        if (hiredItem.contract?._id) {
          try {
            const updatesResult = await dispatch(
              getContractUpdates({ contractId: hiredItem.contract._id, limit: 10 })
            ).unwrap();

            setContractUpdates((prev) => ({
              ...prev,
              [hiredItem.contract._id]: updatesResult.projectUpdates || updatesResult.updates || [],
            }));
          } catch (error) {
            console.warn('Failed to fetch updates for contract:', hiredItem.contract._id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching hired freelancers:', error);
      Alert.alert('Error', 'Failed to load hired freelancers. Please try again.');
    }
  }, [dispatch]);

  useEffect(() => {
    fetchHiredFreelancers();
  }, []);

  // ── Hardware Back Button ─────────────────────────────────────────────────
  useEffect(() => {
    const onHardwareBack = () => {
      if (showUpdateDetail) {
        setShowUpdateDetail(false);
        setSelectedUpdate(null);
        return true;
      }
      if (showProfileModal) {
        setShowProfileModal(false);
        setSelectedApplication(null);
        return true;
      }
      if (onNavigate) {
        onNavigate('ClientDashboard');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => subscription.remove();
  }, [showUpdateDetail, showProfileModal, onNavigate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHiredFreelancers();
    setRefreshing(false);
  }, [fetchHiredFreelancers]);

  // ── View Freelancer Profile ──────────────────────────────────────────────
  const handleViewProfile = (application) => {
    setSelectedApplication(application);
    setShowProfileModal(true);
  };

  // ── View Updates ──────────────────────────────────────────────────────────
  const handleViewUpdates = (application) => {
    setSelectedApplication(application);
    setShowProfileModal(false);
    if (application.contract?._id) {
      const updatesList = contractUpdates[application.contract._id] || [];
      if (updatesList.length > 0) {
        setSelectedUpdate(updatesList[0]);
        setShowUpdateDetail(true);
      } else {
        Alert.alert('No Updates', 'No project updates have been posted yet.');
      }
    } else {
      Alert.alert('No Contract', 'This freelancer does not have an active contract.');
    }
  };

  // ── Message Freelancer ──────────────────────────────────────────────────
  const handleMessageFreelancer = (freelancerId) => {
    setShowProfileModal(false);
    if (onNavigate) onNavigate('Messages', { userId: freelancerId, userRole: 'freelancer' });
  };

  // ── Filter Logic ───────────────────────────────────────────────────────────
  const filteredFreelancers = hiredFreelancers.filter((hired) => {
    const freelancer = hired.freelancer_id || {};
    const fullName = ((freelancer.first_name || '') + ' ' + (freelancer.last_name || '')).trim().toLowerCase();
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      fullName.includes(search) ||
      (freelancer.username || '').toLowerCase().includes(search) ||
      (freelancer.skills || []).some((skl) => skl.toLowerCase().includes(search)) ||
      (hired.job_id?.title || '').toLowerCase().includes(search);

    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && hired.status === selectedFilter;
  });

  // ── Render Update Item ──────────────────────────────────────────────────
  const renderUpdateItem = (update, index) => {
    const isLatest = index === 0;
    return (
      <TouchableOpacity
        key={update._id || index}
        style={[ui.updateItem, isLatest && ui.latestUpdate]}
        onPress={() => {
          setSelectedUpdate(update);
          setShowUpdateDetail(true);
        }}
        activeOpacity={0.7}
      >
        <View style={ui.updateDot}>
          <View style={[ui.updateDotInner, { backgroundColor: getStatusColor(update.status) }]} />
        </View>
        <View style={ui.updateContent}>
          <View style={ui.updateHeader}>
            <Text style={ui.updateTitle} numberOfLines={1}>{update.title}</Text>
            <View style={[ui.updateStatusBadge, { backgroundColor: getStatusColor(update.status) + '15' }]}>
              <Text style={[ui.updateStatusText, { color: getStatusColor(update.status) }]}>
                {getStatusLabel(update.status)}
              </Text>
            </View>
          </View>
          {has(update.description) ? (
            <Text style={ui.updateDesc} numberOfLines={2}>{update.description}</Text>
          ) : null}
          <View style={ui.updateMeta}>
            <Text style={ui.updateTime}>{formatRelativeTime(update.created_at)}</Text>
            <Text style={ui.updateProgress}>Progress: {update.progress ?? 0}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render Hired Card ──────────────────────────────────────────────────────
  const renderHiredCard = (hired) => {
    const freelancer = hired.freelancer_id || {};
    const firstName = freelancer.first_name || '';
    const lastName = freelancer.last_name || '';
    const fullName = (firstName + ' ' + lastName).trim() || 'Freelancer';
    const initials = (firstName.charAt(0) || '') + (lastName.charAt(0) || '');
    const jobTitle = hired.job_id?.title || 'Project';
    const updatesList = hired.contract?._id ? contractUpdates[hired.contract._id] || [] : [];

    return (
      <TouchableOpacity
        key={hired._id}
        style={hc.card}
        onPress={() => handleViewProfile(hired)}
        activeOpacity={0.85}
      >
        <View style={hc.topRow}>
          <View style={hc.avatar}>
            {has(freelancer.profile_picture) ? (
              <Image source={{ uri: freelancer.profile_picture }} style={hc.avatarImg} />
            ) : (
              <Text style={hc.avatarText}>{initials || '?'}</Text>
            )}
          </View>

          <View style={hc.nameBlock}>
            <Text style={hc.name} numberOfLines={1}>{fullName}</Text>
            <Text style={hc.role} numberOfLines={1}>{freelancer.experience_level || 'Freelancer'}</Text>
            <Text style={hc.jobTitle} numberOfLines={1}>{jobTitle}</Text>
          </View>

          <View style={hc.statusBadge}>
            <Ionicons name="checkmark-circle" size={12} color={GREEN} />
            <Text style={hc.statusText}>Hired</Text>
          </View>
        </View>

        <View style={hc.detailsRow}>
          <View style={hc.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={TEXT_LIGHT} />
            <Text style={hc.detailText}>
              Hired {formatRelativeTime(hired.updatedAt || hired.applied_at)}
            </Text>
          </View>

          {has(hired.contract?.agreed_budget?.amount) ? (
            <View style={hc.detailItem}>
              <Ionicons name="cash-outline" size={14} color={GOLD_DK} />
              <Text style={hc.budgetText}>
                {formatCurrency(hired.contract.agreed_budget.amount)}
                {hired.contract.agreed_budget.type === 'hourly' ? '/hr' : ''}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Progress Bar */}
        {hired.contract?.progress !== undefined ? (
          <View style={hc.progressContainer}>
            <View style={hc.progressHeader}>
              <Text style={hc.progressLabel}>Project Progress</Text>
              <Text style={hc.progressValue}>{hired.contract.progress}%</Text>
            </View>
            <View style={hc.progressTrack}>
              <View
                style={[
                  hc.progressFill,
                  {
                    width: hired.contract.progress + '%',
                    backgroundColor: hired.contract.progress >= 100 ? GREEN : BLUE,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}

        {/* Latest Updates */}
        {has(updatesList) ? (
          <View style={hc.updatesSection}>
            <View style={hc.updatesHeader}>
              <Ionicons name="time-outline" size={14} color={TEXT_MUTED} />
              <Text style={hc.updatesLabel}>Recent Updates</Text>
              <Text style={hc.updatesCount}>({updatesList.length})</Text>
            </View>
            {updatesList.slice(0, 2).map((update, index) => renderUpdateItem(update, index))}
            {updatesList.length > 2 ? (
              <TouchableOpacity style={hc.viewMoreBtn} onPress={() => handleViewUpdates(hired)}>
                <Text style={hc.viewMoreText}>View all {updatesList.length} updates</Text>
                <Ionicons name="chevron-forward" size={14} color={BLUE} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View style={hc.actionRow}>
          <TouchableOpacity
            style={[hc.actionBtn, { backgroundColor: BLUE + '12', borderColor: BLUE + '30' }]}
            onPress={() => handleViewProfile(hired)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={14} color={BLUE} />
            <Text style={[hc.actionText, { color: BLUE }]}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[hc.actionBtn, { backgroundColor: GOLD + '12', borderColor: GOLD + '30' }]}
            onPress={() => handleViewUpdates(hired)}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={14} color={GOLD_DK} />
            <Text style={[hc.actionText, { color: GOLD_DK }]}>Updates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[hc.actionBtn, { backgroundColor: PURPLE + '12', borderColor: PURPLE + '30' }]}
            onPress={() => handleMessageFreelancer(freelancer._id)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={14} color={PURPLE} />
            <Text style={[hc.actionText, { color: PURPLE }]}>Message</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Filter Chips ────────────────────────────────────────────────────────────
  const filterOptions = [
    { value: 'all', label: 'All', icon: 'apps-outline' },
    { value: 'active', label: 'Active', icon: 'pulse-outline' },
    { value: 'pending', label: 'Pending', icon: 'hourglass-outline' },
    { value: 'completed', label: 'Completed', icon: 'checkmark-done-outline' },
  ];

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={s.topbar}>
          <Text style={s.topbarTitle}>{'Hired '}<Text style={s.gold}>Freelancers</Text></Text>
          <View style={s.iconWrap} />
        </View>
        <View style={s.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={s.loadingText}>Loading hired freelancers…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={s.root}>

        {/* Top Bar */}
        <View style={s.topbar}>
          <Text style={s.topbarTitle}>{'Hired '}<Text style={s.gold}>Freelancers</Text></Text>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
            <View style={s.iconWrap}><Ionicons name="refresh-outline" size={20} color={WHITE} /></View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={s.searchContainer}>
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={18} color={TEXT_LIGHT} />
            <TextInput
              style={s.searchInput}
              placeholder="Search by name, skills, or project..."
              placeholderTextColor={TEXT_LIGHT}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Filter Chips */}
        <View style={s.filterWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
            {filterOptions.map((filter) => {
              const active = selectedFilter === filter.value;
              return (
                <TouchableOpacity
                  key={filter.value}
                  style={[s.filterTab, active && s.filterTabActive]}
                  onPress={() => setSelectedFilter(filter.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={filter.icon} size={13} color={active ? WHITE : TEXT_MUTED} />
                  <Text style={[s.filterTabText, active && s.filterTabTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        >
          {filteredFreelancers.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="people-outline" size={34} color={BLUE} />
              </View>
              <Text style={s.emptyTitle}>No Hired Freelancers</Text>
              <Text style={s.emptyDesc}>
                {searchQuery
                  ? 'No freelancers match your search.'
                  : selectedFilter !== 'all'
                  ? 'No ' + selectedFilter + ' freelancers found.'
                  : "You haven't hired any freelancers yet."}
              </Text>
            </View>
          ) : (
            filteredFreelancers.map(renderHiredCard)
          )}
        </ScrollView>

        {/* ── Bottom Tab Bar ── */}
        <SafeAreaView edges={['bottom']} style={s.tabSafe}>
          <View style={s.tabBar}>
            {TABS.map(tab => {
              const active = activeBottomTab === tab.key;
              const isPost = tab.key === 'PostJob';
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={s.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {active && <View style={s.tabActiveBar} />}
                  {isPost ? (
                    <View style={s.tabFab}>
                      <Ionicons name={active ? tab.icon : tab.iconOutline} size={22} color={WHITE} />
                    </View>
                  ) : (
                    <View style={s.tabIconWrap}>
                      <Ionicons
                        name={active ? tab.icon : tab.iconOutline}
                        size={23}
                        color={active ? BLUE : TEXT_LIGHT}
                      />
                    </View>
                  )}
                  <Text style={[
                    s.tabLabel,
                    active && s.tabLabelActive,
                    isPost && s.tabLabelPost,
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        application={selectedApplication}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedApplication(null);
        }}
        onMessage={handleMessageFreelancer}
        onViewUpdate={handleViewUpdates}
      />

      {/* Update Detail Modal */}
      <UpdateDetailModal
        visible={showUpdateDetail}
        update={selectedUpdate}
        onClose={() => {
          setShowUpdateDetail(false);
          setSelectedUpdate(null);
        }}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ui = StyleSheet.create({
  updateItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: BG_GRAY,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  latestUpdate: {
    backgroundColor: WHITE,
    borderColor: BLUE + '30',
    borderWidth: 1.5,
  },
  updateDot: {
    width: 20,
    alignItems: 'center',
    paddingTop: 2,
  },
  updateDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  updateContent: {
    flex: 1,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  updateTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MAIN,
    flex: 1,
  },
  updateStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  updateStatusText: {
    fontSize: 8,
    fontWeight: '700',
  },
  updateDesc: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 2,
    lineHeight: 16,
  },
  updateMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 3,
  },
  updateTime: {
    fontSize: 9,
    color: TEXT_LIGHT,
  },
  updateProgress: {
    fontSize: 9,
    color: TEXT_LIGHT,
  },
});

const hc = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { fontSize: 16, fontWeight: '700', color: WHITE },
  nameBlock: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  role: { fontSize: 11, color: TEXT_MUTED, marginBottom: 2 },
  jobTitle: { fontSize: 12, color: BLUE, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: GREEN + '30', backgroundColor: GREEN + '0D', flexShrink: 0 },
  statusText: { fontSize: 10, fontWeight: '700', color: GREEN },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 11, color: TEXT_LIGHT },
  budgetText: { fontSize: 12, fontWeight: '700', color: GOLD_DK },
  progressContainer: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600' },
  progressValue: { fontSize: 10, fontWeight: '700', color: TEXT_MAIN },
  progressTrack: { height: 5, backgroundColor: BORDER, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  updatesSection: { marginTop: 8, marginBottom: 12 },
  updatesHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  updatesLabel: { fontSize: 11, fontWeight: '600', color: TEXT_MUTED },
  updatesCount: { fontSize: 10, color: TEXT_LIGHT },
  viewMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 4 },
  viewMoreText: { fontSize: 11, color: BLUE, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1 },
  actionText: { fontSize: 11, fontWeight: '700' },
  statsContainer: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, flexWrap: 'wrap' },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, borderRadius: 12, backgroundColor: BG_GRAY, borderWidth: 1, borderColor: BORDER, minWidth: 64 },
  statIcon: { marginBottom: 4 },
  statNumber: { fontSize: 18, fontWeight: '800', color: TEXT_MAIN },
  statLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', marginTop: 2 },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: BG },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: NAVY },
  iconWrap: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { fontSize: 17, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  gold: { color: GOLD_LT, fontStyle: 'italic' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: BG, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: BORDER },
  searchInput: { flex: 1, fontSize: 13, color: TEXT_MAIN, padding: 0 },
  filterWrap: { backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  filterScroll: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD },
  filterTabActive: { backgroundColor: BLUE, borderColor: BLUE },
  filterTabText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  filterTabTextActive: { color: WHITE },
  scroll: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: 13, color: TEXT_MUTED },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, backgroundColor: BLUE + '10', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  // ── Bottom Tab Bar styles ──
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
  tabActiveBar: {
    position: 'absolute', top: 0,
    width: 24, height: 3,
    backgroundColor: BLUE, borderRadius: 999,
  },
  tabIconWrap: { position: 'relative', marginBottom: 3, marginTop: 6 },
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