# HRFH web app installer — production readiness

This document defines the production contract for the public HR for Health web-app installer targeting `https://myhrfh.com`.

## Production outcome

The installer must present the strongest action the current device/browser can truthfully support without claiming access to operating-system state, launcher state, or browser chrome that web content cannot inspect.

GitHub Pages is the staging/device-validation host only. The production package should be served from a deliberately scoped path on `myhrfh.com` so the manifest, service worker, launch route, icons, and destination are same-origin and do not require the GitHub launch intermediary.

## Governing state model

1. **Running as the installed web app** — redirect to `https://myhrfh.com` before installer UI paints.
2. **Installed confirmed or previously verified by this installer** — show the installed state and Open action. Platform management controls appear only where the current implementation can truthfully perform an applicable action.
3. **Installable** — if Chromium exposes `beforeinstallprompt` and there is no stronger positive installed evidence, show the native Install HRFH web app action.
4. **Manual install** — iPhone/iPad and browsers without a programmable install prompt receive browser-specific Add to Home Screen / Add to Dock guidance. Android fallback prefers **Install app** rather than an unverifiable generic launcher bookmark.
5. **Unknown** — do not claim installed or not installed. Do not expose installed-only management actions.

## Installed-state limits

`navigator.getInstalledRelatedApps()` is used only when available and only as positive evidence. Missing support, errors, or an empty relationship result remain **unknown** rather than proving uninstall.

A same-origin boolean receipt (`myhrfh-install-receipt-v1=installed`) provides continuity for verified prior installs. It may be written only after positive install evidence:

- the user accepts the browser's native PWA install prompt;
- `appinstalled` fires;
- a real standalone launch occurs;
- or `navigator.getInstalledRelatedApps()` positively identifies the related web app.

`launch.html` writes the receipt only when running standalone, then forwards to `https://myhrfh.com` before installer UI can paint.

A later `beforeinstallprompt` **must not clear, erase, or invalidate** an existing positive receipt. On refresh, positive installed evidence is evaluated before the page decides whether a newly exposed install prompt should be shown. This prevents the page from repeatedly advertising another install after this installer already observed a successful installation.

The Android **Reinstall** action is the deliberate recovery boundary. It intentionally clears the local receipt only when the user says they removed the app and want Chrome to reassess installability. If the browser can still positively identify the installed PWA, that positive evidence may reassert installed state rather than forcing a duplicate.

A public webpage cannot reliably inspect an arbitrary Android launcher/Home Screen bookmark, shortcut, or icon. A user-created launcher bookmark is not equivalent to a positively identifiable installed PWA and must not be presented as though JavaScript can enumerate launcher state.

Similarly, deleting only a shortcut can leave an installed PWA intact on desktop or Android. The web implementation never claims it can see the launcher's icon inventory.

## Android web behavior

### Installation

For Android Chrome / supported Chromium:

1. check standalone state and supported related-app evidence;
2. honor an existing verified install receipt;
3. only then use a captured `beforeinstallprompt` to expose **Install HRFH web app**;
4. write the receipt immediately when the user accepts the native install prompt;
5. keep `appinstalled` and standalone launch as additional positive confirmation paths.

`beforeinstallprompt` is an installability capability, not proof that every previous launcher artifact is absent. It does not override stronger positive evidence owned by this installer.

The Android manual fallback tells the user to choose **Install app** from the browser menu. It does not promote generic **Add to Home screen** as an equivalent managed-install path because a plain launcher bookmark may not be observable later through PWA installed-state APIs.

### Android web-only management

The pure-web build does **not** expose Android **Restore shortcut** or **Uninstall** buttons merely to display instructions. A normal webpage cannot call Android `ShortcutManager`, enumerate arbitrary launcher icons, or uninstall an application package.

When Android install evidence is positive, the web UI offers:

- **Open HRFH web app**;
- **Reinstall** as an explicit recovery action if the user actually removed the app.

The Reinstall action is intentionally conservative and user-initiated. It is not an automatic downgrade from installed to installable.

### Future native / Trusted Web Activity management

If HRFH requires real Android Restore and Uninstall actions, implement them in a separate lightweight **Trusted Web Activity (TWA)** / Android package associated with the production `myhrfh.com` origin through Digital Asset Links.

The native layer must use public Android APIs only:

