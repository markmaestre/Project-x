// screens/NotificationsScreen.jsx - Email-inbox style UI + peso currency

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  BackHandler,
  Modal,
  Animated,
  Easing,
  Pressable,
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

// Peso currency symbol used everywhere money is displayed
const PESO = '₱';
// ─────────────────────────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { key: 'all', label: 'Inbox', icon: 'mail-outline' },
  { key: 'unread', label: 'Unread', icon: 'mail-unread-outline' },
  { key: 'offers', label: 'Offers', icon: 'briefcase-outline' },
  { key: 'messages', label: 'Messages', icon: 'chatbubble-outline' },
];

// Maps a notification type/action to a human readable label + a follow-up
// action button description used inside the detail modal.
const ACTION_META = {
  view_offer:        { label: 'View Offer',       icon: 'briefcase-outline' },
  open_chat:         { label: 'Reply',            icon: 'arrow-undo-outline' },
  view_job:          { label: 'View Job Post',    icon: 'document-text-outline' },
  view_contract:     { label: 'View Contract',    icon: 'clipboard-outline' },
  view_transaction:  { label: 'View Transaction', icon: 'cash-outline' },
  view_review:       { label: 'View Review',      icon: 'star-outline' },
  complete_profile:  { label: 'Complete Profile', icon: 'person-circle-outline' },
  default:           { label: 'View Details',     icon: 'arrow-forward-circle-outline' },
};

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

