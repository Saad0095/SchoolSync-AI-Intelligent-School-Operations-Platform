/**
 * Shared chart utilities: color palettes, custom Recharts tooltip,
 * and helper functions used across all dashboard charts.
 */

/* ──────────────────────────────────────────────
 *  Color palettes
 * ────────────────────────────────────────────── */

/** Vibrant, accessible palette for categorical data */
export const CHART_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#14b8a6", // teal
];

/** Semantic status colors */
export const STATUS_COLORS = {
  present: "#10b981",
  absent: "#ef4444",
  leave: "#f59e0b",
  active: "#10b981",
  dropped: "#ef4444",
};

/**
 * Returns a fill color based on a numeric score (0–100).
 * Green ≥ 80, Amber ≥ 60, Red < 60.
 */
export const scoreColor = (score) => {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

/* ──────────────────────────────────────────────
 *  Custom Recharts Tooltip
 * ────────────────────────────────────────────── */

/**
 * A polished, design-system-aware tooltip for Recharts.
 * Usage:  <Tooltip content={<ChartTooltip suffix="marks" />} />
 */
export const ChartTooltip = ({ active, payload, label, suffix = "", prefix = "" }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-card px-4 py-3 shadow-lg backdrop-blur-sm">
      {label && (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.fill || entry.color || "#6366f1" }}
            />
            <span className="text-sm text-foreground">
              {entry.name || entry.dataKey}:
            </span>
            <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
              {prefix}
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
              {suffix && ` ${suffix}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * A simpler tooltip variant for single-value charts (gauges, pie).
 * Usage: <Tooltip content={<SimpleTooltip suffix="%" />} />
 */
export const SimpleTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];

  return (
    <div className="rounded-xl border border-border/80 bg-card px-3.5 py-2.5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span
          className="inline-block size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: d.fill || d.payload?.fill || "#6366f1" }}
        />
        <span className="text-sm font-medium text-foreground">
          {d.payload?.name || d.name}:
        </span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {typeof d.value === "number" ? d.value.toLocaleString() : d.value}
        </span>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
 *  Custom Recharts Legend
 * ────────────────────────────────────────────── */

/**
 * Clean horizontal legend with colored dots.
 * Recharts passes `payload` automatically when used as <Legend content={...} />
 */
export const ChartLegend = ({ payload }) => {
  if (!payload?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ──────────────────────────────────────────────
 *  Reusable axis tick styles
 * ────────────────────────────────────────────── */

export const axisTickStyle = {
  fontSize: 11,
  fill: "hsl(var(--muted-foreground))",
  fontWeight: 500,
};

export const gridStroke = "hsl(var(--border))";
