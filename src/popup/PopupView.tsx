import type { AvailableLeague, FixtureSummary } from "@/domain/live-match/types";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { FixtureDateNavigator } from "./components/FixtureDateNavigator";
import { FixtureList } from "./components/FixtureList";
import { LeaguePicker } from "./components/LeaguePicker";
import { OverlaySettingsSection } from "./components/OverlaySettingsSection";
import { PopupTabBar } from "./components/PopupTabBar";
import type { FixtureDateDirection, PopupTab } from "./types";

export type PopupShellViewModel = {
  activeTab: PopupTab;
  error: string | null;
  onChangeTab: (activeTab: PopupTab) => void;
};

export type LeaguePickerViewModel = {
  leagues: AvailableLeague[];
  selectedLeagueUid?: string;
  onSelectLeague: (leagueUid: string) => void;
};

export type FixtureScheduleViewModel = {
  disabled: boolean;
  fixtureDate?: string;
  selectedFixtureDate?: string;
  onNavigate: (direction: FixtureDateDirection) => void;
  onReturnToSelectedFixtureDate: () => void;
  onSelectDate: (fixtureDate?: string) => void;
};

export type FixtureSelectionViewModel = {
  fixtures: FixtureSummary[];
  loadingText: string | null;
  selectedFixtureUid?: string;
  selectedLeagueUid?: string;
  onSelectFixture: (fixtureUid: string) => void;
};

export type PageOverlayViewModel = {
  canControl: boolean;
  pending: boolean;
  visible: boolean;
  onToggle: (visible: boolean) => void;
};

export type OverlaySettingsViewModel = {
  overlayPosition: ExtensionSettings["overlayPosition"];
  onChangeSettings: (patch: Partial<ExtensionSettings>) => void;
};

type PopupViewProps = {
  fixtureSchedule: FixtureScheduleViewModel;
  fixtureSelection: FixtureSelectionViewModel;
  leaguePicker: LeaguePickerViewModel;
  overlaySettings: OverlaySettingsViewModel;
  pageOverlay: PageOverlayViewModel;
  shell: PopupShellViewModel;
};

export function PopupView({
  fixtureSchedule,
  fixtureSelection,
  leaguePicker,
  overlaySettings,
  pageOverlay,
  shell
}: PopupViewProps) {
  return (
    <main className="footballay-popup">
      <PopupTabBar
        activeTab={shell.activeTab}
        canControlPageOverlay={pageOverlay.canControl}
        pageOverlayPending={pageOverlay.pending}
        pageOverlayVisible={pageOverlay.visible}
        onChangeTab={shell.onChangeTab}
        onTogglePageOverlay={pageOverlay.onToggle}
      />

      {shell.activeTab === "fixtures" ? (
        <section className="footballay-picker">
          <LeaguePicker
            leagues={leaguePicker.leagues}
            selectedLeagueUid={leaguePicker.selectedLeagueUid}
            onSelectLeague={leaguePicker.onSelectLeague}
          />

          <FixtureDateNavigator
            disabled={fixtureSchedule.disabled}
            fixtureDate={fixtureSchedule.fixtureDate}
            selectedFixtureDate={fixtureSchedule.selectedFixtureDate}
            onNavigate={fixtureSchedule.onNavigate}
            onReturnToSelectedFixtureDate={fixtureSchedule.onReturnToSelectedFixtureDate}
            onSelectDate={fixtureSchedule.onSelectDate}
          />

          <FixtureList
            fixtures={fixtureSelection.fixtures}
            loadingText={fixtureSelection.loadingText}
            selectedFixtureUid={fixtureSelection.selectedFixtureUid}
            selectedLeagueUid={fixtureSelection.selectedLeagueUid}
            onSelectFixture={fixtureSelection.onSelectFixture}
          />
        </section>
      ) : (
        <OverlaySettingsSection
          overlayPosition={overlaySettings.overlayPosition}
          onChangeSettings={overlaySettings.onChangeSettings}
        />
      )}

      {shell.error ? <p className="footballay-popup-error">{shell.error}</p> : null}
    </main>
  );
}
