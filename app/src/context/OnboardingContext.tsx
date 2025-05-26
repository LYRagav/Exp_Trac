import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { OnboardingData, PrivacySettings, Category, DEFAULT_CATEGORIES } from '../types/onboarding';

interface OnboardingState {
  data: Partial<OnboardingData>;
  currentStep: number;
  isCompleted: boolean;
  errors: Record<string, string>;
}

type OnboardingAction =
  | { type: 'SET_CURRENCY_LOCALE'; payload: { currency: string; locale: string } }
  | { type: 'SET_BUDGET'; payload: { budgetAmount: number; budgetPeriod: 'weekly' | 'monthly' } }
  | { type: 'SET_CATEGORIES'; payload: { categories: Category[] } }
  | { type: 'SET_PRIVACY_SETTINGS'; payload: { privacySettings: PrivacySettings } }
  | { type: 'SET_KEYPAIR_GENERATED'; payload: { keypairGenerated: boolean } }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SET_STEP'; payload: { step: number } }
  | { type: 'SET_ERROR'; payload: { field: string; error: string } }
  | { type: 'CLEAR_ERROR'; payload: { field: string } }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'COMPLETE_ONBOARDING' };

const initialState: OnboardingState = {
  data: {
    currency: 'USD',
    locale: 'en-US',
    budgetAmount: 0,
    budgetPeriod: 'monthly',
    categories: DEFAULT_CATEGORIES,
    privacySettings: {
      enableCloudBackup: false,
      enableBiometricAuth: true,
      shareAnalytics: false,
    },
    keypairGenerated: false,
  },
  currentStep: 1,
  isCompleted: false,
  errors: {},
};

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_CURRENCY_LOCALE':
      return {
        ...state,
        data: {
          ...state.data,
          currency: action.payload.currency,
          locale: action.payload.locale,
        },
      };

    case 'SET_BUDGET':
      return {
        ...state,
        data: {
          ...state.data,
          budgetAmount: action.payload.budgetAmount,
          budgetPeriod: action.payload.budgetPeriod,
        },
      };

    case 'SET_CATEGORIES':
      return {
        ...state,
        data: {
          ...state.data,
          categories: action.payload.categories,
        },
      };

    case 'SET_PRIVACY_SETTINGS':
      return {
        ...state,
        data: {
          ...state.data,
          privacySettings: action.payload.privacySettings,
        },
      };

    case 'SET_KEYPAIR_GENERATED':
      return {
        ...state,
        data: {
          ...state.data,
          keypairGenerated: action.payload.keypairGenerated,
        },
      };

    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, 5),
      };

    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
      };

    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload.step,
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.field]: action.payload.error,
        },
      };

    case 'CLEAR_ERROR':
      const { [action.payload.field]: _, ...remainingErrors } = state.errors;
      return {
        ...state,
        errors: remainingErrors,
      };

    case 'RESET_ONBOARDING':
      return initialState;

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        isCompleted: true,
      };

    default:
      return state;
  }
}

interface OnboardingContextType {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  setCurrencyLocale: (currency: string, locale: string) => void;
  setBudget: (budgetAmount: number, budgetPeriod: 'weekly' | 'monthly') => void;
  setCategories: (categories: Category[]) => void;
  setPrivacySettings: (privacySettings: PrivacySettings) => void;
  setKeypairGenerated: (generated: boolean) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  resetOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
  validateCurrentStep: () => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  const goToNextStep = () => dispatch({ type: 'NEXT_STEP' });
  const goToPreviousStep = () => dispatch({ type: 'PREVIOUS_STEP' });
  const goToStep = (step: number) => dispatch({ type: 'SET_STEP', payload: { step } });

  const setCurrencyLocale = (currency: string, locale: string) =>
    dispatch({ type: 'SET_CURRENCY_LOCALE', payload: { currency, locale } });

  const setBudget = (budgetAmount: number, budgetPeriod: 'weekly' | 'monthly') =>
    dispatch({ type: 'SET_BUDGET', payload: { budgetAmount, budgetPeriod } });

  const setCategories = (categories: Category[]) =>
    dispatch({ type: 'SET_CATEGORIES', payload: { categories } });

  const setPrivacySettings = (privacySettings: PrivacySettings) =>
    dispatch({ type: 'SET_PRIVACY_SETTINGS', payload: { privacySettings } });

  const setKeypairGenerated = (generated: boolean) =>
    dispatch({ type: 'SET_KEYPAIR_GENERATED', payload: { keypairGenerated: generated } });

  const setError = (field: string, error: string) =>
    dispatch({ type: 'SET_ERROR', payload: { field, error } });

  const clearError = (field: string) =>
    dispatch({ type: 'CLEAR_ERROR', payload: { field } });

  const resetOnboarding = () => dispatch({ type: 'RESET_ONBOARDING' });
  
  const completeOnboarding = async () => {
    try {
      // Save all data to secure storage
      await SecureStore.setItemAsync('onboarding_data', JSON.stringify(state.data));
      await SecureStore.setItemAsync('onboarding_completed', 'true');
      
      // Mark onboarding as completed
      dispatch({ type: 'COMPLETE_ONBOARDING' });
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
    }
  };

  const validateCurrentStep = (): boolean => {
    const { data, currentStep } = state;
    
    switch (currentStep) {
      case 1: // Currency & Locale
        return !!(data.currency && data.locale);
      case 2: // Budget Setup
        return !!(data.budgetAmount && data.budgetAmount > 0 && data.budgetPeriod);
      case 3: // Categories (optional)
        return true; // Always valid since it's optional
      case 4: // Privacy Settings
        return !!(data.privacySettings);
      case 5: // Keypair Generation
        return !!(data.keypairGenerated);
      default:
        return false;
    }
  };

  const value: OnboardingContextType = {
    state,
    dispatch,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    setCurrencyLocale,
    setBudget,
    setCategories,
    setPrivacySettings,
    setKeypairGenerated,
    setError,
    clearError,
    resetOnboarding,
    completeOnboarding,
    validateCurrentStep,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 