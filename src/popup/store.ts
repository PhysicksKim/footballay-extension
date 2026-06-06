import { create } from "zustand";
import type { AvailableLeague, FixtureLookupMode, FixtureSummary, LiveMatchOverlayData } from "@/domain/live-match/types";
import { defaultSettings } from "@/shared/constants";
import type { PageOverlayState, RuntimeMessage, RuntimeResponse, RuntimeSettingsPatch } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { isSupportedStreamingUrl } from "@/shared/url";
import {
  addDaysToDateInputValue,
  getFixtureDateFromFixtures,
  getTodayDateInputValue
} from "./utils/date";

type FixtureDateDirection = "previous" | "next";
export type PopupTab = "fixtures" | "settings";

type PopupStoreState = {
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

type PopupStoreActions = {
  handleRuntimeMessage: (message: RuntimeMessage) => void;
  hideOverlayOnCurrentPage: () => Promise<void>;
  loadState: () => Promise<void>;
  navigateFixtureDate: (direction: FixtureDateDirection) => Promise<void>;
  refreshPageOverlayState: () => Promise<void>;
  selectFixture: (fixtureUid: string) => Promise<void>;
  selectLeague: (leagueUid: string) => Promise<void>;
  setActiveTab: (activeTab: PopupTab) => void;
  showOverlayOnCurrentPage: () => Promise<void>;
  updateFixtureQuery: (
    patch: Partial<Pick<ExtensionSettings, "fixtureDate" | "fixtureLookupMode">>
  ) => Promise<void>;
  updateSettings: (patch: RuntimeSettingsPatch) => Promise<void>;
};

type PopupStore = PopupStoreState & PopupStoreActions;

export const usePopupStore = create<PopupStore>((set, get) => ({
  activeTab: "fixtures",
  settings: defaultSettings,
  data: null,
  leagues: [],
  fixtures: [],
  pageOverlayState: null,
  pageOverlayStateLoading: true,
  loadingText: null,
  fixtureQueryLoading: false,
  error: null,

  handleRuntimeMessage(message) {
    if (message.type === "SETTINGS_UPDATED") {
      set({ settings: message.payload });
    }

    if (message.type === "LIVE_MATCH_DATA_UPDATED") {
      set({ data: message.payload });
    }
  },

  setActiveTab(activeTab) {
    set({ activeTab });
  },

  async loadState() {
    set({ loadingText: "Loading", error: null });

    try {
      const settingsResponse = await sendRuntimeMessage({ type: "GET_SETTINGS" });
      if (settingsResponse.ok && "settings" in settingsResponse) {
        set({ settings: settingsResponse.settings });
      }

      const dataResponse = await sendRuntimeMessage({ type: "GET_LATEST_MATCH_DATA" });
      if (dataResponse.ok && "data" in dataResponse) {
        set({ data: dataResponse.data });
      }

      const leaguesResponse = await sendRuntimeMessage({ type: "GET_AVAILABLE_LEAGUES" });
      if (leaguesResponse.ok && "leagues" in leaguesResponse) {
        set({ leagues: leaguesResponse.leagues });
      } else if (!leaguesResponse.ok) {
        set({ error: leaguesResponse.error });
      }

      if (settingsResponse.ok && "settings" in settingsResponse && settingsResponse.settings.selectedLeagueUid) {
        await loadFixtures(settingsResponse.settings, set);
      }

      await get().refreshPageOverlayState();
    } finally {
      set({ loadingText: null });
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
      await get().updateSettings({ selectedLeagueUid: null, selectedFixtureUid: null });
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
    const baseDate = getQueryDate(get().settings);
    await get().updateFixtureQuery({
      fixtureDate: addDaysToDateInputValue(baseDate, direction === "previous" ? -1 : 1),
      fixtureLookupMode: direction === "previous" ? "previous" : "nearest"
    });
  },

  async selectFixture(fixtureUid) {
    set({ error: null });

    if (fixtureUid === get().settings.selectedFixtureUid) {
      await get().updateSettings({ selectedFixtureUid: null });
      set({ data: null });
      return;
    }

    if (!fixtureUid) {
      await get().updateSettings({ selectedFixtureUid: null });
      set({ data: null });
      return;
    }

    const response = await sendRuntimeMessage({
      type: "SELECT_FIXTURE",
      payload: { fixtureUid }
    });

    if (response.ok && "settings" in response) {
      set({ settings: response.settings });
    } else if (!response.ok) {
      set({ error: response.error });
    }
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

        const resolvedDate =
          nextSettings.fixtureLookupMode === "exact"
            ? nextSettings.fixtureDate
            : getFixtureDateFromFixtures(nextFixtures) ?? nextSettings.fixtureDate;

        await get().updateSettings({
          ...patch,
          fixtureDate: resolvedDate
        });
      } else {
        await get().updateSettings(patch);
      }
    } finally {
      set({ fixtureQueryLoading: false });
    }
  },

  async refreshPageOverlayState() {
    set({ pageOverlayStateLoading: true });

    try {
      const tabResponse = await sendActiveTabMessage({ type: "GET_PAGE_OVERLAY_STATE" });
      if (tabResponse?.ok && "pageOverlayState" in tabResponse) {
        set({ pageOverlayState: tabResponse.pageOverlayState });
        return;
      }

      const activeTab = await getActiveTab();
      set({
        pageOverlayState: activeTab?.url
          ? {
              isSupportedPage: isSupportedStreamingUrl(activeTab.url),
              manualVisible: false,
              visible: false,
              url: activeTab.url
            }
          : null
      });
    } finally {
      set({ pageOverlayStateLoading: false });
    }
  },

  async showOverlayOnCurrentPage() {
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
  },

  async hideOverlayOnCurrentPage() {
    set({ error: null });

    if (get().pageOverlayState?.isSupportedPage) {
      await get().updateSettings({ overlayEnabled: false });
      await get().refreshPageOverlayState();
      return;
    }

    const response = await sendActiveTabMessage({ type: "HIDE_PAGE_OVERLAY" });
    if (response?.ok && "pageOverlayState" in response) {
      set({ pageOverlayState: response.pageOverlayState });
    }
  }
}));

