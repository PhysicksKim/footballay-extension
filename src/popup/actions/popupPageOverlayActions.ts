import { sendActiveTabMessage } from "../services/runtimeClient";
import { t } from "@/shared/i18n/locale";
import {
  resolveCurrentPageOverlayState,
  shouldDisableGlobalOverlayForSupportedPage
} from "../services/pageOverlayFlow";
import { usePopupPageOverlayStore } from "../stores/popupPageOverlayStore";
import { usePopupSettingsStore } from "../stores/popupSettingsStore";
import { usePopupUiStore } from "../stores/popupUiStore";
import { updatePopupSettings } from "./popupSettingsActions";

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

  if (!usePopupSettingsStore.getState().settings.overlayEnabled) {
    await updatePopupSettings({ overlayEnabled: true });
  }

  const response = await sendActiveTabMessage({ type: "SHOW_PAGE_OVERLAY" });
  if (response?.ok && "pageOverlayState" in response) {
    usePopupPageOverlayStore.getState().setPageOverlayState(response.pageOverlayState);
    return;
  }

  await refreshPageOverlayState();
  usePopupUiStore.getState().setError(t("popup.error.pageOverlayUnavailable"));
}

export async function hideOverlayOnCurrentPage(): Promise<void> {
  usePopupUiStore.getState().clearError();

  const { pageOverlayState } = usePopupPageOverlayStore.getState();
  const { settings } = usePopupSettingsStore.getState();
  if (shouldDisableGlobalOverlayForSupportedPage(pageOverlayState, settings)) {
    await updatePopupSettings({ overlayEnabled: false });
    await refreshPageOverlayState();
    return;
  }

  const response = await sendActiveTabMessage({ type: "HIDE_PAGE_OVERLAY" });
  if (response?.ok && "pageOverlayState" in response) {
    usePopupPageOverlayStore.getState().setPageOverlayState(response.pageOverlayState);
  }
}
