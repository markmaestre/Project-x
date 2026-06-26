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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getFreelancerApplications,
  getSavedJobs,
  unsaveJob,
} from '../../Redux/slices/applicationSlice';

// ── Vantara Design tokens ──────────────────────────────────────────────────────────
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
const BG_GRAY    = '#F9FAFB';
const RED        = '#DC2626';
const RED_SOFT   = '#FEF2F2';
// ─────────────────────────────────────────────────────────────────────────────────

const STATUS = {
  pending:  { bg: `${BLUE}10`, border: `${BLUE}30`, text: BLUE, dot: BLUE, label: 'Under Review',      icon: 'time-outline' },
  reviewed: { bg: '#60a5fa10',  border: '#60a5fa30', text: '#60a5fa', dot: '#60a5fa', label: 'Reviewed',           icon: 'eye-outline' },
  interview: { bg: `${GOLD}10`,  border: `${GOLD}30`, text: GOLD_DK, dot: GOLD_DK, label: 'Interview',   icon: 'calendar-outline' },
  offered:  { bg: `${GOLD}10`,  border: `${GOLD}30`, text: GOLD_DK, dot: GOLD_DK, label: 'Offer Sent',   icon: 'gift-outline' },
  accepted: { bg: `${GREEN}14`, border: `${GREEN}45`, text: GREEN, dot: GREEN, label: 'Accepted',            icon: 'checkmark-circle-outline' },
  hired:    { bg: `${GREEN}14`, border: `${GREEN}45`, text: GREEN, dot: GREEN, label: 'Hired',            icon: 'checkmark-circle-outline' },
  rejected: { bg: '#f8717110',  border: '#f8717130', text: '#f87171', dot: '#f87171', label: 'Not Selected',        icon: 'close-circle-outline' },
};
const getStatus = (s) => STATUS[s] || { bg: `${BLUE}15`, border: BORDER, text: TEXT_MUTED, dot: TEXT_LIGHT, label: s || 'Applied', icon: 'document-text-outline' };

const TABS = ['Applied', 'Saved'];

