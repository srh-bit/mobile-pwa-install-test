# HRFH web app installer — production readiness

This document defines the production contract for the public HR for Health installer targeting `https://myhrfh.com`. The release architecture is **PWA-only/browser-only**. There is no APK, Trusted Web Activity, native Android bridge, Play Store dependency, or sideload channel.

## Historical behavioral authority

The Android/Desktop install path is intentionally restored from repository history rather than redesigned.

- Exact known-good pre-Marketing baseline: `3251b8addb47cd9169afe365b8689b3aab69c561`
- First commit that introduced the Marketing handoff package: `09191a2fb6540cf9adc8f449e0bd17888675e82d` (`ci: publish clean marketing handoff artifact`)

The controller behavior immediately before that first Marketing-package commit is the authority for Android/Desktop installation. Current no-Restore/no-Uninstall cleanup and the approved iOS experience remain in place.

## Governing state model

1. **Running as installed web app** — forward to `https://myhrfh.com` before installer UI paints.
2. **Installed confirmed** — show Open; Android also shows Reinstall. Do not expose Restore or Uninstall controls.
3. **Chromium native prompt pending** — after installed-state assessment, wait up to 1.2 seconds for the browser's real `beforeinstallprompt` event.
4. **Chromium native prompt available** — show **Install HRFH web app** and let that button invoke the captured native prompt.
5. **Native prompt unavailable** — hide the custom Install button rather than expose a dead action. Android uses browser-menu **Install app** guidance; Chrome/Edge desktop uses browser **Install app** / install-icon guidance; macOS Safari uses **File → Add to Dock**.
6. **Unknown installed state** — retain the pre-Marketing conservative same-origin install receipt behavior rather than inventing new installed-state authority.

`beforeinstallprompt` is Chromium-specific and browser-controlled. The site cannot manufacture a native prompt. The restored contract therefore exposes the custom Install button only when a real captured prompt is available.

## Android PWA installation and duplicate prevention

The manifest declares itself in `related_applications`. On supported Android Chrome, `navigator.getInstalledRelatedApps()` can report the installed self-related PWA.

- Matching self-PWA result: installed.
- Supported Android probe completes successfully with no matching self-PWA: not installed; clear stale local receipt.
- API unavailable or probe errors: unknown; the pre-Marketing same-origin boolean receipt may remain conservative fallback evidence.
- Accepted native browser install, `appinstalled`, standalone launch, and positive related-app detection may write the receipt.
- A `beforeinstallprompt` event is captured. If the page already has installed evidence (`installedStateDetected` or the receipt), the custom Install button remains hidden, matching the known-good pre-Marketing controller.
- If installed evidence is absent, the captured event makes **Install HRFH web app** available.
- If the user dismisses or consumes the one-shot native prompt, the captured event is cleared and the custom Install button is hidden rather than left visible without an actionable native prompt.

## Android installed experience

A successful PWA-installed check does not reveal Home Screen placement. A website **cannot inspect, detect, or verify the Android Home Screen/launcher icon or shortcut itself**.

The Android installed UI is intentionally simple:

- **Open HRFH web app**
- **Reinstall**
- confirmation card: **The myHRFH icon was added to your Home Screen.**

There is no Android Restore control and no Uninstall control. The installer is not an Android package or launcher manager.

## iPhone and iPad guidance

iOS behavior is intentionally unchanged by this revert. Apple does not expose an Android-style programmable Add to Home Screen prompt. The approved assistant remains direct and short and does not ask users to identify toolbar layout.

- **Share** uses an outlined square with upward arrow vector symbol.
- **More** uses an outlined circle with three horizontal dots.
- **Add to Home Screen** uses an outlined rounded square with plus.

On iPhone Safari: **Tap Share, or More if Share isn't shown. Then choose Share.** Continue with **Add to Home Screen → Open as Web App → Add** when Apple presents those controls; **Edit Actions → Add to Home Screen** remains recovery.

On iPhone Chrome portrait: **Tap Share beside the address bar** without claiming whether that bar is top or bottom. Chrome landscape and iPad Chrome/Safari may use the high-confidence top-right Share cue. No generic `navigator.share()` call is treated as an install API.

Guidance remains safe-area aware, responsive to orientation/viewport changes, keyboard/screen-reader understandable, and honors reduced motion. No toolbar calibration/questionnaire state is stored.

## Desktop behavior

Windows Chrome/Edge and other supported Chromium desktop browsers restore the pre-Marketing native-prompt lifecycle:

