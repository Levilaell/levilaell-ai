# Validação das correções pós-pivotagem

**Auditor:** Claude (Opus 4.7) — auditoria adversarial independente
**Branch:** `main` · HEAD `3b4b025`
**Data da auditoria:** 2026-05-13
**Escopo:** validar 9 correções declaradas como aplicadas, sem confiar nos relatos.

---

## Sumário executivo

A pivotagem foi **parcialmente** aplicada. O escopo declarado (4 LPs, `/about`, `/services`, footer, calculadoras, ERPs, padronização "conversa") está implementado, com pequenas inconsistências numéricas. **Mas a home pública (`/`), os emails automáticos do diagnóstico (estático em `email-templates.ts` e dinâmico via prompt em `email-followup-ai.ts`), a página de resultado do diagnóstico (`/diagnosis/result/[id]`), a página `/contact` e a página `/newsletter` carregam a narrativa antiga** — bio pessoal em primeira pessoa ("Eu sou Levi Lael", "Engenheiro de operações com IA"), audience "empresas" genérica, CTAs "Agendar call", "comigo". Build e TSC passam limpos. **As 4 LPs estão liberadas pra receber tráfego direcionado. Home, emails do diagnóstico, página de resultado, `/contact` e `/newsletter` precisam dos fixes antes de ligar campanha que possa cair fora das LPs.**

---

## Status por tarefa

### Tarefa 1 — /services eliminada

**Status:** ✅ **OK**

**Evidência:**
- Não existe `app/services/` nem `app/(site)/services/` (`find app -type d -name services` → vazio).
- Redirect 301 em `next.config.ts:5-10`:
  ```ts
  { source: "/services", destination: "/automacao-contabil", permanent: true }
  ```
- Header (`components/sections/header.tsx`) renderiza navegação a partir de `siteConfig.nav` (`lib/site.ts:21-27`): `Diagnóstico`, `Sobre`, `Blog`, `Newsletter`, `Contato`. Sem `Serviços`.
- Footer (`components/sections/footer.tsx:9-33`) tem colunas `Produtos` (Diagnóstico gratuito, Newsletter), `Conteúdo` (Blog, Sobre), `Contato`. Sem `Serviços` e sem "Exemplos de diagnóstico".

**Comentário:** menções a "Serviços" no codebase (`b2b_services`, `b2c_services` em `lib/diagnosis-questions.ts:16,20`, `types/diagnosis.ts:9,13`, `components/admin/leads-table.tsx:9,13`) são tipos de business model no diagnóstico, não link pra página /services. Não conflita.

---

### Tarefa 2 — Footer consistente

**Status:** ✅ **OK**

**Evidência:** `components/sections/footer.tsx:44-48`:
```tsx
<p className="font-semibold text-lg leading-tight">Levi Lael</p>
<p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
  Engenharia de automação para escritórios contábeis. Sistema sob
  medida pro fluxo do seu escritório, não SaaS pronto.
</p>
```

- Descrição bate exatamente com a esperada. ✅
- Sem "para empresas que querem crescer sem inchar a equipe". ✅
- Sem "engenharia de operações com IA". ✅
- Coluna Produtos: Diagnóstico gratuito + Newsletter — sem `Serviços`, sem `Exemplos de diagnóstico`. ✅
- Item de agendamento usa `SchedulingLink` (linha 78), e `SchedulingLink` default em `components/ui/scheduling-button.tsx:161` é `label = "Agendar conversa"`. ✅
- Link do Cal.com usa o mesmo helper do header (`useSchedulingClick` em `components/ui/scheduling-button.tsx`), então é a mesma URL. ✅

---

### Tarefa 3 — Calculadoras matematicamente corretas

#### `/triagem-documentos`

**Status:** ✅ **OK**

**Evidência:** `app/(site)/triagem-documentos/page.tsx:53-65`:
```
- 200 documentos/dia
- 1 minuto cada
- ~73 horas/mês
- R$ 30/h
- Total: R$ 2.200/mês
```
Confere: 200 × 1 × 22 = 4400min = 73,3h. 73 × 30 = R$ 2.190 ≈ R$ 2.200. ✅
Subtitle: "Equivale a um funcionário part-time só fazendo triagem." Sem `× 5 pessoas`. ✅

