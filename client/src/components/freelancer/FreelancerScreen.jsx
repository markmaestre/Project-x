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


const GREEN      = '#4ADE80';
const GREEN_DARK = '#22C55E';
const GREEN_SOFT = '#DCFCE7';
const GREEN_MID  = '#86EFAC';
const WHITE      = '#FFFFFF';
const OFF_WHITE  = '#F0FDF4';
const BORDER     = 'rgba(74,222,128,0.25)';
const TEXT_MAIN  = '#0F2417';
const TEXT_MUTED = '#6B7280';
const TEXT_LIGHT = '#9CA3AF';

const { height: SCREEN_H } = Dimensions.get('window');

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

const formatJobType = (type) => {
  const types = {
    'full_time': 'Full Time',
    'part_time': 'Part Time',
    'contract': 'Contract',
    'one_time': 'One Time',
    'internship': 'Internship',
    'freelance': 'Freelance'
  };
  return types[type] || type;
};

const formatWorkSetup = (setup) => {
  const setups = {
    'remote': 'Remote',
    'onsite': 'Onsite',
    'hybrid': 'Hybrid'
  };
  return setups[setup] || setup;
};

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


const TABS = [
  { key: 'Home',     label: 'Home',     icon: 'home',       iconOutline: 'home-outline'       },
  { key: 'MyJobs',   label: 'My Jobs',  icon: 'briefcase',  iconOutline: 'briefcase-outline'  },
  { key: 'Messages', label: 'Messages', icon: 'chatbubble', iconOutline: 'chatbubble-outline' },
  { key: 'Profile',  label: 'Profile',  icon: 'person',     iconOutline: 'person-outline'     },
];

