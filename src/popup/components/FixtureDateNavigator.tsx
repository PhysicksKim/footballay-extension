import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getTodayDateInputValue } from "../utils/date";
import { formatSelectedDate } from "../utils/format";

type FixtureDateDirection = "previous" | "next";

type FixtureDateNavigatorProps = {
  disabled: boolean;
  fixtureDate?: string;
  selectedFixtureDate?: string;
  onNavigate: (direction: FixtureDateDirection) => void;
  onReturnToSelectedFixtureDate: () => void;
  onSelectDate: (fixtureDate?: string) => void;
};

export function FixtureDateNavigator({
  disabled,
  fixtureDate,
  selectedFixtureDate,
  onNavigate,
  onReturnToSelectedFixtureDate,
  onSelectDate
}: FixtureDateNavigatorProps) {
  const currentFixtureDate = fixtureDate ?? getTodayDateInputValue();
  const canReturnToSelectedFixtureDate =
    !disabled && Boolean(selectedFixtureDate) && selectedFixtureDate !== currentFixtureDate;

  return (
    <div className="footballay-date-nav">
      <button
        type="button"
        aria-label="Previous fixture date"
        disabled={disabled}
        onClick={() => onNavigate("previous")}
      >
        <ChevronLeft aria-hidden size={24} strokeWidth={3} />
      </button>
      <label className={`footballay-date-picker${disabled ? " footballay-date-picker--loading" : ""}`}>
        <span>{formatSelectedDate(fixtureDate)}</span>
        {disabled ? <i aria-hidden className="footballay-date-spinner" /> : null}
        <CalendarDays aria-hidden size={22} strokeWidth={2.4} />
        <input
          type="date"
          disabled={disabled}
          value={currentFixtureDate}
          onChange={(event) => onSelectDate(event.currentTarget.value || undefined)}
        />
      </label>
      {canReturnToSelectedFixtureDate ? (
        <button
          className="footballay-date-return"
          type="button"
          aria-label="Return to selected fixture date"
          disabled={disabled}
          onClick={onReturnToSelectedFixtureDate}
        >
          <CalendarCheck aria-hidden size={15} strokeWidth={2.4} />
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Next fixture date"
        disabled={disabled}
        onClick={() => onNavigate("next")}
      >
        <ChevronRight aria-hidden size={24} strokeWidth={3} />
      </button>
    </div>
  );
}
