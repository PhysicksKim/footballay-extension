import type { FixtureLookupMode, FixtureSummary } from "@/domain/live-match/types";
import type { RuntimeSettingsPatch } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import type { PopupStoreSet } from "../store";
import {
  addDaysToDateInputValue,
  getFixtureDateFromFixtures,
  getTodayDateInputValue
} from "../utils/date";
import { getBrowserTimezone } from "./runtimeClient";

// The fixture list always needs a query date; default to today's local date for first load.
export function getQueryDate(settings: ExtensionSettings): string {
  return settings.fixtureDate ?? getTodayDateInputValue();
}

// The API searches from the adjacent date, not from the currently resolved match date itself.
// Previous uses yesterday + previous mode; next uses tomorrow + nearest mode.
export function getFixtureNavigationPatch(
  settings: ExtensionSettings,
  direction: "previous" | "next"
): Pick<ExtensionSettings, "fixtureDate" | "fixtureLookupMode"> {
  const baseDate = getQueryDate(settings);

  return {
    fixtureDate: addDaysToDateInputValue(baseDate, direction === "previous" ? -1 : 1),
    fixtureLookupMode: direction === "previous" ? "previous" : "nearest"
  };
}

// Loads fixtures for the selected league and writes the result into popup state.
// This stays as a flow helper because it combines runtime messaging with store updates.
export async function loadFixtures(
  nextSettings: ExtensionSettings,
  set: PopupStoreSet
): Promise<FixtureSummary[] | null> {
  if (!nextSettings.selectedLeagueUid) {
    set({ fixtures: [] });
    return [];
  }

  const response = await sendRuntimeMessage({
    type: "GET_FIXTURES_BY_LEAGUE",
    payload: {
      leagueUid: nextSettings.selectedLeagueUid,
      date: getQueryDate(nextSettings),
      mode: nextSettings.fixtureLookupMode,
      timezone: getBrowserTimezone()
    }
  });

  if (response.ok && "fixtures" in response) {
    set({ fixtures: response.fixtures });
    return response.fixtures;
  }

  if (!response.ok) {
    set({ error: response.error });
  }

  return null;
}

// Nearest/previous requests can resolve to a different actual fixture date.
// Persist that resolved date so the popup date label matches the returned fixture list.
export async function syncResolvedFixtureDate(
  nextSettings: ExtensionSettings,
  nextFixtures: FixtureSummary[] | null,
  set: PopupStoreSet
): Promise<void> {
  if (nextSettings.fixtureLookupMode === "exact" || !nextFixtures) {
    return;
  }

  const resolvedDate = getFixtureDateFromFixtures(nextFixtures);
  if (!resolvedDate || resolvedDate === nextSettings.fixtureDate) {
    return;
  }

  const response = await sendRuntimeMessage({
    type: "UPDATE_SETTINGS",
    payload: { fixtureDate: resolvedDate }
  });

  if (response.ok && "settings" in response) {
    set({ settings: response.settings });
  }
}

// Exact date queries keep the requested date. Nearest/previous queries follow the date
// resolved by returned fixtures to avoid flickering and stale date labels.
export function resolveFixtureQuerySettingsPatch(
  nextSettings: ExtensionSettings,
  nextFixtures: FixtureSummary[],
  requestedPatch: Partial<Pick<ExtensionSettings, "fixtureDate" | "fixtureLookupMode">>
): RuntimeSettingsPatch {
  const resolvedDate =
    nextSettings.fixtureLookupMode === "exact"
      ? nextSettings.fixtureDate
      : getFixtureDateFromFixtures(nextFixtures) ?? nextSettings.fixtureDate;

  return {
    ...requestedPatch,
    fixtureDate: resolvedDate
  };
}
