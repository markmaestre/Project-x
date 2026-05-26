import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../Redux/slices/authSlice';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const SIDEBAR_BG = '#0f0f0f';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const SIDEBAR_WIDTH = 260;

const MENU_ITEMS = [
  { key: 'Overview',      label: 'Overview',       icon: 'grid-outline',        badge: null },
  { key: 'BrowseJobs',    label: 'Browse Jobs',    icon: 'search-outline',      badge: null },
  { key: 'MyJobs',        label: 'My Jobs',        icon: 'briefcase-outline',   badge: 4 },
  { key: 'ReceivedOffers',label: 'Received Offers',icon: 'mail-open-outline',   badge: 5 },
  { key: 'Portfolio',     label: 'Portfolio',      icon: 'images-outline',      badge: null },
];

const COMM_ITEMS = [
  { key: 'Messages', label: 'Messages',   icon: 'chatbubble-outline', badge: 3 },
  { key: 'Profile',  label: 'My Profile', icon: 'person-outline',     badge: null },
  { key: 'Settings', label: 'Settings',   icon: 'settings-outline',   badge: null },
];

const RECENT_ACTIVITY = [
  {
    id: '1',
    icon: 'checkmark-circle',
    iconColor: '#4ade80',
    iconBg: 'rgba(74,222,128,0.12)',
    title: 'Offer accepted by Servcorp Manila',
    sub: 'Office Setup Consultation · ₱28,000',
    time: '30 min ago',
  },
  {
    id: '2',
    icon: 'mail-open-outline',
    iconColor: GOLD,
    iconBg: 'rgba(212,175,55,0.12)',
    title: 'New offer received from Apex',
    sub: 'Branding Package · ₱45,000',
    time: '2 hrs ago',
  },
  {
    id: '3',
    icon: 'briefcase-outline',
    iconColor: GOLD,
    iconBg: 'rgba(212,175,55,0.12)',
    title: 'Applied for Motion Design Project',
    sub: 'Luminary Digital · ₱20k–₱40k',
    time: '4 hrs ago',
  },
  {
    id: '4',
    icon: 'checkmark-circle',
    iconColor: '#4ade80',
    iconBg: 'rgba(74,222,128,0.12)',
    title: 'Job completed',
    sub: 'Website Development · ₱35,000',
    time: '6 hrs ago',
  },
  {
    id: '5',
    icon: 'chatbubble-outline',
    iconColor: '#60a5fa',
    iconBg: 'rgba(96,165,250,0.12)',
    title: 'Client replied to your message',
    sub: 'Servcorp Manila',
    time: 'Yesterday',
  },
  {
    id: '6',
    icon: 'star-outline',
    iconColor: GOLD,
    iconBg: 'rgba(212,175,55,0.12)',
    title: 'New review received',
    sub: '5 stars from Apex Ventures',
    time: 'Yesterday',
  },
];

export default function FreelancerScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeMenu, setActiveMenu] = useState('Overview');
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`;
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

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
    // Close sidebar first
    closeSidebar();
    
    // Navigate based on menu item
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
          Alert.alert('Coming Soon', 'Portfolio feature coming soon!');
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
          setActiveMenu(key);
          break;
        default:
          setActiveMenu(key);
          break;
      }
    }, 350);
  };

  const SidebarItem = ({ item }) => {
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
        {item.badge && (
          <View style={[styles.badge, active && styles.badgeActive]}>
            <Text style={[styles.badgeText, active && { color: '#0a0a0a' }]}>
              {item.badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>

        {/* ── MAIN CONTENT ── */}
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
                <View style={styles.notifDot} />
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScroll}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statTop}>
                  <Text style={styles.statLabel}>ACTIVE JOBS</Text>
                  <Ionicons name="briefcase-outline" size={14} color="rgba(255,255,255,0.3)" />
                </View>
                <Text style={styles.statNumber}>
                  {user?.active_jobs ?? 3}
                  <Text style={styles.statDelta}> +1</Text>
                </Text>
                <Text style={styles.statSub}>↑ +1 this week</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statTop}>
                  <Text style={styles.statLabel}>RECEIVED OFFERS</Text>
                  <Ionicons name="mail-open-outline" size={14} color="rgba(255,255,255,0.3)" />
                </View>
                <Text style={styles.statNumber}>{user?.received_offers ?? 12}</Text>
                <Text style={[styles.statSub, { color: GOLD }]}>5 new this week</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statTop}>
                  <Text style={styles.statLabel}>COMPLETED</Text>
                  <Ionicons name="checkmark-circle-outline" size={14} color="rgba(255,255,255,0.3)" />
                </View>
                <Text style={styles.statNumber}>{user?.completed ?? 28}</Text>
                <Text style={styles.statSub}>+ 3 this month</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statTop}>
                  <Text style={styles.statLabel}>TOTAL EARNED</Text>
                  <Ionicons name="cash-outline" size={14} color="rgba(255,255,255,0.3)" />
                </View>
                <Text style={[styles.statNumber, { color: GOLD }]}>
                  {user?.total_earned ?? '₱142k'}
                </Text>
                <Text style={[styles.statSub, { color: GOLD }]}>+ 12% vs last month</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              Recent <Text style={styles.sectionTitleItalic}>Activity</Text>
            </Text>

            {RECENT_ACTIVITY.map((item) => (
              <TouchableOpacity key={item.id} style={styles.activityCard} activeOpacity={0.7}>
                <View style={[styles.activityIcon, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activitySub}>{item.sub}</Text>
                </View>
                <Text style={styles.activityTime}>{item.time}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── OVERLAY ── */}
        {sidebarVisible && (
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>
        )}

        {/* ── SIDEBAR DRAWER ── */}
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
  statDelta: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.35)' },
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
});