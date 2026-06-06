import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Modal, TextInput, Alert, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Card, FadeIn, ProgressBar, SectionHeader } from '../components/UI';
import {
  saveAppLimits, loadAppLimits, saveAppUsage, loadAppUsage,
  checkAndResetDaily, loadXP, loadSubscription, activateSubscription, cancelSubscription,
} from '../data/storage';
import AppBlockedScreen from './AppBlockedScreen';
import { updateBlocklist, getNativeUsageData } from '../native/AppBlocker';

const DEFAULT_APPS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C', limit: 60, enabled: true, category: 'social', packageName: 'com.instagram.android' },
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', color: '#FF0050', limit: 45, enabled: true, category: 'social', packageName: 'com.zhiliaoapp.musically' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', limit: 60, enabled: true, category: 'entertainment', packageName: 'com.google.android.youtube' },
  { id: 'twitter', name: 'Twitter / X', icon: 'logo-twitter', color: '#1DA1F2', limit: 30, enabled: true, category: 'social', packageName: 'com.twitter.android' },
  { id: 'netflix', name: 'Netflix', icon: 'film', color: '#E50914', limit: 90, enabled: false, category: 'entertainment', packageName: 'com.netflix.mediaclient' },
  { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', color: '#FF4500', limit: 30, enabled: true, category: 'social', packageName: 'com.reddit.frontpage' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', limit: 45, enabled: false, category: 'social', packageName: 'com.whatsapp' },
  { id: 'snapchat', name: 'Snapchat', icon: 'chatbubble', color: '#FFFC00', limit: 30, enabled: false, category: 'social', packageName: 'com.snapchat.android' },
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
  const [blockedApp, setBlockedApp] = useState(null);
  const [isPro, setIsPro] = useState(false);

  const appsRef = useRef([]);
  const pollRef = useRef(null);
  const [debugInfo, setDebugInfo] = useState('Initialisiere...');

  useEffect(() => { appsRef.current = apps; }, [apps]);

  // ─── Load on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await checkAndResetDaily();
      const savedLimits = await loadAppLimits();
      const savedUsage = await loadAppUsage();
      const savedXP = await loadXP();
      const sub = await loadSubscription();
      const appList = savedLimits || DEFAULT_APPS;
      setApps(appList);
      setUsage(savedUsage || {});
      setXp(savedXP);
      setIsPro(sub?.active || false);
      setLoading(false);

      // Push limits to native service immediately
      pushToNative(appList, savedUsage || {});
    })();
  }, []);

  // ─── Poll native service every 5 seconds for live usage data ─────────────
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const nativeUsage = await getNativeUsageData();
        setDebugInfo('🔄 Letzte Abfrage: ' + new Date().toLocaleTimeString() + ' · ' + Object.keys(nativeUsage||{}).length + ' Einträge');
        if (nativeUsage && Object.keys(nativeUsage).length > 0) {
          // Map package names back to app ids
          const mapped = {};
          appsRef.current.forEach(app => {
            if (app.packageName && nativeUsage[app.packageName] !== undefined) {
              mapped[app.id] = nativeUsage[app.packageName];
            }
          });
          if (Object.keys(mapped).length > 0) {
            setUsage(prev => {
              const merged = { ...prev, ...mapped };
              saveAppUsage(merged);
              return merged;
            });
          }
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(pollRef.current);
  }, []);

  // ─── Re-check when app comes to foreground ───────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        try {
          const nativeUsage = await getNativeUsageData();
          if (nativeUsage && Object.keys(nativeUsage).length > 0) {
            const mapped = {};
            appsRef.current.forEach(app => {
              if (app.packageName && nativeUsage[app.packageName] !== undefined) {
                mapped[app.id] = nativeUsage[app.packageName];
              }
            });
            if (Object.keys(mapped).length > 0) {
              setUsage(prev => {
                const merged = { ...prev, ...mapped };
                saveAppUsage(merged);
                return merged;
              });
            }
          }
          const savedXP = await loadXP();
          setXp(savedXP);
        } catch (e) {}
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => { if (!loading) saveAppLimits(apps); }, [apps]);

  const pushToNative = (appList, usageData) => {
    const limits = {};
    appList.forEach(app => {
      limits[app.id] = app.limit + (usageData[app.id + '_offset'] || 0);
    });
    updateBlocklist(appList, usageData, limits)
      .then(() => setDebugInfo('✅ Service aktiv · ' + appList.filter(a=>a.enabled).length + ' Apps getrackt'))
      .catch(e => setDebugInfo('❌ Service Fehler: ' + e?.message));
  };

  const getUsedMinutes = (appId) => usage[appId] || 0;
  const getOffset = (appId) => usage[`${appId}_offset`] || 0;
  const getEffectiveLimit = (app) => app.limit + getOffset(app.id);

  const toggleApp = (id) => {
    const updated = apps.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setApps(updated);
    pushToNative(updated, usage);
  };

  const openEdit = (app) => {
    const usedMin = getUsedMinutes(app.id);
    const effectiveLimit = getEffectiveLimit(app);
    // Block editing if limit is reached OR if app is in blocked state
    if (usedMin >= effectiveLimit || usedMin >= app.limit) {
      Alert.alert(
        'Limit gesperrt 🔒',
        'Du kannst das Limit nicht erhöhen während es erreicht ist. Verwende XP um Zeit zu verlängern, oder warte bis Mitternacht.',
        [{ text: 'OK' }]
      );
      return;
    }
    setEditingApp(app);
    setNewLimit(String(app.limit));
    setShowEditModal(true);
  };

  const saveLimit = () => {
    const val = parseInt(newLimit);
    if (!val || val < 1 || val > 600) { Alert.alert('Ungültig', '1–600 Minuten'); return; }
    const updated = apps.map(a => a.id === editingApp.id ? { ...a, limit: val } : a);
    setApps(updated);
    pushToNative(updated, usage);
    setShowEditModal(false);
  };

  const handleProToggle = async () => {
    if (isPro) {
      await cancelSubscription();
      setIsPro(false);
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

  if (loading) return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: Colors.textSecondary }}>Loading...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <FadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>App Limits</Text>
              <Text style={styles.pageSubtitle}>Automatisches Tracking aktiv 🟢</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>⚡ {xp} XP</Text>
              </View>
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
            <Text style={styles.overviewLabel}>Heutiger Screen Time</Text>
            <Text style={styles.overviewValue}>{minutesToHM(totalUsed)}</Text>
            <Text style={styles.overviewSub}>von {minutesToHM(totalLimit)} gesamt</Text>
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
                  <Text style={styles.blockedAlertText}>{blocked.length} App{blocked.length > 1 ? 's' : ''} gesperrt</Text>
                </View>
              )}
              <Text style={styles.resetNote}>⏰ Reset um Mitternacht</Text>
            </View>
          </Card>
        </FadeIn>

        {/* Debug Info */}
        <FadeIn delay={90}>
          <TouchableOpacity onPress={async () => { const d = await getNativeUsageData(); setDebugInfo(JSON.stringify(d)); }}>
            <View style={{ backgroundColor: '#111122', borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <Text style={{ color: '#6C63FF', fontSize: 11 }}>🔧 Debug: {debugInfo}</Text>
              <Text style={{ color: '#555566', fontSize: 10 }}>Tippen für rohe Usage-Daten</Text>
            </View>
          </TouchableOpacity>
        </FadeIn>

        {/* XP Extend Info */}
        <FadeIn delay={120}>
          <Card style={styles.xpInfoCard}>
            <View style={styles.xpInfoRow}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.xpInfoTitle}>Mit XP verlängern</Text>
                <Text style={styles.xpInfoSub}>60 XP = +30 Minuten für eine App · Du hast {xp} XP</Text>
              </View>
            </View>
          </Card>
        </FadeIn>

        {/* Filter */}
        <FadeIn delay={140}>
          <View style={styles.filterRow}>
            {['all', 'social', 'entertainment'].map(f => (
              <TouchableOpacity key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]} onPress={() => setFilter(f)}>
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'all' ? 'Alle' : f.charAt(0).toUpperCase() + f.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeIn>

        <SectionHeader title="Apps" subtitle="Limit tippen zum Bearbeiten" />

        {filteredApps.map((app, i) => {
          const usedMin = getUsedMinutes(app.id);
          const effectiveLimit = getEffectiveLimit(app);
          const offset = getOffset(app.id);
          const pct = Math.min(usedMin / effectiveLimit, 1);
          const isBlocked = usedMin >= effectiveLimit && app.enabled;
          const barColor = isBlocked ? Colors.danger : pct > 0.7 ? Colors.warning : app.color;

          return (
            <FadeIn key={app.id} delay={200 + i * 50}>
              <Card style={[styles.appCard, isBlocked && styles.appCardBlocked]}>
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
                      <Text style={[styles.appName, !app.enabled && { color: Colors.textMuted }]}>{app.name}</Text>
                      {isBlocked && <View style={styles.blockedTag}><Text style={styles.blockedTagText}>GESPERRT</Text></View>}
                      {offset > 0 && <View style={[styles.blockedTag, { backgroundColor: Colors.warning + '22' }]}><Text style={[styles.blockedTagText, { color: Colors.warning }]}>+{offset}m</Text></View>}
                    </View>
                    <View style={styles.appStats}>
                      <Text style={styles.appUsed}>{minutesToHM(usedMin)}</Text>
                      <TouchableOpacity onPress={() => openEdit(app)}>
                        <Text style={[styles.appLimit, { color: isBlocked ? Colors.danger : Colors.accent }]}>
                          / {minutesToHM(effectiveLimit)} {isBlocked ? '🔒' : '✎'}
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

                {app.enabled && <ProgressBar progress={pct} color={barColor} height={4} style={{ marginTop: Spacing.sm }} />}

                {isBlocked && (
                  <TouchableOpacity onPress={() => setBlockedApp({ ...app, used: Math.floor(usedMin) })}>
                    <View style={styles.blockedMsg}>
                      <Ionicons name="lock-closed" size={12} color={Colors.danger} />
                      <Text style={styles.blockedMsgText}>Mit XP verlängern oder bis Mitternacht warten</Text>
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
                  <Text style={styles.modalSub}>Aktuell: {minutesToHM(editingApp.limit)} pro Tag</Text>
                </View>
                <View style={styles.quickRow}>
                  {[15, 30, 45, 60, 90, 120].map(m => (
                    <TouchableOpacity key={m} style={[styles.quickBtn, newLimit === String(m) && styles.quickBtnActive]} onPress={() => setNewLimit(String(m))}>
                      <Text style={[styles.quickBtnText, newLimit === String(m) && styles.quickBtnTextActive]}>{minutesToHM(m)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.inputRow}>
                  <TextInput style={styles.limitInput} value={newLimit} onChangeText={setNewLimit} keyboardType="number-pad" placeholder="Eigener Wert..." placeholderTextColor={Colors.textMuted} maxLength={3} />
                  <Text style={styles.inputUnit}>min</Text>
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={saveLimit}>
                  <LinearGradient colors={[Colors.accent, '#9C94FF']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.saveBtnText}>Limit speichern</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.cancelText}>Abbrechen</Text>
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
          pushToNative(apps, savedUsage);
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
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  filterText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  filterTextActive: { color: Colors.accent },
  appCard: { marginBottom: Spacing.sm, padding: Spacing.base },
  appCardBlocked: { borderColor: Colors.danger + '33', backgroundColor: Colors.danger + '06' },
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
