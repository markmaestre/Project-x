// screens/ClientNotifications.jsx - Email-inbox style UI + peso currency
// WITH ARCHIVE FUNCTIONALITY - FIXED for undefined state

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
  getNotificationCounts,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  clearNotificationError,
  clearNotificationSuccess,
  setSelectedNotification,
  clearSelectedNotification,
  resetUnreadCount,
} from '../../Redux/slices/notificationSlice';

// ── Design Tokens ─────────────────────────────────────────────────────────────
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
const PURPLE     = '#7C3AED';

// Peso currency symbol
const PESO = '₱';

// ── Filter Tabs ──────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: 'all', label: 'Inbox', icon: 'mail-outline' },
  { key: 'unread', label: 'Unread', icon: 'mail-unread-outline' },
  { key: 'offers', label: 'Offers', icon: 'briefcase-outline' },
  { key: 'messages', label: 'Messages', icon: 'chatbubble-outline' },
];

// ── Action Metadata ──────────────────────────────────────────────────────────
const ACTION_META = {
  view_offer:        { label: 'View Offer',       icon: 'briefcase-outline' },
  open_chat:         { label: 'Reply',            icon: 'arrow-undo-outline' },
  view_job:          { label: 'View Job Post',    icon: 'document-text-outline' },
  view_contract:     { label: 'View Contract',    icon: 'clipboard-outline' },
  view_transaction:  { label: 'View Transaction', icon: 'cash-outline' },
  view_review:       { label: 'View Review',      icon: 'star-outline' },
  complete_profile:  { label: 'Complete Profile', icon: 'person-circle-outline' },
  view_posting:      { label: 'View Posting',     icon: 'briefcase-outline' },
  view_applicant:    { label: 'View Applicant',   icon: 'person-add-outline' },
  view_application:  { label: 'View Application', icon: 'document-text-outline' },
  view_talent:       { label: 'View Talent',      icon: 'person-outline' },
  default:           { label: 'View Details',     icon: 'arrow-forward-circle-outline' },
};

// ── Helper Functions ──────────────────────────────────────────────────────────

// Get icon name based on notification type
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
    case 'payment_updates':
      return 'cash-outline';
    case 'review':
    case 'rating_updates':
      return 'star-outline';
    case 'alert':
    case 'system':
      return 'alert-circle-outline';
    case 'contract':
    case 'contract_updates':
      return 'clipboard-outline';
    case 'project':
    case 'project_updates':
      return 'refresh-circle-outline';
    case 'deadline_approaching':
      return 'time-outline';
    case 'interview':
      return 'calendar-outline';
    case 'offer_accepted':
      return 'checkmark-done-circle-outline';
    case 'offer_rejected':
      return 'close-circle-outline';
    default:
      return 'notifications-outline';
  }
};

// Get icon color based on notification type
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
    case 'payment_updates':
      return GREEN;
    case 'review':
    case 'rating_updates':
      return GOLD;
    case 'alert':
    case 'system':
      return ORANGE;
    case 'contract':
    case 'contract_updates':
      return BLUE;
    case 'project':
    case 'project_updates':
      return BLUE;
    case 'deadline_approaching':
      return ORANGE;
    case 'interview':
      return BLUE;
    case 'offer_accepted':
      return GREEN;
    case 'offer_rejected':
      return RED;
    default:
      return TEXT_MUTED;
  }
};

