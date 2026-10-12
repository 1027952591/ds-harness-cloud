#!/usr/bin/env node
// 🧬 v2.5.61-flash 79 轮：Babel 转译管线——源码 app/assets/index.src.html（人写，tests 断言对象）
//    → 产物 app/assets/index.html（进 APK；targets 由命令行参数定，老 WebView 语法断崖全踏平）。
//    用户证词实锤：任何历史版本从未在真机跑通过 → Chrome 44-59 危险带的 async/await/箭头/展开全数转译，
//    一把梭根治"整块 script 静默语法死→按钮全死如图片"的最高概率真凶。
// 用法：node transpile.cjs [chromeVersion]   （默认 44；产物就地写入 app/assets/index.html）
const fs = require("fs");
const path = require("path");
// 🔧 buildfix 103 轮：vendor 兜底——云端 runner npm 环境崩（Exit handler never called）也能转译：
//    优先走 node_modules（本地开发态），缺失时回退 tools/vendor/ 单文件自带（babel/acorn/regenerator 三件套随仓分发，云端零 npm 依赖）
function reqOrVendor(moduleName, vendorFile) {
  try { return require(moduleName); }
  catch (e) {
    const vp = path.join(__dirname, "vendor", vendorFile);
    if (!fs.existsSync(vp)) throw e;
    return require(vp);
  }
}
const Babel = reqOrVendor("@babel/standalone", "babel.min.js");
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "app/assets/index.src.html");
const DST = path.join(ROOT, "app/assets/index.html");
const TARGET_CHROME = String(process.argv[2] || "44");

let html = fs.readFileSync(SRC, "utf8");

// —— 🌉 v2.5.66-nullbase 84 轮：crypto.js 引用改绝对路径——loadWeb 改 loadDataWithBaseURL(null 基址)后，
//    相对路径 src 无法解析（83 轮实弹：file:// 基址大页连渲染都失败，null 基址是唯一已证 JS 活的模式）。
//    不能内联：crypto.js 含 BigInt 字面量（ES2020），进 ES5 硬门必炸；绝对路径 file:///android_asset/
//    与基址无关（allowFileAccess=true 已放开），相对引用崩不了。
html = html.replace('<script src="crypto.js"></script>', '<script src="file:///android_asset/crypto.js"></script>');
if (html.indexOf('file:///android_asset/crypto.js') === -1) { console.error("FATAL: crypto.js script tag not found"); process.exit(1); }

// —— 提取主 script 块（最长的裸 <script> 块；黑匣子块/工具块留原样不经 babel）——
const blocks = [];
const re = /<script>([\s\S]*?)<\/script>/g;
let m;
while ((m = re.exec(html)) !== null) blocks.push({ start: m.index, end: re.lastIndex, code: m[1] });
if (!blocks.length) { console.error("FATAL: no <script> blocks found"); process.exit(1); }
const main = blocks.reduce((a, b) => (b.code.length > a.code.length ? b : a));

// —— 🔬 v2.5.63-probe 81 轮：手写块 ES5 硬门——黑匣子/polyfill 块不经 babel（人写 ES5），
//    必须逐块过 acorn ecmaVersion:5 解析（任何 ES6+ 语法当场构建失败）——语法层死亡在构建期即被物理排除
let acorn;
try { acorn = reqOrVendor("acorn", "acorn.dist.js"); }
catch (e) { console.error("FATAL: acorn not installed (npm i acorn in tools/ or vendor/acorn.dist.js missing)"); process.exit(1); }
blocks.forEach(function (b, i) {
  if (b === main) return; // 主块走 babel chrome44（保模板字面量等 Chrome41+ 语法），不用 ES5 门
  try { acorn.parse(b.code, { ecmaVersion: 5 }); console.log("[transpile] hand-written block #" + i + " (" + b.code.length + "B) ES5 OK"); }
  catch (e) { console.error("FATAL: hand-written block #" + i + " is NOT pure ES5: " + e.message); process.exit(1); }
});

