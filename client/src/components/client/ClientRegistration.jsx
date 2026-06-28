import React, { useState, useRef, useEffect } from 'react';
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
  BackHandler,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { 
  registerClient, 
  verifyEmail,
  resendVerification,
  clearError 
} from '../../Redux/slices/authSlice';

// ── Vantara Design tokens ──────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────────

export default function ClientRegistration({ onNavigate }) {
  const dispatch = useDispatch();
  const { isLoading, error, requiresVerification, verificationEmail } = useSelector((state) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [clientType, setClientType] = useState('personal'); // 'personal' or 'business'
  
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
    // Business fields
    company_name: '',
    company_website: '',
    industry: '',
    company_size: '',
    company_registration_number: '',
    tax_id: '',
    terms_accepted: false,
  });
  
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  
  const scrollViewRef = useRef();
  const inputRefs = useRef([]);

  // ── Hardware Back Button Handler (Android) ──────────────────────────────
  useEffect(() => {
    const backAction = () => {
      if (showVerificationModal) {
        Alert.alert(
          'Cancel Verification?',
          'You will need to verify your email to access your account.',
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Cancel',
              style: 'destructive',
              onPress: () => {
                setShowVerificationModal(false);
                resetForm();
              },
            },
          ]
        );
        return true;
      }

      if (showTermsModal) {
        setShowTermsModal(false);
        return true;
      }

      onNavigate('RoleSelection');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showVerificationModal, showTermsModal]);

  // ── Countdown timer for resend ───────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Auto-show verification modal when registration requires verification ──
  useEffect(() => {
    if (requiresVerification && verificationEmail) {
      setShowVerificationModal(true);
      startCountdown();
    }
  }, [requiresVerification, verificationEmail]);

  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
  };

  // ── Image Picker ──────────────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setProfileImage({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        fileName: asset.fileName || `profile_${Date.now()}.jpg`,
        width: asset.width,
        height: asset.height,
      });
    }
  };

  const removeImage = () => {
    setProfileImage(null);
  };

  // ── Form Validation ──────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
    
    // Personal info validation (always required)
    if (!formData.first_name?.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name?.trim())  newErrors.last_name  = 'Last name is required';
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
    
    // Business client validation
    if (clientType === 'business') {
      if (!formData.company_name?.trim()) {
        newErrors.company_name = 'Company name is required for business accounts';
      }
      if (!formData.industry?.trim()) {
        newErrors.industry = 'Industry is required for business accounts';
      }
      if (!formData.company_size?.trim()) {
        newErrors.company_size = 'Company size is required for business accounts';
      }
    }
    
    if (!formData.terms_accepted) newErrors.terms_accepted = 'You must accept the terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Registration Handler ─────────────────────────────────────────────────
  const handleRegister = async () => {
    setServerError(null);
    
    if (!validateForm()) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
      profile_picture: profileImage,
      terms_accepted: true,
      client_type: clientType,
    };
    
    // Add business-specific fields if business client
    if (clientType === 'business') {
      userData.company_name = formData.company_name || null;
      userData.company_website = formData.company_website || null;
      userData.industry = formData.industry || null;
      userData.company_size = formData.company_size || null;
      userData.company_registration_number = formData.company_registration_number || null;
      userData.tax_id = formData.tax_id || null;
    }
    
    const result = await dispatch(registerClient(userData));
    
    if (registerClient.fulfilled.match(result)) {
      if (result.payload?.requires_verification) {
        Alert.alert(
          'Verification Required',
          'Please check your email for the verification code.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Account Created!',
          result.payload.message || 'Your client account is ready.',
          [
            { text: 'Stay Here', style: 'cancel' },
            { text: 'Sign In', onPress: () => { resetForm(); onNavigate('Login'); } },
          ]
        );
      }
    } else if (registerClient.rejected.match(result)) {
      const errorMessage = result.payload?.message || 'Something went wrong. Please try again.';
      setServerError(errorMessage);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      
      if (errorMessage.toLowerCase().includes('email already exists')) {
        setErrors(prev => ({ ...prev, email_address: 'This email is already registered' }));
      } else if (errorMessage.toLowerCase().includes('username already taken')) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
      } else if (errorMessage.toLowerCase().includes('confirm password') || errorMessage.toLowerCase().includes('passwords do not match')) {
        setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match' }));
      }
      
      Alert.alert('Registration Failed', errorMessage, [{ text: 'OK' }]);
    }
  };

  // ── Verification Handlers ─────────────────────────────────────────────────
  const handleVerifyEmail = async () => {
    const code = verificationCode.join('');
    if (code.length < 6) {
      Alert.alert('Incomplete Code', 'Please enter all 6 digits of the verification code.');
      return;
    }

    const result = await dispatch(verifyEmail({ email: verificationEmail, code }));

    if (verifyEmail.fulfilled.match(result)) {
      setShowVerificationModal(false);
      setVerificationCode(['', '', '', '', '', '']);
      Alert.alert(
        'Email Verified! 🎉',
        'Your account has been verified. You can now sign in.',
        [{ text: 'Sign In', onPress: () => { resetForm(); onNavigate('Login'); } }]
      );
    } else if (verifyEmail.rejected.match(result)) {
      const msg = result.payload?.message || 'Invalid verification code. Please try again.';
      Alert.alert('Verification Failed', msg);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    const result = await dispatch(resendVerification(verificationEmail));
    if (resendVerification.fulfilled.match(result)) {
      startCountdown();
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } else if (resendVerification.rejected.match(result)) {
      const msg = result.payload?.message || 'Failed to resend code. Please try again.';
      Alert.alert('Error', msg);
    }
  };

  const handleVerificationCodeChange = (text, index) => {
    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);
    if (text && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleVerificationKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '', last_name: '', username: '', email_address: '',
      phone_number: '', password: '', confirm_password: '', country: '',
      city: '', address: '', company_name: '', company_website: '',
      industry: '', company_size: '', company_registration_number: '',
      tax_id: '', terms_accepted: false,
    });
    setErrors({});
    setServerError(null);
    setVerificationCode(['', '', '', '', '', '']);
    setShowVerificationModal(false);
    setProfileImage(null);
    setClientType('personal');
  };

  const handleAcceptTerms = () => {
    setFormData(prev => ({ ...prev, terms_accepted: true }));
    setShowTermsModal(false);
  };

  React.useEffect(() => () => { dispatch(clearError()); }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    if (serverError) setServerError(null);
  };

  const selectClientType = (type) => {
    setClientType(type);
    // Clear business-related errors when switching to personal
    if (type === 'personal') {
      setErrors(prev => ({
        ...prev,
        company_name: null,
        industry: null,
        company_size: null,
        company_registration_number: null,
        tax_id: null,
      }));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Verification Modal ── */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.verificationModalContainer}>
            <View style={styles.verificationHeader}>
              <View style={styles.verificationIconContainer}>
                <Ionicons name="mail-outline" size={40} color={BLUE} />
              </View>
              <Text style={styles.verificationTitle}>Verify Your Email</Text>
              <Text style={styles.verificationSubtitle}>
                We've sent a 6-digit verification code to{'\n'}
                <Text style={styles.verificationEmail}>{verificationEmail}</Text>
              </Text>
            </View>

            <View style={styles.verificationCodeContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => (inputRefs.current[index] = ref)}
                  style={styles.verificationInput}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleVerificationCodeChange(text, index)}
                  onKeyPress={(e) => handleVerificationKeyPress(e, index)}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyEmail}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color={WHITE} />
                : <Text style={styles.verifyButtonText}>Verify Email</Text>
              }
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableOpacity onPress={handleResendCode} disabled={!canResend || isLoading}>
                <Text style={[styles.resendLink, !canResend && styles.resendLinkDisabled]}>
                  {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.verificationClose}
              onPress={() => {
                Alert.alert(
                  'Cancel Verification?',
                  'You will need to verify your email to access your account.',
                  [
                    { text: 'Stay', style: 'cancel' },
                    {
                      text: 'Cancel',
                      style: 'destructive',
                      onPress: () => { setShowVerificationModal(false); resetForm(); }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.verificationCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Terms Modal ── */}
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
              <TouchableOpacity onPress={() => setShowTermsModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.termsText}>
                <Text style={styles.termsHeading}>1. Acceptance of Terms{'\n\n'}</Text>
                By registering as a Client on Taskra, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.

                {'\n\n'}<Text style={styles.termsHeading}>2. Client Responsibilities{'\n\n'}</Text>
                • You agree to provide accurate and complete information when creating your account.{'\n'}
                • You are responsible for maintaining the confidentiality of your account credentials.{'\n'}
                • You agree to provide clear project requirements and timely feedback.{'\n'}
                • You will not submit false or misleading job postings.

                {'\n\n'}<Text style={styles.termsHeading}>3. Payment Terms{'\n\n'}</Text>
                • Taskra facilitates secure payments between clients and freelancers.{'\n'}
                • A service fee may be deducted from each completed transaction.{'\n'}
                • You agree to pay freelancers for completed work as agreed.{'\n'}
                • Disputes will be reviewed by our team and resolved fairly.

                {'\n\n'}<Text style={styles.termsHeading}>4. Project Guidelines{'\n\n'}</Text>
                • Provide clear and detailed project descriptions.{'\n'}
                • Respond to freelancer inquiries in a timely manner.{'\n'}
                • Review deliverables promptly and provide constructive feedback.{'\n'}
                • Respect intellectual property rights and confidentiality.

                {'\n\n'}<Text style={styles.termsHeading}>5. Code of Conduct{'\n\n'}</Text>
                • Treat freelancers with respect and professionalism.{'\n'}
                • Provide honest and timely feedback on deliverables.{'\n'}
                • Do not share confidential freelancer information.{'\n'}
                • Report any violations or suspicious activities.

                {'\n\n'}<Text style={styles.termsHeading}>6. Account Termination{'\n\n'}</Text>
                Taskra reserves the right to suspend or terminate accounts that violate these terms, provide false information, or harm the platform's integrity.

                {'\n\n'}<Text style={styles.termsHeading}>7. Privacy Policy{'\n\n'}</Text>
                Your personal information is protected according to our Privacy Policy. Your profile information will be visible to freelancers.

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
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowTermsModal(false)}>
                <Text style={styles.modalButtonCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonAccept} onPress={handleAcceptTerms}>
                <Text style={styles.modalButtonAcceptText}>Accept Terms</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Main Registration Form ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
                <Ionicons name="business-outline" size={16} color={BLUE} />
                <Text style={styles.roleBadgeText}>Client Registration</Text>
              </View>
              <Text style={styles.title}>Join as a{'\n'}Client</Text>
              <Text style={styles.subtitle}>
                Find talented freelancers and grow your business
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
              {/* ── Profile Picture Section ── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Profile Picture</Text>
                
                <View style={styles.profilePictureContainer}>
                  {profileImage ? (
                    <View style={styles.profileImageWrapper}>
                      <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
                      <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                        <Ionicons name="close-circle" size={24} color={ERROR} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                      <Ionicons name="camera-outline" size={32} color={BLUE} />
                      <Text style={styles.uploadButtonText}>Upload Profile Photo</Text>
                      <Text style={styles.uploadButtonSubtext}>JPG, PNG • Max 5MB</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* ── Client Type Selection ── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Account Type</Text>
                <Text style={styles.clientTypeSubtext}>
                  Choose how you want to use Taskra
                </Text>
                
                <View style={styles.clientTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.clientTypeOption,
                      clientType === 'personal' && styles.clientTypeOptionActive,
                    ]}
                    onPress={() => selectClientType('personal')}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.clientTypeIcon,
                      clientType === 'personal' && styles.clientTypeIconActive,
                    ]}>
                      <Ionicons 
                        name="person-outline" 
                        size={24} 
                        color={clientType === 'personal' ? WHITE : BLUE} 
                      />
                    </View>
                    <Text style={[
                      styles.clientTypeLabel,
                      clientType === 'personal' && styles.clientTypeLabelActive,
                    ]}>
                      Personal Client
                    </Text>
                    <Text style={styles.clientTypeDescription}>
                      Hire freelancers for personal projects
                    </Text>
                    {clientType === 'personal' && (
                      <View style={styles.clientTypeCheck}>
                        <Ionicons name="checkmark-circle" size={20} color={BLUE} />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.clientTypeOption,
                      clientType === 'business' && styles.clientTypeOptionActive,
                    ]}
                    onPress={() => selectClientType('business')}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.clientTypeIcon,
                      clientType === 'business' && styles.clientTypeIconActive,
                    ]}>
                      <Ionicons 
                        name="business-outline" 
                        size={24} 
                        color={clientType === 'business' ? WHITE : BLUE} 
                      />
                    </View>
                    <Text style={[
                      styles.clientTypeLabel,
                      clientType === 'business' && styles.clientTypeLabelActive,
                    ]}>
                      Business Client
                    </Text>
                    <Text style={styles.clientTypeDescription}>
                      Hire for your company or organization
                    </Text>
                    {clientType === 'business' && (
                      <View style={styles.clientTypeCheck}>
                        <Ionicons name="checkmark-circle" size={20} color={BLUE} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Personal Information ── */}
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

              {/* ── Business Information (ONLY shows when Business is selected) ── */}
              {clientType === 'business' && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Business Information</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Company Name <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.input, errors.company_name && styles.inputError]}
                      placeholder="Your company name"
                      placeholderTextColor={TEXT_LIGHT}
                      value={formData.company_name}
                      onChangeText={(text) => updateField('company_name', text)}
                    />
                    {errors.company_name && <Text style={styles.fieldErrorText}>{errors.company_name}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Company Website</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="https://your-company.com (optional)"
                      placeholderTextColor={TEXT_LIGHT}
                      autoCapitalize="none"
                      value={formData.company_website}
                      onChangeText={(text) => updateField('company_website', text)}
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Industry <Text style={styles.required}>*</Text></Text>
                      <TextInput
                        style={[styles.input, errors.industry && styles.inputError]}
                        placeholder="e.g., Technology, Healthcare"
                        placeholderTextColor={TEXT_LIGHT}
                        value={formData.industry}
                        onChangeText={(text) => updateField('industry', text)}
                      />
                      {errors.industry && <Text style={styles.fieldErrorText}>{errors.industry}</Text>}
                    </View>
                    
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Company Size <Text style={styles.required}>*</Text></Text>
                      <TextInput
                        style={[styles.input, errors.company_size && styles.inputError]}
                        placeholder="e.g., 1-10, 50-100"
                        placeholderTextColor={TEXT_LIGHT}
                        value={formData.company_size}
                        onChangeText={(text) => updateField('company_size', text)}
                      />
                      {errors.company_size && <Text style={styles.fieldErrorText}>{errors.company_size}</Text>}
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Registration Number</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Company reg. number (optional)"
                        placeholderTextColor={TEXT_LIGHT}
                        value={formData.company_registration_number}
                        onChangeText={(text) => updateField('company_registration_number', text)}
                      />
                    </View>
                    
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Tax ID</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Tax ID (optional)"
                        placeholderTextColor={TEXT_LIGHT}
                        value={formData.tax_id}
                        onChangeText={(text) => updateField('tax_id', text)}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* ── Location ── */}
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

              {/* ── Security ── */}
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
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_LIGHT} />
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
                      <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_LIGHT} />
                    </TouchableOpacity>
                  </View>
                  {errors.confirm_password && <Text style={styles.fieldErrorText}>{errors.confirm_password}</Text>}
                </View>
              </View>

              {/* ── Terms ── */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => updateField('terms_accepted', !formData.terms_accepted)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, formData.terms_accepted && styles.checkboxChecked]}>
                  {formData.terms_accepted && <Ionicons name="checkmark" size={14} color={WHITE} />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I accept the{' '}
                  <Text style={styles.checkboxLink} onPress={() => setShowTermsModal(true)}>
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

              {/* ── Submit Button ── */}
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
                    <Ionicons 
                      name={clientType === 'business' ? 'business-outline' : 'person-outline'} 
                      size={18} 
                      color={WHITE} 
                      style={{ marginRight: 8 }} 
                    />
                    <Text style={styles.submitBtnText}>
                      {clientType === 'business' ? 'Create Business Account' : 'Create Personal Account'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* ── Info Strip ── */}
              <View style={styles.infoStrip}>
                <Ionicons name="shield-checkmark-outline" size={14} color={BLUE} />
                <Text style={styles.infoText}>Free to join · No hidden fees · Find top talent</Text>
              </View>

              {/* ── Sign in link ── */}
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

  // Client Type Styles
  clientTypeSubtext: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  clientTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  clientTypeOption: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BORDER,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  clientTypeOptionActive: {
    borderColor: BLUE,
    backgroundColor: `${BLUE}05`,
  },
  clientTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${BLUE}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  clientTypeIconActive: {
    backgroundColor: BLUE,
  },
  clientTypeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  clientTypeLabelActive: {
    color: BLUE,
  },
  clientTypeDescription: {
    fontSize: 11,
    color: TEXT_LIGHT,
    textAlign: 'center',
  },
  clientTypeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // Profile Picture
  profilePictureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  profileImageWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: BLUE,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: WHITE,
    borderRadius: 12,
  },
  uploadButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${BLUE}08`,
    borderWidth: 2,
    borderColor: `${BLUE}30`,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BLUE,
    marginTop: 8,
    textAlign: 'center',
  },
  uploadButtonSubtext: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginTop: 2,
    textAlign: 'center',
  },

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

  // Verification Modal Styles
  verificationHeader: { alignItems: 'center', marginBottom: 4 },
  verificationModalContainer: {
    backgroundColor: CARD,
    borderRadius: 24,
    width: '90%',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  verificationIconContainer: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: `${BLUE}15`,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  verificationTitle: { fontSize: 22, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8 },
  verificationSubtitle: {
    fontSize: 14, color: TEXT_MUTED, textAlign: 'center',
    marginBottom: 24, lineHeight: 20,
  },
  verificationEmail: { color: BLUE, fontWeight: '600' },
  verificationCodeContainer: {
    flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28,
  },
  verificationInput: {
    width: 44, height: 56,
    backgroundColor: BG,
    borderWidth: 2, borderColor: BORDER,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22, fontWeight: '600', color: TEXT_MAIN,
  },
  verifyButton: {
    backgroundColor: BLUE,
    borderRadius: 14, paddingVertical: 14,
    width: '100%', alignItems: 'center',
    marginBottom: 16,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  verifyButtonText: { fontSize: 16, fontWeight: '700', color: WHITE },
  resendContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  resendText: { fontSize: 13, color: TEXT_MUTED },
  resendLink: { fontSize: 13, color: BLUE, fontWeight: '600' },
  resendLinkDisabled: { color: TEXT_LIGHT },
  verificationClose: { paddingVertical: 8 },
  verificationCloseText: { fontSize: 14, color: TEXT_MUTED, fontWeight: '500' },

  // Terms Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7,26,62,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: CARD, borderRadius: 20,
    width: '90%', maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: CARD,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: TEXT_MAIN },
  modalClose: { padding: 4 },
  modalContent: { padding: 20, maxHeight: '70%' },
  termsText: { fontSize: 14, lineHeight: 22, color: TEXT_MUTED },
  termsHeading: { fontSize: 16, fontWeight: '700', color: TEXT_MAIN },
  termsEffective: { fontSize: 12, color: BLUE, fontWeight: '600', marginTop: 8 },
  modalFooter: {
    flexDirection: 'row', padding: 20,
    borderTopWidth: 1, borderTopColor: BORDER, gap: 12,
  },
  modalButtonCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: BORDER, alignItems: 'center',
  },
  modalButtonCancelText: { fontSize: 14, fontWeight: '600', color: TEXT_MUTED },
  modalButtonAccept: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: BLUE, alignItems: 'center',
  },
  modalButtonAcceptText: { fontSize: 14, fontWeight: '700', color: WHITE },

  // Submit button
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: BLUE,
    borderRadius: 14, paddingVertical: 16,
    marginTop: 8, marginBottom: 14,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 6 },
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