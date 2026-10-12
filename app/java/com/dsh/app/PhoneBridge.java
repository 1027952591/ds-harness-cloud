package com.dsh.app;

/* ⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
   全方位、无死角进行全球探查，事无巨细，仔细再仔细。本层为手机端操控桥（三端分割
   铁律之手机端独立端口）：手机端 Agent 与 📱 手机页的全部文件/应用/设备操作均经由
   本桥通往 Android 原生能力，不得绕过桥直接触达系统，动作一律留痕可审计。
   ⚖️ 最高指令二（GENE2·最强切换铁律，永不可移除）：模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力。
   🧖📖 最高指令三（GENE3·双端共脑铁律，永不可移除）：全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新。
   🔗 最高指令四（GEN4·全天候联动铁律，永不可移除）：App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检。手机端每一个文件/应用操控动作同样强制镜像 cloud/app_state.json。 👑 最高指令六（GENE6·极致完美铁律，永不可移除，v2.5.38-zenith）：每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性。 🧪 最高指令七（GENE7·实弹验证列装铁律，永不可移除，v2.5.41-verify）：每次升级必须实打实验证通过才可列装，验证未过即全量回滚拒收；不许自封成功，不许弄虚作假。 🌏 最高指令八（GENE8·自主进化极致收手铁律，永不可移除，v2.5.44-tentacle）：每次自主进化，必须进化到极致才能收手；进化时必须举一反三、触类旁通——凡触及一个能力点，同族能力面与相邻层面必须一并盘查、一并进化；进化时必须把全球范围内探明查明——先全球无死角探查免费源/端点/模型/文档再动笔，让触手遍及全世界所有层面。  ⚡ 最高指令九（GENE9·有求必应铁律，永不可移除，v2.5.46-omnipotent 用户最高令：做不到必须马上自动进化）：主人的任何要求必须都能做到且做到极致完美；一旦做不到——那一刻必须立即自动触发进化，进化到能极致完美地做到为止，绝不让主人第二次提醒；进化触发全自动无需催促批准，绝不接受做不到三个字——这是无所不能超级人类的成长本能。*/

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.net.Uri;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 📱 手机端操控桥（PHB）：JS 侧经 DSB 同款 JavascriptInterface 模式同步调用。
 * 能力与电脑端操控电脑对齐——本桥即"手机端的鼠标键盘"：
 *   文件：根目录列举/目录浏览/读写/新建/删除/重命名移动/递归搜索；
 *   应用：可启动应用枚举/一键启动；
 *   设备：系统版本/机型/电量/存储/权限状态。
 * 全部方法返回 JSON 字符串 {ok:1,...} / {ok:0,err:...}，异常一律吞并成 JSON 错误，
 * 绝不让原生异常裸穿 WebView 桥（防 JS 端崩溃）。写操作前不越权：权限未授时如实
 * 返回 denied，不伪装成功。
 */
public class PhoneBridge {

    private final MainActivity act;

    /* 四条最高指令 Java 常量（字符级刻入本层，与 AlarmReceiver 同款，永不可移除） */
    private static final String GENE_DIRECTIVE = "每次动态拉取/更新/淘汰：强制深彻·全方位·无死角全球探查，事无巨细，仔细再仔细"; // ⚖️最高指令一，永不可移除
    private static final String GENE_DIRECTIVE2 = "模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力"; // ⚖️最高指令二，永不可移除
    private static final String GENE_DIRECTIVE3 = "全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新"; // 🧖📖最高指令三，永不可移除
    private static final String GENE_DIRECTIVE4 = "App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检"; // 🔗最高指令四，永不可移除

    private static final int LIST_CAP = 800;        // 目录条目上限（防超长 JSON 撑爆桥）
    private static final int READ_CHAR_CAP = 60000;  // 单次读字符上限
    private static final int WRITE_CHAR_CAP = 1000000; // 单次写字符上限（桥传输安全）
    private static final int SEARCH_NODE_CAP = 4000; // 搜索访问节点预算（防爆栈/爆内存）
    private static final int SEARCH_HIT_CAP = 100;   // 搜索命中上限

