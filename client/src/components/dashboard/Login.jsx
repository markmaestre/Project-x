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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../Redux/slices/authSlice';

export default function Login({ onNavigate }) {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email_address: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

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

    if (!validateForm()) {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    const result = await dispatch(login(credentials));

    if (login.fulfilled.match(result)) {
      const userRole = result.payload.user.role;
      const userName = `${result.payload.user.first_name} ${result.payload.user.last_name}`;

      console.log('========================================');
      console.log('Login successful!');
      console.log('User role:', userRole);
      console.log('User name:', userName);
      console.log('========================================');

      const normalizedRole = userRole.toLowerCase();

      // setTimeout defers navigation to the next event loop tick,
      // letting Redux finish updating state before re-rendering
      setTimeout(() => {
        if (normalizedRole === 'client') {
          console.log('🔵 NAVIGATING TO CLIENT DASHBOARD');
          onNavigate('Client');
        } else if (normalizedRole === 'freelancer') {
          console.log('🟢 NAVIGATING TO FREELANCER DASHBOARD');
          onNavigate('Freelancer');
        } else {
          console.log('⚪ NAVIGATING TO HOME');
          onNavigate('Home');
        }
      }, 0);

    } else if (login.rejected.match(result)) {
      const errorMessage = result.payload?.message || 'Login failed. Please try again.';
      setServerError(errorMessage);

      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }

      if (
        errorMessage.toLowerCase().includes('user not found') ||
        errorMessage.toLowerCase().includes('invalid email')
      ) {
        Alert.alert(
          'Account Not Found',
          'No account exists with this email address. Would you like to create an account?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Account',
              onPress: () => {
                setCredentials({ email_address: '', password: '' });
                onNavigate('RoleSelection');
              },
            },
          ]
        );
      } else if (
        errorMessage.toLowerCase().includes('invalid credentials') ||
        errorMessage.toLowerCase().includes('invalid password') ||
        errorMessage.toLowerCase().includes('wrong password')
      ) {
        setErrors((prev) => ({ ...prev, password: 'Incorrect password. Please try again.' }));
        Alert.alert(
          'Invalid Credentials',
          'The email or password you entered is incorrect. Please try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Login Failed', errorMessage, [{ text: 'OK' }]);
      }
    }
  };

  const handleForgotPassword = () => {
    if (!credentials.email_address.trim()) {
      Alert.alert(
        'Email Required',
        'Please enter your email address to receive a password reset link.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Forgot Password?',
      `We'll send a password reset link to ${credentials.email_address} if an account exists.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: () => {
            Alert.alert(
              'Reset Link Sent',
              `If an account exists with ${credentials.email_address}, you will receive a password reset link shortly.`,
              [{ text: 'OK' }]
            );
            setCredentials((prev) => ({ ...prev, password: '' }));
          },
        },
      ]
    );
  };

  const handleDemoLogin = () => {
    Alert.alert(
      'Demo Accounts',
      'Choose a demo account to explore the app:',
      [
        {
          text: 'Client Demo',
          onPress: () => {
            setCredentials({ email_address: 'client@demo.com', password: 'demo123' });
            setErrors({});
            setServerError(null);
          },
        },
        {
          text: 'Freelancer Demo',
          onPress: () => {
            setCredentials({ email_address: 'freelancer@demo.com', password: 'demo123' });
            setErrors({});
            setServerError(null);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
      setServerError(null);
    };
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setCredentials({ email_address: '', password: '' });
                setErrors({});
                setServerError(null);
                onNavigate('Home');
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#D4AF37" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>X</Text>
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue to your account</Text>
            </View>

            {serverError && (
              <View style={styles.serverErrorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            {error && !serverError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                <Text style={styles.errorText}>
                  {typeof error === 'string' ? error : error.message}
                </Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="rgba(255,255,255,0.5)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, errors.email_address && styles.inputError]}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={credentials.email_address}
                    onChangeText={(text) => {
                      setCredentials({ ...credentials, email_address: text });
                      if (errors.email_address) setErrors({ ...errors, email_address: null });
                      if (serverError) setServerError(null);
                    }}
                  />
                </View>
                {errors.email_address && (
                  <Text style={styles.errorText}>{errors.email_address}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="rgba(255,255,255,0.5)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPassword}
                    value={credentials.password}
                    onChangeText={(text) => {
                      setCredentials({ ...credentials, password: text });
                      if (errors.password) setErrors({ ...errors, password: null });
                      if (serverError) setServerError(null);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="rgba(255,255,255,0.5)"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0a0a0a" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoButton}
                onPress={handleDemoLogin}
                activeOpacity={0.7}
              >
                <Ionicons name="rocket-outline" size={18} color="#D4AF37" />
                <Text style={styles.demoButtonText}>Try Demo Account</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.signupPrompt}>
                <Text style={styles.signupPromptText}>Don't have an account?</Text>
                <TouchableOpacity
                  onPress={() => {
                    setCredentials({ email_address: '', password: '' });
                    setErrors({});
                    setServerError(null);
                    onNavigate('RoleSelection');
                  }}
                >
                  <Text style={styles.signupPromptLink}> Create Account</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 Quick Tips:</Text>
                <Text style={styles.tipText}>• Use the email address you registered with</Text>
                <Text style={styles.tipText}>• Password is case-sensitive</Text>
                <Text style={styles.tipText}>• For demo, try our demo accounts</Text>
                <Text style={styles.tipText}>• Demo Client: client@demo.com / demo123</Text>
                <Text style={styles.tipText}>• Demo Freelancer: freelancer@demo.com / demo123</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBox: {
    width: 70,
    height: 70,
    backgroundColor: '#D4AF37',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  serverErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,53,69,0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(220,53,69,0.3)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,53,69,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b6b',
  },
  serverErrorText: {
    fontSize: 13,
    color: '#ff6b6b',
    flex: 1,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    paddingLeft: 42,
    fontSize: 16,
    color: '#ffffff',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
  },
  forgotPassword: {
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  demoButtonText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  signupPromptText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  signupPromptLink: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
  },
  tipsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
});