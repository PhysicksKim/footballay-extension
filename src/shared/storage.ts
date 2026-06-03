import { storage } from "wxt/utils/storage";
import type { ExtensionSettings } from "@/features/overlay/overlayTypes";
import { defaultSettings } from "./constants";

const SETTINGS_KEY = "local:footballay-settings";

export async function readSettings(): Promise<ExtensionSettings> {
  const storedSettings = await storage.getItem<Partial<ExtensionSettings>>(SETTINGS_KEY);
  return {
    ...defaultSettings,
    ...storedSettings
  };
}

export async function writeSettings(
  patch: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const nextSettings = {
    ...(await readSettings()),
    ...patch
  };

  await storage.setItem(SETTINGS_KEY, nextSettings);
  return nextSettings;
}
