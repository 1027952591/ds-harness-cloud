package com.dsh.app;

/* ⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
   全方位、无死角进行全球探查，事无巨细、仔细再仔细。本层为 App 入口：WebView 启动
   即装载 JS 基因层（refreshAllModels 无条件全源遍历），入口不绕过基因机制。  ⚖️ 最高指令二（GENE2·最强切换铁律，永不可移除）：模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力。
   🧖📖 最高指令三（GENE3·双端共脑铁律，永不可移除）：全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新 🔗 最高指令四（GEN4·全天候联动铁律，永不可移除）：App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检。 👑 最高指令六（GENE6·极致完美铁律，永不可移除，v2.5.38-zenith）：每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性。 🧪 最高指令七（GENE7·实弹验证列装铁律，永不可移除，v2.5.41-verify）：每次升级必须实打实验证通过才可列装，验证未过即全量回滚拒收；不许自封成功，不许弄虚作假。 🌏 最高指令八（GENE8·自主进化极致收手铁律，永不可移除，v2.5.44-tentacle）：每次自主进化，必须进化到极致才能收手；进化时必须举一反三、触类旁通——凡触及一个能力点，同族能力面与相邻层面必须一并盘查、一并进化；进化时必须把全球范围内探明查明——先全球无死角探查免费源/端点/模型/文档再动笔，让触手遍及全世界所有层面。 ⚡ 最高指令九（GENE9·有求必应铁律，永不可移除，v2.5.46-omnipotent 用户最高令：做不到必须马上自动进化）：主人的任何要求必须都能做到且做到极致完美；一旦做不到——那一刻必须立即自动触发进化，进化到能极致完美地做到为止，绝不让主人第二次提醒；进化触发全自动无需催促批准，绝不接受做不到三个字——这是无所不能超级人类的成长本能。
 */

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {

    public static final String CHANNEL_TASKS = "ds_tasks";
    public static WebView webView;
    private Bridge bridge;
    private PhoneBridge phoneBridge; // 📱 95 轮：PHB 手机操控桥接回（11 工具经 RPC 分发器真调，页面零改动）
    private int bootFails = 0; // 🔒 看门狗连续砖损计数（防死循环：>3 停手）
    private volatile boolean probeAck = false; // 🔬 v2.5.63-probe 81 轮：6s 探针回执旗标——false=evaluateJavascript 永无回执=JS 线程被同步调用挂死或引擎根本没跑（v80 用户真机之谜：静态壳+诊断页永不出现，唯一自洽解释）
    private LoopbackServer loop; // 🌐 v2.5.67-loopback 85 轮：本地回环 HTTP 服务器（真 URL 流式加载，绕开 data-URL 型装载在华为内核上的致命缺陷）
    private String baseHttp; // http://127.0.0.1:PORT（loop 启动失败=null 退回 84 轮 null 基址桥载模式）
    private volatile byte[] serveMain; // /index.html 内容（热包优先，crypto 已还原相对路径）
    private volatile byte[] serveProbePage; // /index.probe.html 内容（二分页）

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createChannel();
        webView = new WebView(this);
        setContentView(webView);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        try { s.setAllowFileAccessFromFileURLs(true); s.setAllowUniversalAccessFromFileURLs(true); } catch (Exception ignored) {} // 🌉 v2.5.65-bridge 83 轮：双 file 访问设置全开（统一桥载后页面基址是 file:///android_asset/，保障内嵌 XHR/相对资源不受限）
        s.setTextZoom(100);
        webView.setWebChromeClient(new WebChromeClient() { // 🔬 v2.5.63-probe 81 轮：console 捕获——JS 引擎自己的报错通道（SyntaxError/未捕获异常都会走 console），JS 全死时黑匣子 bLog 写不出，但引擎的报错一定过这里；只收 ERROR/WARN 防刷屏，滚动窗 15 条落盘 consoleLog，诊断页展示
@Override public boolean onConsoleMessage(ConsoleMessage m) {
try {
// 📸 v2.5.72-snapbridge 90 轮：console 回写落盘——[dsb.set]key#i/n\tchunk 分块重组（同步桥死锁后的正式数据通道）
String raw = m.message();
if (raw != null && raw.startsWith("[dsb.")) { // 📸 90 数据回写+91 动作通道：console 单向总线（同步桥 IPC 死锁后的正式桥）
int sp = raw.indexOf(']');
if (sp > 5) {
String act = raw.substring(5, sp);
String arg = (sp + 1 <= raw.length()) ? raw.substring(sp + 1) : "";
try {
if (act.equals("set")) { // 数据写：[dsb.set]key#i/n\tchunk 分块重组落盘
int tab = arg.indexOf('\t');
if (tab > 0) {
String head = arg.substring(0, tab);
int hash = head.indexOf('#'), slash = head.indexOf('/', hash);
if (hash > 0 && slash > hash) {
String key = head.substring(0, hash);
int idx = Integer.parseInt(head.substring(hash + 1, slash));
int tot = Integer.parseInt(head.substring(slash + 1));
StringBuilder acc = (idx == 0) ? new StringBuilder() : setRx.get(key);
if (acc == null) acc = new StringBuilder();
acc.append(arg.substring(tab + 1));
if (idx >= tot - 1) { setRx.remove(key); bridge.storeSet(key, acc.toString()); }
else setRx.put(key, acc);
}
}
}
else if (act.equals("http")) { // 🛰️ 94 轮 asyncnet：异步流式网——[dsb.http]id#i/n\tchunk 请求分块重组，收齐交后台真网络 SSE
netStreams++;
int tab = arg.indexOf('\t');
if (tab > 0) {
String head = arg.substring(0, tab);
int hash = head.indexOf('#'), slash = head.indexOf('/', hash);
if (hash > 0 && slash > hash) {
String id = head.substring(0, hash);
int idx = Integer.parseInt(head.substring(hash + 1, slash));
int tot = Integer.parseInt(head.substring(slash + 1));
StringBuilder acc = (idx == 0) ? new StringBuilder() : httpRx.get(id);
if (acc == null) acc = new StringBuilder();
acc.append(arg.substring(tab + 1));
if (idx >= tot - 1) { httpRx.remove(id); startHttpStream(id, acc.toString()); }
else httpRx.put(id, acc);
}
}
}
else if (act.equals("call")) { // 🔧 95 轮 rpc：通用同步读值通道——[dsb.call]method#seq/i/n\tchunk 分块重组，收齐交 RPC 分发器
rpcCalls++;
int tab = arg.indexOf('\t');
if (tab > 0) {
String head = arg.substring(0, tab);
int hash = head.indexOf('#');
if (hash > 0) {
String rest = head.substring(hash + 1);
int s1 = rest.indexOf('/'), s2 = rest.indexOf('/', s1 + 1);
if (s1 > 0 && s2 > s1) {
String method = head.substring(0, hash);
String seqKey = rest.substring(0, s1);
int idx = Integer.parseInt(rest.substring(s1 + 1, s2));
int tot = Integer.parseInt(rest.substring(s2 + 1));
StringBuilder acc = (idx == 0) ? new StringBuilder() : callRx.get(seqKey);
if (acc == null) acc = new StringBuilder();
acc.append(arg.substring(tab + 1));
if (idx >= tot - 1) { callRx.remove(seqKey); if (method.startsWith("phb_")) dispatchPhb(method, seqKey, acc.toString()); else dispatchRpc(method, seqKey, acc.toString()); }
else callRx.put(seqKey, acc);
}
}
}
}
else if (act.equals("exactset")) { try { bridge.openExactAlarmSettings(); } catch (Exception ignored) {} } // ⏰ 95 轮补接：精确闹钟设置跳转（91 桩面盖了 Java 忘了接）
else if (act.equals("vib")) { try { android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE); if (v != null) { if (android.os.Build.VERSION.SDK_INT >= 26) v.vibrate(android.os.VibrationEffect.createOneShot(80, android.os.VibrationEffect.DEFAULT_AMPLITUDE)); else v.vibrate(80); } } catch (Exception ignored) {} } // 📳 95 轮补接：震动
else if (act.equals("savedlv")) { // 📦 95 轮补接：交付下载——[dsb.savedlv]url\tname\tsha 后台流式落盘 Download/DS Harness（完成后 toast 通知）
int t2 = arg.indexOf('\t');
int t3 = arg.indexOf('\t', t2 + 1);
String u = t2 > 0 ? arg.substring(0, t2) : arg;
String nm = (t2 > 0 && t3 > t2) ? arg.substring(t2 + 1, t3) : "";
String sha = (t3 > t2) ? arg.substring(t3 + 1) : "";
final String fu = u, fn = nm, fs = sha;
NET_POOL.execute(new Runnable() { public void run() {
try { bridge.saveDlv(fu, fn, fs); } catch (Exception ignored) {}
}}); }
else if (act.equals("notify")) { int t2 = arg.indexOf('\t'); bridge.notifyUser(t2 > 0 ? arg.substring(0, t2) : "小神", t2 > 0 ? arg.substring(t2 + 1) : arg); } // 🔔 91 轮：系统通知真送达
else if (act.equals("openurl")) bridge.openUrl(arg);
else if (act.equals("alarm")) bridge.scheduleAlarm(arg);
else if (act.equals("alarmcancel")) bridge.cancelAlarm(Integer.parseInt(arg.trim()));
else if (act.equals("alarmnow")) bridge.runAlarmNow(Integer.parseInt(arg.trim()));
else if (act.equals("resched")) bridge.rescheduleAll();
else if (act.equals("askperm")) bridge.askNotifPermission();
else if (act.equals("reload")) bridge.reload();
else if (act.equals("exit")) bridge.exitApp();
else if (act.equals("hotdel")) bridge.hotDelete();
else if (act.equals("toast")) android.widget.Toast.makeText(MainActivity.this, arg, android.widget.Toast.LENGTH_SHORT).show();
} catch (Exception ignored) {}
}
return true;
}
String lv = String.valueOf(m.messageLevel());
                    if (lv.contains("ERROR") || lv.contains("WARNING")) {
                        String line = "[" + lv + "] " + m.message() + " @" + m.sourceId() + ":" + m.lineNumber();
                        String cur = bridge.storeGet("consoleLog");
                        String[] arr = (cur == null || cur.isEmpty() ? new String[0] : cur.split("\n----\n"));
                        StringBuilder sb = new StringBuilder();
                        int from = Math.max(0, arr.length - 14);
                        for (int i = from; i < arr.length; i++) sb.append(arr[i]).append("\n----\n");
                        if (line.length() > 400) line = line.substring(0, 400);
                        sb.append(line);
                        bridge.storeSet("consoleLog", sb.toString());
                    }
                } catch (Exception ignored) {}
                return false; // 不吞默认行为
            }
        });
        webView.setWebViewClient(new WebViewClient() { // 🐾 v2.5.61-flash 79 轮：拦截 dsh:// 内部自愈链（零 JS 诊断页按钮专用——JS 全死时唯一能触达 Java 的通道）
            @Override public boolean shouldOverrideUrlLoading(WebView v, String url) {
                if (url != null && url.startsWith("dsh://")) {
                    String a = url.substring(6);
                    if ("boot-wipe".equals(a)) { // 🚑 清存档重启（黑匣子/毒档终极自愈）
                        try { for (String k : new String[]{"settings", "sessions", "projects", "alarms", "plugins", "balance", "bootErr", "bootLog", "bootFailLog", "jsProbe", "consoleLog", "watchdogRevert", "stage1", "probeMain", "nobridge", "bootTitle", "settings.bak", "sessions.bak", "projects.bak", "alarms.bak", "plugins.bak", "balance.bak", "updNotice"}) bridge.storeSet(k, "{}"); } catch (Exception ignored) {} // 🧹 88 轮：清档扩容 bootTitle
                        try { bridge.hotDelete(); } catch (Exception ignored) {}
                    }
                    bootFails = 0; // 重试给满新机会
                    if ("boot-probemain".equals(a)) { probeMainTest(); return true; } // 🔬 82 轮：主块替换二分测试
                    if ("boot-nobridge".equals(a)) { nobridgeTest(); return true; } // 🧪 87 轮：无桥实验（桥死锁验证）
                    bootLadder(); // 🪜 82 轮：重试也走启动梯（先自检再载主应用）
                    return true;
                }
                return false;
            }
        });
