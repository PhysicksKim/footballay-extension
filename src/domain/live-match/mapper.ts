import type {
  AvailableLeagueResponse,
  FixtureByLeagueResponse,
  FixtureInfoResponse,
  FixtureLiveStatusResponse,
  FixtureStatisticsResponse,
  PlayerWithStatistics,
  TeamWithStatistics
} from "./backendTypes";
import type { AvailableLeague, FixtureSummary, LiveMatchOverlayData, TopPlayer } from "./types";

export function mapAvailableLeague(response: AvailableLeagueResponse): AvailableLeague {
  return {
    uid: response.uid,
    name: response.name,
    nameKo: response.nameKo
  };
}

export function mapFixtureSummary(response: FixtureByLeagueResponse): FixtureSummary {
  return {
    uid: response.uid,
    kickoff: response.kickoff,
    round: response.round,
    homeTeamName: getDisplayName(response.homeTeam),
    awayTeamName: getDisplayName(response.awayTeam),
    statusShort: response.status.shortStatus,
    statusLong: response.status.longStatus,
    elapsed: response.status.elapsed,
    homeScore: response.score.home,
    awayScore: response.score.away,
    available: response.available
  };
}

export function mapFixtureLiveData(
  info: FixtureInfoResponse,
  status: FixtureLiveStatusResponse,
  statistics: FixtureStatisticsResponse
): LiveMatchOverlayData {
  return {
    fixtureUid: info.fixtureUid,
    homeTeamName: getDisplayName(info.home),
    awayTeamName: getDisplayName(info.away),
    homeScore: status.liveStatus.score.home ?? 0,
    awayScore: status.liveStatus.score.away ?? 0,
    elapsed: status.liveStatus.elapsed ?? statistics.fixture.elapsed ?? undefined,
    statusShort: status.liveStatus.shortStatus,
    homeStats: statistics.home ? mapTeamStats(statistics.home) : undefined,
    awayStats: statistics.away ? mapTeamStats(statistics.away) : undefined,
    topPlayers: getTopPlayers(statistics),
    updatedAt: new Date().toISOString()
  };
}

function mapTeamStats(team: TeamWithStatistics) {
  return {
    shotsOnGoal: team.teamStatistics.shotsOnGoal,
    shotsTotal: team.teamStatistics.totalShots,
    possession: `${team.teamStatistics.ballPossession}%`,
    yellowCards: team.teamStatistics.yellowCards,
    redCards: team.teamStatistics.redCards
  };
}

function getTopPlayers(statistics: FixtureStatisticsResponse): TopPlayer[] {
  return [...(statistics.home?.playerStatistics ?? []), ...(statistics.away?.playerStatistics ?? [])]
    .map(mapTopPlayer)
    .filter((player): player is TopPlayer & { rating: number } => player.rating !== undefined)
    .sort((left, right) => right.rating - left.rating)
    .slice(0, 3);
}

function mapTopPlayer(player: PlayerWithStatistics): TopPlayer {
  const rating = parseRating(player.statistics.rating);

  return {
    name: player.player.koreanName ?? player.player.name,
    teamName: "",
    rating,
    goals: player.statistics.goals || undefined,
    assists: player.statistics.assists || undefined,
    shots: player.statistics.shotsTotal || undefined,
    passes:
      player.statistics.passesTotal > 0
        ? `${player.statistics.passesAccuracy}%`
        : undefined
  };
}

function getDisplayName(team?: { name: string; nameKo?: string | null; koreanName?: string | null } | null): string {
  return team?.koreanName ?? team?.nameKo ?? team?.name ?? "TBD";
}

function parseRating(rating?: string | null): number | undefined {
  if (!rating) {
    return undefined;
  }

  const parsed = Number.parseFloat(rating);
  return Number.isFinite(parsed) ? parsed : undefined;
}
