import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/ui/section-heading";

type FAQItem = {
  q: string;
  a: React.ReactNode;
};

const faq: FAQItem[] = [
  {
    q: "O diagnóstico é realmente gratuito?",
    a: "Sim, sem letra miúda. Você responde, recebe o relatório, e decide se quer ir adiante. Eu ofereço gratuitamente porque é a melhor forma de te mostrar valor antes de pedir qualquer coisa.",
  },
  {
    q: "Eu preciso entender de tecnologia pra contratar?",
    a: "Não. Meu trabalho é traduzir tecnologia em resultado de negócio. Você fala a linguagem da sua empresa, eu traduzo pra automação.",
  },
  {
    q: "Quanto custa um projeto de automação?",
    a: (
      <>
        Depende do escopo. Automações pontuais começam em R$ 2.500. Sprints de
        IA dedicados ficam em R$ 7.500. Trabalho contínuo como desenvolvedor
        dedicado, R$ 5.000/mês. Detalhes na página de{" "}
        <Link
          href="/services"
          className="text-foreground underline decoration-brand decoration-2 underline-offset-4 hover:decoration-brand/60"
        >
          serviços
        </Link>
        .
      </>
    ),
  },
  {
    q: "Vocês usam IA em tudo? E se eu não confiar em IA?",
    a: "Uso IA quando ela é a melhor solução — não como muleta. Em muitos casos, automação tradicional resolve melhor e mais barato. O diagnóstico identifica qual abordagem faz sentido pro seu caso.",
  },
];

export function HomeFAQ() {
  return (
    <section className="border-b border-border/60">
      <div className="container-page py-20 md:py-24">
        <SectionHeading
          eyebrow="Perguntas frequentes"
          title="Antes que você pergunte"
          align="center"
        />
        <div className="mt-12 max-w-3xl mx-auto">
          <Accordion className="space-y-3">
            {faq.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`q-${i}`}
                className="rounded-2xl border border-border bg-card px-5 not-last:border-b-0 [&_[data-slot='accordion-trigger']]:py-5"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
