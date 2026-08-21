# Android and Desktop PWA Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the non-iOS installer production-ready so Android and desktop always expose a discoverable install affordance when installation is not confirmed, while preserving browser-native authority and leaving the approved iOS experience unchanged.

**Architecture:** Keep the static PWA architecture and existing same-origin manifest/service worker. Treat `beforeinstallprompt` as a browser-provided current installability signal, never depend on its arrival timing for whether the Install button is visible, and retain manual browser guidance when Chromium has not exposed a programmable prompt. Preserve the existing Android related-app probe and receipt only as fallback evidence, and do not modify iOS guidance assets or copy.

**Tech Stack:** HTML5, browser JavaScript, Web App Manifest, Service Worker API, Node.js built-in test runner, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-20-pwa-install-prototype-design.md`

## Global Constraints

- Continue only on remote branch `feature/pwa-install-prototype`; never modify `main` directly.
- Fixed destination remains exactly `https://myhrfh.com`.
- PWA-only/browser-only; no APK/TWA/native bridge/Play Store/sideload path.
- Do not change `ios-guidance-v2.js`, `ios-guidance-v2.css`, `ios-guidance-v3.css`, `ios-modal.css`, or the approved iOS behavior/copy.
- No credentials, telemetry, analytics, PII, Salesforce access, native package access, or privileged APIs.
- Manifest `start_url` and `scope` remain same-origin relative paths.
- Restore and Uninstall controls remain absent.
- Browser-native install state and installability signals outrank stale local receipt state.
- Physical Android/desktop browser validation remains required before Marketing handoff.

---

### Task 1: Reproduce the missing-install-affordance defect with focused tests

**Files:**
- Create: `tests/install-affordance.mjs`

**Interfaces:**
- Consumes: `install.js`, `index.html`, `manifest.webmanifest`, `service-worker.js`.
- Produces: deterministic regression coverage for Android/Desktop fallback install visibility and browser-event authority.

- [ ] **Step 1: Write Android fallback visibility test**

Assert `renderAndroidFallback()` leaves `installButton.hidden = false`, labels it `Install HRFH web app`, and retains browser-menu `Install app` guidance when no deferred prompt exists.

- [ ] **Step 2: Write desktop fallback visibility test**

Assert `renderDesktopFallback()` leaves the install action visible. Safari may retain `File → Add to Dock` guidance; Chromium/Edge retain browser install guidance.

- [ ] **Step 3: Write browser-event authority test**

Assert the `beforeinstallprompt` handler stores the event and renders install-ready UI without returning early because of `readInstallReceipt()` or `installedStateDetected`.

- [ ] **Step 4: Write install-cancel/fallback test**

Assert dismissing or lacking a deferred prompt returns to a visible manual-install affordance instead of hiding the Install button for the rest of the session.

- [ ] **Step 5: Write iOS freeze test**

Assert the dedicated iOS asset files are not part of this task's target set and existing iOS controller entry remains `renderIOSInstructions()` with `Show install steps` behavior.

- [ ] **Step 6: Run the exact repository validation workflow and confirm the new tests fail for the expected missing-affordance/browser-event reasons before changing production code.**

### Task 2: Make Android/Desktop install affordance independent of prompt timing

**Files:**
- Modify: `install.js`

**Interfaces:**
- Consumes: existing DOM IDs, `beforeinstallprompt`, `getInstalledRelatedApps`, local receipt helpers.
- Produces: visible non-iOS Install action whenever installation is not confirmed; native prompt when available; manual guidance otherwise.

- [ ] **Step 1: Remove the arbitrary install-prompt wait as a UI gate**

After installed-state assessment, render the Android/Desktop fallback immediately when installation is not confirmed. The fallback itself must keep the Install button visible.

- [ ] **Step 2: Make `beforeinstallprompt` authoritative for current installability**

Store the event, clear stale fallback receipt state, clear stale rendered-installed state if necessary, and render install-ready UI. Do not suppress the event because of local receipt state.

- [ ] **Step 3: Preserve manual fallback on button click when no deferred prompt exists**

Keep the Install action visible and present concise browser-specific instructions instead of disappearing or becoming a dead control.

- [ ] **Step 4: Preserve the Install affordance after a dismissed native prompt**

Clear the one-shot event, render manual fallback, and report cancellation without hiding the action permanently.

- [ ] **Step 5: Leave Android confirmed-installed behavior unchanged**

Positive installed evidence continues to show Open + Reinstall; Restore and Uninstall stay absent.

- [ ] **Step 6: Leave all iOS branches and dedicated iOS files unchanged.**

### Task 3: Harden first-visit installability and release-shell freshness

**Files:**
- Modify: `install.js`
- Modify: `service-worker.js`
- Test: `tests/install-affordance.mjs`
- Test: existing service-worker/readiness tests as needed for the new revision identifier only.

**Interfaces:**
- Consumes: Service Worker API and existing same-origin cache shell.
- Produces: earlier non-iOS service-worker initialization and a cache-shell revision that forces existing staging testers onto the corrected controller.

- [ ] **Step 1: Add a regression test proving non-iOS service-worker registration is initiated before the final initial-state assessment rather than waiting solely for the window `load` event.**

- [ ] **Step 2: Implement an idempotent service-worker registration helper and invoke it early for non-iOS. Preserve the existing iOS runtime path.**

- [ ] **Step 3: Rotate only the release revision marker required to refresh cached `install.js`; retain same-origin fetch restrictions and current cache safety behavior.**

### Task 4: Production-contract review and anti-drift documentation

**Files:**
- Modify: `docs/PRODUCTION-READINESS.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: final controller behavior and authoritative browser documentation.
- Produces: durable production contract matching the tested implementation.

- [ ] **Step 1: Document that `beforeinstallprompt` timing is not guaranteed and custom UI must not hide the Install affordance merely because the event has not fired yet.**

- [ ] **Step 2: Document that a delivered `beforeinstallprompt` event is current browser installability evidence and supersedes stale local receipt fallback.**

- [ ] **Step 3: Update Android/Desktop acceptance matrix to require visible Install affordance before prompt availability and native prompt upgrade when available.**

- [ ] **Step 4: Preserve all iOS documentation and acceptance behavior unchanged.**

### Task 5: Exact-head production verification and staging handoff

**Files:**
- Review only: PR #1 exact diff and CI evidence.

**Interfaces:**
- Consumes: final branch head.
- Produces: frozen exact-head staging candidate; Marketing package remains withheld until physical acceptance.

- [ ] **Step 1: Run browser syntax checks and full `node --test tests/*.mjs` through GitHub Actions on the exact PR head. Require zero failures.**

- [ ] **Step 2: Review the exact PR diff and confirm no dedicated iOS asset changed in this production-readiness pass.**

- [ ] **Step 3: Confirm branch remains 0 behind live `main`, PR remains draft/open, and acceptance evidence is tied to the exact live PR head SHA.**

- [ ] **Step 4: Update PR durable status with root cause, exact-head verification, unresolved physical-device acceptance, and explicit instruction not to hand off the Marketing ZIP yet.**

- [ ] **Step 5: Hand staging back for Android and desktop physical testing. Do not claim Marketing release readiness until those device tests pass.**
