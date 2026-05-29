import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  FlatList, TextInput, Image, ActivityIndicator, 
  RefreshControl, Alert 
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

const BG = '#0a0a0a';
const GOLD = '#D4AF37';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const SENT_MSG_BG = '#D4AF37';
const RECEIVED_MSG_BG = '#1e1e1e';

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
          <View style={[styles.avatarPlaceholder, { backgroundColor: item.isClient ? GOLD : '#4a4a4a' }]}>
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
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.chatHeaderInfo}>
        <View style={styles.chatAvatarContainer}>
          {selectedChat?.other_user_profile_picture ? (
            <Image source={{ uri: selectedChat.other_user_profile_picture }} style={styles.chatAvatar} />
          ) : (
            <View style={[styles.chatAvatarPlaceholder, { backgroundColor: selectedChat?.isClient ? GOLD : '#4a4a4a' }]}>
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
        <Ionicons name="ellipsis-vertical" size={20} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </View>
  );

  if (selectedChat) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyMessagesContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
              <Text style={styles.emptyMessagesText}>
                Send a message to start the conversation
              </Text>
            </View>
          )}
        />
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="attach-outline" size={24} color={GOLD} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor="rgba(255,255,255,0.3)"
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
              <ActivityIndicator size="small" color="#0a0a0a" />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={messageText.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.3)'} 
              />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newMsgBtn}>
          <Ionicons name="create-outline" size={22} color={GOLD} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.3)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GOLD} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="rgba(255,255,255,0.1)" />
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
  safe: { flex: 1, backgroundColor: BG },
  
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
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: CARD_BG, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  newMsgBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: CARD_BG, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: CARD_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
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
    color: 'rgba(255,255,255,0.4)',
  },
  
  // Conversation List Styles
  conversationsList: {
    paddingHorizontal: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  conversationActive: {
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderRadius: 10,
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
    color: '#0a0a0a',
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
    borderColor: BG,
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
    color: '#fff',
  },
  conversationTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
  conversationPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 20,
  },
  browseJobsBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseJobsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a0a0a',
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
    backgroundColor: BG,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    color: '#0a0a0a',
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
    borderColor: BG,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  chatStatus: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
  chatMenuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  sentMessageText: {
    color: '#0a0a0a',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
  },
  sentMessageTime: {
    color: 'rgba(0,0,0,0.5)',
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
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
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
    backgroundColor: BG,
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  messageInput: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: CARD_BG,
  },
});