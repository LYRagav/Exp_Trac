export interface OnboardingData {
  currency: string;
  locale: string;
  budgetAmount: number;
  budgetPeriod: 'weekly' | 'monthly';
  categories: Category[];
  privacySettings: PrivacySettings;
  keypairGenerated: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  parentId?: string;
}

export interface PrivacySettings {
  enableCloudBackup: boolean;
  enableBiometricAuth: boolean;
  shareAnalytics: boolean;
}

export interface OnboardingStep {
  id: number;
  title: string;
  component: string;
  isRequired: boolean;
  isCompleted: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Currency & Locale',
    component: 'CurrencyLocaleScreen',
    isRequired: true,
    isCompleted: false,
  },
  {
    id: 2,
    title: 'Budget Setup',
    component: 'BudgetSetupScreen',
    isRequired: true,
    isCompleted: false,
  },
  {
    id: 3,
    title: 'Categories',
    component: 'CategorySeedScreen',
    isRequired: false,
    isCompleted: false,
  },
  {
    id: 4,
    title: 'Privacy Settings',
    component: 'PrivacySettingsScreen',
    isRequired: true,
    isCompleted: false,
  },
  {
    id: 5,
    title: 'Security Setup',
    component: 'KeypairGenerationScreen',
    isRequired: true,
    isCompleted: false,
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  { id: '1', name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B', type: 'expense' },
  { id: '2', name: 'Transportation', icon: '🚗', color: '#4ECDC4', type: 'expense' },
  { id: '3', name: 'Shopping', icon: '🛍️', color: '#45B7D1', type: 'expense' },
  { id: '4', name: 'Entertainment', icon: '🎬', color: '#96CEB4', type: 'expense' },
  { id: '5', name: 'Bills & Utilities', icon: '💡', color: '#FFEAA7', type: 'expense' },
  { id: '6', name: 'Healthcare', icon: '🏥', color: '#DDA0DD', type: 'expense' },
  { id: '7', name: 'Education', icon: '📚', color: '#98D8C8', type: 'expense' },
  { id: '8', name: 'Travel', icon: '✈️', color: '#F7DC6F', type: 'expense' },
  
  // Income categories
  { id: '9', name: 'Salary', icon: '💼', color: '#82E0AA', type: 'income' },
  { id: '10', name: 'Freelance', icon: '💻', color: '#85C1E9', type: 'income' },
  { id: '11', name: 'Investment', icon: '📈', color: '#F8C471', type: 'income' },
  { id: '12', name: 'Other Income', icon: '💰', color: '#D7BDE2', type: 'income' },
];

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export const SUPPORTED_LOCALES = [
  { code: 'en-US', name: 'English (United States)' },
  { code: 'en-GB', name: 'English (United Kingdom)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'ko-KR', name: 'Korean (South Korea)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
]; 