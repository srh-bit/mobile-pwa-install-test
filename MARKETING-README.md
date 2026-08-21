# myHRFH Web App Installer — Marketing Hosting & Installation Guide

## Purpose

This handoff contains the production-ready browser/PWA installer for **myHRFH**. Marketing's responsibility is to host the supplied static web package at the approved HR for Health Marketing URL:

`https://hrfh.hrforhealth.com/web-install/`

The installer then guides visitors through adding the myHRFH web app on supported Android, iPhone/iPad, Windows, macOS, Chrome, Edge, and Safari environments. When the installed web app is opened, it forwards the user to:

`https://myhrfh.com`

This is a **browser-only Progressive Web App (PWA)** implementation. There is no APK, Android application package, Play Store dependency, native mobile application, Trusted Web Activity, native bridge, or sideload process.

---

## Release authority

This Marketing package was created from the physically accepted application source:

- Accepted application source SHA: `85cf632d7c2b3ecfb0b984e1f3c9097c1003db8d`
- Automated validation: **77/77 tests passed**
- Real Chromium installability validation: **passed**
- Desktop Chrome/Edge install → uninstall → reinstall validation: **passed**
- Android install and duplicate-install prevention validation: **passed**
- iPhone/iPad behavior: approved and unchanged
- Production service-worker cache identity: `myhrfh-installer-v12`

The handoff package is deliberately separated from the application source. Marketing should deploy the supplied package exactly as provided rather than rebuilding or modifying it.

---

# 1. What Marketing receives

The outer handoff artifact contains three files:

```text
hrfh-web-install-marketing.zip
SHA256SUMS.txt
MARKETING-README.md
```

### `hrfh-web-install-marketing.zip`

This is the **deployable web package**. This is the only ZIP whose `web-install/` contents should be placed on the Marketing web server.

### `SHA256SUMS.txt`

This contains the SHA-256 checksum of the deployable ZIP produced by the release process. It can be used to verify that the ZIP has not changed between handoff and deployment.

### `MARKETING-README.md`

This document. It is handoff documentation only and **must not be placed inside the public `web-install/` directory** unless Marketing intentionally wants the documentation to become publicly accessible. The recommended approach is to keep this README internal.

---

# 2. Exact deployable package contents

After extracting `hrfh-web-install-marketing.zip`, the package must contain exactly this runtime structure:

```text
web-install/
├── index.html
├── launch.html
├── styles.css
├── install.js
├── manifest.webmanifest
├── service-worker.js
├── ios-modal.css
├── ios-guidance-v2.css
├── ios-guidance-v3.css
├── ios-guidance-v2.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

There are **12 runtime files** total.

Do not add GitHub files, test files, development documentation, source maps, build files, package-manager files, or other development assets to this directory.

Do not remove any of the 12 runtime files. Each file is part of the accepted runtime package and is referenced by the page, manifest, or service-worker process.

---

# 3. Required production location

The directory must be hosted so that the public installer resolves exactly to:

`https://hrfh.hrforhealth.com/web-install/`

The important production URLs are expected to be:

```text
https://hrfh.hrforhealth.com/web-install/
https://hrfh.hrforhealth.com/web-install/index.html
https://hrfh.hrforhealth.com/web-install/launch.html
https://hrfh.hrforhealth.com/web-install/manifest.webmanifest
https://hrfh.hrforhealth.com/web-install/service-worker.js
https://hrfh.hrforhealth.com/web-install/install.js
https://hrfh.hrforhealth.com/web-install/ios-guidance-v2.js
https://hrfh.hrforhealth.com/web-install/styles.css
https://hrfh.hrforhealth.com/web-install/ios-modal.css
https://hrfh.hrforhealth.com/web-install/ios-guidance-v2.css
https://hrfh.hrforhealth.com/web-install/ios-guidance-v3.css
https://hrfh.hrforhealth.com/web-install/icons/icon-192.png
https://hrfh.hrforhealth.com/web-install/icons/icon-512.png
```

The folder name **`web-install` must remain unchanged** unless Engineering intentionally produces and revalidates a package for a different production route.

The PWA identity, scope, service worker, relative file paths, and Android installed-state detection depend on this deliberately scoped same-origin hosting model.

---

# 4. Recommended deployment procedure

## Step 1 — Preserve the original handoff

Before making any changes, retain an untouched copy of the complete handoff artifact in Marketing's internal storage.

Do not edit the ZIP before preserving the original.

## Step 2 — Verify the package checksum

If your environment provides a SHA-256 utility, compare the checksum of `hrfh-web-install-marketing.zip` to the value in `SHA256SUMS.txt`.

