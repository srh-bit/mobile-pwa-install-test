# HRFH web app installer — production readiness

This document defines the production contract for the public HR for Health web-app installer targeting `https://myhrfh.com`.

## Production outcome

The installer must present the strongest action the current device/browser can truthfully support without claiming access to operating-system state or browser chrome that web content cannot inspect.

GitHub Pages is the staging/device-validation host only. The production package should be served from a deliberately scoped path on `myhrfh.com` so the manifest, service worker, launch route, icons, and destination are same-origin and do not require the GitHub launch intermediary.

## Governing state model

1. **Running as the installed web app** — redirect to `https://myhrfh.com` before installer UI paints.
2. **Installed confirmed** — show the installed state and Open action. Show Restore shortcut and Uninstall only when installation is positively confirmed and the current platform has an applicable management path.
3. **Installable** — if Chromium exposes `beforeinstallprompt`, show the native Install HRFH web app action.
4. **Manual install** — iPhone/iPad and browsers without a programmable install prompt receive browser-specific Add to Home Screen / Add to Dock guidance.
5. **Unknown** — do not claim installed or not installed. Do not expose installed-only management actions.

## Installed-state limits

`navigator.getInstalledRelatedApps()` is used only when available and only as positive evidence. Missing support, errors, or an empty relationship result remain **unknown** rather than proving uninstall.

A same-origin boolean receipt (`myhrfh-install-receipt-v1=installed`) provides continuity for verified prior installs:

- a normal browser visit cannot create it;
- it is written only from a real standalone launch or `appinstalled`;
- `launch.html` writes it only when running standalone, then forwards to `https://myhrfh.com` before installer UI can paint;
- if `beforeinstallprompt` later fires, the receipt is cleared because the browser has stronger evidence that the app is installable again.

A public webpage cannot reliably detect whether a Home Screen/Desktop/Dock icon itself is visible. Deleting a shortcut can leave the PWA installed. Restore shortcut therefore appears only after positive installed-state confirmation and never claims icon visibility was detected.

A webpage also cannot programmatically uninstall the PWA. Uninstall opens platform-specific user instructions only and is shown only after positive installed-state confirmation where that guidance applies.

## iPhone and iPad: current-browser-first

The governing iOS rule is **stay in the current browser**. Safari users remain in Safari; Chrome users remain in Chrome. The installer does not force or prefer a browser handoff. This removes a failure point and respects the browser the user already chose.

The generic Web Share API (`navigator.share()`) is deliberately not used as an installation trigger. A page-created share sheet is not equivalent to the browser's own Add-to-Home-Screen workflow.

### Why calibration exists

Web content cannot read all Safari/Chrome toolbar settings. Hard-coded pixel coordinates would eventually point at the wrong control. The iOS assistant therefore uses one-tap calibration only when the missing browser setting materially changes the Share location.

Calibration is:

- stored only in `sessionStorage` under `myhrfh-ios-install-calibration-v1`;
- limited to a non-sensitive UI choice such as `top`, `bottom`, `share`, or `more`;
- free of identity, credentials, analytics, PII, or authentication data;
- disposable when the browser session ends;
- user-changeable through **Change toolbar setting**.

### iPhone Chrome portrait

Chrome can place the address bar at the **top or bottom**, and the page cannot read that preference reliably.

The assistant asks one question:

**Where is your Chrome address bar?** — **Top** / **Bottom**

After that selection:

- Top → `chrome-address-top`, high-confidence top-right Share coachmark.
- Bottom → `chrome-address-bottom`, high-confidence bottom-right Share coachmark.

The coachmark includes a miniature Chrome address bar so the instruction remains understandable even if exact browser chrome spacing changes.

### iPhone Chrome landscape

Chrome landscape is treated as a stable top-toolbar layout. No calibration is required; show the high-confidence top-right Share coachmark.

### iPad Chrome

No calibration is required. Show the high-confidence top-right Share coachmark and toolbar illustration.

### iPhone Safari

Safari can expose **Share** directly or place sharing behind **More (…)** depending on browser layout/version. The page cannot inspect that setting.

The assistant asks:

**What do you see in Safari?** — **Share** / **More (…)**

Then:

- Share → `safari-control-share`; guide toward the lower Safari control region and instruct **Tap Share**.
- More → `safari-control-more`; guide toward the lower Safari control region and instruct **More (…) → Share**.

Safari's next step is **Add to Home Screen**. Keep **Open as Web App** enabled when Apple presents it, then tap **Add**.

A collapsed **Can't find Add to Home Screen?** recovery explains **Edit Actions → Add to Home Screen** without cluttering the default flow.

