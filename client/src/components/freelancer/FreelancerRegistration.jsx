import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { registerFreelancer, clearError } from '../../Redux/slices/authSlice';

// ── Vantara Design tokens (matching ClientRegistration and other screens) ──────────────────────────────────
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
const ERROR      = '#EF4444';
const ERROR_BG   = 'rgba(239,68,68,0.08)';
const ERROR_BORDER = 'rgba(239,68,68,0.3)';
// ─────────────────────────────────────────────────────────────────────────────────

export default function FreelancerRegistration({ onNavigate }) {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email_address: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    country: '',
    city: '',
    address: '',
    skills: '',
    experience_level: '',
    years_of_experience: '',
    portfolio_link: '',
    hourly_rate: '',
    fixed_rate: '',
    bio_about_me: '',
    languages: '',
    certifications: '',
    terms_accepted: false,
  });
  
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  
  const scrollViewRef = useRef();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain lowercase letters, numbers, and underscores';
    }
    if (!formData.email_address?.trim()) {
      newErrors.email_address = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email_address)) {
      newErrors.email_address = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    if (!formData.terms_accepted) {
      newErrors.terms_accepted = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setServerError(null);
    
    if (!validateForm()) {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      Alert.alert('Check your details', 'Please fix the highlighted fields before continuing.', [{ text: 'OK' }]);
      return;
    }
    
    const userData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      username: formData.username,
      email_address: formData.email_address,
      password: formData.password,
      confirm_password: formData.confirm_password,
      phone_number: formData.phone_number || null,
      country: formData.country || null,
      city: formData.city || null,
      address: formData.address || null,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
      experience_level: formData.experience_level || null,
      years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
      portfolio_link: formData.portfolio_link || null,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      fixed_rate: formData.fixed_rate ? parseFloat(formData.fixed_rate) : null,
      bio_about_me: formData.bio_about_me || null,
      languages: formData.languages ? formData.languages.split(',').map(l => l.trim()).filter(l => l) : [],
      certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()).filter(c => c) : [],
      terms_accepted: true,
    };
    
    const result = await dispatch(registerFreelancer(userData));
    
    if (registerFreelancer.fulfilled.match(result)) {
      Alert.alert(
        'Account Created!',
        result.payload.message || 'Your freelancer account is ready.',
        [
          { text: 'Stay Here', style: 'cancel' },
          { text: 'Sign In', onPress: () => { resetForm(); onNavigate('Login'); } },
        ]
      );
    } else if (registerFreelancer.rejected.match(result)) {
      const errorMessage = result.payload?.message || 'Something went wrong. Please try again.';
      setServerError(errorMessage);
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      
      if (errorMessage.toLowerCase().includes('email already exists')) {
        setErrors(prev => ({ ...prev, email_address: 'This email is already registered' }));
      } else if (errorMessage.toLowerCase().includes('username already taken')) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
      } else if (errorMessage.toLowerCase().includes('confirm password') || errorMessage.toLowerCase().includes('passwords do not match')) {
        setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match' }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      username: '',
      email_address: '',
      phone_number: '',
      password: '',
      confirm_password: '',
      country: '',
      city: '',
      address: '',
      skills: '',
      experience_level: '',
      years_of_experience: '',
      portfolio_link: '',
      hourly_rate: '',
      fixed_rate: '',
      bio_about_me: '',
      languages: '',
      certifications: '',
      terms_accepted: false,
    });
    setErrors({});
    setServerError(null);
  };

  const handleAcceptTerms = () => {
    setFormData(prev => ({ ...prev, terms_accepted: true }));
    setShowTermsModal(false);
  };

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    if (serverError) setServerError(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms and Conditions</Text>
              <TouchableOpacity 
                onPress={() => setShowTermsModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.termsText}>
                <Text style={styles.termsHeading}>1. Acceptance of Terms{'\n\n'}</Text>
                By registering as a Freelancer on Taskra, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.

                {'\n\n'}<Text style={styles.termsHeading}>2. Freelancer Responsibilities{'\n\n'}</Text>
                • You agree to provide accurate and complete information when creating your account.
                • You are responsible for maintaining the confidentiality of your account credentials.
                • You agree to deliver quality work within agreed timelines.
                • You will not submit false or misleading proposals.

                {'\n\n'}<Text style={styles.termsHeading}>3. Payment Terms{'\n\n'}</Text>
                • Taskra facilitates secure payments between clients and freelancers.
                • A service fee may be deducted from each completed transaction.
                • You must submit accurate invoices for work completed.
                • Disputes will be reviewed by our team and resolved fairly.

                {'\n\n'}<Text style={styles.termsHeading}>4. Work Guidelines{'\n\n'}</Text>
                • All work must be original and not plagiarized.
                • Deliverables must meet the agreed specifications.
                • Communicate clearly and professionally with clients.
                • Respect intellectual property rights and confidentiality.

                {'\n\n'}<Text style={styles.termsHeading}>5. Code of Conduct{'\n\n'}</Text>
                • Treat clients with respect and professionalism.
                • Provide accurate time estimates and updates.
                • Do not share client confidential information.
                • Report any violations or suspicious activities.

                {'\n\n'}<Text style={styles.termsHeading}>6. Account Termination{'\n\n'}</Text>
                Taskra reserves the right to suspend or terminate accounts that violate these terms, deliver poor quality work, or harm the platform's integrity.

                {'\n\n'}<Text style={styles.termsHeading}>7. Privacy Policy{'\n\n'}</Text>
                Your personal information is protected according to our Privacy Policy. Your profile information will be visible to potential clients.

                {'\n\n'}<Text style={styles.termsHeading}>8. Limitation of Liability{'\n\n'}</Text>
                Taskra acts as an intermediary and is not responsible for disputes between parties. We provide dispute resolution services but do not guarantee outcomes.

                {'\n\n'}<Text style={styles.termsHeading}>9. Modifications{'\n\n'}</Text>
                We may update these terms from time to time. Continued use of the platform constitutes acceptance of modified terms.

                {'\n\n'}<Text style={styles.termsHeading}>10. Contact Information{'\n\n'}</Text>
                For questions about these terms, contact us at: support@taskra.com

                {'\n\n'}<Text style={styles.termsEffective}>Effective Date: January 1, 2024</Text>
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonAccept}
                onPress={handleAcceptTerms}
              >
                <Text style={styles.modalButtonAcceptText}>Accept Terms</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => onNavigate('RoleSelection')}
            >
              <View style={styles.backIconWrap}>
                <Ionicons name="arrow-back" size={18} color={BLUE} />
              </View>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.roleBadge}>
                <Ionicons name="briefcase-outline" size={16} color={BLUE} />
                <Text style={styles.roleBadgeText}>Freelancer Registration</Text>
              </View>
              <Text style={styles.title}>Start Your{'\n'}Freelance Journey</Text>
              <Text style={styles.subtitle}>
                Showcase your skills and find great opportunities
              </Text>
            </View>

            {/* Server Error Display */}
            {serverError && (
              <View style={styles.serverErrorContainer}>
                <View style={styles.serverErrorIcon}>
                  <Ionicons name="alert-circle" size={18} color={ERROR} />
                </View>
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            <View style={styles.form}>
              {/* Section: Personal Info */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Personal Information</Text>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.input, errors.first_name && styles.inputError]}
                      placeholder="First name"
                      placeholderTextColor={TEXT_LIGHT}
                      value={formData.first_name}
                      onChangeText={(text) => updateField('first_name', text)}
                    />
                    {errors.first_name && <Text style={styles.fieldErrorText}>{errors.first_name}</Text>}
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.input, errors.last_name && styles.inputError]}
                      placeholder="Last name"
                      placeholderTextColor={TEXT_LIGHT}
                      value={formData.last_name}
                      onChangeText={(text) => updateField('last_name', text)}
                    />
                    {errors.last_name && <Text style={styles.fieldErrorText}>{errors.last_name}</Text>}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.username && styles.inputError]}
                    placeholder="Choose a username"
                    placeholderTextColor={TEXT_LIGHT}
                    autoCapitalize="none"
                    value={formData.username}
                    onChangeText={(text) => updateField('username', text.toLowerCase().replace(/\s/g, ''))}
                  />
                  {errors.username && <Text style={styles.fieldErrorText}>{errors.username}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.email_address && styles.inputError]}
                    placeholder="you@example.com"
                    placeholderTextColor={TEXT_LIGHT}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email_address}
                    onChangeText={(text) => updateField('email_address', text)}
                  />
                  {errors.email_address && <Text style={styles.fieldErrorText}>{errors.email_address}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+63 (optional)"
                    placeholderTextColor={TEXT_LIGHT}
                    keyboardType="phone-pad"
                    value={formData.phone_number}
                    onChangeText={(text) => updateField('phone_number', text)}
                  />
                </View>
              </View>

              {/* Section: Location */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Location</Text>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Country</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Country"
                      placeholderTextColor={TEXT_LIGHT}
                      value={formData.country}
                      onChangeText={(text) => updateField('country', text)}
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="City"
                      placeholderTextColor={TEXT_LIGHT}
                      value={formData.city}
                      onChangeText={(text) => updateField('city', text)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Your street address (optional)"
                    placeholderTextColor={TEXT_LIGHT}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={formData.address}
                    onChangeText={(text) => updateField('address', text)}
                  />
                </View>
              </View>

              {/* Section: Professional Info */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Professional Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Skills</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="React Native, Node.js, UI/UX Design"
                    placeholderTextColor={TEXT_LIGHT}
                    value={formData.skills}
                    onChangeText={(text) => updateField('skills', text)}
                  />
                  <Text style={styles.hintText}>Separate multiple skills with commas</Text>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Experience Level</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Entry, Junior, Mid, Senior"
                      placeholderTextColor={TEXT_LIGHT}
                      value={formData.experience_level}
                      onChangeText={(text) => updateField('experience_level', text)}
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Years of Experience</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Years"
                      placeholderTextColor={TEXT_LIGHT}
                      keyboardType="numeric"
                      value={formData.years_of_experience}
                      onChangeText={(text) => updateField('years_of_experience', text)}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Hourly Rate (PHP)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Hourly rate"
                      placeholderTextColor={TEXT_LIGHT}
                      keyboardType="numeric"
                      value={formData.hourly_rate}
                      onChangeText={(text) => updateField('hourly_rate', text)}
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Fixed Rate (PHP)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Fixed rate"
                      placeholderTextColor={TEXT_LIGHT}
                      keyboardType="numeric"
                      value={formData.fixed_rate}
                      onChangeText={(text) => updateField('fixed_rate', text)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Portfolio URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://your-portfolio.com"
                    placeholderTextColor={TEXT_LIGHT}
                    autoCapitalize="none"
                    value={formData.portfolio_link}
                    onChangeText={(text) => updateField('portfolio_link', text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bio / About Me</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Tell us about yourself, your expertise, and what makes you unique..."
                    placeholderTextColor={TEXT_LIGHT}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={formData.bio_about_me}
                    onChangeText={(text) => updateField('bio_about_me', text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Languages</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="English, Filipino, Spanish"
                    placeholderTextColor={TEXT_LIGHT}
                    value={formData.languages}
                    onChangeText={(text) => updateField('languages', text)}
                  />
                  <Text style={styles.hintText}>Separate multiple languages with commas</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Certifications</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="AWS Certified, Google UX Certificate"
                    placeholderTextColor={TEXT_LIGHT}
                    value={formData.certifications}
                    onChangeText={(text) => updateField('certifications', text)}
                  />
                  <Text style={styles.hintText}>Separate multiple certifications with commas</Text>
                </View>
              </View>

              {/* Section: Security */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Security</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
                  <View style={styles.passwordWrap}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={TEXT_LIGHT}
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(text) => updateField('password', text)}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={TEXT_LIGHT}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.fieldErrorText}>{errors.password}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
                  <View style={styles.passwordWrap}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.confirm_password && styles.inputError]}
                      placeholder="Repeat password"
                      placeholderTextColor={TEXT_LIGHT}
                      secureTextEntry={!showConfirmPassword}
                      value={formData.confirm_password}
                      onChangeText={(text) => updateField('confirm_password', text)}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={TEXT_LIGHT}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirm_password && <Text style={styles.fieldErrorText}>{errors.confirm_password}</Text>}
                </View>
              </View>

              {/* Terms */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => updateField('terms_accepted', !formData.terms_accepted)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, formData.terms_accepted && styles.checkboxChecked]}>
                  {formData.terms_accepted && (
                    <Ionicons name="checkmark" size={14} color={WHITE} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  I accept the{' '}
                  <Text 
                    style={styles.checkboxLink}
                    onPress={() => setShowTermsModal(true)}
                  >
                    Terms and Conditions
                  </Text>
                  <Text style={styles.required}> *</Text>
                </Text>
              </TouchableOpacity>
              {errors.terms_accepted && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={12} color={ERROR} />
                  <Text style={styles.fieldErrorText}>{errors.terms_accepted}</Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={18} color={WHITE} style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Create Freelancer Account</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info strip */}
              <View style={styles.infoStrip}>
                <Ionicons name="shield-checkmark-outline" size={14} color={BLUE} />
                <Text style={styles.infoText}>Free to join · No hidden fees · Secure payments</Text>
              </View>

              {/* Sign in link */}
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => onNavigate('Login')}>
                  <Text style={styles.loginPromptLink}> Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48 },
  container: { flex: 1 },

  // Back
  backButton: { marginBottom: 24, alignSelf: 'flex-start' },
  backIconWrap: {
    width: 38, height: 38,
    backgroundColor: CARD,
    borderRadius: 11,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 28 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${BLUE}10`,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1, borderColor: `${BLUE}20`,
    marginBottom: 16,
  },
  roleBadgeText: { fontSize: 13, color: BLUE, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: TEXT_MAIN, textAlign: 'center', letterSpacing: -0.5, lineHeight: 34, marginBottom: 8 },
  subtitle: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center' },

  // Server error
  serverErrorContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: ERROR_BG,
    borderRadius: 12, padding: 14,
    marginBottom: 20, gap: 10,
    borderWidth: 1, borderColor: ERROR_BORDER,
  },
  serverErrorIcon: {
    width: 32, height: 32,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  serverErrorText: { fontSize: 13, color: ERROR, flex: 1, lineHeight: 18 },

  // Form layout
  form: { gap: 0 },
  section: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1.5, borderColor: BORDER,
    padding: 18,
    marginBottom: 14,
    gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: BLUE,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 2,
  },
  row: { flexDirection: 'row' },

  // Inputs
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: TEXT_MAIN },
  required: { color: ERROR },
  input: {
    backgroundColor: BG,
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: TEXT_MAIN,
  },
  textArea: { minHeight: 90 },
  inputError: { borderColor: ERROR },
  hintText: { fontSize: 11, color: TEXT_LIGHT, marginTop: 4 },

  // Field error
  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  fieldErrorText: { fontSize: 11, color: ERROR },

  // Password
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 46 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD,
    borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    padding: 14, marginBottom: 6,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 7,
    borderWidth: 2, borderColor: `${BLUE}40`,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: BG,
  },
  checkboxChecked: { backgroundColor: BLUE, borderColor: BLUE },
  checkboxLabel: { fontSize: 14, color: TEXT_MUTED, flex: 1 },
  checkboxLink: { color: BLUE, fontWeight: '700' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7,26,62,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: CARD,
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  modalClose: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    maxHeight: '70%',
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_MUTED,
  },
  termsHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  termsEffective: {
    fontSize: 12,
    color: BLUE,
    fontWeight: '600',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  modalButtonAccept: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: 'center',
  },
  modalButtonAcceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },

  // Submit button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: BLUE,
    borderRadius: 14, paddingVertical: 16,
    marginTop: 8, marginBottom: 14,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: WHITE, letterSpacing: 0.2 },

  // Info strip
  infoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: 4,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: `${BLUE}08`,
    borderRadius: 12, borderWidth: 1, borderColor: `${BLUE}20`,
  },
  infoText: { fontSize: 12, color: BLUE, fontWeight: '500' },

  // Login prompt
  loginPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, paddingBottom: 8 },
  loginPromptText: { fontSize: 14, color: TEXT_MUTED },
  loginPromptLink: { fontSize: 14, color: BLUE, fontWeight: '700' },
});