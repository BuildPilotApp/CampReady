import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  basePath,
  trailingSlash: true,
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWAInit = require("@ducanh2912/next-pwa").default as (
  config: Record<string, unknown>,
) => (nextConfig: NextConfig) => NextConfig;

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  reloadOnOnline: false,
  scope: basePath || "/",
  fallbacks: {
    document: basePath ? `${basePath}/` : "/",
  },
  workboxOptions: {
    navigateFallback: basePath ? `${basePath}/index.html` : "/index.html",
    navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
    runtimeCaching: [],
  },
});

export default withPWA(nextConfig);
