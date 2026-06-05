import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { MatchEventsTimeline } from "./MatchEventsTimeline";
import { MatchLineupPanel } from "./MatchLineupPanel";
import { MatchScoreHeader } from "./MatchScoreHeader";
import { MatchStatsPanel } from "./MatchStatsPanel";

type ExpandedOverlayDrawerProps = {
  data: LiveMatchOverlayData | null;
  onCollapse: () => void;
  onCompact: () => void;
  onDisable: () => void;
};

export function ExpandedOverlayDrawer({
  data,
  onCollapse,
  onCompact,
  onDisable
}: ExpandedOverlayDrawerProps) {
  return (
    <section className="footballay-panel" aria-label="Footballay expanded live stats">
      <header className="footballay-panel__header">
        <span className="footballay-panel__brand">Footballay</span>
        <div className="footballay-panel__actions">
          <button type="button" onClick={onCompact} aria-label="Compact overlay">
            C
          </button>
          <button type="button" onClick={onCollapse} aria-label="Hide overlay">
            _
          </button>
          <button type="button" onClick={onDisable} aria-label="Disable overlay">
            x
          </button>
        </div>
      </header>

      <MatchScoreHeader data={data} />

      <section className="footballay-panel-section">
        <h2>Stats</h2>
        <MatchStatsPanel data={data} />
      </section>

      <section className="footballay-panel-section">
        <h2>Events</h2>
        <MatchEventsTimeline data={data} />
      </section>

      <section className="footballay-panel-section">
        <h2>Lineup</h2>
        <MatchLineupPanel data={data} />
      </section>
    </section>
  );
}
