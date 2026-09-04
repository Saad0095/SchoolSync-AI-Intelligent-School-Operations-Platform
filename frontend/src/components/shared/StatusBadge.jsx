import { cn } from "@/lib/utils";

/**
 * Status pill driven by semantic tokens (dark-mode safe).
 * Shows a colored dot + label for active/inactive states.
 */
const StatusBadge = ({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  className,
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
      active
        ? "bg-success/10 text-success"
        : "bg-destructive/10 text-destructive",
      className
    )}
  >
    <span
      aria-hidden="true"
      className={cn("size-1.5 rounded-full", active ? "bg-success" : "bg-destructive")}
    />
    {active ? activeLabel : inactiveLabel}
  </span>
);

export default StatusBadge;
