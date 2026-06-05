import { useEffect } from "react";
import { sendRuntimeMessage } from "@/shared/messages";
import { selectShouldRegisterContentOverlay, useContentOverlayStore } from "../store";

export function useContentOverlayRegistration(): void {
  const shouldRegisterOverlay = useContentOverlayStore(selectShouldRegisterContentOverlay);
  const refreshLatestMatchData = useContentOverlayStore((state) => state.refreshLatestMatchData);

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
  }, [refreshLatestMatchData, shouldRegisterOverlay]);
}
