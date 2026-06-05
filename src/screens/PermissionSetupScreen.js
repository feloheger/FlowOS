import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Linking } from 'react-native';
import {
  hasUsagePermission, hasOverlayPermission,
  startBlockerService,
} from '../native/AppBlocker';

// Opens Android system settings directly
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

export default function PermissionSetupScreen({ onComplete }) {
  const [usagePerm, setUsagePerm] = useState(false);
  const [overlayPerm, setOverlayPerm] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkPerms = async () => {
    const [u, o] = await Promise.all([hasUsagePermission(), hasOverlayPermission()]);
    setUsagePerm(u);
    setOverlayPerm(o);
    setChecking(false);
    if (u && o) {
      await startBlockerService();
      onComplete?.();
    }
  };

  useEffect(() => {
    checkPerms();
    // Re-check when user comes back from Settings
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') checkPerms();
    });
    return () => sub.remove();
  }, []);

  if (checking) return null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <Text style={styles.emoji}>🛡️</Text>
        <Text style={styles.title}>Zwei Berechtigungen nötig</Text>
        <Text style={styles.subtitle}>
          Damit FlowOS Apps wirklich sperren kann, braucht es diese zwei Android-Berechtigungen.
          Du musst sie manuell in den Einstellungen aktivieren.
        </Text>

        {/* Permission 1: Usage Stats */}
        <View style={[styles.permCard, usagePerm && styles.permCardDone]}>
          <View style={styles.permIconWrap}>
            <Ionicons
              name={usagePerm ? 'checkmark-circle' : 'stats-chart'}
              size={28}
              color={usagePerm ? Colors.success : Colors.accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.permTitle}>App-Nutzungsdaten</Text>
            <Text style={styles.permDesc}>
              Damit FlowOS sehen kann welche App gerade offen ist.{'\n'}
              Einstellungen → Apps → Spezieller App-Zugriff → Nutzungsdaten-Zugriff → FlowOS ✓
            </Text>
          </View>
          {!usagePerm && (
            <TouchableOpacity style={styles.permBtn} onPress={openUsageSettings}>
              <Text style={styles.permBtnText}>Öffnen →</Text>
            </TouchableOpacity>
          )}
          {usagePerm && (
            <Ionicons name="checkmark" size={20} color={Colors.success} />
          )}
        </View>

        {/* Permission 2: Overlay */}
        <View style={[styles.permCard, overlayPerm && styles.permCardDone]}>
          <View style={styles.permIconWrap}>
            <Ionicons
              name={overlayPerm ? 'checkmark-circle' : 'layers'}
              size={28}
              color={overlayPerm ? Colors.success : Colors.warning}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.permTitle}>Über anderen Apps anzeigen</Text>
            <Text style={styles.permDesc}>
              Damit der Sperrscreen über TikTok, Instagram etc. erscheinen kann.{'\n'}
              Einstellungen → Apps → FlowOS → Über anderen Apps anzeigen ✓
            </Text>
          </View>
          {!overlayPerm && (
            <TouchableOpacity style={[styles.permBtn, { backgroundColor: Colors.warning + '33' }]} onPress={openOverlaySettings}>
              <Text style={[styles.permBtnText, { color: Colors.warning }]}>Öffnen →</Text>
            </TouchableOpacity>
          )}
          {overlayPerm && (
            <Ionicons name="checkmark" size={20} color={Colors.success} />
          )}
        </View>

        {usagePerm && overlayPerm ? (
          <TouchableOpacity style={styles.startBtn} onPress={async () => {
            await startBlockerService();
            onComplete?.();
          }}>
            <LinearGradient colors={[Colors.accent, '#9C94FF']} style={styles.startBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.startBtnText}>🚀 App-Limits aktivieren</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hint}>
            ☝️ Tippe auf "Öffnen →" und aktiviere die Berechtigung, dann komm zurück.
          </Text>
        )}
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
  startBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.lg },
  startBtnGrad: { padding: Spacing.lg, alignItems: 'center' },
  startBtnText: { fontSize: Typography.base, fontWeight: Typography.heavy, color: '#fff' },
  hint: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 20 },
});
