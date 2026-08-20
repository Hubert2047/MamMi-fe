import type { Metadata } from 'next'
import ClientProviders from '@/components/ClientProviders'
import AuthGate from '@/components/AuthGate'
import '@/index.css'

export const metadata: Metadata = { title: 'POS System', description: 'Point of sale management system' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body><ClientProviders><AuthGate>{children}</AuthGate></ClientProviders></body></html>
}
