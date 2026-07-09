'use client'

import { Search, MapPin } from 'lucide-react'

export default function SearchBar({ className = '' }: { className?: string }) {
  return (
    <div className={`search-bar ${className}`}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.84)', border: '1px solid var(--color-border)' }}
      >
        <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--color-action)' }} />
      </div>
      <label htmlFor="search-bar-input" className="sr-only">Buscar marca ou modelo</label>
      <input id="search-bar-input" type="text" placeholder="Buscar marca ou modelo..." aria-label="Buscar marca ou modelo" />
      <button className="btn-accent flex-shrink-0" style={{ height: 34, padding: '0 16px', fontSize: 12, borderRadius: '9999px' }} aria-label="Buscar">
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Buscar</span>
      </button>
    </div>
  )
}
