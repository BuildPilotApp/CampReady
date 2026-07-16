import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.buildpilotapps.campready",
  appName: "CampSync",
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
    // Intentionally no server.url because assets must load from bundled webDir (out/).
  },
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      style: "DARK",
    },
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#09090b",
      androidSplashResourceName: "splash",
      androidScaleType: "FIT_CENTER",
      showSpinner: false,
      useDialog: false,
    },
  },
};

export default config;
