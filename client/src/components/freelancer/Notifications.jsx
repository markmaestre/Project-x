// screens/NotificationsScreen.jsx - Updated to remove counts dependency

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  getNotificationCounts,
  selectAllNotifications,
  selectUnreadNotifications,
  selectNotificationsLoading,
  selectNotificationsError,
  selectUnreadCount,
  selectNotificationsTotal,
  selectNotificationsTotalPages,
  selectNotificationsCurrentPage,
  selectTypeBreakdown,
} from '../../Redux/slices/notificationSlice';

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
const ORANGE     = '#F97316';
const RED        = '#EF4444';
// ─────────────────────────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: 'notifications-outline' },
  { key: 'unread', label: 'Unread', icon: 'mail-unread-outline' },
  { key: 'offers', label: 'Offers', icon: 'briefcase-outline' },
  { key: 'messages', label: 'Messages', icon: 'chatbubble-outline' },
];

// Helper to get icon name based on notification type
const getIconName = (type) => {
  switch (type) {
    case 'offer':
    case 'offer_received':
      return 'briefcase-outline';
    case 'message':
    case 'new_message':
      return 'chatbubble-outline';
    case 'application':
    case 'application_submitted':
    case 'application_status_updated':
      return 'document-text-outline';
    case 'job':
    case 'job_posted':
      return 'briefcase-outline';
    case 'milestone':
    case 'milestone_completed':
      return 'checkmark-circle-outline';
    case 'payment':
    case 'payment_received':
      return 'cash-outline';
    case 'review':
    case 'rating_received':
      return 'star-outline';
    case 'alert':
      return 'alert-circle-outline';
    case 'contract_started':
      return 'play-circle-outline';
    case 'contract_completed':
      return 'checkmark-done-circle-outline';
    case 'contract_cancelled':
      return 'close-circle-outline';
    case 'project_update':
      return 'refresh-circle-outline';
    case 'deadline_approaching':
      return 'time-outline';
    case 'withdrawal_confirmed':
      return 'checkmark-done-circle-outline';
    case 'interview_scheduled':
      return 'calendar-outline';
    case 'offer_accepted':
      return 'checkmark-done-circle-outline';
    case 'offer_rejected':
      return 'close-circle-outline';
    default:
      return 'notifications-outline';
  }
};

// Helper to get icon color based on notification type
const getIconColor = (type) => {
  switch (type) {
    case 'offer':
    case 'offer_received':
      return BLUE;
    case 'message':
    case 'new_message':
      return GREEN;
    case 'application':
    case 'application_submitted':
    case 'application_status_updated':
      return BLUE;
    case 'job':
    case 'job_posted':
      return GOLD;
    case 'milestone':
    case 'milestone_completed':
      return GREEN;
    case 'payment':
    case 'payment_received':
      return GREEN;
    case 'review':
    case 'rating_received':
      return GOLD;
    case 'alert':
      return ORANGE;
    case 'contract_started':
      return BLUE;
    case 'contract_completed':
      return GREEN;
    case 'contract_cancelled':
      return RED;
    case 'project_update':
      return BLUE;
    case 'deadline_approaching':
      return ORANGE;
    case 'withdrawal_confirmed':
      return GREEN;
    case 'interview_scheduled':
      return BLUE;
    case 'offer_accepted':
      return GREEN;
    case 'offer_rejected':
      return RED;
    default:
      return TEXT_MUTED;
  }
};

