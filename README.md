# mobile-pwa-install-test

Temporary device-aware PWA install-experience test for iPhone/iPad, Android, Windows, and Mac, branded for HR for Health and targeting **https://myhrfh.com**.

## What this prototype proves

- capability-first install handling with platform-aware guidance
- Android native install prompting when supported
- iPhone/iPad Safari Add to Home Screen guidance
- Windows and other desktop native install prompting when supported
- Mac Safari Add to Dock guidance
- professional HR for Health installer presentation
- local 192×192 and 512×512 HRFH PNG icons, including maskable variants
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

## Important test limitation

A true installed PWA must launch from the same origin where the user installs it. Because this proof of concept is hosted on GitHub Pages, its manifest launches the GitHub Pages origin and the installed test shell immediately forwards to `https://myhrfh.com` when launched.

For the final production app to launch `myhrfh.com` directly without the GitHub forwarding shell, the small manifest/icon/install metadata set will need to be served from `https://myhrfh.com` itself.

## Android retest

1. Delete any previously installed test shortcut so Android cannot reuse old launcher metadata.
2. Open `https://srh-bit.github.io/mobile-pwa-install-test/` in Chrome.
3. Refresh once so the latest service worker is active.
4. Tap **Install HRFH web app** and confirm the native install dialog.
5. Confirm the native dialog and Home Screen icon both use HR for Health branding and the app name is **myHRFH**.
6. Launch **myHRFH** and confirm it immediately opens `https://myhrfh.com`.

If the native install event is unavailable, the page provides a short browser-menu fallback instead.

## iPhone/iPad retest

1. Delete any previously installed test shortcut.
2. Open `https://srh-bit.github.io/mobile-pwa-install-test/` in Safari.
3. Refresh once.
4. Follow **Share → Add to Home Screen → Add**.
5. Confirm the Home Screen icon uses HR for Health branding and the name is **myHRFH**.
6. Launch it and confirm it immediately opens `https://myhrfh.com`.

If the page is opened in another iOS browser, it directs the user to Safari.

## Desktop retest

### Windows / Chromium-based browser

1. Open the test URL.
2. When the browser exposes native PWA installation, confirm the page says **Install the HRFH web app** and refers to **this computer**, not a home screen.
3. Tap **Install HRFH web app** and confirm the native desktop prompt.
4. Launch the installed app and confirm it opens `https://myhrfh.com`.

### Mac Safari

1. Open the test URL in Safari.
2. Confirm the page provides **File → Add to Dock** guidance.
3. Add the web app and confirm the HR for Health branding.

## Validation

The repository uses only Node.js built-ins for deterministic checks:

```text
node --test tests/validate.mjs
```

GitHub Actions runs the same validation on the feature branch and on pull requests to `main`. Validation checks manifest identity, device/platform detection, capability-first install handling, iOS/Android/desktop copy, direct-launch behavior, HRFH visual tokens, same-origin service-worker safety, PNG signatures/dimensions, branded icon asset sizes, and cache rotation.

## Scope

This repository contains no production credentials, Salesforce access, analytics, production-site changes, configuration profiles, APKs, or other native packages.
