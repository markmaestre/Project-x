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
  TextInput,
  Image,
  StatusBar,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

import {
  getClientApplications,
  updateApplicationStatus,
} from '../../Redux/slices/applicationSlice';

import {
  getClientContracts,
  updateContractProgress,
  updateContractStatus,
} from '../../Redux/slices/contractSlice';

import { getJobProgress } from '../../Redux/slices/jobSlice';

const NAVY = '#071A3E';
const BLUE = '#0055A5';
const BLUE_MD = '#0073CF';
const GOLD = '#C89520';
const GOLD_LT = '#E8B84B';
const GOLD_DK = '#8A6410';
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
const ORANGE = '#F97316';
const YELLOW = '#F59E0B';

const { width } = Dimensions.get('window');

// Status colors and icons
const STATUS_CONFIG = {
  'active': { color: GREEN, icon: 'play-circle', label: 'Active' },
  'paused': { color: YELLOW, icon: 'pause-circle', label: 'Paused' },
  'completed': { color: BLUE, icon: 'checkmark-done-circle', label: 'Completed' },
  'cancelled': { color: RED, icon: 'close-circle', label: 'Cancelled' },
  'in_progress': { color: GREEN, icon: 'construct', label: 'In Progress' },
  'in_review': { color: YELLOW, icon: 'eye', label: 'In Review' },
};

const getStatusInfo = (status) => {
  return STATUS_CONFIG[status] || { color: TEXT_MUTED, icon: 'help-circle', label: status || 'Unknown' };
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateString);
};

// ── Progress Bar Component ──────────────────────────────────────────────────
const ProgressBar = ({ progress, size = 'medium' }) => {
  const isSmall = size === 'small';
  const height = isSmall ? 6 : 10;
  const width = isSmall ? 60 : '100%';
  
  const getColor = (value) => {
    if (value < 30) return RED;
    if (value < 60) return YELLOW;
    if (value < 90) return BLUE;
    return GREEN;
  };

  return (
    <View style={[pb.container, { height, width }]}>
      <View 
        style={[
          pb.fill, 
          { 
            width: `${Math.min(progress || 0, 100)}%`,
            backgroundColor: getColor(progress || 0),
            height,
          }
        ]} 
      />
    </View>
  );
};

