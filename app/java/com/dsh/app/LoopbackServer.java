package com.dsh.app;

/* 🌐 v2.5.67-loopback 85 轮：本地回环 HTTP 服务器（纯 Java ServerSocket，零依赖零第三方）
   84 轮真机实弹（荣耀 play5）：399KB 大页 loadDataWithBaseURL(null) 首次渲染接管但 JS 死、
   复载把渲染管线挂死（卡 probe2、看门狗诊断页也出不来）→ 华为内核对 data-URL 型装载有致命缺陷。
   对策：真 HTTP——http://127.0.0.1 流式加载，无 data-URL 大小/管线限制、无 file 域 JS 限制；
   WebView 本就是为 HTTP 而生，这是最接近"正常网页"的装载方式。 */
public class LoopbackServer {

    /* 资源供给接口：MainActivity 提供 /index.html（热包优先）、/index.probe.html、/crypto.js */
    public interface AssetProvider {
        byte[] get(String path);
        String contentType(String path);
    }

    private java.net.ServerSocket ss;
    public volatile int port = 0;
    private final AssetProvider provider;
    private final java.util.concurrent.ExecutorService pool = new java.util.concurrent.ThreadPoolExecutor(
        4, 16, 30L, java.util.concurrent.TimeUnit.SECONDS,
        new java.util.concurrent.LinkedBlockingQueue<java.lang.Runnable>());

    public LoopbackServer(AssetProvider p) { provider = p; }

    /* 启动：从 18477 起逐个试端口（冲突自愈）；成功返回 true 并填 port */
    public boolean start() {
        for (int attempt = 0; attempt < 20; attempt++) {
            int candidate = 18477 + attempt;
            try {
                java.net.ServerSocket sock = new java.net.ServerSocket();
                sock.setReuseAddress(true);
                sock.bind(new java.net.InetSocketAddress("127.0.0.1", candidate));
                ss = sock;
                port = candidate;
                break;
            } catch (Exception e) { /* 端口被占，试下一个 */ }
        }
        if (ss == null) return false;
        final java.net.ServerSocket server = ss;
        Thread boss = new Thread(new Runnable() { @Override public void run() {
            while (!server.isClosed()) {
                try {
                    final java.net.Socket conn = server.accept(); // 局部 effectively final，可直接被内部类捕获
                    pool.execute(new Runnable() { @Override public void run() { handle(conn); } });
                }
                catch (Exception e) { if (server.isClosed()) return; }
            }
        }});
        boss.setDaemon(true);
        boss.setName("dsh-loopback-boss");
        boss.start();
        return true;
    }

    private void handle(java.net.Socket c) {
        try {
            c.setSoTimeout(5000);
            java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(c.getInputStream(), "UTF-8"));
            String line = br.readLine();
            if (line == null || !line.startsWith("GET ")) { try { c.close(); } catch (Exception ignored) {} return; }
            String path = line.split(" ")[1];
            int q = path.indexOf('?');
            if (q >= 0) path = path.substring(0, q);
            String ln;
            while ((ln = br.readLine()) != null && ln.length() > 0) { /* 吃掉请求头 */ }
            byte[] body = null;
            String ct = "text/html; charset=utf-8";
            try {
                if (provider != null) { body = provider.get(path); if (body != null) ct = provider.contentType(path); }
            } catch (Exception ignored) {}
            java.io.OutputStream os = c.getOutputStream();
            if (body == null) {
                os.write("HTTP/1.0 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".getBytes("UTF-8"));
            } else {
                os.write(("HTTP/1.0 200 OK\r\nContent-Type: " + ct + "\r\nContent-Length: " + body.length + "\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
                os.write(body);
            }
            os.flush();
            try { c.close(); } catch (Exception ignored) {}
        } catch (Exception ignored) {
            try { c.close(); } catch (Exception e2) {}
        }
    }

    public void stop() { try { if (ss != null) ss.close(); } catch (Exception ignored) {} }
}
