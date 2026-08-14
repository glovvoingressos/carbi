# Procure Meu Carro — Design

**Data:** 2026-08-13
**Status:** Aprovado
**Escopo deste build:** fluxo completo do comprador (busca em linguagem natural → interpretação → confirmação → resultados → busca salva → acompanhamento de anúncios → evento de match → entrega por e-mail + in-app). O lado de demanda→oferta (agregação de mercado, aquisição de vendedores) fica para uma próxima etapa, mas o modelo de dados já o suporta.

## 1. Objetivo

Transformar o Carbi em um **consultor de compra de seminovos**, e não apenas um site de busca. O usuário escreve o que procura como falaria com um especialista (ex.: "Quero um Audi Q3 2015 até R$ 200 mil") e o sistema:

1. entende a intenção e estrutura os critérios;
2. confirma o entendimento com o usuário;
3. busca anúncios compatíveis agora;
4. se não houver, **continua procurando** (busca salva = demanda registrada);
5. quando um anúncio compatível aparecer, gera um evento **MATCH** com nível e explicação;
6. entrega o match por e-mail e in-app.

## 2. Promessa do Carbi (copy obrigatória)

- NUNCA dizer "Nós vamos encontrar seu carro" / "Seu carro será encontrado".
- NUNCA sugerir acesso a veículos não anunciados.
- Usar: **"O Carbi acompanha os anúncios disponíveis e procura oportunidades compatíveis com o que você procura."**
- Ou: **"Quando aparecer uma oportunidade compatível, avisaremos você."**

## 3. Arquitetura

- **Next.js App Router** existente; novos arquivos seguem os padrões do repo (`server actions`, `route handlers`, `supabase` via `lib/supabase-server.ts`).
- **Interpretador híbrido**: regras determinísticas primeiro, fallback LLM (OpenRouter) apenas para intenções difusas.
- **Pesquisa imediata**: reaproveita `fetchPublicListingsPage` / `ListingsPageInput` de `src/lib/marketplace-server.ts` mapeando `criteria` → filtros.
- **Scan de match**: rota `/api/procurar/scan` acionada por cron do Vercel (`vercel.json`), protegida por `CRON_SECRET`.
- **Entrega**: e-mail via Resend + notificação in-app na tabela `notifications` existente.

## 4. Modelo de dados (nova migração)

### `buyer_searches` — cada "Procure Meu Carro" = demanda real

| coluna | tipo / notas |
|---|---|
| `id` | uuid PK default gen_random_uuid() |
| `user_id` | uuid nullable → auth.users(id) (login opcional) |
| `contact_email` | text not null (capturado no passo de salvar quando anônimo) |
| `status` | text not null default 'active' check in (active, paused, resolved, cancelled) |
| `original_query` | text not null (frase crua, para auditoria) |
| `criteria` | jsonb not null — ver schema abaixo |
| `interpretation_source` | text not null default 'rules' check in (rules, llm) |
| `view_token` | uuid not null default gen_random_uuid() (credencial para "ver minha busca" anônimo) |
| `match_level_min` | text not null default 'possivel' |
| `matched_count` | int not null default 0 |
| `last_scan_at` | timestamptz null |
| `created_at` / `updated_at` | timestamptz not null default now() |

Indexes: `(status, created_at)`, `contact_email`, `user_id`.

### `search_matches` — eventos de match (search × anúncio)

| coluna | tipo / notas |
|---|---|
| `id` | uuid PK |
| `search_id` | uuid not null → buyer_searches(id) on delete cascade |
| `listing_id` | uuid not null → vehicle_listings(id) on delete cascade |
| `match_level` | text not null check in (exato, proximo, possivel) |
| `score` | numeric(5,2) |
| `criteria_matched` | jsonb — critérios casados |
| `deviation` | jsonb — divergências ("price +4%") |
| `explanation` | text — frase do consultor |
| `notified_email` | bool not null default false |
| `notified_at` | timestamptz null |
| `in_app_read` | bool not null default false |
| `created_at` | timestamptz not null default now() |

