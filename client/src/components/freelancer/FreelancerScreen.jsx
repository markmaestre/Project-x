import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Animated,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../Redux/slices/authSlice';
import { getReceivedOffers, getOfferStats } from '../../Redux/slices/offerSlice';
import { getFreelancerJobs } from '../../Redux/slices/jobSlice';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const SIDEBAR_BG = '#0f0f0f';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const SIDEBAR_WIDTH = 260;

const MENU_ITEMS = [
  { key: 'Overview',      label: 'Overview',       icon: 'grid-outline',        badge: null },
  { key: 'BrowseJobs',    label: 'Browse Jobs',    icon: 'search-outline',      badge: null },
  { key: 'MyJobs',        label: 'My Jobs',        icon: 'briefcase-outline',   badge: null },
  { key: 'ReceivedOffers',label: 'Received Offers',icon: 'mail-open-outline',   badge: null },
  { key: 'Portfolio',     label: 'Portfolio',      icon: 'images-outline',      badge: null },
];

const COMM_ITEMS = [
  { key: 'Messages', label: 'Messages',   icon: 'chatbubble-outline', badge: null },
  { key: 'Profile',  label: 'My Profile', icon: 'person-outline',     badge: null },
  { key: 'Settings', label: 'Settings',   icon: 'settings-outline',   badge: null },
];

