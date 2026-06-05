import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, ProgressBar, FadeIn, SectionHeader, EnergyDot } from '../components/UI';

export default function DashboardScreen({ navigation }) {
  const [energy, setEnergy] = useState(3);
  const [tasks, setTasks] = useState([]);
  const [now, setNow] = useState(new Date());
  const scrollY = useRef(new Animated.Value(0)).current;

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const completedToday = tasks.filter(t => t.done).length;
  const totalToday = tasks.length;

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const getGreeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const secondsStr = String(now.getSeconds()).padStart(2,'0');
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} />

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>Welcome 👋</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Live Clock */}
        <FadeIn delay={40}>
          <Card style={styles.clockCard}>
            <LinearGradient colors={['#6C63FF14', '#0000']} style={StyleSheet.absoluteFill} />
            <View style={styles.clockRow}>
              <Text style={styles.clockTime}>{timeStr}</Text>
              <Text style={styles.clockSeconds}>{secondsStr}</Text>
            </View>
            <Text style={styles.clockDate}>{dateStr}</Text>
          </Card>
        </FadeIn>

        {/* Energy Check */}
        <FadeIn delay={120}>
          <Card style={styles.energyCard}>
            <LinearGradient colors={['#6C63FF18', '#6C63FF05']} style={StyleSheet.absoluteFill} />
            <Text style={styles.energyLabel}>Today's Energy</Text>
            <View style={styles.energyDots}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setEnergy(i)}>
                  <View style={[styles.energyCircle, i <= energy && styles.energyCircleActive, i === energy && styles.energyCircleCurrent]}>
                    <Text style={[styles.energyNum, i <= energy && styles.energyNumActive]}>{i}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.energySub}>
              {energy >= 4 ? '🔥 High energy – tackle your hardest tasks first'
                : energy === 3 ? '⚡ Solid energy – good day for focused work'
                : '🌙 Low energy – keep it light today'}
            </Text>
          </Card>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={200}>
          <View style={styles.statsRow}>
            <StatBox label="Tasks" value={`${completedToday}/${totalToday}`} color={Colors.accent} icon="checkmark-circle" />
            <StatBox label="Projects" value="0" color={Colors.success} icon="folder" />
            <StatBox label="Habits" value="0" color={Colors.warning} icon="flame" />
          </View>
        </FadeIn>

        {/* Today's Tasks */}
        <FadeIn delay={280}>
          <SectionHeader title="Today's Stack" subtitle="Your tasks for today" action="Add" />
          {tasks.length === 0 ? (
            <EmptyState icon="checkmark-circle-outline" text="No tasks yet" sub="Add your first task to get started" />
          ) : (
            tasks.map((task) => (
              <TouchableOpacity key={task.id} onPress={() => toggleTask(task.id)} activeOpacity={0.8}>
                <View style={[styles.taskRow, task.done && styles.taskRowDone]}>
                  <View style={[styles.taskCheck, task.done && styles.taskCheckDone]}>
                    {task.done && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
                    <View style={styles.taskMeta}>
                      <EnergyDot level={task.energy} />
                      <Text style={styles.taskProject}>{task.project}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </FadeIn>

        {/* Active Projects */}
        <FadeIn delay={360}>
          <SectionHeader title="Active Projects" action="All" style={{ marginTop: Spacing.xl }} />
          <EmptyState icon="folder-outline" text="No projects yet" sub="Create your first project in the Projects tab" />
        </FadeIn>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

function StatBox({ label, value, color, icon }) {
  return (
    <Card style={styles.statBox}>
      <Ionicons name={icon} size={18} color={color} style={{ marginBottom: 6 }} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={40} color={Colors.textMuted} />
      <Text style={styles.emptyText}>{text}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: Spacing.base, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  greeting: { fontSize: Typography.sm, color: Colors.textSecondary, letterSpacing: 0.3 },
  name: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -0.5 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },

  // Clock
  clockCard: { marginBottom: Spacing.base, padding: Spacing.lg, overflow: 'hidden' },
  clockRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  clockTime: { fontSize: 52, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  clockSeconds: { fontSize: Typography.xl, fontWeight: Typography.medium, color: Colors.accent, marginBottom: 8, fontVariant: ['tabular-nums'] },
  clockDate: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },

  energyCard: { marginBottom: Spacing.base, padding: Spacing.lg, overflow: 'hidden' },
  energyLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.md },
  energyDots: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  energyCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgHighlight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  energyCircleActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent + '66' },
  energyCircleCurrent: { borderColor: Colors.accent },
  energyNum: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textMuted },
  energyNumActive: { color: Colors.accent },
  energySub: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statBox: { flex: 1, padding: Spacing.md, alignItems: 'center' },
  statValue: { fontSize: Typography.lg, fontWeight: Typography.heavy, letterSpacing: -0.5 },
  statLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },

  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  taskRowDone: { opacity: 0.5 },
  taskCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.borderLight, marginRight: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  taskCheckDone: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.textPrimary },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  taskProject: { fontSize: Typography.xs, color: Colors.textSecondary },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  emptyText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textMuted },
  emptySub: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
});
