import { useEffect, useState } from "react";
import { MatchSelector } from "@/components/MatchSelector";
import type { LiveMatchOverlayData } from "@/features/live-match/types";
import type { ExtensionSettings, OverlayPosition } from "@/features/overlay/overlayTypes";
import { overlayPositions } from "@/features/overlay/position";
import { defaultSettings } from "@/shared/constants";
import type { PageOverlayState, RuntimeMessage, RuntimeResponse } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import { isSupportedStreamingUrl } from "@/shared/url";

export function App() {
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
  const [data, setData] = useState<LiveMatchOverlayData | null>(null);
  const [pageOverlayState, setPageOverlayState] = useState<PageOverlayState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadState();

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

  async function loadState() {
    const settingsResponse = await sendRuntimeMessage({ type: "GET_SETTINGS" });
    if (settingsResponse.ok && "settings" in settingsResponse) {
      setSettings(settingsResponse.settings);
    }

    const dataResponse = await sendRuntimeMessage({ type: "GET_LATEST_MATCH_DATA" });
    if (dataResponse.ok && "data" in dataResponse) {
      setData(dataResponse.data);
    }

    await refreshPageOverlayState();
  }

  async function updateSettings(patch: Partial<ExtensionSettings>) {
    setError(null);
    const response = await sendRuntimeMessage({ type: "UPDATE_SETTINGS", payload: patch });

    if (response.ok && "settings" in response) {
      setSettings(response.settings);
      return;
    }

    if (!response.ok) {
      setError(response.error);
    }
  }

  async function selectFixture(fixtureId: number | undefined) {
    if (!fixtureId) {
      await updateSettings({ selectedFixtureId: undefined });
      return;
    }

    const response = await sendRuntimeMessage({
      type: "SELECT_FIXTURE",
      payload: { fixtureId }
    });

    if (response.ok && "settings" in response) {
      setSettings(response.settings);
    }
  }

  async function refreshPageOverlayState() {
    const tabResponse = await sendActiveTabMessage({ type: "GET_PAGE_OVERLAY_STATE" });
    if (tabResponse?.ok && "pageOverlayState" in tabResponse) {
      setPageOverlayState(tabResponse.pageOverlayState);
      return;
    }

    const activeTab = await getActiveTab();
    setPageOverlayState(
      activeTab?.url
        ? {
            isSupportedPage: isSupportedStreamingUrl(activeTab.url),
            manualVisible: false,
            visible: false,
            url: activeTab.url
          }
        : null
    );
  }

  async function showOverlayOnCurrentPage() {
    setError(null);

    if (!settings.overlayEnabled) {
      await updateSettings({ overlayEnabled: true });
    }

    const response = await sendActiveTabMessage({ type: "SHOW_PAGE_OVERLAY" });
    if (response?.ok && "pageOverlayState" in response) {
      setPageOverlayState(response.pageOverlayState);
      return;
    }

    setError("This page cannot run the overlay");
  }

  async function hideOverlayOnCurrentPage() {
    setError(null);
    const response = await sendActiveTabMessage({ type: "HIDE_PAGE_OVERLAY" });
    if (response?.ok && "pageOverlayState" in response) {
      setPageOverlayState(response.pageOverlayState);
    }
  }

  async function sendActiveTabMessage(message: RuntimeMessage): Promise<RuntimeResponse | null> {
    const activeTab = await getActiveTab();
    if (!activeTab?.id) {
      return null;
    }

    try {
      return (await chrome.tabs.sendMessage(activeTab.id, message)) as RuntimeResponse;
    } catch {
      return null;
    }
  }

  async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    return activeTab ?? null;
  }

  const canControlCurrentPage = pageOverlayState?.url.startsWith("http") ?? false;
  const currentPageLabel = pageOverlayState?.isSupportedPage
    ? "Auto overlay page"
    : pageOverlayState
      ? "Manual overlay page"
      : "Unavailable page";

  return (
    <main className="footballay-popup">
      <header className="footballay-popup__header">
        <div>
          <h1>Footballay</h1>
          <p>Live stats overlay</p>
        </div>
        <label className="footballay-switch">
          <input
            checked={settings.overlayEnabled}
            type="checkbox"
            onChange={(event) => void updateSettings({ overlayEnabled: event.currentTarget.checked })}
          />
          <span />
        </label>
      </header>

      <section className="footballay-popup-card">
        <span>Current Page</span>
        <strong>{currentPageLabel}</strong>
        <button
          className="footballay-popup-button"
          disabled={!canControlCurrentPage}
          type="button"
          onClick={() =>
            void (pageOverlayState?.visible ? hideOverlayOnCurrentPage() : showOverlayOnCurrentPage())
          }
        >
          {pageOverlayState?.visible ? "Hide on this page" : "Show on this page"}
        </button>
      </section>

      <section className="footballay-popup-section">
        <MatchSelector selectedFixtureId={settings.selectedFixtureId} onSelectFixture={selectFixture} />

        <label className="footballay-popup-field">
          <span>Position</span>
          <select
            value={settings.overlayPosition}
            onChange={(event) =>
              void updateSettings({ overlayPosition: event.currentTarget.value as OverlayPosition })
            }
          >
            {overlayPositions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>

        <label className="footballay-popup-check">
          <input
            checked={settings.overlayCollapsed}
            type="checkbox"
            onChange={(event) => void updateSettings({ overlayCollapsed: event.currentTarget.checked })}
          />
          <span>Collapsed</span>
        </label>
      </section>

      <section className="footballay-popup-card">
        <span>Current Match</span>
        {data ? (
          <strong>
            {data.homeTeamName} {data.homeScore} - {data.awayScore} {data.awayTeamName}
          </strong>
        ) : (
          <strong>No live data</strong>
        )}
      </section>

      {error ? <p className="footballay-popup-error">{error}</p> : null}
    </main>
  );
}
