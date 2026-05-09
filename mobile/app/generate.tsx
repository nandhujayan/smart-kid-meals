import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { generateMeal, generateDrink, getChildProfiles, MealForm, Meal, getUsageStats, ChildProfile, FREE_MEAL_LIMIT, PRO_MEAL_LIMIT } from '../lib/meal-data';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const DRINK_TYPES = ['Milkshake', 'Smoothie', 'Juice', 'High-calorie'];
const DIETS = ['None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Dairy-Free'];
const GOALS = ['General Health', 'Weight Gain', 'Immunity', 'Brain Development'];

export default function GenerateMealScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ count: 0, tier: 'free', limit: FREE_MEAL_LIMIT });
  const [childAge, setChildAge] = useState('');
  const [mode, setMode] = useState<'meal' | 'drink'>('meal');
  
  // Form State
  const [mealType, setMealType] = useState('Lunch');
  const [drinkType, setDrinkType] = useState('Milkshake');
  const [diet, setDiet] = useState('None');
  const [goal, setGoal] = useState('General Health');
  const [allergies, setAllergies] = useState('');
  const [ingredients, setIngredients] = useState('');

  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      const usage = await getUsageStats();
      const limit = usage.tier === 'pro' ? PRO_MEAL_LIMIT : FREE_MEAL_LIMIT;
      setStats({ ...usage, limit });
      const profiles = await getChildProfiles();
      if (profiles && profiles.length > 0) {
        setChildProfile(profiles[0]);
        setChildAge(String(profiles[0].age));
        setDiet(profiles[0].diet || 'None');
        setAllergies(profiles[0].allergies.join(', '));
      }
    }
    loadInitialData();
  }, []);

  // Validation
  const isAgeValid = childAge && parseInt(childAge) > 0 && parseInt(childAge) <= 216; // 0-18 years
  
  const handleGenerate = async () => {
    if (!childAge || parseInt(childAge) <= 0) {
      Alert.alert('Missing Age', 'Please enter your child\'s age in months.');
      return;
    }
    if (parseInt(childAge) > 216) {
      Alert.alert('Invalid Age', 'Please enter an age between 1 and 216 months (0-18 years).');
      return;
    }

    setLoading(true);
    try {
      let finalMeal: any;
      if (mode === 'meal') {
        const form: MealForm = {
          childAge,
          mealType: mealType.toLowerCase(),
          diet: diet === 'None' ? '' : diet,
          goal,
          allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
          availableIngredients: ingredients ? ingredients.split(',').map(i => i.trim()) : []
        };
        finalMeal = await generateMeal(form);
      } else {
        // Generate Drink
        const drink = await generateDrink(drinkType, childAge, goal);
        // Map Drink to Meal format for result screen
        finalMeal = {
          id: drink.id,
          mealName: drink.drinkName,
          description: `A nutritious ${drink.category} to help with ${goal.toLowerCase()}.`,
          cookingTime: drink.prepTime,
          difficulty: 'Easy',
          ingredients: drink.ingredients.map(i => ({ name: i, quantity: '' })),
          steps: drink.steps,
          tips: drink.benefits,
          nutrition: { calories: drink.calories },
          mealType: 'snack',
          isAI: drink.isAI
        };
      }
      
      router.push({
        pathname: '/meal-result',
        params: { mealData: JSON.stringify(finalMeal), childAge }
      });
    } catch (error: any) {
      Alert.alert('Generation Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const SelectionGroup = ({ title, options, selected, onSelect }: any) => (
    <View style={styles.group}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            style={[styles.optionBtn, selected === opt && styles.optionBtnActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, selected === opt && styles.optionTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/meals')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate AI Meal</Text>
        <View style={styles.usageBadge}>
          <Text style={styles.usageText}>
            {stats.tier === 'pro' ? 'Unlimited' : `${stats.count}/${stats.limit} Used`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.segmentedControl}>
          <TouchableOpacity 
            style={[styles.segment, mode === 'meal' && styles.segmentActive]} 
            onPress={() => setMode('meal')}
          >
            <Text style={[styles.segmentText, mode === 'meal' && styles.segmentTextActive]}>Food</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segment, mode === 'drink' && styles.segmentActive]} 
            onPress={() => setMode('drink')}
          >
            <Text style={[styles.segmentText, mode === 'drink' && styles.segmentTextActive]}>Drinks</Text>
          </TouchableOpacity>
        </View>

        {childProfile && (
          <View style={styles.smartProfileCard}>
            <Text style={styles.smartProfileEmoji}>{childProfile.gender === 'girl' ? '👧' : '👦'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.smartProfileTitle}>Generating for {childProfile.name}</Text>
              <Text style={styles.smartProfileDesc}>
                Allergies: {childProfile.allergies.length > 0 ? childProfile.allergies.join(', ') : 'None'}
              </Text>
            </View>
            <Text style={styles.smartBadge}>Auto-filled ✨</Text>
          </View>
        )}

        <View style={styles.group}>
          <Text style={styles.label}>Child's Age (months)</Text>
          <TextInput
            style={[styles.input, !isAgeValid && childAge !== '' && styles.inputError]}
            value={childAge}
            onChangeText={setChildAge}
            keyboardType="numeric"
            placeholder="e.g. 18"
            maxLength={3}
          />
          {!isAgeValid && childAge !== '' && (
            <Text style={styles.errorText}>Please enter a valid age (1-216 months)</Text>
          )}
        </View>

        {mode === 'meal' ? (
          <>
            <SelectionGroup title="Meal Type" options={MEAL_TYPES} selected={mealType} onSelect={setMealType} />
            <SelectionGroup title="Dietary Preference" options={DIETS} selected={diet} onSelect={setDiet} />
          </>
        ) : (
          <SelectionGroup title="Drink Type" options={DRINK_TYPES} selected={drinkType} onSelect={setDrinkType} />
        )}

        <SelectionGroup title="Health Goal" options={GOALS} selected={goal} onSelect={setGoal} />

        {mode === 'meal' && (
          <>
            <View style={styles.group}>
              <Text style={styles.label}>Allergies (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="e.g. peanuts, soy"
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Ingredients you have (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={ingredients}
                onChangeText={setIngredients}
                placeholder="e.g. chicken, broccoli"
              />
            </View>
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]} 
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>✨ Generate with AI</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inputError: { borderColor: Colors.error || '#DC2626' },
  errorText: { fontSize: FontSize.xs, color: Colors.error || '#DC2626', marginTop: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backBtnText: { color: Colors.primary, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  usageBadge: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  usageText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  
  segmentedControl: { flexDirection: 'row', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.xl },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  segmentActive: { backgroundColor: Colors.card, ...Shadow.sm },
  segmentText: { color: Colors.textSecondary, fontWeight: 'bold' },
  segmentTextActive: { color: Colors.text },

  smartProfileCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  smartProfileEmoji: { fontSize: 24, marginRight: 12 },
  smartProfileTitle: { fontSize: FontSize.sm, fontWeight: 'bold', color: '#0369A1' },
  smartProfileDesc: { fontSize: FontSize.xs, color: '#0284C7', marginTop: 2 },
  smartBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, fontSize: 10, color: '#0284C7', overflow: 'hidden', fontWeight: 'bold' },

  scroll: { padding: Spacing.lg },
  group: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: 8 },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
  },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optionBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  optionTextActive: { color: '#fff' },

  footer: {
    padding: Spacing.lg,
    paddingBottom: 40,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  generateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.md,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
