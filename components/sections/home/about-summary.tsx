import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutSummary() {
  return (
    <section className="border-b border-border/60">
      <div className="container-page py-20 md:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16 items-center">
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 grid place-items-center text-zinc-50 dark:text-zinc-900">
              <span className="font-mono text-xs uppercase tracking-widest opacity-70">
                Foto · em breve
              </span>
            </div>
          </div>
          <div className="lg:col-span-8 order-1 lg:order-2">
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Sobre
            </span>
            <h2 className="heading-2">Eu sou Levi Lael.</h2>
            <div className="mt-6 space-y-5 text-base md:text-lg text-foreground/85 leading-relaxed">
              <p>
                Engenheiro de operações com IA e automação. Background em código, especialista em traduzir caos operacional em sistemas que rodam sozinhos.
              </p>
              <p>
                Eu não vendo "automação". Eu vendo{" "}
                <strong className="text-foreground">operação inteligente</strong>{" "}
                — a diferença entre uma empresa que depende de gente apagando incêndio e uma que escala com previsibilidade.
              </p>
              <p className="border-l-2 border-brand pl-4">
                <strong className="block text-foreground mb-1">Minha bandeira:</strong>
                sua próxima contratação não precisa ser uma pessoa. Precisa ser um sistema.
              </p>
            </div>
            <div className="mt-8">
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link href="/about">
                  Conheça minha história
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
