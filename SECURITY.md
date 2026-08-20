# Security policy

## Scope

This repository contains a browser-only HRFH web-app installation experience. The supported release architecture is PWA-only; no Android APK, Trusted Web Activity, native bridge, application signing key, Play Store release, or sideloading channel is part of the product.

No credentials or secrets are embedded. No analytics, advertising, fingerprinting, PII collection, or Salesforce access is performed. The implementation has no caller-selected redirect destination and no silent install or removal capability.

The fixed production web destination is `https://myhrfh.com`.

## Browser boundary

The service worker handles only same-origin GET requests in its configured scope and must never proxy or cache arbitrary cross-origin portal traffic.

Supported Android Chrome may expose `navigator.getInstalledRelatedApps()` for a self-related PWA. A positive result is installed-PWA evidence. When that supported probe completes successfully with no matching self-PWA on Android, the installer may clear its stale same-origin fallback receipt and return to the install path. Probe absence/errors remain unknown rather than falsely claiming removal.

The browser can determine PWA installation state in supported cases, but a website **cannot inspect or verify the Android Home Screen or launcher icon itself**. Restore therefore provides user-controlled launcher steps only; it does not access launcher databases, hidden APIs, device packages, or privileged operating-system state.

There is no Uninstall action in the installer. Removal remains entirely under browser/operating-system control.

## Production HTTP boundary

Production hosting should use a restrictive Content-Security-Policy, Strict-Transport-Security after HTTPS readiness is confirmed, X-Content-Type-Options, Referrer-Policy, and a least-privilege Permissions-Policy. Review service-worker scope before moving these assets onto `myhrfh.com` so authenticated routes are not unintentionally controlled.

## Reporting

Report suspected security issues privately through GitHub private vulnerability reporting when enabled or HR for Health's established private security/engineering contact. Include affected URL/commit, reproduction steps, browser/device details, and impact. Never include passwords, session tokens, customer data, or other secrets in a report.

See `docs/PRODUCTION-READINESS.md` for release and physical-device acceptance boundaries.