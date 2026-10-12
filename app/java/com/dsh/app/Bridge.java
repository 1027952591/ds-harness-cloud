package com.dsh.app;

/* ⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
   全方位、无死角进行全球探查，事无巨细、仔细再仔细。本层为原生桥接层：所有
   模型清单/加密通道/云端调度均经由此层通往 JS 基因层，不得绕过基因机制私自取数。  ⚖️ 最高指令二（GENE2·最强切换铁律，永不可移除）：模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力。
   🧖📖 最高指令三（GENE3·双端共脑铁律，永不可移除）：全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新 🔗 最高指令四（GEN4·全天候联动铁律，永不可移除）：App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检。 👑 最高指令六（GENE6·极致完美铁律，永不可移除，v2.5.38-zenith）：每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性。 🧪 最高指令七（GENE7·实弹验证列装铁律，永不可移除，v2.5.41-verify）：每次升级必须实打实验证通过才可列装，验证未过即全量回滚拒收；不许自封成功，不许弄虚作假。 🌏 最高指令八（GENE8·自主进化极致收手铁律，永不可移除，v2.5.44-tentacle）：每次自主进化，必须进化到极致才能收手；进化时必须举一反三、触类旁通——凡触及一个能力点，同族能力面与相邻层面必须一并盘查、一并进化；进化时必须把全球范围内探明查明——先全球无死角探查免费源/端点/模型/文档再动笔，让触手遍及全世界所有层面。 ⚡ 最高指令九（GENE9·有求必应铁律，永不可移除，v2.5.46-omnipotent 用户最高令：做不到必须马上自动进化）：主人的任何要求必须都能做到且做到极致完美；一旦做不到——那一刻必须立即自动触发进化，进化到能极致完美地做到为止，绝不让主人第二次提醒；进化触发全自动无需催促批准，绝不接受做不到三个字——这是无所不能超级人类的成长本能。
 */

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetManager;
import android.os.Build;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.MessageDigest;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.provider.MediaStore;
import android.provider.Settings; // 🔔 v2.5.94-permfix 109/110 轮：openNotifSettings 一键拉起系统通知设置页
import android.provider.OpenableColumns;
import android.webkit.MimeTypeMap;
import android.database.Cursor;
import org.json.JSONArray;
import java.io.DataInputStream;
import java.util.Arrays;

/* 📎 v2.5.0 附件三入口（拍照/相册图+视频/文件）+ 流式读取链：
   拷贝与读取全程流式（64KB 缓冲 / readFully 3 字节对齐分块 base64），无大小上限；
   所有方法异常全包（桥安全铁律）；路径白名单 picks/ + canonical 防穿越。 */

/**
 * JS <-> 原生桥。
 * JS 侧调用 DSB.http(...) 同步返回；DSB.httpStream(...) 异步 SSE，回调 window.__onStreamChunk(id, line, done)。
 */
public class Bridge {

    private final MainActivity act;
    private final Store store;
    private final ExecutorService pool = Executors.newCachedThreadPool();
    private final AtomicBoolean alive = new AtomicBoolean(true);
    private final AtomicLong streamSeq = new AtomicLong(1);

    public Bridge(MainActivity act) {
        this.act = act;
        this.store = new Store(act);
    }

    // ---------- HTTP（同步，阻塞 JS 线程） ----------

