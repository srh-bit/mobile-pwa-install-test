package com.hrforhealth.myhrfh;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.net.Uri;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

final class ShortcutController {
    static final String SHORTCUT_ID = "myhrfh-home";

    private ShortcutController() {
    }

    static String decide(boolean supported, Collection<String> pinnedIds) {
        if (!supported) {
            return "unsupported";
        }
        if (pinnedIds != null && pinnedIds.contains(SHORTCUT_ID)) {
            return "already-present";
        }
        return "requested";
    }

    static String requestRestore(Context context) {
        try {
            ShortcutManager manager = context.getSystemService(ShortcutManager.class);
            if (manager == null) {
                return "unsupported";
            }

            List<String> pinnedIds = new ArrayList<>();
            for (ShortcutInfo shortcut : manager.getPinnedShortcuts()) {
                pinnedIds.add(shortcut.getId());
            }

            String decision = decide(manager.isRequestPinShortcutSupported(), pinnedIds);
            if (!"requested".equals(decision)) {
                return decision;
            }

            Intent launchIntent = new Intent(context, ManagedTwaActivity.class)
                    .setAction(Intent.ACTION_VIEW)
                    .setData(Uri.parse(BuildConfig.HRFH_TWA_ORIGIN));
            ShortcutInfo shortcut = new ShortcutInfo.Builder(context, SHORTCUT_ID)
                    .setShortLabel(context.getString(R.string.shortcut_name))
                    .setIcon(Icon.createWithResource(context, R.drawable.ic_hrfh_launcher))
                    .setIntent(launchIntent)
                    .build();

            return manager.requestPinShortcut(shortcut, null) ? "requested" : "error";
        } catch (RuntimeException exception) {
            return "error";
        }
    }
}
