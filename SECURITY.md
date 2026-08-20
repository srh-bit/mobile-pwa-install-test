# Security policy

## Scope

This repository contains a public web-app installation experience for HR for Health. It is intentionally low-privilege and must remain that way.

The installer has:

- no credentials or secrets;
- no analytics, advertising, fingerprinting, or tracking;
- no collection of personal information or authentication data;
- no Salesforce access;
- no arbitrary URL, command, profile, package, or native-app execution;
- no ability to bypass browser or operating-system install/uninstall consent.

The fixed destination is `https://myhrfh.com`.

## Service-worker boundary

The service worker may handle only same-origin GET requests inside its configured scope. It must not proxy, rewrite, inspect, or cache arbitrary cross-origin requests. In the GitHub Pages staging build it does not intercept `myhrfh.com` traffic.

Before production deployment, review the service-worker scope on `myhrfh.com` so the installer cannot unintentionally control unrelated authenticated application routes.

## Client-side data

The installer must not place credentials, session tokens, personal information, or sensitive state in its source, manifest, service-worker cache, URL parameters, or browser storage.

Installed-state checks use browser capability signals only. They do not require user identity.

## Reporting a security issue

Please report suspected security issues privately rather than opening a public issue containing exploit details, credentials, or sensitive information.

Use GitHub private vulnerability reporting if it is enabled for this repository, or use HR for Health's established private security/engineering contact. Include the affected URL or commit, reproduction steps, browser/device details, and the security impact. Do not include passwords, session tokens, customer data, or other secrets in the report.

## Public deployment expectations

Production hosting must use HTTPS and appropriate security headers, including a restrictive Content-Security-Policy, Strict-Transport-Security after domain readiness is confirmed, X-Content-Type-Options, Referrer-Policy, and a least-privilege Permissions-Policy.

See `docs/PRODUCTION-READINESS.md` for the complete production deployment and browser validation checklist.
