import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BG = '#0a0a0a';
const GOLD = '#D4AF37';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';

export default function Settings({ onNavigate }) {
  const settingsOptions = [
    { icon: 'person-outline', label: 'Account Settings', color: '#fff' },
    { icon: 'notifications-outline', label: 'Notifications', color: '#fff' },
    { icon: 'lock-closed-outline', label: 'Privacy & Security', color: '#fff' },
    { icon: 'card-outline', label: 'Payment Methods', color: '#fff' },
    { icon: 'color-palette-outline', label: 'Appearance', color: '#fff' },
    { icon: 'language-outline', label: 'Language', color: '#fff' },
    { icon: 'help-circle-outline', label: 'Help & Support', color: '#fff' },
    { icon: 'information-circle-outline', label: 'About', color: '#fff' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.container}>
        {settingsOptions.map((option, index) => (
          <TouchableOpacity key={index} style={styles.optionCard}>
            <View style={styles.optionLeft}>
              <Ionicons name={option.icon} size={22} color={GOLD} />
              <Text style={styles.optionLabel}>{option.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  container: { flex: 1, padding: 16 },
  optionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: CARD_BG, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionLabel: { fontSize: 15, color: '#fff' },
});