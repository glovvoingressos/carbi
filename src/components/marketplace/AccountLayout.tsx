'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpRight, Bell, Car, ChevronDown, Heart, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Search, Settings, User, X, type LucideIcon } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import './member-workspace.css'

export interface AccountWorkspaceListing {
  id: string; title: string; brand: string; model: string; price: number; status: string
  year: number | null; year_model?: number | null; mileage?: number | null
  view_count?: number | null; created_at: string; slug: string
  images?: { public_url: string; is_primary?: boolean; sort_order?: number }[] | null
}
interface AccountLayoutProps {
  children: ReactNode
  user: { email: string; fullName: string; avatarUrl: string; phone?: string }
  stats?: { label: string; value: string | number; icon?: LucideIcon }[]
  listings?: AccountWorkspaceListing[]
  listingsError?: string | null
  onListingsRetry?: () => void
  loading?: boolean
  /** Caminho alternativo para resolver o item ativo da navegação. Só o preview de desenvolvimento usa. */
  activePath?: string
}
const navigation = [
  { href: '/minha-conta', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/minha-conta/anuncios', label: 'Meus anúncios', icon: Car },
  { href: '/minha-conta/conversas', label: 'Conversas', icon: MessageCircle },
  { href: '/minha-conta/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/minha-conta/buscas', label: 'Minhas buscas', icon: Search },
  { href: '/minha-conta/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/minha-conta/configuracoes', label: 'Configurações', icon: Settings },
]
const tabs = [
  { href: '/minha-conta', label: 'Resumo' },
  { href: '/minha-conta/anuncios', label: 'Anúncios' },
  { href: '/minha-conta/conversas', label: 'Conversas' },
  { href: '/minha-conta?tab=perfil', label: 'Meu perfil' },
  { href: '/minha-conta/configuracoes', label: 'Preferências' },
]
const statusLabels: Record<string, string> = { active: 'Publicado', paused: 'Pausado', sold: 'Vendido', archived: 'Arquivado', draft: 'Rascunho', pending: 'Em análise' }
// Um só formatador para todos os números da conta: o sidebar mostrava "1137"
// enquanto o painel de desempenho ao lado mostrava "1.137".
const accountNumberFormat = new Intl.NumberFormat('pt-BR')

function Avatar({ user, className = '' }: { user: AccountLayoutProps['user']; className?: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  return <span className={`mw-avatar ${className}`}>{user.avatarUrl && failedSource !== user.avatarUrl ? <img src={user.avatarUrl} alt="" decoding="async" onError={() => setFailedSource(user.avatarUrl)} /> : <span>{user.fullName?.trim().charAt(0).toUpperCase() || <User size={20} />}</span>}</span>
}

function VehicleThumbnail({ src }: { src?: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  return <span className="mw-vehicle-photo">{src && failedSource !== src ? <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailedSource(src)} /> : <Car size={20} />}</span>
}

function Workspace({ children, user, stats, listings, listingsError, onListingsRetry, loading = false, activePath }: AccountLayoutProps) {
  const routePath = usePathname()
  const pathname = activePath ?? routePath
  const params = useSearchParams()
  const router = useRouter()
  const [remoteListings, setRemoteListings] = useState<AccountWorkspaceListing[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(listings === undefined)
  const [portfolioError, setPortfolioError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [dialog, setDialog] = useState<'search' | 'menu' | 'account' | null>(null)
  const [query, setQuery] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const vehicles = listings ?? remoteListings
  const selected = params.get('vehicle')
  const profile = params.get('tab') === 'perfil'
  const isActive = (href: string) => href === '/minha-conta' ? pathname === href : pathname.startsWith(href)

  useEffect(() => {
    if (listings !== undefined || loading) return
    const controller = new AbortController()
    void (async () => {
      try {
        const { data, error } = await getSupabaseBrowserClient().auth.getSession()
        if (error || !data.session) throw new Error('Sessão indisponível')
        const response = await fetch('/api/marketplace/my-listings', { headers: { Authorization: `Bearer ${data.session.access_token}` }, signal: controller.signal })
        if (!response.ok) throw new Error('Não foi possível carregar os anúncios')
        const result: unknown = await response.json()
        if (!Array.isArray(result)) throw new Error('Resposta inválida')
        if (!controller.signal.aborted) setRemoteListings(result)
      } catch {
        if (!controller.signal.aborted) setPortfolioError(true)
      } finally {
        if (!controller.signal.aborted) setPortfolioLoading(false)
      }
    })()
    return () => controller.abort()
  }, [listings, loading, retry])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setDialog(value => value === 'search' ? null : 'search') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const selectVehicleHref = (id: string) => `/minha-conta?${new URLSearchParams({ vehicle: id })}`
  const retryPortfolio = () => {
    if (onListingsRetry) { onListingsRetry(); return }
    setPortfolioLoading(true)
    setPortfolioError(false)
    setRetry(value => value + 1)
  }
  const logout = async () => {
    setLoggingOut(true); setLogoutError('')
    try {
      const { error } = await getSupabaseBrowserClient().auth.signOut()
      if (error) throw error
      router.replace('/'); router.refresh()
    } catch { setLogoutError('Não foi possível sair. Tente novamente.'); setLoggingOut(false) }
  }
  const metricValues = stats?.length ? stats.slice(0, 4) : [
    { label: 'Anúncios', value: vehicles.length },
    { label: 'Publicados', value: vehicles.filter(v => v.status === 'active').length },
    { label: 'Pausados', value: vehicles.filter(v => v.status === 'paused').length },
    { label: 'Vendidos', value: vehicles.filter(v => v.status === 'sold').length },
  ]
  const metricsUnavailable = loading || (!stats?.length && !!listingsError) || (listings === undefined && (portfolioLoading || portfolioError))
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
  const matches = (text: string) => text.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
  const portfolio = <>
    <div className="mw-metrics" aria-label="Resumo da conta" aria-busy={metricsUnavailable}>{metricValues.map((metric) => <div className="mw-metric" key={metric.label}><span className="mw-metric-label"><span className="mw-metric-dot" aria-hidden="true" />{metric.label}</span><strong>{metricsUnavailable ? '—' : typeof metric.value === 'number' ? accountNumberFormat.format(metric.value) : metric.value}</strong></div>)}</div>
    <div className="mw-portfolio-title"><h2>Meus anúncios</h2><Link href="/minha-conta/anuncios" aria-label="Gerenciar todos os anúncios"><ArrowUpRight size={17} /></Link></div>
    <div className="mw-vehicle-list">
      {loading || (listings === undefined && portfolioLoading) ? <p className="mw-sidebar-note" role="status">Carregando seus veículos…</p> : listingsError || (portfolioError && listings === undefined) ? <div className="mw-sidebar-note" role="alert">{listingsError || 'Não foi possível carregar.'}<button type="button" onClick={retryPortfolio}>Tentar novamente</button></div> : vehicles.length === 0 ? <div className="mw-sidebar-note">Seu próximo anúncio começa aqui.<Link href="/anunciar-carro">Anunciar meu carro <Plus size={14} /></Link></div> : vehicles.map(vehicle => {
        const photo = [...(vehicle.images ?? [])].sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.public_url
        const active = selected === vehicle.id || (!selected && pathname === '/minha-conta' && !profile && vehicle === vehicles[0])
        return <Link key={vehicle.id} href={selectVehicleHref(vehicle.id)} className={`mw-vehicle ${active ? 'is-selected' : ''}`} aria-current={active ? 'true' : undefined} onClick={() => setDialog(null)}><span className="mw-vehicle-top"><VehicleThumbnail src={photo} /><span className="mw-vehicle-name"><strong>{vehicle.title || `${vehicle.brand} ${vehicle.model}`}</strong><small>{vehicle.brand} · {vehicle.year_model ?? vehicle.year ?? 'Ano não informado'}</small></span><ArrowUpRight size={13} /></span><span className="mw-vehicle-bottom"><span>{statusLabels[vehicle.status] ?? 'Em preparação'}</span><strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(vehicle.price)}</strong></span></Link>
      })}
    </div><Link href="/anunciar-carro" className="mw-sidebar-create"><Plus size={16} />Novo anúncio</Link>
  </>
  return <div className="member-shell mw-workspace">
    <a className="mw-skip" href="#member-content">Ir para o conteúdo</a>
    <aside className="mw-sidebar" aria-label="Navegação e veículos"><div className="mw-rail"><Link href="/" className="mw-brand" aria-label="Carbi — voltar para o site"><Car size={32} strokeWidth={1.5} /></Link><nav aria-label="Menu principal">{navigation.map(item => <Link key={item.href} href={item.href} aria-label={item.label} title={item.label} className={`mw-rail-link ${isActive(item.href) ? 'is-active' : ''}`} aria-current={isActive(item.href) ? 'page' : undefined}><item.icon size={19} strokeWidth={1.7} /></Link>)}</nav><div className="mw-rail-end"><button type="button" className="mw-rail-link" aria-label="Buscar na conta" title="Buscar na conta" onClick={() => setDialog('search')}><Search size={19} /></button><button type="button" className="mw-avatar-control" aria-label="Abrir opções da conta" onClick={() => setDialog('account')}><Avatar user={user} /></button></div></div><div className="mw-portfolio">{portfolio}</div></aside>
    <div className="mw-stage">
      <div className="mw-mobile-bar"><Link href="/" className="mw-mobile-brand">carbi.</Link><span>Minha conta</span><button type="button" aria-label="Abrir navegação e meus veículos" onClick={() => setDialog('menu')}><Menu size={21} /></button></div>
      <div className="mw-head">
      <header className="mw-profile-header"><Link href="/minha-conta?tab=perfil" className="mw-profile-photo" aria-label="Editar meu perfil"><Avatar user={user} /></Link><div className="mw-profile-copy"><h1>{user.fullName || 'Minha conta'}</h1><div className="mw-contact-details"><span>{user.email || 'Seu espaço na Carbi'}</span>{user.phone && <span>{user.phone}</span>}</div><div className="mw-quick-actions"><Link href="/anunciar-carro" aria-label="Criar anúncio" title="Criar anúncio"><Plus size={18} /></Link><Link href="/minha-conta/conversas" aria-label="Abrir conversas" title="Abrir conversas"><MessageCircle size={17} /></Link><Link href="/minha-conta/notificacoes" aria-label="Abrir notificações" title="Abrir notificações"><Bell size={17} /></Link><Link href="/minha-conta?tab=perfil" aria-label="Editar perfil" title="Editar perfil"><User size={17} /></Link><button type="button" aria-label="Buscar na minha conta" title="Buscar na minha conta (⌘K)" onClick={() => setDialog('search')}><Search size={17} /></button></div></div><button type="button" className="mw-account-switch" onClick={() => setDialog('account')}><Avatar user={user} /><span>Conta pessoal<strong>{user.fullName?.split(' ')[0] || 'Minha conta'}</strong></span><ChevronDown size={16} /></button></header>
      <nav className="mw-tabs" aria-label="Seções da conta">{tabs.map(tab => {
        const active = tab.href.includes('?') ? pathname === '/minha-conta' && profile : isActive(tab.href) && (tab.href !== '/minha-conta' || !profile)
        return <Link key={tab.href} href={tab.href} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>{tab.label}</Link>
      })}</nav>
      </div>
      <main id="member-content" className="mw-content" tabIndex={-1}>{children}</main>
    </div>
    <nav className="mw-mobile-nav" aria-label="Navegação móvel">{[...navigation.slice(0, 3), { href: '/minha-conta/buscas', label: 'Buscas', icon: Search }, { href: '/minha-conta?tab=perfil', label: 'Perfil', icon: User }].map(item => {
      const active = item.href.includes('?') ? pathname === '/minha-conta' && profile : isActive(item.href) && (item.href !== '/minha-conta' || !profile)
      return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}><item.icon size={20} /><span>{item.label === 'Visão geral' ? 'Resumo' : item.label === 'Meus anúncios' ? 'Anúncios' : item.label}</span></Link>
    })}</nav>
    <Dialog open={dialog !== null} onOpenChange={open => { if (!open) setDialog(null) }}><DialogContent className={`mw-dialog ${dialog === 'menu' ? 'mw-menu-dialog' : ''}`} showCloseButton={false}><DialogClose className="mw-dialog-close" aria-label="Fechar"><X size={19} /></DialogClose><DialogTitle>{dialog === 'search' ? 'Buscar na minha conta' : dialog === 'menu' ? 'Seu espaço Carbi' : 'Minha conta'}</DialogTitle><DialogDescription>{dialog === 'search' ? 'Encontre um veículo ou acesse uma seção.' : dialog === 'menu' ? 'Navegue pela conta e acompanhe seus veículos.' : 'Perfil, preferências e acesso ao site.'}</DialogDescription>
      {dialog === 'search' ? <><label className="mw-search-field"><Search size={18} /><input autoFocus type="search" placeholder="Veículo ou seção da conta" aria-label="Buscar veículo ou seção da conta" value={query} onChange={event => setQuery(event.target.value)} /></label><div className="mw-search-results">{navigation.filter(item => matches(item.label)).map(item => <Link href={item.href} key={item.href} onClick={() => setDialog(null)}><item.icon size={18} /><span>{item.label}</span><ArrowUpRight size={15} /></Link>)}{vehicles.filter(vehicle => matches(`${vehicle.title} ${vehicle.brand} ${vehicle.model}`)).map(vehicle => <Link key={vehicle.id} href={selectVehicleHref(vehicle.id)} onClick={() => setDialog(null)}><Car size={18} /><span>{vehicle.title || `${vehicle.brand} ${vehicle.model}`}</span><ArrowUpRight size={15} /></Link>)}{!navigation.some(item => matches(item.label)) && !vehicles.some(vehicle => matches(`${vehicle.title} ${vehicle.brand} ${vehicle.model}`)) && <p role="status">Nada encontrado. Tente outro nome ou modelo.</p>}</div></> : dialog === 'menu' ? <><nav className="mw-menu-links" aria-label="Seções">{navigation.map(item => <Link href={item.href} key={item.href} onClick={() => setDialog(null)}><item.icon size={18} />{item.label}</Link>)}</nav><div className="mw-menu-portfolio">{portfolio}</div></> : <div className="mw-account-menu"><Avatar user={user} /><p>{user.fullName || 'Minha conta'}<small>{user.email}</small></p><Link href="/minha-conta?tab=perfil" onClick={() => setDialog(null)}><User size={18} />Editar meu perfil</Link><Link href="/minha-conta/configuracoes" onClick={() => setDialog(null)}><Settings size={18} />Conta e segurança</Link><Link href="/contato" onClick={() => setDialog(null)}><MessageCircle size={18} />Falar com a Carbi</Link><Link href="/" onClick={() => setDialog(null)}><ArrowUpRight size={18} />Voltar para o site</Link><button type="button" disabled={loggingOut} onClick={logout}><LogOut size={18} />{loggingOut ? 'Saindo…' : 'Sair da conta'}</button>{logoutError && <p role="alert" className="mw-logout-error">{logoutError}</p>}</div>}
    </DialogContent></Dialog>
  </div>
}
export default function AccountLayout(props: AccountLayoutProps) {
  return <Suspense fallback={<div className="member-shell mw-workspace mw-initial-loading" role="status">Carregando sua conta…</div>}><Workspace {...props} /></Suspense>
}
