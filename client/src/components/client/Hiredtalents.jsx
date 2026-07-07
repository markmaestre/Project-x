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
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import {
  getContractUpdates,
  getProjectUpdateStats,
  getContractActivityLog,
  updateProjectUpdateStatus,
  updateDeliveryStatus,
  addUpdateComment,
  uploadUpdateAttachment,
  deleteUpdateAttachment,
  clearUpdateSuccess,
  clearUpdateError,
  selectContractUpdates,
  selectUpdateStats,
  selectActivityLog,
  selectUpdatesLoading,
  selectStatusUpdateSuccess,
  selectDeliveryUpdateSuccess,
  selectCommentAdded,
  selectAttachmentUploaded,
} from '../../Redux/slices/projectUpdateSlice';

import {
  getClientContracts,
} from '../../Redux/slices/contractSlice';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const INK        = '#12213D';
const INK_2      = '#1B2F52';
const COBALT     = '#1D4ED8';
const COBALT_DK  = '#15379E';
const BRONZE     = '#9C6B1F';
const BRONZE_LT  = '#C79A4B';
const BRONZE_BG  = '#F7EFDD';
const WHITE      = '#FFFFFF';
const PAPER      = '#F3F5F9';
const CARD       = '#FFFFFF';
const LINE       = '#E3E7EE';
const LINE_STRONG= '#D2D9E4';
const TEXT_MAIN  = '#16233F';
const TEXT_MUTED = '#5B6B84';
const TEXT_FAINT = '#93A0B4';
const SUCCESS    = '#157F3C';
const DANGER     = '#C1272D';
const WARNING    = '#B5680A';
const VIOLET     = '#5B4B9E';
const SURFACE_2  = '#F8F9FC';

const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'          },
  { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'        },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline'    },
  { key: 'Message',       label: 'Messages', icon: 'chatbubble',    iconOutline: 'chatbubble-outline'    },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',        iconOutline: 'person-outline'        },
];

const STATUS_COLORS = {
  pending: WARNING,
  in_progress: COBALT,
  completed: SUCCESS,
  blocked: DANGER,
  cancelled: TEXT_FAINT,
};

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
};

const DELIVERY_STATUS_COLORS = {
  not_submitted: TEXT_FAINT,
  submitted: WARNING,
  approved: SUCCESS,
  revision_requested: DANGER,
};

const DELIVERY_STATUS_LABELS = {
  not_submitted: 'Not Submitted',
  submitted: 'Submitted for Review',
  approved: 'Approved',
  revision_requested: 'Revision Requested',
};

const UPDATE_TYPE_LABELS = {
  progress: 'Progress',
  milestone: 'Milestone',
  delivery: 'Delivery',
  revision: 'Revision',
  feedback: 'Feedback',
  announcement: 'Announcement',
};

const UPDATE_TYPE_ICONS = {
  progress: 'trending-up-outline',
  milestone: 'flag-outline',
  delivery: 'checkmark-circle-outline',
  revision: 'refresh-outline',
  feedback: 'chatbubble-outline',
  announcement: 'megaphone-outline',
};

const PRIORITY_COLORS = {
  low: TEXT_FAINT,
  normal: COBALT,
  high: WARNING,
  urgent: DANGER,
};

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

const has = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
};

// ── Eyebrow Component ──────────────────────────────────────────────────────
const Eyebrow = ({ icon, color = TEXT_FAINT, children }) => (
  <View style={eyebrow.row}>
    {icon ? <Ionicons name={icon} size={12} color={color} /> : null}
    <Text style={[eyebrow.text, { color }]}>{children}</Text>
  </View>
);

const eyebrow = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});

