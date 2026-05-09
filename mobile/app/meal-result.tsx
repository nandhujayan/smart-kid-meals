import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { saveMeal, Meal } from '../lib/meal-data';

function safeIngredient(ing: any): { name: string; quantity: string } {
  if (typeof ing === 'string') return { name: ing, quantity: '' };
  return { name: ing?.name || '', quantity: ing?.quantity || '' };
}

export default function MealResultScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { mealData, childAge } = useLocalSearchParams();
  const [saving, setSaving] = useState(false);

  // Parse the meal string passed from the previous screen
  let meal: Meal | null = null;
  let parseError = '';
  try {
    if (typeof mealData === 'string') {
      meal = JSON.parse(mealData);
      console.log('[MealResult] Parsed meal:', meal?.mealName, 'isAI:', meal?.isAI);
    } else {
      parseError = 'No meal data provided';
    }
  } catch (e: any) {
    parseError = e.message;
    console.error("[MealResult] Failed to parse meal data:", e);
  }
  
  // Validate meal has required fields
  const isValidMeal = meal && meal.mealName && meal.description;

  if (!isValidMeal) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ color: Colors.error, fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            Failed to load meal data
          </Text>
          <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
            {parseError || 'The meal data appears to be incomplete. This may be due to an API error.'}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 24 }}>
            Debug: meal={meal ? 'exists' : 'null'}, name={meal?.mealName || 'empty'}
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/meals')} 
            style={{ backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back & Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // After validation, we know meal exists and is valid
  const validMeal = meal!;
  const ingredients = Array.isArray(validMeal.ingredients) ? validMeal.ingredients : [];
  const steps = Array.isArray(validMeal.steps) ? validMeal.steps : [];
  const tips = Array.isArray(validMeal.tips) ? validMeal.tips : [];

  const handleSave = async () => {
    if (!validMeal) return;
    setSaving(true);
    try {
      await saveMeal(validMeal);
      Alert.alert('✨ Saved!', 'Meal added to your library!');
      router.replace('/(tabs)/meals');
    } catch (err) {
      Alert.alert('❌ Save Failed', 'Could not save meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/meals')}>
          <Text style={styles.backBtnText}>← Discard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Recipe</Text>
        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.mealName}>{validMeal.mealName}</Text>
        <Text style={styles.description}>{validMeal.description}</Text>

        <View style={styles.insightBox}>
          <Text style={styles.insightIcon}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>Why this meal?</Text>
            <Text style={styles.insightText}>
              {validMeal.insight || `This meal is carefully selected to provide balanced nutrition for your ${childAge ? childAge + ' month old' : 'child'}.`}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.cookingModeBtn} 
          onPress={() => router.push({ pathname: '/cooking-mode', params: { mealData } })}
          activeOpacity={0.8}
        >
          <Text style={styles.cookingModeBtnText}>👨‍🍳 Start Cooking Mode</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          {!!validMeal.cookingTime && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statVal}>{validMeal.cookingTime}</Text>
            </View>
          )}
          {!!validMeal.difficulty && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Difficulty</Text>
              <Text style={styles.statVal}>{validMeal.difficulty}</Text>
            </View>
          )}
          {!!validMeal.nutrition?.calories && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Calories</Text>
              <Text style={styles.statVal}>{validMeal.nutrition.calories} kcal</Text>
            </View>
          )}
        </View>

        {(validMeal.nutrition?.protein || validMeal.nutrition?.carbs || validMeal.nutrition?.fats) && (
          <View style={styles.macrosRow}>
            {!!validMeal.nutrition?.protein && (
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroVal}>{validMeal.nutrition.protein}g</Text>
              </View>
            )}
            {!!validMeal.nutrition?.carbs && (
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroVal}>{validMeal.nutrition.carbs}g</Text>
              </View>
            )}
            {!!validMeal.nutrition?.fats && (
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroVal}>{validMeal.nutrition.fats}g</Text>
              </View>
            )}
            {!!validMeal.nutrition?.vitamins && (
              <View style={[styles.macroBox, { flex: 2 }]}>
                <Text style={styles.macroLabel}>Vitamins</Text>
                <Text style={[styles.macroVal, { fontSize: 11 }]}>{validMeal.nutrition.vitamins}</Text>
              </View>
            )}
          </View>
        )}

        {ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛒 Ingredients</Text>
            <View style={styles.card}>
              {ingredients.map((ing, idx) => {
                const { name, quantity } = safeIngredient(ing);
                return (
                  <View key={idx} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>
                      {quantity ? <Text style={{ fontWeight: 'bold' }}>{quantity} </Text> : null}{name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👨‍🍳 Instructions</Text>
            <View style={styles.card}>
              {steps.map((step, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.stepNum}>{idx + 1}</Text>
                  <Text style={styles.listText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Tips</Text>
            <View style={[styles.card, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
              {tips.map((tip, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={[styles.listText, { color: '#92400e' }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  backBtnText: { color: Colors.error, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: FontSize.sm },
  
  scroll: { padding: Spacing.lg },
  mealName: { fontSize: 28, fontWeight: FontWeight.extrabold, color: Colors.text, marginBottom: 8 },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
  
  insightBox: { backgroundColor: '#F5F3FF', padding: 16, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.xl, borderWidth: 1, borderColor: '#EDE9FE' },
  insightIcon: { fontSize: 20, marginRight: 12 },
  insightTitle: { fontSize: FontSize.sm, fontWeight: 'bold', color: '#6D28D9', marginBottom: 2 },
  insightText: { fontSize: FontSize.sm, color: '#5B21B6', lineHeight: 20 },

  cookingModeBtn: { backgroundColor: Colors.text, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.xl, ...Shadow.sm },
  cookingModeBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },

  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  statBox: { flex: 1, backgroundColor: Colors.surfaceAlt, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 4 },
  statVal: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },

  macrosRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  macroBox: { flex: 1, backgroundColor: '#f0fdf4', padding: Spacing.sm, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  macroLabel: { fontSize: FontSize.xs, color: '#166534', marginBottom: 2 },
  macroVal: { fontSize: FontSize.sm, fontWeight: 'bold', color: '#15803d' },

  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  
  listItem: { flexDirection: 'row', marginBottom: 12, paddingRight: 10 },
  bullet: { fontSize: 18, color: Colors.primary, marginRight: 8, marginTop: -2 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primaryLight, color: Colors.primaryDark, textAlign: 'center', lineHeight: 24, fontWeight: 'bold', marginRight: 10, overflow: 'hidden' },
  listText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22, flex: 1 },
});
