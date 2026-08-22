'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import Loading from '@/components/Loading'

export default function AuthGate({ children }: { children: ReactNode }) {
  const { hydrated, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    if (pathname === '/pos' && !isAuthenticated) router.replace('/login')
  }, [hydrated, isAuthenticated, pathname, router])

  if (pathname === '/pos' && (!hydrated || !isAuthenticated)) {
    return <Loading />
  }

  return <>{children}</>
}
