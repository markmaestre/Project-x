import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
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
const GREEN_SOFT = '#D1FAE5';
const GREEN_MID  = '#86EFAC';
const GREEN_DARK = '#059669';
// ─────────────────────────────────────────────────────────────────────────────────

export default function RoleSelection({ onNavigate }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.container}>

        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Login')}>
          <View style={styles.backIconWrap}>
            <Ionicons name="arrow-back" size={18} color={WHITE} />
          </View>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="flash-outline" size={32} color={NAVY} />
          </View>
          <Text style={styles.title}>Join Taskra</Text>
          <Text style={styles.subtitle}>Choose how you want to use the platform</Text>
        </View>

        {/* Freelancer Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => onNavigate('FreelancerRegistration')}
          activeOpacity={0.85}
        >
          <View style={styles.roleCardInner}>
            <View style={styles.roleIconContainer}>
              <Ionicons name="briefcase-outline" size={28} color={BLUE} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>I'm a Freelancer</Text>
              <Text style={styles.roleDescription}>
                Find work, submit proposals, and get paid for your skills
              </Text>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="arrow-forward" size={16} color={BLUE} />
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagRow}>
            {['Find Jobs', 'Get Paid', 'Build Portfolio'].map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Client Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => onNavigate('ClientRegistration')}
          activeOpacity={0.85}
        >
          <View style={styles.roleCardInner}>
            <View style={styles.roleIconContainer}>
              <Ionicons name="people-outline" size={28} color={BLUE} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>I'm a Client</Text>
              <Text style={styles.roleDescription}>
                Post projects, hire talent, and manage your team
              </Text>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="arrow-forward" size={16} color={BLUE} />
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagRow}>
            {['Post Jobs', 'Hire Talent', 'Manage Team'].map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Info strip */}
        <View style={styles.infoStrip}>
          <Ionicons name="shield-checkmark-outline" size={14} color={GOLD_DK} />
          <Text style={styles.infoText}>Free to join · No hidden fees · Secure payments</Text>
        </View>

        {/* Login prompt */}
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => onNavigate('Login')}>
            <Text style={styles.loginPromptLink}> Sign In</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, padding: 24 },

  // Back
  backButton: { marginBottom: 24, alignSelf: 'flex-start' },
  backIconWrap: {
    width: 38, height: 38,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Header
  header: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 68, height: 68,
    backgroundColor: GOLD,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  title: { fontSize: 26, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center' },

  // Role cards
  roleCard: {
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  roleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  roleIconContainer: {
    width: 52, height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(0,104,181,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(0,104,181,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, marginBottom: 3 },
  roleDescription: { fontSize: 12, color: TEXT_MUTED, lineHeight: 18 },
  chevronWrap: {
    width: 30, height: 30,
    backgroundColor: 'rgba(0,104,181,0.08)',
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  // Tags
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: {
    paddingVertical: 4, paddingHorizontal: 10,
    backgroundColor: 'rgba(0,104,181,0.08)',
    borderRadius: 999,
    borderWidth: 1.5, borderColor: 'rgba(0,104,181,0.2)',
  },
  tagText: { fontSize: 10, color: BLUE, fontWeight: '600' },

  // Info strip
  infoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 8, marginBottom: 4,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: 'rgba(200,149,32,0.08)',
    borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(200,149,32,0.2)',
  },
  infoText: { fontSize: 12, color: GOLD_DK, fontWeight: '500' },

  // Login prompt
  loginPrompt: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 24, paddingVertical: 8,
  },
  loginPromptText: { fontSize: 14, color: TEXT_MUTED },
  loginPromptLink: { fontSize: 14, color: BLUE, fontWeight: '700' },
});