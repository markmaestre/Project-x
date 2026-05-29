import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getSentOffers, updateOfferStatus } from '../../Redux/slices/offerSlice';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';

const TABS = ['All', 'pending', 'accepted', 'declined'];

const statusStyle = {
  pending:  { bg: 'rgba(212,175,55,0.08)',   border: 'rgba(212,175,55,0.3)',   text: GOLD,       dot: GOLD, label: 'Pending' },
  accepted: { bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.3)',   text: '#4ade80',  dot: '#4ade80', label: 'Accepted' },
  declined: { bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.3)',  text: '#f87171',  dot: '#f87171', label: 'Declined' },
};

// Helper function to format date
const formatDate = (dateString) => {
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
  const { sentOffers, isLoading, error } = useSelector((state) => state.offers);
  const { token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

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

  // Handle offer status update (for future use)
  const handleOfferAction = (offerId, action) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this offer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.toUpperCase(),
          onPress: async () => {
            try {
              const newStatus = action === 'accept' ? 'accepted' : 'declined';
              await dispatch(updateOfferStatus({ offerId, status: newStatus })).unwrap();
              Alert.alert('Success', `Offer ${newStatus} successfully`);
              fetchSentOffers();
            } catch (error) {
              Alert.alert('Error', 'Failed to update offer status');
            }
          }
        }
      ]
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
        {['pending', 'accepted', 'declined'].map((status) => {
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
            const st = statusStyle[item.status];
            const avatarColor = getAvatarColor(item.freelancer_name);
            const initials = getInitials(item.freelancer_first_name, item.freelancer_last_name);
            
            return (
              <TouchableOpacity 
                key={item._id} 
                style={styles.card} 
                activeOpacity={0.75}
                onPress={() => {
                  // Navigate to offer details or conversation
                  Alert.alert(
                    'Offer Details',
                    `Offer sent to ${item.freelancer_name}\nAmount: ₱${item.amount?.toLocaleString()}\nStatus: ${st.label}`,
                    [
                      { text: 'Close', style: 'cancel' },
                      { text: 'View Job', onPress: () => onNavigate('JobDetails', { jobId: item.job_id }) },
                      { text: 'Message', onPress: () => onNavigate('Messages', { userId: item.freelancer_id }) }
                    ]
                  );
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
                        onPress={() => handleOfferAction(item._id, 'decline')}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.messageBtn]}
                        onPress={() => onNavigate('Messages', { userId: item.freelancer_id, offerId: item._id })}
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
});