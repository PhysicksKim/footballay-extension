import type { PageOverlayState } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";

type PageOverlaySnapshot = {
  isSupportedPage: boolean;
  manualVisible: boolean;
  pageUrl: string;
};

export function getPageOverlayState(
  settings: ExtensionSettings,
  pageOverlay: PageOverlaySnapshot,
  override?: Partial<PageOverlayState>
): PageOverlayState {
  const nextManualVisible = override?.manualVisible ?? pageOverlay.manualVisible;
  const nextVisible = settings.overlayEnabled && (pageOverlay.isSupportedPage || nextManualVisible);

  return {
    isSupportedPage: pageOverlay.isSupportedPage,
    manualVisible: nextManualVisible,
    visible: nextVisible,
    url: pageOverlay.pageUrl,
    ...override
  };
}

export function selectShouldRenderOverlayControl(pageOverlay: PageOverlaySnapshot): boolean {
  return pageOverlay.isSupportedPage || pageOverlay.manualVisible;
}

export function selectShouldRegisterContentOverlay(
  _settings: ExtensionSettings,
  pageOverlay: PageOverlaySnapshot
): boolean {
  return selectShouldRenderOverlayControl(pageOverlay);
}
