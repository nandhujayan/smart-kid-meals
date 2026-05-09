import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Switch, ScrollView, StatusBar,
  Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getChildProfiles, ChildProfile } from '../lib/meal-data';
import { loadDailyLog, saveDailyLog } from '../lib/daily-log';
import Footer from '../components/Footer';

const { width } = Dimensions.get('window');
const SIDE = 16;

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        '#F4F6FB',
  white:     '#FFFFFF',
  textDark:  '#1E2A4A',
  textMid:   '#607080',
  textLight: '#94A8B8',
  lavBg:     '#E8E4FF',
  lavBg2:    '#D4CEFF',
  lavAccent: '#7C6FCD',
  moonGlow:  '#FFF4C7',
  moonText:  '#7A5C00',
  nightBlue: '#5B6CFF',
  cardLav:   '#F3F0FF',
  cardMoon:  '#FFFBE8',
  cardMint:  '#E8FBF3',
  successGn: '#3DC87A',
};

const ROUTINE_ITEMS = [
  { emoji: '📚', label: 'Story Time' },
  { emoji: '🪥', label: 'Brush Teeth' },
  { emoji: '💧', label: 'Drink Water' },
  { emoji: '🧸', label: 'Calm Down' },
  { emoji: '📵', label: 'Screen Off' },
];

interface SleepSettings {
  bedtime: { h: number; m: number };
  wakeUp:  { h: number; m: number };
  alarm:   boolean;
}

