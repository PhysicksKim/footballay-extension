export type OverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

export type OverlayLanguage = "auto" | "ko" | "en";

export type OverlayTickerStatKey = "possession" | "shotsOnGoal" | "shotsTotal" | "cards";

export type ExtensionSettings = {
  extensionEnabled: boolean;
  selectedLeagueUid?: string;
  selectedFixtureUid?: string;
  selectedFixtureDate?: string;
  fixtureDate?: string;
  fixtureLookupMode: "previous" | "exact" | "nearest";
  overlayCollapsed: boolean;
  overlayLanguage: OverlayLanguage;
  overlayPosition: OverlayPosition;
  overlayTickerIntervalMs: number;
  overlayTickerScale: number;
  overlayTickerStatKeys: OverlayTickerStatKey[];
  pollingIntervalMs: number;
};