#### `/cobranca-automatica`

**Status:** ✅ **OK**

**Evidência:** `app/(site)/cobranca-automatica/page.tsx:53-66`:
```
- 30 mensagens/dia, 4 min cada
- 2 horas/dia
- 44 horas/mês
- R$ 35/h (cargo de cobrança — justificativa visível na própria linha)
- Total: R$ 1.540/mês
```
Confere: 30 × 4 = 120 min = 2h. 2 × 22 = 44h. 44 × 35 = R$ 1.540. ✅

#### `/processamento-notas`

**Status:** ✅ **OK**

**Evidência:** `app/(site)/processamento-notas/page.tsx:53-65`:
```
- 200 notas/dia, 3 min cada
- 220 horas/mês
- R$ 30/h
- Total: R$ 6.600/mês
```
Confere: 200 × 3 × 22 = 13.200 min = 220h. 220 × 30 = R$ 6.600. ✅
Subtitle: "Sem contar retrabalho de erro humano (típico em digitação manual)." Sem `5-10% das notas precisam ser corrigidas`. ✅

#### `/automacao-contabil`

**Status:** ⚠️ **Parcial — inconsistência menor entre LPs**

**Evidência:** `app/(site)/automacao-contabil/page.tsx:53-64`:
```
- Triagem: 3h/dia
- Cobrança: 2h/dia
- NF: 10h/dia
- Total: 15h/dia (~330 horas/mês)
```
- Total bate (15 × 22 = 330). ✅
- Sem "17h/dia". ✅

**Inconsistência:** triagem está como **3h/dia** aqui, mas a `/triagem-documentos` mostra **73h/mês = ~3,3h/dia**. Diferença de ~10%, equivalente a R$ 200/mês na conta agregada. Não é catastrófico, mas se um lead atento abrir as duas páginas, percebe que a continha da agregada subestima triagem em ~7h/mês. Cobrança e NF batem (2h/dia × 22 = 44h ≈ valor LP; 10h/dia × 22 = 220h = valor LP).

**Comentário:** o subtitle da agregada diz "Equivale a 2 funcionários full-time só em tarefa manual" — pra 330h/mês isso bate (2 × 176h ≈ 352h). OK.

---

### Tarefa 4 — Promessas de integração ERPs qualificadas

**Status:** ✅ **OK**

Todas as menções a `Domínio, Onvio, Sage, Alterdata, MasterMaq` encontradas no codebase user-facing têm o qualificador "via API ou import automático" ou "API ou import automático":

| Arquivo | Linha | Trecho |
|---|---|---|
| `app/(site)/triagem-documentos/page.tsx` | 94 | "Via API ou import automático. Suporta Domínio, Onvio…" |
| `app/(site)/triagem-documentos/page.tsx` | 121 | "Conectamos com seu ERP via API ou import automático — Domínio…" |
| `app/(site)/processamento-notas/page.tsx` | 94 | "Conecta com seu ERP via API ou import automático. Suporta Domínio…" |
| `app/(site)/automacao-contabil/page.tsx` | 81 | "Via API ou import automático. Suporta Domínio…" |
| `app/(site)/automacao-contabil/page.tsx` | 120 | "Conectamos via API ou import automático. Suporta Domínio…" |
| `app/(site)/about/page.tsx` | 104-106 | "via API ou import automático — Domínio, Onvio, Sage, Alterdata, MasterMaq" |

Nenhuma promessa "plug-and-play" sem qualificação encontrada.

---

### Tarefa 5 — "Agendar call" → "Agendar conversa"

**Status:** ❌ **FALHA — emails de diagnóstico ainda usam "call"**

#### User-facing OK ✅

