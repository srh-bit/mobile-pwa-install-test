# HRFH managed Android package

This directory contains the optional HRFH-owned Android Trusted Web Activity package. The public browser PWA remains the default Android install path; this package exists only for Android-native management actions that a webpage cannot perform.

## Current build contract

- Java 17
- Android Gradle Plugin 9.3.1
- Gradle 9.5.0
- compileSdk 36 / targetSdk 36 / minSdk 26
- AndroidX Browser 1.10.0
- Gson 2.14.0

API 36 is the current stable CI target and satisfies the Google Play requirement effective August 31, 2026. Android 17/API 37 is a preview SDK and is not used as the production build baseline.

## Validation

From a trusted CI/development environment with Android SDK 36 installed:

```text
gradle -p android testDebugUnitTest lintDebug assembleDebug
```

GitHub Actions is the repository acceptance path. The workflow may retry this exact gate once only when Maven Central explicitly returns HTTP 429/Too Many Requests; ordinary compile, unit-test, or lint failures are never retried or ignored. Debug APK output is validation evidence only and is not published or treated as a production package.

## Release inputs

`HRFH_ANDROID_APPLICATION_ID` overrides the staging application ID. `HRFH_TWA_ORIGIN` is a guarded build property and must equal exactly `https://myhrfh.com`; the build fails closed if a different origin is supplied.

The Android app-side asset statement declares `delegate_permission/common.handle_all_urls` for `https://myhrfh.com`. The production website statement at `https://myhrfh.com/.well-known/assetlinks.json` must point back to the approved Android package/signing certificate and include both `delegate_permission/common.handle_all_urls` and `delegate_permission/common.use_as_origin`.

Production requires an approved package ID and approved signing certificate fingerprint. Copy `assetlinks.production.template.json`, replace both explicit placeholders, validate the JSON, and deploy the resulting statement at exactly:

`https://myhrfh.com/.well-known/assetlinks.json`

The placeholders are **not deployable production trust** and must never be served unchanged. GitHub Pages project hosting cannot satisfy the production origin-root Digital Asset Links requirement for `myhrfh.com`.

Signing keys, passwords, Play credentials, production fingerprints, and generated production assetlinks files are not committed to this repository.

## Native security boundary

The package accepts no caller-selected origin, URL, package, Intent, command, or shell input. Digital Asset Links `delegate_permission/common.use_as_origin` must validate before the postMessage channel can become ready. A later failed relationship callback revokes native channel readiness immediately.

The bridge exposes exactly two commands:

- `restore-shortcut` uses `ShortcutManager.requestPinShortcut()` for stable shortcut ID `myhrfh-home`, after checking the package's own pinned shortcuts to avoid duplicates. Android/launcher confirmation remains authoritative.
- `uninstall` opens Android's `Intent.ACTION_DELETE` system UI for `context.getPackageName()` only. User confirmation remains authoritative.

No hidden/non-SDK API, reflection bridge, launcher database access, silent shortcut creation, silent uninstall, or arbitrary command execution is allowed. If trusted TWA launch itself fails at runtime, the package falls back to the same fixed portal URL in a normal Custom Tab; native management remains unavailable unless the validated relationship and MessagePort are actually established.

## Production acceptance still required

Repository compile/lint/test success does not authorize distribution. Production activation additionally requires approved application identity/signing, deployed Digital Asset Links, signed-build verification, physical Android testing of toolbar-free TWA trust and MessagePort capability handshake, shortcut confirmation/duplicate prevention, uninstall confirmation, native icon visual approval, and an explicit distribution decision.
