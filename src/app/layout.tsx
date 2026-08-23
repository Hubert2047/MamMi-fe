import type { Metadata, Viewport } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import ClientProviders from '@/components/ClientProviders'
import AuthGate from '@/components/AuthGate'
import '@/index.css'

export const metadata: Metadata = {
  title: 'Mâm Mì POS',
  description: 'Point of sale management system',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'MÃ¢m MÃ¬ POS',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions)
  return <html lang="vi"><body><ClientProviders session={session}><AuthGate>{children}</AuthGate></ClientProviders></body></html>
}
