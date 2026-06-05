package com.flowos.appblocker;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

public class AppBlockerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public AppBlockerModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "AppBlocker";
    }

    // ─── Check if PACKAGE_USAGE_STATS permission is granted ──────────────────
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
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    // ─── Check if SYSTEM_ALERT_WINDOW (draw over apps) permission is granted ─
    @ReactMethod
    public void hasOverlayPermission(Promise promise) {
        promise.resolve(Settings.canDrawOverlays(reactContext));
    }

    // ─── Open system settings for Usage Stats permission ─────────────────────
    @ReactMethod
    public void requestUsagePermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // ─── Open system settings for Overlay permission ──────────────────────────
    @ReactMethod
    public void requestOverlayPermission(Promise promise) {
        try {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                android.net.Uri.parse("package:" + reactContext.getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // ─── Start the background blocker service ────────────────────────────────
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
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // ─── Stop the blocker service ─────────────────────────────────────────────
    @ReactMethod
    public void stopBlockerService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, AppBlockerService.class);
            reactContext.stopService(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // ─── Update which apps are blocked ───────────────────────────────────────
    // Call this whenever limits change or are reached
    // apps: [{ packageName: "com.zhiliaoapp.musically", name: "TikTok", blocked: true }]
    @ReactMethod
    public void updateBlocklist(ReadableArray apps, Promise promise) {
        try {
            SharedPreferences.Editor editor = reactContext
                .getSharedPreferences(AppBlockerService.PREFS_BLOCKLIST, Context.MODE_PRIVATE)
                .edit();

            // Clear old entries first
            editor.clear();

            for (int i = 0; i < apps.size(); i++) {
                ReadableMap app = apps.getMap(i);
                String pkg = app.getString("packageName");
                String name = app.hasKey("name") ? app.getString("name") : pkg;
                boolean blocked = app.hasKey("blocked") && app.getBoolean("blocked");
                editor.putBoolean(pkg + AppBlockerService.PREFS_BLOCKED_KEY, blocked);
                editor.putString(pkg + AppBlockerService.PREFS_NAME_KEY, name);
            }

            editor.apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
