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
  clearMessages 
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
// ─────────────────────────────────────────────────────────────────────────────────

// ── Bottom Tab Bar with Centered My Jobs Button (BALANCED VERSION) ─────────────────
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
        {tabs.map((tab, index) => {
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

// MOCK DATA for freelancer conversations (when API is not available)
const MOCK_CONVERSATIONS = [
  {
    _id: 'conv1',
    other_user_id: 'client1',
    other_user_name: 'TechCorp Solutions',
    other_user_first_name: 'TechCorp',
    other_user_last_name: 'Solutions',
    other_user_profile_picture: null,
    last_message: 'We would like to schedule an interview for the Full-Stack position.',
    last_message_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    unread_count: 1,
    is_online: true,
    role: 'client',
    job_title: 'Senior Full-Stack Developer'
  },
  {
    _id: 'conv2',
    other_user_id: 'client2',
    other_user_name: 'Creative Agency PH',
    other_user_first_name: 'Creative',
    other_user_last_name: 'Agency',
    other_user_profile_picture: null,
    last_message: 'Your portfolio is impressive. Can you start next week?',
    last_message_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
    is_online: false,
    role: 'client',
    job_title: 'UI/UX Designer'
  },
  {
    _id: 'conv3',
    other_user_id: 'client3',
    other_user_name: 'StartUp Manila',
    other_user_first_name: 'StartUp',
    other_user_last_name: 'Manila',
    other_user_profile_picture: null,
    last_message: 'The contract has been sent to your email for review.',
    last_message_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    unread_count: 1,
    is_online: true,
    role: 'client',
    job_title: 'Mobile App Developer'
  },
  {
    _id: 'conv4',
    other_user_id: 'client4',
    other_user_name: 'Ecom Brands Inc',
    other_user_first_name: 'Ecom',
    other_user_last_name: 'Brands',
    other_user_profile_picture: null,
    last_message: 'Please send us the initial design concepts by Monday.',
    last_message_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
    is_online: false,
    role: 'client',
    job_title: 'Graphic Designer'
  },
  {
    _id: 'conv5',
    other_user_id: 'client5',
    other_user_name: 'Digital Marketing Pro',
    other_user_first_name: 'Digital',
    other_user_last_name: 'Marketing',
    other_user_profile_picture: null,
    last_message: 'We have approved your proposal. When can you start?',
    last_message_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 3,
    is_online: true,
    role: 'client',
    job_title: 'SEO Specialist'
  },
];

// MOCK MESSAGES for each conversation
const MOCK_MESSAGES = {
  client1: [
    { _id: 'm1', message: 'Hello! We saw your application for the Full-Stack position', sent: false, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { _id: 'm2', message: 'Thank you for considering my application', sent: true, created_at: new Date(Date.now() - 115 * 60 * 1000).toISOString() },
    { _id: 'm3', message: 'We would like to schedule an interview for the Full-Stack position.', sent: false, created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  ],
  client2: [
    { _id: 'm1', message: 'Your UI/UX portfolio is outstanding!', sent: false, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { _id: 'm2', message: 'Thank you! I have worked with various startups', sent: true, created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
    { _id: 'm3', message: 'Your portfolio is impressive. Can you start next week?', sent: false, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  ],
  client3: [
    { _id: 'm1', message: 'We need a mobile app developer for our new project', sent: false, created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    { _id: 'm2', message: 'I have experience with React Native and Flutter', sent: true, created_at: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString() },
    { _id: 'm3', message: 'The contract has been sent to your email for review.', sent: false, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  ],
  client4: [
    { _id: 'm1', message: 'We are looking for a graphic designer for our brand', sent: false, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { _id: 'm2', message: 'I specialize in brand identity and logo design', sent: true, created_at: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString() },
    { _id: 'm3', message: 'Please send us the initial design concepts by Monday.', sent: false, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  client5: [
    { _id: 'm1', message: 'We need an SEO specialist for our e-commerce site', sent: false, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { _id: 'm2', message: 'I have 4 years of SEO experience', sent: true, created_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString() },
    { _id: 'm3', message: 'We have approved your proposal. When can you start?', sent: false, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  ],
};

export default function Messages({ onNavigate, route, userRole = 'freelancer' }) {
  const dispatch = useDispatch();
  const { conversations: reduxConversations, currentMessages, isLoading, sending } = useSelector((state) => state.messages);
  const { user } = useSelector((state) => state.auth);
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [useMockData, setUseMockData] = useState(true);
  const [mockMessages, setMockMessages] = useState({});
  const flatListRef = useRef(null);

  // Initialize mock messages
  useEffect(() => {
    if (useMockData) {
      setMockMessages(MOCK_MESSAGES);
    }
  }, []);

  // Handle hardware back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedChat) {
        // If in chat view, go back to conversation list
        handleBackFromChat();
        return true; // Prevent default behavior
      }
      // If in conversation list, let the default back behavior happen
      return false;
    });

    return () => backHandler.remove();
  }, [selectedChat]);

  // Check if route params has a user to chat with (from navigation)
  useEffect(() => {
    if (route?.params?.userId && route?.params?.userName) {
      const tempConversation = {
        _id: `temp_${route.params.userId}`,
        other_user_id: route.params.userId,
        other_user_name: route.params.userName,
        other_user_first_name: route.params.userName.split(' ')[0],
        other_user_last_name: route.params.userName.split(' ')[1] || '',
        other_user_profile_picture: route.params.userProfilePicture || null,
        last_message: 'Start a conversation',
        last_message_time: new Date().toISOString(),
        unread_count: 0,
        is_online: false,
      };
      setSelectedChat(tempConversation);
      if (!useMockData) {
        fetchMessages(tempConversation.other_user_id);
      }
    }
  }, [route?.params]);

  useEffect(() => {
    if (!useMockData) {
      fetchConversations();
    }
  }, []);

  const fetchConversations = async () => {
    try {
      await dispatch(getConversations()).unwrap();
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      await dispatch(getMessages(otherUserId)).unwrap();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (!useMockData) {
      await fetchConversations();
      if (selectedChat) {
        await fetchMessages(selectedChat.other_user_id);
      }
    }
    setRefreshing(false);
  }, [selectedChat, useMockData]);

  const sendMessageHandler = async () => {
    if (!messageText.trim() || !selectedChat) return;

    const receiverId = selectedChat._id.startsWith('temp') 
      ? selectedChat.other_user_id 
      : selectedChat.other_user_id;

    if (useMockData) {
      const newMessage = {
        _id: Date.now().toString(),
        message: messageText.trim(),
        sent: true,
        created_at: new Date().toISOString(),
      };
      
      setMockMessages(prev => ({
        ...prev,
        [receiverId]: [...(prev[receiverId] || []), newMessage]
      }));
      
      setMessageText('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      try {
        await dispatch(sendMessage({ 
          receiverId, 
          message: messageText.trim() 
        })).unwrap();
        
        setMessageText('');
        await fetchMessages(receiverId);
        await fetchConversations();
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');
      }
    }
  };

  const handleSelectChat = async (conversation) => {
    setSelectedChat(conversation);
    
    if (useMockData) {
      if (conversation.unread_count > 0) {
        conversation.unread_count = 0;
      }
    } else {
      await fetchMessages(conversation.other_user_id);
      
      if (conversation.unread_count > 0) {
        await dispatch(markAsRead(conversation.other_user_id)).unwrap();
        await fetchConversations();
      }
    }
  };

  const handleBackFromChat = () => {
    setSelectedChat(null);
    if (!useMockData) {
      dispatch(clearMessages());
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getConversations = () => {
    if (useMockData) {
      return MOCK_CONVERSATIONS;
    }
    return reduxConversations;
  };

  const getCurrentMessages = () => {
    if (useMockData && selectedChat) {
      return mockMessages[selectedChat.other_user_id] || [];
    }
    return currentMessages;
  };

  const filteredConversations = () => {
    const conversations = getConversations();
    if (!searchQuery) return conversations;
    return conversations.filter(conv => 
      conv.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

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

  const ConversationItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.conversationItem, selectedChat?.other_user_id === item.other_user_id && styles.conversationActive]}
      onPress={() => handleSelectChat(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.other_user_profile_picture ? (
          <Image source={{ uri: item.other_user_profile_picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: BLUE }]}>
            <Text style={styles.avatarInitials}>
              {getInitials(item.other_user_first_name, item.other_user_last_name)}
            </Text>
          </View>
        )}
        {item.is_online && <View style={styles.onlineDot} />}
      </View>
      
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.other_user_name}</Text>
          <Text style={styles.conversationTime}>{formatTime(item.last_message_time)}</Text>
        </View>
        <View style={styles.conversationPreview}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || 'No messages yet'}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
        {item.job_title && (
          <View style={styles.jobBadge}>
            <Ionicons name="briefcase-outline" size={10} color={GOLD} />
            <Text style={styles.jobBadgeText}>{item.job_title}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const MessageBubble = ({ item }) => (
    <View style={[styles.messageWrapper, item.sent ? styles.sentWrapper : styles.receivedWrapper]}>
      <View style={[styles.messageBubble, item.sent ? styles.sentBubble : styles.receivedBubble]}>
        <Text style={[styles.messageText, item.sent && styles.sentMessageText]}>
          {item.message}
        </Text>
        <Text style={[styles.messageTime, item.sent && styles.sentMessageTime]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
    </View>
  );

  const ChatHeader = () => (
    <View style={styles.chatHeader}>
      {/* Removed the custom back button here - now using device back button */}
      
      <View style={styles.chatHeaderInfo}>
        <View style={styles.chatAvatarContainer}>
          {selectedChat?.other_user_profile_picture ? (
            <Image source={{ uri: selectedChat.other_user_profile_picture }} style={styles.chatAvatar} />
          ) : (
            <View style={[styles.chatAvatarPlaceholder, { backgroundColor: BLUE }]}>
              <Text style={styles.chatAvatarInitials}>
                {getInitials(selectedChat?.other_user_first_name, selectedChat?.other_user_last_name)}
              </Text>
            </View>
          )}
          {selectedChat?.is_online && <View style={styles.chatOnlineDot} />}
        </View>
        <View>
          <Text style={styles.chatName}>{selectedChat?.other_user_name}</Text>
          <Text style={styles.chatStatus}>
            {selectedChat?.is_online ? 'Online' : 'Offline'}
          </Text>
          {selectedChat?.job_title && (
            <Text style={styles.chatJobTitle}>{selectedChat.job_title}</Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity style={styles.chatMenuBtn} activeOpacity={0.7}>
        <View style={styles.menuIconWrap}>
          <Ionicons name="ellipsis-vertical" size={18} color={WHITE} />
        </View>
      </TouchableOpacity>
    </View>
  );

  // Chat Detail View
  if (selectedChat) {
    const messages = getCurrentMessages();
    
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <ChatHeader />
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => <MessageBubble item={item} />}
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
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
            <View style={styles.attachIconWrap}>
              <Ionicons name="attach-outline" size={20} color={BLUE} />
            </View>
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor={TEXT_LIGHT}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          
          <TouchableOpacity 
            style={[styles.sendBtn, (!messageText.trim() || sending) && styles.sendBtnDisabled]}
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

  // Conversations List View
  const conversations = filteredConversations();
  const isLoadingState = !useMockData && isLoading && !refreshing;
  const pendingOffers = 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      
      <View style={styles.header}>
        {/* Removed the custom back button in header as requested */}
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newMsgBtn} activeOpacity={0.7}>
          <View style={styles.newMsgIconWrap}>
            <Ionicons name="create-outline" size={18} color={GOLD} />
          </View>
        </TouchableOpacity>
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
      
      {isLoadingState ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ConversationItem item={item} />}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
          }
          ListEmptyComponent={() => (
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
              <TouchableOpacity 
                style={styles.browseJobsBtn}
                onPress={() => onNavigate(userRole === 'freelancer' ? 'BrowseJobs' : 'BrowseFreelancers')}
                activeOpacity={0.7}
              >
                <Text style={styles.browseJobsText}>
                  {userRole === 'freelancer' ? 'Browse Jobs' : 'Find Freelancers'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      
      {/* Balanced Bottom Tab Bar */}
      <BottomTabBar 
        activeTab="Messages" 
        onTabPress={handleTabBarPress} 
        pendingOffers={pendingOffers}
      />
    </SafeAreaView>
  );
}

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
  newMsgBtn: { alignSelf: 'flex-start' },
  newMsgIconWrap: {
    width: 40, height: 40,
    backgroundColor: 'rgba(200,149,32,0.1)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(200,149,32,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
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
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  browseJobsBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 20, elevation: 4,
  },
  browseJobsText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
  },
  
  // Chat View Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Changed from 'space-between' to center the content
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: NAVY,
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
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  menuIconWrap: {
    width: 40, height: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
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
  messageTime: {
    fontSize: 10,
    color: TEXT_LIGHT,
    textAlign: 'right',
  },
  sentMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  
  // Empty Messages
  emptyMessagesContainer: {
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
    alignSelf: 'flex-start',
  },
  attachIconWrap: {
    width: 40, height: 40,
    backgroundColor: 'rgba(0,104,181,0.08)',
    borderRadius: 20,
    borderWidth: 1.5, borderColor: 'rgba(0,104,181,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: TEXT_MAIN,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: BORDER,
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
  
  // Balanced Bottom Tab Bar Styles
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