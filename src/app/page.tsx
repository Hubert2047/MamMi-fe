'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'

export default function HomePage() {
  const router = useRouter()
  const { hydrated, isAuthenticated } = useAuth()
  useEffect(() => { if (hydrated) router.replace(isAuthenticated ? '/pos' : '/login') }, [hydrated, isAuthenticated, router])
  return <div className="min-h-svh bg-background" />
}
