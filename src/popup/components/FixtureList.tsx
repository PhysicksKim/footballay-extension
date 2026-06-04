import type { FixtureSummary } from "@/domain/live-match/types";
import { formatFixtureScore, formatFixtureStatus, formatKickoffTime } from "../utils/format";

type FixtureListProps = {
  fixtures: FixtureSummary[];
  loadingText: string | null;
  selectedFixtureUid?: string;
  selectedLeagueUid?: string;
  onSelectFixture: (fixtureUid: string) => void;
};

export function FixtureList({
  fixtures,
  loadingText,
  selectedFixtureUid,
  selectedLeagueUid,
  onSelectFixture
}: FixtureListProps) {
  return (
    <div className="footballay-fixture-list" aria-label="Fixtures">
      {loadingText && !fixtures.length ? (
        <p className="footballay-empty-state">{loadingText}</p>
      ) : !selectedLeagueUid ? (
        <p className="footballay-empty-state">Select a league</p>
      ) : fixtures.length ? (
        fixtures.map((fixture) => (
          <button
            key={fixture.uid}
            className={`footballay-fixture-row${
              fixture.uid === selectedFixtureUid ? " footballay-fixture-row--selected" : ""
            }`}
            type="button"
            onClick={() => onSelectFixture(fixture.uid)}
          >
            <span className="footballay-fixture-time">{formatKickoffTime(fixture.kickoff)}</span>
            <span className="footballay-fixture-teams">
              <strong>{fixture.homeTeamName}</strong>
              <span>{fixture.awayTeamName}</span>
            </span>
            <span className="footballay-fixture-score">{formatFixtureScore(fixture)}</span>
            <span className="footballay-fixture-status">{formatFixtureStatus(fixture)}</span>
            <span className="footballay-fixture-action">
              {fixture.uid === selectedFixtureUid ? "Selected" : "Select"}
            </span>
          </button>
        ))
      ) : (
        <p className="footballay-empty-state">No fixtures</p>
      )}
    </div>
  );
}