// ── Project Details Modal ────────────────────────────────────────────────────
const ProjectDetailsModal = ({ visible, contract, onClose }) => {
  if (!contract) return null;

  const job = contract.job_id || {};
  const freelancer = contract.freelancer_id || {};
  
  const projectTitle = job.title || contract.title || 'Untitled Project';
  const projectDescription = job.description || '';
  const projectCategory = job.category || '';
  const projectBudget = job.budget || contract.agreed_budget?.amount || 0;
  const projectType = job.type || job.employment_type || contract.agreed_budget?.type || 'fixed';
  const projectLocation = job.location || '';
  const requiredSkills = job.required_skills || job.skills || [];
  const jobStatus = job.status || '';
  const jobPostedDate = job.created_at || '';
  const jobDeadline = job.deadline || contract.end_date || '';

  const freelancerName = ((freelancer.first_name || '') + ' ' + (freelancer.last_name || '')).trim() || 'Freelancer';

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={pdm.overlay}>
        <View style={pdm.sheet}>
          <View style={pdm.handle} />
          <View style={pdm.header}>
            <View style={pdm.headerLeft}>
              <View style={pdm.headerIconWrap}>
                <Ionicons name="briefcase-outline" size={16} color={COBALT} />
              </View>
              <Text style={pdm.headerTitle}>Project Details</Text>
            </View>
            <TouchableOpacity style={pdm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={pdm.body}>
            <View style={pdm.card}>
              <Text style={pdm.projectTitle}>{projectTitle}</Text>
              
              <TouchableOpacity 
                style={pdm.freelancerSection}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <View style={pdm.freelancerAvatar}>
                  <Text style={pdm.freelancerInitials}>
                    {(freelancer.first_name?.[0] || '') + (freelancer.last_name?.[0] || '') || '?'}
                  </Text>
                </View>
                <View style={pdm.freelancerInfo}>
                  <Text style={pdm.freelancerName}>{freelancerName}</Text>
                  <Text style={pdm.freelancerRole}>{freelancer.experience_level || 'Freelancer'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={TEXT_FAINT} />
              </TouchableOpacity>

              {has(projectDescription) && (
                <View style={pdm.section}>
                  <Eyebrow icon="document-text-outline">Description</Eyebrow>
                  <Text style={pdm.descriptionText}>{projectDescription}</Text>
                </View>
              )}

              <View style={pdm.metaGrid}>
                {has(projectCategory) && (
                  <View style={pdm.metaItem}>
                    <Ionicons name="pricetag-outline" size={14} color={COBALT} />
                    <Text style={pdm.metaLabel}>Category</Text>
                    <Text style={pdm.metaValue}>{projectCategory}</Text>
                  </View>
                )}
                
                {projectBudget > 0 && (
                  <View style={pdm.metaItem}>
                    <Ionicons name="cash-outline" size={14} color={BRONZE} />
                    <Text style={pdm.metaLabel}>Budget</Text>
                    <Text style={[pdm.metaValue, { color: BRONZE, fontWeight: '700' }]}>
                      {formatCurrency(projectBudget)}
                      {projectType === 'hourly' ? ' / hr' : ' (Fixed)'}
                    </Text>
                  </View>
                )}

                {has(projectType) && (
                  <View style={pdm.metaItem}>
                    <Ionicons name="time-outline" size={14} color={TEXT_FAINT} />
                    <Text style={pdm.metaLabel}>Type</Text>
                    <Text style={pdm.metaValue}>
                      {projectType.charAt(0).toUpperCase() + projectType.slice(1)}
                    </Text>
                  </View>
                )}

                {has(projectLocation) && (
                  <View style={pdm.metaItem}>
                    <Ionicons name="location-outline" size={14} color={TEXT_FAINT} />
                    <Text style={pdm.metaLabel}>Location</Text>
                    <Text style={pdm.metaValue}>{projectLocation}</Text>
                  </View>
                )}

                {has(jobStatus) && (
                  <View style={pdm.metaItem}>
                    <Ionicons name="information-circle-outline" size={14} color={TEXT_FAINT} />
                    <Text style={pdm.metaLabel}>Status</Text>
                    <Text style={pdm.metaValue}>
                      {jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)}
                    </Text>
                  </View>
                )}

                {has(jobPostedDate) && (
                  <View style={pdm.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={TEXT_FAINT} />
                    <Text style={pdm.metaLabel}>Posted</Text>
                    <Text style={pdm.metaValue}>{formatDate(jobPostedDate)}</Text>
                  </View>
                )}

                {has(jobDeadline) && (
                  <View style={pdm.metaItem}>
                    <Ionicons name="flag-outline" size={14} color={TEXT_FAINT} />
                    <Text style={pdm.metaLabel}>Deadline</Text>
                    <Text style={pdm.metaValue}>{formatDate(jobDeadline)}</Text>
                  </View>
                )}
              </View>

              {has(requiredSkills) && (
                <View style={pdm.section}>
                  <Eyebrow icon="bulb-outline">Required Skills</Eyebrow>
                  <View style={pdm.skillsWrap}>
                    {requiredSkills.map((skill, index) => (
                      <View key={index} style={pdm.skillChip}>
                        <Text style={pdm.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={pdm.contractInfo}>
                <Eyebrow icon="document-text-outline" color={BRONZE}>Contract Status</Eyebrow>
                <View style={pdm.contractCard}>
                  <View style={pdm.contractRow}>
                    <Text style={pdm.contractLabel}>Contract Status</Text>
                    <View style={[pdm.statusBadge, { borderColor: STATUS_COLORS[contract.status] }]}>
                      <Text style={[pdm.statusText, { color: STATUS_COLORS[contract.status] }]}>
                        {STATUS_LABELS[contract.status] || contract.status}
                      </Text>
                    </View>
                  </View>
                  <View style={[pdm.contractRow, pdm.contractRowBorder]}>
                    <Text style={pdm.contractLabel}>Progress</Text>
                    <Text style={pdm.contractValue}>{contract.progress || 0}%</Text>
                  </View>
                  <View style={[pdm.contractRow, pdm.contractRowBorder]}>
                    <Text style={pdm.contractLabel}>Start Date</Text>
                    <Text style={pdm.contractValue}>{formatDate(contract.start_date)}</Text>
                  </View>
                  <View style={[pdm.contractRow, pdm.contractRowBorder]}>
                    <Text style={pdm.contractLabel}>End Date</Text>
                    <Text style={pdm.contractValue}>{formatDate(contract.end_date) || 'Not set'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const pdm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(18,33,61,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: LINE_STRONG, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: LINE },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: SURFACE_2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LINE },
  headerTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, letterSpacing: -0.2 },
  closeBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: SURFACE_2, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 18, paddingBottom: 32 },
  card: { backgroundColor: WHITE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LINE },
  
  projectTitle: { fontSize: 20, fontWeight: '700', color: TEXT_MAIN, marginBottom: 14, letterSpacing: -0.3 },
  
  freelancerSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: SURFACE_2, 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: LINE,
    marginBottom: 16,
  },
  freelancerAvatar: { width: 38, height: 38, borderRadius: 10, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  freelancerInitials: { fontSize: 13, fontWeight: '700', color: WHITE },
  freelancerInfo: { flex: 1 },
  freelancerName: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  freelancerRole: { fontSize: 10, color: TEXT_FAINT, fontWeight: '600' },
  
  section: { marginBottom: 16 },
  descriptionText: { fontSize: 13, color: TEXT_MUTED, lineHeight: 20, marginTop: 6 },
  
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metaItem: { flex: 1, minWidth: '45%', backgroundColor: SURFACE_2, borderRadius: 8, padding: 11, borderWidth: 1, borderColor: LINE },
  metaLabel: { fontSize: 9, color: TEXT_FAINT, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600', marginTop: 3 },
  metaValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '600', marginTop: 2 },
  
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 },
  skillChip: { backgroundColor: SURFACE_2, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: LINE },
  skillText: { fontSize: 12, color: INK, fontWeight: '600' },
  
  contractInfo: { marginTop: 4 },
  contractCard: { backgroundColor: SURFACE_2, borderRadius: 12, borderWidth: 1, borderColor: LINE, overflow: 'hidden', marginTop: 8 },
  contractRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  contractRowBorder: { borderTopWidth: 1, borderTopColor: LINE },
  contractLabel: { fontSize: 12, color: TEXT_FAINT, fontWeight: '500' },
  contractValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, borderWidth: 1.2, backgroundColor: WHITE },
  statusText: { fontSize: 11, fontWeight: '700' },
});

// ── Client Feedback Modal ────────────────────────────────────────────────────
const ClientFeedbackModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  update,
  isSubmitting 
}) => {
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (visible) {
      setComment('');
      setAttachments([]);
    }
  }, [visible]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets.length > 0) {
        setAttachments(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachments(prev => [...prev, {
          uri: asset.uri,
          name: asset.fileName || 'image.jpg',
          mimeType: asset.type || 'image/jpeg',
          size: asset.fileSize || 0,
        }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!comment.trim()) {
      Alert.alert('Validation', 'Please provide feedback comments.');
      return;
    }
    onSubmit({
      comment: comment.trim(),
      attachments,
    });
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={cfm.overlay}>
        <View style={cfm.sheet}>
          <View style={cfm.handle} />
          <View style={cfm.header}>
            <View style={cfm.headerLeft}>
              <View style={cfm.headerIconWrap}>
                <Ionicons name="chatbubble-outline" size={16} color={COBALT} />
              </View>
              <Text style={cfm.headerTitle}>Provide Feedback</Text>
            </View>
            <TouchableOpacity style={cfm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={cfm.body}>
            <Text style={cfm.subHeader}>
              {update?.title || 'Project Update'}
            </Text>

            <View style={cfm.field}>
              <Text style={cfm.label}>Comment <Text style={cfm.required}>*</Text></Text>
              <TextInput
                style={[cfm.input, cfm.textArea]}
                placeholder="Share your feedback on this update..."
                placeholderTextColor={TEXT_FAINT}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={cfm.charCount}>{comment.length}/500</Text>
            </View>

            <View style={cfm.field}>
              <Text style={cfm.label}>Attachments (Optional)</Text>
              <Text style={cfm.hint}>
                You can attach supporting documents or screenshots
              </Text>
              <View style={cfm.attachmentActions}>
                <TouchableOpacity style={cfm.attachBtn} onPress={handlePickImage}>
                  <Ionicons name="image-outline" size={15} color={COBALT} />
                  <Text style={cfm.attachBtnText}>Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={cfm.attachBtn} onPress={handlePickDocument}>
                  <Ionicons name="document-outline" size={15} color={COBALT} />
                  <Text style={cfm.attachBtnText}>Document</Text>
                </TouchableOpacity>
              </View>

              {attachments.length > 0 && (
                <View style={cfm.attachmentList}>
                  {attachments.map((file, index) => (
                    <View key={index} style={cfm.attachmentItem}>
                      <Ionicons name="document-outline" size={15} color={COBALT} />
                      <Text style={cfm.attachmentName} numberOfLines={1}>
                        {file.name || file.uri?.split('/').pop() || 'File'}
                      </Text>
                      <TouchableOpacity onPress={() => removeAttachment(index)}>
                        <Ionicons name="close-circle" size={16} color={DANGER} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[cfm.submitBtn, (!comment.trim() || isSubmitting) && cfm.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={WHITE} />
              ) : (
                <>
                  <Ionicons name="send-outline" size={16} color={WHITE} />
                  <Text style={cfm.submitText}>Submit Feedback</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const cfm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(18,33,61,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: LINE_STRONG, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: LINE },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: SURFACE_2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LINE },
  headerTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, letterSpacing: -0.2 },
  closeBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: SURFACE_2, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 18, paddingBottom: 32 },
  subHeader: { fontSize: 13, color: TEXT_MUTED, marginBottom: 18, textAlign: 'center', fontWeight: '500' },
  field: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: TEXT_MAIN, marginBottom: 7, letterSpacing: 0.2 },
  required: { color: DANGER },
  hint: { fontSize: 11, color: TEXT_FAINT, marginBottom: 9 },
  input: { backgroundColor: SURFACE_2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: LINE, fontSize: 14, color: TEXT_MAIN },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: TEXT_FAINT, textAlign: 'right', marginTop: 4 },
  attachmentActions: { flexDirection: 'row', gap: 8 },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: LINE, backgroundColor: WHITE },
  attachBtnText: { fontSize: 12, color: TEXT_MAIN, fontWeight: '600' },
  attachmentList: { marginTop: 9, gap: 5 },
  attachmentItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: SURFACE_2, borderRadius: 9, borderWidth: 1, borderColor: LINE },
  attachmentName: { flex: 1, fontSize: 12, color: TEXT_MAIN },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: INK, paddingVertical: 15, borderRadius: 11, marginTop: 6 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontSize: 14, fontWeight: '700', color: WHITE, letterSpacing: 0.2 },
});

