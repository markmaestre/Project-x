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
const BG = '#EEF4FA';
const CARD = '#FFFFFF';
const TEXT_MAIN = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER = '#C8D8E8';
const GREEN = '#059669';
const GREEN_SOFT = '#D1FAE5';
const GREEN_MID = '#86EFAC';
const GREEN_DARK = '#059669';
const BG_GRAY = '#F9FAFB';
const RED = '#DC2626';
const RED_SOFT = '#FEF2F2';
const ORANGE = '#F59E0B';
const ORANGE_SOFT = '#FEF3C7';

// Status configurations
const CONTRACT_STATUS = {
  active: { bg: GREEN_SOFT, text: GREEN, label: 'Active', icon: 'checkmark-circle' },
  paused: { bg: ORANGE_SOFT, text: ORANGE, label: 'Paused', icon: 'pause-circle' },
  completed: { bg: BG_GRAY, text: TEXT_MUTED, label: 'Completed', icon: 'checkmark-done-circle' },
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
    <Text style={[pillStyles.text, { color }]}>{label}</Text>
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
    borderColor: BORDER
  },
  text: { fontSize: 11, fontWeight: '500' },
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

  return (
    <TouchableOpacity
      style={cardStyles.card}
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
            <View style={cardStyles.logoBox}>
              <Ionicons name="briefcase-outline" size={20} color={BLUE} />
            </View>
          )}
          <View style={cardStyles.titleContent}>
            <Text style={cardStyles.title} numberOfLines={1}>{job.title || 'Contract'}</Text>
            <View style={cardStyles.clientRow}>
              <Ionicons name="person-outline" size={12} color={TEXT_MUTED} />
              <Text style={cardStyles.clientName}>{clientName}</Text>
            </View>
            {job.description && (
              <Text style={cardStyles.jobDescription} numberOfLines={2}>
                {job.description}
              </Text>
            )}
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
          <Text style={cardStyles.statValue}>{formatCurrency(contract.agreed_budget?.amount)}</Text>
        </View>
        <View style={cardStyles.statDivider} />
        <View style={cardStyles.statItem}>
          <Text style={cardStyles.statLabel}>Progress</Text>
          <Text style={cardStyles.statValue}>{progress}%</Text>
        </View>
        <View style={cardStyles.statDivider} />
        <View style={cardStyles.statItem}>
          <Text style={cardStyles.statLabel}>Type</Text>
          <Text style={cardStyles.statValue}>{job.budget?.type || 'Fixed'}</Text>
        </View>
      </View>

      <View style={cardStyles.progressContainer}>
        <View style={cardStyles.progressBar}>
          <View style={[cardStyles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <TouchableOpacity
          style={cardStyles.progressUpdateBtn}
          onPress={() => onUpdateProgress(contract)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={18} color={BLUE} />
        </TouchableOpacity>
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
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0,104,181,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(0,104,181,0.2)',
  },
  titleContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
    lineHeight: 20,
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
  },
  jobDescription: {
    fontSize: 11,
    color: TEXT_LIGHT,
    marginTop: 2,
    lineHeight: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
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
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: TEXT_LIGHT,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: BORDER,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: BORDER,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BLUE,
    borderRadius: 3,
  },
  progressUpdateBtn: {
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
  const hasAttachments = update.attachments && update.attachments.length > 0;

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
          <Text style={updateCardStyles.typeLabel}>{updateType.label}</Text>
          <Text style={updateCardStyles.updateTime}>{timeAgo(update.created_at)}</Text>
        </View>
        {update.delivery_status === 'submitted' && (
          <View style={updateCardStyles.pendingBadge}>
            <Text style={updateCardStyles.pendingText}>Pending Review</Text>
          </View>
        )}
        {update.status === 'completed' && (
          <Ionicons name="checkmark-circle" size={18} color={GREEN} />
        )}
      </View>

      <Text style={updateCardStyles.title}>{update.title}</Text>
      {update.description && (
        <Text style={updateCardStyles.description} numberOfLines={3}>
          {update.description}
        </Text>
      )}

      {hasAttachments && (
        <View style={updateCardStyles.attachments}>
          <Ionicons name="attach-outline" size={12} color={TEXT_LIGHT} />
          <Text style={updateCardStyles.attachmentCount}>
            {update.attachments.length} file(s)
          </Text>
          <View style={updateCardStyles.attachmentTypes}>
            {update.attachments.slice(0, 3).map((file, index) => (
              <Text key={index} style={updateCardStyles.fileType}>
                {file.file_name ? file.file_name.split('.').pop() : 'file'}
              </Text>
            ))}
            {update.attachments.length > 3 && (
              <Text style={updateCardStyles.fileType}>+{update.attachments.length - 3}</Text>
            )}
          </View>
        </View>
      )}

      {update.progress !== undefined && update.progress !== null && (
        <View style={updateCardStyles.progressSection}>
          <Text style={updateCardStyles.progressLabel}>Progress:</Text>
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
          >
            <Ionicons name="checkmark" size={14} color={WHITE} />
            <Text style={updateCardStyles.actionBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[updateCardStyles.actionBtn, updateCardStyles.rejectBtn]}
            onPress={() => onStatusChange(update._id, 'revision_requested')}
          >
            <Ionicons name="close" size={14} color={WHITE} />
            <Text style={updateCardStyles.actionBtnText}>Request Changes</Text>
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
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  typeIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  updateTime: {
    fontSize: 10,
    color: TEXT_LIGHT,
  },
  pendingBadge: {
    backgroundColor: ORANGE_SOFT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 9,
    fontWeight: '600',
    color: ORANGE,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
    marginBottom: 6,
  },
  attachments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  attachmentCount: {
    fontSize: 11,
    color: TEXT_LIGHT,
  },
  attachmentTypes: {
    flexDirection: 'row',
    gap: 4,
  },
  fileType: {
    fontSize: 9,
    color: TEXT_LIGHT,
    backgroundColor: BG_GRAY,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BG_GRAY,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
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
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
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
  isLoading
}) => {
  const [progress, setProgress] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [updateType, setUpdateType] = useState('progress');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (visible && contract) {
      setProgress(String(contract.progress || 0));
      setTitle(`Progress Update - ${contract.job_id?.title || 'Contract'}`);
      setDescription('');
      setUpdateType('progress');
      setFiles([]);
    }
  }, [visible, contract]);

  const handleFileSelect = () => {
    Alert.alert(
      'Add Attachment',
      'Choose file type',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose Image', onPress: () => console.log('Image picker coming soon') },
        { text: 'Choose Document', onPress: () => console.log('Document picker coming soon') },
      ]
    );
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const progressNum = parseInt(progress);
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
      files: files,
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
              <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={modalStyles.form}>
                <Text style={modalStyles.label}>Contract</Text>
                <Text style={modalStyles.contractTitle}>
                  {contract?.job_id?.title || 'Contract'}
                </Text>
                <Text style={modalStyles.clientName}>
                  Client: {contract?.client_id?.company_name || 
                    `${contract?.client_id?.first_name || ''} ${contract?.client_id?.last_name || ''}`.trim() || 
                    'Unknown'}
                </Text>

                <Text style={modalStyles.label}>Progress (%)</Text>
                <View style={modalStyles.progressInputContainer}>
                  <TextInput
                    style={modalStyles.progressInput}
                    value={progress}
                    onChangeText={setProgress}
                    keyboardType="numeric"
                    placeholder="0-100"
                    maxLength={3}
                  />
                  <Text style={modalStyles.progressPercent}>%</Text>
                </View>

                <Text style={modalStyles.label}>Update Type</Text>
                <View style={modalStyles.typeRow}>
                  {['progress', 'milestone', 'delivery', 'feedback', 'announcement'].map((type) => {
                    const info = UPDATE_TYPES[type];
                    const isSelected = updateType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          modalStyles.typeBtn,
                          isSelected && { backgroundColor: `${info.color}15`, borderColor: info.color }
                        ]}
                        onPress={() => setUpdateType(type)}
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
                />

                <Text style={modalStyles.label}>Description</Text>
                <TextInput
                  style={modalStyles.textArea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your progress, challenges, or achievements..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={modalStyles.label}>Attachments</Text>
                <TouchableOpacity style={modalStyles.uploadBtn} onPress={handleFileSelect}>
                  <Ionicons name="cloud-upload-outline" size={20} color={BLUE} />
                  <Text style={modalStyles.uploadBtnText}>Upload Files</Text>
                  <Text style={modalStyles.uploadSubtext}>Max 10 files</Text>
                </TouchableOpacity>

                {files.length > 0 && (
                  <View style={modalStyles.fileList}>
                    {files.map((file, index) => (
                      <View key={index} style={modalStyles.fileItem}>
                        <Ionicons name="document-text-outline" size={16} color={TEXT_MUTED} />
                        <Text style={modalStyles.fileName}>{file.name}</Text>
                        <TouchableOpacity onPress={() => handleRemoveFile(index)}>
                          <Ionicons name="close-circle" size={16} color={RED} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={modalStyles.submitBtn}
                  onPress={handleSubmit}
                  disabled={isLoading}
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
    backgroundColor: 'rgba(7,26,62,0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: '90%',
    borderTopWidth: 1.5,
    borderColor: BORDER,
  },
  handle: {
    width: 36,
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
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  form: {
    paddingTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 6,
    marginTop: 12,
  },
  contractTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  progressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  progressInput: {
    flex: 1,
    paddingVertical: 10,
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
    paddingVertical: 6,
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
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: TEXT_MAIN,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    fontSize: 13,
    color: TEXT_MAIN,
    textAlignVertical: 'top',
  },
  uploadBtn: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    backgroundColor: BG_GRAY,
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
    marginTop: 4,
  },
  uploadSubtext: {
    fontSize: 11,
    color: TEXT_LIGHT,
    marginTop: 2,
  },
  fileList: {
    marginTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BG_GRAY,
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    color: TEXT_MUTED,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BLUE,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 14,
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { maxHeight: '90%' }]}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Contract Details</Text>
            <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={detailStyles.hero}>
              {client.profile_picture ? (
                <Image 
                  source={{ uri: client.profile_picture }} 
                  style={detailStyles.heroImage}
                />
              ) : (
                <View style={detailStyles.heroIcon}>
                  <Ionicons name="person" size={28} color={WHITE} />
                </View>
              )}
              <Text style={detailStyles.heroTitle}>{job.title || 'Contract'}</Text>
              <Text style={detailStyles.heroClient}>
                <Ionicons name="person-outline" size={12} color={TEXT_MUTED} /> {clientName}
              </Text>
              {job.description && (
                <Text style={detailStyles.heroDescription}>{job.description}</Text>
              )}
              <View style={[detailStyles.statusBadge, { backgroundColor: status.bg }]}>
                <Ionicons name={status.icon} size={12} color={status.text} />
                <Text style={[detailStyles.statusText, { color: status.text }]}>{status.label}</Text>
              </View>
            </View>

            <View style={detailStyles.statsGrid}>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>Budget</Text>
                <Text style={detailStyles.statValue}>{formatCurrency(contract.agreed_budget?.amount)}</Text>
                <Text style={detailStyles.statSub}>{contract.agreed_budget?.type || 'Fixed'}</Text>
              </View>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>Progress</Text>
                <Text style={detailStyles.statValue}>{progress}%</Text>
                <View style={detailStyles.miniBar}>
                  <View style={[detailStyles.miniFill, { width: `${Math.min(progress, 100)}%` }]} />
                </View>
              </View>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>Updates</Text>
                <Text style={detailStyles.statValue}>{updates.length}</Text>
                <Text style={detailStyles.statSub}>Total</Text>
              </View>
            </View>

            {job.required_skills && job.required_skills.length > 0 && (
              <View style={detailStyles.section}>
                <Text style={detailStyles.sectionTitle}>Required Skills</Text>
                <View style={detailStyles.skillsRow}>
                  {job.required_skills.slice(0, 6).map((skill, index) => (
                    <View key={index} style={detailStyles.skillTag}>
                      <Text style={detailStyles.skillText}>{skill}</Text>
                    </View>
                  ))}
                  {job.required_skills.length > 6 && (
                    <Text style={detailStyles.moreSkills}>+{job.required_skills.length - 6} more</Text>
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

            {contract.terms && (
              <View style={detailStyles.section}>
                <Text style={detailStyles.sectionTitle}>Terms & Conditions</Text>
                <Text style={detailStyles.termsText}>{contract.terms}</Text>
              </View>
            )}

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
                    onStatusChange={contract.status === 'active' ? onStatusChange : null}
                  />
                ))
              )}
            </View>

            <View style={detailStyles.actionRow}>
              <TouchableOpacity
                style={detailStyles.updateBtn}
                onPress={() => {
                  onClose();
                  onUpdateProgress(contract);
                }}
              >
                <Ionicons name="trending-up-outline" size={16} color={WHITE} />
                <Text style={detailStyles.updateBtnText}>Update Progress</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const detailStyles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: BG_GRAY,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginBottom: 16,
  },
  heroImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: WHITE,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 2,
    textAlign: 'center',
  },
  heroClient: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    padding: 12,
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
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  statSub: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginTop: 2,
  },
  miniBar: {
    width: '100%',
    height: 3,
    backgroundColor: BORDER,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    backgroundColor: BLUE,
    borderRadius: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
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
  termsText: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 20,
    backgroundColor: BG_GRAY,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: 'rgba(0,104,181,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,104,181,0.2)',
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
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 3,
  },
  updateBtnText: {
    fontSize: 14,
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
    paddingBottom: 0,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
  const [selectedContractForUpdate, setSelectedContractForUpdate] = useState(null);
  const [selectedContractForDetail, setSelectedContractForDetail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = useMemo(() => {
    const total = contracts?.length || 0;
    const active = contracts?.filter(c => c.status === 'active').length || 0;
    const paused = contracts?.filter(c => c.status === 'paused').length || 0;
    const completed = contracts?.filter(c => c.status === 'completed').length || 0;
    const cancelled = contracts?.filter(c => c.status === 'cancelled').length || 0;
    const totalBudget = contracts?.reduce((sum, c) => sum + (c.agreed_budget?.amount || 0), 0) || 0;
    const avgProgress = contracts?.length > 0
      ? Math.round(contracts.reduce((sum, c) => sum + (c.progress || 0), 0) / contracts.length)
      : 0;
    return { total, active, paused, completed, cancelled, totalBudget, avgProgress };
  }, [contracts]);

  // Navigation handler
  const handleNavigate = (screen, params) => {
    console.log('==> Navigating to:', screen, params);
    
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
        limit: 50 
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

  // ==================== FIXED: handleSubmitUpdate ====================
  const handleSubmitUpdate = async (data) => {
    if (!selectedContractForUpdate) return;

    setIsSubmitting(true);
    try {
      // Extract job ID from the contract object
      let jobId = selectedContractForUpdate.job_id;
      
      // If job_id is an object with _id, extract it
      if (jobId && typeof jobId === 'object' && jobId._id) {
        jobId = jobId._id;
      }
      // If job_id is not available, try getting it from the contract's job field
      if (!jobId && selectedContractForUpdate.job) {
        jobId = selectedContractForUpdate.job;
      }

      // Update contract progress first
      await dispatch(updateContractProgress({
        contractId: selectedContractForUpdate._id,
        progress: data.progress,
      })).unwrap();

      // Create the project update with the correct field names
      const updatePayload = {
        contract_id: selectedContractForUpdate._id,  // Use contract_id (not contractId)
        job_id: jobId,                               // Use job_id (not jobId)
        title: data.title,
        description: data.description || '',
        update_type: data.updateType || 'progress',
        progress: data.progress,
        status: 'in_progress',
        delivery_status: 'submitted',
      };

      console.log('Submitting update with payload:', updatePayload); // Debug log

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
          }
        }
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
    { key: 'paused', label: 'Paused', count: stats.paused },
    { key: 'completed', label: 'Completed', count: stats.completed },
  ];

  if (contractsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.root}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleBack}>
              <View style={styles.iconWrap}>
                <Ionicons name="arrow-back" size={18} color={WHITE} />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Job <Text style={styles.blue}>Management</Text></Text>
            <View style={{ width: 36 }} />
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
          <TouchableOpacity style={styles.iconBtn} onPress={handleBack} activeOpacity={0.7}>
            <View style={styles.iconWrap}>
              <Ionicons name="arrow-back" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job <Text style={styles.blue}>Management</Text></Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              Alert.alert('Coming Soon', 'Milestone tracking will be available in the next update.');
            }}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="analytics-outline" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsOverview}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: GREEN }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: ORANGE }]}>{stats.paused}</Text>
            <Text style={styles.statLabel}>Paused</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: TEXT_MUTED }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.progressSummary}>
          <View style={styles.progressSummaryContent}>
            <View>
              <Text style={styles.progressSummaryLabel}>Average Progress</Text>
              <Text style={styles.progressSummaryValue}>{stats.avgProgress}%</Text>
            </View>
            <View style={styles.progressSummaryBar}>
              <View style={[styles.progressSummaryFill, { width: `${Math.min(stats.avgProgress, 100)}%` }]} />
            </View>
            <Text style={styles.progressSummaryTotal}>
              ₱{stats.totalBudget.toLocaleString()}
            </Text>
          </View>
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
                statusFilter === tab.key && styles.filterTabActive
              ]}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text style={[
                styles.filterTabText,
                statusFilter === tab.key && styles.filterTabTextActive
              ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[
                  styles.filterBadge,
                  statusFilter === tab.key && styles.filterBadgeActive
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    statusFilter === tab.key && styles.filterBadgeTextActive
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
                <Ionicons name="briefcase-outline" size={32} color={TEXT_LIGHT} />
              </View>
              <Text style={styles.emptyTitle}>
                {statusFilter === 'all' ? 'No contracts yet' : `No ${statusFilter} contracts`}
              </Text>
              <Text style={styles.emptyDesc}>
                {statusFilter === 'all'
                  ? 'Contracts will appear here once you\'ve been hired for a job.'
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
          <View style={{ height: 20 }} />
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
    paddingVertical: 12,
    backgroundColor: NAVY,
  },
  iconBtn: { alignSelf: 'flex-start' },
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
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
    letterSpacing: 0.2,
  },
  blue: { color: GOLD_LT, fontStyle: 'italic', fontWeight: '700' },

  statsOverview: {
    flexDirection: 'row',
    backgroundColor: CARD,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_MAIN,
  },
  statLabel: {
    fontSize: 9,
    color: TEXT_LIGHT,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: BORDER,
  },

  progressSummary: {
    backgroundColor: CARD,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  progressSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressSummaryLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  progressSummaryBar: {
    flex: 1,
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressSummaryFill: {
    height: '100%',
    backgroundColor: BLUE,
    borderRadius: 2,
  },
  progressSummaryTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
  },

  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: CARD,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: BG_GRAY,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterTabActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
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
    backgroundColor: WHITE,
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  filterBadgeTextActive: {
    color: BLUE,
  },

  list: {
    padding: 16,
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
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 17,
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