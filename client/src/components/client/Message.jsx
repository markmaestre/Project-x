// screens/MessagesScreen.jsx - WITH DEBUGGING

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  clearMessages,
  clearError,
} from '../../Redux/slices/messageSlice';

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

// ── Chat Detail Screen Component ─────────────────────────────────────────────
function ChatDetailScreen({ conversation, onBack, userRole, onNavigate }) {
  const dispatch = useDispatch();
  const { currentMessages, sending, currentOtherUser } = useSelector((state) => state.messages);
  const { user } = useSelector((state) => state.auth);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Log user data for debugging
  console.log('Current user:', user?._id || user?.id);
  console.log('Current messages:', currentMessages.length);

  // Get current user ID
  const currentUserId = user?._id || user?.id;

  // Load messages when conversation is selected
  useEffect(() => {
    if (conversation?.other_user_id) {
      console.log('Loading messages for user:', conversation.other_user_id);
      dispatch(getMessages(conversation.other_user_id));
      dispatch(markAsRead(conversation.other_user_id));
    }

    return () => {
      dispatch(clearMessages());
    };
  }, [dispatch, conversation]);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

  const sendMessageHandler = () => {
    if (message.trim() && conversation?.other_user_id) {
      console.log('Sending message:', message.trim());
      dispatch(sendMessage({
        receiverId: conversation.other_user_id,
        message: message.trim()
      }));
      setMessage('');
    }
  };

  // FIXED: Render message with proper user identification and debugging
  const renderMessage = ({ item, index }) => {
    // Log each message for debugging
    console.log(`Message ${index}:`, {
      id: item._id,
      sent: item.sent,
      is_sender: item.is_sender,
      sender_id: item.sender_id,
      currentUserId: currentUserId,
      message: item.message?.substring(0, 20)
    });

    // Check if message is from current user using multiple methods
    const isMyMessage = 
      item.sent === true || 
      item.is_sender === true ||
      item.sender_id === 'me' ||
      (item.sender_id && currentUserId && item.sender_id.toString() === currentUserId.toString());

    console.log(`Message ${index} isMyMessage:`, isMyMessage);

    return (
      <View style={[
        styles.messageRow,
        isMyMessage ? styles.myMessageRow : styles.theirMessageRow
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.theirMessage
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.message || item.text || 'Message'}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
            {isMyMessage && (
              <Ionicons 
                name={item.is_read ? 'checkmark-done' : 'checkmark'} 
                size={12} 
                color={TEXT_LIGHT} 
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const getAvatarColor = (name) => {
    const colors = ['#4ade80', GOLD, '#60a5fa', '#ec489a', '#8b5cf6', '#f97316', '#14b8a6'];
    const index = name?.length % colors.length || 0;
    return colors[index];
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = conversation?.other_user?.first_name 
    ? `${conversation.other_user.first_name} ${conversation.other_user.last_name || ''}`.trim()
    : conversation?.other_user?.company_name || 
      conversation?.other_user?.username || 
      currentOtherUser?.name ||
      'User';

  const avatarColor = getAvatarColor(displayName);
  const initials = getInitials(displayName);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <View style={styles.chatAvatarWrap}>
            <View style={[styles.chatAvatar, { backgroundColor: `${avatarColor}22` }]}>
              <Text style={[styles.chatAvatarText, { color: avatarColor }]}>
                {initials}
              </Text>
            </View>
            {conversation?.other_user?.online && <View style={styles.chatOnlineDot} />}
          </View>
          <View>
            <Text style={styles.chatHeaderName}>{displayName}</Text>
            <Text style={styles.chatHeaderRole}>
              {conversation?.other_user?.role || conversation?.other_user?.user_type || 'User'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.chatMenuBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {currentMessages.length === 0 ? (
        <View style={styles.emptyMessages}>
          <Ionicons name="chatbubbles-outline" size={48} color={TEXT_LIGHT} />
          <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
          <Text style={styles.emptyMessagesSubtitle}>
            Send a message to start the conversation
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentMessages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => {
                setRefreshing(true);
                dispatch(getMessages(conversation.other_user_id)).finally(() => {
                  setRefreshing(false);
                });
              }} 
              tintColor={BLUE}
            />
          }
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
            <Ionicons name="attach-outline" size={24} color={GOLD} />
          </TouchableOpacity>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor={TEXT_LIGHT}
              value={message}
              onChangeText={setMessage}
              multiline
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendBtn, (!message.trim() || sending) && styles.sendBtnDisabled]} 
            onPress={sendMessageHandler}
            activeOpacity={0.7}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={GOLD} />
            ) : (
              <Ionicons name="send" size={20} color={message.trim() ? GOLD : TEXT_LIGHT} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Main Messages Screen Component ──────────────────────────────────────────
export default function MessagesScreen({ onNavigate, userRole = 'client' }) {
  const dispatch = useDispatch();
  const { conversations, isLoading, error, totalUnread } = useSelector((state) => state.messages);
  const { token, user } = useSelector((state) => state.auth);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeBottomTab, setActiveBottomTab] = useState('Message');
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Log auth state for debugging
  console.log('Auth token exists:', !!token);
  console.log('User ID:', user?._id || user?.id);

  // Load conversations on mount
  useEffect(() => {
    if (token && !initialLoadDone) {
      console.log('Loading conversations...');
      dispatch(getConversations());
      setInitialLoadDone(true);
    }
  }, [dispatch, token, initialLoadDone]);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onNavigate) {
        if (userRole === 'freelancer') {
          onNavigate('FreelancerDashboard');
        } else {
          onNavigate('ClientDashboard');
        }
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [onNavigate, userRole]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getConversations()).finally(() => {
      setRefreshing(false);
    });
  }, [dispatch]);

  // Handle bottom tab navigation
  const handleTabPress = (key) => {
    setActiveBottomTab(key);
    if (key === 'Home') onNavigate('ClientDashboard');
    if (key === 'PostJob') onNavigate('PostJob');
    if (key === 'Hiredtalents') onNavigate('Hiredtalents');
    if (key === 'Message') onNavigate('Message');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  // Filter conversations
  const getFilteredConversations = useCallback(() => {
    let filtered = conversations || [];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((c) => {
        const name = c.other_user?.first_name 
          ? `${c.other_user.first_name} ${c.other_user.last_name || ''}`.toLowerCase()
          : c.other_user?.company_name?.toLowerCase() || 
            c.other_user?.username?.toLowerCase() || '';
        return name.includes(searchLower);
      });
    }

    if (activeTab === 'unread') {
      filtered = filtered.filter((c) => (c.unread_count || 0) > 0);
    }

    return filtered;
  }, [conversations, search, activeTab]);

  const filtered = getFilteredConversations();

  // If a chat is selected, show the chat detail screen
  if (selectedChat) {
    return (
      <ChatDetailScreen 
        conversation={selectedChat}
        onBack={() => setSelectedChat(null)}
        userRole={userRole}
        onNavigate={onNavigate}
      />
    );
  }

  // Show loading state
  if (isLoading && !initialLoadDone) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !initialLoadDone) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={RED} />
          <Text style={styles.errorTitle}>Failed to load messages</Text>
          <Text style={styles.errorSubtitle}>
            {typeof error === 'string' ? error : error.message || 'Please try again'}
          </Text>
          <TouchableOpacity 
            style={styles.retryBtn} 
            onPress={() => {
              dispatch(clearError());
              dispatch(getConversations());
            }}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <View style={styles.topbar}>
          <Text style={styles.topbarTitle}>Messages</Text>
          <View style={styles.topbarActions}>
            {totalUnread > 0 && (
              <View style={styles.unreadCountBadge}>
                <Text style={styles.unreadCountBadgeText}>{totalUnread}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.composeBtn} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={18} color={GOLD} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={TEXT_LIGHT} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={TEXT_LIGHT}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={TEXT_LIGHT} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.activeTab]} 
            onPress={() => setActiveTab('all')}
          >
            <Ionicons name="chatbubbles-outline" size={14} color={activeTab === 'all' ? BLUE : TEXT_LIGHT} />
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'unread' && styles.activeTab]} 
            onPress={() => setActiveTab('unread')}
          >
            <Ionicons name="mail-unread-outline" size={14} color={activeTab === 'unread' ? BLUE : TEXT_LIGHT} />
            <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>Unread</Text>
            {totalUnread > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{totalUnread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Conversations List */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={TEXT_LIGHT} />
              <Text style={styles.emptyStateTitle}>No messages yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                {userRole === 'freelancer' 
                  ? 'When clients message you, they will appear here' 
                  : 'Start a conversation with a freelancer'}
              </Text>
            </View>
          ) : (
            filtered.map((item) => {
              const user = item.other_user || {};
              const displayName = user.first_name 
                ? `${user.first_name} ${user.last_name || ''}`.trim()
                : user.company_name || user.username || 'User';
              
              const initials = displayName.substring(0, 2).toUpperCase();
              const colors = ['#4ade80', GOLD, '#60a5fa', '#ec489a', '#8b5cf6', '#f97316', '#14b8a6'];
              const colorIndex = displayName.length % colors.length;
              const avatarColor = colors[colorIndex];
              
              const lastMsg = item.last_message?.message || 
                             item.last_message?.text || 
                             'No messages yet';
              
              const time = item.last_message?.created_at 
                ? new Date(item.last_message.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '';
              
              const unread = item.unread_count || 0;

              return (
                <TouchableOpacity 
                  key={item._id || item.id || Math.random().toString()} 
                  style={styles.convoCard} 
                  onPress={() => setSelectedChat(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.avatarWrap}>
                    <View style={[styles.avatar, { backgroundColor: `${avatarColor}22` }]}>
                      <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
                    </View>
                    {user.online && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.convoInfo}>
                    <View style={styles.convoTop}>
                      <Text style={styles.convoName}>{displayName}</Text>
                      <Text style={styles.convoTime}>{time}</Text>
                    </View>
                    <View style={styles.convoBottom}>
                      <Ionicons name="briefcase-outline" size={10} color={BLUE} />
                      <Text style={styles.convoRole} numberOfLines={1}>
                        {user.role || user.user_type || 'User'}
                      </Text>
                    </View>
                    <View style={styles.lastMsgContainer}>
                      <Ionicons name="chatbubble-outline" size={10} color={TEXT_LIGHT} />
                      <Text style={styles.lastMsg} numberOfLines={1}>{lastMsg}</Text>
                    </View>
                  </View>
                  {unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unread}</Text>
                    </View>
                  )}
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
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  root: { flex: 1, backgroundColor: BG },

  loadingContainer: {
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
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 14,
  },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: NAVY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: -0.3,
  },
  topbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadCountBadge: {
    backgroundColor: GOLD,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: WHITE,
  },
  composeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(200,149,32,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,149,32,0.25)',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: TEXT_MAIN,
    fontSize: 14,
    fontWeight: '400',
  },

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  activeTab: {
    backgroundColor: `${BLUE}10`,
    borderColor: BLUE,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_LIGHT,
  },
  activeTabText: {
    color: BLUE,
  },
  tabBadge: {
    backgroundColor: BLUE,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: WHITE,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 4,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginTop: 8,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },

  convoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: CARD,
  },
  convoInfo: {
    flex: 1,
    gap: 4,
  },
  convoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convoName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_MAIN,
    letterSpacing: -0.2,
  },
  convoTime: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  convoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  convoRole: {
    fontSize: 11,
    color: BLUE,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  lastMsgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  lastMsg: {
    fontSize: 12,
    color: TEXT_MUTED,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: WHITE,
  },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: NAVY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chatAvatarWrap: {
    position: 'relative',
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chatOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: NAVY,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  chatHeaderRole: {
    fontSize: 11,
    color: GOLD_LT,
    marginTop: 2,
  },
  chatMenuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyMessagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginTop: 12,
  },
  emptyMessagesSubtitle: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageRow: {
    marginBottom: 8,
  },
  myMessageRow: {
    alignItems: 'flex-end',
  },
  theirMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessage: {
    backgroundColor: BLUE,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: CARD,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: WHITE,
  },
  theirMessageText: {
    color: TEXT_MAIN,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: TEXT_LIGHT,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${GOLD}10`,
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  messageInput: {
    fontSize: 14,
    color: TEXT_MAIN,
    padding: 0,
    maxHeight: 80,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${GOLD}10`,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },

  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopWidth: 1.5,
    borderTopColor: BORDER,
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
    position: 'relative',
  },
  tabActiveBar: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    backgroundColor: BLUE,
    borderRadius: 999,
  },
  tabIconWrap: {
    position: 'relative',
    marginBottom: 3,
    marginTop: 6,
  },
  tabFab: {
    width: 44,
    height: 36,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    marginTop: 2,
    shadowColor: GOLD_DK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: GOLD_LT,
  },
  tabLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: BLUE,
    fontWeight: '700',
  },
  tabLabelPost: {
    color: GOLD,
    fontWeight: '700',
  },
});