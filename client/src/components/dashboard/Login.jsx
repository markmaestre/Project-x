import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import api from '../../services/api';

export default function Login({ onNavigate }) {
  const [work_email, setWorkEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await api.post('/login', {
        work_email,
        password,
      });

      Alert.alert('Success', res.data.message);

      console.log('TOKEN:', res.data.token);
      console.log('USER:', res.data.user);

      onNavigate('Home');
    } catch (err) {
      console.log(err.response?.data || err.message);
      Alert.alert('Error', 'Invalid login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Work Email"
        style={styles.input}
        onChangeText={setWorkEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={handleLogin} />

      <View style={{ marginTop: 10 }}>
        <Button title="Go to Register" onPress={() => onNavigate('Register')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
});