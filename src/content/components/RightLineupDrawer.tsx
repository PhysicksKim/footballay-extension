import { ArrowUp, X } from "lucide-react";
import "@/content/styles/side-drawer.css";
import "@/content/styles/right-lineup-drawer.css";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { t } from "@/shared/i18n/locale";
import {
  buildTeamLineupViewModel,
  findLineupPlayer,
  flattenLineupPlayers,
  type LineupViewPlayer,
  type TeamLineupViewModel
} from "@/content/utils/lineupViewModel";
import goalMarkerUrl from "../../../assets/goal_marker.png";

type RightLineupDrawerProps = {
  data: LiveMatchOverlayData | null;
  onClearSelectedPlayer: () => void;
  onSelectPlayer: (matchPlayerUid: string) => void;
  selectedPlayerUid?: string;
};

export function RightLineupDrawer({
  data,
  onClearSelectedPlayer,
  onSelectPlayer,
  selectedPlayerUid
}: RightLineupDrawerProps) {
  const homeLineup = buildTeamLineupViewModel(data, "home");
  const awayLineup = buildTeamLineupViewModel(data, "away");
  const selectedPlayer = findSelectedPlayer([homeLineup, awayLineup], selectedPlayerUid);

  return (
    <aside className="footballay-side-drawer footballay-side-drawer--right" aria-label={t("content.drawer.right.title")}>
      {homeLineup || awayLineup ? (
        <div className="footballay-lineup-drawer">
          <LineupTeamSection lineup={homeLineup} onSelectPlayer={onSelectPlayer} selectedPlayerUid={selectedPlayerUid} />
          <LineupTeamSection lineup={awayLineup} onSelectPlayer={onSelectPlayer} selectedPlayerUid={selectedPlayerUid} />
        </div>
      ) : (
        <p className="footballay-empty">{t("content.drawer.empty.lineup")}</p>
      )}

      {selectedPlayer ? (
        <PlayerDetailOverlay player={selectedPlayer} onClose={onClearSelectedPlayer} />
      ) : null}
    </aside>
  );
}

