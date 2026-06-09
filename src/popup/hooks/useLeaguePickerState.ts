import { useShallow } from "zustand/react/shallow";
import { usePopupStore } from "../store";

export function useLeaguePickerState() {
  const { leagues, selectedLeagueUid, selectLeague } = usePopupStore(
    useShallow((state) => ({
      leagues: state.leagues,
      selectedLeagueUid: state.settings.selectedLeagueUid,
      selectLeague: state.selectLeague
    }))
  );

  return {
    leagues,
    onSelectLeague: (leagueUid: string) => void selectLeague(leagueUid),
    selectedLeagueUid
  };
}
