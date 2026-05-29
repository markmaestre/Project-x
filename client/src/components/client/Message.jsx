import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';

const MOCK_CONVERSATIONS = [
  {
    id: '1', name: 'Maria Santos', role: 'UI/UX Designer',
    lastMsg: 'Sure, I can deliver the mockups by Friday!',
    time: '2m ago', unread: 3, initials: 'MS', color: '#4ade80', online: true,
  },
  {
    id: '2', name: 'Carlo Reyes', role: 'Brand Designer',
    lastMsg: 'The final logo files have been sent to your email.',
    time: '1h ago', unread: 0, initials: 'CR', color: GOLD, online: false,
  },
  {
    id: '3', name: 'Juan dela Cruz', role: 'Full-Stack Developer',
    lastMsg: 'Working on the backend API now. Should be done by EOD.',
    time: '3h ago', unread: 1, initials: 'JC', color: '#60a5fa', online: true,
  },
  {
    id: '4', name: 'Ana Villanueva', role: 'Content Writer',
    lastMsg: 'Can we discuss the blog topics for next month?',
    time: 'Yesterday', unread: 0, initials: 'AV', color: '#a78bfa', online: false,
  },
  {
    id: '5', name: 'Paolo Bautista', role: 'Videographer',
    lastMsg: 'I\'ve uploaded the raw footage to the shared drive.',
    time: 'Yesterday', unread: 1, initials: 'PB', color: '#f472b6', online: false,
  },
];

export default function MessagesScreen({ onNavigate }) {
  const [search, setSearch] = useState('');

  const filtered = MOCK_CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Messages</Text>
        <TouchableOpacity style={styles.composeBtn} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={18} color={GOLD} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.3)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filtered.map((item) => (
          <TouchableOpacity key={item.id} style={styles.convoCard} activeOpacity={0.75}>
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
                <Text style={styles.convoRole} numberOfLines={1}>{item.role}</Text>
              </View>
              <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMsg}</Text>
            </View>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  composeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
  },
  topbarTitle: { fontSize: 16, fontWeight: '300', color: '#fff' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: CARD_BG, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  convoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4ade80',
    borderWidth: 2, borderColor: BG,
  },
  convoInfo: { flex: 1 },
  convoTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  convoName: { fontSize: 13, fontWeight: '600', color: '#fff' },
  convoTime: { fontSize: 10, color: 'rgba(255,255,255,0.25)' },
  convoBottom: { marginBottom: 3 },
  convoRole: { fontSize: 10, color: GOLD, letterSpacing: 0.3 },
  lastMsg: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  unreadBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { fontSize: 10, fontWeight: '700', color: '#0a0a0a' },
});