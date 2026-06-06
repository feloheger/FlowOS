import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { activateSubscription, cancelSubscription } from '../data/storage';

const FEATURES = [
  { icon: '📁', text: 'Projects – Full project management' },
  { icon: '🏆', text: 'Vision – Annual goals & tracking' },
  { icon: '2️⃣', text: '2x XP on all habits & activities' },
  { icon: '📊', text: 'Advanced stats & weekly reports' },
  { icon: '🎨', text: 'Custom habit colors & icons' },
  { icon: '☁️', text: 'Cloud backup & sync' },
];

export default function PaywallScreen({ visible, onClose, onActivate }) {
  const { t } = useAppContext();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleActivate = async () => {
    await activateSubscription();
    onActivate?.();
    onClose?.();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1A1A2E', '#13131A']} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['#6C63FF44', '#6C63FF00']}
            style={styles.topGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <LinearGradient colors={[Colors.accent, '#9C94FF']} style={styles.iconGrad}>
              <Text style={{ fontSize: 36 }}>⚡</Text>
            </LinearGradient>
          </View>

          <Text style={styles.title}>{t.proTitle}</Text>
          <Text style={styles.subtitle}>{t.proDesc}</Text>

          {/* Features */}
          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
                <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
              </View>
            ))}
          </View>

          {/* Price */}
          <View style={styles.priceCard}>
            <LinearGradient colors={[Colors.accent + '22', Colors.accent + '08']} style={StyleSheet.absoluteFill} borderRadius={Radius.lg} />
            <Text style={styles.price}>€4.99</Text>
            <Text style={styles.priceSub}>per month · cancel anytime</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.ctaBtn} onPress={handleActivate}>
            <LinearGradient colors={[Colors.accent, '#9C94FF']} style={styles.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.ctaText}>{t.startTrial}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.legal}>
            Then €4.99/month. Cancel anytime in settings.
          </Text>

          {/* Test button */}
          <TouchableOpacity style={styles.testBtn} onPress={handleActivate}>
            <Text style={styles.testBtnText}>🧪 Test Mode – Activate for free</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Locked screen shown when tapping a Pro tab without subscription
export function LockedScreen({ tabName, onUnlock }) {
  const { t } = useAppContext();
  return (
    <View style={styles.lockedContainer}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} />
      <View style={styles.lockedContent}>
        <View style={styles.lockedIcon}>
          <LinearGradient colors={[Colors.accent + '33', Colors.accent + '11']} style={styles.lockedIconGrad}>
            <Ionicons name="lock-closed" size={48} color={Colors.accent} />
          </LinearGradient>
        </View>
        <Text style={styles.lockedTitle}>{tabName}</Text>
        <Text style={styles.lockedSub}>{t.proFeature}</Text>
        <View style={styles.lockedFeatures}>
          {FEATURES.slice(0, 3).map((f, i) => (
            <View key={i} style={styles.lockedFeatureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.lockedFeatureText}>{f.text}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.unlockBtn} onPress={onUnlock}>
          <LinearGradient colors={[Colors.accent, '#9C94FF']} style={styles.unlockGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.unlockText}>{t.unlockPro}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 44, overflow: 'hidden' },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  closeBtn: { position: 'absolute', top: Spacing.lg, right: Spacing.lg, width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgHighlight, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  iconWrap: { alignSelf: 'center', marginBottom: Spacing.md, marginTop: Spacing.sm },
  iconGrad: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: Spacing.lg },
  features: { marginBottom: Spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  featureIcon: { fontSize: 20, width: 28 },
  featureText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },
  priceCard: { alignItems: 'center', padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.accent + '44', marginBottom: Spacing.lg, overflow: 'hidden' },
  price: { fontSize: Typography.xxxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -1 },
  priceSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  ctaBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.sm, ...Shadow.accent },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.base, gap: Spacing.sm },
  ctaText: { fontSize: Typography.base, fontWeight: Typography.heavy, color: '#fff', letterSpacing: 0.3 },
  legal: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.md },
  testBtn: { alignItems: 'center', padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.borderLight },
  testBtnText: { fontSize: Typography.xs, color: Colors.textSecondary },

  // Locked screen
  lockedContainer: { flex: 1, backgroundColor: colors?.bg || Colors.bg },
  lockedContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  lockedIcon: { marginBottom: Spacing.xl },
  lockedIconGrad: { width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  lockedTitle: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, marginBottom: Spacing.sm },
  lockedSub: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing.xl, textAlign: 'center' },
  lockedFeatures: { width: '100%', marginBottom: Spacing.xl },
  lockedFeatureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  lockedFeatureText: { fontSize: Typography.sm, color: Colors.textSecondary },
  unlockBtn: { width: '100%', borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.accent },
  unlockGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.base, gap: Spacing.sm },
  unlockText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
});
