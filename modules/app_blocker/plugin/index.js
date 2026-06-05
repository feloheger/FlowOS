const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');

// 1. Add service + permissions to AndroidManifest.xml
const withAppBlockerManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];

    // Add the foreground service
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

    // Add PACKAGE_USAGE_STATS to uses-permission (needs to be privileged)
    const permissions = manifest.manifest['uses-permission'] || [];
    const usageStatsExists = permissions.some(
      p => p.$?.['android:name'] === 'android.permission.PACKAGE_USAGE_STATS'
    );
    if (!usageStatsExists) {
      permissions.push({
        $: {
          'android:name': 'android.permission.PACKAGE_USAGE_STATS',
          'tools:ignore': 'ProtectedPermissions',
        }
      });
    }
    manifest.manifest['uses-permission'] = permissions;

    // Add tools namespace if not present
    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    return config;
  });
};

// 2. Register the package in MainApplication
const withAppBlockerPackage = (config) => {
  return withMainApplication(config, (config) => {
    const contents = config.modResults.contents;

    // Add import
    if (!contents.includes('import com.flowos.appblocker.AppBlockerPackage')) {
      config.modResults.contents = contents.replace(
        'import com.facebook.react.ReactApplication;',
        'import com.facebook.react.ReactApplication;\nimport com.flowos.appblocker.AppBlockerPackage;'
      );
    }

    // Add package to getPackages()
    const updated = config.modResults.contents;
    if (!updated.includes('new AppBlockerPackage()')) {
      config.modResults.contents = updated.replace(
        'packages.add(new MainReactPackage());',
        'packages.add(new MainReactPackage());\n      packages.add(new AppBlockerPackage());'
      );
    }

    return config;
  });
};

module.exports = (config) => {
  config = withAppBlockerManifest(config);
  config = withAppBlockerPackage(config);
  return config;
};
