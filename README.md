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

### Restore Home Screen shortcut

A website can determine that its related PWA is installed on supported Android Chrome, but it **cannot inspect or verify whether the Android Home Screen/launcher icon itself is currently present**. Android does not expose the launcher's icon database to web pages.

For that reason, a confirmed installed Android PWA shows **Restore Home Screen shortcut**. The action gives the safe Android recovery path: open the app list, find **myHRFH**, touch and hold it, then add/drag it back to the Home Screen. If myHRFH is no longer in the app list, use **Reinstall** instead.

There is intentionally no Uninstall control in the installer.

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

Current cache identity: `myhrfh-installer-v8`. Android recovery revision: `android-pwa-recovery-v2`. iOS guidance revision: `ios-final-guidance-v2`.

Physical-device acceptance is still required before broad production release, including Android install/refresh/installed detection/Home Screen shortcut recovery/Reinstall, iPhone/iPad Safari and Chrome variants, desktop browser states, safe areas, zoom/reflow, reduced motion, and screen-reader operation.

`main` is not used as a live production deployment target during staging validation.