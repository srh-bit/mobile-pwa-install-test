# myHRFH web app installer

This repository hosts the public staging implementation for installing quick access to the HR for Health portal as a web app across supported mobile and desktop browsers.

The staging installer is published through GitHub Pages and ultimately targets `https://myhrfh.com`.

## Public staging URL

`https://srh-bit.github.io/mobile-pwa-install-test/`

## What the installer does

- Detects iPhone/iPad, Android, Windows, macOS, and generic desktop environments.
- Uses the browser's native install prompt where supported.
- Uses browser-specific manual-install guidance where the platform does not expose a programmable prompt.
- Keeps iPhone/iPad users in their **current browser** instead of forcing a Chrome/Safari handoff.
- Uses one-tap, session-only calibration only when an iOS browser setting makes the Share location unknowable:
  - iPhone Chrome portrait: **Top / Bottom** address bar.
  - iPhone Safari: **Share / More (…)**.
- Converts that calibration into a browser-specific HRFH coachmark and miniature toolbar illustration rather than relying on fragile hard-coded coordinates.
- Uses high-confidence top-right guidance immediately for supported iPad and Chrome-landscape layouts where calibration is unnecessary.
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

On iOS, Apple does not expose an Android-style programmable Add to Home Screen prompt. The installer therefore provides a current-browser visual assistant while the final browser Share → Add to Home Screen action remains controlled by iOS/browser UI.

Web content also cannot reliably inspect every Safari/Chrome toolbar preference. The iOS assistant asks one small calibration question only when needed rather than drawing an arrow to a guessed coordinate.

## iOS calibration privacy

The calibration choice is stored only in `sessionStorage` for the current browser session. It contains only non-sensitive UI values such as `top`, `bottom`, `share`, or `more`. It contains no identity, credentials, authentication state, analytics, or PII, and the user can select **Change toolbar setting** to recalibrate.

## Staging versus production

GitHub Pages is the device-validation host only. For the final public production route, serve the installer assets from a deliberately scoped same-origin path on `myhrfh.com` so the manifest, service worker, icons, launch route, and portal use the production origin.

See [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md) for the full browser matrix, security requirements, caching rules, service-worker boundary, accessibility contract, installed-state behavior, iOS calibration contract, and production deployment checklist.

## Security and privacy

The installer:

- accepts no arbitrary redirect destination;
- collects no credentials or personal information;
- includes no analytics or advertising identifiers;
- has no Salesforce or privileged-system access;
- does not proxy or cache cross-origin portal traffic;
- uses a same-origin install receipt containing only a boolean installed marker;
- uses session-only, non-sensitive iOS toolbar calibration;
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

The suite covers manifest/install identity, transparent icons, pre-paint launch behavior, Android/desktop native install prompts, legacy installed-state continuity, current-browser iOS handling, session calibration, calibrated coachmarks, Safari Share/More and Open-as-Web-App recovery, capability-gated management controls, service-worker scope/freshness, accessibility hooks, privacy safeguards, and production documentation.

## Physical-device acceptance

Before production rollout, test at minimum:

- Android Chrome clean install, already installed, uninstall/reinstall, and badged-shortcut fallback.
- iPhone Chrome portrait with the address bar at both **Top** and **Bottom**.
- iPhone Chrome landscape.
- iPhone Safari with **Share** directly visible and with **More (…)**.
- iPad Safari and Chrome.
- Safari **Open as Web App** and **Edit Actions → Add to Home Screen** recovery.
- **Change toolbar setting**, portrait/landscape rotation, reduced motion, zoom/reflow, and screen-reader labels.
- Windows Chrome clean install, existing install, deleted desktop shortcut while app remains installed, and uninstall/reinstall.
- Windows Edge equivalent states.
- macOS Chrome/Edge and Safari Add to Dock.

`main` is not used as a live production deployment target during staging validation.
