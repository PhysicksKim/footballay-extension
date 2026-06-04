export type TeamStats = {
  shotsOnGoal?: number;
  shotsTotal?: number;
  possession?: string;
  yellowCards?: number;
  redCards?: number;
};

export type TopPlayer = {
  name: string;
  teamName: string;
  rating?: number;
  goals?: number;
  assists?: number;
  shots?: number;
  passes?: string;
};

export type LiveMatchOverlayData = {
  fixtureUid: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  elapsed?: number;
  statusShort?: string;
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  topPlayers?: TopPlayer[];
  updatedAt: string;
};

export type AvailableLeague = {
  uid: string;
  name: string;
  nameKo?: string | null;
};

export type FixtureLookupMode = "previous" | "exact" | "nearest";

export type FixtureSummary = {
  uid: string;
  kickoff?: string | null;
  round: string;
  homeTeamName: string;
  awayTeamName: string;
  statusShort: string;
  statusLong: string;
  elapsed?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  available: boolean;
};
