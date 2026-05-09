/**
 * Shared daily log helpers — used by homepage AND all detail screens.
 * All screens read/write the SAME AsyncStorage key: log_${childId}_${date}
 * so progress is always in sync.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyLog {
  childId:      string;
  date:         string;   // "YYYY-MM-DD"
  mealsLogged:  number;   // goal: 3
  waterCups:    number;   // goal: 8
  activityMins: number;   // goal: 60
  sleepHours:   number;   // goal: 9
  lastUpdated:  string;
}

export const GOALS = { meals: 3, water: 8, activity: 60, sleep: 9 };

export const XP_PER_HABIT = { meals: 30, water: 20, activity: 25, sleep: 20 };

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function logKey(childId: string, date: string): string {
  return `log_${childId}_${date}`;
}

export async function loadDailyLog(childId: string): Promise<DailyLog> {
  const today = todayStr();
  const raw   = await AsyncStorage.getItem(logKey(childId, today));
  if (raw) return JSON.parse(raw) as DailyLog;
  return {
    childId, date: today,
    mealsLogged: 0, waterCups: 0, activityMins: 0, sleepHours: 0,
    lastUpdated: today,
  };
}

export async function saveDailyLog(log: DailyLog): Promise<void> {
  await AsyncStorage.setItem(logKey(log.childId, log.date), JSON.stringify({
    ...log, lastUpdated: todayStr(),
  }));
}
