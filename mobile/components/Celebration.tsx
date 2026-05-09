import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface CelebrationProps {
  visible: boolean;
  message?: string;
  onComplete?: () => void;
}

export default function Celebration({ visible, message = '🎉 Great job!', onComplete }: CelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 4,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1500),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        scaleAnim.setValue(0);
        onComplete?.();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.celebration,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
      
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <FloatingParticle key={i} index={i} />
      ))}
    </View>
  );
}

function FloatingParticle({ index }: { index: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value((Math.random() - 0.5) * 200)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 1500 + Math.random() * 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: (Math.random() - 0.5) * 300,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1500,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const emojis = ['⭐', '✨', '🌟', '💫', '🎊', '🎈'];

  return (
    <Animated.Text
      style={[
        styles.particle,
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
          ],
          left: width / 2 + (Math.random() - 0.5) * 100,
          top: height / 2,
        },
      ]}
    >
      {emojis[index]}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  celebration: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  message: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
  },
});
