myHRFH WEB APP INSTALLER
MARKETING HOSTING, INSTALLATION, AND VALIDATION GUIDE
====================================================

PURPOSE
-------
This handoff contains the production-ready browser/PWA installer for myHRFH.

Marketing does NOT need to build, compile, install Node, run GitHub, create an APK,
use the Play Store, or integrate this into WordPress code.

The simplest supported deployment is:

  1. Extract the supplied deployable ZIP.
  2. Upload the complete "web-install" folder to the Marketing web host.
  3. Make sure it is publicly available at:

     https://hrfh.hrforhealth.com/web-install/

  4. Add a button or link on the existing Marketing page that points to that URL.
  5. Complete the short validation checklist in this document.

That is the preferred Marketing process.

When a visitor opens the installer, the page automatically detects the device/browser
and guides the user through the appropriate install process. When the installed web app
is opened, it forwards the user to:

  https://myhrfh.com

This is a browser-only Progressive Web App (PWA). There is no APK, native Android
application, Trusted Web Activity, Play Store dependency, native bridge, or sideload
process.


====================================================
MARKETING QUICK START - RECOMMENDED PROCESS
====================================================

If your hosting provider supports normal file upload, this is all Marketing needs to do.

STEP 1 - OPEN THE HANDOFF BUNDLE
--------------------------------
The handoff bundle contains:

  hrfh-web-install-marketing.zip
  SHA256SUMS.txt
  MARKETING-README.txt

The file named hrfh-web-install-marketing.zip is the deployable package.

MARKETING-README.txt is documentation only. Do not publish it in /web-install/.

SHA256SUMS.txt is provided so the deployable ZIP can be verified if desired.


STEP 2 - EXTRACT THE DEPLOYABLE ZIP
-----------------------------------
Extract:

  hrfh-web-install-marketing.zip

It should create one folder:

  web-install

Do not rename this folder.

Do not move the files out of the folder.

Do not flatten the icons folder.


STEP 3 - UPLOAD THE ENTIRE FOLDER AS-IS
----------------------------------------
Upload the complete extracted web-install folder to the document root of:

  hrfh.hrforhealth.com

The end result must be:

  https://hrfh.hrforhealth.com/web-install/

If your hosting document root is something such as:

  public_html/
  www/
  htdocs/
  web/

then the expected server layout is normally similar to:

  <document-root>/web-install/index.html
  <document-root>/web-install/manifest.webmanifest
  <document-root>/web-install/service-worker.js
  <document-root>/web-install/icons/icon-192.png
  <document-root>/web-install/icons/icon-512.png

The exact document-root name depends on the Marketing hosting provider.


STEP 4 - DO NOT EDIT OR OPTIMIZE THE FILES
-------------------------------------------
For the initial deployment, upload the package exactly as provided.

Do not:

  - rename files
  - rename the web-install folder
  - minify or combine JavaScript
  - rewrite HTML
  - optimize/recompress the launcher PNG files
  - convert PNG files to WebP
  - move service-worker.js
  - move manifest.webmanifest
  - run the package through a WordPress optimization plugin
  - change the PWA manifest
  - point the manifest start URL directly at myhrfh.com

The package has already been validated in its current form.


STEP 5 - OPEN THE PUBLIC URL
----------------------------
Open:

  https://hrfh.hrforhealth.com/web-install/

Confirm that the HR for Health installer page loads normally.

Also confirm these URLs return the expected files and not a 404 page, login page,
redirect page, WordPress template, firewall challenge, or HTML error document:

  https://hrfh.hrforhealth.com/web-install/manifest.webmanifest
  https://hrfh.hrforhealth.com/web-install/service-worker.js
  https://hrfh.hrforhealth.com/web-install/icons/icon-192.png
  https://hrfh.hrforhealth.com/web-install/icons/icon-512.png


STEP 6 - ADD THE LINK TO THE MARKETING PAGE
--------------------------------------------
Marketing does not need to make the landing page device-aware.

