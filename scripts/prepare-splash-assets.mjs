/**
 * Builds high-resolution splash sources before @capacitor/assets runs.
 * - assets/splash.png: 2732×2732 full splash (required minimum for cap assets)
 * - android drawable-*dpi/splash_icon.png: 288dp icons for Android 12+ system splash
 */
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const iconPath = path.join(root, "icons", "app_icon2.png");
const assetsDir = path.join(root, "assets");
const splashPath = path.join(assetsDir, "splash.png");
const androidRes = path.join(root, "android", "app", "src", "main", "res");
const background = { r: 9, g: 9, b: 11, alpha: 1 };

/** Keep Capacitor launcher sources in sync with the canonical icon. */
await mkdir(assetsDir, { recursive: true });
await copyFile(iconPath, path.join(assetsDir, "icon-only.png"));
await copyFile(iconPath, path.join(assetsDir, "icon1024.png"));
console.log("Synced assets/icon-only.png and assets/icon1024.png from icons/app_icon2.png");

const SPLASH_SIZE = 2732;
const LOGO_SCALE = 0.38;
const ANDROID_SPLASH_ICON_DP = 288;
const DENSITIES = {
  "drawable-ldpi": 0.75,
  "drawable-mdpi": 1,
  "drawable-hdpi": 1.5,
  "drawable-xhdpi": 2,
  "drawable-xxhdpi": 3,
  "drawable-xxxhdpi": 4,
};

async function buildSplashCanvas(size, logoScale) {
  const logoSize = Math.round(size * logoScale);
  const logo = await sharp(iconPath)
    .resize(logoSize, logoSize, { fit: "contain", background })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function buildSplashIcon(size) {
  const logoSize = Math.round(size * 0.72);
  const logo = await sharp(iconPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

const splash = await buildSplashCanvas(SPLASH_SIZE, LOGO_SCALE);
await writeFile(splashPath, splash);
console.log(`Wrote ${splashPath} (${SPLASH_SIZE}x${SPLASH_SIZE})`);

for (const [folder, scale] of Object.entries(DENSITIES)) {
  const size = Math.round(ANDROID_SPLASH_ICON_DP * scale);
  const outDir = path.join(androidRes, folder);
  await mkdir(outDir, { recursive: true });
  const icon = await buildSplashIcon(size);
  const outPath = path.join(outDir, "splash_icon.png");
  await writeFile(outPath, icon);
  console.log(`Wrote ${outPath} (${size}x${size})`);
}

/** Adaptive launcher foreground (API 26+). @capacitor/assets does not refresh these. */
const ADAPTIVE_FOREGROUND_DP = 108;
const FOREGROUND_DENSITIES = {
  "mipmap-ldpi": 0.75,
  "mipmap-mdpi": 1,
  "mipmap-hdpi": 1.5,
  "mipmap-xhdpi": 2,
  "mipmap-xxhdpi": 3,
  "mipmap-xxxhdpi": 4,
};

for (const [folder, scale] of Object.entries(FOREGROUND_DENSITIES)) {
  const size = Math.round(ADAPTIVE_FOREGROUND_DP * scale);
  const outDir = path.join(androidRes, folder);
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "ic_launcher_foreground.png");
  await sharp(iconPath).resize(size, size).png().toFile(outPath);
  console.log(`Wrote ${outPath} (${size}x${size})`);
}
