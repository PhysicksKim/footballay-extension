import type { RuntimeMessage, RuntimeResponse, RuntimeSettingsPatch } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import { getPageOverlayState } from "@/content/selectors/contentOverlaySelectors";
import { useContentLiveDataStore } from "@/content/stores/contentLiveDataStore";
import { useContentPageOverlayStore } from "@/content/stores/contentPageOverlayStore";
import { useContentSettingsStore } from "@/content/stores/contentSettingsStore";

export async function loadInitialContentOverlayState(): Promise<void> {
  const settingsResponse = await sendRuntimeMessage({ type: "GET_SETTINGS" });
  if (settingsResponse.ok && "settings" in settingsResponse) {
    useContentSettingsStore.getState().setSettings(settingsResponse.settings);
  }

  await refreshLatestMatchData();
}

export async function refreshLatestMatchData(): Promise<void> {
  const dataResponse = await sendRuntimeMessage({ type: "GET_LATEST_MATCH_DATA" });
  if (dataResponse.ok && "data" in dataResponse) {
    useContentLiveDataStore.getState().setData(dataResponse.data);
  }
}

export async function updateContentOverlaySettings(patch: RuntimeSettingsPatch): Promise<void> {
  const response = await sendRuntimeMessage({ type: "UPDATE_SETTINGS", payload: patch });
  if (response.ok && "settings" in response) {
    useContentSettingsStore.getState().setSettings(response.settings);
  }
}

export function handleContentRuntimeMessage(message: RuntimeMessage): RuntimeResponse | undefined {
  if (message.type === "SETTINGS_UPDATED") {
    useContentSettingsStore.getState().setSettings(message.payload);
    return undefined;
  }

  if (message.type === "LIVE_MATCH_DATA_UPDATED") {
    useContentLiveDataStore.getState().setData(message.payload);
    return undefined;
  }

  if (message.type === "GET_PAGE_OVERLAY_STATE") {
    return { ok: true, pageOverlayState: getCurrentPageOverlayState() };
  }

  if (message.type === "SHOW_PAGE_OVERLAY") {
    useContentPageOverlayStore.getState().setManualVisible(true);
    return {
      ok: true,
      pageOverlayState: getCurrentPageOverlayState()
    };
  }

  if (message.type === "HIDE_PAGE_OVERLAY") {
    useContentPageOverlayStore.getState().setManualVisible(false);
    return {
      ok: true,
      pageOverlayState: getCurrentPageOverlayState()
    };
  }

  return undefined;
}

function getCurrentPageOverlayState(): ReturnType<typeof getPageOverlayState> {
  return getPageOverlayState(
    useContentSettingsStore.getState().settings,
    useContentPageOverlayStore.getState()
  );
}
