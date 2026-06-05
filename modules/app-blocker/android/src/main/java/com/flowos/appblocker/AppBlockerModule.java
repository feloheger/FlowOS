package com.flowos.appblocker;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

public class AppBlockerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public AppBlockerModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() { return "AppBlocker"; }

    @ReactMethod
    public void hasUsagePermission(Promise promise) {
        try {
            AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactContext.getPackageName()
            );
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED);
        } catch (Exception e) { promise.resolve(false); }
    }

    @ReactMethod
    public void hasOverlayPermission(Promise promise) {
        promise.resolve(Settings.canDrawOverlays(reactContext));
    }

    @ReactMethod
    public void startBlockerService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, AppBlockerService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent);
            } else {
                reactContext.startService(intent);
            }
            promise.resolve(true);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void stopBlockerService(Promise promise) {
        try {
            reactContext.stopService(new Intent(reactContext, AppBlockerService.class));
            promise.resolve(true);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    // Called from JS whenever limits change
    // apps: [{ packageName, name, blocked, limitMinutes }]
    @ReactMethod
    public void updateBlocklist(ReadableArray apps, Promise promise) {
        try {
            SharedPreferences.Editor editor = reactContext
                .getSharedPreferences(AppBlockerService.PREFS_BLOCKLIST, Context.MODE_PRIVATE)
                .edit();
            editor.clear();

            for (int i = 0; i < apps.size(); i++) {
                ReadableMap app = apps.getMap(i);
                String pkg = app.getString("packageName");
                String name = app.hasKey("name") ? app.getString("name") : pkg;
                boolean blocked = app.hasKey("blocked") && app.getBoolean("blocked");
                float limit = app.hasKey("limitMinutes") ? (float) app.getDouble("limitMinutes") : 9999f;

                editor.putBoolean(pkg + AppBlockerService.PREFS_BLOCKED_KEY, blocked);
                editor.putString(pkg + AppBlockerService.PREFS_NAME_KEY, name);
                editor.putFloat(pkg + AppBlockerService.PREFS_LIMIT_KEY, limit); // ← NEW: save limit for native tracking
            }
            editor.apply();
            promise.resolve(true);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    // Called from JS to read native usage data back into React state
    @ReactMethod
    public void getUsageData(Promise promise) {
        try {
            SharedPreferences usagePrefs = reactContext
                .getSharedPreferences(AppBlockerService.PREFS_USAGE, Context.MODE_PRIVATE);
            SharedPreferences blockPrefs = reactContext
                .getSharedPreferences(AppBlockerService.PREFS_BLOCKLIST, Context.MODE_PRIVATE);

            WritableMap result = Arguments.createMap();
            for (String key : usagePrefs.getAll().keySet()) {
                if (key.endsWith("_seconds")) {
                    String pkg = key.replace("_seconds", "");
                    float seconds = usagePrefs.getFloat(key, 0f);
                    result.putDouble(pkg, seconds / 60.0); // return as minutes
                }
            }
            promise.resolve(result);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }
}
