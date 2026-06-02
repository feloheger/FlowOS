import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Animated, Modal,
  TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, FadeIn, ProgressBar, SectionHeader } from '../components/UI';

const DEFAULT_APPS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C', used: 47, limit: 60, enabled: true, category: 'social' },
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', color: '#FF0050', used: 89, limit: 45, enabled: true, category: 'social' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', used: 22, limit: 60, enabled: true, category: 'entertainment' },
  { id: 'twitter', name: 'Twitter / X', icon: 'logo-twitter', color: '#1DA1F2', used: 18, limit: 30, enabled: true, category: 'social' },
  { id: 'netflix', name: 'Netflix', icon: 'film', color: '#E50914', used: 0, limit: 90, enabled: false, category: 'entertainment' },
  { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', color: '#FF4500', used: 31, limit: 30, enabled: true, category: 'social' },
];

function minutesToHM(min) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export default function AppLimitsScreen() {
  const [apps, setApps] = useState(DEFAULT_APPS);
  const [editingApp, setEditingApp] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const totalUsed = apps.filter(a => a.enabled).reduce((s, a) => s + a.used, 0);
  const totalLimit = apps.filter(a => a.enabled).reduce((s, a) => s + a.limit, 0);
  const blocked = apps.filter(a => a.enabled && a.used >= a.limit);

  const toggleApp = (id) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const openEdit = (app) => {
    setEditingApp(app);
    setNewLimit(String(app.limit));
    setShowModal(true);
  };

  const saveLimit = () => {
    const val = parseInt(newLimit);
    if (!val || val < 1 || val > 600) {
      Alert.alert('Invalid', 'Please enter a value between 1 and 600 minutes');
      return;
    }
    setApps(prev => prev.map(a => a.id === editingApp.id ? { ...a, limit: val } : a));
    setShowModal(false);
  };

  const filteredApps = filter === 'all' ? apps : apps.filter(a => a.category === filter);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <FadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>App Limits</Text>
              <Text style={styles.pageSubtitle}>Daily screen time control</Text>
            </View>
            <View style={[styles.blockedBadge, blocked.length > 0 && styles.blockedBadgeActive]}>
              <Ionicons name="lock-closed" size={14} color={blocked.length > 0 ? Colors.danger : Colors.textMuted} />
              <Text style={[styles.blockedCount, blocked.length > 0 && { color: Colors.danger }]}>
                {blocked.length} blocked
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* Overview Card */}
        <FadeIn delay={80}>
          <Card style={styles.overviewCard}>
            <LinearGradient colors={['#6C63FF18', '#0000']} style={StyleSheet.absoluteFill} />
            <Text style={styles.overviewLabel}>Today's Usage</Text>
            <Text style={styles.overviewValue}>{minutesToHM(totalUsed)}</Text>
            <Text style={styles.overviewSub}>of {minutesToHM(totalLimit)} total limit</Text>
            <ProgressBar
              progress={Math.min(totalUsed / totalLimit, 1)}
              color={totalUsed / totalLimit > 0.8 ? Colors.danger : totalUsed / totalLimit > 0.6 ? Colors.warning : Colors.accent}
              height={10}
              style={{ marginTop: Spacing.md }}
            />
            {blocked.length > 0 && (
              <View style={styles.blockedAlert}>
                <Ionicons name="warning" size={14} color={Colors.danger} />
                <Text style={styles.blockedAlertText}>
                  {blocked.map(a => a.name).join(', ')} {blocked.length === 1 ? 'is' : 'are'} blocked for today
                </Text>
              </View>
            )}
          </Card>
        </FadeIn>

        {/* Filter Tabs */}
        <FadeIn delay={140}>
          <View style={styles.filterRow}>
            {['all', 'social', 'entertainment'].map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeIn>

        <SectionHeader title="Apps" subtitle="Tap limit to edit" />

        {filteredApps.map((app, i) => {
          const pct = Math.min(app.used / app.limit, 1);
          const isBlocked = app.used >= app.limit && app.enabled;
          const barColor = isBlocked ? Colors.danger : pct > 0.7 ? Colors.warning : app.color;

          return (
            <FadeIn key={app.id} delay={200 + i * 60}>
              <Card style={[styles.appCard, isBlocked && styles.appCardBlocked]}>
                {/* App Icon + Info */}
                <View style={styles.appRow}>
                  <View style={[styles.appIcon, { backgroundColor: app.color + '22' }]}>
                    <Ionicons name={app.icon} size={22} color={app.enabled ? app.color : Colors.textMuted} />
                    {isBlocked && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={10} color={Colors.danger} />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.appNameRow}>
                      <Text style={[styles.appName, !app.enabled && styles.appNameDisabled]}>{app.name}</Text>
                      {isBlocked && (
                        <View style={styles.blockedTag}>
                          <Text style={styles.blockedTagText}>BLOCKED</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.appStats}>
                      <Text style={styles.appUsed}>{minutesToHM(app.used)} used</Text>
                      <TouchableOpacity onPress={() => openEdit(app)}>
                        <Text style={[styles.appLimit, { color: isBlocked ? Colors.danger : Colors.accent }]}>
                          / {minutesToHM(app.limit)} limit ✎
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Switch
                    value={app.enabled}
                    onValueChange={() => toggleApp(app.id)}
                    trackColor={{ false: Colors.bgHighlight, true: Colors.accent + '66' }}
                    thumbColor={app.enabled ? Colors.accent : Colors.textMuted}
                  />
                </View>

                {/* Progress Bar */}
                {app.enabled && (
                  <ProgressBar
                    progress={pct}
                    color={barColor}
                    height={4}
                    style={{ marginTop: Spacing.sm }}
                  />
                )}

                {/* Blocked message */}
                {isBlocked && (
                  <View style={styles.blockedMsg}>
                    <Ionicons name="moon" size={12} color={Colors.danger} />
                    <Text style={styles.blockedMsgText}>Unlocks at midnight · {minutesToHM(app.used - app.limit)} over limit</Text>
                  </View>
                )}
              </Card>
            </FadeIn>
          );
        })}

        {/* Info Card */}
        <FadeIn delay={600}>
          <Card style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              Limits reset every day at midnight. Blocked apps cannot be opened until the next day. You can adjust limits anytime.
            </Text>
          </Card>
        </FadeIn>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Limit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <LinearGradient colors={['#1C1C26', '#13131A']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            {editingApp && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIcon, { backgroundColor: editingApp.color + '22' }]}>
                    <Ionicons name={editingApp.icon} size={28} color={editingApp.color} />
                  </View>
                  <Text style={styles.modalTitle}>Set Limit for {editingApp.name}</Text>
                  <Text style={styles.modalSub}>Current: {minutesToHM(editingApp.limit)} per day</Text>
                </View>

                <View style={styles.quickRow}>
                  {[15, 30, 45, 60, 90, 120].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.quickBtn, newLimit === String(m) && styles.quickBtnActive]}
                      onPress={() => setNewLimit(String(m))}
                    >
                      <Text style={[styles.quickBtnText, newLimit === String(m) && styles.quickBtnTextActive]}>
                        {minutesToHM(m)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.limitInput}
                    value={newLimit}
                    onChangeText={setNewLimit}
                    keyboardType="number-pad"
                    placeholder="Custom minutes..."
                    placeholderTextColor={Colors.textMuted}
                    maxLength={3}
                  />
                  <Text style={styles.inputUnit}>min</Text>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={saveLimit}>
                  <LinearGradient colors={[Colors.accent, '#9C94FF']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.saveBtnText}>Save Limit</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
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
  blockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  blockedBadgeActive: { borderColor: Colors.danger + '44', backgroundColor: Colors.danger + '11' },
  blockedCount: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold },

  overviewCard: { marginBottom: Spacing.base, padding: Spacing.lg },
  overviewLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  overviewValue: { fontSize: Typography.xxxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -1, marginTop: 4 },
  overviewSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  blockedAlert: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: Colors.danger + '11', borderRadius: Radius.sm },
  blockedAlertText: { fontSize: Typography.xs, color: Colors.danger, flex: 1 },

  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent + '66' },
  filterText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  filterTextActive: { color: Colors.accent },

  appCard: { marginBottom: Spacing.sm, padding: Spacing.base },
  appCardBlocked: { borderColor: Colors.danger + '33', backgroundColor: Colors.danger + '08' },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  appIcon: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  lockOverlay: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.danger + '44' },
  appNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  appName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  appNameDisabled: { color: Colors.textMuted },
  blockedTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: Colors.danger + '22' },
  blockedTagText: { fontSize: 9, fontWeight: Typography.heavy, color: Colors.danger, letterSpacing: 0.5 },
  appStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  appUsed: { fontSize: Typography.sm, color: Colors.textSecondary },
  appLimit: { fontSize: Typography.sm, fontWeight: Typography.medium },
  blockedMsg: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm },
  blockedMsgText: { fontSize: Typography.xs, color: Colors.danger },

  infoCard: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', padding: Spacing.md },
  infoText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40, overflow: 'hidden' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.xl },
  modalHeader: { alignItems: 'center', marginBottom: Spacing.xl },
  modalIcon: { width: 64, height: 64, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  quickBtn: { paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.border },
  quickBtnActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  quickBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  quickBtnTextActive: { color: Colors.accent },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgHighlight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  limitInput: { flex: 1, fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, paddingVertical: Spacing.md },
  inputUnit: { fontSize: Typography.base, color: Colors.textSecondary },
  saveBtn: { borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.sm, ...Shadow.accent },
  saveBtnGrad: { padding: Spacing.base, alignItems: 'center' },
  saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
  cancelBtn: { padding: Spacing.md, alignItems: 'center' },
  cancelText: { fontSize: Typography.base, color: Colors.textSecondary },
});
