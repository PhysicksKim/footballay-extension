import { useCallback, useMemo } from "react";
import type { RuntimeMessage } from "@/shared/messages";
import { loadPopupState } from "../actions/popupLifecycleActions";
import { handlePopupRuntimeMessage } from "../actions/popupRuntimeActions";

export function usePopupLifecycle() {
  const load = useCallback(() => void loadPopupState(), []);
  const handleMessage = useCallback(
    (message: RuntimeMessage) => handlePopupRuntimeMessage(message),
    []
  );

  return useMemo(
    () => ({
      handleRuntimeMessage: handleMessage,
      loadState: load
    }),
    [handleMessage, load]
  );
}
