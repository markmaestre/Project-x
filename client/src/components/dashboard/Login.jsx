import React, { useState, useRef, useEffect } from 'react';
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
  BackHandler,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../Redux/slices/authSlice';

// ── Premium Color Palette ──────────────────────────────────────────────────────
const NAVY = '#0A1628';
const NAVY_LIGHT = '#1A2D4A';
const ROYAL_BLUE = '#1A5C9E';
const ROYAL_BLUE_LIGHT = '#2B7BCE';
const ROYAL_BLUE_DARK = '#13447A';
const ROYAL_BLUE_ULTRA_LIGHT = '#E8F0FE';
const ROYAL_BLUE_FAINT = 'rgba(26, 92, 158, 0.08)';
const GOLD = '#C9960C';
const GOLD_LIGHT = '#F0B429';
const GOLD_ULTRA_LIGHT = '#FDF3D7';
const GOLD_FAINT = 'rgba(201, 150, 12, 0.10)';
const WHITE = '#FFFFFF';
const OFF_WHITE = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const SURFACE = '#F1F5F9';
const BORDER = '#E2E8F0';
const BORDER_FOCUS = '#1A5C9E';
const TEXT_PRIMARY = '#0A1628';
const TEXT_SECONDARY = '#475569';
const TEXT_TERTIARY = '#94A3B8';
const TEXT_INVERSE = '#FFFFFF';
const ERROR_BG = '#FEF2F2';
const ERROR_BORDER = '#FECACA';
const ERROR_TEXT = '#DC2626';
const SUCCESS_BG = '#F0FDF4';
const SUCCESS_BORDER = '#BBF7D0';
const SUCCESS_TEXT = '#16A34A';
const SHADOW_COLOR = 'rgba(10, 22, 40, 0.08)';
const SHADOW_COLOR_DARK = 'rgba(10, 22, 40, 0.12)';
// ─────────────────────────────────────────────────────────────────────────────