const pb = StyleSheet.create({
  container: {
    backgroundColor: BG,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  fill: {
    borderRadius: 10,
  },
});

// ── Rating Stars ──────────────────────────────────────────────────────────
const RatingStars = ({ rating = 0, size = 14 }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const stars = [];
  
  for (let i = 0; i < full; i++) {
    stars.push(<Ionicons key={'f' + i} name="star" size={size} color={GOLD} />);
  }
  if (half) {
    stars.push(<Ionicons key="h" name="star-half" size={size} color={GOLD} />);
  }
  for (let i = 0; i < empty; i++) {
    stars.push(<Ionicons key={'e' + i} name="star-outline" size={size} color={GOLD} />);
  }
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {stars}
      {rating > 0 && (
        <Text style={{ fontSize: 11, fontWeight: '600', color: GOLD_DK, marginLeft: 4 }}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

// ── Update Modal ──────────────────────────────────────────────────────────
const UpdateModal = ({ visible, contract, onClose, onUpdate }) => {
  const [progress, setProgress] = useState(contract?.progress || 0);
  const [status, setStatus] = useState(contract?.status || 'active');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract) {
      setProgress(contract.progress || 0);
      setStatus(contract.status || 'active');
    }
  }, [contract]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await onUpdate(contract._id, { progress, status, notes });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={um.overlay}>
        <View style={um.sheet}>
          <View style={um.header}>
            <Text style={um.title}>Update Progress</Text>
            <TouchableOpacity onPress={onClose} style={um.closeBtn}>
              <Ionicons name="close" size={22} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView style={um.content} showsVerticalScrollIndicator={false}>
            {contract?.freelancer_id && (
              <View style={um.freelancerInfo}>
                <View style={um.avatar}>
                  {contract.freelancer_id.profile_picture ? (
                    <Image source={{ uri: contract.freelancer_id.profile_picture }} style={um.avatarImg} />
                  ) : (
                    <Text style={um.avatarText}>
                      {(contract.freelancer_id.first_name || '')[0]}{(contract.freelancer_id.last_name || '')[0]}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={um.freelancerName}>
                    {contract.freelancer_id.first_name} {contract.freelancer_id.last_name}
                  </Text>
                  <Text style={um.jobTitle}>{contract.job_id?.title || 'Contract'}</Text>
                </View>
              </View>
            )}

            <View style={um.field}>
              <Text style={um.label}>Progress</Text>
              <View style={um.progressRow}>
                <View style={{ flex: 1 }}>
                  <ProgressBar progress={progress} />
                </View>
                <Text style={um.progressText}>{progress}%</Text>
              </View>
              <View style={um.progressButtons}>
                {[0, 25, 50, 75, 100].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[um.progressBtn, progress === p && um.progressBtnActive]}
                    onPress={() => setProgress(p)}
                  >
                    <Text style={[um.progressBtnText, progress === p && um.progressBtnTextActive]}>
                      {p}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={um.field}>
              <Text style={um.label}>Status</Text>
              <View style={um.statusButtons}>
                {['active', 'paused', 'completed'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[um.statusBtn, status === s && um.statusBtnActive]}
                    onPress={() => setStatus(s)}
                  >
                    <Ionicons 
                      name={getStatusInfo(s).icon} 
                      size={16} 
                      color={status === s ? WHITE : getStatusInfo(s).color} 
                    />
                    <Text style={[um.statusBtnText, status === s && um.statusBtnTextActive]}>
                      {getStatusInfo(s).label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={um.field}>
              <Text style={um.label}>Notes (Optional)</Text>
              <TextInput
                style={um.input}
                placeholder="Add notes about progress..."
                placeholderTextColor={TEXT_LIGHT}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[um.updateBtn, loading && um.updateBtnDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color={WHITE} />
                  <Text style={um.updateBtnText}>Update Progress</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const um = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,26,62,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_MAIN,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  freelancerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BG,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  freelancerName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  jobTitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
    minWidth: 40,
    textAlign: 'right',
  },
  progressButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  progressBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
  },
  progressBtnActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  progressBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  progressBtnTextActive: {
    color: WHITE,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  statusBtnActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  statusBtnTextActive: {
    color: WHITE,
  },
  input: {
    backgroundColor: BG,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT_MAIN,
    borderWidth: 1.5,
    borderColor: BORDER,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  updateBtnDisabled: {
    opacity: 0.6,
  },
  updateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
});

// ── Main Component ─────────────────────────────────────────────────────────
export default function HiredFreelancers({ navigation }) {
  const dispatch = useDispatch();
  const { applications } = useSelector((state) => state.applications);
  const { contracts } = useSelector((state) => state.contracts);
  
  const [hiredFreelancers, setHiredFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, completed
  
  // Load hired freelancers
  const loadHiredFreelancers = useCallback(async () => {
    setLoading(true);
    try {
      // Get all applications with 'hired' status
      await dispatch(getClientApplications({ status: 'hired', limit: 100 })).unwrap();
      
      // Get all contracts for the client
      await dispatch(getClientContracts({ limit: 100 })).unwrap();
    } catch (error) {
      console.error('Error loading hired freelancers:', error);
      Alert.alert('Error', 'Failed to load hired freelancers');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Combine applications and contracts data
  useEffect(() => {
    if (applications.length > 0 && contracts.length > 0) {
      const hired = applications
        .filter(app => app.status === 'hired')
        .map(app => {
          // Find matching contract
          const contract = contracts.find(c => 
            c.application_id === app._id || 
            c.application_id?._id === app._id
          );
          
          return {
            ...app,
            contract: contract || null,
            progress: contract?.progress || 0,
            contractStatus: contract?.status || 'active',
          };
        });
      
      setHiredFreelancers(hired);
    }
  }, [applications, contracts]);

  useFocusEffect(
    useCallback(() => {
      loadHiredFreelancers();
    }, [loadHiredFreelancers])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHiredFreelancers();
    setRefreshing(false);
  }, [loadHiredFreelancers]);

  const handleUpdateProgress = async (contractId, data) => {
    try {
      // Update contract progress
      await dispatch(updateContractProgress({
        contractId,
        progress: data.progress,
      })).unwrap();
      
      // Update contract status if changed
      if (data.status) {
        await dispatch(updateContractStatus({
          contractId,
          status: data.status,
        })).unwrap();
      }
      
      // Refresh data
      await loadHiredFreelancers();
      
      Alert.alert('Success', 'Progress updated successfully!');
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  };

  const handleViewContract = (contractId) => {
    navigation?.navigate('ContractDetails', { contractId });
  };

  const handleMessageFreelancer = (freelancerId) => {
    navigation?.navigate('Messages', { userId: freelancerId, userRole: 'freelancer' });
  };

  // Filter freelancers
  const filteredFreelancers = hiredFreelancers.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'active') return item.contractStatus === 'active' || item.contractStatus === 'in_progress';
    if (filter === 'completed') return item.contractStatus === 'completed';
    return true;
  });

  // Stats
  const totalHired = hiredFreelancers.length;
  const activeCount = hiredFreelancers.filter(f => 
    f.contractStatus === 'active' || f.contractStatus === 'in_progress'
  ).length;
  const completedCount = hiredFreelancers.filter(f => f.contractStatus === 'completed').length;
  const avgProgress = hiredFreelancers.length > 0 
    ? Math.round(hiredFreelancers.reduce((sum, f) => sum + (f.progress || 0), 0) / hiredFreelancers.length)
    : 0;

  // ── Render Stats Cards ──────────────────────────────────────────────────
  const renderStats = () => (
    <View style={hf.statsContainer}>
      <View style={hf.statCard}>
        <Text style={hf.statNumber}>{totalHired}</Text>
        <Text style={hf.statLabel}>Total Hired</Text>
        <Ionicons name="people" size={20} color={BLUE} style={hf.statIcon} />
      </View>
      <View style={hf.statCard}>
        <Text style={[hf.statNumber, { color: GREEN }]}>{activeCount}</Text>
        <Text style={hf.statLabel}>Active</Text>
        <Ionicons name="play-circle" size={20} color={GREEN} style={hf.statIcon} />
      </View>
      <View style={hf.statCard}>
        <Text style={[hf.statNumber, { color: BLUE }]}>{completedCount}</Text>
        <Text style={hf.statLabel}>Completed</Text>
        <Ionicons name="checkmark-done-circle" size={20} color={BLUE} style={hf.statIcon} />
      </View>
      <View style={hf.statCard}>
        <Text style={[hf.statNumber, { color: YELLOW }]}>{avgProgress}%</Text>
        <Text style={hf.statLabel}>Avg Progress</Text>
        <Ionicons name="trending-up" size={20} color={YELLOW} style={hf.statIcon} />
      </View>
    </View>
  );

  // ── Render Filter Tabs ──────────────────────────────────────────────────
  const renderFilters = () => (
    <View style={hf.filterContainer}>
      {['all', 'active', 'completed'].map((f) => (
        <TouchableOpacity
          key={f}
          style={[hf.filterBtn, filter === f && hf.filterBtnActive]}
          onPress={() => setFilter(f)}
        >
          <Text style={[hf.filterText, filter === f && hf.filterTextActive]}>
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Completed'}
          </Text>
          {filter === f && <View style={hf.filterIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Render Freelancer Card ──────────────────────────────────────────────
  const renderFreelancerCard = ({ item }) => {
    const freelancer = item.freelancer_id || {};
    const job = item.job_id || {};
    const statusInfo = getStatusInfo(item.contractStatus);
    const firstName = freelancer.first_name || '';
    const lastName = freelancer.last_name || '';
    const fullName = (firstName + ' ' + lastName).trim() || 'Freelancer';
    const initials = (firstName.charAt(0) || '') + (lastName.charAt(0) || '');
    
    return (
      <View style={hf.card}>
        <View style={hf.cardHeader}>
          <View style={hf.avatar}>
            {freelancer.profile_picture ? (
              <Image source={{ uri: freelancer.profile_picture }} style={hf.avatarImg} />
            ) : (
              <Text style={hf.avatarText}>{initials || '?'}</Text>
            )}
          </View>
          <View style={hf.cardInfo}>
            <Text style={hf.freelancerName} numberOfLines={1}>{fullName}</Text>
            <Text style={hf.jobTitle} numberOfLines={1}>{job.title || 'Contract'}</Text>
            <View style={hf.ratingRow}>
              <RatingStars rating={freelancer.rating || 0} size={12} />
            </View>
          </View>
          <View style={[hf.statusBadge, { backgroundColor: statusInfo.color + '15', borderColor: statusInfo.color + '30' }]}>
            <Ionicons name={statusInfo.icon} size={10} color={statusInfo.color} />
            <Text style={[hf.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={hf.cardBody}>
          <View style={hf.progressSection}>
            <View style={hf.progressHeader}>
              <Text style={hf.progressLabel}>Progress</Text>
              <Text style={hf.progressValue}>{item.progress || 0}%</Text>
            </View>
            <ProgressBar progress={item.progress || 0} />
          </View>

          <View style={hf.detailsRow}>
            <View style={hf.detailItem}>
              <Ionicons name="calendar-outline" size={14} color={TEXT_LIGHT} />
              <Text style={hf.detailText}>
                Started {formatDate(item.contract?.start_date || item.applied_at)}
              </Text>
            </View>
            {item.contract?.end_date && (
              <View style={hf.detailItem}>
                <Ionicons name="flag-outline" size={14} color={TEXT_LIGHT} />
                <Text style={hf.detailText}>
                  Ends {formatDate(item.contract.end_date)}
                </Text>
              </View>
            )}
          </View>

          {item.proposed_rate && (
            <View style={hf.rateContainer}>
              <Ionicons name="cash-outline" size={14} color={GOLD_DK} />
              <Text style={hf.rateText}>
                ₱{item.proposed_rate.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <View style={hf.cardFooter}>
          <TouchableOpacity
            style={[hf.footerBtn, hf.updateBtn]}
            onPress={() => {
              setSelectedContract(item.contract || { 
                _id: 'temp',
                freelancer_id: freelancer,
                job_id: job,
                progress: item.progress || 0,
                status: item.contractStatus,
              });
              setShowUpdateModal(true);
            }}
          >
            <Ionicons name="refresh-circle" size={16} color={WHITE} />
            <Text style={hf.footerBtnText}>Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[hf.footerBtn, hf.contractBtn]}
            onPress={() => handleViewContract(item.contract?._id)}
            disabled={!item.contract?._id}
          >
            <Ionicons name="document-text-outline" size={16} color={BLUE} />
            <Text style={[hf.footerBtnText, { color: BLUE }]}>Contract</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[hf.footerBtn, hf.messageBtn]}
            onPress={() => handleMessageFreelancer(freelancer._id)}
          >
            <Ionicons name="chatbubble-outline" size={16} color={BLUE} />
            <Text style={[hf.footerBtnText, { color: BLUE }]}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={hf.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={hf.topbar}>
          <Text style={hf.topbarTitle}>My <Text style={hf.gold}>Hires</Text></Text>
        </View>
        <View style={hf.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={hf.loadingText}>Loading hired freelancers…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={hf.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={hf.root}>
        {/* Top Bar */}
        <View style={hf.topbar}>
          <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
            <View style={hf.iconWrap}>
              <Ionicons name="arrow-back" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={hf.topbarTitle}>My <Text style={hf.gold}>Hires</Text></Text>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
            <View style={hf.iconWrap}>
              <Ionicons name="refresh-outline" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={hf.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
          }
        >
          {/* Stats */}
          {renderStats()}

          {/* Filters */}
          {renderFilters()}

          {/* List */}
          {filteredFreelancers.length === 0 ? (
            <View style={hf.empty}>
              <Ionicons name="people-outline" size={48} color={TEXT_LIGHT} />
              <Text style={hf.emptyTitle}>No Hired Freelancers</Text>
              <Text style={hf.emptyDesc}>
                {filter === 'all' 
                  ? "You haven't hired any freelancers yet."
                  : `No ${filter} freelancers found.`}
              </Text>
            </View>
          ) : (
            filteredFreelancers.map((item, index) => (
              <View key={item._id || index}>
                {renderFreelancerCard({ item })}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Update Modal */}
      <UpdateModal
        visible={showUpdateModal}
        contract={selectedContract}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedContract(null);
        }}
        onUpdate={handleUpdateProgress}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const hf = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: NAVY,
  },
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: NAVY,
  },
  iconWrap: {
    width: 38,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: -0.2,
  },
  gold: {
    color: GOLD_LT,
    fontStyle: 'italic',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: TEXT_MUTED,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 40) / 4 - 8,
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    position: 'relative',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_MAIN,
  },
  statLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '600',
    marginTop: 2,
  },
  statIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
    opacity: 0.3,
  },
  // Filters
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: BLUE,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  filterTextActive: {
    color: WHITE,
  },
  filterIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '30%',
    right: '30%',
    height: 2,
    backgroundColor: WHITE,
    borderRadius: 1,
  },
  // Cards
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  freelancerName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  jobTitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  ratingRow: {
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardBody: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  progressSection: {
    gap: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    color: TEXT_LIGHT,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: BLUE,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: TEXT_LIGHT,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200,149,32,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(200,149,32,0.2)',
  },
  rateText: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD_DK,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  updateBtn: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  contractBtn: {
    backgroundColor: 'transparent',
    borderColor: BORDER,
  },
  messageBtn: {
    backgroundColor: 'transparent',
    borderColor: BORDER,
  },
  footerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: WHITE,
  },
  // Empty State
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
});