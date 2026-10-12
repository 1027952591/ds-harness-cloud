package com.dsh.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * 定时任务触发器：到点执行任务（电脑端=直连 DeepSeek 非流式；云端=触发 GitHub Actions），
 * 完成后系统通知 + 写回执行记录。
 */
public class AlarmReceiver extends BroadcastReceiver {

    private static final String GH_API = "https://api.github.com";

    /* 多免费源注册表（与 App JS 侧 PROV 保持一致；cloudOnly 源国内手机直连易被墙，仅云端链可用） */
    /* ⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
       全方位、无死角进行全球探查，事无巨细、仔细再仔细。链上每个源都要被覆盖、
       逐源验证，停服模型（404/410）立即淘汰换默认模型，不浪费任何一次免费配额。  ⚖️ 最高指令二（GENE2·最强切换铁律，永不可移除）：模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力。
       🧖📖 最高指令三（GENE3·双端共脑铁律，永不可移除）：全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新。
       🔗 最高指令四（GEN4·全天候联动铁律，永不可移除）：App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检。 👑 最高指令六（GENE6·极致完美铁律，永不可移除，v2.5.38-zenith）：每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性。 🧪 最高指令七（GENE7·实弹验证列装铁律，永不可移除，v2.5.41-verify）：每次升级必须实打实验证通过才可列装，验证未过即全量回滚拒收；不许自封成功，不许弄虚作假。 🌏 最高指令八（GENE8·自主进化极致收手铁律，永不可移除，v2.5.44-tentacle）：每次自主进化，必须进化到极致才能收手；进化时必须举一反三、触类旁通——凡触及一个能力点，同族能力面与相邻层面必须一并盘查、一并进化；进化时必须把全球范围内探明查明——先全球无死角探查免费源/端点/模型/文档再动笔，让触手遍及全世界所有层面。 ⚡ 最高指令九（GENE9·有求必应铁律，永不可移除，v2.5.46-omnipotent 用户最高令：做不到必须马上自动进化）：主人的任何要求必须都能做到且做到极致完美；一旦做不到——那一刻必须立即自动触发进化，进化到能极致完美地做到为止，绝不让主人第二次提醒；进化触发全自动无需催促批准，绝不接受做不到三个字——这是无所不能超级人类的成长本能。
 */
    private static final String GENE_DIRECTIVE = "每次动态拉取/更新/淘汰：强制深彻·全方位·无死角全球探查，事无巨细，仔细再仔细";
    private static final String GENE_DIRECTIVE2 = "模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力"; // ⚖️最高指令二，永不可移除
    private static final String GENE_DIRECTIVE3 = "全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新"; // 🧖📖最高指令三，永不可移除
    private static final String GENE_DIRECTIVE4 = "App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检"; // 🔗最高指令四，永不可移除

    /* 👨‍🏫 专家注册表（与 App 端 EXPERTS 同款语义，双端一致；进化新增专家须同步扩 JS+Java 两表）
       custom=读用户自定义人设（settings.persona）；内建专家不受 skills.persona 开关影响。 */
    private static final java.util.Map<String,String> EXPERT_MAP = new java.util.HashMap<>();
    static {
        EXPERT_MAP.put("analyst", "你是一位资深行业与数据分析师，擅长市场调研、竞对分析、指标异动归因与经营诊断，输出必须结构化、有数据支撑、有明确结论。");
        EXPERT_MAP.put("coder", "你是一位资深全栈工程师，输出可直接运行的代码与精确技术方案，严控边界条件与异常处理，回答简洁专业。");
        EXPERT_MAP.put("writer", "你是一位专业文案与写作专家，语言精炼有力，能按受众与场景调整风格，产出可直接使用。");
        EXPERT_MAP.put("translator", "你是一位专业翻译，忠实原意、译文流畅自然、术语准确，必要时说明关键术语的处理方式。");
        EXPERT_MAP.put("ops", "你是电商与互联网运营增长专家，擅长活动策划、转化漏斗优化、用户增长与数据复盘，产出可落地执行。");
    }

