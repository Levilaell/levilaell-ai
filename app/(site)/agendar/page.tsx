/**
 * Página de aterrissagem do form de agendamento.
 *
 * Pra onde o lead cai quando clica em "Agendar" nos emails de followup do
 * diagnóstico (antes era cal.com via /r/calcom/[id]). Carrega o diagnóstico
 * pelo id da query string (?d=<uuid>) e pré-preenche o form — lead só escolhe
 * a urgência e clica.
 *
 * Sem `d`: renderiza dialog em branco (mesmo fluxo dos botões do site).
 * Com `d` inválido / sem permissão: ignora o prefill e segue em branco.
 */
import type { Metadata } from "next";
import { getDiagnosisById } from "@/lib/supabase";
import { AgendarClient } from "./agendar-client";

export const metadata: Metadata = {
  title: "Agendar conversa",
  description:
    "Preenche os dados e te chamo no WhatsApp em alguns minutos pra combinar a melhor hora.",
  alternates: { canonical: "/agendar" },
};

type SearchParams = Promise<{ d?: string }>;

export default async function AgendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { d } = await searchParams;
  let prefill: { name?: string; email?: string; whatsapp?: string } | undefined;
  let diagnosisId: string | undefined;

  if (d && /^[0-9a-f-]{36}$/i.test(d)) {
    const diag = await getDiagnosisById(d);
    if (diag) {
      diagnosisId = diag.id;
      prefill = {
        name: diag.name,
        email: diag.email,
        whatsapp: diag.whatsapp ?? undefined,
      };
    }
  }

  return (
    <AgendarClient
      diagnosisId={diagnosisId}
      prefill={prefill}
      source={diagnosisId ? "email_followup" : "agendar_page"}
    />
  );
}
