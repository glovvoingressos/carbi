import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PreviewClient from './PreviewClient'
import type { PreviewView } from './fixtures'

export const metadata: Metadata = {
  title: 'Preview da área do membro',
  robots: { index: false, follow: false },
}

const allowed: PreviewView[] = ['populated', 'empty', 'loading', 'error']

/**
 * Prancheta de desenvolvimento da área do membro.
 *
 * Fora de dev a rota não existe (404) e, mesmo existindo, já está sob
 * `/minha-conta/` — disallow no robots e fora do sitemap.
 */
export default async function DesignPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; tab?: string }>
}) {
  if (process.env.NODE_ENV === 'production') notFound()

  const sp = await searchParams
  const view = allowed.includes(sp.view as PreviewView) ? (sp.view as PreviewView) : 'populated'

  return <PreviewClient view={view} tab={sp.tab} />
}
