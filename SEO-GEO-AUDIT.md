# Auditoria de SEO e GEO — Carbi

**Data:** 24/09/2026
**Escopo prioritário:** anúncios individuais de carros, páginas de categoria/descoberta, indexação técnica e capacidade de extração por buscadores e assistentes de IA.
**Natureza:** auditoria somente leitura do código e amostra de páginas/resultados públicos. Nenhuma alteração no produto foi feita.

## Resumo executivo

Os anúncios têm uma base aproveitável: páginas individuais com URL própria, canonical, metadados Open Graph, preço e atributos do veículo renderizados na página, imagens com texto alternativo e anúncios ativos incluídos no sitemap. Uma amostra de anúncios da Carbi também aparece em resultados públicos com preço, comparação FIPE e detalhes específicos — sinal de que esses exemplos foram descobertos e seu conteúdo é extraível, mas não prova indexação de todo o inventário nem desempenho orgânico.

Há, porém, problemas concretos que reduzem descoberta e confiança:

1. **O sitemap lista quatro categorias que não existem na rota** (`eletricos`, `suv-automaticos`, `sedan-automaticos`, `picapes-diesel`); a página aceita somente oito intenções e responde 404 para as demais.
2. **Páginas `/carros/[slug]` com paginação ou filtros mudam os anúncios, mas mantêm canonical para a URL-base.** Isso pode fazer páginas subsequentes perderem sinais próprios e tornar anúncios mais profundos menos descobríveis por links internos.
3. **As páginas de categoria filtram somente os primeiros 48 resultados carregados**, e só depois aplicam o critério e limitam a 16. Categorias podem mostrar resultados incompletos ou vazios mesmo havendo anúncios correspondentes mais antigos.
4. **Os metadados dos anúncios são genéricos e repetitivos**: não incluem o preço anunciado, versão ou quilometragem; o sufixo “Comprar carro com preço FIPE na Carbi” é repetido em todas as páginas.
5. **O JSON-LD do veículo tem dados imprecisos/incompletos**: o nome não inclui versão/ano, disponibilidade é sempre `InStock`, a descrição de fallback parece uma ficha de catálogo mesmo em anúncio, e falta imagem/oferta completa. O schema da organização referencia `/logo.png`, mas o arquivo encontrado em `public` é `logo.svg` — provável URL de logo quebrada.

**Conclusão:** prioridade inicial deve ser corrigir URLs inválidas no sitemap, regras de canonical/paginação e qualidade factual de metadados/schema. Depois, melhorar a navegação rastreável e enriquecer cada anúncio com fatos verificáveis e atuais. Não recomendo gerar páginas SEO em massa com pouco inventário ou especificações presumidas: isso aumenta risco de páginas finas e conteúdo incorreto.

## Estado observado

### Pontos positivos

