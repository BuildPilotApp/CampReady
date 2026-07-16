import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "icons", "app_icon2.png");

const webpSizes = [48, 72, 96, 128, 192, 256, 512];
const pngSizes = [192, 512];

for (const size of webpSizes) {
  const out = path.join(root, "icons", `icon-${size}.webp`);
  await sharp(src).resize(size, size).webp({ quality: 90 }).toFile(out);
  console.log(`Wrote ${out}`);
}

const publicIcons = path.join(root, "public", "icons");
await mkdir(publicIcons, { recursive: true });

for (const size of pngSizes) {
  const out = path.join(publicIcons, `icon-${size}.png`);
  await sharp(src).resize(size, size).png().toFile(out);
  console.log(`Wrote ${out}`);
}
