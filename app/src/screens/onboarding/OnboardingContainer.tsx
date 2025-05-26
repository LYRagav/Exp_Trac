import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';

import CurrencyLocaleScreen from './CurrencyLocaleScreen';
import BudgetSetupScreen from './BudgetSetupScreen';
import CategorySeedScreen from './CategorySeedScreen';
import PrivacySettingsScreen from './PrivacySettingsScreen';
import KeypairGenerationScreen from './KeypairGenerationScreen';

export default function OnboardingContainer() {
  const { state } = useOnboarding();

  const renderCurrentScreen = () => {
    switch (state.currentStep) {
      case 1:
        return <CurrencyLocaleScreen />;
      case 2:
        return <BudgetSetupScreen />;
      case 3:
        return <CategorySeedScreen />;
      case 4:
        return <PrivacySettingsScreen />;
      case 5:
        return <KeypairGenerationScreen />;
      default:
        return <CurrencyLocaleScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 