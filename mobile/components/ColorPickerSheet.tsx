import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { PALETTES, PaletteKey, useTheme } from '../context/ThemeContext';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = 380;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ColorPickerSheet({ visible, onClose }: Props) {
  const { palette, setPalette } = useTheme();
  const slideY = useRef(new Animated.Value(SHEET_H)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: SHEET_H, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  const handleSelect = (key: PaletteKey) => {
    setPalette(key);
    onClose();
  };

  if (!showModal) return null;

  return (
    <Modal transparent animationType="none" visible={showModal} onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideY }] }]}
        pointerEvents="box-none"
      >
        {/* Handle */}
        <View style={styles.handle} />

        <Text style={styles.title}>Choose Your Theme 🎨</Text>
        <Text style={styles.subtitle}>Pick a color that makes you happy!</Text>

        {/* Palette Grid */}
        <View style={styles.grid}>
          {PALETTES.map((p) => {
            const isActive = p.key === palette.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={styles.swatchWrap}
                activeOpacity={0.8}
                onPress={() => handleSelect(p.key)}
              >
                {/* Swatch circle */}
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: p.swatch },
                    isActive && styles.swatchActive,
                  ]}
                >
                  {isActive && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.swatchLabel, isActive && styles.swatchLabelActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Done button */}
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: palette.bg }]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={[styles.doneBtnText, { color: palette.onBg }]}>Done ✓</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
  },
  swatchWrap: {
    alignItems: 'center',
    width: 64,
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    transform: [{ scale: 1.12 }],
  },
  checkmark: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  swatchLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
  },
  swatchLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },
  doneBtn: {
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
