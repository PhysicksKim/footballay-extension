import { useShallow } from "zustand/react/shallow";
import { usePopupStore } from "../store";

export function usePageOverlayControl() {
  const {
    hideOverlayOnCurrentPage,
    pageOverlayState,
    pageOverlayStateLoading,
    showOverlayOnCurrentPage
  } = usePopupStore(
    useShallow((state) => ({
      hideOverlayOnCurrentPage: state.hideOverlayOnCurrentPage,
      pageOverlayState: state.pageOverlayState,
      pageOverlayStateLoading: state.pageOverlayStateLoading,
      showOverlayOnCurrentPage: state.showOverlayOnCurrentPage
    }))
  );

  return {
    canControl: pageOverlayState?.url.startsWith("http") ?? false,
    onToggle: (visible: boolean) =>
      visible ? void showOverlayOnCurrentPage() : void hideOverlayOnCurrentPage(),
    pending: pageOverlayStateLoading,
    visible: pageOverlayState?.visible ?? false
  };
}
