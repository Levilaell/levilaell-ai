# Auditoria de veracidade — site Levi Lael

**Escopo:** todas as LPs ativas (`/triagem-documentos`, `/cobranca-automatica`, `/processamento-notas`, `/automacao-contabil`), home `/`, `/about`, `/services`, `/privacy`, footer e `/blog` (estrutura).
**Não modificado:** nenhum arquivo. Esta auditoria é só de identificação.
**Data:** 2026-05-13.

---

## 1. Sumário executivo

A maior parte do conteúdo é verificável e razoavelmente honesto. Os problemas se concentram em três frentes:

1. **Voz inconsistente entre páginas:** `/about` e a home falam em primeira pessoa singular ("Eu sou Levi", "eu construo"). As 4 LPs falam em primeira pessoa plural ("Combinamos", "Te ajudamos"). O usuário diz que tem sócio comercial — então o plural é tecnicamente verdadeiro, mas nada no site apresenta esse sócio. O visitante que pula do `/about` pra uma LP percebe.
2. **Números inventados ou inconsistentes entre LPs:** a calculadora de `/triagem-documentos` tem erro aritmético (200 doc/dia × 1 min ≠ 33h/mês), e o "5h/dia" de triagem em `/automacao-contabil` contradiz a própria conta da LP específica. Várias métricas (15-30h por semana, 5-10% de retrabalho, 95-98% de precisão) são afirmadas sem fonte.
3. **Referências a CaixaHub e FastDevBuilds no `/about` ancoram a credibilidade técnica em projetos pessoais alheios à operação Levi Lael.** Não é mentira (são experiências reais), mas a frase "sistemas de IA em produção em fintech e automação B2B" reaparece nas LPs como se fosse experiência aplicada à contabilidade — não é.

A LP `/cobranca-automatica` é a única com cálculo internamente coerente (30 msg × 4 min = 2h/dia × 20 dias ≈ 40h/mês). As outras precisam de revisão.

---

## 2. Lista por página

### PÁGINA: `/` (home)

[Localização: hero — eyebrow]
**Afirmação:** "Engenharia de operações com IA"
**Categoria:** A
**Comentário:** OK, é a descrição da operação.

[Localização: hero — h1]
**Afirmação:** "Engenharia de operações com IA e automação para empresas que querem crescer sem inchar a equipe."
**Categoria:** D
**Comentário:** Promessa de resultado ("crescer sem inchar"). Aceitável como posicionamento, mas é tese, não fato comprovado.

[Localização: hero — sub]
**Afirmação:** "Faça o diagnóstico gratuito e descubra, em 2 minutos, onde sua operação está perdendo tempo, dinheiro e oportunidades — com uma análise gerada por IA personalizada para o seu negócio."
**Categoria:** D
**Comentário:** O diagnóstico EXISTE e gera análise via Anthropic — verdade. "2 minutos" é o tempo médio declarado; depende do usuário. "Personalizada" é defensável (prompt usa as respostas).

[Localização: hero — DiagnosisPreview]
**Afirmação:** Mock visual mostra "DIAGNÓSTICO · Q1/8" (8 perguntas)
**Categoria:** B
**Comentário:** A política de privacidade diz "9 perguntas". Conferir contagem real no `/diagnosis` e harmonizar — uma das duas está errada.

[Localização: pain-mirroring]
**Afirmação:** "Sua equipe vive apagando incêndio…" / "Tarefas repetitivas comem horas…" / "Decisões dependem de você porque os dados estão espalhados"
**Categoria:** G
**Comentário:** Linguagem de espelhamento de dor, vaga por design. OK.

[Localização: about-summary]
**Afirmação:** "Construo sistemas que automatizam processos repetitivos — em produção, com clientes pagantes, sem quebrar."
**Categoria:** E
**Comentário:** "Com clientes pagantes" precisa lastro. O `/about` cita CaixaHub ("cheguei a ter clientes pagantes antes de pausar a operação") — então é verdadeiro como referência a projeto anterior. Mas na home, sem contexto, soa como "tenho clientes hoje". A operação Levi Lael não tem clientes ainda.

