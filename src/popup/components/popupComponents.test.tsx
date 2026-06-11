// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { FixtureSummary } from "@/domain/live-match/types";
import { defaultSettings } from "@/shared/constants";
import { PopupView } from "../PopupView";
import { FixtureDateNavigator } from "./FixtureDateNavigator";
import { FixtureList } from "./FixtureList";
import { LeaguePicker } from "./LeaguePicker";
import { OverlaySettingsSection } from "./OverlaySettingsSection";
import { PopupTabBar } from "./PopupTabBar";

const fixtures: FixtureSummary[] = [
  {
    available: true,
    awayScore: 1,
    awayTeamName: "Manchester City",
    elapsed: 90,
    homeScore: 1,
    homeTeamName: "Bournemouth",
    kickoff: "2026-05-20T12:00:00.000Z",
    round: "Regular Season - 37",
    statusLong: "Match Finished",
    statusShort: "FT",
    uid: "fixture-1"
  },
  {
    available: true,
    awayScore: null,
    awayTeamName: "Tottenham",
    elapsed: null,
    homeScore: null,
    homeTeamName: "Chelsea",
    kickoff: "2026-05-21T12:00:00.000Z",
    round: "Regular Season - 37",
    statusLong: "Not Started",
    statusShort: "NS",
    uid: "fixture-2"
  }
];

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    disconnect() {}
    unobserve() {}
  }

  window.ResizeObserver = ResizeObserverMock;
});

afterEach(() => {
  cleanup();
});

