# Especificação — melhorias do fluxo de anunciar carro

## Objetivo

Corrigir os problemas encontrados na auditoria `ui-taste` do fluxo de anúncio, preservando a jornada atual, o salvamento de rascunho e o caminho de publicação.

## Requisitos

1. A placa completa nunca deve ser persistida como dado público. O fluxo deve armazenar, no máximo, o último caractere.
2. O valor FIPE retornado pela consulta de placa deve permanecer disponível na etapa de preço.
3. Quando a consulta por placa falhar ou não for desejada, o usuário precisa conseguir preencher marca, modelo e ano manualmente.
4. Ao mudar de etapa, o título da nova etapa deve ficar visível no topo da viewport.
5. Campos essenciais devem manter labels visíveis mesmo depois de preenchidos.
6. Uploads rejeitados devem explicar o motivo e informar o limite de 10 MB por imagem.
7. A criação de conta deve mostrar as regras de senha antes do envio.
8. O fluxo deve comunicar carregamento da FIPE e manter mensagens de erro recuperáveis.
9. A tipografia e os microtextos devem permanecer legíveis e alinhados ao sistema visual Carbi.
10. O fluxo e o fallback de login não devem introduzir os erros de lint identificados na auditoria.

## Fora de escopo

- Alterar o modelo de autenticação ou o provedor Supabase.
- Alterar o limite de cinco anúncios grátis.
- Publicar anúncios ou enviar arquivos/credenciais reais durante a verificação.
- Redesenhar páginas fora de `/anunciar-carro` e `/anunciar-carro/fluxo`.
