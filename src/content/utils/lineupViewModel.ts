import type { LineupPlayer, LiveMatchOverlayData, MatchEvent, TeamLineup } from "@/domain/live-match/types";

export type LineupSide = "home" | "away";

export type LineupViewPlayer = {
  assists?: number;
  goals: number;
  grid?: string | null;
  matchPlayerUid: string;
  name: string;
  number?: number | null;
  ownGoals: number;
  passes?: string;
  playerSubstitute?: LineupViewPlayer;
  position?: string | null;
  rating?: number;
  redCards: number;
  shots?: number;
  substitutedIn: boolean;
  substitute: boolean;
  usesStatisticGoals: boolean;
  yellowCards: number;
};

export type TeamLineupViewModel = {
  formation?: string | null;
  maxColumn: number;
  maxRow: number;
  players: LineupViewPlayer[];
  rows: LineupViewPlayer[][];
  teamName: string;
};

export function buildTeamLineupViewModel(
  data: LiveMatchOverlayData | null,
  side: LineupSide
): TeamLineupViewModel | null {
  const lineup = side === "home" ? data?.lineup?.home : data?.lineup?.away;

  if (!lineup) {
    return null;
  }

  const players = lineup.players.map(createLineupViewPlayer);
  const substitutePool = new Map(lineup.substitutes.map((player) => [player.matchPlayerUid, createLineupViewPlayer(player)]));
  const playerIndex = new Map<string, LineupViewPlayer>();
  players.forEach((player) => indexPlayer(player, playerIndex));

  for (const event of data?.events ?? []) {
    applyEvent(event, lineup, players, substitutePool, playerIndex);
  }

  const grids = players.map((player) => parseGrid(player.grid)).filter((grid): grid is [number, number] => Boolean(grid));

  return {
    formation: lineup.formation,
    maxColumn: Math.max(5, ...grids.map((grid) => grid[1])),
    maxRow: Math.max(1, ...grids.map((grid) => grid[0])),
    players,
    rows: groupPlayersByGridRow(players),
    teamName: lineup.teamName
  };
}

export function findLineupPlayer(
  players: LineupViewPlayer[],
  matchPlayerUid?: string
): LineupViewPlayer | undefined {
  if (!matchPlayerUid) {
    return undefined;
  }

  for (const player of players) {
    if (player.matchPlayerUid === matchPlayerUid) {
      return player;
    }

    const substitute = findLineupPlayer(player.playerSubstitute ? [player.playerSubstitute] : [], matchPlayerUid);
    if (substitute) {
      return substitute;
    }
  }

  return undefined;
}

export function flattenLineupPlayers(players: LineupViewPlayer[]): LineupViewPlayer[] {
  return players.flatMap((player) => [
    player,
    ...(player.playerSubstitute ? flattenLineupPlayers([player.playerSubstitute]) : [])
  ]);
}

function createLineupViewPlayer(player: LineupPlayer): LineupViewPlayer {
  return {
    assists: player.assists,
    goals: player.goals ?? 0,
    grid: player.grid,
    matchPlayerUid: player.matchPlayerUid,
    name: player.name,
    number: player.number,
    ownGoals: 0,
    passes: player.passes,
    position: player.position,
    rating: player.rating,
    redCards: 0,
    shots: player.shots,
    substitutedIn: player.substitute,
    substitute: player.substitute,
    usesStatisticGoals: player.goals !== undefined,
    yellowCards: 0
  };
}

function applyEvent(
  event: MatchEvent,
  lineup: TeamLineup,
  players: LineupViewPlayer[],
  substitutePool: Map<string, LineupViewPlayer>,
  playerIndex: Map<string, LineupViewPlayer>
): void {
  if (event.teamName !== lineup.teamName) {
    return;
  }

  if (isSubstitutionEvent(event)) {
    applySubstitutionEvent(event, players, substitutePool, playerIndex);
    return;
  }

  const player = findEventPlayer(event, players);
  if (!player) {
    return;
  }

  if (isGoalEvent(event)) {
    if (isOwnGoalEvent(event)) {
      player.ownGoals += 1;
    } else if (!player.usesStatisticGoals) {
      player.goals += 1;
    }
  }

  if (isYellowCardEvent(event)) {
    player.yellowCards += 1;
  }

  if (isRedCardEvent(event)) {
    player.redCards += 1;
  }
}

