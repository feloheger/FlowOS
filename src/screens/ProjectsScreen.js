import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, ProgressBar, FadeIn, SectionHeader, StatusPill } from '../components/UI';

export default function ProjectsScreen() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const addProject = () => {
    if (!newTitle.trim()) return;
    const colors = ['#6C63FF', '#4ECDC4', '#FFD93D', '#FF6B6B', '#74B9FF'];
    setProjects(prev => [...prev, {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDesc.trim() || 'No description',
      color: colors[prev.length % colors.length],
      progress: 0,
      status: 'on_track',
      deadline: '-',
      budget: 0,
      budgetUsed: 0,
      tasks: [],
    }]);
    setNewTitle('');
    setNewDesc('');
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <FadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>Projects</Text>
              <Text style={styles.pageSubtitle}>{projects.length} active</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </FadeIn>

        {projects.length === 0 ? (
          <FadeIn delay={100}>
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No projects yet</Text>
              <Text style={styles.emptySub}>Tap + to create your first project</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
                <Text style={styles.emptyBtnText}>Create Project</Text>
              </TouchableOpacity>
            </View>
          </FadeIn>
        ) : (
          projects.map((project, i) => (
            <FadeIn key={project.id} delay={100 + i * 80}>
              <Card style={styles.projectCard} onPress={() => setSelected(selected === project.id ? null : project.id)}>
                <View style={styles.projectTop}>
                  <View style={[styles.colorBadge, { backgroundColor: project.color + '22', borderColor: project.color + '44' }]}>
                    <View style={[styles.colorDot, { backgroundColor: project.color }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.projectDesc}>{project.description}</Text>
                  </View>
                  <StatusPill status={project.status} />
                </View>
                <View style={styles.progressRow}>
                  <ProgressBar progress={project.progress} color={project.color} style={{ flex: 1 }} />
                  <Text style={[styles.progressPct, { color: project.color }]}>{Math.round(project.progress * 100)}%</Text>
                </View>
              </Card>
            </FadeIn>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <LinearGradient colors={['#1C1C26', '#13131A']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Project</Text>
            <TextInput style={styles.input} value={newTitle} onChangeText={setNewTitle} placeholder="Project name..." placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={newDesc} onChangeText={setNewDesc} placeholder="Description (optional)..." placeholderTextColor={Colors.textMuted} />
            <TouchableOpacity style={styles.saveBtn} onPress={addProject}>
              <LinearGradient colors={[Colors.accent, '#9C94FF']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.saveBtnText}>Create Project</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
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

  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  emptyText: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textMuted },
  emptySub: { fontSize: Typography.sm, color: Colors.textMuted },
  emptyBtn: { marginTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.accentSoft, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.accent + '66' },
  emptyBtnText: { color: Colors.accent, fontWeight: Typography.semibold },

  projectCard: { marginBottom: Spacing.sm, padding: Spacing.base },
  projectTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  colorBadge: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, borderWidth: 1 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  projectTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  projectDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressPct: { fontSize: Typography.sm, fontWeight: Typography.bold, width: 36, textAlign: 'right' },

  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40, overflow: 'hidden' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  input: { backgroundColor: Colors.bgHighlight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  saveBtn: { borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.sm },
  saveBtnGrad: { padding: Spacing.base, alignItems: 'center' },
  saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
  cancelBtn: { padding: Spacing.md, alignItems: 'center' },
  cancelText: { fontSize: Typography.base, color: Colors.textSecondary },
});