- Cada anúncio público tem URL canônica própria `/anuncios/{slug}`, metadados dinâmicos e imagem OG quando disponível: [página de anúncio](/Users/antonioaugusto/cardecision-web/src/app/anuncios/[slug]/page.tsx:12).
- A rota de anúncio busca o registro no servidor e devolve 404 se ele não estiver público; preço FIPE e dados de veículo podem ser apresentados junto ao conteúdo principal.
- Os anúncios ativos são incluídos no sitemap com `lastModified` derivado das datas do anúncio: [sitemap](/Users/antonioaugusto/cardecision-web/src/app/sitemap.ts:129).
- Há robots.txt gerado permitindo rastreamento público, bloqueando áreas de conta/admin/API e apontando os sitemaps: [robots](/Users/antonioaugusto/cardecision-web/src/app/robots.ts:5).
- Amostra pública: [Bravo Essence](https://www.carbi.com.br/anuncios/fiat-bravo-essence-1-8-2013-5343c399), [Tracker LT](https://www.carbi.com.br/anuncios/chev-tracker-lt-2018-1ae3a398) e [Tiggo 7 Pro PHEV](https://www.carbi.com.br/anuncios/caoa-chery-tiggo-7-pro-phev-2027-super-hybrid-079e3c7c). Os resultados públicos amostrados exibem trechos específicos dos veículos; isso não substitui Search Console nem teste sistemático de renderização/indexação.

### Achados priorizados

| Prioridade | Achado / evidência | Efeito provável | Recomendação |
|---|---|---|---|
| **P1 — corrigir** | O sitemap declara 12 slugs de categoria ([sitemap](/Users/antonioaugusto/cardecision-web/src/app/sitemap.ts:33)); `INTENTS` implementa só 8 ([categorias](/Users/antonioaugusto/cardecision-web/src/app/categorias/[intent]/page.tsx:18), [404 implícito](/Users/antonioaugusto/cardecision-web/src/app/categorias/[intent]/page.tsx:112)). | Quatro URLs submetidas no sitemap falham com 404 e desperdiçam rastreamento/confiança do sitemap. | Fazer o sitemap derivar dos slugs realmente registrados/gerados pela rota; adicionar teste garantindo que todo URL listado resolve e tem conteúdo suficiente. |
| **P1 — corrigir** | `/carros/[slug]` lê `pagina`/`page` e filtros e retorna listagem alterada ([parser](/Users/antonioaugusto/cardecision-web/src/app/carros/[slug]/page.tsx:83)), mas metadata canonical sempre aponta para `/carros/{slug}` ([canonical](/Users/antonioaugusto/cardecision-web/src/app/carros/[slug]/page.tsx:45)). | Páginas paginadas podem ser tratadas como duplicatas da primeira; itens só alcançáveis em páginas mais profundas ficam menos robustamente conectados. | Definir estratégia explícita: para paginação que deve ser rastreada, canonical autorreferente e links HTML de página anterior/próxima; para combinações de filtro/sort, `noindex,follow` ou canonicalização apenas quando o conteúdo for de fato equivalente. Validar em Search Console antes/depois. A documentação do [Google sobre canonicals](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) explica que canonical é um sinal e recomenda URLs consistentes. |
| **P1 — corrigir** | As categorias carregam 48 itens, filtram em memória e então exibem no máximo 16 ([consulta e filtro](/Users/antonioaugusto/cardecision-web/src/app/categorias/[intent]/page.tsx:120)). | Resultado pode ignorar anúncios antigos que atendem ao critério; a página pode ficar vazia ou parecer pouco útil apesar de haver carros elegíveis. | Aplicar os filtros no banco antes da paginação; para atributos que não podem ser consultados de forma confiável, não publicar a categoria até haver fonte estruturada suficiente. Criar testes com mais de 48 registros e correspondências fora da primeira página. |
| **P1 — alto impacto** | Título e descrição do anúncio são templates sem preço, versão, km ou referência FIPE atual ([metadata](/Users/antonioaugusto/cardecision-web/src/app/anuncios/[slug]/page.tsx:20)). Amostra pública inclui abreviação de fabricante (“CHEV”) no título do Tracker. | Snippet pouco distinto e menos útil para buscas de modelo/ano/preço; normalização ruim de marcas pode enfraquecer correspondência semântica. | Compor title/description curtos e únicos a partir de campos verificados: marca normalizada + modelo/versão + ano, preço do anúncio, cidade e, se vigente, valor FIPE/mês de referência. Não inserir FIPE indisponível nem afirmar “atualizado” sem data comprovável. Corrigir siglas por um mapa de marcas validado, sem alterar os dados originais automaticamente. |
| **P1 — alto impacto** | `VehicleSchema` usa somente `Car`, não inclui imagem, reduz o nome a marca + modelo, cria descrição genérica e marca sempre `InStock` ([JSON-LD](/Users/antonioaugusto/cardecision-web/src/components/seo/JSONLD.tsx:36)). | Dados estruturados podem não representar o anúncio visível; menor elegibilidade/clareza para sistemas que extraem ofertas. | Separar schema de catálogo e de anúncio. No anúncio, refletir exatamente título, versão/ano, preço BRL, condição/disponibilidade real, URL e fotos visíveis; adicionar vendedor apenas com dados públicos apropriados. Considerar `Product` junto a `Car` somente após validar o JSON-LD e elegibilidade de product snippet. A [documentação do Google para dados de produto](https://developers.google.com/search/docs/appearance/structured-data/product-snippet) não garante rich result. Não inventar avaliações ou outros atributos ausentes. |
| **P2 — corrigir** | Organização aponta logo para `/logo.png` ([schema](/Users/antonioaugusto/cardecision-web/src/components/seo/JSONLD.tsx:22)); no inventário de `public` consta `logo.svg`, não `logo.png`. | Logo de organização possivelmente indisponível para buscadores/consumidores de schema. | Apontar para o ativo real e acessível; validar resposta HTTP e JSON-LD em produção. |
| **P2 — melhorar** | `BreadcrumbSchema` de anúncio termina em marca com `/marcas` e modelo apontando para a própria URL do anúncio ([breadcrumb](/Users/antonioaugusto/cardecision-web/src/app/anuncios/[slug]/page.tsx:72)). | Breadcrumb estruturado não espelha completamente a hierarquia nem leva a um destino de modelo real. | Usar trilha coerente com páginas de destino existentes; não criar links falsos para hubs inexistentes. |
| **P2 — melhorar** | Listagem geral `/carros-a-venda` usa controles client-side para paginação; páginas SEO também não mostram links de paginação em seu JSX inicial. | Descoberta interna depende mais do sitemap e dos cards do que de links rastreáveis para páginas seguintes. | Se as páginas profundas forem indexáveis, oferecer links `<a href>` para anterior/próxima; se forem apenas navegação de usuário, manter fora do índice e assegurar que cada anúncio ativo continue alcançável por páginas/hubs indexáveis e sitemap. |
| **P2 — consolidar** | Há caminho legado `/carro/[slug]` que renderiza o mesmo conteúdo de `/anuncios/[slug]` (achado da inspeção técnica). | Duas URLs acessíveis para o mesmo anúncio, ainda que canonical ajude a consolidar. | Preferir redirect 301/308 do legado para a URL canônica; conferir logs/links externos antes de remover rota. |

### Anúncios: recomendações editoriais para descoberta e confiança

O anúncio é a página central do marketplace; cada página precisa responder, sem depender de interação, “qual carro é, quanto custa, onde está, qual é o estado e quando os dados foram verificados?”.

- **Identidade consistente:** marca por extenso, modelo, versão, ano/modelo e combustível/câmbio quando confirmados. Evitar siglas inconsistentes no título público.
- **Preço comparável:** manter preço do vendedor separado do valor FIPE; informar mês/ano da referência FIPE e data da última atualização. O preço de referência não deve ser apresentado como avaliação oficial do estado do veículo.
- **Fatos e proveniência:** diferenciar “informado pelo vendedor”, “consultado por placa” e “referência FIPE”. Nunca preencher itens de série, condição, histórico, consumo ou manutenção por inferência de texto/modelo.
- **Descrição original e útil:** incentivar estado de conservação, revisões com comprovante, quantidade de proprietários se declarada, itens/acessórios e motivo da venda — com moderação e sem gerar alegações automáticas. Remover boilerplate que apenas repete especificações.
- **Fotos:** preservar fotos reais do veículo, alt descritivo e imagem principal estável; evitar imagens ilustrativas como se fossem o carro anunciado.
- **Mudanças de estado:** quando vendido/inativo, remover do sitemap rapidamente. Decidir 404/410 ou redirecionamento contextual conforme existência de substituto equivalente; não redirecionar todos os anúncios expirados à home.
- **Privacidade:** placa e dados pessoais consultados não devem aparecer em HTML, metadados, JSON-LD, logs públicos ou texto do anúncio.

## GEO — prontidão para mecanismos de resposta com IA

**Score heurístico de prontidão: 58/100.** É uma avaliação de estrutura e citabilidade baseada no código e em poucos exemplos públicos; **não** mede citações reais, tráfego, ranking ou probabilidade de resposta por plataforma.

| Dimensão | Pontos | Evidência resumida |
|---|---:|---|
| Citabilidade e conteúdo útil | 12/25 | Há preço, atributos, local e algumas descrições originais; falta padronizar origem/data dos fatos FIPE e separar dados verificados dos declarados. |
| Estrutura e legibilidade | 14/20 | Páginas de anúncio têm títulos, conteúdo estruturado e JSON-LD, mas schema contém fallback genérico e atributos incompletos. |
| Multimodal | 11/15 | Galeria de veículo e metadados de imagem existem; garantir foto real, alt preciso, dimensões/resposta estável e imagem em schema. |
| Autoridade e confiança | 7/20 | Foram vistos poucos sinais independentes na amostra de busca; não foi feita análise de backlinks, avaliações verificadas ou credenciais do vendedor. Dados de procedência e política editorial podem melhorar confiança. |
| Acesso técnico | 14/20 | Robots permite rastreamento genérico e o conteúdo principal parece disponível em páginas públicas amostradas; não foi possível confirmar raw HTML, respostas de todos os crawlers ou arquivos publicados ao vivo. |

### Plataformas e acesso

| Superfície | O que esta auditoria conseguiu concluir |
|---|---|
| Google Search / AI Overviews | Há amostras de anúncios nos resultados públicos; presença/citação em AI Overviews não foi medida. O sitemap ajuda descoberta, mas não garante indexação — ver [guia de sitemaps do Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview). |
| ChatGPT Search | A regra `User-agent: *` do código permite o rastreamento genérico, mas não houve teste HTTP do robots.txt publicado nem consulta de citações. A OpenAI documenta separadamente o crawler de busca `OAI-SearchBot` e o crawler de treinamento `GPTBot`; permitir um não deve ser presumido a partir do outro. Ver [documentação de crawlers da OpenAI](https://developers.openai.com/api/docs/bots). |
| Perplexity / Bing Copilot | Não foi feita medição direta de inclusão ou citações, nem verificação da resposta de seus crawlers em produção. |
| `llms.txt` | Nenhum arquivo `llms.txt`/`llms.md` foi encontrado no código. A URL em produção não pôde ser confirmada. É uma melhoria opcional de orientação, não substitui robots, sitemap, links, conteúdo indexável ou schema válido. |
| Menções externas | Busca pública limitada não evidenciou muitos sinais independentes inequívocos da marca. Isso não é auditoria de backlinks e pode refletir cobertura da consulta; medir Search Console, ferramentas de links e menções separadamente. |

### Melhorias de citabilidade (sem fabricar autoridade)

1. Criar uma ficha semântica previsível em cada anúncio: `marca → modelo/versão → ano → preço anunciado → FIPE + mês → km → cidade → combustível/câmbio → vendedor → publicado/atualizado em`.
2. Mostrar visualmente a origem e a data de cada dado. Em especial, registrar a referência FIPE usada no momento da captura e manter snapshot consultável quando a política de dados permitir.
3. Fazer a página responder a perguntas concretas com fatos: “qual é o preço?”, “quanto representa da FIPE?”, “qual a quilometragem?”, “onde está?”. Não usar linguagem de avaliação (“bom negócio”, “abaixo do mercado”) sem critério e contexto transparentes.
4. Manter páginas de marca/modelo/categoria apenas quando houver inventário, filtros corretos e texto realmente útil; não criar centenas de variantes finas para palavras-chave.
5. Expandir `sameAs`/perfis institucionais apenas com perfis oficiais ativos e verificáveis; buscar citações editoriais e links legítimos do setor em vez de fabricar páginas de autoridade.

## Plano recomendado

**Primeira rodada (bloqueadores):** alinhar categorias do sitemap com rotas que realmente existem; definir indexação/canonical de paginação e filtros; corrigir processamento de resultados de categoria.

**Segunda rodada (anúncios):** melhorar títulos/descriptions usando fatos do próprio anúncio; acertar schema e logo; validar breadcrumbs e imagens; criar teste de metadados/JSON-LD para amostras de carro anunciado, FIPE ausente e anúncio inativo.

**Terceira rodada (descoberta e GEO):** links HTML de paginação conforme estratégia de indexação, links internos por marca/modelo, conteúdo de anúncios com procedência, e opcionalmente um `llms.txt` enxuto que referencie páginas estáveis e políticas públicas.

## Limites e validações pendentes

- Não houve acesso ao Google Search Console, Bing Webmaster Tools, analytics, logs, PageSpeed/CrUX ou plataforma de citações de IA. Assim, não há dados de impressões, cliques, páginas excluídas, Core Web Vitals ou citações por assistente.
- As tentativas de abrir diretamente os endpoints públicos de `robots.txt`, sitemap e `llms.txt` não deram resposta verificável nesta sessão. Regras descritas acima foram confirmadas no código, não na resposta atual de produção.
- Resultados públicos são amostras pontuais e mutáveis; não representam todo o catálogo.
- A recomendação de schema segue a documentação oficial do Google. O recurso específico de listagens de veículos do Google é atualmente destinado aos EUA e territórios, portanto não é uma estratégia adequada para o inventário brasileiro; ver [anúncio/documentação de Vehicle Listings](https://developers.google.com/search/blog/2023/10/vehicle-listings-structured-data).
