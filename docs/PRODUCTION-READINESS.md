# HRFH web app installer — production readiness

This document defines the production contract for the public HR for Health web-app installer that ultimately targets `https://myhrfh.com`.

## Production outcome

The public installer must give each visitor the most accurate action supported by the current browser without claiming capabilities the browser or operating system does not expose.

The final production package should be served from the `myhrfh.com` origin. The GitHub Pages site remains a staging/device-validation host only. Serving the manifest, service worker, icons, installer, and launch route from `myhrfh.com` removes the cross-origin launch intermediary and gives Android/desktop Chromium the strongest opportunity to install a full PWA rather than a browser-badged shortcut.

## State model

The installer uses these states in order:

1. **Running as the installed web app** — redirect immediately to `https://myhrfh.com` before installer UI paints.
2. **Installed confirmed** — where the browser can positively confirm this PWA, show the Installed state and Open action. Management actions are capability-gated:
   - **Restore shortcut** appears only when installation is positively confirmed and the current platform has an applicable restore path.
   - **Uninstall** appears only when installation is positively confirmed and the current platform has an applicable browser/OS removal path.
   - If those conditions are not met, neither management action is shown.
3. **Installable / not installed** — when Chromium exposes `beforeinstallprompt`, show the native Install HRFH web app action.
4. **Manual-install platform** — iPhone/iPad and browsers that do not expose a programmable install prompt receive concise browser-specific Add to Home Screen / Add to Dock guidance.
5. **Unknown** — when installation state cannot be proven, show conservative browser guidance. Do not claim that the app is installed or not installed and do not expose installed-only management actions.

## Important browser limitations

### Installed-state detection

`navigator.getInstalledRelatedApps()` is used only when present. It can confirm an installation in supported Chromium environments when the manifest relationship is configured correctly. It is not universally available and therefore cannot be the sole source of truth.

If the API is missing, blocked, throws, or returns no matching relationship, the installer records that result as **unknown**, not **not installed**. An empty relationship result is not treated as proof that the PWA has been removed because legacy installs can outlive manifest/relationship changes.

### Legacy and staging install continuity

The installer uses a same-origin boolean installation receipt as supplemental evidence for a previously verified install. This is specifically intended to preserve correct desktop behavior when a staging/legacy installation remains installed but the current relationship API cannot match it.

- The receipt key is `myhrfh-install-receipt-v1` and contains only the value `installed`; it contains no identity, authentication, analytics, or user data.
- A normal browser visit cannot create the receipt.
- The receipt is written only when the page is actually running in standalone mode or when the browser fires `appinstalled`.
- `launch.html` records the receipt only when it is running as the installed app, then forwards to `https://myhrfh.com` before installer UI can paint.
- The installer still waits for `beforeinstallprompt` before trusting a stored receipt. If the browser exposes a real install prompt, that capability is treated as stronger evidence that the app is currently installable and the receipt is cleared.
- Therefore `getInstalledRelatedApps()` remains a positive-confirmation source, while the receipt provides continuity for verified prior installs without converting an empty API result into a false not-installed conclusion.

### Home-screen icon detection

A normal public web page cannot reliably inspect whether a PWA icon is currently visible on a user's home screen, desktop, Dock, taskbar, Start menu, or launcher. The app may remain installed after a shortcut is deleted, particularly on desktop.

Accordingly, the Installed state says that shortcut placement is managed by the device. A **Restore shortcut** management action is offered only when installation is positively confirmed on a supported management platform. It never claims that a home-screen icon has been detected.

### Uninstall

A normal web page cannot programmatically uninstall the PWA. The **Uninstall** management action is shown only for a positively confirmed installation on an applicable platform, and it opens accessible instructions rather than performing removal. Removal remains explicitly user-controlled through the browser or operating system.

## iPhone and iPad visual guidance

The iOS manual-install experience uses a branded **confidence-aware guided overlay** rather than relying on text alone or pretending the webpage can inspect browser chrome.

The installer separates guidance into two confidence levels:

- **Exact edge cue** — used only where the current device/browser geometry is sufficiently stable to identify the Share-control edge with high confidence.
- **Region / illustration cue** — used where browser settings can move the control and the page cannot read that setting. The popup shows a miniature browser-toolbar illustration and written guidance instead of pointing to a fake exact coordinate.

