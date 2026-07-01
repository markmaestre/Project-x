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
  Modal,
  Dimensions,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { File, Directory } from 'expo-file-system';
import { logout } from '../../Redux/slices/authSlice';
import { getFreelancerJobs, getJobById } from '../../Redux/slices/jobSlice';
import { getFreelancerApplications, applyForJob } from '../../Redux/slices/applicationSlice';

// ── Vantara Design tokens ──────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const NAVY2      = '#0D2151';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
const BLUE_LT    = '#1E90FF';
const BLUE_SOFT  = '#E2EAF4';
const GOLD       = '#C89520';
const GOLD_LT    = '#E8B84B';
const GOLD_DK    = '#8A6410';
const GOLD_SOFT  = '#FDF3D7';
const GOLD_MID   = '#E6C56A';
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

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
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

// ── Format Functions ───────────────────────────────────────────────────────────
const formatLocation = (location) => {
  if (!location) return null;
  if (typeof location === 'string') return location;
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.province) parts.push(location.province);
  if (location.country && location.country !== 'Philippines') parts.push(location.country);
  return parts.length > 0 ? parts.join(', ') : null;
};

const formatJobType = (type) => {
  const types = {
    full_time: 'Full Time', 
    part_time: 'Part Time', 
    project: 'Project',
    one_time: 'One Time', 
    long_term: 'Long Term',
  };
  return types[type] || type;
};

const formatWorkSetup = (setup) => {
  const setups = { remote: 'Remote', onsite: 'Onsite', hybrid: 'Hybrid' };
  return setups[setup] || setup;
};

const formatExperienceLevel = (level) => {
  const levels = {
    entry: 'Entry',
    intermediate: 'Intermediate',
    expert: 'Expert',
    senior: 'Senior',
  };
  return levels[level] || level;
};

