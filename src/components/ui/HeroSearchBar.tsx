'use client'

export default function HeroSearchBar() {
  return (
    <form
      action="/rankings"
      method="get"
      role="search"
      aria-label="Buscar veículos"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#FFFFFF',
        borderRadius: '99px',
        padding: '6px 6px 6px 24px',
        border: '1.5px solid var(--color-border-solid)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
        width: '100%',
        maxWidth: '460px',
        marginInline: 'auto'
      }}
    >
      <input
        type="search"
        name="q"
        placeholder="Buscar por marca, modelo..."
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 15,
          color: 'var(--color-text)',
          fontWeight: 500,
        }}
        aria-label="Campo de busca de veículos"
      />
      <button
        type="submit"
        style={{ 
          height: 48, 
          borderRadius: '99px',
          background: 'var(--color-bento-yellow)',
          color: 'var(--color-dark)',
          fontWeight: 700,
          fontSize: 14,
          padding: '0 24px',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        Buscar agora
      </button>
    </form>
  )
}
