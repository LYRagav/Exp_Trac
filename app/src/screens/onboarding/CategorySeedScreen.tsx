import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';
import { Category, DEFAULT_CATEGORIES } from '../../types/onboarding';
import ProgressIndicator from '../../components/onboarding/ProgressIndicator';
import OnboardingButton from '../../components/onboarding/OnboardingButton';

export default function CategorySeedScreen() {
  const { state, setCategories, goToNextStep, goToPreviousStep } = useOnboarding();
  const [categories, setLocalCategories] = useState<Category[]>(
    state.data.categories || DEFAULT_CATEGORIES
  );
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'income'>('expense');
  const [selectedIcon, setSelectedIcon] = useState('💰');
  const [selectedColor, setSelectedColor] = useState('#007AFF');

  const availableIcons = ['💰', '🍽️', '🚗', '🛍️', '🎬', '💡', '🏥', '📚', '✈️', '💼', '💻', '📈', '🏠', '⛽', '🎯', '🎮'];
  const availableColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#82E0AA', '#85C1E9', '#F8C471', '#D7BDE2'];

  const handleContinue = () => {
    setCategories(categories);
    goToNextStep();
  };

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a category name.');
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type: newCategoryType,
    };

    setLocalCategories([...categories, newCategory]);
    setNewCategoryName('');
    setShowCustomForm(false);
  };

  const handleRemoveCategory = (categoryId: string) => {
    setLocalCategories(categories.filter(cat => cat.id !== categoryId));
  };

  const handleToggleCategoryType = (categoryId: string) => {
    setLocalCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, type: cat.type === 'expense' ? 'income' : 'expense' }
        : cat
    ));
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  return (
    <View style={styles.container}>
      <ProgressIndicator
        currentStep={3}
        totalSteps={5}
        stepTitles={['Currency & Locale', 'Budget Setup', 'Categories', 'Privacy Settings', 'Security Setup']}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Organize Your Categories</Text>
          <Text style={styles.subtitle}>
            We've set up some common categories to get you started. You can customize them
            or add your own. Don't worry - you can always change these later!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Categories</Text>
          <Text style={styles.sectionDescription}>
            Categories for tracking your spending
          </Text>
          
          <View style={styles.categoriesGrid}>
            {expenseCategories.map((category) => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveCategory(category.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Categories</Text>
          <Text style={styles.sectionDescription}>
            Categories for tracking your income sources
          </Text>
          
          <View style={styles.categoriesGrid}>
            {incomeCategories.map((category) => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveCategory(category.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {!showCustomForm ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCustomForm(true)}
          >
            <Text style={styles.addButtonText}>+ Add Custom Category</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.customForm}>
            <Text style={styles.formTitle}>Add Custom Category</Text>
            
            <TextInput
              style={styles.nameInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Category name"
              returnKeyType="done"
            />

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  newCategoryType === 'expense' && styles.typeOptionActive,
                ]}
                onPress={() => setNewCategoryType('expense')}
              >
                <Text
                  style={[
                    styles.typeText,
                    newCategoryType === 'expense' && styles.typeTextActive,
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  newCategoryType === 'income' && styles.typeOptionActive,
                ]}
                onPress={() => setNewCategoryType('income')}
              >
                <Text
                  style={[
                    styles.typeText,
                    newCategoryType === 'income' && styles.typeTextActive,
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.selectorLabel}>Choose an icon:</Text>
            <ScrollView horizontal style={styles.iconSelector} showsHorizontalScrollIndicator={false}>
              {availableIcons.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.iconOptionActive,
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.selectorLabel}>Choose a color:</Text>
            <ScrollView horizontal style={styles.colorSelector} showsHorizontalScrollIndicator={false}>
              {availableColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionActive,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </ScrollView>

            <View style={styles.formButtons}>
              <OnboardingButton
                title="Cancel"
                onPress={() => setShowCustomForm(false)}
                variant="outline"
                fullWidth={false}
              />
              <OnboardingButton
                title="Add Category"
                onPress={handleAddCustomCategory}
                fullWidth={false}
              />
            </View>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 You can always add, edit, or remove categories later in the app settings.
            These are just to get you started!
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minWidth: 80,
    position: 'relative',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  customForm: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  typeOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#007AFF',
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  iconSelector: {
    marginBottom: 16,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  iconOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  iconText: {
    fontSize: 20,
  },
  colorSelector: {
    marginBottom: 16,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: '#000',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
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