[Localização: about-summary]
**Afirmação:** "minha bandeira: sua próxima contratação não precisa ser uma pessoa. Precisa ser um sistema."
**Categoria:** G
**Comentário:** Slogan. OK.

[Localização: how-diagnosis-works]
**Afirmação:** "8 perguntas estratégicas sobre sua operação atual"
**Categoria:** B
**Comentário:** Conflita com o "9 perguntas" da `/privacy`. Verificar fonte da verdade.

[Localização: how-diagnosis-works]
**Afirmação:** "análise feita por modelo especializado em consultoria"
**Categoria:** G
**Comentário:** "Modelo especializado em consultoria" é frase vaga. É Claude com prompt customizado — não um modelo fine-tuned. Tecnicamente ambíguo, beira o exagero. Revisar.

[Localização: how-diagnosis-works]
**Afirmação:** "estimativa de retorno"
**Categoria:** D
**Comentário:** O relatório promete estimativa de ROI. Conferir se o prompt do diagnóstico de fato produz isso de forma confiável — se não, é promessa que não sustenta.

[Localização: what-i-automate]
**Afirmação:** "6 categorias de problema. Centenas de combinações possíveis."
**Categoria:** G
**Comentário:** "Centenas" é hipérbole inofensiva. OK.

[Localização: faq]
**Afirmação:** "Automações pontuais começam em R$ 2.500. Sprints de IA dedicados ficam em R$ 7.500. Trabalho contínuo como desenvolvedor dedicado, R$ 5.000/mês."
**Categoria:** A
**Comentário:** Bate com `/services`. OK.

[Localização: final-cta]
**Afirmação:** "A maioria das empresas perde 15 a 30 horas por semana em tarefas que software já deveria resolver."
**Categoria:** C
**Comentário:** Número específico sem fonte. "A maioria das empresas" e "15 a 30 horas/semana" são afirmações fortes. De onde vem essa faixa? Pesquisa? Chute educado? Marcar.

---

### PÁGINA: `/about`

[Localização: hero]
**Afirmação:** "Engenheiro de operações com IA e automação. Tradutor profissional de caos em sistema."
**Categoria:** A
**Comentário:** Posicionamento. OK.

[Localização: Ato 1]
**Afirmação:** "Em 2023 entrei como estagiário numa agência, fazendo HTML e CSS pra clientes."
**Categoria:** E
**Comentário:** Verificável só pelo próprio usuário. Se for verdade, OK.

[Localização: Ato 2]
**Afirmação:** "Em 2024 saí pra construir coisas próprias. Comecei com pipelines de conteúdo automatizados — sistemas que geravam vídeos longos e artigos completos sem intervenção humana, com controle de custo por execução."
**Categoria:** E
**Comentário:** Histórico do usuário. Verificável só pelo próprio. Se real, OK.

[Localização: Ato 2]
**Afirmação:** "Em 2025 levei isso pro mercado: construí o CaixaHub, um SaaS financeiro pra PMEs brasileiras que integrava com 100+ bancos via Open Finance. Sozinho. Webhook handlers com retry exponencial, OCR de boleto com revisão humana, motor de categorização que aprendia com cada correção. Cheguei a ter clientes pagantes antes de pausar a operação."
**Categoria:** E
**Comentário:** Afirmação forte. "100+ bancos via Open Finance" — Open Finance Brasil hoje cobre muito mais que 100 instituições, então plausível. "Clientes pagantes antes de pausar" — verificável só pelo próprio. Se real, OK. **Risco principal:** essa é experiência de outra operação (CaixaHub), e visitantes da LP contábil podem assumir que se aplica diretamente ao seu mundo — não se aplica.

[Localização: Ato 3]
**Afirmação:** "Hoje, com a FastDevBuilds, construo sistemas que automatizam prospecção B2B de ponta a ponta — descoberta de leads, qualificação por IA, abordagem personalizada, geração de demos de site em menos de 90 segundos. Tudo com controle de custo unitário e arquitetura que aguenta volume real."
**Categoria:** E
**Comentário:** FastDevBuilds é operação separada (confirmado pelo brief). Mencioná-la na biografia do site Levi Lael cria ambiguidade: o leitor não entende se Levi Lael presta serviços ou se é vitrine pra outra empresa. "Arquitetura que aguenta volume real" e "0 clientes fechados" coexistem mal — o usuário disse no brief que FastDevBuilds tem 0 clientes fechados. Verificar consistência.