// Human friendly label for the type badge
const getTypeLabel = (type) => {
  if (!type) return 'Notification';
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Format amount as Philippine peso
const formatPeso = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return null;
  const num = Number(amount);
  const formatted = num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${PESO}${formatted}`;
};

// Format full date for detail modal
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

// Format time for list items (Gmail-style)
const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

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

// Get sender initials for avatar
const getInitials = (notification) => {
  if (!notification) return 'N';
  const sender = notification.sender_id || notification.sender;
  if (sender?.first_name) {
    return `${sender.first_name.charAt(0)}${sender.last_name ? sender.last_name.charAt(0) : ''}`.toUpperCase();
  }
  if (sender?.company_name) {
    return sender.company_name.substring(0, 2).toUpperCase();
  }
  const source = notification.title || notification.type || 'N';
  return source.charAt(0).toUpperCase();
};

// Get sender display name
const getSenderName = (notification) => {
  if (!notification) return 'Taskra System';
  const sender = notification.sender_id || notification.sender;
  if (sender?.first_name) {
    return `${sender.first_name} ${sender.last_name || ''}`.trim();
  }
  if (sender?.company_name) {
    return sender.company_name;
  }
  return 'Taskra System';
};

// ── Notification List Item ────────────────────────────────────────────────────
function NotificationItem({ notification, onPress, onMarkRead }) {
  if (!notification) return null;
  
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
      {/* Sender avatar bubble */}
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
            {formatTime(notification.created_at || notification.createdAt)}
          </Text>
        </View>

        <Text style={[styles.mailSubject, unread && styles.mailSubjectUnread]} numberOfLines={1}>
          {notification.title || 'Notification'}
        </Text>

        <View style={styles.mailPreviewRow}>
          <Text style={styles.mailPreview} numberOfLines={1}>
            {notification.message || ''}
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

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
  const getMessage = () => {
    switch (filter) {
      case 'unread': return 'You\'re all caught up';
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
        {filter === 'offers' && 'When talents send you offers, they will appear here'}
        {filter === 'messages' && 'When you receive messages, they will appear here'}
      </Text>
    </View>
  );
}

// ── Notification Detail Modal ────────────────────────────────────────────────
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
          {/* Header bar */}
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

          {/* Subject line */}
          <Text style={styles.modalTitle}>{notification.title || 'Notification'}</Text>

          {/* From / date row */}
          <View style={styles.modalFromRow}>
            <View style={[styles.modalAvatar, { backgroundColor: `${iconColor}18`, borderColor: `${iconColor}30` }]}>
              <Text style={[styles.modalAvatarText, { color: iconColor }]}>{initials}</Text>
            </View>
            <View style={styles.modalFromTextWrap}>
              <Text style={styles.modalFromName}>{senderName}</Text>
              <Text style={styles.modalFromMeta}>to me</Text>
            </View>
            <Text style={styles.modalMetaText}>{formatFullDate(notification.created_at || notification.createdAt)}</Text>
          </View>

          {/* Divider */}
          <View style={styles.modalDivider} />

          {/* Message body */}
          <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalMessage}>{notification.message || ''}</Text>

            {amountText && (
              <View style={[styles.modalAmountCard, { borderColor: `${iconColor}30`, backgroundColor: `${iconColor}0C` }]}>
                <Ionicons name="cash-outline" size={16} color={iconColor} />
                <Text style={[styles.modalAmountText, { color: iconColor }]}>{amountText}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer actions */}
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function ClientNotifications({ onNavigate, route }) {
  const dispatch = useDispatch();

  // Redux state - with safe defaults
  const notifications = useSelector((state) => state.notifications?.notifications || []);
  const selectedNotification = useSelector((state) => state.notifications?.selectedNotification || null);
  const isLoading = useSelector((state) => state.notifications?.isLoading || false);
  const error = useSelector((state) => state.notifications?.error || null);
  const totalPages = useSelector((state) => state.notifications?.totalPages || 1);
  const unreadCount = useSelector((state) => state.notifications?.unreadCount || 0);
  const markSuccess = useSelector((state) => state.notifications?.markSuccess || false);
  const deleteSuccess = useSelector((state) => state.notifications?.deleteSuccess || false);

  const { token } = useSelector((state) => state.auth || {});

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Detail modal state
  const [detailVisible, setDetailVisible] = useState(false);

  // Load notifications on mount
  useEffect(() => {
    if (token && !initialLoadDone) {
      loadNotifications(1, true);
      dispatch(getNotificationCounts());
      setInitialLoadDone(true);
    }
  }, [token, initialLoadDone, dispatch]);

  // Handle mark success
  useEffect(() => {
    if (markSuccess) {
      dispatch(getNotificationCounts());
      dispatch(clearNotificationSuccess());
    }
  }, [markSuccess, dispatch]);

  // Handle delete success
  useEffect(() => {
    if (deleteSuccess) {
      dispatch(getNotificationCounts());
      dispatch(clearNotificationSuccess());
      if (selectedNotification) {
        dispatch(clearSelectedNotification());
        setDetailVisible(false);
      }
    }
  }, [deleteSuccess, dispatch, selectedNotification]);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (detailVisible) {
        setDetailVisible(false);
        return true;
      }
      if (onNavigate) {
        onNavigate('ClientDashboard');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [onNavigate, detailVisible]);

  // Load notifications with current filter
  const loadNotifications = useCallback(async (pageNum = 1, refresh = false) => {
    if (!token) return;

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

      await dispatch(getNotifications(filterParams)).unwrap();

      if (refresh) {
        setPage(1);
      } else {
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [dispatch, token, activeFilter]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications(1, true);
    await dispatch(getNotificationCounts());
    setRefreshing(false);
  }, [loadNotifications, dispatch]);

  // Handle filter change
  const handleFilterChange = useCallback((filterKey) => {
    setActiveFilter(filterKey);
    loadNotifications(1, true);
  }, [loadNotifications]);

  // Handle notification press
  const handleNotificationPress = useCallback((notification) => {
    dispatch(setSelectedNotification(notification));
    setDetailVisible(true);
    if (!notification.is_read) {
      dispatch(markNotificationAsRead(notification._id));
    }
  }, [dispatch]);

  // Close detail modal
  const handleCloseModal = useCallback(() => {
    setDetailVisible(false);
    setTimeout(() => dispatch(clearSelectedNotification()), 200);
  }, [dispatch]);

  // Handle primary action from modal
  const handlePrimaryAction = useCallback((notification) => {
    setDetailVisible(false);

    const action = notification?.actions?.[0];
    if (!action) {
      Alert.alert(
        notification?.title || 'Notification',
        notification?.message || 'View details in the app.'
      );
      return;
    }

    const data = action.data || {};
    const actionType = action.action_type;

    switch (actionType) {
      case 'view_offer':
        if (onNavigate) {
          onNavigate('OfferDetails', {
            offerId: notification.reference_id || data.offer_id,
            jobTitle: notification.title,
          });
        }
        break;

      case 'open_chat':
        if (onNavigate) {
          onNavigate('Messages', {
            userId: notification.sender_id?._id || data.user_id,
            userName: notification.sender_id?.first_name || data.user_name || 'User',
          });
        }
        break;

      case 'view_job':
      case 'view_posting':
        if (onNavigate) {
          onNavigate('Mypostings', {
            jobId: notification.reference_id || data.job_id,
            view: 'details',
          });
        }
        break;

      case 'view_contract':
        if (onNavigate) {
          onNavigate('Contract', {
            contractId: notification.reference_id || data.contract_id,
            jobId: data.job_id,
          });
        }
        break;

      case 'view_transaction':
        if (onNavigate) {
          onNavigate('TransactionDetails', {
            transactionId: notification.reference_id || data.transaction_id,
          });
        }
        break;

      case 'view_review':
        if (onNavigate) {
          onNavigate('RatingClient', {
            reviewId: notification.reference_id || data.review_id,
            jobId: data.job_id,
          });
        }
        break;

      case 'complete_profile':
        if (onNavigate) {
          onNavigate('ClientEditProfile');
        }
        break;

      case 'view_applicant':
      case 'view_application':
        if (onNavigate) {
          onNavigate('Applications', {
            applicationId: notification.reference_id || data.application_id,
            jobId: data.job_id,
            talentId: data.talent_id || notification.sender_id?._id,
          });
        }
        break;

      case 'view_talent':
        if (onNavigate) {
          onNavigate('Hiredtalents', {
            talentId: notification.reference_id || data.talent_id || notification.sender_id?._id,
          });
        }
        break;

      default:
        Alert.alert(
          notification?.title || 'Notification',
          notification?.message || 'View details in the app.'
        );
        break;
    }
  }, [onNavigate]);

  // Handle mark as read
  const handleMarkAsRead = useCallback((notificationId) => {
    if (notificationId) {
      dispatch(markNotificationAsRead(notificationId));
    }
  }, [dispatch]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) {
      Alert.alert('No Unread', 'You have no unread notifications.');
      return;
    }

    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} unread notifications as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark All', 
          onPress: () => {
            dispatch(markAllNotificationsAsRead());
            dispatch(resetUnreadCount());
          }
        },
      ]
    );
  }, [dispatch, unreadCount]);

  // Handle delete all
  const handleClearAll = useCallback(() => {
    if (!notifications || notifications.length === 0) {
      Alert.alert('Empty', 'You have no notifications to clear.');
      return;
    }

    let filter = {};
    if (activeFilter === 'offers') filter.type = 'offer';
    else if (activeFilter === 'messages') filter.type = 'message';

    Alert.alert(
      'Clear All',
      `Are you sure you want to clear all ${activeFilter === 'all' ? '' : activeFilter + ' '}notifications? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => dispatch(deleteAllNotifications(filter)),
        },
      ]
    );
  }, [dispatch, notifications, activeFilter]);

  // Handle back navigation
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('ClientDashboard');
    }
  };

  // Get filtered notifications - with safety checks
  const getFilteredNotifications = useCallback(() => {
    if (!notifications || !Array.isArray(notifications)) return [];
    
    if (activeFilter === 'unread') {
      return notifications.filter(n => n && !n.is_read);
    }
    if (activeFilter === 'offers') {
      return notifications.filter(n => n && (n.type === 'offer' || n.type === 'offer_received'));
    }
    if (activeFilter === 'messages') {
      return notifications.filter(n => n && (n.type === 'message' || n.type === 'new_message'));
    }
    return notifications;
  }, [activeFilter, notifications]);

  const filteredNotifications = getFilteredNotifications();

  // Get badge count for filter tabs - with safety checks
  const getBadgeCount = useCallback((filter) => {
    if (!notifications || !Array.isArray(notifications)) return 0;
    
    if (filter === 'unread') return unreadCount;
    if (filter === 'offers') {
      return notifications.filter(n => n && (n.type === 'offer' || n.type === 'offer_received') && !n.is_read).length;
    }
    if (filter === 'messages') {
      return notifications.filter(n => n && (n.type === 'message' || n.type === 'new_message') && !n.is_read).length;
    }
    return 0;
  }, [notifications, unreadCount]);

  // Show loading only on initial load
  const showLoading = isLoading && (!notifications || notifications.length === 0) && !refreshing;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* ── Header ── */}
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

        {/* ── Notification List ── */}
        {showLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.loadingText}>Loading your inbox...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item?._id || item?.id || Math.random().toString()}
            renderItem={({ item }) => {
              if (!item) return null;
              return (
                <NotificationItem
                  notification={item}
                  onPress={handleNotificationPress}
                  onMarkRead={handleMarkAsRead}
                />
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.mailSeparator} />}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
            }
            ListEmptyComponent={() => <EmptyState filter={activeFilter} />}
            ListHeaderComponent={
              filteredNotifications && filteredNotifications.length > 0 && unreadCount > 0 && activeFilter === 'all' ? (
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
              isLoading && notifications && notifications.length > 0 ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color={BLUE} />
                </View>
              ) : null
            }
          />
        )}

        {/* Error banner */}
        {error && error.code !== 'COUNTS_ERROR' && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={16} color={RED} />
            <Text style={styles.errorText}>{typeof error === 'string' ? error : error.message || 'An error occurred'}</Text>
            <TouchableOpacity onPress={() => dispatch(clearNotificationError())}>
              <Ionicons name="close-outline" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Notification Detail Modal ── */}
      <NotificationDetailModal
        visible={detailVisible}
        notification={selectedNotification}
        onClose={handleCloseModal}
        onPrimaryAction={handlePrimaryAction}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: BG },

  // ── Header ──
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

  // ── Filter Tabs ──
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

  // ── Mail List ──
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

  // ── Mail Row ──
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

  // ── Empty State ──
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

  // ── Loading States ──
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

  // ── Error Container ──
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${RED}10`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: `${RED}30`,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: RED,
  },

  // ── Detail Modal ──
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