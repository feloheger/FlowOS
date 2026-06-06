const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withAppBlockerManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];

    if (!app.service) app.service = [];
    if (!app.service.some(s => s.$?.['android:name'] === 'com.flowos.appblocker.AppBlockerService')) {
      app.service.push({
        $: {
          'android:name': 'com.flowos.appblocker.AppBlockerService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        'property': [{ $: { 'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE', 'android:value': 'App usage monitoring' } }]
      });
    }

    const permissions = manifest.manifest['uses-permission'] || [];
    if (!permissions.some(p => p.$?.['android:name'] === 'android.permission.PACKAGE_USAGE_STATS')) {
      permissions.push({ $: { 'android:name': 'android.permission.PACKAGE_USAGE_STATS', 'tools:ignore': 'ProtectedPermissions' } });
    }
    manifest.manifest['uses-permission'] = permissions;
    if (!manifest.manifest.$['xmlns:tools']) manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    return config;
  });
};

const withCopyJavaFiles = (config) => {
  return withMainApplication(config, (config) => {
    // Copy Java files into the app's source directory
    const projectRoot = config.modRequest.projectRoot;
    const destDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'flowos', 'appblocker');
    const srcDir = path.join(projectRoot, 'modules', 'app-blocker', 'android', 'src', 'main', 'java', 'com', 'flowos', 'appblocker');

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    ['AppBlockerService.java', 'AppBlockerModule.java', 'AppBlockerPackage.java'].forEach(file => {
      const src = path.join(srcDir, file);
      const dest = path.join(destDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file} to android app directory`);
      } else {
        console.warn(`WARNING: ${src} not found!`);
      }
    });

    // Register package in MainApplication.kt
    let contents = config.modResults.contents;

    if (!contents.includes('import com.flowos.appblocker.AppBlockerPackage')) {
      contents = contents.replace(
        /^(package com\.flowos\.app\n)/m,
        '$1import com.flowos.appblocker.AppBlockerPackage\n'
      );
    }

    if (!contents.includes('AppBlockerPackage()')) {
      contents = contents.replace(
        /return PackageList\(this\)\.packages(\.apply\s*\{[^}]*\})?/,
        (match) => {
          if (match.includes('.apply')) {
            return match.replace('return PackageList(this).packages.apply {', 'return PackageList(this).packages.apply {\n        add(AppBlockerPackage())');
          }
          return match + '.also { it.add(AppBlockerPackage()) }';
        }
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};

module.exports = (config) => {
  config = withAppBlockerManifest(config);
  config = withCopyJavaFiles(config);
  return config;
};
