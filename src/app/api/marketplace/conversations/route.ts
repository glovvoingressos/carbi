import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(
        `
          id,
          listing_id,
          seller_user_id,
          buyer_user_id,
          last_message_at,
          last_message_preview,
          created_at,
          vehicle_listings!inner (
            id,
            slug,
            title,
            price,
            city,
            state,
            year,
            year_model,
            mileage,
            vehicle_listing_images (
              public_url,
              sort_order,
              is_primary
            )
          )
        `,
      )
      .or(`seller_user_id.eq.${auth.userId},buyer_user_id.eq.${auth.userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: reads } = await supabase
      .from('conversation_reads')
      .select('conversation_id,last_read_at')
      .eq('user_id', auth.userId)

    const readMap = new Map<string, string | null>((reads || []).map((r) => [r.conversation_id, r.last_read_at]))

    const response = (conversations || []).map((conv: any) => {
      const listing = conv.vehicle_listings
      const images = (listing?.vehicle_listing_images || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((img: any) => ({ url: img.public_url }))

      const lastReadAt = readMap.get(conv.id)
      const isUnread = !!conv.last_message_at && (!lastReadAt || new Date(conv.last_message_at) > new Date(lastReadAt))
      return {
        id: conv.id,
        listing_id: conv.listing_id,
        seller_user_id: conv.seller_user_id,
        buyer_user_id: conv.buyer_user_id,
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview,
        created_at: conv.created_at,
        vehicle_listings_public: {
          id: listing.id,
          slug: listing.slug,
          title: listing.title,
          price: listing.price,
          city: listing.city,
          state: listing.state,
          year: listing.year,
          year_model: listing.year_model,
          mileage: listing.mileage,
          images,
        },
        is_unread: isUnread,
        counterparty_role: conv.seller_user_id === auth.userId ? 'buyer' : 'seller',
      }
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET /api/marketplace/conversations failed', error)
    return NextResponse.json({ error: 'Falha ao carregar conversas.' }, { status: 500 })
  }
}
