import { useShallow } from "zustand/react/shallow";
import type { FixtureDateDirection } from "../store";
import { usePopupStore } from "../store";

export function useFixtureScheduleState() {
  const {
    fixtureDate,
    fixtureQueryLoading,
    navigateFixtureDate,
    returnToSelectedFixtureDate,
    selectedFixtureDate,
    updateFixtureQuery
  } = usePopupStore(
    useShallow((state) => ({
      fixtureDate: state.settings.fixtureDate,
      fixtureQueryLoading: state.fixtureQueryLoading,
      navigateFixtureDate: state.navigateFixtureDate,
      returnToSelectedFixtureDate: state.returnToSelectedFixtureDate,
      selectedFixtureDate: state.settings.selectedFixtureDate,
      updateFixtureQuery: state.updateFixtureQuery
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
