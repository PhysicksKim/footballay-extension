import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { t } from "@/shared/i18n/locale";
import type { MessageKey } from "@/shared/i18n/messages";
import footballayIconSmallUrl from "../../../assets/footballay_icon_small.png";

type CompactOverlayProps = {
  data: LiveMatchOverlayData | null;
  onCollapse: () => void;
};

type AmbientStat = {
  away?: string | number;
  home?: string | number;
  labelKey: MessageKey;
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
    <section className="footballay-ambient" aria-label={t("content.overlay.aria.ticker")}>
      <p className="footballay-ambient__line" title={getAmbientTitle(data, activeStat)}>
        <img className="footballay-ambient__icon" src={footballayIconSmallUrl} alt="" />
        <span className="footballay-ambient__stat">{formatAmbientStat(activeStat)}</span>
      </p>
      <button
        className="footballay-ambient__close"
        type="button"
        onClick={onCollapse}
        aria-label={t("content.overlay.aria.hide")}
      >
        <X aria-hidden size={12} strokeWidth={2.4} />
      </button>
    </section>
  );
}

function getAmbientStats(data: LiveMatchOverlayData | null): AmbientStat[] {
  if (!data) {
    return [{ labelKey: "content.overlay.waiting.liveData" }];
  }

  const stats: AmbientStat[] = [
    { away: data.awayStats?.possession, home: data.homeStats?.possession, labelKey: "overlay.stat.possession" },
    { away: data.awayStats?.shotsOnGoal, home: data.homeStats?.shotsOnGoal, labelKey: "overlay.stat.shotsOnGoal" },
    { away: data.awayStats?.shotsTotal, home: data.homeStats?.shotsTotal, labelKey: "overlay.stat.shots" },
    {
      away: formatCards(data.awayStats?.yellowCards, data.awayStats?.redCards),
      home: formatCards(data.homeStats?.yellowCards, data.homeStats?.redCards),
      labelKey: "overlay.stat.cards"
    }
  ];
  const availableStats = stats.filter((stat) => stat.home !== undefined || stat.away !== undefined);

  return availableStats.length ? availableStats : [{ labelKey: "content.overlay.waiting.matchStats" }];
}

function formatAmbientStat(stat?: AmbientStat): string {
  if (!stat) {
    return t("content.overlay.waiting.liveData");
  }

  if (stat.home === undefined && stat.away === undefined) {
    return t(stat.labelKey);
  }

  return `${t(stat.labelKey)} ${stat.home ?? "-"} - ${stat.away ?? "-"}`;
}

function formatCards(yellowCards?: number, redCards?: number): string | undefined {
  if (yellowCards === undefined && redCards === undefined) {
    return undefined;
  }

  return redCards && redCards > 0 ? `${yellowCards ?? 0}Y ${redCards}R` : `${yellowCards ?? 0}`;
}

function getAmbientTitle(data: LiveMatchOverlayData | null, stat?: AmbientStat): string {
  if (!data || !stat) {
    return t("content.overlay.title.liveStats");
  }

  return `${data.homeTeamName} vs ${data.awayTeamName}: ${formatAmbientStat(stat)}`;
}
