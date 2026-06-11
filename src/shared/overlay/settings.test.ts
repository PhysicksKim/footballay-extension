import { describe, expect, it } from "vitest";
import { defaultOverlayTickerStatKeys, defaultSettings } from "@/shared/constants";
import { normalizeExtensionSettings, normalizeSettingsPatch } from "./settings";

describe("overlay settings normalization", () => {
  it("fills missing fields with defaults", () => {
    expect(
      normalizeExtensionSettings({
        extensionEnabled: false
      })
    ).toEqual({
      ...defaultSettings,
      extensionEnabled: false
    });
  });

  it("normalizes invalid overlay-only settings", () => {
    expect(
      normalizeExtensionSettings({
        overlayLanguage: "fr" as never,
        overlayPosition: "center" as never,
        overlayTickerIntervalMs: 100,
        overlayTickerScale: Number.NaN,
        overlayTickerStatKeys: ["shotsOnGoal", "invalid", "shotsOnGoal"] as never
      })
    ).toMatchObject({
      overlayLanguage: defaultSettings.overlayLanguage,
      overlayPosition: defaultSettings.overlayPosition,
      overlayTickerIntervalMs: 1000,
      overlayTickerScale: defaultSettings.overlayTickerScale,
      overlayTickerStatKeys: ["shotsOnGoal"]
    });
  });

  it("falls back to default ticker stat keys when no valid stat key remains", () => {
    expect(
      normalizeExtensionSettings({
        overlayTickerStatKeys: ["invalid"] as never
      }).overlayTickerStatKeys
    ).toEqual(defaultOverlayTickerStatKeys);
  });

  it("converts nullable patch values to undefined", () => {
    expect(
      normalizeSettingsPatch({
        fixtureDate: null,
        selectedFixtureUid: "fixture-1"
      })
    ).toEqual({
      fixtureDate: undefined,
      selectedFixtureUid: "fixture-1"
    });
  });
});
