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
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'react-native-image-picker';
import { registerClient, clearError } from '../../Redux/slices/authSlice';

// ── Design tokens (matches RoleSelection) ──────────────────────────────────
const GREEN      = '#4ADE80';
const GREEN_DARK = '#22C55E';
const GREEN_SOFT = '#DCFCE7';
const GREEN_MID  = '#86EFAC';
const WHITE      = '#FFFFFF';
const OFF_WHITE  = '#F0FDF4';
const BORDER     = 'rgba(74,222,128,0.25)';
const TEXT_MAIN  = '#0F2417';
const TEXT_MUTED = '#6B7280';
const ERROR      = '#EF4444';
const ERROR_BG   = 'rgba(239,68,68,0.08)';
const ERROR_BORDER = 'rgba(239,68,68,0.3)';

export default function ClientRegistration({ onNavigate }) {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicture, setProfilePicture]           = useState(null);
  const [showTermsModal, setShowTermsModal]           = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    email_address: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    country: '',
    city: '',
    address: '',
    business_type: '',
    industry: '',
    bio_about: '',
    website: '',
    budget_range: '',
    preferred_communication_method: '',
    terms_accepted: false,
  });
  const [errors, setErrors]           = useState({});
  const [serverError, setServerError] = useState(null);
  const scrollViewRef                 = useRef();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const set = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field])  setErrors(prev => ({ ...prev, [field]: null }));
    if (serverError)    setServerError(null);
  };

  const validateForm = () => {
    const e = {};
    if (!formData.first_name?.trim())      e.first_name      = 'First name is required';
    if (!formData.last_name?.trim())       e.last_name       = 'Last name is required';
    if (!formData.email_address?.trim())   e.email_address   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email_address)) e.email_address = 'Email is invalid';
    if (!formData.password)                e.password        = 'Password is required';
    else if (formData.password.length < 6) e.password        = 'Minimum 6 characters';
    if (!formData.confirm_password)        e.confirm_password = 'Please confirm your password';
    else if (formData.password !== formData.confirm_password) e.confirm_password = 'Passwords do not match';
    if (!formData.terms_accepted)          e.terms_accepted  = 'You must accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, maxWidth: 500, maxHeight: 500, includeBase64: false },
      (response) => {
        if (response.assets?.[0]) setProfilePicture(response.assets[0]);
      }
    );
  };

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
      company_name: formData.company_name || null,
      email_address: formData.email_address,
      password: formData.password,
      confirm_password: formData.confirm_password,
      phone_number: formData.phone_number || null,
      country: formData.country || null,
      city: formData.city || null,
      address: formData.address || null,
      business_type: formData.business_type || null,
      industry: formData.industry || null,
      bio_about: formData.bio_about || null,
      website: formData.website || null,
      budget_range: formData.budget_range || null,
      preferred_communication_method: formData.preferred_communication_method || null,
      terms_accepted: true,
    };
    if (profilePicture) {
      userData.profile_picture = {
        uri: profilePicture.uri,
        type: profilePicture.type || 'image/jpeg',
        fileName: profilePicture.fileName || `profile_${Date.now()}.jpg`,
      };
    }

    const result = await dispatch(registerClient(userData));

    if (registerClient.fulfilled.match(result)) {
      Alert.alert(
        'Account Created! 🎉',
        result.payload.message || 'Your client account is ready.',
        [
          { text: 'Stay Here', style: 'cancel' },
          { text: 'Sign In', onPress: () => { resetForm(); onNavigate('Login'); } },
        ]
      );
    } else if (registerClient.rejected.match(result)) {
      const msg = result.payload?.message || 'Something went wrong. Please try again.';
      setServerError(msg);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      if (msg.toLowerCase().includes('email already exists')) {
        setErrors(p => ({ ...p, email_address: 'This email is already registered' }));
      } else if (msg.toLowerCase().includes('passwords do not match')) {
        setErrors(p => ({ ...p, confirm_password: 'Passwords do not match' }));
      }
      Alert.alert('Registration Failed', msg, [{ text: 'OK' }]);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '', last_name: '', company_name: '', email_address: '',
      phone_number: '', password: '', confirm_password: '', country: '',
      city: '', address: '', business_type: '', industry: '', bio_about: '',
      website: '', budget_range: '', preferred_communication_method: '', terms_accepted: false,
    });
    setProfilePicture(null);
    setErrors({});
    setServerError(null);
  };

  const handleAcceptTerms = () => {
    set('terms_accepted', true);
    setShowTermsModal(false);
  };

  React.useEffect(() => () => { dispatch(clearError()); }, []);

  // ── Reusable field components ─────────────────────────────────────────────
  const Field = ({ label, required, error, children }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}{required && <Text style={styles.required}> *</Text>}
      </Text>
      {children}
      {error && (
        <View style={styles.fieldErrorRow}>
          <Ionicons name="alert-circle-outline" size={12} color={ERROR} />
          <Text style={styles.fieldErrorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />

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
                By registering as a Client on Taskra, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.

                {'\n\n'}<Text style={styles.termsHeading}>2. Client Responsibilities{'\n\n'}</Text>
                • You agree to provide accurate and complete information when creating your account.
                • You are responsible for maintaining the confidentiality of your account credentials.
                • You agree to post legitimate projects and pay freelancers promptly for completed work.
                • You will not post any illegal, fraudulent, or inappropriate content.

                {'\n\n'}<Text style={styles.termsHeading}>3. Payment Terms{'\n\n'}</Text>
                • Taskra facilitates secure payments between clients and freelancers.
                • A service fee may be applied to each transaction.
                • Payments are processed through our secure payment gateway.
                • Disputes will be reviewed by our team and resolved fairly.

                {'\n\n'}<Text style={styles.termsHeading}>4. Project Guidelines{'\n\n'}</Text>
                • All project descriptions must be clear and accurate.
                • Changes to project scope should be documented and agreed upon.
                • Milestones and deliverables must be clearly defined.
                • Intellectual property rights transfer upon full payment unless otherwise agreed.

                {'\n\n'}<Text style={styles.termsHeading}>5. Code of Conduct{'\n\n'}</Text>
                • Treat freelancers with respect and professionalism.
                • Provide constructive feedback and timely responses.
                • Do not request free work or speculative proposals.
                • Report any violations or suspicious activities.

                {'\n\n'}<Text style={styles.termsHeading}>6. Account Termination{'\n\n'}</Text>
                Taskra reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activities, or harm the platform's integrity.

                {'\n\n'}<Text style={styles.termsHeading}>7. Privacy Policy{'\n\n'}</Text>
                Your personal information is protected according to our Privacy Policy. We do not share your data without consent except as required by law.

                {'\n\n'}<Text style={styles.termsHeading}>8. Limitation of Liability{'\n\n'}</Text>
                Taskra acts as an intermediary and is not responsible for the quality of work or disputes between parties. We provide dispute resolution services but do not guarantee outcomes.

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
          {/* ── Back ── */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onNavigate('RoleSelection')}
          >
            <View style={styles.backIconWrap}>
              <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
            </View>
          </TouchableOpacity>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.roleBadge}>
              <Ionicons name="people-outline" size={16} color={GREEN_DARK} />
              <Text style={styles.roleBadgeText}>Client Registration</Text>
            </View>
            <Text style={styles.title}>Create Business{'\n'}Account</Text>
            <Text style={styles.subtitle}>
              Post projects and hire talented freelancers
            </Text>
          </View>

          {/* ── Server error ── */}
          {serverError && (
            <View style={styles.serverErrorBox}>
              <Ionicons name="alert-circle" size={16} color={ERROR} />
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          )}

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* Section: Profile Photo */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Profile Photo</Text>
              <View style={styles.photoRow}>
                <TouchableOpacity onPress={handleImagePick} style={styles.photoButton} activeOpacity={0.8}>
                  {profilePicture ? (
                    <Image source={{ uri: profilePicture.uri }} style={styles.photoImage} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera-outline" size={26} color={GREEN_DARK} />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.photoMeta}>
                  <Text style={styles.photoTitle}>
                    {profilePicture ? 'Photo selected' : 'Add a profile photo'}
                  </Text>
                  <Text style={styles.photoHint}>Optional · JPG or PNG</Text>
                  {profilePicture && (
                    <TouchableOpacity onPress={() => setProfilePicture(null)}>
                      <Text style={styles.photoRemove}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Section: Personal Info */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Personal Info</Text>

              <View style={styles.row}>
                <Field label="First Name" required error={errors.first_name} style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, errors.first_name && styles.inputError, { flex: 1 }]}
                    placeholder="First name"
                    placeholderTextColor={TEXT_MUTED}
                    value={formData.first_name}
                    onChangeText={t => set('first_name', t)}
                  />
                </Field>
                <View style={{ width: 12 }} />
                <Field label="Last Name" required error={errors.last_name} style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, errors.last_name && styles.inputError, { flex: 1 }]}
                    placeholder="Last name"
                    placeholderTextColor={TEXT_MUTED}
                    value={formData.last_name}
                    onChangeText={t => set('last_name', t)}
                  />
                </Field>
              </View>

              <Field label="Email Address" required error={errors.email_address}>
                <TextInput
                  style={[styles.input, errors.email_address && styles.inputError]}
                  placeholder="you@company.com"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email_address}
                  onChangeText={t => set('email_address', t)}
                />
              </Field>

              <Field label="Phone Number">
                <TextInput
                  style={styles.input}
                  placeholder="+63 (optional)"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="phone-pad"
                  value={formData.phone_number}
                  onChangeText={t => set('phone_number', t)}
                />
              </Field>
            </View>

            {/* Section: Business Details */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Business Details</Text>

              <Field label="Company Name">
                <TextInput
                  style={styles.input}
                  placeholder="Your company (optional)"
                  placeholderTextColor={TEXT_MUTED}
                  value={formData.company_name}
                  onChangeText={t => set('company_name', t)}
                />
              </Field>

              <View style={styles.row}>
                <Field label="Business Type" style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="e.g. Technology"
                    placeholderTextColor={TEXT_MUTED}
                    value={formData.business_type}
                    onChangeText={t => set('business_type', t)}
                  />
                </Field>
                <View style={{ width: 12 }} />
                <Field label="Industry" style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="e.g. Finance"
                    placeholderTextColor={TEXT_MUTED}
                    value={formData.industry}
                    onChangeText={t => set('industry', t)}
                  />
                </Field>
              </View>

              <Field label="Website">
                <TextInput
                  style={styles.input}
                  placeholder="https://yourcompany.com"
                  placeholderTextColor={TEXT_MUTED}
                  autoCapitalize="none"
                  value={formData.website}
                  onChangeText={t => set('website', t)}
                />
              </Field>

              <Field label="About Your Business">
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Briefly describe what your company does…"
                  placeholderTextColor={TEXT_MUTED}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={formData.bio_about}
                  onChangeText={t => set('bio_about', t)}
                />
              </Field>
            </View>

            {/* Section: Location */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Location</Text>

              <View style={styles.row}>
                <Field label="Country" style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Country"
                    placeholderTextColor={TEXT_MUTED}
                    value={formData.country}
                    onChangeText={t => set('country', t)}
                  />
                </Field>
                <View style={{ width: 12 }} />
                <Field label="City" style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="City"
                    placeholderTextColor={TEXT_MUTED}
                    value={formData.city}
                    onChangeText={t => set('city', t)}
                  />
                </Field>
              </View>

              <Field label="Address">
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Business address (optional)"
                  placeholderTextColor={TEXT_MUTED}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={formData.address}
                  onChangeText={t => set('address', t)}
                />
              </Field>
            </View>

            {/* Section: Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Preferences</Text>

              <Field label="Budget Range">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. ₱10,000 – ₱50,000"
                  placeholderTextColor={TEXT_MUTED}
                  value={formData.budget_range}
                  onChangeText={t => set('budget_range', t)}
                />
              </Field>

              <Field label="Preferred Communication">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Email, Phone, Video Call"
                  placeholderTextColor={TEXT_MUTED}
                  value={formData.preferred_communication_method}
                  onChangeText={t => set('preferred_communication_method', t)}
                />
              </Field>
            </View>

            {/* Section: Security */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Security</Text>

              <Field label="Password" required error={errors.password}>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={TEXT_MUTED}
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={t => set('password', t)}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={TEXT_MUTED}
                    />
                  </TouchableOpacity>
                </View>
              </Field>

              <Field label="Confirm Password" required error={errors.confirm_password}>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.confirm_password && styles.inputError]}
                    placeholder="Repeat password"
                    placeholderTextColor={TEXT_MUTED}
                    secureTextEntry={!showConfirmPassword}
                    value={formData.confirm_password}
                    onChangeText={t => set('confirm_password', t)}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(v => !v)}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={TEXT_MUTED}
                    />
                  </TouchableOpacity>
                </View>
              </Field>
            </View>

            {/* Terms */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => set('terms_accepted', !formData.terms_accepted)}
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

            {/* Submit */}
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
                  <Text style={styles.submitBtnText}>Create Client Account</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Info strip */}
            <View style={styles.infoStrip}>
              <Ionicons name="shield-checkmark-outline" size={14} color={GREEN_DARK} />
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: OFF_WHITE },
  flex:   { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48 },

  // Back
  backButton:   { marginBottom: 24, alignSelf: 'flex-start' },
  backIconWrap: {
    width: 38, height: 38,
    backgroundColor: WHITE,
    borderRadius: 11,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  // Header
  header:       { alignItems: 'center', marginBottom: 28 },
  roleBadge:    {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GREEN_SOFT,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1, borderColor: GREEN_MID,
    marginBottom: 16,
  },
  roleBadgeText: { fontSize: 13, color: GREEN_DARK, fontWeight: '600' },
  title:   { fontSize: 28, fontWeight: '800', color: TEXT_MAIN, textAlign: 'center', letterSpacing: -0.5, lineHeight: 34, marginBottom: 8 },
  subtitle: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center' },

  // Server error
  serverErrorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: ERROR_BG,
    borderWidth: 1, borderColor: ERROR_BORDER,
    borderRadius: 12, padding: 14, marginBottom: 20,
  },
  serverErrorText: { fontSize: 13, color: ERROR, flex: 1, lineHeight: 18 },

  // Form layout
  form:    { gap: 0 },
  section: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1.5, borderColor: BORDER,
    padding: 18,
    marginBottom: 14,
    gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: GREEN_DARK,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 2,
  },
  row: { flexDirection: 'row' },

  // Photo picker
  photoRow:        { flexDirection: 'row', alignItems: 'center', gap: 16 },
  photoButton:     {},
  photoImage:      { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: GREEN },
  photoPlaceholder:{
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: GREEN_SOFT,
    borderWidth: 2, borderColor: GREEN_MID,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  photoMeta:   { flex: 1 },
  photoTitle:  { fontSize: 14, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
  photoHint:   { fontSize: 12, color: TEXT_MUTED },
  photoRemove: { fontSize: 12, color: ERROR, marginTop: 4, fontWeight: '500' },

  // Inputs
  inputGroup: { gap: 6 },
  label:      { fontSize: 13, fontWeight: '600', color: TEXT_MAIN },
  required:   { color: ERROR },
  input: {
    backgroundColor: OFF_WHITE,
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: TEXT_MAIN,
  },
  textArea:   { minHeight: 90 },
  inputError: { borderColor: ERROR },

  // Field error
  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  fieldErrorText: { fontSize: 11, color: ERROR },

  // Password
  passwordWrap:  { position: 'relative' },
  passwordInput: { paddingRight: 46 },
  eyeBtn:        { position: 'absolute', right: 14, top: 14 },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: WHITE,
    borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    padding: 14, marginBottom: 6,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 7,
    borderWidth: 2, borderColor: GREEN_MID,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: OFF_WHITE,
  },
  checkboxChecked: { backgroundColor: GREEN_DARK, borderColor: GREEN_DARK },
  checkboxLabel:   { fontSize: 14, color: TEXT_MUTED, flex: 1 },
  checkboxLink:    { color: GREEN_DARK, fontWeight: '700' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: WHITE,
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
    backgroundColor: WHITE,
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
    color: GREEN_DARK,
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
    backgroundColor: GREEN_DARK,
    alignItems: 'center',
  },
  modalButtonAcceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: GREEN_DARK,
    borderRadius: 14, paddingVertical: 16,
    marginTop: 8, marginBottom: 14,
    shadowColor: GREEN_DARK,
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
    backgroundColor: GREEN_SOFT,
    borderRadius: 12, borderWidth: 1, borderColor: GREEN_MID,
  },
  infoText: { fontSize: 12, color: GREEN_DARK, fontWeight: '500' },

  // Login prompt
  loginPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, paddingBottom: 8 },
  loginPromptText: { fontSize: 14, color: TEXT_MUTED },
  loginPromptLink: { fontSize: 14, color: GREEN_DARK, fontWeight: '700' },
});