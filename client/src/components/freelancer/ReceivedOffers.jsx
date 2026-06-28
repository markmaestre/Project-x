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
import { getFreelancerApplications } from '../../Redux/slices/applicationSlice';

const { width } = Dimensions.get('window');

// ─── Design Tokens ───────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const NAVY_MID   = '#0D2456';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
const GOLD       = '#C89520';
const WHITE      = '#FFFFFF';
const BG         = '#F0F4F8';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#4A6A8A';
const TEXT_LIGHT = '#8AA4BE';
const BORDER     = '#DCE4EC';
const GREEN      = '#059669';
const GREEN_SOFT = '#D1FAE5';
const ORANGE     = '#D97706';
const RED        = '#DC2626';
const RED_SOFT   = '#FEE2E2';
const YELLOW_SOFT= '#FEF3C7';
const PURPLE     = '#6D28D9';
const PURPLE_SOFT= '#EDE9FE';
const TEAL       = '#0D9488';
const TEAL_SOFT  = '#CCFBF1';

// ─── Tabs - Only Offer related tabs ──────────────────────────────────────────
const TABS = [
  { key: 'All',      label: 'All' },
  { key: 'offered',  label: 'Offers' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
  { key: 'expired',  label: 'Expired' },
];

// ─── Status Config - Only Offer statuses ──────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'Pending',     color: ORANGE,      bgColor: YELLOW_SOFT,           icon: 'time-outline' },
  offered:   { label: 'New Offer',   color: BLUE,        bgColor: `${BLUE}14`,           icon: 'gift-outline' },
  accepted:  { label: 'Accepted',    color: GREEN,       bgColor: GREEN_SOFT,            icon: 'checkmark-circle-outline' },
  declined:  { label: 'Declined',    color: RED,         bgColor: RED_SOFT,              icon: 'close-circle-outline' },
  expired:   { label: 'Expired',     color: TEXT_LIGHT,  bgColor: '#F3F4F6',             icon: 'calendar-outline' },
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
  wrap:      { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:9, paddingVertical:5, borderRadius:20 },
  small:     { paddingHorizontal:7, paddingVertical:3 },
  text:      { fontSize:11, fontWeight:'700', letterSpacing:0.1 },
  smallText: { fontSize:10 },
});

