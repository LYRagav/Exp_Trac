import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { keychainService } from './services/KeychainService';
import { databaseService, Expense } from './services/DatabaseService';

const KeychainTestScreen = () => {
  const [status, setStatus] = useState<string>('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);
  const [keyVersion, setKeyVersion] = useState<number>(0);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [keyMetadata, setKeyMetadata] = useState<any>(null);
  const [backupId, setBackupId] = useState<string>('');
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);

  // Add a log entry
  const addLog = (message: string) => {
    console.log("[KeychainTestScreen]", message); // Also log to console for debugging
    setLogs((prevLogs) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prevLogs]);
  };

  useEffect(() => {
    addLog('KeychainTestScreen useEffect started.');
    const initializeServices = async () => {
      try {
        addLog('useEffect: Checking biometric availability...');
        const biometricAvailable = await databaseService.isBiometricAvailable();
        addLog(`useEffect: Biometric hardware available/enrolled: ${biometricAvailable}`);
        setBiometricAvailable(biometricAvailable);
        
        addLog(`useEffect: Initial biometric enabled by user (screen state): ${biometricEnabled}`);
        
        // Test the native bridge first
        addLog('useEffect: Testing native bridge...');
        try {
          const bridgeResult = await databaseService.testBridge();
          addLog(`useEffect: Bridge test successful: ${bridgeResult}`);
        } catch (bridgeError) {
          addLog(`useEffect: Bridge test FAILED: ${bridgeError}`);
          setStatus('Bridge test failed - native module not working');
          return; // Don't proceed if bridge is broken
        }
        
        addLog('useEffect: Calling databaseService.initializeDatabase()...');
        await databaseService.initializeDatabase();
        addLog('useEffect: Database initialization completed successfully.');
        setDbInitialized(true);
        setStatus('Database initialized successfully!');
        
        // Load initial key information
        await loadKeyInfo();
      } catch (error) {
        addLog(`useEffect: ERROR during initialization: ${error}`);
        setStatus(`Initialization failed: ${error}`);
      }
    };

    initializeServices();
  }, []);

  const loadKeyInfo = async () => {
    try {
      const version = databaseService.getCurrentKeyVersion();
      const metadata = databaseService.getKeyMetadata();
      const biometricAvail = await databaseService.isBiometricAvailable();
      const biometricEnabl = databaseService.isBiometricAuthEnabled();
      
      setKeyVersion(version);
      setKeyMetadata(metadata);
      setBiometricAvailable(biometricAvail);
      setBiometricEnabled(biometricEnabl);
    } catch (error) {
      addLog(`Failed to load key info: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Generate and store a new key
  const handleGenerateKey = async () => {
    try {
      addLog('Generating new encryption key...');
      const key = await keychainService.generateSecureKey();
      await keychainService.storeEncryptionKey(key);
      addLog('New key generated and stored');
      
      // Re-initialize the database with the new key
      await databaseService.close();
      await databaseService.initializeDatabase();
      setDbInitialized(true);
      addLog('Database re-initialized with new key');
    } catch (error) {
      addLog(`Error generating key: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Rotate the encryption key
  const handleRotateKey = async () => {
    try {
      addLog('Rotating encryption key...');
      await databaseService.rotateEncryptionKey();
      addLog('Key rotation complete');
    } catch (error) {
      addLog(`Error rotating key: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Enable/disable biometric authentication
  const toggleBiometric = async () => {
    try {
      const newState = !biometricEnabled;
      addLog(`${newState ? 'Enabling' : 'Disabling'} biometric authentication...`);
      
      if (newState && !biometricAvailable) {
        Alert.alert('Biometrics Not Available', 'Biometric authentication is not available on this device or not set up in device settings.');
        return;
      }
      
      await databaseService.setBiometricAuthentication(newState);
      setBiometricEnabled(newState);
      addLog(`Biometric authentication ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      addLog(`Error toggling biometric: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test database access with current key
  const testDatabaseAccess = async () => {
    try {
      addLog('Testing database access...');
      
      // Try to insert a test expense
      const testExpense: Expense = {
        amount: 10.99,
        category: 'Test',
        date: new Date().toISOString(),
        description: 'Test expense for key verification',
      };
      
      await databaseService.addExpense(testExpense);
      addLog('✅ Database access successful - expense inserted');
      
      // Try to retrieve expenses
      const expenses = await databaseService.getAllExpenses();
      addLog(`✅ Retrieved ${expenses.length} expenses from database`);
    } catch (error) {
      addLog(`❌ Database access failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test key rotation
  const testKeyRotation = async () => {
    try {
      addLog('Starting key rotation test...');
      await databaseService.rotateEncryptionKey();
      addLog('✅ Key rotation completed successfully');
      await loadKeyInfo(); // Refresh key information
    } catch (error) {
      addLog(`❌ Key rotation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test key backup creation
  const testKeyBackup = async () => {
    try {
      addLog('Creating key backup...');
      const newBackupId = await databaseService.createKeyBackup();
      setBackupId(newBackupId);
      addLog(`✅ Key backup created with ID: ${newBackupId}`);
      await loadKeyInfo(); // Refresh key information
    } catch (error) {
      addLog(`❌ Key backup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test biometric authentication
  const testBiometricAuth = async () => {
    try {
      addLog('Testing biometric authentication...');
      const result = await keychainService.authenticateWithBiometrics();
      if (result.success) {
        addLog('✅ Biometric authentication successful');
      } else {
        addLog(`❌ Biometric authentication failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Biometric authentication error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Keychain & Database Test</Text>
      <Text style={styles.status}>Status: {status}</Text>
      
      {/* Key Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Information</Text>
        <Text style={styles.info}>Key Version: {keyVersion}</Text>
        <Text style={styles.info}>Biometric Available: {biometricAvailable ? 'Yes' : 'No'}</Text>
        <Text style={styles.info}>Biometric Enabled: {biometricEnabled ? 'Yes' : 'No'}</Text>
        {keyMetadata && (
          <>
            <Text style={styles.info}>Algorithm: {keyMetadata.algorithm}</Text>
            <Text style={styles.info}>Key Size: {keyMetadata.keySize} bits</Text>
            <Text style={styles.info}>Created: {new Date(keyMetadata.createdAt).toLocaleDateString()}</Text>
            {keyMetadata.lastRotated && (
              <Text style={styles.info}>Last Rotated: {new Date(keyMetadata.lastRotated).toLocaleDateString()}</Text>
            )}
            <Text style={styles.info}>Backup Enabled: {keyMetadata.backupEnabled ? 'Yes' : 'No'}</Text>
          </>
        )}
        {backupId && <Text style={styles.info}>Last Backup ID: {backupId}</Text>}
      </View>

      {/* Key Management Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Management</Text>
        <View style={styles.buttonRow}>
          <Button title="Rotate Key" onPress={testKeyRotation} />
          <Button title="Create Backup" onPress={testKeyBackup} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Test Biometric" onPress={testBiometricAuth} disabled={!biometricAvailable} />
          <Button title="Refresh Info" onPress={loadKeyInfo} />
        </View>
      </View>

      {/* Database Testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Testing</Text>
        <View style={styles.buttonRow}>
          <Button title="Generate Key" onPress={handleGenerateKey} />
          <Button title="Store Key" onPress={handleGenerateKey} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Retrieve Key" onPress={handleGenerateKey} />
          <Button title="Delete Key" onPress={handleGenerateKey} />
        </View>
        <View style={styles.buttonRow}>
          <Button 
            title={`${biometricEnabled ? 'Disable' : 'Enable'} Biometric`} 
            onPress={toggleBiometric}
            disabled={!biometricAvailable && !biometricEnabled} 
          />
          <Button title="Test DB Access" onPress={testDatabaseAccess} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Logs:</Text>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logEntry}>{log}</Text>
        ))}
      </ScrollView>
    </ScrollView>
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
  status: {
    fontSize: 16,
    marginBottom: 16,
    color: '#495057'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
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
  },
  info: {
    fontSize: 14,
    marginBottom: 8,
    color: '#495057'
  }
});

export default KeychainTestScreen; 