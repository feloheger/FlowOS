import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadData, saveData } from './data/storage';

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

const TRANSLATIONS = {
  en: {
    // Navigation
    home: 'Home', habits: 'Habits', limits: 'Limits', settings: 'Settings', projects: 'Projects',
    // Greetings
    goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
    // Dashboard
    todayEnergy: "Today's Energy", welcome: 'Welcome 👋', buildSystem: 'Build your daily system',
    todayTasks: "Today's Tasks", noTasks: 'No tasks yet', addTask: 'Add task',
    streak: 'Streak', xp: 'XP', level: 'Level', today: 'Today',
    completed: 'Completed', loading: 'Loading...',
    // Habits
    addHabit: 'Add Habit', noHabits: 'No habits yet', tapToAdd: 'Tap + to add your first habit',
    habitComplete: 'Habit Complete!', pause: 'Pause', resume: 'Resume', stop: 'Stop',
    start: 'Start', startGPS: 'Start GPS Tracking', tapConfirm: 'Tap to confirm',
    pasteLink: 'Paste your post link', writeEntry: 'Write your entry',
    // App Limits
    appLimits: 'App Limits', autoTracking: 'Auto-tracking active 🟢',
    todayScreenTime: "Today's Screen Time", of: 'of', totalLimit: 'total limit',
    appsBlocked: 'app(s) blocked', resetMidnight: '⏰ Resets at midnight',
    extendXP: 'Extend with XP', extendDesc: 'Spend 60 XP for +30 min',
    youHave: 'You have', addApp: '+ App', all: 'All', social: 'Social',
    entertainment: 'Entertainment', searchApp: 'Search app...',
    limitLocked: 'Limit Locked 🔒',
    limitLockedMsg: 'You cannot increase the limit while it is reached. Use XP to extend or wait until midnight.',
    saveLimit: 'Save Limit', cancel: 'Cancel', customLimit: 'Custom...',
    blocked: 'BLOCKED', extendOrWait: 'Extend with XP or wait until midnight',
    // App Blocked Screen
    limitReached: 'Limit Reached', usedToday: 'Used today', dailyLimit: 'Daily limit', yourXP: 'Your XP',
    extendWithXP: 'Extend with XP', openFlowOS: '⚡ Open in FlowOS',
    notEnoughXP: 'more XP needed → complete habits',
    extendSuccess: '+30 minutes unlocked! Enjoy 🎉',
    notEnoughXPMsg: 'Not enough XP! Complete habits to earn more 💪',
    extending: 'Extending...',
    // Settings
    appearance: 'Appearance', selectTheme: 'Select Theme', selectLanguage: 'Select Language',
    notifications: 'Notifications', data: 'Data', resetData: 'Reset All Data',
    about: 'About', feedback: 'Feedback', vision: 'Vision',
    // Paywall
    proTitle: 'FlowOS Pro', proDesc: 'Unlock your full potential',
    startTrial: 'Start Free 7-Day Trial', proFeature: 'This feature is part of FlowOS Pro',
    unlockPro: 'Unlock with FlowOS Pro',
    // Goals
    yourGoals: 'Your 2024 goals',
    // Permissions
    twoPermsNeeded: 'Two Permissions Needed',
    usageData: 'App Usage Data', overlayPerm: 'Display over other apps',
    openSettings: 'Open →', recheckPerms: '🔄 Recheck permissions',
    checking: '⏳ Checking...', activateLimits: '🚀 Activate App Limits',
    skip: 'Skip (permissions already granted)',
    alreadyExists: 'Already exists',
  },
  de: {
    home: 'Start', habits: 'Gewohnheiten', limits: 'Limits', settings: 'Einstellungen', projects: 'Projekte',
    goodMorning: 'Guten Morgen', goodAfternoon: 'Guten Nachmittag', goodEvening: 'Guten Abend',
    todayEnergy: 'Heutige Energie', welcome: 'Willkommen 👋', buildSystem: 'Baue dein tägliches System',
    todayTasks: 'Heutige Aufgaben', noTasks: 'Noch keine Aufgaben', addTask: 'Aufgabe hinzufügen',
    streak: 'Serie', xp: 'XP', level: 'Level', today: 'Heute',
    completed: 'Abgeschlossen', loading: 'Lädt...',
    addHabit: 'Gewohnheit hinzufügen', noHabits: 'Noch keine Gewohnheiten', tapToAdd: 'Tippe + um deine erste Gewohnheit hinzuzufügen',
    habitComplete: 'Gewohnheit erledigt!', pause: 'Pause', resume: 'Weiter', stop: 'Stopp',
    start: 'Start', startGPS: 'GPS-Tracking starten', tapConfirm: 'Tippen zum Bestätigen',
    pasteLink: 'Link einfügen', writeEntry: 'Eintrag schreiben',
    appLimits: 'App Limits', autoTracking: 'Auto-Tracking aktiv 🟢',
    todayScreenTime: 'Heutiger Screen Time', of: 'von', totalLimit: 'gesamt',
    appsBlocked: 'App(s) gesperrt', resetMidnight: '⏰ Reset um Mitternacht',
    extendXP: 'Mit XP verlängern', extendDesc: '60 XP für +30 Min ausgeben',
    youHave: 'Du hast', addApp: '+ App', all: 'Alle', social: 'Sozial',
    entertainment: 'Unterhaltung', searchApp: 'App suchen...',
    limitLocked: 'Limit gesperrt 🔒',
    limitLockedMsg: 'Du kannst das Limit nicht erhöhen während es erreicht ist. Verwende XP oder warte bis Mitternacht.',
    saveLimit: 'Limit speichern', cancel: 'Abbrechen', customLimit: 'Eigener Wert...',
    blocked: 'GESPERRT', extendOrWait: 'Mit XP verlängern oder bis Mitternacht warten',
    limitReached: 'Limit erreicht', usedToday: 'Heute genutzt', dailyLimit: 'Tageslimit', yourXP: 'Deine XP',
    extendWithXP: 'Mit XP verlängern', openFlowOS: '⚡ In FlowOS öffnen',
    notEnoughXP: 'XP fehlen → Gewohnheiten erledigen',
    extendSuccess: '+30 Minuten freigeschaltet! Viel Spaß 🎉',
    notEnoughXPMsg: 'Nicht genug XP! Erledige Gewohnheiten für mehr XP 💪',
    extending: 'Verlängere...',
    appearance: 'Aussehen', selectTheme: 'Theme auswählen', selectLanguage: 'Sprache auswählen',
    notifications: 'Benachrichtigungen', data: 'Daten', resetData: 'Alle Daten zurücksetzen',
    about: 'Über', feedback: 'Feedback', vision: 'Vision',
    proTitle: 'FlowOS Pro', proDesc: 'Entfalte dein volles Potenzial',
    startTrial: '7-Tage-Test kostenlos starten', proFeature: 'Diese Funktion ist Teil von FlowOS Pro',
    unlockPro: 'Mit FlowOS Pro freischalten',
    yourGoals: 'Deine 2024 Ziele',
    twoPermsNeeded: 'Zwei Berechtigungen nötig',
    usageData: 'App-Nutzungsdaten', overlayPerm: 'Über anderen Apps anzeigen',
    openSettings: 'Öffnen →', recheckPerms: '🔄 Berechtigungen neu prüfen',
    checking: '⏳ Prüfe...', activateLimits: '🚀 App-Limits aktivieren',
    skip: 'Überspringen (Berechtigungen bereits erteilt)',
    alreadyExists: 'Bereits vorhanden',
  },
  fr: {
    home: 'Accueil', habits: 'Habitudes', limits: 'Limites', settings: 'Paramètres', projects: 'Projets',
    goodMorning: 'Bonjour', goodAfternoon: 'Bon après-midi', goodEvening: 'Bonsoir',
    todayEnergy: "Énergie du jour", welcome: 'Bienvenue 👋', buildSystem: 'Construis ton système quotidien',
    todayTasks: "Tâches du jour", noTasks: 'Pas encore de tâches', addTask: 'Ajouter une tâche',
    streak: 'Série', xp: 'XP', level: 'Niveau', today: "Aujourd'hui",
    completed: 'Terminé', loading: 'Chargement...',
    addHabit: 'Ajouter habitude', noHabits: 'Pas encore d\'habitudes', tapToAdd: 'Appuie sur + pour ajouter',
    habitComplete: 'Habitude complète!', pause: 'Pause', resume: 'Reprendre', stop: 'Arrêter',
    start: 'Démarrer', startGPS: 'Démarrer GPS', tapConfirm: 'Appuyer pour confirmer',
    pasteLink: 'Coller le lien', writeEntry: 'Écrire une entrée',
    appLimits: 'Limites App', autoTracking: 'Suivi auto actif 🟢',
    todayScreenTime: "Temps d'écran aujourd'hui", of: 'sur', totalLimit: 'total',
    appsBlocked: 'app(s) bloquée(s)', resetMidnight: '⏰ Réinitialise à minuit',
    extendXP: 'Prolonger avec XP', extendDesc: '60 XP pour +30 min',
    youHave: 'Tu as', addApp: '+ App', all: 'Tout', social: 'Social',
    entertainment: 'Divertissement', searchApp: 'Chercher app...',
    limitLocked: 'Limite verrouillée 🔒',
    limitLockedMsg: 'Tu ne peux pas augmenter la limite. Utilise des XP ou attends minuit.',
    saveLimit: 'Enregistrer', cancel: 'Annuler', customLimit: 'Personnalisé...',
    blocked: 'BLOQUÉ', extendOrWait: 'Prolonger avec XP ou attendre minuit',
    limitReached: 'Limite atteinte', usedToday: "Utilisé aujourd'hui", dailyLimit: 'Limite quotidienne', yourXP: 'Tes XP',
    extendWithXP: 'Prolonger avec XP', openFlowOS: '⚡ Ouvrir FlowOS',
    notEnoughXP: 'XP manquants → complète des habitudes',
    extendSuccess: '+30 minutes débloquées! Profite 🎉',
    notEnoughXPMsg: 'Pas assez de XP! Complète des habitudes 💪',
    extending: 'Extension...',
    appearance: 'Apparence', selectTheme: 'Choisir thème', selectLanguage: 'Choisir langue',
    notifications: 'Notifications', data: 'Données', resetData: 'Réinitialiser les données',
    about: 'À propos', feedback: 'Retour', vision: 'Vision',
    proTitle: 'FlowOS Pro', proDesc: 'Libère ton plein potentiel',
    startTrial: 'Essai gratuit 7 jours', proFeature: 'Cette fonctionnalité fait partie de FlowOS Pro',
    unlockPro: 'Débloquer avec FlowOS Pro',
    yourGoals: 'Tes objectifs 2024',
    twoPermsNeeded: 'Deux autorisations nécessaires',
    usageData: "Données d'utilisation", overlayPerm: 'Afficher sur autres apps',
    openSettings: 'Ouvrir →', recheckPerms: '🔄 Revérifier les autorisations',
    checking: '⏳ Vérification...', activateLimits: '🚀 Activer les limites',
    skip: 'Ignorer (autorisations déjà accordées)',
    alreadyExists: 'Déjà présent',
  },
  es: {
    home: 'Inicio', habits: 'Hábitos', limits: 'Límites', settings: 'Ajustes', projects: 'Proyectos',
    goodMorning: 'Buenos días', goodAfternoon: 'Buenas tardes', goodEvening: 'Buenas noches',
    todayEnergy: 'Energía de hoy', welcome: 'Bienvenido 👋', buildSystem: 'Construye tu sistema diario',
    todayTasks: 'Tareas de hoy', noTasks: 'Aún no hay tareas', addTask: 'Añadir tarea',
    streak: 'Racha', xp: 'XP', level: 'Nivel', today: 'Hoy',
    completed: 'Completado', loading: 'Cargando...',
    addHabit: 'Añadir hábito', noHabits: 'Aún no hay hábitos', tapToAdd: 'Toca + para añadir tu primer hábito',
    habitComplete: '¡Hábito completado!', pause: 'Pausa', resume: 'Reanudar', stop: 'Parar',
    start: 'Iniciar', startGPS: 'Iniciar GPS', tapConfirm: 'Toca para confirmar',
    pasteLink: 'Pegar enlace', writeEntry: 'Escribir entrada',
    appLimits: 'Límites de App', autoTracking: 'Seguimiento automático 🟢',
    todayScreenTime: 'Tiempo de pantalla hoy', of: 'de', totalLimit: 'total',
    appsBlocked: 'app(s) bloqueada(s)', resetMidnight: '⏰ Se restablece a medianoche',
    extendXP: 'Ampliar con XP', extendDesc: '60 XP para +30 min',
    youHave: 'Tienes', addApp: '+ App', all: 'Todo', social: 'Social',
    entertainment: 'Entretenimiento', searchApp: 'Buscar app...',
    limitLocked: 'Límite bloqueado 🔒',
    limitLockedMsg: 'No puedes aumentar el límite. Usa XP o espera a medianoche.',
    saveLimit: 'Guardar límite', cancel: 'Cancelar', customLimit: 'Personalizado...',
    blocked: 'BLOQUEADO', extendOrWait: 'Ampliar con XP o esperar medianoche',
    limitReached: 'Límite alcanzado', usedToday: 'Usado hoy', dailyLimit: 'Límite diario', yourXP: 'Tus XP',
    extendWithXP: 'Ampliar con XP', openFlowOS: '⚡ Abrir FlowOS',
    notEnoughXP: 'XP insuficientes → completa hábitos',
    extendSuccess: '¡+30 minutos desbloqueados! Disfruta 🎉',
    notEnoughXPMsg: '¡No tienes suficientes XP! Completa hábitos 💪',
    extending: 'Ampliando...',
    appearance: 'Apariencia', selectTheme: 'Seleccionar tema', selectLanguage: 'Seleccionar idioma',
    notifications: 'Notificaciones', data: 'Datos', resetData: 'Restablecer datos',
    about: 'Acerca de', feedback: 'Comentarios', vision: 'Visión',
    proTitle: 'FlowOS Pro', proDesc: 'Desbloquea tu máximo potencial',
    startTrial: 'Prueba gratuita 7 días', proFeature: 'Esta función es parte de FlowOS Pro',
    unlockPro: 'Desbloquear con FlowOS Pro',
    yourGoals: 'Tus metas 2024',
    twoPermsNeeded: 'Se necesitan dos permisos',
    usageData: 'Datos de uso de apps', overlayPerm: 'Mostrar sobre otras apps',
    openSettings: 'Abrir →', recheckPerms: '🔄 Verificar permisos de nuevo',
    checking: '⏳ Verificando...', activateLimits: '🚀 Activar límites de apps',
    skip: 'Omitir (permisos ya concedidos)',
    alreadyExists: 'Ya existe',
  },
  tr: {
    home: 'Ana Sayfa', habits: 'Alışkanlıklar', limits: 'Limitler', settings: 'Ayarlar', projects: 'Projeler',
    goodMorning: 'Günaydın', goodAfternoon: 'İyi öğleden sonralar', goodEvening: 'İyi akşamlar',
    todayEnergy: 'Bugünkü Enerji', welcome: 'Hoş geldin 👋', buildSystem: 'Günlük sisteminizi kurun',
    todayTasks: 'Bugünkü Görevler', noTasks: 'Henüz görev yok', addTask: 'Görev ekle',
    streak: 'Seri', xp: 'XP', level: 'Seviye', today: 'Bugün',
    completed: 'Tamamlandı', loading: 'Yükleniyor...',
    addHabit: 'Alışkanlık ekle', noHabits: 'Henüz alışkanlık yok', tapToAdd: 'İlk alışkanlığını eklemek için + tıkla',
    habitComplete: 'Alışkanlık tamamlandı!', pause: 'Duraklat', resume: 'Devam et', stop: 'Durdur',
    start: 'Başlat', startGPS: 'GPS Takibini Başlat', tapConfirm: 'Onaylamak için dokun',
    pasteLink: 'Bağlantıyı yapıştır', writeEntry: 'Giriş yaz',
    appLimits: 'Uygulama Limitleri', autoTracking: 'Otomatik takip aktif 🟢',
    todayScreenTime: 'Bugünkü Ekran Süresi', of: '/', totalLimit: 'toplam',
    appsBlocked: 'uygulama engellendi', resetMidnight: '⏰ Gece yarısı sıfırlanır',
    extendXP: 'XP ile uzat', extendDesc: '+30 dk için 60 XP harca',
    youHave: 'Sahipsin', addApp: '+ Uygulama', all: 'Tümü', social: 'Sosyal',
    entertainment: 'Eğlence', searchApp: 'Uygulama ara...',
    limitLocked: 'Limit Kilitli 🔒',
    limitLockedMsg: 'Limit dolduğunda artıramazsın. XP kullan veya gece yarısına kadar bekle.',
    saveLimit: 'Limiti kaydet', cancel: 'İptal', customLimit: 'Özel...',
    blocked: 'ENGELLENDİ', extendOrWait: 'XP ile uzat veya gece yarısına kadar bekle',
    limitReached: 'Limit Doldu', usedToday: 'Bugün kullanılan', dailyLimit: 'Günlük limit', yourXP: 'XP\'n',
    extendWithXP: 'XP ile uzat', openFlowOS: '⚡ FlowOS\'ta aç',
    notEnoughXP: 'XP yetersiz → alışkanlıkları tamamla',
    extendSuccess: '+30 dakika açıldı! Keyifli kullanımlar 🎉',
    notEnoughXPMsg: 'Yeterli XP yok! Daha fazla kazanmak için alışkanlıkları tamamla 💪',
    extending: 'Uzatılıyor...',
    appearance: 'Görünüm', selectTheme: 'Tema seç', selectLanguage: 'Dil seç',
    notifications: 'Bildirimler', data: 'Veri', resetData: 'Tüm verileri sıfırla',
    about: 'Hakkında', feedback: 'Geri bildirim', vision: 'Vizyon',
    proTitle: 'FlowOS Pro', proDesc: 'Tam potansiyelini ortaya çıkar',
    startTrial: '7 Günlük Ücretsiz Deneme', proFeature: 'Bu özellik FlowOS Pro\'nun parçası',
    unlockPro: 'FlowOS Pro ile aç',
    yourGoals: '2024 Hedeflerin',
    twoPermsNeeded: 'İki İzin Gerekli',
    usageData: 'Uygulama Kullanım Verileri', overlayPerm: 'Diğer uygulamaların üzerinde göster',
    openSettings: 'Aç →', recheckPerms: '🔄 İzinleri yeniden kontrol et',
    checking: '⏳ Kontrol ediliyor...', activateLimits: '🚀 Uygulama limitlerini etkinleştir',
    skip: 'Atla (izinler zaten verildi)',
    alreadyExists: 'Zaten mevcut',
  },
  zh: {
    home: '主页', habits: '习惯', limits: '限制', settings: '设置', projects: '项目',
    goodMorning: '早上好', goodAfternoon: '下午好', goodEvening: '晚上好',
    todayEnergy: '今日能量', welcome: '欢迎 👋', buildSystem: '建立你的每日系统',
    todayTasks: '今日任务', noTasks: '暂无任务', addTask: '添加任务',
    streak: '连续', xp: '经验', level: '等级', today: '今天',
    completed: '已完成', loading: '加载中...',
    addHabit: '添加习惯', noHabits: '暂无习惯', tapToAdd: '点击 + 添加第一个习惯',
    habitComplete: '习惯完成！', pause: '暂停', resume: '继续', stop: '停止',
    start: '开始', startGPS: '开始GPS追踪', tapConfirm: '点击确认',
    pasteLink: '粘贴链接', writeEntry: '写入条目',
    appLimits: '应用限制', autoTracking: '自动追踪中 🟢',
    todayScreenTime: '今日屏幕时间', of: '/', totalLimit: '总计',
    appsBlocked: '个应用已封锁', resetMidnight: '⏰ 午夜重置',
    extendXP: '用经验值延长', extendDesc: '消耗60经验值获得+30分钟',
    youHave: '你有', addApp: '+ 应用', all: '全部', social: '社交',
    entertainment: '娱乐', searchApp: '搜索应用...',
    limitLocked: '限制已锁定 🔒',
    limitLockedMsg: '达到限制时无法增加。使用经验值延长或等到午夜。',
    saveLimit: '保存限制', cancel: '取消', customLimit: '自定义...',
    blocked: '已封锁', extendOrWait: '用经验值延长或等到午夜',
    limitReached: '已达限制', usedToday: '今日已用', dailyLimit: '每日限制', yourXP: '你的经验',
    extendWithXP: '用经验值延长', openFlowOS: '⚡ 在FlowOS中打开',
    notEnoughXP: '经验值不足 → 完成习惯',
    extendSuccess: '+30分钟已解锁！享受吧 🎉',
    notEnoughXPMsg: '经验值不足！完成习惯以赚取更多 💪',
    extending: '延长中...',
    appearance: '外观', selectTheme: '选择主题', selectLanguage: '选择语言',
    notifications: '通知', data: '数据', resetData: '重置所有数据',
    about: '关于', feedback: '反馈', vision: '愿景',
    proTitle: 'FlowOS Pro', proDesc: '释放你的全部潜能',
    startTrial: '开始7天免费试用', proFeature: '此功能是FlowOS Pro的一部分',
    unlockPro: '用FlowOS Pro解锁',
    yourGoals: '你的2024目标',
    twoPermsNeeded: '需要两个权限',
    usageData: '应用使用数据', overlayPerm: '在其他应用上显示',
    openSettings: '打开 →', recheckPerms: '🔄 重新检查权限',
    checking: '⏳ 检查中...', activateLimits: '🚀 激活应用限制',
    skip: '跳过（权限已授予）',
    alreadyExists: '已存在',
  },
};

const AppContext = createContext(null);


export function AppProvider({ children }) {
  // Theme switching disabled - always dark
  const themeId = 'dark';
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    loadData('flowos_settings', {}).then(s => {
      if (s?.language) setLanguage(s.language);
    });
  }, []);

  const setTheme = () => {
    // No-op: theme switching disabled
  };

  const setLang = async (code) => {
    setLanguage(code);
    const s = await loadData('flowos_settings', {});
    await saveData('flowos_settings', { ...s, language: code });
  };

  const colors = THEMES.dark;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <AppContext.Provider value={{ themeId, setTheme, language, setLang, colors, t, THEMES }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

export { THEMES, TRANSLATIONS };
