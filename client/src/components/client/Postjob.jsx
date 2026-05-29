import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createJob } from '../../Redux/slices/jobSlice';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';

// Job Types
const JOB_TYPES = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'One Time', value: 'one_time' },
];

// Work Setup
const WORK_SETUPS = [
  { label: 'Remote', value: 'remote' },
  { label: 'Onsite', value: 'onsite' },
  { label: 'Hybrid', value: 'hybrid' },
];

// Urgency Levels
const URGENCY_LEVELS = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'Urgent', value: 'urgent' },
];

// Experience Levels
const EXPERIENCE_LEVELS = [
  { label: 'Entry', value: 'Entry' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Expert', value: 'Expert' },
  { label: 'Senior', value: 'Senior' },
];

// Budget Types
const BUDGET_TYPES = [
  { label: 'Fixed Price', value: 'fixed' },
  { label: 'Hourly Rate', value: 'hourly' },
];

// Skills suggestions
const SKILLS_SUGGESTIONS = [
  'React Native', 'JavaScript', 'Python', 'UI/UX Design',
  'Figma', 'Node.js', 'MongoDB', 'Firebase',
  'Swift', 'Kotlin', 'Flutter', 'PHP', 'Laravel',
];

export default function PostJobScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.jobs);
  const { token } = useSelector((state) => state.auth);

  // Form state
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
  };

  // Handle form submission
  const handlePost = async () => {
    // Validate required fields
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

    // Prepare job data
    const jobData = {
      title: title.trim(),
      description: description.trim(),
      required_skills: requiredSkills.length > 0 ? requiredSkills : [],
      job_type: jobType,
      work_setup: workSetup,
      urgency_level: urgencyLevel,
      experience_level: experienceLevel || null,
      budget_type: budgetType,
      budget_amount: parseFloat(budgetAmount),
      estimated_duration: estimatedDuration.trim() || null,
      contact_preference: contactPreference,
    };

    console.log('Sending job data:', JSON.stringify(jobData, null, 2));

    try {
      const result = await dispatch(createJob(jobData)).unwrap();
      console.log('Job creation success:', result);
      
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
      console.error('Job creation failed:', error);
      Alert.alert(
        'Error',
        error?.message || error?.error || 'Failed to post job. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topbar}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => onNavigate('ClientDashboard')} 
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Post a <Text style={styles.gold}>Job</Text></Text>
        <TouchableOpacity 
          style={styles.viewPostingsBtn} 
          onPress={() => onNavigate('Mypostings')} 
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={18} color={GOLD} />
          <Text style={styles.viewPostingsText}>My Posts</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        {/* Quick tip banner */}
        <View style={styles.tipBanner}>
          <Ionicons name="bulb-outline" size={16} color={GOLD} />
          <Text style={styles.tipText}>
            Tip: Add detailed description and required skills to attract the right freelancers
          </Text>
        </View>

        {/* Job Title */}
        <Text style={styles.label}>
          Job Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Senior React Native Developer"
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.label}>
          Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the job requirements, responsibilities, and deliverables..."
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
        />

        {/* Required Skills */}
        <Text style={styles.label}>Required Skills</Text>
        <View style={styles.skillInputContainer}>
          <TextInput
            style={styles.skillInput}
            placeholder="Type a skill and press +"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={skillInput}
            onChangeText={setSkillInput}
            onSubmitEditing={addSkill}
          />
          <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
            <Ionicons name="add-circle" size={32} color={GOLD} />
          </TouchableOpacity>
        </View>

        {/* Skills suggestions */}
        <View style={styles.suggestionsContainer}>
          {SKILLS_SUGGESTIONS.map((skill) => (
            <TouchableOpacity
              key={skill}
              style={styles.suggestionChip}
              onPress={() => {
                if (!requiredSkills.includes(skill)) {
                  setRequiredSkills([...requiredSkills, skill]);
                }
              }}
            >
              <Text style={styles.suggestionText}>+ {skill}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Display added skills */}
        {requiredSkills.length > 0 && (
          <View style={styles.skillsContainer}>
            {requiredSkills.map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
                <TouchableOpacity onPress={() => removeSkill(skill)}>
                  <Ionicons name="close-circle" size={16} color={BG} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Job Type */}
        <Text style={styles.label}>Job Type</Text>
        <View style={styles.chipRow}>
          {JOB_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.chip, jobType === type.value && styles.chipActive]}
              onPress={() => setJobType(type.value)}
            >
              <Text style={[styles.chipText, jobType === type.value && styles.chipTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Work Setup */}
        <Text style={styles.label}>Work Setup</Text>
        <View style={styles.chipRow}>
          {WORK_SETUPS.map((setup) => (
            <TouchableOpacity
              key={setup.value}
              style={[styles.chip, workSetup === setup.value && styles.chipActive]}
              onPress={() => setWorkSetup(setup.value)}
            >
              <Text style={[styles.chipText, workSetup === setup.value && styles.chipTextActive]}>
                {setup.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Urgency Level */}
        <Text style={styles.label}>Urgency Level</Text>
        <View style={styles.chipRow}>
          {URGENCY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[styles.chip, urgencyLevel === level.value && styles.chipActive]}
              onPress={() => setUrgencyLevel(level.value)}
            >
              <Text style={[styles.chipText, urgencyLevel === level.value && styles.chipTextActive]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Experience Level */}
        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.chipRow}>
          {EXPERIENCE_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[styles.chip, experienceLevel === level.value && styles.chipActive]}
              onPress={() => setExperienceLevel(level.value)}
            >
              <Text style={[styles.chipText, experienceLevel === level.value && styles.chipTextActive]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Budget Type */}
        <Text style={styles.label}>Budget Type</Text>
        <View style={styles.chipRow}>
          {BUDGET_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.chip, budgetType === type.value && styles.chipActive]}
              onPress={() => setBudgetType(type.value)}
            >
              <Text style={[styles.chipText, budgetType === type.value && styles.chipTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Budget Amount */}
        <Text style={styles.label}>
          Budget Amount (PHP) <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder={budgetType === 'hourly' ? 'e.g. 500 (per hour)' : 'e.g. 5000'}
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={budgetAmount}
          onChangeText={setBudgetAmount}
          keyboardType="numeric"
        />

        {/* Estimated Duration */}
        <Text style={styles.label}>Estimated Duration</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2 weeks, 1 month, etc."
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={estimatedDuration}
          onChangeText={setEstimatedDuration}
        />

        {/* Contact Preference */}
        <Text style={styles.label}>Contact Preference</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, contactPreference === 'chat' && styles.chipActive]}
            onPress={() => setContactPreference('chat')}
          >
            <Text style={[styles.chipText, contactPreference === 'chat' && styles.chipTextActive]}>
              Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, contactPreference === 'email' && styles.chipActive]}
            onPress={() => setContactPreference('email')}
          >
            <Text style={[styles.chipText, contactPreference === 'email' && styles.chipTextActive]}>
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, contactPreference === 'phone' && styles.chipActive]}
            onPress={() => setContactPreference('phone')}
          >
            <Text style={[styles.chipText, contactPreference === 'phone' && styles.chipTextActive]}>
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.postBtn, isLoading && styles.postBtnDisabled]} 
          onPress={handlePost}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#0a0a0a" size="small" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={18} color="#0a0a0a" />
              <Text style={styles.postBtnText}>Post Job</Text>
            </>
          )}
        </TouchableOpacity>

        {/* View My Postings Button */}
        <TouchableOpacity 
          style={styles.viewMyPostingsBtn}
          onPress={() => onNavigate('Mypostings')}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={18} color={GOLD} />
          <Text style={styles.viewMyPostingsText}>View My Job Postings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  viewPostingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 0.5,
    borderColor: GOLD,
  },
  viewPostingsText: {
    fontSize: 11,
    fontWeight: '600',
    color: GOLD,
  },
  topbarTitle: { fontSize: 16, fontWeight: '300', color: '#fff' },
  gold: { color: GOLD, fontStyle: 'italic', fontWeight: '400' },
  scroll: { padding: 20, paddingBottom: 50 },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212,175,55,0.08)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
  },
  label: { fontSize: 11, letterSpacing: 1.2, color: 'rgba(255,255,255,0.4)', marginBottom: 10, marginTop: 20 },
  required: { color: GOLD },
  input: {
    backgroundColor: CARD_BG, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 12,
    color: '#fff', fontSize: 14,
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: BORDER,
    backgroundColor: CARD_BG,
  },
  chipActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: GOLD },
  chipText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  chipTextActive: { color: GOLD, fontWeight: '600' },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 32,
    backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14,
  },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  viewMyPostingsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 16,
    backgroundColor: 'rgba(212,175,55,0.1)', borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  viewMyPostingsText: { fontSize: 13, fontWeight: '500', color: GOLD },
  skillInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skillInput: {
    flex: 1,
    backgroundColor: CARD_BG, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 12,
    color: '#fff', fontSize: 14,
  },
  addSkillBtn: { padding: 4 },
  suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  suggestionChip: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 0.5, borderColor: GOLD,
  },
  suggestionText: { fontSize: 10, color: GOLD },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  skillChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, backgroundColor: GOLD,
  },
  skillText: { fontSize: 12, color: BG, fontWeight: '600' },
});