The installer itself handles device/browser behavior.

The existing Marketing landing page can simply use a normal button/link such as:

  Add myHRFH to your device

pointing to:

  https://hrfh.hrforhealth.com/web-install/

No GitHub URL needs to be exposed to end users.


STEP 7 - FINAL PRODUCTION CHECK
-------------------------------
Once the folder is live, perform a brief production-origin check on:

  - Android Chrome
  - Desktop Chrome or Edge
  - iPhone/iPad Safari or Chrome

The detailed expected behavior is documented later in this file.

If those checks pass, Marketing can publish/share the production installer link.


====================================================
WHAT MARKETING IS ACTUALLY INSTALLING
====================================================

Marketing is not installing an application on the web server.

Marketing is hosting a small static website/PWA installer under one dedicated URL path.

There is:

  - no database
  - no PHP requirement
  - no backend service
  - no npm build
  - no Node.js runtime requirement
  - no Salesforce dependency on the Marketing host
  - no APK
  - no mobile app store package
  - no server process to keep running

The package consists only of HTML, CSS, JavaScript, a web manifest, a service worker,
and two PNG launcher icons.

For most hosting environments, deployment is simply "upload this folder to the site".


====================================================
RELEASE AUTHORITY
====================================================

The Marketing package is derived from the physically accepted application source:

  Accepted application source SHA:
  85cf632d7c2b3ecfb0b984e1f3c9097c1003db8d

Release validation includes:

  - 77/77 automated tests passed
  - real Chromium PWA installability passed
  - Desktop Chrome/Edge install -> uninstall -> reinstall behavior passed
  - Android install behavior passed
  - Android duplicate-install prevention passed
  - iPhone/iPad behavior approved and unchanged
  - service-worker cache identity: myhrfh-installer-v12

Marketing should deploy the supplied release artifact rather than rebuilding it from
source.


====================================================
EXACT DEPLOYABLE PACKAGE CONTENTS
====================================================

After extracting hrfh-web-install-marketing.zip, the runtime package must contain exactly:

  web-install/
    index.html
    launch.html
    styles.css
    install.js
    manifest.webmanifest
    service-worker.js
    ios-modal.css
    ios-guidance-v2.css
    ios-guidance-v3.css
    ios-guidance-v2.js
    icons/
      icon-192.png
      icon-512.png

There are 12 runtime files total.

Do not add development files, GitHub files, test files, README files, source maps,
package-manager files, or other engineering assets inside /web-install/.

Do not remove any of the 12 runtime files.


====================================================
REQUIRED PUBLIC LOCATION
====================================================

The production installer must resolve at:

  https://hrfh.hrforhealth.com/web-install/

Important expected URLs include:

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

The web-install route is part of the approved PWA identity and scope. Do not change it
without generating and revalidating a new release package.


====================================================
WORDPRESS / MARKETING SITE GUIDANCE
====================================================

If hrfh.hrforhealth.com is managed through WordPress, the recommended approach is still
to host the package as normal static files.

Do NOT upload the individual runtime files into the WordPress Media Library.

Preferred options are any normal hosting mechanism that creates a real /web-install/
directory, for example:

  - managed host file manager
  - SFTP
  - SSH/SCP
  - cPanel File Manager
  - Plesk File Manager
  - hosting deployment pipeline
  - a static-files deployment feature provided by the host

If WordPress automatically routes unknown paths through index.php, ensure /web-install/
is a real static path that takes precedence over the WordPress fallback route.

The Marketing landing page itself does not need to contain the installer code. It only
needs a link/button to the /web-install/ URL.


====================================================
HTTPS REQUIREMENT
====================================================

The installer must be served over HTTPS.

The approved production URL already uses HTTPS:

  https://hrfh.hrforhealth.com/web-install/

Modern browsers require a secure context for service workers and normal production PWA
behavior.

Do not publish an HTTP-only version.

The TLS certificate must be valid and the page should not show mixed-content warnings.


====================================================
MIME / CONTENT-TYPE REQUIREMENTS
====================================================