The purpose of this check is to confirm that Marketing is deploying the exact inspected release artifact rather than a modified or partially copied ZIP.

If the checksum does not match, stop and obtain a fresh copy of the approved package.

## Step 3 — Extract the deployable ZIP

Extract:

`hrfh-web-install-marketing.zip`

The extraction should produce a single top-level directory named:

`web-install`

Do **not** flatten the `icons/` directory into the root. The two PNG files must remain under `web-install/icons/`.

## Step 4 — Upload the directory to the Marketing host

Place the contents so that the server maps the extracted `web-install/` directory to:

`https://hrfh.hrforhealth.com/web-install/`

The preferred deployment is a normal static directory on the existing Marketing domain.

If the Marketing site is WordPress, do not upload these files individually into the WordPress Media Library. The package should be deployed as static web files through the site's normal hosting/deployment mechanism, such as the web root, managed hosting file deployment, SFTP/SSH, control panel, deployment pipeline, or an equivalent method approved by Marketing/IT.

## Step 5 — Preserve filenames and directory structure

Do not rename:

- `manifest.webmanifest`
- `service-worker.js`
- `install.js`
- `launch.html`
- either icon file
- any iOS runtime file

Do not combine/minify/bundle these files during the initial handoff deployment.

Do not allow a WordPress optimization plugin, CDN optimizer, script combiner, HTML minifier, JavaScript defer/rewrite plugin, image optimizer, or security plugin to rewrite the package until production behavior has been validated.

The package has already been optimized for this implementation and was validated in its current form.

---

# 5. HTTPS is required

The installer must be served over HTTPS.

The approved production URL already uses HTTPS:

`https://hrfh.hrforhealth.com/web-install/`

Modern browsers require a secure context for service-worker/PWA behavior outside of localhost. A plain HTTP deployment is not supported.

Verify that the TLS certificate is valid and that the browser does not report mixed-content or certificate errors.

---

# 6. Required file types / MIME types

The web server or CDN should return appropriate content types.

Recommended mappings:

| File type | Recommended Content-Type |
| --- | --- |
| `.html` | `text/html; charset=utf-8` |
| `.css` | `text/css; charset=utf-8` |
| `.js` | `text/javascript; charset=utf-8` or `application/javascript` |
| `.webmanifest` | `application/manifest+json` |
| `.png` | `image/png` |

Most modern web servers handle HTML, CSS, JS, and PNG automatically. The item most likely to require an explicit configuration is `.webmanifest`.

Do not serve `manifest.webmanifest` as a download/attachment.

Do not serve JavaScript or the manifest with a generic binary content type if the hosting platform can provide the correct MIME type.

---

# 7. Service worker requirements

The file:

`/web-install/service-worker.js`

must be served from the same origin as the installer.

It should return HTTP `200` directly and should not redirect to another domain, login page, WordPress route, or CDN error page.

The current service-worker cache identity is:

`myhrfh-installer-v12`

This version is intentional. It delivers the accepted Desktop uninstall-recognition correction while retaining the accepted Android and iOS behavior.

Recommended caching treatment:

- `service-worker.js`: `Cache-Control: no-cache` or an equivalent revalidation policy
- `index.html`: revalidate/no-cache preferred during initial production rollout
- `launch.html`: revalidate/no-cache preferred
- `manifest.webmanifest`: revalidate/no-cache preferred
- CSS/JS/icons: normal web caching is acceptable, but avoid `immutable` during the initial rollout because filenames are not content-hashed

Do not configure a CDN to permanently cache an old `service-worker.js` version.

---

# 8. Production manifest identity

The Marketing package is intentionally different from the staging package only where production hosting identity requires it.

The production manifest's related web-app identity must point to:

```text
https://hrfh.hrforhealth.com/web-install/manifest.webmanifest
```

and the related application ID must be:

```text
https://hrfh.hrforhealth.com/web-install/
```

The manifest otherwise keeps the accepted relative application identity:

```text
id: ./
start_url: ./launch.html
scope: ./
display: standalone
```

Do not replace the relative `id`, `start_url`, or `scope` with `https://myhrfh.com`.

The installed PWA belongs to the Marketing installer origin and then forwards the user to `https://myhrfh.com` through the dedicated `launch.html` entry point. A cross-origin PWA scope/start URL is not permitted by the browser model.

---

# 9. Launcher icons

The production package contains exactly two accepted launcher icons:

```text
/web-install/icons/icon-192.png
/web-install/icons/icon-512.png
```

The manifest declares them as:

- 192×192 PNG — `purpose: any`
- 512×512 PNG — `purpose: any`

