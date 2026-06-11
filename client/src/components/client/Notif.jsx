import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

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
const WHITE      = '#FFFFFF';
const BG         = '#EEF4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const GREEN      = '#059669';
const GREEN_SOFT = '#D1FAE5';
const RED        = '#DC2626';
const RED_SOFT   = '#FEF2F2';
const RED_BORDER = '#FECACA';
const ORANGE     = '#F97316';
const ORANGE_SOFT= '#FFF7ED';
// ─────────────────────────────────────────────────────────────────────────────────

// Mock notifications data
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'application',
    title: 'New Application Received',
    message: 'Maria Santos applied for UI/UX Designer position',
    time: '5 minutes ago',
    read: false,
    jobId: 'job1',
    applicantId: 'user1',
    icon: 'person-add-outline',
    color: BLUE,
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message',
    message: 'Carlo Reyes sent you a message about the Brand Designer job',
    time: '1 hour ago',
    read: false,
    senderId: 'user2',
    icon: 'chatbubble-outline',
    color: GOLD,
  },
  {
    id: '3',
    type: 'offer',
    title: 'Offer Accepted',
    message: 'Juan dela Cruz has accepted your job offer',
    time: '3 hours ago',
    read: true,
    jobId: 'job3',
    freelancerId: 'user3',
    icon: 'checkmark-circle-outline',
    color: GREEN,
  },
  {
    id: '4',
    type: 'interview',
    title: 'Interview Scheduled',
    message: 'Interview with John Smith scheduled for tomorrow at 2:00 PM',
    time: 'Yesterday',
    read: true,
    interviewId: 'int1',
    icon: 'calendar-outline',
    color: ORANGE,
  },
  {
    id: '5',
    type: 'system',
    title: 'Profile Verification',
    message: 'Your company profile has been verified successfully',
    time: '2 days ago',
    read: true,
    icon: 'shield-checkmark-outline',
    color: GREEN,
  },
  {
    id: '6',
    type: 'payment',
    title: 'Payment Received',
    message: 'Payment of ₱15,000 has been received for Project Alpha',
    time: '3 days ago',
    read: true,
    transactionId: 'txn1',
    icon: 'cash-outline',
    color: GREEN,
  },
  {
    id: '7',
    type: 'review',
    title: 'New Review',
    message: 'Maria Santos left a 5-star review for your project',
    time: '5 days ago',
    read: true,
    jobId: 'job1',
    icon: 'star-outline',
    color: GOLD,
  },
  {
    id: '8',
    type: 'job',
    title: 'Job Posting Expiring Soon',
    message: 'Your job "Senior React Developer" will expire in 3 days',
    time: '6 days ago',
    read: true,
    jobId: 'job4',
    icon: 'alert-circle-outline',
    color: ORANGE,
  },
];

const FILTERS = ['All', 'Unread', 'Applications', 'Messages', 'System'];

