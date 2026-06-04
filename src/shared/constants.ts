import type { ExtensionSettings } from "@/shared/overlay/types";

export const defaultSettings: ExtensionSettings = {
  fixtureLookupMode: "nearest",
  overlayEnabled: true,
  overlayCollapsed: true,
  overlayPosition: "bottom-right",
  pollingIntervalMs: 30000
};

export const supportedStreamingMatches = [
  "https://www.coupangplay.com/*",
  "https://www.spotvnow.co.kr/*"
];

export const supportedStreamingHosts = ["www.coupangplay.com", "www.spotvnow.co.kr"];
