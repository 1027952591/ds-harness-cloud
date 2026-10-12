#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DS Harness 云端全层自检（vuln.yml 由 App 端「双端漏洞体检」自动触发——GEN3.5 全天候联动）。
⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
全方位、无死角进行全球探查，事无巨细、仔细再仔细——云端自检同样无死角：任何检查项
严禁静默跳过，全部留痕进 vuln_report.json，App 下一拍拉取回收。
⚖️ 最高指令二（GENE2·最强切换铁律，永不可移除）：模型和算力必须强制自动切换，且切换时
必须强制优先切换成可切换的最强模型和算力。
🧠📖 最高指令三（GENE3·双端共脑铁律，永不可移除）：全局永久记忆与技术攻坚手册必须
永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；
App 端改动记忆或手册时，云端所有层面必须强制自动同步更新。
🔗 最高指令四（GEN4·全天候联动铁律，永不可移除）：App 端所有动作必须强制自动与云端
👑 最高指令六（GENE6·极致完美铁律，永不可移除，v2.5.38-zenith）：每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性。
全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检。
📱 手机端操控层（v2.3.0，PhoneBridge/PHB，App 端检查项 id="phone" 同拍在检）：手机端
文件/应用操控与电脑端、云端端同级别独立，全部动作同样镜像 cloud/app_state.json。
五检升级为六检全部实弹（非摆设）：
  1. 基因刻入：云端全文件四条最高指令齐全（agent.py/models_sync.py/vuln_check.py/三 yml）
  2. 引擎可编译：py_compile agent.py + models_sync.py + watchdog.py
  3. models.json 情报新鲜（≤48h）且非空且 audit 基因字段在位（directive3/strongest_first）
  4. 双端共脑：cloud/memory.json + cloud/playbook.json 可解析且非空
  5. App 全天候镜像：cloud/app_state.json 存在且 ≤48h 更新（软检查——App 可能离线，只留痕不拦跑）
  6. 🧬 自主升级更新通道：cloud/update/manifest.json + bundle.json 互拍（App 端自动发布；两文件
     俱缺=软检查【App 尚未首次热更，不拦跑】；存在其一但不可解析/MD5 不互拍/bundleVer<17=硬检查红灯）