[Localização: Ato 3]
**Afirmação:** "ofereço algo diferente pro mercado: empresas que querem IA em produção, não em apresentação."
**Categoria:** D
**Comentário:** Diferenciação. OK como discurso.

[Localização: Stack principal]
**Afirmação:** Lista: "n8n, Python, Node.js, APIs REST, LLMs (Claude, GPT), Supabase, PostgreSQL"
**Categoria:** F
**Comentário:** **Não há Python no repositório deste site.** O brief diz que stack real é n8n + Next.js + Supabase + Anthropic + Resend + Vercel + Notion. Se Python é usado em projetos de cliente (n8n custom nodes, scripts externos), tudo bem. Se nunca foi usado, é stack inflado. Validar. Note ainda: "GPT" listado nas LLMs — o site usa só Anthropic (Claude). Se Levi nunca usou GPT em produção, remover.

[Localização: Manifesto]
**Afirmação:** "Vejo todo dia empresas contratando pessoas pra resolver problemas que software resolveria em 2 semanas."
**Categoria:** G
**Comentário:** Hipérbole retórica do manifesto. OK.

[Localização: Manifesto]
**Afirmação:** "a empresa que automatizou está faturando o dobro com metade da equipe"
**Categoria:** D
**Comentário:** Afirmação genérica sobre futuro — sem garantia, sem dado, mas legível como tese de marketing. Tolerável.

---

### PÁGINA: `/triagem-documentos`

[Localização: hero]
**Afirmação:** "Sua equipe gasta horas todo dia fazendo triagem de documentos."
**Categoria:** D
**Comentário:** Premissa do público-alvo. OK.

[Localização: hero — sub]
**Afirmação:** "Sistema sob medida para automatizar a triagem de notas, recibos e contratos. Construído pro fluxo específico do seu escritório, com revisão humana onde faz diferença."
**Categoria:** A
**Comentário:** Descreve o que se oferece. OK.

[Localização: impact-calculator]
**Afirmação:** "200 documentos por dia × 1 minuto = 33 horas/mês por funcionário"
**Categoria:** C — **ERRO ARITMÉTICO**
**Comentário:** 200 doc × 1 min = 200 min/dia = 3,33 h/dia. Mensal (22 dias úteis): ~73 h/mês. "33 horas/mês" só fecharia se fossem ~90 doc/dia ou 200 doc/dia × ~0,45 min. **A conta não fecha.** O total R$ 4.950 = 33 × 30 × 5 está consistente internamente, mas o input "200 documentos × 1 minuto" não gera 33h. Pior: o card de `/automacao-contabil` cita "Triagem documentos: 5h/dia" para o mesmo problema, o que daria ~100h/mês por pessoa — também não bate. **Conflito interno entre as duas LPs.**

[Localização: impact-calculator — subtitle]
**Afirmação:** "Não é palpite. É matemática."
**Categoria:** C
**Comentário:** Ironicamente, a matemática está errada (ver acima).

[Localização: how-it-works — passo 2]
**Afirmação:** "Cada correção sua melhora a próxima categorização. Sistema fica mais preciso ao longo do tempo."
**Categoria:** D
**Comentário:** Promete aprendizado contínuo. Sustentável SE o sistema implementar few-shot/RAG com exemplos corrigidos, ou fine-tuning. É factível tecnicamente, mas vira promessa que precisa estar na proposta. Confirmar que o template padrão de implementação inclui esse loop.

[Localização: how-it-works — passo 4]
**Afirmação:** "Funciona com Domínio, Onvio, Sage, Alterdata."
**Categoria:** B
**Comentário:** **Crítico verificar.** Domínio (Thomson Reuters) tem APIs limitadas e na maioria das integrações o caminho é importação de arquivo. Onvio idem. Sage tem API pública. Alterdata historicamente é integração via arquivo/SQL local. **Nenhum ERP contábil brasileiro de mercado tem API REST aberta no padrão "plug-and-play".** Em todos os casos, a integração existe mas é por arquivo, banco local, ou parceria com revenda. Promessa "funciona com" precisa ser entendida pelo cliente como "consigo integrar via os meios que o sistema oferece" — caso contrário vira frustração na entrega.

