type PopupHeaderProps = {
  overlayEnabled: boolean;
  onToggleOverlay: (overlayEnabled: boolean) => void;
};

export function PopupHeader({ overlayEnabled, onToggleOverlay }: PopupHeaderProps) {
  return (
    <header className="footballay-popup__header">
      <div>
        <h1>Footballay</h1>
        <p>Live stats overlay</p>
      </div>
      <label className="footballay-switch">
        <input
          checked={overlayEnabled}
          type="checkbox"
          onChange={(event) => onToggleOverlay(event.currentTarget.checked)}
        />
        <span />
      </label>
    </header>
  );
}
