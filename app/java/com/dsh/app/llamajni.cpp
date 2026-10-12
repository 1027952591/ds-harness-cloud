// DS Harness 端侧离线推理引擎（llama.cpp b4604 JNI 桥）
// 设计铁律：
//  ① 全函数互斥锁——同一时刻仅一次推理，与 Java 侧 LlamaCore.GEN 双保险
//  ② 每轮生成结束后重建上下文（b4604 无公开 KV 清理 API）——零状态累积，绝无跨轮污染
//  ③ token 分片以 byte[] 回传（避开 JNI NewStringUTF 的 modified-UTF8 4 字节崩溃坑）
//  ④ 任何失败返回负数错误码，绝不抛 C++ 异常穿 JNI
#include <jni.h>
#include <string>
#include <vector>
#include <mutex>
#include "llama.h"

static std::mutex g_mutex;
static llama_model   * g_model = nullptr;
static llama_context * g_ctx   = nullptr;
static int             g_nCtx  = 1536;
static int             g_nThr  = 4;

static void ctxDrop() {
    if (g_ctx) { llama_free(g_ctx); g_ctx = nullptr; }
}

static bool ctxEnsure() {
    if (g_ctx) return true;
    if (!g_model) return false;
    llama_context_params cp = llama_context_default_params();
    cp.n_ctx            = (uint32_t) g_nCtx;
    cp.n_threads        = g_nThr;
    cp.n_threads_batch  = g_nThr;
    g_ctx = llama_init_from_model(g_model, cp);
    return g_ctx != nullptr;
}

// 加载模型（幂等：已加载直接返回成功）。返回 "" 成功，否则错误文案。
extern "C" JNIEXPORT jstring JNICALL
Java_com_dsh_app_LlamaCore_nativeLoad(JNIEnv *env, jclass, jstring jPath, jint nCtx, jint nThreads) {
    std::lock_guard<std::mutex> lk(g_mutex);
    if (g_model) return env->NewStringUTF("");
    const char *path = env->GetStringUTFChars(jPath, nullptr);
    if (!path) return env->NewStringUTF("路径读取失败");
    llama_model_params mp = llama_model_default_params();
    mp.n_gpu_layers = 0; // v1 纯 CPU（NDK vulkan 后端后续版本再启）
    g_model = llama_model_load_from_file(path, mp);
    env->ReleaseStringUTFChars(jPath, path);
    if (!g_model) return env->NewStringUTF("模型文件加载失败（可能下载不完整）");
    g_nCtx = nCtx > 256 ? nCtx : 1536;
    g_nThr = nThreads > 0 ? nThreads : 4;
    if (!ctxEnsure()) {
        llama_model_free(g_model); g_model = nullptr;
        return env->NewStringUTF("推理上下文创建失败（内存不足？）");
    }
    return env->NewStringUTF("");
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_dsh_app_LlamaCore_nativeReady(JNIEnv *, jclass) {
    return g_model ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT void JNICALL
Java_com_dsh_app_LlamaCore_nativeUnload(JNIEnv *, jclass) {
    std::lock_guard<std::mutex> lk(g_mutex);
    ctxDrop();
    if (g_model) { llama_model_free(g_model); g_model = nullptr; }
}

// 同步补全：prompt(ChatML 全文) → 逐 token 经 sink.sink(byte[]) 回传。
// 返回 >=0 生成的 token 数；-10 未加载 -11 分词失败 -12 回调缺失 -13 推理失败 -2 上下文放不下（调用方裁剪重试）
extern "C" JNIEXPORT jint JNICALL
Java_com_dsh_app_LlamaCore_nativeComplete(JNIEnv *env, jclass, jstring jPrompt, jint nMax, jobject sink) {
    std::lock_guard<std::mutex> lk(g_mutex);
    if (!g_model) return -10;
    if (!ctxEnsure()) return -10; // 🛡️ v2.5.55-pulse 64 轮：上轮末尾 ctxDrop 释放 KV 后此处自动重建——旧版只查 g_ctx 直接 return -10，端侧离线推理隔次必挂
    const char *prompt = env->GetStringUTFChars(jPrompt, nullptr);
    if (!prompt) return -11;
    std::string text(prompt);
    env->ReleaseStringUTFChars(jPrompt, prompt);

    const llama_vocab *vocab = llama_model_get_vocab(g_model);
    int n_prompt = -llama_tokenize(vocab, text.c_str(), (int32_t) text.size(), nullptr, 0, true, true);
    if (n_prompt <= 0) return -11;
    std::vector<llama_token> tokens((size_t) n_prompt);
    if (llama_tokenize(vocab, text.c_str(), (int32_t) text.size(), tokens.data(), n_prompt, true, true) < 0) return -11;

    const uint32_t nCtx = llama_n_ctx(g_ctx);
    if ((uint32_t) n_prompt + 16 >= nCtx) return -2; // 放不下：调用方裁剪对话后重试
    int nGen = (int) nCtx - n_prompt - 8;
    if (nGen > nMax) nGen = nMax;
    if (nGen <= 0) return -2;

    jclass cls = env->GetObjectClass(sink);
    if (!cls) return -12;
    jmethodID mid = env->GetMethodID(cls, "sink", "([B)V");
    if (!mid) return -12;

    llama_sampler *smpl = llama_sampler_chain_init(llama_sampler_chain_default_params());
    llama_sampler_chain_add(smpl, llama_sampler_init_penalties(64, 1.12f, 0.0f, 0.0f)); // 防复读
    llama_sampler_chain_add(smpl, llama_sampler_init_top_k(40));
    llama_sampler_chain_add(smpl, llama_sampler_init_top_p(0.95f, 1));
    llama_sampler_chain_add(smpl, llama_sampler_init_temp(0.8f));
    llama_sampler_chain_add(smpl, llama_sampler_init_dist(LLAMA_DEFAULT_SEED));

    llama_batch batch = llama_batch_get_one(tokens.data(), n_prompt);
    int generated = 0;
    jint ret = 0;
    for (; generated < nGen; generated++) {
        if (llama_decode(g_ctx, batch) != 0) { ret = -13; break; }
        llama_token id = llama_sampler_sample(smpl, g_ctx, -1);
        if (llama_vocab_is_eog(vocab, id)) break;
        char buf[512];
        int n = llama_token_to_piece(vocab, id, buf, sizeof(buf), 0, false);
        if (n > 0) {
            jbyteArray arr = env->NewByteArray(n);
            if (!arr) { ret = -12; break; }
            env->SetByteArrayRegion(arr, 0, n, (const jbyte *) buf);
            env->CallVoidMethod(sink, mid, arr);
            env->DeleteLocalRef(arr);
            if (env->ExceptionCheck()) { env->ExceptionClear(); ret = -12; break; }
        }
        llama_sampler_accept(smpl, id);
        batch = llama_batch_get_one(&id, 1);
    }
    llama_sampler_free(smpl);
    ctxDrop(); // 🧹 零状态累积：KV 释放，下轮重建（成本约 1s，换绝对干净）
    return ret < 0 ? ret : generated;
}
