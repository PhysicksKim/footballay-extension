import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { OverlayButton } from "@/components/OverlayButton";
import { OverlayPanel } from "@/components/OverlayPanel";
import type { LiveMatchOverlayData } from "@/features/live-match/types";
import type { ExtensionSettings } from "@/features/overlay/overlayTypes";
import { getOverlayPositionClass } from "@/features/overlay/position";
import { defaultSettings } from "@/shared/constants";
import type { PageOverlayState, RuntimeMessage, RuntimeResponse } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import { isSupportedStreamingUrl } from "@/shared/url";
import "@/styles/overlay.css";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  main(ctx) {
    const rootElement = document.createElement("div");
    rootElement.id = "footballay-overlay-root";
    document.documentElement.append(rootElement);

    const root = createRoot(rootElement);
    root.render(<FootballayOverlayApp />);

    ctx.onInvalidated(() => {
      root.unmount();
      rootElement.remove();
    });
  }
});

function FootballayOverlayApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
  const [data, setData] = useState<LiveMatchOverlayData | null>(null);
  const [manualVisible, setManualVisible] = useState(false);
  const isSupportedPage = useMemo(() => isSupportedStreamingUrl(window.location.href), []);
  const shouldRenderControl = isSupportedPage || manualVisible;

  useEffect(() => {
    void loadInitialState();
  }, []);

  useEffect(() => {
    const listener = (
      message: RuntimeMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: RuntimeResponse) => void
    ) => {
      if (message.type === "SETTINGS_UPDATED") {
        setSettings(message.payload);
      }

      if (message.type === "LIVE_MATCH_DATA_UPDATED") {
        setData(message.payload);
      }

      if (message.type === "GET_PAGE_OVERLAY_STATE") {
        sendResponse({ ok: true, pageOverlayState: getPageOverlayState() });
        return true;
      }

      if (message.type === "SHOW_PAGE_OVERLAY") {
        setManualVisible(true);
        sendResponse({
          ok: true,
          pageOverlayState: getPageOverlayState({ manualVisible: true })
        });
        return true;
      }

      if (message.type === "HIDE_PAGE_OVERLAY") {
        setManualVisible(false);
        sendResponse({
          ok: true,
          pageOverlayState: getPageOverlayState({ manualVisible: false })
        });
        return true;
      }

      return undefined;
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [isSupportedPage, manualVisible, settings.overlayEnabled]);

  const shellClassName = useMemo(
    () => `footballay-overlay-shell ${getOverlayPositionClass(settings.overlayPosition)}`,
    [settings.overlayPosition]
  );

  async function loadInitialState() {
    const settingsResponse = await sendRuntimeMessage({ type: "GET_SETTINGS" });
    if (settingsResponse.ok && "settings" in settingsResponse) {
      setSettings(settingsResponse.settings);
    }

    const dataResponse = await sendRuntimeMessage({ type: "GET_LATEST_MATCH_DATA" });
    if (dataResponse.ok && "data" in dataResponse) {
      setData(dataResponse.data);
    }
  }

  function getPageOverlayState(override?: Partial<PageOverlayState>): PageOverlayState {
    const nextManualVisible = override?.manualVisible ?? manualVisible;
    const nextVisible = settings.overlayEnabled && (isSupportedPage || nextManualVisible);

    return {
      isSupportedPage,
      manualVisible: nextManualVisible,
      visible: nextVisible,
      url: window.location.href,
      ...override
    };
  }

  async function updateOverlaySettings(patch: Partial<ExtensionSettings>) {
    const response = await sendRuntimeMessage({ type: "UPDATE_SETTINGS", payload: patch });
    if (response.ok && "settings" in response) {
      setSettings(response.settings);
    }
  }

  if (!shouldRenderControl) {
    return null;
  }

  return (
    <div className={shellClassName}>
      {!settings.overlayEnabled ? (
        <OverlayButton label="F" muted onClick={() => void updateOverlaySettings({ overlayEnabled: true })} />
      ) : settings.overlayCollapsed ? (
        <OverlayButton onClick={() => void updateOverlaySettings({ overlayCollapsed: false })} />
      ) : (
        <OverlayPanel
          data={data}
          onCollapse={() => void updateOverlaySettings({ overlayCollapsed: true })}
          onDisable={() => {
            if (isSupportedPage) {
              void updateOverlaySettings({ overlayEnabled: false, overlayCollapsed: true });
              return;
            }

            setManualVisible(false);
          }}
        />
      )}
    </div>
  );
}
