import { getCachedVehicleEnrichment } from '@/lib/integrations/autoDev/service'
import { VehicleEnrichment } from '@/lib/integrations/autoDev/types'

export async function getVehicleEnrichmentForPublic(vehicleId: string): Promise<{
  enrichment: VehicleEnrichment | null
  stale: boolean
  fetchStatus: string | null
}> {
  return getCachedVehicleEnrichment(vehicleId)
}
