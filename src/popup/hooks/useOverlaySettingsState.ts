import { useShallow } from "zustand/react/shallow";
import type { RuntimeSettingsPatch } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { usePopupStore } from "../store";

export function useOverlaySettingsState() {
  const { overlayPosition, updateSettings } = usePopupStore(
    useShallow((state) => ({
      overlayPosition: state.settings.overlayPosition,
      updateSettings: state.updateSettings
    }))
  );

  return {
    onChangeSettings: (patch: Partial<ExtensionSettings>) =>
      void updateSettings(patch as RuntimeSettingsPatch),
    overlayPosition
  };
}
