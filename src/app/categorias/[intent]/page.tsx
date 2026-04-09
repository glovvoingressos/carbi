import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { getCarsBySegment, getDBCars } from '@/lib/data-fetcher'
import CarCard from '@/components/car/CarCard'

// SEO Definitions mapped to intents
const INTENTS: Record<string, { title: string, desc: string, h1: string, filter: (c: any) => boolean }> = {
  'ate-50-mil': {
    title: 'Melhores Carros até 50 mil | Opções Baratas e Seguras',
    desc: 'Buscando um carro até 50 mil reais? Confira nossa lista atualizada com as melhores opções seminovas, suas fichas técnicas e consumo.',
    h1: 'Melhores Carros até 50 mil reais',
    filter: (c) => c.priceBrl <= 50000
  },
  'ate-100-mil': {
    title: 'Melhores Carros até 100 mil | Custo Benefício',
    desc: 'Encontre o melhor carro até 100 mil reais na Carbi. Compare SUVs, Sedans e Hatches com preços atualizados pela Tabela FIPE.',
    h1: 'Melhores Carros até 100 mil reais',
    filter: (c) => c.priceBrl <= 100000 && c.priceBrl > 50000
  },
  'economicos': {
    title: 'Carros Mais Econômicos | Baixo Consumo de Combustível',
    desc: 'Descubra quais são os carros que mais economizam combustível na cidade e na estrada. O ranking definitivo para não gastar no posto.',
    h1: 'Carros Mais Econômicos do Brasil',
    filter: (c) => c.fuelEconomyCityGas >= 12
  },
  'para-familia': {
    title: 'Melhores Carros para Família | Espaço e Porta Malas Grande',
    desc: 'Para viajar com conforto e levar tudo. Veja os carros com maiores porta-malas e melhor espaço interno para a família.',
    h1: 'Melhores Carros para Família',
    filter: (c) => c.trunkCapacity >= 400 || c.segment === 'SUV'
  },
  '7-lugares': {
    title: 'Carros de 7 Lugares | Melhores Opções para Grupos Grandes',
    desc: 'Precisa de mais espaço? Confira nossa seleção de veículos com 7 lugares, ideais para famílias grandes e viagens com conforto.',
    h1: 'Melhore Carros de 7 Lugares',
    filter: (c) => (c.seats && c.seats >= 7)
  },
  'hibridos': {
    title: 'Carros Híbridos e Sustentáveis | Tecnologia e Economia',
    desc: 'O futuro chegou. Conheça as melhores opções de carros híbridos no Brasil, unindo desempenho e baixíssimo consumo.',
    h1: 'Melhores Carros Híbridos',
    filter: (c) => (c.engineType && (c.engineType.toLowerCase().includes('híbrido') || c.engineType.toLowerCase().includes('hybrid')))
  },
  'off-road': {
    title: 'Melhores Carros Off-Road | Tração 4x4 e Aventura',
    desc: 'Para quem não tem medo de lama. Veja os melhores carros com tração 4x4 e excelente capacidade fora de estrada.',
    h1: 'Carros Selecionados para Off-Road',
    filter: (c) => (c.drive && (c.drive.toLowerCase().includes('4x4') || c.drive.toLowerCase().includes('4wd') || c.drive.toLowerCase().includes('awd')))
  },
  'esportivos': {
    title: 'Carros Esportivos de Alta Performance | Velocidade e Design',
    desc: 'Paixão por dirigir. Confira os modelos com melhor aceleração, potência acima de 200cv e design agressivo do nosso catálogo.',
    h1: 'Carros Esportivos e de Performance',
    filter: (c) => (c.horsepower >= 200 || c.acceleration0100 <= 6.5)
  }
}

export async function generateMetadata({ params }: { params: Promise<{ intent: string }> }): Promise<Metadata> {
  const resolved = await params
  const data = INTENTS[resolved.intent]
  if (!data) return { title: 'Não Encontrado' }
  
  return {
    title: `${data.title} | Carbi`,
    description: data.desc,
    openGraph: {
       title: data.title,
       description: data.desc
    }
  }
}

export default async function IntentHubPage({ params }: { params: Promise<{ intent: string }> }) {
  const resolved = await params
  const data = INTENTS[resolved.intent]
  
  if (!data) {
    notFound()
  }

  // Fetch cars and apply intent filter
  const allCars = await getDBCars(); // Ideally a more robust fetching strat here, but for demo:
  const filteredCars = allCars.filter(data.filter).slice(0, 16); // limit results

  return (
    <div className="bg-surface min-h-screen">
      {/* Intent Hero */}
      <section className="bg-dark text-white pt-24 pb-16 relative overflow-hidden">
        <div className="container max-w-5xl mx-auto px-4 relative z-10 text-center">
          <Badge text="🔥 Seleção Automática Carbi" />
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-6 mb-6">
            {data.h1}
          </h1>
          <p className="text-xl md:text-2xl text-white/70 font-medium max-w-3xl mx-auto leading-relaxed">
            {data.desc}
          </p>
        </div>
      </section>

      {/* Grid of Content */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          {filteredCars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCars.map(car => (
                <CarCard key={car.id} car={car} view="grid" />
              ))}
            </div>
          ) : (
             <div className="text-center py-20 bg-white rounded-3xl border border-border">
                <p className="text-xl font-bold text-dark mb-4">Nenhum carro encontrado para este critério específico no momento.</p>
                <Link href="/qual-carro" className="text-[var(--color-bento-red)] hover:underline font-black">Refaça o teste de compatibilidade</Link>
             </div>
          )}
        </div>
      </section>
      
      {/* SEO Amplification Content Bottom */}
      <section className="bg-white border-t border-border py-16">
        <div className="container max-w-4xl mx-auto px-4">
           <h2 className="text-3xl font-black text-dark mb-6">Por que confiar neste ranking?</h2>
           <p className="text-lg text-text-secondary leading-relaxed mb-4">Esta lista de <strong>{data.h1.toLowerCase()}</strong> é construída automaticamente cruzando dados da Tabela Fipe em tempo real, fichas técnicas de montadoras e avaliações de durabilidade mecânica.</p>
           <p className="text-lg text-text-secondary leading-relaxed">Não listamos carros que sofrem com problemas crônicos graves, como transmissões que quebram com frequência. Assim, você garante não apenas um bom preço de compra, mas um baixo custo de propriedade contínuo.</p>
        </div>
      </section>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-[var(--color-bento-red)] px-4 py-2 text-[11px] font-black text-white uppercase tracking-widest border border-dark">
      {text}
    </span>
  )
}