console.log("[transpile] main block: " + main.code.length + " chars @ offset " + main.start + " | blocks total " + blocks.length);

// —— regeneratorRuntime（async/await→ES5 状态机必需；仅在产物用到时前拼一次）——
let regenCode = "";
try {
  let regenPath;
  try { regenPath = require.resolve("regenerator-runtime/runtime.js", { paths: [__dirname] }); }
  catch (e) { regenPath = path.join(__dirname, "vendor", "regenerator-runtime.js"); }
  if (!fs.existsSync(regenPath)) throw new Error("regenerator runtime file not found: " + regenPath);
  regenCode = fs.readFileSync(regenPath, "utf8");
}
catch (e) { console.error("FATAL: regenerator-runtime not found: " + e.message); process.exit(1); }

// —— 黑匣子插入：主块头部 s1 打点已在源码里；此处把 s0 阶段后置校验注释压进产物（无功能）——
const t0 = Date.now();
let out;
try {
  out = Babel.transform(main.code, {
    presets: [["env", { targets: { chrome: TARGET_CHROME }, modules: false }]],
    compact: false,
    comments: true,
    filename: "main.js",
  }).code;
} catch (e) {
  console.error("FATAL: babel transform failed: " + e.message);
  process.exit(1);
}
console.log("[transpile] babel ok in " + (Date.now() - t0) + "ms");

// async/await 若被转译，产物引用 regeneratorRuntime —— 检测后前拼 runtime（仅一次）
let prologue = "";
if (out.indexOf("regeneratorRuntime") !== -1) {
  prologue = "/* regenerator-runtime inlined (auto by transpile.cjs) */\n" + regenCode + "\n\n";
}
// preset-env 产物的 inline helper 已在文件头（babel standalone 特性），无需再拼

const newMain = prologue + out;

// —— 🧩 v2.5.68-chunks 86 轮：主块按顶层语句切块——85 轮实弹坐实：真 HTTP 渲染成功但 JS 死、
//    小页（15 行内联脚本）JS 活 → 装载路径全洗清，真凶=378KB 单脚本块（华为内核单块解析/执行上限疑）。
//    用 acorn 解析转译产物取顶层语句范围，聚合成 ≤48KB 的多个 <script> 块（顶层 var/function/let/const
//    在同一 realm 的全局作用域跨块共享，顺序不变语义不变）；每块尾插 __chunkOK 存活标记，
//    收官块立 title='CHUNKS_ALL_OK'——真机上 getTitle/探针可精确报出死在第几块；若凶手只是"块太大"，切块直接根治。
// （acorn 已在文件头部加载——ES5 硬门共用同一实例）
let mainAst;
const keptComments = []; // 🧬 86 轮：基因铁律刻痕在 JS 注释里——acorn 切块按语句范围切会丢注释，onComment 收集后按位置拼回所属块
try { mainAst = acorn.parse(newMain, { ecmaVersion: 2020, onComment: function (block, text, start, end) { keptComments.push({ start: start, end: end }); } }); }
catch (e) { console.error("FATAL: acorn parse of transpiled main failed: " + e.message); process.exit(1); }
const CHUNK_MAX = 48000;
const chunkGroups = [];
let curGroup = [], curLen = 0;
for (const node of mainAst.body) {
  const len = node.end - node.start;
  if (curGroup.length && curLen + len > CHUNK_MAX) { chunkGroups.push(curGroup); curGroup = []; curLen = 0; }
  curGroup.push(node); curLen += len;
}
if (curGroup.length) chunkGroups.push(curGroup);
// 注释归属：注释跟随其后最近的第一条语句所在块（尾注归末块）
const chunkComments = chunkGroups.map(function () { return []; });
keptComments.forEach(function (c) {
  for (let gi = 0; gi < chunkGroups.length; gi++) {
    const g = chunkGroups[gi];
    if (c.start < g[g.length - 1].end) { chunkComments[gi].push(newMain.slice(c.start, c.end)); return; }
  }
  chunkComments[chunkGroups.length - 1].push(newMain.slice(c.start, c.end));
});
const chunkScripts = chunkGroups.map(function (nodes, i) {
  const code = chunkComments[i].join("\n") + (chunkComments[i].length ? "\n" : "") + nodes.map(function (n) { return newMain.slice(n.start, n.end); }).join("\n");
  const marker = "\n;try{(window.__chunkOK=window.__chunkOK||[]).push(" + (i + 1) + ")}catch(e){}";
  return "<script>" + code + marker + "<" + "/script>";
});
const chunkedHtml = chunkScripts.join("\n") + "\n<script>try{document.title='CHUNKS_ALL_OK'}catch(e){}<" + "/script>";
console.log("[transpile] main chunked: " + chunkGroups.length + " blocks (max " + Math.max.apply(null, chunkGroups.map(function (g) {
  return g.reduce(function (a, n) { return a + n.end - n.start; }, 0);
})) + "B, target<=" + CHUNK_MAX + "B)");

