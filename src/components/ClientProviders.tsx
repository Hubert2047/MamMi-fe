'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { SessionProvider } from 'next-auth/react'

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        <Toaster position="top-center" toastOptions={{ duration: 2000, className: "mx-auto max-w-xs" }} />
      </SessionProvider>
    </QueryClientProvider>
  )
}
