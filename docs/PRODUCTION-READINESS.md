# HRFH web app installer — production readiness

This document defines the production contract for the public HR for Health installer targeting `https://myhrfh.com` and its optional managed Android TWA capability.

## Governing state model

1. **Running as installed web app** — forward to `https://myhrfh.com` before installer UI paints.
2. **Installed confirmed / previously verified** — show Open; only show management capabilities the current execution context can actually perform.
3. **Installable** — show Chromium's native Install action only when there is no stronger positive installed evidence.
4. **Manual install** — show concise browser-specific guidance. Android fallback uses **Install app**; iOS uses Share / Add to Home Screen.
5. **Unknown** — never claim installed/not installed and never expose installed-only management.

## Android browser installation and duplicate prevention

`navigator.getInstalledRelatedApps()` is positive evidence only. Missing support, errors, or an empty result remain unknown. A same-origin boolean receipt `myhrfh-install-receipt-v1=installed` may be written after accepted native PWA installation, `appinstalled`, a real standalone launch, or positive related-app detection.

A later `beforeinstallprompt` **must not clear, erase, or invalidate** that receipt. Positive evidence is evaluated before installability so a refresh does not deliberately offer another installation after this installer observed success.

A webpage cannot reliably inspect an arbitrary Android launcher/Home Screen bookmark, shortcut, or icon. The browser-only Android installed state therefore shows **Open HRFH web app** plus deliberate **Reinstall** recovery. Reinstall is the explicit user boundary that clears the local receipt and lets Chrome reassess after actual removal; it is never an automatic downgrade.

## Managed Android TWA

The repository now contains an optional native Android package under `android/`. The browser PWA remains the default public path.

Current build baseline is Java 17, AGP 9.3.1, Gradle 9.5.0, compileSdk/targetSdk 36, minSdk 26, AndroidX Browser 1.10.0, and Gson 2.14.0. Android 16/API 36 satisfies the Google Play target requirement effective August 31, 2026. Android 17/API 37 remains a preview and is not the stable CI baseline.

### Trust chain

Native Restore/Uninstall must remain unavailable unless Digital Asset Links and the TWA session establish the complete trust chain:

1. fixed origin from build configuration defaults to `https://myhrfh.com`;
2. AndroidX validates `delegate_permission/common.use_as_origin` for that exact origin;
3. navigation completes and the session requests a postMessage channel for that same origin;
4. `onMessageChannelReady` sends the `hrfh-native` handshake;
5. web code accepts the first MessagePort only when `MessageEvent.origin === https://myhrfh.com` and the handshake contains only allowlisted capabilities.

Browser user agent, query parameters, local/session storage, or a plain installed-state receipt cannot create native readiness.

### Native command contract

Protocol version 1 accepts only bounded JSON fields `type`, `version`, `requestId`, and `action`. `requestId` is `[A-Za-z0-9_-]{1,64}`. Allowed actions are exactly `restore-shortcut` and `uninstall`; extra URL, Intent, package, command, shell, or other executable parameters are rejected.

**Restore shortcut** uses public `ShortcutManager.getPinnedShortcuts()` for the package's own stable `myhrfh-home` ID. If already present, it returns `already-present`; otherwise `requestPinShortcut()` opens launcher-controlled confirmation. It never enumerates unrelated launcher content.

**Uninstall** uses Android's public system uninstall / package-removal UI through `Intent.ACTION_DELETE` and `package:<context.getPackageName()>`. The system confirmation is authoritative; the app never silently removes itself or another package.

No hidden/private/non-SDK APIs, reflection, launcher-provider database access, `INSTALL_SHORTCUT`, `DELETE_PACKAGES`, arbitrary intents, shell execution, or runtime code execution are permitted.

### Digital Asset Links release boundary

`android/assetlinks.production.template.json` contains `delegate_permission/common.handle_all_urls` and `delegate_permission/common.use_as_origin` with explicit package/signing placeholders. Those placeholders are not production trust.

Before native production activation, an approved package ID and approved signing certificate SHA-256 fingerprint must be deployed at exactly `https://myhrfh.com/.well-known/assetlinks.json`. GitHub Pages project hosting cannot substitute for this origin-root relationship. Production signing/distribution credentials remain outside this repository.

## iPhone and iPad guidance

Apple does not expose an Android-style programmable Add to Home Screen prompt. The assistant remains direct and short and does not ask users to identify toolbar layout.

- **Share** uses an outlined square with upward arrow.
- **More** uses an outlined circle with three horizontal dots.
- **Add to Home Screen** uses an outlined rounded square with plus.

On iPhone Safari: **Tap Share, or More if Share isn't shown. Then choose Share.** Continue with **Add to Home Screen → Open as Web App → Add** when Apple presents those controls; **Edit Actions → Add to Home Screen** remains recovery.

On iPhone Chrome portrait: **Tap Share beside the address bar** without claiming whether that bar is top or bottom. Chrome landscape and iPad Chrome/Safari may use the high-confidence top-right Share cue. No generic `navigator.share()` call is treated as an install API.

