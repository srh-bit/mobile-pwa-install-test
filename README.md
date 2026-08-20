# HRFH web app installer

Device-aware, HR for Health-branded web-app installation experience targeting **https://myhrfh.com**.

The repository is the release candidate for the public installer experience. The current GitHub Pages deployment is the **staging/device-validation host**; the final production deployment should serve the installer assets from the `myhrfh.com` origin as described in [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md).

## User experience

The installer is capability-first and platform-aware:

1. Running as the installed web app → open `https://myhrfh.com` immediately before installer UI paints.
2. Installation confirmed by a supported browser → show **HRFH web app is installed** with:
   - **Open HRFH web app**
   - **Restore shortcut**
   - **Uninstall** instructions
3. Native PWA install capability available → show **Install HRFH web app** and invoke the browser's native prompt.
4. iPhone/iPad → prefer Google Chrome when available, with Safari as the fallback; both use Apple's required Share → Add to Home Screen flow.
5. Android without the native event → provide the browser-menu install fallback.
6. Mac Safari → provide **File → Add to Dock** guidance.
7. Other/indeterminate browsers → provide conservative install guidance without falsely claiming installed or not installed.

## Installed-state behavior

A public website can sometimes confirm that the PWA is installed through `navigator.getInstalledRelatedApps()`, but that capability is not universal. The implementation therefore uses three states: **installed**, **not installed**, and **unknown**.

A website cannot reliably determine whether the app's icon is currently visible on the home screen, desktop, Dock, taskbar, or launcher. For a confirmed installation, **Restore shortcut** provides platform-specific steps rather than claiming that icon placement has been detected.

A website also cannot silently uninstall the app. **Uninstall** provides browser/device-specific removal steps and keeps removal under user control.

## Current supported paths

- Android Chrome / supported Chromium native install prompt
- Android browser-menu fallback
- iPhone/iPad Chrome Share → Add to Home Screen
- iPhone/iPad Safari fallback with the same Apple-controlled install step
- Windows Chrome and Edge native PWA installation
- Current supported Chromium installed-state detection
- Windows Chrome/Edge shortcut restore and uninstall guidance
- macOS Chrome/Edge native PWA installation when supported
- macOS Safari Add to Dock guidance
- generic desktop/browser fallback

## Branding and launch behavior

- professional HR for Health light/purple/orange/coral visual system
- sentence-case, concise public copy
- local transparent 192×192 and 512×512 HRFH mark-only PNG icons
- no maskable icon that would force a solid launcher background
- dedicated `launch.html` pre-paint redirect to prevent the installer page flashing on app launch
- legacy standalone redirect in `index.html` for previously installed builds

## GitHub Pages staging limitation

A PWA `start_url` must remain within the origin/scope where it is installed. The staging manifest therefore launches a minimal GitHub Pages `launch.html` shell, which redirects immediately to `https://myhrfh.com` before the installer UI renders.

Android/Chrome can still show a Chrome badge when the staging origin is installed as a website shortcut instead of a full WebAPK. That badge is platform UI and is not embedded in the HRFH icon.

For the strongest no-intermediary/no-browser-badge production experience, host the manifest, service worker, icons, installer, and launch route directly on `myhrfh.com` and review the final service-worker scope before publishing broadly.

## Public-readiness safeguards

- no credentials, Salesforce access, analytics, PII collection, or native packages
- fixed `https://myhrfh.com` destination
- same-origin-only service-worker interception
- network-first navigation freshness for the installer shell
- no programmatic uninstall or consent bypass
- `no-referrer` and staging/public installer `noindex, nofollow` metadata
- accessible management dialog and visible keyboard focus states
- reduced-motion support
- deterministic Node.js regression suite

See:

- [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md) for browser scenarios, deployment headers, failure handling, accessibility, and release checklist.
- [`SECURITY.md`](SECURITY.md) for the security boundary and private reporting guidance.

## Device retesting

### Android

1. For a clean first-install test, remove the previously installed web app, not only its Home Screen icon.
2. Open `https://srh-bit.github.io/mobile-pwa-install-test/` in Chrome and refresh once.
3. Confirm **Install HRFH web app** appears when Chrome exposes its native prompt.
4. Install and verify the transparent HRFH mark artwork.
5. Revisit the installer in a supported browser and confirm the Installed state when the browser can prove installation.
6. Test **Restore shortcut** after removing only the launcher shortcut while leaving the app installed.
7. Test **Uninstall** instructions.

### iPhone / iPad

1. Open the staging installer in Safari.
2. Confirm Google Chrome is prioritized with Safari retained as the fallback.
3. In Chrome, confirm Chrome Share → **Add to Home Screen** guidance.
4. Without Chrome available, confirm Safari Share → **Add to Home Screen** remains usable.
5. Launch the added web app and confirm the installer UI does not flash before `myhrfh.com` opens.

Normal iOS browser tabs cannot reliably confirm whether the web app is already installed or whether its Home Screen icon exists; the public UI does not make that false claim.

### Windows / Chromium

1. Fully uninstall myHRFH from browser app management to test a first install.
2. Reload the installer and confirm the native install action appears when available.
3. Install it and revisit the installer; supported Chromium should show the Installed management state.
4. Delete only the desktop shortcut while keeping the PWA installed.
5. Revisit the installer and use **Restore shortcut** (`chrome://apps` or `edge://apps`, depending on browser).
6. Verify the Uninstall guidance independently.

### macOS

- Chrome/Edge: validate the native install path and installed management where supported.
- Safari: validate **File → Add to Dock**, launch behavior, and Applications/Dock removal guidance.

## Validation

GitHub Actions runs the full deterministic Node.js test suite on the feature branch and pull requests:

```text
node --test tests/*.mjs
```

The suite covers manifest identity, native icon metadata, launch behavior, device/browser detection, iOS Chrome priority, desktop installed-state detection, public installed-management states, service-worker boundaries/freshness, accessibility hooks, production safeguards, and production/security documentation.

## Release boundary

Automated green status means the installer implementation meets repository acceptance checks. Public production launch additionally requires:

- same-origin deployment under `myhrfh.com`;
- production HTTP security/cache headers;
- final service-worker scope review;
- clean physical-device acceptance on supported Android, iOS/iPadOS, Windows, and macOS paths.

PR #1 intentionally remains draft until that device acceptance is complete.
