# Security policy

## Scope

This repository contains a public web-app installation experience for HR for Health. It is intentionally low-privilege and must remain that way.

The installer has:

- no credentials or secrets;
- no analytics, advertising, fingerprinting, or tracking;
- no collection of personal information or authentication data;
- no Salesforce access;
- no arbitrary URL, command, profile, package, or native-app execution;
- no ability to inspect arbitrary Android launcher icons or bookmarks;
- no ability to bypass browser or operating-system install/uninstall consent;
- no hidden, private, internal, reflection-based, or other non-SDK Android API usage.

The fixed destination is `https://myhrfh.com`.

## Service-worker boundary

The service worker may handle only same-origin GET requests inside its configured scope. It must not proxy, rewrite, inspect, or cache arbitrary cross-origin requests. In the GitHub Pages staging build it does not intercept `myhrfh.com` traffic.

Before production deployment, review the service-worker scope on `myhrfh.com` so the installer cannot unintentionally control unrelated authenticated application routes.

## Client-side data

The installer must not place credentials, session tokens, personal information, or sensitive state in its source, manifest, service-worker cache, URL parameters, or browser storage.

Installed-state checks use browser capability signals only. They do not require user identity. The verified install receipt is a same-origin boolean marker only. On Android it can be written after a user accepts the native PWA prompt, after `appinstalled`, from a real standalone launch, or after positive related-app detection. `beforeinstallprompt` must not erase that positive evidence automatically.

The final iOS install assistant stores no toolbar-layout calibration or preference state. Share, circled More, and Add-to-Home-Screen instructional symbols are rendered from static same-origin UI code and do not collect device configuration, identity, authentication state, analytics identifiers, browsing history, or PII.

## Android management boundary

The browser-only installer does not expose Android launcher-management or package-removal capabilities that a webpage does not possess. Android Restore shortcut and Uninstall controls must remain absent from the web-only installed state rather than opening instruction-only dialogs that imply executable management.

A future Trusted Web Activity/native Android companion may expose narrowly scoped management actions only after production origin/package association is established. That layer must:

- use public Android APIs such as `ShortcutManager` for the package's own shortcut requests;
- retain Android/launcher user confirmation for shortcut creation;
- use Android's public system uninstall or application-management UI and retain user confirmation for removal;
- never use hidden API or non-SDK interfaces;
- never expose arbitrary Intent, URL, package-name, shell-command, reflection, or code-execution bridges to web content;
- if web/native messaging is used, validate the associated production origin and allowlist only fixed HRFH management commands.

Package signing keys, publishing credentials, production Digital Asset Links, and store distribution are separate privileged deployment concerns and must not be embedded in this public repository.

## Reporting a security issue

Please report suspected security issues privately rather than opening a public issue containing exploit details, credentials, or sensitive information.

Use GitHub private vulnerability reporting if it is enabled for this repository, or use HR for Health's established private security/engineering contact. Include the affected URL or commit, reproduction steps, browser/device details, and the security impact. Do not include passwords, session tokens, customer data, or other secrets in the report.

## Public deployment expectations

Production hosting must use HTTPS and appropriate security headers, including a restrictive Content-Security-Policy, Strict-Transport-Security after domain readiness is confirmed, X-Content-Type-Options, Referrer-Policy, and a least-privilege Permissions-Policy.

The final deployment must keep installed-state storage within the deliberately scoped installer/application origin, review the service-worker scope, and complete the physical-device acceptance matrix before broad release.

Any future Android TWA/native package must additionally verify its production-origin association, public-API-only management boundary, signing/publishing process, and user-consent flows before native Restore or Uninstall actions are enabled.

See `docs/PRODUCTION-READINESS.md` for the complete production deployment and browser validation checklist.