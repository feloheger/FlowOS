import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, Animated, TextInput, Alert, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, FadeIn, ProgressBar } from '../components/UI';
import { saveHabits, loadHabits, checkAndResetDaily, addXP, loadXP, loadSubscription } from '../data/storage';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const HABIT_CATEGORIES = ['all', 'health', 'fitness', 'learning', 'social', 'mindset', 'finance', 'creative', 'productivity'];

const HABIT_TEMPLATES = [
  // 🏃 Fitness
  { id: 'run', name: 'Running', icon: '🏃', color: '#FF6B6B', category: 'fitness', verifyType: 'gps', xp: 30, unit: 'km', targetValue: 5 },
  { id: 'walk', name: 'Walking', icon: '🚶', color: '#74B9FF', category: 'fitness', verifyType: 'gps', xp: 15, unit: 'km', targetValue: 3 },
  { id: 'cycling', name: 'Cycling', icon: '🚴', color: '#FDCB6E', category: 'fitness', verifyType: 'gps', xp: 25, unit: 'km', targetValue: 10 },
  { id: 'workout', name: 'Workout', icon: '💪', color: '#FF6B6B', category: 'fitness', verifyType: 'timer', xp: 25, unit: 'min', targetValue: 30 },
  { id: 'yoga', name: 'Yoga', icon: '🧘', color: '#A29BFE', category: 'fitness', verifyType: 'timer', xp: 20, unit: 'min', targetValue: 30 },
  { id: 'swim', name: 'Swimming', icon: '🏊', color: '#74B9FF', category: 'fitness', verifyType: 'timer', xp: 30, unit: 'min', targetValue: 45 },
  { id: 'hiit', name: 'HIIT', icon: '🔥', color: '#FF6B6B', category: 'fitness', verifyType: 'timer', xp: 30, unit: 'min', targetValue: 20 },
  { id: 'stretching', name: 'Stretching', icon: '🤸', color: '#55EFC4', category: 'fitness', verifyType: 'timer', xp: 10, unit: 'min', targetValue: 10 },
  { id: 'steps', name: '10k Steps', icon: '👟', color: '#FDCB6E', category: 'fitness', verifyType: 'counter', xp: 20, unit: 'steps', targetValue: 10000 },
  { id: 'pushups', name: 'Push-ups', icon: '🏋️', color: '#FF6B6B', category: 'fitness', verifyType: 'counter', xp: 15, unit: 'reps', targetValue: 50 },
  { id: 'situps', name: 'Sit-ups', icon: '🤜', color: '#FDCB6E', category: 'fitness', verifyType: 'counter', xp: 10, unit: 'reps', targetValue: 30 },
  { id: 'plank', name: 'Plank', icon: '🪵', color: '#636e72', category: 'fitness', verifyType: 'timer', xp: 10, unit: 'sec', targetValue: 60 },

  // ❤️ Health
  { id: 'water', name: 'Drink Water', icon: '💧', color: '#00CEC9', category: 'health', verifyType: 'counter', xp: 10, unit: 'glasses', targetValue: 8 },
  { id: 'cold_shower', name: 'Cold Shower', icon: '🚿', color: '#74B9FF', category: 'health', verifyType: 'checkbox', xp: 10, unit: 'times', targetValue: 1 },
  { id: 'sleep', name: 'Sleep 8h', icon: '😴', color: '#6C63FF', category: 'health', verifyType: 'timer', xp: 15, unit: 'hours', targetValue: 8 },
  { id: 'no_sugar', name: 'No Sugar', icon: '🚫🍬', color: '#55EFC4', category: 'health', verifyType: 'checkbox', xp: 15, unit: 'days', targetValue: 1 },
  { id: 'no_alcohol', name: 'No Alcohol', icon: '🚫🍺', color: '#55EFC4', category: 'health', verifyType: 'checkbox', xp: 20, unit: 'days', targetValue: 1 },
  { id: 'vitamins', name: 'Take Vitamins', icon: '💊', color: '#FDCB6E', category: 'health', verifyType: 'checkbox', xp: 5, unit: 'times', targetValue: 1 },
  { id: 'healthy_meal', name: 'Healthy Meal', icon: '🥗', color: '#55EFC4', category: 'health', verifyType: 'counter', xp: 10, unit: 'meals', targetValue: 3 },
  { id: 'no_junk', name: 'No Junk Food', icon: '🚫🍔', color: '#55EFC4', category: 'health', verifyType: 'checkbox', xp: 15, unit: 'days', targetValue: 1 },

  // 📚 Learning
  { id: 'duolingo', name: 'Duolingo', icon: '🦉', color: '#58CC02', category: 'learning', verifyType: 'manual', xp: 20, unit: 'lessons', targetValue: 1 },
  { id: 'read', name: 'Reading', icon: '📚', color: '#74B9FF', category: 'learning', verifyType: 'timer', xp: 15, unit: 'min', targetValue: 20 },
  { id: 'podcast', name: 'Podcast', icon: '🎙️', color: '#A29BFE', category: 'learning', verifyType: 'timer', xp: 10, unit: 'min', targetValue: 30 },
  { id: 'course', name: 'Online Course', icon: '🎓', color: '#FDCB6E', category: 'learning', verifyType: 'timer', xp: 25, unit: 'min', targetValue: 30 },
  { id: 'coding', name: 'Coding Practice', icon: '💻', color: '#6C63FF', category: 'learning', verifyType: 'timer', xp: 25, unit: 'min', targetValue: 30 },
  { id: 'flashcards', name: 'Flashcards', icon: '🃏', color: '#FDCB6E', category: 'learning', verifyType: 'counter', xp: 10, unit: 'cards', targetValue: 20 },
  { id: 'news', name: 'Read News', icon: '📰', color: '#74B9FF', category: 'learning', verifyType: 'timer', xp: 5, unit: 'min', targetValue: 10 },

  // 🧠 Mindset
  { id: 'meditate', name: 'Meditation', icon: '🧘', color: '#A29BFE', category: 'mindset', verifyType: 'timer', xp: 15, unit: 'min', targetValue: 10 },
  { id: 'journal', name: 'Journaling', icon: '✍️', color: '#FDCB6E', category: 'mindset', verifyType: 'text', xp: 10, unit: 'entries', targetValue: 1 },
  { id: 'gratitude', name: 'Gratitude List', icon: '🙏', color: '#FD79A8', category: 'mindset', verifyType: 'text', xp: 10, unit: 'entries', targetValue: 1 },
  { id: 'affirmations', name: 'Affirmations', icon: '💫', color: '#A29BFE', category: 'mindset', verifyType: 'manual', xp: 5, unit: 'times', targetValue: 1 },
  { id: 'no_phone_morning', name: 'No Phone Morning', icon: '📵', color: '#636e72', category: 'mindset', verifyType: 'checkbox', xp: 15, unit: 'days', targetValue: 1 },
  { id: 'deep_breathing', name: 'Deep Breathing', icon: '🌬️', color: '#74B9FF', category: 'mindset', verifyType: 'timer', xp: 5, unit: 'min', targetValue: 5 },

  // 📱 Social
  { id: 'instagram_post', name: 'Instagram Post', icon: '📸', color: '#E1306C', category: 'social', verifyType: 'link', xp: 15, unit: 'posts', targetValue: 1 },
  { id: 'linkedin', name: 'LinkedIn Post', icon: '💼', color: '#0077B5', category: 'social', verifyType: 'link', xp: 20, unit: 'posts', targetValue: 1 },
  { id: 'twitter_post', name: 'Twitter Post', icon: '🐦', color: '#1DA1F2', category: 'social', verifyType: 'link', xp: 10, unit: 'posts', targetValue: 1 },
  { id: 'youtube_video', name: 'YouTube Video', icon: '🎬', color: '#FF0000', category: 'social', verifyType: 'link', xp: 30, unit: 'videos', targetValue: 1 },
  { id: 'tiktok_video', name: 'TikTok Video', icon: '🎵', color: '#FF0050', category: 'social', verifyType: 'link', xp: 15, unit: 'videos', targetValue: 1 },
  { id: 'call_family', name: 'Call Family', icon: '📞', color: '#55EFC4', category: 'social', verifyType: 'checkbox', xp: 10, unit: 'calls', targetValue: 1 },
  { id: 'meet_friend', name: 'Meet a Friend', icon: '🤝', color: '#FDCB6E', category: 'social', verifyType: 'checkbox', xp: 20, unit: 'times', targetValue: 1 },

  // 💰 Finance
  { id: 'track_expenses', name: 'Track Expenses', icon: '💰', color: '#55EFC4', category: 'finance', verifyType: 'manual', xp: 10, unit: 'times', targetValue: 1 },
  { id: 'save_money', name: 'Save Money', icon: '🐷', color: '#FDCB6E', category: 'finance', verifyType: 'manual', xp: 15, unit: 'times', targetValue: 1 },
  { id: 'no_impulse_buy', name: 'No Impulse Buying', icon: '🚫💳', color: '#FF6B6B', category: 'finance', verifyType: 'checkbox', xp: 20, unit: 'days', targetValue: 1 },
  { id: 'invest', name: 'Review Investments', icon: '📈', color: '#55EFC4', category: 'finance', verifyType: 'manual', xp: 10, unit: 'times', targetValue: 1 },

  // 🎨 Creative
  { id: 'draw', name: 'Drawing', icon: '🎨', color: '#FD79A8', category: 'creative', verifyType: 'timer', xp: 15, unit: 'min', targetValue: 20 },
  { id: 'music', name: 'Play Music', icon: '🎸', color: '#A29BFE', category: 'creative', verifyType: 'timer', xp: 15, unit: 'min', targetValue: 20 },
  { id: 'write', name: 'Creative Writing', icon: '📝', color: '#FDCB6E', category: 'creative', verifyType: 'timer', xp: 15, unit: 'min', targetValue: 20 },
  { id: 'photo', name: 'Photography', icon: '📷', color: '#636e72', category: 'creative', verifyType: 'checkbox', xp: 10, unit: 'times', targetValue: 1 },
  { id: 'cook', name: 'Cook a Meal', icon: '👨‍🍳', color: '#FDCB6E', category: 'creative', verifyType: 'checkbox', xp: 15, unit: 'meals', targetValue: 1 },

  // ⚡ Productivity
  { id: 'deep_work', name: 'Deep Work', icon: '🎯', color: '#6C63FF', category: 'productivity', verifyType: 'timer', xp: 30, unit: 'min', targetValue: 90 },
  { id: 'inbox_zero', name: 'Inbox Zero', icon: '📧', color: '#74B9FF', category: 'productivity', verifyType: 'checkbox', xp: 10, unit: 'times', targetValue: 1 },
  { id: 'plan_day', name: 'Plan the Day', icon: '📅', color: '#A29BFE', category: 'productivity', verifyType: 'manual', xp: 10, unit: 'times', targetValue: 1 },
  { id: 'review_day', name: 'Evening Review', icon: '🌙', color: '#6C63FF', category: 'productivity', verifyType: 'text', xp: 10, unit: 'entries', targetValue: 1 },
  { id: 'clean_desk', name: 'Clean Desk', icon: '🧹', color: '#55EFC4', category: 'productivity', verifyType: 'checkbox', xp: 5, unit: 'times', targetValue: 1 },
  { id: 'no_procrastinate', name: 'No Procrastination', icon: '⚡', color: '#FDCB6E', category: 'productivity', verifyType: 'checkbox', xp: 20, unit: 'days', targetValue: 1 },
];

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingHabit, setVerifyingHabit] = useState(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [addCategory, setAddCategory] = useState('all');

  // Timer
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);

  // GPS Run tracker
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsPaused, setGpsPaused] = useState(false);
  const [runSeconds, setRunSeconds] = useState(0);
  const [runDistance, setRunDistance] = useState(0);
  const [runCoords, setRunCoords] = useState([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [locationPermission, setLocationPermission] = useState(null);
  const runTimerRef = useRef(null);
  const locationSub = useRef(null);
  const lastCoord = useRef(null);

  // Counter
  const [counterValue, setCounterValue] = useState(0);
  const [totalStoredXP, setTotalStoredXP] = useState(0);
  const [isPro, setIsPro] = useState(false);

  // Celebration
  const celebAnim = useRef(new Animated.Value(0)).current;

  // Load habits on mount
  useEffect(() => {
    (async () => {
      await checkAndResetDaily();
      const saved = await loadHabits();
      const currentXP = await loadXP();
      const sub = await loadSubscription();
      setHabits(saved);
      setTotalStoredXP(currentXP);
      setIsPro(sub?.active || false);
      setLoading(false);
    })();
  }, []);

  // Save habits whenever they change
  useEffect(() => {
    if (!loading) saveHabits(habits);
  }, [habits]);

  // Timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  // GPS run timer
  useEffect(() => {
    if (gpsActive && !gpsPaused) {
      runTimerRef.current = setInterval(() => setRunSeconds(s => s + 1), 1000);
    } else {
      clearInterval(runTimerRef.current);
    }
    return () => clearInterval(runTimerRef.current);
  }, [gpsActive, gpsPaused]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);
    return status === 'granted';
  };

  const startGPS = async () => {
    const granted = locationPermission === 'granted' || await requestLocationPermission();
    if (!granted) {
      Alert.alert('Permission needed', 'Location permission is required to track your run.');
      return;
    }
    lastCoord.current = null;
    setGpsActive(true);
    setGpsPaused(false);

    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 2 },
      (loc) => {
        const { latitude, longitude, speed } = loc.coords;
        setCurrentSpeed(speed ? Math.max(0, speed * 3.6) : 0); // m/s to km/h

        if (lastCoord.current && !gpsPaused) {
          const dist = calcDistance(lastCoord.current.lat, lastCoord.current.lon, latitude, longitude);
          if (dist < 0.1) { // filter GPS jumps > 100m
            setRunDistance(d => Math.round((d + dist) * 1000) / 1000);
            setRunCoords(c => [...c, { lat: latitude, lon: longitude }]);
          }
        }
        lastCoord.current = { lat: latitude, lon: longitude };
      }
    );
  };

  const pauseGPS = () => {
    setGpsPaused(true);
    lastCoord.current = null;
  };

  const resumeGPS = () => {
    setGpsPaused(false);
  };

  const stopGPS = () => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
    setGpsActive(false);
    setGpsPaused(false);
  };

  const totalXP = habits.filter(h => h.completedToday).reduce((s, h) => s + (h.lastXP || h.xp), 0);
  const totalPossibleXP = habits.reduce((s, h) => s + h.xp, 0);
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  const openVerify = (habit) => {
    setVerifyingHabit(habit);
    setVerifyInput('');
    setTimerSeconds(0);
    setTimerActive(false);
    setRunSeconds(0);
    setRunDistance(0);
    setRunCoords([]);
    setCurrentSpeed(0);
    setGpsActive(false);
    setGpsPaused(false);
    setCounterValue(0);
    setShowVerifyModal(true);
  };

  const completeHabit = async () => {
    let resultText = '';
    let xpToAward = verifyingHabit.xp;

    if (verifyingHabit.verifyType === 'gps') {
      resultText = `${runDistance.toFixed(2)} km · ${formatTime(runSeconds)} · ${getPace()} /km`;
      // 15 XP per 30min of running (must run at least 30min)
      const minutesRun = runSeconds / 60;
      if (minutesRun < 30) {
        xpToAward = 0; // No XP if under 30 min
      } else {
        xpToAward = Math.floor(minutesRun / 30) * 15;
      }
    } else if (verifyingHabit.verifyType === 'timer') {
      resultText = `${formatTime(timerSeconds)}`;
    } else if (verifyingHabit.verifyType === 'counter') {
      resultText = `${counterValue} ${verifyingHabit.unit}`;
    } else if (verifyingHabit.verifyType === 'link') {
      resultText = 'Post shared ✓';
    } else if (verifyingHabit.verifyType === 'text') {
      resultText = verifyInput.substring(0, 40) + (verifyInput.length > 40 ? '...' : '');
    } else {
      resultText = 'Completed ✓';
    }

    stopGPS();
    setTimerActive(false);

    // Award XP (addXP handles 2x multiplier for Pro users)
    let earnedXP = xpToAward;
    if (xpToAward > 0) {
      const result = await addXP(xpToAward);
      earnedXP = result.earned;
      // Refresh stored XP so display updates correctly
      const newStoredXP = await loadXP();
      setTotalStoredXP(newStoredXP);
      if (result.multiplier > 1) {
        resultText += ` · ⚡ ${earnedXP} XP (2x!)`;
      } else {
        resultText += ` · +${earnedXP} XP`;
      }
    } else if (verifyingHabit.verifyType === 'gps') {
      resultText += ' · Run at least 30min for XP';
    }

    setHabits(prev => prev.map(h =>
      h.id === verifyingHabit.id
        ? { ...h, completedToday: true, streak: h.streak + 1, weekLog: [...h.weekLog.slice(1), true], lastResult: resultText, lastXP: earnedXP }
        : h
    ));
    setShowVerifyModal(false);

    Animated.sequence([
      Animated.spring(celebAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
      Animated.delay(1500),
      Animated.timing(celebAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const addHabit = (template) => {
    if (habits.find(h => h.id === template.id)) return;
    setHabits(prev => [...prev, {
      ...template,
      streak: 0,
      completedToday: false,
      weekLog: [false, false, false, false, false, false, false],
      lastResult: null,
    }]);
    setShowAddModal(false);
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const getPace = () => {
    if (runDistance < 0.01 || runSeconds < 1) return '--:--';
    const paceSecPerKm = runSeconds / runDistance;
    const paceMin = Math.floor(paceSecPerKm / 60);
    const paceSec = Math.floor(paceSecPerKm % 60);
    return `${paceMin}:${String(paceSec).padStart(2,'0')}`;
  };

  const canComplete = () => {
    if (!verifyingHabit) return false;
    switch (verifyingHabit.verifyType) {
      case 'gps': return runDistance > 0;
      case 'timer': return timerSeconds >= 10;
      case 'link': return verifyInput.trim().length > 5;
      case 'text': return verifyInput.trim().length > 10;
      case 'checkbox': return verifyInput === 'done';
      case 'counter': return counterValue > 0;
      default: return true;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} />

      <Animated.View pointerEvents="none" style={[styles.celebOverlay, {
        opacity: celebAnim,
        transform: [{ scale: celebAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
      }]}>
        <Text style={styles.celebEmoji}>🎉</Text>
        <Text style={styles.celebText}>Habit Complete!</Text>
        <Text style={styles.celebXP}>+{verifyingHabit?.lastXP || verifyingHabit?.xp || 0} XP{isPro ? ' (2x!)' : ''}</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <FadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>Habits</Text>
              <Text style={styles.pageSubtitle}>Build your daily system</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </FadeIn>

        {habits.length > 0 && (
          <FadeIn delay={80}>
            <Card style={styles.xpCard}>
              <LinearGradient colors={['#58CC0222', '#0000']} style={StyleSheet.absoluteFill} />
              <View style={styles.xpTop}>
                <View>
                  <Text style={styles.xpLabel}>Today's XP{isPro ? '  ⭐ 2x aktiv' : ''}</Text>
                  <Text style={styles.xpValue}>{totalXP} <Text style={styles.xpMax}>/ {totalPossibleXP} XP · Gesamt: {totalStoredXP}</Text></Text>
                </View>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakFire}>🔥</Text>
                  <Text style={styles.streakNum}>{longestStreak}</Text>
                  <Text style={styles.streakLabel}>best streak</Text>
                </View>
              </View>
              <ProgressBar progress={totalPossibleXP > 0 ? totalXP / totalPossibleXP : 0} color="#58CC02" height={10} style={{ marginTop: Spacing.md }} />
            </Card>
          </FadeIn>
        )}

        {habits.length === 0 ? (
          <FadeIn delay={100}>
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 64 }}>🔥</Text>
              <Text style={styles.emptyText}>No habits yet</Text>
              <Text style={styles.emptySub}>Tap + to add your first habit</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
                <Text style={styles.emptyBtnText}>Add Habit</Text>
              </TouchableOpacity>
            </View>
          </FadeIn>
        ) : (
          habits.map((habit, i) => (
            <FadeIn key={habit.id} delay={160 + i * 60}>
              <Card style={[styles.habitCard, habit.completedToday && styles.habitCardDone]}>
                {habit.completedToday && (
                  <LinearGradient colors={[habit.color + '12', '#0000']} style={StyleSheet.absoluteFill} />
                )}
                <View style={styles.habitMain}>
                  <View style={[styles.habitIcon, { backgroundColor: habit.color + '22' }]}>
                    <Text style={styles.habitEmoji}>{habit.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.habitName, habit.completedToday && { color: Colors.textSecondary }]}>{habit.name}</Text>
                    <View style={styles.habitMeta}>
                      <Text style={styles.habitStreak}>🔥 {habit.streak} day streak</Text>
                      <Text style={styles.habitXP}>+{habit.xp} XP</Text>
                    </View>
                    {habit.lastResult && (
                      <Text style={[styles.habitResult, { color: habit.color }]}>✓ {habit.lastResult}</Text>
                    )}
                  </View>
                  {habit.completedToday ? (
                    <View style={[styles.doneCheck, { backgroundColor: habit.color }]}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </View>
                  ) : (
                    <TouchableOpacity style={[styles.doBtn, { borderColor: habit.color + '66' }]} onPress={() => openVerify(habit)}>
                      <Text style={[styles.doBtnText, { color: habit.color }]}>Start</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.weekRow}>
                  {DAYS.map((day, di) => (
                    <View key={day} style={styles.weekDay}>
                      <View style={[styles.weekDot, habit.weekLog[di] && { backgroundColor: habit.color }, di === 6 && !habit.weekLog[di] && styles.weekDotToday]} />
                      <Text style={styles.weekLabel}>{day}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </FadeIn>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <LinearGradient colors={['#1C1C26', '#13131A']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Habit</Text>

            {/* Category filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {HABIT_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catTab, addCategory === cat && styles.catTabActive]}
                  onPress={() => setAddCategory(cat)}
                >
                  <Text style={[styles.catTabText, addCategory === cat && styles.catTabTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {HABIT_TEMPLATES.filter(t => addCategory === 'all' || t.category === addCategory).map(template => {
                const added = habits.find(h => h.id === template.id);
                return (
                  <TouchableOpacity key={template.id} style={[styles.templateRow, added && styles.templateRowAdded]} onPress={() => addHabit(template)} disabled={!!added}>
                    <View style={[styles.templateIcon, { backgroundColor: template.color + '22' }]}>
                      <Text style={{ fontSize: 22 }}>{template.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateSub}>
                        {template.verifyType === 'gps' ? '📍 GPS tracked' : template.verifyType === 'timer' ? '⏱ Timer' : template.verifyType === 'counter' ? '🔢 Counter' : template.verifyType === 'link' ? '🔗 Link' : template.verifyType === 'text' ? '✏️ Text entry' : '✓ Manual'} · +{template.xp} XP
                      </Text>
                    </View>
                    {added ? <Ionicons name="checkmark-circle" size={22} color={Colors.success} /> : <Ionicons name="add-circle-outline" size={22} color={template.color} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Verify Modal */}
      <Modal visible={showVerifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 50 }]}>
            <LinearGradient colors={['#1C1C26', '#13131A']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            {verifyingHabit && (
              <>
                <View style={styles.verifyHeader}>
                  <Text style={styles.verifyEmoji}>{verifyingHabit.icon}</Text>
                  <Text style={styles.modalTitle}>{verifyingHabit.name}</Text>
                </View>

                {/* GPS TRACKER */}
                {verifyingHabit.verifyType === 'gps' && (
                  <View style={styles.gpsSection}>
                    <View style={styles.gpsStats}>
                      <View style={styles.gpsStat}>
                        <Text style={[styles.gpsStatValue, { color: verifyingHabit.color }]}>{runDistance.toFixed(2)}</Text>
                        <Text style={styles.gpsStatLabel}>km</Text>
                      </View>
                      <View style={styles.gpsStat}>
                        <Text style={styles.gpsStatValue}>{formatTime(runSeconds)}</Text>
                        <Text style={styles.gpsStatLabel}>time</Text>
                      </View>
                      <View style={styles.gpsStat}>
                        <Text style={styles.gpsStatValue}>{getPace()}</Text>
                        <Text style={styles.gpsStatLabel}>min/km</Text>
                      </View>
                      <View style={styles.gpsStat}>
                        <Text style={styles.gpsStatValue}>{currentSpeed.toFixed(1)}</Text>
                        <Text style={styles.gpsStatLabel}>km/h</Text>
                      </View>
                    </View>

                    {/* XP rule hint */}
                    <View style={styles.xpRuleBox}>
                      <Text style={styles.xpRuleText}>
                        {runSeconds < 1800
                          ? `⚡ Run ${Math.ceil((1800 - runSeconds) / 60)}min more for 15 XP`
                          : `⚡ ${Math.floor(runSeconds / 1800) * 15} XP earned (${Math.floor(runSeconds / 60)}min)`}
                      </Text>
                    </View>

                    {/* GPS Status */}
                    <View style={styles.gpsStatus}>
                      <View style={[styles.gpsDot, { backgroundColor: gpsActive && !gpsPaused ? Colors.success : gpsPaused ? Colors.warning : Colors.textMuted }]} />
                      <Text style={styles.gpsStatusText}>
                        {gpsActive && !gpsPaused ? 'GPS Active – Tracking' : gpsPaused ? 'Paused' : 'GPS Ready'}
                      </Text>
                    </View>

                    {/* Controls */}
                    {!gpsActive ? (
                      <TouchableOpacity style={[styles.gpsBtn, { backgroundColor: verifyingHabit.color }]} onPress={startGPS}>
                        <Ionicons name="play" size={28} color="#fff" />
                        <Text style={styles.gpsBtnText}>Start GPS Tracking</Text>
                      </TouchableOpacity>
                    ) : gpsPaused ? (
                      <View style={styles.gpsControls}>
                        <TouchableOpacity style={[styles.gpsBtnSmall, { backgroundColor: Colors.success }]} onPress={resumeGPS}>
                          <Ionicons name="play" size={22} color="#fff" />
                          <Text style={styles.gpsBtnSmallText}>Resume</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.gpsBtnSmall, { backgroundColor: Colors.danger }]} onPress={stopGPS}>
                          <Ionicons name="stop" size={22} color="#fff" />
                          <Text style={styles.gpsBtnSmallText}>Stop</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={[styles.gpsBtn, { backgroundColor: Colors.warning + '33', borderWidth: 1, borderColor: Colors.warning }]} onPress={pauseGPS}>
                        <Ionicons name="pause" size={28} color={Colors.warning} />
                        <Text style={[styles.gpsBtnText, { color: Colors.warning }]}>Pause</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* TIMER */}
                {verifyingHabit.verifyType === 'timer' && (
                  <View style={styles.timerSection}>
                    <Text style={styles.timerDisplay}>{formatTime(timerSeconds)}</Text>
                    <TouchableOpacity
                      style={[styles.timerBtn, { backgroundColor: timerActive ? Colors.danger + '22' : verifyingHabit.color + '22' }]}
                      onPress={() => setTimerActive(a => !a)}
                    >
                      <Ionicons name={timerActive ? 'pause' : 'play'} size={24} color={timerActive ? Colors.danger : verifyingHabit.color} />
                      <Text style={[styles.timerBtnText, { color: timerActive ? Colors.danger : verifyingHabit.color }]}>
                        {timerActive ? 'Pause' : 'Start Timer'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* COUNTER */}
                {verifyingHabit.verifyType === 'counter' && (
                  <View style={styles.counterSection}>
                    <Text style={styles.counterTarget}>Target: {verifyingHabit.targetValue} {verifyingHabit.unit}</Text>
                    <View style={styles.counterRow}>
                      <TouchableOpacity style={styles.counterBtn} onPress={() => setCounterValue(v => Math.max(0, v - 1))}>
                        <Ionicons name="remove" size={28} color={Colors.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{counterValue}</Text>
                      <TouchableOpacity style={[styles.counterBtn, { backgroundColor: verifyingHabit.color + '22' }]} onPress={() => setCounterValue(v => v + 1)}>
                        <Ionicons name="add" size={28} color={verifyingHabit.color} />
                      </TouchableOpacity>
                    </View>
                    <ProgressBar progress={Math.min(counterValue / verifyingHabit.targetValue, 1)} color={verifyingHabit.color} height={8} style={{ marginTop: Spacing.md }} />
                    <Text style={styles.counterSub}>{counterValue} / {verifyingHabit.targetValue} {verifyingHabit.unit}</Text>
                  </View>
                )}

                {/* LINK */}
                {verifyingHabit.verifyType === 'link' && (
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Paste your post link</Text>
                    <TextInput style={styles.verifyInput} value={verifyInput} onChangeText={setVerifyInput} placeholder="https://..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
                  </View>
                )}

                {/* TEXT */}
                {verifyingHabit.verifyType === 'text' && (
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Write your entry</Text>
                    <TextInput style={[styles.verifyInput, { height: 100 }]} value={verifyInput} onChangeText={setVerifyInput} placeholder="Today I..." placeholderTextColor={Colors.textMuted} multiline />
                  </View>
                )}

                {/* CHECKBOX */}
                {verifyingHabit.verifyType === 'checkbox' && (
                  <TouchableOpacity style={styles.checkboxSection} onPress={() => setVerifyInput(verifyInput === 'done' ? '' : 'done')}>
                    <View style={[styles.bigCheck, verifyInput === 'done' && { backgroundColor: verifyingHabit.color, borderColor: verifyingHabit.color }]}>
                      {verifyInput === 'done' && <Ionicons name="checkmark" size={32} color="#fff" />}
                    </View>
                    <Text style={styles.checkboxLabel}>Tap to confirm</Text>
                  </TouchableOpacity>
                )}

                {/* MANUAL */}
                {verifyingHabit.verifyType === 'manual' && (
                  <View style={styles.checkboxSection}>
                    <Text style={{ fontSize: 56 }}>{verifyingHabit.icon}</Text>
                    <Text style={styles.checkboxLabel}>Mark {verifyingHabit.name} as done?</Text>
                  </View>
                )}

                <TouchableOpacity style={[styles.saveBtn, !canComplete() && { opacity: 0.4 }]} onPress={completeHabit} disabled={!canComplete()}>
                  <LinearGradient colors={[verifyingHabit.color, verifyingHabit.color + 'CC']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>Complete · +{verifyingHabit.xp} XP</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => { stopGPS(); setTimerActive(false); setShowVerifyModal(false); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.base, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  pageTitle: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', ...Shadow.accent },
  celebOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000AA' },
  celebEmoji: { fontSize: 72 },
  celebText: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, marginTop: Spacing.md },
  celebXP: { fontSize: Typography.xl, color: '#58CC02', fontWeight: Typography.bold, marginTop: Spacing.sm },
  xpCard: { marginBottom: Spacing.base, padding: Spacing.lg, overflow: 'hidden' },
  xpTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  xpLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  xpValue: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: '#58CC02', marginTop: 4 },
  xpMax: { fontSize: Typography.lg, color: Colors.textMuted, fontWeight: '400' },
  streakBadge: { alignItems: 'center', backgroundColor: Colors.bgHighlight, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  streakFire: { fontSize: 22 },
  streakNum: { fontSize: Typography.xl, fontWeight: Typography.heavy, color: Colors.warning },
  streakLabel: { fontSize: 10, color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  emptyText: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textMuted },
  emptySub: { fontSize: Typography.sm, color: Colors.textMuted },
  emptyBtn: { marginTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.accentSoft, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.accent + '66' },
  emptyBtnText: { color: Colors.accent, fontWeight: Typography.semibold },
  habitCard: { marginBottom: Spacing.sm, padding: Spacing.base, overflow: 'hidden' },
  habitCardDone: { borderColor: Colors.borderLight },
  habitMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  habitIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  habitEmoji: { fontSize: 24 },
  habitName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  habitStreak: { fontSize: Typography.xs, color: Colors.textSecondary },
  habitXP: { fontSize: Typography.xs, color: '#58CC02', fontWeight: Typography.semibold },
  habitResult: { fontSize: Typography.xs, marginTop: 4, fontWeight: Typography.medium },
  doneCheck: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  doBtn: { paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1.5 },
  doBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 4 },
  weekDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.border },
  weekDotToday: { borderColor: Colors.accent, borderWidth: 2 },
  weekLabel: { fontSize: 9, color: Colors.textMuted },

  xpRuleBox: { backgroundColor: Colors.warning + '22', borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 6, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.warning + '44' },
  xpRuleText: { fontSize: Typography.xs, color: Colors.warning, fontWeight: Typography.semibold, textAlign: 'center' },

  // GPS
  gpsSection: { alignItems: 'center', paddingVertical: Spacing.md },
  gpsStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: Spacing.lg },
  gpsStat: { alignItems: 'center' },
  gpsStatValue: { fontSize: Typography.xl, fontWeight: Typography.heavy, color: Colors.textPrimary },
  gpsStatLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  gpsStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg },
  gpsDot: { width: 8, height: 8, borderRadius: 4 },
  gpsStatusText: { fontSize: Typography.sm, color: Colors.textSecondary },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full },
  gpsBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
  gpsControls: { flexDirection: 'row', gap: Spacing.md },
  gpsBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.full },
  gpsBtnSmallText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#fff' },

  // Timer
  timerSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  timerDisplay: { fontSize: 56, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: 2, marginBottom: Spacing.lg },
  timerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full },
  timerBtnText: { fontSize: Typography.base, fontWeight: Typography.bold },

  // Counter
  counterSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  counterTarget: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  counterBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.bgHighlight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  counterValue: { fontSize: 48, fontWeight: Typography.heavy, color: Colors.textPrimary, minWidth: 80, textAlign: 'center' },
  counterSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.sm },

  inputSection: { marginBottom: Spacing.lg, width: '100%' },
  inputLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  verifyInput: { backgroundColor: Colors.bgHighlight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, minHeight: 50 },
  checkboxSection: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  bigCheck: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { fontSize: Typography.base, color: Colors.textSecondary },

  catScroll: { marginBottom: Spacing.md },
  catTab: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.border },
  catTabActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  catTabText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  catTabTextActive: { color: Colors.accent, fontWeight: Typography.semibold },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, overflow: 'hidden' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  verifyHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  verifyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  templateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  templateRowAdded: { opacity: 0.5 },
  templateIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  templateName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  templateSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  saveBtn: { borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.sm, width: '100%' },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.base },
  saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
  cancelBtn: { padding: Spacing.md, alignItems: 'center' },
  cancelText: { fontSize: Typography.base, color: Colors.textSecondary },
});
