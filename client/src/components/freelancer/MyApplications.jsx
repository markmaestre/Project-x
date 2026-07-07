// screens/freelancer/MyApplications.jsx
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
  FlatList,
  Image,
  Linking,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getFreelancerApplications,
  getApplicationById,
  withdrawApplication,
  selectAllApplications,
  selectApplicationsLoading,
  selectApplicationsError,
  selectApplicationsTotal,
  selectApplicationsTotalPages,
  selectApplicationsCurrentPage,
  selectSelectedApplication,
  selectApplicationStats,
  clearApplicationSuccess,
  clearApplicationError,
  updateApplicationLocally,
} from '../../Redux/slices/applicationSlice';
import {
  getContractByApplication,
  getContractById,
  selectSelectedContract,
  selectContractsLoading,
  selectContractById as selectContractByIdSelector,
} from '../../Redux/slices/contractSlice';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
// DESIGN SYSTEM
// ─────────────────────────────────────────────────────────
const NAVY = '#0A2247';
const NAVY_DEEP = '#061733';
const BLUE = '#1B5FC4';
const BLUE_DARK = '#123C82';
const BLUE_LIGHT = '#E8F0FC';
const BLUE_LINE = '#CBDCF4';
const GOLD = '#B8862B';
const GOLD_DARK = '#8C6414';
const GOLD_LIGHT = '#FBF1DC';
const GOLD_LINE = '#EAD6A6';
const WHITE = '#FFFFFF';
const OFFWHITE = '#F5F7FB';
const CARD = '#FFFFFF';
const TEXT_MAIN = '#0A2247';
const TEXT_MUTED = '#5E718F';
const TEXT_FAINT = '#96A6C0';
const BORDER = '#E1E7F2';
const BORDER_SOFT = '#EDF1F8';
const SUCCESS = '#157F3C';
const DANGER = '#C1272D';
const WARNING = '#D4A017';

