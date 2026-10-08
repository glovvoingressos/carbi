import type { ReactNode } from 'react'
import { heroFont } from '@/components/home/home-font'
import './truck.css'

/**
 * Área de caminhões: identidade própria (aço + âmbar), mesma fonte Barlow
 * Condensed usada no resto do site. O wrapper .truck-site escopa o truck.css,
 * então nada aqui vaza para as páginas de carro.
 */
export default function CaminhoesLayout({ children }: { children: ReactNode }) {
  return <div className={`truck-site ${heroFont.variable}`}>{children}</div>
}
