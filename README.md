# myHRFH web app installer

This repository hosts the public staging implementation for installing quick access to the HR for Health portal as a web app across supported mobile and desktop browsers.

The staging installer is published through GitHub Pages and ultimately targets `https://myhrfh.com`.

## Public staging URL

`https://srh-bit.github.io/mobile-pwa-install-test/`

## What the installer does

- Detects iPhone/iPad, Android, Windows, macOS, and generic desktop environments.
- Uses the browser's native install prompt where supported.
- Uses browser-specific manual-install guidance where the platform does not expose a programmable prompt.
- On Android, writes positive install evidence as soon as the user accepts the native PWA install prompt instead of waiting only for `appinstalled`.
- On Android refresh, positive installed evidence from standalone launch, `navigator.getInstalledRelatedApps()`, or the same-origin install receipt wins before a newly exposed `beforeinstallprompt` can render another Install button.
- Never clears or invalidates positive installed evidence merely because `beforeinstallprompt` fires.
- Provides a deliberate **Reinstall** recovery action on Android; it is the only normal UI path that intentionally clears the local receipt and asks Chrome to reevaluate installability.
- Android fallback guidance prefers **Install app** and does not encourage an arbitrary **Add to Home screen** launcher bookmark that the webpage cannot later verify.
- The pure-web Android build does not show instruction-only Restore shortcut or Uninstall buttons. Real Android management is reserved for a future native/Trusted Web Activity layer using public Android APIs and system confirmation UI.
- On iOS, presents a direct two-step visual assistant without asking browser-layout questions.
- Uses iOS-faithful vector geometry for **Share** (outlined square + upward arrow), **More** (outlined circle + three horizontal dots), and **Add to Home Screen** (outlined rounded square + plus), rather than placeholder text glyphs or a fake full browser toolbar.
- Styles those instructional symbols with the HRFH page palette, surface depth, and spacing while preserving the recognizable iOS control shapes.
- iPhone Safari guidance says **Tap Share, or More if Share isn't shown. Then choose Share.**
- iPhone Chrome portrait guides users to **Share beside the address bar** without claiming whether the user placed the address bar at the top or bottom.
- Uses a high-confidence top-right Share cue for supported iPad and Chrome-landscape layouts.
- Keeps Safari recovery concise: **Add to Home Screen**, **Open as Web App** when shown, and a collapsed **Edit Actions → Add to Home Screen** fallback.
- Never uses the generic Web Share API as though it were an Add-to-Home-Screen API.
- Detects supported installed-PWA states conservatively and never treats an empty relationship API result as definitive proof of uninstall.
- Preserves a verified same-origin install receipt after accepted native installation, `appinstalled`, a real standalone launch, or positive related-app detection.
- Immediately forwards installed launches to `https://myhrfh.com` before installer UI can paint.

## Important platform limitations

A normal public webpage cannot reliably inspect the Android launcher and determine whether an arbitrary Home Screen bookmark, shortcut, or icon exists. A true installed PWA can be positively recognized in supported Chromium configurations, but a manually created launcher bookmark is a different state and must not be treated as fully observable from JavaScript.

For that reason, Android duplicate prevention is evidence-based: once this installer has positive installed evidence it keeps the Install action suppressed across refreshes. If the user actually removes the app, **Reinstall** deliberately clears the local receipt and lets the browser reassess installation.

A normal public webpage also cannot programmatically uninstall a PWA or call Android's launcher-management APIs. The web build therefore does not pretend that Restore or Uninstall are executable Android actions.

If HRFH later requires real Android management, the recommended next layer is a lightweight Trusted Web Activity (TWA) package associated with the production `myhrfh.com` origin. That native layer can use public Android APIs such as `ShortcutManager.requestPinShortcut()` for a user-confirmed shortcut request and the Android system uninstall/application-management UI for removal. Hidden/non-SDK Android APIs are not part of the design.

On iOS, Apple does not expose an Android-style programmable Add to Home Screen prompt. The installer therefore provides direct visual guidance while the final browser Share → Add to Home Screen action remains controlled by iOS/browser UI.

Web content cannot reliably inspect every Safari/Chrome toolbar preference. The final assistant does not ask users to describe their toolbar. Ambiguous layouts receive truthful region/instruction guidance rather than a fake exact coordinate.

## Staging versus production

GitHub Pages is the device-validation host only. For the final public production route, serve the installer assets from a deliberately scoped same-origin path on `myhrfh.com` so the manifest, service worker, icons, launch route, and portal use the production origin.

A future Android TWA must also be bound to the production origin through Digital Asset Links before native-only management capabilities are considered accepted.

See [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md) for the browser matrix, security requirements, caching rules, service-worker boundary, accessibility contract, installed-state behavior, final iOS guidance contract, Android native-management boundary, and production deployment checklist.

## Security and privacy

The installer:

- accepts no arbitrary redirect destination;
- collects no credentials or personal information;
- includes no analytics or advertising identifiers;
- has no Salesforce or privileged-system access;
- does not proxy or cache cross-origin portal traffic;
- uses a same-origin install receipt containing only a boolean installed marker;
- stores no iOS toolbar/layout calibration state;
- does not attempt to bypass browser/OS install or uninstall consent;
- does not use hidden or non-SDK Android APIs.

See [`SECURITY.md`](SECURITY.md) for the security policy and reporting guidance.

## Repository validation

GitHub Actions validates browser JavaScript syntax and the complete behavior/security/readiness suite on each feature-branch/PR change:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

The suite covers manifest/install identity, transparent icons, pre-paint launch behavior, Android/desktop native install prompts, Android duplicate-install prevention and deliberate reinstall recovery, legacy installed-state continuity, direct iOS guidance, accurate Share/circled-More/Add-to-Home-Screen symbols, Safari Share/More and Open-as-Web-App recovery, capability-gated management controls, service-worker scope/freshness, accessibility hooks, privacy safeguards, and production documentation.

## Physical-device acceptance

Before production rollout, test at minimum:

- Android Chrome clean native PWA install, accepted-install receipt creation, page refresh with no duplicate Install action, standalone launch, and positive `getInstalledRelatedApps()` detection where supported.
- Android actual uninstall followed by deliberate **Reinstall** recovery.
- Android browser menu fallback using **Install app**; verify the product does not promote generic **Add to Home screen** bookmark creation as an equivalent managed install.
- Verify Android web-only installed state does not expose fake Restore shortcut / Uninstall controls.
- Separately test any future TWA/native Android management layer before enabling real Restore or Uninstall actions.
- iPhone Chrome portrait with the address bar at both top and bottom.
- iPhone Chrome landscape.
- iPhone Safari layouts where Share is directly visible and where Share is reached through the circled More control.
- iPad Safari and Chrome.
- Safari **Open as Web App** and **Edit Actions → Add to Home Screen** recovery.
- Confirm Share, circled More, and Add-to-Home-Screen shapes match current iOS controls while HRFH colors/depth remain consistent with the installer page.
- Portrait/landscape rotation, reduced motion, zoom/reflow, safe-area behavior, and screen-reader labels.
- Windows Chrome clean install, existing install, deleted desktop shortcut while app remains installed, and uninstall/reinstall.
- Windows Edge equivalent states.
- macOS Chrome/Edge and Safari Add to Dock.

Current release cache identity: `myhrfh-installer-v6`; Android installed-state revision: `android-installed-state-v1`; iOS guidance revision: `ios-final-guidance-v2`.

`main` is not used as a live production deployment target during staging validation.