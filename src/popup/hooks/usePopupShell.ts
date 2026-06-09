import { useShallow } from "zustand/react/shallow";
import { usePopupUiStore } from "../stores/popupUiStore";

export function usePopupShell() {
  return usePopupUiStore(
    useShallow((state) => ({
      activeTab: state.activeTab,
      error: state.error,
      onChangeTab: state.setActiveTab
    }))
  );
}
