import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, Animated, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, FadeIn, SectionHeader, ProgressBar } from '../components/UI';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const HABIT_TEMPLATES = [
  { id: 'run', name: 'Running', icon: '🏃', color: '#FF6B6B', category: 'health', verifyType: 'run', xp: 30, unit: 'km', targetValue: 5 },
  { id: 'walk', name: 'Walking', icon: '🚶', color: '#74B9FF', category: 'health', verifyType: 'run', xp: 15, unit: 'km', targetValue: 3 },
  { id: 'workout', name: 'Workout', icon: '💪', color: '#FF6B6B', category: 'health', verifyType: 'timer', xp: 25, unit: 'min', targetValue: 30 },
  { id: 'duolingo', name: 'Duolingo', icon: '🦉', color: '#58CC02', category: 'learning', verifyType: 'manual', xp: 20, unit: 'lessons', targetValue: 1 },
  { id: 'instagram_post', name: 'Instagram Post', icon: '📸', color: '#E1306C', category: 'social', verifyType: 'link', xp: 15, unit: 'posts', targetValue: 1 },
  { id: 'linkedin', name: 'LinkedIn Post', icon: '💼', color: '#0077B5', category: 'social', verifyType: 'link', xp: 20, unit: 'posts', targetValue: 1 },
  { id: 'read', name: 'Reading', icon: '📚', color: '#74B9FF', category: 'learning', verifyType: 'timer', xp: 15, unit: 'min', targetValue: 20 },
  { id: 'meditate', name: 'Meditation', icon: '🧘', color: '#A29BFE', category: 'health', verifyType: 'timer', xp: 10, unit: 'min', targetValue: 10 },
  { id: 'journal', name: 'Journaling', icon: '✍️', color: '#FDCB6E', category: 'mindset', verifyType: 'text', xp: 10, unit: 'entries', targetValue: 1 },
  { id: 'water', name: 'Drink Water', icon: '💧', color: '#00CEC9', category: 'health', verifyType: 'counter', xp: 10, unit: 'glasses', targetValue: 8 },
  { id: 'sleep', name: 'Sleep 8h', icon: '😴', color: '#6C63FF', category: 'health', verifyType: 'timer', xp: 15, unit: 'hours', targetValue: 8 },
  { id: 'cold_shower', name: 'Cold Shower', icon: '🚿', color: '#00CEC9', category: 'health', verifyType: 'checkbox', xp: 10, unit: 'times', targetValue: 1 },
];

