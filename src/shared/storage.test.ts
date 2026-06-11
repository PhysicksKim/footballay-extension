import { beforeEach, describe, expect, it, vi } from "vitest";
import {
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
  });

  it("stores manual overlay visibility by hostname", async () => {
    await expect(readSiteOverlayVisible("https://example.com/watch")).resolves.toBe(false);

    await expect(writeSiteOverlayVisible("https://example.com/watch", true)).resolves.toBe(true);

    await expect(readSiteOverlayVisible("https://example.com/other")).resolves.toBe(true);
    await expect(readSiteOverlayVisible("https://other.example/watch")).resolves.toBe(false);
  });

  it("removes host visibility when hidden", async () => {
    await writeSiteOverlayVisible("https://example.com/watch", true);
    await expect(writeSiteOverlayVisible("https://example.com/watch", false)).resolves.toBe(false);

    await expect(readSiteOverlayVisible("https://example.com/watch")).resolves.toBe(false);
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
});
