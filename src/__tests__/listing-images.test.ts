import { describe, expect, it } from 'vitest'

import { getObsoleteListingStoragePaths } from '../lib/listing-images'

describe('listing image storage cleanup', () => {
  it('keeps existing uploads that remain in the replacement payload', () => {
    const oldPaths = ['old-kept.jpg', 'old-removed.jpg']
    const replacementPaths = ['old-kept.jpg', 'new-upload-1.jpg', 'new-upload-2.jpg']

    expect(getObsoleteListingStoragePaths(oldPaths, replacementPaths)).toEqual(['old-removed.jpg'])
  })
})