- installed-state assessment occurs first;
- the controller waits up to 1.2 seconds for `beforeinstallprompt`;
- the custom **Install HRFH web app** action appears only if that event has actually been captured;
- without a captured event, the custom button is hidden and browser-native **Install app** / install-icon guidance is shown;
- a pre-existing same-origin receipt remains conservative installed evidence, matching the known-good baseline;
- after the one-shot native prompt is consumed or dismissed, the custom button is hidden rather than becoming a nonfunctional action.

macOS Safari retains **File → Add to Dock** guidance. There is no Restore shortcut control or `chrome://apps` / `edge://apps` management UI in the release page.

## Browser/device matrix

| Environment | Install path | Installed recovery |
| --- | --- | --- |
| Android Chrome/Chromium | installed-state probe → wait up to 1.2s for native prompt → custom Install only when prompt exists; otherwise browser-menu **Install app** | Open + Reinstall |
| iPhone/iPad Chrome | Share → Add to Home Screen | Approved iOS guidance |
| iPhone/iPad Safari | Share or More → Share → Add to Home Screen → Open as Web App → Add | Approved iOS guidance |
| Windows Chrome/Edge | wait for native prompt; custom Install only when captured; otherwise browser Install app/install-icon guidance | Open |
| macOS Chrome/Edge/Safari | Chromium native prompt when captured or Safari Add to Dock | Open |

## Service worker contract

The worker uses cache `myhrfh-installer-v10` and build revision `pre-marketing-install-behavior-v1`, while preserving `android-pwa-recovery-v2`, `android-installed-ui-v1`, `desktop-install-recovery-v1`, and `ios-final-guidance-v2` markers.

The cache identity is deliberately rotated from v9 to v10. The prior cache used cache-first static asset handling, so changing only a revision string would not reliably evict a previously cached `install.js`. The v10 cache guarantees activation can delete the v9 cache and stage the restored controller shell.

Service-worker registration uses the pre-Marketing `window.load` timing. The worker caches only browser shell assets, intercepts same-origin GET requests only, uses network-first navigation freshness, clears obsolete caches, and calls `skipWaiting()` / `clients.claim()`.

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
- If Chromium does not deliver `beforeinstallprompt` during the 1.2-second assessment window, no dead custom Install button is shown; browser-native installation guidance is shown instead.
- A later `beforeinstallprompt` can surface the custom button when the pre-Marketing installed-evidence guard allows it.
- User cancellation consumes the current native prompt event and hides the custom Install button.
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
2. Android Chrome, app not installed: confirm the page assesses the device, then either shows a working **Install HRFH web app** button backed by Chrome's native prompt or shows browser-menu **Install app** guidance with no dead custom button.
3. Android Chrome, native prompt available: confirm the custom Install button opens Chrome's native PWA install UI.
4. Android Chrome, native prompt dismissed: confirm the custom Install button is no longer left visible without a live prompt.
5. Android Chrome, installed: Open + Reinstall only; refresh does not advertise duplicate installation when installed evidence is available; complete PWA removal can return the browser to installation assessment.
6. Desktop Chrome/Edge: confirm the custom button is shown only when the native prompt exists; otherwise browser-native install guidance is used.
7. Desktop Safari: confirm **File → Add to Dock** guidance.
8. Reconfirm iPhone/iPad behavior without modification: Chrome portrait/landscape and iPad Chrome; iPhone/iPad Safari direct Share and circled More variants; Open-as-Web-App/Edit-Actions recovery.
9. Verify safe areas, zoom/reflow, keyboard/screen-reader labels, reduced motion, and concise copy.
10. Run the complete exact-head automated gate after the final code-changing commit.
11. Only after steps 1–10 pass, create the Marketing package with self-PWA identity `https://hrfh.hrforhealth.com/web-install/` and inspect the produced ZIP before handoff.
12. Marketing host serves installer/manifest/service-worker/icons/launch assets from the deliberately scoped same-origin `/web-install/` path, applies required headers, and preserves normal HRFH authentication authority.

## Marketing packaging boundary

GitHub Pages remains staging. Staging validation deliberately does not create a release ZIP. The intended Marketing self-PWA identity is:

- manifest URL: `https://hrfh.hrforhealth.com/web-install/manifest.webmanifest`
- app ID/scope identity: `https://hrfh.hrforhealth.com/web-install/`

Packaging must be generated from the exact physically accepted PR head and must differ from staging only where hosting identity requires it. The produced ZIP must then be inspected for the accepted controller, manifest identity, icons, service worker, logo reference, and absence of Restore/Uninstall controls before external handoff.

## Release decision

Code completion requires browser syntax/tests green on the same exact PR head. Broad production release additionally requires physical Android/Desktop acceptance plus production-origin/security-header verification. GitHub Pages remains staging. iOS behavior in this revert is intentionally unchanged.
