import type { ExtensionSettings, OverlayTickerStatKey } from "@/shared/overlay/types";

export const defaultOverlayTickerStatKeys: OverlayTickerStatKey[] = [
  "possession",
  "shotsOnGoal",
  "shotsTotal",
  "cards"
];

export const defaultSettings: ExtensionSettings = {
  extensionEnabled: true,
  fixtureLookupMode: "nearest",
  overlayCollapsed: true,
  overlayLanguage: "auto",
  overlayPosition: "bottom-right",
  overlayTickerIntervalMs: 7000,
  overlayTickerScale: 1,
  overlayTickerStatKeys: defaultOverlayTickerStatKeys,
  pollingIntervalMs: 30000
};

export const supportedStreamingMatches = [
  "https://www.coupangplay.com/*",
  "https://www.spotvnow.co.kr/*"
];

export const supportedStreamingHosts = ["www.coupangplay.com", "www.spotvnow.co.kr"];
