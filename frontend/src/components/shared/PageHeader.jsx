import { cn } from "@/lib/utils";

const PageHeader = ({ title, subtitle, actions, eyebrow, className }) => {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