function applySubstitutionEvent(
  event: MatchEvent,
  players: LineupViewPlayer[],
  substitutePool: Map<string, LineupViewPlayer>,
  playerIndex: Map<string, LineupViewPlayer>
): void {
  const outgoingPlayer = findEventPlayer(event, players);
  const incomingPlayer =
    getPlayerByEventUid(event.assistMatchPlayerUid, substitutePool, playerIndex) ??
    getPlayerByName(event.assistName, substitutePool);

  if (!outgoingPlayer || !incomingPlayer) {
    return;
  }

  incomingPlayer.grid = incomingPlayer.grid ?? outgoingPlayer.grid;
  incomingPlayer.substitutedIn = true;
  incomingPlayer.substitute = true;
  outgoingPlayer.playerSubstitute = incomingPlayer;
  indexPlayer(incomingPlayer, playerIndex);
  substitutePool.delete(incomingPlayer.matchPlayerUid);
}

function indexPlayer(player: LineupViewPlayer, playerIndex: Map<string, LineupViewPlayer>): void {
  playerIndex.set(player.matchPlayerUid, player);

  if (player.playerSubstitute) {
    indexPlayer(player.playerSubstitute, playerIndex);
  }
}

function findEventPlayer(event: MatchEvent, players: LineupViewPlayer[]): LineupViewPlayer | undefined {
  return findLineupPlayer(players, event.playerMatchPlayerUid) ?? findLineupPlayerByName(players, event.playerName);
}

function findLineupPlayerByName(players: LineupViewPlayer[], playerName?: string): LineupViewPlayer | undefined {
  if (!playerName) {
    return undefined;
  }

  for (const player of players) {
    if (player.name === playerName) {
      return player;
    }

    const substitute = findLineupPlayerByName(player.playerSubstitute ? [player.playerSubstitute] : [], playerName);
    if (substitute) {
      return substitute;
    }
  }

  return undefined;
}

function getPlayerByEventUid(
  matchPlayerUid: string | undefined,
  substitutePool: Map<string, LineupViewPlayer>,
  playerIndex: Map<string, LineupViewPlayer>
): LineupViewPlayer | undefined {
  if (!matchPlayerUid) {
    return undefined;
  }

  return substitutePool.get(matchPlayerUid) ?? playerIndex.get(matchPlayerUid);
}

function getPlayerByName(
  playerName: string | undefined,
  substitutePool: Map<string, LineupViewPlayer>
): LineupViewPlayer | undefined {
  if (!playerName) {
    return undefined;
  }

  return [...substitutePool.values()].find((player) => player.name === playerName);
}

function parseGrid(grid?: string | null): [number, number] | null {
  if (!grid) {
    return null;
  }

  const parts = grid.split(":").map(Number);
  const row = parts[0];
  const column = parts[1];

  if (row === undefined || column === undefined || !Number.isFinite(row) || !Number.isFinite(column)) {
    return null;
  }

  return [row, column];
}

function groupPlayersByGridRow(players: LineupViewPlayer[]): LineupViewPlayer[][] {
  const rows = new Map<number, Array<{ column: number; player: LineupViewPlayer }>>();
  const fallbackPlayers: LineupViewPlayer[] = [];

  for (const player of players) {
    const grid = parseGrid(player.grid);

    if (!grid) {
      fallbackPlayers.push(player);
      continue;
    }

    const [row, column] = grid;
    rows.set(row, [...(rows.get(row) ?? []), { column, player }]);
  }

  const groupedRows = [...rows.entries()]
    .sort(([leftRow], [rightRow]) => leftRow - rightRow)
    .map(([, rowPlayers]) =>
      rowPlayers
        .sort((left, right) => left.column - right.column)
        .map(({ player }) => player)
    );

  return fallbackPlayers.length ? [...groupedRows, fallbackPlayers] : groupedRows;
}

function isSubstitutionEvent(event: MatchEvent): boolean {
  return event.type.toLowerCase().includes("subst") || event.detail.toLowerCase().includes("subst");
}

function isGoalEvent(event: MatchEvent): boolean {
  return event.type.toLowerCase() === "goal";
}

function isOwnGoalEvent(event: MatchEvent): boolean {
  return event.detail.toLowerCase().includes("own");
}

function isYellowCardEvent(event: MatchEvent): boolean {
  return event.type.toLowerCase().includes("card") && event.detail.toLowerCase().includes("yellow");
}

function isRedCardEvent(event: MatchEvent): boolean {
  return event.type.toLowerCase().includes("card") && event.detail.toLowerCase().includes("red");
}
