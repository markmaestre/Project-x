// screens/freelancer/JobManagement.js
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

// Design tokens
const NAVY = '#071A3E';
const NAVY2 = '#0D2151';
const BLUE = '#0055A5';
const BLUE_MD = '#0073CF';
const BLUE_LT = '#1E90FF';
const GOLD = '#C89520';
const GOLD_LT = '#E8B84B';
const GOLD_DK = '#8A6410';
const SILVER = '#8899B0';
const SILVER2 = '#B8C8D8';
const WHITE = '#FFFFFF';
const BG = '#F0F4FA';
const CARD = '#FFFFFF';
const TEXT_MAIN = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER = '#DCE4EC';
const GREEN = '#059669';
const GREEN_SOFT = '#D1FAE5';
const GREEN_MID = '#86EFAC';
const GREEN_DARK = '#059669';
const BG_GRAY = '#F8FAFC';
const RED = '#DC2626';
const RED_SOFT = '#FEF2F2';
const ORANGE = '#F59E0B';
const ORANGE_SOFT = '#FEF3C7';

// Status configurations
const CONTRACT_STATUS = {
  active: { bg: GREEN_SOFT, text: GREEN, label: 'Active', icon: 'checkmark-circle' },
  paused: { bg: ORANGE_SOFT, text: ORANGE, label: 'Paused', icon: 'pause-circle' },
  completed: { bg: GREEN_SOFT, text: GREEN, label: 'Completed', icon: 'checkmark-done-circle' },
  cancelled: { bg: RED_SOFT, text: RED, label: 'Cancelled', icon: 'close-circle' },
};

const UPDATE_TYPES = {
  progress: { label: 'Progress Update', icon: 'trending-up', color: BLUE },
  milestone: { label: 'Milestone', icon: 'flag', color: GOLD_DK },
  delivery: { label: 'Delivery', icon: 'document', color: GREEN },
  feedback: { label: 'Feedback', icon: 'chatbox', color: ORANGE },
  announcement: { label: 'Announcement', icon: 'megaphone', color: BLUE_MD },
};

// Helper functions
const getContractStatus = (status) =>
  CONTRACT_STATUS[status] || { bg: BG_GRAY, text: TEXT_MUTED, label: status || 'Unknown', icon: 'help-circle' };

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

// Pill Component
const Pill = ({ icon, label, color = TEXT_MUTED, bg = BG_GRAY }) => (
  <View style={[pillStyles.wrap, { backgroundColor: bg }]}>
    <Ionicons name={icon} size={11} color={color} />
    <Text style={[pillStyles.text, { color }]} numberOfLines={1}>{label}</Text>
  </View>
);

const pillStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  text: { fontSize: 11, fontWeight: '500' },
});

// Earnings Badge — compact, professional summary of total earnings, shown in the header
const EarningsBadge = ({ amount }) => (
  <View style={summaryStyles.wrap}>
    <View style={summaryStyles.iconCircle}>
      <Ionicons name="cash-outline" size={13} color={GOLD_LT} />
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
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(232,184,75,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    minWidth: 0,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: SILVER2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
    marginTop: 1,
  },
});

