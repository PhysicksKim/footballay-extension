import { useShallow } from "zustand/react/shallow";
import { selectFixture } from "../actions/popupFixtureActions";
import { usePopupFixtureStore } from "../stores/popupFixtureStore";
import { usePopupSettingsStore } from "../stores/popupSettingsStore";

export function useFixtureSelectionState() {
  const { fixtures, loadingText } = usePopupFixtureStore(
    useShallow((state) => ({
      fixtures: state.fixtures,
      loadingText: state.loadingText
    }))
  );
  const { selectedFixtureUid, selectedLeagueUid } = usePopupSettingsStore(
    useShallow((state) => ({
      selectedFixtureUid: state.settings.selectedFixtureUid,
      selectedLeagueUid: state.settings.selectedLeagueUid
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
