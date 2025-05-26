import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Simple key for testing
const TEST_KEY = 'TEST_SECURE_STORE_KEY';

const SecureStoreTest = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [storedValue, setStoredValue] = useState<string | null>(null);

  // Add a log entry
  const addLog = (message: string) => {
    console.log(message); // Also log to console for debugging
    setLogs((prevLogs) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prevLogs]);
  };

  // Check on initial load if we have a stored value
  useEffect(() => {
    const checkStoredValue = async () => {
      try {
        addLog('Checking for existing value in secure store...');
        const value = await SecureStore.getItemAsync(TEST_KEY);
        setStoredValue(value);
        addLog(`Found value: ${value || 'none'}`);
      } catch (error) {
        addLog(`Error checking stored value: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    checkStoredValue();
  }, []);

  // Save a value to secure store
  const handleSave = async () => {
    try {
      const newValue = `test-value-${Date.now()}`;
      addLog(`Saving value: ${newValue}`);
      await SecureStore.setItemAsync(TEST_KEY, newValue);
      setStoredValue(newValue);
      addLog('Value saved successfully');
    } catch (error) {
      addLog(`Error saving value: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Get the value from secure store
  const handleGet = async () => {
    try {
      addLog('Retrieving value...');
      const value = await SecureStore.getItemAsync(TEST_KEY);
      setStoredValue(value);
      addLog(`Retrieved value: ${value || 'none'}`);
    } catch (error) {
      addLog(`Error retrieving value: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Delete the value from secure store
  const handleDelete = async () => {
    try {
      addLog('Deleting value...');
      await SecureStore.deleteItemAsync(TEST_KEY);
      setStoredValue(null);
      addLog('Value deleted successfully');
    } catch (error) {
      addLog(`Error deleting value: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Secure Store Test</Text>
      <Text style={styles.valueText}>
        Current Value: {storedValue ? storedValue : 'No value stored'}
      </Text>
      
      <View style={styles.buttonRow}>
        <Button title="Save New Value" onPress={handleSave} />
        <Button title="Get Value" onPress={handleGet} />
        <Button title="Delete Value" onPress={handleDelete} />
      </View>
      
      <Text style={styles.sectionTitle}>Logs:</Text>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logEntry}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#212529'
  },
  valueText: {
    fontSize: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    color: '#495057'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
    color: '#212529'
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8
  },
  logEntry: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Courier',
    color: '#212529'
  }
});

export default SecureStoreTest; 