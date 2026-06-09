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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getFreelancerApplications,
  getSavedJobs,
  unsaveJob,
} from '../../Redux/slices/applicationSlice';

// Design Tokens
const GREEN       = '#4ADE80';
const GREEN_DARK  = '#22C55E';
const GREEN_SOFT  = '#DCFCE7';
const GREEN_MID   = '#86EFAC';
const WHITE       = '#FFFFFF';
const OFF_WHITE   = '#F0FDF4';
const BORDER      = 'rgba(74,222,128,0.25)';
const TEXT_MAIN   = '#0F2417';
const TEXT_MUTED  = '#6B7280';
const TEXT_LIGHT  = '#9CA3AF';
const BG_GRAY     = '#F9FAFB';

const STATUS = {
  pending:  { bg: `${GREEN_DARK}10`, border: `${GREEN_DARK}30`, text: GREEN_DARK, dot: GREEN_DARK, label: 'Under Review',      icon: 'time-outline' },
  reviewed: { bg: '#60a5fa10',  border: '#60a5fa30', text: '#60a5fa', dot: '#60a5fa', label: 'Reviewed',           icon: 'eye-outline' },
  offered:  { bg: '#34d39910',  border: '#34d39930', text: '#34d399', dot: '#34d399', label: 'Interview / Offer',   icon: 'star-outline' },
  accepted: { bg: '#34d39914',  border: '#34d39945', text: '#34d399', dot: '#34d399', label: 'Accepted',            icon: 'checkmark-circle-outline' },
  rejected: { bg: '#f8717110',  border: '#f8717130', text: '#f87171', dot: '#f87171', label: 'Not Selected',        icon: 'close-circle-outline' },
};
const getStatus = (s) => STATUS[s] || { bg: `${GREEN}15`, border: BORDER, text: TEXT_MUTED, dot: TEXT_LIGHT, label: s || 'Applied', icon: 'document-text-outline' };

const TABS = ['Applied', 'Saved'];

// Helpers
const timeAgo = (ds) => {
  if (!ds) return 'Recently';
  const d = Math.floor((Date.now() - new Date(ds)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7)  return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

const getCategoryIcon = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('design') || t.includes('ui') || t.includes('ux')) return 'brush-outline';
  if (t.includes('dev') || t.includes('react') || t.includes('node') || t.includes('engineer')) return 'code-slash-outline';
  if (t.includes('write') || t.includes('content') || t.includes('copy')) return 'create-outline';
  if (t.includes('market') || t.includes('seo') || t.includes('social')) return 'trending-up-outline';
  if (t.includes('video') || t.includes('edit') || t.includes('motion')) return 'videocam-outline';
  return 'briefcase-outline';
};

const budget = (job) =>
  job?.budget_amount
    ? `₱${Number(job.budget_amount).toLocaleString()}${job.budget_type === 'hourly' ? '/hr' : ''}`
    : '—';

// Sub-components
const Pill = ({ icon, label, color = TEXT_MUTED }) => (
  <View style={pill.wrap}>
    <Ionicons name={icon} size={11} color={color} />
    <Text style={[pill.text, { color }]}>{label}</Text>
  </View>
);

const pill = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: BG_GRAY, borderRadius: 6, borderWidth: 0.5, borderColor: BORDER },
  text:  { fontSize: 11, fontWeight: '500' },
});

const Divider = () => <View style={{ height: 1, backgroundColor: BORDER, marginVertical: 10 }} />;

