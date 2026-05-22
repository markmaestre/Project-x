import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import api from '../../services/api';

export default function Register({ onNavigate }) {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [work_email, setWorkEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!first_name || !last_name || !work_email || !password || !country) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(work_email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // IMPORTANT: Dapat "/client/register" hindi "/register" lang
      const res = await api.post('/client/register', {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        work_email: work_email.trim().toLowerCase(),
        password,
        country: country.trim(),
        image_url: null,
      });

      console.log('Response:', res.data);

      Alert.alert(
        'Success', 
        res.data.message || 'User registered successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setFirstName('');
              setLastName('');
              setWorkEmail('');
              setPassword('');
              setCountry('');
              // Go to login screen
              onNavigate('Login');
            },
          },
        ]
      );
    } catch (err) {
      console.log('Full error:', err);
      console.log('Response data:', err.response?.data);
      console.log('Response status:', err.response?.status);
      
      let errorMessage = 'Registration failed';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          <TextInput
            placeholder="First Name"
            style={styles.input}
            value={first_name}
            onChangeText={setFirstName}
            placeholderTextColor="#999"
            autoCapitalize="words"
          />

          <TextInput
            placeholder="Last Name"
            style={styles.input}
            value={last_name}
            onChangeText={setLastName}
            placeholderTextColor="#999"
            autoCapitalize="words"
          />

          <TextInput
            placeholder="Work Email"
            style={styles.input}
            value={work_email}
            onChangeText={setWorkEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#999"
          />

          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#999"
          />

          <TextInput
            placeholder="Country"
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholderTextColor="#999"
            autoCapitalize="words"
          />

          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : (
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          )}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => onNavigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  registerButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});