const newHtml = html.slice(0, main.start) + chunkedHtml + html.slice(main.end);

// —— 产物全量语法校验（node --check 等价；逐块校验=切块语义等价复核）——
try { new Function(newMain); } catch (e) { console.error("FATAL: transpiled output syntax error: " + e.message); process.exit(1); }
chunkScripts.forEach(function (s, i) {
  const inner = s.slice("<script>".length, s.length - "<" + "/script>".length).replace(/\n;try\{\(window\.__chunkOK[\s\S]*$/, "");
  try { new Function(inner); } catch (e) { console.error("FATAL: chunk " + (i + 1) + " syntax error: " + e.message); process.exit(1); }
});

fs.writeFileSync(DST, newHtml);

// —— 🧪 v2.5.69-nobridge 87 轮：无桥实验版——头号嫌疑=JS→Java 同步桥调用在华为内核死锁
//    （证据链：自检页零桥调用 JS 活；主应用首行 bLog→DSB.storeSet→synchronized+磁盘 fsync；evaluate 永无回执）。
//    产物=同一页面在 <head> 后插 DSB/PHB 纯 JS 桩（内存 Map+console.log 通道），页面零真桥依赖——
//    真机上此版若活=桥死锁坐实；桩定义必须先于主块（indexOf 校验）。
const nobridgeStub = "<" + "script>\n"
+ "/* 🧪 nobridge：DSB/PHB 纯 JS 桩（87 实验→90 快照→91 覆盖→93 归一→94 asyncnet→95 rpc 全经脉）——\n"
 + " * 数据读=快照同步；数据写=[dsb.set] 分块回写；动作=[dsb.动作]；流式网=[dsb.http]；\n"
 + " * 🔧 95 轮 rpc：同步读值类全接通用 RPC（[dsb.call]method\targs 下发→Java 后台真调→__dsbRpcOk 回填\n"
 + " *   __dsbRpcCache）；同步契约页面零改动：首次占位安全降级，轮询/重试点二次命中真值。 */\n"
+ ""
+ "(function(){\n"
+ "var M={};var S=window.__DSB_SNAPSHOT||{};for(var k in S){try{M[k]=(typeof S[k]==='string')?S[k]:JSON.stringify(S[k])}catch(e){}}\n"
+ "function fire(a,p){try{console.log('[dsb.'+a+']'+(p===undefined?'':p))}catch(e){}}\n"
+ "function pushSet(k,v){try{var s=String(v);var CH=30000;var n=Math.max(1,Math.ceil(s.length/CH));for(var i=0;i<n;i++){console.log('[dsb.set]'+k+'#'+i+'/'+n+'\\t'+s.slice(i*CH,(i+1)*CH))}}catch(e){}}\n"
+ "window.__dsbDirty={};window.__dsbSaved=0;window.__dsbSent={};\n"
+ "window.__dsbDrain=function(){try{var d={};for(var k in window.__dsbDirty){d[k]=window.__dsbDirty[k]}window.__dsbSent=d;return JSON.stringify(d)}catch(e){return '{}'}};\n"
+ "window.__dsbDrainOk=function(a){try{for(var i=0;i<(a||[]).length;i++){var k=a[i];if(window.__dsbDirty[k]===window.__dsbSent[k])delete window.__dsbDirty[k]}window.__dsbSent={};window.__dsbSaved=Date.now()}catch(e){}};\n"
+ "setInterval(function(){try{var b=document.getElementById('dsbAckBadge');if(!b){b=document.createElement('div');b.id='dsbAckBadge';b.style.cssText='position:fixed;left:8px;bottom:66px;z-index:9999;font-size:10px;color:#7fe0a7;background:rgba(6,20,12,.72);padding:2px 7px;border-radius:8px;pointer-events:none';(document.body||document.documentElement).appendChild(b)}b.textContent=window.__dsbSaved?('💾已存档 '+Math.max(1,Math.round((Date.now()-window.__dsbSaved)/1000))+'s 前'):'💾存档等待…';}catch(e){}},2000);\n"
+ "/* ===== 🔧 95 轮：通用 RPC 通道 =====\n"
+ "   __dsbRpc(method, argsArray) → [dsb.call]method\\targsJson（大参数分块）→ Java 后台反射真调 →\n"
+ "   evaluate __dsbRpcOk(seq, resultJson) → 结果存 __dsbRpcCache[seq] 并回调 __dsbRpcWatch。\n"
+ "   同步壳取值三态：①缓存命中→真值；②未命中→发起+占位值（调用方安全降级）；③页面轮询点下次命中真值。 */\n"
+ "window.__dsbRpcCache={};window.__dsbRpcSeq=0;window.__dsbRpcWatch=null;window.__dsbHttpSeq=0;window.__dsbCallKeys={};window.__dsbCallCache={};window.__dsbCallMeths={};\n"
+ "window.__dsbRpcOk=function(seq,r){try{r=String(r);window.__dsbRpcCache[seq]=r;var m=window.__dsbCallMeths[seq];if(m){window.__dsbRpcCache[m]=r}var ck=window.__dsbCallKeys[seq];if(ck){window.__dsbCallCache[ck]=r}if(window.__dsbRpcWatch)try{window.__dsbRpcWatch(seq,r)}catch(e){}}catch(e){}};\n"
+ "window.__dsbRpc=function(m,a){try{var seq=++window.__dsbRpcSeq;var s=JSON.stringify(a||[]);var CH=30000;var n=Math.max(1,Math.ceil(s.length/CH));for(var i=0;i<n;i++){console.log('[dsb.call]'+m+'#'+seq+'/'+i+'/'+n+'\\t'+s.slice(i*CH,(i+1)*CH))}window.__dsbCallMeths[seq]=m;window.__dsbCallKeys[seq]=m+'\\t'+s;return seq}catch(e){return 0}};\n"
+ "function rpcGet(seq){return (seq in window.__dsbRpcCache)?window.__dsbRpcCache[seq]:null}\n"
+ "function rpcHit(m,a){var ck=m+'\\t'+JSON.stringify(a||[]);return (ck in window.__dsbCallCache)?window.__dsbCallCache[ck]:null}\n"
+ "function rpcArg(seq,m,a){var hit=rpcGet(seq);if(hit!==null)return hit;hit=rpcHit(m,a);if(hit!==null)return hit;window.__dsbRpc(m,a);return null}\n"
+ "/* 资产快照（95 轮预灌：skeleton DNA 等） */\n"
+ "var AS=window.__DSB_ASSETS||{};\n"
+ "/* 非流式网缓存（95 轮：api() 占位→RPC 回填→下次调用命中） */\n"
+ "window.__dsbApiCache={};\n"
+ "window.DSB={storeGet:function(k){var v=(k in M)?M[k]:null;return (v==null||typeof v==='string')?v:JSON.stringify(v)},\n"
+ "storeSet:function(k,v){M[k]=String(v);pushSet(k,v);try{window.__dsbDirty[k]=String(v)}catch(e){}return 1},\n"
+ "readAsset:function(p){var key=String(p);if(key in AS)return AS[key];var hit=rpcHit('readAsset',[key]);if(hit!==null)return hit;window.__dsbRpc('readAsset',[key]);return 'ERR:rpc-pending（稍后重试）'},\n"
+ "appInfo:function(){return window.__DSB_APPINFO||'{}'},\n"
+ "http:function(u,md,h,b){var hit=rpcHit('http',[u,md||'GET',h||'{}',b||'']);if(hit!==null)return hit;window.__dsbRpc('http',[u,md||'GET',h||'{}',b||'']);return '{\"status\":0,\"body\":\"\",\"err\":\"rpc-pending:结果稍后到达，请稍候重试（95 轮 rpc）\"}'},\n"
+ "httpStream:function(url,hdr,body){try{var id='h'+(++window.__dsbHttpSeq);var s=String(url)+'\\t'+String(hdr)+'\\t'+String(body);var CH=30000;var n=Math.max(1,Math.ceil(s.length/CH));for(var i=0;i<n;i++){console.log('[dsb.http]'+id+'#'+i+'/'+n+'\\t'+s.slice(i*CH,(i+1)*CH))}return id}catch(e){return '0'}},\n"
+ "llamaStatus:function(){var hit=window.__dsbRpcCache.llamaStatus;if(hit)return hit;window.__dsbRpc('llamaStatus',[]);return '{\"ready\":0,\"pending\":1}'},\n"
+ "llamaDownload:function(){var hit=window.__dsbRpcCache.llamaDownload;if(hit)return hit;window.__dsbRpc('llamaDownload',[]);return '{\"ok\":1,\"detail\":\"rpc-pending\"}'},\n"
+ "llamaDelete:function(){var hit=window.__dsbRpcCache.llamaDelete;if(hit)return hit;window.__dsbRpc('llamaDelete',[]);return '{\"ok\":1,\"detail\":\"rpc-pending\"}'},\n"
+ "llamaStream:function(mj){try{window.__dsbRpc('llamaStream',[mj,'']);return 's95'}catch(e){return '0'}},\n"
+ "micPerm:function(){var hit=window.__dsbRpcCache.micPerm;if(hit)return hit;window.__dsbRpc('micPerm',[]);return '0'},\n"
+ "micRecStart:function(){var seq=window.__dsbRpc('micRecStart',[]);return (rpcGet(seq)||rpcHit('micRecStart',[])||'0')},\n"
+ "micRecStop:function(){var seq=window.__dsbRpc('micRecStop',[]);return (rpcGet(seq)||rpcHit('micRecStop',[])||'0')},\n"
+ "micAsr:function(u,k,mo){var seq=window.__dsbRpc('micAsr',[u,k,mo]);return (rpcGet(seq)||rpcHit('micAsr',[u,k,mo])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "micAsrChat:function(u,mo){var seq=window.__dsbRpc('micAsrChat',[u,mo]);return (rpcGet(seq)||rpcHit('micAsrChat',[u,mo])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "micAsrFile:function(u,k,mo,path){var seq=window.__dsbRpc('micAsrFile',[u,k,mo,path]);return (rpcGet(seq)||rpcHit('micAsrFile',[u,k,mo,path])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "pickFile:function(){window.__dsbRpc('pickFile',[]);return '{\"ok\":0,\"err\":\"pending\"}'},\n"
+ "pickGallery:function(){window.__dsbRpc('pickGallery',[]);return '{\"ok\":0,\"err\":\"pending\"}'},\n"
+ "pickCamera:function(){window.__dsbRpc('pickCamera',[]);return '{\"ok\":0,\"err\":\"pending\"}'},\n"
+ "pickVideoFrames:function(p,c){var seq=window.__dsbRpc('pickVideoFrames',[p,c]);return (rpcGet(seq)||rpcHit('pickVideoFrames',[p,c])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "pickVideoAudio:function(p){var seq=window.__dsbRpc('pickVideoAudio',[p]);return (rpcGet(seq)||rpcHit('pickVideoAudio',[p])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "pickReadText:function(p){var seq=window.__dsbRpc('pickReadText',[p]);return (rpcGet(seq)||rpcHit('pickReadText',[p])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "pickDelete:function(p){var seq=window.__dsbRpc('pickDelete',[p]);return (rpcGet(seq)||rpcHit('pickDelete',[p])||'{\"ok\":0}')},\n"
+ "pick:function(){},\n"
+ "hotInfo:function(){var hit=window.__dsbRpcCache.hotInfo;if(hit)return hit;window.__dsbRpc('hotInfo',[]);return '{\"exists\":false,\"pending\":1}'},\n"
+ "hotRead:function(){var hit=window.__dsbRpcCache.hotRead;if(hit)return hit;window.__dsbRpc('hotRead',[]);return '{\"ok\":0,\"err\":\"rpc-pending\"}'},\n"
+ "hotWrite:function(code){var seq=window.__dsbRpc('hotWrite',[code]);return (rpcGet(seq)||rpcHit('hotWrite',[code])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "hotDelete:function(){fire('hotdel');return '{\"ok\":1}'},\n"
+ "hotBundleVer:function(){return null},\n"
+ "notifPerm:function(){var hit=window.__dsbRpcCache.notifPerm;if(hit)return hit;window.__dsbRpc('notifPerm',[]);return '0'},\n"
+ "askNotifPermission:function(){fire('askperm')},\n"
+ "notifyUser:function(t,b){fire('notify',String(t)+'\\t'+String(b==null?'':b))},\n"
+ "scheduleAlarm:function(j){fire('alarm',j)},\n"
+ "cancelAlarm:function(id){fire('alarmcancel',id)},\n"
+ "runAlarmNow:function(id){fire('alarmnow',id);return ''},\n"
+ "rescheduleAll:function(){fire('resched')},\n"
+ "canExactAlarm:function(){var hit=window.__dsbRpcCache.canExactAlarm;if(hit)return hit;window.__dsbRpc('canExactAlarm',[]);return '0'},\n"
+ "openExactAlarmSettings:function(){fire('exactset')},\n"
+ "saveDlv:function(u,n,sha){fire('savedlv',String(u)+'\\t'+String(n||'')+'\\t'+String(sha||''));return '{\"ok\":1,\"detail\":\"下载已发起，完成后通知（95 轮 rpc）\"}'},\n"
+ "openUrl:function(u){fire('openurl',u)},\n"
+ "reload:function(){fire('reload')},\n"
+ "exitApp:function(){fire('exit')},\n"
+ "toast:function(m){fire('toast',String(m==null?'':m))},\n"
+ "vib:function(){fire('vib')}\n"
+ "};\n"
+ "window.PHB={\n"
+ "stat:function(){var hit=window.__dsbRpcCache.phb_devInfo;if(hit)return hit;window.__dsbRpc('phb_devInfo',[]);return '{\"ok\":0,\"err\":\"rpc-pending\"}'},\n"
+ "fsGranted:function(){var hit=window.__dsbRpcCache.phb_fsGranted;if(hit)return hit;window.__dsbRpc('phb_fsGranted',[]);return '{\"ok\":0}'},\n"
+ "fsRoots:function(){var hit=window.__dsbRpcCache.phb_fsRoots;if(hit)return hit;window.__dsbRpc('phb_fsRoots',[]);return '{\"ok\":0,\"err\":\"rpc-pending\"}'},\n"
+ "fsList:function(p){var seq=window.__dsbRpc('phb_fsList',[p]);return (rpcGet(seq)||rpcHit('phb_fsList',[p])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "fsRead:function(p,mx){var seq=window.__dsbRpc('phb_fsRead',[p,mx||20000]);return (rpcGet(seq)||rpcHit('phb_fsRead',[p,mx||20000])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "fsWrite:function(p,c,ap){var seq=window.__dsbRpc('phb_fsWrite',[p,c,!!ap]);return (rpcGet(seq)||rpcHit('phb_fsWrite',[p,c,!!ap])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "fsMkdir:function(p){var seq=window.__dsbRpc('phb_fsMkdir',[p]);return (rpcGet(seq)||rpcHit('phb_fsMkdir',[p])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "fsDelete:function(p){var seq=window.__dsbRpc('phb_fsDelete',[p]);return (rpcGet(seq)||rpcHit('phb_fsDelete',[p])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "fsRename:function(f,t){var seq=window.__dsbRpc('phb_fsRename',[f,t]);return (rpcGet(seq)||rpcHit('phb_fsRename',[f,t])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "fsSearch:function(p,q){var seq=window.__dsbRpc('phb_fsSearch',[p,q]);return (rpcGet(seq)||rpcHit('phb_fsSearch',[p,q])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "appList:function(){var hit=window.__dsbRpcCache.phb_appList;if(hit)return hit;window.__dsbRpc('phb_appList',[]);return '{\"ok\":0,\"err\":\"rpc-pending\"}'},\n"
+ "appLaunch:function(pkg){var seq=window.__dsbRpc('phb_appLaunch',[pkg]);return (rpcGet(seq)||rpcHit('phb_appLaunch',[pkg])||'{\"ok\":0,\"err\":\"rpc-pending\"}')},\n"
+ "devInfo:function(){var hit=window.__dsbRpcCache.phb_devInfo;if(hit)return hit;window.__dsbRpc('phb_devInfo',[]);return '{\"ok\":0,\"err\":\"rpc-pending\"}'}\n"
+ "};\n"
+ "})();\n"
+ ""
+ "<" + "/script>";

const headIdx = newHtml.indexOf("<head>");
if (headIdx === -1) { console.error("FATAL: <head> not found for nobridge stub"); process.exit(1); }
const nobridgeHtml = newHtml.slice(0, headIdx + 6) + nobridgeStub + newHtml.slice(headIdx + 6);
fs.writeFileSync(path.join(__dirname, "..", "app", "assets", "index.nobridge.html"), nobridgeHtml);
if (nobridgeHtml.indexOf("window.DSB={storeGet") > nobridgeHtml.indexOf("__chunkOK")) { console.error("FATAL: nobridge stub must precede main chunks"); process.exit(1); }
console.log("[transpile] nobridge page: app/assets/index.nobridge.html (" + nobridgeHtml.length + "B)");

// —— 🔬 v2.5.64-ladder 82 轮：主块替换二分页（dsh://boot-probemain 用）——主块换成 title 标记器，
//    保黑匣子/补丁层/全 CSS/全 HTML：引擎若能立起 MAIN_REPLACED_OK 标题=凶手在主块内容内部；立不起=凶手在外壳层
const probeMainHtml = html.slice(0, main.start) + "<" + "script>\ndocument.title='MAIN_REPLACED_OK';window.__probeMainOK=1;\n<" + "/script>" + html.slice(main.end);
fs.writeFileSync(path.join(__dirname, "..", "app", "assets", "index.probe.html"), probeMainHtml);
console.log("[transpile] bisect page: app/assets/index.probe.html (" + probeMainHtml.length + "B, main->title marker)");
console.log("[transpile] DONE src=" + html.length + "B -> dst=" + newHtml.length + "B (main " + main.code.length + " -> " + newMain.length + ") targets=chrome" + TARGET_CHROME);

// —— 老语法残留审计（应全为 0；regeneratorRuntime 自身是 ES5 不在审计对象里）——
const auditMain = out;
const counts = {
  "await ": (auditMain.match(/await\s/g) || []).length,
  "async function": (auditMain.match(/async function/g) || []).length,
  "obj-spread": (auditMain.match(/\{\s*\.\.\./g) || []).length,
  "arr-spread": (auditMain.match(/\[\s*\.\.\./g) || []).length,
  "arrow-fn": (auditMain.match(/=>/g) || []).length,
  "template-lit": (auditMain.match(/`/g) || []).length,
  "let-const": (auditMain.match(/\b(let|const)\s/g) || []).length,
};
console.log("[transpile] syntax audit (0=target-clean, arrows/templates/let-const only need 0 if target<45): " + JSON.stringify(counts));
