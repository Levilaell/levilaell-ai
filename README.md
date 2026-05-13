# Levi Lael — Website

Marca Levi Lael (engenharia de automação para escritórios contábeis). Inclui:

- **Home** — sales letter com diagnóstico como protagonista.
- **Diagnóstico** — formulário multi-step (9 perguntas) que dispara análise via Claude e entrega relatório personalizado.
- **LPs específicas** — triagem-documentos, cobranca-automatica, processamento-notas, automacao-contabil.
- **Exemplos públicos** — diagnósticos anonimizados (SEO).
- **Sobre** — equipe + abordagem.
- **Blog** — pilares (IA aplicada, automação, profissionalização) com 3 artigos mock pra preview. Notion via env vars.
- **Newsletter** + **Contato**.

## Stack

- Next.js 16 (App Router) + TypeScript estrito
- Tailwind v4 + shadcn/ui (base-nova) com paleta `zinc-900` + `amber-500`
- Anthropic Claude Sonnet (`@anthropic-ai/sdk`)
- Supabase (Postgres + RLS)
- Resend (e-mails transacionais com templates HTML)
- Notion (`@notionhq/client`) — CMS do blog
- Vercel Analytics
- Zod + react-hook-form pra validação

## Rodando local

```bash
pnpm install
pnpm dev
```

O site **roda sem nenhuma API key**: tudo degrada gracioso pra stubs.

| Ausência | Comportamento |
|---|---|
| `ANTHROPIC_API_KEY` | Análise mock setor-aware é gerada por código. |
| `NEXT_PUBLIC_SUPABASE_*` | Diagnose vive só na sessão (sessionStorage). Form de contato/newsletter logam no console. |
| `RESEND_API_KEY` | E-mails são logados no console com `[stub]`. |
| `NOTION_*` | Blog mostra 3 artigos mock locais (`lib/blog/articles.ts`). |
| `NEXT_PUBLIC_CALCOM_URL` | CTAs de agendamento caem pra `mailto:hello@levilael.com.br`. |

Pra ligar a integração real, copie `.env.example` pra `.env.local` e preencha.

## Estrutura

```
app/
  (site)/                       Rotas com header/footer
    page.tsx                    Home (8 seções)
    diagnosis/
      page.tsx                  Multi-step form
      result/[id]/page.tsx      Relatório (Supabase + sessionStorage fallback)
      examples/[slug]/page.tsx  Exemplos curados
    services/
    about/
    blog/
      page.tsx
      [slug]/page.tsx
      category/[pillar]/page.tsx
    newsletter/
    contact/
  api/
    diagnosis/submit/route.ts   POST: valida → Claude → Supabase + Resend
    diagnosis/[id]/route.ts     GET: lê do Supabase
    newsletter/subscribe
    contact
    notion/webhook              POST: revalida ISR via secret header
  sitemap.ts / robots.ts

components/
  ui/                           shadcn + custom (callout, scheduling-button, section-heading)
  sections/                     Header, Footer, blocos da home
  diagnosis/                    Form, result, fallback, progress
  blog/                         ArticleCard, renderer, sidebar, filters
  forms/                        Newsletter, Contact

lib/
  anthropic.ts                  Claude Sonnet + mock fallback
  supabase.ts                   Anon + service clients
  resend.ts                     Resend wrapper + console fallback
  notion.ts                     Notion client + mock articles
  email-templates.ts            HTML inline (sem deps)
  diagnosis-prompt.ts           Build do prompt
  diagnosis-questions.ts        Defs das 9 perguntas
  diagnosis-storage.ts          localStorage + sessionStorage helpers
  calcom.ts                     CTA env-aware (Cal.com OU mailto)
  site.ts                       siteConfig central
  blog/articles.ts              PILLARS + 3 mock articles

content/examples.ts             3 diagnósticos anonimizados

types/                          diagnosis, blog, forms, supabase

supabase/migrations/0001_init.sql
```

## Próximos passos (sessão seguinte)

1. **Provisionar serviços** e popular `.env.local`:
   - Anthropic API key
   - Supabase project (rodar a migration `0001_init.sql`)
   - Resend (verificar domínio `levilael.com.br`)
   - Notion (criar database "Blog Articles" com props do brief)
2. **Substituir mocks** em `lib/notion.ts` pelo query real do Notion + `react-notion-x`/`notion-to-md` (ou render custom).
3. **Personalizar copy do `/about`** (3 atos) e adicionar foto real.
4. **OG image** branded em `/public/og.png`.
5. **Polish**: dark mode toggle, scroll animations sutis, lighthouse audit.
6. **Deploy** no Vercel + domínio `levilael.com.br`.

## Decisões de design

- **Primary token = `zinc-900`** (charcoal técnico) e **`brand` token customizado = `amber-500`** pros CTAs. `Button variant="brand"` é o atalho.
- **Diagnóstico funciona offline** (stub mock) pra que o site possa ser deployado e validado antes de plugar Claude. A análise mock é setor-aware — produz output diferente pra clínica/e-commerce.
- **Result page é server component** com fallback client-side. Sem Supabase, o link só funciona no mesmo browser (sessionStorage). Com Supabase, é compartilhável.
- **Cal.com via env var** com fallback `mailto:hello@levilael.com.br` — plugue depois sem mexer em código.
- **Notion webhook** valida `x-webhook-secret` ou `?secret=`. Aponte sua automação pro `POST /api/notion/webhook` com body `{ slug, pillar }` pra revalidação cirúrgica.

## Convenções

- Código e nomes em inglês. Copy em pt-BR.
- Conventional Commits.
- `tsc` limpo antes de cada commit. `pnpm build` antes de deploy.
# levilaell-ai
