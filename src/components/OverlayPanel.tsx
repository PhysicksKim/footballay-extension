import type { LiveMatchOverlayData } from "@/features/live-match/types";
import { StatLine } from "./StatLine";

type OverlayPanelProps = {
  data: LiveMatchOverlayData | null;
  onCollapse: () => void;
  onDisable: () => void;
};

export function OverlayPanel({ data, onCollapse, onDisable }: OverlayPanelProps) {
  return (
    <section className="footballay-panel" aria-label="Footballay live stats">
      <header className="footballay-panel__header">
        <span className="footballay-panel__brand">Footballay</span>
        <div className="footballay-panel__actions">
          <button type="button" onClick={onCollapse} aria-label="Collapse overlay">
            _
          </button>
          <button type="button" onClick={onDisable} aria-label="Disable overlay">
            x
          </button>
        </div>
      </header>

      {data ? (
        <>
          <div className="footballay-score">
            <span>{data.homeTeamName}</span>
            <strong>
              {data.homeScore} - {data.awayScore}
            </strong>
            <span>{data.awayTeamName}</span>
            <em>{data.elapsed ? `${data.elapsed}'` : data.statusShort}</em>
          </div>

          <div className="footballay-stats">
            <StatLine label="Shots" home={data.homeStats?.shotsTotal} away={data.awayStats?.shotsTotal} />
            <StatLine
              label="On Target"
              home={data.homeStats?.shotsOnGoal}
              away={data.awayStats?.shotsOnGoal}
            />
            <StatLine
              label="Possession"
              home={data.homeStats?.possession}
              away={data.awayStats?.possession}
            />
            <StatLine
              label="Cards"
              home={formatCards(data.homeStats?.yellowCards, data.homeStats?.redCards)}
              away={formatCards(data.awayStats?.yellowCards, data.awayStats?.redCards)}
            />
          </div>

          {data.topPlayers?.length ? (
            <div className="footballay-top-players">
              <span>Top</span>
              {data.topPlayers.slice(0, 3).map((player) => (
                <p key={`${player.teamName}-${player.name}`}>
                  {player.name} {player.rating?.toFixed(1)}
                  {player.goals ? ` | G ${player.goals}` : ""}
                  {player.assists ? ` | A ${player.assists}` : ""}
                  {player.shots ? ` | Shots ${player.shots}` : ""}
                  {player.passes ? ` | Pass ${player.passes}` : ""}
                </p>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className="footballay-empty">No live data</p>
      )}
    </section>
  );
}

function formatCards(yellowCards = 0, redCards = 0): string {
  return redCards > 0 ? `${yellowCards}Y ${redCards}R` : `${yellowCards}`;
}