### Safari

- **iPhone Safari:** use the bottom browser-toolbar **region**, not a single fixed icon coordinate. The guidance says **Tap Share, or More (…) → Share** so it remains valid across Safari tab-layout variants where Share may be directly visible or available through More.
- **iPad Safari:** use an exact top-right edge cue and a Safari toolbar illustration.
- After opening the Share sheet, guide the user to **Add to Home Screen**, keep **Open as Web App** enabled when presented, and tap **Add**.
- A collapsed **Can't find Add to Home Screen?** recovery hint explains **Edit Actions → Add to Home Screen** without adding default clutter.

### Chrome

- **iPhone Chrome portrait:** do **not** show an exact top/bottom edge arrow. Chrome allows the user to place the address bar at the top or bottom and normal webpage JavaScript cannot read that preference. Instead, show a miniature Chrome address bar with Share on its right and the instruction **Share is beside your address bar**.
- **iPhone Chrome landscape:** the address bar is treated as a stable top-toolbar layout; use an exact top-right edge cue plus the toolbar illustration.
- **iPad Chrome:** use the exact top-right edge cue plus the toolbar illustration.
- The Chrome install path remains **Share → Add to Home Screen → Add**.

### Guidance behavior

- The page dims behind the HRFH guidance sheet.
- Exact/region selection is recomputed when device orientation or viewport geometry changes.
- The enhancement layer is idempotent: an unchanged device/browser/orientation state does not repeatedly rebuild the guide.
- Reduced-motion users do not receive pulsing guide animation.
- Instructions remain complete even if browser UI moves in a future release.

The generic Web Share API (`navigator.share()`) is deliberately **not** used as the installation trigger. A page-level share sheet is not equivalent to the browser's own Share/Add-to-Home-Screen workflow and must not be presented as though it can install the PWA.

Web content cannot inspect, highlight, or manipulate Safari/Chrome browser chrome outside the page viewport. Exact-looking cues therefore appear only for high-confidence edge layouts; all other cases use a region marker or miniature toolbar illustration rather than claiming direct access to the actual browser button.

## Browser and device matrix

| Environment | Detection / install path | iOS guidance confidence / installed management |
| --- | --- | --- |
| Android Chrome / supported Chromium | `getInstalledRelatedApps()` when available; verified install receipt continuity; otherwise `beforeinstallprompt`; browser-menu fallback | When positively confirmed: Open; Restore shortcut; Uninstall guidance |
| iPhone Chrome portrait | Chrome-specific Share → Add to Home Screen | Region/illustration only because address bar can be top or bottom; no installed-only Restore/Uninstall in ordinary browser tabs |
| iPhone Chrome landscape | Chrome-specific Share → Add to Home Screen | Exact top-right edge cue + toolbar illustration; no installed-only Restore/Uninstall in ordinary browser tabs |
| iPad Chrome | Chrome-specific Share → Add to Home Screen | Exact top-right edge cue + toolbar illustration; no installed-only Restore/Uninstall in ordinary browser tabs |
| iPhone Safari | Chrome-preferred handoff when available; Safari Share or More → Share → Add to Home Screen | Bottom-toolbar region cue + Safari illustration; no installed-only Restore/Uninstall in ordinary browser tabs |
| iPad Safari | Chrome-preferred handoff when available; Safari Share → Add to Home Screen | Exact top-right edge cue + Safari illustration; no installed-only Restore/Uninstall in ordinary browser tabs |
| Windows Chrome | installed-related-app check; verified install receipt continuity; native install prompt | When positively confirmed: Open; `chrome://apps` → Create shortcut; uninstall guidance |
| Windows Edge | installed-related-app check; verified install receipt continuity; native install prompt | When positively confirmed: Open; `edge://apps` → Create Desktop shortcut; uninstall guidance |
| macOS Chrome / Edge | installed-related-app check when supported; verified install receipt continuity; native install prompt | When positively confirmed: Open; browser apps/shortcut management and uninstall guidance |
| macOS Safari | File → Add to Dock | Management controls are not shown unless installation is positively confirmed; otherwise manual application/Dock guidance only |
| Other / unsupported browser | conservative browser-menu guidance | No false installed-state claim and no installed-only management actions |

