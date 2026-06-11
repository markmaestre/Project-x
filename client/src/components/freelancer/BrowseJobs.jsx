import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import { getFreelancerJobs, searchJobs } from '../../Redux/slices/jobSlice';
import { 
  applyForJob, 
  getFreelancerApplications, 
  saveJobForLater, 
  unsaveJob, 
  getSavedJobs 
} from '../../Redux/slices/applicationSlice';

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

const JOB_TYPES = ['All', 'full_time', 'part_time', 'contract', 'one_time'];
const WORK_SETUPS = ['All', 'remote', 'onsite', 'hybrid'];
const EXPERIENCE_LEVELS = ['All', 'Entry', 'Intermediate', 'Expert', 'Senior'];

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

// Map job category to Ionicons name + color
const getCategoryIcon = (job) => {
  const title = job.title?.toLowerCase() || '';
  if (title.includes('design') || title.includes('ui') || title.includes('ux'))
    return { name: 'color-palette-outline', color: '#8B5CF6' };
  if (title.includes('dev') || title.includes('developer') || title.includes('react') || title.includes('node'))
    return { name: 'code-slash-outline', color: BLUE };
  if (title.includes('write') || title.includes('content'))
    return { name: 'create-outline', color: '#F97316' };
  if (title.includes('market') || title.includes('seo'))
    return { name: 'bar-chart-outline', color: GREEN };
  return { name: 'briefcase-outline', color: GOLD_DK };
};

