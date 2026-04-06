interface MetaTagsProps {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
}

export function generateMetadata({ title, description, image, url, type = 'website' }: MetaTagsProps) {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
