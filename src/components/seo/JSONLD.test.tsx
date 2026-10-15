import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { VehicleSchema } from './JSONLD'

function getSchema(vehicle: Record<string, unknown>) {
  const element = VehicleSchema({ vehicle }) as ReactElement<{ data: Record<string, unknown> }>
  return element.props.data
}

describe('VehicleSchema', () => {
  it('omits blank descriptions and invalid model dates', () => {
    const schema = getSchema({
      brand: 'Test',
      model: 'Model',
      year_model: 2025,
      description: '   ',
      modelDate: '',
    })
    expect(schema.description).toBeUndefined()
    expect(schema.modelDate).toBeUndefined()
  })

  it('emits an offer only for a visible listing price', () => {
    const schema = getSchema({ brand: 'Test', model: 'Model', slug: 'test-model', price: null })
    expect(schema.offers).toBeUndefined()
  })
})
