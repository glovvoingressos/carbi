# Especificação Técnica: Faixa do Ranking de Mais Vendidos na Home

- **Data:** 18/08/2026
- **Status:** Aprovado

## 1. Visão Geral
Adicionar uma faixa/seção dedicada na Home da Carbi que divulga o Ranking Oficial dos 100 Carros Mais Vendidos no Brasil (Julho/2026), direcionando tráfego para `/carros-mais-vendidos-brasil`.

## 2. Posição na Home (`src/app/page.tsx`)
- Posicionada entre a seção de soluções (`cb-build`) e o comparador de modelos (`ModelComparison`).

## 3. Design e Conteúdo (Estilo Carbi `cb-`)
- **Fundo:** Dark `#1A1A1A` (`cb-charcoal`) com detalhes `cb-lime` (#D4F576).
- **Badge:** "Ranking de Mercado · Julho / 2026".
- **Título:** "Confira os 100 carros mais vendidos do Brasil".
- **Subtítulo:** "Emplacamentos de 0km e transferências de seminovos com análise FIPE completa."
- **Mini-Pódio/Preview:** Exibir o #1 0km (VW Polo) e o #1 Seminovos (VW Gol) em pílulas de destaque.
- **Botão CTA:** "Ver ranking completo →" (Link para `/carros-mais-vendidos-brasil`).

## 4. Acessibilidade e Responsividade
- Totalmente adaptável para telas mobile.
- Suporte a `prefers-reduced-motion`.
- Foco visível via teclado.
