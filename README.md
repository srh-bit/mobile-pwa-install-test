# myHRFH web app installer

This repository contains the public staging implementation for adding the HR for Health portal as a browser-installed Progressive Web App (PWA). The supported release architecture is **PWA-only**: there is no Android APK, Trusted Web Activity wrapper, native bridge, Play Store dependency, or sideload distribution requirement.

Staging URL: `https://srh-bit.github.io/mobile-pwa-install-test/`

The final portal destination is fixed to `https://myhrfh.com`.

## Android PWA behavior

Android Chromium uses the browser's native PWA install flow when `beforeinstallprompt` is available.

- The manifest declares the PWA as its own related web app, allowing supported Android Chrome versions to use `navigator.getInstalledRelatedApps()` as direct installed-PWA evidence.
- A positive related-app result, a standalone launch, an accepted install, or `appinstalled` records installed state.
- On Android, when the related-app API is supported and successfully returns no matching self-PWA, that result is treated as **not installed** and any stale same-origin install receipt is cleared.
- When the related-app API is unavailable or errors, the same-origin receipt remains conservative fallback evidence.
- `beforeinstallprompt` never erases positive installed evidence by itself.
- **Reinstall** explicitly clears fallback receipt state and asks Chrome to reassess installability.

When Android installation is confirmed, the user-facing installed state is intentionally simple: **Open HRFH web app** and **Reinstall**. The confirmation card states that the **myHRFH icon was added to the Home Screen**.

A website cannot inspect or verify whether the Android Home Screen/launcher icon remains present after installation, so the installer does not expose a Restore or Uninstall control on Android.

## iPhone, iPad, and desktop

- iOS keeps the direct Share / More / Add to Home Screen guidance and never pretends Apple exposes a programmable install prompt.
- Desktop browsers use their normal PWA install UI and applicable shortcut guidance after confirmed installed state.
- Installed PWA launches forward to `https://myhrfh.com` before installer UI paints.

## Security and privacy

The installer collects no credentials, PII, analytics identifiers, advertising identifiers, or Salesforce data. The service worker intercepts same-origin GET traffic only. There is no native Android code, arbitrary URL/Intent/package bridge, signing material, or APK distribution surface.

See `SECURITY.md`, `docs/ANDROID-PWA-RECOVERY.md`, and `docs/PRODUCTION-READINESS.md`.

## Repository validation

Every candidate head runs:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

Current cache identity: `myhrfh-installer-v8`. Android recovery revision: `android-pwa-recovery-v2`. Android installed UI revision: `android-installed-ui-v1`. iOS guidance revision: `ios-final-guidance-v2`.

Physical-device acceptance is still required before broad production release, including Android install/refresh/installed detection/Reinstall, iPhone/iPad Safari and Chrome variants, desktop browser states, safe areas, zoom/reflow, reduced motion, and screen-reader operation.

`main` is not used as a live production deployment target during staging validation.