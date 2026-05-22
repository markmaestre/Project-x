import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function Home({ onNavigate }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard Home</Text>
      <Text style={styles.subtitle}>Welcome to the app startup screen.</Text>
      <View style={styles.buttonGroup}>
        <Button title="Login" onPress={() => onNavigate('Login')} />
        <Button title="Register" onPress={() => onNavigate('Register')} />
      </View>
      <View style={styles.buttonGroup}>
        <Button title="Client" onPress={() => onNavigate('Client')} />
        <Button title="Freelancer" onPress={() => onNavigate('Freelancer')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  buttonGroup: {
    marginBottom: 12,
  },
});
