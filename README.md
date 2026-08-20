# myHRFH mobile install prototype

This repository hosts the public staging implementation for installing quick access to the HR for Health portal as a web app across supported mobile and desktop browsers.

The staging installer is published through GitHub Pages and ultimately targets `https://myhrfh.com`.

## Public staging URL

`https://srh-bit.github.io/mobile-pwa-install-test/`

## What the installer does

- Detects iPhone/iPad, Android, Windows, macOS, and generic desktop environments.
- Uses the browser's native install prompt where supported.
- Uses browser-specific manual-install guidance where the platform does not expose a programmable prompt.
- Prioritizes Google Chrome on iPhone/iPad, with Safari fallback.
- Provides a branded iOS visual guidance overlay for Share → Add to Home Screen.
- Detects supported installed-PWA states conservatively and never treats an empty relationship API result as definitive proof of uninstall.
- Preserves a verified same-origin install receipt after real standalone launch or `appinstalled`, allowing legacy desktop installs to remain recognizable after manifest evolution.
- Clears that receipt when a real `beforeinstallprompt` is exposed, preventing stale installed state after uninstall.
- Shows Restore shortcut / Uninstall management only when installation is positively confirmed and those actions are applicable to the current platform.
- Immediately forwards installed launches to `https://myhrfh.com` before installer UI can paint.

## Important platform limitations

A normal public web page cannot reliably detect whether a launcher/Home Screen/Desktop icon itself is visible. A PWA can remain installed even after a user removes only a desktop shortcut.

A normal public web page also cannot programmatically uninstall a PWA. Where appropriate, the installer provides browser/OS instructions while leaving removal under user control.

On iOS, Apple does not expose an Android-style programmable Add to Home Screen prompt. The installer therefore provides visual on-screen guidance while the final Share → Add to Home Screen action remains controlled by iOS/browser UI.

## Staging versus production

GitHub Pages is the device-validation host only. For the final public production route, the installer assets should be served from a deliberately scoped same-origin path on `myhrfh.com` so the manifest, service worker, icons, launch route, and portal share the production origin.

See [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md) for the full browser matrix, security requirements, caching rules, service-worker boundary, accessibility contract, installed-state behavior, and production deployment checklist.

## Security and privacy

The installer:

- accepts no arbitrary redirect destination;
- collects no credentials or personal information;
- includes no analytics or advertising identifiers;
- has no Salesforce or privileged-system access;
- does not proxy or cache cross-origin portal traffic;
- uses a same-origin install receipt containing only a boolean installed marker;
- does not attempt to bypass browser/OS install or uninstall consent.

See [`SECURITY.md`](SECURITY.md) for the security policy and reporting guidance.

## Repository validation

GitHub Actions validates browser JavaScript syntax and the complete behavior/security/readiness suite on each feature-branch/PR change:

```text
node --check install.js
node --check service-worker.js
node --test tests/*.mjs
```

The current suite covers manifest/install identity, transparent icons, installed launch, Android/desktop native install prompts, legacy installed-state continuity, Chrome-first iOS handling, Safari fallback, iOS visual guidance, capability-gated management controls, service-worker scope/freshness, accessibility hooks, privacy safeguards, and production documentation.

## Physical-device acceptance

Before production rollout, test at minimum:

- Android Chrome clean install, already installed, uninstall/reinstall, and badged-shortcut fallback.
- iPhone Chrome guided install.
- iPhone Safari Chrome-first handoff and Safari fallback.
- iPad portrait and landscape guidance.
- Windows Chrome clean install, existing install, deleted desktop shortcut while app remains installed, and uninstall/reinstall.
- Windows Edge equivalent states.
- macOS Chrome/Edge and Safari Add to Dock.
- keyboard navigation, screen-reader dialog labels, zoom/reflow, and reduced-motion behavior.

`main` is not used as a live production deployment target during staging validation.