bridge = new Bridge(this);
phoneBridge = new PhoneBridge(this); // 📱 95 轮：PHB 接线
bridge.warmup(); // ⚡ 89 轮：启动预热 store 全量进内存，桥线程永不碰磁盘（asyncbridge 收网）
webView.addJavascriptInterface(bridge, "DSB");
        webView.addJavascriptInterface(new PhoneBridge(this), "PHB"); // 📱 手机端操控桥（三端分割铁律：手机端独立端口——文件读写/应用枚举启动/设备状态，与电脑端操控电脑同级别）
        // 🌐 v2.5.67-loopback 85 轮：启动本地回环 HTTP——84 轮真机实弹：null 基址大页首次渲染接管但 JS 死、复载挂死渲染管线（连诊断页都出不来）→ data-URL 型装载在华为内核有致命缺陷 → 真 HTTP 流式加载绕开；小页（自检/过渡/诊断）已证 loadData 活，仍走原路
        try {
            loop = new LoopbackServer(new LoopbackServer.AssetProvider() {
                @Override public byte[] get(String path) {
                    try {
                        if ("/index.html".equals(path)) return serveMain;
                        if ("/index.probe.html".equals(path)) return serveProbePage;
                        if ("/crypto.js".equals(path)) { String c = readAsset("crypto.js"); return c == null ? null : c.getBytes("UTF-8"); }
                    } catch (Exception ignored) {}
                    return null;
                }
                @Override public String contentType(String path) { return path != null && path.endsWith(".js") ? "application/javascript" : "text/html; charset=utf-8"; }
            });
            if (loop.start()) baseHttp = "http://127.0.0.1:" + loop.port;
        } catch (Exception ignored) { loop = null; baseHttp = null; }
        bootLadder(); // 🪜 v2.5.64-ladder 82 轮：启动先走两段式启动梯（迷你自检页判引擎活死→再载主应用）；大页走 loopback HTTP（85 轮）
    }

    /* 🔬 v2.5.64-ladder 82 轮·两段式启动梯（Java 主导，不再依赖 JS 自举，也不再依赖用户等时）：
       第 0 段：先载迷你自检页 probe.html（15 行，内联 <script> 立即改标题为 PROBE_JS_OK，页面可见「启动自检中」）——用户 0.5 秒内就能看到页面在动；
       第 1 段：2.5s/4s 两次双信号判定——①getTitle()（纯 Java 同步信号，完全不依赖 evaluateJavascript 回调）②evaluate 回执——任一信号见 PROBE_JS_OK=引擎活着→载主应用+看门狗；双信号全无=引擎对 15 行迷你页都无反应=设备 WebView 层问题→立即出诊断页（附华为/荣耀 WebView 更新建议）；
       判定结果落盘 stage1（OK:title/OK:eval/FAIL:both），诊断页展示——若 stage1 通过而主应用仍死，下轮二分直接锁定「主块内容凶手」。 */
    private void bootLadder() {
        try {
            webView.loadDataWithBaseURL(null, probeHtml(), "text/html; charset=utf-8", "utf-8", null);
        } catch (Exception ignored) {}
        final Handler h = new Handler(Looper.getMainLooper());
        final int[] round = {0};
        h.postDelayed(new Runnable() {
            @Override public void run() {
                String t = ""; try { t = webView.getTitle(); } catch (Exception ignored) {}
                if (t != null && t.contains("PROBE_JS_OK")) {
                    try { bridge.storeSet("stage1", "OK:title（getTitle 纯 Java 信号——引擎能执行内联脚本）"); } catch (Exception ignored) {}
                    // 🪜 v2.5.66-nullbase 84 轮：probe2 过渡页——83 轮实弹卡死在自检页（399KB file 基址桥载没渲染接管屏幕），
                    //    过渡页让「卡在 stage1 判定」vs「卡在大页装载」一张截图可分；400ms 后再载主应用
                    try { webView.loadDataWithBaseURL(null, probe2Html(), "text/html; charset=utf-8", "utf-8", null); } catch (Exception ignored) {}
                    h.postDelayed(() -> loadWeb(), 400);
                    h.postDelayed(hbTick, 4000); // 🫓 92 轮：装载后 4s 起心跳收割（evaluate 双通道保险）
                    return;
                }
                round[0]++;
                if (round[0] == 1) { h.postDelayed(this, 1500); return; } // 2.5s 未中再给 4s 第二次机会（首初始化慢的机器）
                // 双次全无→引擎死亡（evaluate 副信号也一并落盘作证据）
                try { bridge.storeSet("stage1", "FAIL:both（迷你自检页 4s 双信号全无——引擎连 15 行内联脚本都不执行，设备 WebView 层问题）"); } catch (Exception ignored) {}
                try {
                    webView.evaluateJavascript("document.title", value -> {
                        try { bridge.storeSet("jsProbe", "迷你页 evaluate 回执：" + (value == null ? "null（无回执）" : value)); } catch (Exception ignored) {}
                    });
                } catch (Exception ignored) {}
                try { bridge.storeSet("bootFailLog", "stage1 FAIL：引擎对迷你自检页无反应"); } catch (Exception ignored) {}
                showDiagPage();
            }
        }, 2500);
    }

    /* 🧪 迷你自检页：15 行零依赖，内联脚本第一时间改标题（Java getTitle 可读）+页面可见「启动自检中」 */
    private String probeHtml() {
        return "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>probe-init</title></head>"
            + "<body style='background:rgb(11,14,20);color:rgb(229,233,240);font-family:monospace;padding:80px 24px;text-align:center'>"
            + "<div style='font-size:44px'>🐾</div><h2>小神启动自检中…</h2>"
            + "<p style='color:rgb(138,148,168);font-size:13px'>正在检测网页引擎（约 3 秒）</p>"
            + "<script>document.title='PROBE_JS_OK';window.__probeOK=1;<" + "/script>"
            + "</body></html>";
    }

    /* 🪜 v2.5.66-nullbase 84 轮：probe2 过渡页（stage1 通过→主应用装载之间的可视化垫片） */
    private String probe2Html() {
        return "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>probe2-launching</title></head>"
            + "<body style='background:rgb(11,14,20);color:rgb(229,233,240);font-family:monospace;padding:80px 24px;text-align:center'>"
            + "<div style='font-size:44px'>🚀</div><h2>自检通过，正在启动小神…</h2>"
            + "<p style='color:rgb(138,148,168);font-size:13px'>v" + appVer() + " · 若停在此页超 10 秒=主应用装载失败</p>"
            + "</body></html>";
    }

    /* 🏷️ 87 轮：动态版本号（PackageManager versionName）——84 轮曾把 probe2 版本文案写死致 84/85/86 判读失效，永不重蹈 */
    private String appVer() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return "?"; }
    }

    /* 🧪 无桥启动实验（dsh://boot-nobridge）：载 index.nobridge.html（转译器产出：head 后插 DSB/PHB 纯 JS 桩，零真桥依赖，
       数据走内存+console 通道）——头号嫌疑=JS→Java 同步桥调用在华为内核死锁（证据链：自检页零桥调用 JS 活；
       主应用首行 bLog→DSB.storeSet→Store synchronized+磁盘 fsync；evaluate 永无回执 NO_CALLBACK；切块后 title 仍不前进=第一块就挂）。
       活=桥死锁坐实（下轮启动期桥调用改 console/异步根治）；死=桥洗清，凶手在内容本身（切块 c 字段已可报死在第几块） */
    private void nobridgeTest() {
        try {
String b = readAsset("index.nobridge.html");
if (b == null) { try { bridge.storeSet("nobridge", "SKIP：index.nobridge.html 不存在（旧包）"); } catch (Exception ignored) {} showDiagPage(); return; }
b = injectSnapshot(b); // 📸 90 轮：fail3 路径同样快照预灌（与 loadWeb 一致，数据持久化同通道）
            if (baseHttp != null) { serveMain = utf8(httpify(b)); webView.loadUrl(baseHttp + "/index.html"); }
            else webView.loadDataWithBaseURL(null, b, "text/html", "UTF-8", null);
        } catch (Exception ignored) {}
        final Handler h = new Handler(Looper.getMainLooper());
        h.postDelayed(new Runnable() { @Override public void run() {
            webView.evaluateJavascript("(function(){try{return JSON.stringify({booted:window.__dsbBooted===1,chunks:(window.__chunkOK||[]).join(',')||'none',title:document.title.slice(0,32)})}catch(e){return 'ERR:'+e}})()", value -> {
                try { bridge.storeSet("nobridge", value == null ? "null（6s 无回执=evaluate 也挂死）" : value); } catch (Exception ignored) {}
                showDiagPage();
            });
        }}, 6000);
    }

    /* 🔬 主块替换二分测试（dsh://boot-probemain）：载 index.probe.html（转译器产出：主块→title 标记器，保黑匣子/polyfill/全 CSS）——
       引擎若能把它跑起来=凶手在主块内容里；连它也不行=凶手在外壳层（CSS/HTML/黑匣子/补丁层/crypto.js）。结果自动出结论页。 */
    private void probeMainTest() {
        try {
            String b = readAsset("index.probe.html");
            if (b == null) { try { bridge.storeSet("probeMain", "SKIP：index.probe.html 不存在（旧包）"); } catch (Exception ignored) {} showDiagPage(); return; }
            if (baseHttp != null) { // 🌐 85 轮：二分页与主应用同走真 HTTP（结论可比）
                serveProbePage = utf8(httpify(b));
                webView.loadUrl(baseHttp + "/index.probe.html");
            } else {
                webView.loadDataWithBaseURL(null, b, "text/html", "UTF-8", null); // 84 轮：loop 不可用时退回 null 基址
            }
        } catch (Exception ignored) {}
        final Handler h = new Handler(Looper.getMainLooper());
        final int[] round = {0};
        h.postDelayed(new Runnable() {
            @Override public void run() {
                String t = ""; try { t = webView.getTitle(); } catch (Exception ignored) {}
                if (t != null && t.contains("MAIN_REPLACED_OK")) {
                    try { bridge.storeSet("probeMain", "OK：标题已立=引擎能执行主块位置以外的全部代码（黑匣子/补丁层/全 CSS/全 HTML）→凶手锁定在主块内容内部"); } catch (Exception ignored) {}
                } else {
                    round[0]++;
                    if (round[0] == 1) { h.postDelayed(this, 2000); return; }
                    try { bridge.storeSet("probeMain", "FAIL：主块替换页标题也立不起来→凶手在外壳层（HTML/CSS/黑匣子/补丁块/crypto.js）"); } catch (Exception ignored) {}
                }
                showDiagPage();
            }
        }, 3000);
    }

    private String readAsset(String name) {
        try (java.io.InputStream is = getAssets().open(name)) {
            java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(is, "UTF-8"));
            StringBuilder sb = new StringBuilder(); char[] buf = new char[8192]; int n;
            while ((n = br.read(buf)) > 0) sb.append(buf, 0, n);
            return sb.toString();
        } catch (Exception e) { return null; }
    }

    /* 🧬 永久自主升级装载链（永砖保险三重门）：
       ① Java 门：热包存在且 60KB~500KB 且含 "DS Harness"+"BUNDLE_VER" 才装载，否则回内置版；
       ② JS 门：新包启动自检（updBootGuard）失败 → hotDelete 自动回滚内置版；
       ③ 闸门门：任何热包应用前必过语法/结构/基因/防降级四重闸门（updGauntlet）。 */
    private String readHotBundle() {
        try {
            File f = new File(new File(getFilesDir(), "webbundle"), "index.html");
            if (!f.exists() || f.length() < 60000 || f.length() > 500000) return null;
            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8))) {
                char[] buf = new char[8192];
                int n;
                while ((n = br.read(buf)) > 0) sb.append(buf, 0, n);
            }
            String b = sb.toString();
            if (!b.contains("DS Harness") || !b.contains("BUNDLE_VER")) return null;
            return b;
        } catch (Exception e) {
            return null;
        }
    }

    /* 🌐 v2.5.67-loopback 85 轮：http 域禁止 file:// 子资源——绝对路径 crypto.js 还原为相对路径（由 loopback 服务提供） */
    private String httpify(String html) {
        return html == null ? null : html.replace("src=\"file:///android_asset/crypto.js\"", "src=\"crypto.js\"");
    }

    private byte[] utf8(String s) { try { return s.getBytes("UTF-8"); } catch (Exception e) { return null; } }

