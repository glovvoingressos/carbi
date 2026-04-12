import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { sanitizeListingStorageImage } from '@/lib/license-plate-blur'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { listingId } = await params
    const supabase = getSupabaseServerClient(auth.accessToken)

    const { data: listing, error: listingError } = await supabase
      .from('vehicle_listings')
      .select('id, user_id, title, vehicle_id')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
    }

    if (listing.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Sem permissão para alterar este anúncio.' }, { status: 403 })
    }

    const { data: images, error: imagesError } = await supabase
      .from('vehicle_listing_images')
      .select('id, storage_path, public_url')
      .eq('listing_id', listingId)
      .order('sort_order', { ascending: true })

    if (imagesError) {
      return NextResponse.json({ error: imagesError.message }, { status: 500 })
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'Esse anúncio ainda não tem fotos.' }, { status: 400 })
    }

    let processed = 0
    let blurred = 0
    let skipped = 0
    const touchedImageIds: string[] = []
    const cacheVersion = Date.now()

    for (const image of images) {
      try {
        const result = await sanitizeListingStorageImage({
          supabase,
          storagePath: image.storage_path,
        })
        processed += 1
        if (result.blurred) {
          blurred += 1
          touchedImageIds.push(image.id)
        } else {
          skipped += 1
        }
      } catch (error) {
        console.warn('[marketplace] blur-plates failed', image.storage_path, error)
        skipped += 1
      }
    }

    if (touchedImageIds.length > 0) {
      for (const image of images.filter((item) => touchedImageIds.includes(item.id))) {
        const nextUrl = image.public_url.includes('?')
          ? `${image.public_url.split('?')[0]}?v=${cacheVersion}`
          : `${image.public_url}?v=${cacheVersion}`

        await supabase
          .from('vehicle_listing_images')
          .update({ public_url: nextUrl })
          .eq('id', image.id)

        if (listing.vehicle_id) {
          const { error: vehicleImagesUpdateError } = await supabase
            .from('vehicle_images')
            .update({ public_url: nextUrl })
            .eq('vehicle_id', listing.vehicle_id)
            .eq('storage_path', image.storage_path)

          if (vehicleImagesUpdateError) {
            console.warn('[marketplace] blur-plates vehicle_images sync skipped', {
              listingId,
              vehicleId: listing.vehicle_id,
              storagePath: image.storage_path,
              error: vehicleImagesUpdateError.message,
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        listingId,
        title: listing.title,
        processed,
        blurred,
        skipped,
      },
    })
  } catch (error) {
    console.error('POST /api/marketplace/listings/[listingId]/blur-plates failed', error)
    return NextResponse.json({ error: 'Falha ao borrar placas.' }, { status: 500 })
  }
}
