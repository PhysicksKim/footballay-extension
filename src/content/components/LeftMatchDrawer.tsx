import '@/content/styles/side-drawer.css';
import '@/content/styles/left-match-drawer.css';
import type { LiveMatchOverlayData } from '@/domain/live-match/types';
import { t } from '@/shared/i18n/locale';
import { MatchEventsTimeline } from './MatchEventsTimeline';
import { MatchStatsPanel } from './MatchStatsPanel';
import { OverlayDivider } from './OverlayDivider';

type LeftMatchDrawerProps = {
    data: LiveMatchOverlayData | null;
};

export function LeftMatchDrawer({ data }: LeftMatchDrawerProps) {
    return (
        <aside
            className="footballay-side-drawer footballay-side-drawer--left"
            aria-label={t('content.drawer.left.title')}
        >
            <div className="footballay-left-drawer">
                <CompactMatchSummary data={data} />
                <OverlayDivider />
                <section className="footballay-left-drawer__section" aria-label={t('content.drawer.stats.title')}>
                    <MatchStatsPanel data={data} />
                </section>
                <OverlayDivider />
                <section className="footballay-left-drawer__section" aria-label={t('content.drawer.events.title')}>
                    <MatchEventsTimeline data={data} />
                </section>
            </div>
        </aside>
    );
}

function CompactMatchSummary({ data }: { data: LiveMatchOverlayData | null }) {
    if (!data) {
        return (
            <section className="footballay-left-drawer__summary footballay-left-drawer__summary--empty">
                {t('content.overlay.waiting.liveData')}
            </section>
        );
    }

    return (
        <section className="footballay-left-drawer__summary">
            <span className="footballay-left-drawer__team">{data.homeTeamName}</span>
            <strong className="footballay-left-drawer__score">
                {data.homeScore} - {data.awayScore}
            </strong>
            <span className="footballay-left-drawer__team">{data.awayTeamName}</span>
            {data.elapsed || data.statusShort ? (
                <em className="footballay-left-drawer__status">
                    {data.elapsed ? `${data.elapsed}'` : data.statusShort}
                </em>
            ) : null}
        </section>
    );
}
