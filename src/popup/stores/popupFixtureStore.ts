import { create } from "zustand";
import type { AvailableLeague, FixtureSummary } from "@/domain/live-match/types";

type PopupFixtureStore = {
  fixtureQueryLoading: boolean;
  fixtures: FixtureSummary[];
  leagues: AvailableLeague[];
  loadingText: string | null;
  clearFixtures: () => void;
  setFixtureQueryLoading: (fixtureQueryLoading: boolean) => void;
  setFixtures: (fixtures: FixtureSummary[]) => void;
  setLeagues: (leagues: AvailableLeague[]) => void;
  setLoadingText: (loadingText: string | null) => void;
};

export const usePopupFixtureStore = create<PopupFixtureStore>((set) => ({
  fixtureQueryLoading: false,
  fixtures: [],
  leagues: [],
  loadingText: null,

  clearFixtures() {
    set({ fixtures: [] });
  },

  setFixtureQueryLoading(fixtureQueryLoading) {
    set({ fixtureQueryLoading });
  },

  setFixtures(fixtures) {
    set({ fixtures });
  },

  setLeagues(leagues) {
    set({ leagues });
  },

  setLoadingText(loadingText) {
    set({ loadingText });
  }
}));
