import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Card, FadeIn } from '../components/UI';
import { saveData, loadData } from '../data/storage';
import { useAppContext } from '../AppContext';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

const THEMES = [
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'amoled', label: 'AMOLED', icon: '⚫' },
  { id: 'purple', label: 'Purple', icon: '💜' },
];

const UNITS = [
  { id: 'metric', label: 'Metric', sub: 'km, kg, °C' },
  { id: 'imperial', label: 'Imperial', sub: 'mi, lbs, °F' },
];

export default function SettingsScreen() {
  const { themeId, setTheme: setGlobalTheme, language: globalLang, setLang: setGlobalLang , colors } = useAppContext();
  const [language, setLanguage] = useState('en');
  const [units, setUnits] = useState('metric');
  const [notifications, setNotifications] = useState(true);
  const [habitReminder, setHabitReminder] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [appLimitAlert, setAppLimitAlert] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [showLangModal, setShowLangModal] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    (async () => {
      const s = await loadData('flowos_settings', null);
      if (s) {
        setLanguage(s.language || globalLang || 'en');
        setUnits(s.units || 'metric');
        setNotifications(s.notifications ?? true);
        setHabitReminder(s.habitReminder ?? true);
        setWeeklyReport(s.weeklyReport ?? true);
        setAppLimitAlert(s.appLimitAlert ?? true);
        setSoundEffects(s.soundEffects ?? false);
        setHaptics(s.haptics ?? true);
        setName(s.name || '');
      }
    })();
  }, []);

  const save = async (updates) => {
    const current = await loadData('flowos_settings', {});
    await saveData('flowos_settings', { ...current, ...updates });
  };

  const currentLang = LANGUAGES.find(l => l.code === language);

  const confirmReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your habits, projects, goals and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => {
          const keys = ['flowos_habits','flowos_projects','flowos_goals','flowos_app_limits','flowos_app_usage','flowos_tasks','flowos_settings'];
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.multiRemove(keys);
          Alert.alert('Done', 'All data has been reset. Restart the app.');
        }},
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors?.bg || Colors.bg }]}>
      <LinearGradient colors={['#12122088', '#0A0A0F']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <FadeIn delay={0}>
          <Text style={styles.pageTitle}>Settings</Text>
        </FadeIn>

        {/* Appearance */}
        <FadeIn delay={60}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <Card style={styles.section}>
            <SettingRow
              icon="language" iconColor={Colors.info}
              label="Language"
              value={`${currentLang?.flag} ${currentLang?.label}`}
              onPress={() => setShowLangModal(true)}
              arrow
            />
            <Divider />
            <SettingRow
              icon="speedometer" iconColor={Colors.success}
              label="Units"
              value={units === 'metric' ? '📏 Metric' : '📐 Imperial'}
              onPress={() => {
                const next = units === 'metric' ? 'imperial' : 'metric';
                setUnits(next);
                save({ units: next });
              }}
              arrow
            />
          </Card>
        </FadeIn>

        {/* Notifications */}
        <FadeIn delay={120}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          <Card style={styles.section}>
            <SettingRow
              icon="notifications" iconColor={Colors.warning}
              label="Notifications"
              right={<Switch value={notifications} onValueChange={v => { setNotifications(v); save({ notifications: v }); }} trackColor={{ false: Colors.bgHighlight, true: Colors.accent + '66' }} thumbColor={notifications ? Colors.accent : Colors.textMuted} />}
            />
            <Divider />
            <SettingRow
              icon="flame" iconColor="#FF6B6B"
              label="Habit Reminder"
              sub="Daily reminder to complete habits"
              right={<Switch value={habitReminder} onValueChange={v => { setHabitReminder(v); save({ habitReminder: v }); }} trackColor={{ false: Colors.bgHighlight, true: Colors.accent + '66' }} thumbColor={habitReminder ? Colors.accent : Colors.textMuted} />}
            />
            <Divider />
            <SettingRow
              icon="bar-chart" iconColor={Colors.success}
              label="Weekly Report"
              sub="Summary every Monday morning"
              right={<Switch value={weeklyReport} onValueChange={v => { setWeeklyReport(v); save({ weeklyReport: v }); }} trackColor={{ false: Colors.bgHighlight, true: Colors.accent + '66' }} thumbColor={weeklyReport ? Colors.accent : Colors.textMuted} />}
            />
            <Divider />
            <SettingRow
              icon="lock-closed" iconColor={Colors.danger}
              label="App Limit Alert"
              sub="Notify when nearing app limit"
              right={<Switch value={appLimitAlert} onValueChange={v => { setAppLimitAlert(v); save({ appLimitAlert: v }); }} trackColor={{ false: Colors.bgHighlight, true: Colors.accent + '66' }} thumbColor={appLimitAlert ? Colors.accent : Colors.textMuted} />}
            />
          </Card>
        </FadeIn>

        {/* Feedback */}
        <FadeIn delay={180}>
          <Text style={styles.sectionLabel}>Feedback</Text>
          <Card style={styles.section}>
            <SettingRow
              icon="musical-note" iconColor={Colors.info}
              label="Sound Effects"
              right={<Switch value={soundEffects} onValueChange={v => { setSoundEffects(v); save({ soundEffects: v }); }} trackColor={{ false: Colors.bgHighlight, true: Colors.accent + '66' }} thumbColor={soundEffects ? Colors.accent : Colors.textMuted} />}
            />
            <Divider />
            <SettingRow
              icon="phone-portrait" iconColor={Colors.success}
              label="Haptic Feedback"
              right={<Switch value={haptics} onValueChange={v => { setHaptics(v); save({ haptics: v }); }} trackColor={{ false: Colors.bgHighlight, true: Colors.accent + '66' }} thumbColor={haptics ? Colors.accent : Colors.textMuted} />}
            />
          </Card>
        </FadeIn>

        {/* About */}
        <FadeIn delay={240}>
          <Text style={styles.sectionLabel}>About</Text>
          <Card style={styles.section}>
            <SettingRow icon="information-circle" iconColor={Colors.accent} label="Version" value="1.0.0" />
            <Divider />
            <SettingRow icon="shield-checkmark" iconColor={Colors.success} label="Privacy Policy" arrow onPress={() => {}} />
            <Divider />
            <SettingRow icon="document-text" iconColor={Colors.info} label="Terms of Service" arrow onPress={() => {}} />
            <Divider />
            <SettingRow icon="star" iconColor={Colors.warning} label="Rate FlowOS" arrow onPress={() => {}} />
          </Card>
        </FadeIn>

        {/* Danger Zone */}
        <FadeIn delay={300}>
          <Text style={styles.sectionLabel}>Data</Text>
          <Card style={styles.section}>
            <TouchableOpacity style={styles.dangerRow} onPress={confirmReset}>
              <View style={[styles.iconWrap, { backgroundColor: Colors.danger + '22' }]}>
                <Ionicons name="trash" size={18} color={Colors.danger} />
              </View>
              <Text style={styles.dangerText}>Reset All Data</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.danger} />
            </TouchableOpacity>
          </Card>
        </FadeIn>

        <FadeIn delay={340}>
          <Text style={styles.footer}>FlowOS · Made with 💜</Text>
        </FadeIn>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={showLangModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <LinearGradient colors={['#1C1C26', '#13131A']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Language</Text>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.optionRow, language === lang.code && styles.optionRowActive]}
                onPress={() => { setLanguage(lang.code); setGlobalLang(lang.code); setShowLangModal(false); }}
              >
                <Text style={styles.optionFlag}>{lang.flag}</Text>
                <Text style={[styles.optionLabel, language === lang.code && { color: Colors.accent }]}>{lang.label}</Text>
                {language === lang.code && <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLangModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
    </View>
  );
}

function SettingRow({ icon, iconColor, label, sub, value, right, onPress, arrow }) {
  const content = (
    <View style={styles.settingRow}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {right && right}
      {arrow && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 4 }} />}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  return content;
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.base, paddingTop: 60 },
  pageTitle: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: Spacing.xl },
  sectionLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginLeft: 4 },
  section: { marginBottom: Spacing.xl, padding: 0, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
  iconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },
  settingSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  settingValue: { fontSize: Typography.sm, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.base + 34 + Spacing.md },
  dangerRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
  dangerText: { flex: 1, fontSize: Typography.base, color: Colors.danger, fontWeight: Typography.medium },
  footer: { textAlign: 'center', fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.xl },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40, overflow: 'hidden' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  optionRowActive: { backgroundColor: Colors.accentSoft + '44' },
  optionFlag: { fontSize: 24 },
  optionLabel: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  themeCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.bgHighlight, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  themeCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  themeEmoji: { fontSize: 32, marginBottom: 6 },
  themeLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  cancelBtn: { padding: Spacing.md, alignItems: 'center' },
  cancelText: { fontSize: Typography.base, color: Colors.textSecondary },
});
