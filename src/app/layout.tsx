import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import ClientShell from '@/components/layout/ClientShell'
import { OrganizationSchema } from '@/components/seo/JSONLD'

const font = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const fontHeading = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'),
  title: {
    default: 'carbi — O marketplace premium que entende de carro',
    template: '%s | carbi',
  },
  description: 'Explore milhares de anúncios verificados, compare especificações técnicas e encontre o carro ideal com dados reais de mercado.',
  keywords: ['comprar carro', 'anúncios de carros', 'carros usados', 'carros novos', 'tabela fipe', 'avaliação de carros'],
  authors: [{ name: 'Equipe carbi' }],
  creator: 'carbi',
  publisher: 'carbi Inc.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'carbi',
    title: 'carbi — O marketplace premium que entende de carro',
    description: 'Milhares de anúncios verificados com dados reais de mercado. Encontre, compare e negocie o carro ideal.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'carbi — Marketplace Automotivo Premium',
    description: 'Milhares de anúncios verificados com dados reais de mercado. Encontre, compare e negocie o carro ideal.',
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
    <html lang="pt-BR" className={`${font.variable} ${fontHeading.variable}`}>
      <body className={font.className}>
        <OrganizationSchema />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  )
}
