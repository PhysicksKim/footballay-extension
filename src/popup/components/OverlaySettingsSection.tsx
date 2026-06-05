import type { ExtensionSettings, OverlayPosition } from "@/shared/overlay/types";
import { overlayPositions } from "@/shared/overlay/position";

type OverlaySettingsSectionProps = {
  overlayCollapsed: boolean;
  overlayPosition: OverlayPosition;
  onChangeSettings: (patch: Partial<ExtensionSettings>) => void;
};

export function OverlaySettingsSection({
  overlayCollapsed,
  overlayPosition,
  onChangeSettings
}: OverlaySettingsSectionProps) {
  return (
    <section className="footballay-settings">
      <label className="footballay-popup-field">
        <span>Position</span>
        <select
          value={overlayPosition}
          onChange={(event) =>
            onChangeSettings({ overlayPosition: event.currentTarget.value as OverlayPosition })
          }
        >
          {overlayPositions.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
      </label>

      <label className="footballay-settings-row">
        <span>Collapsed by default</span>
        <input
          checked={overlayCollapsed}
          type="checkbox"
          onChange={(event) => onChangeSettings({ overlayCollapsed: event.currentTarget.checked })}
        />
      </label>
    </section>
  );
}
