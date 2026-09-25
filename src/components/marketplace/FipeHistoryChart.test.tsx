// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FipeHistoryChart from './FipeHistoryChart'

describe('FipeHistoryChart loading state', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the history card title while the FIPE request is pending', () => {
    const fetchMock = vi.fn(() => new Promise(() => {}))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <FipeHistoryChart
        listingId="listing-1"
        brand="Chevrolet"
        model="Tracker"
        version="LT"
        year={2018}
        currentFipePrice={null}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Histórico FIPE' })).toBeTruthy()
    expect(screen.getByText('Carregando histórico FIPE…')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith('/api/fipe/history?listingId=listing-1')
  })

  it('labels the saved plate lookup price honestly when monthly history is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'x-fipe-history-source': 'current-snapshot' }),
      json: async () => [{ month: 'setembro/2026', price: 'R$ 38.950', priceNum: 38950 }],
    }))

    render(
      <FipeHistoryChart
        listingId="listing-1"
        brand="Fiat"
        model="Bravo"
        year={2013}
      />,
    )

    expect(await screen.findByText('último valor salvo')).toBeTruthy()
    expect(screen.getByText(/A FIPE não disponibilizou a série histórica agora/)).toBeTruthy()
  })
})
