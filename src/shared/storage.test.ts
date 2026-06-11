import { beforeEach, describe, expect, it, vi } from "vitest";
import { storage } from "wxt/utils/storage";
import { defaultSettings, overlayTickerStatCatalog } from "@/shared/constants";
import {
  readSettings,
  readSiteOverlayDrawerSide,
  readSiteOverlayVisible,
  writeSiteOverlayDrawerSide,
  writeSiteOverlayVisible
} from "./storage";

const { storageItems } = vi.hoisted(() => ({
  storageItems: new Map<string, unknown>()
}));

vi.mock("wxt/utils/storage", () => ({
  storage: {
    getItem: vi.fn(async (key: string) => storageItems.get(key)),
    setItem: vi.fn(async (key: string, value: unknown) => {
      storageItems.set(key, value);
    })
  }
}));

describe("site overlay storage", () => {
  beforeEach(() => {
    storageItems.clear();
    vi.mocked(storage.setItem).mockClear();
  });

  it("stores manual overlay visibility by hostname", async () => {
    await expect(readSiteOverlayVisible("https://example.com/watch")).resolves.toBe(false);

    await expect(writeSiteOverlayVisible("https://example.com/watch", true)).resolves.toBe(true);

    await expect(readSiteOverlayVisible("https://example.com/other")).resolves.toBe(true);
    await expect(readSiteOverlayVisible("https://other.example/watch")).resolves.toBe(false);
  });

  it("stores hidden host visibility override", async () => {
    await writeSiteOverlayVisible("https://example.com/watch", true);
    await expect(writeSiteOverlayVisible("https://example.com/watch", false)).resolves.toBe(false);

    await expect(readSiteOverlayVisible("https://example.com/watch")).resolves.toBe(false);
  });

  it("shows supported streaming hosts by default", async () => {
    await expect(readSiteOverlayVisible("https://www.coupangplay.com/live")).resolves.toBe(true);
  });

  it("ignores invalid urls", async () => {
    await expect(writeSiteOverlayVisible("not-a-url", true)).resolves.toBe(false);
    await expect(readSiteOverlayVisible("not-a-url")).resolves.toBe(false);
  });

  it("stores drawer side by hostname", async () => {
    await expect(readSiteOverlayDrawerSide("https://example.com/watch")).resolves.toBeUndefined();

    await expect(writeSiteOverlayDrawerSide("https://example.com/watch", "right")).resolves.toBe("right");

    await expect(readSiteOverlayDrawerSide("https://example.com/other")).resolves.toBe("right");
    await expect(readSiteOverlayDrawerSide("https://other.example/watch")).resolves.toBeUndefined();
  });

  it("removes stored drawer side", async () => {
    await writeSiteOverlayDrawerSide("https://example.com/watch", "left");
    await expect(writeSiteOverlayDrawerSide("https://example.com/watch", undefined)).resolves.toBeUndefined();

    await expect(readSiteOverlayDrawerSide("https://example.com/watch")).resolves.toBeUndefined();
  });

  it("persists normalized settings after ticker stat catalog migration", async () => {
    storageItems.set("local:footballay-settings", {
      overlayTickerStatsMode: "custom",
      overlayTickerKnownStatKeys: ["possession", "shotsOnGoal", "cards"],
      overlayTickerCustomStatKeys: ["possession"]
    });

    const settings = await readSettings();

    expect(settings.overlayTickerCustomStatKeys).toEqual([
      "expectedGoals",
      "cornerKicks",
      "passesAccuracy",
      "possession"
    ]);
    expect(settings.overlayTickerKnownStatKeys).toContain("goalkeeperSaves");
    expect(storageItems.get("local:footballay-settings")).toEqual(settings);
  });

  it("does not rewrite settings that are already normalized", async () => {
    storageItems.set("local:footballay-settings", defaultSettings);

    await expect(readSettings()).resolves.toEqual(defaultSettings);

    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("persists recovered defaults when stored ticker settings are invalid", async () => {
    storageItems.set("local:footballay-settings", {
      overlayTickerStatsMode: "custom",
      overlayTickerKnownStatKeys: ["bad", "possession", "possession"],
      overlayTickerCustomStatKeys: ["bad", "cards", "cards"],
      overlayTickerIntervalMs: Number.POSITIVE_INFINITY,
      overlayTickerScale: -1
    });

    const settings = await readSettings();

    expect(settings.overlayTickerCustomStatKeys).toEqual([
      "expectedGoals",
      "shotsOnGoal",
      "cornerKicks",
      "passesAccuracy",
      "cards"
    ]);
    expect(settings.overlayTickerKnownStatKeys).toEqual(overlayTickerStatCatalog);
    expect(settings.overlayTickerIntervalMs).toBe(defaultSettings.overlayTickerIntervalMs);
    expect(settings.overlayTickerScale).toBe(0.75);
    expect(storageItems.get("local:footballay-settings")).toEqual(settings);
  });
});
