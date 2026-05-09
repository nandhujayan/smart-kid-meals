import React, { useState, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import {
  Text, View, StyleSheet, TouchableOpacity, Animated, Dimensions
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { height } = Dimensions.get('window');
const INACTIVE_COLOR = '#9CA3AF';

export default function TabsLayout() {
  const { palette } = useTheme();
  const router = useRouter();
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'meal' | 'water' | 'weight'>('meal');

  // Animated values for sliding up
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openLogDrawer = () => {
    setIsLogOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeLogDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setIsLogOpen(false));
  };

  const navigateToScanner = () => {
    closeLogDrawer();
    // Use setTimeout to allow the drawer to close fully before routing
    setTimeout(() => {
      router.push('/scanner' as any);
    }, 300);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#5DC98A',
          tabBarInactiveTintColor: '#A0AEC0',
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        {/* HOME */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="home" focused={focused} />
            ),
          }}
        />
        {/* MEALS with notification badge */}
        <Tabs.Screen
          name="meals"
          options={{
            title: 'Meals',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="meals" focused={focused} badge />
            ),
          }}
        />
        {/* LOG (hidden from bar, triggered via openLogDrawer elsewhere) */}
        <Tabs.Screen
          name="log"
          options={{
            href: null,
          }}
        />
        {/* BELL / Notifications */}
        <Tabs.Screen
          name="child"
          options={{
            title: 'Child',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="child" focused={focused} />
            ),
          }}
        />
        {/* PROFILE */}
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="profile" focused={focused} />
            ),
          }}
        />
      </Tabs>

      {/* Fully Animated Log Bottom Sheet Drawer (From Reference Image) */}
      {isLogOpen && (
        <View style={StyleSheet.absoluteFillObject}>
          {/* Overlay background */}
          <Animated.View 
            style={[styles.overlay, { opacity: fadeAnim }]} 
            onTouchEnd={closeLogDrawer} 
          />

          {/* Animated Drawer Body */}
          <Animated.View 
            style={[styles.drawerContainer, { transform: [{ translateY: slideAnim }] }]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Title */}
            <Text style={styles.drawerTitle}>Log</Text>

            {/* Segmented Switcher (From Reference Image) */}
            <View style={styles.segmentedControl}>
              <TouchableOpacity 
                style={[styles.segmentBtn, activeSegment === 'meal' && styles.segmentBtnActive]}
                onPress={() => setActiveSegment('meal')}
              >
                <Text style={[styles.segmentText, activeSegment === 'meal' && styles.segmentTextActive]}>
                  🍴 Meal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.segmentBtn, activeSegment === 'water' && styles.segmentBtnActive]}
                onPress={() => setActiveSegment('water')}
              >
                <Text style={[styles.segmentText, activeSegment === 'water' && styles.segmentTextActive]}>
                  💧 Water
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.segmentBtn, activeSegment === 'weight' && styles.segmentBtnActive]}
                onPress={() => setActiveSegment('weight')}
              >
                <Text style={[styles.segmentText, activeSegment === 'weight' && styles.segmentTextActive]}>
                  ⚖️ Weight
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content per Segment */}
            {activeSegment === 'meal' && (
              <View>
                <View style={styles.mealsLogGrid}>
                  {/* 4 Cards - Positive Messaging */}
                  <TouchableOpacity style={[styles.logCard, styles.logCardPink]} onPress={closeLogDrawer}>
                    <View style={styles.logCardPlusBg}>
                      <Text style={styles.logCardPlusText}>+</Text>
                    </View>
                    <Text style={styles.logCardTitle}>Breakfast</Text>
                    <Text style={styles.logCardSubOver}>Balance with veggies!</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.logCard, styles.logCardGreen]} onPress={closeLogDrawer}>
                    <View style={styles.logCardPlusBg}>
                      <Text style={styles.logCardPlusText}>+</Text>
                    </View>
                    <Text style={styles.logCardTitle}>Snack</Text>
                    <Text style={styles.logCardSubLeft}>70kcal left</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.logCard, styles.logCardBeige]} onPress={closeLogDrawer}>
                    <View style={styles.logCardPlusBg}>
                      <Text style={styles.logCardPlusText}>+</Text>
                    </View>
                    <Text style={styles.logCardTitle}>Lunch</Text>
                    <Text style={styles.logCardSubLeft}>350kcal left</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.logCard, styles.logCardWhite]} onPress={closeLogDrawer}>
                    <View style={styles.logCardPlusBg}>
                      <Text style={styles.logCardPlusText}>+</Text>
                    </View>
                    <Text style={styles.logCardTitle}>Dinner</Text>
                    <Text style={styles.logCardSubLeft}>400kcal left</Text>
                  </TouchableOpacity>
                </View>

                {/* AI Meal Scan Option */}
                <TouchableOpacity style={styles.aiScanButton} onPress={navigateToScanner}>
                  <Text style={styles.aiScanButtonEmoji}>📷</Text>
                  <Text style={styles.aiScanButtonText}>Scan Meal with AI</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeSegment === 'water' && (
              <View style={styles.logContentSection}>
                <Text style={styles.logContentInfo}>Record your hydration intake</Text>
                <TouchableOpacity style={styles.actionBtn} onPress={closeLogDrawer}>
                  <Text style={styles.actionBtnText}>+ Add Water 250ml</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeSegment === 'weight' && (
              <View style={styles.logContentSection}>
                <Text style={styles.logContentInfo}>Record child's current weight</Text>
                <TouchableOpacity style={styles.actionBtn} onPress={closeLogDrawer}>
                  <Text style={styles.actionBtnText}>+ Record New Weight</Text>
                </TouchableOpacity>
              </View>
            )}

          </Animated.View>
        </View>
      )}
    </View>
  );
}

