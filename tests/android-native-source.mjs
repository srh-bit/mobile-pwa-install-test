import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');
const readOptional = async (path) => { try { return await read(path); } catch { return ''; } };

test('managed Android build uses pinned current stable public tooling', async () => {
  const root = await readOptional('android/build.gradle');
  const app = await readOptional('android/app/build.gradle');
  assert.match(root, /com\.android\.application['"]?\s+version\s+['"]9\.3\.1['"]/i);
  assert.match(app, /compileSdk\s+36/);
  assert.match(app, /targetSdk\s+36/);
  assert.match(app, /minSdk\s+26/);
  assert.match(app, /androidx\.browser:browser:1\.10\.0/);
  assert.match(app, /com\.google\.code\.gson:gson:2\.14\.0/);
  assert.match(app, /junit:junit:4\.13\.2/);
  assert.match(app, /JavaVersion\.VERSION_17/);
});

test('managed Android build keeps production identity and origin as explicit release inputs', async () => {
  const app = await readOptional('android/app/build.gradle');
  assert.match(app, /HRFH_ANDROID_APPLICATION_ID/);
  assert.match(app, /com\.hrforhealth\.myhrfh\.staging/);
  assert.match(app, /HRFH_TWA_ORIGIN/);
  assert.match(app, /https:\/\/myhrfh\.com/);
  assert.match(app, /buildConfigField\s+['"]String['"],\s*['"]HRFH_TWA_ORIGIN['"]/);
});

test('managed Android rejects any runtime build override away from the production origin', async () => {
  const app = await readOptional('android/app/build.gradle');
  assert.match(app, /if\s*\(\s*trustedOrigin\s*!=\s*['"]https:\/\/myhrfh\.com['"]\s*\)/i);
  assert.match(app, /GradleException[^\n]*HRFH_TWA_ORIGIN/i);
});

test('managed Android manifest is fixed-origin and least privilege', async () => {
  const manifest = await readOptional('android/app/src/main/AndroidManifest.xml');
  assert.match(manifest, /android\.permission\.INTERNET/);
  assert.match(manifest, /ManagedTwaActivity/);
  assert.match(manifest, /android:exported=["']true["']/);
  assert.match(manifest, /android:autoVerify=["']true["']/);
  assert.match(manifest, /android:scheme=["']https["']/);
  assert.match(manifest, /android:host=["']myhrfh\.com["']/);
  assert.match(manifest, /PostMessageService/);
  assert.doesNotMatch(manifest, /QUERY_ALL_PACKAGES|REQUEST_INSTALL_PACKAGES|DELETE_PACKAGES|INSTALL_SHORTCUT/i);
});

test('app-side asset statement declares web ownership while website DAL owns use-as-origin trust', async () => {
  const strings = await readOptional('android/app/src/main/res/values/strings.xml');
  const websiteTemplate = await readOptional('android/assetlinks.production.template.json');
  assert.match(strings, /delegate_permission\/common\.handle_all_urls/);
  assert.doesNotMatch(strings, /delegate_permission\/common\.use_as_origin/);
  assert.match(websiteTemplate, /delegate_permission\/common\.use_as_origin/);
});

test('managed Android CI pins Java and Gradle and compiles native code', async () => {
  const workflow = await read('.github/workflows/validate.yml');
  assert.match(workflow, /actions\/setup-java@/);
  assert.match(workflow, /java-version:\s*['"]?17['"]?/);
  assert.match(workflow, /gradle\/actions\/setup-gradle@/);
  assert.match(workflow, /gradle-version:\s*['"]?9\.5\.0['"]?/);
  assert.match(workflow, /platforms;android-36/);
  assert.match(workflow, /build-tools;36\.0\.0/);
  assert.match(workflow, /gradle\s+-p\s+android\s+testDebugUnitTest\s+lintDebug\s+assembleDebug/);
});

test('Android CI retries the unchanged native gate only for Maven Central rate limiting', async () => {
  const workflow = await read('.github/workflows/validate.yml');
  const nativeGate = 'gradle -p android testDebugUnitTest lintDebug assembleDebug';
  assert.equal((workflow.match(new RegExp(nativeGate, 'g')) ?? []).length, 2);
  assert.match(workflow, /Too Many Requests/);
  assert.match(workflow, /repo\\\.maven\\\.apache\\\.org\.\*429/);
  assert.match(workflow, /retrying once with the same Android gate/i);
  assert.match(workflow, /if\s*!\s*grep[\s\S]*exit 1/);
});

test('native Android code never uses hidden launcher or package-management APIs', async () => {
  const paths = [
    'android/app/src/main/java/com/hrforhealth/myhrfh/ManagedTwaActivity.java',
    'android/app/src/main/java/com/hrforhealth/myhrfh/NativeManagementBridge.java',
    'android/app/src/main/java/com/hrforhealth/myhrfh/ShortcutController.java',
    'android/app/src/main/java/com/hrforhealth/myhrfh/UninstallController.java'
  ];
  const source = (await Promise.all(paths.map(readOptional))).join('\n');
  assert.doesNotMatch(source, /INSTALL_SHORTCUT|DELETE_PACKAGES|Runtime\.getRuntime|ProcessBuilder|Class\.forName|setAccessible\(|exec\s*\(/i);
  assert.doesNotMatch(source, /content:\/\/.*launcher|launcher\.settings|LauncherProvider/i);
  assert.match(source, /requestPinShortcut/);
  assert.match(source, /Intent\.ACTION_DELETE/);
  assert.match(source, /RELATION_USE_AS_ORIGIN/);
  assert.match(source, /requestPostMessageChannel/);
});

test('same-origin relationship revocation disables the native channel immediately', async () => {
  const bridge = await readOptional('android/app/src/main/java/com/hrforhealth/myhrfh/NativeManagementBridge.java');
  assert.match(bridge, /relationshipValidated\s*=\s*result/);
  assert.match(bridge, /if\s*\(\s*!result\s*\)\s*\{[\s\S]*?channelReady\s*=\s*false;[\s\S]*?channelRequested\s*=\s*false;/i);
});

test('TWA launch failure falls back to a normal Custom Tab instead of crashing', async () => {
  const activity = await readOptional('android/app/src/main/java/com/hrforhealth/myhrfh/ManagedTwaActivity.java');
  const trusted = activity.match(/private void launchTrusted\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
  assert.match(trusted, /catch\s*\(RuntimeException\s+exception\)/);
  assert.match(trusted, /launchFallback\(\)/);
  assert.match(activity, /buildCustomTabsIntent\(\)/);
});

test('production Digital Asset Links template is explicit and non-deployable until release inputs exist', async () => {
  const template = await readOptional('android/assetlinks.production.template.json');
  const operator = await readOptional('android/README.md');
  assert.match(template, /delegate_permission\/common\.handle_all_urls/);
  assert.match(template, /delegate_permission\/common\.use_as_origin/);
  assert.match(template, /__HRFH_ANDROID_APPLICATION_ID__/);
  assert.match(template, /__HRFH_SIGNING_CERT_SHA256__/);
  assert.match(operator, /placeholders?[^\n]*(?:not|never)[^\n]*(?:deploy|production trust)/i);
  assert.match(operator, /GitHub Pages[^\n]*(?:cannot|does not)[^\n]*(?:Digital Asset Links|origin-root|\.well-known)/i);
});
