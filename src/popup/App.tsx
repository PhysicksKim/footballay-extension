import { useEffect } from "react";
import { FixtureDateNavigator } from "./components/FixtureDateNavigator";
import { FixtureList } from "./components/FixtureList";
import { LeaguePicker } from "./components/LeaguePicker";
import { OverlaySettingsSection } from "./components/OverlaySettingsSection";
import { PopupTabBar } from "./components/PopupTabBar";
import { usePopupStore } from "./store";
import type { RuntimeMessage } from "@/shared/messages";

export function App() {
  const {
    activeTab,
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
    pageOverlayStateLoading,
    returnToSelectedFixtureDate,
    selectFixture,
    selectLeague,
    setActiveTab,
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
      <PopupTabBar
        activeTab={activeTab}
        canControlPageOverlay={pageOverlayState?.url.startsWith("http") ?? false}
        pageOverlayPending={pageOverlayStateLoading}
        pageOverlayVisible={pageOverlayState?.visible ?? false}
        onChangeTab={setActiveTab}
        onTogglePageOverlay={(visible) =>
          void (visible ? showOverlayOnCurrentPage() : hideOverlayOnCurrentPage())
        }
      />

      {activeTab === "fixtures" ? (
        <section className="footballay-picker">
          <LeaguePicker
            leagues={leagues}
            selectedLeagueUid={settings.selectedLeagueUid}
            onSelectLeague={(leagueUid) => void selectLeague(leagueUid)}
          />

          <FixtureDateNavigator
            disabled={fixtureQueryLoading}
            fixtureDate={settings.fixtureDate}
            selectedFixtureDate={settings.selectedFixtureDate}
            onNavigate={(direction) => void navigateFixtureDate(direction)}
            onReturnToSelectedFixtureDate={() => void returnToSelectedFixtureDate()}
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
      ) : (
        <OverlaySettingsSection
          overlayCollapsed={settings.overlayCollapsed}
          overlayPosition={settings.overlayPosition}
          onChangeSettings={(patch) => void updateSettings(patch)}
        />
      )}

      {error ? <p className="footballay-popup-error">{error}</p> : null}
    </main>
  );
}
