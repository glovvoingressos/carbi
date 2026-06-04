'use client'

import React, { useMemo } from 'react'
import { PlayCircle, Play, ExternalLink } from 'lucide-react'

interface VideoReview {
  url: string
  title: string
  channel: string
}

interface NormalizedVideoReview extends VideoReview {
  id: string
  embedUrl: string
  watchUrl: string
}

interface VideoReviewsProps {
  brand: string
  model: string
  year: number
}

const VIDEO_MAP: Record<string, VideoReview[]> = {
  polo: [
    { url: 'https://www.youtube.com/watch?v=9_vI0P06iEw', title: 'VW Polo Highline: avaliação completa', channel: 'AutoEsporte' },
    { url: 'https://www.youtube.com/watch?v=5P6p087t_A0', title: 'Polo TSI no uso real', channel: 'Carro Chefe' },
  ],
  onix: [
    { url: 'https://www.youtube.com/watch?v=QhJxQx6QXc8', title: 'Chevrolet Onix: prós e contras', channel: 'Opinião Sincera' },
  ],
  hb20: [
    { url: 'https://www.youtube.com/watch?v=NBI7gBfC8tc', title: 'Hyundai HB20: teste completo', channel: 'Mobiauto' },
  ],
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractYoutubeId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '')
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v')
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
      const embedMatch = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
      if (embedMatch) return embedMatch[1]
    }
  } catch {
    return null
  }
  return null
}

export default function VideoReviews({ brand, model, year }: VideoReviewsProps) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${brand} ${model} ${year} avaliação`)}`

  const videos = useMemo<NormalizedVideoReview[]>(() => {
    const modelKey = normalize(model).split(' ')[0]
    const source = VIDEO_MAP[modelKey] || []

    return source
      .map((video) => {
        const id = extractYoutubeId(video.url)
        return id
          ? { ...video, id, embedUrl: `https://www.youtube.com/embed/${id}`, watchUrl: `https://www.youtube.com/watch?v=${id}` }
          : null
      })
      .filter((video): video is NormalizedVideoReview => video !== null)
      .filter((video, index, arr) => arr.findIndex((v) => v.id === video.id) === index)
  }, [model])

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF0000] rounded-xl flex items-center justify-center text-white">
            <PlayCircle className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h2 className="text-balance">Vez dos experts</h2>
        </div>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-[#525252] hover:text-[#0A0A0A] transition-colors"
        >
          Ver mais no YouTube <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
        </a>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white border border-[#EAEAE8] rounded-2xl p-6">
          <p className="text-[14px] text-[#0A0A0A] mb-2">Não encontramos vídeos validados para este modelo.</p>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] text-[#0A0A0A] hover:opacity-70"
          >
            Abrir busca no YouTube <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {videos.slice(0, 4).map((video) => (
            <div key={video.id} className="bg-white border border-[#EAEAE8] rounded-2xl overflow-hidden">
              <div className="aspect-video relative bg-[#FAFAF9] overflow-hidden">
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>

              <a
                href={video.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4"
                aria-label={`Assistir no YouTube: ${video.title}`}
              >
                <h3 className="text-[14px] font-semibold text-[#0A0A0A] leading-tight mb-2 line-clamp-2 min-h-[40px] tracking-tight">
                  {video.title}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#FAFAF9] rounded-full flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 text-[#0A0A0A]" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] text-[#A3A3A3] tracking-tight">{video.channel}</span>
                </div>
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