function Avatar({ src, first, last, name, size = 44 }) {
  const color = getAvatarColor(name || first || '');
  const initials = getInitials(first, last) || 'C';
  const r = size / 2;
  return (
    <View style={{ width:size, height:size, borderRadius:r, backgroundColor:`${color}18`, alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
      {src
        ? <Image source={{ uri:src }} style={{ width:size, height:size, borderRadius:r }} />
        : <Text style={{ fontSize: size * 0.33, fontWeight:'700', color }}>{initials}</Text>
      }
    </View>
  );
}

// ─── New-Offer Banner ─────────────────────────────────────────────────────────
function NewOfferBanner({ offers, onPress }) {
  const newOffers = offers.filter(o =>
    o.status === 'offered' && o.status !== 'expired'
  );
  if (newOffers.length === 0) return null;

  const latest = newOffers[0];
  const client = latest.client_id || {};
  const job    = latest.job_id || {};
  const clientName = client.company_name ||
    `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'A client';

  return (
    <TouchableOpacity style={banner.wrap} onPress={() => onPress(latest)} activeOpacity={0.88}>
      <View style={banner.accentBar} />
      <View style={banner.inner}>
        <View style={banner.iconWrap}>
          <Ionicons name="gift" size={22} color={WHITE} />
        </View>
        <View style={banner.textBlock}>
          <View style={banner.topRow}>
            <Text style={banner.label}>New Offer Received</Text>
            {newOffers.length > 1 && (
              <View style={banner.countPill}>
                <Text style={banner.countText}>+{newOffers.length - 1} more</Text>
              </View>
            )}
          </View>
          <Text style={banner.headline} numberOfLines={1}>
            {clientName} — {job.title || 'Project'}
          </Text>
          <View style={banner.metaRow}>
            <Ionicons name="cash-outline" size={12} color={`${BLUE}CC`} />
            <Text style={banner.meta}>{formatCurrency(latest.amount)}</Text>
            <View style={banner.dot} />
            <Ionicons name="time-outline" size={12} color={`${BLUE}CC`} />
            <Text style={banner.meta}>{formatDateTime(latest.created_at)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={BLUE_MD} />
      </View>
    </TouchableOpacity>
  );
}

const banner = StyleSheet.create({
  wrap: {
    marginHorizontal:16, marginTop:14, marginBottom:4,
    backgroundColor:WHITE, borderRadius:14,
    borderWidth:1.5, borderColor:`${BLUE}28`,
    shadowColor:BLUE, shadowOffset:{width:0,height:4},
    shadowOpacity:0.10, shadowRadius:14, elevation:4,
    overflow:'hidden',
  },
  accentBar: { height:3, backgroundColor:BLUE_MD, width:'100%' },
  inner: {
    flexDirection:'row', alignItems:'center',
    padding:14, gap:12,
  },
  iconWrap: {
    width:44, height:44, borderRadius:12,
    backgroundColor:BLUE, alignItems:'center', justifyContent:'center',
    shadowColor:BLUE, shadowOffset:{width:0,height:3}, shadowOpacity:0.30, shadowRadius:8, elevation:3,
  },
  textBlock: { flex:1 },
  topRow:    { flexDirection:'row', alignItems:'center', gap:8, marginBottom:2 },
  label:     { fontSize:10, fontWeight:'700', color:BLUE, textTransform:'uppercase', letterSpacing:0.8 },
  countPill: { backgroundColor:`${BLUE}14`, paddingHorizontal:7, paddingVertical:2, borderRadius:10 },
  countText: { fontSize:10, fontWeight:'700', color:BLUE },
  headline:  { fontSize:14, fontWeight:'700', color:TEXT_MAIN, marginBottom:4 },
  metaRow:   { flexDirection:'row', alignItems:'center', gap:4 },
  meta:      { fontSize:11, color:TEXT_MUTED, fontWeight:'500' },
  dot:       { width:3, height:3, borderRadius:1.5, backgroundColor:BORDER, marginHorizontal:2 },
});

// ─── Offer Card ───────────────────────────────────────────────────────────────
function OfferCard({ offer, onPress }) {
  const client     = offer.client_id || {};
  const job        = offer.job_id || {};
  const clientName = client.company_name ||
    `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client';

  const isOffered   = offer.status === 'offered';
  const isAccepted  = offer.status === 'accepted';
  const isDeclined  = offer.status === 'declined';
  const isExpired   = offer.status === 'expired';
  const timeLeft    = getTimeRemaining(offer.expiry_date);

  let cardExtra = {};
  if (isOffered && !isExpired) cardExtra = card.offered;
  else if (isAccepted) cardExtra = card.accepted;
  else if (isDeclined) cardExtra = card.declined;
  else if (isExpired)  cardExtra = card.expired;

  return (
    <TouchableOpacity style={[card.base, cardExtra]} activeOpacity={0.84} onPress={() => onPress(offer)}>

      {isOffered && !isExpired && <View style={card.stripe} />}

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
        <MetaItem icon="cash-outline" label="Offer Amount" value={formatCurrency(offer.amount)} valueStyle={isOffered && card.amountHighlight} />
        <MetaItem icon="calendar-outline" label="Received" value={formatDate(offer.created_at)} sub={formatTime(offer.created_at)} />
      </View>

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

      {isAccepted && <FooterLabel icon="checkmark-circle" color={GREEN} bg={GREEN_SOFT} text="Offer accepted by you" />}
      {isDeclined  && <FooterLabel icon="close-circle"        color={RED}        bg={RED_SOFT}    text="You declined this offer" />}
      {isExpired   && <FooterLabel icon="calendar"            color={TEXT_LIGHT}  bg="#F3F4F6"    text="This offer has expired" />}
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
    backgroundColor:CARD, borderRadius:16, marginBottom:12,
    borderWidth:1, borderColor:BORDER,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:6, elevation:2,
    overflow:'hidden',
  },
  offered:  { borderColor:BLUE, borderWidth:2, shadowColor:BLUE, shadowOpacity:0.12, shadowRadius:14, elevation:5 },
  accepted: { borderColor:GREEN, borderWidth:1.5 },
  declined: { borderColor:RED,   borderWidth:1.5, opacity:0.88 },
  expired:  { opacity:0.65 },
  stripe:   { height:3, backgroundColor:BLUE_MD },
  header:   { flexDirection:'row', alignItems:'center', padding:14, paddingBottom:10, gap:12 },
  headerText:{ flex:1 },
  clientName:{ fontSize:14, fontWeight:'700', color:TEXT_MAIN, marginBottom:2 },
  jobTitle:  { fontSize:12, color:TEXT_MUTED },
  divider:   { height:1, backgroundColor:BG, marginHorizontal:14 },
  metaGrid:  { flexDirection:'row', gap:0, padding:14, paddingVertical:12 },
  amountHighlight: { color:BLUE, fontSize:16, fontWeight:'800' },
  timerRow:  { flexDirection:'row', alignItems:'center', gap:6, marginHorizontal:14, marginBottom:10,
               backgroundColor:YELLOW_SOFT, paddingHorizontal:10, paddingVertical:6, borderRadius:8 },
  timerText: { fontSize:12, color:ORANGE, fontWeight:'600' },
  msgBox:    { backgroundColor:BG, marginHorizontal:14, marginBottom:12, padding:12, borderRadius:10, borderWidth:1, borderColor:BORDER },
  msgLabel:  { fontSize:9, fontWeight:'700', color:TEXT_LIGHT, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 },
  msgText:   { fontSize:12, color:TEXT_MUTED, lineHeight:17 },
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

  const [activeTab,      setActiveTab]      = useState('All');
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
      .filter(app => ['offered', 'accepted', 'pending', 'declined', 'expired'].includes(app.status))
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
          hasOffer: !!match || ['offered', 'accepted'].includes(app.status),
        };
      });

    const directIds = new Set(directOffers.map(o => o._id));
    const filtered  = appOffers.filter(a =>
      !(a.offerId && directIds.has(a.offerId)) && !directIds.has(a._id)
    );

    const all = [...directOffers, ...filtered]
      .filter(o => o.status !== 'hired' && o.status !== 'pending')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setCombinedOffers(all);
  }, [receivedOffers, applications]);

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredOffers = combinedOffers.filter(o => {
    if (activeTab === 'All')     return true;
    return o.status === activeTab;
  });

  const newOffersCount = combinedOffers.filter(
    o => o.status === 'offered' && o.status !== 'expired'
  ).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleOfferPress = (offer) => { setSelectedOffer(offer); setShowModal(true); };

  const handleMessageClient = (clientId, clientName) => {
    setShowModal(false);
    onNavigate('Messages', { userId: clientId, userName: clientName, userRole: 'client' });
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
          <Text style={s.topbarTitle}>Offers</Text>
          <View style={{ width:40 }} />
        </View>
        <View style={s.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={s.loadingText}>Loading offers…</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={s.topbarTitle}>Offers Received</Text>
            {newOffersCount > 0 && (
              <View style={s.topbarBadge}>
                <Text style={s.topbarBadgeText}>{newOffersCount} new</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={fetchData} activeOpacity={0.7}>
            <View style={s.iconBtnOutline}><Ionicons name="refresh-outline" size={18} color={BLUE_MD} /></View>
          </TouchableOpacity>
        </View>

        {/* ── Stats Row - Only Offer stats ── */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: BLUE }]}>{combinedOffers.length}</Text>
            <Text style={s.statLabel}>Total Offers</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: ORANGE }]}>{combinedOffers.filter(o=>o.status==='offered').length}</Text>
            <Text style={s.statLabel}>New</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: GREEN }]}>{combinedOffers.filter(o=>o.status==='accepted').length}</Text>
            <Text style={s.statLabel}>Accepted</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: RED }]}>{combinedOffers.filter(o=>o.status==='declined').length}</Text>
            <Text style={s.statLabel}>Declined</Text>
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
            const isHot = tab.key === 'offered' && count > 0;

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
          <NewOfferBanner offers={combinedOffers} onPress={handleOfferPress} />

          {filteredOffers.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="gift-outline" size={40} color={BLUE} />
              </View>
              <Text style={s.emptyTitle}>No offers here</Text>
              <Text style={s.emptyText}>
                {activeTab === 'All'
                  ? 'Keep applying to jobs — clients will reach out with offers.'
                  : `No ${activeTab} offers at the moment.`}
              </Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => onNavigate('FindJobs')} activeOpacity={0.8}>
                <Ionicons name="search-outline" size={15} color={WHITE} />
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

      {/* ── Detail Modal ── */}
      <Modal animationType="slide" transparent visible={showModal} onRequestClose={() => setShowModal(false)}>
        <View style={modal.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{ flex:1, justifyContent:'flex-end' }}>
            <View style={modal.sheet}>
              <View style={modal.handle} />

              <View style={modal.header}>
                <TouchableOpacity style={modal.closeBtn} onPress={() => setShowModal(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={19} color={TEXT_MAIN} />
                </TouchableOpacity>
                <Text style={modal.title}>Offer Details</Text>
                <View style={{ width:36 }} />
              </View>

              {selectedOffer && (() => {
                const client     = selectedOffer.client_id || {};
                const job        = selectedOffer.job_id || {};
                const clientName = client.company_name ||
                  `${client.first_name||''} ${client.last_name||''}`.trim() || 'Client';
                const isOffered  = selectedOffer.status === 'offered';
                const isAccepted = selectedOffer.status === 'accepted';
                const timeLeft   = getTimeRemaining(selectedOffer.expiry_date);

                return (
                  <>
                    <View style={modal.clientStrip}>
                      <Avatar src={client.profile_picture} first={client.first_name}
                        last={client.last_name} name={clientName} size={50} />
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

                      <View style={[modal.amountCard, isOffered && modal.amountCardActive]}>
                        <View style={modal.amountRow}>
                          <View>
                            <Text style={modal.amountLabel}>Offer Amount</Text>
                            <Text style={modal.amountValue}>{formatCurrency(selectedOffer.amount)}</Text>
                          </View>
                          {isOffered && (
                            <View style={modal.newPill}>
                              <Ionicons name="gift-outline" size={11} color={WHITE} />
                              <Text style={modal.newPillText}>New</Text>
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

                      {!!selectedOffer.message && (
                        <View style={modal.card}>
                          <Text style={modal.cardEyebrow}>Message from Client</Text>
                          <Text style={modal.cardBody}>{selectedOffer.message}</Text>
                        </View>
                      )}

                      <View style={modal.card}>
                        <Text style={modal.cardEyebrow}>Offer Details</Text>
                        <View style={modal.grid}>
                          <GridItem label="Date Received" value={formatDate(selectedOffer.created_at)} />
                          <GridItem label="Time"          value={formatTime(selectedOffer.created_at)} />
                          {selectedOffer.expiry_date && (
                            <GridItem label="Expires"  value={formatDate(selectedOffer.expiry_date)}
                              valueColor={selectedOffer.status==='expired' ? RED : undefined} />
                          )}
                          <GridItem label="Status"
                            value={(STATUS_CONFIG[selectedOffer.status]||STATUS_CONFIG.pending).label}
                            valueColor={(STATUS_CONFIG[selectedOffer.status]||STATUS_CONFIG.pending).color} />
                        </View>
                      </View>

                      {(isOffered || isAccepted) && (
                        <TouchableOpacity style={modal.cta}
                          onPress={() => handleMessageClient(client._id, client.first_name)}
                          activeOpacity={0.8}>
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color={WHITE} />
                          <Text style={modal.ctaText}>Message Client</Text>
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
    paddingHorizontal:16, paddingVertical:13, backgroundColor:NAVY,
  },
  topbarCenter: { flexDirection:'row', alignItems:'center', gap:8 },
  topbarTitle:  { fontSize:17, fontWeight:'700', color:WHITE, letterSpacing:-0.3 },
  topbarBadge:  { backgroundColor:BLUE_MD, paddingHorizontal:8, paddingVertical:3, borderRadius:10 },
  topbarBadgeText: { fontSize:10, fontWeight:'700', color:WHITE, letterSpacing:0.3 },
  iconBtn: {
    width:38, height:38, borderRadius:10,
    backgroundColor:'rgba(255,255,255,0.09)',
    borderWidth:1, borderColor:'rgba(255,255,255,0.14)',
    alignItems:'center', justifyContent:'center',
  },
  iconBtnOutline: {
    width:38, height:38, borderRadius:10,
    backgroundColor:'rgba(0,115,207,0.1)',
    borderWidth:1, borderColor:'rgba(0,115,207,0.22)',
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
  tabHot:         { borderColor:BLUE_MD, borderWidth:1.5 },
  tabText:        { fontSize:12, color:TEXT_MUTED, fontWeight:'500' },
  tabTextActive:  { color:BLUE, fontWeight:'700' },
  tabTextHot:     { color:BLUE_MD, fontWeight:'700' },
  tabBadge:      { minWidth:17, height:17, borderRadius:9, backgroundColor:BORDER, alignItems:'center', justifyContent:'center', paddingHorizontal:3 },
  tabBadgeActive:{ backgroundColor:`${BLUE}22` },
  tabBadgeHot:   { backgroundColor:BLUE },
  tabBadgeText:      { fontSize:10, color:TEXT_MUTED, fontWeight:'600' },
  tabBadgeTextActive:{ color:BLUE },
  tabBadgeTextHot:   { color:WHITE },

  scroll: { padding:16, paddingBottom:48 },

  center:      { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:BG },
  loadingText: { marginTop:12, fontSize:13, color:TEXT_MUTED },

  empty:     { alignItems:'center', paddingVertical:64, paddingHorizontal:32 },
  emptyIcon: { width:76, height:76, borderRadius:18, backgroundColor:`${BLUE}10`, alignItems:'center', justifyContent:'center', marginBottom:16 },
  emptyTitle:{ fontSize:16, fontWeight:'700', color:TEXT_MAIN, marginBottom:6 },
  emptyText: { fontSize:13, color:TEXT_MUTED, textAlign:'center', lineHeight:20, marginBottom:24 },
  emptyBtn:  {
    flexDirection:'row', alignItems:'center', gap:6,
    backgroundColor:BLUE, paddingHorizontal:20, paddingVertical:12, borderRadius:12,
    shadowColor:BLUE, shadowOffset:{width:0,height:4}, shadowOpacity:0.26, shadowRadius:10, elevation:3,
  },
  emptyBtnText:{ fontSize:13, fontWeight:'600', color:WHITE },
});

const modal = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(7,26,62,0.52)' },
  sheet: {
    backgroundColor:WHITE, borderTopLeftRadius:24, borderTopRightRadius:24,
    maxHeight:'92%', minHeight:'75%',
  },
  handle: { width:34, height:4, backgroundColor:BORDER, borderRadius:2, alignSelf:'center', marginTop:10, marginBottom:4 },
  header: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:16, paddingVertical:12,
    borderBottomWidth:1, borderBottomColor:BORDER,
  },
  closeBtn: { width:34, height:34, borderRadius:17, backgroundColor:BG, alignItems:'center', justifyContent:'center' },
  title:    { fontSize:15, fontWeight:'700', color:TEXT_MAIN },

  clientStrip: {
    flexDirection:'row', alignItems:'center', padding:14, gap:12,
    borderBottomWidth:1, borderBottomColor:BORDER,
  },
  clientName:  { fontSize:15, fontWeight:'700', color:TEXT_MAIN },
  clientRole:  { fontSize:12, color:TEXT_MUTED, marginTop:1 },

  body: { padding:16, paddingBottom:36 },

  card: {
    backgroundColor:BG, borderRadius:12, padding:14,
    marginBottom:12, borderWidth:1, borderColor:BORDER,
  },
  cardEyebrow: { fontSize:10, fontWeight:'700', color:TEXT_LIGHT, textTransform:'uppercase', letterSpacing:0.7, marginBottom:5 },
  cardTitle:   { fontSize:15, fontWeight:'700', color:TEXT_MAIN, marginBottom:4 },
  cardDesc:    { fontSize:12, color:TEXT_MUTED, lineHeight:18 },
  cardBody:    { fontSize:13, color:TEXT_MAIN, lineHeight:20 },

  amountCard: {
    backgroundColor:`${BLUE}08`, borderRadius:12, padding:14,
    marginBottom:12, borderWidth:1, borderColor:`${BLUE}1A`,
  },
  amountCardActive: { borderColor:BLUE, borderWidth:2 },
  amountRow:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  amountLabel:{ fontSize:10, fontWeight:'700', color:BLUE_MD, textTransform:'uppercase', letterSpacing:0.7, marginBottom:4 },
  amountValue:{ fontSize:26, fontWeight:'800', color:BLUE, letterSpacing:-0.5 },
  newPill:    { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:BLUE, paddingHorizontal:10, paddingVertical:5, borderRadius:12 },
  newPillText:{ fontSize:11, fontWeight:'700', color:WHITE },

  timerInline:{ flexDirection:'row', alignItems:'center', gap:5, marginTop:10,
                backgroundColor:YELLOW_SOFT, paddingHorizontal:10, paddingVertical:6, borderRadius:8 },
  timerInlineText:{ fontSize:12, color:ORANGE, fontWeight:'600' },

  grid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginTop:4 },

  cta: {
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
    backgroundColor:BLUE, paddingVertical:14, borderRadius:12, marginTop:4,
    shadowColor:BLUE, shadowOffset:{width:0,height:4}, shadowOpacity:0.25, shadowRadius:12, elevation:4,
  },
  ctaText: { fontSize:15, fontWeight:'700', color:WHITE },
});

const grid = StyleSheet.create({
  item:  { width:'48%' },
  label: { fontSize:10, color:TEXT_LIGHT, textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 },
  value: { fontSize:13, fontWeight:'600', color:TEXT_MAIN },
});