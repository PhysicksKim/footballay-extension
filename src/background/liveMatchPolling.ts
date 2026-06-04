import {
  fetchFixtureEventsWithEtag,
  fetchFixtureInfo,
  fetchFixtureLineupWithEtag,
  fetchFixtureStatisticsWithEtag,
  fetchFixtureStatusWithEtag
} from "@/domain/live-match/api";
import type {
  FixtureEventsResponse,
  FixtureInfoResponse,
  FixtureLineupResponse,
  FixtureLiveStatusResponse,
  FixtureStatisticsResponse
} from "@/domain/live-match/backendTypes";
import { mapFixtureLiveData } from "@/domain/live-match/mapper";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import type { RuntimeMessage } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { readSettings } from "@/shared/storage";

type LiveMatchPollingOptions = {
  broadcast: (message: RuntimeMessage) => void;
};

export type LiveMatchPollingService = {
  clearLatestMatchData: () => void;
  getLatestMatchData: () => Promise<LiveMatchOverlayData | null>;
  pollOnce: (existingSettings?: ExtensionSettings) => Promise<void>;
  startMatchPollingIfNeeded: (existingSettings?: ExtensionSettings) => Promise<void>;
  stop: () => void;
};

export function createLiveMatchPollingService({
  broadcast
}: LiveMatchPollingOptions): LiveMatchPollingService {
  let latestMatchData: LiveMatchOverlayData | null = null;
  let pollingTimer: ReturnType<typeof setInterval> | undefined;
  let cachedFixtureUid: string | undefined;
  let cachedInfo: FixtureInfoResponse | undefined;
  let cachedStatus: FixtureLiveStatusResponse | undefined;
  let cachedStatistics: FixtureStatisticsResponse | undefined;
  let cachedEvents: FixtureEventsResponse | undefined;
  let cachedLineup: FixtureLineupResponse | undefined;
  let statusEtag: string | undefined;
  let statisticsEtag: string | undefined;
  let eventsEtag: string | undefined;
  let lineupEtag: string | undefined;

  function clearLatestMatchData(): void {
    latestMatchData = null;
    cachedFixtureUid = undefined;
    cachedInfo = undefined;
    cachedStatus = undefined;
    cachedStatistics = undefined;
    cachedEvents = undefined;
    cachedLineup = undefined;
    statusEtag = undefined;
    statisticsEtag = undefined;
    eventsEtag = undefined;
    lineupEtag = undefined;
    broadcast({ type: "LIVE_MATCH_DATA_UPDATED", payload: latestMatchData });
  }

  async function getLatestMatchData(): Promise<LiveMatchOverlayData | null> {
    if (!latestMatchData) {
      await pollOnce(await readSettings());
    }

    return latestMatchData;
  }

  async function pollOnce(existingSettings?: ExtensionSettings): Promise<void> {
    const settings = existingSettings ?? (await readSettings());
    const fixtureUid = settings.selectedFixtureUid;

    if (!fixtureUid) {
      clearLatestMatchData();
      return;
    }

    if (cachedFixtureUid !== fixtureUid) {
      clearLatestMatchData();
      cachedFixtureUid = fixtureUid;
    }

    const [info, status, statistics, events, lineup] = await Promise.all([
      cachedInfo ? Promise.resolve(cachedInfo) : fetchFixtureInfo(fixtureUid),
      fetchFixtureStatusWithEtag(fixtureUid, statusEtag),
      fetchFixtureStatisticsWithEtag(fixtureUid, statisticsEtag),
      fetchFixtureEventsWithEtag(fixtureUid, eventsEtag),
      fetchFixtureLineupWithEtag(fixtureUid, lineupEtag)
    ]);

    cachedInfo = info;

    if (status.etag) {
      statusEtag = status.etag;
    }

    if (status.type === "updated") {
      cachedStatus = status.data;
    }

    if (statistics.etag) {
      statisticsEtag = statistics.etag;
    }

    if (statistics.type === "updated") {
      cachedStatistics = statistics.data;
    }

    if (events.etag) {
      eventsEtag = events.etag;
    }

    if (events.type === "updated") {
      cachedEvents = events.data;
    }

    if (lineup.etag) {
      lineupEtag = lineup.etag;
    }

    if (lineup.type === "updated") {
      cachedLineup = lineup.data;
    }

    if (!cachedStatus || !cachedStatistics) {
      latestMatchData = null;
      broadcast({ type: "LIVE_MATCH_DATA_UPDATED", payload: latestMatchData });
      return;
    }

    latestMatchData = mapFixtureLiveData(
      cachedInfo,
      cachedStatus,
      cachedStatistics,
      cachedEvents,
      cachedLineup
    );
    broadcast({ type: "LIVE_MATCH_DATA_UPDATED", payload: latestMatchData });
  }

  async function startMatchPollingIfNeeded(existingSettings?: ExtensionSettings): Promise<void> {
    const settings = existingSettings ?? (await readSettings());

    if (!settings.overlayEnabled || !settings.selectedFixtureUid) {
      stop();
      return;
    }

    stop();
    await pollOnce(settings);

    pollingTimer = setInterval(() => {
      void pollOnce();
    }, settings.pollingIntervalMs);
  }

  function stop(): void {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = undefined;
    }
  }

  return {
    clearLatestMatchData,
    getLatestMatchData,
    pollOnce,
    startMatchPollingIfNeeded,
    stop
  };
}
