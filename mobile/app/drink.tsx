import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, StatusBar, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getChildProfiles, ChildProfile } from '../lib/meal-data';
import { DailyLog, GOALS, loadDailyLog, saveDailyLog } from '../lib/daily-log';
import Footer from '../components/Footer';

const { width } = Dimensions.get('window');
const SIDE = 16;

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        '#F4F8FF',
  white:     '#FFFFFF',
  textDark:  '#1A2D3E',
  textMid:   '#607080',
  textLight: '#94A8B8',
  skyBg:     '#DFF3FF',
  skyBg2:    '#C8E8FF',
  cardSky:   '#E8F5FF',
  cardMint:  '#E0FAF5',
  cardYellow:'#FFF8E0',
  cardPeach: '#FFF0E8',
  blueAccent:'#3B9EE0',
  blueSoft:  '#BEE0FF',
  successGn: '#3DC87A',
};

const DRINK_TYPES = [
  { label: 'Water',    tag: 'Best hydration 💧',    emoji: '💧', color: C.cardSky,    border: '#A8D8F8', cupVal: 1 },
  { label: 'Milk',     tag: 'Calcium boost 🥛',     emoji: '🥛', color: C.cardYellow, border: '#F0D888', cupVal: 1 },
  { label: 'Smoothie', tag: 'Vitamin energy 🍓',    emoji: '🥤', color: C.cardMint,   border: '#88D8C8', cupVal: 1 },
  { label: 'Juice',    tag: 'Fruit refresh 🍊',     emoji: '🍊', color: C.cardPeach,  border: '#F0C8A0', cupVal: 1 },
];