- `components/ui/scheduling-button.tsx:111,161` — default das funções `SchedulingButton` e `SchedulingLink` é `"Agendar conversa"`.
- `components/sections/header.tsx:52,96` — `label="Agendar conversa"`.
- `components/marketing/lp-v2/lp-hero.tsx:22` — `primaryCtaText = "Agendar conversa"`.
- `components/marketing/lp-v2/lp-dual-cta.tsx:16` — `primaryCtaText = "Agendar conversa"`.
- `components/marketing/lp-v2/lp-author-bio.tsx:26` — `"Agendar conversa de descoberta"`.
- `app/(site)/about/page.tsx:174` — `label="Agendar conversa de descoberta"`.
- `components/diagnosis/diagnosis-result.tsx:30,44,51` — substituiu "call" por "conversa" nos 4 estados (DIY, ainda_nao_e_hora, consultoria_pontual, parceria_continua).
- `components/marketing/lp-v2/lp-dual-cta.tsx:15` — subtitle "Agende uma conversa de 30 minutos".

#### User-facing FALHA ❌

Texto enviado por email pro lead após o diagnóstico (`lib/email-templates.ts:55-78`):

```ts
diy: {
  intro: "Se travar na implementação, te explico o caminho mais curto numa call de 30 min. Sem pitch.",
  button: "Tirar dúvidas em uma call",
},
ainda_nao_e_hora: {
  intro: "Mesmo se automação não é prioridade agora, a gente pode mapear quando vai ser. Sem pitch.",
  button: "Agendar 20 min",
},
consultoria_pontual: {
  intro: "Quer aprofundar esse plano com apoio especializado? Agenda uma call de 30 min sem compromisso.",
  button: "Agendar call gratuita",
},
parceria_continua: {
  intro: "Se faz sentido trabalhar contínuo, a gente alinha escopo, ritmo e custo numa call.",
  button: "Agendar call estratégica",
},
```

- Linha 60: "numa call de 30 min" ❌
- Linha 61: button `"Tirar dúvidas em uma call"` ❌
- Linha 70: "Agenda uma call de 30 min" ❌
- Linha 71: button `"Agendar call gratuita"` ❌
- Linha 75: "numa call" ❌
- Linha 76: button `"Agendar call estratégica"` ❌

Esses CTAs aparecem no email do relatório (`diagnosisReportEmail` em `lib/email-templates.ts:93`) e na página `/diagnosis/result/[id]` — diretamente user-facing.

Também há prompt interno que instrui o LLM a usar "call" — **mesma classe de bug que os templates estáticos acima, porém dinâmico:**
- `lib/email-followup-ai.ts:169` — `"3. Termina com convite suave pra agendar call no link ${ctx.calcomUrl}"` — instrução pra IA gerar o email D+2 do follow-up automático. Esse email vai pra TODO LEAD que completar o diagnóstico. O modelo vai cumprir a instrução literalmente e escrever "call" no output user-facing. O fato de o texto vir dinamicamente do LLM e não de um template estático é irrelevante pro lead que lê o email. **Conta como crítico, não menor.**
- `lib/email-followup-ai.ts:174` reforça "você é o Levi escrevendo" → o LLM escreve em primeira pessoa singular, conflitando com a narrativa de equipe das LPs e do /about.

#### Exceções aceitas ✅

- `lib/tracking/google.ts:107` — `gtag("event", "schedule_call", …)` — nome técnico do evento. OK.
- `app/r/calcom/[id]/route.ts:4` — comentário JSDoc. OK.
- `lib/email-followup-templates.ts:98` — comentário "convite explícito pra call". OK.

---

### Tarefa 6 — Diagnóstico com contagem padronizada

**Status:** ✅ **OK no user-facing** · ⚠️ README desatualizado

**Evidência (visível ao usuário):**
- `app/(site)/diagnosis/page.tsx:16,22` — "Diagnóstico gratuito · 2 minutos" e "Diagnóstico em 2 minutos."
- `app/(site)/automacao-contabil/page.tsx:125` — "Diagnóstico em 2 minutos sobre o seu escritório."
- `components/marketing/lp-v2/lp-dual-cta.tsx:15` — "faça o diagnóstico em 2 minutos."
- `components/sections/home/hero.tsx:24,69` — "em 2 minutos…"
- `components/sections/home/final-cta.tsx:16` — "em 2 minutos."
- `app/(site)/about/page.tsx:183` — "Fazer diagnóstico em 2 min".

Nenhuma menção a "8/9/10 perguntas" no texto visível.

