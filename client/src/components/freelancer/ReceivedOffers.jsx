import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Modal, Alert, FlatList, RefreshControl, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getReceivedOffers, updateOfferStatus } from '../../Redux/slices/offerSlice';

const BG = '#0a0a0a';
const GOLD = '#D4AF37';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const INPUT_BG = '#111111';
const STATUS_PENDING = '#f59e0b';
const STATUS_ACCEPTED = '#4ade80';
const STATUS_DECLINED = '#ef4444';
const STATUS_EXPIRED = '#6b7280';

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
      default: return '#fff';
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    
    return (
      <TouchableOpacity 
        style={styles.offerCard}
        onPress={() => onPress(offer)}
        activeOpacity={0.7}
      >
        <View style={styles.offerHeader}>
          <View style={styles.clientInfo}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientInitials}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.clientName}>{offer.client_name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color={GOLD} />
                <Text style={styles.ratingText}>{offer.client_rating || '4.5'}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={getStatusIcon(offer.status)} size={12} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(offer.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.projectTitle}>{offer.job_title}</Text>
        {offer.message && (
          <Text style={styles.offerMessage} numberOfLines={2}>
            "{offer.message}"
          </Text>
        )}

        <View style={styles.offerDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color={GOLD} />
            <Text style={styles.detailText}>₱{offer.amount?.toLocaleString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={GOLD} />
            <Text style={styles.detailText}>{formatDate(offer.created_at)}</Text>
          </View>
          {offer.expiry_date && new Date(offer.expiry_date) > new Date() && offer.status === 'pending' && (
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color={STATUS_PENDING} />
              <Text style={[styles.detailText, { color: STATUS_PENDING }]}>
                Expires: {formatDate(offer.expiry_date)}
              </Text>
            </View>
          )}
        </View>

        {offer.status === 'pending' && (
          <View style={styles.offerActions}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleAcceptOffer(offer)}
            >
              <Ionicons name="checkmark" size={16} color="#0a0a0a" />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleDeclineOffer(offer)}
            >
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Offer Details</Text>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.modalContent}>
                {/* Client Info */}
                <View style={styles.modalClientSection}>
                  <View style={styles.modalClientAvatar}>
                    <Text style={styles.modalClientInitials}>{initials}</Text>
                  </View>
                  <View style={styles.modalClientInfo}>
                    <Text style={styles.modalClientName}>{offer.client_name}</Text>
                    <View style={styles.modalRating}>
                      <Ionicons name="star" size={14} color={GOLD} />
                      <Text style={styles.modalRatingText}>{offer.client_rating || '4.5'}</Text>
                      <Text style={styles.modalReviewCount}>(from offers)</Text>
                    </View>
                  </View>
                  <View style={[styles.modalStatusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Ionicons name={getStatusIcon(offer.status)} size={14} color={statusColor} />
                    <Text style={[styles.modalStatusText, { color: statusColor }]}>
                      {getStatusText(offer.status)}
                    </Text>
                  </View>
                </View>

                {/* Job Details */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Job Title</Text>
                  <Text style={styles.modalProjectTitle}>{offer.job_title}</Text>
                </View>

                {offer.message && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Client Message</Text>
                    <View style={styles.messageBubble}>
                      <Ionicons name="chatbubble-outline" size={16} color={GOLD} />
                      <Text style={styles.messageText}>"{offer.message}"</Text>
                    </View>
                  </View>
                )}

                {/* Offer Details */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Offer Details</Text>
                  <View style={styles.modalDetailsGrid}>
                    <View style={styles.modalDetailCard}>
                      <Ionicons name="cash-outline" size={20} color={GOLD} />
                      <Text style={styles.modalDetailLabel}>Amount</Text>
                      <Text style={styles.modalDetailValue}>₱{offer.amount?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.modalDetailCard}>
                      <Ionicons name="calendar-outline" size={20} color={GOLD} />
                      <Text style={styles.modalDetailLabel}>Received</Text>
                      <Text style={styles.modalDetailValue}>{formatDate(offer.created_at)}</Text>
                    </View>
                    {offer.expiry_date && (
                      <View style={styles.modalDetailCard}>
                        <Ionicons name="time-outline" size={20} color={isExpired ? STATUS_EXPIRED : STATUS_PENDING} />
                        <Text style={styles.modalDetailLabel}>Expires</Text>
                        <Text style={[styles.modalDetailValue, { color: isExpired ? STATUS_EXPIRED : STATUS_PENDING, fontSize: 12 }]}>
                          {formatDate(offer.expiry_date)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Job Skills */}
                {offer.job_skills && offer.job_skills.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Required Skills</Text>
                    <View style={styles.skillsContainer}>
                      {offer.job_skills.map((skill, index) => (
                        <View key={index} style={styles.modalSkillChip}>
                          <Text style={styles.modalSkillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Freelancer Skills (from profile) */}
                {offer.freelancer_skills && offer.freelancer_skills.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Your Matched Skills</Text>
                    <View style={styles.skillsContainer}>
                      {offer.freelancer_skills.map((skill, index) => (
                        <View key={index} style={[styles.modalSkillChip, { backgroundColor: 'rgba(212,175,55,0.2)' }]}>
                          <Text style={styles.modalSkillText}>{skill}</Text>
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
                      <Ionicons name="checkmark-circle" size={20} color="#0a0a0a" />
                      <Text style={styles.modalAcceptText}>Accept Offer</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.modalCounterBtn]}
                      onPress={() => handleCounterOffer(offer)}
                    >
                      <Ionicons name="chatbubble" size={20} color={GOLD} />
                      <Text style={styles.modalCounterText}>Counter</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.modalDeclineBtn]}
                      onPress={() => handleDeclineOffer(offer)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                      <Text style={styles.modalDeclineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {offer.status === 'pending' && isExpired && (
                  <View style={styles.expiredMessage}>
                    <Ionicons name="alert-circle" size={48} color={STATUS_EXPIRED} />
                    <Text style={styles.expiredTitle}>Offer Expired</Text>
                    <Text style={styles.expiredText}>
                      This offer expired on {formatDate(offer.expiry_date)} and is no longer available.
                    </Text>
                  </View>
                )}

                {offer.status === 'accepted' && (
                  <View style={styles.modalAcceptedMessage}>
                    <Ionicons name="checkmark-circle" size={48} color={STATUS_ACCEPTED} />
                    <Text style={styles.modalAcceptedTitle}>Offer Accepted!</Text>
                    <Text style={styles.modalAcceptedText}>
                      You have accepted this offer. The client will contact you soon with next steps.
                    </Text>
                    <TouchableOpacity 
                      style={styles.modalMessageBtn}
                      onPress={() => {
                        onClose();
                        onNavigate('Messages', { userId: offer.client_id });
                      }}
                    >
                      <Ionicons name="chatbubble" size={20} color="#0a0a0a" />
                      <Text style={styles.modalMessageBtnText}>Message Client</Text>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Received Offers</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Received Offers</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={22} color={GOLD} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['all', 'pending', 'accepted', 'declined'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={64} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>No offers found</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all' 
                ? "You haven't received any offers yet" 
                : `No ${activeTab} offers to display`}
            </Text>
            <TouchableOpacity 
              style={styles.browseJobsBtn}
              onPress={() => onNavigate('BrowseJobs')}
            >
              <Text style={styles.browseJobsText}>Browse Jobs</Text>
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: CARD_BG, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
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
    borderRadius: 8,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabActive: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderColor: GOLD,
  },
  tabText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: GOLD,
    fontWeight: '500',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabBadgeActive: {
    backgroundColor: GOLD,
  },
  tabBadgeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  tabBadgeTextActive: {
    color: '#0a0a0a',
    fontWeight: '600',
  },

  // Offer Card
  offersList: {
    padding: 16,
  },
  offerCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
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
    fontWeight: '500',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  offerMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    marginBottom: 12,
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
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
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
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: GOLD,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  declineBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  declineBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },

  // Empty State
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
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 20,
  },
  browseJobsBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseJobsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a0a0a',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
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
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClientInitials: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  modalClientInfo: {
    flex: 1,
  },
  modalClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalRatingText: {
    fontSize: 13,
    color: '#fff',
  },
  modalReviewCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  modalProjectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
  modalDetailsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  modalDetailCard: {
    flex: 1,
    backgroundColor: INPUT_BG,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalDetailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalSkillChip: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  modalSkillText: {
    fontSize: 12,
    color: GOLD,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalAcceptBtn: {
    backgroundColor: GOLD,
  },
  modalAcceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  modalCounterBtn: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  modalCounterText: {
    fontSize: 14,
    fontWeight: '500',
    color: GOLD,
  },
  modalDeclineBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  modalDeclineText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
  },
  expiredMessage: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  expiredTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  expiredText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalAcceptedMessage: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  modalAcceptedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  modalAcceptedText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalMessageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
});