These exact launcher assets were restored after real Chromium testing identified a prior icon replacement as causing the PWA to become technically non-installable.

**Do not replace, resize, optimize, recompress, convert, or regenerate these two launcher PNGs without Engineering validation.**

A visually similar image can still cause Chromium PWA installability to fail.

The visible HRFH logo on the installer page is separate from these launcher icons and currently loads from:

`https://hrforhealth.com/wp-content/uploads/2024/04/Logo-icon-1.png.webp`

That external logo origin must remain reachable from the public installer.

---

# 10. Security headers

The installer contains no credentials, Salesforce data, user PII collection, analytics identifiers, advertising identifiers, native application code, or arbitrary URL bridge.

Recommended production security headers include:

```text
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
```

`Strict-Transport-Security` may be used according to the existing HR for Health domain-wide HTTPS policy.

A Content Security Policy is also recommended, but **do not apply a generic restrictive CSP without testing this package**. `index.html` and `launch.html` intentionally contain small inline bootstrap scripts, and `launch.html` contains a small inline style. A CSP that blocks all inline script/style execution without approved hashes/nonces will break the installed-launch behavior.

If the site already enforces CSP, ensure that it permits:

- same-origin scripts/styles/service-worker/manifest files
- the approved external logo image from `https://hrforhealth.com`
- the package's intentional inline bootstrap code through an approved CSP mechanism

Preferred long-term practice is exact CSP hashes or nonces where the hosting environment supports them. Do not weaken a stronger existing Marketing-domain security policy without review.

---

# 11. CDN, firewall, WAF, and WordPress considerations

If Cloudflare, a CDN, WAF, caching plugin, security plugin, or reverse proxy sits in front of the Marketing site, verify that it does **not**:

- rewrite JavaScript
- combine JavaScript files
- inject asynchronous loading into the install controller
- rewrite the web manifest
- convert PNG launcher icons
- redirect `service-worker.js`
- cache an outdated service worker indefinitely
- require authentication for the public `/web-install/` shell
- return an HTML challenge page for the manifest, service worker, JS, CSS, or icon assets

The installer itself is intentionally public. Authentication remains the responsibility of `https://myhrfh.com` after the installed app opens the HRFH portal.

If the Marketing site automatically redirects unknown paths through WordPress, create a real static `/web-install/` directory or equivalent route so the PWA files are served directly.

---

# 12. Expected end-user experience

## Android — Chrome / Chromium

When the PWA is not installed and Chrome provides its native installation capability, the installer displays:

**Install HRFH web app**

Selecting it opens Chrome's native PWA installation interface.

When Android confirms that myHRFH is already installed, the page displays the installed-state actions:

- **Open HRFH web app**
- **Reinstall**

The release intentionally contains **no Restore button and no Uninstall button**.

If the browser does not provide a live native installation prompt, the page gives Chrome's browser-menu **Install app** guidance rather than displaying a dead custom button.

Android duplicate-install prevention uses supported browser installed-related-app evidence where available, plus conservative installed-state receipt behavior.

A normal website cannot inspect Android's Home Screen icon inventory, so the installer does not claim to detect whether an individual launcher shortcut has been manually removed.

## Windows — Chrome / Edge

When Chromium determines that the PWA is installable, the page shows:

**Install HRFH web app**

The button opens the browser's real native PWA installation dialog.

After installation, the installed application launches toward `https://myhrfh.com`.

If the user later uninstalls the PWA, returning to the installer allows a new browser installability signal to clear stale local installed-state evidence and restore the **Install HRFH web app** action.

This install → uninstall → reinstall lifecycle was physically validated before handoff.

## iPhone / iPad — Safari and Chrome

iOS does not provide the same programmable installation prompt as Chromium desktop/Android.

The page automatically provides the approved visual instructions for Apple's Add to Home Screen flow.

The general sequence is:

1. Open the installer in Safari or Chrome on iPhone/iPad.
2. Tap **Share**. If Safari does not show Share directly, use **More** and then Share.
3. Choose **Add to Home Screen**.
4. Choose **Open as Web App** when Apple presents that option.
5. Tap **Add**.

The exact on-screen guidance adapts to the detected iOS browser/layout. Marketing does not need to add separate iOS instructions to the page.

The current iOS experience was already approved and was intentionally left unchanged during the final Android/Desktop corrections.

## macOS

Chrome/Edge use Chromium's normal native PWA install flow when available.

Safari uses Apple's **File → Add to Dock** path.

---

# 13. Production validation immediately after upload

After Marketing uploads the package, complete the following checks before publishing the installer link broadly.