[Localização: how-it-works — passo 4]
**Afirmação:** "Os documentos triados entram direto no seu fluxo atual."
**Categoria:** D
**Comentário:** "Direto" é palavra forte. Quase nunca é literalmente direto — quase sempre é via arquivo intermediário, pasta watch, ou import scheduling. Suavizar a expectativa.

[Localização: author-bio]
**Afirmação:** "Combinamos engenharia técnica (sistemas de IA em produção em fintech e automação B2B) com experiência em contabilidade e gestão financeira."
**Categoria:** E
**Comentário:** Múltiplos problemas:
- **"Combinamos"** assume time. O `/about` é primeira pessoa singular ("Eu sou Levi"). Visitante percebe a inconsistência. Brief confirma 2 sócios mas eles não são apresentados em lugar nenhum.
- **"Sistemas de IA em produção em fintech"** = CaixaHub. Mas CaixaHub está descrito no `/about` como "pausado". "Em produção" no presente é exagero — foi em produção, com clientes, agora não. Verbo no passado ("já levamos") seria mais honesto.
- **"Automação B2B"** = FastDevBuilds. Brief diz 0 clientes fechados ainda — então "em produção" é forte.
- **"Experiência em contabilidade e gestão financeira"** — de onde vem? CaixaHub era SaaS financeiro pra PMEs, não escritório contábil. Se o sócio comercial tem essa background, perfeito — mas o site nunca menciona o sócio.

[Localização: faq — preço]
**Afirmação:** "Projetos começam em R$ 5.000 e vão até R$ 25.000"
**Categoria:** A
**Comentário:** Faixa de preço — `/services` é mais granular (R$ 2.500 pontual / R$ 7.500 sprint / R$ 5.000/mês dedicado). Faixa "5k a 25k" pode confundir vs `/services`. Não é falso, mas pode ser inconsistente — verificar.

[Localização: faq — prazo]
**Afirmação:** "Sprint de 2-4 semanas pra primeiro fluxo rodando."
**Categoria:** D
**Comentário:** Prazo agressivo. Para triagem com OCR + categorização + integração ERP em 2-4 semanas é factível só com escopo bem restrito. Sustentável se houver disciplina de escopo no fechamento.

---

### PÁGINA: `/cobranca-automatica`

[Localização: hero]
**Afirmação:** "Sua equipe manda 30 vezes a mesma mensagem por dia. Automatize."
**Categoria:** D
**Comentário:** Premissa. OK.

[Localização: hero — sub]
**Afirmação:** "Sistema que conhece o histórico de cada cliente, escala lembretes e para automaticamente quando o cliente responde."
**Categoria:** D
**Comentário:** Promessa de capacidade. Factível tecnicamente. OK se a entrega cobrir.

[Localização: impact-calculator]
**Afirmação:** "30 mensagens × 4 minutos = 2h/dia = 40h/mês = R$ 1.400"
**Categoria:** C
**Comentário:** 30 × 4 = 120 min = 2h/dia. × 20 dias = 40h/mês. R$ 35 × 40 = R$ 1.400. **Conta fecha.** Único reparo: "4 minutos por mensagem" parece alto pra mensagem repetida (copy + cola + ajuste leva ~30s). Defensável se inclui o tempo de buscar o cliente certo, lembrar do contexto, etc. Mas "4 minutos" é um número específico que precisa de fonte — pesquisa interna, conversa com cliente, observação?

[Localização: how-it-works — passo 1]
**Afirmação:** "Sistema sabe quais documentos cada cliente já entregou e quais ainda faltam. Não precisa você dizer."
**Categoria:** D
**Comentário:** Depende de integração com o sistema de controle do escritório. Possível mas exige integração real — não é "ligar e funcionar". Validar na proposta.

