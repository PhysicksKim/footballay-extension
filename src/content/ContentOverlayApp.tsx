import { useMemo } from "react";
import { CompactOverlay } from "./components/CompactOverlay";
import { OverlayButton } from "./components/OverlayButton";
import { useContentOverlayRegistration } from "./hooks/useContentOverlayRegistration";
import { useContentOverlayRuntime } from "./hooks/useContentOverlayRuntime";
import {
  selectShouldRenderOverlayControl,
  useContentOverlayStore
} from "./store";
import { getOverlayPositionClass } from "@/shared/overlay/position";

export function ContentOverlayApp() {
  const data = useContentOverlayStore((state) => state.data);
  const settings = useContentOverlayStore((state) => state.settings);
  const shouldRenderControl = useContentOverlayStore(selectShouldRenderOverlayControl);
  const updateOverlaySettings = useContentOverlayStore((state) => state.updateOverlaySettings);

  useContentOverlayRuntime();
  useContentOverlayRegistration();

  const shellClassName = useMemo(
    () => `footballay-overlay-shell ${getOverlayPositionClass(settings.overlayPosition)}`,
    [settings.overlayPosition]
  );

  if (!shouldRenderControl) {
    return null;
  }

  return (
    <div className={shellClassName}>
      {!settings.overlayEnabled ? (
        <OverlayButton muted onClick={() => void updateOverlaySettings({ overlayEnabled: true })} />
      ) : settings.overlayCollapsed ? (
        <OverlayButton onClick={() => void updateOverlaySettings({ overlayCollapsed: false })} />
      ) : (
        <CompactOverlay
          data={data}
          onCollapse={() => void updateOverlaySettings({ overlayCollapsed: true })}
        />
      )}
    </div>
  );
}
