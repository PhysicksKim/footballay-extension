import { useEffect, useMemo, useState } from "react";
import { OverlayButton } from "./components/OverlayButton";
import { OverlayPanel } from "./components/OverlayPanel";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { getOverlayPositionClass } from "@/shared/overlay/position";
import { defaultSettings } from "@/shared/constants";
import type { PageOverlayState, RuntimeMessage, RuntimeResponse } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import { isSupportedStreamingUrl } from "@/shared/url";

export function ContentOverlayApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
  const [data, setData] = useState<LiveMatchOverlayData | null>(null);
  const [manualVisible, setManualVisible] = useState(false);
  const isSupportedPage = useMemo(() => isSupportedStreamingUrl(window.location.href), []);
  const shouldRenderControl = isSupportedPage || manualVisible;
  const shouldRegisterOverlay = shouldRenderControl && settings.overlayEnabled;

  useEffect(() => {
    void loadInitialState();
  }, []);

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

    await refreshLatestMatchData();
  }

  async function refreshLatestMatchData() {
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
