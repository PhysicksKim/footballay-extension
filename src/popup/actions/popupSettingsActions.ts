import type { RuntimeSettingsPatch } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { usePopupSettingsStore } from "../stores/popupSettingsStore";
import { usePopupUiStore } from "../stores/popupUiStore";

export async function updatePopupSettings(
  patch: RuntimeSettingsPatch
): Promise<ExtensionSettings | null> {
  usePopupUiStore.getState().clearError();

  const response = await sendRuntimeMessage({ type: "UPDATE_SETTINGS", payload: patch });
  if (response.ok && "settings" in response) {
    usePopupSettingsStore.getState().setSettings(response.settings);
    return response.settings;
  }

  if (!response.ok) {
    usePopupUiStore.getState().setError(response.error);
  }

  return null;
}
