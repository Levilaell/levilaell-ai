import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InlineDiagnosisCTA() {
  return (
    <aside className="my-12 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-6 md:p-7">
      <div className="flex items-start gap-3 mb-3">
        <Sparkles className="size-5 text-amber-700 dark:text-amber-300 mt-0.5" aria-hidden />
        <p className="font-mono text-xs uppercase tracking-widest text-amber-900 dark:text-amber-100">
          Diagnóstico gratuito
        </p>
      </div>
      <p className="text-base md:text-lg font-medium text-amber-950 dark:text-amber-100">
        Quer descobrir como aplicar isso na sua operação? Faça o diagnóstico em 2 minutos.
      </p>
      <div className="mt-5">
        <Button asChild size="lg" variant="brand" className="rounded-xl">
          <Link href="/diagnosis">
            Iniciar diagnóstico
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </aside>
  );
}
