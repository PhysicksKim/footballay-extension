import { fetchAvailableLeagues, fetchFixturesByLeague, fetchLiveMatchOverlayData } from "@/domain/live-match/api";
import type { AvailableLeague, FixtureSummary, LiveMatchOverlayData } from "@/domain/live-match/types";
import type { ExtensionSettings } from "@/shared/overlay/types";
import type { RuntimeMessage, RuntimeResponse } from "@/shared/messages";
import { readSettings, writeSettings } from "@/shared/storage";

export type LiveMatchBackgroundController = {
  handleRuntimeMessage: (message: RuntimeMessage) => Promise<RuntimeResponse>;
  startPolling: (existingSettings?: ExtensionSettings) => Promise<void>;
  stopPolling: () => void;
};

export function createLiveMatchBackgroundController(): LiveMatchBackgroundController {
  let latestMatchData: LiveMatchOverlayData | null = null;
  let availableLeagues: AvailableLeague[] = [];
  let latestFixtures: FixtureSummary[] = [];
  let pollingTimer: ReturnType<typeof setInterval> | undefined;

  async function handleRuntimeMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
    try {
      switch (message.type) {
        case "GET_SETTINGS": {
          return { ok: true, settings: await readSettings() };
        }
        case "UPDATE_SETTINGS": {
          const settings = await updateSettings(message.payload);
          return { ok: true, settings };
        }
        case "GET_AVAILABLE_LEAGUES": {
          availableLeagues = await fetchAvailableLeagues();
          return { ok: true, leagues: availableLeagues };
        }
        case "GET_FIXTURES_BY_LEAGUE": {
          latestFixtures = await fetchFixturesByLeague(message.payload.leagueUid, {
            date: message.payload.date,
            mode: message.payload.mode,
            timezone: message.payload.timezone
          });
          return { ok: true, fixtures: latestFixtures };
        }
        case "SELECT_LEAGUE": {
          const settings = await updateSettings({
            selectedLeagueUid: message.payload.leagueUid,
            selectedFixtureUid: undefined,
            fixtureDate: message.payload.date,
            fixtureLookupMode: message.payload.mode
          });
          latestMatchData = null;
          latestFixtures = await fetchFixturesByLeague(message.payload.leagueUid, {
            date: message.payload.date,
            mode: message.payload.mode,
            timezone: message.payload.timezone
          });
          broadcast({ type: "LIVE_MATCH_DATA_UPDATED", payload: latestMatchData });
          return { ok: true, settings, fixtures: latestFixtures };
        }
        case "SELECT_FIXTURE": {
          const settings = await updateSettings({
            selectedFixtureUid: message.payload.fixtureUid
          });
          await pollOnce(settings);
          return { ok: true, settings };
        }
        case "START_POLLING": {
          await startPolling();
          return { ok: true };
        }
        case "STOP_POLLING": {
          stopPolling();
          return { ok: true };
        }
        case "GET_LATEST_MATCH_DATA": {
          if (!latestMatchData) {
            await pollOnce(await readSettings());
          }
          return { ok: true, data: latestMatchData };
        }
        case "SETTINGS_UPDATED":
        case "LIVE_MATCH_DATA_UPDATED": {
          return { ok: true };
        }
        default: {
          return { ok: false, error: "Unknown message type" };
        }
      }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown runtime error"
      };
    }
  }

  async function updateSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const settings = await writeSettings(patch);
    broadcast({ type: "SETTINGS_UPDATED", payload: settings });

    if (settings.overlayEnabled) {
      await startPolling(settings);
    } else {
      stopPolling();
    }

    return settings;
  }

  async function startPolling(existingSettings?: ExtensionSettings): Promise<void> {
    const settings = existingSettings ?? (await readSettings());

    if (!settings.overlayEnabled) {
      stopPolling();
      return;
    }

    stopPolling();
    await pollOnce(settings);

    pollingTimer = setInterval(() => {
      void pollOnce();
    }, settings.pollingIntervalMs);
  }

  function stopPolling(): void {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = undefined;
    }
  }

  async function pollOnce(existingSettings?: ExtensionSettings): Promise<void> {
    const settings = existingSettings ?? (await readSettings());
    latestMatchData = await fetchLiveMatchOverlayData(settings.selectedFixtureUid);
    broadcast({ type: "LIVE_MATCH_DATA_UPDATED", payload: latestMatchData });
  }

  function broadcast(message: RuntimeMessage): void {
    void chrome.runtime.sendMessage(message).catch(() => undefined);
  }

  return {
    handleRuntimeMessage,
    startPolling,
    stopPolling
  };
}
