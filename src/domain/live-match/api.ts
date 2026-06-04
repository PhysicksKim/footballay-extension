import type {
  AvailableLeagueResponse,
  FixtureByLeagueResponse,
  FixtureInfoResponse,
  FixtureLiveStatusResponse,
  FixtureStatisticsResponse
} from "./backendTypes";
import { mapAvailableLeague, mapFixtureLiveData, mapFixtureSummary } from "./mapper";
import type { AvailableLeague, FixtureLookupMode, FixtureSummary, LiveMatchOverlayData } from "./types";

const DEFAULT_API_BASE_URL = "https://api.footballay.com";

type FixtureQuery = {
  date?: string;
  mode: FixtureLookupMode;
  timezone: string;
};

export async function fetchAvailableLeagues(): Promise<AvailableLeague[]> {
  const response = await fetchFootballayJson<AvailableLeagueResponse[]>("/v1/football/leagues/available");
  return response.map(mapAvailableLeague);
}

export async function fetchFixturesByLeague(
  leagueUid: string,
  query: FixtureQuery
): Promise<FixtureSummary[]> {
  const searchParams = new URLSearchParams({
    mode: query.mode,
    timezone: query.timezone
  });

  if (query.date) {
    searchParams.set("date", query.date);
  }

  const response = await fetchFootballayJson<FixtureByLeagueResponse[]>(
    `/v1/football/leagues/${leagueUid}/fixtures?${searchParams.toString()}`
  );

  return response.map(mapFixtureSummary);
}

export async function fetchLiveMatchOverlayData(
  fixtureUid?: string
): Promise<LiveMatchOverlayData | null> {
  if (!fixtureUid) {
    return null;
  }

  const [info, status, statistics] = await Promise.all([
    fetchFixtureInfo(fixtureUid),
    fetchFixtureStatus(fixtureUid),
    fetchFixtureStatistics(fixtureUid)
  ]);

  return mapFixtureLiveData(info, status, statistics);
}

export function fetchFixtureInfo(fixtureUid: string): Promise<FixtureInfoResponse> {
  return fetchFootballayJson(`/v1/football/fixtures/${fixtureUid}/info`);
}

export function fetchFixtureStatus(fixtureUid: string): Promise<FixtureLiveStatusResponse> {
  return fetchFootballayJson(`/v1/football/fixtures/${fixtureUid}/status`);
}

export function fetchFixtureStatistics(fixtureUid: string): Promise<FixtureStatisticsResponse> {
  return fetchFootballayJson(`/v1/football/fixtures/${fixtureUid}/statistics`);
}

function fetchFootballayJson<T>(path: string): Promise<T> {
  const endpoint = new URL(path, getApiBaseUrl());

  return fetch(endpoint, {
    headers: {
      Accept: "application/json"
    }
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Footballay API request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  });
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_FOOTBALLAY_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
}
