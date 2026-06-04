import type { FixtureSummary, LiveMatchOverlayData } from "@/domain/live-match/types";
import { formatFixtureLabel } from "../utils/format";

type CurrentMatchCardProps = {
  data: LiveMatchOverlayData | null;
  fixtures: FixtureSummary[];
  selectedFixtureUid?: string;
};

export function CurrentMatchCard({ data, fixtures, selectedFixtureUid }: CurrentMatchCardProps) {
  const selectedFixture = fixtures.find((fixture) => fixture.uid === selectedFixtureUid);

  return (
    <section className="footballay-popup-card">
      <span>Current Match</span>
      {selectedFixture ? (
        <strong>{formatFixtureLabel(selectedFixture)}</strong>
      ) : data ? (
        <strong>
          {data.homeTeamName} {data.homeScore} - {data.awayScore} {data.awayTeamName}
        </strong>
      ) : (
        <strong>No live data</strong>
      )}
    </section>
  );
}
