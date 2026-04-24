'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Car, ArrowRight, Loader2, X } from 'lucide-react'

interface Suggestion {
  brand: string
  model: string
  slug: string
  brandSlug: string
  image?: string
  year?: number
  price?: number
}

export default function HeroSearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/vehicles/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.results || [])
        setIsOpen(true)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev > -1 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        const s = suggestions[activeIndex]
        router.push(`/${s.brandSlug}/${s.slug}`)
      } else {
        router.push(`/rankings?q=${encodeURIComponent(query)}`)
      }
      setIsOpen(false)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSelect = (s: Suggestion) => {
    router.push(`/${s.brandSlug}/${s.slug}`)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto z-50" ref={containerRef}>
      <div 
        className={`flex items-center bg-white border border-black/8 rounded-[32px] px-6 py-2 transition-all duration-300 shadow-sm
          ${isOpen ? 'rounded-b-none border-b-transparent shadow-xl' : 'hover:shadow-md'}
        `}
      >
        <Search className="w-5 h-5 text-dark/30 mr-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Busque por marca ou modelo (ex: Toyota Corolla)..."
          className="flex-1 bg-transparent border-none outline-none text-dark font-medium placeholder:text-dark/30 py-3 text-base sm:text-lg"
        />
        
        {query && (
          <button 
            onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}
            className="p-2 hover:bg-black/5 rounded-full mr-2 transition-colors"
          >
            <X className="w-4 h-4 text-dark/40" />
          </button>
        )}

        <button
          onClick={() => router.push(`/rankings?q=${encodeURIComponent(query)}`)}
          className="bg-[#1a1a1a] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-opacity hidden sm:block whitespace-nowrap"
        >
          Buscar
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border border-t-0 border-black/8 rounded-b-[32px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[480px] overflow-y-auto">
            {loading && suggestions.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-dark/40">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm font-medium">Buscando na nossa garagem...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-2">
                <p className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-dark/30">Sugestões carbi</p>
                {suggestions.map((s, i) => (
                  <button
                    key={s.brandSlug + '-' + s.slug}
                    onClick={() => handleSelect(s)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center px-6 py-4 gap-4 transition-colors text-left
                      ${activeIndex === i ? 'bg-[#f5f5f3]' : 'bg-transparent'}
                    `}
                  >
                    <div className="w-16 h-10 bg-[#f5f5f3] rounded-lg flex items-center justify-center overflow-hidden border border-black/5">
                      {s.image ? (
                        <img src={s.image} alt={s.model} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Car className="w-5 h-5 text-dark/10" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-dark">
                        <span className="opacity-40 font-medium mr-1">{s.brand}</span>
                        {s.model}
                      </p>
                      <p className="text-[11px] text-dark/40 font-medium">{s.year} • A partir de R$ {(s.price || 0).toLocaleString('pt-BR')}</p>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-all duration-300 ${activeIndex === i ? 'text-dark translate-x-1' : 'text-dark/10 opacity-0'}`} />
                  </button>
                ))}
                
                <button
                  onClick={() => router.push(`/rankings?q=${encodeURIComponent(query)}`)}
                  className="w-full py-4 px-6 text-sm font-bold text-dark hover:bg-[#f5f5f3] flex items-center justify-between border-t border-black/5 mt-2"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Ver todos os resultados para "{query}"
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-12 text-center text-dark/40">
                <p className="text-sm font-medium mb-1">Nenhum veículo encontrado</p>
                <p className="text-xs">Tente buscar por marcas como Toyota, Honda ou BYD.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