function NotificationItem({ notification, onPress, onMarkRead }) {
  const iconName = getIconName(notification.type);
  const iconColor = getIconColor(notification.type);

  // Format the time display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.is_read && styles.notificationUnread]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      {!notification.is_read && <View style={styles.unreadDot} />}

      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !notification.is_read && styles.titleUnread]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.time}>{formatTime(notification.created_at)}</Text>
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>

        {(notification.actions?.length > 0 || !notification.is_read) && (
          <View style={styles.actionRow}>
            {notification.actions?.length > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onPress(notification)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.actionButtonText}>View Details</Text>
                <Ionicons name="arrow-forward" size={12} color={BLUE} />
              </TouchableOpacity>
            )}

            {!notification.is_read && (
              <TouchableOpacity
                style={styles.markReadButton}
                onPress={() => onMarkRead(notification._id)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Ionicons name="checkmark-circle-outline" size={14} color={TEXT_MUTED} />
                <Text style={styles.markReadText}>Mark as read</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ filter }) {
  const getMessage = () => {
    switch (filter) {
      case 'unread': return 'No unread notifications';
      case 'offers': return 'No offers yet';
      case 'messages': return 'No message notifications';
      default: return 'No notifications yet';
    }
  };

  const getIcon = () => {
    switch (filter) {
      case 'offers': return 'briefcase-outline';
      case 'messages': return 'chatbubble-outline';
      default: return 'notifications-off-outline';
    }
  };

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={getIcon()} size={48} color={TEXT_LIGHT} />
      </View>
      <Text style={styles.emptyTitle}>{getMessage()}</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' && 'When you receive notifications, they will appear here'}
        {filter === 'unread' && 'You have read all your notifications'}
        {filter === 'offers' && 'When clients send you offers, they will appear here'}
        {filter === 'messages' && 'When you receive messages, they will appear here'}
      </Text>
    </View>
  );
}

