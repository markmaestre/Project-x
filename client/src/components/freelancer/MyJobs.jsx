// screens/freelancer/JobManagement.js
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getFreelancerContracts,
  getContractById,
  updateContractProgress,
  updateContractStatus,
  getContractStats,
  selectFreelancerContracts,
  selectContractsLoading,
  selectSelectedContract,
  selectContractStats,
  clearContractSuccess,
} from '../../Redux/slices/contractSlice';
import {
  getContractUpdates,
  createProjectUpdate,
  updateDeliveryStatus,
  updateProjectUpdateStatus,
  selectContractUpdates,
  selectUpdatesLoading,
  selectCreateUpdateSuccess,
  selectStatusUpdateSuccess,
  selectDeliveryUpdateSuccess,
  clearUpdateSuccess,
} from '../../Redux/slices/projectUpdateSlice';

// ─────────────────────────────────────────────────────────
// DESIGN SYSTEM — Blue / Gold / White only
// A restrained, workflow / ops-console palette. All emphasis,
// hierarchy and status differentiation is carried by value
// (light/dark), weight, and structure — not extra hues.
// ─────────────────────────────────────────────────────────
const NAVY        = '#0A2247';   // primary surface (header, tab bar accents)
const NAVY_DEEP   = '#061733';   // darkest — pressed / high emphasis
const BLUE        = '#1B5FC4';   // primary action blue
const BLUE_DARK   = '#123C82';   // hover/active blue
const BLUE_LIGHT  = '#E8F0FC';   // light blue tint (backgrounds/chips)
const BLUE_LINE   = '#CBDCF4';   // blue-tinted border/divider
const GOLD        = '#B8862B';   // primary gold accent
const GOLD_DARK   = '#8C6414';   // deep gold (text-on-light)
const GOLD_LIGHT  = '#FBF1DC';   // light gold tint (backgrounds/chips)
const GOLD_LINE   = '#EAD6A6';   // gold-tinted border
const WHITE       = '#FFFFFF';
const OFFWHITE    = '#F5F7FB';   // app background, faint blue-white
const CARD        = '#FFFFFF';
const TEXT_MAIN   = '#0A2247';   // navy — primary text
const TEXT_MUTED  = '#5E718F';   // blue-grey — secondary text
const TEXT_FAINT  = '#96A6C0';   // blue-grey — tertiary/placeholder
const BORDER      = '#E1E7F2';   // neutral blue-white border
const BORDER_SOFT = '#EDF1F8';

// Status treatment — differentiated by tone/weight within the blue+gold family
const CONTRACT_STATUS = {
  active: { bg: BLUE_LIGHT, border: BLUE_LINE, text: BLUE_DARK, dot: BLUE, label: 'Active', icon: 'flash' },
  paused: { bg: OFFWHITE, border: BORDER, text: TEXT_MUTED, dot: TEXT_FAINT, label: 'Paused', icon: 'pause' },
  completed: { bg: GOLD_LIGHT, border: GOLD_LINE, text: GOLD_DARK, dot: GOLD, label: 'Completed', icon: 'checkmark-done' },
  cancelled: { bg: OFFWHITE, border: BORDER, text: TEXT_FAINT, dot: TEXT_FAINT, label: 'Cancelled', icon: 'close' },
};

const UPDATE_TYPES = {
  progress: { label: 'Progress Update', icon: 'trending-up', color: BLUE },
  milestone: { label: 'Milestone', icon: 'flag', color: GOLD_DARK },
  delivery: { label: 'Delivery', icon: 'document-text', color: BLUE_DARK },
  feedback: { label: 'Feedback', icon: 'chatbox', color: GOLD },
  announcement: { label: 'Announcement', icon: 'megaphone', color: NAVY },
};

// Helper functions
const getContractStatus = (status) =>
  CONTRACT_STATUS[status] || { bg: OFFWHITE, border: BORDER, text: TEXT_MUTED, dot: TEXT_FAINT, label: status || 'Unknown', icon: 'help' };

const formatCurrency = (amount) => {
  if (!amount) return '₱0.00';
  return `₱${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCompactCurrency = (amount) => {
  const value = Number(amount) || 0;
  if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `₱${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const timeAgo = (date) => {
  if (!date) return 'Recently';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return formatDate(date);
};

const refCode = (id) => {
  if (!id) return '——————';
  const s = String(id);
  return s.slice(-6).toUpperCase();
};

// ─────────────────────────────────────────────────────────
// Status Chip — dot + label, used across cards/detail
// ─────────────────────────────────────────────────────────
const StatusChip = ({ status, size = 'md' }) => {
  const s = getContractStatus(status);
  const isSm = size === 'sm';
  return (
    <View style={[
      chipStyles.wrap,
      { backgroundColor: s.bg, borderColor: s.border },
      isSm && chipStyles.wrapSm,
    ]}>
      <View style={[chipStyles.dot, { backgroundColor: s.dot }]} />
      <Text style={[chipStyles.text, { color: s.text }, isSm && chipStyles.textSm]}>{s.label}</Text>
    </View>
  );
};

const chipStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  wrapSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 10,
  },
});

