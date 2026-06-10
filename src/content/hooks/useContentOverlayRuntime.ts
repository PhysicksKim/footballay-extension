import { useEffect } from "react";
import type { RuntimeMessage, RuntimeResponse } from "@/shared/messages";
import {
  handleContentRuntimeMessage,
  loadInitialContentOverlayState
} from "@/content/actions/contentOverlayActions";

export function useContentOverlayRuntime(): void {
  useEffect(() => {
    void loadInitialContentOverlayState();
  }, []);

  useEffect(() => {
    const listener = (
      message: RuntimeMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: RuntimeResponse) => void
    ) => {
      const response = handleContentRuntimeMessage(message);
      if (response) {
        sendResponse(response);
        return true;
      }

      return undefined;
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);
}
