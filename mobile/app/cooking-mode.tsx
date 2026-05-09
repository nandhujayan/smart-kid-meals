import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { Meal } from '../lib/meal-data';

const { width } = Dimensions.get('window');

export default function CookingModeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { mealData } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  let meal: Meal | null = null;
  try {
    if (typeof mealData === 'string') meal = JSON.parse(mealData);
  } catch (e) {
    console.error("Parse error", e);
  }

  if (!meal || !meal.steps || meal.steps.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.error }}>Recipe steps not available.</Text>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/meals')} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nextStep = () => {
    setTimerActive(false);
    if (currentStep < meal!.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/meals');
    }
  };

  const prevStep = () => {
    setTimerActive(false);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Timer Logic
  const extractTime = (text: string) => {
    const match = text.match(/(\d+)\s*(min|minute|sec|second)/i);
    if (match) {
      const val = parseInt(match[1]);
      return match[2].toLowerCase().startsWith('min') ? val * 60 : val;
    }
    return 0;
  };

  const stepTimeSeconds = meal ? extractTime(meal.steps[currentStep]) : 0;

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      Alert.alert('⏱️ Timer Finished!', 'Ready for the next step?');
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const toggleTimer = () => {
    if (!timerActive && timeLeft === 0) {
      setTimeLeft(stepTimeSeconds);
    }
    setTimerActive(!timerActive);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/meals')}>
          <Text style={styles.backBtnText}>Exit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{meal.mealName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${((currentStep + 1) / meal.steps.length) * 100}%` }
          ]} 
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.stepLabel}>STEP {currentStep + 1} OF {meal.steps.length}</Text>
        <View style={styles.card}>
          <Text style={styles.stepText}>{meal.steps[currentStep]}</Text>
          
          {stepTimeSeconds > 0 && (
            <TouchableOpacity 
              style={[styles.timerBtn, timerActive && styles.timerBtnActive]} 
              onPress={toggleTimer}
            >
              <Text style={[styles.timerBtnText, timerActive && styles.timerBtnTextActive]}>
                {timerActive || timeLeft > 0 
                  ? `⏱️ ${formatTime(timeLeft)}` 
                  : `⏱️ Start Timer (${stepTimeSeconds / 60} min)`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.navBtn, currentStep === 0 && styles.navBtnDisabled]} 
          onPress={prevStep}
          disabled={currentStep === 0}
        >
          <Text style={[styles.navBtnText, currentStep === 0 && styles.navBtnTextDisabled]}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
          <Text style={styles.nextBtnText}>
            {currentStep === meal.steps.length - 1 ? 'Finish 🏁' : 'Next Step →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backBtnText: { color: Colors.error, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, maxWidth: '60%' },
  
  progressContainer: { height: 6, backgroundColor: Colors.surfaceAlt, width: '100%' },
  progressBar: { height: '100%', backgroundColor: Colors.primary },

  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center', alignItems: 'center' },
  stepLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, letterSpacing: 1, marginBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    width: width - Spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    ...Shadow.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepText: { fontSize: 24, fontWeight: FontWeight.semibold, color: Colors.text, lineHeight: 34, textAlign: 'center' },
  timerBtn: { marginTop: Spacing.xl, backgroundColor: '#F0FDF4', paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full, borderWidth: 1, borderColor: '#86EFAC' },
  timerBtnActive: { backgroundColor: '#22C55E', borderColor: '#16A34A' },
  timerBtnText: { color: '#166534', fontWeight: 'bold', fontSize: FontSize.md },
  timerBtnTextActive: { color: '#fff' },

  footer: { flexDirection: 'row', padding: Spacing.lg, paddingBottom: 40, backgroundColor: Colors.card, borderTopWidth: 1, borderColor: Colors.border },
  navBtn: { flex: 1, paddingVertical: 18, alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, marginRight: Spacing.sm },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { color: Colors.text, fontWeight: 'bold', fontSize: FontSize.md },
  navBtnTextDisabled: { color: Colors.textMuted },
  nextBtn: { flex: 1.5, paddingVertical: 18, alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.lg, marginLeft: Spacing.sm, ...Shadow.md },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: FontSize.md },
});
