import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Modal, TextInput, Alert, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, FadeIn, ProgressBar, SectionHeader } from '../components/UI';
import {
  saveAppLimits, loadAppLimits, saveAppUsage, loadAppUsage,
  checkAndResetDaily, loadXP, loadSubscription, activateSubscription, cancelSubscription,
} from '../data/storage';
import AppBlockedScreen from './AppBlockedScreen';

const DEFAULT_APPS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C', limit: 60, enabled: true, category: 'social' },
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', color: '#FF0050', limit: 45, enabled: true, category: 'social' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', limit: 60, enabled: true, category: 'entertainment' },
  { id: 'twitter', name: 'Twitter / X', icon: 'logo-twitter', color: '#1DA1F2', limit: 30, enabled: true, category: 'social' },
  { id: 'netflix', name: 'Netflix', icon: 'film', color: '#E50914', limit: 90, enabled: false, category: 'entertainment' },
  { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', color: '#FF4500', limit: 30, enabled: true, category: 'social' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', limit: 45, enabled: false, category: 'social' },
  { id: 'snapchat', name: 'chatbubble', icon: 'chatbubble', color: '#FFFC00', limit: 30, enabled: false, category: 'social' },
];

function minutesToHM(min) {
  if (min < 1) return '0m';
  if (min < 60) return `${Math.floor(min)}m`;
  return `${Math.floor(min / 60)}h ${Math.floor(min % 60) > 0 ? Math.floor(min % 60) + 'm' : ''}`.trim();
}

