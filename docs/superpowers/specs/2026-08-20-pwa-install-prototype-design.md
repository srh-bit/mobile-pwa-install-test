# Mobile PWA Install Prototype Design

## Purpose

Build an isolated GitHub Pages proof of concept that demonstrates the shortest practical home-screen installation flow for Android and iPhone without changing any production website.

## Success Criteria

- The site is deployable as a static GitHub Pages site under `/mobile-pwa-install-test/`.
- Android/Chromium users get a prominent install button that invokes the browser-native PWA install prompt when `beforeinstallprompt` is available.
- iPhone/iPad users get a compact Safari-specific instruction panel for **Share → Add to Home Screen → Open as Web App → Add**.
- Users who already launched the site in standalone mode see a clear installed state instead of install instructions.
- Desktop and unsupported browsers receive a neutral explanation rather than a broken install button.
- The installed prototype launches in `standalone` display mode with a dedicated test icon and test name.
- The prototype contains no production credentials, APIs, analytics, Salesforce integration, or production-site mutation.
- Repository validation runs without third-party npm dependencies.

## Architecture

The prototype is a dependency-free static web app. `index.html` owns semantic page structure, `styles.css` owns presentation, `install.js` owns platform/install-state behavior, `manifest.webmanifest` owns install metadata, and `service-worker.js` provides a small same-origin offline shell. The app uses relative URLs so GitHub Pages can host it from the repository subpath.

The UI detects three relevant states:

1. **Standalone/already installed** — detected with `display-mode: standalone` or the iOS standalone flag. The UI reports that the app is installed.
2. **iOS/iPadOS browser** — because Chromium's `beforeinstallprompt` is unavailable on iOS, the UI shows a three-step Safari flow and warns users to open the page in Safari if they arrived from another browser.
3. **Installable Chromium browser** — `install.js` captures `beforeinstallprompt`, reveals the Install button, calls `prompt()` only after a user click, and updates the UI after `appinstalled`.

Other environments show a concise browser-menu fallback rather than pretending one-click installation is supported.

## GitHub Pages Pathing

GitHub Pages project sites are served from a repository subpath. All app references therefore use relative paths such as `./manifest.webmanifest`, `./icons/icon-192.png`, and `./service-worker.js`. The manifest uses:

- `start_url: "./"`
- `scope: "./"`
- `display: "standalone"`

This keeps the prototype portable and avoids hard-coding the GitHub account name into application behavior.

## Install Metadata

The test app name is **Mobile Shortcut Test** with short name **Shortcut Test**. The manifest includes required 192×192 and 512×512 PNG icons plus maskable variants. It sets a neutral theme/background color and `prefer_related_applications: false`.

The page also includes an Apple touch icon and mobile-web-app metadata so the iPhone home-screen result has an intentional icon/name during the test.

## Service Worker

The service worker caches only the small static application shell. It does not proxy external sites or cache user data. On install it precaches the root document, stylesheet, install script, manifest, and icons. On fetch it serves cached same-origin GET requests first and falls back to the network.

## User Experience

The landing screen contains one compact card:

- Test app icon
- “Add this page to your phone” heading
- One-line explanation
- Device-aware content area
- Primary install action when supported
- Small status message

Android should require only the page's Install button plus the browser-native confirmation. iPhone guidance is intentionally limited to the minimum Apple-required actions and avoids videos or long instructions.

## Validation

A dependency-free Node test file validates:

- Manifest JSON parses and contains required install fields.
- 192 and 512 icon declarations exist.
- GitHub Pages-safe relative `start_url` and `scope` are used.
- `index.html` links the manifest, Apple touch icon, stylesheet, and module/script.
- The service worker registration path is relative.
- Android install logic listens for both `beforeinstallprompt` and `appinstalled`.
- iOS guidance contains the expected Add to Home Screen language.

GitHub Actions runs `node --test tests/validate.mjs` on pushes and pull requests. Browser/device testing remains the final proof because installation behavior is browser/OS controlled.

## Security and Scope Boundaries

- No secrets or private URLs.
- No production site changes.
- No redirects into a production application during this first proof of concept.
- No telemetry or tracking.
- No native app packages, configuration profiles, or sideloading.
- No automatic installation claims on iOS.

## Delivery

Implementation occurs only on `feature/pwa-install-prototype`. A pull request will expose the exact diff for review before any merge to `main`. GitHub Pages should be enabled only after the tested implementation is merged to `main`, using the repository root as the publishing source.