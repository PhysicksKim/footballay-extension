import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import footballayIconSmallUrl from "../../../assets/footballay_icon_small.png";

type CompactOverlayProps = {
  data: LiveMatchOverlayData | null;
  onCollapse: () => void;
};

type AmbientStat = {
  away?: string | number;
  home?: string | number;
  label: string;
};

const ROTATION_INTERVAL_MS = 7000;

export function CompactOverlay({ data, onCollapse }: CompactOverlayProps) {
  const stats = useMemo(() => getAmbientStats(data), [data]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStat = stats[activeIndex % stats.length];

  useEffect(() => {
    setActiveIndex(0);
  }, [stats]);

  useEffect(() => {
    if (stats.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % stats.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [stats.length]);

  return (
    <section className="footballay-ambient" aria-label="Footballay live stat ticker">
      <p className="footballay-ambient__line" title={getAmbientTitle(data, activeStat)}>
        <img className="footballay-ambient__icon" src={footballayIconSmallUrl} alt="" />
        <span className="footballay-ambient__stat">{formatAmbientStat(activeStat)}</span>
      </p>
      <button className="footballay-ambient__close" type="button" onClick={onCollapse} aria-label="Hide Footballay overlay">
        <X aria-hidden size={12} strokeWidth={2.4} />
      </button>
    </section>
  );
}

function getAmbientStats(data: LiveMatchOverlayData | null): AmbientStat[] {
  if (!data) {
    return [{ label: "Waiting for live data" }];
  }

  const stats = [
    { away: data.awayStats?.possession, home: data.homeStats?.possession, label: "Possession" },
    { away: data.awayStats?.shotsOnGoal, home: data.homeStats?.shotsOnGoal, label: "SOT" },
    { away: data.awayStats?.shotsTotal, home: data.homeStats?.shotsTotal, label: "Shots" },
    {
      away: formatCards(data.awayStats?.yellowCards, data.awayStats?.redCards),
      home: formatCards(data.homeStats?.yellowCards, data.homeStats?.redCards),
      label: "Cards"
    }
  ].filter((stat) => stat.home !== undefined || stat.away !== undefined);

  return stats.length ? stats : [{ label: "Waiting for match stats" }];
}

function formatAmbientStat(stat?: AmbientStat): string {
  if (!stat) {
    return "Waiting for live data";
  }

  if (stat.home === undefined && stat.away === undefined) {
    return stat.label;
  }

  return `${stat.label} ${stat.home ?? "-"} - ${stat.away ?? "-"}`;
}

function formatCards(yellowCards?: number, redCards?: number): string | undefined {
  if (yellowCards === undefined && redCards === undefined) {
    return undefined;
  }

  return redCards && redCards > 0 ? `${yellowCards ?? 0}Y ${redCards}R` : `${yellowCards ?? 0}`;
}

function getAmbientTitle(data: LiveMatchOverlayData | null, stat?: AmbientStat): string {
  if (!data || !stat) {
    return "Footballay live stats";
  }

  return `${data.homeTeamName} vs ${data.awayTeamName}: ${formatAmbientStat(stat)}`;
}
