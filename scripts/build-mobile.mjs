/**
 * Production web build for Capacitor (Android / iOS).
 * Clears GitHub Pages basePath and disables the PWA service worker so the
 * native WebView loads bundled assets from the app root.
 */
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");

delete process.env.NEXT_PUBLIC_BASE_PATH;
process.env.CAPACITOR_BUILD = "1";

const publicFiles = await readdir(publicDir);
for (const name of publicFiles) {
  if (
    name === "sw.js" ||
    name === "sw.js.map" ||
    name.startsWith("workbox-") ||
    name.startsWith("swe-worker-")
  ) {
    await rm(path.join(publicDir, name), { force: true });
  }
}

const child = spawn(process.execPath, [nextBin, "build", "--webpack"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
