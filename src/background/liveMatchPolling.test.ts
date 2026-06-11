import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
import { defaultSettings } from "@/shared/constants";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { createLiveMatchPollingService } from "./liveMatchPolling";

vi.mock("@/domain/live-match/api", () => ({
  fetchFixtureEventsWithEtag: vi.fn(),
  fetchFixtureInfo: vi.fn(),
  fetchFixtureLineupWithEtag: vi.fn(),
  fetchFixtureStatisticsWithEtag: vi.fn(),
  fetchFixtureStatusWithEtag: vi.fn()
}));

vi.mock("@/domain/live-match/mapper", () => ({
  mapFixtureLiveData: vi.fn()
}));

vi.mock("@/shared/storage", () => ({
  readSettings: vi.fn()
}));

const baseSettings: ExtensionSettings = {
  ...defaultSettings,
  overlayCollapsed: false,
  pollingIntervalMs: 1000,
  selectedFixtureUid: "fixture-1"
};

const fixtureInfo = { uid: "fixture-1-info" } as unknown as FixtureInfoResponse;
const fixtureStatus = { uid: "fixture-1-status" } as unknown as FixtureLiveStatusResponse;
const fixtureStatistics = { uid: "fixture-1-statistics" } as unknown as FixtureStatisticsResponse;
const fixtureEvents = { uid: "fixture-1-events" } as unknown as FixtureEventsResponse;
const fixtureLineup = { uid: "fixture-1-lineup" } as unknown as FixtureLineupResponse;
const overlayData: LiveMatchOverlayData = {
  awayScore: 1,
  awayTeamName: "Away",
  fixtureUid: "fixture-1",
  homeScore: 2,
  homeTeamName: "Home",
  updatedAt: "2026-06-05T00:00:00.000Z"
};