export default function Notifications({ onNavigate }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showMarkAllRead, setShowMarkAllRead] = useState(false);

  useEffect(() => {
    // Check if there are unread notifications to show "Mark all as read" button
    const hasUnread = notifications.some(n => !n.read);
    setShowMarkAllRead(hasUnread);
  }, [notifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: () => {
            setNotifications(prev =>
              prev.map(notif => ({ ...notif, read: true }))
            );
            setShowMarkAllRead(false);
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification) => {
    // Mark as read when pressed
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'application':
        if (notification.jobId) {
          onNavigate('MyPostings', { highlightJob: notification.jobId });
        }
        break;
      case 'message':
        if (notification.senderId) {
          onNavigate('Messages', { userId: notification.senderId });
        }
        break;
      case 'offer':
      case 'interview':
        onNavigate('MyPostings');
        break;
      case 'job':
        if (notification.jobId) {
          onNavigate('MyPostings', { highlightJob: notification.jobId });
        }
        break;
      case 'payment':
        onNavigate('PaymentHistory');
        break;
      default:
        // Just close the notification
        break;
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (activeFilter === 'Unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeFilter === 'Applications') {
      filtered = filtered.filter(n => n.type === 'application');
    } else if (activeFilter === 'Messages') {
      filtered = filtered.filter(n => n.type === 'message');
    } else if (activeFilter === 'System') {
      filtered = filtered.filter(n => ['system', 'payment', 'review', 'job'].includes(n.type));
    }

    return filtered;
  };

  const getTimeAgo = (time) => {
    return time;
  };

  const getIconBackground = (type) => {
    switch (type) {
      case 'application':
        return `${BLUE}15`;
      case 'message':
        return `${GOLD}15`;
      case 'offer':
        return `${GREEN}15`;
      case 'interview':
        return `${ORANGE}15`;
      case 'payment':
        return `${GREEN}15`;
      case 'review':
        return `${GOLD}15`;
      case 'job':
        return `${ORANGE}15`;
      default:
        return `${BLUE}10`;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={s.root}>
        {/* ── Top bar ── */}
        <View style={s.topbar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => onNavigate('ClientDashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </TouchableOpacity>
          <Text style={s.topbarTitle}>Notifications</Text>
          {showMarkAllRead && unreadCount > 0 && (
            <TouchableOpacity
              style={s.markAllBtn}
              onPress={markAllAsRead}
              activeOpacity={0.7}
            >
              <Text style={s.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {!showMarkAllRead && <View style={s.placeholder} />}
        </View>

        {/* ── Filter tabs ── */}
        <View style={s.filterTabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterTabsScroll}
          >
            {FILTERS.map(filter => {
              const active = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[s.filterTab, active && s.filterTabActive]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.filterTabText, active && s.filterTabTextActive]}>
                    {filter}
                  </Text>
                  {filter === 'Unread' && unreadCount > 0 && (
                    <View style={s.filterBadge}>
                      <Text style={s.filterBadgeText}>{unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Notifications list ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BLUE}
            />
          }
        >
          {filteredNotifications.length === 0 ? (
            <View style={s.emptyContainer}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={48} color={TEXT_LIGHT} />
              </View>
              <Text style={s.emptyTitle}>No notifications</Text>
              <Text style={s.emptyDesc}>
                {activeFilter === 'All'
                  ? "You don't have any notifications yet"
                  : `No ${activeFilter.toLowerCase()} notifications found`}
              </Text>
            </View>
          ) : (
            filteredNotifications.map(notification => (
              <TouchableOpacity
                key={notification.id}
                style={[s.notifCard, !notification.read && s.notifCardUnread]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={[s.notifIcon, { backgroundColor: getIconBackground(notification.type) }]}>
                  <Ionicons name={notification.icon} size={22} color={notification.color} />
                </View>
                <View style={s.notifContent}>
                  <View style={s.notifHeader}>
                    <Text style={[s.notifTitle, !notification.read && s.notifTitleUnread]}>
                      {notification.title}
                    </Text>
                    <Text style={s.notifTime}>{getTimeAgo(notification.time)}</Text>
                  </View>
                  <Text style={[s.notifMessage, !notification.read && s.notifMessageUnread]}>
                    {notification.message}
                  </Text>
                </View>
                {!notification.read && <View style={s.unreadDot} />}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: BG },

  // Top bar
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: NAVY,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: -0.3,
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${GOLD}20`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${GOLD}40`,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: GOLD_LT,
  },
  placeholder: {
    width: 80,
  },

  // Filter tabs
  filterTabsWrap: {
    backgroundColor: CARD,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  filterTabsScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  filterTabActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  filterTabTextActive: {
    color: WHITE,
  },
  filterBadge: {
    backgroundColor: BLUE,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: WHITE,
  },

  scroll: {
    padding: 16,
    paddingBottom: 24,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    backgroundColor: `${BLUE}10`,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Notification card
  notifCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  notifCardUnread: {
    backgroundColor: `${BLUE}04`,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
  },
  notifIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
    flex: 1,
  },
  notifTitleUnread: {
    color: TEXT_MAIN,
    fontWeight: '700',
  },
  notifTime: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginLeft: 8,
  },
  notifMessage: {
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  notifMessageUnread: {
    color: TEXT_MAIN,
    fontWeight: '500',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
  },
});