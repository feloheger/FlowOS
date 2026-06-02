import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, Animated, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, FadeIn, SectionHeader, ProgressBar } from '../components/UI';

const HABIT_TEMPLATES = [
  { id: 'duolingo', name: 'Duolingo Lesson', icon: '🦉', color: '#58CC02', category: 'learning', verifyType: 'screenshot', xp: 20 },
  { id: 'instagram_post', name: 'Instagram Post', icon: '📸', color: '#E1306C', category: 'social', verifyType: 'link', xp: 15 },
  { id: 'workout', name: 'Workout', icon: '💪', color: '#FF6B6B', category: 'health', verifyType: 'timer', xp: 25 },
  { id: 'read', name: 'Read 20 min', icon: '📚', color: '#74B9FF', category: 'learning', verifyType: 'timer', xp: 15 },
  { id: 'meditate', name: 'Meditate', icon: '🧘', color: '#A29BFE', category: 'health', verifyType: 'timer', xp: 10 },
  { id: 'journal', name: 'Journal Entry', icon: '✍️', color: '#FDCB6E', category: 'mindset', verifyType: 'text', xp: 10 },
  { id: 'linkedin', name: 'LinkedIn Post', icon: '💼', color: '#0077B5', category: 'social', verifyType: 'link', xp: 20 },
  { id: 'cold_shower', name: 'Cold Shower', icon: '🚿', color: '#00CEC9', category: 'health', verifyType: 'checkbox', xp: 10 },
];

