import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@/shared/constants";
import { sendRuntimeMessage } from "@/shared/messages";
import {
  handleContentRuntimeMessage
} from "@/content/actions/contentOverlayActions";
import {
  selectShouldRegisterContentOverlay,
  selectShouldRenderOverlayControl
} from "@/content/selectors/contentOverlaySelectors";
import { useContentLiveDataStore } from "@/content/stores/contentLiveDataStore";
import { useContentOverlayViewStore } from "@/content/stores/contentOverlayViewStore";
import { useContentPageOverlayStore } from "@/content/stores/contentPageOverlayStore";
import { useContentSettingsStore } from "@/content/stores/contentSettingsStore";

vi.mock("@/shared/messages", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/messages")>();
  return {
    ...actual,
    sendRuntimeMessage: vi.fn()
  };
});

const sendRuntimeMessageMock = vi.mocked(sendRuntimeMessage);

describe("content overlay stores", () => {
  beforeEach(() => {
    sendRuntimeMessageMock.mockResolvedValue({ ok: true });
    useContentLiveDataStore.setState({ data: null });
    useContentSettingsStore.setState({ settings: defaultSettings });
    useContentPageOverlayStore.setState({
      isSupportedPage: false,
      siteOverlayVisible: false,
      pageUrl: "https://example.com/watch"
    });
    useContentOverlayViewStore.setState({
      drawerSide: undefined,
      selectedPlayerUid: undefined,
      viewMode: "compact"
    });
  });

  it("updates settings and live data from runtime messages", () => {
    const data = {
      awayScore: 1,
      awayTeamName: "Away",
      fixtureUid: "fixture-1",
      homeScore: 2,
      homeTeamName: "Home",
      updatedAt: "2026-06-05T00:00:00.000Z"
    };

    handleContentRuntimeMessage({
      type: "SETTINGS_UPDATED",
      payload: {
        ...defaultSettings,
        overlayCollapsed: false
      }
    });
    handleContentRuntimeMessage({
      type: "LIVE_MATCH_DATA_UPDATED",
      payload: data
    });

    expect(useContentSettingsStore.getState().settings.overlayCollapsed).toBe(false);
    expect(useContentLiveDataStore.getState().data).toBe(data);
  });

  it("returns page overlay state responses for popup messages", () => {
    useContentPageOverlayStore.setState({
      isSupportedPage: false,
      siteOverlayVisible: false
    });

    const showResponse = handleContentRuntimeMessage({
      type: "SHOW_PAGE_OVERLAY"
    });

    expect(showResponse).toEqual({
      ok: true,
      pageOverlayState: {
        isSupportedPage: false,
        siteOverlayVisible: true,
        url: "https://example.com/watch",
        visible: true
      }
    });
    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "SET_SITE_OVERLAY_VISIBILITY",
      payload: {
        url: "https://example.com/watch",
        visible: true
      }
    });

    const hideResponse = handleContentRuntimeMessage({
      type: "HIDE_PAGE_OVERLAY"
    });

    expect(hideResponse).toEqual({
      ok: true,
      pageOverlayState: {
        isSupportedPage: false,
        siteOverlayVisible: false,
        url: "https://example.com/watch",
        visible: false
      }
    });
    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "SET_SITE_OVERLAY_VISIBILITY",
      payload: {
        url: "https://example.com/watch",
        visible: false
      }
    });
    expect(sendRuntimeMessageMock).toHaveBeenCalledWith({
      type: "SET_SITE_OVERLAY_DRAWER",
      payload: {
        drawerSide: undefined,
        url: "https://example.com/watch"
      }
    });
  });

  it("selects render and registry states", () => {
    useContentPageOverlayStore.setState({
      isSupportedPage: false,
      siteOverlayVisible: false
    });
    useContentSettingsStore.setState({
      settings: {
        ...defaultSettings,
        extensionEnabled: true
      }
    });

    expect(
      selectShouldRenderOverlayControl(useContentPageOverlayStore.getState())
    ).toBe(false);
    expect(
      selectShouldRegisterContentOverlay(useContentSettingsStore.getState().settings, useContentPageOverlayStore.getState())
    ).toBe(false);

    useContentPageOverlayStore.setState({ siteOverlayVisible: true });

    expect(
      selectShouldRenderOverlayControl(useContentPageOverlayStore.getState())
    ).toBe(true);
    expect(
      selectShouldRegisterContentOverlay(useContentSettingsStore.getState().settings, useContentPageOverlayStore.getState())
    ).toBe(true);

    useContentSettingsStore.setState({
      settings: {
        ...defaultSettings,
        extensionEnabled: false
      }
    });

    expect(
      selectShouldRenderOverlayControl(useContentPageOverlayStore.getState())
    ).toBe(true);
    expect(
      selectShouldRegisterContentOverlay(useContentSettingsStore.getState().settings, useContentPageOverlayStore.getState())
    ).toBe(true);
  });

  it("updates overlay view mode", () => {
    useContentOverlayViewStore.getState().setViewMode("drawer");

    expect(useContentOverlayViewStore.getState().viewMode).toBe("drawer");
  });

  it("opens and closes drawer view state", () => {
    useContentOverlayViewStore.getState().openLeftDrawer();

    expect(useContentOverlayViewStore.getState()).toMatchObject({
      drawerSide: "left",
      selectedPlayerUid: undefined,
      viewMode: "drawer"
    });

    useContentOverlayViewStore.getState().openRightDrawer();

    expect(useContentOverlayViewStore.getState()).toMatchObject({
      drawerSide: "right",
      viewMode: "drawer"
    });

    useContentOverlayViewStore.getState().closeDrawer();

    expect(useContentOverlayViewStore.getState()).toMatchObject({
      drawerSide: undefined,
      selectedPlayerUid: undefined,
      viewMode: "compact"
    });
  });

  it("selects players in the right drawer", () => {
    useContentOverlayViewStore.getState().selectPlayer("player-1");

    expect(useContentOverlayViewStore.getState()).toMatchObject({
      drawerSide: "right",
      selectedPlayerUid: "player-1",
      viewMode: "drawer"
    });
  });
});
