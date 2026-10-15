/** @type {import('next').NextConfig} */
const supabaseImagePattern = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!value) return null

  try {
    const url = new URL(value)
    return {
      protocol: url.protocol.slice(0, -1),
      hostname: url.hostname,
      port: url.port,
      pathname: '/storage/v1/object/public/**',
    }
  } catch {
    return null
  }
})()

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cloudfront.alpes.one',
        pathname: '/public/**',
      },
      ...(supabaseImagePattern ? [supabaseImagePattern] : []),
    ],
  },
  output: 'standalone',
  async headers() {
    const publicImageCache = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'

    return [
      {
        source: '/assets/cars/:path*',
        headers: [{ key: 'Cache-Control', value: publicImageCache }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: publicImageCache }],
      },
    ]
  },
  async redirects() {
    return [
      // URL canônica de marca de caminhão é /caminhoes/marca-{slug} (mesmo padrão de /carros/marca-{slug})
      { source: '/caminhoes/marca/:brand', destination: '/caminhoes/marca-:brand', permanent: true },
      { source: '/caminhoes/marca', destination: '/caminhoes/marcas', permanent: true },
      { source: '/vender-carro-belo-horizonte', destination: '/vender-carro-bh', permanent: true },
      { source: '/anunciar-carro-bh', destination: '/vender-carro-bh', permanent: true },
      { source: '/carros/anunciar-gratis', destination: '/anunciar-carro', permanent: true },
      { source: '/carros/cidade-belo-horizonte', destination: '/carros-usados-bh', permanent: true },
      { source: '/trafego-pago-gratis', destination: '/anunciar-carro', permanent: true },
    ]
  },
}

module.exports = nextConfig
