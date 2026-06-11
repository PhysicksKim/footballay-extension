import type { PageOverlayState } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";

type PageOverlaySnapshot = {
  isSupportedPage: boolean;
  pageUrl: string;
  siteOverlayVisible: boolean;
};

export function getPageOverlayState(
  settings: ExtensionSettings,
  pageOverlay: PageOverlaySnapshot,
  override?: Partial<PageOverlayState>
): PageOverlayState {
  const nextSiteOverlayVisible = override?.siteOverlayVisible ?? pageOverlay.siteOverlayVisible;
  const nextVisible = settings.extensionEnabled && nextSiteOverlayVisible;

  return {
    isSupportedPage: pageOverlay.isSupportedPage,
    siteOverlayVisible: nextSiteOverlayVisible,
    visible: nextVisible,
    url: pageOverlay.pageUrl,
    ...override
  };
}

export function selectShouldRenderOverlayControl(pageOverlay: PageOverlaySnapshot): boolean {
  return pageOverlay.isSupportedPage || pageOverlay.siteOverlayVisible;
}

export function selectShouldRegisterContentOverlay(
  _settings: ExtensionSettings,
  pageOverlay: PageOverlaySnapshot
): boolean {
  return selectShouldRenderOverlayControl(pageOverlay);
}
