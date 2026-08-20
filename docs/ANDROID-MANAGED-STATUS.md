# Android managed capability — current status

This file is the durable current-state record for the optional HRFH Android Trusted Web Activity capability on PR #1 (`feature/pwa-install-prototype`). Live GitHub PR/head/CI evidence remains authoritative.

The earlier `docs/superpowers/specs/2026-08-20-android-managed-twa-design.md` and `docs/superpowers/plans/2026-08-20-android-managed-twa.md` are retained as design history. Where they mention Android API 37 or earlier implementation assumptions, this current-state file plus `android/README.md` and `docs/PRODUCTION-READINESS.md` supersede them.

## Implemented

- Browser/PWA Android duplicate-install prevention: positive installed evidence wins over `beforeinstallprompt`; an accepted install writes the same-origin receipt immediately; refresh does not intentionally promote another install.
- Browser-only Android installed state: **Open** plus explicit **Reinstall** recovery; it does not pretend JavaScript can enumerate launcher icons or execute package removal.
- Optional HRFH-owned native package under `android/` using only public Android/AndroidX APIs.
- Build baseline: Java 17, AGP 9.3.1, Gradle 9.5.0, compileSdk/targetSdk 36, minSdk 26, AndroidX Browser 1.10.0, Gson 2.14.0.
- Fixed production TWA origin `https://myhrfh.com`; non-production origin override fails the Android build.
- Digital Asset Links split correctly by direction: Android app declares web ownership; production website template declares `handle_all_urls` plus `use_as_origin` back to the package/signing certificate.
- Validated-origin MessagePort capability handshake exposes exactly `restore-shortcut` and `uninstall`.
- Restore uses stable shortcut ID `myhrfh-home`, checks the package's own pinned shortcuts, and calls `ShortcutManager.requestPinShortcut()` with launcher/user confirmation.
- Uninstall opens Android's `Intent.ACTION_DELETE` for `context.getPackageName()` only with system/user confirmation.
- Relationship revocation disables native channel readiness; malformed, oversized, extra-field, unsupported, or executable commands are rejected.
- TWA launch failure falls back to the fixed portal in a normal Custom Tab rather than widening trust or crashing.
- CI runs browser syntax, repository tests, Android unit tests, lint, and debug assembly. Maven Central HTTP 429 may trigger one bounded retry of the exact same Android gate; other failures remain fail-closed.

## Acceptance evidence history

- `c8e4bd81f1e14fb8961d76dbc54fa071185a68eb`: full native foundation gate passed after correcting the unavailable preview API-37 assumption to stable API 36.
- `93cc43f21222728e6a989c4dbf1f20ee886fc19c`: deliberate hardening red phase; 61/63 repository tests passed and exactly the two new origin/revocation assertions failed.
- `105500cff30f998371df719ebb1e23d732bc9476`: those two hardening tests passed as part of 63/63 repository tests; the subsequent Android dependency-resolution step was blocked by external Maven Central HTTP 429 responses, not compiler/lint feedback.

Final acceptance must be associated with the live PR head after all code-changing commits. Do not use an earlier green SHA as acceptance for a later head.

## Remaining production boundaries

These are not code defects and are intentionally not auto-approved by repository validation:

1. approve the production Android application/package ID;
2. establish the approved signing/upload-key process and obtain the signing certificate SHA-256 fingerprint;
3. render and deploy the exact production `https://myhrfh.com/.well-known/assetlinks.json` from the checked template;
4. build/sign through the approved release process and verify package/fingerprint/DAL consistency;
5. physical Android acceptance: toolbar-free TWA trust, MessagePort handshake, Restore confirmation, duplicate prevention, native uninstall confirmation, reinstall/relaunch behavior, accessibility, and native launcher-icon visual approval;
6. explicit Play/internal distribution decision;
7. production-origin installer hosting/security headers/service-worker-scope validation;
8. complete the documented iPhone/iPad and desktop physical-device matrix.

No production signing key, production DAL statement, APK/AAB publication, app distribution, production deployment, or merge is authorized by this status record.
