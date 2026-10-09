import type { AccountWorkspaceListing } from '@/components/marketplace/AccountLayout'
import type { MemberConversation, MemberMetrics } from '@/components/marketplace/MemberOverview'

export type PreviewView = 'populated' | 'empty' | 'loading' | 'error'

/**
 * Dados de exemplo EXCLUSIVOS do preview de desenvolvimento.
 *
 * Nunca saem do bundle de produção (a rota responde 404 fora de dev) e não
 * entram em nenhuma página indexada: `/minha-conta/` já é disallow no robots
 * e está fora do sitemap. Existem só para eu conseguir ver os quatro estados
 * do painel sem precisar de uma sessão logada.
 */
export type PreviewUser = { email: string; fullName: string; avatarUrl: string; phone?: string }

export const previewUser: PreviewUser = {
  fullName: 'Marina Duarte',
  email: 'marina.duarte@example.test',
  phone: '(11) 98432-7719',
  avatarUrl: '',
}

const photos = {
  civic: '/images/porsche-hero.jpg',
  compass: '/images/defender-octa-tasman-blue.jpg',
  toro: '/images/caminhao-hero.jpg',
}

export const previewListings: AccountWorkspaceListing[] = [
  {
    id: 'veiculo-1',
    title: 'Honda Civic EXL 2020',
    brand: 'Honda',
    model: 'Civic',
    price: 118900,
    status: 'active',
    year: 2020,
    year_model: 2021,
    mileage: 42300,
    view_count: 348,
    // Mais recente que as conversas de propósito: o painel de atividade
    // retem 3 eventos, então sem um anúncio recente nunca aparecia a variante
    // "Anúncio criado" e eu não conseguia conferir o marcador lima dela.
    created_at: '2026-10-09T10:05:00.000Z',
    slug: 'honda-civic-exl-2020',
    images: [{ public_url: photos.civic, is_primary: true, sort_order: 0 }],
  },
  {
    id: 'veiculo-2',
    title: 'Jeep Compass Sport 2019',
    brand: 'Jeep',
    model: 'Compass',
    price: 132500,
    status: 'active',
    year: 2019,
    year_model: 2020,
    mileage: 68100,
    view_count: 210,
    created_at: '2026-09-14T09:40:00.000Z',
    slug: 'jeep-compass-sport-2019',
    images: [{ public_url: photos.compass, is_primary: true, sort_order: 0 }],
  },
  {
    id: 'veiculo-3',
    title: 'Fiat Toro Freedom 2018',
    brand: 'Fiat',
    model: 'Toro',
    price: 96900,
    status: 'paused',
    year: 2018,
    year_model: 2019,
    mileage: 91400,
    view_count: 77,
    created_at: '2026-08-30T18:12:00.000Z',
    slug: 'fiat-toro-freedom-2018',
    images: [{ public_url: photos.toro, is_primary: true, sort_order: 0 }],
  },
  {
    id: 'veiculo-4',
    title: 'Chevrolet Onix LT 2017',
    brand: 'CHEV',
    model: 'Onix',
    price: 62000,
    status: 'sold',
    year: 2017,
    year_model: 2018,
    mileage: 118900,
    view_count: 502,
    created_at: '2026-07-21T11:25:00.000Z',
    slug: 'chevrolet-onix-lt-2017',
    images: null,
  },
]

export const previewConversations: MemberConversation[] = [
  {
    id: 'conversa-1',
    listing_id: 'veiculo-1',
    is_unread: true,
    last_message_preview: 'Ainda aceita 114 mil? Consigo buscar o carro ainda essa semana.',
    last_message_at: '2026-10-08T21:14:00.000Z',
    created_at: '2026-10-06T15:02:00.000Z',
    vehicle_listings_public: { id: 'veiculo-1', title: 'Honda Civic EXL 2020', slug: 'honda-civic-exl-2020', images: [{ url: photos.civic }] },
  },
  {
    id: 'conversa-2',
    listing_id: 'veiculo-2',
    is_unread: false,
    last_message_preview: 'Perfeito, te aviso depois da vistoria.',
    last_message_at: '2026-10-07T13:48:00.000Z',
    created_at: '2026-10-05T10:30:00.000Z',
    vehicle_listings_public: { id: 'veiculo-2', title: 'Jeep Compass Sport 2019', slug: 'jeep-compass-sport-2019', images: [{ url: photos.compass }] },
  },
  {
    id: 'conversa-3',
    listing_id: 'veiculo-4',
    is_unread: false,
    last_message_preview: 'Obrigado pela negociação!',
    last_message_at: '2026-09-30T17:05:00.000Z',
    created_at: '2026-09-29T12:00:00.000Z',
    vehicle_listings_public: { id: 'veiculo-4', title: 'Chevrolet Onix LT 2017', slug: 'chevrolet-onix-lt-2017', images: null },
  },
]

export const previewMetrics: MemberMetrics = { totalListings: 4, totalViews: 1137, activeListings: 2 }

export const emptyListings: AccountWorkspaceListing[] = []
export const emptyConversations: MemberConversation[] = []
export const emptyMetrics: MemberMetrics = { totalListings: 0, totalViews: 0, activeListings: 0 }

export const messages = {
  listings: 'Não foi possível carregar seus anúncios.',
  conversations: 'Não foi possível carregar suas conversas.',
  metrics: 'Não foi possível carregar o desempenho dos anúncios.',
}