describe("createLiveMatchPollingService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetchFixtureInfo).mockResolvedValue(fixtureInfo);
    vi.mocked(fetchFixtureStatusWithEtag).mockResolvedValue({
      type: "updated",
      data: fixtureStatus,
      etag: "status-etag"
    });
    vi.mocked(fetchFixtureStatisticsWithEtag).mockResolvedValue({
      type: "updated",
      data: fixtureStatistics,
      etag: "statistics-etag"
    });
    vi.mocked(fetchFixtureEventsWithEtag).mockResolvedValue({
      type: "updated",
      data: fixtureEvents,
      etag: "events-etag"
    });
    vi.mocked(fetchFixtureLineupWithEtag).mockResolvedValue({
      type: "updated",
      data: fixtureLineup,
      etag: "lineup-etag"
    });
    vi.mocked(mapFixtureLiveData).mockReturnValue(overlayData);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("does not start polling when extension is disabled", async () => {
    const service = createLiveMatchPollingService({ broadcast: vi.fn() });

    await service.startMatchPollingIfNeeded({
      ...baseSettings,
      extensionEnabled: false
    });

    expect(fetchFixtureInfo).not.toHaveBeenCalled();
    expect(fetchFixtureStatusWithEtag).not.toHaveBeenCalled();
  });

  it("does not start polling when no fixture is selected", async () => {
    const service = createLiveMatchPollingService({ broadcast: vi.fn() });

    await service.startMatchPollingIfNeeded({
      ...baseSettings,
      selectedFixtureUid: undefined
    });

    expect(fetchFixtureInfo).not.toHaveBeenCalled();
    expect(fetchFixtureStatusWithEtag).not.toHaveBeenCalled();
  });

  it("polls once immediately when match polling is needed", async () => {
    const broadcast = vi.fn();
    const service = createLiveMatchPollingService({ broadcast });

    await service.startMatchPollingIfNeeded(baseSettings);

    expect(fetchFixtureInfo).toHaveBeenCalledWith("fixture-1");
    expect(fetchFixtureStatusWithEtag).toHaveBeenCalledWith("fixture-1", undefined);
    expect(fetchFixtureStatisticsWithEtag).toHaveBeenCalledWith("fixture-1", undefined);
    expect(fetchFixtureEventsWithEtag).toHaveBeenCalledWith("fixture-1", undefined);
    expect(fetchFixtureLineupWithEtag).toHaveBeenCalledWith("fixture-1", undefined);
    expect(mapFixtureLiveData).toHaveBeenCalledWith(
      fixtureInfo,
      fixtureStatus,
      fixtureStatistics,
      fixtureEvents,
      fixtureLineup
    );
    expect(broadcast).toHaveBeenLastCalledWith({
      type: "LIVE_MATCH_DATA_UPDATED",
      payload: overlayData
    });

    service.stop();
  });

  it("reuses cached match DTOs when ETag endpoints return not modified", async () => {
    const service = createLiveMatchPollingService({ broadcast: vi.fn() });

    await service.pollOnce(baseSettings);

    vi.mocked(fetchFixtureStatusWithEtag).mockResolvedValueOnce({
      type: "not-modified",
      etag: "status-etag"
    });
    vi.mocked(fetchFixtureStatisticsWithEtag).mockResolvedValueOnce({
      type: "not-modified",
      etag: "statistics-etag"
    });
    vi.mocked(fetchFixtureEventsWithEtag).mockResolvedValueOnce({
      type: "not-modified",
      etag: "events-etag"
    });
    vi.mocked(fetchFixtureLineupWithEtag).mockResolvedValueOnce({
      type: "not-modified",
      etag: "lineup-etag"
    });

    await service.pollOnce(baseSettings);

    expect(fetchFixtureInfo).toHaveBeenCalledTimes(1);
    expect(fetchFixtureStatusWithEtag).toHaveBeenLastCalledWith("fixture-1", "status-etag");
    expect(fetchFixtureStatisticsWithEtag).toHaveBeenLastCalledWith("fixture-1", "statistics-etag");
    expect(fetchFixtureEventsWithEtag).toHaveBeenLastCalledWith("fixture-1", "events-etag");
    expect(fetchFixtureLineupWithEtag).toHaveBeenLastCalledWith("fixture-1", "lineup-etag");
    expect(mapFixtureLiveData).toHaveBeenLastCalledWith(
      fixtureInfo,
      fixtureStatus,
      fixtureStatistics,
      fixtureEvents,
      fixtureLineup
    );
  });

  it("clears cached ETags when the selected fixture changes", async () => {
    const service = createLiveMatchPollingService({ broadcast: vi.fn() });

    await service.pollOnce(baseSettings);
    await service.pollOnce({
      ...baseSettings,
      selectedFixtureUid: "fixture-2"
    });

    expect(fetchFixtureInfo).toHaveBeenCalledTimes(2);
    expect(fetchFixtureInfo).toHaveBeenLastCalledWith("fixture-2");
    expect(fetchFixtureStatusWithEtag).toHaveBeenLastCalledWith("fixture-2", undefined);
    expect(fetchFixtureStatisticsWithEtag).toHaveBeenLastCalledWith("fixture-2", undefined);
    expect(fetchFixtureEventsWithEtag).toHaveBeenLastCalledWith("fixture-2", undefined);
    expect(fetchFixtureLineupWithEtag).toHaveBeenLastCalledWith("fixture-2", undefined);
  });

  it("stops an existing polling interval when polling is no longer needed", async () => {
    const service = createLiveMatchPollingService({ broadcast: vi.fn() });

    await service.startMatchPollingIfNeeded(baseSettings);
    await service.startMatchPollingIfNeeded({
      ...baseSettings,
      extensionEnabled: false
    });
    await vi.advanceTimersByTimeAsync(baseSettings.pollingIntervalMs);

    expect(fetchFixtureStatusWithEtag).toHaveBeenCalledTimes(1);
  });

  it("stops the polling interval", async () => {
    const service = createLiveMatchPollingService({ broadcast: vi.fn() });

    await service.startMatchPollingIfNeeded(baseSettings);
    service.stop();
    await vi.advanceTimersByTimeAsync(baseSettings.pollingIntervalMs);

    expect(fetchFixtureStatusWithEtag).toHaveBeenCalledTimes(1);
  });
});
