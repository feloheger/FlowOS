import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HABITS: 'flowos_habits',
  PROJECTS: 'flowos_projects',
  GOALS: 'flowos_goals',
  APP_LIMITS: 'flowos_app_limits',
  APP_USAGE: 'flowos_app_usage',
  LAST_RESET: 'flowos_last_reset',
  ENERGY: 'flowos_energy',
  TASKS: 'flowos_tasks',
};

// ─── Generic ─────────────────────────────────────────────────────────────────
export async function saveData(key, data) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

export async function loadData(key, fallback = null) {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    console.error('Storage load error:', e);
    return fallback;
  }
}

// ─── Habits ──────────────────────────────────────────────────────────────────
export const saveHabits = (habits) => saveData(KEYS.HABITS, habits);
export const loadHabits = () => loadData(KEYS.HABITS, []);

// ─── Projects ────────────────────────────────────────────────────────────────
export const saveProjects = (projects) => saveData(KEYS.PROJECTS, projects);
export const loadProjects = () => loadData(KEYS.PROJECTS, []);

// ─── Goals ───────────────────────────────────────────────────────────────────
export const saveGoals = (goals) => saveData(KEYS.GOALS, goals);
export const loadGoals = () => loadData(KEYS.GOALS, []);

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const saveTasks = (tasks) => saveData(KEYS.TASKS, tasks);
export const loadTasks = () => loadData(KEYS.TASKS, []);

// ─── Energy ──────────────────────────────────────────────────────────────────
export const saveEnergy = (val) => saveData(KEYS.ENERGY, val);
export const loadEnergy = () => loadData(KEYS.ENERGY, 3);

// ─── App Limits ──────────────────────────────────────────────────────────────
export const saveAppLimits = (limits) => saveData(KEYS.APP_LIMITS, limits);
export const loadAppLimits = () => loadData(KEYS.APP_LIMITS, null);

export const saveAppUsage = (usage) => saveData(KEYS.APP_USAGE, usage);
export const loadAppUsage = () => loadData(KEYS.APP_USAGE, {});

export const saveLastReset = (date) => saveData(KEYS.LAST_RESET, date);
export const loadLastReset = () => loadData(KEYS.LAST_RESET, null);

// ─── Daily Reset Check ───────────────────────────────────────────────────────
export async function checkAndResetDaily() {
  const today = new Date().toDateString();
  const lastReset = await loadLastReset();

  if (lastReset !== today) {
    // New day - reset app usage and habit completedToday
    await saveAppUsage({});
    await saveLastReset(today);

    // Reset habits completedToday
    const habits = await loadHabits();
    if (habits.length > 0) {
      const reset = habits.map(h => ({
        ...h,
        completedToday: false,
        weekLog: h.weekLog ? [...h.weekLog.slice(1), false] : [false,false,false,false,false,false,false],
      }));
      await saveHabits(reset);
    }

    return true; // was reset
  }
  return false;
}
