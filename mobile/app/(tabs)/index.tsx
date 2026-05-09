/**
 * Homepage — Gamified Kids Wellness Dashboard
 * All progress, streaks, XP, and habit completions are per-child,
 * persisted in AsyncStorage and computed live.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Image, ScrollView, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { getChildProfiles, ChildProfile } from '../../lib/meal-data';
import { DailyLog, GOALS, XP_PER_HABIT, todayStr, loadDailyLog, saveDailyLog } from '../../lib/daily-log';
import Celebration from '../../components/Celebration';
import Onboarding, { checkOnboardingStatus } from '../../components/Onboarding';

const { width } = Dimensions.get('window');
const SIDE  = 16;
const GAP   = 12;
const CARD_W = (width - SIDE * 2 - GAP) / 2;

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#F7F8F5',
  hero:      '#BEEBC9',
  heroBot:   '#A7DDB5',
  white:     '#FFFFFF',
  primary:   '#78D79A',
  primaryDk: '#3EA86A',
  textDark:  '#24323D',
  textMid:   '#6B7A8C',
  textLight: '#9AAAB8',
  cardMint:  '#DDF5E5',
  cardPeach: '#FFF1C9',
  cardSky:   '#BFDFFF',
  cardLav:   '#D9C8FF',
  barFill:   '#52C878',
  streakOr:  '#FFA14B',
  xpGold:    '#F6D777',
  mintTxt:   '#1A4A28',
  peachTxt:  '#5A3A10',
  skyTxt:    '#0E2E46',
  lavTxt:    '#2A1A58',
};

// ─── Assets ────────────────────────────────────────────────────────────────────
const IMG: Record<string, number> = {
  meals: require('../../assets/homepage/meal-plate.png'),
  run:   require('../../assets/homepage/running-boy.png'),
  water: require('../../assets/homepage/water-bottle.png'),
  sleep: require('../../assets/homepage/sleeping-boy.png'),
};

// Ordered boy/girl avatar pools — cycle by profile index within gender
const BOY_AVATARS  = [
  require('../../assets/homepage/child/boy0.png'),
  require('../../assets/homepage/child/boy1.png'),
  require('../../assets/homepage/child/boy2.png'),
  require('../../assets/homepage/child/boy4.png'),
];
const GIRL_AVATARS = [
  require('../../assets/homepage/child/girl1.png'),
  require('../../assets/homepage/child/girl2.png'),
  require('../../assets/homepage/child/girl3.png'),
];

// Returns avatar using explicit gender from profile
function getChildAvatar(gender: 'boy' | 'girl' | undefined, genderIndex: number): number {
  if (gender === 'girl') return GIRL_AVATARS[genderIndex % GIRL_AVATARS.length];
  return BOY_AVATARS[genderIndex % BOY_AVATARS.length];
}

function heroColor(gender: 'boy' | 'girl' | undefined): string {
  return gender === 'girl' ? '#FBCDE4' : C.hero;
}
function heroBotColor(gender: 'boy' | 'girl' | undefined): string {
  return gender === 'girl' ? '#F48BBE' : C.heroBot;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function pct(value: number, goal: number): number {
  return Math.min(100, Math.round((value / goal) * 100));
}

const XP_PER_LEVEL = 500;

function xpLevel(xp: number): { level: number; levelXp: number; toNext: number; levelPct: number } {
  const level    = Math.floor(xp / XP_PER_LEVEL) + 1;
  const levelXp  = xp % XP_PER_LEVEL;
  const toNext   = XP_PER_LEVEL - levelXp;
  const levelPct = Math.round((levelXp / XP_PER_LEVEL) * 100);
  return { level, levelXp, toNext, levelPct };
}

// ─── Streak type + helpers ────────────────────────────────────────────────────
interface StreakData {
  childId:    string;
  streakDays: number;
  lastActive: string;
  xpTotal:    number;
}

async function loadStreak(childId: string): Promise<StreakData> {
  const raw = await AsyncStorage.getItem(`streak_${childId}`);
  if (raw) return JSON.parse(raw) as StreakData;
  return { childId, streakDays: 0, lastActive: '', xpTotal: 0 };
}
async function saveStreak(s: StreakData): Promise<void> {
  await AsyncStorage.setItem(`streak_${s.childId}`, JSON.stringify(s));
}

async function recalcStreak(log: DailyLog, prev: StreakData): Promise<StreakData> {
  const allDone =
    log.mealsLogged  >= GOALS.meals    &&
    log.waterCups    >= GOALS.water    &&
    log.activityMins >= GOALS.activity &&
    log.sleepHours   >= GOALS.sleep;
  const today     = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let { streakDays, lastActive, xpTotal } = prev;
  if (allDone && lastActive !== today) {
    streakDays = lastActive === yesterday ? streakDays + 1 : 1;
    lastActive = today;
  }
  const mealsXp    = log.mealsLogged  >= GOALS.meals    ? XP_PER_HABIT.meals    : 0;
  const waterXp    = log.waterCups    >= GOALS.water    ? XP_PER_HABIT.water    : 0;
  const activityXp = log.activityMins >= GOALS.activity ? XP_PER_HABIT.activity : 0;
  const sleepXp    = log.sleepHours   >= GOALS.sleep    ? XP_PER_HABIT.sleep    : 0;
  xpTotal = Math.max(xpTotal, mealsXp + waterXp + activityXp + sleepXp);
  return { childId: log.childId, streakDays, lastActive, xpTotal };
}

function computeBadges(log: DailyLog, streak: StreakData) {
  return [
    { icon: '🥇', label: 'First Meal',   earned: log.mealsLogged   >= 1 },
    { icon: '💧', label: 'Hydro Hero',   earned: log.waterCups     >= GOALS.water },
    { icon: '🏃', label: 'Move Master',  earned: log.activityMins  >= GOALS.activity },
    { icon: '🌙', label: 'Sleep Star',   earned: log.sleepHours    >= GOALS.sleep },
    { icon: '🔥', label: '7-Day Streak', earned: streak.streakDays >= 7 },
  ];
}

function computeTips(name: string, log: DailyLog) {
  const tips: { icon: string; color: string; text: string }[] = [];
  if (log.waterCups < GOALS.water) {
    const left = GOALS.water - log.waterCups;
    tips.push({ icon: '💧', color: C.cardSky,  text: `${name} needs ${left} more cup${left > 1 ? 's' : ''} of water today. Try a fun bottle!` });
  }
  if (log.mealsLogged < GOALS.meals) {
    tips.push({ icon: '🥦', color: C.cardMint, text: `Don't forget ${name}'s ${log.mealsLogged === 0 ? 'meals' : 'remaining meal'} — balanced nutrition matters!` });
  }
  if (log.activityMins < GOALS.activity) {
    const left = GOALS.activity - log.activityMins;
    tips.push({ icon: '🏃', color: C.cardPeach, text: `${name} needs ${left} more minutes of activity. A quick outdoor game works!` });
  }
  if (log.sleepHours < GOALS.sleep) {
    tips.push({ icon: '😴', color: C.cardLav, text: `Start wind-down at 8:30 PM so ${name} gets ${GOALS.sleep}h of sleep.` });
  }
  if (tips.length === 0) {
    tips.push({ icon: '🌟', color: '#FFF8DC', text: `Amazing! ${name} completed all habits today! Keep it up!` });
  }
  return tips.slice(0, 3);
}

// ─── Child meta (UI only — real profiles come from getChildProfiles) ───────────
const CHILD_META: Record<string, { emoji: string; color: string }> = {
  default: { emoji: '👦', color: C.cardMint },
};
const FALLBACK_META = [
  { emoji: '👦', color: '#B8E8D0' },
  { emoji: '👧', color: '#FFE7A8' },
  { emoji: '🧒', color: '#CDE6FF' },
];

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Real profiles from storage/Supabase
  const [profiles,      setProfiles]      = useState<ChildProfile[]>([]);
  const [selectedIdx,   setSelectedIdx]   = useState(0);
  const [log,           setLog]           = useState<DailyLog | null>(null);
  const [streakData,    setStreakData]     = useState<StreakData | null>(null);
  const [dropOpen,      setDropOpen]      = useState(false);
  const [celebVisible,  setCelebVisible]  = useState(false);
  const [celebMsg,      setCelebMsg]      = useState('🎉 Great job!');
  const [showOnboarding,setShowOnboarding]= useState(false);

  // Animated values
  const dropAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim= useRef(new Animated.Value(0)).current;

  // ── Derived values from real data ──────────────────────────────────────────
  const child      = profiles[selectedIdx];
  const childId    = child?.id ?? `fallback_${selectedIdx}`;
  const childName  = child?.name ?? ['Leo', 'Mia', 'Max'][selectedIdx] ?? 'Leo';
  const childGender   = child?.gender;   // 'boy' | 'girl' | undefined
  const childIsGirl   = childGender === 'girl';
  const meta          = childIsGirl
    ? { emoji: '👧', color: '#FFE7A8' }
    : FALLBACK_META[selectedIdx % FALLBACK_META.length];
  const heroAvatarImg = getChildAvatar(childGender, selectedIdx);

  const mealsProgress   = log ? pct(log.mealsLogged,  GOALS.meals)    : 0;
  const waterProgress   = log ? pct(log.waterCups,     GOALS.water)    : 0;
  const activityProgress= log ? pct(log.activityMins,  GOALS.activity) : 0;
  const sleepProgress   = log ? pct(log.sleepHours,    GOALS.sleep)    : 0;

  const habitsCompleted = [mealsProgress, waterProgress, activityProgress, sleepProgress]
    .filter(p => p >= 100).length;
  const overallPct = Math.round((mealsProgress + waterProgress + activityProgress + sleepProgress) / 4);

  const xpInfo    = streakData ? xpLevel(streakData.xpTotal) : { level: 1, levelXp: 0, toNext: XP_PER_LEVEL, levelPct: 0 };
  const streak    = streakData?.streakDays ?? 0;
  const badges    = log && streakData ? computeBadges(log, streakData) : [];
  const tips      = log ? computeTips(childName, log) : [];

  // Next incomplete habit label
  const nextGoal = (() => {
    if (!log) return 'Log your first habit!';
    if (log.mealsLogged  < GOALS.meals)    return `Eat meal ${log.mealsLogged + 1} of ${GOALS.meals}`;
    if (log.waterCups    < GOALS.water)    return `Drink cup ${log.waterCups + 1} of ${GOALS.water}`;
    if (log.activityMins < GOALS.activity) return `${GOALS.activity - log.activityMins} min activity left`;
    if (log.sleepHours   < GOALS.sleep)    return `Aim for ${GOALS.sleep}h sleep tonight`;
    return 'All habits complete! 🎉';
  })();

  // Habit cards config — uses live log values
  const HABITS = log ? [
    {
      id: 'meals', title: 'Yummy Meals',
      sub: `${log.mealsLogged}/${GOALS.meals} meals today`,
      img: IMG.meals, bg: C.cardMint, titleC: C.mintTxt,
      progress: mealsProgress, emoji: '🍳',
      done: mealsProgress >= 100,
    },
    {
      id: 'run', title: 'Fun Activity',
      sub: `${log.activityMins} of ${GOALS.activity} min`,
      img: IMG.run, bg: C.cardPeach, titleC: C.peachTxt,
      progress: activityProgress, emoji: '🏃',
      done: activityProgress >= 100,
    },
    {
      id: 'water', title: 'Water Goal',
      sub: `${log.waterCups} of ${GOALS.water} cups`,
      img: IMG.water, bg: C.cardSky, titleC: C.skyTxt,
      progress: waterProgress, emoji: '💧',
      done: waterProgress >= 100,
    },
    {
      id: 'sleep', title: 'Sweet Dreams',
      sub: `${log.sleepHours > 0 ? log.sleepHours + 'h logged' : 'Bedtime at 9 PM'}`,
      img: IMG.sleep, bg: C.cardLav, titleC: C.lavTxt,
      progress: sleepProgress, emoji: '🌙',
      done: sleepProgress >= 100,
    },
  ] : [];

  // ── Load data on mount & when child changes ────────────────────────────────
  useEffect(() => {
    (async () => {
      const seen = await checkOnboardingStatus();
      if (!seen) setShowOnboarding(true);
    })();
  }, []);

  // Reload profiles on mount/auth change
  useEffect(() => {
    (async () => {
      const p = await getChildProfiles();
      if (p?.length) setProfiles(p);
    })();
  }, [user]);

  const loadChildData = useCallback(async (id: string) => {
    const [l, s] = await Promise.all([loadDailyLog(id), loadStreak(id)]);
    setLog(l);
    setStreakData(s);
    // Reset and re-run progress animation
    progressAnim.setValue(0);
    Animated.timing(progressAnim, { toValue: 1, duration: 1200, useNativeDriver: false }).start();
  }, []);

  useEffect(() => {
    loadChildData(childId);
  }, [childId]);

  // Reload profiles + log whenever this tab gains focus
  // This ensures data logged on detail screens (drink, activity, sleep, meals) shows here
  useFocusEffect(
    useCallback(() => {
      getChildProfiles().then(p => { if (p?.length) setProfiles(p); });
      loadChildData(childId);
    }, [childId])
  );

  // ── Dropdown ──────────────────────────────────────────────────────────────
  const openDrop  = () => {
    setDropOpen(true);
    Animated.spring(dropAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };
  const closeDrop = () => {
    Animated.timing(dropAnim, { toValue: 0, duration: 160, useNativeDriver: true })
      .start(() => setDropOpen(false));
  };

  // ── Habit tap — navigate to detail page, passing childId so it loads correct data ──
  const handleHabitPress = (id: string) => {
    const params = `?childId=${encodeURIComponent(childId)}`;
    switch (id) {
      case 'meals':  router.push(('/meals' + params) as any); break;
      case 'water':  router.push(('/drink' + params) as any);  break;
      case 'sleep':  router.push(('/sleep' + params) as any);  break;
      case 'run':    router.push(('/activity' + params) as any); break;
    }
  };

  // ── Long-press — log habit (increment) ────────────────────────────────────
  const applyHabitChange = async (updated: DailyLog, msg: string) => {
    await saveDailyLog(updated);
    const newStreak = await recalcStreak(updated, streakData ?? { childId, streakDays: 0, lastActive: '', xpTotal: 0 });
    await saveStreak(newStreak);
    setLog(updated);
    setStreakData(newStreak);
    setCelebMsg(msg);
    setCelebVisible(true);
  };

  const handleHabitLongPress = async (id: string) => {
    if (!log) return;
    const updated = { ...log, lastUpdated: todayStr() };
    let msg = '';
    switch (id) {
      case 'meals':
        if (log.mealsLogged > 0) {
          updated.mealsLogged = log.mealsLogged - 1;
          msg = `↩️ Meal undone — now ${updated.mealsLogged}/${GOALS.meals}`;
        } else { msg = '🍳 Nothing to undo!'; }
        break;
      case 'run':
        if (log.activityMins > 0) {
          updated.activityMins = Math.max(0, log.activityMins - 15);
          msg = `↩️ Removed 15 min — ${updated.activityMins}/${GOALS.activity} min`;
        } else { msg = '🏃 Nothing to undo!'; }
        break;
      case 'water':
        if (log.waterCups > 0) {
          updated.waterCups = log.waterCups - 1;
          msg = `↩️ Cup removed — ${updated.waterCups}/${GOALS.water} cups`;
        } else { msg = '💧 Nothing to undo!'; }
        break;
      case 'sleep':
        if (log.sleepHours > 0) {
          updated.sleepHours = Math.max(0, log.sleepHours - 1);
          msg = `↩️ Sleep removed — ${updated.sleepHours}h/${GOALS.sleep}h`;
        } else { msg = '🌙 Nothing to undo!'; }
        break;
    }
    await applyHabitChange(updated, msg);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: heroColor(childGender) }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ══════════ HERO ══════════ */}
          <View style={s.heroContainer}>

            <View style={[s.hero, { backgroundColor: heroColor(childGender) }]}>
              {/* Decorative bubbles */}
              <View style={[s.heroBubble, s.heroBubble1, { backgroundColor: heroBotColor(childGender) }]} />
              <View style={[s.heroBubble, s.heroBubble2, { backgroundColor: heroBotColor(childGender) }]} />
              <View style={[s.heroBubble, s.heroBubble3, { backgroundColor: heroBotColor(childGender) }]} />
              <View style={[s.heroBubble, s.heroBubble4, { backgroundColor: heroBotColor(childGender) }]} />
              <View style={[s.heroGradLayer, { backgroundColor: heroBotColor(childGender) }]} />

              {/* ── Top bar: date left ── */}
              <View style={s.topBar}>
                <Text style={s.topDate}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>
              </View>

              {/* ── Main greeting block ── */}
              <View style={s.greetBlock}>
                <Text style={s.greetTitle}>
                  {habitsCompleted === 4
                    ? `Amazing, ${childName}! 🌟`
                    : habitsCompleted >= 2
                    ? `Great progress, ${childName}! 👏`
                    : `${getGreeting()}, ${childName}!`}
                </Text>
                <Text style={s.greetSub}>
                  {habitsCompleted === 4
                    ? 'All 4 habits crushed today 🏆'
                    : `${habitsCompleted} of 4 habits done · Keep going!`}
                </Text>

                {/* Level bar */}
                <View style={s.levelRow}>
                  <Text style={s.levelLbl}>Lv {xpInfo.level}</Text>
                  <View style={s.levelBarTrack}>
                    <View style={[s.levelBarFill, { width: `${xpInfo.levelPct}%` as any }]} />
                  </View>
                  <Text style={s.levelPct}>{xpInfo.toNext} XP to next</Text>
                </View>

                {/* Child switcher pill */}
                <TouchableOpacity
                  style={s.pill}
                  onPress={dropOpen ? closeDrop : openDrop}
                  activeOpacity={0.85}
                >
                  <Text style={s.pillEmoji}>{meta.emoji}</Text>
                  <Text style={s.pillText}>{childName}</Text>
                  <Animated.Text style={[s.pillChev, {
                    transform: [{
                      rotate: dropAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
                    }],
                  }]}>▾</Animated.Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hero mascot — sits in heroContainer, outside overflow:hidden hero */}
            <View style={s.heroImgWrap} pointerEvents="none">
              <Image source={heroAvatarImg} style={s.heroImg} resizeMode="contain" />
            </View>

            {/* XP + streak pills — AFTER avatar in DOM so they render ON TOP */}
            <View style={s.heroPills}>
              <View style={s.xpPill}>
                <Text style={s.xpStar}>⭐</Text>
                <Text style={s.xpNum}>{streakData?.xpTotal ?? 0} XP</Text>
              </View>
              <View style={s.streakPill}>
                <Text style={s.streakFire}>🔥</Text>
                <Text style={s.streakNum}>{streak}d</Text>
              </View>
            </View>


            {/* Dropdown — full-width card below pill */}
            {dropOpen && (
              <Animated.View style={[s.dropdown, {
                opacity: dropAnim,
                transform: [{ translateY: dropAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
              }]}>
                <Text style={s.dropHeader}>Switch Child</Text>
                {(profiles.length > 0
                  ? profiles
                  : [{ id: 'fallback_0', name: 'Leo', age: '6', goal: 'Healthy eating', diet: '', allergies: [] } as ChildProfile]
                ).map((p, i) => {
                  const isActive  = selectedIdx === i;
                  const avatarImg = getChildAvatar(p.gender, i);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[s.dropRow, isActive && s.dropRowActive]}
                      onPress={() => { setSelectedIdx(i); closeDrop(); }}
                      activeOpacity={0.75}
                    >
                      <View style={s.dropAvatarImg}>
                        <Image source={avatarImg} style={s.dropAvatarImgSrc} resizeMode="contain" />
                      </View>
                      <View style={s.dropInfo}>
                        <Text style={[s.dropName, isActive && s.dropNameActive]}>{p.name}</Text>
                        {(p.age || p.goal) ? (
                          <Text style={s.dropSub}>
                            {p.age ? `Age ${p.age}` : ''}{p.age && p.goal ? '  ·  ' : ''}{p.goal ?? ''}
                          </Text>
                        ) : null}
                      </View>
                      {isActive && (
                        <View style={s.dropCheckBadge}>
                          <Text style={s.dropCheckTxt}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            )}

          </View>{/* end heroContainer */}

          {/* ══════════ WHITE PANEL ══════════ */}
          <View style={s.panel}>
            <View style={s.dragHandle} />

            {/* ── DAILY PROGRESS CARD ── */}
            <View style={s.progressCard}>
              <View style={s.progressLeft}>
                <View style={s.progressTitleRow}>
                  <Text style={s.progressTitle}>Daily Progress</Text>
                  <View style={s.progressDayBadge}>
                    <Text style={s.progressDayBadgeTxt}>📅 Today</Text>
                  </View>
                </View>
                <Text style={s.progressScore}>
                  {overallPct >= 100 ? '🏆' : ''}{overallPct}%
                </Text>
                <Text style={s.progressSub}>
                  {overallPct >= 100
                    ? `Perfect day, ${childName}!`
                    : overallPct >= 60
                    ? `${childName} is on a roll!`
                    : `You’ve got this, ${childName}!`}
                </Text>
                <View style={s.progressMeta}>
                  <View style={[s.metaDot, { backgroundColor: C.primary }]} />
                  <Text style={s.metaText}>{habitsCompleted} of 4 habits done</Text>
                </View>
                <TouchableOpacity
                  style={s.nextGoalBtn}
                  onPress={() => {
                    const params = `?childId=${encodeURIComponent(childId)}`;
                    if (!log || log.mealsLogged < GOALS.meals) router.push(('/meals' + params) as any);
                    else if (log.waterCups < GOALS.water)    router.push(('/drink' + params) as any);
                    else if (log.activityMins < GOALS.activity) router.push(('/activity' + params) as any);
                    else router.push(('/sleep' + params) as any);
                  }}
                >
                  <Text style={s.nextGoalText}>🚀  {nextGoal}</Text>
                </TouchableOpacity>
              </View>

              {/* Progress ring */}
              <View style={s.progressRight}>
                <ProgressRing
                  habits={[
                    { pct: mealsProgress,    color: '#5DC98A', icon: '🍳' },
                    { pct: activityProgress, color: '#FF8C42', icon: '🏃' },
                    { pct: waterProgress,    color: '#4CA8E0', icon: '💧' },
                    { pct: sleepProgress,    color: '#9880F0', icon: '🌙' },
                  ]}
                  overall={overallPct}
                />
              </View>
            </View>

            {/* ── HABIT CARDS ── */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Today's Habits</Text>
              <Text style={s.sectionHint}>Tap to open · hold to undo</Text>
            </View>

            <View style={s.grid}>
              {HABITS.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  onPress={() => handleHabitPress(h.id)}
                  onLongPress={() => handleHabitLongPress(h.id)}
                  progressAnim={progressAnim}
                />
              ))}
            </View>

            {/* ── REWARDS ── */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Achievements</Text>
              <TouchableOpacity><Text style={s.sectionLink}>All badges →</Text></TouchableOpacity>
            </View>

            {/* XP bar */}
            <View style={s.xpCard}>
              <View style={s.xpCardTop}>
                <Text style={s.xpCardLabel}>⭐ {streakData?.xpTotal ?? 0} XP — Level {xpInfo.level}</Text>
                <Text style={s.xpCardNext}>{xpInfo.toNext} XP to Level {xpInfo.level + 1}</Text>
              </View>
              <View style={s.xpBarTrack}>
                <Animated.View style={[s.xpBarFill, {
                  width: progressAnim.interpolate({
                    inputRange:  [0, 1],
                    outputRange: ['0%', `${xpInfo.levelPct}%`],
                  }),
                }]} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.badgesRow}>
                {badges.map((b) => (
                  <View key={b.label} style={[s.badge, !b.earned && s.badgeLocked]}>
                    <Text style={s.badgeIcon}>{b.icon}</Text>
                    <Text style={[s.badgeLabel, !b.earned && s.badgeLabelLocked]}>{b.label}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ── STREAK CARD ── */}
            <View style={s.streakCard}>
              <View style={s.streakCardTop}>
                <View>
                  <Text style={s.streakCardTitle}>
                    {streak >= 7 ? '🔥 Incredible streak!' : streak > 0 ? `🔥 ${streak}-Day Streak!` : '🔥 Start your streak!'}
                  </Text>
                  <Text style={s.streakCardSub}>
                    {streak >= 7
                      ? '7-day badge unlocked! 🏅'
                      : streak > 0
                      ? `${7 - streak} more days for the 7-day badge`
                      : 'Complete all 4 habits today'}
                  </Text>
                </View>
                <View style={s.streakFlame}>
                  <Text style={s.streakFlameNum}>{streak}</Text>
                  <Text style={s.streakFlameLbl}>days</Text>
                </View>
              </View>
              {/* Weekday tracker */}
              <View style={s.streakDotsRow}>
                {['M','T','W','T','F','S','S'].map((d, i) => {
                  const filled = i < (streak % 7 || (streak >= 7 ? 7 : 0));
                  const isToday = i === (new Date().getDay() + 6) % 7;
                  return (
                    <View key={i} style={[s.streakDot, filled && s.streakDotOn, isToday && !filled && s.streakDotToday]}>
                      {filled
                        ? <Text style={s.streakDotCheck}>✓</Text>
                        : <Text style={[s.streakDotL, isToday && s.streakDotTodayL]}>{d}</Text>}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── SMART TIPS ── */}
            <View style={[s.sectionHeader, { marginTop: 8 }]}>
              <Text style={s.sectionTitle}>💡 Smart Tips</Text>
            </View>
            {tips.map((t, i) => (
              <View key={i} style={[s.tipCard, { backgroundColor: t.color }]}>
                <View style={s.tipIconWrap}>
                  <Text style={s.tipIcon}>{t.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tipText} numberOfLines={3}>{t.text}</Text>
                </View>
              </View>
            ))}

            <View style={{ height: 24 }} />
          </View>

        </ScrollView>
      </SafeAreaView>

      <Celebration visible={celebVisible} message={celebMsg} onComplete={() => setCelebVisible(false)} />
      <Onboarding  visible={showOnboarding} onComplete={() => setShowOnboarding(false)} />
    </View>
  );
}

// ─── ProgressRing ─────────────────────────────────────────────────────────────
// Reliable circular progress using the standard React Native half-clip pattern.
// The ring is split into two halves. Each half clips a rotating border circle.
// • 0–50%  → only right half rotates (left half shows grey)
// • 50–100%→ right half fully green, left half rotates from bottom
function ProgressRing({
  habits, overall,
}: {
  habits: Array<{ pct: number; color: string; icon: string }>;
  overall: number;
}) {
  const SIZE   = RING;          // 96
  const SW     = STROKE;        // 10
  const HALF   = SIZE / 2;
  const fillColor = '#5DC98A';
  const trackColor = 'rgba(0,0,0,0.08)';

  // Degrees: overall 0-100 maps to 0-360deg.
  // We use the standard two-half approach:
  //   Right half: clip right side, rotate a full-border-circle from -135deg
  //               for the first 180deg of fill (0–50%)
  //   Left half:  clip left side,  rotate a full-border-circle from -135deg
  //               for the second 180deg of fill (50–100%)
  const fillDeg = (overall / 100) * 360;

  // Right semicircle handles 0–180deg of fill
  const rightDeg = Math.min(fillDeg, 180);
  // Left semicircle handles 180–360deg of fill (starts at 0 when overall > 50%)
  const leftDeg  = Math.max(fillDeg - 180, 0);

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      {/* ── Ring ── */}
      <View style={[s.ringOuter, { position: 'relative' }]}>

        {/* Grey track */}
        <View style={{
          position: 'absolute', width: SIZE, height: SIZE,
          borderRadius: HALF, borderWidth: SW, borderColor: trackColor,
        }} />

        {/* Right half — reveals 0→180° of fill */}
        {/* Clip: show only the right half of the circle */}
        <View style={{
          position: 'absolute', width: HALF, height: SIZE,
          left: HALF, overflow: 'hidden',
        }}>
          {/* Full ring, positioned so its centre aligns with ring centre */}
          <View style={{
            position: 'absolute', left: -HALF, top: 0,
            width: SIZE, height: SIZE, borderRadius: HALF,
            borderWidth: SW,
            borderColor: 'transparent',
            borderTopColor:   fillColor,
            borderRightColor: fillColor,
            // Start at -90° (12 o'clock) then rotate by rightDeg
            transform: [{ rotate: `${-90 + rightDeg}deg` }],
          }} />
        </View>

        {/* Left half — reveals 180→360° of fill (only when > 50%) */}
        {overall > 50 && (
          <View style={{
            position: 'absolute', width: HALF, height: SIZE,
            left: 0, overflow: 'hidden',
          }}>
            <View style={{
              position: 'absolute', left: 0, top: 0,
              width: SIZE, height: SIZE, borderRadius: HALF,
              borderWidth: SW,
              borderColor: 'transparent',
              borderBottomColor: fillColor,
              borderLeftColor:   fillColor,
              // Start at 90° (6 o'clock) then rotate by leftDeg
              transform: [{ rotate: `${-90 + leftDeg}deg` }],
            }} />
          </View>
        )}

        {/* Centre label */}
        <View style={s.ringCenter}>
          <Text style={s.ringPct}>{overall}%</Text>
          <Text style={s.ringLabel}>complete</Text>
        </View>
      </View>

      {/* ── Mini habit dots ── */}
      <View style={s.ringDots}>
        {habits.map((h, i) => (
          <View key={i} style={[s.ringDot, { backgroundColor: h.pct >= 100 ? h.color : '#EEF0F2' }]}>
            <Text style={s.ringDotIcon}>{h.icon}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── HabitCard ────────────────────────────────────────────────────────────────
function HabitCard({
  habit, onPress, onLongPress, progressAnim,
}: {
  habit: { id: string; title: string; sub: string; img: number; bg: string;
           titleC: string; progress: number; emoji: string; done: boolean };
  onPress: () => void;
  onLongPress: () => void;
  progressAnim: Animated.Value;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pIn  = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 60 }).start();
  const pOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 60 }).start();

  const barW = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', `${habit.progress}%`],
  });

  return (
    <View style={s.cardOuter}>
      {/* 3D base slab — sits behind+below the card, colored bottom face */}
      <View style={[s.card3dBase, { backgroundColor: habit.titleC }]} />

      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        onPressIn={pIn}
        onPressOut={pOut}
        activeOpacity={1}
      >
      {/* Shadow wrapper — bg matches card for colored Android shadow */}
      <Animated.View style={[s.cardShadow, { backgroundColor: habit.bg, shadowColor: habit.titleC, transform: [{ scale }] }]}>
        <View style={[s.card, { backgroundColor: habit.bg }]}>

          {/* Done checkmark */}
          {habit.done && (
            <View style={s.doneCheck}>
              <Text style={s.doneCheckTxt}>✓</Text>
            </View>
          )}

          {/* Progress % badge top-left */}
          <View style={s.pctBadge}>
            <Text style={s.pctBadgeTxt}>{habit.progress}%</Text>
          </View>

          {/* Illustration */}
          <View style={s.cardImgWrap}>
            <Image source={habit.img} style={s.cardImg} resizeMode="contain" />
          </View>

          {/* Bottom content */}
          <View style={s.cardBottom}>
            <Text style={[s.cardTitle, { color: habit.titleC }]} numberOfLines={1}>
              {habit.title}
            </Text>
            <Text style={s.cardSub} numberOfLines={1}>{habit.sub}</Text>
            <View style={s.barRow}>
              <View style={s.barTrack}>
                <Animated.View style={[s.barFill, { width: barW, backgroundColor: habit.done ? C.primary : C.barFill }]} />
              </View>
              <Text style={s.cardEmoji}>{habit.emoji}</Text>
            </View>
          </View>

        </View>
      </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const RING = 96;
const STROKE = 10;

const s = StyleSheet.create({
  root: { flex: 1 },   // bg set dynamically via inline style on the View
  safe: { flex: 1 },
  scroll: { paddingBottom: 16 },

  // ── Hero ──
  heroContainer: { position: 'relative', zIndex: 20 },
  hero: {
    paddingLeft: SIDE,
    paddingRight: SIDE,
    paddingTop: 8,
    paddingBottom: 36,
    overflow: 'hidden',
    minHeight: 190,
  },
  // Bottom arc — kept for wave shape but panel covers it fully
  heroArc: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    right: -20,
    height: 72,
    borderRadius: 999,
  },
  heroGradLayer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '60%', opacity: 0.35,
  },
  // Decorative bubbles
  heroBubble: { position: 'absolute', borderRadius: 999 },
  heroBubble1: { width: 160, height: 160, top: -50, right: -30, opacity: 0.22 },
  heroBubble2: { width: 80,  height: 80,  top: 70,  right: 10,  opacity: 0.14 },
  heroBubble3: { width: 50,  height: 50,  bottom: 20, left: -10, opacity: 0.12 },
  heroBubble4: { width: 32,  height: 32,  top: 20,  left: width * 0.42, opacity: 0.15 },

  // Top bar
  topBar: { marginBottom: 8 },
  // XP + streak pills — top-right, above avatar
  heroPills: {
    position: 'absolute', top: 8, right: SIDE,
    flexDirection: 'row', gap: 8, alignItems: 'center', zIndex: 20,
  },
  topDate: {
    fontSize: 12, fontWeight: '600', letterSpacing: 0.2,
    color: 'rgba(20,60,35,0.50)', marginBottom: 4,
  },
  topGreeting: { fontSize: 14, fontWeight: '700', color: 'rgba(20,50,30,0.75)' },
  topRight: { flexDirection: 'row', gap: 6, alignItems: 'center' },

  // XP + streak pills — glassmorphism style
  xpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  xpStar: { fontSize: 12 },
  xpNum:  { fontSize: 12, fontWeight: '800', color: C.textDark, letterSpacing: 0.1 },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.streakOr,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
    shadowColor: C.streakOr, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30, shadowRadius: 8, elevation: 3,
  },
  streakFire: { fontSize: 12 },
  streakNum:  { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.1 },

  // Main greeting block
  greetBlock: { paddingRight: 160 },
  greetTitle: {
    fontSize: 24, fontWeight: '800', color: C.textDark,
    letterSpacing: -0.3, lineHeight: 29, marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  greetSub: {
    fontSize: 13, fontWeight: '500',
    color: 'rgba(30,60,40,0.58)', marginBottom: 12, lineHeight: 18,
  },

  // Level XP bar
  levelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12,
  },
  levelLbl: {
    fontSize: 11, fontWeight: '800', color: 'rgba(20,50,30,0.65)', minWidth: 34,
  },
  levelBarTrack: {
    flex: 1, maxWidth: 100, height: 7, borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.10)', overflow: 'hidden',
  },
  levelBarFill: { height: 7, borderRadius: 999, backgroundColor: C.primaryDk },
  levelPct: {
    fontSize: 10, fontWeight: '600',
    color: 'rgba(20,50,30,0.46)', flex: 1, textAlign: 'right',
  },

  // Child switcher pill
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10, shadowRadius: 10, elevation: 5,
  },
  pillEmoji: { fontSize: 15, lineHeight: 19 },
  pillText:  { fontSize: 13, fontWeight: '700', color: C.textDark, lineHeight: 19 },
  pillChev:  { fontSize: 12, fontWeight: '900', color: C.textMid, lineHeight: 19 },

  // Hero mascot — anchored so feet sit at the bottom of the hero (touching the white panel)
  heroImgWrap: {
    position: 'absolute',
    right: -8,
    bottom: -20,
    width: 210,
    height: 250,
    zIndex: 10,
  },
  heroImg: { width: 210, height: 250 },

  // Dropdown — full-width, anchored below pill
  dropdown: {
    position: 'absolute',
    top: 202,                      // just below the pill button
    left: SIDE,
    right: SIDE,
    backgroundColor: C.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 24,
    zIndex: 50,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  dropHeader: {
    fontSize: 11, fontWeight: '700', color: C.textLight,
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  dropRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  dropRowActive: { backgroundColor: '#F0FBF5' },
  dropAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  dropAvatarImg: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  dropAvatarImgSrc: { width: 48, height: 48 },
  dropEmoji:      { fontSize: 24 },
  dropInfo:       { flex: 1 },
  dropName:       { fontSize: 15, fontWeight: '800', color: C.textDark },
  dropNameActive: { color: C.primaryDk },
  dropSub:        { fontSize: 11, fontWeight: '600', color: C.textLight, marginTop: 1 },
  dropCheckBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  dropCheckTxt: { fontSize: 13, fontWeight: '900', color: C.white },

  // ── White panel — floating bottom-sheet
  panel: {
    marginTop: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SIDE,
    paddingTop: 10,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 18,
    zIndex: 10,
    minHeight: 600,
  },
  dragHandle: {
    width: 44, height: 5, borderRadius: 999,
    backgroundColor: '#D4D4D4',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  // ── Progress card ──
  progressCard: {
    flexDirection: 'row',
    backgroundColor: '#FAFFFE',
    borderRadius: 28, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(120,215,154,0.18)',
    shadowColor: '#78D79A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 6,
  },
  progressLeft:  { flex: 1, paddingRight: 14 },
  progressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  progressTitle: { fontSize: 10, fontWeight: '700', color: C.primaryDk, letterSpacing: 0.8, textTransform: 'uppercase' },
  progressDayBadge: {
    backgroundColor: C.cardMint, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  progressDayBadgeTxt: { fontSize: 10, fontWeight: '700', color: C.primaryDk },
  progressScore: {
    fontSize: 44, fontWeight: '900', color: C.textDark,
    lineHeight: 48, letterSpacing: -2, marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  progressSub:  { fontSize: 13, fontWeight: '500', color: C.textMid, marginBottom: 10, lineHeight: 19 },
  progressMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  metaDot:      { width: 8, height: 8, borderRadius: 4 },
  metaText:     { fontSize: 12, fontWeight: '600', color: C.textMid },
  nextGoalBtn:  {
    backgroundColor: C.primary, borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 14, elevation: 5,
  },
  nextGoalText: { fontSize: 12, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  progressRight: { alignItems: 'center', justifyContent: 'center', gap: 10 },

  // ProgressRing
  ringWrap:   { alignItems: 'center', gap: 8 },
  ringOuter:  { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringPct:    {
    fontSize: 19, fontWeight: '900', color: C.textDark, lineHeight: 23,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  ringLabel:  { fontSize: 9, fontWeight: '700', color: C.textLight, letterSpacing: 0.3 },
  ringDots: { flexDirection: 'row', gap: 6 },
  ringDot:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ringDotIcon: { fontSize: 14 },

  // ── Section headers ──
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14, marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: C.textDark, letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  sectionLink: { fontSize: 13, fontWeight: '700', color: C.primary },
  sectionHint: { fontSize: 11, fontWeight: '600', color: C.textLight, letterSpacing: 0.1 },

  // ── Habit grid ──
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: 24 },

  // Card outer
  cardOuter: {
    width: CARD_W,
    height: CARD_W + 12 + 5,
    position: 'relative',
  },
  // Soft colored slab below card
  card3dBase: {
    position: 'absolute',
    bottom: 0, left: 4, right: 4,
    height: CARD_W + 12,
    borderRadius: 28, opacity: 0.40,
  },
  // Card shadow
  cardShadow: {
    width: CARD_W,
    height: CARD_W + 12,
    borderRadius: 28,
    backgroundColor: C.white,
    shadowColor: '#24323D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    width: CARD_W,
    height: CARD_W + 12,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 12,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.70)',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },

  // Done badge
  doneCheck: {
    position: 'absolute', top: 10, right: 10, zIndex: 5,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  doneCheckTxt: { fontSize: 12, fontWeight: '900', color: C.white },

  // % badge
  pctBadge: {
    position: 'absolute', top: 10, left: 10, zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pctBadgeTxt: { fontSize: 10, fontWeight: '800', color: C.white, letterSpacing: 0.2 },

  // Card image
  cardImgWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 0 },
  cardImg:     { width: CARD_W * 0.80, height: CARD_W * 0.80, marginBottom: -14 },

  // Card bottom
  cardBottom: { gap: 4, paddingTop: 2 },
  cardTitle: {
    fontSize: 13, fontWeight: '800', letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  cardSub:   { fontSize: 11, fontWeight: '500', color: C.textMid, lineHeight: 14 },
  barRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  barTrack:  {
    flex: 1, height: 8, borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.10)', overflow: 'hidden',
  },
  barFill:   { height: '100%', borderRadius: 999, backgroundColor: C.barFill },
  cardEmoji: { fontSize: 14, lineHeight: 17 },

  // ── XP / Rewards card ──
  xpCard: {
    backgroundColor: '#FFFDF0', borderRadius: 28, padding: 18,
    borderWidth: 1, borderColor: 'rgba(246,215,119,0.35)',
    marginBottom: 16,
    shadowColor: '#F6D777', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 4,
  },
  xpCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  xpCardLabel: { fontSize: 14, fontWeight: '800', color: '#7A5500', letterSpacing: -0.1 },
  xpCardNext:  { fontSize: 11, fontWeight: '600', color: '#B08020' },
  xpBarTrack:  {
    height: 12, borderRadius: 999,
    backgroundColor: '#EDE0A0', overflow: 'hidden', marginBottom: 16,
  },
  xpBarFill:   { height: '100%', borderRadius: 999, backgroundColor: '#F6D777' },
  badgesRow:   { marginHorizontal: -4 },
  badge: {
    alignItems: 'center', gap: 4,
    backgroundColor: C.white, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    minWidth: 64,
  },
  badgeLocked:      { backgroundColor: '#F3F3F3', opacity: 0.60 },
  badgeIcon:        { fontSize: 26 },
  badgeLabel:       { fontSize: 10, fontWeight: '700', color: C.textMid, textAlign: 'center', lineHeight: 13 },
  badgeLabelLocked: { color: C.textLight },

  // ── Streak card ──
  streakCard: {
    backgroundColor: '#FFF5EE',
    borderRadius: 28, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,161,75,0.15)',
    shadowColor: C.streakOr, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 16, elevation: 3,
  },
  streakCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  streakCardTitle: {
    fontSize: 16, fontWeight: '800', color: C.streakOr,
    marginBottom: 4, letterSpacing: -0.2,
  },
  streakCardSub: { fontSize: 12, fontWeight: '500', color: C.textMid, lineHeight: 17 },
  streakFlame: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.streakOr, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, minWidth: 58,
    shadowColor: C.streakOr, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30, shadowRadius: 10, elevation: 4,
  },
  streakFlameNum: { fontSize: 24, fontWeight: '900', color: C.white, lineHeight: 28 },
  streakFlameLbl: {
    fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // Compat stubs
  streakBanner: { flexDirection: 'row' },
  streakBannerIcon:  { fontSize: 28 },
  streakBannerTitle: { fontSize: 15, fontWeight: '900', color: C.streakOr },
  streakBannerSub:   { fontSize: 11, fontWeight: '600', color: C.textMid },

  // Weekday tracker
  streakDotsRow: { flexDirection: 'row', gap: 5, justifyContent: 'space-between' },
  streakDot: {
    flex: 1, height: 36, borderRadius: 14,
    backgroundColor: '#EDE5DF',
    alignItems: 'center', justifyContent: 'center',
  },
  streakDotOn:    {
    backgroundColor: C.streakOr,
    shadowColor: C.streakOr, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  streakDotToday: {
    backgroundColor: 'rgba(255,161,75,0.15)',
    borderWidth: 2, borderColor: C.streakOr,
  },
  streakDotL:     { fontSize: 11, fontWeight: '700', color: C.textLight },
  streakDotLOn:   { color: C.white },
  streakDotCheck: { fontSize: 14, fontWeight: '900', color: C.white },
  streakDotTodayL:{ color: C.streakOr, fontWeight: '800' },

  // ── Tips ──
  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 24, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  tipIconWrap: {
    width: 46, height: 46, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  tipIcon: { fontSize: 22 },
  tipText: { fontSize: 13, fontWeight: '500', color: C.textDark, lineHeight: 19 },
});
