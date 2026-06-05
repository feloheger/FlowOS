const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');

const withAppBlockerManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];

    if (!app.service) app.service = [];
    const serviceExists = app.service.some(
      s => s.$?.['android:name'] === 'com.flowos.appblocker.AppBlockerService'
    );
    if (!serviceExists) {
      app.service.push({
        $: {
          'android:name': 'com.flowos.appblocker.AppBlockerService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        'property': [{
          $: {
            'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
            'android:value': 'App usage monitoring for screen time limits',
          }
        }]
      });
    }

    const permissions = manifest.manifest['uses-permission'] || [];
    if (!permissions.some(p => p.$?.['android:name'] === 'android.permission.PACKAGE_USAGE_STATS')) {
      permissions.push({ $: { 'android:name': 'android.permission.PACKAGE_USAGE_STATS', 'tools:ignore': 'ProtectedPermissions' } });
    }
    manifest.manifest['uses-permission'] = permissions;
    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    return config;
  });
};

const withAppBlockerPackage = (config) => {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // Add import with FULL package path
    if (!contents.includes('import com.flowos.appblocker.AppBlockerPackage')) {
      contents = contents.replace(
        /^(package com\.flowos\.app)/m,
        '$1\nimport com.flowos.appblocker.AppBlockerPackage'
      );
    }

    // Add to getPackages() — Expo 51 Kotlin uses PackageList pattern
    if (!contents.includes('AppBlockerPackage()')) {
      if (contents.includes('PackageList(this).packages')) {
        contents = contents.replace(
          /PackageList\(this\)\.packages(\s*$)/m,
          'PackageList(this).packages.also { it.add(AppBlockerPackage()) }$1'
        );
      } else if (contents.includes('return PackageList(this).packages')) {
        contents = contents.replace(
          'return PackageList(this).packages',
          'return PackageList(this).packages.also { it.add(AppBlockerPackage()) }'
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });
};

module.exports = (config) => {
  config = withAppBlockerManifest(config);
  config = withAppBlockerPackage(config);
  return config;
};
