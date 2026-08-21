# myHRFH Mobile Shortcut Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and validate a dependency-free GitHub Pages prototype for installing a home-screen test shell that clearly targets `https://myhrfh.com`, while preserving the browser same-origin rules for the true final PWA.

**Architecture:** A static app uses a web manifest, same-origin service worker, platform-aware install controller, and compact responsive UI. Android/Chromium uses `beforeinstallprompt`; iOS/iPadOS shows the minimum Safari Add to Home Screen flow; the prototype explicitly navigates to `https://myhrfh.com` rather than misusing a cross-origin manifest `start_url`.

**Tech Stack:** HTML5, CSS, browser JavaScript, Web App Manifest, Service Worker API, Node.js built-in test runner, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-20-pwa-install-prototype-design.md`

## Global Constraints

- Static GitHub Pages project site hosted under `/mobile-pwa-install-test/`.
- Destination is exactly `https://myhrfh.com`.
- No production website modification during this prototype.
- No credentials, private URLs, Salesforce access, telemetry, or analytics.
- No third-party runtime or test dependencies.
- iOS must never claim programmatic one-tap installation is available.
- Manifest `start_url` and `scope` remain same-origin relative paths.

---

### Task 1: Add failing repository validation

**Files:**
- Create: `tests/validate.mjs`
- Create: `.github/workflows/validate.yml`

**Interfaces:**
- Consumes: repository files expected from Tasks 2–4.
- Produces: deterministic validation command `node --test tests/validate.mjs`.

- [ ] **Step 1: Write manifest tests**

Assert that `manifest.webmanifest` parses, uses name `myHRFH Shortcut Test`, `start_url` and `scope` equal `./`, `display` equals `standalone`, and icon declarations include 192×192 and 512×512 PNG entries.

- [ ] **Step 2: Write page/install tests**

Assert that `index.html` links the manifest, Apple touch icon, stylesheet, and `install.js`; assert `install.js` contains exactly `https://myhrfh.com`, registers `beforeinstallprompt` and `appinstalled`, registers `./service-worker.js`, and includes `Add to Home Screen` guidance.

- [ ] **Step 3: Write service-worker safety tests**

Assert that the service worker never contains `myhrfh.com` and only handles same-origin requests.

- [ ] **Step 4: Add GitHub Actions validation**

Run `node --test tests/validate.mjs` on pushes to the feature branch and pull requests.

### Task 2: Build the installable static shell

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `manifest.webmanifest`

**Interfaces:**
- Consumes: none.
- Produces: DOM elements `install-button`, `open-button`, `platform-content`, `status-message`; manifest at `./manifest.webmanifest`.

- [ ] **Step 1: Create semantic page structure**

Use the visible heading `Add myHRFH to your phone`, show `myhrfh.com`, include a hidden primary Install button, an always-available `Open myHRFH` link, a platform-content region, and status output.

- [ ] **Step 2: Add responsive presentation**

Use a centered card, large touch targets, focus-visible states, compact instruction rows, and an installed-state treatment. Keep the page usable at 320px viewport width with no framework dependency.

- [ ] **Step 3: Add manifest metadata**

Use:

```json
{
  "name": "myHRFH Shortcut Test",
  "short_name": "myHRFH Test",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "prefer_related_applications": false
}
```

Declare 192×192 and 512×512 PNG icons plus maskable equivalents.

### Task 3: Implement device-aware install behavior

**Files:**
- Create: `install.js`

**Interfaces:**
- Consumes: DOM IDs from Task 2 and browser APIs `matchMedia`, `navigator.userAgent`, `beforeinstallprompt`, and `appinstalled`.
- Produces: Android native prompt behavior, iOS manual guidance, standalone installed state, fallback guidance, and explicit navigation to `https://myhrfh.com`.

- [ ] **Step 1: Detect standalone state**

Implement `display-mode: standalone` plus the iOS `navigator.standalone` flag. In standalone state, hide the Install button and make `Continue to myHRFH` the primary action.

- [ ] **Step 2: Detect iOS/iPadOS**

Treat iPhone/iPad/iPod user agents as iOS and include modern iPadOS desktop-mode detection using `Macintosh` plus `navigator.maxTouchPoints > 1`.

- [ ] **Step 3: Capture Chromium installability**

Register `beforeinstallprompt`, call `preventDefault()`, retain the event, reveal the Install button, and invoke `prompt()` only after a user click.

- [ ] **Step 4: Handle installation completion**

Listen for `appinstalled`, clear the retained event, hide the Install button, and show a concise success state.

- [ ] **Step 5: Register the service worker**

Register exactly `./service-worker.js` after page load when the API is available.

### Task 4: Add safe service worker and icons

**Files:**
- Create: `service-worker.js`
- Create: `icons/icon-192.png`
- Create: `icons/icon-512.png`
- Create: `icons/icon-maskable-192.png`
- Create: `icons/icon-maskable-512.png`

**Interfaces:**
- Consumes: same-origin static shell paths.
- Produces: small offline shell cache and deterministic test icons.

- [ ] **Step 1: Add same-origin-only cache behavior**

Precache the shell files and icons. For fetch events, ignore non-GET requests and any request whose `new URL(request.url).origin !== self.location.origin`.

- [ ] **Step 2: Add deterministic non-production icons**

Use simple test artwork that renders clearly at 192 and 512 pixels and is visually distinct from final production branding.

### Task 5: Verify exact branch and prepare review

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: tester instructions and exact reviewable branch state.

- [ ] **Step 1: Run remote validation**

Use GitHub Actions on the exact branch head and require the repository validation job to pass.

- [ ] **Step 2: Document test expectations**

Update README with the target `https://myhrfh.com`, the prototype-vs-production origin distinction, and Android/iPhone test steps.

- [ ] **Step 3: Review exact diff**

Compare `main...feature/pwa-install-prototype` and confirm no unrelated or production-impacting files exist.

- [ ] **Step 4: Open a draft pull request**

Create one draft PR for review. Do not merge until the exact head has passing validation and the user has reviewed the prototype behavior.