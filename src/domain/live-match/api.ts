import axios from "axios";
import type {
  AvailableLeagueResponse,
  FixtureEventsResponse,
  FixtureByLeagueResponse,
  FixtureInfoResponse,
  FixtureLiveStatusResponse,
  FixtureLineupResponse,
  FixtureStatisticsResponse
} from "./backendTypes";
import { mapAvailableLeague, mapFixtureLiveData, mapFixtureSummary } from "./mapper";
import type { AvailableLeague, FixtureLookupMode, FixtureSummary, LiveMatchOverlayData } from "./types";

const DEFAULT_API_BASE_URL = "https://api.footballay.com";

const footballayApi = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: "application/json"
  }
});

type FixtureQuery = {
  date?: string;
  mode: FixtureLookupMode;
  timezone: string;
};

export type EtaggedResponse<T> =
  | { type: "updated"; data: T; etag?: string }
  | { type: "not-modified"; etag?: string };

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

export function fetchFixtureStatusWithEtag(
  fixtureUid: string,
  etag?: string
): Promise<EtaggedResponse<FixtureLiveStatusResponse>> {
  return fetchFootballayEtaggedJson(`/v1/football/fixtures/${fixtureUid}/status`, etag);
}

export function fetchFixtureStatisticsWithEtag(
  fixtureUid: string,
  etag?: string
): Promise<EtaggedResponse<FixtureStatisticsResponse>> {
  return fetchFootballayEtaggedJson(`/v1/football/fixtures/${fixtureUid}/statistics`, etag);
}

export function fetchFixtureEventsWithEtag(
  fixtureUid: string,
  etag?: string
): Promise<EtaggedResponse<FixtureEventsResponse>> {
  return fetchFootballayEtaggedJson(`/v1/football/fixtures/${fixtureUid}/events`, etag);
}

export function fetchFixtureLineupWithEtag(
  fixtureUid: string,
  etag?: string
): Promise<EtaggedResponse<FixtureLineupResponse>> {
  return fetchFootballayEtaggedJson(`/v1/football/fixtures/${fixtureUid}/lineup`, etag);
}

function fetchFootballayJson<T>(path: string): Promise<T> {
  return footballayApi.get<T>(path).then((response) => response.data);
}

function fetchFootballayEtaggedJson<T>(path: string, etag?: string): Promise<EtaggedResponse<T>> {
  return footballayApi
    .get<T>(path, {
      headers: etag ? { "If-None-Match": etag } : undefined,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 304
    })
    .then((response) => {
      const nextEtag = getResponseHeader(response.headers, "etag");

      if (response.status === 304) {
        return { type: "not-modified", etag: nextEtag };
      }

      return {
        type: "updated",
        data: response.data,
        etag: nextEtag
      };
    });
}

type ResponseHeaderContainer = {
  get?: (name: string) => unknown;
  [name: string]: unknown;
};

function getResponseHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }

  const headerContainer = headers as ResponseHeaderContainer;
  const value =
    typeof headerContainer.get === "function"
      ? headerContainer.get(name)
      : headerContainer[name.toLowerCase()] ?? headerContainer[name];

  if (Array.isArray(value)) {
    return value[0] === undefined ? undefined : String(value[0]);
  }

  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_FOOTBALLAY_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
}
