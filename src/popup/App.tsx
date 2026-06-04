import { useEffect } from "react";
import { CurrentMatchCard } from "./components/CurrentMatchCard";
import { CurrentPageCard } from "./components/CurrentPageCard";
import { FixtureDateNavigator } from "./components/FixtureDateNavigator";
import { FixtureList } from "./components/FixtureList";
import { LeaguePicker } from "./components/LeaguePicker";
import { OverlaySettingsSection } from "./components/OverlaySettingsSection";
import { PopupHeader } from "./components/PopupHeader";
import { usePopupStore } from "./store";
import type { RuntimeMessage } from "@/shared/messages";

export function App() {
  const {
    data,
    error,
    fixtureQueryLoading,
    fixtures,
    handleRuntimeMessage,
    hideOverlayOnCurrentPage,
    leagues,
    loadingText,
    loadState,
    navigateFixtureDate,
    pageOverlayState,
    selectFixture,
    selectLeague,
    settings,
    showOverlayOnCurrentPage,
    updateFixtureQuery,
    updateSettings
  } = usePopupStore();

  useEffect(() => {
    void loadState();

    const listener = (message: RuntimeMessage) => {
      handleRuntimeMessage(message);
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [handleRuntimeMessage, loadState]);

  return (
    <main className="footballay-popup">
      <PopupHeader
        overlayEnabled={settings.overlayEnabled}
        onToggleOverlay={(overlayEnabled) => void updateSettings({ overlayEnabled })}
      />

      <CurrentPageCard
        pageOverlayState={pageOverlayState}
        onHideOverlay={() => void hideOverlayOnCurrentPage()}
        onShowOverlay={() => void showOverlayOnCurrentPage()}
      />

      <section className="footballay-picker">
        <LeaguePicker
          leagues={leagues}
          selectedLeagueUid={settings.selectedLeagueUid}
          onSelectLeague={(leagueUid) => void selectLeague(leagueUid)}
        />

        <FixtureDateNavigator
          disabled={fixtureQueryLoading}
          fixtureDate={settings.fixtureDate}
          onNavigate={(direction) => void navigateFixtureDate(direction)}
          onSelectDate={(fixtureDate) =>
            void updateFixtureQuery({
              fixtureDate,
              fixtureLookupMode: "exact"
            })
          }
        />

        <FixtureList
          fixtures={fixtures}
          loadingText={loadingText}
          selectedFixtureUid={settings.selectedFixtureUid}
          selectedLeagueUid={settings.selectedLeagueUid}
          onSelectFixture={(fixtureUid) => void selectFixture(fixtureUid)}
        />
      </section>

      <OverlaySettingsSection
        overlayCollapsed={settings.overlayCollapsed}
        overlayPosition={settings.overlayPosition}
        onChangeSettings={(patch) => void updateSettings(patch)}
      />

      <CurrentMatchCard
        data={data}
        fixtures={fixtures}
        selectedFixtureUid={settings.selectedFixtureUid}
      />

      {error ? <p className="footballay-popup-error">{error}</p> : null}
    </main>
  );
}
