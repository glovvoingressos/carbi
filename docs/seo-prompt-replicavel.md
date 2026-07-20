# Prompt SEO Replicável — Marketplace / Site Institucional

> Use este prompt com outra IA para implementar SEO completo em qualquer site. Troque `[SETOR]`, `[NICHO]`, `[CIDADE]` e `[DOMÍNIO]` pelo seu contexto.

---

## Prompt para a IA

```
Você é um especialista em SEO técnico para Next.js (App Router). Vai implementar SEO completo em um site do setor de [SETOR], nicho de [NICHO], domínio [DOMÍNIO]. Siga EXATAMENTE a estratégia abaixo — foi testada e gera tráfego orgânico real.

## 1. META TAGS GLOBAIS (layout.tsx)

No root layout, configure:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://[DOMÍNIO]'),
  title: {
    default: '[NOME DO SITE] | [FRASE PRINCIPAL COM KEYWORD]',
    template: '%s | [NOME DO SITE]',
  },
  description: '[Description com keyword principal + USP em até 155 chars]',
  keywords: ['keyword1', 'keyword2', 'keyword3', 'keyword4', 'keyword5'],
  authors: [{ name: '[Nome da empresa]' }],
  icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: '[NOME]',
    title: '[Título OpenGraph]',
    description: '[Description OpenGraph]',
  },
  twitter: {
    card: 'summary_large_image',
    title: '[Título Twitter]',
    description: '[Description Twitter]',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
```

## 2. JSON-LD STRUCTURED DATA

Crie `src/components/seo/JSONLD.tsx` com estes schemas:

### a) OrganizationSchema (no layout.tsx, global)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[NOME]",
  "url": "[URL]",
  "logo": "[URL]/logo.png",
  "sameAs": ["https://instagram.com/[user]", "https://facebook.com/[user]"]
}
```

### b) WebSiteSchema (no layout.tsx, global)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "[NOME]",
  "url": "[URL]",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "[URL]/busca?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### c) Product/OfferSchema (em cada página de item)
Para cada item do catálogo/produto/listagem, adicione:
```json
{
  "@context": "https://schema.org",
  "@type": "[Product/Car/Service]",
  "name": "[Nome do item]",
  "description": "[Descrição]",
  "brand": { "@type": "Brand", "name": "[Marca]" },
  "offers": {
    "@type": "Offer",
    "price": "[Preço]",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock",
    "url": "[URL do item]"
  }
}
```

### d) BreadcrumbSchema (em todas as páginas internas)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "[URL]/" },
    { "@type": "ListItem", "position": 2, "name": "[Categoria]", "item": "[URL]/[categoria]" },
    { "@type": "ListItem", "position": 3, "name": "[Item]", "item": "[URL]/[item]" }
  ]
}
```

### e) FAQSchema (em páginas de conversão)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Pergunta frequente]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Resposta completa e natural]"
      }
    }
  ]
}
```

## 3. METADATA DINÂMICA POR PAGINA (generateMetadata)

### Página de listagem/detalhe (ex: /produtos/[slug])
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const item = await getItemBySlug(params.slug)
  return {
    title: `${item.name} | Comprar [item] com [diferencial] na [NOME]`,
    description: `Comprar ${item.name} [atributos] em [local]. [Diferencial].`,
    keywords: ['comprar [item]', `[item] [atributo]`, `[item] em [local]`],
    alternates: { canonical: `/produtos/${item.slug}` },
    openGraph: {
      title: `[Título OG]`,
      description: `[Description OG]`,
      url: `/produtos/${item.slug}`,
      type: 'website',
    },
  }
}
```

