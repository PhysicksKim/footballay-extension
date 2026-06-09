import { useEffect } from "react";
import { PopupView } from "./PopupView";
import { useFixtureScheduleState } from "./hooks/useFixtureScheduleState";
import { useFixtureSelectionState } from "./hooks/useFixtureSelectionState";
import { useLeaguePickerState } from "./hooks/useLeaguePickerState";
import { useOverlaySettingsState } from "./hooks/useOverlaySettingsState";
import { usePageOverlayControl } from "./hooks/usePageOverlayControl";
import { usePopupLifecycle } from "./hooks/usePopupLifecycle";
import { usePopupShell } from "./hooks/usePopupShell";
import type { RuntimeMessage } from "@/shared/messages";

export function App() {
  const lifecycle = usePopupLifecycle();
  const shell = usePopupShell();
  const leaguePicker = useLeaguePickerState();
  const fixtureSchedule = useFixtureScheduleState();
  const fixtureSelection = useFixtureSelectionState();
  const pageOverlay = usePageOverlayControl();
  const overlaySettings = useOverlaySettingsState();

  useEffect(() => {
    lifecycle.loadState();

    const listener = (message: RuntimeMessage) => {
      lifecycle.handleRuntimeMessage(message);
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [lifecycle]);

  return (
    <PopupView
      fixtureSchedule={fixtureSchedule}
      fixtureSelection={fixtureSelection}
      leaguePicker={leaguePicker}
      overlaySettings={overlaySettings}
      pageOverlay={pageOverlay}
      shell={shell}
    />
  );
}
