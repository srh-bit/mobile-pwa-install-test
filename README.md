# mobile-pwa-install-test

Temporary PWA install-experience test for iOS and Android.

## Destination

The user-facing destination for this prototype is:

**https://myhrfh.com**

## Important test limitation

A true installed PWA must launch from the same origin where the user installs it. Because this proof of concept is hosted on GitHub Pages, its test manifest must launch the GitHub Pages origin, not `myhrfh.com`.

To reproduce the desired shortcut behavior anyway, the installed test shell immediately forwards to `https://myhrfh.com` when it detects that it was launched from the Home Screen. The installer page is therefore only intended to be seen before installation.

The prototype validates:

- Android install-prompt behavior
- iPhone/iPad Add to Home Screen guidance
- installed standalone detection
- immediate forwarding from the installed icon to `https://myhrfh.com`
- the shortest practical instruction flow

For the final production shortcut to open directly at `myhrfh.com` without the GitHub-hosted test shell, the manifest/install metadata will need to be served by `https://myhrfh.com` itself.

## Android test

1. Open the GitHub Pages test URL in Chrome on Android.
2. Wait for **Install shortcut** to appear.
3. Tap **Install shortcut** and confirm the browser prompt.
4. Launch **myHRFH Test** from the Home Screen.
5. Confirm the installed icon immediately forwards to `https://myhrfh.com` instead of showing the installer again.

If Chrome does not expose the install prompt, use its menu and select **Install app** or **Add to Home screen**.

## iPhone/iPad test

1. Open the GitHub Pages test URL in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Keep **Open as Web App** enabled if Safari presents that option, then tap **Add**.
5. Launch **myHRFH Test** from the Home Screen.
6. Confirm the installed icon immediately forwards to `https://myhrfh.com` instead of showing the installer again.

## Validation

The repository uses only Node.js built-ins for deterministic checks:

```text
node --test tests/validate.mjs
```

GitHub Actions runs the same validation on the feature branch and on pull requests to `main`.

## Scope

This repository contains no production credentials, Salesforce access, analytics, production-site changes, configuration profiles, APKs, or other native packages.
