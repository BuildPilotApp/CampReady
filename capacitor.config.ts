import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.campready.mobile",
  appName: "CampReady",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;
