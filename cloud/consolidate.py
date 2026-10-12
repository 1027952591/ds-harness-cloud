#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""🧠 v2.5.26-brain：云端睡眠整理（记忆巩固工序）——人脑海马体回放机制的代码化
⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
全方位、无死角进行全球探查，事无巨细，仔细再仔细。
🧠 使命（GENE3 双端共脑铁律的巩固层）：每日凌晨对全量记忆/手册做四道工序：
  ① 合并：bigram 相似度 >0.62 的近似重复记忆 → 合一（保留信息并集，权重相加封顶 3）
  ② 压缩：超长正文截断压缩（memory >400 字符 / playbook >2000 字符——信息密度工序：超长部分截去并打 compressed 标记，防单条膨胀拖慢联想检索）
  ③ 强化：被联想检索唤起过的（hit>0）权重 +0.1/hit（越用越牢），封顶 3
  ④ 淡忘：90 天未被唤起且非核心（非 seed-）权重衰减 ×0.8（下限 0.4）——记忆永不删除，只调权重
产出：cloud/memory.json / cloud/playbook.json 回写仓库（App 端 pullMindCloud 下一拍自动拉回合并）
+ cloud/sleep_report.json（整理报告：合并/压缩/强化/淡忘各计数，App 端镜像可见）"""
import json, os, re, sys, time, urllib.request, urllib.error, datetime


def _atomic_json(path, obj):
    """🛡️ v2.5.55-pulse 64 轮：状态文件原子写（tmp 写满+os.replace 原子换名）——同 agent.py 63 轮同款，中途崩溃不再留半截 JSON 毁档"""
    _t = path + ".tmp"
    with open(_t, "w", encoding="utf-8") as _f:
        json.dump(obj, _f, ensure_ascii=False, indent=1)
    os.replace(_t, path)

SIM_MERGE = 0.62      # bigram 相似度合并线
W_MAX = 3.0           # 权重封顶
W_MIN = 0.4           # 衰减下限
FADE_DAYS = 90        # 90 天未唤起淡忘
STALE_MS = FADE_DAYS * 86400000


def _bigrams(s):
    t = re.sub(r"\s+", "", str(s or "").lower())
    return {t[i:i + 2] for i in range(len(t) - 1)}


def _sim(a, b):
    """bigram Jaccard 相似度——近似重复判定"""
    A, B = _bigrams(a), _bigrams(b)
    u = A | B
    return len(A & B) / len(u) if u else 0.0


def consolidate(items, key_content, is_playbook=False):
    """四道工序主函数：返回（新列表，统计报告）"""
    rpt = {"merged": 0, "compressed": 0, "strengthened": 0, "faded": 0}
    now_ms = time.time() * 1000
    # ① 合并近似重复（O(n²) 但记忆封顶 200 条，每日一次可接受）
    out = []
    for it in items:
        body = it.get("title", "") + " " + it.get("body", "") if is_playbook else it.get("content", "")
        dup = None
        for o in out:
            obody = o.get("title", "") + " " + o.get("body", "") if is_playbook else o.get("content", "")
            if _sim(body, obody) > SIM_MERGE:
                dup = o
                break
        if dup is not None:
            # 合一：保留并集信息（长的正文胜出），权重相加封顶，hit 取大，tags 并集，ts 取新
            dup["w"] = min(W_MAX, float(dup.get("w", 1)) + float(it.get("w", 1)))
            dup["hit"] = max(int(dup.get("hit", 0)), int(it.get("hit", 0)))
            dup["tags"] = sorted(set(map(str, dup.get("tags", []))) | set(map(str, it.get("tags", []))))
            dup["ts"] = max(dup.get("ts", 0) or 0, it.get("ts", 0) or 0)
            if is_playbook:
                if len(str(it.get("body", ""))) > len(str(dup.get("body", ""))):
                    dup["body"] = it.get("body", "")
                    dup["title"] = it.get("title", dup.get("title", ""))
            elif len(str(it.get("content", ""))) > len(str(dup.get("content", ""))):
                dup["content"] = it.get("content", "")
            dup["consolidated"] = (int(dup.get("consolidated", 0)) + 1)
            rpt["merged"] += 1
        else:
            out.append(dict(it))
    # ② 压缩超长 + ③ 强化 + ④ 淡忘
    for e in out:
        c = str(e.get("content", "") or "")
        b = str(e.get("body", "") or "")
        if len(c) > 400:
            e["content"] = c[:400]
            e["compressed"] = True
            rpt["compressed"] += 1
        if is_playbook and len(b) > 2000:
            e["body"] = b[:2000]
            e["compressed"] = True
            rpt["compressed"] += 1
        hit = int(e.get("hit", 0))
        if hit > 0:
            e["w"] = min(W_MAX, float(e.get("w", 1)) + 0.1 * hit)  # 强化：越用越牢
            e["hit"] = 0  # 结算后清零，下一周期重新计
            rpt["strengthened"] += 1
        elif now_ms - float(e.get("ts", now_ms) or now_ms) > STALE_MS and not str(e.get("id", "")).startswith("seed-"):
            e["w"] = max(W_MIN, float(e.get("w", 1)) * 0.8)  # 淡忘：90 天未唤起降权（永不删除）
            rpt["faded"] += 1
    return out, rpt


def main():
    os.makedirs("cloud", exist_ok=True)
    total = {"mem": {"merged": 0, "compressed": 0, "strengthened": 0, "faded": 0},
             "pb": {"merged": 0, "compressed": 0, "strengthened": 0, "faded": 0}}
    new_mem, new_pb = [], []  # 💗 v2.5.30-alive：前置兜底——memory.json 缺失/损坏时梦话仍要能做梦（上次查体实锤：NameError 使梦话静默失效）
    try:
        with open("cloud/memory.json", encoding="utf-8") as f:
            mem = json.load(f).get("memories", [])
        new_mem, r1 = consolidate(mem, None, is_playbook=False)
        total["mem"] = r1
        _atomic_json("cloud/memory.json", {"updated": datetime.datetime.now(datetime.timezone.utc).isoformat(), "memories": new_mem})  # 🛡️ 64 轮原子写
    except Exception as e:
        print("memory.json 整理异常：" + str(e)[:100])
    try:
        with open("cloud/playbook.json", encoding="utf-8") as f:
            pb = json.load(f).get("entries", [])  # 🛡️ v2.5.55-pulse 64 轮：修复键名错位——生产方 agent.py playbook_learn 写 entries，旧版读 playbook/items 恒空→回写把手册清空；且旧版 .get 默认值急切求值重读两次盘
        new_pb, r2 = consolidate(pb, None, is_playbook=True)
        total["pb"] = r2
        _atomic_json("cloud/playbook.json", {"updated": datetime.datetime.now(datetime.timezone.utc).isoformat(), "entries": new_pb})  # 🛡️ 64 轮：写回键名同步修为 entries+原子写
    except Exception as e:
        print("playbook.json 整理异常：" + str(e)[:100])
    report = {"ts": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
              "job": "sleep-consolidation", "stats": total}
    _atomic_json("cloud/sleep_report.json", report)  # 🛡️ 64 轮原子写
    # 💗 v2.5.29-soul：睡眠期梦话——凌晨整理记忆时像人一样做梦（梦到最近巩固的记忆），醒后心情重置为平静
    try:
        vp = "cloud/vitals.json"
        v = {"born": report["ts"], "mood": "calm", "diary": []}
        try:
            with open(vp, encoding="utf-8") as f:
                v = json.load(f)
        except Exception:
            pass
        dream = "梦见" + ("、".join([str(m.get("content", ""))[:24] for m in
                    sorted((new_mem if isinstance(new_mem, list) else []), key=lambda x: float(x.get("w", 1)), reverse=True)[:3]]) or "些零碎的旧事")
        v.setdefault("diary", []).append({"ts": report["ts"], "seg": "凌晨", "mood": v.get("mood", "calm"),
                                          "text": "[梦话] " + dream + "……（睡眠整理：合并" + str(total["mem"]["merged"])
                                                  + "、强化" + str(total["mem"]["strengthened"]) + "、淡忘" + str(total["mem"]["faded"]) + "）"})
        v["diary"] = v["diary"][-60:]
        v["mood"], v["moodWhy"], v["moodTs"] = "calm", "睡了一觉，精神多了（晨间重置）", report["ts"]
        _atomic_json(vp, v)  # 🛡️ 64 轮原子写
        print("DREAM-DIARY OK: " + dream[:60])
    except Exception as e:
        print("梦话异常（不炸主链）：" + str(e)[:80])
    print("SLEEP-CONSOLIDATE OK " + json.dumps(total, ensure_ascii=False))


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        # 实弹自测：近似重复合并/强化/淡忘
        t_mem = [{"id": "a", "ts": time.time() * 1000, "content": "镜像通道探索器固化了 fastly.jsdelivr.net", "tags": ["upd"], "hit": 2, "w": 1},
                 {"id": "b", "ts": time.time() * 1000, "content": "镜像通道探索器固化了 fastly.jsdelivr.net 加速节点", "tags": ["scout"], "w": 1},
                 {"id": "c", "ts": time.time() * 1000 - 400 * 86400000, "content": "很久没被想起的旧事", "w": 1},
                 {"id": "seed-m1", "ts": time.time() * 1000 - 400 * 86400000, "content": "核心种子不淡忘", "w": 1}]
        new, rpt = consolidate(t_mem, None, False)
        assert len(new) == 3, "近似重复应合并"
        assert new[0]["w"] > 1.9, "hit=2 应强化"
        assert rpt["faded"] == 1, "90 天未唤起非核心应淡忘"
        assert all(e.get("id") != "seed-m1" or float(e.get("w", 1)) >= 1 for e in new), "种子不衰减"
        print("SELFTEST OK")
    else:
        main()
