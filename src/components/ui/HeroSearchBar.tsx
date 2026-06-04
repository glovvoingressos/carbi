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
    <div className="relative w-full max-w-2xl mx-auto z-50" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center bg-white border border-[#EAEAE8] rounded-full pl-5 pr-2 py-2 transition-all duration-200 ${
            isOpen ? 'rounded-b-none border-b-transparent' : 'hover:border-[#D4D4D4]'
          }`}
        >
          <Search className="w-[18px] h-[18px] text-[#A3A3A3] mr-3 shrink-0" strokeWidth={1.75} />
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
            className="flex-1 bg-transparent border-none outline-none text-[#0A0A0A] placeholder:text-[#A3A3A3] py-2 text-[15px] tracking-tight"
          />

          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false) }}
              className="p-1.5 hover:bg-[#F4F4F2] rounded-full mr-1 transition-colors"
            >
              <X className="w-4 h-4 text-[#A3A3A3]" />
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-sm"
          >
            Buscar
          </button>
        </div>
      </form>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border border-t-0 border-[#EAEAE8] rounded-b-2xl shadow-lg overflow-hidden animate-fade-in">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading && suggestions.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-[#A3A3A3]">
                <Loader2 className="w-5 h-5 animate-spin mb-2" />
                <p className="text-[13px] font-medium tracking-tight">Buscando...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-2">
                <p className="px-5 py-2 eyebrow">Sugestões</p>
                {suggestions.map((s, i) => (
                  <button
                    key={s.brandSlug + '-' + s.slug}
                    onClick={() => handleSelect(s)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center px-5 py-2.5 gap-3 transition-colors text-left ${
                      activeIndex === i ? 'bg-[#FAFAF9]' : 'bg-transparent'
                    }`}
                  >
                    <div className="w-12 h-9 bg-[#FAFAF9] rounded-lg flex items-center justify-center overflow-hidden border border-[#EAEAE8] shrink-0">
                      {s.image ? (
                        <img src={s.image} alt={s.model} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Car className="w-4 h-4 text-[#A3A3A3]" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#0A0A0A] truncate tracking-tight">
                        <span className="text-[#A3A3A3] font-normal mr-1">{s.brand}</span>
                        {s.model}
                      </p>
                      <p className="text-[12px] text-[#A3A3A3] tracking-tight">{s.year}{s.price ? ` · R$ ${s.price.toLocaleString('pt-BR')}` : ''}</p>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-all shrink-0 ${activeIndex === i ? 'text-[#0A0A0A] translate-x-0.5' : 'text-[#EAEAE8]'}`} strokeWidth={1.75} />
                  </button>
                ))}

                <button
                  onClick={() => router.push(`/rankings?q=${encodeURIComponent(query)}`)}
                  className="w-full py-3 px-5 text-[13px] font-medium text-[#0A0A0A] hover:bg-[#FAFAF9] flex items-center justify-between border-t border-[#EAEAE8] mt-1"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" strokeWidth={1.75} />
                    Ver todos para &ldquo;{query}&rdquo;
                  </span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-[#A3A3A3]">
                <p className="text-[14px] font-medium mb-1 text-[#0A0A0A]">Nenhum resultado encontrado</p>
                <p className="text-[12px]">Tente buscar por marca, modelo ou segmento.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