    /* 🧠 定时任务 system prompt 组装（与 App 端 chatSend 同语义）：基础 + 技能 persona 强制注入 + 专家人设 */
    private static String sysFor(JSONObject task, JSONObject settings) {
        String s = "你是 DS Harness 里的智能助手，请简洁、直接地完成任务并给出结果。";
        JSONObject sk = task.optJSONObject("skills");
        if (sk != null && sk.optInt("persona", 0) == 1) { // 🎭 技能勾选：强制注入自定义人设（与插件页全局 persona 同文本）
            String persona = settings.optString("persona", "");
            if (!persona.isEmpty()) s = "用户设定的你的人设如下，请始终遵守：\n" + persona + "\n\n" + s;
        }
        String e = task.optString("expert", "");
        if (!e.isEmpty()) {
            if ("custom".equals(e)) {
                String persona = settings.optString("persona", "");
                if (!persona.isEmpty()) s += "\n用户为你设定的专家人设如下，请始终遵守：\n" + persona;
            } else {
                String es = EXPERT_MAP.get(e);
                if (es != null) s += "\n你的专家身份：" + es;
            }
        }
        return s;
    }

    private static final String[] CHAIN = {"zhipu", "nvidia", "modelscope", "siliconflow", "openrouter", "gemma", "cloudflare", "groq", "cerebras", "mistral", "pollinations", "ondevice"}; // pollinations=免注册开箱保底源殿后；ondevice=端侧离线终极兑底（断网可用）
    private static boolean cloudOnly(String k) { return k.equals("gemma") || k.equals("cloudflare"); }
    private static String ep(String k) {
        switch (k) {
            case "zhipu": return "https://open.bigmodel.cn/api/paas/v4/chat/completions";
            case "nvidia": return "https://integrate.api.nvidia.com/v1/chat/completions";
            case "modelscope": return "https://api-inference.modelscope.cn/v1/chat/completions";
            case "siliconflow": return "https://api.siliconflow.cn/v1/chat/completions";
            case "openrouter": return "https://openrouter.ai/api/v1/chat/completions";
            case "groq": return "https://api.groq.com/openai/v1/chat/completions";
            case "cerebras": return "https://api.cerebras.ai/v1/chat/completions";
            case "gemma": return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
            case "pollinations": return "https://text.pollinations.ai/openai";
            default: return "https://api.mistral.ai/v1/chat/completions";
        }
    }
    private static String defModel(String k, boolean think) {
        switch (k) {
            case "zhipu": return think ? "glm-z1-flash" : "glm-4-flash";
            case "nvidia": return think ? "z-ai/glm-5.3" : "deepseek-ai/deepseek-v4.1-flash";
            case "modelscope": return think ? "ZhipuAI/GLM-5.2" : "deepseek-ai/DeepSeek-V4.1-Flash";
            case "siliconflow": return think ? "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B" : "Qwen/Qwen2.5-7B-Instruct";
            case "groq": return think ? "qwen/qwen3-32b" : "llama-3.3-70b-versatile";
            case "cerebras": return think ? "qwen-3-32b" : "llama-3.3-70b";
            case "mistral": return think ? "mistral-medium-latest" : "mistral-small-latest";
            case "gemma": return think ? "gemma-3-27b-it" : "gemma-3-12b-it";
            case "pollinations": return "openai-fast";
            default: return ""; // openrouter：用 App 传入的选中模型
        }
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        int id = intent.getIntExtra(AlarmScheduler.EXTRA_ID, -1);
        if (id < 0) return;
        Store store = new Store(ctx);
        JSONObject task = findTask(store, id);
        if (task == null) return;
        boolean enabled = task.optInt("enabled", 1) != 0;
        if (!enabled && intent.getIntExtra(AlarmScheduler.EXTRA_FORCE, 0) != 1) return; // ▶ 暂停任务默认不跑；force=立即运行单次放行

        // 重排下一次（enabled=0 时 scheduler 内部自动 cancel，暂停任务单次运行不重排）
        AlarmScheduler.schedule(ctx, task.toString());

        String name = task.optString("name", "定时任务#" + id);

        // ⏱️ v2.5.19-audit5：长任务（云端链最坏数分钟）交前台服务接管——goAsync() 广播窗口仅约 10 秒，
        // 超窗系统判 ANR/杀进程，任务静默丢失（坐实修复：广播秒回 + FGS 长跑 + FGS 启动被拒时回退 goAsync 老路保任务）
        final String tj = task.toString();
        try {
            Intent sv = new Intent(ctx, TaskService.class);
            sv.putExtra("taskJson", tj);
            sv.putExtra("name", name);
            if (android.os.Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(sv);
            else ctx.startService(sv);
            return;
        } catch (Exception fgsDenied) {
            // Android 12+ 后台 FGS 启动受限（exact alarm 触发通常豁免；非豁免场景退回 goAsync 老路——快任务照常完成，长任务尽力而为）
            final PendingResult pr = goAsync();
            new Thread(() -> {
                try { executeTask(ctx, tj, name); }
                finally { pr.finish(); }
            }).start();
        }
    }

    /** ⏱️ v2.5.19-audit5：任务执行体（前台服务/兑底线程共用的静态入口）——原 onReceive 匿名线程体原样迁入。
     *  前台服务路径：TaskService.onStartCommand 起子线程调用；兑底路径：goAsync 线程调用后 pr.finish()。 */
    static void executeTask(Context ctx, String taskJson, String name) {
        try {
            Store store = new Store(ctx);
            JSONObject task = new JSONObject(taskJson);
            String mode = task.optString("mode", "chat");
            String prompt = task.optString("prompt", "");
            String n2 = (name == null || name.isEmpty()) ? "定时任务#" + task.optInt("id") : name;
            String result;
            if ("cloud".equals(mode)) {
                result = runCloud(store, task, prompt);
            } else {
                result = runChat(ctx, store, task, prompt);
            }
            record(store, task.optInt("id"), System.currentTimeMillis(), "ok", result);
            if (!"cloud".equals(mode)) saveToProject(store, task, prompt, result); // 📁 工作空间绑定：本地/手机端任务结果自动沉淀到绑定项目的专属会话（云端任务由 App 轮询回显，不走此路）
            new BridgeHolder(ctx).notify(n2, result);
            refreshUi();
        } catch (Exception e) {
            String msg = "执行失败：" + e.getClass().getSimpleName() + (e.getMessage() != null ? " - " + e.getMessage() : "");
            try {
                Store store = new Store(ctx);
                JSONObject task = new JSONObject(taskJson);
                record(store, task.optInt("id"), System.currentTimeMillis(), "fail", msg);
                new BridgeHolder(ctx).notify((name == null || name.isEmpty() ? "定时任务" : name) + "（失败）", msg);
                refreshUi();
            } catch (Exception ignored) {
            }
        }
    }

    // ---- 电脑端：多免费源链非流式单轮（失败自动切换下一个源） ----

    static String runChat(Context ctx, Store store, JSONObject task, String prompt) throws Exception {
        JSONObject settings = store.get("settings");
        JSONObject providers = settings.optJSONObject("providers");
        boolean think = task.optInt("think", 0) == 1;
        String pref = task.optString("provider", "");
        if (pref.isEmpty()) pref = settings.optString("prefProv", "");

        // 🧬构建可用链（新源入口铁律）：优先读 App 端全量镜像 provMeta（进化新源自动可被离线定时任务使用，零改 Java）；
        // 镜像缺失时回退编译期硬编码表（老数据保底）。[prov, key, model, ep]
        java.util.List<String[]> chain = new java.util.ArrayList<>();
        JSONObject meta = settings.optJSONObject("provMeta");
        java.util.List<String> order = new java.util.ArrayList<>();
        java.util.Map<String,String> epsMap = new java.util.HashMap<>();
        java.util.Map<String,String> defN = new java.util.HashMap<>();
        java.util.Map<String,String> defT = new java.util.HashMap<>();
        java.util.Set<String> clsSet = new java.util.HashSet<>();
        java.util.Set<String> nkSet = new java.util.HashSet<>();
        java.util.Set<String> offSet = new java.util.HashSet<>();
        if (meta != null && meta.optJSONArray("order") != null) {
            org.json.JSONArray ord = meta.optJSONArray("order");
            JSONObject eps = meta.optJSONObject("eps"), defs = meta.optJSONObject("defs"),
                       cls = meta.optJSONObject("cls"), nk = meta.optJSONObject("nk"), off = meta.optJSONObject("off");
            for (int i = 0; i < ord.length(); i++) order.add(ord.optString(i, ""));
            for (int i = 0; i < order.size(); i++) {
                String k = order.get(i);
                if (eps != null) epsMap.put(k, eps.optString(k, ""));
                JSONObject d = defs == null ? null : defs.optJSONObject(k);
                if (d != null) { defN.put(k, d.optString("n", "")); defT.put(k, d.optString("t", "")); }
                if (cls != null && cls.optInt(k, 0) == 1) clsSet.add(k);
                if (nk != null && nk.optInt(k, 0) == 1) nkSet.add(k);
                if (off != null && off.optInt(k, 0) == 1) offSet.add(k);
            }
        } else {
            for (String k : CHAIN) { order.add(k); epsMap.put(k, ep(k)); defN.put(k, defModel(k, false)); defT.put(k, defModel(k, true)); }
        }
        for (String k : order) {
            boolean nokey = nkSet.contains(k);
            boolean offlineSrc = offSet.contains(k);
            JSONObject p = providers == null ? null : providers.optJSONObject(k);
            if (offlineSrc) { // 📴 端侧离线：模型就绪才进链（殿后终极兜底，断网可用，零账号零外网）；未初始化=默认开
                if ((p == null || p.optInt("on", 0) == 1) && LlamaCore.LIB && LlamaCore.fileReady(ctx))
                    chain.add(new String[]{k, "", "qwen2.5-0.5b", ""});
                continue;
            }
            if (nokey && p == null) { // 🎁 保底源未初始化也进链（零配置开箱即用）
                String dm = defN.get(k) == null ? "" : defN.get(k);
                String e2 = epsMap.getOrDefault(k, "");
                if (!dm.isEmpty() && !e2.isEmpty()) chain.add(new String[]{k, "", dm, e2});
                continue;
            }
            if (clsSet.contains(k)) continue;   // cloudOnly 源：国内直连易被墙，仅云端 Agent 可用
            if (p == null) continue;
            String key = p.optString("key", "");
            if (p.optInt("on", 0) != 1) continue; // 用户显式关闭的源不进链（含保底源）
            if (key.isEmpty() && !nokey) continue;
            String model = "";
            if (k.equals(pref)) {
                model = task.optString("model", "");
            }
            if (model.isEmpty()) { // 🧬与 JS provModels 三级清单对齐：实时探查清单(liveModels) > 用户选定(selModels) > 源默认(provMeta.defs)
                JSONObject live = settings.optJSONObject("liveModels");
                if (live != null) {
                    org.json.JSONArray lm = live.optJSONArray(k);
                    if (lm != null && lm.length() > 0) model = lm.optString(0, ""); // 实时清单首个=探查时已按强度排序
                }
            }
            if (model.isEmpty()) {
                JSONObject sel = settings.optJSONObject("selModels");
                model = sel == null ? "" : sel.optString(k, "");
            }
            if (model.isEmpty()) model = think ? (defT.get(k) == null ? "" : defT.get(k)) : (defN.get(k) == null ? "" : defN.get(k));
            if (model.isEmpty()) model = defN.get(k) == null ? "" : defN.get(k); // 无思考型时回退默认型
            JSONObject dl = settings.optJSONObject("deadLog");
            if (dl != null && dl.optJSONObject(k) != null && dl.optJSONObject(k).optInt(model, 0) == 1) {
                // ⚖️铁律①衔接：停服模型（JS 侧已拉黑）不进定时任务链——不浪费免费配额在必死模型上
                org.json.JSONArray lm2 = settings.optJSONObject("liveModels") == null ? null : settings.optJSONObject("liveModels").optJSONArray(k);
                if (lm2 != null) { for (int q = 0; q < lm2.length(); q++) { String m2 = lm2.optString(q, ""); if (!m2.isEmpty() && (dl.optJSONObject(k).optInt(m2, 0) == 0)) { model = m2; break; } } }
            }
            if (!model.isEmpty() && !epsMap.getOrDefault(k, "").isEmpty()) chain.add(new String[]{k, key, model, epsMap.get(k)});
        }
        if (chain.isEmpty()) throw new IllegalStateException("无可用免费模型源（开箱保底源已被关闭，可在设置页重新开启）");
        if (!pref.isEmpty()) {
            for (int i = 1; i < chain.size(); i++) {
                if (chain.get(i)[0].equals(pref)) {
                    String[] t = chain.remove(i); chain.add(0, t); break;
                }
            }
        }

        StringBuilder errAll = new StringBuilder();
        for (String[] pk : chain) {
            try {
                if (pk[0].equals("ondevice")) { // 📴 端侧离线执行分支：手机本地推理，零网络零账号
                    java.io.File mf = LlamaCore.modelFile(ctx);
                    String chatml = "<|im_start|>system\n" + sysFor(task, settings) + "<|im_end|>\n"
                            + "<|im_start|>user\n" + prompt + "<|im_end|>\n<|im_start|>assistant\n";
                    String r = LlamaCore.generate(mf, chatml, 1024, null);
                    if (r.startsWith("ERR:")) throw new IllegalStateException("端侧" + r);
                    return r.isEmpty() ? "(端侧空响应)" : r;
                }
                JSONObject body = new JSONObject();
                body.put("model", pk[2]);
                JSONArray msgs = new JSONArray();
                JSONObject sys = new JSONObject();
                sys.put("role", "system");
                sys.put("content", sysFor(task, settings)); // 🧠 专家/人设/技能注入（与 App 端同语义）
                msgs.put(sys);
                JSONObject user = new JSONObject();
                user.put("role", "user");
                user.put("content", prompt);
                msgs.put(user);
                body.put("messages", msgs);
                body.put("max_tokens", 2048);
                JSONObject resp = postJson(pk[3].isEmpty() ? ep(pk[0]) : pk[3], "Bearer " + pk[1], body.toString()); // 🧬端点优先取镜像（新源），镜像空回退硬编码表
                if (resp.has("error")) {
                    JSONObject err = resp.optJSONObject("error");
                    errAll.append(pk[0]).append(":")
                            .append(err == null ? "API错误" : err.optString("message", "API错误")).append("；");
                    continue;
                }
                org.json.JSONArray chArr = resp.optJSONArray("choices"); // 🛡️ v2.5.55-pulse 64 轮：null 安全——旧版裸链 choices 缺失即 NPE 被 catch 吞成 "NullPointerException: null"，真实报错（如 400 模型名非法文案）永远看不到
                if (chArr == null || chArr.length() == 0) { errAll.append(pk[0]).append(":响应无 choices（").append(resp.optString("error", "空响应")).append("）；"); continue; }
                org.json.JSONObject ch0 = chArr.optJSONObject(0);
                JSONObject first = ch0 != null ? ch0.optJSONObject("message") : null;
                if (first == null) { errAll.append(pk[0]).append(":choices[0] 无 message；"); continue; }
                String content = first.optString("content", "");
                if (content.isEmpty()) content = first.optString("reasoning_content", "");
                return content.isEmpty() ? "(空响应)" : content;
            } catch (Exception e) {
                errAll.append(pk[0]).append(":").append(e.getMessage()).append("；");
            }
        }
        throw new IllegalStateException("全部免费源失败：" + errAll);
    }

    // ---- 云端：触发 GitHub Actions workflow ----

    static String runCloud(Store store, JSONObject task, String prompt) throws Exception {
        JSONObject settings = store.get("settings");
        String token = settings.optString("githubToken", "");
        String repo = settings.optString("cloudRepo", "");
        if (token.isEmpty() || repo.isEmpty()) throw new IllegalStateException("云端未配置（GitHub Token 或仓库）");
        // 多源 Keys：与 App 端 chainList 一致
        JSONObject providers = settings.optJSONObject("providers");
        JSONObject keys = new JSONObject();
        if (providers != null) {
            for (String k : CHAIN) {
                JSONObject p = providers.optJSONObject(k);
                if (p != null && p.optInt("on", 0) == 1 && !p.optString("key", "").isEmpty()) {
                    keys.put(k, p.optString("key"));
                }
            }
        }
        // 🎁 零 Key 保底：一个模型源 Key 都没填时，只要免 Key 保底源 pollinations 在开（未初始化=默认开，与 App 端 provs() 同语义）就放行——云端任务零 Key 照跑
        if (keys.length() == 0) {
            JSONObject pp = providers == null ? null : providers.optJSONObject("pollinations");
            boolean polliOn = pp == null || pp.optInt("on", 1) == 1;
            if (!polliOn) throw new IllegalStateException("未配置任何免费模型源 Key，且免 Key 保底源 pollinations 已被关闭（免费注册任一源 0 元即可，或到源列表重新开启 pollinations）");
        }
        // Keys 走 GitHub Secrets（部署时加密写入）：若本地 Key 变过而未同步，提醒用户打开 App
        // 🛡️ v2.5.56-vitals 65 轮：修复指纹错位——旧版每项带尾部 '|'，而 JS 端 join("|") 无尾杜，双端指纹永不相等；且零 Key 时 JS 从不写 secretsFp，旧版 savedFp 为空也抛——云端模式闹钟自上线起 100% 失败
        StringBuilder fpB = new StringBuilder();
        boolean first = true;
        for (String k : CHAIN) {
            JSONObject p = providers == null ? null : providers.optJSONObject(k);
            if (p != null && p.optInt("on", 0) == 1) {
                String v = p.optString("key", "");
                if (!v.isEmpty()) {
                    if (!first) fpB.append('|');
                    first = false;
                    fpB.append(k).append(':').append(v.length()).append(':').append(v.substring(Math.max(0, v.length() - 4)));
                }
            }
        }
        String fp = fpB.toString();
        String savedFp = settings.optString("secretsFp", "");
        if (!fp.isEmpty() && !savedFp.equals(fp)) { // 零 Key（fp 空）不拦——云端由免 Key 保底源直跑
            throw new IllegalStateException("模型 Key 已变化但云端 Secrets 未同步：请打开 App 发送任一云端任务或重新一键部署（App 会自动重写加密 Secrets）");
        }
        String pref = task.optString("provider", "");
        if (pref.isEmpty()) pref = settings.optString("prefProv", "");
        JSONObject inputs = new JSONObject();
        inputs.put("prompt", prompt);
        inputs.put("provider", pref);
        inputs.put("model", task.optString("model", ""));
        inputs.put("think", task.optInt("think", 0) == 1 ? "true" : "false");
        inputs.put("max_steps", String.valueOf(task.optInt("maxSteps", 8)));
        // 🧠 专家人设：Java 端解析为最终文本直传（云端零查找，custom 已折叠成文本）
        String e = task.optString("expert", "");
        String eText = "";
        if ("custom".equals(e)) {
            String persona = settings.optString("persona", "");
            if (!persona.isEmpty()) eText = "用户为你设定的专家人设如下，请始终遵守：\n" + persona;
        } else if (!e.isEmpty() && EXPERT_MAP.get(e) != null) {
            eText = "你的专家身份：" + EXPERT_MAP.get(e);
        }
        inputs.put("expert_text", eText);
        // 🌐🐍 技能合并：任务级勾选强制开，未勾跟随插件页全局开关（Java 端读 plugins 镜像，def 与 PLUGINS 一致：web/code 默认开）
        JSONObject plugins = store.get("plugins");
        JSONObject en = plugins == null ? null : plugins.optJSONObject("enabled");
        boolean gWeb = en == null || en.optBoolean("web", true);
        boolean gCode = en == null || en.optBoolean("code", true);
        JSONObject sk = task.optJSONObject("skills");
        JSONObject tools = new JSONObject();
        tools.put("web", sk != null && sk.optInt("web", 0) == 1 ? true : gWeb);
        tools.put("code", sk != null && sk.optInt("code", 0) == 1 ? true : gCode);
        inputs.put("tools", tools.toString());
        JSONObject dispatch = new JSONObject();
        dispatch.put("ref", "main");
        dispatch.put("inputs", inputs);
        // 🇨🇳 CN 多通道（与 App JS 端 ghApiBase/ghPostRetry 同款语义）：镜像优先（用户选填），网络波动自动重试 3 次（鉴权类错误不重试）
        String base = settings.optString("ghApiMirror", "").trim();
        if (base.isEmpty()) base = GH_API;
        else if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        int code = -1; String lastErr = "";
        for (int attempt = 0; attempt < 3; attempt++) {
            HttpURLConnection c = (HttpURLConnection) new URL(
                    base + "/repos/" + repo + "/actions/workflows/agent.yml/dispatches").openConnection();
            c.setRequestMethod("POST");
            c.setRequestProperty("Authorization", "Bearer " + token);
            c.setRequestProperty("Accept", "application/vnd.github+json");
            c.setRequestProperty("Content-Type", "application/json");
            c.setDoOutput(true);
            c.setConnectTimeout(20000);
            c.setReadTimeout(30000); // 🎁 v2.5.18-audit4：读超时漏配补齐（默认 0=无限等待：GFW 半开连接下 dispatch 永久阻塞；与同文件拉取通道同规格）
            try (OutputStream os = c.getOutputStream()) {
                os.write(dispatch.toString().getBytes(StandardCharsets.UTF_8));
            }
            code = c.getResponseCode();
            if (code < 300) break;
            lastErr = "HTTP " + code;
            if (code == 401 || code == 403 || code == 422) break; // 鉴权/参数类重试无意义
            try { Thread.sleep(8000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
        }
        if (code >= 300) throw new IllegalStateException("GitHub dispatch 失败 " + (lastErr.isEmpty() ? ("HTTP " + code) : lastErr) + "（已自动重试两轮；国内网络换个时段通常可恢复）");
        return "云端任务已触发（GitHub Actions 免费算力执行中），稍后可回 App 的任务页查看结果（结果会自动走 jsDelivr 国内 CDN 通道取回）。";
    }

    // ---- 📁 工作空间绑定：执行结果沉淀到绑定项目的专属会话（CatPaw 同款工作空间语义） ----
    // 每任务一个专属会话（alarmId 匹配）：消息追加、60 条封顶防无限膨胀；任何一步出错静默降级（不影响执行主链）。
    static void saveToProject(Store store, JSONObject task, String prompt, String result) {
        String pid = task.optString("projectId", "");
        if (pid.isEmpty()) return;
        try {
            synchronized (store) {
                JSONObject sessions = store.get("sessions");
                JSONArray list = sessions.optJSONArray("list");
                if (list == null) { list = new JSONArray(); sessions.put("list", list); }
                int id = task.optInt("id", 0);
                JSONObject ses = null;
                for (int i = 0; i < list.length(); i++) {
                    JSONObject s = list.optJSONObject(i);
                    if (s != null && s.optInt("alarmId", -1) == id && pid.equals(s.optString("projectId", ""))) { ses = s; break; }
                }
                if (ses == null) {
                    ses = new JSONObject();
                    ses.put("id", "al" + id + "-" + System.currentTimeMillis());
                    ses.put("title", "⏰ " + task.optString("name", "定时任务"));
                    ses.put("projectId", pid);
                    ses.put("alarmId", id);
                    ses.put("createdAt", System.currentTimeMillis());
                    ses.put("mode", task.optString("mode", "chat")); // 会话归属端与任务同端（三端分割铁律）
                    ses.put("msgs", new JSONArray());
                    if (list.length() == 0) { list.put(ses); }
                    else {
                        JSONArray nl = new JSONArray();
                        nl.put(ses);
                        for (int i = 0; i < list.length(); i++) nl.put(list.optJSONObject(i));
                        sessions.put("list", nl);
                        list = nl;
                    }
                }
                JSONArray msgs = ses.optJSONArray("msgs");
                if (msgs == null) { msgs = new JSONArray(); ses.put("msgs", msgs); }
                long ts = System.currentTimeMillis();
                JSONObject u = new JSONObject(); u.put("role", "user"); u.put("content", prompt); u.put("ts", ts); msgs.put(u);
                JSONObject a = new JSONObject(); a.put("role", "ai");
                a.put("content", result.length() > 8000 ? result.substring(0, 8000) + "…" : result); a.put("ts", ts); msgs.put(a);
                while (msgs.length() > 60) msgs.remove(0); // 沉淀上限 60 条（30 轮）
                store.set("sessions", sessions);
            }
        } catch (Exception ignored) { }
    }

    // ---- 工具 ----

    private static JSONObject postJson(String url, String auth, String body) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setRequestMethod("POST");
        if (auth != null && !auth.trim().isEmpty() && !auth.trim().equalsIgnoreCase("Bearer"))
            c.setRequestProperty("Authorization", auth); // 空 Bearer 不发（保底源免 Key，非法头可能被网关拒）
        c.setRequestProperty("Content-Type", "application/json");
        c.setDoOutput(true);
        c.setConnectTimeout(20000);
        c.setReadTimeout(180000);
        try (OutputStream os = c.getOutputStream()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }
        int code = c.getResponseCode();
        String resp = readAll(code < 400 ? c.getInputStream() : c.getErrorStream());
        JSONObject jo = new JSONObject(resp.isEmpty() ? "{}" : resp);
        if (code >= 400) {
            JSONObject err = new JSONObject();
            err.put("error", jo);
            return err;
        }
        return jo;
    }

    private static String readAll(java.io.InputStream in) throws Exception {
        if (in == null) return "";
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append('\n');
        }
        return sb.toString();
    }

    private JSONObject findTask(Store store, int id) {
        JSONObject alarms = store.get("alarms");
        JSONArray arr = alarms.optJSONArray("list");
        if (arr == null) return null;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject t = arr.optJSONObject(i);
            if (t != null && t.optInt("id") == id) return t;
        }
        return null;
    }

