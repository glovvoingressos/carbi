export type DescriptionParagraph = {
  text: string
  lines: string[]
}

export function parseDescription(value: string | null | undefined): DescriptionParagraph[] {
  if (!value) return []
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks = normalized.split(/\n{2,}/)
  return blocks
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return null
      const lines = trimmed.split('\n').map((line) => line.trimEnd())
      return { text: lines.join('\n'), lines }
    })
    .filter((block): block is DescriptionParagraph => block !== null)
}