/* DS-Crypto —— 零依赖密封盒（GitHub Secrets 写入通道）
 * X25519(RFC7748) + HSalsa20/XSalsa20 + Poly1305 + Blake2b + crypto_box_seal
 * 与 libsodium / PyNaCl 逐字节兼容，已用官方向量 + PyNaCl 对拍验证。
 * 仅用于 GitHub Secrets 的 libsodium sealed-box 加密，无其他用途。
 * ⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
 * 全方位、无死角进行全球探查，事无巨细、仔细再仔细。本层为基因加密通道：
 * 探查全球免费算力所需的每个 Key 都经此加密上传，本层一坏基因即断，故刻基因于此。
 * ⚖️ 最高指令二（GENE2·最强切换铁律，永不可移除）：模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力。
 * 🧖📖 最高指令三（GENE3·双端共脑铁律，永不可移除）：全局永久记忆与技术攻坚手册必须永久随身：记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，云端所有层面必须强制自动同步更新 🔗 最高指令四（GEN4·全天候联动铁律，永不可移除）：App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检。本层为基因加密通道亦刻此令。
 👑 最高指令六（GENE6·极致完美铁律，永不可移除，v2.5.38-zenith）：每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性。 */
var DSC=(function(){
"use strict";

/* ---------- 字节工具 ---------- */
function le2bi(b){var v=0n;for(var i=b.length-1;i>=0;i--)v=(v<<8n)|BigInt(b[i]);return v}
function bi2le(v,n){var r=new Uint8Array(n);for(var i=0;i<n;i++){r[i]=Number(v&255n);v>>=8n}return r}
function cat(){var n=0,i;for(i=0;i<arguments.length;i++)n+=arguments[i].length;
  var r=new Uint8Array(n),o=0;for(i=0;i<arguments.length;i++){r.set(arguments[i],o);o+=arguments[i].length}return r}
function unhex(s){var r=new Uint8Array(s.length/2);for(var i=0;i<r.length;i++)r[i]=parseInt(s.substr(i*2,2),16);return r}
function hex(b){var r="";for(var i=0;i<b.length;i++)r+=(b[i]<16?"0":"")+b[i].toString(16);return r}

/* ---------- X25519 (RFC 7748, BigInt 蒙哥马利梯子) ---------- */
var P=(1n<<255n)-19n;
function x25519(k32,u32){
  var k=le2bi(k32);
  k=(k&~7n)&((1n<<255n)-1n); k=k|(1n<<254n);          // clamp
  var x1=le2bi(u32)&((1n<<255n)-1n);
  var x2=1n,z2=0n,x3=x1,z3=1n,swap=0n;
  for(var t=254;t>=0;t--){
    var kt=(k>>BigInt(t))&1n;
    if((swap^kt)===1n){var tx=x2;x2=x3;x3=tx;var tz=z2;z2=z3;z3=tz}
    swap=kt;
    var A=(x2+z2)%P, AA=A*A%P, B=(x2-z2+P)%P, BB=B*B%P, E=(AA-BB+P)%P;
    var C=(x3+z3)%P, D=(x3-z3+P)%P, DA=D*A%P, CB=C*B%P;
    x3=(DA+CB)%P; x3=x3*x3%P;
    z3=(DA-CB+P)%P; z3=x1*z3%P*z3%P;
    x2=AA*BB%P; z2=E*(AA+121665n*E)%P;
  }
  if(swap===1n){var tx2=x2;x2=x3;x3=tx2;var tz2=z2;z2=z3;z3=tz2}
  var zinv=1n, base=z2, exp=P-2n;
  while(exp>0n){ if(exp&1n) zinv=zinv*base%P; base=base*base%P; exp>>=1n; }
  return bi2le(x2*zinv%P,32);
}
var BASE9=(function(){var r=new Uint8Array(32);r[0]=9;return r})();
function x25519Base(sk32){return x25519(sk32,BASE9)}

/* ---------- Salsa20 家族 (TweetNaCl 权威布局) ----------
 * j0=c0 j1-4=k[0:16] j5=c1 j6-9=inp16 j10=c2 j11-14=k[16:32] j15=c3
 */
var SIG=[0x61707865,0x3320646e,0x79622d32,0x6b206574];  // "expand 32-byte k"
function ld32(b,o){return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0}
function st32(o,i,v){o[i]=v&255;o[i+1]=(v>>>8)&255;o[i+2]=(v>>>16)&255;o[i+3]=(v>>>24)&255}
function rotl(v,c){return ((v<<c)|(v>>>(32-c)))>>>0}
function salsaCore(inp,k32,feed){
  var j=[SIG[0],ld32(k32,0),ld32(k32,4),ld32(k32,8),ld32(k32,12),
         SIG[1],ld32(inp,0),ld32(inp,4),ld32(inp,8),ld32(inp,12),
         SIG[2],ld32(k32,16),ld32(k32,20),ld32(k32,24),ld32(k32,28),SIG[3]];
  var x=j.slice();
  function qr(a,b,c,d){
    x[b]=x[b]^rotl((x[a]+x[d])>>>0,7);
    x[c]=x[c]^rotl((x[b]+x[a])>>>0,9);
    x[d]=x[d]^rotl((x[c]+x[b])>>>0,13);
    x[a]=x[a]^rotl((x[d]+x[c])>>>0,18);
  }
  for(var r=0;r<10;r++){
    qr(0,4,8,12); qr(5,9,13,1); qr(10,14,2,6); qr(15,3,7,11);
    qr(0,1,2,3); qr(5,6,7,4); qr(10,11,8,9); qr(15,12,13,14);
  }
  var out=feed?new Uint8Array(64):new Uint8Array(32);
  if(feed){for(var i2=0;i2<16;i2++)st32(out,i2*4,(x[i2]+j[i2])>>>0)}
  else{var idx=[0,5,10,15,6,7,8,9];for(var i3=0;i3<8;i3++)st32(out,i3*4,x[idx[i3]])}
  return out;
}
function hsalsa20(inp16,k32){return salsaCore(inp16,k32,false)}
function salsaBlock(inp16,k32){return salsaCore(inp16,k32,true)}
function xsalsaStream(nbytes,n24,k32){
  var sub=hsalsa20(n24.subarray(0,16),k32), out=new Uint8Array(nbytes), ctr=0, ctrB=new Uint8Array(16), off=0;
  while(off<nbytes){
    for(var i=0;i<8;i++)ctrB[i]=n24[16+i];
    var c8=ctr;                                       // JS 位运算只用 shift 低 5 位，
    for(var i2=0;i2<8;i2++){ctrB[8+i2]=c8%256;c8=Math.floor(c8/256)}  // 改用除法拆 LE64
    var blk=salsaBlock(ctrB,sub);
    var cp=Math.min(64,nbytes-off);
    for(var j2=0;j2<cp;j2++)out[off+j2]=blk[j2];
    off+=64; ctr++;
  }
  return out;
}

/* ---------- Poly1305 ---------- */
function poly1305(msg,key){
  var r=le2bi(key.subarray(0,16))&0x0ffffffc0ffffffc0ffffffc0fffffffn;
  var s=le2bi(key.subarray(16,32));
  var p=(1n<<130n)-5n, acc=0n;
  for(var i=0;i<msg.length;i+=16){
    var blk=msg.subarray(i,Math.min(i+16,msg.length));
    var n=le2bi(blk)+(1n<<BigInt(8*blk.length));
    acc=(acc+n)*r%p;
  }
  return bi2le((acc+s)&((1n<<128n)-1n),16);
}

/* ---------- XSalsa20-Poly1305 secretbox ---------- */
function secretbox(m,n24,k32){
  var st=xsalsaStream(m.length+32,n24,k32);
  var ct=new Uint8Array(m.length);
  for(var i=0;i<m.length;i++)ct[i]=m[i]^st[32+i];
  var mac=poly1305(ct,st.subarray(0,32));
  return cat(mac,ct);
}
function secretboxOpen(box,n24,k32){
  if(box.length<16)throw new Error("box too short");
  var st=xsalsaStream(box.length+16,n24,k32);   // 需 32+mlen；box=16+mlen，补 16
  var ct=box.subarray(16), mac=poly1305(ct,st.subarray(0,32));
  for(var i=0;i<16;i++)if(mac[i]!==box[i])throw new Error("MAC mismatch");
  var m=new Uint8Array(ct.length);
  for(var j=0;j<ct.length;j++)m[j]=ct[j]^st[32+j];
  return m;
}

/* ---------- Blake2b ---------- */
var M64=(1n<<64n)-1n;
var BIV=[0x6a09e667f3bcc908n,0xbb67ae8584caa73bn,0x3c6ef372fe94f82bn,0xa54ff53a5f1d36f1n,
         0x510e527fade682d1n,0x9b05688c2b3e6c1fn,0x1f83d9abfb41bd6bn,0x5be0cd19137e2179n];
var BSIG=[[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
 [14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3],
 [11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4],
 [7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8],
 [9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13],
 [2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9],
 [12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11],
 [13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10],
 [6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5],
 [10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0]];
function rotr64(v,n){return ((v>>BigInt(n))|(v<<(64n-BigInt(n))))&M64}
function blake2b(outlen,data){
  var h=BIV.slice();
  h[0]=(h[0]^((0x01010000n)|BigInt(outlen)))&M64;          // kk=0
  var t=0n;
  var compress=function(blk,tInc,isLast){
    t=t+tInc;
    var m=new Array(16);
    for(var i=0;i<16;i++)m[i]=0n;
    var nb=blk.length; // 实际字节
    for(var i2=0;i2<nb;i2++)m[i2>>3]|=BigInt(blk[i2])<<BigInt(8*(i2&7));
    var v=h.concat(BIV);
    v[12]=(v[12]^(t&M64))&M64;                       // t 低位注入
    v[13]=(v[13]^((t>>64n)&M64))&M64;                // t 高位注入
    v[14]=(v[14]^(isLast?M64:0n))&M64;                // 最终块标志 f0（f1 树模式才用，不反转）
    function G(a,b,c,d,x,y){
      v[a]=(v[a]+v[b]+x)&M64; v[d]=rotr64(v[d]^v[a],32);
      v[c]=(v[c]+v[d])&M64;   v[b]=rotr64(v[b]^v[c],24);
      v[a]=(v[a]+v[b]+y)&M64; v[d]=rotr64(v[d]^v[a],16);
      v[c]=(v[c]+v[d])&M64;   v[b]=rotr64(v[b]^v[c],63);
    }
    for(var r=0;r<12;r++){                        // BLAKE2b 共 12 轮，SIGMA 后两轮复用前两行
      var s=BSIG[r<10?r:r-10];
      G(0,4,8,12,m[s[0]],m[s[1]]); G(1,5,9,13,m[s[2]],m[s[3]]);
      G(2,6,10,14,m[s[4]],m[s[5]]); G(3,7,11,15,m[s[6]],m[s[7]]);
      G(0,5,10,15,m[s[8]],m[s[9]]); G(1,6,11,12,m[s[10]],m[s[11]]);
      G(2,7,8,13,m[s[12]],m[s[13]]); G(3,4,9,14,m[s[14]],m[s[15]]);
    }
    for(var i3=0;i3<8;i3++)h[i3]=(h[i3]^v[i3]^v[i3+8])&M64;
  };
  var off=0;
  while(data.length-off>128){compress(data.subarray(off,off+128),128n,false);off+=128}
  var last=data.subarray(off);
  if(last.length===0&&data.length===0){compress(new Uint8Array(128),0n,true)}
  else{var lb=new Uint8Array(128);lb.set(last);compress(lb,BigInt(last.length),true)}
  var out=new Uint8Array(outlen),acc=0n;
  for(var o=0;o<outlen;o++){
    if((o&7)===0)acc=h[o>>3];
    out[o]=Number(acc&255n);acc>>=8n;
  }
  return out;
}

/* ---------- Sealed Box (libsodium crypto_box_seal) ---------- */
function rand(n){
  // 🛡️ v2.5.57-wire 66 轮：旧版无 crypto.getRandomValues 时降级 Math.random——非密码学随机，临时私钥可预测=密封盒明文可恢复。安全原语必须 fail-hard，绝不静默降级。
  if(typeof crypto==="undefined"||!crypto.getRandomValues)throw new Error("crypto.getRandomValues 不可用（WebView 环境异常）——拒绝弱随机生成密钥");
  var r=new Uint8Array(n);
  crypto.getRandomValues(r);
  return r;
}
function seal(msg,pk32){
  var esk=rand(32), epk=x25519Base(esk);
  var n24=blake2b(24,cat(epk,pk32));
  var k=hsalsa20(new Uint8Array(16),x25519(esk,pk32));
  return cat(epk,secretbox(msg,n24,k));
}
function sealOpen(sealed,sk32){
  var epk=sealed.subarray(0,32), box=sealed.subarray(32);
  var pk=x25519Base(sk32);
  var n24=blake2b(24,cat(epk,pk));
  var k=hsalsa20(new Uint8Array(16),x25519(sk32,epk));
  return secretboxOpen(box,n24,k);
}

return {
  x25519:x25519, x25519Base:x25519Base,
  hsalsa20:hsalsa20, xsalsaStream:xsalsaStream, poly1305:poly1305,
  secretbox:secretbox, secretboxOpen:secretboxOpen, blake2b:blake2b,
  seal:seal, sealOpen:sealOpen,
  rand:rand, hex:hex, unhex:unhex
};
})();
