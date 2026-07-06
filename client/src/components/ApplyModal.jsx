// components/ApplyModal.jsx - FIXED with proper React Native file handling

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { applyForJob } from '../Redux/slices/applicationSlice';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Design tokens ──────────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
const GOLD       = '#C89520';
const GOLD_DK    = '#8A6410';
const WHITE      = '#FFFFFF';
const BG         = '#EEF4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const GREEN      = '#059669';
const RED        = '#EF4444';
const ORANGE     = '#F97316';

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
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ── Main Component ──────────────────────────────────────────────────────────────
export default function ApplyModal({ 
  visible, 
  job, 
  onClose, 
  onSuccess,
  userProfile,
}) {
  const dispatch = useDispatch();
  
  const { user } = useSelector(state => state.auth);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [useExistingCV, setUseExistingCV] = useState(true);
  const [existingCVInfo, setExistingCVInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
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
      loadProfileData();
      checkExistingCV();
      
      if (job?.budget?.min) {
        setProposedRate(job.budget.min.toString());
      } else if (job?.budget_amount) {
        setProposedRate(job.budget_amount.toString());
      }
      
      setCurrentStep(1);
      setCoverLetter('');
      setSubmitting(false);
    }
  }, [visible, job]);

  const loadProfileData = async () => {
    setIsLoadingProfile(true);
    try {
      const profile = user || userProfile;
      
      if (profile) {
        const education = profile.education || profile.education_info || {};
        
        if (education.level || profile.education_level) {
          setEducationLevel(education.level || profile.education_level || '');
        }
        if (education.field || profile.field_of_study || profile.major) {
          setFieldOfStudy(education.field || profile.field_of_study || profile.major || '');
        }
        if (education.institution || profile.institution || profile.school || profile.university) {
          setInstitutionName(education.institution || profile.institution || profile.school || profile.university || '');
        }
        if (education.graduation_year || profile.graduation_year || profile.year_graduated) {
          setGraduationYear(education.graduation_year || profile.graduation_year || profile.year_graduated || '');
        }
        
        const experiencesData = profile.experiences || profile.work_experience || profile.work_history || [];
        
        if (experiencesData && Array.isArray(experiencesData) && experiencesData.length > 0) {
          const formattedExperiences = experiencesData.map((exp, index) => ({
            id: exp._id || exp.id || `exp_${index}`,
            jobTitle: exp.job_title || exp.position || exp.title || exp.role || '',
            companyName: exp.company || exp.company_name || exp.employer || exp.organization || '',
            startDate: exp.start_date || exp.startDate || exp.from || '',
            endDate: exp.end_date || exp.endDate || exp.to || '',
            currentlyWorking: exp.currently_working || exp.isCurrent || exp.current || false,
            description: exp.description || exp.duties || exp.responsibilities || '',
          }));
          setExperiences(formattedExperiences);
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const checkExistingCV = async () => {
    setIsCheckingCV(true);
    try {
      const cvDirPath = FileSystem.documentDirectory + 'cvs/';
      const dirInfo = await FileSystem.getInfoAsync(cvDirPath);
      
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(cvDirPath);
        const cvFiles = files.filter(file => 
          file.endsWith('.pdf') || 
          file.endsWith('.doc') || 
          file.endsWith('.docx')
        );
        
        if (cvFiles.length > 0) {
          const latestCV = cvFiles[0];
          const filePath = cvDirPath + latestCV;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          setExistingCVInfo({
            name: latestCV,
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

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        console.log('Selected file:', {
          name: file.name,
          uri: file.uri,
          mimeType: file.mimeType,
          size: file.size,
        });
        
        setResumeFile({
          name: file.name,
          uri: file.uri,
          mimeType: file.mimeType || 'application/pdf',
          size: file.size || 0,
        });
        setUseExistingCV(false);
      }
    } catch (error) {
      console.error('Pick resume error:', error);
      Alert.alert('Error', 'Failed to select resume file: ' + error.message);
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

  // ── FIXED: Submit with proper file handling for React Native ────────────────
  const handleSubmit = async () => {
    if (!job?._id) {
      Alert.alert('Error', 'Invalid job data. Please try again.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('job_id', job._id);
      formData.append('cover_letter', coverLetter.trim() || "I'm interested in this position.");
      
      if (proposedRate) {
        formData.append('proposed_rate', parseFloat(proposedRate).toString());
      }
      
      // ── FIXED: Handle resume file properly for React Native ──
      if (useExistingCV && existingCVInfo) {
        // Use existing CV from filesystem
        const fileExt = existingCVInfo.name.split('.').pop().toLowerCase();
        let mimeType = 'application/pdf';
        if (fileExt === 'doc') mimeType = 'application/msword';
        if (fileExt === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        console.log('Using existing CV:', existingCVInfo.name);
        
        // For existing CV, read file and convert to base64
        const fileContent = await FileSystem.readAsStringAsync(existingCVInfo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Create a file object for FormData
        const fileObj = {
          uri: `data:${mimeType};base64,${fileContent}`,
          name: existingCVInfo.name,
          type: mimeType,
          size: existingCVInfo.size || 0,
        };
        
        formData.append('resume', fileObj);
        
        console.log('Added existing CV to FormData:', {
          name: existingCVInfo.name,
          size: existingCVInfo.size,
          mimeType: mimeType
        });
        
      } else if (resumeFile) {
        // Use newly uploaded resume - DIRECT approach for React Native
        console.log('Uploading new resume:', resumeFile.name);
        
        // IMPORTANT: For React Native, we need to use the file object directly
        // The DocumentPicker returns a file object with uri, name, type
        const fileObj = {
          uri: resumeFile.uri,
          name: resumeFile.name,
          type: resumeFile.mimeType || 'application/pdf',
          size: resumeFile.size || 0,
        };
        
        formData.append('resume', fileObj);
        
        console.log('Added new resume to FormData:', {
          name: resumeFile.name,
          size: resumeFile.size,
          mimeType: resumeFile.mimeType,
          uri: resumeFile.uri
        });
        
      } else {
        Alert.alert('Error', 'No resume selected. Please upload or use existing CV.');
        setSubmitting(false);
        return;
      }
      
      // Education data
      const educationData = {
        level: educationLevel,
        field: fieldOfStudy,
        institution: institutionName,
        graduation_year: graduationYear || null,
      };
      formData.append('education', JSON.stringify(educationData));
      
      // Experiences data
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
      
      console.log('Submitting application with resume');
      
      // Log FormData contents for debugging
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        const value = pair[1];
        if (typeof value === 'object' && value !== null) {
          console.log(pair[0], ':', value.name || 'Object', `(${value.size || 0} bytes, ${value.type || 'unknown'})`);
          if (value.uri) {
            console.log('  URI:', value.uri);
          }
        } else {
          console.log(pair[0], ':', value);
        }
      }
      
      const result = await dispatch(applyForJob(formData)).unwrap();
      console.log('Application result:', result);
      
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Application error:', error);
      
      // Handle specific error codes from the slice
      if (error?.code === 'ALREADY_APPLIED') {
        Alert.alert('Already Applied', 'You have already applied for this job.');
      } else if (error?.code === 'FILE_TOO_LARGE') {
        Alert.alert('File Too Large', 'The resume file exceeds the 5MB limit. Please compress or upload a smaller file.');
      } else if (error?.code === 'UNAUTHORIZED') {
        Alert.alert('Session Expired', 'Please login again to continue.');
        onClose();
      } else {
        Alert.alert('Error', error?.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
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

  if (isLoadingProfile) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Loading Profile...</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BLUE} />
              <Text style={styles.loadingText}>Loading your profile information...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const renderStep1 = () => (
    <>
      <Text style={styles.applyLabel}>Resume/CV *</Text>
      {isCheckingCV ? (
        <View style={styles.uploadBtn}>
          <ActivityIndicator size="small" color={BLUE} />
          <Text style={styles.uploadBtnText}>Checking for existing CV...</Text>
        </View>
      ) : existingCVInfo && !resumeFile ? (
        <View style={styles.existingCVContainer}>
          <TouchableOpacity 
            style={[styles.existingCVOption, useExistingCV && styles.existingCVOptionActive]}
            onPress={() => { setUseExistingCV(true); setResumeFile(null); }}
          >
            <Ionicons name="document-text" size={24} color={useExistingCV ? BLUE : TEXT_MUTED} />
            <View style={styles.existingCVInfo}>
              <Text style={styles.existingCVName}>{existingCVInfo.name}</Text>
              <Text style={styles.existingCVSize}>{formatFileSize(existingCVInfo.size)}</Text>
            </View>
            {useExistingCV && <Ionicons name="checkmark-circle" size={20} color={BLUE} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.existingCVOption, !useExistingCV && styles.existingCVOptionActive]}
            onPress={() => setUseExistingCV(false)}
          >
            <Ionicons name="cloud-upload-outline" size={24} color={!useExistingCV ? BLUE : TEXT_MUTED} />
            <Text style={styles.uploadNewText}>Upload new CV</Text>
            {!useExistingCV && <Ionicons name="checkmark-circle" size={20} color={BLUE} />}
          </TouchableOpacity>
        </View>
      ) : (!existingCVInfo || !useExistingCV) && (
        <>
          {!resumeFile ? (
            <TouchableOpacity style={styles.uploadBtn} onPress={pickResume}>
              <Ionicons name="cloud-upload-outline" size={24} color={BLUE} />
              <Text style={styles.uploadBtnText}>Upload your resume (PDF, DOC, DOCX)</Text>
              <Text style={styles.uploadBtnSubtext}>Max 5MB</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.fileInfo}>
              <Ionicons name="document-text-outline" size={20} color={BLUE} />
              <Text style={styles.fileName}>{resumeFile.name}</Text>
              <Text style={styles.fileSize}>{formatFileSize(resumeFile.size)}</Text>
              <TouchableOpacity onPress={removeResume}>
                <Ionicons name="close-circle" size={20} color={RED} />
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
  );

  const renderStep2 = () => (
    <>
      <View style={styles.experienceHeader}>
        <Text style={styles.applyLabel}>Work Experience (Optional)</Text>
        <TouchableOpacity style={styles.addExperienceBtn} onPress={() => setShowExperienceForm(true)}>
          <Ionicons name="add-circle" size={20} color={BLUE} />
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
              <Text style={styles.experienceJobTitle}>{exp.jobTitle}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => editExperience(index)}>
                  <Ionicons name="pencil-outline" size={16} color={TEXT_MUTED} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeExperience(index)}>
                  <Ionicons name="trash-outline" size={16} color={RED} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.experienceCompany}>{exp.companyName}</Text>
            <Text style={styles.experienceDate}>
              {exp.startDate || 'Start date'} - {exp.currentlyWorking ? 'Present' : (exp.endDate || 'End date')}
            </Text>
            {exp.description && (
              <Text style={styles.experienceDescription}>{exp.description}</Text>
            )}
          </View>
        ))
      )}

      <Modal visible={showExperienceForm} animationType="slide" transparent>
        <View style={styles.expModalWrap}>
          <View style={styles.expModalSheet}>
            <View style={styles.expModalHeader}>
              <Text style={styles.expModalTitle}>{editingExperienceIndex !== null ? 'Edit Experience' : 'Add Experience'}</Text>
              <TouchableOpacity onPress={() => { setShowExperienceForm(false); setEditingExperienceIndex(null); }}>
                <Ionicons name="close" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.expModalContent}>
              <Text style={styles.applyLabel}>Job Title *</Text>
              <TextInput style={styles.applyInput} placeholder="e.g., Senior Developer" value={currentExperience.jobTitle} onChangeText={(text) => setCurrentExperience({...currentExperience, jobTitle: text})} />
              <Text style={styles.applyLabel}>Company Name *</Text>
              <TextInput style={styles.applyInput} placeholder="e.g., Google" value={currentExperience.companyName} onChangeText={(text) => setCurrentExperience({...currentExperience, companyName: text})} />
              <Text style={styles.applyLabel}>Start Date</Text>
              <TextInput style={styles.applyInput} placeholder="e.g., Jan 2020" value={currentExperience.startDate} onChangeText={(text) => setCurrentExperience({...currentExperience, startDate: text})} />
              <TouchableOpacity style={styles.currentlyWorkingRow} onPress={() => setCurrentExperience({...currentExperience, currentlyWorking: !currentExperience.currentlyWorking})}>
                <View style={[styles.checkbox, currentExperience.currentlyWorking && styles.checkboxChecked]}>
                  {currentExperience.currentlyWorking && <Ionicons name="checkmark" size={12} color={WHITE} />}
                </View>
                <Text style={styles.checkboxLabel}>I currently work here</Text>
              </TouchableOpacity>
              {!currentExperience.currentlyWorking && (
                <>
                  <Text style={styles.applyLabel}>End Date</Text>
                  <TextInput style={styles.applyInput} placeholder="e.g., Dec 2023" value={currentExperience.endDate} onChangeText={(text) => setCurrentExperience({...currentExperience, endDate: text})} />
                </>
              )}
              <Text style={styles.applyLabel}>Description (Optional)</Text>
              <TextInput style={[styles.applyInput, styles.applyTextArea]} placeholder="Describe your responsibilities..." value={currentExperience.description} onChangeText={(text) => setCurrentExperience({...currentExperience, description: text})} multiline numberOfLines={3} />
            </ScrollView>
            <TouchableOpacity style={styles.expModalBtn} onPress={addExperience}>
              <Text style={styles.expModalBtnText}>{editingExperienceIndex !== null ? 'Update' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.reviewSectionTitle}>Review Your Application</Text>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>Resume:</Text>
        <Text style={styles.reviewValue}>{useExistingCV && existingCVInfo ? existingCVInfo.name : (resumeFile?.name || 'Not uploaded')}</Text>
        <Text style={styles.reviewLabel}>Education:</Text>
        <Text style={styles.reviewValue}>{educationLevel} in {fieldOfStudy}</Text>
        <Text style={styles.reviewLabel}>Institution:</Text>
        <Text style={styles.reviewValue}>{institutionName}</Text>
        {experiences.length > 0 && (
          <>
            <Text style={styles.reviewLabel}>Experience:</Text>
            <Text style={styles.reviewValue}>{experiences.length} position(s) added</Text>
          </>
        )}
      </View>

      <Text style={styles.reviewSubTitle}>Cover Letter & Rate</Text>
      <View style={styles.reviewCard}>
        {proposedRate && <Text style={styles.reviewValue}>Proposed Rate: ₱{parseFloat(proposedRate).toLocaleString()}</Text>}
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
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handlePrevStep} disabled={currentStep === 1}>
              <Ionicons name="arrow-back" size={24} color={currentStep === 1 ? TEXT_LIGHT : TEXT_MAIN} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Apply for Job</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
          
          {renderStepIndicator()}
          
          <View style={styles.modalContentWrapper}>
            <View style={styles.jobInfoHeader}>
              <Text style={styles.applyJobTitle}>{job?.title}</Text>
              <Text style={styles.applyJobCompany}>{job?.client_id?.company_name || job?.client_id?.name || 'Client'}</Text>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
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

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: TEXT_MUTED,
  },
});