function fmt(h: number, m: number) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${period}`;
}

export default function SleepScreen() {
  const router   = useRouter();
  const { childId: paramId } = useLocalSearchParams<{ childId: string }>();
  const [profiles, setProfiles]         = useState<ChildProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [logSaved, setLogSaved]         = useState(false);
  const [sleepSettings, setSleepSettings] = useState<Record<string, SleepSettings>>({});
  const [routineDone, setRoutineDone]   = useState<Record<string, boolean>>({});
  const glowAnim = useRef(new Animated.Value(0.7)).current;

  // Gentle breathing glow on moon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.7, duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    async function load() {
      const data = await getChildProfiles();
      setProfiles(data);
      const preferred = paramId ? data.find(p => p.id === paramId) : null;
      setActiveProfileId(preferred?.id ?? data[0]?.id ?? null);
    }
    load();
  }, [paramId]);

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const isGirl  = activeProfile?.gender === 'girl';
  const accent  = isGirl ? '#D06BA8' : C.lavAccent;
  const heroBg  = isGirl ? '#FFD6F0' : C.lavBg;
  const heroBg2 = isGirl ? '#F9C0E0' : C.lavBg2;
  const childName = activeProfile?.name ?? 'your child';

  const currentSettings: SleepSettings = (activeProfileId && sleepSettings[activeProfileId]) || {
    bedtime: { h: 21, m: 0 },
    wakeUp:  { h: 7,  m: 0 },
    alarm:   true,
  };
  const { bedtime, wakeUp, alarm } = currentSettings;

  function updateTime(type: 'bedtime' | 'wakeUp', part: 'h' | 'm', delta: number) {
    if (!activeProfileId) return;
    const current = {
      ...currentSettings,
      bedtime: { ...currentSettings.bedtime },
      wakeUp:  { ...currentSettings.wakeUp  },
    };
    if (part === 'h') {
      current[type].h = (current[type].h + delta + 24) % 24;
    } else {
      let min = current[type].m + delta;
      if (min >= 60) { min = 0;  current[type].h = (current[type].h + 1) % 24; }
      else if (min < 0) { min = 45; current[type].h = (current[type].h - 1 + 24) % 24; }
      current[type].m = min;
    }
    setSleepSettings({ ...sleepSettings, [activeProfileId]: current });
  }

  function toggleAlarm(val: boolean) {
    if (!activeProfileId) return;
    setSleepSettings({ ...sleepSettings, [activeProfileId]: { ...currentSettings, alarm: val } });
  }

  // Duration
  let diff = (wakeUp.h * 60 + wakeUp.m) - (bedtime.h * 60 + bedtime.m);
  if (diff < 0) diff += 24 * 60;
  const durationHours   = Math.floor(diff / 60);
  const durationMinutes = diff % 60;

  const sleepQuality = durationHours >= 9 ? 'Excellent 🌟' : durationHours >= 7 ? 'Good 😊' : 'Needs more 😴';
  const qualityColor = durationHours >= 9 ? C.successGn : durationHours >= 7 ? C.nightBlue : '#F59E0B';

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
              <View style={[st.goalBadge, { backgroundColor: 'rgba(255,255,255,0.80)' }]}>
                <Text style={st.goalBadgeTxt}>🌙 Sleep Tracker</Text>
              </View>
            </View>

            {/* Floating moon with glow */}
            <Animated.Text style={[st.heroMoon, { opacity: glowAnim }]}>🌙</Animated.Text>
            <Text style={st.heroTitle}>Sweet Dreams</Text>
            <Text style={st.heroSub}>Healthy sleep builds healthy minds 💙</Text>

            {/* Stars decoration */}
            <View style={st.starsRow}>
              <Text style={st.star}>✨</Text>
              <Text style={[st.star, { fontSize: 10 }]}>⭐</Text>
              <Text style={[st.star, { fontSize: 8 }]}>✨</Text>
              <Text style={[st.star, { fontSize: 12 }]}>⭐</Text>
              <Text style={[st.star, { fontSize: 9 }]}>✨</Text>
            </View>

            {/* Child selector pills */}
            {profiles.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.pillRow}>
                {profiles.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[st.pill, activeProfileId === p.id && { backgroundColor: accent }]}
                    onPress={() => setActiveProfileId(p.id)}
                    activeOpacity={0.78}
                  >
                    <Text style={[st.pillTxt, activeProfileId === p.id && { color: C.white }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── MOON VISUALIZATION CARD ── */}
          <View style={st.moonCard}>
            <View style={st.moonCardTopRow}>
              <View>
                <Text style={st.moonCardLabel}>TONIGHT'S SLEEP</Text>
                <Text style={st.moonCardName}>{childName}'s Rest</Text>
              </View>
              <View style={[st.qualityBadge, { backgroundColor: C.cardLav }]}>
                <Text style={[st.qualityTxt, { color: accent }]}>{sleepQuality}</Text>
              </View>
            </View>

            {/* Moon ring visualization */}
            <View style={st.moonRingWrap}>
              <Animated.View style={[st.moonGlowRing, { opacity: glowAnim, borderColor: isGirl ? '#F9A8D4' : '#A5B4FC' }]} />
              <View style={[st.moonRing, { borderColor: isGirl ? '#F9A8D4' : '#818CF8' }]}>
                <View style={st.moonInner}>
                  <Text style={st.moonBigEmoji}>🌙</Text>
                  <Text style={[st.moonDuration, { color: accent }]}>
                    {durationHours}h {durationMinutes > 0 ? `${durationMinutes}m` : ''}
                  </Text>
                  <Text style={st.moonDurSub}>sleep duration</Text>
                </View>
              </View>
            </View>

            {/* Sleep quality insight chips */}
            <View style={st.insightRow}>
              <View style={[st.insightChip, { backgroundColor: C.cardMoon }]}>
                <Text style={st.insightEmoji}>⭐</Text>
                <Text style={[st.insightTxt, { color: C.moonText }]}>{sleepQuality.split(' ')[0]}</Text>
              </View>
              <View style={[st.insightChip, { backgroundColor: C.cardMint }]}>
                <Text style={st.insightEmoji}>🔥</Text>
                <Text style={[st.insightTxt, { color: '#1A6040' }]}>3-night streak</Text>
              </View>
              <View style={[st.insightChip, { backgroundColor: C.cardLav }]}>
                <Text style={st.insightEmoji}>☀️</Text>
                <Text style={[st.insightTxt, { color: accent }]}>Refreshed</Text>
              </View>
            </View>
          </View>

          {/* ── SLEEP TIME CONTROLS ── */}
          <View style={st.sectionRow}>
            <Text style={st.sectionTitle}>Sleep Schedule</Text>
          </View>
          <View style={st.timeCardsRow}>
            {/* Bedtime */}
            <View style={[st.timeCard, { backgroundColor: C.cardLav, borderColor: isGirl ? '#F9A8D4' : '#C4B5FD' }]}>
              <View style={st.timeCardHeader}>
                <Text style={st.timeCardLabel}>Bedtime</Text>
                <Text style={st.timeCardEmoji}>🌙</Text>
              </View>
              <Text style={[st.timeCardTime, { color: accent }]}>{fmt(bedtime.h, bedtime.m)}</Text>
              <View style={st.adjRow}>
                <TouchableOpacity style={st.adjBtn} onPress={() => updateTime('bedtime', 'h', -1)} activeOpacity={0.7}>
                  <Text style={st.adjBtnTxt}>−1h</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.adjBtn} onPress={() => updateTime('bedtime', 'h', 1)} activeOpacity={0.7}>
                  <Text style={st.adjBtnTxt}>+1h</Text>
                </TouchableOpacity>
              </View>
              <View style={st.adjRow}>
                <TouchableOpacity style={st.adjBtn} onPress={() => updateTime('bedtime', 'm', -15)} activeOpacity={0.7}>
                  <Text style={st.adjBtnTxt}>−15m</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.adjBtn} onPress={() => updateTime('bedtime', 'm', 15)} activeOpacity={0.7}>
                  <Text style={st.adjBtnTxt}>+15m</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Arrow connector */}
            <View style={st.timeArrow}>
              <Text style={st.timeArrowTxt}>→</Text>
              <Text style={st.timeArrowSub}>{durationHours}h</Text>
            </View>

            {/* Wake-up */}
            <View style={[st.timeCard, { backgroundColor: C.cardMoon, borderColor: '#F0D888' }]}>
              <View style={st.timeCardHeader}>
                <Text style={st.timeCardLabel}>Wake-up</Text>
                <Text style={st.timeCardEmoji}>☀️</Text>
              </View>
              <Text style={[st.timeCardTime, { color: C.moonText }]}>{fmt(wakeUp.h, wakeUp.m)}</Text>
              <View style={st.adjRow}>
                <TouchableOpacity style={[st.adjBtn, { backgroundColor: '#FDE68A' }]} onPress={() => updateTime('wakeUp', 'h', -1)} activeOpacity={0.7}>
                  <Text style={[st.adjBtnTxt, { color: '#92400E' }]}>−1h</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.adjBtn, { backgroundColor: '#FDE68A' }]} onPress={() => updateTime('wakeUp', 'h', 1)} activeOpacity={0.7}>
                  <Text style={[st.adjBtnTxt, { color: '#92400E' }]}>+1h</Text>
                </TouchableOpacity>
              </View>
              <View style={st.adjRow}>
                <TouchableOpacity style={[st.adjBtn, { backgroundColor: '#FDE68A' }]} onPress={() => updateTime('wakeUp', 'm', -15)} activeOpacity={0.7}>
                  <Text style={[st.adjBtnTxt, { color: '#92400E' }]}>−15m</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.adjBtn, { backgroundColor: '#FDE68A' }]} onPress={() => updateTime('wakeUp', 'm', 15)} activeOpacity={0.7}>
                  <Text style={[st.adjBtnTxt, { color: '#92400E' }]}>+15m</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── LOG SLEEP BUTTON ── */}
          <TouchableOpacity
            style={[st.logBtn, { backgroundColor: logSaved ? C.successGn : accent }]}
            onPress={async () => {
              if (!activeProfileId) return;
              const log = await loadDailyLog(activeProfileId);
              await saveDailyLog({ ...log, sleepHours: durationHours });
              setLogSaved(true);
              setTimeout(() => setLogSaved(false), 2500);
            }}
            activeOpacity={0.84}
          >
            <Text style={st.logBtnTxt}>
              {logSaved ? `✅ Sleep logged for ${childName}!` : `🌙 Log ${durationHours}h ${durationMinutes}m sleep`}
            </Text>
          </TouchableOpacity>

          {/* ── BEDTIME ROUTINE ── */}
          <View style={st.sectionRow}>
            <Text style={st.sectionTitle}>Bedtime Routine</Text>
            <Text style={st.sectionSub}>Tap to check off</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.routineRow}>
            {ROUTINE_ITEMS.map(r => {
              const done = !!routineDone[r.label];
              return (
                <TouchableOpacity
                  key={r.label}
                  style={[st.routineCard, done && { backgroundColor: C.cardMint, borderColor: '#88D8B8' }]}
                  onPress={() => setRoutineDone(prev => ({ ...prev, [r.label]: !prev[r.label] }))}
                  activeOpacity={0.78}
                >
                  <Text style={st.routineEmoji}>{done ? '✅' : r.emoji}</Text>
                  <Text style={[st.routineLabel, done && { color: '#1A6040' }]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── ALARM / SMART ASSISTANT CARD ── */}
          <View style={st.alarmCard}>
            <View style={st.alarmLeft}>
              <Text style={st.alarmEmoji}>{alarm ? '🔔' : '🔕'}</Text>
              <View>
                <Text style={st.alarmTitle}>Sleep Reminders</Text>
                <Text style={st.alarmSub}>
                  {alarm
                    ? `Bedtime at ${fmt(bedtime.h, bedtime.m)} · Wake-up at ${fmt(wakeUp.h, wakeUp.m)}`
                    : 'Reminders are off'}
                </Text>
              </View>
            </View>
            <Switch
              value={alarm}
              onValueChange={toggleAlarm}
              trackColor={{ false: '#D1D5DB', true: accent }}
              thumbColor={C.white}
            />
          </View>

          {/* ── MOTIVATOR CARD ── */}
          <View style={[st.tipCard, { backgroundColor: durationHours >= 9 ? C.cardMint : C.cardLav }]}>
            <View style={st.tipLeft}>
              <Text style={st.tipEmoji}>{durationHours >= 9 ? '🏆' : '💙'}</Text>
            </View>
            <View style={st.tipRight}>
              <Text style={st.tipTitle}>{durationHours >= 9 ? 'Perfect sleep!' : 'Keep it up!'}</Text>
              <Text style={st.tipBody}>
                {durationHours >= 9
                  ? `Amazing sleep helps ${childName}'s brain grow strong! 🌟`
                  : `Consistent bedtime builds healthy habits for ${childName} 💙`}
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

