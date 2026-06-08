import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FixtureSummary } from "@/domain/live-match/types";
import { defaultSettings } from "@/shared/constants";
import { sendRuntimeMessage } from "@/shared/messages";
import type { RuntimeMessage, RuntimeResponse } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { usePopupStore } from "./store";

vi.mock("@/shared/messages", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/messages")>();

  return {
    ...actual,
    sendRuntimeMessage: vi.fn()
  };
});

const sendRuntimeMessageMock = vi.mocked(sendRuntimeMessage);

const baseFixture: FixtureSummary = {
  available: true,
  awayTeamName: "Away",
  awayScore: null,
  elapsed: null,
  homeTeamName: "Home",
  homeScore: null,
  kickoff: "2026-05-20T12:00:00.000Z",
  round: "Regular Season - 38",
  statusLong: "Not Started",
  statusShort: "NS",
  uid: "fixture-1"
};

const baseLeague = {
  name: "Premier League",
  nameKo: "프리미어리그",
  uid: "league-1"
};

const latestMatchData = {
  awayScore: 1,
  awayTeamName: "Away",
  fixtureUid: "fixture-1",
  homeScore: 2,
  homeTeamName: "Home",
  updatedAt: "2026-05-20T12:00:00.000Z"
};

function resetStore() {
  usePopupStore.setState({
    activeTab: "fixtures",
    data: null,
    error: null,
    fixtureQueryLoading: false,
    fixtures: [],
    leagues: [],
    loadingText: null,
    pageOverlayState: null,
    pageOverlayStateLoading: true,
    settings: defaultSettings
  });
}

function mockRuntimeResponses(fixtures: FixtureSummary[] = []) {
  sendRuntimeMessageMock.mockImplementation(async (message: RuntimeMessage): Promise<RuntimeResponse> => {
    if (message.type === "GET_FIXTURES_BY_LEAGUE") {
      return {
        fixtures,
        ok: true
      };
    }

    if (message.type === "UPDATE_SETTINGS") {
      const normalizedPatch = Object.fromEntries(
        Object.entries(message.payload).map(([key, value]) => [key, value === null ? undefined : value])
      ) as Partial<ExtensionSettings>;

      return {
        ok: true,
        settings: {
          ...usePopupStore.getState().settings,
          ...normalizedPatch
        }
      };
    }

    if (message.type === "SELECT_LEAGUE") {
      return {
        fixtures,
        ok: true,
        settings: {
          ...usePopupStore.getState().settings,
          fixtureDate: message.payload.date,
          fixtureLookupMode: message.payload.mode,
          selectedLeagueUid: message.payload.leagueUid
        }
      };
    }

    if (message.type === "SELECT_FIXTURE") {
      return {
        ok: true,
        settings: {
          ...usePopupStore.getState().settings,
          selectedFixtureDate: message.payload.fixtureDate,
          selectedFixtureUid: message.payload.fixtureUid
        }
      };
    }

    return { ok: true };
  });
}

function mockInitialLoadResponses(fixtures: FixtureSummary[] = []) {
  sendRuntimeMessageMock.mockImplementation(async (message: RuntimeMessage): Promise<RuntimeResponse> => {
    if (message.type === "GET_SETTINGS") {
      return {
        ok: true,
        settings: {
          ...defaultSettings,
          fixtureDate: "2026-05-20",
          selectedLeagueUid: "league-1"
        }
      };
    }

    if (message.type === "GET_LATEST_MATCH_DATA") {
      return {
        data: latestMatchData,
        ok: true
      };
    }

    if (message.type === "GET_AVAILABLE_LEAGUES") {
      return {
        leagues: [baseLeague],
        ok: true
      };
    }

    if (message.type === "GET_FIXTURES_BY_LEAGUE") {
      return {
        fixtures,
        ok: true
      };
    }

    return { ok: true };
  });
}

function mockActiveTab(url: string | null = "https://example.com/watch") {
  globalThis.chrome = {
    tabs: {
      query: vi.fn().mockResolvedValue(url ? [{ id: 1, url }] : []),
      sendMessage: vi.fn().mockRejectedValue(new Error("No content script"))
    }
  } as unknown as typeof chrome;
}

