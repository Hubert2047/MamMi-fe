import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: false,
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  allowedDevOrigins: ['192.168.1.102'],
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
