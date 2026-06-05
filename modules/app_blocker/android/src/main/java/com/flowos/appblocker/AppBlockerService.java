package com.flowos.appblocker;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;

import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

public class AppBlockerService extends Service {

    static final String CHANNEL_ID = "flowos_blocker";
    static final int NOTIF_ID = 1001;
    static final String PREFS_BLOCKLIST = "flowos_blocklist";
    static final String PREFS_BLOCKED_KEY = "_blocked";
    static final String PREFS_NAME_KEY = "_name";
    static final String PREFS_COLOR_KEY = "_color";

    private Handler handler;
    private Runnable checkRunnable;
    private WindowManager windowManager;
    private android.view.View overlayView;
    private String currentOverlayApp = null;

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        handler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FlowOS")
            .setContentText("App-Limits aktiv 🛡️")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSilent(true)
            .build();

        startForeground(NOTIF_ID, notification);
        startMonitoring();
        return START_STICKY;
    }

    private void startMonitoring() {
        checkRunnable = new Runnable() {
            @Override
            public void run() {
                checkForegroundApp();
                handler.postDelayed(this, 1000);
            }
        };
        handler.post(checkRunnable);
    }

    private void checkForegroundApp() {
        String foregroundPkg = getForegroundApp();
        if (foregroundPkg == null) return;

        // If FlowOS itself is open, hide overlay
        if (foregroundPkg.equals(getPackageName())) {
            if (overlayView != null) removeOverlay();
            currentOverlayApp = null;
            return;
        }

        SharedPreferences prefs = getSharedPreferences(PREFS_BLOCKLIST, Context.MODE_PRIVATE);
        boolean isBlocked = prefs.getBoolean(foregroundPkg + PREFS_BLOCKED_KEY, false);

        if (isBlocked) {
            if (!foregroundPkg.equals(currentOverlayApp)) {
                currentOverlayApp = foregroundPkg;
                String appName = prefs.getString(foregroundPkg + PREFS_NAME_KEY, foregroundPkg);
                showOverlay(foregroundPkg, appName);
            }
        } else {
            if (overlayView != null) removeOverlay();
            currentOverlayApp = null;
        }
    }

    private String getForegroundApp() {
        try {
            UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
            long now = System.currentTimeMillis();
            List<UsageStats> stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY, now - 5000, now
            );
            if (stats == null || stats.isEmpty()) return null;

            SortedMap<Long, UsageStats> map = new TreeMap<>();
            for (UsageStats s : stats) {
                if (s.getLastTimeUsed() > 0) map.put(s.getLastTimeUsed(), s);
            }
            if (map.isEmpty()) return null;
            return map.get(map.lastKey()).getPackageName();
        } catch (Exception e) {
            return null;
        }
    }

    private void showOverlay(String pkg, String appName) {
        if (!Settings.canDrawOverlays(this)) return;
        removeOverlay();

        // Root: full-screen dark overlay
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xF2000000);

        // Card
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER_HORIZONTAL);
        card.setBackgroundColor(0xFF1A1A2E);
        card.setPadding(dp(32), dp(40), dp(32), dp(40));

        FrameLayout.LayoutParams cardParams = new FrameLayout.LayoutParams(
            dp(320), LinearLayout.LayoutParams.WRAP_CONTENT
        );
        cardParams.gravity = Gravity.CENTER;
        root.addView(card, cardParams);

        // 🔒
        addTextView(card, "🔒", 52, 0xFF_FF4444, dp(0), dp(0));
        // Title
        addTextView(card, "Limit erreicht", 26, 0xFFFF4444, dp(16), dp(4));
        // App name
        addTextView(card, appName, 20, 0xFFFFFFFF, dp(8), dp(0));
        // Message
        addTextView(card, "Dein tägliches Limit für " + appName + " ist vorbei.\nKomm morgen wieder! 🌙", 13, 0xFFAAAAAA, dp(16), dp(32));

        // Button: Zu FlowOS
        Button btn = new Button(this);
        btn.setText("⚡ In FlowOS öffnen");
        btn.setTextColor(0xFFFFFFFF);
        btn.setBackgroundColor(0xFF6C63FF);
        btn.setPadding(dp(16), dp(12), dp(16), dp(12));
        btn.setOnClickListener(v -> {
            Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (launch != null) {
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                startActivity(launch);
            }
        });
        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        );
        btnParams.setMargins(0, 0, 0, dp(12));
        card.addView(btn, btnParams);

        // Sub-text
        addTextView(card, "⏰ Limit wird um Mitternacht zurückgesetzt", 11, 0xFF666680, dp(0), dp(0));

        // Window params
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_SYSTEM_ALERT,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        );
        lp.gravity = Gravity.FILL;

        overlayView = root;
        windowManager.addView(overlayView, lp);
    }

    private void addTextView(LinearLayout parent, String text, int sp, int color, int topMargin, int bottomMargin) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextSize(sp);
        tv.setTextColor(color);
        tv.setGravity(Gravity.CENTER);
        tv.setLineSpacing(4, 1);
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        p.setMargins(0, topMargin, 0, bottomMargin);
        p.gravity = Gravity.CENTER_HORIZONTAL;
        parent.addView(tv, p);
    }

    private int dp(int val) {
        return Math.round(val * getResources().getDisplayMetrics().density);
    }

    void removeOverlay() {
        if (overlayView != null) {
            try { windowManager.removeView(overlayView); } catch (Exception ignored) {}
            overlayView = null;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "FlowOS App-Limits", NotificationManager.IMPORTANCE_LOW
            );
            ch.setDescription("Überwacht App-Limits im Hintergrund");
            ch.setSound(null, null);
            ((NotificationManager) getSystemService(NotificationManager.class))
                .createNotificationChannel(ch);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && checkRunnable != null) handler.removeCallbacks(checkRunnable);
        removeOverlay();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}
