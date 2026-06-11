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
};

export default config;
