import type { LiveMatchOverlayData } from "./types";

type ApiLiveMatchResponse = Partial<LiveMatchOverlayData> & {
  id?: number;
  fixture?: {
    id?: number;
    status?: {
      elapsed?: number;
      short?: string;
    };
  };
  teams?: {
    home?: { name?: string };
    away?: { name?: string };
  };
  goals?: {
    home?: number;
    away?: number;
  };
};

export function mapApiLiveMatchToOverlayData(
  response: ApiLiveMatchResponse,
  fallbackFixtureId: number
): LiveMatchOverlayData {
  return {
    fixtureId: response.fixtureId ?? response.fixture?.id ?? response.id ?? fallbackFixtureId,
    homeTeamName: response.homeTeamName ?? response.teams?.home?.name ?? "Home",
    awayTeamName: response.awayTeamName ?? response.teams?.away?.name ?? "Away",
    homeScore: response.homeScore ?? response.goals?.home ?? 0,
    awayScore: response.awayScore ?? response.goals?.away ?? 0,
    elapsed: response.elapsed ?? response.fixture?.status?.elapsed,
    statusShort: response.statusShort ?? response.fixture?.status?.short,
    homeStats: response.homeStats,
    awayStats: response.awayStats,
    topPlayers: response.topPlayers,
    updatedAt: response.updatedAt ?? new Date().toISOString()
  };
}
