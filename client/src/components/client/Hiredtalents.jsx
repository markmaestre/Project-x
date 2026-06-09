import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, RefreshControl, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getSentOffers, updateOfferStatus } from '../../Redux/slices/offerSlice';
import { getClientJobs } from '../../Redux/slices/jobSlice';

const GREEN       = '#4ADE80';
const GREEN_DARK  = '#22C55E';
const GREEN_SOFT  = '#DCFCE7';
const GREEN_MID   = '#86EFAC';
const WHITE       = '#FFFFFF';
const OFF_WHITE   = '#F0FDF4';
const BORDER      = 'rgba(74,222,128,0.25)';
const TEXT_MAIN   = '#0F2417';
const TEXT_MUTED  = '#6B7280';
const TEXT_LIGHT  = '#9CA3AF';

const TABS = ['All', 'accepted', 'completed'];

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper function to calculate progress
const calculateProgress = (createdAt, updatedAt, status) => {
  if (status === 'completed') return 100;
  if (status === 'accepted') {
    const created = new Date(createdAt);
    const now = new Date();
    const daysElapsed = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    const progress = Math.min(Math.floor((daysElapsed / 30) * 100), 95);
    return progress;
  }
  return 0;
};

// Get initials from name
const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

// Generate random color based on name
const getAvatarColor = (name) => {
  const colors = [GREEN, GREEN_DARK, '#60a5fa', '#fbbf24', '#f87171', '#34d399', '#818cf8', '#f472b6'];
  const index = name?.length % colors.length || 0;
  return colors[index];
};

