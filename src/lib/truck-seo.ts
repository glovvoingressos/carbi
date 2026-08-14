import type { Metadata } from 'next'

export function truckListingMetadata(path = '/caminhoes'): Metadata {
  return {
    title: 'Caminhões à venda | Carbi',
    description: 'Encontre caminhões usados e seminovos à venda, compare preços e negocie com segurança na Carbi.',
    keywords: ['caminhões à venda', 'caminhão usado', 'caminhão seminovo', 'comprar caminhão'],
    alternates: { canonical: path },
    openGraph: { title: 'Caminhões à venda | Carbi', description: 'Caminhões usados e seminovos com negociação segura.', url: path, type: 'website' },
  }
}