// Completion Celebration Component
const CompletionCelebration = ({ contract, onClose }) => {
  const job = contract?.job_id || {};

  return (
    <Modal transparent animationType="fade" visible={true} onRequestClose={onClose}>
      <View style={celebrationStyles.overlay}>
        <View style={celebrationStyles.container}>
          <View style={celebrationStyles.iconContainer}>
            <View style={celebrationStyles.iconCircle}>
              <Ionicons name="checkmark-done-circle" size={56} color={GREEN} />
            </View>
          </View>

          <Text style={celebrationStyles.title}>Contract Completed</Text>
          <Text style={celebrationStyles.subtitle}>You've successfully wrapped up</Text>
          <Text style={celebrationStyles.jobTitle} numberOfLines={2}>"{job.title || 'the job'}"</Text>

          <View style={celebrationStyles.divider} />

          <View style={celebrationStyles.details}>
            <View style={celebrationStyles.detailRow}>
              <View style={celebrationStyles.detailIconWrap}>
                <Ionicons name="cash-outline" size={16} color={BLUE} />
              </View>
              <Text style={celebrationStyles.detailLabel}>Earned</Text>
              <Text style={celebrationStyles.detailValue}>
                {formatCurrency(contract?.agreed_budget?.amount)}
              </Text>
            </View>
            <View style={celebrationStyles.detailRow}>
              <View style={celebrationStyles.detailIconWrap}>
                <Ionicons name="time-outline" size={16} color={BLUE} />
              </View>
              <Text style={celebrationStyles.detailLabel}>Completed</Text>
              <Text style={celebrationStyles.detailValue}>
                {formatDate(contract?.updated_at)}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={celebrationStyles.button} onPress={onClose} activeOpacity={0.85}>
            <Text style={celebrationStyles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const celebrationStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,26,62,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: GREEN_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_MAIN,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 4,
    textAlign: 'center',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BLUE,
    marginBottom: 16,
    textAlign: 'center',
  },
  divider: {
    width: 48,
    height: 3,
    backgroundColor: GOLD,
    borderRadius: 2,
    marginBottom: 16,
  },
  details: {
    width: '100%',
    gap: 8,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BG_GRAY,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  detailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: `${BLUE}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: TEXT_MAIN,
    fontWeight: '700',
  },
  button: {
    backgroundColor: BLUE,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});

// Contract Card
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
      style={[cardStyles.card, isCompleted && cardStyles.cardCompleted]}
      onPress={() => onPress(contract)}
      activeOpacity={0.7}
    >
      <View style={cardStyles.header}>
        <View style={cardStyles.titleSection}>
          {client.profile_picture ? (
            <Image
              source={{ uri: client.profile_picture }}
              style={cardStyles.avatar}
            />
          ) : (
            <View style={[cardStyles.logoBox, isCompleted && cardStyles.logoBoxCompleted]}>
              <Ionicons name="briefcase-outline" size={20} color={isCompleted ? GREEN : BLUE} />
            </View>
          )}
          <View style={cardStyles.titleContent}>
            <Text style={[cardStyles.title, isCompleted && cardStyles.titleCompleted]} numberOfLines={1}>
              {job.title || 'Contract'}
            </Text>
            <View style={cardStyles.clientRow}>
              <Ionicons name="person-outline" size={12} color={TEXT_MUTED} />
              <Text style={cardStyles.clientName} numberOfLines={1}>{clientName}</Text>
            </View>
          </View>
        </View>
        <View style={[cardStyles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={10} color={status.text} />
          <Text style={[cardStyles.statusText, { color: status.text }]}>{status.label}</Text>
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
          <Text style={[cardStyles.statValue, isCompleted && { color: GREEN }]}>
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
        <View style={[cardStyles.progressBar, isCompleted && cardStyles.progressBarCompleted]}>
          <View style={[
            cardStyles.progressFill,
            { width: `${isCompleted ? 100 : Math.min(progress, 100)}%` },
            isCompleted && cardStyles.progressFillCompleted,
          ]} />
        </View>
        {!isCompleted && (
          <TouchableOpacity
            style={cardStyles.progressUpdateBtn}
            onPress={() => onUpdateProgress(contract)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add-circle-outline" size={20} color={BLUE} />
          </TouchableOpacity>
        )}
        {isCompleted && (
          <View style={cardStyles.completedBadge}>
            <Ionicons name="checkmark-circle" size={18} color={GREEN} />
          </View>
        )}
      </View>

      <View style={cardStyles.metaRow}>
        <Pill icon="calendar-outline" label={`Started ${formatDate(contract.start_date)}`} />
        {job.category && (
          <Pill icon="pricetag-outline" label={job.category} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompleted: {
    borderColor: GREEN_MID,
    backgroundColor: '#FAFFFE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,104,181,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(0,104,181,0.15)',
  },
  logoBoxCompleted: {
    backgroundColor: GREEN_SOFT,
    borderColor: GREEN,
  },
  titleContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_MAIN,
    lineHeight: 20,
  },
  titleCompleted: {
    color: GREEN_DARK,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 0,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 9,
    color: TEXT_LIGHT,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: BORDER,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: BG_GRAY,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  progressBarCompleted: {
    backgroundColor: GREEN_SOFT,
    borderColor: GREEN,
  },
  progressFill: {
    height: '100%',
    backgroundColor: BLUE,
    borderRadius: 4,
  },
  progressFillCompleted: {
    backgroundColor: GREEN,
  },
  progressUpdateBtn: {
    padding: 2,
  },
  completedBadge: {
    padding: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});

// Update Card
const UpdateCard = ({ update, onPress, onStatusChange }) => {
  const updateType = UPDATE_TYPES[update.update_type] || UPDATE_TYPES.progress;

  return (
    <TouchableOpacity
      style={updateCardStyles.card}
      onPress={() => onPress(update)}
      activeOpacity={0.7}
    >
      <View style={updateCardStyles.header}>
        <View style={[updateCardStyles.typeIcon, { backgroundColor: `${updateType.color}15` }]}>
          <Ionicons name={updateType.icon} size={16} color={updateType.color} />
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
          <Ionicons name="checkmark-circle" size={18} color={GREEN} />
        )}
      </View>

      <Text style={updateCardStyles.title} numberOfLines={2}>{update.title}</Text>
      {update.description && (
        <Text style={updateCardStyles.description} numberOfLines={2}>
          {update.description}
        </Text>
      )}

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
            <Ionicons name="close" size={14} color={WHITE} />
            <Text style={updateCardStyles.actionBtnText}>Revise</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const updateCardStyles = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typeContent: {
    flex: 1,
    minWidth: 0,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  updateTime: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginTop: 1,
  },
  pendingBadge: {
    backgroundColor: ORANGE_SOFT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  pendingText: {
    fontSize: 9,
    fontWeight: '700',
    color: ORANGE,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 4,
    lineHeight: 19,
  },
  description: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
    marginBottom: 6,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BG_GRAY,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  progressLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BLUE,
    borderRadius: 2,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MAIN,
    minWidth: 32,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveBtn: {
    backgroundColor: GREEN,
  },
  rejectBtn: {
    backgroundColor: RED,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: WHITE,
  },
});

// Progress Update Modal
const ProgressUpdateModal = ({
  visible,
  contract,
  onClose,
  onSubmit,
  isLoading,
}) => {
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={modalStyles.sheetContainer}
        >
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Update Progress</Text>
              <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color={TEXT_MUTED} />
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
                    placeholderTextColor={TEXT_LIGHT}
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
                          isSelected && { backgroundColor: `${info.color}15`, borderColor: info.color },
                        ]}
                        onPress={() => setUpdateType(type)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={info.icon}
                          size={14}
                          color={isSelected ? info.color : TEXT_LIGHT}
                        />
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
                  placeholderTextColor={TEXT_LIGHT}
                />

                <Text style={modalStyles.label}>Description</Text>
                <TextInput
                  style={modalStyles.textArea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your progress..."
                  placeholderTextColor={TEXT_LIGHT}
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
                      <Ionicons name="send-outline" size={16} color={WHITE} />
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,26,62,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    paddingTop: 16,
  },
  contractInfo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 6,
    marginTop: 12,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  progressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  progressInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MUTED,
    paddingRight: 4,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG_GRAY,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  titleInput: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: TEXT_MAIN,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 13,
    color: TEXT_MAIN,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BLUE,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 12,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
});

// Contract Detail Modal
const ContractDetailModal = ({
  contract,
  visible,
  onClose,
  updates,
  onUpdateProgress,
  onStatusChange,
  onUpdatePress,
  isLoading,
}) => {
  if (!contract) return null;

  const status = getContractStatus(contract.status);
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
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={detailStyles.loadingBar}>
              <ActivityIndicator size="small" color={BLUE} />
              <Text style={detailStyles.loadingBarText}>Loading contract...</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[detailStyles.hero, isCompleted && detailStyles.heroCompleted]}>
              {client.profile_picture ? (
                <Image
                  source={{ uri: client.profile_picture }}
                  style={detailStyles.heroImage}
                />
              ) : (
                <View style={[detailStyles.heroIcon, isCompleted && detailStyles.heroIconCompleted]}>
                  <Ionicons name="person" size={28} color={WHITE} />
                </View>
              )}
              <Text style={[detailStyles.heroTitle, isCompleted && detailStyles.heroTitleCompleted]} numberOfLines={2}>
                {job.title || 'Contract'}
              </Text>
              <View style={detailStyles.heroClientRow}>
                <Ionicons name="person-outline" size={12} color={TEXT_MUTED} />
                <Text style={detailStyles.heroClient}>{clientName}</Text>
              </View>
              {isCompleted && (
                <View style={detailStyles.completedBadge}>
                  <Ionicons name="checkmark-done-circle" size={16} color={GREEN} />
                  <Text style={detailStyles.completedText}>Completed</Text>
                </View>
              )}
              <View style={[detailStyles.statusBadge, { backgroundColor: status.bg }]}>
                <Ionicons name={status.icon} size={12} color={status.text} />
                <Text style={[detailStyles.statusText, { color: status.text }]}>{status.label}</Text>
              </View>
            </View>

            <View style={detailStyles.statsGrid}>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>Budget</Text>
                <Text style={detailStyles.statValue} numberOfLines={1}>{formatCurrency(contract.agreed_budget?.amount)}</Text>
              </View>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>Progress</Text>
                <Text style={[detailStyles.statValue, isCompleted && { color: GREEN }]}>
                  {isCompleted ? '100%' : `${progress}%`}
                </Text>
              </View>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>Updates</Text>
                <Text style={detailStyles.statValue}>{updates.length}</Text>
              </View>
            </View>

            {job.description && (
              <View style={detailStyles.section}>
                <Text style={detailStyles.sectionTitle}>Description</Text>
                <Text style={detailStyles.descriptionText}>{job.description}</Text>
              </View>
            )}

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
                <Ionicons name="calendar-outline" size={14} color={TEXT_LIGHT} />
                <Text style={detailStyles.infoText}>Started: {formatDate(contract.start_date)}</Text>
              </View>
              {contract.end_date && (
                <View style={detailStyles.infoRow}>
                  <Ionicons name="calendar-outline" size={14} color={TEXT_LIGHT} />
                  <Text style={detailStyles.infoText}>Ends: {formatDate(contract.end_date)}</Text>
                </View>
              )}
            </View>

            <View style={detailStyles.section}>
              <Text style={detailStyles.sectionTitle}>Recent Updates</Text>
              {updates.length === 0 ? (
                <View style={detailStyles.emptyUpdates}>
                  <Ionicons name="chatbubble-outline" size={24} color={TEXT_LIGHT} />
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
                  onPress={() => {
                    onClose();
                    onUpdateProgress(contract);
                  }}
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
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingBarText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: BG_GRAY,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 16,
    marginBottom: 16,
  },
  heroCompleted: {
    backgroundColor: GREEN_SOFT,
    borderColor: GREEN,
  },
  heroImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: WHITE,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroIconCompleted: {
    backgroundColor: GREEN,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroTitleCompleted: {
    color: GREEN_DARK,
  },
  heroClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  heroClient: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  statLabel: {
    fontSize: 9,
    color: TEXT_LIGHT,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: 'rgba(0,104,181,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0,104,181,0.15)',
  },
  skillText: {
    fontSize: 11,
    color: BLUE,
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 11,
    color: TEXT_LIGHT,
    alignSelf: 'center',
  },
  emptyUpdates: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    marginTop: 8,
  },
  actionRow: {
    marginTop: 8,
    marginBottom: 24,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BLUE,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  updateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
});

// Bottom Tab Bar
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
              style={[
                tabStyles.tabItem,
                isMyJobs && tabStyles.tabItemCenter,
              ]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              {isMyJobs ? (
                <View style={[tabStyles.centerButton, isActive && tabStyles.centerButtonActive]}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={26}
                    color={isActive ? WHITE : BLUE}
                  />
                </View>
              ) : (
                <>
                  <View style={tabStyles.tabIconWrap}>
                    <Ionicons
                      name={isActive ? tab.activeIcon : tab.icon}
                      size={22}
                      color={isActive ? BLUE : TEXT_LIGHT}
                    />
                  </View>
                  <Text style={[tabStyles.tabLabel, isActive && tabStyles.tabLabelActive]}>
                    {tab.label}
                  </Text>
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
  tabSafe: {
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabItemCenter: {
    flex: 0,
    marginHorizontal: 8,
    marginTop: -16,
  },
  centerButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2.5,
    borderColor: WHITE,
  },
  centerButtonActive: {
    backgroundColor: BLUE,
    transform: [{ scale: 1.02 }],
  },
  tabIconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: BLUE,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: BLUE,
  },
});

// MAIN SCREEN
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedContract, setCompletedContract] = useState(null);
  const [selectedContractForUpdate, setSelectedContractForUpdate] = useState(null);
  const [selectedContractForDetail, setSelectedContractForDetail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contracts whose "just completed" celebration has already been shown
  // during this session, so the modal only ever fires ONCE per contract per
  // visit to this screen (kept in memory only — no external storage dependency).
  const [celebratedContracts, setCelebratedContracts] = useState(new Set());

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

  // Navigation handler
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (createSuccess || statusUpdateSuccess || deliveryUpdateSuccess) {
      fetchData();
      dispatch(clearUpdateSuccess());
      dispatch(clearContractSuccess());
    }
  }, [createSuccess, statusUpdateSuccess, deliveryUpdateSuccess, dispatch, fetchData]);

  // Check for newly completed contracts and mark them as celebrated so the
  // modal doesn't fire again for the same contract on subsequent refreshes.
  useEffect(() => {
    if (contracts && contracts.length > 0) {
      const justCompleted = contracts.find(c =>
        c.status === 'completed' &&
        c.progress === 100 &&
        !celebratedContracts.has(c._id)
      );

      if (justCompleted) {
        setCompletedContract(justCompleted);
        setShowCelebration(true);
        setCelebratedContracts(prev => new Set(prev).add(justCompleted._id));
      }
    }
  }, [contracts, celebratedContracts]);

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
      await dispatch(getContractUpdates({
        contractId: contract._id,
        page: 1,
        limit: 50,
      })).unwrap();
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

      if (jobId && typeof jobId === 'object' && jobId._id) {
        jobId = jobId._id;
      }
      if (!jobId && selectedContractForUpdate.job) {
        jobId = selectedContractForUpdate.job;
      }

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
      status === 'approved'
        ? 'Approve this update and mark it as complete?'
        : 'Request changes to this update?',
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
                await dispatch(updateProjectUpdateStatus({
                  updateId,
                  status: 'completed',
                })).unwrap();
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
      if (showCelebration) {
        setShowCelebration(false);
        setCompletedContract(null);
        return true;
      }
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
  }, [showCelebration, showProgressModal, showDetailModal]);

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
              <Text style={styles.headerTitle}>My <Text style={styles.blue}>Jobs</Text></Text>
              <EarningsBadge amount={stats.totalBudget} />
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                Alert.alert('Coming Soon', 'Analytics will be available in the next update.');
              }}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="analytics-outline" size={18} color={WHITE} />
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
            <Text style={styles.headerTitle}>My <Text style={styles.blue}>Jobs</Text></Text>
            <EarningsBadge amount={stats.totalBudget} />
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              Alert.alert('Coming Soon', 'Analytics will be available in the next update.');
            }}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="analytics-outline" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        >
          {statusTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                statusFilter === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setStatusFilter(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.filterTabText,
                statusFilter === tab.key && styles.filterTabTextActive,
              ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[
                  styles.filterBadge,
                  statusFilter === tab.key && styles.filterBadgeActive,
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    statusFilter === tab.key && styles.filterBadgeTextActive,
                  ]}>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BLUE}
            />
          }
        >
          {filteredContracts.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="briefcase-outline" size={36} color={TEXT_LIGHT} />
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
        onClose={() => {
          setShowProgressModal(false);
          setSelectedContractForUpdate(null);
        }}
        onSubmit={handleSubmitUpdate}
        isLoading={isSubmitting}
      />

      <ContractDetailModal
        contract={selectedContractForDetail}
        visible={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedContractForDetail(null);
        }}
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

      {showCelebration && completedContract && (
        <CompletionCelebration
          contract={completedContract}
          onClose={() => {
            setShowCelebration(false);
            setCompletedContract(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: NAVY,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
    minWidth: 0,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.2,
  },
  blue: { color: GOLD_LT, fontWeight: '700' },

  filterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterTabActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  filterTabTextActive: {
    color: WHITE,
  },
  filterBadge: {
    backgroundColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  filterBadgeTextActive: {
    color: WHITE,
  },

  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 80,
  },

  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: TEXT_MUTED,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },
});