[Localização: how-it-works — passo 3]
**Afirmação:** "Cliente formal recebe mensagem formal. Cliente próximo recebe mensagem casual."
**Categoria:** D
**Comentário:** Adaptação de tom por cliente. Factível com LLM mas exige metadado por cliente. Se o sistema sugerir tom automaticamente, é defensável. Se for o escritório configurar manualmente, "adapta" é forte — é o escritório que adapta.

[Localização: faq — WhatsApp Business API]
**Afirmação:** "Custo varia conforme volume (R$ 0,05-0,15 por mensagem em geral)."
**Categoria:** C
**Comentário:** A precificação real da WhatsApp Business API depende de categoria de conversa (marketing/utility/auth/service) e país. Em 2025-2026 a Meta cobra por sessão de 24h, não por mensagem. Faixa R$ 0,05-0,15 está plausível para sessões de utility no Brasil, mas a forma de cobrança ("por mensagem") está desatualizada. Risco de cliente reclamar quando ver a fatura real.

[Localização: faq — aprovação]
**Afirmação:** "aprovação do número Business, que demora 5-15 dias."
**Categoria:** C
**Comentário:** Aprovação via BSP costuma ser 1-3 dias úteis hoje (2026). "5-15 dias" parece conservador / desatualizado.

---

### PÁGINA: `/processamento-notas`

[Localização: impact-calculator]
**Afirmação:** "200 notas × 3 min = 10h/dia = 200h/mês = R$ 6.000"
**Categoria:** C
**Comentário:** 200 × 3 = 600 min = 10h/dia. × 20 dias = 200h/mês. R$ 30 × 200 = R$ 6.000. **Conta fecha (com 20 dias úteis).** Único ponto: "200 notas/dia" pra um escritório médio é um volume razoável, mas precisa lastro — vem de observação? Estatística setorial?

[Localização: impact-calculator — subtitle]
**Afirmação:** "em média 5-10% das notas precisam ser corrigidas"
**Categoria:** C
**Comentário:** Número específico sem fonte. De onde vem essa faixa? Soa razoável mas é chute. Marcar.

[Localização: faq — precisão]
**Afirmação:** "Tipicamente 95-98% em notas digitais estruturadas. 90-95% em escaneadas."
**Categoria:** C
**Comentário:** **Sem base.** A operação não tem casos de produção (sem clientes ainda). Esses números vêm de benchmarks de modelos OCR? Da Anthropic? De pesquisa do mercado? Se for "estimativa baseada em capacidades dos modelos atuais", precisa estar claro. Senão, é número fabricado.

[Localização: faq — precisão humana]
**Afirmação:** "Comparado a 90-95% de precisão humana"
**Categoria:** C
**Comentário:** "90-95% de precisão humana em digitação de NF" — também sem fonte. Pode estar correto, pode não estar.

[Localização: faq — custo unitário]
**Afirmação:** "Em médias de mercado: R$ 0,10-0,30 por nota processada."
**Categoria:** C
**Comentário:** "Médias de mercado" — qual mercado? Não há mercado consolidado de "processamento automático de NF" com média pública. Inventado ou estimado por custo Anthropic/OCR.

---

### PÁGINA: `/automacao-contabil`

[Localização: impact-calculator]
**Afirmação:** "Triagem 5h/dia + Cobrança 2h/dia + Notas 10h/dia = 17h/dia. Equivale a 2 funcionários full-time. Total mensal: ~340 horas."
**Categoria:** C
**Comentário:** 17 × 20 = 340h. Conta interna fecha. **Mas:**
- Triagem "5h/dia" CONFLITA com `/triagem-documentos` (que afirma 33h/mês = ~1,5h/dia, ou ~3,3h/dia se você seguir o cálculo correto). Inconsistência clara entre as LPs.
- Cobrança "2h/dia" bate com `/cobranca-automatica` (40h/mês = 2h/dia × 20 dias). OK.
- Notas "10h/dia" bate com `/processamento-notas`. OK.
- "Equivale a 2 funcionários full-time" — 17h/dia ÷ 8h = 2,1 FTE. OK aritmeticamente, mas o cálculo trata as três tarefas como podendo ser feitas em paralelo por dois FTE, o que pressupõe que cada um tem skill pra todas as três. Tolerável como métrica de marketing.

