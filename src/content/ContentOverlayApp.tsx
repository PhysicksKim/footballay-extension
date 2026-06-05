import { useMemo } from "react";
import { CompactOverlay } from "./components/CompactOverlay";
import { ExpandedOverlayDrawer } from "./components/ExpandedOverlayDrawer";
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
  const isSupportedPage = useContentOverlayStore((state) => state.isSupportedPage);
  const settings = useContentOverlayStore((state) => state.settings);
  const setManualVisible = useContentOverlayStore((state) => state.setManualVisible);
  const setViewMode = useContentOverlayStore((state) => state.setViewMode);
  const shouldRenderControl = useContentOverlayStore(selectShouldRenderOverlayControl);
  const updateOverlaySettings = useContentOverlayStore((state) => state.updateOverlaySettings);
  const viewMode = useContentOverlayStore((state) => state.viewMode);

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
        <OverlayButton label="F" muted onClick={() => void updateOverlaySettings({ overlayEnabled: true })} />
      ) : settings.overlayCollapsed ? (
        <OverlayButton onClick={() => void updateOverlaySettings({ overlayCollapsed: false })} />
      ) : viewMode === "compact" ? (
        <CompactOverlay
          data={data}
          onCollapse={() => void updateOverlaySettings({ overlayCollapsed: true })}
          onExpand={() => setViewMode("expanded")}
        />
      ) : (
        <ExpandedOverlayDrawer
          data={data}
          onCollapse={() => void updateOverlaySettings({ overlayCollapsed: true })}
          onCompact={() => setViewMode("compact")}
          onDisable={() => {
            if (isSupportedPage) {
              void updateOverlaySettings({ overlayEnabled: false, overlayCollapsed: true });
              return;
            }

            setManualVisible(false);
          }}
        />
      )}
    </div>
  );
}
