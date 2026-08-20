# myHRFH web app installer

This repository hosts the public staging implementation for installing quick access to the HR for Health portal as a web app across supported mobile and desktop browsers.

The staging installer is published through GitHub Pages and ultimately targets `https://myhrfh.com`.

## Public staging URL

`https://srh-bit.github.io/mobile-pwa-install-test/`

## What the installer does

- Detects iPhone/iPad, Android, Windows, macOS, and generic desktop environments.
- Uses the browser's native install prompt where supported.
- Uses browser-specific manual-install guidance where the platform does not expose a programmable prompt.
- On iOS, presents a direct two-step visual assistant without asking browser-layout questions.
- Uses iOS-style vector symbols for **Share**, **More (…)**, and **Add to Home Screen** instead of placeholder text glyphs or a fake full browser toolbar.
- iPhone Safari guidance says **Tap Share** and provides **More (…) → Share** as the immediate fallback when Share is not visible.
- iPhone Chrome portrait guides users to **Share beside the address bar** without claiming whether the user placed the address bar at the top or bottom.
- Uses a high-confidence top-right Share cue for supported iPad and Chrome-landscape layouts.
- Keeps Safari recovery concise: **Add to Home Screen**, **Open as Web App** when shown, and a collapsed **Edit Actions → Add to Home Screen** fallback.
- Never uses the generic Web Share API as though it were an Add-to-Home-Screen API.
- Detects supported installed-PWA states conservatively and never treats an empty relationship API result as definitive proof of uninstall.
- Preserves a verified same-origin install receipt after real standalone launch or `appinstalled`, allowing legacy desktop installs to remain recognizable after manifest evolution.
- Clears that receipt when a real `beforeinstallprompt` is exposed, preventing stale installed state after uninstall.
- Shows Restore shortcut / Uninstall management only when installation is positively confirmed and those actions are applicable to the current platform.
- Immediately forwards installed launches to `https://myhrfh.com` before installer UI can paint.

## Important platform limitations

A normal public webpage cannot reliably detect whether a launcher/Home Screen/Desktop icon itself is visible. A PWA can remain installed even after a user removes only a desktop shortcut.

A normal public webpage also cannot programmatically uninstall a PWA. Where appropriate, the installer provides browser/OS instructions while leaving removal under user control.

On iOS, Apple does not expose an Android-style programmable Add to Home Screen prompt. The installer therefore provides direct visual guidance while the final browser Share → Add to Home Screen action remains controlled by iOS/browser UI.

Web content cannot reliably inspect every Safari/Chrome toolbar preference. The final assistant does not ask users to describe their toolbar. Ambiguous layouts receive truthful region/instruction guidance rather than a fake exact coordinate.

## Staging versus production

GitHub Pages is the device-validation host only. For the final public production route, serve the installer assets from a deliberately scoped same-origin path on `myhrfh.com` so the manifest, service worker, icons, launch route, and portal use the production origin.

See [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md) for the browser matrix, security requirements, caching rules, service-worker boundary, accessibility contract, installed-state behavior, final iOS guidance contract, and production deployment checklist.

## Security and privacy

The installer:

- accepts no arbitrary redirect destination;
- collects no credentials or personal information;
- includes no analytics or advertising identifiers;
- has no Salesforce or privileged-system access;
- does not proxy or cache cross-origin portal traffic;
- uses a same-origin install receipt containing only a boolean installed marker;
- stores no iOS toolbar/layout calibration state;
- does not attempt to bypass browser/OS install or uninstall consent.

See [`SECURITY.md`](SECURITY.md) for the security policy and reporting guidance.

## Repository validation

GitHub Actions validates browser JavaScript syntax and the complete behavior/security/readiness suite on each feature-branch/PR change:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

The suite covers manifest/install identity, transparent icons, pre-paint launch behavior, Android/desktop native install prompts, legacy installed-state continuity, direct iOS guidance, accurate action symbols, Safari Share/More and Open-as-Web-App recovery, capability-gated management controls, service-worker scope/freshness, accessibility hooks, privacy safeguards, and production documentation.

## Physical-device acceptance

Before production rollout, test at minimum:

- Android Chrome clean install, already installed, uninstall/reinstall, and badged-shortcut fallback.
- iPhone Chrome portrait with the address bar at both top and bottom.
- iPhone Chrome landscape.
- iPhone Safari layouts where Share is directly visible and where Share is reached through More (…).
- iPad Safari and Chrome.
- Safari **Open as Web App** and **Edit Actions → Add to Home Screen** recovery.
- Portrait/landscape rotation, reduced motion, zoom/reflow, safe-area behavior, and screen-reader labels.
- Windows Chrome clean install, existing install, deleted desktop shortcut while app remains installed, and uninstall/reinstall.
- Windows Edge equivalent states.
- macOS Chrome/Edge and Safari Add to Dock.

`main` is not used as a live production deployment target during staging validation.