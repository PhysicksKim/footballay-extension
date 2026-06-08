import { create } from "zustand";
import type {
  AvailableLeague,
  FixtureLookupMode,
  FixtureSummary,
  LiveMatchOverlayData
} from "@/domain/live-match/types";
import { defaultSettings } from "@/shared/constants";
import type { PageOverlayState, RuntimeMessage, RuntimeSettingsPatch } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import {
  getFixtureNavigationPatch,
  getQueryDate,
  loadFixtures,
  resolveFixtureQuerySettingsPatch,
  syncResolvedFixtureDate
} from "./services/fixtureFlow";
import {
  hideOverlayOnCurrentPageFlow,
  refreshPageOverlayStateFlow,
  showOverlayOnCurrentPageFlow
} from "./services/pageOverlayFlow";
import { loadPopupStateFlow } from "./services/popupLifecycleFlow";
import { getBrowserTimezone } from "./services/runtimeClient";
import {
  getFixtureDate,
  getTodayDateInputValue
} from "./utils/date";

export type FixtureDateDirection = "previous" | "next";
export type FixtureQueryPatch = Partial<Pick<ExtensionSettings, "fixtureDate" | "fixtureLookupMode">>;
export type PopupTab = "fixtures" | "settings";

export type PopupStoreState = {
  activeTab: PopupTab;
  settings: ExtensionSettings;
  data: LiveMatchOverlayData | null;
  leagues: AvailableLeague[];
  fixtures: FixtureSummary[];
  pageOverlayState: PageOverlayState | null;
  pageOverlayStateLoading: boolean;
  loadingText: string | null;
  fixtureQueryLoading: boolean;
  error: string | null;
};

export type PopupStoreActions = {
  handleRuntimeMessage: (message: RuntimeMessage) => void;
  loadState: () => Promise<void>;
  updateSettings: (patch: RuntimeSettingsPatch) => Promise<void>;
  navigateFixtureDate: (direction: FixtureDateDirection) => Promise<void>;
  returnToSelectedFixtureDate: () => Promise<void>;
  selectFixture: (fixtureUid: string) => Promise<void>;
  selectLeague: (leagueUid: string) => Promise<void>;
  updateFixtureQuery: (patch: FixtureQueryPatch) => Promise<void>;
  hideOverlayOnCurrentPage: () => Promise<void>;
  refreshPageOverlayState: () => Promise<void>;
  showOverlayOnCurrentPage: () => Promise<void>;
  setActiveTab: (activeTab: PopupTab) => void;
};

export type PopupStore = PopupStoreState & PopupStoreActions;
export type PopupStoreSet = (state: Partial<PopupStoreState>) => void;
export type PopupStoreGet = () => PopupStore;

const initialPopupStoreState: PopupStoreState = {
  activeTab: "fixtures",
  settings: defaultSettings,
  data: null,
  leagues: [],
  fixtures: [],
  pageOverlayState: null,
  pageOverlayStateLoading: true,
  loadingText: null,
  fixtureQueryLoading: false,
  error: null
};

const clearSelectedFixturePatch: RuntimeSettingsPatch = {
  selectedFixtureDate: null,
  selectedFixtureUid: null
};

const clearLeagueSelectionPatch: RuntimeSettingsPatch = {
  selectedFixtureDate: null,
  selectedFixtureUid: null,
  selectedLeagueUid: null
};

export const usePopupStore = create<PopupStore>((set, get) => ({
  ...initialPopupStoreState,

  async loadState() {
    await loadPopupStateFlow(set, get);
  },

  handleRuntimeMessage(message) {
    if (message.type === "SETTINGS_UPDATED") {
      set({ settings: message.payload });
    }

    if (message.type === "LIVE_MATCH_DATA_UPDATED") {
      set({ data: message.payload });
    }
  },

  async updateSettings(patch) {
    set({ error: null });
    const response = await sendRuntimeMessage({ type: "UPDATE_SETTINGS", payload: patch });

    if (response.ok && "settings" in response) {
      set({ settings: response.settings });
      return;
    }

    if (!response.ok) {
      set({ error: response.error });
    }
  },

  async selectLeague(leagueUid) {
    set({ loadingText: "Loading fixtures", error: null });

    if (!leagueUid) {
      set({ fixtures: [] });
      await get().updateSettings(clearLeagueSelectionPatch);
      set({ loadingText: null });
      return;
    }

    try {
      const initialFixtureDate = getTodayDateInputValue();
      const initialLookupMode: FixtureLookupMode = "nearest";
      const response = await sendRuntimeMessage({
        type: "SELECT_LEAGUE",
        payload: {
          leagueUid,
          date: initialFixtureDate,
          mode: initialLookupMode,
          timezone: getBrowserTimezone()
        }
      });

      if (response.ok && "settings" in response && "fixtures" in response) {
        set({
          settings: response.settings,
          fixtures: response.fixtures,
          data: null
        });
        await syncResolvedFixtureDate(response.settings, response.fixtures, set);
      } else if (!response.ok) {
        set({ error: response.error });
      }
    } finally {
      set({ loadingText: null });
    }
  },

  async navigateFixtureDate(direction) {
    await get().updateFixtureQuery(getFixtureNavigationPatch(get().settings, direction));
  },

  async selectFixture(fixtureUid) {
    set({ error: null });

    if (fixtureUid === get().settings.selectedFixtureUid) {
      await get().updateSettings(clearSelectedFixturePatch);
      set({ data: null });
      return;
    }

    if (!fixtureUid) {
      await get().updateSettings(clearSelectedFixturePatch);
      set({ data: null });
      return;
    }

    const selectedFixture = get().fixtures.find((fixture) => fixture.uid === fixtureUid);
    const selectedFixtureDate = selectedFixture
      ? getFixtureDate(selectedFixture) ?? getQueryDate(get().settings)
      : undefined;
    const response = await sendRuntimeMessage({
      type: "SELECT_FIXTURE",
      payload: { fixtureUid, fixtureDate: selectedFixtureDate }
    });

    if (response.ok && "settings" in response) {
      set({ settings: response.settings });
    } else if (!response.ok) {
      set({ error: response.error });
    }
  },

  async returnToSelectedFixtureDate() {
    const selectedFixtureDate = get().settings.selectedFixtureDate;
    if (!selectedFixtureDate) {
      return;
    }

    await get().updateFixtureQuery({
      fixtureDate: selectedFixtureDate,
      fixtureLookupMode: "exact"
    });
  },

  async updateFixtureQuery(patch) {
    set({ fixtureQueryLoading: true, error: null });

    const nextSettings = {
      ...get().settings,
      ...patch
    };

    try {
      if (nextSettings.selectedLeagueUid) {
        const nextFixtures = await loadFixtures(nextSettings, set);
        if (!nextFixtures) {
          return;
        }

        await get().updateSettings(resolveFixtureQuerySettingsPatch(nextSettings, nextFixtures, patch));
      } else {
        await get().updateSettings(patch);
      }
    } finally {
      set({ fixtureQueryLoading: false });
    }
  },

  async refreshPageOverlayState() {
    await refreshPageOverlayStateFlow(set);
  },

  async showOverlayOnCurrentPage() {
    await showOverlayOnCurrentPageFlow(set, get);
  },

  async hideOverlayOnCurrentPage() {
    await hideOverlayOnCurrentPageFlow(set, get);
  },

  setActiveTab(activeTab) {
    set({ activeTab });
  }
}));