Recommended server content types are:

  .html         text/html; charset=utf-8
  .css          text/css; charset=utf-8
  .js           text/javascript; charset=utf-8
                or application/javascript
  .webmanifest  application/manifest+json
  .png          image/png

Most hosts already handle HTML/CSS/JS/PNG correctly.

The file most likely to require an explicit MIME mapping is:

  manifest.webmanifest

It must be served as a web manifest, not as a forced download.


====================================================
SERVICE WORKER REQUIREMENTS
====================================================

The service worker is:

  /web-install/service-worker.js

It must:

  - be served from hrfh.hrforhealth.com
  - return HTTP 200
  - remain at /web-install/service-worker.js
  - not redirect to a login page
  - not redirect to another domain
  - not return a WordPress template
  - not be replaced by a WAF/CDN challenge page

Current service-worker cache identity:

  myhrfh-installer-v12

Recommended cache treatment during initial rollout:

  service-worker.js      no-cache / revalidate
  index.html             no-cache / revalidate preferred
  launch.html            no-cache / revalidate preferred
  manifest.webmanifest   no-cache / revalidate preferred
  CSS/JS/icons           normal caching is acceptable

Avoid permanently caching service-worker.js at a CDN edge.


====================================================
PRODUCTION MANIFEST IDENTITY
====================================================

The Marketing release package is prepared for the production Marketing origin.

The related web-app manifest URL must be:

  https://hrfh.hrforhealth.com/web-install/manifest.webmanifest

The related web-app ID must be:

  https://hrfh.hrforhealth.com/web-install/

The PWA itself intentionally keeps relative values for:

  id: ./
  start_url: ./launch.html
  scope: ./
  display: standalone

Do NOT point start_url or scope directly to https://myhrfh.com.

The installed PWA belongs to the Marketing origin and the launch page forwards the user
to myHRFH. Browsers do not allow a PWA on one origin to claim another origin as its PWA
scope.


====================================================
LAUNCHER ICONS - DO NOT MODIFY
====================================================

The accepted launcher icons are:

  /web-install/icons/icon-192.png
  /web-install/icons/icon-512.png

They are declared as:

  192x192 PNG, purpose: any
  512x512 PNG, purpose: any

Do not:

  - replace them
  - resize them
  - recompress them
  - convert them
  - run them through an image optimizer
  - regenerate them from the visible Marketing logo

A prior visually valid icon replacement caused Chromium to reject the PWA as
non-installable. The supplied icon binaries are the accepted installability baseline.

The visible page logo is separate and currently loads from:

  https://hrforhealth.com/wp-content/uploads/2024/04/Logo-icon-1.png.webp

That image URL must remain reachable to public visitors.


====================================================
CDN / CLOUDFLARE / OPTIMIZATION PLUGIN GUIDANCE
====================================================

If a CDN, Cloudflare, WAF, reverse proxy, WordPress optimization plugin, or security
plugin sits in front of the site, verify that it does NOT:

  - combine JavaScript files
  - rewrite install.js
  - inject async/defer behavior into scripts beyond what is already defined
  - rewrite manifest.webmanifest
  - convert the launcher PNG files
  - redirect service-worker.js
  - return a firewall challenge instead of a runtime asset
  - require authentication for /web-install/
  - cache an obsolete service worker indefinitely

During first production validation, it is safest to exclude /web-install/ from aggressive
HTML/JS/image optimization.

After production behavior is proven, any optimization change should be tested before
being kept.


====================================================
SECURITY HEADERS
====================================================

Recommended headers include:

  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()

Use HSTS according to the existing HR for Health domain policy.

A Content-Security-Policy can be used, but do not apply a generic policy that blocks the
package's intentional inline bootstrap scripts/styles without providing approved hashes
or nonces.

If CSP is already enforced, it must permit:

  - same-origin runtime files
  - the external HR for Health logo image origin
  - the package's required inline bootstrap code through the site's approved CSP method

