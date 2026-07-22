'use client'

import Link from 'next/link'
import { Heart, Search } from 'lucide-react'
import { motion } from 'motion/react'

export default function FavoritosPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center mx-auto mb-5">
          <Heart className="w-7 h-7 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          Nenhum favorito ainda
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
          Salve seus carros favoritos para comparar preços e specs depois.
        </p>
        <Link
          href="/buscar"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-dark)] text-white rounded-full text-sm font-semibold hover:bg-[var(--color-dark-hover)] transition-colors"
        >
          <Search className="w-4 h-4" strokeWidth={2} />
          Buscar carros
        </Link>
      </div>
    </motion.div>
  )
}
