import type { RuntimeMessage } from "@/shared/messages";
import { usePopupLiveDataStore } from "../stores/popupLiveDataStore";
import { usePopupSettingsStore } from "../stores/popupSettingsStore";

export function handlePopupRuntimeMessage(message: RuntimeMessage): void {
  if (message.type === "SETTINGS_UPDATED") {
    usePopupSettingsStore.getState().setSettings(message.payload);
  }

  if (message.type === "LIVE_MATCH_DATA_UPDATED") {
    usePopupLiveDataStore.getState().setData(message.payload);
  }
}
