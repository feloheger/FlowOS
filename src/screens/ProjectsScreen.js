import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, ProgressBar, FadeIn, StatusPill, SectionHeader } from '../components/UI';
import { initialProjects } from '../data/initialData';

export default function ProjectsScreen() {
  const [projects, setProjects] = useState(initialProjects);
  const [selected, setSelected] = useState(null);

  const totalBudget = projects.reduce((a, p) => a + p.budget, 0);
  const usedBudget = projects.reduce((a, p) => a + p.budgetUsed, 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>Projects</Text>
              <Text style={styles.pageSubtitle}>{projects.length} active · {projects.filter(p => p.status === 'on_track').length} on track</Text>
            </View>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Budget Overview */}
        <FadeIn delay={80}>
          <Card style={styles.budgetCard}>
            <LinearGradient colors={['#6C63FF18', '#0000']} style={StyleSheet.absoluteFill} />
            <Text style={styles.budgetLabel}>Total Budget</Text>
            <Text style={styles.budgetValue}>€{usedBudget.toLocaleString()} <Text style={styles.budgetTotal}>/ €{totalBudget.toLocaleString()}</Text></Text>
            <ProgressBar progress={usedBudget / totalBudget} color={Colors.accent} height={8} style={{ marginTop: Spacing.md }} />
            <View style={styles.budgetRow}>
              <Text style={styles.budgetNote}>Used: {Math.round(usedBudget / totalBudget * 100)}%</Text>
              <Text style={styles.budgetNote}>Remaining: €{(totalBudget - usedBudget).toLocaleString()}</Text>
            </View>
          </Card>
        </FadeIn>

        {/* Projects List */}
        <SectionHeader title="All Projects" subtitle="Tap to expand" />
        {projects.map((project, i) => (
          <FadeIn key={project.id} delay={160 + i * 80}>
            <Card style={[styles.projectCard, selected === project.id && styles.projectCardExpanded]} onPress={() => setSelected(selected === project.id ? null : project.id)}>
              {/* Project Header */}
              <View style={styles.projectTop}>
                <View style={[styles.colorBadge, { backgroundColor: project.color + '22', borderColor: project.color + '44' }]}>
                  <View style={[styles.colorDot, { backgroundColor: project.color }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectDesc}>{project.description}</Text>
                </View>
                <View style={styles.rightCol}>
                  <StatusPill status={project.status} />
                  <Ionicons
                    name={selected === project.id ? 'chevron-up' : 'chevron-down'}
                    size={16} color={Colors.textMuted}
                    style={{ marginTop: 6 }}
                  />
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressRow}>
                <ProgressBar progress={project.progress} color={project.color} style={{ flex: 1 }} />
                <Text style={[styles.progressPct, { color: project.color }]}>{Math.round(project.progress * 100)}%</Text>
              </View>

              {/* Deadline + Budget quick row */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{project.deadline}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="wallet-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.metaText}>€{project.budgetUsed} / €{project.budget}</Text>
                </View>
              </View>

              {/* Expanded: Tasks */}
              {selected === project.id && (
                <View style={styles.taskSection}>
                  <View style={styles.divider} />
                  <Text style={styles.taskSectionLabel}>Tasks</Text>
                  {project.tasks.map(task => (
                    <View key={task.id} style={styles.taskRow}>
                      <View style={[styles.taskDot, task.done && { backgroundColor: project.color }]}>
                        {task.done && <Ionicons name="checkmark" size={10} color="#fff" />}
                      </View>
                      <Text style={[styles.taskText, task.done && styles.taskDone]}>{task.title}</Text>
                      <View style={[styles.energyTag, { backgroundColor: energyColor(task.energy) + '22' }]}>
                        <Text style={[styles.energyTagText, { color: energyColor(task.energy) }]}>{task.energy}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </FadeIn>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function energyColor(level) {
  return level === 'high' ? Colors.danger : level === 'medium' ? Colors.warning : Colors.success;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.base, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  pageTitle: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', ...Shadow.accent },

  budgetCard: { marginBottom: Spacing.xl, padding: Spacing.lg },
  budgetLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs },
  budgetValue: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary },
  budgetTotal: { fontSize: Typography.lg, color: Colors.textMuted, fontWeight: Typography.regular },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  budgetNote: { fontSize: Typography.xs, color: Colors.textSecondary },

  projectCard: { marginBottom: Spacing.sm, padding: Spacing.base },
  projectCardExpanded: { borderColor: Colors.borderLight },
  projectTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  colorBadge: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, borderWidth: 1 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  rightCol: { alignItems: 'flex-end' },
  projectTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  projectDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  progressPct: { fontSize: Typography.sm, fontWeight: Typography.bold, width: 36, textAlign: 'right' },
  metaRow: { flexDirection: 'row', gap: Spacing.base },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.xs, color: Colors.textMuted },

  taskSection: { marginTop: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  taskSectionLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  taskDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.borderLight, marginRight: Spacing.sm, alignItems: 'center', justifyContent: 'center' },
  taskText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },
  taskDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  energyTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  energyTagText: { fontSize: 10, fontWeight: Typography.semibold },
});
