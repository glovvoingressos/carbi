import { describe, expect, it } from 'vitest'

import {
  LISTING_DRAFT_VERSION,
  parseListingDraft,
  serializeListingDraft,
} from './listing-draft'

describe('listing draft persistence', () => {
  it('serializes and restores the form and navigation state with a version', () => {
    const serialized = serializeListingDraft({
      form: { brand: 'Chevrolet' },
      currentStep: 2,
      listingSubStep: 3,
    })

    const parsed = parseListingDraft<{ brand: string }>(serialized)

    expect(parsed).toMatchObject({
      version: LISTING_DRAFT_VERSION,
      form: { brand: 'Chevrolet' },
      currentStep: 2,
      listingSubStep: 3,
    })
    expect(parsed?.updatedAt).toEqual(expect.any(Number))
  })

  it('rejects malformed or old drafts instead of breaking the flow', () => {
    expect(parseListingDraft('{"form": {"brand": "Fiat"}}')).toBeNull()
    expect(parseListingDraft('not-json')).toBeNull()
  })
})
