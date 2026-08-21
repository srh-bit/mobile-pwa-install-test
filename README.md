# myHRFH web app installer

This repository contains the public staging implementation for adding the HR for Health portal as a browser-installed Progressive Web App (PWA). The supported release architecture is **PWA-only**: there is no Android APK, Trusted Web Activity wrapper, native bridge, Play Store dependency, or sideload distribution requirement.

Staging URL: `https://srh-bit.github.io/mobile-pwa-install-test/`

The final portal destination is fixed to `https://myhrfh.com`.

## Android PWA behavior

Android Chromium uses the browser's native PWA install flow when `beforeinstallprompt` is available. The custom installer does not depend on that event arriving within an arbitrary timeout: while installation is not confirmed, **Install HRFH web app** remains visible. If Chromium has supplied `beforeinstallprompt`, the button opens the native install prompt. If it has not, the same button keeps concise browser-menu **Install app** guidance visible.

- The manifest declares the PWA as its own related web app, allowing supported Android Chrome versions to use `navigator.getInstalledRelatedApps()` as direct installed-PWA evidence.
- A positive related-app result, a standalone launch, an accepted install, or `appinstalled` records installed state.
- On Android, when the related-app API is supported and successfully returns no matching self-PWA, that result is treated as **not installed** and any stale same-origin install receipt is cleared.
- When the related-app API is unavailable or errors, the same-origin receipt remains conservative Android fallback evidence.
- A delivered `beforeinstallprompt` event is current browser installability evidence. It supersedes stale fallback receipt/rendered state and makes the native install action available.
- Dismissing a native prompt does not make the in-page Install action disappear permanently; the manual browser install path remains visible.
- **Reinstall** explicitly clears fallback receipt state and asks Chrome to reassess installability.

When Android installation is confirmed, the user-facing installed state is intentionally simple: **Open HRFH web app** and **Reinstall**. The confirmation card states that the **myHRFH icon was added to the Home Screen**.

A website cannot inspect or verify whether the Android Home Screen/launcher icon remains present after installation, so the installer does not expose a Restore or Uninstall control on Android.

## iPhone, iPad, and desktop

- iOS keeps the direct Share / More / Add to Home Screen guidance and never pretends Apple exposes a programmable install prompt.
- Desktop Chrome/Edge use the same resilient Install affordance model as Android: a live native prompt is used when available; otherwise browser-native installation guidance remains discoverable. macOS Safari keeps File → Add to Dock guidance.
- Local install receipts are not authoritative on desktop and cannot suppress a newly available Chromium install prompt.
- Installed PWA launches forward to `https://myhrfh.com` before installer UI paints.

## Security and privacy

The installer collects no credentials, PII, analytics identifiers, advertising identifiers, or Salesforce data. The service worker intercepts same-origin GET traffic only. There is no native Android code, arbitrary URL/Intent/package bridge, signing material, or APK distribution surface.

The visible brand mark currently loads from the approved `https://hrforhealth.com/wp-content/uploads/2024/04/Logo-icon-1.png.webp` asset. Production CSP must therefore explicitly allow that HTTPS image origin if the asset remains external at release time.

See `SECURITY.md`, `docs/ANDROID-PWA-RECOVERY.md`, and `docs/PRODUCTION-READINESS.md`.

## Repository validation

Every candidate head runs:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

Current cache identity: `myhrfh-installer-v9`. Non-iOS install-affordance revision: `android-desktop-install-affordance-v1`. Android recovery revision: `android-pwa-recovery-v2`. Android installed UI revision: `android-installed-ui-v1`. iOS guidance revision: `ios-final-guidance-v2`.

Staging validation deliberately does **not** create or upload the Marketing ZIP. The intended Marketing route remains `https://hrfh.hrforhealth.com/web-install/`; packaging is a separate post-acceptance step after physical Android/Desktop staging validation.

Physical-device acceptance is still required before broad production release, including Android install/refresh/installed detection/Reinstall, iPhone/iPad Safari and Chrome variants, desktop browser states, safe areas, zoom/reflow, reduced motion, and screen-reader operation.

`main` is not used as a live production deployment target during staging validation.