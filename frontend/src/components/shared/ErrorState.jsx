import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Recoverable error state with optional retry action.
 * Present a human explanation instead of raw server errors.
 */
const ErrorState = ({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
  retryLabel = "Try again",
  className,
}) => (
  <div
    role="alert"
    className={cn(
      "flex flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center",
      className
    )}
  >
    <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
      <AlertTriangle className="size-5 text-destructive" />
    </div>
    <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
    {description && (
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
    )}
    {onRetry && (
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        <RotateCw className="size-3.5" />
        {retryLabel}
      </Button>
    )}
  </div>
);

export default ErrorState;
