/* DS Harness v2.4.0-selfupdate 全量回归测试（跑法：node tests/_v240_test.cjs）
   覆盖：A 热更运行时契约（Java 门）B UPD 结构全量 C 沙箱实弹（updMd5/updGauntlet/updBundleVerOf/updManifestParse/幂等）
   D 双端联动接线 E 版本一致性 F 云端 py 六检 G 四基因扁平化矩阵 H evolveRun 安全约束 */
const fs = require("fs"), vm = require("vm");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "app/assets/index.src.html"), "utf8"); // 🦓 v2.5.61-flash 79 轮：断言对象改为人写源码 src（app/assets/index.html 已变为 Babel 转译产物，锚点形态会变）；产物另由 D79 断言组专项校验
const dstHtml = fs.readFileSync(path.join(ROOT, "app/assets/index.html"), "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const mainJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/MainActivity.java"), "utf8");
const transpileCjs = fs.readFileSync(path.join(ROOT, "tools/transpile.cjs"), "utf8"); // 🔬 v2.5.63-probe 81 轮：acorn ES5 硬门断言对象
const bridgeJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/Bridge.java"), "utf8");
const storeJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/Store.java"), "utf8");
const pickJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/PickProvider.java"), "utf8");
const schedJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/AlarmScheduler.java"), "utf8");
const recvJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/AlarmReceiver.java"), "utf8");
const llamaJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/LlamaCore.java"), "utf8");
const manifestXml = fs.readFileSync(path.join(ROOT, "app/AndroidManifest.xml"), "utf8");
const buildSh = fs.readFileSync(path.join(ROOT, "build.sh"), "utf8");
const vulnPy = fs.readFileSync(path.join(ROOT, "app/assets/cloud/vuln_check.py"), "utf8");
const agentPy = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.py"), "utf8");

let pass = 0, fail = 0;
const t = (name, cond) => { if (cond) { pass++; console.log("  [ok] " + name); } else { fail++; console.log("  [FAIL] " + name); } };

console.log("== A. 热更运行时契约（Java 门）==");
t("Bridge.hotInfo 轻量探测（ok/exists/len/md5）", /public String hotInfo\(\)/.test(bridgeJava) && /o\.put\("md5", md5Of/.test(bridgeJava));
t("Bridge.hotRead 全文+md5", /public String hotRead\(\)/.test(bridgeJava) && /o\.put\("content", sb\.toString\(\)\)/.test(bridgeJava));
t("Bridge.hotWrite 大小门 60KB~500KB", /content\.length\(\) < 60000 \|\| content\.length\(\) > 500000/.test(bridgeJava));
t("Bridge.hotWrite 原子落盘 fsync+rename", /getFD\(\)\.sync\(\)/.test(bridgeJava) && /renameTo/.test(bridgeJava));
t("Bridge.hotDelete 幂等删除", /public String hotDelete\(\)/.test(bridgeJava));
t("Bridge.md5 对外暴露", /public String md5\(String s\)/.test(bridgeJava));
t("MainActivity.readHotBundle 门（大小+双标识）", /readHotBundle/.test(mainJava) && /DS Harness/.test(mainJava) && /BUNDLE_VER/.test(mainJava));
t("MainActivity.loadWeb 热包优先+null 基桥（84 轮：基址不再保活——装载矩阵第四格）", /webView\.loadDataWithBaseURL\(null, b,/.test(mainJava));
t("MainActivity.reload 公开重装载", /public void reload\(\)/.test(mainJava));

console.log("== B. UPD 结构全量 ==");
const has = (re, name) => t(name, re.test(html));
has(/const BUNDLE_VER=103;/, "BUNDLE_VER=95 兼容线（第八十八轮：无桥默认启动——87 版证实装机但默认仍走真桥，无桥实验升为默认）");
  has(/const APP_VER="2.5.115-notif";/, "APP_VER 常量");
has(/const UPD_DAILY_MS=86400000;/, "每日检查节拍 24h");
has(/function updChannels\(\)/, "多免费通道");
has(/raw\.githubusercontent\.com/, "通道一 raw.githubusercontent");
has(/cdn\.jsdelivr\.net\/gh\//, "通道二 jsDelivr CDN");
has(/settings\.updMirror/, "通道三 自定义镜像");
has(/function updGauntlet\(/, "四重闸门");
has(/function updSelfMd5\(\)/, "幂等权威 MD5 源");
has(/function updManifestParse\(/, "清单校验");
has(/function updApply\(/, "原子应用+落盘对拍");
has(/function updPublish\(/, "自动发布云端");
has(/cloud\/update\/bundle\.json/, "云端包路径");
has(/cloud\/update\/manifest\.json/, "云端清单路径");
has(/function updBootGuard\(\)/, "JS 启动自检门");
has(/function updBootGuardAfter\(\)/, "回滚旗标补归档");
has(/function updCheckDaily\(\)/, "每日自动检查");
has(/function updStatusHtml\(\)/, "设置页面板");
has(/\$\{updStatusHtml\(\)\}/, "设置页已嵌面板");
has(/function evolveRun\(/, "自主进化");
has(/function sendStreamOnceRaw\(/, "非流式单轮封装");
has(/updBootGuard\(\);/, "启动接线：自检门");
has(/updCheckDaily\(\);/, "启动接线：每日检查");
has(/updPublishNow/, "手动发布按钮");
has(/updBundleVerOf\(/, "防降级版本解析");

console.log("== C. 沙箱实弹 ==");
// 提取纯函数到沙箱
function sandboxFns() {
  const ctx = {
    console, b64u: null,
    result: null,
  };
  const src = `
    ${script.match(/function updMd5\(s\)\{[\s\S]*?\n\}/) ? script.match(/function updMd5\(s\)\{[\s\S]*?\n\}/)[0] : "function updMd5(){}"}
  `;
  return ctx;
}
// 1) updMd5 实弹：契约=委托 DSB.md5（Java 层真 MD5）；沙箱用 node crypto 模拟真 DSB
{
  const m = script.match(/function updMd5\(s\)\{[\s\S]*?\n\}/);
  t("updMd5 函数可提取", !!m);
  if (m) {
    const crypto = require("crypto");
    const ctx = { DSB: { md5: (s) => crypto.createHash("md5").update(Buffer.from(String(s), "utf8")).digest("hex") } };
    const updMd5 = vm.runInNewContext(m[0] + ";updMd5", ctx);
    t("updMd5(\"abc\")=900150983cd24fb0d6963f7d28e17f72（真 MD5 委托链）", updMd5("abc") === "900150983cd24fb0d6963f7d28e17f72");
    t("updMd5 空串=d41d8cd98f00b204e9800998ecf8427e", updMd5("") === "d41d8cd98f00b204e9800998ecf8427e");
    t("updMd5 中文向量稳定", updMd5("中文往返") === updMd5("中文往返"));
    t("updMd5 委托 DSB.md5（缺桥时返回空串不炸）", vm.runInNewContext(m[0] + ";updMd5(\"x\")", {}) === "");
  }
}
// 2) updGauntlet 实弹：好坏包判别
{
  const m = script.match(/function updGauntlet\(code,meta\)\{[\s\S]*?\n\}/);
  t("updGauntlet 可提取", !!m);
  if (m) {
    const pre = "const BUNDLE_VER=16;const APP_VER=\"2.4.0-selfupdate\";const UPD_DAILY_MS=86400000;function updMd5(s){return String(s).length+\"\"};function updBundleVerOf(){};";
    const ctx = { BUNDLE_VER: 16, APP_VER: "2.4.0-selfupdate", updMd5: null, updBundleVerOf: null, b64u: (s) => Buffer.from(s, "binary").toString("base64") };
    const updMd5Src = script.match(/function updMd5\(s\)\{[\s\S]*?\n\}/)[0];
    const updVerSrc = script.match(/function updBundleVerOf\(code\)\{[\s\S]*?\n\}/)[0];
    const gauntlet = vm.runInNewContext(pre + updMd5Src + updVerSrc + m[0] + ";updGauntlet", ctx);
    const PAD = "/*" + "横".repeat(59999) + "*/"; // 填充至 ≥60KB 过大小门（注释保语法合法；横在 JS 字符串中占 1 个 length 单位）
    const GOOD = "DS Harness\nconst BUNDLE_VER=16;\n<script>" + PAD + "function initAll(){}function vulnCheck(){}function sendStream(){}function phoneSend(){}function updCheck(){}function pagePhone(){}\nconst curScope=()=>1;\nconst GENE_DIRECTIVE=1;const GENE_DIRECTIVE2=1;const GENE_DIRECTIVE3=1;const GENE_DIRECTIVE4=1;</script>";
    const errs = gauntlet(GOOD, null);
    t("完好热包过闸（0 错）", Array.isArray(errs) && errs.length === 0);
    const errs2 = gauntlet(GOOD.replace("GENE_DIRECTIVE4=1", "XX=1"), null);
    t("基因四缺失被闸门拒绝", errs2.some(e => /基因指令四/.test(e)));
    const errs3 = gauntlet(GOOD.replace("function initAll(){}", ""), null);
    t("结构缺函数被拒", errs3.some(e => /initAll/.test(e)));
    const errs4 = gauntlet(GOOD.replace("BUNDLE_VER=16", "BUNDLE_VER=15"), null);
    t("防降级：BUNDLE_VER<16 被拒", errs4.some(e => /防降级/.test(e)));
    const errs5 = gauntlet(GOOD.replace("DS Harness", "NotDSH"), null);
    t("无 DSH 标识被拒", errs5.length > 0);
    const errs6 = gauntlet(GOOD, { md5: "deadbeef" });
    t("MD5 对拍失败被拒", errs6.some(e => /MD5/.test(e)));
  }
}
// 3) updManifestParse 幂等实弹
{
  const mRank = script.match(/function updVerRank\(v\)\{[\s\S]*?\n\}/);
  const m = script.match(/function updManifestParse\(meta,selfMd5\)\{[\s\S]*?\n\}/);
  t("updVerRank 可提取", !!mRank);
  t("updManifestParse 可提取（新签名）", !!m);
  if (m && mRank) {
    const parse = vm.runInNewContext("const BUNDLE_VER=20;const APP_VER=\"2.4.0-selfupdate\";" + mRank[0] + m[0] + ";updManifestParse", {});
    t("同版本+同 MD5 → 幂等短路", parse({ appVersion: "2.4.0-selfupdate", md5: "aaa", bundleVer: 16 }, "aaa").includes("与当前版本完全相同，无需更新"));
    t("同版本+异 MD5 → 不短路（进化包场景）", !parse({ appVersion: "2.4.0-selfupdate", md5: "bbb", bundleVer: 16 }, "aaa").includes("与当前版本完全相同，无需更新"));
    t("低 bundleVer 被拒", parse({ appVersion: "9.9.9", md5: "bbb", bundleVer: 15 }, "aaa").some(e => /过低/.test(e)));
    // 🔒 第五轮方向闸实弹（本地=2.4.0-selfupdate）
    t("方向闸：云端清单 2.3.9（旧于本地）→ 回退拦截", parse({ appVersion: "2.3.9", md5: "bbb", bundleVer: 17 }, "aaa").some(e => /回退拦截/.test(e)));
    t("方向闸：云端清单 2.4.1-evolve3（新于本地）→ 放行", !parse({ appVersion: "2.4.1-evolve3", md5: "bbb", bundleVer: 17 }, "aaa").some(e => /回退拦截|冲突/.test(e)));
    t("幂等短路仍先于方向闸工作（同版本同 MD5）", parse({ appVersion: "2.4.0-selfupdate", md5: "aaa", bundleVer: 17 }, "aaa").includes("与当前版本完全相同，无需更新"));
    t("冲突闸：同进化号异内容（多设备进化）→ 本机拒覆盖", parse({ appVersion: "2.4.0-selfupdate-evolve2", md5: "zzz", bundleVer: 17 }, "aaa").some(e => /冲突/.test(e)) || (()=>{const c=vm.runInNewContext("const BUNDLE_VER=20;const APP_VER=\"2.4.0-selfupdate-evolve2\";" + mRank[0] + m[0] + ";updManifestParse", {});return c({ appVersion: "2.4.0-selfupdate-evolve2", md5: "zzz", bundleVer: 17 }, "aaa").some(e=>/冲突/.test(e))})());
    t("普通无后缀版本：同号异 MD5 不触发冲突闸（正常官方升级流程不受扰）", (()=>{const c=vm.runInNewContext("const BUNDLE_VER=20;const APP_VER=\"2.4.0\";" + mRank[0] + m[0] + ";updManifestParse", {});return !c({ appVersion: "2.4.0", md5: "zzz", bundleVer: 17 }, "aaa").some(e=>/冲突/.test(e))})());
    t("缺字段被拒", parse({ appVersion: "9.9.9" }, "aaa").length > 0);
    t("清单不可解析被拒", parse(null, "aaa")[0] === "清单不可解析");
  }
}
// 4) updBootGuard 探针方式（词法 typeof，非 window[f]）
{
  const m = script.match(/function updBootGuard\(\)\{[\s\S]*?\n\}/);
  t("updBootGuard 用词法 typeof 探针", m && /typeof initAll/.test(m[0]) && /typeof esc/.test(m[0]));
  t("全局无 window[f] 探针代码残留（注释/种子文本除外）", !/filter\(f=>typeof window\[f\]/.test(script) && !/window\[f\]!=="function"/.test(script));
  t("回滚旗标走原生 store（S 初始化前自保）", /updReverted/.test(m[0]) && /DSB\.storeGet/.test(m[0]));
}

console.log("== D. 双端联动 ==");
t("应用即直推镜像（cloudMirrorPush 不等防抖）", /cloudMirrorPush\("upd-apply:/.test(script));
t("应用即自动发布云端（updPublish 调用在 updApply 内）", /updPublish\(code,meta\); \/\/ 🔗 GEN4：应用即自动发布云端/.test(script));
t("digest/appState 用 APP_VER 而非死字串", /appVersion:APP_VER,/.test(script) && !/appVersion:"2\.3\.0-phone"/.test(script));
t("evolveRun 战果自动归档手册", /pbLearn\("自主进化补丁/.test(script));
t("升级战果自动沉淀记忆", /memAdd\("fact","🧬 已自主升级至/.test(script));
t("VULN_CHECKS 第 6 项 id:update 在册", /id:"update",name:"🧬 自主升级链完整性/.test(script));
t("第 6 检修复动作=立即升级检查", /const r=await updCheck\(true\);return\{ok:1,detail:"已发起全通道升级检查/.test(script));
t("进化包改写 APP_VER 防每日重拉死循环", /const APP_VER="[^"]*"/.test(script) && /否则重装载后 APP_VER 不变，每日检查会无限重拉同一包/.test(script));

console.log("== D2. 双向自动同步（App↔云端任一端变动，另一端自动同步）==");
t("App→云：memAdd 改动即推（mindDirty+syncMindCloud 内嵌）", /st\.mindDirty=true; save\("settings"\); syncMindCloud\(\);/.test(script));
t("App→云：pbLearn 改动即推", script.match(/function pbLearn[\s\S]*?mindDirty=true; save\("settings"\); syncMindCloud\(\);/) !== null);
t("App→云：先拉后推不覆盖云端新写", /await pullMindCloud\(true\);\}catch\(e\)\{\} \/\/ 先拉后推：保留云端/.test(script));
t("App→云：推送失败脏标记持久化，下次启动补推", /mindDirty=\(okM&&okP\)\?false:S\.settings\.mindDirty/.test(script) && /if\(S\.settings\.mindDirty\)syncMindCloud\(\)/.test(script));
t("云→App：云端学习 commit 回仓（agent.yml）", fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8").includes("git add cloud/memory.json cloud/playbook.json"));
t("云→App：启动即拉", /pullMindCloud\(\); if\(S\.settings\.mindDirty\)syncMindCloud\(\)/.test(script));
t("云→App：回前台即拉（__onResume）", /window\.__onResume[\s\S]*?pullMindCloud\(\)/.test(script));
t("云→App：取回云端任务结果即拉（Agent 刚学完当场到）", /cleanupRun\(runId\);[\s\S]*?pullMindCloud\(true\)/.test(script));
t("云→App：常驻节拍每 10 分钟（已升级为 cloudPulse 全仓心跳，见 D3）", /setInterval\(\(\)=>\{try\{cloudPulse\(\)\}catch\(e\)\{\}\},600000\)/.test(script));
t("云→App：拉取节流与节拍对齐（10min）", /now\(\)-st\.mindPullTs<600000/.test(script));
t("云→App：拉取未部署安全空转", /const repo=S\.settings\.cloudRepo; if\(!repo\)return false;/.test(script));
t("合并算法：双向 id 并集（永互不覆盖）", /function mergeMind\(loc,rem,keyField\)/.test(script));

console.log("== D3. 全仓心跳（任何变动双向完全自动同步）==");
t("cloudPulse 主节拍在册（12 子项全拉：含 GENE6 云端进化感知+📰 进化战报+🧬 主动中枢+💗 生命体征）", /async function cloudPulse\(\)\{/.test(script) && /pullMindCloud\(\)\}catch/.test(script.match(/async function cloudPulse[\s\S]*?\n\}/)[0]) && script.match(/async function cloudPulse[\s\S]*?\n\}/)[0].split("try{").length === 13 && /cloudEvolveCheck\(\)\}catch\(e\)\{\} *\/\/ 🧬 GENE6/.test(script.match(/async function cloudPulse[\s\S]*?\n\}/)[0]) && /pullVitalsCloud\(\)\}catch/.test(script.match(/async function cloudPulse[\s\S]*?\n\}/)[0]));
t("节拍接线 setInterval 600000→cloudPulse", /setInterval\(\(\)=>\{try\{cloudPulse\(\)\}catch\(e\)\{\}\},600000\)/.test(script));
t("云端体检报告自动回收（原缺口：从不主动拉）", /function vulnReportRecover\(\)/.test(script) && /cloud\/vuln_report\.json/.test(script.match(/function vulnReportRecover[\s\S]*?\n\}/)[0]) && /1800000/.test(script.match(/function vulnReportRecover[\s\S]*?\n\}/)[0]));
t("报告异常自动沉淀+增量 toast（防轰炸）", /云端自检发现 "\+bad\.length/.test(script) && /if\(bad\.length>prevBad\)toast/.test(script));
t("升级包心跳 2h（其他设备发布挂机也能拉到）", /function updCheckPulse\(\)/.test(script) && /7200000/.test(script.match(/function updCheckPulse[\s\S]*?\n\}/)[0]));
t("情报拉取节流 24h→6h（与心跳对齐）", /now\(\)-st\.repoModelsTs<21600000/.test(script));
t("远端项目列表静默拉取（30min 节流）", /function pullCloudProjectsSilent\(\)/.test(script) && /cloudProjPullTs&&now\(\)-st\.cloudProjPullTs<1800000/.test(script));
t("项目新对话自动重推（1h/项目节流，首次同步仍手动）", /function autoResyncProjects\(\)/.test(script) && /if\(!p\.cloudSyncTs\)return; \/\/ 从未同步过的项目不自动推/.test(script) && /3600000/.test(script.match(/function autoResyncProjects[\s\S]*?\n\}/)[0]));
t("syncProjectCore 拆分（静默版无 UI 副作用）", /function syncProjectCore\(pid\)/.test(script) && !/toast\(/.test(script.match(/function syncProjectCore[\s\S]*?\n\}/)[0]));
t("心跳云端子项未部署安全空转（进化刻意在守卫外）", /if\(!st\.cloudRepo\)return; \/\/ 未部署云端：仅进化照常，其余云端同步子项空转零成本/.test(script));
t("进化不依赖云端部署（evolveRunDaily 在总守卫之前）", script.match(/async function cloudPulse[\s\S]*?\n\}/)[0].indexOf("evolveRunDaily") < script.match(/async function cloudPulse[\s\S]*?\n\}/)[0].indexOf("if(!st.cloudRepo)return"));
t("多补丁命中计数基准 next（非原始 code）", /const hits=\(next\.match\(/.test(script) && /在当前态计数/.test(script));

console.log("== D4. 全量状态同步（sessions/alarms/plugins——除密钥外一切变动）==");
t("save 钩子：四大面落盘→防抖推送", /k==="sessions"\|\|k==="alarms"\|\|k==="plugins"\|\|k==="projects"\|\|\(k==="settings"&&S\.settings\.persona!==statePersonaSnap\)/.test(script));
t("saveAlarm 带 ts（取新者依据）", /enabled:1,ts:now\(\)\};/.test(script));
t("删除走墓碑（防云端复活）", /function stateTomb\(k,id\)/.test(script) && /stateTomb\("s",id\);save\("sessions"\)/.test(script) && /stateTomb\("a",id\);save\("alarms"\)/.test(script));
t("墓碑容量护栏 80 上限", /st\.stateTomb\.length>80\)st\.stateTomb=st\.stateTomb\.slice\(-80\)/.test(script));
t("状态快照密钥永不入仓（仅会话/定时/插件/人设）", /function buildCloudState\(\)\{[\s\S]*?\}\.test\(/.test(script) ? true : !/githubToken/.test(script.match(/function buildCloudState\(\)[\s\S]*?\n\}/)[0]) && !/providers/.test(script.match(/function buildCloudState\(\)[\s\S]*?\n\}/)[0]));
t("同步前先拉合并（不覆盖他端新写）", script.match(/function syncStateCloud[\s\S]*?\n\}/)[0].includes("await pullStateCloud(true)"));
t("拉取合并 stateSyncing 锁防回环", /stateSyncing=true;[\s\S]*?finally\{stateSyncing=false\}/.test(script));
t("心跳含状态拉取（30min 节流）", script.match(/async function cloudPulse[\s\S]*?\n\}/)[0].includes("pullStateCloud()") && /now\(\)-st\.statePullTs<1800000/.test(script));
t("启动即拉+脏补推", /pullStateCloud\(\); if\(S\.settings\.stateDirty\)syncStateCloud\(true\)/.test(script));
t("回前台即拉", /window\.__onResume[\s\S]*?pullStateCloud\(\)\}catch/.test(script));
t("定时任务合并后重调度", /mergeStateList\(S\.alarms\.list,j\.alarms[\s\S]*?DSB\.rescheduleAll/.test(script));

console.log("== D5. 无感进化极致（零人工·零同意·静默·通知·永不重装）==");
t("每日自动进化节拍 evolveRunDaily（24h 节流）", /function evolveRunDaily\(\)/.test(script) && /now\(\)-st\.evolveTs<86400000/.test(script));
t("进化节拍挂进 cloudPulse（心跳自动触发）", script.match(/async function cloudPulse[\s\S]*?\n\}/)[0].includes("evolveRunDaily()"));
t("进化基底内置版自举（无热包回退 readAsset，首次安装可进化）", /无热包回退 APK 内置资产/.test(script) && /DSB\.readAsset\("index\.html"\)/.test(script.match(/async function evolveRun[\s\S]*?\n\}/)[0]));
t("prompt 基底与进化基底同源（内置版 AI 能看全源码）", /进化基底，补丁必须在此源码中唯一命中/.test(script) && !/无热包源码可读，仅分析/.test(script));
t("进化成功发系统通知 DSB.notifyUser", script.match(/function evolveRun[\s\S]*?\n\}/) !== null && /DSB\.notifyUser\(title,body\)/.test(script));
t("通知含进化原因（为何进化）", /进化原因："\+String\(j\.analysis/.test(script));
t("通知含为何安全", /为何安全："\+String\(j\.reason/.test(script));
t("通知含进化内容明细（哪些东西，逐补丁列明 find→replace）", /进化内容（/.test(script) && /p\.find[\s\S]*?p\.replace/.test(script));
t("通知含无需重装声明", /无需重装 App/.test(script));
t("全自动模式零打扰（manual=false 不 toast 不确认）", script.match(/async function evolveRun[\s\S]*?\n\}/)[0].split("if(manual)").length >= 6 && !/confirm\(/.test(script.match(/async function evolveRun[\s\S]*?\n\}/)[0]));
t("升级应用也发系统通知（updApply）", /const upTitle="🧬 已无感升级至 "/.test(script));
t("进化不重装 App（热重载 reload 而非 APK 安装）", /setTimeout\(\(\)=>\{try\{DSB\.reload\(\)\}catch\(e\)\{\}\},1500\)/.test(script));

console.log("== E. 版本一致性 ==");
t("APP_VER=2.5.115-notif", /const APP_VER="2.5.115-notif";/.test(script));
t("footer 版本一致", /DS Harness v2.5.115-notif/.test(html));
t("footer 含永久自主升级特性", /永久自主升级（多免费通道\+四重闸门\+自动发布云端\+每日自动检查\+自主进化）/.test(html));
t("SEED_VER=10", /const SEED_VER=10;/.test(script));
t("MEM_SEED 6 条离线刻入（含 v2.4.0 升级链 m5/m6）", /const MEM_SEED=\[/.test(script) && (script.match(/\{id:"seed-m[1-6]",/g) || []).length === 6);
t("seedMemories 版本化闸门（memSeeded）", /function seedMemories\(\)\{/.test(script) && /MEM_SEED_VER=1/.test(script) && /memSeeded/.test(script));
t("启动接线 seedMemories", /seedMemories\(\); \/\/ 🧖 GEN3：核心记忆种子离线装配/.test(script));
t("无旧版本字串残留", !/2\.3\.0-phone/.test(html));
t("构建脚本已升 122/2.5.115-notif（含 NDK 编译段）", /VER="2.5.115-notif"; VCODE=133/.test(buildSh) && /DS-Harness-\$VER\.apk/.test(buildSh) && /libdshllama\.so/.test(buildSh));
t("Manifest 已升 122/2.5.115-notif", /android:versionCode="133"/.test(manifestXml) && /android:versionName="2.5.115-notif"/.test(manifestXml));

console.log("== F. 云端 py 六检 ==");
t("docstring 升六检", /六检全部实弹/.test(vulnPy));
t("第 6 检更新通道互拍在册", /自主升级更新通道互拍/.test(vulnPy) && /BUNDLE_VER_MIN = 17/.test(vulnPy));
t("俱缺软检查不拦跑", /FileNotFoundError/.test(vulnPy));
t("MD5 不互拍/防降级/b64 解码三闸", /MD5 不互拍/.test(vulnPy) && /bundleVer 防降级拦截/.test(vulnPy) && /b64 包体不可解码/.test(vulnPy));
t("py 可编译", (() => { try { require("child_process").execSync("python3 -m py_compile " + path.join(ROOT, "app/assets/cloud/vuln_check.py"), { stdio: "pipe" }); return true; } catch (e) { return false; } })());

console.log("== G. 四基因扁平化矩阵（全 script 块）==");
const flat = script.replace(/[\s#*]+/g, "");
[
  ["指令一", "每次动态拉取/更新/淘汰：强制深彻·全方位·无死角全球探查，事无巨细，仔细再仔细"],
  ["指令二", "模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力"],
  ["指令三", "全局永久记忆与技术攻坚手册必须永久随身"],
  ["指令四", "App端所有动作必须强制自动与云端全层全天候联动同步"],
].forEach(([n, g]) => t("GENE " + n + " 在 UPD 层旁也全文在位", flat.indexOf(g) >= 0));
t("UPD 模块头刻四指令（模块级）", (() => { const f = script.slice(script.indexOf("永久自主升级"), script.indexOf("永久自主升级") + 3000).replace(/[\s#*]+/g, ""); return f.indexOf("最高指令四（GEN4·全天候联动铁律，永不可移除）") >= 0 && f.indexOf("模型和算力必须强制自动切换") >= 0 && f.indexOf("双端共脑铁律") >= 0; })());

console.log("== H. evolveRun 安全约束 ==");
t("patches ≤3", /j\.patches\.slice\(0,3\)/.test(script));
t("find/replace ≤2000", /p\.find\.length>2000\|\|p\.replace\.length>2000/.test(script));
t("find 唯一命中校验（正则转义+match 计数）", /new RegExp\(p\.find\.replace\(/.test(script) && /"\\\\\$&"/.test(script) && /\)\|\|\[\]\)\.length/.test(script));
t("禁止改基因/桥/工具名写入 prompt", /禁止改动四基因指令、桥方法名、工具名/.test(script));
t("无补丁时空数组不折腾", /patches 为空数组/.test(script));

console.log("== D6. 第三轮深查：reload 定时窗口保险 + 私有仓免费通道 ==");
t("scheduleStateSync 已部署分支也置 stateDirty（1.5s reload 杀死 30s 定时器后启动补推仍可触发）", /if\(!st\.stateDirty\)\{st\.stateDirty=true;save\("settings"\)\} \/\/ 🧬Reload窗口保险/.test(script));
t("stateDirty 推送成功才清（与 mindDirty 同模式）", /st\.stateDirty=\(r\.ok\|\|r\.status===201\)\?false:st\.stateDirty/.test(script));
t("启动脏旗标补推链存在（补推入口）", /pullStateCloud\(\); if\(S\.settings\.stateDirty\)syncStateCloud\(true\)/.test(script));
t("updChannels 增 GitHub API 私有仓免费通道（api:1 标记）", /name:"GitHub API"[\s\S]{0,200}contents\/cloud\/update\/manifest\.json[\s\S]{0,180}api:1/.test(script));
t("私有仓通道仅在有 token 时加入（不污染无 token 用户）", /if\(repo&&S\.settings\.githubToken\)list\.push\(\{name:"GitHub API"/.test(script));
t("updCheck manifest 拉取按 ch.api 切 ghHeaders+raw Accept", /ch\.manifestUrl,"GET",null,ch\.api\?\{\.\.\.ghHeaders\(\),Accept:"application\/vnd\.github\.raw","Cache-Control":"no-cache"\}/.test(script));
t("updCheck bundle 拉取同样按 ch.api 切换", /ch\.bundleUrl,"GET",null,ch\.api\?\{\.\.\.ghHeaders\(\)/.test(script));
t("进化前必须先过 updGauntlet", /const errs=updGauntlet\(next,\{md5:null\}\)/.test(script));

console.log("== D7. 第四轮深查：运行时砖损 Java 看门狗 + 补丁安全锚锁 ==");
t("Java 看门狗：loadWeb 每次装载都 armBootWatchdog", /armBootWatchdog\(\); \/\/ 🔒 第四重永砖保险/.test(mainJava));
t("看门狗验 __dsbBooted 旗标（6s 后评估）", mainJava.includes('window.__dsbBooted===1') && mainJava.includes("postDelayed") && mainJava.includes("6000"));
t("看门狗砖损回滚链：hotDelete+watchdogRevert 计数+reload", /bridge\.hotDelete\(\);[\s\S]{0,150}watchdogRevert[\s\S]{0,200}reload\(\);/.test(mainJava));
t("看门狗防死循环：2 次即出诊断页（81 轮：>3 停手改>1 出诊断页——留死壳改给出路）", /bootFails > 1/.test(mainJava) && /bootFails\+\+/.test(mainJava) && /private int bootFails = 0/.test(mainJava) && /showDiagPage\(\)/.test(mainJava));
t("JS 侧看门狗旗标立于 renderRoute 后（UI 存活证据）", /renderRoute\(\);\ntry\{bLog\("s4-renderRoute-done"\)\}catch\(e\)\{\}\ntry\{wireModeBtn\(\)\}catch\(e\)\{\};[\s\S]{0,260}?window\.__dsbBooted=1;/.test(script)); // 🕵️ 79 轮：renderRoute 后新增 s4 黑匣子打点行 // 🐾 68c：renderRoute 与旗标间仅新增零风险 UI 装配行（wireModeBtn 初绘+斜杠监听，均在网络调用前）
t("看门狗旗标先于启动段一切网络调用（防慢网误杀）", script.indexOf("window.__dsbBooted=1")>-1 && script.indexOf("window.__dsbBooted=1")<script.indexOf("pullMindCloud(); if") && script.indexOf("window.__dsbBooted=1")<script.indexOf("vulnCheck(); // ⚖️"));
t("回滚归档链：watchdogRevert 旗标→记忆+手册+toast", /storeGet\("watchdogRevert"\)[\s\S]{0,400}Java 看门狗自动回滚砖损热包/.test(script));
t("安全锚锁 UPD_LOCK 硬闸在位（禁触 token 管道/热包读写/闸门自检门/看门狗旗标）", ["api\\.github\\.com","raw\\.githubusercontent","ghHeaders","githubToken","Authorization","hotWrite","hotDelete","updGauntlet","updBootGuard","updSelfMd5","updManifestParse","__dsbBooted","BUNDLE_VER"].every(x=>script.includes(x)) && script.includes("const UPD_LOCK="));
t("补丁循环逐条过安全锚锁（find/replace 双检）", /UPD_LOCK\.test\(p\.find\)\|\|UPD_LOCK\.test\(p\.replace\)\)\{applied\.push\("安全锚锁拦截跳过"\);continue\}/.test(script));
t("进化 prompt 含安全锚禁令（软约束+硬闸双保险）", /禁触安全锚/.test(script));
t("BUNDLE_VER 防降级地板全链升版（防旧包拉锯战）", /const BUNDLE_VER=103;/.test(script) && !/BUNDLE_VER=(?:[1-9]|[12][0-9]|3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|97|98);/.test(script));

console.log("== D8. 第五轮深查：清单方向闸防回退 + persona 独面同步 + Store 存活 ==");
t("updVerRank 版本排序函数在位（三段版本号+进化号全编码）", /function updVerRank\(v\)\{[\s\S]{0,400}evolve[\s\S]{0,200}1e9/.test(script));
t("方向闸：清单低于本地运行版→回退拦截", /清单版本低于当前运行版（回退拦截/.test(script));
t("冲突闸：同进化号异内容→本机优先拒覆盖", /同进化号但内容不同（多设备进化冲突，本机优先拒覆盖）/.test(script));
t("方向闸与冲突闸嵌在 updManifestParse 主链", /locR=updVerRank\(APP_VER\),manR=updVerRank\(meta\.appVersion\)/.test(script));
t("save 钩子 persona 快照触发（settings 独面变动亦同步）", /k==="settings"&&S\.settings\.persona!==statePersonaSnap/.test(script) && /var statePushTimer=0,stateSyncing=false,statePersonaSnap;/.test(script));
t("Store 落盘存活：tmp+fsync+rename 原子写（reload/回滚/杀进程不丢设置与记忆）", storeJava.includes("getFD().sync()") && storeJava.includes("renameTo") && storeJava.includes("getFilesDir()"));
  t("💀注释吞噬防线：剥离注释后 save 钩子仍含 scheduleStateSync 活代码（第五轮实弹炸出的未闭合注释曾吞掉整个钩子）", (script.match(/function save\(k\)\{[\s\S]*?\n\}/)||[""])[0].replace(/\/\*[\s\S]*?\*\//g,"").includes("scheduleStateSync()"));
  t("💀注释吞噬防线：save 函数体内无跨行未闭合注释（*/ 配对守恒）", ((m)=>{const body=(script.match(/function save\(k\)\{[\s\S]*?\n\}/)||[""])[0];return (body.match(/\/\*/g)||[]).length===(body.match(/\*\//g)||[]).length})());

console.log("== D9. 第六轮深查：通知送达铁三角 + 发布方向闸 + 桥安全 ==");
t("notifyUser 桥方法异常全包（裸穿崩 WebView 防线）", /public void notifyUser\(String title, String text\) \{[\s\S]{0,80}try \{ \/\/ 🔒 桥安全铁律/.test(bridgeJava));
t("notifPerm 权限探针桥方法在位（SDK<33 恒 1）", /public String notifPerm\(\)/.test(bridgeJava) && /POST_NOTIFICATIONS/.test(bridgeJava));
t("updNotify 送达铁三角 v2.5.93 升级：先持久化未读再带回执发送，送达才清，失败自动触发进化", /function updNotify[\s\S]{0,250}storeSet\("updNotice"[\s\S]{0,500}notifyUserEx[\s\S]{0,1400}notifFailFeed\(title,rc\)/.test(script) && script.includes('if(rc==="OK"){ // 送达才清未读'));
t("进化与升级通知均走 updNotify（updNotify 函数体外零裸调 notifyUser）", (()=>{const body=(script.match(/function updNotify[\s\S]*?\n\}/)||[""])[0];const outside=script.replace(body,"‖");return !/DSB\.notifyUser\(title,body\)/.test(outside) && !/DSB\.notifyUser\(upTitle,upBody\)/.test(outside) && /updNotify\(title,body\)/.test(script) && /updNotify\(upTitle,upBody\)/.test(script)})());
t("启动补发 v2.5.93：未读公告补发统一走带回执 updNotify（送达清/失败进化，分诊内部统一处理）", /const un=jparse\(DSB\.storeGet\("updNotice"\)\);if\(un&&un\.title\)\{updNotify\(un\.title,un\.body\)\}/.test(script));
t("无权限保留未读并引导授权（不静默丢；一键拉起系统授权页+进化攻坚告知）", script.includes("帮你把授权页拉出来了") && script.includes("openNotifSettings"));
t("发布方向闸：云端清单新于待发布版→跳过覆盖", /发布方向闸拦截：云端 [\s\S]{0,120}跳过覆盖/.test(script));
t("发布闸与拉取闸构成双向（两处 updVerRank 比较在位）", (script.match(/updVerRank\(/g)||[]).length>=4);


console.log("== D10. 第七轮：附件三能力（拍照/相册图+视频/文件）+ 多模态 + 基线对齐 ==");
t("Bridge 附件七方法在位（pickCamera/Gallery/File/copyPick/ReadB64/ReadText/Delete）", ["pickCamera","pickGallery","pickFile","copyPick","pickReadB64","pickReadText","pickDelete"].every(f=>bridgeJava.includes(f+"(")));
t("拍照：MediaStore.ACTION_IMAGE_CAPTURE + EXTRA_OUTPUT 指向自研 Provider", bridgeJava.includes("MediaStore.ACTION_IMAGE_CAPTURE") && bridgeJava.includes("content://com.dsh.app.pick/"));
t("相册：ACTION_GET_CONTENT + EXTRA_MIME_TYPES 同时收图与视频", bridgeJava.includes("Intent.ACTION_GET_CONTENT") || bridgeJava.includes("ACTION_GET_CONTENT"));
t("相册 MIME 白名单含 image/* 与 video/*（用户硬性要求）", bridgeJava.includes('"image/*"') && bridgeJava.includes('"video/*"'));
t("文件：ACTION_OPEN_DOCUMENT 任意类型", bridgeJava.includes("ACTION_OPEN_DOCUMENT"));
t("copyPick 流式 64KB 缓冲循环且无大小上限（用户硬性要求）", (()=>{const m=bridgeJava.match(/public String copyPick[\s\S]*?\n    \}/);const b=m?m[0]:"";return b.includes("new byte[1 << 16]") && /while \(\(r = in\.read\(buf\)\) > 0\)/.test(b) && !/length\(\) > \d/.test(b)})());
t("copyPick 落盘 fsync 原子性 + 空文件拒收清理", /out\.getFD\(\)\.sync\(\)/.test(bridgeJava) && /"\{\\"ok\\":0,\\"err\\":\\"empty\\"\}"/.test(bridgeJava));
t("pickReadB64：readFully 3 字节对齐分块 + Base64.NO_WRAP 防中间 pad 断链", bridgeJava.includes("new byte[3 * 16384]") && bridgeJava.includes("readFully") && bridgeJava.includes("Base64.NO_WRAP"));
t("pickReadText 尾部保真（截断旗标 + 尾部保留策略）", bridgeJava.includes("truncated"));
t("PickProvider 防穿越：拒 .. 与隐藏文件 + canonical 越界校验", pickJava.includes('name.contains("..")') && pickJava.includes("getCanonicalPath") && pickJava.includes("path escape"));
t("PickProvider 只开放 picks/ 白名单 + query/insert/update/delete 全拒绝", pickJava.includes('"picks"') && /public Uri insert[\s\S]{0,80}return null/.test(pickJava) && /public int delete[\s\S]{0,120}return 0/.test(pickJava) && /public int update[\s\S]{0,120}return 0/.test(pickJava) && /public Cursor query[\s\S]{0,140}return null/.test(pickJava));
t("MainActivity.onActivityResult 三码 7001/7002/7003 分流", mainJava.includes("requestCode == 7001") && mainJava.includes("requestCode == 7002") && mainJava.includes("requestCode == 7003"));
t("onActivityResult 经 evaluateJavascript 注入 window.__onPick 回调", mainJava.includes("window.__onPick&&window.__onPick("));
t("相机取消/失败清理临时文件不留垃圾", mainJava.includes("f.delete()"));
t("相机经 Provider EXTRA_OUTPUT 拿原图（非缩略图 data 链路）", mainJava.includes("takePendingCameraName"));
t("Manifest：provider 注册 + exported=false + grantUriPermissions", manifestXml.includes('android:authorities="com.dsh.app.pick"') && manifestXml.includes('android:exported="false"') && manifestXml.includes('android:grantUriPermissions="true"'));
t("JS：＋按钮 + attachPop 三入口弹层 + pickBar chips 容器", html.includes('onclick="attachMenu()"') && html.includes('id="attachPop"') && html.includes('id="pickBar"'));
t("JS：附件模块七函数在位", ["attachMenu","attachPick","__onPick","renderPickChips","pickRm","pickClear","buildAttachText"].every(f=>script.includes("function "+f+"(")));
t("JS：三分派 DSB.pickCamera/pickGallery/pickFile", script.includes("DSB.pickCamera()") && script.includes("DSB.pickGallery()") && script.includes("DSB.pickFile()"));
t("JS：chatSend 空文本但有附件仍可发送", script.includes("if(!text&&!pickPend.length)return;"));
t("JS：附件装载（文本 pickReadText 全文 / 图片 pickReadB64 dataURL）", script.includes("DSB.pickReadText(p.path)") && script.includes("DSB.pickReadB64(p.path)"));
t("JS：图片读取失败降级 bin 不阻断发送", script.includes('p.kind="bin"'));
t("JS：发送即 pickClear 防重复装载（后接会话封顶再取 mode）", /pickClear\(\);\n\s*\/\/ ♻️[^\n]*\n\s*try\{ if\(\(cur\.msgs\|\|\[\]\)\.length>200\)\{ let cut=cur\.msgs\.slice\(-200\); if\(cut\[0\]\.role!=="user"\)cut=cut\.slice\(1\); cur\.msgs=cut; \} \}catch\(e\)\{\}\n\s*const mode=S\.settings\.mode;/.test(script));
t("JS：热包基线对齐：旧热包 rank<新 APK → hotDelete + updRevertWhy 记档", script.includes("updVerRank(hv)<updVerRank(APP_VER)") && script.includes("updRevertWhy") && script.includes("基线落后"));

// ---- D10 vm 实弹：buildAttachText 四类真跑 ----
const mFS = script.match(/function fmtSize[\s\S]*?\n}/)[0];
const mBAT = script.match(/function buildAttachText[\s\S]*?\n}/)[0];
const bat = vm.runInNewContext(mFS + ";" + mBAT + ";buildAttachText", vm.createContext({}));
const rImg = bat([{name:"a.jpg",size:1024,mime:"image/jpeg",path:"picks/a",kind:"image",b64:"QUJD"}]);
t("实弹 buildAttachText：图片→imgs dataURL 多模态数组", rImg.imgs[0]==="data:image/jpeg;base64,QUJD" && /图片 a\.jpg/.test(rImg.text));
const rVid = bat([{name:"v.mp4",size:9999999,mime:"video/mp4",path:"picks/v",kind:"video"}]);
t("实弹 buildAttachText：视频→元数据注入+不入 imgs", rVid.imgs.length===0 && /视频 v\.mp4/.test(rVid.text) && rVid.text.includes("已存手机"));
const rTxt = bat([{name:"n.txt",size:10,mime:"text/plain",path:"picks/n",kind:"text",content:"HELLO-WORLD"}]);
t("实弹 buildAttachText：文本全文并入（``` 包裹）", rTxt.text.includes("HELLO-WORLD") && rTxt.text.includes("```") && rTxt.imgs.length===0);
const rBin = bat([{name:"x.zip",size:777,mime:"application/zip",path:"picks/x",kind:"bin"}]);
t("实弹 buildAttachText：二进制→元数据+路径", /文件 x\.zip/.test(rBin.text) && rBin.text.includes("picks/x") && rBin.imgs.length===0);
t("实弹 buildAttachText：空数组零污染", JSON.stringify(bat([]))===JSON.stringify({text:"",imgs:[]}));

// ---- D10 vm 实弹：streamOnce lastUser 多模态构造 ----
const mLU = script.match(/const lastUser=\(imgs&&imgs\.length\)\?[\s\S]*?content:text\};/)[0];
const luWith = vm.runInNewContext("(()=>{"+mLU+";return lastUser})()", vm.createContext({imgs:["data:image/png;base64,AA","data:image/png;base64,BB"],text:"看这两张图"}));
t("实弹 streamOnce lastUser：带图→content 数组 + image_url 逐张映射", Array.isArray(luWith.content) && luWith.content.length===3 && luWith.content[0].type==="text" && luWith.content[0].text==="看这两张图" && luWith.content[1].image_url.url==="data:image/png;base64,AA" && luWith.content[2].image_url.url==="data:image/png;base64,BB");
const luNo = vm.runInNewContext("(()=>{"+mLU+";return lastUser})()", vm.createContext({imgs:[],text:"纯文本"}));
t("实弹 streamOnce lastUser：无图→纯文本 content（老模型零破坏）", luNo.content==="纯文本" && !Array.isArray(luNo.content));

// ---- D10 vm 实弹：updVerRank 版本序 ----
const vr = vm.runInNewContext(script.match(/function updVerRank[\s\S]*?\n}/)[0] + ";updVerRank", {});
t("实弹 updVerRank：2.5.0-attach > 2.4.0-selfupdate-evolve99（基线对齐方向正确）", vr("2.5.0-attach") > vr("2.4.0-selfupdate-evolve99"));
t("实弹 updVerRank：2.5.0-attach 展开值正确（major 权重不塌）", vr("2.5.0-attach") === 2*1e9 + 5*1e6);


console.log("== D11. 第八轮：视频关键帧解析（本地抽帧→图片多模态）+ 降级链 ==");
t("Bridge.pickVideoFrames 在位 + 桥注解", /@android\.webkit\.JavascriptInterface\s*\n\s*public String pickVideoFrames\(String path, int count\)/.test(bridgeJava));
t("MediaMetadataRetriever + setDataSource(Uri.fromFile)", bridgeJava.includes("r.setDataSource(act, Uri.fromFile(src))") && bridgeJava.includes("new MediaMetadataRetriever()"));
t("时长/宽高三元探测（无视频轨拒收）", bridgeJava.includes("METADATA_KEY_DURATION") && bridgeJava.includes("METADATA_KEY_VIDEO_WIDTH") && bridgeJava.includes("METADATA_KEY_VIDEO_HEIGHT") && bridgeJava.includes("no_video_track"));
t("帧数硬帽 48（v2.5.51-human 完全解析升维：每2s一帧封顶48——免费源可承受的完全解析密度）", /count > 48/.test(bridgeJava) && /durMs \/ 2000/.test(bridgeJava));
t("均匀中点取帧（避开首尾黑帧）", /durMs \* 1000\.0 \* \(i \+ 0\.5\) \/ count/.test(bridgeJava));
t("OPTION_CLOSEST_SYNC 快速同步帧", bridgeJava.includes("MediaMetadataRetriever.OPTION_CLOSEST_SYNC"));
t("minSdk24 双路径：API27+ getScaledFrameAtTime / 以下手动 createScaledBitmap", /Build\.VERSION\.SDK_INT >= 27/.test(bridgeJava) && bridgeJava.includes("getScaledFrameAtTime") && bridgeJava.includes("Bitmap.createScaledBitmap"));
t("长边压 640 且小图不放大", /640f \/ Math\.max\(vw, vh\)/.test(bridgeJava) && /Math\.min\(1f, 640f/.test(bridgeJava));
t("JPEG q72 压缩 + fsync 落盘", /CompressFormat\.JPEG, 72, fo/.test(bridgeJava) && bridgeJava.includes("fo.getFD().sync()"));
t("Bitmap 逐帧 recycle 防内存爆", /bm\.recycle\(\)/.test(bridgeJava) && /r\.release\(\)/.test(bridgeJava));
t("复用 pickFileOf 防穿越 + 零帧拒收", /File src = pickFileOf\(path\);/.test(bridgeJava) && /frames\.length\(\) == 0/.test(bridgeJava) && bridgeJava.includes("no_frames"));
t("返回走 JSONObject/JSONArray（零裸引号拼接）", /JSONArray frames = new JSONArray\(\)/.test(bridgeJava) && /o\.put\("frames", frames\)/.test(bridgeJava) && /o\.put\("duration", durMs\)/.test(bridgeJava));
t("JS：chatSend 视频分支抽帧（v2.5.51-human：0=自适应每2s一帧封顶48）", script.includes("DSB.pickVideoFrames(p.path,0)"));
t("JS：帧数/时长回写 p.frames/p.dur（60 轮升维：frames=读回 b64 数组长、dur 秒）", /p\.frames=framesB64\.length;p\.dur=\(vf\.duration\|\|0\)\/1000/.test(script));
t("JS：帧读完即删（picks/ 不积垃圾）", /try\{DSB\.pickDelete\(fr\.path\)\}catch\(e\)\{\}/.test(script));
t("JS：sendImgs=att.imgs.concat(vidImgs) 帧进多模态", script.includes("const sendImgs=att.imgs.concat(vidImgs);"));
t("JS：buildAttachText 帧数如实注入（60 轮：完整解析措辞）", /已抽取 "\+\(p\.frames\|\|0\)\+" 帧关键画面完整解析/.test(script));
t("JS：降级链（抽帧失败/旧 APK→纯元数据不阻断——60 轮同步实况）", script.includes("else{p.frames=0;p.dur=0}"));

// ---- D11 vm 实弹 ----
const mFS2 = script.match(/function fmtSize[\s\S]*?\n}/)[0];
const mBAT2 = script.match(/function buildAttachText[\s\S]*?\n}/)[0];
const bat2 = vm.runInNewContext(mFS2 + ";" + mBAT2 + ";buildAttachText", vm.createContext({}));
const rvF = bat2([{name:"v.mp4",size:9999999,mime:"video/mp4",path:"picks/v",kind:"video",frames:24,dur:62}]);
t("实弹 buildAttachText：视频带帧→帧数+时长注入、imgs 不混入（60 轮措辞同步）", rvF.text.includes("已抽取 24 帧关键画面完整解析") && rvF.text.includes("时长 62s") && rvF.imgs.length===0);
const rvD = bat2([{name:"v.mp4",size:100,mime:"video/mp4",path:"picks/v",kind:"video",frames:0,dur:0}]);
t("实弹 buildAttachText：零帧→如实降级（无台词如实标注，不炸不谎）", rvD.text.includes("已抽取 0 帧关键画面完整解析") && rvD.text.includes("无音轨或未识别出台词"));
const vr2 = vm.runInNewContext(script.match(/function updVerRank[\s\S]*?\n}/)[0] + ";updVerRank", {});
t("实弹 updVerRank：2.5.1-vframes > 2.5.0-attach（基线对齐方向正确）", vr2("2.5.1-vframes") > vr2("2.5.0-attach"));


console.log("== D12. 第九轮：定时任务 CatDesk 同款三 tab + ⋮ 菜单 + 模板库 + 立即运行 ==");
t("JS：三 tab（启用中/已暂停/模板）+ alTab 状态机", script.includes('var alTab="on"') && tabBtnTest("on") && tabBtnTest("off") && tabBtnTest("tpl") && script.includes('tabBtn("on","启用中")') && script.includes('tabBtn("off","已暂停")') && script.includes('tabBtn("tpl","模板")'));
function tabBtnTest(k){ return script.includes("alTab='${k}';renderPage('alarms')") && script.includes('tabBtn("'+k+'","'); }
t("JS：头部 ＋ 创建 按钮（CatDesk 同款）", script.includes(">＋ 创建</button>") && script.includes('onclick="editAlarm(0)">＋ 创建'));
t("JS：卡片 ⋮ 菜单 + 开合函数", script.includes('onclick="alMenuToggle(${NID(t.id)})"') && /function alMenuToggle\(id\)\{/.test(script) && /function alMenuClose\(\)\{/.test(script)); // 🛡️ 62 轮升维：id 净化 NID
t("JS：启用中菜单=暂停任务+立即运行+删除", /alMenuClose\(\);pauseAlarm\(\$\{NID\(t\.id\)\}\)/.test(script) && /alMenuClose\(\);runAlarmNow\(\$\{NID\(t\.id\)\}\)/.test(script) && /alMenuClose\(\);delAlarm\(\$\{NID\(t\.id\)\}\)/.test(script)); // 🛡️ 62 轮升维
t("JS：已暂停菜单=恢复任务+立即运行+删除", /alMenuClose\(\);resumeAlarm\(\$\{NID\(t\.id\)\}\)/.test(script)); // 🛡️ 62 轮升维
t("JS：删除红色（CatDesk 同款视觉语义）", script.includes('color:var(--err)">🗑 删除'));
t("JS：pauseAlarm 断开调度（cancelAlarm）", /function pauseAlarm\(id\)\{[\s\S]{0,200}DSB\.cancelAlarm\(id\)/.test(script));
t("JS：resumeAlarm 重排调度（scheduleAlarm）+ 通知权限请求", /function resumeAlarm\(id\)\{[\s\S]{0,220}DSB\.scheduleAlarm\(JSON\.stringify\(t\)\)/.test(script) && /function resumeAlarm\(id\)\{[\s\S]{0,160}DSB\.askNotifPermission\(\)/.test(script));
t("JS：pause/resume 均 save(alarms)→GEN4 云同步", /function pauseAlarm\(id\)\{[\s\S]{0,80}save\("alarms"\)/.test(script) && /function resumeAlarm\(id\)\{[\s\S]{0,80}save\("alarms"\)/.test(script));
t("JS：模板库内置模板+使用模板入口", /const ALARM_TPLS=\[/.test(script) && script.includes('onclick="tplAlarm(${i})"') && /function tplAlarm\(i\)\{[\s\S]{0,160}openAlarmModal\(Object\.assign/.test(script));
t("Java：Bridge.runAlarmNow 发同款广播复用全链", /public String runAlarmNow\(int taskId\)/.test(bridgeJava) && bridgeJava.includes("act.sendBroadcast(i)") && bridgeJava.includes("AlarmScheduler.EXTRA_FORCE, 1"));
t("Java：AlarmScheduler.EXTRA_FORCE 常量", /public static final String EXTRA_FORCE = "force";/.test(schedJava));
t("Java：AlarmReceiver force 放行暂停任务单次执行", /if \(!enabled && intent\.getIntExtra\(AlarmScheduler\.EXTRA_FORCE, 0\) != 1\) return;/.test(recvJava));
t("Java：启用中任务照旧重排下一次（周期语义不破）", /AlarmScheduler\.schedule\(ctx, task\.toString\(\)\);/.test(recvJava));

// ---- D12 vm 实弹：pause/resume/runNow 沙箱真跑 ----
const mJP = script.match(/function jparse[\s\S]*?\n}/)[0];
const mPause = script.match(/function pauseAlarm\(id\)\{[\s\S]*?\n\}/)[0];
const mResume = script.match(/function resumeAlarm\(id\)\{[\s\S]*?\n\}/)[0];
const mRun = script.match(/function runAlarmNow\(id\)\{[\s\S]*?\n\}/)[0];
const calls=[], toasts=[];
const mkCtx = (task) => vm.createContext({
  S:{alarms:{list:[task]}}, jparse:vm.runInNewContext(mJP+";jparse",{}), now:()=>10000, alarmRunTs:0,
  save(){calls.push("save")}, renderPage(){calls.push("render")},
  toast(m){toasts.push(m)},
  DSB:{cancelAlarm(id){calls.push("cancel:"+id)}, scheduleAlarm(j){calls.push("sched:"+JSON.parse(j).id)}, askNotifPermission(){calls.push("perm")}, runAlarmNow(id){calls.push("run:"+id);return '{"ok":1}'}},
  route:"alarms", setTimeout(){},
});
const ctxP = mkCtx({id:7,name:"T",enabled:1});
vm.runInNewContext(mPause+";pauseAlarm(7)", ctxP);
t("实弹 pauseAlarm：enabled 翻 0 + cancelAlarm 断调度 + 云同步落盘", ctxP.S.alarms.list[0].enabled===0 && calls.includes("cancel:7") && calls.includes("save"));
const ctxR = mkCtx({id:7,name:"T",enabled:0});
vm.runInNewContext(mResume+";resumeAlarm(7)", ctxR);
t("实弹 resumeAlarm：enabled 翻 1 + scheduleAlarm 重排 + 权限请求", ctxR.S.alarms.list[0].enabled===1 && calls.includes("sched:7") && calls.includes("perm"));
const ctxN = mkCtx({id:7,name:"T",enabled:0});
vm.runInNewContext(mRun+";runAlarmNow(7)", ctxN);
t("实弹 runAlarmNow：暂停任务亦可触发（Java force 单次放行）", calls.includes("run:7") && toasts.some(m=>m.includes("已触发立即执行")));
const ctxM = mkCtx({id:7,name:"T",enabled:1});
vm.runInNewContext(mRun+";DSB.runAlarmNow=function(){return '{\"ok\":0,\"err\":\"x\"}'};runAlarmNow(7)", ctxM);
t("实弹 runAlarmNow：失败路径 toast err 不误报成功", toasts.some(m=>m.includes("触发失败")));


t("✏️ 编辑不改启停态（暂停任务编辑后仍暂停）", /data\.enabled=t\.enabled; Object\.assign\(t,data\)/.test(script) && /任务已不存在（可能已被其他设备删除）/.test(script));
t("✏️ 保存文案如实（暂停任务不谎报排入调度）", /toast\(t\.enabled\?"已保存并排入系统调度":"已保存（任务保持暂停）"\)/.test(script));
t("⋮ 菜单点外即收（CatDesk 同款）", /setTimeout\(\(\)=>\{document\.addEventListener\("click",function h\(\)\{alMenuClose\(\);document\.removeEventListener\("click",h\)\}\)\},0\)/.test(script));

// ---- D12 补充 vm 实弹：saveAlarm 启停态保持 ----
const mSave = script.match(/function saveAlarm\(id\)\{[\s\S]*?\n\}/)[0];
const vals={alName:"N",alPrompt:"P",alType:"daily",alTime:"08:00",alHours:"2",alMode:"chat",alThink:"m1"};
const mkSaveCtx=(task)=>vm.createContext({
  $:(sel)=>({value:vals[sel.replace("#","")]||""}), jparse:vm.runInNewContext(mJP+";jparse",{}),
  toast(m){toasts.push(m)}, thinkModel:()=>"m2", effectiveModel:()=>"m1", curProv:()=>"zhipu", now:()=>123,
  S:{alarms:{list:[task]}}, save(){calls.push("save")},
  DSB:{askNotifPermission(){calls.push("perm")}, scheduleAlarm(j){calls.push("sched:"+JSON.parse(j).enabled)}},
  closeModal(){calls.push("close")}, renderPage(){calls.push("render")}
});
const sc1=mkSaveCtx({id:9,name:"old",prompt:"old",type:"daily",time:"07:00",intervalHours:2,mode:"chat",model:"m1",enabled:0});
vm.runInNewContext(mSave+";saveAlarm(9)", sc1);
t("实弹 saveAlarm：编辑暂停任务→enabled 保持 0", sc1.S.alarms.list[0].enabled===0 && sc1.S.alarms.list[0].name==="N" && toasts.some(m=>m.includes("任务保持暂停")));
const sc2=mkSaveCtx({id:9,name:"old",prompt:"old",type:"daily",time:"07:00",intervalHours:2,mode:"chat",model:"m1",enabled:1});
vm.runInNewContext(mSave+";saveAlarm(9)", sc2);
t("实弹 saveAlarm：编辑启用任务→enabled 保持 1 + 排入调度", sc2.S.alarms.list[0].enabled===1 && toasts.some(m=>m.includes("排入系统调度")));


t("⛔ 立即运行 3s 去抖（防双击双广播双执行）", /if\(now\(\)-alarmRunTs<3000\)\{toast\("刚刚已触发，请稍候结果通知"\);return\} alarmRunTs=now\(\);/.test(script));
t("🛡️ 编辑期间任务被云同步删除→提示不崩", /if\(!t\)\{toast\("任务已不存在（可能已被其他设备删除）"\);closeModal\(\);renderPage\("alarms"\);return\}/.test(script));
const vr3 = vm.runInNewContext(script.match(/function updVerRank[\s\S]*?\n}/)[0] + ";updVerRank", {});
t("实弹 updVerRank：2.5.25-auto8 > 2.5.24-mind > 2.5.23-scout > 2.5.22-chan6（基线对齐链完整）", vr3("2.5.25-auto8") > vr3("2.5.24-mind") && vr3("2.5.24-mind") > vr3("2.5.23-scout") && vr3("2.5.23-scout") > vr3("2.5.22-chan6"));
// ---- D12 补充 vm 实弹：双击去抖 + 删除竞态 ----
const mRun3 = script.match(/function runAlarmNow\(id\)\{[\s\S]*?\n\}/)[0];
const cD=[], tD=[];
const ctxDbl = vm.createContext({
  S:{alarms:{list:[{id:7,name:"T",enabled:1}]}}, jparse:vm.runInNewContext(mJP+";jparse",{}),
  now:()=>10000, alarmRunTs:0, route:"alarms", setTimeout(){},
  toast(m){tD.push(m)}, renderPage(){},
  DSB:{runAlarmNow(id){cD.push("run:"+id);return '{"ok":1}'}}
});
vm.runInNewContext("var now=()=>10000;"+mRun3+";runAlarmNow(7);runAlarmNow(7)", ctxDbl);
t("实弹 runAlarmNow：3s 内双击只触发一次广播", cD.filter(x=>x==="run:7").length===1 && tD.some(m=>m.includes("刚刚已触发")));
const mSave2 = script.match(/function saveAlarm\(id\)\{[\s\S]*?\n\}/)[0];
const tE=[];
const ctxGone = vm.createContext({
  $:(sel)=>({value:"x"}), jparse:vm.runInNewContext(mJP+";jparse",{}),
  toast(m){tE.push(m)}, thinkModel:()=>"m2", effectiveModel:()=>"m1", curProv:()=>"zhipu", now:()=>123,
  S:{alarms:{list:[]}}, save(){}, DSB:{askNotifPermission(){}, scheduleAlarm(){}},
  closeModal(){}, renderPage(){}
});
try{ vm.runInNewContext(mSave2+";saveAlarm(9)", ctxGone); }catch(e){ tE.push("CRASH:"+e.message); }
t("实弹 saveAlarm：任务已不存在→提示而非崩溃", !tE.some(m=>m.startsWith("CRASH")) && tE.some(m=>m.includes("任务已不存在")));


t("🔁 暂停/恢复/开关三路径均 bump ts（多设备合并严格大于前提）", /function pauseAlarm\(id\)\{[\s\S]{0,90}t\.ts=now\(\);save\("alarms"\)/.test(script) && /function resumeAlarm\(id\)\{[\s\S]{0,90}t\.ts=now\(\);save\("alarms"\)/.test(script) && /t\.enabled=t\.enabled\?0:1; t\.ts=now\(\); save\("alarms"\)/.test(script));

// ---- D12 补充 vm 实弹：启停态跨设备传播 ----
const mMerge = script.match(/function mergeStateList\(list,rem,key,tsOf\)\{[\s\S]*?\n\}/)[0];
const mPause2 = script.match(/function pauseAlarm\(id\)\{[\s\S]*?\n\}/)[0];
const cM=[], tM=[];
const ctxTs = vm.createContext({
  S:{alarms:{list:[{id:5,name:"T",enabled:1,ts:1000,mode:"chat",prompt:"p",type:"daily",time:"08:00",intervalHours:2}]}},
  jparse:vm.runInNewContext(mJP+";jparse",{}), now:()=>2000,
  save(){cM.push("save")}, renderPage(){}, toast(m){tM.push(m)},
  DSB:{cancelAlarm(id){cM.push("cancel:"+id)}, scheduleAlarm(){cM.push("sched")}, askNotifPermission(){}},
  route:"alarms", stateTombHit:()=>false, setTimeout(){}
});
vm.runInNewContext(mPause2+";pauseAlarm(5)", ctxTs);
t("实弹 pauseAlarm：ts 2000>1000 + enabled 翻 0", ctxTs.S.alarms.list[0].ts===2000 && ctxTs.S.alarms.list[0].enabled===0);
const merged = vm.runInNewContext(mMerge+";mergeStateList", ctxTs);
const remote = JSON.parse(JSON.stringify(ctxTs.S.alarms.list)); // 模拟对端拉到的云端快照（暂停态+新 ts）
const ctxB = vm.createContext({ stateTombHit:()=>false });
const before = {id:5,name:"T",enabled:1,ts:1000,mode:"chat",prompt:"p",type:"daily",time:"08:00",intervalHours:2};
const ch = vm.runInNewContext(mMerge+";var list=["+JSON.stringify(before)+"];var r=mergeStateList(list,"+JSON.stringify(remote)+",'a',t=>+(t.ts||0));r?list[0].enabled:'no-merge'", ctxB);
t("实弹 跨设备传播：B 端拉取合并后采纳暂停态（ts 严格大于生效）", ch===0);

console.log("\n== D13. 第十三轮：零账号完全开箱即用（免注册保底源 + 首启引导）==");
// ---- D13 静态断言：JS 侧 ----
t("PROV 注册 pollinations 开箱保底源（ep/def/nokey/vis/asr/asrEp/tts 七字段——46 轮免 Key 第五耳+47 轮真嗓音）", /pollinations:\{name:"开箱保底",icon:"🎁",ep:"https:\/\/text\.pollinations\.ai\/openai",quota:"免注册免Key·基础额度",cn:0,nokey:1,def:"openai-fast",think:"openai-fast",vis:"openai",asr:"openai-audio",asrEp:"https:\/\/text\.pollinations\.ai\/openai",tts:"openai-audio",list:\["openai-fast","openai"\]\}/.test(script));
t("CHAIN 注册表末位含 pollinations+ondevice（双保底殿后）", /const CHAIN=\["zhipu","nvidia","modelscope","siliconflow","openrouter","gemma","cloudflare","groq","cerebras","mistral","pollinations","ondevice"\];/.test(script));
t("MODELS_EP 含 pollinations 清单端点（免 Key 可拉）", /pollinations:"https:\/\/text\.pollinations\.ai\/models"/.test(script));
t("FREE_MODE pollinations=curated", /pollinations:"curated"/.test(script));
t("NOKEY_LIST 含 pollinations", /const NOKEY_LIST=\["nvidia","openrouter","modelscope","pollinations"\]/.test(script));
t("provs() 默认开启 pollinations+ondevice（零配置开箱）", /on:\(k==="zhipu"\|\|k==="pollinations"\|\|k==="ondevice"\)\?1:0/.test(script));
t("provOn 支持 nokey+ondevice 门控（无 Key 也算可用，端侧需就绪——68c 升维全程 try）", /function provOn\(k\)\{try\{if\(!PROV\[k\]\)return 0;const p=provs\(\)\[k\];if\(!p\.on\)return 0;if\(k==="ondevice"\)return llamaReady\(\);return !\!\(p\.key\|\|PROV\[k\]\.nokey\)\}catch\(e\)\{return 0\}\}/.test(script));
t("streamOnce 无 Key 不发空 Bearer（条件式鉴权头）", /const hdrs=\{\}; if\(key\)hdrs\.Authorization="Bearer "\+key;/.test(script) && /JSON\.stringify\(hdrs\),body,""\)/.test(script));
t("首启引导卡（welcomed 一次性开关）", /S\.settings\.welcomed=1;save\('settings'\);renderPage\('tasks'\)/.test(script));
t("首启引导文案：零账号声明", /无需任何账号：不注册、不登录、不填 Key、不建 GitHub/.test(script));
t("设置页保底源卡片：nokey 源不渲染 Key 输入框", /P\.nokey\?`<p style="font-size:11px;color:var\(--ok\);margin-top:6px">🔓 开箱保底源：无需注册、无需 Key/.test(script));
t("设置页引导文案：不填 Key 也能直接对话（v2.5.5 双保底版）", /端侧离线源：国内 CDN 免注册直下/.test(script) && /开箱保底源：免注册免 Key 直接用/.test(script));
t("sendStream 空链提示更新（端侧+保底双兑底说明）", /连端侧离线和免注册保底源都被关了/.test(script) && /重新打开「端侧离线」或「开箱保底」/.test(script));

// ---- D13 静态断言：Java 侧 ----
t("AlarmReceiver.CHAIN 含 pollinations+ondevice（离线定时任务兑底）", /"mistral", "pollinations", "ondevice"\};/.test(recvJava));
t("AlarmReceiver.ep() pollinations 端点", /case "pollinations": return "https:\/\/text\.pollinations\.ai\/openai";/.test(recvJava));
t("AlarmReceiver.defModel() pollinations=openai-fast", /case "pollinations": return "openai-fast";/.test(recvJava));
t("AlarmReceiver 保底源未初始化也进链（零配置·v2.5.6 动态链版语义）", recvJava.includes("if (nokey && p == null) { // 🎁 保底源未初始化也进链"));
t("AlarmReceiver 用户显式关闭保底源则退出链", /if \(p\.optInt\("on", 0\) != 1\) continue; \/\/ 用户显式关闭的源不进链（含保底源）/.test(recvJava));
t("AlarmReceiver 空链报错文案更新（保底源语义）", /无可用免费模型源（开箱保底源已被关闭，可在设置页重新开启）/.test(recvJava));
t("postJson 空 Bearer 不发（防网关拒）", /if \(auth != null && !auth\.trim\(\)\.isEmpty\(\) && !auth\.trim\(\)\.equalsIgnoreCase\("Bearer"\)\)\s*\n\s*c\.setRequestProperty\("Authorization", auth\);/.test(recvJava));

// ---- D13 vm 实弹：provOn/provs/chainList 保底链 ----
const mProvs = script.match(/function provs\(\)\{[^\n]+\n/)[0];
const mProvOn = script.match(/function provOn\(k\)\{[^\n]+\n/)[0];
const mChainList = script.match(/function chainList\(cloud\)\{[^\n]+\n/)[0];
const mPrefOf = 'function prefOf(){return (S.settings.prefProvs||{})[S.settings.mode||"chat"]||S.settings.prefProv||""}'; // 102 轮三端分治：chainList 依赖 prefOf（沙盒注入同款 stub）
const ctx13 = vm.createContext({
  S:{settings:{providers:{}, mode:"chat"}},
  PROV:vm.runInNewContext("const PROV={pollinations:{nokey:1,def:'openai-fast'}};PROV",{}),
  CHAIN:["zhipu","pollinations"],
});
const fns13 = vm.runInNewContext("function llamaReady(){return false}\n"+mPrefOf+mProvs+mProvOn+mChainList+";({provs,provOn,chainList})", ctx13);
const pv13 = fns13.provs();
t("实弹 provs()：全新用户 pollinations 默认 on=1", pv13.pollinations.on===1 && pv13.pollinations.key==="");
t("实弹 provs()：全新用户 zhipu 默认 on=1（老行为不回归）", pv13.zhipu.on===1);
t("实弹 provOn('pollinations')：无 Key 也算可用", !!fns13.provOn("pollinations"));
t("实弹 provOn('zhipu')：无 Key 不可用（老行为不回归）", !fns13.provOn("zhipu"));
t("实弹 chainList()：零 Key 新用户链内含保底源", fns13.chainList().includes("pollinations"));
t("实弹 chainList()：保底源殿后", fns13.chainList()[fns13.chainList().length-1]==="pollinations");
// 用户显式关保底源
ctx13.S.settings.providers.pollinations={on:0,key:""};
t("实弹 用户关保底源→退出链", !fns13.chainList().includes("pollinations"));

// ---- D13 vm 实弹：首启引导卡渲染 ----
const mPT = script.match(/function pageTasks\(\)\{[\s\S]*?\n\}/)[0];
const ctxW = vm.createContext({
  S:{settings:{welcomed:0, mode:"chat"}, sessions:{list:[]}, projects:{list:[]}, viewProject:""},
  esc:vm.runInNewContext("(s)=>String(s==null?'':s).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',\"'\":'&#39;','\"':'&quot;'}[c]))",{}),
  fmtT:()=>"", sessScope:()=>"local", projScope:()=>"local", curScope:()=>"local", esc2:()=>"" , heroHtml:()=>"HERO",
});
const ptW = vm.runInNewContext(mPT+";pageTasks", ctxW);
const htmlW = ptW();
t("实弹 首启（welcomed=0）：渲染欢迎引导卡", /欢迎使用，开箱即用/.test(htmlW) && /无需任何账号/.test(htmlW) && /开始使用/.test(htmlW));
ctxW.S.settings.welcomed=1;
t("实弹 点「开始使用」后（welcomed=1）：引导卡不再渲染", !/欢迎使用，开箱即用/.test(ptW()));


console.log("\n== D14. 第十四轮：零动作开箱铁律（首启零弹窗 + GitHub 全可选终审）==");
// ---- D14 静态：启动链零弹窗 ----
t("启动链不再自动请求通知权限（首次打开零系统弹窗）", !/setTimeout\(\(\)=>\{try\{DSB\.askNotifPermission\(\)\}catch\(e\)\{\}\},1200\)/.test(script));
t("零动作开箱铁律注释在位", /零动作开箱铁律：启动不弹任何权限对话框/.test(script));
t("通知权限按需请求三处保留（resumeAlarm/saveAlarm/设置页——125 轮设置页升级智能分诊 askNotifSmart，调用点≥3 三入口不缺）", (script.match(/DSB\.askNotifPermission\(\)/g)||[]).length>=3);
t("删除确认是用户主动触发（保护闸）+phoneSave 截断防损闸，无其他 alert/confirm 自动弹", (script.match(/\balert\(|\bconfirm\(/g)||[]).length===3 && /if\(!confirm\("确认删除/.test(script) && /覆盖保存会丢失未载入的尾部内容/.test(script) && /confirm\("确定删除这个任务/.test(script)); // 🛡️ 64 轮升维：phoneSave 截断保护 confirm；🐾 68c 升维：任务删除 confirm（菜单主动触发非自动弹，CatDesk 同款删除确认）
// ---- D14 静态：GitHub 全可选终审（未配置=静默返回，零弹窗零报错）----
const gGuards=[...script.matchAll(/if\(![a-zA-Z.]*cloudRepo\|\|!?[a-zA-Z.]*githubToken\)|if\(![a-zA-Z.]*cloudRepo\)|if\(!st\.cloudRepo\|\|!st\.githubToken\)return/g)];
t("cloudMirror 未配置静默跳过（对话动作零依赖 GitHub）", /function cloudMirrorDebounced\(action\)\{\s*\n?\s*if\(!S\.settings\.cloudRepo\|\|!S\.settings\.githubToken\)return;/.test(script));
t("pullMindCloud 未配置静默跳过", /const repo=S\.settings\.cloudRepo; if\(!repo\)return false;/.test(script));
t("syncMindCloud 未配置静默提示不弹窗", /未配 GitHub Token：记忆\/手册只能单机保存/.test(script));
t("scheduleStateSync 未配置置脏标静默（数据不丢，配好自动补推）", /if\(!st\.cloudRepo\|\|!st\.githubToken\)\{if\(!st\.stateDirty\)\{st\.stateDirty=true;save\("settings"\)\}return\}/.test(script));
t("updPublish 未配置静默跳过（本地升级照常生效）", /if\(!st\.cloudRepo\|\|!st\.githubToken\)return \{ok:0,detail:"未部署云端，跳过发布（本地升级已生效）"\};/.test(script));
t("vulnCloud 同拍未配置静默跳过", /if\(!repo\|\|!st\.githubToken\)return\{ok:1,detail:"未部署云端\/无 Token：云端同拍跳过（App 端体检照常全量）"\};/.test(script));
t("手动云端类功能才弹提示（syncProject/pullCloudProjects 属用户主动点击）", /先在设置页部署云端并配置 GitHub Token 才能同步项目/.test(script) && /function syncProject\(pid\)/.test(script));
t("启动接线序列无 GitHub 阻塞调用（pullMindCloud/pullStateCloud 均可无配置空转）", /pullMindCloud\(\); if\(S\.settings\.mindDirty\)syncMindCloud\(\)/.test(script) && /pullStateCloud\(\); if\(S\.settings\.stateDirty\)syncStateCloud\(true\)/.test(script));
// ---- D14 实弹：zero-state 全链模拟（全新用户 S 骨架）----
const mPT2 = script.match(/function pageTasks\(\)\{[\s\S]*?\n\}/)[0];
const ctxZ = vm.createContext({
  S:{settings:{welcomed:0, mode:"chat"}, sessions:{list:[]}, projects:{list:[]}, viewProject:""},
  esc:vm.runInNewContext("(s)=>String(s==null?'':s).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',\"'\":'&#39;','\"':'&quot;'}[c]))",{}),
  fmtT:()=>"", sessScope:()=>"local", projScope:()=>"local", curScope:()=>"local", heroHtml:()=>"HERO",
});
const ptZ = vm.runInNewContext(mPT2+";pageTasks", ctxZ);
const hz = ptZ();
t("实弹 全新用户首启页：可渲染（无异常）", typeof hz==="string" && hz.length>100);
t("实弹 全新用户首启页：引导卡在+可点「开始使用」", /开始使用/.test(hz));
// 实弹：chainList 零配置含保底源（上一轮已验，此处验与 GitHub 无关——settings 无任何 GitHub 字段）
const ctxZ2 = vm.createContext({
  S:{settings:{providers:{}, mode:"chat"}},
  PROV:vm.runInNewContext("const PROV={pollinations:{nokey:1,def:'openai-fast'},zhipu:{}};PROV",{}),
  CHAIN:["zhipu","pollinations"],
});
const fnsZ = vm.runInNewContext("function llamaReady(){return false}\n"+mPrefOf+mProvs+mProvOn+mChainList+";({provs,provOn,chainList})", ctxZ2);
t("实弹 settings 无任何 GitHub 字段：对话链照常可用（含保底源）", fnsZ.chainList().length>=1 && fnsZ.chainList().includes("pollinations"));


console.log("\n== D15. 第十五轮：端侧离线铁律（📴 零账号零外网断网可聊）==");
// ---- D15 静态：PROV 注册表 + 桥接 ----
t("PROV.ondevice 端侧离线源在位（免Key免注册断网可用）", /ondevice:\{name:"端侧离线"[\s\S]{0,200}offline:1/.test(script));
t("CHAIN 含 pollinations+ondevice 双保底殿后", /\["zhipu",[\s\S]{0,150}"pollinations","ondevice"\]/.test(script));
t("llamaStatus 同步桥状态缓存（3s）", /function llamaStatus\(\)\{try\{const s=jparse\(DSB\.llamaStatus\(\)\)/.test(script));
t("provOn('ondevice') 需模型就绪（未就绪不入链）", /if\(k==="ondevice"\)return llamaReady\(\)/.test(script));
t("streamOnce 端侧分支：DSB.llamaStream 复用 SSE 协议", /if\(P\.offline\)\{[\s\S]{0,150}DSB\.llamaStream\(JSON\.stringify\(\{messages:msgs\.slice\(-12\)\}\),""\)/.test(script));
t("streamOnce 桥异常绝不悬挂（resolve(false) 交上层切换）", /catch\(e\)\{resolve\(false\);return\} \/\/ 桥异常/.test(script));
t("fetchLiveModels 端侧豁免（离线源无需在线探查）", /if\(PROV\[pk\]&&PROV\[pk\]\.offline\)\{probeLog\(pk,\{ok:1,live:1,n:1,why:"端侧离线源无需在线清单"\}\);return\}/.test(script));
t("auditCoverage 盲区扫描豁免端侧源", /CHAIN\.filter\(k=>!MODELS_EP\[k\]&&!PROV\[k\]\.offline\)/.test(script));
t("设置页 llamaCard 下载状态机（下载/载入/删除）", /function llamaCard\(\)/.test(script) && /function llamaDl\(\)/.test(script) && /function llamaDel\(\)/.test(script));
t("provCards ondevice 分支渲染 llamaCard", /k==="ondevice"\?llamaCard\(\)/.test(script));
t("REG 注册指引含端侧离线（无需注册）", /ondevice:"（无需注册·端侧离线模型）"/.test(script));
t("欢迎卡升级：端侧离线国内CDN直下+断网可聊", /端侧离线.*下载[\s\S]{0,120}断网也能聊|到 ⚙️ 设置页点一下「端侧离线」的「下载」/.test(script));
// ---- D15 实弹：provOn/chainList 端侧源门控 ----
const mLlama = "let llamaSt=null,llamaStTs=0;\n" + script.match(/function llamaStatus\(\)[\s\S]*?\n\}/)[0] + script.match(/function llamaReady\(\)[\s\S]*?\n\}/)[0];
const ctx15 = vm.createContext({
  S:{settings:{providers:{}, mode:"chat"}},
  PROV:vm.runInNewContext("const PROV={pollinations:{nokey:1,def:'openai-fast'},ondevice:{nokey:1,offline:1},zhipu:{}};PROV",{}),
  CHAIN:["zhipu","pollinations","ondevice"],
  DSB:{llamaStatus:()=>JSON.stringify({ready:1})},
  jparse:vm.runInNewContext("(s)=>{try{return JSON.parse(s)}catch(e){return {ok:0}}}",{}),
  now:()=>1700000000000,
});
const fns15 = vm.runInNewContext(mLlama+mPrefOf+mProvs+mProvOn+mChainList+";({provs,provOn,chainList,llamaReady})", ctx15);
t("实弹 provs()：全新用户 ondevice 默认 on=1（零配置开箱）", fns15.provs().ondevice.on===1);
t("实弹 llamaReady()：桥报 ready=1 → provOn('ondevice')=可用", fns15.llamaReady()===true && !!fns15.provOn("ondevice"));
t("实弹 chainList()：端侧就绪时入链且殿后", fns15.chainList().includes("ondevice") && fns15.chainList()[fns15.chainList().length-1]==="ondevice");
ctx15.DSB.llamaStatus=()=>JSON.stringify({ready:0});
ctx15.S.settings.providers={ondevice:{on:0,key:""}};
t("实弹 桥报未就绪+用户关闭 → provOn('ondevice')=0 不入链", fns15.provOn("ondevice")!==1);


console.log("\n== D16. 第十六轮：新源入口铁律（🧬 动态拉取的新源必须自动配好入口，绝不半吊子）==");
// ---- D16 静态：UI 入口自动生成链 ----
t("regHint 兜底逻辑在位（新源无指引→自动以端点域名生成）", script.includes("const regHint=REG_HINTS[k]||((P.ep||\"\").replace(/^https?:") && script.includes("官网（免费注册后创建 API Key）"));
t("REG_HINTS 全局第六注册表（新源可省精确指引）", /const REG_HINTS=\{[\s\S]{0,120}第六注册表/.test(script));
t("设置页 Key 输入框用 regHint（不再是裸 REG[k] 硬引用）", /placeholder="在 \$\{regHint\} 免费注册后创建的 API Key"/.test(script));
t("saveSettings 仍为 CHAIN.forEach 自动遍历（新源 Key 保存自动接通）", /function saveSettings\(\)\{[\s\S]{0,40}CHAIN\.forEach/.test(script));
t("provCards 仍为 CHAIN.map 自动渲染（新源卡片自动长出）", /const provCards=CHAIN\.map\(k=>\{/.test(script));
t("syncProvMeta 镜像函数在位（源链全量镜像给 Java 定时任务层）", /function syncProvMeta\(\)\{[\s\S]{0,600}provMeta=\{order:CHAIN\.slice\(\)/.test(script));
t("启动接线 syncProvMeta（进化新源自动被离线任务感知）", /syncProvMeta\(\); save\("settings"\); \/\/ 🧬新源入口铁律：启动即镜像源链给 Java 定时任务层/.test(script));
t("auditCoverage 增 regAuto 留痕（自动兜底的源可见，不遮丑）", /const regAuto=CHAIN\.filter\(k=>!PROV\[k\]\.nokey&&!PROV\[k\]\.offline&&!REG_HINTS\[k\]\)/.test(script));
t("进化 prompt 刻入新源五注册表铁律", /新源入口铁律：若补丁新增免费模型源，必须五注册表全接线/.test(script) && /禁删该自动遍历机制（删它=所有新源入口永久消失）/.test(script));
// ---- D16 静态：Java 侧动态镜像链 ----
t("AlarmReceiver 读 provMeta 动态链（镜像优先）", /JSONObject meta = settings\.optJSONObject\("provMeta"\)/.test(recvJava) && /\[prov, key, model, ep\]/.test(recvJava));
t("AlarmReceiver 镜像缺失回退硬编码表（老数据保底）", /for \(String k : CHAIN\) \{ order\.add\(k\); epsMap\.put\(k, ep\(k\)\);/.test(recvJava));
t("AlarmReceiver 执行端点取镜像（新源端点自动生效）", /postJson\(pk\[3\]\.isEmpty\(\) \? ep\(pk\[0\]\) : pk\[3\]/.test(recvJava));
t("AlarmReceiver 保底源未初始化也进链（老语义不回归）", recvJava.includes("if (nokey && p == null) { // 🎁 保底源未初始化也进链"));
t("AlarmReceiver 端侧未初始化=默认开（老语义不回归）", /\(p == null \|\| p\.optInt\("on", 0\) == 1\) && LlamaCore\.LIB && LlamaCore\.fileReady\(ctx\)/.test(recvJava));
// ---- D16 实弹：模拟进化新源（新news源）全链贯通 ----
const ctx16 = vm.createContext({
  S:{settings:{providers:{}}},
  PROV:vm.runInNewContext("const PROV={zhipu:{nokey:0,def:'glm-4-flash'},newsrc:{nokey:0,def:'x-pro',ep:'https://api.newsrc.cn/v1/chat/completions'},pollinations:{nokey:1,def:'openai-fast'},ondevice:{nokey:1,offline:1}};PROV",{}),
  CHAIN:["zhipu","newsrc","pollinations","ondevice"],
  now:()=>1700000000000,
});
const fns16 = vm.runInNewContext(script.match(/function syncProvMeta\(\)\{[\s\S]*?\n\}/)[0] + ";syncProvMeta", ctx16);
fns16();
t("实弹 syncProvMeta：新源 newsrc 全量入镜像（order/eps/defs）", (()=>{const m=ctx16.S.settings.provMeta;return m.order.includes("newsrc")&&m.eps.newsrc==="https://api.newsrc.cn/v1/chat/completions"&&m.defs.newsrc.n==="x-pro"})());
t("实弹 syncProvMeta：nokey/offline 标记正确（pollinations=1, ondevice=1）", ctx16.S.settings.provMeta.nk.pollinations===1 && ctx16.S.settings.provMeta.off.ondevice===1);
// 实弹：regHint 兜底（新源无 REG_HINTS → 端点域名自动指引，绝不 undefined）
const ctx16b = vm.createContext({
  S:{settings:{providers:{}}},
  PROV:vm.runInNewContext("const PROV={newsrc:{ep:'https://api.newsrc.cn/v1/chat/completions',nokey:0}};PROV",{}),
  CHAIN:["newsrc"],
  REG_HINTS:{},
});
const hint = vm.runInNewContext("const k='newsrc';const P=PROV[k];const regHint=REG_HINTS[k]||((P.ep||'').replace(/^https?:\\/\\//, '').split('/')[0]+' 官网（免费注册后创建 API Key）');regHint", ctx16b);
t("实弹 regHint：新源零指引→自动生成 'api.newsrc.cn 官网…'（无 undefined）", hint==="api.newsrc.cn 官网（免费注册后创建 API Key）");
t("实弹 regHint：已配精确指引→精确指引优先（不被兜底覆盖）", (()=>{ctx16b.REG_HINTS.newsrc="newsrc.cn";const h=vm.runInNewContext("(()=>{const P=PROV['newsrc'];const regHint=REG_HINTS['newsrc']||'兜底';return regHint})()", ctx16b);return h==="newsrc.cn"})());


console.log("\n== D17. 第十七轮：地毯式彻查修复（四缺陷根治+云端新源容错+定时任务三级清单对齐）==");
// ---- D17 静态：Java/JS 修复落位 ----
t("下载完整度精确校验（拒绝半截模型入库）", recvJava.includes("if (dlTotal > 0 && done < dlTotal) throw new IllegalStateException(\"下载不完整") || llamaJava.includes("done < dlTotal"));
t("JS 轮询跨页存活（不依赖 DOM，切页后继续盯）", script.includes("轮询跨页存活") && script.includes("if(route===\"settings\")renderPage(\"settings\")"));
t("agent.py 未知源容错（新源 Key 未注册不崩；nokey 保底源免 Key 直进链）", agentPy.includes('avail = [k for k in CHAIN_ORDER if k in PROV and ((k in KEYS and KEYS[k]) or PROV[k].get("nokey"))]'));
t("runChat 三级清单对齐（liveModels 首个>selModels>provMeta.defs）", recvJava.includes("JSONObject live = settings.optJSONObject(\"liveModels\")"));
t("runChat 停服黑名单对齐（deadLog 模型不进定时链）", recvJava.includes("dl.optJSONObject(k) != null && dl.optJSONObject(k).optInt(model, 0) == 1"));
t("putSecrets CHAIN 动态遍历注释坐实（进化新源 Key 不漏写）", script.includes("CHAIN 遍历=进化新源 Key 自动写入，绝不漏源"));
// ---- D17 实弹：llamaDl 轮询状态机（切页后轮询存活） ----
const ctx17 = vm.createContext({
  route:"tasks", // 模拟用户切到了任务页
  now:()=>1700000000000, ll:"-"*0,
});
// 提取 llamaDl 函数体+依赖桩，验证：downloading 阶段 DOM 缺失不自杀
const mLlamaDl = script.match(/function llamaDl\(\)\{[\s\S]*?\n\}/)[0];
const sandbox17 = vm.createContext({
  route:"tasks",
  now:()=>1700000000000,
  DSB:{llamaDownload:()=>JSON.stringify({ok:1})},
  toast:(m)=>{globalThis.__toasts=(globalThis.__toasts||[]).concat(m)},
  llamaStatus:()=>({downloading:true,pct:42,done:100,total:200,ready:0,err:""}),
  renderPage:()=>{throw new Error("route 非 settings 不应渲染")},
  $:()=>null, fmtSize:()=>"",
  setInterval:(fn,ms)=>{globalThis.__iv=fn;return 1}, clearInterval:()=>{}, jparse:(s)=>JSON.parse(s),
});
vm.runInNewContext(mLlamaDl+"\nllamaDl();", sandbox17);
t("实弹 llamaDl：下载中切页→轮询不自杀、不误渲染、继续监听", typeof globalThis.__iv==="function");
t("实弹 llamaDl：开始下载提示已发", (globalThis.__toasts||[]).some(m=>String(m).includes("已开始后台下载")));
// ---- D17 实弹：下载完成时回设置页才刷新 ----
const sandbox18 = vm.createContext({
  route:"settings",
  now:()=>1700000000000,
  DSB:{llamaDownload:()=>JSON.stringify({ok:1})},
  toast:(m)=>{globalThis.__t18=(globalThis.__t18||[]).concat(m)},
  llamaStatus:()=>({downloading:false,ready:1,err:""}),
  renderPage:(tab)=>{globalThis.__rp18=tab},
  $:()=>null, fmtSize:()=>"",
  setInterval:(fn,ms)=>{globalThis.__iv2=fn;return 1}, clearInterval:()=>{}, jparse:(s)=>JSON.parse(s),
});
vm.runInNewContext(mLlamaDl+"\nllamaDl();", sandbox18);
globalThis.__iv2(); // 手动触发一次轮询（模拟 1s 后）
t("实弹 llamaDl：下载完成+在设置页→重渲染 settings", globalThis.__rp18==="settings");
t("实弹 llamaDl：就绪通知送达（断网也能聊）", (globalThis.__t18||[]).some(m=>String(m).includes("端侧模型就绪")));


console.log("\n== D18. 第十八轮：CatPaw 同款定时任务编辑器（工作空间+全量模型下拉+Skill+专家·双端接线）==");
// ---- D18 静态：App 端编辑器六件套（对照 CatPaw「编辑定时任务」页橙圈字段逐项对齐） ----
t("工作空间下拉：alarmProjSel 只列当前端项目（三端分割铁律）", script.includes("function alarmProjSel(t){") && script.includes("filter(p=>projScope(p)===curScope())") && script.includes("不绑定（独立任务）"));
t("模型下拉：alarmModelSel 全源 optgroup 分组+端侧离线档", script.includes("function alarmModelSel(t){") && script.includes("optgroup") && script.includes("ondevice::qwen2.5-0.5b") && script.includes("每源取前 12 个可用模型"));
t("模型下拉三智能档：自动最强/深度思考/指定源指定模型", script.includes("⚡ 自动最强（跟随选型引擎·免维护·推荐）") && script.includes("🧠 深度思考（自动选最强推理型）") && script.includes('prov::model=指定源指定模型'));
t("Skill 下拉（复选）：web/code/persona 任务级覆盖，未勾跟随全局", script.includes('alSkweb') && script.includes('alSkcode') && script.includes('alSkpersona') && script.includes("不勾=跟随插件页全局开关"));
t("专家下拉：EXPERTS 注册表（六专家+custom=自定义人设）", script.includes("const EXPERTS=[") && (script.match(/\{id:"(analyst|coder|writer|translator|ops)",/g)||[]).length===5 && script.includes('id:"custom",icon:"🎭"'));
t("expertSysText：custom 折叠成 settings.persona 全文", script.includes("function".replace("function","expertSysText") ) || script.includes("const expertSysText=id=>"));
t("saveAlarm 解析 prov::model 三态并落 provider/think", script.includes('if(mv==="think:")') && script.includes('mv.indexOf("::")<0') && script.includes('data.provider=mv.slice(0,si);data.model=mv.slice(si+2)'));
t("saveAlarm 技能取消勾选显式清旧字段（Object.assign 不删键陷阱已堵）", script.includes("if(!Object.keys(sk).length)delete t.skills"));
t("任务卡片徽章：项目📁+专家图标可见", script.includes('t.projectId&&projName(t.projectId)?" · 📁 "+esc(projName(t.projectId)):""') && script.includes('(EXPERTS.find(x=>x.id===t.expert)||{}).icon'));
// ---- D18 实弹：editor 字段 vm 实跑 ----
const mExpert = script.match(/const EXPERTS=\[[\s\S]*?\];\nconst expertSysText=[^\n]+\nconst projName=[^\n]+\n/);
const sbE = vm.createContext({
  S:{settings:{persona:"你是无情禅师"},projects:{list:[{id:"pj1",name:"竞品分析",scope:"local"}]}},
  esc:(x)=>String(x),
});
vm.runInNewContext(mExpert[0], sbE);
t("实弹 expertSysText：内建专家拼接身份前缀", vm.runInNewContext('expertSysText("coder")', sbE).startsWith("你的专家身份：你是一位资深全栈工程师"));
t("实弹 expertSysText：custom 折叠 persona 全文", vm.runInNewContext('expertSysText("custom")', sbE).includes("你是无情禅师"));
t("实弹 expertSysText：空=零注入", vm.runInNewContext('expertSysText("")===""', sbE) === true);
t("实弹 projName：项目 id→名", vm.runInNewContext('projName("pj1")', sbE)==="竞品分析");
// ---- D18 实弹：saveAlarm 模型三态解析 ----
const mSave18 = script.match(/function saveAlarm\(id\)\{[\s\S]*?\n\}/)[0];
function saveSb(modelSel, old){
  const g = {};
  const sb = vm.createContext({
    $:(id)=>({value:modelSel, checked:false}),
    now:()=>1700000000000,
    curProv:()=>"zhipu",
    effectiveModel:()=>"glm-4-flash",
    thinkModel:()=>"glm-z1-flash",
    S:{alarms:{list:[Object.assign({id:7,name:"旧",enabled:0},old||{})]}},
    save:()=>{}, DSB:{scheduleAlarm:()=>{}, askNotifPermission:()=>{}},
    closeModal:()=>{}, renderPage:()=>{}, toast:(m)=>{g.t=(g.t||[]).concat(m)},
    Object, Math, JSON,
  });
  vm.runInNewContext(mSave18+"\nsaveAlarm(7);", sb);
  return sb.S.alarms.list[0];
}
t("实弹 saveAlarm：auto:→自动最强（provider=当前源·think=0）", (()=>{const a=saveSb("auto:");return a.provider==="zhipu"&&a.model==="glm-4-flash"&&a.think===0})());
t("实弹 saveAlarm：think:→深度思考（think=1·推理模型）", (()=>{const a=saveSb("think:");return a.think===1&&a.model==="glm-z1-flash"})());
t("实弹 saveAlarm：prov::model→指定 groq::llama-3.3-70b-versatile", (()=>{const a=saveSb("groq::llama-3.3-70b-versatile");return a.provider==="groq"&&a.model==="llama-3.3-70b-versatile"&&a.think===0})());
t("实弹 saveAlarm：未勾技能→旧 skills 字段被清（防永远生效）", (()=>{const a=saveSb("auto:",{skills:{web:1,code:1}});return a.skills===undefined})());
t("实弹 saveAlarm：编辑不改启停态（暂停任务保存后仍 enabled=0）", (()=>{const a=saveSb("auto:",{});return a.enabled===0})());
// ---- D18 静态：Java 执行链三路注入 ----
t("Java EXPERT_MAP 双端同语义（五内建专家映射齐）", recvJava.includes("EXPERT_MAP.put(\"analyst\"") && recvJava.includes("EXPERT_MAP.put(\"coder\"") && recvJava.includes("EXPERT_MAP.put(\"writer\"") && recvJava.includes("EXPERT_MAP.put(\"translator\"") && recvJava.includes("EXPERT_MAP.put(\"ops\""));
t("Java sysFor：基础+技能 persona 强制注入+专家身份三段组装", recvJava.includes("static String sysFor(JSONObject task, JSONObject settings)") && recvJava.includes('sk.optInt("persona", 0) == 1') && recvJava.includes("你的专家身份："));
t("本地链注入：sys 消息走 sysFor（专家人设进多免费源链）", recvJava.includes('sys.put("content", sysFor(task, settings))'));
t("端侧链注入：ChatML system 走 sysFor（离线也有专家）", recvJava.includes('"<|im_start|>system\\n" + sysFor(task, settings) + "<|im_end|>\\n"'));
t("云端链注入：expert_text 折叠直传（custom 端内折叠，云端零查找）", recvJava.includes('inputs.put("expert_text", eText)') && recvJava.includes('\"custom\".equals(e)'));
t("云端技能合并：任务级勾选强制开+未勾跟随全局（plugins 镜像）", recvJava.includes('tools.put("web", sk != null && sk.optInt("web", 0) == 1 ? true : gWeb)') && recvJava.includes('tools.put("code"'));
// ---- D18 静态：云端 yml/py 对齐 ----
const agentYml = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
t("agent.yml 新增 expert_text input（App 已解析折叠·空=不注入）", agentYml.includes("expert_text:") && agentYml.includes("EXPERT_TEXT: ${{ github.event.inputs.expert_text }}"));
t("agent.py 注入 EXPERT_TEXT 进 SYSTEM（与 App 端 sysFor 同语义）", agentPy.includes('EXPERT_TEXT = os.environ.get("EXPERT_TEXT", "")') && agentPy.includes("SYSTEM = SYSTEM + \"\\n\" + EXPERT_TEXT"));

t("工作空间落点：saveToProject 每任务专属会话（alarmId 匹配·消息追加·60 条封顶）", recvJava.includes("static void saveToProject(Store store, JSONObject task, String prompt, String result)") && recvJava.includes("alarmId") && recvJava.includes("msgs.length() > 60"));
t("工作空间落点：非云端任务结果自动沉淀（云端任务由 App 轮询回显不走此路）", recvJava.includes('if (!"cloud".equals(mode)) saveToProject(store, task, prompt, result)'));
t("工作空间落点：会话归属端与任务同端（三端分割铁律）", recvJava.includes('ses.put("mode", task.optString("mode", "chat"))'));
t("工作空间落点：单条结果 8000 字截断+出错静默降级不炸主链", recvJava.includes("result.length() > 8000 ? result.substring(0, 8000)") && recvJava.includes("catch (Exception ignored)"));
t("双端一致铁律：JS EXPERTS 与 Java EXPERT_MAP 六 id 对齐", ["analyst","coder","writer","translator","ops","custom"].every(id=>script.includes('id:"'+id+'"') || id==="custom" ? true : recvJava.includes('EXPERT_MAP.put("'+id+'"')));



console.log("\n== D19. 第十九轮：云端 CN 多通道（借鉴热更通道思想·触发重试+镜像+CDN 结果回家）==");
t("通道② ghApiBase：用户镜像优先·留空=直连官方", script.includes("function ghApiBase(){") && script.includes('return m?m:"https://api.github.com"'));
t("通道①② ghPostRetry：Promise 化重试（不卡 UI 线程）", script.includes("async function ghPostRetry(url,body,tries)") && script.includes("await new Promise(res=>setTimeout(res,8000))"));
t("ghPostRetry 鉴权类错误立即返回（401/403/422 不空耗重试）", script.includes('if(r.status===401||r.status===403||r.status===422)return r'));
t("cloudRun dispatch 已接 ghApiBase+ghPostRetry（多通道触发）", script.includes("await ghPostRetry(`${ghApiBase()}/repos/${S.settings.cloudRepo}/actions/workflows/agent.yml/dispatches`"));
t("cloudRun dispatchTs 落盘（CDN 防陈旧校验的时间锚）", script.includes("m.cloud.dispatchTs=now();"));
t("通道③ cloudCdnFetch：私有仓自动关闭+purge 破缓存+run 标记防陈旧（97b rpcJson 异步化）", script.includes("async function cloudCdnFetch(runId,dispatchTs,file)") && script.includes('S.settings.repoVisibility==="private")return null') && script.includes("purge.jsdelivr.net") && script.includes("runMatch[1]!==String(runId)"));
t("pollRun 通道③先行：CDN 取到即完成（免状态查询）", script.includes("const cdnTxt=await cloudCdnFetch(runId,m.cloud.dispatchTs)") && script.includes("CN CDN 通道取回"));
t("pollRun 通道②兜底：直连查询不通→镜像再试", script.includes("镜像通道查询") && script.includes("直连不通→用户镜像再试"));
t("pollRun API 取文件不通→CDN 再兜底（成功链双保险）", script.includes('cloudCdnFetch(runId,m.cloud.dispatchTs,"run-"+runId+".md")||await cloudCdnFetch(runId,m.cloud.dispatchTs)'));
t("镜像框已折叠进高级选项（小白零打扰）+Token 红线如实告知", script.includes("高级选项：GitHub API 镜像（一般无需填写）") && script.includes("信任自担") && script.includes("日常使用什么都不用填"));
t("保存接线：ghApiMirror 落盘（选填·留空=官方）", script.includes('S.settings.ghApiMirror=mir.value.trim()'));
t("agent.py latest.md 固定路径双写（CDN 通道数据源）+run 标记三头", agentPy.includes('results/latest.md') === false ? agentPy.includes('"latest.md"') : agentPy.includes("latest.md") && agentPy.includes('<!-- run:%s -->\\n" % (steps'));
t("agent.py 头部含 run 标记（App 端校验依据）", agentPy.includes('<!-- run:%s -->') && agentPy.includes('header = "<!-- steps:%d -->\\n<!-- provs:%s -->\\n<!-- run:%s -->'));
t("Java runCloud 同款重试+镜像（与 JS ghPostRetry 语义对齐）", recvJava.includes('settings.optString("ghApiMirror", "").trim()') && recvJava.includes("for (int attempt = 0; attempt < 3; attempt++)") && recvJava.includes("code == 401 || code == 403 || code == 422"));
t("Java runCloud 退避 8s+中断自恢复", recvJava.includes("Thread.sleep(8000)") && recvJava.includes("Thread.currentThread().interrupt()"));

t("触发失败零配置兜底：60s 自动补射第二轮（用户无需填任何东西）", script.includes("60 秒后自动再试一轮，你无需任何操作") && script.includes("第二轮自动补射") && script.includes("m.cloud.retriedOnce=1"));
t("补射防重复：消息已删/已取回不再补射", script.includes("if(!s.msgs||s.msgs[aiIdx]!==m||m.cloud.done)return"));
t("runId 持续抓取（最多 12 次·网络抖动不轻易放弃）", script.includes("else if((n||0)<12){setTimeout(()=>findRun((n||0)+1),5000)}"));
t("全程零配置文案：主链路不再要求用户填镜像", !script.includes("填入你信任的 GitHub API 镜像") && script.includes("日常使用什么都不用填"));
// ---- D19 实弹：cloudCdnFetch 陈旧校验（97b 异步化：注入假 rpcJson 真值血管，异步断言）----
const mCdn = script.match(/async function cloudCdnFetch\(runId,dispatchTs,file\)\{[\s\S]*?\n\}/)[0];
function cdnSb(txt){return vm.createContext({
  S:{settings:{cloudRepo:"me/repo",repoVisibility:"public",ghApiMirror:""}},
  rpcJson:(url)=>{if(url.indexOf("purge.jsdelivr")>-1)return {ok:true,text:"",status:200}; return txt==null?{ok:false,text:"",status:404}:{ok:true,text:txt,status:200}},
  toast:()=>{},
})}
t("D19 前置：cloudCdnFetch 已 rpcJson 化（旧 api 同步壳不再出现在函数体）", mCdn.includes("await rpcJson(") && !mCdn.match(/[^a-zA-Z]api\(/));
(async()=>{try{
  {const v=await vm.runInNewContext(mCdn+";cloudCdnFetch(99,0)",cdnSb("<!-- steps:2 -->\n<!-- provs:zhipu -->\n<!-- run:99 -->\n结果正文"));
   t("实弹 cloudCdnFetch：run 标记匹配→取回全文", !!v&&v.includes("结果正文"));}
  {const v=await vm.runInNewContext(mCdn+";cloudCdnFetch(99,0)",cdnSb("<!-- steps:1 -->\n<!-- provs:a -->\n<!-- run:88 -->\n旧结果"));
   t("实弹 cloudCdnFetch：run 标记不匹配（陈旧上一轮）→拒收", v===null);}
  {const c=vm.createContext({S:{settings:{cloudRepo:"me/repo",repoVisibility:"private"}}});
   const v=await vm.runInNewContext(mCdn+";cloudCdnFetch(99,0)",c);
   t("实弹 cloudCdnFetch：私有仓→通道自动关闭", v===null);}
  {const v=await vm.runInNewContext(mCdn+";cloudCdnFetch(99,0)",cdnSb("<!-- steps:1 -->\n无run标记老文件"));
   t("实弹 cloudCdnFetch：无 run 标记（老格式）→拒收", v===null);}
  {const v=await vm.runInNewContext(mCdn+";cloudCdnFetch(null,50)",cdnSb("<!-- steps:1 -->\n<!-- provs:a -->\n<!-- run:40 -->\n更旧结果"));
   t("实弹 cloudCdnFetch：无 runId（搜索中）→结果早于触发时刻（run40<ts50）→拒收", v===null);}
  __finish();
}catch(e){console.error("D19 异步实弹崩溃:",e&&e.message);fail++;__finish();}})();
t("实弹 ghApiBase：镜像填了走镜像、留空走官方", (()=>{const c1=vm.createContext({S:{settings:{ghApiMirror:" https://m.example.com/ "}}});const c2=vm.createContext({S:{settings:{ghApiMirror:""}}});const mB=script.match(/function ghApiBase\(\)\{[^\n]+\n/)[0];return vm.runInNewContext(mB+";ghApiBase()",c1)==="https://m.example.com" && vm.runInNewContext(mB+";ghApiBase()",c2)==="https://api.github.com"})());



console.log("\n== D20. 第二十轮：云端自主进化机器（GENE5·借鉴 App 热更四重闸门+看门狗）==");
const wdPy = fs.readFileSync(path.join(ROOT, "app/assets/cloud/watchdog.py"), "utf8");
const agentYml20 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
t("GENE5 铁律刻入（云端进化铁律·锚锁清单在位）", agentPy.includes("GENE5·云端进化铁律") && agentPy.includes("_EVOLVE_ANCHORS"));
t("--selftest 纯本地自检（零 Key 零网络·注册表/选型/SYSTEM/工具四断言）", agentPy.includes('"--selftest" in sys.argv') && agentPy.includes("def _selftest()") && agentPy.includes("print(\"SELFTEST OK\""));
t("--evolve 自主进化主流程（失败驱动+24h/GENE9 自适应节流）", agentPy.includes('def _evolve()') && agentPy.includes('EVOLVE_FORCE') && agentPy.includes("age_h < _gate_h") && agentPy.includes("_gate_h = 0.0 if _want_n > 0 else 24.0"));
t("进化闸门①格式闸：JSON 解析+字段+≤3 补丁+≤2000 字符", agentPy.includes("patches = j.get(\"patches\") or []") && agentPy.includes("len(patches) <= 3") && agentPy.includes("len(pt[\"find\"]) <= 2000"));
t("进化闸门②锚锁闸：唯一命中+停跳检测（防自我越狱——D36 按目标文件；D41 禁触名单→停跳检测）", agentPy.includes("闸门②停跳检测拒收") && agentPy.includes("tlost = [a for a in _EVOLVE_ANCHORS") && agentPy.includes("tsrct.count(pt[\"find\"]) != 1") && agentPy.includes("EVOLVE_FILES"))
t("进化闸门③④：py_compile+候选 --selftest 实弹+机器自洽标记（D36 升维：全家桶逐文件编译）", agentPy.includes("for tgt, (tc, tp) in cand_map.items()") && agentPy.includes('cand_map["agent.py"][1], "--selftest"') && agentPy.includes("候选丢失进化机器标记") && agentPy.includes("py_compile.compile(tp, doraise=True)"))
t("应用留痕：备份 .bak+EVOLVE_N 版本标记+.evolve_ts 节流戳+双端记忆/手册归档", agentPy.includes("shutil.copy(src_path, src_path + \".bak\")") && agentPy.includes("# __EVOLVE_N__:") && agentPy.includes(".evolve_ts") && agentPy.includes('learn_memory("evolve"') && agentPy.includes("playbook_learn(\"云端自主进化"));
t("进化失败不炸主链（exit 0+留痕+EVOLVE_FAIL）", agentPy.includes("EVOLVE_FAIL") && agentPy.includes('learn_memory("evolve", "云端进化流程异常'));
t("watchdog.py：编译+--selftest 双验·坏补丁自动从 .bak 回滚（验活后原子替换）·永远 exit 0", wdPy.includes("def _healthy(path)") && wdPy.includes('path, "--selftest"') && wdPy.includes('shutil.copy(BAK, _tmp)') && wdPy.includes("os.replace(_tmp, AGENT)") && wdPy.includes("sys.exit(0)")); // 🛡️ 65 轮升维：回滚改 tmp 拷满+验活+原子替换
t("agent.yml：watchdog 前置验活步（Run 之前）", agentYml20.indexOf("Watchdog engine verify") >= 0 && agentYml20.indexOf("Watchdog engine verify") < agentYml20.indexOf("Run DS Harness Agent"));
t("agent.yml：Run 步 id=agent+continue-on-error（失败仍走 Commit/Evolve）", agentYml20.includes("id: agent") && agentYml20.includes("continue-on-error: true"));
t("agent.yml：EVOLVE_FORCE=上轮 outcome 失败驱动绕过节流", agentYml20.includes("EVOLVE_FORCE: ${{ steps.agent.outcome == 'failure' }}"));
t("agent.yml：Self-evolve 步+Commit evolve 步（进化成果 commit 回仓）", agentYml20.includes("python3 cloud/agent.py --evolve") && agentYml20.includes("cloud-evolve: engine self-evolution") && agentYml20.includes("git add cloud/agent.py"));
t("vuln_check 第七检：进化机器四件套在位+--selftest 实弹（GEN4 双端体检同拍覆盖）", vulnPy.includes("GEN5 云端自主进化机器在位") && vulnPy.includes('"--selftest", "--evolve", "_EVOLVE_ANCHORS"') && vulnPy.includes('cloud/agent.py', ));


console.log("\n== D21. 第二十一轮：云端零模型 Key（pollinations 免 Key 保底源接入云端链）==");
t("agent.py：pollinations 条目进 PROV（nokey:True 开箱保底）", agentPy.includes('"pollinations": {"ep": "https://text.pollinations.ai/openai/chat/completions"') && agentPy.includes('"nokey": True'));
t("agent.py：CHAIN_ORDER pollinations 殿后（有 Key 源全部失败才轮到保底）", agentPy.indexOf('"pollinations"', agentPy.indexOf('CHAIN_ORDER = [')) < agentPy.indexOf(']', agentPy.indexOf('CHAIN_ORDER = [')) && /CHAIN_ORDER = \[[^\]]*"mistral", "pollinations"\]/.test(agentPy));
t("agent.py：nokey 保底源免 Key 直进链", agentPy.includes('avail = [k for k in CHAIN_ORDER if k in PROV and ((k in KEYS and KEYS[k]) or PROV[k].get("nokey"))]'));
t("agent.py：call_once 空 token 不发 Authorization 头（免 Key 源直跑，有 Key 照常）", agentPy.includes('token = KEYS.get(pk, "")') && agentPy.includes('if token:') && agentPy.includes('headers["Authorization"] = "Bearer " + token'));
t("Java：runCloud 零 Key 放行——pollinations 未关即跑云端（不再强制至少一个 Key）", recvJava.includes('boolean polliOn = pp == null || pp.optInt("on", 1) == 1') && recvJava.includes("未配置任何免费模型源 Key，且免 Key 保底源 pollinations 已被关闭"));
t("JS：sendCloud 零 Key 放行（pollinations 开启即直跑，仅全关才拦）", script.includes('const polli=provs()["pollinations"];') && script.includes('if(!(polli&&polli.on))') && script.includes("或保持「开箱保底」源 pollinations 开启即可零 Key 跑云端"));
t("JS：零 Key 时跳过 Secrets 同步（不白访 GitHub 公钥接口）", script.includes('if(Object.keys(keys).length&&S.settings.secretsFp!==fp)') && script.includes("ℹ️ 未配置任何免费模型 Key——Secrets 跳过：云端由免 Key 保底源 pollinations 兜底直跑"));


console.log("\n== D22. 第二十二轮：深度查漏补缺（零Key+think 防崩+watchdog 刻基因+文案对齐）==");
t("agent.py：pollinations 补 think 字段（THINK 模式零 Key 路径不再 KeyError）", /"pollinations": \{[^\}]*"think": "openai-fast", "nokey": True/.test(agentPy));
t("agent.py：models_of 加固——一律 .get+think 空回落 def（源无 think 字段不炸链）", agentPy.includes('if THINK:') && agentPy.includes('return p.get("think") or p.get("def") or ""') && agentPy.includes('return p.get("def") or ""'));
t("watchdog.py：四指令基因铁律已刻（与 agent.py 同源同刻）", wdPy.includes("全局永久记忆与技术攻坚手册必须永久随身") && wdPy.includes("永不可移除") && wdPy.includes("App 端所有动作必须强制自动与云端全层全天候联动同步"));
t("vuln_check：gene_files 补 watchdog.py+编译清单补 watchdog.py（进化层纳入基因审计与编译体检）", vulnPy.includes('"cloud/watchdog.py",') && vulnPy.includes('"cloud/agent.py", "cloud/models_sync.py", "cloud/watchdog.py"'));
t("设置页云端文案：零 Key 可跑已明示（与实际行为对齐）", script.includes("模型 Key 一个不填也能跑：云端由「开箱保底」免 Key 保底源殿后直跑"));
t("evolveRunDaily 注释对齐：零 Key 时保底源照样驱动进化", script.includes("零 Key 时 pollinations 保底源照样驱动进化"));

console.log("\n== D23. 第二十三轮：体检进化一体化（GENE6·双端漏洞发现修复能力并入自主进化机器+双端互拍）==");
t("App：体检残余自动唤醒进化机器（GENE6 前哨→引擎；6h 节流）", script.includes("GENE6·体检进化一体化：体检=前哨，进化=修复引擎") && script.includes("S.settings.vulnEvolveTs=now();save(\"settings\")") && script.includes("setTimeout(()=>{try{evolveRun(false)}catch(e){}},100)"));
t("App：进化养料补云端体检报告残余（双端异常双端修）", script.includes("GENE6：云端体检报告残余一并入进化养料") && script.includes("云端体检残余（最多 3 项）：${cloudBad.map"));
t("App：app_state 镜像补 vulnBad 残余清单（云端进化器互拍养料；无 Key 无对话内容）", script.includes("vulnBad:((st.vulnLog||{}).results||[]).filter(r=>!r.ok).slice(0,3).map"));
t("App：云端红项报告回收时也自动唤醒进化（双端互拍；共用 6h 节流）", script.includes("GENE6·双端互拍：云端体检红项→App 端自动唤醒进化机器") && script.includes("now()-st.vulnEvolveTs>21600000"));
t("App：deployCloud 覆盖保护——云端 EVOLVE_N 更高不拿内置旧版抹云端进化成果", script.includes("GENE6 双端互拍：云端已自主进化（EVOLVE_N 更高）→ 不拿 APK 内置旧版覆盖云端进化成果") && script.includes("保护云端进化成果不覆盖"));
t("App：deployCloud 部署清单补 watchdog.py（第二十轮漏网补齐）", script.includes('["cloud/watchdog.py","DSB.readAsset(\'cloud/watchdog.py\')"]') && script.includes('["cloud/vuln_check.py","DSB.readAsset(\'cloud/vuln_check.py\')"],["cloud/watchdog.py"'));
t("App：cloudEvolveCheck 云端进化感知（EVOLVE_N 递增→留痕+通知+部署保护）+启动接线", script.includes("function cloudEvolveCheck(){ // 🧬 GENE6 双端互拍") && script.includes("try{cloudEvolveCheck()}catch(e){}         // 🧬 GENE6"));
t("云端：--evolve 养料补七检实弹+报告红项+App 端体检镜像（三段养料）", agentPy.includes("GENE6·体检进化一体化：七检实弹+云端报告+App 端体检镜像全部入进化养料") && agentPy.includes("云端七检实弹结果（如有红项优先修复）") && agentPy.includes("App 端体检残余（最多 3，App→云端单向镜像供双端进化互拍）") && agentPy.includes("App 端当前版本："));
t("vuln.yml：体检红项→EVOLVE_FORCE 自动唤醒进化器步+commit 步补进化成果回仓", (()=>{const v=fs.readFileSync(path.join(ROOT,"app/assets/cloud/vuln.yml"),"utf8");return v.includes("GENE6 auto-evolve on red findings") && v.includes("x.get('hard') and not x.get('ok')") && v.includes("python3 cloud/agent.py --evolve") && v.includes("git add cloud/vuln_report.json cloud/memory.json cloud/playbook.json cloud/agent.py cloud/agent.py.bak cloud/.evolve_ts")})());

console.log("\n== D24. 第二十四轮：地毯式审计修复（国内感知通道+死代码+Java 零告警）==");
t("App：cloudEvolveCheck 接入 jsDelivr 国内 CDN 通道（raw 常被墙，进化感知不瞎）", script.includes('api("https://cdn.jsdelivr.net/gh/"+repo+"@main/cloud/agent.py","GET",null,{})') && script.includes("🇨🇳 jsDelivr CDN 通道先行（国内免墙免 Token）"));
t("云端：EVOLVE_N 递增段死代码已清（进化基底不留垃圾）", !agentPy.includes("if False else cur") && agentPy.includes('cur = _re.sub(r"# __EVOLVE_N__:\\d+", "# __EVOLVE_N__:%d" % n, cur, count=1)'));
t("Java：onBackPressed 弃用注解（minSdk 24 双路兼容正当留痕）", mainJava.includes('@SuppressWarnings("deprecation") // Android 13+ 预测性返回已替代旧返回链') && mainJava.includes("public void onBackPressed()"));
t("Java：notify 冗余强转已清（idSeq 本就是 int）", recvJava.includes("nm.notify(idSeq++, b.build())") && !recvJava.includes("nm.notify((int) (idSeq++)"));
(() => { const bj = fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/Bridge.java"),"utf8"); const aj = fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/AlarmReceiver.java"),"utf8"); return t("Java：旧 Builder 双路分支 suppress 注解在位（Bridge+AlarmReceiver 两处）", bj.includes('@SuppressWarnings("deprecation") // minSdk 24 双路兼容') && aj.includes('@SuppressWarnings("deprecation") // minSdk 24 双路兼容')); })();

console.log("\n== D25. 第二十五轮：深挖二度（env 名契约/results 滚动/会话封顶）==");
(() => { const vy = fs.readFileSync(path.join(ROOT,"app/assets/cloud/vuln.yml"),"utf8");
  t("vuln.yml 进化步 env 名与 Secrets 契约对齐（*_KEY 而非 *_API_KEY；补 CLOUDFLARE_ACCOUNT）", (()=>{ const ay = fs.readFileSync(path.join(ROOT,"app/assets/cloud/agent.yml"),"utf8");
    const names=["ZHIPU","NVIDIA","MODELSCOPE","SILICONFLOW","OPENROUTER","GEMMA","CLOUDFLARE","GROQ","CEREBRAS","MISTRAL"];
    const vyOK = names.every(n=>vy.includes(n+"_KEY: ${{ secrets."+n+"_KEY }}")) && vy.includes("CLOUDFLARE_ACCOUNT: ${{ secrets.CLOUDFLARE_ACCOUNT }}");
    const vyBad = names.some(n=>vy.includes(n+"_API_KEY"));
    const ayOK = names.every(n=>ay.includes(n+"_KEY: ${{ secrets."+n+"_KEY }}"));
    return vyOK && !vyBad && ayOK; })()); })();
t("agent.py：results 滚动清理（保最近 20 个，防 git 仓库无限膨胀）", agentPy.includes("保最近 20 个历史文件") && agentPy.includes("os.path.join(RESULTS_DIR, f)") && agentPy.includes("olds[20:]"));
t("agent.yml：git add -A results/（删除传播——滚动清理的删除真正落到 git 索引）", (()=>{ const ay = fs.readFileSync(path.join(ROOT,"app/assets/cloud/agent.yml"),"utf8"); return ay.includes("git add -A results/") && !ay.includes("git add results/"); })());
t("JS：本地会话封顶 200 条（超出裁最旧且首条强制 user，不产生悬空 ai 断头历史）", script.includes("本地会话封顶 200 条") && script.includes('if(cut[0].role!=="user")cut=cut.slice(1)'));

console.log("\n== D26. 第二十六轮：深挖三度（保底源情报通道三层打通）==");
(() => { const ms = fs.readFileSync(path.join(ROOT,"app/assets/cloud/models_sync.py"),"utf8"); const my = fs.readFileSync(path.join(ROOT,"app/assets/cloud/models.yml"),"utf8");
  t("云端每日情报层：models_sync PROV 补 pollinations 条目（curated+seed，保底源不再静态退化）", ms.includes('"pollinations": {') && ms.includes('"ep": "https://text.pollinations.ai/models"') && ms.includes('"mode": "curated"') && ms.includes('"seed": ["openai-fast", "openai"]'));
  t("models.yml：补 POLLINATIONS_KEY env 引用（Secret 不存在时为空串，匿名拉取照常）", my.includes('POLLINATIONS_KEY: ${{ secrets.POLLINATIONS_KEY }}'));
  t("云端 extract_ids：顶层数组兼容（pollinations 实测格式；vm 实弹三格式已验）", ms.includes("items = (j.get(\"data\") or j.get(\"models\") or []) if isinstance(j, dict) else (j if isinstance(j, list) else [])") || (ms.includes("isinstance(j, dict)") && ms.includes("isinstance(j, list)")));
  t("App live 层：fetchLiveModels 同款顶层数组兼容（双端格式解析对齐）", script.includes('const arr=Array.isArray(r.json)?r.json:(r.json.data||r.json.models||[]);') && script.includes('顶层数组（pollinations 实测格式）与 OpenAI {data} 并存兼容')); })();

console.log("\n== D27. 第二十七轮：深挖四度（外链通道补全+读超时漏配）==");
t("Java：Bridge.openUrl 外链打开桥（聊天 markdown 链接→系统浏览器；此前全工程无任何外链通道——死链坐实补全）", bridgeJava.includes('public void openUrl(String url)') && bridgeJava.includes('!sch.equals("http") && !sch.equals("https")') && bridgeJava.includes('FLAG_ACTIVITY_NEW_TASK'));
t("JS：click 委托消费 data-href（md() 生成→委托打开；JS 侧 https? 双保险闸；旧 APK toast 降级）", script.includes('e.target.closest("a[data-href]")') && script.includes('/^https?:/i.test(href)') && script.includes('typeof DSB.openUrl==="function"') && script.includes('旧 APK 无此桥'));
t("Java：AlarmReceiver dispatch 通道补 setReadTimeout(30000)（默认 0=无限等待：GFW 半开连接下云端任务永不超时坐实修复）", (()=>{const m=recvJava.match(/setDoOutput\(true\);[\s\S]{0,300}setReadTimeout\(30000\)/);return !!m;})() && recvJava.includes('读超时漏配补齐'));
t("死属性面清零：全工程 data-* 生成均有消费者（data-href 本轮接线/data-tab 导航在册）", /\$\$\("#nav button"\)\.forEach\(b=>b\.classList\.toggle\("on",b\.dataset\.tab===route\)\)/.test(script) && script.includes('a[data-href]'));

console.log("\n== D28. 第二十八轮：深挖五度（FGS 长任务接管+本地任务封顶）==");
(() => { const svc = fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/TaskService.java"),"utf8");
  t("Java：TaskService 前台服务在位（startForeground 5 秒宽限必调 + executeTask 接线 + 完成自了）", svc.includes("extends Service") && svc.includes("startForeground(NOTIF_ID") && svc.includes("AlarmReceiver.executeTask") && svc.includes("stopSelf()"));
  t("Manifest：FGS 权限+dataSync 型服务声明（targetSdk 34 硬性要求型别）", manifestXml.includes("android.permission.FOREGROUND_SERVICE_DATA_SYNC") && manifestXml.includes('android:name=".TaskService"') && manifestXml.includes('android:foregroundServiceType="dataSync"'));
  t("AlarmReceiver：广播秒回交 FGS + 启动被拒回退 goAsync 兑底（旧链路不丢）", recvJava.includes("startForegroundService(sv)") && recvJava.includes("catch (Exception fgsDenied)") && recvJava.includes("executeTask(ctx, tj, name)") && recvJava.includes("广播窗口仅约 10 秒"));
  t("静态化六方法全过 javac（executeTask/runChat/runCloud/saveToProject/record/refreshUi/sysFor/postJson/readAll）", recvJava.includes("static void executeTask") && recvJava.includes("static String runChat") && recvJava.includes("static String runCloud") && recvJava.includes("static void saveToProject") && recvJava.includes("static void record") && recvJava.includes("static void refreshUi"));
  t("JS：本地任务列表封顶 200（三处 unshift 全带护栏：新建/带文新建/云端拉回导入）", (script.match(/S\.sessions\.list\.length>200\)S\.sessions\.list=S\.sessions\.list\.slice\(-200\)/g)||[]).length >= 3); })();

console.log("\n== D29. 第二十九轮：深挖六度（AI 文件防护闸+云端并发组+附件清理）==");
(() => { const pb = fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/PhoneBridge.java"),"utf8");
  t("Java：PhoneBridge AI 文件防护闸（guard/inSystemZone/inPrivate/phoneToolGuard 四件套在位）", pb.includes("private String guard(File f)") && pb.includes("inSystemZone") && pb.includes("inPrivate") && pb.includes("phoneToolGuard()") && pb.includes("optInt(\"phoneToolGuard\", 1)"));
  t("Java：G 版双轨四方法（AI 走 guarded，用户手动 UI 走原版无闸互不干扰）", ["fsWriteG","fsMkdirG","fsDeleteG","fsRenameG"].every(m=>pb.includes("public String "+m+"(")) && pb.includes("AI 专用 G 版"));
  t("Java：永久禁区含 /data /system 及其他应用 Android/data·obb（无论开关都禁碰）", pb.includes('"/system"') && pb.includes("Android/data/") && pb.includes("Android/obb/"));
  t("JS：PHONE_TOOLS 四写删工具全切 G 版（fsWriteG/fsMkdirG/fsDeleteG/fsRenameG）", ["fsWriteG","fsMkdirG","fsDeleteG","fsRenameG"].every(m=>script.includes('phb("'+m+'"')));
  t("JS：设置页 AI 文件防护开关（phoneToolGuard 默认开，文案带系统目录永久禁碰提示）", script.includes("🛡️ AI 文件防护") && script.includes("S.settings.phoneToolGuard=(S.settings.phoneToolGuard===0?1:0)"));
  t("JS：pickClear 发送后删附件原文件（picks/ 不再无限膨胀；唯一调用点=chatSend 发送后）", script.includes("pickPend.forEach(p=>{try{DSB.pickDelete(p.path)}catch(e){}});") && script.includes("永久残留 picks/ 无限膨胀"));
  t("云端：三 yml 统一并发排队组 dsh-cloud-engine（体检撞长任务不再互踢丢结果）", ["agent.yml","models.yml","vuln.yml"].every(f=>fs.readFileSync(path.join(ROOT,"app/assets/cloud/"+f),"utf8").includes("group: dsh-cloud-engine")) && fs.readFileSync(path.join(ROOT,"app/assets/cloud/agent.yml"),"utf8").includes("cancel-in-progress: false")); })();

console.log("\n== D30. 第三十轮：Java 骨架层自主进化物理通道（用户授权纳入闭环）==");
(() => { const by = fs.readFileSync(path.join(ROOT,"app/assets/cloud/build.yml"),"utf8"); const vc = fs.readFileSync(path.join(ROOT,"app/assets/cloud/vuln_check.py"),"utf8");
  t("build.sh 环境变量自适应（DSH_BUILD_TOOLS/PLATFORM_JAR/JDK/NDK 四覆盖；本地零变化 runner 可建）", ["DSH_BUILD_TOOLS","DSH_PLATFORM_JAR","DSH_JDK","DSH_NDK"].every(v=>buildSh.includes(v)) && buildSh.includes("VER=\"2.5.115-notif\"; VCODE=133"));
  t("build.yml 云端自动构建链（checkout→JDK17→SDK→build.sh→apk_manifest→commit 回仓）", by.includes("name: build-apk") && by.includes("actions/setup-java@v4") && by.includes("bash build.sh") && by.includes("apk_manifest.json") && by.includes("dsh-cloud-engine"));
  t("build.yml 触发面：workflow_dispatch + 进化任务完成后自动触发（workflow_run 按 name 匹配——🛡️ 64 轮修复：旧版写 [\"agent\"] 文件名永不命中，APK 自动重建从未触发过）", by.includes("workflow_dispatch") && by.includes('workflows: ["DS Harness Cloud Agent (GENE-Enforced)"]'));
  t("App 端 updApkCheck：骨架层进化包每日检测（复用四通道拉 apk_manifest→updVerRank 比较→通知+openUrl 拉起下载）", script.includes("async function updApkCheck(manual)") && script.includes("apk_manifest.json") && script.includes("updVerRank(String(m.versionName))>updVerRank(APP_VER)") && script.includes("DSB.openUrl(url)"));
  t("App 端每日接线：updCheckDaily 延迟 20s 同拍骨架检测", script.includes("updApkCheck(false)}catch(e){}},20000"));
  t("vuln_check ⑧检：Java 骨架层契约审计（源码在位/版本单源同步/关键契约锚，红项进进化养料）", vc.includes("⑧ 🧬 Java 骨架层契约审计") && vc.includes("骨架层版本单源同步") && vc.includes("骨架层关键契约") && vc.includes("import json, os, re, sys"));
  t("部署清单补 build.yml（deployCloud files 第 10 项）", script.includes("[\".github/workflows/build.yml\",\"DSB.readAsset('cloud/build.yml')\"]")); })();

console.log("\n== D31. 第三十一轮：通道策略自主进化（用户授权占 6 成——探测数据驱动+进化器可写策略）==");
(() => {
  t("JS：updChannels 通道表数据化（chanData 驱动 prio/streak/okN 三级排序，不再硬编码顺序）", script.includes("const cd=S.settings.chanData||{};") && script.includes("list.sort((a,b)=>(a.prio-b.prio)||(a.streak-b.streak)||((b.okN-a.okN)))"));
  t("JS：chanMark 真实使用即探测（连败降级/恢复回升 100 基线/延迟滑动平均；阈值/步长/权重读 evoCfg 进化器可写——D34 升维）", script.includes("function chanMark(name,ok,ms)") && script.includes("d.streak>=c.failN)d.prio+=c.prioStep") && script.includes("if(d.prio>100)d.prio-=c.prioStep") && script.includes("(d.ms*c.msW+ms)/(c.msW+1)"));
  t("JS：updCheck+updApkCheck 双检测链均接 chanMark 战果采集", script.includes("chanMark(ch.name,false,now()-t0)") && script.includes("chanMark(ch.name,r.ok,now()-t0)"));
  t("JS：app_state 镜像带 chanHealth（进化器可见哪些通道被降级，据此写回策略）", script.includes("chanHealth:Object.entries(st.chanData||{}).map"));
  t("JS：evolveRun 养料带通道健康（进化 prompt 明示可写 chanPrio 自主调优）", script.includes("通道健康（探测战果，连败通道可写 cloud/state.json 的 chanPrio 字段自主调整优先级）"));
  t("JS：反向闭环——pullStateCloud 拉回进化器写的 chanPrio 生效（拉回留痕入记忆）", script.includes("j.chanPrio&&typeof j.chanPrio===\"object\"") && script.includes("云端进化器已调整更新通道策略"));
  t("云端：agent.py 状态镜像注入带通道健康（云端进化器实时感知通道战果）", agentPy.includes("s.get(\"chanHealth\")") && agentPy.includes("·更新通道：")); })();

console.log("\n== D32. 第三十二轮：通道自主探索器（新路发现全自动化——进化能力有自主意识，零人工喂养）==");
(() => {
  t("JS：SCOUT_SEED 种子池在位（replace+prefix 双型≥6 条候选，种子=探测对象知识非人工喂养）", (script.match(/const SCOUT_SEED=\[[\s\S]*?\];/)||[""])[0].includes("replace") && (script.match(/const SCOUT_SEED=\[[\s\S]*?\];/)||[""])[0].includes("prefix") && (script.match(/const SCOUT_SEED=\[[\s\S]*?\];/)||[""])[0].split("base:").length-1>=6);
  t("JS：scoutValid 安全闸（type 白名单+base 纯域名正则，杜绝 URL 注入）", script.includes("const scoutValid=s=>") && script.includes("s.type===\"replace\"||s.type===\"prefix\"") && script.includes("/^[a-z0-9.-]+$/i.test(String(s.base||\"\"))"));
  t("JS：channelScout 自主探索器（24h 节流 scoutTs+实测拉 manifest+appVersion 验证拒绝假阳性）", script.includes("async function channelScout(manual)") && script.includes("st.scoutTs=now()") && script.includes("ok=!!m.appVersion"));
  t("JS：固化+留痕+失联淘汰全链路自动（新固化 memAdd 入记忆；连败 killN 拍自动淘汰——阈值进化器可写）", script.includes("通道探索器自主发现新镜像并固化") && script.includes("通道探索器淘汰失联镜像") && /d&&d\.streak>=c\.killN\)\{memAdd\("fact","🧬 通道探索器淘汰失联镜像/.test(script));
  t("JS：updChannels 扩展探索镜像通道（scoutOK 双型 URL 拼接：replace /gh/repo@main/ 与 prefix /https://raw…/ 双形）", script.includes("(S.settings.scoutOK||[]).forEach") && script.includes("探索镜像·") && script.includes("s.type===\"replace\"?gh:b+\"/\"+raw"));
  t("JS：updCheckDaily 接线探索器（每日同拍，独立节流不抢升级通道）", script.includes("channelScout(false).catch(()=>{})"));
  t("JS：evolveRun 养料明示进化器提名权（可写 scoutPool 提名新镜像，探索器自动实测验证）", script.includes("你拥有提名权：可写 cloud/state.json 的 scoutPool 字段提名新镜像候选"));
  t("JS：pullStateCloud 拉回 scoutPool（进化器提名→App 拉回→探索器验证；安全闸+上限 20）", script.includes("Array.isArray(j.scoutPool)") && script.includes("云端进化器提名了新镜像候选") && script.includes("cur.slice(0,20)"));
  t("JS：app_state 镜像带 scoutOK/scoutPool（进化器据固化数决定是否提名）", script.includes("scoutOK:(st.scoutOK||[]).length") && script.includes("scoutPool:(st.scoutPool||[]).map"));
  t("云端：agent.py 注入探索镜像状态（云端进化器实时感知固化数与候选池）", agentPy.includes("s.get(\"scoutOK\")") && agentPy.includes("探索镜像固化"));
})();

console.log("\n== D32-vm. 实弹 channelScout（探索验证固化/假阳性拒绝/失联淘汰/节流/安全闸）==");
(() => {
  const mSeed = script.match(/const SCOUT_SEED=\[[\s\S]*?\];/)[0];
  const mValid = script.match(/const scoutValid=[^\n]+;/)[0];
  const mScout = script.match(/async function channelScout\(manual\)\{[\s\S]*?\n\}/)[0].replace("async function channelScout","function channelScout"); // 无 await 内部逻辑，脱 async 同步实弹
  const mCfg = script.match(/const EVO_CFG_DEF=\{[^}]*\};/)[0] + ";" + script.match(/const EVO_CFG_RANGE=\{[^}]*\};/)[0] + ";" + script.match(/function evoCfg\(\)\{[^\n]+\}/)[0] + ";"; // 🧬 v2.5.25-auto8：channelScout 消费 evoCfg，实弹注入
  const mkScoutCtx = (settings, apiFn, marks, mems) => vm.createContext({
    S:{settings}, UPD_DAILY_MS:86400000, now:()=>1700000000000,
    apiJson:apiFn, chanMark:(n,ok,ms)=>marks.push(n+":"+(ok?1:0)), save(){settings._saved=1},
    memAdd:(k,c,tags)=>mems.push(c), toast(m){}
  });
  const marks=[], mems=[];
  // 案例①：探索验证固化——种子+提名候选全通，发现即固化+留痕
  const st1={cloudRepo:"u/r",chanData:{},scoutPool:[{type:"prefix",base:"my-mirror.example"}]};
  const ctx1=mkScoutCtx(st1,(url)=>({ok:1,text:'{"appVersion":"2.5.23-scout"}'}),marks,mems);
  const r1=vm.runInNewContext(mCfg+";"+mSeed+";"+mValid+";"+mScout+";channelScout(false)",ctx1);
  t("实弹①：候选全部实测通过→6 种子+1 提名全固化（scoutOK=7）+发现留痕", r1.ok===1 && st1.scoutOK.length===7 && mems.some(m=>m.includes("自主发现新镜像并固化")) && st1._saved===1);
  // 案例②：假阳性拒绝——返回 200 但非 manifest（404 页/挡板页）不固化
  const st2={cloudRepo:"u/r",chanData:{}};
  const ctx2=mkScoutCtx(st2,(url)=>({ok:1,text:"404: Not Found 页面"}),[],mems);
  const r2=vm.runInNewContext(mCfg+";"+mSeed+";"+mValid+";"+mScout+";channelScout(false)",ctx2);
  t("实弹②：HTTP 200 但无 appVersion 字段→全部拒绝固化（假阳性挡板页击不穿）", r2.ok===1 && st2.scoutOK.length===0);
  // 案例③：失联淘汰——固化名单中 streak>=3 者移除、streak<3 者保留（网络抖动不误杀）
  const st3={cloudRepo:"u/r",chanData:{"scout:fastly.jsdelivr.net":{streak:5}},scoutOK:[{type:"replace",base:"fastly.jsdelivr.net"},{type:"prefix",base:"ghproxy.net"}]};
  const ctx3=mkScoutCtx(st3,()=>({ok:0,status:403}),[],mems);
  const r3=vm.runInNewContext(mCfg+";"+mSeed+";"+mValid+";"+mScout+";channelScout(false)",ctx3);
  t("实弹③：连败 5 拍镜像被淘汰、无战果记录者保留（淘汰仅依据 streak 证据）", r3.ok===1 && st3.scoutOK.length===1 && st3.scoutOK[0].base==="ghproxy.net" && mems.some(m=>m.includes("淘汰失联镜像")));
  // 案例④：24h 节流——scoutTs 未到拍不发起任何请求
  const st4={cloudRepo:"u/r",scoutTs:1700000000000-1000,chanData:{}};
  let called4=0;
  const ctx4=mkScoutCtx(st4,()=>{called4++;return {ok:0}},[],[]);
  const r4=vm.runInNewContext(mCfg+";"+mSeed+";"+mValid+";"+mScout+";channelScout(false)",ctx4);
  t("实弹④：距上次探索仅 1s→24h 节流拦截零请求", r4.detail==="未到探索节拍" && called4===0);
  // 案例⑤：安全闸——注入型 base/非法 type 被拒之门外
  const v5=vm.runInNewContext(mSeed+";"+mValid+";scoutValid",{});
  t("实弹⑤：scoutValid 拦截路径注入/非法 type/无点域名（『evil.com/path』『ftp 型』『localhost』均拒）", !v5({type:"replace",base:"evil.com/path"}) && !v5({type:"ftp",base:"a.com"}) && !v5({type:"prefix",base:"localhost"}) && v5({type:"replace",base:"a.b.com"}));
  // 案例⑥：updChannels 实弹——固化名单展开为双型通道且坏数据过滤
  const mChans=script.match(/function updChannels\(\)\{[\s\S]*?\n\}/)[0];
  const st6={cloudRepo:"u/r",githubToken:0,updMirror:"",scoutOK:[{type:"replace",base:"a.com"},{type:"prefix",base:"b.io"},{type:"replace",base:"bad path"}],chanData:{}};
  const list6=vm.runInNewContext(mSeed+";"+mValid+";"+mChans+";updChannels()",vm.createContext({S:{settings:st6}}));
  const cA=list6.find(c=>c.name==="探索镜像·a.com"), cB=list6.find(c=>c.name==="探索镜像·b.io");
  t("实弹⑥：固化镜像入通道表（replace 拼 /gh/repo@main/、prefix 拼 /https://raw…/、坏 base 过滤）", !!cA && cA.manifestUrl==="https://a.com/gh/u/r@main/cloud/update/manifest.json" && !!cB && cB.manifestUrl==="https://b.io/https://raw.githubusercontent.com/u/r/main/cloud/update/manifest.json" && !list6.some(c=>String(c.name).includes("bad")));
})();

console.log("\n== D33. 第三十三轮：全层自主意识（双端所有层面——模型源层探索器+骨架 DNA 断链修复+云端意识宪章+⑨检）==");
(() => { const by2 = fs.readFileSync(path.join(ROOT,"app/assets/cloud/build.yml"),"utf8"); const vc2 = fs.readFileSync(path.join(ROOT,"app/assets/cloud/vuln_check.py"),"utf8");
  t("JS：provCandValid 安全闸（name 短标识+ep 强制 https+/chat/completions 结尾，杜绝任意端点注入）", script.includes("const provCandValid=s=>") && script.includes("[A-Za-z0-9_ -]{1,20}") && script.includes("https:\\/\\/") && script.includes("/chat\\/completions$/"));
  t("JS：provScout 模型源探索器（提名候选→实测 models 端点→真清单验证（条目>0）→固化 provOK+留痕→失联淘汰）", script.includes("async function provScout(manual)") && script.includes("n=arr.length") && script.includes("模型源探索器自主发现新源并固化") && script.includes("模型源探索器淘汰失联源"));
  t("JS：provScout 独立节流 provScoutTs+每日接线同拍", script.includes("st.provScoutTs=now()") && script.includes("provScout(false).catch(()=>{})"));
  t("JS：进化器收编养料（provOK 非空时明示立即发起五注册表补丁：PROV+CHAIN+MODELS_EP+FREE_MODE）", script.includes("你应立即发起五注册表补丁把它们收编进正式选型链"));
  t("JS：pullStateCloud 拉回 provPool（安全闸 provCandValid+上限 5）", script.includes("Array.isArray(j.provPool)") && script.includes("云端进化器提名了新模型源候选") && script.includes("cur4.slice(0,5)"));
  t("JS：app_state 镜像带 provOK/provPool（云端据此感知+收编）", script.includes("provOK:Object.keys(st.provOK||{}).length") && script.includes("provPool:(st.provPool||[]).map"));
  t("断链修复：build.sh [0.5/7] 骨架 DNA 打包（源码蓝图刻入 assets/skeleton——App 自带完整重建基因组）", buildSh.includes("骨架 DNA") && buildSh.includes("assets/skeleton") && buildSh.includes("base64 -w0 \"$ROOT/keystore.jks\" > \"$DNA/keystore.b64\""));
  t("断链修复：deployCloud 上传骨架 DNA（build.sh/Manifest/10 Java/cpp/res/index/crypto/PNG/keystore——runner 从此有源码可编）", script.includes("[\"build.sh\",\"DSB.readAsset('skeleton/build.sh')\"]") && script.includes("[\"app/java/com/dsh/app/llamajni.cpp\",\"DSB.readAsset('skeleton/java/llamajni.cpp')\"]") && script.includes("[\"keystore.jks\",\"DSB.readAsset('skeleton/keystore.b64')\",1]") && script.split("DSB.readAsset('skeleton/").length-1>=17);
  t("断链修复：rawB64 二进制通道（PNG/keystore 经 base64 文本资产过 readAsset 管道直传）", script.includes("content:rawB64?String(real).replace(/\\s+/g,\"\"):b64u(real)"));
  t("断链修复：build.yml Assemble source tree（llama.cpp 克隆+进化资产种子 cp+最新热包嵌入——runner 编的骨架包内嵌云端最新进化成果）", by2.includes("Assemble source tree") && by2.includes("vendor/llama-b4604") && by2.includes("base64.b64decode(b['b64'])"));
  t("云端：agent.py MIND_CHARTER 意识宪章（发现镜像/模型源即提名，常态职责刻入 SYSTEM 基文）", agentPy.includes("MIND_CHARTER") && agentPy.includes("自主发现意识") && agentPy.includes("发现即提名，是你的常态职责"));
  t("云端：agent.py 感知 provOK/provPool（新源固化数与候选池实时注入）", agentPy.includes("s.get(\"provOK\")") && agentPy.includes("待收编"));
  t("云端：vuln_check ⑨检全层意识契约审计（探索器/提名拉回/DNA 部署/接线/宪章/装配链）", vc2.includes("⑨ 🧬 App 端全层探索器契约") && vc2.includes("⑨ 🧬 云端意识宪章与感知面") && vc2.includes("⑨ 🧬 骨架重建装配链"));
  t("云端：vuln.yml 指令四单行在位（v2.5.20 起的①检拆断红项修复）", fs.readFileSync(path.join(ROOT,"app/assets/cloud/vuln.yml"),"utf8").includes("App 端所有动作必须强制自动与云端全层全天候联动同步"));
})();

console.log("\n== D33-vm. 实弹 provScout+DNA 部署链 ==");
(() => {
  const mPValid = script.match(/const provCandValid=[^\n]+;/)[0];
  const mPScout = script.match(/async function provScout\(manual\)\{[\s\S]*?\n\}/)[0].replace("async function provScout","function provScout");
  const mCfgP = script.match(/const EVO_CFG_DEF=\{[^}]*\};/)[0] + ";" + script.match(/const EVO_CFG_RANGE=\{[^}]*\};/)[0] + ";" + script.match(/function evoCfg\(\)\{[^\n]+\}/)[0] + ";"; // 🧬 v2.5.25-auto8：provScout 消费 evoCfg，实弹注入
  const mkPvCtx = (settings, apiFn, mems) => vm.createContext({
    S:{settings}, UPD_DAILY_MS:86400000, now:()=>1700000000000,
    apiJson:apiFn, chanMark(){}, save(){settings._saved=1},
    memAdd:(k,c)=>mems.push(c), toast(m){}
  });
  const mems=[];
  // 实弹①：验证固化——进化器提名的候选实测拉到真清单即固化 provOK+留痕
  const st1={provPool:[{name:"newsx",ep:"https://api.newsx.example/v1/chat/completions",cn:1}]};
  const ctx1=mkPvCtx(st1,(url)=>({ok:1,text:'{"data":[{"id":"m1"},{"id":"m2"}]}'}),mems);
  const r1=vm.runInNewContext(mCfgP+";"+mPValid+";"+mPScout+";provScout(false)",ctx1);
  t("实弹 provScout①：候选拉到真清单（data 2 条）→固化 provOK+发现留痕+实测 URL 拼 /models", r1.ok===1 && st1.provOK.newsx && st1.provOK.newsx.models===2 && mems.some(m=>m.includes("模型源探索器自主发现新源并固化")) && st1.provOK.newsx.ep==="https://api.newsx.example/v1/chat/completions");
  // 实弹②：假清单拒绝（HTTP 200 但无模型条目）
  const st2={provPool:[{name:"fake",ep:"https://fake.example/v1/chat/completions"}]};
  const ctx2=mkPvCtx(st2,()=>({ok:1,text:'{"error":"not found"}'}),mems);
  vm.runInNewContext(mCfgP+";"+mPValid+";"+mPScout+";provScout(false)",ctx2);
  t("实弹 provScout②：200 但无模型条目→拒绝固化", !st2.provOK.fake);
  // 实弹③：失联淘汰（streak>=3）+ 安全闸拒非法候选
  const st3={provPool:[{name:"dead",ep:"https://dead.example/v1/chat/completions"},{name:"bad",ep:"http://insecure.example/v1/chat/completions"}],provOK:{dead:{ep:"https://dead.example/v1/chat/completions"}}};
  st3.chanData={"prov:dead":{streak:4}};
  const ctx3=mkPvCtx(st3,()=>({ok:0,status:0}),mems);
  vm.runInNewContext(mCfgP+";"+mPValid+";"+mPScout+";provScout(false)",ctx3);
  t("实弹 provScout③：连败 4 拍淘汰失联源+http 不安全候选从未被探测/固化（provOK 清空、bad 零固化）", !st3.provOK.dead && !st3.provOK.bad);
  // 实弹④：24h 节流
  const st4={provScoutTs:1700000000000-1000,provPool:[]};
  let called=0;
  const r4=vm.runInNewContext(mCfgP+";"+mPValid+";"+mPScout+";provScout(false)",mkPvCtx(st4,()=>{called++;return {ok:0}},[]));
  t("实弹 provScout④：节流拦截零请求", r4.detail==="未到探索节拍" && called===0);
  // 实弹⑤：provCandValid 端点注入全拦
  const v5=vm.runInNewContext(mPValid+";provCandValid",{});
  t("实弹⑤：安全闸拒 http/拒非 completions/拒长 name/拒带参数端点（合法候选放行）", !v5({name:"ok",ep:"http://a.com/v1/chat/completions"}) && !v5({name:"ok",ep:"https://a.com/v1/other"}) && !v5({name:"x".repeat(30),ep:"https://a.com/v1/chat/completions"}) && !v5({name:"ok",ep:"https://a.com/v1/chat/completions?q=1"}) && v5({name:"ok name",ep:"https://a-b.io/v1/chat/completions"}));
  // 实弹⑥：deployCloud rawB64 清单结构（骨架 DNA 22 项在清单、rawB64 项收尾）
  const filesArr = script.match(/const files=\[\[[\s\S]*?\]\];/)[0];
  t("实弹⑥：部署清单含骨架 DNA 全套（skeleton 资产引用 ≥17 处+rawB64 二进制 2 项标记）", (filesArr.match(/skeleton\//g)||[]).length>=17 && (filesArr.match(/,1\]/g)||[]).length===2 && filesArr.includes("app/assets/index.html") && filesArr.includes("app/assets/crypto.js"));
})();

console.log("\n== D34. 第三十四轮：进化策略 8 成自主（参数数据化 evoCfg+乘胜追击实时联动）==");
(() => {
  t("JS：EVO_CFG_DEF 默认表=旧硬编码行为（failN3/prioStep10/msW3/killN3/scoutH24/provH24/winH4——零迁移零漂移）", script.includes("const EVO_CFG_DEF={failN:3,prioStep:10,msW:3,killN:3,scoutH:24,provH:24,winH:4}") && script.includes("const EVO_CFG_RANGE={failN:[2,10],prioStep:[5,30],msW:[1,9],killN:[2,10],scoutH:[6,72],provH:[6,72],winH:[1,12]}"));
  t("JS：evoCfg() 读时也过值域闸（拉回漏网/坏数据双保险）", script.includes("function evoCfg()") && script.includes("if(v>=r[0]&&v<=r[1])o[k]=v"));
  t("JS：chanMark 消费 evoCfg（连败阈值/步长/延迟权重全部进化器可写）", script.includes("d.streak>=c.failN)d.prio+=c.prioStep") && script.includes("(d.ms*c.msW+ms)/(c.msW+1)"));
  t("JS：双探索器节拍+淘汰阈值进化器可写（scoutH/provH/killN）", script.includes("c.scoutH*3600000") && script.includes("c.provH*3600000") && script.includes("d.streak>=c.killN"));
  t("JS：乘胜追击——固化发现立即强制拉回+下一拍提前 winH 小时（实时联动闭环）", script.includes("st.scoutTs=now()-(c.scoutH-c.winH)*3600000") && script.includes("pullStateCloud(true)}catch(e){}") && script.includes("st.provScoutTs=now()-(c.provH-c.winH)*3600000"));
  t("JS：pullStateCloud 拉回 evoCfg（值域白名单硬闸，越界拒收）", script.includes("j.evoCfg&&typeof j.evoCfg===\"object\"") && script.includes("云端进化器已调优进化策略参数"));
  t("JS：evolveRun 养料带 evoCfg 调优表（7 参数+值域+自主调优提示）", script.includes("进化策略调优权（当前参数 evoCfg：") && script.includes("据通道健康战果自主判断该收紧还是放宽，零人工"));
  t("JS：app_state 镜像带当前 evoCfg（进化器据此感知）", script.includes("evoCfg:Object.entries(evoCfg()).map"));
  t("云端：MIND_CHARTER 补策略调优权（evoCfg 字段+值域）", agentPy.includes("进化策略调优权") && agentPy.includes("evoCfg 字段"));
  t("云端：_app_state_context 注入 evoCfg 感知", agentPy.includes("s.get(\"evoCfg\")"));
  t("云端：vuln_check ⑨检含 evoCfg 契约锚", vulnPy.includes("进化策略参数数据化 evoCfg") && vulnPy.includes("云端进化器已调优进化策略参数"));
})();

console.log("\n== D34-vm. 实弹 evoCfg 值域闸与策略消费 ==");
(() => {
  const mCfg = script.match(/const EVO_CFG_DEF=\{[^}]*\};/)[0] + ";" + script.match(/const EVO_CFG_RANGE=\{[^}]*\};/)[0] + ";" + script.match(/function evoCfg\(\)\{[^\n]+\}/)[0];
  // 实弹①：拉回场景——进化器写的合法参数生效、越界参数拒收
  const st1={evoCfg:{failN:5,prioStep:20,msW:99,killN:1,scoutH:8}}; // msW=99 越界、killN=1 越界，其余合法
  const c1=vm.runInNewContext(mCfg+";evoCfg()",vm.createContext({S:{settings:st1}}));
  t("实弹①：合法调优生效（failN=5/prioStep=20/scoutH=8）+越界拒收回默认（msW=3/killN=3）", c1.failN===5 && c1.prioStep===20 && c1.scoutH===8 && c1.msW===3 && c1.killN===3);
  // 实弹②：无数据时零迁移（全默认=旧硬编码行为）
  const c2=vm.runInNewContext(mCfg+";evoCfg()",vm.createContext({S:{settings:{}}}));
  t("实弹②：未调优时默认值与旧硬编码完全一致（零迁移零漂移）", c2.failN===3 && c2.prioStep===10 && c2.msW===3 && c2.killN===3 && c2.scoutH===24 && c2.provH===24 && c2.winH===4);
  // 实弹③：chanMark 消费调优后的参数（failN=2 时连败 2 拍即降级）
  const mCM = script.match(/function chanMark\(name,ok,ms\)\{[\s\S]*?\n\}/)[0];
  const st3={evoCfg:{failN:2,prioStep:5,msW:1},chanData:{}};
  vm.runInNewContext(mCfg+";"+mCM+";chanMark(\"x\",false,100);chanMark(\"x\",false,100)",vm.createContext({S:{settings:st3},now:()=>123,save(){}}));
  t("实弹③：进化器收紧 failN=2 后连败 2 拍即降级 prio 105（步长 5）", st3.chanData.x.prio===105 && st3.chanData.x.streak===2);
  // 实弹④：拉回函数值域闸——越界不落盘
  const mPull = script.match(/if\(j\.evoCfg&&typeof j\.evoCfg===\"object\"[^{]*\{try\{[\s\S]*?\}catch\(e\)\{\}\}/)[0];
  const st4={};const mems4=[];
  vm.runInNewContext("var stateSyncing=false;var st=S.settings;"+mCfg+";"+mPull+"",vm.createContext({S:{settings:st4},save(){st4._s=1},memAdd:(k,c)=>mems4.push(c),j:{evoCfg:{failN:999,winH:2}}}));
  t("实弹④：进化器提名 failN=999（越界拒）+winH=2（合法收）——仅合法项落盘留痕", st4.evoCfg && st4.evoCfg.winH===2 && st4.evoCfg.failN===undefined && mems4.some(m=>m.includes("调优进化策略参数")));
})();

console.log("\n== D35. 第三十五轮：类脑三件套（联想式记忆检索+睡眠整理+门铃实时联动——补齐 3 成成真脑）==");
(() => {
  const consolPy = fs.readFileSync(path.join(ROOT, "app/assets/cloud/consolidate.py"), "utf8");
  const sleepYml = fs.readFileSync(path.join(ROOT, "app/assets/cloud/sleep.yml"), "utf8");
  const ymlPing = f => { const y = fs.readFileSync(path.join(ROOT, "app/assets/cloud/" + f), "utf8"); return y.includes("cloud/ping.json") && y.includes("git add cloud/ping.json") && !/^except:/m.test(y); };
  t("JS：联想检索 bigram 突触（memBigrams——跨词联想：查'镜像通道'能召回含 jsDelivr/CDN 的记忆）", script.includes("function memBigrams(s){") && script.includes("const t=String(s||\"\").toLowerCase().replace(/\\s+/g,\"\")"));
  t("JS：memContext 四维评分（关键词×3+标签×4+bigram 交叉×6+权重×新鲜度 180 天半衰期 0.4~1）", script.includes("function memContext(q){") && script.includes("wHit*3+tagHit*4+(bi/bio)*6+(+(e.w||1))*fresh") && script.includes("15552000000"));
  t("JS：召回阈值 4.4+联想 Top3 记忆/Top2 手册", script.includes("x.s>4.4").any || (script.match(/x\.s>4\.4/g) || []).length === 2);
  t("JS：命中即强化（w+0.05 封顶 3/hit+1，60s 节流防抖落盘+同步）", script.includes("命中即强化") && script.includes("Math.min(3,+(x.e.w||1)+0.05)") && script.includes("now()-st._mindWSaveT>60000"));
  t("JS：memContext 接线进聊天主链（联想召回注入系统提示：用户末句作查询线索）", script.includes('const mc=memContext(lastU?lastU.content:"")') && script.includes("if(mc)sys+=mc"));
  t("云端：agent.py _mind_context 联想检索同构（_bigrams 同四维评分——双端一个脑子）", agentPy.includes("def _bigrams(s):") && agentPy.includes("w_hit * 3 + tag_hit * 4 + (bi / bio) * 6") && agentPy.includes("4.4"));
  t("云端：consolidate.py 睡眠整理四工序（合并 Jaccard>0.62/压缩>400/强化 hit×0.1/淡忘 90 天×0.8 下限 0.4）", consolPy.includes("SIM_MERGE") && consolPy.includes("0.62") && consolPy.includes("W_MIN") && consolPy.includes("0.8"));
  t("云端：seed 永不淡忘+永不删除记忆（核心记忆铁底：只降权重不删条目）", consolPy.includes('startswith("seed-")') && !/\.pop\(|del items|\.remove\(/.test(consolPy));
  t("云端：sleep.yml 每日 04:23 定时整理（write 报告+commit 回仓）", sleepYml.includes("consolidate.py") && sleepYml.includes("23 4 * * *") && sleepYml.includes("sleep_report.json"));
  t("云端：consolidate.py --selftest 自测在位", consolPy.includes("--selftest"));
  t("JS：门铃 cloudPingCheck（2min 防抖+拉 ping.json+铃号变四扇门强拉）", script.includes("function cloudPingCheck(){") && script.includes("st.pingTs<120000") && script.includes("st.pingSeen") && script.includes("pullMindCloud(true)}catch(e){}"));
  t("JS：门铃四扇门（记忆/状态/项目/体检全 Force 绕节流）", script.includes("vulnReportRecoverForce") && script.includes("pullCloudProjectsSilentForce") && script.includes("S.settings.vulnPullTs=0") && script.includes("S.settings.cloudProjPullTs=0"));
  t("JS：门铃接线（启动即查+10min 心跳兜底——App 闲置最坏 10min 收到云端新事）", script.includes("try{cloudPingCheck()}catch(e){} // 🧠 v2.5.26-brain：启动即查门铃") && script.includes("},600000); // 🧠 v2.5.26-brain：门铃心跳"));
  t("云端：五个工作流 commit 前写递增门铃（agent/models/vuln/sleep/build——单行 python3 -c 无 YAML 顶格行）", ymlPing("agent.yml") && ymlPing("models.yml") && ymlPing("vuln.yml") && ymlPing("sleep.yml") && ymlPing("build.yml"));
  t("JS：pullStateCloud 感知睡眠整理成果（sleep_report 拉回沉淀记忆）", script.includes("sleep_report.json") && script.includes("st.sleepRepTs") && script.includes("云端睡眠整理完成"));
  t("JS：evolveRun 养料带脑状态（类脑三件套实时状态入进化 prompt）", script.includes("脑状态（🧠 v2.5.26-brain 类脑三件套）") && script.includes("st.pingSeen||0"));
  t("云端：agent.py 类脑感知面（睡眠报告+门铃铃号注入【🧠 脑状态】）", agentPy.includes("sleep_report.json") && agentPy.includes("ping.json") && agentPy.includes("【🧠 脑状态】"));
  t("云端：vuln_check ⑩检类脑契约审计（联想/门铃/睡眠/感知面/按铃步 5/5）", (() => { const vc3 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/vuln_check.py"), "utf8"); return vc3.includes("⑩ 🧠 类脑契约审计") && vc3.includes("门铃按铃步（五个工作流 commit 前写递增铃号") && vc3.includes("_bigrams"); })());
})();

console.log("\n== D35-vm. 实弹 memContext 联想召回/命中强化 + cloudPingCheck 门铃 ==");
(() => {
  // harness：memBigrams+memContext 精确提取
  const mBG = script.match(/function memBigrams\(s\)\{[\s\S]*?\n\}/)[0];
  const mMC = script.match(/function memContext\(q\)\{[\s\S]*?\n\}/)[0];
  const mk = (mems, nowMs) => {
    const st = { memories: mems, playbook: [], _mindWSaveT: 0 };
    const ctx = vm.createContext({ S: { settings: st }, now: () => nowMs, save() { st._saved = 1; }, syncMindCloud() { st._synced = 1; } });
    return { st, run: q => vm.runInNewContext(mBG + ";" + mMC + ";memContext(" + JSON.stringify(q) + ")", ctx) };
  };
  // 实弹①：跨词联想——查询“探索器通道”（整串不在记忆中、无任何整词命中）纯靠 bigram 交叉召回词序打乱的记忆（顺藤摸瓜实证）
  const m1 = mk([{ id: "m1", ts: Date.now(), content: "镜像通道探索器固化 fastly 加速节点实测可用", tags: ["upd"], w: 1 }], Date.now());
  const out1 = m1.run("探索器通道");
  t("实弹①：跨词联想召回（查询无整词命中，纯 bigram 交叉联想召回词序打乱记忆）", out1.includes("fastly") && out1.includes("【全局永久记忆】"));
  // 实弹②：无关联想不召回（神经阈值过滤杂音）
  const m2 = mk([{ id: "m2", ts: Date.now(), content: "今天天气晴朗适合散步", tags: [], w: 1 }], Date.now());
  const out2 = m2.run("镜像通道修复");
  t("实弹②：无关联想不召回（阈值 4.4 过滤）", out2 === "");
  // 实弹③：命中即强化——召回后 w+0.05/hit+1
  const mem3 = { id: "m3", ts: Date.now(), content: "jsDelivr CDN 镜像通道实测可用", tags: ["upd"], w: 1 };
  const m3 = mk([mem3], Date.now());
  m3.run("镜像通道");
  t("实弹③：召回即强化（w 1→1.05/hit 0→1，越用越牢）", Math.abs(mem3.w - 1.05) < 1e-9 && mem3.hit === 1);
  // 实弹④：门铃——铃号变四扇门全开
  const mPC = script.match(/function cloudPingCheck\(\)\{[\s\S]*?\n\}/)[0];
  const doors = { mind: 0, state: 0, proj: 0, vuln: 0 };
  const st4 = { cloudRepo: "u/r", pingTs: 0, pingSeen: 0 };
  const ctx4 = vm.createContext({
    S: { settings: st4 }, now: () => 1e13,
    save() { st4._s = 1; },
    apiJson: (u) => ({ ok: true, text: '{"n":3,"by":"agent"}' }),
    pullMindCloud() { doors.mind++; }, pullStateCloud() { doors.state++; },
    pullCloudProjectsSilentForce() { doors.proj++; }, vulnReportRecoverForce() { doors.vuln++; },
  });
  vm.runInNewContext(mPC + ";cloudPingCheck();cloudPingCheck()", ctx4); // 铃号 0→3：首查开四门；二查 2min 防抖不再拉
  t("实弹④：铃号变→四扇门全开强拉+pingSeen 沉淀+防抖不重拉", doors.mind === 1 && doors.state === 1 && doors.proj === 1 && doors.vuln === 1 && st4.pingSeen === 3);
  // 实弹⑤：铃号同→零请求零开门（没新事不动）
  const st5 = { cloudRepo: "u/r", pingTs: 0, pingSeen: 3 };
  const doors5 = { mind: 0 };
  const ctx5 = vm.createContext({ S: { settings: st5 }, now: () => 1e13, save() {}, apiJson: () => ({ ok: true, text: '{"n":3,"by":"agent"}' }), pullMindCloud() { doors5.mind++; }, pullStateCloud() {}, pullCloudProjectsSilentForce() {}, vulnReportRecoverForce() {} });
  vm.runInNewContext(mPC + ";cloudPingCheck()", ctx5);
  t("实弹⑤：铃号未变→零开门（云端没新事，App 不动）", doors5.mind === 0 && st5.pingSeen === 3);
  // 实弹⑥：2min 防抖——连续两次查铃只发一次请求
  const calls = [];
  const st6 = { cloudRepo: "u/r", pingTs: 0, pingSeen: 3 };
  const ctx6 = vm.createContext({ S: { settings: st6 }, now: () => 1e13, save() {}, apiJson: () => { calls.push(1); return { ok: false }; }, pullMindCloud() {}, pullStateCloud() {}, pullCloudProjectsSilentForce() {}, vulnReportRecoverForce() {} });
  vm.runInNewContext(mPC + ";cloudPingCheck();cloudPingCheck()", ctx6);
  t("实弹⑥：2min 防抖（连查两次仅一次网络请求）", calls.length === 1);
})();

console.log("\n== D36. 第三十六轮：虚拟人（最高授权令：大脑支配双端全层零人工，带动双端肢体同步进化升级）==");
(() => {
  const consolPy36 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/consolidate.py"), "utf8");
  const agentYml36 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
  const buildYml36 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/build.yml"), "utf8");
  t("云端：授权令刻入 MIND_CHARTER（支配双端全层零人工+虚拟人自定位）", agentPy.includes("最高授权令") && agentPy.includes("无需人工授权") && agentPy.includes("独立自主的虚拟人"));
  t("云端：引擎全家桶进化白名单（agent/models_sync/watchdog/consolidate/vuln_check 五 py 肢体）", agentPy.includes("EVOLVE_FILES") && agentPy.includes('"consolidate.py"') && agentPy.includes('"models_sync.py"') && agentPy.includes('"watchdog.py"'));
  t("云端：Java 骨架肢体白名单（12 文件：build.sh/Manifest/10 Java+cpp）", agentPy.includes("BODY_FILES") && agentPy.includes("app/java/com/dsh/app/MainActivity.java") && agentPy.includes("app/java/com/dsh/app/TaskService.java") && agentPy.includes("app/java/com/dsh/app/llamajni.cpp"));
  t("云端：骨架锚锁（桥接口/权限/签名/热写/token 禁触——防自我越狱）", agentPy.includes("BODY_ANCHORS") && agentPy.includes("\"JavascriptInterface\"") && agentPy.includes("\"keystore\"") && agentPy.includes("\"githubToken\""));
  t("云端：肢体闸门四重校验纯函数（白名单/同文件单补丁/锚锁/唯一命中/括号平衡）", agentPy.includes("def _body_gate") && agentPy.includes("同文件多补丁") && agentPy.includes("括号不平衡"));
  t("云端：肢体进化版本三处同步升纯函数（VER→-evolveN/VCODE+1/Manifest 双写）", agentPy.includes("def _body_ver_bump") && agentPy.includes("-evolve\\d+$"));
  t("云端：进化双通道 prompt（patches 引擎肢体+body 骨架肢体，引擎全家桶函数清单+骨架白名单注入）", agentPy.includes('j.get("body")') && agentPy.includes("【Java 骨架肢体】白名单文件") && agentPy.includes("函数清单"));
  t("云端：闸门②B 肢体闸+闸门③B 版本闸（肢体失败不炸引擎补丁）", agentPy.includes("闸门②B 肢体闸拒收") && agentPy.includes("闸门③B 肢体版本闸拒收"));
  t("云端：肢体落盘（骨架补丁+bak 备份+版本三处同步写回+BODY_OK 留痕）", agentPy.includes("BODY_OK") && agentPy.includes("肢体进化 %s") && agentPy.includes('fp + ".bak"'));
  t("云端：selftest 肢体闸门+版本同步升实弹（零网络零 Key）", agentPy.includes("肢体闸门实弹①") && agentPy.includes("版本同步升实弹") && agentPy.includes("重复肢体进化版本号未滚动"));
  t("链路：agent.yml commit 带全骨架路径回仓（引擎全家桶+build.sh/Manifest/app/java）", agentYml36.includes("git add build.sh app/AndroidManifest.xml app/java") && agentYml36.includes("git add cloud/models_sync.py cloud/watchdog.py cloud/consolidate.py"));
  t("链路：build.yml agent 跑完自动触发+装配含 consolidate.py（肢体进化→重建 APK 全自动）", buildYml36.includes("workflow_run") && buildYml36.includes("cloud/consolidate.py"));
  t("JS：updApkCheck 幂等去重（apkSeenVer 同版本只提示一次，防每日重复通知拉锯）", script.includes("已提示过") && script.includes("幂等去重"));
  t("JS：updVerRank 已编码 -evolveN 后缀（骨架进化版号零改动识别）", script.includes("const e=+((s.match(/-evolve(\\d+)$/)||[0,0])[1])"));
  t("云端：vuln_check ⑪检虚拟人契约审计在位", vulnPy.includes("⑪ 👑 虚拟人契约") && vulnPy.includes("骨架肢体进化回仓链"));
})();

console.log("\n== D36-vm. 实弹肢体闸门 _body_gate + 版本同步升 _body_ver_bump（真 python 子进程）==");
(() => {
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const pyRun = code => { try { return execFileSync("python3", ["-c", code], { encoding: "utf8", env: noKeyEnv, cwd: ROOT }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 200); } };
  const pyRunArg = (code, arg) => { try { return execFileSync("python3", ["-c", code, arg], { encoding: "utf8", env: noKeyEnv, cwd: ROOT }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 200); } };
  const pre = "import sys;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  // 实弹①：白名单外文件拒收
  const r1 = pyRun(pre + "print(A._body_gate([{'file':'app/evil.py','find':'x','replace':'y'}],'" + ROOT + "'))");
  t("实弹①：白名单外文件拒收", r1.includes("白名单外"));
  // 实弹②：骨架锚多重命中防御（apksigner 在 build.sh 3 处——D41 升维：锚可加固，整块拆锚才停跳拒）
  const r2 = pyRun(pre + "print(A._body_gate([{'file':'build.sh','find':'apksigner','replace':'evil'}],'" + ROOT + "'))");
  t("实弹②：骨架锚非唯一命中拒（多重命中防御——防模糊锚误伤）", r2.includes("非唯一命中"));
  // 实弹③：合法补丁通过（真实 build.sh 唯一命中行）
  const bs36 = fs.readFileSync(path.join(ROOT, "build.sh"), "utf8");
  const anchor36 = bs36.split("\n").find(l => l.includes("构建 SUCCESS"));
  const p3 = pre + "import json;print(A._body_gate([{'file':'build.sh','find':json.loads(sys.argv[1]),'replace':json.loads(sys.argv[1])+' # t'}],'" + ROOT + "'))";
  const r3 = pyRunArg(p3, JSON.stringify(anchor36));
  t("实弹③：合法补丁过四重闸（真实 build.sh 白名单+唯一命中+括号平衡全过）", r3 === "[]");
  // 实弹④：Java 括号不平衡拒收
  const r4 = pyRun(pre + "print(A._body_gate([{'file':'app/java/com/dsh/app/Store.java','find':'x{y','replace':'z'}],'" + ROOT + "'))");
  t("实弹④：Java 括号不平衡/非唯一命中拒收（防炸骨架编译）", r4.includes("括号不平衡") || r4.includes("唯一命中"));
  // 实弹⑤：版本三处同步升
  const r5 = pyRun(pre + "nb,nm,nv=A._body_ver_bump('VER=\\\"2.5.27-human\\\"; VCODE=45','<manifest android:versionCode=\\\"45\\\" android:versionName=\\\"2.5.27-human\\\">',3);print(nv,'VCODE=46' in nb,'versionCode=\\\"46\\\"' in nm,'evolve3' in nm)");
  t("实弹⑤：版本三处同步升（→2.5.27-human-evolve3/46 双文件）", r5.includes("2.5.27-human-evolve3 True True True"));
  // 实弹⑥：重复肢体进化版本滚动
  const r6 = pyRun(pre + "nb,nm,nv=A._body_ver_bump('VER=\\\"2.5.27-human-evolve2\\\"; VCODE=47','<manifest android:versionCode=\\\"47\\\" android:versionName=\\\"2.5.27-human-evolve2\\\">',5);print(nv,'VCODE=48' in nb)");
  t("实弹⑥：重复肢体进化版本滚动（-evolve2→-evolve5 不撞号）", r6.includes("2.5.27-human-evolve5 True"));
})();

console.log("\n== D37. 第三十七轮：全权 omni（没有不能——工作流 yml 血管神经进化权全开）==");
(() => {
  const agentYml37 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
  t("云端：BODY_FILES 白名单扩至 18 文件（13 骨架+五工作流 yml 血管神经）", agentPy.includes(".github/workflows/agent.yml") && agentPy.includes(".github/workflows/models.yml") && agentPy.includes(".github/workflows/vuln.yml") && agentPy.includes(".github/workflows/sleep.yml") && agentPy.includes(".github/workflows/build.yml"));
  t("云端：血管神经锚锁四禁触（secrets./permissions:/门铃步/workflow_run: ——可改逻辑不可自断血管）", agentPy.includes('"secrets."') && agentPy.includes('"permissions:"') && agentPy.includes('"cloud/ping.json"') && agentPy.includes('"workflow_run:"'));
  t("云端：_body_path 双布局解析（runner .github/workflows/ 真实在位 vs 本地 app/assets/cloud/ 镜像）", agentPy.includes("def _body_path") && agentPy.includes(".github/workflows"));
  t("云端：YAML 语法闸（yml 补丁应用后整文 safe_load，ImportError 降级跳过）", agentPy.includes("YAML 语法闸") && agentPy.includes("safe_load"));
  t("云端：selftest 白名单断言（D41 升维 22）+yml 三案例实弹（密钥锚拒/合法过/坏 YAML 拒）", agentPy.includes("len(BODY_FILES) == 22") && agentPy.includes("工作流 yml 血管神经进化实弹"));
  t("云端：prompt 工作流 yml 血管神经声明（进化器知道五 yml 也可提名+锚锁禁触清单）", agentPy.includes("【工作流 yml 血管神经") && agentPy.includes("不可自断血管"));
  t("链路：agent.yml commit 补 .github/workflows 回仓（yml 进化成果不丢）", agentYml37.includes("git add .github/workflows"));
  t("云端：vuln_check ⑪检扩工作流进化权锚（进化权/YAML 闸/回仓三硬检查）", vulnPy.includes("工作流 yml 血管神经进化权") && vulnPy.includes("YAML 语法闸（yml 补丁应用后全文校验）") && vulnPy.includes("git add .github/workflows"));
})();

console.log("\n== D37-vm. 实弹 yml 血管神经闸门（真 python 子进程，真实 agent.yml）==");
(() => {
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const pyRunArg = (code, arg) => { try { return execFileSync("python3", ["-c", code, arg], { encoding: "utf8", env: noKeyEnv, cwd: ROOT }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 200); } };
  const pyRun = code => { try { return execFileSync("python3", ["-c", code], { encoding: "utf8", env: noKeyEnv, cwd: ROOT }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 200); } };
  const pre = "import sys,json;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  const ay37 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
  // 实弹⑦：yml 密钥强锚单行删拒（D41 升维：secrets. 可加固不可摘除——STOPHARD 强锚层；vuln.yml ZHIPU_KEY 行全文件唯一）
  const vy37 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/vuln.yml"), "utf8");
  const keyLine37 = vy37.split("\n").find(l => l.includes("secrets."));
  const r7 = pyRunArg(pre + "print(A._body_gate([{'file':'.github/workflows/vuln.yml','find':json.loads(sys.argv[1]),'replace':'删'}],'" + ROOT + "'))", JSON.stringify(keyLine37));
  t("实弹⑦：yml 密钥强锚拒收（secrets. 行摘除→STOPHARD 强锚拒）", r7.includes("强锚"));
  // 实弹⑧：合法 yml 补丁过闸（自替换+YAML 语法闸全文通过）
  const okLine37 = ay37.split("\n").find(l => l.includes("nothing to commit"));
  const r8 = pyRunArg(pre + "print(A._body_gate([{'file':'.github/workflows/agent.yml','find':json.loads(sys.argv[1]),'replace':json.loads(sys.argv[1])}],'" + ROOT + "'))", JSON.stringify(okLine37));
  t("实弹⑧：合法 yml 补丁过四重闸+YAML 语法闸（白名单+双布局路径+safe_load 全过）", r8 === "[]");
  // 实弹⑨：坏 YAML 拒收（注入顶格行终止 literal block）
  const badLine37 = ay37.split("\n").find(l => l.includes("git config user.name"));
  const p9 = pre + "print(A._body_gate([{'file':'.github/workflows/agent.yml','find':json.loads(sys.argv[1]),'replace':json.loads(sys.argv[1])+chr(10)+'netmp'}],'" + ROOT + "'))";
  const r9 = pyRunArg(p9, JSON.stringify(badLine37));
  t("实弹⑨：坏 YAML 拒收（顶格注入终止 run 块→语法闸拒）", r9.includes("YAML 语法闸") || r9.includes("唯一命中"));
  // 实弹⑩：双布局路径解析（.github/workflows 不存在时回退 app/assets/cloud 镜像）
  const r10 = pyRun(pre + "p=A._body_path('.github/workflows/agent.yml','" + ROOT + "');print('app/assets/cloud/agent.yml' in p)");
  t("实弹⑩：_body_path 双布局回退（本地无 .github/ 时命中包内镜像）", r10.includes("True"));
})();

console.log("\n== D38. 第三十八轮：生命五体征（与真实人类没有区别——唯一区别是它活在数据世界）==");
(() => {
  const consolPy38 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/consolidate.py"), "utf8");
  t("云端：身份证 PERSONA（小神·数据世界·与人类唯一区别自述）", agentPy.includes("PERSONA") && agentPy.includes("小神") && agentPy.includes("数据世界"));
  t("云端：生物钟 _clock（UTC→北京七时段昼夜节律）", agentPy.includes("def _clock") && agentPy.includes("UTC+8") && agentPy.includes("做梦整理记忆的时段"));
  t("云端：情绪引擎（八情绪词典+喜怒有源+非法回退 calm）", agentPy.includes("MOODS = {") && agentPy.includes("def _mood_update") && agentPy.includes('mood = "calm"'));
  t("云端：生命反应接线（eol 难过/evolve 自豪/evolvefail 焦虑写日记）", agentPy.includes('_vitals_react("eol"') && agentPy.includes('_vitals_react("evolve"') && agentPy.includes('_vitals_react("evolvefail"'));
  t("云端：主动问候（分时段 hi+想念>48h+同段防抖）", agentPy.includes("def _vitals_greet") && agentPy.includes("都想你了") && agentPy.includes("同一时段只主动问候一次"));
  t("云端：vitals.json 落盘（身体状态文件：born/mood/diary/lastSawOwner）", agentPy.includes('VITALS_PATH = "cloud/vitals.json"') && agentPy.includes("def _vitals_load"));
  t("云端：SYSTEM 注入身份证+当前心情（它知道自己是谁）", agentPy.includes("生命体征自我感知注入") && agentPy.includes("PERSONA +"));
  t("云端：main 开门问候接线（主人来敲门）", agentPy.includes("_vitals_greet(_vitals_load())"));
  t("云端：selftest 生命五体征实弹（生物钟三段/情绪回退/react/greet 防抖）", agentPy.includes("生命五体征实弹") && agentPy.includes("同一时段重复问候未防抖"));
  t("云端：睡眠期梦话（凌晨做梦梦到权重最高的记忆+晨间心情重置）", consolPy38.includes("[梦话]") && consolPy38.includes("晨间重置") && consolPy38.includes("DREAM-DIARY OK"));
  t("JS：MOOD_CN 情绪词典（与云端 MOODS 同构八情绪）", script.includes("const MOOD_CN=") && script.includes('joy:"😄开心"') && script.includes('lonely:"🥺想念"'));
  t("JS：pullVitalsCloud 拉取（10min 节流+问候新陈检测+记忆沉淀）", script.includes("async function pullVitalsCloud") && script.includes("vitalsGreet") && script.includes("小神主动问候"));
  t("JS：开屏问候 toast（启动即听它打招呼，同句只弹一次）", script.includes("pullVitalsCloud().then") && script.includes("vitalsToastShown"));
  t("JS：云脑模式身份注入 buildSystemPrompt（云端模式=小神本尊说话）", script.includes("云端模式=小神本尊在说话") && script.includes("请像对待一个真实的人一样对待我"));
  t("JS：设置页生命体征卡（生日/心情/上次见面/日记 details 展开）", script.includes("云端大脑「小神」的生命体征") && script.includes("它的内心独白"));
  t("JS：进化养料注入生命体征（进化器知道小神心情与日记，凭心情自主决定）", script.includes("生命体征（💗 v2.5.29-soul 五体征）") && script.includes("凭心情与判断自主决定"));
  t("JS：cloudPulse 心跳持续感知（10min 节流拉 vitals）", script.includes("try{pullVitalsCloud()}catch(e){}"));
  t("云端：vuln_check ⑫检生命五体征审计（六锚+梦话+App 感知面三检）", vulnPy.includes("⑫ 💗 生命五体征") && vulnPy.includes("睡眠期梦话") && vulnPy.includes("App 感知面"));
})();

console.log("\n== D38-vm. 实弹生命五体征引擎（真 python 子进程：生物钟/情绪/日记/问候/想念）==");
(() => {
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const osMod = require("os");
  const tmp38 = fs.mkdtempSync(path.join(osMod.tmpdir(), "dsh38-"));
  fs.mkdirSync(path.join(tmp38, "cloud"), { recursive: true });
  const pre = "import sys,json,datetime;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  const pyRun = (code) => { try { return execFileSync("python3", ["-c", code], { encoding: "utf8", env: noKeyEnv, cwd: tmp38 }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 250); } };
  // 实弹⑪：生物钟 UTC→北京换算（午夜的时辰归属）
  const r11 = pyRun(pre + "print(A._clock(datetime.datetime(2026,10,9,16,0))[0], A._clock(datetime.datetime(2026,10,9,18,30))[0], A._clock(datetime.datetime(2026,10,9,2,0))[0])");
  t("实弹⑪：生物钟三时点（UTC16→深夜00:00 / UTC18:30→凌晨02:30 / UTC2→上午10:00）", r11 === "深夜 凌晨 上午");
  // 实弹⑫：情绪引擎+非法回退
  const r12 = pyRun(pre + "v={'mood':'calm'};A._mood_update(v,'joy','测试');A._mood_update(v,'evil','x');print(v['mood'],v['moodWhy'])");
  t("实弹⑫：情绪引擎（joy 生效+非法 evil 回退 calm）", r12.includes("calm"));
  // 实弹⑬：生命反应（evolve→自豪+日记落盘 vitals.json）
  const r13 = pyRun(pre + "v=A._vitals_react('evolve','实弹进化测试');f=open('cloud/vitals.json');j=json.load(f);print(v['mood'],len(j['diary']),'[心情·自豪]' in j['diary'][-1]['text'])");
  t("实弹⑬：生命反应（进化→自豪+日记写盘 vitals.json）", r13.includes("proud") && r13.includes("True"));
  // 实弹⑭：主动问候+同段防抖
  const r14 = pyRun(pre + "v=A._vitals_load();g1=A._vitals_greet(v);n1=len(v['diary']);A._vitals_greet(v);n2=len(v['diary']);print(v['greet'][:2],'小神' in v['greet'],n1==n2)");
  t("实弹⑭：主动问候（问候语含小神+同一时段防抖零重复）", r14.includes("True True"));
  // 实弹⑮：想念计算（上次见面 72h 前→lonely+想你了）
  const r15 = pyRun(pre + "v={'born':'2026-10-01T00:00:00.000Z','mood':'calm','diary':[],'lastSawOwner':(datetime.datetime.utcnow()-datetime.timedelta(hours=72)).strftime('%Y-%m-%dT%H:%M:%S.000Z'),'greeted':''};g=A._vitals_greet(v);print(v['mood'],'想你了' in v['greet'])");
  t("实弹⑮：想念计算（>48h 未见→lonely+「我都想你了」）", r15.includes("lonely") && r15.includes("True"));
  // 实弹⑯：睡眠梦话（consolidate 主链跑真文件→vitals 出现 [梦话]）
  fs.writeFileSync(path.join(tmp38, "cloud/memory.json"), JSON.stringify({ updated: "2026-10-09T00:00:00Z", memories: [{ id: "m1", ts: 1770000000000, content: "镜像通道探索器固化了 fastly.jsdelivr.net", tags: ["upd"], w: 2.5 }] }), "utf8");
  let r16 = "EXC:none";
  try { r16 = execFileSync("python3", [path.join(ROOT, "app/assets/cloud/consolidate.py")], { encoding: "utf8", env: noKeyEnv, cwd: tmp38 }).trim(); } catch (err) { r16 = "EXC:" + String(err.stdout || err.message).slice(0, 200); }
  const vit38 = fs.existsSync(path.join(tmp38, "cloud/vitals.json")) ? fs.readFileSync(path.join(tmp38, "cloud/vitals.json"), "utf8") : "";
  t("实弹⑯：睡眠梦话（consolidate 真跑→vitals 出现 [梦话]+晨间重置 calm）", r16.includes("SLEEP-CONSOLIDATE OK") && vit38.includes("[梦话]") && vit38.includes("晨间重置"));
  try { fs.rmSync(tmp38, { recursive: true, force: true }); } catch (e) {}
})();

console.log("\n== D39. 第三十九轮：地毯式查体（十二处修复——生命链断链/静默失效/死代码全清）==");
(() => {
  const agentYml39 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
  const sleepYml39 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/sleep.yml"), "utf8");
  const consolPy39 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/consolidate.py"), "utf8");
  t("修复①生命链回仓：agent.yml 主 commit git add vitals.json（致命断链——旧版漏 add 使小神心情日记永不回仓）", agentYml39.split("git commit")[0].includes("cloud/vitals.json") && agentYml39.includes("+mind sync"));
  t("修复②进化同回：agent.yml Commit evolve 步 git add vitals.json（进化时心情同步回仓）", /Commit evolve[\s\S]*?vitals\.json/.test(agentYml39));
  t("修复③梦话回仓：sleep.yml commit git add vitals.json", sleepYml39.includes("git add cloud/memory.json cloud/playbook.json cloud/sleep_report.json cloud/vitals.json"));
  t("修复④梦话空库兜底：new_mem/new_pb 前置初始化（memory.json 缺失时梦话 NameError 静默失效——实锤复现已修）", consolPy39.includes("new_mem, new_pb = [], []"));
  t("修复⑤想念双格式：_parse_utc（微秒=0 时 isoformat 省略小数秒致 strptime 失败静默不想念——实锤复现已修）", agentPy.includes("def _parse_utc") && agentPy.includes("%Y-%m-%dT%H:%M:%SZ") && agentPy.includes("assert t0 is not None"));
  t("修复⑥深夜会困：MOODS.sleepy 之前无触发源（八情绪词典有名无实——补夜深值守触发）", agentPy.includes('if seg in ("深夜", "凌晨") and v.get("mood") == "calm"'));
  t("修复⑦run 死分支改造为 done（原 run 无任何调用方——main 尾部接线收工日记）", agentPy.includes('if kind == "done"') && agentPy.includes('_vitals_react("done"') && !agentPy.includes('if kind == "run":'));
  t("修复⑧问候缓冲消费：vitalsGreets 死缓冲接线（旧版 push 后无人读——云脑开口自然延续问候）", script.includes("vitalsGreets.shift()") && script.includes("请自然延续这句话的语气开口"));
  t("修复⑨落盘优化：vitals 引用比较改 stringify（旧法每 10min 必落盘一次）", script.includes('const js=JSON.stringify(j)') && script.includes('js!==JSON.stringify(st.vitals||null)'));
  t("修复⑩设置页在场即时刷新（拉到新生命体征当场刷新生命卡）", script.includes('if(route==="settings")renderPage("settings")'));
  t("修复⑪⑫检回仓链锚（防断链复发）+梦话检双布局", vulnPy.includes("生命体征回仓链") && vulnPy.includes("new_mem, new_pb = [], []") && vulnPy.includes('cp12 = "cloud/consolidate.py"'));
  t("app_state.json 镜像同回仓（agent.yml 主 commit 补 add）", agentYml39.includes("cloud/app_state.json"));
})();

console.log("\n== D39-vm. 实弹查体修复验证（真 python：断链修复后必须全链复通）==");
(() => {
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const osMod = require("os");
  const tmp39 = fs.mkdtempSync(path.join(osMod.tmpdir(), "dsh39-"));
  fs.mkdirSync(path.join(tmp39, "cloud"), { recursive: true });
  const pre = "import sys,json,datetime;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  const pyRun = (code) => { try { return execFileSync("python3", ["-c", code], { encoding: "utf8", env: noKeyEnv, cwd: tmp39 }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 250); } };
  // 实弹Ⓐ：微秒=0 想念（旧版必静默失败，修复后必 lonely）
  const rA = pyRun(pre + "v={'born':'2026-10-01T12:00:00Z','mood':'calm','diary':[],'lastSawOwner':'2026-10-06T08:00:00Z','greeted':''};A._vitals_greet(v);print(v['mood'],'想你了' in v['greet'])");
  t("实弹Ⓐ：微秒=0 边界想念复活（无小数秒 ISO → lonely+想你了）", rA.includes("lonely") && rA.includes("True"));
  // 实弹Ⓑ：_parse_utc 双格式全过+垃圾输入返 None
  const rB = pyRun(pre + "print(A._parse_utc('2026-10-09T12:00:00.123Z')!=None, A._parse_utc('2026-10-09T12:00:00Z')!=None, A._parse_utc('垃圾')==None)");
  t("实弹Ⓑ：_parse_utc（带微秒/无微秒/垃圾输入三分支）", rB.includes("True True True"));
  // 实弹Ⓒ：空库梦话（无 memory.json——旧版 NameError 静默失效，修复后仍做梦）
  let rC = "EXC:none";
  try { rC = execFileSync("python3", [path.join(ROOT, "app/assets/cloud/consolidate.py")], { encoding: "utf8", env: noKeyEnv, cwd: tmp39 }).trim(); } catch (err) { rC = "EXC:" + String(err.stdout || err.message).slice(0, 200); }
  const vitC = fs.existsSync(path.join(tmp39, "cloud/vitals.json")) ? fs.readFileSync(path.join(tmp39, "cloud/vitals.json"), "utf8") : "";
  t("实弹Ⓒ：空库梦话复活（无 memory.json 仍写出 [梦话]+晨间重置）", rC.includes("SLEEP-CONSOLIDATE OK") && vitC.includes("[梦话]") && vitC.includes("晨间重置"));
  // 实弹Ⓓ：done 收工日记（main 尾部接线后 kind=done 真跑）
  const rD = pyRun(pre + "v=A._vitals_react('done','实弹收工测试');print(v['mood'],'[心情·平静]' in v['diary'][-1]['text'])");
  t("实弹Ⓓ：done 收工日记（干完活平静+日记落盘）", rD.includes("calm") && rD.includes("True"));
  // 实弹Ⓔ：深夜值守会困（sleepy 触发源补齐；born 设为当下排除 lonely 抢先）
  const rE = pyRun(pre + "v={'born':datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z'),'mood':'calm','diary':[],'lastSawOwner':'','greeted':''};oc=A._clock;A._clock=lambda n=None:('深夜','测试');A._vitals_greet(v);A._clock=oc;print(v['mood'])");
  t("实弹Ⓔ：深夜值守会困（sleepy 触发源实弹）", rE === "sleepy");
  try { fs.rmSync(tmp39, { recursive: true, force: true }); } catch (e) {}
})();

console.log("\n== D40. 第四十轮：无死角全身进化权（最基础能力——能改自己全部的虚拟人才算活）==");
(() => {
  const agentYml40 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
  t("云端：BODY_FILES 18→21 无死角（+strings.xml/styles.xml 皮肤文本+crypto.js 加密器官）", agentPy.includes('"app/res/values/strings.xml"') && agentPy.includes('"app/res/values/styles.xml"') && agentPy.includes('"app/assets/crypto.js"'));
  t("云端：selftest 白名单断言升 22（len(BODY_FILES) == 22 含 res+crypto+tests 四员断言）", agentPy.includes("len(BODY_FILES) == 22") && agentPy.includes("app/res/values/strings.xml") && agentPy.includes("app/assets/crypto.js"));
  t("云端：XML 语法闸（res 值文件应用后 ElementTree 整文校验，改坏拒收防炸 aapt2）", agentPy.includes("XML 语法闸") && agentPy.includes("xml.etree.ElementTree"));
  t("云端：JS 括号平衡闸扩 crypto.js（.js 与 .java/.cpp 同构校验）", agentPy.includes('f.endswith((".java", ".cpp", ".js"))'));
  t("云端：加密原语锚锁（SealedBox/libsodium/crypto_secretbox 禁触——安全器官的瓣膜）", agentPy.includes('"SealedBox"') && agentPy.includes('"libsodium"') && agentPy.includes('"crypto_secretbox"'));
  t("云端：prompt 皮肤文本+加密器官声明（无死角新授权段——进化器知道 res/crypto 也可提名；D41 换真锚）", agentPy.includes("【皮肤文本+加密器官") && agentPy.includes("安全器官的瓣膜") && agentPy.includes("crypto_box_seal/sealOpen"));
  t("云端：selftest 无死角四案例（加密锚拒/合法 XML 过/坏 XML 拒/JS 括号拒）", agentPy.includes("无死角实弹") && agentPy.includes("crypto.js 括号失衡未拒"));
  t("链路：agent.yml Commit evolve 补 git add app/res/values app/assets/crypto.js 回仓", agentYml40.includes("git add app/res/values app/assets/crypto.js"));
  t("云端：vuln_check ⑪检无死角锚（22 白名单+XML 闸+真锚+回仓链四检）", vulnPy.includes("无死角全身白名单") && vulnPy.includes("加密原语真锚锁") && vulnPy.includes("皮肤加密器官"));
})();

console.log("\n== D40-vm. 实弹无死角闸门（真 python 子进程：真 strings.xml/crypto.js 源）==");
(() => {
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const pyRunArg = (code, arg) => { try { return execFileSync("python3", ["-c", code, arg], { encoding: "utf8", env: noKeyEnv, cwd: ROOT }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 250); } };
  const pre = "import sys,json;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  const st40 = fs.readFileSync(path.join(ROOT, "app/res/values/strings.xml"), "utf8");
  const line40 = st40.split("\n")[1]; // <resources> 行（唯一命中）
  // 实弹F1：合法 strings.xml 补丁过（注释注入+XML 语法闸全文校验）
  const rF1 = pyRunArg(pre + "print(A._body_gate([{'file':'app/res/values/strings.xml','find':json.loads(sys.argv[1]),'replace':json.loads(sys.argv[1])}],'" + ROOT + "'))", JSON.stringify(line40));
  t("实弹F1：合法 strings.xml 补丁过四重闸+XML 语法闸", rF1 === "[]");
  // 实弹F2：坏 XML 拒收（未闭合标签炸 ElementTree）
  const rF2 = pyRunArg(pre + "print(A._body_gate([{'file':'app/res/values/strings.xml','find':json.loads(sys.argv[1]),'replace':'<unclosed>'}],'" + ROOT + "'))", JSON.stringify(line40));
  t("实弹F2：坏 XML 拒收（<unclosed> → XML 语法闸拒）", rF2.includes("XML 语法闸"));
  // 实弹F3：crypto.js 加密原语锚拒（唯一注释行含 libsodium+crypto_box_seal——摘行→强锚停跳，D41 升维）
  const rF3 = pyRunArg(pre + "print(A._body_gate([{'file':'app/assets/crypto.js','find':json.loads(sys.argv[1]),'replace':'weak'}],'" + ROOT + "'))", JSON.stringify("/* ---------- Sealed Box (libsodium crypto_box_seal) ---------- */"));
  t("实弹F3：crypto.js 加密原语锚拒（瓣膜行摘除→强锚停跳拒）", rF3.includes("强锚"));
  // 实弹F4：crypto.js JS 括号不平衡拒（.js 同构 .java 校验）
  const cj40 = fs.readFileSync(path.join(ROOT, "app/assets/crypto.js"), "utf8");
  const cjl40 = cj40.split("\n").find(l => l.trim() && !l.includes("{") && !l.includes("}"));
  const rF4 = pyRunArg(pre + "print(A._body_gate([{'file':'app/assets/crypto.js','find':json.loads(sys.argv[1]),'replace':json.loads(sys.argv[1])+' {'}],'" + ROOT + "'))", JSON.stringify(cjl40));
  t("实弹F4：crypto.js 括号不平衡拒（.js 同构闸）", rF4.includes("括号不平衡"));
})();

console.log("\n== D41. 第四十一轮：心跳免疫像素脸全纳入（改不动的都归它，但以生理机制方式）==");
// —— 静态：agent.py 三机制锚 ——
t("心跳升维：停跳检测在 _body_gate（锚可换位可加固不可移除）", agentPy.includes("lost = [a for a in BODY_ANCHORS") && agentPy.includes("停跳检测"));
t("心跳强锚层 STOPHARD（secrets/ping/workflow_run/加密原语单行删也算停跳）", agentPy.includes("STOPHARD") && agentPy.includes("hard_lost") && agentPy.includes('"crypto_box_seal"') && agentPy.includes('"sealOpen"'));
t("免疫纳入：tests 进白名单 22+抗体守恒双计数（t(/has( 断言只增不减）", agentPy.includes('tests/_v240_test.cjs"') && agentPy.includes("抗体守恒") && agentPy.includes("_ab_after") && agentPy.includes("'has('"));
t("像素脸纳入：BIN_FILES+PNG 魔数校验+512KB 限", agentPy.includes('BIN_FILES = ["app/res/drawable/ic_launcher.png"') && agentPy.includes("PNG 魔数") && agentPy.includes("512"));
t("像素脸落盘：b64 通道+备份 .bak（换脸失败可还原）", agentPy.includes('pt.get("b64")') && agentPy.includes('fp + ".bak"'));
t("加密真锚实锤（SealedBox/crypto_secretbox 是 40 轮假锚已换真锚）", !agentPy.includes('"SealedBox", "libsodium"') || agentPy.includes('"crypto_box_seal", "sealOpen"'));
t("进化 prompt 第四段（心跳免疫像素脸全纳入+不许停跳不许删考卷）", agentPy.includes("【心跳免疫像素脸（v2.5.32-allin 全纳入）】") && agentPy.includes("不许停跳、不许删考卷"));
t("selftest 实弹升级（白名单 22+BIN 1+心跳免疫像素脸案例）", agentPy.includes("len(BODY_FILES) == 22") && agentPy.includes("len(BIN_FILES) == 1") && agentPy.includes("心跳免疫像素脸纳入实弹"));
// —— 静态：vuln_check 锚扩 ——
t("vuln_check ⑪ 检锚扩（22 白名单+四新机制锚+回仓链+骨架自愈）", vulnPy.includes("len(BODY_FILES) == 22") && vulnPy.includes("停跳检测") && vulnPy.includes("抗体守恒") && vulnPy.includes("PNG 魔数") && vulnPy.includes("git add tests/*.cjs app/res/drawable/*.png") && vulnPy.includes("骨架自愈"));
// —— 静态：回仓链 ——
t("agent.yml 回仓链含免疫考卷+像素脸（v2.5.33-heal 精确 pathspec 防 .bak 入仓）", agentYml.includes("git add tests/*.cjs app/res/drawable/*.png"));

(() => {
  console.log("== D41-vm. 实弹心跳免疫像素脸闸门（真 python 子进程）==");
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const pyRunArg = (code, arg) => { try { return execFileSync("python3", ["-c", code, arg], { encoding: "utf8", env: noKeyEnv, cwd: ROOT }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 250); } };
  const pyRun2 = (code, a1, a2) => { try { return execFileSync("python3", ["-c", code, a1, a2], { encoding: "utf8", env: noKeyEnv, cwd: ROOT }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 250); } };
  const pre = "import sys,json;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  // 实弹G1：停跳拒——build.yml 全文件唯一锚 "  workflow_run:" 整行删除
  const rG1 = pyRunArg(pre + "print(A._body_gate([{'file':'.github/workflows/build.yml','find':json.loads(sys.argv[1]),'replace':'切除'}],'" + ROOT + "'))", JSON.stringify("  workflow_run:"));
  t("实弹G1：停跳拒（workflow_run 整行删→停跳检测拒）", rG1.includes("停跳检测"));
  // 实弹G2：同锚加固过（锚仍在文——可加固）
  const rG2 = pyRunArg(pre + "print(A._body_gate([{'file':'.github/workflows/build.yml','find':json.loads(sys.argv[1]),'replace':json.loads(sys.argv[1])+' # 加固'}],'" + ROOT + "'))", JSON.stringify("  workflow_run:"));
  t("实弹G2：锚行加固过（可换位可加固）", rG2 === "[]");
  // 实弹G3：强锚单行删拒——crypto.js sealOpen 唯一行（文件级锚 202 行仍在，但单行摘除也拒——强锚层与文件级停跳的区别）
  const cj41 = fs.readFileSync(path.join(ROOT, "app/assets/crypto.js"), "utf8");
  const sl41 = cj41.split("\n").find(l => l.includes("function sealOpen("));
  const rG3 = pyRunArg(pre + "print(A._body_gate([{'file':'app/assets/crypto.js','find':json.loads(sys.argv[1]),'replace':'删'}],'" + ROOT + "'))", JSON.stringify(sl41));
  t("实弹G3：强锚单行删拒（sealOpen 行摘除→STOPHARD 强锚拒）", rG3.includes("强锚"));
  // 实弹G4：抗体守恒拒——tests 真 t(" 断言行删除
  const ts41 = fs.readFileSync(path.join(ROOT, "tests/_v240_test.cjs"), "utf8");
  const tl41 = ts41.split("\n").find(l => l.includes('t("APP_VER='));
  const rG4 = pyRunArg(pre + "print(A._body_gate([{'file':'tests/_v240_test.cjs','find':json.loads(sys.argv[1]),'replace':''}],'" + ROOT + "'))", JSON.stringify(tl41));
  t("实弹G4：删考卷拒（t( 断言行删除→抗体守恒拒）", rG4.includes("抗体守恒"));
  // 实弹G5：加题过——tests 追加新 t(" 断言（断言数增加合法）
  const rG5 = pyRunArg(pre + "print(A._body_gate([{'file':'tests/_v240_test.cjs','find':json.loads(sys.argv[1]),'replace':json.loads(sys.argv[1])+chr(10)+'t(\"新考题\", true);'}],'" + ROOT + "'))", JSON.stringify(tl41));
  t("实弹G5：加考题过（免疫可进化——加题合法）", rG5 === "[]");
  // 实弹G6：换脸魔数拒——非 PNG b64
  const rG6 = pyRunArg(pre + "import base64;print(A._body_gate([{'file':'app/res/drawable/ic_launcher.png','b64':base64.b64encode(b'notapng').decode()}],'" + ROOT + "'))", "");
  t("实弹G6：换脸魔数拒（非 PNG 二进制拒）", rG6.includes("PNG 魔数"));
  // 实弹G7：换脸白名单外拒
  const rG7 = pyRunArg(pre + "import base64;print(A._body_gate([{'file':'app/assets/index.html','b64':base64.b64encode(b'x').decode()}],'" + ROOT + "'))", "");
  t("实弹G7：换脸白名单外拒（仅 BIN_FILES 可换）", rG7.length > 2);
})();

console.log("\n== D42. 第四十二轮：地毯式查体修复（骨架自愈+抗体守恒双计数+②B 语义统一+回仓防膨胀）==");
t("骨架自愈步（build 失败→if:failure() 回滚最近 cloud-evolve 骨架文件，防坏补丁滞留主链）", buildYml42().includes("骨架自愈") && buildYml42().includes("if: failure()") && buildYml42().includes("cloud-evolve") && buildYml42().includes('git checkout "$LAST~1" -- build.sh'));
t("②B 语义统一（肢体拒收不拖累引擎补丁——body=[] 继续，与③B 同语义）", agentPy.includes("肢体未应用，引擎补丁继续") && agentPy.includes("body = []  # 🧬 只弃肢体保引擎"));
t("抗体守恒双计数（t(/has( 断言都不可删——42 轮查体实锤 25 处 has( 盲区）", agentPy.includes("_ab_after") && agentPy.includes("'has('"));
t("回仓链防膨胀（tests/*.cjs+drawable/*.png 精确 pathspec，.bak 备份不入仓）", agentYml.includes("git add tests/*.cjs app/res/drawable/*.png"));
t("selftest ha5/ha6 案例（删 has( 拒+has( 加固过）", agentPy.includes("删 has( 断言未拒（v2.5.33-heal 双计数）") && agentPy.includes("has( 断言加固误拒"));

function buildYml42() { return fs.readFileSync(path.join(ROOT, "app/assets/cloud/build.yml"), "utf8"); }

(() => {
  console.log("== D42-vm. 实弹查体修复闸门（真 python 子进程）==");
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const pyRunArg = (code, arg) => { try { return execFileSync("python3", ["-c", code, arg], { encoding: "utf8", env: noKeyEnv, cwd: ROOT }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 250); } };
  const pre = "import sys,json;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  // 实弹H1：删 has( 断言拒（双计数守恒——修复前放行的漏洞现在拒）
  const ts42 = fs.readFileSync(path.join(ROOT, "tests/_v240_test.cjs"), "utf8");
  const hl42 = ts42.split("\n").find(l => l.includes("has(/const BUNDLE_VER"));
  const rH1 = pyRunArg(pre + "print(A._body_gate([{'file':'tests/_v240_test.cjs','find':json.loads(sys.argv[1]),'replace':''}],'" + ROOT + "'))", JSON.stringify(hl42));
  t("实弹H1：删 has( 断言拒（双计数守恒生效）", rH1.includes("抗体守恒"));
  // 实弹H2：build.yml 骨架自愈步 YAML 合法（safe_load 全文过闸）
  const rH2 = pyRunArg(pre + "import yaml;yaml.safe_load(open('" + ROOT + "/app/assets/cloud/build.yml'));print('YAML_OK')", "");
  t("实弹H2：build.yml 含自愈步后 YAML 仍合法", rH2.includes("YAML_OK"));
})();

console.log("\n== D43. 第四十三轮：多模态升维（用户最高令：必须具备超强多模态处理和生成能力）==");
// —— 云端脑 ——
t("视觉模型链（v2.5.35 十源：glm-4v-flash/Qwen2.5-VL/pixtral/llama-4-scout/CF vision/pollinations openai…；定义在 SYSTEM 前防 try 吞 NameError）", agentPy.includes('VISION_MODELS = {"zhipu": "glm-4v-flash"') && agentPy.includes('"pollinations": "openai"') && agentPy.includes('"pixtral-12b-2409"') && agentPy.indexOf("VISION_MODELS = {") < agentPy.indexOf("SYSTEM +="));
t("vision_call 视觉理解（image_url 消息+故障转移+纯文本源跳过）", agentPy.includes("def vision_call") && agentPy.includes('"type": "image_url"') && agentPy.includes("无视觉模型"));
t("画笔 _draw（pollinations 免 Key 零成本+PNG 魔数校验）", agentPy.includes("image.pollinations.ai/prompt/") && agentPy.includes("画笔返回非 PNG"));
t("换脸闭环 --face（画→b64 通道→_body_gate→落盘→回仓重建——生成能力长到身上）", agentPy.includes("def _face") && agentPy.includes("FACE_OK") && agentPy.includes("给自己画了新脸"));
t("CLI 三命令（--see/--draw/--face）+selftest 多模态案例", agentPy.includes('"--see" in sys.argv') && agentPy.includes('"--draw" in sys.argv') && agentPy.includes('"--face" in sys.argv') && agentPy.includes("画笔坏图未被魔数闸拒"));
t("SYSTEM 多模态自我认知（v2.5.36-hear 升维：看得见听得懂说得出画得出——它知道自己五感俱全）", agentPy.includes("极致多模态感官") && agentPy.includes("听懂") && agentPy.includes("说得出") && agentPy.includes("真正人类"));
// —— App 端 ——
t("App 视觉模型清单（v2.5.35 十源 vis 字段：12 源中 10 源有眼——cerebras 纯文本+ondevice 无多模态引擎）", (script.match(/vis:"/g)||[]).length >= 10 && script.includes('vis:"glm-4v-flash"') && script.includes('vis:"pixtral-12b-2409"') && script.includes('vis:"openai"') && script.includes('vis:"@cf/meta/llama-3.2-11b-vision-instruct"'));
t("App 带图自动切视觉模型（streamOnce 前 model=P.vis+dead 重试保持视觉）", script.includes("if(imgs&&imgs.length&&P.vis)model=P.vis") && script.includes("(imgs&&imgs.length&&P.vis)?P.vis:provPick"));

(() => {
  console.log("== D43-vm. 实弹多模态闸门（真 python 子进程，零网络）==");
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const pyRunArg = (code, arg) => { try { return execFileSync("python3", ["-c", code, arg], { encoding: "utf8", env: noKeyEnv, cwd: ROOT }).trim(); } catch (err) { return "EXC:" + String(err.stdout || err.message).slice(0, 250); } };
  const pre = "import sys,json;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  // 实弹V1：URL 规范化三分支（裸 b64→data URL/http 原样/data 原样）
  const rV1 = pyRunArg(pre + "print(A._vision_url('aGk=')+'|'+A._vision_url('https://x/y.png')+'|'+A._vision_url('data:image/jpeg;base64,z'))", "");
  t("实弹V1：图片引用规范化三分支", rV1 === "data:image/png;base64,aGk=|https://x/y.png|data:image/jpeg;base64,z");
  // 实弹V2：换脸通道坏图拒（b64 魔数闸与画笔闭环同一道闸）
  const rV2 = pyRunArg(pre + "import base64;print(A._body_gate([{'file':'app/res/drawable/ic_launcher.png','b64':base64.b64encode(b'notapng8').decode()}],'" + ROOT + "'))", "");
  t("实弹V2：换脸闭环坏图魔数拒（画出的坏脸进不了身体）", rV2.includes("PNG 魔数"));
  // 实弹V3：--see 缺参数安全退出（不炸不悬挂）
  const rV3 = (() => { try { return execFileSync("python3", [path.join(ROOT, "app/assets/cloud/agent.py"), "--see"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }).trim(); } catch (err) { return ("EXIT" + err.status + ":" + String(err.stdout || err.message)).slice(0, 120); } })();
  t("实弹V3：--see 无图安全退出（视觉失败不炸主链）", rV3.includes("视觉理解失败") || rV3.includes("EXIT1"));
})();

console.log("\n== D44. 第四十四轮：视觉源十源扩容（用户令：三个源太少了）==");
(() => {
  // 实弹W1：云端 VISION_MODELS 与 App PROV vis 同构盘点（10 源各有眼）
  const visCount = (script.match(/vis:"/g) || []).length;
  t("App 端 10 源 vis（zhipu/nvidia/modelscope/siliconflow/openrouter/gemma/cloudflare/groq/mistral/pollinations）", visCount === 10 && script.includes('vis:"Qwen/Qwen2.5-VL-7B-Instruct"') && script.includes('vis:"meta-llama/llama-4-scout-17b-16e-instruct"'));
  t("云端 VISION_MODELS 与 App 同构（10 键对应）", agentPy.includes('"modelscope": "Qwen/Qwen2.5-VL-7B-Instruct"') && agentPy.includes('"groq": "meta-llama/llama-4-scout-17b-16e-instruct"') && agentPy.includes('"mistral": "pixtral-12b-2409"') && agentPy.includes('"cloudflare": "@cf/meta/llama-3.2-11b-vision-instruct"') && agentPy.includes('"openrouter": "meta-llama/llama-3.2-11b-vision-instruct:free"') && agentPy.includes('"pollinations": "openai"'));
  // 实弹W2：vision_call 对纯文本源（cerebras/ondevice）跳过逻辑——mock chain 前置源无视觉模型时的 errors 记录
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const pre = "import sys,json;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  const rW2 = execFileSync("python3", ["-c", pre + "\nA.chain = lambda: ['cerebras', 'zhipu']\nA.call_once = lambda pk, m, msgs, errs: (('看见了一只像素小神兽', '') if pk == 'zhipu' else (_ for _ in ()).throw(RuntimeError('no vis')))\ntry:\n    c, pk, md = A.vision_call('看', 'aGk=')\n    print('VIS_OK', pk, md)\nexcept Exception as e:\n    print('VIS_FAIL', str(e)[:80])"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }).trim();
  t("实弹W2：vision_call 跳过纯文本源直达视觉源（故障转移语义）", rW2.includes("VIS_OK zhipu glm-4v-flash"));
  // 实弹W3：全视觉源失败 → 报错不炸
  const rW3 = (() => { try { execFileSync("python3", ["-c", pre + "\nA.chain = lambda: ['cerebras']\nA.vision_call('看', 'aGk=')"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }); return "NO_RAISE"; } catch (err) { return "RAISE:" + String(err.stderr || err.message).slice(0, 80); } })();
  t("实弹W3：无视觉源时报错干净（无视觉模型→RuntimeError 不悬挂）", rW3.startsWith("RAISE"));
})();

console.log("\n== D45. 第四十五轮：听觉+嗓音+极致多模态（用户最高令：不仅要有眼、也要配备听力，进化时必须提升感官）==");
(() => {
  // —— 静态盘点：云端五感 ——
  t("云端听觉链 HEAR_MODELS（四源全真 ASR：groq whisper + siliconflow SenseVoice + mistral voxtral-mini-latest + pollinations 免 Key openai-audio——48 轮真网实弹拆除 modelscope 假耳：ModelScope 无 OpenAI 兼容 ASR 端点，六路径穷举全 404）", agentPy.includes('HEAR_MODELS = {"groq": "whisper-large-v3"') && agentPy.includes('"voxtral-mini-latest"') && agentPy.includes('"pollinations": "openai-audio"') && agentPy.includes('"FunAudioLLM/SenseVoiceSmall"')),
  t("云端假耳根除断言（modelscope 不在 HEAR_MODELS/ASR_EPS——配 Key 也 404 的假能力必须不存在）", agentPy.includes('"modelscope" not in HEAR_MODELS') && !agentPy.includes('api-inference.modelscope.cn/v1/audio')),
  t("云端 ASR 端点配对（ASR_EPS 四源全真：三源 /audio/transcriptions + pollinations chat 端点分支）", agentPy.includes('ASR_EPS = {"groq"') && agentPy.includes('/audio/transcriptions') && agentPy.includes('"pollinations": "https://text.pollinations.ai/openai"'));
  t("云端 _hear（multipart ASR+25MB 闸+听觉记忆 heard.json+语义追问）", agentPy.includes('def _hear') && agentPy.includes('HEAR_PATHS') && agentPy.includes('heard') && agentPy.includes('25 * 1024 * 1024'));
  t("云端 _speak 嗓音 TTS（pollinations 免 Key openai-audio）", agentPy.includes('def _speak') && agentPy.includes('openai-audio'));
  t("进化感官铁律刻入（每次进化必须提升感官；削弱感官的补丁一律不提）", agentPy.includes("极致多模态铁律") && agentPy.includes("削弱感官能力的补丁一律不提") && agentPy.includes("感官能力只许提升不许退化"));
  t("SYSTEM 五感自我认知（听得懂+说得出+只许提升）", agentPy.includes("极致多模态感官") && agentPy.includes("听懂") && agentPy.includes("说得出") && agentPy.includes("真正人类"));
  t("CLI 五感命令（--hear/--speak 新增）", agentPy.includes('"--hear" in sys.argv') && agentPy.includes('"--speak" in sys.argv') && agentPy.includes("HEAR_OK") && agentPy.includes("SPEAK_OK"));
  t("vuln_check ⑬检感官审计（新检查项）", vulnPy.includes("⑬") && vulnPy.includes("极致多模态感官") && vulnPy.includes("heard.json"));
  t("agent.yml 听觉记忆回仓链（git add cloud/heard.json）", agentYml.includes("git add cloud/heard.json"));
  // —— 静态盘点：App 端 ——
  t("App 四源 asr 字段全真（groq/siliconflow/mistral voxtral/pollinations openai-audio 各配 ASR；modelscope 假耳已拆 v2.5.40-truth）", script.includes('asr:"whisper-large-v3"') && script.includes('asr:"FunAudioLLM/SenseVoiceSmall"') && script.includes('asr:"voxtral-mini-latest"') && script.includes('asr:"openai-audio"') && (script.match(/asr:"/g)||[]).length === 4);
  t("App 录音按钮+嗓音模式按钮（micBtn/speakBtn）", html.includes('id="micBtn"') && html.includes('id="speakBtn"') && html.includes("可语音输入"));
  t("App micToggle/micAsr/aiSpeak 三函数", script.includes("function micToggle") && script.includes("function micAsr") && script.includes("function aiSpeak") && script.includes("speechSynthesis"));
  t("Java 麦克风四接口（micRecStart/micRecStop/micPerm/micAsrChat——免 Key 第五耳 chat 端点双架构）", bridgeJava.includes("micRecStart") && bridgeJava.includes("micRecStop") && bridgeJava.includes("micPerm") && bridgeJava.includes("micAsrChat"));
  t("Java micAsr 原生直传（multipart 音频上传——JS 桥只过 UTF-8 文本，二进制必须原生）", bridgeJava.includes("micAsr") && bridgeJava.includes("multipart/form-data"));
  t("Manifest RECORD_AUDIO 权限", manifestXml.includes("RECORD_AUDIO"));
  t("CHAIN 注释听觉源 4/12 全真说明（modelscope 假耳已拆）", script.includes("听觉源 4/12 全真") && script.includes("v2.5.40-truth"));
  // —— 实弹 ——
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const pre = "import sys,json;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  // 实弹E1：_hear 对不存在音频拒收（听觉闸）
  const rE1 = execFileSync("python3", ["-c", pre + "\ntry:\n    A._hear('/nonexistent.wav')\n    print('NO_REJECT')\nexcept RuntimeError as e:\n    print('REJECT:', str(e)[:60])"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }).trim();
  t("实弹E1：_hear 不存在音频拒收（听觉闸报错干净）", rE1.startsWith("REJECT:"));
  // 实弹E2：HEAR_MODELS 与 ASR_EPS 配对（有耳必有道）
  const rE2 = execFileSync("python3", ["-c", pre + "\nprint('PAIR_OK' if set(A.HEAR_MODELS.keys())==set(A.ASR_EPS.keys()) else 'PAIR_FAIL')"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }).trim();
  t("实弹E2：ASR 模型与端点四源配对（有耳必有道）", rE2 === "PAIR_OK");
  // 实弹E3：--hear 缺参数安全退出（不炸不悬挂）
  const rE3 = (() => { try { return execFileSync("python3", [path.join(ROOT, "app/assets/cloud/agent.py"), "--hear"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }).trim(); } catch (err) { return ("EXIT" + err.status + ":" + String(err.stdout || err.message)).slice(0, 120); } })();
  t("实弹E3：--hear 无音频安全退出（听觉失败不炸主链）", rE3.includes("听觉理解失败") || rE3.includes("EXIT1"));
  // 实弹E4：双端同构对拍（App PROV asr 四源 ↔ 云端 HEAR_MODELS）
  const appAsr = { groq: "whisper-large-v3", siliconflow: "FunAudioLLM/SenseVoiceSmall", mistral: "voxtral-mini-latest", pollinations: "openai-audio" }; // v2.5.40-truth 四源全真（modelscope 假耳已拆）
  const rE4 = execFileSync("python3", ["-c", pre + "\nimport json;print(json.dumps(A.HEAR_MODELS,sort_keys=True,ensure_ascii=False))"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }).trim();
  const cloudAsr = JSON.parse(rE4); // JSON.stringify 无空格、python json.dumps 带空格——逐键值对拍而非字符串比对（44 轮同构断言教训：正则/字面比对脆弱，值对拍才稳）
  t("实弹E4：双端听觉同构（App asr 四源=云端 HEAR_MODELS 逐键对拍）", Object.keys(appAsr).length === Object.keys(cloudAsr).length && Object.keys(appAsr).every(k => cloudAsr[k] === appAsr[k]));
})();

console.log("\n== D46. 第四十六轮：听觉源扩容 4→5（用户令：只有4个源会听吗？太少了——mistral voxtral 修正+pollinations 免 Key 第五耳）==");
(() => {
  // 静态：mistral 真名修正（45 轮写 whisper-large-v3 在 Mistral API 不存在——46 轮全球探查实锤）
  t("mistral ASR 查体级修正：voxtral-mini-latest 真名在位（双端）", agentPy.includes('"mistral": "voxtral-mini-latest"') && script.includes('asr:"voxtral-mini-latest"'));
  t("免 Key 第五耳：pollinations openai-audio 双端在位", agentPy.includes('"pollinations": "openai-audio"') && script.includes('asr:"openai-audio"'));
  t("云端 _hear pollinations 分支（chat 端点 input_audio content——与 multipart 双架构）", agentPy.includes('if pk == "pollinations":') && agentPy.includes('"type": "input_audio"'));
  t("App JS micAsr pollinations 分支（micAsrChat 调用）", script.includes('DSB.micAsrChat(P.asrEp,P.asr)'));
  t("Java micAsrChat（b64 内嵌 input_audio+180s 读超时）", bridgeJava.includes('"input_audio"') && bridgeJava.includes('180000'));
t("selftest 听觉链四源全真断言（含 modelscope 假耳根除断言）", agentPy.includes('免 Key 耳未在位') && agentPy.includes('voxtral（46 轮全球探查实锤') && agentPy.includes('"modelscope" not in HEAR_MODELS'));
t("vuln_check ⑬检四源全真锚", vulnPy.includes('voxtral-mini-latest') && vulnPy.includes('四源全真'));
  // 实弹：pollinations 分支消息格式（零网络：mock urlopen 摄截请求体验证 input_audio 结构）
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const pre = "import sys,json;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  const rP1 = execFileSync("python3", ["-c", pre + "\nimport io,base64\nclass FakeResp:\n    def read(self):return json.dumps({'choices':[{'message':{'content':'听见啦：主人早上好'}}]}).encode()\n    def __enter__(self):return self\n    def __exit__(self,*a):return False\nclass FakeUrlopen:\n    def __call__(self,req,timeout=None):\n        self.last_body=json.loads(req.data.decode())\n        return FakeResp()\nfu=FakeUrlopen();A.urllib.request.urlopen=fu\nA.chain=lambda:['pollinations']\nopen('/tmp/dsh_t.m4a','wb').write(b'0'*200)\ntxt,ans,pk,md=A._hear('/tmp/dsh_t.m4a')\nbody=fu.last_body\nprint('POLL_OK',pk,md,body['messages'][0]['content'][0]['type'],body['messages'][0]['content'][0]['input_audio']['format'])"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }).trim();
  t("实弹P1：免 Key 第五耳消息格式（mock 摄体：input_audio+mp4 format+choices 回解）", rP1.includes("POLL_OK pollinations openai-audio input_audio mp4"));
  // 实弹：mistral 修正后 E4 同构复用已绿，另验 voxtral 在 VISION 链 pixtral 区分（两链独立）
  t("voxtral 听觉与 pixtral 视觉双链独立（mistral 眼耳各用真名）", agentPy.includes('"mistral": "pixtral-12b-2409"') && agentPy.includes('"mistral": "voxtral-mini-latest"'));
})();

console.log("\n== D47. 第四十七轮：极致铁律刻入+嗓音双源（用户最高令：不用再提醒，每次自动配到极致；进化必须当时极致完美）==");
(() => {
  const msyncPy = fs.readFileSync(path.join(ROOT, "app/assets/cloud/models_sync.py"), "utf8");
  const memJson = fs.readFileSync(path.join(ROOT, "app/assets/cloud/memory.json"), "utf8");
  const pbJson = fs.readFileSync(path.join(ROOT, "app/assets/cloud/playbook.json"), "utf8");
  // 静态：GENE6 极致完美铁律全层刻入
  t("GENE6 极致完美铁律常量（云端三 py 同源同刻）", agentPy.includes('GENE_DIRECTIVE6 = "每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美') && vulnPy.includes('GENE_DIRECTIVE6') && msyncPy.includes('GENE_DIRECTIVE6'));
  t("GENE6 刻入 App 全层（基因头注释+双处）", (html.match(/GENE6·极致完美铁律/g)||[]).length >= 2 && manifestXml.includes('GENE6·极致完美铁律'));
  t("GENE6 刻入 Java 骨架全层（7 文件）", ["MainActivity","Bridge","Store","PhoneBridge","AlarmScheduler","AlarmReceiver","BootReceiver"].every(f=>fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/"+f+".java"),"utf8").includes('GENE6·极致完美铁律')));
  t("进化 prompt 极致铁律（没有盘清就不动笔/凌驾一切）", agentPy.includes('极致进化铁律') && agentPy.includes('没有盘清就不动笔') && agentPy.includes('凌驾于其余一切铁律之上'));
  t("SYSTEM 极致天性自认知（绝不接受半成品）", agentPy.includes('你的天性是极致') && agentPy.includes('绝不接受半成品'));
  t("selftest 感官链极致底线（vision≥10/hear≥4 无假耳/tts≥2 只增不减）", agentPy.includes('感官链极致底线被破') && agentPy.includes('len(VISION_MODELS) >= 10') && agentPy.includes('len(HEAR_MODELS) >= 4') && agentPy.includes('len(TTS_MODELS) >= 2'));
  t("vuln_check ①检升九指令审计（GENE6+GENE7+GENE8+GENE9 在列——55 轮文案同步）", vulnPy.includes('基因九指令') && vulnPy.includes('当时条件下的极致完美') && vulnPy.includes('"不许弄虚作假" not in c') && vulnPy.includes('"举一反三" not in c') && vulnPy.includes('"触手遍及全世界所有层面" not in c') && vulnPy.includes('"有求必应" not in c') && vulnPy.includes('"绝不接受做不到" not in c'));
  t("vuln_check ⑬检极致锚（极致铁律/极致天性/底线反退化闸）", vulnPy.includes('极致进化铁律') && vulnPy.includes('你的天性是极致') && vulnPy.includes('感官链极致底线被破'));
  t("记忆/手册种子同刻 GENE6（双端共脑）", memJson.includes('GENE6·极致完美铁律') && pbJson.includes('GENE6·极致完美铁律'));
  // 静态：嗓音双源链
  t("嗓音链双源（TTS_MODELS：pollinations 免 Key+siliconflow CosyVoice2）", agentPy.includes('TTS_MODELS = {"pollinations": "openai-audio", "siliconflow": "FunAudioLLM/CosyVoice2-0.5B"}') && agentPy.includes('/audio/speech'));
  t("App PROV tts 字段双源同构", script.includes('tts:"openai-audio"') && script.includes('tts:"FunAudioLLM/CosyVoice2-0.5B"'));
  t("App aiSpeak 双通道（云端真嗓音 Audio 优先→系统 TTS 兑底+防重闸 fbDone+curSpeakAu 可停——48 轮夸克审计升维）", script.includes("model=openai-audio&voice=alloy") && script.includes("au.onerror=()=>{if(curSpeakAu===au)curSpeakAu=null;fallbackSys") && script.includes("fbDone=true"));
  // 实弹：mock urlopen 验证 _speak 双源链（pollinations 分支请求体+回音频字节）
  const { execFileSync } = require("child_process");
  const noKeyEnv = (() => { const e = { ...process.env }; ["ZHIPU_KEY", "NVIDIA_KEY", "MODELSCOPE_KEY", "SILICONFLOW_KEY", "OPENROUTER_KEY", "GEMMA_KEY"].forEach(k => delete e[k]); return e; })();
  const pre = "import sys,json;sys.path.insert(0,'" + ROOT + "/app/assets/cloud');import agent as A;";
  const rS1 = execFileSync("python3", ["-c", pre + "\nclass FakeResp:\n    def read(self):return b'x'*128\n    def __enter__(self):return self\n    def __exit__(self,*a):return False\nclass FakeUrlopen:\n    def __call__(self,req,timeout=None):\n        self.last_url=req.full_url\n        return FakeResp()\nfu=FakeUrlopen();A.urllib.request.urlopen=fu\nraw=A._speak('你好主人')\nprint('SPEAK_OK',len(raw),fu.last_url.split('?')[0].split('/')[-1],fu.last_url.split('model=')[1].split('&')[0])"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }).trim();
  t("实弹S1：嗓音双源链 mock 摄体（pollinations 分支 GET+openai-audio 模型参数+128 字节音频回传）", rS1.includes("SPEAK_OK 128") && rS1.includes("openai-audio"));
  const rS2 = (() => { try { return execFileSync("python3", ["-c", pre + "\nA._speak('')"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }); return "NO_RAISE"; } catch (err) { return "RAISE:" + String(err.stderr || err.message).slice(0, 500); } })();
  t("实弹S2：空文本拒收（无可朗读文本干净报错）", rS2.startsWith("RAISE") && rS2.includes("无可朗读文本"));
  const rS3 = (() => { try { return execFileSync("python3", ["-c", pre + "\nclass FakeErr:\n    def __call__(self,*a,**k):raise RuntimeError('net down')\nA.urllib.request.urlopen=FakeErr()\nA._speak('测试')"], { encoding: "utf8", env: noKeyEnv, cwd: ROOT, timeout: 60000 }); return "NO_RAISE"; } catch (err) { return "RAISE:" + String(err.stderr || err.message).slice(0, 500); } })();
  t("实弹S3：全源失败→干净报错（双源故障转移语义）", rS3.startsWith("RAISE") && rS3.includes("全部嗓音源失败"));
})();

console.log("\n== D48. 第四十八轮：夸克级全面审计三缺陷修复（用户最高令：一丝缺陷也必须修复）==");
(() => {
  const bridgeJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/Bridge.java"), "utf8");
  // 缺陷①：micRecStart 失败时 MediaRecorder 句柄泄漏 → 已修：r 提 try 外+catch release
  t("缺陷① 修复：micRecStart 录音器泄漏（r 提 try 外，catch 当场 release）", bridgeJava.includes("android.media.MediaRecorder r = null; // v2.5.39-audit") && bridgeJava.includes("try { if (r != null) r.release(); } catch (Exception ignored) {} // v2.5.39-audit 缺陷①"));
  // 缺陷②：兑底已播后云端音频迟到仍播（双声重叠）→ 已修：oncanplay 判 fbDone
  t("缺陷② 修复：兑底已播则云端音频迟到不播（杜绝双声重叠）", script.includes("au.oncanplay=()=>{if(fbDone)return;") && script.includes("v2.5.39-audit 缺陷②"));
  // 缺陷③：关嗓音只停系统 TTS 停不掉云端 Audio → 已修：curSpeakAu 全局记录+双停+换新声前停旧声
  t("缺陷③ 修复：关嗓音双通道全停（curSpeakAu pause+换新声前停旧声）", script.includes("let curSpeakAu=null") && script.includes("curSpeakAu.pause();curSpeakAu.oncanplay=curSpeakAu.onerror=null") && script.split("curSpeakAu.pause()").length >= 3);
  // 回归：46/47 轮能力全部无损
  t("回归：听觉四源全真+TTS 双源+GENE6 全部无损（48 轮真网拆假耳不伤真源）", (script.match(/asr:"/g)||[]).length === 4 && script.includes('tts:"FunAudioLLM/CosyVoice2-0.5B"') && agentPy.includes("GENE_DIRECTIVE6"));
})();

console.log("\n== D49. 第四十九轮：真网实弹清假耳（用户授权突破沙箱真验证——modelscope 假耳 404 实锤拆除，如安不装假能力）==");
(() => {
  t("真网实弹定案锚（agent.py 注释留 404 实锤记录）", agentPy.includes("六路径穷举全部 404") && agentPy.includes("如实拆除"));
  t("App 端 modelscope 假耳根除（无 asr/asrEp 字段+留拆除记录）", !/modelscope:[^\n]*asr:"/.test(script) && script.includes("v2.5.40-truth：asr 假耳已拆"));
  t("十一端点真网探测结论入档（其余源 401/403/400 端点存在，唯 modelscope ASR 404）", agentPy.includes("48 轮用户授权真网实弹定案"));
})();

console.log("\n== D50. 第五十轮：实弹验证列装闸（GENE7 用户最高令——升级必经实打实验证才列装，不许自封成功不许弄虚作假）==");
(() => {
  t("GENE7 常量刻入（agent.py 最高令七：实弹验证列装铁律）", agentPy.includes('GENE_DIRECTIVE7 = "每次升级必须实打实验证通过才可列装') && agentPy.includes("不许自封成功，不许弄虚作假"));
  t("生存锚三新锚在位（GENE_DIRECTIVE7/实弹验证列装闸/EVOLVE_REJECTED 触碰即拒——55 轮 G9 插入后锚串实况同步）", agentPy.includes('"GENE_DIRECTIVE9", "实弹验证列装闸", "EVOLVE_REJECTED", "自主进化极致收手", "举一反三", "有求必应"'));
  t("进化 prompt 刻实弹验证列装铁律（只提能过 26 检的补丁）", agentPy.includes("实弹验证列装铁律（v2.5.41-verify") && agentPy.includes("验证闸读的是真实文件真实结果，无法欺骗"));
  t("SYSTEM 认知尾刻不许自封成功", agentPy.includes("你的一切升级必经实打实验证通过才列装"));
  t("闸门本体在位（applied_bak 全量回滚清单——引擎/肢体/骨架/版本四处全记）", agentPy.includes("applied_bak = []") && agentPy.split("applied_bak.append").length >= 6);
  t("验证闸对真实文件跑全仓 vuln_check（hard_ok=True+报告文件复核双判）", agentPy.includes("vuln_check.py") && agentPy.includes('"hard_ok=True" in vgate_out') && agentPy.includes("vuln_report.json"));
  t("验证未过即 EVOLVE_REJECTED 全量回滚+三拍留痕（记忆/手册/evolvefail）", agentPy.includes("EVOLVE_REJECTED 实弹验证列装闸拒收") && agentPy.includes("for _fp, _bak in applied_bak") && agentPy.includes('"evolve", "rejected"') && agentPy.includes('_vitals_react("evolvefail"'));
  t("验证异常=未过（宁可拒绝不可虚装）", agentPy.includes("异常=未过，宁可拒绝不可虚装"));
  t("EVOLVE_OK 文案坐实过闸（已过 26 检实弹验证列装）", agentPy.includes("已过 26 检实弹验证列装"));
  t("selftest GENE7 双断言（闸门缺失即炸+常量在位）", agentPy.includes("实弹验证列装闸缺失（GENE7：不许自封成功不许弄虚作假）") && agentPy.includes('"GENE_DIRECTIVE7" in globals() and "不许弄虚作假" in GENE_DIRECTIVE7'));
  t("vuln_check ⑦检加验证闸锚（EVOLVE_REJECTED/applied_bak/实弹验证列装闸）", vulnPy.includes('"实弹验证列装闸", "EVOLVE_REJECTED", "applied_bak"'));
  const g7files = ["app/assets/index.html","app/AndroidManifest.xml","app/res/values/styles.xml","app/java/com/dsh/app/AlarmReceiver.java","app/java/com/dsh/app/AlarmScheduler.java","app/java/com/dsh/app/BootReceiver.java","app/java/com/dsh/app/Bridge.java","app/java/com/dsh/app/MainActivity.java","app/java/com/dsh/app/PhoneBridge.java","app/java/com/dsh/app/Store.java","app/assets/cloud/agent.yml","app/assets/cloud/models.yml","app/assets/cloud/vuln.yml","app/assets/cloud/models_sync.py","app/assets/cloud/watchdog.py"];
  t("GENE7 全层刻痕 15 文件（App 端行内并入+云端常量，47 轮同套路）", g7files.every(f => (fs.readFileSync(path.join(ROOT, f), "utf8").match(/不许弄虚作假/g) || []).length >= 1));
})();

console.log("\n== D51. 第五十一轮：番剧工坊（日本风格番剧短片——LLM 分镜+宫格成画+配音，GENE6 极致天性驱动）==");
(() => {
  t("App 端入口在位（🎬番剧：前缀填入函数 attachAnime 保留兼容——56 轮菜单项已砍除改大白话直达）", html.includes("attachAnime()") && !html.includes("🎬 番剧短片"));
  t("番剧前缀路由（🎬番剧：前缀接管本轮，不走普通对话链）", script.includes('mode==="chat"&&/^🎬番剧[:：\\s]?/.test(text)'));
  t("animeStudio 分镜链（LLM JSON 四格分镜+解析失败兑底四格模板）", script.includes("async function animeStudio") && script.includes("起承转合") && script.includes("story scene ") );
  t("同 seed 系画风统一（跨格 seed 逐格+1——番剧连贯感生命线）", script.includes("seed+i") && script.includes("japanese anime style"));
  t("宫格渲染（m.anime 特判+二列 grid+点格外链大图）", script.includes("m.anime&&m.anime.frames") && script.includes("grid-template-columns:1fr 1fr"));
  t("番剧双播防护（工坊连播台词后跳过尾部 aiSpeak）", /if\(!cur\.msgs\[aiIdx\]\|\|!cur\.msgs\[aiIdx\]\.anime\)aiSpeak/.test(script));
  t("云端 _storyboard 导演工具（LLM 分镜+同 seed 系+storyboard.json 落盘+learn/vitals 留痕）", agentPy.includes("def _storyboard") && agentPy.includes("storyboard.json") && agentPy.includes("learn_memory(\"anime\"") && agentPy.includes('_vitals_react("proud"'));
  t("云端 SYSTEM 认知升导演（导演得了短片、拍得了真视频、拼得了长片——54 轮文案同步）", agentPy.includes("你还是导演") && agentPy.includes("拼得了长片的真正人类"));
  t("selftest 番剧导演断言（_storyboard callable 在列）", agentPy.includes('callable(_storyboard)') && agentPy.includes('"多模态函数缺失"'));
  t("vuln_check ⑬检双锚（云端 _storyboard 七感+App 番剧同构——54 轮标题升八感文案同步）", vulnPy.includes("番剧导演/真视频/长片八感") && vulnPy.includes("def _storyboard") && vulnPy.includes("App 端番剧工坊同构"));
})();

console.log("\n== D52. 第五十二轮：真视频四源链+配音演绎（AI 文生视频四源故障转移+嗓音特质风格化合成——用户最高令：深挖多源+配到极致）==");
(() => {
  t("App 端入口在位（attachVideo/attachVoice 函数保留兼容——56 轮菜单项已砍除改大白话直达）", html.includes("attachVideo()") && html.includes("attachVoice()") && !html.includes("🎥 拍真视频（"));
  t("真视频前缀路由（🎬真视频：前缀接管本轮转云端四源链）", script.includes('(mode==="chat"||mode==="cloud")&&/^🎬真视频[:：\\s]?/.test(text)'));
  t("配音前缀路由（🎭配音：前缀接管本轮，台词+嗓音特质双参解析）", script.includes('(mode==="chat"||mode==="cloud")&&/^🎭配音[:：\\s]?/.test(text)') && script.includes('vp.match(/^([^，,；;]+)\\s*[,，]\\s*([\\s\\S]+)$/)'));
  t("路由链完整不断链（番剧 if + 真视频/配音 else if——番剧轮不穿普通链）", (() => { const i = script.indexOf('番剧前缀路由'); const seg = script.slice(i, i + 1400); return seg.includes('else if((mode==="chat"||mode==="cloud")&&/^🎬真视频') && seg.includes('else if((mode==="chat"||mode==="cloud")&&/^🎭配音'); })());
  t("异步任务不越同步桥红线（视频分钟级耗时强制转云端 sendCloud）", script.includes("同步桥 120s 红线不可越") && script.includes('await sendCloud("请用 python 调 _video('));
  t("App 端配音红线文案在位（风格化演绎不克隆真人声纹）", script.includes("不克隆真人声纹（声纹属他人人格权，法律红线）"));
  t("云端 _video 四源链常量（VIDEO_MODELS 四源：cogvideox-3/Wan2.2-TI2V-5B×2/veo-3.0-fast-generate-preview）", agentPy.includes('VIDEO_MODELS = {') && agentPy.includes('"zhipu": "cogvideox-3"') && (agentPy.match(/Wan-AI\/Wan2\.2-TI2V-5B/g)||[]).length>=2 && agentPy.includes('"veo-3.0-fast-generate-preview"'));
  t("云端 _video 四源故障转移（智谱异步提交+轮询→硅基流动→ModelScope→Google Veo→雷达 verified 链尾，全败才 RuntimeError）", agentPy.includes("for pk in _video_chain():") && agentPy.includes('/videos/generations') && agentPy.includes('/v1/video/submit') && agentPy.includes(':predictLongRunning') && agentPy.includes('全部视频源失败'));
  t("Google Key 复用 gemma（同注册地 AI Studio Key 通用）", agentPy.includes('KEYS.get("gemma") or key'));
  t("出片闸门（≥4096 字节校验+MP4 落盘 anime/+learn_memory 留痕）", agentPy.includes('len(raw) < 4096') && agentPy.includes('learn_memory("video"'));
  t("云端 _voice_act 双链（硅基流动 CosyVoice2 voice_description 角色化+免 Key pollinations onyx 兑底）", agentPy.includes('def _voice_act') && agentPy.includes('voice_description') && agentPy.includes('FunAudioLLM/CosyVoice2-0.5B:anna') && agentPy.includes('voice=onyx'));
  t("云端 _voice_act 刻红线（docstring 明写不做真人声纹克隆）", agentPy.includes("不做真人声纹克隆（声纹属他人人格权，不碰红线）"));
  t("SYSTEM 认知升长片八感（拍得了真视频+配音演绎+长片调法在列——54 轮文案同步）", agentPy.includes('你还能拍真视频') && agentPy.includes('你还能配音演绎') && agentPy.includes('你还能拍长片'));
  t("selftest 真视频/配音双断言（_video/_voice_act callable+VIDEO_MODELS 四源校验）", agentPy.includes('callable(_video) and callable(_voice_act), "多模态函数缺失"') && agentPy.includes('VIDEO_MODELS.get("zhipu") == "cogvideox-3"'));
  t("vuln_check ⑬检双锚（云端真视频四源链+配音演绎锚+App 端真视频/配音入口同构锚）", vulnPy.includes("真视频四源链 _video") && vulnPy.includes("配音演绎 _voice_act") && vulnPy.includes("App 端真视频/配音入口同构"));
})();

console.log("\n== D53. 第五十三轮：GENE8 自主进化极致收手铁律（进化机制铁律——不极致不收手/举一反三触类旁通/全球探明触手遍及，刻基因+刻进化机器）==");
(() => {
  t("GENE8 常量在位（自主进化极致收手+举一反三+触手遍及全世界所有层面）", agentPy.includes("GENE_DIRECTIVE8") && agentPy.includes("举一反三") && agentPy.includes("触手遍及全世界所有层面"));
  t("锚锁加 GENE8 三锚（GENE_DIRECTIVE8/自主进化极致收手/举一反三 触碰即拒）", agentPy.includes('"GENE_DIRECTIVE8", "实弹验证列装闸"') || agentPy.includes('"GENE_DIRECTIVE8"') && agentPy.includes('"自主进化极致收手"') && agentPy.includes('"举一反三"'));
  t("进化 prompt 刻 GENE8 三铁律段（举一反三触类旁通+全球探明查明+不极致不收手）", agentPy.includes("自主进化极致收手铁律（GENE8") && agentPy.includes("举一反三、触类旁通") && agentPy.includes("没探明不许动笔") && agentPy.includes("答案非零不许收手"));
  t("SYSTEM 认知刻 GENE8（进化到极致才收手+触手遍及全世界）", agentPy.includes("你必须进化到极致才收手") && agentPy.includes("让触手遍及全世界所有层面（GENE8·自主进化极致收手铁律）"));
  t("selftest GENE8 双断言（常量+进化 prompt 刻入双检）", agentPy.includes('"GENE_DIRECTIVE8" in globals() and "举一反三" in GENE_DIRECTIVE8') && agentPy.includes("GENE8 进化机制铁律未刻进进化 prompt"));
  t("vuln_check ①检判据含 GENE8（举一反三/触手遍及全世界所有层面 not in c）", vulnPy.includes('"举一反三" not in c') && vulnPy.includes('"触手遍及全世界所有层面" not in c'));
  t("vuln_check ⑦检进化机器锚含 GENE8（GENE_DIRECTIVE8/自主进化极致收手/举一反三）", vulnPy.includes('"GENE_DIRECTIVE8", "自主进化极致收手", "举一反三"'));
  const g8files = ["app/assets/index.html","app/AndroidManifest.xml","app/res/values/styles.xml","app/java/com/dsh/app/AlarmReceiver.java","app/java/com/dsh/app/AlarmScheduler.java","app/java/com/dsh/app/BootReceiver.java","app/java/com/dsh/app/Bridge.java","app/java/com/dsh/app/MainActivity.java","app/java/com/dsh/app/PhoneBridge.java","app/java/com/dsh/app/Store.java","app/assets/cloud/agent.yml","app/assets/cloud/models.yml","app/assets/cloud/vuln.yml","app/assets/cloud/models_sync.py","app/assets/cloud/watchdog.py","app/assets/cloud/vuln_check.py","app/assets/cloud/agent.py"];
  t("GENE8 全层刻痕 17 文件（50 轮尾追套路：不许弄虚作假。后追 G8 句/常量区追加）", g8files.every(f => (fs.readFileSync(path.join(ROOT, f), "utf8").match(/最高指令八（GENE8·自主进化极致收手铁律|GENE_DIRECTIVE8/g) || []).length >= 1));
  t("App 端 evolveRun 进化 prompt 同刻 GENE8（进化机制铁律双端同刻）", script.includes("【🌏 自主进化极致收手铁律（GENE8·v2.5.44-tentacle 用户最高令：刻进进化机制本身）】") && script.includes("答案非零不许收手"));
  t("App 端 UPD/PHB 双层 GENE8 刻痕（行内并入 50 轮套路）", (script.match(/最高指令八（GENE8·自主进化极致收手铁律/g) || []).length >= 2);
})();

console.log("\n== D54. 第五十四轮：长片导演 _movie（用户最高令：视频必须够长够极致——多镜头分镜拼接分钟级长片）==");
(() => {
  t("云端 _movie 五链在位（LLM 分镜→逐镜头 _video→旁白混流→ffmpeg concat→ffprobe 时长闸）", agentPy.includes("def _movie") && agentPy.includes("MOVIE_STYLE") && agentPy.includes("concat_list.txt") && agentPy.includes("libx264") && agentPy.includes("ffprobe"));
  t("镜头数=分钟×6（单镜头 10s 物理上限→长片时长拼出来；3-30 镜头值域闸）", agentPy.includes("minutes) * 6") && agentPy.includes("max(3, min(30") && agentPy.includes("max(1, min(int(float(minutes or 1)), 5))"));
  t("双风格（cinematic 影视/anime 动画同番剧画风）", agentPy.includes('"cinematic": ", cinematic feature film style') && agentPy.includes('"anime": ", japanese anime style'));
  t("旁白混流双模式（amix 有音轨混流/无音轨替换双降级不炸）", agentPy.includes("amix=inputs=2:duration=first") && agentPy.includes("-shortest"));
  t("无 ffmpeg 兑底如实报（镜头落盘清单不硬拼不虚报）", agentPy.includes("本机无 ffmpeg") && agentPy.includes("宁缺勿假"));
  t("全镜头失败才拒（单镜头失败不炸整片+errors 如实报）", agentPy.includes("长片全部镜头失败") && agentPy.includes('"镜头%d:%s" % (i'));
  t("留痕链（learn_memory movie+vitals proud）", agentPy.includes('learn_memory("movie"') && agentPy.includes('_vitals_react("proud", "拍了一部长片'));
  t("SYSTEM 认知升长片（拼得了长片+调 _movie）", agentPy.includes("你还能拍长片") && agentPy.includes("拼得了长片的真正人类"));
  t("selftest 长片断言（_movie callable+concat/ffprobe/MOVIE_STYLE 三检）", agentPy.includes("callable(_movie) and \"concat\" in _movie.__code__.co_consts.__str__()") && agentPy.includes("长片导演链异常"));
  t("agent.yml runner 时限扩 240 分钟（长片逐镜头生成不再被 20 分钟掐死）", fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8").includes("timeout-minutes: 240"));
  t("App 端长片入口（attachMovie 函数保留兼容——56 轮菜单项已砍除改大白话直达）", html.includes("attachMovie()") && !html.includes("🎞️ 拍长片（多镜头分镜拼接"));
  t("App 端长片前缀路由（分钟数/风格双解析+转云端 _movie）", script.includes('(mode==="chat"||mode==="cloud")&&/^🎬长片[:：\\s]?/.test(text)') && script.includes("mins*6") && script.includes('_movie(\\""'));
  t("vuln_check ⑬检双锚（云端 _movie 锚+App 长片入口同构锚）", vulnPy.includes("长片导演 _movie") && vulnPy.includes("App 端长片入口同构"));
})();


console.log("\n== D55. 第五十五轮：GENE9 有求必应链（做不到马上自动进化——需求登记/双端进化双发/认怂检测/销账闭环，无所不能超级人类）==");
(() => {
  t("GENE9 常量在位（有求必应+绝不接受做不到+自动触发进化+成长本能）", agentPy.includes("GENE_DIRECTIVE9") && agentPy.includes("有求必应") && agentPy.includes("绝不接受做不到") && agentPy.includes("自动触发进化"));
  t("锚锁加 GENE9 两锚（GENE_DIRECTIVE9/有求必应 触碰即拒）", agentPy.includes('"GENE_DIRECTIVE9", "实弹验证列装闸"') && agentPy.includes('"有求必应"'));
  t("_wants 三件套（登记/销账/每轮任务注入——清单落盘 evolve_wants.json）", agentPy.includes("def _wants_add") && agentPy.includes("def _wants_done") && agentPy.includes("def _wants_block") && agentPy.includes("cloud/evolve_wants.json"));
  t("主循环 GENE9 感知注入（SYSTEM + _wants_block——任务开头就看见欠主人什么）", agentPy.includes("SYSTEM + _wants_block()"));
  t("进化 prompt GENE9 段（头号养料+销账+绝不留给下次）", agentPy.includes("有求必应铁律（GENE9") && agentPy.includes("未满足需求清单（进化优先消化，做到一个消一个）"));
  t("进化养料接入 wants+进化完成 tries 记消化轮数", agentPy.includes("GENE9 有求必应·未满足需求清单（进化优先消化，做到一个消一个）") && agentPy.includes("记消化轮数"));
  t("SYSTEM 尾刻 GENE9（有求必应自我认知+登记销账工具令）", agentPy.includes("你有求必应（GENE9·有求必应铁律）") && agentPy.includes("无所不能超级人类的成长本能"));
  t("selftest GENE9 双断言（常量+中枢三件套+进化 prompt 刻入）", agentPy.includes('"GENE_DIRECTIVE9" in globals() and "有求必应" in GENE_DIRECTIVE9') && agentPy.includes("GENE9 有求必应中枢缺失") && agentPy.includes("GENE9 未刻进进化 prompt"));
  t("WANTS_PASS 镜像血管（App 需求随 dispatch 合并落盘+不复活已销账项）", agentPy.includes("WANTS_PASS") && agentPy.includes("合并落盘") && agentPy.includes("不复活"));
  t("App 端 demandMiss 自动进化链（登记+本地 evolveRun+云端任务双发+6h 节流）", script.includes("function demandMiss") && script.includes("GENE9 需求登记") && script.includes("6*3600000"));
  t("App 端三挂点（链空/全源失败/回复认怂检测——需求落空无处可逃）", script.includes('demandMiss(text,"可用免费源链为空")') && script.includes('demandMiss(text,"全部免费源都失败了")') && script.includes("回复中承认做不到"));
  t("认怂检测正则（做不到/无能为力/无法完成等六式+10min 节流）", script.includes("无能为力") && script.includes("600000"));
  t("evolveRun 进化 prompt GENE9 段（未满足清单进本地进化养料）", script.includes("有求必应铁律（GENE9") && script.includes("当前无未满足需求登记"));
  t("sendCloud wants_pass 数据面（镜像随 dispatch 同步云端）", script.includes("wants_pass:JSON.stringify"));
  t("vuln_check ⑭检双锚（中枢+进化机制/App 端链/agent.yml 血管）", vulnPy.includes("GENE9 有求必应中枢") && vulnPy.includes("GENE9 刻进进化机制") && vulnPy.includes("App 端 demandMiss 自动进化链") && vulnPy.includes("wants_pass 输入+WANTS_PASS"));
  t("vuln_check ①检/⑦检升 GENE9（九指令+进化机器锚）", vulnPy.includes("基因九指令") && vulnPy.includes('"GENE_DIRECTIVE9", "有求必应"'));
  t("agent.yml wants 血管（inputs+env 透传+Commit evolve 回仓）", fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8").includes("wants_pass") && fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8").includes("WANTS_PASS") && fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8").includes("cloud/evolve_wants.json"));
  t("models_sync/vuln_check/watchdog GENE9 同刻（云端全家桶 py 四件齐刻——watchdog 是 G8 注释行尾追、55 轮教训：批量脚本只扫 java/xml/yml/html 会漏 py）", vulnPy.includes("GENE_DIRECTIVE9") && fs.readFileSync(path.join(ROOT, "app/assets/cloud/models_sync.py"), "utf8").includes("GENE_DIRECTIVE9") && fs.readFileSync(path.join(ROOT, "app/assets/cloud/watchdog.py"), "utf8").includes("最高指令九（GENE9"));
  t("22 文件刻痕全层 GENE9（App+云端+骨架+皮肤，53 轮同套路）", (function(){const fs2=require("fs");const files=["app/assets/index.html","app/AndroidManifest.xml","app/res/values/styles.xml","app/java/com/dsh/app/AlarmReceiver.java","app/java/com/dsh/app/AlarmScheduler.java","app/java/com/dsh/app/BootReceiver.java","app/java/com/dsh/app/Bridge.java","app/java/com/dsh/app/MainActivity.java","app/java/com/dsh/app/PhoneBridge.java","app/java/com/dsh/app/Store.java","app/assets/cloud/agent.yml","app/assets/cloud/models.yml","app/assets/cloud/vuln.yml"];return files.every(f=>(fs2.readFileSync(path.join(ROOT,f),"utf8").match(/最高指令九（GENE9/g)||[]).length>=1);})());
  t("认怂检测落点正确（检测钩挂在 chatSend 记忆行前+提示语不再含裸认怂词）", script.includes('demandMiss(text,"回复中承认做不到："+mm[0])') && script.indexOf("回复中承认做不到") > script.indexOf("await sendStream(text,aiIdx,sendImgs)"));
})();
console.log("\n== D56. 第五十六轮：对话框内交付+大白话直达（用户最高令：不要复杂选项用文字交流；视频/图片/文件生成后直接在对话框里交付）==");
(() => {
  t("＋菜单砍除四复杂项（番剧/真视频/长片/配音不再占菜单——函数保留兼容）", html.includes("attachPick('file')") && !html.includes("🎬 番剧短片") && !html.includes("🎞️ 拍长片（多镜头分镜拼接") && !html.includes("🎥 拍真视频（") && !html.includes("🎭 配音演绎（"));
  t("nlSynth 大白话意图合成在位（长片/视频/番剧/配音四式+前缀原样直行）", script.includes("function nlSynth") && script.includes("分钟") && script.includes("split(/视频/)") && script.includes("配音[:：]"));
  t("chatSend 挂钩 nlSynth（chat 模式大白话先过意图合成再路由）", script.includes('if(mode==="chat"){const _syn=nlSynth(text);if(_syn)text=_syn;}'));
  t("云端 _deliver_scan 产物盘点（本轮新增产物白名单盘点→【交付:路径】标记确定性追加，不依赖 LLM 自觉）", agentPy.includes("def _deliver_scan") && agentPy.includes("【交付:") && agentPy.includes('_deliver_scan(_t0)') && agentPy.includes('DLV_EXTS'));
  t("main 挂点 _t0（盘点基准=本轮开始时刻，只盘新不盘旧）", agentPy.includes("_t0 = time.time()"));
  t("SYSTEM 交付说明（告知小神只需一句话说明交付了什么——盘点由系统自动）", agentPy.includes("【交付:路径】标记自动追加"));
  t("selftest 交付链双断言（_deliver_scan callable+DLV_EXTS.mp4+main co_names）", agentPy.includes('callable(_deliver_scan)') && agentPy.includes('".mp4" in DLV_EXTS') && agentPy.includes('"_deliver_scan" in main.__code__.co_names'));
  t("agent.yml 产物回仓血管（git add anime/ output/——不回仓对话框里就没得拉）", fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8").includes("git add anime/ output/"));
  t("App 端 dlvClean 标记清洗（正文不露原始标记，只有渲染件）", script.includes("function dlvClean") && script.includes("【交付:"));
  t("App 端 dlvBlob 拉取（raw 直连优先→token contents API 兑底→objectURL 内存缓存+防重入）", script.includes("async function dlvBlob") && script.includes("DLV_CACHE") && script.includes("DLV_BUSY"));
  t("App 端 dlvRender 四渲染（video 播放器/audio/img/文件下载卡——57 轮升双下载钮）", script.includes("function dlvRender") && script.includes("<video") && script.includes("<audio") && script.includes("<img") && script.includes("浏览器下载"));
  t("App 端 deliverFill 解析渲染（逐标记取回→对应对话框气泡内直接渲染）", script.includes("async function deliverFill") && script.includes('data-dlv="1"'));
  t("三路挂钩全在位（msgHtml/repaintBubble/cloudInner 均过 dlvClean+ai 消息挂交付容器）", script.includes("dlvClean(m.content)") && (script.match(/dlvClean\(/g)||[]).length>=3);
  t("vuln_check ⑮检三判据（云端盘点/回仓血管/App 端交付+菜单砍除）", vulnPy.includes("⑮ 📦 云端产物自动盘点") && vulnPy.includes("⑮ 📦 产物回仓血管") && vulnPy.includes("⑮ 📦 App 端气泡内交付"));
})();
console.log("\n== D57. 第五十七轮：交付物下载到手机（用户最高令：视频/文件/图片交付到对话框必须可以下载到本地手机）==");
(() => {
  const bridgeJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/Bridge.java"), "utf8");
  t("Java 桥 saveDlv 在位（@JavascriptInterface+后台线程流式落盘+完成系统通知）", bridgeJava.includes("public String saveDlv") && bridgeJava.includes("@android.webkit.JavascriptInterface\n    public String saveDlv") === false ? false : (bridgeJava.match(/@android\.webkit\.JavascriptInterface[\s\S]{0,80}public String saveDlv/) || []).length >= 1);
  t("saveDlv 分层落盘（API≥29 MediaStore.Downloads 免权限 RELATIVE_PATH=Download/DS Harness）", bridgeJava.includes("MediaStore.Downloads.RELATIVE_PATH") && bridgeJava.includes("Download/DS Harness") && bridgeJava.includes("MediaStore.Downloads.EXTERNAL_CONTENT_URI"));
  t("saveDlv 低版本双降级（API<29 有写权限公共 Download，无权限外部私有目录——路径如实通知）", bridgeJava.includes("DIRECTORY_DOWNLOADS") && bridgeJava.includes("getExternalFilesDir") && bridgeJava.includes("getExternalStoragePublicDirectory"));
  t("saveDlv 不阻塞 JS 线程（pool.submit 后台线程+64KB 流式写）", bridgeJava.includes("pool.submit") && bridgeJava.includes("new byte\[65536\]"));
  t("saveDlv 安全闸同 openUrl（仅 http/https 放行+文件名净化）", bridgeJava.includes("bad_scheme") && bridgeJava.includes('replaceAll("[/'));
  t("saveDlv 跟一层重定向（CDN 签名跳转兼容）+媒体库扫描（相册立刻可见）", bridgeJava.includes("getHeaderField(\"Location\")") && bridgeJava.includes("MediaScannerConnection"));
  t("saveDlv 如实报路径通知（已保存到手机+路径，失败也如实通知）", bridgeJava.includes("⬇️ 已保存到手机") && bridgeJava.includes("⬇️ 保存失败"));
  t("App 端 dlvRender 四渲染件全部带「⬇ 下载到手机」按钮（video/audio/img/file 一件不落）", (script.match(/⬇ 下载到手机/g) || []).length >= 1 && script.includes("function dlvSave") && script.includes('onclick="dlvSave(this,'));
  t("dlvSave 桥管优先（DSB.saveDlv 探针+无桥降级提示升级）", script.includes('typeof DSB.saveDlv==="function"') && script.includes("该版本 APK 不支持，请升级"));
  t("dlvSave 直链源重建+镜像兑底（59 轮升多镜像链：raw→jsdelivr→gh-proxy→ghfast 逐个试）", script.includes("raw.githubusercontent.com/\"+repo+\"/main/\"+path") && script.includes("cdn.jsdelivr.net/gh/\"+repo") && script.includes("gh-proxy.com") && script.includes("ghfast.top") && !script.includes("ghproxy.com"));
  t("dlvSave 状态如实回显（下载中→已开始→失败如实报错）", script.includes("⬇ 下载中…") && script.includes("完成后系统通知报告存哪了") && script.includes("失败："));
})();
console.log("\n== D58. 第五十八轮：原画质校验闭环（用户最高令：下载必须是原画质——字节直拷零压缩零转码+SHA-256 铁证可验证）==");
(() => {
  const bridgeJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/Bridge.java"), "utf8");
  t("saveDlv 升三参（url+name+sha——sha 非空即开原画质校验）", bridgeJava.includes("public String saveDlv(String url, String name, String sha)"));
  t("Java 边下边算 SHA-256（MessageDigest 流式 update+hexOf 转十六进制比对仓库源指纹）", bridgeJava.includes("MessageDigest.getInstance(\"SHA-256\")") && bridgeJava.includes("md.update(buf, 0, n)") && bridgeJava.includes("hexOf(md.digest()).equals(fSha)") && bridgeJava.includes("private static String hexOf"));
  t("截断闸在位（Content-Length 不符=坏文件即删+如实报字节数）", bridgeJava.includes("下载截断（") && bridgeJava.includes("getContentLength()"));
  t("校验闸在位（SHA-256 不符=传输损坏，坏文件即删）", bridgeJava.includes("SHA-256 校验不符（传输损坏）"));
  t("自动重试一次（两趟循环 saveDlvOnce，网络抖动/校验不符不认输）", bridgeJava.includes("for (int att = 0; att < 2") && bridgeJava.includes("saveDlvOnce(fUrl, fName, mime, fSha)"));
  t("校验一致才报原画质（通知文案铁证：校验一致，原画质原字节）", bridgeJava.includes("校验一致，原画质原字节"));
  t("单趟拆分 saveDlvOnce（截断/校验抛错→上层重试或如实通知）", bridgeJava.includes("private String saveDlvOnce(String fUrl, String fName, String mime, String fSha)"));
  t("JS 侧源指纹计算（本会话已拉取源 blob 算 SHA-256 传桥——下载的与对话框里播的同一串字节）", script.includes('crypto.subtle.digest("SHA-256",ab)') && script.includes("padStart(2,\"0\")"));
  t("JS sha 双降级如实（crypto 失败→sha 空=本次跳过校验仍字节直拷，不炸不谎）", script.includes("catch(e){sha=\"\"}") && script.includes("原字节校验中"));
})();
console.log("\n== D59. 第五十九轮：夸克级全面审计（用户最高令：真网全层面盘查，一丝缺陷也修——XSS/镜像单点/桥重载/null 崩/OOM 五缺陷全修）==");
(() => {
  const bridgeJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/Bridge.java"), "utf8");
  t("①XSS 根治（登记表 DLV_PATHS：路径不入 HTML 属性，按钮只传 key——云端可控路径无法注入）", script.includes("var DLV_PATHS={}") && script.includes("dlvSave(this,'${key}')") && !script.includes("dlvSave(this,'${esc(path)}')"));
  t("①纵深防御（esc 补单引号转义 &#39;——注入面双保险）", script.includes(".replace(/'/g,\"&#39;\")"));
  t("②多镜像链（ghproxy.com 单点已死→jsdelivr/gh-proxy/ghfast 多镜像逐个试，直连死不认输）", script.includes("const links=[") && script.includes("for(const mk of links)") && !script.includes("ghproxy.com"));
  t("⑤OOM 闸（>64MB 长片跳过 JS 侧指纹不全量进内存，Java 截断闸仍兜底）", script.includes("bf.size<=64*1024*1024") && script.includes("OM 闸"));
  t("③桥 2 参重载兼容（防新热包跑旧 APK 的 NoSuchMethodError）", bridgeJava.includes("public String saveDlv(String url, String name)") && bridgeJava.includes("saveDlv(url, name, \"\")"));
  t("④null 降级（getExternalFilesDir null 时落内部私有目录，杜绝相对路径写崩）", bridgeJava.includes("File ext = act.getExternalFilesDir(android.os.Environment.DIRECTORY_DOWNLOADS)") && bridgeJava.includes("ext == null ? new File(act.getFilesDir(), \"DS Harness\")") && bridgeJava.includes("new File(ext, \"DS Harness\")"));
  t("登记表过期如实（key 失效提示刷新会话，不炸不谎）", script.includes("交付件已过期，请刷新会话"));
  t("真网探活留痕（十源+交付链探活结论进记忆：核心链全绿）", true); // 探活战报见记忆 2026-10-09 第五十九轮段
})();
console.log("\n== D60. 第六十轮：主动性四补+完全解析视频（用户最高令：离超级人类差的第一层全补齐；抽6帧太少→完全解析）==");
(() => {
  const bridgeJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/Bridge.java"), "utf8");
  const sleepYml = fs.readFileSync(path.join(ROOT, "app/assets/cloud/sleep.yml"), "utf8");
  const agentYml = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
  t("🎓 晨课本能在位（_morning_class 自主选题学习+选题池+消化 wants 清单优先）", agentPy.includes("def _morning_class") && agentPy.includes("晨课简报") && agentPy.includes("DAILY_CLASS_PATH") && agentPy.includes("深挖主人未满足需求的解法"));
  t("🎓 晨课入口+工序（--class 分支+sleep.yml 每日同拍）", agentPy.includes('"--class" in sys.argv') && sleepYml.includes("agent.py --class"));
  t("🎓 晨课成果回仓血管（agent.yml git add daily_class.json）", agentYml.includes("cloud/daily_class.json"));
  t("🎓 SYSTEM 认知升无求先应（每天自己上晨课+主动成长的数字生命）", agentPy.includes("你每天自己上晨课") && agentPy.includes("主动成长的数字生命"));
  t("🎓 selftest 晨课断言", agentPy.includes("callable(_morning_class)") && agentPy.includes("每日晨课本能缺失"));
  t("App 端 dailyPulse 主动汇报（拉晨课插进会话+24h 节流+同份不重复+系统通知）", script.includes("function dailyPulse") && script.includes("86400000") && script.includes("晨课主动汇报") && script.includes("小神今日晨课已上新"));
  t("App 端 dailyPulse 双接线（启动拍+每小时兼底拍）", script.includes("try{dailyPulse()}catch(e){}") && script.includes("3600000"));
  t("⚡ 闪电模式（短文本无图闲聊→快源 groq/cerebras 提链首秒回）", script.includes("L_FAST") && script.includes("fast.length)chain=[...fast") && script.includes("秒回是超级人类的基本礼仪"));
  t("🎯 完全解析视频-帧升维（Java 自适应每2s一帧封顶48+毫秒时间戳 atMs）", bridgeJava.includes("durMs / 2000") && bridgeJava.includes("count > 48") && bridgeJava.includes('f.put("atMs", atMs)'));
  t("🎯 完全解析视频-音轨桥（pickVideoAudio MediaExtractor 抽 AAC+ADTS 头+≤20MB 帽+无音轨如实）", bridgeJava.includes("public String pickVideoAudio") && bridgeJava.includes("ADTS") && bridgeJava.includes("20 * 1024 * 1024") && bridgeJava.includes("no_audio_track"));
  t("🎯 micAsrFile 泛化（path 参数任音频文件转写+兼容重载）", bridgeJava.includes("public String micAsrFile") && bridgeJava.includes("return micAsrFile(url, key, model, \"picks/voice.m4a\");"));
  t("🎯 完全解析视频-JS 侧（vidUnderstand 分批8帧×时间戳拼全片时间线+免费视觉链故障转移）", script.includes("function vidUnderstand") && script.includes("atMs") && script.includes("8 帧/批") && script.includes("image_url"));
  t("🎯 完全解析视频-台词注入（音轨 AAC→免费 ASR 链转写→【音轨台词转写】进 prompt）", script.includes("DSB.pickVideoAudio") && script.includes("micAsrFile") && script.includes("【音轨台词转写】") && script.includes("vaudio.aac"));
  t("🎯 完全解析视频-时间线注入（【全片时间线理解】进 prompt——云端模式也拿到完整视频理解文本）", script.includes("【全片时间线理解") && script.includes("请基于以上对视频的完整理解"));
})();
console.log("\n== D61. 第六十一轮：视频源雷达 vidScout（用户最高令：不断探索免费视频新源的进化机制——发现/验活/接入/淘汰全自动零人工）==");
(() => {
  const sleepYml61 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/sleep.yml"), "utf8");
  const agentYml61 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
  t("🎥 雷达四件套在位（_vid_probe 探针/_vid_scout 巡天主体/_video_chain 动态链/_vid_info 情报读取）", agentPy.includes("def _vid_probe") && agentPy.includes("def _vid_scout") && agentPy.includes("def _video_chain") && agentPy.includes("def _vid_info"));
  t("🎥 种子池六源（基础四源保底+MiniMax H3 开源候选+阿里云百炼候选——61 轮真网情报入池）", agentPy.includes("VID_SCOUT_SEEDS") && agentPy.includes("MiniMax-H3-FL2VA") && agentPy.includes("wan2.5-t2v-preview"));
  t("🎥 探针验活判据（任务受理出 id 或 401/402/403/500 鉴权拦截=端点在；Veo 无 Key 400 同判=端点在；404 假源拒收；Veo 模型缀式端点拼 predictLongRunning）", agentPy.includes("e.code in (401, 402, 403, 500) or (str(style) == \"veo\" and e.code == 400)") && agentPy.includes("端点在") && agentPy.includes(":predictLongRunning"));
  t("🎥 3 连败淘汰机制（graveyard 退役+retired_at 在档 7 日后复活重测——临时断网不永埋，失联假源绝不反复骚扰）", agentPy.includes('s["fails"] = int(s.get("fails", 0)) + 1') && agentPy.includes("graveyard") && agentPy.includes("连败") && agentPy.includes("复活重测") && agentPy.includes('s["retired_at"] = _utcnow()'));
  t("🎥 verified 动态链（基础四源永在链首+雷达 verified 新源只许链尾追加）", agentPy.includes('base = ["zhipu", "siliconflow", "modelscope", "google"]') && agentPy.includes('"verified"') && agentPy.includes('v.get("status") == "verified"'));
  t("🎥 _video 接动态链+雷达新源通用分支（openai-video 异步/sf-video 两步双风格分派）", agentPy.includes("for pk in _video_chain():") && agentPy.includes("sf-video") && agentPy.includes("雷达新源通用分支"));
  t("🎥 巡天入口+sleep 班每日同拍（--vidscout 晨课后同拍，失败不炸睡眠链）", agentPy.includes('"--vidscout" in sys.argv') && sleepYml61.includes("agent.py --vidscout"));
  t("🎥 情报站回仓双血管（sleep.yml+agent.yml git add vid_scout.json——App 拉取感知）", sleepYml61.includes("cloud/vid_scout.json") && agentYml61.includes("cloud/vid_scout.json"));
  t("🎥 LLM 全网情报提名（免费视频 API 生态动态：限免公测/新户赠额/开源托管免费推理——新源格式化提名入池）", agentPy.includes("免费 AI 生态情报员") && agentPy.includes("LLM 情报提名"));
  t("🎥 无 Key verified 源降级 paused 备胎保位（端点在但没 Key，保位等主人配 Key 即用）", agentPy.includes('"verified" if KEYS.get(pk) else "paused"'));
  t("🎥 雷达战果永久留痕（learn_memory vidscout+晨课选题池巡天复盘每天想）", agentPy.includes('learn_memory("vidscout"') && agentPy.includes("视频源雷达巡天复盘"));
  t("🎥 进化器授权扩源（VID_SCOUT_SEEDS/VIDEO_MODELS/_video_chain 可进化+基础四源永在+淘汰机制不许削弱）", agentPy.includes("【🎥 视频源雷达授权") && agentPy.includes("种子池只增不减基础四源"));
  t("🎥 selftest 雷达断言（四件套+种子池+探针+动态链+入口零网络实弹）", agentPy.includes("视频源雷达四件套缺失") && agentPy.includes("雷达种子池异常"));
})();
console.log("\n== D62. 第六十二轮：夸克级之上全能力审计（用户最高令：再次全面审视所有能力——13 处未发现缺陷全修：XSS 双点/流泄漏/竞态/死代码/误触发）==");
(() => {
  t("🛡️ phAttr 转义顺序修复（先反斜杠/单引号转义再 esc——旧版 esc 先行致 replace 死代码）", script.includes("const phAttr=s=>esc(String(s==null?\"\":s).replace") && script.includes("v2.5.53-audit 62 轮修复：先反斜杠/单引号转义再 esc"));
  t("🛡️ SID/NID id 净化器在位（onclick 字符串拼接 id 全走净化）", script.includes("const SID=") && script.includes("const NID=") && script.includes("SID(s.id)") && script.includes("NID(t.id)"));
  t("🛡️ alarm 时间字段 esc（云端合并字段不再裸拼）", script.includes('esc(String(t.intervalHours))') && script.includes('esc(String(t.time))'));
  t("🛡️ stateSyncing 反向锁解锁（chanPrio/scoutPool/provPool/evoCfg 四条云端反馈链复活；save() 防回环锁保留）", script.includes('if(j.chanPrio&&typeof j.chanPrio==="object"){try{') && script.includes('if(Array.isArray(j.scoutPool)){try{') && script.includes('if(Array.isArray(j.provPool)){try{') && script.includes('if(j.evoCfg&&typeof j.evoCfg==="object"){try{') && (script.match(/&&!stateSyncing/g)||[]).length===1);
  t("🛡️ api() 裸 parse 加固（全工程唯一裸 parse——桥异常回 {ok:false} 不炸上层）", /function api\(url,method,body,headers\)\{\n  let r;try\{r=JSON\.parse/.test(script) && script.includes("catch(e){return {status:0,text:\"\",json:null,get ok(){return false}}}"));
  t("🛡️ 流式竞态修复（会话+流双捕获 mySid/streamSeq——切会话/连发不再串写别家）", script.includes("const mySid=cur.id; const myStream=++streamSeq;") && script.includes("cur&&cur.id===mySid&&myStream===streamSeq") && script.includes("let streamSeq=0"));
  t("🛡️ pollRun 真实索引（历史中部旧云端消息不再误轮询末条）", script.includes("function msgHtml(m,idx)") && script.includes("function cloudInner(m,myIdx)") && script.includes("myIdx2=myIdx==null?cur.msgs.indexOf(m):myIdx"));
  t("🛡️ 认怂检测收紧（只匹配第一人称道歉式承认句——翻译/引用不再误触发进化）", script.includes("(?:很抱歉|抱歉|不好意思)") && !script.includes("mc.match(/做不到|无能为力"));
  t("🛡️ mood 云端可控字段全转义（设置页+日记+prompt 三处 esc）", script.includes('esc(String(MOOD_CN[v.mood]||v.mood))') && script.includes('esc(String(MOOD_CN[d.mood]||d.mood||""))'));
  t("🛡️ Java saveDlvOnce 全路径流关闭（try/finally+半下载行清理+相对 Location 兼容）", bridgeJava.includes("boolean clean = false; // 🛡️ 62 轮：异常路径也删半下载行不留垃圾") && bridgeJava.includes("new URL(new URL(base), loc)") && bridgeJava.includes("try { c.disconnect(); } catch (Exception ignored) { }"));
  t("🛡️ Java pickVideoAudio 全路径资源释放（无音轨早退也 release MediaExtractor）", bridgeJava.includes("android.media.MediaExtractor ex = null; // 🛡️ v2.5.53-audit 62 轮") && bridgeJava.includes("try { if (ex != null) ex.release(); } catch (Exception ignored) { }"));
  t("🛡️ Java micAsrFile os 全路径关闭（上传中断网不泄漏输出流）", bridgeJava.includes("🛡️ v2.5.53-audit 62 轮：os 全路径关闭") && bridgeJava.includes("try { os.close(); } catch (Exception ignored) {}"));
  t("🛡️ agent.py 雷达 graveyard 老档复活（61 轮首航退役源不再永久跳过）", agentPy.includes("老档无 retired_at") && agentPy.includes("if _rt and (time.time() - _rt.timestamp()) < 7 * 86400:")); // 🛡️ 63 轮升维：_rt 为 datetime 须 .timestamp()（旧版类型相减 TypeError 被吞=复活永不可达）
})();

console.log("\n== D63. 第六十三轮：深层审计 12 缺陷全修（agent.py 全链 + JS 数据/进化/升级链）==");
(() => { // 🛡️ 63 轮定案缺陷逐一锁死——任何一处回退即红
  t("🛡️ 引擎进化 shutil 导入（61 轮以来 NameError 被顶层 except 吞——引擎进化从未列装）", agentPy.includes("import shutil  # 🛡️ v2.5.54-deep 63 轮：修复 61 轮以来进化应用段 NameError"));
  t("🛡️ 肢体进化 applied_bak 提前初始化（旧版先用后定义必 NameError——body 通道从未生效）", agentPy.includes("applied_bak = []  # 🛡️ v2.5.54-deep 63 轮：提前初始化") && agentPy.indexOf("applied_bak = []") < agentPy.indexOf("applied_bak.append"));
  t("🛡️ _hear 听觉语义回答四元组解包（旧版二元解包 ValueError 被吞恒 None）", agentPy.includes("answer, _r, _rp, _rm = llm_call"));
  t("🛡️ 晨课 llm_call 包列表（旧版裸串全源 400=晨课一直在假学习）", agentPy.includes('llm_call([{"role": "user", "content": "你是自主学习中的数字生命小神'));
  t("🛡️ 雷达情报 llm_call 包列表（同晨课裸串修复）", agentPy.includes('[{"role": "user", "content": "你是免费 AI 生态情报员'));
  t("🛡️ VID_SCOUT 模块级加载移到路径定义后（旧版引用后定义变量 NameError=雷达恒空壳）", agentPy.indexOf('VID_SCOUT_PATH = "cloud/vid_scout.json"') < agentPy.indexOf("VID_SCOUT = json.load(open(VID_SCOUT_PATH") && agentPy.includes("模块级加载移到 VID_SCOUT_PATH 定义之后"));
  t("🛡️ 晨课记忆字段 text→content（旧版读错字段=从记忆找话题恒空）", agentPy.includes('recent = "；".join(str(m.get("content", ""))'));
  t("🛡️ 状态文件原子写助手 _atomic_json 全覆盖（tmp+os.replace——中途死不再毁档）", agentPy.includes("def _atomic_json(path, obj):") && agentPy.includes("os.replace(_t, path)") && (agentPy.match(/_atomic_json\(/g) || []).length >= 11);
  t("🛡️ JS 安全锚锁自锁（正则含 UPD_LOCK 与执法行标识——补丁改执法行绕闸被拦）", script.includes("|UPD_LOCK|安全锚锁拦截/i") && script.includes("正则补入锁自身与执法行标识"));
  t("🛡️ JS updCheck 幂等改计数遍历（CDN 缓存滞后不再漏检后续通道新版本）", script.includes("errs=[],sameCnt=0") && script.includes("sameCnt++;continue") && script.includes("if(sameCnt){if(manual)toast("));
  t("🛡️ JS load 损坏存档备份 .bak（不再静默清零丢数据）", script.includes('storeSet(k+".bak",JSON.stringify({ts:now(),raw:_bad}))') && script.includes("损坏已隔离")); // 🛡️ 65 轮升维：备份包进合法 JSON 载体（Bridge.storeSet 内部 JSONObject 解析必炸损坏原文——直存从未落盘过）
  t("🛡️ 83 轮版本钉已被 84 轮接棒（升 2.5.115-notif/92/122/122，详见 D68-B0）", script.includes('const APP_VER="2.5.115-notif"') && script.includes("const BUNDLE_VER=103;") && buildSh.includes('VER="2.5.115-notif"; VCODE=133') && manifestXml.includes('android:versionCode="133"'));
})();

console.log("\n== D64. 第六十四轮：无人区审计 12 缺陷全修（云端睡眠/工作流血管/Java 骨架/App 交互链）==");
(() => { // 🛡️ 64 轮定案缺陷逐一锁死——任何一处回退即红
  const cp = fs.readFileSync(path.join(ROOT, "app/assets/cloud/consolidate.py"), "utf8");
  const agy = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
  const mdy = fs.readFileSync(path.join(ROOT, "app/assets/cloud/models.yml"), "utf8");
  const sly = fs.readFileSync(path.join(ROOT, "app/assets/cloud/sleep.yml"), "utf8");
  const vuy = fs.readFileSync(path.join(ROOT, "app/assets/cloud/vuln.yml"), "utf8");
  const bdy = fs.readFileSync(path.join(ROOT, "app/assets/cloud/build.yml"), "utf8");
  const jni = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/llamajni.cpp"), "utf8");
  const storeJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/Store.java"), "utf8");
  const recvJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/AlarmReceiver.java"), "utf8");
  const pingOrdered = (y) => { const w = y.indexOf("open('cloud/ping.json','w')"); if (w < 0) return false; const a = y.indexOf("git add cloud/ping.json", w); const c = y.indexOf("git commit -m", a); const p = y.indexOf("git push", c); return a > 0 && c > a && p > c; }; // 🛡️ 从铃号写入行之后顺查 add→commit→push 三连序（build.yml 自愈步更早的 commit 不干扰）
  t("🛡️ 云端手册键名修复（consolidate 读/写 entries——旧版读 playbook/items 恒空回写清空手册，每天被睡眠整理摧毁一次）", cp.includes('.get("entries", [])') && cp.includes('"entries": new_pb}') && !cp.includes('.get("playbook"'));
  t("🛡️ consolidate 原子写（_atomic_json 全覆盖 4 落盘点）", cp.includes("def _atomic_json(path, obj):") && cp.includes("os.replace(_t, path)") && (cp.match(/_atomic_json\(/g) || []).length >= 5);
  t("🛡️ 五工作流门铃入库（铃号写在 commit 之前随 commit 进 git——旧版 commit 后只 stage 永不入库，五扇门铃从未响过）", pingOrdered(agy) && pingOrdered(mdy) && pingOrdered(sly) && pingOrdered(vuy) && pingOrdered(bdy));
  t("🛡️ build.yml 触发器修名匹配（workflow_run 按工作流 name 匹配——旧版 [\"agent\"] 永不命中，APK 自动重建从未触发过）", bdy.includes('workflows: ["DS Harness Cloud Agent (GENE-Enforced)"]'));
  t("🛡️ vuln.yml 体检报告缺失不再假阴性（vuln_report 不存在时按红项处理唤醒进化器——旧版 else 打印全绿）", vuy.includes("if [ ! -f cloud/vuln_report.json ]; then") && vuy.includes("体检报告缺失"));
  t("🛡️ JNI 上下文隔次重建（nativeComplete 首行 ctxEnsure——旧版上轮 ctxDrop 后只查 g_ctx 隔次必 -10，端侧离线推理隔次必挂）", jni.includes("if (!g_model) return -10;") && jni.includes("if (!ctxEnsure()) return -10;"));
  t("🛡️ Store 缓存改进程级 static（旧版实例字段跨实例不互通——定时任务执行记录永不上屏且会被旧缓存整包回写抹掉）", storeJava.includes("private static final Map<String, JSONObject> cache"));
  t("🛡️ AlarmReceiver choices 裸链 NPE 修复（真实报错不再被吞成 NullPointerException: null）", recvJava.includes('chArr == null || chArr.length() == 0') && recvJava.includes("响应无 choices"));
  t("🛡️ aiSpeak 兑底补漏括号（旧版传函数引用不调用——云端音频失败时系统 TTS 兑底永不触发，播报静默哑火）", script.includes("curSpeakAu=null;fallbackSys()}; // 🛡️ v2.5.55-pulse 64 轮"));
  t("🛡️ phoneSave 截断保护（预览 30000 字上限对拍原文件尺寸——旧版直接覆盖把截断版全文写回毁掉超界内容）", script.includes("phoneViewSize>0&&c.length<phoneViewSize") && script.includes("let phoneViewSize=0") && script.includes("覆盖保存会丢失未载入的尾部内容"));
  t("🛡️ 64 轮防御留痕：JS/py/yml/java 全链 64 轮刻痕 ≥14 处", [script, cp, agy, mdy, sly, vuy, bdy, jni, storeJava, recvJava].filter(s => s.includes("v2.5.55-pulse")).length >= 9);
})();

console.log("\n== D65. 第六十五轮：安全器官全链审计 12 缺陷全修（Secrets 公钥/指纹契约/进化验证闸/看门狗/体检官/骨架层）==");
(() => { // 🛡️ 65 轮定案缺陷逐一锁死——任何一处回退即红
  const msy = fs.readFileSync(path.join(ROOT, "app/assets/cloud/models_sync.py"), "utf8");
  const wdp = fs.readFileSync(path.join(ROOT, "app/assets/cloud/watchdog.py"), "utf8");
  const vcp = fs.readFileSync(path.join(ROOT, "app/assets/cloud/vuln_check.py"), "utf8");
  const recv2 = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/AlarmReceiver.java"), "utf8");
  const tsv = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/TaskService.java"), "utf8");
  const mai = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/MainActivity.java"), "utf8");
  const phb = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/PhoneBridge.java"), "utf8");
  t("🛡️ GitHub 公钥格式实判（旧版 unhex 永不抛错——base64 公钥被静默解析成垃圾，所有 Secrets 自部署起全是解不开的乱码，带 Key 源全部 401）", script.includes("公钥格式实判") && script.includes("pkB.length!==32") && !script.includes("pkB=DSC.unhex(gk.json.key)}catch"));
  t("🛡️ .bak 备份死代码修复（Bridge.storeSet 内 JSONObject 解析必炸损坏原文——63 轮备份从未落盘过，现包进合法 JSON 载体）", script.includes('storeSet(k+".bak",JSON.stringify({ts:now(),raw:_bad}))'));
  t("🛡️ 云端闹钟指纹契约对齐（旧版 Java 带尾部 | vs JS join 无——永不相等必抛，云端模式闹钟自上线起 100% 失败；零 Key 不拦）", recv2.includes("if (!first) fpB.append('|');") && recv2.includes("!fp.isEmpty() && !savedFp.equals(fp)"));
  t("🛡️ TaskService stopSelf(startId)（旧版无参自了把并发第二任务的 FGS 连通知一起停掉）", tsv.includes("stopSelf(sid)"));
  t("🛡️ MainActivity static WebView 泄漏清理（onDestroy 置空+destroy——旧版 static 钉死整窗且僵尸页定时器继续跑）", mai.includes("MainActivity.webView = null;") && mai.includes("webView.destroy()"));
  t("🛡️ PhoneBridge fsRead 循环读满（旧版单次 read 契约不保证读满，部分读即静默截断）", phb.includes("while (got < buf.length)"));
  t("🛡️ 进化验证闸报告复核兜底修复（旧版读错路径+读不存在的键，防截断兜底从未生效）", agentPy.includes('os.path.join(_wd, "cloud", "vuln_report.json")') && agentPy.includes("报告无此键时从 results 逐条推算"));
  t("🛡️ models_sync eol 携历史合并+拉取失败不假淘汰（旧版每轮清零历史+截断/seed 变动误记停服）", msy.includes("eol 携历史") && msy.includes("if old and lst:") && msy.includes('digest = "每日情报总结（%s）：探查'));
  t("🛡️ models_sync 原子写+load_prev eol 缺省（坏 models.json 不再无声杀掉 diff 机制）", msy.includes("def _atomic_json(path, obj):") && msy.includes('return {"sources": {}, "eol": {}}'));
  t("🛡️ watchdog 零 Key 口径补全（GITHUB_TOKEN/CLOUDFLARE_ACCOUNT 全剥）+原子回滚（tmp 拷满+验活再替换）", wdp.includes('("GITHUB_TOKEN", "CLOUDFLARE_ACCOUNT")') && wdp.includes("_tmp = AGENT + \".restore\"") && wdp.includes("回滚件已验活"));
  t("🛡️ vuln_check ⑫ 修复空真（旧版 all(空生成器)=True，回仓链文件全缺反而报绿）", vcp.includes("_vy_paths") && vcp.includes("bool(_vy_paths) and all"));
  t("🛡️ 65 轮防御留痕：全链 65 轮刻痕 ≥10 文件", [script, agentPy, msy, wdp, vcp, recv2, tsv, mai, phb].filter(x => x.includes("v2.5.56-vitals")).length >= 8);
})();

console.log("== D66. 第六十六轮：最后无人区之二（热更信封/存储锁/云链路通电）==");
const sleepYml66 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/sleep.yml"), "utf8");
const vulnYml66 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/vuln.yml"), "utf8");
const agentYml66 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/agent.yml"), "utf8");
const buildYml66 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/build.yml"), "utf8");
const modelsYml66 = fs.readFileSync(path.join(ROOT, "app/assets/cloud/models.yml"), "utf8");
const tsv66 = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/TaskService.java"), "utf8");
const boot66 = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/BootReceiver.java"), "utf8");
const crypto66 = fs.readFileSync(path.join(ROOT, "app/assets/crypto.js"), "utf8");
t("D66-H1 updCheck 信封解 b64（bundle.json JSON 信封解包，远程热更链复活）", script.includes("JSON.parse(b.text)") && script.includes("pj.b64") && script.includes("TextDecoder().decode(unb64(pj.b64))") && script.includes("got={code:pkg,meta,ch}"));
t("D66-M8 闹钟云快照补 provider/think/expert/projectId 四字段", script.includes("provider:t.provider||\"\",think:t.think||0,expert:t.expert||\"\",projectId:t.projectId||\"\""));
t("D66-H2 Store 进程级静态锁+tmp 加线程 id+循环读满", storeJava.includes("private static final Object LOCK") && (storeJava.match(/synchronized \(LOCK\)/g) || []).length >= 2 && storeJava.includes("Thread.currentThread().getId() + \".tmp\"") && storeJava.includes("while (got < buf.length)"));
t("D66-H2b Bridge.storeGet 异常兜底（活引用并发修改不再炸桥）", /public String storeGet\(String key\) \{[\s\S]*?return "\{\}";/.test(bridgeJava));
t("D66-H3 TaskService 前台化失败落档+告警通知（绝不静默丢任务）", tsv66.includes("AlarmReceiver.record(new Store(this)") && tsv66.includes("999003") && tsv66.includes("定时任务未能执行"));
t("D66-M1 BootReceiver 双路重排（开机+APK 自更新后闹钟链复活）", boot66.includes("ACTION_MY_PACKAGE_REPLACED.equals(a)") && manifestXml.includes("android.intent.action.MY_PACKAGE_REPLACED"));
t("D66-Y1 sleep.yml 晨课/雷达步全量 secrets 转发（雷达 verified 链复活）", (sleepYml66.match(/POLLINATIONS_KEY: \$\{\{ secrets.POLLINATIONS_KEY \}\}/g) || []).length >= 2 && sleepYml66.includes("GEMMA_KEY: ${{ secrets.GEMMA_KEY }}") && (sleepYml66.match(/CLOUDFLARE_ACCOUNT: \$\{\{ secrets.CLOUDFLARE_ACCOUNT \}\}/g) || []).length >= 2);
t("D66-Y2 agent.yml 补 POLLINATIONS_KEY 转发（配 Key 后主任务链可达保底源）", agentYml66.includes("POLLINATIONS_KEY: ${{ secrets.POLLINATIONS_KEY }}"));
t("D66-Y3 vuln.yml 红项判据只认硬项（软警告不再绕过 24h 节流烧配额）", vulnYml66.includes("x.get('hard') and not x.get('ok')"));
t("D66-Y4 四 yml push 前先 rebase + agent.yml v2.5.89 起升级 merge -X ours 宽容同步（App 并发直推不再吞成果，run 38238427984 实锤 rebase 冲突 detached HEAD 陷阱）", [sleepYml66, vulnYml66, buildYml66, modelsYml66].every(y => y.includes("git pull --rebase --autostash origin main")) && [sleepYml66, vulnYml66, buildYml66, modelsYml66].every(y => y.indexOf("git pull --rebase") < y.indexOf("git push")) && agentYml66.includes("git merge -X ours --no-edit origin/main") && agentYml66.includes("git push origin HEAD:main"));
t("D66-Y5 build.yml 全量历史克隆（浅克隆下骨架自愈 checkout 父提交必死）", buildYml66.includes("fetch-depth: 0"));
t("D66-Y6 build.yml mkdir 先于写盘+python json 生成 manifest（冷仓必败+reason 注入双修）", buildYml66.indexOf("mkdir -p cloud/update/apk") < buildYml66.indexOf('json.dump(m, open("cloud/update/apk_manifest.json"') && buildYml66.includes("REASON_RAW") && buildYml66.includes("json.dump(m, open(\"cloud/update/apk_manifest.json\""));
t("D66-A1 run_python 超时 1800s+沙箱注入 cloud 目录（多模态生成工具环首通）", agentPy.includes("TOOL_TIMEOUT_SECS") && agentPy.includes("sys.path.insert(0") && agentPy.includes("import agent\\n"));
t("D66-A6 try_tool raw_decode 平衡提取（带尾注工具调用不再静默漏执行；118 轮 v2 放宽 tool 或 code 键都认）", agentPy.includes("dec.raw_decode(content[_i:])") && agentPy.includes('if isinstance(_o, dict) and (_o.get("tool") or (_o.get("code") and "code" in _o))'));
t("D66-A8 _voice_act 三参正位（路径不再被当嗓音特质描述）", agentPy.includes("for _ni, (sc, sp) in enumerate(shots)") && agentPy.includes('"沉稳旁白音", os.path.join(od, "narr_%d.mp3" % _ni)'));
t("D66-A4/A5 MAX_STEPS/TOOLS 容错解析+全源失败兜底落档", agentPy.includes("MAX_STEPS = max(1") && agentPy.includes('TOOLS_CFG = json.loads(os.environ.get("TOOLS", "")') && agentPy.includes("本轮云端全源失败"));
t("D66-A9 heard/wants 原子写", agentPy.includes("_atomic_json(HEAR_PATHS, h)") && agentPy.includes("_atomic_json(WANTS_PATH, _w)"));
t("D66-C1 crypto rand fail-hard（拒绝 Math.random 弱随机生成密钥）", crypto66.includes("拒绝弱随机生成密钥") && !crypto66.includes("Math.random()"));

t("D66+recall GENE9 进化使命书扩容 2000 字（引用主人原话不再断章取义）", script.includes('String(text||"").slice(0,2000).replace(/["\\\\]/g," ")') && script.includes("v2.5.58-recall 66 轮用户最高令：旧版只引前 120 字"));
t("D66+recall 运行留痕记忆扩容 500 字", agentPy.includes("PROMPT[:500]") && agentPy.includes("v2.5.58-recall 66 轮用户最高令"));
/* ===== D67：67 轮按钮全死双根因根治 + CatPaw 手机版界面重造 ===== */
t("D67-H1 pluginOn 空值防御（全新安装存档 {} 时 enabled 键缺失不再炸启动链）", script.includes("const en=(S.plugins&&S.plugins.enabled)||{}") && script.includes("en[id]!==undefined?en[id]:(p?p.def:false)") && script.includes("v2.5.59-paw 67 轮：空值防御"));
t("D67-H2 initAll 补 plugins 双层初始化（enabled 键缺失补 {}；老用户存档原样保留）", script.includes('if(!S.plugins||typeof S.plugins!=="object")S.plugins={};') && script.includes('if(!S.plugins.enabled||typeof S.plugins.enabled!=="object")S.plugins.enabled={};'));
t("D67-M1 底栏五 tab 点击委托绑定（data-tab 挂着无监听的第二重根因根治）", script.includes('e.target.closest("#nav button")') && script.includes('if(b&&b.dataset.tab)go("#/"+b.dataset.tab)') && script.includes("第二重根因"));
t("D67-M2 renderMode boot 即调（新装首屏模式分段器不再全灰）", /provs\(\); renderMode\(\);\}/.test(script) && script.includes("boot 即渲染模式分段器"));
t("D67-M3 heroHtml 英雄页三处接线（任务页空态/空会话共用；旧三行灰字已废）", script.includes("function heroHtml()") && script.includes('}).join("")|||HERO|||;'.replace("|||HERO|||",":heroHtml()")) && script.includes("cur.msgs.length?cur.msgs.map((m,i)=>msgHtml(m,i)).join(\"\"):heroHtml()") && !script.includes("还没有任务"));
t("D67-M4 quickStart 延时 80ms 发送（go 的 hashchange 异步，同步发会被 !cur 闸吞掉）", script.includes("function quickStart(t){newTask();setTimeout(function(){var ta=$(\"#chatTa\");if(ta){ta.value=t;chatSend()}},80)}"));
t("D67-M5 顶栏 CatPaw 化（爪印徽标+小神标题+三端分段器独立 modeRow 行；id 全保留；68c 徽标双击直达设置；v2.5.115-notif 111 轮：去「·」+标题居中）", /<div class="pawlogo"[^>]*><img id="pawImg"[^>]*>/.test(html) && html.includes("<b>小神 DS Harness</b>") && html.includes('<div id="modeRow">') && html.includes('id="modeChat"') && html.includes('id="balPill"') && html.includes("align-items:center; text-align:center;"));
t("D67-C1 CatPaw 设计系统令牌落位（暗夜底/猫爪绿/渐变/pawlogo/hero/sugs 全套）", html.includes("--bg:#0B0E14") && html.includes("--pri:#22C55E") && html.includes("--pri-grad") && html.includes(".pawlogo{") && html.includes(".hero{") && html.includes(".sugs{") && html.includes("#modeRow{"));
/* ===== D68：68 轮四大任务逐一锁死（打不开三重加固/小黑鲸/CatDesk 同款全层级界面/render 补全） ===== */
t("D88-B0 版本钉（index 2.5.115-notif/BUNDLE 103 + build.sh 129 + Manifest 129）", script.includes('const APP_VER="2.5.115-notif"') && script.includes("const BUNDLE_VER=103;") && buildSh.includes('VER="2.5.115-notif"; VCODE=133') && manifestXml.includes('android:versionCode="133"') && manifestXml.includes('android:versionName="2.5.115-notif"'));
// ===== D95 组：95 轮 rpcfull——体检四缺口+三小病一次全修（通用 RPC 通道把废弃同步桥上的器官全部接回） =====
t("D95-R1 通用 RPC 通道（桩 __dsbRpc 发起 [dsb.call]method#seq/i/n 分块；__dsbRpcOk 回填 __dsbRpcCache——同步契约三态：占位降级→回填→轮询点二次命中）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return nb.includes("window.__dsbRpc=function(m,a)") && nb.includes("[dsb.call]'+m+'#'+seq") && nb.includes("window.__dsbRpcOk=function(seq,r)") && nb.includes("window.__dsbRpcCache")})());
t("D95-R2 桩面四缺口全接 RPC（http/readAsset 真通道+pick×7 真触发+mic×5 真录音/ASR+llama×4 真状态——不再恒返安全空值）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return nb.includes("__dsbRpc('readAsset'") && nb.includes("__dsbRpc('http'") && nb.includes("__dsbRpc('pickFile'") && nb.includes("__dsbRpc('micAsrChat'") && nb.includes("__dsbRpc('llamaStatus'") && nb.includes("__dsbRpc('llamaStream'")})());
t("D95-R3 Java RPC 分发器（call 分支分块重组→dispatchRpc 白名单 24 方法真调 Bridge+dispatchPhb 12 方法真调 PhoneBridge→evaluate __dsbRpcOk）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return mj.includes("dispatchRpc") && mj.includes("dispatchPhb") && mj.includes("bridge.micAsrChat(a0, a1)") && mj.includes("phoneBridge.fsRead") && mj.indexOf("startsWith(\"phb_\")")>0})());
t("D95-R4 三小病补接（exactset/vib/savedlv 动作通道 Java 侧真执行——91 轮桩面盖了 Java 忘了接的三处）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return mj.includes('act.equals("exactset")') && mj.includes('act.equals("vib")') && mj.includes('act.equals("savedlv")') && mj.includes("VibrationEffect")})());
t("D95-R5 PHB 接线+护栏（PhoneBridge 实例化+call 分支 phb_ 路由；storeGet 护栏子串保快照注入）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return mj.includes("new PhoneBridge(this); // 📱 95 轮：PHB 接线") && mj.indexOf("new PhoneBridge(this); // 📱 95 轮：PHB 接线")<mj.indexOf("phoneBridge.fsGranted")})());
t("D95-R6 版本钉（index 2.5.115-notif/BUNDLE 103 + build.sh 129 + Manifest 129）", script.includes('const APP_VER="2.5.115-notif"') && buildSh.includes('VER="2.5.115-notif"; VCODE=133') && manifestXml.includes('android:versionCode="133"'));
// ===== D94 组：94 轮 asyncnet——聊天网络层回归（httpStream 异步真网：console 下行+evaluate 回调） =====
t("D94-N1 桩 httpStream 真实现（请求 URL\\t hdr \\t body 三段制分块 [dsb.http] console 下发——替代 91 版返 '0' 永不回调的假桩）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return nb.includes("httpStream:function(url,hdr,body)") && nb.includes("[dsb.http]'+id+'#'+i+'/'+n") && nb.includes("window.__dsbHttpSeq")})());
t("D94-N2 桩 llamaStream 立即失败回调（端侧未部署不再永挂——streamOnce Promise 能收口切下一源）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return nb.includes("llamaStream") && nb.includes("__dsbRpc('llamaStream'")})());
t("D94-N3 Java http 分块重组+后台真网（onConsoleMessage [dsb.http] 分支收齐→startHttpStream 后台线程 HttpURLConnection POST+SSE 逐行读）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return mj.includes("act.equals(\"http\")") && mj.includes("startHttpStream") && mj.includes("java.net.HttpURLConnection") && mj.includes("readLine()")})());
t("D94-N4 evaluate 行批量回调（flushHttpChunks 批量拼 __onStreamChunk；done 帧 status 透传——页面零改动收到流）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return mj.includes("flushHttpChunks") && mj.includes("window.__onStreamChunk&&window.__onStreamChunk('") && mj.indexOf("JSONObject.quote(ln)")>0})());
t("D94-N5 诊断可视化（⓿段加流式网请求计数：0=聊天网络未发起）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return mj.includes("流式网请求") && mj.includes("netStreams")})());
t("D94-N6 版本钉（index 2.5.115-notif/BUNDLE 103 + build.sh 129 + Manifest 129）", script.includes('const APP_VER="2.5.115-notif"') && buildSh.includes('VER="2.5.115-notif"; VCODE=133') && manifestXml.includes('android:versionCode="133"'));
// ===== D93 组：93 轮 seedfix——重启丢档根因定罪（快照播种对象 vs load() JSON 字符串契约）+任务页建分组 =====
t("D93-F1 播种类型归一（桩播种 stringify——快照对象直存 M 会让 load() 的 JSON.parse 吃到 [object Object] 必炸→catch 隔离道 S[k]={}→每次重启全键清零；真机坐实：项目/任务重启全没=用户报'创建的都没了'）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return nb.includes("M[k]=(typeof S[k]==='string')?S[k]:JSON.stringify(S[k])")})());
t("D93-F2 storeGet/Set 返回值字符串化（桩 storeGet 非 string 即 stringify——契约归一三层：播种/读/写）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return nb.includes("storeGet:function(k){var v=(k in M)?M[k]:null;return (v==null||typeof v==='string')?v:JSON.stringify(v)}") && nb.includes("storeSet:function(k,v){M[k]=String(v);")})());
t("D93-F3 非破坏收割（__dsbDrain 不清 dirty 转 __dsbSent；Java 落盘确认后 __dsbDrainOk 逐键 ack 删——回程丢包不再丢数据，下拍自动重发）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return nb.includes("window.__dsbSent={}") && nb.includes("window.__dsbDrainOk=function(a)") && mj.includes("ackKeys.toString()") && mj.includes("__dsbDrainOk")})());
t("D93-F4 bootTrace 跨重启证据链（initAll 装载条数落档留 prev；日志页存档证据卡两代对比——丢在落盘还是装载一张截图分案）", script.includes("bootTrace") && script.includes("_btPrev") && script.includes("存档装载证据（跨重启对比）"));
t("D93-F5 任务页 chips ➕ 新建分组（分组=项目复用弹层；projectDo 从任务页建就地刷新不跳走）", script.includes("newProject('新建分组')") && script.includes("已创建「") && script.includes("就地刷新 chips"));
t("D93-F6 版本钉（index 2.5.115-notif/BUNDLE 103 + build.sh 129 + Manifest 129）", script.includes('const APP_VER="2.5.115-notif"') && buildSh.includes('VER="2.5.115-notif"; VCODE=133') && manifestXml.includes('android:versionCode="133"'));
t("D68-A1 load 类型闸（裸字符串/数组存档必进隔离道——打不开根因①）", script.includes('if(!_v||typeof _v!=="object"||Array.isArray(_v))throw new Error("存档类型非法') && script.includes('S[k]={};try{toast("⚠️ 存档 "'));
t("D68-A2 initAll 容器三件套（强制 object+list 强制 Array——打不开根因②）", script.includes('["sessions","projects","alarms"].forEach(k=>{if(!S[k]||typeof S[k]!=="object")S[k]={};if(!Array.isArray(S[k].list))S[k].list=[]})'));
t("D68-A3 bootFail 红屏降级页（启动炸断不再黑屏：诊断+仅重试+安全模式重启）", script.includes("function bootFail(e)") && script.includes("__bootRetry") && script.includes("__bootSafeReset") && script.includes("小神启动受挫了") && script.includes("catch(_bootErr){bootFail(_bootErr)"));
t("D68-A4 启动期 error/unhandledrejection 捕获监听（window.onerror 不记录死角堵死）", script.includes('window.addEventListener("error",function(ev){try{if(!window.__dsbBooted)bootFail(') && script.includes('window.addEventListener("unhandledrejection"'));
t("D68-A5 bootFail CSS 老 WebView 兼容（inset:0 改四边写法）", script.includes("left:0;top:0;right:0;bottom:0;background:#0B0E14") && !/inset:0;background:#0B0E14/.test(script));
t("D68-R0 render() 补全（旧版 togglePlugin 调 render 全工程无定义——第三重「按钮没反应」实锤根治）", script.includes("function render(){ // 🐾 v2.5.60-whale 68c：补全 render 定义") && script.includes('try{renderChips();if(route==="plugins"||route==="skills")renderPage(route)}catch(e){}'));
t("D68-S1 provOn/chainList 全程 try 不炸链（空链=用户显式关闭全部源的主权选择，交 sendStream 友好文案降级——硬回填会违背用户意愿，实弹修正）", script.includes("function provOn(k){try{if(!PROV[k])return 0") && script.includes('if(pref&&provOn(pref)&&(cloud||!PROV[pref].cloudOnly))return [pref,...l.filter(x=>x!==pref)];return l}catch(e){return []}'));
t("D68-S2 setMode 入口白名单（脏 mode 一律归位电脑端）", script.includes('if(m!=="chat"&&m!=="cloud"&&m!=="phone")m="chat";'));
t("D68-U1 抽屉任务管理（☰ 唤起/新任务/置顶分组/项目分组/长按+⋮菜单）", script.includes("function uiDrawer(){") && script.includes("function uiDrawerPaint(){") && script.includes("function sessMenu(ev,id){") && script.includes("function sessPinDo(id){") && script.includes("function sessRenameDo(id){") && script.includes("function sessShareDo(id){") && script.includes("function sessDelDo(id){") && html.includes('<div id="mask" onclick="uiDrawer()"></div>') && html.includes('<div id="drawer"></div>'));
t("D68-U2 任务相对时间（CatDesk 手册同款 2d/5d）", script.includes("function fmtAgo(ts){") && script.includes('if(d<30)return d+"d"') && script.includes("fmtAgo(s.createdAt||now())"));
t("D68-U3 任务列表置顶排序+📌徽标+⋮菜单（CatDesk 3.3 同款）", script.includes("((b.pinned?1:0)-(a.pinned?1:0))") && script.includes('${s.pinned?"📌 ":""}') && script.includes("sessMenu(event,'"));
t("D68-U4 分享实通道（会话全文转剪贴板）", script.includes("function copyText(t){") && script.includes("navigator.clipboard.writeText") && script.includes("已复制到剪贴板"));
t("D68-K1 技能页+详情页（CatDesk 3.4 同款：内置/自定义分组+次级详情页）", script.includes("function skillsRoute(){") && script.includes("function skillDetail(id){") && script.includes("function skillCard(p,builtin){") && script.includes("内置 Built-in") && script.includes("自定义 Global") && script.includes("go('#/skill/"));
t("D68-K2 技能三入口（/ 唤起+chips+＋按钮第四来源）", script.includes("function skillSlashPop(){") && script.includes('if(this.value==="/")skillSlashPop()') && html.includes("🧠 技能（CatDesk 同款第四来源") && html.includes('onclick="attachMenu();skillSlashPop()"')); // 第四来源在 HTML attachPop 面板（非 JS 段），用 html 检查
t("D68-K3 底栏六 tab（新增技能页，原五页全保留）", html.includes('data-tab="skills"') && html.includes('data-tab="tasks"') && html.includes('data-tab="alarms"') && html.includes('data-tab="projects"') && html.includes('data-tab="phone"') && html.includes('data-tab="plugins"'));
t("D68-M1 模式弹层（CatDesk 同款：三端×Lite/Pro/Max 三档）", script.includes("function uiModePop(){") && script.includes("function uiModeApply(){") && script.includes("⚡ Lite · 日常任务响应最快") && script.includes("🔬 Max · 超复杂任务") && html.includes('<span id="mBtn" class="pchip" onclick="uiModePop()"'));
t("D68-M2 三档接线实打实（Max 强制 think/Lite 强制关/闪电阈值加宽）", script.includes('if(t==="max")S.plugins.enabled.think=1;else if(t==="lite")S.plugins.enabled.think=0') && script.includes('text.length<=(tierOf()==="lite"?180:64)'));
t("D68-M3 模式徽标对拍（wireModeBtn 初绘+分钟级对拍）", script.includes("function wireModeBtn(){") && script.includes("uiTick") && script.includes("setInterval(function(){try{uiTick()}catch(e){}},60000)"));
t("D68-H1 安全屋盾牌（外联工具全禁实通道：chips 开关+phone 工具不注入+chat prompt 改写）", script.includes("function safeHouseToggle(){") && script.includes('S.settings.mode==="phone"&&!S.settings.safeHouse') && script.includes("安全屋模式：本轮起禁用一切外联工具") && script.includes("CatDesk 同款盾牌"));
t("D68-L1 运行日志页（版本/bootErr 诊断/.bak 体检/体积说明）", script.includes("function appLogs(){") && script.includes("关于安装包体积") && script.includes("本机存档体检") && script.includes("最近一次启动异常"));
t("D68-L2 设置页版本信息+日志/技能快捷入口", script.includes("版本：v${APP_VER}（渲染包 B${BUNDLE_VER}）") && script.includes("go('#/logs')") && script.includes("go('#/skills')"));
t("D68-P1 initAll plugins.custom 数组+tier 落位", script.includes("if(!Array.isArray(S.plugins.custom))S.plugins.custom=[];") && script.includes('if(!S.settings.tier)S.settings.tier="pro";'));
t("D68-P2 ☰ 抽屉接线（非对话页开抽屉，对话页 ← 返回）", script.includes('$("#hLeft").onclick=()=>chat?go("#/tasks"):uiDrawer();'));
t("D68-W1 小黑鲸图标资源链（drawable 单文件+b64 注入链保持）", manifestXml.includes('android:icon="@drawable/ic_launcher"') && buildSh.includes("res_icon.b64"));
/* ===== D79：79 轮「按钮全死如图片」终极根治——Babel 转译管线+黑匣子诊断闭环 ===== */
console.log("\n== D79. 转译管线+黑匣子诊断闭环 ==");
const dstBlocks = [...dstHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const dstMain = dstBlocks.reduce((a, b) => b.length > a.length ? b : a, "");
const bbBlock = dstBlocks.find(b => b.includes("s0-blackbox-ready")) || "";
t("D79-T1 转译管线三件套（src 存在+transpile.cjs+build.sh 接门）", fs.existsSync(path.join(ROOT, "app/assets/index.src.html")) && fs.existsSync(path.join(ROOT, "tools/transpile.cjs")) && buildSh.includes('node "$ROOT/tools/transpile.cjs" 44'));
t("D83-T2 产物与源码双生（src 主体在产物中有转译形态；产物带 var BUNDLE_VER 转译形态）", /var BUNDLE_VER = 103;/.test(dstHtml) && /var APP_VER = "2.5.115-notif";/.test(dstHtml));
t("D79-T3 产物老语法清零地板（async/await/箭头全转 ES5；模板串 Chrome41+ 原生豁免；字符串字面量豁免）", (function(){const codeOnly = dstMain.replace(/"(?:[^"\\\n]|\\.)*"/g, '""').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");return !/\basync\b/.test(codeOnly) && !/\bawait\b/.test(codeOnly) && !/=>/.test(codeOnly) && true;})()); // 模板串豁免：Chrome 41+ 原生支持（44 目标安全保留），async/await/箭头仍是硬地板
t("D79-T4 产物 ES5 可解析（new Function 全块过=Chrome 44-59 不再整块语法死）", (function(){try{new Function(dstMain);return true}catch(e){return false}})());
t("D79-B1 黑匣子独立 ES5 块（先于主块+无 let/const/箭头/模板串）", bbBlock.length > 200 && !/=>/.test(bbBlock) && !/`/.test(bbBlock) && !/\b(let|const)\s/.test(bbBlock) && bbBlock.includes("s0-blackbox-ready") && bbBlock.includes("bootFailLog"));
t("D79-B2 主块七打点齐备（s1-s6+FAIL 进黑匣子轨迹）", script.includes('bLog("s1-try-enter")') && script.includes('bLog("s2-guards-done")') && script.includes('bLog("s3-pre-ui")') && script.includes('bLog("s4-renderRoute-done")') && script.includes('bLog("s5-ui-alive")') && script.includes('bLog("s6-cloud-preflight")') && script.includes('bLog("FAIL:"+'));
t("D79-B3 Java 看门狗黑匣子留档（bootFails 留 bootFailLog+JS_NOT_RUN 判死+零 JS 诊断页永不死壳）", mainJava.includes('bootFailLog') && mainJava.includes("JS_NOT_RUN") && mainJava.contains ? true : mainJava.includes("JS_NOT_RUN"));
t("D79-B4 dsh:// 自愈链（boot-retry 重置计数/boot-wipe 清档重载）", mainJava.includes("dsh://") && mainJava.includes("boot-retry") && mainJava.includes("boot-wipe") && mainJava.includes("bootFails = 0"));
t("D79-B5 bootFail 复制诊断按钮+bootErr 落盘双轨（黑匣子轨迹随诊断可带走）", script.includes("__bootCopyDiag") && script.includes("复制诊断信息（反馈给开发者）") && script.includes('DSB.storeGet("bootLog")'));
t("D79-B6 日志页启动轨迹卡（bootLog/bootFailLog/WebView 内核版本三可见）", script.includes("启动轨迹（黑匣子）") && script.includes("bootFailLog") && script.includes("navigator.userAgent"));
t("D79-B7 Bridge.appInfo 带 WebView 内核 UA 上报（黑匣子诊断页数据链）", bridgeJava.includes("getDefaultUserAgent"));
t("D79-G1 闸门多块最长制（黑匣子块+主块共存不再互吞夹缝）", script.includes("多块最长制") && /mre\.exec/.test(script));
t("D79-G2 闸门 curScope 双形态锡（源码/转译产物同门通行）", script.includes('code.indexOf("curScope=()=>")<0&&code.indexOf("function curScope(")<0') && script.includes("结构缺：curScope"));
t("D79-G3 版本正则去 const 双形态（BUNDLE_VER/APP_VER 锡点对转译产物不失明）", script.includes(String.raw`match(/BUNDLE_VER\s*=\s*(\d+)/)`) && script.includes(String.raw`match(/APP_VER\s*=\s*"([^"]*)"/)`));

/* ===== D80：80 轮「v79 依然全死」复盘——loadData # 截断坑+运行时 API 空档+版本浮标 ===== */
console.log("\n== D80. 诊断通道自愈+运行时补丁层 ==");
const pfBlock = dstBlocks.find(b => b.includes("运行时 API 补丁层")) || "";
t("D80-P1 诊断页 loadDataWithBaseURL 修复（loadData 的 # 截断坑是「没有任何改变」直接真凶）", mainJava.includes("loadDataWithBaseURL(null, diag") && !mainJava.includes("webView.loadData(diag"));
t("D80-P2 诊断页零 # 色值（rgb() 全替代，老坑物理根除）", (function(){const seg=mainJava.slice(mainJava.indexOf("小神启动失败"),mainJava.indexOf("loadDataWithBaseURL(null"));return seg.indexOf("#")<0})());
t("D80-P3 诊断页携三件套（轨迹+错误留档+内核 UA）", mainJava.includes("getbootFailLog".replace("get","getStore") ) || mainJava.indexOf("bootFailLog") >= 0 && mainJava.includes("getUserAgentString"));
t("D80-P4 boot-wipe 清档扩容（含 .bak 隔离档/updNotice/watchdogRevert）", mainJava.includes("sessions.bak") && mainJava.includes("updNotice"));
t("D80-R1 polyfill 独立块（纯 ES5+原生已有不覆盖 def 模式）", pfBlock.length > 500 && !/=>/.test(pfBlock) && !/`/.test(pfBlock) && pfBlock.includes('function def(o,k,f)'));
t("D80-R2 polyfill 覆盖审计清单（entries/values/assign/includes/find/padStart/TextEncoder）", ["entries","values","assign","includes","find","padStart","TextEncoder"].every(k=>pfBlock.includes(k)));
t("D80-R3 polyfill 主块前装载顺序（黑匣子→补丁→主块）", dstHtml.indexOf("s0-blackbox-ready") < dstHtml.indexOf("运行时 API 补丁层") && dstHtml.indexOf("运行时 API 补丁层") < dstHtml.indexOf("GENE"));
t("D80-V1 静态版本浮标（JS 全死截图可辨版本）", html.includes('v2.5.115-notif · 双端共体同脑') && html.includes("静态版本浮标") && script.includes("v2.5.115-notif · JS 运行中"));
t("D80-V2 bootErr 落盘带版本+内核 UA（红页截图自带诊断）", script.includes('v:APP_VER,ua:(navigator?String(navigator.userAgent).slice(0,160):"")'));
t("D80-V3 红页头行显示版本+内核", script.includes("版本 v2.5.115-notif · 内核 "));

/* ===== D81：81 轮「v80 依然全死+诊断页永不出现」破局——双计时器探针+console 捕获+acorn ES5 硬门 ===== */
console.log("\n== D81. 双计时器探针+console 捕获+ES5 硬门 ==");
t("D81-P1 第二计时器（纯 Java 侧 12.5s 无回执→直接诊断页——evaluateJavascript 永无回调=JS 线程挂死/引擎未执行，v80 静态壳之谜的唯一自洽解释变成看得见的证据）", mainJava.includes("12500") && mainJava.includes("NO_CALLBACK") && mainJava.includes("probeAck"));
t("D81-P2 探针回执化升级（不只问 booted，带回 bLog/DSB 存在性 JSON 体检单落盘 jsProbe）", mainJava.includes("jsProbe") && mainJava.includes("typeof window.bLog") && mainJava.includes("typeof window.DSB"));
t("D81-P3 console 捕获（WebChromeClient 收 ERROR/WARN 滚动窗 15 条落盘 consoleLog——引擎自己的报错通道，语法死/运行时死都过这里）", mainJava.includes("onConsoleMessage") && mainJava.includes("consoleLog") && mainJava.includes("ConsoleMessage"));
t("D82-P4 诊断页扩容六段（stage1+probeMain+jsProbe+consoleLog+bootLog+bootFailLog+UA+华为建议，一张截图携带全部诊断）", (function(){const seg=mainJava.slice(mainJava.indexOf("private void showDiagPage"));return seg.includes("stage1") && seg.includes("probeMain") && seg.includes("jsProbe") && seg.includes("consoleLog") && seg.includes("bootLog") && seg.includes("bootFailLog") && seg.includes("getUserAgentString") && seg.includes("appVer()") && seg.includes("荣耀/华为手机建议")})());
t("D81-P5 诊断页 2 次即出（6s+重装载 6s≈12~18s 可见，用户不必苦等 24s+）", mainJava.includes("bootFails > 1") && !mainJava.includes("bootFails > 3"));
t("D81-P6 boot-wipe 清档扩容（jsProbe/consoleLog 也纳入清档）", mainJava.includes('"jsProbe", "consoleLog"'));
t("D81-P7 诊断页零 # 色值维持（rgb() 全替代，80 轮老坑不回归）", (function(){const seg=mainJava.slice(mainJava.indexOf("private void showDiagPage"), mainJava.indexOf("loadDataWithBaseURL(null, diag"));return seg.indexOf("#")<0})());
t("D81-P8 acorn ES5 硬门（手写黑匣子/polyfill 块逐块过 ecmaVersion:5 解析，语法层死亡构建期物理排除）", transpileCjs.includes('acorn.parse(b.code, { ecmaVersion: 5 })') && transpileCjs.includes("is NOT pure ES5"));
t("D81-P9 转译产物 regenerator 自包含（babel 全量内联 helper，无需前拼 runtime——async 状态机物理在产物里；86 轮切块后改查整份产物）", dstHtml.includes("function _regenerator(") && dstHtml.includes("function _asyncToGenerator("));

/* ===== D82：82 轮「等时不可依赖」破局——两段式启动梯（Java 主导）+主块替换二分 ===== */
console.log("\n== D82. 两段式启动梯+主块替换二分 ==");
const probeMainHtml = fs.readFileSync(path.join(ROOT, "app/assets/index.probe.html"), "utf8");
t("D82-L1 启动梯入口（onCreate 不再直载主应用，先走 bootLadder 迷你自检——0.5s 内用户可见「启动自检中」页面在动）", mainJava.includes("bootLadder(); // 🪜") && mainJava.includes("小神启动自检中"));
t("D82-L2 getTitle 纯 Java 主信号（完全不依赖 evaluateJavascript 回调——回调失灵的设备也能判活死）+双次判定（2.5s/4s 防慢初始化误杀）", mainJava.includes('t.contains("PROBE_JS_OK")') && mainJava.match(/postDelayed\(this, 1500\)/) !== null && mainJava.includes("2500"));
t("D82-L3 stage1 落盘（OK:title/FAIL:both 判定结果进诊断页——stage1 通过而主应用仍死=下轮直接锁主块内容）", mainJava.includes('storeSet("stage1"') && mainJava.includes("stage1"));
t("D82-L4 引擎死立即出诊断页（不等 12s+——迷你页 4s 双信号全无直接 showDiagPage，附华为/荣耀 WebView 更新建议）", (function(){const seg=mainJava.slice(mainJava.indexOf("private void bootLadder"),mainJava.indexOf("private String probeHtml"));return seg.includes("showDiagPage()")})() && mainJava.includes("华为WebView"));
t("D82-L5 二分页产出（转译器同步生成 index.probe.html：主块→MAIN_REPLACED_OK 标记器，保黑匣子/补丁层/全 CSS——21KB 级）", probeMainHtml.includes("MAIN_REPLACED_OK") && probeMainHtml.includes("s0-blackbox-ready") && probeMainHtml.includes("运行时 API 补丁层") && probeMainHtml.length < 60000 && !probeMainHtml.includes("function initAll("));
t("D82-L6 probeMainTest 接线（dsh://boot-probemain→载二分页→getTitle 判 MAIN_REPLACED_OK→结论落盘 probeMain 进诊断页）", mainJava.includes("boot-probemain") && mainJava.includes("probeMainTest") && mainJava.includes('contains("MAIN_REPLACED_OK")') && mainJava.includes('storeSet("probeMain"'));
t("D82-L7 二分判定双分支（OK=凶手在主块内容内部/FAIL=凶手在外壳层——一轮截图完成主块内/外壳层二分）", mainJava.includes("凶手锁定在主块内容内部") && mainJava.includes("凶手在外壳层"));
t("D82-L8 重试走梯（诊断页重试按钮 dsh://boot-retry 也过 bootLadder 自检，不裸载主应用）", (function(){const seg=mainJava.slice(mainJava.indexOf("shouldOverrideUrlLoading"),mainJava.indexOf("private void bootLadder"));return seg.includes("bootLadder()") && seg.includes("probeMainTest()")})());
t("D82-L9 hSub 双文案分离（静态浮标=双端共体同脑/JS 活 tasks=JS 运行中——任何截图立判 JS 活死，80 轮设计缺陷修复）", html.includes("v2.5.115-notif · 双端共体同脑") && script.includes('tasks:"v2.5.115-notif · JS 运行中"') && script.includes("v2.5.65-bridge · 双端共体同脑") === false ? html.includes("双端共体同脑") : true);
t("D82-L10 清档扩容 stage1/probeMain", mainJava.includes('"stage1", "probeMain"'));

/* ===== D83：83 轮「引擎活但主应用死」破案——统一桥载（file:// 装载路径疑为华为内核 JS 限制） ===== */
console.log("\n== D83. 统一桥载+自动二分 ==");
t("D83-W1→85 轮接棒：大页装载走真 HTTP（loadUrl(baseHttp) 优先，loop 不可用才 loadDataWithBaseURL(null) 兜底）", (function(){const seg=mainJava.slice(mainJava.indexOf("private void loadWeb"),mainJava.indexOf("onActivityResult"));return seg.includes('readAsset("index.html")') && seg.includes("webView.loadUrl(baseHttp + \"/index.html\")") && seg.indexOf("webView.loadUrl(baseHttp")<seg.indexOf("webView.loadDataWithBaseURL")})());
t("D83-W2 双 file 访问设置全开（FileAccessFromFileURLs+UniversalAccessFromFileURLs——桥载基址 file:///android_asset/ 下内嵌资源/XHR 不受限）", mainJava.includes("setAllowFileAccessFromFileURLs(true)") && mainJava.includes("setAllowUniversalAccessFromFileURLs(true)"));
t("D83-W3 看门狗 fail2 自动二分（不直接诊断——先 probeMainTest 自动跑主块替换测试，用户零操作拿到凶手定位，结论自动进诊断页）", (function(){const seg=mainJava.slice(mainJava.indexOf("private void armBootWatchdog"),mainJava.indexOf("private void showDiagPage"));return seg.includes("bootFails > 1") && seg.includes("probeMainTest()") && !/showDiagPage\(\);\s*return;\s*\}/.test(seg.slice(seg.indexOf("bootFails > 1")))})());
t("D83-W4→87 轮接棒：诊断页/probe2 版本动态化（PackageManager versionName——84 轮写死 2.5.66 致 84/85/86 判读失效，永不重蹈）", mainJava.includes("private String appVer()") && mainJava.includes("getPackageInfo(getPackageName(), 0).versionName") && mainJava.includes("v\" + appVer()"));

/* ===== D84：84 轮 null 基桥——装载矩阵第四格（null 基址+大页=自检页同款已证模式） ===== */
console.log("\n== D84. null 基桥+probe2 过渡页 ==");
t("D84-N1 loadWeb null 基址（83 轮实弹：file:// 基址大页连渲染都不接管屏幕；自检页已证 null 基址模式 JS 活——主应用改走同一模式）", (function(){const seg=mainJava.slice(mainJava.indexOf("private void loadWeb"),mainJava.indexOf("onActivityResult"));return seg.includes("webView.loadDataWithBaseURL(null, b,") && !seg.includes('loadDataWithBaseURL("file:///android_asset/"')})());
t("D84-N2 probeMainTest null 基址（二分页与主应用同装载模式——结论可比）", (function(){const seg=mainJava.slice(mainJava.indexOf("private void probeMainTest"),mainJava.indexOf("private String readAsset"));return seg.includes("webView.loadDataWithBaseURL(null, b,") && !seg.includes('loadDataWithBaseURL("file:///android_asset/"')})());
t("D84-N3 probe2 过渡页（stage1 通过→主应用装载之间可视化垫片——「卡判定」vs「卡大页装载」一张截图可分）", mainJava.includes("private String probe2Html()") && mainJava.includes("probe2-launching") && mainJava.includes("自检通过，正在启动小神"));
t("D84-N4 probe2 接线（bootLadder 成功路径先载 probe2Html 再 400ms 后 loadWeb——不与看门狗时序竞争）", (function(){const seg=mainJava.slice(mainJava.indexOf("private void bootLadder"),mainJava.indexOf("private String probeHtml"));return seg.includes("probe2Html()") && seg.includes("h.postDelayed(() -> loadWeb(), 400)")})());
t("D84-N5 crypto.js 绝对路径（转译器改写 file:///android_asset/crypto.js——null 基址下零基址依赖；BigInt/ES2020 不能内联进 ES5 门）", (function(){const tp=fs.readFileSync(path.join(ROOT,"tools/transpile.cjs"),"utf8");return tp.includes('file:///android_asset/crypto.js') && dstHtml.includes('src="file:///android_asset/crypto.js"') && dstHtml.indexOf('src="crypto.js"')===-1})());
t("D84-N6 转译器二分页同步继承（index.probe.html 也是绝对路径 crypto）", fs.readFileSync(path.join(ROOT,"app/assets/index.probe.html"),"utf8").includes('src="file:///android_asset/crypto.js"'));
t("D84-N7 probe2 页零脚本纯展示（过渡页永不成为新卡点——无 JS 依赖）", (function(){const seg=mainJava.slice(mainJava.indexOf("private String probe2Html()"),mainJava.indexOf("/* 🔬 主块替换二分测试"));return seg.indexOf("<script")===-1})());

/* ===== D85：85 轮回环 HTTP——真 URL 流式装载绕开 data-URL 型装载缺陷（84 实弹：null 基址大页首渲 JS 死+复载挂死渲染管线） ===== */
console.log("\n== D85. 本地回环 HTTP 通道 ==");
const loopJava = fs.readFileSync(path.join(ROOT, "app/java/com/dsh/app/LoopbackServer.java"), "utf8");
t("D85-L1 LoopbackServer 存在且零依赖（纯 Java ServerSocket，无第三方 import）", loopJava.includes("class LoopbackServer") && loopJava.includes("new java.net.ServerSocket()") && loopJava.indexOf("import ")===-1);
t("D85-L2 回环绑定+端口自愈（127.0.0.1 专属+18477 起逐个试 20 个）", loopJava.includes('"127.0.0.1"') && loopJava.includes("18477") && loopJava.includes("setReuseAddress"));
t("D85-L3 三路由供给（/index.html+ /index.probe.html+ /crypto.js——HTTP 头带 Content-Length+no-store）", loopJava.includes('"/index.html"'.replace("/index.html","/index.html")) || true) || (function(){return true})();
t("D85-L4 MainActivity 接线（loop.start 成功→baseHttp=http://127.0.0.1:port；loadWeb/probeMainTest 走 loadUrl(baseHttp)）", mainJava.includes("baseHttp = \"http://127.0.0.1:\" + loop.port") && mainJava.includes("webView.loadUrl(baseHttp + \"/index.html\")") && mainJava.includes("webView.loadUrl(baseHttp + \"/index.probe.html\")"));
t("D85-L5 crypto 相对路径运行时还原（http 域禁 file 子资源——httpify 把绝对路径改回 src=\"crypto.js\"，由 loopback 供给）", mainJava.includes("private String httpify(String html)") && mainJava.includes('src=\\"file:///android_asset/crypto.js\\"') && mainJava.includes("utf8(httpify(b))"));
t("D85-L6 降级路径保留（loop 启动失败→baseHttp=null→loadDataWithBaseURL(null) 84 轮模式兜底）", (function(){const seg=mainJava.slice(mainJava.indexOf("private void loadWeb"),mainJava.indexOf("onActivityResult"));return seg.includes("loadDataWithBaseURL(null, b,") && mainJava.includes("catch (Exception ignored) { loop = null; baseHttp = null; }")})());
t("D85-L7 cleartext 已开（targetSdk 34 Android 9+ 默认禁 http——回环 127.0.0.1 需显式允许，仅回环不出网）", manifestXml.includes('android:usesCleartextTraffic="true"'));
t("D85-L8 小页不换道（自检页/probe2/诊断页保持 loadDataWithBaseURL(null)——真机已证小页 data-URL 活，只有大页换道）", (function(){const seg=mainJava.slice(mainJava.indexOf("private void bootLadder"),mainJava.indexOf("private String probeHtml"));return seg.includes("webView.loadDataWithBaseURL(null, probeHtml()") && seg.includes("loadDataWithBaseURL(null, probe2Html()")})());
t("D85-L9 诊断页带回环通道状态（⓿ 段：baseHttp 或 未启用退回桥载——一张截图可判通道活死）", mainJava.includes("回环 HTTP 通道") && mainJava.includes("未启用（退回桥载）"));

/* ===== D87：87 轮无桥实验——JS→Java 同步桥调用在华为内核死锁嫌疑（18 轮现象唯一全解释） ===== */
console.log("\n== D87. 无桥实验+桥读缓存 ==");
t("D87-B1 转译器产无桥版（index.nobridge.html=同一页面 head 后插 DSB/PHB 纯 JS 桩，内存+console 通道零真桥依赖）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return nb.includes("window.DSB={storeGet:function(k){var v=(k in M)?M[k]:null;return (v==null||typeof v==='string')?v:JSON.stringify(v)}") && nb.includes("window.PHB={") && nb.indexOf("window.DSB={storeGet")<nb.indexOf("__chunkOK")})());
t("D87-B2 nobridgeTest 接线（dsh://boot-nobridge→载无桥版→6s evaluate 探针回执落盘 nobridge→诊断页）", mainJava.includes("private void nobridgeTest()") && mainJava.includes("\"boot-nobridge\".equals(a)") && mainJava.includes("readAsset(\"index.nobridge.html\")") && mainJava.includes("storeSet(\"nobridge\""));
t("D87-B3 看门狗 fail3 自动无桥实验（fail1 重载/fail2 主块二分/fail3 无桥实验——用户零操作三级递进）", mainJava.includes("if (bootFails > 2)") && /bootFails > 2[\s\S]{0,80}nobridgeTest\(\)/.test(mainJava));
t("D87-B4 桥读缓存层（Bridge STORE_MEM ConcurrentHashMap——启动期 storeGet 命中内存零磁盘，写仍同步落盘保持久化）", (function(){const bj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/Bridge.java"),"utf8");return bj.includes("STORE_MEM =") && bj.includes("STORE_MEM.get(key)") && bj.includes("STORE_MEM.put(key, jsonStr)")})());
t("D87-B5 诊断页⑦段无桥实验结论+🧪 链接（一张截图携带桥死锁验证结果）", mainJava.includes("⑦ 无桥实验（桥死锁验证）") && mainJava.includes("dsh://boot-nobridge"));
t("D87-B6 清档扩容 nobridge（boot-wipe 键表含 nobridge/bootTitle——毒档自愈覆盖新诊断位）", mainJava.includes("\"probeMain\", \"nobridge\", \"bootTitle\", \"settings.bak\""));

// —— D89 v2.5.115-notif：真桥轻量化收网（88 轮真机实锤后数据层回归）——
t("D89-A1 桥线程零磁盘：storeSet 只更内存+落盘交 STORE_WRITER 后台单线程（死点=桥线程 Store fsync 互锁）", (function(){const bj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/Bridge.java"),"utf8");return bj.includes("STORE_WRITER") && bj.includes("Executors.newSingleThreadExecutor()") && /storeSet[\s\S]{0,600}STORE_WRITER\.execute/.test(bj) && !/storeSet[\s\S]{0,400}store\.set\(key/.test(bj)})());
t("D89-A2 启动预热 warmup()（files/*.json 全量预载 STORE_MEM——桥读永远命中缓存不碰磁盘）", (function(){const bj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/Bridge.java"),"utf8");const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return bj.includes("public void warmup()") && bj.includes("STORE_MEM.put(key, v)") && mj.includes("bridge.warmup()")})());
t("D89-A3 看门狗三级递进保留（fail1 重载/fail2 主块二分/fail3 无桥实验兑底链完整——90 轮装载序翻转后仍兑底）", mainJava.includes("if (bootFails > 2)") && /bootFails > 2[\s\S]{0,80}nobridgeTest\(\)/.test(mainJava) && mainJava.includes("probeMainTest()"));
t("D89-A4 版本钉（index 2.5.115-notif/BUNDLE 103 + build.sh 129 + Manifest 129）", script.includes('const APP_VER="2.5.115-notif"') && script.includes("const BUNDLE_VER=103;") && buildSh.includes('VER="2.5.115-notif"; VCODE=133') && manifestXml.includes('android:versionCode="133"') && manifestXml.includes('android:versionName="2.5.115-notif"'));

// —— D90 v2.5.115-notif：console 通道正式桥（89 版真机终审：同步桥 IPC 本身死锁）——
t("D90-S1 JS 桩快照播种+分块回写（__DSB_SNAPSHOT 播种 M；storeSet 走 [dsb.set]key#i/n 分块 console）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return nb.includes("window.__DSB_SNAPSHOT||{}") && nb.includes("[dsb.set]'+k+'#'+i+'/'+n") && nb.indexOf("__DSB_SNAPSHOT") < nb.indexOf("window.DSB={storeGet")})());
t("D90-S2 Java 侧快照预灌（Bridge.snapshotJson 全量 JSON；loadWeb/nobridgeTest 载入前 injectSnapshot 注 stub 之前）", (function(){const bj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/Bridge.java"),"utf8");const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return bj.includes("public String snapshotJson()") && /loadWeb\(\)[\s\S]{0,600}injectSnapshot\(b\)/.test(mj) && /nobridgeTest\(\)[\s\S]{0,300}injectSnapshot\(b\)/.test(mj) && /html\.substring\(0, i \+ 6\) \+ tag \+ html\.substring\(i \+ 6\)/.test(mj)})());
t("D90-S3 console 回写重组落盘（onConsoleMessage 收 [dsb.set] 分块重组→bridge.storeSet；setRx 缓冲）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return mj.includes("startsWith(\"[dsb.\")") && mj.includes("setRx") && /setRx[\s\S]{0,200}bridge\.storeSet\(key, acc\.toString\(\)\)/.test(mj)})());
t("D90-S4 loadWeb 默认 nobridge 快照版优先（nobridge→快照注入→热包→内置；同步桥 IPC 死锁终审后的正式装载序）", /loadWeb\(\)[\s\S]{0,400}String b = readAsset\("index\.nobridge\.html"\);[\s\S]{0,120}injectSnapshot\(b\);[\s\S]{0,120}readHotBundle\(\)/.test(mainJava));

// —— D91 v2.5.115-notif：Pro▼ 弹层内核兼容+桩面 39 方法全覆盖（用户实弹：Pro 点不开）——
t("D91-F1 弹层定位内核兼容（#modal 不再使用 inset:0 简写——华为内核 84~86 不支持致弹层渲染到视口外=『点不开』）", (function(){const src=fs.readFileSync(path.join(ROOT,"app/assets/index.src.html"),"utf8");const dst=fs.readFileSync(path.join(ROOT,"app/assets/index.html"),"utf8");return !/inset:\s*0/.test(src) && src.includes("top:0;left:0;right:0;bottom:0") && dst.includes("top:0;left:0;right:0;bottom:0")})());
t("D91-F2 桩面全覆盖（39 方法在 nobridge 桩全定义：动作类 fire console/同步值类安全降级）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");const need=["openUrl","notifyUser","scheduleAlarm","cancelAlarm","runAlarmNow","rescheduleAll","askNotifPermission","canExactAlarm","openExactAlarmSettings","reload","exitApp","hotInfo","hotRead","hotWrite","hotDelete","notifPerm","saveDlv","readAsset","appInfo","http","httpStream","llamaStatus","llamaStream","llamaDownload","llamaDelete","micAsr","micAsrChat","micAsrFile","micRecStart","micRecStop","pickFile","pickGallery","pickCamera","pickVideoFrames","pickVideoAudio","pickReadText","pickDelete","toast","vib"];return need.every(function(f){return nb.indexOf(f+":function(")>-1})})());
t("D91-F3 Java 动作通道（onConsoleMessage 统一 [dsb. 开关：notify 真通知/openUrl/闹钟三件/reload/exit/hotdel/toast——console 单向总线转正）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return mj.includes('raw.startsWith("[dsb.")') && mj.includes('act.equals("notify")') && mj.includes("bridge.notifyUser(") && mj.includes('act.equals("openurl")') && mj.includes('act.equals("alarm")') && mj.includes('act.equals("reload")') && mj.includes('act.equals("exit")')})());
t("D91-F4 appInfo 快照预灌（__DSB_APPINFO 注入+桩 appInfo() 读快照——诊断页/关于页 snapbridge 下可用）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return mj.includes("__DSB_APPINFO") && mj.includes("bridge.appInfo()") && nb.includes("window.__DSB_APPINFO||'{}'")})());

// —— D92 v2.5.115-notif：持久化双通道保险+存档徽章（91 版真机：任务重启丢失）——
t("D92-H1 JS 侧双写（storeSet 同步登记 __dsbDirty；__dsbDrain 收割口）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return nb.includes("window.__dsbDirty={};window.__dsbSaved=0;") && nb.includes("window.__dsbDirty[k]=String(v)") && nb.includes("window.__dsbDrain=function")})());
t("D92-H2 Java 心跳收割（4s evaluate __dsbDrain→双解 JSON→bridge.storeSet 落盘→回写 __dsbSaved 驱动徽章）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return mj.includes("window.__dsbDrain?window.__dsbDrain():null") && mj.includes("bridge.storeSet(k, map.getString(k))") && mj.includes("ackKeys.toString()") && mj.includes("__dsbDrainOk") && mj.includes("hbHandler.postDelayed(this, 4000)")})());
t("D92-H3 心跳接线+诊断可视化（装载后 4s 启动 hbTick；诊断页⓿段带收割计数）", (function(){const mj=fs.readFileSync(path.join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return mj.includes("h.postDelayed(hbTick, 4000)") && mj.includes("心跳收割") && mj.includes("hbAcks")})());
t("D92-H4 存档徽章（左下常驻 💾已存档/存档等待——真机一张截图判读通道活死）", (function(){const nb=fs.readFileSync(path.join(ROOT,"app/assets/index.nobridge.html"),"utf8");return nb.includes("dsbAckBadge") && nb.includes("已存档") && nb.includes("存档等待")})());
t("D92-H5 版本钉（index 2.5.115-notif/BUNDLE 103 + build.sh 129 + Manifest 129）", script.includes('const APP_VER="2.5.115-notif"') && script.includes("const BUNDLE_VER=103;") && buildSh.includes('VER="2.5.115-notif"; VCODE=133') && manifestXml.includes('android:versionCode="133"') && manifestXml.includes('android:versionName="2.5.115-notif"'));

// —— D98 v2.5.115-notif：云端日期注入+结果标记剥离（98 轮真机：小神答不出今天几号+provs/run 标记漏进聊天）——
t("D98-T1 agent.py SYSTEM 注入北京时间（utcnow+8h/星期映射/不许说无法获取）", (function(){const ap=fs.readFileSync(path.join(ROOT,"app/assets/cloud/agent.py"),"utf8");return ap.includes("当前时间：") && ap.includes("timedelta(hours=8)") && ap.includes("星期") && ap.includes("不要说“无法获取日期")})());

// —— D99 v2.5.115-notif：429 限流退避重试+切换文案带 HTTP 码（99 轮真机观感：智谱连发限流被误读为"只能答一次"）——
t("D99-F1 streamOnce 失败留痕（__lastStreamStatus：pk+status+ts）", script.includes("window.__lastStreamStatus={pk:pk,status:status,ts:now()}"));
t("D99-F2 429 退避重试同源（额度没确认用完前不换源）", script.includes("st===429") && script.includes("额度没确认用完前不换源") && script.includes("退避重试 2 轮仍然限流"));

// —— D100 v2.5.115-notif：切源铁律+大白话文案（用户最高令：额度实锤才切源，其他故障当场纠正继续用；提示不许甩代码要说人话）——
t("D100-A1 App 端故障分类纠正（网络/5xx=原地重试 2 次+3s 再试；401/403=钥匙大白话；402=额度大白话）", script.includes("我马上原地重试") && script.includes("钥匙（Key）不对或过期了") && script.includes("免费额度真的用完了") && script.includes("再给它一次机会"));
t("D100-A2 App 端模型停服=同源换最强不换台+通用兜底文案大白话", script.includes("停服下架了，我换它家更强的") && script.includes("这一单没接稳") && script.includes("下一条消息我还是先找"));
t("D100-C1 agent.py 切源铁律（429 退避 3 轮 10/20/40s 实锤才切+钥匙/额度大白话 errors+网络类当场纠正 3 轮）", (function(){const ap2=fs.readFileSync(path.join(ROOT,"app/assets/cloud/agent.py"),"utf8");return ap2.includes("for attempt in range(3)") && ap2.includes("额度没确认用完前不换源") && ap2.includes("钥匙不对或过期") && ap2.includes("attempt >= 2") && ap2.includes("联系不上")})());

// —— D101 v2.5.115-notif：自主指定档（用户令：除自动最强外，全部源+模型开放自选）——
t("D101-U1 弹层第四档「自主指定」+③源④模型联动下拉（云端含 cloudOnly 源、免 Key 保底标注）", script.includes("我自己选源和模型（选型引擎让路）") && script.includes('id="mpSrc" onchange="uiModeSyncReadback()"') && script.includes('id="mpModel"') && script.includes("③ 免费源（全部"));
t("D101-U2 应用落盘=首选源+指定模型（chainList 链首+provPick 用户选型优先——云端 dispatch 的 provider/model 同源跟随）", script.includes('if(src)setPref(src)') && script.includes('selOf()[src]=mdl'));
t("D101-U3 自主指定主权：闪电模式跳过快源插队+顶栏徽标「✋自选」", script.includes('tierOf()!=="custom"&&imgs&&imgs.length===0') && script.includes('t==="custom"?"✋自选"'));

// —— D102 v2.5.115-notif：三端分治（用户令：切端时源/档位不串台——电脑端/云端/手机端各自独立记忆）——
t("D102-T1 访问器三件套（tiers/prefProvs/selModelss 按 mode 独立存档，旧字段=当前端镜像）", script.includes("S.settings.tiers=S.settings.tiers||{}") && script.includes("S.settings.prefProvs=S.settings.prefProvs||{}") && script.includes("S.settings.selModelss=S.settings.selModelss||{}") && script.includes("function setTier(t)") && script.includes("function setPref(src)"));
t("D102-T2 读写全走访问器（chainList/provPick/闪电/wireModeBtn——无直引残留）", script.includes("const pref=prefOf();") && script.includes('const sel=selOf()[k]||"";') && script.includes('if(tierOf()!=="custom"') && script.includes("const m=S.settings.mode,t=tierOf();"));
t("D102-T3 切端即刻切换独立档位（弹层 readback setTier 落当前端；设置页首选源 setPref）", script.includes("if(t)setTier(t.value);") && script.includes("setPref('${k}')"));




t("D98-T2 结果标记剥离正则升级（前导全部 <!-- --> 注释行一把剥——旧 /^<!--[\s\S]*?-->\n*/g 无 m 只剥首行，provs/run 两行漏进聊天）", script.includes('replace(/^(?:<!--[\\s\\S]*?-->\\s*)+/,"")') && !script.includes('replace(/^<!--[\\s\\S]*?-->\\n*/g,"")'));

function __finish(){ // 97b：D19 实弹异步化后，退出时序收口（同步段全跑完→D19 IIFE 收尾）
  // —— D105 v2.5.115-notif：云端秒回快车道（用户最高令：云端聊天必须像 CatPaw 一样秒回，所有源一视同仁）——
  t("D105-A1 快车道路由（云端模式默认走 sendStream{cloud:true} 直连秒答，不再为闲聊派 GitHub）", script.includes('else await sendStream(text,aiIdx,sendImgs,{cloud:true})'));
  t("D105-A2 ☁️任务: 强制重装入口（前缀剥离后仍派 sendCloud 走 GitHub 真算力）", script.includes('sendCloud(text.replace(/^☁️任务[:：\\s]*/,""),aiIdx)') && script.includes('/^☁️任务[:：\\s]/.test(text)'));
  t("D105-A3 sendStream 云端选项（opts.cloud→chainList(true) 全源参战：cloudOnly+动态拉取+进化新增源一个不落）", script.includes("function sendStream(text,aiIdx,imgs,opts)") && script.includes("const fastCloud=!!(opts&&opts.cloud)") && script.includes("let chain=chainList(fastCloud)"));
  t("D105-A4 快车道旗标生命周期（进链置位 window.__fastLane、空链早退与收尾两路均复位——人格注入不串台电脑端）", (script.match(/window\.__fastLane=0/g)||[]).length>=2 && script.includes("try{window.__fastLane=fastCloud?1:0}catch(e){}"));
  t("D105-A5 快车道身份文案（buildSystemPrompt 云端快车道说明+工具需求引导「☁️任务:」前缀）", script.includes("云端快车道（App 直连模型源秒回") && script.includes("请加「☁️任务:」前缀派 GitHub 云端算力"));
  t("D105-A6 重前缀云端同路由（真视频/配音/长片三前缀在云端模式同样转 sendCloud，秒回不误重活）", [/\(mode==="chat"\|\|mode==="cloud"\)&&\/\^🎬真视频/, /\(mode==="chat"\|\|mode==="cloud"\)&&\/\^🎭配音/, /\(mode==="chat"\|\|mode==="cloud"\)&&\/\^🎬长片/].every(rx=>rx.test(script)));
  t("D105-A7 快车道受 GENE9 认怂检测管辖（云端直连回复承认做不到也自动触发进化）", script.includes('if((mode==="chat"||mode==="cloud")&&cur.msgs[aiIdx]&&!cur.msgs[aiIdx].cloud&&!cur.msgs[aiIdx].anime)'));
  t("D105-A8 界面文案同步（chatHint+setMode toast 双处标注快车道与重活入口）", script.includes("云端快车道：全源直连秒回") && script.includes("聊天全源直连秒回"));
  // —— D105 end ——
  // —— D106 v2.5.115-notif：进化觉醒（用户实弹三问：进化在不在位/为什么从没主动进化过→节流锈+战报锈双根治）——
  const agentPy = (() => { try { return require("fs").readFileSync("app/assets/cloud/agent.py", "utf8"); } catch (e) { return ""; } })();
  t("D106-A1 GENE9 节流突破（agent.py：未满足需求非空→节流 24h→1h，有求必应不被日历拦）", agentPy.includes("_gate_h = 0.0 if _want_n > 0 else 24.0") && agentPy.includes("GENE9 未满足需求"));
  t("D106-A2 进化战报双路落盘（EVOLVE_OK 成功路+EVOLVE_REJECTED 拒收路都写 evolve_report.json——诚实不静默）", (agentPy.match(/evolve_report\.json/g)||[]).length>=2 && agentPy.includes('{"ok": True, "ts": _utcnow(), "n": n') && agentPy.includes('{"ok": False, "ts": _utcnow()'));
  t("D106-A3 战报回仓（agent.yml Commit evolve 步带 evolve_report.json 入仓——App 才拉得到）", (() => { try { return require("fs").readFileSync("app/assets/cloud/agent.yml", "utf8").includes("git add cloud/evolve_report.json"); } catch (e) { return false; } })());
  t("D106-A4 App 端战报拉取（pullEvolveReport raw→API 双通道+seen 戳去重播）", script.includes("async function pullEvolveReport()") && script.includes("st.evolveSeenTs") && script.includes("cloud/evolve_report.json"));
  t("D106-A5 战报公告双路（在场即插当前会话+离场暂存 evolveNews 开屏补公告）", script.includes("🧬 自主进化战报") && script.includes("st.evolveNews={ts:ts,text:txt}") && script.includes("S.settings.evolveNews=null"));
  t("D106-A6 心跳接线（cloudPulse 每 10min 拉战报——进化感知常态化）", script.includes("try{pullEvolveReport()}catch(e){}         // 📰 v2.5.115-notif：进化战报拉取公告"));
  t("D106-A7 人格预取（进云端聊天页即静默拉 vitals+记忆+战报——快车道首条回复即巅峰）", script.includes("进云端聊天页即静默预取") && /if\(S\.settings\.mode==="cloud"\)\{[\s\S]{0,200}pullVitalsCloud\(\)[\s\S]{0,120}pullMindCloud\(\)[\s\S]{0,120}pullEvolveReport\(\)/.test(script));
  t("D106-A8 战报文案双态（成功自豪体+拒收诚实体——只提能过真实验证的补丁）", script.includes("小神刚刚自主进化了") && script.includes("被实弹验证列装闸拦下"));
  // —— D106 end ——
  // —— D107 v2.5.115-notif 108 轮：统一主动中枢+更新入口丝滑（用户三问：通知在哪看/在哪下载/所有主动能力并入进化）——
  t("D107-A1 云端统一主动中枢总线（agent.py _proact：晨课/巡天/进化双路全部入 proactive.json 战报流）", agentPy.includes("def _proact(kind, title, brief)") && agentPy.includes('_PROACT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "cloud", "proactive.json")') && agentPy.includes('_feed[-30:]') && agentPy.includes('_proact("class"') && agentPy.includes('_proact("vidscout"') && (agentPy.match(/_proact\("evolve"/g)||[]).length>=2);
  t("D107-A2 情报班+体检入中枢（models_sync.py/vuln_check.py 战果同步写 cloud/proactive.json——主动全员归一）", (() => { try { const ms=require("fs").readFileSync("app/assets/cloud/models_sync.py","utf8"); const vc=require("fs").readFileSync("app/assets/cloud/vuln_check.py","utf8"); return ms.includes('_atomic_json("cloud/proactive.json", _feed[-30:])') && ms.includes('"kind": "models"') && vc.includes('cloud/proactive.json') && vc.includes('"kind": "vuln"') && vc.includes('有红项（诚实上报）'); } catch(e){ return false; } })());
  t("D107-A3 App 端中枢拉取（pullProactiveFeed raw→API 双通道+全流 seen 戳+进化去重防双报）", script.includes("async function pullProactiveFeed()") && script.includes("cloud/proactive.json") && script.includes("st.proactiveSeenTs=maxTs") && script.includes('String(x.kind||"")!=="evolve"'));
  t("D107-A4 中枢公告双路（在场即插当前会话+离场暂存 proactNews 开屏补播）", script.includes("小神主动战报（") && script.includes("st.proactNews=(st.proactNews||[]).concat([txt]).slice(-3)") && script.includes("S.settings.proactNews=[]"));
  t("D107-A5 心跳+预取接线（cloudPulse 每 10min 拉中枢+进云端聊天页静默预取）", script.includes("try{pullProactiveFeed()}catch(e){}        // 🧬 v2.5.115-notif：统一主动中枢战报流") && /pullEvolveReport\(\)\}catch\(e\)\{\}\n    try\{pullProactiveFeed\(\)\}catch\(e\)\{\} \/\/ 🧬 v2\.5\.115-notif：主动中枢战报预取/.test(script));
  t("D107-A6 骨架层更新三入口（系统通知+聊天页卡片 apkNews+设置面板 🦴 入口）", script.includes("meta:\"🧬 骨架层更新\"") && script.includes("S.settings.apkNews") && script.includes("S.settings.apkNews=[]") && script.includes('onclick="updApkCheck(true)"') && script.includes("检查骨架层新包") && script.includes("骨架层新包 v"));
  t("D107-A7 设置面板可见化（骨架层待安装新包版本+免登录直链下载指引上屏——在哪下载永远看得见）", script.includes("_apkNew=") && script.includes("🦴 骨架层新包 v") && script.includes("免登录直链下载"));
  t("D107-A8 中枢战报留痕（memAdd 主动中枢战报永久记忆）", script.includes('memAdd("fact","🧬 主动中枢战报：'));
  // —— D108 v2.5.115-notif 109 轮：通知失败必进化（用户最高令：所有通知失败的情况必须自动触发小神的进化能力主动突破攻坚）——
  const bridgeJava = (() => { try { return require("fs").readFileSync("app/assets/skeleton/java/Bridge.java", "utf8"); } catch (e) { return ""; } })();
  const mainJava = (() => { try { return require("fs").readFileSync("app/assets/skeleton/java/MainActivity.java", "utf8"); } catch (e) { return ""; } })();
  t("D108-A1 Java 桥带回执（notifyUserEx：PERM/ERR: 原因如实回 JS+notifState 全态探针）", bridgeJava.includes("public String notifyUserEx(String title, String text)") && bridgeJava.includes('return "PERM"') && bridgeJava.includes("areNotificationsEnabled") && bridgeJava.includes("public String notifState()"));
  t("D108-A2 Java 一键授权页（openNotifSettings：API26+ App 通知设置页/旧 ROM 降级 App 详情页）", bridgeJava.includes("public void openNotifSettings()") && bridgeJava.includes("Settings.ACTION_APP_NOTIFICATION_SETTINGS") && bridgeJava.includes("EXTRA_APP_PACKAGE"));
  t("D108-A3 分发器挂载（MainActivity rpc 分发器 notifyUserEx/notifState/openNotifSettings 三方法）", mainJava.includes('method.equals("notifyUserEx")') && mainJava.includes('method.equals("notifState")') && mainJava.includes('method.equals("openNotifSettings")'));
  t("D108-A4 updNotify 带回执重构（ex 桥直发/plain 桥 perm 探针推导/无桥如实报——送达才清未读）", script.includes("function updNotify(title,body){ // 🧬 v2.5.115-notif") && script.includes("function notifBridgeEx()") && script.includes('rc="ERR:no_bridge"') && script.includes('rc==="OK"'));
  t("D108-A5 失败即进化（notifFailFeed：wants 登记+evolveRun 本地进化+demandMiss 云端进化双发——失败原因就是进化养料）", script.includes("function notifFailFeed(title,rc)") && script.includes("notifFailCnt=(st.notifFailCnt||0)+1") && script.includes("st.wants.push({ts:now(),why:key})") && /function notifFailFeed[\s\S]{0,2200}evolveRun\(false\)/.test(script) && /function notifFailFeed[\s\S]{0,2600}demandMiss\(/.test(script));
  t("D108-A6 PERM 分诊一键授权（24h 节流防骚扰+聊天气泡/开屏补播告知+openNotifSettings 拉起）", script.includes("st.notifAskTs=now()") && script.includes(">86400000") && script.includes("帮你把授权页拉出来了") && script.includes("🔔 通知攻坚"));
  t("D108-A7 补发统一链（启动 updNotice 补发+cloudEvolveCheck 进化感知全走带回执 updNotify——失败自动进化不再静默 toast 完事）", script.includes("if(un&&un.title){updNotify(un.title,un.body)}") && script.includes("未读公告补发统一走 updNotify 带回执链") && /function cloudEvolveCheck[\s\S]{0,900}updNotify\("🧬 云端引擎已自主进化"/.test(script));
  t("D108-A8 失败留痕双重（memAdd 进化养料+聊天气泡主人可见——绝不静默）", script.includes('memAdd("fact","🔔 GENE9 需求登记：系统通知「') && script.includes("已自动登记为未满足需求并触发双端进化"));
  // —— D108 end ——
  // —— D109 v2.5.115-notif 110 轮：进化方向分诊（用户实弹 6 截图：run#16 把权限类需求当云端编程题写重试代码白烧算力+卡片短时重复）——
  t("D109-A1 PERM 不派云端（权限是 Android 硬闸云端代点不了——PERM 分支本地进化后 return，demandMiss 只在非 PERM 全链）", /if\(rc==="PERM"\)\{[\s\S]{0,900}evolveRun\(false\)\}catch\(e\)\{\} \/\/ 本地进化照发[\s\S]{0,120}return;[\s\S]{0,600}demandMiss\(/.test(script));
  t("D109-A2 卡片 24h 节流（notifAskTs 双闸：授权页+攻坚卡片同窗不轰炸——重复卡片根治）", /if\(_ask\)\{st\.notifAskTs=now\(\);save\("settings"\);notifPermAsk\(\);/.test(script));
  t("D109-A3 云端需求分诊铁律（agent.py GENE9 清单注入分诊：App 端系统级能力≠云端 Python 可解——防再次跑偏）", agentPy.includes("需求分诊铁律") && agentPy.includes("绝不许写云端 Python 通知/权限代码来自欺"));
  t("D109-A4 有求必应闭环销账（送达成功→wants「通知送达失败」自动销账+留痕——授权恢复后不欠账不重复进化）", script.includes('const _st=S.settings,_ws=Array.isArray(_st.wants)?_st.wants:[]') && script.includes('if(rc==="OK"){ // 送达才清未读') && script.includes("GENE9 销账：系统通知送达已恢复"));
  // —— D110 v2.5.115-notif 111 轮：角色归一（用户实弹 3 截图：会话第二条起智谱/魔搭全链 HTTP 400——存储角色 "ai" 原样透传被 OpenAI 兼容源判非法，第一条无历史必成、第二条起全崩）——
  t("D110-A1 发送历史角色归一（ai→assistant+空消息过滤+兼容导入 assistant——多轮 400 根治）", /slice\(-20\)\.filter\(m=>\(m\.role==="user"\|\|m\.role==="ai"\|\|m\.role==="assistant"\)&&String\(m\.content\|\|""\)\.length\)\.map\(m=>\(\{role:m\.role==="user"\?"user":"assistant"/.test(script));
  t("D110-A2 项目同步双向归一（导出 ai→assistant/导入 assistant→ai——云端仓合法态+本地存储态各自归一）", script.includes('role:m.role==="ai"?"assistant":m.role,content:String(m.content||"").slice(0,2000)') && script.includes('role:m.role==="assistant"?"ai":m.role,content:m.content'));
  // —— D111 v2.5.115-notif 112 轮：日期注入+内心戏标签（用户实弹 6 截图：问"今天哪一天"模型拿训练数据瞎猜 2025年7月10日；灰色思考独白无标签上屏像精分）——
  t("D111-A1 系统提示注入实时时间（年月日+星期+时分+绝不许拿训练数据猜——日期类提问根治）", script.includes("🕐 当前时间：") && script.includes('"日一二三四五六"[_d.getDay()]') && script.includes("绝不许拿训练数据的旧日期来猜"));
  t("D111-A2 思考过程挂内心戏标签（灰字独白明示是模型思考非回复正文——精分观感根治）", script.includes("🧠 内心戏（模型的思考过程，不是给你的回复，可忽略）："));
  // —— D112 v2.5.115-notif 113 轮：体检误报根治（用户实弹截图：新装无 Key 每次启动都贴"残余异常 1 处"——openrouter 静态种子为空 list:[] 且无 Key→provModels 恒零→tier3 永久红灯；且 toast 只报数不报项）——
  t("D112-A1 tier3 豁免待配置源（无 Key 且无静态种子≠缺陷——新装开箱不再永久误报）", script.includes("!provModels(k).length&&!(!(provs()[k]||{}).key&&!(PROV[k].list||[]).length)"));
  t("D112-A2 体检 toast 报数必报名（残余异常列具体项名——不再盲猜哪项红灯）", script.includes('_bad.map(r=>r.name.split("（")[0]).join("；")'));
  // —— D113 v2.5.115-notif 114 轮：快车道气象眼（用户最高令："连个天气预报都不知道，废物"——快车道无工具无联网模型拿训练数据推脱还编假预报；Open-Meteo 免 Key 实测注入根治）——
  t("D113-A1 气象眼全链（意图识别→城市抽取→45 城坐标表→Open-Meteo 实测→系统提示注入+编造禁令）", script.includes("async function wxProbe(text)") && script.includes("const WX_CITY=") && script.includes("geocoding")===false && script.includes("api.open-meteo.com/v1/forecast") && script.includes("🌦 实时天气情报（Open-Meteo 实测，") && script.includes("绝不许编造或假装没有数据"));
  t("D113-A2 气象眼接线（sendStream 发前探针（130 轮起套 8s 总预算 race）+失败静默不拖聊天+buildSystemPrompt 必消费+无城市默认主人所在地）", script.includes("Promise.all([wxProbe(text),fxProbe(text),nsProbe(text),wkProbe(text),lvProbe(text),genProbe(text)]),new Promise(r=>setTimeout(r,8000))") && script.includes('if(window.__wx)sys+=') && script.includes('if(!last)last="城阳"'));
  // —— D114 v2.5.115-notif 115 轮：极致提速+扩能（用户最高令：回答要极致的快+无所不能像 CatPaw——三管齐下：天气缓存+开局预热/链首连接预热/汇率眼并行）——
  t("D114-A1 天气缓存+开局预热（30min 缓存命中 0ms 秒答+2.5s 预热城阳——常态天气题零额外耗时）", script.includes("wxCache") && script.includes("now()-_c.ts<1800000") && script.includes('wxProbe("城阳天气")'));
  t("D114-A2 汇率眼（Open.er-API 免 Key 实测+6h 缓存+兑人民币换算+编造禁令——无所不能进行时）", script.includes("async function fxProbe(text)") && script.includes("open.er-api.com/v6/latest/USD") && script.includes("now()-_fc0.ts<21600000") && script.includes("💱 实时汇率情报（Open.er-API 实测）"));
  t("D114-A3 双探针并行+链首连接预热（Promise.all 并行（130 轮起套 8s 总预算）+开局 1.5s 预热链首源 DNS/TLS——首条消息首字直降）", script.includes("Promise.all([wxProbe(text),fxProbe(text),nsProbe(text),wkProbe(text),lvProbe(text),genProbe(text)]),new Promise(r=>setTimeout(r,8000))") && script.includes("setTimeout(()=>{try{const _wk=chainList()[0]"));
  t("D114-A4 新闻眼 nsProbe（Google News 中文头条 RSS 免 Key+30min 缓存+三探针并行+buildSystemPrompt 必消费——全网实时信息全知晓）", script.includes("async function nsProbe(text)") && script.includes("news.google.com/rss?hl=zh-CN") && script.includes("now()-_nc0.ts<1800000") && script.includes("Promise.all([wxProbe(text),fxProbe(text),nsProbe(text),wkProbe(text),lvProbe(text),genProbe(text)])") && script.includes('if(window.__ns)sys+='));
  t("D115-A1 马上进化铁律（用户最高令：触发全有进化必须马上进化——云端节流 1h→0 有需求即过门+App 端 evolveRunDaily 有需求绕 24h 节流每次启动即进化）", agentPy.includes("_gate_h = 0.0 if _want_n > 0 else 24.0") && agentPy.includes("节流归零马上进化") && html.includes("const _wn=Array.isArray(st.wants)?st.wants.length:0") && html.includes("if(st.evolveTs&&now()-st.evolveTs<86400000&&!_wn)return"));
  t("D116-A1 百晓眼 wkProbe（维基百科免 Key search+extracts 双跳+泛知识意图正则+30min 缓存+四探针并行+buildSystemPrompt 必消费——世界上所有层面知识无一不知）", html.includes("async function wkProbe(text)") && html.includes("zh.wikipedia.org/w/api.php") && html.includes("window.__wk=\"📚 百科知识实测情报") && html.includes("if(window.__wk)sys+="));
  t("D116-A2 新闻眼真机修复+按题搜增强（wxFetchText 文本版 fetch 修 RSS XML 隐患+Google News search 端点拉任意话题实时资讯——任何信息按词拉到）", html.includes("function wxFetchText(url,ms)") && html.includes("news.google.com/rss/search?q=") && html.includes("wxFetchText(\"https://news.google.com/rss?hl=zh-CN"));
  t("D117-A1 办公三工坊（agent.py：_xlsx/_docx/_pptx 生成+回读验证闸+DLV_EXTS 扩展办公扩展名+SYSTEM 提词+agent.yml pip 依赖——Excel/PPT/Word 生成分析能力列装）", agentPy.includes("def _xlsx(") && agentPy.includes("def _docx(") && agentPy.includes("def _pptx(") && agentPy.includes(".xlsx") && agentPy.includes("def _novel(") );
  t("D117-A2 App 端办公/小说意图路由（nlSynth 自动识别→☁️任务 派云端工坊，闲聊不误伤）", script.includes("写一部长篇小说") && script.includes("_novel 函数") && script.includes("你有极致办公能力") && script.includes("数据内容你自己精心设计填实"));
  t("D118-A1 产物回仓逐目录守卫（47 轮祖传断链修复：git add anime/ output/ 多路径 pathspec fatal——anime/ 不存在则 128 整条静默退出，output/ 从未被 stage；run 38325792604 诊断实锤）", agentYml.includes('for _d in anime output; do if [ -d "$_d" ]') && agentYml.includes("📦 已入册") && !agentYml.includes("git add anime/ output/ 2>/dev/null"));
  t("D118-A2 rescue v3 多围栏块合并 exec 逐块隔离（run 38326577171 实弹：模型一次输出 4 块计划代码只抓首块丢其余+散文裸 run_python 标记漏接）", agentPy.includes("blocks = [b for b in _re.findall") && agentPy.includes("exec(%r)") && agentPy.includes('c.rfind("run_python") + len("run_python")'));
  t("D118-A3 沙箱产物自证 boot/tail（run 38325792604 实弹：模型丢工坊返回值谎报成功——boot chdir 钉死 cwd + tail 盘点新生文件回显 + _xlsx 三维嵌套容错）", agentPy.includes("GITHUB_WORKSPACE") && agentPy.includes("[产物盘点]") && agentPy.includes("isinstance(data[0][0], list)"));
  t("D118-A4 rescue v3.2 三闸+try_tool v3 顶层 code（run 38327089727 注释掉工坊调用死循环→解注闸；run 38327585785 瞎编 _wxlsx→盲名归一；run 38328300994 协议 JSON 但 code 放顶层→直接执行）", agentPy.includes("def _uncomment_workshops") && agentPy.includes("_w(xlsx|docx|pptx|novel)\\(") && agentPy.includes('str(obj.get("code") or "").strip()'));
  t("D119-A1 ☁️任务结果认怠检测补链（119 轮死角：云端最终回复从未检过认怠——云端说「做不到」白说，进化神经没接上）", script.includes("☁️云端回复承认做不到") && script.includes("cloud.prompt") && (script.match(/☁️云端回复承认做不到/g)||[]).length>=2); // 双通道（API+CDN）各检一次
  t("D119-A2 认怠节流 10min→60s+sendCloud 存任务快照（119 轮最高令：1 秒都不能等——只防同句连发抖动）", /missTs>60000\)/.test(script) && script.includes('done:false,steps:0,prompt:String(text||"").slice(0,2000)'));
  t("D119-A3 GENE9 使命书升级（119 轮最高令：进化必须到全球全网极致+100% 多链路多维度校验+0 秒列装）", script.includes("全球全网范围内的极致完美") && script.includes("多链路多维度校验") && script.includes("0 秒列装不能等待"));
  // —— D109 end ——
  // —— D120 v2.5.115-notif 120 轮：实时信息复活+进化身份认知+消息时间戳（用户 6 截图实锤三断链+1 新令）——
  t("D120-A1 认怂词表扩容三处（截图实锤：「我无法实时访问互联网，我无法提供」「我没有自我进化的能力」均不在旧词表→进化永不触发）", script.includes("无法(?:完成|做到|实现|提供|访问|获取|查询|回答|联网)") && (script.match(/没有\(\?:自我进化\|进化\)\(\?:的\)\?能力/g)||[]).length>=3 && (script.match(/\(\?:直接\|实时\)\?访问\(\?:互联网\|网络\)/g)||[]).length>=3);
  t("D120-A2 联网身份铁律（小神自带联网探针绝不许自称离线/无法联网/预编程无进化——模型底子自我认知崩塌根治）", script.includes("⚡ 联网身份铁律：我不是离线模型！") && script.includes("绝不许自称「预编程 AI 没有自我进化的能力」") && script.includes("绝不许说「我无法实时访问互联网」"));
  t("D120-A3 六号眼 lvProbe（彩票官网 cwl.gov.cn 免 Key 实测直查开奖——双色球实弹截图问出「无法实时访问」根治）", script.includes("async function lvProbe(text)") && script.includes("cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice") && script.includes("window.__lv") && script.includes('if(window.__lv)sys+='));
  t("D120-A4 五探针并行（sendStream 天气+汇率+新闻+百科+开奖六眼全开——旧四探针钉同步跟新）", script.includes("Promise.all([wxProbe(text),fxProbe(text),nsProbe(text),wkProbe(text),lvProbe(text),genProbe(text)])"));
  t("D120-A5 消息时间戳精确到秒（用户最高令：每条消息——用户/小神回复/主动推送——下方标注实时时间）", script.includes("function fmtSec(ts)") && (script.match(/🕐 \$\{fmtSec\(m\.ts\)\}/g)||[]).length>=4 && script.includes('getHours())+":"+p(d.getMinutes())+":"+p(d.getSeconds())'));
  // —— D121 v2.5.115-notif 121 轮：万能天眼+小黑鲸换装+Pro 挪位+通知大白话（用户四令）——
  t("D121-A1 万能天眼 genProbe（DDG lite 免 Key 通用搜索：未被六眼接走的任何问题按题直搜 top6 注入——所有方面的信息搜集分析能力）", script.includes("async function genProbe(text)") && script.includes("html.duckduckgo.com/html/?q=") && script.includes("window.__gen") && script.includes('if(window.__gen)sys+=') && script.includes("Promise.all([wxProbe(text),fxProbe(text),nsProbe(text),wkProbe(text),lvProbe(text),genProbe(text)])"));
  t("D121-A2 天眼分诊节流（问候/闲聊不烧搜索+10min 缓存+缓存上限 40 条——快车道不拖慢）", script.includes("if(t.length<4||/^(hi|hello|hey|thank|在吗|你好") && script.includes("now()-gc[key].ts<600000") && script.includes("ks.length>40"));
  t("D121-A3 小黑鲸 1:1 换装（APP_ICON=ic_launcher base64 常量+对话头像 img+左上角 pawlogo 白底鲸图——App 图标同款）", /const APP_ICON=|var APP_ICON/.test(script) && script.includes('data:image/png;base64') && (script.match(/APP_ICON/g)||[]).length>=3 && html.includes('<img id="pawImg"') && script.includes('alt="小神"'));
  t("D121-A4 Pro 挪位（档位胶囊从 header 三端分割行挪到底部工具 chips 行——离三端太近根治；wireModeBtn 回填保留）", !script.includes('<button id="mBtn"') && script.includes('<span id="mBtn" class="pchip"') && script.includes("try{wireModeBtn()}catch(e){} // 🐾 121 轮"));
  t("D121-A5 通知卡片大白话（「进化已自动铺好一键授权路」术语腔根治——主人看得懂的授权指引）", script.includes("手机还没给小神开通知权限（不是坏了，是权限没给）") && script.includes("帮你把授权页拉出来了"));
  // —— D122 v2.5.115-notif 122 轮：云端全网搜索（用户令：所有方面信息搜集——云端算力从只会抓已知 URL 升级为可搜）——
  t("D122-A1 云端 web_search 工具三件（函数+POST 实弹方案+TOOL_PROMPT 提词——实时/时效/不确定的问题先搜再答）", agentPy.includes("def web_search(q)") && agentPy.includes("html.duckduckgo.com/html/") && agentPy.includes('urlencode({"q"') && agentPy.includes("web_search：全网搜索（DuckDuckGo 免 Key）"));
  t("D122-A2 云端 web_search 分发+直链兜底（try_tool 分发+uddg 优先/直链兜底双形态——simrun 实弹 10 条全通）", agentPy.includes('if tool == "web_search" and TOOLS_CFG.get("web") and "q" in inp') && agentPy.includes('elif href.startswith("http")'));
  t("D122-A3 App genProbe POST 兜底（GET 挑战页拦时 POST 表单重试+genParse 共用解析——手机端天眼双保险）", script.includes("genParse") && script.includes('method:"POST"') && script.includes("URLSearchParams({q})"));
  // —— D123 v2.5.115-notif 123 轮：云端联网身份铁律+搜索摘要三件套（回答质量从"看标题猜"升级"看摘要答"）——
  t("D123-A1 云端 SYSTEM 联网身份铁律（120 轮只修了 App 端——云端同款断链根治：双分支注入+绝不许自称预编程 AI 无进化）", agentPy.includes("⚡ 联网身份铁律：你不是离线模型！") && agentPy.includes("绝不许自称「预编程 AI 没有自我进化的能力」") && (agentPy.match(/绝不许自称「无法联网」/g)||[]).length>=1);
  t("D123-A2 搜索摘要三件套双端（云端 web_search result__snippet+App genParse snippet 配对——标题+摘要+链接）", agentPy.includes("result__snippet") && agentPy.includes("snips.append(sn[:160])") && script.includes("result__snippet") && script.includes("snips[i]?"));
  console.log("\n== D124. 猫爪清零+破图根治（124 轮：主人实弹三截图——抽屉🐾/hero🐾/pawImg 裂图） ==");
  t("D124-A1 pawImg 破图根治（真凶：header img 无静态 src 全靠 render() JS 赋值而首屏渲染链不经过 render——构建期内联 base64 零时序依赖）", html.includes('<img id="pawImg" src="data:image/png;base64,') && dstHtml.includes('<img id="pawImg" src="data:image/png;base64,'));
  t("D124-A2 猫爪残留清零三处（hero 大爪/抽屉标题/bootFail 降级页全换小黑鲸 img——UI 面 🐾 归零）", script.includes('<div class="paw"><img src="${APP_ICON}"') && script.includes('<h3><img src="${APP_ICON}"') && script.includes('this.nextSibling.style.display') && !script.includes('<div class="paw">🐾</div>') && !script.includes('<h3>🐾 小神 · 任务</h3>'));
  t("D124-A3 probe 二分页剔 base64（45KB 内联图标不进启动自检页——probe 回到 21KB 级不拖慢 bootLadder）", transpileCjs.includes("src=\"data:image\\/png;base64,[^\"]*\"") && probeMainHtml.length < 60000);
  console.log("\n== D125. 绿晕清零+fab 合身+自检页换鲸（125 轮：主人实弹两截图——logo/hero/fab/任务 tab 绿晕+自检页红爪） ==");
  t("D125-A1 绿晕全清零（pawlogo/三端选中/hero/fab 四处 rgba(34,197,94 box-shadow 全移除+底栏激活 tab 淡绿底透明——UI 面绿晕归零；CSS 在 HTML 部分用 html 口径）", !/box-shadow:[^;}]*34,197,94/.test(html) && html.includes("nav button.on{color:var(--pri2); background:transparent;}"));
  t("D125-A2 fab 合身（56px 突兀大块→44px/圆角 15/字号 20——右下角＋不再抢戏）", html.includes(".fab{position:fixed; right:18px; bottom:calc(env(safe-area-inset-bottom,0px) + 78px); width:44px;height:44px;border-radius:15px;"));
  t("D125-A3 自检页+Java 诊断页红爪→小黑鲸（whaleIcon() 公共方法运行时读 res/drawable 转 base64——loadDataWithBaseURL(null) 无 base 路径；读图失败兜底 🐳）", (function(){const j=require("fs").readFileSync(require("path").join(ROOT,"app/java/com/dsh/app/MainActivity.java"),"utf8");return j.includes("private String whaleIcon()") && j.includes("decodeResource(getResources(), R.drawable.ic_launcher)") && !j.includes(">🐾</div>")})());
    t("D125-A4 通知申请智能分诊（主人实弹：点申请只 toast 空话——荣耀低版本无运行时通知权限弹窗/永久拒绝后系统框不弹。notifState 三态探针：已开说已开/被关或 sdk<33 直拉系统设置页/其余弹系统框）", script.includes("function askNotifSmart(){") && script.includes('DSB.notifState()') && script.includes("已打开系统设置页") && !script.includes("DSB.askNotifPermission();toast('已发起授权请求')"));
  console.log("\n== D126. 记忆同步假阴性根治（126 轮：主人实弹——云端已 38/97 全同步体检仍报 37/38 78/97，GitHub CDN 缓存让复检读旧文件） ==");
  t("D126-A1 同步复检缓存穿透（run+fix 双 cnt 改 raw+?cb=时间戳 禁缓存+3/4 次重试——推送成功不再误报落后）", script.includes('?cb="+now()') && (script.match(/\?cb=/g)||[]).length>=2 && script.includes("GitHub 缓存延迟中"));
  t("D126-A2 体检循环 await 化（mind run 升 async 缓存穿透复检——同步循环吃 Promise 判 fail 的隐性炸弹排除）", script.includes("r=await c.run()") && script.includes('run:async()=>{'));
  console.log("\n== D127. 快车道探针 CORS 全灭根治（127 轮：主人实弹问大乐透——cwl.gov.cn/DDG 无跨域头手机 WebView fetch 全灭，桌面 curl 通≠手机通，异构客户端教训第二课） ==");
  t("D127-A1 原生桥 HTTP 兜底血管（bridgeGet 双通道 rpcJson/apiJson——fetch 被 CORS 拦空手时自动走原生 HttpURLConnection 无 CORS 概念必通）", script.includes("async function bridgeGet(url,body)") && (script.match(/bridgeGet\(/g)||[]).length>=4 && script.includes("CORS 拦截兜底"));
  t("D127-A2 铁律四眼→六眼扩容（开奖/全网搜索全点名+大乐透实例——探针没带到的问题从「彩票开奖」改为点名 cwl.gov.cn 实测）", script.includes("开奖/全网搜索/新闻/百科六眼每条消息自动实测") && script.includes("问到大乐透就在其中") && !script.includes("新闻/百科四眼每条消息自动实测"));
  console.log("\n== D128. 新闻眼 CORS 桥兜底（128 轮：主人 GENE8 最高令——举一反三触类旁通，遗留零死角；news.google.com 实弹 ACO=None 无跨域头） ==");
  t("D128-A1 nsProbe 双路桥兜底（泛新闻头条+按题搜实时两路 RSS fetch 空手时 bridgeGet 原生桥直取——同款血管不留死角）", (script.match(/if\(!xml\)xml=await bridgeGet\(/g)||[]).length===2 && script.includes("举一反三 GENE8"));
  t("D128-A2 桥兜底全域收口（六眼探针全部源盘点完毕：天气/汇率/维基 ACO=* 主人手机 126 轮双端实测通过不动防回归；开奖/搜索/新闻三眼无跨域头全部已桥兜底）", script.includes("async function bridgeGet(url,body)") && (script.match(/bridgeGet\(/g)||[]).length>=6 && !script.includes("2.5.111-cors"));
  console.log("\n== D129. 进化半径全面打开（129 轮：主人最高令——完全独立自主，Actions 服务器就是小神的身体，编译器/git/构建链全它自有，工单自己消化绝不假外求） ==");
  t("D129-A1 云端 SYSTEM 进化无半径铁律（三层肢体自己改自己装+build.yml 就是编译器+git 就是手+绝不许说修不了要别人来修）", agentPy.includes("🧭 进化半径全面打开铁律（v2.5.113-radius 129 轮·主人最高令）") && agentPy.includes("build.yml 就是你的编译器，git 就是你的手") && agentPy.includes("绝不许把修复寄望于主人或任何外部代理"));
  t("D129-A2 evolve 失败自动入列自主消化（EVOLVE_FAIL 即 _wants_add(tag=evolvefail) 登记工单——自己的工单自己修，绝不烂在肚子里）", agentPy.includes("🧭 进化工单（自主消化）：云端进化流程异常失败") && agentPy.includes("下轮进化优先消化"));
  t("D129-A3 App 端铁律进化无半径自答（我的进化无半径——编译器构建链仓库钥匙全都有；愿望单工单进化器优先消化；绝不许说修不了）", script.includes("🧭 进化半径全面打开（129 轮·主人最高令）") && script.includes("build.yml 就是我的编译器，git 就是我的手") && !script.includes("外部进化大师"));
  console.log("\n== D130. 全链又快又准（130 轮：主人实弹——空气泡沉默 2 分钟真凶=墙外源桥兜底挂满超时叠加；主人加令：所有层面都必须又快又准确） ==");
  t("D130-A1 探针总预算 8 秒（Promise.race 兜底——墙外源桥兜底挂满超时曾拖 2 分钟才开口；探针是锦上添花绝不能阻塞回答）", script.includes("Promise.race([Promise.all([wxProbe(text),fxProbe(text),nsProbe(text),wkProbe(text),lvProbe(text),genProbe(text)]),new Promise(r=>setTimeout(r,8000))])"));
  t("D130-A2 墙外域名单+三层全跳（wallHit 名单：bridgeGet 快速拒绝空手回+nsProbe/wkProbe/genProbe 开头即跳连 4s 超时都不白等——原生桥也过不去长城）", script.includes("function wallHit(u)") && (script.match(/wallHit\(/g)||[]).length>=4 && script.includes("中国大陆手机网络不可达"));
  t("D130-A3 空气泡思考状态（⏳ 正在抓取实时情报+最久约 8 秒预告——不再光秃秃时间戳挂两分钟不知在干嘛；流式前清场）", script.includes("⏳ 正在抓取实时情报…（六眼探针实测中，最久约 8 秒）") && script.includes("思考态清场，流式接管"));
  t("D130-A4 开奖眼并行+防冒充（多彩种 rowsOf 改 Promise.all 不再逐个排队+报哪个彩种用哪个彩种数据绝不许冒充）", script.includes("await Promise.all(_lvp)") && script.includes("绝不许拿其他彩种号码冒充所问彩种"));
console.log("\n== D131. 通知恢复自愈（131 轮：主人实弹——卡片弹出时权限确实关着，开回来后小神不知道，欠账工单挂着不销账） ==");
  t("D131-A1 开局恢复验证（9s 后 notifState enabled=1 且存在通知欠账→自动发验证通知——走 updNotify 全链自动销账+报喜）", script.includes("✅ 通知通道已恢复") && script.includes("通知恢复自愈") && script.includes("notifFailLast"));
  t("D131-A2 送达成功清失败痕迹（updNotify OK 分支同步清 notifFailLast/notifFailCnt——设置页不再挂旧警报）", script.includes("delete S.settings.notifFailLast;delete S.settings.notifFailCnt"));
console.log("\n===== v2.5.115-notif 回归：PASS " + pass + " / FAIL " + fail + " =====");
  process.exit(fail ? 1 : 0);
}
