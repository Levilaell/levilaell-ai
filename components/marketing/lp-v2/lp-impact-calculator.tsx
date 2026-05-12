interface CalculatorRow {
  label: string;
  value: string;
}

interface LpImpactCalculatorProps {
  title: string;
  rows: CalculatorRow[];
  total: CalculatorRow;
  subtitle?: string;
}

export function LpImpactCalculator({
  title,
  rows,
  total,
  subtitle,
}: LpImpactCalculatorProps) {
  return (
    <div className="container-page py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <h2 className="heading-2 mb-8 md:mb-10">{title}</h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {rows.map((row, i) => (
            <div
              key={`${row.label}-${i}`}
              className="flex items-center justify-between gap-4 px-5 md:px-6 py-4 border-b border-border last:border-b-0"
            >
              <span className="text-sm md:text-base text-muted-foreground">
                {row.label}
              </span>
              <span className="font-mono text-sm md:text-base font-medium text-foreground whitespace-nowrap">
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 px-5 md:px-6 py-5 bg-brand/15 border-t-2 border-brand">
            <span className="text-base md:text-lg font-semibold text-foreground">
              {total.label}
            </span>
            <span className="font-mono text-lg md:text-xl font-bold text-foreground">
              {total.value}
            </span>
          </div>
        </div>
        {subtitle && (
          <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
