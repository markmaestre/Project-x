import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'offer',
    title: 'New Offer Received!',
    message: 'TechCorp Solutions has sent you an offer for Senior Developer position',
    time: '2 minutes ago',
    read: false,
    icon: 'briefcase',
    iconColor: BLUE,
    action: 'view_offer',
    actionData: { offerId: 'off_001', jobTitle: 'Senior Developer' }
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message',
    message: 'Maria Santos: "Can we schedule a quick call about the project?"',
    time: '15 minutes ago',
    read: false,
    icon: 'chatbubble',
    iconColor: GREEN,
    action: 'open_chat',
    actionData: { userId: 'user_123', userName: 'Maria Santos' }
  },
  {
    id: '3',
    type: 'application',
    title: 'Application Viewed',
    message: 'Your application for UI/UX Designer at Creative Agency PH has been viewed',
    time: '1 hour ago',
    read: false,
    icon: 'eye',
    iconColor: BLUE,
    action: 'view_job',
    actionData: { jobId: 'job_456', jobTitle: 'UI/UX Designer' }
  },
  {
    id: '4',
    type: 'job',
    title: 'New Job Match',
    message: 'New job posted: Full Stack Developer at StartUp Manila',
    time: '3 hours ago',
    read: true,
    icon: 'briefcase',
    iconColor: GOLD,
    action: 'view_job',
    actionData: { jobId: 'job_789', jobTitle: 'Full Stack Developer' }
  },
  {
    id: '5',
    type: 'milestone',
    title: 'Milestone Completed',
    message: 'Client marked "Initial Design" as completed. Payment has been released.',
    time: '5 hours ago',
    read: true,
    icon: 'checkmark-circle',
    iconColor: GREEN,
    action: 'view_contract',
    actionData: { contractId: 'ctr_001' }
  },
  {
    id: '6',
    type: 'payment',
    title: 'Payment Received',
    message: 'You have received ₱15,000 from Digital Marketing Pro',
    time: 'Yesterday',
    read: true,
    icon: 'cash',
    iconColor: GREEN,
    action: 'view_transaction',
    actionData: { transactionId: 'txn_001', amount: 15000 }
  },
  {
    id: '7',
    type: 'review',
    title: 'New Review',
    message: 'Client left a 5-star review for your work on Mobile App project',
    time: 'Yesterday',
    read: true,
    icon: 'star',
    iconColor: GOLD,
    action: 'view_review',
    actionData: { reviewId: 'rev_001' }
  },
  {
    id: '8',
    type: 'offer',
    title: 'Offer Accepted',
    message: 'Client accepted your proposal for E-commerce Website project',
    time: '2 days ago',
    read: true,
    icon: 'checkmark-done',
    iconColor: GREEN,
    action: 'view_contract',
    actionData: { contractId: 'ctr_002' }
  },
  {
    id: '9',
    type: 'alert',
    title: 'Profile Completion',
    message: 'Complete your profile to get more job opportunities! Add your portfolio and certifications.',
    time: '3 days ago',
    read: true,
    icon: 'warning',
    iconColor: ORANGE,
    action: 'complete_profile',
    actionData: {}
  },
  {
    id: '10',
    type: 'system',
    title: 'Maintenance Notice',
    message: 'Scheduled maintenance on March 25, 2024 from 2AM to 4AM',
    time: '5 days ago',
    read: true,
    icon: 'build',
    iconColor: TEXT_MUTED,
    action: null,
    actionData: {}
  },
];

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: 'notifications-outline' },
  { key: 'unread', label: 'Unread', icon: 'mail-unread-outline' },
  { key: 'offers', label: 'Offers', icon: 'briefcase-outline' },
  { key: 'messages', label: 'Messages', icon: 'chatbubble-outline' },
];

