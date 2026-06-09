import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createJob } from '../../Redux/slices/jobSlice';

// ── Design tokens (same as ClientScreen) ──────────────────────────────────────────
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

// Job Types
const JOB_TYPES = [
  { label: 'Full Time', value: 'full_time', icon: 'briefcase-outline' },
  { label: 'Part Time', value: 'part_time', icon: 'time-outline' },
  { label: 'Contract', value: 'contract', icon: 'document-text-outline' },
  { label: 'One Time', value: 'one_time', icon: 'flash-outline' },
  { label: 'Internship', value: 'internship', icon: 'school-outline' },
  { label: 'Freelance', value: 'freelance', icon: 'person-outline' },
];

// Work Setup
const WORK_SETUPS = [
  { label: 'Remote', value: 'remote', icon: 'wifi-outline' },
  { label: 'Onsite', value: 'onsite', icon: 'business-outline' },
  { label: 'Hybrid', value: 'hybrid', icon: 'phone-portrait-outline' },
];

// Urgency Levels
const URGENCY_LEVELS = [
  { label: 'Low', value: 'low', icon: 'thermometer-outline', color: '#10B981' },
  { label: 'Normal', value: 'normal', icon: 'thermometer-outline', color: '#F59E0B' },
  { label: 'Urgent', value: 'urgent', icon: 'flame-outline', color: '#EF4444' },
  { label: 'Immediate', value: 'immediate', icon: 'alert-circle-outline', color: '#DC2626' },
];

// Experience Levels
const EXPERIENCE_LEVELS = [
  { label: 'Entry', value: 'Entry', icon: 'star-outline' },
  { label: 'Intermediate', value: 'Intermediate', icon: 'star-half-outline' },
  { label: 'Expert', value: 'Expert', icon: 'star-outline' },
  { label: 'Senior', value: 'Senior', icon: 'trophy-outline' },
  { label: 'Lead', value: 'Lead', icon: 'people-outline' },
  { label: 'Director', value: 'Director', icon: 'business-outline' },
];

// Budget Types
const BUDGET_TYPES = [
  { label: 'Fixed Price', value: 'fixed', icon: 'cash-outline' },
  { label: 'Hourly Rate', value: 'hourly', icon: 'time-outline' },
];

