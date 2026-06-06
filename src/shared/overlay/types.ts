export type OverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

export type ExtensionSettings = {
  selectedLeagueUid?: string;
  selectedFixtureUid?: string;
  selectedFixtureDate?: string;
  fixtureDate?: string;
  fixtureLookupMode: "previous" | "exact" | "nearest";
  overlayEnabled: boolean;
  overlayCollapsed: boolean;
  overlayPosition: OverlayPosition;
  pollingIntervalMs: number;
};
