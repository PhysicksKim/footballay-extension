import { describe, expect, it } from "vitest";
import { getFallbackPageOverlayState } from "./pageOverlayFlow";

describe("popup page overlay flow", () => {
  it("creates fallback page overlay state for supported streaming urls", () => {
    expect(getFallbackPageOverlayState("https://www.coupangplay.com/live")).toEqual({
      isSupportedPage: true,
      siteOverlayVisible: true,
      url: "https://www.coupangplay.com/live",
      visible: false
    });
  });

  it("creates fallback page overlay state for unsupported urls", () => {
    expect(getFallbackPageOverlayState("https://example.com/watch")).toEqual({
      isSupportedPage: false,
      siteOverlayVisible: false,
      url: "https://example.com/watch",
      visible: false
    });
  });
});
