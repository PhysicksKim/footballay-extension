import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FixtureSummary } from "@/domain/live-match/types";
import { defaultSettings } from "@/shared/constants";
import { t } from "@/shared/i18n/locale";
import { sendRuntimeMessage } from "@/shared/messages";
import type { RuntimeMessage, RuntimeResponse } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import {
  navigateFixtureDate,
  returnToSelectedFixtureDate,
  selectFixture,
  selectLeague,
  updateFixtureQuery
} from "./actions/popupFixtureActions";
import { loadPopupState } from "./actions/popupLifecycleActions";
import {
  hideOverlayOnCurrentPage,
  showOverlayOnCurrentPage
} from "./actions/popupPageOverlayActions";
import { handlePopupRuntimeMessage } from "./actions/popupRuntimeActions";
import { updatePopupSettings } from "./actions/popupSettingsActions";
import { usePopupFixtureStore } from "./stores/popupFixtureStore";
import { usePopupLiveDataStore } from "./stores/popupLiveDataStore";
import { usePopupPageOverlayStore } from "./stores/popupPageOverlayStore";
import { usePopupSettingsStore } from "./stores/popupSettingsStore";
import { usePopupUiStore } from "./stores/popupUiStore";

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

function resetPopupStores() {
  usePopupUiStore.setState({
    activeTab: "fixtures",
    error: null
  });
  usePopupSettingsStore.setState({
    settings: defaultSettings
  });
  usePopupFixtureStore.setState({
    fixtureQueryLoading: false,
    fixtures: [],
    leagues: [],
    loadingText: null
  });
  usePopupLiveDataStore.setState({
    data: null
  });
  usePopupPageOverlayStore.setState({
    pageOverlayState: null,
    pageOverlayStateLoading: true
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
          ...usePopupSettingsStore.getState().settings,
          ...normalizedPatch
        }
      };
    }

    if (message.type === "SELECT_LEAGUE") {
      return {
        fixtures,
        ok: true,
        settings: {
          ...usePopupSettingsStore.getState().settings,
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
          ...usePopupSettingsStore.getState().settings,
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

function mockActiveTab(
  url: string | null = "https://example.com/watch",
  sendMessageResponse?: RuntimeResponse
) {
  globalThis.chrome = {
    tabs: {
      query: vi.fn().mockResolvedValue(url ? [{ id: 1, url }] : []),
      sendMessage: sendMessageResponse
        ? vi.fn().mockResolvedValue(sendMessageResponse)
        : vi.fn().mockRejectedValue(new Error("No content script"))
    }
  } as unknown as typeof chrome;
}

describe("popup split store actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPopupStores();
    mockActiveTab();
  });

  it("loads settings, latest match data, leagues, fixtures, and page overlay state", async () => {
    mockInitialLoadResponses([baseFixture]);

    await loadPopupState();

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
    expect(usePopupLiveDataStore.getState().data).toEqual(latestMatchData);
    expect(usePopupFixtureStore.getState()).toMatchObject({
      fixtures: [baseFixture],
      leagues: [baseLeague],
      loadingText: null
    });
    expect(usePopupPageOverlayStore.getState()).toMatchObject({
      pageOverlayState: {
        isSupportedPage: false,
        siteOverlayVisible: false,
        url: "https://example.com/watch",
        visible: false
      },
      pageOverlayStateLoading: false
    });
    expect(usePopupSettingsStore.getState().settings).toMatchObject({
      fixtureDate: "2026-05-20",
      selectedLeagueUid: "league-1"
    });
  });

  it("keeps lifecycle loading balanced and surfaces initial fixture load failures", async () => {
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
          error: "Initial fixture load failed",
          ok: false
        };
      }

      return { ok: true };
    });

    await loadPopupState();

    expect(usePopupFixtureStore.getState()).toMatchObject({
      fixtures: [],
      leagues: [baseLeague],
      loadingText: null
    });
    expect(usePopupUiStore.getState().error).toBe("Initial fixture load failed");
  });

  it("applies runtime setting and match data broadcasts", () => {
    handlePopupRuntimeMessage({
      payload: {
        ...defaultSettings,
        extensionEnabled: false
      },
      type: "SETTINGS_UPDATED"
    });
    handlePopupRuntimeMessage({
      payload: latestMatchData,
      type: "LIVE_MATCH_DATA_UPDATED"
    });

    expect(usePopupSettingsStore.getState().settings.extensionEnabled).toBe(false);
    expect(usePopupLiveDataStore.getState().data).toEqual(latestMatchData);
  });

  it("surfaces settings update failures without changing the settings snapshot", async () => {
    sendRuntimeMessageMock.mockResolvedValue({
      error: "Settings failed",
      ok: false
    });

    await updatePopupSettings({ extensionEnabled: false });

    expect(usePopupSettingsStore.getState().settings.extensionEnabled).toBe(true);
    expect(usePopupUiStore.getState().error).toBe("Settings failed");
  });

  it("selects a league with nearest lookup and syncs the resolved fixture date", async () => {
    mockRuntimeResponses([baseFixture]);

    await selectLeague("league-1");

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
    expect(usePopupFixtureStore.getState()).toMatchObject({
      fixtures: [baseFixture],
      loadingText: null
    });
    expect(usePopupSettingsStore.getState().settings).toMatchObject({
      fixtureDate: "2026-05-20",
      selectedLeagueUid: "league-1"
    });
  });

  it("clears league selection and fixtures when the league is deselected", async () => {
    mockRuntimeResponses([baseFixture]);
    usePopupFixtureStore.setState({
      fixtures: [baseFixture]
    });
    usePopupSettingsStore.setState({
      settings: {
        ...defaultSettings,
        fixtureDate: "2026-05-20",
        selectedFixtureDate: "2026-05-20",
        selectedFixtureUid: "fixture-1",
        selectedLeagueUid: "league-1"
      }
    });

    await selectLeague("");

    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      payload: {
        selectedFixtureDate: null,
        selectedFixtureUid: null,
        selectedLeagueUid: null
      }
    });
    expect(usePopupFixtureStore.getState()).toMatchObject({
      fixtures: [],
      loadingText: null
    });
    expect(usePopupSettingsStore.getState().settings.selectedLeagueUid).toBeUndefined();
  });

  it("keeps the selected fixture while browsing another date", async () => {
    const nextFixture = {
      ...baseFixture,
      kickoff: "2026-05-21T12:00:00.000Z",
      uid: "fixture-2"
    };
    mockRuntimeResponses([nextFixture]);

    usePopupFixtureStore.setState({
      fixtures: [baseFixture]
    });
    usePopupSettingsStore.setState({
      settings: {
        ...defaultSettings,
        fixtureDate: "2026-05-20",
        selectedFixtureDate: "2026-05-20",
        selectedFixtureUid: "fixture-1",
        selectedLeagueUid: "league-1"
      }
    });

    await updateFixtureQuery({
      fixtureDate: "2026-05-21",
      fixtureLookupMode: "exact"
    });

    expect(usePopupSettingsStore.getState().settings).toMatchObject({
      fixtureDate: "2026-05-21",
      fixtureLookupMode: "exact",
      selectedFixtureDate: "2026-05-20",
      selectedFixtureUid: "fixture-1"
    });
    expect(usePopupFixtureStore.getState().fixtures).toEqual([nextFixture]);
    expect(sendRuntimeMessageMock).not.toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      payload: expect.objectContaining({
        selectedFixtureDate: null,
        selectedFixtureUid: null
      })
    });
  });

  it("keeps fixture query loading balanced and surfaces fixture load failures", async () => {
    sendRuntimeMessageMock.mockImplementation(async (message: RuntimeMessage): Promise<RuntimeResponse> => {
      if (message.type === "GET_FIXTURES_BY_LEAGUE") {
        return {
          error: "Fixture load failed",
          ok: false
        };
      }

      return { ok: true };
    });
    usePopupSettingsStore.setState({
      settings: {
        ...defaultSettings,
        fixtureDate: "2026-05-20",
        selectedLeagueUid: "league-1"
      }
    });

    await updateFixtureQuery({
      fixtureDate: "2026-05-21",
      fixtureLookupMode: "exact"
    });

    expect(usePopupFixtureStore.getState().fixtureQueryLoading).toBe(false);
    expect(usePopupUiStore.getState().error).toBe("Fixture load failed");
    expect(sendRuntimeMessageMock).not.toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      payload: expect.anything()
    });
  });

  it("clears the selected fixture when selecting it again", async () => {
    mockRuntimeResponses();
    usePopupLiveDataStore.setState({
      data: {
        awayScore: 1,
        awayTeamName: "Away",
        fixtureUid: "fixture-1",
        homeScore: 2,
        homeTeamName: "Home",
        updatedAt: "2026-05-20T12:00:00.000Z"
      }
    });
    usePopupFixtureStore.setState({
      fixtures: [baseFixture]
    });
    usePopupSettingsStore.setState({
      settings: {
        ...defaultSettings,
        selectedFixtureDate: "2026-05-20",
        selectedFixtureUid: "fixture-1"
      }
    });

    await selectFixture("fixture-1");

    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      payload: {
        selectedFixtureDate: null,
        selectedFixtureUid: null
      }
    });
    expect(usePopupSettingsStore.getState().settings.selectedFixtureUid).toBeUndefined();
    expect(usePopupSettingsStore.getState().settings.selectedFixtureDate).toBeUndefined();
    expect(usePopupLiveDataStore.getState().data).toBeNull();
  });

  it("selects a fixture with its fixture date", async () => {
    mockRuntimeResponses();
    usePopupFixtureStore.setState({
      fixtures: [baseFixture]
    });
    usePopupSettingsStore.setState({
      settings: {
        ...defaultSettings,
        fixtureDate: "2026-05-19"
      }
    });

    await selectFixture("fixture-1");

    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "SELECT_FIXTURE",
      payload: {
        fixtureDate: "2026-05-20",
        fixtureUid: "fixture-1"
      }
    });
    expect(usePopupSettingsStore.getState().settings.selectedFixtureUid).toBe("fixture-1");
    expect(usePopupSettingsStore.getState().settings.selectedFixtureDate).toBe("2026-05-20");
  });

  it("returns to the selected fixture date with exact lookup", async () => {
    mockRuntimeResponses([baseFixture]);
    usePopupSettingsStore.setState({
      settings: {
        ...defaultSettings,
        fixtureDate: "2026-05-21",
        selectedFixtureDate: "2026-05-20",
        selectedFixtureUid: "fixture-1",
        selectedLeagueUid: "league-1"
      }
    });

    await returnToSelectedFixtureDate();

    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "GET_FIXTURES_BY_LEAGUE",
      payload: {
        date: "2026-05-20",
        leagueUid: "league-1",
        mode: "exact",
        timezone: expect.any(String)
      }
    });
    expect(usePopupSettingsStore.getState().settings).toMatchObject({
      fixtureDate: "2026-05-20",
      fixtureLookupMode: "exact",
      selectedFixtureDate: "2026-05-20",
      selectedFixtureUid: "fixture-1"
    });
  });

  it("navigates fixture date through the fixture query action", async () => {
    mockRuntimeResponses([baseFixture]);
    usePopupSettingsStore.setState({
      settings: {
        ...defaultSettings,
        fixtureDate: "2026-05-21",
        selectedLeagueUid: "league-1"
      }
    });

    await navigateFixtureDate("previous");

    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "GET_FIXTURES_BY_LEAGUE",
      payload: {
        date: "2026-05-20",
        leagueUid: "league-1",
        mode: "previous",
        timezone: expect.any(String)
      }
    });
  });

  it("shows the current page overlay without changing global settings", async () => {
    mockRuntimeResponses();
    mockActiveTab("https://example.com/watch", {
      ok: true,
      pageOverlayState: {
        isSupportedPage: false,
        siteOverlayVisible: true,
        url: "https://example.com/watch",
        visible: true
      }
    });
    usePopupSettingsStore.setState({
      settings: {
        ...defaultSettings,
        extensionEnabled: true
      }
    });

    await showOverlayOnCurrentPage();

    expect(sendRuntimeMessageMock).not.toHaveBeenCalledWith(expect.objectContaining({ type: "UPDATE_SETTINGS" }));
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { type: "SHOW_PAGE_OVERLAY" });
    expect(usePopupSettingsStore.getState().settings.extensionEnabled).toBe(true);
    expect(usePopupPageOverlayStore.getState().pageOverlayState).toEqual({
      isSupportedPage: false,
      siteOverlayVisible: true,
      url: "https://example.com/watch",
      visible: true
    });
    expect(usePopupUiStore.getState().error).toBeNull();
  });

  it("falls back and reports an error when the current page cannot show the overlay", async () => {
    mockRuntimeResponses();

    await showOverlayOnCurrentPage();

    expect(usePopupPageOverlayStore.getState()).toMatchObject({
      pageOverlayState: {
        isSupportedPage: false,
        siteOverlayVisible: false,
        url: "https://example.com/watch",
        visible: false
      },
      pageOverlayStateLoading: false
    });
    expect(usePopupUiStore.getState().error).toBe(t("popup.error.pageOverlayUnavailable"));
  });

  it("hides supported page overlays through the content script without changing global settings", async () => {
    mockRuntimeResponses();
    mockActiveTab("https://www.coupangplay.com/live", {
      ok: true,
      pageOverlayState: {
        isSupportedPage: true,
        siteOverlayVisible: false,
        url: "https://www.coupangplay.com/live",
        visible: false
      }
    });
    usePopupSettingsStore.setState({
      settings: {
        ...defaultSettings,
        extensionEnabled: true
      }
    });
    usePopupPageOverlayStore.setState({
      pageOverlayState: {
        isSupportedPage: true,
        siteOverlayVisible: true,
        url: "https://www.coupangplay.com/live",
        visible: true
      }
    });

    await hideOverlayOnCurrentPage();

    expect(sendRuntimeMessageMock).not.toHaveBeenCalledWith(expect.objectContaining({ type: "UPDATE_SETTINGS" }));
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { type: "HIDE_PAGE_OVERLAY" });
    expect(usePopupSettingsStore.getState().settings.extensionEnabled).toBe(true);
    expect(usePopupPageOverlayStore.getState()).toMatchObject({
      pageOverlayState: {
        isSupportedPage: true,
        siteOverlayVisible: false,
        url: "https://www.coupangplay.com/live",
        visible: false
      },
      pageOverlayStateLoading: false
    });
  });

  it("hides manual page overlays through the content script without changing global settings", async () => {
    mockActiveTab("https://example.com/watch", {
      ok: true,
      pageOverlayState: {
        isSupportedPage: false,
        siteOverlayVisible: false,
        url: "https://example.com/watch",
        visible: false
      }
    });
    usePopupPageOverlayStore.setState({
      pageOverlayState: {
        isSupportedPage: false,
        siteOverlayVisible: true,
        url: "https://example.com/watch",
        visible: true
      }
    });

    await hideOverlayOnCurrentPage();

    expect(sendRuntimeMessageMock).not.toHaveBeenCalled();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { type: "HIDE_PAGE_OVERLAY" });
    expect(usePopupPageOverlayStore.getState().pageOverlayState).toEqual({
      isSupportedPage: false,
      siteOverlayVisible: false,
      url: "https://example.com/watch",
      visible: false
    });
  });
});
