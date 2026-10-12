#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DS Harness — 每日免费模型情报自维护（GitHub Actions 免费 runner 上运行）。
⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次拉取/更新/淘汰，强制深彻、全方位、无死角
全球探查，事无巨细、仔细再仔细；任何源的失败/跳过都必须留痕进 probe，
严禁静默跳过——探查结果随 models.json 提交入库，可永久审计。
拉取全球各免费源 /v1/models 最新清单 → 过滤免费/对话模型 → 淘汰停服模型 →
提交 models.json 到仓库，手机端三级缓存（live>repo>静态）的“云端每日”层。
零第三方依赖：仅用 Python 标准库。"""
import json, os, re, urllib.request, urllib.error, datetime

GENE_DIRECTIVE = "每次动态拉取/更新/淘汰：强制深彻·全方位·无死角全球探查，事无巨细，仔细再仔细"  # ⚖️最高指令一，永不可移除
GENE_DIRECTIVE2 = "模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力"  # ⚖️最高指令二，永不可移除
GENE_DIRECTIVE3 = "全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新"  # 🧖📖最高指令三（双端共脑），永不可移除
GENE_DIRECTIVE4 = "App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检"  # 🔗最高指令四（全天候联动），永不可移除
GENE_DIRECTIVE6 = "每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性"  # 👑最高指令六
GENE_DIRECTIVE7 = "每次升级必须实打实验证通过才可列装：实弹验证列装闸对真实文件跑全仓 vuln_check，任一红项即全量回滚拒列装；不许自封成功，不许弄虚作假"  # 🧪最高指令七（GENE7·实弹验证列装铁律，v2.5.41-verify 用户最高令），永不可移除
GENE_DIRECTIVE8 = "每次自主进化，必须进化到极致才能收手；进化时必须举一反三、触类旁通——凡触及一个能力点，同族能力面与相邻层面必须一并盘查、一并进化；进化时必须把全球范围内探明查明——先全球无死角探查免费源/端点/模型/文档再动笔，让触手遍及全世界所有层面"  # 🌏最高指令八（GENE8·自主进化极致收手铁律，v2.5.44-tentacle 用户最高令），永不可移除
GENE_DIRECTIVE9 = "有求必应铁律：主人的任何要求必须都能做到且做到极致完美；一旦发现做不到、做不完美——那一刻必须立即自动触发进化，进化到能极致完美地做到为止，绝不让主人第二次提醒，绝不接受做不到三个字；进化触发是自动的，无需任何人催促批准——这是无所不能超级人类的成长本能"  # ⚡最高指令九（GENE9·有求必应铁律，v2.5.46-omnipotent 用户最高令：做不到马上自动进化），永不可移除


def mind_daily_digest(out):
    """🧖 GEN3：每日情报总结自动沉淀为永久记忆（双端同步；由 workflow commit 回仓，App 拉取合并）"""
    try:
        mem = []
        try:
            with open("cloud/memory.json", encoding="utf-8") as f:
                mem = json.load(f).get("memories", [])
        except Exception:
            pass
        ok_srcs = sorted(out.get("sources", {}).keys())
        eol = out.get("eol", {}) or {}
        eol_n = sum(len(v) for v in eol.values())
        digest = "每日情报总结（%s）：探查 %d 源，成功 %d 源（%s），新增淘汰停服 %d 个模型，清单全部按强度降序入库（最强在队首）" % (
            datetime.datetime.utcnow().strftime("%Y-%m-%d"), len(PROV), len(ok_srcs), ",".join(ok_srcs), eol_n)
        if any(str(e.get("content", "")).startswith(digest[:15]) for e in mem):  # 🛡️ 65 轮：按日期前缀真去重（旧版 [7:20] 取的是"探查 11 源，成功 8"计数段，源数一变当天重复沉淀、不变则"每日"被跳过）
            return  # 当日已沉淀（按日期前缀去重）
        mem.append({"id": "d" + str(int(datetime.datetime.utcnow().timestamp() * 1000)),
                     "ts": int(datetime.datetime.utcnow().timestamp() * 1000),
                     "kind": "daily", "content": digest, "tags": ["daily", "情报"]})
        if len(mem) > 200:
            mem = mem[-200:]
        _atomic_json("cloud/memory.json", {"updated": datetime.datetime.utcnow().isoformat() + "Z", "memories": mem})  # 🛡️ 65 轮原子写
        print("[mind] daily digest saved", flush=True)
    except Exception as e:
        print("[mind] digest skipped: %s" % e, flush=True)  # 留痕不中断，符合铁律①精神


PROV = {
    "zhipu": {
        "ep": "https://open.bigmodel.cn/api/paas/v4/models",
        "key": os.environ.get("ZHIPU_KEY", ""),
        "mode": "curated",  # 精选免费 ∩ 在线 = 免费保证 + 自动淘汰
        "seed": ["glm-4-flash", "glm-4-flashx", "glm-4.7-flash", "glm-5", "glm-5-airx", "glm-5-flash"],
    },
    "nvidia": {
        "ep": "https://integrate.api.nvidia.com/v1/models",
        "key": os.environ.get("NVIDIA_KEY", ""),  # 清单无需 Key，但带上更稳
        "mode": "all",
        "seed": ["deepseek-ai/deepseek-v4.1-flash", "z-ai/glm-5.3"],
    },
    "modelscope": {  # 魔搭：2000次/天免费，清单免 Key 可拉
        "ep": "https://api-inference.modelscope.cn/v1/models",
        "key": os.environ.get("MODELSCOPE_KEY", ""),
        "mode": "all",
        "seed": ["deepseek-ai/DeepSeek-V4.1-Flash", "ZhipuAI/GLM-5.2"],
    },
    "siliconflow": {
        "ep": "https://api.siliconflow.cn/v1/models",
        "key": os.environ.get("SILICONFLOW_KEY", ""),
        "mode": "curated",
        "seed": ["Qwen/Qwen2.5-7B-Instruct", "THUDM/glm-4-9b-chat", "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"],
    },
    "openrouter": {
        "ep": "https://openrouter.ai/api/v1/models",
        "key": os.environ.get("OPENROUTER_KEY", ""),  # 公开接口
        "mode": "orfree",  # pricing==0 才算免费
        "seed": [],
    },
    "groq": {
        "ep": "https://api.groq.com/openai/v1/models",
        "key": os.environ.get("GROQ_KEY", ""),
        "mode": "all",
        "seed": ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"],
    },
    "cerebras": {
        "ep": "https://api.cerebras.ai/v1/models",
        "key": os.environ.get("CEREBRAS_KEY", ""),
        "mode": "all",
        "seed": ["llama-3.3-70b", "gpt-oss-120b"],
    },
    "mistral": {
        "ep": "https://api.mistral.ai/v1/models",
        "key": os.environ.get("MISTRAL_KEY", ""),
        "mode": "all",
        "seed": ["mistral-small-latest", "mistral-medium-latest"],
    },
    # 🎁 v2.5.17-audit3：pollinations 免 Key 保底源补每日情报通道（与 App 端 MODELS_EP 同端点；
    # 此前仅静态种子两型号，pollinations 常换型号名导致保底源退化——现在每日云端自动保鲜）
    "pollinations": {
        "ep": "https://text.pollinations.ai/models",
        "key": os.environ.get("POLLINATIONS_KEY", ""),  # 清单匿名可拉，Key 留空照常
        "mode": "curated",
        "seed": ["openai-fast", "openai"],
    },
    "gemma": {
        "ep": "https://generativelanguage.googleapis.com/v1beta/openai/models",
        "key": os.environ.get("GEMMA_KEY", ""),
        "mode": "curated",
        "seed": ["gemma-3-27b-it"],
    },
    "cloudflare": {  # Workers AI 私有 REST：models/search，需 account id
        "ep": "https://api.cloudflare.com/client/v4/accounts/{account}/ai/models/search",
        "key": os.environ.get("CLOUDFLARE_KEY", ""),
        "account": os.environ.get("CLOUDFLARE_ACCOUNT", ""),
        "mode": "curated",
        "seed": ["@cf/meta/llama-3.1-8b-instruct", "@cf/qwen/qwen2.5-cot-32b",
                 "@cf/meta/llama-3.2-3b-instruct"],
        "cf": True,
    },
}

CHAT_FILTER = re.compile(
    r"embed|safety|guard|starcoder|fuyu|sea-lion|clip|sdxl|parakeet|kumo|asr|parse|"
    r"canary|rerank|moderation|vision-only|tts|whisper|audio|image|flux", re.I)


def http_json(url, key="", timeout=20):
    if not url:  # ⚖️盲区源（无端点）：不裸抛，交由铁律②以明确拒绝
        return None, 0
    req = urllib.request.Request(url)
    if key:
        req.add_header("Authorization", "Bearer " + key)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8")), r.status
    except urllib.error.HTTPError as e:
        return None, e.code
    except Exception:
        return None, 0


def extract_ids(k, cfg, j):
    """从各源响应提取模型 id 列表（OpenAI 兼容 + Cloudflare 私有格式）。"""
    if not j:
        return []
    if cfg.get("cf"):  # Cloudflare：{result:[{name,task:{name}}]}，只收文本生成
        return [m.get("name") for m in (j.get("result") or [])
                if m.get("name") and (not m.get("task")
                                       or re.search(r"text generation|conversational",
                                                    str((m.get("task") or {}).get("name", "")), re.I))]
    items = (j.get("data") or j.get("models") or []) if isinstance(j, dict) else (j if isinstance(j, list) else [])
    # 🎁 v2.5.17-audit3：pollinations 返回顶层数组 [{name,reasoning,tier...}]（实测），与 OpenAI {data:[]} 并存兼容
    ids = [m.get("id") or m.get("name") or "" for m in items]
    ids = [i[7:] if i.startswith("models/") else i for i in ids]
    return [i for i in ids if i]


def clean(k, cfg, ids):
    """按免费策略清洗：停服模型自动出局（在线清单里没有即淘汰）。"""
    if not ids:
        return None
    if cfg["mode"] == "curated":
        out = [m for m in cfg["seed"] if m in ids]
    elif cfg["mode"] == "orfree":
        out = ids
    else:  # all
        out = [i for i in ids if i and not CHAT_FILTER.search(i)]
        for s in cfg["seed"]:
            if s not in out:
                out.insert(0, s)
        out = out[:40]
    return out or None


GENE_DIRECTIVE = "每次动态拉取/更新/淘汰：强制深彻·全方位·无死角全球探查，事无巨细，仔细再仔细"
GENE_DIRECTIVE2 = "模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力"  # ⚖️最高指令二，永不可移除


def _atomic_json(path, obj):
    """🛡️ v2.5.56-vitals 65 轮：原子写（tmp 写满+os.replace）——同 agent.py 63 轮同款；旧版直写中断即坏，坏 models.json 使 load_prev 静默失败→eol diff 机制无声失效"""
    _t = path + ".tmp"
    with open(_t, "w", encoding="utf-8") as _f:
        json.dump(obj, _f, ensure_ascii=False, indent=1)
    os.replace(_t, path)


def model_strength(m):
    """⚖️铁律②：强度评分——清单按强度降序入库，队首即该源最强，切换时直接取最强。"""
    if not m:
        return -999
    x = str(m).lower(); s = 0
    if re.search(r"r1|reasoning|thinking|-o1|o3|cot", x):
        s += 200
    sz = re.search(r"(\d+(?:\.\d+)?)\s*b\b", x)
    if sz:
        s += min(int(float(sz.group(1)) * 10), 1500)
    gen = re.search(r"v(\d+(?:\.\d+)?)\b", x)
    if gen:
        s += float(gen.group(1)) * 20
    if re.search(r"pro|max|ultra|large|plus|big", x):
        s += 60
    if re.search(r"flash|lite|mini|small|tiny|nano", x):
        s -= 40
    if re.search(r"embed|whisper|audio|image|guard|safety|moderation", x):
        s -= 999
    return s


def load_prev():
    """⚖️铁律④前置：读上一轮 models.json，用于 diff 出停服模型。"""
    try:
        with open("models.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"sources": {}, "eol": {}}  # 🛡️ 65 轮：缺省带回 eol 字段防 KeyError


def main():
    print("⚖️ GENE 基因铁律：" + GENE_DIRECTIVE)
    prev = load_prev()
    prev_sources = prev.get("sources", {})
    out = {"sources": {}, "probe": {}, "eol": {}, "audit": {}, "updated": datetime.datetime.utcnow().isoformat() + "Z"}
    for k, cfg in PROV.items():
        ep = cfg["ep"]
        key = cfg["key"]
        if cfg.get("cf"):  # Cloudflare：account 从 Secret 或 Key 格式 account:token 拆出
            acct = cfg.get("account") or ""
            if ":" in key and not acct:
                acct, key = key.split(":", 1)
            if not acct:
                print("[cloudflare] SKIP (缺 account id)")
                out["probe"][k] = {"ok": 0, "n": 0, "status": 0, "why": "missing account id"}
                continue
            ep = ep.replace("{account}", acct)
        j, status = http_json(ep, key)
        ids = extract_ids(k, cfg, j)
        if k == "openrouter" and j:  # 免费过滤（pricing==0）
            ids = [m.get("id", "") for m in j.get("data", [])
                   if str((m.get("pricing") or {}).get("prompt")) == "0"
                   and str((m.get("pricing") or {}).get("completion")) == "0"]
        lst = clean(k, cfg, ids)
        if lst:
            lst = sorted(lst, key=model_strength, reverse=True)  # ⚖️铁律②：清单按强度降序，队首即该源可切换的最强模型
            out["sources"][k] = lst
            out["probe"][k] = {"ok": 1, "n": len(lst), "status": status}
            print("[%s] %d models (HTTP %s)" % (k, len(lst), status))
        else:
            out["probe"][k] = {"ok": 0, "n": 0, "status": status, "why": "empty after clean"}
            print("[%s] SKIP (HTTP %s)" % (k, status))
        # ⚖️铁律④：diff 上一轮清单，停服模型永久留痕进 eol（永不回流）；🛡️ v2.5.56-vitals 65 轮三修：①eol 携历史合并（旧版每轮从零重建，历史淘汰逐日丢失）②拉取失败源不计淘汰（旧版 lst=None 被截断/seed 变动的活模型误记停服）③拉取失败整源清单消失时 eol 显式留痕
        old = prev_sources.get(k) or []
        if old and lst:
            retired = [m for m in old if m not in lst]
            if retired:
                out["eol"][k] = sorted(set((out["eol"].get(k) or []) + retired))
                print("[%s] ⚖️淘汰停服模型 %d 个: %s" % (k, len(retired), retired))
        elif old and not lst:
            out["eol"][k] = sorted(set((out["eol"].get(k) or []))[:0] or old[:5])  # 拉取失败：前 5 个模型名留痕（下轮恢复后 diff 不会误报，真实停服仍会计入）
            print("[%s] ⚠️拉取失败，上轮清单 %d 模型暂离视野（真实停服下轮计入）" % (k, len(old)), flush=True)

    # ⚖️铁律②：源注册表↔端点双向盲区自审，盲区即刻报错
    holes = [k for k in PROV if not PROV[k].get("ep")]
    if holes:
        raise SystemExit("⚖️基因铁律②检查失败：以下源无动态清单端点（盲区）：%s" % holes)
    probed = set(out["probe"].keys()); registered = set(PROV.keys())
    # 🛡️ v2.5.56-vitals 65 轮：eol 携历史——旧版每轮从零重建，历史淘汰记录逐日丢失（"永久留痕永不回流"名不副实）；现并入上一轮 eol 存档，只增不减
    for _k, _v in (prev.get("eol") or {}).items():
        out["eol"][_k] = sorted(set((out["eol"].get(_k) or []) + _v))
    gaps = registered - probed
    if gaps:
        raise SystemExit("⚖️基因铁律①检查失败：以下源未被探查（静默跳过即基因缺陷）：%s" % sorted(gaps))
    # ⚖️铁律③：本零探查结果=异常，拒绝提交空清单污染手机端
    if not out["sources"]:
        raise SystemExit("⚖️基因铁律③检查失败：全部源拉取失败，拒绝提交空 models.json（保留上轮有效情报）")
    out["audit"] = {"probed": len(out["probe"]), "registered": len(PROV),
                    "ok_sources": len(out["sources"]), "eol_total": sum(len(v) for v in out["eol"].values()),
                    "directive": GENE_DIRECTIVE, "directive2": GENE_DIRECTIVE2,
                    "directive3": GENE_DIRECTIVE3,
                    "directive4": GENE_DIRECTIVE4,
                    "strongest_first": True}
    mind_daily_digest(out)  # 🧖 GEN3：每日情报总结沉淀为永久记忆，随 workflow commit 双端同步
    _atomic_json("models.json", out)  # 🛡️ 65 轮原子写
    print("⚖️ audit: " + json.dumps(out["audit"], ensure_ascii=False))
    print("models.json written: %d/%d sources" % (len(out["sources"]), len(PROV)))
    try:  # 🧬 v2.5.92-hub 108 轮：统一主动中枢——每日情报班战果同步进 cloud/proactive.json 战报流（App 端聊天页统一公告）
        try:
            with open("cloud/proactive.json", encoding="utf-8") as _f:
                _feed = json.load(_f)
        except Exception:
            _feed = []
        if not isinstance(_feed, list):
            _feed = []
        _feed.append({"kind": "models", "title": "📡 每日情报班完成：%d/%d 源在线" % (len(out["sources"]), len(PROV)),
                      "brief": "探查 %d 源 · 在线 %d 源 · eol 累计 %d；清单已热更 App 端（chainList 动态吃进，进化新增源同拍参战）" % (out["audit"]["probed"], out["audit"]["ok_sources"], out["audit"]["eol_total"]),
                      "ts": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")})
        _atomic_json("cloud/proactive.json", _feed[-30:])
    except Exception:
        pass


if __name__ == "__main__":
    main()
