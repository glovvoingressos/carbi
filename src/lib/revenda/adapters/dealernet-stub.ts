import type { VehicleImportAdapter, DealerCredentials, VehicleImportRow } from './types'

export class DealerNetAdapter implements VehicleImportAdapter {
  name = 'DealerNet'

  async fetchVehicles(_credentials: DealerCredentials): Promise<VehicleImportRow[]> {
    // Stub: implementar quando integrar com DealerNet API
    throw new Error('DealerNet integration not yet implemented')
  }
}
