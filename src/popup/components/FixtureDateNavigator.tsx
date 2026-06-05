import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getTodayDateInputValue } from "../utils/date";
import { formatSelectedDate } from "../utils/format";

type FixtureDateDirection = "previous" | "next";

type FixtureDateNavigatorProps = {
  disabled: boolean;
  fixtureDate?: string;
  onNavigate: (direction: FixtureDateDirection) => void;
  onSelectDate: (fixtureDate?: string) => void;
};

export function FixtureDateNavigator({
  disabled,
  fixtureDate,
  onNavigate,
  onSelectDate
}: FixtureDateNavigatorProps) {
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
          value={fixtureDate ?? getTodayDateInputValue()}
          onChange={(event) => onSelectDate(event.currentTarget.value || undefined)}
        />
      </label>
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
