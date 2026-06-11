import { defaultOverlayTickerStatKeys, defaultSettings } from "@/shared/constants";
import { overlayPositions } from "@/shared/overlay/position";
import type {
  ExtensionSettings,
  OverlayLanguage,
  OverlayTickerStatKey
} from "@/shared/overlay/types";

const fixtureLookupModes: ExtensionSettings["fixtureLookupMode"][] = ["previous", "exact", "nearest"];
const overlayLanguages: OverlayLanguage[] = ["auto", "ko", "en"];
const overlayTickerStatKeys: OverlayTickerStatKey[] = [
  "expectedGoals",
  "possession",
  "shotsOnGoal",
  "shotsTotal",
  "shotsInsideBox",
  "cornerKicks",
  "passesAccuracy",
  "fouls",
  "offsides",
  "goalkeeperSaves",
  "cards"
];
const previousDefaultOverlayTickerStatKeys: OverlayTickerStatKey[] = [
  "possession",
  "shotsOnGoal",
  "shotsTotal",
  "cards"
];

export function normalizeExtensionSettings(
  rawSettings: Partial<ExtensionSettings> | null | undefined
): ExtensionSettings {
  const raw = rawSettings ?? {};
  const nextSettings: ExtensionSettings = {
    extensionEnabled: getBoolean(raw.extensionEnabled, defaultSettings.extensionEnabled),
    fixtureLookupMode: fixtureLookupModes.includes(raw.fixtureLookupMode as ExtensionSettings["fixtureLookupMode"])
      ? (raw.fixtureLookupMode as ExtensionSettings["fixtureLookupMode"])
      : defaultSettings.fixtureLookupMode,
    overlayCollapsed: getBoolean(raw.overlayCollapsed, defaultSettings.overlayCollapsed),
    overlayLanguage: overlayLanguages.includes(raw.overlayLanguage as OverlayLanguage)
      ? (raw.overlayLanguage as OverlayLanguage)
      : defaultSettings.overlayLanguage,
    overlayPosition: overlayPositions.includes(raw.overlayPosition as ExtensionSettings["overlayPosition"])
      ? (raw.overlayPosition as ExtensionSettings["overlayPosition"])
      : defaultSettings.overlayPosition,
    overlayTickerIntervalMs: clampNumber(
      raw.overlayTickerIntervalMs,
      defaultSettings.overlayTickerIntervalMs,
      1000,
      60000
    ),
    overlayTickerScale: clampNumber(raw.overlayTickerScale, defaultSettings.overlayTickerScale, 0.75, 2.5),
    overlayTickerStatKeys: normalizeOverlayTickerStatKeys(raw.overlayTickerStatKeys),
    pollingIntervalMs: clampNumber(raw.pollingIntervalMs, defaultSettings.pollingIntervalMs, 5000, 300000)
  };

  assignOptionalString(nextSettings, "fixtureDate", raw.fixtureDate);
  assignOptionalString(nextSettings, "selectedFixtureDate", raw.selectedFixtureDate);
  assignOptionalString(nextSettings, "selectedFixtureUid", raw.selectedFixtureUid);
  assignOptionalString(nextSettings, "selectedLeagueUid", raw.selectedLeagueUid);

  return nextSettings;
}

export function normalizeSettingsPatch(
  patch: Record<string, unknown>
): Partial<ExtensionSettings> {
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [key, value === null ? undefined : value])
  ) as Partial<ExtensionSettings>;
}

function getBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function assignOptionalString(
  settings: ExtensionSettings,
  key: "fixtureDate" | "selectedFixtureDate" | "selectedFixtureUid" | "selectedLeagueUid",
  value: unknown
): void {
  const normalizedValue = getOptionalString(value);

  if (normalizedValue !== undefined) {
    settings[key] = normalizedValue;
  }
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}

function normalizeOverlayTickerStatKeys(value: unknown): OverlayTickerStatKey[] {
  if (!Array.isArray(value)) {
    return [...defaultOverlayTickerStatKeys];
  }

  const validKeys = value.filter((key): key is OverlayTickerStatKey =>
    overlayTickerStatKeys.includes(key as OverlayTickerStatKey)
  );
  const uniqueKeys = [...new Set(validKeys)];

  if (matchesTickerStatKeys(uniqueKeys, previousDefaultOverlayTickerStatKeys)) {
    return [...defaultOverlayTickerStatKeys];
  }

  return uniqueKeys.length ? uniqueKeys : [...defaultOverlayTickerStatKeys];
}

function matchesTickerStatKeys(left: OverlayTickerStatKey[], right: OverlayTickerStatKey[]): boolean {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}