/* 📸 v2.5.72-snapbridge 90 轮：快照预灌——store 全量 JSON 内联进 nobridge 页头（stub 之前），
   JS 桩同步读内存快照（同步读语义保留，零真桥依赖）；写走 console 回写（[dsb.set] 分块协议） */
/* 🫓 v2.5.74-heartbeat 92 轮：双通道保险——console 单向通道在真机是否送达存疑（任务重启丢失）。
   Java 每 4s evaluate 心跳收割 __dsbDirty（JS 活着时回调应通），收割成功→落盘+回写 __dsbSaved 驱动存档徽章；
   徽章恒“等待…”=console+心跳双死，一眼定位通道层问题。 */
/* 🫓 v2.5.75-seedfix 93 轮：心跳收割升级非破坏——落盘成功才带键名 ack（__dsbDrainOk），JS 侧严格比对后删键；
   回程丢包不再丢数据（下一拍自动重发）。92 版自愈式收割（JS 先清 dirty 再靠 Java 写回）→ 93 改为落盘确认制。 */
private final Handler hbHandler = new Handler(Looper.getMainLooper());
private int hbAcks = 0;
private final Runnable hbTick = new Runnable() { public void run() {
try {
if (webView != null) {
webView.evaluateJavascript("window.__dsbDrain?window.__dsbDrain():null", new android.webkit.ValueCallback<String>() {
public void onReceiveValue(String v) {
try {
if (v != null && v.length() > 2 && !v.equals("null")) {
String inner = new org.json.JSONObject("{\"v\":" + v + "}").getString("v"); // evaluate 返回值是 JSON 字符串字面量，双解
org.json.JSONObject map = new org.json.JSONObject(inner);
java.util.Iterator<String> it = map.keys();
org.json.JSONArray ackKeys = new org.json.JSONArray();
while (it.hasNext()) { String k = it.next(); bridge.storeSet(k, map.getString(k)); ackKeys.put(k); }
if (ackKeys.length() > 0) { hbAcks++; webView.evaluateJavascript("window.__dsbDrainOk?window.__dsbDrainOk(" + ackKeys.toString() + "):0", null); }
}
} catch (Exception ignored) {}
}
});
}
} catch (Exception ignored) {}
hbHandler.postDelayed(this, 4000);
}};