export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingHabit, setVerifyingHabit] = useState(null);
  const [verifyInput, setVerifyInput] = useState('');

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);

  // Run tracker state
  const [runActive, setRunActive] = useState(false);
  const [runSeconds, setRunSeconds] = useState(0);
  const [runDistance, setRunDistance] = useState(0);
  const [runSteps, setRunSteps] = useState(0);
  const runRef = useRef(null);
  const runDistRef = useRef(null);

  // Counter state
  const [counterValue, setCounterValue] = useState(0);

  // Celebration
  const celebAnim = useRef(new Animated.Value(0)).current;

  const totalXP = habits.filter(h => h.completedToday).reduce((s, h) => s + h.xp, 0);
  const totalPossibleXP = habits.reduce((s, h) => s + h.xp, 0);
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  useEffect(() => {
    if (runActive) {
      // Timer
      runRef.current = setInterval(() => setRunSeconds(s => s + 1), 1000);
      // Simulate distance (in real app use expo-location)
      runDistRef.current = setInterval(() => {
        setRunDistance(d => Math.round((d + 0.008) * 1000) / 1000);
        setRunSteps(s => s + 4);
      }, 1000);
    } else {
      clearInterval(runRef.current);
      clearInterval(runDistRef.current);
    }
    return () => {
      clearInterval(runRef.current);
      clearInterval(runDistRef.current);
    };
  }, [runActive]);

  const openVerify = (habit) => {
    setVerifyingHabit(habit);
    setVerifyInput('');
    setTimerSeconds(0);
    setTimerActive(false);
    setRunSeconds(0);
    setRunDistance(0);
    setRunSteps(0);
    setRunActive(false);
    setCounterValue(0);
    setShowVerifyModal(true);
  };

  const completeHabit = () => {
    let resultText = '';
    if (verifyingHabit.verifyType === 'run') {
      resultText = `${runDistance.toFixed(2)} km · ${formatTime(runSeconds)} · ${runSteps} steps`;
    } else if (verifyingHabit.verifyType === 'timer') {
      resultText = `${formatTime(timerSeconds)}`;
    } else if (verifyingHabit.verifyType === 'counter') {
      resultText = `${counterValue} ${verifyingHabit.unit}`;
    } else {
      resultText = verifyInput;
    }

    setHabits(prev => prev.map(h =>
      h.id === verifyingHabit.id
        ? { ...h, completedToday: true, streak: h.streak + 1, weekLog: [...h.weekLog.slice(1), true], lastResult: resultText }
        : h
    ));
    setTimerActive(false);
    setRunActive(false);
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
      case 'run': return runDistance > 0;
      case 'timer': return timerSeconds >= 10;
      case 'link': return verifyInput.trim().length > 5;
      case 'text': return verifyInput.trim().length > 10;
      case 'checkbox': return verifyInput === 'done';
      case 'counter': return counterValue > 0;
      case 'manual': return true;
      default: return true;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} />

      {/* Celebration */}
      <Animated.View pointerEvents="none" style={[styles.celebOverlay, {
        opacity: celebAnim,
        transform: [{ scale: celebAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
      }]}>
        <Text style={styles.celebEmoji}>🎉</Text>
        <Text style={styles.celebText}>Habit Complete!</Text>
        <Text style={styles.celebXP}>+{verifyingHabit?.xp || 0} XP</Text>
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

        {/* XP Bar */}
        {habits.length > 0 && (
          <FadeIn delay={80}>
            <Card style={styles.xpCard}>
              <LinearGradient colors={['#58CC0222', '#0000']} style={StyleSheet.absoluteFill} />
              <View style={styles.xpTop}>
                <View>
                  <Text style={styles.xpLabel}>Today's XP</Text>
                  <Text style={styles.xpValue}>{totalXP} <Text style={styles.xpMax}>/ {totalPossibleXP} XP</Text></Text>
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
            <FadeIn key={habit.id} delay={160 + i * 70}>
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

      {/* Add Habit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <LinearGradient colors={['#1C1C26', '#13131A']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Habit</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {HABIT_TEMPLATES.map(template => {
                const added = habits.find(h => h.id === template.id);
                return (
                  <TouchableOpacity key={template.id} style={[styles.templateRow, added && styles.templateRowAdded]} onPress={() => addHabit(template)} disabled={!!added}>
                    <View style={[styles.templateIcon, { backgroundColor: template.color + '22' }]}>
                      <Text style={{ fontSize: 22 }}>{template.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateCategory}>{template.category} · +{template.xp} XP · tracked by {template.verifyType}</Text>
                    </View>
                    {added
                      ? <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                      : <Ionicons name="add-circle-outline" size={22} color={template.color} />
                    }
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
          <View style={styles.modalSheet}>
            <LinearGradient colors={['#1C1C26', '#13131A']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            {verifyingHabit && (
              <>
                <View style={styles.verifyHeader}>
                  <Text style={styles.verifyEmoji}>{verifyingHabit.icon}</Text>
                  <Text style={styles.modalTitle}>{verifyingHabit.name}</Text>
                </View>

                {/* RUN TRACKER */}
                {verifyingHabit.verifyType === 'run' && (
                  <View style={styles.runSection}>
                    <View style={styles.runStats}>
                      <View style={styles.runStat}>
                        <Text style={styles.runStatValue}>{runDistance.toFixed(2)}</Text>
                        <Text style={styles.runStatLabel}>km</Text>
                      </View>
                      <View style={styles.runStat}>
                        <Text style={styles.runStatValue}>{formatTime(runSeconds)}</Text>
                        <Text style={styles.runStatLabel}>time</Text>
                      </View>
                      <View style={styles.runStat}>
                        <Text style={styles.runStatValue}>{getPace()}</Text>
                        <Text style={styles.runStatLabel}>min/km</Text>
                      </View>
                      <View style={styles.runStat}>
                        <Text style={styles.runStatValue}>{runSteps}</Text>
                        <Text style={styles.runStatLabel}>steps</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.runBtn, { backgroundColor: runActive ? Colors.danger + '22' : verifyingHabit.color + '22' }]}
                      onPress={() => setRunActive(a => !a)}
                    >
                      <Ionicons name={runActive ? 'pause-circle' : 'play-circle'} size={56} color={runActive ? Colors.danger : verifyingHabit.color} />
                      <Text style={[styles.runBtnText, { color: runActive ? Colors.danger : verifyingHabit.color }]}>
                        {runActive ? 'Pause' : runSeconds > 0 ? 'Resume' : 'Start'}
                      </Text>
                    </TouchableOpacity>
                    {runSeconds > 0 && !runActive && (
                      <Text style={styles.runHint}>Tap finish below to save your run</Text>
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
                    <Text style={styles.checkboxLabel}>Tap to confirm done</Text>
                  </TouchableOpacity>
                )}

                {/* MANUAL */}
                {verifyingHabit.verifyType === 'manual' && (
                  <View style={styles.checkboxSection}>
                    <Text style={{ fontSize: 48 }}>{verifyingHabit.icon}</Text>
                    <Text style={styles.checkboxLabel}>Completed your {verifyingHabit.name}?</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.saveBtn, !canComplete() && { opacity: 0.4 }]}
                  onPress={completeHabit}
                  disabled={!canComplete()}
                >
                  <LinearGradient colors={[verifyingHabit.color, verifyingHabit.color + 'CC']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>Complete · +{verifyingHabit.xp} XP</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setTimerActive(false); setRunActive(false); setShowVerifyModal(false); }}>
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

  // Run tracker
  runSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  runStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: Spacing.xl },
  runStat: { alignItems: 'center' },
  runStatValue: { fontSize: Typography.xl, fontWeight: Typography.heavy, color: Colors.textPrimary },
  runStatLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  runBtn: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', gap: 4 },
  runBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold },
  runHint: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: Spacing.md },

  // Timer
  timerSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  timerDisplay: { fontSize: 56, fontWeight: Typography.heavy, color: Colors.textPrimary, fontVariant: ['tabular-nums'], letterSpacing: 2, marginBottom: Spacing.lg },
  timerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full },
  timerBtnText: { fontSize: Typography.base, fontWeight: Typography.bold },

  // Counter
  counterSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  counterTarget: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  counterBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.bgHighlight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  counterValue: { fontSize: 48, fontWeight: Typography.heavy, color: Colors.textPrimary, minWidth: 80, textAlign: 'center' },
  counterSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.sm },

  inputSection: { marginBottom: Spacing.lg },
  inputLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  verifyInput: { backgroundColor: Colors.bgHighlight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, minHeight: 50 },

  checkboxSection: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  bigCheck: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { fontSize: Typography.base, color: Colors.textSecondary },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40, overflow: 'hidden' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  verifyHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  verifyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  templateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  templateRowAdded: { opacity: 0.5 },
  templateIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  templateName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  templateCategory: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  saveBtn: { borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.sm },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.base },
  saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
  cancelBtn: { padding: Spacing.md, alignItems: 'center' },
  cancelText: { fontSize: Typography.base, color: Colors.textSecondary },
});
