import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/shared/constants";
import { selectShouldRegisterContentOverlay, selectShouldRenderOverlayControl, useContentOverlayStore } from "./store";

describe("content overlay store", () => {
  beforeEach(() => {
    useContentOverlayStore.setState({
      data: null,
      isSupportedPage: false,
      manualVisible: false,
      pageUrl: "https://example.com/watch",
      settings: defaultSettings,
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

    useContentOverlayStore.getState().handleRuntimeMessage({
      type: "SETTINGS_UPDATED",
      payload: {
        ...defaultSettings,
        overlayCollapsed: false
      }
    });
    useContentOverlayStore.getState().handleRuntimeMessage({
      type: "LIVE_MATCH_DATA_UPDATED",
      payload: data
    });

    expect(useContentOverlayStore.getState().settings.overlayCollapsed).toBe(false);
    expect(useContentOverlayStore.getState().data).toBe(data);
  });

  it("returns page overlay state responses for popup messages", () => {
    useContentOverlayStore.setState({
      isSupportedPage: false,
      manualVisible: false
    });

    const showResponse = useContentOverlayStore.getState().handleRuntimeMessage({
      type: "SHOW_PAGE_OVERLAY"
    });

    expect(showResponse).toEqual({
      ok: true,
      pageOverlayState: {
        isSupportedPage: false,
        manualVisible: true,
        url: "https://example.com/watch",
        visible: true
      }
    });

    const hideResponse = useContentOverlayStore.getState().handleRuntimeMessage({
      type: "HIDE_PAGE_OVERLAY"
    });

    expect(hideResponse).toEqual({
      ok: true,
      pageOverlayState: {
        isSupportedPage: false,
        manualVisible: false,
        url: "https://example.com/watch",
        visible: false
      }
    });
  });

  it("selects render and registry states", () => {
    useContentOverlayStore.setState({
      isSupportedPage: false,
      manualVisible: false,
      settings: {
        ...defaultSettings,
        overlayEnabled: true
      }
    });

    expect(selectShouldRenderOverlayControl(useContentOverlayStore.getState())).toBe(false);
    expect(selectShouldRegisterContentOverlay(useContentOverlayStore.getState())).toBe(false);

    useContentOverlayStore.setState({ manualVisible: true });

    expect(selectShouldRenderOverlayControl(useContentOverlayStore.getState())).toBe(true);
    expect(selectShouldRegisterContentOverlay(useContentOverlayStore.getState())).toBe(true);

    useContentOverlayStore.setState({
      settings: {
        ...defaultSettings,
        overlayEnabled: false
      }
    });

    expect(selectShouldRenderOverlayControl(useContentOverlayStore.getState())).toBe(true);
    expect(selectShouldRegisterContentOverlay(useContentOverlayStore.getState())).toBe(false);
  });

  it("updates overlay view mode", () => {
    useContentOverlayStore.getState().setViewMode("expanded");

    expect(useContentOverlayStore.getState().viewMode).toBe("expanded");
  });
});
