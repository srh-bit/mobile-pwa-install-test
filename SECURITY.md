# Security policy

## Scope

This repository contains the public HRFH web-app installation experience and an optional HRFH-owned Android TWA package. Both are intentionally least-privilege.

The implementation has no credentials, secrets, analytics, advertising, fingerprinting, PII collection, Salesforce access, arbitrary redirect destination, silent install/uninstall path, or hidden/non-SDK Android API usage.

The fixed production web origin is `https://myhrfh.com`.

## Web boundary

The service worker handles only same-origin GET requests in its configured scope and must never proxy or cache arbitrary cross-origin portal traffic. Installed-state storage is a same-origin boolean receipt only. `beforeinstallprompt` must never erase positive installed evidence merely because a browser exposes installability again.

A browser page cannot enumerate arbitrary Android Home Screen/launcher artifacts. Ordinary web Android therefore exposes Open + deliberate Reinstall recovery only; it does not display fake executable Restore/Uninstall actions.

## Native Android boundary

Native management is disabled until all of the following are true:

1. the HRFH Android package owns a Custom Tabs session;
2. Digital Asset Links relationship `delegate_permission/common.use_as_origin` validates for the fixed configured HRFH origin;
3. the postMessage channel for that same origin is ready;
4. the web page receives the native `hrfh-native` capability handshake through that validated MessagePort.

User agent, URL query, browser storage, or JavaScript feature spoofing cannot grant native capability state.

The native command parser accepts exactly protocol version 1 fields `type`, `version`, `requestId`, and `action`; messages are bounded and only `restore-shortcut` or `uninstall` are allowed. Unknown or executable fields are rejected.

**Restore shortcut** uses the public framework `ShortcutManager` for stable ID `myhrfh-home`, checks only the package's own pinned shortcuts, and retains launcher/user confirmation. **Uninstall** uses public `Intent.ACTION_DELETE` for `context.getPackageName()` only and retains Android's system confirmation. The native code must never expose arbitrary Intent, URL, package-name, shell, reflection, launcher-database, or code-execution capabilities.

Production signing keys, passwords, Play credentials, package approval, certificate fingerprints, and deployed Digital Asset Links are separate privileged release inputs and are never committed here.

## Production HTTP boundary

Production hosting should use a restrictive Content-Security-Policy, Strict-Transport-Security after HTTPS readiness is confirmed, X-Content-Type-Options, Referrer-Policy, and a least-privilege Permissions-Policy. Review service-worker scope before moving these assets onto `myhrfh.com` so authenticated routes are not unintentionally controlled.

## Reporting

Report suspected security issues privately through GitHub private vulnerability reporting when enabled or HR for Health's established private security/engineering contact. Include affected URL/commit, reproduction steps, browser/device details, and impact. Never include passwords, session tokens, customer data, signing keys, or other secrets in a report.

See `docs/PRODUCTION-READINESS.md` for release and physical-device acceptance boundaries.
