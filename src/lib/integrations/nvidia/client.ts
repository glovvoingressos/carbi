export async function analyzeCarImages(images: string[]) {
  const res = await fetch('/api/marketplace/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
  })
  if (!res.ok) throw new Error('Erro ao analisar imagens')
  return res.json()
}
