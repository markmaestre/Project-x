import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  FlatList, TextInput, Image, ActivityIndicator, 
  RefreshControl, Alert, StatusBar, BackHandler
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
  deleteConversation,
  setSelectedUser,
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

// ── Bottom Tab Bar ────────────────────────────────────────────────────────────────
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

// ── Chat Detail Component ──────────────────────────────────────────────────────
function ChatDetail({ conversation, onBack, userRole, onNavigate, user }) {
  const dispatch = useDispatch();
  const { currentMessages, sending } = useSelector((state) => state.messages);
  const [messageText, setMessageText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  const currentUserId = user?._id || user?.id;

  // Load messages when conversation is selected
  useEffect(() => {
    if (conversation?.other_user_id) {
      console.log('Loading messages for user:', conversation.other_user_id);
      dispatch(getMessages({ userId: conversation.other_user_id, limit: 50 }));
    }

    return () => {
      dispatch(clearMessages());
    };
  }, [dispatch, conversation]);

  // Handle hardware back button - goes back to conversation list
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

  const sendMessageHandler = async () => {
    if (!messageText.trim() || !conversation?.other_user_id) return;

    const receiverId = conversation.other_user_id;
    const receiverModel = conversation.user?.model || 
      (conversation.role === 'client' ? 'Client' : 'Freelancer');

    const messageContent = messageText.trim();
    
    setMessageText('');

    try {
      await dispatch(sendMessage({ 
        receiver_id: receiverId,
        receiver_model: receiverModel,
        message: messageContent
      })).unwrap();
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (conversation?.other_user_id) {
      await dispatch(getMessages({ userId: conversation.other_user_id, limit: 50 })).unwrap();
    }
    setRefreshing(false);
  }, [dispatch, conversation]);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const renderMessage = ({ item }) => {
    const isSent = item.sent === true || 
                   item.is_sender === true ||
                   item.sender_id === 'me' ||
                   (item.sender_id && currentUserId && item.sender_id.toString() === currentUserId.toString());

    return (
      <View style={[
        styles.messageWrapper,
        isSent ? styles.sentWrapper : styles.receivedWrapper
      ]}>
        <View style={[
          styles.messageBubble,
          isSent ? styles.sentBubble : styles.receivedBubble
        ]}>
          <Text style={[
            styles.messageText,
            isSent ? styles.sentMessageText : styles.receivedMessageText
          ]}>
            {item.message || item.text || 'Message'}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isSent && styles.sentMessageTime
            ]}>
              {formatTime(item.created_at)}
            </Text>
            {isSent && (
              <Ionicons 
                name={item.is_read ? 'checkmark-done' : 'checkmark'} 
                size={12} 
                color={item.is_read ? GOLD : 'rgba(255,255,255,0.5)'} 
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const userName = conversation?.user?.name || 
                   conversation?.other_user_name || 
                   'Unknown User';
  const userProfilePic = conversation?.user?.profile_picture || 
                         conversation?.other_user_profile_picture;
  const isOnline = conversation?.is_online || false;
  const userModel = conversation?.user?.model || 
                    conversation?.role || 
                    'User';

  const initials = getInitials(
    conversation?.user?.first_name || conversation?.other_user_first_name,
    conversation?.user?.last_name || conversation?.other_user_last_name
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        
        <View style={styles.chatHeaderInfo}>
          <View style={styles.chatAvatarContainer}>
            {userProfilePic ? (
              <Image source={{ uri: userProfilePic }} style={styles.chatAvatar} />
            ) : (
              <View style={[styles.chatAvatarPlaceholder, { backgroundColor: BLUE }]}>
                <Text style={styles.chatAvatarInitials}>{initials}</Text>
              </View>
            )}
            {isOnline && <View style={styles.chatOnlineDot} />}
          </View>
          <View style={styles.chatHeaderText}>
            <Text style={styles.chatName}>{userName}</Text>
            <Text style={styles.chatStatus}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            {userModel && (
              <Text style={styles.chatJobTitle}>{userModel}</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.chatMenuBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={currentMessages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyMessagesContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles-outline" size={48} color={BLUE} />
            </View>
            <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
            <Text style={styles.emptyMessagesText}>
              Send a message to start the conversation
            </Text>
          </View>
        )}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
          <Ionicons name="attach-outline" size={20} color={GOLD} />
        </TouchableOpacity>
        
        <View style={styles.textInputWrapper}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor={TEXT_LIGHT}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.sendBtn, 
            (!messageText.trim() || sending) && styles.sendBtnDisabled
          ]}
          onPress={sendMessageHandler}
          disabled={!messageText.trim() || sending}
          activeOpacity={0.7}
        >
          {sending ? (
            <ActivityIndicator size="small" color={WHITE} />
          ) : (
            <Ionicons 
              name="send" 
              size={18} 
              color={messageText.trim() ? WHITE : TEXT_LIGHT} 
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Main Messages Component ──────────────────────────────────────────────────
export default function Messages({ onNavigate, route, userRole = 'freelancer' }) {
  const dispatch = useDispatch();
  const { 
    conversations: reduxConversations, 
    isLoading, 
    totalUnread,
    error
  } = useSelector((state) => state.messages);
  const { user } = useSelector((state) => state.auth);
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Handle navigation params (when coming from job application, etc.)
  useEffect(() => {
    if (route?.params?.userId && route?.params?.userName) {
      const tempConversation = {
        _id: `temp_${route.params.userId}`,
        other_user_id: route.params.userId,
        user: {
          id: route.params.userId,
          name: route.params.userName,
          profile_picture: route.params.userProfilePicture || null,
          model: route.params.userModel || 'Freelancer',
          account_status: 'active'
        },
        other_user_name: route.params.userName,
        other_user_first_name: route.params.userName.split(' ')[0],
        other_user_last_name: route.params.userName.split(' ')[1] || '',
        other_user_profile_picture: route.params.userProfilePicture || null,
        last_message: {
          id: 'temp',
          message: 'Start a conversation',
          created_at: new Date().toISOString(),
          is_read: false
        },
        unread_count: 0,
        is_online: false,
        role: route.params.userModel === 'Client' ? 'client' : 'freelancer',
      };
      setSelectedChat(tempConversation);
      dispatch(setSelectedUser(route.params.userId));
    }
  }, [route?.params]);

  // Load conversations on mount
  useEffect(() => {
    if (!initialLoadDone) {
      console.log('Loading conversations...');
      dispatch(getConversations());
      setInitialLoadDone(true);
    }
  }, [dispatch, initialLoadDone]);

  // Handle hardware back button - go back to previous screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If in chat detail view, go back to conversation list
      if (selectedChat) {
        setSelectedChat(null);
        dispatch(setSelectedUser(null));
        dispatch(clearMessages());
        return true; // Prevent default behavior
      }
      
      // If in conversation list, navigate back to previous screen
      // This will use the onNavigate function to go back
      if (onNavigate) {
        // Determine which dashboard to go back to based on user role
        if (userRole === 'freelancer') {
          onNavigate('FreelancerDashboard');
        } else {
          onNavigate('ClientDashboard');
        }
        return true; // Prevent default behavior
      }
      
      return false; // Let default behavior happen
    });

    return () => backHandler.remove();
  }, [selectedChat, onNavigate, userRole]);

  const fetchConversations = async () => {
    try {
      await dispatch(getConversations()).unwrap();
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, []);

  const handleSelectChat = (conversation) => {
    setSelectedChat(conversation);
    dispatch(setSelectedUser(conversation.other_user_id));
    
    // Mark messages as read if there are unread
    if (conversation.unread_count > 0) {
      dispatch(markAsRead(conversation.other_user_id));
    }
  };

  const handleBackFromChat = () => {
    setSelectedChat(null);
    dispatch(setSelectedUser(null));
    dispatch(clearMessages());
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Filter conversations
  const getFilteredConversations = () => {
    let filtered = reduxConversations || [];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => {
        const name = c.user?.name || c.other_user_name || '';
        return name.toLowerCase().includes(searchLower);
      });
    }

    if (activeTab === 'unread') {
      filtered = filtered.filter((c) => (c.unread_count || 0) > 0);
    }

    return filtered;
  };

  const filteredConversations = getFilteredConversations();

  // Handle tab bar navigation
  const handleTabBarPress = (key) => {
    const returnState = { activeTab: key };
    if (key === 'FreelancerDashboard') {
      onNavigate('FreelancerDashboard', { returnState });
    } else if (key === 'Messages') {
      // Already on Messages
    } else if (key === 'MyJobs') {
      onNavigate('MyJobs', { returnState });
    } else if (key === 'MyApplications') {
      onNavigate('MyApplications', { returnState });
    } else if (key === 'Profile') {
      onNavigate('FreelancerProfile', { returnState });
    }
  };

  // Conversation Item Component
  const ConversationItem = ({ item }) => {
    const userName = item.user?.name || item.other_user_name || 'Unknown User';
    const userProfilePic = item.user?.profile_picture || item.other_user_profile_picture;
    const isOnline = item.is_online || false;
    const unreadCount = item.unread_count || 0;
    const lastMsg = item.last_message?.message || 'No messages yet';
    const lastMsgTime = item.last_message?.created_at || item.last_message_time;

    const firstName = item.user?.first_name || item.other_user_first_name || '';
    const lastName = item.user?.last_name || item.other_user_last_name || '';

    return (
      <TouchableOpacity 
        style={[styles.conversationItem, selectedChat?.other_user_id === item.other_user_id && styles.conversationActive]}
        onPress={() => handleSelectChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {userProfilePic ? (
            <Image source={{ uri: userProfilePic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: BLUE }]}>
              <Text style={styles.avatarInitials}>
                {getInitials(firstName, lastName)}
              </Text>
            </View>
          )}
          {isOnline && <View style={styles.onlineDot} />}
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{userName}</Text>
            <Text style={styles.conversationTime}>{formatTime(lastMsgTime)}</Text>
          </View>
          <View style={styles.conversationPreview}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMsg}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {item.user?.model && (
            <View style={styles.jobBadge}>
              <Ionicons name="person-outline" size={10} color={GOLD} />
              <Text style={styles.jobBadgeText}>{item.user.model}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // If a chat is selected, show the chat detail
  if (selectedChat) {
    return (
      <ChatDetail 
        conversation={selectedChat}
        onBack={handleBackFromChat}
        userRole={userRole}
        onNavigate={onNavigate}
        user={user}
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
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.headerRight}>
          {totalUnread > 0 && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>{totalUnread}</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.refreshBtn} 
            onPress={onRefresh}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="refresh-outline" 
              size={20} 
              color={WHITE} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={TEXT_MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={TEXT_LIGHT}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
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
      
      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="chatbubbles-outline" size={48} color={BLUE} />
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>
            {userRole === 'freelancer' 
              ? 'When clients message you about jobs, your conversations will appear here'
              : 'When you message freelancers, your conversations will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item._id || item.user?.id || Date.now().toString()}
          renderItem={({ item }) => <ConversationItem item={item} />}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
          }
        />
      )}
      
      {/* Bottom Tab Bar */}
      <BottomTabBar 
        activeTab="Messages" 
        onTabPress={handleTabBarPress} 
        pendingOffers={0}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  
  // Header Styles
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 16,
    backgroundColor: NAVY,
  },
  title: { fontSize: 18, fontWeight: '700', color: WHITE, letterSpacing: -0.3 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalUnreadBadge: {
    backgroundColor: GOLD,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 20,
    alignItems: 'center',
  },
  totalUnreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: WHITE,
  },
  refreshBtn: {
    padding: 4,
  },
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    height: 48,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: TEXT_MAIN,
    fontSize: 14,
  },
  
  // Tabs
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
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: BG,
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
    borderRadius: 8,
  },
  retryBtnText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Conversation List Styles
  conversationsList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD,
    marginVertical: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  conversationActive: {
    backgroundColor: `${BLUE}08`,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: WHITE,
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
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  conversationTime: {
    fontSize: 11,
    color: TEXT_LIGHT,
  },
  conversationPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: TEXT_MUTED,
    marginRight: 8,
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
  jobBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  jobBadgeText: {
    fontSize: 10,
    color: GOLD,
    fontWeight: '500',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 80, height: 80,
    backgroundColor: 'rgba(0,104,181,0.08)',
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
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  
  // Chat View Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: NAVY,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chatAvatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  chatAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
  },
  chatOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: NAVY,
  },
  chatHeaderText: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
  },
  chatStatus: {
    fontSize: 11,
    color: GOLD_LT,
  },
  chatJobTitle: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginTop: 2,
  },
  chatMenuBtn: {
    padding: 8,
  },
  
  // Messages Styles
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
    backgroundColor: BG,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  sentWrapper: {
    alignItems: 'flex-end',
  },
  receivedWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  sentBubble: {
    backgroundColor: BLUE,
    borderBottomRightRadius: 4,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  receivedBubble: {
    backgroundColor: CARD,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  messageText: {
    fontSize: 14,
    color: TEXT_MAIN,
    marginBottom: 4,
    lineHeight: 20,
  },
  sentMessageText: {
    color: WHITE,
  },
  receivedMessageText: {
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
  sentMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  
  // Empty Messages
  emptyMessagesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyMessagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  
  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: CARD,
    gap: 8,
  },
  attachBtn: {
    alignSelf: 'flex-end',
    padding: 8,
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
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 20, elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: BORDER,
    shadowOpacity: 0,
  },
  
  // Bottom Tab Bar Styles
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