export default function BrowseJobs({ onNavigate, onBack }) {
  const dispatch = useDispatch();
  const { list: jobs, isLoading: jobsLoading } = useSelector((state) => state.jobs.jobs);
  const { user } = useSelector((state) => state.auth);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [selectedWorkSetup, setSelectedWorkSetup] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Application Form State
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  
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
  
  const [submitting, setSubmitting] = useState(false);
  
  const step1ScrollRef = useRef(null);
  const step2ScrollRef = useRef(null);
  const step3ScrollRef = useRef(null);

  const filterAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const fetchJobs = useCallback(async () => {
    try {
      await dispatch(getFreelancerJobs({ limit: 50 })).unwrap();
    } catch (error) {
      console.error('Error fetching jobs:', error);
      Alert.alert('Error', 'Failed to load jobs');
    }
  }, [dispatch]);

  const fetchApplications = useCallback(async () => {
    try {
      const result = await dispatch(getFreelancerApplications({})).unwrap();
      const appliedIds = result.applications.map(app => app.job_id._id);
      setAppliedJobIds(appliedIds);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, [dispatch]);

  const fetchSavedJobs = useCallback(async () => {
    try {
      const result = await dispatch(getSavedJobs()).unwrap();
      const savedIds = result.savedJobs.map(job => job._id);
      setSavedJobIds(savedIds);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchSavedJobs();
  }, [fetchJobs, fetchApplications, fetchSavedJobs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchJobs(), fetchApplications(), fetchSavedJobs()]);
    setRefreshing(false);
  }, [fetchJobs, fetchApplications, fetchSavedJobs]);

  const openFilters = () => {
    setShowFilters(true);
    Animated.parallel([
      Animated.spring(filterAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeFilters = () => {
    Animated.parallel([
      Animated.spring(filterAnim, { toValue: 300, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowFilters(false));
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        await dispatch(searchJobs({ searchTerm: searchQuery })).unwrap();
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      await fetchJobs();
    }
  };

  const handleApplyFilters = async () => {
    const filters = {};
    if (selectedJobType !== 'All') filters.job_type = selectedJobType;
    if (selectedWorkSetup !== 'All') filters.work_setup = selectedWorkSetup;
    if (selectedExperience !== 'All') filters.experience_level = selectedExperience;
    try {
      await dispatch(getFreelancerJobs(filters)).unwrap();
      closeFilters();
    } catch (error) {
      Alert.alert('Error', 'Failed to apply filters');
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      if (savedJobIds.includes(jobId)) {
        await dispatch(unsaveJob(jobId)).unwrap();
        setSavedJobIds(savedJobIds.filter(id => id !== jobId));
        Alert.alert('Removed', 'Job removed from saved list');
      } else {
        await dispatch(saveJobForLater(jobId)).unwrap();
        setSavedJobIds([...savedJobIds, jobId]);
        Alert.alert('Saved', 'Job saved for later');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      Alert.alert('Error', 'Failed to save job');
    }
  };

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });
      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        setResumeFile({ name: file.name, uri: file.uri, mimeType: file.mimeType, size: file.size });
      }
    } catch (error) {
      console.error('Error picking resume:', error);
      Alert.alert('Error', 'Failed to select resume file');
    }
  };

  const removeResume = () => setResumeFile(null);

  const addExperience = () => {
    if (!currentExperience.jobTitle.trim() || !currentExperience.companyName.trim()) {
      Alert.alert('Error', 'Please fill in job title and company name');
      return;
    }
    if (editingExperienceIndex !== null) {
      const updated = [...experiences];
      updated[editingExperienceIndex] = { ...currentExperience, id: Date.now().toString() };
      setExperiences(updated);
      setEditingExperienceIndex(null);
    } else {
      setExperiences([...experiences, { ...currentExperience, id: Date.now().toString() }]);
    }
    setCurrentExperience({ jobTitle: '', companyName: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
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
        if (editingExperienceIndex === index) {
          setCurrentExperience({ jobTitle: '', companyName: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
          setEditingExperienceIndex(null);
          setShowExperienceForm(false);
        }
      }}
    ]);
  };

  const validateStep1 = () => {
    if (!resumeFile) { Alert.alert('Required', 'Please upload your resume/CV'); return false; }
    if (!educationLevel) { Alert.alert('Required', 'Please select your highest education level'); return false; }
    if (!fieldOfStudy.trim()) { Alert.alert('Required', 'Please enter your field of study'); return false; }
    if (!institutionName.trim()) { Alert.alert('Required', 'Please enter your institution name'); return false; }
    return true;
  };

  const validateStep2 = () => true;

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setTimeout(() => step2ScrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      setTimeout(() => step3ScrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const resetApplicationForm = () => {
    setCurrentStep(1);
    setCoverLetter('');
    setProposedRate('');
    setResumeFile(null);
    setEducationLevel('');
    setFieldOfStudy('');
    setInstitutionName('');
    setGraduationYear('');
    setExperiences([]);
    setCurrentExperience({ jobTitle: '', companyName: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
    setShowExperienceForm(false);
    setEditingExperienceIndex(null);
  };

  const submitApplication = async () => {
    if (appliedJobIds.includes(selectedJob._id)) {
      Alert.alert('Already Applied', 'You have already applied for this position.');
      return;
    }
    setSubmitting(true);
    try {
      const applicationData = {
        job_id: selectedJob._id,
        cover_letter: coverLetter.trim() || "I'm interested in this position.",
        proposed_rate: proposedRate ? parseFloat(proposedRate) : null,
        resume: resumeFile,
        education: { level: educationLevel, field_of_study: fieldOfStudy, institution: institutionName, graduation_year: graduationYear },
        experiences: experiences.map(exp => ({
          job_title: exp.jobTitle,
          company_name: exp.companyName,
          start_date: exp.startDate,
          end_date: exp.currentlyWorking ? null : exp.endDate,
          currently_working: exp.currentlyWorking,
          description: exp.description,
        })),
      };
      await dispatch(applyForJob(applicationData)).unwrap();
      setAppliedJobIds([...appliedJobIds, selectedJob._id]);
      Alert.alert(
        'Application Submitted!',
        `Your application for ${selectedJob.title} has been sent successfully.`,
        [{ text: 'OK', onPress: () => { setShowApplyModal(false); resetApplicationForm(); fetchJobs(); } }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyJob = (job) => {
    setSelectedJob(job);
    setProposedRate(job.budget_amount?.toString() || '');
    setCoverLetter('');
    resetApplicationForm();
    setShowApplyModal(true);
  };

  const getFilteredJobs = () => {
    let filtered = jobs || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q) ||
        j.required_skills?.some(s => s.toLowerCase().includes(q))
      );
    }
    return filtered;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const getWorkSetupLabel = (setup) => ({ remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' }[setup] || setup);
  const getJobTypeLabel = (type) => ({ full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', one_time: 'One-time' }[type] || type);

  // ── Step Indicator ────────────────────────────────────────────────────────────
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step, index) => (
        <React.Fragment key={step}>
          <View style={[styles.stepDot, currentStep >= step && styles.stepDotActive]}>
            {currentStep > step
              ? <Ionicons name="checkmark" size={14} color={WHITE} />
              : <Text style={[styles.stepDotText, currentStep >= step && styles.stepDotTextActive]}>{step}</Text>
            }
          </View>
          {index < 2 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  // ── Step 1: Resume & Education ─────────────────────────────────────────────────
  const renderStep1 = () => (
    <ScrollView ref={step1ScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.applyLabel}>Upload Resume/CV *</Text>
      {!resumeFile ? (
        <TouchableOpacity style={styles.uploadBtn} onPress={pickResume}>
          <Ionicons name="cloud-upload-outline" size={28} color={BLUE} />
          <Text style={styles.uploadBtnText}>Upload your resume (PDF, DOC, DOCX)</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.fileInfo}>
          <Ionicons name="document-text-outline" size={20} color={BLUE} />
          <Text style={styles.fileName} numberOfLines={1}>{resumeFile.name}</Text>
          <TouchableOpacity onPress={removeResume} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={20} color="#f87171" />
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.applyLabel}>Highest Level of Education *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.educationScroll}>
        {EDUCATION_LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.educationChip, educationLevel === level && styles.educationChipActive]}
            onPress={() => setEducationLevel(level)}
          >
            <Text style={[styles.educationChipText, educationLevel === level && styles.educationChipTextActive]}>{level}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.applyLabel}>Field of Study *</Text>
      <TextInput style={styles.applyInput} placeholder="e.g., Computer Science" placeholderTextColor={TEXT_LIGHT} value={fieldOfStudy} onChangeText={setFieldOfStudy} />

      <Text style={styles.applyLabel}>Institution Name *</Text>
      <TextInput style={styles.applyInput} placeholder="e.g., University of Technology" placeholderTextColor={TEXT_LIGHT} value={institutionName} onChangeText={setInstitutionName} />

      <Text style={styles.applyLabel}>Graduation Year (Optional)</Text>
      <TextInput style={styles.applyInput} placeholder="e.g., 2020" placeholderTextColor={TEXT_LIGHT} value={graduationYear} onChangeText={setGraduationYear} keyboardType="numeric" />
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  // ── Step 2: Work Experience ────────────────────────────────────────────────────
  const renderStep2 = () => (
    <ScrollView ref={step2ScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <View style={styles.experienceHeader}>
        <Text style={styles.applyLabel}>Work Experience (Optional)</Text>
        <TouchableOpacity style={styles.addExperienceBtn} onPress={() => setShowExperienceForm(true)}>
          <Ionicons name="add-circle" size={18} color={BLUE} />
          <Text style={styles.addExperienceText}>Add</Text>
        </TouchableOpacity>
      </View>

      {experiences.length === 0 ? (
        <View style={styles.noExperience}>
          <Ionicons name="briefcase-outline" size={36} color={TEXT_LIGHT} />
          <Text style={styles.noExperienceText}>No experience added yet</Text>
          <Text style={styles.noExperienceSub}>Tap "Add" to showcase your work history</Text>
        </View>
      ) : (
        experiences.map((exp, index) => (
          <View key={exp.id || index} style={styles.experienceCard}>
            <View style={styles.experienceCardHeader}>
              <View style={styles.experienceCardTitle}>
                <Ionicons name="briefcase-outline" size={15} color={BLUE} />
                <Text style={styles.experienceJobTitle}>{exp.jobTitle}</Text>
              </View>
              <View style={styles.experienceCardActions}>
                <TouchableOpacity onPress={() => editExperience(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="pencil-outline" size={16} color={TEXT_MUTED} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeExperience(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={16} color="#f87171" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.experienceCompany}>{exp.companyName}</Text>
            <Text style={styles.experienceDate}>
              {exp.startDate || 'Start date'} – {exp.currentlyWorking ? 'Present' : (exp.endDate || 'End date')}
            </Text>
            {exp.description ? <Text style={styles.experienceDesc} numberOfLines={2}>{exp.description}</Text> : null}
          </View>
        ))
      )}
      <View style={{ height: 20 }} />

      <Modal visible={showExperienceForm} animationType="slide" transparent onRequestClose={() => setShowExperienceForm(false)}>
        <View style={styles.expModalWrap}>
          <View style={styles.expModalSheet}>
            <View style={styles.expModalHeader}>
              <Text style={styles.expModalTitle}>{editingExperienceIndex !== null ? 'Edit Experience' : 'Add Experience'}</Text>
              <TouchableOpacity onPress={() => {
                setShowExperienceForm(false);
                setEditingExperienceIndex(null);
                setCurrentExperience({ jobTitle: '', companyName: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
              }}>
                <Ionicons name="close" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.expModalContent}>
              <Text style={styles.applyLabel}>Job Title *</Text>
              <TextInput style={styles.applyInput} placeholder="e.g., Senior Developer" placeholderTextColor={TEXT_LIGHT} value={currentExperience.jobTitle} onChangeText={(text) => setCurrentExperience({...currentExperience, jobTitle: text})} />
              <Text style={styles.applyLabel}>Company Name *</Text>
              <TextInput style={styles.applyInput} placeholder="e.g., Google" placeholderTextColor={TEXT_LIGHT} value={currentExperience.companyName} onChangeText={(text) => setCurrentExperience({...currentExperience, companyName: text})} />
              <Text style={styles.applyLabel}>Start Date</Text>
              <TextInput style={styles.applyInput} placeholder="e.g., Jan 2020" placeholderTextColor={TEXT_LIGHT} value={currentExperience.startDate} onChangeText={(text) => setCurrentExperience({...currentExperience, startDate: text})} />
              <TouchableOpacity style={styles.currentlyWorkingRow} onPress={() => setCurrentExperience({...currentExperience, currentlyWorking: !currentExperience.currentlyWorking})}>
                <View style={styles.checkbox}>
                  {currentExperience.currentlyWorking && <Ionicons name="checkmark" size={13} color={BLUE} />}
                </View>
                <Text style={styles.checkboxLabel}>I currently work here</Text>
              </TouchableOpacity>
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
    </ScrollView>
  );

  // ── Step 3: Review & Submit ────────────────────────────────────────────────────
  const renderStep3 = () => (
    <ScrollView ref={step3ScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.reviewSectionTitle}>Job Details</Text>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewJobTitle}>{selectedJob?.title}</Text>
        <Text style={styles.reviewCompany}>{selectedJob?.client_id?.company_name || 'Client'}</Text>
        <Text style={styles.reviewSalary}>
          {selectedJob?.budget_type === 'hourly' ? `₱${selectedJob?.budget_amount}/hr` : `₱${selectedJob?.budget_amount?.toLocaleString()}`}
        </Text>
      </View>

      <Text style={styles.reviewSectionTitle}>Resume & Education</Text>
      <View style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <Ionicons name="document-text-outline" size={15} color={BLUE} />
          <Text style={styles.reviewLabel}>Resume:</Text>
          <Text style={styles.reviewValue}>{resumeFile?.name || 'Not uploaded'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Ionicons name="school-outline" size={15} color={BLUE} />
          <Text style={styles.reviewLabel}>Education:</Text>
          <Text style={styles.reviewValue}>{educationLevel} in {fieldOfStudy}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Ionicons name="business-outline" size={15} color={BLUE} />
          <Text style={styles.reviewLabel}>Institution:</Text>
          <Text style={styles.reviewValue}>{institutionName}</Text>
        </View>
        {graduationYear && (
          <View style={styles.reviewRow}>
            <Ionicons name="calendar-outline" size={15} color={BLUE} />
            <Text style={styles.reviewLabel}>Graduation Year:</Text>
            <Text style={styles.reviewValue}>{graduationYear}</Text>
          </View>
        )}
      </View>

      {experiences.length > 0 && (
        <>
          <Text style={styles.reviewSectionTitle}>Work Experience</Text>
          {experiences.map((exp, index) => (
            <View key={index} style={styles.reviewCard}>
              <Text style={styles.reviewExpTitle}>{exp.jobTitle}</Text>
              <Text style={styles.reviewExpCompany}>{exp.companyName}</Text>
              <Text style={styles.reviewExpDate}>{exp.startDate || 'Start date'} – {exp.currentlyWorking ? 'Present' : (exp.endDate || 'End date')}</Text>
              {exp.description && <Text style={styles.reviewExpDesc}>{exp.description}</Text>}
            </View>
          ))}
        </>
      )}

      <Text style={styles.reviewSectionTitle}>Cover Letter & Rate (Optional)</Text>
      <View style={styles.reviewCard}>
        {proposedRate && (
          <View style={styles.reviewRow}>
            <Ionicons name="cash-outline" size={15} color={GOLD_DK} />
            <Text style={styles.reviewLabel}>Proposed Rate:</Text>
            <Text style={styles.reviewValue}>₱{parseFloat(proposedRate).toLocaleString()}</Text>
          </View>
        )}
        <TextInput
          style={[styles.reviewCoverLetter, styles.coverLetterInput]}
          placeholder="Write your cover letter here (optional)..."
          placeholderTextColor={TEXT_LIGHT}
          value={coverLetter}
          onChangeText={setCoverLetter}
          multiline
          numberOfLines={4}
        />
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  // ── Job Card ──────────────────────────────────────────────────────────────────
  const JobCard = ({ job }) => {
    const isUrgent = job.urgency_level === 'urgent';
    const hasApplied = appliedJobIds.includes(job._id);
    const isSaved = savedJobIds.includes(job._id);
    const catIcon = getCategoryIcon(job);

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => { setSelectedJob(job); setShowJobModal(true); }}
        activeOpacity={0.85}
      >
        {isUrgent && (
          <View style={styles.badgeRow}>
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={10} color="#ff6b6b" />
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          </View>
        )}

        {/* Header */}
        <View style={styles.jobHeader}>
          {/* Category icon replacing emoji */}
          <View style={[styles.companyLogo, { backgroundColor: `${catIcon.color}12`, borderColor: `${catIcon.color}30` }]}>
            <Ionicons name={catIcon.name} size={22} color={catIcon.color} />
          </View>
          <View style={styles.jobHeaderInfo}>
            <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
            <Text style={styles.companyName}>{job.client_id?.company_name || 'Client'}</Text>
          </View>
          <TouchableOpacity
            style={styles.saveIconBtn}
            onPress={() => handleSaveJob(job._id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? BLUE : TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        {/* Meta chips */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="location-outline" size={12} color={TEXT_MUTED} />
            <Text style={styles.metaText}>{getWorkSetupLabel(job.work_setup)}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="briefcase-outline" size={12} color={TEXT_MUTED} />
            <Text style={styles.metaText}>{getJobTypeLabel(job.job_type)}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color={TEXT_MUTED} />
            <Text style={styles.metaText}>{formatDate(job.created_at)}</Text>
          </View>
        </View>

        <Text style={styles.salary}>
          {job.budget_type === 'hourly' ? `₱${job.budget_amount}/hr` : `₱${job.budget_amount?.toLocaleString()}`}
        </Text>

        {job.required_skills && job.required_skills.length > 0 && (
          <View style={styles.skillsRow}>
            {job.required_skills.slice(0, 3).map((s, i) => (
              <View key={i} style={styles.skillBadge}><Text style={styles.skillText}>{s}</Text></View>
            ))}
            {job.required_skills.length > 3 && (
              <View style={styles.skillBadge}><Text style={styles.skillText}>+{job.required_skills.length - 3}</Text></View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.applyBtn, hasApplied && styles.appliedBtn]}
          onPress={() => handleApplyJob(job)}
          disabled={hasApplied}
        >
          {hasApplied
            ? <><Ionicons name="checkmark-circle-outline" size={15} color={BLUE} /><Text style={[styles.applyBtnText, styles.appliedBtnText]}>Applied</Text></>
            : <Text style={styles.applyBtnText}>Apply Now</Text>
          }
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const filtered = getFilteredJobs();

  if (jobsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconWrap} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Browse Jobs</Text>
          <TouchableOpacity style={styles.iconWrap} onPress={() => onNavigate('MyApplications')}>
            <Ionicons name="document-text-outline" size={18} color={WHITE} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.root}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconWrap} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Browse Jobs</Text>
          <TouchableOpacity style={styles.iconWrap} onPress={() => onNavigate('MyApplications')}>
            <Ionicons name="document-text-outline" size={18} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={TEXT_MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            placeholderTextColor={TEXT_LIGHT}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchJobs(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filter row ── */}
        <View style={styles.filterRow}>
          <Text style={styles.resultsLabel}>{filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} found</Text>
          <TouchableOpacity style={styles.filterBtn} onPress={openFilters}>
            <Ionicons name="options-outline" size={15} color={BLUE} />
            <Text style={styles.filterBtnText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* ── Job List ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        >
          {filtered.length > 0
            ? filtered.map((job) => <JobCard key={job._id} job={job} />)
            : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="briefcase-outline" size={44} color={BLUE} />
                </View>
                <Text style={styles.emptyTitle}>No jobs found</Text>
                <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
              </View>
            )
          }
        </ScrollView>

        {/* ── Filter Drawer ── */}
        {showFilters && (
          <TouchableWithoutFeedback onPress={closeFilters}>
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>
        )}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: filterAnim }] }]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Filters</Text>
            <TouchableOpacity onPress={closeFilters}>
              <Ionicons name="close" size={22} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <Text style={styles.drawerSection}>Job Type</Text>
            <View style={styles.drawerChips}>
              {JOB_TYPES.map((type) => (
                <TouchableOpacity key={type} style={[styles.drawerChip, selectedJobType === type && styles.drawerChipActive]} onPress={() => setSelectedJobType(type)}>
                  <Text style={[styles.drawerChipText, selectedJobType === type && styles.drawerChipTextActive]}>{type === 'All' ? 'All' : getJobTypeLabel(type)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.drawerSection}>Work Setup</Text>
            <View style={styles.drawerChips}>
              {WORK_SETUPS.map((setup) => (
                <TouchableOpacity key={setup} style={[styles.drawerChip, selectedWorkSetup === setup && styles.drawerChipActive]} onPress={() => setSelectedWorkSetup(setup)}>
                  <Text style={[styles.drawerChipText, selectedWorkSetup === setup && styles.drawerChipTextActive]}>{setup === 'All' ? 'All' : getWorkSetupLabel(setup)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.drawerSection}>Experience Level</Text>
            <View style={styles.drawerChips}>
              {EXPERIENCE_LEVELS.map((level) => (
                <TouchableOpacity key={level} style={[styles.drawerChip, selectedExperience === level && styles.drawerChipActive]} onPress={() => setSelectedExperience(level)}>
                  <Text style={[styles.drawerChipText, selectedExperience === level && styles.drawerChipTextActive]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.drawerApplyBtn} onPress={handleApplyFilters}>
            <Text style={styles.drawerApplyText}>Apply Filters</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Job Detail Modal ── */}
        <Modal visible={showJobModal} animationType="slide" transparent onRequestClose={() => setShowJobModal(false)}>
          <View style={styles.modalWrap}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowJobModal(false)}>
                <Ionicons name="close" size={16} color={TEXT_MUTED} />
              </TouchableOpacity>
              {selectedJob && (() => {
                const catIcon = getCategoryIcon(selectedJob);
                return (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.modalHeader}>
                      <View style={[styles.modalLogo, { backgroundColor: `${catIcon.color}12`, borderColor: `${catIcon.color}30` }]}>
                        <Ionicons name={catIcon.name} size={24} color={catIcon.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalTitle}>{selectedJob.title}</Text>
                        <Text style={styles.modalCompany}>{selectedJob.client_id?.company_name || 'Client'}</Text>
                      </View>
                      <TouchableOpacity style={styles.modalSaveBtn} onPress={() => handleSaveJob(selectedJob._id)}>
                        <Ionicons name={savedJobIds.includes(selectedJob._id) ? 'bookmark' : 'bookmark-outline'} size={22} color={savedJobIds.includes(selectedJob._id) ? BLUE : TEXT_MUTED} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.modalMeta}>
                      {[
                        { icon: 'location-outline', label: getWorkSetupLabel(selectedJob.work_setup) },
                        { icon: 'briefcase-outline', label: getJobTypeLabel(selectedJob.job_type) },
                        { icon: 'time-outline', label: formatDate(selectedJob.created_at) },
                        { icon: 'people-outline', label: `${selectedJob.total_applicants || 0} applicants` },
                      ].map(({ icon, label }) => (
                        <View key={label} style={styles.modalMetaItem}>
                          <Ionicons name={icon} size={13} color={TEXT_MUTED} />
                          <Text style={styles.modalMetaText}>{label}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.modalSalary}>
                      {selectedJob.budget_type === 'hourly' ? `₱${selectedJob.budget_amount}/hr` : `₱${selectedJob.budget_amount?.toLocaleString()}`}
                    </Text>
                    <Text style={styles.modalSection}>Description</Text>
                    <Text style={styles.modalDesc}>{selectedJob.description}</Text>
                    {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                      <>
                        <Text style={styles.modalSection}>Required Skills</Text>
                        <View style={styles.modalSkills}>
                          {selectedJob.required_skills.map((s, i) => (
                            <View key={i} style={styles.modalSkillBadge}><Text style={styles.modalSkillText}>{s}</Text></View>
                          ))}
                        </View>
                      </>
                    )}
                    <TouchableOpacity
                      style={[styles.modalApplyBtn, appliedJobIds.includes(selectedJob._id) && styles.modalAppliedBtn]}
                      onPress={() => { setShowJobModal(false); handleApplyJob(selectedJob); }}
                      disabled={appliedJobIds.includes(selectedJob._id)}
                    >
                      <Text style={[styles.modalApplyText, appliedJobIds.includes(selectedJob._id) && { color: BLUE }]}>
                        {appliedJobIds.includes(selectedJob._id) ? 'Already Applied' : 'Apply Now'}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </Modal>

        {/* ── Multi-step Apply Modal ── */}
        <Modal
          visible={showApplyModal}
          animationType="slide"
          transparent
          onRequestClose={() => {
            if (!submitting) {
              Alert.alert('Exit Application', 'Are you sure you want to exit?', [
                { text: 'Continue', style: 'cancel' },
                { text: 'Exit', style: 'destructive', onPress: () => { setShowApplyModal(false); resetApplicationForm(); } }
              ]);
            }
          }}
        >
          <View style={styles.applyModalWrap}>
            <View style={styles.applyModalSheet}>
              {/* Apply modal header */}
              <View style={styles.applyModalHeader}>
                <TouchableOpacity
                  onPress={handlePrevStep}
                  disabled={currentStep === 1}
                  style={styles.applyModalNavBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="arrow-back" size={22} color={currentStep === 1 ? TEXT_LIGHT : TEXT_MAIN} />
                </TouchableOpacity>
                <Text style={styles.applyModalTitle}>Apply for Job</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!submitting) {
                      Alert.alert('Exit Application', 'Are you sure?', [
                        { text: 'Continue', style: 'cancel' },
                        { text: 'Exit', style: 'destructive', onPress: () => { setShowApplyModal(false); resetApplicationForm(); } }
                      ]);
                    }
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={22} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>

              {renderStepIndicator()}

              <View style={styles.applyModalContentWrapper}>
                {selectedJob && (
                  <>
                    <View style={styles.jobInfoHeader}>
                      <Text style={styles.applyJobTitle}>{selectedJob.title}</Text>
                      <Text style={styles.applyJobCompany}>{selectedJob.client_id?.company_name || 'Client'}</Text>
                    </View>
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                  </>
                )}
              </View>

              <View style={styles.applyModalFooter}>
                {currentStep < 3 ? (
                  <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                    <Text style={styles.nextStepBtnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={17} color={WHITE} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabledBtn]} onPress={submitApplication} disabled={submitting}>
                    {submitting
                      ? <ActivityIndicator size="small" color={WHITE} />
                      : <Text style={styles.submitBtnText}>Submit Application</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: BG },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: NAVY,
    minHeight: 56,
  },
  iconWrap: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: -0.2,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  loadingText: { marginTop: 12, fontSize: 14, color: TEXT_MUTED },

  // ── Search ──────────────────────────────────────────────────────────────────
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CARD,
    marginHorizontal: 14,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, color: TEXT_MAIN, fontSize: 13 },

  // ── Filter row ──────────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  resultsLabel: { fontSize: 12, color: TEXT_MUTED },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${BLUE}0D`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: `${BLUE}30`,
  },
  filterBtnText: { fontSize: 12, color: BLUE, fontWeight: '600' },

  // ── List ────────────────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: 14, paddingBottom: 28, paddingTop: 4, gap: 12 },

  // ── Job Card ─────────────────────────────────────────────────────────────────
  jobCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,107,107,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgentText: { fontSize: 10, color: '#ff6b6b', fontWeight: '700' },
  jobHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  companyLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1.5,
  },
  jobHeaderInfo: { flex: 1, minWidth: 0 },
  saveIconBtn: { padding: 2, marginLeft: 4, alignSelf: 'center' },
  jobTitle: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN, marginBottom: 3, lineHeight: 19 },
  companyName: { fontSize: 12, color: TEXT_MUTED },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: TEXT_MUTED },
  salary: { fontSize: 14, fontWeight: '700', color: GOLD_DK, marginBottom: 10 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillBadge: { backgroundColor: `${BLUE}0D`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: `${BLUE}25` },
  skillText: { fontSize: 11, color: BLUE, fontWeight: '500' },
  applyBtn: {
    backgroundColor: BLUE,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  appliedBtn: { backgroundColor: `${BLUE}12`, borderWidth: 1.5, borderColor: BLUE, shadowOpacity: 0 },
  applyBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },
  appliedBtnText: { color: BLUE },

  // ── Empty State ──────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: { width: 80, height: 80, backgroundColor: `${BLUE}0D`, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, color: TEXT_MUTED, fontWeight: '600' },
  emptySub: { fontSize: 12, color: TEXT_LIGHT, marginTop: 6 },

  // ── Filter Drawer ────────────────────────────────────────────────────────────
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,26,62,0.55)', zIndex: 99 },
  drawer: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 280, backgroundColor: CARD, borderLeftWidth: 1.5, borderLeftColor: BORDER, zIndex: 100, padding: 18, paddingTop: 22 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  drawerTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN },
  drawerSection: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  drawerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  drawerChip: { backgroundColor: BG, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: BORDER },
  drawerChipActive: { backgroundColor: `${BLUE}0D`, borderColor: BLUE },
  drawerChipText: { fontSize: 12, color: TEXT_MUTED },
  drawerChipTextActive: { color: BLUE, fontWeight: '600' },
  drawerApplyBtn: { backgroundColor: BLUE, paddingVertical: 13, borderRadius: 10, alignItems: 'center', marginTop: 18, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 2 },
  drawerApplyText: { fontSize: 14, fontWeight: '700', color: WHITE },

  // ── Job Detail Modal ─────────────────────────────────────────────────────────
  modalWrap: { flex: 1, backgroundColor: 'rgba(7,26,62,0.85)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: '88%', borderTopWidth: 1.5, borderColor: BORDER },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 14 },
  modalCloseBtn: { position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 14, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', zIndex: 1, borderWidth: 1.5, borderColor: BORDER },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14, marginTop: 4 },
  modalLogo: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 1.5 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN, marginBottom: 3, flex: 1 },
  modalCompany: { fontSize: 13, color: TEXT_MUTED },
  modalSaveBtn: { padding: 6, marginLeft: 4 },
  modalMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  modalMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalMetaText: { fontSize: 12, color: TEXT_MUTED },
  modalSalary: { fontSize: 18, fontWeight: '700', color: GOLD_DK, marginBottom: 16 },
  modalSection: { fontSize: 13, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6, marginTop: 14 },
  modalDesc: { fontSize: 13, color: TEXT_MUTED, lineHeight: 20 },
  modalSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  modalSkillBadge: { backgroundColor: `${BLUE}0D`, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 7, borderWidth: 1.5, borderColor: `${BLUE}25` },
  modalSkillText: { fontSize: 12, color: BLUE, fontWeight: '500' },
  modalApplyBtn: { backgroundColor: BLUE, paddingVertical: 13, borderRadius: 10, alignItems: 'center', marginBottom: 14, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 2 },
  modalAppliedBtn: { backgroundColor: `${BLUE}12`, borderWidth: 1.5, borderColor: BLUE, shadowOpacity: 0 },
  modalApplyText: { fontSize: 14, fontWeight: '700', color: WHITE },

  // ── Apply Modal ──────────────────────────────────────────────────────────────
  applyModalWrap: { flex: 1, backgroundColor: 'rgba(7,26,62,0.95)', justifyContent: 'flex-end' },
  applyModalSheet: { backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%' },
  applyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  applyModalNavBtn: { width: 32, alignItems: 'flex-start' },
  applyModalTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN },
  applyModalContentWrapper: { flex: 1 },
  jobInfoHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: BORDER },

  // ── Step Indicator ───────────────────────────────────────────────────────────
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: CARD,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  stepDotActive: { backgroundColor: BLUE, borderColor: BLUE },
  stepDotText: { fontSize: 13, fontWeight: '700', color: TEXT_MUTED },
  stepDotTextActive: { color: WHITE },
  stepLine: { width: 40, height: 2, backgroundColor: BORDER, marginHorizontal: 6 },
  stepLineActive: { backgroundColor: BLUE },

  // ── Step Content ─────────────────────────────────────────────────────────────
  stepContent: { paddingHorizontal: 20, paddingBottom: 30 },
  applyJobTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  applyJobCompany: { fontSize: 12, color: TEXT_MUTED },
  applyLabel: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  applyInput: {
    backgroundColor: BG,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TEXT_MAIN,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  applyTextArea: { height: 100, textAlignVertical: 'top' },
  uploadBtn: {
    backgroundColor: BG,
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderStyle: 'dashed',
  },
  uploadBtnText: { fontSize: 12, color: BLUE, marginTop: 8, fontWeight: '500' },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BG,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  fileName: { flex: 1, fontSize: 12, color: TEXT_MAIN },
  educationScroll: { flexDirection: 'row', marginTop: 4 },
  educationChip: { backgroundColor: BG, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, marginRight: 8, borderWidth: 1.5, borderColor: BORDER },
  educationChipActive: { backgroundColor: `${BLUE}0D`, borderColor: BLUE },
  educationChipText: { fontSize: 12, color: TEXT_MUTED },
  educationChipTextActive: { color: BLUE, fontWeight: '600' },

  // ── Experience ───────────────────────────────────────────────────────────────
  experienceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  addExperienceBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${BLUE}0D`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: `${BLUE}25` },
  addExperienceText: { fontSize: 12, color: BLUE, fontWeight: '600' },
  noExperience: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  noExperienceText: { fontSize: 14, color: TEXT_MUTED, marginTop: 10 },
  noExperienceSub: { fontSize: 11, color: TEXT_LIGHT, marginTop: 4, textAlign: 'center' },
  experienceCard: { backgroundColor: BG, borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1.5, borderColor: BORDER },
  experienceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  experienceCardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  experienceJobTitle: { fontSize: 13, fontWeight: '600', color: TEXT_MAIN, flex: 1 },
  experienceCardActions: { flexDirection: 'row', gap: 14 },
  experienceCompany: { fontSize: 12, color: TEXT_MUTED, marginBottom: 3 },
  experienceDate: { fontSize: 11, color: TEXT_LIGHT, marginBottom: 5 },
  experienceDesc: { fontSize: 11, color: TEXT_MUTED },
  currentlyWorkingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { fontSize: 13, color: TEXT_MUTED },

  // ── Experience Modal ─────────────────────────────────────────────────────────
  expModalWrap: { flex: 1, backgroundColor: 'rgba(7,26,62,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  expModalSheet: { backgroundColor: CARD, borderRadius: 16, width: '100%', maxHeight: '80%', borderWidth: 1.5, borderColor: BORDER },
  expModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  expModalTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN },
  expModalContent: { paddingHorizontal: 20, maxHeight: '70%' },
  expModalBtn: { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 10, alignItems: 'center', margin: 20, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 2 },
  expModalBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },

  // ── Review (Step 3) ──────────────────────────────────────────────────────────
  reviewSectionTitle: { fontSize: 13, fontWeight: '700', color: BLUE, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewCard: { backgroundColor: BG, borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: BORDER },
  reviewJobTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, marginBottom: 4 },
  reviewCompany: { fontSize: 13, color: TEXT_MUTED, marginBottom: 6 },
  reviewSalary: { fontSize: 14, fontWeight: '600', color: GOLD_DK },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 8, flexWrap: 'wrap' },
  reviewLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600' },
  reviewValue: { fontSize: 12, color: TEXT_MAIN, flex: 1 },
  reviewExpTitle: { fontSize: 13, fontWeight: '700', color: TEXT_MAIN, marginBottom: 2 },
  reviewExpCompany: { fontSize: 12, color: TEXT_MUTED, marginBottom: 3 },
  reviewExpDate: { fontSize: 11, color: TEXT_LIGHT, marginBottom: 5 },
  reviewExpDesc: { fontSize: 12, color: TEXT_MUTED, marginTop: 4 },
  reviewCoverLetter: { fontSize: 13, color: TEXT_MUTED, lineHeight: 18, marginTop: 8 },
  coverLetterInput: { backgroundColor: CARD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8, borderWidth: 1.5, borderColor: BORDER },

  // ── Footer buttons ───────────────────────────────────────────────────────────
  applyModalFooter: { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1.5, borderTopColor: BORDER },
  nextStepBtn: { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 2 },
  nextStepBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },
  submitBtn: { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 10, alignItems: 'center', shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 2 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },
  disabledBtn: { opacity: 0.6 },
});