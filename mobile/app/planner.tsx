import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { 
  getSavedWeeklyPlan, 
  generateWeeklyPlan, 
  saveWeeklyPlan, 
  getChildProfiles, 
  MealForm,
  DayPlan,
  generateMeal,
  ChildProfile
} from '../lib/meal-data';

export default function PlannerScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [swapping, setSwapping] = useState<{dayIndex: number, mealKey: string} | null>(null);
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [existingPlan, childProfiles] = await Promise.all([
        getSavedWeeklyPlan(),
        getChildProfiles()
      ]);
      
      if (existingPlan && existingPlan.length > 0) {
        setPlan(existingPlan);
      }
      
      if (childProfiles && childProfiles.length > 0) {
        setProfiles(childProfiles);
      }
    } catch (err) {
      setError('Failed to load your meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setError(null);
    try {
      const profile = profiles[selectedProfileIndex];
      const age = profile ? String(profile.age) : '24';
      
      const form: MealForm = {
        childAge: age,
        diet: profile?.diet || '',
        allergies: profile?.allergies || [],
        goal: profile?.goal || 'healthy',
        mealType: 'all',
      };

      const newPlan = await generateWeeklyPlan(form);
      setPlan(newPlan);
      await saveWeeklyPlan(newPlan);
      Alert.alert('✨ Success!', `Weekly plan generated for ${profile?.name || 'your child'}!`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate weekly plan.');
      Alert.alert('Error', err.message || 'Failed to generate weekly plan.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSwapMeal = async (dayIndex: number, mealKey: 'breakfast' | 'lunch' | 'dinner') => {
    if (!plan || swapping) return;
    
    setSwapping({ dayIndex, mealKey });
    
    try {
      const profile = profiles[selectedProfileIndex];
      const age = profile ? String(profile.age) : '24';
      
      const form: MealForm = {
        childAge: age,
        diet: profile?.diet || '',
        allergies: profile?.allergies || [],
        goal: profile?.goal || 'healthy',
        mealType: mealKey,
      };

      const newMeal = await generateMeal(form);
      
      // Update state
      const updatedPlan = [...plan];
      updatedPlan[dayIndex][mealKey] = newMeal;
      
      setPlan(updatedPlan);
      await saveWeeklyPlan(updatedPlan);
      
    } catch (err: any) {
      Alert.alert('❌ Swap Failed', err.message || 'Could not swap meal at this time.');
    } finally {
      setSwapping(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your meal plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/meals')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Weekly Plan</Text>
          {profiles.length > 0 && (
            <TouchableOpacity 
              style={styles.profileSelector}
              onPress={() => profiles.length > 1 && setShowProfileModal(true)}
            >
              <Text style={styles.profileText}>
                for {profiles[selectedProfileIndex]?.name}
                {profiles.length > 1 && ' ▼'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/grocery')}>
          <Text style={styles.cartBtnText}>🛒</Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!plan || plan.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>No Plan Active</Text>
          <Text style={styles.emptySub}>
            {profiles.length > 0 
              ? `Let AI build a 7-day personalized menu for ${profiles[selectedProfileIndex]?.name}.`
              : "Let AI build a 7-day personalized menu for your child."}
          </Text>
          
          <TouchableOpacity 
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]} 
            onPress={handleGeneratePlan}
            disabled={generating}
          >
            {generating ? (
              <View style={styles.btnContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.generateBtnText}>Generating...</Text>
              </View>
            ) : (
              <Text style={styles.generateBtnText}>✨ Generate Weekly Plan</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scroll} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          <View style={styles.refreshHeader}>
             <Text style={styles.planSubTitle}>Your child's 7-day menu</Text>
             <TouchableOpacity onPress={handleGeneratePlan} disabled={generating} style={styles.regenerateBtn}>
                {generating ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={styles.refreshText}>↻ Regenerate</Text>
                )}
             </TouchableOpacity>
          </View>
          
          {plan.map((day, index) => (
            <View key={`${day.day}-${index}`} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day.day}</Text>
              </View>

              <MealRow 
                day={day}
                mealKey="breakfast"
                mealType="🌅 Breakfast"
                dayIndex={index}
                swapping={swapping}
                onPress={() => day.breakfast && router.push({ pathname: '/meal-result', params: { mealData: JSON.stringify(day.breakfast) } })}
                onSwap={() => handleSwapMeal(index, 'breakfast')}
              />
              
              <View style={styles.divider} />
              
              <MealRow 
                day={day}
                mealKey="lunch"
                mealType="☀️ Lunch"
                dayIndex={index}
                swapping={swapping}
                onPress={() => day.lunch && router.push({ pathname: '/meal-result', params: { mealData: JSON.stringify(day.lunch) } })}
                onSwap={() => handleSwapMeal(index, 'lunch')}
              />
              
              <View style={styles.divider} />
              
              <MealRow 
                day={day}
                mealKey="dinner"
                mealType="🌙 Dinner"
                dayIndex={index}
                swapping={swapping}
                onPress={() => day.dinner && router.push({ pathname: '/meal-result', params: { mealData: JSON.stringify(day.dinner) } })}
                onSwap={() => handleSwapMeal(index, 'dinner')}
              />
            </View>
          ))}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}

      {/* Profile Selection Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Child Profile</Text>
            {profiles.map((profile, idx) => (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.profileOption,
                  idx === selectedProfileIndex && styles.profileOptionSelected
                ]}
                onPress={() => {
                  setSelectedProfileIndex(idx);
                  setShowProfileModal(false);
                }}
              >
                <Text style={styles.profileEmoji}>{profile.gender === 'girl' ? '�' : '👦'}</Text>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileAge}>{profile.age} months old</Text>
                </View>
                {idx === selectedProfileIndex && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Extracted Meal Row Component for cleaner code
interface MealRowProps {
  day: DayPlan;
  mealKey: 'breakfast' | 'lunch' | 'dinner';
  mealType: string;
  dayIndex: number;
  swapping: {dayIndex: number, mealKey: string} | null;
  onPress: () => void;
  onSwap: () => void;
}

function MealRow({ day, mealKey, mealType, dayIndex, swapping, onPress, onSwap }: MealRowProps) {
  const meal = day[mealKey];
  const isSwapping = swapping?.dayIndex === dayIndex && swapping?.mealKey === mealKey;
  
  return (
    <View style={styles.mealRowWrapper}>
      <TouchableOpacity 
        style={[styles.mealRow, isSwapping && styles.mealRowSwapping]} 
        onPress={onPress}
        disabled={isSwapping}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.mealType}>{mealType}</Text>
          <Text style={[styles.mealName, isSwapping && styles.mealNameSwapping]}>
            {isSwapping ? 'Finding new option...' : meal?.mealName || 'No meal'}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.swapBtn, isSwapping && styles.swapBtnActive]} 
        onPress={onSwap}
        disabled={isSwapping}
      >
        {isSwapping ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text style={styles.swapIcon}>🔄</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  // Loading State
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Spacing.md, fontSize: FontSize.md, color: Colors.textSecondary },
  
  // Header
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
  backBtn: { padding: 8, marginLeft: -8, width: 60 },
  backBtnText: { color: Colors.primary, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  profileSelector: { marginTop: 2 },
  profileText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cartBtn: { padding: 8, marginRight: -8, width: 60, alignItems: 'flex-end' },
  cartBtnText: { fontSize: 24 },
  
  // Error Banner
  errorBanner: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: FontSize.sm, color: '#DC2626', flex: 1 },
  errorRetry: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold, marginLeft: Spacing.md },
  
  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  generateBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.full, ...Shadow.md },
  generateBtnDisabled: { opacity: 0.7 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  generateBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },

  // Plan View
  scroll: { padding: Spacing.lg },
  refreshHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  planSubTitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  regenerateBtn: { padding: 8 },
  refreshText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: 'bold' },

  // Day Card
  dayCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, marginBottom: Spacing.lg, padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  dayHeader: { backgroundColor: Colors.surfaceAlt, paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.md, alignSelf: 'flex-start', marginBottom: Spacing.md },
  dayName: { fontWeight: FontWeight.bold, color: Colors.text },
  
  // Meal Row
  mealRowWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealRow: { paddingVertical: 8, flex: 1, flexDirection: 'row', alignItems: 'center' },
  mealRowSwapping: { opacity: 0.6 },
  mealType: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.bold, marginBottom: 2 },
  mealName: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium, paddingRight: 8 },
  mealNameSwapping: { color: Colors.textSecondary, fontStyle: 'italic' },
  swapBtn: { padding: 8, backgroundColor: '#F0F9FF', borderRadius: Radius.full, borderWidth: 1, borderColor: '#BAE6FD' },
  swapBtnActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
  swapIcon: { fontSize: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  
  // Profile Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.lg, textAlign: 'center' },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  profileOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  profileEmoji: { fontSize: 32, marginRight: Spacing.md },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  profileAge: { fontSize: FontSize.sm, color: Colors.textSecondary },
  checkmark: { fontSize: 20, color: Colors.primary, fontWeight: FontWeight.bold },
  modalCloseBtn: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  modalCloseText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
});
