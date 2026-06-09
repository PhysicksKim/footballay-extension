import { useShallow } from "zustand/react/shallow";
import {
  navigateFixtureDate,
  returnToSelectedFixtureDate,
  updateFixtureQuery
} from "../actions/popupFixtureActions";
import { usePopupFixtureStore } from "../stores/popupFixtureStore";
import { usePopupSettingsStore } from "../stores/popupSettingsStore";
import type { FixtureDateDirection } from "../types";

export function useFixtureScheduleState() {
  const fixtureQueryLoading = usePopupFixtureStore((state) => state.fixtureQueryLoading);
  const { fixtureDate, selectedFixtureDate } = usePopupSettingsStore(
    useShallow((state) => ({
      fixtureDate: state.settings.fixtureDate,
      selectedFixtureDate: state.settings.selectedFixtureDate
    }))
  );

  return {
    disabled: fixtureQueryLoading,
    fixtureDate,
    onNavigate: (direction: FixtureDateDirection) => void navigateFixtureDate(direction),
    onReturnToSelectedFixtureDate: () => void returnToSelectedFixtureDate(),
    onSelectDate: (nextFixtureDate?: string) =>
      void updateFixtureQuery({
        fixtureDate: nextFixtureDate,
        fixtureLookupMode: "exact"
      }),
    selectedFixtureDate
  };
}
