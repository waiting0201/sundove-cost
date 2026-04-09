/**
 * Download prebuilt better-sqlite3 native module for the target platform.
 * Called by electron-builder via afterPack hook.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// electron-builder Arch enum: 0=ia32, 1=x64, 2=armv7l, 3=arm64, 4=universal
const ARCH_MAP = { 0: 'ia32', 1: 'x64', 2: 'armv7l', 3: 'arm64', 4: 'universal' };

async function afterPack(context) {
  const platform = context.electronPlatformName;
  const arch = ARCH_MAP[context.arch] || 'x64';
  const electronVersion = context.packager.config.electronVersion;
  const appOutDir = context.appOutDir;

  console.log(`\n[rebuild-native] platform=${platform} arch=${arch} (raw=${context.arch}) electron=${electronVersion}`);
  console.log(`[rebuild-native] appOutDir=${appOutDir}`);

  // On macOS the structure is .app/Contents/Resources/, on win/linux it's resources/
  const resourcesDir = platform === 'darwin'
    ? path.join(appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Resources')
    : path.join(appOutDir, 'resources');

  const unpackedDir = path.join(resourcesDir, 'app.asar.unpacked', 'node_modules', 'better-sqlite3');

  console.log(`[rebuild-native] Looking for unpacked dir: ${unpackedDir}`);

  if (!fs.existsSync(unpackedDir)) {
    console.log('[rebuild-native] better-sqlite3 unpacked dir not found, skipping');
    return;
  }

  console.log(`[rebuild-native] Downloading prebuilt for ${platform}-${arch}...`);

  try {
    execSync(
      `npx prebuild-install --runtime electron --target ${electronVersion} --arch ${arch} --platform ${platform}`,
      {
        cwd: unpackedDir,
        stdio: 'inherit',
        timeout: 60000,
      }
    );

    const nodePath = path.join(unpackedDir, 'build', 'Release', 'better_sqlite3.node');
    if (fs.existsSync(nodePath)) {
      const info = execSync(`file "${nodePath}"`).toString().trim();
      console.log(`[rebuild-native] OK: ${info}`);
    } else {
      console.error('[rebuild-native] .node file not found after prebuild-install!');
    }
  } catch (err) {
    console.error('[rebuild-native] Failed to download prebuilt:', err.message);
    console.error('[rebuild-native] The app may not start on the target platform!');
  }
}

module.exports = afterPack;
