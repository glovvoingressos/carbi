import type { Metadata } from 'next'
import { Bricolage_Grotesque, Boldonse } from 'next/font/google'
import './globals.css'
import ClientShell from '@/components/layout/ClientShell'

const font = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

const fontBoldonse = Boldonse({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'),
  title: {
    default: 'carbi — Descubra e pesquise o carro certo para você',
    template: '%s | carbi',
  },
  description: 'A ferramenta definitiva para você explorar, comparar dados técnicos e conferir a tabela FIPE do seu próximo carro. Dados em tempo real para as melhores decisões de compra.',
  keywords: ['comprar carro', 'tabela fipe', 'comparar carros', 'ficha técnica', 'carros usados', 'carros novos'],
  authors: [{ name: 'Equipe carbi' }],
  creator: 'carbi',
  publisher: 'carbi Inc.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'carbi',
    title: 'carbi — O motor de busca da sua próxima garagem',
    description: 'Tabela FIPE oficial, comparador de veículos lado a lado, e as melhores fichas técnicas do mercado. Tome decisões baseadas em dados.',
    // images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'carbi — Informações Automotivas e Preços',
    description: 'Encontre tudo sobre seu modelo de carro favorito na carbi.',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${font.variable} ${fontBoldonse.variable}`}>
      <body className={font.className} style={{ background: 'var(--color-bg)' }}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  )
}
