import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { Directory, File, Paths } from 'expo-file-system';

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

// IMPORTANT: Must match the same directory used in EditProfile
const CV_DIRECTORY = new Directory(Paths.document, 'cvs');

export default function Profile({ onNavigate }) {
  const { user } = useSelector((state) => state.auth);
  const [savedCV, setSavedCV] = useState(null);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  // Load locally stored CV
  useEffect(() => {
    loadLocalCV();
  }, []);

  const loadLocalCV = async () => {
    try {
      // Check if directory exists
      if (!CV_DIRECTORY.exists) {
        console.log('CV directory does not exist');
        setSavedCV(null);
        return;
      }
      
      // List all files in the directory
      const files = CV_DIRECTORY.list();
      console.log('Files in CV directory:', files.map(f => f.name));
      
      // Filter for CV files
      const cvFiles = files.filter(file => 
        file.name.endsWith('.pdf') || 
        file.name.endsWith('.doc') || 
        file.name.endsWith('.docx')
      );
      
      if (cvFiles.length > 0) {
        // Get the most recent CV (by modification time or just the first one)
        const latestCV = cvFiles[0];
        console.log('Found CV:', latestCV.name);
        setSavedCV({
          uri: latestCV.uri,
          name: latestCV.name,
          size: latestCV.size,
        });
      } else {
        console.log('No CV files found');
        setSavedCV(null);
      }
    } catch (error) {
      console.error('Error loading local CV:', error);
      setSavedCV(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) {
      const date = new Date();
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const viewCV = async () => {
    if (savedCV && savedCV.uri) {
      try {
        const file = new File(savedCV.uri);
        if (file.exists) {
          // Open the file with the device's default viewer
          await file.open();
        } else {
          Alert.alert('Error', 'CV file not found.');
          setSavedCV(null);
        }
      } catch (error) {
        console.error('Error opening CV:', error);
        Alert.alert('Error', 'Cannot open file. Please try again.');
      }
    }
  };

  // Menu Item Component with chevron on the right
  const MenuItem = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconWrap}>
          <Ionicons name={icon} size={20} color={GREEN_DARK} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={TEXT_LIGHT} />
    </TouchableOpacity>
  );

  // CV Item Component with chevron on the right
  const CVItem = ({ name, date, onPress }) => (
    <TouchableOpacity style={styles.cvItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cvItemLeft}>
        <View style={styles.cvIconWrap}>
          <Ionicons name="document-text-outline" size={20} color={GREEN_DARK} />
        </View>
        <View style={styles.cvItemContent}>
          <Text style={styles.cvItemName}>{name}</Text>
          <Text style={styles.cvItemDate}>Added {date}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={TEXT_LIGHT} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header - No back button as per design */}
        <View style={styles.header}>
          <View style={{ width: 38 }} />
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials || '?'}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.profileName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.profileUsername}>@{user?.username}</Text>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={16} color={TEXT_MUTED} />
              <Text style={styles.contactText}>{user?.email_address}</Text>
            </View>
            {user?.phone_number && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={16} color={TEXT_MUTED} />
                <Text style={styles.contactText}>{user?.phone_number}</Text>
              </View>
            )}
            {(user?.city || user?.country) && (
              <View style={styles.contactRow}>
                <Ionicons name="location-outline" size={16} color={TEXT_MUTED} />
                <Text style={styles.contactText}>
                  {[user?.city, user?.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Resumes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={GREEN_DARK} />
            <Text style={styles.sectionTitle}>Resumes</Text>
          </View>
          
          {savedCV ? (
            <CVItem 
              name={savedCV.name.replace(/^cv_\d+_/, '')} // Clean up filename by removing timestamp prefix
              date={formatDate()}
              onPress={viewCV}
            />
          ) : (
            <View style={styles.noResumeContainer}>
              <Text style={styles.noResumeText}>No resume uploaded yet</Text>
              <TouchableOpacity onPress={() => onNavigate('EditProfile')}>
                <Text style={styles.addResumeText}>Add Resume</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Improve your job matches Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up-outline" size={18} color={GREEN_DARK} />
            <Text style={styles.sectionTitle}>Improve your job matches</Text>
          </View>

          <MenuItem 
            icon="star-outline"
            title="Qualifications"
            subtitle="Highlight your skills and experience"
            onPress={() => onNavigate('EditProfile')}
          />

          <MenuItem 
            icon="options-outline"
            title="Job preferences"
            subtitle="Save specific details like minimum desired pay and schedule"
            onPress={() => onNavigate('EditProfile')}
          />

          <MenuItem 
            icon="eye-off-outline"
            title="Hide jobs with these details"
            subtitle="Manage the qualifications or preferences used to hide jobs from your search"
            onPress={() => onNavigate('EditProfile')}
          />

          <MenuItem 
            icon="checkmark-circle-outline"
            title="Ready to work"
            subtitle="Let employers know that you're available to start working as soon as possible"
            onPress={() => onNavigate('EditProfile')}
          />
        </View>

        {/* Footer Text */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ©2026 Taskra - Cookies, Privacy and Terms
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate('FreelancerDashboard')}>
          <Ionicons name="home-outline" size={22} color={TEXT_MUTED} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate('MyJobs')}>
          <Ionicons name="briefcase-outline" size={22} color={TEXT_MUTED} />
          <Text style={styles.tabLabel}>My jobs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate('Messages')}>
          <Ionicons name="chatbubble-outline" size={22} color={TEXT_MUTED} />
          <Text style={styles.tabLabel}>Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate('Profile')}>
          <Ionicons name="person-outline" size={22} color={GREEN_DARK} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OFF_WHITE },
  scroll: { paddingBottom: 80 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: WHITE,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: TEXT_MAIN 
  },

  // Profile Section
  profileSection: {
    backgroundColor: WHITE,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: GREEN_DARK,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GREEN_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GREEN_DARK,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: WHITE,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 16,
  },
  contactInfo: {
    alignItems: 'flex-start',
    backgroundColor: OFF_WHITE,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  contactText: {
    fontSize: 13,
    color: TEXT_MUTED,
    flex: 1,
  },

  // Section
  section: {
    backgroundColor: WHITE,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_MAIN,
  },

  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GREEN_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GREEN_MID,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
  },

  // CV Item
  cvItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cvItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cvIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: GREEN_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GREEN_MID,
  },
  cvItemContent: {
    flex: 1,
  },
  cvItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  cvItemDate: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  noResumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  noResumeText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  addResumeText: {
    fontSize: 13,
    color: GREEN_DARK,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 11,
    color: TEXT_LIGHT,
    textAlign: 'center',
  },

  // Bottom Tab Bar
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingVertical: 10,
    paddingBottom: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  tabLabelActive: {
    color: GREEN_DARK,
  },
});