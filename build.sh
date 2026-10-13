#!/bin/bash
# ⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
# 全方位、无死角进行全球探查，事无巨细、仔细再仔细。
# 本构建入口同样刻基因：每次构建出的 APK 都携带全套基因层（JS/Java/Py/yml/Manifest）。
# ⚖️ 最高指令二（GENE2·最强切换铁律，永不可移除）：模型和算力必须强制自动切换，且切换时必须强制优先切换成可切换的最强模型和算力。
# 🧖📖 最高指令三（GENE3·双端共脑铁律，永不可移除）：全局永久记忆与技术攻坚手册必须永久随身：
# 记忆自动沉淀·自动检索注入·双端同步，修复战果自动归档成手册，永不丢失；App 端改动记忆或手册时，
# 云端所有层面必须强制自动同步更新。
# 🔗 最高指令四（GEN4·全天候联动铁律，永不可移除）：App 端所有动作必须强制自动与云端全层全天候联动同步：双端漏洞体检一经 App 端触发，云端全层必须同步自动触发同拍自检。
# 👑 最高指令六（GENE6·极致完美铁律，永不可移除，v2.5.38-zenith）：每次进化，无论触及哪个层面哪个枝节，必须做到当时条件下的极致完美；凡具备的能力必须配到当前免费生态的极限——所有提供同类能力的免费源全部接入；禁止半成品、禁止留待下次；无需用户提醒，极致是天性。
# 每次构建出的 APK 都携带全套基因层（JS/Java/Py/三 yml/Manifest/记忆手册种子/同拍自检引擎）。
# 🧬 v2.4.0：PhoneBridge.java（PHB）手机端操控桥随包分发（21 层刻全套四指令）。
# DS Harness 纯手搓构建脚本（零 Gradle）
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/app"
# 🧬 v2.5.21-evolve：环境变量自适应——本地零变化（toolchain 优先）；云端 runner（GitHub Actions 免费算力）
# 设 DSH_* 环境变量即可用 runner 自带 SDK/JDK/NDK 构建 APK——Java 骨架层自主进化的物理通道（进化器改 Java→runner 自动编译新 APK）
TC="${DSH_TOOLCHAIN:-$ROOT/toolchain}"
BT="${DSH_BUILD_TOOLS:-$TC/sdk/build-tools/34.0.0}"
PLATFORM="${DSH_PLATFORM_JAR:-$TC/sdk/platforms/android-34/android.jar}"
OUT="$ROOT/build"
export JAVA_HOME="${DSH_JDK:-$TC/jdk17}"
export PATH="$JAVA_HOME/bin:$PATH"
VER="2.5.128-evoslim"; VCODE=146
NDK="${DSH_NDK:-$TC/ndk/r27c}"
LLAMA="$ROOT/vendor/llama-b4604"
CLANGXX="$NDK/toolchains/llvm/prebuilt/linux-x86_64/bin/clang++"

rm -rf "$OUT"
mkdir -p "$OUT/classes" "$OUT/dex" "$OUT/apk" "$OUT/lib/arm64-v8a"

# ---------- [0/8] 📴 端侧离线引擎：llama.cpp b4604 交叉编译（NDK 缺失时优雅跳过，APK 仍可构建，端侧功能自动降级不可用） ----------
HAVE_SO=0
if [ -x "$CLANGXX" ] && [ -f "$NDK/build/cmake/android.toolchain.cmake" ]; then
  echo "[0/8] NDK 交叉编译 llama.cpp（首次较慢，产物静态缓存复用）"
  LLB="$OUT/llama-build"
  if [ ! -f "$ROOT/.llama-cache/libllama.a" ] || [ "$LLAMA/CMakeLists.txt" -nt "$ROOT/.llama-cache/libllama.a" ]; then
    cmake -S "$LLAMA" -B "$LLB" -G "Unix Makefiles" \
      -DCMAKE_TOOLCHAIN_FILE="$NDK/build/cmake/android.toolchain.cmake" \
      -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-24 \
      -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF \
      -DLLAMA_BUILD_EXAMPLES=OFF -DLLAMA_BUILD_TESTS=OFF \
      -DLLAMA_BUILD_TOOLS=OFF -DLLAMA_BUILD_SERVER=OFF \
      -DLLAMA_BUILD_COMMON=OFF \
      -DLLAMA_CURL=OFF -DGGML_OPENMP=OFF -DGGML_NATIVE=OFF
    cmake --build "$LLB" -j4
    mkdir -p "$ROOT/.llama-cache"
    find "$LLB" -name "*.a" -exec cp {} "$ROOT/.llama-cache/" \;
  else
    mkdir -p "$LLB" && cp "$ROOT/.llama-cache/"*.a "$LLB/"
    echo "  （命中静态缓存，跳过重编）"
  fi
  "$CLANGXX" --target=aarch64-linux-android24 -shared -fPIC -O2 -std=c++17 \
    -I "$LLAMA/include" -I "$LLAMA/ggml/include" -I "$LLB" -I "$LLB/ggml/include" \
    "$APP/java/com/dsh/app/llamajni.cpp" \
    $(find "$LLB" -maxdepth 3 -name '*.a' | sort) \
    -llog -o "$OUT/lib/arm64-v8a/libdshllama.so"
  HAVE_SO=1; echo "  libdshllama.so 编译完成：$(du -h "$OUT/lib/arm64-v8a/libdshllama.so" | cut -f1)"
