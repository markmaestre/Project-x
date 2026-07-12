import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  RefreshControl,
  BackHandler,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import { Directory, File, Paths } from 'expo-file-system';
import { getProfile, logout } from '../../Redux/slices/authSlice';

// ── Vantara Design Tokens (shared with ClientProfile) ─────────────────────────
const NAVY        = '#071A3E';
const NAVY_DEEP   = '#050F26';
const NAVY_SOFT   = '#0B2657';
const BLUE        = '#0055A5';
const BLUE_SOFT   = 'rgba(0,85,165,0.10)';
const GOLD        = '#C89520';
const GOLD_LT     = '#E8B84B';
const GOLD_DK     = '#8A6410';
const GOLD_SOFT   = 'rgba(200,149,32,0.14)';
const WHITE       = '#FFFFFF';
const BG          = '#EEF4FA';
const CARD        = '#FFFFFF';
const TEXT_MAIN   = '#071A3E';
const TEXT_MUTED  = '#3A5070';
const TEXT_LIGHT  = '#7A90A8';
const BORDER      = '#DCE6F2';
const RED         = '#DC2626';
const RED_SOFT    = '#FEF2F2';
const RED_BORDER  = '#FECACA';
const GREEN       = '#16A34A';
const GREEN_SOFT  = '#E5F5F0';

const SHADOW_CARD  = { shadowColor: NAVY_SOFT, shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 };
const SHADOW_FLOAT  = { shadowColor: NAVY_SOFT, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.16, shadowRadius: 26, elevation: 10 };
const SHADOW_GOLD   = { shadowColor: GOLD_DK,  shadowOffset: { width: 0, height: 6 },  shadowOpacity: 0.32, shadowRadius: 14, elevation: 6 };
// ─────────────────────────────────────────────────────────────────────────────

const CV_DIRECTORY = new Directory(Paths.document, 'cvs');

const MENU_ITEMS = [
  { key: 'editProfile',   label: 'Edit Profile',      sub: 'Update your info and photo',       icon: 'person-outline',            nav: 'EditProfile' },
  { key: 'notifications', label: 'Notifications',     sub: 'Manage alerts and updates',        icon: 'notifications-outline',     nav: 'Notifications' },
  { key: 'privacy',       label: 'Privacy & Security',sub: 'Manage your data and security',    icon: 'shield-checkmark-outline',  nav: 'PrivacySecurity' },
  { key: 'help',          label: 'Help & Support',    sub: 'FAQs and contact us',              icon: 'help-circle-outline',       nav: 'HelpSupport' },
];

const IMPROVE_ITEMS = [
  {
    key: 'qualifications',
    title: 'Qualifications',
    desc: 'Highlight your skills and experience.',
    icon: 'star-outline',
    reward: '+10% match',
    nav: 'EditProfile',
  },
  {
    key: 'preferences',
    title: 'Job Preferences',
    desc: 'Set minimum pay, schedule, and location.',
    icon: 'options-outline',
    reward: '+7% match',
    nav: 'EditProfile',
  },
  {
    key: 'filters',
    title: 'Hide Jobs With These Details',
    desc: 'Manage what gets filtered from your search.',
    icon: 'eye-off-outline',
    reward: '+3% match',
    nav: 'EditProfile',
  },
  {
    key: 'ready',
    title: 'Ready To Work',
    desc: 'Signal employers you\u2019re available immediately.',
    icon: 'checkmark-circle-outline',
    reward: '+5% match',
    nav: 'EditProfile',
  },
];