[Localização: how-it-works — passo 2]
**Afirmação:** "Domínio, Onvio, Sage, Alterdata, MasterMaq. Sistema soma ao que você já usa, não substitui."
**Categoria:** B
**Comentário:** Mesma observação de `/triagem-documentos`: cada um desses ERPs tem caminho próprio de integração, raramente API REST limpa. **MasterMaq aqui aparece pela primeira vez** (não está nas outras LPs). Inconsistência menor. E especificamente o MasterMaq é conhecido por ser fechado — integração é por banco local Firebird ou export. Vale conferir se Levi já fez integração real com MasterMaq.

[Localização: how-it-works — passo 4]
**Afirmação:** "Suporte direto com a equipe técnica. Não tem fila de suporte."
**Categoria:** A
**Comentário:** Para uma operação de 2 pessoas, isso é literalmente verdadeiro. OK.

[Localização: faq — diagnóstico]
**Afirmação:** "10 perguntas em 2 minutos"
**Categoria:** B
**Comentário:** **Terceira contagem diferente.** Home diz 8 perguntas, `/privacy` diz 9, esta LP diz 10. Fonte da verdade precisa ser definida.

[Localização: faq — diagnóstico]
**Afirmação:** "estimativa de ROI e recomendação honesta (inclui 'ainda não é hora' quando aplicável)"
**Categoria:** D
**Comentário:** Promessa de comportamento da IA. Conferir se o prompt do diagnóstico de fato pode retornar "ainda não é hora" — se o prompt empurra sempre pra venda, isso é promessa quebrada.

---

### PÁGINA: `/services`

[Localização: header]
**Afirmação:** "Três formas de trabalhar comigo."
**Categoria:** A
**Comentário:** OK.

[Localização: Automação Sob Demanda]
**Afirmação:** "A partir de R$ 2.500" / "Entrega em 1-2 semanas"
**Categoria:** D
**Comentário:** Faixa de preço. Prazo agressivo (1-2 semanas) — sustentável só em escopo restrito. OK como ponto de entrada.

[Localização: Sprint de IA]
**Afirmação:** "Sprint focado pra colocar UM caso de uso de IA rodando em produção na sua empresa. Inclui: arquitetura, implementação, deploy, telemetria de custo e documentação técnica."
**Categoria:** D
**Comentário:** Promessa estruturada. Realista pra 2 semanas se o caso de uso for bem delimitado. OK.

[Localização: Desenvolvedor Dedicado]
**Afirmação:** "Trabalho 40h/mês com você como desenvolvedor remoto dedicado"
**Categoria:** A
**Comentário:** OK.

[Localização: Não sou ferramenta no-code]
**Afirmação:** "Faço engenharia de operação — não montagem de fluxograma."
**Categoria:** G
**Comentário:** Posicionamento. Tonalmente OK, mas Levi usa n8n (que É montagem de fluxograma). Dependendo da leitura, soa contraditório. Avaliar se o ponto era "não-só-Zapier" ou "nada de no-code" — se for o segundo, conflita com a stack do `/about`.

[Localização: processo — diagnóstico]
**Afirmação:** "Toda parceria começa com o diagnóstico gratuito do site. Em 2 minutos, a IA identifica onde faz sentido começar."
**Categoria:** D
**Comentário:** Política de funil. OK.

---

### PÁGINA: `/privacy`

[Localização: 1. Quem somos]
**Afirmação:** "operado por Levi Lael, profissional autônomo"
**Categoria:** A
**Comentário:** OK. **Mas:** brief diz que tem sócio comercial. Se a operação Levi Lael for de fato sociedade (CNPJ compartilhado ou prestação conjunta), "profissional autônomo" pode ser impreciso. Se Levi factura sozinho, OK. Vale revisar com o sócio.

[Localização: 2. Que dados coletamos]
**Afirmação:** "respostas das 9 perguntas"
**Categoria:** B
**Comentário:** Inconsistência (ver home: 8; LP /automacao-contabil: 10). Definir verdade única.

