export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface ImageSitemapEntry {
  path: string
  images: Array<{ url: string; sort_order: number }>
}

export function buildImageSitemapXml(entries: ImageSitemapEntry[], siteUrl: string): string {
  const urlEntries = entries
    .filter((entry) => entry.images.length > 0)
    .map((entry) => {
      const imageTags = [...entry.images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .slice(0, 5)
        .map((image) => `    <image:image>\n      <image:loc>${escapeXml(image.url)}</image:loc>\n    </image:image>`)
        .join('\n')

      return `  <url>\n    <loc>${escapeXml(`${siteUrl}${entry.path}`)}</loc>\n${imageTags}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urlEntries}\n</urlset>`
}

export const MAX_SITEMAP_URLS = 45_000

export function assertSitemapUrlLimit<T>(entries: T[], limit = MAX_SITEMAP_URLS): T[] {
  if (entries.length > limit) {
    throw new Error(`Sitemap contains ${entries.length} URLs; split it before serving more than ${limit} in one file.`)
  }
  return entries
}
