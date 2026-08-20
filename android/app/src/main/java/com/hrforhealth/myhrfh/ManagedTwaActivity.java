package com.hrforhealth.myhrfh;

import android.app.Activity;
import android.content.ComponentName;
import android.net.Uri;
import android.os.Bundle;

import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsService;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

import java.util.Collections;

public final class ManagedTwaActivity extends Activity {
    private static final Uri TRUSTED_ORIGIN = Uri.parse(BuildConfig.HRFH_TWA_ORIGIN);
    private static final Uri LAUNCH_URI = Uri.parse(BuildConfig.HRFH_TWA_ORIGIN);

    private CustomTabsServiceConnection serviceConnection;
    private boolean bound;
    private boolean launched;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        connectAndLaunch();
    }

    private void connectAndLaunch() {
        String provider = CustomTabsClient.getPackageName(this, Collections.emptyList());
        if (provider == null) {
            launchFallback();
            return;
        }

        serviceConnection = new CustomTabsServiceConnection() {
            @Override
            public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
                client.warmup(0L);
                NativeManagementBridge bridge = new NativeManagementBridge(
                        ManagedTwaActivity.this,
                        TRUSTED_ORIGIN
                );
                CustomTabsSession session = client.newSession(bridge);
                if (session == null) {
                    launchFallback();
                    return;
                }

                bridge.attachSession(session);
                session.validateRelationship(
                        CustomTabsService.RELATION_USE_AS_ORIGIN,
                        TRUSTED_ORIGIN,
                        null
                );
                launchTrusted(session);
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {
                // The portal remains usable if the browser service disconnects; management stays unavailable.
            }
        };

        bound = CustomTabsClient.bindCustomTabsService(this, provider, serviceConnection);
        if (!bound) {
            launchFallback();
        }
    }

    private void launchTrusted(CustomTabsSession session) {
        if (launched) {
            return;
        }

        try {
            new TrustedWebActivityIntentBuilder(LAUNCH_URI)
                    .build(session)
                    .launchTrustedWebActivity(this);
            launched = true;
        } catch (RuntimeException exception) {
            launchFallback();
        }
    }

    private void launchFallback() {
        if (launched) {
            return;
        }

        try {
            new TrustedWebActivityIntentBuilder(LAUNCH_URI)
                    .buildCustomTabsIntent()
                    .launchUrl(this, LAUNCH_URI);
            launched = true;
        } catch (RuntimeException exception) {
            finish();
        }
    }

    @Override
    protected void onDestroy() {
        if (bound && serviceConnection != null) {
            unbindService(serviceConnection);
            bound = false;
        }
        super.onDestroy();
    }
}
