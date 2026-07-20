import { getSupabaseServerClient } from '@/lib/supabase-server'

export interface BulkUpdatePayload {
  listingIds: string[]
  updates: {
    price?: number
    city?: string
    state?: string
    description?: string
    status?: 'active' | 'paused' | 'sold'
  }
}

export async function bulkUpdateListings(userId: string, payload: BulkUpdatePayload): Promise<{ updated: number }> {
  const client = getSupabaseServerClient()
  
  // Verify ownership
  const { data: owned } = await client
    .from('vehicle_listings')
    .select('id')
    .in('id', payload.listingIds)
    .eq('user_id', userId)

  const ownedIds = (owned || []).map((r: any) => r.id)
  if (ownedIds.length === 0) return { updated: 0 }

  const { count } = await client
    .from('vehicle_listings')
    .update(payload.updates)
    .in('id', ownedIds)

  return { updated: count || 0 }
}

export async function bulkDeleteListings(userId: string, listingIds: string[]): Promise<{ deleted: number }> {
  const client = getSupabaseServerClient()
  
  const { data: owned } = await client
    .from('vehicle_listings')
    .select('id')
    .in('id', listingIds)
    .eq('user_id', userId)

  const ownedIds = (owned || []).map((r: any) => r.id)
  if (ownedIds.length === 0) return { deleted: 0 }

  const { count } = await client
    .from('vehicle_listings')
    .delete()
    .in('id', ownedIds)

  return { deleted: count || 0 }
}

export async function bulkRenewListings(userId: string, listingIds: string[]): Promise<{ renewed: number }> {
  const client = getSupabaseServerClient()
  
  const { data: owned } = await client
    .from('vehicle_listings')
    .select('id')
    .in('id', listingIds)
    .eq('user_id', userId)

  const ownedIds = (owned || []).map((r: any) => r.id)
  if (ownedIds.length === 0) return { renewed: 0 }

  const { count } = await client
    .from('vehicle_listings')
    .update({ created_at: new Date().toISOString() })
    .in('id', ownedIds)

  return { renewed: count || 0 }
}