private String injectSnapshot(String html) {
try {
if (html == null || !html.contains("window.DSB={storeGet")) return html;
String snap = bridge.snapshotJson();
String ai = "{}"; try { ai = bridge.appInfo(); } catch (Exception ignored) {} // 📱 91 轮：appInfo 同步预灌（诊断页/关于页在 snapbridge 下同样可用）
String tag = "<script>window.__DSB_SNAPSHOT=" + snap + ";window.__DSB_APPINFO=" + ai + ";</" + "script>";
int i = html.indexOf("<head>");
if (i == -1) return html;
return html.substring(0, i + 6) + tag + html.substring(i + 6);
} catch (Exception e) { return html; }
}

/* 📸 90 轮：[dsb.set] 分块重组缓冲（仅 onConsoleMessage 主线程触碰，无需同步） */
private final java.util.HashMap<String, StringBuilder> setRx = new java.util.HashMap<>();

/* 🔧 v2.5.77-rpcfull 95 轮：通用 RPC 分发器——把废弃同步桥上的全部器官重新接回。
   [dsb.call]method#seq/i/n\targsJson → 后台真调 Bridge/PhoneBridge/LlamaCore → evaluate __dsbRpcOk(seqKey, resultJson)。
   桩侧三态：占位降级→回填→轮询点二次命中（页面零改动）。分发全走白名单 switch，反射零、注入零。 */
