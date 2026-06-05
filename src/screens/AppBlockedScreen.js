import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { extendAppLimit, loadXP } from '../data/storage';

export default function AppBlockedScreen({ visible, app, onClose, onExtended }) {
  const [xp, setXp] = useState(0);
  const [extending, setExtending] = useState(false);
  const [extendResult, setExtendResult] = useState(null);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const EXTEND_COST = 60;
  const EXTEND_MINUTES = 30;

  useEffect(() => {
    if (visible) {
      loadXP().then(setXp);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
      setExtendResult(null);
    }
  }, [visible]);

  const handleExtend = async () => {
    setExtending(true);
    const result = await extendAppLimit(app?.id, EXTEND_MINUTES);
    setExtending(false);
    setExtendResult(result);
    if (result.success) {
      setXp(result.newXP);
      setTimeout(() => {
        onExtended?.();
        onClose?.();
      }, 1500);
    }
  };

  const canExtend = xp >= EXTEND_COST;

  if (!visible || !app) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#1A1A2E', '#13131A']} style={StyleSheet.absoluteFill} borderRadius={Radius.xxl} />
          <LinearGradient
            colors={[Colors.danger + '33', Colors.danger + '00']}
            style={styles.topGlow}
          />

          {/* Lock icon */}
          <View style={styles.lockIcon}>
            <View style={styles.lockCircle}>
              <Ionicons name="lock-closed" size={40} color={Colors.danger} />
            </View>
          </View>

          {/* App icon */}
          {app.icon && (
            <View style={[styles.appIconWrap, { backgroundColor: app.color + '22' }]}>
              <Ionicons name={app.icon} size={28} color={app.color} />
            </View>
          )}

          <Text style={styles.title}>Limit Reached</Text>
          <Text style={styles.appName}>{app.name}</Text>
          <Text style={styles.message}>
            Du hast dein tägliches Limit für {app.name} erreicht.{'\n'}
            Komm morgen wieder! 🌙
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{app.used}m</Text>
              <Text style={styles.statLabel}>Used today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{app.limit}m</Text>
              <Text style={styles.statLabel}>Daily limit</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: Colors.warning }]}>{xp}</Text>
              <Text style={styles.statLabel}>Your XP</Text>
            </View>
          </View>

          {/* Extend with XP */}
          <View style={styles.extendSection}>
            <Text style={styles.extendTitle}>Extend with XP</Text>
            <Text style={styles.extendDesc}>
              Spend <Text style={{ color: Colors.warning, fontWeight: Typography.bold }}>{EXTEND_COST} XP</Text> to unlock {EXTEND_MINUTES} more minutes
            </Text>

            {extendResult && !extendResult.success && (
              <View style={styles.errorBox}>
                <Ionicons name="warning" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>
                  Not enough XP! You have {extendResult.currentXP} XP, need {extendResult.cost} XP.{'\n'}
                  Complete habits to earn more XP 💪
                </Text>
              </View>
            )}

            {extendResult?.success && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={styles.successText}>+{EXTEND_MINUTES} minutes unlocked! Enjoy 🎉</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.extendBtn, !canExtend && styles.extendBtnDisabled]}
              onPress={handleExtend}
              disabled={extending || !canExtend}
            >
              <LinearGradient
                colors={canExtend ? [Colors.warning, '#E17055'] : [Colors.bgHighlight, Colors.bgHighlight]}
                style={styles.extendGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.extendCost}>⚡ {EXTEND_COST} XP</Text>
                <Text style={[styles.extendBtnText, !canExtend && { color: Colors.textMuted }]}>
                  {extending ? 'Extending...' : `+${EXTEND_MINUTES} min`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {!canExtend && (
              <Text style={styles.notEnoughXP}>
                Need {EXTEND_COST - xp} more XP → complete habits to earn XP
              </Text>
            )}
          </View>

          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>

          <Text style={styles.resetNote}>⏰ Limit resets at midnight</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000CC', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card: { width: '100%', borderRadius: Radius.xxl, padding: Spacing.xl, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: Colors.danger + '44' },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  lockIcon: { marginBottom: Spacing.md },
  lockCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.danger + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.danger + '44' },
  appIconWrap: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  title: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.danger, letterSpacing: -0.5, marginBottom: 4 },
  appName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  message: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', width: '100%', backgroundColor: Colors.bgHighlight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Typography.lg, fontWeight: Typography.heavy, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  extendSection: { width: '100%', marginBottom: Spacing.lg },
  extendTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  extendDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  errorBox: { flexDirection: 'row', gap: 6, backgroundColor: Colors.danger + '11', padding: Spacing.sm, borderRadius: Radius.sm, marginBottom: Spacing.sm, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: Typography.xs, color: Colors.danger, lineHeight: 16 },
  successBox: { flexDirection: 'row', gap: 6, backgroundColor: Colors.success + '11', padding: Spacing.sm, borderRadius: Radius.sm, marginBottom: Spacing.sm, alignItems: 'center' },
  successText: { flex: 1, fontSize: Typography.xs, color: Colors.success },
  extendBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  extendBtnDisabled: { opacity: 0.6 },
  extendGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, paddingHorizontal: Spacing.lg },
  extendCost: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
  extendBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
  notEnoughXP: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  closeBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  closeText: { fontSize: Typography.base, color: Colors.textSecondary },
  resetNote: { fontSize: Typography.xs, color: Colors.textMuted },
});
