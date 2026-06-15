import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  FlatList, KeyboardAvoidingView, Platform,
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
// ─────────────────────────────────────────────────────────────────────────────────

// ── Bottom tabs (copied from reference) ───────────────────────────────────────────────
const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'          },
  { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'        },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline'    },
  { key: 'Message',       label: 'Messages', icon: 'chatbubble',    iconOutline: 'chatbubble-outline'    },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',        iconOutline: 'person-outline'        },
];

// MOCK DATA - Client perspective (talking to freelancers)
const CLIENT_CONVERSATIONS = [
  {
    id: '1', 
    name: 'Maria Santos', 
    role: 'UI/UX Designer',
    lastMsg: 'Sure, I can deliver the mockups by Friday!',
    time: '2m ago', 
    unread: 3, 
    initials: 'MS', 
    color: '#4ade80', 
    online: true,
    type: 'freelancer'
  },
  {
    id: '2', 
    name: 'Carlo Reyes', 
    role: 'Brand Designer',
    lastMsg: 'The final logo files have been sent to your email.',
    time: '1h ago', 
    unread: 0, 
    initials: 'CR', 
    color: GOLD, 
    online: false,
    type: 'freelancer'
  },
  {
    id: '3', 
    name: 'Juan dela Cruz', 
    role: 'Full-Stack Developer',
    lastMsg: 'Working on the backend API now. Should be done by EOD.',
    time: '3h ago', 
    unread: 1, 
    initials: 'JC', 
    color: '#60a5fa', 
    online: true,
    type: 'freelancer'
  },
];

// MOCK DATA - Freelancer perspective (talking to clients)
const FREELANCER_CONVERSATIONS = [
  {
    id: '6', 
    name: 'TechCorp Solutions', 
    company: 'Client',
    lastMsg: 'We would like to schedule an interview for the Full-Stack position.',
    time: '10m ago', 
    unread: 1, 
    initials: 'TC', 
    color: BLUE, 
    online: true,
    type: 'client',
    jobTitle: 'Senior Full-Stack Developer'
  },
  {
    id: '7', 
    name: 'Creative Agency PH', 
    company: 'Client',
    lastMsg: 'Your portfolio is impressive. Can you start next week?',
    time: '2h ago', 
    unread: 0, 
    initials: 'CA', 
    color: '#ec489a', 
    online: false,
    type: 'client',
    jobTitle: 'UI/UX Designer'
  },
  {
    id: '8', 
    name: 'StartUp Manila', 
    company: 'Client',
    lastMsg: 'The contract has been sent to your email for review.',
    time: '5h ago', 
    unread: 1, 
    initials: 'SM', 
    color: '#8b5cf6', 
    online: true,
    type: 'client',
    jobTitle: 'Mobile App Developer'
  },
];

