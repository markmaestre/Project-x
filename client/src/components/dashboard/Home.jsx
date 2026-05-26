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

export default function Home({ onNavigate }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.container}>

          {/* Nav */}
          <View style={styles.nav}>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>X</Text>
              </View>
              <Text style={styles.logoText}>PROJECT X</Text>
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
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Shesh — project x</Text>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.headline}>
              Your Work,{'\n'}
              <Text style={styles.headlineGold}>Your Rules{'\n'}</Text>
              Await
            </Text>
            <Text style={styles.subtitle}>
              Find premium clients, manage gigs, and get paid on time, all in one place.
            </Text>
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
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>See all </Text>
            </TouchableOpacity>
          </View>

          {FEATURED_JOBS.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              activeOpacity={0.8}
              onPress={() => onNavigate('Freelancer')}
            >
              <View style={styles.jobCardTop}>
                <View style={styles.jobIconWrap}>
                  <Ionicons name={job.icon} size={20} color={GOLD} />
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
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {FIND_TALENT.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              activeOpacity={0.8}
              onPress={() => onNavigate('Client')}
            >
              <View style={styles.taskLeft}>
                <View style={styles.taskIconWrap}>
                  <Ionicons name={task.icon} size={18} color="rgba(255,255,255,0.5)" />
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
            <Text style={styles.bottomCtaText}>
              Ready to start earning?
            </Text>
            <TouchableOpacity
              style={styles.btnGoldFull}
              onPress={() => onNavigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnGoldText}>Create Free Account </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const GOLD = '#D4AF37';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 60,
  },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 52,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logoBox: {
    width: 30,
    height: 30,
    backgroundColor: GOLD,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  logoText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.4)',
  },
  btnLogin: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: GOLD,
    borderRadius: 8,
  },
  btnLoginText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0a0a0a',
    letterSpacing: 0.5,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 999,
    marginBottom: 28,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: GOLD,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.5)',
  },

  hero: {
    marginBottom: 8,
  },
  headline: {
    fontSize: 48,
    fontWeight: '300',
    color: '#ffffff',
    lineHeight: 52,
    marginBottom: 18,
  },
  headlineGold: {
    color: GOLD,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.38)',
    lineHeight: 21,
    marginBottom: 36,
  },

  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 48,
  },
  btnGold: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: GOLD,
    borderRadius: 10,
  },
  btnGoldFull: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: GOLD,
    borderRadius: 10,
  },
  btnGoldText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0a0a0a',
    letterSpacing: 0.5,
  },
  btnOutline: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
  },
  btnOutlineText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.2)',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: GOLD,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#ffffff',
  },
  seeAll: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.3,
  },

  // Job Cards
  jobCard: {
    backgroundColor: '#111111',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  jobCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobMeta: {
    alignItems: 'flex-end',
  },
  jobType: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  jobBudget: {
    fontSize: 14,
    fontWeight: '500',
    color: GOLD,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
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
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.2)',
    borderRadius: 999,
  },
  tagText: {
    fontSize: 10,
    color: 'rgba(212,175,55,0.8)',
    letterSpacing: 0.3,
  },

  // Task Cards
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  taskIconWrap: {
    width: 38,
    height: 38,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
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
    fontWeight: '500',
    color: '#ffffff',
  },
  urgentBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    backgroundColor: 'rgba(220,53,69,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(220,53,69,0.3)',
    borderRadius: 999,
  },
  urgentText: {
    fontSize: 9,
    color: '#ff6b6b',
    letterSpacing: 0.5,
  },
  tagDark: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    marginRight: 4,
  },
  tagDarkText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  taskBudget: {
    fontSize: 13,
    fontWeight: '500',
    color: GOLD,
    marginLeft: 8,
  },

  bottomCta: {
    marginTop: 40,
    gap: 14,
  },
  bottomCtaText: {
    fontSize: 22,
    fontWeight: '300',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 30,
  },
});