const STATUS_CONFIG = {
  pending: { 
    label: 'Under Review', 
    icon: 'time-outline', 
    color: TEXT_MUTED,
    bg: OFFWHITE,
    border: BORDER,
    order: 1,
    description: 'Your application is being reviewed by the client.'
  },
  reviewed: { 
    label: 'Reviewed', 
    icon: 'eye-outline', 
    color: BLUE,
    bg: BLUE_LIGHT,
    border: BLUE_LINE,
    order: 2,
    description: 'The client has reviewed your application.'
  },
  shortlisted: { 
    label: 'Shortlisted', 
    icon: 'star-outline', 
    color: GOLD_DARK,
    bg: GOLD_LIGHT,
    border: GOLD_LINE,
    order: 3,
    description: 'You have been shortlisted for this position.'
  },
  interview: { 
    label: 'Interview', 
    icon: 'chatbubbles-outline', 
    color: BLUE_DARK,
    bg: BLUE_LIGHT,
    border: BLUE_LINE,
    order: 4,
    description: 'Interview scheduled with the client.'
  },
  offered: { 
    label: 'Offer Received', 
    icon: 'document-text-outline', 
    color: GOLD_DARK,
    bg: GOLD_LIGHT,
    border: GOLD_LINE,
    order: 5,
    description: 'You have received an offer from the client.'
  },
  hired: { 
    label: 'Hired', 
    icon: 'briefcase-outline', 
    color: SUCCESS,
    bg: '#E6F7EC',
    border: '#B8E0CC',
    order: 6,
    description: 'Congratulations! You have been hired.'
  },
  completed: { 
    label: 'Completed', 
    icon: 'checkmark-done-outline', 
    color: SUCCESS,
    bg: '#E6F7EC',
    border: '#B8E0CC',
    order: 7,
    description: 'This job has been completed.'
  },
  rejected: { 
    label: 'Rejected', 
    icon: 'close-outline', 
    color: DANGER,
    bg: '#FDE8E9',
    border: '#F5C8CA',
    order: 8,
    description: 'Your application was not selected.'
  },
  withdrawn: { 
    label: 'Withdrawn', 
    icon: 'remove-outline', 
    color: TEXT_FAINT,
    bg: OFFWHITE,
    border: BORDER,
    order: 9,
    description: 'You have withdrawn this application.'
  },
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount) => {
  if (!amount || amount === 0) return '₱0.00';
  return `₱${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

const has = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
};

const formatLocation = (location) => {
  if (!location) return 'Remote';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.province) parts.push(location.province);
    if (location.country) parts.push(location.country);
    return parts.length > 0 ? parts.join(', ') : 'Remote';
  }
  return 'Remote';
};

// ─────────────────────────────────────────────────────────
// STATUS CHIP COMPONENT
// ─────────────────────────────────────────────────────────
const StatusChip = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isSm = size === 'sm';
  
  return (
    <View style={[
      chipStyles.wrap,
      { backgroundColor: config.bg, borderColor: config.border },
      isSm && chipStyles.wrapSm,
    ]}>
      <Ionicons name={config.icon} size={isSm ? 10 : 12} color={config.color} />
      <Text style={[chipStyles.text, { color: config.color }, isSm && chipStyles.textSm]}>
        {config.label}
      </Text>
    </View>
  );
};

const chipStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  wrapSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 9,
  },
});

// ─────────────────────────────────────────────────────────
// STATUS TIMELINE COMPONENT WITH FULL HISTORY
// ─────────────────────────────────────────────────────────
const StatusTimeline = ({ currentStatus, history }) => {
  const statusOrder = ['pending', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'completed'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const visibleStatuses = statusOrder.slice(0, currentIndex + 1);
  
  // If rejected or withdrawn
  if (currentStatus === 'rejected' || currentStatus === 'withdrawn') {
    const config = STATUS_CONFIG[currentStatus];
    const statusHistory = history?.filter(h => h.status === currentStatus) || [];
    const lastUpdate = statusHistory.length > 0 ? statusHistory[statusHistory.length - 1] : null;
    
    return (
      <View style={timelineStyles.terminalContainer}>
        <View style={[timelineStyles.terminalIcon, { backgroundColor: config.bg, borderColor: config.border }]}>
          <Ionicons name={config.icon} size={28} color={config.color} />
        </View>
        <Text style={timelineStyles.terminalStatus}>{config.label}</Text>
        <Text style={timelineStyles.terminalMessage}>{config.description}</Text>
        {lastUpdate && (
          <Text style={timelineStyles.terminalDate}>
            {formatDateTime(lastUpdate.created_at || lastUpdate.updated_at)}
          </Text>
        )}
      </View>
    );
  }
  
  // Show full timeline
  return (
    <View style={timelineStyles.container}>
      {visibleStatuses.map((status, index) => {
        const config = STATUS_CONFIG[status];
        const isLast = index === visibleStatuses.length - 1;
        const isActive = index === visibleStatuses.length - 1;
        const statusHistory = history?.filter(h => h.status === status) || [];
        const lastUpdate = statusHistory.length > 0 ? statusHistory[statusHistory.length - 1] : null;
        
        return (
          <View key={status} style={timelineStyles.step}>
            <View style={timelineStyles.lineContainer}>
              <View style={[
                timelineStyles.dot,
                isActive ? { backgroundColor: BLUE } : { backgroundColor: SUCCESS },
              ]} />
              {!isLast && <View style={[
                timelineStyles.line,
                { backgroundColor: isActive ? BLUE_LINE : SUCCESS }
              ]} />}
            </View>
            <View style={timelineStyles.content}>
              <View style={timelineStyles.stepHeader}>
                <Ionicons 
                  name={config.icon} 
                  size={14} 
                  color={isActive ? BLUE : SUCCESS} 
                />
                <Text style={[
                  timelineStyles.stepLabel,
                  isActive ? { color: BLUE, fontWeight: '800' } : { color: TEXT_MUTED },
                ]}>
                  {config.label}
                </Text>
                {isActive && (
                  <View style={timelineStyles.activeBadge}>
                    <Text style={timelineStyles.activeBadgeText}>Current</Text>
                  </View>
                )}
                {lastUpdate && (
                  <Text style={timelineStyles.stepTime}>
                    {formatDateTime(lastUpdate.created_at || lastUpdate.updated_at)}
                  </Text>
                )}
              </View>
              {lastUpdate && lastUpdate.notes && (
                <Text style={timelineStyles.stepNotes}>{lastUpdate.notes}</Text>
              )}
              {isActive && (
                <Text style={timelineStyles.stepDesc}>{config.description}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const timelineStyles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  lineContainer: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: WHITE,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 20,
  },
  content: {
    flex: 1,
    paddingBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  stepTime: {
    fontSize: 9,
    color: TEXT_FAINT,
    marginLeft: 'auto',
  },
  stepNotes: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 2,
    marginLeft: 20,
    fontStyle: 'italic',
  },
  stepDesc: {
    fontSize: 11,
    color: TEXT_FAINT,
    marginTop: 2,
    marginLeft: 20,
  },
  activeBadge: {
    backgroundColor: BLUE_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: BLUE,
  },
  terminalContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  terminalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  terminalStatus: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  terminalMessage: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  terminalDate: {
    fontSize: 11,
    color: TEXT_FAINT,
    marginTop: 8,
  },
});

// ─────────────────────────────────────────────────────────
// APPLICATION CARD
// ─────────────────────────────────────────────────────────
const ApplicationCard = ({ application, onPress, onWithdraw }) => {
  const job = application.job_id || {};
  const client = job.client_id || {};
  const clientName = client.company_name || 
    `${client.first_name || ''} ${client.last_name || ''}`.trim() || 
    'Client';
  const status = application.status || 'pending';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isWithdrawable = ['pending', 'reviewed', 'shortlisted', 'interview'].includes(status);
  
  // Get budget - try multiple paths
  const budgetAmount = job.budget?.amount || job.budget || job.agreed_budget?.amount || 0;
  
  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={() => onPress(application)}
      activeOpacity={0.7}
    >
      <View style={[cardStyles.accentBar, { backgroundColor: config.color }]} />
      
      <View style={cardStyles.body}>
        <View style={cardStyles.header}>
          {client.profile_picture ? (
            <Image source={{ uri: client.profile_picture }} style={cardStyles.avatar} />
          ) : (
            <View style={cardStyles.logoBox}>
              <Ionicons name="person" size={18} color={BLUE} />
            </View>
          )}
          <View style={cardStyles.titleContent}>
            <Text style={cardStyles.jobTitle} numberOfLines={1}>{job.title || 'Untitled Job'}</Text>
            <View style={cardStyles.clientRow}>
              <Ionicons name="business-outline" size={12} color={TEXT_MUTED} />
              <Text style={cardStyles.clientName} numberOfLines={1}>{clientName}</Text>
            </View>
          </View>
        </View>
        
        <View style={cardStyles.details}>
          <View style={cardStyles.detailItem}>
            <Ionicons name="calendar-outline" size={12} color={TEXT_FAINT} />
            <Text style={cardStyles.detailText}>{timeAgo(application.created_at)}</Text>
          </View>
          <View style={cardStyles.detailItem}>
            <Ionicons name="cash-outline" size={12} color={TEXT_FAINT} />
            <Text style={cardStyles.detailText}>{formatCurrency(budgetAmount)}</Text>
          </View>
        </View>
        
        <View style={cardStyles.footer}>
          <StatusChip status={status} size="sm" />
          
          {isWithdrawable && (
            <TouchableOpacity
              style={cardStyles.withdrawBtn}
              onPress={() => onWithdraw(application)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-outline" size={14} color={DANGER} />
              <Text style={cardStyles.withdrawText}>Withdraw</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {has(job.required_skills) && job.required_skills.length > 0 && (
          <View style={cardStyles.skillsRow}>
            {job.required_skills.slice(0, 3).map((skill, index) => (
              <View key={index} style={cardStyles.skillTag}>
                <Text style={cardStyles.skillText}>{skill}</Text>
              </View>
            ))}
            {job.required_skills.length > 3 && (
              <Text style={cardStyles.moreSkills}>+{job.required_skills.length - 3}</Text>
            )}
          </View>
        )}
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
  accentBar: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 14,
    paddingLeft: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 10,
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
  titleContent: {
    flex: 1,
    minWidth: 0,
  },
  jobTitle: {
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
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
    paddingVertical: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: DANGER,
    backgroundColor: '#FDE8E9',
  },
  withdrawText: {
    fontSize: 10,
    fontWeight: '700',
    color: DANGER,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER_SOFT,
  },
  skillTag: {
    backgroundColor: OFFWHITE,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  skillText: {
    fontSize: 9,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 9,
    color: TEXT_FAINT,
    alignSelf: 'center',
    marginLeft: 2,
  },
});

// ─────────────────────────────────────────────────────────
// CONTRACT VIEW MODAL
// ─────────────────────────────────────────────────────────
const ContractViewModal = ({ visible, contract, onClose, onDownload, onGoToMyJobs }) => {
  if (!contract) return null;
  
  const isDraft = contract.status === 'draft';
  const isActive = contract.status === 'active';
  const isCompleted = contract.status === 'completed';
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={contractModalStyles.overlay}>
        <View style={contractModalStyles.sheet}>
          <View style={contractModalStyles.handle} />
          
          <View style={contractModalStyles.header}>
            <Text style={contractModalStyles.title}>Contract Details</Text>
            <TouchableOpacity 
              style={contractModalStyles.closeBtn} 
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={19} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Contract Status */}
            <View style={contractModalStyles.statusSection}>
              <View style={contractModalStyles.statusHeader}>
                <Text style={contractModalStyles.statusLabel}>Contract Status</Text>
                <View style={[
                  contractModalStyles.statusBadge,
                  isDraft && { backgroundColor: OFFWHITE, borderColor: BORDER },
                  isActive && { backgroundColor: '#E6F7EC', borderColor: '#B8E0CC' },
                  isCompleted && { backgroundColor: GOLD_LIGHT, borderColor: GOLD_LINE },
                ]}>
                  <Text style={[
                    contractModalStyles.statusBadgeText,
                    isDraft && { color: TEXT_MUTED },
                    isActive && { color: SUCCESS },
                    isCompleted && { color: GOLD_DARK },
                  ]}>
                    {isDraft ? 'Draft' : isActive ? 'Active' : isCompleted ? 'Completed' : contract.status || 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Contract Info */}
            <View style={contractModalStyles.infoSection}>
              <Text style={contractModalStyles.sectionTitle}>Contract Information</Text>
              
              <View style={contractModalStyles.infoRow}>
                <Text style={contractModalStyles.infoLabel}>Contract ID</Text>
                <Text style={contractModalStyles.infoValue}>#{String(contract._id).slice(-8).toUpperCase()}</Text>
              </View>
              
              <View style={contractModalStyles.infoRow}>
                <Text style={contractModalStyles.infoLabel}>Budget</Text>
                <Text style={contractModalStyles.infoValue}>{formatCurrency(contract.agreed_budget?.amount)}</Text>
              </View>
              
              <View style={contractModalStyles.infoRow}>
                <Text style={contractModalStyles.infoLabel}>Type</Text>
                <Text style={contractModalStyles.infoValue}>{contract.agreed_budget?.type || 'Fixed'}</Text>
              </View>
              
              <View style={contractModalStyles.infoRow}>
                <Text style={contractModalStyles.infoLabel}>Progress</Text>
                <View style={contractModalStyles.progressContainer}>
                  <View style={contractModalStyles.progressBar}>
                    <View style={[contractModalStyles.progressFill, { width: `${contract.progress || 0}%` }]} />
                  </View>
                  <Text style={contractModalStyles.progressText}>{contract.progress || 0}%</Text>
                </View>
              </View>
              
              <View style={contractModalStyles.infoRow}>
                <Text style={contractModalStyles.infoLabel}>Start Date</Text>
                <Text style={contractModalStyles.infoValue}>{formatDate(contract.start_date)}</Text>
              </View>
              
              {contract.end_date && (
                <View style={contractModalStyles.infoRow}>
                  <Text style={contractModalStyles.infoLabel}>End Date</Text>
                  <Text style={contractModalStyles.infoValue}>{formatDate(contract.end_date)}</Text>
                </View>
              )}
              
              {contract.terms && (
                <View style={contractModalStyles.termsSection}>
                  <Text style={contractModalStyles.termsLabel}>Terms & Conditions</Text>
                  <Text style={contractModalStyles.termsText}>{contract.terms}</Text>
                </View>
              )}
            </View>
            
            {/* Documents Section */}
            {has(contract.contract_documents) && contract.contract_documents.length > 0 && (
              <View style={contractModalStyles.documentsSection}>
                <Text style={contractModalStyles.sectionTitle}>Documents</Text>
                {contract.contract_documents.map((doc, index) => (
                  <View key={doc._id || index} style={contractModalStyles.documentItem}>
                    <View style={contractModalStyles.documentIcon}>
                      <Ionicons name="document-text" size={18} color={BLUE} />
                    </View>
                    <View style={contractModalStyles.documentContent}>
                      <Text style={contractModalStyles.documentName}>{doc.file_name || 'Document'}</Text>
                      <Text style={contractModalStyles.documentDate}>
                        {formatDate(doc.uploaded_at || doc.created_at)}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={contractModalStyles.documentDownload}
                      onPress={() => onDownload(doc)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="download-outline" size={18} color={BLUE} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            {isDraft && (
              <View style={contractModalStyles.draftNotice}>
                <Ionicons name="information-circle" size={20} color={TEXT_FAINT} />
                <Text style={contractModalStyles.draftNoticeText}>
                  This contract is still in draft. It will become active once signed by both parties.
                </Text>
              </View>
            )}
            
            {/* Go to MyJobs Button */}
            {(isActive || isCompleted) && (
              <TouchableOpacity
                style={contractModalStyles.goToJobsBtn}
                onPress={onGoToMyJobs}
                activeOpacity={0.8}
              >
                <Ionicons name="briefcase-outline" size={20} color={WHITE} />
                <Text style={contractModalStyles.goToJobsText}>
                  Go to My Jobs
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const contractModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,34,71,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
    borderTopWidth: 1,
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
    fontSize: 16.5,
    fontWeight: '800',
    color: TEXT_MAIN,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: OFFWHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSection: {
    marginTop: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TEXT_MAIN,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SOFT,
  },
  infoLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    color: TEXT_MAIN,
    fontWeight: '500',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
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
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MAIN,
    minWidth: 36,
  },
  termsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  termsLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '600',
    marginBottom: 4,
  },
  termsText: {
    fontSize: 12,
    color: TEXT_MAIN,
    lineHeight: 18,
  },
  documentsSection: {
    marginTop: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OFFWHITE,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 8,
  },
  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: BLUE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentContent: {
    flex: 1,
    minWidth: 0,
  },
  documentName: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  documentDate: {
    fontSize: 10,
    color: TEXT_FAINT,
    marginTop: 1,
  },
  documentDownload: {
    padding: 4,
  },
  draftNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: OFFWHITE,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 16,
    marginBottom: 24,
  },
  draftNoticeText: {
    flex: 1,
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  goToJobsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: BLUE,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  goToJobsText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
});

// ─────────────────────────────────────────────────────────
// APPLICATION DETAIL MODAL
// ─────────────────────────────────────────────────────────
const ApplicationDetailModal = ({
  application,
  visible,
  onClose,
  onViewContract,
  onWithdraw,
  onGoToMyJobs,
  contract,
  contractLoading,
}) => {
  if (!application) return null;
  
  const job = application.job_id || {};
  const client = job.client_id || {};
  const clientName = client.company_name ||
    `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
    'Client';
  const status = application.status || 'pending';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  
  const isWithdrawable = ['pending', 'reviewed', 'shortlisted', 'interview'].includes(status);
  const isHired = status === 'hired';
  const isCompleted = status === 'completed';
  const hasContract = contract && contract._id;
  const isContractActive = contract?.status === 'active';
  const isContractCompleted = contract?.status === 'completed';
  
  // Parse history from application
  const history = application.status_history || [];
  
  // Get interview details - show even if status is past interview
  const interviewData = application.interview || {};
  const hasInterview = has(interviewData);
  
  // Get offer details - show even if status is past offered
  const offerData = application.offer || {};
  const hasOffer = has(offerData);
  
  const locationText = formatLocation(job.location);
  
  // Get budget
  const budgetAmount = job.budget?.amount || job.budget || job.agreed_budget?.amount || 0;
  
  // Check if interview is in history (status was at interview at some point)
  const wasInterview = history.some(h => h.status === 'interview');
  const wasOffered = history.some(h => h.status === 'offered');
  
  // Get the interview and offer data from history if available
  const interviewHistory = history.find(h => h.status === 'interview');
  const offerHistory = history.find(h => h.status === 'offered');
  
  // Use data from history if available, otherwise from application
  const finalInterviewData = interviewHistory?.data || interviewData;
  const finalOfferData = offerHistory?.data || offerData;
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Application Details</Text>
            <TouchableOpacity 
              style={modalStyles.closeBtn} 
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={19} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Job Info */}
            <View style={modalStyles.jobSection}>
              <View style={modalStyles.jobHeader}>
                {client.profile_picture ? (
                  <Image source={{ uri: client.profile_picture }} style={modalStyles.jobAvatar} />
                ) : (
                  <View style={modalStyles.jobAvatarBox}>
                    <Ionicons name="person" size={24} color={WHITE} />
                  </View>
                )}
                <View style={modalStyles.jobTitleContent}>
                  <Text style={modalStyles.jobTitle}>{job.title || 'Untitled Job'}</Text>
                  <View style={modalStyles.clientInfo}>
                    <Ionicons name="business-outline" size={14} color={TEXT_MUTED} />
                    <Text style={modalStyles.clientName}>{clientName}</Text>
                  </View>
                </View>
              </View>
              
              <View style={modalStyles.jobMeta}>
                <View style={modalStyles.metaItem}>
                  <Ionicons name="cash-outline" size={14} color={TEXT_FAINT} />
                  <Text style={modalStyles.metaText}>{formatCurrency(budgetAmount)}</Text>
                </View>
                <View style={modalStyles.metaDivider} />
                <View style={modalStyles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={TEXT_FAINT} />
                  <Text style={modalStyles.metaText}>Posted {timeAgo(job.created_at)}</Text>
                </View>
                <View style={modalStyles.metaDivider} />
                <View style={modalStyles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={TEXT_FAINT} />
                  <Text style={modalStyles.metaText}>{locationText}</Text>
                </View>
              </View>
              
              {job.category && (
                <View style={modalStyles.categoryContainer}>
                  <Ionicons name="pricetag-outline" size={12} color={TEXT_FAINT} />
                  <Text style={modalStyles.categoryText}>{job.category}</Text>
                </View>
              )}
            </View>
            
            {/* Status Timeline with Full History */}
            <View style={modalStyles.statusSection}>
              <View style={modalStyles.statusHeader}>
                <Text style={modalStyles.sectionTitle}>Application History</Text>
                <StatusChip status={status} />
              </View>
              <StatusTimeline currentStatus={status} history={history} />
            </View>
            
            {/* Interview Details - Show if status is interview OR was interview in history */}
            {(status === 'interview' || wasInterview) && hasInterview && (
              <View style={modalStyles.detailSection}>
                <Text style={modalStyles.sectionTitle}>Interview Details</Text>
                <View style={modalStyles.detailCard}>
                  {finalInterviewData.scheduled_date && (
                    <View style={modalStyles.detailRow}>
                      <Ionicons name="calendar-outline" size={14} color={TEXT_MUTED} />
                      <Text style={modalStyles.detailText}>
                        {formatDateTime(finalInterviewData.scheduled_date)}
                      </Text>
                    </View>
                  )}
                  {finalInterviewData.platform && (
                    <View style={modalStyles.detailRow}>
                      <Ionicons name="phone-portrait-outline" size={14} color={TEXT_MUTED} />
                      <Text style={modalStyles.detailText}>Platform: {finalInterviewData.platform}</Text>
                    </View>
                  )}
                  {finalInterviewData.link && (
                    <TouchableOpacity 
                      style={modalStyles.detailRow}
                      onPress={() => Linking.openURL(finalInterviewData.link)}
                    >
                      <Ionicons name="link-outline" size={14} color={BLUE} />
                      <Text style={[modalStyles.detailText, { color: BLUE, textDecorationLine: 'underline' }]}>
                        Join Interview Link
                      </Text>
                    </TouchableOpacity>
                  )}
                  {finalInterviewData.notes && (
                    <View style={modalStyles.detailRow}>
                      <Ionicons name="document-text-outline" size={14} color={TEXT_MUTED} />
                      <Text style={modalStyles.detailText}>{finalInterviewData.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            {/* Offer Details - Show if status is offered OR was offered in history */}
            {(status === 'offered' || wasOffered) && hasOffer && (
              <View style={modalStyles.detailSection}>
                <Text style={modalStyles.sectionTitle}>Offer Details</Text>
                <View style={modalStyles.detailCard}>
                  {finalOfferData.amount && (
                    <View style={modalStyles.detailRow}>
                      <Ionicons name="cash-outline" size={14} color={SUCCESS} />
                      <Text style={[modalStyles.detailText, { fontWeight: '700', color: SUCCESS }]}>
                        {formatCurrency(finalOfferData.amount)}
                      </Text>
                    </View>
                  )}
                  {finalOfferData.message && (
                    <View style={modalStyles.detailRow}>
                      <Ionicons name="chatbubble-outline" size={14} color={TEXT_MUTED} />
                      <Text style={modalStyles.detailText}>{finalOfferData.message}</Text>
                    </View>
                  )}
                  {finalOfferData.valid_until && (
                    <View style={modalStyles.detailRow}>
                      <Ionicons name="time-outline" size={14} color={TEXT_MUTED} />
                      <Text style={modalStyles.detailText}>
                        Valid until: {formatDateTime(finalOfferData.valid_until)}
                      </Text>
                    </View>
                  )}
                  {finalOfferData.notes && (
                    <View style={modalStyles.detailRow}>
                      <Ionicons name="document-text-outline" size={14} color={TEXT_MUTED} />
                      <Text style={modalStyles.detailText}>{finalOfferData.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            {/* Job Description */}
            {has(job.description) && (
              <View style={modalStyles.descriptionSection}>
                <Text style={modalStyles.sectionTitle}>Job Description</Text>
                <Text style={modalStyles.descriptionText}>{job.description}</Text>
              </View>
            )}
            
            {/* Skills */}
            {has(job.required_skills) && job.required_skills.length > 0 && (
              <View style={modalStyles.skillsSection}>
                <Text style={modalStyles.sectionTitle}>Required Skills</Text>
                <View style={modalStyles.skillsContainer}>
                  {job.required_skills.map((skill, index) => (
                    <View key={index} style={modalStyles.skillChip}>
                      <Text style={modalStyles.skillChipText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Client Information - Full Details */}
            <View style={modalStyles.clientSection}>
              <Text style={modalStyles.sectionTitle}>Client Information</Text>
              <View style={modalStyles.clientCard}>
                <View style={modalStyles.clientCardHeader}>
                  {client.profile_picture ? (
                    <Image source={{ uri: client.profile_picture }} style={modalStyles.clientAvatarLarge} />
                  ) : (
                    <View style={modalStyles.clientAvatarLargeBox}>
                      <Ionicons name="person" size={28} color={WHITE} />
                    </View>
                  )}
                  <View style={modalStyles.clientCardContent}>
                    <Text style={modalStyles.clientCardName}>{clientName}</Text>
                    {client.company_name && (
                      <Text style={modalStyles.clientCardCompany}>{client.company_name}</Text>
                    )}
                    <View style={modalStyles.clientCardContact}>
                      {has(client.email) && (
                        <View style={modalStyles.contactItem}>
                          <Ionicons name="mail-outline" size={12} color={TEXT_MUTED} />
                          <Text style={modalStyles.contactText}>{client.email}</Text>
                        </View>
                      )}
                      {has(client.phone) && (
                        <View style={modalStyles.contactItem}>
                          <Ionicons name="call-outline" size={12} color={TEXT_MUTED} />
                          <Text style={modalStyles.contactText}>{client.phone}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                {has(client.bio) && (
                  <View style={modalStyles.clientBioContainer}>
                    <Text style={modalStyles.clientBioLabel}>About</Text>
                    <Text style={modalStyles.clientBio}>{client.bio}</Text>
                  </View>
                )}
                
                {has(client.location) && (
                  <View style={modalStyles.clientLocation}>
                    <Ionicons name="location-outline" size={12} color={TEXT_FAINT} />
                    <Text style={modalStyles.clientLocationText}>{formatLocation(client.location)}</Text>
                  </View>
                )}
                
                {client.website && (
                  <TouchableOpacity 
                    style={modalStyles.clientWebsite}
                    onPress={() => Linking.openURL(client.website)}
                  >
                    <Ionicons name="globe-outline" size={12} color={BLUE} />
                    <Text style={modalStyles.clientWebsiteText}>{client.website}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Application Meta - Removed "Applied On" label */}
            <View style={modalStyles.metaSection}>
              <Text style={modalStyles.sectionTitle}>Application Info</Text>
              <View style={modalStyles.metaRow}>
                <Text style={modalStyles.metaValue}>{formatDateTime(application.created_at)}</Text>
              </View>
              <View style={modalStyles.metaRow}>
                <Text style={modalStyles.metaLabel}>Application ID</Text>
                <Text style={modalStyles.metaValue}>#{String(application._id).slice(-8).toUpperCase()}</Text>
              </View>
              {application.updated_at && (
                <View style={modalStyles.metaRow}>
                  <Text style={modalStyles.metaLabel}>Last Updated</Text>
                  <Text style={modalStyles.metaValue}>{timeAgo(application.updated_at)}</Text>
                </View>
              )}
              {application.cover_letter && (
                <View style={modalStyles.coverLetterSection}>
                  <Text style={modalStyles.coverLetterLabel}>Cover Letter</Text>
                  <Text style={modalStyles.coverLetterText}>{application.cover_letter}</Text>
                </View>
              )}
            </View>
            
            {/* Contract Section */}
            {(isHired || isCompleted) && (
              <View style={modalStyles.contractSection}>
                <Text style={modalStyles.sectionTitle}>Contract</Text>
                {contractLoading ? (
                  <View style={modalStyles.contractLoading}>
                    <ActivityIndicator size="small" color={BLUE} />
                    <Text style={modalStyles.contractLoadingText}>Loading contract...</Text>
                  </View>
                ) : hasContract ? (
                  <TouchableOpacity
                    style={modalStyles.contractCard}
                    onPress={() => onViewContract(contract)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      modalStyles.contractIcon,
                      { backgroundColor: isContractActive ? SUCCESS : isContractCompleted ? GOLD_DARK : BLUE },
                    ]}>
                      <Ionicons name="document-text" size={20} color={WHITE} />
                    </View>
                    <View style={modalStyles.contractContent}>
                      <Text style={modalStyles.contractTitle}>
                        {isContractActive ? 'Active Contract' : 
                         isContractCompleted ? 'Completed Contract' : 
                         'View Contract'}
                      </Text>
                      <Text style={modalStyles.contractSubtitle}>
                        {contract.agreed_budget?.amount 
                          ? `${formatCurrency(contract.agreed_budget.amount)} · ${contract.progress || 0}% complete`
                          : 'Click to view details'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={TEXT_FAINT} />
                  </TouchableOpacity>
                ) : (
                  <View style={modalStyles.noContract}>
                    <Ionicons name="document-text-outline" size={24} color={TEXT_FAINT} />
                    <Text style={modalStyles.noContractText}>No contract found</Text>
                    <Text style={modalStyles.noContractSubtext}>
                      Contract will appear here once created by the client
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Go to My Jobs Button - for hired/completed */}
            {(isHired || isCompleted) && hasContract && (
              <TouchableOpacity
                style={modalStyles.goToJobsBtn}
                onPress={onGoToMyJobs}
                activeOpacity={0.8}
              >
                <Ionicons name="briefcase-outline" size={20} color={WHITE} />
                <Text style={modalStyles.goToJobsBtnText}>
                  Go to My Jobs
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Action Buttons */}
            <View style={modalStyles.actions}>
              {isWithdrawable && (
                <TouchableOpacity
                  style={modalStyles.withdrawAction}
                  onPress={() => {
                    onClose();
                    onWithdraw(application);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-outline" size={16} color={DANGER} />
                  <Text style={modalStyles.withdrawActionText}>Withdraw Application</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,34,71,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
    borderTopWidth: 1,
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
    fontSize: 16.5,
    fontWeight: '800',
    color: TEXT_MAIN,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: OFFWHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobSection: {
    marginTop: 16,
    padding: 14,
    backgroundColor: OFFWHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  jobAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobTitleContent: {
    flex: 1,
    minWidth: 0,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_MAIN,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clientName: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: BORDER,
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  categoryText: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  statusSection: {
    marginTop: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TEXT_MAIN,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  detailSection: {
    marginTop: 16,
  },
  detailCard: {
    backgroundColor: OFFWHITE,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 12,
    color: TEXT_MUTED,
    flexWrap: 'wrap',
  },
  descriptionSection: {
    marginTop: 16,
  },
  descriptionText: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 20,
  },
  skillsSection: {
    marginTop: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: BLUE_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BLUE_LINE,
  },
  skillChipText: {
    fontSize: 11,
    color: BLUE_DARK,
    fontWeight: '600',
  },
  clientSection: {
    marginTop: 16,
  },
  clientCard: {
    backgroundColor: OFFWHITE,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  clientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  clientAvatarLargeBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientCardContent: {
    flex: 1,
    minWidth: 0,
  },
  clientCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  clientCardCompany: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  clientCardContact: {
    marginTop: 4,
    gap: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  clientBioContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  clientBioLabel: {
    fontSize: 10,
    color: TEXT_FAINT,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  clientBio: {
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  clientLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  clientLocationText: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  clientWebsite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  clientWebsiteText: {
    fontSize: 11,
    color: BLUE,
    textDecorationLine: 'underline',
  },
  metaSection: {
    marginTop: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SOFT,
  },
  metaLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12,
    color: TEXT_MAIN,
    fontWeight: '500',
  },
  coverLetterSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  coverLetterLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '600',
    marginBottom: 4,
  },
  coverLetterText: {
    fontSize: 12,
    color: TEXT_MAIN,
    lineHeight: 18,
  },
  contractSection: {
    marginTop: 16,
  },
  contractLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  contractLoadingText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  contractCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OFFWHITE,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  contractIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contractContent: {
    flex: 1,
    minWidth: 0,
  },
  contractTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  contractSubtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  noContract: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: OFFWHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  noContractText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '600',
    marginTop: 8,
  },
  noContractSubtext: {
    fontSize: 11,
    color: TEXT_FAINT,
    marginTop: 4,
    textAlign: 'center',
  },
  goToJobsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: BLUE,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  goToJobsBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
  actions: {
    marginTop: 16,
    marginBottom: 24,
  },
  withdrawAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DANGER,
    backgroundColor: '#FDE8E9',
  },
  withdrawActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: DANGER,
  },
});

// ─────────────────────────────────────────────────────────
// BOTTOM TAB BAR
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
          const isApplications = tab.key === 'MyApplications';

          return (
            <TouchableOpacity
              key={tab.key}
              style={[tabStyles.tabItem, isApplications && tabStyles.tabItemCenter]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              {isApplications ? (
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
    marginTop: -14,
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: GOLD_LINE,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  centerButtonActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  tabIconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: TEXT_FAINT,
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
    backgroundColor: GOLD,
  },
});

// ─────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────
export default function MyApplications({ navigation, route, onNavigate: propNavigate }) {
  const dispatch = useDispatch();
  
  const applications = useSelector(selectAllApplications) || [];
  const isLoading = useSelector(selectApplicationsLoading) || false;
  const error = useSelector(selectApplicationsError) || null;
  const totalCount = useSelector(selectApplicationsTotal) || 0;
  const selectedApplication = useSelector(selectSelectedApplication) || null;
  const stats = useSelector(selectApplicationStats) || {};
  const contract = useSelector(selectSelectedContract) || null;
  const contractLoading = useSelector(selectContractsLoading) || false;
  
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const statusOptions = useMemo(() => {
    const statuses = ['All', ...new Set(applications.map(app => app.status).filter(Boolean))];
    return statuses;
  }, [applications]);
  
  const filteredApplications = useMemo(() => {
    if (statusFilter === 'All') return applications;
    return applications.filter(app => app.status === statusFilter);
  }, [applications, statusFilter]);
  
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
  
  const fetchApplications = useCallback(async (reset = true) => {
    try {
      const currentPage = reset ? 1 : page;
      const result = await dispatch(getFreelancerApplications({ 
        status: statusFilter === 'All' ? undefined : statusFilter,
        page: currentPage,
        limit: 20,
      })).unwrap();
      
      if (reset) {
        setPage(1);
        setHasMore(result.applications.length === 20);
      } else {
        setPage(currentPage + 1);
        setHasMore(result.applications.length === 20);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  }, [dispatch, statusFilter, page]);
  
  useEffect(() => {
    fetchApplications(true);
  }, []);
  
  useEffect(() => {
    if (statusFilter) {
      fetchApplications(true);
    }
  }, [statusFilter]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchApplications(true);
    setRefreshing(false);
  }, [fetchApplications]);
  
  const handleApplicationPress = async (application) => {
    setSelectedApp(application);
    setShowDetailModal(true);
    
    try {
      await dispatch(getApplicationById(application._id)).unwrap();
      
      // Only fetch contract if hired or completed
      if (application.status === 'hired' || application.status === 'completed') {
        try {
          const result = await dispatch(getContractByApplication(application._id)).unwrap();
          if (result.contract) {
            setSelectedContract(result.contract);
          }
        } catch (contractErr) {
          // Contract not found - show friendly message
          console.log('No contract found for this application');
        }
      }
    } catch (err) {
      console.error('Error fetching application details:', err);
      if (err.message && !err.message.includes('Contract not found')) {
        Alert.alert('Error', 'Failed to load application details');
      }
    }
  };
  
  const handleViewContract = async (contractData) => {
    setShowDetailModal(false);
    try {
      // Fetch full contract details with documents
      const result = await dispatch(getContractById(contractData._id)).unwrap();
      if (result.contract) {
        setSelectedContract(result.contract);
        setShowContractModal(true);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load contract details');
    }
  };
  
  const handleGoToMyJobs = () => {
    // Close modals and navigate to MyJobs
    setShowDetailModal(false);
    setShowContractModal(false);
    setSelectedApp(null);
    setSelectedContract(null);
    
    // Navigate to MyJobs
    handleNavigate('MyJobs', { activeTab: 'MyJobs' });
  };
  
  const handleDownloadDocument = (doc) => {
    Alert.alert(
      'Download Document',
      `Download "${doc.file_name || 'document'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: () => {
            // Handle download - open URL or share
            if (doc.url) {
              Linking.openURL(doc.url);
            } else {
              Alert.alert('Info', 'Document URL not available');
            }
          }
        },
      ]
    );
  };
  
  const handleWithdraw = (application) => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(withdrawApplication({
                applicationId: application._id,
                reason: 'Withdrawn by freelancer'
              })).unwrap();
              Alert.alert('Success', 'Application withdrawn successfully');
              fetchApplications(true);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to withdraw application');
            }
          },
        },
      ]
    );
  };
  
  const handleTabBarPress = (key) => {
    const returnState = { activeTab: 'MyApplications' };
    if (key === 'FreelancerDashboard') {
      handleNavigate('FreelancerDashboard', { returnState });
    } else if (key === 'Messages') {
      handleNavigate('Messages', { returnState });
    } else if (key === 'MyJobs') {
      handleNavigate('MyJobs', { returnState });
    } else if (key === 'Profile') {
      handleNavigate('FreelancerProfile', { returnState });
    } else if (key === 'MyApplications') {
      fetchApplications(true);
    } else {
      console.warn('No screen mapping for tab:', key);
    }
  };
  
  const handleBack = () => {
    if (navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (propNavigate) {
      propNavigate('FreelancerDashboard', { activeTab: 'MyApplications' });
    } else if (route?.params?.onNavigate) {
      route.params.onNavigate('FreelancerDashboard', { activeTab: 'MyApplications' });
    } else {
      handleNavigate('FreelancerDashboard', { activeTab: 'MyApplications' });
    }
  };
  
  // Render loading state
  if (isLoading && !refreshing && applications.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.root}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My <Text style={styles.gold}>Applications</Text></Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.loadingText}>Loading your applications...</Text>
          </View>
        </View>
        <BottomTabBar activeTab="MyApplications" onTabPress={handleTabBarPress} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My <Text style={styles.gold}>Applications</Text></Text>
          <View style={{ width: 36 }} />
        </View>
        
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total || applications.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: BLUE }]}>{stats.pending || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: GOLD_DARK }]}>{stats.interview || 0}</Text>
            <Text style={styles.statLabel}>Interview</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: SUCCESS }]}>{stats.hired || 0}</Text>
            <Text style={styles.statLabel}>Hired</Text>
          </View>
        </View>
        
        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterTabs}
        >
          {statusOptions.map(status => {
            const count = status === 'All' 
              ? applications.length 
              : applications.filter(app => app.status === status).length;
            const config = status === 'All' 
              ? { label: 'All', color: TEXT_MAIN } 
              : STATUS_CONFIG[status] || { label: status, color: TEXT_MUTED };
            
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterTab,
                  statusFilter === status && styles.filterTabActive,
                ]}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterTabText,
                  statusFilter === status && styles.filterTabTextActive,
                ]}>
                  {config.label}
                </Text>
                {count > 0 && (
                  <View style={[
                    styles.filterBadge,
                    statusFilter === status && styles.filterBadgeActive,
                  ]}>
                    <Text style={[
                      styles.filterBadgeText,
                      statusFilter === status && styles.filterBadgeTextActive,
                    ]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Applications List */}
        <FlatList
          data={filteredApplications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ApplicationCard
              application={item}
              onPress={handleApplicationPress}
              onWithdraw={handleWithdraw}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
          }
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="checkmark-circle-outline" size={32} color={TEXT_FAINT} />
              </View>
              <Text style={styles.emptyTitle}>
                {statusFilter === 'All' ? 'No applications yet' : `No ${statusFilter} applications`}
              </Text>
              <Text style={styles.emptyDesc}>
                {statusFilter === 'All'
                  ? 'Start applying for jobs to see your applications here.'
                  : `You don't have any ${statusFilter} applications at the moment.`}
              </Text>
              {statusFilter === 'All' && (
                <TouchableOpacity
                  style={styles.browseBtn}
                  onPress={() => handleNavigate('ExploreJobs')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.browseBtnText}>Browse Jobs</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasMore && !isLoading) {
              fetchApplications(false);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={() => {
            if (isLoading && applications.length > 0) {
              return (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={BLUE} />
                </View>
              );
            }
            return null;
          }}
        />
      </View>
      
      <BottomTabBar activeTab="MyApplications" onTabPress={handleTabBarPress} />
      
      {/* Detail Modal */}
      <ApplicationDetailModal
        application={selectedApp}
        visible={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedApp(null);
        }}
        onViewContract={handleViewContract}
        onWithdraw={handleWithdraw}
        onGoToMyJobs={handleGoToMyJobs}
        contract={selectedContract}
        contractLoading={contractLoading}
      />
      
      {/* Contract View Modal */}
      <ContractViewModal
        visible={showContractModal}
        contract={selectedContract}
        onClose={() => {
          setShowContractModal(false);
          setSelectedContract(null);
        }}
        onDownload={handleDownloadDocument}
        onGoToMyJobs={handleGoToMyJobs}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: NAVY,
  },
  root: {
    flex: 1,
    backgroundColor: OFFWHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: NAVY,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 0.2,
  },
  gold: {
    color: GOLD,
    fontWeight: '800',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OFFWHITE,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: TEXT_MUTED,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_MAIN,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: TEXT_FAINT,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: BORDER,
  },
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
    borderRadius: 8,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterTabActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: GOLD,
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  filterBadgeTextActive: {
    color: NAVY,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 80,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: TEXT_MAIN,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: TEXT_FAINT,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});