/**
 * Tab icons matching repo BottomNav.tsx exactly:
 * Home  : house icon, filled/colored when active (#6ECA6E = emerald-500)
 * Meals : file-text doc with 3 lines + red dot badge (absolute -top-0.5 -right-0.5)
 * Bell  : bell outline
 * Profile: user silhouette
 * All inactive icons: #A5A5A5
 */
function TabIcon({
  icon,
  focused,
  badge,
}: {
  icon: 'home' | 'meals' | 'bell' | 'child' | 'profile';
  focused: boolean;
  badge?: boolean;
}) {
  const ACTIVE   = '#5DC98A';
  const INACTIVE = '#A0AEC0';
  const color    = focused ? ACTIVE : INACTIVE;

  const renderIcon = () => {
    switch (icon) {
      // ── Home: roof triangle + house body + door ──
      case 'home':
        return (
          <View style={styles.iconShape}>
            {/* roof */}
            <View style={[styles.homeRoof, { borderBottomColor: color }]} />
            {/* body with door */}
            <View style={[styles.homeBody,
              { borderColor: color,
                borderTopWidth: 0,
                backgroundColor: focused ? color + '22' : 'transparent' }]}>
              <View style={[styles.homeDoor, { borderColor: color }]} />
            </View>
          </View>
        );

      // ── FileText: rounded doc with 3 lines ──
      case 'meals':
        return (
          <View style={styles.iconShape}>
            <View style={[styles.docOuter, { borderColor: color }]}>
              <View style={[styles.docLine, { backgroundColor: color, width: '80%' as any }]} />
              <View style={[styles.docLine, { backgroundColor: color, width: '60%' as any }]} />
              <View style={[styles.docLine, { backgroundColor: color, width: '70%' as any }]} />
            </View>
          </View>
        );

      // ── Bell (kept for reference) ──
      case 'bell':
        return (
          <View style={styles.iconShape}>
            <View style={[styles.bellDome, { borderColor: color }]} />
            <View style={[styles.bellBar, { backgroundColor: color }]} />
            <View style={[styles.bellClapper, { borderColor: color }]} />
          </View>
        );

      // ── Child: head + small body (kid silhouette) ──
      case 'child':
        return (
          <View style={styles.iconShape}>
            {/* head */}
            <View style={[styles.childHead, { borderColor: color, backgroundColor: focused ? color + '22' : 'transparent' }]} />
            {/* body */}
            <View style={[styles.childBody, { backgroundColor: color }]} />
            {/* legs */}
            <View style={styles.childLegs}>
              <View style={[styles.childLeg, { backgroundColor: color }]} />
              <View style={[styles.childLeg, { backgroundColor: color }]} />
            </View>
          </View>
        );

      // ── User / Profile ──
      case 'profile':
        return (
          <View style={styles.iconShape}>
            {/* head */}
            <View style={[styles.profileHead, { borderColor: color }]} />
            {/* shoulders arc */}
            <View style={[styles.profileBody, { borderColor: color }]} />
          </View>
        );
    }
  };

  return (
    <View style={styles.iconWrapper}>
      {renderIcon()}
      {/* repo: absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white */}
      {badge && <View style={styles.badge} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#ECEEF0',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 12,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 14,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShape: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Home icon pieces
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#A5A5A5',
    marginBottom: 0,
  },
  homeBody: {
    width: 16,
    height: 11,
    borderWidth: 2,
    borderTopWidth: 0,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeDoor: {
    width: 5,
    height: 6,
    borderRadius: 1,
    marginBottom: 0,
  },
  // Doc / Meals icon
  docOuter: {
    width: 18,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingTop: 5,
    gap: 3,
    alignItems: 'flex-start',
  },
  docLine: {
    height: 2,
    width: 10,
    borderRadius: 1,
  },
  // Bell icon pieces
  bellDome: {
    width: 18,
    height: 13,
    borderWidth: 2.5,
    borderRadius: 9,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  bellBar: {
    width: 14,
    height: 2.5,
    borderRadius: 2,
  },
  bellClapper: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 2.5,
    marginTop: 0,
  },
  // Child icon
  childHead: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    marginBottom: 1,
  },
  childBody: {
    width: 14,
    height: 6,
    borderRadius: 3,
    marginBottom: 1,
  },
  childLegs: {
    flexDirection: 'row',
    gap: 3,
  },
  childLeg: {
    width: 4,
    height: 5,
    borderRadius: 2,
  },
  // Profile icon
  profileHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    marginBottom: 2,
  },
  profileBody: {
    width: 18,
    height: 10,
    borderRadius: 9,
    borderWidth: 2.5,
    borderBottomWidth: 0,
  },
  // repo: absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white
  badge: {
    position:        'absolute',
    top:             0,
    right:           0,
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: '#EF4444',
    borderWidth:     2,
    borderColor:     '#FFFFFF',
  },

  // Log bottom sheet drawer
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
    zIndex: 1000,
  },
  sheetHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#0D9488',
  },

  mealsLogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  logCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  logCardPink: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FECDD3',
  },
  logCardGreen: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  logCardBeige: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  logCardWhite: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  logCardPlusBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logCardPlusText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  logCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  logCardSubOver: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E11D48',
    marginTop: 2,
  },
  logCardSubLeft: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },

  logContentSection: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  logContentInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  aiScanButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  aiScanButtonEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  aiScanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
