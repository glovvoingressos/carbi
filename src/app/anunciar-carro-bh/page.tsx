import { redirect } from 'next/navigation'

// Consolida a landing de venda de BH; o fluxo de publicação em /fluxo segue ativo.
export default function AnunciarCarroBHPage() {
  redirect('/vender-carro-bh')
}
