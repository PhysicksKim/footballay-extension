import { ChartNoAxesColumn, UserRound, X } from "lucide-react";
import { t } from "@/shared/i18n/locale";

type OverlayEdgeHandleProps = {
  active?: boolean;
  onClick: () => void;
  side: "left" | "right";
};

const labels = {
  left: "content.drawer.left.open",
  right: "content.drawer.right.open"
} as const;

export function OverlayEdgeHandle({ active = false, onClick, side }: OverlayEdgeHandleProps) {
  const Icon = active ? X : side === "left" ? ChartNoAxesColumn : UserRound;

  return (
    <button
      className={`footballay-edge-handle footballay-edge-handle--${side}${
        active ? " footballay-edge-handle--active" : ""
      }`}
      type="button"
      onClick={onClick}
      aria-label={t(labels[side])}
      title={t(labels[side])}
    >
      <Icon aria-hidden size={16} strokeWidth={2.2} />
    </button>
  );
}
