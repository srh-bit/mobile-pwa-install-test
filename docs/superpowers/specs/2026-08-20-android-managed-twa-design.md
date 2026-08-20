# Managed Android TWA Design

## Purpose

Add an optional HRFH-owned Android package that opens `https://myhrfh.com` as a Trusted Web Activity (TWA) and gives the HRFH web UI a narrowly scoped, origin-verified bridge for Android-only management actions.

The existing browser PWA installer remains the default public Android installation path. This native package is a separate managed-Android capability for environments where HRFH needs executable **Restore shortcut** and **Uninstall** actions rather than web-only instructions.

## Non-goals

- Do not replace the existing Chrome/Chromium PWA install flow.
- Do not attempt to manage or uninstall Chrome's WebAPK/PWA package from the HRFH-owned package.
- Do not claim that web content can enumerate arbitrary Android launcher icons, bookmarks, or shortcuts.
- Do not silently add a launcher shortcut or silently uninstall the package.
- Do not use hidden, private, internal, reflection-based, or other non-SDK Android APIs.
- Do not publish to Google Play, create production signing keys, upload APK/AAB artifacts, or deploy production Digital Asset Links from this repository workflow.
- Do not expose arbitrary URL, Intent, package-name, shell, command, reflection, or code-execution capabilities across the web/native bridge.

## Platform contract

The managed package targets modern public Android APIs:

- Java 17 source/runtime for the build.
- Android Gradle Plugin 9.3.1.
- Gradle 9.5.0.
- `compileSdk 37`.
- `targetSdk 36`, satisfying the Google Play requirement that takes effect August 31, 2026.
- `minSdk 26`, so `ShortcutManager.requestPinShortcut()` is available without legacy/private launcher broadcasts.
- AndroidX Browser `1.10.0`.

The native implementation uses AndroidX Browser directly rather than subclassing Android Browser Helper's launcher. The Android Browser Helper high-level launcher intentionally owns the `CustomTabsSession`; direct AndroidX integration gives HRFH explicit control over Digital Asset Links relationship validation and the postMessage channel without forking a dependency.

## Repository structure

The native package lives under `android/` and remains isolated from the existing web installer:

```text
android/
  settings.gradle
  build.gradle
  gradle.properties
  app/
    build.gradle
    src/main/AndroidManifest.xml
    src/main/java/com/hrforhealth/myhrfh/
      ManagedTwaActivity.java
      NativeManagementBridge.java
      ManagementCommand.java
      ShortcutController.java
      UninstallController.java
    src/main/res/
      drawable/ic_hrfh_launcher.xml
      values/colors.xml
      values/strings.xml
      values/styles.xml
    src/test/java/com/hrforhealth/myhrfh/
      ManagementCommandTest.java
      NativeManagementBridgeTest.java
      ShortcutControllerPolicyTest.java
      UninstallControllerPolicyTest.java
```

The browser page adds a focused `android-native-bridge.js` module. `install.js` consumes only the module's high-level capability state and actions; it does not contain Android intent/package logic.

## Package identity and release inputs

Source namespace: `com.hrforhealth.myhrfh`.

Default debug/staging application ID: `com.hrforhealth.myhrfh.staging`.

Production application ID is a release-time input supplied through Gradle property `HRFH_ANDROID_APPLICATION_ID`. The repository must not invent or silently claim a final Play Store package identity.

The trusted web origin defaults to `https://myhrfh.com` and is supplied through `HRFH_TWA_ORIGIN` for controlled build variants. Production trust is not considered established until the approved package ID and signing-certificate SHA-256 fingerprint are served from:

`https://myhrfh.com/.well-known/assetlinks.json`

The repository includes only a template/documentation for the Digital Asset Links statement. Signing keys, passwords, Play credentials, and production fingerprints are never committed.

GitHub Pages cannot be treated as the production TWA trust origin because Digital Asset Links must be served at the origin root, while this project is hosted beneath `srh-bit.github.io/mobile-pwa-install-test/`.

## TWA launch lifecycle

`ManagedTwaActivity` is the launcher activity.

