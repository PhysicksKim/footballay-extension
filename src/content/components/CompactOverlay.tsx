import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { MatchScoreHeader } from "./MatchScoreHeader";

type CompactOverlayProps = {
  data: LiveMatchOverlayData | null;
  onCollapse: () => void;
  onExpand: () => void;
};

export function CompactOverlay({ data, onCollapse, onExpand }: CompactOverlayProps) {
  return (
    <section className="footballay-compact" aria-label="Footballay compact live stats">
      <MatchScoreHeader data={data} />
      <div className="footballay-compact__actions">
        <button type="button" onClick={onExpand}>
          Expand
        </button>
        <button type="button" onClick={onCollapse}>
          Hide
        </button>
      </div>
    </section>
  );
}
