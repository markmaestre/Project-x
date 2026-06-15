import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, RefreshControl, Image, StatusBar,
  Modal, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getSentOffers, updateOfferStatus } from '../../Redux/slices/offerSlice';
import { getClientJobs } from '../../Redux/slices/jobSlice';

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
const ORANGE     = '#F97316';
const RED        = '#EF4444';
// ─────────────────────────────────────────────────────────────────────────────────

// ── Bottom tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'          },
  { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'        },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline'    },
  { key: 'Message',       label: 'Messages', icon: 'chatbubble',    iconOutline: 'chatbubble-outline'    },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',        iconOutline: 'person-outline'        },
];

const TABS_FILTER = ['All', 'accepted', 'completed'];

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper function to calculate progress
const calculateProgress = (createdAt, updatedAt, status) => {
  if (status === 'completed') return 100;
  if (status === 'accepted') {
    const created = new Date(createdAt);
    const now = new Date();
    const daysElapsed = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    const progress = Math.min(Math.floor((daysElapsed / 30) * 100), 95);
    return progress;
  }
  return 0;
};

// Get initials from name
const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

// Generate random color based on name
const getAvatarColor = (name) => {
  const colors = [BLUE, BLUE_MD, GOLD, '#60a5fa', '#fbbf24', '#f87171', '#34d399', '#818cf8', '#f472b6'];
  const index = name?.length % colors.length || 0;
  return colors[index];
};

// Mock milestones data (replace with actual API data)
const getMockMilestones = (freelancerId, jobId) => {
  return [
    {
      id: '1',
      title: 'Project Planning & Requirements',
      description: 'Initial project scope definition and requirements gathering',
      status: 'completed',
      completedDate: '2024-01-15',
      deliverables: ['Project plan document', 'Requirements specification'],
    },
    {
      id: '2',
      title: 'Design Phase',
      description: 'UI/UX design and wireframes creation',
      status: 'completed',
      completedDate: '2024-01-25',
      deliverables: ['Wireframes', 'Design mockups', 'Style guide'],
    },
    {
      id: '3',
      title: 'Development Sprint 1',
      description: 'Core functionality implementation',
      status: 'in_progress',
      completedDate: null,
      deliverables: [],
    },
    {
      id: '4',
      title: 'Testing & QA',
      description: 'Quality assurance and bug fixes',
      status: 'pending',
      completedDate: null,
      deliverables: [],
    },
    {
      id: '5',
      title: 'Deployment & Launch',
      description: 'Final deployment to production',
      status: 'pending',
      completedDate: null,
      deliverables: [],
    },
  ];
};

// Mock payment history
const getMockPayments = (freelancerId, jobId) => {
  return [
    { id: '1', amount: 15000, date: '2024-01-10', status: 'completed', type: 'Initial Deposit' },
    { id: '2', amount: 25000, date: '2024-01-25', status: 'completed', type: 'Milestone Payment' },
    { id: '3', amount: 25000, date: '2024-02-10', status: 'pending', type: 'Milestone Payment' },
    { id: '4', amount: 15000, date: '2024-02-25', status: 'pending', type: 'Final Payment' },
  ];
};

// Mock project updates
const getMockUpdates = (freelancerId, jobId) => {
  return [
    { id: '1', date: '2024-01-20', message: 'Initial designs completed and ready for review', type: 'update', sender: 'freelancer' },
    { id: '2', date: '2024-01-22', message: 'Design feedback received, making adjustments', type: 'update', sender: 'freelancer' },
    { id: '3', date: '2024-01-28', message: 'Development started, backend API integration in progress', type: 'update', sender: 'freelancer' },
    { id: '4', date: '2024-02-01', message: 'First milestone completed, payment requested', type: 'payment', sender: 'system' },
  ];
};

