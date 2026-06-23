import { SystemThemeProvider } from "@/components/providers/system-theme-provider";
import { THEME_INIT_SCRIPT } from "@/lib/theme/system-theme";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampReady",
  description:
    "Offline-first camping checklist built for one-handed use in the field.",
  applicationName: "CampReady",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CampReady",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1a12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <Script
          id="app-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <SystemThemeProvider>
          <div className="app-viewport-canvas">
            <div className="app-viewport-frame">{children}</div>
          </div>
        </SystemThemeProvider>
      </body>
    </html>
  );
}
