import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  FlatList, TextInput, Image, ActivityIndicator, 
  RefreshControl, Alert, StatusBar
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

const GREEN       = '#4ADE80';
const GREEN_DARK  = '#22C55E';
const GREEN_SOFT  = '#DCFCE7';
const GREEN_MID   = '#86EFAC';
const WHITE       = '#FFFFFF';
const OFF_WHITE   = '#F0FDF4';
const BORDER      = 'rgba(74,222,128,0.25)';
const TEXT_MAIN   = '#0F2417';
const TEXT_MUTED  = '#6B7280';
const TEXT_LIGHT  = '#9CA3AF';

const SENT_MSG_BG = GREEN_DARK;
const RECEIVED_MSG_BG = '#F3F4F6';

export default function Messages({ onNavigate, route }) {
  const dispatch = useDispatch();
  const { conversations, currentMessages, isLoading, sending } = useSelector((state) => state.messages);
  const { user } = useSelector((state) => state.auth);
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef(null);

  // Check if route params has a user to chat with (from navigation)
  useEffect(() => {
    if (route?.params?.userId && route?.params?.userName) {
      // Create a temporary conversation object
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
      };
      setSelectedChat(tempConversation);
      fetchMessages(tempConversation.other_user_id);
    }
  }, [route?.params]);

  useEffect(() => {
    fetchConversations();
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
      // Scroll to bottom after messages load
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
    await fetchConversations();
    if (selectedChat) {
      await fetchMessages(selectedChat.other_user_id);
    }
    setRefreshing(false);
  }, [selectedChat]);

  const sendMessageHandler = async () => {
    if (!messageText.trim() || !selectedChat) return;

    const receiverId = selectedChat._id.startsWith('temp') 
      ? selectedChat.other_user_id 
      : selectedChat.other_user_id;

    try {
      await dispatch(sendMessage({ 
        receiverId, 
        message: messageText.trim() 
      })).unwrap();
      
      setMessageText('');
      
      // Refresh messages
      await fetchMessages(receiverId);
      
      // Refresh conversations to update last message
      await fetchConversations();
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleSelectChat = async (conversation) => {
    setSelectedChat(conversation);
    await fetchMessages(conversation.other_user_id);
    
    // Mark as read
    if (conversation.unread_count > 0) {
      await dispatch(markAsRead(conversation.other_user_id)).unwrap();
      await fetchConversations(); // Refresh conversation list
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const filteredConversations = () => {
    if (!searchQuery) return conversations;
    return conversations.filter(conv => 
      conv.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const ConversationItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.conversationItem, selectedChat?.other_user_id === item.other_user_id && styles.conversationActive]}
      onPress={() => handleSelectChat(item)}
    >
      <View style={styles.avatarContainer}>
        {item.other_user_profile_picture ? (
          <Image source={{ uri: item.other_user_profile_picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: GREEN_DARK }]}>
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
      <TouchableOpacity onPress={() => {
        setSelectedChat(null);
        dispatch(clearMessages());
      }} style={styles.backButton}>
        <View style={styles.backIconWrap}>
          <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
        </View>
      </TouchableOpacity>
      <View style={styles.chatHeaderInfo}>
        <View style={styles.chatAvatarContainer}>
          {selectedChat?.other_user_profile_picture ? (
            <Image source={{ uri: selectedChat.other_user_profile_picture }} style={styles.chatAvatar} />
          ) : (
            <View style={[styles.chatAvatarPlaceholder, { backgroundColor: GREEN_DARK }]}>
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
        </View>
      </View>
      <TouchableOpacity style={styles.chatMenuBtn}>
        <View style={styles.menuIconWrap}>
          <Ionicons name="ellipsis-vertical" size={18} color={GREEN_DARK} />
        </View>
      </TouchableOpacity>
    </View>
  );

  if (selectedChat) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
        <ChatHeader />
        
        <FlatList
          ref={flatListRef}
          data={currentMessages}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => <MessageBubble item={item} />}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_DARK} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyMessagesContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles-outline" size={48} color={GREEN_DARK} />
              </View>
              <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
              <Text style={styles.emptyMessagesText}>
                Send a message to start the conversation
              </Text>
            </View>
          )}
        />
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <View style={styles.attachIconWrap}>
              <Ionicons name="attach-outline" size={20} color={GREEN_DARK} />
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
          >
            {sending ? (
              <ActivityIndicator size="small" color={TEXT_MAIN} />
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
          <View style={styles.backIconWrap}>
            <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newMsgBtn}>
          <View style={styles.newMsgIconWrap}>
            <Ionicons name="create-outline" size={18} color={GREEN_DARK} />
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
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN_DARK} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations()}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ConversationItem item={item} />}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_DARK} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles-outline" size={48} color={GREEN_DARK} />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>
                When you start chatting with clients, your conversations will appear here
              </Text>
              <TouchableOpacity 
                style={styles.browseJobsBtn}
                onPress={() => onNavigate('BrowseJobs')}
              >
                <Text style={styles.browseJobsText}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OFF_WHITE },
  
  // Header Styles
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { alignSelf: 'flex-start' },
  backIconWrap: {
    width: 38, height: 38,
    backgroundColor: WHITE,
    borderRadius: 11,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '600', color: TEXT_MAIN },
  newMsgBtn: { alignSelf: 'flex-start' },
  newMsgIconWrap: {
    width: 38, height: 38,
    backgroundColor: GREEN_SOFT,
    borderRadius: 11,
    borderWidth: 1, borderColor: GREEN_MID,
    alignItems: 'center', justifyContent: 'center',
  },
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 14,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    height: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
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
  },
  conversationItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  conversationActive: {
    backgroundColor: GREEN_SOFT,
    borderRadius: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: WHITE,
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
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: TEXT_MUTED,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GREEN_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: WHITE,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 80, height: 80,
    backgroundColor: GREEN_SOFT,
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
  },
  browseJobsBtn: {
    backgroundColor: GREEN_DARK,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseJobsText: {
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
  },
  
  // Chat View Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: WHITE,
  },
  backButton: {
    alignSelf: 'flex-start',
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chatAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: WHITE,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  chatStatus: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  chatMenuBtn: {
    alignSelf: 'flex-start',
  },
  menuIconWrap: {
    width: 38, height: 38,
    backgroundColor: GREEN_SOFT,
    borderRadius: 11,
    borderWidth: 1, borderColor: GREEN_MID,
    alignItems: 'center', justifyContent: 'center',
  },
  
  // Messages Styles
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
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
    backgroundColor: SENT_MSG_BG,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: RECEIVED_MSG_BG,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  messageText: {
    fontSize: 14,
    color: WHITE,
    marginBottom: 4,
  },
  sentMessageText: {
    color: WHITE,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
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
    backgroundColor: WHITE,
    gap: 8,
  },
  attachBtn: {
    alignSelf: 'flex-start',
  },
  attachIconWrap: {
    width: 38, height: 38,
    backgroundColor: GREEN_SOFT,
    borderRadius: 19,
    borderWidth: 1, borderColor: GREEN_MID,
    alignItems: 'center', justifyContent: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: OFF_WHITE,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GREEN_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: BORDER,
  },
});