// Application Card
const ApplicationCard = ({ application, onViewJob, onViewClient, onMessage }) => {
  const job = application.job_id;
  const st  = getStatus(application.status);
  const isOffered = application.status === 'offered';

  return (
    <View style={ac.card}>
      <View style={ac.topRow}>
        <View style={ac.logoBox}>
          <Ionicons name={getCategoryIcon(job?.title)} size={22} color={GREEN_DARK} />
        </View>
        <View style={ac.topMeta}>
          <Text style={ac.jobTitle} numberOfLines={2}>{job?.title || 'Unknown Job'}</Text>
          <TouchableOpacity style={ac.clientRow} onPress={() => onViewClient(job)} activeOpacity={0.7}>
            <Text style={ac.clientName}>{job?.client_id?.company_name || job?.client_id?.first_name || 'Client'}</Text>
            <Ionicons name="chevron-forward" size={11} color={GREEN_DARK} />
          </TouchableOpacity>
        </View>
        <View style={[ac.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
          <View style={[ac.dot, { backgroundColor: st.dot }]} />
          <Text style={[ac.statusText, { color: st.text }]}>{st.label}</Text>
        </View>
      </View>

      <View style={ac.pillRow}>
        <Pill icon="cash-outline"     label={budget(job)}                   color={GREEN_DARK} />
        <Pill icon="location-outline" label={job?.work_setup || 'Remote'}             />
        <Pill icon="calendar-outline" label={`Applied ${timeAgo(application.applied_at)}`} />
      </View>

      {isOffered && (
        <View style={ac.offerBanner}>
          <Ionicons name="star" size={13} color={GREEN_DARK} />
          <Text style={ac.offerText}>You received an offer — check your messages.</Text>
        </View>
      )}

      <Divider />

      <View style={ac.actions}>
        <TouchableOpacity style={ac.btnOutline} onPress={() => onViewJob(job)} activeOpacity={0.75}>
          <Ionicons name="eye-outline" size={13} color={TEXT_MUTED} />
          <Text style={ac.btnOutlineText}>View Job</Text>
        </TouchableOpacity>
        {isOffered ? (
          <TouchableOpacity style={ac.btnGreen} onPress={() => onMessage(job)} activeOpacity={0.85}>
            <Ionicons name="chatbubble-outline" size={13} color={WHITE} />
            <Text style={ac.btnGreenText}>Message Client</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={ac.btnOutline} onPress={() => onViewClient(job)} activeOpacity={0.75}>
            <Ionicons name="person-outline" size={13} color={TEXT_MUTED} />
            <Text style={ac.btnOutlineText}>View Client</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const ac = StyleSheet.create({
  card:       { backgroundColor: WHITE, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  topRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  logoBox:    { width: 42, height: 42, borderRadius: 10, backgroundColor: GREEN_SOFT, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 0.5, borderColor: GREEN_MID },
  topMeta:    { flex: 1, minWidth: 0 },
  jobTitle:   { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, lineHeight: 20, marginBottom: 2 },
  clientRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clientName: { fontSize: 12, color: TEXT_MUTED },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 0.75, flexShrink: 0 },
  dot:        { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  pillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  offerBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN_SOFT, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 4, borderWidth: 0.75, borderColor: GREEN_MID },
  offerText:  { fontSize: 11, color: GREEN_DARK, flex: 1, fontWeight: '500' },
  actions:    { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: BG_GRAY, borderWidth: 0.75, borderColor: BORDER },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  btnGreen:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: GREEN_DARK },
  btnGreenText:{ fontSize: 12, fontWeight: '700', color: WHITE },
});

// Saved Job Card
const SavedJobCard = ({ job, onViewJob, onViewClient, onUnsave, onApply }) => (
  <View style={sj.card}>
    <View style={sj.topRow}>
      <View style={sj.logoBox}>
        <Ionicons name={getCategoryIcon(job.title)} size={22} color={GREEN_DARK} />
      </View>
      <View style={sj.topMeta}>
        <Text style={sj.jobTitle} numberOfLines={2}>{job.title}</Text>
        <TouchableOpacity style={sj.clientRow} onPress={() => onViewClient(job)} activeOpacity={0.7}>
          <Text style={sj.clientName}>{job.client_id?.company_name || job.client_id?.first_name || 'Client'}</Text>
          <Ionicons name="chevron-forward" size={11} color={GREEN_DARK} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onUnsave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
        <Ionicons name="bookmark" size={20} color={GREEN_DARK} />
      </TouchableOpacity>
    </View>

    <View style={sj.pillRow}>
      <Pill icon="cash-outline"     label={budget(job)}                color={GREEN_DARK} />
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
      <TouchableOpacity style={sj.btnOutline} onPress={() => onViewJob(job)} activeOpacity={0.75}>
        <Ionicons name="eye-outline" size={13} color={TEXT_MUTED} />
        <Text style={sj.btnOutlineText}>View Details</Text>
      </TouchableOpacity>
      <TouchableOpacity style={sj.btnGreen} onPress={onApply} activeOpacity={0.85}>
        <Text style={sj.btnGreenText}>Apply Now</Text>
        <Ionicons name="arrow-forward" size={13} color={WHITE} />
      </TouchableOpacity>
    </View>
  </View>
);

const sj = StyleSheet.create({
  card:       { backgroundColor: WHITE, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  topRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  logoBox:    { width: 42, height: 42, borderRadius: 10, backgroundColor: GREEN_SOFT, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 0.5, borderColor: GREEN_MID },
  topMeta:    { flex: 1, minWidth: 0 },
  jobTitle:   { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, lineHeight: 20, marginBottom: 2 },
  clientRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clientName: { fontSize: 12, color: TEXT_MUTED },
  pillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  skillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  skill:      { backgroundColor: GREEN_SOFT, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5, borderColor: GREEN_MID },
  skillText:  { fontSize: 10, color: GREEN_DARK, fontWeight: '500' },
  actions:    { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: BG_GRAY, borderWidth: 0.75, borderColor: BORDER },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  btnGreen:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: GREEN_DARK },
  btnGreenText:{ fontSize: 12, fontWeight: '700', color: WHITE },
});

// Stat Card
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
  card:  { minWidth: 76, backgroundColor: WHITE, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, gap: 3 },
  count: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 9, color: TEXT_LIGHT, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
});

// Job Details Modal
const JobModal = ({ job, visible, onClose, onViewClient }) => {
  if (!job) return null;
  
  const client = job.client_id;
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={md.overlay}>
        <View style={md.sheet}>
          <View style={md.handle} />
          <TouchableOpacity style={md.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={16} color={TEXT_MUTED} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={md.header}>
              <View style={md.logoBox}>
                <Ionicons name={getCategoryIcon(job.title)} size={28} color={GREEN_DARK} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={md.title}>{job.title}</Text>
                <TouchableOpacity style={md.clientRow} onPress={() => onViewClient(job)} activeOpacity={0.7}>
                  <Text style={md.clientName}>{client?.company_name || client?.first_name || 'View Client'}</Text>
                  <Ionicons name="person-circle-outline" size={14} color={GREEN_DARK} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={md.salary}>{budget(job)}</Text>

            <View style={md.metaRow}>
              {[
                { icon: 'location-outline',  label: job.work_setup || 'Remote' },
                { icon: 'briefcase-outline', label: job.job_type || 'Contract' },
                { icon: 'time-outline',      label: `Posted ${timeAgo(job.created_at)}` },
                { icon: 'people-outline',    label: `${job.total_applicants || 0} applicants` },
              ].map(({ icon, label }) => (
                <View key={label} style={md.metaItem}>
                  <Ionicons name={icon} size={12} color={TEXT_LIGHT} />
                  <Text style={md.metaText}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={md.divider} />

            <Text style={md.sectionLabel}>Description</Text>
            <Text style={md.desc}>{job.description || 'No description provided.'}</Text>

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

            <TouchableOpacity style={md.viewClientBtn} onPress={() => onViewClient(job)} activeOpacity={0.8}>
              <Ionicons name="business-outline" size={16} color={GREEN_DARK} />
              <Text style={md.viewClientText}>View Client Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Client Profile Modal
const ClientModal = ({ job, visible, onClose, onMessage }) => {
  if (!job) return null;
  
  const client = job.client_id;
  
  if (!client) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={md.overlay}>
          <View style={md.sheet}>
            <View style={md.handle} />
            <TouchableOpacity style={md.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>
            <View style={s.empty}>
              <Ionicons name="person-outline" size={48} color={TEXT_LIGHT} />
              <Text style={s.emptyTitle}>Client information not available</Text>
              <TouchableOpacity style={s.clearBtn} onPress={onClose}>
                <Text style={s.clearBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={md.overlay}>
        <View style={md.sheet}>
          <View style={md.handle} />
          <TouchableOpacity style={md.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={16} color={TEXT_MUTED} />
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={cm.avatarWrap}>
              <View style={cm.avatar}>
                {client.profile_picture
                  ? <Image source={{ uri: client.profile_picture }} style={cm.avatarImg} />
                  : <Ionicons name="person-outline" size={40} color={GREEN_DARK} />}
              </View>
              <Text style={cm.name}>{client.first_name || ''} {client.last_name || ''}</Text>
              <View style={cm.rolePill}>
                <Ionicons name="business-outline" size={10} color={GREEN_DARK} />
                <Text style={cm.roleText}>Client</Text>
              </View>
            </View>

            <View style={cm.infoCard}>
              {client.company_name && (
                <View style={cm.infoRow}>
                  <View style={cm.infoIconBox}>
                    <Ionicons name="business-outline" size={15} color={GREEN_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cm.infoLabel}>Company</Text>
                    <Text style={cm.infoValue}>{client.company_name}</Text>
                  </View>
                </View>
              )}
              {client.email_address && (
                <View style={cm.infoRow}>
                  <View style={cm.infoIconBox}>
                    <Ionicons name="mail-outline" size={15} color={GREEN_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cm.infoLabel}>Email</Text>
                    <Text style={cm.infoValue}>{client.email_address}</Text>
                  </View>
                </View>
              )}
              {client.phone_number && (
                <View style={cm.infoRow}>
                  <View style={cm.infoIconBox}>
                    <Ionicons name="call-outline" size={15} color={GREEN_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cm.infoLabel}>Phone</Text>
                    <Text style={cm.infoValue}>{client.phone_number}</Text>
                  </View>
                </View>
              )}
              {(client.city || client.country) && (
                <View style={cm.infoRow}>
                  <View style={cm.infoIconBox}>
                    <Ionicons name="location-outline" size={15} color={GREEN_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cm.infoLabel}>Location</Text>
                    <Text style={cm.infoValue}>
                      {[client.city, client.country].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </View>
              )}
              {client.industry && (
                <View style={cm.infoRow}>
                  <View style={cm.infoIconBox}>
                    <Ionicons name="document-text-outline" size={15} color={GREEN_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cm.infoLabel}>Industry</Text>
                    <Text style={cm.infoValue}>{client.industry}</Text>
                  </View>
                </View>
              )}
            </View>

            {client.bio_about_me && (
              <>
                <Text style={md.sectionLabel}>About</Text>
                <Text style={cm.bio}>{client.bio_about_me}</Text>
              </>
            )}

            {client.bio_about && (
              <>
                <Text style={md.sectionLabel}>About</Text>
                <Text style={cm.bio}>{client.bio_about}</Text>
              </>
            )}

            <TouchableOpacity style={cm.msgBtn} onPress={() => onMessage(client)} activeOpacity={0.85}>
              <Ionicons name="chatbubble-outline" size={16} color={WHITE} />
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
  sheet:         { backgroundColor: WHITE, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: '90%', borderTopWidth: 1, borderColor: BORDER },
  handle:        { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  closeBtn:      { position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: OFF_WHITE, alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 0.5, borderColor: BORDER },
  header:        { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  logoBox:       { width: 52, height: 52, borderRadius: 12, backgroundColor: GREEN_SOFT, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 0.5, borderColor: GREEN_MID },
  title:         { fontSize: 17, fontWeight: '800', color: TEXT_MAIN, lineHeight: 23 },
  clientRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clientName:    { fontSize: 12, color: TEXT_MUTED },
  salary:        { fontSize: 22, fontWeight: '800', color: GREEN_DARK, marginBottom: 10, letterSpacing: -0.5 },
  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metaItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:      { fontSize: 12, color: TEXT_MUTED },
  divider:       { height: 1, backgroundColor: BORDER, marginVertical: 14 },
  sectionLabel:  { fontSize: 13, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8, marginTop: 4 },
  desc:          { fontSize: 13, color: TEXT_MUTED, lineHeight: 21, marginBottom: 8 },
  skills:        { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  skillBadge:    { backgroundColor: BG_GRAY, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  skillText:     { fontSize: 12, color: TEXT_MUTED },
  viewClientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN_SOFT, paddingVertical: 13, borderRadius: 12, marginTop: 4, marginBottom: 24, borderWidth: 0.75, borderColor: GREEN_MID },
  viewClientText:{ fontSize: 13, fontWeight: '700', color: GREEN_DARK },
});

const cm = StyleSheet.create({
  avatarWrap:    { alignItems: 'center', marginBottom: 20, marginTop: 4 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN_SOFT, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 2, borderColor: GREEN_MID },
  avatarImg:     { width: 80, height: 80, borderRadius: 40 },
  name:          { fontSize: 20, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6 },
  rolePill:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN_SOFT, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20, borderWidth: 0.75, borderColor: GREEN_MID },
  roleText:      { fontSize: 11, color: GREEN_DARK, fontWeight: '600' },
  infoCard:      { backgroundColor: BG_GRAY, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: BORDER, gap: 12 },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIconBox:   { width: 30, height: 30, borderRadius: 8, backgroundColor: GREEN_SOFT, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 0.5, borderColor: GREEN_MID },
  infoLabel:     { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  infoValue:     { fontSize: 13, color: TEXT_MAIN, fontWeight: '500' },
  bio:           { fontSize: 13, color: TEXT_MUTED, lineHeight: 21, marginBottom: 20 },
  msgBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN_DARK, paddingVertical: 14, borderRadius: 12, marginBottom: 24 },
  msgBtnText:    { fontSize: 14, fontWeight: '700', color: WHITE },
});

// Main Screen
export default function MyApplications({ onNavigate }) {
  const dispatch = useDispatch();
  const { applications, savedJobs, isLoading } = useSelector((s) => s.applications);

  const [activeTab,      setActiveTab]      = useState('Applied');
  const [refreshing,     setRefreshing]     = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showJobModal,   setShowJobModal]   = useState(false);
  const [showClientModal,setShowClientModal]= useState(false);
  const [selectedJob,    setSelectedJob]    = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
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

  const openJobModal = (job) => { 
    setSelectedJob(job); 
    setShowJobModal(true); 
  };
  
  const openClientModal = (job) => { 
    setSelectedJob(job); 
    setSelectedClient(job?.client_id);
    setShowClientModal(true); 
  };
  
  const closeClientModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
  };

  const filtered = selectedStatus
    ? applications.filter(a => a.status === selectedStatus)
    : applications;

  const STAT_CARDS = [
    { key: 'total',    label: 'Total',     count: stats.total,    color: GREEN_DARK,  icon: 'grid-outline' },
    { key: 'pending',  label: 'Pending',   count: stats.pending,  color: GREEN_DARK,  icon: 'time-outline' },
    { key: 'reviewed', label: 'Reviewed',  count: stats.reviewed, color: '#60a5fa',   icon: 'eye-outline' },
    { key: 'offered',  label: 'Interview', count: stats.offered,  color: '#34d399',   icon: 'star-outline' },
    { key: 'accepted', label: 'Accepted',  count: stats.accepted, color: '#34d399',   icon: 'checkmark-circle-outline' },
    { key: 'rejected', label: 'Rejected',  count: stats.rejected, color: '#f87171',   icon: 'close-circle-outline' },
  ];

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={() => onNavigate('FreelancerDashboard')}>
            <View style={s.iconWrap}>
              <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
            </View>
          </TouchableOpacity>
          <Text style={s.headerTitle}>My <Text style={s.green}>Applications</Text></Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.centerLoading}>
          <ActivityIndicator size="large" color={GREEN_DARK} />
          <Text style={s.loadingText}>Loading applications…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
      
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => onNavigate('FreelancerDashboard')} activeOpacity={0.7}>
          <View style={s.iconWrap}>
            <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
          </View>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My <Text style={s.green}>Applications</Text></Text>
        <TouchableOpacity style={s.iconBtn} onPress={onRefresh} activeOpacity={0.7}>
          <View style={s.iconWrap}>
            <Ionicons name="refresh-outline" size={18} color={GREEN_DARK} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
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

      {/* Active filter chip */}
      {selectedStatus && (
        <View style={s.filterBar}>
          <Ionicons name="funnel-outline" size={13} color={GREEN_DARK} />
          <Text style={s.filterText}>Showing: {getStatus(selectedStatus).label}</Text>
          <TouchableOpacity onPress={() => setSelectedStatus(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={GREEN_DARK} />
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
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

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_DARK} />}
      >
        {activeTab === 'Applied' ? (
          filtered.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="document-text-outline" size={32} color={TEXT_LIGHT} />
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
              onViewJob={(job) => openJobModal(job)}
              onViewClient={(job) => openClientModal(job)}
              onMessage={(job) => onNavigate('Messages', { 
                userId: job?.client_id?._id,
                userName: `${job?.client_id?.first_name || ''} ${job?.client_id?.last_name || ''}`,
                userRole: 'client'
              })}
            />
          ))
        ) : (
          savedJobs.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="bookmark-outline" size={32} color={TEXT_LIGHT} />
              </View>
              <Text style={s.emptyTitle}>No saved jobs</Text>
              <Text style={s.emptyDesc}>Bookmark jobs you're interested in to revisit them later.</Text>
              <TouchableOpacity style={s.clearBtn} onPress={() => onNavigate('FreelancerDashboard')}>
                <Text style={s.clearBtnText}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          ) : savedJobs.map(job => (
            <SavedJobCard
              key={job._id}
              job={job}
              onViewJob={(j) => openJobModal(j)}
              onViewClient={(j) => openClientModal(j)}
              onUnsave={() => handleUnsave(job._id, job.title)}
              onApply={() => onNavigate('FreelancerDashboard')}
            />
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <JobModal
        job={selectedJob}
        visible={showJobModal}
        onClose={() => setShowJobModal(false)}
        onViewClient={(job) => {
          setShowJobModal(false);
          openClientModal(job);
        }}
      />
      <ClientModal
        job={selectedJob}
        visible={showClientModal}
        onClose={closeClientModal}
        onMessage={(client) => {
          closeClientModal();
          onNavigate('Messages', { 
            userId: client?._id,
            userName: `${client?.first_name || ''} ${client?.last_name || ''}`,
            userRole: 'client'
          });
        }}
      />
    </SafeAreaView>
  );
}

// Screen-level Styles
const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: OFF_WHITE },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  iconBtn:      { alignSelf: 'flex-start' },
  iconWrap:     { width: 36, height: 36, backgroundColor: WHITE, borderRadius: 10, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle:  { fontSize: 16, fontWeight: '600', color: TEXT_MAIN, letterSpacing: 0.2 },
  green:        { color: GREEN_DARK, fontStyle: 'italic', fontWeight: '700' },
  statsBorder:  { borderBottomWidth: 1, borderBottomColor: BORDER },
  statsScroll:  { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBar:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: GREEN_SOFT, borderBottomWidth: 1, borderBottomColor: BORDER },
  filterText:   { flex: 1, fontSize: 12, color: GREEN_DARK, fontWeight: '500' },
  tabRow:       { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  tab:          { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 22, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  tabActive:    { backgroundColor: GREEN_SOFT, borderColor: GREEN_DARK },
  tabText:      { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  tabTextActive:{ color: GREEN_DARK },
  badge:        { backgroundColor: BORDER, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  badgeActive:  { backgroundColor: GREEN_DARK },
  badgeText:    { fontSize: 10, fontWeight: '700', color: TEXT_MUTED },
  badgeTextActive: { color: WHITE },
  list:         { padding: 16, paddingBottom: 48 },
  centerLoading:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:  { marginTop: 12, fontSize: 13, color: TEXT_MUTED },
  empty:        { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8, textAlign: 'center' },
  emptyDesc:    { fontSize: 13, color: TEXT_LIGHT, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  clearBtn:     { backgroundColor: GREEN_DARK, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10 },
  clearBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },
});