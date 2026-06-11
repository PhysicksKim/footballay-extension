import { sendActiveTabMessage } from "../services/runtimeClient";
import { t } from "@/shared/i18n/locale";
import {
  resolveCurrentPageOverlayState
} from "../services/pageOverlayFlow";
import { usePopupPageOverlayStore } from "../stores/popupPageOverlayStore";
import { usePopupUiStore } from "../stores/popupUiStore";

export async function refreshPageOverlayState(): Promise<void> {
  const pageOverlayStore = usePopupPageOverlayStore.getState();
  pageOverlayStore.setPageOverlayStateLoading(true);

  try {
    pageOverlayStore.setPageOverlayState(await resolveCurrentPageOverlayState());
  } finally {
    usePopupPageOverlayStore.getState().setPageOverlayStateLoading(false);
  }
}

export async function showOverlayOnCurrentPage(): Promise<void> {
  usePopupUiStore.getState().clearError();
  usePopupPageOverlayStore.getState().setPageOverlayStateLoading(true);

  const response = await sendActiveTabMessage({ type: "SHOW_PAGE_OVERLAY" });
  if (response?.ok && "pageOverlayState" in response) {
    const pageOverlayStore = usePopupPageOverlayStore.getState();
    pageOverlayStore.setPageOverlayState(response.pageOverlayState);
    pageOverlayStore.setPageOverlayStateLoading(false);
    return;
  }

  await refreshPageOverlayState();
  usePopupUiStore.getState().setError(t("popup.error.pageOverlayUnavailable"));
}

export async function hideOverlayOnCurrentPage(): Promise<void> {
  usePopupUiStore.getState().clearError();
  usePopupPageOverlayStore.getState().setPageOverlayStateLoading(true);

  const response = await sendActiveTabMessage({ type: "HIDE_PAGE_OVERLAY" });
  if (response?.ok && "pageOverlayState" in response) {
    const pageOverlayStore = usePopupPageOverlayStore.getState();
    pageOverlayStore.setPageOverlayState(response.pageOverlayState);
    pageOverlayStore.setPageOverlayStateLoading(false);
    return;
  }

  usePopupPageOverlayStore.getState().setPageOverlayStateLoading(false);
}