// ── Freelancer Info Modal ──────────────────────────────────────────────────
const FreelancerInfoModal = ({ visible, contract, onClose, onMessage }) => {
  if (!contract) return null;

  const freelancer = contract.freelancer_id || {};
  const job = contract.job_id || {};
  
  const firstName = freelancer.first_name || '';
  const lastName = freelancer.last_name || '';
  const fullName = (firstName + ' ' + lastName).trim() || 'Freelancer';
  const initials = (firstName.charAt(0) || '') + (lastName.charAt(0) || '');
  const skills = freelancer.skills || [];
  const experienceLevel = freelancer.experience_level || 'Freelancer';
  const bio = freelancer.bio_about_me || '';
  const email = freelancer.email_address || '';
  const phone = freelancer.phone_number || '';
  const location = freelancer.location || '';
  const username = freelancer.username || '';
  const profilePicture = freelancer.profile_picture || '';
  const resume = freelancer.resume || '';
  const resumeFileName = freelancer.resume_file_name || '';
  const portfolio = freelancer.portfolio || [];
  const totalProjects = freelancer.total_projects || 0;
  const completedProjects = freelancer.completed_projects || 0;
  const hourlyRate = freelancer.hourly_rate || 0;
  const availability = freelancer.availability || 'Not specified';
  const languages = freelancer.languages || [];
  const certifications = freelancer.certifications || [];

  const handleOpenResume = () => {
    if (resume) {
      Linking.openURL(resume).catch(() => {
        Alert.alert('Error', 'Cannot open resume. Please try again.');
      });
    } else {
      Alert.alert('No Resume', 'This freelancer has not uploaded a resume.');
    }
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={fim.overlay}>
        <View style={fim.sheet}>
          <View style={fim.handle} />
          <View style={fim.header}>
            <View style={fim.headerLeft}>
              <View style={fim.headerIconWrap}>
                <Ionicons name="person-outline" size={16} color={COBALT} />
              </View>
              <Text style={fim.headerTitle}>Freelancer Profile</Text>
            </View>
            <TouchableOpacity style={fim.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={fim.body}>
            <View style={fim.profileHeader}>
              <View style={fim.avatarWrap}>
                {has(profilePicture) ? (
                  <Image source={{ uri: profilePicture }} style={fim.avatarImg} />
                ) : (
                  <Text style={fim.avatarText}>{initials || '?'}</Text>
                )}
              </View>
              <View style={fim.profileInfo}>
                <Text style={fim.name}>{fullName}</Text>
                <Text style={fim.username}>@{username || 'user'}</Text>
                <View style={fim.ratingRow}>
                  <View style={fim.experienceBadge}>
                    <Ionicons name="briefcase-outline" size={11} color={BRONZE} />
                    <Text style={fim.experienceText}>{experienceLevel}</Text>
                  </View>
                </View>
                {has(location) && (
                  <View style={fim.locationRow}>
                    <Ionicons name="location-outline" size={12} color={TEXT_FAINT} />
                    <Text style={fim.locationText}>{location}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={fim.statsRow}>
              <View style={fim.statItem}>
                <Text style={fim.statValue}>{totalProjects}</Text>
                <Text style={fim.statLabel}>Projects</Text>
              </View>
              <View style={fim.statDivider} />
              <View style={fim.statItem}>
                <Text style={fim.statValue}>{completedProjects}</Text>
                <Text style={fim.statLabel}>Completed</Text>
              </View>
              <View style={fim.statDivider} />
              <View style={fim.statItem}>
                <Text style={fim.statValue}>
                  {hourlyRate > 0 ? formatCurrency(hourlyRate) : 'N/A'}
                </Text>
                <Text style={fim.statLabel}>Hourly Rate</Text>
              </View>
            </View>

            <View style={fim.section}>
              <Eyebrow icon="call-outline">Contact Information</Eyebrow>
              <View style={fim.contactCard}>
                {has(email) && (
                  <View style={fim.contactRow}>
                    <Ionicons name="mail-outline" size={15} color={COBALT} />
                    <Text style={fim.contactText}>{email}</Text>
                  </View>
                )}
                {has(phone) && (
                  <View style={[fim.contactRow, fim.contactRowBorder]}>
                    <Ionicons name="call-outline" size={15} color={COBALT} />
                    <Text style={fim.contactText}>{phone}</Text>
                  </View>
                )}
                {has(availability) && (
                  <View style={[fim.contactRow, fim.contactRowBorder]}>
                    <Ionicons name="time-outline" size={15} color={COBALT} />
                    <Text style={fim.contactText}>Availability: {availability}</Text>
                  </View>
                )}
              </View>
            </View>

            {has(skills) && (
              <View style={fim.section}>
                <Eyebrow icon="bulb-outline">Skills</Eyebrow>
                <View style={fim.skillsWrap}>
                  {skills.map((skill, index) => (
                    <View key={index} style={fim.skillChip}>
                      <Text style={fim.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {has(languages) && (
              <View style={fim.section}>
                <Eyebrow icon="globe-outline">Languages</Eyebrow>
                <View style={fim.languagesWrap}>
                  {languages.map((lang, index) => (
                    <View key={index} style={fim.languageChip}>
                      <Text style={fim.languageText}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {has(bio) && (
              <View style={fim.section}>
                <Eyebrow icon="document-text-outline">About Me</Eyebrow>
                <View style={fim.bioCard}>
                  <Text style={fim.bioText}>{bio}</Text>
                </View>
              </View>
            )}

            {has(certifications) && (
              <View style={fim.section}>
                <Eyebrow icon="ribbon-outline">Certifications</Eyebrow>
                {certifications.map((cert, index) => (
                  <View key={index} style={fim.certItem}>
                    <Ionicons name="checkmark-circle" size={14} color={SUCCESS} />
                    <Text style={fim.certText}>{cert}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={fim.section}>
              <Eyebrow icon="document-outline" color={COBALT}>Resume</Eyebrow>
              <TouchableOpacity 
                style={fim.resumeCard}
                onPress={handleOpenResume}
                activeOpacity={0.7}
              >
                <View style={fim.resumeIconWrap}>
                  <Ionicons name="document-text-outline" size={22} color={COBALT} />
                </View>
                <View style={fim.resumeInfo}>
                  <Text style={fim.resumeTitle}>
                    {has(resumeFileName) ? resumeFileName : 'View Resume'}
                  </Text>
                  <Text style={fim.resumeSub}>
                    {has(resume) ? 'Tap to view document' : 'No resume uploaded'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={TEXT_FAINT} />
              </TouchableOpacity>
            </View>

            <View style={fim.section}>
              <Eyebrow icon="document-text-outline" color={BRONZE}>Contract Details</Eyebrow>
              <View style={fim.contractCard}>
                <View style={fim.contractRow}>
                  <Text style={fim.contractLabel}>Project</Text>
                  <Text style={fim.contractValue}>{job.title || 'Untitled Project'}</Text>
                </View>
                <View style={[fim.contractRow, fim.contractRowBorder]}>
                  <Text style={fim.contractLabel}>Budget</Text>
                  <Text style={fim.contractValue}>
                    {formatCurrency(contract.agreed_budget?.amount)}
                    {contract.agreed_budget?.type === 'hourly' ? ' / hour' : ' (Fixed)'}
                  </Text>
                </View>
                <View style={[fim.contractRow, fim.contractRowBorder]}>
                  <Text style={fim.contractLabel}>Status</Text>
                  <View style={[fim.statusBadge, { borderColor: STATUS_COLORS[contract.status] }]}>
                    <Text style={[fim.statusText, { color: STATUS_COLORS[contract.status] }]}>
                      {STATUS_LABELS[contract.status] || contract.status}
                    </Text>
                  </View>
                </View>
                <View style={[fim.contractRow, fim.contractRowBorder]}>
                  <Text style={fim.contractLabel}>Progress</Text>
                  <Text style={fim.contractValue}>{contract.progress || 0}%</Text>
                </View>
                <View style={[fim.contractRow, fim.contractRowBorder]}>
                  <Text style={fim.contractLabel}>Start Date</Text>
                  <Text style={fim.contractValue}>{formatDate(contract.start_date)}</Text>
                </View>
                <View style={[fim.contractRow, fim.contractRowBorder]}>
                  <Text style={fim.contractLabel}>End Date</Text>
                  <Text style={fim.contractValue}>{formatDate(contract.end_date) || 'Not set'}</Text>
                </View>
              </View>
            </View>

            <View style={fim.actionRow}>
              <TouchableOpacity
                style={[fim.actionBtn, fim.messageBtn]}
                onPress={() => {
                  onClose();
                  onMessage(freelancer._id);
                }}
              >
                <Ionicons name="chatbubble-outline" size={17} color={WHITE} />
                <Text style={fim.actionBtnText}>Message Freelancer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const fim = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(18,33,61,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: LINE_STRONG, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: LINE },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: SURFACE_2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LINE },
  headerTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, letterSpacing: -0.2 },
  closeBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: SURFACE_2, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 18, paddingBottom: 32 },
  
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatarWrap: { width: 64, height: 64, borderRadius: 16, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 64, height: 64, borderRadius: 16 },
  avatarText: { fontSize: 22, fontWeight: '700', color: WHITE },
  profileInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, letterSpacing: -0.2 },
  username: { fontSize: 12, color: TEXT_FAINT, marginTop: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  experienceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: SURFACE_2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: LINE },
  experienceText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 11, color: TEXT_FAINT },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE_2, borderRadius: 12, borderWidth: 1, borderColor: LINE, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statValue: { fontSize: 16, fontWeight: '800', color: TEXT_MAIN },
  statLabel: { fontSize: 9, color: TEXT_FAINT, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: LINE },
  
  section: { marginBottom: 16 },
  contactCard: { backgroundColor: SURFACE_2, borderRadius: 12, borderWidth: 1, borderColor: LINE, overflow: 'hidden', marginTop: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  contactRowBorder: { borderTopWidth: 1, borderTopColor: LINE },
  contactText: { fontSize: 13, color: TEXT_MAIN, flex: 1 },
  
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  skillChip: { backgroundColor: WHITE, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: LINE_STRONG },
  skillText: { fontSize: 12, color: INK, fontWeight: '600' },
  
  languagesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  languageChip: { backgroundColor: SURFACE_2, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: LINE },
  languageText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  
  bioCard: { backgroundColor: SURFACE_2, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: LINE, marginTop: 8 },
  bioText: { fontSize: 13, color: TEXT_MUTED, lineHeight: 20 },
  
  certItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 4 },
  certText: { fontSize: 12, color: TEXT_MAIN, flex: 1 },
  
  resumeCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: SURFACE_2, 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: LINE,
    marginTop: 8,
  },
  resumeIconWrap: { width: 42, height: 42, borderRadius: 10, backgroundColor: WHITE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  resumeInfo: { flex: 1 },
  resumeTitle: { fontSize: 13, fontWeight: '600', color: TEXT_MAIN },
  resumeSub: { fontSize: 11, color: TEXT_FAINT, marginTop: 2 },
  
  contractCard: { backgroundColor: SURFACE_2, borderRadius: 12, borderWidth: 1, borderColor: LINE, overflow: 'hidden', marginTop: 8 },
  contractRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  contractRowBorder: { borderTopWidth: 1, borderTopColor: LINE },
  contractLabel: { fontSize: 12, color: TEXT_FAINT, fontWeight: '500' },
  contractValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, borderWidth: 1.2, backgroundColor: WHITE },
  statusText: { fontSize: 11, fontWeight: '700' },
  
  actionRow: { marginTop: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12 },
  messageBtn: { backgroundColor: INK },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: WHITE, letterSpacing: 0.2 },
});

// ── Update Detail Modal ── COMPLETE VERSION WITH APPROVE/REJECT ──
const UpdateDetailModal = ({ 
  visible, 
  update, 
  contract,
  onClose, 
  onStatusUpdate, 
  onDeliveryUpdate,
  onAddComment,
  onDeleteAttachment,
  onOpenFeedback,
  onViewFreelancer,
  onViewProjectDetails,
  onApproveProgress,
  onRejectProgress,
  isUpdating,
  canProvideFeedback,
}) => {
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showRejectComment, setShowRejectComment] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  if (!update) return null;

  const isCompleted = update.status === 'completed';
  const isDelivery = update.update_type === 'delivery';
  const isProgress = update.update_type === 'progress';
  const isPending = update.status === 'pending' || update.status === 'in_progress';
  const canApproveDelivery = !isCompleted && isDelivery && update.delivery_status === 'submitted';
  const canApproveProgress = !isCompleted && isProgress && isPending;
  const canGiveFeedback = !isCompleted && canProvideFeedback;

  const job = update.job_id || contract?.job_id || {};
  const projectTitle = job.title || contract?.title || 'Untitled Project';
  const projectDescription = job.description || '';
  const projectCategory = job.category || '';
  const projectBudget = job.budget || contract?.agreed_budget?.amount || 0;
  const projectType = job.type || job.employment_type || contract?.agreed_budget?.type || 'fixed';
  const projectLocation = job.location || '';
  const requiredSkills = job.required_skills || job.skills || [];
  const jobStatus = job.status || '';

  const freelancer = contract?.freelancer_id || {};
  const freelancerName = ((freelancer.first_name || '') + ' ' + (freelancer.last_name || '')).trim() || 'Freelancer';

  const handleStatusUpdate = (status) => {
    onStatusUpdate(update._id, status, commentText);
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(update._id, commentText);
      setCommentText('');
      setShowCommentInput(false);
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Progress',
      `Approve "${update.title}"? This will update the contract progress to ${update.progress || 0}%.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => {
            if (onApproveProgress) {
              onApproveProgress(update._id);
            } else {
              onStatusUpdate(update._id, 'completed', '');
            }
          }
        }
      ]
    );
  };

  const handleReject = () => {
    setShowRejectComment(true);
  };

  const handleConfirmReject = () => {
    if (onRejectProgress) {
      onRejectProgress(update._id, rejectComment);
    } else {
      onStatusUpdate(update._id, 'blocked', rejectComment);
    }
    setShowRejectComment(false);
    setRejectComment('');
  };

  return (
    <>
      <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
        <View style={udm.overlay}>
          <View style={udm.sheet}>
            <View style={udm.handle} />
            <View style={udm.header}>
              <View style={udm.headerLeft}>
                <View style={udm.headerIconWrap}>
                  <Ionicons name="document-text-outline" size={16} color={COBALT} />
                </View>
                <Text style={udm.headerTitle}>Update Details</Text>
              </View>
              <TouchableOpacity style={udm.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={udm.body}>
              <View style={udm.card}>
                {/* Freelancer Info */}
                <TouchableOpacity 
                  style={udm.freelancerSection}
                  onPress={onViewFreelancer}
                  activeOpacity={0.7}
                >
                  <View style={udm.freelancerAvatar}>
                    <Text style={udm.freelancerInitials}>
                      {(freelancer.first_name?.[0] || '') + (freelancer.last_name?.[0] || '') || '?'}
                    </Text>
                  </View>
                  <View style={udm.freelancerInfo}>
                    <Text style={udm.freelancerName}>{freelancerName}</Text>
                    <View style={udm.freelancerMeta}>
                      <Text style={udm.freelancerRole}>{freelancer.experience_level || 'Freelancer'}</Text>
                    </View>
                  </View>
                  <View style={udm.freelancerArrow}>
                    <Ionicons name="chevron-forward" size={16} color={TEXT_FAINT} />
                  </View>
                </TouchableOpacity>

                {/* Project Details */}
                <TouchableOpacity 
                  style={udm.jobSection}
                  onPress={onViewProjectDetails}
                  activeOpacity={0.7}
                >
                  <View style={udm.jobHeader}>
                    <Eyebrow icon="briefcase-outline" color={COBALT}>Project Details</Eyebrow>
                    <Ionicons name="chevron-forward" size={14} color={TEXT_FAINT} />
                  </View>
                  <Text style={udm.jobTitle}>{projectTitle}</Text>
                  
                  {has(projectDescription) && (
                    <View style={udm.jobDescriptionWrap}>
                      <Text style={udm.jobDescriptionLabel}>Description</Text>
                      <Text style={udm.jobDescription}>{projectDescription}</Text>
                    </View>
                  )}

                  <View style={udm.jobMetaGrid}>
                    {has(projectCategory) && (
                      <View style={udm.jobMetaItem}>
                        <Ionicons name="pricetag-outline" size={13} color={TEXT_FAINT} />
                        <Text style={udm.jobMetaLabel}>Category</Text>
                        <Text style={udm.jobMetaValue}>{projectCategory}</Text>
                      </View>
                    )}
                    
                    {projectBudget > 0 && (
                      <View style={udm.jobMetaItem}>
                        <Ionicons name="cash-outline" size={13} color={BRONZE} />
                        <Text style={udm.jobMetaLabel}>Budget</Text>
                        <Text style={[udm.jobMetaValue, { color: BRONZE, fontWeight: '700' }]}>
                          {formatCurrency(projectBudget)}
                          {projectType === 'hourly' ? ' / hr' : ' (Fixed)'}
                        </Text>
                      </View>
                    )}

                    {has(projectType) && (
                      <View style={udm.jobMetaItem}>
                        <Ionicons name="time-outline" size={13} color={TEXT_FAINT} />
                        <Text style={udm.jobMetaLabel}>Type</Text>
                        <Text style={udm.jobMetaValue}>
                          {projectType.charAt(0).toUpperCase() + projectType.slice(1)}
                        </Text>
                      </View>
                    )}

                    {has(projectLocation) && (
                      <View style={udm.jobMetaItem}>
                        <Ionicons name="location-outline" size={13} color={TEXT_FAINT} />
                        <Text style={udm.jobMetaLabel}>Location</Text>
                        <Text style={udm.jobMetaValue}>{projectLocation}</Text>
                      </View>
                    )}

                    {has(jobStatus) && (
                      <View style={udm.jobMetaItem}>
                        <Ionicons name="information-circle-outline" size={13} color={TEXT_FAINT} />
                        <Text style={udm.jobMetaLabel}>Status</Text>
                        <Text style={udm.jobMetaValue}>
                          {jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {has(requiredSkills) && (
                    <View style={udm.skillsSection}>
                      <Text style={udm.skillsLabel}>Required Skills</Text>
                      <View style={udm.skillsWrap}>
                        {requiredSkills.map((skill, index) => (
                          <View key={index} style={udm.skillChip}>
                            <Text style={udm.skillText}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={udm.divider} />

                {/* Update Info */}
                <View style={udm.updateHeader}>
                  <Text style={udm.updateTitle}>{update.title}</Text>
                  <View style={[udm.statusBadge, { borderColor: STATUS_COLORS[update.status] }]}>
                    <Text style={[udm.statusText, { color: STATUS_COLORS[update.status] }]}>
                      {STATUS_LABELS[update.status]}
                    </Text>
                  </View>
                </View>

                <View style={udm.metaRow}>
                  <View style={udm.metaItem}>
                    <Ionicons name="time-outline" size={13} color={TEXT_FAINT} />
                    <Text style={udm.metaText}>{formatRelativeTime(update.created_at)}</Text>
                  </View>
                  <View style={udm.metaItem}>
                    <Ionicons name="trending-up-outline" size={13} color={TEXT_FAINT} />
                    <Text style={udm.metaText}>Progress: {update.progress ?? 0}%</Text>
                  </View>
                </View>

                <View style={udm.metaRow}>
                  <View style={udm.metaItem}>
                    <Ionicons 
                      name={UPDATE_TYPE_ICONS[update.update_type] || 'document-text-outline'} 
                      size={13} 
                      color={TEXT_FAINT} 
                    />
                    <Text style={udm.metaText}>
                      {UPDATE_TYPE_LABELS[update.update_type] || update.update_type}
                    </Text>
                  </View>
                  {update.delivery_status !== 'not_submitted' && (
                    <View style={udm.metaItem}>
                      <Ionicons 
                        name={update.delivery_status === 'approved' ? 'checkmark-circle' : 'refresh-circle'} 
                        size={13} 
                        color={DELIVERY_STATUS_COLORS[update.delivery_status]} 
                      />
                      <Text style={[udm.metaText, { color: DELIVERY_STATUS_COLORS[update.delivery_status], fontWeight: '700' }]}>
                        {DELIVERY_STATUS_LABELS[update.delivery_status]}
                      </Text>
                    </View>
                  )}
                </View>

                {update.priority && update.priority !== 'normal' && (
                  <View style={udm.metaRow}>
                    <View style={udm.metaItem}>
                      <Ionicons 
                        name="flag-outline" 
                        size={13} 
                        color={PRIORITY_COLORS[update.priority]} 
                      />
                      <Text style={[udm.metaText, { color: PRIORITY_COLORS[update.priority], fontWeight: '700' }]}>
                        Priority: {update.priority.charAt(0).toUpperCase() + update.priority.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}

                {has(update.description) && (
                  <View style={udm.section}>
                    <Eyebrow icon="document-text-outline">Update Description</Eyebrow>
                    <Text style={udm.descriptionText}>{update.description}</Text>
                  </View>
                )}

                {has(update.freelancer_comment) && (
                  <View style={udm.section}>
                    <Eyebrow icon="chatbubble-outline" color={COBALT}>Freelancer Comment</Eyebrow>
                    <View style={udm.commentBox}>
                      <Text style={udm.commentText}>{update.freelancer_comment}</Text>
                    </View>
                  </View>
                )}

                {has(update.client_comment) && (
                  <View style={udm.section}>
                    <Eyebrow icon="chatbubble-outline" color={BRONZE}>Your Comment</Eyebrow>
                    <View style={[udm.commentBox, { borderColor: BRONZE_LT, backgroundColor: BRONZE_BG }]}>
                      <Text style={udm.commentText}>{update.client_comment}</Text>
                    </View>
                  </View>
                )}

                {has(update.attachments) && (
                  <View style={udm.section}>
                    <Eyebrow icon="attach-outline">{`Attachments (${update.attachments.length})`}</Eyebrow>
                    {update.attachments.map((att, index) => (
                      <View key={att._id || index} style={udm.attachmentItem}>
                        <TouchableOpacity
                          style={udm.attachmentContent}
                          onPress={() => Linking.openURL(att.file_url).catch(() => Alert.alert('Error', 'Cannot open file'))}
                        >
                          <Ionicons name="document-outline" size={15} color={COBALT} />
                          <Text style={udm.attachmentName} numberOfLines={1}>{att.file_name}</Text>
                          <Ionicons name="open-outline" size={13} color={TEXT_FAINT} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {!isCompleted && (
                  <View style={udm.actionsSection}>
                    <Eyebrow icon="eye-outline" color={COBALT}>Client Actions</Eyebrow>
                    
                    {/* Progress Update Actions */}
                    {canApproveProgress && (
                      <View style={udm.progressActions}>
                        <TouchableOpacity
                          style={[udm.actionBtn, udm.approveProgressBtn]}
                          onPress={handleApprove}
                          disabled={isUpdating}
                        >
                          <Ionicons name="checkmark-circle" size={17} color={WHITE} />
                          <Text style={udm.actionBtnText}>Approve Progress</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[udm.actionBtn, udm.rejectProgressBtn]}
                          onPress={handleReject}
                          disabled={isUpdating}
                        >
                          <Ionicons name="close-circle" size={17} color={WHITE} />
                          <Text style={udm.actionBtnText}>Request Revision</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Delivery Update Actions */}
                    {canApproveDelivery && (
                      <View style={udm.deliveryActions}>
                        <TouchableOpacity
                          style={[udm.deliveryBtn, udm.approveBtn]}
                          onPress={() => onDeliveryUpdate(update._id, 'approved', '')}
                          disabled={isUpdating}
                        >
                          <Ionicons name="checkmark-circle" size={15} color={WHITE} />
                          <Text style={udm.deliveryBtnText}>Approve Delivery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[udm.deliveryBtn, udm.revisionBtn]}
                          onPress={() => onDeliveryUpdate(update._id, 'revision_requested', '')}
                          disabled={isUpdating}
                        >
                          <Ionicons name="refresh-circle" size={15} color={WHITE} />
                          <Text style={udm.deliveryBtnText}>Request Revision</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Feedback Button */}
                    {canGiveFeedback && !isProgress && !isDelivery && (
                      <TouchableOpacity
                        style={udm.feedbackBtn}
                        onPress={() => onOpenFeedback(update)}
                        disabled={isUpdating}
                      >
                        <Ionicons name="chatbubble-outline" size={17} color={WHITE} />
                        <Text style={udm.feedbackBtnText}>Give Feedback</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={udm.section}>
                  <Eyebrow icon="chatbubble-ellipses-outline">Add Comment</Eyebrow>
                  {showCommentInput ? (
                    <View style={udm.commentInputContainer}>
                      <TextInput
                        style={udm.commentInput}
                        placeholder="Add your comment or feedback..."
                        placeholderTextColor={TEXT_FAINT}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                      <View style={udm.commentInputActions}>
                        <TouchableOpacity 
                          style={[udm.commentSubmitBtn, !commentText.trim() && udm.commentSubmitBtnDisabled]}
                          onPress={handleAddComment}
                          disabled={!commentText.trim() || isUpdating}
                        >
                          <Text style={udm.commentSubmitText}>Post</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowCommentInput(false)}>
                          <Text style={udm.commentCancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={udm.addCommentBtn} onPress={() => setShowCommentInput(true)}>
                      <Ionicons name="add-circle-outline" size={18} color={COBALT} />
                      <Text style={udm.addCommentText}>Add Comment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reject Comment Modal */}
      <Modal transparent animationType="fade" visible={showRejectComment} onRequestClose={() => setShowRejectComment(false)}>
        <View style={udm.rejectOverlay}>
          <View style={udm.rejectSheet}>
            <View style={udm.rejectHeader}>
              <Text style={udm.rejectTitle}>Request Revision</Text>
              <TouchableOpacity onPress={() => setShowRejectComment(false)}>
                <Ionicons name="close" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            <Text style={udm.rejectSubtitle}>
              Please provide feedback on what needs to be changed.
            </Text>
            <TextInput
              style={udm.rejectInput}
              placeholder="Describe what needs to be revised..."
              placeholderTextColor={TEXT_FAINT}
              value={rejectComment}
              onChangeText={setRejectComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={udm.rejectActions}>
              <TouchableOpacity 
                style={[udm.rejectBtn, udm.rejectCancelBtn]} 
                onPress={() => setShowRejectComment(false)}
              >
                <Text style={udm.rejectCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[udm.rejectBtn, udm.rejectConfirmBtn, !rejectComment.trim() && udm.rejectBtnDisabled]} 
                onPress={handleConfirmReject}
                disabled={!rejectComment.trim()}
              >
                <Text style={udm.rejectConfirmText}>Request Revision</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ── udm Styles ──
const udm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(18,33,61,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: LINE_STRONG, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: LINE },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: SURFACE_2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LINE },
  headerTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, letterSpacing: -0.2 },
  closeBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: SURFACE_2, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 18, paddingBottom: 32 },
  card: { backgroundColor: WHITE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LINE },
  
  freelancerSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: SURFACE_2, 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: LINE,
    marginBottom: 14,
  },
  freelancerAvatar: { width: 38, height: 38, borderRadius: 10, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  freelancerInitials: { fontSize: 13, fontWeight: '700', color: WHITE },
  freelancerInfo: { flex: 1 },
  freelancerName: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  freelancerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  freelancerRole: { fontSize: 10, color: TEXT_FAINT, fontWeight: '600' },
  freelancerArrow: { paddingHorizontal: 4 },
  
  jobSection: { marginBottom: 14 },
  jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  jobTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginTop: 6, letterSpacing: -0.2 },
  jobDescriptionWrap: { marginTop: 10 },
  jobDescriptionLabel: { fontSize: 11, fontWeight: '700', color: TEXT_FAINT, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  jobDescription: { fontSize: 13, color: TEXT_MUTED, lineHeight: 20 },
  jobMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  jobMetaItem: { flex: 1, minWidth: '45%', backgroundColor: SURFACE_2, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: LINE },
  jobMetaLabel: { fontSize: 9, color: TEXT_FAINT, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  jobMetaValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '600', marginTop: 2 },
  
  skillsSection: { marginTop: 12 },
  skillsLabel: { fontSize: 11, fontWeight: '700', color: TEXT_FAINT, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { backgroundColor: SURFACE_2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: LINE },
  skillText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '500' },
  
  divider: { height: 1, backgroundColor: LINE, marginVertical: 14 },
  
  updateHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  updateTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, flex: 1, marginRight: 8, letterSpacing: -0.2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexShrink: 0, borderWidth: 1.2, backgroundColor: WHITE },
  statusText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 7, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: TEXT_MUTED },
  section: { marginTop: 16 },
  descriptionText: { fontSize: 13, color: TEXT_MAIN, lineHeight: 20, marginTop: 6 },
  commentBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: SURFACE_2, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: LINE, marginTop: 6 },
  commentText: { fontSize: 13, color: TEXT_MAIN, flex: 1, lineHeight: 19 },
  attachmentItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: 6 },
  attachmentContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SURFACE_2, padding: 11, borderRadius: 10, borderWidth: 1, borderColor: LINE },
  attachmentName: { fontSize: 12, color: TEXT_MAIN, flex: 1 },
  
  actionsSection: { marginTop: 18, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 14 },
  
  progressActions: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 8,
  },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 12, 
    borderRadius: 10,
  },
  approveProgressBtn: { backgroundColor: SUCCESS },
  rejectProgressBtn: { backgroundColor: DANGER },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },
  
  deliveryActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  deliveryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10 },
  approveBtn: { backgroundColor: SUCCESS },
  revisionBtn: { backgroundColor: WARNING },
  deliveryBtnText: { fontSize: 12, fontWeight: '700', color: WHITE },
  
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: INK, paddingVertical: 13, borderRadius: 10, marginTop: 8 },
  feedbackBtnText: { fontSize: 13, fontWeight: '700', color: WHITE, letterSpacing: 0.2 },
  
  commentInputContainer: { backgroundColor: SURFACE_2, borderRadius: 10, borderWidth: 1, borderColor: LINE, padding: 12, marginTop: 6 },
  commentInput: { fontSize: 13, color: TEXT_MAIN, minHeight: 60, textAlignVertical: 'top' },
  commentInputActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14, marginTop: 8 },
  commentSubmitBtn: { backgroundColor: INK, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  commentSubmitBtnDisabled: { backgroundColor: TEXT_FAINT },
  commentSubmitText: { fontSize: 12, fontWeight: '700', color: WHITE },
  commentCancelText: { fontSize: 12, color: TEXT_MUTED, paddingVertical: 8, fontWeight: '600' },
  addCommentBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, backgroundColor: SURFACE_2, borderRadius: 10, borderWidth: 1, borderColor: LINE_STRONG, borderStyle: 'dashed', marginTop: 6 },
  addCommentText: { fontSize: 13, color: COBALT, fontWeight: '700' },
  
  rejectOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  rejectSheet: { 
    backgroundColor: WHITE, 
    borderRadius: 16, 
    padding: 20, 
    width: '100%', 
    maxWidth: 380,
  },
  rejectHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8,
  },
  rejectTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: TEXT_MAIN,
  },
  rejectSubtitle: { 
    fontSize: 13, 
    color: TEXT_MUTED, 
    marginBottom: 16,
  },
  rejectInput: { 
    backgroundColor: SURFACE_2, 
    borderRadius: 10, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: LINE,
    fontSize: 14,
    color: TEXT_MAIN,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rejectActions: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 16,
  },
  rejectBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center',
  },
  rejectCancelBtn: { 
    backgroundColor: SURFACE_2,
    borderWidth: 1,
    borderColor: LINE,
  },
  rejectCancelText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: TEXT_MUTED,
  },
  rejectConfirmBtn: { 
    backgroundColor: DANGER,
  },
  rejectConfirmText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: WHITE,
  },
  rejectBtnDisabled: { 
    opacity: 0.5,
  },
});

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProjectUpdate({ onNavigate }) {
  const dispatch = useDispatch();
  const contractUpdates = useSelector(selectContractUpdates);
  const stats = useSelector(selectUpdateStats);
  const isLoading = useSelector(selectUpdatesLoading);
  const statusUpdateSuccess = useSelector(selectStatusUpdateSuccess);
  const deliveryUpdateSuccess = useSelector(selectDeliveryUpdateSuccess);
  const commentAdded = useSelector(selectCommentAdded);
  const attachmentUploaded = useSelector(selectAttachmentUploaded);

  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('Hiredtalents');
  const [showUpdateDetail, setShowUpdateDetail] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackUpdate, setFeedbackUpdate] = useState(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showFreelancerModal, setShowFreelancerModal] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);

  // ── Fetch Data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const contractResult = await dispatch(getClientContracts({
        status: 'active',
        limit: 50,
      })).unwrap();

      const contractsList = contractResult?.contracts || [];
      setContracts(contractsList);

      if (selectedContract) {
        await dispatch(getContractUpdates({
          contractId: selectedContract._id,
          limit: 20,
        })).unwrap();
        await dispatch(getProjectUpdateStats(selectedContract._id)).unwrap();
      } else if (contractsList.length > 0) {
        setSelectedContract(contractsList[0]);
        await dispatch(getContractUpdates({
          contractId: contractsList[0]._id,
          limit: 20,
        })).unwrap();
        await dispatch(getProjectUpdateStats(contractsList[0]._id)).unwrap();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    }
  }, [dispatch, selectedContract]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handle Success States ──────────────────────────────────────────────────
  useEffect(() => {
    if (statusUpdateSuccess || deliveryUpdateSuccess || commentAdded || attachmentUploaded) {
      dispatch(clearUpdateSuccess());
      fetchData();
    }
  }, [statusUpdateSuccess, deliveryUpdateSuccess, commentAdded, attachmentUploaded, dispatch, fetchData]);

  // ── Hardware Back Button ──────────────────────────────────────────────────
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showUpdateDetail) {
        setShowUpdateDetail(false);
        setSelectedUpdate(null);
        return true;
      }
      if (showFeedbackModal) {
        setShowFeedbackModal(false);
        setFeedbackUpdate(null);
        return true;
      }
      if (showFreelancerModal) {
        setShowFreelancerModal(false);
        return true;
      }
      if (showProjectDetailsModal) {
        setShowProjectDetailsModal(false);
        return true;
      }
      if (onNavigate) {
        onNavigate('ClientDashboard');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showUpdateDetail, showFeedbackModal, showFreelancerModal, showProjectDetailsModal, onNavigate]);

  // ── Tab Navigation ─────────────────────────────────────────────────────────
  const handleTabPress = (key) => {
    setActiveBottomTab(key);
    if (key === 'Home') onNavigate('ClientDashboard');
    if (key === 'PostJob') onNavigate('PostJob');
    if (key === 'Hiredtalents') onNavigate('Hiredtalents');
    if (key === 'Message') onNavigate('Messages');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  // ── Refresh ─────────────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // ── Update Status ──────────────────────────────────────────────────────────
  const handleStatusUpdate = async (updateId, status, comment) => {
    setIsUpdating(true);
    try {
      await dispatch(updateProjectUpdateStatus({ updateId, status, comment })).unwrap();
      setShowUpdateDetail(false);
      setSelectedUpdate(null);
      Alert.alert('Success', `Status updated to ${STATUS_LABELS[status]}`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Approve Progress Handler ──────────────────────────────────────────────
  const handleApproveProgress = async (updateId) => {
    setIsUpdating(true);
    try {
      await dispatch(updateProjectUpdateStatus({ 
        updateId, 
        status: 'completed', 
        comment: 'Progress update approved by client' 
      })).unwrap();
      setShowUpdateDetail(false);
      setSelectedUpdate(null);
      Alert.alert('Success', 'Progress update approved!');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to approve progress');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Reject Progress Handler ───────────────────────────────────────────────
  const handleRejectProgress = async (updateId, comment) => {
    setIsUpdating(true);
    try {
      await dispatch(updateProjectUpdateStatus({ 
        updateId, 
        status: 'blocked', 
        comment: comment || 'Revision requested by client' 
      })).unwrap();
      setShowUpdateDetail(false);
      setSelectedUpdate(null);
      Alert.alert('Success', 'Revision requested');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to request revision');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Delivery Status Update ────────────────────────────────────────────────
  const handleDeliveryUpdate = async (updateId, deliveryStatus, comment) => {
    setIsUpdating(true);
    try {
      await dispatch(updateDeliveryStatus({ updateId, delivery_status: deliveryStatus, comment })).unwrap();
      setShowUpdateDetail(false);
      setSelectedUpdate(null);
      Alert.alert('Success', `Delivery ${deliveryStatus === 'approved' ? 'approved' : 'revision requested'}`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update delivery status');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Add Comment ────────────────────────────────────────────────────────────
  const handleAddComment = async (updateId, comment) => {
    setIsUpdating(true);
    try {
      await dispatch(addUpdateComment({ updateId, comment })).unwrap();
      Alert.alert('Success', 'Comment added successfully');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Submit Feedback ────────────────────────────────────────────────────────
  const handleSubmitFeedback = async (feedbackData) => {
    setIsSubmittingFeedback(true);
    try {
      const commentText = `${feedbackData.comment}`;
      
      await dispatch(addUpdateComment({ 
        updateId: feedbackUpdate._id, 
        comment: commentText 
      })).unwrap();

      if (feedbackUpdate.update_type === 'delivery') {
        await dispatch(updateDeliveryStatus({ 
          updateId: feedbackUpdate._id, 
          delivery_status: 'approved',
          comment: 'Feedback provided by client'
        })).unwrap();
      }

      setShowFeedbackModal(false);
      setFeedbackUpdate(null);
      setIsSubmittingFeedback(false);
      Alert.alert('Success', 'Thank you for your feedback!');
      fetchData();
    } catch (error) {
      setIsSubmittingFeedback(false);
      Alert.alert('Error', error.message || 'Failed to submit feedback');
    }
  };

  // ── Select Contract ────────────────────────────────────────────────────────
  const handleSelectContract = async (contract) => {
    setSelectedContract(contract);
    await dispatch(getContractUpdates({
      contractId: contract._id,
      limit: 20,
    })).unwrap();
    await dispatch(getProjectUpdateStats(contract._id)).unwrap();
  };

  // ── View Update Detail ────────────────────────────────────────────────────
  const handleViewUpdate = (update) => {
    setSelectedUpdate(update);
    setShowUpdateDetail(true);
  };

  // ── Open Feedback Modal ──────────────────────────────────────────────────
  const handleOpenFeedback = (update) => {
    setFeedbackUpdate(update);
    setShowFeedbackModal(true);
  };

  // ── Open Freelancer Info ──────────────────────────────────────────────────
  const handleViewFreelancer = () => {
    setShowFreelancerModal(true);
  };

  // ── Open Project Details ──────────────────────────────────────────────────
  const handleViewProjectDetails = () => {
    setShowProjectDetailsModal(true);
  };

  // ── Message Freelancer ────────────────────────────────────────────────────
  const handleMessageFreelancer = (freelancerId) => {
    if (onNavigate) {
      onNavigate('Messages', { userId: freelancerId, userRole: 'freelancer' });
    }
  };

  // ── Filter Updates ─────────────────────────────────────────────────────────
  const getFilteredUpdates = () => {
    let updates = contractUpdates || [];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      updates = updates.filter(u => 
        u.title?.toLowerCase().includes(query) ||
        u.description?.toLowerCase().includes(query) ||
        u.update_type?.toLowerCase().includes(query) ||
        u.job_id?.title?.toLowerCase().includes(query)
      );
    }
    return updates;
  };

  const filteredUpdates = getFilteredUpdates();

  // ── Check if client can provide feedback ──────────────────────────────────
  const canProvideFeedback = (update) => {
    if (update.status === 'completed') return false;
    if (update.update_type === 'delivery' && update.delivery_status === 'submitted') return true;
    if (update.update_type === 'delivery' && update.delivery_status === 'revision_requested') return true;
    return true;
  };

  // ── Render Contract Selector ──────────────────────────────────────────────
  const renderContractSelector = () => {
    if (contracts.length === 0) {
      return (
        <View style={css.emptyContracts}>
          <Ionicons name="document-text-outline" size={28} color={TEXT_FAINT} />
          <Text style={css.emptyContractsText}>No active contracts</Text>
          <Text style={css.emptyContractsSub}>Hire freelancers to see project updates</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={css.contractScroll}
      >
        {contracts.map((contract) => {
          const isSelected = selectedContract?._id === contract._id;
          const freelancer = contract.freelancer_id || {};
          const job = contract.job_id || {};
          const name = ((freelancer.first_name || '') + ' ' + (freelancer.last_name || '')).trim() || 'Freelancer';
          const projectTitle = job.title || contract.title || 'Project';
          
          return (
            <TouchableOpacity
              key={contract._id}
              style={[css.contractChip, isSelected && css.contractChipActive]}
              onPress={() => handleSelectContract(contract)}
              activeOpacity={0.8}
            >
              <View style={[css.contractChipAvatar, isSelected && css.contractChipAvatarActive]}>
                <Text style={[css.contractChipInitials, isSelected && css.contractChipInitialsActive]}>
                  {(freelancer.first_name?.[0] || '') + (freelancer.last_name?.[0] || '') || '?'}
                </Text>
              </View>
              <View style={css.contractChipInfo}>
                <Text style={[css.contractChipName, isSelected && css.contractChipNameActive]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={css.contractChipProject} numberOfLines={1}>
                  {projectTitle}
                </Text>
              </View>
              <Text style={[css.contractChipProgress, isSelected && css.contractChipProgressActive]}>{contract.progress || 0}%</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // ── Render Update Item ─────────────────────────────────────────────────────
  const renderUpdateItem = ({ item, index }) => {
    const isLatest = index === 0;
    const job = item.job_id || selectedContract?.job_id || {};
    const projectTitle = job.title || selectedContract?.title || 'Untitled Project';
    const railColor = STATUS_COLORS[item.status] || TEXT_FAINT;

    return (
      <TouchableOpacity
        style={[uiItem.wrap, isLatest && uiItem.latest]}
        onPress={() => handleViewUpdate(item)}
        activeOpacity={0.75}
      >
        <View style={[uiItem.rail, { backgroundColor: railColor }]} />
        <View style={uiItem.content}>
          <TouchableOpacity 
            style={uiItem.projectRow}
            onPress={() => handleViewProjectDetails()}
            activeOpacity={0.7}
          >
            <Ionicons name="briefcase-outline" size={10} color={TEXT_FAINT} />
            <Text style={uiItem.projectText} numberOfLines={1}>{projectTitle}</Text>
            <Ionicons name="chevron-forward" size={10} color={TEXT_FAINT} />
            {isLatest && (
              <View style={uiItem.latestTag}>
                <Text style={uiItem.latestTagText}>LATEST</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={uiItem.header}>
            <Text style={uiItem.title} numberOfLines={1}>{item.title}</Text>
          </View>

          <View style={uiItem.typeRow}>
            <View style={uiItem.typeBadge}>
              <Ionicons 
                name={UPDATE_TYPE_ICONS[item.update_type] || 'document-text-outline'} 
                size={10} 
                color={COBALT} 
              />
              <Text style={uiItem.typeText}>
                {UPDATE_TYPE_LABELS[item.update_type] || item.update_type}
              </Text>
            </View>
          </View>

          {has(item.description) && (
            <Text style={uiItem.desc} numberOfLines={2}>{item.description}</Text>
          )}
          <View style={uiItem.footer}>
            <Text style={uiItem.time}>{formatRelativeTime(item.created_at)}</Text>
            <View style={uiItem.footerDot} />
            <Text style={uiItem.progress}>{item.progress ?? 0}% progress</Text>
            {item.delivery_status !== 'not_submitted' && (
              <>
                <View style={uiItem.footerDot} />
                <Text style={[uiItem.delivery, { color: DELIVERY_STATUS_COLORS[item.delivery_status] }]}>
                  {DELIVERY_STATUS_LABELS[item.delivery_status]}
                </Text>
              </>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={TEXT_FAINT} style={uiItem.chevron} />
      </TouchableOpacity>
    );
  };

  // ── Stats Summary ──────────────────────────────────────────────────────────
  const renderStats = () => {
    const statItems = [
      { label: 'Total', value: stats.total, color: TEXT_MAIN },
      { label: 'Completed', value: stats.completed, color: SUCCESS },
      { label: 'In Progress', value: stats.inProgress, color: COBALT },
      { label: 'Pending', value: stats.pending, color: WARNING },
      { label: 'Blocked', value: stats.blocked, color: DANGER },
    ];

    return (
      <View style={css.statsWrap}>
        <View style={css.statsRow}>
          {statItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <View style={css.statCard}>
                <Text style={[css.statValue, { color: item.color }]}>{item.value}</Text>
                <Text style={css.statLabel}>{item.label}</Text>
              </View>
              {i < statItems.length - 1 && <View style={css.statDivider} />}
            </React.Fragment>
          ))}
        </View>
        <View style={css.progressWrap}>
          <View style={css.progressLabelRow}>
            <Text style={css.progressLabel}>Overall Contract Progress</Text>
            <Text style={css.progressPercent}>{stats.contractProgress || 0}%</Text>
          </View>
          <View style={css.progressTrack}>
            <View style={[css.progressFill, { width: `${stats.contractProgress || 0}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading && !refreshing && contracts.length === 0) {
    return (
      <SafeAreaView style={css.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={INK} />
        <View style={css.topbar}>
          <View style={css.topbarLeft}>
            <Ionicons name="document-text-outline" size={19} color={WHITE} />
            <Text style={css.topbarTitle}>Project Updates</Text>
          </View>
        </View>
        <View style={css.center}>
          <ActivityIndicator size="large" color={COBALT} />
          <Text style={css.loadingText}>Loading project updates…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={css.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={INK} />
      <View style={css.root}>

        <View style={css.topbar}>
          <View style={css.topbarLeft}>
            <View style={css.topbarIconWrap}>
              <Ionicons name="document-text-outline" size={17} color={WHITE} />
            </View>
            <View>
              <Text style={css.topbarTitle}>Project Updates</Text>
              {selectedContract && (
                <Text style={css.topbarSub}>
                  {selectedContract.freelancer_id?.first_name || 'Freelancer'}'s updates
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={css.topbarBtn} onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={18} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={css.searchWrap}>
          <View style={css.searchBox}>
            <Ionicons name="search-outline" size={16} color={TEXT_FAINT} />
            <TextInput
              style={css.searchInput}
              placeholder="Search updates or projects..."
              placeholderTextColor={TEXT_FAINT}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={TEXT_FAINT} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── FREELANCER SELECTOR ── */}
        <View style={css.selectorWrap}>
          {renderContractSelector()}
        </View>

        {selectedContract && renderStats()}

        <View style={css.listWrap}>
          <View style={css.listHeader}>
            <Eyebrow icon="list-outline" color={TEXT_MUTED}>Updates</Eyebrow>
            <Text style={css.listCount}>{filteredUpdates.length}</Text>
          </View>

          <FlatList
            data={filteredUpdates}
            renderItem={renderUpdateItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={css.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COBALT} />}
            ListEmptyComponent={
              <View style={css.empty}>
                <View style={css.emptyIconWrap}>
                  <Ionicons name="document-text-outline" size={30} color={TEXT_FAINT} />
                </View>
                <Text style={css.emptyTitle}>No updates yet</Text>
                <Text style={css.emptyDesc}>
                  {searchQuery ? 'Try adjusting your search.' : 'Your freelancer will post updates here.'}
                </Text>
              </View>
            }
          />
        </View>

        <SafeAreaView edges={['bottom']} style={css.tabSafe}>
          <View style={css.tabBar}>
            {TABS.map(tab => {
              const active = activeBottomTab === tab.key;
              const isPost = tab.key === 'PostJob';
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={css.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {active && <View style={css.tabActiveBar} />}
                  {isPost ? (
                    <View style={css.tabFab}>
                      <Ionicons name={active ? tab.icon : tab.iconOutline} size={21} color={WHITE} />
                    </View>
                  ) : (
                    <View style={css.tabIconWrap}>
                      <Ionicons
                        name={active ? tab.icon : tab.iconOutline}
                        size={22}
                        color={active ? COBALT : TEXT_FAINT}
                      />
                    </View>
                  )}
                  <Text style={[
                    css.tabLabel,
                    active && css.tabLabelActive,
                    isPost && css.tabLabelPost,
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      <UpdateDetailModal
        visible={showUpdateDetail}
        update={selectedUpdate}
        contract={selectedContract}
        onClose={() => {
          setShowUpdateDetail(false);
          setSelectedUpdate(null);
        }}
        onStatusUpdate={handleStatusUpdate}
        onDeliveryUpdate={handleDeliveryUpdate}
        onAddComment={handleAddComment}
        onOpenFeedback={handleOpenFeedback}
        onViewFreelancer={handleViewFreelancer}
        onViewProjectDetails={handleViewProjectDetails}
        onApproveProgress={handleApproveProgress}
        onRejectProgress={handleRejectProgress}
        isUpdating={isUpdating}
        canProvideFeedback={selectedUpdate ? canProvideFeedback(selectedUpdate) : false}
      />

      <FreelancerInfoModal
        visible={showFreelancerModal}
        contract={selectedContract}
        onClose={() => setShowFreelancerModal(false)}
        onMessage={handleMessageFreelancer}
      />

      <ProjectDetailsModal
        visible={showProjectDetailsModal}
        contract={selectedContract}
        onClose={() => setShowProjectDetailsModal(false)}
      />

      <ClientFeedbackModal
        visible={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setFeedbackUpdate(null);
        }}
        onSubmit={handleSubmitFeedback}
        update={feedbackUpdate}
        isSubmitting={isSubmittingFeedback}
      />
    </SafeAreaView>
  );
}

// ── CSS Styles ────────────────────────────────────────────────────────────────
const css = StyleSheet.create({
  safe: { flex: 1, backgroundColor: INK },
  root: { flex: 1, backgroundColor: PAPER },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: INK,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  topbarIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: WHITE, letterSpacing: -0.2 },
  topbarSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 2 },
  topbarBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 11, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: LINE },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SURFACE_2,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: LINE,
  },
  searchInput: { flex: 1, fontSize: 13, color: TEXT_MAIN, padding: 0 },

  selectorWrap: { backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 12 },
  contractScroll: { paddingHorizontal: 16, gap: 9 },
  contractChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE_2,
    minWidth: 168,
  },
  contractChipActive: { borderColor: INK, backgroundColor: INK },
  contractChipAvatar: { width: 30, height: 30, borderRadius: 8, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LINE },
  contractChipAvatarActive: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' },
  contractChipInitials: { fontSize: 11, fontWeight: '700', color: TEXT_MAIN },
  contractChipInitialsActive: { color: WHITE },
  contractChipInfo: { flex: 1, minWidth: 0 },
  contractChipName: { fontSize: 12, fontWeight: '700', color: TEXT_MAIN },
  contractChipNameActive: { color: WHITE },
  contractChipProject: { fontSize: 10, color: TEXT_FAINT, marginTop: 1 },
  contractChipProgress: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED },
  contractChipProgressActive: { color: BRONZE_LT },

  statsWrap: { backgroundColor: CARD, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: LINE },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: LINE },
  statValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: TEXT_FAINT, fontWeight: '600', marginTop: 2 },
  progressWrap: { marginTop: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600' },
  progressPercent: { fontSize: 11, color: INK, fontWeight: '800' },
  progressTrack: { height: 6, backgroundColor: LINE, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COBALT, borderRadius: 3 },

  listWrap: { flex: 1, backgroundColor: PAPER },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  listCount: { fontSize: 11, color: TEXT_FAINT, fontWeight: '700', backgroundColor: CARD, borderWidth: 1, borderColor: LINE, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  list: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 32 },

  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 16, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, marginTop: 12 },
  emptyDesc: { fontSize: 12, color: TEXT_FAINT, textAlign: 'center', marginTop: 4, lineHeight: 18 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: 13, color: TEXT_FAINT },

  emptyContracts: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 },
  emptyContractsText: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, marginTop: 8 },
  emptyContractsSub: { fontSize: 11, color: TEXT_FAINT, textAlign: 'center', marginTop: 4 },

  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 7,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
    position: 'relative',
  },
  tabActiveBar: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 3,
    backgroundColor: COBALT,
    borderRadius: 999,
  },
  tabIconWrap: { marginBottom: 3, marginTop: 6 },
  tabFab: {
    width: 42,
    height: 34,
    borderRadius: 10,
    backgroundColor: BRONZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    marginTop: 2,
  },
  tabLabel: { fontSize: 10, color: TEXT_FAINT, fontWeight: '600' },
  tabLabelActive: { color: COBALT, fontWeight: '700' },
  tabLabelPost: { color: BRONZE, fontWeight: '700' },
});

// ── Update Item Styles ──────────────────────────────────────────────────────
const uiItem = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 13,
    backgroundColor: CARD,
    borderRadius: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: LINE,
    overflow: 'hidden',
  },
  latest: {
    borderColor: LINE_STRONG,
    borderWidth: 1,
  },
  rail: { width: 3, borderRadius: 2, marginRight: 12 },
  content: { flex: 1 },
  projectRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginBottom: 4,
  },
  projectText: { fontSize: 10, color: TEXT_FAINT, fontWeight: '600', flex: 1 },
  latestTag: { backgroundColor: BRONZE_BG, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  latestTagText: { fontSize: 8, fontWeight: '800', color: BRONZE, letterSpacing: 0.5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  title: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, flex: 1, letterSpacing: -0.1 },
  typeRow: { flexDirection: 'row', marginBottom: 5 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: SURFACE_2, borderWidth: 1, borderColor: LINE },
  typeText: { fontSize: 9, color: COBALT, fontWeight: '700' },
  desc: { fontSize: 11.5, color: TEXT_MUTED, lineHeight: 16, marginBottom: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  footerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: TEXT_FAINT },
  time: { fontSize: 10, color: TEXT_FAINT, fontWeight: '500' },
  progress: { fontSize: 10, color: TEXT_FAINT, fontWeight: '500' },
  delivery: { fontSize: 10, fontWeight: '700' },
  chevron: { alignSelf: 'center', marginLeft: 4 },
});