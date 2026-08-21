# HRFH web app installer — production readiness

This document defines the production contract for the public HR for Health installer targeting `https://myhrfh.com`. The release architecture is **PWA-only/browser-only**. There is no APK, Trusted Web Activity, native Android bridge, Play Store dependency, or sideload channel.

## Governing state model

1. **Running as installed web app** — forward to `https://myhrfh.com` before installer UI paints.
2. **Installed confirmed** — show Open; Android also shows Reinstall. Do not expose Restore or Uninstall controls.
3. **Installation not confirmed** — show a discoverable **Install HRFH web app** action immediately on Android and desktop. Do not hide that action behind an arbitrary wait for `beforeinstallprompt`.
4. **Native prompt available** — a delivered Chromium `beforeinstallprompt` event is current installability evidence; the Install action invokes that native prompt.
5. **Native prompt unavailable/pending** — keep the Install action visible and provide concise browser-native fallback guidance. Android uses **Install app**; macOS Safari uses **File → Add to Dock**.
6. **Unknown installed state** — never claim removal. A local receipt may remain conservative Android fallback evidence only when the browser cannot complete its installed-state probe, but a later live installability event supersedes stale fallback state.

`beforeinstallprompt` is Chromium-specific and its delivery timing/eligibility is controlled by the browser. The site cannot force the event to fire. Production UI therefore cannot make the Install affordance disappear merely because that event has not arrived yet.

## Android PWA installation and duplicate prevention

The manifest declares itself in `related_applications`. On supported Android Chrome, `navigator.getInstalledRelatedApps()` can report the installed self-related PWA.

- Matching self-PWA result: installed.
- Supported Android probe completes successfully with no matching self-PWA: not installed; clear stale local receipt.
- API unavailable or probe errors: unknown; a same-origin boolean receipt may remain Android fallback evidence.
- Accepted native browser install, `appinstalled`, standalone launch, and positive related-app detection may write the receipt.
- A delivered `beforeinstallprompt` event is current browser evidence that installation can be offered. Clear stale receipt/rendered-installed fallback state and surface the native install action.
- If the native event has not arrived, keep **Install HRFH web app** visible and retain the Chrome menu **Install app** path.
- If the user dismisses the native prompt, consume that one-shot event but keep the Install/manual fallback path visible for a later attempt.

This avoids intentionally advertising duplicate installation when Chrome confirms the PWA is installed while also preventing stale local state or event timing from hiding installation after a genuine removal.

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

Windows Chrome/Edge and supported Chromium desktop browsers use positive installed evidence when available. A local install receipt is not authoritative on desktop and is cleared during normal browser-tab assessment. If `beforeinstallprompt` is delivered, it supersedes stale fallback/rendered state and the Install button invokes the native prompt.

When installation is not confirmed, desktop keeps **Install HRFH web app** visible even before a programmable prompt is available. Chrome/Edge users retain browser-native Install app/install-icon guidance; macOS Safari retains **File → Add to Dock** guidance. There is no Restore shortcut control or `chrome://apps` / `edge://apps` management UI in the release page.

## Browser/device matrix

| Environment | Install path | Installed recovery |
| --- | --- | --- |
| Android Chrome/Chromium | visible Install action; self-related PWA probe; native prompt when delivered; **Install app** fallback | Open + Reinstall |
| iPhone/iPad Chrome | Share → Add to Home Screen | Conservative browser guidance |
| iPhone/iPad Safari | Share or More → Share → Add to Home Screen → Open as Web App → Add | Conservative browser guidance |
| Windows Chrome/Edge | visible Install action; live native prompt when delivered; browser Install app/install-icon fallback | Open |
| macOS Chrome/Edge/Safari | visible Install action; native prompt when delivered or Add to Dock | Open |

## Service worker contract

The worker uses cache `myhrfh-installer-v9`, declares build revision `android-desktop-install-affordance-v1`, preserves `android-pwa-recovery-v2`, `android-installed-ui-v1`, `desktop-install-recovery-v1`, and `ios-final-guidance-v2`. It caches only browser shell assets, intercepts same-origin GET requests only, uses network-first navigation freshness, clears obsolete caches, and calls `skipWaiting()` / `clients.claim()`.