## Basic HTTP checks

Open each of these in a normal browser and confirm there are no 404/403/500 responses:

- `/web-install/`
- `/web-install/manifest.webmanifest`
- `/web-install/service-worker.js`
- `/web-install/install.js`
- `/web-install/icons/icon-192.png`
- `/web-install/icons/icon-512.png`

Confirm that `/web-install/` displays the HR for Health installer rather than a WordPress 404 page or directory listing.

## Branding check

Confirm:

- HR for Health logo is visible
- page title is **Add the HRFH web app**
- page does not display GitHub URLs
- page does not expose a Restore button
- page does not expose an Uninstall button

## Browser developer-tools check — Chrome/Edge

For a technical validation, open browser Developer Tools → **Application** and check:

1. **Manifest** loads without PWA installability errors.
2. The 192×192 and 512×512 icons load.
3. **Service Workers** shows `/web-install/service-worker.js` registered/activated for the expected `/web-install/` scope.
4. The manifest start URL resolves to `/web-install/launch.html`.

## Android physical check

Using Android Chrome:

1. Ensure myHRFH is not installed.
2. Open `https://hrfh.hrforhealth.com/web-install/`.
3. Confirm **Install HRFH web app** appears when Chrome supplies its native prompt.
4. Install the PWA.
5. Revisit the installer.
6. Confirm the installed state does not promote an unnecessary duplicate installation.
7. Confirm installed actions remain **Open HRFH web app + Reinstall**.
8. Confirm there is no Restore or Uninstall control.

## Desktop Chrome/Edge physical check

1. Ensure the PWA is not installed.
2. Open the production installer.
3. Confirm **Install HRFH web app** appears when Chromium supplies the native prompt.
4. Select Install and complete installation.
5. Open the installed PWA and confirm it forwards to `https://myhrfh.com`.
6. Uninstall the PWA from Chrome/Edge.
7. Return to or refresh the production installer.
8. Confirm the page returns to an installable state rather than remaining stuck on **previously installed**.
9. Confirm the Install button opens the real browser installation dialog again.

## iPhone/iPad physical check

1. Open the production installer in Safari.
2. Confirm the approved iOS installation sheet/guidance appears.
3. Confirm Share / More / Add to Home Screen guidance is legible and correctly positioned.
4. Complete Add to Home Screen if desired.
5. Repeat a quick visual check in iPhone Chrome.
6. Do not change the iOS assets unless a production-origin defect is identified.

---

# 14. Marketing landing-page integration

The installer is intentionally a separate destination rather than requiring the Marketing landing page itself to detect device/browser type.

Marketing can place a normal CTA/button on the existing page, for example:

**Add myHRFH to your device**

and link that CTA to:

`https://hrfh.hrforhealth.com/web-install/`

The installer handles device/browser-specific behavior after the user arrives.

There is no need to expose a GitHub URL to users.

Do not iframe the installer into another page. Use a normal navigation link to the `/web-install/` URL so the PWA retains its intended top-level origin, scope, and browser installation behavior.

---

# 15. What Marketing should not change

For the initial production release, do not modify any of the following without Engineering review and a new validation cycle:

- manifest `id`
- manifest `scope`
- manifest `start_url`
- `related_applications`
- service-worker filename or cache identity
- launcher PNG files
- `install.js`
- `launch.html`
- iOS JavaScript/CSS
- Restore/Uninstall behavior
- Android installed-state logic
- Desktop uninstall-recognition logic
- production `/web-install/` route

Do not change the package into an APK or native application.

Do not add tracking scripts, cookie banners, tag-manager scripts, analytics code, marketing pixels, or third-party JavaScript directly into this package without reviewing the PWA/installability and privacy impact.

If Marketing wants analytics on the CTA, the safer place is generally the existing Marketing landing page that links to the installer rather than modifying the accepted installer package.

---

# 16. Troubleshooting

## Installer page returns 404

Verify that the extracted `web-install/` directory is mapped to the domain root so its public path is exactly `/web-install/`.

Check for WordPress permalink/rewrite rules intercepting the path.

## Installer loads but has no styling

Check that the CSS files return HTTP 200 and `text/css` rather than HTML/error pages.

Confirm the package directory structure was not flattened.

## Logo does not display

Verify that the visitor/browser can load:

`https://hrforhealth.com/wp-content/uploads/2024/04/Logo-icon-1.png.webp`

If Content Security Policy is enabled, ensure the `img-src` policy allows the `https://hrforhealth.com` origin.

## Chrome/Edge does not offer installation

Check browser Developer Tools → Application → Manifest for installability errors.

