import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import ClientProviders from '@/components/ClientProviders'
import AuthGate from '@/components/AuthGate'
import '@/index.css'

export const metadata: Metadata = { title: 'POS System', description: 'Point of sale management system' }

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions)
  return <html lang="vi"><body><ClientProviders session={session}><AuthGate>{children}</AuthGate></ClientProviders></body></html>
}
