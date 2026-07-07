import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { Directory, File, Paths } from 'expo-file-system';
import { getProfile, logout } from '../../Redux/slices/authSlice';

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
const GREEN       = '#059669';
const GREEN_SOFT  = '#D1FAE5';
// ─────────────────────────────────────────────────────────────────────────────

const CV_DIRECTORY = new Directory(Paths.document, 'cvs');

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

// ── StatPill ──────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label }) {
  return (
    <View style={styles.statPill}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={16} color={BLUE} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, last }) {
  const hasValue = value !== null && value !== undefined && value !== '';
  return (
    <View style={[ir.row, !last && ir.rowBorder]}>
      <View style={ir.iconWrap}>
        <Ionicons name={icon} size={15} color={BLUE} />
      </View>
      <View style={ir.content}>
        <Text style={ir.label}>{label}</Text>
        <Text style={[ir.value, !hasValue && ir.valueEmpty]}>
          {hasValue ? value : 'Not specified'}
        </Text>
      </View>
    </View>
  );
}

const ir = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,85,165,0.15)' },
  iconWrap:  { width: 15, alignItems: 'center', marginTop: 2 },
  content:   { flex: 1 },
  label:     { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  value:     { fontSize: 14, color: TEXT_MAIN },
  valueEmpty:{ color: TEXT_LIGHT, fontStyle: 'italic' },
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
        <Ionicons name={emptyIcon} size={15} color={TEXT_LIGHT} />
        <Text style={styles.emptyChipText}>{emptyText}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.chipListWrap}>
      {list.map((item, i) => (
        <View key={`${item}-${i}`} style={styles.chipReadOnly}>
          <Ionicons name={icon} size={12} color={BLUE} style={{ marginRight: 5 }} />
          <Text style={styles.chipReadOnlyText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ── MenuItem ──────────────────────────────────────────────────────────────────
function MenuItem({ icon, title, subtitle, onPress, danger }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={styles.menuLeft}>
        <View style={[styles.menuIconWrap, danger && styles.menuIconWrapDanger]}>
          <Ionicons name={icon} size={19} color={danger ? RED : BLUE} />
        </View>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, danger && { color: RED }]}>{title}</Text>
          {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={TEXT_LIGHT} />
    </TouchableOpacity>
  );
}

// ── CVItem ────────────────────────────────────────────────────────────────────
function CVItem({ name, date, onPress }) {
  return (
    <TouchableOpacity style={styles.cvItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cvLeft}>
        <View style={styles.cvIconWrap}>
          <Ionicons name="document-text-outline" size={20} color={BLUE} />
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
        <Ionicons name={icon} size={16} color={BLUE} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onEdit && (
        <TouchableOpacity style={styles.editRowBtn} onPress={onEdit} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={14} color={BLUE} />
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
      <View style={[styles.skeletonBlock, { width: 78, height: 78, borderRadius: 39, alignSelf: 'center', marginBottom: 14 }]} />
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

  // Handle hardware back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Let the default back behavior happen - navigate to previous screen
      return false;
    });
    return () => backHandler.remove();
  }, []);

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
    const returnState = { activeTab: 'Profile' };
    if (key !== 'Profile') onNavigate(key, { returnState });
  };

  const toEdit = () => onNavigate('EditProfile');

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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
          }
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity
              style={[styles.headerBtn, styles.headerEditBtn]}
              onPress={toEdit}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Ionicons name="pencil-outline" size={16} color={GOLD} />
            </TouchableOpacity>
          </View>

          {initialLoading ? (
            <View style={styles.heroCard}>
              <ProfileSkeleton />
            </View>
          ) : (
            <>
              {/* ── Hero card ── */}
              <View style={styles.heroCard}>
                <View style={styles.avatarRing}>
                  {user?.profile_picture ? (
                    <Image
                      source={{ uri: user.profile_picture }}
                      style={styles.avatar}
                      onError={() => { /* falls back to placeholder on next render */ }}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{initials || '?'}</Text>
                    </View>
                  )}
                  {isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={13} color={WHITE} />
                    </View>
                  )}
                </View>

                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>
                    {user?.first_name} {user?.last_name}
                  </Text>
                </View>
                {user?.username ? (
                  <Text style={styles.profileUsername}>@{user.username}</Text>
                ) : null}

                <View style={[styles.availBadge, isAvailable ? styles.availBadgeOn : styles.availBadgeOff]}>
                  <Ionicons
                    name={isAvailable ? 'checkmark-circle' : 'pause-circle'}
                    size={14}
                    color={isAvailable ? GREEN : TEXT_LIGHT}
                  />
                  <Text style={[styles.availText, isAvailable && { color: GREEN }]}>
                    {isAvailable ? 'Available for work' : 'Not available'}
                  </Text>
                </View>

                {(rating || completedJobs > 0) && (
                  <View style={styles.statsRow}>
                    {rating ? (
                      <StatPill icon="star" value={rating} label="Rating" />
                    ) : null}
                    <StatPill icon="checkmark-done-circle-outline" value={completedJobs} label="Jobs done" />
                  </View>
                )}

                <View style={styles.contactGrid}>
                  <View style={styles.contactPill}>
                    <Ionicons name="mail-outline" size={13} color={BLUE_MD} />
                    <Text style={styles.contactPillText} numberOfLines={1}>
                      {user?.email_address ?? 'Not set'}
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
                  <Text style={styles.aboutText}>{user.bio_about}</Text>
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
                <View style={styles.infoCard}>
                  <InfoRow icon="time-outline" label="Years of Experience" value={experienceText} />
                  <InfoRow icon="cash-outline" label="Rate" value={rateText} last />
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
                <Text style={[styles.subLabel, { marginTop: 14 }]}>Certifications</Text>
                <ChipList
                  items={user?.certifications}
                  icon="ribbon"
                  emptyText="No certifications added"
                  onEdit={toEdit}
                />
              </View>

              {/* ── Improve Job Matches ── */}
              <View style={styles.section}>
                <SectionHeader icon="trending-up-outline" title="Improve Your Job Matches" />
                <MenuItem
                  icon="star-outline"
                  title="Qualifications"
                  subtitle="Highlight your skills and experience"
                  onPress={toEdit}
                />
                <MenuItem
                  icon="options-outline"
                  title="Job preferences"
                  subtitle="Set minimum pay, schedule, and location"
                  onPress={toEdit}
                />
                <MenuItem
                  icon="eye-off-outline"
                  title="Hide jobs with these details"
                  subtitle="Manage what gets filtered from your search"
                  onPress={toEdit}
                />
                <MenuItem
                  icon="checkmark-circle-outline"
                  title="Ready to work"
                  subtitle="Signal employers you're available immediately"
                  onPress={toEdit}
                />
              </View>

              {/* ── Account ── */}
              <View style={[styles.section, styles.sectionLast]}>
                <SectionHeader icon="settings-outline" title="Account" />
                <MenuItem
                  icon="shield-checkmark-outline"
                  title="Privacy & security"
                  subtitle="Manage your data and security settings"
                  onPress={toEdit}
                />
                <MenuItem
                  icon="notifications-outline"
                  title="Notifications"
                  subtitle="Control email and push alerts"
                  onPress={toEdit}
                />
                <MenuItem icon="help-circle-outline" title="Help & support" onPress={toEdit} />
                <MenuItem
                  icon="log-out-outline"
                  title="Log out"
                  onPress={handleLogout}
                  danger
                />

                <View style={styles.footer}>
                  <Ionicons name="shield-checkmark-outline" size={12} color={TEXT_LIGHT} />
                  <Text style={styles.footerText}>© 2026 Taskra · Cookies, Privacy and Terms</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>

      <BottomTabBar activeTab="Profile" onTabPress={handleTabBarPress} pendingOffers={0} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: NAVY },
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 0 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: NAVY,
    position: 'relative',
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerEditBtn: {
    backgroundColor: 'rgba(200,149,32,0.15)',
    borderColor: 'rgba(200,149,32,0.35)',
    position: 'absolute',
    right: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: WHITE, letterSpacing: 0.2 },

  // Hero
  heroCard: {
    backgroundColor: CARD, alignItems: 'center',
    paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20,
    borderBottomWidth: 1.5, borderBottomColor: BORDER,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  avatarRing: { padding: 3, borderRadius: 50, borderWidth: 2.5, borderColor: GOLD, marginBottom: 14, position: 'relative' },
  avatar: { width: 78, height: 78, borderRadius: 39 },
  avatarPlaceholder: {
    width: 78, height: 78, borderRadius: 39, backgroundColor: NAVY2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 26, fontWeight: '700', color: GOLD_LT },
  verifiedBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: BLUE, borderWidth: 2, borderColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName:     { fontSize: 20, fontWeight: '700', color: TEXT_MAIN, letterSpacing: 0.1, marginBottom: 3 },
  profileUsername: { fontSize: 13, color: TEXT_LIGHT, marginBottom: 12 },

  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
    marginBottom: 14, borderWidth: 1.5,
  },
  availBadgeOn:  { backgroundColor: GREEN_SOFT, borderColor: 'rgba(5,150,105,0.3)' },
  availBadgeOff: { backgroundColor: BG, borderColor: BORDER },
  availText:     { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },

  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  statPill: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, minWidth: 84,
  },
  statIconWrap: { marginBottom: 3 },
  statValue: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN },
  statLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 1 },

  contactGrid: { flexDirection: 'column', gap: 6, width: '100%' },
  contactPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10,
  },
  contactPillText: { fontSize: 13, color: TEXT_MUTED, flex: 1 },

  // Skeleton
  skeletonWrap: { width: '100%' },
  skeletonBlock: { backgroundColor: BORDER, borderRadius: 6, opacity: 0.6 },

  // Section
  section: {
    backgroundColor: CARD, marginTop: 10,
    borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: BORDER,
  },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    borderBottomWidth: 1.5, borderBottomColor: BORDER,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: TEXT_MAIN, letterSpacing: 0.5, textTransform: 'uppercase' },
  editRowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(0,85,165,0.08)',
    borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(0,85,165,0.2)',
  },
  editRowBtnText: { fontSize: 12, fontWeight: '600', color: BLUE },

  // Info card
  infoCard: {
    margin: 12, backgroundColor: BG,
    borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, overflow: 'hidden',
  },

  // About
  aboutText: { fontSize: 14, color: TEXT_MUTED, lineHeight: 21, padding: 14 },

  // Chips
  subLabel: {
    fontSize: 11, fontWeight: '600', color: TEXT_LIGHT,
    textTransform: 'uppercase', letterSpacing: 0.4,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6,
  },
  chipListWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 },
  chipReadOnly: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,85,165,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(0,85,165,0.2)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  chipReadOnlyText: { fontSize: 12.5, fontWeight: '600', color: BLUE },
  emptyChipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  emptyChipText: { fontSize: 13, color: TEXT_LIGHT },

  // Menu item
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: 'rgba(0,85,165,0.07)',
    borderWidth: 1.5, borderColor: 'rgba(0,85,165,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  menuIconWrapDanger: {
    backgroundColor: RED_SOFT, borderColor: RED_BORDER,
  },
  menuContent: { flex: 1 },
  menuTitle:   { fontSize: 14, fontWeight: '500', color: TEXT_MAIN, marginBottom: 1 },
  menuSubtitle:{ fontSize: 11, color: TEXT_LIGHT, lineHeight: 15 },

  // CV
  cvItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  cvLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cvIconWrap: {
    width: 38, height: 38, borderRadius: 8,
    backgroundColor: 'rgba(0,85,165,0.07)',
    borderWidth: 1.5, borderColor: 'rgba(0,85,165,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  cvContent: { flex: 1 },
  cvName:    { fontSize: 14, fontWeight: '500', color: TEXT_MAIN, marginBottom: 2 },
  cvDate:    { fontSize: 11, color: TEXT_LIGHT },
  cvActionWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(0,85,165,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty
  emptyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  emptyRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  emptyText: { fontSize: 13, color: TEXT_LIGHT, flexShrink: 1 },
  linkRow:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText:  { fontSize: 13, color: BLUE, fontWeight: '600' },

  sectionLast: { marginBottom: 0 },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: BORDER,
  },
  footerText: { fontSize: 11, color: TEXT_LIGHT, textAlign: 'center' },

  // Bottom Tab Bar
  tabSafe: { backgroundColor: CARD, borderTopWidth: 1.5, borderTopColor: BORDER },
  tabBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: 8, paddingBottom: 12, paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, position: 'relative',
  },
  tabItemCenter: { flex: 0, marginHorizontal: 8, marginTop: -16 },
  centerButton: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    borderWidth: 2.5, borderColor: WHITE,
  },
  centerButtonActive: { backgroundColor: BLUE },
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