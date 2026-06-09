import { useShallow } from "zustand/react/shallow";
import { usePopupStore } from "../store";

export function usePopupShell() {
  return usePopupStore(
    useShallow((state) => ({
      activeTab: state.activeTab,
      error: state.error,
      onChangeTab: state.setActiveTab
    }))
  );
}
