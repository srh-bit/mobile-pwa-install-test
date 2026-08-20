package com.hrforhealth.myhrfh;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;

import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsService;
import androidx.browser.customtabs.CustomTabsSession;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.Set;

final class NativeManagementBridge extends CustomTabsCallback {
    private static final int VERSION = 1;
    private static final Set<String> ALLOWED_STATUSES = Set.of(
            "requested", "already-present", "unsupported", "rejected", "error"
    );

    private final Context appContext;
    private final Uri trustedOrigin;
    private CustomTabsSession session;
    private boolean relationshipValidated;
    private boolean navigationFinished;
    private boolean channelRequested;
    private boolean channelReady;

    NativeManagementBridge(Context context, Uri trustedOrigin) {
        this.appContext = context.getApplicationContext();
        this.trustedOrigin = trustedOrigin;
    }

    void attachSession(CustomTabsSession session) {
        this.session = session;
        maybeRequestMessageChannel();
    }

    @Override
    public void onRelationshipValidationResult(int relation, Uri requestedOrigin, boolean result, Bundle extras) {
        if (relation == CustomTabsService.RELATION_USE_AS_ORIGIN
                && result
                && requestedOrigin != null
                && sameOrigin(requestedOrigin.toString(), trustedOrigin.toString())) {
            relationshipValidated = true;
            maybeRequestMessageChannel();
        }
    }

    @Override
    public void onNavigationEvent(int navigationEvent, Bundle extras) {
        if (navigationEvent == CustomTabsCallback.NAVIGATION_FINISHED) {
            navigationFinished = true;
            maybeRequestMessageChannel();
        }
    }

    private void maybeRequestMessageChannel() {
        if (!relationshipValidated || !navigationFinished || channelRequested || session == null) {
            return;
        }
        channelRequested = session.requestPostMessageChannel(
                trustedOrigin,
                trustedOrigin,
                Bundle.EMPTY
        );
    }

    @Override
    public void onMessageChannelReady(Bundle extras) {
        if (!relationshipValidated || session == null || !channelRequested) {
            return;
        }
        channelReady = true;
        session.postMessage(buildHandshakeJson(), null);
    }

    @Override
    public void onPostMessage(String message, Bundle extras) {
        if (!relationshipValidated || !channelReady || session == null) {
            return;
        }

        final ManagementCommand command;
        try {
            command = ManagementCommand.parse(message);
        } catch (IllegalArgumentException exception) {
            return;
        }

        String status;
        if ("restore-shortcut".equals(command.getAction())) {
            status = ShortcutController.requestRestore(appContext);
        } else if ("uninstall".equals(command.getAction())) {
            status = UninstallController.requestUninstall(appContext);
        } else {
            status = "rejected";
        }

        if (!ALLOWED_STATUSES.contains(status)) {
            status = "error";
        }
        session.postMessage(buildResultJson(command.getRequestId(), status), null);
    }

    static boolean sameOrigin(String left, String right) {
        try {
            URI a = new URI(left);
            URI b = new URI(right);
            return normalizedScheme(a).equals(normalizedScheme(b))
                    && normalizedHost(a).equals(normalizedHost(b))
                    && effectivePort(a) == effectivePort(b);
        } catch (URISyntaxException | NullPointerException exception) {
            return false;
        }
    }

    private static String normalizedScheme(URI uri) {
        return uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
    }

    private static String normalizedHost(URI uri) {
        return uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
    }

    private static int effectivePort(URI uri) {
        if (uri.getPort() >= 0) {
            return uri.getPort();
        }
        return "https".equals(normalizedScheme(uri)) ? 443
                : "http".equals(normalizedScheme(uri)) ? 80 : -1;
    }

    static String buildHandshakeJson() {
        JsonObject object = new JsonObject();
        object.addProperty("type", "hrfh-native");
        object.addProperty("version", VERSION);
        JsonArray capabilities = new JsonArray();
        capabilities.add("restore-shortcut");
        capabilities.add("uninstall");
        object.add("capabilities", capabilities);
        return object.toString();
    }

    static String buildResultJson(String requestId, String status) {
        JsonObject object = new JsonObject();
        object.addProperty("type", "hrfh-management-result");
        object.addProperty("version", VERSION);
        object.addProperty("requestId", requestId);
        object.addProperty("status", ALLOWED_STATUSES.contains(status) ? status : "error");
        return object.toString();
    }
}