export default function FreelancerScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { receivedOffers, stats: offerStats, isLoading: offersLoading } = useSelector((state) => state.offers);
  const { list: jobs, isLoading: jobsLoading } = useSelector((state) => state.jobs.jobs);
  
  const [activeMenu, setActiveMenu] = useState('Overview');
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`;
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getReceivedOffers({})).unwrap(),
        dispatch(getFreelancerJobs({ limit: 10 })).unwrap(),
      ]);
      
      // Try to get offer stats, but don't fail if not available
      try {
        await dispatch(getOfferStats()).unwrap();
      } catch (statsError) {
        console.log('Offer stats not available yet');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Build recent activities from real data
  useEffect(() => {
    const activities = [];
    
    // Add recent offers received
    if (receivedOffers && receivedOffers.length > 0) {
      const recentOffers = receivedOffers.slice(0, 3);
      recentOffers.forEach(offer => {
        const statusColor = offer.status === 'pending' ? GOLD : offer.status === 'accepted' ? '#4ade80' : '#f87171';
        activities.push({
          id: `offer_${offer._id}`,
          icon: 'mail-open-outline',
          iconColor: statusColor,
          iconBg: `rgba(${statusColor === GOLD ? '212,175,55' : statusColor === '#4ade80' ? '74,222,128' : '248,113,113'},0.12)`,
          title: `Offer ${offer.status === 'pending' ? 'received from' : offer.status === 'accepted' ? 'accepted from' : 'declined from'} ${offer.client_name || 'Client'}`,
          sub: `${offer.job_title || 'Job'} · ₱${offer.amount?.toLocaleString() || 0}`,
          time: formatDate(offer.created_at),
          type: 'offer',
          status: offer.status,
        });
      });
    }
    
    // Add recent jobs (from freelancer jobs list - jobs they applied to)
    if (jobs && jobs.length > 0) {
      const recentJobs = jobs.slice(0, 3);
      recentJobs.forEach(job => {
        activities.push({
          id: `job_${job._id}`,
          icon: 'briefcase-outline',
          iconColor: GOLD,
          iconBg: 'rgba(212,175,55,0.12)',
          title: 'Applied for job',
          sub: `${job.title} · ₱${job.budget_amount?.toLocaleString()}`,
          time: formatDate(job.created_at),
          type: 'job',
        });
      });
    }
    
    // Sort by date (most recent first) and take first 6
    const sortedActivities = activities.sort((a, b) => {
      return b.time.localeCompare(a.time);
    }).slice(0, 6);
    
    setRecentActivities(sortedActivities);
  }, [receivedOffers, jobs]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Calculate statistics from real data
  const activeJobs = jobs?.filter(job => job.status === 'open' || job.status === 'in_progress').length || 0;
  const pendingOffers = receivedOffers?.filter(offer => offer.status === 'pending').length || 0;
  const acceptedOffers = receivedOffers?.filter(offer => offer.status === 'accepted').length || 0;
  const completedCount = acceptedOffers;
  const totalEarned = offerStats?.totalEarnings || 0;

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setSidebarVisible(false));
  };

  const toggleSidebar = () => {
    if (sidebarVisible) closeSidebar();
    else openSidebar();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const handleLogout = () => {
    closeSidebar();
    setTimeout(() => {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout());
            onNavigate('Login');
          },
        },
      ]);
    }, 300);
  };

  const handleMenuPress = (key) => {
    setActiveMenu(key);
    closeSidebar();
    setTimeout(() => {
      switch(key) {
        case 'BrowseJobs':
          onNavigate('BrowseJobs');
          break;
        case 'MyJobs':
          onNavigate('MyJobs');
          break;
        case 'ReceivedOffers':
          onNavigate('ReceivedOffers');
          break;
        case 'Portfolio':
          onNavigate('Portfolio');
          break;
        case 'Messages':
          onNavigate('Messages');
          break;
        case 'Profile':
          onNavigate('FreelancerProfile');
          break;
        case 'Settings':
          onNavigate('Settings');
          break;
        case 'Overview':
          // stays on this screen
          break;
        default:
          break;
      }
    }, 350);
  };

  const SidebarItem = ({ item }) => {
    // Update badge counts dynamically
    let badgeValue = null;
    if (item.key === 'ReceivedOffers' && pendingOffers > 0) {
      badgeValue = pendingOffers;
    }
    
    const active = activeMenu === item.key;
    return (
      <TouchableOpacity
        style={[styles.menuItem, active && styles.menuItemActive]}
        onPress={() => handleMenuPress(item.key)}
        activeOpacity={0.7}
      >
        {active && <View style={styles.menuActiveBar} />}
        <Ionicons
          name={item.icon}
          size={18}
          color={active ? GOLD : 'rgba(255,255,255,0.4)'}
        />
        <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
          {item.label}
        </Text>
        {badgeValue && (
          <View style={[styles.badge, active && styles.badgeActive]}>
            <Text style={[styles.badgeText, active && { color: '#0a0a0a' }]}>
              {badgeValue}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const isLoading = jobsLoading || offersLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>

        {/* MAIN CONTENT */}
        <View style={styles.main}>
          {/* Topbar */}
          <View style={styles.topbar}>
            <TouchableOpacity style={styles.burgerBtn} onPress={toggleSidebar} activeOpacity={0.7}>
              <View style={styles.burgerLine} />
              <View style={[styles.burgerLine, { width: 16 }]} />
              <View style={[styles.burgerLine, { width: 20 }]} />
            </TouchableOpacity>

            <Text style={styles.topbarTitle}>
              Freelancer <Text style={styles.topbarTitleItalic}>Dashboard</Text>
            </Text>

            <View style={styles.topbarRight}>
              <TouchableOpacity 
                style={styles.iconBtn}
                onPress={() => onNavigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.7)" />
                {pendingOffers > 0 && <View style={styles.notifDot} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconBtn}
                onPress={() => onNavigate('Search')}
              >
                <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.findWorkBtn}
                onPress={() => onNavigate('BrowseJobs')}
              >
                <Text style={styles.findWorkText}>+ Find Work</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.mainScroll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
            }
          >
            {isLoading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={GOLD} />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
              </View>
            ) : (
              <>
                <View style={styles.statsGrid}>
                  <TouchableOpacity 
                    style={styles.statCard}
                    onPress={() => onNavigate('BrowseJobs')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.statTop}>
                      <Text style={styles.statLabel}>ACTIVE JOBS</Text>
                      <Ionicons name="briefcase-outline" size={14} color="rgba(255,255,255,0.3)" />
                    </View>
                    <Text style={styles.statNumber}>
                      {activeJobs}
                    </Text>
                    <Text style={styles.statSub}>Active applications</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.statCard}
                    onPress={() => onNavigate('ReceivedOffers')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.statTop}>
                      <Text style={styles.statLabel}>RECEIVED OFFERS</Text>
                      <Ionicons name="mail-open-outline" size={14} color="rgba(255,255,255,0.3)" />
                    </View>
                    <Text style={styles.statNumber}>{receivedOffers?.length || 0}</Text>
                    {pendingOffers > 0 && (
                      <Text style={[styles.statSub, { color: GOLD }]}>{pendingOffers} pending</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.statCard}
                    onPress={() => onNavigate('BrowseJobs')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.statTop}>
                      <Text style={styles.statLabel}>COMPLETED</Text>
                      <Ionicons name="checkmark-circle-outline" size={14} color="rgba(255,255,255,0.3)" />
                    </View>
                    <Text style={styles.statNumber}>{completedCount}</Text>
                    <Text style={styles.statSub}>Completed projects</Text>
                  </TouchableOpacity>

                  <View style={styles.statCard}>
                    <View style={styles.statTop}>
                      <Text style={styles.statLabel}>TOTAL EARNED</Text>
                      <Ionicons name="cash-outline" size={14} color="rgba(255,255,255,0.3)" />
                    </View>
                    <Text style={[styles.statNumber, { color: GOLD }]}>
                      ₱{totalEarned.toLocaleString()}
                    </Text>
                    <Text style={[styles.statSub, { color: GOLD }]}>Total earnings</Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>
                  Recent <Text style={styles.sectionTitleItalic}>Activity</Text>
                </Text>

                {recentActivities.length === 0 ? (
                  <View style={styles.emptyActivity}>
                    <Ionicons name="time-outline" size={48} color="rgba(255,255,255,0.1)" />
                    <Text style={styles.emptyActivityText}>No recent activity</Text>
                  </View>
                ) : (
                  recentActivities.map((item) => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={styles.activityCard} 
                      activeOpacity={0.7}
                      onPress={() => {
                        if (item.type === 'offer') {
                          onNavigate('ReceivedOffers');
                        } else if (item.type === 'job') {
                          onNavigate('BrowseJobs');
                        }
                      }}
                    >
                      <View style={[styles.activityIcon, { backgroundColor: item.iconBg }]}>
                        <Ionicons name={item.icon} size={18} color={item.iconColor} />
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle}>{item.title}</Text>
                        <Text style={styles.activitySub}>{item.sub}</Text>
                      </View>
                      <Text style={styles.activityTime}>{item.time}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>

        {/* OVERLAY */}
        {sidebarVisible && (
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>
        )}

        {/* SIDEBAR DRAWER */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Ionicons name="grid" size={14} color={GOLD} />
            </View>
            <Text style={styles.brandText}>PROJECT X</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={closeSidebar} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              {user?.profile_picture ? (
                <Image source={{ uri: user.profile_picture }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.userInitials}>{initials}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userFullName} numberOfLines={1}>{fullName}</Text>
              <Text style={styles.userRole}>Freelancer Account</Text>
            </View>
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.menuScroll}>
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionLabel}>MENU</Text>
              {MENU_ITEMS.map((item) => (
                <SidebarItem key={item.key} item={item} />
              ))}
            </View>
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionLabel}>COMMUNICATION</Text>
              {COMM_ITEMS.map((item) => (
                <SidebarItem key={item.key} item={item} />
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color="#ff6b6b" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  root: { flex: 1 },
  sidebar: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: SIDEBAR_BG,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 16,
    zIndex: 100,
    elevation: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 99,
    elevation: 19,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  brandIcon: {
    width: 28, height: 28,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  brandText: {
    flex: 1,
    fontSize: 10, fontWeight: '600',
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.4)',
  },
  closeBtn: {
    width: 30, height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  userAvatar: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 38, height: 38, borderRadius: 19 },
  userInitials: { fontSize: 13, fontWeight: '700', color: '#0a0a0a' },
  userInfo: { flex: 1 },
  userFullName: { fontSize: 12, fontWeight: '600', color: '#fff' },
  userRole: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  proBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  proText: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 0.5 },
  menuScroll: { flex: 1 },
  menuSection: { marginBottom: 20 },
  menuSectionLabel: {
    fontSize: 9, letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.2)',
    marginBottom: 8, paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
    position: 'relative',
  },
  menuItemActive: { backgroundColor: 'rgba(212,175,55,0.08)' },
  menuActiveBar: {
    position: 'absolute',
    left: 0, top: 6, bottom: 6,
    width: 3,
    backgroundColor: GOLD,
    borderRadius: 999,
  },
  menuLabel: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '400' },
  menuLabelActive: { color: '#fff', fontWeight: '500' },
  badge: {
    minWidth: 20, height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeActive: { backgroundColor: GOLD },
  badgeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.15)',
    marginTop: 8,
  },
  logoutText: { fontSize: 13, fontWeight: '500', color: '#ff6b6b' },
  main: { flex: 1, backgroundColor: BG },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  burgerBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
    borderWidth: 1, borderColor: BORDER,
  },
  burgerLine: { width: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 999 },
  topbarTitle: { fontSize: 16, fontWeight: '300', color: '#fff', flex: 1, marginLeft: 12 },
  topbarTitleItalic: { fontStyle: 'italic', color: GOLD, fontWeight: '400' },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  notifDot: {
    position: 'absolute', top: 7, right: 7,
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: GOLD,
    borderWidth: 1.5, borderColor: BG,
  },
  findWorkBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: GOLD, borderRadius: 10 },
  findWorkText: { fontSize: 11, fontWeight: '600', color: '#0a0a0a' },
  mainScroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  statCard: {
    width: '47.5%',
    backgroundColor: CARD_BG,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: BORDER,
  },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statLabel: { fontSize: 9, letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
  statNumber: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  statSub: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  sectionTitle: { fontSize: 18, fontWeight: '300', color: '#fff', marginBottom: 14 },
  sectionTitleItalic: { fontStyle: 'italic', color: GOLD, fontWeight: '400' },
  activityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: 12, padding: 12,
    marginBottom: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  activityIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 13, fontWeight: '500', color: '#fff', marginBottom: 2 },
  activitySub: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  activityTime: { fontSize: 10, color: 'rgba(255,255,255,0.25)' },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyActivityText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },
});