export default function NotificationsScreen({ onNavigate, route }) {
  const dispatch = useDispatch();
  
  // Redux state
  const notifications = useSelector(selectAllNotifications);
  const unreadNotifications = useSelector(selectUnreadNotifications);
  const isLoading = useSelector(selectNotificationsLoading);
  const error = useSelector(selectNotificationsError);
  const unreadCount = useSelector(selectUnreadCount);
  const totalCount = useSelector(selectNotificationsTotal);
  const totalPages = useSelector(selectNotificationsTotalPages);
  const currentPage = useSelector(selectNotificationsCurrentPage);
  const typeBreakdown = useSelector(selectTypeBreakdown);

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
    // Don't call getNotificationCounts - we get unreadCount from getNotifications
  }, []);

  // Load notifications with current filter
  const loadNotifications = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      let filterParams = { page: pageNum, limit: 20 };
      
      // Apply filters
      if (activeFilter === 'unread') {
        filterParams.is_read = false;
      } else if (activeFilter === 'offers') {
        filterParams.type = 'offer';
      } else if (activeFilter === 'messages') {
        filterParams.type = 'message';
      }

      const result = await dispatch(getNotifications(filterParams)).unwrap();
      
      if (refresh) {
        setPage(1);
      } else {
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [dispatch, activeFilter]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications(1, true);
    setRefreshing(false);
  }, [loadNotifications]);

  // Handle filter change
  const handleFilterChange = useCallback((filterKey) => {
    setActiveFilter(filterKey);
    loadNotifications(1, true);
  }, [loadNotifications]);

  // Handle notification press
  const handleNotificationPress = useCallback((notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      dispatch(markNotificationAsRead(notification._id));
    }

    // Handle action based on notification type and actions
    if (notification.actions && notification.actions.length > 0) {
      const action = notification.actions[0];
      
      switch (action.action_type) {
        case 'view_offer':
          if (onNavigate) {
            onNavigate('OfferDetails', { 
              offerId: notification.reference_id,
              jobTitle: notification.title
            });
          } else {
            Alert.alert('Offer Details', notification.message, [{ text: 'OK' }]);
          }
          break;
          
        case 'open_chat':
          if (onNavigate) {
            onNavigate('Messages', { 
              userId: notification.sender_id?._id,
              userName: notification.sender_id?.first_name 
            });
          }
          break;
          
        case 'view_job':
          if (onNavigate) {
            onNavigate('JobDetails', { jobId: notification.reference_id });
          } else {
            Alert.alert('Job Details', notification.message);
          }
          break;
          
        case 'view_contract':
          if (onNavigate) {
            onNavigate('ContractDetails', { contractId: notification.reference_id });
          }
          break;
          
        case 'view_transaction':
          if (onNavigate) {
            onNavigate('TransactionDetails', { transactionId: notification.reference_id });
          }
          break;
          
        case 'view_review':
          if (onNavigate) {
            onNavigate('ReviewDetails', { reviewId: notification.reference_id });
          }
          break;
          
        case 'complete_profile':
          if (onNavigate) {
            onNavigate('FreelancerProfile');
          }
          break;
          
        default:
          Alert.alert(notification.title, notification.message);
          break;
      }
    } else {
      // Default action - just show the notification details
      Alert.alert(notification.title, notification.message);
    }
  }, [dispatch, onNavigate]);

  // Handle mark as read
  const handleMarkAsRead = useCallback((notificationId) => {
    dispatch(markNotificationAsRead(notificationId));
  }, [dispatch]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) return;
    
    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} unread notifications as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All', onPress: () => dispatch(markAllNotificationsAsRead()) },
      ]
    );
  }, [dispatch, unreadCount]);

  // Handle clear all notifications
  const handleClearAll = useCallback(() => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive', 
          onPress: () => {
            let filter = {};
            if (activeFilter === 'offers') filter.type = 'offer';
            else if (activeFilter === 'messages') filter.type = 'message';
            dispatch(deleteAllNotifications(filter));
          }
        },
      ]
    );
  }, [dispatch, notifications.length, activeFilter]);

  // Get filtered notifications based on active filter
  const getFilteredNotifications = useCallback(() => {
    if (activeFilter === 'unread') {
      return unreadNotifications;
    }
    return notifications;
  }, [activeFilter, notifications, unreadNotifications]);

  const filteredNotifications = getFilteredNotifications();

  // Get badge count for filter tabs
  const getBadgeCount = useCallback((filter) => {
    if (filter === 'unread') return unreadCount;
    if (filter === 'offers') {
      return notifications.filter(n => n.type === 'offer' && !n.is_read).length;
    }
    if (filter === 'messages') {
      return notifications.filter(n => n.type === 'message' && !n.is_read).length;
    }
    return 0;
  }, [notifications, unreadCount]);

  // Render loading state
  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.root}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backIconWrap}
              onPress={() => onNavigate?.('FreelancerDashboard')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerActions} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIconWrap}
            onPress={() => onNavigate?.('FreelancerDashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Notifications</Text>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.headerActionBtn} onPress={handleMarkAllAsRead} activeOpacity={0.7}>
                <Ionicons name="checkmark-done-outline" size={20} color={GOLD} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleClearAll} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={20} color={SILVER2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Filter Tabs ── */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              const badgeCount = getBadgeCount(tab.key);

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterTab, isActive && styles.filterTabActive]}
                  onPress={() => handleFilterChange(tab.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={tab.icon} size={15} color={isActive ? BLUE : TEXT_MUTED} />
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {tab.label}
                  </Text>
                  {badgeCount > 0 && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{badgeCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── List ── */}
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
              onMarkRead={handleMarkAsRead}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
          }
          ListEmptyComponent={() => <EmptyState filter={activeFilter} />}
          ListHeaderComponent={
            filteredNotifications.length > 0 && unreadCount > 0 && activeFilter === 'all' ? (
              <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
                <Ionicons name="checkmark-done-circle-outline" size={18} color={BLUE} />
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            ) : null
          }
          onEndReached={() => {
            if (page < totalPages && !isLoading) {
              loadNotifications(page + 1);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoading && notifications.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={BLUE} />
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: BG },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: NAVY,
    minHeight: 60,
  },
  backIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 84,
    justifyContent: 'flex-end',
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Filter Tabs ──────────────────────────────────────────────────────────────
  filterContainer: {
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  filterScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 2,
  },
  filterTabActive: {
    borderBottomColor: BLUE,
  },
  filterText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  filterTextActive: {
    color: BLUE,
    fontWeight: '600',
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: WHITE,
    lineHeight: 18,
  },

  // ── List ────────────────────────────────────────────────────────────────────
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${BLUE}08`,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${BLUE}20`,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
  },

  // ── Notification Item ────────────────────────────────────────────────────────
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  notificationUnread: {
    backgroundColor: `${BLUE}05`,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
    zIndex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    flexShrink: 0,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginRight: 8,
  },
  titleUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    color: TEXT_LIGHT,
    flexShrink: 0,
  },
  message: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 19,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: BLUE,
    fontWeight: '600',
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markReadText: {
    fontSize: 11,
    color: TEXT_MUTED,
  },

  // ── Empty State ──────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    backgroundColor: `${BLUE}08`,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Loading States ──────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});