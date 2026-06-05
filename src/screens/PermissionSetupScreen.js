import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Linking } from 'react-native';

const openUsageSettings = () => {
  Linking.sendIntent('android.settings.USAGE_ACCESS_SETTINGS').catch(() => {
    Linking.openSettings();
  });
};

const openOverlaySettings = () => {
  Linking.sendIntent('android.settings.action.MANAGE_OVERLAY_PERMISSION').catch(() => {
    Linking.openSettings();
  });
};

async function checkNativePerms() {
  try {
    const { NativeModules } = require('react-native');
    const { AppBlocker } = NativeModules;
    if (!AppBlocker) return { usage: false, overlay: false };
    const [u, o] = await Promise.all([
      AppBlocker.hasUsagePermission(),
      AppBlocker.hasOverlayPermission(),
    ]);
    return { usage: !!u, overlay: !!o };
  } catch (e) {
    return { usage: false, overlay: false };
  }
}

async function startService() {
  try {
    const { NativeModules } = require('react-native');
    const { AppBlocker } = NativeModules;
    if (AppBlocker) await AppBlocker.startBlockerService();
  } catch (e) {}
}

export default function PermissionSetupScreen({ onComplete }) {
  const [usagePerm, setUsagePerm] = useState(false);
  const [overlayPerm, setOverlayPerm] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkPerms = useCallback(async () => {
    setChecking(true);
    const { usage, overlay } = await checkNativePerms();
    setUsagePerm(usage);
    setOverlayPerm(overlay);
    setChecking(false);
    if (usage && overlay) {
      await startService();
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    checkPerms();
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') checkPerms();
    });
    return () => sub.remove();
  }, [checkPerms]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Text style={styles.emoji}>🛡️</Text>
        <Text style={styles.title}>Zwei Berechtigungen nötig</Text>
        <Text style={styles.subtitle}>
          Damit FlowOS Apps wirklich sperren kann, braucht es diese zwei Android-Berechtigungen.
        </Text>

        <View style={[styles.permCard, usagePerm && styles.permCardDone]}>
          <View style={styles.permIconWrap}>
            <Ionicons name={usagePerm ? 'checkmark-circle' : 'stats-chart'} size={28} color={usagePerm ? Colors.success : Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.permTitle}>App-Nutzungsdaten</Text>
            <Text style={styles.permDesc}>Einstellungen → Apps → Spezieller App-Zugriff → Nutzungsdaten-Zugriff → FlowOS ✓</Text>
          </View>
          {!usagePerm && (
            <TouchableOpacity style={styles.permBtn} onPress={openUsageSettings}>
              <Text style={styles.permBtnText}>Öffnen →</Text>
            </TouchableOpacity>
          )}
          {usagePerm && <Ionicons name="checkmark" size={20} color={Colors.success} />}
        </View>

        <View style={[styles.permCard, overlayPerm && styles.permCardDone]}>
          <View style={styles.permIconWrap}>
            <Ionicons name={overlayPerm ? 'checkmark-circle' : 'layers'} size={28} color={overlayPerm ? Colors.success : Colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.permTitle}>Über anderen Apps anzeigen</Text>
            <Text style={styles.permDesc}>Einstellungen → Apps → FlowOS → Über anderen Apps anzeigen ✓</Text>
          </View>
          {!overlayPerm && (
            <TouchableOpacity style={[styles.permBtn, { backgroundColor: Colors.warning + '33' }]} onPress={openOverlaySettings}>
              <Text style={[styles.permBtnText, { color: Colors.warning }]}>Öffnen →</Text>
            </TouchableOpacity>
          )}
          {overlayPerm && <Ionicons name="checkmark" size={20} color={Colors.success} />}
        </View>

        <TouchableOpacity style={styles.recheckBtn} onPress={checkPerms}>
          <Text style={styles.recheckText}>{checking ? '⏳ Prüfe...' : '🔄 Berechtigungen neu prüfen'}</Text>
        </TouchableOpacity>

        {usagePerm && overlayPerm ? (
          <TouchableOpacity style={styles.startBtn} onPress={async () => { await startService(); onComplete?.(); }}>
            <LinearGradient colors={[Colors.accent, '#9C94FF']} style={styles.startBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.startBtnText}>🚀 App-Limits aktivieren</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hint}>☝️ Aktiviere beide Berechtigungen, dann tippe auf "Neu prüfen".</Text>
        )}

        <TouchableOpacity style={styles.skipBtn} onPress={async () => { await startService(); onComplete?.(); }}>
          <Text style={styles.skipText}>Überspringen (Berechtigungen bereits erteilt)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: Spacing.lg },
  title: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
  permCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  permCardDone: { borderColor: Colors.success + '44', backgroundColor: Colors.success + '08' },
  permIconWrap: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.bgHighlight, alignItems: 'center', justifyContent: 'center' },
  permTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  permDesc: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 16 },
  permBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Colors.accent + '33' },
  permBtnText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.accent },
  recheckBtn: { marginTop: Spacing.lg, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  recheckText: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium },
  startBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.lg },
  startBtnGrad: { padding: Spacing.lg, alignItems: 'center' },
  startBtnText: { fontSize: Typography.base, fontWeight: Typography.heavy, color: '#fff' },
  hint: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 20 },
  skipBtn: { marginTop: Spacing.lg, padding: Spacing.md, alignItems: 'center' },
  skipText: { fontSize: Typography.xs, color: Colors.textMuted, textDecorationLine: 'underline' },
});