Unique: `(search_id, listing_id)`.

### Schema de `criteria` (jsonb)

```
{
  brand: string|null,
  model: string|null,
  version: string|null,
  year_min: number|null,
  year_max: number|null,
  price_min: number|null,
  price_max: number|null,
  mileage_max: number|null,
  transmission: string|null,   // automatico | manual
  fuel: string|null,           // eletrico | hibrido | flex | gasolina | diesel ...
  body_type: string|null,      // suv | sedan | hatch | pickup | esportivo | ...
  city: string|null,
  state: string|null,
  optional_items: string[],
  max_owners: number|null,
  intent: string|null,         // family | daily | first_car | ...
  notes: string|null           // contexto difuso ("econômico")
}
```

### Acesso / RLS

- Logado: dono via `auth.uid()` (select/update/delete próprios; insert com user_id).
- Anônimo: credencial é o `view_token`; rotas servem via cliente admin (service role) apenas quando o token é válido. Tratar token como credencial (não logar, não expor em URLs públicas além do e-mail do próprio usuário).
- `search_matches`: leitura para o dono da busca associada; insert apenas server-side (scan).
- Notificações: reutilizar a tabela `notifications` com `type='buyer_match'`.

### Demanda → oferta (futuro, já suportado)

`buyer_searches` permite agregação do tipo "37 pessoas procurando SUVs até R$ 150 mil em Belo Horizonte" (query por `criteria->>'body_type'`, `price_max`, `city`) e futura aquisição de vendedores. UI de vendedor fica fora deste build.

## 5. Interpretador

Arquivo: `src/lib/buyer-agent/interpret.ts` — função pura `interpretQuery(phrase): { criteria, source, needsFollowUp?, ambiguous? }`.

1. **Normalização**: acentos, caixa, duplicação de tokens.
2. **Regras** (sem rede, sem custo):
   - preços: "até 200 mil" → price_max; "a partir de 150 mil" → price_min; "R$", "mil", "milhões".
   - anos: "2015" → year (faixa); "2021 ou mais novo" → year_min; "até 2018" → year_max; "2013 a 2016" → faixa.
   - marca/modelo/versão via catálogo existente em `@/data/cars`.
   - carroceria ("SUV"), câmbio ("automático"/"manual"), combustível ("elétrico", "híbrido", "flex"...), localização (MAJOR_CITIES de `marketplace-seo.ts` + mapa estados), quilometragem ("até 60 mil km"), opcionais ("teto solar", "couro"), proprietários ("2 donos").
   - intenção: "família" → intent=family; "econômico" → notes.
3. **Fallback LLM**: se restam poucos/nenhum critério nítido (ex.: "carro econômico para família"), chamar OpenRouter (padrão de `src/app/api/marketplace/generate-description/route.ts`, `OPENROUTER_API_KEY`) com prompt que exige JSON estruturado no schema acima, vocabulário restrito ao catálogo. Validar com zod; em falha → critério parcial + `ambiguous: true`.
4. **`explain.ts`**: monta o bloco "ENTENDEMOS QUE VOCÊ PROCURA:" (itens humanizados) e mapeia `criteria` → `ListingsPageInput`.

Regra de ouro: **nunca inventar marca/modelo** quando ausente. Critérios incompletos são aceitos.

## 6. Fluxo & UX

### Home

Card novo após "Últimos anúncios": **"NÃO ENCONTROU O QUE PROCURA?"** — "Conte para o Carbi qual carro você está procurando." + input (placeholder `Ex: Quero um Audi Q3 2015 até R$ 200 mil`) + CTA **[PROCURAR PARA MIM]** → `/procurar-meu-carro?q=<frase>`.

### `/procurar-meu-carro` — wizard em 3 passos

