import { create } from "zustand";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";

type PopupLiveDataStore = {
  data: LiveMatchOverlayData | null;
  clearData: () => void;
  setData: (data: LiveMatchOverlayData | null) => void;
};

export const usePopupLiveDataStore = create<PopupLiveDataStore>((set) => ({
  data: null,

  clearData() {
    set({ data: null });
  },

  setData(data) {
    set({ data });
  }
}));
