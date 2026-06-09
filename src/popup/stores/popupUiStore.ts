import { create } from "zustand";
import type { PopupTab } from "../types";

type PopupUiStore = {
  activeTab: PopupTab;
  error: string | null;
  clearError: () => void;
  setActiveTab: (activeTab: PopupTab) => void;
  setError: (error: string | null) => void;
};

export const usePopupUiStore = create<PopupUiStore>((set) => ({
  activeTab: "fixtures",
  error: null,

  clearError() {
    set({ error: null });
  },

  setActiveTab(activeTab) {
    set({ activeTab });
  },

  setError(error) {
    set({ error });
  }
}));
