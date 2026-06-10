import { create } from "zustand";

export type OverlayDrawerSide = "left" | "right";

export type OverlayViewMode = "compact" | "drawer" | "fullscreen";

type ContentOverlayViewState = {
  drawerSide?: OverlayDrawerSide;
  selectedPlayerUid?: string;
  viewMode: OverlayViewMode;
};

type ContentOverlayViewActions = {
  clearSelectedPlayer: () => void;
  closeDrawer: () => void;
  openLeftDrawer: () => void;
  openRightDrawer: () => void;
  selectPlayer: (matchPlayerUid: string) => void;
  setViewMode: (viewMode: OverlayViewMode) => void;
};

type ContentOverlayViewStore = ContentOverlayViewState & ContentOverlayViewActions;

export const useContentOverlayViewStore = create<ContentOverlayViewStore>((set) => ({
  drawerSide: undefined,
  selectedPlayerUid: undefined,
  viewMode: "compact",

  clearSelectedPlayer() {
    set({ selectedPlayerUid: undefined });
  },

  closeDrawer() {
    set({ drawerSide: undefined, selectedPlayerUid: undefined, viewMode: "compact" });
  },

  openLeftDrawer() {
    set({ drawerSide: "left", selectedPlayerUid: undefined, viewMode: "drawer" });
  },

  openRightDrawer() {
    set({ drawerSide: "right", viewMode: "drawer" });
  },

  selectPlayer(matchPlayerUid) {
    set({ drawerSide: "right", selectedPlayerUid: matchPlayerUid, viewMode: "drawer" });
  },

  setViewMode(viewMode) {
    set({ viewMode });
  }
}));