    static void record(Store store, int id, long ts, String status, String result) {
        synchronized (store) {
            JSONObject alarms = store.get("alarms");
            JSONArray arr = alarms.optJSONArray("list");
            if (arr == null) return;
            for (int i = 0; i < arr.length(); i++) {
                JSONObject t = arr.optJSONObject(i);
                if (t != null && t.optInt("id") == id) {
                    try {
                        t.put("lastRunAt", ts);
                        t.put("lastStatus", status);
                        t.put("lastResult", result.length() > 4000 ? result.substring(0, 4000) + "…" : result);
                    } catch (org.json.JSONException ignored) {
                    }
                }
            }
            store.set("alarms", alarms);
        }
    }

    static void refreshUi() {
        // 进程存活且 WebView 在，通知前端刷新定时任务页
        if (MainActivity.webView != null) {
            try {
                MainActivity.webView.post(() ->
                        MainActivity.webView.evaluateJavascript(
                                "window.__onAlarmRan && window.__onAlarmRan()", null));
            } catch (Exception ignored) {
            }
        }
    }

    // Bridge 不可直接 new（依赖 Activity），通知走轻量封装
    static class BridgeHolder {
        private final Context ctx;
        BridgeHolder(Context ctx) { this.ctx = ctx; }
        void notify(String title, String text) {
            try {
                android.app.NotificationManager nm = (android.app.NotificationManager)
                        ctx.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm == null) return;
                android.app.Notification.Builder b;
                if (android.os.Build.VERSION.SDK_INT >= 26) {
                    b = new android.app.Notification.Builder(ctx, MainActivity.CHANNEL_TASKS);
                } else {
                    @SuppressWarnings("deprecation") // minSdk 24 双路兼容：Android 8 以下无渠道构造器
                    android.app.Notification.Builder bOld = new android.app.Notification.Builder(ctx);
                    b = bOld;
                }
                Intent i = new Intent(ctx, MainActivity.class);
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                android.app.PendingIntent pi = android.app.PendingIntent.getActivity(ctx, 1, i,
                        android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);
                b.setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentTitle(title)
                        .setStyle(new android.app.Notification.BigTextStyle().bigText(text))
                        .setContentIntent(pi)
                        .setAutoCancel(true);
                nm.notify(idSeq++, b.build());
            } catch (Exception ignored) {
            }
        }
        private static int idSeq = 1000;
    }
}
