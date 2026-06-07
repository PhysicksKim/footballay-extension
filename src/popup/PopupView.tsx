import type { AvailableLeague, FixtureSummary } from "@/domain/live-match/types";
import type { PageOverlayState, RuntimeSettingsPatch } from "@/shared/messages";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { FixtureDateNavigator } from "./components/FixtureDateNavigator";
import { FixtureList } from "./components/FixtureList";
import { LeaguePicker } from "./components/LeaguePicker";
import { OverlaySettingsSection } from "./components/OverlaySettingsSection";
import { PopupTabBar } from "./components/PopupTabBar";
import type { PopupTab } from "./store";

type PopupViewProps = {
  activeTab: PopupTab;
  error: string | null;
  fixtureQueryLoading: boolean;
  fixtures: FixtureSummary[];
  leagues: AvailableLeague[];
  loadingText: string | null;
  pageOverlayState: PageOverlayState | null;
  pageOverlayStateLoading: boolean;
  settings: ExtensionSettings;
  onChangeTab: (activeTab: PopupTab) => void;
  onHideOverlayOnCurrentPage: () => void;
  onNavigateFixtureDate: (direction: "previous" | "next") => void;
  onReturnToSelectedFixtureDate: () => void;
  onSelectFixture: (fixtureUid: string) => void;
  onSelectFixtureDate: (fixtureDate?: string) => void;
  onSelectLeague: (leagueUid: string) => void;
  onShowOverlayOnCurrentPage: () => void;
  onUpdateSettings: (patch: RuntimeSettingsPatch) => void;
};

export function PopupView({
  activeTab,
  error,
  fixtureQueryLoading,
  fixtures,
  leagues,
  loadingText,
  pageOverlayState,
  pageOverlayStateLoading,
  settings,
  onChangeTab,
  onHideOverlayOnCurrentPage,
  onNavigateFixtureDate,
  onReturnToSelectedFixtureDate,
  onSelectFixture,
  onSelectFixtureDate,
  onSelectLeague,
  onShowOverlayOnCurrentPage,
  onUpdateSettings
}: PopupViewProps) {
  return (
    <main className="footballay-popup">
      <PopupTabBar
        activeTab={activeTab}
        canControlPageOverlay={pageOverlayState?.url.startsWith("http") ?? false}
        pageOverlayPending={pageOverlayStateLoading}
        pageOverlayVisible={pageOverlayState?.visible ?? false}
        onChangeTab={onChangeTab}
        onTogglePageOverlay={(visible) =>
          visible ? onShowOverlayOnCurrentPage() : onHideOverlayOnCurrentPage()
        }
      />

      {activeTab === "fixtures" ? (
        <section className="footballay-picker">
          <LeaguePicker
            leagues={leagues}
            selectedLeagueUid={settings.selectedLeagueUid}
            onSelectLeague={onSelectLeague}
          />

          <FixtureDateNavigator
            disabled={fixtureQueryLoading}
            fixtureDate={settings.fixtureDate}
            selectedFixtureDate={settings.selectedFixtureDate}
            onNavigate={onNavigateFixtureDate}
            onReturnToSelectedFixtureDate={onReturnToSelectedFixtureDate}
            onSelectDate={onSelectFixtureDate}
          />

          <FixtureList
            fixtures={fixtures}
            loadingText={loadingText}
            selectedFixtureUid={settings.selectedFixtureUid}
            selectedLeagueUid={settings.selectedLeagueUid}
            onSelectFixture={onSelectFixture}
          />
        </section>
      ) : (
        <OverlaySettingsSection
          overlayPosition={settings.overlayPosition}
          onChangeSettings={onUpdateSettings}
        />
      )}

      {error ? <p className="footballay-popup-error">{error}</p> : null}
    </main>
  );
}
