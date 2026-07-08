---
name: Carbi
description: Marketplace moderno de seminovos com estética Fingen-inspired
colors:
  primary: "#D4F576"
  primary-hover: "#C8E64E"
  forest: "#1A1A1A"
  forest-hover: "#2D2D2D"
  lavender: "#C9B8FF"
  iris: "#5A47D1"
  coral: "#FF6B52"
  mint: "#39E09B"
  marble: "#F5F5F5"
  white: "#FFFFFF"
  ink: "#1A1A1A"
  text-secondary: "#3A3A3A"
  text-tertiary: "#6F6F6F"
  trust: "#16855C"
  danger: "#DC2626"
  warning: "#F59E0B"
  background: "#F5F5F5"
  surface: "#FFFFFF"
  dark: "#1A1A1A"
typography:
  display:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(36px, 8vw, 64px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(28px, 6vw, 48px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
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
  xl: "28px"
  2xl: "32px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  button-dark:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.white}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    border: "1.5px solid rgba(0,0,0,0.12)"
  search-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    border: "1px solid rgba(0,0,0,0.06)"
  card-dark:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.white}"
    rounded: "{rounded.xl}"
---

# Design System: Carbi

## 1. Overview

**Creative North Star: "Fintech Automotiva"**

A Carbi combina a confiança e clareza de uma fintech com a paixão do universo automotivo. O design é inspirado no Fingen — clean, minimalista, com foco em dados e ações claras.

**Key Characteristics:**
- Mobile-first com bottom navigation
- Balance card com número grande e badge de mudança
- Quick actions com ícones circulares
- CTA button escuro com ícone chartreuse
- Cards com Glare Card effect (hover tracking)
- Grid pattern sutil no hero
- Dark cards para dados e estatísticas

## 2. Colors

### Primary
- **Chartreuse** (#D4F576): Acento principal. CTAs, badges, indicadores positivos.
- **Chartreuse Hover** (#C8E64E): Estado hover do acento.

### Dark
- **Ink/Dark** (#1A1A1A): Texto principal, fundos escuros, CTA buttons.
- **Hover** (#2D2D2D): Estado hover de elementos escuros.

### Secondary
- **Lavender** (#C9B8FF): Cards de features, badges de estado.
- **Iris** (#5A47D1): Links, ícones interativos.

### Semantic
- **Trust** (#16855C): Status verificado, indicadores positivos.
- **Coral** (#FF6B52): Alertas, badges "abaixo da FIPE".

### Neutral
- **Background** (#F5F5F5): Fundo da página.
- **Surface** (#FFFFFF): Cards, modais.
- **Text Secondary** (#3A3A3A): Texto secundário.
- **Text Tertiary** (#6F6F6F): Texto terciário, labels.

### Named Rules
**The Chartreuse Rule.** Acento chartreuse em ≤10% da tela. Sua raridade é o ponto.

**The Flat Rule.** Superfícies planas em repouso. Sombras só em hover/focus.

## 3. Typography

**Display Font:** DM Sans (700-800)
**Body Font:** DM Sans (400-600)
**Label/Mono Font:** Plus Jakarta Sans

### Hierarchy
- **Display** (700, clamp(36px, 8vw, 64px)): Hero headlines
- **Headline** (700, clamp(28px, 6vw, 48px)): Section titles
- **Title** (700, 24px): Card titles
- **Body** (400, 16px): Paragraphs, descriptions
- **Label** (600, 13px): Badges, tags, metadata

## 4. Elevation

### Shadow Vocabulary
- **Subtle** (0 1px 2px rgba(0,0,0,0.04)): Cards em repouso
- **Elevated** (0 4px 16px rgba(0,0,0,0.08)): Cards em hover
- **Focus** (0 0 0 3px rgba(212,245,118,0.5)): Indicador de foco

### Glare Card Effect
Cards de veículos usam o efeito Glare Card do Aceternity UI:
- Brilho radial que segue o mouse
- Transição suave de opacidade
- Cria interatividade e profundidade

## 5. Components

### Balance Card (Hero)
- **Label:** "Seu próximo carro" (16px, secundário)
- **Amount:** Número grande (clamp(36px, 8vw, 64px), bold)
- **Change Badge:** Chartreuse, pill-shaped, com ícone TrendingUp
- **Subtitle:** Texto descritivo (15px, secundário)

### Quick Actions
- **Layout:** Flex, space-around
- **Icon Button:** 56px circle, border sutil
- **Label:** 13px, below icon
- **Hover:** Background chartreuse, translateY(-2px)

### CTA Button
- **Style:** Dark (#1A1A1A), full width
- **Icon:** Chartreuse circle, 44px
- **Arrow:** Right chevron
- **Dots:** 3 dots indicadores abaixo

### Car Cards (Glare Effect)
- **Border Radius:** 20px
- **Border:** 1px solid rgba(0,0,0,0.06)
- **Hover:** translateY(-4px), box-shadow
- **Glare:** Radial gradient que segue o mouse
- **Image:** 16:10 aspect ratio
- **Badge:** Chartreuse pill para "abaixo FIPE"
- **Favorite:** Heart icon, absolute position

### Dark Cards (FIPE, Stats)
- **Background:** #1A1A1A
- **Border Radius:** 28px
- **Text:** White
- **Badge:** Semi-transparent bg

### Bottom Navigation
- **Height:** 80px
- **Items:** 5 (Home, Buscar, Anunciar, Chat, Perfil)
- **Active:** Chartreuse icon + bg
- **Inactive:** Gray icon

### Grid Pattern
- **Background:** Subtle grid lines
- **Color:** rgba(212,245,118,0.15)
- **Mask:** Radial gradient
- **Transform:** skew-y-12

## 6. Do's and Don'ts

### Do:
- **Do** usar chartreuse como acento em ≤10% da tela
- **Do** usar Glare Card effect nos cards de veículos
- **Do** manter hierarchy clara com peso/tamanho
- **Do** usar dark cards para dados e estatísticas
- **Do** usar bottom navigation no mobile
- **Do** usar grid pattern sutil no hero
- **Do** manter superfícies planas em repouso

### Don't:
- **Don** usar sombras decorativas — só em hover/focus
- **Don't** poluir com múltiplos acentos
- **Don't** copiar marketplaces genéricos
- **Don't** usar glassmorphism como padrão
- **Don't** usar gradient text
- **Don't** usar border-left/right > 1px como acento
