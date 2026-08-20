'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'

export default function HomePage() {
  const router = useRouter()
  const { hydrated, isAuthenticated, user } = useAuth()
  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin'
  useEffect(() => { if (hydrated) router.replace(isAuthenticated ? (isAdmin ? '/admin' : '/pos') : '/login') }, [hydrated, isAuthenticated, isAdmin, router])
  return <div className="min-h-svh bg-background" />
}
