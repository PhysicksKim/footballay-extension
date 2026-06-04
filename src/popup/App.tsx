import { useEffect, useState } from "react";
import type { AvailableLeague, FixtureSummary, LiveMatchOverlayData } from "@/domain/live-match/types";
import type { ExtensionSettings, OverlayPosition } from "@/shared/overlay/types";
import { overlayPositions } from "@/shared/overlay/position";
import { defaultSettings } from "@/shared/constants";
import type { PageOverlayState, RuntimeMessage, RuntimeResponse } from "@/shared/messages";
import { sendRuntimeMessage } from "@/shared/messages";
import { isSupportedStreamingUrl } from "@/shared/url";

export function App() {
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
  const [data, setData] = useState<LiveMatchOverlayData | null>(null);
  const [leagues, setLeagues] = useState<AvailableLeague[]>([]);
  const [fixtures, setFixtures] = useState<FixtureSummary[]>([]);
  const [pageOverlayState, setPageOverlayState] = useState<PageOverlayState | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [fixtureQueryLoading, setFixtureQueryLoading] = useState(false);
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
    setLoadingText("Loading");
    setError(null);

    try {
      const settingsResponse = await sendRuntimeMessage({ type: "GET_SETTINGS" });
      if (settingsResponse.ok && "settings" in settingsResponse) {
        setSettings(settingsResponse.settings);
      }

      const dataResponse = await sendRuntimeMessage({ type: "GET_LATEST_MATCH_DATA" });
      if (dataResponse.ok && "data" in dataResponse) {
        setData(dataResponse.data);
      }

      const leaguesResponse = await sendRuntimeMessage({ type: "GET_AVAILABLE_LEAGUES" });
      if (leaguesResponse.ok && "leagues" in leaguesResponse) {
        setLeagues(leaguesResponse.leagues);
      } else if (!leaguesResponse.ok) {
        setError(leaguesResponse.error);
      }

      if (settingsResponse.ok && "settings" in settingsResponse && settingsResponse.settings.selectedLeagueUid) {
        await loadFixtures(settingsResponse.settings);
      }

      await refreshPageOverlayState();
    } finally {
      setLoadingText(null);
    }
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

  async function selectLeague(leagueUid: string) {
    setLoadingText("Loading fixtures");
    setError(null);

    if (!leagueUid) {
      setFixtures([]);
      await updateSettings({ selectedLeagueUid: undefined, selectedFixtureUid: undefined });
      setLoadingText(null);
      return;
    }

    try {
      const initialFixtureDate = getTodayDateInputValue();
      const initialLookupMode = "nearest";
      const response = await sendRuntimeMessage({
        type: "SELECT_LEAGUE",
        payload: {
          leagueUid,
          date: initialFixtureDate,
          mode: initialLookupMode,
          timezone: getBrowserTimezone()
        }
      });

      if (response.ok && "settings" in response && "fixtures" in response) {
        setSettings(response.settings);
        setFixtures(response.fixtures);
        setData(null);
        await syncResolvedFixtureDate(response.settings, response.fixtures);
      } else if (!response.ok) {
        setError(response.error);
      }
    } finally {
      setLoadingText(null);
    }
  }

  async function navigateFixtureDate(direction: "previous" | "next") {
    const baseDate = getQueryDate(settings);
    await updateFixtureQuery({
      fixtureDate: addDaysToDateInputValue(baseDate, direction === "previous" ? -1 : 1),
      fixtureLookupMode: direction === "previous" ? "previous" : "nearest"
    });
  }

  async function selectFixture(fixtureUid: string) {
    setError(null);

    if (!fixtureUid) {
      await updateSettings({ selectedFixtureUid: undefined });
      return;
    }

    const response = await sendRuntimeMessage({
      type: "SELECT_FIXTURE",
      payload: { fixtureUid }
    });

    if (response.ok && "settings" in response) {
      setSettings(response.settings);
    } else if (!response.ok) {
      setError(response.error);
    }
  }

  async function updateFixtureQuery(patch: Partial<Pick<ExtensionSettings, "fixtureDate" | "fixtureLookupMode">>) {
    setFixtureQueryLoading(true);
    setError(null);

    const nextSettings = {
      ...settings,
      ...patch,
      selectedFixtureUid: undefined
    };

    try {
      if (nextSettings.selectedLeagueUid) {
        const nextFixtures = await loadFixtures(nextSettings);
        if (!nextFixtures) {
          return;
        }

        const resolvedDate =
          nextSettings.fixtureLookupMode === "exact"
            ? nextSettings.fixtureDate
            : getFixtureDateFromFixtures(nextFixtures) ?? nextSettings.fixtureDate;

        await updateSettings({
          ...patch,
          fixtureDate: resolvedDate,
          selectedFixtureUid: undefined
        });
        setData(null);
      } else {
        await updateSettings({ ...patch, selectedFixtureUid: undefined });
      }
    } finally {
      setFixtureQueryLoading(false);
    }
  }

  async function loadFixtures(nextSettings: ExtensionSettings): Promise<FixtureSummary[] | null> {
    if (!nextSettings.selectedLeagueUid) {
      setFixtures([]);
      return [];
    }

    const response = await sendRuntimeMessage({
      type: "GET_FIXTURES_BY_LEAGUE",
      payload: {
        leagueUid: nextSettings.selectedLeagueUid,
        date: getQueryDate(nextSettings),
        mode: nextSettings.fixtureLookupMode,
        timezone: getBrowserTimezone()
      }
    });

    if (response.ok && "fixtures" in response) {
      setFixtures(response.fixtures);
      return response.fixtures;
    }

    if (!response.ok) {
      setError(response.error);
    }

    return null;
  }

  async function syncResolvedFixtureDate(nextSettings: ExtensionSettings, nextFixtures: FixtureSummary[] | null) {
    if (nextSettings.fixtureLookupMode === "exact") {
      return;
    }

    if (!nextFixtures) {
      return;
    }

    const resolvedDate = getFixtureDateFromFixtures(nextFixtures);
    if (!resolvedDate || resolvedDate === nextSettings.fixtureDate) {
      return;
    }

    const response = await sendRuntimeMessage({
      type: "UPDATE_SETTINGS",
      payload: { fixtureDate: resolvedDate }
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
  const selectedLeague = leagues.find((league) => league.uid === settings.selectedLeagueUid);
  const selectedFixture = fixtures.find((fixture) => fixture.uid === settings.selectedFixtureUid);

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

      <section className="footballay-picker">
        <div className="footballay-section-title">
          <span>League</span>
          <strong>{selectedLeague ? getLeagueLabel(selectedLeague) : "Select one"}</strong>
        </div>

        <div className="footballay-league-strip" role="listbox" aria-label="Leagues">
          {leagues.map((league) => {
            const selected = league.uid === settings.selectedLeagueUid;

            return (
              <button
                key={league.uid}
                className={`footballay-league-card${selected ? " footballay-league-card--selected" : ""}`}
                type="button"
                aria-pressed={selected}
                onClick={() => void selectLeague(league.uid)}
              >
                {getLeagueLabel(league)}
              </button>
            );
          })}
        </div>

        <div className="footballay-date-nav">
          <button
            type="button"
            aria-label="Previous fixture date"
            disabled={fixtureQueryLoading}
            onClick={() => void navigateFixtureDate("previous")}
          >
            &lt;
          </button>
          <label
            className={`footballay-date-picker${
              fixtureQueryLoading ? " footballay-date-picker--loading" : ""
            }`}
          >
            <span>{fixtureQueryLoading ? "Loading fixtures" : formatSelectedDate(settings.fixtureDate)}</span>
            <input
              type="date"
              disabled={fixtureQueryLoading}
              value={settings.fixtureDate ?? getTodayDateInputValue()}
              onChange={(event) =>
                void updateFixtureQuery({
                  fixtureDate: event.currentTarget.value || undefined,
                  fixtureLookupMode: "exact"
                })
              }
            />
          </label>
          <button
            type="button"
            aria-label="Next fixture date"
            disabled={fixtureQueryLoading}
            onClick={() => void navigateFixtureDate("next")}
          >
            &gt;
          </button>
        </div>

        <div className="footballay-fixture-list" aria-label="Fixtures">
          {loadingText && !fixtures.length ? (
            <p className="footballay-empty-state">{loadingText}</p>
          ) : !settings.selectedLeagueUid ? (
            <p className="footballay-empty-state">Select a league</p>
          ) : fixtures.length ? (
            fixtures.map((fixture) => (
              <button
                key={fixture.uid}
                className={`footballay-fixture-row${
                  fixture.uid === settings.selectedFixtureUid ? " footballay-fixture-row--selected" : ""
                }`}
                type="button"
                onClick={() => void selectFixture(fixture.uid)}
              >
                <span className="footballay-fixture-time">{formatKickoffTime(fixture.kickoff)}</span>
                <span className="footballay-fixture-teams">
                  <strong>{fixture.homeTeamName}</strong>
                  <span>{fixture.awayTeamName}</span>
                </span>
                <span className="footballay-fixture-score">{formatFixtureScore(fixture)}</span>
                <span className="footballay-fixture-status">{formatFixtureStatus(fixture)}</span>
                <span className="footballay-fixture-action">
                  {fixture.uid === settings.selectedFixtureUid ? "Selected" : "Select"}
                </span>
              </button>
            ))
          ) : (
            <p className="footballay-empty-state">No fixtures</p>
          )}
        </div>
      </section>

      <section className="footballay-popup-section">

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
        {selectedFixture ? (
          <strong>{formatFixtureLabel(selectedFixture)}</strong>
        ) : data ? (
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

function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getQueryDate(settings: ExtensionSettings): string {
  return settings.fixtureDate ?? getTodayDateInputValue();
}

function getTodayDateInputValue(): string {
  const date = new Date();
  return toDateInputValue(date);
}

function getFixtureDateFromFixtures(fixtures: FixtureSummary[]): string | undefined {
  const kickoff = fixtures.find((fixture) => fixture.kickoff)?.kickoff;
  if (!kickoff) {
    return undefined;
  }

  return toDateInputValue(new Date(kickoff));
}

function toDateInputValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function addDaysToDateInputValue(dateInputValue: string, days: number): string {
  const date = new Date(`${dateInputValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function getLeagueLabel(league: AvailableLeague): string {
  return league.nameKo ?? league.name;
}

function formatFixtureLabel(fixture: FixtureSummary): string {
  const score =
    fixture.homeScore !== null &&
    fixture.homeScore !== undefined &&
    fixture.awayScore !== null &&
    fixture.awayScore !== undefined
      ? ` ${fixture.homeScore}-${fixture.awayScore}`
      : "";
  const kickoff = fixture.kickoff ? ` ${new Date(fixture.kickoff).toLocaleDateString()}` : "";

  return `${fixture.homeTeamName} vs ${fixture.awayTeamName}${score}${kickoff}`;
}

function formatSelectedDate(date?: string): string {
  const selectedDate = new Date(`${date ?? getTodayDateInputValue()}T00:00:00`);
  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(selectedDate);

  return `${month}.${String(day).padStart(2, "0")} ${weekday}`;
}

function formatKickoffTime(kickoff?: string | null): string {
  if (!kickoff) {
    return "--:--";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(kickoff));
}

function formatFixtureScore(fixture: FixtureSummary): string {
  const homeScore = fixture.homeScore ?? "-";
  const awayScore = fixture.awayScore ?? "-";

  return `${homeScore}:${awayScore}`;
}

function formatFixtureStatus(fixture: FixtureSummary): string {
  if (fixture.elapsed) {
    return `${fixture.elapsed}'`;
  }

  return fixture.statusShort;
}
