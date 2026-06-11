import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { Directory, File, Paths } from 'expo-file-system';
import { logout } from '../../Redux/slices/authSlice';

// ── Vantara Design tokens ─────────────────────────────────────────────────────
const NAVY        = '#071A3E';
const NAVY2       = '#0D2151';
const BLUE        = '#0055A5';
const BLUE_MD     = '#0073CF';
const BLUE_LT     = '#1E90FF';
const GOLD        = '#C89520';
const GOLD_LT     = '#E8B84B';
const GOLD_DK     = '#8A6410';
const SILVER      = '#8899B0';
const SILVER2     = '#B8C8D8';
const WHITE       = '#FFFFFF';
const BG          = '#EEF4FA';
const CARD        = '#FFFFFF';
const TEXT_MAIN   = '#071A3E';
const TEXT_MUTED  = '#3A5070';
const TEXT_LIGHT  = '#7A90A8';
const BORDER      = '#C8D8E8';
const RED         = '#DC2626';
const RED_SOFT    = '#FEF2F2';
const RED_BORDER  = '#FECACA';
// ─────────────────────────────────────────────────────────────────────────────

const CV_DIRECTORY = new Directory(Paths.document, 'cvs');

// ── Bottom Tab Bar with Centered My Jobs Button ─────────────────────────────────────
function BottomTabBar({ activeTab, onTabPress, pendingOffers }) {
  const tabs = [
    { key: 'FreelancerDashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'Messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { key: 'MyJobs', label: 'My Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
    { key: 'MyApplications', label: 'Applications', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' },
    { key: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          const isMyJobs = tab.key === 'MyJobs';
          const hasBadge = tab.key === 'Messages' && pendingOffers > 0;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                isMyJobs && styles.tabItemCenter,
              ]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              {isMyJobs ? (
                <View style={[styles.centerButton, isActive && styles.centerButtonActive]}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={26}
                    color={isActive ? WHITE : BLUE}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.tabIconWrap}>
                    <Ionicons
                      name={isActive ? tab.activeIcon : tab.icon}
                      size={22}
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

export default function Profile({ onNavigate, route }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [savedCV, setSavedCV] = useState(null);
  const [activeTab, setActiveTab] = useState('Profile');

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  // Restore active tab when coming back from other screens
  useEffect(() => {
    if (route?.params?.returnState?.activeTab) {
      setActiveTab(route.params.returnState.activeTab);
    }
  }, [route?.params]);

  useEffect(() => {
    loadLocalCV();
  }, []);

  const loadLocalCV = async () => {
    try {
      if (!CV_DIRECTORY.exists) { setSavedCV(null); return; }
      const files = CV_DIRECTORY.list();
      const cvFiles = files.filter(f =>
        f.name.endsWith('.pdf') || f.name.endsWith('.doc') || f.name.endsWith('.docx')
      );
      if (cvFiles.length > 0) {
        const latest = cvFiles[0];
        setSavedCV({ uri: latest.uri, name: latest.name, size: latest.size });
      } else {
        setSavedCV(null);
      }
    } catch (e) {
      console.error('Error loading local CV:', e);
      setSavedCV(null);
    }
  };

  const formatDate = (timestamp) => {
    const date = timestamp ? new Date(timestamp) : new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const viewCV = async () => {
    if (!savedCV?.uri) return;
    try {
      const file = new File(savedCV.uri);
      if (file.exists) {
        await file.open();
      } else {
        Alert.alert('Error', 'CV file not found.');
        setSavedCV(null);
      }
    } catch (e) {
      Alert.alert('Error', 'Cannot open file. Please try again.');
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
              // Navigate to Login screen
              onNavigate('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleTabBarPress = (key) => {
    const returnState = { activeTab: 'Profile' };
    if (key === 'FreelancerDashboard') {
      onNavigate('FreelancerDashboard', { returnState });
    } else if (key === 'Messages') {
      onNavigate('Messages', { returnState });
    } else if (key === 'MyJobs') {
      onNavigate('MyJobs', { returnState });
    } else if (key === 'MyApplications') {
      onNavigate('MyApplications', { returnState });
    } else if (key === 'Profile') {
      // Already on Profile
    }
  };

  // ── Sub-components ──────────────────────────────────────────────────────────

  const StatBadge = ({ label, value }) => (
    <View style={styles.statBadge}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const MenuItem = ({ icon, title, subtitle, onPress, danger }) => (
    <TouchableOpacity
      style={[styles.menuItem, danger && styles.menuItemDanger]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconWrap, danger && styles.menuIconWrapDanger]}>
          <Ionicons name={icon} size={19} color={danger ? RED : BLUE} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemTitle, danger && styles.menuItemTitleDanger]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={danger ? RED : TEXT_LIGHT} />
    </TouchableOpacity>
  );

  const CVItem = ({ name, date, onPress }) => (
    <TouchableOpacity style={styles.cvItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cvItemLeft}>
        <View style={styles.cvIconWrap}>
          <Ionicons name="document-text-outline" size={20} color={BLUE} />
        </View>
        <View style={styles.cvItemContent}>
          <Text style={styles.cvItemName} numberOfLines={1}>{name}</Text>
          <Text style={styles.cvItemDate}>Added {date}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={TEXT_LIGHT} />
    </TouchableOpacity>
  );

  const pendingOffers = 0; // You can calculate this from user data if needed

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => onNavigate('FreelancerDashboard')}
              activeOpacity={0.7}
            >
              <View style={styles.backIconWrap}>
                <Ionicons name="arrow-back" size={18} color={WHITE} />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity
              style={styles.headerEditBtn}
              onPress={() => onNavigate('EditProfile')}
              activeOpacity={0.75}
            >
              <Ionicons name="pencil-outline" size={16} color={GOLD} />
            </TouchableOpacity>
          </View>

          {/* ── Hero card ── */}
          <View style={styles.heroCard}>
            {/* Avatar */}
            <View style={styles.avatarRing}>
              {user?.profile_picture ? (
                <Image source={{ uri: user.profile_picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials || '?'}</Text>
                </View>
              )}
            </View>

            {/* Name + handle */}
            <Text style={styles.profileName}>
              {user?.first_name} {user?.last_name}
            </Text>
            {user?.username ? (
              <Text style={styles.profileUsername}>@{user.username}</Text>
            ) : null}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatBadge label="Applications" value={user?.applications_count ?? '—'} />
              <View style={styles.statDivider} />
              <StatBadge label="Saved jobs" value={user?.saved_jobs_count ?? '—'} />
              <View style={styles.statDivider} />
              <StatBadge label="Interviews" value={user?.interviews_count ?? '—'} />
            </View>

            {/* Contact pills */}
            <View style={styles.contactGrid}>
              <View style={styles.contactPill}>
                <Ionicons name="mail-outline" size={13} color={BLUE_MD} />
                <Text style={styles.contactPillText} numberOfLines={1}>
                  {user?.email_address ?? '—'}
                </Text>
              </View>

              {user?.phone_number ? (
                <View style={styles.contactPill}>
                  <Ionicons name="call-outline" size={13} color={BLUE_MD} />
                  <Text style={styles.contactPillText}>{user.phone_number}</Text>
                </View>
              ) : null}

              {(user?.city || user?.country) ? (
                <View style={styles.contactPill}>
                  <Ionicons name="location-outline" size={13} color={BLUE_MD} />
                  <Text style={styles.contactPillText}>
                    {[user?.city, user?.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Resumes ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={16} color={BLUE} />
              <Text style={styles.sectionTitle}>Resumes</Text>
            </View>

            {savedCV ? (
              <CVItem
                name={savedCV.name.replace(/^cv_\d+_/, '')}
                date={formatDate()}
                onPress={viewCV}
              />
            ) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No resume uploaded yet</Text>
                <TouchableOpacity onPress={() => onNavigate('EditProfile')}>
                  <Text style={styles.linkText}>Add Resume</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Improve matches ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up-outline" size={16} color={BLUE} />
              <Text style={styles.sectionTitle}>Improve your job matches</Text>
            </View>

            <MenuItem
              icon="star-outline"
              title="Qualifications"
              subtitle="Highlight your skills and experience"
              onPress={() => onNavigate('EditProfile')}
            />
            <MenuItem
              icon="options-outline"
              title="Job preferences"
              subtitle="Set minimum pay, schedule, and location"
              onPress={() => onNavigate('EditProfile')}
            />
            <MenuItem
              icon="eye-off-outline"
              title="Hide jobs with these details"
              subtitle="Manage what gets filtered from your search"
              onPress={() => onNavigate('EditProfile')}
            />
            <MenuItem
              icon="checkmark-circle-outline"
              title="Ready to work"
              subtitle="Signal employers you're available immediately"
              onPress={() => onNavigate('EditProfile')}
            />
          </View>

          {/* ── Account ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings-outline" size={16} color={BLUE} />
              <Text style={styles.sectionTitle}>Account</Text>
            </View>

            <MenuItem
              icon="shield-checkmark-outline"
              title="Privacy & security"
              subtitle="Manage your data and security settings"
              onPress={() => onNavigate('Privacy')}
            />
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Control email and push alerts"
              onPress={() => onNavigate('Notifications')}
            />
            <MenuItem
              icon="help-circle-outline"
              title="Help & support"
              onPress={() => onNavigate('Help')}
            />

            {/* Logout — distinct danger styling */}
            <TouchableOpacity
              style={styles.logoutRow}
              onPress={handleLogout}
              activeOpacity={0.75}
            >
              <View style={styles.logoutLeft}>
                <View style={styles.logoutIconWrap}>
                  <Ionicons name="log-out-outline" size={19} color={RED} />
                </View>
                <Text style={styles.logoutText}>Log out</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>©2026 Taskra · Cookies, Privacy and Terms</Text>
          </View>
        </ScrollView>
      </View>

      {/* ── Bottom Tab Bar ── */}
      <BottomTabBar 
        activeTab="Profile" 
        onTabPress={handleTabBarPress} 
        pendingOffers={pendingOffers}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: NAVY },
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 24 },

  // ── Header ──────────────────────────────────────────────────────────────────
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
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: WHITE, letterSpacing: 0.2 },
  headerEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(200,149,32,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(200,149,32,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero card ────────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: CARD,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: GOLD,
    marginBottom: 14,
  },
  avatar: { width: 78, height: 78, borderRadius: 39 },
  avatarPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: NAVY2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 26, fontWeight: '700', color: GOLD_LT },

  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  profileUsername: { fontSize: 13, color: TEXT_LIGHT, marginBottom: 20 },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 14,
    paddingHorizontal: 8,
    width: '100%',
    marginBottom: 16,
  },
  statBadge: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: NAVY, marginBottom: 2 },
  statLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1.5, height: 36, backgroundColor: BORDER },

  // Contact pills
  contactGrid: { flexDirection: 'column', gap: 6, width: '100%' },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  contactPillText: { fontSize: 13, color: TEXT_MUTED, flex: 1 },

  // ── Section ──────────────────────────────────────────────────────────────────
  section: {
    backgroundColor: CARD,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: BORDER,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: 2,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: TEXT_MAIN, letterSpacing: 0.3, textTransform: 'uppercase' },

  // ── Menu Item ────────────────────────────────────────────────────────────────
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  menuItemDanger: { borderBottomColor: RED_BORDER },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(0,85,165,0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,85,165,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapDanger: {
    backgroundColor: RED_SOFT,
    borderColor: RED_BORDER,
  },
  menuItemContent: { flex: 1 },
  menuItemTitle: { fontSize: 14, fontWeight: '500', color: TEXT_MAIN, marginBottom: 1 },
  menuItemTitleDanger: { color: RED },
  menuItemSubtitle: { fontSize: 11, color: TEXT_LIGHT, lineHeight: 15 },

  // ── Logout row ───────────────────────────────────────────────────────────────
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginTop: 2,
    marginBottom: 4,
  },
  logoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: RED_SOFT,
    borderWidth: 1.5,
    borderColor: RED_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: RED },

  // ── CV Item ──────────────────────────────────────────────────────────────────
  cvItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cvItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cvIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(0,85,165,0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,85,165,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cvItemContent: { flex: 1 },
  cvItemName: { fontSize: 14, fontWeight: '500', color: TEXT_MAIN, marginBottom: 2 },
  cvItemDate: { fontSize: 11, color: TEXT_LIGHT },

  // ── Empty state ──────────────────────────────────────────────────────────────
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  emptyText: { fontSize: 13, color: TEXT_LIGHT },
  linkText: { fontSize: 13, color: BLUE, fontWeight: '600' },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: { alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16 },
  footerText: { fontSize: 11, color: TEXT_LIGHT, textAlign: 'center' },

  // ── Bottom Tab Bar Styles (Balanced - hindi masyadong baba, hindi nakalutang) ──
  tabSafe: { 
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: 0,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabItemCenter: {
    flex: 0,
    marginHorizontal: 8,
    marginTop: -16,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2.5,
    borderColor: WHITE,
  },
  centerButtonActive: {
    backgroundColor: BLUE,
    transform: [{ scale: 1.02 }],
  },
  tabIconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: BLUE,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: BLUE,
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -3,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    borderWidth: 1.5,
    borderColor: WHITE,
  },
});