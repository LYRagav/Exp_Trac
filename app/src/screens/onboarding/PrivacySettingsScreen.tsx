import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';
import { PrivacySettings } from '../../types/onboarding';
import ProgressIndicator from '../../components/onboarding/ProgressIndicator';
import OnboardingButton from '../../components/onboarding/OnboardingButton';

export default function PrivacySettingsScreen() {
  const { state, setPrivacySettings, goToNextStep, goToPreviousStep } = useOnboarding();
  const [settings, setSettings] = useState<PrivacySettings>(
    state.data.privacySettings || {
      enableCloudBackup: false,
      enableBiometricAuth: true,
      shareAnalytics: false,
    }
  );

  const handleContinue = () => {
    setPrivacySettings(settings);
    goToNextStep();
  };

  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <ProgressIndicator
        currentStep={4}
        totalSteps={5}
        stepTitles={['Currency & Locale', 'Budget Setup', 'Categories', 'Privacy Settings', 'Security Setup']}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy & Security</Text>
          <Text style={styles.subtitle}>
            Your privacy is important to us. Configure how your data is handled and secured.
            You can change these settings anytime in the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Backup</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>iCloud Backup</Text>
              <Text style={styles.settingDescription}>
                Securely backup your financial data to iCloud. Your data is encrypted
                and only you can access it.
              </Text>
            </View>
            <Switch
              value={settings.enableCloudBackup}
              onValueChange={(value) => updateSetting('enableCloudBackup', value)}
              trackColor={{ false: '#E5E5E5', true: '#34C759' }}
              thumbColor={settings.enableCloudBackup ? '#fff' : '#f4f3f4'}
            />
          </View>

          {settings.enableCloudBackup && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ✅ Your data will be encrypted before being stored in iCloud.
                Only you can decrypt and access your financial information.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>
                Use Face ID or Touch ID to secure access to your financial data.
                Recommended for enhanced security.
              </Text>
            </View>
            <Switch
              value={settings.enableBiometricAuth}
              onValueChange={(value) => updateSetting('enableBiometricAuth', value)}
              trackColor={{ false: '#E5E5E5', true: '#34C759' }}
              thumbColor={settings.enableBiometricAuth ? '#fff' : '#f4f3f4'}
            />
          </View>

          {settings.enableBiometricAuth && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                🔒 Biometric authentication adds an extra layer of security.
                Your biometric data never leaves your device.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics & Improvement</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Share Anonymous Analytics</Text>
              <Text style={styles.settingDescription}>
                Help us improve the app by sharing anonymous usage data.
                No personal or financial information is included.
              </Text>
            </View>
            <Switch
              value={settings.shareAnalytics}
              onValueChange={(value) => updateSetting('shareAnalytics', value)}
              trackColor={{ false: '#E5E5E5', true: '#34C759' }}
              thumbColor={settings.shareAnalytics ? '#fff' : '#f4f3f4'}
            />
          </View>

          {settings.shareAnalytics && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📊 Only anonymous usage patterns are shared. Your financial data,
                personal information, and transaction details remain private.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.privacyStatement}>
          <Text style={styles.privacyTitle}>Our Privacy Promise</Text>
          <Text style={styles.privacyText}>
            • Your financial data is encrypted and stored locally on your device{'\n'}
            • We never sell or share your personal information{'\n'}
            • You have full control over your data and can export or delete it anytime{'\n'}
            • All data transmission uses industry-standard encryption{'\n'}
            • We follow strict security practices to protect your information
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Important: If you disable iCloud backup and lose your device,
            your financial data cannot be recovered. Consider enabling backup
            for data safety.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <OnboardingButton
            title="Back"
            onPress={goToPreviousStep}
            variant="outline"
            fullWidth={false}
          />
          <OnboardingButton
            title="Continue"
            onPress={handleContinue}
            fullWidth={false}
          />
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#0066CC',
    lineHeight: 18,
  },
  privacyStatement: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    marginBottom: 24,
  },
  warningText: {
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