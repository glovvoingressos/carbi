'use server'

import { fetchPublicListingsPage, ListingsPageInput } from '@/lib/marketplace-server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function getFilteredListings(input: ListingsPageInput) {
  return fetchPublicListingsPage(input)
}

export async function getModelsByBrands(brands: string[]) {
  if (brands.length === 0) return []
  const { data } = await getSupabaseServerClient()
    .from('vehicle_listings')
    .select('model')
    .in('brand', brands)
    .eq('status', 'active')
  
  return [...new Set(data?.map(i => i.model).filter(Boolean))].sort() as string[]
}