function LineupTeamSection({
  lineup,
  onSelectPlayer,
  selectedPlayerUid
}: {
  lineup: TeamLineupViewModel | null;
  onSelectPlayer: (matchPlayerUid: string) => void;
  selectedPlayerUid?: string;
}) {
  if (!lineup) {
    return null;
  }

  return (
    <section className="footballay-lineup-team">
      <div className="footballay-lineup-team__title">
        <strong>{lineup.teamName}</strong>
        {lineup.formation ? <span>{lineup.formation}</span> : null}
      </div>
      <div className="footballay-lineup-pitch">
        {lineup.rows.map((row, rowIndex) => (
          <div className="footballay-lineup-row" key={`${lineup.teamName}-${rowIndex}`}>
            {row.map((player) => (
              <LineupPlayerButton
                key={player.matchPlayerUid}
                player={player}
                selectedPlayerUid={selectedPlayerUid}
                onSelectPlayer={onSelectPlayer}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function LineupPlayerButton({
  onSelectPlayer,
  player,
  selectedPlayerUid
}: {
  onSelectPlayer: (matchPlayerUid: string) => void;
  player: LineupViewPlayer;
  selectedPlayerUid?: string;
}) {
  const activePlayer = getVisiblePlayer(player);

  return (
    <span className="footballay-lineup-player-slot">
      <button
        className={`footballay-lineup-player${
          selectedPlayerUid === activePlayer.matchPlayerUid ? " footballay-lineup-player--selected" : ""
        }`}
        type="button"
        onClick={() => onSelectPlayer(activePlayer.matchPlayerUid)}
      >
        <span className="footballay-lineup-player__content">
          <span className="footballay-lineup-player__marker">
            {activePlayer.substitutedIn ? (
              <span className="footballay-lineup-player__sub-in" aria-label={t("content.drawer.player.substitutedIn")}>
                <ArrowUp aria-hidden size={10} strokeWidth={2.6} />
              </span>
            ) : null}
            <PlayerCards player={activePlayer} />
            {activePlayer.rating !== undefined ? (
              <span className="footballay-lineup-player__rating">{activePlayer.rating.toFixed(1)}</span>
            ) : null}
            <PlayerGoals player={activePlayer} />
            <span className="footballay-lineup-player__number">{activePlayer.number ?? "-"}</span>
          </span>
          <span className="footballay-lineup-player__name">
            {activePlayer.captain ? <span className="footballay-lineup-player__captain" aria-label={t("content.drawer.player.captain")}>C</span> : null}
            {activePlayer.name}
          </span>
        </span>
      </button>
    </span>
  );
}

function PlayerCards({ player }: { player: LineupViewPlayer }) {
  if (!player.yellowCards && !player.redCards) {
    return null;
  }

  const cardClassName = player.redCards
    ? "footballay-lineup-player__card footballay-lineup-player__card--red"
    : "footballay-lineup-player__card";
  const cardLabel = player.redCards
    ? t("content.drawer.player.redCard")
    : t("content.drawer.player.yellowCard");

  return (
    <span className="footballay-lineup-player__cards">
      <span className={cardClassName} aria-label={cardLabel} />
    </span>
  );
}

function PlayerGoals({ player }: { player: LineupViewPlayer }) {
  if (!player.goals && !player.ownGoals) {
    return null;
  }

  return (
    <span className="footballay-lineup-player__goals">
      {Array.from({ length: player.goals }).map((_, index) => (
        <span key={`goal-${index}`} className="footballay-lineup-player__goal" aria-label={t("content.drawer.player.goal")}>
          <img src={goalMarkerUrl} alt="" />
        </span>
      ))}
      {Array.from({ length: player.ownGoals }).map((_, index) => (
        <span key={`own-goal-${index}`} className="footballay-lineup-player__goal footballay-lineup-player__goal--own" aria-label={t("content.drawer.player.ownGoal")}>
          <img src={goalMarkerUrl} alt="" />
        </span>
      ))}
    </span>
  );
}

function PlayerDetailOverlay({ onClose, player }: { onClose: () => void; player: LineupViewPlayer }) {
  return (
    <div className="footballay-player-detail-overlay" role="dialog" aria-label={player.name}>
      <button className="footballay-player-detail-overlay__backdrop" type="button" onClick={onClose} aria-label={t("content.drawer.player.dismissDetail")} />
      <section className="footballay-player-detail">
        <button className="footballay-player-detail__close" type="button" onClick={onClose} aria-label={t("content.drawer.player.closeDetail")}>
          <X aria-hidden size={15} strokeWidth={2.4} />
        </button>
        <div className="footballay-player-detail__name">
          <strong>{player.name}</strong>
          <span>{player.number ? `#${player.number}` : player.position ?? ""}</span>
        </div>
        <dl>
          {getPlayerDetailStats(player).map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function getPlayerDetailStats(player: LineupViewPlayer): Array<{ label: string; value: string | number }> {
  return [
    { label: t("content.drawer.player.rating"), value: player.rating?.toFixed(1) ?? "-" },
    { label: t("content.drawer.player.minutes"), value: player.minutesPlayed ?? "-" },
    { label: t("content.drawer.player.goals"), value: player.goals || "-" },
    { label: t("content.drawer.player.assists"), value: player.assists || "-" },
    { label: t("content.drawer.player.shots"), value: formatPair(player.shotsOn, player.shots) },
    { label: t("content.drawer.player.passes"), value: formatPasses(player) },
    { label: t("content.drawer.player.keyPasses"), value: player.passesKey ?? "-" },
    { label: t("content.drawer.player.tackles"), value: player.tacklesTotal ?? "-" },
    { label: t("content.drawer.player.interceptions"), value: player.interceptions ?? "-" },
    { label: t("content.drawer.player.duels"), value: formatPair(player.duelsWon, player.duelsTotal) },
    { label: t("content.drawer.player.fouls"), value: formatPair(player.foulsCommitted, player.foulsDrawn) }
  ];
}

function formatPair(left?: number, right?: number): string {
  if (left === undefined && right === undefined) {
    return "-";
  }

  return `${left ?? 0}/${right ?? 0}`;
}

function formatPasses(player: LineupViewPlayer): string {
  if (player.passesTotal === undefined && player.passesAccuracy === undefined) {
    return player.passes ?? "-";
  }

  return `${player.passesAccuracy ?? 0}/${player.passesTotal ?? 0}`;
}

function getVisiblePlayer(player: LineupViewPlayer): LineupViewPlayer {
  return player.playerSubstitute ? getVisiblePlayer(player.playerSubstitute) : player;
}

function findSelectedPlayer(lineups: Array<TeamLineupViewModel | null>, selectedPlayerUid?: string): LineupViewPlayer | undefined {
  for (const lineup of lineups) {
    const player = findLineupPlayer(lineup?.players ?? [], selectedPlayerUid);

    if (player) {
      return player;
    }
  }

  return selectedPlayerUid ? lineups.flatMap((lineup) => flattenLineupPlayers(lineup?.players ?? []))[0] : undefined;
}