**Caso ambíguo (provavelmente aceitável):**
- `components/diagnosis/diagnosis-progress.tsx:15-17` — renderiza `Pergunta {display}/{total}` durante o fluxo. Mostra `Pergunta 1/10` (são 9 perguntas + 1 lead capture = TOTAL_STEPS 10). Isso é progresso dinâmico durante o formulário, não promessa upfront — interpretação minha é que respeita a Tarefa 6, que era remover divulgação prévia da contagem. Se você quiser ser estrito, esse contador também precisaria sair.

**README desatualizado (não user-facing):**
- `README.md:6` — "(8 perguntas) que dispara análise…"
- `README.md:83` — "Defs das 8 perguntas"

`lib/diagnosis-questions.ts` tem 9 perguntas (q1…q9), conforme `grep -n "id:" lib/diagnosis-questions.ts`. README está defasado tanto na contagem antiga quanto na narrativa nova.

---

### Tarefa 7 — Seção "Equipe" das LPs

**Status:** ✅ **OK**

**Evidência:** `components/marketing/lp-v2/lp-author-bio.tsx` (arquivo inteiro):

```tsx
<p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
  Equipe
</p>
<h2>Engenharia de automação para escritórios contábeis.</h2>
<p>
  Combinamos engenharia técnica (sistemas de IA em produção em fintech
  e automação B2B) com experiência em contabilidade e gestão
  financeira. Sob medida pro fluxo do seu escritório, não SaaS pronto.
  Revisão humana onde importa.
</p>
<LpCalcomCta>Agendar conversa de descoberta</LpCalcomCta>
<LpCtaButton>Fazer diagnóstico</LpCtaButton>
<p>Diagnóstico gratuito sem compromisso. Proposta só se fizer sentido pra você.</p>
```

Checklist:
- Sem "Levi Lael" como nome de pessoa. ✅
- Sem "CaixaHub", "FastDevBuilds". ✅
- Sem stack listada. ✅
- Sem links GitHub/LinkedIn pessoais. ✅
- Sem foto pessoal. ✅
- Linguagem em "nós" / "Combinamos". ✅
- Experiência genérica ("sistemas de IA em produção em fintech e automação B2B") sem nome de projeto. ✅
- 2 CTAs (Agendar conversa de descoberta + Fazer diagnóstico). ✅
- "Diagnóstico gratuito sem compromisso" como reforço. ✅

Componente importado e renderizado nas 4 LPs (`triagem-documentos`, `cobranca-automatica`, `processamento-notas`, `automacao-contabil`).

---

### Tarefa 8 — /about sem vestígios pessoais

**Status:** ✅ **OK**

**Evidência:** `app/(site)/about/page.tsx`:

Checklist:
- Sem "Eu sou Levi Lael" — h1 é "Engenharia de automação para escritórios contábeis." (linha 23). ✅
- Sem primeira pessoa singular ("eu/meu") — usa "construímos", "combinamos", "conduzimos". ✅
- Sem CaixaHub, FastDevBuilds. ✅
- Sem "Python" listado. ✅
- Sem "GPT" (referência a LLMs implícita, não literal). ✅
- Sem links GitHub/LinkedIn pessoais. ✅
- 2 papéis: "Engenharia técnica" (linha 73) + "Acompanhamento comercial" (linha 82). ✅
- "Como começa" com 4 passos (linhas 122-160). ✅
- 2 CTAs no final (Agendar conversa de descoberta + Fazer diagnóstico em 2 min, linhas 173-185). ✅

Observação: linha 20 diz "Sobre a Levi Lael" — usa "Levi Lael" como nome da marca, não em primeira pessoa. Não viola o critério.

---

### Tarefa 9 — Cross-check final de inconsistências

**Status:** ❌ **FALHA — home page não pivotou e tem bio em primeira pessoa**

#### 🚨 Home page (`/`) tem componente `AboutSummary` em primeira pessoa

`components/sections/home/about-summary.tsx`, importado e renderizado em `app/(site)/page.tsx:3,15`. O componente inteiro está em primeira pessoa singular e narrativa antiga:

```tsx
// linha 13-19: foto
<Image src="/og.png" alt="Levi Lael" fill … />

// linha 27
<h2 className="heading-2">Eu sou Levi Lael.</h2>

// linha 30
<p>
  Engenheiro de operações com IA e automação. Construo sistemas que
  automatizam processos repetitivos — em produção, com clientes pagantes,
  sem quebrar.
</p>

// linha 33
<p>
  Eu não vendo "automação". Eu vendo <strong>operação inteligente</strong>…
</p>

// linha 38
<strong>Minha bandeira:</strong>
sua próxima contratação não precisa ser uma pessoa. Precisa ser um sistema.

// linha 45
<TrackedLink href="/about">
  Conheça minha história
  …
</TrackedLink>
```

Tudo "eu/meu/minha" + "Engenheiro de operações" + foto pessoal. Lead que cair em `/` (que é o que vai acontecer com tráfego orgânico de marca, link direto, ou compartilhamento) **vê bio pessoal antes de chegar a qualquer LP de contabilidade**. Choque direto com `/about` reescrito e `LpAuthorBio` em tom de equipe.

#### 🚨 Hero da home não pivotou pra escritórios contábeis

`components/sections/home/hero.tsx`:

```tsx
// linha 13 — eyebrow
<Sparkles … />
Engenharia de operações com IA

// linha 15-22 — h1
<h1>
  Engenharia de operações com IA e automação para empresas que
  querem <span>crescer sem inchar</span> a equipe.
</h1>
```

O h1 explicitamente é "empresas" genéricas + "Engenharia de operações com IA". Tagline antiga, audience errada. Conflita com a especificação "para escritórios contábeis" usada nas LPs e no /about.

#### 🚨 Outros componentes da home com tom antigo

- `components/sections/home/what-i-automate.tsx:51` — `title="O que eu automatizo"` (primeira pessoa singular).
- `components/sections/home/pain-mirroring.tsx:15` — `title="Sua empresa cresceu — mas a operação não acompanhou."` (empresas genéricas).
- `components/sections/home/final-cta.tsx:16` — "A maioria das empresas perde 15 a 30 horas por semana…" (empresas genéricas).
- `components/sections/home/how-diagnosis-works.tsx` — inspecionado: sem primeira pessoa, sem audience errada explícita. Usa "conversa" no step 4 (linha 22). ✅ OK.
- `components/sections/home/recent-content.tsx` — inspecionado: eyebrow/título são "Conteúdo recente / Insights práticos sobre IA, automação e profissionalização de operações" — audience neutra (não "escritórios contábeis"), mas é seção de blog, então aceitável. Sem primeira pessoa. ✅ OK.

#### 🚨 `diagnosis-result.tsx` ainda tem "comigo" (primeira pessoa singular)

`components/diagnosis/diagnosis-result.tsx:34`:
```ts
ainda_nao_e_hora: {
  eyebrow: "Conversa exploratória",
  title: "Quer pensar isso comigo?",
  …
}
```

Outros estados foram convertidos pra plural ("Te explicamos", "Oferecemos") — o `ainda_nao_e_hora` ficou com "comigo". Inconsistência interna do mesmo arquivo. O resto do arquivo (linhas 80-352, estrutura JSX renderizando o `analysis`) está OK — não tem outras ocorrências de primeira pessoa ou "call".

#### 🚨 `contact/page.tsx:44-45` tem primeira pessoa singular

`app/(site)/contact/page.tsx:44-46`:
```tsx
<p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
  30min de conversa técnica — não é pitch comercial. Se eu não for a
  melhor pessoa pro seu caso, te indico quem é.
</p>
```

"Se **eu** não for a melhor pessoa…" — primeira pessoa singular numa página user-facing (link "Contato" no header e footer). Mesma classe de bug que `/about` e `LpAuthorBio` que foram convertidos pra "nós". O resto da página de contato está OK (CTA usa `SchedulingButton` com label "Agendar conversa de 30min", h1 é neutro "Vamos conversar.", subtítulo neutro).

#### 🚨 `newsletter/page.tsx` tem 3 primeiras pessoas singulares

`app/(site)/newsletter/page.tsx`:
- Linha 14: `"Cases reais (anonimizados) de operações que automatizei"`
- Linha 15: `"Frameworks de decisão que uso com clientes"`
- Linha 62-64: `"Ao assinar, você recebe imediatamente o framework em PDF de 12 páginas que uso com meus clientes pra mapear oportunidades de automação."`