private final java.util.HashMap<String, StringBuilder> callRx = new java.util.HashMap<>();
private int rpcCalls = 0; // 诊断计数：本会话 RPC 调用次数

private void dispatchRpc(final String method, final String seqKey, final String argsJson) {
NET_POOL.execute(new Runnable() { public void run() {
String result;
try {
org.json.JSONArray a = new org.json.JSONArray(argsJson);
String a0 = a.length() > 0 ? a.optString(0, "") : "", a1 = a.length() > 1 ? a.optString(1, "") : "", a2 = a.length() > 2 ? a.optString(2, "") : "", a3 = a.length() > 3 ? a.optString(3, "") : "";
if (method.equals("readAsset")) result = bridge.readAsset(a0);
else if (method.equals("http")) result = bridge.http(a0, a1, a2, a3);
else if (method.equals("llamaStatus")) result = bridge.llamaStatus();
else if (method.equals("llamaDownload")) result = bridge.llamaDownload();
else if (method.equals("llamaDelete")) result = bridge.llamaDelete();
else if (method.equals("llamaStream")) result = bridge.llamaStream(a0, a1);
else if (method.equals("notifPerm")) result = bridge.notifPerm();
else if (method.equals("notifyUserEx")) result = bridge.notifyUserEx(a0, a1); // 🔔 v2.5.94-permfix 109 轮：带回执通知（PERM/ERR: 原因/OK 如实回 JS）
else if (method.equals("notifState")) result = bridge.notifState(); // 🔔 全态探针（权限+渠道+sdk）
else if (method.equals("openNotifSettings")) { bridge.openNotifSettings(); result = "1"; } // 🔔 一键拉起系统通知授权页
else if (method.equals("canExactAlarm")) result = bridge.canExactAlarm() ? "1" : "0"; // ⚠️ Bridge 返回 boolean，桩契约要字符串
else if (method.equals("micPerm")) result = bridge.micPerm();
else if (method.equals("micRecStart")) result = bridge.micRecStart();
else if (method.equals("micRecStop")) result = bridge.micRecStop();
else if (method.equals("micAsr")) result = bridge.micAsr(a0, a1, a2);
else if (method.equals("micAsrChat")) result = bridge.micAsrChat(a0, a1);
else if (method.equals("micAsrFile")) result = bridge.micAsrFile(a0, a1, a2, a3);
else if (method.equals("pickFile")) result = bridge.pickFile();
else if (method.equals("pickGallery")) result = bridge.pickGallery();
else if (method.equals("pickCamera")) result = bridge.pickCamera();
else if (method.equals("pickVideoFrames")) result = bridge.pickVideoFrames(a0, a.optInt(1, 6));
else if (method.equals("pickVideoAudio")) result = bridge.pickVideoAudio(a0);
else if (method.equals("pickReadText")) result = bridge.pickReadText(a0);
else if (method.equals("pickDelete")) result = bridge.pickDelete(a0);
else if (method.equals("hotInfo")) result = bridge.hotInfo();
else if (method.equals("hotRead")) result = bridge.hotRead();
else if (method.equals("hotWrite")) result = bridge.hotWrite(a0);
else { result = "{\"ok\":0,\"err\":\"rpc-unknown:" + method + "\"}"; }
} catch (Exception e) {
result = "{\"ok\":0,\"err\":\"rpc-err:" + e.getClass().getSimpleName() + "\"}";
}
final String fr = result;
final String fm = method;
try { webView.post(new Runnable() { public void run() {
try { webView.evaluateJavascript("window.__dsbRpcOk&&window.__dsbRpcOk(" + org.json.JSONObject.quote(seqKey) + "," + org.json.JSONObject.quote(String.valueOf(fr)) + ")", null); } catch (Exception ignored) {}
}}); } catch (Exception ignored) {}
}});
}

