import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { defaultSettings } from "@/shared/constants";
import type { PageOverlayState, RuntimeMessage, RuntimeResponse } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { isSupportedStreamingUrl } from "@/shared/url";
import { create } from "zustand";

type ContentOverlayState = {
  data: LiveMatchOverlayData | null;
  isSupportedPage: boolean;
  manualVisible: boolean;
  pageUrl: string;
  settings: ExtensionSettings;
};

type ContentOverlayActions = {
  getPageOverlayState: (override?: Partial<PageOverlayState>) => PageOverlayState;
  handleRuntimeMessage: (message: RuntimeMessage) => RuntimeResponse | undefined;
  loadInitialState: () => Promise<void>;
  refreshLatestMatchData: () => Promise<void>;
  setManualVisible: (manualVisible: boolean) => void;
  updateOverlaySettings: (patch: Partial<ExtensionSettings>) => Promise<void>;
};

type ContentOverlayStore = ContentOverlayState & ContentOverlayActions;

const initialPageUrl = typeof window === "undefined" ? "" : window.location.href;

export const useContentOverlayStore = create<ContentOverlayStore>((set, get) => ({
  data: null,
  isSupportedPage: initialPageUrl ? isSupportedStreamingUrl(initialPageUrl) : false,
  manualVisible: false,
  pageUrl: initialPageUrl,
  settings: defaultSettings,

  getPageOverlayState(override) {
    const state = get();
    const nextManualVisible = override?.manualVisible ?? state.manualVisible;
    const nextVisible = state.settings.overlayEnabled && (state.isSupportedPage || nextManualVisible);

    return {
      isSupportedPage: state.isSupportedPage,
      manualVisible: nextManualVisible,
      visible: nextVisible,
      url: state.pageUrl,
      ...override
    };
  },

  handleRuntimeMessage(message) {
    if (message.type === "SETTINGS_UPDATED") {
      set({ settings: message.payload });
      return undefined;
    }

    if (message.type === "LIVE_MATCH_DATA_UPDATED") {
      set({ data: message.payload });
      return undefined;
    }

    if (message.type === "GET_PAGE_OVERLAY_STATE") {
      return { ok: true, pageOverlayState: get().getPageOverlayState() };
    }

    if (message.type === "SHOW_PAGE_OVERLAY") {
      set({ manualVisible: true });
      return {
        ok: true,
        pageOverlayState: get().getPageOverlayState({ manualVisible: true })
      };
    }

    if (message.type === "HIDE_PAGE_OVERLAY") {
      set({ manualVisible: false });
      return {
        ok: true,
        pageOverlayState: get().getPageOverlayState({ manualVisible: false })
      };
    }

    return undefined;
  },

  async loadInitialState() {
    const settingsResponse = await sendRuntimeMessage({ type: "GET_SETTINGS" });
    if (settingsResponse.ok && "settings" in settingsResponse) {
      set({ settings: settingsResponse.settings });
    }

    await get().refreshLatestMatchData();
  },

  async refreshLatestMatchData() {
    const dataResponse = await sendRuntimeMessage({ type: "GET_LATEST_MATCH_DATA" });
    if (dataResponse.ok && "data" in dataResponse) {
      set({ data: dataResponse.data });
    }
  },

  setManualVisible(manualVisible) {
    set({ manualVisible });
  },

  async updateOverlaySettings(patch) {
    const response = await sendRuntimeMessage({ type: "UPDATE_SETTINGS", payload: patch });
    if (response.ok && "settings" in response) {
      set({ settings: response.settings });
    }
  }
}));

export function selectShouldRenderOverlayControl(state: ContentOverlayState): boolean {
  return state.isSupportedPage || state.manualVisible;
}

export function selectShouldRegisterContentOverlay(state: ContentOverlayState): boolean {
  return selectShouldRenderOverlayControl(state) && state.settings.overlayEnabled;
}