export default function AppLimitsScreen() {
  const [apps, setApps] = useState([]);
  const [usage, setUsage] = useState({});
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingApp, setEditingApp] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [trackingApp, setTrackingApp] = useState(null);
  const [trackingSeconds, setTrackingSeconds] = useState(0);
  const [blockedApp, setBlockedApp] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  const trackingRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  // ─── NEW: timestamp when app went to background ───────────────────────────
  const backgroundStartRef = useRef(null);
  const trackingAppRef = useRef(null); // mirror of trackingApp for use in callbacks
  const appsRef = useRef([]);          // mirror of apps for use in callbacks
  const usageRef = useRef({});         // mirror of usage for saving from callbacks

  // Keep refs in sync
  useEffect(() => { trackingAppRef.current = trackingApp; }, [trackingApp]);
  useEffect(() => { appsRef.current = apps; }, [apps]);
  useEffect(() => { usageRef.current = usage; }, [usage]);

  useEffect(() => {
    (async () => {
      await checkAndResetDaily();
      const savedLimits = await loadAppLimits();
      const savedUsage = await loadAppUsage();
      const savedXP = await loadXP();
      const sub = await loadSubscription();
      setApps(savedLimits || DEFAULT_APPS);
      setUsage(savedUsage || {});
      setXp(savedXP);
      setIsPro(sub?.active || false);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { if (!loading) saveAppLimits(apps); }, [apps]);
  useEffect(() => { if (!loading) saveAppUsage(usage); }, [usage]);

  // ─── AppState listener: automatic background time accumulation ─────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      const currentTracking = trackingAppRef.current;

      if (prev === 'active' && nextState !== 'active') {
        // App going to background
        if (currentTracking) {
          backgroundStartRef.current = Date.now();
          // Stop the foreground interval — time will be settled on return
          clearInterval(trackingRef.current);
        }
      } else if (prev !== 'active' && nextState === 'active') {
        // App coming back to foreground
        if (currentTracking && backgroundStartRef.current) {
          const elapsedMs = Date.now() - backgroundStartRef.current;
          const elapsedMin = elapsedMs / 1000 / 60;
          backgroundStartRef.current = null;

          setUsage(prev => {
            const newUsage = {
              ...prev,
              [currentTracking]: (prev[currentTracking] || 0) + elapsedMin,
            };
            saveAppUsage(newUsage); // persist immediately

            // Check limit after returning
            const app = appsRef.current.find(a => a.id === currentTracking);
            const offset = newUsage[`${currentTracking}_offset`] || 0;
            const effectiveLimit = app ? app.limit + offset : 0;
            if (app && newUsage[currentTracking] >= effectiveLimit) {
              stopTracking();
              setBlockedApp({ ...app, used: Math.floor(newUsage[currentTracking]) });
            } else {
              // Restart foreground interval
              _startInterval(currentTracking);
            }
            return newUsage;
          });

          setTrackingSeconds(s => s + Math.floor(elapsedMs / 1000));
        }
      }
    });
    return () => sub.remove();
  }, []); // intentionally empty — uses refs

  // ─── Foreground interval ───────────────────────────────────────────────────
  const _startInterval = (appId) => {
    clearInterval(trackingRef.current);
    trackingRef.current = setInterval(() => {
      setTrackingSeconds(s => s + 1);
      setUsage(prev => {
        const newUsage = { ...prev, [appId]: (prev[appId] || 0) + (1 / 60) };
        const app = appsRef.current.find(a => a.id === appId);
        const offset = newUsage[`${appId}_offset`] || 0;
        const effectiveLimit = app ? app.limit + offset : 0;
        if (app && newUsage[appId] >= effectiveLimit) {
          stopTracking();
          setBlockedApp({ ...app, used: Math.floor(newUsage[appId]) });
        }
        return newUsage;
      });
    }, 1000);
  };

  useEffect(() => {
    if (trackingApp) {
      _startInterval(trackingApp);
    } else {
      clearInterval(trackingRef.current);
    }
    return () => clearInterval(trackingRef.current);
  }, [trackingApp]);

  const getUsedMinutes = (appId) => usage[appId] || 0;
  const getOffset = (appId) => usage[`${appId}_offset`] || 0;
  const getEffectiveLimit = (app) => app.limit + getOffset(app.id);

  const startTracking = (app) => {
    const usedMin = getUsedMinutes(app.id);
    const effectiveLimit = getEffectiveLimit(app);
    if (usedMin >= effectiveLimit) {
      setBlockedApp({ ...app, used: Math.floor(usedMin) });
      return;
    }
    setTrackingApp(app.id);
    setTrackingSeconds(0);
  };

  const stopTracking = () => {
    setTrackingApp(null);
    clearInterval(trackingRef.current);
    backgroundStartRef.current = null;
  };

  const toggleApp = (id) => setApps(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));

  const openEdit = (app) => {
    setEditingApp(app);
    setNewLimit(String(app.limit));
    setShowEditModal(true);
  };

  const saveLimit = () => {
    const val = parseInt(newLimit);
    if (!val || val < 1 || val > 600) { Alert.alert('Invalid', 'Enter 1–600 minutes'); return; }
    setApps(prev => prev.map(a => a.id === editingApp.id ? { ...a, limit: val } : a));
    setShowEditModal(false);
  };

  // ─── Pro / 2x XP toggle ───────────────────────────────────────────────────
  const handleProToggle = async () => {
    if (isPro) {
      await cancelSubscription();
      setIsPro(false);
      Alert.alert('Pro deaktiviert', '2x XP ist jetzt aus.');
    } else {
      await activateSubscription();
      setIsPro(true);
      Alert.alert('Pro aktiviert! 🎉', 'Du bekommst jetzt 2x XP für alle Habits!');
    }
  };

  const filteredApps = filter === 'all' ? apps : apps.filter(a => a.category === filter);
  const totalUsed = apps.filter(a => a.enabled).reduce((s, a) => s + getUsedMinutes(a.id), 0);
  const totalLimit = apps.filter(a => a.enabled).reduce((s, a) => s + getEffectiveLimit(a), 0);
  const blocked = apps.filter(a => a.enabled && getUsedMinutes(a.id) >= getEffectiveLimit(a));

  if (loading) return <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: Colors.textSecondary }}>Loading...</Text></View>;

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
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>⚡ {xp} XP</Text>
              </View>
              {/* ─── 2x XP Pro Badge ─── */}
              <TouchableOpacity onPress={handleProToggle} style={[styles.proBadge, isPro && styles.proBadgeActive]}>
                <Text style={[styles.proBadgeText, isPro && styles.proBadgeTextActive]}>
                  {isPro ? '⭐ 2x XP AN' : '⭐ 2x XP'}
                </Text>
              </TouchableOpacity>
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
            <View style={styles.overviewFooter}>
              {blocked.length > 0 && (
                <View style={styles.blockedAlert}>
                  <Ionicons name="lock-closed" size={12} color={Colors.danger} />
                  <Text style={styles.blockedAlertText}>{blocked.length} app{blocked.length > 1 ? 's' : ''} blocked</Text>
                </View>
              )}
              <Text style={styles.resetNote}>⏰ Resets at midnight</Text>
            </View>
          </Card>
        </FadeIn>

        {/* XP Extend Info */}
        <FadeIn delay={120}>
          <Card style={styles.xpInfoCard}>
            <View style={styles.xpInfoRow}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.xpInfoTitle}>Extend with XP</Text>
                <Text style={styles.xpInfoSub}>Spend 60 XP to unlock +30 min for any app · You have {xp} XP</Text>
              </View>
            </View>
          </Card>
        </FadeIn>

        {/* ─── Auto-Tracking Hint ─── */}
        <FadeIn delay={130}>
          <Card style={styles.xpInfoCard}>
            <View style={styles.xpInfoRow}>
              <Text style={{ fontSize: 20 }}>📱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.xpInfoTitle}>Auto-Tracking</Text>
                <Text style={styles.xpInfoSub}>
                  Tippe ▶ bei einer App um das Tracking zu starten. Die Zeit läuft auch im Hintergrund weiter — egal ob du in TikTok oder einer anderen App bist.
                </Text>
              </View>
            </View>
          </Card>
        </FadeIn>

        {/* Active tracking */}
        {trackingApp && (
          <FadeIn delay={0}>
            <Card style={styles.trackingCard}>
              <LinearGradient colors={[Colors.success + '22', '#0000']} style={StyleSheet.absoluteFill} />
              <View style={styles.trackingRow}>
                <View style={styles.trackingDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackingLabel}>Tracking (auch im Hintergrund)</Text>
                  <Text style={styles.trackingApp}>{apps.find(a => a.id === trackingApp)?.name}</Text>
                </View>
                <Text style={styles.trackingTime}>{Math.floor(trackingSeconds / 60)}:{String(trackingSeconds % 60).padStart(2, '0')}</Text>
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
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeIn>

        <SectionHeader title="Apps" subtitle="▶ track · limit to edit" />

        {filteredApps.map((app, i) => {
          const usedMin = getUsedMinutes(app.id);
          const effectiveLimit = getEffectiveLimit(app);
          const offset = getOffset(app.id);
          const pct = Math.min(usedMin / effectiveLimit, 1);
          const isBlocked = usedMin >= effectiveLimit && app.enabled;
          const isTracking = trackingApp === app.id;
          const barColor = isBlocked ? Colors.danger : pct > 0.7 ? Colors.warning : app.color;

          return (
            <FadeIn key={app.id} delay={200 + i * 50}>
              <Card style={[styles.appCard, isBlocked && styles.appCardBlocked, isTracking && styles.appCardTracking]}>
                <View style={styles.appRow}>
                  <TouchableOpacity
                    style={[styles.appIcon, { backgroundColor: app.color + '22' }]}
                    onPress={() => isBlocked ? setBlockedApp({ ...app, used: Math.floor(usedMin) }) : startTracking(app)}
                  >
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
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <View style={styles.appNameRow}>
                      <Text style={[styles.appName, !app.enabled && { color: Colors.textMuted }]}>{app.name}</Text>
                      {isBlocked && <View style={styles.blockedTag}><Text style={styles.blockedTagText}>BLOCKED</Text></View>}
                      {isTracking && <View style={[styles.blockedTag, { backgroundColor: Colors.success + '22' }]}><Text style={[styles.blockedTagText, { color: Colors.success }]}>LIVE</Text></View>}
                      {offset > 0 && <View style={[styles.blockedTag, { backgroundColor: Colors.warning + '22' }]}><Text style={[styles.blockedTagText, { color: Colors.warning }]}>+{offset}m</Text></View>}
                    </View>
                    <View style={styles.appStats}>
                      <Text style={styles.appUsed}>{minutesToHM(usedMin)}</Text>
                      <TouchableOpacity onPress={() => openEdit(app)}>
                        <Text style={[styles.appLimit, { color: isBlocked ? Colors.danger : Colors.accent }]}>
                          / {minutesToHM(effectiveLimit)} ✎
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {app.enabled && !isBlocked && (
                    <TouchableOpacity
                      style={[styles.trackBtn, { backgroundColor: isTracking ? Colors.danger + '22' : app.color + '22' }]}
                      onPress={() => isTracking ? stopTracking() : startTracking(app)}
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

                {app.enabled && <ProgressBar progress={pct} color={barColor} height={4} style={{ marginTop: Spacing.sm }} />}

                {isBlocked && (
                  <TouchableOpacity onPress={() => setBlockedApp({ ...app, used: Math.floor(usedMin) })}>
                    <View style={styles.blockedMsg}>
                      <Ionicons name="lock-closed" size={12} color={Colors.danger} />
                      <Text style={styles.blockedMsgText}>Tap to extend with XP or wait until midnight</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </Card>
            </FadeIn>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <LinearGradient colors={['#1C1C26', '#13131A']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            {editingApp && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconWrap, { backgroundColor: editingApp.color + '22' }]}>
                    <Ionicons name={editingApp.icon} size={28} color={editingApp.color} />
                  </View>
                  <Text style={styles.modalTitle}>{editingApp.name}</Text>
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
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Blocked Screen */}
      <AppBlockedScreen
        visible={!!blockedApp}
        app={blockedApp}
        onClose={() => setBlockedApp(null)}
        onExtended={async () => {
          const savedUsage = await loadAppUsage();
          const savedXP = await loadXP();
          setUsage(savedUsage);
          setXp(savedXP);
          setBlockedApp(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.base, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  pageTitle: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  xpBadge: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.warning + '22', borderWidth: 1, borderColor: Colors.warning + '44' },
  xpBadgeText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.warning },
  proBadge: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.border },
  proBadgeActive: { backgroundColor: '#6C63FF22', borderColor: '#6C63FF88' },
  proBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textMuted },
  proBadgeTextActive: { color: '#A29BFE' },
  overviewCard: { marginBottom: Spacing.sm, padding: Spacing.lg, overflow: 'hidden' },
  overviewLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  overviewValue: { fontSize: Typography.xxxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -1, marginTop: 4 },
  overviewSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  overviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  blockedAlert: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  blockedAlertText: { fontSize: Typography.xs, color: Colors.danger },
  resetNote: { fontSize: Typography.xs, color: Colors.textMuted },
  xpInfoCard: { marginBottom: Spacing.base, padding: Spacing.md },
  xpInfoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  xpInfoTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  xpInfoSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  trackingCard: { marginBottom: Spacing.sm, padding: Spacing.md, overflow: 'hidden' },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  trackingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  trackingLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  trackingApp: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  trackingTime: { fontSize: Typography.lg, fontWeight: Typography.heavy, color: Colors.warning },
  stopBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.danger + '22', alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  filterText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  filterTextActive: { color: Colors.accent },
  appCard: { marginBottom: Spacing.sm, padding: Spacing.base },
  appCardBlocked: { borderColor: Colors.danger + '33', backgroundColor: Colors.danger + '06' },
  appCardTracking: { borderColor: Colors.success + '44' },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  appIcon: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  lockOverlay: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.danger + '44' },
  appNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  appName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  blockedTag: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: Colors.danger + '22' },
  blockedTagText: { fontSize: 9, fontWeight: Typography.heavy, color: Colors.danger, letterSpacing: 0.4 },
  appStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  appUsed: { fontSize: Typography.sm, color: Colors.textSecondary },
  appLimit: { fontSize: Typography.sm, fontWeight: Typography.medium },
  trackBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  blockedMsg: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm },
  blockedMsgText: { fontSize: Typography.xs, color: Colors.danger },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40, overflow: 'hidden' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.xl },
  modalHeader: { alignItems: 'center', marginBottom: Spacing.xl },
  modalIconWrap: { width: 64, height: 64, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
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