// Meta Tag — small info tag used in card footers
const Tag = ({ icon, label }) => (
  <View style={tagStyles.wrap}>
    <Ionicons name={icon} size={11} color={TEXT_MUTED} />
    <Text style={tagStyles.text} numberOfLines={1}>{label}</Text>
  </View>
);

const tagStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: { fontSize: 11.5, fontWeight: '500', color: TEXT_MUTED },
});

// ─────────────────────────────────────────────────────────
// Header summary badge (Total Earnings)
// ─────────────────────────────────────────────────────────
const EarningsBadge = ({ amount }) => (
  <View style={summaryStyles.wrap}>
    <View style={summaryStyles.iconCircle}>
      <Ionicons name="wallet-outline" size={13} color={GOLD} />
    </View>
    <View style={summaryStyles.textWrap}>
      <Text style={summaryStyles.label}>Total Earnings</Text>
      <Text style={summaryStyles.value} numberOfLines={1}>{formatCompactCurrency(amount)}</Text>
    </View>
  </View>
);

const summaryStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(184,134,43,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: { minWidth: 0 },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
    marginTop: 1,
  },
});

// ─────────────────────────────────────────────────────────
// Overview strip — quick stats row under the header
// ─────────────────────────────────────────────────────────
const OverviewStrip = ({ total, active, completed, avgProgress }) => (
  <View style={overviewStyles.wrap}>
    <View style={overviewStyles.item}>
      <Text style={overviewStyles.num}>{total}</Text>
      <Text style={overviewStyles.label}>Total</Text>
    </View>
    <View style={overviewStyles.sep} />
    <View style={overviewStyles.item}>
      <Text style={[overviewStyles.num, { color: BLUE }]}>{active}</Text>
      <Text style={overviewStyles.label}>Active</Text>
    </View>
    <View style={overviewStyles.sep} />
    <View style={overviewStyles.item}>
      <Text style={[overviewStyles.num, { color: GOLD_DARK }]}>{completed}</Text>
      <Text style={overviewStyles.label}>Completed</Text>
    </View>
    <View style={overviewStyles.sep} />
    <View style={overviewStyles.item}>
      <Text style={overviewStyles.num}>{avgProgress}%</Text>
      <Text style={overviewStyles.label}>Avg. Progress</Text>
    </View>
  </View>
);

const overviewStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
  },
  item: { flex: 1, alignItems: 'center' },
  sep: { width: 1, height: 26, backgroundColor: BORDER },
  num: { fontSize: 17, fontWeight: '800', color: TEXT_MAIN },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: TEXT_FAINT,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 3,
  },
});

