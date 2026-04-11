import { hatches } from './hatches'
import { suvs } from './suvs'
import { pickups } from './pickups'
import { sedans } from './sedans'
import { electric } from './electric'
import { marketExpansion } from './marketExpansion'
import { CarSpec } from './types'

export const cars: CarSpec[] = [
  ...hatches,
  ...suvs,
  ...pickups,
  ...sedans,
  ...electric,
  ...marketExpansion
]
