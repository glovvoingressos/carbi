/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.100.6'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  output: 'standalone',
}

module.exports = nextConfig
