# mobile-pwa-install-test

Temporary PWA install-experience test for iOS and Android.

## Destination

The user-facing destination for this prototype is:

**https://myhrfh.com**

## Important test limitation

A true installed PWA must launch from the same origin where the user installs it. Because this proof of concept is hosted on GitHub Pages, its test manifest must launch the GitHub Pages origin, not `myhrfh.com`.

The prototype therefore validates:

- Android install-prompt behavior
- iPhone/iPad Add to Home Screen guidance
- installed standalone appearance
- the shortest practical instruction flow
- explicit navigation to `https://myhrfh.com`

For the final production shortcut to open directly at `myhrfh.com`, the manifest/install metadata will need to be served by `https://myhrfh.com` itself.

## Android test

1. Open the GitHub Pages test URL in Chrome on Android.
2. Wait for **Install shortcut** to appear.
3. Tap **Install shortcut** and confirm the browser prompt.
4. Launch **myHRFH Test** from the Home Screen.
5. Tap **Continue to myHRFH** and confirm it opens `https://myhrfh.com`.

If Chrome does not expose the install prompt, use its menu and select **Install app** or **Add to Home screen**.

## iPhone/iPad test

1. Open the GitHub Pages test URL in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Keep **Open as Web App** enabled if Safari presents that option, then tap **Add**.
5. Launch **myHRFH Test** from the Home Screen.
6. Tap **Continue to myHRFH** and confirm it opens `https://myhrfh.com`.

## Validation

The repository uses only Node.js built-ins for deterministic checks:

```text
node --test tests/validate.mjs
```

GitHub Actions runs the same validation on the feature branch and on pull requests to `main`.

## Scope

This repository contains no production credentials, Salesforce access, analytics, production-site changes, configuration profiles, APKs, or other native packages.
