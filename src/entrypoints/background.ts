import { createLiveMatchBackgroundController } from "@/background/liveMatchController";
import type { RuntimeMessage } from "@/shared/messages";

const liveMatchController = createLiveMatchBackgroundController();

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    void liveMatchController.initialize();
  });

  chrome.runtime.onStartup.addListener(() => {
    void liveMatchController.initialize();
  });

  chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
    void liveMatchController.handleRuntimeMessage(message, sender).then(sendResponse);
    return true;
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    liveMatchController.handleTabRemoved(tabId);
  });

  void liveMatchController.initialize();
});
