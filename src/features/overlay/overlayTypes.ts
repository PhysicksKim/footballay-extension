export type OverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

export type ExtensionSettings = {
  selectedFixtureId?: number;
  overlayEnabled: boolean;
  overlayCollapsed: boolean;
  overlayPosition: OverlayPosition;
  pollingIntervalMs: number;
};
