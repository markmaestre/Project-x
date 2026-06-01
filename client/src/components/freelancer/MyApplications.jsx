import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getFreelancerApplications,
  getSavedJobs,
  unsaveJob,
} from '../../Redux/slices/applicationSlice';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const GOLD       = '#C9A84C';
const GOLD_LIGHT = 'rgba(201,168,76,0.12)';
const GOLD_MID   = 'rgba(201,168,76,0.35)';
const BG         = '#080810';
const SURFACE    = '#10101C';
const CARD       = '#13131F';
const CARD_HOVER = '#16162A';
const BORDER     = 'rgba(255,255,255,0.06)';
const BORDER_MED = 'rgba(255,255,255,0.10)';
const TEXT_1     = '#F0F0F8';
const TEXT_2     = 'rgba(240,240,248,0.55)';
const TEXT_3     = 'rgba(240,240,248,0.30)';

const STATUS = {
  pending:  { bg: 'rgba(201,168,76,0.10)', border: 'rgba(201,168,76,0.35)', text: '#C9A84C', dot: '#C9A84C', label: 'Under Review',      icon: 'time-outline' },
  reviewed: { bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.30)', text: '#7EB8FA', dot: '#7EB8FA', label: 'Reviewed',           icon: 'eye-outline' },
  offered:  { bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)', text: '#34D399', dot: '#34D399', label: 'Interview / Offer',   icon: 'star-outline' },
  accepted: { bg: 'rgba(52,211,153,0.14)',  border: 'rgba(52,211,153,0.45)', text: '#34D399', dot: '#34D399', label: 'Accepted',            icon: 'checkmark-circle-outline' },
  rejected: { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.28)', text: '#F87171', dot: '#F87171', label: 'Not Selected',      icon: 'close-circle-outline' },
};
const getStatus = (s) => STATUS[s] || { bg: 'rgba(255,255,255,0.05)', border: BORDER_MED, text: TEXT_2, dot: TEXT_3, label: s || 'Applied', icon: 'document-text-outline' };

const TABS = ['Applied', 'Saved'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const timeAgo = (ds) => {
  if (!ds) return 'Recently';
  const d = Math.floor((Date.now() - new Date(ds)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7)  return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

const catIcon = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('design') || t.includes('ui') || t.includes('ux')) return '🎨';
  if (t.includes('dev') || t.includes('react') || t.includes('node') || t.includes('engineer')) return '💻';
  if (t.includes('write') || t.includes('content') || t.includes('copy')) return '✍️';
  if (t.includes('market') || t.includes('seo') || t.includes('social')) return '📊';
  if (t.includes('video') || t.includes('edit') || t.includes('motion')) return '🎬';
  return '💼';
};

const budget = (job) =>
  job?.budget_amount
    ? `₱${Number(job.budget_amount).toLocaleString()}${job.budget_type === 'hourly' ? '/hr' : ''}`
    : '—';

// ─── Sub-components ───────────────────────────────────────────────────────────

const Pill = ({ icon, label, color = TEXT_3 }) => (
  <View style={pill.wrap}>
    <Ionicons name={icon} size={11} color={color} />
    <Text style={[pill.text, { color }]}>{label}</Text>
  </View>
);
const pill = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 6, borderWidth: 0.5, borderColor: BORDER_MED },
  text:  { fontSize: 11, fontWeight: '500' },
});

const Divider = () => <View style={{ height: 1, backgroundColor: BORDER, marginVertical: 10 }} />;

