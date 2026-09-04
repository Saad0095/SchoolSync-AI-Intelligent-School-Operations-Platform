import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  danger: "bg-destructive/10 text-destructive",
  ai: "bg-ai-accent/10 text-ai-accent",
  neutral: "bg-muted text-muted-foreground",
};

/** Left accent border color per tone */
const toneAccent = {
  primary: "border-l-primary",
  success: "border-l-success",
  warning: "border-l-warning",
  info: "border-l-info",
  danger: "border-l-destructive",
  ai: "border-l-ai-accent",
  neutral: "border-l-muted-foreground/30",
};

/** Trend arrow config */
const trendConfig = {
  up:   { icon: TrendingUp,   cls: "text-success" },
  down: { icon: TrendingDown, cls: "text-destructive" },
  flat: { icon: Minus,        cls: "text-muted-foreground" },
};

/**
 * Shared KPI card used across dashboards.
 * Displays a metric with label, value, contextual hint and a tonal icon chip.
 * Optional `trend` prop ("up" | "down" | "flat") shows a trend indicator next to the hint.
 */
const StatCard = ({ icon: Icon, label, value, hint, tone = "primary", trend, trendValue, className }) => {
  const Trend = trend ? trendConfig[trend] : null;
  const TrendIcon = Trend?.icon;

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border/60 border-l-[3px] bg-card p-5 shadow-card",
        "transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5",
        toneAccent[tone] || toneAccent.primary,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
            {Trend && TrendIcon && (
              <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", Trend.cls)}>
                <TrendIcon size={12} aria-hidden="true" />
                {trendValue && <span>{trendValue}</span>}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              "transition-transform duration-200 group-hover:scale-105",
              toneClasses[tone] || toneClasses.primary
            )}
          >
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
