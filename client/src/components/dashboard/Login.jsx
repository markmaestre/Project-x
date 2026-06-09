import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../Redux/slices/authSlice';

// ── Design tokens ──────────────────────────────────────────
const GREEN       = '#4ADE80';
const GREEN_DARK  = '#22C55E';
const GREEN_SOFT  = '#DCFCE7';
const GREEN_MID   = '#86EFAC';
const WHITE       = '#FFFFFF';
const OFF_WHITE   = '#F0FDF4';
const BORDER      = 'rgba(74,222,128,0.25)';
const TEXT_MAIN   = '#0F2417';
const TEXT_MUTED  = '#6B7280';
const TEXT_LIGHT  = '#9CA3AF';
const RED_BG      = '#FEF2F2';
const RED_BORDER  = '#FECACA';
const RED_TEXT    = '#EF4444';
// ───────────────────────────────────────────────────────────

export default function Login({ onNavigate }) {
  const dispatch = useDispatch();
  const { error, isAuthenticated } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword]   = useState(false);
  const [credentials, setCredentials]     = useState({ email_address: '', password: '' });
  const [errors, setErrors]               = useState({});
  const [serverError, setServerError]     = useState(null);
  const [focusedField, setFocusedField]   = useState(null);
  const [isLoading, setIsLoading]         = useState(false);

  const scrollViewRef = useRef();

  const validateForm = () => {
    const newErrors = {};
    if (!credentials.email_address.trim()) {
      newErrors.email_address = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email_address)) {
      newErrors.email_address = 'Please enter a valid email address';
    }
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Clear previous errors
    setServerError(null);
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    
    // Start loading
    setIsLoading(true);
    
    try {
      const result = await dispatch(login(credentials));
      
      // Check if login was successful
      if (login.fulfilled.match(result)) {
        // Success - navigate based on user role
        const userRole = result.payload.user.role;
        const normalizedRole = userRole.toLowerCase();
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          if (normalizedRole === 'client') {
            onNavigate('Client');
          } else if (normalizedRole === 'freelancer') {
            onNavigate('Freelancer');
          } else {
            onNavigate('Home');
          }
        }, 100);
      } else if (login.rejected.match(result)) {
        // Failed - stay on login screen and show errors
        const errorMessage = result.payload?.message || 'Login failed. Please try again.';
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });

        // Handle different error types
        if (errorMessage.toLowerCase().includes('user not found') || 
            errorMessage.toLowerCase().includes('invalid email') ||
            errorMessage.toLowerCase().includes('email not found')) {
          // Wrong email — highlight email field and show banner
          setErrors((prev) => ({ ...prev, email_address: 'No account found with this email address.' }));
          setServerError('The email address you entered is not registered.');
        } else if (
          errorMessage.toLowerCase().includes('invalid credentials') ||
          errorMessage.toLowerCase().includes('invalid password') ||
          errorMessage.toLowerCase().includes('wrong password') ||
          errorMessage.toLowerCase().includes('incorrect password')
        ) {
          // Wrong password — highlight password field and show banner
          setErrors((prev) => ({ ...prev, password: 'Incorrect password. Please try again.' }));
          setServerError('The email or password you entered is incorrect.');
        } else {
          // Generic server error — show banner only
          setServerError(errorMessage);
        }
      }
    } catch (error) {
      // Handle any unexpected errors
      console.error('Login error:', error);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      // Stop loading regardless of success or failure
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!credentials.email_address.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.', [{ text: 'OK' }]);
      return;
    }
    Alert.alert('Forgot Password?', `Send a reset link to ${credentials.email_address}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Reset Link',
        onPress: () => {
          Alert.alert('Reset Link Sent', `If an account exists with ${credentials.email_address}, you'll receive a reset link shortly.`, [{ text: 'OK' }]);
          setCredentials((prev) => ({ ...prev, password: '' }));
        },
      },
    ]);
  };

  // Clear errors when component unmounts
  React.useEffect(() => {
    return () => { 
      dispatch(clearError()); 
      setServerError(null);
      setIsLoading(false);
    };
  }, [dispatch]);

  const inputBorder = (field) => {
    if (errors[field])      return styles.inputBorderError;
    if (focusedField === field) return styles.inputBorderFocused;
    return styles.inputBorderDefault;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={OFF_WHITE} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => { 
                setCredentials({ email_address: '', password: '' }); 
                setErrors({}); 
                setServerError(null); 
                setIsLoading(false);
                onNavigate('Home'); 
              }}
              disabled={isLoading}
            >
              <View style={styles.backIconWrap}>
                <Ionicons name="arrow-back" size={18} color={GREEN_DARK} />
              </View>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>T</Text>
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue to Taskra</Text>
            </View>

            {/* Server error banner */}
            {(serverError || (error && !serverError)) && !isLoading && (
              <View style={styles.serverErrorContainer}>
                <View style={styles.serverErrorIcon}>
                  <Ionicons name="alert-circle" size={18} color={RED_TEXT} />
                </View>
                <Text style={styles.serverErrorText}>
                  {serverError || (typeof error === 'string' ? error : error?.message)}
                </Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, inputBorder('email_address')]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={18} 
                    color={focusedField === 'email_address' ? GREEN_DARK : TEXT_LIGHT} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={TEXT_LIGHT}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={credentials.email_address}
                    editable={!isLoading}
                    onFocus={() => setFocusedField('email_address')}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(text) => {
                      setCredentials({ ...credentials, email_address: text });
                      if (errors.email_address) setErrors({ ...errors, email_address: null });
                      if (serverError) setServerError(null);
                    }}
                  />
                </View>
                {errors.email_address && (
                  <View style={styles.fieldErrorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color={RED_TEXT} />
                    <Text style={styles.fieldErrorText}>{errors.email_address}</Text>
                  </View>
                )}
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  <TouchableOpacity 
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputWrapper, inputBorder('password')]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={18} 
                    color={focusedField === 'password' ? GREEN_DARK : TEXT_LIGHT} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor={TEXT_LIGHT}
                    secureTextEntry={!showPassword}
                    value={credentials.password}
                    editable={!isLoading}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(text) => {
                      setCredentials({ ...credentials, password: text });
                      if (errors.password) setErrors({ ...errors, password: null });
                      if (serverError) setServerError(null);
                    }}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={18} 
                      color={TEXT_LIGHT} 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <View style={styles.fieldErrorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color={RED_TEXT} />
                    <Text style={styles.fieldErrorText}>{errors.password}</Text>
                  </View>
                )}
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <View style={styles.loginButtonInner}>
                  {isLoading ? (
                    <>
                      <ActivityIndicator size="small" color={WHITE} />
                      <Text style={styles.loginButtonText}>Signing In...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={16} color={WHITE} />
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Sign up */}
              <View style={styles.signupPrompt}>
                <Text style={styles.signupPromptText}>Don't have an account?</Text>
                <TouchableOpacity 
                  onPress={() => { 
                    setCredentials({ email_address: '', password: '' }); 
                    setErrors({}); 
                    setServerError(null); 
                    setIsLoading(false);
                    onNavigate('RoleSelection'); 
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.signupPromptLink}> Create Account</Text>
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
  safe: { flex: 1, backgroundColor: OFF_WHITE },
  flex: { flex: 1 },
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 24, paddingBottom: 48 },

  // Back
  backButton: { marginBottom: 20, alignSelf: 'flex-start' },
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
  header: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 72, height: 72,
    backgroundColor: GREEN,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  logoLetter: { fontSize: 34, fontWeight: '800', color: WHITE },
  title: { fontSize: 26, fontWeight: '700', color: TEXT_MAIN, marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center' },

  // Error banner
  serverErrorContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: RED_BG,
    borderRadius: 12, padding: 14,
    marginBottom: 20, gap: 10,
    borderWidth: 1, borderColor: RED_BORDER,
  },
  serverErrorIcon: {
    width: 32, height: 32,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  serverErrorText: { fontSize: 13, color: RED_TEXT, flex: 1, lineHeight: 18 },

  // Form
  form: { gap: 18 },
  inputGroup: { gap: 7 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: TEXT_MAIN },
  forgotPasswordText: { fontSize: 12, color: GREEN_DARK, fontWeight: '600' },

  // Input
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  inputBorderDefault:  { borderColor: 'rgba(74,222,128,0.2)' },
  inputBorderFocused:  { borderColor: GREEN, shadowColor: GREEN, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  inputBorderError:    { borderColor: RED_TEXT },
  inputIcon: { marginLeft: 14, marginRight: 2 },
  input: {
    flex: 1,
    paddingVertical: 14, paddingHorizontal: 10,
    fontSize: 15, color: TEXT_MAIN,
  },
  passwordInput: { paddingRight: 4 },
  eyeIcon: { padding: 12 },

  // Field error
  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldErrorText: { fontSize: 12, color: RED_TEXT },

  // Login button
  loginButton: {
    backgroundColor: GREEN_DARK,
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  loginButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginButtonText: { fontSize: 15, fontWeight: '700', color: WHITE, letterSpacing: 0.3 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(74,222,128,0.3)' },
  dividerText: { fontSize: 12, color: TEXT_LIGHT, fontWeight: '500' },

  // Sign up
  signupPrompt: { flexDirection: 'row', justifyContent: 'center' },
  signupPromptText: { fontSize: 14, color: TEXT_MUTED },
  signupPromptLink: { fontSize: 14, color: GREEN_DARK, fontWeight: '700' },
});