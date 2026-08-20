# HRFH web app installer — production readiness

This document defines the production contract for the public HR for Health installer targeting `https://myhrfh.com`. The release architecture is **PWA-only/browser-only**. There is no APK, Trusted Web Activity, native Android bridge, Play Store dependency, or sideload channel.

## Governing state model

1. **Running as installed web app** — forward to `https://myhrfh.com` before installer UI paints.
2. **Installed confirmed** — show Open; Android also shows Reinstall. Do not expose Android Restore or Uninstall controls.
3. **Installable** — show Chromium's native Install action only when there is no stronger installed evidence.
4. **Manual install** — show concise browser-specific guidance. Android fallback uses **Install app**; iOS uses Share / Add to Home Screen.
5. **Unknown** — never claim removal; retain conservative fallback evidence where the browser cannot complete an installed-state probe.

## Android PWA installation and duplicate prevention

The manifest declares itself in `related_applications`. On supported Android Chrome, `navigator.getInstalledRelatedApps()` can report the installed self-related PWA.

- Matching self-PWA result: installed.
- Supported Android probe completes successfully with no matching self-PWA: not installed; clear stale local receipt.
- API unavailable or probe errors: unknown; a same-origin boolean receipt may remain fallback evidence.
- Accepted native browser install, `appinstalled`, standalone launch, and positive related-app detection may write the receipt.
- `beforeinstallprompt` **must not clear, erase, or invalidate** positive evidence merely because an install event becomes available.

This lets refreshes avoid intentionally advertising duplicate installation while still recovering from a genuinely removed PWA when Chrome can provide a definitive self-related-app result.

## Android installed experience

A successful PWA-installed check does not reveal Home Screen placement. A website **cannot inspect, detect, or verify the Android Home Screen/launcher icon or shortcut itself**.

The Android installed UI is therefore intentionally simple:

- **Open HRFH web app**
- **Reinstall**
- confirmation card: **The myHRFH icon was added to your Home Screen.**

There is no Android Restore control and no Uninstall control. The installer is not an Android package or launcher manager.

## iPhone and iPad guidance

Apple does not expose an Android-style programmable Add to Home Screen prompt. The assistant remains direct and short and does not ask users to identify toolbar layout.

- **Share** uses an outlined square with upward arrow vector symbol.
- **More** uses an outlined circle with three horizontal dots.
- **Add to Home Screen** uses an outlined rounded square with plus.

On iPhone Safari: **Tap Share, or More if Share isn't shown. Then choose Share.** Continue with **Add to Home Screen → Open as Web App → Add** when Apple presents those controls; **Edit Actions → Add to Home Screen** remains recovery.

On iPhone Chrome portrait: **Tap Share beside the address bar** without claiming whether that bar is top or bottom. Chrome landscape and iPad Chrome/Safari may use the high-confidence top-right Share cue. No generic `navigator.share()` call is treated as an install API.

Guidance remains safe-area aware, responsive to orientation/viewport changes, keyboard/screen-reader understandable, and honors reduced motion. No toolbar calibration/questionnaire state is stored.

## Desktop behavior

Windows Chrome/Edge and supported macOS browsers continue to use positive installed evidence/native install prompts where available. Shortcut guidance appears only after confirmed installed state and never claims direct launcher/package access.

## Browser/device matrix

| Environment | Install path | Installed recovery |
| --- | --- | --- |
| Android Chrome/Chromium | self-related PWA probe; native prompt; **Install app** fallback | Open + Reinstall |
| iPhone/iPad Chrome | Share → Add to Home Screen | Conservative browser guidance |
| iPhone/iPad Safari | Share or More → Share → Add to Home Screen → Open as Web App → Add | Conservative browser guidance |
| Windows Chrome/Edge | positive evidence/native prompt | Open + browser/OS shortcut guidance |
| macOS Chrome/Edge/Safari | native prompt or Add to Dock | Applicable confirmed-state shortcut guidance |

## Service worker contract

The worker uses cache `myhrfh-installer-v8`, declares `android-pwa-recovery-v2` and `android-installed-ui-v1`, preserves `desktop-installed-state-v2`, and declares `ios-final-guidance-v2`. It caches only browser shell assets, intercepts same-origin GET requests only, uses network-first navigation freshness, clears obsolete caches, and calls `skipWaiting()` / `clients.claim()`.

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
- Supported Android successful empty self-related-app result clears stale receipt and returns to install assessment.
- `beforeinstallprompt` never clears positive evidence by itself.
- Missing Home Screen icon cannot be detected by the website; the Android UI does not claim otherwise.
- User cancellation of install remains authoritative.

## Automated engineering acceptance

Every candidate head must pass:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

## Production deployment checklist

1. Serve final installer/manifest/service-worker/icons/launch assets from a deliberately scoped same-origin `myhrfh.com` path.
2. Replace GitHub Pages manifest identity/related-app URL with the approved production origin.
3. Apply and verify CSP/HSTS/nosniff/Referrer-Policy/Permissions-Policy and cache headers.
4. Verify normal HRFH authentication remains authoritative.
5. Android Chrome: clean install, accepted receipt, refresh with no duplicate Install, positive self-related-app detection, concise installed confirmation, complete PWA removal, and reinstall recovery.
6. Android browser fallback: **Install app**, not unverifiable generic bookmark promotion.
7. iPhone Chrome portrait/landscape and iPad Chrome; iPhone/iPad Safari direct Share and circled More variants; Open-as-Web-App/Edit-Actions recovery.
8. Desktop Chrome/Edge/Safari installed and shortcut-recovery states.
9. Verify safe areas, zoom/reflow, keyboard/screen-reader labels, reduced motion, and concise copy.
10. Run the complete exact-head automated gate after the final code-changing commit.

## Release decision

Code completion requires browser syntax/tests green on the same exact PR head. Broad production release additionally requires production-origin/security-header setup and physical-device acceptance. GitHub Pages remains staging.