1. Resolve a Custom Tabs provider using public AndroidX Browser APIs.
2. Bind the provider's Custom Tabs service.
3. Warm the provider.
4. Create one `CustomTabsSession` with `NativeManagementBridge` as the callback.
5. Ask the browser to validate `CustomTabsService.RELATION_USE_AS_ORIGIN` for the fixed trusted origin.
6. Build a `TrustedWebActivityIntent` for the fixed `myhrfh.com` launch URL and launch it through the session.
7. If a usable trusted provider/session cannot be established, fall back to an ordinary Custom Tab for the fixed URL. Native management capabilities remain disabled in that fallback.
8. After relationship validation succeeds and navigation is ready, request a postMessage channel with the same fixed origin as both source and target origin.
9. Only after the channel is ready does the native side send the capability handshake.

No caller-selected URL or origin is accepted.

## Web/native protocol

All messages are UTF-8 JSON objects with protocol version `1`.

### Native → web capability handshake

```json
{
  "type": "hrfh-native",
  "version": 1,
  "capabilities": ["restore-shortcut", "uninstall"]
}
```

The web module treats native management as unavailable until it receives this handshake through the validated TWA message channel.

### Web → native command

```json
{
  "type": "hrfh-management",
  "version": 1,
  "requestId": "bounded-client-generated-id",
  "action": "restore-shortcut"
}
```

Allowed `action` values are exactly:

- `restore-shortcut`
- `uninstall`

`requestId` is required, 1–64 characters, and limited to ASCII letters, digits, `_`, and `-`.

Unknown types, versions, actions, missing fields, extra executable parameters, malformed JSON, and oversized messages are rejected without side effects.

### Native → web result

```json
{
  "type": "hrfh-management-result",
  "version": 1,
  "requestId": "bounded-client-generated-id",
  "status": "requested"
}
```

Allowed status values:

- `requested`
- `already-present`
- `unsupported`
- `rejected`
- `error`

No result may contain stack traces, local file paths, package inventory, device identifiers, or secrets.

## Native bridge security

`NativeManagementBridge` owns the `CustomTabsCallback` and message protocol.

The bridge remains disabled until all of these are true:

- the Custom Tabs service was warmed;
- `RELATION_USE_AS_ORIGIN` validation succeeded for exactly `https://myhrfh.com` (or the explicit build-time trusted origin);
- the postMessage channel was created for that same origin;
- the message channel is ready.

The native side never accepts an origin value from a web message. The origin is fixed from build configuration.

The web module additionally checks `MessageEvent.origin` against the fixed production origin before accepting a native handshake/result. This is defense in depth; Android's Digital Asset Links relationship remains the primary trust boundary.

The bridge is not a general RPC system. It exposes two commands only and delegates them to dedicated controllers.

## Restore shortcut semantics

`ShortcutController` manages one HRFH-owned pinned shortcut with stable ID:

`myhrfh-home`

The shortcut launches `ManagedTwaActivity` and therefore returns to the managed HRFH package/TWA.

Behavior:

1. Obtain Android's framework `ShortcutManager`.
2. If `isRequestPinShortcutSupported()` is false, return `unsupported`.
3. Check `getPinnedShortcuts()` for the stable `myhrfh-home` ID.
4. If already pinned, return `already-present` and do not request another copy.
5. Otherwise construct a `ShortcutInfo` for the HRFH package and call `requestPinShortcut()`.
6. If Android accepts the request for launcher presentation, return `requested`.
7. The launcher/system confirmation remains authoritative; the native app does not simulate a successful pin before Android accepts it.

This Restore action manages only the HRFH package's own stable shortcut. It does not enumerate or modify unrelated launcher content and does not claim to detect a browser-created PWA icon.

## Uninstall semantics

`UninstallController` never silently removes anything.

It creates the public Android system uninstall intent for its own package only:

- action: `Intent.ACTION_DELETE`
- data: `package:${BuildConfig.APPLICATION_ID}` / `context.getPackageName()`

The system package-removal UI performs the confirmation. The bridge returns `requested` after the system UI is successfully launched.

If no system handler is available, return `unsupported`/`error` without attempting another package or fallback shell command.

## Web UI integration

`android-native-bridge.js` exposes a minimal page API:

