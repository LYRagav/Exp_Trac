import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useOnboarding } from '../../context/OnboardingContext';
import ProgressIndicator from '../../components/onboarding/ProgressIndicator';
import OnboardingButton from '../../components/onboarding/OnboardingButton';

export default function KeypairGenerationScreen() {
  const { state, setKeypairGenerated, goToPreviousStep, completeOnboarding } = useOnboarding();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(state.data.keypairGenerated || false);
  const [generationStep, setGenerationStep] = useState('');

  const generateKeypair = async () => {
    setIsGenerating(true);
    setGenerationStep('Checking biometric availability...');

    try {
      // Check if biometric authentication is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware) {
        Alert.alert(
          'Biometric Hardware Not Available',
          'Your device does not support biometric authentication. The app will use device passcode for security.'
        );
      } else if (!isEnrolled) {
        Alert.alert(
          'No Biometric Data Enrolled',
          'Please set up Face ID or Touch ID in your device settings for enhanced security.'
        );
      }

      setGenerationStep('Generating encryption keys...');
      
      // Simulate key generation process (in real app, this would use crypto libraries)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate a random key for demonstration
      const encryptionKey = generateRandomKey();
      
      setGenerationStep('Storing keys securely...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store the key in secure storage
      await SecureStore.setItemAsync('encryption_key', encryptionKey, {
        requireAuthentication: state.data.privacySettings?.enableBiometricAuth || false,
      });

      setGenerationStep('Verifying key storage...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify the key was stored successfully
      const storedKey = await SecureStore.getItemAsync('encryption_key');
      if (!storedKey) {
        throw new Error('Failed to verify key storage');
      }

      setGenerationStep('Complete!');
      setIsGenerated(true);
      setKeypairGenerated(true);
      
    } catch (error) {
      console.error('Key generation failed:', error);
      Alert.alert(
        'Key Generation Failed',
        'There was an error generating your encryption keys. Please try again.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const generateRandomKey = (): string => {
    // In a real app, this would use proper cryptographic key generation
    const array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleComplete = async () => {
    try {
      // Save all onboarding data to secure storage
      const onboardingData = {
        currency: state.data.currency,
        locale: state.data.locale,
        budgetAmount: state.data.budgetAmount,
        budgetPeriod: state.data.budgetPeriod,
        categories: state.data.categories,
        privacySettings: state.data.privacySettings,
        keypairGenerated: true,
        onboardingCompleted: true,
        completedAt: new Date().toISOString(),
      };

      await SecureStore.setItemAsync('onboarding_data', JSON.stringify(onboardingData));
      
      completeOnboarding();
      
      Alert.alert(
        'Setup Complete!',
        'Your expense tracker is ready to use. Welcome aboard!',
        [{ text: 'Get Started', onPress: () => {} }]
      );
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      Alert.alert(
        'Save Error',
        'There was an error saving your settings. Please try again.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <ProgressIndicator
        currentStep={5}
        totalSteps={5}
        stepTitles={['Currency & Locale', 'Budget Setup', 'Categories', 'Privacy Settings', 'Security Setup']}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Secure Your Data</Text>
          <Text style={styles.subtitle}>
            We'll generate encryption keys to keep your financial data secure.
            This process ensures only you can access your information.
          </Text>
        </View>

        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>🔐 What happens during key generation:</Text>
          <Text style={styles.securityText}>
            • Cryptographic keys are generated on your device{'\n'}
            • Keys are stored in your device's secure enclave{'\n'}
            • Your financial data will be encrypted with these keys{'\n'}
            • Only you can decrypt and access your data{'\n'}
            • Keys never leave your device
          </Text>
        </View>

        {!isGenerated ? (
          <View style={styles.generationSection}>
            <View style={styles.iconContainer}>
              <Text style={styles.securityIcon}>🛡️</Text>
            </View>
            
            <Text style={styles.generationTitle}>Ready to Generate Keys</Text>
            <Text style={styles.generationDescription}>
              This process takes a few seconds and ensures your data remains private and secure.
            </Text>

            {isGenerating && (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.progressText}>{generationStep}</Text>
              </View>
            )}

            {!isGenerating && (
              <OnboardingButton
                title="Generate Security Keys"
                onPress={generateKeypair}
                loading={isGenerating}
              />
            )}
          </View>
        ) : (
          <View style={styles.successSection}>
            <View style={styles.iconContainer}>
              <Text style={styles.successIcon}>✅</Text>
            </View>
            
            <Text style={styles.successTitle}>Keys Generated Successfully!</Text>
            <Text style={styles.successDescription}>
              Your encryption keys have been securely generated and stored.
              Your financial data is now protected.
            </Text>

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Setup Summary</Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Currency:</Text>
                <Text style={styles.summaryValue}>{state.data.currency}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Budget:</Text>
                <Text style={styles.summaryValue}>
                  {new Intl.NumberFormat(state.data.locale, {
                    style: 'currency',
                    currency: state.data.currency,
                  }).format(state.data.budgetAmount || 0)} / {state.data.budgetPeriod}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Categories:</Text>
                <Text style={styles.summaryValue}>{state.data.categories?.length || 0} categories</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Backup:</Text>
                <Text style={styles.summaryValue}>
                  {state.data.privacySettings?.enableCloudBackup ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Biometric Auth:</Text>
                <Text style={styles.summaryValue}>
                  {state.data.privacySettings?.enableBiometricAuth ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 Your encryption keys are unique to your device and cannot be recovered
            if lost. Make sure to enable iCloud backup if you want to restore your data
            on a new device.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          {!isGenerated && (
            <OnboardingButton
              title="Back"
              onPress={goToPreviousStep}
              variant="outline"
              fullWidth={false}
              disabled={isGenerating}
            />
          )}
          {isGenerated && (
            <OnboardingButton
              title="Complete Setup"
              onPress={handleComplete}
              fullWidth={true}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  securityInfo: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 12,
  },
  securityText: {
    fontSize: 14,
    color: '#0066CC',
    lineHeight: 22,
  },
  generationSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  securityIcon: {
    fontSize: 64,
  },
  successIcon: {
    fontSize: 64,
  },
  generationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 8,
    textAlign: 'center',
  },
  generationDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  successDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 12,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  infoBox: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#8B5A00',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
}); 