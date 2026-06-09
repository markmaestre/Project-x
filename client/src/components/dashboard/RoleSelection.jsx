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

export default function RoleSelection({ onNavigate }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
      <View style={styles.container}>

        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Login')}>
          <View style={styles.backIconWrap}>
            <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
          </View>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>T</Text>
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
              <Ionicons name="briefcase-outline" size={28} color={GREEN_DARK} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>I'm a Freelancer</Text>
              <Text style={styles.roleDescription}>
                Find work, submit proposals, and get paid for your skills
              </Text>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="arrow-forward" size={16} color={GREEN_DARK} />
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
              <Ionicons name="people-outline" size={28} color={GREEN_DARK} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>I'm a Client</Text>
              <Text style={styles.roleDescription}>
                Post projects, hire talent, and manage your team
              </Text>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="arrow-forward" size={16} color={GREEN_DARK} />
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
          <Ionicons name="shield-checkmark-outline" size={14} color={GREEN_DARK} />
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
  safe: { flex: 1, backgroundColor: OFF_WHITE },
  container: { flex: 1, padding: 24 },

  // Back
  backButton: { marginBottom: 24, alignSelf: 'flex-start' },
  backIconWrap: {
    width: 38, height: 38,
    backgroundColor: WHITE,
    borderRadius: 11,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 68, height: 68,
    backgroundColor: GREEN,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  logoLetter: { fontSize: 32, fontWeight: '800', color: WHITE },
  title: { fontSize: 26, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center' },

  // Role cards
  roleCard: {
    backgroundColor: WHITE,
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
    backgroundColor: GREEN_SOFT,
    borderWidth: 1, borderColor: GREEN_MID,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, marginBottom: 3 },
  roleDescription: { fontSize: 12, color: TEXT_MUTED, lineHeight: 18 },
  chevronWrap: {
    width: 30, height: 30,
    backgroundColor: GREEN_SOFT,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  // Tags
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: {
    paddingVertical: 4, paddingHorizontal: 10,
    backgroundColor: GREEN_SOFT,
    borderRadius: 999,
    borderWidth: 1, borderColor: GREEN_MID,
  },
  tagText: { fontSize: 10, color: GREEN_DARK, fontWeight: '600' },

  // Info strip
  infoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 8, marginBottom: 4,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: GREEN_SOFT,
    borderRadius: 12, borderWidth: 1, borderColor: GREEN_MID,
  },
  infoText: { fontSize: 12, color: GREEN_DARK, fontWeight: '500' },

  // Login prompt
  loginPrompt: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 24, paddingVertical: 8,
  },
  loginPromptText: { fontSize: 14, color: TEXT_MUTED },
  loginPromptLink: { fontSize: 14, color: GREEN_DARK, fontWeight: '700' },
});