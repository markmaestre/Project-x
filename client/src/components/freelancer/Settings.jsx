import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, TextInput, Modal, Alert, Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

const BG = '#0a0a0a';
const GOLD = '#D4AF37';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const INPUT_BG = '#111111';

export default function Settings({ onNavigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // State for modals
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const settingsOptions = [
    { 
      icon: 'person-outline', 
      label: 'Account Settings', 
      type: 'account',
      color: '#fff' 
    },
    { 
      icon: 'notifications-outline', 
      label: 'Notifications', 
      type: 'notifications',
      color: '#fff' 
    },
    { 
      icon: 'lock-closed-outline', 
      label: 'Privacy & Security', 
      type: 'privacy',
      color: '#fff' 
    },
    { 
      icon: 'card-outline', 
      label: 'Payment Methods', 
      type: 'payment',
      color: '#fff' 
    },
    { 
      icon: 'color-palette-outline', 
      label: 'Appearance', 
      type: 'appearance',
      color: '#fff' 
    },
    { 
      icon: 'language-outline', 
      label: 'Language', 
      type: 'language',
      color: '#fff' 
    },
    { 
      icon: 'help-circle-outline', 
      label: 'Help & Support', 
      type: 'help',
      color: '#fff' 
    },
    { 
      icon: 'information-circle-outline', 
      label: 'About', 
      type: 'about',
      color: '#fff' 
    },
  ];

  const languages = ['English', 'Filipino', 'Spanish', 'French', 'German', 'Japanese', 'Korean'];

  const handleSettingPress = (type) => {
    setSelectedSetting(type);
  };

  const closeModal = () => {
    setSelectedSetting(null);
  };

  const renderModalContent = () => {
    switch (selectedSetting) {
      case 'account':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Account Settings</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="mail-outline" size={20} color={GOLD} />
                  <Text style={styles.settingItemLabel}>Email Address</Text>
                </View>
                <Text style={styles.settingItemValue}>{user?.email_address || 'Not set'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="call-outline" size={20} color={GOLD} />
                  <Text style={styles.settingItemLabel}>Phone Number</Text>
                </View>
                <Text style={styles.settingItemValue}>{user?.phone_number || 'Not set'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="key-outline" size={20} color={GOLD} />
                  <Text style={styles.settingItemLabel}>Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  <Text style={[styles.settingItemLabel, { color: '#ff4444' }]}>Delete Account</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        );
        
      case 'notifications':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.switchItem}>
              <View>
                <Text style={styles.switchLabel}>Push Notifications</Text>
                <Text style={styles.switchSubLabel}>Get notified about new messages and offers</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#3e3e3e', true: GOLD }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.switchItem}>
              <View>
                <Text style={styles.switchLabel}>Email Notifications</Text>
                <Text style={styles.switchSubLabel}>Receive email updates about your account</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#3e3e3e', true: GOLD }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.switchItem}>
              <View>
                <Text style={styles.switchLabel}>Job Alerts</Text>
                <Text style={styles.switchSubLabel}>Get notified about new job opportunities</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#3e3e3e', true: GOLD }}
                thumbColor="#fff"
              />
            </View>
          </View>
        );
        
      case 'privacy':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy & Security</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Ionicons name="eye-off-outline" size={20} color={GOLD} />
                <Text style={styles.settingItemLabel}>Profile Visibility</Text>
              </View>
              <Text style={styles.settingItemValue}>Public</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color={GOLD} />
                <Text style={styles.settingItemLabel}>Two-Factor Authentication</Text>
              </View>
              <Text style={styles.settingItemValue}>Off</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Ionicons name="download-outline" size={20} color={GOLD} />
                <Text style={styles.settingItemLabel}>Download My Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          </View>
        );
        
      case 'payment':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Methods</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.addPaymentBtn}>
              <Ionicons name="add-circle-outline" size={20} color={GOLD} />
              <Text style={styles.addPaymentText}>Add Payment Method</Text>
            </TouchableOpacity>
            
            <View style={styles.paymentCard}>
              <View style={styles.paymentCardHeader}>
                <Ionicons name="card-outline" size={24} color={GOLD} />
                <Text style={styles.paymentCardTitle}>Visa •••• 4242</Text>
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              </View>
              <Text style={styles.paymentCardExpiry}>Expires 12/25</Text>
            </View>
            
            <View style={styles.paymentCard}>
              <View style={styles.paymentCardHeader}>
                <Ionicons name="logo-paypal" size={24} color={GOLD} />
                <Text style={styles.paymentCardTitle}>PayPal</Text>
              </View>
              <Text style={styles.paymentCardExpiry}>user@example.com</Text>
            </View>
          </View>
        );
        
      case 'appearance':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appearance</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.switchItem}>
              <View>
                <Text style={styles.switchLabel}>Dark Mode</Text>
                <Text style={styles.switchSubLabel}>Enable dark theme for the app</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#3e3e3e', true: GOLD }}
                thumbColor="#fff"
              />
            </View>
            
            <TouchableOpacity style={styles.themeOption}>
              <View style={[styles.themeColor, { backgroundColor: '#0a0a0a', borderColor: GOLD, borderWidth: 2 }]} />
              <View>
                <Text style={styles.themeLabel}>Dark</Text>
                <Text style={styles.themeSubLabel}>Default dark theme</Text>
              </View>
              {darkMode && <Ionicons name="checkmark-circle" size={20} color={GOLD} style={styles.themeCheck} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.themeOption}>
              <View style={[styles.themeColor, { backgroundColor: '#ffffff' }]} />
              <View>
                <Text style={styles.themeLabel}>Light</Text>
                <Text style={styles.themeSubLabel}>Light theme option</Text>
              </View>
            </TouchableOpacity>
          </View>
        );
        
      case 'language':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Language</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {languages.map((lang) => (
              <TouchableOpacity 
                key={lang} 
                style={styles.languageOption}
                onPress={() => {
                  setSelectedLanguage(lang);
                  setTimeout(closeModal, 500);
                }}
              >
                <Text style={[styles.languageText, selectedLanguage === lang && styles.languageTextSelected]}>
                  {lang}
                </Text>
                {selectedLanguage === lang && (
                  <Ionicons name="checkmark" size={20} color={GOLD} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );
        
      case 'help':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.helpOption}
              onPress={() => Linking.openURL('mailto:support@projectx.com')}
            >
              <Ionicons name="mail-outline" size={24} color={GOLD} />
              <View style={styles.helpOptionText}>
                <Text style={styles.helpOptionTitle}>Email Support</Text>
                <Text style={styles.helpOptionSub}>Get help via email</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.helpOption}
              onPress={() => Alert.alert('FAQ', 'FAQ section coming soon!')}
            >
              <Ionicons name="help-circle-outline" size={24} color={GOLD} />
              <View style={styles.helpOptionText}>
                <Text style={styles.helpOptionTitle}>FAQ</Text>
                <Text style={styles.helpOptionSub}>Frequently asked questions</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.helpOption}
              onPress={() => Alert.alert('Report', 'Report a problem')}
            >
              <Ionicons name="warning-outline" size={24} color={GOLD} />
              <View style={styles.helpOptionText}>
                <Text style={styles.helpOptionTitle}>Report a Problem</Text>
                <Text style={styles.helpOptionSub}>Report bugs or issues</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          </View>
        );
        
      case 'about':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.aboutHeader}>
              <View style={styles.appIcon}>
                <Ionicons name="grid" size={32} color={GOLD} />
              </View>
              <Text style={styles.appName}>PROJECT X</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
            </View>
            
            <TouchableOpacity style={styles.aboutOption}>
              <Ionicons name="document-text-outline" size={20} color={GOLD} />
              <Text style={styles.aboutOptionText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.aboutOption}>
              <Ionicons name="shield-outline" size={20} color={GOLD} />
              <Text style={styles.aboutOptionText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.aboutOption}>
              <Ionicons name="star-outline" size={20} color={GOLD} />
              <Text style={styles.aboutOptionText}>Rate this App</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
            
            <Text style={styles.copyright}>© 2026 PROJECT X. All rights reserved.</Text>
          </View>
        );
        
      default:
        return null;
    }
  };

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
          <TouchableOpacity 
            key={index} 
            style={styles.optionCard}
            onPress={() => handleSettingPress(option.type)}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={option.icon} size={22} color={GOLD} />
              <Text style={styles.optionLabel}>{option.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Modal for Settings */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedSetting !== null}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeModal} activeOpacity={1} />
          <View style={styles.modalContainer}>
            {renderModalContent()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: CARD_BG, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  container: { flex: 1, padding: 16 },
  optionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: CARD_BG, 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: BORDER 
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionLabel: { fontSize: 15, color: '#fff' },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingItemLabel: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  settingItemValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginRight: 8,
  },
  
  // Switch Items
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  switchSubLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  
  // Payment Methods
  addPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderStyle: 'dashed',
  },
  addPaymentText: {
    fontSize: 14,
    fontWeight: '500',
    color: GOLD,
  },
  paymentCard: {
    backgroundColor: INPUT_BG,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  paymentCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  defaultBadge: {
    backgroundColor: GOLD,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  paymentCardExpiry: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginLeft: 36,
  },
  
  // Theme Options
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  themeColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  themeSubLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  themeCheck: {
    marginLeft: 'auto',
  },
  
  // Language Options
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  languageText: {
    fontSize: 15,
    color: '#fff',
  },
  languageTextSelected: {
    color: GOLD,
    fontWeight: '500',
  },
  
  // Help Options
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  helpOptionText: {
    flex: 1,
  },
  helpOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  helpOptionSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  
  // About Styles
  aboutHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  aboutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  aboutOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  copyright: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 24,
    marginBottom: 16,
  },
});