import { useShallow } from "zustand/react/shallow";
import { usePopupStore } from "../store";

export function useFixtureSelectionState() {
  const { fixtures, loadingText, selectedFixtureUid, selectedLeagueUid, selectFixture } =
    usePopupStore(
      useShallow((state) => ({
        fixtures: state.fixtures,
        loadingText: state.loadingText,
        selectedFixtureUid: state.settings.selectedFixtureUid,
        selectedLeagueUid: state.settings.selectedLeagueUid,
        selectFixture: state.selectFixture
      }))
    );

  return {
    fixtures,
    loadingText,
    onSelectFixture: (fixtureUid: string) => void selectFixture(fixtureUid),
    selectedFixtureUid,
    selectedLeagueUid
  };
}
