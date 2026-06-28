  import React, { useState, useEffect, useCallback } from 'react';
  import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    Alert, ActivityIndicator, RefreshControl, Image, StatusBar,
    Modal, TextInput, KeyboardAvoidingView, Platform,
  } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { Ionicons } from '@expo/vector-icons';
  import { useDispatch, useSelector } from 'react-redux';
  import { getClientJobs } from '../../Redux/slices/jobSlice';
  import { getClientApplications } from '../../Redux/slices/applicationSlice';

  // ── Design Tokens ──────────────────────────────────────────────────────────────
  const NAVY       = '#071A3E';
  const NAVY2      = '#0D2151';
  const BLUE       = '#0055A5';
  const BLUE_MD    = '#0073CF';
  const BLUE_LT    = '#1E90FF';
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
  const GREEN      = '#059669';
  const GREEN_SOFT = '#D1FAE5';
  const ORANGE     = '#F97316';
  const RED        = '#EF4444';
  // ──────────────────────────────────────────────────────────────────────────────

  const TABS = [
    { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'          },
    { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'        },
    { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline'    },
    { key: 'Message',       label: 'Messages', icon: 'chatbubble',    iconOutline: 'chatbubble-outline'    },
    { key: 'ClientProfile', label: 'Profile',  icon: 'person',        iconOutline: 'person-outline'        },
  ];

  const TABS_FILTER = ['All', 'ongoing', 'completed'];

  // ── Helpers ────────────────────────────────────────────────────────────────────
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-PH', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const calculateProgress = (status) => {
    const map = { pending: 10, reviewed: 20, interview: 40, offered: 60, hired: 75, completed: 100 };
    return map[status] || 0;
  };

  const getStatusLabel = (status) => {
    const map = { pending: 'For Review', reviewed: 'Shortlisted', interview: 'Interview', offered: 'Offer Sent', hired: 'Hired', completed: 'Completed' };
    return map[status] || status;
  };

  const getInitials = (first, last) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  const getAvatarColor = (name) => {
    const colors = [BLUE, BLUE_MD, GOLD, '#60a5fa', '#fbbf24', '#f87171', '#34d399', '#818cf8'];
    return colors[(name?.length || 0) % colors.length];
  };

  // Simulated client updates (replace with real API data)
  const getClientUpdates = (talent) => {
    if (!talent) return [];
    const base = new Date(talent.startDate || Date.now());
    return [
      {
        id: '1',
        type: 'status',
        icon: 'checkmark-circle',
        iconColor: GREEN,
        title: 'Project Started',
        body: `${talent.name} has been hired for "${talent.job}".`,
        time: base.toISOString(),
        isClient: false,
      },
      {
        id: '2',
        type: 'update',
        icon: 'document-text',
        iconColor: BLUE,
        title: 'Work in Progress',
        body: 'Freelancer is actively working on deliverables.',
        time: new Date(base.getTime() + 86400000).toISOString(),
        isClient: false,
      },
      ...(talent.rawStatus === 'completed' ? [{
        id: '3',
        type: 'status',
        icon: 'trophy',
        iconColor: GOLD,
        title: 'Project Completed',
        body: 'All deliverables have been submitted and the project is marked complete.',
        time: new Date(base.getTime() + 172800000).toISOString(),
        isClient: false,
      }] : []),
    ];
  };

  // ── Main Screen ────────────────────────────────────────────────────────────────
  export default function HiredTalentScreen({ onNavigate }) {
    const dispatch = useDispatch();
    const { sentOffers, isLoading: offersLoading } = useSelector((s) => s.offers);
    const { clientJobs } = useSelector((s) => s.jobs.jobs);
    const { applications, isLoading: appsLoading } = useSelector((s) => s.applications);

    const [activeTab, setActiveTab] = useState('All');
    const [activeBottomTab, setActiveBottomTab] = useState('Hiredtalents');
    const [refreshing, setRefreshing] = useState(false);
    const [hiredTalents, setHiredTalents] = useState([]);
    const [selectedTalent, setSelectedTalent] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState('progress');
    const [clientNote, setClientNote] = useState('');
    const [clientUpdates, setClientUpdates] = useState([]);

    const fetchData = useCallback(async () => {
      try {
        setRefreshing(true);
        await Promise.all([
          dispatch(getSentOffers({})).unwrap(),
          dispatch(getClientJobs({})).unwrap(),
          dispatch(getClientApplications({})).unwrap(),
        ]);
      } catch (e) {
        Alert.alert('Error', 'Failed to load hired talents');
      } finally {
        setRefreshing(false);
      }
    }, [dispatch]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
      const hiredApps = (applications || []).filter(a =>
        ['hired', 'offered', 'completed'].includes(a.status)
      );

      const talentsFromApps = hiredApps.map(app => {
        const fl = app.freelancer_id || {};
        const job = app.job_id || {};
        const offer = (sentOffers || []).find(o =>
          o.job_id === job._id && o.freelancer_id === fl._id
        );
        const isCompleted = app.status === 'completed';
        return {
          id: app._id, applicationId: app._id, offerId: offer?._id || null,
          freelancer_id: fl._id,
          name: fl.first_name && fl.last_name ? `${fl.first_name} ${fl.last_name}` : fl.username || 'Freelancer',
          firstName: fl.first_name, lastName: fl.last_name, username: fl.username,
          profilePicture: fl.profile_picture,
          role: fl.skills?.[0] || 'Freelancer',
          job: job.title || 'Project', jobId: job._id, jobDescription: job.description || '',
          amount: offer?.amount || app.proposed_rate || 0,
          status: isCompleted ? 'Completed' : 'Ongoing',
          progress: calculateProgress(app.status),
          hiredDate: formatDate(app.updated_at || app.applied_at),
          skills: fl.skills || [],
          startDate: app.applied_at,
          application: app,
          jobStatus: job.status || 'in_progress',
          statusLabel: getStatusLabel(app.status),
          rawStatus: app.status,
        };
      });

      const hiredOffers = (sentOffers || []).filter(o =>
        ['hired', 'completed', 'accepted'].includes(o.status)
      );
      const offerTalents = hiredOffers
        .filter(o => !talentsFromApps.some(t =>
          t.offerId === o._id || (t.jobId === o.job_id && t.freelancer_id === o.freelancer_id)
        ))
        .map(o => {
          const job = clientJobs?.find(j => j._id === o.job_id);
          const isCompleted = o.status === 'completed';
          return {
            id: o._id, applicationId: null, offerId: o._id, freelancer_id: o.freelancer_id,
            name: o.freelancer_name || `${o.freelancer_first_name || ''} ${o.freelancer_last_name || ''}`.trim() || 'Freelancer',
            firstName: o.freelancer_first_name, lastName: o.freelancer_last_name,
            username: o.freelancer_username, profilePicture: o.freelancer_profile_picture,
            role: o.freelancer_skills?.[0] || 'Freelancer',
            job: o.job_title || job?.title || 'Project', jobId: o.job_id,
            jobDescription: job?.description || '', amount: o.amount || 0,
            status: isCompleted ? 'Completed' : 'Ongoing',
            progress: isCompleted ? 100 : 60,
            hiredDate: formatDate(o.responded_at || o.created_at),
            skills: o.freelancer_skills || [], startDate: o.created_at,
            application: null, jobStatus: job?.status || 'in_progress',
            statusLabel: isCompleted ? 'Completed' : 'Hired', rawStatus: o.status,
          };
        });

      const all = [...talentsFromApps, ...offerTalents];
      const unique = all.filter((t, i, s) =>
        i === s.findIndex(x => x.freelancer_id === t.freelancer_id && x.jobId === t.jobId)
      );
      setHiredTalents(unique);
    }, [applications, sentOffers, clientJobs]);

    const onRefresh = useCallback(async () => { await fetchData(); }, [fetchData]);

    const handleTabPress = (key) => {
      setActiveBottomTab(key);
      if (key !== 'Hiredtalents') onNavigate(key === 'Home' ? 'ClientDashboard' : key);
    };

    const handleTalentPress = (talent) => {
      setSelectedTalent(talent);
      setClientUpdates(getClientUpdates(talent));
      setActiveDetailTab('progress');
      setClientNote('');
      setShowDetailModal(true);
    };

    const handleSendNote = () => {
      if (!clientNote.trim()) return;
      const newUpdate = {
        id: Date.now().toString(),
        type: 'client_note',
        icon: 'person-circle',
        iconColor: NAVY,
        title: 'You added an update',
        body: clientNote.trim(),
        time: new Date().toISOString(),
        isClient: true,
      };
      setClientUpdates(prev => [...prev, newUpdate]);
      setClientNote('');
    };

    const handleMessage = (id, name) => {
      setShowDetailModal(false);
      onNavigate('Messages', { userId: id, userName: name, userRole: 'freelancer' });
    };

    const handleMarkCompleted = async (offerId, applicationId) => {
      Alert.alert('Complete Project', 'Mark this project as completed?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete', onPress: async () => {
            try {
              if (offerId) await dispatch(updateOfferStatus({ offerId, status: 'completed' })).unwrap();
              Alert.alert('Done', 'Project marked as completed.');
              await fetchData();
              setShowDetailModal(false);
            } catch {
              Alert.alert('Error', 'Failed to update status.');
            }
          },
        },
      ]);
    };

    const getStatusSteps = (app) => {
      const steps = app
        ? [
            { key: 'pending',   label: 'Application Received' },
            { key: 'reviewed',  label: 'Shortlisted' },
            { key: 'interview', label: 'Interview' },
            { key: 'offered',   label: 'Offer Sent' },
            { key: 'hired',     label: 'Hired' },
            { key: 'completed', label: 'Completed' },
          ]
        : [
            { key: 'offered',   label: 'Offer Sent' },
            { key: 'hired',     label: 'Hired' },
            { key: 'ongoing',   label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
          ];
      const currentIndex = steps.findIndex(s => s.key === (app?.status || 'ongoing'));
      return steps.map((s, i) => ({
        ...s,
        completed: app?.status === 'completed' ? true : i <= currentIndex,
        active: i === currentIndex && app?.status !== 'completed',
      }));
    };

    const filteredTalents = hiredTalents.filter(t =>
      activeTab === 'All' ? true :
      activeTab === 'ongoing' ? t.status === 'Ongoing' : t.status === 'Completed'
    );

    const totalHired  = hiredTalents.length;
    const ongoingCnt  = hiredTalents.filter(t => t.status === 'Ongoing').length;
    const completedCnt= hiredTalents.filter(t => t.status === 'Completed').length;
    const totalSpent  = hiredTalents.reduce((s, t) => s + (t.amount || 0), 0);

    const isLoading = (offersLoading || appsLoading) && !refreshing && hiredTalents.length === 0;

    // ── Shared bottom bar ──────────────────────────────────────────────────────
    const BottomBar = () => (
      <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
        <View style={styles.tabBar}>
          {TABS.map(tab => {
            const active = activeBottomTab === tab.key;
            const isPost = tab.key === 'PostJob';
            return (
              <TouchableOpacity key={tab.key} style={styles.tabItem} onPress={() => handleTabPress(tab.key)} activeOpacity={0.7}>
                {active && <View style={styles.tabActiveBar} />}
                {isPost ? (
                  <View style={styles.tabFab}>
                    <Ionicons name={active ? tab.icon : tab.iconOutline} size={22} color={WHITE} />
                  </View>
                ) : (
                  <View style={styles.tabIconWrap}>
                    <Ionicons name={active ? tab.icon : tab.iconOutline} size={23} color={active ? BLUE : TEXT_LIGHT} />
                  </View>
                )}
                <Text style={[styles.tabLabel, active && styles.tabLabelActive, isPost && styles.tabLabelPost]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    );

    if (isLoading) {
      return (
        <SafeAreaView style={styles.safe} edges={['top']}>
          <StatusBar barStyle="light-content" backgroundColor={NAVY} />
          <View style={styles.topbar}>
            <TouchableOpacity onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
              <View style={styles.backIconWrap}><Ionicons name="arrow-back" size={18} color={WHITE} /></View>
            </TouchableOpacity>
            <Text style={styles.topbarTitle}>Hired Talent</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.loadingText}>Loading hired talents…</Text>
          </View>
          <BottomBar />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.root}>

          {/* Top Bar */}
          <View style={styles.topbar}>
            <TouchableOpacity onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
              <View style={styles.backIconWrap}><Ionicons name="arrow-back" size={18} color={WHITE} /></View>
            </TouchableOpacity>
            <Text style={styles.topbarTitle}>Hired Talent</Text>
            <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
              <View style={styles.refreshIconWrap}><Ionicons name="refresh-outline" size={18} color={BLUE} /></View>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Total', value: totalHired, color: TEXT_MAIN },
              { label: 'Ongoing', value: ongoingCnt, color: BLUE },
              { label: 'Completed', value: completedCnt, color: GREEN },
              { label: 'Spent', value: `₱${totalSpent.toLocaleString()}`, color: GOLD, small: true },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: s.color, fontSize: s.small ? 15 : 22 }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterRow}>
            {TABS_FILTER.map(tab => {
              const label = tab === 'All' ? 'All' : tab === 'ongoing' ? 'Ongoing' : 'Completed';
              const count = tab === 'All' ? totalHired : tab === 'ongoing' ? ongoingCnt : completedCnt;
              const active = activeTab === tab;
              return (
                <TouchableOpacity key={tab} style={[styles.filterTab, active && styles.filterTabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
                  <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{label}</Text>
                  <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
          >
            {filteredTalents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="people-outline" size={40} color={BLUE} />
                </View>
                <Text style={styles.emptyTitle}>No hired talents yet</Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'All'
                    ? "You haven't hired anyone yet. Browse freelancers to get started."
                    : `No ${activeTab === 'ongoing' ? 'ongoing' : 'completed'} projects right now.`}
                </Text>
                <TouchableOpacity style={styles.browseBtn} onPress={() => onNavigate('FindFreelancers')}>
                  <Ionicons name="search-outline" size={16} color={WHITE} style={{ marginRight: 6 }} />
                  <Text style={styles.browseBtnText}>Browse Freelancers</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredTalents.map(item => {
                const avatarColor = getAvatarColor(item.name);
                const initials = getInitials(item.firstName, item.lastName);
                const isOngoing = item.status === 'Ongoing';

                return (
                  <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.88} onPress={() => handleTalentPress(item)}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View style={[styles.avatar, { backgroundColor: `${avatarColor}18` }]}>
                        {item.profilePicture
                          ? <Image source={{ uri: item.profilePicture }} style={styles.avatarImage} />
                          : <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>}
                      </View>
                      <View style={styles.headerInfo}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.role} numberOfLines={1}>{item.role}</Text>
                      </View>
                      <View style={[styles.statusBadge, isOngoing ? styles.statusBadgeOngoing : styles.statusBadgeCompleted]}>
                        {isOngoing
                          ? <View style={styles.ongoingDot} />
                          : <Ionicons name="checkmark-circle" size={11} color={GREEN} />}
                        <Text style={[styles.statusBadgeText, { color: isOngoing ? BLUE : GREEN }]}>
                          {isOngoing ? 'Ongoing' : 'Completed'}
                        </Text>
                      </View>
                    </View>

                    {/* Job Row */}
                    <View style={styles.jobRow}>
                      <Ionicons name="briefcase-outline" size={12} color={TEXT_LIGHT} />
                      <Text style={styles.jobText} numberOfLines={1}>{item.job}</Text>
                      <Text style={styles.amount}>₱{item.amount?.toLocaleString()}</Text>
                    </View>

                    {/* Progress Section — visible directly on card */}
                    <View style={styles.cardProgressWrap}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={[styles.progressPct, { color: item.progress >= 75 ? GREEN : BLUE }]}>
                          {item.progress}%
                        </Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${item.progress}%`, backgroundColor: item.progress >= 75 ? GREEN : BLUE },
                          ]}
                        />
                      </View>
                      {/* Mini milestone dots */}
                      <View style={styles.milestonesRow}>
                        {[
                          { label: 'Received', pct: 10 },
                          { label: 'Shortlisted', pct: 20 },
                          { label: 'Interview', pct: 40 },
                          { label: 'Offered', pct: 60 },
                          { label: 'Hired', pct: 75 },
                          { label: 'Done', pct: 100 },
                        ].map(m => (
                          <View key={m.label} style={styles.milestoneItem}>
                            <View style={[
                              styles.milestoneDot,
                              item.progress >= m.pct && { backgroundColor: item.progress >= 75 ? GREEN : BLUE, borderColor: 'transparent' },
                            ]} />
                            <Text style={[
                              styles.milestoneLabel,
                              item.progress >= m.pct && { color: item.progress >= 75 ? GREEN : BLUE, fontWeight: '600' },
                            ]} numberOfLines={1}>{m.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Skills */}
                    {item.skills?.length > 0 && (
                      <View style={styles.skillsRow}>
                        {item.skills.slice(0, 3).map((sk, i) => (
                          <View key={i} style={styles.skillChip}>
                            <Text style={styles.skillText}>{sk}</Text>
                          </View>
                        ))}
                        {item.skills.length > 3 && (
                          <Text style={styles.moreSkills}>+{item.skills.length - 3} more</Text>
                        )}
                      </View>
                    )}

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                      <View style={styles.footerLeft}>
                        <Ionicons name="calendar-outline" size={11} color={TEXT_LIGHT} />
                        <Text style={styles.hiredDate}>Hired {item.hiredDate}</Text>
                      </View>
                      <View style={styles.footerActions}>
                        {isOngoing && (
                          <TouchableOpacity style={styles.completeBtn} onPress={() => handleMarkCompleted(item.offerId, item.applicationId)}>
                            <Ionicons name="checkmark-done-outline" size={12} color={GREEN} />
                            <Text style={styles.completeBtnText}>Complete</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.msgBtn} onPress={() => handleMessage(item.freelancer_id, item.name)}>
                          <Ionicons name="chatbubble-outline" size={12} color={BLUE} />
                          <Text style={styles.msgBtnText}>Message</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <BottomBar />
        </View>

        {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
        <Modal animationType="slide" transparent visible={showDetailModal} onRequestClose={() => setShowDetailModal(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
              <View style={styles.modalContainer}>
                {/* Handle */}
                <View style={styles.modalHandle} />

                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDetailModal(false)}>
                    <Ionicons name="close" size={20} color={TEXT_MAIN} />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Project Details</Text>
                  <View style={{ width: 36 }} />
                </View>

                {selectedTalent && (
                  <>
                    {/* Profile Strip */}
                    <View style={styles.profileStrip}>
                      <View style={[styles.modalAvatar, { backgroundColor: `${getAvatarColor(selectedTalent.name)}18` }]}>
                        {selectedTalent.profilePicture
                          ? <Image source={{ uri: selectedTalent.profilePicture }} style={styles.modalAvatarImg} />
                          : <Text style={[styles.modalAvatarText, { color: getAvatarColor(selectedTalent.name) }]}>
                              {getInitials(selectedTalent.firstName, selectedTalent.lastName)}
                            </Text>}
                      </View>
                      <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{selectedTalent.name}</Text>
                        <Text style={styles.profileRole}>{selectedTalent.role}</Text>
                      </View>
                      <View style={styles.profileRight}>
                        <Text style={styles.profileAmount}>₱{selectedTalent.amount?.toLocaleString()}</Text>
                        <Text style={styles.profileAmountLabel}>Project value</Text>
                      </View>
                    </View>

                    {/* Modal Tabs */}
                    <View style={styles.modalTabRow}>
                      {[
                        { key: 'progress', label: 'Progress', icon: 'bar-chart-outline' },
                        { key: 'updates',  label: 'Updates',  icon: 'newspaper-outline' },
                      ].map(t => {
                        const active = activeDetailTab === t.key;
                        return (
                          <TouchableOpacity key={t.key} style={[styles.modalTab, active && styles.modalTabActive]} onPress={() => setActiveDetailTab(t.key)}>
                            <Ionicons name={t.icon} size={14} color={active ? BLUE : TEXT_MUTED} />
                            <Text style={[styles.modalTabText, active && styles.modalTabTextActive]}>{t.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

                      {/* ── Progress Tab ── */}
                      {activeDetailTab === 'progress' && (
                        <>
                          {/* Project Info */}
                          <View style={styles.infoCard}>
                            <Text style={styles.infoCardTitle}>{selectedTalent.job}</Text>
                            {selectedTalent.jobDescription ? (
                              <Text style={styles.infoCardDesc}>{selectedTalent.jobDescription}</Text>
                            ) : null}
                            <View style={styles.infoCardMeta}>
                              <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={12} color={TEXT_LIGHT} />
                                <Text style={styles.metaText}>Started {selectedTalent.hiredDate}</Text>
                              </View>
                              <View style={[styles.statusPill, selectedTalent.status === 'Completed' ? styles.pillGreen : styles.pillBlue]}>
                                <Text style={[styles.pillText, { color: selectedTalent.status === 'Completed' ? GREEN : BLUE }]}>
                                  {selectedTalent.statusLabel}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Big Progress Bar */}
                          <View style={styles.progressCard}>
                            <View style={styles.progressCardHeader}>
                              <Text style={styles.sectionTitle}>Overall Progress</Text>
                              <Text style={[styles.progressBigPct, { color: selectedTalent.progress >= 75 ? GREEN : BLUE }]}>
                                {selectedTalent.progress}%
                              </Text>
                            </View>
                            <View style={styles.bigProgressTrack}>
                              <View style={[
                                styles.bigProgressFill,
                                { width: `${selectedTalent.progress}%`, backgroundColor: selectedTalent.progress >= 75 ? GREEN : BLUE },
                              ]} />
                            </View>
                          </View>

                          {/* Timeline */}
                          <View style={styles.timelineCard}>
                            <Text style={styles.sectionTitle}>Hiring Journey</Text>
                            {getStatusSteps(selectedTalent.application).map((step, index, arr) => (
                              <View key={step.key} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                  <View style={[
                                    styles.timelineDot,
                                    step.completed && styles.timelineDotCompleted,
                                    step.active && styles.timelineDotActive,
                                  ]}>
                                    {step.completed
                                      ? <Ionicons name="checkmark" size={9} color={WHITE} />
                                      : step.active
                                      ? <View style={styles.dotInnerPulse} />
                                      : null}
                                  </View>
                                  {index < arr.length - 1 && (
                                    <View style={[styles.timelineLine, step.completed && styles.timelineLineCompleted]} />
                                  )}
                                </View>
                                <View style={styles.timelineRight}>
                                  <Text style={[styles.timelineLabel, step.completed && styles.timelineLabelCompleted, step.active && { color: BLUE }]}>
                                    {step.label}
                                  </Text>
                                  {step.active && (
                                    <View style={styles.activePill}>
                                      <Text style={styles.activePillText}>Current stage</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>

                          {/* Actions */}
                          {selectedTalent.status === 'Ongoing' && (
                            <View style={styles.actionRow}>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnComplete]}
                                onPress={() => handleMarkCompleted(selectedTalent.offerId, selectedTalent.applicationId)}
                              >
                                <Ionicons name="checkmark-done-outline" size={16} color={WHITE} />
                                <Text style={styles.actionBtnTextWhite}>Mark Complete</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnMsg]}
                                onPress={() => handleMessage(selectedTalent.freelancer_id, selectedTalent.name)}
                              >
                                <Ionicons name="chatbubble-outline" size={16} color={BLUE} />
                                <Text style={[styles.actionBtnTextWhite, { color: BLUE }]}>Message</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </>
                      )}

                      {/* ── Updates Tab ── */}
                      {activeDetailTab === 'updates' && (
                        <>
                          {clientUpdates.length === 0 ? (
                            <View style={styles.noUpdates}>
                              <Ionicons name="newspaper-outline" size={36} color={TEXT_LIGHT} />
                              <Text style={styles.noUpdatesText}>No updates yet</Text>
                            </View>
                          ) : (
                            clientUpdates.map(upd => (
                              <View key={upd.id} style={[styles.updateCard, upd.isClient && styles.updateCardClient]}>
                                <View style={[styles.updateIconWrap, { backgroundColor: `${upd.iconColor}15` }]}>
                                  <Ionicons name={upd.icon} size={18} color={upd.iconColor} />
                                </View>
                                <View style={styles.updateContent}>
                                  <View style={styles.updateTopRow}>
                                    <Text style={styles.updateTitle}>{upd.title}</Text>
                                    {upd.isClient && (
                                      <View style={styles.youBadge}><Text style={styles.youBadgeText}>You</Text></View>
                                    )}
                                  </View>
                                  <Text style={styles.updateBody}>{upd.body}</Text>
                                  <Text style={styles.updateTime}>
                                    {formatDate(upd.time)} · {formatTime(upd.time)}
                                  </Text>
                                </View>
                              </View>
                            ))
                          )}

                          {/* Client note input */}
                          <View style={styles.noteInputWrap}>
                            <Text style={styles.noteInputLabel}>Add an update</Text>
                            <View style={styles.noteRow}>
                              <TextInput
                                style={styles.noteInput}
                                placeholder="e.g. Approved initial draft…"
                                placeholderTextColor={TEXT_LIGHT}
                                value={clientNote}
                                onChangeText={setClientNote}
                                multiline
                                maxLength={300}
                              />
                              <TouchableOpacity
                                style={[styles.sendBtn, !clientNote.trim() && styles.sendBtnDisabled]}
                                onPress={handleSendNote}
                                disabled={!clientNote.trim()}
                              >
                                <Ionicons name="send" size={16} color={WHITE} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </>
                      )}
                    </ScrollView>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── Styles ─────────────────────────────────────────────────────────────────────
  const styles = StyleSheet.create({
    safe:  { flex: 1, backgroundColor: BG },
    root:  { flex: 1, backgroundColor: BG },

    // Top bar
    topbar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14, backgroundColor: NAVY,
    },
    backIconWrap: {
      width: 38, height: 38, borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },
    refreshIconWrap: {
      width: 38, height: 38, borderRadius: 11,
      backgroundColor: 'rgba(0,104,181,0.1)',
      borderWidth: 1, borderColor: 'rgba(0,104,181,0.25)',
      alignItems: 'center', justifyContent: 'center',
    },
    topbarTitle: { fontSize: 17, fontWeight: '700', color: WHITE, letterSpacing: -0.2 },

    // Stats
    statsRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    statItem:    { flex: 1, alignItems: 'center', gap: 2 },
    statNum:     { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    statLabel:   { fontSize: 10, color: TEXT_MUTED, fontWeight: '500', letterSpacing: 0.2 },
    statDivider: { width: 1, height: 32, backgroundColor: BORDER },

    // Filter tabs
    filterRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 10,
      backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 8,
    },
    filterTab: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1, borderColor: BORDER,
      backgroundColor: BG,
    },
    filterTabActive:  { backgroundColor: `${BLUE}0D`, borderColor: BLUE },
    filterTabText:    { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
    filterTabTextActive: { color: BLUE, fontWeight: '700' },
    filterBadge:      { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    filterBadgeActive:{ backgroundColor: `${BLUE}20` },
    filterBadgeText:  { fontSize: 10, color: TEXT_MUTED, fontWeight: '600' },
    filterBadgeTextActive: { color: BLUE },

    scroll: { padding: 14, paddingBottom: 40 },

    // Empty
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText:     { marginTop: 12, fontSize: 13, color: TEXT_MUTED },
    emptyContainer:  { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
    emptyIconWrap:   { width: 72, height: 72, backgroundColor: `${BLUE}10`, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle:      { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8, textAlign: 'center' },
    emptyText:       { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    browseBtn:       { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    browseBtnText:   { fontSize: 13, fontWeight: '600', color: WHITE },

    // Card
    card: {
      backgroundColor: CARD, borderRadius: 16, padding: 14, marginBottom: 12,
      borderWidth: 1, borderColor: BORDER,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },

    // Card header
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar:      { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    avatarImage: { width: 46, height: 46, borderRadius: 23 },
    avatarText:  { fontSize: 15, fontWeight: '700' },
    headerInfo:  { flex: 1 },
    name:        { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
    role:        { fontSize: 11, color: TEXT_MUTED },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
    statusBadgeOngoing:   { backgroundColor: `${BLUE}0D`, borderColor: `${BLUE}30` },
    statusBadgeCompleted: { backgroundColor: `${GREEN}0D`, borderColor: `${GREEN}30` },
    statusBadgeText: { fontSize: 10, fontWeight: '700' },
    ongoingDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: BLUE },

    // Job row
    jobRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
    jobText:  { flex: 1, fontSize: 12, color: TEXT_MUTED },
    amount:   { fontSize: 14, fontWeight: '800', color: BLUE },

    // Card progress
    cardProgressWrap: { marginBottom: 12 },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel:    { fontSize: 10, color: TEXT_MUTED, letterSpacing: 0.4, fontWeight: '600', textTransform: 'uppercase' },
    progressPct:      { fontSize: 11, fontWeight: '800' },
    progressTrack:    { height: 7, backgroundColor: BORDER, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressFill:     { height: 7, borderRadius: 4 },
    milestonesRow:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    milestoneItem:    { alignItems: 'center', flex: 1 },
    milestoneDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: BORDER, borderWidth: 1.5, borderColor: BORDER, marginBottom: 3 },
    milestoneLabel:   { fontSize: 8, color: TEXT_LIGHT, textAlign: 'center' },

    // Skills
    skillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    skillChip:  { paddingHorizontal: 9, paddingVertical: 4, backgroundColor: `${BLUE}0A`, borderRadius: 7, borderWidth: 0.5, borderColor: `${BLUE}20` },
    skillText:  { fontSize: 10, color: BLUE, fontWeight: '500' },
    moreSkills: { fontSize: 10, color: TEXT_LIGHT, alignSelf: 'center' },

    // Card footer
    cardFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    hiredDate:    { fontSize: 10, color: TEXT_LIGHT },
    footerActions:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
    completeBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: `${GREEN}30`, backgroundColor: `${GREEN}0D` },
    completeBtnText: { fontSize: 11, fontWeight: '600', color: GREEN },
    msgBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: `${BLUE}30`, backgroundColor: `${BLUE}0D` },
    msgBtnText:   { fontSize: 11, fontWeight: '600', color: BLUE },

    // Bottom Tab Bar
    tabSafe:  { backgroundColor: WHITE },
    tabBar:   { flexDirection: 'row', backgroundColor: WHITE, borderTopWidth: 1.5, borderTopColor: BORDER, paddingTop: 6, paddingBottom: 4, paddingHorizontal: 8 },
    tabItem:  { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 4, position: 'relative' },
    tabActiveBar: { position: 'absolute', top: 0, width: 24, height: 3, backgroundColor: BLUE, borderRadius: 999 },
    tabIconWrap:  { marginBottom: 3, marginTop: 6 },
    tabFab:   { width: 44, height: 36, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 3, marginTop: 2, shadowColor: GOLD_DK, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 5, elevation: 3, borderWidth: 1, borderColor: GOLD_LT },
    tabLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
    tabLabelActive: { color: BLUE, fontWeight: '700' },
    tabLabelPost:   { color: GOLD, fontWeight: '700' },

    // Modal
    modalOverlay:   { flex: 1, backgroundColor: 'rgba(7,26,62,0.5)' },
    modalContainer: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', minHeight: '80%' },
    modalHandle:    { width: 36, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 2 },
    modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
    modalCloseBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
    modalTitle:     { fontSize: 16, fontWeight: '700', color: TEXT_MAIN },

    // Profile Strip
    profileStrip: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 12 },
    modalAvatar:   { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    modalAvatarImg:{ width: 52, height: 52, borderRadius: 26 },
    modalAvatarText: { fontSize: 20, fontWeight: '700' },
    profileInfo:   { flex: 1 },
    profileName:   { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
    profileRole:   { fontSize: 12, color: TEXT_MUTED },
    profileRight:  { alignItems: 'flex-end' },
    profileAmount: { fontSize: 16, fontWeight: '800', color: BLUE },
    profileAmountLabel: { fontSize: 10, color: TEXT_MUTED, marginTop: 2 },

    // Modal Tabs
    modalTabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
    modalTab:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: BG },
    modalTabActive:    { backgroundColor: `${BLUE}0D`, borderColor: BLUE },
    modalTabText:      { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
    modalTabTextActive:{ color: BLUE },

    // Info card
    infoCard:      { backgroundColor: BG, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
    infoCardTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6 },
    infoCardDesc:  { fontSize: 12, color: TEXT_MUTED, lineHeight: 18, marginBottom: 10 },
    infoCardMeta:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    metaItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText:      { fontSize: 11, color: TEXT_LIGHT },
    statusPill:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
    pillGreen:     { backgroundColor: `${GREEN}0D`, borderColor: `${GREEN}30` },
    pillBlue:      { backgroundColor: `${BLUE}0D`, borderColor: `${BLUE}30` },
    pillText:      { fontSize: 11, fontWeight: '700' },

    // Progress card
    progressCard:       { backgroundColor: BG, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
    progressCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle:       { fontSize: 13, fontWeight: '700', color: TEXT_MAIN },
    progressBigPct:     { fontSize: 18, fontWeight: '800' },
    bigProgressTrack:   { height: 10, backgroundColor: BORDER, borderRadius: 5, overflow: 'hidden' },
    bigProgressFill:    { height: 10, borderRadius: 5 },

    // Timeline
    timelineCard:      { backgroundColor: BG, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
    timelineItem:      { flexDirection: 'row', marginBottom: 0 },
    timelineLeft:      { width: 22, alignItems: 'center', marginRight: 12 },
    timelineDot:       { width: 20, height: 20, borderRadius: 10, backgroundColor: WHITE, borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
    timelineDotCompleted: { backgroundColor: GREEN, borderColor: GREEN },
    timelineDotActive:    { backgroundColor: BLUE, borderColor: BLUE },
    dotInnerPulse:     { width: 6, height: 6, borderRadius: 3, backgroundColor: WHITE },
    timelineLine:      { width: 2, height: 24, backgroundColor: BORDER, marginVertical: 3 },
    timelineLineCompleted: { backgroundColor: GREEN },
    timelineRight:     { flex: 1, paddingTop: 2, paddingBottom: 24 },
    timelineLabel:     { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
    timelineLabelCompleted: { color: TEXT_MAIN, fontWeight: '600' },
    activePill:        { alignSelf: 'flex-start', backgroundColor: `${BLUE}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
    activePillText:    { fontSize: 9, color: BLUE, fontWeight: '700' },

    // Action buttons
    actionRow:     { flexDirection: 'row', gap: 10, marginTop: 8 },
    actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
    actionBtnComplete:  { backgroundColor: GREEN, borderColor: GREEN },
    actionBtnMsg:       { backgroundColor: `${BLUE}0D`, borderColor: `${BLUE}30` },
    actionBtnTextWhite: { fontSize: 13, fontWeight: '700', color: WHITE },

    // Updates
    noUpdates:     { alignItems: 'center', paddingVertical: 32, gap: 10 },
    noUpdatesText: { fontSize: 13, color: TEXT_LIGHT },
    updateCard:    { flexDirection: 'row', gap: 12, backgroundColor: BG, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
    updateCardClient: { backgroundColor: `${NAVY}05`, borderColor: `${NAVY}15` },
    updateIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    updateContent:  { flex: 1 },
    updateTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    updateTitle:    { fontSize: 12, fontWeight: '700', color: TEXT_MAIN, flex: 1 },
    youBadge:       { backgroundColor: NAVY, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    youBadgeText:   { fontSize: 9, fontWeight: '700', color: WHITE },
    updateBody:     { fontSize: 12, color: TEXT_MUTED, lineHeight: 18, marginBottom: 4 },
    updateTime:     { fontSize: 10, color: TEXT_LIGHT },

    // Note input
    noteInputWrap:  { marginTop: 16 },
    noteInputLabel: { fontSize: 12, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8 },
    noteRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    noteInput:      { flex: 1, backgroundColor: BG, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: TEXT_MAIN, minHeight: 44, maxHeight: 100 },
    sendBtn:        { width: 42, height: 42, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
    sendBtnDisabled:{ backgroundColor: BORDER },
  });