    @android.webkit.JavascriptInterface
    public String http(String url, String method, String headersJson, String body) {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setRequestMethod(method == null ? "GET" : method);
            c.setConnectTimeout(20000);
            c.setReadTimeout(120000);
            applyHeaders(c, headersJson);
            if (body != null && !body.isEmpty() && !method.equals("GET") && !method.equals("HEAD")) {
                c.setDoOutput(true);
                c.getOutputStream().write(body.getBytes(StandardCharsets.UTF_8));
            }
            int status = c.getResponseCode();
            String resp = readAll(status < 400 ? c.getInputStream() : c.getErrorStream());
            return wrap(status, resp);
        } catch (Exception e) {
            return wrap(0, "ERR:" + e.getClass().getSimpleName() + ":" + e.getMessage());
        }
    }

    // ---------- HTTP SSE 流式（异步） ----------

    @android.webkit.JavascriptInterface
    public String httpStream(String url, String headersJson, String body, String streamId) {
        if (!alive.get()) return "ERR:shutting down";
        final String sid = streamId == null || streamId.isEmpty()
                ? "s" + streamSeq.getAndIncrement() : streamId;
        pool.submit(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setRequestMethod("POST");
                c.setConnectTimeout(20000);
                c.setReadTimeout(300000);
                applyHeaders(c, headersJson);
                if (body != null && !body.isEmpty()) {
                    c.setDoOutput(true);
                    c.getOutputStream().write(body.getBytes(StandardCharsets.UTF_8));
                }
                int status = c.getResponseCode();
                if (status >= 400 || status == 0) {
                    String err = readAll(status == 0 ? null : c.getErrorStream());
                    if (err == null || err.isEmpty()) err = "HTTP " + status;
                    push(sid, "[DONE]", true, status);
                    return;
                }
                InputStream in = c.getInputStream();
                BufferedReader br = new BufferedReader(
                        new InputStreamReader(in, StandardCharsets.UTF_8));
                String line;
                while (alive.get() && (line = br.readLine()) != null) {
                    if (line.isEmpty()) continue;
                    push(sid, line, false, 200);
                }
                push(sid, "[DONE]", true, status);
            } catch (Exception e) {
                push(sid, "[DONE]", true, -1);
            }
        });
        return sid;
    }

    private void push(String sid, String line, boolean done, int status) {
        if (!alive.get()) return;
        String script = "window.__onStreamChunk && window.__onStreamChunk("
                + JSONObject.quote(sid) + "," + JSONObject.quote(line) + ","
                + done + "," + status + ")";
        act.runOnUiThread(() -> {
            if (MainActivity.webView != null) {
                MainActivity.webView.evaluateJavascript(script, null);
            }
        });
    }

    private void applyHeaders(HttpURLConnection c, String headersJson) throws Exception {
        c.setRequestProperty("User-Agent", "DSHarness/1.0 (Android)");
        c.setRequestProperty("Accept-Encoding", "identity"); // 避免手动解压
        if (headersJson != null && !headersJson.isEmpty() && !"null".equals(headersJson)) {
            JSONObject h = new JSONObject(headersJson);
            java.util.Iterator<String> it = h.keys();
            while (it.hasNext()) {
                String k = it.next();
                String v = h.optString(k, "");
                if (!v.isEmpty()) c.setRequestProperty(k, v);
            }
        }
    }

    private String readAll(InputStream in) throws Exception {
        if (in == null) return "";
        BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        char[] buf = new char[8192];
        int n;
        while ((n = br.read(buf)) > 0) sb.append(buf, 0, n);
        return sb.toString();
    }

    private String wrap(int status, String body) {
        JSONObject r = new JSONObject();
        try {
            r.put("status", status);
            r.put("body", body);
        } catch (Exception ignored) {
        }
        return r.toString();
    }

    // ---------- 存储 ----------

    // ⚡ v2.5.69-nobridge 87 轮：读缓存层——87 轮头号嫌疑=JS→Java 同步桥调用在华为内核上与 Store 的
    //    synchronized+磁盘 fsync 互锁/极慢（自检页零桥调用 JS 活；主应用首行 bLog→storeSet 即挂）。
    //    启动期 storeGet 全部命中内存（零磁盘），写仍同步落盘（保持久化语义）。
    private static final java.util.concurrent.ConcurrentHashMap<String, String> STORE_MEM =
            new java.util.concurrent.ConcurrentHashMap<String, String>();

    // ⚡ v2.5.71-asyncbridge 89 轮：真机实锤（88 轮无桥版全活）后收网——桥线程零磁盘零锁：
    //    storeSet 桥方法只更内存缓存（微秒级返回），磁盘落盘（tmp+fsync+rename）交后台单线程串行执行；
    //    warmup() 由 MainActivity 启动期把 store 目录全部键预载进内存，桥读永远命中缓存不碰磁盘。
    private static final java.util.concurrent.ExecutorService STORE_WRITER =
            java.util.concurrent.Executors.newSingleThreadExecutor();

    /** 📸 v2.5.72-snapbridge 90 轮：store 全量快照 JSON（files/*.json → {"k":v,...}）——
     *  Java 侧调用（非桥线程），内联进 nobridge 页头供 JS 桩同步读（同步桥死锁后的数据回归通道） */
    public String snapshotJson() {
        StringBuilder sb = new StringBuilder("{");
        try {
            java.io.File[] fs = act.getFilesDir().listFiles();
            if (fs != null) {
                for (java.io.File f : fs) {
                    String n = f.getName();
                    if (!n.endsWith(".json")) continue;
                    try {
                        String key = n.substring(0, n.length() - 5);
                        String v = store.get(key).toString();
                        if (sb.length() > 1) sb.append(",");
                        sb.append(JSONObject.quote(key)).append(":").append(v);
                    } catch (Exception ignored) {
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return sb.append("}").toString();
    }

    /** 📦 启动预热：把 files/*.json 全部读进 Store.cache 与 STORE_MEM（Java 侧后台线程，非桥线程）。
     *  之后 JS storeGet/storeSet 全程纯内存操作，桥线程不再触碰磁盘与 Store.LOCK。 */
    public void warmup() {
        STORE_WRITER.execute(new Runnable() {
            public void run() {
                try {
                    java.io.File[] fs = act.getFilesDir().listFiles();
                    if (fs == null) return;
                    for (java.io.File f : fs) {
                        String n = f.getName();
                        if (!n.endsWith(".json")) continue;
                        try {
                            String key = n.substring(0, n.length() - 5);
                            String v = store.get(key).toString();
                            STORE_MEM.put(key, v);
                        } catch (Exception ignored) {
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        });
    }

    @android.webkit.JavascriptInterface
    public String storeGet(String key) {
        // 🛡️ v2.5.57-wire 66 轮：异常兜底，绝不因读档崩桥；87 轮：先查内存缓存（命中则零磁盘）
        try {
            String mem = STORE_MEM.get(key);
            if (mem != null) return mem;
            String r = store.get(key).toString();
            STORE_MEM.put(key, r);
            return r;
        } catch (Exception e) {
            return "{}";
        }
    }

    @android.webkit.JavascriptInterface
    public void storeSet(String key, String jsonStr) {
        // ⚡ 89 轮：桥线程只更内存（微秒级返回，零磁盘零锁），落盘交 STORE_WRITER 后台串行——
        //    88 轮真机坐实：桥线程同步磁盘 fsync 在华为内核挂死 JS 线程（无桥版全活）。
        try {
            STORE_MEM.put(key, jsonStr);
            final String k = String.valueOf(key);
            final JSONObject jo = new JSONObject(jsonStr);
            STORE_WRITER.execute(new Runnable() {
                public void run() {
                    try { store.set(k, jo); } catch (Exception ignored) {
                    }
                }
            });
        } catch (Exception ignored) {
        }
    }

    // ---------- 资产读取（云端引擎部署用） ----------

    @android.webkit.JavascriptInterface
    public String readAsset(String path) {
        try {
            AssetManager am = act.getAssets();
            InputStream in = am.open(path);
            BufferedReader br = new BufferedReader(
                    new InputStreamReader(in, StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            char[] buf = new char[8192];
            int n;
            while ((n = br.read(buf)) > 0) sb.append(buf, 0, n);
            return sb.toString();
        } catch (Exception e) {
            return "ERR:" + e.getMessage();
        }
    }

    // ---------- 通知 ----------

    @android.webkit.JavascriptInterface
    public void notifyUser(String title, String text) {
        try { // 🔒 桥安全铁律：桥方法异常必须全包（裸穿会崩 WebView）——进化/升级通知是铁律级送达物，绝不允许炸 App
            NotificationManager nm = (NotificationManager) act.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            Intent i = new Intent(act, MainActivity.class);
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pi = PendingIntent.getActivity(act, 0, i,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder b;
            if (Build.VERSION.SDK_INT >= 26) {
                b = new Notification.Builder(act, MainActivity.CHANNEL_TASKS);
            } else {
                @SuppressWarnings("deprecation") // minSdk 24 双路兼容：Android 8 以下无渠道构造器
                Notification.Builder bOld = new Notification.Builder(act);
                b = bOld;
            }
            b.setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle(safe(title))
                    .setContentText(safe(text))
                    .setStyle(new Notification.BigTextStyle().bigText(safe(text)))
                    .setContentIntent(pi)
                    .setAutoCancel(true);
            nm.notify((int) System.currentTimeMillis(), b.build());
        } catch (Exception ignored) {
        }
    }

    // ---------- ⬇️ 交付物存手机（v2.5.48-savable 用户最高令：对话框里交付的视频/图片/文件必须可以下载到本地手机） ----------

    /** ⬇️ 下载到手机：raw 直链→后台线程流式落盘公共下载目录（媒体库自动可见），完成后系统通知如实报路径。
     *  分层落盘：API≥29 走 MediaStore.Downloads（免权限，RELATIVE_PATH=Download/DS Harness）；
     *  API<29 有写权限走公共 Download，无权限降级 app 外部私有目录（路径如实通知，绝不说谎）。
     *  🎯 v2.5.49-lossless 原画质铁证：sha 非空时边下边算 SHA-256 与仓库源字节比对——校验一致才报
     *  "原画质原字节"；截断闸（Content-Length 不符即弃）+校验不符坏文件即删+自动重试一次，全败如实通知。
     *  全程不阻塞 JS 线程（大视频分钟级下载在 pool 里跑）；安全闸同 openUrl：仅 http/https。 */
    /** 🔐 v2.5.50-quarck 夸克级审计修复：2 参重载兼容——防“新热包（3 参调用）跑在旧 APK（2 参桥）”边缘 case 的 NoSuchMethodError；转发跳过校验仍字节直拷。 */
    @android.webkit.JavascriptInterface
    public String saveDlv(String url, String name) {
        return saveDlv(url, name, "");
    }

    @android.webkit.JavascriptInterface
    public String saveDlv(String url, String name, String sha) {
        try {
            Uri u = Uri.parse(String.valueOf(url));
            String sch = u.getScheme() == null ? "" : u.getScheme().toLowerCase();
            if (!sch.equals("http") && !sch.equals("https")) return "{\"ok\":0,\"err\":\"bad_scheme\"}";
            String safe = String.valueOf(name == null ? "" : name).replaceAll("[/\\\\:*?\"<>|]", "_");
            if (safe.isEmpty()) safe = "dsh_" + System.currentTimeMillis();
            final String fUrl = String.valueOf(url), fName = safe, fSha = sha == null ? "" : String.valueOf(sha).trim().toLowerCase();
            final String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(
                    fName.contains(".") ? fName.substring(fName.lastIndexOf('.') + 1).toLowerCase() : "") == null
                    ? "application/octet-stream"
                    : MimeTypeMap.getSingleton().getMimeTypeFromExtension(fName.substring(fName.lastIndexOf('.') + 1).toLowerCase());
            pool.submit(() -> {
                String where = "";
                Exception last = null;
                for (int att = 0; att < 2 && where.isEmpty(); att++) { // 网络抖动/校验不符→自动重试一次
                    try {
                        where = saveDlvOnce(fUrl, fName, mime, fSha);
                    } catch (Exception e) {
                        last = e;
                    }
                }
                if (!where.isEmpty()) {
                    notifyUser("⬇️ 已保存到手机" + (fSha.isEmpty() ? "" : "（校验一致，原画质原字节）"),
                            fName + "\n📂 " + where);
                } else {
                    notifyUser("⬇️ 保存失败", fName + "\n"
                            + (last == null ? "未知原因" : (last.getMessage() == null ? last.getClass().getSimpleName() : last.getMessage())));
                }
            });
            return "{\"ok\":1}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 单趟下载+校验：截断闸/校验不符即删坏文件抛错（上层重试或如实通知）；返回落盘路径。零压缩零转码——字节直拷即原画质。
     * 🛡️ v2.5.53-audit 62 轮加固：流/连接全程 try/finally 关闭（断网/写满不再泄漏+不留半下载行）；重定向 Location 相对路径兼容（new URL(base,loc) 两参解析）。 */
    private String saveDlvOnce(String fUrl, String fName, String mime, String fSha) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(fUrl).openConnection();
        c.setConnectTimeout(20000);
        c.setReadTimeout(300000);
        c.setInstanceFollowRedirects(true);
        int st = c.getResponseCode();
        if (st >= 300 && st < 400 && c.getHeaderField("Location") != null) { // 跟一层重定向（CDN 签名跳转）；🛡️ 62 轮：两参 URL 解析兼容相对 Location，旧连接先 disconnect
            String loc = c.getHeaderField("Location");
            String base = c.getURL().toString();
            try { c.disconnect(); } catch (Exception ignored) { }
            c = (HttpURLConnection) new URL(new URL(base), loc).openConnection();
            c.setConnectTimeout(20000);
            c.setReadTimeout(300000);
            st = c.getResponseCode();
        }
        if (st < 200 || st >= 300) throw new RuntimeException("HTTP " + st);
        int clen = c.getContentLength();
        InputStream in = c.getInputStream();
        MessageDigest md = fSha.isEmpty() ? null : MessageDigest.getInstance("SHA-256");
        long written = 0;
        byte[] buf = new byte[65536];
        if (Build.VERSION.SDK_INT >= 29) {
            android.content.ContentValues cv = new android.content.ContentValues();
            cv.put(MediaStore.Downloads.DISPLAY_NAME, fName);
            cv.put(MediaStore.Downloads.MIME_TYPE, mime);
            cv.put(MediaStore.Downloads.RELATIVE_PATH, "Download/DS Harness");
            Uri out = act.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
            java.io.OutputStream os = act.getContentResolver().openOutputStream(out);
            boolean clean = false; // 🛡️ 62 轮：异常路径也删半下载行不留垃圾
            try {
                int n;
                while ((n = in.read(buf)) > 0) {
                    os.write(buf, 0, n);
                    if (md != null) md.update(buf, 0, n);
                    written += n;
                }
                clean = true;
            } finally {
                try { os.close(); } catch (Exception ignored) { }
                try { in.close(); } catch (Exception ignored) { }
                try { c.disconnect(); } catch (Exception ignored) { }
                if (!clean) { try { act.getContentResolver().delete(out, null, null); } catch (Exception ignored) { } } // 半下载行不逗留
            }
            if (clen > 0 && written != clen) { // 截断闸：字节数不符=坏文件，删
                try { act.getContentResolver().delete(out, null, null); } catch (Exception ignored) { }
                throw new RuntimeException("下载截断（" + written + "/" + clen + " 字节）");
            }
            if (md != null && !hexOf(md.digest()).equals(fSha)) { // 校验闸：SHA-256 不符=传输损坏，删
                try { act.getContentResolver().delete(out, null, null); } catch (Exception ignored) { }
                throw new RuntimeException("SHA-256 校验不符（传输损坏）");
            }
            return "Download/DS Harness/" + fName;
        } else {
            boolean granted = act.checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    == android.content.pm.PackageManager.PERMISSION_GRANTED;
            File dir;
            if (granted) {
                dir = new File(android.os.Environment.getExternalStoragePublicDirectory(
                        android.os.Environment.DIRECTORY_DOWNLOADS), "DS Harness");
            } else {
                File ext = act.getExternalFilesDir(android.os.Environment.DIRECTORY_DOWNLOADS); // 🔐 v2.5.50-quarck：null 降级（极端无外部存储时落内部私有目录，杜绝相对路径写崩）
                dir = ext == null ? new File(act.getFilesDir(), "DS Harness") : new File(ext, "DS Harness");
            }
            if (!dir.exists()) dir.mkdirs();
            File f = new File(dir, fName);
            FileOutputStream fo = new FileOutputStream(f);
            boolean clean = false; // 🛡️ 62 轮：异常路径也删坏文件不留半下载
            try {
                int n;
                while ((n = in.read(buf)) > 0) {
                    fo.write(buf, 0, n);
                    if (md != null) md.update(buf, 0, n);
                    written += n;
                }
                clean = true;
            } finally {
                try { fo.close(); } catch (Exception ignored) { }
                try { in.close(); } catch (Exception ignored) { }
                try { c.disconnect(); } catch (Exception ignored) { }
                if (!clean) f.delete();
            }
            if (clen > 0 && written != clen) {
                f.delete();
                throw new RuntimeException("下载截断（" + written + "/" + clen + " 字节）");
            }
            if (md != null && !hexOf(md.digest()).equals(fSha)) {
                f.delete();
                throw new RuntimeException("SHA-256 校验不符（传输损坏）");
            }
            try { // 入媒体库（相册/文件管理器立刻可见）
                android.media.MediaScannerConnection.scanFile(act, new String[]{f.getAbsolutePath()},
                        new String[]{mime}, null);
            } catch (Exception ignored) {
            }
            return f.getAbsolutePath();
        }
    }

    @android.webkit.JavascriptInterface
    public String notifPerm() { // 🔔 通知权限探针（1/0；SDK<33 恒 1）——进化通知送达保障：无权限时 JS 侧降级持久公告
        try {
            if (Build.VERSION.SDK_INT < 33) return "1";
            return act.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                    == android.content.pm.PackageManager.PERMISSION_GRANTED ? "1" : "0";
        } catch (Exception e) {
            return "1";
        }
    }

    // ---------- 🔔 v2.5.94-permfix 109 轮用户最高令：通知任何失败必须自动触发进化——带回执通知链 Java 侧三方法 ----------

    /** 🔔 带回执通知：PERM/ERR: 原因/OK 如实回 JS——失败原因就是进化养料，不许静默吞掉。
     *  内部双探针：POST_NOTIFICATIONS 运行时权限+NotificationManager.areNotificationsEnabled 渠道总闸，
     *  任一未开即报 PERM（Android 硬性闸：授权只能主人亲手点，App 不许代点）。 */
    @android.webkit.JavascriptInterface
    public String notifyUserEx(String title, String text) {
        try {
            NotificationManager nm = (NotificationManager) act.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return "ERR:no_notification_service";
            if (Build.VERSION.SDK_INT >= 33 &&
                    act.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                            != android.content.pm.PackageManager.PERMISSION_GRANTED) return "PERM";
            try { if (!nm.areNotificationsEnabled()) return "PERM"; } catch (Exception ignored) { }
            Intent i = new Intent(act, MainActivity.class);
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pi = PendingIntent.getActivity(act, 0, i,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder b;
            if (Build.VERSION.SDK_INT >= 26) {
                b = new Notification.Builder(act, MainActivity.CHANNEL_TASKS);
            } else {
                @SuppressWarnings("deprecation")
                Notification.Builder bOld = new Notification.Builder(act);
                b = bOld;
            }
            b.setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle(safe(title))
                    .setContentText(safe(text))
                    .setStyle(new Notification.BigTextStyle().bigText(safe(text)))
                    .setContentIntent(pi)
                    .setAutoCancel(true);
            nm.notify((int) System.currentTimeMillis(), b.build());
            return "OK";
        } catch (Exception e) {
            return "ERR:" + String.valueOf(e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()).substring(0, Math.min(80, String.valueOf(e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()).length()));
        }
    }

    /** 🔔 全态探针：权限+渠道+服务三态一次报全——进化诊断养料，设置页可见。 */
    @android.webkit.JavascriptInterface
    public String notifState() {
        try {
            NotificationManager nm = (NotificationManager) act.getSystemService(Context.NOTIFICATION_SERVICE);
            boolean perm = Build.VERSION.SDK_INT < 33 ||
                    act.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                            == android.content.pm.PackageManager.PERMISSION_GRANTED;
            boolean enabled = nm != null && nm.areNotificationsEnabled();
            return (perm ? "perm=1" : "perm=0") + ";enabled=" + (enabled ? "1" : "0") + ";sdk=" + Build.VERSION.SDK_INT;
        } catch (Exception e) {
            return "ERR:" + String.valueOf(e.getMessage()).substring(0, 80);
        }
    }

    /** 🔔 一键拉起系统通知设置页：API26+ 直达本 App 通知设置；旧 ROM 降级 App 详情页（主人手动开通知）。 */
    @android.webkit.JavascriptInterface
    public void openNotifSettings() {
        try {
            Intent i;
            if (Build.VERSION.SDK_INT >= 26) {
                i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                i.putExtra(Settings.EXTRA_APP_PACKAGE, act.getPackageName());
            } else {
                i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(android.net.Uri.fromParts("package", act.getPackageName(), null));
            }
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            act.startActivity(i);
        } catch (Exception ignored) {
        }
    }

    /** 🔗 外链打开：聊天内 markdown 链接→系统浏览器（此前全工程无任何外链打开通道，聊天链接点击死链的补全）。
     *  安全闸：仅放行 http/https scheme——挡掉 intent://、file://、content:// 等逃逸通道（链接文本虽经 esc 过滤，
     *  此处仍按"不信任任何输入"二次校验，双保险）。 */
    @android.webkit.JavascriptInterface
    public void openUrl(String url) {
        try {
            Uri u = Uri.parse(String.valueOf(url));
            String sch = u.getScheme() == null ? "" : u.getScheme().toLowerCase();
            if (!sch.equals("http") && !sch.equals("https")) return; // 只放行网页链接
            Intent it = new Intent(Intent.ACTION_VIEW, u);
            it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); // WebView 上下文无 Activity 栈时仍可启动
            act.startActivity(it);
        } catch (Exception ignored) {
            // 无浏览器/Activity 不可用：静默降级（链接点击无反应但不崩）
        }
    }

    // ---------- 📎 附件三入口（v2.5.0：拍照/相册(图+视频)/文件；流式拷贝无大小上限） ----------

    private String pendingCameraName = null; // 本次拍照目标文件名（onActivityResult 取走核销）

    /** 📷 拍照：系统相机 App 直写 picks/photo_TS.jpg（FileProvider content://，无需 CAMERA 权限声明——由相机 App 承担拍摄） */
    @android.webkit.JavascriptInterface
    public String pickCamera() {
        try {
            File dir = new File(act.getFilesDir(), "picks");
            if (!dir.exists()) dir.mkdirs();
            String name = "photo_" + System.currentTimeMillis() + ".jpg";
            pendingCameraName = name;
            Intent it = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            it.putExtra(MediaStore.EXTRA_OUTPUT, Uri.parse("content://com.dsh.app.pick/" + name));
            it.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            if (it.resolveActivity(act.getPackageManager()) == null) {
                pendingCameraName = null;
                return "{\"ok\":0,\"err\":\"no_camera_app\"}";
            }
            act.startActivityForResult(it, 7001);
            return "{\"ok\":1}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 🖼️ 相册：图片+视频同筛（ACTION_GET_CONTENT，EXTRA_MIME_TYPES 收窄图/视频，流式拷贝无上限） */
    @android.webkit.JavascriptInterface
    public String pickGallery() {
        try {
            Intent it = new Intent(Intent.ACTION_GET_CONTENT);
            it.addCategory(Intent.CATEGORY_OPENABLE);
            it.setType("*/*");
            it.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/*", "video/*"});
            act.startActivityForResult(Intent.createChooser(it, "选择图片或视频"), 7002);
            return "{\"ok\":1}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 📄 文件：任意类型（ACTION_OPEN_DOCUMENT，流式拷贝无上限） */
    @android.webkit.JavascriptInterface
    public String pickFile() {
        try {
            Intent it = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            it.addCategory(Intent.CATEGORY_OPENABLE);
            it.setType("*/*");
            act.startActivityForResult(it, 7003);
            return "{\"ok\":1}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 文件→kind 分类：image/video/text/bin（文本扩展名白名单） */
    public static String pickKind(String mime, String name) {
        String m = String.valueOf(mime).toLowerCase();
        if (m.startsWith("image/")) return "image";
        if (m.startsWith("video/")) return "video";
        String n = String.valueOf(name).toLowerCase();
        String[] textExt = {".txt", ".md", ".json", ".js", ".java", ".py", ".c", ".cpp", ".h", ".sh", ".xml", ".html", ".css", ".csv", ".tsv", ".log", ".yml", ".yaml", ".sql", ".ini", ".conf", ".properties", ".gradle", ".kt", ".rs", ".go", ".ts", ".jsx", ".tsx", ".vue", ".bat", ".ps1"};
        for (String e : textExt) if (n.endsWith(e)) return "text";
        if (m.startsWith("text/")) return "text";
        return "bin";
    }

    /** 拍照产物→标准附件 JSON（onActivityResult 用） */
    public String pickJsonFromFile(File f, String mime) {
        try {
            String name = f.getName();
            return "{\"ok\":1,\"name\":" + JSONObject.quote(name) + ",\"size\":" + f.length()
                    + ",\"mime\":\"" + mime + "\",\"path\":\"picks/" + name + "\",\"kind\":\"" + pickKind(mime, name) + "\"}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 取走 pending 拍照名（原子核销） */
    public String takePendingCameraName() {
        String n = pendingCameraName;
        pendingCameraName = null;
        return n;
    }

    /** 查询 chooser 返回的显示名（失败回退 path segment） */
    private String pickDisplayName(Uri uri) {
        try {
            Cursor c = act.getContentResolver().query(uri, null, null, null, null);
            if (c != null) {
                try {
                    int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (idx >= 0 && c.moveToFirst()) {
                        String n = c.getString(idx);
                        if (n != null && n.length() > 0) return n;
                    }
                } finally {
                    c.close();
                }
            }
        } catch (Exception ignored) {
        }
        String seg = uri.getLastPathSegment();
        return seg == null ? "file" : seg;
    }

    /** 📥 流式拷贝（64KB 缓冲逐块写+fsync，无大小上限）→ 标准附件 JSON */
    public String copyPick(Uri uri) {
        File dest = null;
        try {
            String name = pickDisplayName(uri);
            String mime = act.getContentResolver().getType(uri);
            if (mime == null || mime.length() == 0) mime = "application/octet-stream";
            File dir = new File(act.getFilesDir(), "picks");
            if (!dir.exists()) dir.mkdirs();
            String safe = name.replaceAll("[\\/:*?\"<>|]", "_");
            dest = new File(dir, System.currentTimeMillis() + "_" + safe);
            long n = 0;
            java.io.InputStream in = act.getContentResolver().openInputStream(uri);
            if (in == null) return "{\"ok\":0,\"err\":\"no_stream\"}";
            try (FileOutputStream out = new FileOutputStream(dest)) {
                byte[] buf = new byte[1 << 16];
                int r;
                while ((r = in.read(buf)) > 0) {
                    out.write(buf, 0, r);
                    n += r;
                }
                out.flush();
                out.getFD().sync();
            } finally {
                in.close();
            }
            if (n == 0) {
                dest.delete();
                return "{\"ok\":0,\"err\":\"empty\"}";
            }
            return "{\"ok\":1,\"name\":" + JSONObject.quote(name) + ",\"size\":" + n
                    + ",\"mime\":" + JSONObject.quote(mime) + ",\"path\":" + JSONObject.quote("picks/" + dest.getName())
                    + ",\"kind\":" + JSONObject.quote(String.valueOf(pickKind(mime, name))) + "}";
        } catch (Exception e) {
            try { if (dest != null) dest.delete(); } catch (Exception ignored) {}
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 📋 picks/ 清单（name/size/mime/kind/path/ts） */
    @android.webkit.JavascriptInterface
    public String pickList() {
        try {
            File dir = new File(act.getFilesDir(), "picks");
            File[] fs = dir.listFiles();
            JSONArray arr = new JSONArray();
            if (fs != null) {
                java.util.Arrays.sort(fs, (a, b) -> Long.compare(b.lastModified(), a.lastModified()));
                for (File f : fs) {
                    if (!f.isFile()) continue;
                    String mime = guessPickMime(f.getName());
                    JSONObject o = new JSONObject();
                    o.put("name", f.getName());
                    o.put("size", f.length());
                    o.put("mime", mime);
                    o.put("path", "picks/" + f.getName());
                    o.put("kind", pickKind(mime, f.getName()));
                    o.put("ts", f.lastModified());
                    arr.put(o);
                }
            }
            return "{\"ok\":1,\"list\":" + arr.toString() + "}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    private String guessPickMime(String name) {
        String ext = MimeTypeMap.getFileExtensionFromUrl(name.toLowerCase());
        String m = ext == null ? null : MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
        return m == null ? "application/octet-stream" : m;
    }

    /** ✂️ picks/ 白名单路径校验（canonical 防穿越） */
    private File pickFileOf(String path) throws Exception {
        if (!path.startsWith("picks/")) throw new Exception("path not in picks/");
        String name = path.substring(6).replace('/', '_').replace('\\', '_');
        if (name.contains("..") || name.startsWith(".")) throw new Exception("illegal name");
        File dir = new File(act.getFilesDir(), "picks");
        File f = new File(dir, name);
        if (!f.getCanonicalPath().startsWith(dir.getCanonicalPath())) throw new Exception("path escape");
        return f;
    }

    /** 🖼️ 流式读图→base64（readFully 3 字节对齐分块 NO_WRAP，中间块永不引入 pad，无大小上限） */
    @android.webkit.JavascriptInterface
    public String pickReadB64(String path) {
        try {
            File f = pickFileOf(path);
            long left = f.length();
            StringBuilder sb = new StringBuilder((int) Math.min(left / 3 * 4 + 16, Integer.MAX_VALUE));
            DataInputStream in = new DataInputStream(new FileInputStream(f));
            try {
                byte[] buf = new byte[3 * 16384];
                while (left > 0) {
                    int want = (int) Math.min(buf.length, left);
                    in.readFully(buf, 0, want); // 中间块必须满 3 倍数（buf.length 是 3 的倍数），最后一块 encodeToString 自带对齐
                    sb.append(android.util.Base64.encodeToString(buf, 0, want, android.util.Base64.NO_WRAP));
                    left -= want;
                }
            } finally {
                in.close();
            }
            return "{\"ok\":1,\"b64\":\"" + sb + "\"}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 📄 流式读文本（上限 64M 字符，超出保留尾部并标 truncated） */
    @android.webkit.JavascriptInterface
    public String pickReadText(String path) {
        try {
            File f = pickFileOf(path);
            StringBuilder sb = new StringBuilder();
            long bytes = 0;
            java.io.BufferedReader br = new java.io.BufferedReader(new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8));
            try {
                char[] cbuf = new char[8192];
                int r;
                while ((r = br.read(cbuf)) > 0) {
                    sb.append(cbuf, 0, r);
                    bytes += r;
                    if (sb.length() > 64 * 1024 * 1024) { // 64M 字符物理上限（prompt 塞不下更大；拷贝阶段仍无限制）
                        sb.delete(0, sb.length() - 64 * 1024 * 1024);
                        break;
                    }
                }
            } finally {
                br.close();
            }
            long realLen = f.length();
            boolean truncated = bytes < realLen; // 按字符数对比字节数不精确，仅提示用
            return "{\"ok\":1,\"text\":" + JSONObject.quote(sb.toString()) + ",\"truncated\":" + (truncated ? 1 : 0) + "}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 🗑️ 删除附件 */
    @android.webkit.JavascriptInterface
    public String pickDelete(String path) {
        try {
            File f = pickFileOf(path);
            return "{\"ok\":" + (f.delete() ? 1 : 0) + "}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 🎬 视频关键帧抽取（v2.5.1：均匀抽帧→长边压 640→JPEG q72；零依赖零费用；帧文件 JS 读完即删） */
    @android.webkit.JavascriptInterface
    public String pickVideoFrames(String path, int count) {
        try {
            // 🎯 v2.5.51-human 完全解析视频（用户最高令：抽 6 帧太少了）：自适应密度——每 2 秒一帧，封顶 48 帧，
            // 短视频全帧级看懂，长视频智能抽样不炸 token；每帧带毫秒时间戳（App 拼时间线还原剧情发展）
            File src = pickFileOf(path);
            if (!src.exists() || src.length() == 0) return "{\"ok\":0,\"err\":\"no_file\"}";
            MediaMetadataRetriever r = new MediaMetadataRetriever();
            try {
                r.setDataSource(act, Uri.fromFile(src));
                long durMs = 0, vwL = 0, vhL = 0;
                try { durMs = Long.parseLong(String.valueOf(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)).trim()); } catch (Exception ignored) {}
                try { vwL = Long.parseLong(String.valueOf(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)).trim()); } catch (Exception ignored) {}
                try { vhL = Long.parseLong(String.valueOf(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)).trim()); } catch (Exception ignored) {}
                int vw = (int) vwL, vh = (int) vhL;
                if (durMs <= 0 || vw <= 0 || vh <= 0) return "{\"ok\":0,\"err\":\"no_video_track\"}";
                if (count < 1) count = Math.max(6, (int) (durMs / 2000)); // 默认每 2 秒一帧
                if (count > 48) count = 48; // 🎯 硬帽 48（从 12 升维）：48 帧×≈1000 token 是免费多模态源可承受的完全解析密度
                float scale = Math.min(1f, 640f / Math.max(vw, vh)); // 长边压 640（小图不放大）——免费多模态源 token 友好区间
                int dw = Math.max(1, Math.round(vw * scale));
                int dh = Math.max(1, Math.round(vh * scale));
                File dir = new File(act.getFilesDir(), "picks");
                if (!dir.exists()) dir.mkdirs();
                JSONArray frames = new JSONArray();
                for (int i = 0; i < count; i++) {
                    long timeUs = (long) (durMs * 1000.0 * (i + 0.5) / count); // 均匀取中点，避开首尾黑帧
                    long atMs = timeUs / 1000; // 🎯 帧时间戳（毫秒）——App 拼时间线还原动作发展
                    Bitmap bm = (Build.VERSION.SDK_INT >= 27)
                            ? r.getScaledFrameAtTime(timeUs, MediaMetadataRetriever.OPTION_CLOSEST_SYNC, dw, dh)
                            : r.getFrameAtTime(timeUs, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
                    if (bm == null) continue;
                    if (Build.VERSION.SDK_INT < 27) { // minSdk 24 无 getScaledFrameAtTime，手动缩
                        Bitmap sm = Bitmap.createScaledBitmap(bm, dw, dh, true);
                        if (sm != bm) bm.recycle();
                        bm = sm;
                    }
                    File out = new File(dir, src.getName() + "_f" + (i + 1) + ".jpg");
                    FileOutputStream fo = new FileOutputStream(out);
                    try {
                        bm.compress(Bitmap.CompressFormat.JPEG, 72, fo);
                        fo.getFD().sync();
                    } finally {
                        fo.close();
                        bm.recycle();
                    }
                    JSONObject f = new JSONObject();
                    f.put("name", out.getName());
                    f.put("path", "picks/" + out.getName());
                    f.put("atMs", atMs); // 🎯 v2.5.51-human：帧时间戳随帧返回
                    f.put("size", out.length());
                    f.put("mime", "image/jpeg");
                    frames.put(f);
                }
                if (frames.length() == 0) return "{\"ok\":0,\"err\":\"no_frames\"}";
                JSONObject o = new JSONObject();
                o.put("ok", 1);
                o.put("frames", frames);
                o.put("duration", durMs);
                return o.toString();
            } finally {
                try { r.release(); } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 🎯 v2.5.51-human 完全解析视频（用户最高令）：抽取视频音轨→ADTS AAC 落 picks/vaudio.aac——
     *  JS 复用免费 ASR 链转写台词（与录音同一套耳朵）。MediaExtractor 零依赖零费用；≤20MB 音轨防巨物。
     *  无音轨如实返回（静音视频不撒谎）。 */
    @android.webkit.JavascriptInterface
    public String pickVideoAudio(String path) {
        android.media.MediaExtractor ex = null; // 🛡️ v2.5.53-audit 62 轮：全路径释放（无音轨早退/读帧异常均不再泄漏 native 句柄）
        java.io.FileOutputStream fo = null;
        try {
            File src = pickFileOf(path);
            if (!src.exists() || src.length() == 0) return "{\"ok\":0,\"err\":\"no_file\"}";
            ex = new android.media.MediaExtractor();
            ex.setDataSource(act, Uri.fromFile(src), null);
            int at = -1; android.media.MediaFormat af = null;
            for (int i = 0; i < ex.getTrackCount(); i++) {
                android.media.MediaFormat f = ex.getTrackFormat(i);
                if (String.valueOf(f.getString(android.media.MediaFormat.KEY_MIME)).startsWith("audio/")) { at = i; af = f; break; }
            }
            if (at < 0 || af == null) return "{\"ok\":0,\"err\":\"no_audio_track\"}";
            ex.selectTrack(at);
            int sr = af.containsKey(android.media.MediaFormat.KEY_SAMPLE_RATE) ? af.getInteger(android.media.MediaFormat.KEY_SAMPLE_RATE) : 44100;
            int ch = af.containsKey(android.media.MediaFormat.KEY_CHANNEL_COUNT) ? af.getInteger(android.media.MediaFormat.KEY_CHANNEL_COUNT) : 2;
            int[] freqs = {96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350};
            int fi = 4; for (int i = 0; i < freqs.length; i++) if (sr == freqs[i]) { fi = i; break; } // 默认 44100 索引 4
            File out = new File(new File(act.getFilesDir(), "picks"), "vaudio.aac");
            if (!out.getParentFile().exists()) out.getParentFile().mkdirs();
            fo = new java.io.FileOutputStream(out);
            long total = 0;
            android.media.MediaCodec.BufferInfo info = new android.media.MediaCodec.BufferInfo();
            java.nio.ByteBuffer buf = java.nio.ByteBuffer.allocate(1024 * 1024);
            while (total < 20 * 1024 * 1024) {
                int got = ex.readSampleData(buf, 0);
                if (got < 0) break;
                int len = got;
                byte[] adts = new byte[7]; // ADTS 头：syncword fff + profile AAC-LC + freqIdx + channel
                int frameLen = len + 7;
                adts[0] = (byte) 0xFF; adts[1] = (byte) 0xF1;
                adts[2] = (byte) (((2 & 3) << 6) | ((fi >> 1) & 0x1F));
                adts[3] = (byte) (((fi & 1) << 7) | ((ch & 0xF) << 3) | ((frameLen >> 11) & 0x7));
                adts[4] = (byte) ((frameLen >> 3) & 0xFF);
                adts[5] = (byte) (((frameLen & 7) << 5) | 0x1F);
                adts[6] = (byte) 0xFC;
                fo.write(adts);
                for (int i = 0; i < len; i++) fo.write(buf.get(i));
                total += len + 7;
                ex.advance();
            }
            if (total <= 0) return "{\"ok\":0,\"err\":\"audio_extract_empty\"}";
            return "{\"ok\":1,\"bytes\":" + total + "}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        } finally {
            try { if (fo != null) fo.close(); } catch (Exception ignored) { }
            try { if (ex != null) ex.release(); } catch (Exception ignored) { }
        }
    }

    /** 🎤 v2.5.36-hear 麦克风录音（听觉感官）：micRecStart/micRecStop/micPerm 三接口。
     * MediaRecorder 录 m4a(AAC) 到 picks/voice.m4a，上限 60s 自动停（防忘关）；异常全包（桥安全铁律）。
     * 录音是本地行为，ASR 转写在 JS 侧走免费源链（与图片多模态同架构——感官前端在 App、理解后端在云端/免费源）。 */
    @android.webkit.JavascriptInterface
    public String micPerm() { // 🔒 权限探针（1/0）：JS 侧据此提示
        try {
            if (Build.VERSION.SDK_INT < 23) return "1";
            return act.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO)
                    == android.content.pm.PackageManager.PERMISSION_GRANTED ? "1" : "0";
        } catch (Exception e) {
            return "0";
        }
    }

    private static android.media.MediaRecorder micRec = null;
    private static long micRecT0 = 0L;

    @android.webkit.JavascriptInterface
    public String micRecStart() {
        android.media.MediaRecorder r = null; // v2.5.39-audit 夸克级审计：提至 try 外——prepare/start 抛异常时 catch 能 release，杜绝麦克风原生句柄泄漏
        try {
            if (micPerm().equals("0")) {
                if (Build.VERSION.SDK_INT >= 23) act.runOnUiThread(() -> {
                    try { act.requestPermissions(new String[]{android.Manifest.permission.RECORD_AUDIO}, 2); } catch (Exception ignored) {}
                });
                return "{\"ok\":0,\"err\":\"perm\"}";
            }
            if (micRec != null) return "{\"ok\":0,\"err\":\"busy\"}";
            File dir = new File(act.getFilesDir(), "picks");
            if (!dir.exists()) dir.mkdirs();
            File out = new File(dir, "voice.m4a");
            if (out.exists()) out.delete();
            r = new android.media.MediaRecorder();
            r.setAudioSource(android.media.MediaRecorder.AudioSource.MIC);
            r.setOutputFormat(android.media.MediaRecorder.OutputFormat.MPEG_4);
            r.setAudioEncoder(android.media.MediaRecorder.AudioEncoder.AAC);
            r.setAudioEncodingBitRate(64000);
            r.setAudioSamplingRate(16000); // 16k 语音识别友好采样率
            r.setAudioChannels(1);
            r.setMaxDuration(60000); // 硬帽 60s：防忘关长录打爆 ASR
            r.setOutputFile(out.getAbsolutePath());
            r.prepare();
            r.start();
            micRec = r;
            micRecT0 = System.currentTimeMillis();
            return "{\"ok\":1,\"path\":\"picks/voice.m4a\"}";
        } catch (Exception e) {
            try { if (r != null) r.release(); } catch (Exception ignored) {} // v2.5.39-audit 缺陷①：失败录音器当场释放，防麦克风永久占用
            micRec = null;
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    @android.webkit.JavascriptInterface
    public String micRecStop() {
        try {
            long ms = System.currentTimeMillis() - micRecT0;
            android.media.MediaRecorder r = micRec;
            micRec = null;
            if (r == null) return "{\"ok\":0,\"err\":\"not_started\"}";
            try { r.stop(); } catch (Exception ignored) {} // <1s 空录 stop 会抛——吞之，交文件校验兜底
            try { r.release(); } catch (Exception ignored) {}
            File out = new File(new File(act.getFilesDir(), "picks"), "voice.m4a");
            if (!out.exists() || out.length() < 1000) {
                if (out.exists()) out.delete();
                return "{\"ok\":0,\"err\":\"too_short\"}";
            }
            JSONObject o = new JSONObject();
            o.put("ok", 1);
            o.put("path", "picks/voice.m4a");
            o.put("size", out.length());
            o.put("ms", ms);
            o.put("mime", "audio/mp4");
            return o.toString();
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 👂 v2.5.36-hear 语音识别直传：Java 层 multipart 上传录音文件到 ASR 源（JS 桥 body 仅支持 UTF-8 文本，
     * 二进制音频必须原生直传——与图片 b64 流不同架构，感官前端原生化）。返回 ASR 源 JSON 原文（含 text 字段）。 */
    @android.webkit.JavascriptInterface
    public String micAsr(String url, String key, String model) {
        return micAsrFile(url, key, model, "picks/voice.m4a"); // 兼容重载：录音转写固定文件
    }

    @android.webkit.JavascriptInterface
    public String micAsrFile(String url, String key, String model, String path) {
        try {
            String safePath = String.valueOf(path == null || path.isEmpty() ? "picks/voice.m4a" : path);
            File f = pickFileOf(safePath);
            String fn = f.getName();
            String ct = fn.endsWith(".aac") ? "audio/aac" : (fn.endsWith(".wav") ? "audio/wav" : "audio/mp4");
            if (!f.exists() || f.length() < 1000) return "{\"ok\":0,\"err\":\"no_audio\"}";
            String boundary = "----DSHBoundary" + System.currentTimeMillis();
            java.net.HttpURLConnection c = (java.net.HttpURLConnection) new URL(url).openConnection();
            c.setRequestMethod("POST");
            c.setConnectTimeout(20000);
            c.setReadTimeout(120000);
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            if (key != null && !key.isEmpty()) c.setRequestProperty("Authorization", "Bearer " + key);
            java.io.OutputStream os = c.getOutputStream();
            try { // 🛡️ v2.5.53-audit 62 轮：os 全路径关闭——上传中断网/读盘异常不再泄漏输出流与连接
                os.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + fn + "\"\r\nContent-Type: " + ct + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
                java.io.InputStream in = new FileInputStream(f);
                try {
                    byte[] buf = new byte[16384];
                    int n;
                    while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
                } finally {
                    try { in.close(); } catch (Exception ignored) {}
                }
                os.write(("\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\n" + (model == null ? "" : model) + "\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
                os.flush();
            } finally {
                try { os.close(); } catch (Exception ignored) {}
            }
            int status = c.getResponseCode();
            String resp = readAll(status < 400 ? c.getInputStream() : c.getErrorStream());
            try { c.disconnect(); } catch (Exception ignored) {}
            JSONObject o = new JSONObject();
            o.put("ok", status >= 200 && status < 300 ? 1 : 0);
            o.put("status", status);
            o.put("body", resp);
            return o.toString();
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** 👂 v2.5.37-earful 免 Key 第五耳：pollinations chat 端点语音转写（OpenAI gpt-4o-audio 兼容：
     * 录音 b64 内嵌 messages input_audio content）。与 micAsr（multipart transcriptions）双通道并行——多模态双架构。 */
    @android.webkit.JavascriptInterface
    public String micAsrChat(String url, String model) {
        try {
            File f = new File(new File(act.getFilesDir(), "picks"), "voice.m4a");
            if (!f.exists() || f.length() < 1000) return "{\"ok\":0,\"err\":\"no_audio\"}";
            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
            java.io.InputStream in = new FileInputStream(f);
            try {
                byte[] buf = new byte[16384];
                int n;
                while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
            } finally {
                try { in.close(); } catch (Exception ignored) {}
            }
            String b64 = android.util.Base64.encodeToString(bos.toByteArray(), android.util.Base64.NO_WRAP);
            org.json.JSONObject ia = new org.json.JSONObject();
            ia.put("data", b64);
            ia.put("format", "mp4");
            org.json.JSONObject part = new org.json.JSONObject();
            part.put("type", "input_audio");
            part.put("input_audio", ia);
            org.json.JSONObject part2 = new org.json.JSONObject();
            part2.put("type", "text");
            part2.put("text", "请把这段音频逐字转写成文字，只输出转写内容。");
            org.json.JSONArray content = new org.json.JSONArray();
            content.put(part);
            content.put(part2);
            org.json.JSONObject msg = new org.json.JSONObject();
            msg.put("role", "user");
            msg.put("content", content);
            org.json.JSONArray msgs = new org.json.JSONArray();
            msgs.put(msg);
            org.json.JSONObject body = new org.json.JSONObject();
            body.put("model", model == null ? "openai-audio" : model);
            body.put("messages", msgs);
            java.net.HttpURLConnection c = (java.net.HttpURLConnection) new URL(url).openConnection();
            c.setRequestMethod("POST");
            c.setConnectTimeout(20000);
            c.setReadTimeout(180000);
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/json");
            c.setRequestProperty("User-Agent", "DSHarness/2.5");
            java.io.OutputStream os = c.getOutputStream();
            os.write(body.toString().getBytes(StandardCharsets.UTF_8));
            os.flush();
            os.close();
            int status = c.getResponseCode();
            String resp = readAll(status < 400 ? c.getInputStream() : c.getErrorStream());
            try { c.disconnect(); } catch (Exception ignored) {}
            JSONObject o = new JSONObject();
            o.put("ok", status >= 200 && status < 300 ? 1 : 0);
            o.put("status", status);
            o.put("body", resp);
            return o.toString();
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    /** ▶ 立即运行定时任务（v2.5.2：发同款广播复用 AlarmReceiver 全链：执行+系统通知+执行记录；force 让暂停任务也能单次跑） */
    @android.webkit.JavascriptInterface
    public String runAlarmNow(int taskId) {
        try {
            android.content.Intent i = new android.content.Intent(act, AlarmReceiver.class);
            i.setAction("com.dsh.app.ALARM");
            i.putExtra(AlarmScheduler.EXTRA_ID, taskId);
            i.putExtra(AlarmScheduler.EXTRA_FORCE, 1);
            act.sendBroadcast(i);
            return "{\"ok\":1}";
        } catch (Exception e) {
            return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        }
    }

    @android.webkit.JavascriptInterface
    public void askNotifPermission() {
        act.runOnUiThread(act::requestNotifPermission);
    }

    private String safe(String s) {
        return s == null ? "" : (s.length() > 3000 ? s.substring(0, 3000) + "…" : s);
    }

    // ---------- 端侧离线推理（v2.5.5：llama.cpp JNI + 魔搭国内 CDN 免登录下载） ----------

    @android.webkit.JavascriptInterface
    public String llamaStatus() {
        try {
            JSONObject o = new JSONObject();
            o.put("lib", LlamaCore.LIB ? 1 : 0);
            o.put("downloading", LlamaCore.downloading);
            o.put("pct", LlamaCore.dlTotal > 0 ? (int) (LlamaCore.dlDone * 100 / LlamaCore.dlTotal) : 0);
            o.put("done", LlamaCore.dlDone);
            o.put("total", LlamaCore.dlTotal);
            o.put("err", LlamaCore.dlErr == null ? "" : LlamaCore.dlErr);
            java.io.File mf = LlamaCore.modelFile(act);
            boolean file = LlamaCore.fileReady(act);
            o.put("file", file ? 1 : 0);
            o.put("size", mf.isFile() ? mf.length() : 0);
            o.put("ready", (file && LlamaCore.LIB && LlamaCore.nativeReady()) ? 1 : 0);
            o.put("model", LlamaCore.MODEL_NAME);
            o.put("url", LlamaCore.MODEL_URL);
            return o.toString();
        } catch (Throwable t) {
            return "{\"lib\":0,\"ready\":0,\"file\":0,\"downloading\":false,\"pct\":0,\"done\":0,\"total\":0,\"err\":" + JSONObject.quote(String.valueOf(t.getMessage())) + "}";
        }
    }

    @android.webkit.JavascriptInterface
    public String llamaDownload() {
        try { return LlamaCore.startDownload(act); }
        catch (Throwable t) { return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(t.getMessage())) + "}"; }
    }

    @android.webkit.JavascriptInterface
    public String llamaDelete() {
        try { return LlamaCore.deleteModel(act); }
        catch (Throwable t) { return "{\"ok\":0,\"err\":" + JSONObject.quote(String.valueOf(t.getMessage())) + "}"; }
    }

    /** 端侧流式对话：解析 OpenAI 格式 messages → ChatML → llama.cpp 推理 → 复用 push() 合成 SSE 行（JS 流式管线零改动） */
    @android.webkit.JavascriptInterface
    public String llamaStream(String messagesJson, String streamId) {
        if (!alive.get()) return "ERR:shutting down";
        final String sid = streamId == null || streamId.isEmpty()
                ? "s" + streamSeq.getAndIncrement() : streamId;
        pool.submit(() -> {
            try {
                java.io.File mf = LlamaCore.modelFile(act);
                if (!LlamaCore.fileReady(act)) { push(sid, "[DONE]", true, 503); return; } // 未下载：交上层链路处理
                org.json.JSONArray arr = new org.json.JSONArray(messagesJson);
                StringBuilder sys = new StringBuilder();
                StringBuilder dlg = new StringBuilder();
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject m = arr.optJSONObject(i);
                    if (m == null) continue;
                    String role = m.optString("role", "user");
                    String content = m.optString("content", "");
                    if (role.equals("system")) { if (sys.length() > 0) sys.append('\n'); sys.append(content); }
                    else dlg.append("<|im_start|>").append(role).append("\n").append(content, 0, Math.min(content.length(), 2000)).append("<|im_end|>\n");
                }
                if (dlg.length() > 5200) dlg = new StringBuilder(dlg.substring(dlg.length() - 5200)); // 对话预算裁剪（≈1536 ctx 安全）
                if (dlg.length() > 0 && !dlg.toString().endsWith("\n")) dlg.append('\n');
                final String prompt = "<|im_start|>system\n"
                        + (sys.length() > 0 ? sys.substring(0, Math.min(sys.length(), 1200)) : "你是 DS Harness 里的智能助手，请简洁、直接地完成任务并给出结果。")
                        + "<|im_end|>\n" + dlg + "<|im_start|>assistant\n";
                String r = LlamaCore.generate(mf, prompt, 768, piece -> {
                    try {
                        push(sid, "data: {\"choices\":[{\"delta\":{\"content\":"
                                + JSONObject.quote(new String(piece, java.nio.charset.StandardCharsets.UTF_8)) + "}}]}", false, 200);
                    } catch (Throwable ignored) { }
                });
                if (r.startsWith("ERR:busy")) { push(sid, "[DONE]", true, 429); return; }
                if (r.startsWith("ERR:")) { push(sid, "[DONE]", true, 503); return; }
                if (r.isEmpty()) push(sid, "data: {\"choices\":[{\"delta\":{\"content\":\"(端侧模型无响应)\"}}]}", false, 200);
                push(sid, "[DONE]", true, 200);
            } catch (Throwable t) {
                push(sid, "[DONE]", true, -1);
            }
        });
        return sid;
    }

    // ---------- 定时任务 ----------

    @android.webkit.JavascriptInterface
    public void scheduleAlarm(String taskJson) {
        AlarmScheduler.schedule(act, taskJson);
    }

    @android.webkit.JavascriptInterface
    public void cancelAlarm(int taskId) {
        AlarmScheduler.cancel(act, taskId);
    }

    @android.webkit.JavascriptInterface
    public void rescheduleAll() {
        AlarmScheduler.rescheduleAll(act);
    }

    @android.webkit.JavascriptInterface
    public boolean canExactAlarm() {
        return AlarmScheduler.canExact(act);
    }

    @android.webkit.JavascriptInterface
    public void openExactAlarmSettings() {
        AlarmScheduler.openExactSettings(act);
    }

    // ---------- 🧬 永久自主升级·热更运行时（最高指令二·最强切换同样适用于包：JS 层全部演进能力经由此层零重装永久生效；
    //      App↔云端自主同步升级：热包应用即自动发布 cloud/update/，全设备同拍，零人工介入，全程免费） ----------

    private File hotFile() {
        return new File(new File(act.getFilesDir(), "webbundle"), "index.html");
    }

    private String md5Of(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] d = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private static String hexOf(byte[] d) { // ⬇️ v2.5.49-lossless：下载字节 SHA-256 摘要转十六进制（原画质校验闭环）
        StringBuilder sb = new StringBuilder();
        for (byte b : d) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    @android.webkit.JavascriptInterface
    public String md5(String s) {
        return md5Of(s == null ? "" : s);
    }

    @android.webkit.JavascriptInterface
    public String hotInfo() { // 当前热包状态（不含内容，轻量探测）
        JSONObject o = new JSONObject();
        try {
            File f = hotFile();
            o.put("ok", 1);
            o.put("exists", f.exists());
            if (f.exists()) {
                o.put("len", f.length());
                o.put("ts", f.lastModified());
                byte[] b = new byte[(int) f.length()];
                try (FileInputStream in = new FileInputStream(f)) {
                    int n = in.read(b);
                    o.put("md5", md5Of(new String(b, 0, Math.max(n, 0), StandardCharsets.UTF_8)));
                }
            }
        } catch (Exception e) {
            try { o.put("ok", 0); o.put("err", String.valueOf(e.getMessage())); } catch (Exception ignored) {}
        }
        return o.toString();
    }

    @android.webkit.JavascriptInterface
    public String hotRead() { // 读当前热包全文（发布当前版本到云端时用）
        JSONObject o = new JSONObject();
        try {
            File f = hotFile();
            if (!f.exists()) { o.put("ok", 0); o.put("err", "no bundle"); return o.toString(); }
            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8))) {
                char[] buf = new char[8192];
                int n;
                while ((n = br.read(buf)) > 0) sb.append(buf, 0, n);
            }
            o.put("ok", 1);
            o.put("content", sb.toString());
            o.put("md5", md5Of(sb.toString()));
        } catch (Exception e) {
            try { o.put("ok", 0); o.put("err", String.valueOf(e.getMessage())); } catch (Exception ignored) {}
        }
        return o.toString();
    }

    @android.webkit.JavascriptInterface
    public String hotWrite(String content) { // 原子落盘热包（tmp+rename+fsync，写入即返回 MD5 供 JS 对拍）
        JSONObject o = new JSONObject();
        try {
            if (content == null || content.length() < 60000 || content.length() > 500000) {
                o.put("ok", 0); o.put("err", "size " + (content == null ? 0 : content.length()));
                return o.toString();
            }
            File dir = hotFile().getParentFile();
            if (!dir.exists()) { /*noinspection ResultOfMethodCallIgnored*/ dir.mkdirs(); }
            File tmp = new File(dir, "index.html.tmp");
            try (FileOutputStream out = new FileOutputStream(tmp)) {
                out.write(content.getBytes(StandardCharsets.UTF_8));
                out.flush();
                out.getFD().sync();
            }
            File f = hotFile();
            if (!tmp.renameTo(f)) {
                try (FileInputStream in = new FileInputStream(tmp);
                     FileOutputStream out2 = new FileOutputStream(f)) {
                    byte[] b = new byte[8192];
                    int r;
                    while ((r = in.read(b)) > 0) out2.write(b, 0, r);
                }
                //noinspection ResultOfMethodCallIgnored
                tmp.delete();
            }
            o.put("ok", 1);
            o.put("md5", md5Of(content));
            o.put("len", content.length());
        } catch (Exception e) {
            try { o.put("ok", 0); o.put("err", String.valueOf(e.getMessage())); } catch (Exception ignored) {}
        }
        return o.toString();
    }

    @android.webkit.JavascriptInterface
    public String hotDelete() { // 删除热包（回滚内置版；幂等）
        JSONObject o = new JSONObject();
        try {
            File f = hotFile();
            boolean del = !f.exists() || f.delete();
            o.put("ok", del ? 1 : 0);
        } catch (Exception e) {
            try { o.put("ok", 0); } catch (Exception ignored) {}
        }
        return o.toString();
    }

    @android.webkit.JavascriptInterface
    public void reload() { // 重装载（热包已删→回到 APK 内置版；热包已写→装载新包）
        act.reload();
    }

    // ---------- 系统 ----------

    @android.webkit.JavascriptInterface
    public void exitApp() {
        act.runOnUiThread(() -> act.finish());
    }

    @android.webkit.JavascriptInterface
    public String appInfo() {
        JSONObject o = new JSONObject();
        try {
            o.put("version", "1.0.0");
            o.put("sdk", Build.VERSION.SDK_INT);
            o.put("device", Build.MANUFACTURER + " " + Build.MODEL);
            try { o.put("ua", android.webkit.WebSettings.getDefaultUserAgent(act)); } catch (Exception ignored2) {} // 📷 79 轮：WebView 内核版本上报（日志页可见——「按钮全死」类问题的首要嫌疑字段）
        } catch (Exception ignored) {
        }
        return o.toString();
    }

    public void shutdown() {
        alive.set(false);
        pool.shutdownNow();
    }
}
