import { useMemo } from "react";
import { CompactOverlay } from "./components/CompactOverlay";
import { OverlayEdgeHandle } from "./components/OverlayEdgeHandle";
import { OverlayButton } from "./components/OverlayButton";
import { RightLineupDrawer } from "./components/RightLineupDrawer";
import { useContentOverlayRegistration } from "./hooks/useContentOverlayRegistration";
import { useContentOverlayRuntime } from "./hooks/useContentOverlayRuntime";
import { useContentOverlayShortcuts } from "./hooks/useContentOverlayShortcuts";
import { updateContentOverlaySettings } from "@/content/actions/contentOverlayActions";
import { selectShouldRenderOverlayControl } from "@/content/selectors/contentOverlaySelectors";
import { useContentLiveDataStore } from "@/content/stores/contentLiveDataStore";
import { useContentOverlayViewStore } from "@/content/stores/contentOverlayViewStore";
import { useContentPageOverlayStore } from "@/content/stores/contentPageOverlayStore";
import { useContentSettingsStore } from "@/content/stores/contentSettingsStore";
import { getOverlayPositionClass } from "@/shared/overlay/position";

export function ContentOverlayApp() {
  const data = useContentLiveDataStore((state) => state.data);
  const settings = useContentSettingsStore((state) => state.settings);
  const isSupportedPage = useContentPageOverlayStore((state) => state.isSupportedPage);
  const manualVisible = useContentPageOverlayStore((state) => state.manualVisible);
  const pageUrl = useContentPageOverlayStore((state) => state.pageUrl);
  const drawerSide = useContentOverlayViewStore((state) => state.drawerSide);
  const selectedPlayerUid = useContentOverlayViewStore((state) => state.selectedPlayerUid);
  const clearSelectedPlayer = useContentOverlayViewStore((state) => state.clearSelectedPlayer);
  const closeDrawer = useContentOverlayViewStore((state) => state.closeDrawer);
  const openLeftDrawer = useContentOverlayViewStore((state) => state.openLeftDrawer);
  const openRightDrawer = useContentOverlayViewStore((state) => state.openRightDrawer);
  const selectPlayer = useContentOverlayViewStore((state) => state.selectPlayer);
  const shouldRenderControl = selectShouldRenderOverlayControl({
    isSupportedPage,
    manualVisible,
    pageUrl
  });

  useContentOverlayRuntime();
  useContentOverlayRegistration();
  useContentOverlayShortcuts(shouldRenderControl && settings.overlayEnabled && !settings.overlayCollapsed);

  const shellClassName = useMemo(
    () => `footballay-overlay-shell ${getOverlayPositionClass(settings.overlayPosition)}`,
    [settings.overlayPosition]
  );

  if (!shouldRenderControl) {
    return null;
  }

  const shouldRenderDrawerHandles = settings.overlayEnabled && !settings.overlayCollapsed;

  return (
    <>
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
      {shouldRenderDrawerHandles ? (
        <>
          <OverlayEdgeHandle
            active={drawerSide === "left"}
            side="left"
            onClick={drawerSide === "left" ? closeDrawer : openLeftDrawer}
          />
          <OverlayEdgeHandle
            active={drawerSide === "right"}
            side="right"
            onClick={drawerSide === "right" ? closeDrawer : openRightDrawer}
          />
        </>
      ) : null}
      {drawerSide === "right" && shouldRenderDrawerHandles ? (
        <RightLineupDrawer
          data={data}
          selectedPlayerUid={selectedPlayerUid}
          onClearSelectedPlayer={clearSelectedPlayer}
          onSelectPlayer={selectPlayer}
        />
      ) : null}
    </>
  );
}
