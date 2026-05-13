import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { formatLongDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de privacidade e tratamento de dados de Levi Lael (levilael.com.br), em conformidade com a LGPD.",
  alternates: { canonical: "/privacy" },
};

const lastUpdated = new Date().toISOString();

export default function PrivacyPage() {
  return (
    <article className="container-prose py-16 md:py-20">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        Privacidade
      </p>
      <h1 className="heading-1">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground mt-2 font-mono">
        Última atualização: {formatLongDate(lastUpdated)}
      </p>

      <div className="mt-12 space-y-12 text-base md:text-lg leading-relaxed text-foreground/90">
        <section>
          <h2 className="heading-3">1. Quem somos</h2>
          <p className="mt-3">
            Este site (<strong>levilael.com.br</strong>) é operado por{" "}
            <strong>Levi Lael</strong>, profissional autônomo, baseado em São José do Rio Preto/SP, Brasil.
          </p>
        </section>

        <section>
          <h2 className="heading-3">2. Que dados coletamos</h2>
          <ul className="mt-3 space-y-2 list-disc list-outside pl-6 marker:text-muted-foreground">
            <li>
              <strong>Diagnóstico:</strong> nome, e-mail, WhatsApp (opcional), empresa (opcional), respostas das 9 perguntas, e dados quantitativos opcionais (faturamento, número de funcionários).
            </li>
            <li>
              <strong>Newsletter:</strong> nome, e-mail.
            </li>
            <li>
              <strong>Contato:</strong> nome, e-mail, mensagem, empresa (opcional).
            </li>
            <li>
              <strong>Tracking:</strong> páginas visitadas, cliques, navegador (anônimo, não inclui IP em texto puro).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="heading-3">3. Por que coletamos</h2>
          <ul className="mt-3 space-y-2 list-disc list-outside pl-6 marker:text-muted-foreground">
            <li>Para processar e enviar seu diagnóstico personalizado.</li>
            <li>Para enviar newsletter (apenas se você assinar).</li>
            <li>Para responder a contatos diretos.</li>
            <li>Para entender uso do site e melhorar a experiência.</li>
          </ul>
        </section>

        <section>
          <h2 className="heading-3">4. Com quem compartilhamos</h2>
          <ul className="mt-3 space-y-2 list-disc list-outside pl-6 marker:text-muted-foreground">
            <li>
              <strong>Anthropic</strong> — processa sua resposta para gerar o diagnóstico via API. Não armazena seus dados.
            </li>
            <li>
              <strong>Resend</strong> — envia os e-mails. Armazena temporariamente.
            </li>
            <li>
              <strong>Supabase</strong> — banco de dados onde ficam armazenados.
            </li>
            <li>
              <strong>Vercel</strong> — hospedagem do site.
            </li>
            <li>
              <strong>Cal.com</strong> — apenas se você agendar uma conversa.
            </li>
            <li>
              <strong>Meta (Facebook/Instagram)</strong> — eventos de conversão para mensurar campanhas de anúncios. Identificadores (e-mail, telefone, nome) são hashados via SHA-256 antes do envio; o Meta não recebe esses dados em texto puro.
            </li>
            <li>
              <strong>Google (Google Ads + Google Analytics 4)</strong> — eventos de conversão e mensuração de tráfego. E-mail (quando disponível) é enviado em texto puro ao Google, que aplica hash do lado deles antes de qualquer uso (Enhanced Conversions).
            </li>
          </ul>
          <p className="mt-4 text-muted-foreground">
            Nenhum desses parceiros usa seus dados para fins próprios além de prestar o serviço contratado. O compartilhamento com Meta e Google ocorre apenas em eventos específicos (visualização de landing page, conclusão de diagnóstico, agendamento de conversa) — não há rastreamento contínuo da sua navegação para esses parceiros.
          </p>
        </section>

        <section>
          <h2 className="heading-3">5. Seus direitos (LGPD)</h2>
          <p className="mt-3">Você tem direito a:</p>
          <ul className="mt-3 space-y-2 list-disc list-outside pl-6 marker:text-muted-foreground">
            <li>Acessar os dados que temos sobre você.</li>
            <li>Corrigir dados incorretos.</li>
            <li>Solicitar a exclusão dos seus dados.</li>
            <li>Retirar consentimento para envio de newsletter a qualquer momento.</li>
            <li>Saber com quem seus dados foram compartilhados.</li>
          </ul>
          <p className="mt-4">
            Para exercer qualquer direito, envie um e-mail para{" "}
            <a
              className="text-foreground underline decoration-brand decoration-2 underline-offset-4"
              href={`mailto:${siteConfig.email.contact}?subject=LGPD`}
            >
              {siteConfig.email.contact}
            </a>{" "}
            com o assunto <strong>"LGPD"</strong>. Respondemos em até 15 dias úteis.
          </p>
        </section>

        <section>
          <h2 className="heading-3">6. Cookies e tracking</h2>
          <p className="mt-3">
            <strong>Tracking interno (first-party):</strong> registramos
            pageviews, cliques em CTAs e progresso de formulário sob um session
            ID temporário (UUID em sessionStorage, expira ao fechar a aba). Não
            fazemos browser fingerprinting e não armazenamos IP em texto puro.
          </p>
          <p className="mt-3">
            <strong>Tracking de marketing (third-party):</strong> usamos Meta
            Pixel + Conversions API, Google Ads e Google Analytics 4 para
            mensurar campanhas pagas. Esses serviços instalam cookies próprios
            no seu navegador (<code className="font-mono text-sm bg-muted px-1 rounded">_fbp</code>,{" "}
            <code className="font-mono text-sm bg-muted px-1 rounded">_fbc</code>,{" "}
            <code className="font-mono text-sm bg-muted px-1 rounded">_ga</code>,{" "}
            <code className="font-mono text-sm bg-muted px-1 rounded">_gcl_*</code>) com
            duração de até 24 meses. Identificadores pessoais (e-mail, telefone)
            enviados ao Meta são hashados via SHA-256 antes da transmissão.
          </p>
          <p className="mt-3">
            <strong>Como controlar:</strong> respeitamos o sinal{" "}
            <code className="font-mono text-sm bg-muted px-1 rounded">
              navigator.doNotTrack
            </code>{" "}
            do navegador — quando ativado, todo o tracking (interno e
            third-party) é desligado. Você também pode bloquear cookies
            específicos pelas configurações do navegador, ou usar extensões
            como uBlock Origin. Um banner de consentimento granular está
            planejado.
          </p>
        </section>

        <section>
          <h2 className="heading-3">7. Mudanças nesta política</h2>
          <p className="mt-3">
            Esta política pode ser atualizada. A data de "última atualização" no topo sempre reflete a versão atual. Mudanças significativas serão comunicadas via newsletter aos assinantes.
          </p>
        </section>

        <section>
          <h2 className="heading-3">8. Contato</h2>
          <p className="mt-3">
            <a
              className="text-foreground underline decoration-brand decoration-2 underline-offset-4"
              href={`mailto:${siteConfig.email.contact}`}
            >
              {siteConfig.email.contact}
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}