const INITIAL_HABITS = [
  { ...HABIT_TEMPLATES[0], streak: 7, completedToday: true, weekLog: [true, true, false, true, true, true, true] },
  { ...HABIT_TEMPLATES[1], streak: 3, completedToday: false, weekLog: [false, true, true, false, false, false, false] },
  { ...HABIT_TEMPLATES[2], streak: 12, completedToday: true, weekLog: [true, true, true, true, true, false, true] },
  { ...HABIT_TEMPLATES[3], streak: 2, completedToday: false, weekLog: [false, false, false, false, false, true, true] },
];

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function HabitsScreen() {
  const [habits, setHabits] = useState(INITIAL_HABITS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingHabit, setVerifyingHabit] = useState(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);
  const celebAnim = useRef(new Animated.Value(0)).current;

  const totalXP = habits.filter(h => h.completedToday).reduce((s, h) => s + h.xp, 0);
  const totalPossibleXP = habits.reduce((s, h) => s + h.xp, 0);
  const completedCount = habits.filter(h => h.completedToday).length;
  const longestStreak = Math.max(...habits.map(h => h.streak));

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const openVerify = (habit) => {
    setVerifyingHabit(habit);
    setVerifyInput('');
    setTimerSeconds(0);
    setTimerActive(false);
    setShowVerifyModal(true);
  };

  const completeHabit = () => {
    setHabits(prev => prev.map(h =>
      h.id === verifyingHabit.id
        ? { ...h, completedToday: true, streak: h.streak + 1, weekLog: [...h.weekLog.slice(1), true] }
        : h
    ));
    setShowVerifyModal(false);
    // Celebration
    Animated.sequence([
      Animated.spring(celebAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
      Animated.delay(1000),
      Animated.timing(celebAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const addHabit = (template) => {
    if (habits.find(h => h.id === template.id)) return;
    setHabits(prev => [...prev, { ...template, streak: 0, completedToday: false, weekLog: [false, false, false, false, false, false, false] }]);
    setShowAddModal(false);
  };

  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} />

      {/* Celebration overlay */}
      <Animated.View
        pointerEvents="none"
        style={[styles.celebOverlay, {
          opacity: celebAnim,
          transform: [{ scale: celebAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
        }]}
      >
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
            <ProgressBar progress={totalXP / totalPossibleXP || 0} color="#58CC02" height={10} style={{ marginTop: Spacing.md }} />
            <Text style={styles.xpSub}>{completedCount} of {habits.length} habits done today</Text>
          </Card>
        </FadeIn>

        <SectionHeader title="Daily Habits" subtitle="Tap to complete & verify" />

        {habits.map((habit, i) => (
          <FadeIn key={habit.id} delay={160 + i * 70}>
            <Card style={[styles.habitCard, habit.completedToday && styles.habitCardDone]}>
              {habit.completedToday && (
                <LinearGradient colors={[habit.color + '12', '#0000']} style={StyleSheet.absoluteFill} />
              )}
              <View style={styles.habitMain}>
                {/* Icon */}
                <View style={[styles.habitIcon, { backgroundColor: habit.color + '22' }, habit.completedToday && { backgroundColor: habit.color + '33' }]}>
                  <Text style={styles.habitEmoji}>{habit.icon}</Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.habitName, habit.completedToday && { color: Colors.textSecondary }]}>{habit.name}</Text>
                  <View style={styles.habitMeta}>
                    <Text style={styles.habitStreak}>🔥 {habit.streak} day streak</Text>
                    <Text style={styles.habitXP}>+{habit.xp} XP</Text>
                  </View>
                </View>

                {/* Check / Complete Button */}
                {habit.completedToday ? (
                  <View style={[styles.doneCheck, { backgroundColor: habit.color }]}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.doBtn, { borderColor: habit.color + '66' }]} onPress={() => openVerify(habit)}>
                    <Text style={[styles.doBtnText, { color: habit.color }]}>Do it</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Week Log */}
              <View style={styles.weekRow}>
                {DAYS.map((day, di) => (
                  <View key={day} style={styles.weekDay}>
                    <View style={[
                      styles.weekDot,
                      habit.weekLog[di] && { backgroundColor: habit.color },
                      di === 6 && !habit.weekLog[di] && styles.weekDotToday,
                    ]} />
                    <Text style={styles.weekLabel}>{day}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </FadeIn>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <LinearGradient colors={['#1C1C26', '#13131A']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Habit</Text>
            <Text style={styles.modalSub}>Choose from templates</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {HABIT_TEMPLATES.map(template => {
                const alreadyAdded = habits.find(h => h.id === template.id);
                return (
                  <TouchableOpacity
                    key={template.id}
                    style={[styles.templateRow, alreadyAdded && styles.templateRowAdded]}
                    onPress={() => addHabit(template)}
                    disabled={!!alreadyAdded}
                  >
                    <View style={[styles.templateIcon, { backgroundColor: template.color + '22' }]}>
                      <Text style={{ fontSize: 22 }}>{template.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateCategory}>{template.category} · +{template.xp} XP</Text>
                    </View>
                    {alreadyAdded
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
                  <Text style={styles.modalSub}>Verify your completion</Text>
                </View>

                {/* Timer verify */}
                {verifyingHabit.verifyType === 'timer' && (
                  <View style={styles.timerSection}>
                    <Text style={styles.timerDisplay}>{formatTimer(timerSeconds)}</Text>
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

                {/* Screenshot / Link verify */}
                {(verifyingHabit.verifyType === 'screenshot' || verifyingHabit.verifyType === 'link') && (
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>
                      {verifyingHabit.verifyType === 'link' ? 'Paste the post link' : 'Describe what you did'}
                    </Text>
                    <TextInput
                      style={styles.verifyInput}
                      value={verifyInput}
                      onChangeText={setVerifyInput}
                      placeholder={verifyingHabit.verifyType === 'link' ? 'https://...' : 'Completed lesson 5 in Spanish...'}
                      placeholderTextColor={Colors.textMuted}
                      multiline={verifyingHabit.verifyType !== 'link'}
                    />
                  </View>
                )}

                {/* Text verify */}
                {verifyingHabit.verifyType === 'text' && (
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Write your journal entry</Text>
                    <TextInput
                      style={[styles.verifyInput, { height: 100 }]}
                      value={verifyInput}
                      onChangeText={setVerifyInput}
                      placeholder="Today I felt..."
                      placeholderTextColor={Colors.textMuted}
                      multiline
                    />
                  </View>
                )}

                {/* Checkbox verify */}
                {verifyingHabit.verifyType === 'checkbox' && (
                  <TouchableOpacity style={styles.checkboxSection} onPress={() => setVerifyInput('done')}>
                    <View style={[styles.bigCheck, verifyInput === 'done' && { backgroundColor: verifyingHabit.color, borderColor: verifyingHabit.color }]}>
                      {verifyInput === 'done' && <Ionicons name="checkmark" size={32} color="#fff" />}
                    </View>
                    <Text style={styles.checkboxLabel}>Tap to confirm</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.saveBtn, { opacity: verifyingHabit.verifyType === 'timer' && timerSeconds < 10 ? 0.4 : 1 }]}
                  onPress={completeHabit}
                  disabled={verifyingHabit.verifyType === 'timer' && timerSeconds < 10}
                >
                  <LinearGradient
                    colors={[verifyingHabit.color, verifyingHabit.color + 'CC']}
                    style={styles.saveBtnGrad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>Complete · +{verifyingHabit.xp} XP</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowVerifyModal(false)}>
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

  xpCard: { marginBottom: Spacing.base, padding: Spacing.lg },
  xpTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  xpLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  xpValue: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: '#58CC02', marginTop: 4 },
  xpMax: { fontSize: Typography.lg, color: Colors.textMuted, fontWeight: Typography.regular },
  xpSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: Spacing.sm },
  streakBadge: { alignItems: 'center', backgroundColor: Colors.bgHighlight, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  streakFire: { fontSize: 22 },
  streakNum: { fontSize: Typography.xl, fontWeight: Typography.heavy, color: Colors.warning },
  streakLabel: { fontSize: 10, color: Colors.textMuted },

  habitCard: { marginBottom: Spacing.sm, padding: Spacing.base, overflow: 'hidden' },
  habitCardDone: { borderColor: Colors.borderLight },
  habitMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  habitIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  habitEmoji: { fontSize: 24 },
  habitName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  habitStreak: { fontSize: Typography.xs, color: Colors.textSecondary },
  habitXP: { fontSize: Typography.xs, color: '#58CC02', fontWeight: Typography.semibold },
  doneCheck: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  doBtn: { paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1.5 },
  doBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 4 },
  weekDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.border },
  weekDotToday: { borderColor: Colors.accent, borderWidth: 2 },
  weekLabel: { fontSize: 9, color: Colors.textMuted },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40, overflow: 'hidden' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center' },
  modalSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4, textAlign: 'center', marginBottom: Spacing.lg },

  templateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  templateRowAdded: { opacity: 0.5 },
  templateIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  templateName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  templateCategory: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  verifyHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  verifyEmoji: { fontSize: 48, marginBottom: Spacing.sm },

  timerSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  timerDisplay: { fontSize: 56, fontWeight: Typography.heavy, color: Colors.textPrimary, fontVariant: ['tabular-nums'], letterSpacing: 2, marginBottom: Spacing.lg },
  timerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full },
  timerBtnText: { fontSize: Typography.base, fontWeight: Typography.bold },

  inputSection: { marginBottom: Spacing.lg },
  inputLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  verifyInput: { backgroundColor: Colors.bgHighlight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, minHeight: 50 },

  checkboxSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  bigCheck: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  checkboxLabel: { fontSize: Typography.base, color: Colors.textSecondary },

  saveBtn: { borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.sm, ...Shadow.accent },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.base },
  saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
  cancelBtn: { padding: Spacing.md, alignItems: 'center' },
  cancelText: { fontSize: Typography.base, color: Colors.textSecondary },
});
