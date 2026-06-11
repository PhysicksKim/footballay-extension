import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { t } from "@/shared/i18n/locale";
import { StatLine } from "./StatLine";

type MatchStatsPanelProps = {
  data: LiveMatchOverlayData | null;
};

export function MatchStatsPanel({ data }: MatchStatsPanelProps) {
  if (!data) {
    return <p className="footballay-empty">No stats</p>;
  }

  const statRows = getStatRows(data);

  if (!statRows.length) {
    return <p className="footballay-empty">No stats</p>;
  }

  return (
    <div className="footballay-stats">
      {statRows.map((row) => (
        <StatLine key={row.label} label={row.label} home={row.home} away={row.away} />
      ))}
    </div>
  );
}

function getStatRows(data: LiveMatchOverlayData): Array<{ label: string; home?: string | number; away?: string | number }> {
  return [
    {
      label: t("overlay.stat.expectedGoals"),
      home: data.homeStats?.expectedGoals,
      away: data.awayStats?.expectedGoals
    },
    {
      label: t("overlay.stat.shots"),
      home: data.homeStats?.shotsTotal,
      away: data.awayStats?.shotsTotal
    },
    {
      label: t("overlay.stat.shotsOnGoal"),
      home: data.homeStats?.shotsOnGoal,
      away: data.awayStats?.shotsOnGoal
    },
    {
      label: t("overlay.stat.shotsInsideBox"),
      home: data.homeStats?.shotsInsideBox,
      away: data.awayStats?.shotsInsideBox
    },
    {
      label: t("overlay.stat.possession"),
      home: data.homeStats?.possession,
      away: data.awayStats?.possession
    },
    {
      label: t("overlay.stat.cornerKicks"),
      home: data.homeStats?.cornerKicks,
      away: data.awayStats?.cornerKicks
    },
    {
      label: t("overlay.stat.passesAccuracy"),
      home: formatPercentage(data.homeStats?.passesAccuracyPercentage),
      away: formatPercentage(data.awayStats?.passesAccuracyPercentage)
    },
    {
      label: t("overlay.stat.fouls"),
      home: data.homeStats?.fouls,
      away: data.awayStats?.fouls
    },
    {
      label: t("overlay.stat.offsides"),
      home: data.homeStats?.offsides,
      away: data.awayStats?.offsides
    },
    {
      label: t("overlay.stat.goalkeeperSaves"),
      home: data.homeStats?.goalkeeperSaves,
      away: data.awayStats?.goalkeeperSaves
    },
    {
      label: t("overlay.stat.cards"),
      home: formatCards(data.homeStats?.yellowCards, data.homeStats?.redCards),
      away: formatCards(data.awayStats?.yellowCards, data.awayStats?.redCards)
    }
  ].filter((row) => row.home !== undefined || row.away !== undefined);
}

function formatPercentage(value?: number): string | undefined {
  return value === undefined ? undefined : `${value}%`;
}

function formatCards(yellowCards?: number, redCards?: number): string | undefined {
  if (yellowCards === undefined && redCards === undefined) {
    return undefined;
  }

  return redCards && redCards > 0 ? `${yellowCards ?? 0}Y ${redCards}R` : `${yellowCards ?? 0}`;
}
