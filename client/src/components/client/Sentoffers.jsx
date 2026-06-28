import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
  Alert, ActivityIndicator, RefreshControl, Modal, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

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
const GREEN_SOFT = '#D1FAE5';
const GREEN_MID  = '#86EFAC';
const GREEN_DARK = '#059669';
const ORANGE     = '#F97316';
const RED        = '#EF4444';
// ─────────────────────────────────────────────────────────────────────────────────

const TABS = ['All', 'pending', 'accepted', 'declined', 'expired'];

const statusStyle = {
  pending:  { bg: `${GOLD}15`, border: `${GOLD}30`, text: GOLD, dot: GOLD, label: 'Pending', icon: 'time-outline' },
  accepted: { bg: `${GREEN}15`, border: `${GREEN}30`, text: GREEN, dot: GREEN, label: 'Accepted', icon: 'checkmark-circle-outline' },
  declined: { bg: `${RED}15`, border: `${RED}30`, text: RED, dot: RED, label: 'Declined', icon: 'close-circle-outline' },
  expired:  { bg: `${TEXT_MUTED}15`, border: `${TEXT_MUTED}30`, text: TEXT_MUTED, dot: TEXT_MUTED, label: 'Expired', icon: 'alert-circle-outline' },
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
  return date.toLocaleDateString('en-PH', {
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
  const colors = [BLUE, BLUE_MD, GOLD, '#60a5fa', '#fbbf24', '#f87171', '#34d399', '#818cf8', '#f472b6'];
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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
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
              <TouchableOpacity onPress={() => setShowOfferModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={TEXT_MUTED} />
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
                    <Ionicons name="chatbubble-outline" size={14} color={BLUE} style={{ marginRight: 8 }} />
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
                  <Text style={[styles.detailValue, { color: selectedOffer.status === 'expired' ? RED : BLUE }]}>
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
                      <Ionicons name="person-outline" size={16} color={BLUE} />
                      <Text style={styles.viewFreelancerBtnText}>View Freelancer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.viewJobBtn]}
                      onPress={() => handleViewJob(selectedOffer.job_id)}
                    >
                      <Ionicons name="briefcase-outline" size={16} color={BLUE} />
                      <Text style={styles.viewJobBtnText}>View Job</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.cancelOfferBtn]}
                      onPress={() => handleCancelOffer(selectedOffer._id)}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={RED} />
                      <Text style={styles.cancelOfferBtnText}>Withdraw Offer</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {selectedOffer.status === 'expired' && (
                  <TouchableOpacity 
                    style={[styles.modalActionBtn, styles.resendOfferBtn]}
                    onPress={() => handleResendOffer(selectedOffer)}
                  >
                    <Ionicons name="refresh-outline" size={16} color={WHITE} />
                    <Text style={styles.resendOfferBtnText}>Send New Offer</Text>
                  </TouchableOpacity>
                )}
                
                {(selectedOffer.status === 'accepted' || selectedOffer.status === 'declined') && (
                  <>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.viewFreelancerBtn]}
                      onPress={() => handleViewFreelancer(selectedOffer)}
                    >
                      <Ionicons name="person-outline" size={16} color={BLUE} />
                      <Text style={styles.viewFreelancerBtnText}>View Freelancer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, styles.messageFreelancerBtn]}
                      onPress={() => handleMessageFreelancer(selectedOffer.freelancer_id)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={WHITE} />
                      <Text style={styles.messageFreelancerBtnText}>Message</Text>
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
              <TouchableOpacity onPress={() => setShowFreelancerModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <View style={[styles.profileAvatar, { backgroundColor: BLUE }]}>
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
                  <View style={styles.sectionHeader}>
                    <Ionicons name="flash-outline" size={16} color={BLUE} />
                    <Text style={styles.detailSectionTitle}>Skills</Text>
                  </View>
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
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={16} color={BLUE} />
                  <Text style={styles.detailSectionTitle}>Offer Details</Text>
                </View>
                <View style={styles.offerInfoCard}>
                  <View style={styles.offerInfoRow}>
                    <Ionicons name="cash-outline" size={14} color={BLUE} />
                    <Text style={styles.offerInfoText}>Amount: ₱{freelancer.amount?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.offerInfoRow}>
                    <Ionicons name="briefcase-outline" size={14} color={BLUE} />
                    <Text style={styles.offerInfoText}>Job: {freelancer.job_title}</Text>
                  </View>
                  <View style={styles.offerInfoRow}>
                    <Ionicons name="calendar-outline" size={14} color={BLUE} />
                    <Text style={styles.offerInfoText}>Sent: {formatFullDate(freelancer.created_at)}</Text>
                  </View>
                  {freelancer.status === 'accepted' && (
                    <View style={styles.offerInfoRow}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={GREEN} />
                      <Text style={[styles.offerInfoText, { color: GREEN }]}>Accepted on {formatFullDate(freelancer.responded_at)}</Text>
                    </View>
                  )}
                  {freelancer.status === 'declined' && (
                    <View style={styles.offerInfoRow}>
                      <Ionicons name="close-circle-outline" size={14} color={RED} />
                      <Text style={[styles.offerInfoText, { color: RED }]}>Declined on {formatFullDate(freelancer.responded_at)}</Text>
                    </View>
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
                  <Ionicons name="chatbubble-outline" size={16} color={WHITE} />
                  <Text style={styles.messageProfileBtnText}>Message</Text>
                </TouchableOpacity>
                
                {freelancer.status === 'pending' && (
                  <TouchableOpacity 
                    style={[styles.profileActionBtn, styles.withdrawProfileBtn]}
                    onPress={() => {
                      setShowFreelancerModal(false);
                      handleCancelOffer(freelancer._id);
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={RED} />
                    <Text style={styles.withdrawProfileBtnText}>Withdraw</Text>
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
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('Mypostings')}>
            <View style={styles.backIconWrap}>
              <Ionicons name="arrow-back" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Sent Offers</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading your offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('Mypostings')}>
          <View style={styles.backIconWrap}>
            <Ionicons name="arrow-back" size={18} color={WHITE} />
          </View>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Sent Offers</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchSentOffers}>
          <View style={styles.refreshIconWrap}>
            <Ionicons name="refresh-outline" size={18} color={BLUE} />
          </View>
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
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'All' ? 'All' : statusStyle[tab]?.label || tab}
              </Text>
              <View style={[styles.tabDot, activeTab === tab && styles.tabDotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
        }
      >
        {filteredOffers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="paper-plane-outline" size={48} color={BLUE} />
            </View>
            <Text style={styles.emptyTitle}>No sent offers</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'All' 
                ? "You haven't sent any offers yet" 
                : `No ${statusStyle[activeTab]?.label?.toLowerCase() || activeTab} offers found`}
            </Text>
            <TouchableOpacity 
              style={styles.browseBtn}
              onPress={() => onNavigate('FindJobs')}
            >
              <Ionicons name="search-outline" size={18} color={WHITE} style={{ marginRight: 6 }} />
              <Text style={styles.browseBtnText}>Browse Freelancers</Text>
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
                activeOpacity={0.85}
                onPress={() => {
                  setSelectedOffer(item);
                  setShowOfferModal(true);
                }}
              >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: `${avatarColor}15` }]}>
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
                      <Ionicons name="cash-outline" size={11} color={BLUE} />
                      <Text style={styles.amount}>₱{item.amount?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={11} color={TEXT_MUTED} />
                      <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
                    </View>
                    {item.message && (
                      <View style={styles.messagePreview}>
                        <Ionicons name="chatbubble-outline" size={10} color={TEXT_LIGHT} />
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
                        <Ionicons name="close-circle-outline" size={12} color={RED} />
                        <Text style={styles.cancelBtnText}>Withdraw</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.messageBtn]}
                        onPress={() => handleMessageFreelancer(item.freelancer_id)}
                      >
                        <Ionicons name="chatbubble-outline" size={12} color={WHITE} />
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
                        <Ionicons name="refresh-outline" size={12} color={WHITE} />
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
                        <Ionicons name="person-outline" size={12} color={BLUE} />
                        <Text style={styles.viewProfileActionBtnText}>View Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.messageBtn]}
                        onPress={() => handleMessageFreelancer(item.freelancer_id)}
                      >
                        <Ionicons name="chatbubble-outline" size={12} color={WHITE} />
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
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: NAVY,
  },
  backBtn: { alignSelf: 'flex-start' },
  backIconWrap: {
    width: 40, height: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  refreshBtn: { alignSelf: 'flex-start' },
  refreshIconWrap: {
    width: 40, height: 40,
    backgroundColor: 'rgba(0,104,181,0.1)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,104,181,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  topbarTitle: { fontSize: 18, fontWeight: '700', color: WHITE, letterSpacing: -0.3 },
  summaryRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: CARD,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  summaryCard: {
    flex: 1, borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1,
  },
  summaryCount: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  summaryLabel: { fontSize: 10, color: TEXT_MUTED, letterSpacing: 0.5, fontWeight: '500' },
  tabScroll: { flexGrow: 0, backgroundColor: CARD },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG,
  },
  tabActive: { backgroundColor: `${BLUE}10`, borderColor: BLUE },
  tabText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  tabTextActive: { color: BLUE, fontWeight: '600' },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabDotActive: {
    backgroundColor: BLUE,
  },
  scroll: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: TEXT_MUTED },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconWrap: { width: 80, height: 80, backgroundColor: `${BLUE}10`, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: TEXT_MAIN, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginBottom: 24, paddingHorizontal: 40 },
  browseBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  browseBtnText: { fontSize: 13, fontWeight: '600', color: WHITE },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: CARD, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: BORDER, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 14, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
  role: { fontSize: 11, color: TEXT_MUTED },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 0.5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  cardMiddle: { marginBottom: 8 },
  jobTitle: { fontSize: 12, color: BLUE, fontWeight: '500' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amount: { fontSize: 12, fontWeight: '600', color: BLUE },
  metaText: { fontSize: 10, color: TEXT_LIGHT },
  messagePreview: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  messageText: { fontSize: 10, color: TEXT_LIGHT, flex: 1 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  cancelBtn: { backgroundColor: `${RED}10`, borderWidth: 0.5, borderColor: `${RED}30` },
  cancelBtnText: { fontSize: 11, fontWeight: '500', color: RED },
  messageBtn: { backgroundColor: BLUE, borderWidth: 0.5, borderColor: `${BLUE}30` },
  messageBtnText: { fontSize: 11, fontWeight: '500', color: WHITE },
  resendActionBtn: { backgroundColor: BLUE, borderWidth: 0.5, borderColor: `${BLUE}30` },
  resendActionBtnText: { fontSize: 11, fontWeight: '500', color: WHITE },
  viewProfileActionBtn: { backgroundColor: `${BLUE}10`, borderWidth: 0.5, borderColor: `${BLUE}30` },
  viewProfileActionBtnText: { fontSize: 11, fontWeight: '500', color: BLUE },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: CARD, borderRadius: 20, width: '100%', maxHeight: '85%', borderWidth: 1, borderColor: BORDER },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: TEXT_MAIN },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, margin: 16, borderRadius: 12, borderWidth: 1 },
  statusBannerText: { fontSize: 16, fontWeight: '600' },
  detailSection: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  detailSectionTitle: { fontSize: 14, fontWeight: '600', color: BLUE },
  detailLabel: { fontSize: 11, fontWeight: '500', color: TEXT_MUTED, marginBottom: 4 },
  detailValue: { fontSize: 14, color: TEXT_MAIN },
  amountLarge: { fontSize: 28, fontWeight: '700', color: BLUE },
  messageCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: BG, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER },
  messageValue: { flex: 1, fontSize: 13, color: TEXT_MAIN, lineHeight: 18 },
  modalActions: { flexDirection: 'column', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: BORDER, marginTop: 8 },
  modalActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  viewFreelancerBtn: { backgroundColor: `${BLUE}10`, borderWidth: 1, borderColor: `${BLUE}20` },
  viewFreelancerBtnText: { fontSize: 14, fontWeight: '600', color: BLUE },
  viewJobBtn: { backgroundColor: `${BLUE}10`, borderWidth: 1, borderColor: `${BLUE}20` },
  viewJobBtnText: { fontSize: 14, fontWeight: '600', color: BLUE },
  cancelOfferBtn: { backgroundColor: `${RED}10`, borderWidth: 1, borderColor: `${RED}20` },
  cancelOfferBtnText: { fontSize: 14, fontWeight: '600', color: RED },
  resendOfferBtn: { backgroundColor: BLUE, borderWidth: 1, borderColor: `${BLUE}20` },
  resendOfferBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },
  messageFreelancerBtn: { backgroundColor: BLUE, borderWidth: 1, borderColor: `${BLUE}20` },
  messageFreelancerBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },
  // Freelancer Profile Modal Styles
  profileHeader: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileAvatarImage: { width: 80, height: 80, borderRadius: 40 },
  profileInitials: { fontSize: 32, fontWeight: '700', color: WHITE },
  profileName: { fontSize: 20, fontWeight: '600', color: TEXT_MAIN, marginBottom: 4 },
  profileUsername: { fontSize: 13, color: TEXT_MUTED },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: `${BLUE}10`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 0.5, borderColor: `${BLUE}20` },
  skillChipText: { fontSize: 12, color: BLUE, fontWeight: '500' },
  offerInfoCard: { backgroundColor: BG, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER, gap: 6 },
  offerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offerInfoText: { fontSize: 13, color: TEXT_MAIN },
  profileActions: { flexDirection: 'row', padding: 16, gap: 12 },
  profileActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  messageProfileBtn: { backgroundColor: BLUE, borderWidth: 1, borderColor: `${BLUE}20` },
  messageProfileBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },
  withdrawProfileBtn: { backgroundColor: `${RED}10`, borderWidth: 1, borderColor: `${RED}20` },
  withdrawProfileBtnText: { fontSize: 14, fontWeight: '600', color: RED },
});