import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const stylesheet = readFileSync(new URL('../globals.css', import.meta.url), 'utf8')

describe('car listings filter scrolling', () => {
  it('keeps the desktop filter sidebar above the listing cards', () => {
    const sidebarRule = stylesheet.match(/\.cbi-side\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(sidebarRule).toMatch(/position:\s*sticky/)
    expect(sidebarRule).toMatch(/z-index:\s*[1-9]\d*/)
  })

  it('lets the filter sidebar scroll naturally below the desktop breakpoint', () => {
    const mobileRule = stylesheet.match(/@media\s*\(max-width:\s*980px\)\s*\{[^}]*\.cbi-side\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(mobileRule).toMatch(/position:\s*static/)
  })
})
