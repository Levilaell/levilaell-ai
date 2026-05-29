import { redirect } from "next/navigation";

// A descoberta foi unificada no /diagnosis (mesmo motor, mascarado como
// diagnóstico — que é o que converte). Mantém o redirect pra não quebrar
// links/CTAs antigos que ainda apontam pra cá, preservando o source.
export default async function DescobertaPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; d?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  if (typeof sp.source === "string") params.set("source", sp.source);
  if (typeof sp.d === "string") params.set("d", sp.d);
  const qs = params.toString();
  redirect(qs ? `/diagnosis?${qs}` : "/diagnosis");
}
