package com.dsh.app;

/* ⚖️ 最高指令（GENE·基因铁律，永不可移除）：每次动态拉取/更新/淘汰，必须强制深彻、
   全方位、无死角全球探查，事无巨细、仔细再仔细。本层为拍照 EXTRA_OUTPUT 的 content://
   暴露层（targetSdk>=24 相机直写必须走 content://），安全铁律：仅开放 files/picks/
   目录、路径规范化+白名单双重防穿越。 */
import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import java.io.File;

/**
 * 🔒 极简自研文件暴露 Provider（零 androidx 依赖，纯手搓 v2.5.0）：
 * 仅服务于系统相机 App 经 EXTRA_OUTPUT 直写 picks/photo_*.jpg。
 * 不提供 query/insert/update/delete（全返回 null/0）；openFile 仅写模式、
 * 文件名白名单（反斜杠/点点/隐藏名全拒）+ canonical path 越界校验。
 */
public class PickProvider extends ContentProvider {

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws java.io.FileNotFoundException {
        String seg = uri.getLastPathSegment();
        if (seg == null || seg.length() == 0) throw new java.io.FileNotFoundException("empty path");
        String name = seg.replace('\\', '_').replace('/', '_'); // 只允许单文件名，杜绝子目录
        if (name.contains("..") || name.startsWith(".") || name.length() > 200) throw new java.io.FileNotFoundException("illegal name");
        File dir = new File(getContext().getFilesDir(), "picks");
        File f = new File(dir, name);
        try {
            if (!f.getCanonicalPath().startsWith(dir.getCanonicalPath())) throw new java.io.FileNotFoundException("path escape");
        } catch (java.io.FileNotFoundException fnf) {
            throw fnf;
        } catch (Exception e) {
            throw new java.io.FileNotFoundException("canonical fail");
        }
        int m = ParcelFileDescriptor.MODE_READ_WRITE | ParcelFileDescriptor.MODE_CREATE | ParcelFileDescriptor.MODE_TRUNCATE;
        try {
            return ParcelFileDescriptor.open(f, m);
        } catch (java.io.FileNotFoundException fnf) {
            throw fnf;
        } catch (Exception e) {
            throw new java.io.FileNotFoundException("open fail");
        }
    }

    @Override
    public String getType(Uri uri) {
        return "application/octet-stream";
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        return null; // 不开放查询
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null; // 不开放插入
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        return 0; // 不开放删除
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return 0; // 不开放更新
    }
}