describe("popup components", () => {
  it("renders popup fixtures view and forwards primary actions", async () => {
    const user = userEvent.setup();
    const onChangeTab = vi.fn();
    const onSelectLeague = vi.fn();
    const onSelectFixture = vi.fn();
    const onNavigateFixtureDate = vi.fn();
    const onShowOverlayOnCurrentPage = vi.fn();

    render(
      <PopupView
        shell={{
          activeTab: "fixtures",
          error: null,
          onChangeTab
        }}
        pageOverlay={{
          canControl: true,
          onToggle: (visible) => {
            if (visible) {
              onShowOverlayOnCurrentPage();
            }
          },
          pending: false,
          visible: false
        }}
        leaguePicker={{
          leagues: [
            { name: "Premier League", uid: "league-1" },
            { name: "World Cup", uid: "league-2" }
          ],
          onSelectLeague,
          selectedLeagueUid: "league-1"
        }}
        fixtureSchedule={{
          disabled: false,
          fixtureDate: "2026-05-20",
          onNavigate: onNavigateFixtureDate,
          onReturnToSelectedFixtureDate: vi.fn(),
          onSelectDate: vi.fn(),
          selectedFixtureDate: undefined
        }}
        fixtureSelection={{
          fixtures,
          loadingText: null,
          onSelectFixture,
          selectedFixtureUid: "fixture-1",
          selectedLeagueUid: "league-1"
        }}
        overlaySettings={{
          extensionEnabled: defaultSettings.extensionEnabled,
          onChangeSettings: vi.fn(),
          overlayPosition: defaultSettings.overlayPosition
        }}
      />
    );

    expect(screen.getByText("Footballay")).toBeTruthy();
    expect(screen.getByText("Premier League")).toBeTruthy();
    expect(screen.getByText("Bournemouth")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "World Cup" }));
    await user.click(screen.getByRole("button", { name: "Next fixture date" }));
    await user.click(screen.getByRole("checkbox", { name: "Toggle page overlay" }));
    await user.click(screen.getByRole("button", { name: "Open settings" }));

    const unselectedFixtureButton = screen.getAllByRole("button", { name: "Select fixture" })[0];
    if (!unselectedFixtureButton) {
      throw new Error("Expected an unselected fixture button");
    }
    await user.click(unselectedFixtureButton);

    expect(onSelectLeague).toHaveBeenCalledWith("league-2");
    expect(onNavigateFixtureDate).toHaveBeenCalledWith("next");
    expect(onShowOverlayOnCurrentPage).toHaveBeenCalledTimes(1);
    expect(onChangeTab).toHaveBeenCalledWith("settings");
    expect(onSelectFixture).toHaveBeenCalledWith("fixture-2");
  });

  it("renders popup settings view and forwards setting actions", async () => {
    const user = userEvent.setup();
    const onChangeTab = vi.fn();
    const onUpdateSettings = vi.fn();

    render(
      <PopupView
        shell={{
          activeTab: "settings",
          error: "Popup error",
          onChangeTab
        }}
        pageOverlay={{
          canControl: false,
          onToggle: vi.fn(),
          pending: false,
          visible: false
        }}
        leaguePicker={{
          leagues: [],
          onSelectLeague: vi.fn(),
          selectedLeagueUid: undefined
        }}
        fixtureSchedule={{
          disabled: false,
          fixtureDate: undefined,
          onNavigate: vi.fn(),
          onReturnToSelectedFixtureDate: vi.fn(),
          onSelectDate: vi.fn(),
          selectedFixtureDate: undefined
        }}
        fixtureSelection={{
          fixtures: [],
          loadingText: null,
          onSelectFixture: vi.fn(),
          selectedFixtureUid: undefined,
          selectedLeagueUid: undefined
        }}
        overlaySettings={{
          extensionEnabled: true,
          onChangeSettings: onUpdateSettings,
          overlayPosition: "bottom-right"
        }}
      />
    );

    expect(screen.getByText("Setting")).toBeTruthy();
    expect(screen.getByText("Popup error")).toBeTruthy();

    await user.selectOptions(screen.getByRole("combobox"), "top-left");
    await user.click(screen.getByRole("button", { name: "Close settings" }));

    expect(onUpdateSettings).toHaveBeenCalledWith({ overlayPosition: "top-left" });
    expect(onChangeTab).toHaveBeenCalledWith("fixtures");
  });

  it("switches popup tab bar between fixtures and settings", async () => {
    const user = userEvent.setup();
    const onChangeTab = vi.fn();
    const onTogglePageOverlay = vi.fn();
    const { rerender } = render(
      <PopupTabBar
        activeTab="fixtures"
        canControlPageOverlay
        pageOverlayPending={false}
        pageOverlayVisible={false}
        onChangeTab={onChangeTab}
        onTogglePageOverlay={onTogglePageOverlay}
      />
    );

    expect(screen.getByText("Footballay")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Open settings" }));

    expect(onChangeTab).toHaveBeenCalledWith("settings");

    rerender(
      <PopupTabBar
        activeTab="settings"
        canControlPageOverlay
        pageOverlayPending={false}
        pageOverlayVisible={false}
        onChangeTab={onChangeTab}
        onTogglePageOverlay={onTogglePageOverlay}
      />
    );

    expect(screen.getByText("Setting")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Close settings" }));

    expect(onChangeTab).toHaveBeenCalledWith("fixtures");
  });

  it("toggles and disables the page overlay from popup tab bar", async () => {
    const user = userEvent.setup();
    const onTogglePageOverlay = vi.fn();
    const { rerender } = render(
      <PopupTabBar
        activeTab="fixtures"
        canControlPageOverlay
        pageOverlayPending={false}
        pageOverlayVisible={false}
        onChangeTab={vi.fn()}
        onTogglePageOverlay={onTogglePageOverlay}
      />
    );

    const overlayToggle = screen.getByRole("checkbox", { name: "Toggle page overlay" });
    expect(overlayToggle.closest("label")?.classList.contains("footballay-power--animated")).toBe(false);

    await user.click(overlayToggle);

    expect(onTogglePageOverlay).toHaveBeenCalledWith(true);
    expect(overlayToggle.closest("label")?.classList.contains("footballay-power--animated")).toBe(true);

    rerender(
      <PopupTabBar
        activeTab="fixtures"
        canControlPageOverlay={false}
        pageOverlayPending={false}
        pageOverlayVisible={false}
        onChangeTab={vi.fn()}
        onTogglePageOverlay={onTogglePageOverlay}
      />
    );

    expect(
      (screen.getByRole("checkbox", { name: "Toggle page overlay" }) as HTMLInputElement).disabled
    ).toBe(true);
  });

  it("renders leagues and selects a league", async () => {
    const user = userEvent.setup();
    const onSelectLeague = vi.fn();

    render(
      <LeaguePicker
        leagues={[
          { name: "Premier League", uid: "league-1" },
          { name: "World Cup", uid: "league-2" }
        ]}
        selectedLeagueUid="league-1"
        onSelectLeague={onSelectLeague}
      />
    );

    const selectedLeague = screen.getByRole("button", { name: "Premier League" });
    expect(selectedLeague.getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: "World Cup" }));

    expect(onSelectLeague).toHaveBeenCalledWith("league-2");
  });

  it("renders fixtures and forwards fixture selection", async () => {
    const user = userEvent.setup();
    const onSelectFixture = vi.fn();

    render(
      <FixtureList
        fixtures={fixtures}
        loadingText={null}
        selectedFixtureUid="fixture-1"
        selectedLeagueUid="league-1"
        onSelectFixture={onSelectFixture}
      />
    );

    expect(screen.getByText("Bournemouth")).toBeTruthy();
    expect(screen.getByText("Manchester City")).toBeTruthy();
    expect(screen.getByText("1:1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Selected fixture" })).toBeTruthy();

    const selectFixtureButton = screen.getAllByRole("button", { name: "Select fixture" })[0];
    if (!selectFixtureButton) {
      throw new Error("Expected an unselected fixture button");
    }

    await user.click(selectFixtureButton);
    await user.click(screen.getByRole("button", { name: "Selected fixture" }));

    expect(onSelectFixture).toHaveBeenNthCalledWith(1, "fixture-2");
    expect(onSelectFixture).toHaveBeenNthCalledWith(2, "fixture-1");
  });

  it("renders fixture list loading and unselected states", () => {
    const { rerender } = render(
      <FixtureList
        fixtures={[]}
        loadingText="Loading fixtures"
        selectedLeagueUid="league-1"
        onSelectFixture={vi.fn()}
      />
    );

    expect(screen.getByText("Loading fixtures")).toBeTruthy();

    rerender(
      <FixtureList
        fixtures={fixtures}
        loadingText={null}
        selectedFixtureUid="fixture-outside-current-list"
        selectedLeagueUid="league-1"
        onSelectFixture={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Selected fixture" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Select fixture" })).toHaveLength(2);
  });

  it("updates overlay position and renders contact links", async () => {
    const user = userEvent.setup();
    const onChangeSettings = vi.fn();

    render(
      <OverlaySettingsSection
        extensionEnabled
        overlayPosition="bottom-right"
        onChangeSettings={onChangeSettings}
      />
    );

    await user.selectOptions(screen.getByRole("combobox"), "top-left");

    expect(onChangeSettings).toHaveBeenCalledWith({ overlayPosition: "top-left" });
    expect(screen.getByRole("link", { name: "GitHub" }).getAttribute("href")).toBe(
      "https://github.com/PhysicksKim"
    );
    expect(screen.getByRole("link", { name: "physickskim@gmail.com" }).getAttribute("href")).toBe(
      "mailto:physickskim@gmail.com"
    );
  });

  it("navigates fixture dates and opens selected-date actions", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onReturnToSelectedFixtureDate = vi.fn();

    render(
      <FixtureDateNavigator
        disabled={false}
        fixtureDate="2026-05-20"
        selectedFixtureDate="2026-05-18"
        onNavigate={onNavigate}
        onReturnToSelectedFixtureDate={onReturnToSelectedFixtureDate}
        onSelectDate={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Previous fixture date" }));
    await user.click(screen.getByRole("button", { name: "Next fixture date" }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, "previous");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "next");

    await user.click(screen.getByRole("button", { name: /05\.20/ }));
    await user.click(screen.getByRole("button", { name: "Return to selected fixture date" }));

    expect(onReturnToSelectedFixtureDate).toHaveBeenCalledTimes(1);
  });

  it("disables fixture date controls while loading", () => {
    render(
      <FixtureDateNavigator
        disabled
        fixtureDate="2026-05-20"
        selectedFixtureDate="2026-05-18"
        onNavigate={vi.fn()}
        onReturnToSelectedFixtureDate={vi.fn()}
        onSelectDate={vi.fn()}
      />
    );

    expect(
      (screen.getByRole("button", { name: "Previous fixture date" }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect((screen.getByRole("button", { name: /05\.20/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Next fixture date" }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(screen.queryByRole("dialog", { name: "Fixture date picker" })).toBeNull();
  });
});
