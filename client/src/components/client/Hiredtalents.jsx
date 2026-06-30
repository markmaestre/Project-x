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
  Platform,
  Animated,
  TextInput,  // ← ADD THIS
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  getClientApplications,
  updateApplicationStatus,
  clearApplicationError,
  clearApplicationSuccess,
} from '../../Redux/slices/applicationSlice';

import {
  getClientContracts,
  updateContractStatus,
  clearContractError,
  clearContractSuccess,
} from '../../Redux/slices/contractSlice';

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
const PURPLE     = '#7C3AED';
const PINK       = '#EC4899';

// Status tracking for hired freelancers
const HIRED_STATUSES = [
  { value: 'active', label: 'Active', color: GREEN, icon: 'checkmark-circle' },
  { value: 'pending', label: 'Pending', color: ORANGE, icon: 'time-outline' },
  { value: 'completed', label: 'Completed', color: BLUE, icon: 'checkmark-done-circle' },
  { value: 'terminated', label: 'Terminated', color: RED, icon: 'close-circle' },
];

const getHiredStatusInfo = (status) => 
  HIRED_STATUSES.find(s => s.value === status) || HIRED_STATUSES[0];

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

// ── Status Update Modal ──────────────────────────────────────────────────────
const StatusUpdateModal = ({ visible, freelancer, currentStatus, onClose, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || 'active');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    { value: 'active', label: 'Active', color: GREEN, icon: 'checkmark-circle', description: 'Freelancer is actively working' },
    { value: 'pending', label: 'Pending', color: ORANGE, icon: 'time-outline', description: 'Awaiting confirmation or action' },
    { value: 'completed', label: 'Completed', color: BLUE, icon: 'checkmark-done-circle', description: 'Project successfully completed' },
    { value: 'terminated', label: 'Terminated', color: RED, icon: 'close-circle', description: 'Contract has been terminated' },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onUpdate(selectedStatus, notes);
      setSubmitting(false);
      onClose();
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={sum.overlay}>
        <View style={sum.sheet}>
          <View style={sum.handle} />
          
          <View style={sum.header}>
            <Text style={sum.title}>Update Status</Text>
            <TouchableOpacity style={sum.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={sum.scrollContent}>
            {freelancer && (
              <View style={sum.freelancerCard}>
                <View style={sum.avatarWrap}>
                  {freelancer.profile_picture ? (
                    <Image source={{ uri: freelancer.profile_picture }} style={sum.avatar} />
                  ) : (
                    <Text style={sum.avatarText}>
                      {(freelancer.first_name || '')[0]}{(freelancer.last_name || '')[0]}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={sum.freelancerName}>
                    {freelancer.first_name || ''} {freelancer.last_name || ''}
                  </Text>
                  <Text style={sum.freelancerRole}>{freelancer.experience_level || 'Freelancer'}</Text>
                </View>
              </View>
            )}

            <Text style={sum.sectionLabel}>Select New Status</Text>

            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  sum.statusOption,
                  selectedStatus === option.value && sum.statusOptionActive,
                  { borderColor: selectedStatus === option.value ? option.color : BORDER }
                ]}
                onPress={() => setSelectedStatus(option.value)}
                activeOpacity={0.7}
              >
                <View style={[sum.statusDot, { backgroundColor: option.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[sum.statusLabel, selectedStatus === option.value && { color: option.color }]}>
                    {option.label}
                  </Text>
                  <Text style={sum.statusDesc}>{option.description}</Text>
                </View>
                {selectedStatus === option.value && (
                  <Ionicons name="checkmark-circle" size={22} color={option.color} />
                )}
              </TouchableOpacity>
            ))}

            <View style={sum.notesField}>
              <Text style={sum.notesLabel}>Notes (Optional)</Text>
              <TextInput
                style={sum.notesInput}
                placeholder="Add notes about this status update..."
                placeholderTextColor={TEXT_LIGHT}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[sum.submitBtn, submitting && sum.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={WHITE} />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle-outline" size={20} color={WHITE} />
                  <Text style={sum.submitText}>Update Status</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const sum = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  title: { fontSize: 16, fontWeight: '800', color: TEXT_MAIN, flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  scrollContent: { padding: 16, paddingBottom: 32 },
  freelancerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: BG, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1.5, borderColor: BORDER },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 16, fontWeight: '700', color: WHITE },
  freelancerName: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  freelancerRole: { fontSize: 11, color: TEXT_MUTED },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 2, marginBottom: 10, backgroundColor: BG },
  statusOptionActive: { backgroundColor: WHITE, borderWidth: 2 },
  statusDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  statusLabel: { fontSize: 14, fontWeight: '600', color: TEXT_MAIN },
  statusDesc: { fontSize: 11, color: TEXT_LIGHT, marginTop: 2 },
  notesField: { marginTop: 16, marginBottom: 20 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginBottom: 6 },
  notesInput: { backgroundColor: BG, borderRadius: 11, padding: 12, fontSize: 13, color: TEXT_MAIN, borderWidth: 1.5, borderColor: BORDER, minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 4 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 14, fontWeight: '700', color: WHITE },
});

