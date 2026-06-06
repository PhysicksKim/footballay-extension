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

describe("popup store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
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
