import type { ExtensionSettings } from "@/features/overlay/overlayTypes";

export const defaultSettings: ExtensionSettings = {
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
