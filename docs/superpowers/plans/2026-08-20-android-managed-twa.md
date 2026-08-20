# Managed Android TWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a compile-tested HRFH-owned Android TWA package with an origin-validated two-command management bridge for user-confirmed shortcut restore and system uninstall, while preserving the existing browser PWA installer as the default Android path.

**Architecture:** A new `android/` Java app uses AndroidX Browser directly so it owns the `CustomTabsSession`, validates `delegate_permission/common.use_as_origin`, and opens `https://myhrfh.com` as a TWA with Custom Tab fallback. A small web bridge remains inert unless the native session completes its trusted handshake; only then can existing Android management buttons call the native controllers.

**Tech Stack:** Java 17, Android Gradle Plugin 9.3.1, Gradle 9.5.0, compileSdk 37, targetSdk 36, minSdk 26, AndroidX Browser 1.10.0, Gson 2.14.0, JUnit 4.13.2, Node 22 repository tests.

**Spec:** `docs/superpowers/specs/2026-08-20-android-managed-twa-design.md`

## Global Constraints

- Existing Chrome/Chromium PWA install remains the default public Android path.
- Native package manages only its own package and stable shortcut ID `myhrfh-home`.
- No hidden/non-SDK Android APIs, reflection bridge, arbitrary Intent/URL/package/shell commands, silent shortcut creation, or silent uninstall.
- Production application ID, signing certificate fingerprint, signing keys, Play credentials, Digital Asset Links deployment, and production release remain explicit external release inputs.
- Native management is unavailable unless `RELATION_USE_AS_ORIGIN` validates for the fixed configured origin and the postMessage channel is ready.
- GitHub Pages staging does not count as production TWA trust validation.
- Every implementation task starts with a failing regression and ends with an independently reviewable green state.

---

### Task 1: Android build skeleton and CI contract

**Files:**
- Create: `android/settings.gradle`
- Create: `android/build.gradle`
- Create: `android/gradle.properties`
- Create: `android/app/build.gradle`
- Create: `android/app/src/main/AndroidManifest.xml`
- Create: `android/app/src/main/res/values/colors.xml`
- Create: `android/app/src/main/res/values/strings.xml`
- Create: `android/app/src/main/res/values/styles.xml`
- Create: `android/app/src/main/res/drawable/ic_hrfh_launcher.xml`
- Create: `tests/android-native-source.mjs`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Consumes: existing fixed portal destination `https://myhrfh.com`.
- Produces: build-time constants `BuildConfig.HRFH_TWA_ORIGIN` and Android package namespace `com.hrforhealth.myhrfh` for later tasks.

- [ ] **Step 1: Write the failing source/build contract test**

`tests/android-native-source.mjs` must assert:
- AGP is exactly `9.3.1`;
- AndroidX Browser is exactly `1.10.0`;
- Gson is exactly `2.14.0`;
- `compileSdk 37`, `targetSdk 36`, `minSdk 26`;
- default application ID is `com.hrforhealth.myhrfh.staging` and can be overridden only by `HRFH_ANDROID_APPLICATION_ID`;
- trusted origin is a build config field derived from `HRFH_TWA_ORIGIN` with default `https://myhrfh.com`;
- manifest includes `INTERNET`, one exported launcher activity, `autoVerify=true` HTTPS app link for `myhrfh.com`, and no broad package/query permissions;
- workflow pins JDK 17 and Gradle 9.5.0 and runs `gradle -p android testDebugUnitTest lintDebug assembleDebug`.

- [ ] **Step 2: Run CI and confirm the Android source/build contract is red**

Expected: Node tests fail because `android/` and Android workflow steps do not exist.

- [ ] **Step 3: Add minimal Android project/configuration**

Use Groovy Gradle files with repositories `google()` and `mavenCentral()`. `app/build.gradle` must use:

```groovy
plugins { id 'com.android.application' }

def applicationIdValue = providers.gradleProperty('HRFH_ANDROID_APPLICATION_ID')
        .getOrElse('com.hrforhealth.myhrfh.staging')
def trustedOrigin = providers.gradleProperty('HRFH_TWA_ORIGIN')
        .getOrElse('https://myhrfh.com')

android {
    namespace 'com.hrforhealth.myhrfh'
    compileSdk 37
    defaultConfig {
        applicationId applicationIdValue
        minSdk 26
        targetSdk 36
        versionCode 1
        versionName '0.1.0'
        buildConfigField 'String', 'HRFH_TWA_ORIGIN', "\"${trustedOrigin}\""
    }
    buildFeatures { buildConfig true }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.browser:browser:1.10.0'
    implementation 'com.google.code.gson:gson:2.14.0'
    testImplementation 'junit:junit:4.13.2'
}
```

- [ ] **Step 4: Extend GitHub Actions**

