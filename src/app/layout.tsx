import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import './globals.css'
import ClientShell from '@/components/layout/ClientShell'

const font = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'CarDecision.br — Descubra o carro certo para você',
  description: 'Compare carros, descubra o melhor para seu perfil e tome a melhor decisão de compra. Dados reais de consumo, preço e segurança.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={font.className} style={{ background: 'var(--color-bg)' }}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  )
}
