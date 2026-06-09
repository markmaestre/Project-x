import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const GREEN = '#4ADE80';
const GREEN_DARK = '#22C55E';
const GREEN_SOFT = '#DCFCE7';
const GREEN_MID = '#86EFAC';
const WHITE = '#FFFFFF';
const OFF_WHITE = '#F0FDF4';
const SURFACE = '#F7FEF9';
const BORDER = 'rgba(74,222,128,0.2)';
const TEXT_MAIN = '#0F2417';
const TEXT_MUTED = '#6B7280';
const TEXT_LIGHT = '#9CA3AF';

const FEATURED_JOBS = [
  {
    id: '1',
    title: 'UI/UX Designer',
    company: 'TechStart PH',
    budget: '₱25,000',
    type: 'Fixed Price',
    tags: ['Figma', 'Mobile', 'Branding'],
    icon: 'color-palette-outline',
  },
  {
    id: '2',
    title: 'React Native Developer',
    company: 'RemoteHub Asia',
    budget: '₱80,000/mo',
    type: 'Full-time',
    tags: ['React Native', 'Node.js', 'API'],
    icon: 'code-slash-outline',
  },
  {
    id: '3',
    title: 'Content Writer',
    company: 'GrowthMark',
    budget: '₱8,000',
    type: 'Fixed Price',
    tags: ['SEO', 'Copywriting', 'Blog'],
    icon: 'create-outline',
  },
];

const FIND_TALENT = [
  {
    id: '1',
    title: 'Video Editor Needed',
    budget: '₱15,000',
    skills: ['Premiere Pro', 'After Effects'],
    icon: 'film-outline',
    urgent: true,
  },
  {
    id: '2',
    title: 'Virtual Assistant',
    budget: '₱20,000/mo',
    skills: ['Admin', 'Email', 'Scheduling'],
    icon: 'headset-outline',
    urgent: false,
  },
  {
    id: '3',
    title: 'Social Media Manager',
    budget: '₱18,000/mo',
    skills: ['Instagram', 'TikTok', 'Canva'],
    icon: 'share-social-outline',
    urgent: false,
  },
];