function NotificationItem({ notification, onPress, onMarkRead }) {
  const getIconName = () => {
    switch (notification.type) {
      case 'offer': return 'briefcase-outline';
      case 'message': return 'chatbubble-outline';
      case 'application': return 'document-text-outline';
      case 'job': return 'briefcase-outline';
      case 'milestone': return 'checkmark-circle-outline';
      case 'payment': return 'cash-outline';
      case 'review': return 'star-outline';
      case 'alert': return 'alert-circle-outline';
      default: return 'notifications-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.read && styles.notificationUnread]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      {/* Unread dot — top-right corner, inside the card padding */}
      {!notification.read && <View style={styles.unreadDot} />}

      <View style={[styles.iconContainer, { backgroundColor: `${notification.iconColor}15` }]}>
        <Ionicons name={getIconName()} size={22} color={notification.iconColor} />
      </View>

      <View style={styles.contentContainer}>
        {/* Title row: title left, time right — both vertically centered */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, !notification.read && styles.titleUnread]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.time}>{notification.time}</Text>
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>

        {/* Action row only rendered when there's something to show */}
        {(notification.action || !notification.read) && (
          <View style={styles.actionRow}>
            {notification.action && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onPress(notification)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.actionButtonText}>View Details</Text>
                <Ionicons name="arrow-forward" size={12} color={BLUE} />
              </TouchableOpacity>
            )}

            {!notification.read && (
              <TouchableOpacity
                style={styles.markReadButton}
                onPress={() => onMarkRead(notification.id)}
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
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const getFilteredNotifications = () => {
    switch (activeFilter) {
      case 'unread':   return notifications.filter(n => !n.read);
      case 'offers':   return notifications.filter(n => n.type === 'offer');
      case 'messages': return notifications.filter(n => n.type === 'message');
      default:         return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationPress = (notification) => {
    if (!notification.read) markAsRead(notification.id);

    switch (notification.action) {
      case 'view_offer':
        Alert.alert('Offer Details', `View offer for ${notification.actionData?.jobTitle || 'position'}`, [{ text: 'OK' }]);
        break;
      case 'open_chat':
        onNavigate('Messages', { userId: notification.actionData?.userId, userName: notification.actionData?.userName });
        break;
      case 'view_job':
        Alert.alert('Job Details', `Viewing job: ${notification.actionData?.jobTitle}`);
        break;
      case 'view_contract':
        Alert.alert('Contract', 'View contract details');
        break;
      case 'view_transaction':
        Alert.alert('Transaction', `Amount: ₱${notification.actionData?.amount?.toLocaleString()}`);
        break;
      case 'complete_profile':
        onNavigate('FreelancerProfile');
        break;
      default:
        Alert.alert(notification.title, notification.message);
        break;
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    if (unreadCount === 0) return;
    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} unread notifications as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All', onPress: () => setNotifications(prev => prev.map(n => ({ ...n, read: true }))) },
      ]
    );
  };

  const clearAllNotifications = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => setNotifications([]) },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      setRefreshing(false);
    }, 1500);
  }, []);

  const getBadgeCount = (filter) => {
    if (filter === 'unread')   return unreadCount;
    if (filter === 'offers')   return notifications.filter(n => n.type === 'offer'   && !n.read).length;
    if (filter === 'messages') return notifications.filter(n => n.type === 'message' && !n.read).length;
    return 0;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIconWrap}
            onPress={() => onNavigate('FreelancerDashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Notifications</Text>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.headerActionBtn} onPress={markAllAsRead} activeOpacity={0.7}>
                <Ionicons name="checkmark-done-outline" size={20} color={GOLD} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerActionBtn} onPress={clearAllNotifications} activeOpacity={0.7}>
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
                  onPress={() => setActiveFilter(tab.key)}
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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
              onMarkRead={markAsRead}
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
              <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                <Ionicons name="checkmark-done-circle-outline" size={18} color={BLUE} />
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
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
    // fixed height so title never shifts
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
    flex: 1,                  // fill middle space
    textAlign: 'center',      // truly centered between back and actions
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // same width as backIconWrap so title stays centered
    width: 40 + 4 + 40,      // two buttons + gap
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
    // no paddingVertical here — controlled by filterTab height
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // fixed height so active border doesn't cause layout shift
    height: 48,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',   // always reserve the 2px
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
  // Badge sits inline (not absolute) so it never overlaps neighbor tabs
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
    alignItems: 'flex-start',    // icon top-aligns with text block
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',          // clips unread left-border properly
  },
  notificationUnread: {
    backgroundColor: `${BLUE}05`,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
  },
  // Unread dot — absolutely positioned inside the card
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
    // z above content so it isn't clipped by overflow:hidden
    zIndex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    // keeps icon vertically centered with first line of text
    marginTop: 1,
    flexShrink: 0,
  },
  contentContainer: {
    flex: 1,
    // right padding so text never goes under the unread dot
    paddingRight: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',        // vertically center title & time on same baseline
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
    flexShrink: 0,               // time never wraps or truncates
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
});