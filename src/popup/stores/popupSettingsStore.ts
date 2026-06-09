import { create } from "zustand";
import { defaultSettings } from "@/shared/constants";
import type { ExtensionSettings } from "@/shared/overlay/types";

type PopupSettingsStore = {
  settings: ExtensionSettings;
  setSettings: (settings: ExtensionSettings) => void;
};

export const usePopupSettingsStore = create<PopupSettingsStore>((set) => ({
  settings: defaultSettings,

  setSettings(settings) {
    set({ settings });
  }
}));
