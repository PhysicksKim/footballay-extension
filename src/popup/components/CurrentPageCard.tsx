import type { PageOverlayState } from "@/shared/messages";

type CurrentPageCardProps = {
  pageOverlayState: PageOverlayState | null;
  onHideOverlay: () => void;
  onShowOverlay: () => void;
};

export function CurrentPageCard({
  pageOverlayState,
  onHideOverlay,
  onShowOverlay
}: CurrentPageCardProps) {
  const canControlCurrentPage = pageOverlayState?.url.startsWith("http") ?? false;
  const currentPageLabel = pageOverlayState?.isSupportedPage
    ? "Auto overlay page"
    : pageOverlayState
      ? "Manual overlay page"
      : "Unavailable page";

  return (
    <section className="footballay-popup-card">
      <span>Current Page</span>
      <strong>{currentPageLabel}</strong>
      <button
        className="footballay-popup-button"
        disabled={!canControlCurrentPage}
        type="button"
        onClick={pageOverlayState?.visible ? onHideOverlay : onShowOverlay}
      >
        {pageOverlayState?.visible ? "Hide on this page" : "Show on this page"}
      </button>
    </section>
  );
}
