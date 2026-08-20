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

The iOS manual-install experience uses a branded **guided overlay** rather than relying only on text instructions.

- The page dims behind the HRFH guidance sheet.
- A pulsing orange/coral spotlight and arrow point toward the nearest browser-toolbar edge where the Share control is expected.
- The guide contains only two user actions: **Tap Share** and **Add to Home Screen**.
- Chrome on iOS receives Chrome-specific visual guidance.
- Safari receives Safari-specific visual guidance as the fallback.
- iPad and landscape layouts move the guide toward the top-toolbar edge; portrait Safari uses the lower-toolbar edge where appropriate.
- The guide recalculates when orientation or viewport size changes.
- Reduced-motion users do not receive the pulsing animation.

This is visual guidance only. Web content cannot inspect, highlight, or manipulate Safari/Chrome browser chrome outside the page viewport, so the overlay points toward the relevant screen edge rather than falsely claiming access to the actual toolbar control. Browser UI can also move between versions or user settings; the instructions therefore remain usable even if the exact toolbar coordinate changes.

## Browser and device matrix

| Environment | Detection / install path | Installed management |
| --- | --- | --- |
| Android Chrome / supported Chromium | `getInstalledRelatedApps()` when available; verified install receipt continuity; otherwise `beforeinstallprompt`; browser-menu fallback | When positively confirmed: Open; Restore shortcut; Uninstall guidance |
| iPhone / iPad Chrome | Chrome-specific guided overlay → Share → Add to Home Screen | Normal browser tabs cannot reliably confirm installation; no installed-only Restore/Uninstall controls |
| iPhone / iPad Safari | Chrome-preferred handoff when available; Safari guided overlay → Share → Add to Home Screen fallback | Normal Safari tabs cannot reliably confirm installation; no installed-only Restore/Uninstall controls |
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
- uses release cache identity `myhrfh-installer-v2` for the guided-overlay release candidate;
- includes explicit `desktop-installed-state-v2` and `ios-guided-overlay-v1` revision markers;
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
- Instructions must not rely on color alone; the iOS overlay combines arrow/shape, numbering, and text.
- `prefers-reduced-motion` must disable nonessential animation, including the iOS spotlight pulse.
- Text should remain sentence case, concise, and understandable without technical PWA vocabulary where possible.

## Failure behavior

- If service-worker registration fails, the page remains usable online and provides a concise refresh/retry message.
- If installed-state probing fails or returns no matching relationship, use `unknown`; do not infer not-installed.
- If a verified install receipt exists, wait for the bounded native-install-prompt window before using it as supplemental installed evidence.
- If `beforeinstallprompt` fires, clear any stored receipt and render the native install state.
- If Chrome handoff on iOS cannot complete, preserve the Safari fallback.
- If the iOS toolbar position heuristic is imperfect, the two-step written guidance remains complete without depending on the spotlight location.
- If `beforeinstallprompt` never arrives, use the strongest remaining verified evidence or render browser-specific fallback guidance.
- If the native install is cancelled, return control to the page without claiming success.
- If an install completes and `appinstalled` fires, write the install receipt, render the Installed state, and show only management actions permitted by the current platform/capability gate.

## Security boundaries

- No arbitrary URL redirects: the production destination is fixed to `https://myhrfh.com`.
- No arbitrary service-worker proxying or cross-origin caching.
- No credentials, secrets, Salesforce access, or privileged APIs.
- No attempt to bypass browser/OS install or uninstall consent.
- No attempt to inspect browser chrome or device launcher contents.
- No downloadable configuration profiles, APK sideloading, or native package installation.

## Automated engineering acceptance

The release workflow must run these checks on the exact candidate commit:

```text
node --check install.js
node --check service-worker.js
node --test tests/*.mjs
```

The behavior suite covers the manifest contract, transparent icons, pre-paint launch behavior, Android/iOS/desktop detection, Chrome-first iOS flow, guided iOS visual guidance, relationship-sensitive installed-state triage, verified install-receipt continuity, condition-gated management actions, shortcut restoration, uninstall guidance, service-worker scope/freshness, accessibility hooks, privacy safeguards, and production/security documentation.

## Production deployment checklist

Before making the public URL the official HRFH install route:

1. Serve the installer, manifest, service worker, icons, and launch route from `myhrfh.com` or a deliberately scoped same-origin path.
2. Replace GitHub Pages-specific manifest IDs/related-app URLs with the production origin.
3. Review the service-worker scope so it cannot unintentionally control unrelated portal routes.
4. Configure and verify `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy, and cache headers.
5. Verify the destination route requires normal HRFH authentication and the installer does not weaken authentication behavior.
6. Test clean first-install, already-installed, legacy-installed-with-empty-related-app-result, deleted-shortcut-but-app-still-installed, cancelled-install, full uninstall, and reinstall on each supported platform.
7. Verify a real standalone launch/appinstalled writes the receipt, a normal browser visit does not, and a later `beforeinstallprompt` clears it after uninstall.
8. Test iOS Chrome and Safari in portrait and landscape, including iPad, and confirm the guided overlay points toward the appropriate toolbar edge without obscuring required controls.
9. Test iOS with Chrome installed and without Chrome available.
10. Test Android where Chrome mints a full web app and where the browser falls back to a badged shortcut.
11. Test Windows Chrome and Edge both before and after deleting only the desktop shortcut.
12. Test macOS Chrome/Edge and Safari Add to Dock.
13. Verify Restore shortcut and Uninstall are absent in unknown/manual-install states and present only after positive installed-state confirmation on supported platforms.
14. Verify keyboard-only use, screen-reader dialog labels, zoom/reflow, and reduced motion.
15. Confirm no analytics, credentials, PII, or unexpected network requests are introduced.
16. Run the complete repository validation suite and browser-script syntax checks on the exact release commit.
17. Perform a final physical-device acceptance pass before publishing the production install link broadly.

## Release decision

The repository can be treated as a production-ready **installer implementation** once all automated checks are green and physical-device acceptance passes. The GitHub Pages deployment remains a staging proof until the same-origin `myhrfh.com` production-host requirements above are completed.
