import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ListingForm from '@/components/marketplace/ListingForm'

export const metadata: Metadata = {
  title: 'Anunciar caminhão | Carbi',
  description: 'Publique seu anúncio de caminhão gratuitamente.',
  robots: { index: false, follow: false },
}

export default function AnunciarCaminhaoPage() {
  return (
    <div className="fingen-page">
      <main className="fingen-main">
        <section className="tfp-hero" style={{ padding: '60px 0 40px' }}>
          <div className="tfp-hero-inner" style={{ maxWidth: '90%', gap: '48px' }}>
            <div className="tfp-hero-content">
              <Link href="/caminhoes" className="tfp-btn-secondary"><ArrowLeft size={16} /> Voltar</Link>
              <img src="/images/Midjourney 💅🏻.jpg" alt="Caminhão em movimento" className="w-full aspect-video sm:aspect-[21/9] object-cover rounded-2xl" />
              <div><h1 className="tfp-hero-title">Monte seu anúncio de caminhão</h1><p className="tfp-hero-sub">Consulte a placa, complete os dados e publique gratuitamente.</p></div>
            </div>
            <div><ListingForm vehicleType="truck" /></div>
          </div>
        </section>
      </main>
    </div>
  )
}
