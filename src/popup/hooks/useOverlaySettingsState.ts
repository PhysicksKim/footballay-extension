import { useShallow } from "zustand/react/shallow";
import type { RuntimeSettingsPatch } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { updatePopupSettings } from "../actions/popupSettingsActions";
import { usePopupSettingsStore } from "../stores/popupSettingsStore";

export function useOverlaySettingsState() {
  const { extensionEnabled, overlayPosition } = usePopupSettingsStore(
    useShallow((state) => ({
      extensionEnabled: state.settings.extensionEnabled,
      overlayPosition: state.settings.overlayPosition
    }))
  );

  return {
    extensionEnabled,
    onChangeSettings: (patch: Partial<ExtensionSettings>) =>
      void updatePopupSettings(patch as RuntimeSettingsPatch),
    overlayPosition
  };
}