Verify:

- HTTPS is valid
- `manifest.webmanifest` loads
- both PNG icons load
- `service-worker.js` registers successfully
- the service worker is not being redirected
- the manifest returns the correct MIME type
- the icons have not been modified by an optimizer/CDN
- the browser does not already consider the PWA installed

Do **not** solve a missing Install button by forcing the custom button to display. The button is intentionally shown only when a real browser installation prompt is available.

## Android appears already installed after removal

First confirm whether the PWA itself was completely removed rather than only its Home Screen icon/shortcut.

A website cannot inspect Android's launcher icon inventory. Removing only the Home Screen icon is different from uninstalling the installed PWA.

If the PWA was fully removed, reopen/refresh the installer and allow Chrome to reassess installed state.

## Desktop still says previously installed after uninstall

Close the installed PWA, confirm it has actually been removed from the browser/OS, then revisit or refresh the production installer in Chrome/Edge. A fresh browser installability event should supersede the stale local receipt and restore Install.

If it does not, inspect the manifest/service worker before modifying application code.

## iPhone/iPad does not show a native Install button

This is expected. iOS uses Share → Add to Home Screen rather than Chromium's programmable native install prompt.

Follow the on-page iOS guidance.

---

# 17. Updating or replacing the package later

Future releases should replace the **complete package as one coherent version**.

Do not mix files from multiple releases, for example a new `install.js` with an old `service-worker.js` or old launcher icons.

For future releases:

1. Receive the new approved handoff artifact.
2. Verify its checksum.
3. Preserve the current package as the rollback copy.
4. Replace all runtime files together.
5. Purge CDN caches for `/web-install/` if applicable, especially `service-worker.js`, HTML, manifest, JS, and CSS.
6. Re-run the production validation checklist.

Because service workers can retain cached application shells, Engineering should deliberately rotate the cache identity when a release requires clients to receive changed controller/runtime behavior.

Marketing should not manually edit the cache version.

---

# 18. Rollback

If a production-origin issue is found immediately after deployment:

1. Do not partially edit individual runtime files in production.
2. Preserve evidence of the problem (browser/device, screenshot, console or network error if available).
3. Redeploy the last fully accepted complete package if a rollback is required.
4. Purge relevant CDN/server caches.
5. Re-test the production installer.
6. Send the failure evidence to Engineering for diagnosis.

Do not combine the previous and current package during rollback.

---

# 19. Final handoff checklist

Before declaring the Marketing installation complete, confirm all of the following:

- [ ] `hrfh-web-install-marketing.zip` checksum matches `SHA256SUMS.txt` before deployment.
- [ ] The ZIP extracts to one `web-install/` directory.
- [ ] The deployable directory contains exactly the 12 approved runtime files.
- [ ] The public URL is `https://hrfh.hrforhealth.com/web-install/`.
- [ ] HTTPS certificate is valid.
- [ ] `index.html` loads successfully.
- [ ] `manifest.webmanifest` loads successfully with the correct content type.
- [ ] `service-worker.js` loads directly without redirect/authentication.
- [ ] Both launcher icons load and have not been optimized/replaced.
- [ ] HR for Health visible logo loads.
- [ ] No GitHub link is exposed to end users.
- [ ] No Restore button is present.
- [ ] No Uninstall button is present.
- [ ] Android native installation path works.
- [ ] Android installed state remains Open + Reinstall.
- [ ] Android does not unnecessarily promote duplicate installation when installed evidence is available.
- [ ] Desktop Chrome/Edge installation works.
- [ ] Desktop uninstall → revisit → reinstall cycle works.
- [ ] iPhone/iPad approved Share/Add-to-Home-Screen guidance works.
- [ ] Installed PWA opens `https://myhrfh.com`.
- [ ] CDN/WAF/WordPress optimization is not rewriting the package.
- [ ] Production-origin browser Developer Tools show no manifest/service-worker errors.
- [ ] A rollback copy of the prior accepted package is retained internally.

---

# 20. Release summary

The Marketing host is responsible only for serving the accepted static installer package at:

`https://hrfh.hrforhealth.com/web-install/`

The package itself handles the supported browser/device flows. The existing Marketing landing page can simply link users to that URL.

The installer does not authenticate users, collect HR data, or replace the myHRFH portal. Its job is to provide a polished device-aware browser installation experience and then open the existing portal at:

`https://myhrfh.com`

For the initial production handoff, the safest deployment is to **host the package exactly as supplied, preserve the filenames and `/web-install/` route, avoid optimizer rewrites, and complete the production validation checklist before broad promotion.**
