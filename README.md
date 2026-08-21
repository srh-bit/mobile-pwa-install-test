# myHRFH web app installer

This repository contains the public staging implementation for adding the HR for Health portal as a browser-installed Progressive Web App (PWA). The supported release architecture is **PWA-only**: there is no Android APK, Trusted Web Activity wrapper, native bridge, Play Store dependency, or sideload distribution requirement.

Staging URL: `https://srh-bit.github.io/mobile-pwa-install-test/`

The final portal destination is fixed to `https://myhrfh.com`.

## Restored Android and desktop install behavior

The Android/Desktop install controller is intentionally restored to the exact behavior that existed immediately before the first Marketing package was introduced.

- Known-good pre-Marketing baseline: `3251b8addb47cd9169afe365b8689b3aab69c561`
- First Marketing-package commit: `09191a2fb6540cf9adc8f449e0bd17888675e82d`

On Chromium, the page waits up to 1.2 seconds for the browser's real `beforeinstallprompt` capability. **Install HRFH web app** is shown only when that live native prompt exists. The custom button is not used as a manual fallback and therefore is never left visible with nothing actionable behind it.

If Chromium does not expose a native prompt, Android shows browser-menu **Install app** guidance and desktop Chrome/Edge show the browser's **Install app** / install-icon guidance. macOS Safari uses **File → Add to Dock**.

The manifest declares the PWA as its own related web app so supported Android Chrome versions can use `navigator.getInstalledRelatedApps()` as direct installed-PWA evidence. A positive related-app result, standalone launch, accepted install, or `appinstalled` records installed state. A successful empty Android related-app result means not installed and clears stale receipt state. Unsupported/error states remain unknown and may conservatively use the same-origin install receipt, matching the pre-Marketing controller.

When Android installation is confirmed, the installed state remains intentionally simple: **Open HRFH web app** and **Reinstall**. There is no Restore or Uninstall control.

A website cannot inspect or verify whether the Android Home Screen/launcher icon itself remains present after installation.

## iPhone and iPad

iOS behavior is intentionally unchanged. It keeps the approved direct Share / More / Add to Home Screen guidance and does not depend on Chromium's programmable PWA install event.

## Security and privacy

The installer collects no credentials, PII, analytics identifiers, advertising identifiers, or Salesforce data. The service worker intercepts same-origin GET traffic only. There is no native Android code, arbitrary URL/Intent/package bridge, signing material, or APK distribution surface.

The visible brand mark currently loads from the approved `https://hrforhealth.com/wp-content/uploads/2024/04/Logo-icon-1.png.webp` asset. Production CSP must explicitly allow that HTTPS image origin if the asset remains external at release time.

See `SECURITY.md`, `docs/ANDROID-PWA-RECOVERY.md`, and `docs/PRODUCTION-READINESS.md`.

## Repository validation

Every candidate head runs:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

Current cache identity: `myhrfh-installer-v10`. Restored controller revision: `pre-marketing-install-behavior-v1`. Android recovery revision: `android-pwa-recovery-v2`. Android installed UI revision: `android-installed-ui-v1`. iOS guidance revision: `ios-final-guidance-v2`.

The cache was deliberately rotated from v9 to v10 so devices that previously loaded the broken Android/Desktop controller cannot continue serving the old cached `install.js`.

Staging validation deliberately does **not** create or upload the Marketing ZIP. The intended Marketing route remains `https://hrfh.hrforhealth.com/web-install/`; packaging is a separate post-device-acceptance step after physical Android/Desktop staging validation.

Physical-device acceptance is still required before Marketing handoff. `main` is not used as a live production deployment target during staging validation.