Add `actions/setup-java` with Temurin 17, `gradle/actions/setup-gradle` pinned to Gradle 9.5.0, install Android platform 37/build-tools 36.0.0 through `sdkmanager`, check `android-native-bridge.js` syntax once introduced, and run the Android Gradle gate after Node tests.

- [ ] **Step 5: Run exact-head CI**

Expected: Android project compiles only after later source files are present; for this task, at minimum Node source-contract assertions should pass and Gradle should reach source compilation rather than configuration failure.

---

### Task 2: Strict management command protocol

**Files:**
- Create: `android/app/src/main/java/com/hrforhealth/myhrfh/ManagementCommand.java`
- Create: `android/app/src/test/java/com/hrforhealth/myhrfh/ManagementCommandTest.java`
- Extend: `tests/android-native-source.mjs`

**Interfaces:**
- Produces: `ManagementCommand.parse(String)` returning a validated command with `getRequestId()` and `getAction()`.
- Allowed actions: `restore-shortcut`, `uninstall`.

- [ ] **Step 1: Write failing Java unit tests**

Cover valid commands plus rejection of:
- malformed JSON;
- message over 2048 UTF-16 characters;
- wrong `type`;
- wrong `version`;
- missing/invalid `requestId`;
- unsupported action;
- executable fields such as `url`, `intent`, `package`, `command`, or `shell`.

- [ ] **Step 2: Run `gradle -p android testDebugUnitTest` and verify red**

Expected: `ManagementCommand` missing.

- [ ] **Step 3: Implement minimal parser**

Use Gson `JsonParser.parseString`, require a JSON object, exact protocol fields, request ID regex `[A-Za-z0-9_-]{1,64}`, and exact action allowlist. Reject any unexpected key except `type`, `version`, `requestId`, `action`.

- [ ] **Step 4: Rerun unit tests**

Expected: protocol tests pass.

---

### Task 3: Public-API shortcut and uninstall controllers

**Files:**
- Create: `android/app/src/main/java/com/hrforhealth/myhrfh/ShortcutController.java`
- Create: `android/app/src/main/java/com/hrforhealth/myhrfh/UninstallController.java`
- Create: `android/app/src/test/java/com/hrforhealth/myhrfh/ShortcutControllerPolicyTest.java`
- Create: `android/app/src/test/java/com/hrforhealth/myhrfh/UninstallControllerPolicyTest.java`
- Extend: `tests/android-native-source.mjs`

**Interfaces:**
- `ShortcutController.requestRestore(Context)` returns `requested`, `already-present`, `unsupported`, or `error`.
- `UninstallController.requestUninstall(Context)` returns `requested`, `unsupported`, or `error`.

- [ ] **Step 1: Write failing pure-policy tests**

Shortcut tests use a package-private static policy method accepting `supported` and a collection of pinned IDs. Expected decisions:
- unsupported → `unsupported`;
- contains `myhrfh-home` → `already-present`;
- supported and absent → `requested` policy.

Uninstall tests verify a package name is converted only to `package:<same-package>` and reject empty/invalid package identity.

- [ ] **Step 2: Run unit tests and verify red**

- [ ] **Step 3: Implement `ShortcutController`**

Use only framework `ShortcutManager`, `ShortcutInfo`, `Icon`, and `requestPinShortcut()`. The pin intent targets `ManagedTwaActivity`. Never use `INSTALL_SHORTCUT`, launcher provider queries, reflection, or hidden APIs.

- [ ] **Step 4: Implement `UninstallController`**

Use only:

```java
new Intent(Intent.ACTION_DELETE, Uri.parse("package:" + context.getPackageName()))
```

Verify it resolves before `startActivity`. Do not accept an external package name.

- [ ] **Step 5: Compile/lint/test**

Expected: unit tests green; source-contract test confirms public API usage and forbidden API absence.

---

### Task 4: TWA session and origin-validated native bridge

**Files:**
- Create: `android/app/src/main/java/com/hrforhealth/myhrfh/NativeManagementBridge.java`
- Create: `android/app/src/main/java/com/hrforhealth/myhrfh/ManagedTwaActivity.java`
- Create: `android/app/src/test/java/com/hrforhealth/myhrfh/NativeManagementBridgeTest.java`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Extend: `tests/android-native-source.mjs`

**Interfaces:**
- `NativeManagementBridge` extends `CustomTabsCallback`.
- `attachSession(CustomTabsSession)` supplies the session after creation.
- `onRelationshipValidationResult` accepts only `RELATION_USE_AS_ORIGIN` + configured origin + `result=true`.
- after relationship + `NAVIGATION_FINISHED`, bridge calls `requestPostMessageChannel(origin, origin, Bundle.EMPTY)` exactly once.
- `onMessageChannelReady` sends the capability handshake.
- `onPostMessage` parses `ManagementCommand`, dispatches to controllers, and sends a bounded result JSON.

