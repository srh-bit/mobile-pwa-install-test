# mobile-pwa-install-test

Temporary device-aware PWA install-experience test for iPhone/iPad, Android, Windows, and Mac, branded for HR for Health and targeting **https://myhrfh.com**.

## What this prototype proves

- capability-first install handling with platform-aware guidance
- Android native install prompting when supported
- iPhone/iPad Safari Add to Home Screen guidance
- Windows and other desktop native install prompting when supported
- Mac Safari Add to Dock guidance
- professional HR for Health installer presentation
- local transparent 192×192 and 512×512 HRFH mark-only PNG icons
- a dedicated pre-paint launch shell so the installer UI does not flash before forwarding
- immediate forwarding from the installed app to `https://myhrfh.com`
- no production-site, Salesforce, credential, analytics, or native-package changes

## Detection order

The installer prioritizes the actual browser capability rather than relying only on a device name:

1. Already running as an installed web app → open `https://myhrfh.com` immediately.
2. Browser exposes the native PWA install event → show **Install HRFH web app** with device-appropriate copy.
3. iPhone/iPad → show Safari-specific Add to Home Screen guidance.
4. Android without the install event → show the browser-menu fallback.
5. Mac Safari → show **File → Add to Dock** guidance.
6. Other desktop browsers → show a concise desktop install-menu fallback.

## Important test limitations

A PWA start URL must remain on the origin where the app is installed. Because this proof of concept is hosted on GitHub Pages, the manifest launches a tiny same-origin `launch.html` shell. Its redirect runs in the document head before installer UI is rendered and forwards immediately to `https://myhrfh.com`.

The manifest intentionally uses only standard transparent `purpose: any` icons. Maskable icons are not exposed because Android is allowed to composite transparent maskable artwork over a solid fill, which works against the desired orange/coral mark-only treatment.

Android can still display a browser badge when it installs the site as a browser shortcut rather than minting a WebAPK. That badge is controlled by Chrome/Android and is not embedded in the HRFH icon asset. The final production implementation should serve the manifest, icons, service worker, and launch route directly from `https://myhrfh.com` to remove the GitHub intermediary and give the browser the strongest native-install path.

## Android retest

1. Delete any previously installed test shortcut so Android cannot reuse old launcher metadata or install type.
2. Open `https://srh-bit.github.io/mobile-pwa-install-test/` in Chrome.
3. Refresh once so the latest service worker and manifest are active.
4. Tap **Install HRFH web app** and confirm the native install dialog.
5. Confirm the source artwork is the orange/coral HRFH mark without the previous baked tile.
6. Launch **myHRFH** and confirm the installer page does not appear before `https://myhrfh.com` opens.

If Chrome still overlays its badge after a clean reinstall, the device/browser has installed a website shortcut rather than an unbadged WebAPK; changing the icon artwork cannot remove that platform overlay.

## iPhone/iPad retest

1. Delete any previously installed test shortcut.
2. Open `https://srh-bit.github.io/mobile-pwa-install-test/` in Safari.
3. Refresh once.
4. Follow **Share → Add to Home Screen → Add**.
5. Confirm the Home Screen icon uses HR for Health branding and the name is **myHRFH**.
6. Launch it and confirm the installer page does not appear before `https://myhrfh.com` opens.

If the page is opened in another iOS browser, it directs the user to Safari.

## Desktop retest

### Windows / Chromium-based browser

1. Open the test URL.
2. When the browser exposes native PWA installation, confirm the page says **Install the HRFH web app** and refers to **this computer**, not a home screen.
3. Tap **Install HRFH web app** and confirm the native desktop prompt.
4. Launch the installed app and confirm it opens `https://myhrfh.com` without rendering the installer first.

### Mac Safari

1. Open the test URL in Safari.
2. Confirm the page provides **File → Add to Dock** guidance.
3. Add the web app and confirm the HR for Health branding.

## Validation

The repository uses only Node.js built-ins for deterministic checks:

```text
node --test tests/validate.mjs
```

GitHub Actions runs the same validation on the feature branch and on pull requests to `main`. Validation checks manifest identity, device/platform detection, capability-first install handling, iOS/Android/desktop copy, the dedicated pre-paint launch shell, HRFH visual tokens, same-origin service-worker safety, transparent PNG metadata, and cache rotation.

## Scope

This repository contains no production credentials, Salesforce access, analytics, production-site changes, configuration profiles, APKs, or other native packages.
