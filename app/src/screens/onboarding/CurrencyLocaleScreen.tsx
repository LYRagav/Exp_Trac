import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useOnboarding } from '../../context/OnboardingContext';
import { SUPPORTED_CURRENCIES, SUPPORTED_LOCALES } from '../../types/onboarding';
import ProgressIndicator from '../../components/onboarding/ProgressIndicator';
import OnboardingButton from '../../components/onboarding/OnboardingButton';

export default function CurrencyLocaleScreen() {
  const { state, setCurrencyLocale, goToNextStep } = useOnboarding();
  const [selectedCurrency, setSelectedCurrency] = useState(state.data.currency || 'USD');
  const [selectedLocale, setSelectedLocale] = useState(state.data.locale || 'en-US');

  const handleContinue = () => {
    if (!selectedCurrency || !selectedLocale) {
      Alert.alert('Required Fields', 'Please select both currency and locale to continue.');
      return;
    }

    setCurrencyLocale(selectedCurrency, selectedLocale);
    goToNextStep();
  };

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const getLocaleName = (localeCode: string) => {
    const locale = SUPPORTED_LOCALES.find(l => l.code === localeCode);
    return locale?.name || localeCode;
  };

  return (
    <View style={styles.container}>
      <ProgressIndicator
        currentStep={1}
        totalSteps={5}
        stepTitles={['Currency & Locale', 'Budget Setup', 'Categories', 'Privacy Settings', 'Security Setup']}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Let's get started!</Text>
          <Text style={styles.subtitle}>
            First, let's set up your preferred currency and locale. This will help us format
            numbers and dates according to your preferences.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <Text style={styles.sectionDescription}>
            Choose your primary currency for budgeting and expense tracking.
          </Text>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCurrency}
              onValueChange={(itemValue) => setSelectedCurrency(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <Picker.Item
                  key={currency.code}
                  label={`${currency.symbol} ${currency.name} (${currency.code})`}
                  value={currency.code}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview:</Text>
            <Text style={styles.previewValue}>
              {getCurrencySymbol(selectedCurrency)}1,234.56
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language & Region</Text>
          <Text style={styles.sectionDescription}>
            This affects how dates, numbers, and text are displayed in the app.
          </Text>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedLocale}
              onValueChange={(itemValue) => setSelectedLocale(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {SUPPORTED_LOCALES.map((locale) => (
                <Picker.Item
                  key={locale.code}
                  label={locale.name}
                  value={locale.code}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Date format preview:</Text>
            <Text style={styles.previewValue}>
              {new Date().toLocaleDateString(selectedLocale)}
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Don't worry, you can change these settings later in the app preferences.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedCurrency || !selectedLocale}
        />
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
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 32,
    overflow: 'hidden',
  },
  picker: {
    height: 60,
    marginHorizontal: 8,
  },
  pickerItem: {
    height: 60,
    fontSize: 16,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginBottom: 16,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    flexShrink: 0,
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#8B5A00',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 34, // Extra padding for safe area
  },
}); 