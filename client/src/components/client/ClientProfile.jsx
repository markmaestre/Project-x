import React, { useState, useCallback, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile, logout } from '../../Redux/slices/authSlice';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const BLUE       = '#0055A5';
const GOLD       = '#C89520';
const GOLD_LT    = '#E8B84B';
const GOLD_DK    = '#8A6410';
const WHITE      = '#FFFFFF';
const BG         = '#EEF4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const RED        = '#DC2626';
const RED_SOFT   = '#FEF2F2';
const RED_BORDER = '#FECACA';
// ─────────────────────────────────────────────────────────────────────────────

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
    nav: 'ClientEditProfile',
  },
  {
    key: 'budget',
    title: 'Budget Preferences',
    desc: 'Set your typical project budget range.',
    icon: 'cash-outline',
    nav: 'ClientEditProfile',
  },
  {
    key: 'communication',
    title: 'Communication Preferences',
    desc: 'Let freelancers know how you prefer to be contacted.',
    icon: 'chatbubble-outline',
    nav: 'ClientEditProfile',
  },
  {
    key: 'visibility',
    title: 'Profile Visibility',
    desc: 'Control who can see your profile and job posts.',
    icon: 'eye-outline',
    nav: 'ClientVisibility',
  },
];

export default function ClientProfile({ onNavigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [refreshing,      setRefreshing]      = useState(false);
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('ClientProfile');

  const slideAnim   = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

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
    outputRange: [300, 0],
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* Top bar */}
        <View style={s.topbar}>
          <Text style={s.topbarTitle}>Profile</Text>
          <TouchableOpacity style={s.menuBtn} onPress={openDrawer} activeOpacity={0.7}>
            <Ionicons name="menu" size={20} color={WHITE} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        >
          {/* ── Hero ── */}
          <View style={s.hero}>
            <View style={s.heroRow}>
              <View style={s.heroLeft}>
                <Text style={s.heroName} numberOfLines={2}>{fullName}</Text>
                {headline ? <Text style={s.heroHeadline} numberOfLines={1}>{headline}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => onNavigate('ClientEditProfile')} activeOpacity={0.8}>
                {user?.profile_picture ? (
                  <Image source={{ uri: user.profile_picture }} style={s.avatarImg} />
                ) : (
                  <View style={s.avatarPlaceholder}>
                    <Text style={s.avatarInitials}>{getInitials()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={s.contactList}>
              {user?.email_address ? (
                <View style={s.contactRow}>
                  <Ionicons name="mail-outline" size={15} color={BLUE} />
                  <Text style={s.contactText} numberOfLines={1}>{user.email_address}</Text>
                </View>
              ) : null}
              {user?.phone_number ? (
                <TouchableOpacity
                  style={s.contactRow}
                  onPress={() => onNavigate('ClientEditProfile')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call-outline" size={15} color={BLUE} />
                  <Text style={s.contactText} numberOfLines={1}>{user.phone_number}</Text>
                  <Ionicons name="chevron-forward" size={13} color={TEXT_LIGHT} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ) : null}
              {location ? (
                <View style={s.contactRow}>
                  <Ionicons name="location-outline" size={15} color={BLUE} />
                  <Text style={s.contactText} numberOfLines={1}>{location}</Text>
                </View>
              ) : null}
              {user?.website ? (
                <View style={s.contactRow}>
                  <Ionicons name="globe-outline" size={15} color={BLUE} />
                  <Text style={s.contactText} numberOfLines={1}>{user.website}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Visibility banner ── */}
          <TouchableOpacity
            style={s.visibilityBar}
            onPress={() => onNavigate('ClientEditProfile')}
            activeOpacity={0.8}
          >
            <Ionicons name="eye-outline" size={15} color={BLUE} />
            <Text style={s.visibilityText}>Freelancers can find you</Text>
            <Ionicons name="chevron-forward" size={13} color={BLUE} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* ── Company Information ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Company Information</Text>
              <TouchableOpacity
                style={s.editBtn}
                onPress={() => onNavigate('ClientEditProfile')}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={13} color={BLUE} />
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={s.infoCard}>
              <InfoRow icon="business-outline"  label="Company"       value={user?.company_name}   />
              <InfoRow icon="layers-outline"    label="Business Type" value={user?.business_type}  />
              <InfoRow icon="construct-outline" label="Industry"      value={user?.industry}       />
              <InfoRow icon="cash-outline"      label="Budget Range"  value={user?.budget_range} last />
            </View>
          </View>

          {/* ── About ── */}
          {user?.bio_about ? (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>About</Text>
              </View>
              <View style={s.aboutCard}>
                <Text style={s.aboutText}>{user.bio_about}</Text>
              </View>
            </View>
          ) : null}

          {/* ── Preferences ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Preferences</Text>
              <TouchableOpacity
                style={s.editBtn}
                onPress={() => onNavigate('ClientEditProfile')}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={13} color={BLUE} />
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={s.infoCard}>
              <InfoRow
                icon="chatbubble-outline"
                label="Communication"
                value={user?.preferred_communication_method}
                last
              />
            </View>
          </View>

          {/* ── Improve Profile ── */}
          <View style={s.improveSection}>
            <Text style={s.improveHeading}>Complete Your Profile</Text>
            <Text style={s.improveSub}>Add more details to attract better freelancers.</Text>
          </View>

          <View style={s.improveCard}>
            {IMPROVE_ITEMS.map((item, i) => (
              <React.Fragment key={item.key}>
                <TouchableOpacity
                  style={s.improveRow}
                  onPress={() => onNavigate(item.nav)}
                  activeOpacity={0.7}
                >
                  <View style={s.improveIconWrap}>
                    <Ionicons name={item.icon} size={16} color={BLUE} />
                  </View>
                  <View style={s.improveInfo}>
                    <Text style={s.improveTitle}>{item.title}</Text>
                    <Text style={s.improveDesc} numberOfLines={2}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={TEXT_LIGHT} />
                </TouchableOpacity>
                {i < IMPROVE_ITEMS.length - 1 && <View style={s.improveDivider} />}
              </React.Fragment>
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
          <SafeAreaView style={s.drawerInner} edges={['top', 'bottom']}>
            <View style={s.drawerHeader}>
              <TouchableOpacity style={s.drawerCloseBtn} onPress={closeDrawer} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color={WHITE} />
              </TouchableOpacity>
              {user?.profile_picture ? (
                <Image source={{ uri: user.profile_picture }} style={s.drawerAvatar} />
              ) : (
                <View style={s.drawerAvatarPlaceholder}>
                  <Text style={s.drawerAvatarInitials}>{getInitials()}</Text>
                </View>
              )}
              <Text style={s.drawerName} numberOfLines={1}>{fullName}</Text>
              <Text style={s.drawerRole} numberOfLines={1}>{headline}</Text>
            </View>

            <ScrollView style={s.drawerBody} showsVerticalScrollIndicator={false}>
              {MENU_ITEMS.map((item, i) => (
                <React.Fragment key={item.key}>
                  <TouchableOpacity
                    style={s.drawerItem}
                    onPress={() => handleMenuNav(item.nav)}
                    activeOpacity={0.7}
                  >
                    <View style={s.drawerItemIcon}>
                      <Ionicons name={item.icon} size={18} color={BLUE} />
                    </View>
                    <View style={s.drawerItemText}>
                      <Text style={s.drawerItemLabel}>{item.label}</Text>
                      <Text style={s.drawerItemSub}>{item.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={TEXT_LIGHT} />
                  </TouchableOpacity>
                  {i < MENU_ITEMS.length - 1 && <View style={s.drawerDivider} />}
                </React.Fragment>
              ))}
            </ScrollView>

            <View style={s.drawerFooter}>
              <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={18} color={RED} />
                <Text style={s.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Bottom Tab Bar */}
      <SafeAreaView edges={['bottom']} style={s.tabSafe}>
        <View style={s.tabBar}>
          {TABS.map(tab => {
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
                  <View style={s.tabFab}>
                    <Ionicons name={active ? tab.icon : tab.iconOutline} size={22} color={WHITE} />
                  </View>
                ) : (
                  <View style={s.tabIconWrap}>
                    <Ionicons
                      name={active ? tab.icon : tab.iconOutline}
                      size={22}
                      color={active ? BLUE : TEXT_LIGHT}
                    />
                  </View>
                )}
                <Text style={[s.tabLabel, active && s.tabLabelActive, isPost && s.tabLabelPost]}>
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

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[ir.row, !last && ir.rowBorder]}>
      <Ionicons name={icon} size={14} color={BLUE} style={{ marginTop: 1 }} />
      <View style={ir.content}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value} numberOfLines={2}>{value || 'Not specified'}</Text>
      </View>
    </View>
  );
}

const ir = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,85,165,0.12)' },
  content:   { flex: 1, minWidth: 0 },
  label:     { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' },
  value:     { fontSize: 13, color: TEXT_MAIN, lineHeight: 19 },
});

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1, backgroundColor: BG },

  // Top bar
  topbar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: NAVY },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: WHITE, letterSpacing: -0.2 },
  menuBtn:     { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingBottom: 24 },

  // Hero
  hero:            { backgroundColor: CARD, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 18, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  heroRow:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  heroLeft:        { flex: 1, paddingRight: 14, minWidth: 0 },
  heroName:        { fontSize: 21, fontWeight: '800', color: TEXT_MAIN, letterSpacing: -0.3, marginBottom: 3 },
  heroHeadline:    { fontSize: 13, color: TEXT_MUTED },
  avatarImg:       { width: 66, height: 66, borderRadius: 33 },
  avatarPlaceholder: { width: 66, height: 66, borderRadius: 33, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:  { fontSize: 22, fontWeight: '800', color: WHITE },
  contactList:     { gap: 9 },
  contactRow:      { flexDirection: 'row', alignItems: 'center', gap: 9 },
  contactText:     { fontSize: 13, color: TEXT_MUTED, flex: 1, minWidth: 0 },

  // Visibility bar
  visibilityBar:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 10, marginBottom: 2, backgroundColor: 'rgba(0,85,165,0.06)', borderWidth: 1.5, borderColor: 'rgba(0,85,165,0.18)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  visibilityText: { fontSize: 13, fontWeight: '600', color: BLUE, flex: 1 },

  // Sections
  section:      { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: CARD, marginTop: 10 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  editBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(0,85,165,0.07)', borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(0,85,165,0.18)' },
  editBtnText:  { fontSize: 12, fontWeight: '600', color: BLUE },

  // Info card
  infoCard:  { backgroundColor: BG, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, overflow: 'hidden' },
  aboutCard: { backgroundColor: BG, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, padding: 14 },
  aboutText: { fontSize: 13, color: TEXT_MUTED, lineHeight: 20 },

  // Improve profile
  improveSection: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10, backgroundColor: BG },
  improveHeading: { fontSize: 15, fontWeight: '800', color: TEXT_MAIN, marginBottom: 3 },
  improveSub:     { fontSize: 12, color: TEXT_MUTED, lineHeight: 18 },

  improveCard:    { marginHorizontal: 16, backgroundColor: CARD, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, overflow: 'hidden', marginBottom: 8 },
  improveRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  improveDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 14 },
  improveIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,85,165,0.08)', borderWidth: 1.5, borderColor: 'rgba(0,85,165,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  improveInfo:    { flex: 1, minWidth: 0 },
  improveTitle:   { fontSize: 13, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  improveDesc:    { fontSize: 12, color: TEXT_MUTED, lineHeight: 17 },

  // Footer — compact, no excessive padding
  footer:     { paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', marginTop: 8 },
  footerText: { fontSize: 11, color: TEXT_LIGHT },
  footerLink: { color: BLUE, textDecorationLine: 'underline' },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,26,62,0.55)', zIndex: 10 },

  // Drawer
  drawer:                { position: 'absolute', top: 0, right: 0, bottom: 0, width: '78%', backgroundColor: CARD, zIndex: 20, borderLeftWidth: 1.5, borderLeftColor: BORDER, shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 16 },
  drawerInner:           { flex: 1 },
  drawerHeader:          { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1.5, borderBottomColor: BORDER, backgroundColor: BG },
  drawerCloseBtn:        { alignSelf: 'flex-end', width: 30, height: 30, borderRadius: 8, backgroundColor: NAVY, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  drawerAvatar:          { width: 52, height: 52, borderRadius: 26, marginBottom: 10 },
  drawerAvatarPlaceholder:{ width: 52, height: 52, borderRadius: 26, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  drawerAvatarInitials:  { fontSize: 18, fontWeight: '700', color: WHITE },
  drawerName:            { fontSize: 15, fontWeight: '700', color: TEXT_MAIN },
  drawerRole:            { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  drawerBody:            { flex: 1, paddingTop: 4 },
  drawerItem:            { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  drawerItemIcon:        { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,85,165,0.08)', borderWidth: 1.5, borderColor: 'rgba(0,85,165,0.18)', alignItems: 'center', justifyContent: 'center' },
  drawerItemText:        { flex: 1, minWidth: 0 },
  drawerItemLabel:       { fontSize: 14, fontWeight: '600', color: TEXT_MAIN },
  drawerItemSub:         { fontSize: 11, color: TEXT_LIGHT, marginTop: 1 },
  drawerDivider:         { height: 1, backgroundColor: BORDER, marginHorizontal: 18 },
  drawerFooter:          { paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: 1.5, borderTopColor: BORDER },
  signOutBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, backgroundColor: RED_SOFT, borderWidth: 1.5, borderColor: RED_BORDER },
  signOutText:           { fontSize: 14, fontWeight: '700', color: RED },

  // Bottom Tab Bar
  tabSafe:       { backgroundColor: WHITE },
  tabBar:        { flexDirection: 'row', backgroundColor: WHITE, borderTopWidth: 1.5, borderTopColor: BORDER, paddingTop: 6, paddingBottom: 4, paddingHorizontal: 8 },
  tabItem:       { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 4, position: 'relative' },
  tabActiveBar:  { position: 'absolute', top: 0, width: 24, height: 3, backgroundColor: BLUE, borderRadius: 999 },
  tabIconWrap:   { marginBottom: 3, marginTop: 6 },
  tabFab:        { width: 44, height: 36, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 3, marginTop: 2, shadowColor: GOLD_DK, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 5, elevation: 3, borderWidth: 1, borderColor: GOLD_LT },
  tabLabel:      { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
  tabLabelActive:{ color: BLUE, fontWeight: '700' },
  tabLabelPost:  { color: GOLD, fontWeight: '700' },
});