- [ ] **Step 1: Write failing bridge policy tests**

Pure/static bridge helpers must test:
- origin equality is exact scheme+host+port normalized URI equality;
- handshake JSON advertises exactly `restore-shortcut` and `uninstall`;
- result JSON includes only type/version/requestId/status;
- unsupported/malformed commands never dispatch.

- [ ] **Step 2: Implement native bridge callback**

Keep maximum inbound message length 2048. Require successful relationship validation and channel readiness before dispatch. No logs may include raw inbound messages.

- [ ] **Step 3: Implement `ManagedTwaActivity`**

Use `CustomTabsClient.getPackageName`, `CustomTabsServiceConnection`, `warmup`, `newSession`, `validateRelationship`, `TrustedWebActivityIntentBuilder`, and public Custom Tab fallback. No caller-provided URL is consumed.

- [ ] **Step 4: Update manifest**

Include AndroidX `PostMessageService` with the library-required binding permission/export settings, fixed HTTPS app link, launcher activity, `asset_statements` metadata, and no unnecessary permissions.

- [ ] **Step 5: Run Android tests/lint/assemble**

Expected: full Android gate green.

---

### Task 5: Web bridge and real Android management buttons inside trusted TWA

**Files:**
- Create: `android-native-bridge.js`
- Create: `tests/android-native-bridge.mjs`
- Modify: `index.html`
- Modify: `install.js`
- Modify: `service-worker.js`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Expose `window.HRFHAndroidNative.isReady()`, `.getCapabilities()`, `.request(action)`.
- Dispatch `hrfh-android-native-ready` after accepted native handshake.
- `install.js` shows Android Restore/Uninstall only when that bridge reports the corresponding capability.

- [ ] **Step 1: Write failing Node tests**

Require:
- fixed trusted origin `https://myhrfh.com`;
- exact handshake/result message types/version;
- native readiness cannot be enabled from query string/localStorage/user agent;
- unknown origin/message/action ignored;
- `request()` only allows the two actions;
- web-only Android still hides Restore/Uninstall;
- native-ready Android buttons call bridge actions instead of instruction dialogs.

- [ ] **Step 2: Implement `android-native-bridge.js`**

Use the TWA page message event path supported by the validated postMessage session. Parse JSON defensively, require exact origin, maintain pending request IDs with bounded timeout, and expose no generic send method.

- [ ] **Step 3: Integrate `install.js`**

`getInstalledManagementAvailability()` returns native Android capability flags only when bridge ready. Restore/Uninstall handlers call the bridge on Android-native state; existing desktop guidance remains unchanged. Reinstall remains the browser/PWA recovery path.

- [ ] **Step 4: Rotate cache identity**

Use `myhrfh-installer-v7` and declare `android-native-management-v1`; include `android-native-bridge.js` in the app shell.

- [ ] **Step 5: Run Node + Android gate**

Expected: complete web and Android suites green.

---

### Task 6: Digital Asset Links template, security docs, and release evidence

**Files:**
- Create: `android/assetlinks.production.template.json`
- Create: `android/README.md`
- Modify: `README.md`
- Modify: `SECURITY.md`
- Modify: `docs/PRODUCTION-READINESS.md`
- Extend: `tests/android-native-source.mjs`

**Interfaces:**
- Produces the release-time checklist for package ID, signing fingerprint, DAL deployment, signing, physical TWA validation, and distribution approval.

- [ ] **Step 1: Write failing documentation/template tests**

Require both relations:
- `delegate_permission/common.handle_all_urls`
- `delegate_permission/common.use_as_origin`

Require explicit placeholders:
- `__HRFH_ANDROID_APPLICATION_ID__`
- `__HRFH_SIGNING_CERT_SHA256__`

Require docs to state placeholders are not deployable production trust and GitHub Pages project hosting cannot satisfy the production origin-root DAL requirement.

- [ ] **Step 2: Add template and Android operator README**

Document debug build, test commands, Gradle properties, DAL generation/deployment, signing boundary, ADB install only for explicitly approved test builds, and physical acceptance.

- [ ] **Step 3: Align top-level readiness/security docs**

Document that the repository implementation is compile/test complete but native production deployment remains blocked on approved package/signing/DAL/distribution inputs.

- [ ] **Step 4: Run final exact-head validation**

Run all Node syntax/tests plus `gradle -p android testDebugUnitTest lintDebug assembleDebug`.

Expected: all checks green on the exact PR head.

- [ ] **Step 5: Freeze and update PR metadata only**

Refresh PR head/base/diff, confirm 0 behind `main`, record exact run/SHA, and leave PR draft pending physical-device and production-origin acceptance. Do not merge or deploy.