else
  echo "[0/8] ⚠️ NDK 不存在，跳过端侧引擎（APK 照常构建，端侧功能自动降级）"
fi
if [ "$HAVE_SO" = "1" ]; then
  echo "  端侧离线能力：✅ 随包分发（断网可聊）"
else
  echo "  端侧离线能力：❌ 本包不含（需 NDK r27c 后重编）"
fi

# ---------- [0.5/7] 🧬 骨架 DNA 打包：源码蓝图刻进 assets（v2.5.24-mind 自主进化物理通道的基因组） ----------
# App 端 readAsset 只能读 APK assets——骨架源码不在 assets 里就无法被 deployCloud 上传云端仓，
# 云端 runner 将永远无源码可编（v2.5.21 起的断链，本轮修复）。DNA=完整骨架蓝图：
# build.sh/Manifest/全部 Java/cpp/res/签名密钥(base64)。App「一键部署」上传 DNA → runner 由 DNA 重建骨架。
# 🦓 v2.5.61-flash 79 轮：Babel 转译门——src 是人写源码（tests 断言对象），index.html 是转译产物（进 APK）
# chrome44 断崖全踏平（async/await/箭头/模板串/展开→ES5），老 WebView 语法死这颗历史雷一把拆完
node "$ROOT/tools/transpile.cjs" 44 || { echo "transpile FAILED"; exit 1; }

DNA="$APP/assets/skeleton"
rm -rf "$DNA"; mkdir -p "$DNA/java" "$DNA/res"
cp "$ROOT/build.sh" "$DNA/build.sh"
cp "$APP/AndroidManifest.xml" "$DNA/AndroidManifest.xml"
find "$APP/java" -name '*.java' -exec cp {} "$DNA/java/" \;
cp "$APP/java/com/dsh/app/llamajni.cpp" "$DNA/java/"
cp "$APP/res/values/strings.xml" "$APP/res/values/styles.xml" "$DNA/res/"
base64 -w0 "$APP/res/drawable/ic_launcher.png" > "$DNA/res_icon.b64"
if [ -f "$ROOT/keystore.jks" ]; then base64 -w0 "$ROOT/keystore.jks" > "$DNA/keystore.b64"; fi
echo "  骨架 DNA 已刻入 assets/skeleton/（$(du -sh "$DNA" | cut -f1)）——APK 自带完整重建蓝图"

echo "[1/7] aapt2 编译资源"
"$BT/aapt2" compile --dir "$APP/res" -o "$OUT/res.zip"

echo "[2/7] aapt2 链接"
"$BT/aapt2" link -o "$OUT/base.apk" -I "$PLATFORM" \
  --manifest "$APP/AndroidManifest.xml" \
  --min-sdk-version 24 --target-sdk-version 34 \
  --version-code $VCODE --version-name $VER \
  --java "$OUT/gen" \
  "$OUT/res.zip" \
  -A "$APP/assets"

echo "[3/7] javac 编译 Java"
mkdir -p "$OUT/gen" # 🐳 v2.5.109-clean 125 轮：aapt2 --java 产出 R.java 进编译（whaleIcon 读 R.drawable.ic_launcher）
javac -classpath "$PLATFORM" -encoding UTF-8 \
  -d "$OUT/classes" \
  "$OUT/gen/com/dsh/app/R.java" \
  $(find "$APP/java" -name "*.java")

echo "[4/7] d8 转 dex"
"$BT/d8" --release --lib "$PLATFORM" --min-api 24 \
  --output "$OUT/dex" \
  $(find "$OUT/classes" -name "*.class")

echo "[5/7] 打包 dex + assets + 端侧引擎"
cd "$OUT"
cp "$OUT/base.apk" "$OUT/apk/unsigned.apk"
cd "$OUT/dex" && zip -qj "$OUT/apk/unsigned.apk" classes.dex
if [ "$HAVE_SO" = "1" ]; then cd "$OUT" && zip -q "$OUT/apk/unsigned.apk" lib/arm64-v8a/libdshllama.so; fi

echo "[6/7] zipalign 对齐"
"$BT/zipalign" -f -p 4 "$OUT/apk/unsigned.apk" "$OUT/apk/aligned.apk"

echo "[7/7] apksigner 签名（自签名证书）"
if [ ! -f "$ROOT/keystore.jks" ]; then
  keytool -genkeypair -v -keystore "$ROOT/keystore.jks" \
    -alias dsh -keyalg RSA -keysize 2048 -validity 10950 \
    -storepass dsharness123 -keypass dsharness123 \
    -dname "CN=DS Harness, OU=Personal, O=DSHarness, L=Local, ST=Local, C=CN" 2>/dev/null
fi
"$BT/apksigner" sign --ks "$ROOT/keystore.jks" \
  --ks-pass pass:dsharness123 --key-pass pass:dsharness123 \
  --out "$OUT/DS-Harness-$VER.apk" "$OUT/apk/aligned.apk"

"$BT/apksigner" verify --print-certs "$OUT/DS-Harness-$VER.apk" | head -4
echo ""
echo "APK 构建 SUCCESS: $OUT/DS-Harness-$VER.apk"
ls -la "$OUT/DS-Harness-$VER.apk"
