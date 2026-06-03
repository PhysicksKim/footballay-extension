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
  fixtureId: number;
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