export default function HiredTalentScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { sentOffers, isLoading: offersLoading } = useSelector((state) => state.offers);
  const { clientJobs } = useSelector((state) => state.jobs.jobs);
  
  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [hiredTalents, setHiredTalents] = useState([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getSentOffers({})).unwrap(),
        dispatch(getClientJobs({})).unwrap(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load hired talents');
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process accepted offers into hired talents
  useEffect(() => {
    if (sentOffers && sentOffers.length > 0) {
      const acceptedOffers = sentOffers.filter(offer => 
        offer.status === 'accepted' || offer.status === 'completed'
      );
      
      const talents = acceptedOffers.map(offer => {
        const job = clientJobs?.find(j => j._id === offer.job_id);
        
        return {
          id: offer._id,
          freelancer_id: offer.freelancer_id,
          name: offer.freelancer_name,
          firstName: offer.freelancer_first_name,
          lastName: offer.freelancer_last_name,
          username: offer.freelancer_username,
          profilePicture: offer.freelancer_profile_picture,
          role: offer.freelancer_skills?.[0] || 'Freelancer',
          job: offer.job_title,
          jobId: offer.job_id,
          amount: offer.amount,
          status: offer.status === 'accepted' ? 'Ongoing' : 'Completed',
          progress: calculateProgress(offer.created_at, offer.updated_at, offer.status),
          hired: formatDate(offer.responded_at || offer.created_at),
          message: offer.message,
          skills: offer.freelancer_skills,
        };
      });
      
      setHiredTalents(talents);
    }
  }, [sentOffers, clientJobs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Filter based on active tab
  const filteredTalents = hiredTalents.filter((talent) =>
    activeTab === 'All' ? true : 
    activeTab === 'accepted' ? talent.status === 'Ongoing' : talent.status === 'Completed'
  );

  // Statistics
  const totalHired = hiredTalents.length;
  const ongoingCount = hiredTalents.filter(t => t.status === 'Ongoing').length;
  const completedCount = hiredTalents.filter(t => t.status === 'Completed').length;
  const totalSpent = hiredTalents.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Handle message freelancer
  const handleMessage = (freelancerId, freelancerName) => {
    onNavigate('Messages', { 
      userId: freelancerId, 
      userName: freelancerName,
      userRole: 'freelancer'
    });
  };

  // Handle view project details
  const handleViewProject = (jobId) => {
    onNavigate('JobDetails', { jobId });
  };

  // Handle mark as completed
  const handleMarkCompleted = (offerId) => {
    Alert.alert(
      'Complete Project',
      'Are you sure you want to mark this project as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await dispatch(updateOfferStatus({ offerId, status: 'completed' })).unwrap();
              Alert.alert('Success', 'Project marked as completed');
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to update project status');
            }
          }
        }
      ]
    );
  };

  // Render loading state
  if (offersLoading && !refreshing && hiredTalents.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
            <View style={styles.backIconWrap}>
              <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
            </View>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Hired <Text style={styles.green}>Talent</Text></Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={GREEN_DARK} />
          <Text style={styles.loadingText}>Loading hired talents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
          <View style={styles.backIconWrap}>
            <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
          </View>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Hired <Text style={styles.green}>Talent</Text></Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <View style={styles.backIconWrap}>
            <Ionicons name="refresh-outline" size={18} color={GREEN_DARK} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{totalHired}</Text>
          <Text style={styles.statLabel}>Total Hired</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#4ade80' }]}>{ongoingCount}</Text>
          <Text style={styles.statLabel}>Ongoing</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: GREEN_DARK }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: GREEN_DARK, fontSize: 16 }]}>
            ₱{totalSpent.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
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
                {tab === 'All' ? 'All' : tab === 'accepted' ? 'Ongoing' : 'Completed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_DARK} />
        }
      >
        {filteredTalents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={48} color={GREEN_DARK} />
            </View>
            <Text style={styles.emptyTitle}>No hired talents yet</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'All' 
                ? "You haven't hired any freelancers yet" 
                : `No ${activeTab === 'accepted' ? 'ongoing' : 'completed'} projects found`}
            </Text>
            <TouchableOpacity 
              style={styles.browseBtn}
              onPress={() => onNavigate('FindFreelancers')}
            >
              <Text style={styles.browseBtnText}>Browse Freelancers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTalents.map((item) => {
            const avatarColor = getAvatarColor(item.name);
            const initials = getInitials(item.firstName, item.lastName);
            const isOngoing = item.status === 'Ongoing';
            
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.card} 
                activeOpacity={0.85}
                onPress={() => handleViewProject(item.jobId)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: `${avatarColor}22` }]}>
                    {item.profilePicture ? (
                      <Image source={{ uri: item.profilePicture }} style={styles.avatarImage} />
                    ) : (
                      <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
                    )}
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.role}>{item.role}</Text>
                  </View>
                  {!isOngoing ? (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#4ade80" />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  ) : (
                    <View style={styles.ongoingBadge}>
                      <View style={styles.ongoingDot} />
                      <Text style={styles.ongoingText}>Ongoing</Text>
                    </View>
                  )}
                </View>

                <View style={styles.jobRow}>
                  <Ionicons name="briefcase-outline" size={12} color={TEXT_MUTED} />
                  <Text style={styles.jobText} numberOfLines={1}>{item.job}</Text>
                  <Text style={styles.amount}>₱{item.amount?.toLocaleString()}</Text>
                </View>

                {/* Skills */}
                {item.skills && item.skills.length > 0 && (
                  <View style={styles.skillsContainer}>
                    {item.skills.slice(0, 3).map((skill, idx) => (
                      <View key={idx} style={styles.skillChip}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                    {item.skills.length > 3 && (
                      <Text style={styles.moreSkills}>+{item.skills.length - 3}</Text>
                    )}
                  </View>
                )}

                {/* Progress Bar - only for ongoing projects */}
                {isOngoing && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={[styles.progressPct, { color: GREEN_DARK }]}>
                        {item.progress}%
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${item.progress}%`, backgroundColor: GREEN_DARK },
                        ]}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Ionicons name="calendar-outline" size={11} color={TEXT_LIGHT} />
                  <Text style={styles.hiredDate}>Hired {item.hired}</Text>
                  
                  {isOngoing && (
                    <TouchableOpacity 
                      style={styles.completeBtn}
                      onPress={() => handleMarkCompleted(item.id)}
                    >
                      <Ionicons name="checkmark-done-outline" size={12} color="#4ade80" />
                      <Text style={styles.completeBtnText}>Complete</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.msgBtn}
                    onPress={() => handleMessage(item.freelancer_id, item.name)}
                  >
                    <Ionicons name="chatbubble-outline" size={13} color={GREEN_DARK} />
                    <Text style={styles.msgText}>Message</Text>
                  </TouchableOpacity>
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
  safe: { flex: 1, backgroundColor: OFF_WHITE },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { alignSelf: 'flex-start' },
  backIconWrap: {
    width: 38, height: 38,
    backgroundColor: WHITE,
    borderRadius: 11,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  refreshBtn: { alignSelf: 'flex-start' },
  topbarTitle: { fontSize: 16, fontWeight: '600', color: TEXT_MAIN },
  green: { color: GREEN_DARK, fontStyle: 'italic', fontWeight: '700' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    backgroundColor: WHITE,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  statLabel: { fontSize: 9, color: TEXT_MUTED, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 30, backgroundColor: BORDER },
  tabScroll: { flexGrow: 0 },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE,
  },
  tabActive: { backgroundColor: GREEN_SOFT, borderColor: GREEN_DARK },
  tabText: { fontSize: 12, color: TEXT_MUTED },
  tabTextActive: { color: GREEN_DARK, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 80, height: 80,
    backgroundColor: GREEN_SOFT,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseBtn: {
    backgroundColor: GREEN_DARK,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
  },
  card: {
    backgroundColor: WHITE, 
    borderRadius: 14, 
    padding: 14,
    borderWidth: 1, 
    borderColor: BORDER, 
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  avatarText: { fontSize: 14, fontWeight: '700' },
  headerInfo: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
  role: { fontSize: 11, color: TEXT_MUTED },
  ongoingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: `${GREEN}15`, borderWidth: 0.5,
    borderColor: `${GREEN}30`,
  },
  ongoingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4ade80' },
  ongoingText: { fontSize: 10, fontWeight: '600', color: '#4ade80' },
  completedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: `${GREEN}15`, borderWidth: 0.5,
    borderColor: `${GREEN}30`,
  },
  completedText: { fontSize: 10, fontWeight: '600', color: GREEN_DARK },
  jobRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  jobText: { flex: 1, fontSize: 12, color: TEXT_MUTED },
  amount: { fontSize: 13, fontWeight: '700', color: GREEN_DARK },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  skillChip: {
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: GREEN_SOFT,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: GREEN_MID,
  },
  skillText: { fontSize: 10, color: GREEN_DARK, fontWeight: '500' },
  moreSkills: { fontSize: 10, color: TEXT_MUTED, alignSelf: 'center' },
  progressSection: { marginBottom: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 10, color: TEXT_MUTED, letterSpacing: 0.5 },
  progressPct: { fontSize: 10, fontWeight: '700' },
  progressTrack: {
    height: 4, backgroundColor: BORDER, borderRadius: 999, overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 999 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  hiredDate: { flex: 1, fontSize: 10, color: TEXT_LIGHT },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1,
    borderColor: `${GREEN}30`,
    backgroundColor: `${GREEN}15`,
  },
  completeBtnText: { fontSize: 10, fontWeight: '600', color: '#4ade80' },
  msgBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1,
    borderColor: `${GREEN}30`,
    backgroundColor: `${GREEN}15`,
  },
  msgText: { fontSize: 10, fontWeight: '600', color: GREEN_DARK },
});