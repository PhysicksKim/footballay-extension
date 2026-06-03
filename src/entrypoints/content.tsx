import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { OverlayButton } from "@/components/OverlayButton";
import { OverlayPanel } from "@/components/OverlayPanel";
import type { LiveMatchOverlayData } from "@/features/live-match/types";
import type { ExtensionSettings } from "@/features/overlay/overlayTypes";
import { getOverlayPositionClass } from "@/features/overlay/position";
import { defaultSettings } from "@/shared/constants";
import type { RuntimeMessage } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import "@/styles/overlay.css";

export default defineContentScript({
  matches: ["https://www.coupangplay.com/*", "https://www.spotvnow.co.kr/*"],
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

  useEffect(() => {
    void loadInitialState();

    const listener = (message: RuntimeMessage) => {
      if (message.type === "SETTINGS_UPDATED") {
        setSettings(message.payload);
      }

      if (message.type === "LIVE_MATCH_DATA_UPDATED") {
        setData(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

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

  async function updateOverlaySettings(patch: Partial<ExtensionSettings>) {
    const response = await sendRuntimeMessage({ type: "UPDATE_SETTINGS", payload: patch });
    if (response.ok && "settings" in response) {
      setSettings(response.settings);
    }
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
          onDisable={() => void updateOverlaySettings({ overlayEnabled: false, overlayCollapsed: true })}
        />
      )}
    </div>
  );
}
