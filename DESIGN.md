---
name: Carbi
description: Marketplace moderno de seminovos com estética fintech automotiva
colors:
  primary: "#C8F45A"
  primary-hover: "#B8E84A"
  forest: "#1A2F1E"
  forest-hover: "#2D3D32"
  lavender: "#C9B8FF"
  iris: "#5A47D1"
  coral: "#FF6B52"
  mint: "#39E09B"
  marble: "#F5F4F0"
  white: "#FBFBF9"
  ink: "#1E2330"
  text-secondary: "#3A3A3A"
  text-tertiary: "#6F6B61"
  trust: "#16855C"
  danger: "#DC2626"
  warning: "#F59E0B"
typography:
  display:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(36px, 5vw, 64px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(28px, 3.5vw, 44px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, DM Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.3px"
  mono:
    fontFamily: "Plus Jakarta Sans, DM Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
rounded:
  xs: "10px"
  sm: "14px"
  md: "18px"
  lg: "24px"
  xl: "30px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  4xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "10px 22px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "10px 22px"
  button-forest:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "10px 22px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "10px 22px"
  card-block:
    backgroundColor: "{colors.lavender}"
    textColor: "{colors.ink}"
    rounded: "32px"
    padding: "48px 40px"
  search-bar:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "6px"
---

# Design System: Carbi

## 1. Overview

**Creative North Star: "Fintech Automotiva"**

A Carbi combina a confiança e clareza de uma fintech com a paixão do universo automotivo. O sistema visual é minimalista e funcional — cada elemento existe por uma razão, sem decoração vazia. A estética é plana com camadas tonais, onde profundidade vem de contraste de cor, não de sombras pesadas.

Superfícies em tons quentes e neutros (marble, white) criam um ambiente acolhedor. Acentos vibrantes (chartreuse, lavender, iris) trazem energia sem poluição visual. Tipografia forte e clara guia o olhar para onde importa: dados, preços e ações.

O sistema rejeita explicitamente a estética de sites de concessionárias tradicionais: sem hierarquia fraca, sem excesso de texto, sem visual genérico. Cada屏面é pensada para uma decisão clara.

**Key Characteristics:**
- Mobile-first com container responsivo (1320px max)
- Cantos arredondados generosos (14-32px)
- Paleta restrita com acentos pontuais
- Tipografia DM Sans com hierarquia clara
- Sombras mínimas, profundidade por camadas de cor
- Uma ação principal por屏面

## 2. Colors

Paleta vibrante mas controlada, com tons quentes como base e acentos frios para destaque.

### Primary
- **Chartreuse** (#C8F45A): Cor de destaque principal. Usada em CTAs, badges de preço, indicadores positivos. Rara mas impactante — sua raridade é o ponto.

### Secondary
- **Lavender** (#C9B8FF): Cards de features, seções de anúncio, badges de estado. Traz suavidade sem perder personalidade.

### Tertiary
- **Iris** (#5A47D1): Links, ícones interativos, elementos de navegação. Confiança e sofisticação.

### Neutral
- **Ink** (#1E2330): Texto principal, fundo de botões escuros, elementos de alta confiança.
- **Forest** (#1A2F1E): Hero sections, fundos escuros, botões primários invertidos.
- **Marble** (#F5F4F0): Fundo principal, superfícies neutras.
- **White** (#FBFBF9): Cards elevados, modais, sobreposições.

### Semantic
- **Trust** (#16855C): Preços, status verificado, indicadores positivos.
- **Coral** (#FF6B52): Alertas de oportunidade, badges "abaixo da FIPE".
- **Mint** (#39E09B): Ações secundárias, micro-interações.

### Named Rules
**The Chartreuse Rule.** O acento chartreuse é usado em ≤10% de qualquer屏面. Sua raridade é o ponto — quando aparece, é para guiar a ação principal.

## 3. Typography

**Display Font:** DM Sans (com system-ui fallback)
**Body Font:** DM Sans (com system-ui fallback)
**Label/Mono Font:** Plus Jakarta Sans (com DM Sans fallback)

**Character:** Tipografia sans-serif moderna com personalidade. DM Sans traz calidez sem ser ingênua; Plus Jakarta Sans adiciona precisão técnica para labels e dados. Hierarquia forte baseada em peso e tamanho, não em família.

### Hierarchy
- **Display** (700, clamp(36px, 5vw, 64px), 1.05): Headlines de hero, títulos de seção principal.
- **Headline** (700, clamp(28px, 3.5vw, 44px), 1.1): Títulos de seção, cards grandes.
- **Title** (600, 22px, 1.3): Títulos de componente, cards médios.
- **Body** (400, 16px, 1.6): Texto corrido, descrições, parágrafos.
- **Label** (600, 13px, 1.4, 0.3px): Badges, tags, metadados, navigation labels.
- **Mono** (500, 13px): Códigos, preços small, dados técnicos.

### Named Rules
**The One Weight Rule.** Pesos de 400 a 700 cobrem todo o spectrum. Nunca usar below 400 (thin) ou above 800 (black). A hierarquia vem de tamanho + peso, não de família diferente.

## 4. Elevation

Sistema flat com camadas tonais. Profundidade é comunicada por contraste de cor e sobreposição de superfícies, não por sombras estruturais.

### Shadow Vocabulary
- **Ambient Low** (0 2px 0 rgba(23,23,15,0.14)): Bordas sutis em cards em repouso.
- **Elevated** (0 8px 0 rgba(23,23,15,0.08), 0 18px 36px rgba(23,23,15,0.08)): Cards em hover, modais, dropdowns.
- **Focus Ring** (0 0 0 4px rgba(217,248,95,0.60)): Indicador de foco acessível.

### Named Rules
**The Flat-By-Default Rule.** Superfícies são planas em repouso. Sombras aparecem apenas como resposta a estado (hover, elevação, foco). Nunca sombras decorativas.

## 5. Components

### Buttons
- **Shape:** Full round (9999px radius)
- **Primary:** Background chartreuse (#C8F45A), texto ink (#1E2330), padding 10px 22px
- **Hover:** Background #B8E84A, translateY(-1px)
- **Forest:** Background forest (#1A2F1E), texto chartreuse
- **Ghost:** Transparente, borda 1.5px solid rgba(0,0,0,0.18)

### Cards
- **Corner Style:** 32px radius generoso
- **Background:** Lavender (#C9B8FF), Lime, ou Iris (#5A47D1)
- **Shadow Strategy:** Flat por padrão, elevated no hover com translateY(-4px)
- **Internal Padding:** 48px 40px

### Search Bar
- **Shape:** Full round (9999px)
- **Background:** White (#FBFBF9)
- **Shadow:** 0 4px 40px rgba(0,0,0,0.3)
- **Input:** Sem borda, fundo transparente, padding 18px 24px
- **Button:** Chartreuse background, padding 12px 28px

### Navigation
- **Style:** Logo à esquerda, links centralizados, botões à direita
- **Typography:** Logo em mono (22px, 500), links em body (15px, 500)
- **Links:** Padding 8px 14px, radius 100px, hover com background sutil
- **Mobile:** Links ocultos, botões condensados

### Chips / Tags
- **Style:** Background marble ou cor semântica, border-radius full
- **Padding:** 8px 16px
- **Typography:** Label (13px, 600)

## 6. Do's and Don'ts

### Do:
- **Do** usar chartreuse como acento principal em ≤10% da屏面
- **Do** manter hierarquia clara com peso e tamanho de tipografia
- **Do** usar cantos arredondados generosos (14-32px) em todos os cards
- **Do** manter contraste adequado para acessibilidade (WCAG AA)
- **Do** usar mobile-first com container responsivo (1320px max)
- **Do** priorizar uma ação principal por屏面

### Don't:
- **Don't** usar sombras decorativas — sombras só em estado (hover, focus)
- **Don't** poluir a屏面 com múltiplos acentos coloridos
- **Don't** copiar a estética de sites de concessionárias tradicionais (visual genérico, sem hierarquia)
- **Don't** usar tipografia thin (below 400) ou black (above 800)
- **Don't** criar hierarquia com família de fonte diferente — usar peso e tamanho
- **Don't** exceder 3 cores por屏画面exceto na paleta semântica
