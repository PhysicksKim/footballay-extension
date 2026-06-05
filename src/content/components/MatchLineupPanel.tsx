import type { TeamLineup } from "@/domain/live-match/types";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";

type MatchLineupPanelProps = {
  data: LiveMatchOverlayData | null;
};

export function MatchLineupPanel({ data }: MatchLineupPanelProps) {
  if (!data?.lineup?.home && !data?.lineup?.away) {
    return <p className="footballay-empty">No lineup</p>;
  }

  return (
    <div className="footballay-lineup">
      <LineupColumn lineup={data.lineup.home} />
      <LineupColumn lineup={data.lineup.away} />
    </div>
  );
}

function LineupColumn({ lineup }: { lineup?: TeamLineup }) {
  if (!lineup) {
    return <div className="footballay-lineup__team">-</div>;
  }

  return (
    <div className="footballay-lineup__team">
      <strong>
        {lineup.teamName}
        {lineup.formation ? ` ${lineup.formation}` : ""}
      </strong>
      {lineup.players.slice(0, 5).map((player) => (
        <span key={player.matchPlayerUid}>{player.name}</span>
      ))}
    </div>
  );
}
