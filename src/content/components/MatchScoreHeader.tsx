import type { LiveMatchOverlayData } from "@/domain/live-match/types";

type MatchScoreHeaderProps = {
  data: LiveMatchOverlayData | null;
};

export function MatchScoreHeader({ data }: MatchScoreHeaderProps) {
  if (!data) {
    return (
      <div className="footballay-score footballay-score--empty">
        <span>No live data</span>
      </div>
    );
  }

  return (
    <div className="footballay-score">
      <span>{data.homeTeamName}</span>
      <strong>
        {data.homeScore} - {data.awayScore}
      </strong>
      <span>{data.awayTeamName}</span>
      <em>{data.elapsed ? `${data.elapsed}'` : data.statusShort}</em>
    </div>
  );
}
