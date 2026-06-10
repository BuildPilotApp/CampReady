import type { Metadata, Viewport } from "next";
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1b4332" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1a12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full text-foreground antialiased">
        <div className="app-viewport-canvas">
          <div className="app-viewport-frame">{children}</div>
        </div>
      </body>
    </html>
  );
}