async function loadFixtures(
  nextSettings: ExtensionSettings,
  set: (state: Partial<PopupStoreState>) => void
): Promise<FixtureSummary[] | null> {
  if (!nextSettings.selectedLeagueUid) {
    set({ fixtures: [] });
    return [];
  }

  const response = await sendRuntimeMessage({
    type: "GET_FIXTURES_BY_LEAGUE",
    payload: {
      leagueUid: nextSettings.selectedLeagueUid,
      date: getQueryDate(nextSettings),
      mode: nextSettings.fixtureLookupMode,
      timezone: getBrowserTimezone()
    }
  });

  if (response.ok && "fixtures" in response) {
    set({ fixtures: response.fixtures });
    return response.fixtures;
  }

  if (!response.ok) {
    set({ error: response.error });
  }

  return null;
}

async function syncResolvedFixtureDate(
  nextSettings: ExtensionSettings,
  nextFixtures: FixtureSummary[] | null,
  set: (state: Partial<PopupStoreState>) => void
): Promise<void> {
  if (nextSettings.fixtureLookupMode === "exact" || !nextFixtures) {
    return;
  }

  const resolvedDate = getFixtureDateFromFixtures(nextFixtures);
  if (!resolvedDate || resolvedDate === nextSettings.fixtureDate) {
    return;
  }

  const response = await sendRuntimeMessage({
    type: "UPDATE_SETTINGS",
    payload: { fixtureDate: resolvedDate }
  });

  if (response.ok && "settings" in response) {
    set({ settings: response.settings });
  }
}

async function sendActiveTabMessage(message: RuntimeMessage): Promise<RuntimeResponse | null> {
  const activeTab = await getActiveTab();
  if (!activeTab?.id) {
    return null;
  }

  try {
    return (await chrome.tabs.sendMessage(activeTab.id, message)) as RuntimeResponse;
  } catch {
    return null;
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return activeTab ?? null;
}

function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getQueryDate(settings: ExtensionSettings): string {
  return settings.fixtureDate ?? getTodayDateInputValue();
}
