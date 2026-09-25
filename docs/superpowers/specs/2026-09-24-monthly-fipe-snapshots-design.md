# Design: Atualização automática mensal da FIPE nos anúncios

## Objetivo

Manter o comparativo dos anúncios ativos alinhado ao valor FIPE mais recente disponível, sem consultar a API ao abrir cada página. A placa continua armazenada somente na tabela privada de identificadores; o público vê apenas o preço e o mês de referência.

## Evidências do projeto

- `vehicle_listings` já guarda `fipe_price` e `fipe_reference_month`; o trigger existente recalcula automaticamente diferença e percentual quando o preço FIPE muda.
- `vehicle_private_identifiers` associa a placa privada ao `vehicle_id` e já mantém identidade FIPE.
- A criação atual do anúncio persiste preço e mês, mas não popula de forma consistente `fipe_brand_code`, `fipe_model_code` e `fipe_year_code`. Portanto, uma atualização mensal baseada apenas nesses códigos não cobriria com segurança os anúncios atuais.
- `lookupPlate()` já seleciona o item FIPE de maior `score` e retorna preço, código e mês. A documentação da API Placas avisa que FIPE pode faltar, pode haver múltiplos resultados e há limite de consultas por plano: https://apiplacas.com.br/doc.php.
- O projeto já usa Vercel Cron em conceito, mas `vercel.json` ainda não declara uma tarefa agendada.

## Abordagem recomendada

Usar Vercel Cron diário, em produção, para processar uma fila persistente de veículos cujo snapshot FIPE esteja vencido ou precise de nova tentativa. A rotina consulta a API Placas usando a placa já guardada privadamente — uma consulta por veículo, nunca por anúncio — e atualiza todos os anúncios ativos ligados ao mesmo `vehicle_id`.

A execução diária permite esperar a publicação da nova referência sem presumir que ela estará disponível no primeiro dia do mês. Cada veículo terá `next_refresh_at` e contador de tentativas; respostas sem FIPE, referência não avançada, indisponibilidade ou limite da API preservam o último snapshot e programam nova tentativa com intervalo progressivo e teto mensal. Ao receber uma referência mais recente válida, o valor e o mês são gravados e o próximo ciclo fica para o mês seguinte. Referências iguais ou mais antigas nunca substituem o snapshot atual.

O lote por execução será limitado/configurável para respeitar o saldo do plano e o tempo de execução. A atualização será idempotente: chamadas duplicadas não criam histórico falso nem revertem preço. A rota exige `CRON_SECRET` via `Authorization: Bearer ...`; ausência de segredo falha fechada. Logs contêm contagens e motivos agregados, nunca placas nem respostas pessoais da API.

## Dados e fluxo

1. No cadastro, manter a placa e o código FIPE retornado pela API apenas em `vehicle_private_identifiers`.
2. A migração adiciona metadados privados mínimos de agendamento, tentativa e falha, com índices para selecionar veículos vencidos. RLS e privilégios atuais continuam restritos ao servidor.
3. O cron diário usa uma função SQL restrita ao `service_role` para reivindicar identificadores privados vencidos com anúncios ativos via `EXISTS`, em lote limitado e ordenado. `FOR UPDATE SKIP LOCKED` e um lease curto evitam consultas duplicadas em execuções sobrepostas e liberam automaticamente trabalho interrompido.
4. A API Placas retorna dados do veículo e possivelmente múltiplas opções FIPE; a integração existente escolhe o maior `score`. Só preço positivo e referência de mês válida/mais recente são aceitos.
5. Uma função SQL transacional valida o mês contra o snapshot canônico e todos os anúncios ativos, bloqueia referências mais novas/desconhecidas e atualiza `vehicles` e todos os anúncios ativos em uma transação. O trigger SQL já recalcula comparativo.
6. O anúncio segue exibindo apenas o comparativo FIPE e a referência salva; não há chamada de FIPE no carregamento público.

## Falhas, limites e segurança

- Falha, resultado vazio, FIPE ausente, resposta malformada ou `429`: não sobrescrever preço nem mês; registrar a tentativa sem dados sensíveis e reagendar.
- Se a API não trouxer uma referência parseável, não declarar que o valor é do mês atual.
- Desanúncios, veículos vendidos/arquivados e veículos sem placa privada não são consultados.
- Repetições e concorrência são protegidas por estado persistido, lease com `SKIP LOCKED`, bloqueio transacional do veículo e validação condicional de referências atuais.
- O segredo da API permanece exclusivamente no servidor. A rotina falha se o segredo do cron ou a integração não estiver configurada; não usa segredo padrão de teste em produção.
- A consulta mensal consome saldo da API Placas. Antes de ativar, confirmar que o volume de veículos e o plano suportam o lote e as retentativas.

## Agendamento e observabilidade

- Vercel Cron diário em horário UTC de baixo tráfego, com rota sob `src/app/api/cron/`.
- Vercel executa Cron apenas no deployment de produção, não tenta novamente falhas automaticamente e limita o tempo ao da Function. Por isso o processamento é idempotente, persistente e em lotes.
- Resposta e logs resumem `consultados`, `atualizados`, `sem referência nova`, `reagendados`, `sem placa` e `falhas`; monitorar execuções pelo painel de Cron da Vercel.
- O cron não deve ser considerado ativo até o deployment de produção com `CRON_SECRET` e `PLACA_API_TOKEN` configurados.

## Escopo e não objetivos

Inclui migração aditiva, persistência de estado de atualização, tarefa autenticada, configuração do cron, regras de comparação de referências, testes e documentação de configuração.

Não inclui histórico mensal/gráfico FIPE, consultas ao abrir páginas, publicação automática, alteração de preço pedido pelo vendedor, backfill por fuzzy match de anúncios sem placa, nem mudança no contrato público que expõe anúncios.

## Verificação e implantação

- Testes unitários para comparação de referências, seleção/deduplicação de veículos, autorização, atualização positiva, ausência de FIPE, erro e `429`, preservação do último snapshot e múltiplos anúncios por veículo.
- Validar tipos e build; revisar migration, grants/RLS e os campos retornados pela view pública.
- Rodar primeiro manualmente no ambiente de desenvolvimento com uma resposta FIPE simulada; fazer uma execução controlada em produção após configurar os segredos; então habilitar o cron.

## Aprovação pendente

Esta especificação implementa a abordagem aprovada em conversa, detalhando API Placas como fonte recorrente para manter coerência com a origem da consulta no cadastro. A API Placas não garante que todo resultado contenha FIPE; nesses casos, o último valor válido fica preservado e identificado pelo mês salvo.

Fontes técnicas: [Vercel Cron: configuração](https://vercel.com/docs/cron-jobs), [Vercel Cron: limites, precisão e preço](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Vercel Cron: segurança e ausência de retry automático](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [API Placas: FIPE e limite de consultas](https://apiplacas.com.br/doc.php).