Browser UI labels can change between releases. Wording should identify the intent and include common current labels without assuming a single exact menu layout forever.

## Installation prompt timing

Chromium can dispatch `beforeinstallprompt` after page initialization. The public page therefore waits briefly for the native event before settling on fallback or receipt-based installed guidance. This prevents the page from prematurely showing an installed state when a native install prompt is about to become available and lets the browser invalidate a stale receipt after uninstall.

## Launch behavior

The manifest `start_url` must remain within the manifest scope and on the same origin as the installed PWA. In staging, `launch.html` is a minimal same-origin shell that, when actually running standalone, records the verified install receipt and then redirects to `https://myhrfh.com` in the document head before installer UI can render.

For production, host the installer and launch route directly under `myhrfh.com`. Prefer a same-origin application route so the installed app opens the intended portal without a GitHub-origin intermediary or browser badge associated with a cross-origin shortcut workflow.

## Service worker behavior

The service worker:

- intercepts only same-origin GET requests;
- never proxies, caches, or intercepts `myhrfh.com` when it is cross-origin in the staging build;
- uses **network-first** behavior for navigations so public installer HTML and state logic refresh promptly;
- uses cache-first behavior for stable same-origin static assets;
- claims clients after activation and maintains a bounded app-shell cache;
- uses release cache identity `myhrfh-installer-v2` for the release candidate;
- includes explicit `desktop-installed-state-v2`, `ios-guided-overlay-v1`, and `ios-guidance-v2` revision markers;
- caches the separate `ios-guidance-v2.js` and `ios-guidance-v2.css` enhancement layer;
- must be versioned/revised whenever install-state behavior or critical UI assets change.

## Production HTTP headers

Configure these on the final `myhrfh.com` host. Prefer HTTP response headers over HTML-only equivalents.

### Required

- `Strict-Transport-Security: max-age=31536000; includeSubDomains` after confirming every included subdomain is HTTPS-ready.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Content-Security-Policy` restricted to the minimum origins required by the production portal and installer. The installer itself should need only self-hosted scripts/styles/images plus the deliberate Chrome iOS handoff. Avoid broad `*` sources.
- `Permissions-Policy` disabling capabilities the installer does not need, such as camera, microphone, geolocation, payment, and USB.

### Recommended caching

- installer HTML and launch shell: revalidate on navigation (`Cache-Control: no-cache` or an equivalent short-lived policy);
- manifest: short-lived/revalidated so name/icon/start-url corrections propagate;
- fingerprinted CSS/JS/icons: long-lived immutable caching after production assets use content-hashed filenames;
- service worker script: revalidate frequently; do not give it an immutable long cache lifetime.

## Search and privacy

The installer is public but operational rather than search content, so the staging/public installer page uses `noindex, nofollow` unless HR for Health deliberately decides the production install route should be indexed.

The installer collects no credentials, authentication tokens, form data, analytics, advertising identifiers, or personal information. The install receipt is a same-origin boolean marker only and contains no user-specific data.

## Accessibility requirements

- All controls must be keyboard reachable.
- Visible focus states must remain present.
- Dialogs must expose a programmatic title and description.
- The management dialog uses native `<dialog>` semantics where supported and includes a close action.
- Live status messages use `aria-live` without excessive announcements.
- Instructions must not rely on color alone; the iOS guidance combines edge/toolbar illustration, numbering, iconography, and text.
- `prefers-reduced-motion` must disable nonessential animation, including the iOS edge pulse.
- Text should remain sentence case, concise, and understandable without technical PWA vocabulary where possible.

## Failure behavior

- If service-worker registration fails, the page remains usable online and provides a concise refresh/retry message.
- If installed-state probing fails or returns no matching relationship, use `unknown`; do not infer not-installed.
- If a verified install receipt exists, wait for the bounded native-install-prompt window before using it as supplemental installed evidence.
- If `beforeinstallprompt` fires, clear any stored receipt and render the native install state.
- If Chrome handoff on iOS cannot complete, preserve the Safari fallback.
- If an iOS toolbar location is not knowable, use region/illustration guidance instead of an exact arrow.
- If Safari Share is not directly visible, the written **More (…) → Share** path remains complete.
- If Add to Home Screen is missing from Safari actions, the collapsed **Edit Actions** recovery remains available.
- If `beforeinstallprompt` never arrives, use the strongest remaining verified evidence or render browser-specific fallback guidance.
- If the native install is cancelled, return control to the page without claiming success.
- If an install completes and `appinstalled` fires, write the install receipt, render the Installed state, and show only management actions permitted by the current platform/capability gate.

## Security boundaries

- No arbitrary URL redirects: the production destination is fixed to `https://myhrfh.com`.
- No arbitrary service-worker proxying or cross-origin caching.
- No credentials, secrets, Salesforce access, or privileged APIs.
- No attempt to bypass browser/OS install or uninstall consent.
- No attempt to inspect browser chrome or device launcher contents.
- No generic Web Share API masquerading as an installation API.
- No downloadable configuration profiles, APK sideloading, or native package installation.

