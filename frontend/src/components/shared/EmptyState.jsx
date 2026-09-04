import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Deliberate empty state for data-driven surfaces.
 * Explains what is empty, why it matters, and what to do next.
 */
const EmptyState = ({ icon: Icon = Inbox, title, description, action, className }) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-12 text-center",
      className
    )}
  >
    <div className="flex size-12 items-center justify-center rounded-full border border-border/60 bg-card shadow-card">
      <Icon className="size-5 text-muted-foreground" />
    </div>
    <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
    {description && (
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
    )}
    {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
  </div>
);

export default EmptyState;
