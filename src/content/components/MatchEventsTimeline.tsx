import type { LiveMatchOverlayData } from "@/domain/live-match/types";

type MatchEventsTimelineProps = {
  data: LiveMatchOverlayData | null;
};

export function MatchEventsTimeline({ data }: MatchEventsTimelineProps) {
  const events = data?.events ?? [];

  if (!events.length) {
    return <p className="footballay-empty">No events</p>;
  }

  return (
    <div className="footballay-events">
      {events.slice(0, 8).map((event) => (
        <p key={`${event.sequence}-${event.type}-${event.elapsed}`}>
          <strong>{event.elapsed}'</strong>
          <span>{event.type}</span>
          <em>{event.playerName ?? event.teamName}</em>
        </p>
      ))}
    </div>
  );
}
