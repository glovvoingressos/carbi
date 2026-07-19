import { getSupabaseAdminClient } from '@/lib/supabase-server'

interface CreateNotificationParams {
  userId: string
  type: string
  title: string
  body?: string
  link?: string
}

export async function createNotification(params: CreateNotificationParams) {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) return

  try {
    await adminClient.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body || null,
      link: params.link || null,
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}

export async function notifyNewMessage(params: {
  recipientUserId: string
  senderName: string
  vehicleTitle: string
  conversationId: string
}) {
  return createNotification({
    userId: params.recipientUserId,
    type: 'message',
    title: `${params.senderName} enviou uma mensagem`,
    body: `Sobre: ${params.vehicleTitle}`,
    link: `/minha-conta/conversas?conversation=${params.conversationId}`,
  })
}

export async function notifyListingPublished(params: {
  userId: string
  vehicleTitle: string
  listingSlug: string
}) {
  return createNotification({
    userId: params.userId,
    type: 'listing_published',
    title: 'Anúncio publicado',
    body: `${params.vehicleTitle} está no ar!`,
    link: `/anuncios/${params.listingSlug}`,
  })
}

export async function notifyListingRemoved(params: {
  userId: string
  vehicleTitle: string
}) {
  return createNotification({
    userId: params.userId,
    type: 'listing_removed',
    title: 'Anúncio removido',
    body: `${params.vehicleTitle} foi removido.`,
  })
}

export async function notifyOfferReceived(params: {
  sellerUserId: string
  buyerName: string
  vehicleTitle: string
  offerValue: number
  listingSlug: string
}) {
  const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.offerValue)
  return createNotification({
    userId: params.sellerUserId,
    type: 'offer',
    title: `${params.buyerName} fez uma oferta`,
    body: `${formatted} por ${params.vehicleTitle}`,
    link: `/anuncios/${params.listingSlug}`,
  })
}
