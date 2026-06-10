import type {
  AvailableLeagueResponse,
  FixtureEventsResponse,
  FixtureByLeagueResponse,
  FixtureInfoResponse,
  FixtureLiveStatusResponse,
  FixtureLineupPlayerResponse,
  FixtureLineupResponse,
  FixtureStartLineupResponse,
  FixtureStatisticsResponse,
  PlayerWithStatistics,
  TeamWithStatistics
} from "./backendTypes";
import type {
  AvailableLeague,
  FixtureSummary,
  LineupPlayer,
  LiveMatchOverlayData,
  MatchEvent,
  MatchLineup,
  TeamLineup,
  TopPlayer
} from "./types";

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
  statistics: FixtureStatisticsResponse,
  events?: FixtureEventsResponse,
  lineup?: FixtureLineupResponse
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
    events: events ? mapMatchEvents(events) : undefined,
    lineup: lineup ? mapMatchLineup(lineup, statistics) : undefined,
    updatedAt: new Date().toISOString()
  };
}

function mapMatchEvents(response: FixtureEventsResponse): MatchEvent[] {
  return response.events.map((event) => ({
    sequence: event.sequence,
    elapsed: event.elapsed,
    extraTime: event.extraTime,
    teamName: getDisplayName(event.team),
    playerMatchPlayerUid: event.player?.matchPlayerUid,
    playerName: event.player ? getDisplayName(event.player) : undefined,
    assistMatchPlayerUid: event.assist?.matchPlayerUid,
    assistName: event.assist ? getDisplayName(event.assist) : undefined,
    type: event.type,
    detail: event.detail,
    comments: event.comments
  }));
}

function mapMatchLineup(response: FixtureLineupResponse, statistics: FixtureStatisticsResponse): MatchLineup {
  return {
    home: response.lineup.home ? mapTeamLineup(response.lineup.home, statistics.home?.playerStatistics ?? []) : undefined,
    away: response.lineup.away ? mapTeamLineup(response.lineup.away, statistics.away?.playerStatistics ?? []) : undefined
  };
}

function mapTeamLineup(lineup: FixtureStartLineupResponse, playerStatistics: PlayerWithStatistics[]): TeamLineup {
  const statisticsByPlayerUid = new Map(
    playerStatistics.map((player) => [player.player.matchPlayerUid, player])
  );

  return {
    teamName: lineup.teamKoreanName ?? lineup.teamName,
    formation: lineup.formation,
    players: lineup.players.map((player) => mapLineupPlayer(player, statisticsByPlayerUid)),
    substitutes: lineup.substitutes.map((player) => mapLineupPlayer(player, statisticsByPlayerUid))
  };
}

function mapLineupPlayer(
  player: FixtureLineupPlayerResponse,
  statisticsByPlayerUid: Map<string, PlayerWithStatistics>
): LineupPlayer {
  const playerStatistics = statisticsByPlayerUid.get(player.matchPlayerUid);

  return {
    matchPlayerUid: player.matchPlayerUid,
    name: player.koreanName ?? player.name,
    number: player.number,
    position: player.position,
    grid: player.grid,
    substitute: player.substitute,
    ...(playerStatistics ? mapLineupPlayerStatistics(playerStatistics) : {})
  };
}

function mapLineupPlayerStatistics(player: PlayerWithStatistics): Partial<LineupPlayer> {
  const rating = parseRating(player.statistics.rating);

  return {
    assists: player.statistics.assists || undefined,
    goals: player.statistics.goals || undefined,
    passes:
      player.statistics.passesTotal > 0
        ? `${player.statistics.passesAccuracy}%`
        : undefined,
    rating,
    shots: player.statistics.shotsTotal || undefined
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