export default function DrinkScreen() {
  const router = useRouter();
  const { childId: paramId } = useLocalSearchParams<{ childId: string }>();
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [log, setLog]           = useState<DailyLog | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const barAnim  = useRef(new Animated.Value(0)).current;
  const waveAnim  = useRef(new Animated.Value(0)).current;

  const resolvedId  = selectedId ?? paramId ?? profiles[0]?.id ?? 'default';
  const resolvedIdx = Math.max(0, profiles.findIndex(p => p.id === resolvedId));
  const child     = profiles[resolvedIdx];
  const childId   = child?.id ?? resolvedId;
  const childName = child?.name ?? 'your child';
  const isGirl    = child?.gender === 'girl';
  const accent    = isGirl ? '#E8559A' : C.blueAccent;
  const heroBg    = isGirl ? '#FFD6F0' : C.skyBg;

  const cups  = log?.waterCups ?? 0;
  const GOAL  = GOALS.water;
  const pct   = Math.min(100, Math.round((cups / GOAL) * 100));

  const animateTo = (newCups: number) => {
    Animated.timing(barAnim, {
      toValue: Math.min(1, newCups / GOAL),
      duration: 700,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    getChildProfiles().then(p => { if (p?.length) setProfiles(p); });
  }, []);

  useEffect(() => {
    const id = selectedId ?? paramId ?? profiles[0]?.id;
    if (!id || id === 'default') return;
    loadDailyLog(id).then(l => {
      setLog(l);
      animateTo(l?.waterCups ?? 0);
    });
  }, [selectedId, paramId, profiles.length]);

  const updateCups = async (delta: number) => {
    const base = log ?? { childId, date: new Date().toISOString().slice(0, 10), mealsLogged: 0, waterCups: 0, activityMins: 0, sleepHours: 0, lastUpdated: '' };
    const newCups = Math.max(0, Math.min(GOAL + 4, base.waterCups + delta));
    const updated = { ...base, waterCups: newCups };
    setLog(updated);
    animateTo(newCups);
    await saveDailyLog(updated);
  };

  const barHeight  = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const waveShift  = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

          {/* ── HEADER ── */}
          <View style={[st.hero, { backgroundColor: heroBg }]}>
            <View style={st.heroTopBar}>
              <TouchableOpacity style={st.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} activeOpacity={0.7}>
                <Text style={st.backTxt}>← Back</Text>
              </TouchableOpacity>
              {cups >= GOAL && (
                <View style={st.goalBadge}>
                  <Text style={st.goalBadgeTxt}>💙 Goal Met!</Text>
                </View>
              )}
            </View>

            <Text style={st.heroEmoji}>💧</Text>
            <Text style={st.heroTitle}>Hydration Journey</Text>
            <Text style={st.heroSub}>Healthy hydration builds healthy habits 💙</Text>

            {profiles.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.pillRow}>
                {profiles.map((p, i) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[st.pill, resolvedIdx === i && { backgroundColor: accent }]}
                    onPress={() => { setSelectedId(p.id); loadDailyLog(p.id).then(l => { setLog(l); animateTo(l?.waterCups ?? 0); }); }}
                    activeOpacity={0.78}
                  >
                    <Text style={[st.pillTxt, resolvedIdx === i && { color: C.white }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── HYDRATION OVERVIEW CARD ── */}
          <View style={st.overviewCard}>
            {/* Top row: label + cups count */}
            <View style={st.ovTopRow}>
              <View>
                <Text style={st.ovLabel}>TODAY'S HYDRATION</Text>
                <Text style={st.ovName}>{childName}'s Water</Text>
              </View>
              <View style={[st.cupsBadge, { backgroundColor: heroBg }]}>
                <Text style={[st.cupsVal, { color: accent }]}>{cups}</Text>
                <Text style={[st.cupsUnit, { color: accent }]}>/ {GOAL}</Text>
              </View>
            </View>

            {/* ── WATER BOTTLE ── */}
            <View style={st.bottleWrap}>
              {/* Bottle cap */}
              <View style={[st.bottleCap, { backgroundColor: isGirl ? '#F9A8D4' : '#93C5FD' }]} />
              {/* Bottle neck */}
              <View style={[st.bottleNeck, { backgroundColor: isGirl ? 'rgba(249,168,212,0.25)' : 'rgba(147,197,253,0.25)', borderColor: isGirl ? '#F9A8D4' : '#93C5FD' }]} />
              {/* Bottle body */}
              <View style={st.bottleBody}>
                {/* Water fill — animated from bottom */}
                <Animated.View
                  style={[st.bottleWater, {
                    height: barHeight,
                    backgroundColor: isGirl ? '#F472B6' : '#38BDF8',
                  }]}
                >
                  {/* Wave surface */}
                  {cups > 0 && (
                    <Animated.View style={[st.waveBar, { transform: [{ translateX: waveShift }], backgroundColor: isGirl ? 'rgba(244,114,182,0.45)' : 'rgba(125,211,252,0.45)' }]} />
                  )}
                  {/* Bubbles */}
                  {cups > 0 && (
                    <>
                      <View style={[st.bubble, { left: '20%', bottom: '30%', width: 6, height: 6, opacity: 0.5 }]} />
                      <View style={[st.bubble, { left: '60%', bottom: '55%', width: 8, height: 8, opacity: 0.35 }]} />
                      <View style={[st.bubble, { left: '40%', bottom: '15%', width: 5, height: 5, opacity: 0.4 }]} />
                    </>
                  )}
                </Animated.View>
                {/* Glass highlight */}
                <View style={st.bottleHighlight} />
                {/* Overlay text */}
                <View style={st.bottleOverlay}>
                  <Text style={[st.bottlePct, { color: cups > pct / 2 ? C.white : C.textDark }]}>{pct}%</Text>
                  <Text style={[st.bottleSub, { color: cups > pct / 2 ? 'rgba(255,255,255,0.85)' : C.textMid }]}>
                    {cups >= GOAL ? 'Complete! 🎉' : `${GOAL - cups} cups left`}
                  </Text>
                </View>
              </View>
              {/* Bottle base */}
              <View style={[st.bottleBase, { backgroundColor: isGirl ? 'rgba(249,168,212,0.30)' : 'rgba(147,197,253,0.30)', borderColor: isGirl ? '#F9A8D4' : '#93C5FD' }]} />
            </View>

            {/* ── CUP DOTS (horizontal, below bottle) ── */}
            <View style={st.cupDotsRow}>
              {Array.from({ length: GOAL }).map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[st.cupDot, {
                    backgroundColor: i < cups ? accent : '#E4EDF8',
                    shadowColor: i < cups ? accent : 'transparent',
                    shadowOpacity: i < cups ? 0.35 : 0,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6, elevation: i < cups ? 3 : 0,
                  }]}
                  onPress={() => updateCups(i < cups ? -(cups - i) : (i + 1 - cups))}
                  activeOpacity={0.72}
                >
                  <Text style={{ fontSize: 13 }}>{i < cups ? '💧' : '○'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Motivation chip */}
            <View style={[st.motivationChip, { backgroundColor: cups >= GOAL ? '#E0F8EC' : C.skyBg }]}>
              <Text style={st.motivationTxt}>
                {cups >= GOAL
                  ? `🌊 Amazing! ${childName} completed today's hydration goal!`
                  : pct >= 50
                  ? `💙 Halfway there — ${GOAL - cups} more cups to go!`
                  : `🚀 ${GOAL - cups} more cups to unlock today's streak!`}
              </Text>
            </View>
          </View>

          {/* ── QUICK LOG ── */}
          <View style={st.sectionRow}>
            <Text style={st.sectionTitle}>Quick Log</Text>
          </View>
          <View style={st.quickRow}>
            <TouchableOpacity
              style={[st.quickPrimary, { backgroundColor: accent }]}
              onPress={() => updateCups(1)}
              activeOpacity={0.82}
            >
              <Text style={st.quickPrimaryEmoji}>💧</Text>
              <Text style={st.quickPrimaryTxt}>+ 1 Cup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.quickSecondary, { backgroundColor: heroBg }]}
              onPress={() => updateCups(2)}
              activeOpacity={0.82}
            >
              <Text style={st.quickSecondaryEmoji}>💧💧</Text>
              <Text style={[st.quickSecondaryTxt, { color: accent }]}>+ 2 Cups</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={st.quickUndo}
              onPress={() => updateCups(-1)}
              activeOpacity={0.75}
            >
              <Text style={st.quickUndoEmoji}>↩</Text>
              <Text style={st.quickUndoTxt}>Undo</Text>
            </TouchableOpacity>
          </View>

          {/* ── WHAT DID THEY DRINK? ── */}
          <View style={st.sectionRow}>
            <Text style={st.sectionTitle}>What did they drink?</Text>
            <Text style={st.sectionSub}>Tap to log +1 cup</Text>
          </View>
          <View style={st.drinkGrid}>
            {DRINK_TYPES.map(d => (
              <TouchableOpacity
                key={d.label}
                style={[st.drinkCard, { backgroundColor: d.color, borderColor: d.border }]}
                onPress={() => updateCups(d.cupVal)}
                activeOpacity={0.80}
              >
                <Text style={st.drinkEmoji}>{d.emoji}</Text>
                <Text style={st.drinkName}>{d.label}</Text>
                <Text style={st.drinkTag}>{d.tag}</Text>
                <View style={[st.drinkAddBtn, { borderColor: d.border }]}>
                  <Text style={st.drinkAddTxt}>+ Add</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── MOTIVATOR CARD ── */}
          <View style={[st.tipCard, { backgroundColor: cups >= GOAL ? '#E0F8EC' : '#EEF6FF' }]}>
            <View style={st.tipLeft}>
              <Text style={st.tipEmoji}>{cups >= GOAL ? '🏆' : '💙'}</Text>
            </View>
            <View style={st.tipRight}>
              <Text style={st.tipTitle}>{cups >= GOAL ? 'Goal Complete!' : 'Keep sipping!'}</Text>
              <Text style={st.tipBody}>
                {cups >= GOAL
                  ? `${childName} is a hydration hero today! 🌊`
                  : `Just ${GOAL - cups} more cup${GOAL - cups > 1 ? 's' : ''} — try a fun coloured bottle 🍶`}
              </Text>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </View>
  );
}

const DRINK_W   = (width - SIDE * 2 - 12) / 2;
const BOTTLE_H  = 220;
const BOTTLE_W  = 110;
const NECK_W    = 52;
const CAP_W     = 44;

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 16 },

  // ── Hero header ──
  hero: {
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingHorizontal: SIDE,
    paddingBottom: 28,
    alignItems: 'center',
  },
  heroTopBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', width: '100%', marginBottom: 16,
  },
  back:    { paddingVertical: 4, paddingRight: 12 },
  backTxt: { fontSize: 14, fontWeight: '600', color: C.textMid },
  goalBadge: {
    backgroundColor: 'rgba(255,255,255,0.80)', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
  },
  goalBadgeTxt: { fontSize: 12, fontWeight: '700', color: '#1A5E8C' },

  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: C.textDark, letterSpacing: -0.3, marginBottom: 5 },
  heroSub:   { fontSize: 13, fontWeight: '500', color: C.textMid, lineHeight: 19, marginBottom: 16 },

  pillRow: { gap: 8, paddingVertical: 4 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
  },
  pillTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },

  // ── Overview card ──
  overviewCard: {
    marginHorizontal: SIDE, marginBottom: 8,
    backgroundColor: C.white, borderRadius: 28, padding: 20,
    borderWidth: 1, borderColor: '#DDE8F4',
    shadowColor: '#2060A0', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },
  ovTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  ovLabel: { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.8, marginBottom: 5 },
  ovName:  { fontSize: 16, fontWeight: '700', color: C.textDark, letterSpacing: -0.2 },
  cupsBadge: { alignItems: 'center', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  cupsVal:   { fontSize: 32, fontWeight: '800', lineHeight: 36, letterSpacing: -1 },
  cupsUnit:  { fontSize: 11, fontWeight: '600', opacity: 0.8 },

  // ── Water bottle ──
  bottleWrap: {
    alignItems: 'center', marginBottom: 20,
  },
  bottleCap: {
    width: CAP_W, height: 14, borderRadius: 6,
    marginBottom: 0,
  },
  bottleNeck: {
    width: NECK_W, height: 18,
    borderLeftWidth: 1.5, borderRightWidth: 1.5, borderTopWidth: 0, borderBottomWidth: 0,
    borderStyle: 'solid',
  },
  bottleBody: {
    width: BOTTLE_W, height: BOTTLE_H,
    borderRadius: 28,
    backgroundColor: 'rgba(224,244,255,0.55)',
    borderWidth: 1.5, borderColor: '#A8D8F0',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  bottleWater: {
    width: '100%', borderRadius: 0,
    position: 'absolute', bottom: 0, left: 0, right: 0,
    overflow: 'hidden',
  },
  waveBar: {
    position: 'absolute', top: -6,
    left: -20, right: -20, height: 12,
    borderRadius: 6,
  },
  bubble: {
    position: 'absolute', borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.60)',
  },
  bottleHighlight: {
    position: 'absolute', top: 16, left: 10,
    width: 10, bottom: 20, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  bottleOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  bottlePct: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  bottleSub: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  bottleBase: {
    width: BOTTLE_W - 8, height: 12, borderRadius: 6,
    borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderTopWidth: 0,
  },

  // Cup dots row
  cupDotsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 8, marginBottom: 16,
  },
  cupDot: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  motivationChip: {
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  motivationTxt: { fontSize: 13, fontWeight: '600', color: C.textDark, lineHeight: 19 },

  // ── Section headers ──
  sectionRow: {
    flexDirection: 'row', alignItems: 'baseline',
    paddingHorizontal: SIDE, marginTop: 20, marginBottom: 12, gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textDark },
  sectionSub:   { fontSize: 12, fontWeight: '500', color: C.textLight },

  // ── Quick log ──
  quickRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: SIDE, marginBottom: 8,
  },
  quickPrimary: {
    flex: 2, borderRadius: 18, paddingVertical: 14,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 8,
    shadowColor: C.blueAccent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, shadowRadius: 10, elevation: 4,
  },
  quickPrimaryEmoji: { fontSize: 20 },
  quickPrimaryTxt:   { fontSize: 14, fontWeight: '800', color: C.white },
  quickSecondary: {
    flex: 2, borderRadius: 18, paddingVertical: 14,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(59,158,224,0.20)',
  },
  quickSecondaryEmoji: { fontSize: 16 },
  quickSecondaryTxt:   { fontSize: 14, fontWeight: '700' },
  quickUndo: {
    flex: 1, borderRadius: 18, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', gap: 3,
    backgroundColor: '#F2F4F6',
  },
  quickUndoEmoji: { fontSize: 16 },
  quickUndoTxt:   { fontSize: 11, fontWeight: '600', color: C.textMid },

  // ── Drink grid ──
  drinkGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: SIDE, marginBottom: 8,
  },
  drinkCard: {
    width: DRINK_W, borderRadius: 24, borderWidth: 1,
    paddingVertical: 18, paddingHorizontal: 12,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  drinkEmoji: { fontSize: 34, marginBottom: 2 },
  drinkName:  { fontSize: 14, fontWeight: '700', color: C.textDark },
  drinkTag:   { fontSize: 10, fontWeight: '500', color: C.textMid, textAlign: 'center', lineHeight: 14 },
  drinkAddBtn: {
    marginTop: 8, borderRadius: 999, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.70)',
    paddingHorizontal: 14, paddingVertical: 4,
  },
  drinkAddTxt: { fontSize: 11, fontWeight: '700', color: C.textMid },

  // ── Motivator card ──
  tipCard: {
    marginHorizontal: SIDE, marginTop: 16,
    borderRadius: 24, padding: 18,
    flexDirection: 'row', gap: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  tipLeft:  { alignItems: 'center', justifyContent: 'center' },
  tipEmoji: { fontSize: 36 },
  tipRight: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 4 },
  tipBody:  { fontSize: 12, fontWeight: '500', color: C.textMid, lineHeight: 18 },
});