```js
window.HRFHAndroidNative = {
  isReady(),
  getCapabilities(),
  request(action)
}
```

It also dispatches a fixed custom event when native capability state changes:

`hrfh-android-native-ready`

`install.js` behavior:

- normal browser/PWA Android keeps the accepted v6 behavior: **Open** + deliberate **Reinstall**, with Restore/Uninstall hidden;
- when the validated native handshake is present, Android installed state may show **Restore shortcut** and **Uninstall** because those buttons now invoke real native actions;
- web code never invents native readiness from user agent, standalone mode, localStorage, URL parameters, or query strings;
- button actions call only `HRFHAndroidNative.request('restore-shortcut')` or `.request('uninstall')`;
- results update concise status text; they do not claim a launcher/uninstall operation completed when Android only accepted a request.

The web bridge is inert in ordinary Chrome, iOS, desktop browsers, and GitHub Pages staging unless a validated native channel actually supplies the handshake.

## Digital Asset Links

Production `assetlinks.json` needs both relationships required by the final implementation:

- `delegate_permission/common.handle_all_urls` for TWA trust/app-link ownership;
- `delegate_permission/common.use_as_origin` for the postMessage origin relationship.

The target is the approved production Android package namespace plus the approved signing certificate SHA-256 fingerprint.

A repository template uses explicit placeholders such as `__HRFH_ANDROID_APPLICATION_ID__` and `__HRFH_SIGNING_CERT_SHA256__`; automated tests must ensure those placeholders cannot be mistaken for deployed production trust.

## Styling and launcher artwork

The managed package uses HRFH colors and a small vector launcher resource stored as Android XML so the source remains buildable without committing generated binary assets during this development phase.

Before production signing, physical-device acceptance must compare the Android launcher artwork with the approved HRFH source artwork. If exact adaptive/legacy icon assets are generated, they become normal reviewed Android resources; they are not fetched dynamically at runtime.

## Build and CI

The existing GitHub Actions validation remains authoritative for the web installer and is extended with Android checks.

Required candidate checks:

```text
node --check install.js
node --check android-native-bridge.js
node --check ios-guidance-v2.js
node --check service-worker.js
node --test tests/*.mjs
cd android
./gradlew testDebugUnitTest lintDebug assembleDebug
```

CI uses JDK 17 and an Android SDK environment. Debug artifacts are validation outputs only and are not published as releases.

Native unit tests focus on deterministic policy/command behavior. Build/lint verifies manifest/resources/Android API usage. Physical-device acceptance is still required for TWA relationship validation, launcher pin confirmation, Chrome fallback, and system uninstall UI.

## Failure behavior

- No supported Custom Tabs provider: open the fixed URL with the safest available browser fallback; native management stays disabled.
- Digital Asset Links validation fails: TWA may display browser UI/fallback, but native management bridge stays disabled.
- PostMessage channel fails: portal remains usable; native management buttons remain hidden.
- Malformed/unknown command: reject with no side effect.
- Shortcut already pinned: return `already-present`; do not request a duplicate.
- Launcher does not support pin requests: return `unsupported`.
- Uninstall intent cannot resolve: return `unsupported`/`error`; do not use hidden APIs.
- User cancels launcher pin or uninstall confirmation: Android remains authoritative; the web page must not report completion merely because the native request was launched.

## Production acceptance boundary

The code may be considered **native implementation complete** when repository tests, Android build/lint, and code review are green.

It is not considered **production Android deployment complete** until all of these separately authorized items are satisfied:

1. final production application ID approved;
2. signing/upload key process approved and secured outside the repository;
3. approved signing certificate fingerprint obtained;
4. production `myhrfh.com/.well-known/assetlinks.json` deployed with the exact package/fingerprint and both required relations;
5. production build signed through the approved release process;
6. physical-device TWA verification passes without the browser toolbar;
7. native handshake enables Restore/Uninstall only inside the trusted package;
8. Restore requests only the stable HRFH shortcut and does not duplicate it;
9. Uninstall launches Android's own confirmation UI for the HRFH package;
10. Play/internal distribution decision is explicitly approved.

The web-only PWA path remains valid independently of this native deployment boundary.