const RING_SIZE = 200;

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 16 },

  // ── Header ──
  hero: {
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingHorizontal: SIDE,
    paddingBottom: 28,
    alignItems: 'center',
  },
  heroTopBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', width: '100%', marginBottom: 12,
  },
  back:    { paddingVertical: 4, paddingRight: 12 },
  backTxt: { fontSize: 14, fontWeight: '600', color: C.textMid },
  goalBadge: {
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
  },
  goalBadgeTxt: { fontSize: 12, fontWeight: '700', color: C.textDark },

  heroMoon:  { fontSize: 52, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: C.textDark, letterSpacing: -0.3, marginBottom: 5 },
  heroSub:   { fontSize: 13, fontWeight: '500', color: C.textMid, lineHeight: 19, marginBottom: 10 },

  starsRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'center' },
  star:     { fontSize: 14 },

  pillRow: { gap: 8, paddingVertical: 4 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
  },
  pillTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },

  // ── Moon card ──
  moonCard: {
    marginHorizontal: SIDE, marginBottom: 8,
    backgroundColor: C.white, borderRadius: 28, padding: 20,
    borderWidth: 1, borderColor: '#DDD8F8',
    shadowColor: '#6060C0', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 3,
  },
  moonCardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  moonCardLabel: { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.8, marginBottom: 4 },
  moonCardName:  { fontSize: 16, fontWeight: '700', color: C.textDark, letterSpacing: -0.2 },
  qualityBadge:  { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  qualityTxt:    { fontSize: 12, fontWeight: '700' },

  // Moon ring
  moonRingWrap: { alignItems: 'center', marginBottom: 20 },
  moonGlowRing: {
    position: 'absolute',
    width: RING_SIZE + 20, height: RING_SIZE + 20,
    borderRadius: (RING_SIZE + 20) / 2,
    borderWidth: 8, borderColor: '#A5B4FC',
    opacity: 0.3,
  },
  moonRing: {
    width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2,
    borderWidth: 6,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6060C0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 4,
    backgroundColor: C.white,
  },
  moonInner:     { alignItems: 'center' },
  moonBigEmoji:  { fontSize: 36, marginBottom: 4 },
  moonDuration:  { fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  moonDurSub:    { fontSize: 11, fontWeight: '500', color: C.textLight, marginTop: 2 },

  // Insight row
  insightRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  insightChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14,
  },
  insightEmoji: { fontSize: 13 },
  insightTxt:   { fontSize: 11, fontWeight: '700' },

  // ── Section headers ──
  sectionRow: {
    flexDirection: 'row', alignItems: 'baseline',
    paddingHorizontal: SIDE, marginTop: 20, marginBottom: 12, gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textDark },
  sectionSub:   { fontSize: 12, fontWeight: '500', color: C.textLight },

  // ── Time cards ──
  timeCardsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SIDE, gap: 8, marginBottom: 8,
  },
  timeCard: {
    flex: 1, borderRadius: 24, padding: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  timeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  timeCardLabel:  { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.5 },
  timeCardEmoji:  { fontSize: 16 },
  timeCardTime:   { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginBottom: 10 },
  adjRow:  { flexDirection: 'row', gap: 4, marginBottom: 4 },
  adjBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.70)', borderRadius: 10,
    paddingVertical: 6, alignItems: 'center',
  },
  adjBtnTxt: { fontSize: 11, fontWeight: '700', color: C.textMid },

  timeArrow: { alignItems: 'center', gap: 4 },
  timeArrowTxt: { fontSize: 18, color: C.textLight },
  timeArrowSub: { fontSize: 11, fontWeight: '700', color: C.textMid },

  // ── Log button ──
  logBtn: {
    marginHorizontal: SIDE, marginTop: 16, marginBottom: 8,
    borderRadius: 20, paddingVertical: 16, alignItems: 'center',
    shadowColor: C.lavAccent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 12, elevation: 5,
  },
  logBtnTxt: { fontSize: 15, fontWeight: '800', color: C.white },

  // ── Bedtime routine ──
  routineRow: { paddingHorizontal: SIDE, gap: 10, paddingBottom: 4 },
  routineCard: {
    width: 88, borderRadius: 20, borderWidth: 1, borderColor: '#E0D8FF',
    backgroundColor: C.cardLav, paddingVertical: 14,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  routineEmoji: { fontSize: 26 },
  routineLabel: { fontSize: 10, fontWeight: '700', color: C.textMid, textAlign: 'center' },

  // ── Alarm card ──
  alarmCard: {
    marginHorizontal: SIDE, marginTop: 20,
    backgroundColor: C.white, borderRadius: 24, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#E8E4F8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  alarmLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  alarmEmoji: { fontSize: 28 },
  alarmTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  alarmSub:   { fontSize: 11, fontWeight: '500', color: C.textMid, lineHeight: 15 },

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
