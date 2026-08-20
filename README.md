# mobile-pwa-install-test

Temporary PWA install-experience test for iOS and Android, branded for HR for Health and targeting **https://myhrfh.com**.

## What this prototype proves

- Android native install prompting from a simple **Add to Home Screen** action
- iPhone/iPad Safari Add to Home Screen guidance
- professional HR for Health installer presentation
- local 192×192 and 512×512 HRFH PNG icons, including maskable variants
- immediate forwarding from the installed Home Screen icon to `https://myhrfh.com`
- no production-site, Salesforce, credential, analytics, or native-package changes

## Important test limitation

A true installed PWA must launch from the same origin where the user installs it. Because this proof of concept is hosted on GitHub Pages, its manifest launches the GitHub Pages origin and the installed test shell immediately forwards to `https://myhrfh.com` when launched from the Home Screen.

For the final production shortcut to launch `myhrfh.com` directly without the GitHub forwarding shell, the small manifest/icon/install metadata set will need to be served from `https://myhrfh.com` itself.

## Android retest

1. Delete any previously installed test shortcut so Android cannot reuse old icon metadata.
2. Open `https://srh-bit.github.io/mobile-pwa-install-test/` in Chrome.
3. Refresh once so the latest service worker and icon cache are active.
4. Tap **Add to Home Screen** and confirm the native install dialog.
5. Confirm the native dialog and Home Screen icon both use HR for Health branding and the app name is **myHRFH**.
6. Launch **myHRFH** and confirm it immediately opens `https://myhrfh.com`.

If Chrome does not expose the install prompt, use its browser menu and select **Install app** or **Add to Home screen**.

## iPhone/iPad retest

1. Delete any previously installed test shortcut.
2. Open `https://srh-bit.github.io/mobile-pwa-install-test/` in Safari.
3. Refresh once.
4. Tap **Share** → **Add to Home Screen**.
5. Keep **Open as Web App** enabled if Safari offers it, then tap **Add**.
6. Confirm the Home Screen icon uses HR for Health branding and the name is **myHRFH**.
7. Launch it and confirm it immediately opens `https://myhrfh.com`.

## Validation

The repository uses only Node.js built-ins for deterministic checks:

```text
node --test tests/validate.mjs
```

GitHub Actions runs the same validation on the feature branch and on pull requests to `main`. The validation checks the manifest, direct-launch behavior, HRFH visual tokens, same-origin service-worker safety, PNG signatures/dimensions, branded icon asset sizes, and cache rotation after icon replacement.

## Scope

This repository contains no production credentials, Salesforce access, analytics, production-site changes, configuration profiles, APKs, or other native packages.
