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
      } catch {
        console.error('Search error')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/carros-a-venda?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative z-50 mx-auto w-full max-w-3xl" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <div
          className={`flex min-w-0 items-center rounded-full border-2 border-[#17170F]/18 bg-white pl-4 pr-2 py-2 shadow-sm transition-all duration-200 max-[380px]:pl-3 max-[380px]:py-1.5 ${
            isOpen ? 'rounded-b-none border-b-transparent' : 'hover:border-[#17170F]/30'
          }`}
        >
          <Search className="mr-2 h-[18px] w-[18px] shrink-0 text-[#17170F] max-[380px]:mr-1.5 max-[380px]:h-4 max-[380px]:w-4" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(-1)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder="Busque por marca ou modelo..."
            className="min-w-0 flex-1 border-none bg-transparent py-2 text-[15px] tracking-tight outline-none placeholder:text-[#857C6B] max-[380px]:py-1.5 max-[380px]:text-[13px]"
          />

          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false) }}
              className="mr-1 rounded-full p-1.5 transition-colors hover:bg-[#D9F85F] max-[380px]:mr-0.5"
            >
              <X className="h-4 w-4 text-[#857C6B] max-[380px]:h-3.5 max-[380px]:w-3.5" />
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-sm shrink-0 px-4 shadow-sm max-[380px]:px-3 max-[360px]:px-2.5 max-[360px]:text-[12px]"
          >
            Buscar
          </button>
        </div>
      </form>

      {isOpen && (
        <div className="absolute left-0 top-full w-full overflow-hidden rounded-b-3xl border-2 border-t-0 border-[#17170F]/18 bg-white shadow-2xl animate-fade-in">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading && suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-[#857C6B] max-[380px]:p-5">
                <Loader2 className="w-5 h-5 animate-spin mb-2" />
                <p className="text-[13px] font-medium tracking-tight">Buscando...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-2">
                <p className="eyebrow px-4 py-2 max-[380px]:px-3">Sugestões</p>
                {suggestions.map((s, i) => (
                  <button
                    key={s.brandSlug + '-' + s.slug}
                    onClick={() => handleSelect(s)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors max-[380px]:gap-2 max-[380px]:px-3 ${
                      activeIndex === i ? 'bg-[#FFF8DF]' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex h-9 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/70 bg-white shadow-sm max-[380px]:h-8 max-[380px]:w-10">
                      {s.image ? (
                        <img src={s.image} alt={s.model} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Car className="h-4 w-4 text-[#857C6B]" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#17170F] truncate tracking-tight">
                        <span className="text-[#857C6B] font-normal mr-1">{s.brand}</span>
                        {s.model}
                      </p>
                      <p className="text-[12px] text-[#857C6B] tracking-tight">{s.year}{s.price ? ` · R$ ${s.price.toLocaleString('pt-BR')}` : ''}</p>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-all shrink-0 ${activeIndex === i ? 'text-[#17170F] translate-x-0.5' : 'text-[#C8BEA8]'}`} strokeWidth={1.75} />
                  </button>
                ))}

                <button
                  onClick={() => router.push(`/rankings?q=${encodeURIComponent(query)}`)}
                  className="mt-1 flex w-full items-center justify-between border-t border-[#17170F]/10 px-4 py-3 text-[13px] font-bold text-[#17170F] hover:bg-[#FFF8DF] max-[380px]:px-3"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" strokeWidth={1.75} />
                    Ver todos para &ldquo;{query}&rdquo;
                  </span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-[#857C6B] max-[380px]:p-5">
                <p className="text-[14px] font-medium mb-1 text-[#17170F]">Nenhum resultado encontrado</p>
                <p className="text-[12px]">Tente buscar por marca, modelo ou segmento.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
