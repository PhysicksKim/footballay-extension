import type { FixtureLookupMode, FixtureSummary } from "@/domain/live-match/types";
import type { RuntimeSettingsPatch } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import {
  addDaysToDateInputValue,
  getFixtureDateFromFixtures,
  getTodayDateInputValue
} from "../utils/date";
import { getBrowserTimezone } from "./runtimeClient";

export type FixtureLoadResult =
  | { ok: true; fixtures: FixtureSummary[] }
  | { ok: false; error: string };

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

export async function loadFixtures(nextSettings: ExtensionSettings): Promise<FixtureLoadResult> {
  if (!nextSettings.selectedLeagueUid) {
    return { fixtures: [], ok: true };
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
    return { fixtures: response.fixtures, ok: true };
  }

  if (!response.ok) {
    return { error: response.error, ok: false };
  }

  return { error: "Unable to load fixtures", ok: false };
}

export function getResolvedFixtureDatePatch(
  nextSettings: ExtensionSettings,
  nextFixtures: FixtureSummary[] | null
): Pick<ExtensionSettings, "fixtureDate"> | null {
  if (nextSettings.fixtureLookupMode === "exact" || !nextFixtures) {
    return null;
  }

  const resolvedDate = getFixtureDateFromFixtures(nextFixtures);
  if (!resolvedDate || resolvedDate === nextSettings.fixtureDate) {
    return null;
  }

  return { fixtureDate: resolvedDate };
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
