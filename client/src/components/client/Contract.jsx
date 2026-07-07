import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, TextInput, Modal, BackHandler,
  FlatList, StatusBar, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getClientContracts,
  getContractById,
  updateContract,
  cancelContract,
  pauseContract,
  resumeContract,
  completeContract,
  clearContractError,
  clearContractSuccess,
  updateContractLocally,
} from '../../Redux/slices/contractSlice';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const BLUE       = '#0055A5';
const BLUE_LT    = '#1E90FF';
const GOLD       = '#C89520';
const GOLD_LT    = '#E8B84B';
const GOLD_DK    = '#8A6410';
const WHITE      = '#FFFFFF';
const BG         = '#F0F4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const GREEN      = '#059669';
const RED        = '#DC2626';
const ORANGE     = '#F97316';
const PURPLE     = '#7C3AED';

const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'          },
  { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'        },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline'    },
  { key: 'Message',       label: 'Messages', icon: 'chatbubble',    iconOutline: 'chatbubble-outline'    },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',        iconOutline: 'person-outline'        },
];

const STATUS_OPTIONS = [
  { label: 'All', value: 'all', color: TEXT_MUTED },
  { label: 'Active', value: 'active', color: GREEN },
  { label: 'Paused', value: 'paused', color: ORANGE },
  { label: 'Completed', value: 'completed', color: PURPLE },
  { label: 'Cancelled', value: 'cancelled', color: RED },
];

const STATUS_COLORS = {
  active: GREEN,
  paused: ORANGE,
  completed: PURPLE,
  cancelled: RED,
  pending: TEXT_LIGHT,
  draft: TEXT_LIGHT,
};

