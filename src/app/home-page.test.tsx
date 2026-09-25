import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getLatestPublicListings } = vi.hoisted(() => ({
  getLatestPublicListings: vi.fn(),
}))

vi.mock('@/lib/marketplace-server', () => ({ getLatestPublicListings }))

import HomePage from './page'

type TestElement = ReactElement<{ children?: ReactNode; className?: string; href?: string }>

function findElement(node: ReactNode, predicate: (element: TestElement) => boolean): TestElement | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, predicate)
      if (found) return found
    }
    return null
  }

  if (!isValidElement(node)) return null
  const element = node as TestElement
  if (predicate(element)) return element

  return findElement(element.props.children, predicate)
}

describe('HomePage solutions cards', () => {
  beforeEach(() => {
    getLatestPublicListings.mockResolvedValue([])
  })

  it('keeps only FIPE comparison and free traffic cards in the solutions grid', async () => {
    const page = await HomePage()
    const grid = findElement(page, (element) =>
      typeof element.props.className === 'string' && element.props.className.startsWith('cb-build-grid '),
    )

    const children = grid?.props.children
    const cards = Array.isArray(children) ? children : [children]
    const destinations = cards
      .filter((card): card is TestElement => isValidElement(card))
      .map((card) => card.props.href)

    expect(destinations).toEqual(['/qual-carro', '/trafego-pago-gratis'])
  })
})