// ─── Application Card ─────────────────────────────────────────────────────────
const ApplicationCard = ({ application, onViewJob, onViewClient, onMessage }) => {
  const job = application.job_id;
  const st  = getStatus(application.status);
  const isOffered = application.status === 'offered';

  return (
    <View style={ac.card}>
      {/* Top row */}
      <View style={ac.topRow}>
        <View style={ac.logoBox}>
          <Text style={ac.logoEmoji}>{catIcon(job?.title)}</Text>
        </View>
        <View style={ac.topMeta}>
          <Text style={ac.jobTitle} numberOfLines={2}>{job?.title || 'Unknown Job'}</Text>
          <TouchableOpacity style={ac.clientRow} onPress={onViewClient} activeOpacity={0.7}>
            <Text style={ac.clientName}>{job?.client_id?.company_name || 'Client'}</Text>
            <Ionicons name="chevron-forward" size={11} color={GOLD} />
          </TouchableOpacity>
        </View>
        {/* Status badge — top right */}
        <View style={[ac.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
          <View style={[ac.dot, { backgroundColor: st.dot }]} />
          <Text style={[ac.statusText, { color: st.text }]}>{st.label}</Text>
        </View>
      </View>

      {/* Meta pills */}
      <View style={ac.pillRow}>
        <Pill icon="cash-outline"     label={budget(job)}                   color={GOLD} />
        <Pill icon="location-outline" label={job?.work_setup || 'Remote'}             />
        <Pill icon="calendar-outline" label={`Applied ${timeAgo(application.applied_at)}`} />
      </View>

      {/* Offer alert */}
      {isOffered && (
        <View style={ac.offerBanner}>
          <Ionicons name="star" size={13} color={GOLD} />
          <Text style={ac.offerText}>You received an offer — check your messages.</Text>
        </View>
      )}

      <Divider />

      {/* Actions */}
      <View style={ac.actions}>
        <TouchableOpacity style={ac.btnOutline} onPress={onViewJob} activeOpacity={0.75}>
          <Ionicons name="eye-outline" size={13} color={TEXT_2} />
          <Text style={ac.btnOutlineText}>View Job</Text>
        </TouchableOpacity>
        {isOffered ? (
          <TouchableOpacity style={ac.btnGold} onPress={onMessage} activeOpacity={0.85}>
            <Ionicons name="chatbubble-outline" size={13} color={BG} />
            <Text style={ac.btnGoldText}>Message Client</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={ac.btnOutline} onPress={onViewClient} activeOpacity={0.75}>
            <Ionicons name="person-outline" size={13} color={TEXT_2} />
            <Text style={ac.btnOutlineText}>View Client</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const ac = StyleSheet.create({
  card:       { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  topRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  logoBox:    { width: 42, height: 42, borderRadius: 10, backgroundColor: GOLD_LIGHT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoEmoji:  { fontSize: 20 },
  topMeta:    { flex: 1, minWidth: 0 },
  jobTitle:   { fontSize: 14, fontWeight: '700', color: TEXT_1, lineHeight: 20, marginBottom: 2 },
  clientRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clientName: { fontSize: 12, color: TEXT_2 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 0.75, flexShrink: 0 },
  dot:        { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  pillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  offerBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GOLD_LIGHT, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 4, borderWidth: 0.75, borderColor: GOLD_MID },
  offerText:  { fontSize: 11, color: GOLD, flex: 1, fontWeight: '500' },
  actions:    { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 0.75, borderColor: BORDER_MED },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: TEXT_2 },
  btnGold:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: GOLD },
  btnGoldText:{ fontSize: 12, fontWeight: '700', color: BG },
});

// ─── Saved Job Card ───────────────────────────────────────────────────────────
const SavedJobCard = ({ job, onViewJob, onViewClient, onUnsave, onApply }) => (
  <View style={sj.card}>
    <View style={sj.topRow}>
      <View style={sj.logoBox}>
        <Text style={sj.logoEmoji}>{catIcon(job.title)}</Text>
      </View>
      <View style={sj.topMeta}>
        <Text style={sj.jobTitle} numberOfLines={2}>{job.title}</Text>
        <TouchableOpacity style={sj.clientRow} onPress={onViewClient} activeOpacity={0.7}>
          <Text style={sj.clientName}>{job.client_id?.company_name || 'Client'}</Text>
          <Ionicons name="chevron-forward" size={11} color={GOLD} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onUnsave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
        <Ionicons name="bookmark" size={20} color={GOLD} />
      </TouchableOpacity>
    </View>

    <View style={sj.pillRow}>
      <Pill icon="cash-outline"     label={budget(job)}                color={GOLD} />
      <Pill icon="location-outline" label={job.work_setup || 'Remote'}             />
    </View>

    {job.required_skills?.length > 0 && (
      <View style={sj.skillsRow}>
        {job.required_skills.slice(0, 3).map((s, i) => (
          <View key={i} style={sj.skill}>
            <Text style={sj.skillText}>{s}</Text>
          </View>
        ))}
        {job.required_skills.length > 3 && (
          <View style={sj.skill}>
            <Text style={sj.skillText}>+{job.required_skills.length - 3}</Text>
          </View>
        )}
      </View>
    )}

    <Divider />

    <View style={sj.actions}>
      <TouchableOpacity style={sj.btnOutline} onPress={onViewJob} activeOpacity={0.75}>
        <Ionicons name="eye-outline" size={13} color={TEXT_2} />
        <Text style={sj.btnOutlineText}>View Details</Text>
      </TouchableOpacity>
      <TouchableOpacity style={sj.btnGold} onPress={onApply} activeOpacity={0.85}>
        <Text style={sj.btnGoldText}>Apply Now</Text>
        <Ionicons name="arrow-forward" size={13} color={BG} />
      </TouchableOpacity>
    </View>
  </View>
);

const sj = StyleSheet.create({
  card:       { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  topRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  logoBox:    { width: 42, height: 42, borderRadius: 10, backgroundColor: GOLD_LIGHT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoEmoji:  { fontSize: 20 },
  topMeta:    { flex: 1, minWidth: 0 },
  jobTitle:   { fontSize: 14, fontWeight: '700', color: TEXT_1, lineHeight: 20, marginBottom: 2 },
  clientRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clientName: { fontSize: 12, color: TEXT_2 },
  pillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  skillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  skill:      { backgroundColor: 'rgba(201,168,76,0.07)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5, borderColor: GOLD_MID },
  skillText:  { fontSize: 10, color: GOLD, fontWeight: '500' },
  actions:    { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 0.75, borderColor: BORDER_MED },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: TEXT_2 },
  btnGold:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: GOLD },
  btnGoldText:{ fontSize: 12, fontWeight: '700', color: BG },
});

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, count, color, icon, active, onPress }) => (
  <TouchableOpacity
    style={[sc.card, { borderColor: active ? color : BORDER }, active && { backgroundColor: `${color}14` }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Ionicons name={icon} size={16} color={color} />
    <Text style={[sc.count, { color }]}>{count}</Text>
    <Text style={sc.label}>{label}</Text>
  </TouchableOpacity>
);

const sc = StyleSheet.create({
  card:  { minWidth: 76, backgroundColor: CARD, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, gap: 3 },
  count: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 9, color: TEXT_3, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
});

// ─── Job Details Modal ────────────────────────────────────────────────────────
const JobModal = ({ job, visible, onClose, onViewClient }) => {
  if (!job) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={md.overlay}>
        <View style={md.sheet}>
          <View style={md.handle} />
          <TouchableOpacity style={md.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={16} color={TEXT_2} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={md.header}>
              <View style={md.logoBox}>
                <Text style={{ fontSize: 26 }}>{catIcon(job.title)}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={md.title}>{job.title}</Text>
                <TouchableOpacity style={md.clientRow} onPress={onViewClient} activeOpacity={0.7}>
                  <Text style={md.clientName}>{job.client_id?.company_name || 'Client'}</Text>
                  <Ionicons name="person-circle-outline" size={14} color={GOLD} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Salary */}
            <Text style={md.salary}>{budget(job)}</Text>

            {/* Meta */}
            <View style={md.metaRow}>
              {[
                { icon: 'location-outline',  label: job.work_setup || 'Remote' },
                { icon: 'briefcase-outline', label: job.job_type || 'Contract' },
                { icon: 'time-outline',      label: `Posted ${timeAgo(job.created_at)}` },
                { icon: 'people-outline',    label: `${job.total_applicants || 0} applicants` },
              ].map(({ icon, label }) => (
                <View key={label} style={md.metaItem}>
                  <Ionicons name={icon} size={12} color={TEXT_3} />
                  <Text style={md.metaText}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={md.divider} />

            <Text style={md.sectionLabel}>Description</Text>
            <Text style={md.desc}>{job.description}</Text>

            {job.required_skills?.length > 0 && (
              <>
                <Text style={md.sectionLabel}>Required Skills</Text>
                <View style={md.skills}>
                  {job.required_skills.map((s, i) => (
                    <View key={i} style={md.skillBadge}>
                      <Text style={md.skillText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={md.viewClientBtn} onPress={onViewClient} activeOpacity={0.8}>
              <Ionicons name="business-outline" size={16} color={GOLD} />
              <Text style={md.viewClientText}>View Client Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Client Modal ─────────────────────────────────────────────────────────────
const ClientModal = ({ job, visible, onClose, onMessage }) => {
  if (!job?.client_id) return null;
  const c = job.client_id;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={md.overlay}>
        <View style={md.sheet}>
          <View style={md.handle} />
          <TouchableOpacity style={md.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={16} color={TEXT_2} />
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar */}
            <View style={cm.avatarWrap}>
              <View style={cm.avatar}>
                {c.profile_picture
                  ? <Image source={{ uri: c.profile_picture }} style={cm.avatarImg} />
                  : <Text style={cm.avatarLetters}>{c.first_name?.[0]}{c.last_name?.[0]}</Text>}
              </View>
              <Text style={cm.name}>{c.first_name} {c.last_name}</Text>
              <View style={cm.rolePill}>
                <Text style={cm.roleText}>Client</Text>
              </View>
            </View>

            {/* Info rows */}
            <View style={cm.infoCard}>
              {[
                { icon: 'business-outline',      label: 'Company',  value: c.company_name },
                { icon: 'mail-outline',          label: 'Email',    value: c.email_address },
                { icon: 'call-outline',          label: 'Phone',    value: c.phone_number },
                { icon: 'location-outline',      label: 'Location', value: c.city ? `${c.city}, ${c.country}` : null },
                { icon: 'document-text-outline', label: 'Industry', value: c.industry },
              ].map(({ icon, label, value }) => (
                <View key={label} style={cm.infoRow}>
                  <View style={cm.infoIconBox}>
                    <Ionicons name={icon} size={15} color={GOLD} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cm.infoLabel}>{label}</Text>
                    <Text style={cm.infoValue}>{value || 'Not provided'}</Text>
                  </View>
                </View>
              ))}
            </View>

            {c.bio_about && (
              <>
                <Text style={md.sectionLabel}>About</Text>
                <Text style={cm.bio}>{c.bio_about}</Text>
              </>
            )}

            <TouchableOpacity style={cm.msgBtn} onPress={onMessage} activeOpacity={0.85}>
              <Ionicons name="chatbubble-outline" size={16} color={BG} />
              <Text style={cm.msgBtnText}>Send Message</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const md = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#0E0E1A', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: '90%', borderTopWidth: 1, borderColor: BORDER_MED },
  handle:        { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'center', marginBottom: 16 },
  closeBtn:      { position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  header:        { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  logoBox:       { width: 52, height: 52, borderRadius: 12, backgroundColor: GOLD_LIGHT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:         { fontSize: 17, fontWeight: '800', color: TEXT_1, lineHeight: 23 },
  clientRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clientName:    { fontSize: 12, color: TEXT_2 },
  salary:        { fontSize: 22, fontWeight: '800', color: GOLD, marginBottom: 10, letterSpacing: -0.5 },
  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metaItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:      { fontSize: 12, color: TEXT_2 },
  divider:       { height: 1, backgroundColor: BORDER, marginVertical: 14 },
  sectionLabel:  { fontSize: 13, fontWeight: '700', color: TEXT_1, marginBottom: 8, marginTop: 4 },
  desc:          { fontSize: 13, color: TEXT_2, lineHeight: 21, marginBottom: 8 },
  skills:        { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  skillBadge:    { backgroundColor: CARD, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: BORDER_MED },
  skillText:     { fontSize: 12, color: TEXT_2 },
  viewClientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GOLD_LIGHT, paddingVertical: 13, borderRadius: 12, marginTop: 4, marginBottom: 24, borderWidth: 0.75, borderColor: GOLD_MID },
  viewClientText:{ fontSize: 13, fontWeight: '700', color: GOLD },
});

const cm = StyleSheet.create({
  avatarWrap:    { alignItems: 'center', marginBottom: 20, marginTop: 4 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: GOLD_LIGHT, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 2, borderColor: GOLD_MID },
  avatarImg:     { width: 80, height: 80, borderRadius: 40 },
  avatarLetters: { fontSize: 30, fontWeight: '800', color: GOLD },
  name:          { fontSize: 20, fontWeight: '700', color: TEXT_1, marginBottom: 6 },
  rolePill:      { backgroundColor: GOLD_LIGHT, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20, borderWidth: 0.75, borderColor: GOLD_MID },
  roleText:      { fontSize: 11, color: GOLD, fontWeight: '600' },
  infoCard:      { backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: BORDER, gap: 12 },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIconBox:   { width: 30, height: 30, borderRadius: 8, backgroundColor: GOLD_LIGHT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoLabel:     { fontSize: 10, color: TEXT_3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  infoValue:     { fontSize: 13, color: TEXT_1, fontWeight: '500' },
  bio:           { fontSize: 13, color: TEXT_2, lineHeight: 21, marginBottom: 20 },
  msgBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GOLD, paddingVertical: 14, borderRadius: 12, marginBottom: 24 },
  msgBtnText:    { fontSize: 14, fontWeight: '700', color: BG },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyApplications({ onNavigate, onBack }) {
  const dispatch = useDispatch();
  const { applications, savedJobs, isLoading } = useSelector((s) => s.applications);

  const [activeTab,      setActiveTab]      = useState('Applied');
  const [refreshing,     setRefreshing]     = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showJobModal,   setShowJobModal]   = useState(false);
  const [showClientModal,setShowClientModal]= useState(false);
  const [selectedJob,    setSelectedJob]    = useState(null);
  const [stats,          setStats]          = useState({ total: 0, pending: 0, reviewed: 0, offered: 0, accepted: 0, rejected: 0 });

  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getFreelancerApplications({})).unwrap(),
        dispatch(getSavedJobs()).unwrap(),
      ]);
    } catch (e) { console.error(e); }
  }, [dispatch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    setStats({
      total:    applications.length,
      pending:  applications.filter(a => a.status === 'pending').length,
      reviewed: applications.filter(a => a.status === 'reviewed').length,
      offered:  applications.filter(a => a.status === 'offered').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
    });
  }, [applications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleUnsave = (jobId, title) => {
    Alert.alert('Remove Saved Job', `Remove "${title}" from saved?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await dispatch(unsaveJob(jobId)).unwrap();
          fetchData();
        } catch { Alert.alert('Error', 'Could not remove job'); }
      }},
    ]);
  };

  const openJobModal    = (job) => { setSelectedJob(job); setShowJobModal(true); };
  const openClientModal = (job) => { setSelectedJob(job); setShowClientModal(true); };

  const filtered = selectedStatus
    ? applications.filter(a => a.status === selectedStatus)
    : applications;

  const STAT_CARDS = [
    { key: 'total',    label: 'Total',     count: stats.total,    color: GOLD,      icon: 'grid-outline' },
    { key: 'pending',  label: 'Pending',   count: stats.pending,  color: '#C9A84C', icon: 'time-outline' },
    { key: 'reviewed', label: 'Reviewed',  count: stats.reviewed, color: '#7EB8FA', icon: 'eye-outline' },
    { key: 'offered',  label: 'Interview', count: stats.offered,  color: '#34D399', icon: 'star-outline' },
    { key: 'accepted', label: 'Accepted',  count: stats.accepted, color: '#34D399', icon: 'checkmark-circle-outline' },
    { key: 'rejected', label: 'Rejected',  count: stats.rejected, color: '#F87171', icon: 'close-circle-outline' },
  ];

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={onBack}><Ionicons name="arrow-back" size={18} color={TEXT_2} /></TouchableOpacity>
          <Text style={s.headerTitle}>My <Text style={s.gold}>Applications</Text></Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.centerLoading}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={s.loadingText}>Loading applications…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={TEXT_2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My <Text style={s.gold}>Applications</Text></Text>
        <TouchableOpacity style={s.iconBtn} onPress={onRefresh} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={18} color={TEXT_2} />
        </TouchableOpacity>
      </View>

      {/* ── Stats Row ── */}
      <View style={s.statsBorder}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsScroll}>
          {STAT_CARDS.map(sc => (
            <StatCard
              key={sc.key}
              label={sc.label}
              count={sc.count}
              color={sc.color}
              icon={sc.icon}
              active={selectedStatus === sc.key}
              onPress={() => {
                setSelectedStatus(selectedStatus === sc.key ? null : sc.key);
                setActiveTab('Applied');
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Active filter chip ── */}
      {selectedStatus && (
        <View style={s.filterBar}>
          <Ionicons name="funnel-outline" size={13} color={GOLD} />
          <Text style={s.filterText}>Showing: {getStatus(selectedStatus).label}</Text>
          <TouchableOpacity onPress={() => setSelectedStatus(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={GOLD} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Tabs ── */}
      <View style={s.tabRow}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          const badge = tab === 'Applied' ? stats.total : savedJobs.length;
          return (
            <TouchableOpacity
              key={tab}
              style={[s.tab, isActive && s.tabActive]}
              onPress={() => { setActiveTab(tab); setSelectedStatus(null); }}
              activeOpacity={0.75}
            >
              <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab}</Text>
              {badge > 0 && (
                <View style={[s.badge, isActive && s.badgeActive]}>
                  <Text style={[s.badgeText, isActive && s.badgeTextActive]}>{badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
      >
        {activeTab === 'Applied' ? (
          filtered.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="document-text-outline" size={32} color={TEXT_3} />
              </View>
              <Text style={s.emptyTitle}>{selectedStatus ? `No ${getStatus(selectedStatus).label} applications` : 'No applications yet'}</Text>
              <Text style={s.emptyDesc}>{selectedStatus ? 'Try a different filter.' : 'Start applying for jobs to track them here.'}</Text>
              {selectedStatus && (
                <TouchableOpacity style={s.clearBtn} onPress={() => setSelectedStatus(null)}>
                  <Text style={s.clearBtnText}>Clear Filter</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : filtered.map(app => (
            <ApplicationCard
              key={app._id}
              application={app}
              onViewJob={()   => openJobModal(app.job_id)}
              onViewClient={() => openClientModal(app.job_id)}
              onMessage={()   => onNavigate('Messages', { clientId: app.job_id?.client_id?._id })}
            />
          ))
        ) : (
          savedJobs.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="bookmark-outline" size={32} color={TEXT_3} />
              </View>
              <Text style={s.emptyTitle}>No saved jobs</Text>
              <Text style={s.emptyDesc}>Bookmark jobs you're interested in to revisit them later.</Text>
              <TouchableOpacity style={s.clearBtn} onPress={() => onNavigate('BrowseJobs')}>
                <Text style={s.clearBtnText}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          ) : savedJobs.map(job => (
            <SavedJobCard
              key={job._id}
              job={job}
              onViewJob={()    => openJobModal(job)}
              onViewClient={()  => openClientModal(job)}
              onUnsave={()     => handleUnsave(job._id, job.title)}
              onApply={()      => onNavigate('BrowseJobs')}
            />
          ))
        )}
      </ScrollView>

      {/* ── Modals ── */}
      <JobModal
        job={selectedJob}
        visible={showJobModal}
        onClose={() => setShowJobModal(false)}
        onViewClient={() => { setShowJobModal(false); setShowClientModal(true); }}
      />
      <ClientModal
        job={selectedJob}
        visible={showClientModal}
        onClose={() => setShowClientModal(false)}
        onMessage={() => {
          setShowClientModal(false);
          onNavigate('Messages', {
            clientId:   selectedJob?.client_id?._id,
            clientName: `${selectedJob?.client_id?.first_name} ${selectedJob?.client_id?.last_name}`,
          });
        }}
      />
    </SafeAreaView>
  );
}

// ─── Screen-level Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: BG },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  iconBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER_MED },
  headerTitle:  { fontSize: 16, fontWeight: '300', color: TEXT_1, letterSpacing: 0.2 },
  gold:         { color: GOLD, fontStyle: 'italic', fontWeight: '600' },
  statsBorder:  { borderBottomWidth: 1, borderBottomColor: BORDER },
  statsScroll:  { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBar:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(201,168,76,0.07)', borderBottomWidth: 1, borderBottomColor: BORDER },
  filterText:   { flex: 1, fontSize: 12, color: GOLD, fontWeight: '500' },
  tabRow:       { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  tab:          { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 22, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  tabActive:    { backgroundColor: GOLD_LIGHT, borderColor: GOLD_MID },
  tabText:      { fontSize: 13, fontWeight: '600', color: TEXT_3 },
  tabTextActive:{ color: GOLD },
  badge:        { backgroundColor: BORDER_MED, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  badgeActive:  { backgroundColor: GOLD },
  badgeText:    { fontSize: 10, fontWeight: '700', color: TEXT_2 },
  badgeTextActive: { color: BG },
  list:         { padding: 16, paddingBottom: 48 },
  centerLoading:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:  { marginTop: 12, fontSize: 13, color: TEXT_3 },
  empty:        { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: BORDER_MED },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: TEXT_1, marginBottom: 8, textAlign: 'center' },
  emptyDesc:    { fontSize: 13, color: TEXT_3, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  clearBtn:     { backgroundColor: GOLD, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10 },
  clearBtnText: { fontSize: 13, fontWeight: '700', color: BG },
});