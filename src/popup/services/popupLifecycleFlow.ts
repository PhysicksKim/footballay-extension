import { sendRuntimeMessage } from "@/shared/messages";
import type { PopupStoreGet, PopupStoreSet } from "../store";
import { loadFixtures } from "./fixtureFlow";

// Initial popup load gathers persisted settings, latest match data, and league metadata.
// Keep this orchestration outside the Zustand store so the store stays focused on actions.
export async function loadPopupStateFlow(set: PopupStoreSet, get: PopupStoreGet): Promise<void> {
  set({ loadingText: "Loading", error: null });

  try {
    const settingsResponse = await sendRuntimeMessage({ type: "GET_SETTINGS" });
    if (settingsResponse.ok && "settings" in settingsResponse) {
      set({ settings: settingsResponse.settings });
    }

    const dataResponse = await sendRuntimeMessage({ type: "GET_LATEST_MATCH_DATA" });
    if (dataResponse.ok && "data" in dataResponse) {
      set({ data: dataResponse.data });
    }

    const leaguesResponse = await sendRuntimeMessage({ type: "GET_AVAILABLE_LEAGUES" });
    if (leaguesResponse.ok && "leagues" in leaguesResponse) {
      set({ leagues: leaguesResponse.leagues });
    } else if (!leaguesResponse.ok) {
      set({ error: leaguesResponse.error });
    }

    if (settingsResponse.ok && "settings" in settingsResponse && settingsResponse.settings.selectedLeagueUid) {
      await loadFixtures(settingsResponse.settings, set);
    }

    await get().refreshPageOverlayState();
  } finally {
    set({ loadingText: null });
  }
}