// ─────────────────────────────────────────────────────────
// Contract Card — ticket-style, left accent bar carries status
// ─────────────────────────────────────────────────────────
const ContractCard = ({ contract, onPress, onUpdateProgress }) => {
  const status = getContractStatus(contract.status);
  const progress = contract.progress || 0;
  const job = contract.job_id || {};

  const client = contract.client_id || {};
  const clientName = client.company_name ||
    `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
    'Client';

  const isCompleted = contract.status === 'completed';

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={() => onPress(contract)}
      activeOpacity={0.7}
    >
      <View style={[cardStyles.accentBar, { backgroundColor: status.dot }]} />

      <View style={cardStyles.body}>
        <View style={cardStyles.topRow}>
          <Text style={cardStyles.refCode}>REF #{refCode(contract._id)}</Text>
          <StatusChip status={contract.status} size="sm" />
        </View>

        <View style={cardStyles.header}>
          {client.profile_picture ? (
            <Image source={{ uri: client.profile_picture }} style={cardStyles.avatar} />
          ) : (
            <View style={cardStyles.logoBox}>
              <Ionicons name="briefcase" size={18} color={BLUE} />
            </View>
          )}
          <View style={cardStyles.titleContent}>
            <Text style={cardStyles.title} numberOfLines={1}>{job.title || 'Contract'}</Text>
            <View style={cardStyles.clientRow}>
              <Ionicons name="person-outline" size={12} color={TEXT_MUTED} />
              <Text style={cardStyles.clientName} numberOfLines={1}>{clientName}</Text>
            </View>
          </View>
        </View>

        <View style={cardStyles.statsRow}>
          <View style={cardStyles.statItem}>
            <Text style={cardStyles.statLabel}>Budget</Text>
            <Text style={cardStyles.statValue} numberOfLines={1}>{formatCurrency(contract.agreed_budget?.amount)}</Text>
          </View>
          <View style={cardStyles.statDivider} />
          <View style={cardStyles.statItem}>
            <Text style={cardStyles.statLabel}>Progress</Text>
            <Text style={[cardStyles.statValue, isCompleted && { color: GOLD_DARK }]}>
              {isCompleted ? '100%' : `${progress}%`}
            </Text>
          </View>
          <View style={cardStyles.statDivider} />
          <View style={cardStyles.statItem}>
            <Text style={cardStyles.statLabel}>Type</Text>
            <Text style={cardStyles.statValue} numberOfLines={1}>{job.budget?.type || 'Fixed'}</Text>
          </View>
        </View>

        <View style={cardStyles.progressContainer}>
          <View style={cardStyles.progressBar}>
            <View style={[
              cardStyles.progressFill,
              { width: `${isCompleted ? 100 : Math.min(progress, 100)}%` },
              isCompleted && { backgroundColor: GOLD },
            ]} />
          </View>
          {!isCompleted ? (
            <TouchableOpacity
              style={cardStyles.progressUpdateBtn}
              onPress={() => onUpdateProgress(contract)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add" size={16} color={WHITE} />
            </TouchableOpacity>
          ) : (
            <View style={cardStyles.doneMark}>
              <Ionicons name="checkmark" size={14} color={WHITE} />
            </View>
          )}
        </View>

        <View style={cardStyles.metaRow}>
          <Tag icon="calendar-outline" label={`Started ${formatDate(contract.start_date)}`} />
          {job.category ? <Tag icon="pricetag-outline" label={job.category} /> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accentBar: { width: 4 },
  body: { flex: 1, padding: 14, paddingLeft: 13 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  refCode: {
    fontSize: 10.5,
    fontWeight: '700',
    color: TEXT_FAINT,
    letterSpacing: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: BORDER,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: BLUE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleContent: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_MAIN,
    lineHeight: 19,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clientName: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '500',
    flexShrink: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OFFWHITE,
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  statItem: { flex: 1, alignItems: 'center', minWidth: 0, paddingHorizontal: 4 },
  statLabel: {
    fontSize: 9,
    color: TEXT_FAINT,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  statValue: { fontSize: 13.5, fontWeight: '700', color: TEXT_MAIN },
  statDivider: { width: 1, height: 26, backgroundColor: BORDER },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: OFFWHITE,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  progressFill: {
    height: '100%',
    backgroundColor: BLUE,
    borderRadius: 3,
  },
  progressUpdateBtn: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneMark: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
});

// ─────────────────────────────────────────────────────────
// Update Card (activity log entry)
// ─────────────────────────────────────────────────────────
const UpdateCard = ({ update, onPress, onStatusChange }) => {
  const updateType = UPDATE_TYPES[update.update_type] || UPDATE_TYPES.progress;

  return (
    <TouchableOpacity style={updateCardStyles.card} onPress={() => onPress(update)} activeOpacity={0.7}>
      <View style={updateCardStyles.header}>
        <View style={[updateCardStyles.typeIcon, { backgroundColor: `${updateType.color}16` }]}>
          <Ionicons name={updateType.icon} size={15} color={updateType.color} />
        </View>
        <View style={updateCardStyles.typeContent}>
          <Text style={updateCardStyles.typeLabel} numberOfLines={1}>{updateType.label}</Text>
          <Text style={updateCardStyles.updateTime}>{timeAgo(update.created_at)}</Text>
        </View>
        {update.delivery_status === 'submitted' && (
          <View style={updateCardStyles.pendingBadge}>
            <Text style={updateCardStyles.pendingText}>Pending</Text>
          </View>
        )}
        {update.status === 'completed' && (
          <View style={updateCardStyles.doneBadge}>
            <Ionicons name="checkmark" size={12} color={WHITE} />
          </View>
        )}
      </View>

      <Text style={updateCardStyles.title} numberOfLines={2}>{update.title}</Text>
      {update.description ? (
        <Text style={updateCardStyles.description} numberOfLines={2}>{update.description}</Text>
      ) : null}

      {update.progress !== undefined && update.progress !== null && (
        <View style={updateCardStyles.progressSection}>
          <Text style={updateCardStyles.progressLabel}>Progress</Text>
          <View style={updateCardStyles.progressBar}>
            <View style={[updateCardStyles.progressFill, { width: `${Math.min(update.progress, 100)}%` }]} />
          </View>
          <Text style={updateCardStyles.progressValue}>{update.progress}%</Text>
        </View>
      )}

      {update.delivery_status === 'submitted' && onStatusChange && (
        <View style={updateCardStyles.actionRow}>
          <TouchableOpacity
            style={[updateCardStyles.actionBtn, updateCardStyles.approveBtn]}
            onPress={() => onStatusChange(update._id, 'approved')}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={14} color={WHITE} />
            <Text style={updateCardStyles.actionBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[updateCardStyles.actionBtn, updateCardStyles.rejectBtn]}
            onPress={() => onStatusChange(update._id, 'revision_requested')}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={14} color={BLUE_DARK} />
            <Text style={[updateCardStyles.actionBtnText, { color: BLUE_DARK }]}>Revise</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const updateCardStyles = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    borderRadius: 10,
    padding: 13,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 9,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  typeIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  typeContent: { flex: 1, minWidth: 0 },
  typeLabel: { fontSize: 12, fontWeight: '700', color: TEXT_MAIN },
  updateTime: { fontSize: 10, color: TEXT_FAINT, marginTop: 1 },
  pendingBadge: {
    backgroundColor: GOLD_LIGHT,
    borderWidth: 1,
    borderColor: GOLD_LINE,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexShrink: 0,
  },
  pendingText: { fontSize: 9, fontWeight: '700', color: GOLD_DARK },
  doneBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 13.5, fontWeight: '700', color: TEXT_MAIN, marginBottom: 4, lineHeight: 18 },
  description: { fontSize: 12.5, color: TEXT_MUTED, lineHeight: 18, marginBottom: 6 },
  progressSection: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: OFFWHITE, paddingVertical: 8, paddingHorizontal: 10,
    borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: BORDER_SOFT,
  },
  progressLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600' },
  progressBar: { flex: 1, height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: BLUE, borderRadius: 2 },
  progressValue: { fontSize: 11, fontWeight: '700', color: TEXT_MAIN, minWidth: 32, textAlign: 'right' },
  actionRow: {
    flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: BORDER_SOFT,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: 8,
  },
  approveBtn: { backgroundColor: BLUE },
  rejectBtn: { backgroundColor: BLUE_LIGHT, borderWidth: 1, borderColor: BLUE_LINE },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: WHITE },
});

// ─────────────────────────────────────────────────────────
// Progress Update Modal
// ─────────────────────────────────────────────────────────
const ProgressUpdateModal = ({ visible, contract, onClose, onSubmit, isLoading }) => {
  const [progress, setProgress] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [updateType, setUpdateType] = useState('progress');

  useEffect(() => {
    if (visible && contract) {
      setProgress(String(contract.progress || 0));
      setTitle(`Progress Update - ${contract.job_id?.title || 'Contract'}`);
      setDescription('');
      setUpdateType('progress');
    }
  }, [visible, contract]);

  const handleSubmit = () => {
    const progressNum = parseInt(progress, 10);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      Alert.alert('Invalid Progress', 'Please enter a valid progress value (0-100)');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please provide a title for this update.');
      return;
    }
    onSubmit({
      progress: progressNum,
      title: title.trim(),
      description: description.trim(),
      updateType: updateType,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={modalStyles.sheetContainer}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Update Progress</Text>
              <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={19} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={modalStyles.form}>
                <View style={modalStyles.contractInfo}>
                  <Text style={modalStyles.contractTitle} numberOfLines={2}>
                    {contract?.job_id?.title || 'Contract'}
                  </Text>
                  <Text style={modalStyles.clientName}>
                    {contract?.client_id?.company_name ||
                      `${contract?.client_id?.first_name || ''} ${contract?.client_id?.last_name || ''}`.trim() ||
                      'Client'}
                  </Text>
                </View>

                <Text style={modalStyles.label}>Progress (%)</Text>
                <View style={modalStyles.progressInputContainer}>
                  <TextInput
                    style={modalStyles.progressInput}
                    value={progress}
                    onChangeText={setProgress}
                    keyboardType="numeric"
                    placeholder="0-100"
                    placeholderTextColor={TEXT_FAINT}
                    maxLength={3}
                  />
                  <Text style={modalStyles.progressPercent}>%</Text>
                </View>

                <Text style={modalStyles.label}>Update Type</Text>
                <View style={modalStyles.typeRow}>
                  {['progress', 'milestone', 'delivery', 'feedback'].map((type) => {
                    const info = UPDATE_TYPES[type];
                    const isSelected = updateType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          modalStyles.typeBtn,
                          isSelected && { backgroundColor: `${info.color}14`, borderColor: info.color },
                        ]}
                        onPress={() => setUpdateType(type)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name={info.icon} size={13} color={isSelected ? info.color : TEXT_FAINT} />
                        <Text style={[modalStyles.typeBtnText, isSelected && { color: info.color }]}>
                          {info.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={modalStyles.label}>Title</Text>
                <TextInput
                  style={modalStyles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Update title..."
                  placeholderTextColor={TEXT_FAINT}
                />

                <Text style={modalStyles.label}>Description</Text>
                <TextInput
                  style={modalStyles.textArea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your progress..."
                  placeholderTextColor={TEXT_FAINT}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[modalStyles.submitBtn, isLoading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={WHITE} size="small" />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={15} color={WHITE} />
                      <Text style={modalStyles.submitBtnText}>Submit Update</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,34,71,0.5)', justifyContent: 'flex-end' },
  sheetContainer: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  title: { fontSize: 16.5, fontWeight: '800', color: TEXT_MAIN },
  closeBtn: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: OFFWHITE,
    alignItems: 'center', justifyContent: 'center',
  },
  form: { paddingTop: 16 },
  contractInfo: { marginBottom: 16 },
  label: {
    fontSize: 11.5, fontWeight: '700', color: TEXT_MUTED,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 7, marginTop: 14,
  },
  contractTitle: { fontSize: 16, fontWeight: '800', color: TEXT_MAIN, marginBottom: 2 },
  clientName: { fontSize: 13, color: TEXT_MUTED },
  progressInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12,
  },
  progressInput: { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: '700', color: TEXT_MAIN },
  progressPercent: { fontSize: 16, fontWeight: '700', color: TEXT_MUTED, paddingRight: 4 },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: BORDER, backgroundColor: OFFWHITE,
  },
  typeBtnText: { fontSize: 11, fontWeight: '600', color: TEXT_MUTED },
  titleInput: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, padding: 12, fontSize: 14, color: TEXT_MAIN },
  textArea: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, padding: 12,
    minHeight: 100, fontSize: 13, color: TEXT_MAIN, textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: BLUE, paddingVertical: 15, borderRadius: 12, marginTop: 20, marginBottom: 12,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },
});

// ─────────────────────────────────────────────────────────
// Contract Detail Modal
// ─────────────────────────────────────────────────────────
const ContractDetailModal = ({
  contract, visible, onClose, updates, onUpdateProgress, onStatusChange, onUpdatePress, isLoading,
}) => {
  if (!contract) return null;

  const progress = contract.progress || 0;
  const job = contract.job_id || {};
  const client = job.client_id || {};
  const clientName = client.company_name ||
    `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
    'Client';

  const isCompleted = contract.status === 'completed';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { maxHeight: '92%' }]}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Contract Details</Text>
            <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={19} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={detailStyles.loadingBar}>
              <ActivityIndicator size="small" color={BLUE} />
              <Text style={detailStyles.loadingBarText}>Loading contract...</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={detailStyles.hero}>
              <View style={detailStyles.heroTopRow}>
                <Text style={detailStyles.refCode}>REF #{refCode(contract._id)}</Text>
                <StatusChip status={contract.status} />
              </View>

              <View style={detailStyles.heroMain}>
                {client.profile_picture ? (
                  <Image source={{ uri: client.profile_picture }} style={detailStyles.heroImage} />
                ) : (
                  <View style={detailStyles.heroIcon}>
                    <Ionicons name="person" size={24} color={WHITE} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={detailStyles.heroTitle} numberOfLines={2}>{job.title || 'Contract'}</Text>
                  <View style={detailStyles.heroClientRow}>
                    <Ionicons name="person-outline" size={12} color={TEXT_MUTED} />
                    <Text style={detailStyles.heroClient} numberOfLines={1}>{clientName}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={detailStyles.statsGrid}>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>Budget</Text>
                <Text style={detailStyles.statValue} numberOfLines={1}>{formatCurrency(contract.agreed_budget?.amount)}</Text>
              </View>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>Progress</Text>
                <Text style={[detailStyles.statValue, isCompleted && { color: GOLD_DARK }]}>
                  {isCompleted ? '100%' : `${progress}%`}
                </Text>
              </View>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>Updates</Text>
                <Text style={detailStyles.statValue}>{updates.length}</Text>
              </View>
            </View>

            {job.description ? (
              <View style={detailStyles.section}>
                <Text style={detailStyles.sectionTitle}>Description</Text>
                <Text style={detailStyles.descriptionText}>{job.description}</Text>
              </View>
            ) : null}

            {job.required_skills && job.required_skills.length > 0 && (
              <View style={detailStyles.section}>
                <Text style={detailStyles.sectionTitle}>Skills</Text>
                <View style={detailStyles.skillsRow}>
                  {job.required_skills.slice(0, 8).map((skill, index) => (
                    <View key={index} style={detailStyles.skillTag}>
                      <Text style={detailStyles.skillText}>{skill}</Text>
                    </View>
                  ))}
                  {job.required_skills.length > 8 && (
                    <Text style={detailStyles.moreSkills}>+{job.required_skills.length - 8} more</Text>
                  )}
                </View>
              </View>
            )}

            <View style={detailStyles.section}>
              <Text style={detailStyles.sectionTitle}>Timeline</Text>
              <View style={detailStyles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color={TEXT_FAINT} />
                <Text style={detailStyles.infoText}>Started: {formatDate(contract.start_date)}</Text>
              </View>
              {contract.end_date && (
                <View style={detailStyles.infoRow}>
                  <Ionicons name="calendar-outline" size={14} color={TEXT_FAINT} />
                  <Text style={detailStyles.infoText}>Ends: {formatDate(contract.end_date)}</Text>
                </View>
              )}
            </View>

            <View style={detailStyles.section}>
              <Text style={detailStyles.sectionTitle}>Recent Updates</Text>
              {updates.length === 0 ? (
                <View style={detailStyles.emptyUpdates}>
                  <Ionicons name="chatbubble-outline" size={22} color={TEXT_FAINT} />
                  <Text style={detailStyles.emptyText}>No updates yet</Text>
                </View>
              ) : (
                updates.slice(0, 10).map((update) => (
                  <UpdateCard
                    key={update._id}
                    update={update}
                    onPress={() => onUpdatePress(update)}
                    onStatusChange={!isCompleted && contract.status === 'active' ? onStatusChange : null}
                  />
                ))
              )}
            </View>

            {!isCompleted && contract.status === 'active' && (
              <View style={detailStyles.actionRow}>
                <TouchableOpacity
                  style={detailStyles.updateBtn}
                  onPress={() => { onClose(); onUpdateProgress(contract); }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="trending-up-outline" size={16} color={WHITE} />
                  <Text style={detailStyles.updateBtnText}>Update Progress</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const detailStyles = StyleSheet.create({
  loadingBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  loadingBarText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  hero: {
    paddingVertical: 16, paddingHorizontal: 16, backgroundColor: OFFWHITE,
    borderRadius: 14, borderWidth: 1, borderColor: BORDER, marginTop: 16, marginBottom: 16,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  refCode: { fontSize: 11, fontWeight: '700', color: TEXT_FAINT, letterSpacing: 0.6 },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroImage: { width: 56, height: 56, borderRadius: 13, borderWidth: 1, borderColor: BORDER },
  heroIcon: { width: 56, height: 56, borderRadius: 13, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 16.5, fontWeight: '800', color: TEXT_MAIN, marginBottom: 4 },
  heroClientRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroClient: { fontSize: 13, color: TEXT_MUTED },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: OFFWHITE, borderRadius: 10, paddingVertical: 14,
    paddingHorizontal: 6, alignItems: 'center', borderWidth: 1, borderColor: BORDER,
  },
  statLabel: {
    fontSize: 9, color: TEXT_FAINT, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: TEXT_MAIN },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12.5, fontWeight: '800', color: TEXT_MAIN,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10,
  },
  descriptionText: { fontSize: 13, color: TEXT_MUTED, lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  infoText: { fontSize: 13, color: TEXT_MUTED },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: {
    backgroundColor: BLUE_LIGHT, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 7, borderWidth: 1, borderColor: BLUE_LINE,
  },
  skillText: { fontSize: 11, color: BLUE_DARK, fontWeight: '600' },
  moreSkills: { fontSize: 11, color: TEXT_FAINT, alignSelf: 'center' },
  emptyUpdates: {
    alignItems: 'center', paddingVertical: 28, backgroundColor: OFFWHITE,
    borderRadius: 12, borderWidth: 1, borderColor: BORDER,
  },
  emptyText: { fontSize: 13, color: TEXT_FAINT, marginTop: 8 },
  actionRow: { marginTop: 8, marginBottom: 24 },
  updateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: BLUE, paddingVertical: 15, borderRadius: 12,
  },
  updateBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },
});

// ─────────────────────────────────────────────────────────
// Bottom Tab Bar
// ─────────────────────────────────────────────────────────
function BottomTabBar({ activeTab, onTabPress }) {
  const tabs = [
    { key: 'FreelancerDashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'Messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { key: 'MyJobs', label: 'My Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
    { key: 'MyApplications', label: 'Applications', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' },
    { key: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={tabStyles.tabSafe}>
      <View style={tabStyles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isMyJobs = tab.key === 'MyJobs';

          return (
            <TouchableOpacity
              key={tab.key}
              style={[tabStyles.tabItem, isMyJobs && tabStyles.tabItemCenter]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              {isMyJobs ? (
                <View style={[tabStyles.centerButton, isActive && tabStyles.centerButtonActive]}>
                  <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={23} color={isActive ? WHITE : NAVY} />
                </View>
              ) : (
                <>
                  <View style={tabStyles.tabIconWrap}>
                    <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={21} color={isActive ? BLUE : TEXT_FAINT} />
                  </View>
                  <Text style={[tabStyles.tabLabel, isActive && tabStyles.tabLabelActive]}>{tab.label}</Text>
                  {isActive && <View style={tabStyles.tabIndicator} />}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const tabStyles = StyleSheet.create({
  tabSafe: { backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER },
  tabBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: 8, paddingBottom: 12, paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, position: 'relative' },
  tabItemCenter: { flex: 0, marginHorizontal: 8, marginTop: -14 },
  centerButton: {
    width: 48, height: 48, borderRadius: 13, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: GOLD_LINE,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  centerButtonActive: { backgroundColor: BLUE, borderColor: BLUE },
  tabIconWrap: { position: 'relative', marginBottom: 4 },
  tabLabel: { fontSize: 10, color: TEXT_FAINT, fontWeight: '500', marginTop: 2 },
  tabLabelActive: { color: BLUE, fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: -8, width: 20, height: 3, borderRadius: 1.5, backgroundColor: GOLD },
});

// ─────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────
export default function JobManagement({ navigation, route, onNavigate: propNavigate }) {
  const dispatch = useDispatch();

  const contracts = useSelector(selectFreelancerContracts) || [];
  const contractsLoading = useSelector(selectContractsLoading) || false;
  const contractStats = useSelector(selectContractStats) || {};
  const updates = useSelector(selectContractUpdates) || [];
  const updatesLoading = useSelector(selectUpdatesLoading) || false;
  const createSuccess = useSelector(selectCreateUpdateSuccess) || false;
  const statusUpdateSuccess = useSelector(selectStatusUpdateSuccess) || false;
  const deliveryUpdateSuccess = useSelector(selectDeliveryUpdateSuccess) || false;

  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContractForUpdate, setSelectedContractForUpdate] = useState(null);
  const [selectedContractForDetail, setSelectedContractForDetail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = useMemo(() => {
    const total = contracts?.length || 0;
    const active = contracts?.filter(c => c.status === 'active').length || 0;
    const completed = contracts?.filter(c => c.status === 'completed').length || 0;
    const totalBudget = contracts?.reduce((sum, c) => sum + (c.agreed_budget?.amount || 0), 0) || 0;
    const avgProgress = contracts?.length > 0
      ? Math.round(contracts.reduce((sum, c) => sum + (c.progress || 0), 0) / contracts.length)
      : 0;
    return { total, active, completed, totalBudget, avgProgress };
  }, [contracts]);

  const handleNavigate = (screen, params) => {
    if (propNavigate && typeof propNavigate === 'function') {
      propNavigate(screen, params);
      return;
    }
    if (navigation && navigation.navigate && typeof navigation.navigate === 'function') {
      navigation.navigate(screen, params);
      return;
    }
    if (route?.params?.onNavigate && typeof route.params.onNavigate === 'function') {
      route.params.onNavigate(screen, params);
      return;
    }
    console.warn('Navigation not available for:', screen);
    Alert.alert('Navigation Error', 'Unable to navigate to ' + screen);
  };

  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getFreelancerContracts({})).unwrap(),
        dispatch(getContractStats()).unwrap(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [dispatch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (createSuccess || statusUpdateSuccess || deliveryUpdateSuccess) {
      fetchData();
      dispatch(clearUpdateSuccess());
      dispatch(clearContractSuccess());
    }
  }, [createSuccess, statusUpdateSuccess, deliveryUpdateSuccess, dispatch, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filteredContracts = useMemo(() => {
    if (statusFilter === 'all') return contracts || [];
    return (contracts || []).filter(c => c.status === statusFilter);
  }, [contracts, statusFilter]);

  const handleContractPress = async (contract) => {
    setSelectedContractForDetail(contract);
    setShowDetailModal(true);
    try {
      await dispatch(getContractById(contract._id)).unwrap();
      await dispatch(getContractUpdates({ contractId: contract._id, page: 1, limit: 50 })).unwrap();
    } catch (error) {
      console.error('Error fetching contract details:', error);
      Alert.alert('Error', 'Failed to load contract details');
    }
  };

  const handleUpdateProgress = (contract) => {
    setSelectedContractForUpdate(contract);
    setShowProgressModal(true);
  };

  const handleSubmitUpdate = async (data) => {
    if (!selectedContractForUpdate) return;

    setIsSubmitting(true);
    try {
      let jobId = selectedContractForUpdate.job_id;
      if (jobId && typeof jobId === 'object' && jobId._id) jobId = jobId._id;
      if (!jobId && selectedContractForUpdate.job) jobId = selectedContractForUpdate.job;

      await dispatch(updateContractProgress({
        contractId: selectedContractForUpdate._id,
        progress: data.progress,
      })).unwrap();

      const updatePayload = {
        contract_id: selectedContractForUpdate._id,
        job_id: jobId,
        title: data.title,
        description: data.description || '',
        update_type: data.updateType || 'progress',
        progress: data.progress,
        status: 'in_progress',
        delivery_status: 'submitted',
      };

      await dispatch(createProjectUpdate(updatePayload)).unwrap();

      Alert.alert('Success', 'Progress update submitted successfully!');
      setShowProgressModal(false);
      setSelectedContractForUpdate(null);
      await fetchData();
    } catch (error) {
      console.error('Submit update error:', error);
      Alert.alert('Error', error.message || 'Failed to submit update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliveryStatusChange = async (updateId, status) => {
    Alert.alert(
      status === 'approved' ? 'Approve Update' : 'Request Changes',
      status === 'approved' ? 'Approve this update and mark it as complete?' : 'Request changes to this update?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'approved' ? 'Approve' : 'Request Changes',
          style: status === 'approved' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await dispatch(updateDeliveryStatus({
                updateId,
                delivery_status: status === 'approved' ? 'approved' : 'revision_requested',
              })).unwrap();

              if (status === 'approved') {
                await dispatch(updateProjectUpdateStatus({ updateId, status: 'completed' })).unwrap();
              }

              Alert.alert('Success', status === 'approved' ? 'Update approved!' : 'Changes requested.');
              await fetchData();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const handleTabBarPress = (key) => {
    const returnState = { activeTab: 'MyJobs' };
    if (key === 'FreelancerDashboard') {
      handleNavigate('FreelancerDashboard', { returnState });
    } else if (key === 'Messages') {
      handleNavigate('Messages', { returnState });
    } else if (key === 'MyJobs') {
      fetchData();
    } else if (key === 'Profile') {
      handleNavigate('FreelancerProfile', { returnState });
    } else if (key === 'MyApplications') {
      handleNavigate('MyApplications', { returnState });
    } else {
      console.warn('No screen mapping for tab:', key);
    }
  };

  const handleBack = () => {
    if (navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (propNavigate) {
      propNavigate('FreelancerDashboard', { activeTab: 'MyJobs' });
    } else if (route?.params?.onNavigate) {
      route.params.onNavigate('FreelancerDashboard', { activeTab: 'MyJobs' });
    } else {
      handleNavigate('FreelancerDashboard', { activeTab: 'MyJobs' });
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showProgressModal) {
        setShowProgressModal(false);
        setSelectedContractForUpdate(null);
        return true;
      }
      if (showDetailModal) {
        setShowDetailModal(false);
        setSelectedContractForDetail(null);
        return true;
      }
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [showProgressModal, showDetailModal]);

  const statusTabs = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'active', label: 'Active', count: stats.active },
    { key: 'completed', label: 'Completed', count: stats.completed },
  ];

  if (contractsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.root}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>My <Text style={styles.gold}>Jobs</Text></Text>
              <EarningsBadge amount={stats.totalBudget} />
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => Alert.alert('Coming Soon', 'Analytics will be available in the next update.')}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="stats-chart-outline" size={17} color={WHITE} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.loadingText}>Loading your contracts...</Text>
          </View>
        </View>
        <BottomTabBar activeTab="MyJobs" onTabPress={handleTabBarPress} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>My <Text style={styles.gold}>Jobs</Text></Text>
            <EarningsBadge amount={stats.totalBudget} />
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => Alert.alert('Coming Soon', 'Analytics will be available in the next update.')}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="stats-chart-outline" size={17} color={WHITE} />
            </View>
          </TouchableOpacity>
        </View>

        <OverviewStrip
          total={stats.total}
          active={stats.active}
          completed={stats.completed}
          avgProgress={stats.avgProgress}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
          {statusTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, statusFilter === tab.key && styles.filterTabActive]}
              onPress={() => setStatusFilter(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, statusFilter === tab.key && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.filterBadge, statusFilter === tab.key && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, statusFilter === tab.key && styles.filterBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        >
          {filteredContracts.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="briefcase-outline" size={32} color={TEXT_FAINT} />
              </View>
              <Text style={styles.emptyTitle}>
                {statusFilter === 'all' ? 'No contracts yet' : `No ${statusFilter} contracts`}
              </Text>
              <Text style={styles.emptyDesc}>
                {statusFilter === 'all'
                  ? "Contracts will appear here once you've been hired for a job."
                  : 'Try selecting a different filter.'}
              </Text>
            </View>
          ) : (
            filteredContracts.map(contract => (
              <ContractCard
                key={contract._id}
                contract={contract}
                onPress={handleContractPress}
                onUpdateProgress={handleUpdateProgress}
              />
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      <BottomTabBar activeTab="MyJobs" onTabPress={handleTabBarPress} />

      <ProgressUpdateModal
        visible={showProgressModal}
        contract={selectedContractForUpdate}
        onClose={() => { setShowProgressModal(false); setSelectedContractForUpdate(null); }}
        onSubmit={handleSubmitUpdate}
        isLoading={isSubmitting}
      />

      <ContractDetailModal
        contract={selectedContractForDetail}
        visible={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedContractForDetail(null); }}
        updates={updates || []}
        onUpdateProgress={handleUpdateProgress}
        onStatusChange={handleDeliveryStatusChange}
        onUpdatePress={(update) => {
          Alert.alert(
            update.title || 'Update Details',
            `${update.description || 'No description'}\n\nStatus: ${update.status || 'N/A'}\nDelivery: ${update.delivery_status || 'N/A'}`
          );
        }}
        isLoading={updatesLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: OFFWHITE },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: NAVY,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1, minWidth: 0 },
  iconBtn: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconWrap: {
    width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: 0.2 },
  gold: { color: GOLD, fontWeight: '800' },

  filterTabs: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
  },
  filterTabActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterTabText: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED },
  filterTabTextActive: { color: WHITE },
  filterBadge: { backgroundColor: BORDER, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  filterBadgeActive: { backgroundColor: GOLD },
  filterBadgeText: { fontSize: 9, fontWeight: '700', color: TEXT_MUTED },
  filterBadgeTextActive: { color: NAVY },

  list: { padding: 16, paddingTop: 4, paddingBottom: 80 },

  centerLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: OFFWHITE },
  loadingText: { marginTop: 12, fontSize: 13, color: TEXT_MUTED },

  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 16, backgroundColor: CARD,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: BORDER,
  },
  emptyTitle: { fontSize: 16.5, fontWeight: '800', color: TEXT_MAIN, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: TEXT_FAINT, textAlign: 'center', lineHeight: 20 },
});