// ── Bottom Tab Bar ────────────────────────────────────────────────────────────
function BottomTabBar({ activeTab, onTabPress, pendingOffers }) {
  const tabs = [
    { key: 'FreelancerDashboard', label: 'Home',         icon: 'home-outline',            activeIcon: 'home' },
    { key: 'Messages',            label: 'Messages',     icon: 'chatbubble-outline',       activeIcon: 'chatbubble' },
    { key: 'MyJobs',              label: 'My Jobs',      icon: 'briefcase-outline',        activeIcon: 'briefcase' },
    { key: 'MyApplications',      label: 'Applications', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' },
    { key: 'Profile',             label: 'Profile',      icon: 'person-outline',           activeIcon: 'person' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isMyJobs = tab.key === 'MyJobs';
          const hasBadge = tab.key === 'Messages' && pendingOffers > 0;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isMyJobs && styles.tabItemCenter]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
            >
              {isMyJobs ? (
                <LinearGradient colors={[GOLD_LT, GOLD, GOLD_DK]} style={styles.centerButton}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={23}
                    color={WHITE}
                  />
                </LinearGradient>
              ) : (
                <>
                  <View style={styles.tabIconWrap}>
                    <Ionicons
                      name={isActive ? tab.activeIcon : tab.icon}
                      size={21}
                      color={isActive ? BLUE : TEXT_LIGHT}
                    />
                    {hasBadge && <View style={styles.tabBadgeDot} />}
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ── Circular progress ring (SVG-based) ─────────────────────────────────────────
function ProgressRing({ percent, size = 80, strokeWidth = 7, color = GOLD, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotateZ: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.16)" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}

// ── InfoTile ──────────────────────────────────────────────────────────────────
function InfoTile({ icon, label, value }) {
  return (
    <Pressable style={({ pressed }) => [it.tile, pressed && it.tilePressed]}>
      <View style={it.iconWrap}>
        <Ionicons name={icon} size={16} color={BLUE} />
      </View>
      <Text style={it.label}>{label}</Text>
      <Text style={it.value} numberOfLines={2}>{value || 'Not specified'}</Text>
    </Pressable>
  );
}

const it = StyleSheet.create({
  tile: {
    width: '48%',
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  tilePressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: BLUE_SOFT,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  label: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 13.5, color: TEXT_MAIN, fontWeight: '600', lineHeight: 19 },
});

// ── ChipList ──────────────────────────────────────────────────────────────────
function ChipList({ items, icon = 'checkmark-circle', emptyIcon = 'add-circle-outline', emptyText = 'None added yet', onEdit }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];

  if (list.length === 0) {
    return (
      <TouchableOpacity
        style={styles.emptyChipRow}
        onPress={onEdit}
        activeOpacity={onEdit ? 0.7 : 1}
        disabled={!onEdit}
      >
        <Ionicons name={emptyIcon} size={16} color={TEXT_LIGHT} />
        <Text style={styles.emptyChipText}>{emptyText}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.chipListWrap}>
      {list.map((item, i) => (
        <View key={`${item}-${i}`} style={styles.chipReadOnly}>
          <Ionicons name={icon} size={12} color={BLUE} style={{ marginRight: 6 }} />
          <Text style={styles.chipReadOnlyText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ── CVItem ────────────────────────────────────────────────────────────────────
function CVItem({ name, date, onPress }) {
  return (
    <TouchableOpacity style={styles.cvItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cvLeft}>
        <View style={styles.cvIconWrap}>
          <Ionicons name="document-text-outline" size={19} color={BLUE} />
        </View>
        <View style={styles.cvContent}>
          <Text style={styles.cvName} numberOfLines={1}>{name}</Text>
          <Text style={styles.cvDate}>Added {date}</Text>
        </View>
      </View>
      <View style={styles.cvActionWrap}>
        <Ionicons name="open-outline" size={16} color={BLUE} />
      </View>
    </TouchableOpacity>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, onEdit }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={14} color={BLUE} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onEdit && (
        <TouchableOpacity style={styles.editRowBtn} onPress={onEdit} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={13} color={BLUE} />
          <Text style={styles.editRowBtnText}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Skeleton (loading placeholder) ────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={[styles.skeletonBlock, { width: 84, height: 84, borderRadius: 42, alignSelf: 'center', marginBottom: 16 }]} />
      <View style={[styles.skeletonBlock, { width: 160, height: 18, alignSelf: 'center', marginBottom: 8 }]} />
      <View style={[styles.skeletonBlock, { width: 100, height: 12, alignSelf: 'center', marginBottom: 20 }]} />
      <View style={[styles.skeletonBlock, { width: '100%', height: 44, borderRadius: 10, marginBottom: 10 }]} />
      <View style={[styles.skeletonBlock, { width: '100%', height: 44, borderRadius: 10 }]} />
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function Profile({ onNavigate, route }) {
  const { user, status } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [savedCV, setSavedCV] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!user);
  const [cvLoading, setCvLoading] = useState(true);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Track navigation history to handle back button properly
  const [navigationHistory, setNavigationHistory] = useState([]);

  const slideAnim   = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const heroAnim    = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroAnim, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [heroAnim, pulseAnim]);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  // Initial data load — fixes missing profile fetch on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      await Promise.all([fetchProfile(), loadLocalCV()]);
      if (isMounted) setInitialLoading(false);
    })();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle hardware back button press ──
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If drawer is open, close it first
      if (drawerOpen) {
        closeDrawer();
        return true;
      }

      // Check if we have a return state from the route (where user came from)
      if (route?.returnState?.activeTab) {
        onNavigate(route.returnState.activeTab);
        return true;
      }

      // Check if we have navigation history
      if (navigationHistory.length > 0) {
        const lastTab = navigationHistory[navigationHistory.length - 1];
        setNavigationHistory(prev => prev.slice(0, -1));
        onNavigate(lastTab);
        return true;
      }

      // Default: navigate to the dashboard/home tab
      onNavigate('FreelancerDashboard');
      return true;
    });

    return () => backHandler.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, onNavigate, navigationHistory, drawerOpen]);

  const fetchProfile = useCallback(async () => {
    try {
      await dispatch(getProfile()).unwrap();
    } catch {
      Alert.alert('Couldn\u2019t load profile', 'Check your connection and try again.');
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), loadLocalCV()]);
    setRefreshing(false);
  }, [fetchProfile]);

  const loadLocalCV = async () => {
    setCvLoading(true);
    try {
      const exists = CV_DIRECTORY.exists;
      if (!exists) {
        setSavedCV(null);
        return;
      }
      const files = CV_DIRECTORY.list() ?? [];
      const cvFiles = files.filter(
        (f) => f?.name && /\.(pdf|docx?|rtf)$/i.test(f.name)
      );
      if (cvFiles.length === 0) {
        setSavedCV(null);
        return;
      }
      // Prefer the most recently modified file, falling back gracefully
      const withStats = cvFiles.map((f) => {
        let modified = null;
        try { modified = f.modificationTime ?? null; } catch { /* noop */ }
        return { uri: f.uri, name: f.name, size: f.size, modified };
      });
      withStats.sort((a, b) => (b.modified ?? 0) - (a.modified ?? 0));
      setSavedCV(withStats[0]);
    } catch (e) {
      console.error('Error loading local CV:', e);
      setSavedCV(null);
    } finally {
      setCvLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const d = timestamp ? new Date(timestamp) : new Date();
    if (Number.isNaN(d.getTime())) return 'Unknown date';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const viewCV = async () => {
    if (!savedCV?.uri) return;
    try {
      const file = new File(savedCV.uri);
      if (file.exists) {
        await file.open();
      } else {
        Alert.alert('File not found', 'This resume may have been moved or deleted.');
        setSavedCV(null);
      }
    } catch {
      Alert.alert('Couldn\u2019t open file', 'Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
              onNavigate('Login');
            } catch {
              Alert.alert('Couldn\u2019t log out', 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleTabBarPress = (key) => {
    // Save current tab to history before navigating
    if (key !== 'Profile') {
      setNavigationHistory(prev => [...prev, 'Profile']);
    }

    const returnState = { activeTab: 'Profile' };
    if (key !== 'Profile') {
      onNavigate(key, { returnState, fromTab: 'Profile' });
    }
  };

  const toEdit = () => onNavigate('EditProfile');

  // ── Drawer ─────────────────────────────────────────────────────────────────
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const handleMenuNav = (nav) => {
    closeDrawer();
    setTimeout(() => onNavigate(nav), 240);
  };

  const handleSignOut = () => {
    closeDrawer();
    setTimeout(handleLogout, 240);
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const rateText = user?.hourly_rate
    ? `\u20b1${user.hourly_rate} / hour`
    : user?.fixed_rate
    ? `\u20b1${user.fixed_rate} (fixed rate)`
    : null;

  const experienceText = user?.years_of_experience
    ? `${user.years_of_experience} year${Number(user.years_of_experience) === 1 ? '' : 's'}`
    : null;

  const isAvailable = user?.is_available ?? true;
  const isVerified = Boolean(user?.is_verified);
  const rating = user?.average_rating ? Number(user.average_rating).toFixed(1) : null;
  const completedJobs = user?.completed_jobs_count ?? 0;

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Your Name';
  const heroHeadline = experienceText ? `${experienceText} of experience` : null;
  const location = [user?.city, user?.country].filter(Boolean).join(', ') || null;

  // ── Profile completion (derived, presentational only) ──────────────────────
  const completionFields = [
    { key: 'photo',    label: 'Photo',     icon: 'camera-outline',        done: !!user?.profile_picture },
    { key: 'about',    label: 'About',     icon: 'document-text-outline', done: !!user?.bio_about },
    { key: 'resume',   label: 'Resume',    icon: 'document-outline',      done: !!savedCV },
    { key: 'skills',   label: 'Skills',    icon: 'star-outline',          done: Array.isArray(user?.skills) && user.skills.length > 0 },
    { key: 'rate',     label: 'Rate',      icon: 'cash-outline',          done: !!rateText },
    { key: 'languages',label: 'Languages', icon: 'language-outline',      done: Array.isArray(user?.languages) && user.languages.length > 0 },
  ];
  const completedCount = completionFields.filter((f) => f.done).length;
  const completionPercent = Math.round((completedCount / completionFields.length) * 100);

  const drawerTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });

  const heroOpacity = heroAnim;
  const heroTranslateY = heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY_DEEP} />
      <LinearGradient colors={[BG, '#E3EDF8', BG]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* Top bar */}
        <LinearGradient colors={[NAVY_DEEP, NAVY, NAVY_SOFT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topbar}>
          <View>
            <Text style={styles.topbarEyebrow}>MY PROFILE</Text>
            <Text style={styles.topbarTitle}>{fullName.split(' ')[0]}'s Workspace</Text>
          </View>
          <TouchableOpacity style={styles.menuBtn} onPress={openDrawer} activeOpacity={0.7}>
            <Ionicons name="menu" size={20} color={WHITE} />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} colors={[BLUE, GOLD]} />}
        >
          {initialLoading ? (
            <View style={styles.loadingCard}>
              <ProfileSkeleton />
            </View>
          ) : (
            <>
              {/* ── Hero ── */}
              <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] }}>
                <LinearGradient
                  colors={[NAVY_DEEP, NAVY, NAVY_SOFT]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.hero}
                >
                  {/* abstract decorative blobs */}
                  <View style={[styles.heroBlob, styles.heroBlobGold]} />
                  <View style={[styles.heroBlob, styles.heroBlobBlue]} />

                  <View style={styles.heroTop}>
                    <View style={styles.avatarWrap}>
                      <Animated.View
                        pointerEvents="none"
                        style={[styles.avatarGlow, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
                      />
                      <TouchableOpacity onPress={toEdit} activeOpacity={0.85}>
                        <View style={styles.avatarRing}>
                          {user?.profile_picture ? (
                            <Image source={{ uri: user.profile_picture }} style={styles.avatarImg} />
                          ) : (
                            <View style={styles.avatarPlaceholder}>
                              <Text style={styles.avatarInitials}>{initials || '?'}</Text>
                            </View>
                          )}
                        </View>
                        {isVerified && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="shield-checkmark" size={11} color={WHITE} />
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>

                    <ProgressRing percent={completionPercent} size={64} strokeWidth={5.5} color={GOLD_LT}>
                      <Text style={styles.ringPercentSm}>{completionPercent}%</Text>
                    </ProgressRing>
                  </View>

                  <Text style={styles.heroName} numberOfLines={2}>{fullName}</Text>
                  {user?.username ? <Text style={styles.heroUsername}>@{user.username}</Text> : null}
                  {heroHeadline ? <Text style={styles.heroHeadline} numberOfLines={1}>{heroHeadline}</Text> : null}

                  <View style={styles.badgeRow}>
                    {isVerified && (
                      <View style={styles.badgePill}>
                        <Ionicons name="shield-checkmark" size={11} color={GOLD_LT} />
                        <Text style={styles.badgePillText}>Verified</Text>
                      </View>
                    )}
                    <View style={styles.badgePill}>
                      <Ionicons name={isAvailable ? 'checkmark-circle' : 'pause-circle'} size={11} color={isAvailable ? '#4ADE80' : WHITE} />
                      <Text style={styles.badgePillText}>{isAvailable ? 'Available for work' : 'Not available'}</Text>
                    </View>
                    {rating ? (
                      <View style={styles.badgePill}>
                        <Ionicons name="star" size={11} color={GOLD_LT} />
                        <Text style={styles.badgePillText}>{rating} Rating</Text>
                      </View>
                    ) : null}
                    <View style={styles.badgePill}>
                      <Ionicons name="checkmark-done-circle-outline" size={11} color={WHITE} />
                      <Text style={styles.badgePillText}>{completedJobs} Jobs Done</Text>
                    </View>
                  </View>

                  <View style={styles.heroGlass}>
                    <View style={styles.contactRow}>
                      <Ionicons name="mail-outline" size={14} color={GOLD_LT} />
                      <Text style={styles.contactText} numberOfLines={1}>{user?.email_address ?? 'Not set'}</Text>
                    </View>
                    {user?.phone_number ? (
                      <View style={styles.contactRow}>
                        <Ionicons name="call-outline" size={14} color={GOLD_LT} />
                        <Text style={styles.contactText} numberOfLines={1}>{user.phone_number}</Text>
                      </View>
                    ) : null}
                    {location ? (
                      <View style={styles.contactRow}>
                        <Ionicons name="location-outline" size={14} color={GOLD_LT} />
                        <Text style={styles.contactText} numberOfLines={1}>{location}</Text>
                      </View>
                    ) : null}
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* ── Profile Strength ── */}
              <View style={styles.strengthCard}>
                <View style={styles.strengthLeft}>
                  <ProgressRing percent={completionPercent} size={92} strokeWidth={9} color={GOLD}>
                    <Text style={styles.ringPercentLg}>{completionPercent}%</Text>
                    <Text style={styles.ringPercentTiny}>strength</Text>
                  </ProgressRing>
                </View>
                <View style={styles.strengthRight}>
                  <Text style={styles.strengthTitle}>Profile Strength</Text>
                  <Text style={styles.strengthSub}>Complete profiles get up to 3x more job invites.</Text>
                  <View style={styles.checklist}>
                    {completionFields.map((f) => (
                      <View key={f.key} style={styles.checklistRow}>
                        <View style={[styles.checkDot, f.done ? styles.checkDotDone : styles.checkDotPending]}>
                          <Ionicons name={f.done ? 'checkmark' : 'ellipse'} size={f.done ? 10 : 6} color={f.done ? WHITE : TEXT_LIGHT} />
                        </View>
                        <Text style={[styles.checklistText, f.done && styles.checklistTextDone]}>{f.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* ── Availability banner ── */}
              <TouchableOpacity style={styles.visibilityCardWrap} onPress={toEdit} activeOpacity={0.85}>
                <LinearGradient colors={[NAVY, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.visibilityCard}>
                  <View style={styles.visibilityIconWrap}>
                    <Ionicons name={isAvailable ? 'flash' : 'pause'} size={20} color={WHITE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.visibilityTitleRow}>
                      <Text style={styles.visibilityTitle}>Availability Status</Text>
                      <View style={styles.visibilityStatusChip}>
                        <View style={[styles.visibilityDot, !isAvailable && { backgroundColor: TEXT_LIGHT }]} />
                        <Text style={styles.visibilityStatusText}>{isAvailable ? 'Available' : 'Paused'}</Text>
                      </View>
                    </View>
                    <Text style={styles.visibilityDesc}>Clients can see this when browsing your profile</Text>
                  </View>
                  <View style={styles.visibilityManageBtn}>
                    <Text style={styles.visibilityManageText}>Manage</Text>
                    <Ionicons name="chevron-forward" size={13} color={WHITE} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* ── Resume ── */}
              <View style={styles.section}>
                <SectionHeader icon="document-text-outline" title="Resume" />
                {cvLoading ? (
                  <View style={styles.emptyRow}>
                    <ActivityIndicator size="small" color={BLUE} />
                    <Text style={[styles.emptyText, { marginLeft: 8 }]}>Checking for resume\u2026</Text>
                  </View>
                ) : savedCV ? (
                  <CVItem
                    name={savedCV.name.replace(/^cv_\d+_/, '')}
                    date={formatDate(savedCV.modified)}
                    onPress={viewCV}
                  />
                ) : (
                  <TouchableOpacity style={styles.emptyRow} onPress={toEdit} activeOpacity={0.7}>
                    <View style={styles.emptyRowLeft}>
                      <Ionicons name="cloud-upload-outline" size={16} color={TEXT_LIGHT} />
                      <Text style={styles.emptyText}>No resume uploaded yet</Text>
                    </View>
                    <View style={styles.linkRow}>
                      <Text style={styles.linkText}>Add Resume</Text>
                      <Ionicons name="chevron-forward" size={14} color={BLUE} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── About ── */}
              <View style={styles.section}>
                <SectionHeader icon="person-outline" title="About" onEdit={toEdit} />
                {user?.bio_about ? (
                  <View style={styles.aboutCard}>
                    <Text style={styles.aboutQuote}>\u201c</Text>
                    <Text style={styles.aboutText} numberOfLines={aboutExpanded ? undefined : 4}>
                      {user.bio_about}
                    </Text>
                    {user.bio_about.length > 160 && (
                      <TouchableOpacity onPress={() => setAboutExpanded((v) => !v)} activeOpacity={0.7}>
                        <Text style={styles.aboutToggle}>{aboutExpanded ? 'Show less' : 'Read more'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity style={styles.emptyRow} onPress={toEdit} activeOpacity={0.7}>
                    <View style={styles.emptyRowLeft}>
                      <Ionicons name="create-outline" size={16} color={TEXT_LIGHT} />
                      <Text style={styles.emptyText}>Tell clients about yourself</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={BLUE} />
                  </TouchableOpacity>
                )}
              </View>

              {/* ── Professional Details ── */}
              <View style={styles.section}>
                <SectionHeader icon="briefcase-outline" title="Professional Details" onEdit={toEdit} />
                <View style={styles.tileGrid}>
                  <InfoTile icon="time-outline" label="Experience" value={experienceText} />
                  <InfoTile icon="cash-outline"  label="Rate"       value={rateText} />
                </View>
              </View>

              {/* ── Skills ── */}
              <View style={styles.section}>
                <SectionHeader icon="star-outline" title="Skills" onEdit={toEdit} />
                <View style={{ paddingTop: 4 }}>
                  <ChipList
                    items={user?.skills}
                    icon="pricetag"
                    emptyIcon="add-circle-outline"
                    emptyText="Add skills to get matched with jobs"
                    onEdit={toEdit}
                  />
                </View>
              </View>

              {/* ── Languages & Certifications ── */}
              <View style={styles.section}>
                <SectionHeader icon="ribbon-outline" title="Languages & Certifications" onEdit={toEdit} />
                <Text style={styles.subLabel}>Languages</Text>
                <ChipList items={user?.languages} icon="language" emptyText="No languages added" onEdit={toEdit} />
                <Text style={[styles.subLabel, { marginTop: 4 }]}>Certifications</Text>
                <ChipList
                  items={user?.certifications}
                  icon="ribbon"
                  emptyText="No certifications added"
                  onEdit={toEdit}
                />
              </View>

              {/* ── Improve Job Matches ── */}
              <View style={styles.improveSection}>
                <Text style={styles.improveHeading}>Improve Your Job Matches</Text>
                <Text style={styles.improveSub}>Add more details to get better job recommendations.</Text>
              </View>

              <View style={{ paddingHorizontal: 16, gap: 12, marginBottom: 8 }}>
                {IMPROVE_ITEMS.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => onNavigate(item.nav)}
                    style={({ pressed }) => [styles.recommendCard, pressed && styles.recommendCardPressed]}
                  >
                    <LinearGradient colors={[GOLD_SOFT, 'rgba(0,85,165,0.05)']} style={styles.recommendIconWrap}>
                      <Ionicons name={item.icon} size={22} color={GOLD_DK} />
                    </LinearGradient>
                    <View style={styles.recommendInfo}>
                      <Text style={styles.recommendTitle}>{item.title}</Text>
                      <Text style={styles.recommendDesc} numberOfLines={2}>{item.desc}</Text>
                      <View style={styles.recommendRewardChip}>
                        <Ionicons name="trending-up" size={11} color={GOLD_DK} />
                        <Text style={styles.recommendRewardText}>{item.reward}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={TEXT_LIGHT} />
                  </Pressable>
                ))}
              </View>

             

              {/* Extra bottom padding to account for the fixed tab bar */}
              <View style={{ height: 24 }} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Overlay */}
      {drawerOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} pointerEvents="auto">
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        </Animated.View>
      )}

      {/* Right Drawer — solid background, no blur/transparency */}
      {drawerOpen && (
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }] }]}>
          <SafeAreaView style={styles.drawerInner} edges={['top', 'bottom']}>
            <LinearGradient colors={[NAVY_DEEP, NAVY, NAVY_SOFT]} style={styles.drawerHeader}>
              <TouchableOpacity style={styles.drawerCloseBtn} onPress={closeDrawer} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color={WHITE} />
              </TouchableOpacity>

              <View style={styles.drawerAvatarWrap}>
                {user?.profile_picture ? (
                  <Image source={{ uri: user.profile_picture }} style={styles.drawerAvatar} />
                ) : (
                  <View style={styles.drawerAvatarPlaceholder}>
                    <Text style={styles.drawerAvatarInitials}>{initials || '?'}</Text>
                  </View>
                )}
                {isVerified && (
                  <View style={styles.drawerVerified}>
                    <Ionicons name="checkmark" size={10} color={WHITE} />
                  </View>
                )}
              </View>

              <Text style={styles.drawerName} numberOfLines={1}>{fullName}</Text>
              {heroHeadline ? <Text style={styles.drawerRole} numberOfLines={1}>{heroHeadline}</Text> : null}
              {user?.email_address ? <Text style={styles.drawerEmail} numberOfLines={1}>{user.email_address}</Text> : null}

              <View style={styles.drawerFooterBadges}>
                {isVerified && (
                  <View style={styles.drawerMembershipBadge}>
                    <Ionicons name="shield-checkmark" size={11} color={GOLD_LT} />
                    <Text style={styles.drawerMembershipText}>Verified Freelancer</Text>
                  </View>
                )}
                <View style={styles.drawerCompletionBadge}>
                  <Text style={styles.drawerCompletionText}>{completionPercent}% complete</Text>
                </View>
              </View>
            </LinearGradient>

            <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
              {MENU_ITEMS.map((item, i) => (
                <React.Fragment key={item.key}>
                  <Pressable
                    onPress={() => handleMenuNav(item.nav)}
                    style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
                  >
                    <View style={styles.drawerItemIcon}>
                      <Ionicons name={item.icon} size={18} color={BLUE} />
                    </View>
                    <View style={styles.drawerItemText}>
                      <Text style={styles.drawerItemLabel}>{item.label}</Text>
                      <Text style={styles.drawerItemSub}>{item.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={TEXT_LIGHT} />
                  </Pressable>
                  {i < MENU_ITEMS.length - 1 && <View style={styles.drawerDivider} />}
                </React.Fragment>
              ))}
            </ScrollView>

            <View style={styles.drawerFooter}>
              <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.signOutWrap, pressed && styles.signOutWrapPressed]}>
                <LinearGradient colors={['#FEE2E2', RED_SOFT]} style={styles.signOutBtn}>
                  <View style={styles.signOutIconWrap}>
                    <Ionicons name="log-out-outline" size={18} color={RED} />
                  </View>
                  <Text style={styles.signOutText}>Sign Out</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      <BottomTabBar activeTab="Profile" onTabPress={handleTabBarPress} pendingOffers={0} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1, backgroundColor: 'transparent' },

  // Top bar
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    ...SHADOW_FLOAT,
  },
  topbarEyebrow: { fontSize: 10, fontWeight: '700', color: GOLD_LT, letterSpacing: 1.2, marginBottom: 2 },
  topbarTitle:   { fontSize: 17, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  menuBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingBottom: 80, paddingTop: 4 },

  loadingCard: {
    backgroundColor: CARD, marginHorizontal: 14, marginTop: 14,
    borderRadius: 28, padding: 22,
    ...SHADOW_FLOAT,
  },

  // Hero
  hero: {
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 28,
    paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20,
    overflow: 'hidden',
    ...SHADOW_FLOAT,
  },
  heroBlob: { position: 'absolute', width: 180, height: 180, borderRadius: 90, opacity: 0.5 },
  heroBlobGold: { backgroundColor: 'rgba(200,149,32,0.22)', top: -70, right: -50 },
  heroBlobBlue: { backgroundColor: 'rgba(0,85,165,0.25)', bottom: -80, left: -60 },

  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },
  avatarGlow: {
    position: 'absolute', width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(232,184,75,0.5)',
  },
  avatarRing: {
    width: 76, height: 76, borderRadius: 38,
    padding: 3,
    backgroundColor: GOLD_LT,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 70, height: 70, borderRadius: 35 },
  avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 24, fontWeight: '800', color: WHITE },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: BLUE,
    borderWidth: 2, borderColor: NAVY,
    alignItems: 'center', justifyContent: 'center',
  },
  ringPercentSm: { fontSize: 13, fontWeight: '800', color: WHITE },

  heroName: { fontSize: 22, fontWeight: '800', color: WHITE, letterSpacing: -0.3, marginBottom: 3 },
  heroUsername: { fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginBottom: 3 },
  heroHeadline: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  badgePillText: { fontSize: 11, fontWeight: '700', color: WHITE },

  heroGlass: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    padding: 14,
    gap: 10,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  contactText: { fontSize: 12.5, color: 'rgba(255,255,255,0.9)', flex: 1, minWidth: 0 },

  // Profile strength
  strengthCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 16, marginTop: 18,
    backgroundColor: CARD, borderRadius: 22,
    borderWidth: 1, borderColor: BORDER,
    padding: 18,
    ...SHADOW_FLOAT,
  },
  strengthLeft: { alignItems: 'center', justifyContent: 'center' },
  ringPercentLg: { fontSize: 18, fontWeight: '800', color: TEXT_MAIN },
  ringPercentTiny: { fontSize: 9, color: TEXT_LIGHT, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  strengthRight: { flex: 1, minWidth: 0 },
  strengthTitle: { fontSize: 15, fontWeight: '800', color: TEXT_MAIN, marginBottom: 3 },
  strengthSub: { fontSize: 11.5, color: TEXT_MUTED, lineHeight: 16, marginBottom: 10 },
  checklist: { gap: 6 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkDotDone: { backgroundColor: GREEN },
  checkDotPending: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  checklistText: { fontSize: 11.5, color: TEXT_LIGHT, fontWeight: '500' },
  checklistTextDone: { color: TEXT_MUTED, fontWeight: '600' },

  // Availability banner
  visibilityCardWrap: { marginHorizontal: 16, marginTop: 16, borderRadius: 18, ...SHADOW_GOLD },
  visibilityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 16,
  },
  visibilityIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  visibilityTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  visibilityTitle: { fontSize: 13.5, fontWeight: '700', color: WHITE },
  visibilityStatusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  visibilityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  visibilityStatusText: { fontSize: 10, fontWeight: '700', color: WHITE },
  visibilityDesc: { fontSize: 11.5, color: 'rgba(255,255,255,0.78)' },
  visibilityManageBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  visibilityManageText: { fontSize: 11.5, fontWeight: '700', color: WHITE },

  // Sections
  section: {
    backgroundColor: CARD, marginTop: 16, marginHorizontal: 16,
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: BORDER,
    ...SHADOW_CARD,
  },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: BLUE_SOFT,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 13.5, fontWeight: '800', color: TEXT_MAIN, letterSpacing: 0.2 },
  editRowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: BLUE_SOFT, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(0,85,165,0.18)',
  },
  editRowBtnText: { fontSize: 12, fontWeight: '700', color: BLUE },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 14 },

  // About
  aboutCard: { padding: 16, paddingTop: 4 },
  aboutQuote: { fontSize: 40, color: GOLD, fontWeight: '800', lineHeight: 40, marginBottom: -6 },
  aboutText: { fontSize: 13.5, color: TEXT_MUTED, lineHeight: 21 },
  aboutToggle: { fontSize: 12, fontWeight: '700', color: BLUE, marginTop: 8 },

  // Chips
  subLabel: {
    fontSize: 11, fontWeight: '700', color: TEXT_LIGHT,
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  chipListWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  chipReadOnly: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BLUE_SOFT,
    borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8,
  },
  chipReadOnlyText: { fontSize: 12.5, fontWeight: '600', color: BLUE },
  emptyChipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  emptyChipText: { fontSize: 13, color: TEXT_LIGHT },

  // CV
  cvItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  cvLeft: { flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1 },
  cvIconWrap: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: BLUE_SOFT,
    alignItems: 'center', justifyContent: 'center',
  },
  cvContent: { flex: 1 },
  cvName:    { fontSize: 14.5, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
  cvDate:    { fontSize: 11.5, color: TEXT_LIGHT },
  cvActionWrap: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: BLUE_SOFT,
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty
  emptyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, paddingHorizontal: 16,
  },
  emptyRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  emptyText: { fontSize: 13, color: TEXT_LIGHT, flexShrink: 1 },
  linkRow:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText:  { fontSize: 13, color: BLUE, fontWeight: '600' },

  // Improve profile
  improveSection: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 10 },
  improveHeading: { fontSize: 16, fontWeight: '800', color: TEXT_MAIN, marginBottom: 3 },
  improveSub:     { fontSize: 12, color: TEXT_MUTED, lineHeight: 18 },

  recommendCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER,
    padding: 14,
    ...SHADOW_CARD,
  },
  recommendCardPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  recommendIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  recommendInfo: { flex: 1, minWidth: 0 },
  recommendTitle: { fontSize: 13.5, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  recommendDesc: { fontSize: 11.5, color: TEXT_MUTED, lineHeight: 16, marginBottom: 6 },
  recommendRewardChip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: GOLD_SOFT, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  recommendRewardText: { fontSize: 10, fontWeight: '700', color: GOLD_DK },

  // Footer — bottom-most element of the page
  footer:        { paddingTop: 20, paddingBottom: 8, paddingHorizontal: 16, alignItems: 'center', marginTop: 20 },
  footerDivider: { width: 40, height: 3, borderRadius: 999, backgroundColor: BORDER, marginBottom: 14 },
  footerText:    { fontSize: 11, color: TEXT_LIGHT },
  footerLink:    { color: BLUE, textDecorationLine: 'underline' },

  // Skeleton
  skeletonWrap: { width: '100%' },
  skeletonBlock: { backgroundColor: BORDER, borderRadius: 6, opacity: 0.7 },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,15,38,0.6)', zIndex: 10 },

  // Drawer — fully solid/opaque, no blur, no translucent panels
  drawer: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: '80%',
    zIndex: 20, overflow: 'hidden',
    backgroundColor: CARD,
    borderLeftWidth: 1, borderLeftColor: BORDER,
    ...SHADOW_FLOAT,
  },
  drawerInner: { flex: 1, backgroundColor: CARD },
  drawerHeader: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20,
    borderBottomLeftRadius: 26,
  },
  drawerCloseBtn: {
    alignSelf: 'flex-end', width: 30, height: 30, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  drawerAvatarWrap: { marginBottom: 12 },
  drawerAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: GOLD_LT },
  drawerAvatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD_LT },
  drawerAvatarInitials: { fontSize: 20, fontWeight: '800', color: WHITE },
  drawerVerified: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: BLUE, borderWidth: 2, borderColor: NAVY,
    alignItems: 'center', justifyContent: 'center',
  },
  drawerName: { fontSize: 16, fontWeight: '800', color: WHITE },
  drawerRole: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  drawerEmail: { fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  drawerFooterBadges: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  drawerMembershipBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  drawerMembershipText: { fontSize: 10.5, fontWeight: '700', color: WHITE },
  drawerCompletionBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  drawerCompletionText: { fontSize: 10.5, fontWeight: '700', color: GOLD_LT },

  drawerBody: { flex: 1, paddingTop: 6, backgroundColor: CARD },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  drawerItemPressed: { backgroundColor: 'rgba(0,85,165,0.06)' },
  drawerItemIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: BLUE_SOFT, alignItems: 'center', justifyContent: 'center' },
  drawerItemText: { flex: 1, minWidth: 0 },
  drawerItemLabel: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  drawerItemSub: { fontSize: 11, color: TEXT_LIGHT, marginTop: 1 },
  drawerDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 20 },
  drawerFooter: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER },
  signOutWrap: { borderRadius: 16, ...SHADOW_CARD },
  signOutWrapPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: RED_BORDER,
  },
  signOutIconWrap: { width: 28, height: 28, borderRadius: 9, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontSize: 14.5, fontWeight: '800', color: RED },

  // Bottom Tab Bar
  tabSafe: { backgroundColor: CARD, borderTopWidth: 1.5, borderTopColor: BORDER, ...SHADOW_FLOAT },
  tabBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: 10, paddingBottom: 12, paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, position: 'relative',
  },
  tabItemCenter: { flex: 0, marginHorizontal: 8, marginTop: -18 },
  centerButton: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: WHITE,
    ...SHADOW_GOLD,
  },
  tabIconWrap: { position: 'relative', marginBottom: 4 },
  tabLabel:       { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500', marginTop: 2 },
  tabLabelActive: { color: BLUE, fontWeight: '700' },
  tabIndicator: {
    position: 'absolute', bottom: -8,
    width: 20, height: 3, borderRadius: 1.5, backgroundColor: BLUE,
  },
  tabBadgeDot: {
    position: 'absolute', top: -3, right: -6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: GOLD, borderWidth: 1.5, borderColor: WHITE,
  },
});