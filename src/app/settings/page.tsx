"use client";

import { SettingsPage } from "@/components/settings/settings-page";
import { AppRuntimeProvider } from "@/components/providers/app-runtime-provider";
import { CampReadyProvider } from "@/components/providers/camp-ready-provider";
import { ProProvider } from "@/components/providers/pro-provider";
import { AppToastProvider } from "@/components/ui/app-toast-provider";

export default function Settings() {
  return (
    <AppRuntimeProvider>
      <AppToastProvider>
        <ProProvider>
          <CampReadyProvider>
            <SettingsPage />
          </CampReadyProvider>
        </ProProvider>
      </AppToastProvider>
    </AppRuntimeProvider>
  );
}
