import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { StatLine } from "./StatLine";

type MatchStatsPanelProps = {
  data: LiveMatchOverlayData | null;
};

export function MatchStatsPanel({ data }: MatchStatsPanelProps) {
  if (!data) {
    return <p className="footballay-empty">No stats</p>;
  }

  return (
    <div className="footballay-stats">
      <StatLine label="Shots" home={data.homeStats?.shotsTotal} away={data.awayStats?.shotsTotal} />
      <StatLine label="On Target" home={data.homeStats?.shotsOnGoal} away={data.awayStats?.shotsOnGoal} />
      <StatLine label="Possession" home={data.homeStats?.possession} away={data.awayStats?.possession} />
      <StatLine
        label="Cards"
        home={formatCards(data.homeStats?.yellowCards, data.homeStats?.redCards)}
        away={formatCards(data.awayStats?.yellowCards, data.awayStats?.redCards)}
      />
    </div>
  );
}

function formatCards(yellowCards = 0, redCards = 0): string {
  return redCards > 0 ? `${yellowCards}Y ${redCards}R` : `${yellowCards}`;
}
