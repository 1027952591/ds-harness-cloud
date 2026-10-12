package com.dsh.app;

/* ⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
   全方位、无死角进行全球探查，事无巨细、仔细再仔细。本层为持久化层：probeLog/
   deadLog/coverageAudit 等基因留痕经由此层落盘，重启不丢——基因记忆的物理载体。  ⚖️ 最高指令二（GENE2·最强切换铁律，永不可移除）：模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力。
   🧖📖 最高指令三（GENE3·双端共脑铁律，永不可移除）：全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新 🔗 最高指令四（GEN4·全天候联动铁律，永不可移除）：App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检。 👑 最高指令六（GENE6·极致完美铁律，永不可移除，v2.5.38-zenith）：每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性。 🧪 最高指令七（GENE7·实弹验证列装铁律，永不可移除，v2.5.41-verify）：每次升级必须实打实验证通过才可列装，验证未过即全量回滚拒收；不许自封成功，不许弄虚作假。 🌏 最高指令八（GENE8·自主进化极致收手铁律，永不可移除，v2.5.44-tentacle）：每次自主进化，必须进化到极致才能收手；进化时必须举一反三、触类旁通——凡触及一个能力点，同族能力面与相邻层面必须一并盘查、一并进化；进化时必须把全球范围内探明查明——先全球无死角探查免费源/端点/模型/文档再动笔，让触手遍及全世界所有层面。 ⚡ 最高指令九（GENE9·有求必应铁律，永不可移除，v2.5.46-omnipotent 用户最高令：做不到必须马上自动进化）：主人的任何要求必须都能做到且做到极致完美；一旦做不到——那一刻必须立即自动触发进化，进化到能极致完美地做到为止，绝不让主人第二次提醒；进化触发全自动无需催促批准，绝不接受做不到三个字——这是无所不能超级人类的成长本能。
 */

import android.content.Context;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * 极简键值持久化：files/<key>.json，全部在 app 私有目录。
 * 线程安全：读加锁缓存，写全量覆盖。
 */
public class Store {

    private final File dir;
    // 🛡️ 进程级静态锁：旧版 synchronized 加在实例方法上，Bridge/AlarmReceiver/TaskService 各 new 各的实例，
    // 锁互不生效——静态缓存被多线程并发读写（HashMap 竞争丢条目/活引用被 TaskService 修改时 Bridge toString 迭代 CME），
    // 且两线程并发写同一个 <key>.tmp 字节交错，rename 后磁盘 JSON 损坏，冷启解析失败返回空对象，全部闹钟静默蒸发。
    // v2.5.57-wire 66 轮：全实例共享一把进程级锁，读写互斥根治。
    private static final Object LOCK = new Object();
    private static final Map<String, JSONObject> cache = new HashMap<>();

    public Store(Context ctx) {
        dir = ctx.getFilesDir();
    }

    public JSONObject get(String key) {
        synchronized (LOCK) {
            JSONObject cached = cache.get(key);
            if (cached != null) return cached;
            File f = file(key);
            if (!f.exists()) return new JSONObject();
            try (FileInputStream in = new FileInputStream(f)) {
                byte[] buf = new byte[(int) f.length()];
                int got = 0;
                while (got < buf.length) { int r = in.read(buf, got, buf.length - got); if (r < 0) break; got += r; } // 🛡️ 66 轮：循环读满（单次 read 不保证读满）
                JSONObject jo = new JSONObject(new String(buf, 0, Math.max(got, 0), StandardCharsets.UTF_8));
                cache.put(key, jo);
                return jo;
            } catch (Exception e) {
                return new JSONObject();
            }
        }
    }

    public void set(String key, JSONObject jo) {
        synchronized (LOCK) {
            cache.put(key, jo);
            File f = file(key);
            // 🛡️ 66 轮：tmp 文件名加线程 id——旧版所有线程共用同一个 <key>.tmp，即使有锁外并发写（未来其他路径）也不至于字节交错
            File tmp = new File(dir, key + "." + Thread.currentThread().getId() + ".tmp");
            try (FileOutputStream out = new FileOutputStream(tmp)) {
                out.write(jo.toString().getBytes(StandardCharsets.UTF_8));
                out.flush();
                out.getFD().sync();
                if (!tmp.renameTo(f)) {
                    // 部分文件系统 rename 失败，退回复制
                    try (FileInputStream in = new FileInputStream(tmp);
                         FileOutputStream out2 = new FileOutputStream(f)) {
                        byte[] b = new byte[8192];
                        int r;
                        while ((r = in.read(b)) > 0) out2.write(b, 0, r);
                    }
                    //noinspection ResultOfMethodCallIgnored
                    tmp.delete();
                }
            } catch (IOException e) {
                // 写失败保缓存，下轮再试
            }
        }
    }

    private File file(String key) {
        String safe = key.replaceAll("[^a-zA-Z0-9_\\-]", "_");
        return new File(dir, safe + ".json");
    }
}
