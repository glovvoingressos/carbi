'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface SearchBarMobileProps {
  placeholder?: string
  defaultValue?: string
  onSearch?: (query: string) => void
}

export default function SearchBarMobile({ 
  placeholder = 'Buscar marca, modelo...',
  defaultValue = '',
  onSearch 
}: SearchBarMobileProps) {
  const [query, setQuery] = useState(defaultValue)
  const router = useRouter()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(query)
    } else if (query.trim()) {
      router.push(`/carros-a-venda?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="search-bar-mobile">
      <Search size={20} color="#6F6F6F" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar veículos"
      />
      <button type="submit" aria-label="Buscar">
        <Search size={18} color="#1A1A1A" />
      </button>
    </form>
  )
}
