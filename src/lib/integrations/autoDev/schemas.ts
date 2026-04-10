import { z } from 'zod'

export const vehicleIdParamSchema = z.object({
  id: z.string().uuid('ID do veículo inválido.'),
})

export const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'VIN deve conter 17 caracteres válidos.')

export const decodeVinRequestSchema = z.object({
  vin: vinSchema,
})

export const syncAutoDevRequestSchema = z.object({
  vin: vinSchema.optional(),
  force: z.boolean().optional().default(false),
})
