import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BG = '#0a0a0a';
const GOLD = '#D4AF37';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const SENT_MSG_BG = '#D4AF37';
const RECEIVED_MSG_BG = '#1e1e1e';

// Sample conversations data
const SAMPLE_CONVERSATIONS = [
  {
    id: '1',
    name: 'Tj medina',
    avatar: null,
    initials: 'TJ',
    lastMessage: 'Hey! Thanks for the proposal. When can you start?',
    timestamp: '10:42 AM',
    unread: 2,
    online: true,
    isClient: true,
  },
  
];

// Sample messages for chat view
const SAMPLE_MESSAGES = [
  {
    id: '1',
    text: 'Hi there! I saw your proposal for the web development project.',
    sent: false,
    timestamp: '10:30 AM',
  },
  {
    id: '2',
    text: 'Hello! Yes, I have experience with React Native and Node.js.',
    sent: true,
    timestamp: '10:32 AM',
  },
  {
    id: '3',
    text: 'Great! When would you be available to start?',
    sent: false,
    timestamp: '10:35 AM',
  },
  {
    id: '4',
    text: 'I can start next Monday. What\'s the project timeline looking like?',
    sent: true,
    timestamp: '10:38 AM',
  },
  {
    id: '5',
    text: 'We\'re hoping to have the MVP ready in 4 weeks.',
    sent: false,
    timestamp: '10:40 AM',
  },
  {
    id: '6',
    text: 'That works perfectly. Should we schedule a quick call to discuss details?',
    sent: true,
    timestamp: '10:42 AM',
  },
];

export default function Messages({ onNavigate }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [conversations, setConversations] = useState(SAMPLE_CONVERSATIONS);

  const sendMessage = () => {
    if (!messageText.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      sent: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, newMessage]);
    setMessageText('');
    
    // Update last message in conversations list
    const updatedConversations = conversations.map(conv => 
      conv.id === selectedChat.id 
        ? { ...conv, lastMessage: messageText.trim(), timestamp: 'Just now', unread: 0 }
        : conv
    );
    setConversations(updatedConversations);
  };

  const ConversationItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.conversationItem, selectedChat?.id === item.id && styles.conversationActive]}
      onPress={() => setSelectedChat(item)}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: item.isClient ? GOLD : '#4a4a4a' }]}>
            <Text style={styles.avatarInitials}>{item.initials}</Text>
          </View>
        )}
        {item.online && <View style={styles.onlineDot} />}
      </View>
      
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name}</Text>
          <Text style={styles.conversationTime}>{item.timestamp}</Text>
        </View>
        <View style={styles.conversationPreview}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
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
          {item.text}
        </Text>
        <Text style={[styles.messageTime, item.sent && styles.sentMessageTime]}>
          {item.timestamp}
        </Text>
      </View>
    </View>
  );

  const ChatHeader = () => (
    <View style={styles.chatHeader}>
      <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.chatHeaderInfo}>
        <View style={styles.chatAvatarContainer}>
          <View style={[styles.chatAvatarPlaceholder, { backgroundColor: selectedChat?.isClient ? GOLD : '#4a4a4a' }]}>
            <Text style={styles.chatAvatarInitials}>{selectedChat?.initials}</Text>
          </View>
          {selectedChat?.online && <View style={styles.chatOnlineDot} />}
        </View>
        <View>
          <Text style={styles.chatName}>{selectedChat?.name}</Text>
          <Text style={styles.chatStatus}>
            {selectedChat?.online ? 'Online' : 'Offline'}
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
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble item={item} />}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted={false}
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
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={messageText.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.3)'} 
            />
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
        />
      </View>
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConversationItem item={item} />}
        contentContainerStyle={styles.conversationsList}
        showsVerticalScrollIndicator={false}
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