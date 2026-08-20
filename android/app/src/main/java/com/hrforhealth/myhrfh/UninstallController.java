package com.hrforhealth.myhrfh;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import java.util.regex.Pattern;

final class UninstallController {
    private static final Pattern PACKAGE_NAME = Pattern.compile(
            "[A-Za-z][A-Za-z0-9_]*(?:\\.[A-Za-z][A-Za-z0-9_]*)+"
    );

    private UninstallController() {
    }

    static String buildPackageUri(String packageName) {
        if (packageName == null || !PACKAGE_NAME.matcher(packageName).matches()) {
            throw new IllegalArgumentException("Invalid package identity");
        }
        return "package:" + packageName;
    }

    static String requestUninstall(Context context) {
        try {
            Intent intent = new Intent(
                    Intent.ACTION_DELETE,
                    Uri.parse(buildPackageUri(context.getPackageName()))
            );
            if (intent.resolveActivity(context.getPackageManager()) == null) {
                return "unsupported";
            }
            if (!(context instanceof Activity)) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            }
            context.startActivity(intent);
            return "requested";
        } catch (RuntimeException exception) {
            return "error";
        }
    }
}
