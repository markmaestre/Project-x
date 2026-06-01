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

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.08)';
const INPUT_BG = '#1c1c1c';

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
  
  // Refs for scrolling
  const step1ScrollRef = useRef(null);
  const step2ScrollRef = useRef(null);
  const step3ScrollRef = useRef(null);

  const filterAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Fetch jobs on mount
  const fetchJobs = useCallback(async () => {
    try {
      await dispatch(getFreelancerJobs({ limit: 50 })).unwrap();
    } catch (error) {
      console.error('Error fetching jobs:', error);
      Alert.alert('Error', 'Failed to load jobs');
    }
  }, [dispatch]);

  // Fetch freelancer's applications
  const fetchApplications = useCallback(async () => {
    try {
      const result = await dispatch(getFreelancerApplications({})).unwrap();
      const appliedIds = result.applications.map(app => app.job_id._id);
      setAppliedJobIds(appliedIds);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, [dispatch]);

  // Fetch saved jobs
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

  // Save job for later
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

  // Pick resume file
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
      }
    } catch (error) {
      console.error('Error picking resume:', error);
      Alert.alert('Error', 'Failed to select resume file');
    }
  };

  // Remove resume
  const removeResume = () => {
    setResumeFile(null);
  };

  // Add experience
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

  // Edit experience
  const editExperience = (index) => {
    setCurrentExperience(experiences[index]);
    setEditingExperienceIndex(index);
    setShowExperienceForm(true);
  };

  // Remove experience
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

  // Validate step 1
  const validateStep1 = () => {
    if (!resumeFile) {
      Alert.alert('Required', 'Please upload your resume/CV');
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

  const validateStep2 = () => true;

  // Next step handler
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
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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
    setCurrentExperience({
      jobTitle: '',
      companyName: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      description: '',
    });
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
        education: {
          level: educationLevel,
          field_of_study: fieldOfStudy,
          institution: institutionName,
          graduation_year: graduationYear,
        },
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
        [{ text: 'OK', onPress: () => {
          setShowApplyModal(false);
          resetApplicationForm();
          fetchJobs();
        }}]
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
      filtered = filtered.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q) ||
          j.required_skills?.some((s) => s.toLowerCase().includes(q))
      );
    }
    return filtered;
  };

  const getCategoryIcon = (job) => {
    const title = job.title?.toLowerCase() || '';
    if (title.includes('design') || title.includes('ui') || title.includes('ux')) return '🎨';
    if (title.includes('dev') || title.includes('developer') || title.includes('react') || title.includes('node')) return '💻';
    if (title.includes('write') || title.includes('content')) return '✍️';
    if (title.includes('market') || title.includes('seo')) return '📊';
    return '💼';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const getWorkSetupLabel = (setup) => {
    const labels = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' };
    return labels[setup] || setup;
  };

  const getJobTypeLabel = (type) => {
    const labels = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', one_time: 'One-time' };
    return labels[type] || type;
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

  const renderStep1 = () => (
    <ScrollView ref={step1ScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.applyLabel}>Upload Resume/CV *</Text>
      {!resumeFile ? (
        <TouchableOpacity style={styles.uploadBtn} onPress={pickResume}>
          <Ionicons name="cloud-upload-outline" size={24} color={GOLD} />
          <Text style={styles.uploadBtnText}>Upload your resume (PDF, DOC, DOCX)</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.fileInfo}>
          <Ionicons name="document-text-outline" size={20} color={GOLD} />
          <Text style={styles.fileName} numberOfLines={1}>{resumeFile.name}</Text>
          <TouchableOpacity onPress={removeResume}>
            <Ionicons name="close-circle" size={20} color="#f87171" />
          </TouchableOpacity>
        </View>
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
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={fieldOfStudy}
        onChangeText={setFieldOfStudy}
      />

      <Text style={styles.applyLabel}>Institution Name *</Text>
      <TextInput
        style={styles.applyInput}
        placeholder="e.g., University of Technology"
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={institutionName}
        onChangeText={setInstitutionName}
      />

      <Text style={styles.applyLabel}>Graduation Year (Optional)</Text>
      <TextInput
        style={styles.applyInput}
        placeholder="e.g., 2020"
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={graduationYear}
        onChangeText={setGraduationYear}
        keyboardType="numeric"
      />
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView ref={step2ScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <View style={styles.experienceHeader}>
        <Text style={styles.applyLabel}>Work Experience (Optional)</Text>
        <TouchableOpacity style={styles.addExperienceBtn} onPress={() => setShowExperienceForm(true)}>
          <Ionicons name="add-circle" size={20} color={GOLD} />
          <Text style={styles.addExperienceText}>Add Experience</Text>
        </TouchableOpacity>
      </View>

      {experiences.length === 0 ? (
        <View style={styles.noExperience}>
          <Ionicons name="briefcase-outline" size={32} color="rgba(255,255,255,0.2)" />
          <Text style={styles.noExperienceText}>No experience added yet</Text>
          <Text style={styles.noExperienceSub}>Tap "Add Experience" to showcase your work history</Text>
        </View>
      ) : (
        experiences.map((exp, index) => (
          <View key={exp.id || index} style={styles.experienceCard}>
            <View style={styles.experienceCardHeader}>
              <View style={styles.experienceCardTitle}>
                <Ionicons name="briefcase-outline" size={16} color={GOLD} />
                <Text style={styles.experienceJobTitle}>{exp.jobTitle}</Text>
              </View>
              <View style={styles.experienceCardActions}>
                <TouchableOpacity onPress={() => editExperience(index)}>
                  <Ionicons name="pencil-outline" size={16} color="rgba(255,255,255,0.5)" />
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
      <View style={{ height: 20 }} />

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
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.expModalContent}>
              <Text style={styles.applyLabel}>Job Title *</Text>
              <TextInput style={styles.applyInput} placeholder="e.g., Senior Developer" placeholderTextColor="rgba(255,255,255,0.3)" value={currentExperience.jobTitle} onChangeText={(text) => setCurrentExperience({...currentExperience, jobTitle: text})} />
              <Text style={styles.applyLabel}>Company Name *</Text>
              <TextInput style={styles.applyInput} placeholder="e.g., Google" placeholderTextColor="rgba(255,255,255,0.3)" value={currentExperience.companyName} onChangeText={(text) => setCurrentExperience({...currentExperience, companyName: text})} />
              <Text style={styles.applyLabel}>Start Date</Text>
              <TextInput style={styles.applyInput} placeholder="e.g., Jan 2020" placeholderTextColor="rgba(255,255,255,0.3)" value={currentExperience.startDate} onChangeText={(text) => setCurrentExperience({...currentExperience, startDate: text})} />
              <View style={styles.currentlyWorkingRow}>
                <TouchableOpacity style={styles.checkbox} onPress={() => setCurrentExperience({...currentExperience, currentlyWorking: !currentExperience.currentlyWorking})}>
                  {currentExperience.currentlyWorking && <Ionicons name="checkmark" size={14} color={GOLD} />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>I currently work here</Text>
              </View>
              {!currentExperience.currentlyWorking && (
                <>
                  <Text style={styles.applyLabel}>End Date</Text>
                  <TextInput style={styles.applyInput} placeholder="e.g., Dec 2023" placeholderTextColor="rgba(255,255,255,0.3)" value={currentExperience.endDate} onChangeText={(text) => setCurrentExperience({...currentExperience, endDate: text})} />
                </>
              )}
              <Text style={styles.applyLabel}>Job Description (Optional)</Text>
              <TextInput style={[styles.applyInput, styles.applyTextArea]} placeholder="Describe your responsibilities..." placeholderTextColor="rgba(255,255,255,0.3)" value={currentExperience.description} onChangeText={(text) => setCurrentExperience({...currentExperience, description: text})} multiline numberOfLines={4} />
            </ScrollView>
            <TouchableOpacity style={styles.expModalBtn} onPress={addExperience}>
              <Text style={styles.expModalBtnText}>{editingExperienceIndex !== null ? 'Update Experience' : 'Add Experience'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

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
          <Ionicons name="document-text-outline" size={16} color={GOLD} />
          <Text style={styles.reviewLabel}>Resume:</Text>
          <Text style={styles.reviewValue}>{resumeFile?.name || 'Not uploaded'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Ionicons name="school-outline" size={16} color={GOLD} />
          <Text style={styles.reviewLabel}>Education:</Text>
          <Text style={styles.reviewValue}>{educationLevel} in {fieldOfStudy}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Ionicons name="business-outline" size={16} color={GOLD} />
          <Text style={styles.reviewLabel}>Institution:</Text>
          <Text style={styles.reviewValue}>{institutionName}</Text>
        </View>
        {graduationYear && (
          <View style={styles.reviewRow}>
            <Ionicons name="calendar-outline" size={16} color={GOLD} />
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
              <Text style={styles.reviewExpDate}>{exp.startDate || 'Start date'} - {exp.currentlyWorking ? 'Present' : (exp.endDate || 'End date')}</Text>
              {exp.description && <Text style={styles.reviewExpDesc}>{exp.description}</Text>}
            </View>
          ))}
        </>
      )}

      <Text style={styles.reviewSectionTitle}>Cover Letter & Rate (Optional)</Text>
      <View style={styles.reviewCard}>
        {proposedRate && (
          <View style={styles.reviewRow}>
            <Ionicons name="cash-outline" size={16} color={GOLD} />
            <Text style={styles.reviewLabel}>Proposed Rate:</Text>
            <Text style={styles.reviewValue}>₱{parseFloat(proposedRate).toLocaleString()}</Text>
          </View>
        )}
        <TextInput style={[styles.reviewCoverLetter, styles.coverLetterInput]} placeholder="Write your cover letter here (optional)..." placeholderTextColor="rgba(255,255,255,0.3)" value={coverLetter} onChangeText={setCoverLetter} multiline numberOfLines={4} />
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const JobCard = ({ job }) => {
    const isUrgent = job.urgency_level === 'urgent';
    const hasApplied = appliedJobIds.includes(job._id);
    const isSaved = savedJobIds.includes(job._id);
    
    return (
      <TouchableOpacity style={styles.jobCard} onPress={() => { setSelectedJob(job); setShowJobModal(true); }} activeOpacity={0.85}>
        {isUrgent && (
          <View style={styles.badgeRow}>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>⚡ Urgent</Text>
            </View>
          </View>
        )}
        <View style={styles.jobHeader}>
          <View style={styles.companyLogo}>
            <Text style={styles.logoText}>{getCategoryIcon(job)}</Text>
          </View>
          <View style={styles.jobHeaderInfo}>
            <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
            <Text style={styles.companyName}>{job.client_id?.company_name || 'Client'}</Text>
          </View>
          <TouchableOpacity style={styles.saveIconBtn} onPress={() => handleSaveJob(job._id)}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color={isSaved ? GOLD : "rgba(255,255,255,0.4)"} />
          </TouchableOpacity>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}><Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.4)" /><Text style={styles.metaText}>{getWorkSetupLabel(job.work_setup)}</Text></View>
          <View style={styles.metaChip}><Ionicons name="briefcase-outline" size={12} color="rgba(255,255,255,0.4)" /><Text style={styles.metaText}>{getJobTypeLabel(job.job_type)}</Text></View>
          <View style={styles.metaChip}><Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.4)" /><Text style={styles.metaText}>{formatDate(job.created_at)}</Text></View>
        </View>
        <Text style={styles.salary}>{job.budget_type === 'hourly' ? `₱${job.budget_amount}/hr` : `₱${job.budget_amount?.toLocaleString()}`}</Text>
        {job.required_skills && job.required_skills.length > 0 && (
          <View style={styles.skillsRow}>
            {job.required_skills.slice(0, 3).map((s, i) => (<View key={i} style={styles.skillBadge}><Text style={styles.skillText}>{s}</Text></View>))}
            {job.required_skills.length > 3 && (<View style={styles.skillBadge}><Text style={styles.skillText}>+{job.required_skills.length - 3}</Text></View>)}
          </View>
        )}
        <TouchableOpacity style={[styles.applyBtn, hasApplied && styles.appliedBtn]} onPress={() => handleApplyJob(job)} disabled={hasApplied}>
          <Text style={[styles.applyBtnText, hasApplied && styles.appliedBtnText]}>{hasApplied ? '✓ Applied' : 'Apply Now'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const filtered = getFilteredJobs();

  if (jobsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Browse Jobs</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onNavigate('MyApplications')}><Ionicons name="document-text-outline" size={20} color={GOLD} /></TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={GOLD} /><Text style={styles.loadingText}>Loading jobs...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Browse Jobs</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onNavigate('MyApplications')}><Ionicons name="document-text-outline" size={20} color={GOLD} /></TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.35)" />
          <TextInput style={styles.searchInput} placeholder="Search jobs..." placeholderTextColor="rgba(255,255,255,0.28)" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} />
          {!!searchQuery && <TouchableOpacity onPress={() => { setSearchQuery(''); fetchJobs(); }}><Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.35)" /></TouchableOpacity>}
        </View>

        <Text style={styles.resultsLabel}>{filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} found</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}>
          {filtered.length > 0 ? filtered.map((job) => <JobCard key={job._id} job={job} />) : (
            <View style={styles.emptyState}><Text style={styles.emptyIcon}>💼</Text><Text style={styles.emptyTitle}>No jobs found</Text><Text style={styles.emptySub}>Try adjusting your search or filters</Text></View>
          )}
        </ScrollView>

        {/* Filter Drawer */}
        {showFilters && <TouchableWithoutFeedback onPress={closeFilters}><Animated.View style={[styles.overlay, { opacity: overlayAnim }]} /></TouchableWithoutFeedback>}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: filterAnim }] }]}>
          <View style={styles.drawerHeader}><Text style={styles.drawerTitle}>Filters</Text><TouchableOpacity onPress={closeFilters}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity></View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <Text style={styles.drawerSection}>Job Type</Text>
            <View style={styles.drawerChips}>{JOB_TYPES.map((type) => (<TouchableOpacity key={type} style={[styles.drawerChip, selectedJobType === type && styles.drawerChipActive]} onPress={() => setSelectedJobType(type)}><Text style={[styles.drawerChipText, selectedJobType === type && styles.drawerChipTextActive]}>{type === 'All' ? 'All' : getJobTypeLabel(type)}</Text></TouchableOpacity>))}</View>
            <Text style={styles.drawerSection}>Work Setup</Text>
            <View style={styles.drawerChips}>{WORK_SETUPS.map((setup) => (<TouchableOpacity key={setup} style={[styles.drawerChip, selectedWorkSetup === setup && styles.drawerChipActive]} onPress={() => setSelectedWorkSetup(setup)}><Text style={[styles.drawerChipText, selectedWorkSetup === setup && styles.drawerChipTextActive]}>{setup === 'All' ? 'All' : getWorkSetupLabel(setup)}</Text></TouchableOpacity>))}</View>
            <Text style={styles.drawerSection}>Experience Level</Text>
            <View style={styles.drawerChips}>{EXPERIENCE_LEVELS.map((level) => (<TouchableOpacity key={level} style={[styles.drawerChip, selectedExperience === level && styles.drawerChipActive]} onPress={() => setSelectedExperience(level)}><Text style={[styles.drawerChipText, selectedExperience === level && styles.drawerChipTextActive]}>{level}</Text></TouchableOpacity>))}</View>
          </ScrollView>
          <TouchableOpacity style={styles.drawerApplyBtn} onPress={handleApplyFilters}><Text style={styles.drawerApplyText}>Apply Filters</Text></TouchableOpacity>
        </Animated.View>

        {/* Job Detail Modal */}
        <Modal visible={showJobModal} animationType="slide" transparent onRequestClose={() => setShowJobModal(false)}>
          <View style={styles.modalWrap}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowJobModal(false)}><Ionicons name="close" size={18} color="#fff" /></TouchableOpacity>
              {selectedJob && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalLogo}><Text style={styles.modalLogoText}>{getCategoryIcon(selectedJob)}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.modalTitle}>{selectedJob.title}</Text><Text style={styles.modalCompany}>{selectedJob.client_id?.company_name || 'Client'}</Text></View>
                    <TouchableOpacity style={styles.modalSaveBtn} onPress={() => handleSaveJob(selectedJob._id)}><Ionicons name={savedJobIds.includes(selectedJob._id) ? "bookmark" : "bookmark-outline"} size={22} color={savedJobIds.includes(selectedJob._id) ? GOLD : "rgba(255,255,255,0.6)"} /></TouchableOpacity>
                  </View>
                  <View style={styles.modalMeta}>
                    {[{ icon: 'location-outline', label: getWorkSetupLabel(selectedJob.work_setup) }, { icon: 'briefcase-outline', label: getJobTypeLabel(selectedJob.job_type) }, { icon: 'time-outline', label: formatDate(selectedJob.created_at) }, { icon: 'people-outline', label: `${selectedJob.total_applicants || 0} applicants` }].map(({ icon, label }) => (<View key={label} style={styles.modalMetaItem}><Ionicons name={icon} size={14} color="rgba(255,255,255,0.45)" /><Text style={styles.modalMetaText}>{label}</Text></View>))}
                  </View>
                  <Text style={styles.modalSalary}>{selectedJob.budget_type === 'hourly' ? `₱${selectedJob.budget_amount}/hr` : `₱${selectedJob.budget_amount?.toLocaleString()}`}</Text>
                  <Text style={styles.modalSection}>Description</Text>
                  <Text style={styles.modalDesc}>{selectedJob.description}</Text>
                  {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (<><Text style={styles.modalSection}>Required Skills</Text><View style={styles.modalSkills}>{selectedJob.required_skills.map((s, i) => (<View key={i} style={styles.modalSkillBadge}><Text style={styles.modalSkillText}>{s}</Text></View>))}</View></>)}
                  <TouchableOpacity style={[styles.modalApplyBtn, appliedJobIds.includes(selectedJob._id) && styles.modalAppliedBtn]} onPress={() => { setShowJobModal(false); handleApplyJob(selectedJob); }} disabled={appliedJobIds.includes(selectedJob._id)}><Text style={[styles.modalApplyText, appliedJobIds.includes(selectedJob._id) && { color: '#4ade80' }]}>{appliedJobIds.includes(selectedJob._id) ? '✓ Already Applied' : 'Apply Now'}</Text></TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Multi-step Application Modal */}
        <Modal visible={showApplyModal} animationType="slide" transparent onRequestClose={() => { if (!submitting) { Alert.alert('Exit Application', 'Are you sure you want to exit?', [{ text: 'Continue', style: 'cancel' }, { text: 'Exit', style: 'destructive', onPress: () => { setShowApplyModal(false); resetApplicationForm(); } }]); } }}>
          <View style={styles.applyModalWrap}>
            <View style={styles.applyModalSheet}>
              <View style={styles.applyModalHeader}>
                <TouchableOpacity onPress={handlePrevStep} disabled={currentStep === 1}><Ionicons name="arrow-back" size={24} color={currentStep === 1 ? 'rgba(255,255,255,0.2)' : '#fff'} /></TouchableOpacity>
                <Text style={styles.applyModalTitle}>Apply for Job</Text>
                <TouchableOpacity onPress={() => { if (!submitting) { Alert.alert('Exit Application', 'Are you sure?', [{ text: 'Continue', style: 'cancel' }, { text: 'Exit', style: 'destructive', onPress: () => { setShowApplyModal(false); resetApplicationForm(); } }]); } }}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
              </View>
              {renderStepIndicator()}
              <View style={styles.applyModalContentWrapper}>
                {selectedJob && (<><View style={styles.jobInfoHeader}><Text style={styles.applyJobTitle}>{selectedJob.title}</Text><Text style={styles.applyJobCompany}>{selectedJob.client_id?.company_name || 'Client'}</Text></View>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}</>)}
              </View>
              <View style={styles.applyModalFooter}>
                {currentStep < 3 ? (<TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}><Text style={styles.nextStepBtnText}>Continue</Text><Ionicons name="arrow-forward" size={18} color="#0a0a0a" /></TouchableOpacity>) : (<TouchableOpacity style={[styles.submitBtn, submitting && styles.disabledBtn]} onPress={submitApplication} disabled={submitting}>{submitting ? <ActivityIndicator size="small" color="#0a0a0a" /> : <Text style={styles.submitBtnText}>Submit Application</Text>}</TouchableOpacity>)}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// Styles (keep all existing styles from your current file)
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  iconBtn: { width: 36, height: 36, borderRadius: 9, backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: INPUT_BG, marginHorizontal: 14, marginTop: 10, paddingHorizontal: 12, height: 40, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  searchInput: { flex: 1, color: '#fff', fontSize: 13 },
  resultsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.28)', paddingHorizontal: 14, marginTop: 8, marginBottom: 6 },
  listContent: { paddingHorizontal: 14, paddingBottom: 24, gap: 12 },
  jobCard: { backgroundColor: CARD_BG, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER },
  badgeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  urgentBadge: { backgroundColor: 'rgba(255,107,107,0.13)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgentText: { fontSize: 10, color: '#ff6b6b', fontWeight: '700' },
  jobHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  companyLogo: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoText: { fontSize: 19, fontWeight: '700', color: GOLD },
  jobHeaderInfo: { flex: 1 },
  saveIconBtn: { padding: 4, marginLeft: 4 },
  jobTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2, lineHeight: 19 },
  companyName: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  salary: { fontSize: 14, fontWeight: '700', color: GOLD, marginBottom: 10 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  skillText: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  applyBtn: { backgroundColor: GOLD, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  appliedBtn: { backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: '#4ade80' },
  applyBtnText: { fontSize: 13, fontWeight: '700', color: '#0a0a0a' },
  appliedBtnText: { color: '#4ade80' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  emptySub: { fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 99 },
  drawer: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 280, backgroundColor: '#111', borderLeftWidth: 1, borderLeftColor: BORDER, zIndex: 100, padding: 18, paddingTop: 22 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  drawerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  drawerSection: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  drawerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  drawerChip: { backgroundColor: CARD_BG, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  drawerChipActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: GOLD },
  drawerChipText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  drawerChipTextActive: { color: GOLD, fontWeight: '600' },
  drawerApplyBtn: { backgroundColor: GOLD, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  drawerApplyText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: '88%', borderTopWidth: 1, borderColor: BORDER },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 14 },
  modalCloseBtn: { position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  modalHeader: { flexDirection: 'row', gap: 12, marginBottom: 14, marginTop: 4 },
  modalLogo: { width: 48, height: 48, borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modalLogoText: { fontSize: 20, fontWeight: '700', color: GOLD },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 3 },
  modalCompany: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  modalSaveBtn: { padding: 8, marginLeft: 8 },
  modalMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  modalMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  modalMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  modalSalary: { fontSize: 18, fontWeight: '700', color: GOLD, marginBottom: 16 },
  modalSection: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 6, marginTop: 12 },
  modalDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  modalSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  modalSkillBadge: { backgroundColor: CARD_BG, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: BORDER },
  modalSkillText: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  modalApplyBtn: { backgroundColor: GOLD, paddingVertical: 13, borderRadius: 10, alignItems: 'center', marginBottom: 14 },
  modalAppliedBtn: { backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: '#4ade80' },
  modalApplyText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  applyModalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  applyModalSheet: { backgroundColor: CARD_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%' },
  applyModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: BORDER },
  applyModalTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  applyModalContentWrapper: { flex: 1 },
  jobInfoHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: CARD_BG },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  stepDotActive: { backgroundColor: GOLD, borderColor: GOLD },
  stepDotText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  stepDotTextActive: { color: '#0a0a0a' },
  stepLine: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 5 },
  stepLineActive: { backgroundColor: GOLD },
  stepContent: { paddingHorizontal: 20, paddingBottom: 30 },
  applyJobTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  applyJobCompany: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  applyLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 8, marginTop: 16 },
  applyInput: { backgroundColor: INPUT_BG, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  applyTextArea: { height: 100, textAlignVertical: 'top' },
  uploadBtn: { backgroundColor: INPUT_BG, borderRadius: 10, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed', marginBottom: 16 },
  uploadBtnText: { fontSize: 12, color: GOLD, marginTop: 8 },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: INPUT_BG, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, marginBottom: 16 },
  fileName: { flex: 1, fontSize: 12, color: '#fff' },
  educationScroll: { flexDirection: 'row', marginBottom: 16 },
  educationChip: { backgroundColor: INPUT_BG, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: BORDER },
  educationChipActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: GOLD },
  educationChipText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  educationChipTextActive: { color: GOLD, fontWeight: '600' },
  experienceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  addExperienceBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addExperienceText: { fontSize: 11, color: GOLD, fontWeight: '500' },
  noExperience: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  noExperienceText: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 10 },
  noExperienceSub: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 },
  experienceCard: { backgroundColor: INPUT_BG, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  experienceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  experienceCardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  experienceJobTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  experienceCardActions: { flexDirection: 'row', gap: 12 },
  experienceCompany: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  experienceDate: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 },
  experienceDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  expModalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  expModalSheet: { backgroundColor: CARD_BG, borderRadius: 16, width: '100%', maxHeight: '80%', borderWidth: 1, borderColor: BORDER },
  expModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: BORDER },
  expModalTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  expModalContent: { paddingHorizontal: 20, maxHeight: '70%' },
  expModalBtn: { backgroundColor: GOLD, paddingVertical: 14, borderRadius: 10, alignItems: 'center', margin: 20 },
  expModalBtnText: { fontSize: 14, fontWeight: '600', color: '#0a0a0a' },
  currentlyWorkingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  reviewSectionTitle: { fontSize: 14, fontWeight: '600', color: GOLD, marginTop: 16, marginBottom: 8 },
  reviewCard: { backgroundColor: INPUT_BG, borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  reviewJobTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  reviewCompany: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  reviewSalary: { fontSize: 14, fontWeight: '600', color: GOLD },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  reviewLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  reviewValue: { fontSize: 12, color: '#fff', flex: 1 },
  reviewExpTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  reviewExpCompany: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  reviewExpDate: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 },
  reviewExpDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 },
  reviewCoverLetter: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18, marginTop: 8 },
  coverLetterInput: { backgroundColor: INPUT_BG, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8 },
  nextStepBtn: { backgroundColor: GOLD, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  nextStepBtnText: { fontSize: 16, fontWeight: '600', color: '#0a0a0a' },
  submitBtn: { backgroundColor: GOLD, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#0a0a0a' },
  disabledBtn: { opacity: 0.6 },
  applyModalFooter: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: BORDER },
});