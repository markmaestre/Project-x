// screens/ClientNotifications.jsx - Fully connected to Redux notificationSlice
// UPDATED with client-side navigation, fixed counts, refreshed UI, and Taskra branding

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  BackHandler,
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

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY        = '#061630';
const BLUE        = '#1A56DB';
const BLUE_DK     = '#123F9E';
const BLUE_SOFT   = '#EBF2FF';
const GOLD        = '#B8860B';
const GOLD_LT     = '#D4A017';
const GOLD_SOFT   = '#FDF6E3';
const WHITE       = '#FFFFFF';
const BG          = '#F0F4F8';
const SURFACE     = '#FFFFFF';
const TEXT_DARK   = '#0D1B2A';
const TEXT_MED    = '#3D5166';
const TEXT_MUTED  = '#8497AA';
const DIVIDER     = '#E2EAF3';
const GREEN       = '#0B7A4A';
const GREEN_SOFT  = '#E8F7F0';
const RED         = '#B91C1C';
const RED_SOFT    = '#FEF2F2';
const ORANGE      = '#C45B0A';
const ORANGE_SOFT = '#FFF3E4';
const PURPLE      = '#5B21B6';
const PURPLE_SOFT = '#F5F3FF';

// ── Filter definitions ────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'All',        label: 'All',          type: null },
  { key: 'Unread',     label: 'Unread',       type: 'unread' },
  { key: 'Messages',   label: 'Messages',     type: 'message' },
  { key: 'Applicants', label: 'Applicants',   type: 'application' },
  { key: 'Projects',   label: 'Projects',     type: 'project_updates' },
  { key: 'Payments',   label: 'Payments',     type: 'payment_updates' },
  { key: 'System',     label: 'System',       type: 'system' },
];

const SECTION_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  older: 'Earlier',
};

const TYPE_COLORS = {
  message: { bg: BLUE_SOFT, color: BLUE, icon: 'mail-outline' },
  application: { bg: PURPLE_SOFT, color: PURPLE, icon: 'person-add-outline' },
  contract_updates: { bg: GREEN_SOFT, color: GREEN, icon: 'document-text-outline' },
  project_updates: { bg: ORANGE_SOFT, color: ORANGE, icon: 'flag-outline' },
  payment_updates: { bg: GREEN_SOFT, color: GREEN, icon: 'wallet-outline' },
  system: { bg: ORANGE_SOFT, color: ORANGE, icon: 'alert-circle-outline' },
  rating_updates: { bg: GOLD_SOFT, color: GOLD, icon: 'star-outline' },
  job_posted: { bg: BLUE_SOFT, color: BLUE, icon: 'briefcase-outline' },
  offer_accepted: { bg: GREEN_SOFT, color: GREEN, icon: 'checkmark-circle-outline' },
  interview: { bg: GOLD_SOFT, color: GOLD, icon: 'calendar-outline' },
  review_request: { bg: GOLD_SOFT, color: GOLD, icon: 'star-outline' },
  milestone: { bg: ORANGE_SOFT, color: ORANGE, icon: 'flag-outline' },
};

