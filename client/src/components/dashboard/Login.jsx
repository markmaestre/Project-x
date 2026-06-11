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

// ── Semiconductor-Inspired Palette ────────────────────────────────────────────
// Primary Blue  →  Intel / AMD / Amkor brand blue family
const BLUE        = '#0068B5';
const BLUE_LIGHT  = '#3D9DD6';
const BLUE_DARK   = '#004F8C';
const BLUE_SOFT   = '#E2EAF4';
const BLUE_MID    = '#A8C4DC';

// Gold  →  excellence, achievement, premium
const GOLD        = '#C9960C';
const GOLD_LIGHT  = '#F0B429';
const GOLD_SOFT   = '#FDF3D7';
const GOLD_MID    = '#E6C56A';

// Silver / Neutrals
const WHITE       = '#FFFFFF';
const OFF_WHITE   = '#F5F7FA';
const SURFACE     = '#EBF0F6';
const BORDER      = 'rgba(0,104,181,0.14)';

// Text
const TEXT_MAIN   = '#0D1B2A';
const TEXT_MUTED  = '#4A5E72';
const TEXT_LIGHT  = '#8B9AB0';

// Status
const RED_BG      = '#FEF2F2';
const RED_BORDER  = '#FECACA';
const RED_TEXT    = '#E53935';
// ─────────────────────────────────────────────────────────────────────────────

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
    setServerError(null);
    setErrors({});

    if (!validateForm()) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setIsLoading(true);

    try {
      const result = await dispatch(login(credentials));

      if (login.fulfilled.match(result)) {
        const userRole = result.payload.user.role;
        const normalizedRole = userRole.toLowerCase();

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
        const errorMessage = result.payload?.message || 'Login failed. Please try again.';
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });

        if (errorMessage.toLowerCase().includes('user not found') ||
            errorMessage.toLowerCase().includes('invalid email') ||
            errorMessage.toLowerCase().includes('email not found')) {
          setErrors((prev) => ({ ...prev, email_address: 'No account found with this email address.' }));
          setServerError('The email address you entered is not registered.');
        } else if (
          errorMessage.toLowerCase().includes('invalid credentials') ||
          errorMessage.toLowerCase().includes('invalid password') ||
          errorMessage.toLowerCase().includes('wrong password') ||
          errorMessage.toLowerCase().includes('incorrect password')
        ) {
          setErrors((prev) => ({ ...prev, password: 'Incorrect password. Please try again.' }));
          setServerError('The email or password you entered is incorrect.');
        } else {
          setServerError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
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
          Alert.alert(
            'Reset Link Sent',
            `If an account exists with ${credentials.email_address}, you'll receive a reset link shortly.`,
            [{ text: 'OK' }],
          );
          setCredentials((prev) => ({ ...prev, password: '' }));
        },
      },
    ]);
  };

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
      setServerError(null);
      setIsLoading(false);
    };
  }, [dispatch]);

  const inputBorder = (field) => {
    if (errors[field])          return styles.inputBorderError;
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

            {/* ── Back Button ─────────────────────────────────────────── */}
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
                <Ionicons name="arrow-back" size={18} color={BLUE} />
              </View>
            </TouchableOpacity>

            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={styles.header}>
              {/* Logo: blue box with gold shimmer top bar */}
              <View style={styles.logoBox}>
                <View style={styles.logoGoldBar} />
                <Text style={styles.logoLetter}>T</Text>
              </View>
              <Text style={styles.logoWordmark}>TASKRA</Text>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue to Taskra</Text>
            </View>

            {/* ── Server Error Banner ─────────────────────────────────── */}
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

            {/* ── Form ────────────────────────────────────────────────── */}
            <View style={styles.form}>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, inputBorder('email_address')]}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={focusedField === 'email_address' ? BLUE : TEXT_LIGHT}
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
                  <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputWrapper, inputBorder('password')]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focusedField === 'password' ? BLUE : TEXT_LIGHT}
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

              {/* ── Sign In Button ───────────────────────────────────── */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                {/* Gold shimmer bar at top of button */}
                <View style={styles.loginButtonGoldBar} />
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

              {/* ── Divider ─────────────────────────────────────────── */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* ── Sign Up Prompt ──────────────────────────────────── */}
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
  safe:            { flex: 1, backgroundColor: OFF_WHITE },
  flex:            { flex: 1 },
  scrollContainer: { flexGrow: 1 },
  container:       { flex: 1, padding: 24, paddingBottom: 48 },

  // ── Back ────────────────────────────────────────────────────────────────
  backButton:   { marginBottom: 20, alignSelf: 'flex-start' },
  backIconWrap: {
    width: 38, height: 38,
    backgroundColor: WHITE,
    borderRadius: 11,
    borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 76, height: 76,
    backgroundColor: BLUE,
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    // Blue glow shadow
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
    // Subtle inner border for dimension
    borderWidth: 1, borderColor: BLUE_LIGHT,
  },
  // Gold accent bar at top of logo box
  logoGoldBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: GOLD_LIGHT,
  },
  logoWordmark: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 4,
    color: TEXT_LIGHT,
    marginBottom: 16,
  },
  title: {
    fontSize: 26, fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14, color: TEXT_MUTED,
    textAlign: 'center', fontWeight: '400',
  },

  // ── Error Banner ────────────────────────────────────────────────────────
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

  // ── Form ────────────────────────────────────────────────────────────────
  form:       { gap: 18 },
  inputGroup: { gap: 7 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: TEXT_MAIN },
  forgotPasswordText: { fontSize: 12, color: GOLD, fontWeight: '600' },

  // ── Input ───────────────────────────────────────────────────────────────
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12, borderWidth: 1.5,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  inputBorderDefault: { borderColor: BORDER },
  inputBorderFocused: {
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 2,
  },
  inputBorderError: { borderColor: RED_TEXT },
  inputIcon:      { marginLeft: 14, marginRight: 2 },
  input: {
    flex: 1,
    paddingVertical: 14, paddingHorizontal: 10,
    fontSize: 15, color: TEXT_MAIN,
  },
  passwordInput: { paddingRight: 4 },
  eyeIcon:       { padding: 12 },

  // ── Field Error ─────────────────────────────────────────────────────────
  fieldErrorRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldErrorText: { fontSize: 12, color: RED_TEXT },

  // ── Sign In Button ───────────────────────────────────────────────────────
  loginButton: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    overflow: 'hidden',
    // Blue shadow
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32, shadowRadius: 10, elevation: 5,
    // Subtle inner border for dimension
    borderWidth: 1, borderColor: BLUE_LIGHT,
  },
  loginButtonDisabled: {
    opacity: 0.65,
    shadowOpacity: 0.08,
  },
  // Gold shimmer bar at the top edge of the Sign In button
  loginButtonGoldBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2.5,
    backgroundColor: GOLD_LIGHT,
    opacity: 0.85,
  },
  loginButtonInner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  loginButtonText: {
    fontSize: 15, fontWeight: '700',
    color: WHITE, letterSpacing: 0.4,
  },

  // ── Divider ─────────────────────────────────────────────────────────────
  divider:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: {
    flex: 1, height: StyleSheet.hairlineWidth,
    backgroundColor: BLUE_MID, opacity: 0.45,
  },
  dividerText: { fontSize: 12, color: TEXT_LIGHT, fontWeight: '500' },

  // ── Sign Up Prompt ───────────────────────────────────────────────────────
  signupPrompt:     { flexDirection: 'row', justifyContent: 'center' },
  signupPromptText: { fontSize: 14, color: TEXT_MUTED },
  signupPromptLink: { fontSize: 14, color: BLUE, fontWeight: '700' },
});