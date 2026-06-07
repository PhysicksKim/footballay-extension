// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { FixtureSummary } from "@/domain/live-match/types";
import { FixtureDateNavigator } from "./FixtureDateNavigator";
import { FixtureList } from "./FixtureList";
import { LeaguePicker } from "./LeaguePicker";
import { OverlaySettingsSection } from "./OverlaySettingsSection";

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

describe("popup components", () => {
  it("renders leagues and selects a league", async () => {
    const user = userEvent.setup();
    const onSelectLeague = vi.fn();

    render(
      <LeaguePicker
        leagues={[
          { name: "Premier League", nameKo: "프리미어리그", uid: "league-1" },
          { name: "World Cup", uid: "league-2" }
        ]}
        selectedLeagueUid="league-1"
        onSelectLeague={onSelectLeague}
      />
    );

    const selectedLeague = screen.getByRole("button", { name: "프리미어리그" });
    expect(selectedLeague.getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: "World Cup" }));

    expect(onSelectLeague).toHaveBeenCalledWith("league-2");
  });

  it("renders fixtures and selects a fixture", async () => {
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

    const unselectedFixtureButton = screen.getAllByRole("button", { name: "Select fixture" })[0];
    if (!unselectedFixtureButton) {
      throw new Error("Expected an unselected fixture button");
    }

    await user.click(unselectedFixtureButton);

    expect(onSelectFixture).toHaveBeenCalledWith("fixture-2");
  });

  it("renders fixture list empty states", () => {
    const onSelectFixture = vi.fn();
    const { rerender } = render(
      <FixtureList
        fixtures={[]}
        loadingText={null}
        selectedLeagueUid={undefined}
        onSelectFixture={onSelectFixture}
      />
    );

    expect(screen.getByText("리그를 선택하세요")).toBeTruthy();

    rerender(
      <FixtureList
        fixtures={[]}
        loadingText={null}
        selectedLeagueUid="league-1"
        onSelectFixture={onSelectFixture}
      />
    );

    expect(screen.getByText("경기가 없습니다")).toBeTruthy();
  });

  it("updates overlay position from settings section", async () => {
    const user = userEvent.setup();
    const onChangeSettings = vi.fn();

    render(
      <OverlaySettingsSection
        overlayPosition="bottom-right"
        onChangeSettings={onChangeSettings}
      />
    );

    const positionSelect = screen.getByRole("combobox", { name: "표시 위치" }) as HTMLSelectElement;
    expect(positionSelect.value).toBe("bottom-right");
    expect(screen.getByText("오른쪽 하단")).toBeTruthy();
    expect(screen.getByText("physickskim@gmail.com")).toBeTruthy();

    await user.selectOptions(positionSelect, "top-left");

    expect(onChangeSettings).toHaveBeenCalledWith({ overlayPosition: "top-left" });
  });

  it("navigates fixture dates and opens selected-date actions", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onReturnToSelectedFixtureDate = vi.fn();
    const onSelectDate = vi.fn();

    render(
      <FixtureDateNavigator
        disabled={false}
        fixtureDate="2026-05-20"
        selectedFixtureDate="2026-05-18"
        onNavigate={onNavigate}
        onReturnToSelectedFixtureDate={onReturnToSelectedFixtureDate}
        onSelectDate={onSelectDate}
      />
    );

    await user.click(screen.getByRole("button", { name: "Previous fixture date" }));
    await user.click(screen.getByRole("button", { name: "Next fixture date" }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, "previous");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "next");

    await user.click(screen.getByRole("button", { name: /05\.20/ }));

    expect(screen.getByRole("dialog", { name: "Fixture date picker" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Return to selected fixture date" }));

    expect(onReturnToSelectedFixtureDate).toHaveBeenCalledTimes(1);
    expect(onSelectDate).not.toHaveBeenCalled();
  });
});
