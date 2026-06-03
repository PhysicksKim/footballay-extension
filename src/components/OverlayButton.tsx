type OverlayButtonProps = {
  label?: string;
  muted?: boolean;
  onClick: () => void;
};

export function OverlayButton({ label = "Footballay", muted = false, onClick }: OverlayButtonProps) {
  return (
    <button
      aria-label="Toggle Footballay overlay"
      className={`footballay-overlay-button${muted ? " footballay-overlay-button--muted" : ""}`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
