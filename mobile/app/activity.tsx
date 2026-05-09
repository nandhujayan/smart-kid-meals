import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, StatusBar, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChildProfiles, ChildProfile } from '../lib/meal-data';
import { DailyLog, GOALS, loadDailyLog, saveDailyLog } from '../lib/daily-log';
import Footer from '../components/Footer';

const { width } = Dimensions.get('window');
const SIDE = 16;
const ACT_LOG_KEY = (id: string, date: string) => `activity_entries_${id}_${date}`;
function todayStr() { return new Date().toISOString().slice(0, 10); }

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        '#F7F8F5',
  white:     '#FFFFFF',
  textDark:  '#1E2D3A',
  textMid:   '#6B7C8D',
  textLight: '#9AAAB8',
  cardMint:  '#E8F8EE',
  cardSky:   '#E0EEFF',
  cardLav:   '#EDE8FF',
  cardPeach: '#FFF0E0',
  cardPink:  '#FFEAF4',
  cardYellow:'#FFFBE0',
  cardTeal:  '#E0FAF5',
  cardRose:  '#FFE8EA',
};

const ACTIVITIES = [
  { label: 'Walk',      desc: 'Fresh air & outdoor fun',      emoji: '🚶', mins: 10, color: C.cardMint,   border: '#B8E8C8' },
  { label: 'Run',       desc: 'Boost heart rate & energy',    emoji: '🏃', mins: 15, color: C.cardYellow, border: '#F0D878' },
  { label: 'Cycling',  desc: 'Balance & coordination fun',   emoji: '🚴', mins: 20, color: C.cardSky,    border: '#A8C8F8' },
  { label: 'Swimming', desc: 'Full-body water adventure',     emoji: '🏊', mins: 30, color: C.cardLav,    border: '#C0A8F0' },
  { label: 'Dancing',  desc: 'Move to the beat & smile',     emoji: '💃', mins: 15, color: C.cardPink,   border: '#F0A8C8' },
  { label: 'Football', desc: 'Team fun & outdoor sport',      emoji: '⚽', mins: 20, color: C.cardPeach,  border: '#F0C898' },
  { label: 'Yoga',     desc: 'Calm body & peaceful mind',    emoji: '🧘', mins: 10, color: C.cardTeal,   border: '#88D8C8' },
  { label: 'Play',     desc: 'Creative free movement',       emoji: '�', mins: 15, color: C.cardRose,   border: '#F0A8A8' },
];

