import { storage } from "wxt/utils/storage";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { normalizeExtensionSettings } from "@/shared/overlay/settings";
import { getHostname } from "@/shared/url";

const SETTINGS_KEY = "local:footballay-settings";
const SITE_OVERLAY_DRAWERS_KEY = "local:footballay-site-overlay-drawers";
const SITE_OVERLAYS_KEY = "local:footballay-site-overlays";

export type SiteOverlayDrawerSide = "left" | "right";

type SiteOverlayDrawerMap = Record<string, SiteOverlayDrawerSide>;
type SiteOverlayVisibilityMap = Record<string, true>;

export async function readSettings(): Promise<ExtensionSettings> {
  const storedSettings = await storage.getItem<Partial<ExtensionSettings>>(SETTINGS_KEY);
  return normalizeExtensionSettings(storedSettings);
}

export async function writeSettings(
  patch: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const nextSettings = normalizeExtensionSettings({
    ...(await readSettings()),
    ...patch
  });

  await storage.setItem(SETTINGS_KEY, nextSettings);
  return nextSettings;
}

export async function readSiteOverlayVisible(url: string): Promise<boolean> {
  const hostname = getHostname(url);
  if (!hostname) {
    return false;
  }

  const siteOverlays = await readSiteOverlayVisibilityMap();
  return siteOverlays[hostname] === true;
}

export async function writeSiteOverlayVisible(url: string, visible: boolean): Promise<boolean> {
  const hostname = getHostname(url);
  if (!hostname) {
    return false;
  }

  const siteOverlays = await readSiteOverlayVisibilityMap();
  if (visible) {
    siteOverlays[hostname] = true;
  } else {
    delete siteOverlays[hostname];
  }

  await storage.setItem(SITE_OVERLAYS_KEY, siteOverlays);
  return siteOverlays[hostname] === true;
}

export async function readSiteOverlayDrawerSide(url: string): Promise<SiteOverlayDrawerSide | undefined> {
  const hostname = getHostname(url);
  if (!hostname) {
    return undefined;
  }

  const siteDrawers = await readSiteOverlayDrawerMap();
  return siteDrawers[hostname];
}

export async function writeSiteOverlayDrawerSide(
  url: string,
  drawerSide?: SiteOverlayDrawerSide
): Promise<SiteOverlayDrawerSide | undefined> {
  const hostname = getHostname(url);
  if (!hostname) {
    return undefined;
  }

  const siteDrawers = await readSiteOverlayDrawerMap();
  if (drawerSide) {
    siteDrawers[hostname] = drawerSide;
  } else {
    delete siteDrawers[hostname];
  }

  await storage.setItem(SITE_OVERLAY_DRAWERS_KEY, siteDrawers);
  return siteDrawers[hostname];
}

async function readSiteOverlayVisibilityMap(): Promise<SiteOverlayVisibilityMap> {
  const storedSiteOverlays = await storage.getItem<Record<string, unknown>>(SITE_OVERLAYS_KEY);
  if (!storedSiteOverlays || typeof storedSiteOverlays !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(storedSiteOverlays).filter((entry): entry is [string, true] => entry[1] === true)
  );
}

async function readSiteOverlayDrawerMap(): Promise<SiteOverlayDrawerMap> {
  const storedSiteDrawers = await storage.getItem<Record<string, unknown>>(SITE_OVERLAY_DRAWERS_KEY);
  if (!storedSiteDrawers || typeof storedSiteDrawers !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(storedSiteDrawers).filter((entry): entry is [string, SiteOverlayDrawerSide] =>
      entry[1] === "left" || entry[1] === "right"
    )
  );
}