### iPad Safari

No calibration is required. Use the high-confidence top-right Share coachmark and Safari toolbar illustration, then **Add to Home Screen → Open as Web App → Add** when those controls are presented.

### Other iOS browsers

Use conservative browser-neutral Share → Add to Home Screen guidance. Do not claim an exact toolbar location unless the browser/layout is explicitly supported.

## iOS coachmark rules

- The page may dim behind the HRFH instruction sheet, but it must not pretend to draw over browser chrome.
- Exact coachmarks are allowed only after the required setting is known or for a stable supported layout.
- Ambiguous layouts use calibration or a region/illustration cue rather than a fake precise arrow.
- Coachmarks use safe-area insets for notches, Dynamic Island, and Home Indicator spacing.
- Orientation and viewport changes recalculate the profile.
- The enhancement is idempotent: unchanged browser/calibration/orientation state does not repeatedly rebuild the guide.
- `prefers-reduced-motion` disables nonessential pulse/transition behavior.
- Instructions remain understandable from text and iconography without relying on color.

## Browser/device matrix

| Environment | Installation path | Installed management |
| --- | --- | --- |
| Android Chrome / supported Chromium | installed-state probe/receipt; otherwise native `beforeinstallprompt`; fallback browser guidance | Open + conditional Restore/Uninstall after positive confirmation |
| iPhone Chrome portrait | current Chrome → one-tap Top/Bottom address-bar calibration → Share → Add to Home Screen | No installed-only actions in ordinary browser tabs unless state is positively confirmed |
| iPhone Chrome landscape | current Chrome → top-right Share coachmark → Add to Home Screen | Same conservative rule |
| iPad Chrome | current Chrome → top-right Share coachmark → Add to Home Screen | Same conservative rule |
| iPhone Safari | current Safari → one-tap Share/More calibration → Share → Add to Home Screen → Open as Web App → Add | Same conservative rule |
| iPad Safari | current Safari → top-right Share coachmark → Add to Home Screen → Open as Web App → Add | Same conservative rule |
| Windows Chrome | installed-related-app/receipt; otherwise native prompt | When confirmed: Open, Restore shortcut, Uninstall guidance |
| Windows Edge | installed-related-app/receipt; otherwise native prompt | When confirmed: Open, Restore shortcut, Uninstall guidance |
| macOS Chrome/Edge | installed-related-app/receipt where available; native prompt/fallback | When confirmed: Open and applicable management guidance |
| macOS Safari | File → Add to Dock | No installed-only management unless state is positively confirmed |
| Other/unsupported | conservative browser guidance | No false installed-state claim |

## Installation prompt timing

Chromium can dispatch `beforeinstallprompt` after initial page load. The page waits for a bounded prompt window before relying on supplemental receipt evidence. If the native prompt appears, it takes precedence and invalidates a stale receipt.

## Launch behavior

The manifest `start_url` remains same-origin and inside scope. In staging, `launch.html` is the minimal same-origin entry shell. When actually running standalone it records the verified receipt and redirects to `https://myhrfh.com` before any installer UI can paint.

For production, move this behavior to a deliberately scoped same-origin route on `myhrfh.com` so installed launches do not depend on GitHub Pages and Android/desktop have the strongest chance of producing a full web app rather than a browser-associated shortcut.

## Service worker contract

The release worker:

- uses cache identity `myhrfh-installer-v3`;
- preserves `desktop-installed-state-v2`;
- declares `ios-current-browser-v1`;
- declares `ios-guidance-v3` and `ios-calibrated-coachmark-v1`;
- caches the v2 compatibility stylesheet/script plus `ios-guidance-v3.css`;
- intercepts only same-origin GET requests;
- never proxies or caches cross-origin `myhrfh.com` in staging;
- uses network-first navigation freshness;
- uses cache-first behavior for stable same-origin static assets;
- removes obsolete release caches on activation;
- calls `skipWaiting()` and `clients.claim()` for bounded release turnover.

## Production HTTP headers

Configure these at the final `myhrfh.com` host, preferably as real HTTP response headers:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains` only after all included subdomains are HTTPS-ready.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Content-Security-Policy` restricted to the minimum production origins; avoid broad `*` sources.
- `Permissions-Policy` disabling unneeded capabilities such as camera, microphone, geolocation, payment, and USB.

Recommended cache policy:

- installer HTML and launch shell: revalidate on navigation;
- manifest: short-lived/revalidated;
- fingerprinted CSS/JS/icons: immutable long cache only after content-hashed production asset naming;
- service worker: frequent revalidation, never immutable long cache.

