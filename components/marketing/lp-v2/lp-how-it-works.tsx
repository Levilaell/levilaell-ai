interface Step {
  number: number;
  title: string;
  description: string;
}

interface LpHowItWorksProps {
  title: string;
  steps: Step[];
}

export function LpHowItWorks({ title, steps }: LpHowItWorksProps) {
  return (
    <div className="bg-muted/30">
      <div className="container-page py-16 md:py-24">
        <h2 className="heading-2 mb-10 md:mb-12 text-center max-w-3xl mx-auto">
          {title}
        </h2>
        <div className="grid gap-5 md:gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex items-start gap-4">
                <span
                  className="font-mono text-3xl md:text-4xl font-bold text-brand leading-none"
                  aria-hidden
                >
                  {String(step.number).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
