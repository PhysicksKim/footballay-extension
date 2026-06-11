// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { MatchStatsPanel } from "./MatchStatsPanel";

const matchData: LiveMatchOverlayData = {
  awayScore: 0,
  awayStats: {
    cornerKicks: 2,
    expectedGoals: "0.8",
    fouls: 12,
    goalkeeperSaves: 4,
    offsides: 1,
    passesAccuracyPercentage: 79,
    possession: "44%",
    shotsInsideBox: 4,
    shotsOnGoal: 3,
    shotsTotal: 9,
    yellowCards: 2
  },
  awayTeamName: "Away",
  fixtureUid: "fixture-1",
  homeScore: 2,
  homeStats: {
    cornerKicks: 6,
    expectedGoals: "1.7",
    fouls: 8,
    goalkeeperSaves: 1,
    offsides: 3,
    passesAccuracyPercentage: 86,
    possession: "56%",
    redCards: 1,
    shotsInsideBox: 8,
    shotsOnGoal: 6,
    shotsTotal: 14,
    yellowCards: 1
  },
  homeTeamName: "Home",
  updatedAt: "2026-06-05T00:00:00.000Z"
};

afterEach(() => {
  cleanup();
});

describe("MatchStatsPanel", () => {
  it("renders expanded team stats from live match data", () => {
    render(<MatchStatsPanel data={matchData} />);

    expect(screen.getByText("xG")).toBeTruthy();
    expect(screen.getByText("1.7 - 0.8")).toBeTruthy();
    expect(screen.getByText("Corners")).toBeTruthy();
    expect(screen.getByText("6 - 2")).toBeTruthy();
    expect(screen.getByText("Pass %")).toBeTruthy();
    expect(screen.getByText("86% - 79%")).toBeTruthy();
    expect(screen.getByText("Cards")).toBeTruthy();
    expect(screen.getByText("1Y 1R - 2")).toBeTruthy();
  });

  it("renders an empty state when no stats are available", () => {
    render(<MatchStatsPanel data={null} />);

    expect(screen.getByText("No stats")).toBeTruthy();
  });
});