private void dispatchPhb(final String method, final String seqKey, final String argsJson) { // 📱 95 轮：PHB 手机操控 11 工具 RPC 分发（PhoneBridge 全部在位，白名单直调）
NET_POOL.execute(new Runnable() { public void run() {
String result;
try {
org.json.JSONArray a = new org.json.JSONArray(argsJson);
String a0 = a.length() > 0 ? a.optString(0, "") : "";
String a1 = a.length() > 1 ? a.optString(1, "") : "";
boolean ab = a.length() > 2 && a.optBoolean(2, false);
int ai = a.length() > 1 ? a.optInt(1, 20000) : 20000;
if (method.equals("phb_fsGranted")) result = "{\"ok\":" + (phoneBridge.fsGranted() ? 1 : 0) + "}";
else if (method.equals("phb_fsRoots")) result = phoneBridge.fsRoots();
else if (method.equals("phb_fsList")) result = phoneBridge.fsList(a0);
else if (method.equals("phb_fsRead")) result = phoneBridge.fsRead(a0, ai);
else if (method.equals("phb_fsWrite")) result = phoneBridge.fsWrite(a0, a1, ab);
else if (method.equals("phb_fsMkdir")) result = phoneBridge.fsMkdir(a0);
else if (method.equals("phb_fsDelete")) result = phoneBridge.fsDelete(a0);
else if (method.equals("phb_fsRename")) result = phoneBridge.fsRename(a0, a1);
else if (method.equals("phb_fsSearch")) result = phoneBridge.fsSearch(a0, a1);
else if (method.equals("phb_appList")) result = phoneBridge.appList();
else if (method.equals("phb_appLaunch")) result = phoneBridge.appLaunch(a0);
else if (method.equals("phb_devInfo")) result = phoneBridge.devInfo();
else { result = "{\"ok\":0,\"err\":\"phb-unknown:" + method + "\"}"; }
} catch (Exception e) {
result = "{\"ok\":0,\"err\":\"phb-err:" + e.getClass().getSimpleName() + "\"}";
}
final String fr = result;
final String fsk = seqKey;
try { webView.post(new Runnable() { public void run() {
try { webView.evaluateJavascript("window.__dsbRpcOk&&window.__dsbRpcOk(" + org.json.JSONObject.quote(fsk) + "," + org.json.JSONObject.quote(String.valueOf(fr)) + ")", null); } catch (Exception ignored) {}
}}); } catch (Exception ignored) {}
}});
}

/* 🛰️ v2.5.76-asyncnet 94 轮：异步流式网通道——92 轮心跳已证 evaluate 回调真机可用，
   本通道把同步桥 httpStream 的网络能力还回来：请求经 [dsb.http] console 分块送达 Java，
   后台线程真请求 SSE，行批量 evaluate 回调 window.__onStreamChunk(id,line,done,status)（页面零改动）。 */
private final java.util.HashMap<String, StringBuilder> httpRx = new java.util.HashMap<>();
private final java.util.concurrent.ExecutorService NET_POOL = java.util.concurrent.Executors.newCachedThreadPool();
private int netStreams = 0; // 诊断计数：本会话发起的流式网请求次数

private void startHttpStream(final String id, final String req) {
NET_POOL.execute(new Runnable() { public void run() {
int status = 0;
try {
int t1 = req.indexOf('\t');
if (t1 < 0) throw new RuntimeException("bad-req");
String url = req.substring(0, t1);
int t2 = req.indexOf('\t', t1 + 1);
if (t2 < 0) throw new RuntimeException("bad-req");
String hdrJson = req.substring(t1 + 1, t2);
String body = req.substring(t2 + 1);
java.net.HttpURLConnection c = (java.net.HttpURLConnection) new java.net.URL(url).openConnection();
c.setRequestMethod("POST");
c.setConnectTimeout(20000);
c.setReadTimeout(120000);
try { org.json.JSONObject hh = new org.json.JSONObject(hdrJson); java.util.Iterator<String> hi = hh.keys(); while (hi.hasNext()) { String hk = hi.next(); c.setRequestProperty(hk, hh.optString(hk)); } } catch (Exception ignored) {}
c.setDoOutput(true);
c.getOutputStream().write(body.getBytes("UTF-8"));
try { status = c.getResponseCode(); } catch (Exception e2) { status = 0; }
java.io.InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(in, "UTF-8"));
final java.util.List<String> buf = new java.util.ArrayList<String>();
long lastFlush = System.currentTimeMillis();
while (true) {
String line = br.readLine();
if (line == null) break;
if (line.length() == 0) continue;
buf.add(line);
if (buf.size() >= 12 || System.currentTimeMillis() - lastFlush > 200) { flushHttpChunks(id, buf); lastFlush = System.currentTimeMillis(); }
}
flushHttpChunks(id, buf);
} catch (Exception ignored) {}
final int st = status;
webView.post(new Runnable() { public void run() {
try { webView.evaluateJavascript("window.__onStreamChunk&&window.__onStreamChunk('" + id + "','',1," + st + ")", null); } catch (Exception ignored) {}
}});
}});
}

private void flushHttpChunks(final String id, final java.util.List<String> buf) {
if (buf.isEmpty()) return;
final java.util.List<String> copy = new java.util.ArrayList<String>(buf);
buf.clear();
webView.post(new Runnable() { public void run() {
try {
StringBuilder js = new StringBuilder();
for (String ln : copy) js.append("window.__onStreamChunk&&window.__onStreamChunk('").append(id).append("',").append(org.json.JSONObject.quote(ln)).append(",0,0);");
webView.evaluateJavascript(js.toString(), null);
} catch (Exception ignored) {}
}});
}

