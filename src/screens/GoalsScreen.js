import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, ProgressBar, FadeIn, SectionHeader } from '../components/UI';
import { initialGoals, initialProjects } from '../data/initialData';

export default function GoalsScreen() {
  const [goals] = useState(initialGoals);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <FadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>Vision</Text>
              <Text style={styles.pageSubtitle}>Your 2024 goals</Text>
            </View>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Vision Statement */}
        <FadeIn delay={80}>
          <Card style={styles.visionCard}>
            <LinearGradient colors={['#6C63FF22', '#6C63FF05']} style={StyleSheet.absoluteFill} />
            <Text style={styles.visionLabel}>5-Year Vision</Text>
            <Text style={styles.visionText}>"Build products that matter, live with freedom, grow every day."</Text>
          </Card>
        </FadeIn>

        <SectionHeader title="Annual Goals" subtitle={`${goals.length} goals set`} />

        {goals.map((goal, i) => {
          const linked = initialProjects.filter(p => p.goal === goal.id);
          const avgProgress = linked.length > 0
            ? linked.reduce((a, p) => a + p.progress, 0) / linked.length
            : 0;

          return (
            <FadeIn key={goal.id} delay={160 + i * 80}>
              <Card style={styles.goalCard}>
                <View style={[styles.goalAccent, { backgroundColor: goal.color }]} />
                <View style={styles.goalContent}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalYear}>{goal.year}</Text>
                  <ProgressBar progress={avgProgress} color={goal.color} style={{ marginTop: Spacing.md }} />
                  <View style={styles.goalMeta}>
                    <Text style={styles.goalPct}>{Math.round(avgProgress * 100)}% complete</Text>
                    <Text style={styles.goalProjects}>{linked.length} project{linked.length !== 1 ? 's' : ''}</Text>
                  </View>
                  {linked.map(p => (
                    <View key={p.id} style={styles.linkedProject}>
                      <View style={[styles.linkDot, { backgroundColor: p.color }]} />
                      <Text style={styles.linkText}>{p.title}</Text>
                      <Text style={[styles.linkPct, { color: p.color }]}>{Math.round(p.progress * 100)}%</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </FadeIn>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
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

  visionCard: { marginBottom: Spacing.xl, padding: Spacing.lg },
  visionLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  visionText: { fontSize: Typography.md, color: Colors.textPrimary, fontStyle: 'italic', lineHeight: 24, fontWeight: Typography.medium },

  goalCard: { marginBottom: Spacing.md, padding: 0, overflow: 'hidden', flexDirection: 'row' },
  goalAccent: { width: 4, borderRadius: Radius.lg },
  goalContent: { flex: 1, padding: Spacing.base },
  goalTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  goalYear: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  goalPct: { fontSize: Typography.xs, color: Colors.textSecondary },
  goalProjects: { fontSize: Typography.xs, color: Colors.textMuted },
  linkedProject: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.sm },
  linkDot: { width: 6, height: 6, borderRadius: 3 },
  linkText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },
  linkPct: { fontSize: Typography.xs, fontWeight: Typography.semibold },
});
