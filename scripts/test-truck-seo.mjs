#!/usr/bin/env node
import assert from 'node:assert/strict'
import { canonicalTruckBrand, truckCollectionJsonLd, serializeJsonLd, truckBrandSlug } from '../src/lib/truck-seo.ts'

assert.equal(truckBrandSlug('Mercedes-Benz'), 'mercedes-benz')
assert.equal(canonicalTruckBrand('mercedes-benz'), 'Mercedes-Benz')
assert.equal(canonicalTruckBrand('Mercedes-Benz'), 'Mercedes-Benz')
assert.equal(serializeJsonLd({ value: '<script>' }), '{"value":"\\u003cscript>"}')
assert.doesNotMatch(serializeJsonLd(truckCollectionJsonLd({ url: '/caminhoes', name: '</script>', listings: [] })), /<\//)
const categoryJsonLd = truckCollectionJsonLd({ url: '/caminhoes/categorias', name: '</script><script>', listings: [] })
assert.equal(JSON.parse(serializeJsonLd(categoryJsonLd)).url, '/caminhoes/categorias')
assert.doesNotMatch(serializeJsonLd(categoryJsonLd), /<\//)
console.log('truck SEO tests passed')
