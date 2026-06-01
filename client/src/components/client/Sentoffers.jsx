import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
  Alert, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getSentOffers, updateOfferStatus } from '../../Redux/slices/offerSlice';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const INPUT_BG = '#1c1c1c';

const TABS = ['All', 'pending', 'accepted', 'declined', 'expired'];

const statusStyle = {
  pending:  { bg: 'rgba(212,175,55,0.08)',   border: 'rgba(212,175,55,0.3)',   text: GOLD,       dot: GOLD, label: 'Pending', icon: 'time-outline' },
  accepted: { bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.3)',   text: '#4ade80',  dot: '#4ade80', label: 'Accepted', icon: 'checkmark-circle-outline' },
  declined: { bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.3)',  text: '#f87171',  dot: '#f87171', label: 'Declined', icon: 'close-circle-outline' },
  expired:  { bg: 'rgba(156,163,175,0.08)',  border: 'rgba(156,163,175,0.3)',  text: '#9ca3af',  dot: '#9ca3af', label: 'Expired', icon: 'alert-circle-outline' },
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffHours < 48) return 'Yesterday';
  const diffDays = Math.ceil(diffHours / 24);
  return `${diffDays} days ago`;
};

// Format full date
const formatFullDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get initials from name
const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

// Generate random color based on name
const getAvatarColor = (name) => {
  const colors = ['#60a5fa', '#4ade80', '#a78bfa', '#fbbf24', '#f87171', '#34d399', '#818cf8', '#f472b6'];
  const index = name?.length % colors.length || 0;
  return colors[index];
};