// ── Profile Modal ────────────────────────────────────────────────────────────
const ProfileModal = ({ visible, application, onClose, onMessage, onNavigate }) => {
  if (!application) return null;
  
  const freelancer = application.freelancer_id || {};
  const firstName = freelancer.first_name || '';
  const lastName = freelancer.last_name || '';
  const fullName = (firstName + ' ' + lastName).trim() || 'Freelancer';
  const initials = (firstName.charAt(0) || '') + (lastName.charAt(0) || '');
  const statusInfo = getHiredStatusInfo(application.status);

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
                {freelancer.profile_picture ? (
                  <Image source={{ uri: freelancer.profile_picture }} style={pm.avatarImg} />
                ) : (
                  <Text style={pm.avatarText}>{initials || '?'}</Text>
                )}
              </View>
              <Text style={pm.name}>{fullName}</Text>
              <Text style={pm.username}>{'@' + (freelancer.username || '')}</Text>
              
              <View style={[pm.statusBadge, { backgroundColor: statusInfo.color + '15', borderColor: statusInfo.color + '30' }]}>
                <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
                <Text style={[pm.statusText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>

              <View style={pm.appliedInfo}>
                <View style={pm.appliedRow}>
                  <Ionicons name="briefcase-outline" size={14} color={BLUE} />
                  <Text style={pm.appliedText} numberOfLines={1}>
                    {application.job_id?.title || 'Project'}
                  </Text>
                </View>
                <View style={pm.appliedRow}>
                  <Ionicons name="calendar-outline" size={14} color={TEXT_LIGHT} />
                  <Text style={pm.appliedTimeText}>
                    Hired {formatRelativeTime(application.updatedAt || application.applied_at)}
                  </Text>
                </View>
                {application.contract?.agreed_budget?.amount && (
                  <View style={pm.appliedRow}>
                    <Ionicons name="cash-outline" size={14} color={GOLD_DK} />
                    <Text style={pm.budgetText}>
                      {formatCurrency(application.contract.agreed_budget.amount)}
                      {application.contract.agreed_budget.type === 'hourly' ? '/hr' : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Skills */}
            {freelancer.skills && freelancer.skills.length > 0 && (
              <View style={pm.section}>
                <Text style={pm.sectionLabel}>Skills</Text>
                <View style={pm.skillsWrap}>
                  {freelancer.skills.map((sk, i) => (
                    <View key={i} style={pm.skillChip}>
                      <Text style={pm.skillText}>{sk}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Contact */}
            <View style={pm.section}>
              <Text style={pm.sectionLabel}>Contact Information</Text>
              <View style={pm.infoCard}>
                {freelancer.email_address && (
                  <View style={pm.infoRow}>
                    <Ionicons name="mail-outline" size={14} color={BLUE} />
                    <Text style={pm.infoText} numberOfLines={1}>{freelancer.email_address}</Text>
                  </View>
                )}
                {freelancer.phone_number && (
                  <View style={[pm.infoRow, pm.infoRowBorder]}>
                    <Ionicons name="call-outline" size={14} color={BLUE} />
                    <Text style={pm.infoText} numberOfLines={1}>{freelancer.phone_number}</Text>
                  </View>
                )}
                {freelancer.location && (
                  <View style={[pm.infoRow, pm.infoRowBorder]}>
                    <Ionicons name="location-outline" size={14} color={BLUE} />
                    <Text style={pm.infoText} numberOfLines={1}>{freelancer.location}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* About */}
            {freelancer.bio_about_me && (
              <View style={pm.section}>
                <Text style={pm.sectionLabel}>About</Text>
                <View style={pm.infoCard}>
                  <Text style={pm.bodyText}>{freelancer.bio_about_me}</Text>
                </View>
              </View>
            )}

            {/* Message Button */}
            <TouchableOpacity 
              style={pm.msgBtn} 
              onPress={() => onMessage(freelancer._id)}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-outline" size={16} color={WHITE} />
              <Text style={pm.msgBtnText}>Message Freelancer</Text>
            </TouchableOpacity>
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
  username: { fontSize: 12, color: TEXT_MUTED, marginBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
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
  msgBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, marginTop: 16, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 3 },
  msgBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },
});

// ── Main Component ──────────────────────────────────────────────────────────
export default function HiredFreelancers({ onNavigate }) {
  const dispatch = useDispatch();
  const { applications, isLoading } = useSelector((s) => s.applications);
  const { contracts, isLoading: contractsLoading } = useSelector((s) => s.contracts);

  const [hiredFreelancers, setHiredFreelancers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Fetch Hired Freelancers ──────────────────────────────────────────────
  const fetchHiredFreelancers = useCallback(async () => {
    try {
      // Fetch all applications with status 'hired'
      const result = await dispatch(getClientApplications({ 
        page: 1, 
        limit: 100,
        status: 'hired'
      })).unwrap();

      // Fetch contracts for these applications
      const contractResult = await dispatch(getClientContracts({ 
        status: 'active'
      })).unwrap();

      // Map applications with their contracts
      const hired = result.applications.map(app => {
        const contract = contractResult?.contracts?.find(c => 
          c.application_id === app._id || 
          c.application_id?._id === app._id
        );
        
        // Calculate days since hired
        const hiredDate = app.updatedAt || app.applied_at;
        const daysSinceHired = hiredDate ? 
          Math.floor((new Date() - new Date(hiredDate)) / (1000 * 60 * 60 * 24)) : 0;

        return {
          ...app,
          contract: contract || null,
          daysSinceHired,
          status: contract?.status || 'active',
          progress: contract?.progress || 0,
          milestones: contract?.milestones || [],
        };
      });

      setHiredFreelancers(hired);
    } catch (error) {
      console.error('Error fetching hired freelancers:', error);
      Alert.alert('Error', 'Failed to load hired freelancers. Please try again.');
    }
  }, [dispatch]);

  useEffect(() => {
    fetchHiredFreelancers();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHiredFreelancers();
    setRefreshing(false);
  }, [fetchHiredFreelancers]);

  // ── Handle Status Update ──────────────────────────────────────────────────
  const handleUpdateStatus = async (applicationId, newStatus, notes) => {
    setActionLoading(applicationId);
    try {
      // Update the application status
      await dispatch(updateApplicationStatus({
        applicationId,
        status: newStatus,
        notes,
      })).unwrap();

      // If there's a contract, update it too
      const freelancer = hiredFreelancers.find(h => h._id === applicationId);
      if (freelancer?.contract?._id) {
        await dispatch(updateContractStatus({
          contractId: freelancer.contract._id,
          status: newStatus,
          notes,
        })).unwrap();
      }

      await fetchHiredFreelancers();
      Alert.alert('Success', `Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── View Freelancer Profile ──────────────────────────────────────────────
  const handleViewProfile = (application) => {
    setSelectedApplicant(application.freelancer_id);
    setSelectedApplication(application);
    setShowProfileModal(true);
  };

  // ── Message Freelancer ──────────────────────────────────────────────────
  const handleMessageFreelancer = (freelancerId) => {
    setShowProfileModal(false);
    if (onNavigate) onNavigate('Messages', { userId: freelancerId, userRole: 'freelancer' });
  };

  // ── Filter Logic ───────────────────────────────────────────────────────────
  const filteredFreelancers = hiredFreelancers.filter(hired => {
    const freelancer = hired.freelancer_id || {};
    const fullName = (freelancer.first_name || '' + ' ' + freelancer.last_name || '').trim().toLowerCase();
    const search = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(search) || 
                         (freelancer.username || '').toLowerCase().includes(search) ||
                         (freelancer.skills || []).some(s => s.toLowerCase().includes(search));

    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && hired.status === selectedFilter;
  });

  // ── Render Hired Card ──────────────────────────────────────────────────────
  const renderHiredCard = (hired) => {
    const freelancer = hired.freelancer_id || {};
    const firstName = freelancer.first_name || '';
    const lastName = freelancer.last_name || '';
    const fullName = (firstName + ' ' + lastName).trim() || 'Freelancer';
    const initials = (firstName.charAt(0) || '') + (lastName.charAt(0) || '');
    const statusInfo = getHiredStatusInfo(hired.status);
    const jobTitle = hired.job_id?.title || 'Project';
    
    const isUpdating = actionLoading === hired._id;

    return (
      <TouchableOpacity 
        key={hired._id} 
        style={hc.card} 
        onPress={() => handleViewProfile(hired)}
        activeOpacity={0.7}
      >
        <View style={hc.topRow}>
          <View style={hc.avatar}>
            {freelancer.profile_picture ? (
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

          <View style={[hc.statusBadge, { backgroundColor: statusInfo.color + '15', borderColor: statusInfo.color + '30' }]}>
            <Ionicons name={statusInfo.icon} size={10} color={statusInfo.color} />
            <Text style={[hc.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={hc.detailsRow}>
          <View style={hc.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={TEXT_LIGHT} />
            <Text style={hc.detailText}>
              Hired {formatRelativeTime(hired.updatedAt || hired.applied_at)}
            </Text>
          </View>
          
          {hired.contract?.agreed_budget?.amount && (
            <View style={hc.detailItem}>
              <Ionicons name="cash-outline" size={14} color={GOLD_DK} />
              <Text style={hc.budgetText}>
                {formatCurrency(hired.contract.agreed_budget.amount)}
                {hired.contract.agreed_budget.type === 'hourly' ? '/hr' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {hired.contract?.progress !== undefined && (
          <View style={hc.progressContainer}>
            <View style={hc.progressHeader}>
              <Text style={hc.progressLabel}>Progress</Text>
              <Text style={hc.progressValue}>{hired.contract.progress}%</Text>
            </View>
            <View style={hc.progressTrack}>
              <View 
                style={[
                  hc.progressFill, 
                  { 
                    width: hired.contract.progress + '%',
                    backgroundColor: hired.contract.progress >= 100 ? GREEN : BLUE
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Milestones Preview */}
        {hired.milestones && hired.milestones.length > 0 && (
          <View style={hc.milestonesPreview}>
            <Ionicons name="flag-outline" size={14} color={TEXT_LIGHT} />
            <Text style={hc.milestoneText}>
              {hired.milestones.filter(m => m.completed).length} / {hired.milestones.length} milestones completed
            </Text>
          </View>
        )}

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
            style={[hc.actionBtn, { backgroundColor: GREEN + '12', borderColor: GREEN + '30' }]}
            onPress={() => {
              setSelectedFreelancer(hired);
              setShowStatusModal(true);
            }}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={GREEN} />
            ) : (
              <>
                <Ionicons name="swap-horizontal-outline" size={14} color={GREEN} />
                <Text style={[hc.actionText, { color: GREEN }]}>Update Status</Text>
              </>
            )}
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

  // ── Render Stats ────────────────────────────────────────────────────────────
  const renderStats = () => {
    const total = hiredFreelancers.length;
    const active = hiredFreelancers.filter(h => h.status === 'active').length;
    const pending = hiredFreelancers.filter(h => h.status === 'pending').length;
    const completed = hiredFreelancers.filter(h => h.status === 'completed').length;
    const terminated = hiredFreelancers.filter(h => h.status === 'terminated').length;

    return (
      <View style={hc.statsContainer}>
        <View style={hc.statCard}>
          <Text style={hc.statNumber}>{total}</Text>
          <Text style={hc.statLabel}>Total Hired</Text>
        </View>
        <View style={[hc.statCard, { backgroundColor: GREEN + '10', borderColor: GREEN + '20' }]}>
          <Text style={[hc.statNumber, { color: GREEN }]}>{active}</Text>
          <Text style={hc.statLabel}>Active</Text>
        </View>
        <View style={[hc.statCard, { backgroundColor: ORANGE + '10', borderColor: ORANGE + '20' }]}>
          <Text style={[hc.statNumber, { color: ORANGE }]}>{pending}</Text>
          <Text style={hc.statLabel}>Pending</Text>
        </View>
        <View style={[hc.statCard, { backgroundColor: BLUE + '10', borderColor: BLUE + '20' }]}>
          <Text style={[hc.statNumber, { color: BLUE }]}>{completed}</Text>
          <Text style={hc.statLabel}>Completed</Text>
        </View>
      </View>
    );
  };

  // ── Filter Chips ────────────────────────────────────────────────────────────
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'terminated', label: 'Terminated' },
  ];

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => onNavigate && onNavigate('ClientDashboard')} activeOpacity={0.7}>
            <View style={s.iconWrap}><Ionicons name="arrow-back" size={18} color={WHITE} /></View>
          </TouchableOpacity>
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
          <TouchableOpacity onPress={() => onNavigate && onNavigate('ClientDashboard')} activeOpacity={0.7}>
            <View style={s.iconWrap}><Ionicons name="arrow-back" size={18} color={WHITE} /></View>
          </TouchableOpacity>
          <Text style={s.topbarTitle}>{'Hired '}<Text style={s.gold}>Freelancers</Text></Text>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
            <View style={s.iconWrap}><Ionicons name="refresh-outline" size={20} color={WHITE} /></View>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {hiredFreelancers.length > 0 && renderStats()}

        {/* Search Bar */}
        <View style={s.searchContainer}>
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={18} color={TEXT_LIGHT} />
            <TextInput
              style={s.searchInput}
              placeholder="Search by name, skills..."
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
                  <Text style={[s.filterTabText, active && s.filterTabTextActive]}>
                    {filter.label}
                  </Text>
                  {active && (
                    <View style={s.filterActiveDot} />
                  )}
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
      </View>

      {/* Status Update Modal */}
      <StatusUpdateModal
        visible={showStatusModal}
        freelancer={selectedFreelancer?.freelancer_id}
        currentStatus={selectedFreelancer?.status}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedFreelancer(null);
        }}
        onUpdate={(newStatus, notes) => {
          if (selectedFreelancer) {
            return handleUpdateStatus(selectedFreelancer._id, newStatus, notes);
          }
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        application={selectedApplication}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedApplication(null);
          setSelectedApplicant(null);
        }}
        onMessage={handleMessageFreelancer}
        onNavigate={onNavigate}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const hc = StyleSheet.create({
  card: { 
    backgroundColor: CARD, 
    borderRadius: 14, 
    padding: 14, 
    borderWidth: 1.5, 
    borderColor: BORDER, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarImg: { width: 46, height: 46, borderRadius: 23 },
  avatarText: { fontSize: 15, fontWeight: '700', color: WHITE },
  nameBlock: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  role: { fontSize: 11, color: TEXT_MUTED, marginBottom: 2 },
  jobTitle: { fontSize: 12, color: BLUE, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexShrink: 0 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10, flexWrap: 'wrap' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 11, color: TEXT_LIGHT },
  budgetText: { fontSize: 12, fontWeight: '700', color: GOLD_DK },
  progressContainer: { marginBottom: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600' },
  progressValue: { fontSize: 10, fontWeight: '700', color: TEXT_MAIN },
  progressTrack: { height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  milestonesPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  milestoneText: { fontSize: 11, color: TEXT_MUTED },
  actionRow: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1.5, borderTopColor: BORDER },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1.5 },
  actionText: { fontSize: 11, fontWeight: '700' },
  statsContainer: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: CARD, borderBottomWidth: 1.5, borderBottomColor: BORDER, flexWrap: 'wrap' },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, backgroundColor: BG_GRAY, borderWidth: 1.5, borderColor: BORDER, minWidth: 60 },
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
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: CARD, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: BG, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: BORDER },
  searchInput: { flex: 1, fontSize: 13, color: TEXT_MAIN, padding: 0 },
  filterWrap: { backgroundColor: CARD, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  filterScroll: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: CARD },
  filterTabActive: { backgroundColor: BLUE, borderColor: BLUE },
  filterTabText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  filterTabTextActive: { color: WHITE },
  filterActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: WHITE },
  scroll: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: 13, color: TEXT_MUTED },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, backgroundColor: BLUE + '10', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
});