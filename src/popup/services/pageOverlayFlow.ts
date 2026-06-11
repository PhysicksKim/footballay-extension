import type { PageOverlayState } from "@/shared/messages";
import { isSupportedStreamingUrl } from "@/shared/url";
import { getActiveTab, sendActiveTabMessage } from "./runtimeClient";

// Ask the content script first because it knows whether an overlay is currently mounted.
// If no content script answers, fall back to the active tab URL and compute a passive state.
export async function resolveCurrentPageOverlayState(): Promise<PageOverlayState | null> {
  const tabResponse = await sendActiveTabMessage({ type: "GET_PAGE_OVERLAY_STATE" });
  if (tabResponse?.ok && "pageOverlayState" in tabResponse) {
    return tabResponse.pageOverlayState;
  }

  const activeTab = await getActiveTab();
  if (!activeTab?.url) {
    return null;
  }

  return getFallbackPageOverlayState(activeTab.url);
}

// Fallback state is used when the active tab has no content script response yet.
// It lets the popup explain whether the current URL is auto-supported or manual-only.
export function getFallbackPageOverlayState(url: string): PageOverlayState {
  return {
    isSupportedPage: isSupportedStreamingUrl(url),
    siteOverlayVisible: isSupportedStreamingUrl(url),
    visible: false,
    url
  };
}
