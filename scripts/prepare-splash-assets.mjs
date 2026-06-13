/**
 * Builds high-resolution splash sources before @capacitor/assets runs.
 * - assets/splash.png: 2732×2732 full splash (required minimum for cap assets)
 * - android drawable-*dpi/splash_icon.png: 288dp icons for Android 12+ system splash
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const iconPath = path.join(root, "assets", "icon-only.png");
const splashPath = path.join(root, "assets", "splash.png");
const androidRes = path.join(root, "android", "app", "src", "main", "res");
const background = { r: 9, g: 9, b: 11, alpha: 1 };

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
