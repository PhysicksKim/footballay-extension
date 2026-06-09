import type { FixtureLookupMode } from "@/domain/live-match/types";
import { sendRuntimeMessage } from "@/shared/messages";
import type { RuntimeSettingsPatch } from "@/shared/messages";
import {
  getFixtureNavigationPatch,
  getQueryDate,
  getResolvedFixtureDatePatch,
  loadFixtures,
  resolveFixtureQuerySettingsPatch
} from "../services/fixtureFlow";
import { getBrowserTimezone } from "../services/runtimeClient";
import { usePopupFixtureStore } from "../stores/popupFixtureStore";
import { usePopupLiveDataStore } from "../stores/popupLiveDataStore";
import { usePopupSettingsStore } from "../stores/popupSettingsStore";
import { usePopupUiStore } from "../stores/popupUiStore";
import type { FixtureDateDirection, FixtureQueryPatch } from "../types";
import { getFixtureDate, getTodayDateInputValue } from "../utils/date";
import { updatePopupSettings } from "./popupSettingsActions";

const clearSelectedFixturePatch: RuntimeSettingsPatch = {
  selectedFixtureDate: null,
  selectedFixtureUid: null
};

const clearLeagueSelectionPatch: RuntimeSettingsPatch = {
  selectedFixtureDate: null,
  selectedFixtureUid: null,
  selectedLeagueUid: null
};

export async function selectLeague(leagueUid: string): Promise<void> {
  const fixtureStore = usePopupFixtureStore.getState();
  fixtureStore.setLoadingText("Loading fixtures");
  usePopupUiStore.getState().clearError();

  if (!leagueUid) {
    fixtureStore.clearFixtures();
    await updatePopupSettings(clearLeagueSelectionPatch);
    usePopupFixtureStore.getState().setLoadingText(null);
    return;
  }

  try {
    const initialFixtureDate = getTodayDateInputValue();
    const initialLookupMode: FixtureLookupMode = "nearest";
    const response = await sendRuntimeMessage({
      type: "SELECT_LEAGUE",
      payload: {
        leagueUid,
        date: initialFixtureDate,
        mode: initialLookupMode,
        timezone: getBrowserTimezone()
      }
    });

    if (response.ok && "settings" in response && "fixtures" in response) {
      usePopupSettingsStore.getState().setSettings(response.settings);
      usePopupFixtureStore.getState().setFixtures(response.fixtures);
      usePopupLiveDataStore.getState().clearData();

      const resolvedPatch = getResolvedFixtureDatePatch(response.settings, response.fixtures);
      if (resolvedPatch) {
        await updatePopupSettings(resolvedPatch);
      }
    } else if (!response.ok) {
      usePopupUiStore.getState().setError(response.error);
    }
  } finally {
    usePopupFixtureStore.getState().setLoadingText(null);
  }
}

export async function navigateFixtureDate(direction: FixtureDateDirection): Promise<void> {
  await updateFixtureQuery(getFixtureNavigationPatch(usePopupSettingsStore.getState().settings, direction));
}

export async function selectFixture(fixtureUid: string): Promise<void> {
  usePopupUiStore.getState().clearError();

  const { settings } = usePopupSettingsStore.getState();
  if (fixtureUid === settings.selectedFixtureUid || !fixtureUid) {
    await updatePopupSettings(clearSelectedFixturePatch);
    usePopupLiveDataStore.getState().clearData();
    return;
  }

  const selectedFixture = usePopupFixtureStore
    .getState()
    .fixtures.find((fixture) => fixture.uid === fixtureUid);
  const selectedFixtureDate = selectedFixture
    ? getFixtureDate(selectedFixture) ?? getQueryDate(settings)
    : undefined;
  const response = await sendRuntimeMessage({
    type: "SELECT_FIXTURE",
    payload: { fixtureUid, fixtureDate: selectedFixtureDate }
  });

  if (response.ok && "settings" in response) {
    usePopupSettingsStore.getState().setSettings(response.settings);
  } else if (!response.ok) {
    usePopupUiStore.getState().setError(response.error);
  }
}

export async function returnToSelectedFixtureDate(): Promise<void> {
  const selectedFixtureDate = usePopupSettingsStore.getState().settings.selectedFixtureDate;
  if (!selectedFixtureDate) {
    return;
  }

  await updateFixtureQuery({
    fixtureDate: selectedFixtureDate,
    fixtureLookupMode: "exact"
  });
}

export async function updateFixtureQuery(patch: FixtureQueryPatch): Promise<void> {
  usePopupFixtureStore.getState().setFixtureQueryLoading(true);
  usePopupUiStore.getState().clearError();

  const nextSettings = {
    ...usePopupSettingsStore.getState().settings,
    ...patch
  };

  try {
    if (nextSettings.selectedLeagueUid) {
      const result = await loadFixtures(nextSettings);
      if (!result.ok) {
        usePopupUiStore.getState().setError(result.error);
        return;
      }

      usePopupFixtureStore.getState().setFixtures(result.fixtures);
      await updatePopupSettings(resolveFixtureQuerySettingsPatch(nextSettings, result.fixtures, patch));
    } else {
      await updatePopupSettings(patch);
    }
  } finally {
    usePopupFixtureStore.getState().setFixtureQueryLoading(false);
  }
}
