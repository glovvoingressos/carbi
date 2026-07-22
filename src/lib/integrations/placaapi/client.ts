export async function lookupPlateClient(plate: string) {
  const res = await fetch(`/api/marketplace/placa?plate=${encodeURIComponent(plate)}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao consultar placa')
  }
  return res.json()
}