## Search and privacy

The staging installer uses `noindex, nofollow`. Production indexing should be an explicit HRFH decision.

The installer collects no credentials, authentication tokens, form data, analytics, advertising identifiers, or PII. The install receipt is a same-origin boolean. iOS calibration is a session-only browser-layout choice.

## Accessibility

- All controls are keyboard reachable with visible focus treatment.
- Dialogs have programmatic titles/descriptions.
- Live status uses `aria-live` without excessive announcements.
- Calibration options are real buttons grouped with accessible labels.
- Guidance does not depend on color alone.
- Safe-area layout prevents coachmarks from colliding with device cutouts/indicators.
- Reduced motion disables nonessential animation.
- Copy remains concise, sentence case, and understandable without PWA terminology.

## Failure behavior

- Service-worker failure leaves the online installer usable.
- Installed-state probe failure or empty relationship result remains `unknown`.
- A real `beforeinstallprompt` overrides/clears stale receipt evidence.
- Session storage failure simply causes calibration to be asked again; install guidance remains usable.
- If the user chose the wrong toolbar calibration, **Change toolbar setting** returns to the one-tap choice.
- If browser UI changes unexpectedly, the miniature toolbar and written instructions remain the authoritative fallback.
- Missing Safari Add to Home Screen is handled through collapsed **Edit Actions** recovery.
- Cancelled native installation returns to the page without claiming success.
- `appinstalled` writes the receipt and renders only management actions permitted by the capability gate.

## Security boundaries

- Fixed production destination: `https://myhrfh.com`; no arbitrary redirect input.
- No cross-origin service-worker proxy/cache behavior.
- No credentials, secrets, Salesforce access, or privileged APIs.
- No attempt to bypass install/uninstall consent.
- No browser-chrome or launcher inspection claim.
- No generic Web Share API masquerading as an installation API.
- No downloadable configuration profiles, APK sideloading, or native package installation.

## Automated engineering acceptance

Every candidate head must pass:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

Coverage includes manifest/scope, transparent icons, pre-paint launch, Android/iOS/desktop detection, current-browser iOS behavior, one-tap calibration, session-only calibration privacy, calibrated coachmarks, Safari Share/More and Open-as-Web-App recovery, relationship-sensitive installed-state triage, install-receipt continuity, condition-gated management actions, service-worker scope/freshness, accessibility hooks, and production/security documentation.

## Production deployment checklist

Before publishing the official HRFH install URL:

1. Serve installer, manifest, service worker, icons, and launch route from a deliberately scoped same-origin path on `myhrfh.com`.
2. Replace GitHub Pages manifest IDs/related-app URLs with the production origin.
3. Review service-worker scope so unrelated portal routes cannot be controlled accidentally.
4. Apply and verify CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, and cache headers.
5. Verify normal HRFH authentication remains authoritative.
6. Test clean install, confirmed install, legacy install with empty relationship result, deleted shortcut while app remains installed, cancelled install, full uninstall, and reinstall.
7. Verify standalone/appinstalled writes the receipt; normal browser visit does not; later `beforeinstallprompt` clears stale receipt evidence.
8. Test iPhone Chrome portrait with address bar at **Top** and **Bottom**; verify calibration and coachmark accuracy.
9. Test iPhone Chrome landscape and iPad Chrome without calibration.
10. Test iPhone Safari with **Share** directly visible and with **More (…)**; verify calibration and written paths.
11. Test iPad Safari without calibration.
12. Test Safari **Open as Web App** and **Edit Actions → Add to Home Screen** recovery.
13. Verify **Change toolbar setting** safely re-runs calibration.
14. Rotate portrait/landscape after calibration and confirm guidance recalculates without duplicate UI.
15. Test Android full-PWA and browser-badged shortcut fallback.
16. Test Windows Chrome/Edge before and after deleting only the desktop shortcut.
17. Test macOS Chrome/Edge and Safari Add to Dock.
18. Verify Restore shortcut and Uninstall remain hidden in unknown/manual-install states and appear only after positive installed-state confirmation on applicable platforms.
19. Verify keyboard operation, screen reader labels, zoom/reflow, safe areas, and reduced motion.
20. Confirm no analytics, credentials, PII, generic-share install workaround, or unexpected network calls are introduced.
21. Run the complete exact-head automated gate.
22. Complete physical-device acceptance before broad public release.

## Release decision

The repository can be treated as a production-ready **installer implementation** once automated checks and the physical-device matrix pass. GitHub Pages remains staging until the same-origin `myhrfh.com` deployment requirements above are completed.
