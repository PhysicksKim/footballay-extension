import type { LiveMatchOverlayData } from "@/features/live-match/types";
import type { ExtensionSettings } from "@/features/overlay/overlayTypes";

export type PageOverlayState = {
  isSupportedPage: boolean;
  manualVisible: boolean;
  visible: boolean;
  url: string;
};

export type RuntimeMessage =
  | { type: "GET_SETTINGS" }
  | { type: "UPDATE_SETTINGS"; payload: Partial<ExtensionSettings> }
  | { type: "SELECT_FIXTURE"; payload: { fixtureId: number } }
  | { type: "START_POLLING" }
  | { type: "STOP_POLLING" }
  | { type: "GET_LATEST_MATCH_DATA" }
  | { type: "GET_PAGE_OVERLAY_STATE" }
  | { type: "SHOW_PAGE_OVERLAY" }
  | { type: "HIDE_PAGE_OVERLAY" }
  | { type: "SETTINGS_UPDATED"; payload: ExtensionSettings }
  | { type: "LIVE_MATCH_DATA_UPDATED"; payload: LiveMatchOverlayData | null };

export type RuntimeResponse =
  | { ok: true; settings: ExtensionSettings }
  | { ok: true; data: LiveMatchOverlayData | null }
  | { ok: true; pageOverlayState: PageOverlayState }
  | { ok: true }
  | { ok: false; error: string };

export async function sendRuntimeMessage<TResponse extends RuntimeResponse>(
  message: RuntimeMessage
): Promise<TResponse> {
  return chrome.runtime.sendMessage(message) as Promise<TResponse>;
}