// ── Job Detail Bottom Sheet ────────────────────────────────────────────────
function JobDetailSheet({ job, visible, onClose, onApply }) {
  if (!job) return null;

  const locationText = formatLocation(job.location);
  const jobTypeText = formatJobType(job.job_type);
  const workSetupText = formatWorkSetup(job.work_setup);
  const payText = formatPayInformation(job.pay_information, job.budget_amount);
  const skills = job.required_skills || job.skills || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sheet.overlay}>
        <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={sheet.container}>
          <View style={sheet.handle} />

          {/* Header */}
          <View style={sheet.header}>
            <View style={sheet.companyLogo}>
              <Ionicons name="briefcase-outline" size={22} color={GREEN_DARK} />
            </View>
            <View style={sheet.headerInfo}>
              <Text style={sheet.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>
              <Text style={sheet.jobCompany}>{job.client_id?.company_name || job.company_name || 'Company'}</Text>
            </View>
            <TouchableOpacity style={sheet.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          {/* Meta row */}
          <View style={sheet.metaRow}>
            {locationText && (
              <View style={sheet.metaChip}>
                <Ionicons name="location-outline" size={13} color={TEXT_MUTED} />
                <Text style={sheet.metaText}>{locationText}</Text>
              </View>
            )}
            {jobTypeText && (
              <View style={sheet.metaChip}>
                <Ionicons name="briefcase-outline" size={13} color={TEXT_MUTED} />
                <Text style={sheet.metaText}>{jobTypeText}</Text>
              </View>
            )}
            {workSetupText && (
              <View style={sheet.metaChip}>
                <Ionicons name="wifi-outline" size={13} color={TEXT_MUTED} />
                <Text style={sheet.metaText}>{workSetupText}</Text>
              </View>
            )}
            {payText && (
              <View style={[sheet.metaChip, sheet.metaChipGreen]}>
                <Ionicons name="cash-outline" size={13} color={GREEN_DARK} />
                <Text style={[sheet.metaText, { color: GREEN_DARK, fontWeight: '600' }]}>{payText}</Text>
              </View>
            )}
          </View>

          <View style={sheet.divider} />

          {/* Scrollable body */}
          <ScrollView style={sheet.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Skills */}
            {skills.length > 0 && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Required Skills</Text>
                <View style={sheet.tagRow}>
                  {skills.map((s, i) => (
                    <View key={i} style={sheet.tag}>
                      <Text style={sheet.tagText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Description */}
            <View style={sheet.section}>
              <Text style={sheet.sectionLabel}>Job Description</Text>
              <Text style={sheet.descText}>
                {job.description || 'No description provided for this job posting.'}
              </Text>
            </View>

            {/* Requirements */}
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

            {/* Education Requirements */}
            {job.education_requirements && job.education_requirements.minimum_degree !== 'none' && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Education Requirements</Text>
                <Text style={sheet.descText}>
                  • Minimum Degree: {job.education_requirements.minimum_degree?.replace('_', ' ').toUpperCase()}
                </Text>
                {job.education_requirements.preferred_field && (
                  <Text style={sheet.descText}>• Preferred Field: {job.education_requirements.preferred_field}</Text>
                )}
              </View>
            )}

            {/* Benefits */}
            {job.pay_information?.benefits?.length > 0 && (
              <View style={sheet.section}>
                <Text style={sheet.sectionLabel}>Benefits</Text>
                <View style={sheet.tagRow}>
                  {job.pay_information.benefits.map((benefit, i) => {
                    const benefitLabels = {
                      health_insurance: 'Health Insurance',
                      paid_time_off: 'Paid Time Off',
                      remote_stipend: 'Remote Stipend',
                      equipment_provided: 'Equipment Provided',
                      bonus_eligible: 'Bonus Eligible',
                      retirement_plan: 'Retirement Plan',
                      professional_development: 'Professional Development'
                    };
                    return (
                      <View key={i} style={sheet.tag}>
                        <Ionicons name="gift-outline" size={10} color={GREEN_DARK} />
                        <Text style={sheet.tagText}>{benefitLabels[benefit] || benefit}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Additional details */}
            <View style={sheet.detailGrid}>
              {job.experience_level && (
                <View style={sheet.detailItem}>
                  <Ionicons name="bar-chart-outline" size={16} color={GREEN_DARK} />
                  <View>
                    <Text style={sheet.detailLabel}>Experience Level</Text>
                    <Text style={sheet.detailValue}>{job.experience_level}</Text>
                  </View>
                </View>
              )}
              {job.urgency_level && (
                <View style={sheet.detailItem}>
                  <Ionicons name="flame-outline" size={16} color={GREEN_DARK} />
                  <View>
                    <Text style={sheet.detailLabel}>Urgency</Text>
                    <Text style={sheet.detailValue}>{job.urgency_level?.toUpperCase()}</Text>
                  </View>
                </View>
              )}
              {job.estimated_duration && (
                <View style={sheet.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={GREEN_DARK} />
                  <View>
                    <Text style={sheet.detailLabel}>Duration</Text>
                    <Text style={sheet.detailValue}>{job.estimated_duration}</Text>
                  </View>
                </View>
              )}
              {job.created_at && (
                <View style={sheet.detailItem}>
                  <Ionicons name="time-outline" size={16} color={GREEN_DARK} />
                  <View>
                    <Text style={sheet.detailLabel}>Posted</Text>
                    <Text style={sheet.detailValue}>
                      {new Date(job.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* CTA */}
          <View style={sheet.footer}>
            <TouchableOpacity style={sheet.saveBtn}>
              <Ionicons name="bookmark-outline" size={20} color={GREEN_DARK} />
            </TouchableOpacity>
            <TouchableOpacity style={sheet.applyBtn} onPress={() => onApply(job)} activeOpacity={0.85}>
              <Text style={sheet.applyBtnText}>Apply Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Application Modal Component with Existing CV Support ──────────────────
function ApplicationModal({ visible, job, onClose, onSubmit, submitting, userProfile }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [useExistingCV, setUseExistingCV] = useState(true);
  const [existingCVInfo, setExistingCVInfo] = useState(null);
  
  // Education State
  const [educationLevel, setEducationLevel] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  
  // Experience State
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

  // Check for existing CV in local storage using new FileSystem API
  useEffect(() => {
    if (visible && job) {
      const checkExistingCV = async () => {
        try {
          // Create a reference to the cvs directory using the new Directory class
          const cvDirectory = new Directory(Paths.document, 'cvs');
          
          // Check if directory exists using the exists property
          if (cvDirectory.exists) {
            // List all files in the directory using list() method
            const files = cvDirectory.list();
            
            // Filter for CV files
            const cvFiles = files.filter(file => 
              file.name.endsWith('.pdf') || 
              file.name.endsWith('.doc') || 
              file.name.endsWith('.docx')
            );
            
            if (cvFiles.length > 0) {
              // Get the latest CV (first one)
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
      console.error('Error picking resume:', error);
      Alert.alert('Error', 'Failed to select resume file');
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    if (existingCVInfo) {
      setUseExistingCV(true);
    }
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
    Alert.alert(
      'Remove Experience',
      'Are you sure you want to remove this experience?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const updatedExperiences = experiences.filter((_, i) => i !== index);
            setExperiences(updatedExperiences);
            if (editingExperienceIndex === index) {
              setCurrentExperience({
                jobTitle: '',
                companyName: '',
                startDate: '',
                endDate: '',
                currentlyWorking: false,
                description: '',
              });
              setEditingExperienceIndex(null);
              setShowExperienceForm(false);
            }
          }
        }
      ]
    );
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
    // IMPORTANT: Create FormData and append all fields
    const formData = new FormData();
    
    // Debug: Log job object to verify it has an _id
    console.log('Submitting for job:', job);
    console.log('Job ID:', job?._id);
    
    // Ensure job_id is sent - this is the critical field
    if (!job?._id) {
      Alert.alert('Error', 'Invalid job data. Please try again.');
      return;
    }
    
    formData.append('job_id', job._id);
    formData.append('cover_letter', coverLetter.trim() || "I'm interested in this position.");
    
    if (proposedRate) {
      formData.append('proposed_rate', parseFloat(proposedRate).toString());
    }
    
    // Handle file upload - CRITICAL FIX
    if (useExistingCV && existingCVInfo) {
      // For existing CV, get file extension to determine mime type
      const fileExt = existingCVInfo.name.split('.').pop().toLowerCase();
      let mimeType = 'application/pdf';
      if (fileExt === 'doc') mimeType = 'application/msword';
      if (fileExt === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      // Create a file object for upload
      const fileObject = {
        uri: existingCVInfo.uri,
        name: existingCVInfo.name,
        type: mimeType,
      };
      formData.append('resume', fileObject);
    } else if (resumeFile) {
      // For newly uploaded file
      formData.append('resume', {
        uri: resumeFile.uri,
        name: resumeFile.name,
        type: resumeFile.mimeType || 'application/pdf',
      });
    }
    
    // Add education as JSON string
    const educationData = {
      level: educationLevel,
      field_of_study: fieldOfStudy,
      institution: institutionName,
      graduation_year: graduationYear || null,
    };
    formData.append('education', JSON.stringify(educationData));
    
    // Add experiences as JSON string
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
    
    // Debug: Log all FormData entries
    console.log('=== FormData Contents ===');
    for (let pair of formData.entries()) {
      console.log(pair[0], ':', typeof pair[1] === 'object' ? (pair[1].name || pair[1].uri || 'Object') : pair[1]);
    }
    
    onSubmit(formData);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]}>
        <Text style={[styles.stepDotText, currentStep >= 1 && styles.stepDotTextActive]}>1</Text>
      </View>
      <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
      <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]}>
        <Text style={[styles.stepDotText, currentStep >= 2 && styles.stepDotTextActive]}>2</Text>
      </View>
      <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
      <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive]}>
        <Text style={[styles.stepDotText, currentStep >= 3 && styles.stepDotTextActive]}>3</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.applyModalWrap}>
        <View style={styles.applyModalSheet}>
          <View style={styles.applyModalHeader}>
            <TouchableOpacity onPress={handlePrevStep} disabled={currentStep === 1}>
              <Ionicons name="arrow-back" size={24} color={currentStep === 1 ? TEXT_LIGHT : TEXT_MAIN} />
            </TouchableOpacity>
            <Text style={styles.applyModalTitle}>Apply for Job</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
          
          {renderStepIndicator()}
          
          <View style={styles.applyModalContentWrapper}>
            <View style={styles.jobInfoHeader}>
              <Text style={styles.applyJobTitle}>{job?.title}</Text>
              <Text style={styles.applyJobCompany}>{job?.client_id?.company_name || 'Client'}</Text>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              {currentStep === 1 && (
                <>
                  <Text style={styles.applyLabel}>Resume/CV *</Text>
                  
                  {/* Show existing CV option if available */}
                  {existingCVInfo && !resumeFile && (
                    <View style={styles.existingCVContainer}>
                      <TouchableOpacity 
                        style={[
                          styles.existingCVOption,
                          useExistingCV && styles.existingCVOptionActive
                        ]}
                        onPress={() => {
                          setUseExistingCV(true);
                          setResumeFile(null);
                        }}
                      >
                        <Ionicons name="document-text" size={24} color={useExistingCV ? GREEN_DARK : TEXT_MUTED} />
                        <View style={styles.existingCVInfo}>
                          <Text style={styles.existingCVName}>{existingCVInfo.name}</Text>
                          <Text style={styles.existingCVSize}>{formatFileSize(existingCVInfo.size)}</Text>
                        </View>
                        {useExistingCV && (
                          <View style={styles.radioSelected}>
                            <Ionicons name="checkmark-circle" size={20} color={GREEN_DARK} />
                          </View>
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.existingCVOption,
                          !useExistingCV && styles.existingCVOptionActive
                        ]}
                        onPress={() => setUseExistingCV(false)}
                      >
                        <Ionicons name="cloud-upload-outline" size={24} color={!useExistingCV ? GREEN_DARK : TEXT_MUTED} />
                        <Text style={styles.uploadNewText}>Upload new CV</Text>
                        {!useExistingCV && (
                          <View style={styles.radioSelected}>
                            <Ionicons name="checkmark-circle" size={20} color={GREEN_DARK} />
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Upload new CV section */}
                  {(!existingCVInfo || !useExistingCV) && (
                    <>
                      {!resumeFile ? (
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickResume}>
                          <Ionicons name="cloud-upload-outline" size={24} color={GREEN_DARK} />
                          <Text style={styles.uploadBtnText}>Upload your resume (PDF, DOC, DOCX)</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.fileInfo}>
                          <Ionicons name="document-text-outline" size={20} color={GREEN_DARK} />
                          <Text style={styles.fileName} numberOfLines={1}>{resumeFile.name}</Text>
                          <TouchableOpacity onPress={removeResume}>
                            <Ionicons name="close-circle" size={20} color="#f87171" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}

                  <Text style={styles.applyLabel}>Highest Level of Education Completed *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.educationScroll}>
                    {EDUCATION_LEVELS.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.educationChip, educationLevel === level && styles.educationChipActive]}
                        onPress={() => setEducationLevel(level)}
                      >
                        <Text style={[styles.educationChipText, educationLevel === level && styles.educationChipTextActive]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.applyLabel}>Field of Study *</Text>
                  <TextInput
                    style={styles.applyInput}
                    placeholder="e.g., Computer Science"
                    placeholderTextColor={TEXT_LIGHT}
                    value={fieldOfStudy}
                    onChangeText={setFieldOfStudy}
                  />

                  <Text style={styles.applyLabel}>Institution Name *</Text>
                  <TextInput
                    style={styles.applyInput}
                    placeholder="e.g., University of Technology"
                    placeholderTextColor={TEXT_LIGHT}
                    value={institutionName}
                    onChangeText={setInstitutionName}
                  />

                  <Text style={styles.applyLabel}>Graduation Year (Optional)</Text>
                  <TextInput
                    style={styles.applyInput}
                    placeholder="e.g., 2020"
                    placeholderTextColor={TEXT_LIGHT}
                    value={graduationYear}
                    onChangeText={setGraduationYear}
                    keyboardType="numeric"
                  />
                </>
              )}

              {currentStep === 2 && (
                <>
                  <View style={styles.experienceHeader}>
                    <Text style={styles.applyLabel}>Work Experience (Optional)</Text>
                    <TouchableOpacity style={styles.addExperienceBtn} onPress={() => setShowExperienceForm(true)}>
                      <Ionicons name="add-circle" size={20} color={GREEN_DARK} />
                      <Text style={styles.addExperienceText}>Add Experience</Text>
                    </TouchableOpacity>
                  </View>

                  {experiences.length === 0 ? (
                    <View style={styles.noExperience}>
                      <Ionicons name="briefcase-outline" size={32} color={TEXT_LIGHT} />
                      <Text style={styles.noExperienceText}>No experience added yet</Text>
                      <Text style={styles.noExperienceSub}>Tap "Add Experience" to showcase your work history</Text>
                    </View>
                  ) : (
                    experiences.map((exp, index) => (
                      <View key={exp.id || index} style={styles.experienceCard}>
                        <View style={styles.experienceCardHeader}>
                          <View style={styles.experienceCardTitle}>
                            <Ionicons name="briefcase-outline" size={16} color={GREEN_DARK} />
                            <Text style={styles.experienceJobTitle}>{exp.jobTitle}</Text>
                          </View>
                          <View style={styles.experienceCardActions}>
                            <TouchableOpacity onPress={() => editExperience(index)}>
                              <Ionicons name="pencil-outline" size={16} color={TEXT_MUTED} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeExperience(index)}>
                              <Ionicons name="trash-outline" size={16} color="#f87171" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={styles.experienceCompany}>{exp.companyName}</Text>
                        <Text style={styles.experienceDate}>
                          {exp.startDate || 'Start date'} - {exp.currentlyWorking ? 'Present' : (exp.endDate || 'End date')}
                        </Text>
                        {exp.description ? <Text style={styles.experienceDesc} numberOfLines={2}>{exp.description}</Text> : null}
                      </View>
                    ))
                  )}

                  {/* Experience Form Modal */}
                  <Modal visible={showExperienceForm} animationType="slide" transparent onRequestClose={() => setShowExperienceForm(false)}>
                    <View style={styles.expModalWrap}>
                      <View style={styles.expModalSheet}>
                        <View style={styles.expModalHeader}>
                          <Text style={styles.expModalTitle}>{editingExperienceIndex !== null ? 'Edit Experience' : 'Add Experience'}</Text>
                          <TouchableOpacity onPress={() => {
                            setShowExperienceForm(false);
                            setEditingExperienceIndex(null);
                            setCurrentExperience({
                              jobTitle: '', companyName: '', startDate: '', endDate: '', currentlyWorking: false, description: '',
                            });
                          }}>
                            <Ionicons name="close" size={24} color={TEXT_MUTED} />
                          </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.expModalContent}>
                          <Text style={styles.applyLabel}>Job Title *</Text>
                          <TextInput style={styles.applyInput} placeholder="e.g., Senior Developer" placeholderTextColor={TEXT_LIGHT} value={currentExperience.jobTitle} onChangeText={(text) => setCurrentExperience({...currentExperience, jobTitle: text})} />
                          <Text style={styles.applyLabel}>Company Name *</Text>
                          <TextInput style={styles.applyInput} placeholder="e.g., Google" placeholderTextColor={TEXT_LIGHT} value={currentExperience.companyName} onChangeText={(text) => setCurrentExperience({...currentExperience, companyName: text})} />
                          <Text style={styles.applyLabel}>Start Date</Text>
                          <TextInput style={styles.applyInput} placeholder="e.g., Jan 2020" placeholderTextColor={TEXT_LIGHT} value={currentExperience.startDate} onChangeText={(text) => setCurrentExperience({...currentExperience, startDate: text})} />
                          <View style={styles.currentlyWorkingRow}>
                            <TouchableOpacity style={styles.checkbox} onPress={() => setCurrentExperience({...currentExperience, currentlyWorking: !currentExperience.currentlyWorking})}>
                              {currentExperience.currentlyWorking && <Ionicons name="checkmark" size={14} color={GREEN_DARK} />}
                            </TouchableOpacity>
                            <Text style={styles.checkboxLabel}>I currently work here</Text>
                          </View>
                          {!currentExperience.currentlyWorking && (
                            <>
                              <Text style={styles.applyLabel}>End Date</Text>
                              <TextInput style={styles.applyInput} placeholder="e.g., Dec 2023" placeholderTextColor={TEXT_LIGHT} value={currentExperience.endDate} onChangeText={(text) => setCurrentExperience({...currentExperience, endDate: text})} />
                            </>
                          )}
                          <Text style={styles.applyLabel}>Job Description (Optional)</Text>
                          <TextInput style={[styles.applyInput, styles.applyTextArea]} placeholder="Describe your responsibilities..." placeholderTextColor={TEXT_LIGHT} value={currentExperience.description} onChangeText={(text) => setCurrentExperience({...currentExperience, description: text})} multiline numberOfLines={4} />
                        </ScrollView>
                        <TouchableOpacity style={styles.expModalBtn} onPress={addExperience}>
                          <Text style={styles.expModalBtnText}>{editingExperienceIndex !== null ? 'Update Experience' : 'Add Experience'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <Text style={styles.reviewSectionTitle}>Review Your Application</Text>
                  
                  <Text style={styles.reviewSubTitle}>Resume & Education</Text>
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewRow}>
                      <Ionicons name="document-text-outline" size={16} color={GREEN_DARK} />
                      <Text style={styles.reviewLabel}>Resume:</Text>
                      <Text style={styles.reviewValue}>
                        {useExistingCV && existingCVInfo ? existingCVInfo.name : (resumeFile?.name || 'Not uploaded')}
                      </Text>
                    </View>
                    <View style={styles.reviewRow}>
                      <Ionicons name="school-outline" size={16} color={GREEN_DARK} />
                      <Text style={styles.reviewLabel}>Education:</Text>
                      <Text style={styles.reviewValue}>{educationLevel} in {fieldOfStudy}</Text>
                    </View>
                    <View style={styles.reviewRow}>
                      <Ionicons name="business-outline" size={16} color={GREEN_DARK} />
                      <Text style={styles.reviewLabel}>Institution:</Text>
                      <Text style={styles.reviewValue}>{institutionName}</Text>
                    </View>
                  </View>

                  {experiences.length > 0 && (
                    <>
                      <Text style={styles.reviewSubTitle}>Work Experience</Text>
                      {experiences.map((exp, index) => (
                        <View key={index} style={styles.reviewCard}>
                          <Text style={styles.reviewExpTitle}>{exp.jobTitle}</Text>
                          <Text style={styles.reviewExpCompany}>{exp.companyName}</Text>
                          <Text style={styles.reviewExpDate}>{exp.startDate || 'Start date'} - {exp.currentlyWorking ? 'Present' : (exp.endDate || 'End date')}</Text>
                          {exp.description && <Text style={styles.reviewExpDesc}>{exp.description}</Text>}
                        </View>
                      ))}
                    </>
                  )}

                  <Text style={styles.reviewSubTitle}>Cover Letter & Rate</Text>
                  <View style={styles.reviewCard}>
                    {proposedRate && (
                      <View style={styles.reviewRow}>
                        <Ionicons name="cash-outline" size={16} color={GREEN_DARK} />
                        <Text style={styles.reviewLabel}>Proposed Rate:</Text>
                        <Text style={styles.reviewValue}>₱{parseFloat(proposedRate).toLocaleString()}</Text>
                      </View>
                    )}
                    <TextInput
                      style={styles.coverLetterInput}
                      placeholder="Write your cover letter here (optional)..."
                      placeholderTextColor={TEXT_LIGHT}
                      value={coverLetter}
                      onChangeText={setCoverLetter}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </View>

          <View style={styles.applyModalFooter}>
            {currentStep < 3 ? (
              <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                <Text style={styles.nextStepBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={WHITE} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabledBtn]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={WHITE} /> : <Text style={styles.submitBtnText}>Submit Application</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function FreelancerScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { receivedOffers, isLoading: offersLoading } = useSelector(s => s.offers);
  const { list: jobs, isLoading: jobsLoading } = useSelector(s => s.jobs.jobs);
  const { applications, isLoading: appsLoading } = useSelector(s => s.applications);

  const [activeTab, setActiveTab] = useState('Home');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`;
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  const fetchDashboardData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getReceivedOffers({})).unwrap(),
        dispatch(getFreelancerJobs({ limit: 10 })).unwrap(),
        dispatch(getFreelancerApplications({})).unwrap(),
      ]);
      try { await dispatch(getOfferStats()).unwrap(); } catch (_) {}
    } catch (e) { console.error('Dashboard fetch error:', e); }
  }, [dispatch]);

  const fetchApplications = useCallback(async () => {
    try {
      const result = await dispatch(getFreelancerApplications({})).unwrap();
      const applicationsList = result.applications || result.data || result || [];
      const appliedIds = applicationsList.map(app => app.job_id?._id || app.job_id);
      setAppliedJobIds(appliedIds);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, [dispatch]);

  useEffect(() => { 
    fetchDashboardData();
    fetchApplications();
  }, [fetchDashboardData, fetchApplications]);

  const pendingOffers = receivedOffers?.filter(o => o.status === 'pending').length || 0;
  const isLoading = jobsLoading || offersLoading || appsLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await fetchApplications();
    setRefreshing(false);
  }, [fetchDashboardData, fetchApplications]);

  const handleTabPress = (key) => {
    setActiveTab(key);
    if (key === 'MyJobs') onNavigate('MyJobs');
    if (key === 'Messages') onNavigate('Messages');
    if (key === 'Profile') onNavigate('FreelancerProfile');
  };

  const handleLogout = () =>
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive',
        onPress: async () => { await dispatch(logout()); onNavigate('Login'); } },
    ]);

  const openJobDetail = (job) => {
    setSelectedJob(job);
    setSheetVisible(true);
  };

  const handleApply = (job) => {
    setSheetVisible(false);
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async (formData) => {
    // Double-check that we have a valid job ID
    if (!selectedJob?._id) {
      Alert.alert('Error', 'Invalid job data. Please try again.');
      setShowApplyModal(false);
      return;
    }
    
    if (appliedJobIds.includes(selectedJob._id)) {
      Alert.alert('Already Applied', 'You have already applied for this position.');
      setShowApplyModal(false);
      return;
    }

    setSubmitting(true);
    try {
      const result = await dispatch(applyForJob(formData)).unwrap();
      console.log('Application success:', result);
      setAppliedJobIds([...appliedJobIds, selectedJob._id]);
      Alert.alert(
        'Application Submitted!',
        `Your application for ${selectedJob.title} has been sent successfully.`,
        [{ text: 'OK', onPress: () => setShowApplyModal(false) }]
      );
      await fetchApplications();
    } catch (error) {
      console.error('Application error details:', error);
      Alert.alert('Error', error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format job data for display
  const getJobLocationDisplay = (job) => {
    return formatLocation(job.location) || 'Remote';
  };

  const getJobBudgetDisplay = (job) => {
    return formatBudgetForCard(job);
  };

  const getJobSkills = (job) => {
    return job.required_skills || job.skills || [];
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* TOP BAR */}
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>T</Text>
            </View>
            <Text style={styles.topbarBrand}>Taskra</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => onNavigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={TEXT_MAIN} />
            {pendingOffers > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        {/* MAIN SCROLL */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_DARK} />}
        >
          {/* SEARCH PILL */}
          <View style={styles.searchPill}>
            <View style={styles.searchSide}>
              <Ionicons name="search-outline" size={18} color={TEXT_MUTED} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search jobs, skills..."
                placeholderTextColor={TEXT_LIGHT}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => onNavigate('BrowseJobs', { search: searchQuery, location: locationQuery })}
                returnKeyType="search"
              />
            </View>
            <View style={styles.pillDivider} />
            <View style={styles.searchSide}>
              <Ionicons name="location-outline" size={18} color={TEXT_MUTED} />
              <TextInput
                style={styles.searchInput}
                placeholder="City or area (e.g., Cainta)"
                placeholderTextColor={TEXT_LIGHT}
                value={locationQuery}
                onChangeText={setLocationQuery}
                returnKeyType="search"
              />
            </View>
          </View>

          {/* WELCOME */}
          <Text style={styles.welcomeBack}>Welcome back</Text>
          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeName}>{fullName || 'Freelancer'}</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.avatarBtn}>
              {user?.profile_picture
                ? <Image source={{ uri: user.profile_picture }} style={styles.avatarImg} />
                : <Text style={styles.avatarInitials}>{initials}</Text>}
            </TouchableOpacity>
          </View>

          {/* SECTION HEADER */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Jobs</Text>
            <TouchableOpacity onPress={() => onNavigate('BrowseJobs')}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* JOB LIST */}
          {isLoading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={GREEN_DARK} />
              <Text style={styles.loadingText}>Loading jobs…</Text>
            </View>
          ) : jobs && jobs.length > 0 ? (
            jobs.slice(0, 8).map((job, idx) => {
              const locationDisplay = getJobLocationDisplay(job);
              const budgetDisplay = getJobBudgetDisplay(job);
              const skills = getJobSkills(job);
              const workSetup = formatWorkSetup(job.work_setup);
              const hasApplied = appliedJobIds.includes(job._id);
              
              return (
                <TouchableOpacity
                  key={job._id || idx}
                  style={styles.jobCard}
                  onPress={() => openJobDetail(job)}
                  activeOpacity={0.85}
                >
                  <View style={styles.jobCardTop}>
                    {job.urgency_level === 'urgent' && (
                      <View style={styles.badgeUrgent}><Text style={styles.badgeUrgentText}>Urgent</Text></View>
                    )}
                    {workSetup && (
                      <View style={styles.badgeWorkSetup}>
                        <Ionicons name={job.work_setup === 'remote' ? 'wifi' : job.work_setup === 'onsite' ? 'business' : 'phone-portrait'} size={10} color={GREEN_DARK} />
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
                      <Ionicons name="cash-outline" size={13} color={GREEN_DARK} />
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
                  
                  {hasApplied && (
                    <View style={styles.appliedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={GREEN_DARK} />
                      <Text style={styles.appliedBadgeText}>Applied</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            !isLoading && (
              <View style={styles.emptyCard}>
                <Ionicons name="briefcase-outline" size={40} color={GREEN_MID} />
                <Text style={styles.emptyTitle}>No jobs available</Text>
                <Text style={styles.emptySub}>Check back later or search for opportunities</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => onNavigate('BrowseJobs')}>
                  <Text style={styles.emptyBtnText}>Browse Jobs</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* BOTTOM TAB BAR */}
        <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              const hasBadge = tab.key === 'Messages' && pendingOffers > 0;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {active && <View style={styles.tabActiveBar} />}
                  <View style={styles.tabIconWrap}>
                    <Ionicons
                      name={active ? tab.icon : tab.iconOutline}
                      size={23}
                      color={active ? GREEN_DARK : TEXT_LIGHT}
                    />
                    {hasBadge && <View style={styles.tabBadgeDot} />}
                  </View>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>

        {/* JOB DETAIL BOTTOM SHEET */}
        <JobDetailSheet
          job={selectedJob}
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          onApply={handleApply}
        />

        {/* APPLICATION MODAL */}
        <ApplicationModal
          visible={showApplyModal}
          job={selectedJob}
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleSubmitApplication}
          submitting={submitting}
          userProfile={user}
        />

      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },
  root: { flex: 1, backgroundColor: OFF_WHITE },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10, backgroundColor: WHITE,
  },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 30, height: 30, backgroundColor: GREEN, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 15, fontWeight: '800', color: WHITE },
  topbarBrand: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN, letterSpacing: -0.3 },
  notifBtn: { position: 'relative', padding: 4 },
  notifDot: {
    position: 'absolute', top: 4, right: 4,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: GREEN_DARK, borderWidth: 2, borderColor: WHITE,
  },

  scroll: { paddingBottom: 32 },

  searchPill: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14, marginBottom: 20,
    backgroundColor: WHITE, borderRadius: 28,
    borderWidth: 1.5, borderColor: '#D1D5DB', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  searchSide: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 4, gap: 8 },
  pillDivider: { width: 1, height: 28, backgroundColor: '#E5E7EB' },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_MAIN, paddingVertical: 10 },

  welcomeBack: { fontSize: 22, fontWeight: '700', color: TEXT_MAIN, paddingHorizontal: 20, marginBottom: 2 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 22 },
  welcomeName: { fontSize: 22, fontWeight: '700', color: TEXT_MAIN },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GREEN_MID,
  },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarInitials: { fontSize: 13, fontWeight: '700', color: WHITE },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN },
  sectionLink: { fontSize: 14, color: GREEN_DARK, fontWeight: '600' },

  loadingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 32 },
  loadingText: { fontSize: 14, color: TEXT_MUTED },

  jobCard: {
    backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  jobCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 },
  badgeUrgent: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeUrgentText: { fontSize: 11, fontWeight: '600', color: '#D97706' },
  badgeWorkSetup: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GREEN_SOFT, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeWorkSetupText: { fontSize: 10, fontWeight: '600', color: GREEN_DARK },
  bookmarkBtn: { padding: 2 },
  jobTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 4, lineHeight: 23 },
  jobCompany: { fontSize: 13, color: TEXT_MUTED, marginBottom: 6 },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  jobLocation: { fontSize: 12, color: TEXT_MUTED },
  budgetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GREEN_SOFT, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, borderColor: GREEN_MID, marginBottom: 10,
  },
  budgetText: { fontSize: 12, color: GREEN_DARK, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingVertical: 5, paddingHorizontal: 12, backgroundColor: OFF_WHITE, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  appliedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: GREEN_SOFT, borderRadius: 6, alignSelf: 'flex-start' },
  appliedBadgeText: { fontSize: 11, color: GREEN_DARK, fontWeight: '600' },

  emptyCard: { backgroundColor: WHITE, marginHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 36, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, marginTop: 14, marginBottom: 6 },
  emptySub: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginBottom: 18 },
  emptyBtn: { backgroundColor: GREEN_DARK, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },

  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    paddingTop: 6, paddingBottom: 4, paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 4, position: 'relative' },
  tabActiveBar: { position: 'absolute', top: 0, width: 28, height: 3, backgroundColor: GREEN_DARK, borderRadius: 999 },
  tabIconWrap: { position: 'relative', marginBottom: 3, marginTop: 6 },
  tabLabel: { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },
  tabLabelActive: { color: GREEN_DARK, fontWeight: '700' },
  tabBadgeDot: {
    position: 'absolute', top: -1, right: -3,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: GREEN_DARK, borderWidth: 1.5, borderColor: WHITE,
  },

  // Application Modal Styles
  applyModalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  applyModalSheet: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%' },
  applyModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: BORDER },
  applyModalTitle: { fontSize: 18, fontWeight: '600', color: TEXT_MAIN },
  applyModalContentWrapper: { flex: 1 },
  jobInfoHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: WHITE },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: OFF_WHITE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  stepDotActive: { backgroundColor: GREEN_DARK, borderColor: GREEN_DARK },
  stepDotText: { fontSize: 14, fontWeight: '700', color: TEXT_MUTED },
  stepDotTextActive: { color: WHITE },
  stepLine: { width: 40, height: 2, backgroundColor: BORDER, marginHorizontal: 5 },
  stepLineActive: { backgroundColor: GREEN_DARK },
  stepContent: { paddingHorizontal: 20, paddingBottom: 30 },
  applyJobTitle: { fontSize: 16, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
  applyJobCompany: { fontSize: 12, color: TEXT_MUTED },
  applyLabel: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED, marginBottom: 8, marginTop: 16 },
  applyInput: { backgroundColor: OFF_WHITE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: TEXT_MAIN, fontSize: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  applyTextArea: { height: 100, textAlignVertical: 'top' },
  uploadBtn: { backgroundColor: OFF_WHITE, borderRadius: 10, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed', marginBottom: 16 },
  uploadBtnText: { fontSize: 12, color: GREEN_DARK, marginTop: 8 },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: OFF_WHITE, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  fileName: { flex: 1, fontSize: 12, color: TEXT_MAIN },
  educationScroll: { flexDirection: 'row', marginBottom: 16 },
  educationChip: { backgroundColor: OFF_WHITE, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: BORDER },
  educationChipActive: { backgroundColor: GREEN_SOFT, borderColor: GREEN_DARK },
  educationChipText: { fontSize: 12, color: TEXT_MUTED },
  educationChipTextActive: { color: GREEN_DARK, fontWeight: '600' },
  experienceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  addExperienceBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: GREEN_SOFT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: GREEN_MID },
  addExperienceText: { fontSize: 11, color: GREEN_DARK, fontWeight: '500' },
  noExperience: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  noExperienceText: { fontSize: 14, color: TEXT_MUTED, marginTop: 10 },
  noExperienceSub: { fontSize: 11, color: TEXT_LIGHT, marginTop: 4 },
  experienceCard: { backgroundColor: OFF_WHITE, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  experienceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  experienceCardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  experienceJobTitle: { fontSize: 14, fontWeight: '600', color: TEXT_MAIN },
  experienceCardActions: { flexDirection: 'row', gap: 12 },
  experienceCompany: { fontSize: 12, color: TEXT_MUTED, marginBottom: 4 },
  experienceDate: { fontSize: 11, color: TEXT_LIGHT, marginBottom: 6 },
  experienceDesc: { fontSize: 11, color: TEXT_MUTED },
  expModalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  expModalSheet: { backgroundColor: WHITE, borderRadius: 16, width: '100%', maxHeight: '80%', borderWidth: 1, borderColor: BORDER },
  expModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: BORDER },
  expModalTitle: { fontSize: 18, fontWeight: '600', color: TEXT_MAIN },
  expModalContent: { paddingHorizontal: 20, maxHeight: '70%' },
  expModalBtn: { backgroundColor: GREEN_DARK, paddingVertical: 14, borderRadius: 10, alignItems: 'center', margin: 20 },
  expModalBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },
  currentlyWorkingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: GREEN_DARK, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { fontSize: 12, color: TEXT_MUTED },
  reviewSectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, marginTop: 16, marginBottom: 12 },
  reviewSubTitle: { fontSize: 14, fontWeight: '600', color: GREEN_DARK, marginTop: 12, marginBottom: 8 },
  reviewCard: { backgroundColor: OFF_WHITE, borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  reviewLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  reviewValue: { fontSize: 12, color: TEXT_MAIN, flex: 1 },
  reviewExpTitle: { fontSize: 14, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
  reviewExpCompany: { fontSize: 12, color: TEXT_MUTED, marginBottom: 4 },
  reviewExpDate: { fontSize: 11, color: TEXT_LIGHT, marginBottom: 6 },
  reviewExpDesc: { fontSize: 12, color: TEXT_MUTED, marginTop: 6 },
  coverLetterInput: { backgroundColor: OFF_WHITE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8, borderWidth: 1, borderColor: BORDER, minHeight: 100, textAlignVertical: 'top' },
  nextStepBtn: { backgroundColor: GREEN_DARK, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  nextStepBtnText: { fontSize: 16, fontWeight: '600', color: WHITE },
  submitBtn: { backgroundColor: GREEN_DARK, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: WHITE },
  disabledBtn: { opacity: 0.6 },
  applyModalFooter: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: BORDER },

  // Existing CV Styles
  existingCVContainer: { marginBottom: 16, gap: 8 },
  existingCVOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: OFF_WHITE,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  existingCVOptionActive: { borderColor: GREEN_DARK, backgroundColor: GREEN_SOFT },
  existingCVInfo: { flex: 1 },
  existingCVName: { fontSize: 13, fontWeight: '500', color: TEXT_MAIN },
  existingCVSize: { fontSize: 10, color: TEXT_MUTED, marginTop: 2 },
  uploadNewText: { flex: 1, fontSize: 13, color: TEXT_MAIN },
  radioSelected: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});

// ── Bottom sheet styles ────────────────────────────────────────────────────
const sheet = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  container: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.88,
    paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center', marginBottom: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, marginBottom: 14, gap: 12,
  },
  companyLogo: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: GREEN_SOFT,
    borderWidth: 1, borderColor: GREEN_MID,
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  jobTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, lineHeight: 23, marginBottom: 3 },
  jobCompany: { fontSize: 13, color: TEXT_MUTED },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: OFF_WHITE,
    alignItems: 'center', justifyContent: 'center',
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB',
  },
  metaChipGreen: { backgroundColor: GREEN_SOFT, borderColor: GREEN_MID },
  metaText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20, marginBottom: 16 },
  body: { paddingHorizontal: 20 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: GREEN_DARK,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: GREEN_SOFT,
    borderRadius: 999, borderWidth: 1, borderColor: GREEN_MID,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  tagText: { fontSize: 12, color: GREEN_DARK, fontWeight: '600' },
  descText: { fontSize: 14, color: TEXT_MUTED, lineHeight: 22 },
  detailGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    backgroundColor: OFF_WHITE, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: BORDER,
  },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '45%' },
  detailLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '600' },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  saveBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: GREEN_SOFT,
    borderWidth: 1.5, borderColor: GREEN_MID,
    alignItems: 'center', justifyContent: 'center',
  },
  applyBtn: {
    flex: 1, height: 48, borderRadius: 14,
    backgroundColor: GREEN_DARK,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },
});