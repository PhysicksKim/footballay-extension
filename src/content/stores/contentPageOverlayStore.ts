import { isSupportedStreamingUrl } from "@/shared/url";
import { create } from "zustand";

type ContentPageOverlayState = {
  isSupportedPage: boolean;
  manualVisible: boolean;
  pageUrl: string;
};

type ContentPageOverlayActions = {
  setManualVisible: (manualVisible: boolean) => void;
};

export type ContentPageOverlayStore = ContentPageOverlayState & ContentPageOverlayActions;

const initialPageUrl = typeof window === "undefined" ? "" : window.location.href;

export const useContentPageOverlayStore = create<ContentPageOverlayStore>((set) => ({
  isSupportedPage: initialPageUrl ? isSupportedStreamingUrl(initialPageUrl) : false,
  manualVisible: false,
  pageUrl: initialPageUrl,

  setManualVisible(manualVisible) {
    set({ manualVisible });
  }
}));
