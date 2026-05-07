import { cn } from "@/lib/utils";
import { Info, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import * as React from "react";

type CalloutTone = "info" | "warning" | "success" | "alert";

const toneStyles: Record<CalloutTone, { container: string; icon: React.ReactNode }> = {
  info: {
    container: "border-zinc-200 bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100",
    icon: <Info className="size-5 text-zinc-700 dark:text-zinc-300" aria-hidden />,
  },
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-100",
    icon: <CheckCircle2 className="size-5 text-emerald-700 dark:text-emerald-300" aria-hidden />,
  },
  warning: {
    container: "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-100",
    icon: <AlertTriangle className="size-5 text-amber-700 dark:text-amber-300" aria-hidden />,
  },
  alert: {
    container: "border-amber-300 bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100",
    icon: <Lightbulb className="size-5 text-amber-700 dark:text-amber-300" aria-hidden />,
  },
};

export function Callout({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: CalloutTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const style = toneStyles[tone];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4 md:p-5",
        style.container,
        className,
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
      <div className="space-y-1.5">
        {title && <p className="font-semibold text-sm leading-snug">{title}</p>}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
