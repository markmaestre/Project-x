// screens/freelancer/ReceivedOffersScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getReceivedOffers, updateOfferStatus } from '../../Redux/slices/offerSlice';
import { getFreelancerApplications } from '../../Redux/slices/applicationSlice';

const { width } = Dimensions.get('window');

// ─── Design Tokens ───────────────────────────────────────────────────────────
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

// ─── Bottom Tab Bar - Same as MyJobs ────────────────────────────────────────
function BottomTabBar({ activeTab, onTabPress, pendingOffers }) {
  const tabs = [
    { key: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'Messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { key: 'MyJobs', label: 'My Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
    { key: 'MyApplications', label: 'Applications', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' },
    { key: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
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
              style={[
                styles.tabItem,
                isMyJobs && styles.tabItemCenter,
                isActive && styles.tabItemActive
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

// ─── Tabs - Updated to show hired and in-progress ──────────────────────────
const TABS = [
  { key: 'All',         label: 'All' },
  { key: 'hired',       label: 'Hired' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed',   label: 'Completed' },
  { key: 'offered',     label: 'Offers' },
  { key: 'accepted',    label: 'Accepted' },
  { key: 'declined',    label: 'Declined' },
  { key: 'expired',     label: 'Expired' },
];

// ─── Status Config - Updated with hired and in_progress ──────────────────────
const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: ORANGE,      bgColor: `${ORANGE}15`,   icon: 'time-outline' },
  offered:     { label: 'Offer',       color: BLUE,        bgColor: `${BLUE}15`,     icon: 'gift-outline' },
  accepted:    { label: 'Accepted',    color: BLUE_MD,     bgColor: `${BLUE}15`,     icon: 'checkmark-circle-outline' },
  hired:       { label: 'Hired',       color: GREEN,       bgColor: `${GREEN}15`,    icon: 'people-outline' },
  in_progress: { label: 'In Progress', color: BLUE_MD,     bgColor: `${BLUE}15`,     icon: 'construct-outline' },
  completed:   { label: 'Completed',   color: GREEN_DARK,  bgColor: `${GREEN}15`,    icon: 'flag-outline' },
  declined:    { label: 'Declined',    color: RED,         bgColor: `${RED}15`,      icon: 'close-circle-outline' },
  expired:     { label: 'Expired',     color: TEXT_MUTED,  bgColor: `${TEXT_MUTED}15`, icon: 'calendar-outline' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  return new Date(dateString).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-PH', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'Unknown';
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1)    return 'Just now';
  if (diffMins < 60)   return `${diffMins}m ago`;
  if (diffHours < 24)  return `${diffHours}h ago`;
  if (diffDays === 1)  return `Yesterday at ${formatTime(dateString)}`;
  if (diffDays < 7)    return `${diffDays}d ago`;
  return formatDate(dateString);
};

const formatCurrency = (amount) => {
  if (!amount) return '₱0';
  return `₱${Number(amount).toLocaleString('en-PH')}`;
};

const getInitials = (first, last) =>
  `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

const AVATAR_COLORS = [BLUE, BLUE_MD, GOLD, '#3B82F6', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899'];
const getAvatarColor = (name) => AVATAR_COLORS[(name?.length || 0) % AVATAR_COLORS.length];

const getTimeRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate) - new Date();
  if (diff <= 0) return 'Expired';
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0)  return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return 'Expiring soon';
};

const getProgressColor = (progress) => {
  if (progress < 30) return RED;
  if (progress < 70) return ORANGE;
  return GREEN;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, small = false }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <View style={[
      badge.wrap,
      { backgroundColor: cfg.bgColor },
      small && badge.small,
    ]}>
      <Ionicons name={cfg.icon} size={small ? 10 : 11} color={cfg.color} />
      <Text style={[badge.text, { color: cfg.color }, small && badge.smallText]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap:      { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:15 },
  small:     { paddingHorizontal:7, paddingVertical:3 },
  text:      { fontSize:11, fontWeight:'500', letterSpacing:0.1 },
  smallText: { fontSize:10 },
});

function Avatar({ src, first, last, name, size = 44 }) {
  const color = getAvatarColor(name || first || '');
  const initials = getInitials(first, last) || 'C';
  const r = size / 2;
  return (
    <View style={{ 
      width:size, 
      height:size, 
      borderRadius:r, 
      backgroundColor: `${color}18`, 
      alignItems:'center', 
      justifyContent:'center', 
      overflow:'hidden',
      borderWidth: 1,
      borderColor: `${color}30`,
    }}>
      {src
        ? <Image source={{ uri:src }} style={{ width:size, height:size, borderRadius:r }} />
        : <Text style={{ fontSize: size * 0.33, fontWeight:'600', color }}>{initials}</Text>
      }
    </View>
  );
}

// ─── Progress Bar Component ──────────────────────────────────────────────────
function ProgressBar({ progress }) {
  const color = getProgressColor(progress);
  return (
    <View style={progressStyles.wrap}>
      <View style={progressStyles.barBg}>
        <View style={[progressStyles.barFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>
      <Text style={[progressStyles.text, { color }]}>{progress}%</Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  wrap: { flexDirection:'row', alignItems:'center', gap:8 },
  barBg: { flex:1, height:6, backgroundColor:BORDER, borderRadius:3, overflow:'hidden' },
  barFill: { height:'100%', borderRadius:3 },
  text: { fontSize:12, fontWeight:'700', minWidth:36, textAlign:'right' },
});

// ─── Offer Card - Updated with hired/in_progress support ───────────────────
function OfferCard({ offer, onPress }) {
  const client     = offer.client_id || {};
  const job        = offer.job_id || {};
  const clientName = client.company_name ||
    `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client';

  const isOffered   = offer.status === 'offered';
  const isAccepted  = offer.status === 'accepted';
  const isHired     = offer.status === 'hired';
  const isInProgress = offer.status === 'in_progress';
  const isCompleted = offer.status === 'completed';
  const isDeclined  = offer.status === 'declined';
  const isExpired   = offer.status === 'expired';
  const timeLeft    = getTimeRemaining(offer.expiry_date);
  const progress    = offer.progress || (isCompleted ? 100 : isInProgress ? 50 : 0);

  let cardExtra = {};
  if (isOffered && !isExpired) cardExtra = card.offered;
  else if (isHired || isInProgress) cardExtra = card.active;
  else if (isCompleted) cardExtra = card.completed;
  else if (isAccepted) cardExtra = card.accepted;
  else if (isDeclined) cardExtra = card.declined;
  else if (isExpired)  cardExtra = card.expired;

  const isActive = isHired || isInProgress;

  return (
    <TouchableOpacity style={[card.base, cardExtra]} activeOpacity={0.85} onPress={() => onPress(offer)}>

      {(isOffered && !isExpired) && <View style={card.stripe} />}
      {(isHired || isInProgress) && <View style={[card.stripe, { backgroundColor: GREEN }]} />}
      {isCompleted && <View style={[card.stripe, { backgroundColor: GREEN_DARK }]} />}

      <View style={card.header}>
        <Avatar
          src={client.profile_picture}
          first={client.first_name}
          last={client.last_name}
          name={clientName}
          size={46}
        />
        <View style={card.headerText}>
          <Text style={card.clientName} numberOfLines={1}>{clientName}</Text>
          <Text style={card.jobTitle} numberOfLines={1}>{job.title || 'Project'}</Text>
        </View>
        <StatusBadge status={offer.status} />
      </View>

      <View style={card.divider} />

      <View style={card.metaGrid}>
        <MetaItem icon="cash-outline" label="Amount" value={formatCurrency(offer.amount)} valueStyle={isActive && card.amountHighlight} />
        <MetaItem icon="calendar-outline" label="Started" value={formatDate(offer.created_at)} sub={formatTime(offer.created_at)} />
      </View>

      {/* Progress Bar - Show for hired, in_progress, and completed */}
      {(isHired || isInProgress || isCompleted) && (
        <View style={card.progressSection}>
          <View style={card.progressHeader}>
            <Text style={card.progressLabel}>Progress</Text>
            <Text style={card.progressPercent}>{progress}%</Text>
          </View>
          <View style={card.progressBarBg}>
            <View style={[card.progressBarFill, { width: `${progress}%`, backgroundColor: getProgressColor(progress) }]} />
          </View>
        </View>
      )}

      {(isOffered) && !isExpired && timeLeft && (
        <View style={card.timerRow}>
          <Ionicons name="hourglass-outline" size={13} color={ORANGE} />
          <Text style={card.timerText}>{timeLeft}</Text>
        </View>
      )}

      {!!offer.message && (
        <View style={card.msgBox}>
          <Text style={card.msgLabel}>Message</Text>
          <Text style={card.msgText} numberOfLines={2}>{offer.message}</Text>
        </View>
      )}

      {isActive && (
        <View style={card.actionRow}>
          <TouchableOpacity style={card.actionBtn} onPress={() => onPress(offer)}>
            <Ionicons name="construct-outline" size={16} color={BLUE} />
            <Text style={card.actionBtnText}>View Work</Text>
          </TouchableOpacity>
          <View style={card.actionDivider} />
          <TouchableOpacity style={card.actionBtn} onPress={() => onPress(offer)}>
            <Ionicons name="chatbubble-outline" size={16} color={BLUE} />
            <Text style={card.actionBtnText}>Message</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && <FooterLabel icon="checkmark-circle" color={GREEN_DARK} bg={`${GREEN_DARK}15`} text="Project Completed ✓" />}
      {isAccepted  && <FooterLabel icon="checkmark-circle" color={GREEN} bg={`${GREEN}15`} text="Offer accepted" />}
      {isDeclined  && <FooterLabel icon="close-circle" color={RED} bg={`${RED}15`} text="You declined this offer" />}
      {isExpired   && <FooterLabel icon="calendar" color={TEXT_MUTED} bg={`${TEXT_MUTED}15`} text="This offer has expired" />}
    </TouchableOpacity>
  );
}

function MetaItem({ icon, label, value, sub, valueStyle }) {
  return (
    <View style={meta.wrap}>
      <View style={meta.labelRow}>
        <Ionicons name={icon} size={11} color={TEXT_LIGHT} />
        <Text style={meta.label}>{label}</Text>
      </View>
      <Text style={[meta.value, valueStyle]}>{value}</Text>
      {sub ? <Text style={meta.sub}>{sub}</Text> : null}
    </View>
  );
}

function FooterLabel({ icon, color, bg, text }) {
  return (
    <View style={[footer.wrap, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[footer.text, { color }]}>{text}</Text>
    </View>
  );
}

const card = StyleSheet.create({
  base: {
    backgroundColor:CARD, borderRadius:18, marginBottom:12,
    borderWidth:1, borderColor:BORDER,
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2,
    overflow:'hidden',
  },
  offered:  { borderColor:BLUE, borderWidth:2, shadowColor:BLUE, shadowOpacity:0.12, shadowRadius:14, elevation:5 },
  active:   { borderColor:GREEN, borderWidth:2, shadowColor:GREEN, shadowOpacity:0.12, shadowRadius:14, elevation:5 },
  completed:{ borderColor:GREEN_DARK, borderWidth:1.5, opacity:0.85 },
  accepted: { borderColor:GREEN, borderWidth:1.5 },
  declined: { borderColor:RED,   borderWidth:1.5, opacity:0.88 },
  expired:  { opacity:0.65 },
  stripe:   { height:3, backgroundColor:BLUE_MD },
  header:   { flexDirection:'row', alignItems:'center', padding:14, paddingBottom:10, gap:12 },
  headerText:{ flex:1 },
  clientName:{ fontSize:14, fontWeight:'600', color:TEXT_MAIN, marginBottom:2 },
  jobTitle:  { fontSize:12, color:TEXT_MUTED },
  divider:   { height:1, backgroundColor:BORDER, marginHorizontal:14 },
  metaGrid:  { flexDirection:'row', gap:0, padding:14, paddingVertical:12 },
  amountHighlight: { color:BLUE, fontSize:16, fontWeight:'800' },
  timerRow:  { flexDirection:'row', alignItems:'center', gap:6, marginHorizontal:14, marginBottom:10,
               backgroundColor:`${ORANGE}15`, paddingHorizontal:10, paddingVertical:6, borderRadius:8 },
  timerText: { fontSize:12, color:ORANGE, fontWeight:'600' },
  msgBox:    { backgroundColor:BG, marginHorizontal:14, marginBottom:12, padding:12, borderRadius:10, borderWidth:1, borderColor:BORDER },
  msgLabel:  { fontSize:9, fontWeight:'700', color:TEXT_LIGHT, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 },
  msgText:   { fontSize:12, color:TEXT_MUTED, lineHeight:17 },
  
  // Progress Section
  progressSection: {
    paddingHorizontal:14,
    paddingVertical:10,
    backgroundColor: `${BLUE}05`,
  },
  progressHeader: {
    flexDirection:'row',
    justifyContent:'space-between',
    marginBottom:4,
  },
  progressLabel: {
    fontSize:11,
    color:TEXT_MUTED,
    fontWeight:'500',
  },
  progressPercent: {
    fontSize:11,
    fontWeight:'700',
    color:TEXT_MAIN,
  },
  progressBarBg: {
    height:6,
    backgroundColor:BORDER,
    borderRadius:3,
    overflow:'hidden',
  },
  progressBarFill: {
    height:'100%',
    borderRadius:3,
  },
  
  // Action Row for active jobs
  actionRow: {
    flexDirection:'row',
    paddingVertical:8,
    paddingHorizontal:14,
    borderTopWidth:1,
    borderTopColor:BORDER,
    backgroundColor: `${BLUE}05`,
  },
  actionBtn: {
    flex:1,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    gap:6,
    paddingVertical:8,
  },
  actionBtnText: {
    fontSize:13,
    fontWeight:'600',
    color:BLUE,
  },
  actionDivider: {
    width:1,
    backgroundColor:BORDER,
  },
});

const meta = StyleSheet.create({
  wrap:     { flex:1 },
  labelRow: { flexDirection:'row', alignItems:'center', gap:4, marginBottom:3 },
  label:    { fontSize:10, color:TEXT_LIGHT, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.5 },
  value:    { fontSize:14, fontWeight:'700', color:TEXT_MAIN },
  sub:      { fontSize:11, color:TEXT_LIGHT, marginTop:1 },
});

const footer = StyleSheet.create({
  wrap: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6,
          paddingVertical:9, marginTop:0 },
  text: { fontSize:12, fontWeight:'600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReceivedOffersScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { receivedOffers, isLoading }               = useSelector((s) => s.offers);
  const { applications, isLoading: appsLoading }    = useSelector((s) => s.applications);

  const [activeTab,      setActiveTab]      = useState('hired');
  const [refreshing,     setRefreshing]     = useState(false);
  const [selectedOffer,  setSelectedOffer]  = useState(null);
  const [showModal,      setShowModal]      = useState(false);
  const [combinedOffers, setCombinedOffers] = useState([]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        dispatch(getReceivedOffers({})).unwrap(),
        dispatch(getFreelancerApplications({})).unwrap(),
      ]);
    } catch {
      Alert.alert('Error', 'Failed to load offers. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Combine offers + applications ────────────────────────────────────────
  useEffect(() => {
    const directOffers = (receivedOffers || []).map(o => ({
      ...o,
      source: 'offer', isFromApplication: false, hasOffer: true,
      offerId: o._id, status: o.status || 'pending', displayStatus: o.status || 'pending',
    }));

    const appOffers = (applications || [])
      .filter(app => ['offered', 'accepted', 'hired', 'in_progress', 'completed', 'pending', 'declined', 'expired'].includes(app.status))
      .map(app => {
        const job = app.job_id || {};
        const client = app.client_id || {};

        let match = (receivedOffers || []).find(o =>
          o.application_id?.toString() === app._id?.toString()
        );
        if (!match && job._id) {
          match = (receivedOffers || []).find(o => {
            const oJob = o.job_id?._id?.toString() || o.job_id?.toString();
            const oFl  = o.freelancer_id?._id?.toString() || o.freelancer_id?.toString();
            return oJob === job._id?.toString() && oFl === (app.freelancer_id?._id?.toString() || app.freelancer_id?.toString());
          });
        }
        if (!match && job._id) {
          match = (receivedOffers || []).find(o =>
            (o.job_id?._id?.toString() || o.job_id?.toString()) === job._id?.toString()
          );
        }

        const actualStatus = match?.status || app.status;
        return {
          _id: match?._id || app._id,
          source: 'application', client_id: client, job_id: job,
          amount: app.offer_amount || app.proposed_rate || 0,
          message: app.offer_message || app.cover_letter || '',
          status: actualStatus, displayStatus: actualStatus,
          created_at: app.offer_sent_at || app.updated_at || app.applied_at || new Date(),
          expiry_date: match?.expiry_date || null,
          viewed_by_freelancer: match?.viewed_by_freelancer || true,
          application: app, isFromApplication: true,
          offerId: match?._id || null, rawAppStatus: app.status,
          hasOffer: !!match || ['offered', 'accepted', 'hired', 'in_progress', 'completed'].includes(app.status),
          progress: app.progress || (app.status === 'completed' ? 100 : app.status === 'in_progress' ? 50 : 0),
        };
      });

    const directIds = new Set(directOffers.map(o => o._id));
    const filtered  = appOffers.filter(a =>
      !(a.offerId && directIds.has(a.offerId)) && !directIds.has(a._id)
    );

    const all = [...directOffers, ...filtered]
      .filter(o => o.status !== 'pending') // Filter out pending
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setCombinedOffers(all);
  }, [receivedOffers, applications]);

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredOffers = combinedOffers.filter(o => {
    if (activeTab === 'All')     return true;
    return o.status === activeTab;
  });

  // Count active jobs (hired + in_progress)
  const activeJobsCount = combinedOffers.filter(
    o => o.status === 'hired' || o.status === 'in_progress'
  ).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleOfferPress = (offer) => { 
    setSelectedOffer(offer); 
    setShowModal(true); 
  };

  const handleMessageClient = (clientId, clientName) => {
    setShowModal(false);
    onNavigate('Messages', { userId: clientId, userName: clientName, userRole: 'client' });
  };

  const handleNavigateToJob = (offer) => {
    setShowModal(false);
    if (offer.job_id?._id || offer.job_id) {
      onNavigate('JobDetails', { 
        jobId: offer.job_id?._id || offer.job_id, 
        fromMyJobs: true 
      });
    } else {
      Alert.alert('Info', 'Job details not available');
    }
  };

  const handleTabPress = (key) => {
    if (key === 'Home') {
      onNavigate('FreelancerDashboard', { returnState: { activeTab: key } });
    } else if (key === 'MyJobs') {
      onNavigate('MyJobs', { returnState: { activeTab: key } });
    } else if (key === 'Messages') {
      onNavigate('Messages', { returnState: { activeTab: key } });
    } else if (key === 'Profile') {
      onNavigate('FreelancerProfile', { returnState: { activeTab: key } });
    } else if (key === 'MyApplications') {
      onNavigate('MyApplications', { returnState: { activeTab: key } });
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  const isInitialLoading = (isLoading || appsLoading) && !refreshing && combinedOffers.length === 0;

  if (isInitialLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} activeOpacity={0.7}>
            <View style={s.iconBtn}><Ionicons name="arrow-back" size={18} color={WHITE} /></View>
          </TouchableOpacity>
          <Text style={s.topbarTitle}>My Work</Text>
          <View style={{ width:40 }} />
        </View>
        <View style={s.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={s.loadingText}>Loading your work…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingOffers = receivedOffers?.filter(o => o.status === 'pending').length || 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={s.root}>

        {/* ── Top Bar ── */}
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} activeOpacity={0.7}>
            <View style={s.iconBtn}><Ionicons name="arrow-back" size={18} color={WHITE} /></View>
          </TouchableOpacity>
          <View style={s.topbarCenter}>
            <Text style={s.topbarTitle}>My Work</Text>
            {activeJobsCount > 0 && (
              <View style={s.topbarBadge}>
                <Text style={s.topbarBadgeText}>{activeJobsCount} active</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={fetchData} activeOpacity={0.7}>
            <View style={s.iconBtnOutline}><Ionicons name="refresh-outline" size={18} color={BLUE_MD} /></View>
          </TouchableOpacity>
        </View>

        {/* ── Stats Row - Updated with hired/in_progress ── */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: GREEN }]}>{activeJobsCount}</Text>
            <Text style={s.statLabel}>Active Jobs</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: BLUE }]}>{combinedOffers.length}</Text>
            <Text style={s.statLabel}>Total Jobs</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: ORANGE }]}>{combinedOffers.filter(o=>o.status==='offered').length}</Text>
            <Text style={s.statLabel}>Offers</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: GREEN_DARK }]}>{combinedOffers.filter(o=>o.status==='completed').length}</Text>
            <Text style={s.statLabel}>Completed</Text>
          </View>
        </View>

        {/* ── Filter Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.tabScroll} contentContainerStyle={s.tabContent}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            const count = tab.key === 'All'
              ? combinedOffers.length
              : combinedOffers.filter(o=>o.status===tab.key).length;
            const isHot = tab.key === 'hired' && count > 0;

            return (
              <TouchableOpacity key={tab.key}
                style={[s.tab, active && s.tabActive, isHot && !active && s.tabHot]}
                onPress={() => setActiveTab(tab.key)} activeOpacity={0.75}>
                <Text style={[s.tabText, active && s.tabTextActive, isHot && !active && s.tabTextHot]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[s.tabBadge, active && s.tabBadgeActive, isHot && !active && s.tabBadgeHot]}>
                    <Text style={[s.tabBadgeText, active && s.tabBadgeTextActive, isHot && !active && s.tabBadgeTextHot]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Scrollable Content ── */}
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={BLUE} />}
        >
          {filteredOffers.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name={activeTab === 'hired' ? 'people-outline' : 'briefcase-outline'} size={48} color={BLUE} />
              </View>
              <Text style={s.emptyTitle}>
                {activeTab === 'hired' ? 'No hired jobs yet' : 
                 activeTab === 'in_progress' ? 'No work in progress' :
                 activeTab === 'completed' ? 'No completed jobs' :
                 'No items here'}
              </Text>
              <Text style={s.emptyText}>
                {activeTab === 'hired' 
                  ? 'When you get hired for a job, it will appear here.'
                  : activeTab === 'in_progress'
                  ? 'Start working on your hired jobs to track progress here.'
                  : activeTab === 'completed'
                  ? 'Completed jobs will appear here.'
                  : 'Keep applying to jobs to get hired!'}
              </Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => onNavigate('FindJobs')} activeOpacity={0.8}>
                <Ionicons name="search-outline" size={18} color={WHITE} style={{ marginRight: 6 }} />
                <Text style={s.emptyBtnText}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredOffers.map(offer => (
              <OfferCard key={offer._id} offer={offer} onPress={handleOfferPress} />
            ))
          )}
        </ScrollView>
      </View>

      {/* ── Detail Modal - Updated for hired/in_progress ── */}
      <Modal animationType="slide" transparent visible={showModal} onRequestClose={() => setShowModal(false)}>
        <View style={modal.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{ flex:1, justifyContent:'flex-end' }}>
            <View style={modal.sheet}>
              <View style={modal.handle} />

              <View style={modal.header}>
                <TouchableOpacity style={modal.closeBtn} onPress={() => setShowModal(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={24} color={TEXT_MUTED} />
                </TouchableOpacity>
                <Text style={modal.title}>Job Details</Text>
                <View style={{ width:40 }} />
              </View>

              {selectedOffer && (() => {
                const client     = selectedOffer.client_id || {};
                const job        = selectedOffer.job_id || {};
                const clientName = client.company_name ||
                  `${client.first_name||''} ${client.last_name||''}`.trim() || 'Client';
                const isOffered  = selectedOffer.status === 'offered';
                const isHired    = selectedOffer.status === 'hired';
                const isInProgress = selectedOffer.status === 'in_progress';
                const isCompleted = selectedOffer.status === 'completed';
                const isActive   = isHired || isInProgress;
                const timeLeft   = getTimeRemaining(selectedOffer.expiry_date);
                const progress   = selectedOffer.progress || (isCompleted ? 100 : isInProgress ? 50 : 0);

                return (
                  <>
                    <View style={modal.clientStrip}>
                      <Avatar src={client.profile_picture} first={client.first_name}
                        last={client.last_name} name={clientName} size={52} />
                      <View style={{ flex:1 }}>
                        <Text style={modal.clientName}>{clientName}</Text>
                        <Text style={modal.clientRole}>Client</Text>
                      </View>
                      <StatusBadge status={selectedOffer.status} />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}
                      contentContainerStyle={modal.body}>

                      <View style={modal.card}>
                        <Text style={modal.cardEyebrow}>Job</Text>
                        <Text style={modal.cardTitle}>{job.title || 'Project'}</Text>
                        {!!job.description && (
                          <Text style={modal.cardDesc} numberOfLines={3}>{job.description}</Text>
                        )}
                      </View>

                      <View style={[modal.amountCard, (isOffered || isActive) && modal.amountCardActive]}>
                        <View style={modal.amountRow}>
                          <View>
                            <Text style={modal.amountLabel}>Amount</Text>
                            <Text style={modal.amountValue}>{formatCurrency(selectedOffer.amount)}</Text>
                          </View>
                          {isOffered && (
                            <View style={modal.newPill}>
                              <Ionicons name="gift-outline" size={11} color={WHITE} />
                              <Text style={modal.newPillText}>Offer</Text>
                            </View>
                          )}
                          {(isHired || isInProgress) && (
                            <View style={[modal.newPill, { backgroundColor: GREEN }]}>
                              <Ionicons name="checkmark-circle" size={11} color={WHITE} />
                              <Text style={modal.newPillText}>Active</Text>
                            </View>
                          )}
                        </View>
                        {timeLeft && isOffered && (
                          <View style={modal.timerInline}>
                            <Ionicons name="hourglass-outline" size={12} color={ORANGE} />
                            <Text style={modal.timerInlineText}>{timeLeft}</Text>
                          </View>
                        )}
                      </View>

                      {/* Progress Section - Show for active and completed jobs */}
                      {(isHired || isInProgress || isCompleted) && (
                        <View style={modal.card}>
                          <View style={modal.progressHeader}>
                            <Text style={modal.cardEyebrow}>Progress</Text>
                            <Text style={modal.progressPercent}>{progress}%</Text>
                          </View>
                          <View style={modal.progressBarBg}>
                            <View style={[modal.progressBarFill, { width: `${progress}%`, backgroundColor: getProgressColor(progress) }]} />
                          </View>
                          {isInProgress && (
                            <TouchableOpacity style={modal.updateProgressBtn} onPress={() => {
                              setShowModal(false);
                              Alert.alert('Update Progress', 'Update progress feature coming soon!');
                            }}>
                              <Ionicons name="pencil-outline" size={16} color={BLUE} />
                              <Text style={modal.updateProgressText}>Update Progress</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {!!selectedOffer.message && (
                        <View style={modal.card}>
                          <Text style={modal.cardEyebrow}>Message from Client</Text>
                          <Text style={modal.cardBody}>{selectedOffer.message}</Text>
                        </View>
                      )}

                      <View style={modal.card}>
                        <Text style={modal.cardEyebrow}>Details</Text>
                        <View style={modal.grid}>
                          <GridItem label="Date" value={formatDate(selectedOffer.created_at)} />
                          <GridItem label="Time" value={formatTime(selectedOffer.created_at)} />
                          {selectedOffer.expiry_date && (
                            <GridItem label="Expires" value={formatDate(selectedOffer.expiry_date)}
                              valueColor={selectedOffer.status==='expired' ? RED : undefined} />
                          )}
                          <GridItem label="Status"
                            value={(STATUS_CONFIG[selectedOffer.status]||STATUS_CONFIG.pending).label}
                            valueColor={(STATUS_CONFIG[selectedOffer.status]||STATUS_CONFIG.pending).color} />
                        </View>
                      </View>

                      {/* Action Buttons for Active Jobs */}
                      {isActive && (
                        <View style={modal.actionRow}>
                          <TouchableOpacity style={[modal.cta, { flex: 1, backgroundColor: BLUE }]} 
                            onPress={() => handleNavigateToJob(selectedOffer)} activeOpacity={0.8}>
                            <Ionicons name="construct-outline" size={20} color={WHITE} />
                            <Text style={modal.ctaText}>View Work</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[modal.cta, { flex: 1, backgroundColor: GREEN }]} 
                            onPress={() => handleMessageClient(client._id, client.first_name)} activeOpacity={0.8}>
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color={WHITE} />
                            <Text style={modal.ctaText}>Message</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Single CTA for Offered jobs */}
                      {(isOffered) && (
                        <TouchableOpacity style={modal.cta}
                          onPress={() => handleMessageClient(client._id, client.first_name)}
                          activeOpacity={0.8}>
                          <Ionicons name="chatbubble-ellipses-outline" size={20} color={WHITE} />
                          <Text style={modal.ctaText}>Message Client</Text>
                        </TouchableOpacity>
                      )}

                      {/* CTA for Completed jobs */}
                      {isCompleted && (
                        <TouchableOpacity style={[modal.cta, { backgroundColor: GREEN_DARK }]}
                          onPress={() => Alert.alert('Review', 'Review feature coming soon!')}
                          activeOpacity={0.8}>
                          <Ionicons name="star-outline" size={20} color={WHITE} />
                          <Text style={modal.ctaText}>Leave Review</Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </>
                );
              })()}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Bottom Tab Bar ── */}
      <BottomTabBar
        activeTab="MyJobs"
        onTabPress={handleTabPress}
        pendingOffers={pendingOffers}
      />
    </SafeAreaView>
  );
}

function GridItem({ label, value, valueColor }) {
  return (
    <View style={grid.item}>
      <Text style={grid.label}>{label}</Text>
      <Text style={[grid.value, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:NAVY },
  root: { flex:1, backgroundColor:BG },

  topbar: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:16, paddingVertical:16, backgroundColor:NAVY,
  },
  topbarCenter: { flexDirection:'row', alignItems:'center', gap:8 },
  topbarTitle:  { fontSize:18, fontWeight:'700', color:WHITE, letterSpacing:-0.3 },
  topbarBadge:  { backgroundColor:GREEN, paddingHorizontal:8, paddingVertical:3, borderRadius:10 },
  topbarBadgeText: { fontSize:10, fontWeight:'700', color:WHITE, letterSpacing:0.3 },
  iconBtn: {
    width:40, height:40, borderRadius:12,
    backgroundColor:'rgba(255,255,255,0.06)',
    borderWidth:1, borderColor:'rgba(255,255,255,0.1)',
    alignItems:'center', justifyContent:'center',
  },
  iconBtnOutline: {
    width:40, height:40, borderRadius:12,
    backgroundColor:'rgba(0,115,207,0.1)',
    borderWidth:1, borderColor:'rgba(0,115,207,0.2)',
    alignItems:'center', justifyContent:'center',
  },

  statsRow: {
    flexDirection:'row', 
    alignItems:'center', 
    justifyContent:'space-around',
    paddingHorizontal:16, 
    paddingVertical:14,
    backgroundColor:CARD, 
    borderBottomWidth:1, 
    borderBottomColor:BORDER,
  },
  statItem: { 
    flex:1, 
    alignItems:'center',
    paddingHorizontal:4,
  },
  statNum:  { 
    fontSize:22, 
    fontWeight:'800', 
    letterSpacing:-0.5,
    textAlign:'center',
  },
  statLabel:{ 
    fontSize:10, 
    color:TEXT_MUTED, 
    fontWeight:'500', 
    marginTop:2, 
    letterSpacing:0.2,
    textAlign:'center',
  },
  statDiv:  { 
    width:1, 
    height:30, 
    backgroundColor:BORDER,
    marginHorizontal:4,
  },

  tabScroll:   { backgroundColor:CARD, borderBottomWidth:1, borderBottomColor:BORDER },
  tabContent:  { paddingHorizontal:14, paddingVertical:11, gap:8, flexDirection:'row' },
  tab: {
    flexDirection:'row', alignItems:'center', gap:5,
    paddingHorizontal:13, paddingVertical:7, borderRadius:20,
    borderWidth:1, borderColor:BORDER, backgroundColor:BG,
  },
  tabActive:      { backgroundColor:`${BLUE}10`, borderColor:BLUE },
  tabHot:         { borderColor:GREEN, borderWidth:1.5 },
  tabText:        { fontSize:12, color:TEXT_MUTED, fontWeight:'500' },
  tabTextActive:  { color:BLUE, fontWeight:'700' },
  tabTextHot:     { color:GREEN, fontWeight:'700' },
  tabBadge:      { minWidth:17, height:17, borderRadius:9, backgroundColor:BORDER, alignItems:'center', justifyContent:'center', paddingHorizontal:3 },
  tabBadgeActive:{ backgroundColor:`${BLUE}22` },
  tabBadgeHot:   { backgroundColor:GREEN },
  tabBadgeText:      { fontSize:10, color:TEXT_MUTED, fontWeight:'600' },
  tabBadgeTextActive:{ color:BLUE },
  tabBadgeTextHot:   { color:WHITE },

  scroll: { padding:16, paddingBottom:100 },

  center:      { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:BG },
  loadingText: { marginTop:12, fontSize:14, color:TEXT_MUTED },

  empty:     { alignItems:'center', paddingVertical:60, paddingHorizontal:32 },
  emptyIcon: { width:80, height:80, borderRadius:20, backgroundColor:`${BLUE}10`, alignItems:'center', justifyContent:'center', marginBottom:16 },
  emptyTitle:{ fontSize:18, fontWeight:'600', color:TEXT_MAIN, marginBottom:6 },
  emptyText: { fontSize:14, color:TEXT_MUTED, textAlign:'center', lineHeight:20, marginBottom:20, paddingHorizontal:40 },
  emptyBtn:  {
    flexDirection:'row', alignItems:'center', gap:6,
    backgroundColor:BLUE, paddingHorizontal:24, paddingVertical:12, borderRadius:12,
    shadowColor:BLUE, shadowOffset:{width:0,height:4}, shadowOpacity:0.26, shadowRadius:10, elevation:3,
  },
  emptyBtnText:{ fontSize:14, fontWeight:'600', color:WHITE },
});

const modal = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(7,26,62,0.55)' },
  sheet: {
    backgroundColor:WHITE, borderTopLeftRadius:24, borderTopRightRadius:24,
    maxHeight:'92%',
  },
  handle: { width:34, height:4, backgroundColor:BORDER, borderRadius:2, alignSelf:'center', marginTop:10, marginBottom:4 },
  header: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:16, paddingVertical:16,
    borderBottomWidth:1, borderBottomColor:BORDER,
  },
  closeBtn: { width:40, height:40, borderRadius:10, backgroundColor:BG, alignItems:'center', justifyContent:'center' },
  title:    { fontSize:18, fontWeight:'600', color:TEXT_MAIN },

  clientStrip: {
    flexDirection:'row', alignItems:'center', padding:16, gap:12,
    borderBottomWidth:1, borderBottomColor:BORDER,
  },
  clientName:  { fontSize:16, fontWeight:'600', color:TEXT_MAIN },
  clientRole:  { fontSize:13, color:TEXT_MUTED, marginTop:1 },

  body: { padding:20, paddingBottom:36 },

  card: {
    backgroundColor:BG, borderRadius:12, padding:16,
    marginBottom:12, borderWidth:1, borderColor:BORDER,
  },
  cardEyebrow: { fontSize:10, fontWeight:'700', color:TEXT_LIGHT, textTransform:'uppercase', letterSpacing:0.7, marginBottom:6 },
  cardTitle:   { fontSize:16, fontWeight:'600', color:TEXT_MAIN, marginBottom:4 },
  cardDesc:    { fontSize:13, color:TEXT_MUTED, lineHeight:18 },
  cardBody:    { fontSize:14, color:TEXT_MAIN, lineHeight:20 },

  amountCard: {
    backgroundColor:`${BLUE}08`, borderRadius:12, padding:16,
    marginBottom:12, borderWidth:1, borderColor:`${BLUE}1A`,
  },
  amountCardActive: { borderColor:BLUE, borderWidth:2 },
  amountRow:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  amountLabel:{ fontSize:11, fontWeight:'700', color:BLUE_MD, textTransform:'uppercase', letterSpacing:0.7, marginBottom:4 },
  amountValue:{ fontSize:28, fontWeight:'800', color:BLUE, letterSpacing:-0.5 },
  newPill:    { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:BLUE, paddingHorizontal:10, paddingVertical:5, borderRadius:12 },
  newPillText:{ fontSize:11, fontWeight:'700', color:WHITE },

  timerInline:{ flexDirection:'row', alignItems:'center', gap:5, marginTop:10,
                backgroundColor:`${ORANGE}15`, paddingHorizontal:10, paddingVertical:6, borderRadius:8 },
  timerInlineText:{ fontSize:12, color:ORANGE, fontWeight:'600' },

  // Progress styles
  progressHeader: {
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:6,
  },
  progressPercent: {
    fontSize:18,
    fontWeight:'700',
    color:TEXT_MAIN,
  },
  progressBarBg: {
    height:8,
    backgroundColor:BORDER,
    borderRadius:4,
    overflow:'hidden',
    marginBottom:10,
  },
  progressBarFill: {
    height:'100%',
    borderRadius:4,
  },
  updateProgressBtn: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    gap:6,
    paddingVertical:10,
    backgroundColor:`${BLUE}10`,
    borderRadius:8,
    marginTop:4,
  },
  updateProgressText: {
    fontSize:13,
    fontWeight:'600',
    color:BLUE,
  },

  grid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginTop:4 },

  actionRow: {
    flexDirection:'row',
    gap:10,
    marginTop:4,
  },

  cta: {
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
    paddingVertical:14, borderRadius:12, marginTop:4,
    shadowColor:BLUE, shadowOffset:{width:0,height:4}, shadowOpacity:0.25, shadowRadius:12, elevation:4,
  },
  ctaText: { fontSize:15, fontWeight:'700', color:WHITE },
});

const grid = StyleSheet.create({
  item:  { width:'48%' },
  label: { fontSize:10, color:TEXT_LIGHT, textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 },
  value: { fontSize:13, fontWeight:'600', color:TEXT_MAIN },
});

// ─── Bottom Tab Bar Styles - Same as MyJobs ──────────────────────────────────
const styles = StyleSheet.create({
  tabSafe: { backgroundColor: 'transparent', position: 'absolute', bottom: 0, left: 0, right: 0 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabItemCenter: {
    flex: 0,
    marginHorizontal: 8,
    marginTop: -20,
  },
  tabItemActive: {},
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: WHITE,
  },
  centerButtonActive: {
    backgroundColor: BLUE,
    transform: [{ scale: 1.05 }],
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