### Página de categoria (ex: /marcas/[brand])
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `[Marca] | [Ação] [Item] [Diferencial]`,
    description: `[Marca] [Ação] [Item] [Diferencial]. [Quantidade] [itens] disponíveis.`,
    keywords: [`[marca] [item]`, `[marca] [ação]`, `[item] [marca]`],
    alternates: { canonical: `/marcas/${params.brand}` },
  }
}
```

### Página institucional de SEO (ex: /vender-carro)
```tsx
export const metadata: Metadata = {
  title: '[Keyword principal] | [Ação] [Item] [Diferencial]',
  description: '[Description com keyword + CTA]',
  keywords: ['[kw1]', '[kw2]', '[kw3]'],
  alternates: { canonical: '/[slug-seo]' },
  robots: { index: true, follow: true },
}
```

## 4. SITEMAP DINÂMICO (sitemap.ts)

Crie um sitemap que gera URLs automaticamente:

```tsx
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Páginas core (home, categorias principais)
  const CORE_PAGES = [
    { path: '/', priority: 1.0, freq: 'daily' },
    { path: '/[pagina-principal]', priority: 1.0, freq: 'daily' },
    { path: '/[acao-1]', priority: 0.95, freq: 'weekly' },
  ]

  for (const { path, priority, freq } of CORE_PAGES) {
    entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date(), changeFrequency: freq, priority })
  }

  // Páginas de item (geradas do banco/dados)
  const items = await getAllItems()
  for (const item of items) {
    entries.push({
      url: `${SITE_URL}/[itens]/${item.slug}`,
      lastModified: new Date(item.updated_at),
      changeFrequency: 'daily',
      priority: 0.9,
    })
  }

  // Páginas de categoria (geradas dos dados)
  const categories = await getAllCategories()
  for (const cat of categories) {
    entries.push({
      url: `${SITE_URL}/[categorias]/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  // Páginas SEO programáticas (ex: por cidade, marca, faixa de preço)
  const seoPages = await getSeoSlugs()
  for (const slug of seoPages) {
    entries.push({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    })
  }

  return entries
}
```

## 5. ROBOTS.TXT (robots.ts)

```tsx
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/minha-conta/', '/admin/', '/conta/'],
    },
    sitemap: [`${SITE_URL}/sitemap.xml`],
  }
}
```

## 6. PÁGINAS SEO PROGRAMÁTICAS

Crie páginas temáticas que captam buscas de cauda longa:

- `/[acao]-[item]` → "vender carro", "comprar apartamento"
- `/[acao]-[item]-[cidade]` → "vender carro são paulo"
- `/[acao]-[item]-rapido` → "vender carro rápido"
- `/[item]-usados-[cidade]` → "carros usados bh"
- `/categorias/[intencao]` → "ate-50-mil", "para-familia", "economicos"
- `/marcas` → listagem de todas as marcas
- `/marcas/[marca]` → página dedicada por marca
- `/[marca]/[modelo]` → página dedicada por modelo

Cada página tem:
- Title + description únicos com keyword
- H1 com keyword principal
- Conteúdo SEO (textos, FAQs, benefícios)
- JSON-LD adequado (Breadcrumb, FAQ, Product)
- Links internos para itens relacionados

## 7. COMPONENTES REUTILIZAVEIS

Crie estes componentes em `src/components/seo/`:

### SEOContentSection.tsx
- `SEOSection` — seção com título, subtítulo, badge, conteúdo e imagem opcional
- `FAQSection` — lista de FAQs com JSON-LD automático
- `BenefitGrid` — grid de benefícios com ícones
- `SEOCallToAction` — CTA final com botão

### SEOPageClient.tsx
- Componente client que monta a página SEO completa: hero → benefits → sections → FAQ → CTA

### MetaTags.tsx
- Helper `generateMetadata()` que retorna title, description, openGraph, twitter

## 8. ESTRUTURA DE URLs

Use URLs limpas e descritivas:
- `/[itens]/[slug-do-item]` — detalhe do item
- `/[itens]` — listagem geral
- `/[categorias]/[slug]` — categoria
- `/[marcas]` — listagem de marcas
- `/[marcas]/[marca]` — página da marca
- `/[marca]/[modelo]` — página do modelo
- `/[acao]-[item]` — landing page SEO

NUNCA use IDs nas URLs. Sempre slugs legíveis.

## 9. OTIMIZAÇÕES TÉCNICAS

- **Fontes:** Use `next/font/google` com `display: 'swap'` e CSS variables
- **Imagens:** Use `next/image` com `alt` descritivo, `width`, `height`, e `priority` para above-the-fold
- **Scripts:** Use `next/script` com `strategy="afterInteractive"` para analytics
- **Cache:** Use `next: { revalidate: 3600 }` em fetches de dados externos
- **Lazy loading:** Componentes below-the-fold devem ser dinâmicos ou carregados sob demanda
- **Canonical:** Defina `alternates.canonical` em TODA página
- **Lang:** Use `<html lang="pt-BR">`

## 10. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Metadata global no layout.tsx
- [ ] Organization + WebSite JSON-LD no layout
- [ ] generateMetadata dinâmico em TODAS as páginas de item
- [ ] generateMetadata em TODAS as páginas de categoria
- [ ] Metadata estático em páginas institucionais
- [ ] BreadcrumbSchema em páginas internas
- [ ] Product/OfferSchema em páginas de item
- [ ] FAQSchema em páginas de conversão
- [ ] Sitemap dinâmico gerado dos dados
- [ ] Robots.txt com disallow para áreas privadas
- [ ] URLs limpas (slugs, sem IDs)
- [ ] Canonical em todas as páginas
- [ ] OpenGraph + Twitter cards em todas as páginas
- [ ] H1 único com keyword principal em cada página
- [ ] Conteúdo SEO textual em páginas programáticas
- [ ] Links internos entre páginas relacionadas
- [ ] JSON-LD validado (https://search.google.com/test/rich-results)

## 11. FÓRMULA DE TITLE POR TIPO DE PAGINA

| Tipo | Fórmula |
|------|---------|
| Home | `[Nome] \| [Ação] [Item] [Diferencial]` |
| Item/Detalhe | `[Nome do Item] \| [Ação] [Item] com [Diferencial] na [Nome]` |
| Categoria | `[Categoria] \| [Ação] [Item] [Diferencial]` |
| Marca | `[Marca] \| [Ação] [Item] [Diferencial]` |
| Landing SEO | `[Keyword Principal] \| [Ação] [Item] [Diferencial]` |
| Cidade | `[Ação] [Item] em [Cidade] \| [Nome]` |

## 12. FÓRMULA DE DESCRIPTION POR TIPO DE PAGINA

| Tipo | Fórmula |
|------|---------|
| Home | `[Ação] [Item] [Diferencial]. [Quantidade] [itens] com [recurso].` |
| Item | `[Ação] [Item] [atributos] em [Local]. [Diferencial].` |
| Categoria | `[Marca/Categoria] [Ação] [Item] [Diferencial]. [Quantidade] disponíveis.` |
| Landing | `[Dor do usuário]? [Solução] na [Nome]. [Diferencial]. [CTA].` |

---

## Exemplo Prático (adapte para seu setor)

**Setor:** Imóveis
**Domínio:** www.imobifind.com.br

- Title home: `ImobiFind \| Comprar apartamento com financiamento na ImobiFind`
- Title item: `Apartamento 3 quartos Pinheiros \| Comprar com financiamento na ImobiFind`
- Title landing: `Comprar apartamento São Paulo \| ImobiFind`
- JSON-LD: `RealEstateListing` com `Offer`
- Sitemap: `/apartamentos/[slug]`, `/bairros/[bairro]`, `/comprar-apartamento-[cidade]`
- FAQs: "Como financiar?", "Qual a entrada mínima?", "Documentos necessários?"
```

---

## Notas de Uso

1. **Adapte os tipos de schema** ao seu setor (Product, Car, RealEstateListing, JobPosting, etc.)
2. **Gere páginas programáticas** para todas as combinações relevantes (cidade, marca, faixa de preço, etc.)
3. **Cada página precisa de conteúdo textual único** — não use a mesma descrição em páginas diferentes
4. **Valide o JSON-LD** em https://search.google.com/test/rich-results após implementar
5. **Monitore no Google Search Console** — submitted sitemap, coverage, performance
6. **Atualize o sitemap** automaticamente quando novos itens são criados
7. **Canonicals** devem apontar para a URL canônica (sem query params, sem trailing slash)
