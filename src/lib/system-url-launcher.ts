import { Capacitor, registerPlugin } from "@capacitor/core";

export interface SystemUrlLauncherPlugin {
  openUrl(options: { url: string }): Promise<void>;
}

const SystemUrlLauncher = registerPlugin<SystemUrlLauncherPlugin>("SystemUrlLauncher", {
  web: {
    openUrl: async ({ url }: { url: string }) => {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        throw new Error("Could not open link");
      }
    },
  },
});

/** Routes a URL through the OS handler so installed apps (e.g. Amazon) can intercept it. */
export async function launchSystemUrl(url: string): Promise<void> {
  await SystemUrlLauncher.openUrl({ url });
}

export function canLaunchSystemUrl(): boolean {
  return typeof window !== "undefined";
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