// ── Notification Detail Component ────────────────────────────────────────────
function NotificationDetail({ notification, onBack, onMarkRead, onDelete, onNavigate }) {
  const n = notification;
  const typeColors = TYPE_COLORS[n.type] || { bg: BLUE_SOFT, color: BLUE, icon: 'notifications-outline' };
  const avatarBg = n.sender?.profile_picture ? null : (n.sender?.avatar_color || NAVY);

  const senderInitials = n.sender?.first_name && n.sender?.last_name
    ? `${n.sender.first_name[0]}${n.sender.last_name[0]}`.toUpperCase()
    : n.sender?.company_name
    ? n.sender.company_name.substring(0, 2).toUpperCase()
    : 'U';

  const handleMarkRead = () => {
    if (!n.is_read) {
      onMarkRead(n._id);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(n._id) },
      ]
    );
  };

  // ── Client-side navigation handlers ──
  const handleActionPress = (action) => {
    const actionType = action.action_type;
    const data = action.data || {};

    switch (actionType) {
      case 'view_application':
        if (onNavigate) {
          onNavigate('Applications', {
            applicationId: data.application_id || n.reference_id,
            jobId: data.job_id || n.job_id,
            talentId: data.talent_id || n.sender_id?._id,
          });
        }
        break;

      case 'view_job':
        if (onNavigate) {
          onNavigate('Mypostings', {
            jobId: data.job_id || n.reference_id,
            view: 'details',
          });
        }
        break;

      case 'view_offer':
        if (onNavigate) {
          onNavigate('Mypostings', {
            offerId: data.offer_id || n.reference_id,
            jobId: data.job_id || n.job_id,
          });
        }
        break;

      case 'view_contract':
        if (onNavigate) {
          onNavigate('Contract', {
            contractId: data.contract_id || n.reference_id,
            jobId: data.job_id || n.job_id,
          });
        }
        break;

      case 'view_talent':
        if (onNavigate) {
          onNavigate('Hiredtalents', {
            talentId: data.talent_id || n.sender_id?._id,
            userId: data.talent_id || n.sender_id?._id,
          });
        }
        break;

      case 'view_review':
        if (onNavigate) {
          onNavigate('RatingClient', {
            reviewId: data.review_id || n.reference_id,
            jobId: data.job_id || n.job_id,
          });
        }
        break;

      case 'open_chat':
        if (onNavigate) {
          onNavigate('Messages', {
            userId: data.user_id || n.sender_id?._id,
            userName: data.user_name || n.sender?.first_name || 'User',
          });
        }
        break;

      case 'view_transaction':
        if (onNavigate) {
          onNavigate('TransactionDetails', {
            transactionId: data.transaction_id || n.reference_id,
          });
        }
        break;

      case 'view_posting':
        if (onNavigate) {
          onNavigate('Mypostings', {
            jobId: data.job_id || n.reference_id,
          });
        }
        break;

      case 'view_applicant':
        if (onNavigate) {
          onNavigate('Applications', {
            applicationId: data.application_id || n.reference_id,
            jobId: data.job_id || n.job_id,
          });
        }
        break;

      case 'complete_profile':
        if (onNavigate) {
          onNavigate('ClientEditProfile');
        }
        break;

      default:
        // Default: go back and show alert
        onBack();
        Alert.alert(
          n.title || 'Notification',
          n.message || 'View details in the app.'
        );
        break;
    }
  };

  // Handle hardware back button in detail view
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, [onBack]);

  const formatDate = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getDisplayName = (sender) => {
    if (!sender) return 'Taskra System';
    if (sender.company_name) return sender.company_name;
    if (sender.first_name && sender.last_name) {
      return `${sender.first_name} ${sender.last_name}`;
    }
    return sender.username || 'Unknown User';
  };

  const senderName = n.sender ? getDisplayName(n.sender) : 'Taskra System';

  return (
    <SafeAreaView style={ds.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={ds.header}>
        <TouchableOpacity style={ds.backBtn} onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={ds.headerTitle} numberOfLines={1}>{n.title || 'Notification'}</Text>
        <TouchableOpacity style={ds.deleteBtn} onPress={handleDelete} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={18} color={WHITE} />
        </TouchableOpacity>
      </View>

      <ScrollView style={ds.scroll} contentContainerStyle={ds.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={ds.subjectCard}>
          <View style={[ds.typeIcon, { backgroundColor: typeColors.bg }]}>
            <Ionicons name={typeColors.icon} size={24} color={typeColors.color} />
          </View>
          <View style={ds.subjectMeta}>
            <Text style={ds.subjectText}>{n.title}</Text>
            <View style={[ds.tag, { backgroundColor: typeColors.bg, borderColor: typeColors.color + '40' }]}>
              <Text style={[ds.tagText, { color: typeColors.color }]}>
                {n.type?.replace('_', ' ').toUpperCase() || 'NOTIFICATION'}
              </Text>
            </View>
          </View>
        </View>

        <View style={ds.metaCard}>
          <View style={ds.senderRow}>
            {n.sender?.profile_picture ? (
              <Image source={{ uri: n.sender.profile_picture }} style={ds.avatarImage} />
            ) : (
              <View style={[ds.avatar, { backgroundColor: avatarBg || NAVY }]}>
                <Text style={ds.avatarText}>{senderInitials}</Text>
              </View>
            )}
            <View style={ds.senderMeta}>
              <Text style={ds.senderName}>{senderName}</Text>
              <Text style={ds.dateText}>{formatDate(n.created_at || n.createdAt)}</Text>
            </View>
          </View>

          <View style={ds.innerDivider} />
          <View style={ds.toRow}>
            <Text style={ds.toLabel}>To</Text>
            <View style={ds.toChip}>
              <Ionicons name="person-circle-outline" size={14} color={GOLD} />
              <Text style={ds.toName}>You</Text>
            </View>
          </View>
        </View>

        <View style={ds.bodyCard}>
          {n.message ? (
            <Text style={ds.bodyText}>{n.message}</Text>
          ) : null}
        </View>

        {n.actions && n.actions.length > 0 && (
          <View style={ds.actionsCard}>
            <Text style={ds.actionsLabel}>Quick Actions</Text>
            <View style={ds.actionsWrap}>
              {n.actions.map((a, i) => (
                <TouchableOpacity
                  key={i}
                  style={[ds.actionBtn, { backgroundColor: typeColors.bg, borderColor: typeColors.color + '35' }]}
                  activeOpacity={0.75}
                  onPress={() => handleActionPress(a)}
                >
                  <Ionicons name={a.icon || 'arrow-forward-outline'} size={15} color={typeColors.color} />
                  <Text style={[ds.actionText, { color: typeColors.color }]}>{a.label || 'View'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!n.is_read && (
          <TouchableOpacity style={ds.markReadBtn} onPress={handleMarkRead} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle-outline" size={18} color={WHITE} />
            <Text style={ds.markReadText}>Mark as Read</Text>
          </TouchableOpacity>
        )}

        <View style={ds.footer}>
          <Ionicons name="shield-checkmark-outline" size={12} color={TEXT_MUTED} />
          <Text style={ds.footerText}>Taskra Notification</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ClientNotifications({ onNavigate }) {
  const dispatch = useDispatch();

  const {
    notifications,
    selectedNotification,
    isLoading,
    error,
    totalCount,
    totalPages,
    unreadCount,
    markSuccess,
    deleteSuccess,
    countsLoaded,
  } = useSelector((state) => state.notifications);

  const { token } = useSelector((state) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showDetail, setShowDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load notifications on mount
  useEffect(() => {
    if (token && !initialLoadDone) {
      loadNotifications();
      dispatch(getNotificationCounts());
      setInitialLoadDone(true);
    }
  }, [token, initialLoadDone, dispatch]);

  // Handle hardware back button press - navigate back to ClientDashboard
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If in detail view, close it first
      if (showDetail) {
        handleBack();
        return true;
      }
      // Otherwise navigate back to ClientDashboard
      if (onNavigate) {
        onNavigate('ClientDashboard');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [onNavigate, showDetail]);

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
        setShowDetail(false);
      }
    }
  }, [deleteSuccess, dispatch, selectedNotification]);

  const loadNotifications = useCallback(() => {
    if (token) {
      dispatch(getNotifications({ page: 1, limit: 20 }));
    }
  }, [dispatch, token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      dispatch(getNotifications({ page: 1, limit: 20 })),
      dispatch(getNotificationCounts()),
    ]).finally(() => {
      setRefreshing(false);
      setPage(1);
    });
  }, [dispatch]);

  const loadMore = useCallback(() => {
    if (loadingMore || page >= totalPages || !token) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    dispatch(getNotifications({ page: nextPage, limit: 20 }))
      .finally(() => {
        setLoadingMore(false);
        setPage(nextPage);
      });
  }, [dispatch, page, totalPages, loadingMore, token]);

  const handleMarkRead = useCallback((notificationId) => {
    if (token) {
      dispatch(markNotificationAsRead(notificationId));
    }
  }, [dispatch, token]);

  const handleMarkAllRead = useCallback(() => {
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
          text: 'Mark All Read',
          onPress: () => {
            dispatch(markAllNotificationsAsRead());
            dispatch(resetUnreadCount());
          },
        },
      ]
    );
  }, [dispatch, unreadCount]);

  const handleDeleteAll = useCallback(() => {
    if (notifications.length === 0) {
      Alert.alert('Empty', 'You have no notifications to delete.');
      return;
    }
    Alert.alert(
      'Delete All Notifications',
      `Delete all ${notifications.length} notifications? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteAllNotifications({}));
          },
        },
      ]
    );
  }, [dispatch, notifications.length]);

  const handleDelete = useCallback((notificationId) => {
    if (token) {
      dispatch(deleteNotification(notificationId));
    }
  }, [dispatch, token]);

  const handleSelect = useCallback((notification) => {
    dispatch(setSelectedNotification(notification));
    setShowDetail(true);
    if (!notification.is_read) {
      handleMarkRead(notification._id);
    }
  }, [dispatch, handleMarkRead]);

  const handleBack = useCallback(() => {
    setShowDetail(false);
    dispatch(clearSelectedNotification());
  }, [dispatch]);

  const handleNavigateBack = useCallback(() => {
    if (onNavigate) {
      onNavigate('ClientDashboard');
    }
  }, [onNavigate]);

  const getFilteredNotifications = useCallback(() => {
    const filter = FILTERS.find(f => f.key === activeFilter);
    if (!filter) return notifications;

    if (filter.key === 'All') return notifications;
    if (filter.key === 'Unread') return notifications.filter(n => !n.is_read);
    if (filter.type) return notifications.filter(n => n.type === filter.type);
    return notifications;
  }, [notifications, activeFilter]);

  const getGroupedNotifications = useCallback(() => {
    const filtered = getFilteredNotifications();
    const groups = {};

    filtered.forEach(n => {
      const date = new Date(n.created_at || n.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key;
      if (date >= today) key = 'today';
      else if (date >= yesterday) key = 'yesterday';
      else key = 'older';

      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    return groups;
  }, [getFilteredNotifications]);

  const getTypeColor = (type) => {
    return TYPE_COLORS[type] || { bg: BLUE_SOFT, color: BLUE, icon: 'notifications-outline' };
  };

  const getInitials = (sender) => {
    if (!sender) return 'U';
    if (sender.company_name) return sender.company_name.substring(0, 2).toUpperCase();
    if (sender.first_name && sender.last_name) {
      return `${sender.first_name[0]}${sender.last_name[0]}`.toUpperCase();
    }
    if (sender.username) return sender.username.substring(0, 2).toUpperCase();
    return 'U';
  };

  const getSenderName = (sender) => {
    if (!sender) return 'Taskra System';
    if (sender.company_name) return sender.company_name;
    if (sender.first_name && sender.last_name) {
      return `${sender.first_name} ${sender.last_name}`;
    }
    if (sender.username) return sender.username;
    return 'Unknown User';
  };

  const renderNotificationRow = (n, isLast) => {
    const typeColor = getTypeColor(n.type);
    const isUnread = !n.is_read;
    const displayName = getSenderName(n.sender);

    return (
      <TouchableOpacity
        key={n._id}
        style={[s.row, isUnread && s.rowUnread, isLast && s.rowLast]}
        onPress={() => handleSelect(n)}
        activeOpacity={0.72}
      >
        {isUnread && <View style={[s.unreadBar, { backgroundColor: typeColor.color }]} />}

        <View style={[s.avatar, { backgroundColor: typeColor.color }]}>
          <Ionicons name={typeColor.icon} size={18} color={WHITE} />
        </View>

        <View style={s.body}>
          <View style={s.rowTop}>
            <Text style={[s.sender, isUnread && s.senderBold]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={s.time}>
              {(() => {
                try {
                  const d = new Date(n.created_at || n.createdAt);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } catch {
                  return '';
                }
              })()}
            </Text>
          </View>
          <Text style={[s.title, isUnread && s.titleBold]} numberOfLines={1}>
            {n.title}
          </Text>
          <Text style={s.preview} numberOfLines={2}>
            {n.message}
          </Text>
          <View style={[s.tag, { backgroundColor: typeColor.bg, borderColor: typeColor.color + '30' }]}>
            <Text style={[s.tagText, { color: typeColor.color }]}>
              {n.type?.replace('_', ' ').toUpperCase() || 'NOTIFICATION'}
            </Text>
          </View>
        </View>

        {isUnread && <View style={[s.dot, { backgroundColor: typeColor.color }]} />}
      </TouchableOpacity>
    );
  };

  // If showing detail
  if (showDetail && selectedNotification) {
    return (
      <NotificationDetail
        notification={selectedNotification}
        onBack={handleBack}
        onMarkRead={handleMarkRead}
        onDelete={handleDelete}
        onNavigate={onNavigate}
      />
    );
  }

  const grouped = getGroupedNotifications();
  const sectionKeys = Object.keys(grouped);

  // Show loading only on initial load, not when refreshing
  const showLoading = isLoading && notifications.length === 0 && !refreshing;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={handleNavigateBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={WHITE} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={s.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={s.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.75}>
              <Ionicons name="checkmark-done-outline" size={14} color={GOLD_LT} />
              <Text style={s.markAllText}>Mark read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={s.deleteAllBtn} onPress={handleDeleteAll} activeOpacity={0.75}>
              <Ionicons name="trash-outline" size={16} color={RED} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {FILTERS.map(f => {
            const active = activeFilter === f.key;
            const count = f.key === 'Unread' ? unreadCount :
                         f.type ? notifications.filter(n => n.type === f.type).length :
                         notifications.length;
            return (
              <TouchableOpacity
                key={f.key}
                style={[s.filterChip, active && s.filterChipActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.75}
              >
                <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[s.chipBadge, active && s.chipBadgeActive]}>
                    <Text style={[s.chipBadgeText, active && s.chipBadgeTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {showLoading ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={s.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView
          style={s.list}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BLUE}
              colors={[BLUE]}
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (layoutMeasurement + contentOffset.y >= contentSize.height - 20) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {sectionKeys.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={40} color={TEXT_MUTED} />
              </View>
              <Text style={s.emptyTitle}>Nothing here</Text>
              <Text style={s.emptyBody}>
                {activeFilter === 'All' ? 'No notifications yet.' : `No ${activeFilter.toLowerCase()} notifications.`}
              </Text>
            </View>
          ) : (
            sectionKeys.map(sk => (
              <View key={sk}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionLabel}>{SECTION_LABELS[sk] || sk}</Text>
                  <View style={s.sectionLine} />
                </View>
                {grouped[sk].map((n, idx) => renderNotificationRow(n, idx === grouped[sk].length - 1))}
              </View>
            ))
          )}

          {loadingMore && (
            <View style={s.loadingMore}>
              <ActivityIndicator size="small" color={BLUE} />
              <Text style={s.loadingMoreText}>Loading more...</Text>
            </View>
          )}

          {notifications.length > 0 && totalCount > notifications.length && !loadingMore && (
            <TouchableOpacity style={s.loadMoreBtn} onPress={loadMore} activeOpacity={0.8}>
              <Text style={s.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Only show error if not a counts error */}
      {error && error.code !== 'COUNTS_ERROR' && (
        <View style={s.errorContainer}>
          <Ionicons name="alert-circle-outline" size={16} color={RED} />
          <Text style={s.errorText}>{typeof error === 'string' ? error : error.message || 'An error occurred'}</Text>
          <TouchableOpacity onPress={() => dispatch(clearNotificationError())}>
            <Ionicons name="close-outline" size={16} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: NAVY,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: WHITE, letterSpacing: -0.3 },
  headerBadge: {
    backgroundColor: GOLD, borderRadius: 10,
    minWidth: 22, height: 20, paddingHorizontal: 6,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 3,
  },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: WHITE },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(212,160,23,0.14)', borderRadius: 18,
    paddingHorizontal: 11, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(212,160,23,0.3)',
  },
  markAllText: { fontSize: 11.5, fontWeight: '600', color: GOLD_LT },
  deleteAllBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(185,28,28,0.14)',
    borderWidth: 1, borderColor: 'rgba(185,28,28,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  filterBar: { backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: DIVIDER },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 11, gap: 8, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: DIVIDER, backgroundColor: WHITE,
  },
  filterChipActive: {
    backgroundColor: NAVY, borderColor: NAVY,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  filterChipText: { fontSize: 13, fontWeight: '500', color: TEXT_MED },
  filterChipTextActive: { color: WHITE, fontWeight: '600' },
  chipBadge: {
    backgroundColor: BLUE_SOFT, borderRadius: 8,
    minWidth: 18, height: 17, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  chipBadgeActive: { backgroundColor: 'rgba(212,160,23,0.22)' },
  chipBadgeText: { fontSize: 10, fontWeight: '700', color: BLUE },
  chipBadgeTextActive: { color: GOLD_LT },
  list: { flex: 1, backgroundColor: BG },
  listContent: { paddingTop: 6 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10, gap: 10,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: TEXT_MUTED,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: DIVIDER },
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: SURFACE, marginHorizontal: 12, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1, borderColor: DIVIDER,
    position: 'relative', overflow: 'hidden',
    shadowColor: '#0D1B2A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  rowUnread: {
    backgroundColor: WHITE, borderColor: '#D0DFF5',
    shadowColor: '#1A56DB', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  rowLast: { marginBottom: 6 },
  unreadBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, marginTop: 2, flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: WHITE },
  body: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sender: { fontSize: 13.5, fontWeight: '600', color: TEXT_DARK, flex: 1, marginRight: 8 },
  senderBold: { color: TEXT_DARK, fontWeight: '700' },
  time: { fontSize: 10.5, color: TEXT_MUTED, flexShrink: 0 },
  title: { fontSize: 12.5, fontWeight: '400', color: TEXT_MUTED, marginBottom: 3 },
  titleBold: { fontWeight: '600', color: TEXT_MED },
  preview: { fontSize: 12, color: TEXT_MUTED, lineHeight: 17, marginBottom: 9 },
  tag: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2, textTransform: 'uppercase' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginLeft: 8, flexShrink: 0 },
  empty: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 40 },
  emptyIcon: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: SURFACE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: DIVIDER, marginBottom: 18,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: TEXT_DARK, marginBottom: 6 },
  emptyBody: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 19 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 12,
    marginTop: 4,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DIVIDER,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: BLUE,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RED_SOFT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: RED + '30',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: RED,
  },
});

// ── Detail Screen Styles ─────────────────────────────────────────────────────
const ds = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: NAVY,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 14.5, fontWeight: '600', color: WHITE, flex: 1, marginHorizontal: 10, textAlign: 'center' },
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, gap: 12 },
  subjectCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: SURFACE, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: DIVIDER, gap: 14,
    shadowColor: '#0D1B2A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  typeIcon: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  subjectMeta: { flex: 1, gap: 9 },
  subjectText: { fontSize: 16, fontWeight: '700', color: TEXT_DARK, lineHeight: 22 },
  tag: {
    alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 7, borderWidth: 1,
  },
  tagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  metaCard: {
    backgroundColor: SURFACE, borderRadius: 16,
    borderWidth: 1, borderColor: DIVIDER, overflow: 'hidden',
    shadowColor: '#0D1B2A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  senderRow: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: {
    width: 44, height: 44, borderRadius: 22,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: WHITE },
  senderMeta: { flex: 1, gap: 2 },
  senderName: { fontSize: 13.5, fontWeight: '700', color: TEXT_DARK },
  dateText: { fontSize: 11, color: TEXT_MUTED },
  innerDivider: { height: 1, backgroundColor: DIVIDER, marginHorizontal: 15 },
  toRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 15, paddingVertical: 12, gap: 10,
  },
  toLabel: { fontSize: 11, fontWeight: '600', color: TEXT_MUTED, width: 24 },
  toChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GOLD_SOFT, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: GOLD + '30',
  },
  toName: { fontSize: 12, fontWeight: '600', color: GOLD },
  bodyCard: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: DIVIDER,
    shadowColor: '#0D1B2A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  bodyText: { fontSize: 14, color: TEXT_MED, lineHeight: 23 },
  actionsCard: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: DIVIDER,
    shadowColor: '#0D1B2A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  actionsLabel: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  actionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
  markReadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: BLUE, borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1, borderColor: BLUE_DK,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  markReadText: { fontSize: 14.5, fontWeight: '700', color: WHITE },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: SURFACE, borderRadius: 12, padding: 13,
    borderWidth: 1, borderColor: DIVIDER,
  },
  footerText: { fontSize: 10.5, color: TEXT_MUTED, flex: 1, lineHeight: 15 },
});