// ── Status Timeline Component with Interview Details ──
const StatusTimeline = ({ history, currentStatus, interviewDetails }) => {
  const STATUS_ICONS = {
    pending: 'time-outline',
    reviewed: 'eye-outline',
    interview: 'calendar-outline',
    offered: 'gift-outline',
    accepted: 'checkmark-circle-outline',
    hired: 'checkmark-done-circle-outline',
    rejected: 'close-circle-outline',
  };

  const STATUS_COLORS = {
    pending: '#0055A5',
    reviewed: '#60a5fa',
    interview: '#C89520',
    offered: '#f59e0b',
    accepted: '#059669',
    hired: '#10b981',
    rejected: '#f87171',
  };

  const STATUS_LABELS = {
    pending: 'Application Submitted',
    reviewed: 'Shortlisted',
    interview: 'Interview Scheduled',
    offered: 'Offer Sent',
    accepted: 'Accepted',
    hired: 'Hired',
    rejected: 'Not Selected',
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open the meeting link');
      });
    }
  };

  if (!history || history.length === 0) {
    const color = STATUS_COLORS[currentStatus] || '#0055A5';
    const label = STATUS_LABELS[currentStatus] || currentStatus || 'Pending';
    const icon = STATUS_ICONS[currentStatus] || 'ellipse-outline';
    
    return (
      <View style={tl.container}>
        <View style={tl.timelineItem}>
          <View style={[tl.dot, { backgroundColor: color }]}>
            <Ionicons name={icon} size={12} color="#fff" />
          </View>
          <View style={tl.timelineContent}>
            <Text style={tl.statusLabel}>{label}</Text>
            <Text style={tl.statusDate}>Current Status</Text>
          </View>
        </View>
      </View>
    );
  }

  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.changed_at) - new Date(b.changed_at)
  );

  return (
    <View style={tl.container}>
      {sortedHistory.map((item, index) => {
        const isLast = index === sortedHistory.length - 1;
        const status = item.status;
        const color = STATUS_COLORS[status] || '#0055A5';
        const icon = STATUS_ICONS[status] || 'ellipse-outline';
        const label = STATUS_LABELS[status] || status;
        
        const isInterview = status === 'interview' && item.interview_details;
        const isOffer = status === 'offered' && item.offer_details;

        return (
          <View key={index} style={tl.timelineItem}>
            {!isLast && <View style={[tl.timelineLine, { backgroundColor: color }]} />}
            
            <View style={[tl.dot, { backgroundColor: color }]}>
              <Ionicons name={icon} size={12} color="#fff" />
            </View>
            
            <View style={tl.timelineContent}>
              <Text style={tl.statusLabel}>{label}</Text>
              <Text style={tl.statusDate}>{formatDate(item.changed_at)}</Text>
              
              {isInterview && item.interview_details && (
                <View style={tl.detailBox}>
                  <View style={tl.detailRow}>
                    <Ionicons name="calendar-outline" size={12} color={STATUS_COLORS.interview} />
                    <Text style={tl.detailText}>
                      📅 {formatDate(item.interview_details.scheduled_date)}
                    </Text>
                  </View>
                  {item.interview_details.meeting_link && (
                    <TouchableOpacity 
                      style={tl.detailRow} 
                      onPress={() => handleOpenLink(item.interview_details.meeting_link)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="link-outline" size={12} color={BLUE} />
                      <Text style={[tl.detailText, { color: BLUE, textDecorationLine: 'underline' }]} numberOfLines={1}>
                        {item.interview_details.meeting_link}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {item.interview_details.notes && (
                    <View style={tl.detailRow}>
                      <Ionicons name="document-text-outline" size={12} color={STATUS_COLORS.interview} />
                      <Text style={tl.detailText} numberOfLines={3}>
                        📝 {item.interview_details.notes}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              {isOffer && item.offer_details && (
                <View style={tl.detailBox}>
                  <View style={tl.detailRow}>
                    <Ionicons name="cash-outline" size={12} color={STATUS_COLORS.offered} />
                    <Text style={[tl.detailText, { fontWeight: 'bold', color: STATUS_COLORS.offered }]}>
                      ₱{Number(item.offer_details.amount).toLocaleString()}
                    </Text>
                  </View>
                  {item.offer_details.message && (
                    <View style={tl.detailRow}>
                      <Ionicons name="chatbubble-outline" size={12} color={STATUS_COLORS.offered} />
                      <Text style={tl.detailText} numberOfLines={2}>
                        {item.offer_details.message}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              {item.note && !isInterview && !isOffer && (
                <Text style={tl.noteText}>{item.note}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const tl = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 30,
    bottom: 0,
    width: 2,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#071A3E',
    marginBottom: 2,
  },
  statusDate: {
    fontSize: 11,
    color: '#7A90A8',
    marginBottom: 4,
  },
  detailBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#C8D8E8',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#3A5070',
    flex: 1,
  },
  noteText: {
    fontSize: 12,
    color: '#7A90A8',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

// ── Bottom Tab Bar ─────────────────
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

const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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

// Application Card - UPDATED with Interview Details
const ApplicationCard = ({ application, onViewJob, onViewClient, onMessage, onViewTimeline }) => {
  const job = application.job_id;
  const st  = getStatus(application.status);
  const isOffered = application.status === 'offered' || application.status === 'interview';
  const hasHistory = application.status_history && application.status_history.length > 0;
  
  // Get interview details from application
  const interviewDetails = application.interview_details || 
                          (application.status_history?.find(h => h.status === 'interview')?.interview_details);

  return (
    <TouchableOpacity 
      style={ac.card} 
      onPress={() => onViewTimeline(application)}
      activeOpacity={0.7}
    >
      <View style={ac.topRow}>
        <View style={ac.logoBox}>
          <Ionicons name={getCategoryIcon(job?.title)} size={22} color={BLUE} />
        </View>
        <View style={ac.topMeta}>
          <Text style={ac.jobTitle} numberOfLines={2}>{job?.title || 'Unknown Job'}</Text>
          <TouchableOpacity style={ac.clientRow} onPress={() => onViewClient(job)} activeOpacity={0.7}>
            <Text style={ac.clientName}>
              {job?.client_id?.company_name || job?.client_id?.first_name || 'Client'}
            </Text>
            <Ionicons name="chevron-forward" size={11} color={BLUE} />
          </TouchableOpacity>
        </View>
        <View style={[ac.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
          <View style={[ac.dot, { backgroundColor: st.dot }]} />
          <Text style={[ac.statusText, { color: st.text }]}>{st.label}</Text>
        </View>
      </View>

      <View style={ac.pillRow}>
        <Pill icon="cash-outline"     label={budget(job)}                   color={GOLD_DK} />
        <Pill icon="location-outline" label={job?.work_setup || 'Remote'}             />
        <Pill icon="calendar-outline" label={`Applied ${timeAgo(application.applied_at)}`} />
      </View>

      {/* Show Interview Details if status is interview */}
      {application.status === 'interview' && interviewDetails && (
        <View style={ac.interviewBanner}>
          <Ionicons name="calendar-outline" size={14} color={GOLD_DK} />
          <View style={ac.interviewContent}>
            <Text style={ac.interviewTitle}>Interview Scheduled</Text>
            <Text style={ac.interviewDate}>
              {formatDate(interviewDetails.scheduled_date || interviewDetails.interview_date)}
            </Text>
            {interviewDetails.meeting_link && (
              <TouchableOpacity 
                onPress={() => Linking.openURL(interviewDetails.meeting_link)}
                activeOpacity={0.7}
              >
                <Text style={ac.interviewLink} numberOfLines={1}>
                  🔗 {interviewDetails.meeting_link}
                </Text>
              </TouchableOpacity>
            )}
            {interviewDetails.notes && (
              <Text style={ac.interviewNotes} numberOfLines={2}>
                📝 {interviewDetails.notes}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* View History Button */}
      <TouchableOpacity 
        style={ac.historyBtn} 
        onPress={() => onViewTimeline(application)}
        activeOpacity={0.7}
      >
        <Ionicons name="time-outline" size={14} color={BLUE} />
        <Text style={ac.historyBtnText}>
          {hasHistory ? `View Status History (${application.status_history.length} updates)` : 'View Status History'}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={BLUE} />
      </TouchableOpacity>

      {isOffered && application.status !== 'interview' && (
        <View style={ac.offerBanner}>
          <Ionicons name="star" size={13} color={GOLD_DK} />
          <Text style={ac.offerText}>
            You received an offer — check your messages.
          </Text>
        </View>
      )}

      <Divider />

      <View style={ac.actions}>
        <TouchableOpacity style={ac.btnOutline} onPress={() => onViewJob(job)} activeOpacity={0.75}>
          <Ionicons name="eye-outline" size={13} color={TEXT_MUTED} />
          <Text style={ac.btnOutlineText}>View Job</Text>
        </TouchableOpacity>
        {isOffered ? (
          <TouchableOpacity style={ac.btnBlue} onPress={() => onMessage(job)} activeOpacity={0.85}>
            <Ionicons name="chatbubble-outline" size={13} color={WHITE} />
            <Text style={ac.btnBlueText}>Message Client</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={ac.btnOutline} onPress={() => onViewClient(job)} activeOpacity={0.75}>
            <Ionicons name="person-outline" size={13} color={TEXT_MUTED} />
            <Text style={ac.btnOutlineText}>View Client</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ac = StyleSheet.create({
  card:       { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  topRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  logoBox:    { width: 42, height: 42, borderRadius: 10, backgroundColor: 'rgba(0,104,181,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 0.5, borderColor: 'rgba(0,104,181,0.2)' },
  topMeta:    { flex: 1, minWidth: 0 },
  jobTitle:   { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, lineHeight: 20, marginBottom: 2 },
  clientRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clientName: { fontSize: 12, color: TEXT_MUTED },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 0.75, flexShrink: 0 },
  dot:        { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  pillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  interviewBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(200,149,32,0.08)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(200,149,32,0.2)',
  },
  interviewContent: {
    flex: 1,
  },
  interviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD_DK,
    marginBottom: 2,
  },
  interviewDate: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  interviewLink: {
    fontSize: 11,
    color: BLUE,
    textDecorationLine: 'underline',
    marginBottom: 2,
  },
  interviewNotes: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,104,181,0.05)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0,104,181,0.15)',
    marginBottom: 8,
  },
  historyBtnText: {
    fontSize: 12,
    color: BLUE,
    fontWeight: '600',
    flex: 1,
  },
  offerBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(200,149,32,0.08)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 4, borderWidth: 0.75, borderColor: 'rgba(200,149,32,0.2)' },
  offerText:  { fontSize: 11, color: GOLD_DK, flex: 1, fontWeight: '500' },
  actions:    { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: BG_GRAY, borderWidth: 0.75, borderColor: BORDER },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  btnBlue:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: BLUE, shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 2 },
  btnBlueText:{ fontSize: 12, fontWeight: '700', color: WHITE },
});

// Saved Job Card - FIXED
const SavedJobCard = ({ job, onViewJob, onViewClient, onUnsave, onApply }) => {
  const client = job?.client_id;
  const clientName = client?.company_name || client?.first_name || 'Client';
  
  return (
    <View style={sj.card}>
      <View style={sj.topRow}>
        <View style={sj.logoBox}>
          <Ionicons name={getCategoryIcon(job?.title || '')} size={22} color={BLUE} />
        </View>
        <View style={sj.topMeta}>
          <Text style={sj.jobTitle} numberOfLines={2}>{job?.title || 'Unknown Job'}</Text>
          <TouchableOpacity style={sj.clientRow} onPress={() => onViewClient(job)} activeOpacity={0.7}>
            <Text style={sj.clientName}>{clientName}</Text>
            <Ionicons name="chevron-forward" size={11} color={BLUE} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onUnsave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <Ionicons name="bookmark" size={20} color={GOLD_DK} />
        </TouchableOpacity>
      </View>

      <View style={sj.pillRow}>
        <Pill icon="cash-outline" label={budget(job)} color={GOLD_DK} />
        <Pill icon="location-outline" label={job?.work_setup || 'Remote'} />
      </View>

      {job?.required_skills?.length > 0 && (
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
        <TouchableOpacity style={sj.btnBlue} onPress={onApply} activeOpacity={0.85}>
          <Text style={sj.btnBlueText}>Apply Now</Text>
          <Ionicons name="arrow-forward" size={13} color={WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const sj = StyleSheet.create({
  card:       { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  topRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  logoBox:    { width: 42, height: 42, borderRadius: 10, backgroundColor: 'rgba(0,104,181,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 0.5, borderColor: 'rgba(0,104,181,0.2)' },
  topMeta:    { flex: 1, minWidth: 0 },
  jobTitle:   { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, lineHeight: 20, marginBottom: 2 },
  clientRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clientName: { fontSize: 12, color: TEXT_MUTED },
  pillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  skillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  skill:      { backgroundColor: 'rgba(0,104,181,0.08)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(0,104,181,0.2)' },
  skillText:  { fontSize: 10, color: BLUE, fontWeight: '500' },
  actions:    { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: BG_GRAY, borderWidth: 0.75, borderColor: BORDER },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  btnBlue:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: BLUE, shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 2 },
  btnBlueText:{ fontSize: 12, fontWeight: '700', color: WHITE },
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
  card:  { minWidth: 76, backgroundColor: CARD, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1.5, gap: 3 },
  count: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 9, color: TEXT_LIGHT, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
});

// ── Timeline Modal ──
const TimelineModal = ({ application, visible, onClose }) => {
  if (!application) return null;
  
  // Get interview details from application
  const interviewDetails = application.interview_details || 
                          (application.status_history?.find(h => h.status === 'interview')?.interview_details);
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={md.overlay}>
        <View style={[md.sheet, { maxHeight: '85%' }]}>
          <View style={md.handle} />
          <View style={md.header}>
            <Text style={md.title}>Application Status History</Text>
            <TouchableOpacity style={md.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
            <View style={tm.jobInfo}>
              <Text style={tm.jobTitle}>{application.job_id?.title || 'Unknown Job'}</Text>
              <View style={tm.statusRow}>
                <View style={[tm.statusBadge, { backgroundColor: getStatus(application.status).bg, borderColor: getStatus(application.status).border }]}>
                  <View style={[tm.statusDot, { backgroundColor: getStatus(application.status).dot }]} />
                  <Text style={[tm.statusText, { color: getStatus(application.status).text }]}>
                    {getStatus(application.status).label}
                  </Text>
                </View>
                <Text style={tm.appliedDate}>Applied {timeAgo(application.applied_at)}</Text>
              </View>
            </View>
            
            {/* Show Interview Details at the top if status is interview */}
            {application.status === 'interview' && interviewDetails && (
              <View style={tm.interviewSection}>
                <Text style={tm.sectionTitle}>📅 Interview Details</Text>
                <View style={tm.interviewCard}>
                  <View style={tm.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={GOLD_DK} />
                    <Text style={tm.detailText}>
                      {formatDate(interviewDetails.scheduled_date || interviewDetails.interview_date)}
                    </Text>
                  </View>
                  {interviewDetails.meeting_link && (
                    <TouchableOpacity 
                      style={tm.detailRow} 
                      onPress={() => Linking.openURL(interviewDetails.meeting_link)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="link-outline" size={16} color={BLUE} />
                      <Text style={[tm.detailText, { color: BLUE, textDecorationLine: 'underline' }]}>
                        {interviewDetails.meeting_link}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {interviewDetails.notes && (
                    <View style={tm.detailRow}>
                      <Ionicons name="document-text-outline" size={16} color={TEXT_MUTED} />
                      <Text style={tm.detailText}>{interviewDetails.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            <StatusTimeline 
              history={application.status_history} 
              currentStatus={application.status}
              interviewDetails={interviewDetails}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const tm = StyleSheet.create({
  jobInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  appliedDate: {
    fontSize: 12,
    color: TEXT_LIGHT,
  },
  interviewSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
  },
  interviewCard: {
    backgroundColor: 'rgba(200,149,32,0.05)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(200,149,32,0.2)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: TEXT_MUTED,
    flex: 1,
  },
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
                <Ionicons name={getCategoryIcon(job.title)} size={28} color={BLUE} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={md.title}>{job.title}</Text>
                <TouchableOpacity style={md.clientRow} onPress={() => onViewClient(job)} activeOpacity={0.7}>
                  <Text style={md.clientName}>
                    {client?.company_name || client?.first_name || 'View Client'}
                  </Text>
                  <Ionicons name="person-circle-outline" size={14} color={BLUE} />
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
              <Ionicons name="business-outline" size={16} color={BLUE} />
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
              <Text style={s.emptyTitle}>Client Information Unavailable</Text>
              <Text style={s.emptyDesc}>The client details are not available at this time.</Text>
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
                  : <Ionicons name="person-outline" size={40} color={BLUE} />}
              </View>
              <Text style={cm.name}>{client.first_name || ''} {client.last_name || ''}</Text>
              <View style={cm.rolePill}>
                <Ionicons name="business-outline" size={10} color={BLUE} />
                <Text style={cm.roleText}>Client</Text>
              </View>
            </View>

            <View style={cm.infoCard}>
              {client.company_name && (
                <View style={cm.infoRow}>
                  <View style={cm.infoIconBox}>
                    <Ionicons name="business-outline" size={15} color={BLUE} />
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
                    <Ionicons name="mail-outline" size={15} color={BLUE} />
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
                    <Ionicons name="call-outline" size={15} color={BLUE} />
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
                    <Ionicons name="location-outline" size={15} color={BLUE} />
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
                    <Ionicons name="document-text-outline" size={15} color={BLUE} />
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
  overlay:       { flex: 1, backgroundColor: 'rgba(7,26,62,0.55)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: WHITE, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: '90%', borderTopWidth: 1.5, borderColor: BORDER },
  handle:        { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  closeBtn:      { position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 0.5, borderColor: BORDER },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  title:         { fontSize: 17, fontWeight: '700', color: TEXT_MAIN },
  logoBox:       { width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(0,104,181,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 0.5, borderColor: 'rgba(0,104,181,0.2)' },
  clientRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clientName:    { fontSize: 12, color: TEXT_MUTED },
  salary:        { fontSize: 22, fontWeight: '800', color: GOLD_DK, marginBottom: 10, letterSpacing: -0.5 },
  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metaItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:      { fontSize: 12, color: TEXT_MUTED },
  divider:       { height: 1.5, backgroundColor: BORDER, marginVertical: 14 },
  sectionLabel:  { fontSize: 13, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8, marginTop: 4 },
  desc:          { fontSize: 13, color: TEXT_MUTED, lineHeight: 21, marginBottom: 8 },
  skills:        { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  skillBadge:    { backgroundColor: BG_GRAY, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 8, borderWidth: 1.5, borderColor: BORDER },
  skillText:     { fontSize: 12, color: TEXT_MUTED },
  viewClientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,104,181,0.08)', paddingVertical: 13, borderRadius: 12, marginTop: 4, marginBottom: 24, borderWidth: 0.75, borderColor: 'rgba(0,104,181,0.2)' },
  viewClientText:{ fontSize: 13, fontWeight: '700', color: BLUE },
});

const cm = StyleSheet.create({
  avatarWrap:    { alignItems: 'center', marginBottom: 20, marginTop: 4 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,104,181,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 2, borderColor: 'rgba(0,104,181,0.2)' },
  avatarImg:     { width: 80, height: 80, borderRadius: 40 },
  name:          { fontSize: 20, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6 },
  rolePill:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,104,181,0.08)', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20, borderWidth: 0.75, borderColor: 'rgba(0,104,181,0.2)' },
  roleText:      { fontSize: 11, color: BLUE, fontWeight: '600' },
  infoCard:      { backgroundColor: BG_GRAY, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1.5, borderColor: BORDER, gap: 12 },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIconBox:   { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(0,104,181,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 0.5, borderColor: 'rgba(0,104,181,0.2)' },
  infoLabel:     { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  infoValue:     { fontSize: 13, color: TEXT_MAIN, fontWeight: '500' },
  bio:           { fontSize: 13, color: TEXT_MUTED, lineHeight: 21, marginBottom: 20 },
  msgBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, marginBottom: 24, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 3 },
  msgBtnText:    { fontSize: 14, fontWeight: '700', color: WHITE },
});

// Main Screen
export default function MyApplications({ onNavigate, route }) {
  const dispatch = useDispatch();
  const { applications, savedJobs, isLoading } = useSelector((s) => s.applications);

  const [activeTab,      setActiveTab]      = useState('Applied');
  const [refreshing,     setRefreshing]     = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showJobModal,   setShowJobModal]   = useState(false);
  const [showClientModal,setShowClientModal]= useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedJob,    setSelectedJob]    = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [stats,          setStats]          = useState({ total: 0, pending: 0, reviewed: 0, interview: 0, offered: 0, accepted: 0, hired: 0, rejected: 0 });

  useEffect(() => {
    if (route?.params?.returnState?.activeTab) {
      setActiveTab(route.params.returnState.activeTab);
    }
  }, [route?.params]);

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching applications and saved jobs...');
      
      const [appsResult, savedResult] = await Promise.all([
        dispatch(getFreelancerApplications({})).unwrap(),
        dispatch(getSavedJobs()).unwrap(),
      ]);
      
      console.log('Applications loaded:', appsResult?.applications?.length || 0);
      console.log('Saved jobs loaded:', savedResult?.savedJobs?.length || 0);
      
    } catch (e) { 
      console.error('Error fetching data:', e);
    }
  }, [dispatch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    setStats({
      total:    applications.length,
      pending:  applications.filter(a => a.status === 'pending').length,
      reviewed: applications.filter(a => a.status === 'reviewed').length,
      interview: applications.filter(a => a.status === 'interview').length,
      offered:  applications.filter(a => a.status === 'offered').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      hired:    applications.filter(a => a.status === 'hired').length,
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
    setShowClientModal(true); 
  };
  
  const closeClientModal = () => {
    setShowClientModal(false);
    setSelectedJob(null);
  };

  const openTimelineModal = (application) => {
    setSelectedApplication(application);
    setShowTimelineModal(true);
  };

  const closeTimelineModal = () => {
    setShowTimelineModal(false);
    setSelectedApplication(null);
  };

  const handleTabBarPress = (key) => {
    const returnState = { activeTab };
    if (key === 'FreelancerDashboard') {
      onNavigate('FreelancerDashboard', { returnState });
    } else if (key === 'Messages') {
      onNavigate('Messages', { returnState });
    } else if (key === 'MyJobs') {
      onNavigate('MyJobs', { returnState });
    } else if (key === 'Profile') {
      onNavigate('FreelancerProfile', { returnState });
    } else if (key === 'MyApplications') {
      // Already on MyApplications
    }
  };

  const filtered = selectedStatus
    ? applications.filter(a => a.status === selectedStatus)
    : applications;

  const STAT_CARDS = [
    { key: 'total',    label: 'Total',     count: stats.total,    color: BLUE,  icon: 'grid-outline' },
    { key: 'pending',  label: 'Pending',   count: stats.pending,  color: BLUE,  icon: 'time-outline' },
    { key: 'reviewed', label: 'Reviewed',  count: stats.reviewed, color: '#60a5fa',   icon: 'eye-outline' },
    { key: 'interview', label: 'Interview', count: stats.interview, color: GOLD_DK,   icon: 'calendar-outline' },
    { key: 'offered',  label: 'Offers',    count: stats.offered,  color: '#f59e0b',   icon: 'gift-outline' },
    { key: 'accepted', label: 'Accepted',  count: stats.accepted, color: GREEN,   icon: 'checkmark-circle-outline' },
    { key: 'hired',    label: 'Hired',     count: stats.hired,    color: '#10b981', icon: 'checkmark-done-circle-outline' },
    { key: 'rejected', label: 'Rejected',  count: stats.rejected, color: '#f87171',   icon: 'close-circle-outline' },
  ];

  const pendingOffers = stats.interview + stats.offered;

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={s.root}>
          <View style={s.header}>
            <TouchableOpacity style={s.iconBtn} onPress={() => onNavigate('FreelancerDashboard')}>
              <View style={s.iconWrap}>
                <Ionicons name="arrow-back" size={18} color={WHITE} />
              </View>
            </TouchableOpacity>
            <Text style={s.headerTitle}>My <Text style={s.blue}>Applications</Text></Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={s.centerLoading}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={s.loadingText}>Loading applications…</Text>
          </View>
        </View>
        <BottomTabBar 
          activeTab="MyApplications" 
          onTabPress={handleTabBarPress} 
          pendingOffers={pendingOffers}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={s.root}>
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={() => onNavigate('FreelancerDashboard')} activeOpacity={0.7}>
            <View style={s.iconWrap}>
              <Ionicons name="arrow-back" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={s.headerTitle}>My <Text style={s.blue}>Applications</Text></Text>
          <TouchableOpacity style={s.receivedOffersBtn} onPress={() => onNavigate('ReceivedOffers', { returnState: { activeTab } })} activeOpacity={0.7}>
            <View style={s.receivedOffersIconWrap}>
              <Ionicons name="archive-outline" size={18} color={GOLD_LT} />
              {pendingOffers > 0 && (
                <View style={s.receivedOffersBadge}>
                  <Text style={s.receivedOffersBadgeText}>{pendingOffers}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

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

        {selectedStatus && (
          <View style={s.filterBar}>
            <Ionicons name="funnel-outline" size={13} color={BLUE} />
            <Text style={s.filterText}>Showing: {getStatus(selectedStatus).label}</Text>
            <TouchableOpacity onPress={() => setSelectedStatus(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={BLUE} />
            </TouchableOpacity>
          </View>
        )}

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
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
                  userRole: 'client',
                  returnState: { activeTab }
                })}
                onViewTimeline={(app) => openTimelineModal(app)}
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
      </View>

      <BottomTabBar 
        activeTab="MyApplications" 
        onTabPress={handleTabBarPress} 
        pendingOffers={pendingOffers}
      />

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
            userRole: 'client',
            returnState: { activeTab }
          });
        }}
      />

      <TimelineModal
        application={selectedApplication}
        visible={showTimelineModal}
        onClose={closeTimelineModal}
      />
    </SafeAreaView>
  );
}

// Screen-level Styles
const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: NAVY },
  root:         { flex: 1, backgroundColor: BG },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: NAVY },
  iconBtn:      { alignSelf: 'flex-start' },
  iconWrap:     { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  receivedOffersBtn: { alignSelf: 'flex-start' },
  receivedOffersIconWrap: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  receivedOffersBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: GOLD, borderRadius: 12, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: NAVY },
  receivedOffersBadgeText: { fontSize: 10, fontWeight: '800', color: WHITE },
  headerTitle:  { fontSize: 16, fontWeight: '600', color: WHITE, letterSpacing: 0.2 },
  blue:        { color: GOLD_LT, fontStyle: 'italic', fontWeight: '700' },
  statsBorder:  { backgroundColor: CARD, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  statsScroll:  { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBar:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0,104,181,0.08)', borderBottomWidth: 1.5, borderBottomColor: BORDER },
  filterText:   { flex: 1, fontSize: 12, color: BLUE, fontWeight: '500' },
  tabRow:       { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10, backgroundColor: CARD, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  tab:          { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 22, backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  tabActive:    { backgroundColor: BLUE, borderColor: BLUE },
  tabText:      { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  tabTextActive:{ color: WHITE },
  badge:        { backgroundColor: BORDER, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  badgeActive:  { backgroundColor: WHITE },
  badgeText:    { fontSize: 10, fontWeight: '700', color: TEXT_MUTED },
  badgeTextActive: { color: BLUE },
  list:         { padding: 16, paddingBottom: 80 },
  centerLoading:{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },
  loadingText:  { marginTop: 12, fontSize: 13, color: TEXT_MUTED },
  empty:        { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8, textAlign: 'center' },
  emptyDesc:    { fontSize: 13, color: TEXT_LIGHT, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  clearBtn:     { backgroundColor: BLUE, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 2 },
  clearBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },

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

const styles = s;