[Localização: 4. Com quem compartilhamos — Anthropic]
**Afirmação:** "Não armazena seus dados."
**Categoria:** B
**Comentário:** A Anthropic tem política de retenção curta para dados de API (default ~30 dias) e o ZDR depende do plano contratado. Dizer "não armazena" é mais forte do que a realidade contratual padrão. Confirmar plano da conta Anthropic e ajustar wording se não houver ZDR garantido.

[Localização: 4. — Resend]
**Afirmação:** "Armazena temporariamente."
**Categoria:** A
**Comentário:** OK, alinhado com a política da Resend.

[Localização: 6. Cookies e tracking]
**Afirmação:** "Identificadores pessoais (e-mail, telefone) enviados ao Meta são hashados via SHA-256 antes da transmissão."
**Categoria:** B
**Comentário:** Verificável no código (`components/tracking/`). Se de fato hasheia client-side ou server-side antes de POST, OK. Conferir.

---

### Footer (presente em todas as páginas)

[Localização: tagline]
**Afirmação:** "Engenharia de operações com IA e automação para empresas que querem crescer sem inchar a equipe."
**Categoria:** A
**Comentário:** OK, alinhado com home.

[Localização: copyright]
**Afirmação:** "© {ano} Levi Lael · Todos os direitos reservados."
**Categoria:** A
**Comentário:** OK.

[Localização: link LinkedIn]
**Afirmação:** Link para `linkedin.com/in/levi-lael`
**Categoria:** A
**Comentário:** Verificar se o perfil existe e está atualizado. Não é falsidade, é higiene.

[Localização: link GitHub]
**Afirmação:** Link para `github.com/levilael`
**Categoria:** A
**Comentário:** Verificar atividade do perfil — se está vazio, contrasta com claims de engenharia técnica. Não muda copy, mas é sinal.

---

### `/blog`

A página `/blog` lista artigos do Notion via `listArticles()`. O conteúdo dos artigos não foi auditado (escopo do brief). Promessa estrutural a sustentar nas LPs: o blog precisa ter artigos práticos ligados a IA + automação + operações. Se a maioria dos posts forem sobre outros temas ou estiverem vazios, o eyebrow "Conteúdo recente" da home rotaciona credibilidade.

---

## 3. Problemas prioritários

### 3.1 — Voz inconsistente: solo (Eu) vs time (Combinamos)
**Onde:** `/about` é todo "eu". As 4 LPs usam "combinamos / te ajudamos / nossa equipe". A `/privacy` declara "profissional autônomo".
**Por que importa:** o visitante que pula de uma LP pro about percebe. Brief diz que existem 2 sócios, mas o site nunca apresenta o sócio comercial. Ou se padroniza pra "eu" (e o sócio entra como colaborador comercial sem aparecer no site) ou se cria uma seção "Equipe" no about apresentando os dois.

### 3.2 — Inconsistência interna de números entre LPs
**Onde:**
- Triagem: `/triagem-documentos` diz 33h/mês por pessoa. `/automacao-contabil` diz 5h/dia (≈100h/mês). E o cálculo dentro de `/triagem-documentos` não fecha (200 doc × 1 min ≠ 33h/mês).
- Diagnóstico: home diz 8 perguntas, `/privacy` diz 9, `/automacao-contabil` diz 10.
- ERPs: `/triagem-documentos` lista 4 (Domínio, Onvio, Sage, Alterdata). `/automacao-contabil` adiciona MasterMaq.
**Por que importa:** qualquer cliente que abrir duas páginas vê a contradição. Mata credibilidade em uma única sessão.

### 3.3 — Integrações com ERPs contábeis prometidas como nativas
**Onde:** `/triagem-documentos` passo 4, `/automacao-contabil` passo 2, FAQs de ambas.
**Por que importa:** Domínio, Onvio, Alterdata e MasterMaq não têm APIs REST públicas livres. Integração real é por arquivo, banco local ou parceria via revenda. Dizer "funciona com" sem qualificar gera frustração na entrega. Cliente fecha contrato esperando plug-and-play, descobre que o caminho é watch folder ou export schedulado.

