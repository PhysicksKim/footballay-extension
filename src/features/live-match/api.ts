import { mapApiLiveMatchToOverlayData } from "./mapper";
import type { LiveMatchOverlayData } from "./types";

const MOCK_FIXTURE_ID = 1001;

export async function fetchLiveMatchOverlayData(
  fixtureId = MOCK_FIXTURE_ID
): Promise<LiveMatchOverlayData> {
  const apiBaseUrl = import.meta.env.VITE_FOOTBALLAY_API_BASE_URL?.trim();

  if (!apiBaseUrl) {
    return getMockLiveMatchData(fixtureId);
  }

  const endpoint = new URL(`/fixtures/${fixtureId}/overlay`, apiBaseUrl);
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Footballay API request failed: ${response.status}`);
  }

  return mapApiLiveMatchToOverlayData(await response.json(), fixtureId);
}

function getMockLiveMatchData(fixtureId: number): LiveMatchOverlayData {
  const elapsed = 64 + (Math.floor(Date.now() / 30000) % 8);

  return {
    fixtureId,
    homeTeamName: "TOT",
    awayTeamName: "CHE",
    homeScore: 2,
    awayScore: 1,
    elapsed,
    statusShort: "LIVE",
    homeStats: {
      shotsTotal: 11,
      shotsOnGoal: 5,
      possession: "54%",
      yellowCards: 1,
      redCards: 0
    },
    awayStats: {
      shotsTotal: 8,
      shotsOnGoal: 3,
      possession: "46%",
      yellowCards: 2,
      redCards: 0
    },
    topPlayers: [
      { name: "Son", teamName: "TOT", rating: 8.1, goals: 1, shots: 3 },
      { name: "Palmer", teamName: "CHE", rating: 7.5, assists: 1 },
      { name: "Maddison", teamName: "TOT", rating: 7.3, passes: "43/48" }
    ],
    updatedAt: new Date().toISOString()
  };
}
