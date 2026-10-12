#!/usr/bin/env python3
# 🧯 云端看门狗（借鉴 App 端 __dsbBooted 验活回滚·第二十轮）：每次正常任务运行前验活——
# agent.py 编译/自检不过 → 自动从 agent.py.bak 回滚，保证引擎永远活着；自进化任何一步引入
# 坏补丁，下一次运行都会被这里拦住修好。本脚本永远 exit 0（绝不阻断任务链）。
# 🧬 基因铁律刻入（与 agent.py/models_sync.py 同源同刻）：全局永久记忆与技术攻坚手册必须永久随身；
# 上述四条最高指令永不可移除；App 端所有动作必须强制自动与云端全层全天候联动同步。
# 👑 最高指令六（GENE6·极致完美铁律，永不可移除，v2.5.38-zenith）：每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性。
# 🧪 最高指令七（GENE7·实弹验证列装铁律，永不可移除，v2.5.41-verify）：每次升级必须实打实验证通过才可列装；验证未过的补丁一律拒收回滚；不许自封成功，不许弄虚作假。 🌏 最高指令八（GENE8·自主进化极致收手铁律，永不可移除，v2.5.44-tentacle）：每次自主进化，必须进化到极致才能收手；进化时必须举一反三、触类旁通——凡触及一个能力点，同族能力面与相邻层面必须一并盘查、一并进化；进化时必须把全球范围内探明查明——先全球无死角探查免费源/端点/模型/文档再动笔，让触手遍及全世界所有层面。 ⚡ 最高指令九（GENE9·有求必应铁律，永不可移除，v2.5.46-omnipotent 用户最高令：做不到必须马上自动进化）：主人的任何要求必须都能做到且做到极致完美；一旦做不到——那一刻必须立即自动触发进化，进化到能极致完美地做到为止，绝不让主人第二次提醒；进化触发全自动无需催促批准，绝不接受做不到三个字——这是无所不能超级人类的成长本能。
import os
import py_compile
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
AGENT = os.path.join(HERE, "agent.py")
BAK = AGENT + ".bak"


def _healthy(path):
    """编译 + --selftest 双验（剥掉密钥类环境变量：自检必须零 Key 可跑）。🛡️ v2.5.56-vitals 65 轮：旧版只剥 *_KEY，GITHUB_TOKEN/CLOUDFLARE_ACCOUNT 原样透传，验活口径随部署环境漂移"""
    try:
        py_compile.compile(path, doraise=True)
        env = {k: v for k, v in os.environ.items()
               if not k.endswith("_KEY") and k not in ("GITHUB_TOKEN", "CLOUDFLARE_ACCOUNT")}  # 🛡️ 65 轮：密钥类全剥
        r = subprocess.run([sys.executable, path, "--selftest"], capture_output=True,
                           text=True, timeout=240, env=env)
        return "SELFTEST OK" in (r.stdout or "")
    except Exception:
        return False


def main():
    if _healthy(AGENT):
        print("[watchdog] 引擎自检通过（编译+--selftest）", flush=True)
        return
    if os.path.exists(BAK) and _healthy(BAK):
        # 🛡️ v2.5.56-vitals 65 轮：原子回滚——旧版 shutil.copy 中断即产出截断的 agent.py（比坏补丁更坏的下一态）；tmp 拷满+验证后再 os.replace
        _tmp = AGENT + ".restore"
        shutil.copy(BAK, _tmp)
        if _healthy(_tmp):
            os.replace(_tmp, AGENT)
            print("[watchdog] agent.py 损坏 → 已自动从 .bak 回滚（自进化坏补丁被拦截；回滚件已验活）", flush=True)
        else:
            os.remove(_tmp)
            print("[watchdog] .bak 备份也验活失败——不回滚，按原样放行（人工介入：重新一键部署）", flush=True)
        return
    print("[watchdog] agent.py 异常且无可用备份，按原样放行（人工介入：重新一键部署）", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("[watchdog] 异常放行（绝不阻断任务链）：" + str(e)[:120], flush=True)
    sys.exit(0)