Guidance remains safe-area aware, responsive to orientation/viewport changes, keyboard/screen-reader understandable, and honors reduced motion. No toolbar calibration/questionnaire state is stored.

## Desktop behavior

Windows Chrome/Edge and supported macOS browsers continue to use positive installed evidence/native install prompts where available. Restore/uninstall browser guidance appears only after confirmed installed state and never claims direct launcher/package access the browser does not have.

## Browser/device matrix

| Environment | Install path | Installed management |
| --- | --- | --- |
| Android Chrome/Chromium | positive evidence first; native prompt; **Install app** fallback | Browser only: Open + Reinstall |
| Trusted HRFH Android TWA | fixed-origin Digital Asset Links + TWA | Capability handshake only: user-confirmed Restore + system uninstall handoff |
| iPhone/iPad Chrome | Share → Add to Home Screen | Conservative; no native Android controls |
| iPhone/iPad Safari | Share or More → Share → Add to Home Screen → Open as Web App → Add | Conservative |
| Windows Chrome/Edge | positive evidence/native prompt | Confirmed state: Open + browser/OS guidance |
| macOS Chrome/Edge/Safari | native prompt or Add to Dock | Applicable confirmed-state guidance only |

## Service worker contract

The worker uses cache `myhrfh-installer-v7`, preserves `android-installed-state-v1`, declares `android-native-management-v1`, preserves `desktop-installed-state-v2`, and declares `ios-final-guidance-v2`. It caches `android-native-bridge.js` plus the required shell assets, intercepts same-origin GET requests only, uses network-first navigation freshness, clears obsolete caches, and calls `skipWaiting()` / `clients.claim()`.

## Production HTTP headers

Configure at final `myhrfh.com` hosting:

- `Strict-Transport-Security` after all included domains are HTTPS-ready;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer`;
- restrictive `Content-Security-Policy` with no broad wildcard sources;
- least-privilege `Permissions-Policy` disabling unneeded camera, microphone, geolocation, payment, USB, and similar capabilities.

Review service-worker scope before production so unrelated authenticated portal routes cannot be intercepted.

## Failure behavior

- Service-worker failure leaves the online installer usable.
- Installed-state probe errors remain unknown.
- `beforeinstallprompt` never clears positive evidence.
- Stale Android browser receipt is corrected only through deliberate Reinstall or stronger positive evidence.
- Digital Asset Links validation failure keeps native management disabled.
- PostMessage channel/handshake failure keeps Restore/Uninstall hidden.
- Malformed/oversized/unknown native messages cause no side effect.
- Already-pinned `myhrfh-home` returns `already-present` and does not request a duplicate.
- Unsupported launcher pin or uninstall handler reports unsupported/error without hidden API fallback.
- User cancellation remains authoritative; the UI says Android opened/requested confirmation, not that the operation completed.

## Automated engineering acceptance

Every candidate head must pass:

```text
node --check android-native-bridge.js
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
gradle -p android testDebugUnitTest lintDebug assembleDebug
```

## Production deployment checklist

1. Serve final installer/manifest/service-worker/icons/launch assets from a deliberately scoped same-origin `myhrfh.com` path.
2. Replace GitHub Pages manifest identity/related-app URLs with the approved production origin.
3. Apply and verify CSP/HSTS/nosniff/Referrer-Policy/Permissions-Policy and cache headers.
4. Verify normal HRFH authentication remains authoritative.
5. Android browser: clean install, accepted receipt, refresh with no duplicate Install, positive related-app detection where supported, actual removal + deliberate Reinstall.
6. Android browser fallback: **Install app**, not unverifiable generic bookmark promotion.
7. Confirm ordinary Android browser/PWA sessions never receive native Restore/Uninstall capabilities.
8. Approve production Android application ID and secure signing/upload process outside this repo.
9. Obtain signing certificate fingerprint and deploy exact `myhrfh.com/.well-known/assetlinks.json` with both required relations.
10. Build/sign through approved release process; verify package/fingerprint against deployed Digital Asset Links.
11. Physical Android TWA: verify toolbar-free trust, exact-origin MessagePort handshake, Restore user confirmation, stable shortcut duplicate prevention, and `ACTION_DELETE` system uninstall confirmation.
12. Explicitly approve Play/internal distribution; validation does not authorize deployment.
13. iPhone Chrome portrait (address bar top and bottom), landscape, iPad Chrome; iPhone/iPad Safari direct Share and circled More variants; Open-as-Web-App/Edit-Actions recovery.
14. Desktop Chrome/Edge/Safari installed, shortcut-deleted, uninstall/reinstall states.
15. Verify safe areas, zoom/reflow, keyboard/screen-reader labels, reduced motion, and concise copy.
16. Run the complete exact-head automated gate after the final code-changing commit.

## Release decision

The repository implementation can be considered code-complete only when Node syntax/tests and Android unit/lint/assemble are green on the same exact PR head. Broad production release additionally requires the production-origin, security-header, Digital Asset Links/signing/distribution, and physical-device acceptance steps above. GitHub Pages remains staging and no native package is published automatically.
