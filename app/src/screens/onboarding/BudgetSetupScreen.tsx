import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';
import { SUPPORTED_CURRENCIES } from '../../types/onboarding';
import ProgressIndicator from '../../components/onboarding/ProgressIndicator';
import OnboardingButton from '../../components/onboarding/OnboardingButton';

export default function BudgetSetupScreen() {
  const { state, setBudget, goToNextStep, goToPreviousStep } = useOnboarding();
  const [budgetAmount, setBudgetAmount] = useState(
    state.data.budgetAmount ? state.data.budgetAmount.toString() : ''
  );
  const [budgetPeriod, setBudgetPeriod] = useState<'weekly' | 'monthly'>(
    state.data.budgetPeriod || 'monthly'
  );

  const getCurrencySymbol = () => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === state.data.currency);
    return currency?.symbol || '$';
  };

  const handleContinue = () => {
    const amount = parseFloat(budgetAmount);
    
    if (!budgetAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount greater than 0.');
      return;
    }

    setBudget(amount, budgetPeriod);
    goToNextStep();
  };

  const formatPreviewAmount = () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount)) return '';
    
    return new Intl.NumberFormat(state.data.locale, {
      style: 'currency',
      currency: state.data.currency,
    }).format(amount);
  };

  const getEstimatedDaily = () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount)) return '';
    
    const dailyAmount = budgetPeriod === 'weekly' ? amount / 7 : amount / 30;
    return new Intl.NumberFormat(state.data.locale, {
      style: 'currency',
      currency: state.data.currency,
    }).format(dailyAmount);
  };

  const getEstimatedYearly = () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount)) return '';
    
    const yearlyAmount = budgetPeriod === 'weekly' ? amount * 52 : amount * 12;
    return new Intl.NumberFormat(state.data.locale, {
      style: 'currency',
      currency: state.data.currency,
    }).format(yearlyAmount);
  };

  return (
    <View style={styles.container}>
      <ProgressIndicator
        currentStep={2}
        totalSteps={5}
        stepTitles={['Currency & Locale', 'Budget Setup', 'Categories', 'Privacy Settings', 'Security Setup']}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Your Budget</Text>
          <Text style={styles.subtitle}>
            Setting a budget helps you track your spending and stay on top of your finances.
            You can always adjust this later.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Amount</Text>
          <Text style={styles.sectionDescription}>
            Enter your total budget for the selected period.
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
            <TextInput
              style={styles.amountInput}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              placeholder="0.00"
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>

          {budgetAmount && !isNaN(parseFloat(budgetAmount)) && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Formatted amount:</Text>
              <Text style={styles.previewValue}>{formatPreviewAmount()}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Period</Text>
          <Text style={styles.sectionDescription}>
            Choose how often you want to track your budget.
          </Text>
          
          <View style={styles.periodContainer}>
            <TouchableOpacity
              style={[
                styles.periodOption,
                budgetPeriod === 'weekly' && styles.periodOptionActive,
              ]}
              onPress={() => setBudgetPeriod('weekly')}
            >
              <Text
                style={[
                  styles.periodText,
                  budgetPeriod === 'weekly' && styles.periodTextActive,
                ]}
              >
                Weekly
              </Text>
              <Text
                style={[
                  styles.periodDescription,
                  budgetPeriod === 'weekly' && styles.periodDescriptionActive,
                ]}
              >
                Reset every week
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodOption,
                budgetPeriod === 'monthly' && styles.periodOptionActive,
              ]}
              onPress={() => setBudgetPeriod('monthly')}
            >
              <Text
                style={[
                  styles.periodText,
                  budgetPeriod === 'monthly' && styles.periodTextActive,
                ]}
              >
                Monthly
              </Text>
              <Text
                style={[
                  styles.periodDescription,
                  budgetPeriod === 'monthly' && styles.periodDescriptionActive,
                ]}
              >
                Reset every month
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {budgetAmount && !isNaN(parseFloat(budgetAmount)) && (
          <View style={styles.estimatesContainer}>
            <Text style={styles.estimatesTitle}>Budget Breakdown</Text>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>Daily average:</Text>
              <Text style={styles.estimateValue}>{getEstimatedDaily()}</Text>
            </View>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>Yearly estimate:</Text>
              <Text style={styles.estimateValue}>{getEstimatedYearly()}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 This is just a starting point. You can create multiple budgets and categories
            to better organize your finances later.
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
            disabled={!budgetAmount || isNaN(parseFloat(budgetAmount)) || parseFloat(budgetAmount) <= 0}
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    paddingVertical: 16,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  periodOption: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  periodOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  periodTextActive: {
    color: '#007AFF',
  },
  periodDescription: {
    fontSize: 12,
    color: '#999',
  },
  periodDescriptionActive: {
    color: '#007AFF',
  },
  estimatesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  estimatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  estimateLabel: {
    fontSize: 14,
    color: '#666',
  },
  estimateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
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
    paddingBottom: 34,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
}); 