- **Restore shortcut:** use `ShortcutManager` / `requestPinShortcut()` for the application's own stable shortcut and allow Android/launcher confirmation to remain authoritative.
- **Shortcut state:** query only the native package's own shortcut state where public APIs permit; never enumerate unrelated launcher content.
- **Uninstall:** launch Android's public system package-removal or application-management UI for the HRFH package and require user confirmation. Do not attempt silent self-uninstall.
- **Web/native bridge:** if a TWA postMessage bridge is added, expose only a fixed allowlist of HRFH management commands and verify the associated origin/package relationship. Never provide arbitrary intent, URL, shell, package, or command execution.

No hidden, private, internal, reflection-based, or other non-SDK Android API is permitted. The current GitHub Pages staging build contains no native Android package and therefore cannot offer those native-only management actions.

## iPhone and iPad: final direct installation guidance

The iOS assistant is intentionally short and does not ask users to identify their toolbar layout. It presents the installation actions directly and uses browser/device/orientation detection only to choose the safest visual cue.

The generic Web Share API (`navigator.share()`) is deliberately not used as an installation trigger. A page-created share sheet is not equivalent to the browser's own Add-to-Home-Screen workflow.

### iOS action symbols

Instructional icons must preserve the geometry of the controls users actually see on iOS and must be rendered as vector artwork rather than placeholder Unicode characters. Their surrounding card, color, glow, and spacing may follow the HRFH page design system so the assistant remains visually consistent with the installer.

- **Share** — outlined square with an upward arrow, matching the familiar iOS share control.
- **More** — outlined circle containing three horizontal dots, matching the current circular iOS More control used as an alternate entry point to sharing.
- **Add to Home Screen** — outlined rounded square containing a plus.

The icon silhouettes and internal geometry remain iOS-faithful; the presentation uses the HRFH purple/orange palette and subtle branded depth instead of recreating Apple's blue/gray browser chrome.

Do not recreate unrelated Safari/Chrome toolbar controls. In particular, do not show placeholder back arrows, tab-overview squares, fake browser buttons, or approximate text glyphs when they are not required for installation.

### iPhone Safari

Safari may expose **Share** directly or may place sharing behind the circular **More** control depending on iOS/Safari layout and version. Web content cannot reliably inspect that toolbar preference.

The assistant therefore gives one direct instruction without asking a question:

**Tap Share, or More if Share isn't shown. Then choose Share.**

The visual guide shows both supported first-step symbols and may indicate the lower Safari control region, but it must not claim a pixel-perfect position for browser chrome outside the webpage.

After the Share sheet opens:

1. choose **Add to Home Screen**;
2. keep **Open as Web App** enabled when Apple presents it;
3. tap **Add**.

A collapsed **Can't find Add to Home Screen?** recovery explains **Edit Actions → Add to Home Screen** without cluttering the default flow.

### iPad Safari

Use the high-confidence top-right Share cue and the iOS-style Share symbol. Continue with **Add to Home Screen → Open as Web App → Add** when those controls are presented.

### iPhone Chrome portrait

Chrome can place the address bar at the top or bottom. The webpage cannot reliably read that preference and must not ask the user to report it.

Show the iOS-style Share symbol with the direct instruction:

**Tap Share beside the address bar.**

The supporting copy may explain that Chrome can place the address bar at the top or bottom. Do not display an exact edge pointer in this ambiguous layout.

### iPhone Chrome landscape

Chrome landscape uses a stable top toolbar. A high-confidence top-right Share cue is acceptable, followed by **Add to Home Screen → Add**.

### iPad Chrome

Use the high-confidence top-right Share cue, followed by **Add to Home Screen → Add**.

### Other iOS browsers

Use conservative Share → Add to Home Screen guidance. Do not claim an exact toolbar location unless the browser/layout is explicitly supported.

## iOS coachmark rules

- The page may dim behind the HRFH instruction sheet, but it must not pretend to draw over browser chrome.
- Stable supported layouts may use an edge cue.
- Ambiguous layouts use an accurate action symbol and written instruction rather than guessed pixel coordinates.
- No toolbar-layout questionnaire or calibration storage is permitted in the final flow.
- Only installation-relevant controls are illustrated.
- Share, circled More, and Add-to-Home-Screen vector geometry must remain crisp and recognizable at Retina scaling and zoom.
- HRFH color and surface styling may wrap those symbols without changing their iOS-recognizable shapes.
- Coachmarks use safe-area insets for notches, Dynamic Island, and Home Indicator spacing.
- Orientation and viewport changes recalculate the profile.
- `prefers-reduced-motion` disables nonessential pulse/transition behavior.
- Instructions remain understandable from text and iconography without relying on color.

