/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  output: 'standalone',
  async redirects() {
    return [
      // URL canônica de marca de caminhão é /caminhoes/marca-{slug} (mesmo padrão de /carros/marca-{slug})
      { source: '/caminhoes/marca/:brand', destination: '/caminhoes/marca-:brand', permanent: true },
      { source: '/caminhoes/marca', destination: '/caminhoes/marcas', permanent: true },
    ]
  },
}

module.exports = nextConfig