const STATUS_LABELS = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending: 'Pending',
  draft: 'Draft',
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function Contracts({ onNavigate }) {
  const dispatch = useDispatch();
  const { clientContracts, isLoading, selectedContract } = useSelector((state) => state.contracts.contracts);
  const { cancelSuccess, updateSuccess } = useSelector((state) => state.contracts);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeBottomTab, setActiveBottomTab] = useState('Hiredtalents');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailContract, setDetailContract] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedContractForCancel, setSelectedContractForCancel] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedContractForStatus, setSelectedContractForStatus] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [isPausing, setIsPausing] = useState(false);

  // ── Fetch Contracts ──────────────────────────────────────────────────────────
  const fetchContracts = useCallback(async () => {
    try {
      const params = { page: 1, limit: 50 };
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      await dispatch(getClientContracts(params)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to load contracts. Please try again.');
    }
  }, [dispatch, selectedStatus]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // ── Handle Success ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (cancelSuccess) {
      fetchContracts();
      dispatch(clearContractSuccess());
    }
  }, [cancelSuccess, dispatch, fetchContracts]);

  useEffect(() => {
    if (updateSuccess) {
      fetchContracts();
      dispatch(clearContractSuccess());
    }
  }, [updateSuccess, dispatch, fetchContracts]);

  // ── Hardware Back Button ──────────────────────────────────────────────────
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showDetailModal) {
        setShowDetailModal(false);
        setDetailContract(null);
        return true;
      }
      if (showCancelModal) {
        setShowCancelModal(false);
        setSelectedContractForCancel(null);
        setCancelReason('');
        return true;
      }
      if (showStatusModal) {
        setShowStatusModal(false);
        setSelectedContractForStatus(null);
        return true;
      }
      if (showPauseModal) {
        setShowPauseModal(false);
        setPauseReason('');
        return true;
      }
      if (onNavigate) {
        onNavigate('ClientDashboard');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showDetailModal, showCancelModal, showStatusModal, showPauseModal, onNavigate]);

  // ── Filter Contracts ───────────────────────────────────────────────────────
  const getFilteredContracts = () => {
    let filtered = clientContracts || [];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(contract => {
        const freelancer = contract.freelancer_id || {};
        const job = contract.job_id || {};
        const name = ((freelancer.first_name||'') + ' ' + (freelancer.last_name||'')).toLowerCase();
        const jobTitle = (job.title||'').toLowerCase();
        return name.includes(query) || jobTitle.includes(query);
      });
    }
    
    return filtered;
  };

  const filteredContracts = getFilteredContracts();

  // ── Handle Tab Navigation ─────────────────────────────────────────────────
  const handleTabPress = (key) => {
    setActiveBottomTab(key);
    if (key === 'Home') onNavigate('ClientDashboard');
    if (key === 'PostJob') onNavigate('PostJob');
    if (key === 'Hiredtalents') onNavigate('Hiredtalents');
    if (key === 'Message') onNavigate('Messages');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  // ── View Contract Details ──────────────────────────────────────────────────
  const handleViewContract = async (contract) => {
    try {
      const result = await dispatch(getContractById(contract._id)).unwrap();
      setDetailContract(result.contract || contract);
      setShowDetailModal(true);
    } catch (error) {
      // If API fails, use the contract data we already have
      setDetailContract(contract);
      setShowDetailModal(true);
    }
  };

  // ── Cancel Contract with Reason ────────────────────────────────────────────
  const handleCancelContract = async () => {
    if (!selectedContractForCancel) return;
    
    if (!cancelReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for cancelling this contract.');
      return;
    }
    
    setIsCancelling(true);
    
    try {
      await dispatch(cancelContract({ 
        contractId: selectedContractForCancel._id,
        reason: cancelReason 
      })).unwrap();
      
      setShowCancelModal(false);
      setSelectedContractForCancel(null);
      setCancelReason('');
      setIsCancelling(false);
      
      if (showDetailModal) {
        setShowDetailModal(false);
        setDetailContract(null);
      }
      
      Alert.alert(
        'Contract Cancelled', 
        `The contract has been cancelled.\n\nReason: ${cancelReason}`
      );
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to cancel contract.');
      setIsCancelling(false);
    }
  };

  // ── Pause Contract ─────────────────────────────────────────────────────────
  const handlePauseContract = async () => {
    if (!selectedContractForCancel) return;
    
    if (!pauseReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for pausing this contract.');
      return;
    }
    
    setIsPausing(true);
    
    try {
      await dispatch(pauseContract({ 
        contractId: selectedContractForCancel._id,
        reason: pauseReason 
      })).unwrap();
      
      setShowPauseModal(false);
      setSelectedContractForCancel(null);
      setPauseReason('');
      setIsPausing(false);
      
      if (showDetailModal) {
        setShowDetailModal(false);
        setDetailContract(null);
      }
      
      Alert.alert(
        'Contract Paused', 
        `The contract has been paused.\n\nReason: ${pauseReason}`
      );
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to pause contract.');
      setIsPausing(false);
    }
  };

  // ── Resume Contract ────────────────────────────────────────────────────────
  const handleResumeContract = async (contractId) => {
    try {
      await dispatch(resumeContract(contractId)).unwrap();
      Alert.alert('Contract Resumed', 'The contract has been resumed successfully.');
      fetchContracts();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to resume contract.');
    }
  };

  // ── Complete Contract ──────────────────────────────────────────────────────
  const handleCompleteContract = async (contractId) => {
    Alert.alert(
      'Complete Contract',
      'Are you sure you want to mark this contract as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          style: 'default',
          onPress: async () => {
            try {
              await dispatch(completeContract(contractId)).unwrap();
              Alert.alert('Contract Completed', 'The contract has been marked as completed.');
              fetchContracts();
            } catch (error) {
              Alert.alert('Error', error?.message || 'Failed to complete contract.');
            }
          }
        }
      ]
    );
  };

  // ── Update Contract Status ─────────────────────────────────────────────────
  const handleUpdateStatus = async (status) => {
    if (!selectedContractForStatus) return;
    
    setIsUpdatingStatus(true);
    
    try {
      await dispatch(updateContract({ 
        contractId: selectedContractForStatus._id, 
        contractData: { status } 
      })).unwrap();
      setShowStatusModal(false);
      setSelectedContractForStatus(null);
      setIsUpdatingStatus(false);
      fetchContracts();
      Alert.alert('Updated', `Contract status changed to ${STATUS_LABELS[status]}.`);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to update contract status.');
      setIsUpdatingStatus(false);
    }
  };

  // ── Refresh ─────────────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchContracts();
    setRefreshing(false);
  }, [fetchContracts]);

  // ── Check if contract can be cancelled ────────────────────────────────────
  const canCancelContract = (status) => {
    return status === 'active' || status === 'paused';
  };

  const canPauseContract = (status) => {
    return status === 'active';
  };

  const canResumeContract = (status) => {
    return status === 'paused';
  };

  const canCompleteContract = (status) => {
    return status === 'active' || status === 'paused';
  };

  // ── Navigate to Contract Full View ────────────────────────────────────────
  const navigateToContractView = (contractId) => {
    setShowDetailModal(false);
    if (onNavigate) {
      onNavigate('ContractDetail', { contractId });
    }
  };

  // ── Render Contract Card ──────────────────────────────────────────────────
  const renderContractCard = ({ item }) => {
    const freelancer = item.freelancer_id || {};
    const job = item.job_id || {};
    const name = ((freelancer.first_name||'') + ' ' + (freelancer.last_name||'')).trim() || 'Freelancer';
    const initials = (freelancer.first_name||'')[0] + '' + (freelancer.last_name||'')[0];
    const statusColor = STATUS_COLORS[item.status] || TEXT_LIGHT;
    const statusLabel = STATUS_LABELS[item.status] || item.status;
    const cancellable = canCancelContract(item.status);
    const pausable = canPauseContract(item.status);
    const resumable = canResumeContract(item.status);
    const completable = canCompleteContract(item.status);

    return (
      <TouchableOpacity 
        style={card.wrap} 
        onPress={() => handleViewContract(item)}
        activeOpacity={0.85}
      >
        <View style={card.header}>
          <View style={card.avatarWrap}>
            <View style={[card.avatar, { backgroundColor: BLUE + '15' }]}>
              <Text style={card.avatarText}>{initials || '?'}</Text>
            </View>
          </View>
          <View style={card.infoWrap}>
            <Text style={card.name} numberOfLines={1}>{name}</Text>
            <Text style={card.jobTitle} numberOfLines={1}>{job.title || 'Untitled Project'}</Text>
          </View>
          <View style={[card.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[card.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[card.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={card.divider} />

        <View style={card.metaRow}>
          <View style={card.metaItem}>
            <Ionicons name="cash-outline" size={14} color={GOLD_DK} />
            <Text style={card.metaText}>
              {formatCurrency(item.agreed_budget?.amount)} 
              {item.agreed_budget?.type === 'hourly' ? '/hr' : ''}
            </Text>
          </View>
          <View style={card.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={TEXT_LIGHT} />
            <Text style={card.metaText}>
              {formatDate(item.start_date)}
            </Text>
          </View>
          <View style={card.metaItem}>
            <Ionicons name="trending-up-outline" size={14} color={BLUE} />
            <Text style={card.metaText}>
              {item.progress || 0}% complete
            </Text>
          </View>
        </View>

        <View style={card.footer}>
          <Text style={card.date}>
            Created {formatRelativeTime(item.createdAt)}
          </Text>
          <View style={card.actions}>
            <TouchableOpacity 
              style={[card.actionBtn, card.viewBtn]}
              onPress={() => navigateToContractView(item._id)}
              activeOpacity={0.7}
            >
              <Ionicons name="eye-outline" size={14} color={BLUE} />
              <Text style={[card.actionText, { color: BLUE }]}>View</Text>
            </TouchableOpacity>
            {cancellable && (
              <TouchableOpacity 
                style={[card.actionBtn, card.cancelBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedContractForCancel(item);
                  setCancelReason('');
                  setShowCancelModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-outline" size={14} color={RED} />
                <Text style={[card.actionText, { color: RED }]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading && !refreshing && !clientContracts?.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.topbar}>
          <Text style={styles.topbarTitle}>Contracts</Text>
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color={BLUE} /><Text style={styles.loadTxt}>Loading contracts…</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.root}>

        {/* Top Bar */}
        <View style={styles.topbar}>
          <Text style={styles.topbarTitle}>Contracts</Text>
          <Text style={styles.topbarSub}>{clientContracts?.length || 0} total</Text>
        </View>

        {/* Search & Filter */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={TEXT_LIGHT} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by freelancer or project..."
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

        {/* Status Filter */}
        <View style={styles.filterWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {STATUS_OPTIONS.map((opt) => {
              const active = selectedStatus === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedStatus(opt.value)}
                  activeOpacity={0.7}
                >
                  {opt.value !== 'all' && (
                    <View style={[styles.filterDot, { backgroundColor: opt.color }]} />
                  )}
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={12} color={WHITE} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results count */}
        <View style={styles.countWrap}>
          <Text style={styles.countText}>{filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Contract List */}
        <FlatList
          data={filteredContracts}
          renderItem={renderContractCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={34} color={BLUE} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No contracts match your search' : 'No contracts yet'}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchQuery 
                  ? 'Try adjusting your search terms.' 
                  : 'Contracts will appear here once you hire freelancers.'}
              </Text>
            </View>
          }
        />

        {/* Bottom Tab Bar */}
        <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const active = activeBottomTab === tab.key;
              const isPost = tab.key === 'PostJob';
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {active && <View style={styles.tabActiveBar} />}
                  {isPost ? (
                    <View style={styles.tabFab}>
                      <Ionicons name={active ? tab.icon : tab.iconOutline} size={22} color={WHITE} />
                    </View>
                  ) : (
                    <View style={styles.tabIconWrap}>
                      <Ionicons
                        name={active ? tab.icon : tab.iconOutline}
                        size={23}
                        color={active ? BLUE : TEXT_LIGHT}
                      />
                    </View>
                  )}
                  <Text style={[
                    styles.tabLabel,
                    active && styles.tabLabelActive,
                    isPost && styles.tabLabelPost,
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      {/* ── Contract Detail Modal ── */}
      <Modal transparent animationType="slide" visible={showDetailModal} onRequestClose={() => { setShowDetailModal(false); setDetailContract(null); }}>
        <View style={detailModal.overlay}>
          <View style={detailModal.sheet}>
            <View style={detailModal.handle} />
            
            <View style={detailModal.header}>
              <TouchableOpacity onPress={() => { setShowDetailModal(false); setDetailContract(null); }} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={TEXT_MAIN} />
              </TouchableOpacity>
              <Text style={detailModal.headerTitle}>Contract Details</Text>
              <TouchableOpacity onPress={() => navigateToContractView(detailContract?._id)} activeOpacity={0.7}>
                <Ionicons name="open-outline" size={22} color={BLUE} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={detailModal.body}>
              {detailContract && (
                <View>
                  {/* Status */}
                  <View style={detailModal.statusWrap}>
                    <View style={[detailModal.statusBadge, { backgroundColor: STATUS_COLORS[detailContract.status] + '15' }]}>
                      <View style={[detailModal.statusDot, { backgroundColor: STATUS_COLORS[detailContract.status] }]} />
                      <Text style={[detailModal.statusText, { color: STATUS_COLORS[detailContract.status] }]}>
                        {STATUS_LABELS[detailContract.status] || detailContract.status}
                      </Text>
                    </View>
                    <Text style={detailModal.dateText}>
                      Created {formatRelativeTime(detailContract.createdAt)}
                    </Text>
                  </View>

                  {/* Freelancer Info */}
                  <View style={detailModal.freelancerCard}>
                    <View style={detailModal.freelancerAvatar}>
                      <Text style={detailModal.freelancerInitials}>
                        {((detailContract.freelancer_id?.first_name||'')[0] || '') + 
                         ((detailContract.freelancer_id?.last_name||'')[0] || '') || '?'}
                      </Text>
                    </View>
                    <View style={detailModal.freelancerInfo}>
                      <Text style={detailModal.freelancerName}>
                        {(detailContract.freelancer_id?.first_name||'') + ' ' + (detailContract.freelancer_id?.last_name||'')}
                      </Text>
                      <Text style={detailModal.freelancerRole}>
                        {detailContract.freelancer_id?.experience_level || 'Freelancer'}
                      </Text>
                      {detailContract.freelancer_id?.rating > 0 && (
                        <View style={detailModal.ratingRow}>
                          <Ionicons name="star" size={12} color={GOLD} />
                          <Text style={detailModal.ratingText}>{detailContract.freelancer_id.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={detailModal.messageBtn}
                      onPress={() => {
                        setShowDetailModal(false);
                        if (onNavigate) onNavigate('Messages', { userId: detailContract.freelancer_id?._id, userRole: 'freelancer' });
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color={WHITE} />
                    </TouchableOpacity>
                  </View>

                  {/* Job Info */}
                  <View style={detailModal.section}>
                    <Text style={detailModal.sectionLabel}>Project</Text>
                    <Text style={detailModal.sectionValue}>{detailContract.job_id?.title || 'Untitled Project'}</Text>
                    <Text style={detailModal.sectionDesc}>{detailContract.job_id?.description || 'No description provided.'}</Text>
                  </View>

                  {/* Budget */}
                  <View style={detailModal.section}>
                    <Text style={detailModal.sectionLabel}>Budget</Text>
                    <Text style={detailModal.budgetText}>
                      {formatCurrency(detailContract.agreed_budget?.amount)} 
                      {detailContract.agreed_budget?.type === 'hourly' ? ' / hour' : ' (Fixed)'}
                    </Text>
                    <Text style={detailModal.budgetSub}>
                      Currency: {detailContract.agreed_budget?.currency || 'PHP'}
                    </Text>
                  </View>

                  {/* Dates */}
                  <View style={detailModal.grid}>
                    <View style={detailModal.gridItem}>
                      <Text style={detailModal.gridLabel}>Start Date</Text>
                      <Text style={detailModal.gridValue}>{formatDate(detailContract.start_date)}</Text>
                    </View>
                    <View style={detailModal.gridItem}>
                      <Text style={detailModal.gridLabel}>End Date</Text>
                      <Text style={detailModal.gridValue}>{formatDate(detailContract.end_date)}</Text>
                    </View>
                  </View>

                  {/* Progress */}
                  <View style={detailModal.progressContainer}>
                    <View style={detailModal.progressHeader}>
                      <Text style={detailModal.progressLabel}>Progress</Text>
                      <Text style={detailModal.progressValue}>{detailContract.progress || 0}%</Text>
                    </View>
                    <View style={detailModal.progressTrack}>
                      <View style={[detailModal.progressFill, { width: (detailContract.progress || 0) + '%' }]} />
                    </View>
                  </View>

                  {/* Terms */}
                  {detailContract.terms && (
                    <View style={detailModal.section}>
                      <Text style={detailModal.sectionLabel}>Terms & Conditions</Text>
                      <Text style={detailModal.sectionValue}>{detailContract.terms}</Text>
                    </View>
                  )}

                  {/* Milestones */}
                  {detailContract.milestones && detailContract.milestones.length > 0 && (
                    <View style={detailModal.section}>
                      <Text style={detailModal.sectionLabel}>Milestones ({detailContract.milestones.length})</Text>
                      {detailContract.milestones.map((milestone, index) => (
                        <View key={index} style={detailModal.milestoneItem}>
                          <View style={detailModal.milestoneHeader}>
                            <Text style={detailModal.milestoneTitle}>{milestone.title}</Text>
                            <View style={[detailModal.milestoneStatus, { 
                              backgroundColor: milestone.status === 'completed' ? GREEN + '15' : ORANGE + '15' 
                            }]}>
                              <Text style={[detailModal.milestoneStatusText, { 
                                color: milestone.status === 'completed' ? GREEN : ORANGE 
                              }]}>
                                {milestone.status || 'pending'}
                              </Text>
                            </View>
                          </View>
                          {milestone.description && (
                            <Text style={detailModal.milestoneDesc}>{milestone.description}</Text>
                          )}
                          <View style={detailModal.milestoneFooter}>
                            <Text style={detailModal.milestoneAmount}>
                              {formatCurrency(milestone.amount)}
                            </Text>
                            <Text style={detailModal.milestoneDate}>
                              Due: {formatDate(milestone.due_date)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Documents */}
                  {detailContract.contract_documents && detailContract.contract_documents.length > 0 && (
                    <View style={detailModal.section}>
                      <Text style={detailModal.sectionLabel}>Documents ({detailContract.contract_documents.length})</Text>
                      {detailContract.contract_documents.map((doc, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={detailModal.docItem}
                          onPress={() => {
                            if (doc.url) {
                              Linking.openURL(doc.url).catch(() => Alert.alert('Error', 'Cannot open document'));
                            }
                          }}
                        >
                          <Ionicons name="document-text-outline" size={18} color={BLUE} />
                          <View style={detailModal.docInfo}>
                            <Text style={detailModal.docName} numberOfLines={1}>{doc.name}</Text>
                            <Text style={detailModal.docMeta}>
                              {doc.size ? (doc.size / 1024).toFixed(1) + ' KB' : ''}
                              {doc.uploaded_at ? ` • ${formatDate(doc.uploaded_at)}` : ''}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={TEXT_LIGHT} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Cancellation Reason */}
                  {detailContract.cancellation_reason && (
                    <View style={detailModal.section}>
                      <Text style={detailModal.sectionLabel}>Cancellation Reason</Text>
                      <View style={detailModal.reasonBox}>
                        <Ionicons name="information-circle-outline" size={18} color={RED} />
                        <Text style={detailModal.reasonText}>{detailContract.cancellation_reason}</Text>
                      </View>
                    </View>
                  )}

                  {/* Pause Reason */}
                  {detailContract.pause_reason && (
                    <View style={detailModal.section}>
                      <Text style={detailModal.sectionLabel}>Pause Reason</Text>
                      <View style={[detailModal.reasonBox, { backgroundColor: ORANGE + '10', borderColor: ORANGE + '30' }]}>
                        <Ionicons name="information-circle-outline" size={18} color={ORANGE} />
                        <Text style={[detailModal.reasonText, { color: ORANGE }]}>{detailContract.pause_reason}</Text>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={detailModal.actionRow}>
                    {canResumeContract(detailContract.status) && (
                      <TouchableOpacity 
                        style={[detailModal.actionBtn, detailModal.resumeBtn]} 
                        onPress={() => {
                          setShowDetailModal(false);
                          handleResumeContract(detailContract._id);
                        }}
                      >
                        <Ionicons name="play-outline" size={16} color={WHITE} />
                        <Text style={detailModal.actionBtnText}>Resume</Text>
                      </TouchableOpacity>
                    )}
                    {canPauseContract(detailContract.status) && (
                      <TouchableOpacity 
                        style={[detailModal.actionBtn, detailModal.pauseBtn]} 
                        onPress={() => {
                          setShowDetailModal(false);
                          setSelectedContractForCancel(detailContract);
                          setPauseReason('');
                          setShowPauseModal(true);
                        }}
                      >
                        <Ionicons name="pause-outline" size={16} color={WHITE} />
                        <Text style={detailModal.actionBtnText}>Pause</Text>
                      </TouchableOpacity>
                    )}
                    {canCompleteContract(detailContract.status) && (
                      <TouchableOpacity 
                        style={[detailModal.actionBtn, detailModal.completeBtn]} 
                        onPress={() => {
                          setShowDetailModal(false);
                          handleCompleteContract(detailContract._id);
                        }}
                      >
                        <Ionicons name="checkmark-outline" size={16} color={WHITE} />
                        <Text style={detailModal.actionBtnText}>Complete</Text>
                      </TouchableOpacity>
                    )}
                    {canCancelContract(detailContract.status) && (
                      <TouchableOpacity 
                        style={[detailModal.actionBtn, detailModal.cancelBtn]} 
                        onPress={() => {
                          setShowDetailModal(false);
                          setSelectedContractForCancel(detailContract);
                          setCancelReason('');
                          setShowCancelModal(true);
                        }}
                      >
                        <Ionicons name="close-outline" size={16} color={WHITE} />
                        <Text style={detailModal.actionBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* View Full Contract Button */}
                  <TouchableOpacity 
                    style={detailModal.viewFullBtn}
                    onPress={() => navigateToContractView(detailContract._id)}
                  >
                    <Ionicons name="eye-outline" size={18} color={WHITE} />
                    <Text style={detailModal.viewFullText}>View Full Contract</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Cancel Contract Modal with Reason ── */}
      <Modal transparent animationType="fade" visible={showCancelModal} onRequestClose={() => { setShowCancelModal(false); setCancelReason(''); }}>
        <View style={modal.overlay}>
          <View style={modal.card}>
            <View style={modal.iconWrap}>
              <Ionicons name="alert-circle-outline" size={40} color={RED} />
            </View>
            <Text style={modal.title}>Cancel Contract</Text>
            <Text style={modal.desc}>
              Are you sure you want to cancel this contract? Please provide a reason below.
            </Text>
            
            <View style={modal.reasonWrap}>
              <Text style={modal.reasonLabel}>Reason for Cancellation *</Text>
              <TextInput
                style={modal.reasonInput}
                placeholder="Please explain why you're cancelling this contract..."
                placeholderTextColor={TEXT_LIGHT}
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={modal.reasonCount}>
                {cancelReason.length}/500 characters
              </Text>
            </View>
            
            <View style={modal.actions}>
              <TouchableOpacity 
                style={[modal.btn, modal.cancelBtn]} 
                onPress={() => { setShowCancelModal(false); setCancelReason(''); }}
                disabled={isCancelling}
              >
                <Text style={modal.cancelTxt}>Keep Contract</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[modal.btn, modal.dangerBtn, (!cancelReason.trim() || isCancelling) && { opacity: 0.6 }]} 
                onPress={handleCancelContract}
                disabled={!cancelReason.trim() || isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color={WHITE} />
                ) : (
                  <Text style={modal.dangerTxt}>Cancel Contract</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Pause Contract Modal with Reason ── */}
      <Modal transparent animationType="fade" visible={showPauseModal} onRequestClose={() => { setShowPauseModal(false); setPauseReason(''); }}>
        <View style={modal.overlay}>
          <View style={modal.card}>
            <View style={[modal.iconWrap, { backgroundColor: ORANGE + '15' }]}>
              <Ionicons name="pause-circle-outline" size={40} color={ORANGE} />
            </View>
            <Text style={modal.title}>Pause Contract</Text>
            <Text style={modal.desc}>
              Are you sure you want to pause this contract? Please provide a reason below.
            </Text>
            
            <View style={modal.reasonWrap}>
              <Text style={modal.reasonLabel}>Reason for Pausing *</Text>
              <TextInput
                style={modal.reasonInput}
                placeholder="Please explain why you're pausing this contract..."
                placeholderTextColor={TEXT_LIGHT}
                value={pauseReason}
                onChangeText={setPauseReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={modal.reasonCount}>
                {pauseReason.length}/500 characters
              </Text>
            </View>
            
            <View style={modal.actions}>
              <TouchableOpacity 
                style={[modal.btn, modal.cancelBtn]} 
                onPress={() => { setShowPauseModal(false); setPauseReason(''); }}
                disabled={isPausing}
              >
                <Text style={modal.cancelTxt}>Keep Active</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[modal.btn, { backgroundColor: ORANGE }, (!pauseReason.trim() || isPausing) && { opacity: 0.6 }]} 
                onPress={handlePauseContract}
                disabled={!pauseReason.trim() || isPausing}
              >
                {isPausing ? (
                  <ActivityIndicator size="small" color={WHITE} />
                ) : (
                  <Text style={modal.dangerTxt}>Pause Contract</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Status Update Modal ── */}
      <Modal transparent animationType="fade" visible={showStatusModal} onRequestClose={() => setShowStatusModal(false)}>
        <View style={modal.overlay}>
          <View style={modal.card}>
            <View style={[modal.iconWrap, { backgroundColor: BLUE + '15' }]}>
              <Ionicons name="swap-horizontal-outline" size={40} color={BLUE} />
            </View>
            <Text style={modal.title}>Update Status</Text>
            <Text style={modal.desc}>
              Change status for this contract:
            </Text>
            <View style={modal.statusOptions}>
              {['active', 'paused', 'completed', 'cancelled'].map((status) => {
                const color = STATUS_COLORS[status];
                const label = STATUS_LABELS[status];
                return (
                  <TouchableOpacity
                    key={status}
                    style={modal.statusBtn}
                    onPress={() => handleUpdateStatus(status)}
                    activeOpacity={0.7}
                    disabled={isUpdatingStatus}
                  >
                    <View style={[modal.statusDot, { backgroundColor: color }]} />
                    <Text style={modal.statusLabel}>{label}</Text>
                    {isUpdatingStatus && selectedContractForStatus?.status === status && (
                      <ActivityIndicator size="small" color={BLUE} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={[modal.btn, modal.cancelBtn, { width: '100%' }]} onPress={() => setShowStatusModal(false)}>
              <Text style={modal.cancelTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: BG },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, backgroundColor: NAVY,
  },
  topbarTitle: { fontSize: 17, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  topbarSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: BG, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  searchInput: { flex: 1, fontSize: 13, color: TEXT_MAIN, padding: 0 },

  filterWrap: { backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  filterScroll: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  filterChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: 11, fontWeight: '600', color: TEXT_LIGHT },
  filterTextActive: { color: WHITE },

  countWrap: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: CARD },
  countText: { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },

  list: { padding: 16, paddingBottom: 32 },

  empty: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, backgroundColor: BLUE + '10', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: TEXT_LIGHT, textAlign: 'center', lineHeight: 20 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadTxt: { marginTop: 12, fontSize: 13, color: TEXT_LIGHT },

  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1.5, borderTopColor: BORDER,
    paddingTop: 6, paddingBottom: 4, paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
    paddingVertical: 4, position: 'relative',
  },
  tabActiveBar: {
    position: 'absolute', top: 0,
    width: 24, height: 3,
    backgroundColor: BLUE, borderRadius: 999,
  },
  tabIconWrap: { marginBottom: 3, marginTop: 6 },
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

// ── Card Styles ──────────────────────────────────────────────────────────────
const card = StyleSheet.create({
  wrap: {
    backgroundColor: CARD, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: BORDER, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarWrap: { flexShrink: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: BLUE },
  infoWrap: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  jobTitle: { fontSize: 11, color: TEXT_LIGHT },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, flexShrink: 0 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700' },
  divider: { height: 1, backgroundColor: BORDER, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  date: { fontSize: 10, color: TEXT_LIGHT },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  viewBtn: { borderColor: BLUE + '30', backgroundColor: BLUE + '0D' },
  cancelBtn: { borderColor: RED + '30', backgroundColor: RED + '0D' },
  actionText: { fontSize: 10, fontWeight: '600' },
});

// ── Detail Modal Styles ─────────────────────────────────────────────────────
const detailModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN },
  body: { padding: 16, paddingBottom: 32 },

  statusWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 11, color: TEXT_LIGHT },

  freelancerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: BG, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  freelancerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  freelancerInitials: { fontSize: 16, fontWeight: '700', color: WHITE },
  freelancerInfo: { flex: 1 },
  freelancerName: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  freelancerRole: { fontSize: 11, color: TEXT_LIGHT },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600' },
  messageBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },

  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: TEXT_LIGHT, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  sectionValue: { fontSize: 14, color: TEXT_MAIN, lineHeight: 20 },
  sectionDesc: { fontSize: 13, color: TEXT_MUTED, lineHeight: 18, marginTop: 4 },

  budgetText: { fontSize: 18, fontWeight: '800', color: GOLD_DK },
  budgetSub: { fontSize: 12, color: TEXT_LIGHT, marginTop: 2 },

  grid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  gridItem: { flex: 1, backgroundColor: BG, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: BORDER },
  gridLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  gridValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '600', marginTop: 2 },

  progressContainer: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, fontWeight: '600', color: TEXT_LIGHT },
  progressValue: { fontSize: 11, fontWeight: '700', color: BLUE },
  progressTrack: { height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: BLUE, borderRadius: 3 },

  milestoneItem: { backgroundColor: BG, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  milestoneTitle: { fontSize: 13, fontWeight: '600', color: TEXT_MAIN },
  milestoneStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  milestoneStatusText: { fontSize: 9, fontWeight: '700' },
  milestoneDesc: { fontSize: 12, color: TEXT_MUTED, marginBottom: 6 },
  milestoneFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  milestoneAmount: { fontSize: 12, fontWeight: '700', color: GOLD_DK },
  milestoneDate: { fontSize: 11, color: TEXT_LIGHT },

  docItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: BG, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: BORDER },
  docInfo: { flex: 1 },
  docName: { fontSize: 13, color: TEXT_MAIN, fontWeight: '500' },
  docMeta: { fontSize: 10, color: TEXT_LIGHT },

  reasonBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: RED + '10', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: RED + '30' },
  reasonText: { flex: 1, fontSize: 13, color: RED, lineHeight: 18 },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, minWidth: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  cancelBtn: { backgroundColor: RED },
  pauseBtn: { backgroundColor: ORANGE },
  resumeBtn: { backgroundColor: BLUE },
  completeBtn: { backgroundColor: GREEN },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },

  viewFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: NAVY, paddingVertical: 14, borderRadius: 10, marginTop: 12 },
  viewFullText: { fontSize: 14, fontWeight: '700', color: WHITE },
});

// ── Modal Styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    backgroundColor: CARD, borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 380,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 8,
  },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: RED + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 16, alignSelf: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: TEXT_MAIN, textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 13, color: TEXT_LIGHT, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  
  reasonWrap: { width: '100%', marginBottom: 20 },
  reasonLabel: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED, marginBottom: 6 },
  reasonInput: {
    backgroundColor: BG,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    fontSize: 14,
    color: TEXT_MAIN,
    minHeight: 100,
    maxHeight: 150,
  },
  reasonCount: { fontSize: 10, color: TEXT_LIGHT, marginTop: 4, textAlign: 'right' },
  
  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  dangerBtn: { backgroundColor: RED },
  cancelTxt: { fontSize: 14, fontWeight: '600', color: TEXT_LIGHT },
  dangerTxt: { fontSize: 14, fontWeight: '700', color: WHITE },
  
  statusOptions: { width: '100%', gap: 6, marginBottom: 16 },
  statusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER, backgroundColor: BG,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: TEXT_MAIN },
});