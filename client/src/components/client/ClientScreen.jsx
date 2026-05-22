import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function ClientScreen({ onNavigate }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Client Area</Text>
      <Text style={styles.message}>This is the client dashboard section.</Text>
      <Button title="Back to Home" onPress={() => onNavigate('Home')} />
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
  message: {
    fontSize: 16,
    marginBottom: 20,
  },
});