## Browser/device matrix

| Environment | Installation path | Installed management |
| --- | --- | --- |
| Android Chrome / supported Chromium | positive state probe/receipt first; otherwise native `beforeinstallprompt`; fallback **Install app** guidance | Web build: Open + deliberate Reinstall recovery; no instruction-only Restore/Uninstall |
| Future Android TWA | Android package associated with production origin | Public-API user-confirmed Restore via `ShortcutManager`; direct system uninstall/application-management handoff |
| iPhone Chrome portrait | Share beside address bar → Add to Home Screen; no exact edge claim | No installed-only actions in ordinary browser tabs unless state is positively confirmed |
| iPhone Chrome landscape | top-right Share cue → Add to Home Screen | Same conservative rule |
| iPad Chrome | top-right Share cue → Add to Home Screen | Same conservative rule |
| iPhone Safari | Share; if absent circled More → Share → Add to Home Screen → Open as Web App → Add | Same conservative rule |
| iPad Safari | top-right Share cue → Add to Home Screen → Open as Web App → Add | Same conservative rule |
| Windows Chrome | installed-related-app/receipt; otherwise native prompt | When confirmed: Open, Restore shortcut, Uninstall guidance |
| Windows Edge | installed-related-app/receipt; otherwise native prompt | When confirmed: Open, Restore shortcut, Uninstall guidance |
| macOS Chrome/Edge | installed-related-app/receipt where available; native prompt/fallback | When confirmed: Open and applicable management guidance |
| macOS Safari | File → Add to Dock | No installed-only management unless state is positively confirmed |
| Other/unsupported | conservative browser guidance | No false installed-state claim |

## Installation prompt timing

Chromium can dispatch `beforeinstallprompt` after initial page load. The page waits for a bounded prompt window only after checking stronger positive installed evidence.

A `beforeinstallprompt` event is stored so it can power a native install or a later explicit Android Reinstall request, but the event **does not clear or invalidate** a positive install receipt and does not automatically replace an installed state with an Install button.

## Launch behavior

The manifest `start_url` remains same-origin and inside scope. In staging, `launch.html` is the minimal same-origin entry shell. When actually running standalone it records the verified receipt and redirects to `https://myhrfh.com` before any installer UI can paint.

For production, move this behavior to a deliberately scoped same-origin route on `myhrfh.com` so installed launches do not depend on GitHub Pages and Android/desktop have the strongest chance of producing a full web app rather than a browser-associated shortcut.

## Service worker contract

The release worker:

- uses cache identity `myhrfh-installer-v6`;
- declares `android-installed-state-v1`;
- preserves `desktop-installed-state-v2`;
- declares `ios-current-browser-v1`;
- declares `ios-final-guidance-v2`;
- caches the required final iOS guidance stylesheet/script;
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

The installer collects no credentials, authentication tokens, form data, analytics, advertising identifiers, or PII. The install receipt is a same-origin boolean. The final iOS guidance stores no toolbar-layout preference or calibration state.

## Accessibility

- All controls are keyboard reachable with visible focus treatment.
- Dialogs have programmatic titles/descriptions.
- Live status uses `aria-live` without excessive announcements.
- Guidance symbols are decorative where adjacent text carries the action name.
- Guidance does not depend on color alone.
- Safe-area layout prevents coachmarks from colliding with device cutouts/indicators.
- Reduced motion disables nonessential animation.
- Copy remains concise, sentence case, and understandable without PWA terminology.

## Failure behavior

- Service-worker failure leaves the online installer usable.
- Installed-state probe failure or empty relationship result remains `unknown`.
- `beforeinstallprompt` never clears positive installed evidence; it is retained as an installability capability for cases where no stronger evidence exists or the user explicitly requests Reinstall.
- If a user removes the Android app but a stale local receipt remains, the user-controlled Reinstall action clears the receipt and triggers a fresh browser reassessment.
- An arbitrary launcher bookmark remains outside reliable webpage inspection; the installer does not claim otherwise.
- If browser UI changes unexpectedly, the written Share / More / Add to Home Screen instructions remain authoritative.
- Missing Safari Add to Home Screen is handled through collapsed **Edit Actions** recovery.
- Cancelled native installation returns to the page without claiming success.
- Accepted native Android installation writes the receipt immediately; `appinstalled` remains additional confirmation.

