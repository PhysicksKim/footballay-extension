import { Check, Plus } from "lucide-react";
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
        <p className="footballay-empty-state">리그를 선택하세요</p>
      ) : fixtures.length ? (
        fixtures.map((fixture) => {
          const selected = fixture.uid === selectedFixtureUid;

          return (
            <article
              key={fixture.uid}
              className={`footballay-fixture-row${selected ? " footballay-fixture-row--selected" : ""}`}
            >
              <div className="footballay-fixture-row__meta">
                <span className="footballay-fixture-time">{formatKickoffTime(fixture.kickoff)}</span>
                <span className="footballay-fixture-status">{formatFixtureStatus(fixture)}</span>
                <span className="footballay-fixture-round">{fixture.round}</span>
              </div>

              <div className="footballay-fixture-row__body">
                <strong className="footballay-fixture-team footballay-fixture-team--home">
                  {fixture.homeTeamName}
                </strong>
                <strong className="footballay-fixture-score">{formatFixtureScore(fixture)}</strong>
                <strong className="footballay-fixture-team footballay-fixture-team--away">
                  {fixture.awayTeamName}
                </strong>
                <button
                  className="footballay-fixture-action"
                  type="button"
                  aria-label={selected ? "Selected fixture" : "Select fixture"}
                  onClick={() => onSelectFixture(fixture.uid)}
                >
                  {selected ? <Check aria-hidden size={18} strokeWidth={3} /> : <Plus aria-hidden size={18} strokeWidth={3} />}
                  <span>{selected ? "선택됨" : "선택"}</span>
                </button>
              </div>
            </article>
          );
        })
      ) : (
        <p className="footballay-empty-state">경기가 없습니다</p>
      )}
    </div>
  );
}