// Human friendly label for the type badge shown inside the modal
const getTypeLabel = (type) => {
  if (!type) return 'Notification';
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Formats a numeric amount as Philippine peso, e.g. 1500 -> "₱1,500.00"
const formatPeso = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return null;
  const num = Number(amount);
  const formatted = num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${PESO}${formatted}`;
};

const formatFullDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Gmail-style compact time: just now / minutes / time-today / weekday / date
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Builds initials for the sender "avatar" bubble, mimicking an email client
const getInitials = (notification) => {
  const first = notification.sender_id?.first_name;
  const last = notification.sender_id?.last_name;
  if (first) {
    return `${first.charAt(0)}${last ? last.charAt(0) : ''}`.toUpperCase();
  }
  // Fall back to the notification type/title for system notifications
  const source = notification.title || notification.type || 'N';
  return source.charAt(0).toUpperCase();
};

const getSenderName = (notification) => {
  if (notification.sender_id?.first_name) {
    return `${notification.sender_id.first_name} ${notification.sender_id.last_name || ''}`.trim();
  }
  return 'Rectifix';
};

function NotificationItem({ notification, onPress, onMarkRead }) {
  const iconColor = getIconColor(notification.type);
  const initials = getInitials(notification);
  const senderName = getSenderName(notification);
  const amountText = formatPeso(notification.amount);
  const unread = !notification.is_read;

  return (
    <TouchableOpacity
      style={[styles.mailRow, unread && styles.mailRowUnread]}
      onPress={() => onPress(notification)}
      activeOpacity={0.6}
    >
      {/* Sender avatar bubble, like an email client */}
      <View style={[styles.avatar, { backgroundColor: `${iconColor}18`, borderColor: `${iconColor}30` }]}>
        <Text style={[styles.avatarText, { color: iconColor }]}>{initials}</Text>
        {unread && <View style={styles.avatarUnreadDot} />}
      </View>

      <View style={styles.mailBody}>
        <View style={styles.mailTopRow}>
          <Text style={[styles.mailSender, unread && styles.mailSenderUnread]} numberOfLines={1}>
            {senderName}
          </Text>
          <Text style={[styles.mailTime, unread && styles.mailTimeUnread]}>
            {formatTime(notification.created_at)}
          </Text>
        </View>

        <Text style={[styles.mailSubject, unread && styles.mailSubjectUnread]} numberOfLines={1}>
          {notification.title}
        </Text>

        <View style={styles.mailPreviewRow}>
          <Text style={styles.mailPreview} numberOfLines={1}>
            {notification.message}
          </Text>
          {amountText && (
            <Text style={[styles.mailAmount, { color: iconColor }]}>{amountText}</Text>
          )}
        </View>

        {unread && (
          <TouchableOpacity
            style={styles.markReadPill}
            onPress={() => onMarkRead(notification._id)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Ionicons name="checkmark-circle-outline" size={12} color={TEXT_MUTED} />
            <Text style={styles.markReadPillText}>Mark as read</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ filter }) {
  const getMessage = () => {
    switch (filter) {
      case 'unread': return 'You\u2019re all caught up';
      case 'offers': return 'No offers in your inbox';
      case 'messages': return 'No message notifications';
      default: return 'Your inbox is empty';
    }
  };

  const getIcon = () => {
    switch (filter) {
      case 'offers': return 'briefcase-outline';
      case 'messages': return 'chatbubble-outline';
      default: return 'mail-open-outline';
    }
  };

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={getIcon()} size={48} color={TEXT_LIGHT} />
      </View>
      <Text style={styles.emptyTitle}>{getMessage()}</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' && 'New notifications will land here, just like a real inbox'}
        {filter === 'unread' && 'You have read every notification'}
        {filter === 'offers' && 'When clients send you offers, they will appear here'}
        {filter === 'messages' && 'When you receive messages, they will appear here'}
      </Text>
    </View>
  );
}

// ── Email-style Notification Detail Modal ────────────────────────────────────
function NotificationDetailModal({ visible, notification, onClose, onPrimaryAction }) {
  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 9,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.94);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!notification) return null;

  const iconName = getIconName(notification.type);
  const iconColor = getIconColor(notification.type);
  const hasAction = notification.actions && notification.actions.length > 0;
  const actionType = hasAction ? notification.actions[0].action_type : 'default';
  const actionMeta = ACTION_META[actionType] || ACTION_META.default;
  const initials = getInitials(notification);
  const senderName = getSenderName(notification);
  const amountText = formatPeso(notification.amount);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.modalCard,
            { opacity, transform: [{ scale }] },
          ]}
        >
          {/* Email-style header bar */}
          <View style={styles.modalHeaderBar}>
            <View style={[styles.modalTypeBadge, { backgroundColor: `${iconColor}12`, borderColor: `${iconColor}30` }]}>
              <Ionicons name={iconName} size={12} color={iconColor} />
              <Text style={[styles.modalTypeText, { color: iconColor }]}>
                {getTypeLabel(notification.type)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          {/* Subject line, like an email subject */}
          <Text style={styles.modalTitle}>{notification.title}</Text>

          {/* From / date row, mimicking an email client header */}
          <View style={styles.modalFromRow}>
            <View style={[styles.modalAvatar, { backgroundColor: `${iconColor}18`, borderColor: `${iconColor}30` }]}>
              <Text style={[styles.modalAvatarText, { color: iconColor }]}>{initials}</Text>
            </View>
            <View style={styles.modalFromTextWrap}>
              <Text style={styles.modalFromName}>{senderName}</Text>
              <Text style={styles.modalFromMeta}>to me</Text>
            </View>
            <Text style={styles.modalMetaText}>{formatFullDate(notification.created_at)}</Text>
          </View>

          {/* Divider */}
          <View style={styles.modalDivider} />

          {/* Message body, like an email body */}
          <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalMessage}>{notification.message}</Text>

            {amountText && (
              <View style={[styles.modalAmountCard, { borderColor: `${iconColor}30`, backgroundColor: `${iconColor}0C` }]}>
                <Ionicons name="cash-outline" size={16} color={iconColor} />
                <Text style={[styles.modalAmountText, { color: iconColor }]}>{amountText}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer actions, styled like Reply / Archive buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Ionicons name="archive-outline" size={15} color={TEXT_MUTED} />
              <Text style={styles.modalSecondaryText}>Archive</Text>
            </TouchableOpacity>

            {hasAction && (
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => onPrimaryAction(notification)}
                activeOpacity={0.85}
              >
                <Ionicons name={actionMeta.icon} size={16} color={WHITE} />
                <Text style={styles.modalPrimaryText}>{actionMeta.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
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

  // Detail modal state
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Handle hardware back button press - close modal first, else navigate back to Dashboard
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (detailVisible) {
        setDetailVisible(false);
        return true;
      }
      if (onNavigate) {
        onNavigate('FreelancerDashboard', { activeTab: 'Profile' });
        return true; // Prevent default behavior
      }
      return false;
    });

    return () => backHandler.remove();
  }, [onNavigate, detailVisible]);

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

  // Handle notification press -> mark as read + open the detail modal
  const handleNotificationPress = useCallback((notification) => {
    if (!notification.is_read) {
      dispatch(markNotificationAsRead(notification._id));
    }
    setSelectedNotification(notification);
    setDetailVisible(true);
  }, [dispatch]);

  // Close the detail modal
  const handleCloseModal = useCallback(() => {
    setDetailVisible(false);
    setTimeout(() => setSelectedNotification(null), 200);
  }, []);

  // Fired when the user taps the primary CTA inside the modal
  const handlePrimaryAction = useCallback((notification) => {
    setDetailVisible(false);

    const action = notification.actions?.[0];
    if (!action) return;

    switch (action.action_type) {
      case 'view_offer':
        if (onNavigate) {
          onNavigate('OfferDetails', {
            offerId: notification.reference_id,
            jobTitle: notification.title,
          });
        }
        break;

      case 'open_chat':
        if (onNavigate) {
          onNavigate('Messages', {
            userId: notification.sender_id?._id,
            userName: notification.sender_id?.first_name,
          });
        }
        break;

      case 'view_job':
        if (onNavigate) {
          onNavigate('JobDetails', { jobId: notification.reference_id });
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
        break;
    }
  }, [onNavigate]);

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

  // Handle back navigation
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('FreelancerDashboard', { activeTab: 'Profile' });
    }
  };

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
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={20} color={WHITE} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Inbox</Text>
            </View>
            <View style={styles.headerActions} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.loadingText}>Loading your inbox...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* ── Header, styled like an email app top bar ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIconWrap}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Ionicons name="mail" size={16} color={GOLD} style={{ marginRight: 6 }} />
            <Text style={styles.headerTitle}>Inbox</Text>
            {unreadCount > 0 && (
              <View style={styles.headerCountBadge}>
                <Text style={styles.headerCountText}>{unreadCount}</Text>
              </View>
            )}
          </View>

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

        {/* ── Filter Tabs, like Gmail category tabs ── */}
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

        {/* ── Mail List ── */}
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
          ItemSeparatorComponent={() => <View style={styles.mailSeparator} />}
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

      {/* ── Notification Detail Modal (email view) ── */}
      <NotificationDetailModal
        visible={detailVisible}
        notification={selectedNotification}
        onClose={handleCloseModal}
        onPrimaryAction={handlePrimaryAction}
      />
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
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: -0.3,
  },
  headerCountBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  headerCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
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

  // ── Mail List ───────────────────────────────────────────────────────────────
  listContainer: {
    paddingBottom: 40,
  },
  mailSeparator: {
    height: 1,
    backgroundColor: BORDER,
    marginLeft: 72,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${BLUE}08`,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: `${BLUE}20`,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
  },

  // ── Mail Row (email-list style item) ───────────────────────────────────────
  mailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mailRowUnread: {
    backgroundColor: `${BLUE}05`,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  avatarUnreadDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BLUE,
    borderWidth: 2,
    borderColor: CARD,
  },
  mailBody: {
    flex: 1,
  },
  mailTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  mailSender: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: TEXT_MUTED,
    marginRight: 8,
  },
  mailSenderUnread: {
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  mailTime: {
    fontSize: 11,
    color: TEXT_LIGHT,
    flexShrink: 0,
  },
  mailTimeUnread: {
    color: BLUE,
    fontWeight: '600',
  },
  mailSubject: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  mailSubjectUnread: {
    fontWeight: '700',
  },
  mailPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mailPreview: {
    flex: 1,
    fontSize: 12.5,
    color: TEXT_LIGHT,
    lineHeight: 18,
  },
  mailAmount: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  markReadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: BG,
  },
  markReadPillText: {
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

  // ── Detail Modal (email view) ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7,26,62,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    backgroundColor: CARD,
    borderRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalTypeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    lineHeight: 25,
    marginBottom: 14,
  },
  modalFromRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalAvatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalFromTextWrap: {
    flex: 1,
  },
  modalFromName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  modalFromMeta: {
    fontSize: 11.5,
    color: TEXT_LIGHT,
    marginTop: 1,
  },
  modalMetaText: {
    fontSize: 11.5,
    color: TEXT_LIGHT,
  },
  modalDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 16,
  },
  modalBodyScroll: {
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 14.5,
    color: TEXT_MUTED,
    lineHeight: 22,
  },
  modalAmountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalAmountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  modalPrimaryBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 12,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },
});