package com.dsh.app;

// DS Harness 端侧离线推理核心（llama.cpp JNI 封装 + 魔搭国内 CDN 免登录下载管理）
// 设计铁律：
//  ① LIB 静态探测——非 arm64 设备/旧 APK 无 .so 时 LIB=false，全链路优雅降级（绝不崩）
//  ② generate 全程互斥（与 JNI 层锁双保险）——生成中再次调用返回 ERR:busy
//  ③ 模型文件原子落盘（.part → rename），下载进度 volatile 全局可读
//  ④ 零账号零 Key：模型来源为魔搭公开 LFS（免登录、国内 CDN 直连）
public class LlamaCore {
    public static final boolean LIB;
    static { boolean ok = false; try { System.loadLibrary("dshllama"); ok = true; } catch (Throwable t) { } LIB = ok; }

    public interface TokenSink { void sink(byte[] piece); }

    public static native String nativeLoad(String path, int nCtx, int nThreads);
    public static native boolean nativeReady();
    public static native void nativeUnload();
    public static native int nativeComplete(String prompt, int nMax, TokenSink sink);

    // ---- 模型资产（国内 CDN 免登录，实测 HTTP 200 直下） ----
    public static final String MODEL_NAME = "Qwen2.5-0.5B-Instruct (Q4)";
    public static final String MODEL_URL  = "https://modelscope.cn/models/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/master/qwen2.5-0.5b-instruct-q4_k_m.gguf";
    public static final long   MODEL_SIZE = 491400032L;
    public static final int    N_CTX      = 1536;

    public static volatile boolean downloading = false;
    public static volatile long    dlDone      = 0;
    public static volatile long    dlTotal     = MODEL_SIZE;
    public static volatile String  dlErr       = null;

    private static final Object GEN = new Object();
    private static volatile boolean generating = false;
    private static volatile String  loadedPath = null;

    public static java.io.File modelFile(android.content.Context ctx) {
        return new java.io.File(new java.io.File(ctx.getFilesDir(), "llama"), "model.gguf");
    }

    public static boolean fileReady(android.content.Context ctx) {
        java.io.File f = modelFile(ctx);
        return f.isFile() && f.length() > MODEL_SIZE / 2; // 半数以下视为损坏残片
    }

    // 同步生成（Bridge.llamaStream 与 AlarmReceiver.runChat 共用）。返回 ERR: 开头即失败，否则为全文。
    public static String generate(java.io.File mf, String chatmlPrompt, int nMax, TokenSink sink) {
        if (!LIB) return "ERR:nolib";
        synchronized (GEN) {
            if (generating) return "ERR:busy";
            generating = true;
            try {
                if (!nativeReady() || !mf.getAbsolutePath().equals(loadedPath)) {
                    nativeUnload();
                    String err = nativeLoad(mf.getAbsolutePath(), N_CTX,
                            Math.min(6, Math.max(2, Runtime.getRuntime().availableProcessors() - 2)));
                    if (err != null && !err.isEmpty()) return "ERR:load:" + err;
                    loadedPath = mf.getAbsolutePath();
                }
                final StringBuilder sb = new StringBuilder();
                int r = nativeComplete(chatmlPrompt, nMax, piece -> {
                    sb.append(new String(piece, java.nio.charset.StandardCharsets.UTF_8));
                    if (sink != null) sink.sink(piece);
                });
                if (r == -2) return "ERR:overflow";
                if (r < 0)  return "ERR:gen:" + r;
                return sb.toString();
            } catch (Throwable t) {
                return "ERR:" + t.getMessage();
            } finally {
                generating = false;
            }
        }
    }

    public static void unload() {
        synchronized (GEN) {
            try { nativeUnload(); } catch (Throwable t) { }
            loadedPath = null;
        }
    }

    // ---- 下载管理（Bridge.llamaDownload 委托）：原子落盘 .part → rename ----
    public static String startDownload(android.content.Context ctx) {
        if (downloading) return "{\"ok\":1,\"detail\":\"已在下载中\"}";
        if (!LIB) return "{\"ok\":0,\"err\":\"设备不支持端侧推理（缺原生库）\"}";
        final java.io.File mf = modelFile(ctx);
        if (fileReady(ctx)) return "{\"ok\":1,\"detail\":\"模型已就绪\"}";
        final java.io.File parent = mf.getParentFile();
        if (parent != null && !parent.exists()) parent.mkdirs();
        downloading = true; dlDone = 0; dlErr = null; dlTotal = MODEL_SIZE;
        new Thread(() -> {
            java.io.File part = new java.io.File(parent, "model.gguf.part");
            java.io.InputStream in = null;
            java.io.OutputStream os = null;
            try {
                android.net.Uri.Builder b = android.net.Uri.parse(MODEL_URL).buildUpon();
                java.net.HttpURLConnection c = (java.net.HttpURLConnection)
                        new java.net.URL(b.build().toString()).openConnection();
                c.setConnectTimeout(20000);
                c.setReadTimeout(60000);
                c.setInstanceFollowRedirects(true);
                int code = c.getResponseCode();
                if (code >= 300 && code < 400) { // 手动跟一跳（魔搭 resolve → cdn-lfs-cn）
                    String loc = c.getHeaderField("Location");
                    c = (java.net.HttpURLConnection) new java.net.URL(loc).openConnection();
                    c.setConnectTimeout(20000); c.setReadTimeout(60000);
                    code = c.getResponseCode();
                }
                if (code != 200) throw new IllegalStateException("HTTP " + code);
                long total = c.getContentLengthLong();
                if (total > 1024) dlTotal = total;
                in = c.getInputStream();
                os = new java.io.FileOutputStream(part);
                byte[] buf = new byte[1 << 16];
                long done = 0; int n;
                while ((n = in.read(buf)) > 0) {
                    os.write(buf, 0, n);
                    done += n;
                    dlDone = done;
                }
                os.flush();
                // 完整度精确校验：已知总长必须足额（魔搭文件声明 491,400,032 字节），不足即失败删除——拒绝半截模型入库
                if (dlTotal > 0 && done < dlTotal) throw new IllegalStateException("下载不完整（" + done + "/" + dlTotal + "）");
                if (!part.renameTo(mf)) {
                    // 跨卷兜底：复制 + 删源
                    java.io.FileInputStream fis = new java.io.FileInputStream(part);
                    java.io.FileOutputStream fos = new java.io.FileOutputStream(mf);
                    byte[] b2 = new byte[1 << 16]; int m;
                    while ((m = fis.read(b2)) > 0) fos.write(b2, 0, m);
                    fos.flush(); fis.close(); fos.close();
                    part.delete();
                }
            } catch (Throwable t) {
                dlErr = String.valueOf(t.getMessage());
                if (part.exists()) part.delete();
            } finally {
                try { if (in != null) in.close(); } catch (Exception e) { }
                try { if (os != null) os.close(); } catch (Exception e) { }
                downloading = false;
            }
        }, "dsh-llama-dl").start();
        return "{\"ok\":1}";
    }

    public static String deleteModel(android.content.Context ctx) {
        try { unload(); } catch (Throwable t) { }
        java.io.File f = modelFile(ctx);
        boolean ok = !f.exists() || f.delete();
        java.io.File part = new java.io.File(f.getParentFile(), "model.gguf.part");
        if (part.exists()) part.delete();
        return "{\"ok\":" + (ok ? 1 : 0) + "}";
    }
}