1. **Input**: mesmo campo, maior; mostra buscas ativas se logado.
2. **Confirmação**: "ENTENDEMOS QUE VOCÊ PROCURA:" com cards de critérios + Localização default "Belo Horizonte" + **[ESTÁ CERTO]** / **[EDITAR]**. EDITAR abre formulário estruturado pré-preenchido; se o interpretador sinalizou ambiguidade, primeiro uma pergunta-follow-up ("Quer automático ou manual?") com chips.
3. **Resultados**: anúncios compatíveis imediatos via `fetchPublicListingsPage`, cada card com explicação de consultor ("Encontramos este porque atende aos principais critérios: modelo, ano e preço." / "alternativa por estar R$ 5 mil acima do limite, mas com 18 mil km a menos").

### Sem resultados

Página vazia exata do brief:
- **# AINDA NÃO ENCONTRAMOS O CARRO CERTO.** — "Não encontramos atualmente uma opção que corresponda aos critérios que você informou."
- **# MAS PODEMOS CONTINUAR PROCURANDO.** — "Cadastre sua busca e avisaremos quando aparecer uma oportunidade compatível."
- CTA **[CONTINUAR PROCURANDO PARA MIM]**.

### Salvar busca

- Se não logado: campo de e-mail.
- Criar `buyer_searches` (POST `/api/procurar/searches`) → confirmação "PROCURANDO: Audi Q3 · 2015 · Até R$ 200 mil · Belo Horizonte" + explicação da entrega (e-mail + in-app) com copy da promessa.
- Se logado: também link para `/minha-conta/buscas`.

### Telas de match

- Logado: `/minha-conta/buscas` lista buscas ativas + matches com badge `MATCH EXATO` / `MATCH PRÓXIMO` / `POSSÍVEL MATCH`, explicação e **[VER CARRO]** → `/anuncios/[slug]`.
- Anônimo: link com `view_token` no e-mail → página server-rendered da busca + matches.
- Notificações na tabela existente (`type='buyer_match'`), consumidas onde o app já renderiza `notifications`.

## 7. Matching & scan

- Função pura `src/lib/buyer-agent/match.ts`: `evaluate(search, listing) → { level, score, criteriaMatched, deviation, explanation }`.
- **Níveis**:
  - `exato` — critérios principais 100% (marca+modelo, ano na faixa, preço ≤ max; e câmbio/combustível/carroceria/local se informados).
  - `proximo` — pequena diferença: preço até +10% acima do limite, ano ±2 anos, km levemente acima.
  - `possivel` — mesma marca/carroceria com modelo diferente, ou diferença relevante.
- Explicação gerada pelos critérios casados/divergentes (+ sinal FIPE `below_fipe` quando disponível).
- Rota `/api/procurar/scan` (GET, `Authorization: Bearer CRON_SECRET`): anúncios `status='active'` com `published_at`/`updated_at` na janela; para cada um, carrega buscas ativas em lotes, avalia, insere `search_matches` (`ON CONFLICT DO NOTHING`) e, quando novo: e-mail Resend + notificação + `matched_count++`.
- Cron no `vercel.json`: `crons: [{ path: '/api/procurar/scan', schedule: '*/10 * * * *' }]`.

## 8. Segurança & limites

- `CRON_SECRET` em variável de ambiente; rota de scan rejeita requisições sem o bearer correto.
- Interpretador e scan com timeouts e batching para não estourar custo/limites do OpenRouter e Resend.
- Máximo de matches por busca por scan (ex.: 10) para evitar spam de e-mails.

## 9. Testes

`scripts/test-procurar-e2e.mjs` (padrão dos testes e2e existentes):
- unit de interpretação com os 4 exemplos do brief (Audi Q3 2015 até 200 mil; SUV automático até 120 mil; Corolla 2021+ até 130 mil; carro econômico para família até 90 mil — sem inventar marca/modelo).
- criar busca via API (logado e anônimo).
- simular anúncio compatível e rodar scan → validar `search_matches`, payload de e-mail e notificação.
- validar copy da promessa (sem "vamos encontrar seu carro").

## 10. Fora de escopo (próximas etapas)

- UI de demanda→oferta / aquisição de vendedores ("Tem um Corolla 2021+? ... [VER QUANTO VALE]").
- Agregação "37 pessoas procurando..." como produto visível.
- Pausar/cancelar busca e edição de critérios após criação.
