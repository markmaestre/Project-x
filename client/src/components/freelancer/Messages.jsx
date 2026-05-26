import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BG = '#0a0a0a';
const GOLD = '#D4AF37';

export default function Messages({ onNavigate }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('FreelancerDashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newMsgBtn}>
          <Ionicons name="create-outline" size={22} color={GOLD} />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.placeholder}>Messages Screen - Coming Soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  newMsgBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
});