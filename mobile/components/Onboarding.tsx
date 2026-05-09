import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Dimensions, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = 'hasSeenOnboarding';

interface OnboardingProps {
  visible: boolean;
  onComplete: () => void;
}

const slides = [
  {
    emoji: '🍎',
    title: 'Track Healthy Meals',
    description: 'Log meals easily with AI food scanning or quick manual entry.',
    color: '#FEF3C7',
  },
  {
    emoji: '💧',
    title: 'Stay Hydrated',
    description: 'Track water intake with fun visual indicators for your kids.',
    color: '#DBEAFE',
  },
  {
    emoji: '🏆',
    title: 'Celebrate Wins',
    description: 'Build healthy habits with streaks and fun celebrations!',
    color: '#DCFCE7',
  },
];

export function checkOnboardingStatus(): Promise<boolean> {
  return AsyncStorage.getItem(ONBOARDING_KEY).then(value => value === 'true');
}

export function markOnboardingComplete(): Promise<void> {
  return AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export default function Onboarding({ visible, onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      Animated.timing(slideAnim, {
        toValue: -(currentSlide + 1) * width,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentSlide(currentSlide + 1);
    } else {
      markOnboardingComplete().then(onComplete);
    }
  };

  const skip = () => {
    markOnboardingComplete().then(onComplete);
  };

  return (
    <Modal visible={visible} animationType="fade">
      <View style={styles.container}>
        {/* Skip button */}
        <TouchableOpacity style={styles.skipBtn} onPress={skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slides */}
        <Animated.View
          style={[
            styles.slidesContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {slides.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <View style={[styles.emojiCircle, { backgroundColor: slide.color }]}>
                <Text style={styles.emoji}>{slide.emoji}</Text>
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Pagination dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentSlide === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Next button */}
        <TouchableOpacity style={styles.nextBtn} onPress={nextSlide}>
          <Text style={styles.nextText}>
            {currentSlide === slides.length - 1 ? "Let's Go! 🎉" : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  slidesContainer: {
    flexDirection: 'row',
    width: width * 3,
  },
  slide: {
    width: width,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emojiCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  nextBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 40,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
