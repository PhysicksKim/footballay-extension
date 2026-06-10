import { useMemo } from "react";
import { CompactOverlay } from "./components/CompactOverlay";
import { OverlayButton } from "./components/OverlayButton";
import { useContentOverlayRegistration } from "./hooks/useContentOverlayRegistration";
import { useContentOverlayRuntime } from "./hooks/useContentOverlayRuntime";
import { updateContentOverlaySettings } from "@/content/actions/contentOverlayActions";
import { selectShouldRenderOverlayControl } from "@/content/selectors/contentOverlaySelectors";
import { useContentLiveDataStore } from "@/content/stores/contentLiveDataStore";
import { useContentPageOverlayStore } from "@/content/stores/contentPageOverlayStore";
import { useContentSettingsStore } from "@/content/stores/contentSettingsStore";
import { getOverlayPositionClass } from "@/shared/overlay/position";

export function ContentOverlayApp() {
  const data = useContentLiveDataStore((state) => state.data);
  const settings = useContentSettingsStore((state) => state.settings);
  const isSupportedPage = useContentPageOverlayStore((state) => state.isSupportedPage);
  const manualVisible = useContentPageOverlayStore((state) => state.manualVisible);
  const pageUrl = useContentPageOverlayStore((state) => state.pageUrl);
  const shouldRenderControl = selectShouldRenderOverlayControl({
    isSupportedPage,
    manualVisible,
    pageUrl
  });

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
        <OverlayButton muted onClick={() => void updateContentOverlaySettings({ overlayEnabled: true })} />
      ) : settings.overlayCollapsed ? (
        <OverlayButton onClick={() => void updateContentOverlaySettings({ overlayCollapsed: false })} />
      ) : (
        <CompactOverlay
          data={data}
          settings={settings}
          onCollapse={() => void updateContentOverlaySettings({ overlayCollapsed: true })}
        />
      )}
    </div>
  );
}