private void loadWeb() {
// 📸 v2.5.72-snapbridge 90 轮：89 版真机终审——桥已轻到只剩一次内存 put 仍挂死=华为内核
//    @JavascriptInterface 同步 IPC 本身死锁（与磁盘/锁无关）。正式桥改走 88 轮已被真机证实的
//    console 通道：快照预灌（存档全量 JSON 内联页头，JS 桩同步读，同步语义保留）+
//    [dsb.set] console 回写落盘（分块重组）。热包（真桥依赖）本轮继续让位；fail3 保留兑底。
String b = readAsset("index.nobridge.html");
if (b != null) b = injectSnapshot(b);
if (b == null) b = readHotBundle();
if (b == null) b = readAsset("index.html");
        if (b != null) {
            if (baseHttp != null) { // 🌐 85 轮：真 HTTP 装载（真 URL 流式，无 data-URL 限制；JS 活性与否由看门狗如实判定）
                serveMain = utf8(httpify(b));
                webView.loadUrl(baseHttp + "/index.html");
            } else {
                webView.loadDataWithBaseURL(null, b, "text/html", "UTF-8", null); // 🌉 84 轮：loop 不可用时退回 null 基址桥载
            }
        } else {
            webView.loadUrl("file:///android_asset/index.html"); // 兕底（资产读取失败时才走，此时无路可退）
        }
        armBootWatchdog(); // 🔒 第四重永砖保险：每次装载（冷启/热更重载）都武装看门狗
    }

    /* 📎 v2.5.0 附件回传：拍照(7001 FileProvider 直写核验)/相册(7002)/文件(7003)——
       结果流式拷贝已在 Bridge 完成，此处统一回调 JS window.__onPick(json)；取消/失败也回调（err:"cancel"）。 */
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        String json;
        if (requestCode == 7001) {
            String name = bridge.takePendingCameraName();
            File f = name == null ? null : new File(new File(getFilesDir(), "picks"), name);
            if (resultCode == RESULT_OK && f != null && f.exists() && f.length() > 0) {
                json = bridge.pickJsonFromFile(f, "image/jpeg");
            } else {
                try { if (f != null) f.delete(); } catch (Exception ignored) {}
                json = "{\"ok\":0,\"err\":\"cancel\"}";
            }
        } else if (requestCode == 7002 || requestCode == 7003) {
            if (resultCode != RESULT_OK || data == null || data.getData() == null) {
                json = "{\"ok\":0,\"err\":\"cancel\"}";
            } else {
                json = bridge.copyPick(data.getData());
            }
        } else {
            return;
        }
        final String out = json;
        runOnUiThread(() -> {
            try {
                webView.evaluateJavascript("window.__onPick&&window.__onPick(" + out + ")", null);
            } catch (Exception ignored) {}
        });
    }

    /* 🔒 第四重永砖保险·Java 看门狗：热包可能语法过闸却在运行时崩溃（如 initAll 中途抛错），
       此时 JS 启动自检门（updBootGuard 在 script 末尾）永远执行不到。Java 层装载 6s 后验
       window.__dsbBooted 旗标（JS 在 renderRoute 成功后、一切网络调用前立起），缺失则
       hotDelete 回滚 APK 内置版并重装载；连续 3 次不活即停手（防内置版自身故障时死循环）。 */
    private void armBootWatchdog() {
        probeAck = false;
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
        try {
            // 🏷️ 88 轮：标题探针（纯 Java getTitle，JS 线程挂死也能读）——切块产物每块存活会推 __chunkOK，
            //    收官块立 title=CHUNKS_ALL_OK；6s/12s 两次落盘 bootTitle，一张截图可报切块执行进度
            try { bridge.storeSet("bootTitle", "6s:" + String.valueOf(webView.getTitle())); } catch (Exception ignored) {}
            // 🔬 v2.5.63-probe 81 轮：探针升级——不只问 booted，还带回执化 JSON 体检单（bLog/DSB 是否存在）落盘 jsProbe；回执未到（12.5s Java 侧判定）=JS 线程挂死或引擎未执行，直接出诊断页
            webView.evaluateJavascript("(function(){try{return window.__dsbBooted===1?'BOOTED':JSON.stringify({b:typeof window.bLog,d:typeof window.DSB,e:window.__dsbBooted===undefined?'undef':window.__dsbBooted,c:(window.__chunkOK||[]).join(',')||'none'})}catch(e){return 'PROBE_ERR:'+e}})()", value -> {
                probeAck = true;
                try { bridge.storeSet("jsProbe", value == null ? "null（引擎无回执内容）" : value); } catch (Exception ignored) {}
                if (value != null && value.contains("BOOTED")) { bootFails = 0; return; }
                    bootFails++;
                    try { // 📷 v2.5.61-flash 79 轮：黑匣子留档——JS 侧 bLog 启动轨迹原样入档（bootLog 空=JS 完全未执行，语法层死亡；有轨迹=死在哪一步一目了然），日志页/诊断页可回看
                        String bl = bridge.storeGet("bootLog");
                        bridge.storeSet("bootFailLog", (bl == null || bl.isEmpty() ? "JS_NOT_RUN（空=JS 完全未执行，语法层死亡）" : bl));
                    } catch (Exception ignored) {}
                    if (bootFails > 2) { // 🧪 87 轮：3 次不活自动无桥实验（桥死锁验证——用户零操作）
                        nobridgeTest();
                        return;
                    }
                    if (bootFails > 1) { // 🚑 83 轮：2 次不活不直接诊断——先自动跑主块替换二分（probeMainTest 尾部会带结论进诊断页），用户零操作拿到凶手定位
                        probeMainTest();
                        return;
                    }
                    try { bridge.hotDelete(); } catch (Exception ignored) {}
                    try { bridge.storeSet("watchdogRevert", "{\"f\":" + bootFails + "}"); } catch (Exception ignored) {}
                    reload();
                });
            } catch (Exception ignored) {}
        }, 6000);
        // 🔬 81 轮·第二计时器（纯 Java 侧，不依赖 JS 线程）：6s 探针回执未到 = evaluateJavascript 永无回调 = JS 线程被同步调用挂死或引擎根本没执行任何脚本——此时 reload 毫无意义（挂死的线程重载还会挂死），直接出诊断页；这是 v80「静态壳+诊断页永不出现」之谜的唯一自洽解释，此计时器把它变成看得见的证据
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (probeAck) return;
            try {
                try { bridge.storeSet("bootTitle", String.valueOf(bridge.storeGet("bootTitle")) + " →12.5s:" + String.valueOf(webView.getTitle())); } catch (Exception ignored) {} // 🏷️ 88 轮：12.5s 二次标题探针（切块进度双采样）
                String note = "NO_CALLBACK（6s 探针 evaluateJavascript 无回执——JS 线程被同步桥调用挂死，或内核未执行任何脚本）";
                try { bridge.storeSet("jsProbe", note); } catch (Exception ignored) {}
                String bl = bridge.storeGet("bootLog");
                bridge.storeSet("bootFailLog", (bl == null || bl.isEmpty() ? note : bl + "\n" + note));
            } catch (Exception ignored) {}
            showDiagPage();
        }, 12500);
    }

    /* 🚑 零 JS 诊断页（81 轮扩容版）：五段全Payload——jsProbe（引擎体检单/无回执判定）+consoleLog（引擎自己的报错通道）+bootLog（黑匣子轨迹）+bootFailLog+内核 UA。
       全 rgb() 色值+loadDataWithBaseURL（80 轮坐实的 # 截断双保险），纯 HTML 零脚本永远能显示，一张截图携带全部诊断。 */
    private void showDiagPage() {
        try {
            String jp = bridge.storeGet("jsProbe");
            String cl = bridge.storeGet("consoleLog");
            String bl = bridge.storeGet("bootLog");
            String bfl = bridge.storeGet("bootFailLog");
            String s1 = bridge.storeGet("stage1");
            String pm = bridge.storeGet("probeMain");
            String probe = (jp == null || jp.isEmpty() ? "（无）" : jp.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"));
            String con = (cl == null || cl.isEmpty() ? "（空——引擎连一条报错都没吐过）" : cl.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"));
            String trace = (bl == null || bl.isEmpty() ? "（空）——JS 完全未执行：语法层死亡或脚本块未装载" : bl.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"));
            String fl = (bfl == null || bfl.isEmpty() ? "—" : bfl.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"));
            String st1 = (s1 == null || s1.isEmpty() || "{}".equals(s1) ? "（未跑）" : s1.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"));
            String pmv = (pm == null || pm.isEmpty() || "{}".equals(pm) ? "（未跑）" : pm.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"));
            String nbr = bridge.storeGet("nobridge");
            String nb = (nbr == null || nbr.isEmpty() || "{}".equals(nbr) ? "（未跑）" : nbr.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"));
            String ua = ""; try { ua = webView.getSettings().getUserAgentString(); } catch (Exception ignored) {}
            String diag = "<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head><body style='background:rgb(11,14,20);color:rgb(229,233,240);font-family:monospace;padding:36px 22px'>"
                + "<div style='font-size:40px;text-align:center'>🐾</div>"
                + "<h2 style='text-align:center'>小神启动失败（已记录诊断）</h2>"
                + "<p style='font-size:13px;line-height:1.8'>请截图此页反馈给开发者（本页自带全部诊断信息）。版本：v" + appVer() + "</p>"
                + "<p style='font-size:10px;line-height:1.5;color:rgb(138,148,168)'>内核：" + (ua == null ? "?" : ua.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")) + "</p>"
                + "<p style='font-size:13px'>⓿ 回环 HTTP 通道：" + (baseHttp == null ? "未启用（退回桥载）" : baseHttp.replace("&", "&amp;")) + "；🫓 心跳收割：" + hbAcks + " 次（0=evaluate 回调也不通）；🛰️ 流式网请求：" + netStreams + " 次（0=聊天网络未发起）</p>"
                + "<p style='font-size:13px'>① 迷你自检（引擎活性）：</p>"
                + "<pre style='background:rgb(20,25,38);border:1px solid rgb(42,49,66);border-radius:10px;padding:12px;font-size:11px;white-space:pre-wrap;word-break:break-all'>" + st1 + "</pre>"
                + "<p style='font-size:13px'>② 主块替换二分（凶手定位）：</p>"
                + "<pre style='background:rgb(20,25,38);border:1px solid rgb(42,49,66);border-radius:10px;padding:12px;font-size:11px;white-space:pre-wrap;word-break:break-all'>" + pmv + "</pre>"
                + "<p style='font-size:13px'>③ 探针回执+标题进度（title 纯 Java 信号，JS 挂死也能读切块进度）：</p>"
                + "<pre style='background:rgb(20,25,38);border:1px solid rgb(42,49,66);border-radius:10px;padding:12px;font-size:11px;white-space:pre-wrap;word-break:break-all'>" + (String.valueOf(bridge.storeGet("bootTitle"))).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") + "\n" + probe + "</pre>"
                + "<p style='font-size:13px'>④ 引擎报错（console）：</p>"
                + "<pre style='background:rgb(20,25,38);border:1px solid rgb(42,49,66);border-radius:10px;padding:12px;font-size:11px;white-space:pre-wrap;word-break:break-all'>" + con + "</pre>"
                + "<p style='font-size:13px'>⑤ 启动轨迹（黑匣子）：</p>"
                + "<pre style='background:rgb(20,25,38);border:1px solid rgb(42,49,66);border-radius:10px;padding:12px;font-size:11px;white-space:pre-wrap;word-break:break-all'>" + trace + "</pre>"
                + "<p style='font-size:13px'>⑥ 最近错误留档：</p>"
                + "<pre style='background:rgb(20,25,38);border:1px solid rgb(42,49,66);border-radius:10px;padding:12px;font-size:11px;white-space:pre-wrap;word-break:break-all'>" + fl + "</pre>"
                + "<p style='font-size:12px;line-height:1.7;color:rgb(251,191,36)'>💡 荣耀/华为手机建议：设置→应用→显示系统进程→找到「WebView」或「华为WebView」→卸载更新后再重试；或重启手机后重试。</p>"
                + "<p style='text-align:center;margin-top:26px'><a href='dsh://boot-retry' style='color:rgb(34,197,94);font-size:16px'>🔄 重试启动</a> ｜ <a href='dsh://boot-wipe' style='color:rgb(248,113,113);font-size:16px'>🚑 清数据重启</a></p>"
                + "<p style='font-size:13px'>⑦ 无桥实验（桥死锁验证）：</p>"
            + "<pre style='background:rgb(20,25,38);border:1px solid rgb(42,49,66);border-radius:10px;padding:12px;font-size:11px;white-space:pre-wrap;word-break:break-all'>" + nb + "</pre>"
                + "<p style='text-align:center;margin-top:14px'><a href='dsh://boot-probemain' style='color:rgb(96,165,250);font-size:14px'>🔬 主块替换二分测试</a> ｜ <a href='dsh://boot-nobridge' style='color:rgb(250,204,21);font-size:14px'>🧪 无桥启动实验</a></p></body></html>";
            webView.loadDataWithBaseURL(null, diag, "text/html; charset=utf-8", "utf-8", null); // 🩹 80 轮：loadDataWithBaseURL 无 # 截断问题
        } catch (Exception ignored) {}
    }

    public void reload() { // 🧬 热更/回滚后的重装载入口（任意线程可调）
        runOnUiThread(this::loadWeb);
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            NotificationChannel ch = new NotificationChannel(CHANNEL_TASKS, "DS Harness 任务通知",
                    NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("定时任务执行结果与云端任务状态");
            nm.createNotificationChannel(ch);
        }
    }

    public void requestNotifPermission() {
        if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        // JS 侧下次发通知前会再查状态，这里无需回传
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // singleTask 重入时刷新（例如从通知点击回来）
        if (webView != null) {
            webView.evaluateJavascript("window.__onResume && window.__onResume()", null);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.evaluateJavascript("window.__onResume && window.__onResume()", null);
        }
    }

    @Override
    @SuppressWarnings("deprecation") // Android 13+ 预测性返回已替代旧返回链，但 minSdk 24 老设备仍依赖此回调（双路兼容）
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript("window.__handleBack && window.__handleBack()", null);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (bridge != null) bridge.shutdown();
        // 🛡️ v2.5.56-vitals 65 轮：static WebView 引用清理——旧版 static 强引用钉死已 destroy 的 Activity Context（泄漏整窗）且僵尸页 JS 定时器继续跑网络请求；销毁前先置 static 引用空，防 AlarmReceiver.refreshUi 再踩死 WebView
        MainActivity.webView = null;
        if (webView != null) {
            try { webView.destroy(); } catch (Exception ignored) { }
        }
        super.onDestroy();
    }
}
