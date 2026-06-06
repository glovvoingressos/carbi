import type { Metadata } from 'next'
import { DM_Mono, DM_Sans } from 'next/font/google'
import './globals.css'
import ClientShell from '@/components/layout/ClientShell'
import { OrganizationSchema, WebSiteSchema } from '@/components/seo/JSONLD'

const font = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const fontHeading = DM_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const fontMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'),
  title: {
    default: 'Carbi | anunciar carros grátis e comprar seminovos',
    template: '%s | Carbi',
  },
  description: 'Anuncie carros grátis, compare preço com FIPE e encontre seminovos à venda com dados reais, fotos quadradas e chat interno seguro.',
  keywords: ['anunciar carros', 'anunciar carro grátis', 'seminovos à venda', 'carros à venda', 'carros usados', 'tabela fipe', 'vender carro', 'comprar carro'],
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
    siteName: 'Carbi',
    title: 'Carbi | anunciar carros grátis e comprar seminovos',
    description: 'Marketplace para anunciar carros grátis, comparar preço com FIPE e negociar seminovos com chat interno seguro.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carbi | anunciar carros grátis e comprar seminovos',
    description: 'Marketplace para anunciar carros grátis, comparar preço com FIPE e negociar seminovos com chat interno seguro.',
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
    <html lang="pt-BR" className={`${font.variable} ${fontHeading.variable} ${fontMono.variable}`}>
      <body className={font.className}>
        <WebSiteSchema />
        <OrganizationSchema />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  )
}
