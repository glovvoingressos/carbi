import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Qual carro combina com você?',
  description: 'Responda algumas perguntas sobre orçamento, uso e prioridades para encontrar carros compatíveis com seu perfil.',
  alternates: { canonical: '/qual-carro' },
  openGraph: {
    title: 'Qual carro combina com você? | Carbi',
    description: 'Encontre carros compatíveis com seu orçamento, uso e prioridades.',
    url: '/qual-carro',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qual carro combina com você? | Carbi',
    description: 'Encontre carros compatíveis com seu orçamento, uso e prioridades.',
  },
}

export default function QualCarroLayout({ children }: { children: ReactNode }) {
  return children
}
