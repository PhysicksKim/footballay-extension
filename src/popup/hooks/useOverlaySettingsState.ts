import { useShallow } from "zustand/react/shallow";
import type { RuntimeSettingsPatch } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { updatePopupSettings } from "../actions/popupSettingsActions";
import { usePopupSettingsStore } from "../stores/popupSettingsStore";

export function useOverlaySettingsState() {
  const { overlayPosition } = usePopupSettingsStore(
    useShallow((state) => ({
      overlayPosition: state.settings.overlayPosition
    }))
  );

  return {
    onChangeSettings: (patch: Partial<ExtensionSettings>) =>
      void updatePopupSettings(patch as RuntimeSettingsPatch),
    overlayPosition
  };
}
