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
        &lt;
      </button>
      <label className={`footballay-date-picker${disabled ? " footballay-date-picker--loading" : ""}`}>
        <span>{disabled ? "Loading fixtures" : formatSelectedDate(fixtureDate)}</span>
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
        &gt;
      </button>
    </div>
  );
}