## Security boundaries

- Fixed production destination: `https://myhrfh.com`; no arbitrary redirect input.
- No cross-origin service-worker proxy/cache behavior.
- No credentials, secrets, Salesforce access, or privileged APIs in the web build.
- No attempt to bypass install/uninstall consent.
- No browser-chrome or launcher inspection claim.
- No generic Web Share API masquerading as an installation API.
- No iOS toolbar-layout calibration storage.
- No hidden/non-SDK Android API usage.
- No arbitrary Android intents, package names, URLs, commands, shell execution, or reflection bridge.
- No downloadable configuration profiles or APK sideloading in the web installer.

## Automated engineering acceptance

Every candidate head must pass:

```text
node --check install.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
```

Coverage includes manifest/scope, transparent icons, pre-paint launch, Android/iOS/desktop detection, Android duplicate-install prevention and Reinstall recovery, final direct iOS guidance, accurate Share/circled-More/Add-to-Home-Screen symbols, Safari Share/More and Open-as-Web-App recovery, relationship-sensitive installed-state triage, install-receipt continuity, condition-gated management actions, service-worker scope/freshness, accessibility hooks, and production/security documentation.

## Production deployment checklist

Before publishing the official HRFH install URL:

1. Serve installer, manifest, service worker, icons, and launch route from a deliberately scoped same-origin path on `myhrfh.com`.
2. Replace GitHub Pages manifest IDs/related-app URLs with the production origin.
3. Review service-worker scope so unrelated portal routes cannot be controlled accidentally.
4. Apply and verify CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, and cache headers.
5. Verify normal HRFH authentication remains authoritative.
6. Test Android clean native install and confirm accepted installation writes the receipt before relying on `appinstalled`.
7. Refresh the Android installer after installation and verify positive receipt/related-app evidence suppresses a duplicate Install action even if `beforeinstallprompt` is later exposed.
8. Verify Android browser fallback promotes **Install app**, not generic **Add to Home screen** as an equivalent managed install.
9. Remove the Android app, use **Reinstall**, and verify the browser reassesses installability without silently creating another launcher artifact.
10. Verify the web-only Android installed state hides Restore shortcut and Uninstall rather than presenting instruction-only controls.
11. If a native/TWA Android layer is introduced, verify Digital Asset Links, fixed-origin bridge commands, `ShortcutManager` user confirmation, system uninstall UI, package/signing identity, and absence of hidden/non-SDK APIs before enabling native management.
12. Test iPhone Chrome portrait with the address bar at the top and bottom; verify the same direct Share guidance remains accurate without asking the user a question.
13. Test iPhone Chrome landscape and iPad Chrome with the top-right Share cue.
14. Test iPhone Safari layouts with Share directly visible and with the circled More control required; verify both are covered simultaneously by the direct guidance.
15. Test iPad Safari top-right Share guidance.
16. Test Safari **Open as Web App** and **Edit Actions → Add to Home Screen** recovery.
17. Confirm Share, circled More, and Add-to-Home-Screen vector shapes visually match current iOS controls at 100%, 200% zoom, and Retina device scaling while HRFH colors/surfaces remain consistent with the installer UI.
18. Rotate portrait/landscape and confirm guidance recalculates without duplicate UI.
19. Test Windows Chrome/Edge before and after deleting only the desktop shortcut.
20. Test macOS Chrome/Edge and Safari Add to Dock.
21. Verify applicable management actions remain hidden in unknown/manual-install states and never imply web access to launcher/package APIs that do not exist.
22. Verify keyboard operation, screen reader labels, zoom/reflow, safe areas, and reduced motion.
23. Confirm no analytics, credentials, PII, generic-share install workaround, toolbar questionnaire, hidden Android API, or unexpected network calls are introduced.
24. Run the complete exact-head automated gate.
25. Complete physical-device acceptance before broad public release.

## Release decision

The repository can be treated as a production-ready **web installer implementation** once automated checks and the physical-device matrix pass. GitHub Pages remains staging until the same-origin `myhrfh.com` deployment requirements above are completed.

Real Android Restore/Uninstall behavior is a separate native/TWA capability and is not considered implemented by this web-only release.