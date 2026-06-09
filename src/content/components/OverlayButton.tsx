import { PanelLeftOpen } from "lucide-react";

type OverlayButtonProps = {
  label?: string;
  muted?: boolean;
  onClick: () => void;
};

export function OverlayButton({ label, muted = false, onClick }: OverlayButtonProps) {
  return (
    <button
      aria-label={label ?? "Open Footballay overlay"}
      className={`footballay-overlay-button${muted ? " footballay-overlay-button--muted" : ""}`}
      type="button"
      onClick={onClick}
    >
      {label ?? <PanelLeftOpen aria-hidden size={15} strokeWidth={2.2} />}
    </button>
  );
}
