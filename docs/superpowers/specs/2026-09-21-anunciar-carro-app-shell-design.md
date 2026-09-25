# Fluxo de anúncio como app — Design

## Objetivo

Transformar `/anunciar-carro/fluxo` e `/anunciar-carro-bh/fluxo` em um fluxo de publicação mobile-first, com aparência de app, sem perder a identidade Carbi nem a consulta automática de placa/FIPE.

## Decisões

- O fluxo terá um shell próprio de tarefa, sem `Navbar`, `Footer` ou `SupportWidget` globais durante o preenchimento.
- O estado de etapa e subetapa será refletido na URL com `window.history.pushState`, sem navegação completa.
- O rascunho será versionado. Dados textuais ficam no `localStorage`; fotos serão persistidas no IndexedDB como `Blob`, com fallback seguro quando IndexedDB não estiver disponível.
- A resposta de placa alimentará o mesmo estado usado pelo comparativo FIPE, preservando preço e referência quando retornados.
- Dados de catálogo serão carregados somente depois de existir veículo identificado e em horário ocioso; não bloquearão a primeira etapa.
- Campos textuais, selects e textareas terão estilos e semântica próprios.
- Cada estado assíncrono terá feedback visual e acessível; erros serão anunciados e associados ao campo ou bloco responsável.
- O CTA principal será único por estado e ficará na zona inferior segura no mobile.

## Critérios de aceite

1. A rota não renderiza navbar, footer ou widget de suporte globais.
2. Em viewport estreito, o formulário ocupa a largura disponível sem overflow e mostra etapa, título, campo principal e CTA sem rolagem promocional desnecessária.
3. Todos os campos editáveis têm nome acessível, foco visível, labels associados e mensagens de erro anunciadas.
4. A placa consultada exibe confirmação/falha e o preço/referência FIPE alimenta o comparativo da etapa seguinte.
5. Atualizar a página restaura etapa, subetapa, dados e fotos do rascunho quando o navegador permite IndexedDB.
6. `/api/cars` não é chamado na primeira renderização sem veículo identificado.
7. Testes, build e Lighthouse mobile são executados após a implementação.
