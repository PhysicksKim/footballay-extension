import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosGet = vi.hoisted(() => vi.fn());
const axiosCreate = vi.hoisted(() =>
  vi.fn(() => ({
    get: axiosGet
  }))
);

vi.mock("axios", () => ({
  default: {
    create: axiosCreate
  }
}));

import {
  fetchAvailableLeagues,
  fetchFixtureStatusWithEtag
} from "./api";

describe("Footballay API client", () => {
  beforeEach(() => {
    axiosCreate.mockClear();
    axiosGet.mockReset();
  });

  it("maps available leagues from axios responses", async () => {
    axiosGet.mockResolvedValueOnce({
      data: [{ uid: "league-1", name: "Premier League", nameKo: "프리미어리그" }]
    });

    await expect(fetchAvailableLeagues()).resolves.toEqual([
      {
        uid: "league-1",
        name: "Premier League",
        nameKo: "프리미어리그"
      }
    ]);
    expect(axiosGet).toHaveBeenCalledWith("/v1/football/leagues/available");
  });

  it("returns updated ETag responses with data", async () => {
    axiosGet.mockResolvedValueOnce({
      data: { fixtureUid: "fixture-1", liveStatus: { score: {}, shortStatus: "NS", longStatus: "Not Started" } },
      headers: { etag: "etag-1" },
      status: 200
    });

    await expect(fetchFixtureStatusWithEtag("fixture-1")).resolves.toEqual({
      type: "updated",
      data: {
        fixtureUid: "fixture-1",
        liveStatus: {
          longStatus: "Not Started",
          score: {},
          shortStatus: "NS"
        }
      },
      etag: "etag-1"
    });
  });

  it("sends If-None-Match and returns not-modified ETag responses", async () => {
    axiosGet.mockResolvedValueOnce({
      data: undefined,
      headers: {
        get: vi.fn((name: string) => (name === "etag" ? "etag-2" : undefined))
      },
      status: 304
    });

    await expect(fetchFixtureStatusWithEtag("fixture-1", "etag-1")).resolves.toEqual({
      type: "not-modified",
      etag: "etag-2"
    });
    expect(axiosGet).toHaveBeenCalledWith(
      "/v1/football/fixtures/fixture-1/status",
      expect.objectContaining({
        headers: { "If-None-Match": "etag-1" },
        validateStatus: expect.any(Function)
      })
    );
  });
});
