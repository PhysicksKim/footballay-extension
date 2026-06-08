import type { PageOverlayState } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { isSupportedStreamingUrl } from "@/shared/url";
import type { PopupStoreGet, PopupStoreSet } from "../store";
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

// Refreshes the popup's view of the current page overlay state with a loading guard.
export async function refreshPageOverlayStateFlow(set: PopupStoreSet): Promise<void> {
  set({ pageOverlayStateLoading: true });

  try {
    set({ pageOverlayState: await resolveCurrentPageOverlayState() });
  } finally {
    set({ pageOverlayStateLoading: false });
  }
}

// Shows the overlay on the active page. Global overlay must be enabled first, otherwise
// supported streaming pages would immediately hide their automatically mounted overlay.
export async function showOverlayOnCurrentPageFlow(
  set: PopupStoreSet,
  get: PopupStoreGet
): Promise<void> {
  set({ error: null });

  if (!get().settings.overlayEnabled) {
    await get().updateSettings({ overlayEnabled: true });
  }

  const response = await sendActiveTabMessage({ type: "SHOW_PAGE_OVERLAY" });
  if (response?.ok && "pageOverlayState" in response) {
    set({ pageOverlayState: response.pageOverlayState });
    return;
  }

  await get().refreshPageOverlayState();
  set({ error: "This page cannot run the overlay" });
}

// Supported streaming pages are controlled by the global overlay flag.
// Unsupported/manual pages are controlled by direct content-script visibility messages.
export async function hideOverlayOnCurrentPageFlow(
  set: PopupStoreSet,
  get: PopupStoreGet
): Promise<void> {
  set({ error: null });

  if (shouldDisableGlobalOverlayForSupportedPage(get().pageOverlayState, get().settings)) {
    await get().updateSettings({ overlayEnabled: false });
    await get().refreshPageOverlayState();
    return;
  }

  const response = await sendActiveTabMessage({ type: "HIDE_PAGE_OVERLAY" });
  if (response?.ok && "pageOverlayState" in response) {
    set({ pageOverlayState: response.pageOverlayState });
  }
}

// Fallback state is used when the active tab has no content script response yet.
// It lets the popup explain whether the current URL is auto-supported or manual-only.
export function getFallbackPageOverlayState(url: string): PageOverlayState {
  return {
    isSupportedPage: isSupportedStreamingUrl(url),
    manualVisible: false,
    visible: false,
    url
  };
}

// On supported pages, hiding means disabling the global overlay setting.
// On manual pages, hiding means only hiding the overlay in that tab.
export function shouldDisableGlobalOverlayForSupportedPage(
  pageOverlayState: PageOverlayState | null,
  settings: ExtensionSettings
): boolean {
  return Boolean(pageOverlayState?.isSupportedPage && settings.overlayEnabled);
}
