# myHRFH web app installer

This repository contains the public staging implementation for adding the HR for Health portal as a browser-installed Progressive Web App (PWA). The supported release architecture is **PWA-only**: there is no Android APK, Trusted Web Activity wrapper, native bridge, Play Store dependency, or sideload distribution requirement.

Staging URL: `https://srh-bit.github.io/mobile-pwa-install-test/`

The final portal destination is fixed to `https://myhrfh.com`.

## Android and desktop install behavior

Chromium controls whether the programmable `beforeinstallprompt` event is available. The page waits up to 1.2 seconds for that real browser capability. **Install HRFH web app** is shown only when a live native prompt has actually been captured; otherwise the page falls back to browser-menu installation guidance rather than leaving a dead custom action visible.

The earlier controller reconciliation used the immediate pre-Marketing boundary for behavior:

- pre-Marketing parent: `3251b8addb47cd9169afe365b8689b3aab69c561`
- first Marketing-package commit: `09191a2fb6540cf9adc8f449e0bd17888675e82d`

Physical testing then exposed a separate installability regression: both Android and Desktop stopped receiving Chromium's native prompt at all. A real-Chrome CI diagnostic using DevTools `Page.getInstallabilityErrors` reproduced the failure as `no-acceptable-icon`. The controller was therefore not the root cause of the missing button.

The exact launcher PNG binaries from the last accepted Android install/duplicate-prevention head, `337a6b1acdb611c7ee5698c0598696fb2ed35260`, were restored. With those binaries and the accepted two-icon `purpose: any` manifest contract, current Chromium reports **zero installability errors** in CI. This browser-level check now runs with the repository suite so an icon change that makes Chromium reject the PWA fails validation before handoff.

If Chromium exposes its native prompt, the custom Install button invokes it. If it does not, Android shows browser-menu **Install app** guidance and desktop Chrome/Edge show the browser's **Install app** / install-icon guidance. macOS Safari uses **File → Add to Dock**.

### Desktop uninstall recovery

The installer stores a same-origin receipt after a successful install so it can conservatively recognize a previously installed app when browser installed-state APIs are unavailable. That receipt outlives a browser uninstall, so it cannot be treated as permanent authority.

On Chromium Desktop, a fresh `beforeinstallprompt` is browser-owned evidence that the current PWA is installable again. When that event arrives, the controller now clears any stale local install receipt, resets the prior installed flag, and presents **Install HRFH web app**. This allows an uninstall followed by a return to staging to recover automatically instead of remaining stuck on **HRFH web app was previously installed**.

Android intentionally retains its stronger duplicate-install guard: a `beforeinstallprompt` event does not by itself erase positive Android installed evidence. The existing Android related-app probe remains responsible for distinguishing installed versus removed state where supported.

The manifest declares the PWA as its own related web app so supported Android Chrome versions can use `navigator.getInstalledRelatedApps()` as direct installed-PWA evidence. A positive related-app result, standalone launch, accepted install, or `appinstalled` records installed state. A successful empty Android related-app result means not installed and clears stale receipt state. Unsupported/error states remain unknown and may conservatively use the same-origin install receipt.

When Android installation is confirmed, the installed state remains intentionally simple: **Open HRFH web app** and **Reinstall**. There is no Restore or Uninstall control. A website cannot inspect or verify whether the Android Home Screen/launcher icon itself remains present after installation.

## iPhone and iPad

iOS behavior is intentionally unchanged. It keeps the approved direct Share / More / Add to Home Screen guidance and does not depend on Chromium's programmable PWA install event.

## Security and privacy

The installer collects no credentials, PII, analytics identifiers, advertising identifiers, or Salesforce data. The service worker intercepts same-origin GET traffic only. There is no native Android code, arbitrary URL/Intent/package bridge, signing material, or APK distribution surface.

The visible brand mark currently loads from the approved `https://hrforhealth.com/wp-content/uploads/2024/04/Logo-icon-1.png.webp` asset. Production CSP must explicitly allow that HTTPS image origin if the asset remains external at release time.

See `SECURITY.md`, `docs/ANDROID-PWA-RECOVERY.md`, and `docs/PRODUCTION-READINESS.md`.

## Repository validation

Every candidate head runs:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

The test suite includes a headless-Chromium installability smoke test that serves the exact checked-out head, waits for the service worker, reads the parsed manifest, and requires `Page.getInstallabilityErrors` to return no errors. It also includes a Desktop lifecycle regression that seeds stale installed receipt state after controller initialization and verifies a fresh installability signal clears that receipt and restores the Install action.

Current cache identity: `myhrfh-installer-v12`. Controller revision: `pre-marketing-install-behavior-v1`. Android recovery revision: `android-pwa-recovery-v2`. Android installed UI revision: `android-installed-ui-v1`. iOS guidance revision: `ios-final-guidance-v2`.

Cache v12 is deliberate: v11 may contain the controller that left Desktop on the stale **previously installed** state after browser uninstall. The v12 activation evicts obsolete cache state and stages the Desktop uninstall-recognition fix while retaining the accepted launcher assets and iOS runtime.

Staging validation deliberately does **not** create or upload the Marketing ZIP. The intended Marketing route remains `https://hrfh.hrforhealth.com/web-install/`; packaging is a separate post-device-acceptance step after physical Android/Desktop staging validation.

Physical-device acceptance is still required before Marketing handoff. `main` is not used as a live production deployment target during staging validation.
