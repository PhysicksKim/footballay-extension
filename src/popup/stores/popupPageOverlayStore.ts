import { create } from "zustand";
import type { PageOverlayState } from "@/shared/messages";

type PopupPageOverlayStore = {
  pageOverlayState: PageOverlayState | null;
  pageOverlayStateLoading: boolean;
  setPageOverlayState: (pageOverlayState: PageOverlayState | null) => void;
  setPageOverlayStateLoading: (pageOverlayStateLoading: boolean) => void;
};

export const usePopupPageOverlayStore = create<PopupPageOverlayStore>((set) => ({
  pageOverlayState: null,
  pageOverlayStateLoading: true,

  setPageOverlayState(pageOverlayState) {
    set({ pageOverlayState });
  },

  setPageOverlayStateLoading(pageOverlayStateLoading) {
    set({ pageOverlayStateLoading });
  }
}));
