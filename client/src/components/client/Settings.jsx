import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';

export default function SettingsScreen({ onNavigate }) {
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifUpdates, setNotifUpdates] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  const RowItem = ({ icon, iconColor = GOLD, label, sub, onPress, right }) => (
    <TouchableOpacity style={styles.rowItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.rowIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.2)" />}
    </TouchableOpacity>
  );

  const Divider = () => <View style={styles.divider} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Section title="ACCOUNT">
          <RowItem icon="person-outline" label="Edit Profile" sub="Update your info" />
          <Divider />
          <RowItem icon="mail-outline" label="Email" sub="client@example.com" />
          <Divider />
          <RowItem icon="lock-closed-outline" label="Change Password" sub="Last changed 30 days ago" />
        </Section>

        <Section title="NOTIFICATIONS">
          <RowItem
            icon="chatbubble-outline"
            iconColor="#60a5fa"
            label="Messages"
            sub="Notify on new messages"
            right={
              <Switch
                value={notifMessages}
                onValueChange={setNotifMessages}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(212,175,55,0.5)' }}
                thumbColor={notifMessages ? GOLD : 'rgba(255,255,255,0.4)'}
              />
            }
          />
          <Divider />
          <RowItem
            icon="paper-plane-outline"
            iconColor="#4ade80"
            label="Offer Replies"
            sub="Notify when offers are accepted"
            right={
              <Switch
                value={notifOffers}
                onValueChange={setNotifOffers}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(212,175,55,0.5)' }}
                thumbColor={notifOffers ? GOLD : 'rgba(255,255,255,0.4)'}
              />
            }
          />
          <Divider />
          <RowItem
            icon="megaphone-outline"
            iconColor="#a78bfa"
            label="Platform Updates"
            sub="News and announcements"
            right={
              <Switch
                value={notifUpdates}
                onValueChange={setNotifUpdates}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(212,175,55,0.5)' }}
                thumbColor={notifUpdates ? GOLD : 'rgba(255,255,255,0.4)'}
              />
            }
          />
        </Section>

        <Section title="APPEARANCE">
          <RowItem
            icon="moon-outline"
            iconColor="#818cf8"
            label="Dark Mode"
            sub="Currently enabled"
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(212,175,55,0.5)' }}
                thumbColor={darkMode ? GOLD : 'rgba(255,255,255,0.4)'}
              />
            }
          />
        </Section>

        <Section title="SECURITY">
          <RowItem
            icon="shield-checkmark-outline"
            iconColor="#4ade80"
            label="Two-Factor Authentication"
            sub="Add an extra layer of security"
            right={
              <Switch
                value={twoFA}
                onValueChange={setTwoFA}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(212,175,55,0.5)' }}
                thumbColor={twoFA ? GOLD : 'rgba(255,255,255,0.4)'}
              />
            }
          />
          <Divider />
          <RowItem icon="key-outline" iconColor="#f472b6" label="Active Sessions" sub="Manage logged-in devices" />
        </Section>

        <Section title="SUPPORT">
          <RowItem icon="help-circle-outline" iconColor="#60a5fa" label="Help Center" />
          <Divider />
          <RowItem icon="chatbox-outline" iconColor={GOLD} label="Contact Support" />
          <Divider />
          <RowItem icon="document-text-outline" iconColor="rgba(255,255,255,0.4)" label="Terms & Privacy" />
        </Section>

        <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={16} color="#f87171" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Project X v1.0.0</Text>
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
  topbarTitle: { fontSize: 16, fontWeight: '300', color: '#fff' },
  scroll: { padding: 16, paddingBottom: 50 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 9, letterSpacing: 1.8, color: 'rgba(255,255,255,0.2)',
    marginBottom: 8, paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: CARD_BG, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 13, fontWeight: '500', color: '#fff', marginBottom: 1 },
  rowSub: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  divider: { height: 1, backgroundColor: BORDER, marginLeft: 60 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    marginBottom: 20,
  },
  deleteText: { fontSize: 13, fontWeight: '500', color: '#f87171' },
  version: { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.15)' },
});