Newsletter está linkada no header (`siteConfig.nav`) e no footer (coluna Produtos). Mesma classe de bug — primeira pessoa singular em UI pública. Audience também é genérica ("IA, automação ou profissionalização"), não escritórios contábeis, mas isso é aceitável porque newsletter é cross-vertical.

#### ⚠️ Exemplos de diagnóstico não cobrem escritórios contábeis

`content/examples.ts` define 3 exemplos: clínicas-pequenas-saude, agencias-marketing-em-crescimento, ecommerces-faturando-100k-mes. Nenhum escritório contábil. Não é footer-linked (linha "Exemplos de diagnóstico apontando pra clínicas" da spec se referia provavelmente ao link antigo do footer — esse foi removido), mas as URLs `/diagnosis/examples/<slug>` continuam vivas (renderizadas no build em `app/(site)/diagnosis/examples/[slug]/page.tsx`). Lead curioso que pesquisar "exemplos diagnóstico Levi Lael" pode cair lá e ver caso de clínica, não de contabilidade.

#### ⚠️ Prompts LLM internos ainda referenciam CaixaHub / FastDevBuilds / "engenheiro de operações"

Não são UI direta, mas o output destes prompts vai pro user-facing:

- `lib/admin-prompts/blog.ts:71-78` — sistema do gerador de artigos do blog: "Você é Levi Lael, engenheiro de operações com IA e automação. Construiu CaixaHub… Construiu FastDevBuilds…" → todo artigo novo gerado pelo admin pipeline pode mencionar esses projetos.
- `lib/admin-prompts/x.ts:51-58` — sistema do gerador de posts X — mesma coisa.
- `lib/diagnosis-prompt.ts:71` — "Uma pessoa acabou de fazer um diagnóstico no site de Levi Lael (engenheiro de operações com IA)" → contexto que a IA usa pra escrever o relatório do diagnóstico. Pode vazar pra dentro do output.
- `lib/email-followup-ai.ts:149` — "site de Levi Lael (engenheiro de operações com IA)" + linha 169 "convite suave pra agendar call".

#### ⚠️ Outros vestígios menores

- `lib/email-followup-templates.ts:64` — "agenda 30 min comigo" (primeira pessoa singular, user-facing por email).
- `app/unsubscribe/[token]/page.tsx:78` — "conversar comigo" (primeira pessoa singular, página user-facing).
- Templates de email-followup todos assinados "— Levi Lael" — provavelmente intencional (é o remetente), não conflita.

#### Itens da spec que checaram OK

- Nenhuma ocorrência de "engenheiro full-stack" em texto user-facing.
- "IA em produção" não aparece sem qualificação no LpAuthorBio nem no /about (`sistemas de IA em produção em fintech e automação B2B` qualifica com domínios concretos).
- Tracking event ainda é `schedule_call` em `lib/tracking/google.ts:107` — nome técnico, OK manter; a UI fala "Agendar conversa" → divergência entre UI e nome técnico é aceitável conforme a spec.

---

## Validações técnicas

| Check | Status | Evidência |
|---|---|---|
| `npx tsc --noEmit` | ✅ | exit 0 |
| `npm run build` | ✅ | "✓ Compiled successfully in 4.2s" · 32/32 static pages |
| Rota `/services` | ✅ | Redirect 301 configurado em `next.config.ts:5-10` (não testei runtime — só conf) |
| Rotas `/triagem-documentos`, `/cobranca-automatica`, `/processamento-notas`, `/automacao-contabil`, `/about` | ✅ | Listadas como `○ (Static)` no output do build, geradas com sucesso |
| Bundle órfão | ✅ | Sem imports não resolvidos (build não warn-ou) |

**Observação fora do escopo:** `npx tsc --noEmit` rodou silenciosamente sem nenhum output (exit 0). Build com Turbopack passou em 4.2s. Sem warnings de lint relevantes.

---

## Problemas críticos encontrados

Em ordem de impacto pra ligar campanha:

1. **🚨 Home (`/`) ainda está em primeira pessoa + audience genérica.** `components/sections/home/about-summary.tsx` (rendered em `app/(site)/page.tsx:15`) e `components/sections/home/hero.tsx` carregam a narrativa antiga ("Eu sou Levi Lael", "Engenheiro de operações com IA", "empresas que querem crescer"). `WhatIAutomate` (linha 51 "O que eu automatizo"), `PainMirroring` e `FinalCTA` reforçam o tom "empresas" genérico. Lead que entrar em `levilael.com.br/` antes de qualquer LP vê isso. Inconsistência mata credibilidade da pivotagem.

2. **🚨 Emails do diagnóstico ainda dizem "Agendar call" — estático E dinâmico.**
   - Estático: `lib/email-templates.ts:60-76` tem 6 ocorrências de "call" em CTAs e intros do email de relatório do diagnóstico (botões "Agendar call gratuita", "Agendar call estratégica", "Tirar dúvidas em uma call" + 3 intros).
   - Dinâmico: `lib/email-followup-ai.ts:169` instrui o LLM a "Termina com convite suave pra agendar call no link" — esse prompt gera o email D+2 do follow-up automático, então toda nova mensagem replica "call" no output user-facing. Linha 174 ainda força "você é o Levi escrevendo" → primeira pessoa singular.
   - Esses emails são as primeiras interações assíncronas após o diagnóstico — bater "conversa" no site e "call" no email é vacilo perceptível e bate em todo lead, não só amostra.

3. **🚨 `diagnosis-result.tsx:34` tem "comigo" num dos 4 estados de CTA.** Estado `ainda_nao_e_hora` ficou inconsistente com os outros 3 (que foram convertidos pra "Te explicamos / Oferecemos"). Página `/diagnosis/result/[id]` é onde o lead chega após submeter — mensagem central da entrega.

4. **🚨 `contact/page.tsx:44-45` tem "Se eu não for a melhor pessoa pro seu caso, te indico quem é"** — primeira pessoa singular numa página user-facing linkada no header e footer. Mesma classe de bug que `/about` e `LpAuthorBio` que foram convertidos pra "nós".

5. **🚨 `newsletter/page.tsx` tem 3 primeiras pessoas singulares** (linhas 14, 15, 62-64): "operações que automatizei", "Frameworks que uso com clientes", "uso com meus clientes". Página linkada no header e footer (coluna Produtos).

6. **⚠️ Inconsistência aritmética entre `/triagem-documentos` (3,3h/dia ≈ 73h/mês) e `/automacao-contabil` (3h/dia).** ~10% off na linha de triagem da agregada. Pequeno, mas detectável.

## Problemas menores encontrados

- `README.md` ainda diz "8 perguntas" (são 9 desde a última edição em `lib/diagnosis-questions.ts`).
- `lib/admin-prompts/blog.ts:71-78` e `lib/admin-prompts/x.ts:51-58` — prompts do gerador de blog e X ainda dizem "engenheiro de operações com IA" e "Construiu CaixaHub / FastDevBuilds". Todo artigo novo gerado pelo admin pipeline arrasta a narrativa antiga.
- `lib/diagnosis-prompt.ts:71` — prompt interno do LLM para o diagnóstico ainda diz "site de Levi Lael (engenheiro de operações com IA)". (Linha 169 do `email-followup-ai.ts` foi promovida pra crítico — ver Item 2.)
- `lib/email-followup-templates.ts:64` e `app/unsubscribe/[token]/page.tsx:78` — "comigo" em primeira pessoa singular (email D+4 e página de unsubscribe). Coerente com a posição "Levi Lael assina os emails", mas inconsistente com /about em equipe.
- `content/examples.ts` — exemplos de diagnóstico cobrem clínicas, agências de marketing, e-commerces. Nenhum escritório contábil. URLs `/diagnosis/examples/<slug>` estão vivas no build.
- `components/diagnosis/diagnosis-progress.tsx:15-17` — UI durante o formulário mostra `Pergunta X/10`. Aceitável como progresso dinâmico, mas se o critério for estrito ("nunca mencionar número específico"), também precisa sair.
- Tracking event `schedule_call` em `lib/tracking/google.ts:107` — coerente com a exceção da spec (nomes técnicos), só registro pra ficar consciente.

