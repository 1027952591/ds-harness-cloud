package com.dsh.app;

/* ⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
   全方位、无死角进行全球探查，事无巨细、仔细再仔细。本层为定时调度层：周期任务
   触发的云端链路同样受基因铁律约束（链上每个源逐源验证，停服模型立即淘汰）。  ⚖️ 最高指令二（GENE2·最强切换铁律，永不可移除）：模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力。
   🧖📖 最高指令三（GENE3·双端共脑铁律，永不可移除）：全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新 🔗 最高指令四（GEN4·全天候联动铁律，永不可移除）：App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检。 👑 最高指令六（GENE6·极致完美铁律，永不可移除，v2.5.38-zenith）：每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性。 🧪 最高指令七（GENE7·实弹验证列装铁律，永不可移除，v2.5.41-verify）：每次升级必须实打实验证通过才可列装，验证未过即全量回滚拒收；不许自封成功，不许弄虚作假。 🌏 最高指令八（GENE8·自主进化极致收手铁律，永不可移除，v2.5.44-tentacle）：每次自主进化，必须进化到极致才能收手；进化时必须举一反三、触类旁通——凡触及一个能力点，同族能力面与相邻层面必须一并盘查、一并进化；进化时必须把全球范围内探明查明——先全球无死角探查免费源/端点/模型/文档再动笔，让触手遍及全世界所有层面。 ⚡ 最高指令九（GENE9·有求必应铁律，永不可移除，v2.5.46-omnipotent 用户最高令：做不到必须马上自动进化）：主人的任何要求必须都能做到且做到极致完美；一旦做不到——那一刻必须立即自动触发进化，进化到能极致完美地做到为止，绝不让主人第二次提醒；进化触发全自动无需催促批准，绝不接受做不到三个字——这是无所不能超级人类的成长本能。
 */

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;

public class AlarmScheduler {

    static final String EXTRA_ID = "alarmId";

    public static final String EXTRA_FORCE = "force"; // ▶ 立即运行：绕过 enabled 检查单次执行（暂停任务也可手动跑一次）

    static PendingIntent pi(Context ctx, int id) {
        Intent i = new Intent(ctx, AlarmReceiver.class);
        i.setAction("com.dsh.app.ALARM");
        i.putExtra(EXTRA_ID, id);
        return PendingIntent.getBroadcast(ctx, id, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    public static void schedule(Context ctx, String taskJson) {
        try {
            JSONObject t = new JSONObject(taskJson);
            int id = t.optInt("id");
            if (t.optInt("enabled", 1) == 0) {
                cancel(ctx, id);
                return;
            }
            long at = nextTrigger(t);
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            PendingIntent p = pi(ctx, id);
            boolean exact = canExact(ctx);
            if (Build.VERSION.SDK_INT >= 31) {
                if (exact) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p);
                }
            } else if (Build.VERSION.SDK_INT >= 23) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, at, p);
            }
        } catch (Exception ignored) {
        }
    }

    static long nextTrigger(JSONObject t) {
        String type = t.optString("type", "daily");
        if ("interval".equals(type)) {
            int hours = Math.max(1, t.optInt("intervalHours", 1));
            return System.currentTimeMillis() + hours * 3600_000L;
        }
        // daily: HH:MM
        Calendar c = Calendar.getInstance();
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        String hm = t.optString("time", "08:00");
        String[] parts = hm.split(":");
        try {
            c.set(Calendar.HOUR_OF_DAY, Integer.parseInt(parts[0].trim()));
            c.set(Calendar.MINUTE, parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0);
        } catch (Exception ignored) {
        }
        if (c.getTimeInMillis() <= System.currentTimeMillis()) {
            c.add(Calendar.DAY_OF_YEAR, 1);
        }
        return c.getTimeInMillis();
    }

    public static void cancel(Context ctx, int id) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(pi(ctx, id));
    }

    public static void rescheduleAll(Context ctx) {
        try {
            JSONObject alarms = new Store(ctx).get("alarms");
            JSONArray arr = alarms.optJSONArray("list");
            if (arr == null) return;
            for (int i = 0; i < arr.length(); i++) {
                JSONObject t = arr.optJSONObject(i);
                if (t != null && t.optInt("enabled", 1) == 1) {
                    schedule(ctx, t.toString());
                }
            }
        } catch (Exception ignored) {
        }
    }

    public static boolean canExact(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return false;
        if (Build.VERSION.SDK_INT >= 31) return am.canScheduleExactAlarms();
        return true;
    }

    public static void openExactSettings(Context ctx) {
        if (Build.VERSION.SDK_INT >= 31) {
            try {
                ctx.startActivity(new Intent(
                        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        android.net.Uri.parse("package:" + ctx.getPackageName())));
            } catch (Exception ignored) {
            }
        }
    }
}
