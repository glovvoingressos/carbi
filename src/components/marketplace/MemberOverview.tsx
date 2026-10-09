'use client'

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Car, Check, Eye, MessageCircle, Plus, RotateCcw } from 'lucide-react'
import type { AccountWorkspaceListing } from './AccountLayout'
import { LISTING_STATUS_LABELS as statusLabels } from './listing-status'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/data/cars'
import './member-overview.css'

export interface MemberConversation {
  id: string
  listing_id: string
  is_unread: boolean
  last_message_preview: string | null
  last_message_at: string | null
  created_at: string
  vehicle_listings_public: {
    id: string
    title: string
    slug: string
    images?: { url: string }[] | null
  } | null
}

export interface MemberMetrics {
  totalListings: number | null
  totalViews: number | null
  activeListings: number | null
}

type SourceState = { loading: boolean; error: string | null }
interface MemberOverviewProps {
  listings: AccountWorkspaceListing[]
  conversations: MemberConversation[]
  metrics: MemberMetrics
  selectedVehicleId: string | null
  listingState: SourceState
  conversationState: SourceState
  metricState: SourceState
  onRetry: () => void
}

const numberFormat = new Intl.NumberFormat('pt-BR')
const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

function DateLabel({ value }: { value: string | null }) {
  if (!value || Number.isNaN(Date.parse(value))) return null
  return <time dateTime={value} title={new Date(value).toLocaleString('pt-BR')}>{dateFormat.format(new Date(value))}</time>
}

function VehiclePhoto({ src, title }: { src?: string; title: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  return (
    <span className="member-overview-photo">
      {src && failedSource !== src ? (
        <img src={src} alt={title} loading="lazy" decoding="async" onError={() => setFailedSource(src)} />
      ) : <Car aria-hidden="true" size={20} strokeWidth={1.6} />}
    </span>
  )
}

function Retry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="member-overview-error" role="alert">
      <p>{message}</p>
      <Button variant="ghost" onClick={onRetry} className="member-overview-retry">
        <RotateCcw aria-hidden="true" size={14} /> Tentar novamente
      </Button>
    </div>
  )
}

function LoadingRows({ label }: { label: string }) {
  return (
    <div className="member-overview-loading" role="status" aria-label={label}>
      {[0, 1, 2].map((row) => <div className="member-overview-skeleton" key={row}><span /><span /></div>)}
    </div>
  )
}

