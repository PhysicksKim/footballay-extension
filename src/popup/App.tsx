import { useEffect } from "react";
import { PopupView } from "./PopupView";
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
    <PopupView
      activeTab={activeTab}
      error={error}
      fixtureQueryLoading={fixtureQueryLoading}
      fixtures={fixtures}
      leagues={leagues}
      loadingText={loadingText}
      pageOverlayState={pageOverlayState}
      pageOverlayStateLoading={pageOverlayStateLoading}
      settings={settings}
      onChangeTab={setActiveTab}
      onHideOverlayOnCurrentPage={() => void hideOverlayOnCurrentPage()}
      onNavigateFixtureDate={(direction) => void navigateFixtureDate(direction)}
      onReturnToSelectedFixtureDate={() => void returnToSelectedFixtureDate()}
      onSelectFixture={(fixtureUid) => void selectFixture(fixtureUid)}
      onSelectFixtureDate={(fixtureDate) =>
        void updateFixtureQuery({
          fixtureDate,
          fixtureLookupMode: "exact"
        })
      }
      onSelectLeague={(leagueUid) => void selectLeague(leagueUid)}
      onShowOverlayOnCurrentPage={() => void showOverlayOnCurrentPage()}
      onUpdateSettings={(patch) => void updateSettings(patch)}
    />
  );
}
