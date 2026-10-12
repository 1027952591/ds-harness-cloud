package com.dsh.app;

/* ⏱️ v2.5.19-audit5：定时任务前台服务（dataSync 型）——接管 AlarmReceiver 的长任务。
 * 坐实洞：goAsync() 广播窗口仅约 10 秒，云端链任务最坏数分钟，超窗即 ANR/进程被杀、任务静默丢失。
 * 修复：广播秒回，任务在前台服务里长跑（系统保活 + 通知栏可见），完成即自了。
 * 🔗 GEN4 双端联动基因同刻：任务结果落 Store 即被 App 端全层自动云同步管道接走。 */

import android.app.Notification;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

public class TaskService extends Service {

    private static final int NOTIF_ID = 999001; // 前台服务常驻通知 id（与任务结果通知 idSeq 不冲突）

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String taskJson = intent.getStringExtra("taskJson");
        String name = intent.getStringExtra("name");
        // 前台化（5 秒宽限内必调 startForeground——targetSdk 34 硬性要求，超时即 ANR 崩）
        try {
            Notification.Builder b;
            if (Build.VERSION.SDK_INT >= 26) {
                b = new Notification.Builder(this, MainActivity.CHANNEL_TASKS);
            } else {
                @SuppressWarnings("deprecation") // minSdk 24 双路兼容：Android 8 以下无渠道构造器
                Notification.Builder bOld = new Notification.Builder(this);
                b = bOld;
            }
            b.setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle((name == null || name.isEmpty() ? "⏳ DS Harness 任务执行中" : "⏳ " + name))
                    .setContentText("本地/云端模型链执行中，完成后通知结果（前台服务保活，不受广播 10 秒窗口限制）");
            startForeground(NOTIF_ID, b.build());
        } catch (Exception fe) {
            // 🛡️ v2.5.57-wire 66 轮：旧版静默 stopSelf()——Android 12+ 后台 FGS 限制/14 dataSync 运行时限制/渠道异常时
            // 任务凭空蒸发：不执行、不落记录、不通知、lastRunAt 不更新，用户完全无感。修复：失败如实落档+通知，绝不无声。
            try {
                org.json.JSONObject task = new org.json.JSONObject(taskJson == null ? "{}" : taskJson);
                AlarmReceiver.record(new Store(this), task.optInt("id"), System.currentTimeMillis(), "fail",
                        "前台服务启动失败（可能系统限制后台启动），任务未执行：" + fe);
            } catch (Exception ignored2) {
            }
            try {
                android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                Notification.Builder fb = Build.VERSION.SDK_INT >= 26
                        ? new Notification.Builder(this, MainActivity.CHANNEL_TASKS)
                        : new Notification.Builder(this);
                fb.setSmallIcon(android.R.drawable.ic_dialog_alert)
                        .setContentTitle("⚠️ 定时任务未能执行")
                        .setContentText((name == null || name.isEmpty() ? "定时任务" : name) + "：前台服务启动失败，系统可能限制了后台启动");
                nm.notify(999003, fb.build());
            } catch (Exception ignored2) {
            }
            stopSelf();
            return START_NOT_STICKY;
        }
        if (taskJson == null) { stopSelf(); return START_NOT_STICKY; }
        final int sid = startId;
        final String tj = taskJson;
        final String nm = name;
        new Thread(() -> {
            try {
                AlarmReceiver.executeTask(getApplicationContext(), tj, nm);
            } finally {
                stopSelf(sid); // 🛡️ v2.5.56-vitals 65 轮：带 startId 自了——旧版无参 stopSelf() 在两闹钟先后触发时，先完成的任务会把仍在执行的第二个任务的 FGS 连同常驻通知一起停掉（长任务失去保活）
            }
        }).start();
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