// MOCK CHAT MESSAGES for each conversation
const CHAT_MESSAGES = {
  '1': [ // Maria Santos
    { id: 'm1', text: 'Hi! I saw your job posting for UI/UX Designer', sender: 'them', time: '10:30 AM', status: 'read' },
    { id: 'm2', text: 'I have 5 years of experience in mobile and web design', sender: 'them', time: '10:31 AM', status: 'read' },
    { id: 'm3', text: 'That sounds great! Can you share your portfolio?', sender: 'me', time: '10:35 AM', status: 'read' },
    { id: 'm4', text: 'Sure, here is my portfolio link: https://mariadesigns.com', sender: 'them', time: '10:38 AM', status: 'read' },
    { id: 'm5', text: 'I really like your work! When can you start?', sender: 'me', time: '10:40 AM', status: 'read' },
    { id: 'm6', text: 'I can start next Monday. I will send you the contract.', sender: 'them', time: '10:42 AM', status: 'read' },
    { id: 'm7', text: 'Sure, I can deliver the mockups by Friday!', sender: 'them', time: '10:45 AM', status: 'delivered' },
  ],
  '2': [ // Carlo Reyes
    { id: 'm1', text: 'Hello! I am interested in your branding project', sender: 'them', time: '9:15 AM', status: 'read' },
    { id: 'm2', text: 'Can you show me some of your previous logo designs?', sender: 'me', time: '9:20 AM', status: 'read' },
    { id: 'm3', text: 'Yes, I will send you my portfolio', sender: 'them', time: '9:22 AM', status: 'read' },
    { id: 'm4', text: 'The final logo files have been sent to your email.', sender: 'them', time: '10:00 AM', status: 'delivered' },
  ],
  '3': [ // Juan dela Cruz
    { id: 'm1', text: 'Good day! I am a full-stack developer', sender: 'them', time: 'Yesterday', status: 'read' },
    { id: 'm2', text: 'What tech stack do you use?', sender: 'me', time: 'Yesterday', status: 'read' },
    { id: 'm3', text: 'React, Node.js, MongoDB, and Python', sender: 'them', time: 'Yesterday', status: 'read' },
    { id: 'm4', text: 'Working on the backend API now. Should be done by EOD.', sender: 'them', time: '3h ago', status: 'read' },
  ],
  '6': [ // TechCorp Solutions
    { id: 'm1', text: 'Hello! We saw your application for the Full-Stack position', sender: 'them', time: '11:00 AM', status: 'read' },
    { id: 'm2', text: 'Thank you for considering my application', sender: 'me', time: '11:05 AM', status: 'read' },
    { id: 'm3', text: 'We would like to schedule an interview for the Full-Stack position.', sender: 'them', time: '11:10 AM', status: 'delivered' },
  ],
  '7': [ // Creative Agency PH
    { id: 'm1', text: 'Your UI/UX portfolio is outstanding!', sender: 'them', time: '1:00 PM', status: 'read' },
    { id: 'm2', text: 'Thank you! I have worked with various startups', sender: 'me', time: '1:05 PM', status: 'read' },
    { id: 'm3', text: 'Your portfolio is impressive. Can you start next week?', sender: 'them', time: '1:10 PM', status: 'delivered' },
  ],
  '8': [ // StartUp Manila
    { id: 'm1', text: 'We need a mobile app developer for our new project', sender: 'them', time: '3:00 PM', status: 'read' },
    { id: 'm2', text: 'I have experience with React Native and Flutter', sender: 'me', time: '3:05 PM', status: 'read' },
    { id: 'm3', text: 'The contract has been sent to your email for review.', sender: 'them', time: '3:10 PM', status: 'delivered' },
  ],
};

