import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, Paths } from 'expo-file-system';
import { logout } from '../../Redux/slices/authSlice';
import { getReceivedOffers, getOfferStats } from '../../Redux/slices/offerSlice';
import { getFreelancerJobs } from '../../Redux/slices/jobSlice';
import { getFreelancerApplications, applyForJob } from '../../Redux/slices/applicationSlice';

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
const RED        = '#EF4444';
const ORANGE     = '#F97316';
// ─────────────────────────────────────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get('window');

const PHILIPPINE_LOCATIONS = [
  'Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Mandaluyong', 'Parañaque',
  'Las Piñas', 'Muntinlupa', 'Marikina', 'Pasay', 'Caloocan', 'Malabon', 'Navotas',
  'Valenzuela', 'San Juan', 'Pateros',
  'Angeles City', 'Baguio City', 'Olongapo City', 'San Fernando (Pampanga)', 'Tarlac City',
  'Cabanatuan City', 'Batangas City', 'Lipa City', 'Lucena City', 'Antipolo', 'Cainta',
  'Binangonan', 'Santa Rosa', 'Biñan', 'Cabuyao', 'San Pedro', 'Calamba', 'Los Baños',
  'Dagupan City', 'Urdaneta City', 'San Carlos (Pangasinan)', 'Vigan City', 'Laoag City',
  'Naga City', 'Legazpi City', 'Tabaco City', 'Sorsogon City', 'Baler', 'Tuguegarao',
  'Santiago City', 'Cauayan City', 'Ilagan City', 'Puerto Princesa City', 'Calapan City',
  'Nasugbu', 'Taal', 'Tagaytay City', 'Silang', 'Dasmariñas', 'Imus', 'Bacoor',
  'General Trias', 'Trece Martires City', 'Tanauan', 'Santo Tomas',
  'Cebu City', 'Mandaue City', 'Lapu-Lapu City', 'Toledo City', 'Danao City', 'Talisay (Cebu)',
  'Bacolod City', 'Silay City', 'Talisay (Negros Occidental)', 'Kabankalan City',
  'Iloilo City', 'Passi City', 'Roxas City', 'Kalibo', 'San Jose (Antique)',
  'Tacloban City', 'Ormoc City', 'Baybay City', 'Catbalogan City', 'Calbayog City',
  'Tagbilaran City', 'Dumaguete City', 'Bais City', 'Bayawan City', 'Siquijor',
  'Davao City', 'Tagum City', 'Panabo City', 'Digos City', 'Mati City', 'Samal Island',
  'General Santos City', 'Koronadal City', 'Tacurong City', 'Kidapawan City',
  'Cagayan de Oro City', 'Iligan City', 'Oroquieta City', 'Ozamiz City', 'Tangub City',
  'Zamboanga City', 'Pagadian City', 'Dipolog City', 'Dapitan City',
  'Butuan City', 'Surigao City', 'Tandag City', 'Bislig City', 'Bayugan City',
  'Cotabato City', 'Marawi City', 'Jolo', 'Bongao',
];

const EDUCATION_LEVELS = [
  'High School Diploma',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate (PhD)',
  'Vocational/Trade School',
  'Some College (No Degree)',
  'Other'
];

