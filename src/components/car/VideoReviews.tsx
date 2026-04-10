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
  watchUrl: string
  embedUrl: string
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
          ? {
              ...video,
              id,
              watchUrl: `https://www.youtube.com/watch?v=${id}`,
              embedUrl: `https://www.youtube.com/embed/${id}`,
            }
          : null
      })
      .filter((video): video is NormalizedVideoReview => video !== null)
      .filter((video, index, arr) => arr.findIndex((v) => v.id === video.id) === index)
  }, [model])

  return (
    <section className="mt-16 sm:mt-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF0000] rounded-xl flex items-center justify-center text-white shadow-[2px_2px_0_#000] border border-dark">
            <PlayCircle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic">
            Vez dos Experts
          </h2>
        </div>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-tertiary hover:text-dark transition-colors"
        >
          Ver mais no YouTube <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {videos.length === 0 ? (
        <div className="rounded-[24px] border-2 border-dark bg-white p-6 shadow-[6px_6px_0_#000]">
          <p className="text-sm font-bold text-dark mb-2">Não encontramos vídeos validados para este modelo.</p>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-tertiary hover:text-dark"
          >
            Abrir busca no YouTube <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.slice(0, 4).map((video) => (
            <div
              key={video.id}
              className="group relative bg-white border-2 border-dark rounded-[24px] overflow-hidden shadow-[6px_6px_0_#000] transition-transform hover:-translate-y-1"
            >
              <div className="aspect-video relative bg-dark/5 overflow-hidden">
                <a
                  href={video.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-dark border border-dark/20"
                  aria-label={`Assistir no YouTube: ${video.title}`}
                >
                  YouTube <ExternalLink className="h-3 w-3" />
                </a>
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-12 w-12 rounded-full bg-white/90 border border-dark flex items-center justify-center shadow-md">
                    <Play className="w-5 h-5 text-dark ml-0.5" />
                  </div>
                </div>
              </div>

              <a
                href={video.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4"
                aria-label={`Assistir no YouTube: ${video.title}`}
              >
                <h3 className="font-bold text-sm leading-tight mb-2 line-clamp-2 min-h-[40px]">
                  {video.title}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-dark/5 rounded-full flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 text-dark" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                    {video.channel}
                  </span>
                </div>
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
