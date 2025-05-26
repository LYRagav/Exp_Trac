import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { OnboardingProvider } from './src/context/OnboardingContext';
import OnboardingContainer from './src/screens/onboarding/OnboardingContainer';
import KeychainTestScreen from './src/KeychainTestScreen';

export default function App() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingData = await SecureStore.getItemAsync('onboarding_data');
      if (onboardingData) {
        const data = JSON.parse(onboardingData);
        setIsOnboardingComplete(data.onboardingCompleted || false);
      } else {
        setIsOnboardingComplete(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboardingComplete(false);
    }
  };

  // Show loading state while checking onboarding status
  if (isOnboardingComplete === null) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  // Show onboarding flow if not completed
  if (!isOnboardingComplete) {
    return (
      <OnboardingProvider>
        <SafeAreaView style={styles.container}>
          <OnboardingContainer />
          <StatusBar style="auto" />
        </SafeAreaView>
      </OnboardingProvider>
    );
  }

  // Show main app if onboarding is complete
  return (
    <SafeAreaView style={styles.container}>
      <KeychainTestScreen />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
});
