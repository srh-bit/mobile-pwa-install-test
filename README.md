# myHRFH web app installer

This repository contains the public staging implementation for installing quick access to the HR for Health portal, plus an optional compile-tested Android Trusted Web Activity (TWA) package for native management capabilities.

Staging URL: `https://srh-bit.github.io/mobile-pwa-install-test/`

The final portal destination is fixed to `https://myhrfh.com`.

## Browser installer

The browser path remains the default for Android, iPhone/iPad, Windows, and macOS.

- Android Chromium uses the native `beforeinstallprompt` flow when available.
- Positive Android install evidence from standalone launch, `navigator.getInstalledRelatedApps()`, accepted native installation, `appinstalled`, or the same-origin receipt wins before any later install prompt. A refresh therefore does not intentionally advertise a duplicate install.
- **Reinstall** is the only user action that deliberately clears the Android receipt and asks Chrome to reassess installability.
- Android fallback uses **Install app**, not a generic launcher bookmark that JavaScript cannot later verify.
- Installed PWA launches forward to `https://myhrfh.com` before installer UI paints.
- iOS keeps the direct Share / circled More / Add to Home Screen guidance and never pretends Apple exposes a programmable install prompt.
- Desktop installed-state and management guidance remain capability-gated.

A public webpage still cannot enumerate arbitrary Android launcher icons or silently remove an Android app.

## Managed Android capability

`android/` now contains an optional HRFH-owned TWA package built only with public Android APIs. It uses Java 17, AGP 9.3.1, Gradle 9.5.0, compile/target SDK 36, AndroidX Browser 1.10.0, and Gson 2.14.0.

The native bridge is **not** trusted merely because the user agent says Android. It becomes available only after AndroidX/Chrome validates `delegate_permission/common.use_as_origin` for the fixed `https://myhrfh.com` origin and establishes the postMessage MessagePort.

Only two capabilities exist:

- **Restore shortcut** — requests the package's stable `myhrfh-home` shortcut with `ShortcutManager.requestPinShortcut()` after checking the package's own pinned shortcuts. The launcher confirmation remains user-controlled.
- **Uninstall** — opens Android's system uninstall confirmation with `Intent.ACTION_DELETE` for the package itself only.

Ordinary Chrome/PWA Android sessions do not receive the native handshake, so Restore/Uninstall remain hidden there; Open + deliberate Reinstall remain the web-only contract.

## Digital Asset Links and production boundary

`android/assetlinks.production.template.json` contains explicit package/signing placeholders and both required relations: `handle_all_urls` and `use_as_origin`. The template is not deployable production trust.

GitHub Pages cannot establish production trust for `myhrfh.com`. Production native activation remains blocked on approved application ID, signing process/fingerprint, `https://myhrfh.com/.well-known/assetlinks.json`, signed-build verification, physical Android acceptance, and explicit distribution approval. No APK/AAB is published by this workflow.

## Security and privacy

The installer collects no credentials, PII, analytics identifiers, advertising identifiers, or Salesforce data. The web service worker intercepts same-origin GET traffic only. The native package exposes no arbitrary URL/Intent/package/shell/reflection bridge and uses no hidden/non-SDK Android APIs.

See `SECURITY.md`, `docs/PRODUCTION-READINESS.md`, and `android/README.md`.

## Repository validation

Every candidate head runs:

```text
node --check android-native-bridge.js
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
gradle -p android testDebugUnitTest lintDebug assembleDebug
```

Current cache identity: `myhrfh-installer-v7`. Android installed-state revision: `android-installed-state-v1`. Native management revision: `android-native-management-v1`. iOS guidance revision: `ios-final-guidance-v2`.

Physical-device acceptance is still required before broad production release, including Android clean install/refresh/uninstall/Reinstall, production TWA Digital Asset Links trust, Restore confirmation/duplicate prevention, native uninstall confirmation, iPhone/iPad Safari and Chrome variants, desktop browser states, safe areas, zoom/reflow, reduced motion, and screen-reader operation.

`main` is not used as a live production deployment target during staging validation.
