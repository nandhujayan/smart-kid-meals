import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  Animated, Platform, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getSavedMeals, getChildProfiles, Meal, ChildProfile } from '../../lib/meal-data';
import { loadDailyLog, GOALS, DailyLog } from '../../lib/daily-log';

const SIDE = 16;

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:         '#F7F8F5',
  white:      '#FFFFFF',
  primary:    '#59D487',
  primaryDk:  '#38A860',
  textDark:   '#24323D',
  textMid:    '#718096',
  textLight:  '#9AAAB8',
  cardMint:   '#DFF5E7',
  cardSky:    '#C9E4FF',
  cardLav:    '#DCCEFF',
  cardPeach:  '#FFE8CC',
  yellow:     '#FFE67A',
  yellowSoft: '#FFF3C7',
  orange:     '#FFA34D',
  success:    '#4CCB73',
};

// ── Avatar pools (mirrors child.tsx) ──────────────────────────────────────────
const BOY_AVATARS = [
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
function getAvatar(gender: 'boy' | 'girl' | undefined, idx: number) {
  if (gender === 'girl') return GIRL_AVATARS[idx % GIRL_AVATARS.length];
  return BOY_AVATARS[idx % BOY_AVATARS.length];
}
function getAccentColor(gender: 'boy' | 'girl' | undefined) {
  return gender === 'girl' ? '#E8559A' : '#5DC98A';
}
function getHeroBg(gender: 'boy' | 'girl' | undefined) {
  return gender === 'girl' ? '#FFD6E8' : '#B8E8D0';
}

const MEAL_SECTIONS = [
  { type: 'breakfast', label: 'Breakfast', emoji: '☀️', color: C.cardMint,  border: '#B8EAC8' },
  { type: 'lunch',     label: 'Lunch',     emoji: '🥗', color: C.cardSky,   border: '#A8D4F8' },
  { type: 'snack',     label: 'Snack',     emoji: '🍎', color: C.cardPeach, border: '#F5D0A8' },
  { type: 'dinner',    label: 'Dinner',    emoji: '🌙', color: C.cardLav,   border: '#C4B0F0' },
];

// Estimate daily calorie goal from child profile age
function calorieGoalForAge(age: string): number {
  const a = parseInt(age) || 6;
  if (a <= 3)  return 1000;
  if (a <= 5)  return 1200;
  if (a <= 8)  return 1400;
  if (a <= 11) return 1600;
  return 1800;
}

// Estimate macros (rough %)
function macroGoals(kcal: number) {
  return {
    protein: Math.round((kcal * 0.20) / 4),
    carbs:   Math.round((kcal * 0.50) / 4),
    fats:    Math.round((kcal * 0.30) / 9),
  };
}

export default function MealsScreen() {
  const router = useRouter();
  const [meals, setMeals]         = useState<Meal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [profiles, setProfiles]   = useState<ChildProfile[]>([]);
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [dailyLog, setDailyLog]   = useState<DailyLog | null>(null);
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());
  const barAnim = useRef(new Animated.Value(0)).current;

  // Load profiles + meals on mount
  useEffect(() => {
    async function init() {
      const [data, mealData] = await Promise.all([getChildProfiles(), getSavedMeals()]);
      setProfiles(data);
      const first = data[0]?.id ?? null;
      setActiveId(first);
      setMeals(mealData);
      setLoading(false);
      Animated.timing(barAnim, { toValue: 1, duration: 900, useNativeDriver: false }).start();
    }
    init();
  }, []);

  // Load daily log when active profile changes
  useEffect(() => {
    if (!activeId) return;
    loadDailyLog(activeId).then(setDailyLog);
  }, [activeId]);

  const activeProfile  = profiles.find(p => p.id === activeId);
  const isGirl         = activeProfile?.gender === 'girl';
  const accent         = getAccentColor(activeProfile?.gender);
  const accentLight    = getHeroBg(activeProfile?.gender);
  const childName      = activeProfile?.name ?? 'Your child';
  const caloriesGoal   = calorieGoalForAge(activeProfile?.age ?? '7');
  const macros         = macroGoals(caloriesGoal);
  // Estimate calories from logged meals count (3 meals * avg ~420 kcal)
  const mealsLogged    = dailyLog?.mealsLogged ?? 0;
  const caloriesLogged = Math.min(caloriesGoal, mealsLogged * Math.round(caloriesGoal / 3));
  const calPct         = Math.min(100, Math.round((caloriesLogged / caloriesGoal) * 100));
  const calRemaining   = Math.max(0, caloriesGoal - caloriesLogged);

  function getMealsForSection(type: string): Meal[] {
    return meals.filter(m => m.mealType?.toLowerCase() === type).slice(0, 2);
  }

  function handleLogMeal(meal: Meal) {
    setLoggedIds(prev => {
      const next = new Set(prev);
      next.has(meal.id) ? next.delete(meal.id) : next.add(meal.id);
      return next;
    });
  }

  const ovMicro =
    calPct >= 90 ? `${childName} is doing amazing today 🌟` :
    calPct >= 50 ? `Healthy balance achieved 👏` :
    `Let's build healthy habits for ${childName} 🚀`;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>Yummy Meals 🥗</Text>
            <Text style={s.headerSub}>Personalized nutrition for healthy growth</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.actionPill}
              onPress={() => router.push('/scanner' as any)}
              activeOpacity={0.82}
            >
              <Text style={s.actionIcon}>📷</Text>
              <Text style={s.actionTxt}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.actionPill}
              onPress={() => router.push('/planner' as any)}
              activeOpacity={0.82}
            >
              <Text style={s.actionIcon}>🗓️</Text>
              <Text style={s.actionTxt}>Planner</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CHILD PROFILE SELECTOR ── */}
        {profiles.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.profileRow}>
            {profiles.map((p, i) => {
              const active  = p.id === activeId;
              const ac      = getAccentColor(p.gender);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[s.profileCard, active && { borderColor: ac, borderWidth: 2.5 }]}
                  onPress={() => setActiveId(p.id)}
                  activeOpacity={0.85}
                >
                  <View style={[s.profileAvatarWrap, { backgroundColor: getHeroBg(p.gender) }]}>
                    <Image source={getAvatar(p.gender, i)} style={s.profileAvatarImg} resizeMode="contain" />
                  </View>
                  <Text style={[s.profileName, active && { color: ac }]} numberOfLines={1}>{p.name}</Text>
                  {active && <View style={[s.profileDot, { backgroundColor: ac }]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── WELLNESS OVERVIEW CARD ── */}
        <View style={s.overviewCard}>
          {/* Top row */}
          <View style={s.ovTopRow}>
            <View style={s.ovLeft}>
              <Text style={s.ovLabel}>DAILY GOAL · {caloriesGoal} KCAL</Text>
              <View style={s.ovAmountRow}>
                <Text style={s.ovValue}>{calRemaining}</Text>
                <Text style={s.ovUnit}> kcal left</Text>
                <View style={[s.ovPctInline, { backgroundColor: accentLight }]}>
                  <Text style={[s.ovPctInlineTxt, { color: accent }]}>{calPct}%</Text>
                </View>
              </View>
              <Text style={[s.ovMicro, { color: accent }]}>{ovMicro}</Text>
            </View>
            <View style={s.ovRight}>
              <View style={[s.wellnessCircle, { borderColor: accent }]}>
                <Text style={s.wellnessScore}>{Math.round(calPct * 0.9)}</Text>
                <Text style={s.wellnessLbl}>score</Text>
              </View>
            </View>
          </View>

          {/* Segmented calorie bar */}
          <Animated.View style={s.barTrack}>
            <Animated.View style={[s.barSeg, {
              width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.round(calPct * 0.45)}%`] }),
              backgroundColor: C.success,
            }]} />
            <Animated.View style={[s.barSeg, {
              width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.round(calPct * 0.30)}%`] }),
              backgroundColor: '#78B4F8',
            }]} />
            <Animated.View style={[s.barSeg, {
              width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.round(calPct * 0.20)}%`] }),
              backgroundColor: '#FFD066',
            }]} />
          </Animated.View>
          <View style={s.barLegend}>
            <Text style={s.legendDot}>🟢 Protein</Text>
            <Text style={s.legendDot}>🔵 Carbs</Text>
            <Text style={s.legendDot}>🟡 Fats</Text>
          </View>

          {/* Macro + wellness summary row */}
          <View style={s.macroSummaryRow}>
            {[
              { emoji: '💪', val: `${macros.protein}g`, lbl: 'Protein' },
              { emoji: '🌾', val: `${macros.carbs}g`,   lbl: 'Carbs'   },
              { emoji: '🥑', val: `${macros.fats}g`,    lbl: 'Fats'    },
              { emoji: '💧', val: `${dailyLog?.waterCups ?? 0}/${GOALS.water}`,  lbl: 'Water' },
              { emoji: '😴', val: `${dailyLog?.sleepHours ?? 0}h`,  lbl: 'Sleep' },
            ].map((item, i, arr) => (
              <React.Fragment key={item.lbl}>
                <View style={s.macroSummaryItem}>
                  <Text style={s.macroSummaryEmoji}>{item.emoji}</Text>
                  <Text style={s.macroSummaryVal}>{item.val}</Text>
                  <Text style={s.macroSummaryLbl}>{item.lbl}</Text>
                </View>
                {i < arr.length - 1 && <View style={s.macroSummaryDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── MEAL JOURNEY ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Today's Meal Journey</Text>
          <Text style={s.sectionSub}>{mealsLogged}/{GOALS.meals} meals logged</Text>
        </View>

        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loaderTxt}>Loading meals…</Text>
          </View>
        ) : (
          MEAL_SECTIONS.map(sec => {
            const sectionMeals = getMealsForSection(sec.type);
            return (
              <View key={sec.type} style={s.journeySection}>
                {/* Section header */}
                <View style={s.journeyHead}>
                  <View style={[s.journeyHeadLeft, { backgroundColor: sec.color }]}>
                    <Text style={s.journeyEmoji}>{sec.emoji}</Text>
                    <Text style={s.journeyLabel}>{sec.label}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/generate' as any)}
                    activeOpacity={0.75}
                    style={s.journeyAddBtn}
                  >
                    <Text style={[s.journeyAddTxt, { color: accent }]}>+ Add</Text>
                  </TouchableOpacity>
                </View>

                {/* Meal cards for this section */}
                {sectionMeals.length === 0 ? (
                  <TouchableOpacity
                    style={[s.emptySlot, { borderColor: sec.border, backgroundColor: sec.color }]}
                    onPress={() => router.push('/generate' as any)}
                    activeOpacity={0.80}
                  >
                    <Text style={s.emptySlotEmoji}>{sec.emoji}</Text>
                    <Text style={s.emptySlotTxt}>Tap to plan {sec.label.toLowerCase()}</Text>
                  </TouchableOpacity>
                ) : (
                  sectionMeals.map(meal => {
                    const done = loggedIds.has(meal.id);
                    return (
                      <TouchableOpacity
                        key={meal.id}
                        style={[s.mealCard, { backgroundColor: sec.color, borderColor: sec.border }, done && s.mealCardDone]}
                        activeOpacity={0.88}
                        onPress={() => router.push({ pathname: '/meal-result', params: { mealData: JSON.stringify(meal) } })}
                      >
                        {/* Top row */}
                        <View style={s.mealTopRow}>
                          <View style={s.mealTypeChip}>
                            <Text style={s.mealTypeEmoji}>{sec.emoji}</Text>
                            <Text style={s.mealTypeTxt}>{sec.label}</Text>
                          </View>
                          {meal.isAI && (
                            <View style={[s.aiBadge, { backgroundColor: accentLight }]}>
                              <Text style={[s.aiBadgeTxt, { color: accent }]}>✨ AI Pick</Text>
                            </View>
                          )}
                          {done && (
                            <View style={s.doneBadge}>
                              <Text style={s.doneBadgeTxt}>✅ Logged</Text>
                            </View>
                          )}
                        </View>

                        {/* Title + calories */}
                        <Text style={s.mealName} numberOfLines={2}>{meal.mealName}</Text>
                        {meal.nutrition?.calories ? (
                          <Text style={s.mealCal}>{meal.nutrition.calories} kcal · {meal.cookingTime}</Text>
                        ) : null}

                        {/* Macros inline */}
                        <Text style={s.macroInline}>
                          💪 {meal.nutrition?.protein ?? '—'}g{'\u2003'}
                          🌾 {meal.nutrition?.carbs ?? '—'}g{'\u2003'}
                          🥑 {meal.nutrition?.fats ?? '—'}g
                        </Text>

                        {/* CTA */}
                        <TouchableOpacity
                          style={[s.addMealBtn, done && { backgroundColor: C.success }]}
                          onPress={() => handleLogMeal(meal)}
                          activeOpacity={0.80}
                        >
                          <Text style={[s.addMealBtnTxt, done && { color: C.white }]}>
                            {done ? '✅ Logged!' : '🍽 Log This Meal'}
                          </Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            );
          })
        )}

        {/* ── AI COMPANION CARD ── */}
        <View style={[s.aiCard, { borderColor: isGirl ? '#F9A8D4' : '#C4B5FD' }]}>
          <View style={s.aiTopRow}>
            <View style={[s.aiIconWrap, { backgroundColor: accentLight }]}>
              <Text style={s.aiEmoji}>🤖</Text>
            </View>
            <View style={s.aiContent}>
              <View style={[s.aiLiveBadge, { backgroundColor: accentLight }]}>
                <Text style={[s.aiLiveTxt, { color: accent }]}>AI Powered ✨</Text>
              </View>
              <Text style={s.aiTitle}>Smart Meal Planner</Text>
            </View>
          </View>
          <Text style={s.aiInsight}>
            {calPct < 50
              ? `${childName} needs more nutrition today 💪 — let's generate a healthy meal plan!`
              : `${childName} is on track! Generate tomorrow's meals to stay consistent 🌟`}
          </Text>
          <TouchableOpacity
            style={[s.aiBtn, { backgroundColor: accent }]}
            onPress={() => router.push('/generate' as any)}
            activeOpacity={0.82}
          >
            <Text style={s.aiBtnTxt}>Generate Smart Meal Plan ✨</Text>
          </TouchableOpacity>
        </View>

        {/* ── GAMIFICATION STREAK CARD ── */}
        <View style={s.streakCard}>
          <Text style={s.streakEmoji}>🔥</Text>
          <View style={s.streakInfo}>
            <Text style={s.streakTitle}>Healthy Eating Streak</Text>
            <Text style={s.streakSub}>{mealsLogged >= GOALS.meals ? 'Meal goal completed today! 🥗' : `${GOALS.meals - mealsLogged} more meal${GOALS.meals - mealsLogged !== 1 ? 's' : ''} to complete today`}</Text>
          </View>
          <View style={[s.streakBadge, { backgroundColor: accentLight }]}>
            <Text style={[s.streakBadgeTxt, { color: accent }]}>{mealsLogged >= GOALS.meals ? '🏆' : `${mealsLogged}/${GOALS.meals}`}</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 24 },

  // ── Header ──
  header: {
    paddingHorizontal: SIDE,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flex: 1, paddingRight: 14 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: C.textDark, letterSpacing: -0.3, marginBottom: 4 },
  headerSub:   { fontSize: 13, fontWeight: '500', color: C.textMid, lineHeight: 19 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.white, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  actionIcon: { fontSize: 13 },
  actionTxt:  { fontSize: 12, fontWeight: '600', color: C.textMid },

  // ── Child profile selector ──
  profileRow: { paddingHorizontal: SIDE, gap: 12, marginBottom: 16, paddingVertical: 4 },
  profileCard: {
    width: 80, alignItems: 'center', gap: 6,
    borderRadius: 20, padding: 8,
    backgroundColor: C.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    borderWidth: 2, borderColor: 'transparent',
  },
  profileAvatarWrap: {
    width: 56, height: 56, borderRadius: 28,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarImg: { width: 56, height: 56 },
  profileName:      { fontSize: 11, fontWeight: '700', color: '#4A5568', textAlign: 'center' },
  profileDot:       { width: 6, height: 6, borderRadius: 3 },

  // ── Wellness overview card ──
  overviewCard: {
    marginHorizontal: SIDE, marginBottom: 16,
    backgroundColor: C.white, borderRadius: 28, padding: 20,
    borderWidth: 1, borderColor: '#EAECE8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 14, elevation: 3,
  },
  ovTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  ovLeft:      { flex: 1 },
  ovRight:     { alignItems: 'center', justifyContent: 'center' },
  ovLabel:     { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.5, marginBottom: 6 },
  ovAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ovValue:     { fontSize: 34, fontWeight: '800', color: C.textDark, letterSpacing: -1.5, lineHeight: 40 },
  ovUnit:      { fontSize: 14, fontWeight: '600', color: C.textMid, paddingBottom: 2 },
  ovPctInline: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  ovPctInlineTxt:{ fontSize: 11, fontWeight: '700' },
  ovMicro:     { fontSize: 12, fontWeight: '600', lineHeight: 17 },
  wellnessCircle: {
    width: 62, height: 62, borderRadius: 31,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  wellnessScore: { fontSize: 18, fontWeight: '800', color: C.textDark },
  wellnessLbl:   { fontSize: 8, fontWeight: '600', color: C.textLight },

  barTrack: {
    height: 9, borderRadius: 999, backgroundColor: '#EDEEED',
    flexDirection: 'row', overflow: 'hidden', marginBottom: 6,
  },
  barSeg:    { height: '100%', borderRadius: 999 },
  barLegend: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  legendDot: { fontSize: 10, fontWeight: '500', color: C.textLight },

  macroSummaryRow:     { flexDirection: 'row', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F2F3F0' },
  macroSummaryItem:    { flex: 1, alignItems: 'center', gap: 3 },
  macroSummaryEmoji:   { fontSize: 14 },
  macroSummaryVal:     { fontSize: 12, fontWeight: '700', color: C.textDark },
  macroSummaryLbl:     { fontSize: 9, fontWeight: '500', color: C.textLight },
  macroSummaryDivider: { width: 1, height: 28, backgroundColor: '#EBEBEA' },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'baseline',
    paddingHorizontal: SIDE, marginBottom: 12, gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textDark },
  sectionSub:   { fontSize: 12, fontWeight: '500', color: C.textLight },

  // ── Meal journey sections ──
  journeySection: { marginHorizontal: SIDE, marginBottom: 16 },
  journeyHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  journeyHeadLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
  },
  journeyEmoji: { fontSize: 15 },
  journeyLabel: { fontSize: 13, fontWeight: '700', color: C.textDark },
  journeyAddBtn:{ paddingHorizontal: 10, paddingVertical: 5 },
  journeyAddTxt:{ fontSize: 12, fontWeight: '700' },

  emptySlot: {
    borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed',
    paddingVertical: 18, alignItems: 'center', gap: 6,
  },
  emptySlotEmoji: { fontSize: 24 },
  emptySlotTxt:   { fontSize: 12, fontWeight: '600', color: C.textMid },

  // ── Meal cards ──
  mealCard: {
    borderRadius: 24, padding: 16, borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  mealCardDone: { opacity: 0.80 },
  mealTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  mealTypeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  mealTypeEmoji: { fontSize: 12 },
  mealTypeTxt:   { fontSize: 11, fontWeight: '600', color: C.textDark },
  aiBadge:       { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  aiBadgeTxt:    { fontSize: 10, fontWeight: '700' },
  doneBadge:     { backgroundColor: '#DCFCE7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  doneBadgeTxt:  { fontSize: 10, fontWeight: '700', color: '#166534' },
  mealName:  { fontSize: 16, fontWeight: '700', color: C.textDark, letterSpacing: -0.2, lineHeight: 21, marginBottom: 3 },
  mealCal:   { fontSize: 11, fontWeight: '500', color: C.textMid, marginBottom: 8 },
  macroInline: { fontSize: 11, fontWeight: '500', color: C.textMid, lineHeight: 18, marginBottom: 12 },
  addMealBtn: {
    backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 14,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
  },
  addMealBtnTxt: { fontSize: 13, fontWeight: '700', color: C.primaryDk },

  // ── AI companion card ──
  aiCard: {
    marginHorizontal: SIDE, marginBottom: 12,
    backgroundColor: C.white, borderRadius: 28, padding: 20,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    gap: 12,
  },
  aiTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  aiContent:  { flex: 1 },
  aiLiveBadge:{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4 },
  aiLiveTxt:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  aiEmoji:    { fontSize: 24 },
  aiTitle:    { fontSize: 15, fontWeight: '700', color: C.textDark, letterSpacing: -0.1 },
  aiInsight:  { fontSize: 13, fontWeight: '500', color: C.textMid, lineHeight: 19 },
  aiBtn:      { borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  aiBtnTxt:   { fontSize: 14, fontWeight: '800', color: C.white },

  // ── Streak gamification card ──
  streakCard: {
    marginHorizontal: SIDE, marginBottom: 12,
    backgroundColor: C.white, borderRadius: 24, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#F0EEE8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  streakEmoji: { fontSize: 32 },
  streakInfo:  { flex: 1 },
  streakTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  streakSub:   { fontSize: 11, fontWeight: '500', color: C.textMid },
  streakBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, minWidth: 44, alignItems: 'center' },
  streakBadgeTxt: { fontSize: 13, fontWeight: '800' },

  // ── Loader / Empty ──
  loader:    { paddingVertical: 48, alignItems: 'center' },
  loaderTxt: { fontSize: 13, fontWeight: '600', color: C.textMid, marginTop: 12 },
});

