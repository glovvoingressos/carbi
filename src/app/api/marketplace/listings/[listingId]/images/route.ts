import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { LISTING_MAX_IMAGES, ListingImageInput } from '@/lib/marketplace'
import { sanitizeListingStorageImage } from '@/lib/license-plate-blur'

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
    const body = (await req.json()) as { images: ListingImageInput[] }
    const images = body.images || []

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 })
    }

    if (images.length > LISTING_MAX_IMAGES) {
      return NextResponse.json({ error: `Máximo de ${LISTING_MAX_IMAGES} imagens.` }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)

    const { data: listing, error: listingError } = await supabase
      .from('vehicle_listings')
      .select('id, user_id, vehicle_id')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
    }

    if (listing.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Sem permissão para alterar imagens deste anúncio.' }, { status: 403 })
    }

    const normalized = images.slice(0, LISTING_MAX_IMAGES).map((img, index) => ({
      listing_id: listingId,
      storage_path: img.storage_path,
      public_url: img.public_url,
      sort_order: index,
      is_primary: index === 0,
    }))

    for (const image of normalized) {
      try {
        await sanitizeListingStorageImage({
          supabase,
          storagePath: image.storage_path,
        })
      } catch (error) {
        console.warn('[marketplace] plate blur failed for', image.storage_path, error)
      }
    }

    const { data: oldImages } = await supabase
      .from('vehicle_listing_images')
      .select('storage_path')
      .eq('listing_id', listingId)

    const { error: deleteError } = await supabase.from('vehicle_listing_images').delete().eq('listing_id', listingId)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const { error: insertError } = await supabase.from('vehicle_listing_images').insert(normalized)
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    if (listing.vehicle_id) {
      const normalizedVehicleImages = images.slice(0, LISTING_MAX_IMAGES).map((img, index) => ({
        vehicle_id: listing.vehicle_id,
        storage_path: img.storage_path,
        public_url: img.public_url,
        sort_order: index,
        is_primary: index === 0,
      }))
      const { error: deleteVehicleImagesError } = await supabase
        .from('vehicle_images')
        .delete()
        .eq('vehicle_id', listing.vehicle_id)
      if (deleteVehicleImagesError) {
        return NextResponse.json({ error: deleteVehicleImagesError.message }, { status: 500 })
      }
      const { error: insertVehicleImagesError } = await supabase
        .from('vehicle_images')
        .insert(normalizedVehicleImages)
      if (insertVehicleImagesError) {
        return NextResponse.json({ error: insertVehicleImagesError.message }, { status: 500 })
      }
    }

    const oldStoragePaths = (oldImages || []).map((row) => row.storage_path).filter(Boolean)
    if (oldStoragePaths.length > 0) {
      await supabase.storage.from('vehicle-listings').remove(oldStoragePaths)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/marketplace/listings/[listingId]/images failed', error)
    return NextResponse.json({ error: 'Falha ao salvar imagens.' }, { status: 500 })
  }
}
