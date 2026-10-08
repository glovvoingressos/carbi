# Área do membro

Scope: `/minha-conta` e suas páginas internas. Visitor mode: Operate.
Audience: compradores e vendedores gerenciando seus anúncios, conversas e dados.
Visual authority: referência fornecida pelo usuário em 2026-10-01. Redesign completo explicitamente solicitado; composição e estética da referência são a direção aprovada. Implementação em código com dados reais, sem criar funcionalidades comerciais fictícias.

## Direction contract

THESIS: uma área de trabalho compacta para acompanhar veículos e negociações, com navegação e carteira à esquerda, perfil e atividade no centro e próximas ações à direita.

OWN-WORLD: barra lateral quase preta, canvas cinza claro, painéis brancos, cartões contextuais lima e lilás. Tipografia Poppins existente com peso moderado, ícones Lucide finos, controles circulares e superfícies arredondadas como a referência.

STORY: reconhecer sua conta, selecionar uma tarefa ou veículo, consultar a atividade e agir. Perfil e segurança ficam em abas e configurações, sem alongar o dashboard com formulários.

FIRST VIEWPORT: trilho de ícones de 68px, carteira de 220px com indicadores em 2×2 e lista de veículos; cabeçalho com avatar, nome e contatos; abas, atividade e conversas centrais; duas superfícies laterais lilás/lima com desempenho e publicar anúncio. No mobile, barra compacta, navegação inferior, conteúdo em uma coluna e detalhes progressivos.

FORM: direção fixada pela imagem do usuário; seed `0fb472b1` não substitui essa decisão. Interação assinatura: selecionar um veículo na carteira atualiza o resumo contextual do dashboard. Transições de estado de 180ms; movimento reduzido desativa animações.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Constraints: autenticação real, edição, upload e gerenciamento existentes; sem dados inventados. Empty/loading/error states acessíveis. Layout próprio sem navbar/footer públicos duplicados. Referência 000h consultada; usar primitivas instaladas quando os estilos globais do registry conflitam com a identidade escolhida.
