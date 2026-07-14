---
name: Carbi account pages — apply home/anunciar-carro design
description: Restyle cadastro, entrar, minha-conta and their AuthCard/ProfilePanel components to the Carbi design system (chartreuse/ink/marble) used by the home and anunciar-carro pages.
date: 2026-07-14
status: approved
---

# Aplicar o design Carbi às páginas de conta

## Goal

Tornar `cadastro`, `entrar` e `minha-conta` (e seus componentes `AuthCard` e
`ProfilePanel`) visualmente idênticos ao sistema Carbi já usado pela home
(`page.tsx`) e pelo fluxo de anunciar carro (`anunciar-carro/page.tsx` +
`/anunciar-carro/fluxo`). O site já possui um conjunto de utilitários `.btn`,
`.input`, `.surface-strong` e variáveis CSS (`--chartreuse`, `--ink`,
`--marble`, `--text-secondary`, etc.) coerentes com o DESIGN.md. O resíduo
fora da marca está concentrado no bloco `auth-page-shell` / `profile-page-shell`
no `globals.css` e em alguns inline colors de `AuthCard.tsx` / `ProfilePanel.tsx`.

## Design language (referência: home + anunciar-carro + DESIGN.md)

- **Accent:** chartreuse `#D4F576` (hover `#C8E64E`); usado com parcimônia (≤10% da tela — "Chartreuse Rule").
- **Dark:** ink `#1A1A1A` para texto principal e CTAs escuros.
- **Neutros:** marble `#F5F5F5` (fundo de página), white `#FFFFFF` (surface), text-secondary `#3A3A3A`, text-tertiary `#6F6F6F`.
- **Tipografia:** heading via `--font-heading`, body via `--font-sans`; botões `rounded-full`.
- **Elevation:** superfícies planas em repouso; sombra só em hover/focus ("Flat Rule").
- **Focus ring:** `0 0 0 3px rgba(212,245,118,0.5)` (chartreuse) — conforme DESIGN.md.
- **Pill/badge:** chartreuse com fundo translúcido (`rgba(212,245,118,0.12)`) e borda `1px solid rgba(212,245,118,0.2)`, texto chartreuse.
- **Assinatura do anunciar-carro:** CTA chartreuse (já coberto por `.btn-primary`).

## Decisões aprovadas

- **Hero das páginas de conta:** CLARO — card de hero com `surface-strong` (branco), título em ink `#1A1A1A`, pill chartreuse. Não usar hero escuro.
- **Acento único:** chartreuse `#D4F576` para todos os destaques ("é grátis", chip "Conta ativa", pill do hero, topline). Não usar verde trust `#16855C` como segundo acento. Vermelho de erro permanece semântico.

## Alterações

### 1. `src/app/globals.css` — bloco `auth-page-shell` / `profile-page-shell` (linhas ~3419–3670)

| Seletor | Antes | Depois |
|---|---|---|
| `.auth-hero-kicker` (bg/border/color) | íris `rgba(90,71,209,…)` / texto `--iris` | pill chartreuse: `rgba(212,245,118,0.12)` bg, `1px solid rgba(212,245,118,0.2)`, cor `var(--chartreuse)` |
| `.auth-hero-copy` | `#52607A` (slate) | `var(--text-secondary)` (`#3A3A3A`) ou `#6F6F6F` |
| `.auth-hero-point span` | `#52607A` | `#6F6F6F` (`--text-tertiary`) |
| `.auth-card-shell::before` (gradiente do topo) | `linear-gradient(90deg, chartreuse, lavender, iris)` | `var(--chartreuse)` sólido (ou degradê chartreuse→`--color-accent-hover`) |
| `.auth-card-topline span:last-child` | `var(--iris)` | `var(--chartreuse)` |
| `.profile-action-card:hover` (border) | `rgba(90,71,209,.18)` | `rgba(212,245,118,.4)` (chartreuse) |
| `.input:focus` (box-shadow) | `0 0 0 3px rgba(90,71,209,0.15)` (roxo) | `0 0 0 3px rgba(212,245,118,0.5)` (chartreuse) — corrige o site inteiro |
| `.profile-panel-chip` (se definido) | cor atual | pill chartreuse |

Mantém: layout 2-colunas `auth-page-grid` (funcional para auth), `surface-strong`, raios arredondados, grid pattern não aplicado aqui.

### 2. `src/components/marketplace/AuthCard.tsx`

- Títulos `text-[#0A0A0A]` → `var(--ink)` / `#1A1A1A` (quase igual, mas padroniza).
- "é grátis" `text-[#16855C]` → `text-[#D4F576]` / `var(--chartreuse)`.
- Copy `text-[#52607A]` → `text-[#6F6F6F]` / `var(--text-secondary)`.
- Labels `text-[#525252]` → `text-[#6F6F6F]`.
- Mantém `btn btn-primary` (já chartreuse+ink) e `input auth-icon-input` (focus vira chartreuse via item 1).
- Verde de sucesso (`#10B981`) e vermelho de erro (`#DC2626`) permanecem (semânticos). Opcional: sucesso → trust `#16855C`.

### 3. `src/components/marketplace/ProfilePanel.tsx`

- `.profile-panel-chip` "Conta ativa" → pill chartreuse (definir/ajustar no globals ou inline).
- Labels `text-[#525252]` → `text-[#6F6F6F]`.
- Avatar fallback `text-[#8A95A8]` e helper `text-[#8A95A8]` → `var(--text-tertiary)` `#6F6F6F`.
- Botões já chartreuse (`btn btn-primary`, `btn btn-secondary`); manter.
- Erro vermelho / sucesso verde: manter semantics.

### 4. Páginas (`cadastro`, `entrar`, `minha-conta`)

Apenas reposicionar/confirmar uso das classes já ajustadas acima. Nenhuma reescrita estrutural — o copy já diz "mesmo sistema visual da home". Se necessário, trocar `auth-hero-kicker`/hero para refletir o pill chartreuse (já coberto no CSS).

## Fora de escopo

- Páginas de conteúdo (`carros-a-venda`, `marcas`, `rankings`, `qual-carro`, `melhor-carro-aplicativo`, `carros-usados-bh`) — já usam `fingen-*`.
- Páginas SEO (`vender-carro*`, `anunciar-carro-bh`, `anunciar-seminovo`) — já via `SEOPageClient`.
- Fluxo `/anunciar-carro/fluxo` — referência, não alterado.

## Critérios de sucesso

- `cadastro`, `entrar`, `minha-conta` usam exclusivamente chartreuse como acento (sem íris/lavanda/verde espalhados), com ink/neutros Carbi e focus ring chartreuse.
- `npm run build` e `npm run lint` (escopo atual) passam.
- Visual consistente com home/anunciar-carro quando navegado no browser.