export default function Home({ onNavigate, isLoggedIn = false }) {
  // If user is not logged in, redirect to Login instead of the target screen
  const guardedNavigate = (targetScreen) => {
    if (!isLoggedIn) {
      onNavigate('Login');
    } else {
      onNavigate(targetScreen);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.container}>

          {/* Nav */}
          <View style={styles.nav}>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>T</Text>
              </View>
              <Text style={styles.logoText}>TASKRA</Text>
            </View>
            <TouchableOpacity
              style={styles.btnLogin}
              onPress={() => onNavigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnLoginText}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* Badge */}
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Now live in the Philippines</Text>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.headline}>
              Find Work{'\n'}
              <Text style={styles.headlineGreen}>You Love,{'\n'}</Text>
              Get Paid.
            </Text>
            <Text style={styles.subtitle}>
              Connect with premium clients, manage your gigs, and receive payments on time — all in one place.
            </Text>
          </View>

          {/* CTA Row */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.btnGreen}
              onPress={() => onNavigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnGreenText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnOutline}
              activeOpacity={0.8}
              onPress={() => guardedNavigate('Freelancer')}
            >
              <Text style={styles.btnOutlineText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Strip */}
          <View style={styles.statsRow}>
            {[
              { value: '12K+', label: 'Freelancers' },
              { value: '3K+', label: 'Clients' },
              { value: '98%', label: 'Paid on Time' },
            ].map((s, i) => (
              <View key={i} style={[styles.statItem, i < 2 && styles.statBorder]}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>EXPLORE</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Section: Featured Jobs */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>FIND WORK</Text>
              <Text style={styles.sectionTitle}>Featured Jobs</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => guardedNavigate('Freelancer')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {FEATURED_JOBS.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              activeOpacity={0.8}
              onPress={() => guardedNavigate('Freelancer')}
            >
              <View style={styles.jobCardTop}>
                <View style={styles.jobIconWrap}>
                  <Ionicons name={job.icon} size={20} color={GREEN_DARK} />
                </View>
                <View style={styles.jobMeta}>
                  <Text style={styles.jobType}>{job.type}</Text>
                  <Text style={styles.jobBudget}>{job.budget}</Text>
                </View>
              </View>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobCompany}>{job.company}</Text>
              <View style={styles.tagRow}>
                {job.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}

          {/* Section: Find Talent */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <View>
              <Text style={styles.sectionLabel}>POST A TASK</Text>
              <Text style={styles.sectionTitle}>Find Talent</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => guardedNavigate('Client')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {FIND_TALENT.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              activeOpacity={0.8}
              onPress={() => guardedNavigate('Client')}
            >
              <View style={styles.taskLeft}>
                <View style={styles.taskIconWrap}>
                  <Ionicons name={task.icon} size={18} color={GREEN_DARK} />
                </View>
                <View style={styles.taskInfo}>
                  <View style={styles.taskTitleRow}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.urgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>Urgent</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.tagRow}>
                    {task.skills.map((skill) => (
                      <View key={skill} style={styles.tagDark}>
                        <Text style={styles.tagDarkText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <Text style={styles.taskBudget}>{task.budget}</Text>
            </TouchableOpacity>
          ))}

          {/* Bottom CTA */}
          <View style={styles.bottomCta}>
            <View style={styles.bottomCtaCard}>
              <View style={styles.bottomCtaIcon}>
                <Ionicons name="flash" size={22} color={GREEN_DARK} />
              </View>
              <Text style={styles.bottomCtaText}>
                Ready to start earning?
              </Text>
              <Text style={styles.bottomCtaSub}>
                Join thousands of Filipino freelancers already on Taskra.
              </Text>
              <TouchableOpacity
                style={styles.btnGreenFull}
                onPress={() => onNavigate('Register')}
                activeOpacity={0.85}
              >
                <Text style={styles.btnGreenText}>Create Free Account →</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },

  // Nav
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: GREEN,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  logoLetter: {
    fontSize: 16,
    fontWeight: '800',
    color: WHITE,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    color: TEXT_MAIN,
  },
  btnLogin: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  btnLoginText: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN_DARK,
    letterSpacing: 0.3,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: GREEN_SOFT,
    borderWidth: 1,
    borderColor: GREEN_MID,
    borderRadius: 999,
    marginBottom: 24,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: GREEN_DARK,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: GREEN_DARK,
    fontWeight: '500',
  },

  // Hero
  hero: {
    marginBottom: 28,
  },
  headline: {
    fontSize: 44,
    fontWeight: '300',
    color: TEXT_MAIN,
    lineHeight: 50,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  headlineGreen: {
    color: GREEN_DARK,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: TEXT_MUTED,
    lineHeight: 22,
  },

  // CTA Row
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  btnGreen: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: GREEN,
    borderRadius: 12,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnGreenFull: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: GREEN,
    borderRadius: 12,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnGreenText: {
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.3,
  },
  btnOutline: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
  },
  btnOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN_DARK,
    letterSpacing: 0.3,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
    marginBottom: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(74,222,128,0.15)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN_DARK,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    letterSpacing: 0.5,
    fontWeight: '500',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(74,222,128,0.3)',
  },
  dividerText: {
    fontSize: 10,
    letterSpacing: 3,
    color: GREEN_MID,
    fontWeight: '600',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: GREEN_DARK,
    marginBottom: 3,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT_MAIN,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 12,
    color: GREEN_DARK,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Job Cards
  jobCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  jobCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobIconWrap: {
    width: 42,
    height: 42,
    backgroundColor: GREEN_SOFT,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobMeta: {
    alignItems: 'flex-end',
  },
  jobType: {
    fontSize: 10,
    color: TEXT_LIGHT,
    letterSpacing: 0.5,
    marginBottom: 2,
    fontWeight: '500',
  },
  jobBudget: {
    fontSize: 15,
    fontWeight: '700',
    color: GREEN_DARK,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 3,
  },
  jobCompany: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: GREEN_SOFT,
    borderWidth: 1,
    borderColor: GREEN_MID,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 10,
    color: GREEN_DARK,
    letterSpacing: 0.3,
    fontWeight: '500',
  },

  // Task Cards
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  taskIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: GREEN_SOFT,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  urgentBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 999,
  },
  urgentText: {
    fontSize: 9,
    color: '#EF4444',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  tagDark: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: SURFACE,
    borderRadius: 999,
    marginRight: 4,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
  },
  tagDarkText: {
    fontSize: 10,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  taskBudget: {
    fontSize: 13,
    fontWeight: '700',
    color: GREEN_DARK,
    marginLeft: 8,
  },

  // Bottom CTA
  bottomCta: {
    marginTop: 40,
  },
  bottomCtaCard: {
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: GREEN_MID,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  bottomCtaIcon: {
    width: 48,
    height: 48,
    backgroundColor: GREEN_SOFT,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bottomCtaText: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_MAIN,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  bottomCtaSub: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
});