export default function HiredTalentScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { sentOffers, isLoading: offersLoading } = useSelector((state) => state.offers);
  const { clientJobs } = useSelector((state) => state.jobs.jobs);
  
  const [activeTab, setActiveTab] = useState('All');
  const [activeBottomTab, setActiveBottomTab] = useState('Hiredtalents');
  const [refreshing, setRefreshing] = useState(false);
  const [hiredTalents, setHiredTalents] = useState([]);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [payments, setPayments] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [activeDetailTab, setActiveDetailTab] = useState('progress');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getSentOffers({})).unwrap(),
        dispatch(getClientJobs({})).unwrap(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load hired talents');
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process accepted offers into hired talents
  useEffect(() => {
    if (sentOffers && sentOffers.length > 0) {
      const acceptedOffers = sentOffers.filter(offer => 
        offer.status === 'accepted' || offer.status === 'completed'
      );
      
      const talents = acceptedOffers.map(offer => {
        const job = clientJobs?.find(j => j._id === offer.job_id);
        
        return {
          id: offer._id,
          freelancer_id: offer.freelancer_id,
          name: offer.freelancer_name,
          firstName: offer.freelancer_first_name,
          lastName: offer.freelancer_last_name,
          username: offer.freelancer_username,
          profilePicture: offer.freelancer_profile_picture,
          role: offer.freelancer_skills?.[0] || 'Freelancer',
          job: offer.job_title,
          jobId: offer.job_id,
          jobDescription: job?.description || '',
          amount: offer.amount,
          status: offer.status === 'accepted' ? 'Ongoing' : 'Completed',
          progress: calculateProgress(offer.created_at, offer.updated_at, offer.status),
          hired: formatDate(offer.responded_at || offer.created_at),
          message: offer.message,
          skills: offer.freelancer_skills,
          startDate: offer.created_at,
          expectedEndDate: offer.expected_end_date || null,
        };
      });
      
      setHiredTalents(talents);
    }
  }, [sentOffers, clientJobs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Handle bottom tab navigation
  const handleTabPress = (key) => {
    setActiveBottomTab(key);
    if (key === 'Home') onNavigate('ClientDashboard');
    if (key === 'PostJob') onNavigate('PostJob');
    if (key === 'Hiredtalents') onNavigate('Hiredtalents');
    if (key === 'Message') onNavigate('Message');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  // Handle freelancer card press - show detailed modal
  const handleTalentPress = (talent) => {
    setSelectedTalent(talent);
    // Load mock data (replace with actual API calls)
    setMilestones(getMockMilestones(talent.freelancer_id, talent.jobId));
    setPayments(getMockPayments(talent.freelancer_id, talent.jobId));
    setUpdates(getMockUpdates(talent.freelancer_id, talent.jobId));
    setShowDetailModal(true);
  };

  // Filter based on active tab
  const filteredTalents = hiredTalents.filter((talent) =>
    activeTab === 'All' ? true : 
    activeTab === 'accepted' ? talent.status === 'Ongoing' : talent.status === 'Completed'
  );

  // Statistics
  const totalHired = hiredTalents.length;
  const ongoingCount = hiredTalents.filter(t => t.status === 'Ongoing').length;
  const completedCount = hiredTalents.filter(t => t.status === 'Completed').length;
  const totalSpent = hiredTalents.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Handle message freelancer
  const handleMessage = (freelancerId, freelancerName) => {
    setShowDetailModal(false);
    onNavigate('Messages', { 
      userId: freelancerId, 
      userName: freelancerName,
      userRole: 'freelancer'
    });
  };

  // Handle view project details
  const handleViewProject = (jobId) => {
    setShowDetailModal(false);
    onNavigate('JobDetails', { jobId });
  };

  // Handle mark as completed
  const handleMarkCompleted = (offerId) => {
    Alert.alert(
      'Complete Project',
      'Are you sure you want to mark this project as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await dispatch(updateOfferStatus({ offerId, status: 'completed' })).unwrap();
              Alert.alert('Success', 'Project marked as completed');
              fetchData();
              setShowDetailModal(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to update project status');
            }
          }
        }
      ]
    );
  };

  // Render milestone item
  const renderMilestone = ({ item, index }) => {
    const getStatusIcon = () => {
      switch (item.status) {
        case 'completed':
          return <Ionicons name="checkmark-circle" size={20} color={GREEN} />;
        case 'in_progress':
          return <Ionicons name="radio-button-on" size={20} color={BLUE} />;
        default:
          return <Ionicons name="ellipse-outline" size={20} color={TEXT_LIGHT} />;
      }
    };

    return (
      <View style={styles.milestoneItem}>
        <View style={styles.milestoneIcon}>{getStatusIcon()}</View>
        <View style={styles.milestoneContent}>
          <Text style={styles.milestoneTitle}>{item.title}</Text>
          <Text style={styles.milestoneDesc}>{item.description}</Text>
          {item.completedDate && (
            <Text style={styles.milestoneDate}>Completed: {formatDate(item.completedDate)}</Text>
          )}
          {item.deliverables.length > 0 && (
            <View style={styles.deliverablesContainer}>
              <Text style={styles.deliverablesLabel}>Deliverables:</Text>
              {item.deliverables.map((del, idx) => (
                <View key={idx} style={styles.deliverableItem}>
                  <Ionicons name="document-outline" size={12} color={TEXT_MUTED} />
                  <Text style={styles.deliverableText}>{del}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render payment item
  const renderPayment = ({ item }) => (
    <View style={styles.paymentItem}>
      <View style={styles.paymentLeft}>
        <Text style={styles.paymentType}>{item.type}</Text>
        <Text style={styles.paymentDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.paymentAmount}>₱{item.amount.toLocaleString()}</Text>
        <View style={[styles.paymentStatus, item.status === 'completed' ? styles.paymentStatusCompleted : styles.paymentStatusPending]}>
          <Text style={[styles.paymentStatusText, item.status === 'completed' ? styles.paymentStatusTextCompleted : styles.paymentStatusTextPending]}>
            {item.status === 'completed' ? 'Paid' : 'Pending'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render update item
  const renderUpdate = ({ item }) => (
    <View style={styles.updateItem}>
      <View style={styles.updateIcon}>
        {item.type === 'payment' ? (
          <Ionicons name="cash-outline" size={16} color={GREEN} />
        ) : (
          <Ionicons name="chatbubble-outline" size={16} color={BLUE} />
        )}
      </View>
      <View style={styles.updateContent}>
        <Text style={styles.updateMessage}>{item.message}</Text>
        <Text style={styles.updateDate}>{formatDate(item.date)}</Text>
      </View>
    </View>
  );

  // Loading state (same as before)
  if (offersLoading && !refreshing && hiredTalents.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
            <View style={styles.backIconWrap}>
              <Ionicons name="arrow-back" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Hired Talent</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading hired talents...</Text>
        </View>
        <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const active = activeBottomTab === tab.key;
              const isPost = tab.key === 'PostJob';
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {active && <View style={styles.tabActiveBar} />}
                  {isPost ? (
                    <View style={styles.tabFab}>
                      <Ionicons name={active ? tab.icon : tab.iconOutline} size={22} color={WHITE} />
                    </View>
                  ) : (
                    <View style={styles.tabIconWrap}>
                      <Ionicons
                        name={active ? tab.icon : tab.iconOutline}
                        size={23}
                        color={active ? BLUE : TEXT_LIGHT}
                      />
                    </View>
                  )}
                  <Text style={[
                    styles.tabLabel,
                    active && styles.tabLabelActive,
                    isPost && styles.tabLabelPost,
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.root}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
            <View style={styles.backIconWrap}>
              <Ionicons name="arrow-back" size={18} color={WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Hired Talent</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
            <View style={styles.refreshIconWrap}>
              <Ionicons name="refresh-outline" size={18} color={BLUE} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{totalHired}</Text>
            <Text style={styles.statLabel}>Total Hired</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: BLUE }]}>{ongoingCount}</Text>
            <Text style={styles.statLabel}>Ongoing</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: GREEN }]}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: GOLD, fontSize: 14 }]}>
              ₱{totalSpent.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.tabRow}>
            {TABS_FILTER.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'All' ? 'All' : tab === 'accepted' ? 'Ongoing' : 'Completed'}
                </Text>
                <View style={[styles.tabDot, activeTab === tab && styles.tabDotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
          }
        >
          {filteredTalents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="people-outline" size={48} color={BLUE} />
              </View>
              <Text style={styles.emptyTitle}>No hired talents yet</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'All' 
                  ? "You haven't hired any freelancers yet" 
                  : `No ${activeTab === 'accepted' ? 'ongoing' : 'completed'} projects found`}
              </Text>
              <TouchableOpacity 
                style={styles.browseBtn}
                onPress={() => onNavigate('FindFreelancers')}
              >
                <Ionicons name="search-outline" size={18} color={WHITE} style={{ marginRight: 6 }} />
                <Text style={styles.browseBtnText}>Browse Freelancers</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTalents.map((item) => {
              const avatarColor = getAvatarColor(item.name);
              const initials = getInitials(item.firstName, item.lastName);
              const isOngoing = item.status === 'Ongoing';
              
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.card} 
                  activeOpacity={0.85}
                  onPress={() => handleTalentPress(item)}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: `${avatarColor}15` }]}>
                      {item.profilePicture ? (
                        <Image source={{ uri: item.profilePicture }} style={styles.avatarImage} />
                      ) : (
                        <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
                      )}
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.role}>{item.role}</Text>
                    </View>
                    {!isOngoing ? (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={GREEN} />
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    ) : (
                      <View style={styles.ongoingBadge}>
                        <View style={styles.ongoingDot} />
                        <Text style={styles.ongoingText}>Ongoing</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.jobRow}>
                    <Ionicons name="briefcase-outline" size={12} color={TEXT_MUTED} />
                    <Text style={styles.jobText} numberOfLines={1}>{item.job}</Text>
                    <Text style={styles.amount}>₱{item.amount?.toLocaleString()}</Text>
                  </View>

                  {/* Skills */}
                  {item.skills && item.skills.length > 0 && (
                    <View style={styles.skillsContainer}>
                      {item.skills.slice(0, 3).map((skill, idx) => (
                        <View key={idx} style={styles.skillChip}>
                          <Ionicons name="flash-outline" size={10} color={BLUE} />
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                      {item.skills.length > 3 && (
                        <Text style={styles.moreSkills}>+{item.skills.length - 3}</Text>
                      )}
                    </View>
                  )}

                  {/* Progress Bar - only for ongoing projects */}
                  {isOngoing && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={[styles.progressPct, { color: BLUE }]}>
                          {item.progress}%
                        </Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${item.progress}%`, backgroundColor: BLUE },
                          ]}
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Ionicons name="calendar-outline" size={11} color={TEXT_LIGHT} />
                    <Text style={styles.hiredDate}>Hired {item.hired}</Text>
                    
                    {isOngoing && (
                      <TouchableOpacity 
                                        style={styles.completeBtn}
                        onPress={() => handleMarkCompleted(item.id)}
                      >
                        <Ionicons name="checkmark-done-outline" size={12} color={GREEN} />
                        <Text style={styles.completeBtnText}>Complete</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.msgBtn}
                      onPress={() => handleMessage(item.freelancer_id, item.name)}
                    >
                      <Ionicons name="chatbubble-outline" size={13} color={BLUE} />
                      <Text style={styles.msgText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* ── Bottom Tab Bar ── */}
        <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const active = activeBottomTab === tab.key;
              const isPost = tab.key === 'PostJob';
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {active && <View style={styles.tabActiveBar} />}
                  {isPost ? (
                    <View style={styles.tabFab}>
                      <Ionicons name={active ? tab.icon : tab.iconOutline} size={22} color={WHITE} />
                    </View>
                  ) : (
                    <View style={styles.tabIconWrap}>
                      <Ionicons
                        name={active ? tab.icon : tab.iconOutline}
                        size={23}
                        color={active ? BLUE : TEXT_LIGHT}
                      />
                    </View>
                  )}
                  <Text style={[
                    styles.tabLabel,
                    active && styles.tabLabelActive,
                    isPost && styles.tabLabelPost,
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      {/* ── Talent Detail Modal ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDetailModal}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={() => setShowDetailModal(false)}
              >
                <Ionicons name="close" size={24} color={TEXT_MAIN} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Project Details</Text>
              <View style={{ width: 40 }} />
            </View>

            {selectedTalent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Freelancer Profile Section */}
                <View style={styles.modalProfileSection}>
                  <View style={[styles.modalAvatar, { backgroundColor: `${getAvatarColor(selectedTalent.name)}15` }]}>
                    {selectedTalent.profilePicture ? (
                      <Image source={{ uri: selectedTalent.profilePicture }} style={styles.modalAvatarImage} />
                    ) : (
                      <Text style={[styles.modalAvatarText, { color: getAvatarColor(selectedTalent.name) }]}>
                        {getInitials(selectedTalent.firstName, selectedTalent.lastName)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.modalName}>{selectedTalent.name}</Text>
                  <Text style={styles.modalRole}>{selectedTalent.role}</Text>
                  <View style={styles.modalStats}>
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatValue}>₱{selectedTalent.amount?.toLocaleString()}</Text>
                      <Text style={styles.modalStatLabel}>Project Value</Text>
                    </View>
                    <View style={styles.modalStatDivider} />
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatValue}>{selectedTalent.progress}%</Text>
                      <Text style={styles.modalStatLabel}>Completion</Text>
                    </View>
                    <View style={styles.modalStatDivider} />
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatValue}>{selectedTalent.hired}</Text>
                      <Text style={styles.modalStatLabel}>Started</Text>
                    </View>
                  </View>
                </View>

                {/* Detail Tabs */}
                <View style={styles.detailTabs}>
                  {['progress', 'payments', 'updates'].map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.detailTab, activeDetailTab === tab && styles.detailTabActive]}
                      onPress={() => setActiveDetailTab(tab)}
                    >
                      <Text style={[styles.detailTabText, activeDetailTab === tab && styles.detailTabTextActive]}>
                        {tab === 'progress' ? 'Progress' : tab === 'payments' ? 'Payments' : 'Updates'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Progress Tab */}
                {activeDetailTab === 'progress' && (
                  <View style={styles.tabContent}>
                    {/* Project Info */}
                    <View style={styles.projectInfoCard}>
                      <Text style={styles.projectTitle}>{selectedTalent.job}</Text>
                      {selectedTalent.jobDescription && (
                        <Text style={styles.projectDescription}>{selectedTalent.jobDescription}</Text>
                      )}
                    </View>

                    {/* Overall Progress */}
                    <View style={styles.progressCard}>
                      <Text style={styles.sectionTitle}>Overall Progress</Text>
                      <View style={styles.bigProgressBar}>
                        <View 
                          style={[
                            styles.bigProgressFill, 
                            { width: `${selectedTalent.progress}%`, backgroundColor: BLUE }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressPercentage}>{selectedTalent.progress}% Complete</Text>
                    </View>

                    {/* Milestones */}
                    <View style={styles.milestonesCard}>
                      <Text style={styles.sectionTitle}>Project Milestones</Text>
                      <FlatList
                        data={milestones}
                        renderItem={renderMilestone}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                      />
                    </View>

                    {/* Action Buttons */}
                    {selectedTalent.status === 'Ongoing' && (
                      <View style={styles.modalActions}>
                        <TouchableOpacity 
                          style={[styles.modalActionBtn, styles.modalCompleteBtn]}
                          onPress={() => handleMarkCompleted(selectedTalent.id)}
                        >
                          <Ionicons name="checkmark-done-outline" size={18} color={WHITE} />
                          <Text style={styles.modalActionBtnText}>Mark as Completed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.modalActionBtn, styles.modalMessageBtn]}
                          onPress={() => handleMessage(selectedTalent.freelancer_id, selectedTalent.name)}
                        >
                          <Ionicons name="chatbubble-outline" size={18} color={BLUE} />
                          <Text style={[styles.modalActionBtnText, { color: BLUE }]}>Send Message</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Payments Tab */}
                {activeDetailTab === 'payments' && (
                  <View style={styles.tabContent}>
                    <View style={styles.paymentsSummary}>
                      <View style={styles.paymentSummaryItem}>
                        <Text style={styles.paymentSummaryLabel}>Total Contract Value</Text>
                        <Text style={styles.paymentSummaryValue}>₱{selectedTalent.amount?.toLocaleString()}</Text>
                      </View>
                      <View style={styles.paymentSummaryItem}>
                        <Text style={styles.paymentSummaryLabel}>Total Paid</Text>
                        <Text style={[styles.paymentSummaryValue, { color: GREEN }]}>
                          ₱{payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.paymentSummaryItem}>
                        <Text style={styles.paymentSummaryLabel}>Pending Payment</Text>
                        <Text style={[styles.paymentSummaryValue, { color: ORANGE }]}>
                          ₱{payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <FlatList
                      data={payments}
                      renderItem={renderPayment}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                    />
                  </View>
                )}

                {/* Updates Tab */}
                {activeDetailTab === 'updates' && (
                  <View style={styles.tabContent}>
                    <FlatList
                      data={updates}
                      renderItem={renderUpdate}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                    />
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (keep all existing styles from your original)
  safe: { flex: 1, backgroundColor: BG },
  root: { flex: 1, backgroundColor: BG },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: NAVY,
  },
  backBtn: { alignSelf: 'flex-start' },
  backIconWrap: {
    width: 40, height: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  refreshBtn: { alignSelf: 'flex-start' },
  refreshIconWrap: {
    width: 40, height: 40,
    backgroundColor: 'rgba(0,104,181,0.1)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,104,181,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  topbarTitle: { fontSize: 18, fontWeight: '700', color: WHITE, letterSpacing: -0.3 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  statLabel: { fontSize: 10, color: TEXT_MUTED, letterSpacing: 0.3, fontWeight: '500' },
  statDivider: { width: 1, height: 35, backgroundColor: BORDER },
  tabScroll: { flexGrow: 0, backgroundColor: CARD },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG,
  },
  tabActive: { backgroundColor: `${BLUE}10`, borderColor: BLUE },
  tabText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  tabTextActive: { color: BLUE, fontWeight: '600' },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabDotActive: {
    backgroundColor: BLUE,
  },
  scroll: { padding: 16, paddingBottom: 40 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 80, height: 80,
    backgroundColor: `${BLUE}10`,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
  },
  card: {
    backgroundColor: CARD, 
    borderRadius: 18, 
    padding: 16,
    borderWidth: 1, 
    borderColor: BORDER, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  headerInfo: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
  role: { fontSize: 11, color: TEXT_MUTED },
  ongoingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    backgroundColor: `${BLUE}10`, borderWidth: 1,
    borderColor: `${BLUE}25`,
  },
  ongoingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BLUE },
  ongoingText: { fontSize: 10, fontWeight: '600', color: BLUE },
  completedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    backgroundColor: `${GREEN}10`, borderWidth: 1,
    borderColor: `${GREEN}25`,
  },
  completedText: { fontSize: 10, fontWeight: '600', color: GREEN },
  jobRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  jobText: { flex: 1, fontSize: 12, color: TEXT_MUTED },
  amount: { fontSize: 14, fontWeight: '700', color: BLUE },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: `${BLUE}8`,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: `${BLUE}20`,
  },
  skillText: { fontSize: 10, color: BLUE, fontWeight: '500' },
  moreSkills: { fontSize: 10, color: TEXT_MUTED, alignSelf: 'center' },
  progressSection: { marginBottom: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 10, color: TEXT_MUTED, letterSpacing: 0.5 },
  progressPct: { fontSize: 10, fontWeight: '700' },
  progressTrack: {
    height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  hiredDate: { flex: 1, fontSize: 10, color: TEXT_LIGHT },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
    borderColor: `${GREEN}30`,
    backgroundColor: `${GREEN}10`,
  },
  completeBtnText: { fontSize: 11, fontWeight: '600', color: GREEN },
  msgBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
    borderColor: `${BLUE}30`,
    backgroundColor: `${BLUE}10`,
  },
  msgText: { fontSize: 11, fontWeight: '600', color: BLUE },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  modalProfileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalAvatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  modalName: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  modalRole: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 16,
  },
  modalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  modalStat: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BLUE,
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 10,
    color: TEXT_MUTED,
  },
  modalStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: BORDER,
  },
  detailTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  detailTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  detailTabActive: {
    backgroundColor: `${BLUE}10`,
  },
  detailTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  detailTabTextActive: {
    color: BLUE,
  },
  tabContent: {
    padding: 16,
  },
  projectInfoCard: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  projectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 20,
  },
  progressCard: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 12,
  },
  bigProgressBar: {
    height: 12,
    backgroundColor: BORDER,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  bigProgressFill: {
    height: 12,
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  milestonesCard: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  milestoneItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  milestoneIcon: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  milestoneDesc: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  milestoneDate: {
    fontSize: 10,
    color: TEXT_LIGHT,
  },
  deliverablesContainer: {
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: BORDER,
  },
  deliverablesLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  deliverableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  deliverableText: {
    fontSize: 10,
    color: TEXT_MUTED,
  },
  paymentsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  paymentSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  paymentSummaryLabel: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  paymentSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  paymentLeft: {
    flex: 1,
  },
  paymentType: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 10,
    color: TEXT_LIGHT,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
    marginBottom: 4,
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentStatusCompleted: {
    backgroundColor: `${GREEN}15`,
  },
  paymentStatusPending: {
    backgroundColor: `${ORANGE}15`,
  },
  paymentStatusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  paymentStatusTextCompleted: {
    color: GREEN,
  },
  paymentStatusTextPending: {
    color: ORANGE,
  },
  updateItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  updateIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateMessage: {
    fontSize: 13,
    color: TEXT_MAIN,
    marginBottom: 4,
    lineHeight: 18,
  },
  updateDate: {
    fontSize: 10,
    color: TEXT_LIGHT,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalCompleteBtn: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  modalMessageBtn: {
    backgroundColor: `${BLUE}10`,
    borderColor: `${BLUE}30`,
  },
  modalActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
  },

  // Bottom Tab Bar
  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1.5, borderTopColor: BORDER,
    paddingTop: 6, paddingBottom: 4, paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4, position: 'relative',
  },
  tabActiveBar: {
    position: 'absolute', top: 0,
    width: 24, height: 3,
    backgroundColor: BLUE, borderRadius: 999,
  },
  tabIconWrap: { position: 'relative', marginBottom: 3, marginTop: 6 },
  tabFab: {
    width: 44, height: 36, borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 3, marginTop: 2,
    shadowColor: GOLD_DK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 5, elevation: 3,
    borderWidth: 1, borderColor: GOLD_LT,
  },
  tabLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
  tabLabelActive: { color: BLUE, fontWeight: '700' },
  tabLabelPost: { color: GOLD, fontWeight: '700' },
});