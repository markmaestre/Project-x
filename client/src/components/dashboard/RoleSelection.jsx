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

export default function RoleSelection({ onNavigate }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => onNavigate('Home')}
        >
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>X</Text>
          </View>
          <Text style={styles.title}>Join Project X</Text>
          <Text style={styles.subtitle}>Choose how you want to use the platform</Text>
        </View>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => onNavigate('FreelancerRegistration')}
          activeOpacity={0.85}
        >
          <View style={styles.roleIconContainer}>
            <Ionicons name="briefcase-outline" size={40} color="#D4AF37" />
          </View>
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>I'm a Freelancer</Text>
            <Text style={styles.roleDescription}>
              Find work, submit proposals, and get paid for your skills
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => onNavigate('ClientRegistration')}
          activeOpacity={0.85}
        >
          <View style={styles.roleIconContainer}>
            <Ionicons name="people-outline" size={40} color="#D4AF37" />
          </View>
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>I'm a Client</Text>
            <Text style={styles.roleDescription}>
              Post projects, hire talent, and manage your team
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

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
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 32,
    width: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#D4AF37',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoLetter: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 16,
  },
  loginPromptText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  loginPromptLink: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
  },
});