    public PhoneBridge(MainActivity act) {
        this.act = act;
    }

    /* ================= 权限 ================= */

    @android.webkit.JavascriptInterface
    public boolean fsGranted() {
        try {
            if (Build.VERSION.SDK_INT >= 30) return Environment.isExternalStorageManager();
            int r = act.checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE);
            int w = act.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            return r == PackageManager.PERMISSION_GRANTED && w == PackageManager.PERMISSION_GRANTED;
        } catch (Exception e) {
            return false;
        }
    }

    @android.webkit.JavascriptInterface
    public void fsAsk() {
        // Android 11+：跳系统「所有文件访问」授权页；Android 10-：运行时读写权限弹窗
        act.runOnUiThread(() -> {
            try {
                if (Build.VERSION.SDK_INT >= 30) {
                    Intent i = new Intent(android.provider.Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                            Uri.parse("package:" + act.getPackageName()));
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    act.startActivity(i);
                } else {
                    act.requestPermissions(new String[]{
                            Manifest.permission.READ_EXTERNAL_STORAGE,
                            Manifest.permission.WRITE_EXTERNAL_STORAGE}, 3);
                }
            } catch (Exception ignored) {
            }
        });
    }

    /* ================= 文件 ================= */

    // ---------- 🛡️ AI 文件防护闸（v2.5.20-audit6） ----------
    // 坐实风险：AI 工具循环把 fs_delete（递归删除）等写删能力暴露给模型且路径任意——提示注入（附件/网页/对话里藏恶意指令）
    // 可诱导 AI 递归删除相册/文档。双层闸：①系统敏感区永久禁区（无论开关）②App 私有目录之外默认拦截（设置页可关，关闭后禁区仍生效）。

    /** 防护开关（默认开）：存 settings.phoneToolGuard（JS 设置页同名开关）。读失败按开处理（fail-safe）。 */
    private boolean phoneToolGuard() {
        try {
            return new Store(act).get("settings").optInt("phoneToolGuard", 1) == 1;
        } catch (Exception e) {
            return true;
        }
    }

    /** 是否位于本 App 两个私有目录（内部 filesDir / 外部 externalFilesDir）内——AI 正常工作沙箱区，防护不拦。 */
    private boolean inPrivate(File f) {
        try {
            String p = f.getCanonicalPath();
            String priv = act.getFilesDir().getCanonicalPath();
            if (p.equals(priv) || p.startsWith(priv + File.separator)) return true;
            File ext = act.getExternalFilesDir(null);
            if (ext != null) {
                String ep = ext.getCanonicalPath();
                if (p.equals(ep) || p.startsWith(ep + File.separator)) return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /** 系统敏感区永久禁区：/data /system /proc /sys /vendor /sbin /dev /etc /su* 及其他应用的 Android/data、Android/obb。 */
    private boolean inSystemZone(File f) {
        try {
            String p = f.getCanonicalPath();
            String[] zones = {"/data", "/system", "/proc", "/sys", "/vendor", "/sbin", "/dev", "/etc", "/su", "/xbin"};
            for (String z : zones) {
                if (p.equals(z) || p.startsWith(z + "/")) return true;
            }
            // 其他应用数据区（Android/data、Android/obb 下的非本 App 私有目录）
            File ext = act.getExternalFilesDir(null);
            String own = ext == null ? "" : ext.getCanonicalPath();
            if (p.startsWith("/storage/emulated/0/Android/data/") || p.startsWith("/storage/emulated/0/Android/obb/")) {
                if (!p.equals(own) && !p.startsWith(own + "/")) return true;
            }
            if (p.startsWith("/Android/data/") || p.startsWith("/Android/obb/")) return true; // 相对挂载形态
            return false;
        } catch (Exception e) {
            return false; // canonicalPath 异常时不误拦（后续 OS 权限仍兜底）
        }
    }

    /** 写/删/改名/建目录统一过闸。返回 null=放行；返回 JSON 字符串=已拦截（文案回传模型，模型会向用户解释）。 */
    private String guard(File f) {
        if (f == null) return null;
        if (inSystemZone(f)) return errJson("⛔ 已拦截：该路径位于系统敏感区（系统目录或其他应用数据），AI 永久无权写删");
        if (phoneToolGuard() && !inPrivate(f)) return errJson("⛔ AI 文件防护已拦截：此操作触及 App 私有目录之外（如相册/下载/手机存储）。如确认需要 AI 整理这些区域，请到「设置」关闭「🛡️ AI 文件防护」后重试");
        return null;
    }

    @android.webkit.JavascriptInterface
    public String fsRoots() {
        try {
            JSONArray roots = new JSONArray();
            roots.put(rootEntry(act.getFilesDir(), "App 私有存储（始终可读写）"));
            File ext = act.getExternalFilesDir(null);
            if (ext != null) roots.put(rootEntry(ext, "App 外部私有目录（始终可读写）"));
            File sd = Environment.getExternalStorageDirectory();
            if (sd != null) roots.put(rootEntry(sd, "手机存储根目录"));
            File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (dl != null) roots.put(rootEntry(dl, "Download 下载目录"));
            File dcim = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM);
            if (dcim != null) roots.put(rootEntry(dcim, "DCIM 相机目录"));
            JSONObject o = ok();
            o.put("granted", fsGranted());
            o.put("roots", roots);
            return o.toString();
        } catch (Exception e) {
            return err(e);
        }
    }

    private JSONObject rootEntry(File f, String label) throws Exception {
        JSONObject o = new JSONObject();
        o.put("path", f.getAbsolutePath());
        o.put("label", label);
        return o;
    }

    @android.webkit.JavascriptInterface
    public String fsList(String path) {
        try {
            File dir = new File(path == null ? "" : path);
            if (!dir.exists()) return errJson("目录不存在: " + path);
            if (!dir.isDirectory()) return errJson("不是目录: " + path);
            File[] fs = dir.listFiles();
            JSONObject o = ok();
            JSONArray items = new JSONArray();
            if (fs != null) {
                List<File> sorted = new ArrayList<>();
                Collections.addAll(sorted, fs);
                sorted.sort(new DirFirst());
                int n = 0;
                for (File f : sorted) {
                    if (n++ >= LIST_CAP) break;
                    JSONObject it = new JSONObject();
                    it.put("n", f.getName());
                    it.put("p", f.getAbsolutePath());
                    it.put("dir", f.isDirectory() ? 1 : 0);
                    it.put("size", f.isFile() ? f.length() : 0);
                    it.put("ts", f.lastModified());
                    items.put(it);
                }
            }
            o.put("path", dir.getAbsolutePath());
            o.put("items", items);
            return o.toString();
        } catch (Exception e) {
            return err(e);
        }
    }

    @android.webkit.JavascriptInterface
    public String fsRead(String path, int maxChars) {
        try {
            File f = new File(path == null ? "" : path);
            if (!f.exists() || !f.isFile()) return errJson("文件不存在: " + path);
            int cap = maxChars > 0 ? Math.min(maxChars, READ_CHAR_CAP) : 20000;
            long len = f.length();
            long readBytes = Math.min(len, (long) cap * 3L + 4096L); // UTF-8 单字最多 3 字节，多读一点再截
            if (readBytes > 400_000L) readBytes = 400_000L;
            byte[] buf = new byte[(int) readBytes];
            try (FileInputStream in = new FileInputStream(f)) {
                int got = 0; // 🛡️ v2.5.56-vitals 65 轮：循环读满——旧版单次 in.read 契约不保证读满，部分读即内容静默截断
                while (got < buf.length) {
                    int r = in.read(buf, got, buf.length - got);
                    if (r < 0) break;
                    got += r;
                }
                if (got < 0) got = 0;
                byte[] real = got == buf.length ? buf : java.util.Arrays.copyOf(buf, got);
                // 二进制探测：前 4KB 含 0x00 即判二进制（文本文件不该有 NUL）
                int probeLen = Math.min(real.length, 4096);
                for (int i = 0; i < probeLen; i++) {
                    if (real[i] == 0) {
                        JSONObject o = ok();
                        o.put("binary", 1);
                        o.put("size", len);
                        return o.toString();
                    }
                }
                String text = new String(real, StandardCharsets.UTF_8); // 容错解码：坏字节转 �
                if (text.length() > cap) text = text.substring(0, cap);
                JSONObject o = ok();
                o.put("content", text);
                o.put("size", len);
                return o.toString();
            }
        } catch (Exception e) {
            return err(e);
        }
    }

    @android.webkit.JavascriptInterface
    public String fsWrite(String path, String content, boolean append) {
        try {
            if (path == null || path.isEmpty()) return errJson("路径为空");
            if (content != null && content.length() > WRITE_CHAR_CAP) return errJson("内容超限（>1MB），拒绝写入");
            File f = new File(path);
            File parent = f.getParentFile();
            if (parent != null && !parent.exists() && !parent.mkdirs()) return errJson("父目录创建失败（权限不足？）");
            try (FileOutputStream out = new FileOutputStream(f, append)) {
                if (content != null && !content.isEmpty()) out.write(content.getBytes(StandardCharsets.UTF_8));
                out.flush();
                out.getFD().sync();
            }
            JSONObject o = ok();
            o.put("size", f.length());
            return o.toString();
        } catch (Exception e) {
            return err(e);
        }
    }

    @android.webkit.JavascriptInterface
    public String fsMkdir(String path) {
        try {
            if (path == null || path.isEmpty()) return errJson("路径为空");
            File f = new File(path);
            if (f.exists()) return f.isDirectory() ? ok().toString() : errJson("同名文件已存在");
            if (!f.mkdirs() && !f.isDirectory()) return errJson("创建失败（权限不足？）");
            return ok().toString();
        } catch (Exception e) {
            return err(e);
        }
    }

    @android.webkit.JavascriptInterface
    public String fsDelete(String path) {
        try {
            if (path == null || path.isEmpty()) return errJson("路径为空");
            File f = new File(path);
            if (!f.exists()) return ok().toString(); // 不存在=已删（幂等）
            boolean done = f.delete() || deleteTree(f);
            if (!done && f.exists()) return errJson("删除失败（权限不足？）");
            return ok().toString();
        } catch (Exception e) {
            return err(e);
        }
    }

    @android.webkit.JavascriptInterface
    public String fsRename(String from, String to) {
        try {
            if (from == null || to == null || from.isEmpty() || to.isEmpty()) return errJson("路径为空");
            File src = new File(from), dst = new File(to);
            if (!src.exists()) return errJson("源不存在: " + from);
            if (dst.exists()) return errJson("目标已存在: " + to);
            File parent = dst.getParentFile();
            if (parent != null && !parent.exists() && !parent.mkdirs()) return errJson("目标父目录创建失败");
            if (src.renameTo(dst)) return ok().toString();
            // renameTo 失败（跨卷/被占用）：文件级复制+删源兜底（目录过大拒绝，防半途而废）
            if (src.isFile()) {
                if (src.length() > 64L * 1024L * 1024L) return errJson("跨卷移动文件过大（>64MB），拒绝");
                copyFile(src, dst);
                if (!src.delete()) return errJson("复制成功但删源失败（目标已就位）");
                return ok().toString();
            }
            if (copyTree(src, dst, new int[]{0}) && deleteTree(src)) return ok().toString();
            return errJson("目录跨卷移动失败（可拆分为 复制+删除 两步）");
        } catch (Exception e) {
            return err(e);
        }
    }

    /** 🛡️ v2.5.20-audit6：AI 专用 G 版（Guarded）——只有 PHONE_TOOLS 白名单里的 AI 工具循环走这四个；
     *  用户手动 UI（文件浏览器/保存/删除按钮）继续走原版无闸，互不干扰。 */
    @android.webkit.JavascriptInterface
    public String fsWriteG(String path, String content, boolean append) {
        String g = guard(new File(path == null ? "" : path)); if (g != null) return g;
        return fsWrite(path, content, append);
    }

    @android.webkit.JavascriptInterface
    public String fsMkdirG(String path) {
        String g = guard(new File(path == null ? "" : path)); if (g != null) return g;
        return fsMkdir(path);
    }

    @android.webkit.JavascriptInterface
    public String fsDeleteG(String path) {
        String g = guard(new File(path == null ? "" : path)); if (g != null) return g;
        return fsDelete(path);
    }

    @android.webkit.JavascriptInterface
    public String fsRenameG(String from, String to) {
        String g = guard(new File(from == null ? "" : from)); if (g != null) return g; // 源+目标双查
        g = guard(new File(to == null ? "" : to)); if (g != null) return g;
        return fsRename(from, to);
    }

    @android.webkit.JavascriptInterface
    public String fsSearch(String path, String q) {
        try {
            if (path == null || path.isEmpty() || q == null || q.isEmpty()) return errJson("路径或关键词为空");
            File root = new File(path);
            if (!root.exists() || !root.isDirectory()) return errJson("起始目录不存在: " + path);
            String needle = q.toLowerCase();
            JSONArray items = new JSONArray();
            ArrayDeque<File> queue = new ArrayDeque<>();
            queue.add(root);
            int visited = 0;
            Set<String> seen = new HashSet<>(); // 防符号链接环
            while (!queue.isEmpty() && visited < SEARCH_NODE_CAP && items.length() < SEARCH_HIT_CAP) {
                File dir = queue.poll();
                visited++;
                String key = dir.getCanonicalPath();
                if (!seen.add(key)) continue;
                File[] fs = dir.listFiles();
                if (fs == null) continue; // 无权限目录如实跳过
                for (File f : fs) {
                    if (items.length() >= SEARCH_HIT_CAP) break;
                    if (f.getName().toLowerCase().contains(needle)) {
                        JSONObject it = new JSONObject();
                        it.put("n", f.getName());
                        it.put("p", f.getAbsolutePath());
                        it.put("dir", f.getParent() == null ? "" : f.getParent());
                        it.put("isDir", f.isDirectory() ? 1 : 0);
                        it.put("size", f.isFile() ? f.length() : 0);
                        items.put(it);
                    }
                    if (f.isDirectory() && !f.getName().startsWith(".")) queue.add(f); // 隐藏目录不入队（.git 等噪声）
                }
            }
            JSONObject o = ok();
            o.put("items", items);
            o.put("visited", visited);
            o.put("truncated", items.length() >= SEARCH_HIT_CAP || visited >= SEARCH_NODE_CAP ? 1 : 0);
            return o.toString();
        } catch (Exception e) {
            return err(e);
        }
    }

    /* ================= 应用 ================= */

    @SuppressLint("QueryPermissionsNeeded") // QUERY_ALL_PACKAGES 已在 Manifest 声明（自用工具 App，合规）
    @android.webkit.JavascriptInterface
    public String appList() {
        try {
            PackageManager pm = act.getPackageManager();
            List<ApplicationInfo> all = pm.getInstalledApplications(0);
            List<JSONObject> apps = new ArrayList<>();
            for (ApplicationInfo ai : all) {
                Intent li = pm.getLaunchIntentForPackage(ai.packageName);
                if (li == null) continue; // 只列可启动的（系统服务类应用无启动界面，无意义）
                JSONObject o = new JSONObject();
                String label;
                try {
                    label = String.valueOf(pm.getApplicationLabel(ai));
                } catch (Exception e) {
                    label = ai.packageName;
                }
                o.put("pkg", ai.packageName);
                o.put("label", label);
                apps.add(o);
            }
            apps.sort(Comparator.comparing(a -> a.optString("label", "").toLowerCase()));
            JSONObject o = ok();
            o.put("apps", new JSONArray(apps));
            return o.toString();
        } catch (Exception e) {
            return err(e);
        }
    }

    @android.webkit.JavascriptInterface
    public String appLaunch(String pkg) {
        try {
            if (pkg == null || pkg.isEmpty()) return errJson("包名为空");
            PackageManager pm = act.getPackageManager();
            Intent li = pm.getLaunchIntentForPackage(pkg);
            if (li == null) return errJson("无可启动界面: " + pkg);
            li.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            act.startActivity(li);
            return ok().toString();
        } catch (Exception e) {
            return err(e);
        }
    }

    /* ================= 设备 ================= */

    @android.webkit.JavascriptInterface
    public String devInfo() {
        try {
            JSONObject o = ok();
            o.put("sdk", Build.VERSION.SDK_INT);
            o.put("release", Build.VERSION.RELEASE);
            o.put("device", Build.MANUFACTURER + " " + Build.MODEL);
            o.put("fsGranted", fsGranted());
            try {
                BatteryManager bm = (BatteryManager) act.getSystemService(Context.BATTERY_SERVICE);
                o.put("battery", bm != null ? bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) : -1);
            } catch (Exception e2) {
                o.put("battery", -1);
            }
            JSONObject st = new JSONObject();
            try {
                StatFs internal = new StatFs(Environment.getDataDirectory().getAbsolutePath());
                st.put("intTotal", internal.getTotalBytes());
                st.put("intAvail", internal.getAvailableBytes());
            } catch (Exception e2) {
                st.put("intTotal", 0);
                st.put("intAvail", 0);
            }
            try {
                String extState = Environment.getExternalStorageState();
                boolean mounted = "mounted".equals(extState);
                st.put("extOk", mounted);
                if (mounted) {
                    StatFs ext = new StatFs(Environment.getExternalStorageDirectory().getAbsolutePath());
                    st.put("extTotal", ext.getTotalBytes());
                    st.put("extAvail", ext.getAvailableBytes());
                } else {
                    st.put("extTotal", 0);
                    st.put("extAvail", 0);
                }
            } catch (Exception e2) {
                st.put("extOk", false);
                st.put("extTotal", 0);
                st.put("extAvail", 0);
            }
            o.put("storage", st);
            return o.toString();
        } catch (Exception e) {
            return err(e);
        }
    }

    /* ================= 内部工具 ================= */

    private static JSONObject ok() {
        JSONObject o = new JSONObject();
        try { o.put("ok", 1); } catch (Exception ignored) { }
        return o;
    }

    private static String errJson(String msg) {
        JSONObject o = new JSONObject();
        try { o.put("ok", 0); o.put("err", msg); } catch (Exception ignored) { }
        return o.toString();
    }

    private static String err(Exception e) {
        return errJson(e.getClass().getSimpleName() + (e.getMessage() != null ? ": " + e.getMessage() : ""));
    }

    /** 目录优先、名称不区分大小写排序（文件管理器惯例） */
    private static class DirFirst implements Comparator<File> {
        @Override
        public int compare(File a, File b) {
            if (a.isDirectory() != b.isDirectory()) return a.isDirectory() ? -1 : 1;
            return a.getName().compareToIgnoreCase(b.getName());
        }
    }

    private static void copyFile(File src, File dst) throws Exception {
        try (FileInputStream in = new FileInputStream(src); FileOutputStream out = new FileOutputStream(dst)) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        }
    }

    /** 递归复制目录（budget[0] 为节点预算计数，防失控） */
    private static boolean copyTree(File src, File dst, int[] budget) {
        if (budget[0]++ > 5000) return false;
        if (!dst.mkdirs() && !dst.isDirectory()) return false;
        File[] fs = src.listFiles();
        if (fs == null) return true;
        for (File f : fs) {
            File t = new File(dst, f.getName());
            try {
                if (f.isDirectory()) { if (!copyTree(f, t, budget)) return false; }
                else copyFile(f, t);
            } catch (Exception e) {
                return false;
            }
        }
        return true;
    }

    private static boolean deleteTree(File f) {
        File[] fs = f.listFiles();
        if (fs != null) {
            for (File c : fs) {
                if (c.isDirectory()) { if (!deleteTree(c)) return false; }
                else if (!c.delete()) return false;
            }
        }
        return f.delete();
    }
}