## Surfaces auditadas mas sem achados

Pra constar que o audit cobriu (e nem tudo virou achado):

- `components/sections/home/how-diagnosis-works.tsx` — passos do "como funciona" da home. Sem primeira pessoa, sem audience errada. Step 4 usa "agenda uma conversa" (linha 22). ✅
- `components/sections/home/recent-content.tsx` — seção de blog na home. Sem primeira pessoa. Audience é cross-vertical ("IA, automação e profissionalização de operações"), aceitável pra blog. ✅
- `components/diagnosis/diagnosis-result.tsx` linhas 80-352 — toda a estrutura JSX do relatório. Sem primeira pessoa, sem "call". O único problema é na constante `ctaByApproach.ainda_nao_e_hora` (linha 34, já listada como crítico). ✅ (resto do arquivo)
- `lib/pdf/diagnosis-report.tsx` — PDF anexo no email do diagnóstico (commit `9eacf1d`). Sem primeira pessoa, sem "call", sem "engenheiro de operações". CTA do PDF (linha 327-328) usa "agende uma conversa técnica de 30min — sem pitch". ✅

## Recomendação final

**LPs estão liberadas. Home, emails do diagnóstico, página de resultado, `/contact` e `/newsletter` — não.**

As 4 LPs específicas (`/triagem-documentos`, `/cobranca-automatica`, `/processamento-notas`, `/automacao-contabil`) e `/about` estão consistentes entre si e podem receber tráfego direcionado — se o anúncio bater direto numa URL dessas, o lead vê a narrativa nova de ponta a ponta. **Pode ligar campanha pra essas LPs hoje.**

O gating é o fluxo periférico: (a) lead que cair em `/` vê bio pessoal em primeira pessoa e audience "empresas" genérica, (b) lead que completar o diagnóstico recebe email com botão "Agendar call gratuita" (estático) e D+2 dias depois recebe outro email com "call" gerado pelo LLM, (c) lead que chegar na `/diagnosis/result/[id]` no estado `ainda_nao_e_hora` lê "Quer pensar isso comigo?", (d) lead que clicar em "Contato" no header lê "Se eu não for a melhor pessoa…", (e) lead que clicar em "Newsletter" lê "operações que automatizei / uso com meus clientes". Esses 5 são choque direto com a entrega das LPs.

Os 5 problemas críticos são pontuais — cirurgia em copy, não reescrita estrutural. **Fechar os 5 antes de ligar campanha que possa cair fora das LPs específicas.** O resto (inconsistência 73h vs 3h/dia, prompts admin, examples não-contábeis, README desatualizado) pode esperar pós-lançamento.

### Punch list pra fechar antes da campanha

1. `components/sections/home/about-summary.tsx` — reescrever em "nós" ou remover do `app/(site)/page.tsx:15`.
2. `components/sections/home/hero.tsx` — pivotar copy pra escritórios contábeis (ou manter cross-vertical mas tirar "Engenharia de operações com IA" + primeira pessoa singular do tom geral). Adjacente: `what-i-automate.tsx` (heading), `pain-mirroring.tsx` (audience), `final-cta.tsx` (audience).
3. `lib/email-templates.ts:60-76` — trocar "call" → "conversa" nos 4 CTAs (`diy`, `ainda_nao_e_hora`, `consultoria_pontual`, `parceria_continua`).
4. `lib/email-followup-ai.ts:169` — trocar "agendar call" → "agendar conversa" na instrução do LLM. (E avaliar se a linha 174 "você é o Levi escrevendo" deveria virar "você é a equipe escrevendo" pra alinhar com /about.)
5. `components/diagnosis/diagnosis-result.tsx:34` — substituir "Quer pensar isso comigo?" por algo em plural ("Quer pensar isso com a gente?" ou equivalente).
6. `app/(site)/contact/page.tsx:44-45` — reescrever "Se eu não for a melhor pessoa…" em plural.
7. `app/(site)/newsletter/page.tsx:14, 15, 62-64` — converter as 3 ocorrências de primeira pessoa singular pra "nós".
