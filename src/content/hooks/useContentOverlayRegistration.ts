import { useEffect } from "react";
import { sendRuntimeMessage } from "@/shared/messages";
import { refreshLatestMatchData } from "@/content/actions/contentOverlayActions";
import { selectShouldRegisterContentOverlay } from "@/content/selectors/contentOverlaySelectors";
import { useContentPageOverlayStore } from "@/content/stores/contentPageOverlayStore";
import { useContentSettingsStore } from "@/content/stores/contentSettingsStore";

export function useContentOverlayRegistration(): void {
  const settings = useContentSettingsStore((state) => state.settings);
  const isSupportedPage = useContentPageOverlayStore((state) => state.isSupportedPage);
  const manualVisible = useContentPageOverlayStore((state) => state.manualVisible);
  const pageUrl = useContentPageOverlayStore((state) => state.pageUrl);
  const shouldRegisterOverlay = selectShouldRegisterContentOverlay(settings, {
    isSupportedPage,
    manualVisible,
    pageUrl
  });

  useEffect(() => {
    if (!shouldRegisterOverlay) {
      void sendRuntimeMessage({ type: "UNREGISTER_CONTENT_OVERLAY" });
      return undefined;
    }

    void sendRuntimeMessage({ type: "REGISTER_CONTENT_OVERLAY" });
    void refreshLatestMatchData();

    return () => {
      void sendRuntimeMessage({ type: "UNREGISTER_CONTENT_OVERLAY" });
    };
  }, [shouldRegisterOverlay]);
}
