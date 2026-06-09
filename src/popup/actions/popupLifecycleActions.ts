import { sendRuntimeMessage } from "@/shared/messages";
import { loadFixtures } from "../services/fixtureFlow";
import { usePopupFixtureStore } from "../stores/popupFixtureStore";
import { usePopupLiveDataStore } from "../stores/popupLiveDataStore";
import { usePopupSettingsStore } from "../stores/popupSettingsStore";
import { usePopupUiStore } from "../stores/popupUiStore";
import { refreshPageOverlayState } from "./popupPageOverlayActions";

export async function loadPopupState(): Promise<void> {
  usePopupFixtureStore.getState().setLoadingText("Loading");
  usePopupUiStore.getState().clearError();

  try {
    const settingsResponse = await sendRuntimeMessage({ type: "GET_SETTINGS" });
    if (settingsResponse.ok && "settings" in settingsResponse) {
      usePopupSettingsStore.getState().setSettings(settingsResponse.settings);
    }

    const dataResponse = await sendRuntimeMessage({ type: "GET_LATEST_MATCH_DATA" });
    if (dataResponse.ok && "data" in dataResponse) {
      usePopupLiveDataStore.getState().setData(dataResponse.data);
    }

    const leaguesResponse = await sendRuntimeMessage({ type: "GET_AVAILABLE_LEAGUES" });
    if (leaguesResponse.ok && "leagues" in leaguesResponse) {
      usePopupFixtureStore.getState().setLeagues(leaguesResponse.leagues);
    } else if (!leaguesResponse.ok) {
      usePopupUiStore.getState().setError(leaguesResponse.error);
    }

    if (settingsResponse.ok && "settings" in settingsResponse && settingsResponse.settings.selectedLeagueUid) {
      const fixturesResponse = await loadFixtures(settingsResponse.settings);
      if (fixturesResponse.ok) {
        usePopupFixtureStore.getState().setFixtures(fixturesResponse.fixtures);
      } else {
        usePopupUiStore.getState().setError(fixturesResponse.error);
      }
    }

    await refreshPageOverlayState();
  } finally {
    usePopupFixtureStore.getState().setLoadingText(null);
  }
}
