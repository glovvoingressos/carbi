import { redirect } from 'next/navigation'

export default function AnunciarCarroPage() {
  redirect('/entrar?redirect=/anunciar-carro/fluxo')
}
