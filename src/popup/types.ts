import type { ExtensionSettings } from "@/shared/overlay/types";

export type FixtureDateDirection = "previous" | "next";
export type FixtureQueryPatch = Partial<Pick<ExtensionSettings, "fixtureDate" | "fixtureLookupMode">>;
export type PopupTab = "fixtures" | "settings";