Do not weaken an existing domain security policy without review.


====================================================
EXPECTED END-USER EXPERIENCE
====================================================

ANDROID CHROME / CHROMIUM
-------------------------
When the web app is not installed and Chrome exposes its native PWA prompt, the page
shows:

  Install HRFH web app

Selecting it opens Chrome's native install UI.

When Android confirms that the app is installed, the page uses the accepted installed
experience:

  Open HRFH web app
  Reinstall

There is intentionally no Restore button and no Uninstall button.

If Chrome does not provide a live native prompt, the page shows browser-menu Install app
guidance instead of presenting a dead custom button.


DESKTOP CHROME / EDGE
---------------------
When Chromium determines that the page is installable, the page shows:

  Install HRFH web app

The button opens the real browser PWA install dialog.

The install -> uninstall -> reinstall cycle has been physically validated.

After uninstall, returning to the installer should allow a new browser installability
signal to restore the Install action rather than leaving the page permanently in a stale
"previously installed" state.


IPHONE / IPAD - SAFARI AND CHROME
---------------------------------
iOS does not expose the same programmable PWA install prompt as Chromium.

The installer displays the approved device/browser-aware instructions.

Typical sequence:

  1. Open the installer.
  2. Tap Share. If Safari does not show Share directly, use More and then Share.
  3. Choose Add to Home Screen.
  4. Choose Open as Web App when Apple shows the option.
  5. Tap Add.

The page already contains the iOS visual guidance. Marketing does not need to create a
separate iPhone installation page.


MACOS
-----
Chrome/Edge use normal Chromium PWA installation when available.

Safari uses:

  File -> Add to Dock


====================================================
PRODUCTION VALIDATION CHECKLIST
====================================================

After upload and before broad publication, verify the following.

BASIC URL CHECKS
----------------
[ ] https://hrfh.hrforhealth.com/web-install/ loads the installer
[ ] manifest.webmanifest returns the manifest, not an error page
[ ] service-worker.js returns JavaScript with HTTP 200
[ ] icon-192.png loads
[ ] icon-512.png loads
[ ] the page uses HTTPS without certificate warnings
[ ] the HR for Health logo is visible
[ ] no GitHub URL is visible to end users
[ ] no Restore button is visible
[ ] no Uninstall button is visible

ANDROID CHECK
-------------
[ ] with app uninstalled, Install appears when Chrome exposes the native prompt
[ ] Install opens the real Chrome install dialog
[ ] after installation, installed state is recognized
[ ] installed state provides Open + Reinstall only
[ ] refresh does not promote an unnecessary duplicate install when installed evidence is available

DESKTOP CHECK
-------------
[ ] with app uninstalled, Install appears in Chrome/Edge when browser prompt is available
[ ] Install opens the native browser install dialog
[ ] after installation, installed state is recognized
[ ] after uninstalling the PWA, returning to the page restores the Install option

IOS CHECK
---------
[ ] iPhone/iPad opens the approved visual Add to Home Screen guidance
[ ] Share / More guidance is readable and positioned correctly
[ ] Add to Home Screen flow completes normally

INSTALLED-LAUNCH CHECK
----------------------
[ ] opening the installed myHRFH web app forwards to https://myhrfh.com


====================================================
OPTIONAL TECHNICAL CHROME / EDGE CHECK
====================================================

If someone on the Marketing/IT side is comfortable with browser Developer Tools:

  1. Open the production installer in Chrome/Edge.
  2. Open Developer Tools.
  3. Open Application.
  4. Confirm the Manifest loads.
  5. Confirm the 192x192 and 512x512 icons load.
  6. Confirm the service worker is registered for /web-install/.
  7. Confirm the manifest start URL resolves to /web-install/launch.html.

This technical check is optional for Marketing but useful if installation behavior is
unexpected.


====================================================
COMMON PROBLEMS AND WHAT THEY USUALLY MEAN
====================================================

