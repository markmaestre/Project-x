import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Animated,
  RefreshControl,
  Pressable,
  BackHandler,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile, logout } from '../../Redux/slices/authSlice';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const NAVY        = '#071A3E';
const NAVY_DEEP    = '#050F26';
const NAVY_SOFT    = '#0B2657';
const BLUE         = '#0055A5';
const BLUE_SOFT    = 'rgba(0,85,165,0.10)';
const GOLD         = '#C89520';
const GOLD_LT      = '#E8B84B';
const GOLD_DK      = '#8A6410';
const GOLD_SOFT    = 'rgba(200,149,32,0.14)';
const WHITE        = '#FFFFFF';
const BG           = '#EEF4FA';
const CARD         = '#FFFFFF';
const GLASS        = 'rgba(255,255,255,0.14)';
const TEXT_MAIN    = '#071A3E';
const TEXT_MUTED   = '#3A5070';
const TEXT_LIGHT   = '#7A90A8';
const BORDER       = '#DCE6F2';
const RED          = '#DC2626';
const RED_SOFT     = '#FEF2F2';
const RED_BORDER   = '#FECACA';

const SHADOW_CARD  = { shadowColor: NAVY_SOFT, shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 };
const SHADOW_FLOAT  = { shadowColor: NAVY_SOFT, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.16, shadowRadius: 26, elevation: 10 };
const SHADOW_GOLD   = { shadowColor: GOLD_DK,  shadowOffset: { width: 0, height: 6 },  shadowOpacity: 0.32, shadowRadius: 14, elevation: 6 };
// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');

const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'       },
  { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'     },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline' },
  { key: 'Message',       label: 'Messages', icon: 'chatbubble',    iconOutline: 'chatbubble-outline' },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',        iconOutline: 'person-outline'     },
];

const MENU_ITEMS = [
  { key: 'editProfile',    label: 'Edit Profile',     sub: 'Update your info and photo',    icon: 'person-outline',        nav: 'ClientEditProfile' },
  { key: 'notifications',  label: 'Notifications',    sub: 'Manage alerts and updates',     icon: 'notifications-outline', nav: 'Notifications'     },
  { key: 'password',       label: 'Change Password',  sub: 'Update your credentials',       icon: 'key-outline',           nav: 'ChangePassword'    },
  { key: 'help',           label: 'Help & Support',   sub: 'FAQs and contact us',           icon: 'help-circle-outline',   nav: 'HelpSupport'       },
];

// Each improve item now has its own dedicated nav target
const IMPROVE_ITEMS = [
  {
    key: 'company',
    title: 'Company Details',
    desc: 'Add your business type, industry, and website.',
    icon: 'business-outline',
    reward: '+8% strength',
    nav: 'ClientEditProfile',
  },
  {
    key: 'budget',
    title: 'Budget Preferences',
    desc: 'Set your typical project budget range.',
    icon: 'cash-outline',
    reward: '+6% strength',
    nav: 'ClientEditProfile',
  },
  {
    key: 'communication',
    title: 'Communication Preferences',
    desc: 'Let freelancers know how you prefer to be contacted.',
    icon: 'chatbubble-outline',
    reward: '+4% strength',
    nav: 'ClientEditProfile',
  },
  {
    key: 'visibility',
    title: 'Profile Visibility',
    desc: 'Control who can see your profile and job posts.',
    icon: 'eye-outline',
    reward: '+2% strength',
    nav: 'ClientVisibility',
  },
];