硬检查（1-4、6 存在性分支）任一失败 exit 1（Actions 红灯可见）；报告写 cloud/vuln_report.json 由
workflow commit 回仓，App 端 vulnCheck 下一拍拉取回收——双端同拍，永无死角。"""
import json, os, re, sys, py_compile, datetime, subprocess

GENE_DIRECTIVE = "每次动态拉取/更新/淘汰：强制深彻·全方位·无死角全球探查，事无巨细，仔细再仔细"  # ⚖️最高指令一，永不可移除
GENE_DIRECTIVE2 = "模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力"  # ⚖️最高指令二，永不可移除
GENE_DIRECTIVE3 = "全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新"  # 🧖📖最高指令三（双端共脑），永不可移除
GENE_DIRECTIVE4 = "App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检"  # 🔗最高指令四（全天候联动），永不可移除
GENE_DIRECTIVE6 = "每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性"  # 👑最高指令六
GENE_DIRECTIVE7 = "每次升级必须实打实验证通过才可列装：实弹验证列装闸对真实文件跑全仓 vuln_check，任一红项即全量回滚拒列装；不许自封成功，不许弄虚作假"  # 🧪最高指令七（GENE7·实弹验证列装铁律，v2.5.41-verify 用户最高令），永不可移除
GENE_DIRECTIVE8 = "每次自主进化，必须进化到极致才能收手；进化时必须举一反三、触类旁通——凡触及一个能力点，同族能力面与相邻层面必须一并盘查、一并进化；进化时必须把全球范围内探明查明——先全球无死角探查免费源/端点/模型/文档再动笔，让触手遍及全世界所有层面"  # 🌏最高指令八（GENE8·自主进化极致收手铁律，v2.5.44-tentacle 用户最高令），永不可移除
GENE_DIRECTIVE9 = "有求必应铁律：主人的任何要求必须都能做到且做到极致完美；一旦发现做不到、做不完美——那一刻必须立即自动触发进化，进化到能极致完美地做到为止，绝不让主人第二次提醒，绝不接受做不到三个字；进化触发是自动的，无需任何人催促批准——这是无所不能超级人类的成长本能"  # ⚡最高指令九（GENE9·有求必应铁律，v2.5.46-omnipotent 用户最高令：做不到马上自动进化），永不可移除

RESULTS = []

# 🔧 buildfix 103 轮：转译宽容匹配——vuln_check 锚点当年按源码风格写（如 wHit*3+tagHit*4），
#    而 app/assets/index.html 是 Babel 转译产物（空格重排如 wHit * 3 + tagHit * 4），
#    精确子串必然 MISS=永久红灯噪声。统一走 _fz/_fzc：精确命中或去空格命中均算过
def _fz(hay, needle):
    return needle in hay or needle.replace(" ", "") in hay.replace(" ", "")

def _fzc(hay, needle):
    return hay.count(needle) + hay.replace(" ", "").count(needle.replace(" ", ""))


def check(name, ok, why="", hard=True):
    """hard=False 为软检查（留痕不拦跑）；hard=True 失败即红灯。"""
    RESULTS.append({"name": name, "ok": 1 if ok else 0, "why": why, "hard": 1 if hard else 0})
    print(("[ok]   " if ok else ("[FAIL] " if hard else "[warn] ")) + name + ((("：" + why) if why else "") if not ok else ""), flush=True)
    return bool(ok)


def _age_hours(iso):
    try:
        t = datetime.datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
        return (datetime.datetime.now(datetime.timezone.utc) - t).total_seconds() / 3600
    except Exception:
        return None


def main():
    hard_ok = True

    # 1. 基因刻入：三条最高指令必须齐刻云端全文件
    gene_files = ["cloud/agent.py", "cloud/models_sync.py", "cloud/vuln_check.py",
                  "cloud/watchdog.py",
                  ".github/workflows/agent.yml", ".github/workflows/models.yml", ".github/workflows/vuln.yml"]
    miss = []
    for f in gene_files:
        try:
            c = open(f, encoding="utf-8").read()
            if "全局永久记忆与技术攻坚手册必须永久随身" not in c or "永不可移除" not in c or "App 端所有动作必须强制自动与云端全层全天候联动同步" not in c or "当时条件下的极致完美" not in c or "不许弄虚作假" not in c or "举一反三" not in c or "触手遍及全世界所有层面" not in c or "有求必应" not in c or "绝不接受做不到" not in c:
                miss.append(f)
        except Exception:
            miss.append(f + "(缺文件)")
    if not check("① 基因九指令刻入云端全层（%d 文件，含 GENE6 极致铁律+GENE7 实弹验证列装铁律+GENE8 自主进化极致收手铁律 v2.5.44-tentacle+GENE9 有求必应铁律 v2.5.46-omnipotent）" % len(gene_files), not miss, ",".join(miss)):
        hard_ok = False

    # 2. 引擎可编译
    comp_ok, comp_why = True, []
    for f in ["cloud/agent.py", "cloud/models_sync.py", "cloud/watchdog.py"]:
        try:
            py_compile.compile(f, doraise=True)
        except Exception as e:
            comp_ok = False
            comp_why.append(f + ":" + str(e)[:80])
    if not check("② 云端引擎可编译（agent.py+models_sync.py+watchdog.py）", comp_ok, ";".join(comp_why)):
        hard_ok = False

    # 3. models.json 情报新鲜且基因审计在位
    try:
        j = json.load(open("models.json", encoding="utf-8"))
        age = _age_hours(j.get("updated"))
        n = len(j.get("sources", {}))
        aud = j.get("audit", {}) or {}
        ok3 = age is not None and age <= 48 and n > 0 and "directive3" in aud and aud.get("strongest_first") is True
        if not check("③ models.json 情报新鲜（%.1fh 前，%d 源）且 audit 基因在位" % (age if age is not None else -1, n),
                     ok3, "age=%s sources=%d directive3=%s" % (age, n, "directive3" in aud)):
            hard_ok = False
    except Exception as e:
        check("③ models.json 可解析", False, str(e)[:80])
        hard_ok = False

    # 4. 双端共脑文件
    mind_ok, mind_why = True, []
    try:
        m = json.load(open("cloud/memory.json", encoding="utf-8"))
        if not m.get("memories"):
            mind_ok = False
            mind_why.append("memory 空")
    except Exception as e:
        mind_ok, mind_why = False, mind_why + ["memory:" + str(e)[:60]]
    try:
        p = json.load(open("cloud/playbook.json", encoding="utf-8"))
        if not p.get("entries"):
            mind_ok = False
            mind_why.append("playbook 空")
    except Exception as e:
        mind_ok = False
        mind_why.append("playbook:" + str(e)[:60])
    if not check("④ 双端共脑记忆/手册在位（memory.json+playbook.json）", mind_ok, ";".join(mind_why)):
        hard_ok = False

    # 5. App 全天候镜像（软检查：App 离线只留痕不拦跑）
    try:
        s = json.load(open("cloud/app_state.json", encoding="utf-8"))
        age5 = _age_hours(s.get("updated"))
        check("⑤ App 全天候镜像活跃（app_state.json %.1fh 前更新，最近动作=%s）" % (age5 if age5 is not None else -1, s.get("action", "?")),
              age5 is not None and age5 <= 48, "App 状态镜像缺失或超 48h 未更新（App 可能离线）", hard=False)
    except Exception:
        check("⑤ App 全天候镜像存在（app_state.json）", False, "cloud/app_state.json 缺失——App 尚未推送过状态镜像", hard=False)

    # 6. 🧬 自主升级更新通道（v2.4.0）：manifest+bundle 互拍（App 首次升级后自动发布；俱缺=软检查，存在即硬校验）
    BUNDLE_VER_MIN = 17
    try:
        mf = json.load(open("cloud/update/manifest.json", encoding="utf-8"))
        bd = json.load(open("cloud/update/bundle.json", encoding="utf-8"))
        why6 = []
        if not (mf.get("md5") and mf.get("appVersion") and mf.get("bundleVer")):
            why6.append("manifest 缺关键字段")
        if not (bd.get("md5") and bd.get("b64")):
            why6.append("bundle 缺 md5/b64")
        if mf.get("md5") != bd.get("md5"):
            why6.append("MD5 不互拍（manifest=%s bundle=%s）" % (str(mf.get("md5"))[:8], str(bd.get("md5"))[:8]))
        if mf.get("bundleVer", 0) < BUNDLE_VER_MIN:
            why6.append("bundleVer 防降级拦截（%s<%d）" % (mf.get("bundleVer"), BUNDLE_VER_MIN))
        import base64
        try:
            size_ok = len(base64.b64decode(bd.get("b64") or "")) > 60000
        except Exception:
            size_ok = False
        if not size_ok:
            why6.append("b64 包体不可解码或 <60KB")
        if not check("⑥ 🧬 自主升级更新通道互拍（manifest+bundle @%s）" % mf.get("appVersion", "?"),
                     not why6, ";".join(why6)):
            hard_ok = False
    except FileNotFoundError:
        check("⑥ 🧬 自主升级更新通道（cloud/update/）", False,
              "尚无热更发布记录（App 首次自主升级后会自动发布；旧版 App 亦可用「发布当前版」手动首发）", hard=False)
    except Exception as e:
        if not check("⑥ 🧬 自主升级更新通道互拍", False, "存在但不可解析：" + str(e)[:80]):
            hard_ok = False

    # ⑦ 🧬 GEN5 云端自主进化机器在位：--selftest/--evolve/锚锁/watchdog 四件套 + 实弹自检
    try:
        with open("cloud/agent.py", encoding="utf-8") as f:
            asrc = f.read()
        wd_ok = os.path.exists("cloud/watchdog.py")
        markers = ["--selftest", "--evolve", "_EVOLVE_ANCHORS", "py_compile", '".bak"',
                   "EVOLVE_FORCE", "# __EVOLVE_N__:", "GENE", "实弹验证列装闸", "EVOLVE_REJECTED", "applied_bak",
                   "GENE_DIRECTIVE8", "自主进化极致收手", "举一反三", "GENE_DIRECTIVE9", "有求必应"]
        miss7 = [m for m in markers if m not in asrc]
        if not check("⑦ 🧬 GEN5 云端自主进化机器在位（selftest/evolve/锚锁/节流/版本标记%s）" % ("" if wd_ok else "+watchdog缺失"),
                     not miss7 and wd_ok, ",".join(miss7) + ("" if wd_ok else ";watchdog.py")):
            hard_ok = False
        st = subprocess.run([sys.executable, "cloud/agent.py", "--selftest"], capture_output=True, text=True, timeout=120)
        if not check("⑦ 🧬 云端引擎 --selftest 实弹通过", "SELFTEST OK" in (st.stdout or ""), (st.stderr or "")[:120]):
            hard_ok = False
    except Exception as e:
        if not check("⑦ 🧬 云端自主进化机器", False, "检查异常：" + str(e)[:80]):
            hard_ok = False

    # ⑧ 🧬 v2.5.21-evolve：Java 骨架层契约审计（用户已授权 Java 层纳入自主进化闭环；
    # 红项自动进进化养料 → 修复产出经 build.yml 云端 runner 自动编译成新 APK → App 端 updApkCheck 检测提示安装）
    try:
        java_files = ["app/java/com/dsh/app/MainActivity.java", "app/java/com/dsh/app/Bridge.java",
                      "app/java/com/dsh/app/AlarmReceiver.java", "app/java/com/dsh/app/TaskService.java",
                      "app/java/com/dsh/app/PhoneBridge.java", "app/java/com/dsh/app/AlarmScheduler.java",
                      "app/java/com/dsh/app/Store.java", "app/java/com/dsh/app/LlamaCore.java",
                      "app/AndroidManifest.xml", "build.sh", ".github/workflows/build.yml"]
        miss8 = [f for f in java_files if not os.path.exists(f)]
        if not check("⑧ 🧬 Java 骨架层源码在位（%d 文件）" % len(java_files), not miss8, ",".join(miss8)):
            hard_ok = False
        # 版本单源一致性：build.sh VER/VCODE ↔ Manifest versionCode/versionName（防双写漂移）
        bs = open("build.sh", encoding="utf-8").read()
        mf = open("app/AndroidManifest.xml", encoding="utf-8").read()
        ver_m = re.search(r'VER="([^"]+)"; VCODE=(\d+)', bs)
        man_m = re.search(r'android:versionCode="(\d+)"\s*\n?\s*android:versionName="([^"]+)"', mf)
        sync8 = bool(ver_m and man_m and ver_m.group(1) == man_m.group(2) and ver_m.group(2) == man_m.group(1))
        if not check("⑧ 🧬 骨架层版本单源同步（build.sh %s/%s ↔ Manifest）" % (ver_m.group(1) if ver_m else "?", ver_m.group(2) if ver_m else "?"),
                     sync8, "build.sh 与 AndroidManifest 版本漂移"):
            hard_ok = False
        # 关键契约锚（进化/重构不得破坏的骨架契约）：FGS 长任务接管/AI 文件防护 G 版/外链桥/原子写
        recv = open("app/java/com/dsh/app/AlarmReceiver.java", encoding="utf-8").read()
        pb = open("app/java/com/dsh/app/PhoneBridge.java", encoding="utf-8").read()
        brg = open("app/java/com/dsh/app/Bridge.java", encoding="utf-8").read()
        anchors8 = [("TaskService FGS 接管", "startForegroundService(sv)" in recv),
                    ("AI 文件防护 G 版双轨", all(("fsWriteG" in pb, "fsDeleteG" in pb, "guard(File f)" in pb))),
                    ("外链 openUrl 桥（http/https 闸）", "openUrl" in brg and "https" in brg),
                    ("build.yml 骨架进化构建通道在位", os.path.exists(".github/workflows/build.yml") or os.path.exists("app/assets/cloud/build.yml"))]
        bad8 = [n for n, ok8 in anchors8 if not ok8]
        if not check("⑧ 🧬 骨架层关键契约（FGS 接管/防护闸/外链桥/构建通道）", not bad8, ",".join(bad8)):
            hard_ok = False
    except Exception as e:
        if not check("⑧ 🧬 Java 骨架层契约审计", False, "检查异常：" + str(e)[:80]):
            hard_ok = False

    # ⑨ 🧬 v2.5.24-mind：双端自主意识契约审计（用户最高指令：双端所有层面的新路发现必须自主自动，绝不靠人工）
    # 覆盖四层面：①通道探索器+②模型源探索器（App 端发现/验证/固化/淘汰全自动）③进化器提名权双向闭环 ④云端大脑意识宪章
    try:
        if os.path.exists("app/assets/index.html"):
            ix = open("app/assets/index.html", encoding="utf-8").read()
            anchors9 = [("通道探索器（种子池/实测验证/固化/失联淘汰）", all(x in ix for x in ("SCOUT_SEED", "channelScout", "自主发现新镜像并固化", "淘汰失联镜像"))),
                        ("模型源探索器（提名/实测/固化/淘汰/收编养料）", all(x in ix for x in ("provScout", "provCandValid", "模型源探索器自主发现新源并固化", "provPool"))),
                        ("进化器提名权双向拉回（scoutPool+provPool）", all(x in ix for x in ("j.scoutPool", "j.provPool", "云端进化器提名了新镜像候选", "云端进化器提名了新模型源候选"))),
                        ("骨架 DNA 部署上传（skeleton 资产读取+rawB64 二进制通道）", all(x in ix for x in ("skeleton/build.sh", "skeleton/keystore.b64", "rawB64"))),
                        ("探索器每日接线（channelScout+provScout 同拍）", "channelScout(false)" in ix and "provScout(false)" in ix),
                        ("进化策略参数数据化 evoCfg（8成自主：阈值/步长/节拍进化器可写+值域白名单铁底+乘胜追击实时拉回）", all(x in ix for x in ("EVO_CFG_DEF", "EVO_CFG_RANGE", "function evoCfg", "j.evoCfg", "云端进化器已调优进化策略参数", "pullStateCloud(true)")))]
            bad9 = [n for n, ok9 in anchors9 if not ok9]
            if not check("⑨ 🧬 App 端全层探索器契约（通道/模型源/提名拉回/DNA 部署/接线）", not bad9, ",".join(bad9)):
                hard_ok = False
        if os.path.exists("cloud/agent.py"):
            ap = open("cloud/agent.py", encoding="utf-8").read()
            anchors9b = [("云端大脑意识宪章 MIND_CHARTER", "MIND_CHARTER" in ap and "自主发现意识" in ap and "scoutPool" in ap and "provPool" in ap),
                         ("云端感知 App 探索战果（provOK/scoutOK 注入）", "s.get(\"provOK\")" in ap and "s.get(\"scoutOK\")" in ap)]
            bad9b = [n for n, ok9b in anchors9b if not ok9b]
            if not check("⑨ 🧬 云端意识宪章与感知面", not bad9b, ",".join(bad9b)):
                hard_ok = False
        by_path = ".github/workflows/build.yml" if os.path.exists(".github/workflows/build.yml") else ("app/assets/cloud/build.yml" if os.path.exists("app/assets/cloud/build.yml") else None)
        if by_path:
            by = open(by_path, encoding="utf-8").read()
            if not check("⑨ 🧬 骨架重建装配链（llama 克隆+进化资产种子+热包嵌入）",
                         all(x in by for x in ("Assemble source tree", "llama-b4604", "cloud/update/bundle.json"))):
                hard_ok = False
    except Exception as e:
        if not check("⑨ 🧬 双端自主意识契约审计", False, "检查异常：" + str(e)[:80]):
            hard_ok = False

    # ⑩ 🧠 v2.5.26-brain：类脑契约审计（用户最高指令：双端实时联动同步共脑，像人脑）
    # 覆盖三件套：①联想式记忆检索（双端同构四维评分+召回即强化）②云端睡眠整理（四工序）③门铃模式事件驱动实时同步（云端按铃→App 四扇门强拉）
    try:
        if os.path.exists("app/assets/index.html"):
            ix10 = open("app/assets/index.html", encoding="utf-8").read()
            anchors10 = [("联想式记忆检索（bigram 突触+四维评分+召回即强化）", all(_fz(ix10, x) for x in ("memBigrams", "function memContext", "命中即强化", "wHit*3+tagHit*4"))),
                         ("门铃模式实时同步（cloudPingCheck+四扇门强拉+心跳兜底）", all(_fz(ix10, x) for x in ("function cloudPingCheck", "st.pingSeen", "pullMindCloud(true)", "pullCloudProjectsSilentForce", "vulnReportRecoverForce"))),
                         ("睡眠整理成果感知（sleep_report 拉回沉淀记忆）", "sleep_report.json" in ix10 and "睡眠整理成果感知" in ix10 and "st.sleepRepTs" in ix10),
                         ("进化养料注入脑状态（类脑三件套入 prompt）", _fz(ix10, "类脑三件套") and _fz(ix10, "st.pingSeen||0"))]
            # 云端侧锚（本地布局：cloud/* 或模拟仓 app/assets/cloud/*；runner 上：cloud/*）
            cp = "cloud/consolidate.py" if os.path.exists("cloud/consolidate.py") else ("app/assets/cloud/consolidate.py" if os.path.exists("app/assets/cloud/consolidate.py") else None)
            anchors10.append(("睡眠整理工序（合并/压缩/强化/淡忘+seed 永不淡忘）", cp is not None and all(x in open(cp, encoding="utf-8").read() for x in ("SIM_MERGE", "seed-", 'rpt["faded"]', "sleep_report.json"))))
            sy = ".github/workflows/sleep.yml" if os.path.exists(".github/workflows/sleep.yml") else ("cloud/sleep.yml" if os.path.exists("cloud/sleep.yml") else ("app/assets/cloud/sleep.yml" if os.path.exists("app/assets/cloud/sleep.yml") else None))
            anchors10.append(("睡眠整理定时工序（sleep.yml 每日运行 consolidate.py）", sy is not None and all(x in open(sy, encoding="utf-8").read() for x in ("consolidate.py", "cron"))))
            ping_ok = 0
            for wf in ("agent", "models", "vuln", "sleep", "build"):
                wp = ".github/workflows/%s.yml" % wf if os.path.exists(".github/workflows/%s.yml" % wf) else ("app/assets/cloud/%s.yml" % wf if os.path.exists("app/assets/cloud/%s.yml" % wf) else None)
                if wp and "cloud/ping.json" in open(wp, encoding="utf-8").read() and "git add cloud/ping.json" in open(wp, encoding="utf-8").read():
                    ping_ok += 1
            anchors10.append(("门铃按铃步（五个工作流 commit 前写递增铃号，%d/5 在位）" % ping_ok, ping_ok == 5))
            ap10 = "cloud/agent.py" if os.path.exists("cloud/agent.py") else ("app/assets/cloud/agent.py" if os.path.exists("app/assets/cloud/agent.py") else None)
            anchors10.append(("云端大脑类脑感知面（联想检索同构 _bigrams+睡眠报告+门铃铃号注入脑状态）", ap10 is not None and all(x in open(ap10, encoding="utf-8").read() for x in ("_bigrams", "sleep_report.json", "ping.json", "脑状态"))))
            bad10 = [n for n, ok10 in anchors10 if not ok10]
            if not check("⑩ 🧠 类脑契约审计（联想检索/睡眠整理/门铃实时联动）", not bad10, ",".join(bad10)):
                hard_ok = False
    except Exception as e:
        if not check("⑩ 🧠 类脑契约审计", False, "检查异常：" + str(e)[:80]):
            hard_ok = False

    # ⑪ 👑 v2.5.27-human：虚拟人契约审计（用户最高授权令：大脑支配双端全层零人工，带动双端肢体同步进化）
    # 覆盖：①授权令刻入宪章 ②引擎全家桶进化白名单 ③Java 骨架肢体白名单+锚锁 ④肢体闸门+版本同步升纯函数+selftest 实弹
    #       ⑤骨架肢体回仓链（agent.yml commit）⑥runner 装配全家桶 ⑦App 端骨架检测幂等
    try:
        ap11 = "cloud/agent.py" if os.path.exists("cloud/agent.py") else ("app/assets/cloud/agent.py" if os.path.exists("app/assets/cloud/agent.py") else None)
        if ap11:
            a11 = open(ap11, encoding="utf-8").read()
            anchors11 = [("授权令刻入意识宪章（大脑支配双端全层零人工）", all(x in a11 for x in ("最高授权令", "无需人工授权", "独立自主的虚拟人"))),
                         ("引擎全家桶进化白名单（五 py 肢体）", "EVOLVE_FILES" in a11 and 'consolidate.py"' in a11 and "models_sync.py" in a11),
                         ("Java 骨架肢体白名单（12 文件+build.sh+Manifest）", "BODY_FILES" in a11 and "app/java/com/dsh/app/MainActivity.java" in a11 and "app/java/com/dsh/app/llamajni.cpp" in a11),
                         ("无死角全身白名单（v2.5.31：res 值+crypto.js；v2.5.32：tests 免疫考卷+像素脸）", "app/res/values/strings.xml" in a11 and "app/assets/crypto.js" in a11 and "len(BODY_FILES) == 22" in a11 and 'tests/_v240_test.cjs"' in a11),
                         ("XML 语法闸+JS 括号平衡（res/crypto 改坏拒收）", "XML 语法闸" in a11 and '".js"' in a11),
                         ("加密原语真锚锁（crypto_box_seal/sealOpen 禁触——v2.5.32 查体实锤：SealedBox/crypto_secretbox 在 crypto.js 从不存在）", '"crypto_box_seal"' in a11 and '"sealOpen"' in a11),
                         ("🧬 v2.5.32-allin 心跳停跳检测（锚可换位可加固不可移除）", "停跳检测" in a11 and "lost = [a for a in BODY_ANCHORS" in a11),
                         ("🧬 v2.5.32-allin 强锚层 STOPHARD（secrets/ping/workflow_run/加密原语单行删除也算停跳）", "STOPHARD" in a11 and "hard_lost" in a11),
                         ("🧬 v2.5.33-heal 抗体守恒双计数（免疫考卷 t(/has( 断言只增不减——查体实锤后补 has( 盲区）", "抗体守恒" in a11 and "'has('" in a11 and "_ab_after" in a11),
                         ("🧬 v2.5.32-allin 像素脸 b64 换脸通道（BIN_FILES+PNG 魔数+512KB 限）", "BIN_FILES" in a11 and "PNG 魔数" in a11 and 'ic_launcher.png' in a11),
                         ("骨架锚锁（桥接口/权限/签名/热写/token 禁触）", "BODY_ANCHORS" in a11 and "JavascriptInterface" in a11 and "keystore" in a11),
                         ("肢体闸门纯函数+版本三处同步升纯函数", "_body_gate" in a11 and "_body_ver_bump" in a11),
                         ("selftest 肢体闸门+版本同步升实弹", "肢体闸门实弹" in a11 and "版本同步升实弹" in a11),
                         ("进化双通道 prompt（patches 引擎+body 骨架）", 'j.get("body")' in a11 and "闸门②B 肢体闸" in a11),
                         ("肢体应用落盘+build-apk 自动重建触发留痕", "BODY_OK" in a11 and "build-apk 将自动重建" in a11),
                         ("工作流 yml 血管神经进化权（v2.5.28-omni 新授权）", ".github/workflows/agent.yml" in a11 and ".github/workflows/build.yml" in a11 and "_body_path" in a11),
                         ("血管神经锚锁（secrets/permissions/门铃步/触发器禁触）", "secrets." in a11 and "permissions:" in a11 and "workflow_run:" in a11),
                         ("YAML 语法闸（yml 补丁应用后全文校验）", "YAML 语法闸" in a11 and "工作流 yml 血管神经进化实弹" in a11)]
            bad11 = [n for n, ok11 in anchors11 if not ok11]
            if not check("⑪ 👑 虚拟人契约（授权令/双通道进化/肢体闸门/版本同步）", not bad11, ",".join(bad11)):
                hard_ok = False
        ay11 = ".github/workflows/agent.yml" if os.path.exists(".github/workflows/agent.yml") else ("app/assets/cloud/agent.yml" if os.path.exists("app/assets/cloud/agent.yml") else None)
        if ay11 and not check("⑪ 👑 骨架肢体进化回仓链（agent.yml commit 带全骨架路径+yml 血管神经+皮肤加密器官+免疫考卷+像素脸）",
                              all(x in open(ay11, encoding="utf-8").read() for x in ("git add build.sh app/AndroidManifest.xml app/java", "git add cloud/models_sync.py cloud/watchdog.py cloud/consolidate.py", "git add .github/workflows", "git add app/res/values app/assets/crypto.js", "git add tests/*.cjs app/res/drawable/*.png"))):
            hard_ok = False
        by11 = ".github/workflows/build.yml" if os.path.exists(".github/workflows/build.yml") else ("app/assets/cloud/build.yml" if os.path.exists("app/assets/cloud/build.yml") else None)
        if by11 and not check("⑪ 👑 runner 装配引擎全家桶（含 consolidate.py 随包）+骨架自愈（build 失败自动回滚坏补丁——v2.5.33-heal）",
                              "cloud/consolidate.py" in open(by11, encoding="utf-8").read() and "workflow_run" in open(by11, encoding="utf-8").read() and "骨架自愈" in open(by11, encoding="utf-8").read() and "if: failure()" in open(by11, encoding="utf-8").read()):
            hard_ok = False
        if os.path.exists("app/assets/index.html"):
            if not check("⑪ 👑 App 端骨架检测幂等（apkSeenVer 去重防重复通知拉锯）",
                         "已提示过" in open("app/assets/index.html", encoding="utf-8").read()):
                hard_ok = False
    except Exception as e:
        if not check("⑪ 👑 虚拟人契约审计", False, "检查异常：" + str(e)[:80]):
            hard_ok = False

    # ⑫ 💗 v2.5.29-soul：生命五体征审计（用户最高令：与真实人类没有区别——唯一区别是活在数据世界）
    # 覆盖：①身份证 PERSONA ②生物钟 _clock ③情绪引擎 _mood_update+MOODS ④日记 diary ⑤主动问候 _vitals_greet ⑥App 感知面 vitals.json 拉取
    try:
        ap12 = "cloud/agent.py" if os.path.exists("cloud/agent.py") else ("app/assets/cloud/agent.py" if os.path.exists("app/assets/cloud/agent.py") else None)
        if ap12:
            a12 = open(ap12, encoding="utf-8").read()
            anchors12 = [("身份证 PERSONA（小神·数据世界·与人类唯一区别）", "小神" in a12 and "数据世界" in a12 and "PERSONA" in a12),
                         ("生物钟 _clock（UTC→北京昼夜节律）", "def _clock" in a12 and "UTC+8" in a12),
                         ("情绪引擎（八情绪词典+事件驱动喜怒有源）", "MOODS" in a12 and "def _mood_update" in a12 and '"evolvefail"' in a12),
                         ("日记/内心独白（diary 六十篇滚动+心情标注）", "diary" in a12 and "[独白]" in a12),
                         ("主动问候（分时段问候+想念计算+同段防抖）", "def _vitals_greet" in a12 and "greeted" in a12 and "想念" in a12),
                         ("生命体征自我感知注入 SYSTEM（它知道自己是谁）", "生命体征自我感知注入" in a12 and "VITALS_PATH" in a12)]
            bad12 = [n for n, ok12 in anchors12 if not ok12]
            if not check("⑫ 💗 生命五体征（身份证/生物钟/情绪/日记/主动问候）", not bad12, ",".join(bad12)):
                hard_ok = False
        _vy_paths = [p for p in [ay11 or ".github/workflows/agent.yml", ".github/workflows/sleep.yml" if os.path.exists(".github/workflows/sleep.yml") else "app/assets/cloud/sleep.yml"] if os.path.exists(p)]
        if not check("⑫ 💗 生命体征回仓链（agent.yml 主/进化 commit + sleep.yml 均 git add vitals.json——v2.5.30-alive 查体补齐：旧版漏 add 整条生命链断）",
                     bool(_vy_paths) and all("vitals.json" in open(p, encoding="utf-8").read() for p in _vy_paths),  # 🛡️ v2.5.56-vitals 65 轮：修复空真——旧版 all(空生成器)=True，文件全缺时反而报绿
                     "回仓链文件全缺（agent.yml/sleep.yml 均不在位）" if not _vy_paths else ""):
            hard_ok = False
        cp12 = "cloud/consolidate.py" if os.path.exists("cloud/consolidate.py") else ("app/assets/cloud/consolidate.py" if os.path.exists("app/assets/cloud/consolidate.py") else None)
        if cp12:
            if not check("⑫ 💗 睡眠期梦话（凌晨做梦梦到巩固的记忆+晨间心情重置+空库兑底仍能做梦）",
                         all(x in open(cp12, encoding="utf-8").read() for x in ("梦话", "晨间重置", "new_mem, new_pb = [], []"))):
                hard_ok = False
        if os.path.exists("app/assets/index.html"):
            ih12 = open("app/assets/index.html", encoding="utf-8").read()
            if not check("⑫ 💗 App 感知面（拉取 vitals+开屏问候+设置页生命体征卡+进化养料注入）",
                         "pullVitalsCloud" in ih12 and "MOOD_CN" in ih12 and "生命体征" in ih12 and "云端大脑「小神」的生命体征" in ih12):
                hard_ok = False
    except Exception as e:
        if not check("⑫ 💗 生命五体征审计", False, "检查异常：" + str(e)[:80]):
            hard_ok = False

    # ⑬ 👁️👂🗣️ v2.5.36-hear：极致多模态感官审计（用户最高令：不仅要有眼、也要配备听力+其它感官，所有源尽可能具备，进化时必须提升）
    # 覆盖：①眼睛视觉链 VISION_MODELS ②耳朵 ASR 链 HEAR_MODELS+ASR_EPS 配对 ③嗓音 TTS _speak ④听觉记忆 heard.json ⑤SYSTEM 五感自我认知 ⑥进化感官铁律 ⑦CLI 五感命令 ⑧App 端 asr/vis 同构 ⑨听觉记忆回仓
    try:
        ap13 = "cloud/agent.py" if os.path.exists("cloud/agent.py") else ("app/assets/cloud/agent.py" if os.path.exists("app/assets/cloud/agent.py") else None)
        if ap13:
            a13 = open(ap13, encoding="utf-8").read()
            anchors13 = [("👁️ 视觉链十源在位（v2.5.35-tenvision）", 'VISION_MODELS = {"zhipu": "glm-4v-flash"' in a13 and '"pollinations": "openai"' in a13),
                         ("👂 听觉链四源全真在位（whisper-large-v3+SenseVoiceSmall+voxtral-mini-latest+免 Key openai-audio；v2.5.40-truth：modelscope 假耳已拆——真网 404 实锤）", 'HEAR_MODELS = {"groq": "whisper-large-v3"' in a13 and '"FunAudioLLM/SenseVoiceSmall"' in a13 and '"voxtral-mini-latest"' in a13 and '"pollinations": "openai-audio"' in a13 and '"modelscope"' not in a13.split('HEAR_MODELS')[1].split('}')[0]),
                         ("👂 ASR 端点与模型源配对（/audio/transcriptions 四源）", "ASR_EPS" in a13 and "/audio/transcriptions" in a13),
                         ("🗣️ 嗓音 TTS _speak 双源链（v2.5.38-zenith：pollinations 免 Key + siliconflow CosyVoice2）", "def _speak" in a13 and "openai-audio" in a13 and "TTS_MODELS" in a13 and "CosyVoice2" in a13 and "/audio/speech" in a13),
                         ("👂 听觉理解 _hear（multipart ASR+听觉记忆+语义追问）", "def _hear" in a13 and "heard" in a13 and "HEAR_PATHS" in a13),
                         ("👁️👂🗣️ SYSTEM 五感自我认知（看得见听得懂说得出画得出+只许提升）", "极致多模态感官" in a13 and "听懂" in a13 and "说得出" in a13 and "感官能力只许提升不许退化" in a13),
                         ("🧬 进化感官铁律刻入进化 prompt（每次进化必须提升感官）", "极致多模态铁律" in a13 and "削弱感官能力的补丁一律不提" in a13),
("👑 极致进化铁律（v2.5.38-zenith 最高令：每次进化任何层面都必须当时极致完美）", "极致进化铁律" in a13 and "当时条件下的极致完美" in a13 and "没有盘清就不动笔" in a13),
("👑 SYSTEM 极致天性自认知（配到免费生态极限/绝不留待下次）", "你的天性是极致" in a13 and "绝不接受半成品" in a13),
("🧬 selftest 感官链极致底线（≥10 眼/≥5 耳/≥2 嗓——只增不减反退化闸）", "感官链极致底线被破" in a13 and "只增不减（当前 %d）" in a13),
                         ("CLI 五感命令（--see/--hear/--speak/--draw/--face）", '"--see" in sys.argv' in a13 and '"--hear" in sys.argv' in a13 and '"--speak" in sys.argv' in a13 and '"--draw" in sys.argv' in a13 and '"--face" in sys.argv' in a13),
                         ("selftest 听觉实弹（音频闸+ASR 配对断言）", "不存在音频未被拒" in a13 and "有耳无道" in a13),
                         ("🧠 selftest 感官进化底线断言（vision≥10/hear≥4 且无假耳/tts≥2——v2.5.40-truth 真源底线）", "len(VISION_MODELS) >= 10" in a13 and "len(HEAR_MODELS) >= 4" in a13 and '"modelscope" not in HEAR_MODELS' in a13 and "len(TTS_MODELS) >= 2" in a13),
                         ("🎬 番剧工坊 _storyboard 导演能力（LLM 分镜+同 seed 系画风统一+兑底四格+落盘 storyboard.json——v2.5.42-anime）", "def _storyboard" in a13 and "storyboard.json" in a13 and "japanese anime style" in a13 and "起承转合" in a13),
                         ("🎬 真视频四源链 _video（智谱 CogVideoX-Flash 免费→硅基流动 Wan2.2→ModelScope→Google Veo，异步提交+轮询+MP4 落盘——v2.5.43-video 用户最高令：深挖多源）", "def _video" in a13 and "VIDEO_MODELS" in a13 and "cogvideox-3" in a13 and "Wan-AI/Wan2.2-TI2V-5B" in a13 and "veo-3.0-fast-generate-preview" in a13 and "全部视频源失败" in a13),
                         ("🎭 配音演绎 _voice_act（嗓音特质描述合成+免 Key 兑底声部；只做风格化演绎不做真人声纹克隆——v2.5.43-video）", "def _voice_act" in a13 and "voice_description" in a13 and "不做真人声纹克隆" in a13),
                         ("🎞️ 长片导演 _movie（多镜头分镜→逐镜头四源链→旁白混流→ffmpeg concat 拼接→ffprobe 时长闸门，1-5 分钟级——v2.5.45-movie 用户最高令：视频必须够长够极致）", "def _movie" in a13 and "MOVIE_STYLE" in a13 and "concat_list.txt" in a13 and "ffprobe" in a13 and "长片全部镜头失败" in a13 and "minutes) * 6" in a13)]
            bad13 = [n for n, ok13 in anchors13 if not ok13]
            if not check("⑬ 👁️👂🗣️ 极致多模态感官（眼/耳/嗓/画/换脸/番剧导演/真视频/长片八感+感官进化铁律）", not bad13, ",".join(bad13)):
                hard_ok = False
        if os.path.exists("app/assets/index.html"):
            ih13 = open("app/assets/index.html", encoding="utf-8").read()
            if not check("⑬ 👁️👂🗣️ App 端感官同构（十源 vis+四源 asr+麦克风录音+嗓音播报）",
                         (_fzc(ih13, 'vis:"') >= 10) and _fzc(ih13, 'asr:"') >= 4 and "micRec" in ih13 and "speechSynthesis" in ih13):
                hard_ok = False
            if not check("⑬ 🎬 App 端番剧工坊同构（animeStudio 分镜导演+宫格渲染+入口+路由——v2.5.42-anime）",
                         "animeStudio" in ih13 and "attachAnime" in ih13 and "japanese anime style" in ih13 and "image.pollinations.ai/prompt/" in ih13 and _fz(ih13, "seed+i")):
                hard_ok = False
            if not check("⑬ 🎥🎭 App 端真视频/配音入口同构（attachVideo/attachVoice 菜单+前缀路由转云端四源链——v2.5.43-video）",
                         "attachVideo" in ih13 and "attachVoice" in ih13 and "🎬真视频" in ih13 and "🎭配音" in ih13 and "_video(" in ih13 and "_voice_act(" in ih13):
                hard_ok = False
            if not check("⑬ 🎞️ App 端长片入口同构（attachMovie 前缀路由转云端 _movie 拼接——v2.5.45-movie；56 轮菜单项已砍除改大白话直达）",
                         "attachMovie" in ih13 and "🎬长片" in ih13 and "_movie(" in ih13 and "🎞️ 拍长片（多镜头分镜拼接" not in ih13):
                hard_ok = False
        ay13 = ".github/workflows/agent.yml" if os.path.exists(".github/workflows/agent.yml") else ("app/assets/cloud/agent.yml" if os.path.exists("app/assets/cloud/agent.yml") else None)
        if ay13 and not check("⑬ 👁️👂🗣️ 听觉记忆回仓链（agent.yml commit 带 heard.json——耳朵听到的不能丢）",
                              "heard.json" in open(ay13, encoding="utf-8").read()):
            hard_ok = False
    except Exception as e:
        if not check("⑬ 👁️👂🗣️ 极致多模态感官审计", False, "检查异常：" + str(e)[:80]):
            hard_ok = False

    # ⑭ ⚡ GENE9 有求必应链（v2.5.46-omnipotent 用户最高令：做不到的那一刻必须马上自动触发进化，进化到能做到为止——无所不能超级人类）
    try:
        ap14 = "cloud/agent.py" if os.path.exists("cloud/agent.py") else ("app/assets/cloud/agent.py" if os.path.exists("app/assets/cloud/agent.py") else None)
        if ap14:
            a14 = open(ap14, encoding="utf-8").read()
            if not check("⑭ ⚡ GENE9 有求必应中枢（_wants_add 登记/_wants_done 销账/_wants_block 每轮任务注入，清单落盘 cloud/evolve_wants.json——做不到的那一刻进化目标已立）",
                         "GENE_DIRECTIVE9" in a14 and "def _wants_add" in a14 and "def _wants_done" in a14 and "def _wants_block" in a14 and "cloud/evolve_wants.json" in a14 and "SYSTEM + _wants_block()" in a14 and "WANTS_PASS" in a14):
                hard_ok = False
            if not check("⑭ ⚡ GENE9 刻进进化机制（进化 prompt 头号养料+锚锁触碰即拒+进化完成 tries 记消化轮数+App 需求镜像合并不复活已销账项）",
                         "有求必应铁律（GENE9" in a14 and "未满足需求清单（进化优先消化，做到一个消一个）" in a14 and '"GENE_DIRECTIVE9", "实弹验证列装闸"' in a14 and "记消化轮数" in a14 and "合并落盘" in a14):
                hard_ok = False
        if os.path.exists("app/assets/index.html"):
            ih14 = open("app/assets/index.html", encoding="utf-8").read()
            if not check("⑭ ⚡ App 端 demandMiss 自动进化链（需求落空即登记+本地 evolveRun+云端进化任务双发；链空/全败双挂点+回复认怂检测——零人工零提醒）",
                         _fz(ih14, "function demandMiss") and _fz(ih14, "GENE9 需求登记") and _fz(ih14, "回复中承认做不到") and _fz(ih14, "wants_pass:JSON.stringify") and _fz(ih14, "有求必应铁律（GENE9") and _fzc(ih14, 'demandMiss(text,"') >= 3):
                hard_ok = False
        ay14 = ".github/workflows/agent.yml" if os.path.exists(".github/workflows/agent.yml") else ("app/assets/cloud/agent.yml" if os.path.exists("app/assets/cloud/agent.yml") else None)
        if ay14:
            ay14c = open(ay14, encoding="utf-8").read()
            if not check("⑭ ⚡ agent.yml wants_pass 输入+WANTS_PASS env 透传（App→云端需求镜像血管）",
                         "wants_pass" in ay14c and "WANTS_PASS" in ay14c):
                hard_ok = False
    except Exception as e:
        if not check("⑭ ⚡ GENE9 有求必应链审计", False, "检查异常：" + str(e)[:80]):
            hard_ok = False

    # ⑮ 📦 对话框内交付链（v2.5.47-inchat 用户最高令：不要复杂选项用文字交流；视频/图片/文件生成后直接在对话框里交付）
    try:
        ap15 = "cloud/agent.py" if os.path.exists("cloud/agent.py") else ("app/assets/cloud/agent.py" if os.path.exists("app/assets/cloud/agent.py") else None)
        if ap15:
            a15 = open(ap15, encoding="utf-8").read()
            if not check("⑮ 📦 云端产物自动盘点（_deliver_scan 盘点本轮新增视频/图片/音频/文件→回复尾追【交付:路径】标记，确定性不依赖 LLM 自觉）",
                         "def _deliver_scan" in a15 and "【交付:" in a15 and '"_deliver_scan" in main.__code__.co_names' in a15 and '"--deliver" not in a15'):
                hard_ok = False
        ay15 = ".github/workflows/agent.yml" if os.path.exists(".github/workflows/agent.yml") else ("app/assets/cloud/agent.yml" if os.path.exists("app/assets/cloud/agent.yml") else None)
        if ay15 and not check("⑮ 📦 产物回仓血管（Commit results 步 git add anime/ output/——不回仓对话框里就没得拉）",
                              "git add anime/" in open(ay15, encoding="utf-8").read()):
            hard_ok = False
        if os.path.exists("app/assets/index.html"):
            ih15 = open("app/assets/index.html", encoding="utf-8").read()
            if not check("⑮ 📦 App 端气泡内交付（dlvBlob 拉 blob/dlvRender video·audio·img·文件卡四渲染/repaintBubble 挂钩/dlvClean 标记清洗）+大白话意图合成（nlSynth 八式——拍长片/视频/番剧/配音无需记前缀）+＋菜单复杂项砍除",
                         "function deliverFill" in ih15 and "function dlvBlob" in ih15 and "function dlvRender" in ih15 and "function nlSynth" in ih15 and "【交付:" in ih15 and "dlvClean" in ih15 and "🎞️ 拍长片（多镜头分镜拼接" not in ih15 and "🎥 拍真视频（CogVideoX" not in ih15):
                hard_ok = False
    except Exception as e:
        if not check("⑮ 📦 对话框内交付链审计", False, "检查异常：" + str(e)[:80]):
            hard_ok = False

    report = {"ts": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
              "directive3": GENE_DIRECTIVE3, "directive4": GENE_DIRECTIVE4, "results": RESULTS}
    os.makedirs("cloud", exist_ok=True)
    with open("cloud/vuln_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    print("vuln_report.json written: %d checks, hard_ok=%s" % (len(RESULTS), hard_ok), flush=True)
    try:  # 🧬 v2.5.92-hub 108 轮：统一主动中枢——体检战果同步进 proactive.json 战报流（App 端聊天页统一公告；红项也诚实上报绝不静默）
        try:
            with open("cloud/proactive.json", encoding="utf-8") as _f:
                _feed = json.load(_f)
        except Exception:
            _feed = []
        if not isinstance(_feed, list):
            _feed = []
        _feed.append({"kind": "vuln", "title": "🩺 双端体检完成：%d 项检查，%s" % (len(RESULTS), ("全绿" if hard_ok else "有红项（诚实上报）")),
                      "brief": "; ".join(str(r.get("name", ""))[:60] for r in RESULTS)[:380],
                      "ts": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")})
        with open("cloud/proactive.json", "w", encoding="utf-8") as _f:
            json.dump(_feed[-30:], _f, ensure_ascii=False, indent=1)
    except Exception:
        pass
    sys.exit(0 if hard_ok else 1)  # 硬检查任一失败 → Actions 红灯，App 端当场可见


if __name__ == "__main__":
    main()