const formatBudget = (budget) => {
  if (!budget) return null;
  const { min, max, currency = 'PHP', type } = budget;
  if (min && max) {
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} (${type === 'hourly' ? 'per hour' : 'fixed'})`;
  }
  if (min) {
    return `${currency} ${min.toLocaleString()}+ (${type === 'hourly' ? 'per hour' : 'fixed'})`;
  }
  return null;
};

const formatDuration = (timeline) => {
  if (!timeline) return null;
  const { duration_value, duration_unit } = timeline;
  if (duration_value && duration_unit) {
    return `${duration_value} ${duration_unit}`;
  }
  return null;
};

const formatBudgetForCard = (job) => {
  if (job.budget) {
    const { min, max, currency = 'PHP' } = job.budget;
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
  }
  return null;
};

const formatFullDate = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return null;
  }
};

const getTimeAgo = (date) => {
  if (!date) return null;
  try {
    const now = new Date();
    const past = new Date(date);
    if (isNaN(past.getTime())) return null;
    const diffInSeconds = Math.floor((now - past) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  } catch (error) {
    return null;
  }
};

// ── Skeleton Card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobCardContent}>
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
      <View style={styles.saveButton}>
        <View style={[styles.skeletonLine, { width: 24, height: 24, borderRadius: 6 }]} />
      </View>
    </View>
  );
}

// ── Client Profile Modal ──────────────────────────────────────────────────────────
function ClientProfileModal({ visible, client, onClose }) {
  if (!client) return null;

  const getInitials = () => {
    if (client.first_name && client.last_name) {
      return `${client.first_name[0]}${client.last_name[0]}`.toUpperCase();
    }
    if (client.company_name) {
      return client.company_name.substring(0, 2).toUpperCase();
    }
    if (client.business_name) {
      return client.business_name.substring(0, 2).toUpperCase();
    }
    if (client.name) {
      return client.name.substring(0, 2).toUpperCase();
    }
    return 'C';
  };

  const getFullName = () => {
    if (client.first_name && client.last_name) {
      return `${client.first_name} ${client.last_name}`;
    }
    if (client.company_name) return client.company_name;
    if (client.business_name) return client.business_name;
    if (client.name) return client.name;
    return 'Client';
  };

  const getCompanyName = () => {
    return client.company_name || client.business_name || client.name || 'Independent Client';
  };

  const renderRating = () => {
    const rating = client.rating;
    if (!rating || typeof rating !== 'number') return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`star-${i}`} name="star" size={16} color={GOLD} />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half-star" name="star-half" size={16} color={GOLD} />);
    }
    const remaining = 5 - Math.ceil(rating);
    for (let i = 0; i < remaining; i++) {
      stars.push(<Ionicons key={`star-empty-${i}`} name="star-outline" size={16} color={GOLD} />);
    }
    
    return (
      <View style={clientProfileStyles.ratingRow}>
        {stars}
        <Text style={clientProfileStyles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const hasDetails = 
    client.email_address || 
    client.email ||
    client.phone_number || 
    client.contact_number ||
    client.location || 
    client.industry || 
    client.bio_about_me || 
    client.about ||
    client.bio ||
    client.description ||
    (client.skills && client.skills.length > 0) ||
    client.website ||
    client.address ||
    client.city ||
    client.province ||
    client.country;

  const getLocationDisplay = () => {
    if (typeof client.location === 'string') return client.location;
    if (client.location?.city) {
      const parts = [];
      if (client.location.city) parts.push(client.location.city);
      if (client.location.province) parts.push(client.location.province);
      if (client.location.country) parts.push(client.location.country);
      return parts.join(', ');
    }
    if (client.city || client.province || client.country) {
      const parts = [];
      if (client.city) parts.push(client.city);
      if (client.province) parts.push(client.province);
      if (client.country) parts.push(client.country);
      return parts.join(', ');
    }
    return null;
  };

  const locationDisplay = getLocationDisplay();
  const getEmail = () => client.email_address || client.email || null;
  const getPhone = () => client.phone_number || client.contact_number || client.phone || null;
  const getBio = () => client.bio_about_me || client.about || client.bio || client.description || null;
  
  const getMemberSince = () => {
    const date = client.member_since || client.createdAt || client.created_at || client.join_date;
    if (date) {
      try {
        return new Date(date).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const getIndustry = () => client.industry || client.industry_type || client.business_type || null;
  const getWebsite = () => client.website || client.website_url || client.web_url || null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={clientProfileStyles.overlay}>
        <TouchableOpacity style={clientProfileStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={clientProfileStyles.container}>
          <View style={clientProfileStyles.handle} />
          
          <View style={clientProfileStyles.header}>
            <View style={clientProfileStyles.avatarLarge}>
              {client.profile_picture ? (
                <Image source={{ uri: client.profile_picture }} style={clientProfileStyles.avatarImage} />
              ) : (
                <Text style={clientProfileStyles.avatarInitials}>{getInitials()}</Text>
              )}
            </View>
            <Text style={clientProfileStyles.clientName}>{getFullName()}</Text>
            <Text style={clientProfileStyles.companyName}>{getCompanyName()}</Text>
            {renderRating()}
            <TouchableOpacity style={clientProfileStyles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView style={clientProfileStyles.body} showsVerticalScrollIndicator={false}>
            {getBio() && (
              <View style={clientProfileStyles.section}>
                <Text style={clientProfileStyles.sectionLabel}>About</Text>
                <Text style={clientProfileStyles.bioText}>{getBio()}</Text>
              </View>
            )}

            <View style={clientProfileStyles.section}>
              <Text style={clientProfileStyles.sectionLabel}>Contact & Details</Text>
              <View style={clientProfileStyles.detailGrid}>
                {getEmail() && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="mail-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Email</Text>
                      <Text style={clientProfileStyles.detailValue}>{getEmail()}</Text>
                    </View>
                  </View>
                )}
                {getPhone() && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="call-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Phone</Text>
                      <Text style={clientProfileStyles.detailValue}>{getPhone()}</Text>
                    </View>
                  </View>
                )}
                {locationDisplay && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="location-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Location</Text>
                      <Text style={clientProfileStyles.detailValue}>{locationDisplay}</Text>
                    </View>
                  </View>
                )}
                {getIndustry() && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="business-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Industry</Text>
                      <Text style={clientProfileStyles.detailValue}>{getIndustry()}</Text>
                    </View>
                  </View>
                )}
                {getWebsite() && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="globe-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Website</Text>
                      <Text style={clientProfileStyles.detailValue}>{getWebsite()}</Text>
                    </View>
                  </View>
                )}
                {getMemberSince() && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="calendar-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Member Since</Text>
                      <Text style={clientProfileStyles.detailValue}>{getMemberSince()}</Text>
                    </View>
                  </View>
                )}
                {client.verification_status && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={GREEN} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Verification</Text>
                      <Text style={[clientProfileStyles.detailValue, { color: GREEN }]}>
                        {client.verification_status === 'verified' ? 'Verified ✓' : 'Unverified'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {client.skills && client.skills.length > 0 && (
              <View style={clientProfileStyles.section}>
                <Text style={clientProfileStyles.sectionLabel}>Skills & Expertise</Text>
                <View style={clientProfileStyles.skillRow}>
                  {client.skills.map((skill, index) => (
                    <View key={index} style={clientProfileStyles.skillTag}>
                      <Text style={clientProfileStyles.skillTagText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {client.recent_projects && client.recent_projects.length > 0 && (
              <View style={clientProfileStyles.section}>
                <Text style={clientProfileStyles.sectionLabel}>Recent Projects</Text>
                <View style={clientProfileStyles.projectContainer}>
                  {client.recent_projects.slice(0, 3).map((project, index) => (
                    <View key={index} style={clientProfileStyles.projectItem}>
                      <Ionicons name="folder-outline" size={16} color={BLUE} />
                      <Text style={clientProfileStyles.projectText}>{project}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!hasDetails && (
              <View style={clientProfileStyles.emptyState}>
                <Ionicons name="person-outline" size={48} color={TEXT_LIGHT} />
                <Text style={clientProfileStyles.emptyStateTitle}>No Profile Details</Text>
                <Text style={clientProfileStyles.emptyStateText}>
                  This client hasn't added any additional profile information yet.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Application Status Modal ─────────────────────────────────────────────────────
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
  const [isCheckingCV, setIsCheckingCV] = useState(false);

  useEffect(() => {
    if (visible && job) {
      const checkExistingCV = async () => {
        setIsCheckingCV(true);
        try {
          const cvDirPath = FileSystem.documentDirectory + 'cvs/';
          const cvDir = new Directory(cvDirPath);
          const dirExists = await cvDir.exists();
          
          if (dirExists) {
            const files = await cvDir.list();
            const cvFiles = files.filter(file => 
              file.name.endsWith('.pdf') || 
              file.name.endsWith('.doc') || 
              file.name.endsWith('.docx')
            );
            
            if (cvFiles.length > 0) {
              const latestCV = cvFiles[0];
              const filePath = cvDirPath + latestCV.name;
              const file = new File(filePath);
              const fileInfo = await file.getInfo();
              
              setExistingCVInfo({
                name: latestCV.name,
                uri: filePath,
                size: fileInfo.size || 0
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
        } finally {
          setIsCheckingCV(false);
        }
      };
      
      checkExistingCV();
      
      if (job.budget?.min) {
        setProposedRate(job.budget.min.toString());
      } else if (job.budget_amount) {
        setProposedRate(job.budget_amount.toString());
      }
      
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
        size: existingCVInfo.size,
      });
    } else if (resumeFile) {
      formData.append('resume', {
        uri: resumeFile.uri,
        name: resumeFile.name,
        type: resumeFile.mimeType || 'application/pdf',
        size: resumeFile.size,
      });
    }
    
    const educationData = {
      level: educationLevel,
      field: fieldOfStudy,
      institution: institutionName,
      graduation_year: graduationYear || null,
    };
    formData.append('education', JSON.stringify(educationData));
    
    const experiencesData = experiences.map(exp => ({
      job_title: exp.jobTitle,
      company: exp.companyName,
      start_date: exp.startDate || null,
      end_date: exp.currentlyWorking ? null : exp.endDate || null,
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
              <Text style={applyStyles.applyJobCompany}>{job?.client_id?.company_name || job?.client_id?.name || 'Client'}</Text>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={applyStyles.stepContent}>
              {currentStep === 1 && (
                <>
                  <Text style={applyStyles.applyLabel}>Resume/CV *</Text>
                  {isCheckingCV ? (
                    <View style={applyStyles.uploadBtn}>
                      <ActivityIndicator size="small" color={BLUE} />
                      <Text style={applyStyles.uploadBtnText}>Checking for existing CV...</Text>
                    </View>
                  ) : existingCVInfo && !resumeFile ? (
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
                  ) : (!existingCVInfo || !useExistingCV) && (
                    <>
                      {!resumeFile ? (
                        <TouchableOpacity style={applyStyles.uploadBtn} onPress={pickResume}>
                          <Ionicons name="cloud-upload-outline" size={24} color={BLUE} />
                          <Text style={applyStyles.uploadBtnText}>Upload your resume (PDF, DOC, DOCX)</Text>
                          <Text style={applyStyles.uploadBtnSubtext}>Max 5MB</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={applyStyles.fileInfo}>
                          <Ionicons name="document-text-outline" size={20} color={BLUE} />
                          <Text style={applyStyles.fileName}>{resumeFile.name}</Text>
                          <Text style={applyStyles.fileSize}>{formatFileSize(resumeFile.size)}</Text>
                          <TouchableOpacity onPress={removeResume}>
                            <Ionicons name="close-circle" size={20} color={RED} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}

                  <Text style={applyStyles.applyLabel}>Highest Level of Education Completed *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={applyStyles.educationScroll}>
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
                        {exp.description && (
                          <Text style={applyStyles.experienceDescription}>{exp.description}</Text>
                        )}
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
                    {experiences.length > 0 && (
                      <>
                        <Text style={applyStyles.reviewLabel}>Experience:</Text>
                        <Text style={applyStyles.reviewValue}>{experiences.length} position(s) added</Text>
                      </>
                    )}
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

// ── Job Detail Modal ──────────────────────────────────────────────────────────
function JobDetailModal({ visible, job, onClose, isLoading, onViewClient, onApply, hasApplied }) {
  if (!job && !isLoading) return null;

  const locationText = formatLocation(job?.location);
  const budgetText = formatBudget(job?.budget);
  const durationText = formatDuration(job?.timeline);
  const experienceText = formatExperienceLevel(job?.experience_level);
  const skills = job?.required_skills || [];
  const tags = job?.tags || [];
  const client = job?.client_id || {};
  const timeAgo = getTimeAgo(job?.createdAt);
  const fullDate = formatFullDate(job?.createdAt);

  const getClientName = () => {
    if (client.company_name) return client.company_name;
    if (client.business_name) return client.business_name;
    if (client.first_name && client.last_name) {
      return `${client.first_name} ${client.last_name}`;
    }
    if (client.name) return client.name;
    return 'Client';
  };

  const getClientInitials = () => {
    if (client.first_name && client.last_name) {
      return `${client.first_name[0]}${client.last_name[0]}`.toUpperCase();
    }
    if (client.company_name) {
      return client.company_name.substring(0, 2).toUpperCase();
    }
    if (client.business_name) {
      return client.business_name.substring(0, 2).toUpperCase();
    }
    return 'C';
  };

  const getClientEmail = () => {
    return client.email_address || client.email || null;
  };

  const getClientLocation = () => {
    if (typeof client.location === 'string') return client.location;
    if (client.location?.city) {
      const parts = [];
      if (client.location.city) parts.push(client.location.city);
      if (client.location.province) parts.push(client.location.province);
      if (client.location.country) parts.push(client.location.country);
      return parts.join(', ');
    }
    if (client.city || client.province || client.country) {
      const parts = [];
      if (client.city) parts.push(client.city);
      if (client.province) parts.push(client.province);
      if (client.country) parts.push(client.country);
      return parts.join(', ');
    }
    return null;
  };

  const handleApply = () => {
    if (onApply && !hasApplied) {
      onApply(job);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <TouchableOpacity style={detailStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={detailStyles.container}>
          <View style={detailStyles.handle} />
          
          {isLoading ? (
            <View style={detailStyles.loadingContainer}>
              <ActivityIndicator size="large" color={BLUE} />
              <Text style={detailStyles.loadingText}>Loading job details...</Text>
            </View>
          ) : job ? (
            <>
              <View style={detailStyles.header}>
                <View style={detailStyles.companyLogo}>
                  <Ionicons name="briefcase-outline" size={24} color={BLUE} />
                </View>
                <View style={detailStyles.headerInfo}>
                  <Text style={detailStyles.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>
                  <TouchableOpacity 
                    style={detailStyles.clientNameLink} 
                    onPress={() => onViewClient && onViewClient(client)}
                    activeOpacity={0.7}
                  >
                    <Text style={detailStyles.jobCompany}>{getClientName()}</Text>
                    <Ionicons name="chevron-forward" size={14} color={BLUE} />
                  </TouchableOpacity>
                  {timeAgo && (
                    <View style={detailStyles.timeBadge}>
                      <Ionicons name="time-outline" size={12} color={TEXT_LIGHT} />
                      <Text style={detailStyles.timeText}>Posted {timeAgo}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
                  <Ionicons name="close" size={20} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={detailStyles.clientInfoCard} 
                onPress={() => onViewClient && onViewClient(client)}
                activeOpacity={0.8}
              >
                <View style={detailStyles.clientAvatar}>
                  {client.profile_picture ? (
                    <Image source={{ uri: client.profile_picture }} style={detailStyles.clientAvatarImg} />
                  ) : (
                    <Text style={detailStyles.clientAvatarText}>{getClientInitials()}</Text>
                  )}
                </View>
                <View style={detailStyles.clientInfo}>
                  <Text style={detailStyles.clientName}>{getClientName()}</Text>
                  {getClientEmail() && (
                    <Text style={detailStyles.clientDetail}>{getClientEmail()}</Text>
                  )}
                  {getClientLocation() && (
                    <Text style={detailStyles.clientDetail}>{getClientLocation()}</Text>
                  )}
                  {client.rating && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons name="star" size={12} color={GOLD} />
                      <Text style={[detailStyles.clientDetail, { fontWeight: '600' }]}>
                        {client.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={TEXT_LIGHT} />
              </TouchableOpacity>

              <View style={detailStyles.metaRow}>
                {locationText && (
                  <View style={detailStyles.metaChip}>
                    <Ionicons name="location-outline" size={13} color={TEXT_MUTED} />
                    <Text style={detailStyles.metaText}>{locationText}</Text>
                  </View>
                )}
                {job.job_type && (
                  <View style={detailStyles.metaChip}>
                    <Ionicons name="briefcase-outline" size={13} color={TEXT_MUTED} />
                    <Text style={detailStyles.metaText}>{formatJobType(job.job_type)}</Text>
                  </View>
                )}
                {job.work_setup && (
                  <View style={detailStyles.metaChip}>
                    <Ionicons name="wifi-outline" size={13} color={TEXT_MUTED} />
                    <Text style={detailStyles.metaText}>{formatWorkSetup(job.work_setup)}</Text>
                  </View>
                )}
                {budgetText && (
                  <View style={[detailStyles.metaChip, detailStyles.metaChipGold]}>
                    <Ionicons name="cash-outline" size={13} color={GOLD_DK} />
                    <Text style={[detailStyles.metaText, { color: GOLD_DK, fontWeight: '600' }]}>{budgetText}</Text>
                  </View>
                )}
                {job.urgent && (
                  <View style={[detailStyles.metaChip, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                    <Ionicons name="flame-outline" size={13} color={RED} />
                    <Text style={[detailStyles.metaText, { color: RED, fontWeight: '600' }]}>Urgent</Text>
                  </View>
                )}
                {job.featured && (
                  <View style={[detailStyles.metaChip, { backgroundColor: GOLD_SOFT, borderColor: GOLD_MID }]}>
                    <Ionicons name="star-outline" size={13} color={GOLD} />
                    <Text style={[detailStyles.metaText, { color: GOLD_DK, fontWeight: '600' }]}>Featured</Text>
                  </View>
                )}
              </View>

              <View style={detailStyles.divider} />

              <ScrollView style={detailStyles.body} showsVerticalScrollIndicator={false}>
                <View style={detailStyles.section}>
                  <Text style={detailStyles.sectionLabel}>Job Description</Text>
                  <Text style={detailStyles.descText}>{job.description || 'No description provided.'}</Text>
                </View>

                {skills.length > 0 && (
                  <View style={detailStyles.section}>
                    <Text style={detailStyles.sectionLabel}>Required Skills</Text>
                    <View style={detailStyles.tagRow}>
                      {skills.map((s, i) => (
                        <View key={i} style={detailStyles.tag}>
                          <Text style={detailStyles.tagText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {tags.length > 0 && (
                  <View style={detailStyles.section}>
                    <Text style={detailStyles.sectionLabel}>Tags</Text>
                    <View style={detailStyles.tagRow}>
                      {tags.map((tag, i) => (
                        <View key={i} style={[detailStyles.tag, { backgroundColor: GOLD_SOFT, borderColor: GOLD_MID }]}>
                          <Text style={[detailStyles.tagText, { color: GOLD_DK }]}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {job.requirements && (
                  <View style={detailStyles.section}>
                    <Text style={detailStyles.sectionLabel}>Requirements</Text>
                    <View style={{ gap: 6 }}>
                      {job.requirements.education && job.requirements.education !== 'none' && (
                        <Text style={detailStyles.descText}>• Education: {job.requirements.education.replace('_', ' ').toUpperCase()}</Text>
                      )}
                      {job.requirements.portfolio_required && (
                        <Text style={detailStyles.descText}>• Portfolio required</Text>
                      )}
                      {job.requirements.resume_required && (
                        <Text style={detailStyles.descText}>• Resume required</Text>
                      )}
                      {job.requirements.cover_letter_required && (
                        <Text style={detailStyles.descText}>• Cover letter required</Text>
                      )}
                      {job.requirements.preferred_languages?.length > 0 && (
                        <Text style={detailStyles.descText}>• Languages: {job.requirements.preferred_languages.join(', ')}</Text>
                      )}
                      {job.requirements.preferred_certifications?.length > 0 && (
                        <Text style={detailStyles.descText}>• Certifications: {job.requirements.preferred_certifications.join(', ')}</Text>
                      )}
                    </View>
                  </View>
                )}

                {job.screening_questions?.length > 0 && (
                  <View style={detailStyles.section}>
                    <Text style={detailStyles.sectionLabel}>Screening Questions</Text>
                    {job.screening_questions.map((q, i) => (
                      <View key={i} style={detailStyles.questionItem}>
                        <Text style={detailStyles.questionNumber}>{i + 1}.</Text>
                        <Text style={detailStyles.questionText}>{q.question}</Text>
                        {q.required && (
                          <View style={detailStyles.requiredBadge}>
                            <Text style={detailStyles.requiredBadgeText}>Required</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {job.timeline && (job.timeline.duration_value || job.timeline.estimated_hours || job.timeline.weekly_limit) && (
                  <View style={detailStyles.section}>
                    <Text style={detailStyles.sectionLabel}>Timeline</Text>
                    <View style={detailStyles.timelineGrid}>
                      {job.timeline.duration_value && job.timeline.duration_unit && (
                        <View style={detailStyles.timelineItem}>
                          <Ionicons name="hourglass-outline" size={16} color={BLUE} />
                          <View>
                            <Text style={detailStyles.timelineLabel}>Duration</Text>
                            <Text style={detailStyles.timelineValue}>
                              {job.timeline.duration_value} {job.timeline.duration_unit}
                            </Text>
                          </View>
                        </View>
                      )}
                      {job.timeline.estimated_hours && (
                        <View style={detailStyles.timelineItem}>
                          <Ionicons name="time-outline" size={16} color={BLUE} />
                          <View>
                            <Text style={detailStyles.timelineLabel}>Estimated Hours</Text>
                            <Text style={detailStyles.timelineValue}>{job.timeline.estimated_hours} hrs</Text>
                          </View>
                        </View>
                      )}
                      {job.timeline.weekly_limit && (
                        <View style={detailStyles.timelineItem}>
                          <Ionicons name="calendar-outline" size={16} color={BLUE} />
                          <View>
                            <Text style={detailStyles.timelineLabel}>Weekly Limit</Text>
                            <Text style={detailStyles.timelineValue}>{job.timeline.weekly_limit} hrs/week</Text>
                          </View>
                        </View>
                      )}
                      {job.timeline.start_date && (
                        <View style={detailStyles.timelineItem}>
                          <Ionicons name="calendar-outline" size={16} color={BLUE} />
                          <View>
                            <Text style={detailStyles.timelineLabel}>Start Date</Text>
                            <Text style={detailStyles.timelineValue}>{formatFullDate(job.timeline.start_date)}</Text>
                          </View>
                        </View>
                      )}
                      {job.timeline.end_date && (
                        <View style={detailStyles.timelineItem}>
                          <Ionicons name="calendar-outline" size={16} color={BLUE} />
                          <View>
                            <Text style={detailStyles.timelineLabel}>End Date</Text>
                            <Text style={detailStyles.timelineValue}>{formatFullDate(job.timeline.end_date)}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <View style={detailStyles.detailGrid}>
                  {experienceText && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="bar-chart-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Experience Level</Text>
                        <Text style={detailStyles.detailValue}>{experienceText}</Text>
                      </View>
                    </View>
                  )}
                  {job.job_type && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="briefcase-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Job Type</Text>
                        <Text style={detailStyles.detailValue}>{formatJobType(job.job_type)}</Text>
                      </View>
                    </View>
                  )}
                  {job.work_setup && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="wifi-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Work Setup</Text>
                        <Text style={detailStyles.detailValue}>{formatWorkSetup(job.work_setup)}</Text>
                      </View>
                    </View>
                  )}
                  {job.vacancies && job.vacancies > 0 && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="people-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Vacancies</Text>
                        <Text style={detailStyles.detailValue}>{job.vacancies}</Text>
                      </View>
                    </View>
                  )}
                  {job.timezone && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="time-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Timezone</Text>
                        <Text style={detailStyles.detailValue}>{job.timezone}</Text>
                      </View>
                    </View>
                  )}
                  {job.nda_required && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="document-text-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>NDA</Text>
                        <Text style={detailStyles.detailValue}>Required</Text>
                      </View>
                    </View>
                  )}
                  {job.category && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="pricetag-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Category</Text>
                        <Text style={detailStyles.detailValue}>{job.category}</Text>
                      </View>
                    </View>
                  )}
                  {job.subcategory && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="pricetag-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Subcategory</Text>
                        <Text style={detailStyles.detailValue}>{job.subcategory}</Text>
                      </View>
                    </View>
                  )}
                  {fullDate && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="calendar-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Posted</Text>
                        <Text style={detailStyles.detailValue}>{fullDate}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={{ height: 80 }} />
              </ScrollView>

              <View style={detailStyles.applyContainer}>
                <TouchableOpacity 
                  style={[
                    detailStyles.applyButton,
                    hasApplied && detailStyles.applyButtonDisabled
                  ]}
                  onPress={handleApply}
                  disabled={hasApplied}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={hasApplied ? 'checkmark-circle' : 'paper-plane-outline'} 
                    size={20} 
                    color={WHITE} 
                    style={detailStyles.applyIcon}
                  />
                  <Text style={detailStyles.applyButtonText}>
                    {hasApplied ? 'Already Applied' : 'Apply Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// ── Bottom Tab Bar ─────────────────────────────────────────────────────────────────
function BottomTabBar({ activeTab, onTabPress }) {
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

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function FreelancerScreen({ onNavigate, route }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { list: jobs, isLoading: jobsLoading } = useSelector(s => s.jobs.jobs);
  const { applications, isLoading: appsLoading, applySuccess } = useSelector(s => s.applications);
  
  const [activeTab, setActiveTab] = useState('Home');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingJobDetail, setLoadingJobDetail] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobs, setSavedJobs] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlreadyAppliedModal, setShowAlreadyAppliedModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`;
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  useEffect(() => {
    if (route?.params?.returnState?.activeTab) {
      setActiveTab(route.params.returnState.activeTab);
    }
  }, [route?.params]);

  const fetchJobs = useCallback(async () => {
    try {
      await dispatch(getFreelancerJobs({ limit: 20 })).unwrap();
    } catch (e) { 
      console.error('Fetch jobs error:', e); 
    }
  }, [dispatch]);

  const fetchApplications = useCallback(async () => {
    try {
      const result = await dispatch(getFreelancerApplications({})).unwrap();
      const list = result.applications || result.data || result || [];
      const appliedIds = list.map(app => app.job_id?._id || app.job_id).filter(id => id);
      setAppliedJobIds(appliedIds);
    } catch (e) { 
      console.error('Error fetching applications:', e); 
    }
  }, [dispatch]);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [fetchJobs, fetchApplications]);

  useEffect(() => {
    if (applySuccess) {
      fetchApplications();
    }
  }, [applySuccess, fetchApplications]);

  const isInitialLoading = jobsLoading && !refreshing && (!jobs || jobs.length === 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchJobs(), fetchApplications()]);
    setRefreshing(false);
  }, [fetchJobs, fetchApplications]);

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
      { text: 'Logout', style: 'destructive', onPress: async () => { 
        await dispatch(logout()); 
        onNavigate('Login'); 
      } },
    ]);

  const openJobDetail = async (job) => {
    setSelectedJob(job);
    setModalVisible(true);
    setLoadingJobDetail(true);
    
    try {
      const result = await dispatch(getJobById(job._id)).unwrap();
      setSelectedJob(result.job);
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoadingJobDetail(false);
    }
  };

  const handleViewClient = (client) => {
    if (client && Object.keys(client).length > 0) {
      setSelectedClient(client);
      setShowClientProfile(true);
    }
  };

  const handleApply = (job) => {
    if (appliedJobIds.includes(job._id)) {
      setSelectedJob(job);
      setShowAlreadyAppliedModal(true);
      return;
    }
    setModalVisible(false);
    setSelectedJob(job);
    setShowApplyModal(true);
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
      const result = await dispatch(applyForJob(formData)).unwrap();
      setAppliedJobIds([...appliedJobIds, selectedJob._id]);
      setShowApplyModal(false);
      setShowSuccessModal(true);
      await fetchApplications();
    } catch (error) {
      console.error('Application error:', error);
      Alert.alert('Error', error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSaveJob = (jobId) => {
    setSavedJobs(prev => {
      if (prev.includes(jobId)) {
        return prev.filter(id => id !== jobId);
      } else {
        return [...prev, jobId];
      }
    });
  };

  const isJobSaved = (jobId) => savedJobs.includes(jobId);

  const filteredJobs = jobs?.filter(job => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    const skills = job.required_skills?.join(' ').toLowerCase() || '';
    const company = job.client_id?.company_name?.toLowerCase() || '';
    const business = job.client_id?.business_name?.toLowerCase() || '';
    
    return title.includes(query) || 
           description.includes(query) || 
           skills.includes(query) ||
           company.includes(query) ||
           business.includes(query);
  });

  const renderJobItem = useCallback(({ item: job }) => {
    const locationDisplay = formatLocation(job.location) || 'Remote';
    const budgetDisplay = formatBudgetForCard(job);
    const skills = job.required_skills || [];
    const workSetup = formatWorkSetup(job.work_setup);
    const client = job.client_id || {};
    const timeAgo = getTimeAgo(job.createdAt);
    const isSaved = isJobSaved(job._id);
    const hasApplied = appliedJobIds.includes(job._id);
    
    const getClientName = () => {
      if (client.company_name) return client.company_name;
      if (client.business_name) return client.business_name;
      if (client.first_name && client.last_name) {
        return `${client.first_name} ${client.last_name}`;
      }
      if (client.name) return client.name;
      return 'Client';
    };

    const getClientInitials = () => {
      if (client.first_name && client.last_name) {
        return `${client.first_name[0]}${client.last_name[0]}`.toUpperCase();
      }
      if (client.company_name) {
        return client.company_name.substring(0, 2).toUpperCase();
      }
      if (client.business_name) {
        return client.business_name.substring(0, 2).toUpperCase();
      }
      return 'C';
    };

    return (
      <View style={styles.jobCard}>
        <TouchableOpacity 
          style={styles.jobCardContent}
          onPress={() => openJobDetail(job)} 
          activeOpacity={0.85}
        >
          <View style={styles.jobCardTop}>
            {job.urgent && (
              <View style={styles.badgeUrgent}>
                <Ionicons name="flame" size={10} color="#D97706" />
                <Text style={styles.badgeUrgentText}>Urgent</Text>
              </View>
            )}
            {job.featured && (
              <View style={styles.badgeFeatured}>
                <Ionicons name="star" size={10} color={GOLD} />
                <Text style={styles.badgeFeaturedText}>Featured</Text>
              </View>
            )}
            {job.status === 'open' && (
              <View style={styles.badgeOpen}>
                <Text style={styles.badgeOpenText}>Open</Text>
              </View>
            )}
            {workSetup && (
              <View style={styles.badgeWorkSetup}>
                <Ionicons name={job.work_setup === 'remote' ? 'wifi' : 'business'} size={10} color={BLUE} />
                <Text style={styles.badgeWorkSetupText}>{workSetup}</Text>
              </View>
            )}
            {timeAgo && (
              <View style={styles.badgeTime}>
                <Ionicons name="time-outline" size={10} color={TEXT_LIGHT} />
                <Text style={styles.badgeTimeText}>{timeAgo}</Text>
              </View>
            )}
            {hasApplied && (
              <View style={styles.badgeApplied}>
                <Ionicons name="checkmark-circle" size={10} color={GREEN} />
                <Text style={styles.badgeAppliedText}>Applied</Text>
              </View>
            )}
          </View>

          <Text style={styles.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>
          
          <TouchableOpacity 
            style={styles.clientInfoRow} 
            onPress={(e) => {
              e.stopPropagation();
              handleViewClient(client);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.clientAvatarSmall}>
              {client.profile_picture ? (
                <Image source={{ uri: client.profile_picture }} style={styles.clientAvatarSmallImg} />
              ) : (
                <Text style={styles.clientAvatarSmallText}>{getClientInitials()}</Text>
              )}
            </View>
            <Text style={styles.jobCompany} numberOfLines={1}>{getClientName()}</Text>
            <Ionicons name="chevron-forward" size={14} color={TEXT_LIGHT} />
          </TouchableOpacity>

          <View style={styles.jobMetaRow}>
            <Ionicons name="location-outline" size={12} color={TEXT_MUTED} />
            <Text style={styles.jobLocation}>{locationDisplay}</Text>
          </View>

          {job.description && (
            <Text style={styles.descriptionPreview} numberOfLines={2}>
              {job.description}
            </Text>
          )}

          {budgetDisplay && (
            <View style={styles.budgetChip}>
              <Ionicons name="cash-outline" size={13} color={GOLD_DK} />
              <Text style={styles.budgetText}>{budgetDisplay}</Text>
            </View>
          )}

          {skills.length > 0 && (
            <View style={styles.tagRow}>
              {skills.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{s}</Text>
                </View>
              ))}
              {skills.length > 3 && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>+{skills.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleSaveJob(job._id);
          }}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isSaved ? 'bookmark' : 'bookmark-outline'} 
            size={24} 
            color={isSaved ? BLUE : TEXT_LIGHT} 
          />
        </TouchableOpacity>
      </View>
    );
  }, [savedJobs, appliedJobIds]);

  const ListHeader = (
    <>
      <View style={styles.welcomeHeader}>
        <View style={styles.userInfoContainer}>
          <Text style={styles.greetingText}>Welcome back</Text>
          <View style={styles.nameRow}>
            <Text style={styles.welcomeName}>{fullName || 'Freelancer'}</Text>
           
          </View>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.avatarBtn}>
          {user?.profile_picture
            ? <Image source={{ uri: user.profile_picture }} style={styles.avatarImg} />
            : <Text style={styles.avatarInitials}>{initials}</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={TEXT_LIGHT} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs by title, skills, or company..."
            placeholderTextColor={TEXT_LIGHT}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{jobs?.length || 0}</Text>
          <Text style={styles.statLabel}>Available Jobs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{appliedJobIds.length}</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Available Jobs
          {!isInitialLoading && filteredJobs?.length > 0 && (
            <Text style={styles.sectionCount}> ({filteredJobs.length})</Text>
          )}
          {searchQuery.length > 0 && (
            <Text style={styles.searchResultText}> • Results for "{searchQuery}"</Text>
          )}
        </Text>
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
      <Text style={styles.emptyTitle}>
        {searchQuery.length > 0 ? 'No matching jobs found' : 'No jobs available'}
      </Text>
      <Text style={styles.emptySub}>
        {searchQuery.length > 0 
          ? `Try adjusting your search for "${searchQuery}"` 
          : 'Check back later for new opportunities'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <View style={styles.logoBox}>
              <Image 
                source={require('../../../assets/taskra.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.topbarBrand}>Taskra</Text>
              <Text style={styles.topbarTagline}>Freelancer Hub</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => onNavigate('Notification')}>
            <Ionicons name="notifications-outline" size={22} color={WHITE} />
          </TouchableOpacity>
        </View>

        {isInitialLoading ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {ListHeader}
            {SkeletonList}
          </ScrollView>
        ) : (
          <FlatList
            data={filteredJobs || []}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderJobItem}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={EmptyComponent}
            contentContainerStyle={styles.jobsListContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
          />
        )}

        <BottomTabBar 
          activeTab={activeTab} 
          onTabPress={handleTabPress}
        />
      </View>

      <JobDetailModal
        visible={modalVisible}
        job={selectedJob}
        onClose={() => {
          setModalVisible(false);
          setSelectedJob(null);
        }}
        isLoading={loadingJobDetail}
        onViewClient={handleViewClient}
        onApply={handleApply}
        hasApplied={selectedJob ? appliedJobIds.includes(selectedJob._id) : false}
      />

      <ClientProfileModal
        visible={showClientProfile}
        client={selectedClient}
        onClose={() => {
          setShowClientProfile(false);
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
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 34,
    height: 34,
    backgroundColor: WHITE,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  topbarBrand: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  topbarTagline: { fontSize: 9, fontWeight: '500', color: GOLD_LT, letterSpacing: 1.44, textTransform: 'uppercase', marginTop: 1 },
  notifBtn: { position: 'relative', padding: 4 },

  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  userInfoContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: GREEN_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GREEN_MID,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  statusBadgeText: {
    fontSize: 10,
    color: GREEN,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GOLD_LT,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
  },

  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 2,
    height: 46,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_MAIN,
    paddingVertical: 10,
  },
  clearSearchBtn: {
    padding: 4,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: BORDER,
  },

  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 12 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: TEXT_MAIN 
  },
  sectionCount: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: TEXT_MUTED 
  },
  searchResultText: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_MUTED,
  },

  jobsListContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 80 
  },

  jobCard: {
    backgroundColor: CARD, 
    marginBottom: 12, 
    borderRadius: 18, 
    borderWidth: 1.5, 
    borderColor: BORDER,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  jobCardContent: {
    flex: 1,
    padding: 16,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
  },
  jobCardTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10, 
    gap: 6, 
    flexWrap: 'wrap' 
  },
  badgeUrgent: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 999 
  },
  badgeUrgentText: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: '#D97706' 
  },
  badgeFeatured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GOLD_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GOLD_MID,
  },
  badgeFeaturedText: {
    fontSize: 11,
    fontWeight: '600',
    color: GOLD_DK,
  },
  badgeOpen: {
    backgroundColor: `${GREEN}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeOpenText: {
    fontSize: 11,
    fontWeight: '600',
    color: GREEN,
  },
  badgeWorkSetup: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: `${BLUE}10`, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 999 
  },
  badgeWorkSetupText: { 
    fontSize: 10, 
    fontWeight: '600', 
    color: BLUE 
  },
  badgeTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BG,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeTimeText: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  badgeApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${GREEN}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeAppliedText: {
    fontSize: 10,
    color: GREEN,
    fontWeight: '600',
  },
  jobTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: TEXT_MAIN, 
    marginBottom: 4, 
    lineHeight: 23 
  },
  
  clientInfoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 6 
  },
  clientAvatarSmall: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    backgroundColor: `${BLUE}15`, 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden' 
  },
  clientAvatarSmallImg: { 
    width: 20, 
    height: 20, 
    borderRadius: 10 
  },
  clientAvatarSmallText: { 
    fontSize: 8, 
    fontWeight: '700', 
    color: BLUE 
  },
  jobCompany: { 
    fontSize: 13, 
    color: BLUE, 
    fontWeight: '500', 
    flex: 1 
  },
  
  jobMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    marginBottom: 8 
  },
  jobLocation: { 
    fontSize: 12, 
    color: TEXT_MUTED 
  },
  
  descriptionPreview: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
    marginBottom: 8,
  },
  
  budgetChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: 'rgba(200,149,32,0.08)', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(200,149,32,0.2)', 
    marginBottom: 10 
  },
  budgetText: { 
    fontSize: 12, 
    color: GOLD_DK, 
    fontWeight: '600' 
  },
  tagRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6 
  },
  tag: { 
    paddingVertical: 5, 
    paddingHorizontal: 12, 
    backgroundColor: BG, 
    borderRadius: 999, 
    borderWidth: 1.5, 
    borderColor: BORDER 
  },
  tagText: { 
    fontSize: 12, 
    color: TEXT_MUTED, 
    fontWeight: '500' 
  },

  skeletonLine: { 
    backgroundColor: BORDER, 
    borderRadius: 6, 
    marginBottom: 6, 
    opacity: 0.6 
  },

  emptyCard: { 
    backgroundColor: CARD, 
    marginHorizontal: 0, 
    borderRadius: 18, 
    borderWidth: 1.5, 
    borderColor: BORDER, 
    padding: 36, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  emptyTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: TEXT_MAIN, 
    marginTop: 14, 
    marginBottom: 6 
  },
  emptySub: { 
    fontSize: 13, 
    color: TEXT_MUTED, 
    textAlign: 'center', 
    paddingHorizontal: 20 
  },

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
});

// ── Detail Modal Styles ────────────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,26,62,0.55)' },
  container: { 
    backgroundColor: WHITE, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: SCREEN_H * 0.92, 
    paddingTop: 12,
    position: 'relative',
  },
  handle: { 
    width: 40, 
    height: 4, 
    borderRadius: 999, 
    backgroundColor: BORDER, 
    alignSelf: 'center', 
    marginBottom: 16 
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    paddingHorizontal: 20, 
    marginBottom: 14, 
    gap: 12 
  },
  companyLogo: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: `${BLUE}10`, 
    borderWidth: 1.5, 
    borderColor: `${BLUE}18`, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexShrink: 0 
  },
  headerInfo: { 
    flex: 1 
  },
  jobTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: TEXT_MAIN, 
    lineHeight: 23, 
    marginBottom: 3 
  },
  clientNameLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobCompany: { 
    fontSize: 13, 
    color: BLUE, 
    fontWeight: '500' 
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  closeBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    backgroundColor: BG, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  clientInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${BLUE}5`,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: `${BLUE}15`,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BLUE}15`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clientAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  clientAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: BLUE,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  
  metaRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    paddingHorizontal: 20, 
    marginBottom: 16 
  },
  metaChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: BG, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 999, 
    borderWidth: 1.5, 
    borderColor: BORDER 
  },
  metaChipGold: { 
    backgroundColor: 'rgba(200,149,32,0.08)', 
    borderColor: 'rgba(200,149,32,0.2)' 
  },
  metaText: { 
    fontSize: 12, 
    color: TEXT_MUTED, 
    fontWeight: '500' 
  },
  divider: { 
    height: 1.5, 
    backgroundColor: BORDER, 
    marginHorizontal: 20, 
    marginBottom: 16 
  },
  body: { 
    paddingHorizontal: 20,
    maxHeight: SCREEN_H * 0.45,
  },
  section: { 
    marginBottom: 20 
  },
  sectionLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: BLUE, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    marginBottom: 10 
  },
  tagRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6 
  },
  tag: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    backgroundColor: `${BLUE}10`, 
    borderRadius: 999, 
    borderWidth: 1.5, 
    borderColor: `${BLUE}22` 
  },
  tagText: { 
    fontSize: 12, 
    color: BLUE, 
    fontWeight: '600' 
  },
  descText: { 
    fontSize: 14, 
    color: TEXT_MUTED, 
    lineHeight: 22,
  },
  questionItem: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 8,
    alignItems: 'flex-start',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  questionNumber: { 
    fontSize: 14, 
    color: BLUE, 
    fontWeight: '600', 
    width: 24 
  },
  questionText: { 
    fontSize: 14, 
    color: TEXT_MAIN, 
    flex: 1, 
    lineHeight: 20 
  },
  requiredBadge: {
    backgroundColor: BLUE_SOFT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  requiredBadgeText: {
    fontSize: 9,
    color: BLUE,
    fontWeight: '600',
  },
  timelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '47%',
  },
  timelineLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
    marginBottom: 1,
  },
  timelineValue: {
    fontSize: 12,
    color: TEXT_MAIN,
    fontWeight: '600',
  },
  detailGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    backgroundColor: BG, 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1.5, 
    borderColor: BORDER,
    marginBottom: 20,
  },
  detailItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 10, 
    width: '45%' 
  },
  detailLabel: { 
    fontSize: 10, 
    color: TEXT_LIGHT, 
    fontWeight: '500', 
    marginBottom: 2 
  },
  detailValue: { 
    fontSize: 13, 
    color: TEXT_MAIN, 
    fontWeight: '600' 
  },

  applyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonDisabled: {
    backgroundColor: `${GREEN}80`,
    shadowOpacity: 0.1,
  },
  applyIcon: {
    marginRight: 10,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.3,
  },
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

// ── Client Profile Modal Styles ──────────────────────────────────────────────────
const clientProfileStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,26,62,0.55)' },
  container: { 
    backgroundColor: WHITE, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: SCREEN_H * 0.85, 
    paddingTop: 12 
  },
  handle: { 
    width: 40, 
    height: 4, 
    borderRadius: 999, 
    backgroundColor: BORDER, 
    alignSelf: 'center', 
    marginBottom: 16 
  },
  header: { 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: BORDER 
  },
  avatarLarge: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: `${BLUE}15`, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12, 
    overflow: 'hidden' 
  },
  avatarImage: { 
    width: 72, 
    height: 72, 
    borderRadius: 36 
  },
  avatarInitials: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: BLUE 
  },
  clientName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: TEXT_MAIN, 
    marginBottom: 2 
  },
  companyName: { 
    fontSize: 14, 
    color: TEXT_MUTED, 
    marginBottom: 6 
  },
  ratingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 2, 
    marginBottom: 4 
  },
  ratingText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: TEXT_MAIN, 
    marginLeft: 4 
  },
  closeBtn: { 
    position: 'absolute', 
    top: 0, 
    right: 12, 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    backgroundColor: BG, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  body: { 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 20 
  },
  section: { 
    marginBottom: 20 
  },
  sectionLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: BLUE, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    marginBottom: 10 
  },
  bioText: { 
    fontSize: 14, 
    color: TEXT_MUTED, 
    lineHeight: 22 
  },
  detailGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    backgroundColor: BG, 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1.5, 
    borderColor: BORDER 
  },
  detailItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 10, 
    width: '45%' 
  },
  detailLabel: { 
    fontSize: 10, 
    color: TEXT_LIGHT, 
    fontWeight: '500', 
    marginBottom: 2 
  },
  detailValue: { 
    fontSize: 13, 
    color: TEXT_MAIN, 
    fontWeight: '500', 
    flexShrink: 1 
  },
  skillRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6 
  },
  skillTag: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    backgroundColor: `${BLUE}10`, 
    borderRadius: 999, 
    borderWidth: 1.5, 
    borderColor: `${BLUE}22` 
  },
  skillTagText: { 
    fontSize: 12, 
    color: BLUE, 
    fontWeight: '500' 
  },
  projectContainer: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  projectText: {
    fontSize: 13,
    color: TEXT_MAIN,
    flex: 1,
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyStateTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: TEXT_MUTED, 
    marginTop: 12 
  },
  emptyStateText: { 
    fontSize: 13, 
    color: TEXT_LIGHT, 
    textAlign: 'center', 
    marginTop: 4, 
    paddingHorizontal: 20 
  },
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
  educationScroll: { marginBottom: 16 },
  uploadBtn: { backgroundColor: BG, borderRadius: 10, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', marginBottom: 16 },
  uploadBtnText: { fontSize: 13, color: BLUE, marginTop: 8 },
  uploadBtnSubtext: { fontSize: 10, color: TEXT_LIGHT, marginTop: 2 },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: BG, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1.5, borderColor: BORDER },
  fileName: { flex: 1, fontSize: 12, color: TEXT_MAIN },
  fileSize: { fontSize: 10, color: TEXT_LIGHT },
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
  experienceDescription: { fontSize: 11, color: TEXT_MUTED, marginTop: 4 },
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