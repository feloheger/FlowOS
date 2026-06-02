import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

// ─── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }, style]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ label, color = Colors.accent }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
export function ProgressBar({ progress, color = Colors.accent, height = 6, style }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={[styles.progressTrack, { height }, style]}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            height,
            backgroundColor: color,
            width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

// ─── Energy Dot ─────────────────────────────────────────────────────────────
export function EnergyDot({ level }) {
  const colors = {
    high: Colors.danger,
    medium: Colors.warning,
    low: Colors.success,
  };
  return (
    <View style={[styles.energyDot, { backgroundColor: colors[level] || Colors.textMuted }]} />
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── Fade In View ────────────────────────────────────────────────────────────
export function FadeIn({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ─── Status Pill ─────────────────────────────────────────────────────────────
export function StatusPill({ status }) {
  const config = {
    on_track: { label: 'On Track', color: Colors.success },
    at_risk: { label: 'At Risk', color: Colors.warning },
    blocked: { label: 'Blocked', color: Colors.danger },
  };
  const { label, color } = config[status] || config.on_track;
  return <Badge label={label} color={color} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: 0.4,
  },
  progressTrack: {
    backgroundColor: Colors.bgHighlight,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: Radius.full,
  },
  energyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionAction: {
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: Typography.semibold,
  },
});
