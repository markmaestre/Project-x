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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'react-native-image-picker';
import { registerFreelancer, clearError } from '../../Redux/slices/authSlice';

export default function FreelancerRegistration({ onNavigate }) {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
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

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
          Alert.alert('Error', 'Failed to pick image');
        } else if (response.assets && response.assets[0]) {
          setProfilePicture(response.assets[0]);
        }
      }
    );
  };

  const handleRegister = async () => {
    // Clear previous server error
    setServerError(null);
    
    // Validate form first
    if (!validateForm()) {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      Alert.alert('Validation Error', 'Please check all required fields and fix the errors.', [{ text: 'OK' }]);
      return;
    }
    
    // IMPORTANT: Keep confirm_password for backend validation
    const userData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      username: formData.username,
      email_address: formData.email_address,
      password: formData.password,
      confirm_password: formData.confirm_password, // INCLUDE THIS!
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
    
    // Add profile picture if selected
    if (profilePicture) {
      userData.profile_picture = {
        uri: profilePicture.uri,
        type: profilePicture.type || 'image/jpeg',
        fileName: profilePicture.fileName || `profile_${Date.now()}.jpg`,
      };
    }
    
    console.log('Sending freelancer data with confirm_password:', {
      ...userData,
      password: '***',
      confirm_password: '***'
    });
    
    const result = await dispatch(registerFreelancer(userData));
    
    if (registerFreelancer.fulfilled.match(result)) {
      // Success - Ask if user wants to continue to login
      Alert.alert(
        'Registration Successful! 🎉',
        `${result.payload.message || 'Your freelancer account has been created successfully!'}\n\nWould you like to continue to login?`,
        [
          { 
            text: 'No, Stay Here', 
            onPress: () => {
              Alert.alert('Stay on Registration', 'You can review your information or create another account.', [{ text: 'OK' }]);
            },
            style: 'cancel'
          },
          { 
            text: 'Yes, Continue to Login', 
            onPress: () => {
              resetForm();
              onNavigate('Login');
            }
          }
        ]
      );
    } else if (registerFreelancer.rejected.match(result)) {
      // Show error but stay on page - DO NOT NAVIGATE AWAY
      const errorMessage = result.payload?.message || 'Something went wrong. Please try again.';
      setServerError(errorMessage);
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      
      // Show specific error based on what went wrong
      if (errorMessage.toLowerCase().includes('email already exists')) {
        setErrors(prev => ({ ...prev, email_address: 'This email is already registered' }));
        Alert.alert('Registration Failed', 'This email address is already registered. Please use a different email or login.', [{ text: 'OK' }]);
      } else if (errorMessage.toLowerCase().includes('username already taken')) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
        Alert.alert('Registration Failed', 'This username is already taken. Please choose a different username.', [{ text: 'OK' }]);
      } else if (errorMessage.toLowerCase().includes('confirm password') || errorMessage.toLowerCase().includes('passwords do not match')) {
        setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match' }));
        Alert.alert('Registration Failed', 'Passwords do not match. Please make sure both passwords are the same.', [{ text: 'OK' }]);
      } else if (errorMessage.toLowerCase().includes('password')) {
        Alert.alert('Registration Failed', 'There was an issue with your password. Please check the requirements.', [{ text: 'OK' }]);
      } else {
        Alert.alert('Registration Failed', errorMessage, [{ text: 'OK' }]);
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
    setProfilePicture(null);
    setErrors({});
    setServerError(null);
  };

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('RoleSelection')}>
              <Ionicons name="arrow-back" size={24} color="#D4AF37" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.roleBadge}>
                <Ionicons name="briefcase-outline" size={20} color="#D4AF37" />
                <Text style={styles.roleBadgeText}>Freelancer Registration</Text>
              </View>
              <Text style={styles.title}>Start Your Freelance Journey</Text>
              <Text style={styles.subtitle}>Showcase your skills and find great opportunities</Text>
            </View>

            {/* Server Error Display */}
            {serverError && (
              <View style={styles.serverErrorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            <View style={styles.form}>
              {/* Profile Picture Section */}
              <View style={styles.profileSection}>
                <TouchableOpacity onPress={handleImagePick} style={styles.profileImageContainer}>
                  {profilePicture ? (
                    <Image source={{ uri: profilePicture.uri }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Ionicons name="camera-outline" size={40} color="#D4AF37" />
                      <Text style={styles.profilePlaceholderText}>Add Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.profileHint}>Tap to add profile picture (optional)</Text>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={[styles.input, errors.first_name && styles.inputError]}
                    placeholder="First name"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={formData.first_name}
                    onChangeText={(text) => {
                      setFormData({ ...formData, first_name: text });
                      if (errors.first_name) setErrors({ ...errors, first_name: null });
                      if (serverError) setServerError(null);
                    }}
                  />
                  {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={[styles.input, errors.last_name && styles.inputError]}
                    placeholder="Last name"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={formData.last_name}
                    onChangeText={(text) => {
                      setFormData({ ...formData, last_name: text });
                      if (errors.last_name) setErrors({ ...errors, last_name: null });
                      if (serverError) setServerError(null);
                    }}
                  />
                  {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                  style={[styles.input, errors.username && styles.inputError]}
                  placeholder="Choose a username"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="none"
                  value={formData.username}
                  onChangeText={(text) => {
                    setFormData({ ...formData, username: text.toLowerCase().replace(/\s/g, '') });
                    if (errors.username) setErrors({ ...errors, username: null });
                    if (serverError) setServerError(null);
                  }}
                />
                {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={[styles.input, errors.email_address && styles.inputError]}
                  placeholder="Email address"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email_address}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email_address: text });
                    if (errors.email_address) setErrors({ ...errors, email_address: null });
                    if (serverError) setServerError(null);
                  }}
                />
                {errors.email_address && <Text style={styles.errorText}>{errors.email_address}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Phone number (optional)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="phone-pad"
                  value={formData.phone_number}
                  onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Country</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Country"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={formData.country}
                    onChangeText={(text) => setFormData({ ...formData, country: text })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Your street address (optional)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  numberOfLines={3}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
                <Text style={styles.hintText}>Enter your complete address (optional)</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Skills (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., React Native, Node.js, UI/UX Design"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={formData.skills}
                  onChangeText={(text) => setFormData({ ...formData, skills: text })}
                />
                <Text style={styles.hintText}>Separate multiple skills with commas</Text>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Experience Level</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Entry, Junior, Mid, Senior"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={formData.experience_level}
                    onChangeText={(text) => setFormData({ ...formData, experience_level: text })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Years of Experience</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Years"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    value={formData.years_of_experience}
                    onChangeText={(text) => setFormData({ ...formData, years_of_experience: text })}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Hourly Rate (PHP)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Hourly rate"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    value={formData.hourly_rate}
                    onChangeText={(text) => setFormData({ ...formData, hourly_rate: text })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Fixed Rate (PHP)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Fixed rate"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    value={formData.fixed_rate}
                    onChangeText={(text) => setFormData({ ...formData, fixed_rate: text })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Portfolio URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://your-portfolio.com"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="none"
                  value={formData.portfolio_link}
                  onChangeText={(text) => setFormData({ ...formData, portfolio_link: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio / About Me</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us about yourself, your expertise, and what makes you unique..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  numberOfLines={4}
                  value={formData.bio_about_me}
                  onChangeText={(text) => setFormData({ ...formData, bio_about_me: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Languages (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., English, Filipino, Spanish"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={formData.languages}
                  onChangeText={(text) => setFormData({ ...formData, languages: text })}
                />
                <Text style={styles.hintText}>Separate multiple languages with commas</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Certifications (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., AWS Certified, Google UX Certificate"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={formData.certifications}
                  onChangeText={(text) => setFormData({ ...formData, certifications: text })}
                />
                <Text style={styles.hintText}>Separate multiple certifications with commas</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    placeholder="Password (min. 6 characters)"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormData({ ...formData, password: text });
                      if (errors.password) setErrors({ ...errors, password: null });
                      if (errors.confirm_password && formData.confirm_password === text) {
                        setErrors({ ...errors, confirm_password: null });
                      }
                      if (serverError) setServerError(null);
                    }}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.confirm_password && styles.inputError]}
                    placeholder="Confirm password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showConfirmPassword}
                    value={formData.confirm_password}
                    onChangeText={(text) => {
                      setFormData({ ...formData, confirm_password: text });
                      if (errors.confirm_password) setErrors({ ...errors, confirm_password: null });
                      if (serverError) setServerError(null);
                    }}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
                {errors.confirm_password && <Text style={styles.errorText}>{errors.confirm_password}</Text>}
              </View>

              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, terms_accepted: !formData.terms_accepted })}>
                <View style={[styles.checkbox, formData.terms_accepted && styles.checkboxChecked]}>
                  {formData.terms_accepted && <Ionicons name="checkmark" size={16} color="#0a0a0a" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I accept the <Text style={styles.checkboxLink}>Terms and Conditions</Text> *
                </Text>
              </TouchableOpacity>
              {errors.terms_accepted && <Text style={styles.errorText}>{errors.terms_accepted}</Text>}

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}>
                {isLoading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.registerButtonText}>Create Freelancer Account</Text>}
              </TouchableOpacity>

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
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  flex: { flex: 1 },
  container: { flex: 1, padding: 24 },
  backButton: { marginBottom: 16, width: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16, gap: 8 },
  roleBadgeText: { fontSize: 13, color: '#D4AF37', fontWeight: '500' },
  title: { fontSize: 32, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  serverErrorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(220,53,69,0.15)', borderRadius: 8, padding: 12, marginBottom: 20, gap: 8, borderWidth: 1, borderColor: 'rgba(220,53,69,0.3)' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(220,53,69,0.1)', borderRadius: 8, padding: 12, marginBottom: 20, gap: 8 },
  errorText: { fontSize: 12, color: '#ff6b6b' },
  serverErrorText: { fontSize: 13, color: '#ff6b6b', flex: 1 },
  form: { gap: 20 },
  profileSection: { alignItems: 'center', marginBottom: 16 },
  profileImageContainer: { marginBottom: 8 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#D4AF37' },
  profilePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#111111', borderWidth: 2, borderColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  profilePlaceholderText: { fontSize: 12, color: '#D4AF37', marginTop: 4 },
  profileHint: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#ffffff' },
  input: { backgroundColor: '#111111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, fontSize: 16, color: '#ffffff' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  inputError: { borderColor: '#ff6b6b' },
  hintText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeIcon: { position: 'absolute', right: 14, top: 14 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#D4AF37' },
  checkboxLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  checkboxLink: { color: '#D4AF37', fontWeight: '500' },
  registerButton: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  registerButtonText: { fontSize: 16, fontWeight: '600', color: '#0a0a0a' },
  loginPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginPromptText: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  loginPromptLink: { fontSize: 14, color: '#D4AF37', fontWeight: '600' },
});