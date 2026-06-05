import { NativeModules, Platform } from 'react-native';

const { AppBlocker } = NativeModules;

// Package names for common apps
// Android uses package names, not app names, to identify apps
export const APP_PACKAGE_NAMES = {
  tiktok:    'com.zhiliaoapp.musically',
  instagram: 'com.instagram.android',
  youtube:   'com.google.android.youtube',
  twitter:   'com.twitter.android',
  reddit:    'com.reddit.frontpage',
  netflix:   'com.netflix.mediaclient',
  whatsapp:  'com.whatsapp',
  snapchat:  'com.snapchat.android',
  facebook:  'com.facebook.katana',
  twitch:    'tv.twitch.android.app',
};

function checkPlatform() {
  if (Platform.OS !== 'android') {
    console.warn('AppBlocker: only available on Android');
    return false;
  }
  if (!AppBlocker) {
    console.warn('AppBlocker: native module not found — did you run a dev build?');
    return false;
  }
  return true;
}

// Check if usage stats permission is granted
export async function hasUsagePermission() {
  if (!checkPlatform()) return false;
  return AppBlocker.hasUsagePermission();
}

// Check if draw-over-apps permission is granted  
export async function hasOverlayPermission() {
  if (!checkPlatform()) return false;
  return AppBlocker.hasOverlayPermission();
}

// Open settings page for usage stats (user must grant manually)
export async function requestUsagePermission() {
  if (!checkPlatform()) return;
  return AppBlocker.requestUsagePermission();
}

// Open settings page for overlay permission (user must grant manually)
export async function requestOverlayPermission() {
  if (!checkPlatform()) return;
  return AppBlocker.requestOverlayPermission();
}

// Start background monitoring service
export async function startBlockerService() {
  if (!checkPlatform()) return false;
  return AppBlocker.startBlockerService();
}

// Stop background monitoring service
export async function stopBlockerService() {
  if (!checkPlatform()) return false;
  return AppBlocker.stopBlockerService();
}

// Update which apps are blocked right now
// apps = array of { id, name, enabled, packageName? }
// usage = { tiktok: 47.3, instagram: 61.0, ... } (minutes used)
// limits = { tiktok: 45, instagram: 60, ... } (minute limits with offsets)
export async function updateBlocklist(apps, usage, limits) {
  if (!checkPlatform()) return false;

  const blocklist = apps
    .filter(app => app.enabled)
    .map(app => {
      const pkgName = app.packageName || APP_PACKAGE_NAMES[app.id];
      if (!pkgName) return null;

      const usedMin = usage[app.id] || 0;
      const limitMin = limits[app.id] || app.limit;
      const isBlocked = usedMin >= limitMin;

      return {
        packageName: pkgName,
        name: app.name,
        blocked: isBlocked,
        limitMinutes: limitMin, // ← send limit so native service can track
      };
    })
    .filter(Boolean);

  return AppBlocker.updateBlocklist(blocklist);
}

// Read usage data tracked natively (in minutes)
export async function getNativeUsageData() {
  if (!checkPlatform()) return {};
  try {
    return await AppBlocker.getUsageData();
  } catch (e) {
    return {};
  }
}

// Convenience: check all permissions and start if OK
// Returns { ready, needsUsage, needsOverlay }
export async function setupAndStart() {
  if (!checkPlatform()) return { ready: false, needsUsage: false, needsOverlay: false };

  const [usagePerm, overlayPerm] = await Promise.all([
    hasUsagePermission(),
    hasOverlayPermission(),
  ]);

  if (usagePerm && overlayPerm) {
    await startBlockerService();
    return { ready: true, needsUsage: false, needsOverlay: false };
  }

  return {
    ready: false,
    needsUsage: !usagePerm,
    needsOverlay: !overlayPerm,
  };
}
