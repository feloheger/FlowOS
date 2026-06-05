import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadData, saveData } from './data/storage';

// ─── Theme definitions ────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: '#0A0A0F', bgCard: '#13131A', bgElevated: '#1C1C26', bgHighlight: '#22222E',
    accent: '#6C63FF', accentSoft: '#6C63FF22', accentGlow: '#6C63FF44',
    success: '#4ECDC4', warning: '#FFD93D', danger: '#FF6B6B', info: '#74B9FF',
    textPrimary: '#F0F0F8', textSecondary: '#8888AA', textMuted: '#44445A',
    border: '#1E1E2E', borderLight: '#2A2A3E',
  },
  amoled: {
    bg: '#000000', bgCard: '#0A0A0A', bgElevated: '#111111', bgHighlight: '#1A1A1A',
    accent: '#6C63FF', accentSoft: '#6C63FF22', accentGlow: '#6C63FF44',
    success: '#4ECDC4', warning: '#FFD93D', danger: '#FF6B6B', info: '#74B9FF',
    textPrimary: '#FFFFFF', textSecondary: '#888888', textMuted: '#444444',
    border: '#1A1A1A', borderLight: '#222222',
  },
  light: {
    bg: '#F5F5FA', bgCard: '#FFFFFF', bgElevated: '#EFEFFA', bgHighlight: '#E8E8F5',
    accent: '#6C63FF', accentSoft: '#6C63FF22', accentGlow: '#6C63FF44',
    success: '#00B894', warning: '#FDCB6E', danger: '#E17055', info: '#0984E3',
    textPrimary: '#1A1A2E', textSecondary: '#555577', textMuted: '#AAAACC',
    border: '#DDDDF0', borderLight: '#EEEEF8',
  },
  purple: {
    bg: '#0D0818', bgCard: '#150D24', bgElevated: '#1E1230', bgHighlight: '#271840',
    accent: '#C77DFF', accentSoft: '#C77DFF22', accentGlow: '#C77DFF44',
    success: '#4ECDC4', warning: '#FFD93D', danger: '#FF6B6B', info: '#74B9FF',
    textPrimary: '#F0E8FF', textSecondary: '#9988BB', textMuted: '#554466',
    border: '#2A1840', borderLight: '#3A2255',
  },
};