## Automated engineering acceptance

The release workflow must run these checks on the exact candidate commit:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

The behavior suite covers the manifest contract, transparent icons, pre-paint launch behavior, Android/iOS/desktop detection, Chrome-first iOS flow, confidence-aware Safari/Chrome visual guidance, orientation/layout adaptation, idempotent guidance enhancement, Safari Open-as-Web-App/Edit-Actions recovery, relationship-sensitive installed-state triage, verified install-receipt continuity, condition-gated management actions, shortcut restoration, uninstall guidance, service-worker scope/freshness, accessibility hooks, privacy safeguards, and production/security documentation.

## Production deployment checklist

Before making the public URL the official HRFH install route:

1. Serve the installer, manifest, service worker, icons, and launch route from `myhrfh.com` or a deliberately scoped same-origin path.
2. Replace GitHub Pages-specific manifest IDs/related-app URLs with the production origin.
3. Review the service-worker scope so it cannot unintentionally control unrelated portal routes.
4. Configure and verify `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy, and cache headers.
5. Verify the destination route requires normal HRFH authentication and the installer does not weaken authentication behavior.
6. Test clean first-install, already-installed, legacy-installed-with-empty-related-app-result, deleted-shortcut-but-app-still-installed, cancelled-install, full uninstall, and reinstall on each supported platform.
7. Verify a real standalone launch/appinstalled writes the receipt, a normal browser visit does not, and a later `beforeinstallprompt` clears it after uninstall.
8. Test **iPhone Safari** with each available tab-layout style; confirm direct Share and More → Share guidance both remain understandable.
9. Test **iPhone Chrome portrait** with the address bar at both top and bottom; confirm there is no false exact edge arrow and the toolbar illustration remains correct.
10. Test **iPhone Chrome landscape** and verify the exact top-right cue aligns with the Share-control edge.
11. Test **iPad Safari and Chrome** and verify the exact top-right cue plus toolbar illustration.
12. Test Safari's **Open as Web App** path and the **Edit Actions → Add to Home Screen** recovery.
13. Test iOS with Chrome installed and without Chrome available.
14. Test Android where Chrome mints a full web app and where the browser falls back to a badged shortcut.
15. Test Windows Chrome and Edge both before and after deleting only the desktop shortcut.
16. Test macOS Chrome/Edge and Safari Add to Dock.
17. Verify Restore shortcut and Uninstall are absent in unknown/manual-install states and present only after positive installed-state confirmation on supported platforms.
18. Verify keyboard-only use, screen-reader dialog labels, zoom/reflow, and reduced motion.
19. Confirm no analytics, credentials, PII, generic share-install workaround, or unexpected network requests are introduced.
20. Run the complete repository validation suite and all browser-script syntax checks on the exact release commit.
21. Perform a final physical-device acceptance pass before publishing the production install link broadly.

## Release decision

The repository can be treated as a production-ready **installer implementation** once all automated checks are green and physical-device acceptance passes. The GitHub Pages deployment remains a staging proof until the same-origin `myhrfh.com` production-host requirements above are completed.
