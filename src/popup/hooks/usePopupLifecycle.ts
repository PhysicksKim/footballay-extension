import { useCallback, useMemo } from "react";
import type { RuntimeMessage } from "@/shared/messages";
import { usePopupStore } from "../store";

export function usePopupLifecycle() {
  const loadState = usePopupStore((state) => state.loadState);
  const handleRuntimeMessage = usePopupStore((state) => state.handleRuntimeMessage);
  const load = useCallback(() => void loadState(), [loadState]);
  const handleMessage = useCallback(
    (message: RuntimeMessage) => handleRuntimeMessage(message),
    [handleRuntimeMessage]
  );

  return useMemo(
    () => ({
      handleRuntimeMessage: handleMessage,
      loadState: load
    }),
    [handleMessage, load]
  );
}
