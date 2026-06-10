import { storage } from "wxt/utils/storage";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { normalizeExtensionSettings } from "@/shared/overlay/settings";

const SETTINGS_KEY = "local:footballay-settings";

export async function readSettings(): Promise<ExtensionSettings> {
  const storedSettings = await storage.getItem<Partial<ExtensionSettings>>(SETTINGS_KEY);
  return normalizeExtensionSettings(storedSettings);
}

export async function writeSettings(
  patch: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const nextSettings = normalizeExtensionSettings({
    ...(await readSettings()),
    ...patch
  });

  await storage.setItem(SETTINGS_KEY, nextSettings);
  return nextSettings;
}
