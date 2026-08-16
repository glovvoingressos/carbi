import assert from 'node:assert/strict'
import { normalizeListingImages } from '../src/lib/listing-images.ts'

// View `vehicle_listings_public` exposes image objects with `url` key.
const viewShaped = [
  { id: 'a', url: 'https://cdn.example/a.jpg', sort_order: 0, is_primary: true },
  { id: 'b', url: 'https://cdn.example/b.jpg', sort_order: 1, is_primary: false },
]

// Direct table query exposes image objects with `public_url` key.
const tableShaped = [
  { id: 'c', public_url: 'https://cdn.example/c.jpg', sort_order: 0, is_primary: true },
]

assert.deepEqual(normalizeListingImages(viewShaped), [
  { id: 'a', url: 'https://cdn.example/a.jpg', sort_order: 0, is_primary: true },
  { id: 'b', url: 'https://cdn.example/b.jpg', sort_order: 1, is_primary: false },
])

assert.deepEqual(normalizeListingImages(tableShaped), [
  { id: 'c', url: 'https://cdn.example/c.jpg', sort_order: 0, is_primary: true },
])

assert.deepEqual(normalizeListingImages(null), [])
assert.deepEqual(normalizeListingImages(undefined), [])

console.log('PASS normalizeListingImages')