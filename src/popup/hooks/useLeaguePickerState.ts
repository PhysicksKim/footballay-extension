import { useShallow } from "zustand/react/shallow";
import { selectLeague } from "../actions/popupFixtureActions";
import { usePopupFixtureStore } from "../stores/popupFixtureStore";
import { usePopupSettingsStore } from "../stores/popupSettingsStore";

export function useLeaguePickerState() {
  const leagues = usePopupFixtureStore((state) => state.leagues);
  const { selectedLeagueUid } = usePopupSettingsStore(
    useShallow((state) => ({
      selectedLeagueUid: state.settings.selectedLeagueUid
    }))
  );

  return {
    leagues,
    onSelectLeague: (leagueUid: string) => void selectLeague(leagueUid),
    selectedLeagueUid
  };
}