export default function MemberOverview({ listings, conversations, metrics, selectedVehicleId, listingState, conversationState, metricState, onRetry }: MemberOverviewProps) {
  const listingsReady = !listingState.loading && !listingState.error
  const conversationsReady = !conversationState.loading && !conversationState.error
  const metricsReady = !metricState.loading && !metricState.error
  const selectedListing = listingsReady ? selectedVehicleId ? listings.find((listing) => listing.id === selectedVehicleId) : listings[0] : undefined
  const selectionMissing = Boolean(selectedVehicleId && listingsReady && !selectedListing)
  const visibleListings = selectedVehicleId ? listings.filter((listing) => listing.id === selectedVehicleId) : listings
  const visibleConversations = selectedVehicleId ? conversations.filter((conversation) => conversation.listing_id === selectedVehicleId) : conversations
  const unread = visibleConversations.filter((conversation) => conversation.is_unread).length
  const sortedConversations = [...visibleConversations].sort((a, b) =>
    (Date.parse(b.last_message_at || b.created_at) || 0) - (Date.parse(a.last_message_at || a.created_at) || 0))
  const activity = [
    ...(listingsReady ? visibleListings.map((listing) => ({
      id: `listing-${listing.id}`, type: 'listing' as const, at: listing.created_at,
      title: 'Anúncio criado', detail: listing.title, status: statusLabels[listing.status] || 'Status indisponível',
      href: `/minha-conta/anuncios?vehicle=${encodeURIComponent(listing.id)}`,
    })) : []),
    ...(conversationsReady ? visibleConversations.filter((conversation) => conversation.last_message_at).map((conversation) => ({
      id: `conversation-${conversation.id}`, type: 'conversation' as const, at: conversation.last_message_at!,
      title: 'Mensagem na conversa', detail: conversation.vehicle_listings_public?.title || 'Conversa sobre um veículo',
      status: conversation.is_unread ? 'Não lida' : 'Lida',
      href: `/minha-conta/conversas?conversation=${encodeURIComponent(conversation.id)}`,
    })) : []),
  ].sort((a, b) => (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0)).slice(0, 3)

  return (
    <div className="member-overview">
      <div className="member-overview-main">
        {selectedVehicleId && selectedListing && <div className="member-overview-context"><span>Atividade de <strong>{selectedListing.title}</strong></span><Link href="/minha-conta">Ver toda a conta</Link></div>}
        {selectionMissing && <div className="member-overview-context" role="status"><span>Este veículo não está disponível na sua carteira.</span><Link href="/minha-conta">Ver toda a conta</Link></div>}
        <section className="member-overview-panel" aria-labelledby="member-activity-heading">
          <header className="member-overview-panel-heading">
            <h2 id="member-activity-heading">Atividade recente</h2>
            <Link className="member-overview-icon-link" href="/minha-conta/anuncios" aria-label="Gerenciar anúncios"><ArrowUpRight size={17} aria-hidden="true" /></Link>
          </header>
          {listingState.error && <Retry message={listingState.error} onRetry={onRetry} />}
          {conversationState.error && <p className="member-overview-source-note">A atividade das conversas está indisponível.</p>}
          {activity.length > 0 ? (
            <ol className="member-overview-timeline">
              {activity.map((event) => (
                <li key={event.id}>
                  <div className={`member-overview-event-icon member-overview-event-icon--${event.type}`} aria-hidden="true">{event.type === 'listing' ? <Car size={16} strokeWidth={1.6} /> : <MessageCircle size={16} strokeWidth={1.6} />}</div>
                  <Link className="member-overview-event" href={event.href}>
                    <div><h3>{event.title}</h3><p>{event.detail}</p></div>
                    <div className="member-overview-event-meta"><DateLabel value={event.at} /><span className="member-overview-status">{event.status}</span></div>
                    <ArrowUpRight className="member-overview-row-arrow" size={15} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          ) : listingState.loading || conversationState.loading ? <LoadingRows label="Carregando atividade" /> : !listingState.error && !conversationState.error ? (
            <div className="member-overview-empty">
              <Car size={25} strokeWidth={1.5} aria-hidden="true" />
              <h3>{selectedVehicleId ? 'Sem atividade para este veículo' : 'Sua atividade começa aqui'}</h3>
              <p>{selectedVehicleId ? 'As mensagens e a criação do anúncio aparecem neste espaço.' : 'Anúncios criados e mensagens recentes aparecem aqui para você acompanhar.'}</p>
              <Link className="member-overview-text-link" href={selectedVehicleId ? '/minha-conta/anuncios' : '/anunciar-carro'}>{selectedVehicleId ? 'Gerenciar anúncios' : 'Criar meu primeiro anúncio'}<ArrowUpRight size={15} aria-hidden="true" /></Link>
            </div>
          ) : null}
        </section>

        <section className="member-overview-panel member-overview-conversations" aria-labelledby="member-conversations-heading">
          <header className="member-overview-panel-heading">
            <div><h2 id="member-conversations-heading">Conversas recentes</h2>{conversationsReady && <p>{unread > 0 ? `${numberFormat.format(unread)} ${unread === 1 ? 'conversa não lida' : 'conversas não lidas'}` : 'Você está em dia com as conversas.'}</p>}</div>
            <Link className="member-overview-icon-link" href="/minha-conta/conversas" aria-label="Ver todas as conversas"><ArrowUpRight size={17} aria-hidden="true" /></Link>
          </header>
          {conversationState.loading ? <LoadingRows label="Carregando conversas" /> : conversationState.error ? <Retry message={conversationState.error} onRetry={onRetry} /> : sortedConversations.length > 0 ? (
            <ul className="member-overview-conversation-list">
              {sortedConversations.slice(0, 3).map((conversation) => (
                <li key={conversation.id}>
                  <Link className="member-overview-conversation" href={`/minha-conta/conversas?conversation=${encodeURIComponent(conversation.id)}`}>
                    <VehiclePhoto src={conversation.vehicle_listings_public?.images?.[0]?.url} title={conversation.vehicle_listings_public?.title || 'Veículo da conversa'} />
                    <div className="member-overview-conversation-copy"><h3>{conversation.vehicle_listings_public?.title || 'Conversa sobre um veículo'}</h3><p>{conversation.last_message_preview || 'Abra a conversa para enviar uma mensagem.'}</p></div>
                    <div className="member-overview-conversation-meta"><DateLabel value={conversation.last_message_at} />{conversation.is_unread && <span className="member-overview-unread">Não lida</span>}</div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="member-overview-empty">
              <MessageCircle size={25} strokeWidth={1.5} aria-hidden="true" />
              <h3>{selectedVehicleId ? 'Nenhuma conversa sobre este veículo' : 'Ainda sem conversas'}</h3>
              <p>{selectedVehicleId ? 'Os contatos sobre este anúncio aparecerão aqui.' : 'Quando você entrar em contato sobre um veículo ou receber uma mensagem, a conversa aparecerá aqui.'}</p>
              <Link className="member-overview-text-link" href="/carros-a-venda">Explorar veículos<ArrowUpRight size={15} aria-hidden="true" /></Link>
            </div>
          )}
          {conversationsReady && sortedConversations.length > 0 && <Link href="/minha-conta/conversas" className="member-overview-footer-link">Abrir minhas conversas<ArrowUpRight size={15} aria-hidden="true" /></Link>}
        </section>
      </div>

      <aside className="member-overview-aside" aria-label="Desempenho e próxima ação">
        <section className="member-overview-performance" aria-labelledby="member-performance-heading" aria-busy={metricState.loading}>
          <header className="member-overview-panel-heading"><h2 id="member-performance-heading">Desempenho</h2><Eye size={18} strokeWidth={1.6} aria-hidden="true" /></header>
          <p className="member-overview-performance-description">Todos os seus anúncios</p>
          <dl className="member-overview-metrics">
            <div><dt>Visualizações</dt><dd aria-label={metricsReady && metrics.totalViews !== null ? undefined : 'Visualizações indisponíveis'}>{metricsReady && metrics.totalViews !== null ? numberFormat.format(metrics.totalViews) : '—'}</dd></div>
            <div><dt>Anúncios ativos</dt><dd aria-label={metricsReady && metrics.activeListings !== null ? undefined : 'Anúncios ativos indisponíveis'}>{metricsReady && metrics.activeListings !== null ? numberFormat.format(metrics.activeListings) : '—'}</dd></div>
          </dl>
          {metricState.loading && <p className="member-overview-source-note" role="status">Carregando desempenho…</p>}
          {metricState.error && <Retry message={metricState.error} onRetry={onRetry} />}
          <div className="member-overview-selected-vehicle">
            {listingState.loading ? <p role="status">Carregando veículo…</p> : listingState.error ? <p>O resumo do veículo está indisponível.</p> : selectedListing ? (
              <><div className="member-overview-selected-title"><VehiclePhoto src={selectedListing.images?.[0]?.public_url} title={selectedListing.title} /><h3>{selectedListing.title}</h3></div><p>Preço anunciado</p><strong className="member-overview-price">{formatBRL(selectedListing.price)}</strong><span className="member-overview-selected-status"><Check size={13} aria-hidden="true" />{statusLabels[selectedListing.status] || 'Status indisponível'}</span></>
            ) : <p>{selectionMissing ? 'Escolha outro veículo na carteira para ver o preço anunciado.' : listings.length > 0 ? 'Selecione um veículo na carteira para consultar o preço anunciado.' : 'O desempenho dos seus veículos aparecerá aqui após criar um anúncio.'}</p>}
          </div>
          <Link className="member-overview-text-link" href="/minha-conta/anuncios">Gerenciar anúncios<ArrowUpRight size={15} aria-hidden="true" /></Link>
        </section>

        <section className="member-overview-next-action" aria-labelledby="member-next-action-heading">
          <header className="member-overview-panel-heading"><h2 id="member-next-action-heading">Próximo passo</h2><Plus size={18} strokeWidth={1.6} aria-hidden="true" /></header>
          <h3>{listingsReady && listings.length === 0 ? 'Seu primeiro anúncio' : 'Anuncie seu carro'}</h3>
          <p>Adicione fotos, detalhes e o preço do veículo para começar.</p>
          <Link href="/anunciar-carro" className="member-overview-publish">Criar anúncio<span><ArrowUpRight size={17} aria-hidden="true" /></span></Link>
        </section>
      </aside>
    </div>
  )
}
