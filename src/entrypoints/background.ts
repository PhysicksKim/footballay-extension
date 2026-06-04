import { createLiveMatchBackgroundController } from "@/background/liveMatchController";
import type { RuntimeMessage } from "@/shared/messages";

const liveMatchController = createLiveMatchBackgroundController();

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    void liveMatchController.startPolling();
  });

  chrome.runtime.onStartup.addListener(() => {
    void liveMatchController.startPolling();
  });

  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    void liveMatchController.handleRuntimeMessage(message).then(sendResponse);
    return true;
  });

  void liveMatchController.startPolling();
});