// Payment Frequencies
const PAYMENT_FREQUENCIES = [
  { label: 'Hourly', value: 'hourly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-Weekly', value: 'bi-weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'One-Time', value: 'one-time' },
];

// Currencies
const CURRENCIES = [
  { label: 'PHP', value: 'PHP', symbol: '₱' },
  { label: 'USD', value: 'USD', symbol: '$' },
  { label: 'EUR', value: 'EUR', symbol: '€' },
  { label: 'GBP', value: 'GBP', symbol: '£' },
];

// Contact Preferences
const CONTACT_PREFERENCES = [
  { label: 'Chat', value: 'chat', icon: 'chatbubble-outline' },
  { label: 'Email', value: 'email', icon: 'mail-outline' },
  { label: 'Phone', value: 'phone', icon: 'call-outline' },
];

// Benefits Options
const BENEFITS_OPTIONS = [
  { label: 'Health Insurance', value: 'health_insurance', icon: 'medkit-outline' },
  { label: 'Paid Time Off', value: 'paid_time_off', icon: 'beach-outline' },
  { label: 'Remote Stipend', value: 'remote_stipend', icon: 'wifi-outline' },
  { label: 'Equipment Provided', value: 'equipment_provided', icon: 'desktop-outline' },
  { label: 'Bonus Eligible', value: 'bonus_eligible', icon: 'gift-outline' },
  { label: 'Retirement Plan', value: 'retirement_plan', icon: 'shield-outline' },
  { label: 'Professional Development', value: 'professional_development', icon: 'school-outline' },
];

// Degree Levels
const DEGREE_LEVELS = [
  { label: 'None', value: 'none' },
  { label: 'High School', value: 'high_school' },
  { label: 'Associate', value: 'associate' },
  { label: 'Bachelor', value: 'bachelor' },
  { label: 'Master', value: 'master' },
  { label: 'Doctorate', value: 'doctorate' },
];

// Language Proficiencies
const LANGUAGE_PROFICIENCIES = [
  { label: 'Basic', value: 'basic' },
  { label: 'Conversational', value: 'conversational' },
  { label: 'Professional', value: 'professional' },
  { label: 'Native', value: 'native' },
];

// Skills suggestions
const SKILLS_SUGGESTIONS = [
  'React Native', 'JavaScript', 'Python', 'UI/UX Design',
  'Figma', 'Node.js', 'MongoDB', 'Firebase',
  'Swift', 'Kotlin', 'Flutter', 'PHP', 'Laravel',
  'AWS', 'Docker', 'GraphQL', 'TypeScript',
];

export default function PostJobScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.jobs);
  const { token } = useSelector((state) => state.auth);

  // Basic Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [jobType, setJobType] = useState('one_time');
  const [workSetup, setWorkSetup] = useState('remote');
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [budgetType, setBudgetType] = useState('fixed');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [contactPreference, setContactPreference] = useState('chat');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pay Information
  const [payInformation, setPayInformation] = useState({
    salary_range: { min: '', max: '', currency: 'PHP' },
    payment_frequency: 'monthly',
    benefits: [],
    negotiable: false,
    display_pay: true
  });

  // Location Information
  const [location, setLocation] = useState({
    address: '',
    city: '',
    state: '',
    country: 'Philippines',
    zip_code: '',
    specific_area: '',
    landmark: '',
    work_address: ''
  });

  // Education Requirements
  const [educationRequirements, setEducationRequirements] = useState({
    minimum_degree: 'none',
    preferred_field: '',
    required_certifications: [],
    years_of_experience: ''
  });
  const [certificationInput, setCertificationInput] = useState('');

  // Job Requirements
  const [requirements, setRequirements] = useState({
    min_years_experience: '',
    preferred_tools: [],
    languages_required: [],
    additional_requirements: ''
  });
  const [toolInput, setToolInput] = useState('');
  const [languageInput, setLanguageInput] = useState({ language: '', proficiency: 'professional' });

  // Application Settings
  const [applicationSettings, setApplicationSettings] = useState({
    auto_accept: false,
    max_applicants: '100',
    application_deadline: '',
    questions_for_applicants: []
  });

  // Add skill
  const addSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  // Remove skill
  const removeSkill = (skill) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  // Add certification
  const addCertification = () => {
    if (certificationInput.trim() && !educationRequirements.required_certifications.includes(certificationInput.trim())) {
      setEducationRequirements({
        ...educationRequirements,
        required_certifications: [...educationRequirements.required_certifications, certificationInput.trim()]
      });
      setCertificationInput('');
    }
  };

  // Remove certification
  const removeCertification = (cert) => {
    setEducationRequirements({
      ...educationRequirements,
      required_certifications: educationRequirements.required_certifications.filter(c => c !== cert)
    });
  };

  // Add preferred tool
  const addTool = () => {
    if (toolInput.trim() && !requirements.preferred_tools.includes(toolInput.trim())) {
      setRequirements({
        ...requirements,
        preferred_tools: [...requirements.preferred_tools, toolInput.trim()]
      });
      setToolInput('');
    }
  };

  // Remove tool
  const removeTool = (tool) => {
    setRequirements({
      ...requirements,
      preferred_tools: requirements.preferred_tools.filter(t => t !== tool)
    });
  };

  // Add language
  const addLanguage = () => {
    if (languageInput.language.trim()) {
      setRequirements({
        ...requirements,
        languages_required: [...requirements.languages_required, { ...languageInput }]
      });
      setLanguageInput({ language: '', proficiency: 'professional' });
    }
  };

  // Remove language
  const removeLanguage = (index) => {
    const newLanguages = [...requirements.languages_required];
    newLanguages.splice(index, 1);
    setRequirements({ ...requirements, languages_required: newLanguages });
  };

  // Toggle benefit
  const toggleBenefit = (benefit) => {
    if (payInformation.benefits.includes(benefit)) {
      setPayInformation({
        ...payInformation,
        benefits: payInformation.benefits.filter(b => b !== benefit)
      });
    } else {
      setPayInformation({
        ...payInformation,
        benefits: [...payInformation.benefits, benefit]
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRequiredSkills([]);
    setBudgetAmount('');
    setEstimatedDuration('');
    setJobType('one_time');
    setWorkSetup('remote');
    setUrgencyLevel('normal');
    setExperienceLevel('');
    setBudgetType('fixed');
    setContactPreference('chat');
    setSkillInput('');
    setPayInformation({
      salary_range: { min: '', max: '', currency: 'PHP' },
      payment_frequency: 'monthly',
      benefits: [],
      negotiable: false,
      display_pay: true
    });
    setLocation({
      address: '',
      city: '',
      state: '',
      country: 'Philippines',
      zip_code: '',
      specific_area: '',
      landmark: '',
      work_address: ''
    });
    setEducationRequirements({
      minimum_degree: 'none',
      preferred_field: '',
      required_certifications: [],
      years_of_experience: ''
    });
    setRequirements({
      min_years_experience: '',
      preferred_tools: [],
      languages_required: [],
      additional_requirements: ''
    });
    setApplicationSettings({
      auto_accept: false,
      max_applicants: '100',
      application_deadline: '',
      questions_for_applicants: []
    });
  };

  // Handle form submission
  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a job title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a job description');
      return;
    }
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }
    if (!token) {
      Alert.alert('Error', 'You must be logged in to post a job');
      return;
    }

    const jobData = {
      title: title.trim(),
      description: description.trim(),
      required_skills: requiredSkills,
      job_type: jobType,
      work_setup: workSetup,
      urgency_level: urgencyLevel,
      experience_level: experienceLevel || null,
      budget_type: budgetType,
      budget_amount: parseFloat(budgetAmount),
      estimated_duration: estimatedDuration.trim() || null,
      contact_preference: contactPreference,
      pay_information: {
        salary_range: {
          min: payInformation.salary_range.min ? parseFloat(payInformation.salary_range.min) : null,
          max: payInformation.salary_range.max ? parseFloat(payInformation.salary_range.max) : null,
          currency: payInformation.salary_range.currency
        },
        payment_frequency: payInformation.payment_frequency,
        benefits: payInformation.benefits,
        negotiable: payInformation.negotiable,
        display_pay: payInformation.display_pay
      },
      location: {
        address: location.address || null,
        city: location.city || null,
        state: location.state || null,
        country: location.country,
        zip_code: location.zip_code || null,
        specific_area: location.specific_area || null,
        landmark: location.landmark || null,
        work_address: location.work_address || null
      },
      education_requirements: {
        minimum_degree: educationRequirements.minimum_degree,
        preferred_field: educationRequirements.preferred_field || null,
        required_certifications: educationRequirements.required_certifications,
        years_of_experience: parseInt(educationRequirements.years_of_experience) || 0
      },
      requirements: {
        min_years_experience: parseInt(requirements.min_years_experience) || 0,
        preferred_tools: requirements.preferred_tools,
        languages_required: requirements.languages_required,
        additional_requirements: requirements.additional_requirements || null
      },
      application_settings: {
        auto_accept: applicationSettings.auto_accept,
        max_applicants: parseInt(applicationSettings.max_applicants) || 100,
        application_deadline: applicationSettings.application_deadline || null,
        questions_for_applicants: []
      }
    };

    try {
      await dispatch(createJob(jobData)).unwrap();
      
      Alert.alert(
        'Success!',
        'Your job has been posted successfully',
        [
          {
            text: 'View My Postings',
            onPress: () => {
              resetForm();
              onNavigate('Mypostings');
            }
          },
          {
            text: 'Post Another',
            onPress: () => resetForm()
          },
          {
            text: 'Go to Dashboard',
            onPress: () => {
              resetForm();
              onNavigate('ClientDashboard');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to post job. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        {/* TOP BAR */}
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <TouchableOpacity onPress={() => onNavigate('ClientDashboard')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={TEXT_MAIN} />
            </TouchableOpacity>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>T</Text>
            </View>
            <Text style={styles.topbarBrand}>Taskra</Text>
          </View>
          <TouchableOpacity style={styles.postingsBtn} onPress={() => onNavigate('Mypostings')}>
            <Ionicons name="document-text-outline" size={20} color={GREEN_DARK} />
            <Text style={styles.postingsBtnText}>My Posts</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scroll}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Post a New Job</Text>
            <Text style={styles.headerSubtitle}>Fill out the details below to find the perfect freelancer</Text>
          </View>

          {/* Tip Banner */}
          <View style={styles.tipBanner}>
            <Ionicons name="bulb-outline" size={18} color={GREEN_DARK} />
            <Text style={styles.tipText}>
              Tip: Add detailed description and required skills to attract the right freelancers
            </Text>
          </View>

          {/* ===== BASIC INFORMATION ===== */}
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Job Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Job Title <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="briefcase-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Senior React Native Developer"
                placeholderTextColor={TEXT_LIGHT}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the job requirements, responsibilities, and deliverables..."
                placeholderTextColor={TEXT_LIGHT}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Required Skills */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Required Skills</Text>
            <View style={styles.skillInputWrapper}>
              <TextInput
                style={styles.skillInput}
                placeholder="Type a skill and press +"
                placeholderTextColor={TEXT_LIGHT}
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={addSkill}
              />
              <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
                <Ionicons name="add-circle" size={32} color={GREEN_DARK} />
              </TouchableOpacity>
            </View>

            <View style={styles.suggestionsContainer}>
              {SKILLS_SUGGESTIONS.slice(0, 8).map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={styles.suggestionChip}
                  onPress={() => {
                    if (!requiredSkills.includes(skill)) {
                      setRequiredSkills([...requiredSkills, skill]);
                    }
                  }}
                >
                  <Ionicons name="add" size={12} color={GREEN_DARK} />
                  <Text style={styles.suggestionText}>{skill}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {requiredSkills.length > 0 && (
              <View style={styles.skillsContainer}>
                {requiredSkills.map((skill) => (
                  <View key={skill} style={styles.skillChip}>
                    <Ionicons name="code-slash" size={12} color={GREEN_DARK} />
                    <Text style={styles.skillText}>{skill}</Text>
                    <TouchableOpacity onPress={() => removeSkill(skill)}>
                      <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ===== JOB CONFIGURATION ===== */}
          <Text style={styles.sectionTitle}>Job Configuration</Text>

          {/* Job Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Type</Text>
            <View style={styles.optionsRow}>
              {JOB_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.optionChip, jobType === type.value && styles.optionChipActive]}
                  onPress={() => setJobType(type.value)}
                >
                  <Ionicons name={type.icon} size={14} color={jobType === type.value ? GREEN_DARK : TEXT_MUTED} />
                  <Text style={[styles.optionChipText, jobType === type.value && styles.optionChipTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Work Setup */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Work Setup</Text>
            <View style={styles.optionsRow}>
              {WORK_SETUPS.map((setup) => (
                <TouchableOpacity
                  key={setup.value}
                  style={[styles.optionChip, workSetup === setup.value && styles.optionChipActive]}
                  onPress={() => setWorkSetup(setup.value)}
                >
                  <Ionicons name={setup.icon} size={14} color={workSetup === setup.value ? GREEN_DARK : TEXT_MUTED} />
                  <Text style={[styles.optionChipText, workSetup === setup.value && styles.optionChipTextActive]}>
                    {setup.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Urgency Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Urgency Level</Text>
            <View style={styles.optionsRow}>
              {URGENCY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[styles.optionChip, urgencyLevel === level.value && styles.optionChipActive]}
                  onPress={() => setUrgencyLevel(level.value)}
                >
                  <Ionicons name={level.icon} size={14} color={urgencyLevel === level.value ? level.color : TEXT_MUTED} />
                  <Text style={[styles.optionChipText, urgencyLevel === level.value && { color: level.color }]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Experience Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Experience Level</Text>
            <View style={styles.optionsRow}>
              {EXPERIENCE_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[styles.optionChip, experienceLevel === level.value && styles.optionChipActive]}
                  onPress={() => setExperienceLevel(level.value)}
                >
                  <Ionicons name={level.icon} size={14} color={experienceLevel === level.value ? GREEN_DARK : TEXT_MUTED} />
                  <Text style={[styles.optionChipText, experienceLevel === level.value && styles.optionChipTextActive]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ===== BUDGET & PAYMENT ===== */}
          <Text style={styles.sectionTitle}>Budget & Payment</Text>

          {/* Budget Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Budget Type</Text>
            <View style={styles.optionsRow}>
              {BUDGET_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.optionChip, budgetType === type.value && styles.optionChipActive]}
                  onPress={() => setBudgetType(type.value)}
                >
                  <Ionicons name={type.icon} size={14} color={budgetType === type.value ? GREEN_DARK : TEXT_MUTED} />
                  <Text style={[styles.optionChipText, budgetType === type.value && styles.optionChipTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Budget Amount <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={budgetType === 'hourly' ? 'e.g. 500 (per hour)' : 'e.g. 5000'}
                placeholderTextColor={TEXT_LIGHT}
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Estimated Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Duration</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 2 weeks, 1 month, etc."
                placeholderTextColor={TEXT_LIGHT}
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
              />
            </View>
          </View>

          {/* Contact Preference */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Preference</Text>
            <View style={styles.optionsRow}>
              {CONTACT_PREFERENCES.map((pref) => (
                <TouchableOpacity
                  key={pref.value}
                  style={[styles.optionChip, contactPreference === pref.value && styles.optionChipActive]}
                  onPress={() => setContactPreference(pref.value)}
                >
                  <Ionicons name={pref.icon} size={14} color={contactPreference === pref.value ? GREEN_DARK : TEXT_MUTED} />
                  <Text style={[styles.optionChipText, contactPreference === pref.value && styles.optionChipTextActive]}>
                    {pref.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Advanced Options Toggle */}
          <TouchableOpacity 
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={18} color={GREEN_DARK} />
            <Text style={styles.advancedToggleText}>Advanced Options</Text>
          </TouchableOpacity>

          {showAdvanced && (
            <>
              {/* ===== PAY INFORMATION ===== */}
              <Text style={styles.subSectionTitle}>Pay Information</Text>

              {/* Salary Range */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Salary Range (Optional)</Text>
                <View style={styles.rowInputs}>
                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <TextInput
                      style={styles.input}
                                      placeholder="Min"
                      placeholderTextColor={TEXT_LIGHT}
                      value={payInformation.salary_range.min}
                      onChangeText={(text) => setPayInformation({
                        ...payInformation,
                        salary_range: { ...payInformation.salary_range, min: text }
                      })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Max"
                      placeholderTextColor={TEXT_LIGHT}
                      value={payInformation.salary_range.max}
                      onChangeText={(text) => setPayInformation({
                        ...payInformation,
                        salary_range: { ...payInformation.salary_range, max: text }
                      })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Currency */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Currency</Text>
                <View style={styles.optionsRow}>
                  {CURRENCIES.map((curr) => (
                    <TouchableOpacity
                      key={curr.value}
                      style={[styles.smallChip, payInformation.salary_range.currency === curr.value && styles.optionChipActive]}
                      onPress={() => setPayInformation({
                        ...payInformation,
                        salary_range: { ...payInformation.salary_range, currency: curr.value }
                      })}
                    >
                      <Text style={[styles.smallChipText, payInformation.salary_range.currency === curr.value && styles.optionChipTextActive]}>
                        {curr.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Frequency */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Frequency</Text>
                <View style={styles.optionsRow}>
                  {PAYMENT_FREQUENCIES.map((freq) => (
                    <TouchableOpacity
                      key={freq.value}
                      style={[styles.smallChip, payInformation.payment_frequency === freq.value && styles.optionChipActive]}
                      onPress={() => setPayInformation({ ...payInformation, payment_frequency: freq.value })}
                    >
                      <Text style={[styles.smallChipText, payInformation.payment_frequency === freq.value && styles.optionChipTextActive]}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Benefits */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Benefits</Text>
                <View style={styles.optionsRow}>
                  {BENEFITS_OPTIONS.map((benefit) => (
                    <TouchableOpacity
                      key={benefit.value}
                      style={[styles.optionChip, payInformation.benefits.includes(benefit.value) && styles.optionChipActive]}
                      onPress={() => toggleBenefit(benefit.value)}
                    >
                      <Ionicons name={benefit.icon} size={12} color={payInformation.benefits.includes(benefit.value) ? GREEN_DARK : TEXT_MUTED} />
                      <Text style={[styles.optionChipText, payInformation.benefits.includes(benefit.value) && styles.optionChipTextActive]}>
                        {benefit.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Negotiable Switch */}
              <View style={styles.switchRow}>
                <Text style={styles.label}>Negotiable</Text>
                <Switch
                  value={payInformation.negotiable}
                  onValueChange={(value) => setPayInformation({ ...payInformation, negotiable: value })}
                  trackColor={{ false: '#E5E7EB', true: GREEN_MID }}
                  thumbColor={payInformation.negotiable ? GREEN_DARK : '#9CA3AF'}
                />
              </View>

              {/* ===== LOCATION INFORMATION ===== */}
              {(workSetup === 'onsite' || workSetup === 'hybrid') && (
                <>
                  <Text style={styles.subSectionTitle}>Location Information</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Specific Area</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="location-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Cainta, Ortigas, Makati"
                        placeholderTextColor={TEXT_LIGHT}
                        value={location.specific_area}
                        onChangeText={(text) => setLocation({ ...location, specific_area: text })}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>City</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="business-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="City"
                        placeholderTextColor={TEXT_LIGHT}
                        value={location.city}
                        onChangeText={(text) => setLocation({ ...location, city: text })}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Work Address</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="navigate-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Complete work address"
                        placeholderTextColor={TEXT_LIGHT}
                        value={location.work_address}
                        onChangeText={(text) => setLocation({ ...location, work_address: text })}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* ===== REQUIREMENTS ===== */}
              <Text style={styles.subSectionTitle}>Requirements</Text>

              {/* Min Years Experience */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Minimum Years of Experience</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="bar-chart-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2"
                    placeholderTextColor={TEXT_LIGHT}
                    value={requirements.min_years_experience}
                    onChangeText={(text) => setRequirements({ ...requirements, min_years_experience: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Preferred Tools */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Preferred Tools</Text>
                <View style={styles.skillInputWrapper}>
                  <TextInput
                    style={styles.skillInput}
                    placeholder="Type a tool and press +"
                    placeholderTextColor={TEXT_LIGHT}
                    value={toolInput}
                    onChangeText={setToolInput}
                    onSubmitEditing={addTool}
                  />
                  <TouchableOpacity style={styles.addSkillBtn} onPress={addTool}>
                    <Ionicons name="add-circle" size={32} color={GREEN_DARK} />
                  </TouchableOpacity>
                </View>
                {requirements.preferred_tools.length > 0 && (
                  <View style={styles.skillsContainer}>
                    {requirements.preferred_tools.map((tool) => (
                      <View key={tool} style={styles.skillChip}>
                        <Ionicons name="construct-outline" size={12} color={GREEN_DARK} />
                        <Text style={styles.skillText}>{tool}</Text>
                        <TouchableOpacity onPress={() => removeTool(tool)}>
                          <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Languages Required */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Languages Required</Text>
                <View style={styles.rowInputs}>
                  <View style={[styles.inputContainer, { flex: 2 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Language"
                      placeholderTextColor={TEXT_LIGHT}
                      value={languageInput.language}
                      onChangeText={(text) => setLanguageInput({ ...languageInput, language: text })}
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1.5 }]}>
                    <TextInput
                      style={styles.input}
                                      placeholder="Proficiency"
                      placeholderTextColor={TEXT_LIGHT}
                      value={languageInput.proficiency}
                      onChangeText={(text) => setLanguageInput({ ...languageInput, proficiency: text })}
                    />
                  </View>
                  <TouchableOpacity style={styles.addSkillBtn} onPress={addLanguage}>
                    <Ionicons name="add-circle" size={32} color={GREEN_DARK} />
                  </TouchableOpacity>
                </View>
                {requirements.languages_required.length > 0 && (
                  <View style={styles.skillsContainer}>
                    {requirements.languages_required.map((lang, idx) => (
                      <View key={idx} style={styles.skillChip}>
                        <Ionicons name="language-outline" size={12} color={GREEN_DARK} />
                        <Text style={styles.skillText}>{lang.language} ({lang.proficiency})</Text>
                        <TouchableOpacity onPress={() => removeLanguage(idx)}>
                          <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Additional Requirements */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Additional Requirements</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any other requirements or special instructions..."
                    placeholderTextColor={TEXT_LIGHT}
                    value={requirements.additional_requirements}
                    onChangeText={(text) => setRequirements({ ...requirements, additional_requirements: text })}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* ===== EDUCATION REQUIREMENTS ===== */}
              <Text style={styles.subSectionTitle}>Education Requirements</Text>

              {/* Minimum Degree */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Minimum Degree</Text>
                <View style={styles.optionsRow}>
                  {DEGREE_LEVELS.map((degree) => (
                    <TouchableOpacity
                      key={degree.value}
                      style={[styles.smallChip, educationRequirements.minimum_degree === degree.value && styles.optionChipActive]}
                      onPress={() => setEducationRequirements({ ...educationRequirements, minimum_degree: degree.value })}
                    >
                      <Text style={[styles.smallChipText, educationRequirements.minimum_degree === degree.value && styles.optionChipTextActive]}>
                        {degree.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Preferred Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Preferred Field of Study</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="school-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Computer Science, Business Administration"
                    placeholderTextColor={TEXT_LIGHT}
                    value={educationRequirements.preferred_field}
                    onChangeText={(text) => setEducationRequirements({ ...educationRequirements, preferred_field: text })}
                  />
                </View>
              </View>

              {/* Required Certifications */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Required Certifications</Text>
                <View style={styles.skillInputWrapper}>
                  <TextInput
                    style={styles.skillInput}
                    placeholder="Type a certification and press +"
                    placeholderTextColor={TEXT_LIGHT}
                    value={certificationInput}
                    onChangeText={setCertificationInput}
                    onSubmitEditing={addCertification}
                  />
                  <TouchableOpacity style={styles.addSkillBtn} onPress={addCertification}>
                    <Ionicons name="add-circle" size={32} color={GREEN_DARK} />
                  </TouchableOpacity>
                </View>
                {educationRequirements.required_certifications.length > 0 && (
                  <View style={styles.skillsContainer}>
                    {educationRequirements.required_certifications.map((cert) => (
                      <View key={cert} style={styles.skillChip}>
                        <Ionicons name="ribbon-outline" size={12} color={GREEN_DARK} />
                        <Text style={styles.skillText}>{cert}</Text>
                        <TouchableOpacity onPress={() => removeCertification(cert)}>
                          <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Years in Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Years in Field</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="time-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 3"
                    placeholderTextColor={TEXT_LIGHT}
                    value={educationRequirements.years_of_experience}
                    onChangeText={(text) => setEducationRequirements({ ...educationRequirements, years_of_experience: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* ===== APPLICATION SETTINGS ===== */}
              <Text style={styles.subSectionTitle}>Application Settings</Text>

              {/* Auto Accept */}
              <View style={styles.switchRow}>
                <Text style={styles.label}>Auto Accept Applications</Text>
                <Switch
                  value={applicationSettings.auto_accept}
                  onValueChange={(value) => setApplicationSettings({ ...applicationSettings, auto_accept: value })}
                  trackColor={{ false: '#E5E7EB', true: GREEN_MID }}
                  thumbColor={applicationSettings.auto_accept ? GREEN_DARK : '#9CA3AF'}
                />
              </View>

              {/* Max Applicants */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Maximum Applicants</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="people-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor={TEXT_LIGHT}
                    value={applicationSettings.max_applicants}
                    onChangeText={(text) => setApplicationSettings({ ...applicationSettings, max_applicants: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Application Deadline */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Application Deadline (Optional)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={TEXT_LIGHT}
                    value={applicationSettings.application_deadline}
                    onChangeText={(text) => setApplicationSettings({ ...applicationSettings, application_deadline: text })}
                  />
                </View>
              </View>
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.postBtn, isLoading && styles.postBtnDisabled]} 
            onPress={handlePost}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={WHITE} size="small" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color={WHITE} />
                <Text style={styles.postBtnText}>Post Job</Text>
              </>
            )}
          </TouchableOpacity>

          {/* View My Postings Button */}
          <TouchableOpacity 
            style={styles.viewPostingsBtn}
            onPress={() => onNavigate('Mypostings')}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-outline" size={18} color={GREEN_DARK} />
            <Text style={styles.viewPostingsBtnText}>View My Job Postings</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },
  root: { flex: 1, backgroundColor: OFF_WHITE },

  // Top bar
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  logoBox: { width: 32, height: 32, backgroundColor: GREEN, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 16, fontWeight: '800', color: WHITE },
  topbarBrand: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN, letterSpacing: -0.3 },
  postingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, backgroundColor: GREEN_SOFT,
    borderWidth: 1, borderColor: GREEN_MID,
  },
  postingsBtnText: { fontSize: 12, fontWeight: '600', color: GREEN_DARK },

  scroll: { padding: 20, paddingBottom: 40 },

  // Header
  headerSection: { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: TEXT_MAIN, marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: TEXT_MUTED, lineHeight: 20 },

  // Sections
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN, marginTop: 16, marginBottom: 12 },
  subSectionTitle: { fontSize: 16, fontWeight: '600', color: TEXT_MAIN, marginTop: 16, marginBottom: 10 },

  // Tip banner
  tipBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: GREEN_SOFT, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: GREEN_MID, marginBottom: 24,
  },
  tipText: { flex: 1, fontSize: 12, color: TEXT_MUTED, lineHeight: 18 },

  // Input groups
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: TEXT_MAIN, marginBottom: 8 },
  required: { color: '#EF4444' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: TEXT_MAIN },
  textAreaContainer: { alignItems: 'flex-start' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },

  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },

  // Skills
  skillInputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skillInput: {
    flex: 1,
    backgroundColor: WHITE, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: TEXT_MAIN,
  },
  addSkillBtn: { padding: 4 },
  suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, backgroundColor: GREEN_SOFT,
    borderWidth: 0.5, borderColor: GREEN_MID,
  },
  suggestionText: { fontSize: 11, color: GREEN_DARK, fontWeight: '500' },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  skillChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, backgroundColor: GREEN_SOFT,
    borderWidth: 1, borderColor: GREEN_MID,
  },
  skillText: { fontSize: 12, color: GREEN_DARK, fontWeight: '600' },

  // Options
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: WHITE,
  },
  smallChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: WHITE,
  },
  smallChipText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '500' },
  optionChipActive: { backgroundColor: GREEN_SOFT, borderColor: GREEN_DARK },
  optionChipText: { fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
  optionChipTextActive: { color: GREEN_DARK, fontWeight: '600' },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

  // Advanced toggle
  advancedToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 16, marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  advancedToggleText: { fontSize: 13, color: GREEN_DARK, fontWeight: '600' },

  // Buttons
  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 24,
    backgroundColor: GREEN_DARK, borderRadius: 14, paddingVertical: 16,
    shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: { fontSize: 16, fontWeight: '700', color: WHITE },
  viewPostingsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 16,
    backgroundColor: GREEN_SOFT, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: GREEN_MID,
  },
  viewPostingsBtnText: { fontSize: 14, fontWeight: '600', color: GREEN_DARK },
});