### 3.4 — Métricas e percentuais sem fonte
**Onde:**
- "15-30 horas por semana" (home final-cta)
- "5-10% das notas precisam ser corrigidas" (`/processamento-notas`)
- "95-98% de precisão" e "90-95% precisão humana" (`/processamento-notas` FAQ)
- "R$ 0,05-0,15 por mensagem WhatsApp" (`/cobranca-automatica`)
- "R$ 0,10-0,30 por nota processada" (`/processamento-notas`)
**Por que importa:** sem operação, sem clientes, sem base. Esses números são chutes razoáveis ou fabricados. Se um lead técnico pedir fonte, não tem. Risco: pequeno hoje, grande quando aparecer cliente experiente.

### 3.5 — CaixaHub e FastDevBuilds importados como prova social pra contabilidade
**Onde:** `/about` Ato 2 (CaixaHub) e Ato 3 (FastDevBuilds). Reaparece na bio das LPs como "sistemas de IA em produção em fintech e automação B2B".
**Por que importa:** são projetos reais, mas:
- CaixaHub está "pausado" — não está em produção hoje.
- FastDevBuilds tem 0 clientes fechados (brief).
- Nenhum dos dois é experiência em escritório contábil. A bio da LP dá a entender que a experiência se aplica diretamente — não se aplica.
- "Combinamos engenharia técnica com experiência em contabilidade" pressupõe alguém com background contábil — esse alguém é o sócio comercial, que não está apresentado em lugar nenhum.

### 3.6 — Stack listada inflada (Python, GPT)
**Onde:** `/about` seção "Stack principal".
**Por que importa:** Python não aparece no código deste site. GPT não é usado (a operação roda em Anthropic). Listar tecnologias que você não usa por hábito tipográfico é o tipo de coisa que pega mal numa conversa técnica de fechamento. Se Python e GPT foram usados em CaixaHub/FastDevBuilds, escrever "Já trabalhei com" em vez de "Stack atual".

### 3.7 — Promessas brandas que viram dívida na entrega
**Onde:**
- "Sistema fica mais preciso ao longo do tempo" (triagem).
- "Adapta o tom" automático na cobrança.
- "Estimativa de ROI" no diagnóstico.
- "Recomendação honesta (inclui 'ainda não é hora')" no diagnóstico.
- "Anthropic não armazena seus dados" (privacy).
**Por que importa:** cada uma é factível, mas exige confirmação técnica caso a caso. Se o template padrão de entrega não cobre, vira promessa quebrada. Vale uma checklist interna: cada bullet acima → "isso está no escopo padrão do projeto?".

---

## 4. Recomendações finais

Não estou modificando nada agora — só apontando ordem de prioridade de revisão antes de tocar copy:

1. **Definir voz singular vs plural.** Decisão de negócio: o sócio comercial aparece no site ou não? Resposta antecede qualquer reescrita.
2. **Recalcular as 4 calculadoras.** Não chutar, fazer planilha. Decidir base (dias úteis no mês: 20 ou 22) e padronizar. Triagem é a mais crítica.
3. **Padronizar contagem de perguntas do diagnóstico** (8 ou 9 ou 10) e propagar pra home, /privacy, /automacao-contabil.
4. **Padronizar lista de ERPs** (decidir os 4-5 oficialmente suportados) e qualificar o "funciona com" — adicionar uma linha tipo "integração via API, watch folder ou exportação, conforme o ERP permitir".
5. **Decidir o que fazer com CaixaHub e FastDevBuilds no about** — manter como história pessoal ou separar em "outros projetos" pra não confundir com a oferta Levi Lael.
6. **Limpar a stack do /about** (remover Python e GPT se não estão em uso atual).
7. **Para as métricas sem fonte:** ou (a) adicionar uma linha "estimativa baseada em [X]", ou (b) trocar por afirmação qualitativa ("uma parte significativa das notas precisam de revisão") ou (c) remover. Não deixar número específico solto.
8. **Auditar o prompt do diagnóstico** pra confirmar que ele de fato produz estimativa de ROI e pode recomendar "ainda não é hora" — senão, ajustar a copy das LPs.
9. **Confirmar política Anthropic da conta** antes de afirmar "não armazena seus dados".

Nada disso é reescrita — é validação. Depois disso a reescrita de copy fica trivial.
