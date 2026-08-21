# Mobile PWA Install Prototype Design

## Purpose

Build an isolated GitHub Pages proof of concept that demonstrates the shortest practical home-screen installation flow for Android and iPhone, with **https://myhrfh.com** as the destination, without modifying the production site during the test phase.

## Critical Origin Constraint

A PWA installed from a GitHub Pages URL cannot declare `https://myhrfh.com` as its effective `start_url`; browsers require the installed application's launch URL to be same-origin with the page where installation starts. Therefore the GitHub Pages prototype is explicitly a **UX/behavior proof**, not the final production install artifact.

The prototype will:

1. Demonstrate the Android install prompt and iPhone Add to Home Screen guidance.
2. Brand the experience as a shortcut test for **myHRFH**.
3. Include a prominent **Open myHRFH** action that navigates to `https://myhrfh.com` before installation.
4. When launched from the installed Home Screen icon, immediately forward to `https://myhrfh.com` instead of rendering the installer again.
5. Document the minimal files that eventually need to be served from `https://myhrfh.com` for the production shortcut to launch directly there without a GitHub-hosted forwarding shell.

## Success Criteria

- The site is deployable as a static GitHub Pages project site under `/mobile-pwa-install-test/`.
- Android/Chromium users get a prominent install button that invokes the browser-native PWA install prompt when `beforeinstallprompt` is available.
- iPhone/iPad users get compact Safari-specific guidance for **Share → Add to Home Screen → Open as Web App → Add**.
- The destination is visibly and consistently `https://myhrfh.com`.
- Users can open `https://myhrfh.com` directly from the prototype before installing.
- Launching the installed Home Screen icon immediately forwards to `https://myhrfh.com` rather than showing the installer page again.
- Desktop and unsupported browsers receive concise fallback guidance rather than a broken install button.
- The installed prototype launches in `standalone` display mode with a dedicated test icon and test name before forwarding.
- The prototype contains no production credentials, APIs, analytics, Salesforce integration, or production-site mutation.
- Repository validation runs without third-party npm dependencies.

## Architecture

The prototype is a dependency-free static web app. `index.html` owns semantic page structure, `styles.css` owns presentation, `install.js` owns platform/install-state behavior and navigation to `https://myhrfh.com`, `manifest.webmanifest` owns test-install metadata, and `service-worker.js` provides a small same-origin offline shell. The app uses relative URLs so GitHub Pages can host it from the repository subpath.

The UI detects three relevant states:

1. **Standalone/already installed** — detected with `display-mode: standalone` or the iOS standalone flag. The app immediately calls `window.location.replace('https://myhrfh.com')` and does not render the installer state.
2. **iOS/iPadOS browser** — because Chromium's `beforeinstallprompt` is unavailable on iOS, the UI shows a three-step Safari flow and warns users to open the page in Safari if they arrived from another browser.
3. **Installable Chromium browser** — `install.js` captures `beforeinstallprompt`, reveals the Install button, calls `prompt()` only after a user click, and updates the UI after `appinstalled`.

Other environments show concise browser-menu fallback guidance plus **Open myHRFH**.

## GitHub Pages Pathing

GitHub Pages project sites are served from a repository subpath. All app references therefore use relative paths such as `./manifest.webmanifest`, `./icons/icon-192.png`, and `./service-worker.js`. The test manifest uses:

- `start_url: "./"`
- `scope: "./"`
- `display: "standalone"`

This is intentional: it is the only standards-compliant way to install the GitHub-hosted test shell. The external destination `https://myhrfh.com` is handled by an immediate standalone-launch redirect rather than a cross-origin manifest `start_url`.

## Production Transition

For the final shortcut to launch directly at `https://myhrfh.com` without an intermediate GitHub origin, the production origin must serve or link to its own manifest. The expected minimal production additions are:

- `/manifest.webmanifest`
- 192×192 and 512×512 icons (plus a maskable icon)
- `<link rel="manifest" href="/manifest.webmanifest">`
- Apple touch icon metadata
- a small install-controller script for the Android prompt and iOS guidance
- optional service worker if install/offline behavior requires it

The production manifest can then use:

```json
{
  "name": "myHRFH",
  "short_name": "myHRFH",
  "start_url": "/",
  "scope": "/",
  "display": "standalone"
}
```

No production change is part of this proof-of-concept branch.

## Install Metadata

The test app name is **myHRFH Shortcut Test** with short name **myHRFH Test**. The manifest includes 192×192 and 512×512 PNG icons plus maskable variants. It sets a neutral theme/background color and `prefer_related_applications: false`.

The page also includes an Apple touch icon and mobile-web-app metadata so the iPhone home-screen result has an intentional icon/name during the test.

## Service Worker

The service worker caches only the small static application shell. It does not proxy external sites or cache user data. On install it precaches the root document, stylesheet, install script, manifest, and icons. On fetch it serves cached same-origin GET requests first and falls back to the network.

The cache version is incremented whenever launch behavior changes so existing testers do not remain pinned to stale install logic.

## User Experience

Before installation, the landing screen contains one compact card:

- Test app icon
- “Add myHRFH to your phone” heading
- One-line explanation
- Device-aware content area
- Primary install action when supported
- Direct **Open myHRFH** link
- Small status message

Android should require only the page's Install button plus the browser-native confirmation. iPhone guidance is intentionally limited to the minimum Apple-required actions and avoids videos or long instructions.

After installation, the Home Screen icon should not show the installer. It immediately forwards the user to `https://myhrfh.com`.

## Validation

A dependency-free Node test file validates:

- Manifest JSON parses and contains required install fields.
- 192 and 512 icon declarations exist.
- GitHub Pages-safe relative `start_url` and `scope` are used.
- `index.html` links the manifest, Apple touch icon, stylesheet, and script.
- Android install logic listens for both `beforeinstallprompt` and `appinstalled`.
- iOS guidance contains the expected Add to Home Screen language.
- Standalone launch immediately calls `window.location.replace(MYHRFH_URL)` and returns before rendering installer UI.
- The service worker remains same-origin-only and does not contain `myhrfh.com`.

GitHub Actions runs `node --test tests/validate.mjs` on pushes and pull requests. Browser/device testing remains the final proof because installation behavior is browser/OS controlled.

## Security and Scope Boundaries

- No secrets or private URLs.
- No production site changes.
- No telemetry or tracking.
- No native app packages, configuration profiles, or sideloading.
- No automatic installation claims on iOS.
- No cross-origin service-worker interception.

## Delivery

Implementation occurs only on `feature/pwa-install-prototype`. Pull request #1 exposes the exact diff for review before any merge to `main`. GitHub Pages is temporarily publishing the feature branch for phone testing; merging remains a separate decision.