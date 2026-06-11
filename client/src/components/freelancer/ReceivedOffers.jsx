import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Modal, Alert, FlatList, RefreshControl, ActivityIndicator, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getReceivedOffers, updateOfferStatus } from '../../Redux/slices/offerSlice';

// ── Vantara Design tokens ──────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const NAVY2      = '#0D2151';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
const BLUE_LT    = '#1E90FF';
const GOLD       = '#C89520';
const GOLD_LT    = '#E8B84B';
const GOLD_DK    = '#8A6410';
const SILVER     = '#8899B0';
const SILVER2    = '#B8C8D8';
const WHITE      = '#FFFFFF';
const BG         = '#EEF4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const GREEN      = '#059669';
const ORANGE     = '#F97316';
const RED        = '#EF4444';
// ─────────────────────────────────────────────────────────────────────────────────

const STATUS_PENDING = GOLD;
const STATUS_ACCEPTED = GREEN;
const STATUS_DECLINED = RED;
const STATUS_EXPIRED = TEXT_LIGHT;

export default function ReceivedOffers({ onNavigate }) {
  const dispatch = useDispatch();
  const { receivedOffers, isLoading, error } = useSelector((state) => state.offers);
  const { user } = useSelector((state) => state.auth);
  
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = useCallback(async () => {
    try {
      await dispatch(getReceivedOffers({})).unwrap();
    } catch (error) {
      console.error('Error fetching offers:', error);
      Alert.alert('Error', 'Failed to load offers');
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  }, [fetchOffers]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return STATUS_PENDING;
      case 'accepted': return STATUS_ACCEPTED;
      case 'declined': return STATUS_DECLINED;
      case 'expired': return STATUS_EXPIRED;
      default: return TEXT_MAIN;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return 'time-outline';
      case 'accepted': return 'checkmark-circle-outline';
      case 'declined': return 'close-circle-outline';
      case 'expired': return 'alert-circle-outline';
      default: return 'help-outline';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Pending',
      accepted: 'Accepted',
      declined: 'Declined',
      expired: 'Expired'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleAcceptOffer = (offer) => {
    Alert.alert(
      'Accept Offer',
      `Are you sure you want to accept the offer from ${offer.client_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await dispatch(updateOfferStatus({ offerId: offer._id, status: 'accepted' })).unwrap();
              Alert.alert('Success', 'Offer accepted successfully!');
              setSelectedOffer(null);
              fetchOffers();
            } catch (error) {
              Alert.alert('Error', 'Failed to accept offer');
            }
          }
        }
      ]
    );
  };

  const handleDeclineOffer = (offer) => {
    Alert.alert(
      'Decline Offer',
      `Are you sure you want to decline the offer from ${offer.client_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(updateOfferStatus({ offerId: offer._id, status: 'declined' })).unwrap();
              Alert.alert('Info', 'Offer declined');
              setSelectedOffer(null);
              fetchOffers();
            } catch (error) {
              Alert.alert('Error', 'Failed to decline offer');
            }
          }
        }
      ]
    );
  };

  const handleCounterOffer = (offer) => {
    Alert.alert(
      'Counter Offer',
      'This feature will allow you to send a counter offer. Coming soon!',
      [{ text: 'OK' }]
    );
  };

  const filteredOffers = () => {
    if (activeTab === 'all') return receivedOffers || [];
    return (receivedOffers || []).filter(offer => offer.status === activeTab);
  };

  const getTabCount = (status) => {
    if (status === 'all') return (receivedOffers || []).length;
    return (receivedOffers || []).filter(offer => offer.status === status).length;
  };

  const OfferCard = ({ offer, onPress }) => {
    const statusColor = getStatusColor(offer.status);
    const initials = getInitials(offer.client_first_name, offer.client_last_name);
    const isExpired = offer.expiry_date && new Date(offer.expiry_date) < new Date();
    
    return (
      <TouchableOpacity 
        style={styles.offerCard}
        onPress={() => onPress(offer)}
        activeOpacity={0.85}
      >
        <View style={styles.offerHeader}>
          <View style={styles.clientSection}>
            <View style={[styles.clientAvatar, { backgroundColor: BLUE }]}>
              <Text style={styles.clientInitials}>{initials}</Text>
            </View>
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>{offer.client_name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={GOLD} />
                <Text style={styles.ratingText}>{offer.client_rating || '4.5'}</Text>
                <View style={styles.dot} />
                <Text style={styles.dateText}>{formatDate(offer.created_at)}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Ionicons name={getStatusIcon(offer.status)} size={12} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(offer.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.projectTitle} numberOfLines={1}>{offer.job_title}</Text>
        
        {offer.message && (
          <View style={styles.messagePreview}>
            <Ionicons name="chatbubble-outline" size={14} color={TEXT_LIGHT} />
            <Text style={styles.offerMessage} numberOfLines={2}>
              {offer.message}
            </Text>
          </View>
        )}

        <View style={styles.offerDetails}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
              <Ionicons name="cash-outline" size={14} color={BLUE} />
            </View>
            <Text style={styles.detailText}>₱{offer.amount?.toLocaleString()}</Text>
          </View>
          
          {offer.expiry_date && new Date(offer.expiry_date) > new Date() && offer.status === 'pending' && (
            <View style={styles.detailItem}>
              <View style={[styles.detailIconBox, { backgroundColor: `${STATUS_PENDING}10` }]}>
                <Ionicons name="time-outline" size={14} color={STATUS_PENDING} />
              </View>
              <Text style={[styles.detailText, { color: STATUS_PENDING }]}>
                Expires: {formatDate(offer.expiry_date)}
              </Text>
            </View>
          )}
        </View>

        {offer.status === 'pending' && !isExpired && (
          <View style={styles.offerActions}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleAcceptOffer(offer)}
            >
              <Ionicons name="checkmark" size={16} color={WHITE} />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleDeclineOffer(offer)}
            >
              <Ionicons name="close" size={16} color={RED} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {offer.status === 'pending' && isExpired && (
          <View style={styles.expiredBadge}>
            <Ionicons name="alert-circle" size={14} color={STATUS_EXPIRED} />
            <Text style={styles.expiredBadgeText}>Offer Expired</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const OfferDetailModal = ({ offer, visible, onClose }) => {
    if (!offer) return null;

    const statusColor = getStatusColor(offer.status);
    const initials = getInitials(offer.client_first_name, offer.client_last_name);
    const isExpired = offer.expiry_date && new Date(offer.expiry_date) < new Date();

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={TEXT_MUTED} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Offer Details</Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.modalContent}>
                {/* Client Info Section */}
                <View style={styles.modalClientSection}>
                  <View style={[styles.modalClientAvatar, { backgroundColor: BLUE }]}>
                    <Text style={styles.modalClientInitials}>{initials}</Text>
                  </View>
                  <View style={styles.modalClientInfo}>
                    <Text style={styles.modalClientName}>{offer.client_name}</Text>
                    <View style={styles.modalRatingRow}>
                      <Ionicons name="star" size={14} color={GOLD} />
                      <Text style={styles.modalRatingText}>{offer.client_rating || '4.5'}</Text>
                      <Text style={styles.modalReviewCount}>(Client)</Text>
                    </View>
                  </View>
                  <View style={[styles.modalStatusBadge, { backgroundColor: statusColor + '15' }]}>
                    <Ionicons name={getStatusIcon(offer.status)} size={14} color={statusColor} />
                    <Text style={[styles.modalStatusText, { color: statusColor }]}>
                      {getStatusText(offer.status)}
                    </Text>
                  </View>
                </View>

                {/* Job Title */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Project</Text>
                  <Text style={styles.modalProjectTitle}>{offer.job_title}</Text>
                </View>

                {/* Client Message */}
                {offer.message && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Message from Client</Text>
                    <View style={styles.messageCard}>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color={BLUE} />
                      <Text style={styles.messageText}>{offer.message}</Text>
                    </View>
                  </View>
                )}

                {/* Offer Details Grid */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Offer Details</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.gridCard}>
                      <View style={styles.gridIconBox}>
                        <Ionicons name="cash-outline" size={22} color={BLUE} />
                      </View>
                      <Text style={styles.gridLabel}>Amount</Text>
                      <Text style={styles.gridValue}>₱{offer.amount?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.gridCard}>
                      <View style={styles.gridIconBox}>
                        <Ionicons name="calendar-outline" size={22} color={BLUE} />
                      </View>
                      <Text style={styles.gridLabel}>Received</Text>
                      <Text style={styles.gridValue}>{formatDate(offer.created_at)}</Text>
                    </View>
                    {offer.expiry_date && (
                      <View style={styles.gridCard}>
                        <View style={[styles.gridIconBox, { backgroundColor: isExpired ? `${STATUS_EXPIRED}10` : `${STATUS_PENDING}10` }]}>
                          <Ionicons name="time-outline" size={22} color={isExpired ? STATUS_EXPIRED : STATUS_PENDING} />
                        </View>
                        <Text style={styles.gridLabel}>Expires</Text>
                        <Text style={[styles.gridValue, { color: isExpired ? STATUS_EXPIRED : STATUS_PENDING, fontSize: 12 }]}>
                          {formatDate(offer.expiry_date)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Required Skills */}
                {offer.job_skills && offer.job_skills.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Required Skills</Text>
                    <View style={styles.skillsGrid}>
                      {offer.job_skills.map((skill, index) => (
                        <View key={index} style={styles.skillChip}>
                          <Ionicons name="code-slash-outline" size={12} color={BLUE} />
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Matched Skills */}
                {offer.freelancer_skills && offer.freelancer_skills.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Your Matched Skills</Text>
                    <View style={styles.skillsGrid}>
                      {offer.freelancer_skills.map((skill, index) => (
                        <View key={index} style={[styles.skillChip, styles.matchedChip]}>
                          <Ionicons name="checkmark-circle" size={12} color={GREEN} />
                          <Text style={[styles.skillText, styles.matchedText]}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                {offer.status === 'pending' && !isExpired && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.modalAcceptBtn]}
                      onPress={() => handleAcceptOffer(offer)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={WHITE} />
                      <Text style={styles.modalAcceptText}>Accept Offer</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.modalCounterBtn]}
                      onPress={() => handleCounterOffer(offer)}
                    >
                      <Ionicons name="chatbubble-outline" size={20} color={BLUE} />
                      <Text style={styles.modalCounterText}>Counter</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.modalDeclineBtn]}
                      onPress={() => handleDeclineOffer(offer)}
                    >
                      <Ionicons name="close-circle" size={20} color={RED} />
                      <Text style={styles.modalDeclineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {offer.status === 'pending' && isExpired && (
                  <View style={styles.expiredContainer}>
                    <Ionicons name="alert-circle" size={56} color={STATUS_EXPIRED} />
                    <Text style={styles.expiredTitle}>Offer Expired</Text>
                    <Text style={styles.expiredDescription}>
                      This offer expired on {formatDate(offer.expiry_date)} and is no longer available.
                    </Text>
                  </View>
                )}

                {offer.status === 'accepted' && (
                  <View style={styles.acceptedContainer}>
                    <Ionicons name="checkmark-circle" size={56} color={STATUS_ACCEPTED} />
                    <Text style={styles.acceptedTitle}>Offer Accepted!</Text>
                    <Text style={styles.acceptedDescription}>
                      You have accepted this offer. The client will contact you soon with next steps.
                    </Text>
                    <TouchableOpacity 
                      style={styles.messageClientBtn}
                      onPress={() => {
                        onClose();
                        onNavigate('Messages', { 
                          userId: offer.client_id,
                          userName: offer.client_name,
                          userRole: 'client'
                        });
                      }}
                    >
                      <Ionicons name="chatbubble" size={20} color={WHITE} />
                      <Text style={styles.messageClientText}>Message Client</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate('MyApplications')} style={styles.backBtn}>
            <View style={styles.backIconWrap}>
              <Ionicons name="arrow-back" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>Received Offers</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('MyApplications')} style={styles.backBtn}>
          <View style={styles.backIconWrap}>
            <Ionicons name="arrow-back" size={18} color={WHITE} />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>Received Offers</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <View style={styles.refreshIconWrap}>
            <Ionicons name="refresh-outline" size={18} color={WHITE} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      {(receivedOffers?.length > 0) && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getTabCount('pending')}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getTabCount('accepted')}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getTabCount('declined')}</Text>
            <Text style={styles.statLabel}>Declined</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['all', 'pending', 'accepted', 'declined'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                {getTabCount(tab)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOffers()}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <OfferCard offer={item} onPress={setSelectedOffer} />
        )}
        contentContainerStyle={styles.offersList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="mail-open-outline" size={56} color={TEXT_LIGHT} />
            </View>
            <Text style={styles.emptyTitle}>No offers found</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all' 
                ? "You haven't received any offers yet" 
                : `No ${activeTab} offers to display`}
            </Text>
            <TouchableOpacity 
              style={styles.browseBtn}
              onPress={() => onNavigate('FreelancerDashboard')}
            >
              <Ionicons name="search-outline" size={18} color={WHITE} />
              <Text style={styles.browseBtnText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <OfferDetailModal 
        offer={selectedOffer}
        visible={selectedOffer !== null}
        onClose={() => setSelectedOffer(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  
  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: NAVY,
  },
  backBtn: { alignSelf: 'flex-start' },
  backIconWrap: {
    width: 40, height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: WHITE, 
    letterSpacing: -0.3,
  },
  refreshBtn: { alignSelf: 'flex-start' },
  refreshIconWrap: {
    width: 40, height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', 
    justifyContent: 'center',
  },

  // Stats Summary
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: CARD,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: BORDER,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabActive: {
    backgroundColor: `${BLUE}08`,
    borderColor: BLUE,
  },
  tabText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  tabTextActive: {
    color: BLUE,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: BORDER,
  },
  tabBadgeActive: {
    backgroundColor: BLUE,
  },
  tabBadgeText: {
    fontSize: 10,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  tabBadgeTextActive: {
    color: WHITE,
    fontWeight: '700',
  },

  // Offer Card
  offersList: {
    padding: 16,
    paddingBottom: 80,
  },
  offerCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, 
    shadowRadius: 8, 
    elevation: 2,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: TEXT_LIGHT,
  },
  dateText: {
    fontSize: 11,
    color: TEXT_LIGHT,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  offerMessage: {
    flex: 1,
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  offerDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: `${BLUE}08`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptBtn: {
    backgroundColor: BLUE,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
  },
  declineBtn: {
    backgroundColor: `${RED}08`,
    borderWidth: 1,
    borderColor: `${RED}20`,
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: RED,
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: `${STATUS_EXPIRED}08`,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  expiredBadgeText: {
    fontSize: 11,
    color: STATUS_EXPIRED,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    backgroundColor: `${TEXT_LIGHT}08`,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${TEXT_LIGHT}15`,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7,26,62,0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  modalScroll: {
    maxHeight: '90%',
  },
  modalContent: {
    padding: 20,
  },
  modalClientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalClientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClientInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
  },
  modalClientInfo: {
    flex: 1,
  },
  modalClientName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  modalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalRatingText: {
    fontSize: 13,
    color: TEXT_MAIN,
    fontWeight: '500',
  },
  modalReviewCount: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalProjectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    lineHeight: 24,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: BG,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: BG,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  gridIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${BLUE}08`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${BLUE}08`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${BLUE}15`,
  },
  skillText: {
    fontSize: 12,
    color: BLUE,
    fontWeight: '500',
  },
  matchedChip: {
    backgroundColor: `${GREEN}08`,
    borderColor: `${GREEN}20`,
  },
  matchedText: {
    color: GREEN,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalAcceptBtn: {
    backgroundColor: BLUE,
  },
  modalAcceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },
  modalCounterBtn: {
    backgroundColor: `${BLUE}08`,
    borderWidth: 1,
    borderColor: `${BLUE}20`,
  },
  modalCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: BLUE,
  },
  modalDeclineBtn: {
    backgroundColor: `${RED}08`,
    borderWidth: 1,
    borderColor: `${RED}20`,
  },
  modalDeclineText: {
    fontSize: 14,
    fontWeight: '600',
    color: RED,
  },
  expiredContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  expiredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginTop: 16,
    marginBottom: 8,
  },
  expiredDescription: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },
  acceptedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  acceptedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginTop: 16,
    marginBottom: 8,
  },
  acceptedDescription: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  messageClientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BLUE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  messageClientText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
  },
});