export default function ClientProfile({ onNavigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [refreshing,      setRefreshing]      = useState(false);
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('ClientProfile');
  const [aboutExpanded,   setAboutExpanded]   = useState(false);

  const slideAnim   = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Purely cosmetic entrance / ambient animations — transform & opacity only,
  // all driven natively so they never touch layout-affecting business logic.
  const heroAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroAnim, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [heroAnim, pulseAnim]);

  // ── Handle hardware back button ──────────────────────────────────────────
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If drawer is open, close it first
      if (drawerOpen) {
        closeDrawer();
        return true;
      }

      // Otherwise navigate back to dashboard
      if (onNavigate) {
        onNavigate('ClientDashboard');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [drawerOpen, onNavigate]);

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
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          closeDrawer();
          dispatch(logout());
          onNavigate('Login');
        },
      },
    ]);
  };

  const handleTabPress = (key) => {
    setActiveBottomTab(key);
    if (key === 'Home')          onNavigate('ClientDashboard');
    if (key === 'PostJob')       onNavigate('PostJob');
    if (key === 'Hiredtalents')  onNavigate('Hiredtalents');
    if (key === 'Message')       onNavigate('Message');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  // ── Profile helpers ────────────────────────────────────────────────────────
  const getInitials = () => {
    const f = user?.first_name?.[0] || '';
    const l = user?.last_name?.[0]  || '';
    return `${f}${l}`.toUpperCase() || '?';
  };

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Your Name';
  const location = [user?.city, user?.country].filter(Boolean).join(', ') || null;
  const headline = [user?.company_name, 'Client'].filter(Boolean).join(' · ');
  const memberSince = user?.date_joined || user?.created_at || null;
  const memberSinceLabel = memberSince
    ? new Date(memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  // ── Profile completion (derived, presentational only) ──────────────────────
  const completionFields = [
    { key: 'photo',       label: 'Profile Photo', icon: 'camera-outline',       done: !!user?.profile_picture },
    { key: 'company',     label: 'Company',       icon: 'business-outline',     done: !!user?.company_name },
    { key: 'website',     label: 'Website',       icon: 'globe-outline',        done: !!user?.website },
    { key: 'about',       label: 'About',         icon: 'document-text-outline',done: !!user?.bio_about },
    { key: 'contact',     label: 'Contact',       icon: 'call-outline',         done: !!(user?.email_address || user?.phone_number) },
    { key: 'preferences', label: 'Preferences',   icon: 'options-outline',      done: !!user?.preferred_communication_method },
  ];
  const completedCount = completionFields.filter((f) => f.done).length;
  const completionPercent = Math.round((completedCount / completionFields.length) * 100);

  const fetchProfile = useCallback(async () => {
    try { await dispatch(getProfile()).unwrap(); }
    catch { Alert.alert('Error', 'Failed to load profile.'); }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const drawerTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });

  const heroOpacity = heroAnim;
  const heroTranslateY = heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <LinearGradient colors={[BG, '#E3EDF8', BG]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top']}>

        {/* Top bar */}
        <LinearGradient colors={[NAVY_DEEP, NAVY, NAVY_SOFT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.topbar}>
          <View>
            <Text style={s.topbarEyebrow}>MY PROFILE</Text>
            <Text style={s.topbarTitle}>{fullName.split(' ')[0]}'s Workspace</Text>
          </View>
          <TouchableOpacity style={s.menuBtn} onPress={openDrawer} activeOpacity={0.7}>
            <Ionicons name="menu" size={20} color={WHITE} />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} colors={[BLUE, GOLD]} />}
        >
          {/* ── Hero ── */}
          <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] }}>
            <LinearGradient
              colors={[NAVY_DEEP, NAVY, NAVY_SOFT]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.hero}
            >
              {/* abstract decorative blobs */}
              <View style={[s.heroBlob, s.heroBlobGold]} />
              <View style={[s.heroBlob, s.heroBlobBlue]} />

              <View style={s.heroTop}>
                <View style={s.avatarWrap}>
                  <Animated.View
                    pointerEvents="none"
                    style={[s.avatarGlow, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
                  />
                  <TouchableOpacity onPress={() => onNavigate('ClientEditProfile')} activeOpacity={0.85}>
                    <View style={s.avatarRing}>
                      {user?.profile_picture ? (
                        <Image source={{ uri: user.profile_picture }} style={s.avatarImg} />
                      ) : (
                        <View style={s.avatarPlaceholder}>
                          <Text style={s.avatarInitials}>{getInitials()}</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.verifiedBadge}>
                      <Ionicons name="checkmark" size={11} color={WHITE} />
                    </View>
                  </TouchableOpacity>
                </View>

                <ProgressRing percent={completionPercent} size={64} strokeWidth={5.5} color={GOLD_LT}>
                  <Text style={s.ringPercentSm}>{completionPercent}%</Text>
                </ProgressRing>
              </View>

              <Text style={s.heroName} numberOfLines={2}>{fullName}</Text>
              {headline ? <Text style={s.heroHeadline} numberOfLines={1}>{headline}</Text> : null}

              <View style={s.badgeRow}>
                <View style={s.badgePill}>
                  <Ionicons name="star" size={11} color={GOLD_LT} />
                  <Text style={s.badgePillText}>Premium Client</Text>
                </View>
                {user?.company_name ? (
                  <View style={s.badgePill}>
                    <Ionicons name="business" size={11} color={WHITE} />
                    <Text style={s.badgePillText}>{user.company_name}</Text>
                  </View>
                ) : null}
                {memberSinceLabel ? (
                  <View style={s.badgePill}>
                    <Ionicons name="time-outline" size={11} color={WHITE} />
                    <Text style={s.badgePillText}>Since {memberSinceLabel}</Text>
                  </View>
                ) : null}
              </View>

              <View style={s.heroGlass}>
                {user?.email_address ? (
                  <View style={s.contactRow}>
                    <Ionicons name="mail-outline" size={14} color={GOLD_LT} />
                    <Text style={s.contactText} numberOfLines={1}>{user.email_address}</Text>
                  </View>
                ) : null}
                {user?.phone_number ? (
                  <TouchableOpacity style={s.contactRow} onPress={() => onNavigate('ClientEditProfile')} activeOpacity={0.7}>
                    <Ionicons name="call-outline" size={14} color={GOLD_LT} />
                    <Text style={s.contactText} numberOfLines={1}>{user.phone_number}</Text>
                    <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                ) : null}
                {location ? (
                  <View style={s.contactRow}>
                    <Ionicons name="location-outline" size={14} color={GOLD_LT} />
                    <Text style={s.contactText} numberOfLines={1}>{location}</Text>
                  </View>
                ) : null}
                {user?.website ? (
                  <View style={s.contactRow}>
                    <Ionicons name="globe-outline" size={14} color={GOLD_LT} />
                    <Text style={s.contactText} numberOfLines={1}>{user.website}</Text>
                  </View>
                ) : null}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Profile Strength ── */}
          <View style={s.strengthCard}>
            <View style={s.strengthLeft}>
              <ProgressRing percent={completionPercent} size={92} strokeWidth={9} color={GOLD}>
                <Text style={s.ringPercentLg}>{completionPercent}%</Text>
                <Text style={s.ringPercentTiny}>strength</Text>
              </ProgressRing>
            </View>
            <View style={s.strengthRight}>
              <Text style={s.strengthTitle}>Profile Strength</Text>
              <Text style={s.strengthSub}>Complete profiles get up to 3x more responses.</Text>
              <View style={s.checklist}>
                {completionFields.map((f) => (
                  <View key={f.key} style={s.checklistRow}>
                    <View style={[s.checkDot, f.done ? s.checkDotDone : s.checkDotPending]}>
                      <Ionicons name={f.done ? 'checkmark' : 'ellipse'} size={f.done ? 10 : 6} color={f.done ? WHITE : TEXT_LIGHT} />
                    </View>
                    <Text style={[s.checklistText, f.done && s.checklistTextDone]}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Visibility banner ── */}
          <TouchableOpacity
            style={s.visibilityCardWrap}
            onPress={() => onNavigate('ClientEditProfile')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[NAVY, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.visibilityCard}>
              <View style={s.visibilityIconWrap}>
                <Ionicons name="eye" size={20} color={WHITE} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.visibilityTitleRow}>
                  <Text style={s.visibilityTitle}>Profile Visibility</Text>
                  <View style={s.visibilityStatusChip}>
                    <View style={s.visibilityDot} />
                    <Text style={s.visibilityStatusText}>Public</Text>
                  </View>
                </View>
                <Text style={s.visibilityDesc}>Freelancers can discover and message you</Text>
              </View>
              <View style={s.visibilityManageBtn}>
                <Text style={s.visibilityManageText}>Manage</Text>
                <Ionicons name="chevron-forward" size={13} color={WHITE} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Company Information ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Company Information</Text>
              <TouchableOpacity style={s.editBtn} onPress={() => onNavigate('ClientEditProfile')} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={13} color={BLUE} />
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={s.tileGrid}>
              <InfoTile icon="business-outline"  label="Company"       value={user?.company_name} />
              <InfoTile icon="layers-outline"    label="Business Type" value={user?.business_type} />
              <InfoTile icon="construct-outline" label="Industry"      value={user?.industry} />
              <InfoTile icon="cash-outline"      label="Budget Range"  value={user?.budget_range} />
            </View>
          </View>

          {/* ── About ── */}
          {user?.bio_about ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About</Text>
              <View style={s.aboutCard}>
                <Text style={s.aboutQuote}>“</Text>
                <Text style={s.aboutText} numberOfLines={aboutExpanded ? undefined : 4}>
                  {user.bio_about}
                </Text>
                {user.bio_about.length > 160 && (
                  <TouchableOpacity onPress={() => setAboutExpanded((v) => !v)} activeOpacity={0.7}>
                    <Text style={s.aboutToggle}>{aboutExpanded ? 'Show less' : 'Read more'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}

          {/* ── Preferences ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Preferences</Text>
              <TouchableOpacity style={s.editBtn} onPress={() => onNavigate('ClientEditProfile')} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={13} color={BLUE} />
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={s.settingsCard}>
              <View style={s.settingsRow}>
                <View style={s.settingsIconWrap}>
                  <Ionicons name="chatbubble-outline" size={16} color={BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.settingsLabel}>Communication</Text>
                  <Text style={s.settingsSub}>Preferred contact method</Text>
                </View>
                <View style={s.settingsChip}>
                  <Text style={s.settingsChipText}>{user?.preferred_communication_method || 'Not set'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Improve Profile ── */}
          <View style={s.improveSection}>
            <Text style={s.improveHeading}>Complete Your Profile</Text>
            <Text style={s.improveSub}>Add more details to attract better freelancers.</Text>
          </View>

          <View style={{ paddingHorizontal: 16, gap: 12, marginBottom: 8 }}>
            {IMPROVE_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => onNavigate(item.nav)}
                style={({ pressed }) => [s.recommendCard, pressed && s.recommendCardPressed]}
              >
                <LinearGradient colors={[GOLD_SOFT, 'rgba(0,85,165,0.05)']} style={s.recommendIconWrap}>
                  <Ionicons name={item.icon} size={22} color={GOLD_DK} />
                </LinearGradient>
                <View style={s.recommendInfo}>
                  <Text style={s.recommendTitle}>{item.title}</Text>
                  <Text style={s.recommendDesc} numberOfLines={2}>{item.desc}</Text>
                  <View style={s.recommendRewardChip}>
                    <Ionicons name="trending-up" size={11} color={GOLD_DK} />
                    <Text style={s.recommendRewardText}>{item.reward}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={TEXT_LIGHT} />
              </Pressable>
            ))}
          </View>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <Text style={s.footerText}>
              © 2026 Taskra ·{' '}
              <Text style={s.footerLink} onPress={() => onNavigate('ClientEditProfile')}>
                Privacy & Terms
              </Text>
            </Text>
          </View>
          
          {/* Extra bottom padding to account for tab bar */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Overlay */}
      {drawerOpen && (
        <Animated.View style={[s.overlay, { opacity: overlayAnim }]} pointerEvents="auto">
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        </Animated.View>
      )}

      {/* Right Drawer */}
      {drawerOpen && (
        <Animated.View style={[s.drawer, { transform: [{ translateX: drawerTranslateX }] }]}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <SafeAreaView style={s.drawerInner} edges={['top', 'bottom']}>
            <LinearGradient colors={[NAVY_DEEP, NAVY, NAVY_SOFT]} style={s.drawerHeader}>
              <TouchableOpacity style={s.drawerCloseBtn} onPress={closeDrawer} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color={WHITE} />
              </TouchableOpacity>

              <View style={s.drawerAvatarWrap}>
                {user?.profile_picture ? (
                  <Image source={{ uri: user.profile_picture }} style={s.drawerAvatar} />
                ) : (
                  <View style={s.drawerAvatarPlaceholder}>
                    <Text style={s.drawerAvatarInitials}>{getInitials()}</Text>
                  </View>
                )}
                <View style={s.drawerVerified}>
                  <Ionicons name="checkmark" size={10} color={WHITE} />
                </View>
              </View>

              <Text style={s.drawerName} numberOfLines={1}>{fullName}</Text>
              <Text style={s.drawerRole} numberOfLines={1}>{headline}</Text>
              {user?.email_address ? <Text style={s.drawerEmail} numberOfLines={1}>{user.email_address}</Text> : null}

              <View style={s.drawerFooterBadges}>
                <View style={s.drawerMembershipBadge}>
                  <Ionicons name="star" size={11} color={GOLD_LT} />
                  <Text style={s.drawerMembershipText}>Premium Client</Text>
                </View>
                <View style={s.drawerCompletionBadge}>
                  <Text style={s.drawerCompletionText}>{completionPercent}% complete</Text>
                </View>
              </View>
            </LinearGradient>

            <ScrollView style={s.drawerBody} showsVerticalScrollIndicator={false}>
              {MENU_ITEMS.map((item, i) => (
                <React.Fragment key={item.key}>
                  <Pressable
                    onPress={() => handleMenuNav(item.nav)}
                    style={({ pressed }) => [s.drawerItem, pressed && s.drawerItemPressed]}
                  >
                    <View style={s.drawerItemIcon}>
                      <Ionicons name={item.icon} size={18} color={BLUE} />
                    </View>
                    <View style={s.drawerItemText}>
                      <Text style={s.drawerItemLabel}>{item.label}</Text>
                      <Text style={s.drawerItemSub}>{item.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={TEXT_LIGHT} />
                  </Pressable>
                  {i < MENU_ITEMS.length - 1 && <View style={s.drawerDivider} />}
                </React.Fragment>
              ))}
            </ScrollView>

            <View style={s.drawerFooter}>
              <Pressable onPress={handleSignOut} style={({ pressed }) => [s.signOutWrap, pressed && s.signOutWrapPressed]}>
                <LinearGradient colors={['#FEE2E2', RED_SOFT]} style={s.signOutBtn}>
                  <View style={s.signOutIconWrap}>
                    <Ionicons name="log-out-outline" size={18} color={RED} />
                  </View>
                  <Text style={s.signOutText}>Sign Out</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Bottom Tab Bar - Fixed at bottom */}
      <SafeAreaView edges={['bottom']} style={s.tabSafe}>
        <View style={s.tabBar}>
          {TABS.map((tab) => {
            const active = activeBottomTab === tab.key;
            const isPost = tab.key === 'PostJob';
            return (
              <TouchableOpacity
                key={tab.key}
                style={s.tabItem}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.7}
              >
                {active && <View style={s.tabActiveBar} />}
                {isPost ? (
                  <LinearGradient colors={[GOLD_LT, GOLD, GOLD_DK]} style={s.tabFab}>
                    <Ionicons name={active ? tab.icon : tab.iconOutline} size={22} color={WHITE} />
                  </LinearGradient>
                ) : (
                  <View style={s.tabIconWrap}>
                    <Ionicons
                      name={active ? tab.icon : tab.iconOutline}
                      size={23}
                      color={active ? BLUE : TEXT_LIGHT}
                    />
                  </View>
                )}
                <Text style={[
                  s.tabLabel,
                  active && s.tabLabelActive,
                  isPost && s.tabLabelPost,
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Circular progress ring (SVG-based, no per-side border tricks) ─────────────
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

// ── InfoTile ───────────────────────────────────────────────────────────────────
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
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    ...SHADOW_CARD,
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

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
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
  checkDotDone: { backgroundColor: '#16A34A' },
  checkDotPending: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  checklistText: { fontSize: 11.5, color: TEXT_LIGHT, fontWeight: '500' },
  checklistTextDone: { color: TEXT_MUTED, fontWeight: '600' },

  // Visibility
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
  section:      { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 4 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: TEXT_MAIN },
  editBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: BLUE_SOFT, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,85,165,0.18)' },
  editBtnText:  { fontSize: 12, fontWeight: '700', color: BLUE },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  aboutCard: {
    backgroundColor: CARD, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER,
    padding: 18, paddingTop: 8,
    ...SHADOW_CARD,
  },
  aboutQuote: { fontSize: 44, color: GOLD, fontWeight: '800', lineHeight: 44, marginBottom: -8 },
  aboutText: { fontSize: 13.5, color: TEXT_MUTED, lineHeight: 21 },
  aboutToggle: { fontSize: 12, fontWeight: '700', color: BLUE, marginTop: 8 },

  settingsCard: {
    backgroundColor: CARD, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden', ...SHADOW_CARD,
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  settingsIconWrap: { width: 36, height: 36, borderRadius: 11, backgroundColor: BLUE_SOFT, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { fontSize: 13.5, fontWeight: '700', color: TEXT_MAIN },
  settingsSub: { fontSize: 11, color: TEXT_LIGHT, marginTop: 1 },
  settingsChip: { backgroundColor: BG, borderRadius: 999, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10, paddingVertical: 5 },
  settingsChipText: { fontSize: 11.5, fontWeight: '600', color: TEXT_MUTED },

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

  // Footer
  footer:     { paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center', marginTop: 6 },
  footerText: { fontSize: 11, color: TEXT_LIGHT },
  footerLink: { color: BLUE, textDecorationLine: 'underline' },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,15,38,0.6)', zIndex: 10 },

  // Drawer
  drawer: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: '80%',
    zIndex: 20, overflow: 'hidden',
    borderLeftWidth: 1, borderLeftColor: BORDER,
    ...SHADOW_FLOAT,
  },
  drawerInner: { flex: 1 },
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

  drawerBody: { flex: 1, paddingTop: 6, backgroundColor: 'rgba(255,255,255,0.55)' },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  drawerItemPressed: { backgroundColor: 'rgba(0,85,165,0.06)' },
  drawerItemIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: BLUE_SOFT, alignItems: 'center', justifyContent: 'center' },
  drawerItemText: { flex: 1, minWidth: 0 },
  drawerItemLabel: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  drawerItemSub: { fontSize: 11, color: TEXT_LIGHT, marginTop: 1 },
  drawerDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 20 },
  drawerFooter: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.7)' },
  signOutWrap: { borderRadius: 16, ...SHADOW_CARD },
  signOutWrapPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: RED_BORDER,
  },
  signOutIconWrap: { width: 28, height: 28, borderRadius: 9, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontSize: 14.5, fontWeight: '800', color: RED },

  // Bottom Tab Bar - Fixed at bottom
  tabSafe: { 
    backgroundColor: WHITE,
    borderTopWidth: 1.5,
    borderTopColor: BORDER,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  tabItem: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    paddingVertical: 4, 
    position: 'relative' 
  },
  tabActiveBar: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    backgroundColor: BLUE,
    borderRadius: 999,
  },
  tabIconWrap: { 
    position: 'relative', 
    marginBottom: 3, 
    marginTop: 6 
  },
  tabFab: {
    width: 46,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    marginTop: 2,
    ...SHADOW_GOLD,
  },
  tabLabel: { 
    fontSize: 10, 
    color: TEXT_LIGHT, 
    fontWeight: '500' 
  },
  tabLabelActive: { 
    color: BLUE, 
    fontWeight: '700' 
  },
  tabLabelPost: { 
    color: GOLD_DK, 
    fontWeight: '700' 
  },
});