INSTALL BUTTON DOES NOT APPEAR ON ANDROID/DESKTOP
-------------------------------------------------
First verify:

  - HTTPS is valid
  - manifest.webmanifest returns the actual manifest
  - service-worker.js returns HTTP 200
  - both PNG icons return the actual PNG files
  - CDN/WAF is not returning HTML challenge pages
  - launcher icons were not modified
  - the browser is not already treating the app as installed

Do not create a fake Install button. The custom Install action intentionally appears only
when the browser provides a real native install prompt.


SERVICE WORKER WILL NOT REGISTER
--------------------------------
Check that:

  - service-worker.js is served from /web-install/
  - it is same-origin
  - it is not redirected
  - HTTPS is valid
  - JavaScript content type is valid
  - a security plugin is not rewriting or blocking the file


MANIFEST DOWNLOADS INSTEAD OF OPENING
--------------------------------------
Configure .webmanifest as:

  application/manifest+json

and do not force Content-Disposition: attachment.


ICONS ARE MISSING OR INSTALLABILITY FAILS
-----------------------------------------
Confirm that:

  /web-install/icons/icon-192.png
  /web-install/icons/icon-512.png

exist exactly as supplied.

Do not replace them with the external WebP logo.


PAGE LOADS A WORDPRESS 404 OR TEMPLATE
--------------------------------------
The /web-install/ path is not being served as a real static directory.

Configure the host so the static folder is served before the WordPress fallback route.


PAGE WORKS BUT OLD BEHAVIOR REMAINS AFTER AN UPDATE
---------------------------------------------------
A previous service worker/CDN/browser cache may still be active.

Verify the production service-worker.js content and cache/CDN behavior. The accepted
release uses:

  myhrfh-installer-v12

Avoid permanently caching service-worker.js.


====================================================
UPDATES AND FUTURE RELEASES
====================================================

When Engineering supplies a future package:

  1. Keep the previous working handoff as rollback material.
  2. Deploy the newly supplied web-install folder as a complete set.
  3. Do not mix files from two release packages.
  4. Do not preserve an older service-worker.js while replacing other files.
  5. Clear/purge CDN cache for /web-install/ if required by the hosting platform.
  6. Re-run the production validation checklist.

Do not manually increment the service-worker cache version. Engineering will do that when
an implementation change requires it.


====================================================
ROLLBACK
====================================================

If a new future release introduces a production problem:

  1. Remove/replace the newly uploaded /web-install/ files.
  2. Restore the complete previously accepted web-install package.
  3. Purge relevant CDN/cache entries if necessary.
  4. Re-test the production URL.

Do not perform a partial rollback using a mixture of files from different releases.


====================================================
CHECKSUM VERIFICATION
====================================================

The handoff includes:

  SHA256SUMS.txt

It contains the SHA-256 checksum for the deployable:

  hrfh-web-install-marketing.zip

If Marketing or IT uses a checksum tool, compare the deployable ZIP against the supplied
SHA256SUMS.txt before upload.

The checksum is generated by the release workflow. Use the value in the supplied file
rather than a value copied from an older handoff message.


====================================================
FILES THAT SHOULD NOT BE PUBLICLY DEPLOYED
====================================================

Do not place these handoff files inside the public /web-install/ folder:

  MARKETING-README.txt
  SHA256SUMS.txt
  the outer GitHub artifact wrapper ZIP

Only the contents of the inner hrfh-web-install-marketing.zip belong on the public host.


====================================================
FINAL MARKETING SUMMARY
====================================================

For Marketing, the entire deployment can be treated as this simple process:

  1. Download the handoff bundle.
  2. Extract hrfh-web-install-marketing.zip.
  3. Upload the complete web-install folder unchanged.
  4. Confirm https://hrfh.hrforhealth.com/web-install/ works.
  5. Add a normal link/button on the Marketing page pointing to that URL.
  6. Perform the short Android/Desktop/iOS production check.

No build process, GitHub work, APK deployment, app-store submission, Salesforce work,
or device-detection logic is required from Marketing.

END OF GUIDE
