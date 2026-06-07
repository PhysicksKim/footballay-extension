import { GitBranch, Mail } from "lucide-react";
import type { ExtensionSettings, OverlayPosition } from "@/shared/overlay/types";
import { overlayPositions } from "@/shared/overlay/position";

type OverlaySettingsSectionProps = {
  overlayPosition: OverlayPosition;
  onChangeSettings: (patch: Partial<ExtensionSettings>) => void;
};

const overlayPositionLabels: Record<OverlayPosition, string> = {
  "bottom-center": "하단 중앙",
  "bottom-left": "왼쪽 하단",
  "bottom-right": "오른쪽 하단",
  "top-left": "왼쪽 상단",
  "top-right": "오른쪽 상단"
};

const contactLinks = {
  email: "physickskim@gmail.com",
  github: "https://github.com/PhysicksKim"
};

export function OverlaySettingsSection({
  overlayPosition,
  onChangeSettings
}: OverlaySettingsSectionProps) {
  return (
    <section className="footballay-settings">
      <label className="footballay-settings-row footballay-settings-row--select">
        <span>표시 위치</span>
        <select
          value={overlayPosition}
          onChange={(event) =>
            onChangeSettings({ overlayPosition: event.currentTarget.value as OverlayPosition })
          }
        >
          {overlayPositions.map((position) => (
            <option key={position} value={position}>
              {overlayPositionLabels[position]}
            </option>
          ))}
        </select>
      </label>

      <div className="footballay-settings-spacer" aria-hidden />

      <footer className="footballay-settings-footer">
        <a href={contactLinks.github} target="_blank" rel="noreferrer">
          <GitBranch aria-hidden size={14} strokeWidth={2.2} />
          <span>GitHub</span>
        </a>
        <a href={`mailto:${contactLinks.email}`}>
          <Mail aria-hidden size={14} strokeWidth={2.2} />
          <span>{contactLinks.email}</span>
        </a>
      </footer>
    </section>
  );
}
