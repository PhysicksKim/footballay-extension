import { create } from "zustand";

export type OverlayViewMode = "compact" | "drawer" | "fullscreen";

type ContentOverlayViewState = {
  viewMode: OverlayViewMode;
};

type ContentOverlayViewActions = {
  setViewMode: (viewMode: OverlayViewMode) => void;
};

type ContentOverlayViewStore = ContentOverlayViewState & ContentOverlayViewActions;

export const useContentOverlayViewStore = create<ContentOverlayViewStore>((set) => ({
  viewMode: "compact",

  setViewMode(viewMode) {
    set({ viewMode });
  }
}));
