import { useEffect } from "react";
import { useContentOverlayStore } from "../store";
import type { RuntimeMessage, RuntimeResponse } from "@/shared/messages";

export function useContentOverlayRuntime(): void {
  const handleRuntimeMessage = useContentOverlayStore((state) => state.handleRuntimeMessage);
  const loadInitialState = useContentOverlayStore((state) => state.loadInitialState);

  useEffect(() => {
    void loadInitialState();
  }, [loadInitialState]);

  useEffect(() => {
    const listener = (
      message: RuntimeMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: RuntimeResponse) => void
    ) => {
      const response = handleRuntimeMessage(message);
      if (response) {
        sendResponse(response);
        return true;
      }

      return undefined;
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [handleRuntimeMessage]);
}