export default function SentOffersScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { sentOffers, isLoading } = useSelector((state) => state.offers);
  const { token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showFreelancerModal, setShowFreelancerModal] = useState(false);

  // Fetch sent offers when screen loads
  useEffect(() => {
    fetchSentOffers();
  }, []);

  const fetchSentOffers = async () => {
    if (!token) {
      Alert.alert('Error', 'Please login again');
      return;
    }
    
    try {
      await dispatch(getSentOffers()).unwrap();
    } catch (error) {
      console.error('Error fetching sent offers:', error);
      Alert.alert('Error', 'Failed to load sent offers');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSentOffers();
    setRefreshing(false);
  }, []);

  // Filter offers based on active tab
  const filteredOffers = sentOffers.filter((offer) =>
    activeTab === 'All' ? true : offer.status === activeTab
  );

  // Get counts for summary
  const getCountByStatus = (status) => {
    return sentOffers.filter((offer) => offer.status === status).length;
  };

  // Cancel/Withdraw offer
  const handleCancelOffer = (offerId) => {
    Alert.alert(
      'Withdraw Offer',
      'Are you sure you want to withdraw this offer? The freelancer will be notified.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(updateOfferStatus({ offerId, status: 'declined' })).unwrap();
              Alert.alert('Success', 'Offer has been withdrawn');
              fetchSentOffers();
              setShowOfferModal(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to withdraw offer');
            }
          }
        }
      ]
    );
  };

  // Resend offer (create new offer)
  const handleResendOffer = (offer) => {
    Alert.alert(
      'Resend Offer',
      `Would you like to send a new offer to ${offer.freelancer_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resend',
          onPress: () => {
            onNavigate('SendOffer', { freelancerId: offer.freelancer_id, jobId: offer.job_id });
          }
        }
      ]
    );
  };

  // View freelancer profile
  const handleViewFreelancer = (offer) => {
    setSelectedOffer(offer);
    setShowFreelancerModal(true);
  };

  // Message freelancer
  const handleMessageFreelancer = (freelancerId) => {
    onNavigate('Messages', { userId: freelancerId, userRole: 'freelancer' });
  };

  // View job details
  const handleViewJob = (jobId) => {
    setShowOfferModal(false);
    onNavigate('JobDetails', { jobId });
  };

  // Offer Details Modal
  const OfferDetailsModal = () => {
    if (!selectedOffer) return null;
    const st = statusStyle[selectedOffer.status] || statusStyle.pending;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showOfferModal}
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Offer Details</Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status Banner */}
              <View style={[styles.statusBanner, { backgroundColor: st.bg, borderColor: st.border }]}>
                <Ionicons name={st.icon} size={24} color={st.text} />
                <Text style={[styles.statusBannerText, { color: st.text }]}>{st.label}</Text>
              </View>

              {/* Offer Amount */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Offer Amount</Text>
                <Text style={styles.amountLarge}>₱{selectedOffer.amount?.toLocaleString()}</Text>
              </View>

              {/* Job Info */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Job Title</Text>
                <Text style={styles.detailValue}>{selectedOffer.job_title}</Text>
              </View>

              {/* Message */}
              {selectedOffer.message && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Your Message</Text>
                  <View style={styles.messageCard}>
                    <Text style={styles.messageValue}>{selectedOffer.message}</Text>
                  </View>
                </View>
              )}

              {/* Dates */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Sent Date</Text>
                <Text style={styles.detailValue}>{formatFullDate(selectedOffer.created_at)}</Text>
              </View>

              {selectedOffer.expiry_date && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Expiry Date</Text>
                  <Text style={[styles.detailValue, { color: selectedOffer.status === 'expired' ? '#f87171' : GOLD }]}>
                    {formatFullDate(selectedOffer.expiry_date)}
                    {selectedOffer.status === 'expired' && ' (Expired)'}
                  </Text>
                </View>
              )}

              {selectedOffer.responded_at && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Response Date</Text>
                  <Text style={styles.detailValue}>{formatFullDate(selectedOffer.responded_at)}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {selectedOffer.status === 'pending' && (
                  <>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.viewFreelancerBtn]}
                      onPress={() => handleViewFreelancer(selectedOffer)}
                    >
                      <Ionicons name="person-outline" size={18} color={GOLD} />
                      <Text style={styles.viewFreelancerBtnText}>View Freelancer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.viewJobBtn]}
                      onPress={() => handleViewJob(selectedOffer.job_id)}
                    >
                      <Ionicons name="briefcase-outline" size={18} color="#60a5fa" />
                      <Text style={styles.viewJobBtnText}>View Job</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.cancelOfferBtn]}
                      onPress={() => handleCancelOffer(selectedOffer._id)}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#f87171" />
                      <Text style={styles.cancelOfferBtnText}>Withdraw Offer</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {selectedOffer.status === 'expired' && (
                  <TouchableOpacity 
                    style={[styles.modalActionBtn, styles.resendOfferBtn]}
                    onPress={() => handleResendOffer(selectedOffer)}
                  >
                    <Ionicons name="refresh-outline" size={18} color={GOLD} />
                    <Text style={styles.resendOfferBtnText}>Send New Offer</Text>
                  </TouchableOpacity>
                )}
                
                {(selectedOffer.status === 'accepted' || selectedOffer.status === 'declined') && (
                  <>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.viewFreelancerBtn]}
                      onPress={() => handleViewFreelancer(selectedOffer)}
                    >
                      <Ionicons name="person-outline" size={18} color={GOLD} />
                      <Text style={styles.viewFreelancerBtnText}>View Freelancer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.messageFreelancerBtn]}
                      onPress={() => handleMessageFreelancer(selectedOffer.freelancer_id)}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color="#60a5fa" />
                      <Text style={styles.messageFreelancerBtnText}>Message Freelancer</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Freelancer Profile Modal
  const FreelancerProfileModal = () => {
    if (!selectedOffer) return null;
    const freelancer = selectedOffer;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFreelancerModal}
        onRequestClose={() => setShowFreelancerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Freelancer Profile</Text>
              <TouchableOpacity onPress={() => setShowFreelancerModal(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                  {freelancer.freelancer_profile_picture ? (
                    <Image source={{ uri: freelancer.freelancer_profile_picture }} style={styles.profileAvatarImage} />
                  ) : (
                    <Text style={styles.profileInitials}>
                      {getInitials(freelancer.freelancer_first_name, freelancer.freelancer_last_name)}
                    </Text>
                  )}
                </View>
                <Text style={styles.profileName}>{freelancer.freelancer_name}</Text>
                <Text style={styles.profileUsername}>@{freelancer.freelancer_username || 'freelancer'}</Text>
              </View>

              {/* Skills */}
              {freelancer.freelancer_skills && freelancer.freelancer_skills.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Skills</Text>
                  <View style={styles.skillsContainer}>
                    {freelancer.freelancer_skills.map((skill, idx) => (
                      <View key={idx} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Offer Info */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Offer Details</Text>
                <View style={styles.offerInfoCard}>
                  <Text style={styles.offerInfoText}>💰 Amount: ₱{freelancer.amount?.toLocaleString()}</Text>
                  <Text style={styles.offerInfoText}>📋 Job: {freelancer.job_title}</Text>
                  <Text style={styles.offerInfoText}>📅 Sent: {formatFullDate(freelancer.created_at)}</Text>
                  {freelancer.status === 'accepted' && (
                    <Text style={[styles.offerInfoText, { color: '#4ade80' }]}>✅ Accepted on {formatFullDate(freelancer.responded_at)}</Text>
                  )}
                  {freelancer.status === 'declined' && (
                    <Text style={[styles.offerInfoText, { color: '#f87171' }]}>❌ Declined on {formatFullDate(freelancer.responded_at)}</Text>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.profileActions}>
                <TouchableOpacity 
                  style={[styles.profileActionBtn, styles.messageProfileBtn]}
                  onPress={() => {
                    setShowFreelancerModal(false);
                    handleMessageFreelancer(freelancer.freelancer_id);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#60a5fa" />
                  <Text style={styles.messageProfileBtnText}>Message Freelancer</Text>
                </TouchableOpacity>
                
                {freelancer.status === 'pending' && (
                  <TouchableOpacity 
                    style={[styles.profileActionBtn, styles.withdrawProfileBtn]}
                    onPress={() => {
                      setShowFreelancerModal(false);
                      handleCancelOffer(freelancer._id);
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#f87171" />
                    <Text style={styles.withdrawProfileBtnText}>Withdraw Offer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Render loading state
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Sent <Text style={styles.gold}>Offers</Text></Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>Loading your offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Sent <Text style={styles.gold}>Offers</Text></Text>
        <TouchableOpacity 
          style={styles.refreshBtn} 
          onPress={fetchSentOffers} 
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        {['pending', 'accepted', 'declined', 'expired'].map((status) => {
          const count = getCountByStatus(status);
          const st = statusStyle[status];
          return (
            <View key={status} style={[styles.summaryCard, { borderColor: st.border, backgroundColor: st.bg }]}>
              <Text style={[styles.summaryCount, { color: st.text }]}>{count}</Text>
              <Text style={styles.summaryLabel}>{st.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'All' ? 'All' : statusStyle[tab]?.label || tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
      >
        {filteredOffers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="paper-plane-outline" size={64} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>No sent offers</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'All' 
                ? "You haven't sent any offers yet" 
                : `No ${statusStyle[activeTab]?.label?.toLowerCase() || activeTab} offers found`}
            </Text>
            <TouchableOpacity 
              style={styles.browseJobsBtn}
              onPress={() => onNavigate('FindJobs')}
            >
              <Text style={styles.browseJobsBtnText}>Browse Freelancers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOffers.map((item) => {
            const st = statusStyle[item.status] || statusStyle.pending;
            const avatarColor = getAvatarColor(item.freelancer_name);
            const initials = getInitials(item.freelancer_first_name, item.freelancer_last_name);
            
            return (
              <TouchableOpacity 
                key={item._id} 
                style={styles.card} 
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedOffer(item);
                  setShowOfferModal(true);
                }}
              >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: `${avatarColor}22` }]}>
                  {item.freelancer_profile_picture ? (
                    <Image source={{ uri: item.freelancer_profile_picture }} style={styles.avatarImage} />
                  ) : (
                    <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
                  )}
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View>
                      <Text style={styles.name}>{item.freelancer_name}</Text>
                      <Text style={styles.role}>{item.freelancer_title || 'Freelancer'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                      <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
                      <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardMiddle}>
                    <Text style={styles.jobTitle}>{item.job_title}</Text>
                  </View>
                  
                  <View style={styles.cardBottom}>
                    <View style={styles.metaItem}>
                      <Ionicons name="cash-outline" size={11} color={GOLD} />
                      <Text style={styles.amount}>₱{item.amount?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.3)" />
                      <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
                    </View>
                    {item.message && (
                      <View style={styles.messagePreview}>
                        <Ionicons name="chatbubble-outline" size={10} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.messageText} numberOfLines={1}>
                          {item.message}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Action buttons for pending offers */}
                  {item.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.cancelBtn]}
                        onPress={() => handleCancelOffer(item._id)}
                      >
                        <Text style={styles.cancelBtnText}>Withdraw</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.messageBtn]}
                        onPress={() => handleMessageFreelancer(item.freelancer_id)}
                      >
                        <Ionicons name="chatbubble-outline" size={14} color="#fff" />
                        <Text style={styles.messageBtnText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Action buttons for expired offers */}
                  {item.status === 'expired' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.resendActionBtn]}
                        onPress={() => handleResendOffer(item)}
                      >
                        <Ionicons name="refresh-outline" size={14} color={GOLD} />
                        <Text style={styles.resendActionBtnText}>Send New Offer</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Action buttons for accepted/declined offers */}
                  {(item.status === 'accepted' || item.status === 'declined') && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.viewProfileActionBtn]}
                        onPress={() => {
                          setSelectedOffer(item);
                          setShowFreelancerModal(true);
                        }}
                      >
                        <Ionicons name="person-outline" size={14} color={GOLD} />
                        <Text style={styles.viewProfileActionBtnText}>View Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.messageBtn]}
                        onPress={() => handleMessageFreelancer(item.freelancer_id)}
                      >
                        <Ionicons name="chatbubble-outline" size={14} color="#fff" />
                        <Text style={styles.messageBtnText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modals */}
      <OfferDetailsModal />
      <FreelancerProfileModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  topbarTitle: { fontSize: 16, fontWeight: '300', color: '#fff' },
  gold: { color: GOLD, fontStyle: 'italic', fontWeight: '400' },
  summaryRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  summaryCard: {
    flex: 1, borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1,
  },
  summaryCount: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },
  tabScroll: { flexGrow: 0 },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER, backgroundColor: CARD_BG,
  },
  tabActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: GOLD },
  tabText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  tabTextActive: { color: GOLD, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseJobsBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseJobsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: CARD_BG, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: BORDER, marginBottom: 10,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: {
    width: 42, height: 42, borderRadius: 21,
  },
  avatarText: { fontSize: 14, fontWeight: '700' },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 2 },
  role: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  cardMiddle: { marginBottom: 8 },
  jobTitle: { fontSize: 12, color: GOLD, fontWeight: '500' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amount: { fontSize: 12, fontWeight: '600', color: GOLD },
  metaText: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  messageText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  cancelBtn: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#f87171',
  },
  messageBtn: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  messageBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#60a5fa',
  },
  resendActionBtn: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  resendActionBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: GOLD,
  },
  viewProfileActionBtn: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  viewProfileActionBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: GOLD,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
  },
  amountLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: GOLD,
  },
  messageCard: {
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  messageValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'column',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 8,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewFreelancerBtn: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  viewFreelancerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
  },
  viewJobBtn: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  viewJobBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
  },
  cancelOfferBtn: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  cancelOfferBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87171',
  },
  resendOfferBtn: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  resendOfferBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
  },
  messageFreelancerBtn: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  messageFreelancerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
  },
  // Freelancer Profile Modal Styles
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  skillChipText: {
    fontSize: 12,
    color: GOLD,
  },
  offerInfoCard: {
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 6,
  },
  offerInfoText: {
    fontSize: 13,
    color: '#fff',
  },
  profileActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  profileActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  messageProfileBtn: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  messageProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
  },
  withdrawProfileBtn: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  withdrawProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87171',
  },
});