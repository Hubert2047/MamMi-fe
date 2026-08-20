'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import { I18nProvider } from '@/lib/i18n'

export default function ClientProviders({ children, session }: { children: ReactNode; session?: Session | null }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session} refetchOnWindowFocus={false}>
        <I18nProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 2000, className: "mx-auto max-w-xs" }} />
        </I18nProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