export default function Login({ onNavigate }) {
  const dispatch = useDispatch();
  const { error, isAuthenticated } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ email_address: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Animation Values ──────────────────────────────────────────────────────
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const buttonScale = useState(new Animated.Value(1))[0];
  const backScale = useState(new Animated.Value(1))[0];
  const emailLabelAnim = useState(new Animated.Value(0))[0];
  const passwordLabelAnim = useState(new Animated.Value(0))[0];

  const scrollViewRef = useRef();

  // ── Entry Animation ───────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Floating label animations ────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(emailLabelAnim, {
      toValue: focusedField === 'email_address' || credentials.email_address ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [focusedField, credentials.email_address]);

  useEffect(() => {
    Animated.timing(passwordLabelAnim, {
      toValue: focusedField === 'password' || credentials.password ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [focusedField, credentials.password]);

  // ── Handle Android Hardware Back Button ──────────────────────────────────
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isLoading) {
        setCredentials({ email_address: '', password: '' });
        setErrors({});
        setServerError(null);
        setIsLoading(false);
        onNavigate('Home');
        return true;
      }
      return true;
    });

    return () => backHandler.remove();
  }, [onNavigate, isLoading]);

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

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const result = await dispatch(login(credentials));

      if (login.fulfilled.match(result)) {
        const userRole = result.payload.user.role;
        const normalizedRole = userRole.toLowerCase();

        setTimeout(() => {
          setIsLoading(false);
          if (normalizedRole === 'client') {
            onNavigate('Client');
          } else if (normalizedRole === 'freelancer') {
            onNavigate('Freelancer');
          } else {
            onNavigate('Login');
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

  const handleGoBack = () => {
    if (!isLoading) {
      setCredentials({ email_address: '', password: '' });
      setErrors({});
      setServerError(null);
      setIsLoading(false);
      onNavigate('Home');
    }
  };

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
      setServerError(null);
      setIsLoading(false);
    };
  }, [dispatch]);

  const getInputBorderColor = (field) => {
    if (errors[field]) return ERROR_BORDER;
    if (focusedField === field) return BORDER_FOCUS;
    return BORDER;
  };

  const getInputBackgroundColor = (field) => {
    if (errors[field]) return ERROR_BG;
    if (focusedField === field) return WHITE;
    return SURFACE;
  };

  const getLabelColor = (field) => {
    if (errors[field]) return ERROR_TEXT;
    if (focusedField === field) return ROYAL_BLUE;
    return TEXT_SECONDARY;
  };

  const pressBackIn = () => {
    Animated.spring(backScale, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };
  const pressBackOut = () => {
    Animated.spring(backScale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  // ── Floating label interpolations ────────────────────────────────────────
  const emailLabelTop = emailLabelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, -9] });
  const emailLabelSize = emailLabelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 12] });
  const passwordLabelTop = passwordLabelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, -9] });
  const passwordLabelSize = passwordLabelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 12] });

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
          <Animated.View
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {/* Ambient depth shapes */}
            <View pointerEvents="none" style={styles.blobBlue} />
            <View pointerEvents="none" style={styles.blobGold} />

            <View style={styles.card}>

              {/* ── Back Button ─────────────────────────────────────────── */}
              <Animated.View style={{ alignSelf: 'flex-start', transform: [{ scale: backScale }] }}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleGoBack}
                  onPressIn={pressBackIn}
                  onPressOut={pressBackOut}
                  disabled={isLoading}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
                >
                  <Ionicons name="chevron-back" size={22} color={TEXT_SECONDARY} />
                </TouchableOpacity>
              </Animated.View>

              {/* ── Logo & Header ──────────────────────────────────────── */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoWrapper}>
                    <Image
                      source={require('../../../assets/taskra.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.logoGoldUnderline} />
                  <Text style={styles.logoText}>TASKRA</Text>
                </View>

                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Welcome back</Text>
                  <Text style={styles.subtitle}>
                    Sign in to continue managing your tasks
                  </Text>
                </View>
              </View>

              {/* ── Server Error Banner ─────────────────────────────────── */}
              {(serverError || (error && !serverError)) && !isLoading && (
                <View style={styles.errorBanner} accessibilityRole="alert">
                  <View style={styles.errorBannerIcon}>
                    <Ionicons name="alert-circle" size={20} color={ERROR_TEXT} />
                  </View>
                  <Text style={styles.errorBannerText}>
                    {serverError || (typeof error === 'string' ? error : error?.message)}
                  </Text>
                </View>
              )}

              {/* ── Form ────────────────────────────────────────────────── */}
              <View style={styles.form}>

                {/* Email Field */}
                <View style={styles.inputGroup}>
                  <View style={[
                    styles.inputWrapper,
                    {
                      borderColor: getInputBorderColor('email_address'),
                      backgroundColor: getInputBackgroundColor('email_address'),
                    }
                  ]}>
                    <Ionicons
                      name="mail-outline"
                      size={19}
                      color={focusedField === 'email_address' && !errors.email_address ? ROYAL_BLUE : TEXT_TERTIARY}
                      style={styles.inputIcon}
                    />
                    <View style={styles.floatingInputArea}>
                      <Animated.Text
                        style={[
                          styles.floatingLabel,
                          {
                            top: emailLabelTop,
                            fontSize: emailLabelSize,
                            color: getLabelColor('email_address'),
                            backgroundColor: getInputBackgroundColor('email_address'),
                          },
                        ]}
                      >
                        Email address
                      </Animated.Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={credentials.email_address}
                        editable={!isLoading}
                        accessibilityLabel="Email address"
                        onFocus={() => setFocusedField('email_address')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={(text) => {
                          setCredentials({ ...credentials, email_address: text });
                          if (errors.email_address) setErrors({ ...errors, email_address: null });
                          if (serverError) setServerError(null);
                        }}
                      />
                    </View>
                    {credentials.email_address.length > 0 && !errors.email_address && (
                      <View style={styles.inputRightIcon}>
                        <Ionicons name="checkmark-circle" size={18} color={SUCCESS_TEXT} />
                      </View>
                    )}
                  </View>
                  {errors.email_address && (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={14} color={ERROR_TEXT} />
                      <Text style={styles.fieldErrorText}>{errors.email_address}</Text>
                    </View>
                  )}
                </View>

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <View style={[
                    styles.inputWrapper,
                    {
                      borderColor: getInputBorderColor('password'),
                      backgroundColor: getInputBackgroundColor('password'),
                    }
                  ]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={19}
                      color={focusedField === 'password' && !errors.password ? ROYAL_BLUE : TEXT_TERTIARY}
                      style={styles.inputIcon}
                    />
                    <View style={styles.floatingInputArea}>
                      <Animated.Text
                        style={[
                          styles.floatingLabel,
                          {
                            top: passwordLabelTop,
                            fontSize: passwordLabelSize,
                            color: getLabelColor('password'),
                            backgroundColor: getInputBackgroundColor('password'),
                          },
                        ]}
                      >
                        Password
                      </Animated.Text>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        secureTextEntry={!showPassword}
                        value={credentials.password}
                        editable={!isLoading}
                        accessibilityLabel="Password"
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={(text) => {
                          setCredentials({ ...credentials, password: text });
                          if (errors.password) setErrors({ ...errors, password: null });
                          if (serverError) setServerError(null);
                        }}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={19}
                        color={TEXT_TERTIARY}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={14} color={ERROR_TEXT} />
                      <Text style={styles.fieldErrorText}>{errors.password}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                    activeOpacity={0.7}
                    style={styles.forgotPasswordButton}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Sign In Button ───────────────────────────────────── */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isLoading, busy: isLoading }}
                  >
                    <View style={styles.loginButtonGoldBar} />
                    {isLoading ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator size="small" color={WHITE} />
                        <Text style={styles.loginButtonText}>Signing in…</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.loginButtonText}>Sign in</Text>
                        <Ionicons name="arrow-forward" size={18} color={WHITE} style={styles.buttonIcon} />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* ── Divider ─────────────────────────────────────────── */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* ── Google Sign In ────────────────────────────────────── */}
                <TouchableOpacity style={styles.googleButton} disabled={isLoading} activeOpacity={0.85}>
                  <View style={styles.googleButtonContent}>
                    <Ionicons name="logo-google" size={19} color={TEXT_SECONDARY} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </View>
                </TouchableOpacity>

                {/* ── Sign Up Prompt ──────────────────────────────────── */}
                <View style={styles.signupPrompt}>
                  <Text style={styles.signupPromptText}>Don't have an account?</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (!isLoading) {
                        setCredentials({ email_address: '', password: '' });
                        setErrors({});
                        setServerError(null);
                        setIsLoading(false);
                        onNavigate('RoleSelection');
                      }
                    }}
                    disabled={isLoading}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.signupPromptLink}> Create account</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },

  blobBlue: {
    position: 'absolute',
    top: -40, right: -50,
    width: 220, height: 220,
    borderRadius: 110,
    backgroundColor: ROYAL_BLUE_FAINT,
  },
  blobGold: {
    position: 'absolute',
    bottom: 40, left: -70,
    width: 180, height: 180,
    borderRadius: 90,
    backgroundColor: GOLD_FAINT,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 32,
    shadowColor: SHADOW_COLOR_DARK,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logoWrapper: {
    width: 80,
    height: 80,
    backgroundColor: WHITE,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(26, 92, 158, 0.08)',
  },

  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },

  logoGoldUnderline: {
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD_LIGHT,
    marginBottom: 10,
  },

  logoText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
    color: NAVY,
  },

  headerTextContainer: {
    alignItems: 'center',
  },

  title: {
    fontSize: 27,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 6,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 20,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ERROR_BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: ERROR_BORDER,
  },

  errorBannerIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: ERROR_TEXT,
    lineHeight: 18,
    fontWeight: '500',
  },

  form: {
    gap: 18,
  },

  inputGroup: {
    gap: 6,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1.5,
    minHeight: 58,
    paddingHorizontal: 2,
  },

  inputIcon: {
    marginLeft: 14,
    marginRight: 8,
  },

  floatingInputArea: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
  },

  floatingLabel: {
    position: 'absolute',
    left: 0,
    fontWeight: '600',
    paddingHorizontal: 2,
  },

  input: {
    fontSize: 15.5,
    color: TEXT_PRIMARY,
    paddingTop: 22,
    paddingBottom: 8,
    paddingRight: 8,
    fontWeight: '500',
  },

  passwordInput: {
    paddingRight: 4,
  },

  inputRightIcon: {
    marginRight: 14,
  },

  eyeIcon: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },

  fieldErrorText: {
    fontSize: 12.5,
    color: ERROR_TEXT,
    fontWeight: '500',
  },

  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingTop: 2,
  },

  forgotPasswordText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '700',
  },

  loginButton: {
    backgroundColor: ROYAL_BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: ROYAL_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(26, 92, 158, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },

  loginButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },

  loginButtonGoldBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2.5,
    backgroundColor: GOLD_LIGHT,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_INVERSE,
    letterSpacing: 0.3,
  },

  buttonIcon: {
    marginLeft: 2,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },

  dividerText: {
    fontSize: 12,
    color: TEXT_TERTIARY,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 48,
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },

  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  signupPromptText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },

  signupPromptLink: {
    fontSize: 14,
    color: ROYAL_BLUE,
    fontWeight: '700',
  },
});