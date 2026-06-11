import { fetchAvailableLeagues, fetchFixturesByLeague } from '@/domain/live-match/api';
import type { AvailableLeague, FixtureSummary } from '@/domain/live-match/types';
import type { ExtensionSettings } from '@/shared/overlay/types';
import type { RuntimeMessage, RuntimeResponse, RuntimeSettingsPatch } from '@/shared/messages';
import {
    readSettings,
    readSiteOverlayDrawerSide,
    readSiteOverlayVisible,
    writeSettings,
    writeSiteOverlayDrawerSide,
    writeSiteOverlayVisible
} from '@/shared/storage';
import { normalizeSettingsPatch } from '@/shared/overlay/settings';
import { createLiveMatchPollingService } from './liveMatchPolling';

export type LiveMatchBackgroundController = {
    handleRuntimeMessage: (message: RuntimeMessage, sender?: chrome.runtime.MessageSender) => Promise<RuntimeResponse>;
    handleTabRemoved: (tabId: number) => void;
    initialize: () => Promise<void>;
    startMatchPollingIfNeed: (existingSettings?: ExtensionSettings) => Promise<void>;
    stopPolling: () => void;
};

export function createLiveMatchBackgroundController(): LiveMatchBackgroundController {
    let availableLeagues: AvailableLeague[] = [];
    let latestFixtures: FixtureSummary[] = [];
    const contentOverlayTabIds = new Set<number>();
    const pollingService = createLiveMatchPollingService({ broadcast });

    async function handleRuntimeMessage(
        message: RuntimeMessage,
        sender?: chrome.runtime.MessageSender,
    ): Promise<RuntimeResponse> {
        try {
            switch (message.type) {
                case 'GET_SETTINGS': {
                    return { ok: true, settings: await readSettings() };
                }
                case 'UPDATE_SETTINGS': {
                    const settings = await updateSettings(message.payload);
                    return { ok: true, settings };
                }
                case 'GET_AVAILABLE_LEAGUES': {
                    availableLeagues = await fetchAvailableLeagues();
                    return { ok: true, leagues: availableLeagues };
                }
                case 'GET_FIXTURES_BY_LEAGUE': {
                    latestFixtures = await fetchFixturesByLeague(message.payload.leagueUid, {
                        date: message.payload.date,
                        mode: message.payload.mode,
                        timezone: message.payload.timezone,
                    });
                    return { ok: true, fixtures: latestFixtures };
                }
                case 'SELECT_LEAGUE': {
                    const settings = await updateSettings({
                        selectedLeagueUid: message.payload.leagueUid,
                        selectedFixtureUid: undefined,
                        selectedFixtureDate: undefined,
                        fixtureDate: message.payload.date,
                        fixtureLookupMode: message.payload.mode,
                    });
                    pollingService.clearLatestMatchData();
                    latestFixtures = await fetchFixturesByLeague(message.payload.leagueUid, {
                        date: message.payload.date,
                        mode: message.payload.mode,
                        timezone: message.payload.timezone,
                    });
                    return { ok: true, settings, fixtures: latestFixtures };
                }
                case 'SELECT_FIXTURE': {
                    const settings = await updateSettings({
                        selectedFixtureUid: message.payload.fixtureUid,
                        selectedFixtureDate: message.payload.fixtureDate,
                    });
                    return { ok: true, settings };
                }
                case 'START_POLLING': {
                    await startMatchPollingIfNeed();
                    return { ok: true };
                }
                case 'STOP_POLLING': {
                    pollingService.stop();
                    return { ok: true };
                }
                case 'GET_LATEST_MATCH_DATA': {
                    return { ok: true, data: await pollingService.getLatestMatchData() };
                }
                case 'GET_SITE_OVERLAY_DRAWER': {
                    return { ok: true, drawerSide: await readSiteOverlayDrawerSide(message.payload.url) };
                }
                case 'GET_SITE_OVERLAY_VISIBILITY': {
                    return { ok: true, visible: await readSiteOverlayVisible(message.payload.url) };
                }
                case 'SET_SITE_OVERLAY_DRAWER': {
                    return {
                        ok: true,
                        drawerSide: await writeSiteOverlayDrawerSide(message.payload.url, message.payload.drawerSide),
                    };
                }
                case 'SET_SITE_OVERLAY_VISIBILITY': {
                    return {
                        ok: true,
                        visible: await writeSiteOverlayVisible(message.payload.url, message.payload.visible),
                    };
                }
                case 'REGISTER_CONTENT_OVERLAY': {
                    registerContentOverlay(sender);
                    return { ok: true };
                }
                case 'UNREGISTER_CONTENT_OVERLAY': {
                    unregisterContentOverlay(sender);
                    return { ok: true };
                }
                case 'SETTINGS_UPDATED':
                case 'LIVE_MATCH_DATA_UPDATED': {
                    return { ok: true };
                }
                default: {
                    return { ok: false, error: 'Unknown message type' };
                }
            }
        } catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? error.message : 'Unknown runtime error',
            };
        }
    }

    function registerContentOverlay(sender?: chrome.runtime.MessageSender): void {
        const tabId = sender?.tab?.id;
        if (typeof tabId === 'number') {
            contentOverlayTabIds.add(tabId);
        }
    }

    function unregisterContentOverlay(sender?: chrome.runtime.MessageSender): void {
        const tabId = sender?.tab?.id;
        if (typeof tabId === 'number') {
            contentOverlayTabIds.delete(tabId);
        }
    }

    function handleTabRemoved(tabId: number): void {
        contentOverlayTabIds.delete(tabId);
    }

    async function updateSettings(patch: RuntimeSettingsPatch | Partial<ExtensionSettings>): Promise<ExtensionSettings> {
        const normalizedPatch = normalizeSettingsPatch(patch);
        const settings = await writeSettings(normalizedPatch);
        broadcast({ type: 'SETTINGS_UPDATED', payload: settings });

        if ('selectedFixtureUid' in normalizedPatch && !settings.selectedFixtureUid) {
            pollingService.clearLatestMatchData();
        }

        await startMatchPollingIfNeed(settings);

        return settings;
    }

    async function initialize(): Promise<void> {
        await startMatchPollingIfNeed();
    }

    async function startMatchPollingIfNeed(existingSettings?: ExtensionSettings): Promise<void> {
        await pollingService.startMatchPollingIfNeeded(existingSettings);
    }

    function stopPolling(): void {
        pollingService.stop();
    }

    function broadcast(message: RuntimeMessage): void {
        void chrome.runtime.sendMessage(message).catch(() => undefined);
        void broadcastToRegisteredContentOverlays(message);
    }

    async function broadcastToRegisteredContentOverlays(message: RuntimeMessage): Promise<void> {
        await Promise.all(
            [...contentOverlayTabIds].map(async (tabId) => {
                try {
                    await chrome.tabs.sendMessage(tabId, message);
                } catch {
                    contentOverlayTabIds.delete(tabId);
                }
            }),
        );
    }

    return {
        handleRuntimeMessage,
        handleTabRemoved,
        initialize,
        startMatchPollingIfNeed,
        stopPolling,
    };
}
