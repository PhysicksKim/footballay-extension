import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/shared/constants";
import {
  getFallbackPageOverlayState,
  shouldDisableGlobalOverlayForSupportedPage
} from "./pageOverlayFlow";

describe("popup page overlay flow", () => {
  it("creates fallback page overlay state for supported streaming urls", () => {
    expect(getFallbackPageOverlayState("https://www.coupangplay.com/live")).toEqual({
      isSupportedPage: true,
      manualVisible: false,
      url: "https://www.coupangplay.com/live",
      visible: false
    });
  });

  it("creates fallback page overlay state for unsupported urls", () => {
    expect(getFallbackPageOverlayState("https://example.com/watch")).toEqual({
      isSupportedPage: false,
      manualVisible: false,
      url: "https://example.com/watch",
      visible: false
    });
  });

  it("selects when a supported page should disable global overlay setting", () => {
    expect(
      shouldDisableGlobalOverlayForSupportedPage(
        {
          isSupportedPage: true,
          manualVisible: false,
          url: "https://www.coupangplay.com/live",
          visible: true
        },
        {
          ...defaultSettings,
          overlayEnabled: true
        }
      )
    ).toBe(true);

    expect(
      shouldDisableGlobalOverlayForSupportedPage(
        {
          isSupportedPage: false,
          manualVisible: true,
          url: "https://example.com/watch",
          visible: true
        },
        {
          ...defaultSettings,
          overlayEnabled: true
        }
      )
    ).toBe(false);

    expect(shouldDisableGlobalOverlayForSupportedPage(null, defaultSettings)).toBe(false);
  });
});
