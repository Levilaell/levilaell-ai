import Link from "next/link";
import {
  Bot,
  BarChart3,
  Repeat,
  Mail,
  Workflow,
  Brain,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const items = [
  {
    icon: Bot,
    title: "Agentes de IA",
    detail: "Atendimento, triagem, qualificação de leads",
  },
  {
    icon: BarChart3,
    title: "Relatórios automáticos",
    detail: "Dashboards e BIs que se atualizam sozinhos",
  },
  {
    icon: Repeat,
    title: "Integrações entre sistemas",
    detail: "CRM, ERP, planilhas, e-commerce",
  },
  {
    icon: Mail,
    title: "Comunicação automatizada",
    detail: "E-mail, WhatsApp, SMS contextualizados",
  },
  {
    icon: Workflow,
    title: "Workflows internos",
    detail: "Aprovações, onboarding, processos repetitivos",
  },
  {
    icon: Brain,
    title: "Análise de dados com IA",
    detail: "Documentos, contratos, atendimentos",
  },
] as const;

export function WhatIAutomate() {
  return (
    <section className="border-b border-border/60">
      <div className="container-page py-20 md:py-24">
        <SectionHeading
          eyebrow="Capacidades"
          title="O que eu automatizo"
          description="6 categorias de problema. Centenas de combinações possíveis. Sua dor provavelmente é uma delas — e o diagnóstico encontra qual."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, detail }) => (
            <article
              key={title}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-brand/40 hover:shadow-sm transition-all"
            >
              <div className="size-10 rounded-lg bg-brand/10 grid place-items-center mb-5">
                <Icon className="size-5 text-foreground" aria-hidden />
              </div>
              <h3 className="font-semibold text-base">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {detail}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Não fez sentido pra você?{" "}
          <Link
            href="/diagnosis"
            className="text-foreground font-medium underline decoration-brand decoration-2 underline-offset-4 hover:decoration-brand/60"
          >
            Faça o diagnóstico
          </Link>
          {" "}— a IA encontra oportunidades específicas do seu negócio.
        </p>
      </div>
    </section>
  );
}