// ─── Translations ─────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    home: 'Home', habits: 'Habits', limits: 'Limits', settings: 'Settings', projects: 'Projects',
    goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
    today: 'Today', streak: 'Streak', xp: 'XP', level: 'Level',
    appLimits: 'App Limits', autoTracking: 'Auto-tracking active 🟢',
    blocked: 'BLOCKED', extendWithXP: 'Extend with XP or wait until midnight',
    saveLimit: 'Save Limit', cancel: 'Cancel', resetAtMidnight: '⏰ Resets at midnight',
  },
  de: {
    home: 'Start', habits: 'Gewohnheiten', limits: 'Limits', settings: 'Einstellungen', projects: 'Projekte',
    goodMorning: 'Guten Morgen', goodAfternoon: 'Guten Nachmittag', goodEvening: 'Guten Abend',
    today: 'Heute', streak: 'Serie', xp: 'XP', level: 'Level',
    appLimits: 'App Limits', autoTracking: 'Auto-Tracking aktiv 🟢',
    blocked: 'GESPERRT', extendWithXP: 'Mit XP verlängern oder bis Mitternacht warten',
    saveLimit: 'Limit speichern', cancel: 'Abbrechen', resetAtMidnight: '⏰ Reset um Mitternacht',
  },
  fr: {
    home: 'Accueil', habits: 'Habitudes', limits: 'Limites', settings: 'Paramètres', projects: 'Projets',
    goodMorning: 'Bonjour', goodAfternoon: 'Bon après-midi', goodEvening: 'Bonsoir',
    today: "Aujourd'hui", streak: 'Série', xp: 'XP', level: 'Niveau',
    appLimits: 'Limites App', autoTracking: 'Suivi auto actif 🟢',
    blocked: 'BLOQUÉ', extendWithXP: 'Prolonger avec XP ou attendre minuit',
    saveLimit: 'Enregistrer', cancel: 'Annuler', resetAtMidnight: '⏰ Réinitialise à minuit',
  },
  es: {
    home: 'Inicio', habits: 'Hábitos', limits: 'Límites', settings: 'Ajustes', projects: 'Proyectos',
    goodMorning: 'Buenos días', goodAfternoon: 'Buenas tardes', goodEvening: 'Buenas noches',
    today: 'Hoy', streak: 'Racha', xp: 'XP', level: 'Nivel',
    appLimits: 'Límites de App', autoTracking: 'Seguimiento automático 🟢',
    blocked: 'BLOQUEADO', extendWithXP: 'Ampliar con XP o esperar medianoche',
    saveLimit: 'Guardar', cancel: 'Cancelar', resetAtMidnight: '⏰ Se restablece a medianoche',
  },
  it: { home: 'Home', habits: 'Abitudini', limits: 'Limiti', settings: 'Impostazioni', projects: 'Progetti', goodMorning: 'Buongiorno', goodAfternoon: 'Buon pomeriggio', goodEvening: 'Buonasera', today: 'Oggi', streak: 'Serie', xp: 'XP', level: 'Livello', appLimits: 'Limiti App', autoTracking: 'Tracciamento auto 🟢', blocked: 'BLOCCATO', extendWithXP: 'Estendi con XP o aspetta mezzanotte', saveLimit: 'Salva', cancel: 'Annulla', resetAtMidnight: '⏰ Reset a mezzanotte' },
  tr: { home: 'Ana Sayfa', habits: 'Alışkanlıklar', limits: 'Limitler', settings: 'Ayarlar', projects: 'Projeler', goodMorning: 'Günaydın', goodAfternoon: 'İyi öğleden sonralar', goodEvening: 'İyi akşamlar', today: 'Bugün', streak: 'Seri', xp: 'XP', level: 'Seviye', appLimits: 'Uygulama Limitleri', autoTracking: 'Otomatik takip aktif 🟢', blocked: 'ENGELLENDİ', extendWithXP: 'XP ile uzat veya gece yarısına kadar bekle', saveLimit: 'Kaydet', cancel: 'İptal', resetAtMidnight: '⏰ Gece yarısı sıfırlanır' },
  zh: { home: '主页', habits: '习惯', limits: '限制', settings: '设置', projects: '项目', goodMorning: '早上好', goodAfternoon: '下午好', goodEvening: '晚上好', today: '今天', streak: '连续', xp: '经验', level: '等级', appLimits: '应用限制', autoTracking: '自动追踪中 🟢', blocked: '已封锁', extendWithXP: '用经验值延长或等到午夜', saveLimit: '保存', cancel: '取消', resetAtMidnight: '⏰ 午夜重置' },
  ar: { home: 'الرئيسية', habits: 'العادات', limits: 'الحدود', settings: 'الإعدادات', projects: 'المشاريع', goodMorning: 'صباح الخير', goodAfternoon: 'مساء الخير', goodEvening: 'مساء النور', today: 'اليوم', streak: 'سلسلة', xp: 'نقاط', level: 'مستوى', appLimits: 'حدود التطبيقات', autoTracking: 'التتبع التلقائي نشط 🟢', blocked: 'محجوب', extendWithXP: 'مدّد بالنقاط أو انتظر منتصف الليل', saveLimit: 'حفظ', cancel: 'إلغاء', resetAtMidnight: '⏰ يُعاد الضبط منتصف الليل' },
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [themeId, setThemeId] = useState('dark');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    loadData('flowos_settings', {}).then(s => {
      if (s?.theme) setThemeId(s.theme);
      if (s?.language) setLanguage(s.language);
    });
  }, []);

  const setTheme = async (id) => {
    setThemeId(id);
    const s = await loadData('flowos_settings', {});
    await saveData('flowos_settings', { ...s, theme: id });
  };

  const setLang = async (code) => {
    setLanguage(code);
    const s = await loadData('flowos_settings', {});
    await saveData('flowos_settings', { ...s, language: code });
  };

  const colors = THEMES[themeId] || THEMES.dark;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <AppContext.Provider value={{ themeId, setTheme, language, setLang, colors, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

export { THEMES, TRANSLATIONS };