describe("popup store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockActiveTab();
  });

  it("loads settings, latest match data, leagues, fixtures, and page overlay state", async () => {
    mockInitialLoadResponses([baseFixture]);

    await usePopupStore.getState().loadState();

    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({ type: "GET_SETTINGS" });
    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({ type: "GET_LATEST_MATCH_DATA" });
    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({ type: "GET_AVAILABLE_LEAGUES" });
    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "GET_FIXTURES_BY_LEAGUE",
      payload: {
        date: "2026-05-20",
        leagueUid: "league-1",
        mode: "nearest",
        timezone: expect.any(String)
      }
    });
    expect(usePopupStore.getState()).toMatchObject({
      data: latestMatchData,
      fixtures: [baseFixture],
      leagues: [baseLeague],
      loadingText: null,
      pageOverlayState: {
        isSupportedPage: false,
        manualVisible: false,
        url: "https://example.com/watch",
        visible: false
      },
      pageOverlayStateLoading: false,
      settings: {
        fixtureDate: "2026-05-20",
        selectedLeagueUid: "league-1"
      }
    });
  });

  it("applies runtime setting and match data broadcasts", () => {
    usePopupStore.getState().handleRuntimeMessage({
      payload: {
        ...defaultSettings,
        overlayEnabled: false
      },
      type: "SETTINGS_UPDATED"
    });
    usePopupStore.getState().handleRuntimeMessage({
      payload: latestMatchData,
      type: "LIVE_MATCH_DATA_UPDATED"
    });

    expect(usePopupStore.getState().settings.overlayEnabled).toBe(false);
    expect(usePopupStore.getState().data).toEqual(latestMatchData);
  });

  it("selects a league with nearest lookup and syncs the resolved fixture date", async () => {
    mockRuntimeResponses([baseFixture]);

    await usePopupStore.getState().selectLeague("league-1");

    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "SELECT_LEAGUE",
      payload: {
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        leagueUid: "league-1",
        mode: "nearest",
        timezone: expect.any(String)
      }
    });
    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      payload: {
        fixtureDate: "2026-05-20"
      }
    });
    expect(usePopupStore.getState()).toMatchObject({
      fixtures: [baseFixture],
      loadingText: null,
      settings: {
        fixtureDate: "2026-05-20",
        selectedLeagueUid: "league-1"
      }
    });
  });

  it("keeps the selected fixture while browsing another date", async () => {
    const nextFixture = {
      ...baseFixture,
      kickoff: "2026-05-21T12:00:00.000Z",
      uid: "fixture-2"
    };
    mockRuntimeResponses([nextFixture]);

    usePopupStore.setState({
      fixtures: [baseFixture],
      settings: {
        ...defaultSettings,
        fixtureDate: "2026-05-20",
        selectedFixtureDate: "2026-05-20",
        selectedFixtureUid: "fixture-1",
        selectedLeagueUid: "league-1"
      }
    });

    await usePopupStore.getState().updateFixtureQuery({
      fixtureDate: "2026-05-21",
      fixtureLookupMode: "exact"
    });

    expect(usePopupStore.getState().settings).toMatchObject({
      fixtureDate: "2026-05-21",
      fixtureLookupMode: "exact",
      selectedFixtureDate: "2026-05-20",
      selectedFixtureUid: "fixture-1"
    });
    expect(usePopupStore.getState().fixtures).toEqual([nextFixture]);
    expect(sendRuntimeMessageMock).not.toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      payload: expect.objectContaining({
        selectedFixtureDate: null,
        selectedFixtureUid: null
      })
    });
  });

  it("clears the selected fixture when selecting it again", async () => {
    mockRuntimeResponses();
    usePopupStore.setState({
      data: {
        awayScore: 1,
        awayTeamName: "Away",
        fixtureUid: "fixture-1",
        homeScore: 2,
        homeTeamName: "Home",
        updatedAt: "2026-05-20T12:00:00.000Z"
      },
      fixtures: [baseFixture],
      settings: {
        ...defaultSettings,
        selectedFixtureDate: "2026-05-20",
        selectedFixtureUid: "fixture-1"
      }
    });

    await usePopupStore.getState().selectFixture("fixture-1");

    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      payload: {
        selectedFixtureDate: null,
        selectedFixtureUid: null
      }
    });
    expect(usePopupStore.getState().settings.selectedFixtureUid).toBeUndefined();
    expect(usePopupStore.getState().settings.selectedFixtureDate).toBeUndefined();
    expect(usePopupStore.getState().data).toBeNull();
  });

  it("selects a fixture with its fixture date", async () => {
    mockRuntimeResponses();
    usePopupStore.setState({
      fixtures: [baseFixture],
      settings: {
        ...defaultSettings,
        fixtureDate: "2026-05-19"
      }
    });

    await usePopupStore.getState().selectFixture("fixture-1");

    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "SELECT_FIXTURE",
      payload: {
        fixtureDate: "2026-05-20",
        fixtureUid: "fixture-1"
      }
    });
    expect(usePopupStore.getState().settings.selectedFixtureUid).toBe("fixture-1");
    expect(usePopupStore.getState().settings.selectedFixtureDate).toBe("2026-05-20");
  });

  it("returns to the selected fixture date with exact lookup", async () => {
    mockRuntimeResponses([baseFixture]);
    usePopupStore.setState({
      settings: {
        ...defaultSettings,
        fixtureDate: "2026-05-21",
        selectedFixtureDate: "2026-05-20",
        selectedFixtureUid: "fixture-1",
        selectedLeagueUid: "league-1"
      }
    });

    await usePopupStore.getState().returnToSelectedFixtureDate();

    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "GET_FIXTURES_BY_LEAGUE",
      payload: {
        date: "2026-05-20",
        leagueUid: "league-1",
        mode: "exact",
        timezone: expect.any(String)
      }
    });
    expect(usePopupStore.getState().settings).toMatchObject({
      fixtureDate: "2026-05-20",
      fixtureLookupMode: "exact",
      selectedFixtureDate: "2026-05-20",
      selectedFixtureUid: "fixture-1"
    });
  });
});
