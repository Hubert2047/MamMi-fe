import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: false,
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
