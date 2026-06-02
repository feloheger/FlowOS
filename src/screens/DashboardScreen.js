import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Card, ProgressBar, FadeIn, SectionHeader, StatusPill, EnergyDot } from '../components/UI';
import { initialProjects, initialTodayTasks } from '../data/initialData';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [energy, setEnergy] = useState(3);
  const [tasks, setTasks] = useState(initialTodayTasks);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const completedToday = tasks.filter(t => t.done).length;
  const totalToday = tasks.length;

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#12122088', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <FadeIn delay={0}>
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>Alex 👋</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </Animated.View>
        </FadeIn>

        {/* Energy Check */}
        <FadeIn delay={80}>
          <Card style={styles.energyCard}>
            <LinearGradient
              colors={['#6C63FF18', '#6C63FF05']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.energyLabel}>Today's Energy</Text>
            <View style={styles.energyDots}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setEnergy(i)}>
                  <View style={[
                    styles.energyCircle,
                    i <= energy && styles.energyCircleActive,
                    i === energy && styles.energyCircleCurrent,
                  ]}>
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

        {/* Daily Overview */}
        <FadeIn delay={160}>
          <View style={styles.statsRow}>
            <StatBox label="Tasks" value={`${completedToday}/${totalToday}`} color={Colors.accent} icon="checkmark-circle" />
            <StatBox label="Focus hrs" value="3.5" color={Colors.success} icon="time" />
            <StatBox label="Projects" value={`${initialProjects.filter(p => p.status === 'on_track').length} ✓`} color={Colors.warning} icon="folder" />
          </View>
        </FadeIn>

        {/* Today's Tasks */}
        <FadeIn delay={240}>
          <SectionHeader title="Today's Stack" subtitle={`${completedToday} of ${totalToday} done`} action="Add" />
          {tasks.map((task, i) => (
            <FadeIn key={task.id} delay={300 + i * 60}>
              <TouchableOpacity onPress={() => toggleTask(task.id)} activeOpacity={0.8}>
                <View style={[styles.taskRow, task.done && styles.taskRowDone]}>
                  <View style={[styles.taskCheck, task.done && styles.taskCheckDone]}>
                    {task.done && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
                    <View style={styles.taskMeta}>
                      <EnergyDot level={task.energy} />
                      <Text style={styles.taskProject}>{task.project}</Text>
                      <Text style={styles.taskDuration}>· {task.duration}min</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </FadeIn>
          ))}
        </FadeIn>

        {/* Active Projects */}
        <FadeIn delay={480}>
          <SectionHeader title="Active Projects" action="All" style={{ marginTop: Spacing.xl }} />
          {initialProjects.map((p, i) => (
            <FadeIn key={p.id} delay={540 + i * 80}>
              <Card style={styles.projectCard} onPress={() => navigation.navigate('Projects')}>
                <View style={styles.projectHeader}>
                  <View style={[styles.projectDot, { backgroundColor: p.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectTitle}>{p.title}</Text>
                    <Text style={styles.projectDesc}>{p.description}</Text>
                  </View>
                  <StatusPill status={p.status} />
                </View>
                <View style={styles.projectFooter}>
                  <ProgressBar progress={p.progress} color={p.color} style={{ flex: 1, marginRight: Spacing.md }} />
                  <Text style={[styles.projectPct, { color: p.color }]}>{Math.round(p.progress * 100)}%</Text>
                </View>
              </Card>
            </FadeIn>
          ))}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: Spacing.base, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: Typography.sm, color: Colors.textSecondary, letterSpacing: 0.3 },
  name: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -0.5 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, position: 'absolute', top: 10, right: 10, borderWidth: 2, borderColor: Colors.bg },

  energyCard: { marginBottom: Spacing.base, padding: Spacing.lg },
  energyLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.md },
  energyDots: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  energyCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgHighlight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  energyCircleActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent + '66' },
  energyCircleCurrent: { borderColor: Colors.accent, ...{ shadowColor: Colors.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 } },
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
  taskDuration: { fontSize: Typography.xs, color: Colors.textMuted },

  projectCard: { marginBottom: Spacing.sm },
  projectHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  projectDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, marginRight: Spacing.sm },
  projectTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  projectDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  projectFooter: { flexDirection: 'row', alignItems: 'center' },
  projectPct: { fontSize: Typography.sm, fontWeight: Typography.bold, width: 36, textAlign: 'right' },
});
