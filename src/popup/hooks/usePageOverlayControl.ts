import { useShallow } from "zustand/react/shallow";
import {
  hideOverlayOnCurrentPage,
  showOverlayOnCurrentPage
} from "../actions/popupPageOverlayActions";
import { usePopupPageOverlayStore } from "../stores/popupPageOverlayStore";

export function usePageOverlayControl() {
  const { pageOverlayState, pageOverlayStateLoading } = usePopupPageOverlayStore(
    useShallow((state) => ({
      pageOverlayState: state.pageOverlayState,
      pageOverlayStateLoading: state.pageOverlayStateLoading
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
