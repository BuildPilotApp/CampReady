import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.campready.mobile",
  appName: "CampReady",
  webDir: "out",
  backgroundColor: "#09090b",
  android: {
    backgroundColor: "#09090b",
  },
  ios: {
    backgroundColor: "#09090b",
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#09090b",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
      showSpinner: false,
      useDialog: false,
    },
  },
};

export default config;
