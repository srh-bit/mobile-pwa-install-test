# HRFH web app installer — production readiness

This document defines the production contract for the public HR for Health web-app installer that ultimately targets `https://myhrfh.com`.

## Production outcome

The public installer must give each visitor the most accurate action supported by the current browser without claiming capabilities the browser or operating system does not expose.

The final production package should be served from the `myhrfh.com` origin. The GitHub Pages site remains a staging/device-validation host only. Serving the manifest, service worker, icons, installer, and launch route from `myhrfh.com` removes the cross-origin launch intermediary and gives Android/desktop Chromium the strongest opportunity to install a full PWA rather than a browser-badged shortcut.

## State model

The installer uses these states in order:

1. **Running as the installed web app** — redirect immediately to `https://myhrfh.com` before installer UI paints.
2. **Installed confirmed** — where the browser supports `navigator.getInstalledRelatedApps()` and confirms this PWA, show an Installed state with:
   - Open HRFH web app
   - Restore shortcut
   - Uninstall
3. **Installable / not installed** — when Chromium exposes `beforeinstallprompt`, show the native Install HRFH web app action.
4. **Manual-install platform** — iPhone/iPad and browsers that do not expose a programmable install prompt receive concise browser-specific Add to Home Screen / Add to Dock guidance.
5. **Unknown** — when installation state cannot be proven, show conservative browser guidance. Do not claim that the app is installed or not installed.

## Important browser limitations

### Installed-state detection

`navigator.getInstalledRelatedApps()` is used only when present. It can confirm an installation in supported Chromium environments when the manifest relationship is configured correctly. It is not universally available and therefore cannot be the sole source of truth.

If the API is missing, blocked, or throws, the installer records the state as **unknown**, not **not installed**.

### Home-screen icon detection

A normal public web page cannot reliably inspect whether a PWA icon is currently visible on a user's home screen, desktop, Dock, taskbar, Start menu, or launcher. The app may remain installed after a shortcut is deleted, particularly on desktop.

Accordingly, the Installed state says that shortcut placement is managed by the device and provides a **Restore shortcut** action with platform-specific instructions. It never claims that a home-screen icon has been detected.

### Uninstall

A normal web page cannot programmatically uninstall the PWA. The **Uninstall** action therefore opens accessible instructions for the current platform. Removal remains explicitly user-controlled through the browser or operating system.

## Browser and device matrix

| Environment | Detection / install path | Installed management |
| --- | --- | --- |
| Android Chrome / supported Chromium | `getInstalledRelatedApps()` when available; otherwise `beforeinstallprompt`; browser-menu fallback | Open; restore from app list/home screen; OS/browser uninstall instructions |
| iPhone / iPad Chrome | Chrome-specific Share → Add to Home Screen | Normal browser tabs cannot reliably confirm installation; manual restore/remove guidance only |
| iPhone / iPad Safari | Chrome-preferred handoff when available; Safari Share → Add to Home Screen fallback | Normal Safari tab cannot reliably confirm installation; manual restore/remove guidance only |
| Windows Chrome | installed-related-app check; native install prompt | Open; `chrome://apps` → Create shortcut; browser uninstall instructions |
| Windows Edge | installed-related-app check; native install prompt | Open; `edge://apps` → Create Desktop shortcut; browser uninstall instructions |
| macOS Chrome / Edge | installed-related-app check when supported; native install prompt | Open; browser apps page / shortcut management |
| macOS Safari | File → Add to Dock | Applications / Dock management; removal remains user-controlled |
| Other / unsupported browser | conservative browser-menu guidance | No false installed-state claim |

Browser UI labels can change between releases. Wording should identify the intent and include common current labels without assuming a single exact menu layout forever.

## Installation prompt timing

Chromium can dispatch `beforeinstallprompt` after page initialization. The public page therefore waits briefly for the native event before settling on fallback guidance. This prevents the page from prematurely showing only an Open action or browser-menu copy when a native install prompt is about to become available.

## Launch behavior

The manifest `start_url` must remain within the manifest scope and on the same origin as the installed PWA. In staging, `launch.html` is a minimal same-origin shell that redirects to `https://myhrfh.com` in the document head before installer UI can render.

For production, host the installer and launch route directly under `myhrfh.com`. Prefer a same-origin application route so the installed app opens the intended portal without a GitHub-origin intermediary or browser badge associated with a cross-origin shortcut workflow.

## Service worker behavior

The service worker:

- intercepts only same-origin GET requests;
- never proxies, caches, or intercepts `myhrfh.com` when it is cross-origin in the staging build;
- uses **network-first** behavior for navigations so public installer HTML and state logic refresh promptly;
- uses cache-first behavior for stable same-origin static assets;
- claims clients after activation and maintains a bounded app-shell cache;
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

The installer collects no credentials, authentication tokens, form data, analytics, advertising identifiers, or personal information. No user-specific data is required to determine the install experience.

## Accessibility requirements

- All controls must be keyboard reachable.
- Visible focus states must remain present.
- Dialogs must expose a programmatic title and description.
- The management dialog uses native `<dialog>` semantics where supported and includes a close action.
- Live status messages use `aria-live` without excessive announcements.
- Instructions must not rely on color alone.
- `prefers-reduced-motion` must disable nonessential animation.
- Text should remain sentence case, concise, and understandable without technical PWA vocabulary where possible.

## Failure behavior

- If service-worker registration fails, the page remains usable online and provides a concise refresh/retry message.
- If installed-state probing fails, use `unknown`; do not infer not-installed.
- If Chrome handoff on iOS cannot complete, preserve the Safari fallback.
- If `beforeinstallprompt` never arrives, render browser-specific fallback guidance after the bounded wait.
- If the native install is cancelled, return control to the page without claiming success.
- If an install completes and `appinstalled` fires, render the Installed state.

## Security boundaries

- No arbitrary URL redirects: the production destination is fixed to `https://myhrfh.com`.
- No arbitrary service-worker proxying or cross-origin caching.
- No credentials, secrets, Salesforce access, or privileged APIs.
- No attempt to bypass browser/OS install or uninstall consent.
- No downloadable configuration profiles, APK sideloading, or native package installation.

## Production deployment checklist

Before making the public URL the official HRFH install route:

1. Serve the installer, manifest, service worker, icons, and launch route from `myhrfh.com` or a deliberately scoped same-origin path.
2. Replace GitHub Pages-specific manifest IDs/related-app URLs with the production origin.
3. Review the service-worker scope so it cannot unintentionally control unrelated portal routes.
4. Configure and verify `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy, and cache headers.
5. Verify the destination route requires normal HRFH authentication and the installer does not weaken authentication behavior.
6. Test clean first-install, already-installed, deleted-shortcut-but-app-still-installed, cancelled-install, and uninstall instructions on each supported platform.
7. Test iOS with Chrome installed and without Chrome available.
8. Test Android where Chrome mints a full web app and where the browser falls back to a badged shortcut.
9. Test Windows Chrome and Edge both before and after deleting only the desktop shortcut.
10. Test macOS Chrome/Edge and Safari Add to Dock.
11. Verify keyboard-only use, screen-reader dialog labels, zoom/reflow, and reduced motion.
12. Confirm no analytics, credentials, PII, or unexpected network requests are introduced.
13. Run the complete repository validation suite on the exact release commit.
14. Perform a final physical-device acceptance pass before publishing the production install link broadly.

## Release decision

The repository can be treated as a production-ready **installer implementation** once all automated checks are green and physical-device acceptance passes. The GitHub Pages deployment remains a staging proof until the same-origin `myhrfh.com` production-host requirements above are completed.
