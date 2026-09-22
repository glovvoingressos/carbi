import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Qual carro combina com você?',
  description: 'Encontre carros anunciados que combinam com seu orçamento, rotina e prioridades.',
  alternates: { canonical: '/qual-carro' },
}

export default function QualCarroLayout({ children }: { children: React.ReactNode }) {
  return children
}