For Android and desktop, service-worker registration begins before final installer-state rendering instead of waiting solely for `window.load`, reducing first-visit delay in Chromium installability assessment. The approved iOS runtime path retains its existing load-timed registration behavior.

## Production HTTP headers

Configure at final Marketing hosting:

- `Strict-Transport-Security` after all included domains are HTTPS-ready;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer`;
- restrictive `Content-Security-Policy` with no broad wildcard sources;
- least-privilege `Permissions-Policy` disabling unneeded camera, microphone, geolocation, payment, USB, and similar capabilities.

The visible installer brand mark currently loads from `https://hrforhealth.com/wp-content/uploads/2024/04/Logo-icon-1.png.webp`; if that external asset remains in the release, the CSP `img-src` directive must explicitly allow the `https://hrforhealth.com` origin in addition to the installer origin/data requirements actually used.

Review service-worker scope before production so unrelated authenticated portal routes cannot be intercepted.

## Failure behavior

- Service-worker failure leaves the online installer usable and reports initialization failure.
- Installed-state probe errors remain unknown.
- Supported Android successful empty self-related-app result clears stale receipt and returns to installation assessment.
- A delivered `beforeinstallprompt` supersedes stale receipt/rendered-installed fallback because the browser is currently offering installation capability.
- Missing or delayed `beforeinstallprompt` never hides the non-iOS Install affordance; manual browser installation guidance remains available.
- User cancellation consumes the current native prompt event, but the Install/manual fallback action remains visible.
- Missing Home Screen icon cannot be detected by the website; the Android UI does not claim otherwise.

## Automated engineering acceptance

Every candidate head must pass:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

Validation CI must not build or upload a Marketing handoff ZIP. Packaging is a separate post-device-acceptance action.

## Production deployment checklist

1. Complete physical staging acceptance on the exact validated head before packaging.
2. Android Chrome, app not installed: after device assessment, **Install HRFH web app** is visible even if `beforeinstallprompt` has not fired yet.
3. Android Chrome, live prompt available: Install opens the native browser prompt; dismissal returns to a visible install/manual fallback state.
4. Android Chrome, installed: Open + Reinstall only; refresh does not advertise duplicate installation when the self-related PWA probe confirms installed state; full PWA removal returns to install assessment.
5. Desktop Chrome/Edge, app not installed: Install is visible; a delivered native installability event upgrades the action to the native prompt; stale local receipt state cannot suppress it.
6. Desktop Safari: Install remains discoverable and fallback guidance uses **File → Add to Dock**.
7. Reconfirm iPhone/iPad behavior without modification: Chrome portrait/landscape and iPad Chrome; iPhone/iPad Safari direct Share and circled More variants; Open-as-Web-App/Edit-Actions recovery.
8. Verify safe areas, zoom/reflow, keyboard/screen-reader labels, reduced motion, and concise copy.
9. Run the complete exact-head automated gate after the final code-changing commit.
10. Only after steps 1–9 pass, create the Marketing package with self-PWA identity `https://hrfh.hrforhealth.com/web-install/` and inspect the produced ZIP before handoff.
11. Marketing host serves installer/manifest/service-worker/icons/launch assets from the deliberately scoped same-origin `/web-install/` path, applies required headers, and preserves normal HRFH authentication authority.

## Marketing packaging boundary

GitHub Pages remains staging. Staging validation deliberately does not create a release ZIP. The intended Marketing self-PWA identity is:

- manifest URL: `https://hrfh.hrforhealth.com/web-install/manifest.webmanifest`
- app ID/scope identity: `https://hrfh.hrforhealth.com/web-install/`

Packaging must be generated from the exact physically accepted PR head and must differ from staging only where hosting identity requires it. The produced ZIP must then be inspected for the accepted controller, manifest identity, icons, service worker, logo reference, and absence of Restore/Uninstall controls before external handoff.

## Release decision

Code completion requires browser syntax/tests green on the same exact PR head. Broad production release additionally requires physical Android/Desktop acceptance plus production-origin/security-header verification. GitHub Pages remains staging. iOS behavior in this hardening pass is intentionally unchanged.