// ── Bottom Tab Bar ─────────────────────────────────────────────────────────────────
function BottomTabBar({ activeTab, onTabPress, pendingOffers }) {
  const tabs = [
    { key: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'Messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { key: 'MyJobs', label: 'My Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
    { key: 'MyApplications', label: 'Applications', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' },
    { key: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isMyJobs = tab.key === 'MyJobs';
          const hasBadge = tab.key === 'Messages' && pendingOffers > 0;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                isMyJobs && styles.tabItemCenter,
              ]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              {isMyJobs ? (
                <View style={[styles.centerButton, isActive && styles.centerButtonActive]}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={26}
                    color={isActive ? WHITE : BLUE}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.tabIconWrap}>
                    <Ionicons
                      name={isActive ? tab.activeIcon : tab.icon}
                      size={22}
                      color={isActive ? BLUE : TEXT_LIGHT}
                    />
                    {hasBadge && <View style={styles.tabBadgeDot} />}
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ── Modals ──────────────────────────────────────────────────────────────────────────
function ApplicationStatusModal({ visible, jobTitle, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={statusStyles.overlay}>
        <View style={statusStyles.container}>
          <View style={statusStyles.iconContainer}>
            <Ionicons name="checkmark-circle" size={64} color={GREEN} />
          </View>
          <Text style={statusStyles.title}>Application Submitted!</Text>
          <Text style={statusStyles.message}>
            Your application for "{jobTitle}" has been sent successfully.
          </Text>
          <View style={statusStyles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={BLUE} />
            <Text style={statusStyles.infoText}>
              The client will review your application and contact you if shortlisted.
            </Text>
          </View>
          <TouchableOpacity style={statusStyles.button} onPress={onClose}>
            <Text style={statusStyles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AlreadyAppliedModal({ visible, jobTitle, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={statusStyles.overlay}>
        <View style={statusStyles.container}>
          <View style={[statusStyles.iconContainer, { backgroundColor: `${ORANGE}15` }]}>
            <Ionicons name="alert-circle" size={64} color={ORANGE} />
          </View>
          <Text style={[statusStyles.title, { color: ORANGE }]}>Already Applied</Text>
          <Text style={statusStyles.message}>
            You have already submitted an application for "{jobTitle}".
          </Text>
          <View style={statusStyles.infoBox}>
            <Ionicons name="time-outline" size={20} color={ORANGE} />
            <Text style={[statusStyles.infoText, { color: ORANGE }]}>
              Please wait for the client's response. You will be notified when there's an update.
            </Text>
          </View>
          <TouchableOpacity style={[statusStyles.button, { backgroundColor: ORANGE }]} onPress={onClose}>
            <Text style={statusStyles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Client Profile Modal ───────────────────────────────────────────────────────────
function ClientProfileModal({ visible, client, onClose }) {
  if (!client) return null;
  
  // Check if client has information
  const hasDescription = client.description && client.description.length > 0;
  const hasEmail = client.email && client.email.length > 0;
  const hasPhone = client.phone && client.phone.length > 0;
  const hasLocation = client.location && client.location.length > 0;
  const hasCompany = client.company_name && client.company_name.length > 0;
  const hasBusinessType = client.business_type && client.business_type.length > 0;
  const hasIndustry = client.industry && client.industry.length > 0;
  const hasWebsite = client.website && client.website.length > 0;
  const hasBudgetRange = client.budget_range && client.budget_range.length > 0;
  
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={clientProfileStyles.overlay}>
        <TouchableOpacity style={clientProfileStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={clientProfileStyles.container}>
          <View style={clientProfileStyles.handle} />
          
          <View style={clientProfileStyles.header}>
            <Text style={clientProfileStyles.headerTitle}>Client Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={clientProfileStyles.body} showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            <View style={clientProfileStyles.profileHeader}>
              {client.profile_picture ? (
                <Image source={{ uri: client.profile_picture }} style={clientProfileStyles.profileAvatar} />
              ) : (
                <View style={clientProfileStyles.profileAvatarPlaceholder}>
                  <Ionicons name="person" size={40} color={NAVY} />
                </View>
              )}
              <View style={clientProfileStyles.profileInfo}>
                <Text style={clientProfileStyles.profileName}>
                  {client.first_name || ''} {client.last_name || ''}
                </Text>
                {hasCompany && (
                  <Text style={clientProfileStyles.profileCompany}>
                    <Ionicons name="business-outline" size={14} color={TEXT_MUTED} />
                    {' '}{client.company_name}
                  </Text>
                )}
                <View style={clientProfileStyles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={GREEN} />
                  <Text style={clientProfileStyles.verifiedText}>Verified Client</Text>
                </View>
              </View>
            </View>
            
            {/* About/Description */}
            <View style={clientProfileStyles.section}>
              <Text style={clientProfileStyles.sectionLabel}>
                <Ionicons name="information-circle-outline" size={14} color={BLUE} />
                {' '}About
              </Text>
              {hasDescription ? (
                <Text style={clientProfileStyles.description}>{client.description}</Text>
              ) : (
                <Text style={clientProfileStyles.noInfoText}>No description provided</Text>
              )}
            </View>
            
            {/* Company Information */}
            <View style={clientProfileStyles.section}>
              <Text style={clientProfileStyles.sectionLabel}>
                <Ionicons name="business-outline" size={14} color={BLUE} />
                {' '}Company Information
              </Text>
              {hasCompany ? (
                <View style={clientProfileStyles.infoItem}>
                  <Ionicons name="business-outline" size={18} color={TEXT_MUTED} />
                  <Text style={clientProfileStyles.infoText}>{client.company_name}</Text>
                </View>
              ) : (
                <View style={clientProfileStyles.infoItem}>
                  <Ionicons name="business-outline" size={18} color={TEXT_LIGHT} />
                  <Text style={clientProfileStyles.noInfoText}>No company name provided</Text>
                </View>
              )}
              {hasBusinessType ? (
                <View style={clientProfileStyles.infoItem}>
                  <Ionicons name="layers-outline" size={18} color={TEXT_MUTED} />
                  <Text style={clientProfileStyles.infoText}>{client.business_type}</Text>
                </View>
              ) : (
                <View style={clientProfileStyles.infoItem}>
                  <Ionicons name="layers-outline" size={18} color={TEXT_LIGHT} />
                  <Text style={clientProfileStyles.noInfoText}>No business type provided</Text>
                </View>
              )}
              {hasIndustry ? (
                <View style={clientProfileStyles.infoItem}>
                  <Ionicons name="construct-outline" size={18} color={TEXT_MUTED} />
                  <Text style={clientProfileStyles.infoText}>{client.industry}</Text>
                </View>
              ) : (
                <View style={clientProfileStyles.infoItem}>
                  <Ionicons name="construct-outline" size={18} color={TEXT_LIGHT} />
                  <Text style={clientProfileStyles.noInfoText}>No industry provided</Text>
                </View>
              )}
              {hasWebsite ? (
                <View style={clientProfileStyles.infoItem}>
                  <Ionicons name="globe-outline" size={18} color={TEXT_MUTED} />
                  <Text style={clientProfileStyles.infoText}>{client.website}</Text>
                </View>
              ) : (
                <View style={clientProfileStyles.infoItem}>
                  <Ionicons name="globe-outline" size={18} color={TEXT_LIGHT} />
                  <Text style={clientProfileStyles.noInfoText}>No website provided</Text>
                </View>
              )}
              {hasBudgetRange ? (
                <View style={clientProfileStyles.infoItem}>
                  <Ionicons name="cash-outline" size={18} color={TEXT_MUTED} />
                  <Text style={clientProfileStyles.infoText}>{client.budget_range}</Text>
                </View>
              ) : (
                <View style={clientProfileStyles.infoItem}>
                  <Ionicons name="cash-outline" size={18} color={TEXT_LIGHT} />
                  <Text style={clientProfileStyles.noInfoText}>No budget range provided</Text>
                </View>
              )}
            </View>
            
            {/* Contact Information */}
            <View style={clientProfileStyles.section}>
              <Text style={clientProfileStyles.sectionLabel}>
                <Ionicons name="contact-outline" size={14} color={BLUE} />
                {' '}Contact Information
              </Text>
              {hasEmail ? (
                <View style={clientProfileStyles.contactItem}>
                  <Ionicons name="mail-outline" size={18} color={TEXT_MUTED} />
                  <Text style={clientProfileStyles.contactText}>{client.email}</Text>
                </View>
              ) : (
                <View style={clientProfileStyles.contactItem}>
                  <Ionicons name="mail-outline" size={18} color={TEXT_LIGHT} />
                  <Text style={clientProfileStyles.noInfoText}>No email provided</Text>
                </View>
              )}
              {hasPhone ? (
                <View style={clientProfileStyles.contactItem}>
                  <Ionicons name="call-outline" size={18} color={TEXT_MUTED} />
                  <Text style={clientProfileStyles.contactText}>{client.phone}</Text>
                </View>
              ) : (
                <View style={clientProfileStyles.contactItem}>
                  <Ionicons name="call-outline" size={18} color={TEXT_LIGHT} />
                  <Text style={clientProfileStyles.noInfoText}>No phone provided</Text>
                </View>
              )}
              {hasLocation ? (
                <View style={clientProfileStyles.contactItem}>
                  <Ionicons name="location-outline" size={18} color={TEXT_MUTED} />
                  <Text style={clientProfileStyles.contactText}>{client.location}</Text>
                </View>
              ) : (
                <View style={clientProfileStyles.contactItem}>
                  <Ionicons name="location-outline" size={18} color={TEXT_LIGHT} />
                  <Text style={clientProfileStyles.noInfoText}>No location provided</Text>
                </View>
              )}
            </View>
            
            {/* Statistics - Updated to show rate instead of total spent and hire rate */}
            <View style={clientProfileStyles.section}>
              <Text style={clientProfileStyles.sectionLabel}>
                <Ionicons name="stats-chart-outline" size={14} color={BLUE} />
                {' '}Statistics
              </Text>
              <View style={clientProfileStyles.statsGrid}>
                {client.jobs_posted !== undefined && (
                  <View style={clientProfileStyles.statCard}>
                    <Text style={clientProfileStyles.statValue}>{client.jobs_posted || 0}</Text>
                    <Text style={clientProfileStyles.statLabel}>Jobs Posted</Text>
                  </View>
                )}
                {client.rate !== undefined && (
                  <View style={clientProfileStyles.statCard}>
                    <Text style={clientProfileStyles.statValue}>
                      {client.rate ? `₱${client.rate.toLocaleString()}` : 'N/A'}
                    </Text>
                    <Text style={clientProfileStyles.statLabel}>Rate</Text>
                  </View>
                )}
                {client.member_since && (
                  <View style={clientProfileStyles.statCard}>
                    <Text style={clientProfileStyles.statValue}>
                      {new Date(client.member_since).getFullYear()}
                    </Text>
                    <Text style={clientProfileStyles.statLabel}>Member Since</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Format functions
const formatLocation = (location) => {
  if (!location) return null;
  if (typeof location === 'string') return location;
  const parts = [];
  if (location.specific_area) parts.push(location.specific_area);
  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  if (location.country && location.country !== 'Philippines') parts.push(location.country);
  return parts.length > 0 ? parts.join(', ') : null;
};

const formatJobType = (type) => ({
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
  one_time: 'One Time', internship: 'Internship', freelance: 'Freelance'
}[type] || type);

const formatWorkSetup = (setup) => ({ remote: 'Remote', onsite: 'Onsite', hybrid: 'Hybrid' }[setup] || setup);

const formatPayInformation = (payInfo, budgetAmount) => {
  if (payInfo?.salary_range?.min || payInfo?.salary_range?.max) {
    const { min, max, currency = 'PHP' } = payInfo.salary_range;
    const freq = payInfo.payment_frequency === 'one-time' ? 'one-time' : `per ${payInfo.payment_frequency || 'month'}`;
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} ${freq}`;
    if (min) return `${currency} ${min.toLocaleString()}+ ${freq}`;
  }
  if (budgetAmount) return `₱${budgetAmount.toLocaleString()}`;
  return null;
};

const formatBudgetForCard = (job) => {
  if (job.pay_information?.salary_range) {
    const { min, max, currency = 'PHP' } = job.pay_information.salary_range;
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
  }
  if (job.budget_amount) return `₱${job.budget_amount.toLocaleString()}`;
  return null;
};

// ── Skeleton Card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobCardTop}>
        <View style={[styles.skeletonLine, { width: 60, height: 22, borderRadius: 999 }]} />
        <View style={[styles.skeletonLine, { width: 20, height: 20, borderRadius: 6 }]} />
      </View>
      <View style={[styles.skeletonLine, { width: '75%', height: 17, marginBottom: 8 }]} />
      <View style={[styles.skeletonLine, { width: '50%', height: 13, marginBottom: 10 }]} />
      <View style={[styles.skeletonLine, { width: '40%', height: 12, marginBottom: 12 }]} />
      <View style={[styles.skeletonLine, { width: 110, height: 28, borderRadius: 20, marginBottom: 12 }]} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <View style={[styles.skeletonLine, { width: 64, height: 28, borderRadius: 999 }]} />
        <View style={[styles.skeletonLine, { width: 72, height: 28, borderRadius: 999 }]} />
        <View style={[styles.skeletonLine, { width: 56, height: 28, borderRadius: 999 }]} />
      </View>
    </View>
  );
}

// ── Application Modal Component ──────────────────────────────────────────────
function ApplicationModal({ visible, job, onClose, onSubmit, submitting, userProfile }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [useExistingCV, setUseExistingCV] = useState(true);
  const [existingCVInfo, setExistingCVInfo] = useState(null);
  
  const [educationLevel, setEducationLevel] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  
  const [experiences, setExperiences] = useState([]);
  const [currentExperience, setCurrentExperience] = useState({
    jobTitle: '',
    companyName: '',
    startDate: '',
    endDate: '',
    currentlyWorking: false,
    description: '',
  });
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState(null);

  useEffect(() => {
    if (visible && job) {
      const checkExistingCV = async () => {
        try {
          const cvDirectory = new Directory(Paths.document, 'cvs');
          if (cvDirectory.exists) {
            const files = cvDirectory.list();
            const cvFiles = files.filter(file => 
              file.name.endsWith('.pdf') || 
              file.name.endsWith('.doc') || 
              file.name.endsWith('.docx')
            );
            if (cvFiles.length > 0) {
              const latestCV = cvFiles[0];
              setExistingCVInfo({
                name: latestCV.name,
                uri: latestCV.uri,
                size: latestCV.size
              });
              setUseExistingCV(true);
              setResumeFile(null);
            } else {
              setExistingCVInfo(null);
              setUseExistingCV(false);
            }
          } else {
            setExistingCVInfo(null);
            setUseExistingCV(false);
          }
        } catch (error) {
          console.error('Error checking existing CV:', error);
          setExistingCVInfo(null);
          setUseExistingCV(false);
        }
      };
      
      checkExistingCV();
      setProposedRate(job.budget_amount?.toString() || '');
      setCurrentStep(1);
      setCoverLetter('');
      setEducationLevel('');
      setFieldOfStudy('');
      setInstitutionName('');
      setGraduationYear('');
      setExperiences([]);
    }
  }, [visible, job]);

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });
      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        setResumeFile({
          name: file.name,
          uri: file.uri,
          mimeType: file.mimeType,
          size: file.size,
        });
        setUseExistingCV(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select resume file');
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    if (existingCVInfo) {
      setUseExistingCV(true);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const addExperience = () => {
    if (!currentExperience.jobTitle.trim() || !currentExperience.companyName.trim()) {
      Alert.alert('Error', 'Please fill in job title and company name');
      return;
    }
    if (editingExperienceIndex !== null) {
      const updatedExperiences = [...experiences];
      updatedExperiences[editingExperienceIndex] = { ...currentExperience, id: Date.now().toString() };
      setExperiences(updatedExperiences);
      setEditingExperienceIndex(null);
    } else {
      setExperiences([...experiences, { ...currentExperience, id: Date.now().toString() }]);
    }
    setCurrentExperience({
      jobTitle: '',
      companyName: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      description: '',
    });
    setShowExperienceForm(false);
  };

  const editExperience = (index) => {
    setCurrentExperience(experiences[index]);
    setEditingExperienceIndex(index);
    setShowExperienceForm(true);
  };

  const removeExperience = (index) => {
    Alert.alert('Remove Experience', 'Are you sure you want to remove this experience?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setExperiences(experiences.filter((_, i) => i !== index));
      }}
    ]);
  };

  const validateStep1 = () => {
    if (!useExistingCV && !resumeFile) {
      Alert.alert('Required', 'Please upload your resume/CV or use your existing one');
      return false;
    }
    if (!educationLevel) {
      Alert.alert('Required', 'Please select your highest education level');
      return false;
    }
    if (!fieldOfStudy.trim()) {
      Alert.alert('Required', 'Please enter your field of study');
      return false;
    }
    if (!institutionName.trim()) {
      Alert.alert('Required', 'Please enter your institution name');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const formData = new FormData();
    if (!job?._id) {
      Alert.alert('Error', 'Invalid job data. Please try again.');
      return;
    }
    formData.append('job_id', job._id);
    formData.append('cover_letter', coverLetter.trim() || "I'm interested in this position.");
    if (proposedRate) {
      formData.append('proposed_rate', parseFloat(proposedRate).toString());
    }
    if (useExistingCV && existingCVInfo) {
      const fileExt = existingCVInfo.name.split('.').pop().toLowerCase();
      let mimeType = 'application/pdf';
      if (fileExt === 'doc') mimeType = 'application/msword';
      if (fileExt === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      formData.append('resume', {
        uri: existingCVInfo.uri,
        name: existingCVInfo.name,
        type: mimeType,
      });
    } else if (resumeFile) {
      formData.append('resume', {
        uri: resumeFile.uri,
        name: resumeFile.name,
        type: resumeFile.mimeType || 'application/pdf',
      });
    }
    const educationData = {
      level: educationLevel,
      field_of_study: fieldOfStudy,
      institution: institutionName,
      graduation_year: graduationYear || null,
    };
    formData.append('education', JSON.stringify(educationData));
    const experiencesData = experiences.map(exp => ({
      job_title: exp.jobTitle,
      company_name: exp.companyName,
      start_date: exp.startDate,
      end_date: exp.currentlyWorking ? null : exp.endDate,
      currently_working: exp.currentlyWorking,
      description: exp.description,
    }));
    if (experiencesData.length > 0) {
      formData.append('experiences', JSON.stringify(experiencesData));
    }
    onSubmit(formData);
  };

  const renderStepIndicator = () => (
    <View style={applyStyles.stepIndicator}>
      <View style={[applyStyles.stepDot, currentStep >= 1 && applyStyles.stepDotActive]}>
        <Text style={[applyStyles.stepDotText, currentStep >= 1 && applyStyles.stepDotTextActive]}>1</Text>
      </View>
      <View style={[applyStyles.stepLine, currentStep >= 2 && applyStyles.stepLineActive]} />
      <View style={[applyStyles.stepDot, currentStep >= 2 && applyStyles.stepDotActive]}>
        <Text style={[applyStyles.stepDotText, currentStep >= 2 && applyStyles.stepDotTextActive]}>2</Text>
      </View>
      <View style={[applyStyles.stepLine, currentStep >= 3 && applyStyles.stepLineActive]} />
      <View style={[applyStyles.stepDot, currentStep >= 3 && applyStyles.stepDotActive]}>
        <Text style={[applyStyles.stepDotText, currentStep >= 3 && applyStyles.stepDotTextActive]}>3</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={applyStyles.modalOverlay}>
        <View style={applyStyles.modalContent}>
          <View style={applyStyles.modalHeader}>
            <TouchableOpacity onPress={handlePrevStep} disabled={currentStep === 1}>
              <Ionicons name="arrow-back" size={24} color={currentStep === 1 ? TEXT_LIGHT : TEXT_MAIN} />
            </TouchableOpacity>
            <Text style={applyStyles.modalTitle}>Apply for Job</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
          
          {renderStepIndicator()}
          
          <View style={applyStyles.modalContentWrapper}>
            <View style={applyStyles.jobInfoHeader}>
              <Text style={applyStyles.applyJobTitle}>{job?.title}</Text>
              <Text style={applyStyles.applyJobCompany}>{job?.client_id?.company_name || 'Client'}</Text>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={applyStyles.stepContent}>
              {currentStep === 1 && (
                <>
                  <Text style={applyStyles.applyLabel}>Resume/CV *</Text>
                  {existingCVInfo && !resumeFile && (
                    <View style={applyStyles.existingCVContainer}>
                      <TouchableOpacity 
                        style={[applyStyles.existingCVOption, useExistingCV && applyStyles.existingCVOptionActive]}
                        onPress={() => { setUseExistingCV(true); setResumeFile(null); }}
                      >
                        <Ionicons name="document-text" size={24} color={useExistingCV ? BLUE : TEXT_MUTED} />
                        <View style={applyStyles.existingCVInfo}>
                          <Text style={applyStyles.existingCVName}>{existingCVInfo.name}</Text>
                          <Text style={applyStyles.existingCVSize}>{formatFileSize(existingCVInfo.size)}</Text>
                        </View>
                        {useExistingCV && <Ionicons name="checkmark-circle" size={20} color={BLUE} />}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[applyStyles.existingCVOption, !useExistingCV && applyStyles.existingCVOptionActive]}
                        onPress={() => setUseExistingCV(false)}
                      >
                        <Ionicons name="cloud-upload-outline" size={24} color={!useExistingCV ? BLUE : TEXT_MUTED} />
                        <Text style={applyStyles.uploadNewText}>Upload new CV</Text>
                        {!useExistingCV && <Ionicons name="checkmark-circle" size={20} color={BLUE} />}
                      </TouchableOpacity>
                    </View>
                  )}
                  {(!existingCVInfo || !useExistingCV) && (
                    <>
                      {!resumeFile ? (
                        <TouchableOpacity style={applyStyles.uploadBtn} onPress={pickResume}>
                          <Ionicons name="cloud-upload-outline" size={24} color={BLUE} />
                          <Text style={applyStyles.uploadBtnText}>Upload your resume (PDF, DOC, DOCX)</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={applyStyles.fileInfo}>
                          <Ionicons name="document-text-outline" size={20} color={BLUE} />
                          <Text style={applyStyles.fileName}>{resumeFile.name}</Text>
                          <TouchableOpacity onPress={removeResume}>
                            <Ionicons name="close-circle" size={20} color={RED} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}

                  <Text style={applyStyles.applyLabel}>Highest Level of Education Completed *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {EDUCATION_LEVELS.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[applyStyles.educationChip, educationLevel === level && applyStyles.educationChipActive]}
                        onPress={() => setEducationLevel(level)}
                      >
                        <Text style={[applyStyles.educationChipText, educationLevel === level && applyStyles.educationChipTextActive]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={applyStyles.applyLabel}>Field of Study *</Text>
                  <TextInput style={applyStyles.applyInput} placeholder="e.g., Computer Science" placeholderTextColor={TEXT_LIGHT} value={fieldOfStudy} onChangeText={setFieldOfStudy} />

                  <Text style={applyStyles.applyLabel}>Institution Name *</Text>
                  <TextInput style={applyStyles.applyInput} placeholder="e.g., University of Technology" placeholderTextColor={TEXT_LIGHT} value={institutionName} onChangeText={setInstitutionName} />

                  <Text style={applyStyles.applyLabel}>Graduation Year (Optional)</Text>
                  <TextInput style={applyStyles.applyInput} placeholder="e.g., 2020" placeholderTextColor={TEXT_LIGHT} value={graduationYear} onChangeText={setGraduationYear} keyboardType="numeric" />
                </>
              )}

              {currentStep === 2 && (
                <>
                  <View style={applyStyles.experienceHeader}>
                    <Text style={applyStyles.applyLabel}>Work Experience (Optional)</Text>
                    <TouchableOpacity style={applyStyles.addExperienceBtn} onPress={() => setShowExperienceForm(true)}>
                      <Ionicons name="add-circle" size={20} color={BLUE} />
                      <Text style={applyStyles.addExperienceText}>Add Experience</Text>
                    </TouchableOpacity>
                  </View>

                  {experiences.length === 0 ? (
                    <View style={applyStyles.noExperience}>
                      <Ionicons name="briefcase-outline" size={32} color={TEXT_LIGHT} />
                      <Text style={applyStyles.noExperienceText}>No experience added yet</Text>
                      <Text style={applyStyles.noExperienceSub}>Tap "Add Experience" to showcase your work history</Text>
                    </View>
                  ) : (
                    experiences.map((exp, index) => (
                      <View key={exp.id || index} style={applyStyles.experienceCard}>
                        <View style={applyStyles.experienceCardHeader}>
                          <Text style={applyStyles.experienceJobTitle}>{exp.jobTitle}</Text>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity onPress={() => editExperience(index)}>
                              <Ionicons name="pencil-outline" size={16} color={TEXT_MUTED} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeExperience(index)}>
                              <Ionicons name="trash-outline" size={16} color={RED} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={applyStyles.experienceCompany}>{exp.companyName}</Text>
                        <Text style={applyStyles.experienceDate}>
                          {exp.startDate || 'Start date'} - {exp.currentlyWorking ? 'Present' : (exp.endDate || 'End date')}
                        </Text>
                      </View>
                    ))
                  )}

                  <Modal visible={showExperienceForm} animationType="slide" transparent>
                    <View style={applyStyles.expModalWrap}>
                      <View style={applyStyles.expModalSheet}>
                        <View style={applyStyles.expModalHeader}>
                          <Text style={applyStyles.expModalTitle}>{editingExperienceIndex !== null ? 'Edit Experience' : 'Add Experience'}</Text>
                          <TouchableOpacity onPress={() => { setShowExperienceForm(false); setEditingExperienceIndex(null); }}>
                            <Ionicons name="close" size={24} color={TEXT_MUTED} />
                          </TouchableOpacity>
                        </View>
                        <ScrollView style={applyStyles.expModalContent}>
                          <Text style={applyStyles.applyLabel}>Job Title *</Text>
                          <TextInput style={applyStyles.applyInput} placeholder="e.g., Senior Developer" value={currentExperience.jobTitle} onChangeText={(text) => setCurrentExperience({...currentExperience, jobTitle: text})} />
                          <Text style={applyStyles.applyLabel}>Company Name *</Text>
                          <TextInput style={applyStyles.applyInput} placeholder="e.g., Google" value={currentExperience.companyName} onChangeText={(text) => setCurrentExperience({...currentExperience, companyName: text})} />
                          <Text style={applyStyles.applyLabel}>Start Date</Text>
                          <TextInput style={applyStyles.applyInput} placeholder="e.g., Jan 2020" value={currentExperience.startDate} onChangeText={(text) => setCurrentExperience({...currentExperience, startDate: text})} />
                          <TouchableOpacity style={applyStyles.currentlyWorkingRow} onPress={() => setCurrentExperience({...currentExperience, currentlyWorking: !currentExperience.currentlyWorking})}>
                            <View style={[applyStyles.checkbox, currentExperience.currentlyWorking && applyStyles.checkboxChecked]}>
                              {currentExperience.currentlyWorking && <Ionicons name="checkmark" size={12} color={WHITE} />}
                            </View>
                            <Text style={applyStyles.checkboxLabel}>I currently work here</Text>
                          </TouchableOpacity>
                          {!currentExperience.currentlyWorking && (
                            <>
                              <Text style={applyStyles.applyLabel}>End Date</Text>
                              <TextInput style={applyStyles.applyInput} placeholder="e.g., Dec 2023" value={currentExperience.endDate} onChangeText={(text) => setCurrentExperience({...currentExperience, endDate: text})} />
                            </>
                          )}
                          <Text style={applyStyles.applyLabel}>Description (Optional)</Text>
                          <TextInput style={[applyStyles.applyInput, applyStyles.applyTextArea]} placeholder="Describe your responsibilities..." value={currentExperience.description} onChangeText={(text) => setCurrentExperience({...currentExperience, description: text})} multiline numberOfLines={3} />
                        </ScrollView>
                        <TouchableOpacity style={applyStyles.expModalBtn} onPress={addExperience}>
                          <Text style={applyStyles.expModalBtnText}>{editingExperienceIndex !== null ? 'Update' : 'Add'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <Text style={applyStyles.reviewSectionTitle}>Review Your Application</Text>
                  <View style={applyStyles.reviewCard}>
                    <Text style={applyStyles.reviewLabel}>Resume:</Text>
                    <Text style={applyStyles.reviewValue}>{useExistingCV && existingCVInfo ? existingCVInfo.name : (resumeFile?.name || 'Not uploaded')}</Text>
                    <Text style={applyStyles.reviewLabel}>Education:</Text>
                    <Text style={applyStyles.reviewValue}>{educationLevel} in {fieldOfStudy}</Text>
                    <Text style={applyStyles.reviewLabel}>Institution:</Text>
                    <Text style={applyStyles.reviewValue}>{institutionName}</Text>
                  </View>

                  <Text style={applyStyles.reviewSubTitle}>Cover Letter & Rate</Text>
                  <View style={applyStyles.reviewCard}>
                    {proposedRate && <Text style={applyStyles.reviewValue}>Proposed Rate: ₱{parseFloat(proposedRate).toLocaleString()}</Text>}
                    <TextInput style={applyStyles.coverLetterInput} placeholder="Write your cover letter here (optional)..." placeholderTextColor={TEXT_LIGHT} value={coverLetter} onChangeText={setCoverLetter} multiline numberOfLines={4} />
                  </View>
                </>
              )}
            </ScrollView>
          </View>

          <View style={applyStyles.applyModalFooter}>
            {currentStep < 3 ? (
              <TouchableOpacity style={applyStyles.nextStepBtn} onPress={handleNextStep}>
                <Text style={applyStyles.nextStepBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={WHITE} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[applyStyles.submitBtn, submitting && applyStyles.disabledBtn]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={WHITE} /> : <Text style={applyStyles.submitBtnText}>Submit Application</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Location Search ────────────────────────────────────────────────────────────
function LocationSearchInput({ value, onChangeText, onSelectLocation, placeholder }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleTextChange = (text) => {
    onChangeText(text);
    if (text.length > 1) {
      const filtered = PHILIPPINE_LOCATIONS.filter(loc =>
        loc.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectLocation = (location) => {
    onChangeText(location);
    onSelectLocation(location);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.locationInputContainer}>
      <View style={styles.searchSide}>
        <Ionicons name="location-outline" size={18} color={TEXT_MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder || "City or area..."}
          placeholderTextColor={TEXT_LIGHT}
          value={value}
          onChangeText={handleTextChange}
          returnKeyType="search"
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => value.length > 1 && setShowSuggestions(true)}
        />
        {value !== '' && (
          <TouchableOpacity onPress={() => { onChangeText(''); onSelectLocation(''); setShowSuggestions(false); }}>
            <Ionicons name="close-circle" size={16} color={TEXT_LIGHT} />
          </TouchableOpacity>
        )}
      </View>
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => selectLocation(item)} activeOpacity={0.7}>
                <Ionicons name="location-outline" size={16} color={BLUE} />
                <Text style={styles.suggestionText}>{item}</Text>
                <Ionicons name="arrow-forward" size={14} color={TEXT_LIGHT} />
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
            nestedScrollEnabled
          />
        </View>
      )}
    </View>
  );
}

// ── Job Detail Bottom Sheet ────────────────────────────────────────────────────
function JobDetailSheet({ job, visible, onClose, onApply, hasApplied, onViewClientProfile }) {
  if (!job) return null;

  const locationText = formatLocation(job.location);
  const payText = formatPayInformation(job.pay_information, job.budget_amount);
  const skills = job.required_skills || job.skills || [];
  const client = job.client_id || {};

  // Check if client has information
  const hasEmail = client.email && client.email.length > 0;
  const hasPhone = client.phone && client.phone.length > 0;
  const hasLocation = client.location && client.location.length > 0;
  const hasCompany = client.company_name && client.company_name.length > 0;
  const hasBusinessType = client.business_type && client.business_type.length > 0;
  const hasIndustry = client.industry && client.industry.length > 0;
  const hasWebsite = client.website && client.website.length > 0;
  const hasBudgetRange = client.budget_range && client.budget_range.length > 0;
  const hasDescription = client.description && client.description.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sheet.overlay}>
        <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={sheet.container}>
          <View style={sheet.handle} />
          <View style={sheet.header}>
            <View style={sheet.companyLogo}>
              <Ionicons name="briefcase-outline" size={22} color={BLUE} />
            </View>
            <View style={sheet.headerInfo}>
              <Text style={sheet.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>
              <Text style={sheet.jobCompany}>{job.client_id?.company_name || job.company_name || 'Company'}</Text>
            </View>
            <TouchableOpacity style={sheet.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <View style={sheet.metaRow}>
            {locationText && (
              <View style={sheet.metaChip}>
                <Ionicons name="location-outline" size={13} color={TEXT_MUTED} />
                <Text style={sheet.metaText}>{locationText}</Text>
              </View>
            )}
            {job.job_type && (
              <View style={sheet.metaChip}>
                <Ionicons name="briefcase-outline" size={13} color={TEXT_MUTED} />
                <Text style={sheet.metaText}>{formatJobType(job.job_type)}</Text>
              </View>
            )}
            {job.work_setup && (
              <View style={sheet.metaChip}>
                <Ionicons name="wifi-outline" size={13} color={TEXT_MUTED} />
                <Text style={sheet.metaText}>{formatWorkSetup(job.work_setup)}</Text>
              </View>
            )}
            {payText && (
              <View style={[sheet.metaChip, sheet.metaChipBlue]}>
                <Ionicons name="cash-outline" size={13} color={GOLD_DK} />
                <Text style={[sheet.metaText, { color: GOLD_DK, fontWeight: '600' }]}>{payText}</Text>
              </View>
            )}
          </View>

          <View style={sheet.divider} />

          <ScrollView style={sheet.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* CLIENT PROFILE SECTION - Clickable to view full profile */}
            {client && Object.keys(client).length > 0 && (
              <View style={sheet.section}>
                <View style={sheet.clientSectionHeader}>
                  <Ionicons name="person-circle-outline" size={18} color={BLUE} />
                  <Text style={sheet.sectionLabel}>About the Client</Text>
                </View>
                
                <TouchableOpacity 
                  style={sheet.clientCard}
                  onPress={() => onViewClientProfile(client)}
                  activeOpacity={0.7}
                >
                  <View style={sheet.clientHeader}>
                    {client.profile_picture ? (
                      <Image source={{ uri: client.profile_picture }} style={sheet.clientAvatar} />
                    ) : (
                      <View style={sheet.clientAvatarPlaceholder}>
                        <Ionicons name="person-outline" size={24} color={NAVY} />
                      </View>
                    )}
                    <View style={sheet.clientInfo}>
                      <Text style={sheet.clientName}>
                        {client.first_name || ''} {client.last_name || ''}
                      </Text>
                      {hasCompany && (
                        <Text style={sheet.clientCompany}>
                          <Ionicons name="business-outline" size={12} color={TEXT_MUTED} />
                          {' '}{client.company_name}
                        </Text>
                      )}
                      <View style={sheet.clientBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={GREEN} />
                        <Text style={sheet.clientBadgeText}>Verified Client</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={TEXT_LIGHT} />
                  </View>
                  
                  {/* Client Description */}
                  {hasDescription && (
                    <View style={sheet.clientDescriptionContainer}>
                      <Text style={sheet.clientDescriptionLabel}>
                        <Ionicons name="information-circle-outline" size={12} color={TEXT_MUTED} />
                        {' '}About
                      </Text>
                      <Text style={sheet.clientDescription} numberOfLines={3}>
                        {client.description}
                      </Text>
                    </View>
                  )}

                  {/* Company Information */}
                  {(hasCompany || hasBusinessType || hasIndustry || hasWebsite || hasBudgetRange) && (
                    <View style={sheet.clientCompanyContainer}>
                      <Text style={sheet.clientDescriptionLabel}>
                        <Ionicons name="business-outline" size={12} color={TEXT_MUTED} />
                        {' '}Company Details
                      </Text>
                      {hasCompany && (
                        <View style={sheet.clientDetail}>
                          <Ionicons name="business-outline" size={14} color={TEXT_MUTED} />
                          <Text style={sheet.clientDetailText}>{client.company_name}</Text>
                        </View>
                      )}
                      {hasBusinessType && (
                        <View style={sheet.clientDetail}>
                          <Ionicons name="layers-outline" size={14} color={TEXT_MUTED} />
                          <Text style={sheet.clientDetailText}>{client.business_type}</Text>
                        </View>
                      )}
                      {hasIndustry && (
                        <View style={sheet.clientDetail}>
                          <Ionicons name="construct-outline" size={14} color={TEXT_MUTED} />
                          <Text style={sheet.clientDetailText}>{client.industry}</Text>
                        </View>
                      )}
                      {hasWebsite && (
                        <View style={sheet.clientDetail}>
                          <Ionicons name="globe-outline" size={14} color={TEXT_MUTED} />
                          <Text style={sheet.clientDetailText}>{client.website}</Text>
                        </View>
                      )}
                      {hasBudgetRange && (
                        <View style={sheet.clientDetail}>
                          <Ionicons name="cash-outline" size={14} color={TEXT_MUTED} />
                          <Text style={sheet.clientDetailText}>{client.budget_range}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Contact Details */}
                  {(hasEmail || hasPhone || hasLocation) && (
                    <View style={sheet.clientContactContainer}>
                      <Text style={sheet.clientDescriptionLabel}>
                        <Ionicons name="contact-outline" size={12} color={TEXT_MUTED} />
                        {' '}Contact
                      </Text>
                      {hasEmail && (
                        <View style={sheet.clientDetail}>
                          <Ionicons name="mail-outline" size={14} color={TEXT_MUTED} />
                          <Text style={sheet.clientDetailText}>{client.email}</Text>
                        </View>
                      )}
                      {hasPhone && (
                        <View style={sheet.clientDetail}>
                          <Ionicons name="call-outline" size={14} color={TEXT_MUTED} />
                          <Text style={sheet.clientDetailText}>{client.phone}</Text>
                        </View>
                      )}
                      {hasLocation && (
                        <View style={sheet.clientDetail}>
                          <Ionicons name="location-outline" size={14} color={TEXT_MUTED} />
                          <Text style={sheet.clientDetailText}>{client.location}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Client Statistics - Updated to show rate instead of total spent and hire rate */}
                  {(client.jobs_posted !== undefined || client.rate !== undefined) && (
                    <View style={sheet.clientStats}>
                      {client.jobs_posted !== undefined && (
                        <View style={sheet.clientStat}>
                          <Text style={sheet.clientStatValue}>{client.jobs_posted || 0}</Text>
                          <Text style={sheet.clientStatLabel}>Jobs Posted</Text>
                        </View>
                      )}
                      {client.rate !== undefined && (
                        <View style={sheet.clientStat}>
                          <Text style={sheet.clientStatValue}>
                            {client.rate ? `₱${client.rate.toLocaleString()}` : 'N/A'}
                          </Text>
                          <Text style={sheet.clientStatLabel}>Rate</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* View Full Profile Button */}
                  <View style={sheet.viewProfileBtn}>
                    <Text style={sheet.viewProfileBtnText}>Tap to view full profile</Text>
                    <Ionicons name="arrow-forward" size={16} color={BLUE} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {skills.length > 0 && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Required Skills</Text>
                <View style={sheet.tagRow}>
                  {skills.map((s, i) => (
                    <View key={i} style={sheet.tag}><Text style={sheet.tagText}>{s}</Text></View>
                  ))}
                </View>
              </View>
            )}
            
            <View style={sheet.section}>
              <Text style={sheet.sectionLabel}>Job Description</Text>
              <Text style={sheet.descText}>{job.description || 'No description provided.'}</Text>
            </View>
            
            {job.requirements && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Requirements & Qualifications</Text>
                {typeof job.requirements === 'object' ? (
                  <View>
                    {job.requirements.min_years_experience > 0 && (
                      <Text style={sheet.descText}>• {job.requirements.min_years_experience}+ years of experience</Text>
                    )}
                    {job.requirements.preferred_tools?.length > 0 && (
                      <Text style={sheet.descText}>• Preferred tools: {job.requirements.preferred_tools.join(', ')}</Text>
                    )}
                    {job.requirements.additional_requirements && (
                      <Text style={sheet.descText}>• {job.requirements.additional_requirements}</Text>
                    )}
                  </View>
                ) : (
                  <Text style={sheet.descText}>{job.requirements}</Text>
                )}
              </View>
            )}
            
            <View style={sheet.detailGrid}>
              {job.experience_level && (
                <View style={sheet.detailItem}>
                  <Ionicons name="bar-chart-outline" size={16} color={BLUE} />
                  <View><Text style={sheet.detailLabel}>Experience Level</Text><Text style={sheet.detailValue}>{job.experience_level}</Text></View>
                </View>
              )}
              {job.urgency_level && (
                <View style={sheet.detailItem}>
                  <Ionicons name="flame-outline" size={16} color={BLUE} />
                  <View><Text style={sheet.detailLabel}>Urgency</Text><Text style={sheet.detailValue}>{job.urgency_level?.toUpperCase()}</Text></View>
                </View>
              )}
              {job.estimated_duration && (
                <View style={sheet.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={BLUE} />
                  <View><Text style={sheet.detailLabel}>Duration</Text><Text style={sheet.detailValue}>{job.estimated_duration}</Text></View>
                </View>
              )}
              {job.created_at && (
                <View style={sheet.detailItem}>
                  <Ionicons name="time-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={sheet.detailLabel}>Posted</Text>
                    <Text style={sheet.detailValue}>{new Date(job.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={sheet.footer}>
            <TouchableOpacity style={sheet.saveBtn} activeOpacity={0.7}>
              <Ionicons name="bookmark-outline" size={20} color={BLUE} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[sheet.applyBtn, hasApplied && sheet.applyBtnDisabled]}
              onPress={() => !hasApplied && onApply(job)} 
              activeOpacity={0.85}
              disabled={hasApplied}
            >
              <Text style={sheet.applyBtnText}>
                {hasApplied ? 'Already Applied' : 'Apply Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function FreelancerScreen({ onNavigate, route }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { receivedOffers, isLoading: offersLoading } = useSelector(s => s.offers);
  const { list: jobs, isLoading: jobsLoading } = useSelector(s => s.jobs.jobs);
  const { applications, isLoading: appsLoading } = useSelector(s => s.applications);

  const [activeTab, setActiveTab] = useState('Home');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlreadyAppliedModal, setShowAlreadyAppliedModal] = useState(false);
  const [showClientProfileModal, setShowClientProfileModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [applicationStatus, setApplicationStatus] = useState({});

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`;
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  // Restore active tab when coming back from other screens
  useEffect(() => {
    if (route?.params?.returnState?.activeTab) {
      setActiveTab(route.params.returnState.activeTab);
    }
  }, [route?.params]);

  const fetchDashboardData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getReceivedOffers({})).unwrap(),
        dispatch(getFreelancerJobs({ limit: 20 })).unwrap(),
        dispatch(getFreelancerApplications({})).unwrap(),
      ]);
      try { await dispatch(getOfferStats()).unwrap(); } catch (_) {}
    } catch (e) { console.error('Dashboard fetch error:', e); }
  }, [dispatch]);

  const fetchApplications = useCallback(async () => {
    try {
      const result = await dispatch(getFreelancerApplications({})).unwrap();
      const list = result.applications || result.data || result || [];
      const appliedIds = list.map(app => app.job_id?._id || app.job_id);
      setAppliedJobIds(appliedIds);
      
      const statusMap = {};
      list.forEach(app => {
        const jobId = app.job_id?._id || app.job_id;
        statusMap[jobId] = {
          status: app.status || 'pending',
          appliedAt: app.created_at,
          message: app.message
        };
      });
      setApplicationStatus(statusMap);
    } catch (e) { console.error('Error fetching applications:', e); }
  }, [dispatch]);

  useEffect(() => {
    fetchDashboardData();
    fetchApplications();
  }, [fetchDashboardData, fetchApplications]);

  useEffect(() => {
    if (jobs && jobs.length > 0) {
      let filtered = [...jobs];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(j =>
          j.title?.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q) ||
          j.required_skills?.some(s => s.toLowerCase().includes(q))
        );
      }
      if (locationQuery.trim()) {
        const lq = locationQuery.toLowerCase();
        filtered = filtered.filter(j =>
          (formatLocation(j.location)?.toLowerCase() || '').includes(lq)
        );
      }
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs([]);
    }
  }, [jobs, searchQuery, locationQuery]);

  const pendingOffers = receivedOffers?.filter(o => o.status === 'pending').length || 0;
  const isInitialLoading = jobsLoading && !refreshing && (!jobs || jobs.length === 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await fetchApplications();
    setRefreshing(false);
  }, [fetchDashboardData, fetchApplications]);

  const handleTabPress = (key) => {
    if (key === 'Home') {
      setActiveTab(key);
    } else {
      const returnState = { activeTab: key };
      if (key === 'MyJobs') {
        onNavigate('MyJobs', { returnState });
      } else if (key === 'Messages') {
        onNavigate('Messages', { returnState });
      } else if (key === 'Profile') {
        onNavigate('FreelancerProfile', { returnState });
      } else if (key === 'MyApplications') {
        onNavigate('MyApplications', { returnState });
      }
    }
  };

  const handleLogout = () =>
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await dispatch(logout()); onNavigate('Login'); } },
    ]);

  const openJobDetail = (job) => { 
    setSelectedJob(job); 
    setSheetVisible(true); 
  };
  
  const handleApply = (job) => { 
    if (appliedJobIds.includes(job._id)) {
      setSelectedJob(job);
      setShowAlreadyAppliedModal(true);
      return;
    }
    setSheetVisible(false); 
    setSelectedJob(job); 
    setShowApplyModal(true); 
  };

  const handleViewClientProfile = (client) => {
    // Ensure we have all client data, use defaults if missing
    const fullClient = {
      ...client,
      description: client.description || 'No description provided',
      email: client.email || 'No email provided',
      location: client.location || 'No location provided',
      phone: client.phone || 'No phone provided',
      company_name: client.company_name || 'No company name',
      business_type: client.business_type || 'No business type',
      industry: client.industry || 'No industry',
      website: client.website || 'No website',
      budget_range: client.budget_range || 'No budget range',
      jobs_posted: client.jobs_posted || 0,
      rate: client.rate || null,
    };
    setSelectedClient(fullClient);
    setShowClientProfileModal(true);
  };

  const handleSubmitApplication = async (formData) => {
    if (!selectedJob?._id) { 
      Alert.alert('Error', 'Invalid job data.'); 
      setShowApplyModal(false); 
      return; 
    }
    if (appliedJobIds.includes(selectedJob._id)) { 
      setShowApplyModal(false);
      setShowAlreadyAppliedModal(true);
      return; 
    }
    setSubmitting(true);
    try {
      await dispatch(applyForJob(formData)).unwrap();
      setAppliedJobIds([...appliedJobIds, selectedJob._id]);
      setShowApplyModal(false);
      setShowSuccessModal(true);
      await fetchApplications();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayJobs = filteredJobs.length > 0 ? filteredJobs : (jobs || []);

  const renderJobItem = useCallback(({ item: job }) => {
    const locationDisplay = formatLocation(job.location) || 'Remote';
    const budgetDisplay = formatBudgetForCard(job);
    const skills = job.required_skills || job.skills || [];
    const workSetup = formatWorkSetup(job.work_setup);
    const hasApplied = appliedJobIds.includes(job._id);
    const appStatus = applicationStatus[job._id];

    return (
      <TouchableOpacity style={styles.jobCard} onPress={() => openJobDetail(job)} activeOpacity={0.85}>
        <View style={styles.jobCardTop}>
          {job.urgency_level === 'urgent' && (
            <View style={styles.badgeUrgent}><Text style={styles.badgeUrgentText}>Urgent</Text></View>
          )}
          {workSetup && (
            <View style={styles.badgeWorkSetup}>
              <Ionicons name={job.work_setup === 'remote' ? 'wifi' : 'business'} size={10} color={BLUE} />
              <Text style={styles.badgeWorkSetupText}>{workSetup}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.bookmarkBtn}>
            <Ionicons name="bookmark-outline" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        <Text style={styles.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>
        <Text style={styles.jobCompany}>{job.client_id?.company_name || job.company_name || 'Company'}</Text>

        <View style={styles.jobMetaRow}>
          <Ionicons name="location-outline" size={12} color={TEXT_MUTED} />
          <Text style={styles.jobLocation}>{locationDisplay}</Text>
        </View>

        {budgetDisplay && (
          <View style={styles.budgetChip}>
            <Ionicons name="cash-outline" size={13} color={GOLD_DK} />
            <Text style={styles.budgetText}>{budgetDisplay}</Text>
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.tagRow}>
            {skills.slice(0, 3).map((s, i) => (
              <View key={i} style={styles.tag}><Text style={styles.tagText}>{s}</Text></View>
            ))}
            {skills.length > 3 && (
              <View style={styles.tag}><Text style={styles.tagText}>+{skills.length - 3}</Text></View>
            )}
          </View>
        )}

        {hasApplied && (
          <View style={styles.appliedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={GREEN} />
            <Text style={styles.appliedBadgeText}>Applied</Text>
            {appStatus?.status === 'pending' && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [appliedJobIds, applicationStatus]);

  const ListHeader = (
    <>
      <View style={styles.searchSection}>
        <View style={styles.searchPill}>
          <View style={styles.searchSide}>
            <Ionicons name="search-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search jobs "
              placeholderTextColor={TEXT_LIGHT}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.pillDivider} />
          <LocationSearchInput
            value={locationQuery}
            onChangeText={setLocationQuery}
            onSelectLocation={setLocationQuery}
            placeholder="City or area.."
          />
        </View>

        {(searchQuery || locationQuery) && (
          <View style={styles.activeFilters}>
            <Text style={styles.activeFiltersLabel}>Filters:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {searchQuery && (
                <TouchableOpacity style={styles.filterChip} onPress={() => setSearchQuery('')}>
                  <Text style={styles.filterChipText}>"{searchQuery}"</Text>
                  <Ionicons name="close-circle" size={14} color={TEXT_MUTED} />
                </TouchableOpacity>
              )}
              {locationQuery && (
                <TouchableOpacity style={styles.filterChip} onPress={() => setLocationQuery('')}>
                  <Text style={styles.filterChipText}>📍 {locationQuery}</Text>
                  <Ionicons name="close-circle" size={14} color={TEXT_MUTED} />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      <Text style={styles.welcomeBack}>Welcome back</Text>
      <View style={styles.welcomeRow}>
        <Text style={styles.welcomeName}>{fullName || 'Freelancer'}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.avatarBtn}>
          {user?.profile_picture
            ? <Image source={{ uri: user.profile_picture }} style={styles.avatarImg} />
            : <Text style={styles.avatarInitials}>{initials}</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Recommended Jobs
          {!isInitialLoading && displayJobs.length > 0 && (
            <Text style={styles.sectionCount}> ({displayJobs.length})</Text>
          )}
        </Text>
        <TouchableOpacity onPress={() => onNavigate('BrowseJobs')}>
          <Text style={styles.sectionLink}>See all </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const SkeletonList = (
    <View style={styles.jobsListContainer}>
      {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
    </View>
  );

  const EmptyComponent = (
    <View style={styles.emptyCard}>
      <Ionicons name="briefcase-outline" size={40} color={SILVER2} />
      <Text style={styles.emptyTitle}>No jobs found</Text>
      <Text style={styles.emptySub}>Try adjusting your search or check back later</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>T</Text>
            </View>
            <View>
              <Text style={styles.topbarBrand}>Taskra</Text>
              <Text style={styles.topbarTagline}>Freelancer Hub</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => onNavigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={WHITE} />
            {pendingOffers > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        {isInitialLoading ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {ListHeader}
            {SkeletonList}
          </ScrollView>
        ) : (
          <FlatList
            data={displayJobs.slice(0, 8)}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderJobItem}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={EmptyComponent}
            contentContainerStyle={styles.jobsListContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
          />
        )}

        {/* Bottom Tab Bar */}
        <BottomTabBar 
          activeTab={activeTab} 
          onTabPress={handleTabPress} 
          pendingOffers={pendingOffers}
        />
      </View>

      <JobDetailSheet
        job={selectedJob}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onApply={handleApply}
        hasApplied={selectedJob ? appliedJobIds.includes(selectedJob._id) : false}
        onViewClientProfile={handleViewClientProfile}
      />

      {/* Client Profile Modal */}
      <ClientProfileModal
        visible={showClientProfileModal}
        client={selectedClient}
        onClose={() => {
          setShowClientProfileModal(false);
          setSelectedClient(null);
        }}
      />

      <ApplicationModal
        visible={showApplyModal}
        job={selectedJob}
        onClose={() => setShowApplyModal(false)}
        onSubmit={handleSubmitApplication}
        submitting={submitting}
        userProfile={user}
      />

      <ApplicationStatusModal
        visible={showSuccessModal}
        jobTitle={selectedJob?.title || ''}
        onClose={() => setShowSuccessModal(false)}
      />

      <AlreadyAppliedModal
        visible={showAlreadyAppliedModal}
        jobTitle={selectedJob?.title || ''}
        onClose={() => setShowAlreadyAppliedModal(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: BG },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: NAVY,
  },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 34, height: 34, backgroundColor: GOLD, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 18, fontWeight: '800', color: NAVY },
  topbarBrand: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  topbarTagline: { fontSize: 9, fontWeight: '500', color: GOLD_LT, letterSpacing: 1.44, textTransform: 'uppercase', marginTop: 1 },
  notifBtn: { position: 'relative', padding: 4 },
  notifDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD, borderWidth: 2, borderColor: NAVY },

  searchSection: { paddingHorizontal: 16, marginTop: 16, marginBottom: 20 },
  searchPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderRadius: 28,
    borderWidth: 1.5, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    overflow: 'visible',
    zIndex: 10,
  },
  searchSide: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 4, gap: 8 },
  pillDivider: { width: 1, height: 28, backgroundColor: BORDER },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_MAIN, paddingVertical: 10 },
  locationInputContainer: { flex: 1, position: 'relative', zIndex: 20 },
  suggestionsContainer: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: WHITE, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    marginTop: 8, zIndex: 1000,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 10,
  },
  suggestionsList: { maxHeight: 200 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  suggestionText: { fontSize: 14, color: TEXT_MAIN, flex: 1 },
  activeFilters: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeFiltersLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${BLUE}10`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: `${BLUE}25`, marginRight: 8 },
  filterChipText: { fontSize: 11, color: BLUE },

  welcomeBack: { fontSize: 22, fontWeight: '700', color: TEXT_MAIN, paddingHorizontal: 20, marginBottom: 2 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 22 },
  welcomeName: { fontSize: 22, fontWeight: '700', color: TEXT_MAIN },
  avatarBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD_LT },
  avatarImg: { width: 38, height: 38, borderRadius: 19 },
  avatarInitials: { fontSize: 13, fontWeight: '700', color: NAVY },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN },
  sectionCount: { fontSize: 14, fontWeight: '500', color: TEXT_MUTED },
  sectionLink: { fontSize: 13, color: BLUE, fontWeight: '600' },

  jobsListContainer: { paddingHorizontal: 16, paddingBottom: 80 },

  jobCard: {
    backgroundColor: CARD, marginBottom: 12, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  jobCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' },
  badgeUrgent: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeUrgentText: { fontSize: 11, fontWeight: '600', color: '#D97706' },
  badgeWorkSetup: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${BLUE}10`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeWorkSetupText: { fontSize: 10, fontWeight: '600', color: BLUE },
  bookmarkBtn: { marginLeft: 'auto', padding: 2 },
  jobTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 4, lineHeight: 23 },
  jobCompany: { fontSize: 13, color: TEXT_MUTED, marginBottom: 6 },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  jobLocation: { fontSize: 12, color: TEXT_MUTED },
  budgetChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(200,149,32,0.08)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(200,149,32,0.2)', marginBottom: 10 },
  budgetText: { fontSize: 12, color: GOLD_DK, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingVertical: 5, paddingHorizontal: 12, backgroundColor: BG, borderRadius: 999, borderWidth: 1.5, borderColor: BORDER },
  tagText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  appliedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: `${GREEN}10`, borderRadius: 6, alignSelf: 'flex-start' },
  appliedBadgeText: { fontSize: 11, color: GREEN, fontWeight: '600' },
  pendingBadge: { backgroundColor: `${ORANGE}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  pendingBadgeText: { fontSize: 9, color: ORANGE, fontWeight: '500' },

  skeletonLine: { backgroundColor: BORDER, borderRadius: 6, marginBottom: 6, opacity: 0.6 },

  emptyCard: { backgroundColor: CARD, marginHorizontal: 0, borderRadius: 18, borderWidth: 1.5, borderColor: BORDER, padding: 36, alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, marginTop: 14, marginBottom: 6 },
  emptySub: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', paddingHorizontal: 20 },

  tabSafe: { 
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: 0,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabItemCenter: {
    flex: 0,
    marginHorizontal: 8,
    marginTop: -16,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2.5,
    borderColor: WHITE,
  },
  centerButtonActive: {
    backgroundColor: BLUE,
    transform: [{ scale: 1.02 }],
  },
  tabIconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: BLUE,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: BLUE,
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -3,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    borderWidth: 1.5,
    borderColor: WHITE,
  },
});

// ── Bottom sheet styles ────────────────────────────────────────────────────────
const sheet = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,26,62,0.55)' },
  container: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_H * 0.88, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 999, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 14, gap: 12 },
  companyLogo: { width: 48, height: 48, borderRadius: 14, backgroundColor: `${BLUE}10`, borderWidth: 1.5, borderColor: `${BLUE}18`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerInfo: { flex: 1 },
  jobTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, lineHeight: 23, marginBottom: 3 },
  jobCompany: { fontSize: 13, color: TEXT_MUTED },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: BG, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5, borderColor: BORDER },
  metaChipBlue: { backgroundColor: 'rgba(200,149,32,0.08)', borderColor: 'rgba(200,149,32,0.2)' },
  metaText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  divider: { height: 1.5, backgroundColor: BORDER, marginHorizontal: 20, marginBottom: 16 },
  body: { paddingHorizontal: 20 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: BLUE, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  
  // Client Profile Styles
  clientSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  clientCard: {
    backgroundColor: BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: BLUE,
  },
  clientAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${GOLD}30`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GOLD,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  clientCompany: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  clientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clientBadgeText: {
    fontSize: 10,
    color: GREEN,
    fontWeight: '500',
  },
  clientDescriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  clientCompanyContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  clientContactContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  clientDescriptionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  clientDescription: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 20,
  },
  clientDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  clientDetailText: {
    fontSize: 12,
    color: TEXT_MUTED,
    flex: 1,
  },
  clientStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  clientStat: {
    alignItems: 'center',
  },
  clientStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  clientStatLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginTop: 2,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: `${BLUE}10`,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: `${BLUE}20`,
  },
  viewProfileBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
  },
  
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: `${BLUE}10`, borderRadius: 999, borderWidth: 1.5, borderColor: `${BLUE}22` },
  tagText: { fontSize: 12, color: BLUE, fontWeight: '600' },
  descText: { fontSize: 14, color: TEXT_MUTED, lineHeight: 22 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: BG, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: BORDER },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '45%' },
  detailLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1.5, borderTopColor: BORDER },
  saveBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: `${BLUE}10`, borderWidth: 1.5, borderColor: `${BLUE}22`, alignItems: 'center', justifyContent: 'center' },
  applyBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  applyBtnDisabled: { backgroundColor: `${BLUE}50` },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },
});

// ── Client Profile Modal Styles ──────────────────────────────────────────────
const clientProfileStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,26,62,0.55)' },
  container: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_H * 0.9, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 999, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: BLUE },
  profileAvatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${GOLD}30`, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: GOLD },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: TEXT_MAIN, marginBottom: 4 },
  profileCompany: { fontSize: 14, color: TEXT_MUTED, marginBottom: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, color: GREEN, fontWeight: '500' },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: BLUE, marginBottom: 12 },
  description: { fontSize: 14, color: TEXT_MUTED, lineHeight: 22 },
  noInfoText: { fontSize: 14, color: TEXT_LIGHT, fontStyle: 'italic' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BORDER },
  infoText: { fontSize: 14, color: TEXT_MAIN, flex: 1 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  contactText: { fontSize: 14, color: TEXT_MAIN, flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: BG, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: BORDER },
  statValue: { fontSize: 20, fontWeight: '700', color: TEXT_MAIN },
  statLabel: { fontSize: 11, color: TEXT_LIGHT, marginTop: 4 },
});

// ── Application Modal Styles ─────────────────────────────────────────────────────
const applyStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.55)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalTitle: { fontSize: 18, fontWeight: '600', color: TEXT_MAIN },
  modalContentWrapper: { flex: 1 },
  jobInfoHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: WHITE },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BORDER },
  stepDotActive: { backgroundColor: BLUE, borderColor: BLUE },
  stepDotText: { fontSize: 14, fontWeight: '700', color: TEXT_MUTED },
  stepDotTextActive: { color: WHITE },
  stepLine: { width: 40, height: 2, backgroundColor: BORDER, marginHorizontal: 5 },
  stepLineActive: { backgroundColor: BLUE },
  stepContent: { paddingHorizontal: 20, paddingBottom: 30 },
  applyJobTitle: { fontSize: 16, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
  applyJobCompany: { fontSize: 12, color: TEXT_MUTED },
  applyLabel: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED, marginBottom: 8, marginTop: 16 },
  applyInput: { backgroundColor: BG, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: TEXT_MAIN, fontSize: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 16 },
  applyTextArea: { height: 80, textAlignVertical: 'top' },
  uploadBtn: { backgroundColor: BG, borderRadius: 10, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', marginBottom: 16 },
  uploadBtnText: { fontSize: 12, color: BLUE, marginTop: 8 },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: BG, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1.5, borderColor: BORDER },
  fileName: { flex: 1, fontSize: 12, color: TEXT_MAIN },
  educationChip: { backgroundColor: BG, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginRight: 8, borderWidth: 1.5, borderColor: BORDER },
  educationChipActive: { backgroundColor: `${BLUE}10`, borderColor: BLUE },
  educationChipText: { fontSize: 12, color: TEXT_MUTED },
  educationChipTextActive: { color: BLUE, fontWeight: '600' },
  experienceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  addExperienceBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${BLUE}10`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: `${BLUE}20` },
  addExperienceText: { fontSize: 11, color: BLUE, fontWeight: '500' },
  noExperience: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  noExperienceText: { fontSize: 14, color: TEXT_MUTED, marginTop: 10 },
  noExperienceSub: { fontSize: 11, color: TEXT_LIGHT, marginTop: 4 },
  experienceCard: { backgroundColor: BG, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1.5, borderColor: BORDER },
  experienceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  experienceJobTitle: { fontSize: 14, fontWeight: '600', color: TEXT_MAIN },
  experienceCompany: { fontSize: 12, color: TEXT_MUTED, marginBottom: 4 },
  experienceDate: { fontSize: 11, color: TEXT_LIGHT },
  expModalWrap: { flex: 1, backgroundColor: 'rgba(7,26,62,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  expModalSheet: { backgroundColor: WHITE, borderRadius: 16, width: '100%', maxHeight: '80%', borderWidth: 1.5, borderColor: BORDER },
  expModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  expModalTitle: { fontSize: 18, fontWeight: '600', color: TEXT_MAIN },
  expModalContent: { paddingHorizontal: 20, maxHeight: '70%' },
  expModalBtn: { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 10, alignItems: 'center', margin: 20 },
  expModalBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },
  currentlyWorkingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: BLUE },
  checkboxLabel: { fontSize: 12, color: TEXT_MUTED },
  reviewSectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, marginTop: 16, marginBottom: 12 },
  reviewSubTitle: { fontSize: 14, fontWeight: '600', color: BLUE, marginTop: 12, marginBottom: 8 },
  reviewCard: { backgroundColor: BG, borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: BORDER },
  reviewLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500', marginBottom: 2 },
  reviewValue: { fontSize: 12, color: TEXT_MAIN, marginBottom: 6 },
  coverLetterInput: { backgroundColor: BG, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8, borderWidth: 1.5, borderColor: BORDER, minHeight: 100, textAlignVertical: 'top' },
  nextStepBtn: { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  nextStepBtnText: { fontSize: 16, fontWeight: '600', color: WHITE },
  submitBtn: { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: WHITE },
  disabledBtn: { opacity: 0.6 },
  applyModalFooter: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1.5, borderTopColor: BORDER },

  existingCVContainer: { marginBottom: 16, gap: 8 },
  existingCVOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: BG, borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: BORDER },
  existingCVOptionActive: { borderColor: BLUE, backgroundColor: `${BLUE}5` },
  existingCVInfo: { flex: 1 },
  existingCVName: { fontSize: 13, fontWeight: '500', color: TEXT_MAIN },
  existingCVSize: { fontSize: 10, color: TEXT_MUTED, marginTop: 2 },
  uploadNewText: { flex: 1, fontSize: 13, color: TEXT_MAIN },
});

// ── Status Modal Styles ─────────────────────────────────────────────────────────
const statusStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { backgroundColor: WHITE, borderRadius: 24, padding: 24, alignItems: 'center', width: '100%', maxWidth: 320 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${GREEN}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: GREEN, marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${BLUE}10`, padding: 12, borderRadius: 12, marginBottom: 20 },
  infoText: { fontSize: 12, color: BLUE, flex: 1, lineHeight: 16 },
  button: { backgroundColor: GREEN, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, minWidth: 120, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: WHITE },
});