export default function ActivityScreen() {
  const router = useRouter();
  const { childId: paramId } = useLocalSearchParams<{ childId: string }>();
  const [profiles, setProfiles]   = useState<ChildProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dailyLog, setDailyLog]   = useState<DailyLog | null>(null);
  const [entries, setEntries]     = useState<Array<{ label: string; emoji: string; mins: number }>>([]);
  const barAnim = useRef(new Animated.Value(0)).current;

  const resolvedId  = selectedId ?? paramId ?? profiles[0]?.id ?? 'default';
  const resolvedIdx = Math.max(0, profiles.findIndex(p => p.id === resolvedId));
  const child     = profiles[resolvedIdx];
  const childId   = child?.id ?? resolvedId;
  const childName = child?.name ?? 'your child';
  const isGirl    = child?.gender === 'girl';
  const accent    = isGirl ? '#E8559A' : '#59D487';
  const heroBg    = isGirl ? '#FFD6F0' : '#E8F8EE';

  const mins = dailyLog?.activityMins ?? 0;
  const GOAL = GOALS.activity;
  const pct  = Math.min(100, Math.round((mins / GOAL) * 100));

  useEffect(() => {
    getChildProfiles().then(p => { if (p?.length) setProfiles(p); });
  }, []);

  useEffect(() => {
    if (!childId || childId === 'default') return;
    loadDailyLog(childId).then(log => {
      setDailyLog(log);
      const p = Math.min(100, Math.round(((log?.activityMins ?? 0) / GOAL) * 100));
      Animated.timing(barAnim, { toValue: p / 100, duration: 900, useNativeDriver: false }).start();
    });
    AsyncStorage.getItem(ACT_LOG_KEY(childId, todayStr())).then(v => {
      setEntries(v ? JSON.parse(v) : []);
    });
  }, [childId]);

  const addActivity = async (a: typeof ACTIVITIES[0]) => {
    const base = dailyLog ?? { childId, date: todayStr(), mealsLogged: 0, waterCups: 0, activityMins: 0, sleepHours: 0, lastUpdated: '' };
    const newMins   = Math.min(base.activityMins + a.mins, 180);
    const updated   = { ...base, activityMins: newMins };
    const newEntries = [{ label: a.label, emoji: a.emoji, mins: a.mins }, ...entries];
    setDailyLog(updated);
    setEntries(newEntries);
    const newPct = Math.min(1, newMins / GOAL);
    Animated.timing(barAnim, { toValue: newPct, duration: 600, useNativeDriver: false }).start();
    await saveDailyLog(updated);
    await AsyncStorage.setItem(ACT_LOG_KEY(childId, todayStr()), JSON.stringify(newEntries));
  };

  const undoLast = async () => {
    if (entries.length === 0 || !dailyLog) return;
    const [last, ...rest] = entries;
    const newMins = Math.max(0, dailyLog.activityMins - last.mins);
    const updated = { ...dailyLog, activityMins: newMins };
    setDailyLog(updated);
    setEntries(rest);
    Animated.timing(barAnim, { toValue: Math.min(1, newMins / GOAL), duration: 400, useNativeDriver: false }).start();
    await saveDailyLog(updated);
    await AsyncStorage.setItem(ACT_LOG_KEY(childId, todayStr()), JSON.stringify(rest));
  };

  const switchChild = (p: ChildProfile) => {
    setSelectedId(p.id);
    loadDailyLog(p.id).then(log => {
      setDailyLog(log);
      Animated.timing(barAnim, { toValue: Math.min(1, (log?.activityMins ?? 0) / GOAL), duration: 600, useNativeDriver: false }).start();
    });
    AsyncStorage.getItem(ACT_LOG_KEY(p.id, todayStr())).then(v => setEntries(v ? JSON.parse(v) : []));
  };

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

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
              {mins >= GOAL && (
                <View style={st.goalBadge}>
                  <Text style={st.goalBadgeTxt}>🏆 Goal Met!</Text>
                </View>
              )}
            </View>

            <Text style={st.heroEmoji}>🏃</Text>
            <Text style={st.heroTitle}>Move & Play</Text>
            <Text style={st.heroSub}>Daily movement builds healthy habits ✨</Text>

            {profiles.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.pillRow}>
                {profiles.map((p, i) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[st.pill, resolvedIdx === i && { backgroundColor: accent }]}
                    onPress={() => switchChild(p)}
                    activeOpacity={0.78}
                  >
                    <Text style={[st.pillTxt, resolvedIdx === i && { color: C.white }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── PROGRESS CARD ── */}
          <View style={st.progressCard}>
            <View style={st.progressTopRow}>
              <View>
                <Text style={st.progressLabel}>TODAY'S MOVEMENT</Text>
                <Text style={st.progressName}>{childName}'s Activity</Text>
              </View>
              <View style={[st.minsBadge, { backgroundColor: heroBg }]}>
                <Text style={[st.minsVal, { color: accent }]}>{mins}</Text>
                <Text style={[st.minsUnit, { color: accent }]}>min</Text>
              </View>
            </View>

            <View style={st.barTrack}>
              <Animated.View style={[st.barFill, { width: barWidth, backgroundColor: accent }]} />
              <View style={[st.barGoalMark, { left: '50%' }]} />
            </View>

            <View style={st.barFooter}>
              <Text style={[st.barPct, { color: accent }]}>{pct}% complete</Text>
              <Text style={st.barGoalTxt}>Goal: {GOAL} min</Text>
            </View>

            <View style={[st.motivationChip, { backgroundColor: mins >= GOAL ? '#E8F8EE' : '#FFF8E8' }]}>
              <Text style={st.motivationTxt}>
                {mins >= GOAL
                  ? `🎉 Amazing! ${childName} crushed today's goal!`
                  : `🔥 ${GOAL - mins} more minutes to unlock today's badge!`}
              </Text>
            </View>
          </View>

          {/* ── ACTIVITY GRID ── */}
          <View style={st.sectionRow}>
            <Text style={st.sectionTitle}>Log an Activity</Text>
            <Text style={st.sectionSub}>Tap to add minutes</Text>
          </View>

          <View style={st.grid}>
            {ACTIVITIES.map(a => (
              <TouchableOpacity
                key={a.label}
                style={[st.actCard, { backgroundColor: a.color, borderColor: a.border }]}
                onPress={() => addActivity(a)}
                activeOpacity={0.80}
              >
                <Text style={st.actEmoji}>{a.emoji}</Text>
                <Text style={st.actLabel}>{a.label}</Text>
                <Text style={st.actDesc} numberOfLines={1}>{a.desc}</Text>
                <View style={[st.actTimeBadge, { borderColor: a.border }]}>
                  <Text style={st.actTimeTxt}>⏱ +{a.mins} min</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── TODAY'S LOG ── */}
          {entries.length > 0 && (
            <>
              <View style={st.logHeader}>
                <Text style={st.sectionTitle}>Today's Log</Text>
                <TouchableOpacity onPress={undoLast} style={st.undoBtn} activeOpacity={0.75}>
                  <Text style={st.undoBtnTxt}>↩ Undo last</Text>
                </TouchableOpacity>
              </View>
              <View style={st.logCard}>
                {entries.map((entry, i) => (
                  <View key={i} style={[st.logItem, i < entries.length - 1 && st.logItemBorder]}>
                    <Text style={st.logEmoji}>{entry.emoji}</Text>
                    <View style={st.logItemMid}>
                      <Text style={st.logItemLabel}>{entry.label}</Text>
                      <Text style={st.logItemSub}>Activity logged today</Text>
                    </View>
                    <View style={[st.logMinsBadge, { backgroundColor: heroBg }]}>
                      <Text style={[st.logMins, { color: accent }]}>+{entry.mins}m</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── MOTIVATOR CARD ── */}
          <View style={[st.tipCard, { backgroundColor: mins >= GOAL ? '#E8F8EE' : '#FFFBE8' }]}>
            <View style={st.tipLeft}>
              <Text style={st.tipEmoji}>{mins >= GOAL ? '🏆' : '🌟'}</Text>
            </View>
            <View style={st.tipRight}>
              <Text style={st.tipTitle}>
                {mins >= GOAL ? 'Goal Complete!' : 'Keep it up!'}
              </Text>
              <Text style={st.tipBody}>
                {mins >= GOAL
                  ? `${childName} finished all ${GOAL} minutes today. Amazing work!`
                  : `Try a quick dance or game of tag — just ${GOAL - mins} minutes to go! 🕺`}
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

const CARD_W = (width - SIDE * 2 - 12) / 2;

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
  goalBadgeTxt: { fontSize: 12, fontWeight: '700', color: '#1A6E3C' },

  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: C.textDark, letterSpacing: -0.3, marginBottom: 5 },
  heroSub:   { fontSize: 13, fontWeight: '500', color: C.textMid, lineHeight: 19, marginBottom: 16 },

  pillRow: { gap: 8, paddingVertical: 4 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
  },
  pillTxt:  { fontSize: 13, fontWeight: '600', color: C.textMid },

  // ── Progress card ──
  progressCard: {
    marginHorizontal: SIDE, marginBottom: 8,
    backgroundColor: C.white, borderRadius: 28, padding: 20,
    borderWidth: 1, borderColor: '#EAECE8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 14, elevation: 3,
  },
  progressTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 18,
  },
  progressLabel: {
    fontSize: 10, fontWeight: '700', color: C.textLight,
    letterSpacing: 0.8, marginBottom: 5,
  },
  progressName: { fontSize: 16, fontWeight: '700', color: C.textDark, letterSpacing: -0.2 },
  minsBadge: {
    alignItems: 'center', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  minsVal:  { fontSize: 32, fontWeight: '800', lineHeight: 36, letterSpacing: -1 },
  minsUnit: { fontSize: 11, fontWeight: '600', opacity: 0.8 },

  barTrack: {
    height: 12, backgroundColor: '#EEF0EC', borderRadius: 999,
    overflow: 'hidden', marginBottom: 8, position: 'relative',
  },
  barFill:     { height: '100%', borderRadius: 999 },
  barGoalMark: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(255,255,255,0.50)' },
  barFooter:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  barPct:      { fontSize: 12, fontWeight: '700' },
  barGoalTxt:  { fontSize: 12, fontWeight: '500', color: C.textLight },

  motivationChip: {
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  motivationTxt: { fontSize: 13, fontWeight: '600', color: C.textDark, lineHeight: 19 },

  // ── Section header ──
  sectionRow: {
    flexDirection: 'row', alignItems: 'baseline',
    paddingHorizontal: SIDE, marginTop: 20, marginBottom: 12, gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textDark },
  sectionSub:   { fontSize: 12, fontWeight: '500', color: C.textLight },

  // ── Activity grid ──
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: SIDE, marginBottom: 8,
  },
  actCard: {
    width: CARD_W, borderRadius: 24, borderWidth: 1,
    paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actEmoji:     { fontSize: 34, marginBottom: 2 },
  actLabel:     { fontSize: 14, fontWeight: '700', color: C.textDark },
  actDesc:      { fontSize: 10, fontWeight: '500', color: C.textMid, textAlign: 'center', lineHeight: 14 },
  actTimeBadge: {
    marginTop: 6, borderRadius: 999, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.70)',
    paddingHorizontal: 10, paddingVertical: 3,
  },
  actTimeTxt:   { fontSize: 11, fontWeight: '700', color: C.textMid },

  // ── Today's log ──
  logHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE, marginTop: 20, marginBottom: 12,
  },
  undoBtn:    { paddingVertical: 4, paddingHorizontal: 8 },
  undoBtnTxt: { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  logCard: {
    marginHorizontal: SIDE, backgroundColor: C.white, borderRadius: 24,
    borderWidth: 1, borderColor: '#EAECE8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  logItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  logItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F4F1' },
  logEmoji:      { fontSize: 24 },
  logItemMid:    { flex: 1 },
  logItemLabel:  { fontSize: 14, fontWeight: '700', color: C.textDark },
  logItemSub:    { fontSize: 11, fontWeight: '500', color: C.textLight, marginTop: 2 },
  logMinsBadge:  { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  logMins:       { fontSize: 13, fontWeight: '800' },

  // ── Motivator tip card ──
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
