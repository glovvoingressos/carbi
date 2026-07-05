'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export default function SearchBar({ placeholder = 'Busque por marca, modelo ou cidade…', className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      setError('Digite algo para buscar')
      return
    }
    if (trimmed.length < 2) {
      setError('Digite pelo menos 2 caracteres')
      return
    }
    setError('')
    router.push(`/carros-a-venda?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form className={`ref-search-bar ${isFocused ? 'focused' : ''} ${error ? 'has-error' : ''} ${className}`} onSubmit={handleSubmit}>
      <input
        name="q"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setError('') }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Buscar carros"
        aria-invalid={!!error}
        aria-describedby={error ? 'search-error' : undefined}
      />
      <button type="submit">Buscar</button>
      {error && <div id="search-error" className="ref-search-error" role="alert">{error}</div>}
    </form>
  )
}
