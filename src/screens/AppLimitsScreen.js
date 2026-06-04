import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Modal, TextInput, Alert, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, FadeIn, ProgressBar, SectionHeader } from '../components/UI';
import { saveAppLimits, loadAppLimits, saveAppUsage, loadAppUsage, checkAndResetDaily } from '../data/storage';

const DEFAULT_APPS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C', limit: 60, enabled: true, category: 'social' },
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', color: '#FF0050', limit: 45, enabled: true, category: 'social' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', limit: 60, enabled: true, category: 'entertainment' },
  { id: 'twitter', name: 'Twitter / X', icon: 'logo-twitter', color: '#1DA1F2', limit: 30, enabled: true, category: 'social' },
  { id: 'netflix', name: 'Netflix', icon: 'film', color: '#E50914', limit: 90, enabled: false, category: 'entertainment' },
  { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', color: '#FF4500', limit: 30, enabled: true, category: 'social' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', limit: 45, enabled: false, category: 'social' },
  { id: 'snapchat', name: 'Snapchat', icon: 'chatbubble', color: '#FFFC00', limit: 30, enabled: false, category: 'social' },
];

function minutesToHM(min) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60 > 0 ? (min % 60) + 'm' : ''}`.trim();
}

export default function AppLimitsScreen() {
  const [apps, setApps] = useState([]);
  const [usage, setUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingApp, setEditingApp] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [trackingApp, setTrackingApp] = useState(null);
  const [trackingSeconds, setTrackingSeconds] = useState(0);
  const trackingRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Load data on mount
  useEffect(() => {
    (async () => {
      await checkAndResetDaily();
      const savedLimits = await loadAppLimits();
      const savedUsage = await loadAppUsage();
      setApps(savedLimits || DEFAULT_APPS);
      setUsage(savedUsage || {});
      setLoading(false);
    })();
  }, []);

  // Save whenever apps change
  useEffect(() => {
    if (!loading) saveAppLimits(apps);
  }, [apps]);

  // Save usage whenever it changes
  useEffect(() => {
    if (!loading) saveAppUsage(usage);
  }, [usage]);

  // Track when app goes to background (user opened another app)
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (appStateRef.current === 'active' && nextState !== 'active') {
        // App went to background - stop tracking
        stopTracking();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [trackingApp]);

  // Tracking timer
  useEffect(() => {
    if (trackingApp) {
      trackingRef.current = setInterval(() => {
        setTrackingSeconds(s => s + 1);
        setUsage(prev => {
          const newUsage = { ...prev, [trackingApp]: (prev[trackingApp] || 0) + (1/60) };
          return newUsage;
        });
      }, 1000);
    } else {
      clearInterval(trackingRef.current);
    }
    return () => clearInterval(trackingRef.current);
  }, [trackingApp]);

  const startTracking = (appId) => {
    const app = apps.find(a => a.id === appId);
    const usedMin = usage[appId] || 0;
    if (app && usedMin >= app.limit) {
      Alert.alert('App Blocked 🔒', `You've reached your daily limit for ${app.name}. It unlocks at midnight.`);
      return;
    }
    setTrackingApp(appId);
    setTrackingSeconds(0);
  };

  const stopTracking = () => {
    setTrackingApp(null);
    clearInterval(trackingRef.current);
  };

  const getUsedMinutes = (appId) => Math.floor(usage[appId] || 0);

  const toggleApp = (id) => setApps(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));

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

  const resetUsage = (appId) => {
    Alert.alert('Reset Usage', 'Reset today\'s usage for this app?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => setUsage(prev => ({ ...prev, [appId]: 0 })) },
    ]);
  };

  const filteredApps = filter === 'all' ? apps : apps.filter(a => a.category === filter);
  const totalUsed = apps.filter(a => a.enabled).reduce((s, a) => s + getUsedMinutes(a.id), 0);
  const totalLimit = apps.filter(a => a.enabled).reduce((s, a) => s + a.limit, 0);
  const blocked = apps.filter(a => a.enabled && getUsedMinutes(a.id) >= a.limit);

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

        {/* Overview */}
        <FadeIn delay={80}>
          <Card style={styles.overviewCard}>
            <LinearGradient colors={['#6C63FF18', '#0000']} style={StyleSheet.absoluteFill} />
            <Text style={styles.overviewLabel}>Today's Screen Time</Text>
            <Text style={styles.overviewValue}>{minutesToHM(totalUsed)}</Text>
            <Text style={styles.overviewSub}>of {minutesToHM(totalLimit)} total limit</Text>
            <ProgressBar
              progress={totalLimit > 0 ? Math.min(totalUsed / totalLimit, 1) : 0}
              color={totalUsed / totalLimit > 0.8 ? Colors.danger : totalUsed / totalLimit > 0.6 ? Colors.warning : Colors.accent}
              height={10}
              style={{ marginTop: Spacing.md }}
            />
            {blocked.length > 0 && (
              <View style={styles.blockedAlert}>
                <Ionicons name="warning" size={14} color={Colors.danger} />
                <Text style={styles.blockedAlertText}>
                  {blocked.map(a => a.name).join(', ')} blocked today
                </Text>
              </View>
            )}
            <Text style={styles.resetNote}>⏰ Limits reset automatically at midnight</Text>
          </Card>
        </FadeIn>

        {/* Active tracking */}
        {trackingApp && (
          <FadeIn delay={0}>
            <Card style={styles.trackingCard}>
              <LinearGradient colors={[Colors.warning + '22', '#0000']} style={StyleSheet.absoluteFill} />
              <View style={styles.trackingRow}>
                <View style={styles.trackingDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackingLabel}>Currently tracking</Text>
                  <Text style={styles.trackingApp}>{apps.find(a => a.id === trackingApp)?.name}</Text>
                </View>
                <Text style={styles.trackingTime}>{Math.floor(trackingSeconds / 60)}:{String(trackingSeconds % 60).padStart(2,'0')}</Text>
                <TouchableOpacity style={styles.stopBtn} onPress={stopTracking}>
                  <Ionicons name="stop" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </Card>
          </FadeIn>
        )}

        {/* Filter */}
        <FadeIn delay={140}>
          <View style={styles.filterRow}>
            {['all', 'social', 'entertainment'].map(f => (
              <TouchableOpacity key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]} onPress={() => setFilter(f)}>
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeIn>

        <SectionHeader title="Apps" subtitle="Tap ▶ to start tracking · tap limit to edit" />

        {filteredApps.map((app, i) => {
          const usedMin = getUsedMinutes(app.id);
          const pct = Math.min(usedMin / app.limit, 1);
          const isBlocked = usedMin >= app.limit && app.enabled;
          const isTracking = trackingApp === app.id;
          const barColor = isBlocked ? Colors.danger : pct > 0.7 ? Colors.warning : app.color;

          return (
            <FadeIn key={app.id} delay={200 + i * 50}>
              <Card style={[styles.appCard, isBlocked && styles.appCardBlocked, isTracking && styles.appCardTracking]}>
                <View style={styles.appRow}>
                  <View style={[styles.appIcon, { backgroundColor: app.color + '22' }]}>
                    <Ionicons name={app.icon} size={22} color={app.enabled ? app.color : Colors.textMuted} />
                    {isBlocked && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={10} color={Colors.danger} />
                      </View>
                    )}
                    {isTracking && (
                      <View style={[styles.lockOverlay, { backgroundColor: Colors.success + '33', borderColor: Colors.success }]}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success }} />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.appNameRow}>
                      <Text style={[styles.appName, !app.enabled && styles.appNameDisabled]}>{app.name}</Text>
                      {isBlocked && <View style={styles.blockedTag}><Text style={styles.blockedTagText}>BLOCKED</Text></View>}
                      {isTracking && <View style={[styles.blockedTag, { backgroundColor: Colors.success + '22' }]}><Text style={[styles.blockedTagText, { color: Colors.success }]}>TRACKING</Text></View>}
                    </View>
                    <View style={styles.appStats}>
                      <Text style={styles.appUsed}>{minutesToHM(usedMin)} used</Text>
                      <TouchableOpacity onPress={() => openEdit(app)}>
                        <Text style={[styles.appLimit, { color: isBlocked ? Colors.danger : Colors.accent }]}>
                          / {minutesToHM(app.limit)} ✎
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Track button */}
                  {app.enabled && !isBlocked && (
                    <TouchableOpacity
                      style={[styles.trackBtn, { backgroundColor: isTracking ? Colors.danger + '22' : app.color + '22' }]}
                      onPress={() => isTracking ? stopTracking() : startTracking(app.id)}
                    >
                      <Ionicons name={isTracking ? 'stop' : 'play'} size={16} color={isTracking ? Colors.danger : app.color} />
                    </TouchableOpacity>
                  )}

                  <Switch
                    value={app.enabled}
                    onValueChange={() => toggleApp(app.id)}
                    trackColor={{ false: Colors.bgHighlight, true: Colors.accent + '66' }}
                    thumbColor={app.enabled ? Colors.accent : Colors.textMuted}
                  />
                </View>

                {app.enabled && (
                  <ProgressBar progress={pct} color={barColor} height={4} style={{ marginTop: Spacing.sm }} />
                )}

                {isBlocked && (
                  <TouchableOpacity onPress={() => resetUsage(app.id)}>
                    <View style={styles.blockedMsg}>
                      <Ionicons name="moon" size={12} color={Colors.danger} />
                      <Text style={styles.blockedMsgText}>Blocked · {minutesToHM(usedMin - app.limit)} over limit · tap to reset</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </Card>
            </FadeIn>
          );
        })}

        <FadeIn delay={600}>
          <Card style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              Tap ▶ to manually track time spent in an app. Limits reset every midnight automatically.
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
                  <Text style={styles.modalTitle}>Set Limit – {editingApp.name}</Text>
                  <Text style={styles.modalSub}>Current: {minutesToHM(editingApp.limit)} per day</Text>
                </View>
                <View style={styles.quickRow}>
                  {[15, 30, 45, 60, 90, 120].map(m => (
                    <TouchableOpacity key={m} style={[styles.quickBtn, newLimit === String(m) && styles.quickBtnActive]} onPress={() => setNewLimit(String(m))}>
                      <Text style={[styles.quickBtnText, newLimit === String(m) && styles.quickBtnTextActive]}>{minutesToHM(m)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.inputRow}>
                  <TextInput style={styles.limitInput} value={newLimit} onChangeText={setNewLimit} keyboardType="number-pad" placeholder="Custom..." placeholderTextColor={Colors.textMuted} maxLength={3} />
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
  overviewCard: { marginBottom: Spacing.base, padding: Spacing.lg, overflow: 'hidden' },
  overviewLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  overviewValue: { fontSize: Typography.xxxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -1, marginTop: 4 },
  overviewSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  blockedAlert: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: Colors.danger + '11', borderRadius: Radius.sm },
  blockedAlertText: { fontSize: Typography.xs, color: Colors.danger, flex: 1 },
  resetNote: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: Spacing.sm },
  trackingCard: { marginBottom: Spacing.sm, padding: Spacing.md, overflow: 'hidden' },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  trackingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  trackingLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  trackingApp: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  trackingTime: { fontSize: Typography.lg, fontWeight: Typography.heavy, color: Colors.warning },
  stopBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.danger + '22', alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent + '66' },
  filterText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  filterTextActive: { color: Colors.accent },
  appCard: { marginBottom: Spacing.sm, padding: Spacing.base },
  appCardBlocked: { borderColor: Colors.danger + '33', backgroundColor: Colors.danger + '08' },
  appCardTracking: { borderColor: Colors.success + '44' },
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
  trackBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  blockedMsg: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm },
  blockedMsgText: { fontSize: Typography.xs, color: Colors.danger },
  infoCard: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', padding: Spacing.md },
  infoText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },
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
  saveBtn: { borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.sm },
  saveBtnGrad: { padding: Spacing.base, alignItems: 'center' },
  saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
  cancelBtn: { padding: Spacing.md, alignItems: 'center' },
  cancelText: { fontSize: Typography.base, color: Colors.textSecondary },
});