// Chat Detail Screen Component
function ChatDetailScreen({ conversation, onBack, userRole }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(CHAT_MESSAGES[conversation.id] || []);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageRow,
      item.sender === 'me' ? styles.myMessageRow : styles.theirMessageRow
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'me' ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'me' ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>{item.time}</Text>
          {item.sender === 'me' && (
            <Ionicons 
              name={item.status === 'read' ? 'checkmark-done' : 'checkmark'} 
              size={12} 
              color={TEXT_LIGHT} 
            />
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <View style={styles.chatAvatarWrap}>
            <View style={[styles.chatAvatar, { backgroundColor: `${conversation.color}22` }]}>
              <Text style={[styles.chatAvatarText, { color: conversation.color }]}>
                {conversation.initials}
              </Text>
            </View>
            {conversation.online && <View style={styles.chatOnlineDot} />}
          </View>
          <View>
            <Text style={styles.chatHeaderName}>{conversation.name}</Text>
            <Text style={styles.chatHeaderRole}>
              {userRole === 'freelancer' ? conversation.jobTitle : conversation.role}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.chatMenuBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

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
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            activeOpacity={0.7}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={20} color={message.trim() ? GOLD : TEXT_LIGHT} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Main Messages Screen Component
export default function MessagesScreen({ onNavigate, userRole = 'client' }) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeBottomTab, setActiveBottomTab] = useState('Message');

  // Select mock data based on user role
  const getConversations = () => {
    if (userRole === 'freelancer') {
      return FREELANCER_CONVERSATIONS;
    }
    return CLIENT_CONVERSATIONS;
  };

  const conversations = getConversations();

  // Handle bottom tab navigation
  const handleTabPress = (key) => {
    setActiveBottomTab(key);
    if (key === 'Home') onNavigate('ClientDashboard');
    if (key === 'PostJob') onNavigate('PostJob');
    if (key === 'Hiredtalents') onNavigate('Hiredtalents');
    if (key === 'Message') onNavigate('Message');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  // Filter conversations based on search and active tab
  const getFilteredConversations = () => {
    let filtered = conversations;
    
    if (search) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (activeTab === 'unread') {
      filtered = filtered.filter((c) => c.unread > 0);
    }
    
    return filtered;
  };

  const filtered = getFilteredConversations();

  const handleConversationPress = (conversation) => {
    setSelectedChat(conversation);
  };

  // If a chat is selected, show the chat detail screen
  if (selectedChat) {
    return (
      <ChatDetailScreen 
        conversation={selectedChat}
        onBack={() => setSelectedChat(null)}
        userRole={userRole}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <View style={styles.topbar}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => onNavigate(userRole === 'freelancer' ? 'FreelancerDashboard' : 'ClientDashboard')} 
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>
            Messages
          </Text>
          <TouchableOpacity style={styles.composeBtn} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={18} color={GOLD} />
          </TouchableOpacity>
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
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={TEXT_LIGHT} />
              <Text style={styles.emptyStateTitle}>No messages yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                {userRole === 'freelancer' 
                  ? 'When clients message you, they will appear here' 
                  : 'Start a conversation with a freelancer'}
              </Text>
              <TouchableOpacity style={styles.emptyStateBtn}>
                <Text style={styles.emptyStateBtnText}>
                  {userRole === 'freelancer' ? 'Browse Jobs' : 'Find Freelancers'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.convoCard} 
                onPress={() => handleConversationPress(item)}
                activeOpacity={0.75}
              >
                <View style={styles.avatarWrap}>
                  <View style={[styles.avatar, { backgroundColor: `${item.color}22` }]}>
                    <Text style={[styles.avatarText, { color: item.color }]}>{item.initials}</Text>
                  </View>
                  {item.online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.convoInfo}>
                  <View style={styles.convoTop}>
                    <Text style={styles.convoName}>{item.name}</Text>
                    <Text style={styles.convoTime}>{item.time}</Text>
                  </View>
                  <View style={styles.convoBottom}>
                    <Ionicons name="briefcase-outline" size={10} color={BLUE} />
                    <Text style={styles.convoRole} numberOfLines={1}>
                      {userRole === 'freelancer' ? item.jobTitle : item.role}
                    </Text>
                  </View>
                  <View style={styles.lastMsgContainer}>
                    <Ionicons name="chatbubble-outline" size={10} color={TEXT_LIGHT} />
                    <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMsg}</Text>
                  </View>
                </View>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* ── Bottom Tab Bar (copied from reference ClientScreen) ── */}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  root: { flex: 1, backgroundColor: BG },
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
  topbarTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: WHITE,
    letterSpacing: -0.3,
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
  emptyStateBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: BLUE,
    borderRadius: 20,
  },
  emptyStateBtnText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '600',
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
  // Chat Detail Screen Styles
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
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

  // ── Bottom Tab Bar (copied from reference) ──
  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1.5, borderTopColor: BORDER,
    paddingTop: 6, paddingBottom: 4, paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4, position: 'relative',
  },
  tabActiveBar: {
    position: 'absolute', top: 0,
    width: 24, height: 3,
    backgroundColor: BLUE, borderRadius: 999,
  },
  tabIconWrap: { position: 'relative', marginBottom: 3, marginTop: 6 },
  tabFab: {
    width: 44, height: 36, borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 3, marginTop: 2,
    shadowColor: GOLD_DK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 5, elevation: 3,
    borderWidth: 1, borderColor: GOLD_LT,
  },
  tabLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
  tabLabelActive: { color: BLUE, fontWeight: '700' },
  tabLabelPost: { color: GOLD, fontWeight: '700' },
});