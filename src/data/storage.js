import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  XP: 'flowos_xp',
  SUBSCRIPTION: 'flowos_subscription',
  APP_LIMITS: 'flowos_app_limits',
  APP_USAGE: 'flowos_app_usage',
  LAST_RESET: 'flowos_last_reset',
  HABITS: 'flowos_habits',
  PROJECTS: 'flowos_projects',
  GOALS: 'flowos_goals',
  TASKS: 'flowos_tasks',
  ENERGY: 'flowos_energy',
  SETTINGS: 'flowos_settings',
};

export async function saveData(key, data) {
  try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
}
export async function loadData(key, fallback = null) {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) { return fallback; }
}

// XP
export const loadXP = () => loadData(KEYS.XP, 0);
export const saveXP = (xp) => saveData(KEYS.XP, xp);

export async function addXP(amount) {
  const sub = await loadSubscription();
  const multiplier = sub?.active ? 2 : 1;
  const current = await loadXP();
  const earned = amount * multiplier;
  await saveXP(current + earned);
  return { newTotal: current + earned, earned, multiplier };
}

// Subscription
export const loadSubscription = () => loadData(KEYS.SUBSCRIPTION, { active: false });
export const saveSubscription = (sub) => saveData(KEYS.SUBSCRIPTION, sub);
export async function activateSubscription() {
  const sub = { active: true, activatedAt: new Date().toISOString() };
  await saveSubscription(sub);
  return sub;
}
export async function cancelSubscription() {
  const sub = { active: false };
  await saveSubscription(sub);
  return sub;
}

// App Limits
export const loadAppLimits = () => loadData(KEYS.APP_LIMITS, null);
export const saveAppLimits = (limits) => saveData(KEYS.APP_LIMITS, limits);
export const loadAppUsage = () => loadData(KEYS.APP_USAGE, {});
export const saveAppUsage = (usage) => saveData(KEYS.APP_USAGE, usage);

export async function extendAppLimit(appId, minutesToAdd = 30) {
  const COST = 60;
  const currentXP = await loadXP();
  if (currentXP < COST) return { success: false, reason: 'not_enough_xp', currentXP, cost: COST };
  await saveXP(currentXP - COST);
  const usage = await loadAppUsage();
  usage[`${appId}_offset`] = (usage[`${appId}_offset`] || 0) + minutesToAdd;
  await saveAppUsage(usage);
  return { success: true, newXP: currentXP - COST, minutesAdded: minutesToAdd };
}

// Daily Reset
export async function checkAndResetDaily() {
  const today = new Date().toDateString();
  const lastReset = await loadData(KEYS.LAST_RESET, null);
  if (lastReset !== today) {
    await saveAppUsage({});
    await saveData(KEYS.LAST_RESET, today);
    const habits = await loadData(KEYS.HABITS, []);
    if (habits.length > 0) {
      const reset = habits.map(h => ({
        ...h, completedToday: false,
        weekLog: h.weekLog ? [...h.weekLog.slice(1), false] : [false,false,false,false,false,false,false],
      }));
      await saveData(KEYS.HABITS, reset);
    }
    return true;
  }
  return false;
}

export const saveHabits = (h) => saveData(KEYS.HABITS, h);
export const loadHabits = () => loadData(KEYS.HABITS, []);
export const saveProjects = (p) => saveData(KEYS.PROJECTS, p);
export const loadProjects = () => loadData(KEYS.PROJECTS, []);
export const saveGoals = (g) => saveData(KEYS.GOALS, g);
export const loadGoals = () => loadData(KEYS.GOALS, []);
export const saveTasks = (t) => saveData(KEYS.TASKS, t);
export const loadTasks = () => loadData(KEYS.TASKS, []);
export const saveEnergy = (v) => saveData(KEYS.ENERGY, v);
export const loadEnergy = () => loadData(KEYS.ENERGY, 3);
